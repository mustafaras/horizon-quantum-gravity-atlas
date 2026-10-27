// unification-lab.jsx — do the Standard-Model gauge couplings meet? (S17)
// The calculation is js/science/gauge-running.mjs (window.QGA_GAUGE), the plots are Figure Kit figures (js/figure/plots/unification.mjs), and the
// equation under them is a Formula Core formula whose terms light the matching marks of the plot (js/figure/lens.mjs); this file holds the controls
// and the readouts.

const UG_POINTS = 400;
const UG_FADE_MS = 420; // --dur-settle
const UG_SCALE_RANGE = [2, 19];
const UG_SCALE_DEFAULT = 10;
const UG_SUSY_RANGE = [2.5, 4.5]; // log10 M_SUSY / GeV: 300 GeV to 30 TeV
const UG_COUPLINGS = [
  { tex: "\\alpha_1^{-1}", group: "U(1)" },
  { tex: "\\alpha_2^{-1}", group: "SU(2)" },
  { tex: "\\alpha_3^{-1}", group: "SU(3)" },
];
const ugObject = (objectName) => ({ kind: "object", objectName });
const UG_THIN_SPACE = " "; // units are roman with a thin space (art direction)
const ugThreshold = (log10) => (10 ** log10 >= 1000 ? (10 ** log10 / 1000).toFixed(2) + UG_THIN_SPACE + "TeV" : Math.round(10 ** log10) + UG_THIN_SPACE + "GeV");

function ugRunLayer(G, model, mSusyGeV) {
  const options = { model, mSusyGeV, points: UG_POINTS };
  return {
    model,
    twoLoop: G.runGaugeCouplings({ ...options, loops: 2 }),
    oneLoop: G.runGaugeCouplings({ ...options, loops: 1 }),
    band: G.gaugeBand({ ...options, loops: 2 }),
  };
}

/** Linear interpolation of a series on the run's log10 mu grid. */
function ugAt(log10Mu, values, x) {
  const t = (x - log10Mu[0]) / (log10Mu[log10Mu.length - 1] - log10Mu[0]);
  const f = Math.min(1, Math.max(0, t)) * (log10Mu.length - 1);
  const k = Math.min(log10Mu.length - 2, Math.floor(f));
  return values[k] + (values[k + 1] - values[k]) * (f - k);
}

