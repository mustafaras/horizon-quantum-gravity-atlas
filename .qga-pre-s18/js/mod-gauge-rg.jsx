// mod-gauge-rg.jsx — Module 03: Symmetry, Gauge Theory, and Renormalization
const RG_LN10 = Math.log(10);
const RG_G_LIMIT = Math.sqrt(4 * Math.PI);
const RG_PRESETS = {
  qed: {
    title: "QED · one loop", model: "qed", g0: 0.303, mu0: -3, lo: -3, hi: 24,
    nf: 1, a: 1, b: 1, gStar: 1, current: 12, badge: "effective",
    note: "Positive β: charge screening makes e grow toward the ultraviolet.",
  },
  qcd: {
    title: "QCD · one loop", model: "qcd", g0: 1.218, mu0: 2, lo: -1, hi: 8,
    nf: 5, a: 1, b: 1, gStar: 1, current: 5, badge: "effective",
    note: "SU(3), five active flavours: asymptotic freedom in the ultraviolet.",
  },
  gaussian: {
    title: "Gaussian fixed point", model: "gaussian", g0: 1.6, mu0: 0, lo: -2, hi: 4,
    nf: 0, a: 0.7, b: 1, gStar: 0, current: 3, badge: "schematic",
    note: "Canonical linear flow toward the free fixed point; pedagogical model.",
  },
  "uv-toy": {
    title: "UV-attractive toy", model: "linear", g0: 2.35, mu0: 0, lo: -1.2, hi: 4,
    nf: 0, a: -0.8, b: 1, gStar: 1, current: 3, badge: "schematic",
    note: "Linear illustrative flow into an interacting ultraviolet fixed point.",
  },
  "ir-toy": {
    title: "IR-attractive toy", model: "linear", g0: 0.3, mu0: 0, lo: -4, hi: 1.2,
    nf: 0, a: 0.8, b: 1, gStar: 1, current: -3, badge: "schematic",
    note: "Linear illustrative flow into an interacting infrared fixed point.",
  },
  "asymptotic-safety": {
    title: "Asymptotic-safety style", model: "asymptotic-safety", g0: 0.3, mu0: 0, lo: -4, hi: 5,
    nf: 0, a: 0.9, b: 0.9, gStar: 1, current: 4, badge: "conjectural",
    note: "Illustrative polynomial toy only — not evidence for quantum-gravity asymptotic safety.",
  },
};

function rgPresetPatch(id) {
  const preset = RG_PRESETS[id] || RG_PRESETS.qcd;
  const resolved = id in RG_PRESETS ? id : "qcd";
  return {
    rgPreset: resolved,
    rgPresetOrigin: resolved,
    rgModel: preset.model,
    rgG0: preset.g0,
    rgMu0: preset.mu0,
    rgLogMin: preset.lo,
    rgLogMax: preset.hi,
    rgNf: preset.nf,
    rgA: preset.a,
    rgB: preset.b,
    rgGStar: preset.gStar,
    rgCurrent: preset.current,
  };
}

function rgActivePresetId(state) {
  const origin = state?.rgPresetOrigin;
  if (origin && origin in RG_PRESETS) return origin;
  const literal = state?.rgPreset;
  if (literal && literal in RG_PRESETS) return literal;
  return "qcd";
}

function rgScientificStatus(state) {
  if (state.rgModel === "asymptotic-safety" || state.rgPresetOrigin === "asymptotic-safety") return "conjectural-illustrative-toy";
  if (["gaussian", "linear"].includes(state.rgModel)) return "pedagogical-toy";
  if (["qed", "qcd"].includes(state.rgModel)) return "one-loop-perturbative";
  return "custom";
}

function rgParameters(state) {
  return { nf: state.rgNf, a: state.rgA, b: state.rgB, gStar: state.rgGStar };
}

function rgSample(points, t) {
  if (!points.length || t < points[0].t - 1e-9 || t > points[points.length - 1].t + 1e-9) return null;
  let lo = 0, hi = points.length - 1;
  while (hi - lo > 1) {
    const middle = Math.floor((lo + hi) / 2);
    if (points[middle].t <= t) lo = middle; else hi = middle;
  }
  const left = points[lo], right = points[hi];
  if (!right || Math.abs(right.t - left.t) < 1e-12) return left;
  const fraction = (t - left.t) / (right.t - left.t);
  return { t, g: left.g + (right.g - left.g) * fraction, beta: left.beta + (right.beta - left.beta) * fraction };
}

