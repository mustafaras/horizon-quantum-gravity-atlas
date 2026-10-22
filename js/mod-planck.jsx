// mod-planck.jsx — Module 05: Why Quantum Gravity Is Difficult
const LADDER_STOPS = [
  { log: 0, name: "Human scale — 1 m", note: "Classical physics; gravity and quantum theory both apply, in separate regimes." },
  { log: -5, name: "Cell / micron scale — 10⁻⁵ m", note: "Biology and soft matter; thermal physics dominates." },
  { log: -10, name: "Atomic scale — 10⁻¹⁰ m", note: "Quantum mechanics governs structure; gravity utterly negligible between particles." },
  { log: -15, name: "Nuclear scale — 10⁻¹⁵ m", note: "QCD territory: quarks, gluons, confinement. Probed by nuclear and hadron physics." },
  { log: -18, name: "Electroweak scale — ~10⁻¹⁸ m", note: "W, Z, Higgs physics. Roughly the resolution of the LHC (~10 TeV)." },
  { log: -19, name: "Collider frontier — ~10⁻¹⁹ m", note: "The shortest distance directly probed by any experiment to date." },
  { log: -30, name: "Speculative desert / GUT region", note: "No data. Grand unification, if real, would live near 10⁻³¹ m (10¹⁶ GeV)." },
  { log: -35, name: "Planck scale — 1.6×10⁻³⁵ m", note: "Quantum gravity regime: the classical picture of smooth spacetime can no longer be trusted." },
];

