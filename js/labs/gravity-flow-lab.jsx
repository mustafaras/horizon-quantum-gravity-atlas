// gravity-flow-lab.jsx — asymptotic safety: the Einstein–Hilbert flow of (g, λ) as a GPU line-integral-convolution silk (S18).
// The calculation is js/science/asymptotic-safety.mjs (window.QGA_GRAVITY), the picture is the TSL scene js/visualizations/rg/lic-field.mjs, the plot
// under it is a Figure Kit figure (js/figure/plots/asymptotic-safety.mjs); this file holds the controls, the readouts and the formula cards.

const GF_HEIGHT = 520;
const GF_FOV = 12; // a small field of view from far away: close to a flat map, with the orbit rig still free to tilt it
const GF_FIT = 1.05;
const GF_RANGES = { g: [0.02, 1.2], lambda: [-0.4, 0.49] };
const GF_TYPES = {
  Ia: "Type Ia: the cosmological constant runs negative in the infrared",
  IIa: "Type IIa: the separatrix, into the Gaussian fixed point",
  IIIa: "Type IIIa: the cosmological constant stays positive and the truncation breaks down",
  outside: "outside the truncation",
  other: "no clear infrared fate within the step budget",
};
const GF_STOPS = {
  "singular-line": "the singular line at one half", "eta-pole": "the boundary where the anomalous dimension diverges",
  "canonical-scaling": "canonical scaling", "gaussian-fixed-point": "the Gaussian fixed point", "non-finite": "a non-finite value", "step-limit": "the step budget",
};

const gfSep = (G, share) => { const p = G.separatrix().points; return p[Math.floor(p.length * share)]; };

function GfRange({ labelTex, label, min, max, step, value, onChange, format }) {
  return (
    <div className="ctl-row ug-range">
      <span className="ctl-label"><Eq tex={labelTex}></Eq></span>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={(e) => onChange(parseFloat(e.target.value))}></input>
      <span className="ctl-value">{format(value)}</span>
    </div>
  );
}

const gfTheta = (e) => `${e.re.toFixed(3)} \\pm ${Math.abs(e.im).toFixed(3)}\\,i`;

