// mod-gauge-rg.jsx — Module 03: Symmetry, Gauge Theory, and Renormalization
/* One-loop SM running:  α_i⁻¹(μ) = α_i⁻¹(M_Z) − (b_i / 2π) ln(μ / M_Z)
   GUT-normalized b = (41/10, −19/6, −7);  α⁻¹(M_Z) ≈ (59.0, 29.6, 8.45). */
const RG_B = [41 / 10, -19 / 6, -7];
const RG_A0 = [59.0, 29.6, 8.45];
const RG_MZ = 91.19; // GeV
function rgAlphaInv(i, logMu) {
  // logMu = log10(μ/GeV)
  const lnRatio = Math.log(Math.pow(10, logMu) / RG_MZ);
  return RG_A0[i] - (RG_B[i] / (2 * Math.PI)) * lnRatio;
}
const RG_COLORS = ["oklch(0.78 0.1 200)", "oklch(0.74 0.12 235)", "oklch(0.72 0.13 300)"];
const RG_NAMES = ["U(1)_Y  (α₁, GUT-normalized)", "SU(2)_L  (α₂)", "SU(3)_C  (α₃, strong)"];

function RGFlowViz() {
  const [logMu, setLogMu] = useState(2);
  const [annot, setAnnot] = useState(true);
  const logMuRef = useRef(logMu); logMuRef.current = logMu;
  const annotRef = useRef(annot); annotRef.current = annot;
  const prm = usePRM();

  const LO = 0, HI = 19; // log10 GeV range
  const sim = useSimLoop((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const padL = 56, padR = 20, padT = 26, padB = 40;
    const pw = w - padL - padR, ph = h - padT - padB;
    const yMax = 64;
    const X = (lm) => padL + ((lm - LO) / (HI - LO)) * pw;
    const Y = (ainv) => padT + (1 - ainv / yMax) * ph;
    // grid + ticks
    ctx.strokeStyle = "rgba(148,176,224,0.1)"; ctx.lineWidth = 1;
    ctx.font = "9.5px IBM Plex Mono"; ctx.fillStyle = "rgba(148,176,224,0.5)";
    ctx.beginPath();
    for (let lm = 0; lm <= HI; lm += 3) {
      ctx.moveTo(X(lm), padT); ctx.lineTo(X(lm), padT + ph);
      ctx.fillText("10" + supScript(lm), X(lm) - 8, h - padB + 16);
    }
    for (let a = 0; a <= yMax; a += 16) {
      ctx.moveTo(padL, Y(a)); ctx.lineTo(padL + pw, Y(a));
      ctx.fillText(String(a), padL - 26, Y(a) + 3);
    }
    ctx.stroke();
    ctx.fillText("μ  [GeV]", padL + pw - 48, h - padB + 30);
    ctx.save(); ctx.translate(14, padT + ph / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText("1/α  (inverse coupling)", -60, 0); ctx.restore();
    // landmark scales
    const marks = [[2, "M_Z ≈ 91 GeV"], [4.1, "LHC ~13 TeV"], [16, "GUT region (speculative)"], [19, "Planck"]];
    for (const [lm, lbl] of marks) {
      ctx.strokeStyle = "rgba(148,176,224,0.16)";
      ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(X(lm), padT); ctx.lineTo(X(lm), padT + ph); ctx.stroke();
      ctx.setLineDash([]);
      if (annotRef.current) { ctx.fillStyle = "rgba(148,176,224,0.45)"; ctx.fillText(lbl, X(lm) + 4, padT + 12); }
    }
    // coupling lines
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = RG_COLORS[i]; ctx.lineWidth = 2; ctx.beginPath();
      let started = false;
      for (let lm = LO; lm <= HI; lm += 0.1) {
        const a = rgAlphaInv(i, lm);
        if (a <= 0.5) { started = false; continue; } // QCD blows up below ~1 GeV
        const x = X(lm), y = Y(Math.min(a, yMax));
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // animated flow particles along each line (toward UV)
    if (!prm) {
      for (let i = 0; i < 3; i++) {
        for (let k = 0; k < 4; k++) {
          const f = ((t * 0.05 + k / 4 + i * 0.09) % 1);
          const lm = LO + f * (HI - LO);
          const a = rgAlphaInv(i, lm);
          if (a <= 0.5 || a > yMax) continue;
          ctx.fillStyle = RG_COLORS[i];
          ctx.globalAlpha = 0.85;
          ctx.beginPath(); ctx.arc(X(lm), Y(a), 2.4, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }
    // slider marker
    const lm0 = logMuRef.current;
    ctx.strokeStyle = "oklch(0.8 0.1 85)"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(X(lm0), padT); ctx.lineTo(X(lm0), padT + ph); ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const a = rgAlphaInv(i, lm0);
      if (a <= 0.5) continue;
      ctx.fillStyle = RG_COLORS[i];
      ctx.beginPath(); ctx.arc(X(lm0), Y(Math.min(a, yMax)), 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.stroke();
    }
  }, [prm]);

  const muVal = Math.pow(10, logMu);
  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <SliderRow label="energy scale μ" min={0} max={19} step={0.05} value={logMu} onChange={setLogMu}
          format={(v) => "10" + supScript(Math.round(v)) + " GeV"}></SliderRow>
        <Toggle label="annotations" checked={annot} onChange={setAnnot}></Toggle>
      </div>
      <canvas ref={sim.canvasRef} className="viz-canvas" style={{ height: 320 }}></canvas>
      <div className="viz-toolbar viz-toolbar-bottom readout-grid" style={{ display: "grid" }}>
        {[0, 1, 2].map((i) => {
          const ainv = rgAlphaInv(i, logMu);
          return (
            <div className="readout" key={i} style={{ borderColor: RG_COLORS[i].replace(")", " / 0.35)") }}>
              <div className="readout-label" style={{ color: RG_COLORS[i] }}>{RG_NAMES[i]}</div>
              <div className="readout-value">{ainv > 0.5 ? "α⁻¹ ≈ " + ainv.toFixed(1) : "non-perturbative"}</div>
            </div>
          );
        })}
      </div>
      <VizCaption status="schematic">
        One-loop Standard Model running (no thresholds, no new physics). The strong coupling α₃ weakens at high
        energy — asymptotic freedom — and grows toward low energies until perturbation theory fails near 1 GeV.
        The near-meeting of the three lines around 10¹⁴–10¹⁶ GeV motivates — but does not establish — grand
        unification. Precise running is model- and scheme-dependent.
      </VizCaption>
    </div>
  );
}

/* ---------- 3D RG landscape ---------- */
const RG_HEX = [0x6fd0e0, 0x6ba6ff, 0xb98af0];
function RGLandscape3D() {
  const [logMu, setLogMu] = useState(2);
  const logRef = useRef(logMu); logRef.current = logMu;

  const build = (ctx) => {
    const { THREE, scene } = ctx;
    scene.fog = new THREE.FogExp2(0x04060b, 0.014);
    scene.add(new THREE.AmbientLight(0x8899bb, 0.6));
    const X = (lm) => -7 + (lm / 19) * 14;
    const Y = (a) => (Math.min(a, 64) / 64) * 5.4;
    const LANES = [2.6, 0, -2.6];

    const floor = ctx.grid(18, 18, 0x2a3a58, 0.2);
    scene.add(floor);

    const markers = [];
    for (let i = 0; i < 3; i++) {
      const pts = [];
      for (let lm = 0; lm <= 19; lm += 0.1) {
        const a = rgAlphaInv(i, lm);
        if (a <= 0.5) continue;
        pts.push(new THREE.Vector3(X(lm), Y(a), LANES[i]));
      }
      scene.add(ctx.line(pts, RG_HEX[i], 0.9));
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12),
        new THREE.MeshBasicMaterial({ color: RG_HEX[i] }));
      scene.add(m);
      const g = ctx.glow(RG_HEX[i], 1.5, 0.5);
      scene.add(g);
      markers.push({ m, g, i });
      const end = pts[pts.length - 1].clone();
      end.y += 0.4;
      ctx.label(RG_NAMES[i].split("  ")[0], () => end, "s3d-quiet");
    }

    // gravity: α_grav⁻¹ = (E_P / E)² — enters the chart only near the Planck scale
    const gpts = [];
    for (let lm = 17.5; lm <= 19; lm += 0.02) {
      const ainv = Math.pow(1.22e19 / Math.pow(10, lm), 2);
      if (ainv > 64) continue;
      gpts.push(new THREE.Vector3(X(lm), Y(ainv), -5.2));
    }
    scene.add(ctx.line(gpts, 0xe0b35a, 0.95, true));
    const gEnd = gpts[0] ? gpts[0].clone() : new THREE.Vector3(X(18.3), Y(64), -5.2);
    gEnd.y += 0.45;
    ctx.label("gravity α⁻¹ ~ (E_P/E)²", () => gEnd, "s3d-quiet");
    ctx.annotation("gravity's dimensionless strength grows as a power law — off this chart until ~10¹⁸ GeV, then plunges to O(1) at Planck",
      () => ({ x: X(15.4), y: 4.9, z: -5.2 }));

    const marks = [[2, "M_Z"], [4.1, "LHC"], [16, "GUT region (speculative)"], [19, "Planck"]];
    for (const [lm, name] of marks) {
      const p = new THREE.Vector3(X(lm), 0.12, 4.4);
      scene.add(ctx.line([new THREE.Vector3(X(lm), 0, 4.2), new THREE.Vector3(X(lm), 0, -5.6)], 0x44598a, 0.4, true));
      ctx.label(name, () => p, "s3d-quiet");
    }
    ctx.annotation("horizontal axis = resolution scale μ — not time", () => ({ x: 0, y: -0.7, z: 5.8 }));

    const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.05, 6, 9.6),
      new THREE.MeshBasicMaterial({ color: 0xe0b35a, transparent: true, opacity: 0.16, depthWrite: false }));
    sheet.position.y = 3;
    scene.add(sheet);

    return {
      update: (t) => {
        const lm = logRef.current;
        sheet.position.x = X(lm);
        const mo = ctx.motion();
        for (const { m, g, i } of markers) {
          const a = rgAlphaInv(i, lm);
          const vis = a > 0.5;
          m.visible = g.visible = vis;
          if (vis) {
            m.position.set(X(lm), Y(a), LANES[i]);
            g.position.copy(m.position);
            g.material.opacity = 0.4 + (mo > 0 ? 0.15 * Math.sin(t * 2 + i) : 0);
          }
        }
      },
    };
  };

  const aGrav = Math.pow(Math.pow(10, logMu) / 1.22e19, 2);
  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <SliderRow label="energy scale μ" min={0} max={19} step={0.05} value={logMu} onChange={setLogMu}
          format={(v) => "10" + supScript(Math.round(v)) + " GeV"}></SliderRow>
      </div>
      <Scene3D height={420} aria="Three-dimensional renormalization group landscape with energy scrubber"
        initial={{ radius: 15, theta: -0.5, phi: 1.15, target: [0, 1.6, 0], minR: 8, maxR: 34 }}
        build={build} fallback={<RGFlowViz></RGFlowViz>}></Scene3D>
      <div className="viz-toolbar viz-toolbar-bottom readout-grid" style={{ display: "grid" }}>
        {[0, 1, 2].map((i) => {
          const ainv = rgAlphaInv(i, logMu);
          return (
            <div className="readout" key={i}>
              <div className="readout-label" style={{ color: RG_COLORS[i] }}>{RG_NAMES[i]}</div>
              <div className="readout-value">{ainv > 0.5 ? "α⁻¹ ≈ " + ainv.toFixed(1) : "non-perturbative"}</div>
            </div>
          );
        })}
        <div className="readout">
          <div className="readout-label" style={{ color: "var(--gold)" }}>gravity α_grav = (E/E_P)²</div>
          <div className="readout-value">{sciNotation(aGrav, 2)}</div>
        </div>
      </div>
      <VizCaption status="schematic">
        One-loop Standard Model running rendered as a landscape: each lane is one gauge sector, height is the inverse
        coupling 1/α. Drag the energy scrubber from laboratory scales toward Planck — the strong coupling weakens at
        high energy (asymptotic freedom), and gravity's effective strength, growing as (E/E_P)², enters the chart
        only near 10¹⁸ GeV. Running is dependence on the resolution scale of the measurement, not on ordinary time.
      </VizCaption>
    </div>
  );
}

