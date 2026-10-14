// kerr-controls.jsx — Kerr observatory control deck, focus explanation and
// status readout (Prompt 04). Classic-script component: it is evaluated with
// the rest of the atlas and uses the shared globals (React hooks, Badge,
// SliderRow, Toggle, useQGAState). All numbers it shows come from
// window.QGA_KERR (the science-backed observatory module); nothing here
// computes physics.

const KERR_DISK_LABELS = {
  "page-thorne-turbulent": "Page–Thorne + turbulence",
  "page-thorne": "Page–Thorne",
  "page-thorne-opaque": "Page–Thorne opaque",
  "newtonian": "Newtonian S–S",
};
const KERR_QUALITY_LABELS = { performance: "Performance", balanced: "Balanced", ultra: "Ultra" };
const KERR_FOCUS_BUTTONS = [
  ["horizon", "Horizon"],
  ["photon-region", "Photon region"],
  ["direct-disk", "Direct disk"],
  ["higher-order", "Higher-order image"],
];
const KERR_CAPTURE_PRESETS = [["2k", "2K"], ["4k", "4K"], ["8k", "8K"]];

function useKerrRuntimeSnapshot(period = 400) {
  const [snapshot, setSnapshot] = useState(() => window.__qgaKerrRuntime || null);
  useEffect(() => {
    const id = setInterval(() => {
      const next = window.__qgaKerrRuntime || null;
      setSnapshot((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
    }, period);
    return () => clearInterval(id);
  }, [period]);
  return snapshot;
}

function KerrRuntimeStatus() {
  const info = useKerrRuntimeSnapshot();
  if (!info || !info.budget) {
    return <div className="kerr-status small dim" role="status">Observatory renderer starting…</div>;
  }
  const b = info.budget;
  const volume = info.volume || { corona: false, jets: false, capable: false };
  const volumeNote = info.backend !== "webgl2"
    ? "off (WebGL2 integrator only)"
    : !volume.capable
      ? "off (performance quality gate)"
      : (volume.corona || volume.jets) ? "on" : "off (toggles)";
  return (
    <div className="kerr-status" role="status" aria-label="Kerr observatory render budget">
      <span className="kerr-status-item"><em>backend</em>{info.backend}</span>
      <span className="kerr-status-item"><em>quality</em>{b.effective}{b.effective !== b.requested ? " (limited from " + b.requested + ")" : ""}</span>
      <span className="kerr-status-item"><em>ray steps</em>{b.maxSteps}</span>
      <span className="kerr-status-item"><em>rays / px / frame</em>{b.samplesPerFrame}</span>
      <span className="kerr-status-item"><em>temporal</em>{info.frames} / {b.temporalSamples}</span>
      <span className="kerr-status-item"><em>plasma &amp; jets</em>{volumeNote}</span>
      <span className="kerr-status-item"><em>accumulation resets</em>{info.resets}</span>
    </div>
  );
}

function KerrCapturePanel({ onCapture }) {
  const [preset, setPreset] = useState("2k");
  const [denoise, setDenoise] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const cancelRef = useRef(null);

  const run = async () => {
    if (busy || !onCapture) return;
    setBusy(true);
    setProgress(0);
    setError(null);
    setMessage(null);
    const signal = { aborted: false };
    cancelRef.current = signal;
    try {
      const result = await onCapture({
        preset, denoise, samples: 96, signal,
        onProgress: ({ fraction }) => setProgress(fraction),
        commitHash: window.QGA_BUILD_INFO?.commitHash ?? null,
      });
      const href = URL.createObjectURL(new Blob([result.png], { type: "image/png" }));
      const a = document.createElement("a");
      a.href = href;
      a.download = `horizon-kerr-${result.width}x${result.height}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(href), 0);
      setMessage(`Captured ${result.width}×${result.height} · ${result.metadata.sampleCount} samples · ${result.metadata.backend}`);
    } catch (err) {
      setError(err && err.message ? err.message : String(err));
    } finally {
      cancelRef.current = null;
      setBusy(false);
    }
  };

  return (
    <div className="kerr-control-group kerr-capture" role="group" aria-label="Ultra-quality still capture">
      <span className="kerr-control-label">Capture</span>
      {KERR_CAPTURE_PRESETS.map(([key, label]) => (
        <button key={key} type="button" className={"kerr-chip" + (preset === key ? " on" : "")}
          aria-pressed={preset === key} disabled={busy} onClick={() => setPreset(key)}>{label}</button>
      ))}
      <button type="button" className={"kerr-chip" + (denoise ? " on" : "")}
        aria-pressed={denoise} disabled={busy} onClick={() => setDenoise(!denoise)}>denoise</button>
      <button type="button" className="btn" onClick={run} disabled={busy || !onCapture}>
        {busy ? `Capturing… ${Math.round(progress * 100)}%` : "Capture still"}
      </button>
      {busy ? (
        <React.Fragment>
          <progress className="kerr-capture-progress" value={progress} max={1} aria-label="Capture progress"></progress>
          <button type="button" className="btn" onClick={() => { if (cancelRef.current) cancelRef.current.aborted = true; }}>Cancel</button>
        </React.Fragment>
      ) : null}
      {message ? <p className="small dim" role="status">{message}</p> : null}
      {error ? <p className="small kerr-capture-error" role="alert">{error}</p> : null}
      <p className="kerr-legend small dim">Progressive offscreen render with the ultra ray budget, Halton-jittered sample accumulation, edge-aware denoise and the pipeline tone map. The PNG embeds a metadata sidecar (state, provenance, backend, samples, commit).</p>
    </div>
  );
}

function KerrObservatoryControls({ state, setState, onCameraRequest, onFocusKind, focusKind, onCapture }) {
  const incl = state.bhInclination;
  const dist = state.bhObserverDistance;
  return (
    <div className="kerr-controls" role="group" aria-label="Kerr observatory controls">
      <div className="viz-toolbar">
        <SliderRow label="inclination (from spin axis)" min={3} max={89} step={1} value={incl}
          onChange={(v) => { setState({ bhInclination: v }); onCameraRequest({ inclination: v }); }}
          format={(v) => v.toFixed(0) + "°"}></SliderRow>
        <SliderRow label="observer distance" min={12} max={120} step={1} value={dist}
          onChange={(v) => { setState({ bhObserverDistance: v }); onCameraRequest({ distance: v }); }}
          format={(v) => v.toFixed(0) + " GM/c²"}></SliderRow>
        <SliderRow label="exposure" min={-3} max={3} step={0.25} value={state.bhExposure}
          onChange={(v) => setState({ bhExposure: v })}
          format={(v) => (v >= 0 ? "+" : "") + v.toFixed(2) + " EV"}></SliderRow>
      </div>
      <div className="kerr-instrument-bar">
        <div className="kerr-control-group" role="group" aria-label="Disk model">
          <span className="kerr-control-label">Disk</span>
          {Object.entries(KERR_DISK_LABELS).map(([key, label]) => (
            <button key={key} type="button" className={"kerr-chip" + (state.bhDiskModel === key ? " on" : "")}
              aria-pressed={state.bhDiskModel === key} onClick={() => setState({ bhDiskModel: key })}>{label}</button>
          ))}
        </div>
        <div className="kerr-control-group" role="group" aria-label="Render quality">
          <span className="kerr-control-label">Quality</span>
          {Object.entries(KERR_QUALITY_LABELS).map(([key, label]) => (
            <button key={key} type="button" className={"kerr-chip" + (state.bhRenderQuality === key ? " on" : "")}
              aria-pressed={state.bhRenderQuality === key} onClick={() => setState({ bhRenderQuality: key })}>{label}</button>
          ))}
        </div>
        <div className="kerr-control-group" role="group" aria-label="Volumetric plasma and jets">
          <span className="kerr-control-label">Plasma &amp; jets</span>
          <button type="button" className={"kerr-chip" + (state.bhCorona !== false ? " on" : "")}
            aria-pressed={state.bhCorona !== false} onClick={() => setState({ bhCorona: state.bhCorona === false })}>corona</button>
          <button type="button" className={"kerr-chip" + (state.bhJets !== false ? " on" : "")}
            aria-pressed={state.bhJets !== false} onClick={() => setState({ bhJets: state.bhJets === false })}>jets</button>
          <button type="button" className="kerr-chip" title="Look down the jet axis: the approaching jet Doppler-beams and brightens"
            onClick={() => { setState({ bhInclination: 18 }); onCameraRequest({ inclination: 18 }); }}>view down the jet</button>
        </div>
        <div className="kerr-control-group" role="group" aria-label="Annotations">
          <span className="kerr-control-label">Annotations</span>
          <button type="button" className={"kerr-chip" + (state.bhAnnotations ? " on" : "")}
            aria-pressed={state.bhAnnotations} onClick={() => setState({ bhAnnotations: !state.bhAnnotations })}>
            {state.bhAnnotations ? "image-order tint on" : "off"}
          </button>
        </div>
        <div className="kerr-control-group" role="group" aria-label="Focus feature">
          <span className="kerr-control-label">Focus</span>
          {KERR_FOCUS_BUTTONS.map(([kind, label]) => (
            <button key={kind} type="button" className={"kerr-chip" + (focusKind === kind ? " on" : "")}
              aria-pressed={focusKind === kind} onClick={() => onFocusKind(kind)}>{label}</button>
          ))}
        </div>
        <div className="kerr-control-group">
          <button type="button" className="btn" onClick={() => window.QGA_EXPORT_JSON(window.QGA_READ_STATE())}>
            Export Kerr JSON
          </button>
        </div>
      </div>
      <KerrCapturePanel onCapture={onCapture}></KerrCapturePanel>
      {state.bhAnnotations ? (
        <p className="kerr-legend small" aria-label="Image-order tint legend">
          <span className="kerr-swatch n0"></span> n = 0 direct image (true colour)
          <span className="kerr-swatch n1"></span> n = 1 (cyan tint)
          <span className="kerr-swatch n2"></span> n ≥ 2 (magenta tint) — the tint is an annotation aid, not a physical colour.
          Orders beyond the ray budget are not drawn and no ring is thickened.
        </p>
      ) : null}
      {state.bhJets !== false ? (
        <p className="kerr-legend small dim" aria-label="Jet model legend">
          Jets are a heuristic Blandford–Znajek model: the spin relationship P<sub>BZ</sub> ∝ (a★/(1+√(1−a★²)))² is established and
          scales the jet with spin (a★ = 0 → no jet), but the collimation, spine/sheath flow and knot turbulence are phenomenological,
          not GRMHD. Relativistic beaming hides the jets near edge-on views — press “view down the jet” to see the approaching jet brighten.
        </p>
      ) : null}
      <KerrRuntimeStatus></KerrRuntimeStatus>
    </div>
  );
}

function KerrFocusPanel({ focus, onClose }) {
  if (!focus) {
    return (
      <p className="kerr-focus-hint small dim">
        Click the horizon shadow, the photon region, the direct disk image or a higher-order image — or use the Focus
        buttons — to focus the camera and open the exact scientific explanation.
      </p>
    );
  }
  const info = focus.explanation;
  return (
    <section className="kerr-focus-panel" role="region" aria-live="polite" aria-label={"Focused feature: " + info.title}>
      <header className="kerr-focus-head">
        <h4>{info.title}</h4>
        <Badge kind={info.status}></Badge>
        <button type="button" className="kerr-map-close" onClick={onClose} aria-label="Close explanation">Close</button>
      </header>
      <p className="kerr-focus-summary">{info.summary}</p>
      <p className="kerr-focus-formula mono">{info.formula}</p>
      {info.values.length ? (
        <table className="kerr-focus-values">
          <tbody>
            {info.values.map(([label, value, unit]) => (
              <tr key={label}><th scope="row">{label}</th><td>{value}</td><td className="dim">{unit}</td></tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}

Object.assign(window, { KerrObservatoryControls, KerrFocusPanel, KerrRuntimeStatus });
