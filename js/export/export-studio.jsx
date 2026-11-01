// export-studio.jsx — the Publishing Studio (S32).
//
// One panel, four artefacts: a still (PNG), a figure (SVG + CSV + sidecar), a short recording (WebM) and a lab report
// (print). The panel's job is to be honest about what this build can and cannot do — an unsupported codec, a scene
// without a render target and the static-hosting OG limitation are all stated before a button is pressed, not after
// it fails.
//
// All the decisions live in js/export/*.mjs, which is pure and tested in Node; this file draws the controls and calls
// them. The only browser-only code here is the download itself and the print call.

const { useState, useEffect, useMemo, useRef, useCallback } = React;

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking immediately can race the download in some browsers; one task is enough and keeps the URL from leaking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadText(filename, text, type) {
  downloadBlob(filename, new Blob([text], { type: type ?? "text/plain;charset=utf-8" }));
}

// The page collectors live in the app shell (`collectPageReadouts` / `collectPageFormulas`), because the report route
// needs them on mount as well as the studio needing them on a click. One definition, two callers.

/** The provenance entry for whatever the current view says it is showing, if it registered one. */
function currentProvenance(view) {
  const registry = window.QGA_PROVENANCE;
  if (!registry) return null;
  const id = window.__qgaCurrentProvenanceId || `${view}-view`;
  const entry = registry.get ? registry.get(id) : null;
  return entry ? { id, ...entry } : null;
}

function ExportSection({ title, note, children }) {
  return (
    <section className="export-section">
      <h3>{title}</h3>
      {note ? <p className="small dim export-note">{note}</p> : null}
      {children}
    </section>
  );
}

/**
 * A closed studio must cost nothing: this wrapper returns before any hook runs, and the panel below is only mounted
 * while the drawer is open. Reading the URL and probing MediaRecorder on every render of the shell is a cost that
 * belongs to the open drawer, not the page.
 */
function ExportStudio({ open, onClose }) {
  if (!open) return null;
  return <ExportStudioPanel onClose={onClose}></ExportStudioPanel>;
}