function ModuleRG({ go }) {
  return (
    <article>
      <ModuleHeader num="03" kicker="Scale & symmetry" title="Gauge Theory and Renormalization"
        lede="Two ideas organize all of particle physics: interactions are dictated by local symmetry, and the strength of those interactions depends on the energy scale at which you look. The renormalization group makes the second idea quantitative — and it is where quantum gravity first announces its difficulty."></ModuleHeader>

      <Section title="Local gauge invariance">
        <p>
          A global symmetry rotates a field by the same amount everywhere. Promoting it to a <em>local</em> symmetry —
          an independent rotation at every spacetime point — breaks the derivative terms of the Lagrangian unless a
          compensating field is introduced. That compensating field is the gauge field, and its coupling to matter is
          completely fixed by the symmetry. Electromagnetism, the weak force, and the strong force all arise this way;
          the differences trace back to the structure of the groups U(1), SU(2), SU(3).
        </p>
        <p>
          For non-abelian groups the gauge fields carry the charge they mediate: gluons are themselves colored. This
          self-interaction reverses the sign of the beta function and produces asymptotic freedom — the defining
          dynamical feature of QCD.
        </p>
      </Section>

      <Section title="Running coupling simulator">
        <p>
          Quantum fluctuations screen or anti-screen charges, so measured couplings depend on the momentum scale of
          the probe. Drag the energy slider from laboratory scales to the Planck scale and watch the three inverse
          couplings evolve. The moving points on each curve trace the renormalization group flow toward the ultraviolet.
        </p>
        <RGLandscape3D></RGLandscape3D>
      </Section>

      <Section title="Mathematical formulation">
        <div className="formula-grid">
          <FormulaCard title="Covariant derivative" status="established"
            tex="D_\mu = \partial_\mu - i g\, A_\mu^a T^a"
            symbols={[
              { s: "A_\\mu^a", d: "Gauge field components, one per group generator (8 gluons for SU(3), 3 for SU(2), 1 for U(1))." },
              { s: "T^a", d: "Group generators in the representation of the matter field they act on." },
              { s: "g", d: "Gauge coupling constant — the single free strength parameter per group factor." },
            ]}
            meaning="Replacing ∂ by D everywhere is the entire content of 'gauging' a symmetry: it makes the Lagrangian invariant under local transformations and simultaneously dictates every matter–gauge interaction."
            limits="Form shown for a single group factor; the Standard Model fermions carry all three covariant pieces at once."></FormulaCard>
          <FormulaCard title="Yang–Mills field strength" status="established"
            tex="F_{\mu\nu}^a = \partial_\mu A_\nu^a - \partial_\nu A_\mu^a + g f^{abc} A_\mu^b A_\nu^c"
            symbols={[
              { s: "f^{abc}", d: "Structure constants of the gauge group; zero for abelian U(1), nonzero for SU(2), SU(3)." },
              { s: "g f^{abc} A A", d: "The non-abelian term: gauge bosons interacting with each other." },
            ]}
            meaning="The non-linear term distinguishes Yang–Mills theory from electromagnetism. Gluon self-interaction makes the QCD vacuum anti-screening, producing asymptotic freedom and confinement."
            limits="Classical field strength shown; quantization adds gauge-fixing and ghost structure."></FormulaCard>
          <FormulaCard title="Beta function (one loop)" status="established"
            tex="\beta(g) \equiv \mu \frac{dg}{d\mu} = -\frac{b_0}{16\pi^2} g^3 + \mathcal{O}(g^5)"
            symbols={[
              { s: "\\mu", d: "Renormalization scale — the energy at which the coupling is defined." },
              { s: "b_0", d: "One-loop coefficient; for QCD b₀ = 11 − ⅔n_f > 0, so β < 0 and the coupling falls with energy." },
            ]}
            meaning="The differential equation behind the simulator above. Its sign decides everything: β < 0 gives asymptotic freedom; β > 0 (as in QED) gives couplings that grow in the ultraviolet."
            limits="Perturbative expansion; meaningless where the coupling becomes large (e.g. QCD below ~1 GeV)."></FormulaCard>
        </div>
      </Section>

      <Section title="Why this matters for gravity">
        <p>
          Renormalizability is a statement about how a theory responds to this flow. The gauge couplings of the
          Standard Model are dimensionless, and the flow stays under control. Newton's constant, by contrast, carries
          dimensions of inverse energy squared — so the effective dimensionless strength of gravity,
          <Eq tex="\;G E^2"></Eq>, grows with energy without bound. Perturbative quantum gravity therefore generates
          new divergences at every order, requiring infinitely many counterterms. Module 05 develops this obstruction in detail.
        </p>
      </Section>

      <Misconception title="Couplings do not change over time.">
        A running coupling varies with the <em>energy scale of the measurement</em>, not with the age of the universe.
        Stating α changes 'as energy increases' means: probing the same vacuum at shorter distances reveals a
        different effective charge, because of the cloud of quantum fluctuations being penetrated.
      </Misconception>
      <ConceptBridge id="rg-gr" go={go}></ConceptBridge>
    </article>
  );
}

window.ModuleRG = ModuleRG;
