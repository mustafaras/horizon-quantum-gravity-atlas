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
  return (
    <div className="kerr-status" role="status" aria-label="Kerr observatory render budget">
      <span className="kerr-status-item"><em>backend</em>{info.backend}</span>
      <span className="kerr-status-item"><em>quality</em>{b.effective}{b.effective !== b.requested ? " (limited from " + b.requested + ")" : ""}</span>
      <span className="kerr-status-item"><em>ray steps</em>{b.maxSteps}</span>
      <span className="kerr-status-item"><em>rays / px / frame</em>{b.samplesPerFrame}</span>
      <span className="kerr-status-item"><em>temporal</em>{info.frames} / {b.temporalSamples}</span>
      <span className="kerr-status-item"><em>accumulation resets</em>{info.resets}</span>
    </div>
  );
}

function KerrObservatoryControls({ state, setState, onCameraRequest, onFocusKind, focusKind }) {
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
      {state.bhAnnotations ? (
        <p className="kerr-legend small" aria-label="Image-order tint legend">
          <span className="kerr-swatch n0"></span> n = 0 direct image (true colour)
          <span className="kerr-swatch n1"></span> n = 1 (cyan tint)
          <span className="kerr-swatch n2"></span> n ≥ 2 (magenta tint) — the tint is an annotation aid, not a physical colour.
          Orders beyond the ray budget are not drawn and no ring is thickened.
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
