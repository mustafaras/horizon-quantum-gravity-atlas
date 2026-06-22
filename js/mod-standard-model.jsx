// mod-standard-model.jsx — Module 01: The Standard Model
const SM3D_HEX = { quark: 0xb98af0, lepton: 0x6fd0e0, gauge: 0x6ba6ff, higgs: 0xe8c170 };
const SM3D_POS = {
  u: [-2.8, 2.1, 0], c: [0, 2.1, 0], t: [2.8, 2.1, 0],
  d: [-2.8, 0.7, 0], s: [0, 0.7, 0], b: [2.8, 0.7, 0],
  e: [-2.8, -0.7, 0], mu: [0, -0.7, 0], tau: [2.8, -0.7, 0],
  nue: [-2.8, -2.1, 0], numu: [0, -2.1, 0], nutau: [2.8, -2.1, 0],
  g: [-4.6, 0.9, -3.2], ph: [-1.6, 1.7, -3.6], w: [1.6, 1.7, -3.6], z: [4.6, 0.9, -3.2],
  h: [0, 3.7, -1.4],
};
function sm3dRelated(p) {
  const s = new Set();
  if (p.cls === "gauge" || p.cls === "higgs") {
    for (const q of QGA_PARTICLES) if (q.id !== p.id && QGA_couplings(q).includes(p.id)) s.add(q.id);
    if (p.id === "g") s.add("g");
    if (p.id === "h") { s.add("w"); s.add("z"); s.add("h"); }
  } else {
    for (const b of QGA_couplings(p)) s.add(b);
  }
  return [...s];
}

