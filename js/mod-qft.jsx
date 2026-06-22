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

  const KIND_COLOR = { scalar: "oklch(0.78 0.1 200)", spinor: "oklch(0.72 0.13 300)", gauge: "oklch(0.74 0.12 235)" };
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
    ctx.strokeStyle = "rgba(148,176,224,0.12)";ctx.lineWidth = 1;ctx.beginPath();
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
      ctx.font = "10px IBM Plex Mono";ctx.textAlign = "center";
      labelsRef.current = labelsRef.current.filter((L) => t - L.t0 < 3.2);
      for (const L of labelsRef.current) {
        const a = Math.max(0, 1 - (t - L.t0) / 3.2);
        ctx.fillStyle = "rgba(200,215,240," + (a * 0.85).toFixed(3) + ")";
        ctx.fillText("localized excitation — particle-like quantum", L.x, baseY - amp * 0.95);
        ctx.strokeStyle = "rgba(200,215,240," + (a * 0.3).toFixed(3) + ")";
        ctx.beginPath();ctx.moveTo(L.x, baseY - amp * 0.9);ctx.lineTo(L.x, baseY - amp * 0.55);ctx.stroke();
      }
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(148,176,224,0.5)";
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
    const { THREE, scene } = ctx;
    scene.fog = new THREE.FogExp2(0x04060b, 0.018);
    scene.add(new THREE.AmbientLight(0x8899bb, 0.55));
    const key = new THREE.DirectionalLight(0xbcd0ff, 0.9);
    key.position.set(5, 9, 4);
    scene.add(key);
    const floor = ctx.grid(18, 18, 0x2a3a58, 0.16);
    floor.position.y = -2.2;
    scene.add(floor);

    const det = ctx.settings.current.detail3d;
    const N = det === "low" ? 48 : det === "ultra" ? 88 : 64;
    const SIZE = 12;
    fieldRef.current = { phi: new Float64Array(N * N), pi: new Float64Array(N * N) };

    const geo = new THREE.PlaneGeometry(SIZE, SIZE, N - 1, N - 1);
    geo.rotateX(-Math.PI / 2);
    const colAttr = new THREE.BufferAttribute(new Float32Array(N * N * 3), 3);
    geo.setAttribute("color", colAttr);
    const surf = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true, metalness: 0.36, roughness: 0.34,
      emissive: 0x0c1830, emissiveIntensity: 0.7, side: THREE.DoubleSide,
      flatShading: false,
    }));
    scene.add(surf);

    // luminous crest overlay: shares the membrane's position buffer, own glow colours
    // (near-black in the vacuum, hot at the crests) so only excitations catch the bloom —
    // kept faint so the surface reads as a fluid field, not a dense wire grid.
    const gcolAttr = new THREE.BufferAttribute(new Float32Array(N * N * 3), 3);
    const geoGlow = new THREE.BufferGeometry();
    geoGlow.setIndex(geo.index);
    geoGlow.setAttribute("position", geo.attributes.position);
    geoGlow.setAttribute("color", gcolAttr);
    const wire = new THREE.Mesh(geoGlow, new THREE.MeshBasicMaterial({
      vertexColors: true, wireframe: true, transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    wire.renderOrder = 2;
    scene.add(wire);

    const base = new THREE.Color(0x2c4368);
    const up = new THREE.Color(0x7fe0ee);
    const dn = new THREE.Color(0xc09cf6);
    const hotUp = new THREE.Color(0xeafcff);
    const hotDn = new THREE.Color(0xf2e6ff);
    const white = new THREE.Color(0xffffff);
    const tmp = new THREE.Color();
    const tmpG = new THREE.Color();

    ctx.label("φ(x, y, t) — field amplitude", () => ({ x: -SIZE / 2, y: 2.3, z: -SIZE / 2 }), "s3d-strong");
    ctx.label("vacuum ⟨φ⟩ = 0", () => ({ x: SIZE / 2 - 1.5, y: 0.35, z: SIZE / 2 - 2 }), "s3d-quiet");
    ctx.annotation("click the surface to inject a localized excitation — a particle-like quantum",
    () => ({ x: 0, y: 1.7, z: SIZE * 0.34 }));

    const pos = geo.attributes.position;
    const dx = SIZE / N;

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
      },
      update: (t, dt) => {
        const F = fieldRef.current;
        // living vacuum: faint zero-point shimmer so the membrane is never quite still
        if (dt > 0) {
          for (let n = 0; n < 5; n++) {
            const rk = Math.random() * N * N | 0;
            F.pi[rk] += (Math.random() - 0.5) * 0.5;
          }
        }
        const m = massRef.current;
        const steps = 3,sdt = Math.min(dt, 0.034) / steps;
        if (sdt > 0) {
          const { phi, pi } = F;
          const c2 = 30,gam = 0.35;
          for (let s = 0; s < steps; s++) {
            for (let j = 0; j < N; j++) {
              for (let i = 0; i < N; i++) {
                const k = j * N + i;
                const l = i > 0 ? phi[k - 1] : 0,r = i < N - 1 ? phi[k + 1] : 0;
                const u = j > 0 ? phi[k - N] : 0,d = j < N - 1 ? phi[k + N] : 0;
                const lap = (l + r + u + d - 4 * phi[k]) / (dx * dx);
                pi[k] += sdt * (c2 * lap - m * m * 9 * phi[k] - gam * pi[k]);
              }
            }
            for (let k = 0; k < N * N; k++) phi[k] += sdt * pi[k];
          }
        }
        const { phi } = F;
        for (let k = 0; k < N * N; k++) {
          const a = phi[k];
          pos.setY(k, a * 1.9);
          const mag = Math.min(1, Math.abs(a) * 1.4);
          tmp.copy(base).lerp(a >= 0 ? up : dn, mag);
          tmp.lerp(white, Math.max(0, Math.min(0.55, (Math.abs(a) - 0.55) * 0.6)));
          colAttr.setXYZ(k, tmp.r, tmp.g, tmp.b);
          // glow overlay: black in vacuum, hot at the crest
          const gi = Math.min(1.4, Math.abs(a) * 1.25);
          tmpG.copy(a >= 0 ? hotUp : hotDn).multiplyScalar(gi * gi);
          gcolAttr.setXYZ(k, tmpG.r, tmpG.g, tmpG.b);
        }
        pos.needsUpdate = true;
        colAttr.needsUpdate = true;
        gcolAttr.needsUpdate = true;
        geo.computeVertexNormals();
      }
    };
  };

  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <SliderRow label="mass m" min={0} max={3} step={0.05} value={mass} onChange={setMass}
        format={(v) => v.toFixed(2)}></SliderRow>
        <button className="btn" onClick={clearField}>Clear field</button>
      </div>
      <Scene3D height={430} aria="Interactive three-dimensional scalar field membrane; click to excite the field"
      initial={{ radius: 14.5, theta: 0.55, phi: 1.02, minR: 7, maxR: 32, bloom: { strength: 0.78, radius: 0.55, threshold: 0.2 } }}
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
  const cvRef = useRef(null);
  useEffect(() => {
    const cv = cvRef.current;if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth,h = 150;
    cv.width = w * dpr;cv.height = h * dpr;
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const padL = 40,padR = 12,padT = 18,padB = 26;
    const pw = w - padL - padR,ph = h - padT - padB;
    // sim constants: ω² = c²k² + m_eff² with c² = 30, m_eff = 3m
    const C = Math.sqrt(30),kmax = 2.2,m0 = 3 * mass;
    const wmax = Math.sqrt(C * C * kmax * kmax + 9 * 9); // fixed y-scale (m up to 3 → m0=9)
    const X = (k) => padL + k / kmax * pw;
    const Y = (om) => padT + ph * (1 - om / wmax);
    ctx.strokeStyle = "rgba(148,176,224,0.22)";ctx.lineWidth = 1;
    ctx.beginPath();ctx.moveTo(padL, padT);ctx.lineTo(padL, padT + ph);ctx.lineTo(padL + pw, padT + ph);ctx.stroke();
    ctx.font = "10px IBM Plex Mono";ctx.fillStyle = "rgba(148,176,224,0.6)";
    ctx.fillText("dispersion  ω(k)", padL, 12);
    // massless light cone ω = c k (dashed)
    ctx.setLineDash([4, 4]);ctx.strokeStyle = "rgba(148,176,224,0.4)";
    ctx.beginPath();ctx.moveTo(X(0), Y(0));ctx.lineTo(X(kmax), Y(C * kmax));ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle = "rgba(148,176,224,0.5)";ctx.fillText("ω = ck (massless)", X(kmax) - 118, Y(C * kmax) + 2);
    // massive branch ω = √(c²k² + m²)
    ctx.strokeStyle = "oklch(0.8 0.12 200)";ctx.lineWidth = 2;
    ctx.shadowColor = "oklch(0.8 0.12 200)";ctx.shadowBlur = 7;ctx.beginPath();
    for (let i = 0; i <= 120; i++) {const k = i / 120 * kmax,om = Math.sqrt(C * C * k * k + m0 * m0);if (i === 0) ctx.moveTo(X(k), Y(om));else ctx.lineTo(X(k), Y(om));}
    ctx.stroke();ctx.shadowBlur = 0;
    // mass gap marker
    ctx.fillStyle = "oklch(0.85 0.14 85)";
    ctx.beginPath();ctx.arc(X(0), Y(m0), 3.5, 0, Math.PI * 2);ctx.fill();
    ctx.fillText("mass gap ω₀ = mc²", X(0) + 8, Y(m0) + (m0 > wmax * 0.6 ? 14 : -6));
    ctx.fillStyle = "rgba(148,176,224,0.55)";ctx.fillText("wavenumber k →", padL + pw - 96, padT + ph + 16);
  }, [mass]);
  return <div className="viz-frame" style={{ padding: 6, marginTop: 6 }}>
    <canvas ref={cvRef} style={{ width: "100%", height: 150, display: "block" }}
    aria-label="Dispersion relation: angular frequency versus wavenumber, showing the mass gap"></canvas>
  </div>;
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
    order: "O(e²) · leading order — one virtual boson",
    amp: "\\mathcal{M} \\sim \\dfrac{e^2}{s}\\,[\\bar v\\,\\gamma^\\mu u]\\,[\\bar u'\\,\\gamma_\\mu v']",
    sigma: "\\sigma = \\dfrac{4\\pi\\alpha^2}{3s}",
    sigmaNote: "Cross-section falls as 1/s — numerically σ ≈ 86.8 nb / (√s/GeV)², so σ(e⁺e⁻→μ⁺μ⁻) ≈ 0.87 nb at √s = 10 GeV. Near √s ≈ 91 GeV the Z⁰ propagator pole produces a sharp resonance on top of the photon term."
  };
  if (result.topo === "t") return {
    order: "O(e²) · one exchanged photon",
    amp: "\\mathcal{M} \\sim \\dfrac{e^2}{t}",
    sigma: "\\dfrac{d\\sigma}{d\\Omega} \\sim \\dfrac{\\alpha^2}{4E^2\\sin^4(\\theta/2)}",
    sigmaNote: "The Mott/Rutherford form: the t-channel pole at small scattering angle drives the forward Coulomb divergence."
  };
  if (result.topo === "compton") return {
    order: "O(e²) · two vertices, one fermion propagator",
    amp: "\\mathcal{M} \\sim e^2\\,\\bar u'\\,\\Big[\\tfrac{\\gamma\\cdot(p+k)+m}{(p+k)^2-m^2} + \\ldots\\Big]\\,u",
    sigma: "\\sigma_{\\mathrm{KN}} = \\sigma_T\\,f\\!\\left(\\dfrac{E_\\gamma}{m_e c^2}\\right)",
    sigmaNote: "The Klein–Nishina cross-section; it reduces to the classical Thomson value σ_T as E_γ → 0 and falls at high energy."
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
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#aebfdd" strokeWidth="1.6" className="fey-line-flow"></line>
        <polygon points="0,-4 8,0 0,4" fill="#aebfdd"
        transform={"translate(" + mx + "," + my + ") rotate(" + ang * 180 / Math.PI + ")"}></polygon>
        <text x={x1 < W / 2 ? x1 - 8 : x1 + 8} y={y1 + 4} fill="#dde6f5" fontSize="14" fontFamily="Space Grotesk"
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
        <text x="508" y="54" fill="#dde6f5" fontSize="14" fontFamily="Space Grotesk">{labels[2]}</text>
        <text x="508" y="194" fill="#dde6f5" fontSize="14" fontFamily="Space Grotesk">{labels[3]}</text>
        <path d={wavy(v1.x, v1.y, v2.x, v2.y)} stroke="var(--gold)" strokeWidth="2.0" fill="none" className="fey-wave-flow"></path>
        <circle className="fey-packet fey-packet-s" r="3.6"></circle>
        <text x={(v1.x + v2.x) / 2} y={v1.y - 16} fill="oklch(0.8 0.1 85)" fontSize="13" textAnchor="middle" fontFamily="IBM Plex Mono">{result.boson}</text>
        <circle cx={v1.x} cy={v1.y} r="4" fill="var(--acc)" className="fey-vertex"></circle>
        <circle cx={v2.x} cy={v2.y} r="4" fill="var(--acc)" className="fey-vertex"></circle>
        <text x={v1.x} y={v1.y + 22} fill="#7e8ba1" fontSize="10" textAnchor="middle" fontFamily="IBM Plex Mono">vertex</text>
        <text x={(v1.x + v2.x) / 2} y={v1.y + 22} fill="#7e8ba1" fontSize="10" textAnchor="middle" fontFamily="IBM Plex Mono">internal propagator</text>
      </g>;

  } else if (result.topo === "t") {
    const u1 = { x: 280, y: 70 },u2 = { x: 280, y: 170 };
    body =
    <g>
        {fermion(60, 70, u1.x, u1.y, "i1", labels[0], false)}
        {fermion(u1.x, u1.y, 500, 70, "o1", "", false)}
        {fermion(60, 170, u2.x, u2.y, "i2", labels[1], false)}
        {fermion(u2.x, u2.y, 500, 170, "o2", "", false)}
        <text x="508" y="74" fill="#dde6f5" fontSize="14" fontFamily="Space Grotesk">{labels[2]}</text>
        <text x="508" y="174" fill="#dde6f5" fontSize="14" fontFamily="Space Grotesk">{labels[3]}</text>
        <path d={wavy(u1.x, u1.y, u2.x, u2.y)} stroke="var(--gold)" strokeWidth="2.0" fill="none" className="fey-wave-flow"></path>
        <text x={u1.x + 18} y={120} fill="var(--gold)" fontSize="13" fontFamily="IBM Plex Mono">{result.boson}</text>
        <circle className="fey-packet fey-packet-t" r="3.6"></circle>
        <circle cx={u1.x} cy={u1.y} r="4" fill="var(--acc)" className="fey-vertex"></circle>
        <circle cx={u2.x} cy={u2.y} r="4" fill="var(--acc)" className="fey-vertex"></circle>
      </g>;

  } else if (result.topo === "compton") {
    const c1 = { x: 230, y: 130 },c2 = { x: 330, y: 130 };
    body =
    <g>
        <path d={wavy(60, 50, c1.x, c1.y)} stroke="oklch(0.8 0.1 85)" strokeWidth="1.8" fill="none"></path>
        <text x="52" y="54" fill="#dde6f5" fontSize="14" textAnchor="end" fontFamily="Space Grotesk">γ</text>
        {fermion(60, 200, c1.x, c1.y, "i2", labels.find((l) => l !== "γ"), false)}
        <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke="#aebfdd" strokeWidth="1.6" className="fey-line-flow"></line>
        <circle className="fey-packet fey-packet-c" r="3.4"></circle>
        <path d={wavy(c2.x, c2.y, 500, 50)} stroke="oklch(0.8 0.1 85)" strokeWidth="1.8" fill="none"></path>
        <text x="508" y="54" fill="#dde6f5" fontSize="14" fontFamily="Space Grotesk">γ</text>
        {fermion(c2.x, c2.y, 500, 200, "o2", "", false)}
        <text x="508" y="204" fill="#dde6f5" fontSize="14" fontFamily="Space Grotesk">{labels.find((l) => l !== "γ")}</text>
        <circle cx={c1.x} cy={c1.y} r="4" fill="var(--acc)" className="fey-vertex"></circle>
        <circle cx={c2.x} cy={c2.y} r="4" fill="var(--acc)" className="fey-vertex"></circle>
        <text x={(c1.x + c2.x) / 2} y={c1.y + 22} fill="#7e8ba1" fontSize="10" textAnchor="middle" fontFamily="IBM Plex Mono">fermion propagator</text>
      </g>;

  }
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", display: "block" }} role="img" aria-label="Feynman diagram">
      <text x="60" y="24" fill="#7e8ba1" fontSize="10" fontFamily="IBM Plex Mono">time →</text>
      <line x1="60" y1="30" x2="120" y2="30" stroke="#7e8ba1" strokeWidth="1"></line>
      <polygon points="120,26 128,30 120,34" fill="#7e8ba1"></polygon>
      {body}
    </svg>);

}

