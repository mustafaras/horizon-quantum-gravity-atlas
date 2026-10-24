// mod-qft.jsx — Module 02: Quantum Field Theory
/* ---------- Field laboratory: 1D Klein-Gordon lattice with waterfall rendering ---------- */
function FieldLab() {
  const N = 220;
  const fieldRef = useRef(null);
  const [mass, setMass] = useState(1.2);
  const [kind, setKind] = useState("scalar");
  const [annot, setAnnot] = useState(true);
  const massRef = useRef(mass);massRef.current = mass;
  const annotRef = useRef(annot);annotRef.current = annot;
  const kindRef = useRef(kind);kindRef.current = kind;
  const labelsRef = useRef([]); // {x, t0}
  const histRef = useRef([]);

  const initField = () => {
    fieldRef.current = { phi: new Float64Array(N), pi: new Float64Array(N) };
    labelsRef.current = [];
    histRef.current = [];
  };
  if (!fieldRef.current) initField();

  const KIND_COLOR = { scalar: QGA_TOKENS.css("pigment-cyan-78"), spinor: QGA_TOKENS.css("pigment-violet-72"), gauge: QGA_TOKENS.css("pigment-azure-74") };
  const KIND_NOTE = {
    scalar: "Scalar field φ(x): one real amplitude per point. The Higgs field is the Standard Model's only fundamental scalar.",
    spinor: "Spinor field ψ(x): rendered here as the same amplitude — physically it carries four complex components and spin-½. All matter fields are spinors.",
    gauge: "Gauge field A(x): rendered as the same amplitude — physically a four-vector with gauge redundancy. Photons and gluons are its quanta."
  };

  const sim = useSimLoop((ctx, w, h, t, dt) => {
    const F = fieldRef.current;
    const m = massRef.current;
    // integrate (sub-steps for stability): φ̈ = c²∇²φ − m²φ − γ φ̇
    const c2 = 14000,gam = 0.12,dx = w / N;
    const steps = 4,sdt = Math.min(dt, 0.034) / steps;
    if (sdt > 0) {
      for (let s = 0; s < steps; s++) {
        const { phi, pi } = F;
        for (let i = 0; i < N; i++) {
          const l = phi[(i - 1 + N) % N],r = phi[(i + 1) % N];
          const lap = (l + r - 2 * phi[i]) / (dx * dx);
          pi[i] += sdt * (c2 * lap * 14 - m * m * 22 * phi[i] - gam * pi[i]);
        }
        for (let i = 0; i < N; i++) phi[i] += sdt * pi[i];
      }
    }
    // record history snapshot ~every 90ms of sim time
    if (!F.lastSnap || t - F.lastSnap > 0.09) {
      F.lastSnap = t;
      histRef.current.unshift(Float64Array.from(F.phi));
      if (histRef.current.length > 14) histRef.current.pop();
    }
    // render
    ctx.clearRect(0, 0, w, h);
    const baseY = h * 0.62,amp = h * 0.3;
    // measurement ticks
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.12);ctx.lineWidth = 1;ctx.beginPath();
    for (let x = 0; x <= w; x += w / 16) {ctx.moveTo(x, baseY - 4);ctx.lineTo(x, baseY + 4);}
    ctx.moveTo(0, baseY);ctx.lineTo(w, baseY);ctx.stroke();
    // waterfall history
    const col = KIND_COLOR[kindRef.current];
    histRef.current.forEach((row, k) => {
      const a = 0.22 * (1 - k / 14);
      ctx.strokeStyle = col.replace(")", " / " + a.toFixed(3) + ")");
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = i / (N - 1) * w,y = baseY - row[i] * amp - (k + 1) * 7;
        if (i === 0) ctx.moveTo(x, y);else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    // live trace with glow
    ctx.save();
    ctx.shadowColor = col;ctx.shadowBlur = 10;
    ctx.strokeStyle = col;ctx.lineWidth = 2;ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1) * w,y = baseY - F.phi[i] * amp;
      if (i === 0) ctx.moveTo(x, y);else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    // quanta labels (fade out)
    if (annotRef.current) {
      ctx.font = QGA_TOKENS.monoPx(10);ctx.textAlign = "center";
      labelsRef.current = labelsRef.current.filter((L) => t - L.t0 < 3.2);
      for (const L of labelsRef.current) {
        const a = Math.max(0, 1 - (t - L.t0) / 3.2);
        ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-88", (a * 0.85).toFixed(3));
        ctx.fillText("localized excitation — particle-like quantum", L.x, baseY - amp * 0.95);
        ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-88", (a * 0.3).toFixed(3));
        ctx.beginPath();ctx.moveTo(L.x, baseY - amp * 0.9);ctx.lineTo(L.x, baseY - amp * 0.55);ctx.stroke();
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
    const i0 = Math.round(fx * (N - 1));
    const { phi } = fieldRef.current;
    for (let i = 0; i < N; i++) {
      const d = i - i0;
      phi[i] += 0.85 * Math.exp(-(d * d) / 60);
    }
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
        <button className="btn" onClick={() => {initField();sim.reset();}}>Clear field</button>
      </SimBar>
      <VizCaption status="schematic">
        Click anywhere to excite the field. Disturbances obey a discretized Klein–Gordon equation: wave packets
        disperse, reflect, and interfere. Raising the mass m stiffens the field and slows propagation.
        {" "}{KIND_NOTE[kind]}
      </VizCaption>
    </div>);

}

/* ---------- 3D field laboratory: Klein–Gordon membrane ---------- */
function FieldLab3D() {
  const [mass, setMass] = useState(1.0);
  const massRef = useRef(mass);massRef.current = mass;
  const fieldRef = useRef(null);
  const clearField = () => {
    const F = fieldRef.current;
    if (F) {F.phi.fill(0);F.pi.fill(0);}
  };

  const build = (ctx) => {
    const { THREE, scene, camera } = ctx;
    const parked = ctx.motion() === 0; // reduced motion: frozen shimmer, no stepping
    scene.fog = new THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.016);
    scene.add(new THREE.AmbientLight(QGA_TOKENS.hex("pigment-blue-68"), 0.55));
    const key = new THREE.DirectionalLight(QGA_TOKENS.hex("pigment-blue-86"), 0.9);
    key.position.set(5, 9, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(QGA_TOKENS.hex("pigment-blue-62-c20"), 0.45);
    rim.position.set(-6, 3, -8);
    scene.add(rim);
    const floor = ctx.grid(18, 18, QGA_TOKENS.hex("pigment-blue-35"), 0.12);
    floor.position.y = -2.5;
    scene.add(floor);

    const det = ctx.settings.current.detail3d;
    const N = det === "low" ? 48 : det === "ultra" ? 88 : 64;
    const SIZE = 11.5;
    fieldRef.current = { phi: new Float64Array(N * N), pi: new Float64Array(N * N) };

    const geo = new THREE.PlaneGeometry(SIZE, SIZE, N - 1, N - 1);
    geo.rotateX(-Math.PI / 2);
    const colAttr = new THREE.BufferAttribute(new Float32Array(N * N * 3), 3);
    geo.setAttribute("color", colAttr);
    const surf = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true, metalness: 0.4, roughness: 0.3,
      emissive: QGA_TOKENS.hex("pigment-blue-21-c05"), emissiveIntensity: 0.75, side: THREE.DoubleSide,
      flatShading: false,
    }));
    scene.add(surf);

    // luminous lattice overlay with its OWN colours: a visible oscillator grid at
    // rest (the field is a value at every point), brightening to the crest colour
    // where the field is excited. Edges dissolve into the fog.
    const wColAttr = new THREE.BufferAttribute(new Float32Array(N * N * 3), 3);
    const geoGlow = new THREE.BufferGeometry();
    geoGlow.setIndex(geo.index);
    geoGlow.setAttribute("position", geo.attributes.position);
    geoGlow.setAttribute("color", wColAttr);
    const wire = new THREE.Mesh(geoGlow, new THREE.MeshBasicMaterial({
      vertexColors: true, wireframe: true, transparent: true, opacity: 0.34,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    wire.renderOrder = 2;
    scene.add(wire);

    const base = new THREE.Color(QGA_TOKENS.hex("pigment-blue-23"));
    const up = new THREE.Color(QGA_TOKENS.hex("pigment-cyan-85"));
    const dn = new THREE.Color(QGA_TOKENS.hex("pigment-violet-71-c15"));
    const white = new THREE.Color(QGA_TOKENS.hex("pigment-white"));
    const cWire = new THREE.Color(QGA_TOKENS.hex("pigment-blue-41"));
    const tmp = new THREE.Color();

    // deterministic vacuum shimmer: the vacuum is never still — a fixed spectrum
    // of seeded modes oscillates at ω = √(c²k² + m²c⁴)/ħ, so raising the mass
    // visibly quickens even the zero-point shimmer (the mass gap, made visible).
    const vRandom = QGA_SEEDED((qgaReadState().seed ^ 0x51ce) >>> 0);
    const vModes = [];
    for (let i = 0; i < 6; i++) {
      const kx = (vRandom() * 2 - 1) * 1.9, kz = (vRandom() * 2 - 1) * 1.9;
      vModes.push({ kx, kz, k2: kx * kx + kz * kz, amp: 0.03 + vRandom() * 0.036, ph: vRandom() * Math.PI * 2 });
    }
    let simClock = parked ? 2.4 : 0;

    const pos = geo.attributes.position;
    const dx = SIZE / N;
    const half = SIZE / 2;
    const vfade = new Float32Array(N * N);
    for (let k = 0; k < N * N; k++) {
      const e = Math.max(Math.abs(pos.getX(k)), Math.abs(pos.getZ(k))) / half;
      const t0 = Math.min(1, Math.max(0, (e - 0.76) / 0.24));
      vfade[k] = 1 - t0 * t0 * (3 - 2 * t0);
    }

    // injection markers: a brief luminous bloom where energy entered the field
    const markerGeo = new THREE.PlaneGeometry(1, 1);
    const markers = [];
    const injectMarker = (wx, wy, wz) => {
      if (markers.length >= 6) {
        const old = markers.shift();
        scene.remove(old.s); old.s.material.dispose();
      }
      const s = new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({
        map: qgaGlowTexture(), color: QGA_TOKENS.hex("pigment-azure-92"), transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
      }));
      s.renderOrder = 5;
      s.position.set(wx, wy, wz);
      s.scale.setScalar(0.9);
      s.quaternion.copy(camera.quaternion);
      scene.add(s);
      markers.push({ s, age: 0 });
    };

    ctx.label("φ(x, y, t) — field amplitude", () => ({ x: -half, y: 2.3, z: -half }), "s3d-strong");
    ctx.label("vacuum ⟨φ⟩ = 0 — irreducible fluctuations", () => ({ x: half - 1.1, y: 0.62, z: half - 1.1 }), "s3d-quiet");
    ctx.annotation("click the surface to inject a localized excitation — a particle-like quantum",
    () => ({ x: 0, y: 2.1, z: 2.1 }));

    return {
      pickables: [surf],
      onPick: (obj, hit) => {
        if (!hit || !hit.uv) return;
        const F = fieldRef.current;
        const i0 = Math.round(hit.uv.x * (N - 1));
        const j0 = Math.round((1 - hit.uv.y) * (N - 1));
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
          const d2 = (i - i0) * (i - i0) + (j - j0) * (j - j0);
          if (d2 < 90) F.phi[j * N + i] += Math.exp(-d2 / 18);
        }
        if (hit.point) injectMarker(hit.point.x, hit.point.y + 0.3, hit.point.z);
      },
      update: (t, dt) => {
        const F = fieldRef.current;
        const m = massRef.current;
        const run = !parked && dt > 0;
        if (run) simClock += Math.min(dt, 0.05);
        // living vacuum: faint zero-point kicks keep the membrane restless
        if (run) {
          for (let n = 0; n < 5; n++) {
            const rk = Math.random() * N * N | 0;
            F.pi[rk] += (Math.random() - 0.5) * 0.5;
          }
        }
        const steps = 3, sdt = Math.min(dt, 0.034) / steps;
        if (run && sdt > 0) {
          const { phi, pi } = F;
          const c2 = 30, gam = 0.35;
          for (let s = 0; s < steps; s++) {
            for (let j = 0; j < N; j++) {
              for (let i = 0; i < N; i++) {
                const k = j * N + i;
                const l = i > 0 ? phi[k - 1] : 0, r = i < N - 1 ? phi[k + 1] : 0;
                const u = j > 0 ? phi[k - N] : 0, d = j < N - 1 ? phi[k + N] : 0;
                const lap = (l + r + u + d - 4 * phi[k]) / (dx * dx);
                pi[k] += sdt * (c2 * lap - m * m * 9 * phi[k] - gam * pi[k]);
              }
            }
            for (let k = 0; k < N * N; k++) phi[k] += sdt * pi[k];
          }
        }
        const { phi } = F;
        const ts = simClock;
        for (let k = 0; k < N * N; k++) {
          const x = pos.getX(k), z = pos.getZ(k);
          let sh = 0;
          for (let i = 0; i < 6; i++) {
            const md = vModes[i];
            sh += md.amp * Math.sin(md.kx * x + md.kz * z - Math.sqrt(30 * md.k2 + 9 * m * m) * ts + md.ph);
          }
          const a = phi[k] + sh;
          pos.setY(k, a * 1.9);
          const aa = Math.abs(a);
          const mag = Math.min(1, aa * 1.4);
          tmp.copy(base).lerp(a >= 0 ? up : dn, mag);
          tmp.lerp(white, Math.max(0, Math.min(0.55, (aa - 0.55) * 0.6)));
          tmp.multiplyScalar(vfade[k]);
          colAttr.setXYZ(k, tmp.r, tmp.g, tmp.b);
          tmp.copy(cWire).lerp(a >= 0 ? up : dn, mag * 0.85);
          if (aa > 0.6) tmp.lerp(white, Math.min(1, (aa - 0.6) * 1.4));
          tmp.multiplyScalar(vfade[k]);
          wColAttr.setXYZ(k, tmp.r, tmp.g, tmp.b);
        }
        pos.needsUpdate = true;
        colAttr.needsUpdate = true;
        wColAttr.needsUpdate = true;
        geo.computeVertexNormals();
        for (let i = markers.length - 1; i >= 0; i--) {
          const mk = markers[i];
          mk.s.quaternion.copy(camera.quaternion);
          if (run) {
            mk.age += dt;
            const f = Math.min(1, mk.age / 1.1);
            mk.s.scale.setScalar(0.9 + f * 1.5);
            mk.s.material.opacity = 0.85 * (1 - f) * (1 - f);
            if (mk.age > 1.1) { scene.remove(mk.s); mk.s.material.dispose(); markers.splice(i, 1); }
          } else {
            mk.s.material.opacity = 0.6; // reduced motion: static marker
          }
        }
      }
    };
  };

  return (
    <div className="viz-frame" id="shot-section-qft">
      <div className="viz-toolbar">
        <SliderRow label="mass m" min={0} max={3} step={0.05} value={mass} onChange={setMass}
        format={(v) => v.toFixed(2)}></SliderRow>
        <button className="btn" onClick={clearField}>Clear field</button>
      </div>
      <Scene3D animated height={430} shotSpace="qft-field" aria="Interactive three-dimensional scalar field membrane; click to excite the field"
      initial={{ radius: 13.2, theta: 0.52, phi: 1.06, minR: 7, maxR: 32, bloom: { strength: 0.85, radius: 0.5, threshold: 0.16 } }}
      build={build} fallback={<FieldLab></FieldLab>}></Scene3D>
      <DispersionPlot mass={mass}></DispersionPlot>
      <VizCaption status="schematic">
        A two-dimensional slice of a scalar field, integrating the Klein–Gordon equation
        <Eq tex="\partial_t^2\phi = c^2\nabla^2\phi - m^2\phi"></Eq> in real time. Click the membrane to deposit
        energy: the wave packet disperses, reflects, and interferes. Its modes obey the dispersion relation
        <Eq tex="\omega^2 = c^2 k^2 + m^2"></Eq> plotted above — the defining feature is the <strong>mass gap</strong>:
        even at zero wavenumber a massive field oscillates at <Eq tex="\omega_0 = mc^2/\hbar"></Eq>, the rest energy
        of its quantum. Raising m lifts the whole curve and slows propagation; at m = 0 it collapses onto the massless
        light cone <Eq tex="\omega = ck"></Eq>. In the quantum theory these excitations are quantized — one quantum is
        a particle. Spinor and gauge fields carry more components than this single amplitude; the 1D analytical view
        (shown when 3D is unavailable) explains the difference.
      </VizCaption>
    </div>);

}

/* ---------- dispersion relation ω(k) for the field lab (ties mass → mass gap) ---------- */
function DispersionPlot({ mass }) {
  const spec = useMemo(() => window.QGA_FIGURE.plots.qft.dispersionSpec({ mass }), [mass]);
  return <div style={{ marginTop: 6 }}><Figure spec={spec}></Figure></div>;
}

/* ---------- Feynman diagram builder ---------- */
const FEY_PARTICLES = [
{ id: "e-", label: "e⁻", q: -1, le: 1, lmu: 0, type: "lepton" },
{ id: "e+", label: "e⁺", q: 1, le: -1, lmu: 0, type: "lepton" },
{ id: "mu-", label: "μ⁻", q: -1, le: 0, lmu: 1, type: "lepton" },
{ id: "mu+", label: "μ⁺", q: 1, le: 0, lmu: -1, type: "lepton" },
{ id: "q", label: "q (quark)", q: 2 / 3, le: 0, lmu: 0, type: "quark" },
{ id: "qbar", label: "q̄ (antiquark)", q: -2 / 3, le: 0, lmu: 0, type: "quark" },
{ id: "ph", label: "γ", q: 0, le: 0, lmu: 0, type: "photon" }];

function feyAnalyze(in1, in2, out1, out2) {
  const P = (id) => FEY_PARTICLES.find((p) => p.id === id);
  const a = P(in1),b = P(in2),c = P(out1),d = P(out2);
  const sum = (f) => f(a) + f(b) - f(c) - f(d);
  const dQ = sum((p) => p.q),dLe = sum((p) => p.le),dLmu = sum((p) => p.lmu);
  if (Math.abs(dQ) > 1e-9) return { ok: false, reason: "Electric charge is not conserved (ΔQ = " + dQ.toFixed(2) + " e). Every interaction vertex in the Standard Model conserves electric charge exactly, so no diagram exists for this process." };
  if (Math.abs(dLe) > 1e-9 || Math.abs(dLmu) > 1e-9) return { ok: false, reason: "Lepton flavor number is not conserved (ΔLₑ = " + dLe + ", ΔL_μ = " + dLmu + "). In the Standard Model with massless neutrinos, electron number and muon number are separately conserved at every vertex. (Neutrino oscillations violate flavor conservation, but only via neutrino mass terms — not in charged-lepton processes at tree level.)" };
  const ids = [in1, in2].sort().join(","),ods = [out1, out2].sort().join(",");
  const isPair = (x, y, m) => x === m + "-" && y === m + "+" || x === m + "+" && y === m + "-";
  // classify topology
  if (isPair(in1, in2, "e") && isPair(out1, out2, "mu"))
  return { ok: true, topo: "s", boson: "γ / Z⁰", note: "s-channel annihilation: the e⁺e⁻ pair annihilates into a virtual photon (or Z⁰), which materializes as a μ⁺μ⁻ pair. The classic QED benchmark process." };
  if (isPair(in1, in2, "mu") && isPair(out1, out2, "e"))
  return { ok: true, topo: "s", boson: "γ / Z⁰", note: "s-channel annihilation: μ⁺μ⁻ → γ* → e⁺e⁻." };
  if (isPair(in1, in2, "e") && isPair(out1, out2, "e") || isPair(in1, in2, "mu") && isPair(out1, out2, "mu"))
  return { ok: true, topo: "s", boson: "γ / Z⁰", note: "Bhabha-type scattering: both s-channel annihilation and t-channel exchange diagrams contribute; the s-channel diagram is drawn." };
  if (ids === "q,qbar".split(",").sort().join(",") && isPair(out1, out2, "e"))
  return { ok: true, topo: "s", boson: "γ / Z⁰", note: "Drell–Yan-type process: quark–antiquark annihilation into a lepton pair via a virtual photon or Z⁰." };
  if (isPair(in1, in2, "e") && ods === "q,qbar".split(",").sort().join(","))
  return { ok: true, topo: "s", boson: "γ / Z⁰", note: "e⁺e⁻ → q q̄: the basis of hadron production at lepton colliders; the quarks subsequently hadronize into jets." };
  if (ids === ods && a.id !== b.id && a.q !== 0 && b.q !== 0)
  return { ok: true, topo: "t", boson: "γ", note: "t-channel exchange: the two charged particles scatter elastically by exchanging a virtual photon — Møller/Mott-type scattering." };
  if (ids === ods && a.id === b.id && a.q !== 0)
  return { ok: true, topo: "t", boson: "γ", note: "Identical-particle scattering: t- and u-channel photon-exchange diagrams both contribute (and interfere); the t-channel diagram is drawn." };
  if ([in1, in2].includes("ph") && [out1, out2].includes("ph") && ids.replace("ph", "") === ods.replace("ph", ""))
  return { ok: true, topo: "compton", boson: null, note: "Compton scattering: the fermion absorbs and re-emits a photon via an internal fermion propagator." };
  if (ids === "ph,ph" || ods === "ph,ph")
  return { ok: false, reason: "A single fermion cannot turn into (or come from) two photons while conserving energy–momentum on-shell, and γγ states require loop-level processes (e.g. H → γγ) not representable as a single tree vertex. Tree-level QED has no γγ ↔ γγ vertex — light-by-light scattering first occurs at one loop." };
  return { ok: false, reason: "No tree-level Standard Model diagram connects these states with a single mediator: the required vertex structure does not exist. Try a particle–antiparticle pair in, and a pair of a (possibly different) flavor out." };
}

/* ---------- process templates + leading-order physics ---------- */
const FEY_TEMPLATES = [
{ name: "e⁺e⁻ → μ⁺μ⁻", sub: "s-channel annihilation", in: ["e-", "e+"], out: ["mu-", "mu+"] },
{ name: "e⁺e⁻ → q q̄", sub: "hadron production", in: ["e-", "e+"], out: ["q", "qbar"] },
{ name: "q q̄ → μ⁺μ⁻", sub: "Drell–Yan", in: ["q", "qbar"], out: ["mu-", "mu+"] },
{ name: "e⁻μ⁻ → e⁻μ⁻", sub: "t-channel exchange", in: ["e-", "mu-"], out: ["e-", "mu-"] },
{ name: "e⁻e⁻ → e⁻e⁻", sub: "Møller scattering", in: ["e-", "e-"], out: ["e-", "e-"] },
{ name: "e⁺e⁻ → e⁺e⁻", sub: "Bhabha scattering", in: ["e-", "e+"], out: ["e-", "e+"] },
{ name: "γe⁻ → γe⁻", sub: "Compton scattering", in: ["ph", "e-"], out: ["ph", "e-"] },
{ name: "e⁻e⁻ → γγ", sub: "forbidden — see why", in: ["e-", "e-"], out: ["ph", "ph"] }];

function feyPhysics(result) {
  if (!result || !result.ok) return null;
  if (result.topo === "s") return {
    order: "$O(e^2)$ · leading order — one virtual boson",
    amp: "\\mathcal{M} \\sim \\dfrac{e^2}{s}\\,[\\bar v\\,\\gamma^\\mu u]\\,[\\bar u'\\,\\gamma_\\mu v']",
    sigma: "\\sigma = \\dfrac{4\\pi\\alpha^2}{3s}",
    sigmaNote: "Cross-section falls as $1/s$ — numerically $\\sigma \\approx 86.8\\ \\mathrm{nb}/(\\sqrt{s}/\\mathrm{GeV})^2$, so $\\sigma(e^+e^-\\to\\mu^+\\mu^-) \\approx 0.87$ nb at $\\sqrt{s} = 10$ GeV. Near $\\sqrt{s} \\approx 91$ GeV the $Z^0$ propagator pole produces a sharp resonance on top of the photon term."
  };
  if (result.topo === "t") return {
    order: "$O(e^2)$ · one exchanged photon",
    amp: "\\mathcal{M} \\sim \\dfrac{e^2}{t}",
    sigma: "\\dfrac{d\\sigma}{d\\Omega} \\sim \\dfrac{\\alpha^2}{4E^2\\sin^4(\\theta/2)}",
    sigmaNote: "The Mott/Rutherford form: the t-channel pole at small scattering angle drives the forward Coulomb divergence."
  };
  if (result.topo === "compton") return {
    order: "$O(e^2)$ · two vertices, one fermion propagator",
    amp: "\\mathcal{M} \\sim e^2\\,\\bar u'\\,\\Big[\\tfrac{\\gamma\\cdot(p+k)+m}{(p+k)^2-m^2} + \\ldots\\Big]\\,u",
    sigma: "\\sigma_{\\mathrm{KN}} = \\sigma_T\\,f\\!\\left(\\dfrac{E_\\gamma}{m_e c^2}\\right)",
    sigmaNote: "The Klein–Nishina cross-section; it reduces to the classical Thomson value $\\sigma_T$ as $E_\\gamma \\to 0$ and falls at high energy."
  };
  return null;
}

function FeynmanSVG({ result, labels }) {
  // s-channel: two in from left to center-left vertex; wavy propagator; two out from center-right vertex
  const W = 560,H = 240,v1 = { x: 215, y: 120 },v2 = { x: 345, y: 120 };
  const wavy = (x1, y1, x2, y2) => {
    const seg = 16,pts = [];
    const dx = x2 - x1,dy = y2 - y1,len = Math.hypot(dx, dy),nx = -dy / len,ny = dx / len;
    for (let i = 0; i <= seg; i++) {
      const f = i / seg,a = Math.sin(f * Math.PI * 6) * 6;
      pts.push((x1 + dx * f + nx * a).toFixed(1) + "," + (y1 + dy * f + ny * a).toFixed(1));
    }
    return "M" + pts.join(" L");
  };
  const fermion = (x1, y1, x2, y2, key, lbl, anti) => {
    const mx = (x1 + x2) / 2,my = (y1 + y2) / 2;
    const ang = Math.atan2(y2 - y1, x2 - x1) + (anti ? Math.PI : 0);
    return (
      <g key={key}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={QGA_TOKENS.css("pigment-blue-80")} strokeWidth="1.6" className="fey-line-flow"></line>
        <polygon points="0,-4 8,0 0,4" fill={QGA_TOKENS.css("pigment-blue-80")}
        transform={"translate(" + mx + "," + my + ") rotate(" + ang * 180 / Math.PI + ")"}></polygon>
        <text x={x1 < W / 2 ? x1 - 8 : x1 + 8} y={y1 + 4} fill={QGA_TOKENS.css("pigment-grey-92")} fontSize="14" fontFamily="var(--font-head)"
        textAnchor={x1 < W / 2 ? "end" : "start"}>{lbl}</text>
      </g>);

  };
  if (!result.ok) return null;
  let body = null;
  if (result.topo === "s") {
    body =
    <g>
        {fermion(60, 50, v1.x, v1.y, "i1", labels[0], false)}
        {fermion(60, 190, v1.x, v1.y, "i2", labels[1], true)}
        {fermion(v2.x, v2.y, 500, 50, "o1", "", false)}
        {fermion(v2.x, v2.y, 500, 190, "o2", "", true)}
        <text x="508" y="54" fill={QGA_TOKENS.css("pigment-grey-92")} fontSize="14" fontFamily="var(--font-head)">{labels[2]}</text>
        <text x="508" y="194" fill={QGA_TOKENS.css("pigment-grey-92")} fontSize="14" fontFamily="var(--font-head)">{labels[3]}</text>
        <path d={wavy(v1.x, v1.y, v2.x, v2.y)} stroke="var(--gold)" strokeWidth="2.0" fill="none" className="fey-wave-flow"></path>
        <circle className="fey-packet fey-packet-s" r="3.6"></circle>
        <text x={(v1.x + v2.x) / 2} y={v1.y - 16} fill={QGA_TOKENS.css("pigment-amber-80")} fontSize="13" textAnchor="middle" fontFamily="var(--font-mono)">{result.boson}</text>
        <circle cx={v1.x} cy={v1.y} r="4" fill="var(--acc)" className="fey-vertex"></circle>
        <circle cx={v2.x} cy={v2.y} r="4" fill="var(--acc)" className="fey-vertex"></circle>
        <text x={v1.x} y={v1.y + 22} fill={QGA_TOKENS.css("pigment-blue-63")} fontSize="10" textAnchor="middle" fontFamily="var(--font-mono)">vertex</text>
        <text x={(v1.x + v2.x) / 2} y={v1.y + 22} fill={QGA_TOKENS.css("pigment-blue-63")} fontSize="10" textAnchor="middle" fontFamily="var(--font-mono)">internal propagator</text>
      </g>;

  } else if (result.topo === "t") {
    const u1 = { x: 280, y: 70 },u2 = { x: 280, y: 170 };
    body =
    <g>
        {fermion(60, 70, u1.x, u1.y, "i1", labels[0], false)}
        {fermion(u1.x, u1.y, 500, 70, "o1", "", false)}
        {fermion(60, 170, u2.x, u2.y, "i2", labels[1], false)}
        {fermion(u2.x, u2.y, 500, 170, "o2", "", false)}
        <text x="508" y="74" fill={QGA_TOKENS.css("pigment-grey-92")} fontSize="14" fontFamily="var(--font-head)">{labels[2]}</text>
        <text x="508" y="174" fill={QGA_TOKENS.css("pigment-grey-92")} fontSize="14" fontFamily="var(--font-head)">{labels[3]}</text>
        <path d={wavy(u1.x, u1.y, u2.x, u2.y)} stroke="var(--gold)" strokeWidth="2.0" fill="none" className="fey-wave-flow"></path>
        <text x={u1.x + 18} y={120} fill="var(--gold)" fontSize="13" fontFamily="var(--font-mono)">{result.boson}</text>
        <circle className="fey-packet fey-packet-t" r="3.6"></circle>
        <circle cx={u1.x} cy={u1.y} r="4" fill="var(--acc)" className="fey-vertex"></circle>
        <circle cx={u2.x} cy={u2.y} r="4" fill="var(--acc)" className="fey-vertex"></circle>
      </g>;

  } else if (result.topo === "compton") {
    const c1 = { x: 230, y: 130 },c2 = { x: 330, y: 130 };
    body =
    <g>
        <path d={wavy(60, 50, c1.x, c1.y)} stroke={QGA_TOKENS.css("pigment-amber-80")} strokeWidth="1.8" fill="none"></path>
        <text x="52" y="54" fill={QGA_TOKENS.css("pigment-grey-92")} fontSize="14" textAnchor="end" fontFamily="var(--font-head)">γ</text>
        {fermion(60, 200, c1.x, c1.y, "i2", labels.find((l) => l !== "γ"), false)}
        <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke={QGA_TOKENS.css("pigment-blue-80")} strokeWidth="1.6" className="fey-line-flow"></line>
        <circle className="fey-packet fey-packet-c" r="3.4"></circle>
        <path d={wavy(c2.x, c2.y, 500, 50)} stroke={QGA_TOKENS.css("pigment-amber-80")} strokeWidth="1.8" fill="none"></path>
        <text x="508" y="54" fill={QGA_TOKENS.css("pigment-grey-92")} fontSize="14" fontFamily="var(--font-head)">γ</text>
        {fermion(c2.x, c2.y, 500, 200, "o2", "", false)}
        <text x="508" y="204" fill={QGA_TOKENS.css("pigment-grey-92")} fontSize="14" fontFamily="var(--font-head)">{labels.find((l) => l !== "γ")}</text>
        <circle cx={c1.x} cy={c1.y} r="4" fill="var(--acc)" className="fey-vertex"></circle>
        <circle cx={c2.x} cy={c2.y} r="4" fill="var(--acc)" className="fey-vertex"></circle>
        <text x={(c1.x + c2.x) / 2} y={c1.y + 22} fill={QGA_TOKENS.css("pigment-blue-63")} fontSize="10" textAnchor="middle" fontFamily="var(--font-mono)">fermion propagator</text>
      </g>;

  }
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", display: "block" }} role="img" aria-label="Feynman diagram">
      <text x="60" y="24" fill={QGA_TOKENS.css("pigment-blue-63")} fontSize="10" fontFamily="var(--font-mono)">time →</text>
      <line x1="60" y1="30" x2="120" y2="30" stroke={QGA_TOKENS.css("pigment-blue-63")} strokeWidth="1"></line>
      <polygon points="120,26 128,30 120,34" fill={QGA_TOKENS.css("pigment-blue-63")}></polygon>
      {body}
    </svg>);

}