function ParticleArchitecture3D() {
  const [sel, setSel] = useState("h");
  const [higgsOn, setHiggsOn] = useState(false);
  const [layersOn, setLayersOn] = useState(false);
  const selRef = useRef(sel); selRef.current = sel;
  const higgsRef = useRef(higgsOn); higgsRef.current = higgsOn;
  const layersRef = useRef(layersOn); layersRef.current = layersOn;

  const build = (ctx) => {
    const { THREE, scene } = ctx;
    scene.fog = new THREE.FogExp2(0x04060b, 0.016);
    scene.add(new THREE.AmbientLight(0x8899bb, 0.6));
    const key = new THREE.DirectionalLight(0xbcd0ff, 0.9);
    key.position.set(4, 8, 6);
    scene.add(key);
    // quantum-field substrate: an undulating grid the particles live above (the "vacuum")
    const FN = 26, FSPAN = 26, fstep = FSPAN / FN;
    const fidx = (i, j) => i * FN + j;
    const fPos = new Float32Array(FN * FN * 3);
    for (let i = 0; i < FN; i++) for (let j = 0; j < FN; j++) {
      fPos[fidx(i, j) * 3] = -FSPAN / 2 + i * fstep;
      fPos[fidx(i, j) * 3 + 1] = 0;
      fPos[fidx(i, j) * 3 + 2] = -FSPAN / 2 + j * fstep;
    }
    const fSeg = [];
    for (let i = 0; i < FN; i++) for (let j = 0; j < FN; j++) {
      if (i < FN - 1) fSeg.push(fidx(i, j), fidx(i + 1, j));
      if (j < FN - 1) fSeg.push(fidx(i, j), fidx(i, j + 1));
    }
    const fGeo = new THREE.BufferGeometry();
    const fAttr = new THREE.BufferAttribute(fPos, 3);
    fGeo.setAttribute("position", fAttr);
    fGeo.setIndex(fSeg);
    const fMat = new THREE.LineBasicMaterial({ color: 0x2a3a58, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false });
    const fieldFloor = new THREE.LineSegments(fGeo, fMat);
    fieldFloor.position.y = -3.4;
    scene.add(fieldFloor);

    const nodes = [];
    const halos = [];
    const geoFor = (cls) => cls === "quark" ? new THREE.IcosahedronGeometry(1, 1)
      : cls === "gauge" ? new THREE.OctahedronGeometry(1, 1)
      : new THREE.SphereGeometry(1, 24, 18);
    for (const p of QGA_PARTICLES) {
      const hex = SM3D_HEX[p.cls];
      const scl = (p.cls === "higgs" ? 0.56 : p.cls === "gauge" ? 0.46 : p.cls === "quark" ? 0.4 : p.charge === "0" ? 0.26 : 0.34)
        * (p.gen ? 1 + 0.07 * (p.gen - 1) : 1);
      const mat = new THREE.MeshStandardMaterial({
        color: hex, emissive: hex, emissiveIntensity: 0.22,
        metalness: 0.35, roughness: 0.4, flatShading: p.cls !== "lepton" && p.cls !== "higgs",
      });
      const m = new THREE.Mesh(geoFor(p.cls), mat);
      m.scale.setScalar(scl);
      m.position.set(...SM3D_POS[p.id]);
      m.userData = { id: p.id, baseScale: scl, hex, base: m.position.clone(),
        jit: Math.random() * Math.PI * 2,
        spin: p.cls === "gauge" ? 1.0 : p.cls === "higgs" ? 0 : 0.5 };
      scene.add(m);
      nodes.push(m);
      const gl = s3dGlow(hex, scl * 4.2, 0.34);
      gl.position.copy(m.position);
      scene.add(gl);
      m.userData.glow = gl;
      ctx.label(p.sym, () => ({ x: m.position.x, y: m.position.y - scl - 0.45, z: m.position.z }), "s3d-quiet");
      // Higgs-coupling halo (gold ring), shown by the overlay toggle
      if (p.higgs === true) {
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(scl * 1.7, 0.025, 8, 40),
          new THREE.MeshBasicMaterial({ color: 0xe8c170, transparent: true, opacity: 0.75 })
        );
        halo.position.copy(m.position);
        halo.visible = false;
        halo.userData = { node: m, phase: Math.random() };
        scene.add(halo);
        halos.push(halo);
      }
    }

    // selection marker
    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.03, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
    );
    scene.add(marker);

    // gauge-group symmetry layers (schematic): three stacked rings
    const layers = new THREE.Group();
    const layerDefs = [
      ["SU(3)ᴄ · color", 5.8, -1.0, 0xb98af0],
      ["SU(2)ʟ · weak isospin", 5.1, -1.9, 0x6ba6ff],
      ["U(1)ʏ · hypercharge", 4.4, -2.8, 0x6fd0e0],
    ];
    for (const [name, R, z, hex] of layerDefs) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(R, 0.022, 8, 80),
        new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.5 })
      );
      ring.position.set(0, 0.6, z);
      layers.add(ring);
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(R, 48),
        new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.04, side: THREE.DoubleSide, depthWrite: false })
      );
      disc.position.copy(ring.position);
      layers.add(disc);
      const lp = new THREE.Vector3(0, 0.6 + R, z);
      const lh = ctx.label(name, () => lp, "s3d-quiet");
      ring.userData.labelHandle = lh;
    }
    layers.visible = false;
    scene.add(layers);

    ctx.annotation("gravity is NOT part of the Standard Model — no graviton node exists here",
      () => ({ x: 0, y: -3.4, z: 2.2 }));

    // coupling lines, rebuilt when selection changes
    const linesGroup = new THREE.Group();
    scene.add(linesGroup);
    const activeCurves = []; // {curve, hex} for the currently-shown couplings
    let lastSel = null;
    const rebuildLines = (id) => {
      while (linesGroup.children.length) {
        const c = linesGroup.children.pop();
        c.geometry.dispose(); c.material.dispose();
      }
      activeCurves.length = 0;
      const p = QGA_PARTICLES.find((q) => q.id === id);
      if (!p) return;
      const selIsBoson = (p.cls === "gauge" || p.cls === "higgs");
      const a = new THREE.Vector3(...SM3D_POS[id]);
      for (const rid of sm3dRelated(p)) {
        if (rid === id) continue; // self-couplings noted in the readout
        const other = QGA_PARTICLES.find((q) => q.id === rid);
        const b = new THREE.Vector3(...SM3D_POS[rid]);
        const mid = a.clone().add(b).multiplyScalar(0.5);
        mid.z += 1.3; mid.y += 0.4;
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        // colour each arc by the mediating boson (so the carrier is identifiable)
        const medCls = selIsBoson ? p.cls : (other ? other.cls : p.cls);
        const hex = SM3D_HEX[medCls] || SM3D_HEX[p.cls];
        const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
        const mat = new THREE.LineBasicMaterial({
          color: hex, transparent: true, opacity: 0.45,
          blending: THREE.AdditiveBlending, depthWrite: false,
        });
        linesGroup.add(new THREE.Line(geo, mat));
        activeCurves.push({ curve, hex });
      }
    };

    // pool of travelling force-carrier packets (visualizes interaction = boson exchange)
    const packets = [];
    for (let i = 0; i < 18; i++) {
      const s = s3dGlow(0xffffff, 0.85, 0.0);
      s.userData = { t: Math.random(), speed: 0.32 + Math.random() * 0.36 };
      scene.add(s); packets.push(s);
    }

    return {
      pickables: nodes,
      onPick: (o) => { if (o && o.userData && o.userData.id) setSel(o.userData.id); },
      update: (t, dt) => {
        const mo = ctx.motion();
        if (lastSel !== selRef.current) { lastSel = selRef.current; rebuildLines(lastSel); }

        // quantum-field substrate ripple (stronger / gold-tinted when the Higgs field is shown)
        const fa = fAttr.array;
        const famp = (higgsRef.current ? 0.34 : 0.2) * mo;
        for (let i = 0; i < FN; i++) for (let j = 0; j < FN; j++) {
          const x = -FSPAN / 2 + i * fstep, z = -FSPAN / 2 + j * fstep;
          fa[fidx(i, j) * 3 + 1] = (Math.sin(x * 0.5 + t * 0.9) * Math.cos(z * 0.4 - t * 0.7)) * famp;
        }
        fAttr.needsUpdate = true;
        fMat.color.setHex(higgsRef.current ? 0x6a5a30 : 0x2a3a58);
        fMat.opacity = 0.24 + (higgsRef.current ? 0.14 : 0);

        // nodes: zero-point jitter + spin-correct motion
        for (const n of nodes) {
          const u = n.userData;
          const sf = 0.05 * mo;
          n.position.set(
            u.base.x + Math.sin(t * 2.1 + u.jit) * sf,
            u.base.y + Math.cos(t * 1.7 + u.jit * 1.3) * sf,
            u.base.z + Math.sin(t * 1.4 + u.jit * 0.7) * sf
          );
          u.glow.position.copy(n.position);
          if (u.spin > 0) {
            n.rotation.y += dt * 0.5 * u.spin * mo;
            n.rotation.x += dt * 0.18 * u.spin * mo;
          } else {
            n.scale.setScalar(u.baseScale * (1 + 0.07 * Math.sin(t * 2.4) * mo)); // scalar Higgs breathes
          }
          const isSel = u.id === selRef.current;
          u.glow.material.opacity = isSel ? 0.6 : 0.3 + (mo > 0 ? 0.06 * Math.sin(t * 1.3 + n.position.x) : 0);
        }

        // force-carrier exchange packets travelling along the active couplings
        const nc = activeCurves.length;
        for (let i = 0; i < packets.length; i++) {
          const pk = packets[i];
          if (nc === 0 || mo <= 0) { pk.material.opacity = 0; continue; }
          const c = activeCurves[i % nc];
          pk.userData.t = (pk.userData.t + dt * pk.userData.speed * mo) % 1;
          c.curve.getPoint(pk.userData.t, pk.position);
          pk.material.color.setHex(c.hex);
          pk.material.opacity = 0.95 * Math.sin(pk.userData.t * Math.PI); // born at one end, absorbed at the other
        }
        const pulse = 0.4 + 0.18 * Math.sin(t * 1.8) * mo;
        for (const L of linesGroup.children) L.material.opacity = pulse;

        const selNode = nodes.find((n) => n.userData.id === selRef.current);
        if (selNode) {
          marker.position.copy(selNode.position);
          marker.scale.setScalar(selNode.userData.baseScale * 1.9);
          marker.lookAt(ctx.camera.position);
        }
        layers.visible = layersRef.current;
        for (const ring of layers.children) {
          if (ring.userData && ring.userData.labelHandle) ring.userData.labelHandle.setShow(layersRef.current);
        }
        // Higgs-field interaction: continuous ripples emanate from every massive particle
        for (const halo of halos) {
          halo.visible = higgsRef.current;
          if (!higgsRef.current) continue;
          const u = halo.userData;
          halo.position.copy(u.node.position);
          const ph = (t * 0.5 + u.phase) % 1;
          halo.scale.setScalar(1 + ph * 1.7);
          halo.material.opacity = 0.8 * (1 - ph);
          halo.lookAt(ctx.camera.position);
        }
      },
    };
  };

  const p = QGA_PARTICLES.find((q) => q.id === sel);
  const extra = QGA_PARTICLE_EXTRA[sel];
  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <Toggle label="Higgs coupling overlay" checked={higgsOn} onChange={setHiggsOn}></Toggle>
        <Toggle label="gauge symmetry layers" checked={layersOn} onChange={setLayersOn}></Toggle>
      </div>
      <Scene3D height={440} aria="Three-dimensional map of the seventeen Standard Model particles"
        initial={{ radius: 13.5, theta: 0.0, phi: 1.12, target: [0, 0.3, -0.8], minR: 6, maxR: 30 }}
        build={build}></Scene3D>
      {p ? (
        <div className="s3d-detail" aria-live="polite">
          <b>{p.name} <span className="dim mono" style={{ fontWeight: 400 }}>{p.sym}</span></b>
          <span className="mono dim">Q = {p.charge} e · spin {p.spin} · {p.mass}{p.gen ? " · gen " + p.gen : ""}</span>
          <span className="small" style={{ flexBasis: "100%" }}>
            <span className="dim">Interactions: </span>
            {[p.color && "strong", (p.em && p.charge !== "0") && "electromagnetic", p.weak && "weak", p.higgs === true && "Yukawa/Higgs"].filter(Boolean).join(", ") || "—"}
            {extra ? <span> · <span className="dim">Discovered:</span> {extra.year} — {extra.via}</span> : null}
          </span>
          {extra ? <span className="small dim" style={{ flexBasis: "100%" }}>{extra.role} {p.notes}</span> : null}
        </div>
      ) : null}
      <VizCaption status="schematic">
        Click a node to select it. Glowing packets stream along each arc — these are the force carriers being
        exchanged (coloured by the mediating boson: violet gluons, blue W/Z, etc.); gluon and Higgs self-couplings
        are listed, not drawn. Every particle shows zero-point jitter and spin-correct motion; the floor is the
        quantum-field vacuum they live in. Toggle the Higgs overlay to watch mass-giving ripples emanate from each
        massive particle. Node shapes encode class — faceted: quarks, smooth: leptons, octahedral: gauge bosons.
        Spatial arrangement is pedagogical, not physical. Gravity does not appear: the Standard Model has no graviton.
      </VizCaption>
    </div>
  );
}

