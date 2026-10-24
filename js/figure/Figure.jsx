// Figure.jsx — mounts one Figure Kit figure: title bar, canvas plot, KaTeX overlay, crosshair with
// nearest-sample readout, keyboard control, generated summary and a decimated data table.
//
//   <Figure spec={useMemo(() => buildSpec(...), [...])}>caption…</Figure>
//
// `spec` comes from QGA_FIGURE.figure(); keep it memoised so the scene is rebuilt only on change.
// Optional controlled interaction (the RG scale plot, the strain scrubber):
//   onHover(x | null)  pointer position in data x; onSelect(x)  click or tap in data x;
//   onNudge(dir, big)  arrow keys / Home (-Infinity) / End (+Infinity) instead of the built-in crosshair;
//   backdrop(ctx, plot) paints under the scene (a rendered image) and backdropKey redraws it;
//   onScrub(x)         press and drag (capture) in data x; the strain panels seek with it;
//   slider             { min, max, now, text } turns the plot into role="slider"; readout replaces the crosshair text.

const FIG_FORMAT = (v) => (Number.isFinite(v) ? Number(v.toPrecision(4)).toString() : "n/a");

function useFigureMeasure() {
  const [version, setVersion] = useState(0);
  const measure = useMemo(() => {
    const F = window.QGA_FIGURE;
    return F.canvasMeasure(document.createElement("canvas").getContext("2d"));
  }, [version]);
  useEffect(() => {
    let live = true;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (live) setVersion((v) => v + 1); });
    return () => { live = false; };
  }, []);
  return { measure, version };
}

