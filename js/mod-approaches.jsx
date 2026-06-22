// mod-approaches.jsx — Module 06: Major Quantum Gravity Approaches
/* ---------- 3D theory constellation ---------- */
const CONST_NODES = [
  { id: "string", pos: [-4.6, 1.8, -0.6], hex: 0xb98af0 },
  { id: "lqg", pos: [4.6, 1.8, -0.6], hex: 0x6fd0e0 },
  { id: "eft", pos: [0, -0.2, 4.2], hex: 0x8fd6a8 },
  { id: "asymsafe", pos: [-3.6, -1.4, -3.8], hex: 0x6ba6ff },
  { id: "holo", pos: [3.6, -1.4, -3.8], hex: 0xe0b35a },
];
function TheoryConstellation3D() {
  const [sel, setSel] = useState("string");
  const selRef = useRef(sel); selRef.current = sel;

  const build = (ctx) => {
    const { THREE, scene } = ctx;
    scene.fog = new THREE.FogExp2(0x04060b, 0.016);
    scene.add(new THREE.AmbientLight(0x8899bb, 0.6));
    const key = new THREE.DirectionalLight(0xbcd0ff, 0.85);
    key.position.set(4, 8, 6);
    scene.add(key);
    const floor = ctx.grid(20, 20, 0x2a3a58, 0.18);
    floor.position.y = -3.2;
    scene.add(floor);

    // starfield backdrop
    const det0 = ctx.settings.current.detail3d;
    const starN = det0 === "low" ? 220 : 480;
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(starN * 3);
    for (let i = 0; i < starN; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, rr = Math.sqrt(1 - u * u), R = 34 + Math.random() * 40;
      sPos[i * 3] = Math.cos(a) * rr * R; sPos[i * 3 + 1] = u * R * 0.8; sPos[i * 3 + 2] = Math.sin(a) * rr * R;
    }
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    const starField = new THREE.Points(sGeo, new THREE.PointsMaterial({
      size: 1.2, map: qgaGlowTexture(), color: 0xb6c8f0, transparent: true,
      opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    }));
    scene.add(starField);

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 26, 18),
      new THREE.MeshStandardMaterial({ color: 0xedf2fb, emissive: 0xaab8d6, emissiveIntensity: 0.85 }));
    scene.add(core);
    const coreGlow = ctx.glow(0xd6e2f5, 4.2, 0.5);
    scene.add(coreGlow);
    ctx.label("the quantum gravity problem", () => ({ x: 0, y: 1.05, z: 0 }), "s3d-strong");

    const geoFor = (id) =>
      id === "string" ? new THREE.TorusKnotGeometry(0.42, 0.13, 80, 12)
      : id === "lqg" ? new THREE.IcosahedronGeometry(0.58, 0)
      : id === "eft" ? new THREE.SphereGeometry(0.5, 24, 18)
      : id === "asymsafe" ? new THREE.OctahedronGeometry(0.6, 0)
      : new THREE.TorusGeometry(0.46, 0.16, 14, 36);

    const nodes = [];
    const links = [];
    for (const n of CONST_NODES) {
      const th = QGA_THEORIES.find((x) => x.id === n.id);
      const m = new THREE.Mesh(geoFor(n.id), new THREE.MeshStandardMaterial({
        color: n.hex, emissive: n.hex, emissiveIntensity: 0.6, metalness: 0.35, roughness: 0.4,
        flatShading: n.id === "lqg" || n.id === "asymsafe",
      }));
      m.position.set(...n.pos);
      m.userData = { id: n.id, base: new THREE.Vector3(...n.pos), hex: n.hex };
      scene.add(m);
      const g = ctx.glow(n.hex, 3.0, 0.34);
      g.position.copy(m.position);
      scene.add(g);
      m.userData.glow = g;
      const link = ctx.line([new THREE.Vector3(0, 0, 0), m.position.clone()], n.hex, 0.45, true);
      link.material.blending = THREE.AdditiveBlending; link.material.depthWrite = false;
      link.userData = { id: n.id };
      scene.add(link);
      links.push(link);
      ctx.label(th.name, () => ({ x: m.position.x, y: m.position.y - 1.0, z: m.position.z }), "s3d-quiet");
      nodes.push(m);
    }

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 10, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(ring);

    ctx.annotation("no winner is implied — none of these programs is experimentally confirmed",
      () => ({ x: 0, y: -2.7, z: 3.4 }));

    return {
      pickables: nodes,
      onPick: (o) => { if (o && o.userData && o.userData.id) setSel(o.userData.id); },
      update: (t, dt) => {
        const mo = ctx.motion();
        starField.rotation.y += dt * 0.01 * mo;
        for (const m of nodes) {
          const on = m.userData.id === selRef.current;
          m.rotation.y += dt * 0.4 * mo;
          m.position.y = m.userData.base.y + (mo > 0 ? Math.sin(t * 0.8 + m.userData.base.x) * 0.12 * mo : 0);
          m.userData.glow.position.copy(m.position);
          m.userData.glow.material.opacity = on ? 0.7 : 0.3;
          m.material.emissiveIntensity = on ? 1.0 : 0.6;
        }
        for (const link of links) {
          link.material.opacity = link.userData.id === selRef.current ? 0.85 : 0.4;
        }
        const selNode = nodes.find((m) => m.userData.id === selRef.current);
        if (selNode) {
          ring.position.copy(selNode.position);
          ring.scale.setScalar(1.25 + (mo > 0 ? 0.06 * Math.sin(t * 3) : 0));
          ring.lookAt(ctx.camera.position);
        }
        coreGlow.material.opacity = 0.45 + (mo > 0 ? 0.1 * Math.sin(t * 1.1) : 0);
      },
    };
  };

  const t = QGA_THEORIES.find((x) => x.id === sel);
  const meta = QGA_THEORY_META[sel];
  return (
    <div className="viz-frame">
      <Scene3D height={430} aria="Constellation of the major quantum gravity research programs; click a node to inspect it"
        initial={{ radius: 13, theta: 0.2, phi: 1.05, minR: 7, maxR: 28, bloom: { strength: 0.8, radius: 0.6, threshold: 0.16 } }} build={build}
        fallback={<div style={{ padding: "14px" }} className="small dim">The comparator below carries the full content of this scene.</div>}></Scene3D>
      {t ? (
        <div className="s3d-detail" aria-live="polite" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
            <b>{t.name}</b>
            <Badge kind={t.status}></Badge>
            <span className="mono dim small">{meta.since} · {meta.founders}</span>
          </div>
          <span className="small">{t.rows.idea.short} {t.rows.spacetime.short}</span>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span className="mono dim" style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>{meta.eqName}</span>
            <Eq tex={meta.eq}></Eq>
          </div>
          <span className="small dim">Open: {t.rows.problems.short} · Experiment: {t.rows.experiment.short}</span>
        </div>
      ) : null}
      <VizCaption status="conjectural">
        Five research programs orbiting the same unsolved problem. Click a node for its core idea, defining equation,
        experimental status, and open problems — the comparator below makes the full aspect-by-aspect comparison.
        Positions and shapes are mnemonic, not meaningful.
      </VizCaption>
    </div>
  );
}