function ParticleAtlas() {
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState("h");
  const [higgsOn, setHiggsOn] = useState(false);
  const prm = usePRM();

  // layout: 6 columns — q gen1..3, lepton gen1..3; then bottom rows gauge + higgs
  const fermions = QGA_PARTICLES.filter((p) => p.cls === "quark" || p.cls === "lepton");
  const upQ = ["u", "c", "t"], downQ = ["d", "s", "b"], chL = ["e", "mu", "tau"], nuL = ["nue", "numu", "nutau"];
  const rows = [upQ, downQ, chL, nuL].map((ids) => ids.map((id) => QGA_PARTICLES.find((p) => p.id === id)));
  const bosons = ["g", "ph", "w", "z", "h"].map((id) => QGA_PARTICLES.find((p) => p.id === id));

  const focus = hover || selected;
  const focusP = QGA_PARTICLES.find((p) => p.id === focus);
  // related set: for a gauge boson, all particles it couples to; for matter, its mediators
  const related = useMemo(() => {
    if (!focusP) return new Set();
    const s = new Set([focusP.id]);
    if (focusP.cls === "gauge" || focusP.cls === "higgs") {
      for (const p of QGA_PARTICLES) {
        if (p.id !== focusP.id && QGA_couplings(p).includes(focusP.id)) s.add(p.id);
      }
      // boson self-couplings
      if (focusP.id === "g") s.add("g");
      if (focusP.id === "h") { s.add("w"); s.add("z"); s.add("h"); }
    } else {
      for (const b of QGA_couplings(focusP)) s.add(b);
    }
    return s;
  }, [focus]);

  const sel = QGA_PARTICLES.find((p) => p.id === selected);

  const cell = (p) => {
    if (!p) return null;
    const color = QGA_CLASS_COLORS[p.cls];
    const lit = related.has(p.id) && p.id !== focus;
    const dim = focus && !related.has(p.id);
    const higgsLit = higgsOn && p.higgs === true;
    return (
      <button key={p.id}
        className={"pt-cell" + (lit ? " lit" : "") + (dim && !higgsLit ? " dimmed" : "") + (selected === p.id ? " selected" : "")}
        style={{ "--cell-color": color, outline: higgsLit ? "1px solid oklch(0.8 0.1 85 / 0.55)" : "none" }}
        onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)}
        onFocus={() => setHover(p.id)} onBlur={() => setHover(null)}
        onClick={() => setSelected(p.id)}>
        <span className="pt-class-dot"></span>
        <div className="pt-sym">{p.sym}</div>
        <div className="pt-name">{p.name}</div>
        <div className="pt-mass">{p.mass}</div>
      </button>
    );
  };

  return (
    <div>
      <div className="pt-wrap">
        <div>
          <div className="pt-grid">
            {rows.map((r, i) => (
              <React.Fragment key={i}>
                {r.map(cell)}
                <div style={{ gridColumn: "span 3", display: "flex", alignItems: "center", paddingLeft: 6 }}>
                  <span className="ctl-label">{["up-type quarks", "down-type quarks", "charged leptons", "neutrinos"][i]}</span>
                </div>
              </React.Fragment>
            ))}
            {bosons.map(cell)}
            <div style={{ display: "flex", alignItems: "center", paddingLeft: 6 }}>
              <span className="ctl-label">bosons</span>
            </div>
          </div>
          <div className="pt-legend">
            {Object.entries({ quark: "quarks", lepton: "leptons", gauge: "gauge bosons", higgs: "Higgs sector" }).map(([k, v]) => (
              <span key={k} className="pt-legend-item">
                <span className="pt-legend-dot" style={{ background: QGA_CLASS_COLORS[k] }}></span>{v}
              </span>
            ))}
            <Toggle label="Higgs field coupling overlay" checked={higgsOn} onChange={setHiggsOn}></Toggle>
          </div>
          {higgsOn ? (
            <p className="small dim" style={{ marginTop: 10 }}>
              Gold outline marks particles that acquire mass through interaction with the Higgs field
              (W, Z, charged fermions, and the Higgs boson itself). Photon and gluon remain massless;
              neutrino masses require physics beyond the minimal Standard Model.
            </p>
          ) : null}
        </div>
        <aside className="pt-detail" aria-live="polite">
          {sel ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <h3 style={{ marginBottom: 2 }}>{sel.name} <span className="dim mono" style={{ fontSize: 13 }}>{sel.sym}</span></h3>
                <span className="badge badge-established">{sel.cls}</span>
              </div>
              <dl>
                <dt>Electric charge</dt><dd className="mono">{sel.charge} e</dd>
                <dt>Spin</dt><dd className="mono">{sel.spin} ħ</dd>
                <dt>Mass (approx., PDG)</dt><dd className="mono">{sel.mass}{sel.mass.includes("*") ? " — oscillation bound" : ""}</dd>
                <dt>Interactions</dt>
                <dd>{[sel.color && "strong", (sel.em && sel.charge !== "0") && "electromagnetic", sel.weak && "weak", sel.higgs === true && "Yukawa / Higgs"].filter(Boolean).join(", ") || "—"}</dd>
                {sel.mediates ? (<React.Fragment><dt>Mediates</dt><dd>{sel.mediates}</dd></React.Fragment>) : null}
                <dt>Notes</dt><dd>{sel.notes}</dd>
              </dl>
            </div>
          ) : <p className="dim">Select a particle.</p>}
        </aside>
      </div>
      <p className="small dim" style={{ marginTop: 12 }}>
        Hover a particle to illuminate its interaction channels: matter particles highlight the bosons that
        couple to them; bosons highlight every particle they mediate interactions between. Click for quantum numbers.
      </p>
    </div>
  );
}

