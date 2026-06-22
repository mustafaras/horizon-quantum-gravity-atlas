// app.jsx — HORIZON · Quantum Gravity Atlas application shell

/* ---------- brand logomark (event-horizon glyph) ---------- */
function HorizonMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="18" stroke="var(--acc)" strokeWidth="0.8" opacity="0.28"></circle>
      <circle cx="20" cy="20" r="12.5" stroke="var(--acc)" strokeWidth="1" opacity="0.55"></circle>
      <circle cx="20" cy="20" r="6.6" fill="#02040a"></circle>
      <circle cx="20" cy="20" r="6.6" stroke="var(--gold)" strokeWidth="1.4"></circle>
      <circle cx="20" cy="20" r="6.6" stroke="var(--gold)" strokeWidth="3" opacity="0.18"></circle>
      <g className="bm-orbit">
        <circle cx="32.5" cy="20" r="2.1" fill="var(--acc)"></circle>
        <circle cx="7.5" cy="20" r="1.2" fill="#cfe0ff" opacity="0.7"></circle>
      </g>
    </svg>
  );
}

/* ---------- cinematic intro splash (once per session) ---------- */
function HorizonIntro() {
  const seen = (() => { try { return sessionStorage.getItem("horizon-intro") === "1"; } catch (e) { return false; } })();
  const [gone, setGone] = useState(seen);
  const [dismissing, setDismissing] = useState(false);
  useEffect(() => {
    if (seen) return;
    try { sessionStorage.setItem("horizon-intro", "1"); } catch (e) {}
    const t = setTimeout(() => setGone(true), 3000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line
  const skip = () => { setDismissing(true); setTimeout(() => setGone(true), 460); };
  if (gone) return null;
  return (
    <div className={"horizon-intro" + (dismissing ? " dismissed" : "")} onClick={skip}
      role="button" tabIndex={0} aria-label="Enter the atlas"
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " " || e.key === "Escape") skip(); }}>
      <HorizonMark className="intro-mark"></HorizonMark>
      <div className="intro-word" aria-label="HORIZON">
        {"HORIZON".split("").map((c, i) => (
          <span key={i} style={{ animationDelay: (0.35 + i * 0.07) + "s" }}>{c}</span>
        ))}
      </div>
      <div className="intro-line"></div>
      <div className="intro-tag">Quantum Gravity Atlas</div>
      <div className="intro-skip">Click to enter</div>
    </div>
  );
}

const QGA_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#54aeff",
  "starfield": true,
  "uiScale": 15.5,
  "vizMode": "cinematic",
  "motion": "balanced",
  "detail3d": "medium",
  "labels3d": true,
  "annotations3d": true,
  "pathway": "student"
}/*EDITMODE-END*/;

const QGA_VIEWS = {
  overview: { label: "Atlas overview", comp: () => window.ViewOverview },
  sm: { comp: () => window.ModuleSM },
  qft: { comp: () => window.ModuleQFT },
  rg: { comp: () => window.ModuleRG },
  gr: { comp: () => window.ModuleGR },
  planck: { comp: () => window.ModulePlanck },
  approaches: { comp: () => window.ModuleApproaches },
  bh: { comp: () => window.ModuleBH },
  exp: { comp: () => window.ModuleExp },
  glossary: { label: "Glossary", comp: () => window.ViewGlossary },
  refs: { label: "References", comp: () => window.ViewReferences },
  open: { label: "Open Problems", comp: () => window.ViewOpenProblems },
};

// per-module background tint (hsl hue) — drives the cinematic scene change
const QGA_VIEW_HUE = {
  overview: 226, sm: 268, qft: 196, rg: 226, gr: 44,
  planck: 226, approaches: 282, bh: 36, exp: 196,
  glossary: 226, refs: 226, open: 226,
};

function NavList({ view, go }) {
  return (
    <div>
      <div className="nav-group-label">Modules</div>
      <button className={"nav-item" + (view === "overview" ? " active" : "")} onClick={() => go("overview")}>
        <span className="nav-num">◆</span> Atlas overview
      </button>
      {QGA_MODULES.map((m) => (
        <button key={m.id} className={"nav-item" + (view === m.id ? " active" : "")} onClick={() => go(m.id)}>
          <span className="nav-num">{m.num}</span> {m.short}
        </button>
      ))}
      <div className="nav-group-label">Reference</div>
      {["glossary", "refs", "open"].map((id) => (
        <button key={id} className={"nav-item" + (view === id ? " active" : "")} onClick={() => go(id)}>
          <span className="nav-num">·</span> {QGA_VIEWS[id].label}
        </button>
      ))}
    </div>
  );
}