function PlanckFluctuationCanvas({ logRef }) {
  const prm = usePRM();

  const sim = useSimLoop((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    // proximity to Planck scale: 0 (far) → 1 (at Planck)
    const prox = Math.max(0, Math.min(1, (Math.max(-35, logRef.current) + 19) / (-35 + 19)));
    const fluct = Math.pow(Math.max(0, (prox - 0.55) / 0.45), 2); // only ramps up near the end
    const n = 13, gw = w / (n - 1), gh = h / (n - 1);
    const jit = (i, j, k) => {
      if (fluct === 0 || prm) return 0;
      return Math.sin(i * 2.7 + j * 1.9 + t * (1.5 + k) + k * 7) * fluct * Math.min(gw, gh) * 0.42;
    };
    ctx.lineWidth = 1;
    for (let j = 0; j < n; j++) {
      ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-67", (0.16 + fluct * 0.25).toFixed(3));
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = i * gw + jit(i, j, 1), y = j * gh + jit(i, j, 2);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < n; i++) {
      ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-67", (0.16 + fluct * 0.25).toFixed(3));
      ctx.beginPath();
      for (let j = 0; j < n; j++) {
        const x = i * gw + jit(i, j, 1), y = j * gh + jit(i, j, 2);
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.font = QGA_TOKENS.monoPx(10); ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-81", 0.75);
    if (fluct > 0.04) {
      ctx.fillText("metric fluctuations ~ O(1): classical geometry unreliable", 12, 20);
      ctx.fillStyle = QGA_TOKENS.alpha("pigment-amber-79-c12", 0.8);
      ctx.fillText("visualization is theory-dependent — discreteness/foam NOT established", 12, h - 12);
    } else {
      ctx.fillText("smooth classical spacetime — excellent approximation at this scale", 12, 20);
    }
  }, [prm]);
  return <canvas ref={sim.canvasRef} className="viz-canvas" style={{ height: 280 }}></canvas>;
}

function ScaleLadder() {
  const [logL, setLogL] = useState(-10);
  const logRef = useRef(logL); logRef.current = logL;

  const build = (ctx) => {
    const { THREE, scene } = ctx;
    scene.fog = new THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.016);
    scene.add(new THREE.AmbientLight(QGA_TOKENS.hex("pigment-blue-68"), 0.6));
    const yOf = (lg) => 5 - (-lg / 35) * 10;
    const depthColor = (lg) => {
      const f = Math.min(1, -lg / 35);
      const c = new THREE.Color(QGA_TOKENS.hex("pigment-blue-72"));
      return c.lerp(new THREE.Color(QGA_TOKENS.hex("pigment-violet-65")), Math.min(1, f * 1.3)).lerp(new THREE.Color(QGA_TOKENS.hex("pigment-orange-77")), Math.max(0, f - 0.7) / 0.3);
    };

    // faint starfield for depth
    const det0 = ctx.settings.current.detail3d;
    const starN = det0 === "low" ? 200 : 420;
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(starN * 3);
    for (let i = 0; i < starN; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, rr = Math.sqrt(1 - u * u), R = 30 + Math.random() * 36;
      sPos[i * 3] = Math.cos(a) * rr * R; sPos[i * 3 + 1] = u * R; sPos[i * 3 + 2] = Math.sin(a) * rr * R;
    }
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    scene.add(new THREE.Points(sGeo, new THREE.PointsMaterial({
      size: 1.1, map: qgaGlowTexture(), color: QGA_TOKENS.hex("pigment-blue-78-c08"), transparent: true,
      opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    })));

    // glowing descent axis
    const axis = ctx.line([new THREE.Vector3(0, 5.6, 0), new THREE.Vector3(0, -5.4, 0)], QGA_TOKENS.hex("pigment-blue-72"), 0.6);
    axis.material.blending = THREE.AdditiveBlending; axis.material.depthWrite = false;
    scene.add(axis);

    // truthful logarithmic ruler: a tick at every power of ten, labelled every 5 decades,
    // so the spacing between named stops reflects real decade counts (the "scales" are honest).
    for (let e = 0; e >= -35; e--) {
      const y = yOf(e);
      const major = e % 5 === 0;
      const tick = ctx.line(
        [new THREE.Vector3(-(major ? 0.52 : 0.26), y, 0), new THREE.Vector3(major ? 0.52 : 0.26, y, 0)],
        depthColor(e).getHex(), major ? 0.5 : 0.22);
      tick.material.blending = THREE.AdditiveBlending; tick.material.depthWrite = false;
      scene.add(tick);
      if (major) ctx.label("10" + supScript(e) + " m", () => ({ x: -2.7, y, z: 0 }), "s3d-quiet");
    }

    // "the desert": 16 orders of magnitude with no experimental data, between the collider
    // frontier (~10⁻¹⁹ m) and the Planck scale (~10⁻³⁵ m). Rendered as a dim shaded band.
    const desTop = yOf(-19), desBot = yOf(-35);
    const desert = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, desTop - desBot),
      new THREE.MeshBasicMaterial({ color: QGA_TOKENS.hex("pigment-blue-31"), transparent: true, opacity: 0.32,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    desert.position.set(0, (desTop + desBot) / 2, -0.05);
    scene.add(desert);
    ctx.annotation("the desert — 16 orders of magnitude, no experimental data",
      () => ({ x: 1.0, y: (desTop + desBot) / 2, z: 0 }));

    const rings = [];
    for (const s of LADDER_STOPS) {
      const hex = depthColor(s.log).getHex();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.04, 10, 80),
        new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.32,
          blending: THREE.AdditiveBlending, depthWrite: false }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = yOf(s.log);
      scene.add(ring);
      rings.push({ ring, log: s.log, hex });
      const lp = { x: 2.05, y: ring.position.y, z: 0 };
      ctx.label(s.name.split(" — ")[0], () => lp, "s3d-quiet");
    }

    const probe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16),
      new THREE.MeshBasicMaterial({ color: QGA_TOKENS.hex("pigment-cyan-89-c07") }));
    scene.add(probe);
    const pGlow = ctx.glow(QGA_TOKENS.hex("pigment-cyan-85"), 2.0, 0.7);
    scene.add(pGlow);
    const pHalo = ctx.glow(QGA_TOKENS.hex("pigment-cyan-85"), 4.0, 0.28);
    scene.add(pHalo);
    // descent beam: probe down to the Planck floor
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.13, 1, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: QGA_TOKENS.hex("pigment-blue-75"), transparent: true, opacity: 0.32,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    scene.add(beam);

    // Planck lattice at the bottom — distorts as the probe approaches
    const det = ctx.settings.current.detail3d;
    const NSEG = det === "low" ? 18 : det === "ultra" ? 30 : 24;
    const lat = new THREE.PlaneGeometry(6.5, 6.5, NSEG, NSEG);
    lat.rotateX(-Math.PI / 2);
    const latBase = lat.attributes.position.array.slice();
    const latMesh = new THREE.Mesh(lat, new THREE.MeshBasicMaterial({
      color: QGA_TOKENS.hex("pigment-amber-84"), wireframe: true, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    latMesh.position.y = -5.6;
    scene.add(latMesh);
    // foam glow bubbles that bloom up near the Planck scale
    const foam = [];
    for (let i = 0; i < 7; i++) {
      const g = ctx.glow(i % 2 ? QGA_TOKENS.hex("pigment-orange-82") : QGA_TOKENS.hex("pigment-violet-67"), 1.2, 0);
      const a = (i / 7) * Math.PI * 2;
      g.position.set(Math.cos(a) * 1.9, -5.6, Math.sin(a) * 1.9);
      scene.add(g);
      foam.push({ g, a, ph: i * 1.7 });
    }
    ctx.annotation("Planck-scale rendering is speculative — discreteness / 'foam' is NOT established",
      () => ({ x: 0, y: -6.4, z: 0 }));
    ctx.label("descent: 1 m → 10⁻³⁵ m", () => ({ x: -2.6, y: 5.9, z: 0 }), "s3d-strong");
    const latPos = lat.attributes.position;

    return {
      // The probe eases toward its slider target one frame at a time: keep drawing until it arrives, then idle
      // (the ambient shimmer only runs while playing with motion).
      isAnimated: () => Math.abs(yOf(logRef.current) - probe.position.y) > 1e-3 || (ctx.playing() && ctx.motion() > 0),
      update: (t) => {
        const lg = logRef.current;
        probe.position.y += (yOf(lg) - probe.position.y) * 0.12;
        pGlow.position.copy(probe.position);
        pHalo.position.copy(probe.position);
        const pulse = 1 + 0.08 * Math.sin(t * 3);
        pGlow.scale.setScalar(2.0 * pulse);
        pHalo.scale.setScalar(4.0 * pulse);
        // beam from probe to the floor
        const top = probe.position.y, bot = -5.6, hbeam = Math.max(0.1, top - bot);
        beam.position.set(0, (top + bot) / 2, 0);
        beam.scale.set(1, hbeam, 1);
        for (const { ring, log, hex } of rings) {
          const d = Math.abs(log - lg);
          ring.material.opacity = d < 2.5 ? 0.95 - d * 0.22 : 0.24;
          ring.scale.setScalar(d < 2.5 ? 1 + (2.5 - d) * 0.06 : 1);
        }
        const prox = Math.max(0, Math.min(1, (Math.max(-35, lg) + 19) / (-35 + 19)));
        const fluct = Math.pow(Math.max(0, (prox - 0.55) / 0.45), 2);
        const mo = ctx.motion();
        const tt = mo > 0 ? t * (1 + mo) : 0.7;
        for (let k = 0; k < latPos.count; k++) {
          const bx = latBase[k * 3], bz = latBase[k * 3 + 2];
          latPos.setY(k, fluct > 0 ? Math.sin(bx * 2.9 + bz * 2.1 + tt * 1.6) * fluct * 0.6 : 0);
        }
        latPos.needsUpdate = true;
        latMesh.material.opacity = 0.18 + fluct * 0.5;
        for (const f of foam) {
          const s = 0.6 + 0.5 * Math.sin(tt * 1.8 + f.ph);
          f.g.scale.setScalar((1.0 + s) * fluct);
          f.g.material.opacity = 0.55 * fluct;
          f.g.position.y = -5.6 + Math.sin(tt * 1.3 + f.ph) * 0.5 * fluct;
        }
      },
    };
  };

  const L = Math.pow(10, logL);
  const E_GeV = window.QGA_PHYSICS.probeEnergyGeV(L); // ħc ≈ 1.973×10⁻¹⁶ GeV·m
  const active = LADDER_STOPS.reduce((best, s) => (Math.abs(s.log - logL) < Math.abs(best.log - logL) ? s : best), LADDER_STOPS[0]);

  return (
    <div>
      <div className="viz-frame">
        <div className="viz-toolbar">
          <SliderRow label="length scale" min={-35} max={0} step={0.1} value={logL} onChange={setLogL}
            format={(v) => "10" + supScript(Math.round(v)) + " m"}></SliderRow>
          <span className="seg">
            {LADDER_STOPS.map((s) => (
              <button key={s.log} className={"btn" + (Math.abs(s.log - logL) < 0.6 ? " on" : "")}
                title={s.name} onClick={() => setLogL(s.log)}>10{supScript(s.log)}</button>
            ))}
          </span>
        </div>
        <Scene3D animated="motion" height={540} aria="Three-dimensional descent from human scale to the Planck scale"
          initial={{ radius: 15.5, theta: 0.32, phi: 1.2, target: [0, 0, 0], minR: 8, maxR: 34, bloom: { strength: 0.85, radius: 0.6, threshold: 0.14 } }}
          build={build} fallback={<PlanckFluctuationCanvas logRef={logRef}></PlanckFluctuationCanvas>}></Scene3D>
        <div className="viz-toolbar viz-toolbar-bottom readout-grid" style={{ display: "grid" }}>
          <div className="readout">
            <div className="readout-label">probe length l</div>
            <div className="readout-value">{sciNotation(L)}<span className="unit">m</span></div>
          </div>
          <div className="readout">
            <div className="readout-label">probe energy ħc / l</div>
            <div className="readout-value">{sciNotation(E_GeV)}<span className="unit">GeV</span></div>
          </div>
          <div className="readout">
            <div className="readout-label">vs. Planck energy</div>
            <div className="readout-value">{sciNotation(E_GeV / 1.22e19, 2)}<span className="unit">× E_P</span></div>
          </div>
          <div className="readout">
            <div className="readout-label">current regime</div>
            <div className="readout-value" style={{ fontSize: 12.5 }}>{active.name.split(" — ")[0]}</div>
          </div>
        </div>
        <VizCaption status="schematic">
          Resolving a length <Eq tex="l"></Eq> requires energy <Eq tex="E \approx \hbar c/l"></Eq>. Each tick is
          one power of ten, so the gulf you descend is honest: sixteen empty decades — <strong>the desert</strong> —
          separate the collider frontier from the Planck scale. Near <Eq tex="\ell_P"></Eq> the energy needed to
          probe a region would itself curve spacetime into a black hole of that size, and measurement and geometry
          become entangled.
        </VizCaption>
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h3>The scale ladder</h3>
        <div className="ladder-stops" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 4 }}>
          {LADDER_STOPS.map((s) => (
            <button key={s.log} className={"ladder-stop" + (s.log === active.log ? " on" : "")}
              onClick={() => setLogL(s.log)}
              style={{ cursor: "pointer", background: "none", border: "1px solid " + (s.log === active.log ? "var(--line-strong)" : "transparent"), font: "inherit", color: "inherit", textAlign: "left", width: "100%" }}>
              <span className="ls-len">10{supScript(s.log)} m</span>
              <span className="ls-name">{s.name.split(" — ")[0]}</span>
            </button>
          ))}
        </div>
        <p className="small" style={{ marginTop: 14 }}>{active.note}</p>
        <p className="small dim" style={{ marginBottom: 0 }}>
          Note the desert: sixteen orders of magnitude separate the collider frontier from the Planck scale —
          the same ratio as between a coin and the distance to the nearest star.
        </p>
      </div>
    </div>
  );
}

