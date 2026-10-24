// mod-standard-model.jsx — Module 01: The Standard Model
const SM3D_HEX = { quark: QGA_TOKENS.hex("pigment-violet-72-c15"), lepton: QGA_TOKENS.hex("pigment-cyan-80-c09"), gauge: QGA_TOKENS.hex("pigment-blue-72"), higgs: QGA_TOKENS.hex("pigment-amber-83") };
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
    scene.fog = new THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.016);
    scene.add(new THREE.AmbientLight(QGA_TOKENS.hex("pigment-blue-68"), 0.6));
    const key = new THREE.DirectionalLight(QGA_TOKENS.hex("pigment-blue-86"), 0.9);
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
    const engraved = ctx.engraved;
    const fSegFlat = engraved.expand(fPos, fSeg);
    const fieldFloor = engraved.segments(fSegFlat, { color: "pigment-blue-35", opacity: 0.26, additive: true, widthPx: engraved.WIDTH_PX.hairline, layer: "decoration" });
    fieldFloor.frustumCulled = false;
    fieldFloor.position.y = -3.4;
    let floorHiggs = false;
    scene.add(fieldFloor);

    const nodes = [], rnd = QGA_SEEDED(0x5d0e);
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
        jit: rnd() * Math.PI * 2,
        spin: p.cls === "gauge" ? 1.0 : p.cls === "higgs" ? 0 : 0.5 };
      scene.add(ctx.tag(m, "data"));
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
          new THREE.MeshBasicMaterial({ color: QGA_TOKENS.hex("pigment-amber-83"), transparent: true, opacity: 0.75 })
        );
        halo.position.copy(m.position);
        halo.visible = false;
        halo.userData = { node: m, phase: rnd() };
        scene.add(ctx.tag(halo, "data"));
        halos.push(halo);
      }
    }

    // selection marker
    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.03, 8, 48),
      new THREE.MeshBasicMaterial({ color: QGA_TOKENS.hex("pigment-white"), transparent: true, opacity: 0.9 })
    );
    scene.add(ctx.tag(marker, "model"));

    // gauge-group symmetry layers (schematic): three stacked rings
    const layers = new THREE.Group();
    const layerDefs = [
      ["SU(3)ᴄ · color", 5.8, -1.0, QGA_TOKENS.hex("pigment-violet-72-c15")],
      ["SU(2)ʟ · weak isospin", 5.1, -1.9, QGA_TOKENS.hex("pigment-blue-72")],
      ["U(1)ʏ · hypercharge", 4.4, -2.8, QGA_TOKENS.hex("pigment-cyan-80-c09")],
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
    scene.add(ctx.tag(layers, "data"));

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
        linesGroup.add(engraved.line(curve.getPoints(40), {
          color: hex, opacity: 0.45, additive: true, widthPx: engraved.WIDTH_PX.standard, layer: "model",
        }));
        activeCurves.push({ curve, hex });
      }
    };

    // pool of travelling force-carrier packets (visualizes interaction = boson exchange)
    const packets = [];
    for (let i = 0; i < 18; i++) {
      const s = s3dGlow(QGA_TOKENS.hex("pigment-white"), 0.85, 0.0);
      s.userData = { t: rnd(), speed: 0.32 + rnd() * 0.36 };
      scene.add(ctx.tag(s, "decoration")); packets.push(s);
    }

    return {
      pickables: nodes,
      onPick: (o) => { if (o && o.userData && o.userData.id) setSel(o.userData.id); },
      update: (t, dt) => {
        const mo = ctx.motion();
        if (lastSel !== selRef.current) { lastSel = selRef.current; rebuildLines(lastSel); }

        // quantum-field substrate ripple (stronger / gold-tinted when the Higgs field is shown)
        const fa = fPos;
        const famp = (higgsRef.current ? 0.34 : 0.2) * mo;
        for (let i = 0; i < FN; i++) for (let j = 0; j < FN; j++) {
          const x = -FSPAN / 2 + i * fstep, z = -FSPAN / 2 + j * fstep;
          fa[fidx(i, j) * 3 + 1] = (Math.sin(x * 0.5 + t * 0.9) * Math.cos(z * 0.4 - t * 0.7)) * famp;
        }
        engraved.expand(fPos, fSeg, fSegFlat);
        engraved.update(fieldFloor, fSegFlat);
        if (floorHiggs !== higgsRef.current) {
          floorHiggs = higgsRef.current;
          engraved.setColor(fieldFloor, floorHiggs ? "pigment-amber-47" : "pigment-blue-35");
        }
        engraved.setOpacity(fieldFloor, 0.24 + (higgsRef.current ? 0.14 : 0));

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
      <Scene3D animated="motion" height={440} aria="Three-dimensional map of the seventeen Standard Model particles"
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
      <VizCaption provenanceId="sm-interaction-map" status="schematic">
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
        style={{ "--cell-color": color, outline: higgsLit ? `1px solid ${QGA_TOKENS.alpha("pigment-amber-80", 0.55)}` : "none" }}
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
  const spec = useMemo(() => window.QGA_FIGURE.plots.sm.higgsPotentialSpec({ mu2 }), [mu2]);
  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <SliderRow label="μ² parameter" min={-1} max={1} step={0.01} value={mu2} onChange={setMu2}
          format={(v) => (v < 0 ? "μ² < 0" : v > 0 ? "μ² > 0" : "μ² = 0")}></SliderRow>
        <span className="ctl-label">{mu2 < 0 ? "broken phase — Higgs mechanism active" : "unbroken phase"}</span>
      </div>
      <Figure spec={spec}>
        Radial slice of the Higgs potential V(φ) = μ²|φ|² + λ|φ|⁴. Drag μ² negative to watch the symmetric vacuum
        destabilize into the “Mexican hat” minimum at |φ| = v. The marker tracks the vacuum state.
      </Figure>
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
      <div style={{ display: "grid", gridTemplateColumns: "auto repeat(3, 1fr)", gap: 4, fontFamily: "var(--font-mono)", fontSize: 11 }}>
        <div></div>
        {cols.map((c) => <div key={c} style={{ textAlign: "center", color: "var(--dim)", paddingBottom: 2 }}>{c}</div>)}
        {rows.map((r, i) => [
          <div key={"r" + i} style={{ color: "var(--dim)", alignSelf: "center" }}>{r}</div>,
          ...mat[i].map((v, j) => {
            const a = 0.1 + 0.85 * v; // magnitude → opacity
            // Chip lightness is held at 0.48 so the light label clears 4.5:1 at
            // every opacity in the ramp; a lighter chip would need dark text in
            // the mid range, where neither label colour reaches the floor.
            return <div key={i + "-" + j} style={{
              textAlign: "center", padding: "8px 2px", borderRadius: 5,
              background: QGA_TOKENS.alpha("pigment-azure-48", a.toFixed(2)),
              color: QGA_TOKENS.css("pigment-blue-88-c03"), fontWeight: v > 0.4 ? 600 : 400,
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
        <NeutrinoLab></NeutrinoLab>
        <div style={{ marginTop: 14 }}>
          <MixingMatrices></MixingMatrices>
        </div>
      </Section>

      <Section title="Collisions, computed">
        <p>
          The Standard Model is tested by colliding particles and reading the debris. This lab generates a
          synthetic proton–proton event from the shared seed — exact two-body kinematics, on-shell masses, and a
          disclosed jet clusterer — and renders it inside a barrel detector: beams collide at the vertex, charged
          tracks curve by charge over p<sub>T</sub>, calorimeter towers rise with transverse energy, jet cones mark
          hadronic clusters, and the dashed arrow balances missing transverse momentum. Pick a channel, click a
          track, and watch the invariant-mass readout recover the Higgs, Z, or top. Everything is computed by
          <code> js/science/collider-kinematics.mjs</code>; the events are synthetic fixtures, not observations.
        </p>
        <ColliderLabSection></ColliderLabSection>
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