function PathwaySelector({ value, onChange }) {
  return (
    <div className="pathway-box">
      <div className="pathway-label">Learning pathway</div>
      <div className="pathway-seg" role="radiogroup" aria-label="Learning pathway">
        {QGA_PATHWAYS.map((p) => (
          <button key={p.id} className={value === p.id ? "on" : ""} role="radio" aria-checked={value === p.id}
            title={p.blurb} onClick={() => onChange(p.id)}>{p.label}</button>
        ))}
      </div>
      <p className="small dim" style={{ margin: "8px 0 0 0", fontSize: 11, lineHeight: 1.5 }}>
        {QGA_PATHWAYS.find((p) => p.id === value).blurb}
      </p>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(QGA_TWEAK_DEFAULTS);
  const prm = usePRM();
  const [view, setView] = useState(() => {
    try {
      const v = localStorage.getItem("qga-view");
      return v && QGA_VIEWS[v] ? v : "overview";
    } catch (e) { return "overview"; }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const contentRef = useRef(null);

  const go = (id) => {
    setView(id);
    setMenuOpen(false);
    try { localStorage.setItem("qga-view", id); } catch (e) {}
    if (contentRef.current) contentRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
  };

  // settings derived from tweaks (system reduced-motion always wins)
  const effMotion = prm ? "reduced" : t.motion;
  const settings = useMemo(() => ({
    vizMode: t.vizMode, motion: effMotion, detail3d: t.detail3d,
    labels3d: !!t.labels3d, annotations3d: !!t.annotations3d, pathway: t.pathway,
  }), [t.vizMode, effMotion, t.detail3d, t.labels3d, t.annotations3d, t.pathway]);

  // apply tweaks to CSS custom properties + motion attribute
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--acc", t.accent);
    root.style.setProperty("--acc-soft", t.accent + "24");
    root.style.setProperty("font-size", t.uiScale + "px");
    document.body.style.fontSize = t.uiScale + "px";
    root.setAttribute("data-motion", effMotion);
  }, [t.accent, t.uiScale, effMotion]);

  const starfieldOn = !!t.starfield && t.vizMode !== "minimal";
  const motionScale = effMotion === "reduced" ? 0 : effMotion === "balanced" ? 0.55 : 1;

  const Comp = QGA_VIEWS[view].comp();
  return (
    <AtlasSettingsContext.Provider value={settings}>
      <HorizonIntro></HorizonIntro>
      {starfieldOn
        ? <AtlasStage view={view} motion={effMotion} detail={t.detail3d} enabled={true}></AtlasStage>
        : <Starfield enabled={false}></Starfield>}
      <div className="shell">
        <nav className="sidebar" aria-label="Module navigation">
          <div className="brand">
            <HorizonMark className="brand-mark"></HorizonMark>
            <div className="brand-words">
              <div className="brand-title">HORIZON</div>
              <div className="brand-sub">Quantum Gravity Atlas</div>
            </div>
          </div>
          <NavList view={view} go={go}></NavList>
          <PathwaySelector value={t.pathway} onChange={(v) => setTweak("pathway", v)}></PathwaySelector>
          <div className="sidebar-foot">
            Scientific status labels mark every claim.<br></br>
            No quantum gravity theory is experimentally confirmed.
          </div>
        </nav>
        <div className="topbar">
          <span className="topbar-title">HORIZON</span>
          <button className="menu-btn" onClick={() => setMenuOpen(true)}>MODULES ☰</button>
        </div>
        <main className="content" ref={contentRef}>
          <div className="content-inner" key={view}>
            {Comp ? <Comp go={go}></Comp> : <p className="dim">Loading module…</p>}
          </div>
        </main>
      </div>
      {menuOpen ? (
        <div className="mobile-menu" role="dialog" aria-label="Navigation menu">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span className="brand-title" style={{ fontFamily: "var(--font-head)", color: "var(--head)", fontWeight: 700, letterSpacing: "0.2em" }}>HORIZON</span>
            <button className="menu-btn" onClick={() => setMenuOpen(false)}>CLOSE ✕</button>
          </div>
          <NavList view={view} go={go}></NavList>
          <PathwaySelector value={t.pathway} onChange={(v) => setTweak("pathway", v)}></PathwaySelector>
        </div>
      ) : null}
      <TweaksPanel>
        <TweakSection label="Visualization"></TweakSection>
        <TweakRadio label="Mode" value={t.vizMode}
          options={["scientific", "cinematic", "minimal"]}
          onChange={(v) => setTweak("vizMode", v)}></TweakRadio>
        <TweakRadio label="Motion" value={t.motion}
          options={["reduced", "balanced", "full"]}
          onChange={(v) => setTweak("motion", v)}></TweakRadio>
        <TweakRadio label="3D detail" value={t.detail3d}
          options={["low", "medium", "ultra"]}
          onChange={(v) => setTweak("detail3d", v)}></TweakRadio>
        <TweakToggle label="3D labels" value={t.labels3d}
          onChange={(v) => setTweak("labels3d", v)}></TweakToggle>
        <TweakToggle label="Annotations" value={t.annotations3d}
          onChange={(v) => setTweak("annotations3d", v)}></TweakToggle>
        <TweakSection label="Learning"></TweakSection>
        <TweakRadio label="Pathway" value={t.pathway}
          options={["beginner", "student", "advanced"]}
          onChange={(v) => setTweak("pathway", v)}></TweakRadio>
        <TweakSection label="Theme"></TweakSection>
        <TweakColor label="Accent" value={t.accent}
          options={["#54aeff", "#46d4e0", "#ff7b72", "#ffb454"]}
          onChange={(v) => setTweak("accent", v)}></TweakColor>
        <TweakToggle label="Ambient starfield" value={t.starfield}
          onChange={(v) => setTweak("starfield", v)}></TweakToggle>
        <TweakSection label="Reading"></TweakSection>
        <TweakSlider label="Base text size" value={t.uiScale} min={13.5} max={18} step={0.5} unit="px"
          onChange={(v) => setTweak("uiScale", v)}></TweakSlider>
      </TweaksPanel>
    </AtlasSettingsContext.Provider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App></App>);