function GaugeSectors() {
  const [open, setOpen] = useState("su2");
  const sec = QGA_SECTORS.find((s) => s.id === open);
  return (
    <div>
      <div className="gauge-sectors">
        {QGA_SECTORS.map((s) => (
          <button key={s.id} className={"gauge-sector" + (open === s.id ? " on" : "")}
            style={{ "--sector-color": s.color }} onClick={() => setOpen(s.id)}>
            <div className="gs-group"><Eq tex={s.id === "su3" ? "SU(3)_C" : s.id === "su2" ? "SU(2)_L" : "U(1)_Y"}></Eq></div>
            <div className="gs-name">{s.name}</div>
          </button>
        ))}
      </div>
      {sec ? (
        <div className="panel" style={{ marginTop: 12 }}>
          <p style={{ marginBottom: 0, fontSize: 14 }}>{sec.body}</p>
        </div>
      ) : null}
      <p className="small dim" style={{ marginTop: 12 }}>
        After electroweak symmetry breaking, <Eq tex="SU(2)_L \times U(1)_Y \to U(1)_{\mathrm{EM}}"></Eq>: the photon is the
        surviving massless combination, while three would-be Goldstone modes become the longitudinal polarizations of W± and Z⁰.
      </p>
    </div>
  );
}

function HiggsPotentialViz() {
  const [mu2, setMu2] = useState(-1); // sign-flipped mass parameter: negative → broken phase
  const prm = usePRM();
  const sim = useSimLoop((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.86, scaleX = w * 0.36, lam = 1;
    // potential V(φ) = μ² φ² + λ φ⁴  (radial slice; μ² slider in units where |μ²|=1 at extremes)
    const V = (p) => mu2 * p * p + lam * p * p * p * p;
    // vertical scale
    let vmin = 0, vmax = 0.4;
    for (let p = -1.2; p <= 1.2; p += 0.02) { vmin = Math.min(vmin, V(p)); vmax = Math.max(vmax, V(p)); }
    const Y = (v) => cy - ((v - vmin) / (vmax - vmin + 1e-9)) * h * 0.7;
    // axes
    ctx.strokeStyle = "rgba(148,176,224,0.18)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, 14); ctx.lineTo(cx, cy + 6); ctx.moveTo(cx - scaleX * 1.25, Y(0)); ctx.lineTo(cx + scaleX * 1.25, Y(0)); ctx.stroke();
    ctx.fillStyle = "rgba(148,176,224,0.5)"; ctx.font = "10px IBM Plex Mono";
    ctx.fillText("V(φ)", cx + 8, 22); ctx.fillText("|φ|→", cx + scaleX * 1.1, Y(0) - 8);
    // curve
    ctx.strokeStyle = "oklch(0.8 0.1 85)"; ctx.lineWidth = 2; ctx.beginPath();
    for (let p = -1.2; p <= 1.2; p += 0.01) {
      const x = cx + p * scaleX, y = Y(V(p));
      if (p === -1.2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // vacuum marker(s): minimum at φ=0 (μ²≥0) or |φ|=√(−μ²/2λ)
    const vev = mu2 < 0 ? Math.sqrt(-mu2 / (2 * lam)) : 0;
    const wob = prm ? 0 : Math.sin(t * 2.2) * 0.03;
    const px = cx + (vev + wob) * scaleX, py = Y(V(vev + wob));
    ctx.fillStyle = "oklch(0.78 0.1 200)";
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "oklch(0.78 0.1 200 / 0.4)";
    ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.stroke();
    if (vev > 0) {
      ctx.fillStyle = "rgba(148,176,224,0.6)";
      ctx.fillText("⟨φ⟩ = v ≠ 0 — symmetry broken", cx + scaleX * 0.18, Y(V(vev)) + 22);
      // mirror minimum
      ctx.fillStyle = "oklch(0.78 0.1 200 / 0.35)";
      ctx.beginPath(); ctx.arc(cx - vev * scaleX, Y(V(vev)), 5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = "rgba(148,176,224,0.6)";
      ctx.fillText("⟨φ⟩ = 0 — symmetric vacuum", cx + 14, Y(0) - 26);
    }
  }, [mu2, prm]);
  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <SliderRow label="μ² parameter" min={-1} max={1} step={0.01} value={mu2} onChange={setMu2}
          format={(v) => (v < 0 ? "μ² < 0" : v > 0 ? "μ² > 0" : "μ² = 0")}></SliderRow>
        <span className="ctl-label">{mu2 < 0 ? "broken phase — Higgs mechanism active" : "unbroken phase"}</span>
      </div>
      <canvas ref={sim.canvasRef} className="viz-canvas" style={{ height: 260 }}></canvas>
      <VizCaption status="schematic">
        Radial slice of the Higgs potential V(φ) = μ²|φ|² + λ|φ|⁴. Drag μ² negative to watch the symmetric vacuum
        destabilize into the “Mexican hat” minimum at |φ| = v. The marker tracks the vacuum state.
      </VizCaption>
    </div>
  );
}

/* ---------- neutrino oscillations (real two-flavour vacuum formula) ---------- */
function NeutrinoOscillationLab() {
  const [dm2, setDm2] = useState(2.5e-3);   // Δm² (eV²), atmospheric default
  const [s22t, setS22t] = useState(0.98);   // sin²2θ
  const cvRef = useRef(null);
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = 230;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const padL = 44, padR = 14, padT = 18, padB = 34;
    const pw = w - padL - padR, ph = h - padT - padB;
    const LEmax = 1200; // L/E in km/GeV
    const X = (le) => padL + (le / LEmax) * pw;
    const Y = (p) => padT + ph * (1 - p);
    // axes + gridlines
    ctx.strokeStyle = "rgba(148,176,224,0.22)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + ph); ctx.lineTo(padL + pw, padT + ph); ctx.stroke();
    ctx.font = "10px IBM Plex Mono"; ctx.fillStyle = "rgba(148,176,224,0.55)";
    ctx.textAlign = "right";
    [0, 0.5, 1].forEach((p) => { ctx.fillText(p.toFixed(1), padL - 6, Y(p) + 3);
      ctx.strokeStyle = "rgba(148,176,224,0.08)"; ctx.beginPath(); ctx.moveTo(padL, Y(p)); ctx.lineTo(padL + pw, Y(p)); ctx.stroke(); });
    ctx.textAlign = "center";
    for (let le = 0; le <= LEmax; le += 300) ctx.fillText(le, X(le), padT + ph + 16);
    ctx.fillText("L / E   [km / GeV]", padL + pw / 2, h - 4);
    ctx.save(); ctx.translate(13, padT + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("probability", 0, 0); ctx.restore();
    ctx.textAlign = "left";
    // survival P(νμ→νμ) = 1 − sin²2θ sin²(1.27 Δm²[eV²] (L/E)[km/GeV])
    const arg = (le) => 1.27 * dm2 * le;
    const survP = (le) => 1 - s22t * Math.pow(Math.sin(arg(le)), 2);
    const appP = (le) => s22t * Math.pow(Math.sin(arg(le)), 2);
    const drawCurve = (fn, col, lbl, lx) => {
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.shadowColor = col; ctx.shadowBlur = 6; ctx.beginPath();
      for (let i = 0; i <= 300; i++) { const le = (i / 300) * LEmax; const x = X(le), y = Y(Math.max(0, Math.min(1, fn(le)))); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = col; ctx.fillText(lbl, lx, padT + 12);
    };
    drawCurve(survP, "oklch(0.8 0.12 235)", "P(νμ→νμ) survival", padL + 6);
    drawCurve(appP, "oklch(0.78 0.14 320)", "P(νμ→ντ) appearance", padL + pw - 150);
    // T2K baseline marker (L=295 km, E≈0.6 GeV → L/E≈490)
    ctx.strokeStyle = "rgba(224,179,90,0.5)"; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(X(490), padT); ctx.lineTo(X(490), padT + ph); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "rgba(224,179,90,0.85)"; ctx.fillText("T2K", X(490) + 4, padT + ph - 6);
  }, [dm2, s22t]);
  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <SliderRow label="Δm²" min={0.5e-3} max={4e-3} step={0.05e-3} value={dm2} onChange={setDm2}
          format={(v) => (v * 1e3).toFixed(2) + "×10⁻³ eV²"}></SliderRow>
        <SliderRow label="sin²2θ" min={0} max={1} step={0.01} value={s22t} onChange={setS22t}
          format={(v) => v.toFixed(2)}></SliderRow>
        <button className="btn" onClick={() => { setDm2(2.5e-3); setS22t(0.98); }}>Atmospheric (real)</button>
      </div>
      <canvas ref={cvRef} style={{ width: "100%", height: 230, display: "block" }}
        aria-label="Neutrino oscillation survival and appearance probability versus L over E"></canvas>
      <VizCaption status="established">
        Real two-flavour vacuum oscillation: <Eq tex="P(\nu_\mu\!\to\!\nu_\tau) = \sin^2 2\theta\,\sin^2\!\big(1.27\,\Delta m^2\,[\mathrm{eV}^2]\,L[\mathrm{km}]/E[\mathrm{GeV}]\big)"></Eq>.
        Because the probability depends on <Eq tex="\Delta m^2"></Eq>, oscillation <em>proves neutrinos have mass</em> —
        the one laboratory-confirmed departure from the minimal Standard Model, and a direct hint that the lepton
        sector mixes just as quarks do. Defaults are the measured atmospheric values
        (<Eq tex="\Delta m^2_{32}\approx2.5\times10^{-3}\,\mathrm{eV}^2,\ \sin^2 2\theta_{23}\approx0.98"></Eq>); the
        dashed line marks the T2K baseline. <span className="dim">Two-flavour approximation; the full picture is the three-flavour PMNS matrix at right.</span>
      </VizCaption>
    </div>
  );
}

/* ---------- PMNS & CKM mixing-matrix magnitudes (PDG / NuFIT) ---------- */
const CKM_MAG = [[0.97435, 0.22500, 0.00369], [0.22486, 0.97349, 0.04182], [0.00857, 0.04110, 0.999118]];
const PMNS_MAG = [[0.821, 0.550, 0.150], [0.376, 0.610, 0.697], [0.428, 0.580, 0.701]];
function MixingGrid({ title, rows, cols, mat, sub }) {
  return (
    <div className="panel" style={{ flex: 1 }}>
      <h3 style={{ marginBottom: 4 }}>{title}</h3>
      <p className="small dim" style={{ margin: "0 0 10px" }}>{sub}</p>
      <div style={{ display: "grid", gridTemplateColumns: "auto repeat(3, 1fr)", gap: 4, fontFamily: "IBM Plex Mono, monospace", fontSize: 11 }}>
        <div></div>
        {cols.map((c) => <div key={c} style={{ textAlign: "center", color: "var(--dim)", paddingBottom: 2 }}>{c}</div>)}
        {rows.map((r, i) => [
          <div key={"r" + i} style={{ color: "var(--dim)", alignSelf: "center" }}>{r}</div>,
          ...mat[i].map((v, j) => {
            const a = 0.1 + 0.85 * v; // magnitude → opacity
            return <div key={i + "-" + j} style={{
              textAlign: "center", padding: "8px 2px", borderRadius: 5,
              background: "oklch(0.6 0.13 250 / " + a.toFixed(2) + ")",
              color: v > 0.4 ? "#06121f" : "#cdd9ee", fontWeight: v > 0.4 ? 600 : 400,
            }}>{v < 0.01 ? v.toExponential(1) : v.toFixed(3)}</div>;
          }),
        ])}
      </div>
    </div>
  );
}
function MixingMatrices() {
  return (
    <div className="grid-2" style={{ alignItems: "stretch" }}>
      <MixingGrid title="CKM matrix |V| — quarks" sub="Nearly diagonal: quark flavour mixing is small (Cabibbo angle λ ≈ 0.225)."
        rows={["d", "s", "b"]} cols={["u", "c", "t"]} mat={CKM_MAG}></MixingGrid>
      <MixingGrid title="PMNS matrix |U| — neutrinos" sub="Strongly off-diagonal: lepton mixing is large — why is one of the open puzzles."
        rows={["e", "μ", "τ"]} cols={["ν₁", "ν₂", "ν₃"]} mat={PMNS_MAG}></MixingGrid>
    </div>
  );
}

function ModuleSM({ go }) {
  return (
    <article>
      <ModuleHeader num="01" kicker="Matter & forces" title="The Standard Model of Particle Physics"
        lede="The Standard Model is a quantum field theory describing all known matter particles and three of the four fundamental interactions. Its structure is dictated almost entirely by one principle: local gauge symmetry under the group SU(3)×SU(2)×U(1)."></ModuleHeader>

      <Section title="The particle architecture">
        <p>
          Seventeen fields suffice to describe every confirmed particle physics experiment to date. Twelve fermions
          (spin-½) constitute matter, arranged in three generations of increasing mass. Four gauge bosons (spin-1)
          mediate the strong, electromagnetic, and weak interactions. One scalar — the Higgs boson — is the visible
          excitation of the field whose vacuum value breaks electroweak symmetry and endows particles with mass.
          Orbit the architecture below: matter in the front lattice, force carriers behind, the Higgs above.
        </p>
        <ParticleArchitecture3D></ParticleArchitecture3D>
      </Section>

      <Section title="Analytical particle atlas">
        <p>
          The same seventeen fields as a reference table, with full quantum numbers and interaction channels.
          Hover to illuminate couplings; click for details.
        </p>
        <ParticleAtlas></ParticleAtlas>
      </Section>

      <Section title="Gauge structure">
        <p>
          Each factor of the gauge group corresponds to one interaction sector. Demanding that the theory be invariant
          under <em>local</em> transformations of these groups forces the existence of the gauge fields and fixes their
          couplings — the interactions are not added by hand, they are required by symmetry.
        </p>
        <GaugeSectors></GaugeSectors>
      </Section>

      <Section title="Symmetry breaking and mass">
        <p>
          A mass term for gauge bosons would violate gauge invariance, yet W and Z are measurably heavy. The
          resolution is spontaneous symmetry breaking: the Higgs field's potential makes the symmetric configuration
          unstable, and the field settles into a vacuum with <Eq tex="\langle\phi\rangle = v \approx 246\ \mathrm{GeV}"></Eq>.
          Particles interacting with this background acquire effective masses while the underlying equations remain symmetric.
        </p>
        <HiggsPotentialViz></HiggsPotentialViz>
      </Section>

      <Section title="Flavor mixing and neutrino oscillations">
        <p>
          Mass eigenstates and interaction eigenstates are not the same basis — the mismatch is encoded in two unitary
          mixing matrices: <strong>CKM</strong> for quarks and <strong>PMNS</strong> for leptons. The quark matrix is
          nearly diagonal (small mixing); the lepton matrix is strongly off-diagonal, and its reality is established by
          neutrino oscillations — flavor that changes with distance, which is only possible if neutrinos have mass.
          This is the single confirmed crack in the minimal Standard Model.
        </p>
        <NeutrinoOscillationLab></NeutrinoOscillationLab>
        <div style={{ marginTop: 14 }}>
          <MixingMatrices></MixingMatrices>
        </div>
      </Section>

      <Section title="Mathematical formulation">
        <div className="formula-grid">
          <FormulaCard title="Standard Model gauge group" status="established"
            tex="G_{\mathrm{SM}} = SU(3)_C \times SU(2)_L \times U(1)_Y"
            symbols={[
              { s: "SU(3)_C", d: "Color symmetry of the strong interaction; acts on quark color triplets via eight gluons." },
              { s: "SU(2)_L", d: "Weak isospin; acts only on left-handed fermion doublets (parity violation)." },
              { s: "U(1)_Y", d: "Hypercharge phase symmetry; combines with SU(2)_L to yield electromagnetism after symmetry breaking." },
            ]}
            meaning="The full symmetry group of the Standard Model Lagrangian. Every interaction (other than gravity) follows from gauging these three factors."
            limits="Gravity is absent. Neutrino masses require additional structure. Why this group, with these representations and three generations, is unexplained."></FormulaCard>
          <FormulaCard title="Higgs potential" status="established"
            tex="V(\phi) = \mu^2\,\phi^\dagger\phi + \lambda\,(\phi^\dagger\phi)^2"
            symbols={[
              { s: "\\phi", d: "Complex SU(2) doublet scalar field (four real components)." },
              { s: "\\mu^2", d: "Mass-squared parameter; μ² < 0 destabilizes the symmetric vacuum." },
              { s: "\\lambda", d: "Quartic self-coupling; λ > 0 ensures the potential is bounded below." },
            ]}
            meaning="With μ² < 0 the minimum sits at |φ|² = −μ²/2λ ≡ v²/2. Three components become longitudinal modes of W± and Z; the fourth is the 125 GeV Higgs boson."
            limits="Why μ² is small compared to the Planck scale (the hierarchy problem) has no accepted explanation."></FormulaCard>
          <FormulaCard title="Lagrangian structure (schematic)" status="established"
            tex="\mathcal{L} = -\tfrac{1}{4}F_{\mu\nu}^a F^{a\,\mu\nu} + i\bar\psi\,\gamma^\mu D_\mu \psi + |D_\mu\phi|^2 - V(\phi) - \left(\bar\psi_L\, Y\, \phi\, \psi_R + \mathrm{h.c.}\right)"
            symbols={[
              { s: "F_{\\mu\\nu}^a", d: "Field strength tensors of the three gauge sectors (kinetic terms and self-interactions)." },
              { s: "\\bar\\psi\\,\\gamma^\\mu D_\\mu\\psi", d: "Fermion kinetic terms; the covariant derivative D encodes all gauge interactions." },
              { s: "|D_\\mu\\phi|^2", d: "Higgs kinetic term; generates W and Z masses after symmetry breaking." },
              { s: "Y", d: "Yukawa coupling matrices; generate fermion masses and quark mixing (CKM)." },
            ]}
            meaning="A compressed schematic of the full Standard Model Lagrangian — each displayed term stands for a family of terms summed over gauge groups, generations, and chiralities."
            limits="Schematic form: gauge-fixing, ghost terms, and the θ-term are omitted; indices are suppressed."></FormulaCard>
        </div>
      </Section>

      <Misconception title="The Standard Model does not include gravity.">
        All Standard Model successes concern three interactions only. Gravity is described separately by general
        relativity, and no experiment yet probes a regime where both quantum field theory and dynamical spacetime
        matter simultaneously. That gap is the subject of this atlas.
      </Misconception>
      <Misconception title="The Higgs field does not work like friction.">
        Mass generation is not a drag force — a viscous medium would violate momentum conservation and Lorentz
        invariance. Masses arise from interaction energy with a uniform, Lorentz-invariant background field value.
      </Misconception>
      <ConceptBridge id="sm-qft" go={go}></ConceptBridge>
    </article>
  );
}

window.ModuleSM = ModuleSM;