/* ---------- cinematic 3D collision scene for the selected process ----------
   Renders the chosen 2→2 reaction as a real-time event: incoming quanta stream
   in from the beamline, collide at a luminous vertex, the force carrier is
   exchanged (s-channel propagator / t-channel exchange / Compton fermion line),
   and the products fly out with glowing motion trails. Synced to the builder. */
const FEY_COL = {
  "e-": QGA_TOKENS.hex("pigment-blue-72"), "e+": QGA_TOKENS.hex("pigment-azure-80-c10"), "mu-": QGA_TOKENS.hex("pigment-violet-72-c15"), "mu+": QGA_TOKENS.hex("pigment-violet-81-c11"),
  "q": QGA_TOKENS.hex("pigment-cyan-80-c09"), "qbar": QGA_TOKENS.hex("pigment-cyan-88"), "ph": QGA_TOKENS.hex("pigment-amber-79-c12"),
};
const feyColHex = (id) => FEY_COL[id] || QGA_TOKENS.hex("pigment-blue-78-c08");

function FeynmanCollision3D({ proc, procKey }) {
  const build = (ctx) => {
    const { THREE, scene } = ctx;
    const P = proc;
    scene.fog = new THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.02);
    scene.add(new THREE.AmbientLight(QGA_TOKENS.hex("pigment-blue-71-c06"), 0.7));
    const key = new THREE.DirectionalLight(QGA_TOKENS.hex("pigment-blue-90"), 0.8); key.position.set(4, 7, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(QGA_TOKENS.hex("pigment-blue-55"), 0.5); rim.position.set(-5, -3, -4); scene.add(rim);

    // beamline + faint reference plane
    const grid = ctx.grid(20, 20, QGA_TOKENS.hex("pigment-blue-31-c06"), 0.1); grid.position.y = -3.0; scene.add(grid);
    const beam = ctx.line([new THREE.Vector3(-8, 0, 0), new THREE.Vector3(8, 0, 0)], QGA_TOKENS.hex("pigment-blue-43"), 0.35, true);
    scene.add(beam);

    const TRAIL = 30;
    const V = new THREE.Vector3();
    const perpZ = new THREE.Vector3(0, 0, 1);
    const ss = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    const lerp3 = (a, b, f) => V.set(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);

    // a luminous quantum: emissive core + additive glow halo + motion trail
    const makeQ = (hex, rad) => {
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(rad, 22, 16),
        new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 1.5, metalness: 0.25, roughness: 0.35 })
      );
      const glow = ctx.glow(hex, rad * 6.5, 0.9);
      scene.add(core); scene.add(glow);
      const tl = ctx.engraved.stream(TRAIL, {
        color: hex, opacity: 0.55, additive: true, widthPx: ctx.engraved.WIDTH_PX.standard, layer: "model",
      });
      scene.add(tl);
      return { core, glow, tl, hex, trail: [] };
    };
    const setQ = (q, vec, vis) => {
      q.core.visible = q.glow.visible = vis;
      if (!vis) { q.tl.visible = false; return; }
      q.core.position.copy(vec); q.glow.position.copy(vec);
    };
    const pushTrail = (q, on) => {
      if (!on) { q.trail.length = 0; q.tl.visible = false; return; }
      q.tl.visible = true;
      q.trail.push(q.core.position.x, q.core.position.y, q.core.position.z);
      if (q.trail.length > TRAIL * 3) q.trail.splice(0, q.trail.length - TRAIL * 3);
      const n = q.trail.length / 3;
      ctx.engraved.setPoints(q.tl, q.trail, n);
    };

    const SPAN = 7.0, OFF = 2.6;
    const isT = P.topo === "t";
    const isCompton = P.topo === "compton";

    // geometry per topology
    const v1 = [-1.8, 0, 0], v2 = [1.8, 0, 0];           // s / compton vertices
    const vt = [0, 1.8, 0], vb = [0, -1.8, 0];           // t-channel vertices
    const spawnA = isT ? [-SPAN, 1.8, 0] : [-SPAN, OFF, 0];
    const spawnB = isT ? [-SPAN, -1.8, 0] : [-SPAN, -OFF, 0];
    const exitC = isT ? [SPAN, 1.8, 0] : [SPAN, OFF, 0];
    const exitD = isT ? [SPAN, -1.8, 0] : [SPAN, -OFF, 0];

    // quanta
    const qA = makeQ(feyColHex(P.in[0]), 0.26);
    const qB = makeQ(feyColHex(P.in[1]), 0.26);
    const qC = makeQ(feyColHex(P.out[0]), 0.26);
    const qD = makeQ(feyColHex(P.out[1]), 0.26);

    // mediator: animated wavy/straight glowing line + a travelling energy packet
    const medN = 46;
    const medFlat = new Float32Array((medN + 1) * 3);
    const medHex = isCompton ? QGA_TOKENS.hex("pigment-blue-87") : QGA_TOKENS.hex("pigment-amber-88-c12");
    // The mediator is this scene's focal curve.
    const medLine = ctx.engraved.stream(medN + 1, {
      color: medHex, opacity: 0, additive: true, widthPx: ctx.engraved.WIDTH_PX.focal, layer: "model",
    });
    scene.add(medLine);
    const packet = ctx.glow(medHex, 0.9, 0); scene.add(packet);

    // collision flashes
    const flashA = ctx.glow(QGA_TOKENS.hex("pigment-amber-96"), 2.2, 0); scene.add(flashA); // primary vertex
    const flashB = ctx.glow(QGA_TOKENS.hex("pigment-amber-96"), 2.2, 0); scene.add(flashB); // secondary vertex

    // labels follow the live particles
    const lblA = ctx.label(P.labels[0], () => qA.core.position, "s3d-strong");
    const lblB = ctx.label(P.labels[1], () => qB.core.position, "s3d-strong");
    const lblC = ctx.label(P.labels[2], () => qC.core.position, "s3d-strong");
    const lblD = ctx.label(P.labels[3], () => qD.core.position, "s3d-strong");
    const medMid = new THREE.Vector3();
    ctx.label(P.boson || (isCompton ? "fermion propagator" : "γ"), () => medMid, "s3d-quiet");
    ctx.annotation(isT ? "t-channel: a virtual boson is exchanged — momentum transfer t"
      : isCompton ? "Compton: photon absorbed & re-emitted via an internal fermion line"
      : "s-channel: the pair annihilates into a virtual " + (P.boson || "boson") + ", then re-materializes",
      () => ({ x: 0, y: -3.0, z: 0 }));

    let pp = 0.0;

    const setMed = (aArr, bArr, frac, amp, wavy, tphase, op) => {
      ctx.engraved.setOpacity(medLine, op);
      const a = new THREE.Vector3(...aArr), b = new THREE.Vector3(...bArr);
      const dir = new THREE.Vector3().subVectors(b, a);
      medMid.copy(a).addScaledVector(dir, 0.5).add(new THREE.Vector3(0, isT ? 0 : 0.5, 0));
      for (let i = 0; i <= medN; i++) {
        const f = i / medN;
        const off = wavy ? Math.sin(f * Math.PI * 7 + tphase) * amp * Math.sin(f * Math.PI) : 0;
        V.copy(a).addScaledVector(dir, f).addScaledVector(perpZ, off);
        medFlat[i * 3] = V.x; medFlat[i * 3 + 1] = V.y; medFlat[i * 3 + 2] = V.z;
      }
      ctx.engraved.setPoints(medLine, medFlat, medN + 1);
      // travelling packet rides the exchange
      packet.material.opacity = op > 0 ? 0.95 : 0;
      V.copy(a).addScaledVector(dir, frac);
      packet.position.copy(V);
      packet.scale.setScalar(0.9 + 0.5 * Math.sin(tphase));
    };
    const hideMed = () => { ctx.engraved.setOpacity(medLine, 0); packet.material.opacity = 0; };

    return {
      autoRotate: true,
      dispose: () => {},
      update: (t, dt) => {
        const mo = ctx.motion();
        // advance the event clock (frozen, composed frame under reduced motion)
        if (mo > 0) { pp += dt * 0.165; if (pp > 1) { pp -= 1; [qA, qB, qC, qD].forEach((q) => (q.trail.length = 0)); } }
        const stat = mo === 0;
        const p = stat ? 0.5 : pp;
        const tph = t * 9;

        if (isT) {
          // two particles sweep left→right; mediator exchanged as they cross the centre
          const fA = stat ? 0.6 : ss((p - 0.04) / 0.92);
          setQ(qA, lerp3(spawnA, exitC, fA), true); pushTrail(qA, !stat && fA > 0.001 && fA < 0.999);
          const fB = fA;
          setQ(qB, lerp3(spawnB, exitD, fB), true); pushTrail(qB, !stat && fB > 0.001 && fB < 0.999);
          setQ(qC, V.set(0, 0, 0), false); setQ(qD, V.set(0, 0, 0), false);
          const exP = (p - 0.40) / 0.24;
          if (stat || (p > 0.36 && p < 0.68)) {
            setMed(vt, vb, ss(exP), 0.34, true, tph, 0.9 * (stat ? 1 : Math.sin(Math.max(0, Math.min(1, exP)) * Math.PI)));
            const fl = stat ? 1 : Math.sin(Math.max(0, Math.min(1, (p - 0.42) / 0.18)) * Math.PI);
            flashA.position.set(...vt); flashB.position.set(...vb);
            flashA.material.opacity = flashB.material.opacity = 0.85 * fl;
            flashA.scale.setScalar(1.6 + 2 * fl); flashB.scale.setScalar(1.6 + 2 * fl);
          } else { hideMed(); flashA.material.opacity = flashB.material.opacity = 0; }
        } else {
          // s-channel / Compton: in → vertex1, exchange v1→v2, vertex2 → out
          const fin = stat ? 1 : ss((p - 0.05) / 0.34);
          const inVis = stat || p < 0.48;
          setQ(qA, lerp3(spawnA, v1, fin), inVis); pushTrail(qA, !stat && inVis && fin > 0.001);
          setQ(qB, lerp3(spawnB, v1, fin), inVis); pushTrail(qB, !stat && inVis && fin > 0.001);
          const fout = stat ? 0.5 : ss((p - 0.60) / 0.34);
          const outVis = stat || p > 0.56;
          setQ(qC, lerp3(v2, exitC, fout), outVis); pushTrail(qC, !stat && outVis && fout > 0.001);
          setQ(qD, lerp3(v2, exitD, fout), outVis); pushTrail(qD, !stat && outVis && fout > 0.001);
          const exP = (p - 0.40) / 0.26;
          if (stat || (p > 0.36 && p < 0.72)) {
            setMed(v1, v2, ss(exP), 0.32, !isCompton, tph,
              0.9 * (stat ? 1 : Math.sin(Math.max(0, Math.min(1, exP)) * Math.PI)));
          } else hideMed();
          // vertex flashes
          const flIn = stat ? 0.5 : Math.sin(Math.max(0, Math.min(1, (p - 0.34) / 0.16)) * Math.PI);
          const flOut = stat ? 0.5 : Math.sin(Math.max(0, Math.min(1, (p - 0.54) / 0.16)) * Math.PI);
          flashA.position.set(...v1); flashB.position.set(...v2);
          flashA.material.opacity = 0.9 * flIn; flashB.material.opacity = 0.9 * flOut;
          flashA.scale.setScalar(1.4 + 2.2 * flIn); flashB.scale.setScalar(1.4 + 2.2 * flOut);
        }
        // glow halos pulse gently with the cores
        [qA, qB, qC, qD].forEach((q) => {
          if (q.core.visible) { q.glow.scale.setScalar(0.26 * 6.5 * (1 + 0.12 * Math.sin(t * 4 + q.hex))); }
        });
        // hide labels for invisible particles
        lblA.setShow(qA.core.visible); lblB.setShow(qB.core.visible);
        lblC.setShow(qC.core.visible); lblD.setShow(qD.core.visible);
      },
    };
  };

  return (
    <div style={{ borderBottom: "1px solid var(--line)" }}>
      <Scene3D animated="motion" height={360}
        aria={"Cinematic three-dimensional animation of the collision " + procKey}
        initial={{ radius: 15, theta: 0.62, phi: 1.04, minR: 8, maxR: 30, fov: 42,
          bloom: { strength: 0.95, radius: 0.6, threshold: 0.12 } }}
        build={build} deps={[procKey]}
        fallback={null}></Scene3D>
    </div>
  );
}