function GravityFlowLab() {
  const G = window.QGA_GRAVITY;
  const [start, setStart] = useState({ g: 0.5, lambda: 0.1 });
  const [preset, setPreset] = useState("IIIa");
  const wrap = useRef(null);
  const [width, setWidth] = useState(0);
  const silk = useRef(null);
  const latest = useRef(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => setWidth(Math.floor(entries[0].contentRect.width)));
    ro.observe(el);
    setWidth(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  const run = useMemo(() => window.QGA_FIGURE.plots.gravity.trajectoryRun({ g0: start.g, lambda0: start.lambda }), [start]);
  const points = useMemo(() => G.fixedPoints(), []);
  const litim = useMemo(() => G.fixedPoints({ scheme: "litim2004" }).find((p) => !p.gaussian), []);
  const ngfp = points.find((p) => !p.gaussian);
  const spec = useMemo(() => (run.type === "outside" ? null : window.QGA_FIGURE.plots.gravity.trajectorySpec({ run })), [run]);

  latest.current = { points: run.type === "outside" ? [] : run.points, start: run.type === "outside" ? null : start };
  useEffect(() => { silk.current?.setTrajectory(latest.current); }, [run, start]);

  const presets = useMemo(() => {
    const sep = gfSep(G, 0.8);
    return { Ia: { g: 0.4, lambda: -0.1 }, IIa: { g: sep.g, lambda: sep.lambda }, IIIa: { g: 0.5, lambda: 0.1 } };
  }, []);
  const choose = (id) => { setPreset(id); setStart(presets[id]); };
  const move = (key, value) => { setPreset("custom"); setStart({ ...start, [key]: value }); };

  const fov = (GF_FOV * Math.PI) / 180;
  const aspect = Math.max(0.4, (width || 900) / GF_HEIGHT);
  const radius = Math.round((GF_FIT * Math.max(G.silk.SILK.depth / 2, G.silk.SILK.width / 2 / aspect)) / Math.tan(fov / 2));

  const build = async (ctx) => {
    const { buildGravityFlowSilk } = await G.loadSilk();
    const handle = await buildGravityFlowSilk(ctx);
    silk.current = handle;
    handle.setTrajectory(latest.current);
    return handle;
  };

  const ended = run.type === "outside" ? null : GF_STOPS[run.terminated] ?? run.terminated;
  return (
    <div className="viz-frame gf-lab">
      <div className="viz-toolbar ug-bar" role="group" aria-label="Trajectory presets">
        {["Ia", "IIa", "IIIa"].map((id) => (
          <button key={id} type="button" className={"btn ug-btn" + (preset === id ? " on" : "")} aria-pressed={preset === id} onClick={() => choose(id)}>
            {id === "IIa" ? "separatrix (Type IIa)" : `Type ${id}`}
          </button>
        ))}
      </div>
      <div ref={wrap}>
        <Scene3D animated="motion" nodeKit height={GF_HEIGHT} deps={[radius]}
          aria="Flow of the Newton coupling g and the cosmological constant lambda in the Einstein–Hilbert truncation as a line-integral-convolution picture: streaks follow the flow, colour is the sign of the beta function of g. Rings mark the Gaussian and the non-Gaussian fixed point, a line the separatrix between them, and the white line is the chosen trajectory."
          initial={{ radius, theta: 0, phi: 0.09, fov: GF_FOV, minR: radius * 0.6, maxR: radius * 1.6, target: [0, 0, 0] }}
          build={build}
          fallback={<div className="lab-fallback">The flow picture needs WebGL; the readouts and the plot below are computed without it.</div>}></Scene3D>
      </div>
      <VizCaption provenanceId="rg-gravity-flow-silk" status="conjectural">
        The Einstein–Hilbert truncation of asymptotic safety: the flow of the dimensionless Newton coupling <Eq tex="g"></Eq> (right) and cosmological constant{" "}
        <Eq tex="\lambda"></Eq> (up) with the optimised cutoff. Streaks follow the flow, drawn as a line integral convolution of its direction, and colour is the sign of{" "}
        <Eq tex="\beta_g"></Eq>; neither shows which way along a streak the scale runs. Rings mark the Gaussian and the non-Gaussian fixed point, the brighter line is the
        separatrix, the dashed curve is where <Eq tex="\eta_N"></Eq> diverges and the hatched band beyond <Eq tex="\lambda=\tfrac12"></Eq> is where the truncation is not
        defined. It is a truncation of an infinite tower and its numbers depend on the cutoff and gauge (see the table): a conjectural framework, not a result about nature.
      </VizCaption>
      <div className="viz-toolbar ug-bar ug-controls">
        <div className="ug-sliders">
          <GfRange labelTex="g_0" label="start value of the Newton coupling g" min={GF_RANGES.g[0]} max={GF_RANGES.g[1]} step={0.005} value={start.g}
            onChange={(v) => move("g", v)} format={(x) => x.toFixed(3)}></GfRange>
          <GfRange labelTex="\lambda_0" label="start value of the cosmological constant lambda" min={GF_RANGES.lambda[0]} max={GF_RANGES.lambda[1]} step={0.005} value={start.lambda}
            onChange={(v) => move("lambda", v)} format={(x) => x.toFixed(3)}></GfRange>
        </div>
      </div>
      <div className="ug-readouts" role="status" aria-live="polite">
        <div className="readout"><div className="readout-label">infrared fate</div>
          <div className="readout-value">{GF_TYPES[run.type]}{ended ? <span className="unit">— ends at {ended}</span> : null}</div></div>
        <div className="readout"><div className="readout-label"><Eq tex="k_{\mathrm{term}}/k_0"></Eq></div>
          <div className="readout-value">{run.tTerm !== null && run.tTerm !== undefined ? <Eq tex={`e^{${run.tTerm.toFixed(2)}}=${Math.exp(run.tTerm).toFixed(3)}`}></Eq> : "none"}</div></div>
        <div className="readout"><div className="readout-label"><Eq tex="(g_*,\lambda_*)"></Eq></div>
          <div className="readout-value"><Eq tex={`(${ngfp.g.toFixed(4)},\\ ${ngfp.lambda.toFixed(4)})`}></Eq></div></div>
        <div className="readout"><div className="readout-label"><Eq tex="\theta"></Eq> at the NGFP</div>
          <div className="readout-value"><Eq tex={gfTheta(ngfp.exponents[0])}></Eq></div></div>
      </div>
      {spec ? <Figure spec={spec}><span className="ug-fig-note">Toward the ultraviolet (right) both couplings settle at the fixed point; the start is at t = 0.</span></Figure>
        : <p className="lt-note">The start lies outside the truncation (the cosmological constant at or above one half, or g not positive); move it back inside.</p>}
      <VizCaption provenanceId="rg-gravity-flow-trajectory" status="conjectural">
        The couplings along the chosen trajectory against <Eq tex="t=\ln(k/k_0)"></Eq>. In the ultraviolet every trajectory with <Eq tex="g>0"></Eq> runs into the
        non-Gaussian fixed point, which is what asymptotic safety needs; in the infrared it is of Type Ia, IIa or IIIa. A Type IIIa run stops where the truncation breaks
        down, at <Eq tex="\lambda=\tfrac12"></Eq> or where <Eq tex="1-gB_2=0"></Eq>, and the figure stops there.
      </VizCaption>
      <div className="gf-schemes" role="region" aria-label="Fixed point and critical exponents in two schemes">
        <table className="fig-table">
          <caption>Scheme dependence of the non-Gaussian fixed point (d = 4)</caption>
          <thead><tr><th scope="col">scheme</th><th scope="col"><Eq tex="\lambda_*"></Eq></th><th scope="col"><Eq tex="\theta"></Eq></th></tr></thead>
          <tbody>
            <tr><th scope="row">optimised cutoff, Reuter &amp; Saueressig 2012</th><td>{ngfp.lambda.toFixed(4)}</td><td><Eq tex={gfTheta(ngfp.exponents[0])}></Eq></td></tr>
            <tr><th scope="row">harmonic gauge, Litim 2004</th><td>{litim.lambda.toFixed(4)}</td><td><Eq tex={gfTheta(litim.exponents[0])}></Eq></td></tr>
          </tbody>
        </table>
      </div>
      <div className="ug-cards">
        <FormulaCard title="Beta function of the Newton coupling" formulaId="as-beta-g" status="conjectural"
          symbols={[
            { s: "g", d: "Dimensionless Newton coupling, $g = k^2 G_k$." },
            { s: "\\eta_N", d: "Anomalous dimension of Newton's constant: $\\beta_g=(2+\\eta_N)\\,g$. At a non-Gaussian fixed point $\\eta_N=-2$." },
          ]}
          meaning="The two terms of the flow equation for $g$ are the classical scaling of a dimensionful coupling and the quantum correction from graviton loops; a non-Gaussian fixed point is where they cancel."
          limits="Einstein–Hilbert truncation, d = 4, optimised cutoff. The numbers change with the cutoff and the gauge; the structure of the flow does not."></FormulaCard>
        <FormulaCard title="Beta function of the cosmological constant" formulaId="as-beta-lambda" status="conjectural"
          symbols={[
            { s: "\\lambda", d: "Dimensionless cosmological constant, $\\lambda=\\bar\\lambda_k/k^2$." },
            { s: "\\eta_N", d: "The same anomalous dimension, entering through the term $\\propto\\eta_N$." },
          ]}
          meaning="The canonical term $-2\lambda$ pulls the dimensionless cosmological constant toward zero in the infrared; the loop terms are the quantum correction."
          limits="Singular at $\lambda=\tfrac12$ for the optimised cutoff; trajectories that reach it stop there."></FormulaCard>
      </div>
    </div>
  );
}

window.GravityFlowLab = GravityFlowLab;