function useEasedRGPoints(target, reducedMotion) {
  const [shown, setShown] = useState(target);
  const [settling, setSettling] = useState(false);
  const shownRef = useRef(target);
  shownRef.current = shown;
  useEffect(() => {
    if (reducedMotion || !target.length) {
      setShown(target); setSettling(false); return undefined;
    }
    const from = shownRef.current;
    const start = performance.now();
    let frame = 0, alive = true;
    setSettling(true);
    const tick = (now) => {
      if (!alive) return;
      const progress = Math.min(1, (now - start) / 520);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(target.map((point) => {
        const prior = rgSample(from, point.t);
        return { ...point, g: (prior ? prior.g : point.g) + (point.g - (prior ? prior.g : point.g)) * eased };
      }));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else { setShown(target); setSettling(false); }
    };
    frame = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(frame); };
  }, [target, reducedMotion]);
  return { points: shown, settling };
}

function rgModelEquation(state) {
  const p = rgParameters(state);
  if (state.rgModel === "qed") return `\\beta(e)=\\frac{${p.nf}\\,e^3}{12\\pi^2}`;
  if (state.rgModel === "qcd") return `\\beta(g_s)=-\\frac{${window.QGA_PHYSICS.qcdB0(p.nf).toFixed(3)}\\,g_s^3}{16\\pi^2}`;
  if (state.rgModel === "gaussian") return `\\beta(g)=-${p.a.toFixed(2)}g`;
  if (state.rgModel === "linear") return `\\beta(g)=${p.a.toFixed(2)}(g-${p.gStar.toFixed(2)})`;
  return `\\beta(g)=${p.a.toFixed(2)}g-${p.b.toFixed(2)}g^3`;
}

function RGScalePlot({ state, points, fixedPoints, currentPoint, hoverLog, setHoverLog, setCurrent, settling }) {
  const yMax = Math.min(4, Math.max(1.25, RG_G_LIMIT * 1.04,
    ...points.map((point) => point.g * 1.08), ...fixedPoints.map((point) => point.g * 1.12)));
  const markerLog = hoverLog == null ? state.rgCurrent : hoverLog;
  const marker = rgSample(points, (markerLog - state.rgMu0) * RG_LN10);
  const status = RG_PRESETS[rgActivePresetId(state)].badge;
  const spec = useMemo(() => window.QGA_FIGURE.plots.rg.scaleTrajectorySpec({
    points, fixedPoints, logMin: state.rgLogMin, logMax: state.rgLogMax, mu0: state.rgMu0, ln10: RG_LN10,
    gLimit: RG_G_LIMIT, yMax, markerLog, markerG: marker ? marker.g : NaN, status,
  }), [points, fixedPoints, state.rgLogMin, state.rgLogMax, state.rgMu0, yMax, markerLog, status]); // eslint-disable-line
  const clamp = (v) => Math.max(state.rgLogMin, Math.min(state.rgLogMax, v));
  return (
    <div className={"rg-plot rg-scale-plot" + (settling ? " settling" : "")}>
      <header><span>RG·A / scale trajectory</span><strong>g(μ) versus log<sub>10</sub> μ</strong></header>
      <p className="rg-mobile-gesture-note">Swipe the chart horizontally; use the current-scale control above to select μ.</p>
      <Figure spec={spec}
        slider={{ min: state.rgLogMin, max: state.rgLogMax, now: state.rgCurrent,
          text: `log10 mu ${state.rgCurrent.toFixed(2)}, or 10 to the ${state.rgCurrent.toFixed(2)} GeV` }}
        readout={`log₁₀ μ = ${markerLog.toFixed(3)} · ${marker ? `g = ${marker.g.toFixed(5)}` : "outside valid domain"}`}
        onHover={setHoverLog} onSelect={(x) => setCurrent(clamp(x))}
        onNudge={(dir, big) => setCurrent(dir === Infinity ? state.rgLogMax : dir === -Infinity ? state.rgLogMin : clamp(state.rgCurrent + dir * (big ? 1 : 0.1)))}></Figure>
    </div>
  );
}