/* ---------- Prompt 08: spin-network / spin-foam lab ---------- */
function SpinFoamLab() {
  const [state, setState] = useQGAState();
  const [step, setStep] = useState(0);
  const topology = "four-simplex";
  const jMax = state.spinFoamJMax;
  const mode = state.spinFoamMode;
  const seed = state.seed;
  const lab = window.QGA_LABS && window.QGA_LABS.spinFoamLabState
    ? window.QGA_LABS.spinFoamLabState({ topology, jMaxHalf: jMax, seed, step: 0 }) : null;
  const steps = lab ? lab.steps : 1;
  const stepIndex = Math.min(step, steps - 1);

  const build = async (ctx) => {
    const LABS = window.QGA_LABS;
    if (!LABS) throw new Error("Compute-lab module unavailable");
    const { createSpinFoamRuntime } = await LABS.loadSpinFoam();
    ctx.scene.fog = new ctx.THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-11-c02"), 0.013);
    const runtime = createSpinFoamRuntime({ topology, jMaxHalf: jMax, seed, step: stepIndex, mode, camera: ctx.camera });
    ctx.scene.add(runtime.mesh);
    ctx.label("CONJECTURAL · pedagogical spin network — geometry from area ∝ √(j(j+1)), no amplitudes computed",
      () => ({ x: -4.2, y: 3.3, z: -3.2 }), "s3d-strong");
    ctx.label(mode === "foam"
      ? "each slice is one step of the deterministic foam history · y = evolution"
      : "tube color = spin (cyan → gold) · node size = quantum volume",
      () => ({ x: -4.2, y: -3.0, z: 3.2 }), "s3d-quiet");
    return {
      update: (t) => {
        runtime.sync({ time: t, motion: ctx.motion() === 0 ? 0 : 1 });
        window.__qgaSpinFoamLab = { kind: runtime.kind, ...runtime.stats() };
      },
      dispose: () => {
        runtime.dispose();
        delete window.__qgaSpinFoamLab;
      },
      recoverable: () => false,
    };
  };

  return (
    <div className="viz-frame">
      <div className="viz-toolbar lab-toolbar">
        <div className="kerr-control-group" aria-label="Spin-foam view">
          <span className="kerr-control-label">View</span>
          {[["network", "Spin network"], ["foam", "Foam history"]].map(([key, label]) => (
            <button key={key} className={"kerr-chip" + (mode === key ? " on" : "")}
              aria-pressed={mode === key} onClick={() => setState({ spinFoamMode: key })}>{label}</button>
          ))}
        </div>
        <SliderRow label="max spin j" min={1} max={4} step={1} value={jMax}
          onChange={(v) => setState({ spinFoamJMax: v })} format={(v) => String(v)}></SliderRow>
        {mode === "foam" ? (
          <SliderRow label="foam step" min={0} max={steps - 1} step={1} value={stepIndex}
            onChange={(v) => setStep(v)} format={(v) => `${v + 1} / ${steps}`}></SliderRow>
        ) : null}
        <div className="kerr-state-line lab-readout">
          {lab ? <>{lab.projection.points.length} nodes · {lab.projection.edges.length} edges ·
            <Eq tex="\sum"></Eq> area = {lab.config.totalArea.toFixed(2)} · <Eq tex="\sum"></Eq> volume = {lab.config.totalVolume.toFixed(2)}</> : "—"}
        </div>
      </div>
      <Scene3D animated="motion" height={440}
        aria="Three-dimensional spin network: a Schlegel-projected four-simplex with colored edge tubes, volume-weighted node spheres and translucent face membranes; foam mode ghosts the deterministic step history along an evolution axis"
        initial={{ radius: 9.5, theta: 0.7, phi: 1.25, minR: 4, maxR: 28, bloom: { strength: 0.75, radius: 0.55, threshold: 0.16 } }}
        build={build} deps={[jMax, mode, seed, stepIndex]}
        fallback={<div className="lab-fallback">The 3-D spin-foam lab needs WebGL; the area spectrum above is computed without it.</div>}></Scene3D>
      <VizCaption status="conjectural">
        The graph is a real combinatorial object: edges carry half-integer spins j, and the area of each surface is
        <Eq tex="A = 8\pi\gamma\,\ell_P^2\,\sqrt{j(j+1)}"></Eq> — the LQG area spectrum, computed here in Planck
        units by <code>js/science/spin-networks.mjs</code>. Node volumes come from the Cayley–Menger determinant of
        the four edge spins (4-valent nodes only). Foam mode walks a deterministic sequence of re-labellings — a
        <strong>pedagogical sketch</strong> of a spin-foam history, not a path integral: no spin-foam amplitudes are
        computed, and the model is conjectural. What is established is the spectrum arithmetic; what is open is
        whether spacetime really is made of this.
      </VizCaption>
    </div>);
}

