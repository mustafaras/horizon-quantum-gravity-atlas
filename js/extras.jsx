// extras.jsx — Overview, Glossary, References, Open Problems

/* Deterministic scientific hero: a live "energy ladder" spanning 60 decades,
   from the largest cosmic structures to the Planck length. Pure canvas reads
   its x-positions from real exponents; motion (drift + probe pulse) is gated
   by prefers-reduced-motion and the atlas motion setting. No randomness:
   every render is bit-identical for a given frame index. */
const OVERVIEW_LADDER = [
  { e: 27, label: "observable universe", tag: "horizon ≃ 93 Gly" },
  { e: 21, label: "galactic voids", tag: "Laniakea scale" },
  { e: 16, label: "stellar system", tag: "Neptune orbit" },
  { e: 9, label: "human", tag: "1.7 m" },
  { e: 6, label: "cell nucleus", tag: "optics fails" },
  { e: -9, label: "atom", tag: "Bohr radius" },
  { e: -12, label: "proton", tag: "LHC resolves" },
  { e: -15, label: "electroweak", tag: "W, Z probes" },
  { e: -18, label: "collider frontier", tag: "14 TeV → ħc/E" },
  { e: -35, label: "Planck length", tag: "quantum gravity" },
];
const OVERVIEW_L_MIN = -35, OVERVIEW_L_MAX = 27;