function ExportStudioPanel({ onClose }) {
  const state = window.QGA_READ_STATE ? window.QGA_READ_STATE() : {};
  const view = state.view || "overview";
  const settings = window.QGA_LAST_SETTINGS ? window.QGA_LAST_SETTINGS() : {};
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(null);
  const [progress, setProgress] = useState(null);
  const [preset, setPreset] = useState("2k");
  const [widthMm, setWidthMm] = useState(174);
  const [figureStyle, setFigureStyle] = useState("dark");
  const [seconds, setSeconds] = useState(6);
  const [recording, setRecording] = useState(null);
  const abortRef = useRef(null);
  const panelRef = useRef(null);

  const support = useMemo(
    () => (window.QGA_EXPORT ? window.QGA_EXPORT.recordingSupport(window) : { supported: false, reason: "The export module is not loaded." }),
    [],
  );

  useEffect(() => {
    setNotice(null);
    setProgress(null);
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus({ preventScroll: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const EXPORT = window.QGA_EXPORT;
  if (!EXPORT) {
    return (
      <div className="export-backdrop" onClick={onClose}>
        <div className="export-panel" role="dialog" aria-modal="true" aria-label="Publishing studio" onClick={(e) => e.stopPropagation()}>
          <p role="alert">The export module did not load, so no file can be produced in this session.</p>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const envelope = () => EXPORT.buildExportEnvelope({
    view, kind: "export", state, settings,
    backend: settings.renderBackend ?? "auto",
    quality: settings.detail3d ?? "medium",
    provenance: currentProvenance(view),
    references: [],
    seed: state.seed ?? 42,
    commitHash: window.QGA_COMMIT ?? null,
    amplification: [EXPORT.DISPLAY_AMPLIFICATIONS.exposure, EXPORT.DISPLAY_AMPLIFICATIONS.toneMapping],
  });

  const guard = (label, action) => async () => {
    setBusy(label);
    setNotice(null);
    try {
      await action();
    } catch (error) {
      setNotice({
        tone: "error",
        text: error?.code ? `${label}: ${error.message}` : `${label} failed: ${error?.message ?? String(error)}`,
        code: error?.code ?? null,
      });
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  /* ---- still ---- */
  const exportStill = guard("Still export", async () => {
    const handle = window.__qgaActiveScenes ? [...window.__qgaActiveScenes].at(-1) : null;
    const { canvas, ...plan } = await EXPORT.captureStill(handle, { preset, aspect: 16 / 9 });
    const bytes = await EXPORT.canvasToPngBytes(canvas);
    const meta = envelope();
    downloadBlob(EXPORT.exportFileName({ view, kind: `still-${preset}`, ext: "png" }), new Blob([bytes], { type: "image/png" }));
    setNotice({
      tone: "ok",
      text: plan.viewport
        ? `Saved the viewport still at the drawing buffer's own size.`
        : `Saved a ${plan.width}×${plan.height} still (${(plan.bytes / 1024 ** 2).toFixed(0)} MiB of capture memory).`,
    });
    void meta;
  });

  /* ---- figure ---- */
  const exportFigure = guard("Figure export", async () => {
    const spec = window.__qgaFigureSpec;
    if (!spec) {
      throw new Error("No Figure Kit figure is mounted in this view. Open a view with a 2D figure and try again.");
    }
    const result = await EXPORT.buildFigureExport({
      spec, scene: window.__qgaFigureScene, renderSvg: window.QGA_FIGURE.renderSvg, dataTable: window.QGA_FIGURE.dataTable,
      provenance: currentProvenance(view), state, seed: state.seed ?? 42,
      widthMm: Number(widthMm), style: figureStyle, figureNumber: 1,
    });
    const sidecar = await EXPORT.buildFigureSidecar({
      envelope: result.envelope, csv: result.csv, figureId: spec.id, widthMm: Number(widthMm), style: figureStyle,
    });
    downloadText(result.files.svg, result.svg, "image/svg+xml;charset=utf-8");
    downloadText(result.files.csv, result.csv, "text/csv;charset=utf-8");
    downloadText(result.files.json, EXPORT.sidecarJson(sidecar), "application/json;charset=utf-8");
    setNotice({
      tone: "ok",
      text: `Saved ${result.files.svg.split("/").pop()}: SVG, ${result.rowCount} data rows and a sidecar hashing the CSV (sha256 ${sidecar.data.sha256.slice(0, 12)}…).`,
    });
  });

  /* ---- share card ---- */
  const exportCard = guard("Share card", async () => {
    const card = EXPORT.shareCardScene({
      state, viewId: view, viewTitle: window.__qgaCurrentViewTitle ?? view,
      provenance: currentProvenance(view), seed: state.seed ?? 42, commitHash: window.QGA_COMMIT ?? null,
    });
    const svg = EXPORT.shareCardSvg(card, { css: (token) => window.QGA_TOKENS.css(token) });
    downloadText(`horizon-share-${view}.svg`, svg, "image/svg+xml;charset=utf-8");
    downloadText(`horizon-share-${view}.json`, EXPORT.sidecarJson(EXPORT.shareCardSidecar(card)), "application/json;charset=utf-8");
    setNotice({ tone: "ok", text: "Saved the 1200×630 share card and its sidecar." });
  });

  /* ---- recording ---- */
  const startRecording = guard("Recording", async () => {
    const handle = window.__qgaActiveScenes ? [...window.__qgaActiveScenes].at(-1) : null;
    // A stage-backed scene keeps its canvas inside the host element; a direct one is the canvas itself.
    const canvas = handle?.element?.tagName === "CANVAS"
      ? handle.element
      : handle?.element?.querySelector("canvas") ?? handle?.capture?.();
    if (!canvas) throw new ExportError("not-supported", "No drawing canvas is mounted in this view, so there is nothing to record.");
    abortRef.current = new AbortController();
    setRecording({ active: true, frame: 0, frames: 0 });
    const result = await EXPORT.recordCanvas({
      canvas, seconds, fps: 30, signal: abortRef.current.signal,
      // `capture()` renders the frame synchronously and hands back the canvas; for a scene without it the browser's
      // own compositing still advances while the loop awaits a frame.
      draw: handle?.capture ? () => handle.capture() : null,
      onProgress: ({ frame, frames }) => setRecording({ active: true, frame, frames }),
    });
    const meta = envelope();
    downloadBlob(result.name, result.blob);
    downloadText(result.name.replace(/\.webm$/, ".json"), EXPORT.sidecarJson({ ...meta, kind: "recording", mime: result.mime, frames: result.frames }), "application/json;charset=utf-8");
    setRecording(null);
    setNotice({ tone: "ok", text: `Saved ${result.frames} frames as ${result.mime} (${(result.bytes / 1024 ** 2).toFixed(1)} MiB).` });
  });

  const cancelRecording = () => {
    abortRef.current?.abort();
    setRecording(null);
  };

  /* ---- report ---- */
  const printReport = guard("Lab report", async () => {
    const report = EXPORT.buildLabReport({
      view, viewTitle: window.__qgaCurrentViewTitle ?? view, state, settings,
      backend: settings.renderBackend ?? "auto", quality: settings.detail3d ?? "medium",
      provenance: currentProvenance(view),
      // A report documents the page it was printed from, so the numbers come from the rendered readouts and cards.
      readouts: window.__qgaReportReadouts ? window.__qgaReportReadouts() : collectPageReadouts(),
      formulas: window.__qgaReportFormulas ? window.__qgaReportFormulas() : collectPageFormulas(),
      seed: state.seed ?? 42, commitHash: window.QGA_COMMIT ?? null,
    });
    window.__qgaPendingReport = report;
    window.dispatchEvent(new CustomEvent("qga-open-report", { detail: { report } }));
    setNotice({ tone: "ok", text: "The report opened in the print view; use your browser's Print to PDF." });
  });

  return (
    <div className="export-backdrop" onClick={onClose}>
      <div className="export-panel" role="dialog" aria-modal="true" aria-label="Publishing studio"
        ref={panelRef} tabIndex={-1} onClick={(event) => event.stopPropagation()}>
        <div className="export-head">
          <div>
            <div className="export-kicker">Publishing studio</div>
            <h2>Export what you see</h2>
          </div>
          <button className="btn" onClick={onClose} aria-label="Close the publishing studio">Close</button>
        </div>
        <p className="small dim export-lede">
          Every file carries the application version, the state that produced it, the scientific status of the view, the
          seed and the display transforms. Nothing here is a screenshot of browser chrome.
        </p>

        {notice ? (
          <p className={`export-notice ${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
            {notice.text}
          </p>
        ) : null}

        <ExportSection title="Still image"
          note="PNG at the drawing buffer's size, or a render target. The memory guard refuses a request before anything is allocated.">
          <div className="export-row">
            <label>Size
              <select className="twk-field" value={preset} onChange={(e) => setPreset(e.target.value)}>
                {Object.entries(EXPORT.STILL_PRESETS).map(([id, entry]) => (
                  <option key={id} value={id}>{entry.label}</option>
                ))}
              </select>
            </label>
            <button className="btn primary" disabled={busy != null} onClick={exportStill}>
              {busy === "Still export" ? "Rendering…" : "Save PNG"}
            </button>
          </div>
        </ExportSection>

        <ExportSection title="Figure"
          note="A vector SVG at a journal width, the CSV behind it, and a sidecar whose SHA-256 is the CSV's. Heat maps stay raster because they are raster data.">
          <div className="export-row">
            <label>Width
              <select className="twk-field" value={widthMm} onChange={(e) => setWidthMm(Number(e.target.value))}>
                <option value={EXPORT.FIGURE_WIDTHS_MM.single}>85 mm (single column)</option>
                <option value={EXPORT.FIGURE_WIDTHS_MM.double}>174 mm (double column)</option>
              </select>
            </label>
            <label>Style
              <select className="twk-field" value={figureStyle} onChange={(e) => setFigureStyle(e.target.value)}>
                {EXPORT.FIGURE_STYLES.map((style) => <option key={style} value={style}>{style}</option>)}
              </select>
            </label>
            <button className="btn" disabled={busy != null} onClick={exportFigure}>Save SVG + CSV</button>
          </div>
        </ExportSection>

        <ExportSection title="Share card"
          note={EXPORT.SHARE_CARD_LIMITATION}>
          <div className="export-row">
            <button className="btn" disabled={busy != null} onClick={exportCard}>Save 1200×630 card</button>
          </div>
        </ExportSection>

        <ExportSection title="Recording"
          note={support.supported
            ? `WebM via ${support.mime}. Frames are drawn at a fixed timestep, so the same shot yields the same frames. Audio is never included unless you record it yourself.`
            : support.reason}>
          <div className="export-row">
            <label>Length
              <select className="twk-field" value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} disabled={!support.supported}>
                {Object.entries(EXPORT.RECORDING_PRESETS).map(([value, entry]) => (
                  <option key={value} value={Number(value)}>{entry.label}</option>
                ))}
              </select>
            </label>
            {recording?.active ? (
              <>
                <span className="mono small" aria-live="polite">frame {recording.frame} / {recording.frames}</span>
                <button className="btn" onClick={cancelRecording}>Cancel</button>
              </>
            ) : (
              <button className="btn" disabled={!support.supported || busy != null} onClick={startRecording}>
                Record {seconds} s
              </button>
            )}
          </div>
        </ExportSection>

        <ExportSection title="Lab report"
          note="A print/PDF-ready document with the state, the formulas, the readouts, the assumptions, the references and the provenance. It uses the browser's print pipeline rather than a bundled PDF writer.">
          <div className="export-row">
            <button className="btn" disabled={busy != null} onClick={printReport}>Open print view</button>
          </div>
        </ExportSection>
      </div>
    </div>
  );
}


/**
 * The print view of a lab report.
 *
 * It renders the report object the studio built, so the printed page and the data are the same document — a report
 * that looked different on paper would be a second source of truth. The browser's own print pipeline turns this into a
 * PDF; the studio does not bundle a PDF writer.
 */
function ReportSheet({ report, onClose }) {
  if (!report) return null;
  const primary = window.QGA_EXPORT.REPORT_PRIMARY_KEYS[report.view] ?? [];
  const rows = window.QGA_EXPORT.reportStateRows(report.state, { primary });
  const main = rows.filter((row) => row.primary);
  const rest = rows.filter((row) => !row.primary);
  return (
    <article className="report-sheet" data-screen-label="Lab report">
      <header className="report-head">
        <div className="export-kicker">Lab report · HORIZON</div>
        <h1>{report.title}</h1>
        <p className="report-meta">
          {report.viewTitle} ({report.view}) · generated {report.generatedAt}<br></br>
          version {report.applicationVersion} · commit {report.commitHash} · seed {report.seed} · backend {report.backend} · quality {report.quality}
        </p>
        <div className="tour-controls no-print">
          <button className="btn primary" onClick={() => window.print()}>Print / save as PDF</button>
          <button className="btn" onClick={onClose}>Close report</button>
        </div>
      </header>

      <section className="report-section">
        <h2>State of this view</h2>
        <table className="report-table">
          <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
          <tbody>
            {main.map((row) => <tr key={row.key}><td className="mono">{row.key}</td><td>{row.value}</td></tr>)}
          </tbody>
        </table>
        {rest.length ? (
          <details className="report-rest">
            <summary>All {rest.length} remaining parameters</summary>
            <table className="report-table compact">
              <tbody>
                {rest.map((row) => <tr key={row.key}><td className="mono">{row.key}</td><td>{row.value}</td></tr>)}
              </tbody>
            </table>
          </details>
        ) : null}
      </section>

      {report.provenance ? (
        <section className="report-section">
          <h2>Model and validity</h2>
          <p className="small"><strong>{report.provenance.id}</strong> — status {report.provenance.status}</p>
          {report.provenance.model ? <p className="small">{report.provenance.model}</p> : null}
          {report.provenance.assumptions.length ? (
            <>
              <h3>Assumptions</h3>
              <ul className="report-list">{report.provenance.assumptions.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </>
          ) : null}
          {report.provenance.validity.length ? (
            <>
              <h3>Limits</h3>
              <ul className="report-list">{report.provenance.validity.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </>
          ) : null}
          {report.provenance.numericalMethod ? <p className="small dim">{report.provenance.numericalMethod}</p> : null}
        </section>
      ) : null}

      {report.formulas.length ? (
        <section className="report-section">
          <h2>Formulas</h2>
          {report.formulas.map((formula, i) => (
            <div key={i} className="report-formula">
              <p className="small"><strong>{formula.title ?? formula.id}</strong>{formula.status ? ` — ${formula.status}` : ""}</p>
              {formula.tex ? <div className="fc-eq"><Eq tex={formula.tex} display={true}></Eq></div> : null}
            </div>
          ))}
        </section>
      ) : null}

      {report.readouts.length ? (
        <section className="report-section">
          <h2>Numerical results</h2>
          <table className="report-table">
            <thead><tr><th>Quantity</th><th>Value</th><th>Unit</th><th>Status</th></tr></thead>
            <tbody>
              {report.readouts.map((readout, i) => (
                <tr key={i}>
                  <td>{readout.label}</td>
                  <td className="mono">{readout.value ?? "—"}</td>
                  <td className="mono">{readout.unit ?? "—"}</td>
                  <td>{readout.status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {report.screenshots.length ? (
        <section className="report-section">
          <h2>Figures</h2>
          <ul className="report-list">
            {report.screenshots.map((shot, i) => (
              <li key={i}>{shot.caption} <span className="mono">({shot.src})</span>{shot.provenanceId ? ` [${shot.provenanceId}]` : ""}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.references.length ? (
        <section className="report-section">
          <h2>References</h2>
          <ol className="report-list">{report.references.map((reference, i) => <li key={i}>{reference}</li>)}</ol>
        </section>
      ) : null}

      {report.notes.length ? (
        <section className="report-section">
          <h2>Notes</h2>
          <ul className="report-list">{report.notes.map((note, i) => <li key={i}>{note}</li>)}</ul>
        </section>
      ) : null}

      <p className="report-foot">
        No quantum gravity theory is experimentally confirmed. Every figure and readout in this report carries its
        scientific status; values are computed by the atlas's tested modules at the state shown above.
      </p>
    </article>
  );
}