function ModulePlanck({ go }) {
  return (
    <article>
      <ModuleHeader num="05" kicker="The obstruction" title="Why Quantum Gravity Is Difficult"
        lede="Quantum field theory assumes a fixed spacetime stage; general relativity makes the stage itself dynamical. Reconciling the two is not a matter of missing cleverness alone — concrete technical obstructions appear the moment one tries, and they point to the Planck scale."></ModuleHeader>

      <Section title="The structural conflict">
        <p>
          Every quantum field theory in Modules 01–03 is formulated <em>on</em> a spacetime: fields are functions of
          spacetime points, causality is defined by its light cones, and time evolution is generated relative to its
          clock. General relativity removes that scaffolding — the metric is a dynamical field like any other. A
          quantum theory of gravity must therefore quantize the very structure that quantum theory normally
          presupposes. Two famous symptoms of this circularity: <strong>background independence</strong> (what do we
          expand around, if geometry itself fluctuates?) and the <strong>problem of time</strong> (the canonical
          Hamiltonian becomes a constraint, ĤΨ = 0, with no external time parameter left to evolve in).
        </p>
      </Section>

      <Section title="Non-renormalizability">
        <p>
          The technical obstruction is sharper. Newton's constant has mass dimension −2, so the dimensionless strength
          of gravity at energy E grows as <Eq tex="G E^2 / (\hbar c^5)"></Eq>. Loop corrections in perturbative quantum
          gravity therefore produce divergences of ever-increasing severity: 't Hooft and Veltman exhibited the
          one-loop divergences of gravity with matter (1974), and Goroff and Sagnotti proved pure gravity diverges at
          two loops (1986). Absorbing them requires infinitely many independent counterterms — infinitely many
          measurements to fix the theory. Predictivity collapses precisely at the Planck scale, where the expansion
          parameter reaches unity.
        </p>
        <div className="formula-grid">
          <FormulaCard title="Planck units" status="established"
            tex="l_P = \sqrt{\frac{\hbar G}{c^3}} \approx 1.6\times10^{-35}\,\mathrm{m}, \quad E_P = \sqrt{\frac{\hbar c^5}{G}} \approx 1.22\times10^{19}\,\mathrm{GeV}"
            symbols={[
              { s: "l_P", d: "Planck length — the unique length built from ħ, G, c. Also: the Schwarzschild radius of a Planck-mass black hole, up to O(1) factors." },
              { s: "E_P", d: "Planck energy (≈ 2 GJ — a lightning bolt's energy in a single quantum). Planck mass m_P ≈ 2.18×10⁻⁸ kg." },
            ]}
            meaning="Dimensional analysis alone locates the quantum gravity regime: where the Compton wavelength of an object equals its Schwarzschild radius."
            limits="These are scales, not measured thresholds. What actually happens there is unknown."></FormulaCard>
          <FormulaCard title="Perturbative expansion of the metric" status="effective"
            tex="g_{\mu\nu} = \eta_{\mu\nu} + \kappa\, h_{\mu\nu}, \qquad \kappa^2 = 32\pi G"
            symbols={[
              { s: "\\eta_{\\mu\\nu}", d: "Fixed flat background metric — the move that surrenders background independence." },
              { s: "h_{\\mu\\nu}", d: "Graviton field: quantized weak-field ripples, spin 2." },
              { s: "\\kappa", d: "Gravitational coupling; dimensionful, with [κ] = energy⁻¹ — the origin of non-renormalizability." },
            ]}
            meaning="The standard route to 'quantum gravity as a QFT'. It works beautifully — but only as an effective theory at energies far below E_P."
            limits="The expansion is in κE ~ E/E_P; at Planckian energies every order contributes equally and the series tells you nothing."></FormulaCard>
          <FormulaCard title="Growth of the effective coupling" status="established"
            tex="\alpha_{\mathrm{grav}}(E) \sim \frac{G E^2}{\hbar c^5} = \left(\frac{E}{E_P}\right)^{2}"
            symbols={[
              { s: "\\alpha_{\\mathrm{grav}}", d: "Dimensionless measure of gravity's strength at energy E (compare α ≈ 1/137 for electromagnetism)." },
              { s: "E/E_P", d: "At LHC energies this is ~10⁻¹⁵, making quantum gravity effects experimentally invisible — and the theory's UV behavior untestable directly." },
            ]}
            meaning="Contrast with the gauge couplings of Module 03, which run logarithmically. Gravity's strength grows as a power law — the renormalization group flow leaves the perturbative domain."
            limits="Schematic scaling argument; the asymptotic safety program (Module 06) conjectures the full nonperturbative flow may nonetheless reach a fixed point."></FormulaCard>
        </div>
      </Section>

      <Section title="Descent to the Planck scale">
        <p>
          Drag the slider to descend from human scale to the Planck length. The grid represents the operational
          notion of smooth classical geometry; near the Planck scale, combining the uncertainty principle with
          gravity suggests metric fluctuations of order unity — the regime where every approach in Module 06 must
          say something new.
        </p>
        <ScaleLadder></ScaleLadder>
      </Section>

      <Section title="Spin networks and spin foam, computed">
        <p>
          Loop quantum gravity proposes that area and volume come in discrete quanta carried by a graph: edges
          labelled by spins, nodes by intertwiners. This lab builds a real one — a Schlegel-projected four-simplex
          with admissible spin labels drawn from the shared seed — and renders it in three dimensions: edge tubes
          colored by the area they carry, node spheres sized by quantum volume, and a foam mode that ghosts the
          deterministic step history along an evolution axis. Every number on screen (area spectrum, total area,
          node volumes) is computed by <code>js/science/spin-networks.mjs</code>; the foam dynamics are a disclosed
          pedagogical sketch, not a computed path integral.
        </p>
        <SpinFoamLab></SpinFoamLab>
      </Section>

      <Misconception title="Spacetime discreteness is not established.">
        The fluctuating grid above is a visualization aid, not an observation. Whether spacetime at the Planck
        scale is discrete, foamy, stringy, emergent, or smooth-but-quantum is precisely what the competing
        research programs disagree about. No experiment currently distinguishes them.
      </Misconception>
      <Misconception title="Gravity has been quantized — at low energies.">
        The statement 'quantum gravity does not exist' is too strong. As an effective field theory, graviton
        loops give finite, unambiguous corrections at accessible energies (Module 06). What is missing is the
        ultraviolet completion: the theory valid at and beyond the Planck scale.
      </Misconception>
      <ConceptBridge id="planck-approaches" go={go}></ConceptBridge>
    </article>
  );
}

window.ModulePlanck = ModulePlanck;