function MicrostructureViz() {
  const [mode, setMode] = useState("string");
  const modeRef = useRef(mode); modeRef.current = mode;
  const [n, setN] = useState(3); // string harmonic
  const nRef = useRef(n); nRef.current = n;
  const prm = usePRM();
  const netRef = useRef(null);
  if (!netRef.current) {
    // build a small random spin network graph
    const nodes = [];
    for (let i = 0; i < 14; i++) nodes.push({ x: 0.12 + Math.random() * 0.76, y: 0.15 + Math.random() * 0.7 });
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      const dists = nodes.map((q, j) => ({ j, d: Math.hypot(q.x - nodes[i].x, q.y - nodes[i].y) }))
        .filter((e) => e.j !== i).sort((a, b) => a.d - b.d);
      for (let k = 0; k < 2; k++) {
        const j = dists[k].j;
        if (!edges.some((e) => (e.a === i && e.b === j) || (e.a === j && e.b === i)))
          edges.push({ a: i, b: j, spin: [["1/2", 1], ["1", 2], ["3/2", 3], ["2", 4]][Math.floor(Math.random() * 4)] });
      }
    }
    netRef.current = { nodes, edges };
  }

  const sim = useSimLoop((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const tt = prm ? 0.7 : t;
    if (modeRef.current === "string") {
      const cx = w / 2, cy = h / 2, len = Math.min(w * 0.7, 420), amp = h * 0.22;
      const k = nRef.current;
      // standing wave on a string: y = A sin(nπx/L) cos(ωt), ω ∝ n
      ctx.strokeStyle = "rgba(148,176,224,0.25)";
      ctx.setLineDash([3, 5]); ctx.beginPath();
      ctx.moveTo(cx - len / 2, cy); ctx.lineTo(cx + len / 2, cy); ctx.stroke(); ctx.setLineDash([]);
      ctx.save();
      ctx.shadowColor = "oklch(0.72 0.13 300)"; ctx.shadowBlur = 12;
      ctx.strokeStyle = "oklch(0.72 0.13 300)"; ctx.lineWidth = 2.2; ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const f = i / 120;
        const x = cx - len / 2 + f * len;
        const y = cy + amp * Math.sin(k * Math.PI * f) * Math.cos(tt * (1.1 + 0.8 * k));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.restore();
      ctx.fillStyle = "#dde6f5";
      ctx.beginPath(); ctx.arc(cx - len / 2, cy, 3, 0, Math.PI * 2); ctx.arc(cx + len / 2, cy, 3, 0, Math.PI * 2); ctx.fill();
      ctx.font = "10px IBM Plex Mono"; ctx.fillStyle = "rgba(170,195,230,0.7)";
      ctx.fillText("vibration mode n = " + k + "  →  one particle species (mass² ∝ mode number)", 14, 22);
      ctx.fillText("n = 2 closed-string mode: massless spin-2 → the graviton", 14, h - 14);
    } else {
      const { nodes, edges } = netRef.current;
      const px = (q) => [q.x * w, q.y * h];
      ctx.font = "9.5px IBM Plex Mono";
      for (const e of edges) {
        const [x1, y1] = px(nodes[e.a]), [x2, y2] = px(nodes[e.b]);
        const pulse = prm ? 0.5 : 0.4 + 0.25 * Math.sin(tt * 1.4 + e.a + e.b);
        ctx.strokeStyle = "rgba(120,160,230," + pulse.toFixed(3) + ")";
        ctx.lineWidth = e.spin[1] * 0.8;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.fillStyle = "rgba(224,179,90,0.85)";
        ctx.fillText("j=" + e.spin[0], (x1 + x2) / 2 + 4, (y1 + y2) / 2 - 4);
      }
      for (const q of nodes) {
        const [x, y] = px(q);
        ctx.fillStyle = "oklch(0.78 0.1 200)";
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = "rgba(170,195,230,0.7)";
      ctx.fillText("spin network: edges carry SU(2) spins j; a surface crossing an edge gains area ∝ √(j(j+1)) l_P²", 14, 22);
      ctx.fillText("nodes carry quantized volume — geometry itself is the quantum variable", 14, h - 14);
    }
  }, [prm]);

  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <span className="seg">
          <button className={"btn" + (mode === "string" ? " on" : "")} onClick={() => setMode("string")}>String vibration</button>
          <button className={"btn" + (mode === "spin" ? " on" : "")} onClick={() => setMode("spin")}>Spin network</button>
        </span>
        {mode === "string" ? (
          <SliderRow label="harmonic n" min={1} max={6} step={1} value={n} onChange={setN}
            format={(v) => String(v)}></SliderRow>
        ) : null}
      </div>
      <canvas ref={sim.canvasRef} className="viz-canvas" style={{ height: 260 }}></canvas>
      <VizCaption status="schematic">
        Two candidate microstructures for the same macroscopic spacetime. Left mode: in string theory the particle
        spectrum is the harmonic spectrum of an extended object. Right mode: in loop quantum gravity, space is a
        superposition of spin networks with discrete geometric spectra. Both are conceptual renderings of
        mathematics, not images of observed objects.
      </VizCaption>
    </div>
  );
}

