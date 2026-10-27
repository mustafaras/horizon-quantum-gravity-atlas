// lattice-lab.jsx — the field laboratory of the QFT module (S14): a classical phi^4 field on a 2+1D periodic lattice, evolved on the GPU.
// The science is js/science/lattice-field.mjs (the CPU reference the GPU kernels are compared with), the kernels are
// js/visualizations/qft/lattice-gpu.mjs and the scene js/visualizations/qft/lattice-scene.mjs (window.QGA_QFT_LATTICE); this file holds the controls,
// the readouts and the formula card. Without WebGL the one-dimensional lab (field-lab.jsx) runs the same physics on the CPU.

const LT_PRESETS = ["vacuum", "packets", "kink"];
const LT_READOUT_MS = 300;

/* ω(k) for the lab's mass (the mass gap made visible); a negative m² has no real dispersion, so the plot shows m = 0. */
function DispersionPlot({ mass }) {
  const spec = useMemo(() => window.QGA_FIGURE.plots.qft.dispersionSpec({ mass }), [mass]);
  return <div style={{ marginTop: 6 }}><Figure spec={spec}></Figure></div>;
}

/* The readouts live in their own component: a refresh every 300 ms must not rebuild the stage. */
function LatticeReadouts({ control }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    const id = setInterval(() => setStats(control.stats ? { ...control.stats } : null), LT_READOUT_MS);
    return () => clearInterval(id);
  }, [control]);
  const drift = stats && Number.isFinite(stats.drift) ? stats.drift : null;
  return (
    <div className="lt-readouts" role="group" aria-label="Lattice readouts">
      {stats && stats.software ? (
        <p className="lt-note" role="status">This device draws in software, which needs seconds per frame of the lattice: it rests until Play, Step or a click, and the GPU readouts are taken while it rests.</p>
      ) : null}
      <div className="readout"><div className="readout-label">simulated time <Eq tex="t"></Eq></div>
        <div className="readout-value">{stats ? stats.time.toFixed(1) : "—"}</div></div>
      <div className="readout"><div className="readout-label">energy above the vacuum <Eq tex="E"></Eq></div>
        <div className="readout-value">{stats && Number.isFinite(stats.energy) ? (Math.abs(stats.energy) < 1e4 ? stats.energy.toPrecision(4) : <Eq tex={sciTex(stats.energy, 3)}></Eq>) : "—"}</div></div>
      <div className="readout"><div className="readout-label">change since the last edit <Eq tex="|\Delta E|/E_0"></Eq></div>
        <div className="readout-value">{drift === null ? "—" : drift < 1e-9 ? <Eq tex="<10^{-9}"></Eq> : <Eq tex={sciTex(drift, 1)}></Eq>}</div></div>
      <div className="readout"><div className="readout-label">step <Eq tex="\Delta t"></Eq> and steps per frame</div>
        <div className="readout-value">{stats ? `${stats.dt.toFixed(3)} · ${stats.stepsPerFrame}` : "—"}</div></div>
      <div className="readout"><div className="readout-label">lattice and backend</div>
        <div className="readout-value">{stats ? `${stats.n} × ${stats.n} · ${stats.backend}` : "—"}</div></div>
    </div>
  );
}