function RGBetaPlot({ state, fixedPoints, currentPoint }) {
  const yMax = Math.max(1.25, RG_G_LIMIT * 1.04, ...fixedPoints.map((point) => point.g * 1.15));
  const parameters = rgParameters(state);
  const samples = Array.from({ length: 151 }, (_, index) => {
    const g = (yMax * index) / 150;
    return { g, beta: window.QGA_PHYSICS.rgBeta(state.rgModel, g, parameters) };
  }).filter((point) => Number.isFinite(point.beta));
  const betaMax = Math.max(0.05, ...samples.map((point) => Math.abs(point.beta))) * 1.1;
  const status = RG_PRESETS[rgActivePresetId(state)].badge;
  const spec = useMemo(() => window.QGA_FIGURE.plots.rg.betaFunctionSpec({
    samples, fixedPoints, yMax, betaMax, status,
    currentPoint: currentPoint ? { g: currentPoint.g, beta: currentPoint.beta } : null,
  }), [state.rgModel, state.rgNf, state.rgA, state.rgB, state.rgGStar, fixedPoints, currentPoint, status]); // eslint-disable-line
  return (
    <div className="rg-plot rg-beta-plot">
      <header><span>RG·B / phase line</span><strong>β(g) and fixed points</strong></header>
      <Figure spec={spec}></Figure>
    </div>
  );
}

function RGControl({ label, value, min, max, step, onChange, format }) {
  const display = format ? format(value) : Number(value).toFixed(2);
  return (
    <label className="rg-control">
      <span>{label}</span>
      <input type="range" value={value} min={min} max={max} step={step}
        aria-valuetext={`${label}: ${display}`}
        onChange={(event) => onChange(Number(event.target.value))}></input>
      <output>{display}</output>
    </label>
  );
}

function RGLiveFormulation({ state, currentPoint, fixedPoints, numericFixed, integration }) {
  const parameters = rgParameters(state);
  const primary = fixedPoints.find((point) => point.g > 1e-8) || fixedPoints[0];
  const numeric = primary ? numericFixed.find((point) => Math.abs(point.g - primary.g) < 1e-5) : null;
  const analytic = ["qed", "qcd"].includes(state.rgModel)
    ? window.QGA_PHYSICS.rgOneLoopRunning(
      state.rgModel, state.rgG0, (state.rgCurrent - state.rgMu0) * RG_LN10, { nf: state.rgNf })
    : null;
  return (
    <section className="rg-formulation" aria-label="Live substituted RG formulation">
      <header>
        <div><span className="rg-panel-id">RG·D</span><h4>Live substituted formulation</h4></div>
        <span>exact relations · numerical trajectory · explicit scope</span>
      </header>
      <div className="rg-equation-grid">
        <div><span>Definition · exact</span><Eq tex="\frac{dg}{d\ln\mu}=\beta(g)"></Eq></div>
        <div><span>Coupling convention · exact</span><Eq tex={`\\alpha=\\frac{g^2}{4\\pi}${currentPoint ? `=${(currentPoint.g ** 2 / (4 * Math.PI)).toFixed(6)}` : ""}`}></Eq></div>
        <div><span>Selected β model</span><Eq tex={rgModelEquation(state)}></Eq></div>
        <div><span>Current substitution · numerical</span>
          <Eq tex={currentPoint
            ? `\\beta(${currentPoint.g.toFixed(5)})=${window.QGA_PHYSICS.rgBeta(state.rgModel, currentPoint.g, parameters).toExponential(3)}`
            : "\\text{outside bounded trajectory}"}></Eq>
        </div>
        <div><span>Fixed-point condition</span>
          <Eq tex={primary ? `\\beta(g_*)=0,\\quad g_*=${primary.g.toFixed(6)}` : "\\beta(g_*)=0\\quad\\text{(no root in display domain)}"}></Eq>
        </div>
        <div><span>Linearization and convention</span>
          <Eq tex={primary
            ? `\\beta(g)\\approx ${primary.derivative.toFixed(4)}(g-${primary.g.toFixed(4)})`
            : "\\beta(g)\\approx\\beta'(g_*)(g-g_*)"}></Eq>
        </div>
      </div>
      <p className="rg-equation-note">
        With <Eq tex="t = \ln\mu"></Eq> increasing toward the UV, <Eq tex="\beta'(g_*) < 0"></Eq> is
        UV-attractive and <Eq tex="\beta'(g_*) > 0"></Eq> is IR-attractive. <Eq tex="\beta' = 0"></Eq> is
        marginal at linear order. Analytic roots are compared with a deterministic bisection scan at tolerance
        <Eq tex="10^{-9}"></Eq>{numeric && primary ? `; current |g*analytic − g*numeric| = ${Math.abs(primary.g - numeric.g).toExponential(2)}.` : "."}
      </p>
      <div className="rg-method-strip">
        <span><strong>Integrator</strong> fixed-step RK4</span>
        <span><strong>Δ ln μ</strong> {integration.step.toFixed(3)}</span>
        <span><strong>roundoff disclosure</strong> 10⁻¹⁰ diagnostic</span>
        <span><strong>IR</strong> {integration.infrared.status}</span>
        <span><strong>UV</strong> {integration.ultraviolet.status}</span>
        {analytic ? <span><strong>one-loop analytic</strong> {analytic.status}</span> : null}
      </div>
    </section>
  );
}