function FeynmanBuilder() {
  const [in1, setIn1] = useState("e-");
  const [in2, setIn2] = useState("e+");
  const [out1, setOut1] = useState("mu-");
  const [out2, setOut2] = useState("mu+");
  const result = feyAnalyze(in1, in2, out1, out2);
  const lbl = (id) => FEY_PARTICLES.find((p) => p.id === id).label.split(" ")[0];
  const phys = feyPhysics(result);
  const proc = result.ok
    ? { in: [in1, in2], out: [out1, out2], topo: result.topo, boson: result.boson,
        labels: [lbl(in1), lbl(in2), lbl(out1), lbl(out2)] }
    : null;
  const procKey = proc ? [in1, in2, out1, out2, proc.topo].join("|") : "none";
  const applyTemplate = (tpl) => {setIn1(tpl.in[0]);setIn2(tpl.in[1]);setOut1(tpl.out[0]);setOut2(tpl.out[1]);};
  const activeTpl = FEY_TEMPLATES.find((tp) => tp.in[0] === in1 && tp.in[1] === in2 && tp.out[0] === out1 && tp.out[1] === out2);
  const sel = (v, set) =>
  <select value={v} onChange={(e) => set(e.target.value)}>
      {FEY_PARTICLES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
    </select>;

  return (
    <div className="viz-frame">
      <div className="fey-templates" role="group" aria-label="Process templates">
        {FEY_TEMPLATES.map((tp) =>
        <button key={tp.name} className={"fey-chip" + (activeTpl === tp ? " on" : "")}
        onClick={() => applyTemplate(tp)}>
            <span className="fey-chip-name">{tp.name}</span>
            <span className="fey-chip-sub">{tp.sub}</span>
          </button>
        )}
      </div>
      <div className="viz-toolbar fey-row">
        <span className="ctl-label">incoming</span>
        {sel(in1, setIn1)}{sel(in2, setIn2)}
        <span className="ctl-label" style={{ margin: "0 4px" }}>→</span>
        <span className="ctl-label">outgoing</span>
        {sel(out1, setOut1)}{sel(out2, setOut2)}
      </div>
      {result.ok ? <FeynmanCollision3D proc={proc} procKey={procKey}></FeynmanCollision3D> : null}
      <div style={{ padding: "10px 14px" }}>
        {result.ok ?
        <div>
            <FeynmanSVG result={result} labels={[lbl(in1), lbl(in2), lbl(out1), lbl(out2)]}></FeynmanSVG>
            <div className="fey-verdict ok"><strong>Allowed at tree level.</strong> {result.note}</div>
            {phys ?
          <div className="fey-phys-grid">
                <div className="fey-phys-card">
                  <div className="fey-phys-label">Leading-order amplitude</div>
                  <Eq tex={phys.amp} display={true}></Eq>
                  <div className="fey-phys-note"><RichText text={phys.order}></RichText></div>
                </div>
                <div className="fey-phys-card">
                  <div className="fey-phys-label">Cross-section scaling</div>
                  <Eq tex={phys.sigma} display={true}></Eq>
                  <div className="fey-phys-note"><RichText text={phys.sigmaNote}></RichText></div>
                </div>
                <div className="fey-phys-card">
                  <div className="fey-phys-label">Coupling</div>
                  <Eq tex="\alpha = \dfrac{e^2}{4\pi\varepsilon_0 \hbar c} \approx \dfrac{1}{137}" display={true}></Eq>
                  <div className="fey-phys-note">Each vertex contributes one power of <Eq tex="e"></Eq> (<Eq tex="\sqrt{\alpha}"></Eq>). Every extra photon loop suppresses the amplitude by <Eq tex="\alpha"></Eq> — why QED perturbation theory converges so well.</div>
                </div>
              </div> :
          null}
          </div> :

        <div className="fey-verdict bad"><strong>Forbidden.</strong> {result.reason}</div>
        }
      </div>
      <VizCaption status="schematic">
        Pick a process template or build a custom 2 → 2 reaction. The animation shows time flowing left → right:
        incoming quanta stream into a vertex, the force carrier (gold) is exchanged, and outgoing quanta emerge.
        External lines are real (on-shell) particles; the internal line is a propagator — a term in the
        perturbative expansion, not an observable object. Arrows track fermion number; the builder enforces the
        conservation laws every Standard Model vertex obeys.
      </VizCaption>
    </div>);

}

/* ================= Stage 3 · the amplitude room =================
   A live 2 → 2 scattering bench. Every number on screen is produced by the
   pure functions in js/physics.mjs (mirrored in js/physics.jsx):
   mandelstamKinematics, angularDistribution, breitWignerResonance and
   qftTotalCrossSection. The animation is presentation only — the readouts
   are exact functions of (√s, cos θ, x). */

const QFT_M_E = 0.51099895e-3; // GeV — electron rest energy (CODATA)

const QFT_PROCESSES = [
{
  id: "s-channel",
  name: "e⁺e⁻ → μ⁺μ⁻",
  sub: "s-channel annihilation",
  in: ["e-", "e+"], out: ["mu-", "mu+"],
  masses: [0, 0, 0, 0],
  angleLabel: "cos θ (μ⁻)",
  shapeLabel: "$1 + \\cos^2\\theta$",
  shapeTex: "\\dfrac{d\\sigma}{d\\Omega} \\propto 1 + \\cos^2\\theta",
  ref: "Peskin & Schroeder, An Introduction to QFT, §5.1",
  note: "Massless-fermion limit. The 1 + cos²θ shape and the total cross-section σ = 4πα²/3s are the textbook leading-order results."
},
{
  id: "t-channel",
  name: "e⁻μ⁻ → e⁻μ⁻",
  sub: "t-channel exchange",
  in: ["e-", "mu-"], out: ["e-", "mu-"],
  masses: [0, 0, 0, 0],
  angleLabel: "cos θ (e⁻)",
  shapeLabel: "$1/\\sin^4(\\theta/2)$",
  shapeTex: "\\dfrac{d\\sigma}{d\\Omega} \\sim \\dfrac{\\alpha^2}{4E^2\\sin^4(\\theta/2)}",
  ref: "Mott (1929); Rutherford (1911) — leading t-channel pole",
  note: "Only the leading t-channel pole is plotted. The complete Møller and Bhabha amplitudes also carry s- and u-channel terms and their interference, which are deliberately not drawn."
},
{
  id: "compton",
  name: "γe⁻ → γe⁻",
  sub: "Compton scattering",
  in: ["ph", "e-"], out: ["ph", "e-"],
  masses: [0, QFT_M_E, 0, QFT_M_E],
  angleLabel: "cos θ (γ)",
  shapeLabel: "Klein–Nishina",
  shapeTex: "\\dfrac{d\\sigma}{d\\Omega} = \\dfrac{\\alpha^2}{2m_e^2}\\left(\\dfrac{E'}{E}\\right)^{2}\\left[\\dfrac{E'}{E} + \\dfrac{E}{E'} - \\sin^2\\theta\\right]",
  ref: "Klein & Nishina (1929)",
  note: "x = E_γ/mₑc² is a separate lab-frame slider, decoupled from √s: tying x to a 10 GeV centre-of-mass energy would give x ≈ 2 × 10⁸ and a visually degenerate curve."
}];


function useQFTFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {if (live) setReady(true);});
    }
    return () => {live = false;};
  }, []);
  return ready;
}