function LatticeLab({ go }) {
  const L = window.QGA_QFT_LATTICE;
  const [atlas] = useQGAState();
  const seed = atlas.seed;
  const reducedMotion = usePRM();
  const [presetId, setPresetId] = useState("packets");
  const [mass2, setMass2] = useState(L.presets.packets.mass2);
  const [lambda, setLambda] = useState(L.presets.packets.lambda);
  const [running, setRunning] = useState(!reducedMotion);
  const [nonce, setNonce] = useState(0);
  const [bump, setBump] = useState(0);
  const control = useRef({ running: !reducedMotion, mass2, lambda, stepRequests: 0, contour: false, stats: null }).current;
  control.mass2 = mass2;
  control.lambda = lambda;
  control.contour = L.presets[presetId].contour;
  const safe = L.safeCouplings(mass2, lambda);
  const narrow = window.matchMedia("(max-width: 640px)").matches; // a narrow stage needs the camera further back to show the whole lattice

  const choose = (id) => {
    setPresetId(id);
    setMass2(L.presets[id].mass2);
    setLambda(L.presets[id].lambda);
  };
  const toggleRunning = () => { control.running = !control.running; setRunning(control.running); setBump((n) => n + 1); };
  const stepOnce = () => { control.stepRequests += 1; setBump((n) => n + 1); };

  const build = async (ctx) => {
    const { buildLatticeScene } = await L.loadScene();
    const built = await buildLatticeScene(ctx, { control, presetId, seed });
    setRunning(control.running); // the scene rests under reduced motion until Play, Step or a click
    return built;
  };

  return (
    <div className="viz-frame lt-lab" id="shot-section-qft">
      <div className="viz-toolbar lt-bar" role="group" aria-label="Lattice lab controls">
        {LT_PRESETS.map((id) => (
          <button key={id} type="button" className={"btn lt-btn" + (presetId === id ? " on" : "")} aria-pressed={presetId === id}
            onClick={() => choose(id)}>{L.presets[id].label}</button>
        ))}
        <button type="button" className={"btn lt-btn" + (running ? " on" : "")} aria-pressed={running} onClick={toggleRunning}>{running ? "Pause" : "Play"}</button>
        <button type="button" className="btn lt-btn" onClick={stepOnce}>Step</button>
        <button type="button" className="btn lt-btn" onClick={() => setNonce((n) => n + 1)}>Reset field</button>
      </div>
      <Scene3D animated={false} nodeKit height={460} shotSpace="qft-field" invalidateKey={`${presetId}|${mass2}|${lambda}|${running}|${bump}`}
        aria="Three-dimensional scalar field on a periodic lattice: a height field coloured by energy density; click to kick the field"
        initial={{ radius: narrow ? 27 : 18.5, theta: 0.5, phi: 1.02, minR: 8, maxR: 40, target: [0, 0.2, 0.4] }}
        build={build} deps={[presetId, seed, nonce]}
        fallback={<FieldLab></FieldLab>}></Scene3D>
      <div className="viz-toolbar lt-bar lt-controls">
        <div className="lt-sliders">
          <SliderRow label="mass squared" min={L.view.mass2Range[0]} max={L.view.mass2Range[1]} step={0.05} value={mass2}
            onChange={setMass2} format={(v) => v.toFixed(2)}></SliderRow>
          <SliderRow label="quartic coupling" min={L.view.lambdaRange[0]} max={L.view.lambdaRange[1]} step={0.05} value={lambda}
            onChange={setLambda} format={(v) => v.toFixed(2)}></SliderRow>
        </div>
      </div>
      {safe.lambda !== lambda ? (
        <p className="lt-note" role="status">
          With <Eq tex="m^2<0"></Eq> the quartic term must keep the potential bounded below: the simulation runs with <Eq tex={"\\lambda=" + safe.lambda.toFixed(2)}></Eq>.
        </p>
      ) : null}
      <LatticeReadouts control={control}></LatticeReadouts>
      <DispersionPlot mass={Math.sqrt(Math.max(mass2, 0))}></DispersionPlot>
      <VizCaption provenanceId="qft-lattice-phi4" status="effective">
        <RichText text={L.presets[presetId].hint.charAt(0).toUpperCase() + L.presets[presetId].hint.slice(1)}></RichText>.
        {" "}The surface is a real scalar field <Eq tex="\phi"></Eq> on a periodic lattice of spacing <Eq tex="a=0.25"></Eq> (<Eq tex="256\times256"></Eq> sites, <Eq tex="128\times128"></Eq> at low detail or on a software rasterizer),
        integrated on the GPU by the symplectic leapfrog from the equation <Eq tex="\ddot\phi=\nabla^{2}\phi-m^{2}\phi-\tfrac{\lambda}{6}\phi^{3}"></Eq>, whose
        energy <Eq tex="E"></Eq> is conserved to the order of the step (the readout shows its change since the last edit of a coupling or a click).
        The colour is the energy density above the vacuum; the four terms of the card below can be painted over it. This is a <strong>classical</strong> field:
        the vacuum sample is the Wigner sample of the free quantum ground state, and nothing here is a quantum computation. The simulated time of a frame is fixed,
        so the physics does not depend on the frame rate.
      </VizCaption>
      <div className="lt-cards">
        <FormulaCard title="Hamiltonian density of the lattice field" formulaId="qft-phi4-hamiltonian" status="established"
          symbols={[
            { s: "\\pi", d: "Momentum density conjugate to the field, $\\partial_t\\phi$; the lattice stores it at half steps and the readout synchronises it." },
            { s: "(\\nabla\\phi)^2", d: "Squared forward-difference gradient of the field in lattice units, $\\sum_i(\\phi_{x+e_i}-\\phi_x)^2/a^2$." },
            { s: "m^2", d: "Mass squared: positive gives one vacuum at $\\phi=0$, negative gives two vacua at $\\pm v$ with $v=\\sqrt{6|m^2|/\\lambda}$ and kinks between them." },
            { s: "\\lambda", d: "Quartic self-coupling; it makes the waves interact, and with $\\lambda=0$ two packets pass through each other." },
          ]}
          meaning="The energy stored at one site: its motion, its bending against the neighbours, its mass and its self-interaction. Click a term of the equation to paint it over the lattice; the colours are computed on the GPU from the same expression."
          limits="Classical field theory on a lattice with $a=0.25$ and a step of 0.05 to 0.1: the leapfrog's energy oscillates at order $(\omega_{\max}\Delta t)^2$ and has no secular drift. Not the interacting quantum vacuum."></FormulaCard>
      </div>
    </div>
  );
}