/** 0 to 1 over the settle duration; under reduced motion it is the target at once. */
function useUgBlend(target, reducedMotion) {
  const [blend, setBlend] = useState(target);
  const latest = useRef(target);
  latest.current = blend;
  useEffect(() => {
    if (reducedMotion) { setBlend(target); return undefined; }
    const from = latest.current, start = performance.now();
    let frame = 0, alive = true;
    const tick = (now) => {
      if (!alive) return;
      const p = Math.min(1, (now - start) / UG_FADE_MS);
      setBlend(from + (target - from) * (1 - Math.pow(1 - p, 4)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(frame); };
  }, [target, reducedMotion]);
  return blend;
}

function UgToggle({ pressed, onToggle, children }) {
  return <button type="button" className={"btn ug-btn" + (pressed ? " on" : "")} aria-pressed={pressed} onClick={onToggle}>{children}</button>;
}

function UgRange({ labelTex, label, min, max, step, value, onChange, format, disabled }) {
  return (
    <div className={"ctl-row ug-range" + (disabled ? " off" : "")}>
      <span className="ctl-label"><Eq tex={labelTex}></Eq></span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} aria-label={label}
        onChange={(e) => onChange(parseFloat(e.target.value))}></input>
      <span className="ctl-value">{format(value)}</span>
    </div>
  );
}

function UnificationLab() {
  const G = window.QGA_GAUGE;
  const { PDG } = G;
  const reducedMotion = usePRM();
  const [mssm, setMssm] = useState(false);
  const [showOneLoop, setShowOneLoop] = useState(true);
  const [focus, setFocus] = useState(0);
  const [selectedLog, setSelectedLog] = useState(UG_SCALE_DEFAULT);
  const [mSusyLog, setMSusyLog] = useState(Math.log10(G.DEFAULT_M_SUSY_GEV));
  const blend = useUgBlend(mssm ? 1 : 0, reducedMotion);

  const sm = useMemo(() => ugRunLayer(G, "sm"), []);
  const ms = useMemo(() => ugRunLayer(G, "mssm", 10 ** mSusyLog), [mSusyLog]);
  const primary = mssm ? ms : sm;
  const triangles = useMemo(() => ({ sm: G.unificationTriangle(sm.twoLoop), mssm: G.unificationTriangle(ms.twoLoop) }), [sm, ms]);
  const triangle = mssm ? triangles.mssm : triangles.sm;
  const status = mssm ? "conjectural" : "effective";
  const inputs = useMemo(() => ({
    log10Mz: Math.log10(PDG.MZ.value), values: G.inputsAtMZ(),
    sigmas: sm.band.upper.map((upper, i) => (upper[0] - sm.band.lower[i][0]) / 2),
  }), [sm]);

  const couplingSpec = useMemo(() => window.QGA_FIGURE.plots.unification.couplingRunSpec({
    layers: [
      ...(blend < 1 ? [{ ...sm, primary: !mssm, opacity: 1 - blend }] : []),
      ...(blend > 0 ? [{ ...ms, primary: mssm, opacity: blend }] : []),
    ],
    inputs, mSusyLog: blend > 0 ? mSusyLog : null, mSusyOpacity: blend, selectedLog, focusIndex: focus, showOneLoop, status,
    planckLog: Math.log10(window.QGA_HIGGS.PLANCK_MASS_GEV),
  }), [sm, ms, blend, mssm, mSusyLog, selectedLog, focus, showOneLoop, status, inputs]);
  const triangleSpec = useMemo(() => (triangle.area === null ? null : window.QGA_FIGURE.plots.unification.triangleSpec({
    layer: primary, triangle, status,
  })), [primary, triangle, status]);

  const latest = useRef({});
  latest.current = { selectedLog, focus };
  const lens = useMemo(() => {
    const name = `a${focus + 1}`;
    return {
      sceneId: "rg-unification", formulaId: "gauge-running-one-loop",
      termTargets: {
        ainv: ugObject(`twoloop:${name}`), inputs: ugObject(`inputs:${name}`), ln_mu_over_MZ: ugObject("scale"),
        ...(showOneLoop ? { b_over_2pi: ugObject(`oneloop:${name}`) } : {}),
      },
      live: () => ({ env: { ainv0: G.inputsAtMZ()[latest.current.focus], b: G.B_ONE_LOOP.sm[latest.current.focus], mu: 10 ** latest.current.selectedLog, MZ: PDG.MZ.value } }),
    };
  }, [focus, showOneLoop]); // eslint-disable-line

  const clampScale = (x) => Math.min(UG_SCALE_RANGE[1], Math.max(UG_SCALE_RANGE[0], x));
  const value = (line, edge) => ugAt(primary.twoLoop.log10Mu, edge ? edge[line] : primary.twoLoop.inv[line], selectedLog);
  const areaText = (t) => (t.area === null ? "\\text{none}" : t.area >= 1 ? t.area.toFixed(2) : t.area.toPrecision(2));
  const ratio = triangles.sm.area && triangles.mssm.area ? triangles.sm.area / triangles.mssm.area : null;

  return (
    <div className="viz-frame ug-lab">
      <div className="viz-toolbar ug-bar" role="group" aria-label="Unification lab controls">
        <UgToggle pressed={showOneLoop} onToggle={() => setShowOneLoop(!showOneLoop)}>one loop, dashed</UgToggle>
        <UgToggle pressed={mssm} onToggle={() => setMssm(!mssm)}>MSSM above <Eq tex="M_{\mathrm{SUSY}}"></Eq> (conjectural)</UgToggle>
        <div className="ug-focus" role="group" aria-label="Coupling the formula below refers to">
          {UG_COUPLINGS.map((c, i) => (
            <UgToggle key={c.group} pressed={focus === i} onToggle={() => setFocus(i)}><Eq tex={c.tex}></Eq><span className="ug-group">{c.group}</span></UgToggle>
          ))}
        </div>
      </div>
      <Figure spec={couplingSpec} lens={lens} slider={{ min: UG_SCALE_RANGE[0], max: UG_SCALE_RANGE[1], now: selectedLog, text: `log10 of the scale in gigaelectronvolts, ${selectedLog.toFixed(2)}` }}
        onSelect={(x) => setSelectedLog(clampScale(x))}
        onNudge={(dir, big) => setSelectedLog(clampScale(dir === Infinity ? UG_SCALE_RANGE[1] : dir === -Infinity ? UG_SCALE_RANGE[0] : selectedLog + dir * (big ? 1 : 0.1)))}>
        <span className="ug-fig-note">{mssm ? "MSSM above the threshold: conjectural." : "Standard Model alone."} Click the plot or use the arrow keys to move the scale.</span>
      </Figure>
      <VizCaption provenanceId={window.QGA_FIGURE.plots.unification.provenanceFor("rg-unification-couplings", status)} status={status}>
        The solid lines run <Eq tex="\alpha_i^{-1}=1/\alpha_i"></Eq> of U(1) (grand-unified normalisation), SU(2) and SU(3) from the Z mass with the two-loop
        equations; the dashed lines are the one-loop solution, straight in <Eq tex="\ln\mu"></Eq>. The bands are the <Eq tex="1\sigma"></Eq> of the three
        measured inputs and nothing else. In the Standard Model the lines cross in pairs and never meet; with superpartners at <Eq tex="M_{\mathrm{SUSY}}"></Eq> they
        nearly do. That is a numerical near-coincidence of the coefficients, not evidence for supersymmetry: no superpartner has been seen, the Yukawa terms and the
        thresholds are left out, and the lines are extrapolated over about 14 decades. The hatched region marks where unification is usually sought, a display convention.
      </VizCaption>
      <div className="viz-toolbar ug-bar ug-controls">
        <div className="ug-sliders">
          <UgRange labelTex="\log_{10}\mu" label="scale, log10 of mu in gigaelectronvolts" min={UG_SCALE_RANGE[0]} max={UG_SCALE_RANGE[1]} step={0.01}
            value={selectedLog} onChange={setSelectedLog} format={(x) => x.toFixed(2)}></UgRange>
          <UgRange labelTex="\log_{10}M_{\mathrm{SUSY}}" label="supersymmetry threshold, log10 of M SUSY in gigaelectronvolts" min={UG_SUSY_RANGE[0]} max={UG_SUSY_RANGE[1]} step={0.01}
            value={mSusyLog} onChange={setMSusyLog} disabled={!mssm} format={ugThreshold}></UgRange>
        </div>
      </div>
      <div className="ug-readouts" role="status" aria-live="polite">
        {UG_COUPLINGS.map((c, i) => (
          <div className="readout" key={c.group}>
            <div className="readout-label"><Eq tex={c.tex.replace("}", "}(\\mu)")}></Eq></div>
            <div className="readout-value">{value(i).toFixed(2)}
              <span className="unit">± {((value(i, primary.band.upper) - value(i, primary.band.lower)) / 2).toFixed(2)} · <Eq tex={`\\alpha=${(1 / value(i)).toFixed(4)}`}></Eq></span></div>
          </div>
        ))}
      </div>
      {triangleSpec ? (
        <Figure spec={triangleSpec}>
          <span className="ug-fig-note">Magnified around the three pairwise crossings of the two-loop lines.</span>
        </Figure>
      ) : <p className="lt-note">The three lines do not all cross inside the plotted range.</p>}
      <VizCaption provenanceId={window.QGA_FIGURE.plots.unification.provenanceFor("rg-unification-triangle", status)} status={status}>
        The triangle the lines enclose, in decades times inverse coupling: a perfect unification would make it a point. Standard Model <Eq tex={`A=${areaText(triangles.sm)}`}></Eq>,
        MSSM with <Eq tex="M_{\mathrm{SUSY}}"></Eq> = {ugThreshold(mSusyLog)}: <Eq tex={`A=${areaText(triangles.mssm)}`}></Eq>
        {ratio ? <React.Fragment>, a factor <Eq tex={`${Math.round(ratio)}`}></Eq> smaller</React.Fragment> : null}. The MSSM area moves by orders of magnitude with the threshold and passes
        through a minimum near 2 TeV, so how small it gets says more about the omitted thresholds and Yukawa terms than about the couplings.
      </VizCaption>
      <div className="ug-cards">
        <FormulaCard title="One-loop running of a gauge coupling" formulaId="gauge-running-one-loop" status="effective"
          symbols={[
            { s: "\\alpha_i^{-1}(M_Z)", d: "Inverse coupling at the Z mass, from the measured $\\alpha_{\\mathrm{em}}$, $\\sin^2\\theta_W$ and $\\alpha_s$. Hover or focus this term to mark the input and its error bar in the plot." },
            { s: "b_i", d: "One-loop coefficient: $(41/10,\\,-19/6,\\,-7)$ in the Standard Model. It is the slope of the dashed line in $\\ln\\mu$, times $-2\\pi$." },
            { s: "\\ln(\\mu/M_Z)", d: "How far the scale has run, the position of the vertical rule in the plot." },
          ]}
          meaning="Each inverse coupling is a straight line in the logarithm of the scale; only the sign of its slope differs: SU(2) and SU(3) are asymptotically free, so their inverse couplings grow, while U(1) is not and its inverse coupling falls. Focus a term to light its mark in the plot and read its value for the coupling chosen above."
          limits="One loop and Standard Model coefficients, from $M_Z$: in the MSSM view the card still evaluates the Standard-Model line, valid up to $M_{\mathrm{SUSY}}$. Two loops move the lines by a few tenths up to a few units at the Planck mass; the plot draws both."></FormulaCard>
      </div>
    </div>
  );
}

window.UnificationLab = UnificationLab;