/* DPR-aware canvas sizing. `draw(ctx, w, h)` receives CSS-pixel dimensions. */
function useQFTCanvas(draw, deps) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth,h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);cv.height = Math.round(h * dpr);
    }
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h);
  }, deps);
  return ref;
}

/* Readout card. `formula` stays the plain-text caption for callers that pass
   prose; `formulaTex` carries the governing relation as KaTeX, and `note` keeps
   a prose gloss that would otherwise have to be crammed into the TeX. */
function QFTReadout({ label, value, unit, formula, formulaTex, note, lead }) {
  return (
    <div className={"kerr-readout" + (lead ? " lead" : "")}>
      <div className="kerr-readout-label">{label}</div>
      <div className="kerr-readout-value">{value}{unit ? <span className="unit">{unit}</span> : null}</div>
      {formulaTex
        ? <div className="kerr-readout-formula"><Eq tex={formulaTex}></Eq></div>
        : formula ? <div className="kerr-readout-formula">{formula}</div> : null}
      {note ? <div className="kerr-readout-note">{note}</div> : null}
    </div>);

}

/* Scattering plane: the dσ/dΩ envelope drawn in polar coordinates, with the
   two incoming packets converging on the vertex and the outgoing pair
   receding at ±θ. */
function QFTScatterCanvas({ process, cosTheta, photonX, tau, fontsReady }) {
  const ref = useQFTCanvas((ctx, w, h) => {
    const cx = w * 0.5,cy = h * 0.5;
    const R = Math.min(w * 0.40, h * 0.42);
    const shape = (c) => window.QGA_PHYSICS.angularDistribution({ process: process.id, cosTheta: c, photonX });
    const s90 = shape(0) || 1;
    let maxRatio = 0;
    for (let i = 0; i <= 180; i++) maxRatio = Math.max(maxRatio, shape(-1 + 2 * i / 180) / s90);
    const rMax = Math.min(6, maxRatio);
    const radius = (c) => R * Math.min(6, shape(c) / s90) / rMax;

    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.10);
    ctx.lineWidth = 1;
    ctx.beginPath();ctx.arc(cx, cy, R, 0, Math.PI * 2);ctx.stroke();
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.06);
    for (const f of [0.5, 0.75]) {
      ctx.beginPath();ctx.arc(cx, cy, R * f, 0, Math.PI * 2);ctx.stroke();
    }

    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.28);
    ctx.beginPath();ctx.moveTo(cx - R * 1.18, cy);ctx.lineTo(cx + R * 1.18, cy);ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.22);
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      const tx = cx + R * 1.18 * i / 3;
      ctx.beginPath();ctx.moveTo(tx, cy - 3);ctx.lineTo(tx, cy + 3);ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i <= 360; i++) {
      const a = i / 360 * Math.PI * 2;
      const r = radius(Math.cos(a));
      const x = cx + r * Math.cos(a),y = cy - r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    grad.addColorStop(0, QGA_TOKENS.alpha("pigment-azure-76", 0.20));
    grad.addColorStop(1, QGA_TOKENS.alpha("pigment-violet-59", 0.05));
    ctx.fillStyle = grad;ctx.fill();
    ctx.save();
    ctx.shadowColor = QGA_TOKENS.alpha("pigment-azure-80-c11", 0.6);
    ctx.shadowBlur = 9;
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-azure-80-c11", 0.6);ctx.lineWidth = 1.4;ctx.stroke();
    ctx.restore();

    const L = R * 1.05;
    const th = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
    const pr = Math.max(5, R * 0.075);
    const blob = (x, y, tint) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, pr);
      g.addColorStop(0, QGA_TOKENS.alpha(tint, 0.95));
      g.addColorStop(0.45, QGA_TOKENS.alpha(tint, 0.35));
      g.addColorStop(1, QGA_TOKENS.alpha(tint, 0));
      ctx.fillStyle = g;
      ctx.beginPath();ctx.arc(x, y, pr, 0, Math.PI * 2);ctx.fill();
    };
    if (tau <= 0.5) {
      const f = 1 - tau / 0.5;
      blob(cx - L * f, cy, "pigment-azure-80-c11");
      blob(cx + L * f, cy, "pigment-red-78");
    } else {
      const g = (tau - 0.5) / 0.5;
      blob(cx + L * g * Math.cos(th), cy - L * g * Math.sin(th), "pigment-azure-80-c11");
      blob(cx - L * g * Math.cos(th), cy + L * g * Math.sin(th), "pigment-red-78");
    }

    const flash = Math.max(0, 1 - Math.abs(tau - 0.5) / 0.14);
    if (flash > 0.01) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.5 * flash);
      g.addColorStop(0, QGA_TOKENS.alpha("pigment-amber-94-c07", 0.85 * flash));
      g.addColorStop(1, QGA_TOKENS.alpha("pigment-amber-86-c14", 0));
      ctx.fillStyle = g;
      ctx.beginPath();ctx.arc(cx, cy, R * 0.5 * flash, 0, Math.PI * 2);ctx.fill();
    }

    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-amber-89", 0.75);
    ctx.lineWidth = 1.2;
    ctx.beginPath();ctx.arc(cx, cy, R * 0.34, 0, -th, true);ctx.stroke();
    ctx.font = QGA_TOKENS.monoPx(10);
    ctx.fillStyle = QGA_TOKENS.alpha("pigment-amber-89", 0.9);
    ctx.fillText("θ = " + (th * 180 / Math.PI).toFixed(0) + "°",
    cx + R * 0.44 * Math.cos(th / 2) - 14, cy - R * 0.44 * Math.sin(th / 2) + 3);

    ctx.font = QGA_TOKENS.monoPx(9.5);
    ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.55);
    ctx.fillText("incoming", 8, cy - 8);
    ctx.fillText("forward", cx + R * 1.18 - 42, cy - 8);
    ctx.fillStyle = QGA_TOKENS.alpha("pigment-azure-80-c11", 0.5);
    ctx.fillText("dσ/dΩ", 8, 14);
  }, [process.id, cosTheta, photonX, tau, fontsReady]);
  return (
    <canvas ref={ref} className="qft-scatter"
    aria-label="Scattering plane: polar angular cross-section envelope with animated wave packets"></canvas>);

}

