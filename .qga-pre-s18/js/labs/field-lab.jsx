// field-lab.jsx — the one-dimensional field laboratory (S14): the CPU reference of the phi^4 lattice, js/science/lattice-field.mjs in 1+1 dimensions,
// drawn as a waterfall. It is what the 2+1D GPU lattice lab (lattice-lab.jsx) falls back to without WebGL, and it runs the same physics: the
// leapfrog on a periodic line of 256 sites (a = 0.25, dt = 0.1, four steps per frame, so the simulated time of a frame is fixed), no damping, no tuned
// constants. A click is the seeded Gaussian kick of the lattice; the scalar, spinor and gauge buttons change the colour and the note, not the dynamics.

const FL_SITES = 256;
const FL_STEPS_PER_FRAME = 4;
const FL_DT = 0.1;
const FL_ROWS = 14;
const FL_KIND_COLOR = () => ({ scalar: QGA_TOKENS.css("pigment-cyan-78"), spinor: QGA_TOKENS.css("pigment-violet-72"), gauge: QGA_TOKENS.css("pigment-azure-74") });
const FL_KIND_NOTE = {
  scalar: "Scalar field φ(x): one real amplitude per point. The Higgs field is the Standard Model's only fundamental scalar.",
  spinor: "Spinor field ψ(x): rendered here as the same amplitude — physically it carries four complex components and spin-½. All matter fields are spinors.",
  gauge: "Gauge field A(x): rendered as the same amplitude — physically a four-vector with gauge redundancy. Photons and gluons are its quanta.",
};

function FieldLab() {
  const L = window.QGA_QFT_LATTICE;
  const N = FL_SITES;
  const [mass, setMass] = useState(1.2);
  const [kind, setKind] = useState("scalar");
  const [annot, setAnnot] = useState(true);
  const massRef = useRef(mass); massRef.current = mass;
  const annotRef = useRef(annot); annotRef.current = annot;
  const kindRef = useRef(kind); kindRef.current = kind;
  const fieldRef = useRef(null);
  const labelsRef = useRef([]); // {x, t0}
  const histRef = useRef([]);
  const clicksRef = useRef(0);

  const lattice = (m) => L.science.createLattice({ dim: 1, n: N, a: L.view.spacing, mass2: m * m, lambda: 0, dt: FL_DT });
  const initField = () => {
    fieldRef.current = { phi: new Float64Array(N), pi: new Float64Array(N) };
    labelsRef.current = [];
    histRef.current = [];
  };
  if (!fieldRef.current) initField();

  const sim = useSimLoop((ctx, w, h, t, dt) => {
    if (dt > 0) {
      // The state is replaced, never edited: evolve() returns the field after the four steps of this frame.
      fieldRef.current = L.science.evolve(lattice(massRef.current), fieldRef.current, FL_STEPS_PER_FRAME);
      histRef.current.unshift(Float64Array.from(fieldRef.current.phi));
      if (histRef.current.length > FL_ROWS) histRef.current.pop();
    }
    const phi = fieldRef.current.phi;
    ctx.clearRect(0, 0, w, h);
    const baseY = h * 0.62, amp = h * 0.3;
    // measurement ticks
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.12); ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0; x <= w; x += w / 16) { ctx.moveTo(x, baseY - 4); ctx.lineTo(x, baseY + 4); }
    ctx.moveTo(0, baseY); ctx.lineTo(w, baseY); ctx.stroke();
    // waterfall history
    const col = FL_KIND_COLOR()[kindRef.current];
    histRef.current.forEach((row, k) => {
      const a = 0.22 * (1 - k / FL_ROWS);
      ctx.strokeStyle = col.replace(")", " / " + a.toFixed(3) + ")");
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = i / (N - 1) * w, y = baseY - row[i] * amp - (k + 1) * 7;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    // live trace with glow
    ctx.save();
    ctx.shadowColor = col; ctx.shadowBlur = 10;
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1) * w, y = baseY - phi[i] * amp;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    // quanta labels (fade out)
    if (annotRef.current) {
      ctx.font = QGA_TOKENS.monoPx(10); ctx.textAlign = "center";
      labelsRef.current = labelsRef.current.filter((q) => t - q.t0 < 3.2);
      for (const q of labelsRef.current) {
        const a = Math.max(0, 1 - (t - q.t0) / 3.2);
        ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-88", (a * 0.85).toFixed(3));
        ctx.fillText("localized excitation — particle-like quantum", q.x, baseY - amp * 0.95);
        ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-88", (a * 0.3).toFixed(3));
        ctx.beginPath(); ctx.moveTo(q.x, baseY - amp * 0.9); ctx.lineTo(q.x, baseY - amp * 0.55); ctx.stroke();
      }
      ctx.textAlign = "left";
      ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.5);
      ctx.fillText("φ(x, t)", 12, 18);
      ctx.fillText("vacuum ⟨φ⟩ = 0", 12, baseY + 16);
    }
  }, []);

  const excite = (e) => {
    const cv = sim.canvasRef.current;
    const r = cv.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    clicksRef.current += 1;
    const seed = L.kickSeed(qgaReadState().seed, clicksRef.current);
    fieldRef.current = L.science.kick(lattice(massRef.current), fieldRef.current, { site: [Math.round(fx * (N - 1))], seed });
    labelsRef.current.push({ x: fx * r.width, t0: sim.tRef.current });
  };

  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <span className="seg">
          {["scalar", "spinor", "gauge"].map((k) =>
            <button key={k} className={"btn" + (kind === k ? " on" : "")} onClick={() => setKind(k)}>{k}</button>
          )}
        </span>
        <SliderRow label="mass m" min={0} max={3} step={0.05} value={mass} onChange={setMass}
          format={(v) => v.toFixed(2)}></SliderRow>
      </div>
      <canvas ref={sim.canvasRef} className="viz-canvas" style={{ height: 300, cursor: "crosshair" }}
        onPointerDown={excite}></canvas>
      <SimBar sim={sim}>
        <Toggle label="annotations" checked={annot} onChange={setAnnot}></Toggle>
        <button className="btn" onClick={() => { initField(); sim.reset(); }}>Clear field</button>
      </SimBar>
      <VizCaption provenanceId="qft-field-kinds" status="schematic">
        Click anywhere to kick the field. Disturbances obey the lattice Klein–Gordon equation on a periodic line: wave packets
        disperse, wrap around and interfere. Raising the mass <Eq tex="m"></Eq> stiffens the field and slows propagation.
        {" "}{FL_KIND_NOTE[kind]}
      </VizCaption>
    </div>);
}
