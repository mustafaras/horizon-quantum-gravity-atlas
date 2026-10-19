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
  "renderBackend": "auto",
  "toneMapping": "agx",
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
  symbols: { label: "Symbol Atlas", comp: () => window.ViewSymbols },
  refs: { label: "References", comp: () => window.ViewReferences },
  open: { label: "Open Problems", comp: () => window.ViewOpenProblems },
  paper: { label: "Whitepaper", comp: () => window.ViewWhitepaper },
  compare: { label: "Compare", comp: () => window.CompareView },
};

// per-module background tint (hsl hue) — drives the cinematic scene change
const QGA_VIEW_HUE = {
  overview: 226, sm: 268, qft: 196, rg: 226, gr: 44,
  planck: 226, approaches: 282, bh: 36, exp: 196,
  glossary: 226, symbols: 226, refs: 226, open: 226, paper: 226, compare: 210,
};

const QGA_STATE_DEFAULTS = window.QGA_DEFAULT_STATE || {
  view: "overview", pathway: "student", bhMass: 1, bhSpin: 0,
  gwMode: "generated", gwEvent: "GW150914", gwDetector: "H1",
  gwStart: 1126259446, gwDuration: 16, seed: 42,
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
      {["glossary", "symbols", "refs", "open", "paper"].map((id) => (
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

function RenderDiagnosticsDrawer() {
  const [entries, setEntries] = useState(() => QGA_RENDER.renderDiagnostics.snapshot());
  useEffect(() => QGA_RENDER.renderDiagnostics.subscribe(() => setEntries(QGA_RENDER.renderDiagnostics.snapshot())), []);
  return <details className="render-diagnostics">
    <summary>Developer rendering diagnostics</summary>
    <p className="small dim">Actual initialized backends and effects. Adaptive budgets change rendering only, not scientific state.</p>
    {entries.map((entry) => <section key={entry.id} className="render-diagnostic-entry">
      <h3>{entry.label}</h3>
      <p className="mono small">{entry.phase} · {entry.backend} / {entry.capabilities?.rendererPath || "pending"} ·
        {" "}{entry.fps ? entry.fps.toFixed(1) + " FPS" : "FPS not sampled"} · DPR {entry.dpr?.toFixed(2) || "—"}</p>
      {entry.quality ? <p className="small">Particles ≤ {entry.quality.particleBudget}; temporal budget gate {entry.quality.temporalSamples} (TRAA uses fixed 32-position jitter);
        {" "}volumetric budget {entry.quality.raySteps} (used only by opt-in visual effects).</p> : null}
      <ul>{entry.effects.map((effect) => <li key={effect.name}>{effect.name}: <strong>{effect.status}</strong>{effect.reason ? " — " + effect.reason : ""}</li>)}</ul>
      {entry.messages.map((message, i) => <p className="small" key={i}>{message}</p>)}
    </section>)}
  </details>;
}

function RenderSetting({ label, value, options, onChange }) {
  return <label className="twk-row">
    <span className="twk-lbl">{label}</span>
    <select className="twk-field render-select" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>;
}

/* ---------- cinematic tour bar (Prompt 09) ----------
   Visible transport for the camera director: play/pause, shot progress,
   chapter title, and an explicit take-control switch. User orbit/pan/zoom
   on any flagship scene pauses automation immediately (Scene3D notifies
   the director), and this bar reflects it. Under reduced motion the tour
   does not interpolate the camera: play is disabled and only explicit
   deep links / scroll place the camera instantly. */
function CinemaBar({ reducedMotion }) {
  const C = window.QGA_CINEMATIC;
  const [st, setSt] = useState(() => (C ? C.state : null));
  const [progress, setProgress] = useState(0);
  useEffect(() => (C ? C.subscribe(setSt) : undefined), []); // eslint-disable-line
  const playing = !!(st && st.playing);
  useEffect(() => {
    if (!C || !st || !st.hasBar) return undefined;
    const id = setInterval(() => setProgress(C.progress()), 200);
    return () => clearInterval(id);
  }, [C, st && st.hasBar, playing]); // eslint-disable-line
  if (!C || !st || !st.hasBar || !st.shot) return null;
  const shot = st.shot;
  const p = playing ? progress : st.progress;
  const pct = Math.round(Math.min(1, Math.max(0, p)) * 100);
  const userInControl = st.control === "user";
  return (
    <div className="cinema-bar" role="group" aria-label="Cinematic tour">
      <button className="btn cinema-play" aria-pressed={playing}
        disabled={reducedMotion}
        title={reducedMotion ? "Camera interpolation is disabled under reduced motion" : (playing ? "Pause the tour" : "Play the tour")}
        onClick={() => C.toggle()}>{playing ? "❚❚" : "▶"}</button>
      <div className="cinema-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={pct} aria-label="Shot progress">
        <div className="cinema-progress-fill" style={{ transform: "scaleX(" + (pct / 100) + ")" }}></div>
      </div>
      <div className="cinema-title" aria-live="polite">
        <span className="cinema-chapter">{shot.chapter}</span>
        <span className="cinema-shot-title">{shot.title}</span>
        {shot.annotations && shot.annotations.length
          ? <span className="cinema-annot">{shot.annotations.join(" · ")}</span> : null}
      </div>
      <button className="btn cinema-control" aria-pressed={userInControl}
        title={userInControl ? "Hand the camera back to the tour" : "Pause automation; the camera is yours"}
        onClick={() => (userInControl ? C.releaseControl() : C.takeControl())}>
        {userInControl ? "Resume tour" : "Take control"}
      </button>
    </div>
  );
}

function TransitionNotice() {
  const C = window.QGA_CINEMATIC;
  const [error, setError] = useState(null);
  const [dismissedFor, setDismissedFor] = useState(null);
  useEffect(() => (C ? C.subscribe((s) => setError(s.transitionError)) : undefined), []); // eslint-disable-line
  if (!C || !error || dismissedFor === error) return null;
  return (
    <div className="cinema-notice" role="alert">
      <span>
        Cinematic transitions are running in crossfade mode: {error}
      </span>
      <button className="btn cinema-notice-close" aria-label="Dismiss transition notice"
        onClick={() => setDismissedFor(error)}>Dismiss</button>
    </div>
  );
}

function App() {  const [t, setTweak] = useTweaks(QGA_TWEAK_DEFAULTS);
  const prm = usePRM();
  const [atlasState, setAtlasState] = useQGAState();
  // Prompt 10 compare embeds: #embed-A / #embed-B renders the minimal shell
  // (no sidebar/topbar/intro/tweaks) and answers the compare controller.
  const embedRole = window.location.hash === "#embed-A" ? "A"
    : window.location.hash === "#embed-B" ? "B" : null;
  const embed = embedRole != null;
  const [view, setView] = useState(() => {
    try {
      const v = qgaReadState().view;
      return v && QGA_VIEWS[v] ? v : "overview";
    } catch (e) { return "overview"; }
  });
  const stateView = atlasState.view;
  useEffect(() => { if (stateView !== view) setView(stateView); }, [stateView]); // eslint-disable-line
  const [menuOpen, setMenuOpen] = useState(false);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const contentRef = useRef(null);
  const openRenderingSettings = () => window.postMessage({ type: "__activate_edit_mode" }, location.origin);
  // Formula linking + palette navigation read the live view id.
  useEffect(() => { window.__qgaCurrentView = view; }, [view]);
  // Palette action hook: "Save snapshot" opens this panel from ⌘K.
  useEffect(() => {
    window.QGA_OPEN_SNAPSHOTS = () => setSnapshotsOpen(true);
    return () => { if (window.QGA_OPEN_SNAPSHOTS) delete window.QGA_OPEN_SNAPSHOTS; };
  }, []);

  // ---- cinematic direction (Prompt 09) ----
  const shotRef = useRef(atlasState.shot); shotRef.current = atlasState.shot;
  useEffect(() => {
    const C = window.QGA_CINEMATIC;
    if (!C) return undefined;
    C.configure({ reducedMotion: prm, vizMode: t.vizMode });
    // Deep-linked shots place the camera at the shot start; nothing autoplays
    // (and this system never touches audio).
    C.setView(view, { shot: shotRef.current });
    C.refreshScroll();
    return undefined;
  }, [view, prm, t.vizMode]); // eslint-disable-line
  // Mirror the active shot into the URL (replaceState: no history spam), so
  // back navigation restores the exact view + shot pair. The guard compares
  // against the last requested id, not the URL: React batches the writes, so
  // the URL lags behind rapid shot transitions.
  useEffect(() => {
    const C = window.QGA_CINEMATIC;
    if (!C) return undefined;
    let pendingShot = null;
    return C.subscribe((s) => {
      const id = s.shot ? s.shot.id : "";
      if (id !== pendingShot) {
        pendingShot = id;
        setAtlasState({ shot: id }, { replace: true });
      }
    });
  }, []); // eslint-disable-line

  const go = (id) => {
    if (id !== view && window.QGA_CINEMATIC) window.QGA_CINEMATIC.runTransition();
    setView(id);
    setAtlasState({ view: id, shot: "" }, { replace: false });
    try { localStorage.setItem("qga-view", id); } catch (e) {}
    setMenuOpen(false);
    if (contentRef.current) contentRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
  };

  // Compare embed protocol: render-mode settings + silent state patches
  // (parameter tweens) + readiness announcement. The role itself is set at
  // script evaluation (child effects run before parent effects).
  useEffect(() => {
    if (!embed) return undefined;
    window.parent?.postMessage({ type: "qga-embed-ready", side: embedRole, view }, "*");
    const onMessage = (event) => {
      const data = event.data;
      if (!data || typeof data.type !== "string") return;
      if (data.type === "qga-embed-settings" && data.vizMode) setTweak("vizMode", data.vizMode);
      else if (data.type === "qga-state-patch" && data.patch) window.QGA_APPLY_SILENT?.(data.patch);
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [embed, embedRole, view, setTweak]);

  // settings derived from tweaks (system reduced-motion always wins)
  const effMotion = prm ? "reduced" : t.motion;
  const settings = useMemo(() => ({
    vizMode: t.vizMode, motion: effMotion, detail3d: t.detail3d,
    renderBackend: t.renderBackend || "auto", toneMapping: t.toneMapping || "agx",
    labels3d: !!t.labels3d, annotations3d: !!t.annotations3d, pathway: atlasState.pathway,
    hdrEnvironment: t.hdrEnvironment === true,
  }), [t.vizMode, effMotion, t.detail3d, t.renderBackend, t.toneMapping, t.labels3d, t.annotations3d, atlasState.pathway, t.hdrEnvironment]);

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

  // Compare embeds render the minimal shell: the view component only.
  if (embed) {
    return (
      <AtlasSettingsContext.Provider value={settings}>
        <main className="content embed-content">
          <div className="content-inner embed-inner" key={view}>
            {Comp ? <Comp go={go}></Comp> : <p className="dim">Loading module…</p>}
          </div>
        </main>
      </AtlasSettingsContext.Provider>
    );
  }

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
          <PathwaySelector value={atlasState.pathway} onChange={(v) => setAtlasState({ pathway: v }, { replace: false })}></PathwaySelector>
          <div className="sidebar-tools" aria-label="Atlas tools">
            <button className="sidebar-tool-btn" onClick={() => window.QGA_OPEN_PALETTE?.()}>
              <span aria-hidden="true">⌘</span> Search <kbd>⌘K</kbd>
            </button>
            <button className="sidebar-tool-btn" onClick={() => go("compare")} aria-label="Open the A/B compare view">⇄ Compare</button>
            <button className="sidebar-tool-btn" onClick={() => setSnapshotsOpen(true)} aria-label="Open the snapshots panel">◆ Snapshots</button>
            <button className="sidebar-tool-btn" onClick={() => window.QGA_ARM_ANNOTATION?.()} aria-label="Place an annotation pin on the current view">✎ Annotate</button>
          </div>
          <div className="sidebar-foot">
            Scientific status labels mark every claim.<br></br>
            No quantum gravity theory is experimentally confirmed.
            <button className="btn render-settings-btn" onClick={openRenderingSettings}>Rendering settings</button>
          </div>
        </nav>
        <div className="topbar">
          <span className="topbar-title">HORIZON</span>
          <button className="btn" onClick={() => window.QGA_OPEN_PALETTE?.()} aria-label="Open search and command palette">Search ⌘K</button>
          <button className="btn render-settings-btn" onClick={openRenderingSettings}>Rendering settings</button>
          <button className="btn" onClick={async () => { try { await QGA_COPY_LINK(qgaReadState()); } catch (e) {} }}>Copy link</button>
          <button className="btn" onClick={() => QGA_EXPORT_JSON(qgaReadState())}>Export JSON</button>
          <button className="menu-btn" onClick={() => setMenuOpen(true)}>MODULES ☰</button>
        </div>
        <main className="content" ref={contentRef}>
          <div className="content-inner" key={view}>
            {Comp ? <Comp go={go}></Comp> : <p className="dim">Loading module…</p>}
            <AnnotationLayer view={view}></AnnotationLayer>
          </div>
        </main>
      </div>
      <CinemaBar reducedMotion={prm}></CinemaBar>
      <TransitionNotice></TransitionNotice>
      {menuOpen ? (
        <div className="mobile-menu" role="dialog" aria-label="Navigation menu">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span className="brand-title" style={{ fontFamily: "var(--font-head)", color: "var(--head)", fontWeight: 700, letterSpacing: "0.2em" }}>HORIZON</span>
            <button className="menu-btn" onClick={() => setMenuOpen(false)}>CLOSE ✕</button>
          </div>
          <NavList view={view} go={go}></NavList>
          <PathwaySelector value={atlasState.pathway} onChange={(v) => setAtlasState({ pathway: v }, { replace: false })}></PathwaySelector>
        </div>
      ) : null}
      <CommandPalette go={go}></CommandPalette>
      <SnapshotPanel open={snapshotsOpen} onClose={() => setSnapshotsOpen(false)}></SnapshotPanel>
      <TweaksPanel>
        <TweakSection label="Visualization"></TweakSection>
        <RenderSetting label="Mode" value={t.vizMode}
          options={["scientific", "cinematic", "minimal", "capture"]}
          onChange={(v) => setTweak("vizMode", v)}></RenderSetting>
        <RenderSetting label="Motion" value={t.motion}
          options={["reduced", "balanced", "full"]}
          onChange={(v) => setTweak("motion", v)}></RenderSetting>
        <RenderSetting label="3D detail" value={t.detail3d}
          options={["low", "medium", "ultra"]}
          onChange={(v) => setTweak("detail3d", v)}></RenderSetting>
        <RenderSetting label="Render backend" value={t.renderBackend || "auto"}
          options={["auto", "webgl2", "static"]}
          onChange={(v) => setTweak("renderBackend", v)}></RenderSetting>
        <RenderSetting label="Tone mapping" value={t.toneMapping || "agx"}
          options={["agx", "neutral"]}
          onChange={(v) => setTweak("toneMapping", v)}></RenderSetting>
        <TweakToggle label="HDR environment lighting" value={t.hdrEnvironment === true}
          onChange={(v) => setTweak("hdrEnvironment", v)}></TweakToggle>
        {t.hdrEnvironment ? <p className="small dim">Seeded HDR sky lighting for 3D materials. Never applied to the Kerr observatory: its horizon is ray-traced black.</p> : null}
        {prm ? <p className="small dim">System reduced-motion overrides Motion settings and disables temporal effects.</p> : null}
        <RenderDiagnosticsDrawer></RenderDiagnosticsDrawer>
        <TweakToggle label="3D labels" value={t.labels3d}
          onChange={(v) => setTweak("labels3d", v)}></TweakToggle>
        <TweakToggle label="Annotations" value={t.annotations3d}
          onChange={(v) => setTweak("annotations3d", v)}></TweakToggle>
        <TweakSection label="Learning"></TweakSection>
        <TweakRadio label="Pathway" value={atlasState.pathway}
          options={["beginner", "student", "advanced"]}
          onChange={(v) => setAtlasState({ pathway: v }, { replace: false })}></TweakRadio>
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
// Compare embeds: the role must exist before any child effect runs (React
// runs child effects before parent effects), so set it at script evaluation.
window.__qgaCompareRole = window.location.hash === "#embed-A" ? "A"
  : window.location.hash === "#embed-B" ? "B" : null;
root.render(<App></App>);