/* Spacetime picture: the two incoming packets converge along the beam axis,
   meet at τ = 0.5, and the outgoing pair recedes with longitudinal speed
   cos θ. The fringe pattern is the superposition of the two carrier waves. */
function QFTWaterfall({ cosTheta, tau }) {
  const spec = useMemo(() => window.QGA_FIGURE.plots.qft.waterfallSpec({ cosTheta, tau }), [cosTheta, tau]);
  return <Figure spec={spec}></Figure>;
}

/* Angular distribution, normalised to its 90° value. The y axis is clipped at
   min(20, max) so the t-channel forward pole stays on screen. */
function QFTAngularPlot({ process, cosTheta, photonX }) {
  const spec = useMemo(() => window.QGA_FIGURE.plots.qft.angularSpec({ process, cosTheta, photonX }), [process.id, cosTheta, photonX]);
  return <Figure spec={spec}></Figure>;
}

/* Two-panel energy scan: the photon 1/s cross-section on a log axis, and the
   Z⁰ Breit–Wigner shape on a linear axis zoomed to ±3Γ. */
function QFTResonancePlot({ sqrtS }) {
  const photon = useMemo(() => window.QGA_FIGURE.plots.qft.photonCrossSectionSpec({ sqrtS }), [sqrtS]);
  const zPole = useMemo(() => window.QGA_FIGURE.plots.qft.zResonanceSpec({ sqrtS }), [sqrtS]);
  return (
    <div className="qft-stack">
      <Figure spec={photon}></Figure>
      <Figure spec={zPole}></Figure>
    </div>);
}