function RGFlowLandscape() {
  const [state, setState] = useQGAState();
  const reducedMotion = usePRM();
  const [hoverLog, setHoverLog] = useState(null);
  const [shareStatus, setShareStatus] = useState("");
  const parameters = useMemo(() => rgParameters(state),
    [state.rgNf, state.rgA, state.rgB, state.rgGStar]);
  const integration = useMemo(() => window.QGA_PHYSICS.integrateRGFlow({
    model: state.rgModel, g0: state.rgG0, t0: 0,
    tMin: (state.rgLogMin - state.rgMu0) * RG_LN10,
    tMax: (state.rgLogMax - state.rgMu0) * RG_LN10,
    step: 0.02, gLimit: RG_G_LIMIT, parameters,
  }), [state.rgModel, state.rgG0, state.rgMu0, state.rgLogMin, state.rgLogMax, parameters]);
  const eased = useEasedRGPoints(integration.points, reducedMotion);
  const fixedPoints = useMemo(() => window.QGA_PHYSICS.rgFixedPoints(state.rgModel, parameters),
    [state.rgModel, parameters]);
  const numericFixed = useMemo(() => window.QGA_PHYSICS.findRGFixedPoints(
    state.rgModel, parameters, { gMin: 0, gMax: 4, tolerance: 1e-9 }),
  [state.rgModel, parameters]);
  const currentT = (state.rgCurrent - state.rgMu0) * RG_LN10;
  const currentPoint = rgSample(integration.points, currentT);
  const activePresetId = rgActivePresetId(state);
  const activePreset = RG_PRESETS[activePresetId] || RG_PRESETS.qcd;
  const scientificStatus = rgScientificStatus(state);
  const isAsymptoticSafety = scientificStatus === "conjectural-illustrative-toy";
  const layer = isAsymptoticSafety ? "conjectural" : ["qed", "qcd"].includes(state.rgModel) ? "effective" : "schematic";
  const update = (patch, options = {}) => setState((current) => {
    const origin = current.rgPresetOrigin in RG_PRESETS ? current.rgPresetOrigin :
      (current.rgPreset in RG_PRESETS ? current.rgPreset : "qcd");
    const next = { ...current, ...(typeof patch === "function" ? patch(current) : patch) };
    next.rgPreset = "custom";
    next.rgPresetOrigin = origin;
    return next;
  }, options);
  const setCurrent = (value) => setState({ rgCurrent: value }, { replace: true });
  const updateRange = (key, value) => {
    const next = key === "rgLogMin"
      ? Math.min(value, state.rgLogMax - 0.5)
      : Math.max(value, state.rgLogMin + 0.5);
    const lo = key === "rgLogMin" ? next : state.rgLogMin;
    const hi = key === "rgLogMax" ? next : state.rgLogMax;
    update({ [key]: next, rgMu0: Math.max(lo, Math.min(hi, state.rgMu0)), rgCurrent: Math.max(lo, Math.min(hi, state.rgCurrent)) });
  };
  const copy = async () => {
    try {
      await QGA_COPY_LINK(qgaReadState());
      setShareStatus("RG state link copied.");
    } catch (error) {
      setShareStatus("Copy failed: " + (error?.message || "clipboard unavailable"));
    }
  };
  return (
    <div className={"rg-landscape rg-layer-" + layer}>
      <header className="rg-head">
        <div className="rg-head-plate">
          <span className="rg-head-ident">RG·FLOW / 03</span>
          <div>
            <h3>Renormalisation-Group Flow Landscape</h3>
            <p>One synchronized instrument for scale evolution, β geometry, fixed points, and validity boundaries.</p>
          </div>
        </div>
        <div className="rg-head-state">
          <Badge kind={layer}></Badge>
          <span>{activePreset ? activePreset.title : "Custom parameters"}</span>
        </div>
      </header>

      <div className="rg-presets" role="group" aria-label="Documented RG presets">
        {Object.entries(RG_PRESETS).map(([id, preset]) => (
          <button key={id} className={"rg-preset" + (state.rgPreset === id ? " on" : "")}
            aria-pressed={state.rgPreset === id}
            onClick={() => setState({ ...rgPresetPatch(id), rgPresetOrigin: id }, { replace: false })}>
            <span>{preset.title}</span><small>{preset.model}</small>
          </button>
        ))}
      </div>

      <div className="rg-control-deck">
        <RGControl label="initial coupling g₀" value={state.rgG0} min={0} max={3.4} step={0.001}
          onChange={(value) => update({ rgG0: value })} format={(value) => value.toFixed(3)}></RGControl>
        <RGControl label="reference log₁₀ μ₀" value={state.rgMu0} min={state.rgLogMin} max={state.rgLogMax} step={0.1}
          onChange={(value) => update({ rgMu0: value })} format={(value) => value.toFixed(1) + " GeV decade"}></RGControl>
        <RGControl label="range · IR bound" value={state.rgLogMin} min={-12} max={29.5} step={0.1}
          onChange={(value) => updateRange("rgLogMin", value)} format={(value) => value.toFixed(1)}></RGControl>
        <RGControl label="range · UV bound" value={state.rgLogMax} min={-11.5} max={30} step={0.1}
          onChange={(value) => updateRange("rgLogMax", value)} format={(value) => value.toFixed(1)}></RGControl>
        {(state.rgModel === "qed" || state.rgModel === "qcd") ? <RGControl label="active flavours n_f"
          value={state.rgNf} min={state.rgModel === "qed" ? 1 : 0} max={16} step={1}
          onChange={(value) => update({ rgNf: value })} format={(value) => String(Math.round(value))}></RGControl> : null}
        {(state.rgModel === "gaussian" || state.rgModel === "linear" || state.rgModel === "asymptotic-safety")
          ? <RGControl label={state.rgModel === "linear" ? "linear slope a" : "model coefficient a"}
            value={state.rgA} min={state.rgModel === "linear" ? -2 : 0.1} max={2} step={0.05}
            onChange={(value) => update({ rgA: value })}></RGControl> : null}
        {state.rgModel === "linear" ? <RGControl label="target fixed point g*"
          value={state.rgGStar} min={0} max={3} step={0.05}
          onChange={(value) => update({ rgGStar: value })}></RGControl> : null}
        {state.rgModel === "asymptotic-safety" ? <RGControl label="nonlinear coefficient b"
          value={state.rgB} min={0.05} max={2} step={0.05}
          onChange={(value) => update({ rgB: value })}></RGControl> : null}
      </div>

      <div className="rg-actions">
        <RGControl label="current scale log₁₀ μ" value={state.rgCurrent} min={state.rgLogMin} max={state.rgLogMax} step={0.01}
          onChange={setCurrent} format={(value) => value.toFixed(2)}></RGControl>
        <div>
          <button className="btn" onClick={() => setState(rgPresetPatch(activePresetId), { replace: false })}>Reset preset</button>
          <button className="btn" onClick={copy}>Copy RG link</button>
          <button className="btn" onClick={() => { QGA_EXPORT_JSON(qgaReadState()); setShareStatus("RG JSON exported."); }}>Export RG JSON</button>
        </div>
        <span className="rg-share-status" aria-live="polite">{shareStatus}</span>
      </div>

      <div className="rg-chamber">
        <RGScalePlot state={state} points={eased.points} fixedPoints={fixedPoints}
          currentPoint={currentPoint} hoverLog={hoverLog} setHoverLog={setHoverLog}
          setCurrent={setCurrent} settling={eased.settling}></RGScalePlot>
        <RGBetaPlot state={state} fixedPoints={fixedPoints} currentPoint={currentPoint}></RGBetaPlot>
      </div>

      <div className="rg-readout-deck">
        <div><span>current coupling</span><strong>{currentPoint ? currentPoint.g.toFixed(6) : "terminated"}</strong>
          <small>{currentPoint ? `α = ${(currentPoint.g ** 2 / (4 * Math.PI)).toFixed(6)}` : "outside bounded validity domain"}</small></div>
        <div><span>current β(g)</span><strong>{currentPoint ? currentPoint.beta.toExponential(4) : "—"}</strong>
          <small>dg / d ln μ · natural-log convention</small></div>
        <div><span>fixed-point census</span><strong>{fixedPoints.length}</strong>
          <small>{fixedPoints.map((point) => `${point.g.toFixed(3)} · ${point.stability}`).join(" / ") || "none in analytic model"}</small></div>
        <div><span>bounded integration</span><strong>{integration.status}</strong>
          <small>IR {integration.infrared.status} · UV {integration.ultraviolet.status}</small></div>
      </div>

      <RGLiveFormulation state={state} currentPoint={currentPoint} fixedPoints={fixedPoints}
        numericFixed={numericFixed} integration={integration}></RGLiveFormulation>

      <div className="rg-validity-grid">
        <section><Badge kind={["qed", "qcd"].includes(state.rgModel) ? "effective" : "schematic"}></Badge>
          <h4>{state.rgModel === "qed" ? "QED perturbative layer" : state.rgModel === "qcd" ? "QCD perturbative layer" : "Pedagogical model layer"}</h4>
          <p>{state.rgModel === "qed"
            ? "The positive one-loop β and analytic running are established perturbative QED. The formal Landau pole is an extrapolation far beyond the trustworthy domain, not an observed phenomenon."
            : state.rgModel === "qcd"
              ? <React.Fragment>For SU(3), <Eq tex="b_0 = 11 - 2n_f/3"></Eq> = {window.QGA_PHYSICS.qcdB0(state.rgNf).toFixed(3)}. The UV trend is perturbative; the <Eq tex="\alpha_s = 1"></Eq> stop marks entry into strong coupling, not a prediction of a physical divergence.</React.Fragment>
              : "The linear and polynomial β functions are transparent teaching systems. Their trajectories are numerical illustrations, not measured running couplings."}</p>
        </section>
        <section><Badge kind={isAsymptoticSafety ? "conjectural" : "schematic"}></Badge>
          <h4>Quantum-gravity claim boundary</h4>
          <p>{isAsymptoticSafety
            ? "This asymptotic-safety-style polynomial is explicitly illustrative. Its interacting UV fixed point is built into the toy β function and is not evidence that gravity possesses such a fixed point."
            : "Fixed-point arrows report the selected mathematical model only. No preset establishes ultraviolet completion of quantum gravity."}</p>
        </section>
        <section><Badge kind="established"></Badge>
          <h4>Numerical and display contract</h4>
          <p>Deterministic fixed-step RK4 integrates both directions from <Eq tex="\mu_0"></Eq>. Non-finite values, iteration limits, and <Eq tex="\alpha = 1"></Eq> boundaries terminate visibly; no missing segment is reported as success. Reduced motion snaps directly to exact final geometry.</p>
        </section>
      </div>
      <VizCaption provenanceId={layer === "effective" ? "rg-scale-trajectory" : layer === "conjectural" ? "rg-landscape-asymptotic-safety" : "rg-landscape-toy"} status={layer}>
        {activePreset?.note || "Custom parameter state."} Scale is measurement resolution, not ordinary time.
        Curve morphing is presentation-only; readouts always use the exact current state.
      </VizCaption>
    </div>
  );
}

// Module composition and the window export live in mod-rg-stage3.jsx.