function TheoryComparator() {
  const [mode, setMode] = useState("matrix"); // matrix | duel
  const [sel, setSel] = useState({ th: "string", row: "idea" });
  const [duel, setDuel] = useState(["string", "lqg"]);
  const T = QGA_THEORIES;
  const selTheory = T.find((t) => t.id === sel.th);
  const selRow = QGA_ROWS.find((r) => r.id === sel.row);

  const statusBadge = (t) => <Badge kind={t.status}></Badge>;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <span className="seg">
          <button className={"btn" + (mode === "matrix" ? " on" : "")} onClick={() => setMode("matrix")}>Full matrix</button>
          <button className={"btn" + (mode === "duel" ? " on" : "")} onClick={() => setMode("duel")}>Compare two</button>
        </span>
        {mode === "duel" ? (
          <span className="fey-row">
            <select value={duel[0]} onChange={(e) => setDuel([e.target.value, duel[1]])}>
              {T.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <span className="ctl-label">vs</span>
            <select value={duel[1]} onChange={(e) => setDuel([duel[0], e.target.value])}>
              {T.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </span>
        ) : null}
      </div>

      {mode === "matrix" ? (
        <div className="cmp-scroll">
          <table className="cmp-table">
            <thead>
              <tr>
                <th className="cmp-rowlabel">aspect</th>
                {T.map((t) => (
                  <th key={t.id}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
                      <span>{t.name}</span>{statusBadge(t)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {QGA_ROWS.map((r) => (
                <tr key={r.id}>
                  <td className="cmp-rowlabel">{r.label}</td>
                  {T.map((t) => (
                    <td key={t.id}
                      className={"cmp-cell" + (sel.th === t.id && sel.row === r.id ? " sel" : "")}
                      onClick={() => setSel({ th: t.id, row: r.id })}>
                      {t.rows[r.id].short}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="cmp-scroll">
          <table className="cmp-table" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th className="cmp-rowlabel">aspect</th>
                {duel.map((id) => {
                  const t = T.find((x) => x.id === id);
                  return (
                    <th key={id}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
                        <span>{t.name}</span>{statusBadge(t)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {QGA_ROWS.map((r) => (
                <tr key={r.id}>
                  <td className="cmp-rowlabel">{r.label}</td>
                  {duel.map((id) => {
                    const t = T.find((x) => x.id === id);
                    return (
                      <td key={id} className={"cmp-cell" + (sel.th === id && sel.row === r.id ? " sel" : "")}
                        onClick={() => setSel({ th: id, row: r.id })}>
                        {t.rows[r.id].long}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mode === "matrix" && selTheory ? (
        <div className="panel cmp-expand">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
            <h3 style={{ marginBottom: 4 }}>{selTheory.name} — {selRow.label.toLowerCase()}</h3>
            {statusBadge(selTheory)}
          </div>
          <p style={{ marginBottom: 0, fontSize: 14 }}>{selTheory.rows[selRow.id].long}</p>
        </div>
      ) : null}
      <p className="small dim" style={{ marginTop: 10 }}>
        Click any cell for the expanded explanation. Confidence labels: <Badge kind="effective"></Badge> = rigorous
        within a limited domain; <Badge kind="conjectural"></Badge> = mathematically developed but experimentally unconfirmed.
      </p>
    </div>
  );
}

function ModuleApproaches({ go }) {
  return (
    <article>
      <ModuleHeader num="06" kicker="The contenders" title="Major Approaches to Quantum Gravity"
        lede="No complete, experimentally confirmed theory of quantum gravity exists. What exists is a set of serious research programs, each rescuing a different virtue — perturbative finiteness, background independence, nonperturbative definition — at a different cost. This module compares them honestly."></ModuleHeader>

      <Section title="The theory constellation">
        <TheoryConstellation3D></TheoryConstellation3D>
      </Section>

      <Section title="Candidate microstructures">
        <MicrostructureViz></MicrostructureViz>
      </Section>

      <Section title="The comparator">
        <TheoryComparator></TheoryComparator>
      </Section>

      <Section title="Key equations across the programs">
        <div className="formula-grid">
          <FormulaCard title="Polyakov action (string theory)" status="conjectural"
            tex="S_P = -\frac{T}{2}\int d^2\sigma\, \sqrt{-h}\, h^{ab}\, \partial_a X^\mu \partial_b X_\mu"
            symbols={[
              { s: "X^\\mu(\\sigma,\\tau)", d: "Embedding of the string worldsheet into spacetime." },
              { s: "h_{ab}", d: "Independent worldsheet metric; integrating it out recovers the Nambu–Goto area action." },
              { s: "T", d: "String tension, setting the string scale; T = 1/(2πα′)." },
            ]}
            meaning="The starting point of string perturbation theory: a 2D field theory whose consistency conditions (conformal invariance) reproduce Einstein's equations for the background — gravity emerges from the worldsheet."
            limits="Defines the theory only perturbatively, around a chosen background. Conjectural as a description of nature."></FormulaCard>
          <FormulaCard title="Wheeler–DeWitt equation (canonical QG)" status="conjectural"
            tex="\hat{\mathcal{H}}\, \Psi[h_{ij}] = 0"
            symbols={[
              { s: "\\Psi[h_{ij}]", d: "Wave functional over 3-geometries — the 'wave function of the universe'." },
              { s: "\\hat{\\mathcal{H}}", d: "Hamiltonian constraint operator of quantized general relativity." },
              { s: "= 0", d: "Time has disappeared: dynamics is encoded as a constraint, not an evolution equation — the 'problem of time'." },
            ]}
            meaning="The formal core of canonical quantum gravity (DeWitt 1967), ancestral to loop quantum gravity. Solving it — even defining it precisely — remains the central open task of the canonical program."
            limits="Formally divergent as written; LQG's spin-network representation is one attempt to make it well-defined."></FormulaCard>
          <FormulaCard title="Bekenstein–Hawking entropy" status="established"
            tex="S_{BH} = \frac{k_B\, c^3 A}{4 G \hbar}"
            symbols={[
              { s: "A", d: "Area of the event horizon." },
              { s: "k_B", d: "Boltzmann constant — this is genuine thermodynamic entropy." },
              { s: "G\\hbar", d: "Gravity and quantum theory in one formula: the only confirmed-by-consistency window into quantum gravity." },
            ]}
            meaning="Entropy scaling with area rather than volume is the single most influential clue in the field — every serious approach is judged by whether it can derive this formula microscopically. String theory (Strominger–Vafa) and LQG both claim derivations in special cases."
            limits="The formula itself is semiclassical; a direct measurement of black hole thermodynamics remains far beyond experiment."></FormulaCard>
          <FormulaCard title="AdS/CFT dictionary (schematic)" status="conjectural"
            tex="Z_{\mathrm{grav}}\big[\phi \to J \big]_{\mathrm{AdS}} \;=\; \Big\langle e^{\int J\, \mathcal{O}}\Big\rangle_{\mathrm{CFT}}"
            symbols={[
              { s: "Z_{\\mathrm{grav}}", d: "Gravitational partition function in the anti-de Sitter bulk, with boundary condition J for the field φ." },
              { s: "\\mathcal{O}", d: "Dual operator in the boundary conformal field theory." },
              { s: "J", d: "Source on the boundary — knobs on the CFT side correspond to boundary values of bulk fields." },
            ]}
            meaning="The Gubser–Klebanov–Polyakov–Witten relation: every bulk gravitational question can in principle be translated into a boundary gauge-theory computation. Quantum gravity in AdS is defined by an ordinary quantum theory."
            limits="Precise duality conjectured for specific theories (e.g. AdS₅×S⁵ ↔ N=4 SYM); unproven mathematically; our universe is not anti-de Sitter."></FormulaCard>
        </div>
      </Section>

      <Misconception title="No quantum gravity theory is experimentally confirmed.">
        Every entry in the comparator is constrained by internal consistency and by recovering known physics —
        not by Planck-scale data. Statements like 'string theory predicts X was confirmed' or 'LQG proved space is
        discrete' overstate the field. The honest summary: several mathematically serious programs, zero decisive experiments.
      </Misconception>
      <ConceptBridge id="approaches-bh" go={go}></ConceptBridge>
    </article>
  );
}

window.ModuleApproaches = ModuleApproaches;