function AmplitudeRoom() {
  const [atlasState, setAtlasState] = useQGAState();
  const processId = atlasState.qftProcess;
  const process = QFT_PROCESSES.find((p) => p.id === processId) || QFT_PROCESSES[0];
  const sqrtS = atlasState.qftSqrtS;
  const cosTheta = atlasState.qftAngle;
  const photonX = atlasState.qftPhotonX;
  const fontsReady = useQFTFontsReady();

  /* Presentation-only clock over a normalised τ ∈ [0, 1]. The physics
     readouts below do not depend on it. */
  const [tau, setTau] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const reducedMotion = useMemo(() =>
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  useEffect(() => {
    if (!playing) return undefined;
    let raf = 0,last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;last = now;
      setTau((t) => Math.min(1, t + dt * speed * 0.5));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);
  useEffect(() => {if (playing && tau >= 1) setPlaying(false);}, [tau, playing]);
  useEffect(() => {setTau(0);setPlaying(!reducedMotion);}, [processId, reducedMotion]);
  const togglePlay = () => {if (!playing && tau >= 1) setTau(0);setPlaying(!playing);};

  const kin = window.QGA_PHYSICS.mandelstamKinematics({ sqrtS, cosTheta, masses: process.masses });
  const sigma = window.QGA_PHYSICS.qftTotalCrossSection({ sqrtS });
  const bw = window.QGA_PHYSICS.breitWignerResonance({ sqrtS });
  const shapeNow = window.QGA_PHYSICS.angularDistribution({ process: process.id, cosTheta, photonX });
  const shape90 = window.QGA_PHYSICS.angularDistribution({ process: process.id, cosTheta: 0, photonX });
  const verdict = feyAnalyze(process.in[0], process.in[1], process.out[0], process.out[1]);
  const identityOk = Math.abs(kin.residual) < 1e-6;
  const phase = tau < 0.46 ? "incoming" : tau > 0.54 ? "outgoing" : "interaction";

  return (
    <div className="viz-frame qft-room">
      <div className="kerr-observatory-head">
        <div className="kerr-head-plate">
          <div className="kerr-head-ident">QFT<span>AMP</span></div>
          <div>
            <h3>The Amplitude Room</h3>
            <p>A live 2 → 2 scattering bench: Mandelstam kinematics, angular distributions and the Z⁰ resonance,
            evaluated from the pure functions in <code>js/physics.mjs</code>.</p>
          </div>
        </div>
        <div className="kerr-head-state">
          <span className="badge badge-established">Leading-order QED</span>
          <div className="kerr-state-line">
            {process.name} · <Eq tex="\sqrt{s}"></Eq> = {sqrtS.toFixed(1)} GeV · <Eq tex="\cos\theta"></Eq> = {cosTheta.toFixed(2)}
          </div>
          <div className="kerr-state-line">
            <Eq tex="\sigma"></Eq> = {sigma.toFixed(4)} nb · {verdict.ok ? verdict.topo + "-channel" : "forbidden"} · {phase}
          </div>
        </div>
      </div>

      <div className="kerr-instrument-bar">
        <div className="kerr-control-group" aria-label="Process">
          <span className="kerr-control-label">Process</span>
          {QFT_PROCESSES.map((p) =>
          <button key={p.id} className={"kerr-chip" + (p.id === process.id ? " on" : "")}
          aria-pressed={p.id === process.id}
          onClick={() => setAtlasState({ qftProcess: p.id })}>{p.name}</button>
          )}
        </div>
        <div className="kerr-control-group" aria-label="Kinematic controls">
          <SliderRow label="√s" min={1} max={200} step={0.5} value={sqrtS}
          onChange={(v) => setAtlasState({ qftSqrtS: v })} format={(v) => v.toFixed(1) + " GeV"}></SliderRow>
          <SliderRow label={process.angleLabel} min={-1} max={1} step={0.01} value={cosTheta}
          onChange={(v) => setAtlasState({ qftAngle: v })} format={(v) => v.toFixed(2)}></SliderRow>
          {process.id === "compton" ?
          <SliderRow label="x = E_γ/mₑc²" min={0.05} max={20} step={0.05} value={photonX}
          onChange={(v) => setAtlasState({ qftPhotonX: v })} format={(v) => v.toFixed(2)}></SliderRow> :
          null}
        </div>
      </div>

      <div className="qft-transport-strip">
        <span className="qft-transport-label">Collision clock</span>
        <div className="gw-transport" aria-label="Collision playback transport">
          <button className="gw-play-btn" onClick={togglePlay}
          aria-label={playing ? "Pause collision" : "Play collision"}>{playing ? "❚❚" : "▶"}</button>
          <button className="gw-replay-btn" onClick={() => {setTau(0);setPlaying(!reducedMotion);}}
          aria-label="Replay from the start">↺</button>
          <div className="gw-progress" role="slider" aria-label="Collision phase"
          aria-valuemin={0} aria-valuemax={1} aria-valuenow={Number(tau.toFixed(3))}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const r = e.currentTarget.getBoundingClientRect();
            setTau(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
          }}
          onPointerMove={(e) => {
            if (!(e.buttons & 1)) return;
            const r = e.currentTarget.getBoundingClientRect();
            setTau(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
          }}>
            <div className="gw-progress-fill" style={{ width: 100 * tau + "%" }}></div>
          </div>
          <span className="gw-time">τ = {tau.toFixed(2)}</span>
          <div className="gw-speed" aria-label="Playback speed">
            {[0.5, 1, 2, 4].map((s) =>
            <button key={s} className={"kerr-chip" + (speed === s ? " on" : "")} aria-pressed={speed === s}
            onClick={() => setSpeed(s)}>{s}×</button>
            )}
          </div>
        </div>
        <span className="qft-phase-chip">{phase}</span>
      </div>

      <div className="qft-stage">
        <figure className="qft-panel">
          <header className="qft-panel-head">
            <span className="qft-panel-title">Scattering plane</span>
            <span className="qft-panel-note">dσ/dΩ envelope · <RichText text={process.shapeLabel}></RichText></span>
          </header>
          <div className="qft-panel-body">
            <QFTScatterCanvas process={process} cosTheta={cosTheta} photonX={photonX} tau={tau}
            fontsReady={fontsReady}></QFTScatterCanvas>
          </div>
        </figure>
        <QFTWaterfall cosTheta={cosTheta} tau={tau}></QFTWaterfall>
      </div>

      <div className="qft-plots">
        <div>
          <div className="qft-formula"><Eq tex={process.shapeTex} display={true}></Eq></div>
          <QFTAngularPlot process={process} cosTheta={cosTheta} photonX={photonX}></QFTAngularPlot>
        </div>
        <QFTResonancePlot sqrtS={sqrtS}></QFTResonancePlot>
      </div>

      <div className="kerr-deck">
        <section className="kerr-rgroup">
          <header><h4>Mandelstam kinematics</h4><span>natural units · GeV²</span></header>
          <div className="kerr-rgrid">
            <QFTReadout lead label="√s" value={sqrtS.toFixed(1)} unit="GeV"
            formula="centre-of-mass energy"></QFTReadout>
            <QFTReadout label="s" value={kin.s.toFixed(2)} unit="GeV²"
            formulaTex="s = (p_1 + p_2)^2"></QFTReadout>
            <QFTReadout label="t" value={kin.t.toFixed(2)} unit="GeV²"
            formulaTex="t = m_1^2 + m_3^2 - 2E_1E_3 + 2p_1p_3\cos\theta"></QFTReadout>
            <QFTReadout label="u" value={kin.u.toFixed(2)} unit="GeV²"
            formulaTex="u = m_1^2 + m_4^2 - 2E_1E_4 - 2p_1p_3\cos\theta"></QFTReadout>
            <QFTReadout label="Σ mᵢ²" value={kin.sum.toFixed(4)} unit="GeV²"
            formulaTex="\Sigma\, m_i^2 = m_1^2 + m_2^2 + m_3^2 + m_4^2"></QFTReadout>
            <QFTReadout label="s+t+u−Σmᵢ²" value={kin.residual.toExponential(1)} unit="GeV²"
            formula="exact identity — residual is floating-point noise"></QFTReadout>
          </div>
        </section>
        <section className="kerr-rgroup">
          <header><h4>Observables</h4><span>leading order</span></header>
          <div className="kerr-rgrid">
            <QFTReadout lead label="σ_γ" value={sigma.toFixed(4)} unit="nb"
            formulaTex="\sigma_\gamma = \dfrac{4\pi\alpha^2}{3s}"
            note="massless s-channel benchmark"></QFTReadout>
            <QFTReadout label="Z⁰ Breit–Wigner" value={bw.toFixed(4)}
            formulaTex="\dfrac{m^2\Gamma^2}{(s - m^2)^2 + m^2\Gamma^2}"
            note="1 at √s = m"></QFTReadout>
            <QFTReadout label="dσ/dΩ at cos θ" value={(shapeNow / shape90).toFixed(3)} unit="× 90°"
            formulaTex={process.shapeTex}></QFTReadout>
            {process.id === "compton" ?
            <QFTReadout label="photon energy ratio" value={photonX.toFixed(2)} unit="× mₑc²"
            formulaTex="x = E_\gamma / m_e c^2" note="lab frame"></QFTReadout> :
            <QFTReadout label="beam energy E₁" value={kin.E1.toFixed(2)} unit="GeV"
            formula="centre-of-mass frame"></QFTReadout>}
          </div>
        </section>
      </div>

      <div className="qft-identity">
        <span className={"kerr-check " + (identityOk ? "ok" : "bad")}>
          {identityOk ? "s + t + u = Σmᵢ² ✓" : "identity residual " + kin.residual.toExponential(1)}
        </span>
        <span className={"kerr-check " + (verdict.ok ? "ok" : "bad")}>
          {verdict.ok ? "conservation laws satisfied" : "forbidden process"}
        </span>
        <span className="qft-identity-note">{verdict.ok ? verdict.note : verdict.reason}</span>
      </div>

      <details className="kerr-validity">
        <summary>
          <span>Assumptions, validity &amp; uncertainty</span>
          <span className="kerr-check ok">leading order · closed forms</span>
        </summary>
        <div className="kerr-validity-body">
          <dl>
            <dt>What is exact</dt>
            <dd>
              The Mandelstam identity <Eq tex="s + t + u = \sum_i m_i^2"></Eq>, the massless s-channel shape
              <Eq tex="1 + \cos^2\theta"></Eq>, the total cross-section <Eq tex="\sigma = 4\pi\alpha^2/3s"></Eq>,
              the Klein–Nishina shape and the Breit–Wigner form are closed-form leading-order results. They are evaluated live by <code>js/physics.mjs</code> and covered by
              <code> node:test</code> cases in <code>test/physics.test.mjs</code>.
            </dd>
            <dt>What is approximate</dt>
            <dd>
              The t-channel curve plots only the leading pole <Eq tex="1/\sin^4(\theta/2)"></Eq>. The complete Møller and Bhabha
              amplitudes also contain s- and u-channel terms and their interference, which are deliberately not
              drawn — guessing their coefficients would be worse than omitting them. The Z⁰ panel shows the
              Breit–Wigner shape alone, not the γ–Z⁰ interference term, and the fermion masses are set to zero
              except in the Compton process.
            </dd>
            <dt>What is schematic</dt>
            <dd>
              The scattering-plane and spacetime canvases are pedagogical animations. The wave packets are
              Gaussian envelopes with a carrier wave, not solutions of the QED amplitude; the envelope radius is
              the angular distribution normalised to its 90° value and clipped at 6×. The spacetime panel's
              longitudinal separation tracks cos θ, which is the correct kinematic trend, but the fringe pattern
              is a two-packet superposition rather than a field-theory calculation.
            </dd>
            <dt>References</dt>
            <dd>
              {process.ref}. Mandelstam variables: Mandelstam (1958). Klein–Nishina: Klein &amp; Nishina (1929).
              Z⁰ mass and width: PDG values <Eq tex="m_Z = 91.1876\ \mathrm{GeV}"></Eq>,
              <Eq tex="\Gamma_Z = 2.4952\ \mathrm{GeV}"></Eq>. Fine-structure constant: CODATA
              <Eq tex="\alpha = 1/137.035999084"></Eq>.
            </dd>
            <dt>Units</dt>
            <dd>
              Natural units <Eq tex="\hbar = c = 1"></Eq>. Energies in GeV, cross-sections in nanobarns
              (<Eq tex="1\ \mathrm{GeV}^{-2} = 3.8938\times10^{5}\ \mathrm{nb}"></Eq>). The Compton slider
              <Eq tex="x"></Eq> is a lab-frame ratio and is deliberately decoupled from <Eq tex="\sqrt{s}"></Eq>.
            </dd>
          </dl>
        </div>
      </details>

      <VizCaption status="schematic">
        The readouts are exact leading-order QED results; the two canvases are a schematic animation of the same
        process. Drag the transport to scrub the collision, or change √s and cos θ to watch the Mandelstam
        variables, the angular shape and the resonance curve respond. Every value is a pure function of the
        sliders — the animation adds no physics of its own.
      </VizCaption>
    </div>);

}

/* ---------- Prompt 07: vacuum fluctuations compute lab (Fourier-mode field) ---------- */
function QftComputeLab() {
  const [state, setState] = useQGAState();
  const mode = state.qftLabMode;
  const mass = state.qftLabMass;
  const seed = state.seed;

  const build = async (ctx) => {
    const LABS = window.QGA_LABS;
    if (!LABS) throw new Error("Compute-lab module unavailable");
    const { createQftFieldLabRuntime } = await LABS.loadQftLab();
    ctx.scene.fog = new ctx.THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.016);
    const runtime = createQftFieldLabRuntime({ seed, mass, mode, showParticles: true });
    ctx.scene.add(runtime.mesh);
    ctx.label(mode === "flux"
      ? "SCHEMATIC · flux-tube profile — a modelled cross-section, not a lattice-QCD result"
      : "EFFECTIVE · free Klein–Gordon vacuum — Fourier modes to the disclosed cutoff k ≤ 14",
    () => ({ x: -4.2, y: 3.2, z: -3.4 }), "s3d-strong");
    ctx.label("each row is one time slice · the front row is the field right now",
    () => ({ x: 2.6, y: -1.6, z: 3.4 }), "s3d-quiet");
    return {
      update: (t) => {
        runtime.sync({ time: t, motion: ctx.motion() === 0 ? 0 : 1 });
        window.__qgaQftLab = { kind: runtime.kind, mode, mass, ...runtime.stats() };
      },
      prepare: (renderer) => runtime.prepare(renderer),
      compute: (renderer, dt) => runtime.compute(renderer, dt),
      dispose: () => {
        runtime.dispose();
        delete window.__qgaQftLab;
      },
      recoverable: () => false,
    };
  };

  return (
    <div className="viz-frame">
      <div className="viz-toolbar lab-toolbar">
        <div className="kerr-control-group" aria-label="Vacuum lab view">
          <span className="kerr-control-label">View</span>
          {[
            ["field", "Field φ(x, t)"], ["correlation", "Correlation ⟨φφ⟩"], ["flux", "Flux tube"],
          ].map(([key, label]) => (
            <button key={key} className={"kerr-chip" + (mode === key ? " on" : "")}
            aria-pressed={mode === key} onClick={() => setState({ qftLabMode: key })}>{label}</button>
          ))}
        </div>
        <SliderRow label="mass m" min={0} max={3} step={0.05} value={mass}
        onChange={(v) => setState({ qftLabMass: v })} format={(v) => v.toFixed(2)}></SliderRow>
      </div>
      <Scene3D animated="motion" nodeKit height={420} aria="Three-dimensional waterfall of a free quantum field vacuum built from Fourier modes; the view switches between field amplitude, equal-time correlation and a schematic flux tube"
      initial={{ radius: 15.5, theta: 0.55, phi: 1.06, minR: 6, maxR: 34, bloom: { strength: 0.62, radius: 0.5, threshold: 0.2 } }}
      build={build} deps={[mode, mass, seed]}
      fallback={<div className="lab-fallback">The 3-D vacuum lab needs WebGL; the module numerics remain available via the export.</div>}></Scene3D>
      <VizCaption status={mode === "flux" ? "schematic" : "effective"}>
        {mode === "flux" ? (
          <>The tube is a <strong>schematic</strong> cross-section of a confining flux tube (a transverse
            Gaussian profile whose width shrinks as the string tension grows); it illustrates the shape of the
            energy distribution quoted in the literature, not a lattice-QCD computation. The underlying field
            rows remain the same effective free-field modes.</>
        ) : mode === "correlation" ? (
          <>The highlighted curve is the equal-time two-point correlation ⟨φ(x)φ(x+r)⟩ of exactly the field
            drawn here, measured over 96 sample separations — the free-field result computed numerically, not
            fitted. Correlations decay faster as the mass grows: the mass gap suppresses long-distance
            entanglement, which is why the nuclear force is short-ranged.</>
        ) : (
          <>The vacuum is rendered as a superposition of plane-wave modes with frequencies
            <Eq tex="\omega_k=\sqrt{k^2+m^2}"></Eq>, amplitudes drawn from a seeded distribution and truncated at
            a disclosed cutoff k ≤ 14 — an <strong>effective</strong> free field, not the interacting vacuum.
            Bright sprites mark local maxima of the newest slice: the “particle” reading of the same field.
            Change m and watch the temporal oscillation at k = 0 speed up or stop.</>
        )}
      </VizCaption>
    </div>);

}

function ModuleQFT({ go }) {
  return (
    <article>
      <ModuleHeader num="02" kicker="Fields before particles" title="Quantum Field Theory"
      lede="Quantum field theory merges quantum mechanics with special relativity by taking fields, not particles, as fundamental. A particle is a localized, quantized excitation of a field that fills all of spacetime — every electron is a ripple in one and the same electron field."></ModuleHeader>

      <Section title="The field laboratory">
        <p>
          Each particle species corresponds to a field defined at every point of spacetime. In the vacuum, the field
          rests near zero expectation value (with irreducible quantum fluctuations). Energy deposited into the field
          creates excitations; in the quantum theory these excitations come in discrete units — quanta — which we
          register as particles. Creation and annihilation operators add and remove these quanta from a state.
        </p>
        <FieldLab3D></FieldLab3D>
      </Section>

      <Section title="Vacuum fluctuations, computed">
        <p>
          The membrane above integrates the field in time; this lab shows what the <em>vacuum itself</em> is.
          A free quantum field in its lowest energy state is not still — it is a superposition of independent
          harmonic oscillators, one per Fourier mode, each jittering with its zero-point amplitude. Here that
          superposition is built explicitly from a seeded set of modes, rendered as a time waterfall, and read
          three ways: the field amplitude, its equal-time correlation function, and a schematic flux tube.
          Everything on screen is computed by <code>js/science/qft-fields.mjs</code> with a disclosed cutoff,
          so the same seed replays the same vacuum, frame for frame.
        </p>
        <QftComputeLab></QftComputeLab>
      </Section>

      <Section title="Amplitudes and diagrams">
        <p>
          Interacting field theories are solved perturbatively: the amplitude for a scattering process is expanded in
          powers of the coupling, and Feynman diagrams are the bookkeeping for the terms. Each diagram translates
          directly into a number through the Feynman rules — a factor for every external line, a propagator for every
          internal line, and a coupling for every vertex — which are squared and integrated over phase space to give
          a measurable cross-section. Pick a process below (or build your own); the lab animates the exchange,
          enforces the conservation laws every vertex obeys, and shows the leading-order amplitude and cross-section.
        </p>
        <FeynmanBuilder></FeynmanBuilder>
      </Section>

      <Section title="The amplitude room">
        <p>
          A diagram is only a picture until the Feynman rules turn it into a number. This bench does that
          conversion live: pick a 2 → 2 process, then move the centre-of-mass energy √s and the scattering angle
          θ. The Mandelstam variables s, t and u are recomputed from the four-momenta on every frame, the angular
          distribution is drawn in polar and Cartesian form, and the energy scan shows the photon 1/s fall-off
          alongside the Z⁰ resonance. Every readout is a closed-form leading-order result evaluated by the pure
          functions in <code>js/physics.mjs</code>; the animation is presentation only.
        </p>
        <AmplitudeRoom></AmplitudeRoom>
      </Section>

      <Section title="Mathematical formulation">
        <div className="formula-grid">
          <FormulaCard title="Path integral amplitude" status="established"
          tex="\langle \phi_f | e^{-iHt/\hbar} | \phi_i \rangle = \int \mathcal{D}\phi \; e^{\,iS[\phi]/\hbar}"
          symbols={[
          { s: "\\mathcal{D}\\phi", d: "Functional integration over all field configurations connecting initial and final states." },
          { s: "S[\\phi]", d: "Classical action — the time integral of the Lagrangian, evaluated on each configuration." },
          { s: "\\hbar", d: "Reduced Planck constant; as ħ → 0 stationary phase selects classical solutions." }]
          }
          meaning="Feynman's formulation: the quantum amplitude is a coherent sum over every possible history, each weighted by a phase. Interference between histories produces all quantum phenomena."
          limits="The measure 𝒟φ is defined rigorously only in special cases; in practice the integral is computed perturbatively or on a lattice."></FormulaCard>
          <FormulaCard title="Klein–Gordon equation" status="established"
          tex="\left(\Box + \frac{m^2 c^2}{\hbar^2}\right)\phi = 0, \qquad \Box \equiv \frac{1}{c^2}\frac{\partial^2}{\partial t^2} - \nabla^2"
          symbols={[
          { s: "\\phi", d: "Scalar field amplitude." },
          { s: "\\Box", d: "d'Alembert wave operator — the relativistic generalization of the Laplacian." },
          { s: "m", d: "Mass of the field's quanta; sets the dispersion relation E² = p²c² + m²c⁴." }]
          }
          meaning="The free relativistic wave equation for spin-0 fields. The field laboratory above integrates exactly this equation on a lattice."
          limits="Free (non-interacting) field only. As a single-particle wave equation it fails (negative probabilities); it is consistent only as a field equation."></FormulaCard>
          <FormulaCard title="Dirac equation" status="established"
          tex="\left(i\gamma^\mu \partial_\mu - \frac{mc}{\hbar}\right)\psi = 0"
          symbols={[
          { s: "\\psi", d: "Four-component spinor field describing spin-½ particles." },
          { s: "\\gamma^\\mu", d: "Dirac matrices satisfying {γ^μ, γ^ν} = 2η^{μν} — the algebra that linearizes the relativistic energy relation." },
          { s: "m", d: "Fermion mass." }]
          }
          meaning="The relativistic equation for electrons and all matter fermions. Spin-½ and the existence of antimatter are consequences, not assumptions."
          limits="Free-field form shown; interactions enter by replacing ∂ with the gauge-covariant derivative D."></FormulaCard>
          <FormulaCard title="Feynman propagator" status="established"
          tex="\tilde{G}_F(p) = \frac{i}{p^2 - m^2 + i\epsilon}"
          symbols={[
          { s: "p", d: "Four-momentum flowing through the internal line (p² = E² − |p⃗|² in natural units)." },
          { s: "m", d: "Mass of the exchanged field's quanta; the pole at p² = m² corresponds to a real particle." },
          { s: "i\\epsilon", d: "Infinitesimal prescription enforcing causal boundary conditions." }]
          }
          meaning="The amplitude for a field disturbance to propagate between two vertices. Internal lines in the diagram builder carry exactly this factor, integrated over off-shell momenta."
          limits="Internal momenta need not satisfy p² = m² — which is why 'virtual particles' are calculational terms rather than observed objects."></FormulaCard>
          <FormulaCard title="Mandelstam variables" status="established"
          tex="s + t + u = \sum_i m_i^2 c^4, \quad s = (p_1+p_2)^2,\ t = (p_1-p_3)^2"
          symbols={[
          { s: "s", d: "Centre-of-mass energy squared — the invariant that sets the energy scale of a collision; the s-channel propagator carries it." },
          { s: "t", d: "Momentum transfer squared — the invariant probed in t-channel exchange; small t means forward (glancing) scattering." },
          { s: "u", d: "The crossed channel; for identical outgoing particles u- and t-channel diagrams interfere." }]
          }
          meaning="Lorentz-invariant combinations of the external momenta. Every amplitude in the lab above is a function of s, t, and u — which channel dominates is exactly which template you selected."
          limits="Defined for 2 → 2 kinematics; multi-particle final states need a larger set of invariants."></FormulaCard>
          <FormulaCard title="Fermi's golden rule" status="established"
          tex="d\Gamma = \frac{2\pi}{\hbar}\,|\mathcal{M}|^2\,d\rho_f"
          symbols={[
          { s: "\\Gamma", d: "Transition rate (decay width, or per-collision probability) — what experiments actually measure." },
          { s: "|\\mathcal{M}|^2", d: "Squared matrix element from the diagrams: the modulus-squared coherent sum of all contributing amplitudes." },
          { s: "d\\rho_f", d: "Density of final states (phase space) available to the products." }]
          }
          meaning="The bridge from a Feynman amplitude to an observable: square the diagram sum, weight by available phase space, integrate. Rates and cross-sections follow directly."
          limits="First-order (Born) form; strong couplings or near-resonance kinematics require resummation."></FormulaCard>
        </div>
      </Section>

      <Misconception title="Particles are not tiny classical balls.">
        A 'particle' in quantum field theory is a unit of excitation of a field mode — it has no trajectory, no
        definite surface, and its number can change in interactions. The classical-ball picture fails for
        identical-particle statistics, particle creation, and vacuum effects alike.
      </Misconception>
      <Misconception title="Virtual particles are calculation tools.">
        Internal lines of Feynman diagrams represent terms in a perturbative series. They are not directly observed
        objects 'briefly violating energy conservation' — energy is conserved exactly at every vertex; it is the
        mass-shell condition that internal lines need not satisfy.
      </Misconception>
      <ConceptBridge id="qft-rg" go={go}></ConceptBridge>
    </article>);

}

window.ModuleQFT = ModuleQFT;