// extras.jsx — Overview, Glossary, References, Open Problems
function ViewOverview({ go }) {
  return (
    <article data-screen-label="Overview">
      <header style={{ minHeight: "62vh", display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 24 }}>
        <div className="module-kicker" style={{ fontSize: 12, letterSpacing: "0.34em" }}>HORIZON · Quantum Gravity Atlas</div>
        <h1 style={{ fontSize: "clamp(40px, 6.4vw, 76px)", lineHeight: 1.02, margin: "16px 0 18px 0", maxWidth: 900, letterSpacing: "-0.02em" }}>
          From particles<br></br>to spacetime.
        </h1>
        <p className="module-lede" style={{ fontSize: 19, maxWidth: 720 }}>
          A cinematic, interactive map of modern physics — eight modules tracing the path from the Standard Model to
          the open frontier of quantum gravity, with rigorous explanation, real-time 3D simulation, and an honest
          accounting of what is established, what is effective, and what remains conjecture.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginTop: 22 }}>
          <button className="bridge-go" style={{ fontSize: 14.5, padding: "13px 22px" }} onClick={() => go("sm")}>
            Begin · Module 01 →
          </button>
          <button className="btn" onClick={() => go("bh")}>Jump to Black Holes</button>
          <span className="mono dim" style={{ fontSize: 11, letterSpacing: "0.14em" }}>8 MODULES · INTERACTIVE 3D · LIVE FORMULAS</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 26 }}>
          <Badge kind="established"></Badge> <Badge kind="effective"></Badge> <Badge kind="conjectural"></Badge> <Badge kind="schematic"></Badge> <Badge kind="open"></Badge>
        </div>
      </header>
      <Section title="The eight modules">
        <div className="formula-grid">
          {QGA_MODULES.map((m) => (
            <button key={m.id} className="ov-card gauge-sector" style={{ "--sector-color": "var(--acc)", position: "relative", overflow: "hidden" }}
              onClick={() => go(m.id)}>
              <span aria-hidden="true" style={{ position: "absolute", right: 10, top: -14, fontFamily: "var(--font-head)", fontSize: 64, fontWeight: 700, color: "var(--head)", opacity: 0.05, lineHeight: 1 }}>{m.num}</span>
              <div className="gs-name" style={{ color: "var(--acc)" }}>Module {m.num}</div>
              <div className="gs-group" style={{ fontSize: 17, marginTop: 4 }}>{m.title}</div>
              <p className="small dim" style={{ margin: "8px 0 0 0" }}>{MODULE_BLURBS[m.id]}</p>
            </button>
          ))}
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
          Every symbol the atlas uses — its meaning, its unit, its home module, and the contexts where the same
          letter means something different. Notation is a convention, not a truth: this page makes ours explicit.
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
              </button>
            ))}
          </div>
        </div>
        <p className="dim small" style={{ marginTop: 0 }}>
          {items.length} of {QGA_SYMBOLS.length} symbols · {ctxCount} contexts — same letters, different physics.
        </p>
        <div className="formula-grid sym-grid">
          {items.map((s) => (
            <div key={s.sym} className="sym-card">
              <div className="sym-head">
                <span className="sym-glyph">{s.sym}</span>
                <span className="sym-cat">{s.cat}</span>
              </div>
              {s.contexts.map((c, i) => (
                <div key={i} className="sym-ctx">
                  <div className="sym-ctx-label">{c.ctx}</div>
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
        <div className="panel" style={{ marginTop: 26 }}>
          <div className="gloss-sub">Conventions used throughout the atlas</div>
          <div className="sym-conv-grid">
            {QGA_CONVENTIONS.map((c) => (
              <div key={c.title} className="sym-conv">
                <div className="sym-conv-title">{c.title}</div>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

Object.assign(window, { ViewOverview, ViewGlossary, ViewReferences, ViewOpenProblems, ViewSymbols });