function Figure({ spec, children, className = "", onHover, onSelect, onNudge, slider, extra, readout: readoutOverride, onScrub, backdrop, backdropKey }) {
  const F = window.QGA_FIGURE;
  const wrapRef = useRef(null);
  const cvRef = useRef(null);
  const scratch = useRef({});
  const [width, setWidth] = useState(0);
  const [theme, setTheme] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [tableOpen, setTableOpen] = useState(false);
  const { measure, version } = useFigureMeasure();
  const uid = useMemo(() => "fig-" + spec.id, [spec.id]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => setWidth(Math.floor(entries[0].contentRect.width)));
    ro.observe(el);
    setWidth(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);
  useEffect(() => window.QGA_TOKENS.onThemeChange(() => setTheme((t) => t + 1)), []);

  const fonts = useMemo(() => {
    const T = window.QGA_TOKENS.current();
    return { tick: T.font.mono(-2), label: T.font.mono(-1), family: T.font.family.mono };
  }, [theme]);
  const scene = useMemo(
    () => (width >= 120 ? F.buildScene(spec, { width, height: spec.height, measure, fonts }) : null),
    [spec, width, measure, fonts, version]);
  useEffect(() => { setCursor(null); }, [spec.id]);

  useEffect(() => {
    if (!scene || !cvRef.current) return;
    const ctx = F.prepareCanvas(cvRef.current, scene.width, scene.height);
    // Diagnostics for qa/specs/figure-kit.spec.mjs: the resolved scene of each mounted figure.
    (window.QGA_FIGURE_SCENES ||= new Map()).set(spec.id, scene);
    if (backdrop) backdrop(ctx, scene.plot);
    F.drawScene(ctx, scene, { fonts, scratch: scratch.current });
  }, [scene, fonts, theme, backdropKey]); // eslint-disable-line

  const summary = useMemo(() => F.figureSummary(spec), [spec]);
  const table = useMemo(() => (tableOpen ? F.dataTable(spec) : null), [spec, tableOpen]);

  const focal = scene && scene.focal;
  const n = focal ? focal.x.length : 0;
  const clampIndex = (i) => Math.max(0, Math.min(n - 1, i));
  const onKeyDown = (e) => {
    if (onNudge) {
      const dir = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1
        : e.key === "End" ? Infinity : e.key === "Home" ? -Infinity : 0;
      if (dir) { e.preventDefault(); onNudge(dir, e.shiftKey); }
      return;
    }
    if (!n) return;
    const big = e.shiftKey ? 10 : 1;
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = clampIndex((cursor ?? -1) + big);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = clampIndex((cursor ?? n) - big);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else if (e.key === "Escape") { setCursor(null); return; }
    if (next !== null) { e.preventDefault(); setCursor(next); }
  };
  const dataX = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = Math.min(scene.plot.x + scene.plot.w, Math.max(scene.plot.x, e.clientX - r.left));
    return scene.sx.invert(px);
  };
  const onPointer = (e) => {
    if (!scene) return;
    if (onHover) onHover(dataX(e));
    if (onScrub && (e.buttons & 1)) onScrub(dataX(e));
    if (!focal || onNudge || onHover) return;
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    if (x < scene.plot.x || x > scene.plot.x + scene.plot.w) return;
    setCursor(F.nearestIndex(focal.x, scene.sx.invert(x)));
  };

  const cx = scene && cursor !== null ? scene.sx.map(focal.x[cursor]) : null;
  const cy = scene && cursor !== null ? scene.sy.map(focal.y[cursor]) : null;
  const readout = readoutOverride ? readoutOverride : cursor !== null
    ? `${focal.label}: ${spec.x.label ? spec.x.label.plain : "x"} = ${FIG_FORMAT(focal.x[cursor])}, ${spec.y.label ? spec.y.label.plain : "y"} = ${FIG_FORMAT(focal.y[cursor])}`
    : "";

  return (
    <figure className={"fig " + className} data-figure={spec.id} data-status={spec.status} aria-labelledby={uid + "-title"}>
      <div className="fig-bar">
        <span className="fig-kicker">Figure</span>
        <span className="fig-id">{spec.provenanceId}</span>
        <span id={uid + "-title"} className="fig-title">{spec.title}</span>
        <Badge kind={spec.status}></Badge>
      </div>
      <div ref={wrapRef} className="fig-plot" style={{ height: scene ? scene.height : spec.height }} tabIndex={0}
        role={slider ? "slider" : "group"} aria-roledescription={slider ? undefined : "plot"}
        aria-label={spec.title + ". Arrow keys move along the data, Home and End jump to the ends."}
        aria-valuemin={slider && slider.min} aria-valuemax={slider && slider.max} aria-valuenow={slider && slider.now}
        aria-valuetext={slider && slider.text}
        aria-describedby={uid + "-summary"} onKeyDown={onKeyDown} onPointerMove={onPointer}
        onClick={(e) => { if (onSelect && scene) onSelect(dataX(e)); }}
        onPointerDown={(e) => { if (onScrub && scene) { e.currentTarget.setPointerCapture(e.pointerId); onScrub(dataX(e)); } }}
        onPointerLeave={() => { setCursor(null); if (onHover) onHover(null); }} onBlur={() => setCursor(null)}>
        <canvas ref={cvRef} className="fig-canvas" style={{ width: width || "100%", height: scene ? scene.height : spec.height }}></canvas>
        {scene ? <FigureTex items={scene.overlays}></FigureTex> : null}
        {extra && scene ? extra(scene) : null}
        {cx !== null && Number.isFinite(cx) && Number.isFinite(cy) ? (
          <div className="fig-cross" aria-hidden="true">
            <i className="fig-cross-v" style={{ left: cx, top: scene.plot.y, height: scene.plot.h }}></i>
            <i className="fig-cross-dot" style={{ left: cx, top: cy }}></i>
          </div>
        ) : null}
      </div>
      <div className="fig-readout" role="status" aria-live="polite">{readout}</div>
      <p id={uid + "-summary"} className="fig-summary">{summary}</p>
      <details className="fig-data" onToggle={(e) => setTableOpen(e.currentTarget.open)}>
        <summary>Data</summary>
        {table && table.rows.length ? (
          <div className="fig-table-wrap" tabIndex={0} role="region" aria-label={spec.title + " data table"}>
            <table className="fig-table">
              <thead><tr>{table.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
              <tbody>{table.rows.map((row, i) => <tr key={i}>{row.map((v, j) => <td key={j}>{FIG_FORMAT(v)}</td>)}</tr>)}</tbody>
            </table>
            {table.truncated ? <p className="fig-note">Showing {table.rows.length} evenly spaced rows.</p> : null}
          </div>
        ) : table ? <p className="fig-note">This figure has no tabulated series.</p> : null}
      </details>
      {children ? <figcaption className="fig-caption">{children}</figcaption> : null}
    </figure>
  );
}

Object.assign(window, { Figure });