/* ---------- cinematic 3D collision scene for the selected process ----------
   Renders the chosen 2→2 reaction as a real-time event: incoming quanta stream
   in from the beamline, collide at a luminous vertex, the force carrier is
   exchanged (s-channel propagator / t-channel exchange / Compton fermion line),
   and the products fly out with glowing motion trails. Synced to the builder. */
const FEY_COL = {
  "e-": 0x6ba6ff, "e+": 0x8fc2ff, "mu-": 0xb98af0, "mu+": 0xd0aef7,
  "q": 0x6fd0e0, "qbar": 0x9be6f0, "ph": 0xe0b35a,
};
const feyColHex = (id) => FEY_COL[id] || 0x9fb6e8;

function FeynmanCollision3D({ proc, procKey }) {
  const build = (ctx) => {
    const { THREE, scene } = ctx;
    const P = proc;
    scene.fog = new THREE.FogExp2(0x04060b, 0.02);
    scene.add(new THREE.AmbientLight(0x8fa2c8, 0.7));
    const key = new THREE.DirectionalLight(0xcfe0ff, 0.8); key.position.set(4, 7, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0x5070b0, 0.5); rim.position.set(-5, -3, -4); scene.add(rim);

    // beamline + faint reference plane
    const grid = ctx.grid(20, 20, 0x223052, 0.1); grid.position.y = -3.0; scene.add(grid);
    const beam = ctx.line([new THREE.Vector3(-8, 0, 0), new THREE.Vector3(8, 0, 0)], 0x37507e, 0.35, true);
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
      const tg = new THREE.BufferGeometry();
      const tbuf = new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3);
      tg.setAttribute("position", tbuf); tg.setDrawRange(0, 0);
      const tl = new THREE.Line(tg, new THREE.LineBasicMaterial({
        color: hex, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      tl.frustumCulled = false; scene.add(tl);
      return { core, glow, tbuf, tg, tl, hex, trail: [] };
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
      for (let i = 0; i < n; i++) q.tbuf.setXYZ(i, q.trail[i * 3], q.trail[i * 3 + 1], q.trail[i * 3 + 2]);
      q.tbuf.needsUpdate = true; q.tg.setDrawRange(0, n);
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
    const medBuf = new THREE.BufferAttribute(new Float32Array((medN + 1) * 3), 3);
    const medGeo = new THREE.BufferGeometry(); medGeo.setAttribute("position", medBuf);
    const medHex = isCompton ? 0xc7d4ee : 0xffcf73;
    const medLine = new THREE.Line(medGeo, new THREE.LineBasicMaterial({
      color: medHex, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    medLine.frustumCulled = false; scene.add(medLine);
    const packet = ctx.glow(medHex, 0.9, 0); scene.add(packet);

    // collision flashes
    const flashA = ctx.glow(0xfff2d0, 2.2, 0); scene.add(flashA); // primary vertex
    const flashB = ctx.glow(0xfff2d0, 2.2, 0); scene.add(flashB); // secondary vertex

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
      medLine.material.opacity = op;
      const a = new THREE.Vector3(...aArr), b = new THREE.Vector3(...bArr);
      const dir = new THREE.Vector3().subVectors(b, a);
      medMid.copy(a).addScaledVector(dir, 0.5).add(new THREE.Vector3(0, isT ? 0 : 0.5, 0));
      for (let i = 0; i <= medN; i++) {
        const f = i / medN;
        const off = wavy ? Math.sin(f * Math.PI * 7 + tphase) * amp * Math.sin(f * Math.PI) : 0;
        V.copy(a).addScaledVector(dir, f).addScaledVector(perpZ, off);
        medBuf.setXYZ(i, V.x, V.y, V.z);
      }
      medBuf.needsUpdate = true;
      // travelling packet rides the exchange
      packet.material.opacity = op > 0 ? 0.95 : 0;
      V.copy(a).addScaledVector(dir, frac);
      packet.position.copy(V);
      packet.scale.setScalar(0.9 + 0.5 * Math.sin(tphase));
    };
    const hideMed = () => { medLine.material.opacity = 0; packet.material.opacity = 0; };

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
      <Scene3D height={360}
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
                  <div className="fey-phys-note">{phys.order}</div>
                </div>
                <div className="fey-phys-card">
                  <div className="fey-phys-label">Cross-section scaling</div>
                  <Eq tex={phys.sigma} display={true}></Eq>
                  <div className="fey-phys-note">{phys.sigmaNote}</div>
                </div>
                <div className="fey-phys-card">
                  <div className="fey-phys-label">Coupling</div>
                  <Eq tex="\alpha = \dfrac{e^2}{4\pi\varepsilon_0 \hbar c} \approx \dfrac{1}{137}" display={true}></Eq>
                  <div className="fey-phys-note">Each vertex contributes one power of e (√α). Every extra photon loop suppresses the amplitude by α — why QED perturbation theory converges so well.</div>
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