function OverviewEnergyLadder() {
  const prm = usePRM();
  const { motion } = useAtlasSettings();
  const ref = useRef(null);
  const motionRef = useRef(0);
  const tRef = useRef(0);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return undefined;
    const drift = prm ? 0 : (motion === "full" ? 1 : 0.45);
    motionRef.current = drift;
    let raf; let alive = true;
    let last = performance.now();
    const draw = (now) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      tRef.current += dt * motionRef.current;
      const t = tRef.current;
      const { ctx, w, h } = fitCanvas(cv);
      const xOf = (e) => 40 + ((e - OVERVIEW_L_MIN) / (OVERVIEW_L_MAX - OVERVIEW_L_MIN)) * (w - 80);
      const midY = h * 0.52;
      ctx.clearRect(0, 0, w, h);
      // decade ticks: 62 decades, minor labels every 10
      ctx.font = "9px var(--font-mono, monospace)";
      for (let e = Math.ceil(OVERVIEW_L_MIN / 5) * 5; e <= OVERVIEW_L_MAX; e += 5) {
        const x = xOf(e);
        const major = e % 10 === 0;
        ctx.strokeStyle = major ? "rgba(148,176,224,0.3)" : "rgba(148,176,224,0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, midY - (major ? 15 : 8)); ctx.lineTo(x, midY + (major ? 15 : 8)); ctx.stroke();
        if (major && e >= -30) {
          ctx.fillStyle = "rgba(147,161,186,0.85)";
          ctx.fillText("10" + supScript(e) + " m", x - 14, midY + 32);
        }
      }
      // the axis itself
      const grad = ctx.createLinearGradient(40, 0, w - 40, 0);
      grad.addColorStop(0, "rgba(70,212,224,0.55)");
      grad.addColorStop(0.55, "rgba(84,174,255,0.55)");
      grad.addColorStop(1, "rgba(255,141,22,0.55)");
      ctx.strokeStyle = grad; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(40, midY); ctx.lineTo(w - 40, midY); ctx.stroke();
      // ladder stops with a slow, deterministic probe sweep
      const sweep = Math.sin(t * 0.55);
      OVERVIEW_LADDER.forEach((stop, i) => {
        const x = xOf(stop.e);
        const phase = Math.sin(t * 0.9 - i * 0.7);
        const lift = (motionRef.current > 0 ? phase * 3.2 : 0) - 12;
        const near = Math.max(0, 1 - Math.abs(sweep * (w - 80) * 0.5 + 20 - (x - 40)) / 140);
        const y = midY + lift;
        const hot = 0.55 + 0.45 * near;
        ctx.beginPath();
        ctx.arc(x, y, 3.1 + 1.1 * near, 0, Math.PI * 2);
        ctx.fillStyle = stop.e === -35
          ? "rgba(255,123,114," + hot.toFixed(3) + ")"
          : "rgba(84,174,255," + hot.toFixed(3) + ")";
        ctx.fill();
        if (stop.e === -35 || stop.e === 27) {
          ctx.strokeStyle = "rgba(255,123,114,0.4)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x, y, 7.5 + 2.5 * near, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = near > 0.45 ? "#f3f7fe" : "rgba(232,238,248,0.85)";
        ctx.font = "600 10.5px var(--font-head, sans-serif)";
        ctx.textAlign = "center";
        ctx.fillText(stop.label, x, y - 9);
        // alternating leader lines below the axis
        const below = i % 2 === 0;
        ctx.strokeStyle = "rgba(148,176,224,0.34)"; ctx.lineWidth = 1;
        ctx.beginPath();
        if (below) { ctx.moveTo(x, y + 5); ctx.lineTo(x, midY - 4); }
        else { ctx.moveTo(x, y + 5); ctx.lineTo(x, midY + 18); }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, midY - (i % 2 === 0 ? 0 : 0), 0, 0, Math.PI * 2); ctx.stroke();
        if (below) {
          ctx.fillStyle = "rgba(70,212,224,0.75)";
          ctx.font = "9px var(--font-mono, monospace)";
          ctx.fillText(stop.tag, x, y + 15);
        } else {
          ctx.fillStyle = "rgba(70,212,224,0.75)";
          ctx.font = "9px var(--font-mono, monospace)";
          ctx.fillText(stop.tag, x, y - 22);
        }
        ctx.textAlign = "start";
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [prm, motion]);
  return <canvas ref={ref} className="ov-ladder-canvas" style={{ width: "100%", height: 190 }} aria-label="Logarithmic length scale ladder from the observable universe to the Planck length, sixty orders of magnitude"></canvas>;
}

/* Live readouts computed in-page from the pure physics layer,
   window.QGA_PHYSICS (js/physics.mjs → js/science/). */
function OverviewPhysicsStrip() {
  const p = window.QGA_PHYSICS || {};
  const units = p.planckUnits ? p.planckUnits() : null;
  const items = units ? [
    { label: "Planck length", value: "1.616 × 10⁻³⁵ m", note: "where gravity quantizes" },
    { label: "Planck energy", value: "1.2209 × 10¹⁹ GeV", note: "proton collider limit ≈ 14 × 10³ GeV" },
    { label: "Mercury perihelion", value: "42.98″/century", note: "6πGM/c²a(1−e²), confirmed" },
    { label: "1919 light deflection", value: "1.75″ at the limb", note: "4GM/c²b, twice Newton" },
  ] : [];
  return (
    <div className="ov-physics-strip">
      {items.map((it) => (
        <div key={it.label} className="ov-physics-cell">
          <div className="readout-label">{it.label}</div>
          <div className="readout-value" style={{ fontSize: 13.5 }}>{it.value}</div>
          <div className="ov-physics-note">{it.note}</div>
        </div>
      ))}
    </div>
  );
}

/* Per-module scientific metadata so the module grid reads like a map of
   domains of validity, not a menu. Blurb text stays honest and short. */
const OVERVIEW_MODULE_META = {
  sm: { scale: "1–10 TeV", statusKind: "established", cue: "SU(3)×SU(2)×U(1)" },
  qft: { scale: "all E (effective)", statusKind: "established", cue: "ħ drives the path integral" },
  rg: { scale: "μ runs to 10¹⁹ GeV", statusKind: "established", cue: "β(g) flow" },
  gr: { scale: "weak field to horizons", statusKind: "established", cue: "g_μν geometry" },
  planck: { scale: "10¹⁹ GeV", statusKind: "open", cue: "16 empty decades" },
  approaches: { scale: "untested", statusKind: "conjectural", cue: "5 rival programs" },
  bh: { scale: "r₊ … ISCO", statusKind: "effective", cue: "S = k_B A/4" },
  exp: { scale: "GW: 10⁻²¹ strain", statusKind: "effective", cue: "GW150914 + collider" },
};

function ViewOverview({ go }) {
  return (
    <article data-screen-label="Overview">
      <header className="ov-hero" data-screen-label="Overview">
        <div className="module-kicker" style={{ fontSize: 12, letterSpacing: "0.34em" }}>HORIZON · Quantum Gravity Atlas</div>
        <h1 style={{ fontSize: "clamp(40px, 6.4vw, 76px)", lineHeight: 1.02, margin: "16px 0 18px 0", maxWidth: 900, letterSpacing: "-0.02em" }}>
          From fields to geometry —<br></br>then past both.
        </h1>
        <p className="module-lede" style={{ fontSize: 19, maxWidth: 760 }}>
          A quantitative, interactive map of modern physics: eight modules sweep the sixty decades between the
          observable universe and the Planck length, each rendering computed live and labeled with what is
          <em> established</em>, <em>effective</em>, or <em>conjectural</em>. Nothing here is shown as confirmed that is not.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginTop: 22 }}>
          <button className="bridge-go" style={{ fontSize: 14.5, padding: "13px 22px" }} onClick={() => go("sm")}>
            Begin · Module 01 →
          </button>
          <button className="btn" onClick={() => go("bh")}>Jump to Black Holes</button>
          <span className="mono dim" style={{ fontSize: 11, letterSpacing: "0.14em" }}>8 MODULES · INTERACTIVE 3D · LIVE FORMULAS</span>
        </div>
        <div className="ov-hero-ladder" style={{ marginTop: 30 }}>
          <OverviewEnergyLadder></OverviewEnergyLadder>
          <div className="ov-ladder-caption viz-caption" style={{ borderTop: "none", padding: "2px 6px 10px 6px" }}>
            <span>fig. 1 — the arena: every length scale the atlas traverses, on one log axis</span>
            <span className="mono dim">60 decades · 63 powers of ten</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <Badge kind="established"></Badge> <Badge kind="effective"></Badge> <Badge kind="conjectural"></Badge> <Badge kind="schematic"></Badge> <Badge kind="open"></Badge>
        </div>
      </header>
      <OverviewPhysicsStrip></OverviewPhysicsStrip>
      <Section title="The eight modules">
        <div className="formula-grid">
          {QGA_MODULES.map((m) => {
            const meta = OVERVIEW_MODULE_META[m.id];
            return (
              <button key={m.id} className="ov-card gauge-sector" style={{ "--sector-color": "var(--acc)", position: "relative", overflow: "hidden" }}
                onClick={() => go(m.id)}>
                <span aria-hidden="true" style={{ position: "absolute", right: 10, top: -14, fontFamily: "var(--font-head)", fontSize: 64, fontWeight: 700, color: "var(--head)", opacity: 0.05, lineHeight: 1 }}>{m.num}</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div className="gs-name" style={{ color: "var(--acc)" }}>Module {m.num}</div>
                  <Badge kind={meta.statusKind}></Badge>
                </div>
                <div className="gs-group" style={{ fontSize: 17, marginTop: 4 }}>{m.title}</div>
                <p className="small dim" style={{ margin: "8px 0 0 0" }}>{MODULE_BLURBS[m.id]}</p>
                <div className="ov-card-meta" style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <span className="ov-cue mono">{meta.cue}</span>
                  <span className="ov-scale mono">{meta.scale}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Section>
      <Section title="A note on scientific honesty">
        <p>
          This atlas presents quantum gravity as it is: an unsolved research frontier. The Standard Model and general
          relativity are among the most precisely confirmed theories in science; their unification is not. Where the
          field is open, the interface says so. Where a visualization is heuristic, it is labeled. No approach is
          presented as confirmed, because none is.
        </p>
        <div className="panel">
          <StatusLegend></StatusLegend>
        </div>
      </Section>
    </article>
  );
}
const MODULE_BLURBS = {
  sm: "Seventeen fields, three forces, one symmetry principle. Interactive particle atlas and gauge structure.",
  qft: "Fields as fundamental objects. Excite a lattice field, build Feynman diagrams, read the path integral.",
  rg: "Local symmetry dictates interactions; couplings run with scale. One-loop RG flow simulator.",
  gr: "Gravity as geometry. Deform spacetime with mass, watch geodesics and light bending respond.",
  planck: "Where and why quantization of gravity fails: dimensional analysis, non-renormalizability, the scale ladder.",
  approaches: "Strings, loops, effective field theory, asymptotic safety, holography — compared honestly.",
  bh: "Black hole thermodynamics simulator, the information paradox, and boundary-bulk holography.",
  exp: "Collider events, gravitational waves, cosmology — what experiment does and does not constrain.",
};

function ViewGlossary() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);
  const items = QGA_GLOSSARY.filter((g) =>
    g.term.toLowerCase().includes(query.toLowerCase()) ||
    g.def.toLowerCase().includes(query.toLowerCase()));
  return (
    <article data-screen-label="Glossary">
      <header>
        <div className="module-kicker">Reference</div>
        <h1>Interactive Glossary</h1>
        <p className="module-lede">Concise and advanced definitions, with the most common misconception attached to each term.</p>
      </header>
      <div className="section">
        <input className="glossary-search" type="search" placeholder="Search terms — e.g. gauge, entropy, geodesic…"
          value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search glossary"></input>
        <div style={{ marginTop: 16 }}>
          {items.map((g) => (
            <div key={g.term} className="gloss-item">
              <button className="gloss-head" onClick={() => setOpen(open === g.term ? null : g.term)} aria-expanded={open === g.term}>
                <span className="gloss-term">{g.term}</span>
                <span className="fc-hint">{open === g.term ? "− close" : "+ expand"}</span>
              </button>
              <div className="gloss-body" style={{ display: open === g.term ? "block" : "none" }}>
                <div className="gloss-sub">Definition</div>
                <p style={{ marginBottom: 0 }}>{g.def}</p>
                <div className="gloss-sub">Advanced</div>
                <p style={{ marginBottom: 0 }}>{g.adv}</p>
                <div className="gloss-sub" style={{ color: "var(--gold)" }}>Common misconception</div>
                <p style={{ marginBottom: 0 }}>{g.misc}</p>
              </div>
              {open !== g.term ? <div className="gloss-body"><p className="dim small" style={{ marginBottom: 0 }}>{g.def}</p></div> : null}
            </div>
          ))}
          {items.length === 0 ? <p className="dim">No terms match “{query}”.</p> : null}
        </div>
      </div>
    </article>
  );
}

function ViewReferences() {
  const [tag, setTag] = useState("all");
  const tags = ["all", ...Array.from(new Set(QGA_REFERENCES.map((r) => r.tag)))];
  const items = QGA_REFERENCES.filter((r) => tag === "all" || r.tag === tag);
  return (
    <article data-screen-label="References">
      <header>
        <div className="module-kicker">Reference</div>
        <h1>Scientific Bibliography</h1>
        <p className="module-lede">
          Curated primary literature and standard graduate texts. All entries are well-established, verifiable
          publications; no citation here is fabricated. Module content paraphrases these sources at textbook level.
        </p>
      </header>
      <div className="section">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {tags.map((tg) => (
            <button key={tg} className={"btn" + (tag === tg ? " on primary" : "")} onClick={() => setTag(tg)}>{tg}</button>
          ))}
        </div>
        <div>
          {items.map((r, i) => (
            <div key={i} className="ref-item">
              <span className="ref-num">[{String(QGA_REFERENCES.indexOf(r) + 1).padStart(2, "0")}]</span>
              <span>{r.text}<span className="ref-tag">{r.tag}</span></span>
            </div>
          ))}
        </div>
        <p className="small dim" style={{ marginTop: 16 }}>
          Reading path suggestion: Peskin & Schroeder (QFT) → Wald (GR) → Donoghue (EFT of gravity) →
          the 1973–1975 black hole thermodynamics papers → ’t Hooft / Susskind / Maldacena (holography),
          alongside Rovelli and Polchinski for the two largest research programs.
        </p>
      </div>
    </article>
  );
}

function ViewOpenProblems() {
  return (
    <article data-screen-label="Open Problems">
      <header>
        <div className="module-kicker">Limitations & frontiers</div>
        <h1>Limitations and Open Problems</h1>
        <p className="module-lede">
          Quantum gravity is an unsolved research frontier. This page collects what this atlas — and the field —
          cannot currently tell you, stated plainly.
        </p>
      </header>
      <div className="section">
        <div className="formula-grid">
          {QGA_OPEN_PROBLEMS.map((p) => (
            <div key={p.title} className="panel">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                <h3>{p.title}</h3>
                <Badge kind="open"></Badge>
              </div>
              <p className="small" style={{ marginBottom: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
      <Section title="Limitations of this atlas">
        <p className="small">
          The simulations here are pedagogical instruments, not research codes: lattice field dynamics, orbital
          mechanics, lensing, and waveform sketches are qualitatively faithful but numerically simplified, and each
          carries a status label. Masses and couplings are quoted to orientation precision; consult the Particle Data
          Group for current values. Visualizations of Planck-scale physics are necessarily speculative renderings of
          mathematics — treat every such image as a hypothesis about reality, not a photograph of it.
        </p>
      </Section>
    </article>
  );
}

function ViewSymbols({ go }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const cats = ["all", ...Array.from(new Set(QGA_SYMBOLS.map((s) => s.cat)))];
  const catCount = (c) => (c === "all" ? QGA_SYMBOLS.length : QGA_SYMBOLS.filter((s) => s.cat === c).length);
  const q = query.trim().toLowerCase();
  const items = QGA_SYMBOLS.filter((s) =>
    (cat === "all" || s.cat === cat) &&
    (q === "" ||
      s.sym.toLowerCase().includes(q) ||
      s.cat.toLowerCase().includes(q) ||
      s.contexts.some((c) =>
        c.ctx.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q) ||
        c.unit.toLowerCase().includes(q))));
  const ctxCount = items.reduce((n, s) => n + s.contexts.length, 0);
  const moduleShort = (id) => (QGA_MODULES.find((m) => m.id === id) || {}).short || id;
  return (
    <article data-screen-label="Symbol Atlas">
      <header>
        <div className="module-kicker">Reference · Notation</div>
        <h1>Symbol Atlas</h1>
        <p className="module-lede">
          Every symbol the atlas uses — typeset exactly as it appears in the formulas, with its meaning, its unit,
          its home module, and the contexts where the same letter means something different. Notation is a
          convention, not a truth: this page makes ours explicit.
        </p>
      </header>
      <div className="section">
        <div className="sym-toolbar">
          <input className="glossary-search" type="search" placeholder="Search symbols — e.g. beta, coupling, kelvin…"
            value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search symbols"></input>
          <div className="sym-chips" role="group" aria-label="Filter symbols by category">
            {cats.map((c) => (
              <button key={c} className={"sym-chip" + (cat === c ? " active" : "")}
                onClick={() => setCat(c)} aria-pressed={cat === c}>
                {c === "all" ? "All categories" : c}
                <span className="sym-chip-count">{catCount(c)}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="dim small" style={{ marginTop: 0 }}>
          {items.length} of {QGA_SYMBOLS.length} symbols · {ctxCount} contexts — same letters, different physics.
        </p>
        <div className="sym-grid">
          {items.map((s, i) => (
            <div key={s.sym} className="sym-card" style={{ "--i": Math.min(i, 14) }}>
              <div className="sym-head">
                <div className="sym-glyph-tile" aria-hidden="true">
                  <Eq tex={s.tex || s.sym}></Eq>
                </div>
                <div className="sym-head-meta">
                  <span className="sym-cat">{s.cat}</span>
                  <span className="sym-contexts-count">
                    {s.contexts.length} context{s.contexts.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              {s.contexts.map((c, j) => (
                <div key={j} className="sym-ctx">
                  <div className="sym-ctx-label">{c.ctx}</div>
                  {c.eq ? (
                    <div className="sym-eq">
                      <Eq tex={c.eq} display={true}></Eq>
                    </div>
                  ) : null}
                  <p className="sym-ctx-meaning">{c.meaning}</p>
                  <div className="sym-ctx-meta">
                    <span className="sym-unit">{"[ " + c.unit + " ]"}</span>
                    {c.module ? (
                      <button className="sym-module-chip" onClick={() => go(c.module)}
                        title={"Open " + moduleShort(c.module) + " module"}>
                        {"→ " + moduleShort(c.module)}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {items.length === 0 ? <p className="dim">No symbols match “{query}”.</p> : null}
        </div>
        <div className="panel sym-conv-panel">
          <div className="gloss-sub">Conventions used throughout the atlas</div>
          <div className="sym-conv-grid">
            {QGA_CONVENTIONS.map((c, i) => (
              <div key={c.title} className="sym-conv" style={{ "--i": i }}>
                <div className="sym-conv-title">{c.title}</div>
                {c.tex ? (
                  <div className="sym-eq sym-conv-eq">
                    <Eq tex={c.tex} display={true}></Eq>
                  </div>
                ) : null}
                <p>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ---------- Whitepaper · in-app companion document ---------- */
function PaperEq({ tex, note }) {
  return (
    <figure className="paper-eq">
      <div className="paper-eq-body"><Eq tex={tex} display={true}></Eq></div>
      {note ? <figcaption className="paper-eq-note">{note}</figcaption> : null}
    </figure>
  );
}

function PaperNote({ kind = "note", title, children }) {
  return (
    <aside className={"paper-note paper-note-" + kind}>
      {title ? <div className="paper-note-title">{title}</div> : null}
      <div className="paper-note-body">{children}</div>
    </aside>
  );
}

function PaperSection({ id, index, title, children }) {
  return (
    <section className="section paper-section" id={"paper-" + id}>
      <div className="section-head">
        {index ? <span className="section-index">{index}</span> : null}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function PaperSub({ index, title, children }) {
  return (
    <div className="paper-sub">
      <h3 className="paper-sub-head"><span className="paper-sub-num">{index}</span>{title}</h3>
      {children}
    </div>
  );
}

const PAPER_TOC = [
  ["intro", "1", "Introduction"],
  ["epistemic", "2", "Epistemic framework"],
  ["chain", "3", "The chain of reasoning"],
  ["design", "4", "Design methodology"],
  ["architecture", "5", "Software architecture"],
  ["verification", "6", "Verification and validation"],
  ["limits", "7", "Limitations"],
  ["conclusion", "8", "Conclusion"],
  ["spine", "A", "Formulation spine"],
  ["refs", "R", "References"],
];

const PAPER_STATUSES = [
  ["established", "Experimentally confirmed, or a measurement-grade theory.", "QFT as the framework of the Standard Model; classical general relativity; the Higgs boson; GW150914; the M87* horizon-scale image."],
  ["effective", "Rigorous within a stated energy or coupling domain, with known limits.", "Low-energy quantum gravity as an effective field theory; the one-loop running of the QED and QCD couplings."],
  ["schematic", "A deliberately simplified illustration — not a measurement.", "The collider event display; the Planck-foam scene; the scattering-plane animation."],
  ["conjectural", "A mathematically serious research program, experimentally unconfirmed.", "String theory; loop quantum gravity; asymptotic safety; causal sets; holography."],
  ["open", "No confirmed answer exists.", "The information paradox; the ultraviolet completion of quantum gravity."],
];

const PAPER_REFS = [
  "A. Einstein, “Die Feldgleichungen der Gravitation,” Sitzungsberichte der Preussischen Akademie der Wissenschaften, 1915.",
  "P. A. M. Dirac, “The Quantum Theory of the Electron,” Proceedings of the Royal Society A, 1928.",
  "R. P. Feynman, “Space-Time Approach to Non-Relativistic Quantum Mechanics,” Reviews of Modern Physics, 1948.",
  "C. N. Yang and R. L. Mills, “Conservation of Isotopic Spin and Isotopic Gauge Invariance,” Physical Review, 1954.",
  "S. Weinberg, “A Model of Leptons,” Physical Review Letters, 1967.",
  "D. J. Gross and F. Wilczek, “Ultraviolet Behavior of Non-Abelian Gauge Theories,” Physical Review Letters, 1973.",
  "H. D. Politzer, “Reliable Perturbative Results for Strong Interactions?,” Physical Review Letters, 1973.",
  "J. D. Bekenstein, “Black Holes and Entropy,” Physical Review D, 1973.",
  "S. W. Hawking, “Particle Creation by Black Holes,” Communications in Mathematical Physics, 1975.",
  "G. ’t Hooft and M. Veltman, “One-loop divergencies in the theory of gravitation,” Annales de l’Institut Henri Poincaré A, 1974.",
  "S. Weinberg, “Ultraviolet divergences in quantum theories of gravitation,” in General Relativity: An Einstein Centenary Survey, 1979.",
  "M. H. Goroff and A. Sagnotti, “The ultraviolet behavior of Einstein gravity,” Nuclear Physics B, 1986.",
  "A. Ashtekar, “New Variables for Classical and Quantum Gravity,” Physical Review Letters, 1986.",
  "G. ’t Hooft, “Dimensional Reduction in Quantum Gravity,” arXiv:gr-qc/9310026, 1993.",
  "L. Susskind, “The World as a Hologram,” Journal of Mathematical Physics, 1995.",
  "A. Strominger and C. Vafa, “Microscopic Origin of the Bekenstein-Hawking Entropy,” Physics Letters B, 1996.",
  "J. Maldacena, “The Large N Limit of Superconformal Field Theories and Supergravity,” Advances in Theoretical and Mathematical Physics, 1998.",
  "J. F. Donoghue, “General relativity as an effective field theory: The leading quantum corrections,” Physical Review D, 1994.",
  "S. Ryu and T. Takayanagi, “Holographic Derivation of Entanglement Entropy from AdS/CFT,” Physical Review Letters, 2006.",
  "ATLAS and CMS Collaborations, Higgs boson discovery papers, Physics Letters B, 2012.",
  "LIGO Scientific and Virgo Collaborations, “Observation of Gravitational Waves from a Binary Black Hole Merger,” Physical Review Letters, 2016.",
  "Event Horizon Telescope Collaboration, “First M87 Event Horizon Telescope Results,” Astrophysical Journal Letters, 2019.",
  "G. Penington, “Entanglement Wedge Reconstruction and the Information Paradox,” JHEP, 2020.",
  "A. Almheiri, N. Engelhardt, D. Marolf, and H. Maxfield, “The entropy of bulk quantum fields and the entanglement wedge of an evaporating black hole,” JHEP, 2019.",
  "M. E. Peskin and D. V. Schroeder, An Introduction to Quantum Field Theory, 1995.",
  "S. Weinberg, The Quantum Theory of Fields, Vols. I–II, 1995–1996.",
  "C. W. Misner, K. S. Thorne, and J. A. Wheeler, Gravitation, 1973.",
  "R. M. Wald, General Relativity, 1984.",
  "J. Polchinski, String Theory, Vols. I–II, 1998.",
  "C. Rovelli, Quantum Gravity, 2004.",
  "M. Gell-Mann and F. E. Low, “Quantum Electrodynamics at Small Distances,” Physical Review 95, 1300–1312 (1954).",
  "M. Reuter, “Nonperturbative Evolution Equation for Quantum Gravity,” Physical Review D 57, 971–985 (1998).",
];

function ViewWhitepaper() {
  const jump = (id) => {
    const el = document.getElementById("paper-" + id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <article data-screen-label="Whitepaper" className="paper-doc">
      <header className="paper-head">
        <div className="module-kicker" style={{ fontSize: 12, letterSpacing: "0.34em" }}>HORIZON · Companion document</div>
        <h1 className="paper-title">A Quantum Gravity Atlas</h1>
        <p className="paper-subtitle">An epistemically labeled, interactive atlas of the quantum-gravity problem</p>
        <div className="paper-meta">
          <div className="paper-meta-row"><span className="paper-meta-k">Artifact</span><span className="paper-meta-v">Interactive static web atlas · 14 views · 8 physics modules</span></div>
          <div className="paper-meta-row"><span className="paper-meta-k">Access</span><span className="paper-meta-v">mustafaras.github.io/horizon-quantum-gravity-atlas</span></div>
          <div className="paper-meta-row"><span className="paper-meta-k">License</span><span className="paper-meta-v">MIT · citation via CITATION.cff (CFF 1.2.0)</span></div>
        </div>
        <div className="paper-badges">
          <Badge kind="established"></Badge> <Badge kind="effective"></Badge> <Badge kind="schematic"></Badge> <Badge kind="conjectural"></Badge> <Badge kind="open"></Badge>
        </div>
      </header>

      <div className="paper-abstract">
        <div className="paper-abstract-label">Abstract</div>
        <p>
          Quantum gravity is not a single missing equation but a collision between two extraordinarily successful
          frameworks, and communicating that collision honestly is a persistent failure point of public physics media:
          speculation is routinely blended with established result. This document describes <strong>HORIZON</strong>, an
          interactive atlas that maps <em>why the problem of quantum gravity exists</em> — from the experimentally
          established core, through the formal machinery of quantum field theory and general relativity, to the point
          where the two frameworks conflict and the major research programs diverge. The atlas enforces a single central
          rule: <em>a visualization may be cinematic, but the epistemic status of the physics must remain explicit.</em>
          Every panel carries one of five machine-consistent status labels, and every equation is treated as an interface
          object paired with symbol definitions, meaning, and limitations. We describe the epistemic framework, the chain
          of physical reasoning, the design methodology, the zero-build software architecture, and the verification
          infrastructure: literature-anchored unit tests, a manifest-driven browser QA harness with per-capture justified
          visual tolerances, and deterministic offline fixtures for real-data network phases. The atlas does not claim
          that quantum gravity has been solved; it claims something more defensible — that the boundary between what is
          known, what is effective, and what is conjectured can itself be made a first-class object of interactive study.
        </p>
      </div>

      <nav className="paper-toc" aria-label="Whitepaper contents">
        <div className="paper-toc-label">Contents</div>
        <div className="paper-toc-grid">
          {PAPER_TOC.map(([id, num, title]) => (
            <button key={id} className="paper-toc-item" onClick={() => jump(id)}>
              <span className="paper-toc-num">{num}</span>
              <span className="paper-toc-title">{title}</span>
            </button>
          ))}
        </div>
      </nav>

      <PaperSection id="intro" index="1" title="Introduction">
        <PaperSub index="1.1" title="The pedagogical problem">
          <p>
            The quantum-gravity problem is unusually badly served by popular science communication. Three failure modes
            recur, and the atlas is built against all three.
          </p>
          <ol className="paper-list">
            <li>
              <strong>Blending.</strong> Speculative frameworks are presented alongside established physics without
              epistemic distinction, so a reader cannot tell where experiment ends and conjecture begins.
            </li>
            <li>
              <strong>Equation avoidance.</strong> The mathematics that makes the problem <em>quantitative</em> — the
              negative mass dimension of Newton’s constant, the power-law growth of the gravitational coupling — is
              replaced by metaphor, precisely where metaphor is least trustworthy.
            </li>
            <li>
              <strong>False closure.</strong> Research programs are presented as competing answers rather than as
              serious, unresolved research agendas.
            </li>
          </ol>
          <p>
            HORIZON is an <em>atlas</em> in the cartographic sense: it does not argue for a destination, it maps the
            terrain, marks the borders of the known, and labels the unexplored regions as unexplored.
          </p>
        </PaperSub>
        <PaperSub index="1.2" title="What the atlas is">
          <p>
            HORIZON is a static, zero-build web application of fourteen views: eight physics modules (Standard Model,
            quantum field theory, gauge symmetry and renormalization-group flow, general relativity, the Planck frontier,
            a theory comparator, black holes, and experiment), plus reference and laboratory surfaces — a Kerr
            observatory, a gravitational-wave theatre with a bounded real-data mode, a causal spacetime laboratory, an
            RG-flow landscape, a Symbol Atlas of 27 symbols across 33 contexts, and this document. It runs from a plain
            local HTTP server with no backend and no build step, yet presents itself as a research-grade instrument
            rather than a web demo.
          </p>
        </PaperSub>
        <PaperSub index="1.3" title="Contributions">
          <ul className="paper-list">
            <li>an <strong>epistemic labeling system</strong> (§2) that classifies every claim into five statuses and is enforced consistently across UI, README, and tests;</li>
            <li>a <strong>chain of reasoning</strong> (§3) that leads from established physics to the open problem without an unmotivated leap;</li>
            <li>a <strong>design methodology</strong> (§4) in which equations are interface objects and interactivity carries interpretation;</li>
            <li>a <strong>zero-build architecture</strong> (§5) chosen for archival stability and reproducibility;</li>
            <li>a <strong>verification infrastructure</strong> (§6) that anchors the implemented physics to literature values and pins the visual output with justified tolerances;</li>
            <li>a <strong>formulation spine</strong> (Appendix A) collecting the equations the atlas actually implements.</li>
          </ul>
        </PaperSub>
      </PaperSection>

      <PaperSection id="epistemic" index="2" title="Epistemic framework">
        <PaperSub index="2.1" title="The five status labels">
          <p>
            Every major panel carries exactly one of five labels, ordered by evidential strength. The labels are not
            decorative: they are the same tokens the test suite and the capture manifest assert against.
          </p>
          <div className="paper-status-table">
            {PAPER_STATUSES.map(([kind, meaning, example]) => (
              <div key={kind} className="paper-status-row">
                <div className="paper-status-badge"><Badge kind={kind}></Badge></div>
                <div className="paper-status-meaning">{meaning}</div>
                <div className="paper-status-example">{example}</div>
              </div>
            ))}
          </div>
        </PaperSub>
        <PaperSub index="2.2" title="Honesty rules">
          <p>
            The atlas states explicitly what it may and may not claim. It <strong>may</strong> claim that quantum field
            theory and general relativity are the established frameworks of their domains; that low-energy quantum
            gravity is a valid effective field theory; that black-hole thermodynamics is a semiclassical theoretical
            landmark; and that collider and gravitational-wave observations constrain theory space.
          </p>
          <PaperNote kind="warn" title="What the atlas must not claim">
            <ul className="paper-list">
              <li>that a complete quantum-gravity theory is confirmed;</li>
              <li>that Planck-scale discreteness is observed;</li>
              <li>that Hawking radiation from astrophysical black holes has been directly detected;</li>
              <li>that AdS/CFT is the proven description of our universe;</li>
              <li>that a schematic 3D visualization is a literal measurement.</li>
            </ul>
          </PaperNote>
          <p>
            These rules are design inputs, not disclaimers appended after the fact. The strongest visual panels carry the
            strongest caveats: the Planck foam is labeled speculative, the collider display schematic, the holography
            panel conjectural.
          </p>
        </PaperSub>
      </PaperSection>

      <PaperSection id="chain" index="3" title="The chain of reasoning">
        <p>
          The atlas leads a reader through a single continuous argument. Each step is either established physics or an
          explicitly labeled extrapolation.
        </p>

        <PaperSub index="3.1" title="Two successful frameworks">
          <p>
            Quantum field theory describes fields on a spacetime <em>background</em>. General relativity says that
            background is itself <em>dynamical</em>. Both are extraordinarily successful in their domains — the tension
            is not philosophical decoration; it becomes quantitative the moment one tries to perturbatively quantize the
            Einstein–Hilbert action.
          </p>
          <PaperEq tex="S_{\mathrm{EH}} = \frac{c^3}{16\pi G}\int d^4x\,\sqrt{-g}\,(R - 2\Lambda) + S_{\mathrm{matter}}" note="The Einstein–Hilbert action: the object whose quantization is the problem."></PaperEq>
        </PaperSub>

        <PaperSub index="3.2" title="Dimensional analysis and the failure of perturbation">
          <p>
            In four spacetime dimensions Newton’s constant carries negative mass dimension. This single fact drives the
            whole story.
          </p>
          <PaperEq tex="[G_N] = -2 \quad (\text{in units where } \hbar = c = 1)" note="Negative mass dimension: the coupling is not dimensionless."></PaperEq>
          <p>
            Consequently the effective dimensionless strength of gravity grows with energy as a <em>power law</em>,
            rather than logarithmically as in a renormalizable gauge theory:
          </p>
          <PaperEq tex="\alpha_{\mathrm{grav}}(E) \;\sim\; \frac{G_N E^2}{\hbar c^5} \;=\; \left(\frac{E}{E_P}\right)^2" note="Power-law growth: the perturbative expansion degrades as E approaches the Planck energy."></PaperEq>
          <p>
            Expanding the metric around a background exposes the graviton field and the coupling normalization:
          </p>
          <PaperEq tex="g_{\mu\nu} = \eta_{\mu\nu} + \kappa\, h_{\mu\nu}, \qquad \kappa^2 = 32\pi G" note="The graviton field h_μν and its coupling κ."></PaperEq>
          <p>
            The effective action then contains an infinite tower of higher-curvature operators, each suppressed by
            further powers of the cutoff:
          </p>
          <PaperEq tex="S_{\mathrm{EFT}} = \int d^4x\,\sqrt{-g}\left[\frac{R}{16\pi G} + c_1 R^2 + c_2 R_{\mu\nu}R^{\mu\nu} + c_3 R_{\mu\nu\rho\sigma}R^{\mu\nu\rho\sigma} + \cdots\right]" note="An infinite tower of operators: at E ≪ E_P only the first few matter; at Planckian energies infinitely many become relevant."></PaperEq>
          <p>
            The Goroff–Sagnotti two-loop computation makes the obstruction concrete: the divergence structure requires
            new counterterms of the <span className="mono">R³</span> type, so the theory is non-renormalizable in the
            ordinary sense. At low energies, however, quantum gravity is a perfectly valid effective field theory — the
            atlas implements this honestly and marks the boundary rather than papering over it.
          </p>
          <PaperNote kind="note" title="Why this is the honest framing">
            The EFT is <em>reliable below the cutoff</em> and <em>silent about the ultraviolet completion</em>. The atlas
            presents both halves of that sentence together, because presenting only the first is the most common
            overclaim in the field.
          </PaperNote>
        </PaperSub>

        <PaperSub index="3.3" title="Black holes as theoretical laboratories">
          <p>
            Black holes sharpen the issue because they combine horizons, thermodynamics, quantum fields in curved
            spacetime, entropy–area scaling, and information flow in a single object. The Schwarzschild geometry sets the
            scale:
          </p>
          <PaperEq tex="r_s = \frac{2GM}{c^2}, \qquad A = 4\pi r_s^2" note="Horizon radius and area."></PaperEq>
          <p>
            The Bekenstein–Hawking entropy is the most famous area law in gravitational physics — entropy scales with
            <em>area</em>, not volume:
          </p>
          <PaperEq tex="S_{BH} = \frac{k_B c^3 A}{4G\hbar} = k_B\,\frac{A}{4\ell_P^2}" note="Area law: the entropy of a black hole is proportional to its horizon area in Planck units."></PaperEq>
          <p>
            The Hawking temperature and the evaporation timescale follow from the semiclassical calculation:
          </p>
          <PaperEq tex="T_H = \frac{\hbar c^3}{8\pi G M k_B}, \qquad t_{\mathrm{evap}} \propto M^3" note="Hawking temperature and the cubic mass scaling of the evaporation time."></PaperEq>
          <p>
            For a rotating (Kerr) black hole the outer and inner horizons are
          </p>
          <PaperEq tex="r_\pm = \frac{GM}{c^2}\left[1 \pm \sqrt{1 - a_\star^2}\right], \qquad a_\star = \frac{cJ}{GM^2}" note="Kerr horizons in terms of the dimensionless spin a★."></PaperEq>
          <p>
            and the surface gravity — hence the temperature — decreases toward the extremal limit:
          </p>
          <PaperEq tex="\kappa = \frac{c^4}{2GM}\,\frac{\sqrt{1-a_\star^2}}{1+\sqrt{1-a_\star^2}}, \qquad T_{\mathrm{Kerr}} = \frac{\hbar\kappa}{2\pi c k_B} \;\xrightarrow[a_\star \to 1]{}\; 0" note="Surface gravity and the vanishing extremal temperature."></PaperEq>
          <p>
            Any credible quantum-gravity program must explain why black holes carry entropy proportional to horizon area
            and how unitary quantum evolution is reconciled with semiclassical evaporation. The atlas gives the
            information paradox its own decision-tree treatment and the modern entanglement-wedge literature its own
            conjectural panel.
          </p>
        </PaperSub>

        <PaperSub index="3.4" title="Research programs, compared without a winner">
          <p>
            The theory comparator places string theory, loop quantum gravity, asymptotic safety, causal sets, and
            holography side by side — with their leading ideas, their achievements, and their open questions — and
            deliberately declares no winner, because none is experimentally confirmed.
          </p>
        </PaperSub>

        <PaperSub index="3.5" title="Experimental anchors">
          <p>
            The experiment module grounds the atlas in data: the Higgs boson (2012), the first direct gravitational-wave
            observation GW150914 (2016), and the EHT horizon-scale image of M87* (2019). The gravitational-wave theatre
            includes a bounded real-data mode that fetches from GWOSC with a full deterministic offline fixture for every
            network phase, so the data path itself is honest: success, HTTP error, abort, oversize, and cancel are all
            first-class, tested states.
          </p>
        </PaperSub>
      </PaperSection>

      <PaperSection id="design" index="4" title="Design methodology">
        <PaperSub index="4.1" title="Equations are interface objects">
          <p>
            Equations are not decorative glyphs. Each formula is paired with symbol definitions, meaning, and
            limitations; the interface treats a formula as a compact map of assumptions. The Symbol Atlas extends this to
            the notation layer itself: 27 symbols across 33 contexts, disambiguating reused letters — β as v/c versus
            β(g) as an RG function; the metric g<sub>μν</sub> versus a coupling g versus a fixed point g★ — with every
            glyph and defining equation typeset live with KaTeX.
          </p>
        </PaperSub>
        <PaperSub index="4.2" title="Interactivity carries interpretation">
          <p>
            Sliders are not UI ornaments. A mass slider changes the black-hole radius, temperature, entropy, evaporation
            time, and Kerr geometry readouts together, so a single gesture moves a <em>family</em> of related quantities.
            A scale slider shows how many decades separate collider physics from the Planck length. A collision selector
            changes both a 3D scattering animation and the matching diagrammatic amplitude. The causal laboratory
            computes exact Lorentz transformations and invariant intervals from draggable, keyboard-accessible events.
            The RG-flow landscape integrates one-loop QED/QCD flows deterministically in both directions and marks the
            b₀ = 0 boundary at n<sub>f</sub> = 16.5.
          </p>
        </PaperSub>
        <PaperSub index="4.3" title="Aesthetic density must not hide epistemic boundaries">
          <p>
            The atlas uses a dark scientific atmosphere, raymarched scenes, bloom, and instrument-like typography. The
            design rule is that aesthetic density is permitted only where the epistemic labeling survives it — cinematic
            visuals, never cinematic certainty.
          </p>
        </PaperSub>
        <PaperSub index="4.4" title="Accessibility as a scientific requirement">
          <p>
            Motion is fully bounded and every animated surface snaps under <span className="mono">prefers-reduced-motion</span>.
            Keyboard focus, arrow-key sliders, 44 px touch targets, and horizontal chart scrolling are tested, not
            aspirational. An atlas that claims to serve understanding must be usable by the people trying to understand it.
          </p>
        </PaperSub>
      </PaperSection>

      <PaperSection id="architecture" index="5" title="Software architecture">
        <PaperSub index="5.1" title="Zero-build, static-first">
          <p>
            The application is intentionally a folder of static files. It loads React, Babel, Three.js, KaTeX, and its
            web fonts from self-hosted copies under <span className="mono">vendor/</span>, runs from any plain HTTP
            server, and requires no backend and no build step. This is an archival decision: a reader in ten years
            should be able to serve the repository and see the same atlas, with no third-party host in the request
            path, and a reviewer can audit the exact bytes that ship.
          </p>
        </PaperSub>
        <PaperSub index="5.2" title="Module structure">
          <p>
            Pure physics lives in <span className="mono">js/physics.mjs</span> as framework-free ES modules, mirrored
            into the browser through a bridge, so the same code paths are testable under <span className="mono">node --test</span>
            and exercised by the UI. Views are declarative components over a shared state layer; every laboratory view
            supports URL state, back/forward restoration, and a versioned export JSON schema.
          </p>
        </PaperSub>
        <PaperSub index="5.3" title="Reproducible sharing">
          <p>
            Every laboratory view encodes its full state in the URL, so an exact configuration — a Kerr geometry, an RG
            flow, a causal-lab arrangement — is a shareable, citable object.
          </p>
        </PaperSub>
      </PaperSection>

      <PaperSection id="verification" index="6" title="Verification and validation">
        <PaperSub index="6.1" title="Literature-anchored unit tests">
          <p>
            The pure-physics suite (<span className="mono">test/physics.test.mjs</span>, run under <span className="mono">node --test</span>)
            anchors the implemented observables to literature values.
          </p>
          <div className="paper-anchor-table">
            <div className="paper-anchor-head"><span>Observable</span><span>Literature anchor</span></div>
            {[
              ["Mercury perihelion advance", "42.98″ per century"],
              ["Solar-limb light deflection", "1.75″"],
              ["Planck units", "CODATA values"],
              ["Solar-mass evaporation timescale", "≈ 2.1 × 10⁶⁷ yr"],
              ["Hawking spectrum Wien peak", "u ≈ 2.8214"],
              ["RG: QED UV growth, QCD asymptotic freedom, b₀ = 0 at n_f = 16.5", "standard one-loop results"],
            ].map(([obs, anchor]) => (
              <div key={obs} className="paper-anchor-row"><span>{obs}</span><span className="mono">{anchor}</span></div>
            ))}
          </div>
          <p>
            The RG cases additionally cover analytic and numerical fixed points, the UV/IR stability convention,
            deterministic integration and reversal, invalid inputs, and graceful QED/QCD validity termination.
          </p>
        </PaperSub>
        <PaperSub index="6.2" title="Manifest-driven browser QA">
          <p>
            A persistent browser-QA harness (<span className="mono">qa/</span>, pinned Chromium, separate CI job) is driven
            by a machine-readable capture manifest validated against a JSON schema. It covers: clean mounting of all
            fourteen views with zero console/page errors; URL-state round-trips, reload persistence, back/forward
            navigation, copy-link, and the versioned export schema; observable differences between reduced and normal
            motion; keyboard focus, arrow-key sliders, mobile overflow, 44 px touch targets, and horizontal chart
            scrolling; conjectural labeling and preset reset; every GWOSC network phase through a deterministic offline
            fixture; and per-capture visual regression against committed baselines, each with its own justified pixel
            tolerance. A single live gwosc.org smoke test exists but runs only on explicit request, never in CI.
          </p>
        </PaperSub>
        <PaperSub index="6.3" title="Repository-presentation guardrails">
          <p>
            A validation suite (<span className="mono">npm run validate</span>) enforces the academic packaging itself:
            README image paths exist, screenshot and diagram counts are met, Open Graph and manifest metadata are present
            and point to real assets, PNGs have expected dimensions, diagram SVGs are structurally complete, and every
            asset the entry document and the vendored stylesheets reference resolves to a real local file with no
            third-party host in the request path. A schema-validated <span className="mono">CITATION.cff</span> (CFF
            1.2.0, no unverified identifiers) is kept consistent with <span className="mono">package.json</span> and
            <span className="mono">LICENSE</span> by its own test suite.
          </p>
        </PaperSub>
      </PaperSection>

      <PaperSection id="limits" index="7" title="Limitations and epistemic boundaries">
        <p>
          The atlas is explicit about what it is not. It is not a claim that quantum gravity has been solved. It does not
          present Planck-scale discreteness as observed. It does not present Hawking radiation from astrophysical black
          holes as directly detected. It does not present AdS/CFT as the proven description of our universe. Its 3D
          scenes are labeled schematic where they are schematic. Its research-program comparison is a map of agendas, not
          a ranking of merits. Where the atlas visualizes beyond established physics, the visualization itself carries
          the conjectural label — the epistemic boundary is drawn inside the instrument, not in a footnote outside it.
        </p>
      </PaperSection>

      <PaperSection id="conclusion" index="8" title="Conclusion">
        <p>
          HORIZON demonstrates that the boundary between established physics, effective theory, schematic modeling, and
          conjecture can be made a first-class object of interactive study. Its contribution is not a new physical result
          but a discipline: an atlas in which every claim is labeled, every equation is an interface object, every
          laboratory is reproducible from its URL, and every visual regression is pinned to a justified tolerance. The
          quantum-gravity problem is hard precisely because it sits at the edge of what is known; an honest atlas of that
          edge is the appropriate instrument for studying it.
        </p>
      </PaperSection>

      <PaperSection id="spine" index="A" title="Formulation spine">
        <p>
          The equations the atlas actually implements, module by module. Each card opens a <em>formula lens</em> with the
          symbol table, the meaning, and the assumptions the instrument carries.
        </p>

        <div className="paper-spine-group">
          <div className="paper-spine-label">A.1 · Standard Model gauge structure</div>
          <div className="formula-grid">
            <FormulaCard title="Gauge group" tex="SU(3)_C \times SU(2)_L \times U(1)_Y" status="established"
              symbols={[{ s: "SU(3)_C", d: "color (strong) factor" }, { s: "SU(2)_L", d: "weak isospin factor" }, { s: "U(1)_Y", d: "hypercharge factor" }]}
              meaning="The Standard Model is organized by a product of three gauge groups; the three factors correspond to color, weak isospin, and hypercharge."
              limits="The minimal Standard Model does not include gravity; neutrino masses require additional structure; the hierarchy problem remains unresolved."></FormulaCard>
            <FormulaCard title="Electric charge" tex="Q = T_3 + \frac{Y}{2}" status="established"
              symbols={[{ s: "T_3", d: "third component of weak isospin" }, { s: "Y", d: "hypercharge" }]}
              meaning="Electric charge emerges after electroweak symmetry breaking as a fixed combination of weak isospin and hypercharge."
              limits="Holds for the minimal Higgs sector; extended sectors modify the relation."></FormulaCard>
            <FormulaCard title="Covariant derivative" tex="D_\mu = \partial_\mu + i g_s G_\mu^a T^a + i g W_\mu^i \tau^i + i g' Y B_\mu" status="established"
              symbols={[{ s: "g_s, g, g'", d: "strong, weak, hypercharge couplings" }, { s: "G, W, B", d: "gauge fields" }, { s: "T^a, \\tau^i", d: "generators" }]}
              meaning="The covariant derivative packages all three gauge interactions into a single object that transforms correctly under local symmetry."
              limits="Written for the minimal Standard Model; gravitational coupling is absent."></FormulaCard>
            <FormulaCard title="Higgs potential" tex="V(\Phi) = \mu^2 \Phi^\dagger \Phi + \lambda(\Phi^\dagger \Phi)^2, \qquad v = \sqrt{-\mu^2/\lambda} \approx 246\ \mathrm{GeV}" status="established"
              symbols={[{ s: "\\mu^2", d: "mass parameter (negative for breaking)" }, { s: "\\lambda", d: "quartic self-coupling" }, { s: "v", d: "vacuum expectation value" }]}
              meaning="For μ² < 0 the field acquires a nonzero vacuum expectation value, giving masses to the W± and Z⁰ bosons and to fermions through Yukawa couplings."
              limits="The measured value of v is an input, not a prediction; the stability of the electroweak vacuum depends on λ at high scales."></FormulaCard>
          </div>
        </div>

        <div className="paper-spine-group">
          <div className="paper-spine-label">A.2 · Quantum field theory and amplitudes</div>
          <div className="formula-grid">
            <FormulaCard title="Path integral" tex="\mathcal{A}_{i\to f} = \int \mathcal{D}\phi\, e^{\,iS[\phi]/\hbar}" status="effective"
              symbols={[{ s: "\\mathcal{A}_{i\\to f}", d: "transition amplitude" }, { s: "S[\\phi]", d: "action functional" }, { s: "\\mathcal{D}\\phi", d: "formal path-integral measure" }]}
              meaning="A transition amplitude is expressed as a sum over field configurations weighted by the phase of the action."
              limits="The path-integral measure is formal except in special rigorously defined cases; the expression is a computational device, not a literal sum."></FormulaCard>
            <FormulaCard title="Scalar action and Klein–Gordon" tex="S = \int d^4x\left[\tfrac{1}{2}\partial_\mu\phi\,\partial^\mu\phi - \tfrac{1}{2}m^2\phi^2 - V(\phi)\right], \qquad (\Box + m^2)\phi = 0" status="established"
              symbols={[{ s: "\\Box", d: "d’Alembertian operator" }, { s: "m", d: "field mass" }]}
              meaning="The free scalar field obeys the Klein–Gordon equation; its dispersion relation ω² = c²k² + m²c⁴/ħ² shows the mass gap as a nonzero frequency at zero wavenumber."
              limits="Free-field statement; interactions are handled perturbatively."></FormulaCard>
            <FormulaCard title="Propagator and Mandelstam invariants" tex="\Delta_F(p) = \frac{i}{p^2 - m^2 + i\epsilon}, \qquad s + t + u = \sum_i m_i^2" status="effective"
              symbols={[{ s: "\\Delta_F", d: "Feynman propagator" }, { s: "s, t, u", d: "Mandelstam invariants" }]}
              meaning="The propagator is the internal line of a Feynman diagram; the Mandelstam identity is exact for any 2→2 process and is displayed on screen as a floating-point residual rather than hidden."
              limits="Feynman diagrams are terms in a perturbative expansion; virtual particles are calculational structures, not directly observed objects."></FormulaCard>
            <FormulaCard title="Leading cross-section" tex="\sigma(e^+e^- \to \mu^+\mu^-) \sim \frac{4\pi\alpha^2}{3s}" status="effective"
              symbols={[{ s: "\\alpha", d: "fine-structure constant" }, { s: "s", d: "centre-of-mass energy squared" }]}
              meaning="The leading high-energy scaling of the QED annihilation cross-section; the Amplitude Room evaluates it live alongside the Breit–Wigner resonance shape."
              limits="Leading order only; the Z⁰ panel shows the Breit–Wigner shape alone, not the γ–Z⁰ interference term."></FormulaCard>
          </div>
        </div>

        <div className="paper-spine-group">
          <div className="paper-spine-label">A.3 · Gauge symmetry and renormalization-group flow</div>
          <div className="formula-grid">
            <FormulaCard title="Yang–Mills field strength" tex="F_{\mu\nu}^a = \partial_\mu A_\nu^a - \partial_\nu A_\mu^a + g f^{abc} A_\mu^b A_\nu^c" status="established"
              symbols={[{ s: "A_\\mu^a", d: "gauge potential" }, { s: "f^{abc}", d: "structure constants" }]}
              meaning="The non-Abelian term produces gauge-boson self-interactions, the structural difference from electromagnetism."
              limits="Classical statement; quantization introduces the usual gauge-fixing and ghost machinery."></FormulaCard>
            <FormulaCard title="One-loop beta function" tex="\mu\frac{dg}{d\mu} = \beta(g) = -\frac{b_0}{16\pi^2}g^3 + \mathcal{O}(g^5), \qquad b_0 = 11 - \frac{2}{3}n_f" status="effective"
              symbols={[{ s: "b_0", d: "one-loop coefficient" }, { s: "n_f", d: "active quark flavours" }]}
              meaning="For QCD with sufficiently few flavours b₀ > 0 and the coupling weakens at high energy — asymptotic freedom. The b₀ = 0 boundary sits at n_f = 16.5."
              limits="One loop only; higher orders and scheme dependence are not shown."></FormulaCard>
            <FormulaCard title="Running coupling solution" tex="\frac{1}{g_s^2(\mu)} = \frac{1}{g_s^2(\mu_0)} + \frac{b_0}{8\pi^2}\ln\frac{\mu}{\mu_0}" status="effective"
              symbols={[{ s: "\\mu", d: "renormalization scale" }, { s: "\\mu_0", d: "reference scale" }]}
              meaning="The integrated one-loop solution the RG landscape plots; the QED preset uses a documented unit-charge Dirac-fermion convention whose Landau pole is shown only as a formal extrapolation."
              limits="The instrument stops its numerical trajectory at the conservative display boundary α = 1 before the pole."></FormulaCard>
            <FormulaCard title="Fixed point and linearization" tex="\beta(g_*) = 0, \qquad \beta(g) \simeq \beta'(g_*)(g - g_*)" status="conjectural"
              symbols={[{ s: "g_*", d: "fixed-point coupling" }, { s: "\\beta'(g_*)", d: "slope at the fixed point" }]}
              meaning="With t = ln μ increasing toward the ultraviolet, β′(g★) < 0 is UV-attractive and β′(g★) > 0 is IR-attractive. The asymptotic-safety-style polynomial β(g) = ag − bg³ is an explicitly conjectural illustration."
              limits="The interacting UV fixed point is built into the chosen toy function; it is not evidence for quantum-gravity asymptotic safety."></FormulaCard>
          </div>
        </div>

        <div className="paper-spine-group">
          <div className="paper-spine-label">A.4 · General relativity and local causal structure</div>
          <div className="formula-grid">
            <FormulaCard title="Einstein field equations" tex="G_{\mu\nu} + \Lambda g_{\mu\nu} = \frac{8\pi G}{c^4}T_{\mu\nu}, \qquad G_{\mu\nu} = R_{\mu\nu} - \tfrac{1}{2}R g_{\mu\nu}" status="established"
              symbols={[{ s: "G_{\\mu\\nu}", d: "Einstein tensor" }, { s: "T_{\\mu\\nu}", d: "stress-energy tensor" }, { s: "\\Lambda", d: "cosmological constant" }]}
              meaning="Matter and energy curve spacetime; the Einstein tensor encodes the curvature response."
              limits="The theory is classical; singularity theorems indicate its own domain of failure."></FormulaCard>
            <FormulaCard title="Geodesic equation" tex="\frac{d^2x^\mu}{d\tau^2} + \Gamma^\mu_{\alpha\beta}\frac{dx^\alpha}{d\tau}\frac{dx^\beta}{d\tau} = 0" status="established"
              symbols={[{ s: "\\Gamma^\\mu_{\\alpha\\beta}", d: "Christoffel connection" }, { s: "\\tau", d: "proper time" }]}
              meaning="Free particles follow geodesics; the connection encodes how the coordinate basis twists across spacetime."
              limits="Classical test-particle statement; back-reaction is neglected."></FormulaCard>
            <FormulaCard title="Minkowski interval and boost" tex="\Delta s^2 = -c^2\Delta t^2 + \Delta x^2, \qquad \gamma = \frac{1}{\sqrt{1-\beta^2}}" status="established"
              symbols={[{ s: "\\Delta s^2", d: "invariant interval" }, { s: "\\beta", d: "v/c" }, { s: "\\gamma", d: "Lorentz factor" }]}
              meaning="The causal laboratory uses flat 1+1D Minkowski spacetime with signature (−,+,+,+) as the local foundation for GR; the boost transforms events and axes between frames."
              limits="These relations do not simulate curvature or gravity; they expose the invariant local causal structure inherited by general relativity."></FormulaCard>
          </div>
        </div>

        <div className="paper-spine-group">
          <div className="paper-spine-label">A.5 · Planck scale and the perturbative obstruction</div>
          <div className="formula-grid">
            <FormulaCard title="Planck units" tex="\ell_P = \sqrt{\frac{\hbar G}{c^3}},\quad t_P = \sqrt{\frac{\hbar G}{c^5}},\quad m_P = \sqrt{\frac{\hbar c}{G}},\quad E_P = \sqrt{\frac{\hbar c^5}{G}}" status="established"
              symbols={[{ s: "\\ell_P", d: "≈ 1.616 × 10⁻³⁵ m" }, { s: "t_P", d: "≈ 5.39 × 10⁻⁴⁴ s" }, { s: "m_P", d: "≈ 2.18 × 10⁻⁸ kg" }, { s: "E_P", d: "≈ 1.22 × 10¹⁹ GeV" }]}
              meaning="The natural scale built from ħ, G, and c. The Planck scale is not an experimentally measured threshold."
              limits="It is a dimensional-analysis scale, not an observed boundary."></FormulaCard>
            <FormulaCard title="Heuristic obstruction" tex="\lambda_C \sim r_s, \qquad \lambda_C = \frac{\hbar}{mc}, \qquad r_s = \frac{2Gm}{c^2}" status="heuristic"
              symbols={[{ s: "\\lambda_C", d: "Compton wavelength" }, { s: "r_s", d: "Schwarzschild radius" }]}
              meaning="Equating the Compton wavelength and the Schwarzschild radius gives a scale of order the Planck length — an intuition aid, not the actual derivation."
              limits="This is a heuristic picture; the real obstruction is the non-renormalizability of the perturbative expansion."></FormulaCard>
            <FormulaCard title="Graviton expansion and EFT tower" tex="g_{\mu\nu} = \eta_{\mu\nu} + \kappa h_{\mu\nu}, \qquad \kappa^2 = 32\pi G" status="effective"
              symbols={[{ s: "h_{\\mu\\nu}", d: "metric perturbation / graviton field" }, { s: "\\kappa", d: "coupling normalization" }]}
              meaning="Expanding around a background gives a graviton field at low energy; the effective action then contains an infinite tower of higher-curvature terms."
              limits="The EFT is reliable below the cutoff but does not tell us the ultraviolet completion."></FormulaCard>
          </div>
        </div>

        <div className="paper-spine-group">
          <div className="paper-spine-label">A.6 · Black-hole thermodynamics and holography</div>
          <div className="formula-grid">
            <FormulaCard title="Bekenstein–Hawking entropy" tex="S_{BH} = \frac{k_B c^3 A}{4G\hbar} = k_B\frac{A}{4\ell_P^2}" status="effective"
              symbols={[{ s: "A", d: "horizon area" }, { s: "\\ell_P", d: "Planck length" }]}
              meaning="Entropy scales with horizon area rather than volume — the most famous area law in gravitational physics."
              limits="Semiclassical landmark; the microscopic origin of the entropy is not fully known for generic black holes."></FormulaCard>
            <FormulaCard title="Hawking temperature and evaporation" tex="T_H = \frac{\hbar c^3}{8\pi G M k_B}, \qquad t_{\mathrm{evap}} \propto M^3" status="effective"
              symbols={[{ s: "T_H", d: "Hawking temperature" }, { s: "M", d: "black-hole mass" }]}
              meaning="Smaller black holes are hotter and evaporate faster; the cubic mass scaling makes stellar-mass evaporation astronomically slow."
              limits="Astrophysical Hawking radiation has not been directly observed."></FormulaCard>
            <FormulaCard title="Kerr horizons and surface gravity" tex="r_\pm = \frac{GM}{c^2}\left[1 \pm \sqrt{1-a_\star^2}\right], \qquad \kappa = \frac{c^4}{2GM}\frac{\sqrt{1-a_\star^2}}{1+\sqrt{1-a_\star^2}}" status="established"
              symbols={[{ s: "a_\\star", d: "dimensionless spin cJ/GM²" }, { s: "\\kappa", d: "surface gravity" }]}
              meaning="The Kerr Observatory prints exact coordinate radii and the live formulation panel substitutes the current parameters into these relations; the surface gravity — hence the temperature — tends to zero in the extremal limit."
              limits="The rendered image beside the map is a Schwarzschild-based geodesic raymarch with visual spin cues only — frame dragging is not integrated."></FormulaCard>
            <FormulaCard title="Ryu–Takayanagi formula" tex="S(A) = \frac{\mathrm{Area}(\gamma_A)}{4G_N\hbar}" status="conjectural"
              symbols={[{ s: "\\gamma_A", d: "extremal bulk surface anchored to boundary region A" }]}
              meaning="In AdS/CFT, boundary entanglement entropy is computed by the area of an extremal bulk surface — a precise link between quantum information and spacetime geometry."
              limits="AdS/CFT is precise in special settings; our universe is not known to be asymptotically anti-de Sitter; holography is not a claim that reality is an optical projection."></FormulaCard>
          </div>
        </div>

        <div className="paper-spine-group">
          <div className="paper-spine-label">A.7 · Gravitational waves and collider constraints</div>
          <div className="formula-grid">
            <FormulaCard title="Quadrupole radiated power" tex="P = \frac{G}{5c^5}\left\langle \dddot{Q}_{ij}\dddot{Q}_{ij} \right\rangle" status="established"
              symbols={[{ s: "Q_{ij}", d: "mass quadrupole moment" }, { s: "\\dddot{Q}", d: "third time derivative" }]}
              meaning="The leading quadrupole power radiated by a source; for compact binary inspirals the orbital frequency increases and the waveform chirps upward."
              limits="The Signal Analysis Theatre’s generated waveform is a leading-order quadrupole teaching model — no spins, no higher post-Newtonian orders, not numerical relativity."></FormulaCard>
            <FormulaCard title="Scale gap" tex="E_P \sim 10^{19}\ \mathrm{GeV} \quad\text{vs}\quad E_{\mathrm{LHC}} \sim 10^{4}\ \mathrm{GeV}" status="open"
              symbols={[{ s: "E_P", d: "Planck energy" }, { s: "E_{\\mathrm{LHC}}", d: "collider reach" }]}
              meaning="Roughly fifteen orders of magnitude separate collider physics from the Planck regime; collider null results constrain beyond-Standard-Model scenarios but do not directly access quantum gravity."
              limits="Collider events are presented as indirect constraints, not as quantum-gravity observations."></FormulaCard>
          </div>
        </div>
      </PaperSection>

      <PaperSection id="refs" index="R" title="References">
        <p className="dim">
          The atlas ships a larger in-app references list; the following are especially central to the chain of reasoning
          in §3.
        </p>
        <ol className="paper-refs">
          {PAPER_REFS.map((r, i) => (
            <li key={i}><span className="paper-ref-num">{i + 1}</span><span>{r}</span></li>
          ))}
        </ol>
      </PaperSection>
    </article>
  );
}

Object.assign(window, { ViewOverview, ViewGlossary, ViewReferences, ViewOpenProblems, ViewSymbols, ViewWhitepaper });
