// Penrose Observatory: exact diagrams, computed light paths and a proper-time explorer.
const PN_DEFAULT_R0 = 2.6;
const PN_FOV = 13;
const PN_VIEWS = [
  { id: "minkowski", title: "Minkowski", label: "Flat spacetime", status: "established" },
  { id: "schwarzschild", title: "Schwarzschild", label: "Uncharged black hole", status: "established" },
  { id: "reissner-nordstrom", title: "Reissner–Nordström", label: "Charged black hole", status: "schematic" },
];

function PenroseAtlas() {
  const C = window.QGA_CONFORMAL;
  const [view, setView] = useState("minkowski");
  const [compare, setCompare] = useState(false);
  const [mode, setMode] = useState("signal");
  const [r0, setR0] = useState(PN_DEFAULT_R0);
  const [progress, setProgress] = useState(0);
  const [released, setReleased] = useState("idle");
  const [focused, setFocused] = useState(null);
  const [event, setEvent] = useState(null);
  const [intro, setIntro] = useState(false);
  const reduced = usePRM();
  const settings = useAtlasSettings();
  const introDisabled = reduced || settings.motion === "reduced";
  const wrap = useRef(null), atlas = useRef(null);
  const introSeen = useRef(false);
  const [width, setWidth] = useState(0);
  const latest = useRef({});
  const selected = PN_VIEWS.find((item) => item.id === view);
  const other = view === "minkowski" ? "schwarzschild" : "minkowski";
  const visible = compare ? [view, other] : [view];
  latest.current = { r0, view, compare, progress, mode };

  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => setWidth(Math.floor(entries[0].contentRect.width)));
    ro.observe(el); setWidth(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  const fall = useMemo(() => C.freeFallFromRest({ r0, M: 1, samples: 361 }), [r0]);
  const panelRegions = useMemo(() => C.regions(view), [view]);
  const active = PN_VIEWS.flatMap((v) => C.regions(v.id)).find((r) => r.id === focused) ?? null;
  const stage = useMemo(() => {
    const w = width || 900;
    const h = Math.round(Math.max(360, Math.min(620, w * 0.64)));
    return { height: h, ...C.geometry.observatoryFrame(visible, w, h, PN_FOV) };
  }, [width, view, compare]);

  const build = async (ctx) => {
    const { buildPenroseAtlas } = await C.loadAtlas();
    const state = latest.current;
    const ids = state.compare ? [state.view, state.view === "minkowski" ? "schwarzschild" : "minkowski"] : [state.view];
    const handle = await buildPenroseAtlas(ctx, {
      visiblePanels: ids,
      onEvent: setEvent,
      onIntro: setIntro,
      onRegion: (id) => { setMode("regions"); setFocused(id); },
      onProgress: (value) => {
        setProgress((old) => Math.abs(old - value) >= 0.015 || value === 0 || value === 1 ? value : old);
        if (value >= 1) setReleased("complete");
      },
    });
    atlas.current = handle;
    handle.setStartRadius(state.r0);
    if (state.progress > 0) handle.seek(state.progress);
    const defaultId = state.view === "reissner-nordstrom" ? null : state.view;
    if (defaultId) handle.placeEvent(defaultId, defaultId === "minkowski" ? { T: 0, R: 0 } : { T: 0, R: 1.2 });
    handle.setInteractionMode(state.mode);
    if (state.view === "minkowski" && !state.compare && !introSeen.current) { introSeen.current = true; handle.playIntro(); }
    handle.onFocusChange?.(setFocused);
    window.__qgaPenroseAtlas = handle;
    return handle;
  };

  useEffect(() => {
    atlas.current?.setStartRadius(r0); setProgress(0); setReleased("idle");
  }, [r0]);
  useEffect(() => { atlas.current?.setInteractionMode(mode); }, [mode]);

  const selectView = (id) => { setView(id); setIntro(false); setFocused(null); setEvent(null); setProgress(0); setReleased("idle"); };
  const selectMode = (id) => { setMode(id); if (id === "observer" && view !== "schwarzschild") selectView("schwarzschild"); };
  const play = () => {
    if (released === "running") { atlas.current?.pause(); setReleased("paused"); return; }
    const result = atlas.current?.release() ?? "idle"; setReleased(result === "snapped" ? "complete" : result);
  };
  const placePreset = (where) => {
    const p = where === "interior" ? { T: 0.9, R: 0.15 } : { T: 0, R: 1.2 };
    atlas.current?.placeEvent("schwarzschild", p); atlas.current?.focusRegion(where === "interior" ? "II" : "I");
  };
  const moveEvent = (dT, dR) => { if (event) atlas.current?.placeEvent(event.id, { T: event.T + dT, R: event.R + dR }); };
  const eventText = !event ? "Choose an event on the map to explore its future." : event.id === "minkowski"
    ? "Both radial light signals can reach future null infinity in this flat spacetime."
    : event.region === "II" ? "Inside the black-hole region, both future-directed radial light paths end at the singularity."
    : event.region === "I" ? "Outside the future horizon, an outgoing light signal can reach future null infinity."
    : event.region === "III" ? "In the other exterior, the outward radial signal can reach that exterior’s future null infinity."
    : "This event lies in the white-hole region of the ideal maximal extension.";

  return (
    <div className="viz-frame pn-lab pn-observatory">
      <div className="pn-hero">
        <div><p className="pn-eyebrow">HORIZON / INTERACTIVE ATLAS</p><h3>Spacetime observatory</h3>
          <p>Where can a signal go? Explore the geometry of cause and effect.</p></div>
        <span className="pn-hero-index">GR / 04</span>
      </div>
      <div className="pn-viewbar" role="group" aria-label="Choose spacetime">
        {PN_VIEWS.map((item) => <button key={item.id} type="button" className={"pn-view-btn" + (view === item.id ? " on" : "")}
          aria-pressed={view === item.id} onClick={() => selectView(item.id)}><strong>{item.title}</strong><span>{item.label}</span></button>)}
        <button type="button" className={"pn-compare" + (compare ? " on" : "")} aria-pressed={compare} onClick={() => { setCompare(!compare); setIntro(false); setEvent(null); }}>Compare {compare ? "on" : "off"}</button>
      </div>
      <div className="pn-stage-wrap" ref={wrap}>
        <div className="pn-stage-meta"><span>{compare ? "COMPARE" : selected.title}</span>
          <span className={"pn-status " + selected.status}>{compare && visible.includes("reissner-nordstrom") ? "RN SCHEMATIC" : selected.status === "schematic" ? "SCHEMATIC" : "EXACT MAP"}</span></div>
        {compare && C.geometry.layout().panels.filter((p) => visible.includes(p.id)).map((p) => {
          const halfWidth = Math.tan(PN_FOV * Math.PI / 360) * stage.radius * (width || 900) / stage.height;
          return <div className="pn-compare-label" key={p.id} style={{ left: `${(0.5 + (p.cx - stage.targetX) / (2 * halfWidth)) * 100}%` }}>{p.title}{p.id === "reissner-nordstrom" ? " · schematic" : ""}</div>;
        })}
        <Scene3D fixedView animated={false} height={stage.height} deps={[stage.radius, stage.targetX, view, compare]}
          aria="Conformal spacetime diagram. Select an event to see its future light paths. The Reissner–Nordström view is schematic."
          initial={{ radius: stage.radius, theta: 0, phi: 0, fov: PN_FOV, minR: stage.radius * 0.8, maxR: stage.radius * 1.6, target: [stage.targetX, 0, 0] }}
          build={build} fallback={<div className="lab-fallback">The interactive diagram needs WebGL. The explanations and formulas remain available below.</div>}></Scene3D>
        <div className="pn-axis pn-axis-top">FUTURE ↑</div>
        <div className="pn-axis pn-axis-bottom">PAST</div>
      </div>
      <div className="pn-legend"><span><i className="pn-key-light"></i> light path</span><span><i className="pn-key-world"></i> observer</span><span><i className="pn-key-boundary"></i> boundary</span><span>shaded area: causal future</span><span>↗ radial light travels at 45°</span></div>
      {view === "minkowski" && !compare && <div className="pn-intro-control"><span>{introDisabled ? "Reduced motion is on; the final map is shown without the introduction." : "Watch sample events change coordinates, then see an observer and light approach infinity on the finite map."}</span><button className="btn" type="button" disabled={introDisabled} onClick={() => intro ? atlas.current?.skipIntro() : atlas.current?.playIntro()}>{intro ? "Skip intro" : "Watch the map"}</button></div>}
      <div className="pn-actions" role="group" aria-label="Explore the diagram">
        <button type="button" className={"pn-action" + (mode === "signal" ? " on" : "")} aria-pressed={mode === "signal"} onClick={() => selectMode("signal")}>Send a light signal</button>
        <button type="button" className={"pn-action" + (mode === "observer" ? " on" : "")} aria-pressed={mode === "observer"} onClick={() => selectMode("observer")}>Follow an observer</button>
        <button type="button" className={"pn-action" + (mode === "regions" ? " on" : "")} aria-pressed={mode === "regions"} onClick={() => selectMode("regions")}>Explore regions</button>
      </div>
      <div className="pn-insight" aria-live="polite">
        {mode === "signal" ? <React.Fragment><div><span className="pn-kicker">CAUSAL CONNECTION</span><h4>Choose an event</h4>
          <p>{view === "reissner-nordstrom" && !compare ? "This view is a schematic. Choose an exact map to send a computed light signal." : eventText + " Click or drag on the map, or use the movement controls below."}{compare && " Comparison shows independent example events; select either exact map to move its event."}</p></div>
          <div className="pn-insight-actions"><button className="btn" type="button" disabled={!event} onClick={() => atlas.current?.sendSignal()}>Send light again</button>
            {visible.includes("schwarzschild") && <React.Fragment><button className="btn" type="button" onClick={() => placePreset("exterior")}>Outside horizon</button><button className="btn" type="button" onClick={() => placePreset("interior")}>Inside horizon</button></React.Fragment>}</div>
          {event && <div className="pn-event-controls" role="group" aria-label="Move the selected event"><span>Move event</span><button className="btn" aria-label="Move event into the past" onClick={() => moveEvent(-0.1, 0)}>↓</button><button className="btn" aria-label="Move event left" onClick={() => moveEvent(0, -0.1)}>←</button><button className="btn" aria-label="Move event right" onClick={() => moveEvent(0, 0.1)}>→</button><button className="btn" aria-label="Move event into the future" onClick={() => moveEvent(0.1, 0)}>↑</button><span><Eq tex={pnPointTex(event)}></Eq></span></div>}</React.Fragment>
        : mode === "observer" ? <React.Fragment><div><span className="pn-kicker">RADIAL FREE FALL / SCHWARZSCHILD</span><h4>Follow the observer</h4><p>The marker follows the calculated worldline in the observer’s proper time. The horizon is crossed once; the trajectory ends at the singularity.</p></div>
          <div className="pn-transport"><button className="btn pn-release" type="button" onClick={play}>{released === "running" ? "Pause" : progress >= 1 ? "Replay fall" : "Play fall"}</button>
            <label>Proper time <input type="range" min="0" max="1000" value={Math.round(progress * 1000)} aria-label="Observer proper time" onChange={(e) => { atlas.current?.seek(Number(e.target.value) / 1000); setReleased("paused"); }} /></label>
            <span>{Math.round(progress * 100)}%</span></div>
          <div className="pn-timeline-notes"><span>Start</span><span>Horizon · {Math.round(C.geometry.horizonProgress(fall) * 100)}% of proper time</span><span>Singularity</span></div>
          <div className="pn-start"><label>Starting radius <Eq tex="r_0"></Eq><input type="range" min="2.6" max="30" step="0.2" value={r0} aria-label="infall start radius in units of M" onChange={(e) => setR0(Number(e.target.value))} /></label><span className="ctl-value"><Eq tex={String.raw`${r0.toFixed(1)}M`}></Eq></span></div>
          <p className="pn-milestone">Start at rest · horizon at <Eq tex={pnPointTex(fall.horizonCrossing)}></Eq> · end at <Eq tex={String.raw`\tau=${fall.properTimeEnd.toFixed(3)}\,M`}></Eq></p></React.Fragment>
        : <React.Fragment><div><span className="pn-kicker">SELECT A REGION</span><h4>{active ? active.name : "Explore the map"}</h4><p>{active ? active.meaning : "Select a region to see what it represents. The maximal Schwarzschild extension is an ideal mathematical solution."}</p></div>
          <div className="pn-region-list" role="group" aria-label="Regions of the diagram">{panelRegions.map((region) => <button key={region.id} type="button" className={"btn pn-region" + (focused === region.id ? " on" : "")} aria-pressed={focused === region.id} onClick={() => { setFocused(region.id); atlas.current?.focusRegion(region.id); }}><span className="pn-region-id">{region.id}</span> {region.name}</button>)}</div></React.Fragment>}
      </div>
      <VizCaption provenanceId="gr-penrose-atlas" status="established">Minkowski and Schwarzschild are drawn from exact conformal maps. Radial light follows the diagonal null directions; diagram distances are not physical distances. Reissner–Nordström is a labelled schematic, not a calculated coordinate map.</VizCaption>
      <details className="pn-math"><summary><span><span className="pn-kicker">THE EQUATIONS</span><strong>How is spacetime mapped?</strong><small>Open the formulas and connect their terms to the diagram</small></span><b aria-hidden="true">+</b></summary>
        <p>First stretch the radial coordinate near the horizon. Then form the light coordinates <Eq tex="u=t-r^*,\\quad v=t+r^*"></Eq> and their Kruskal counterparts U and V. Finally compress them into the diagram coordinates T and R. Select U or V in the Schwarzschild view to highlight its family of light rays.</p>
      <div className="formula-grid">
        <FormulaCard title="Tortoise coordinate" formulaId="penrose-tortoise" status="established"
          symbols={[
            { s: "r", d: "Schwarzschild radial coordinate." },
            { s: "r^*", d: "The tortoise coordinate: the radial coordinate in which light rays move at 45 degrees. It goes to $-\\infty$ at the horizon, which is what the Kruskal chart repairs." },
            { s: "M", d: "Black-hole mass, a length in geometric units ($G=c=1$)." },
          ]}
          meaning="A change of radial coordinate that stretches the region near the horizon without bound. Written with the absolute value it is defined inside the horizon too, which is what makes the maximal extension possible."
          limits="Geometric units. $r^*\\to-\\infty$ at $r=2M$ and $r^*\\to+\\infty$ as $r\\to\\infty$; the coordinate covers each side of the horizon separately."></FormulaCard>
        <FormulaCard title="Kruskal coordinates" formulaId="penrose-compact-t" status="established"
          symbols={[
            { s: "U", d: "Retarded null coordinate, $U=-e^{-(t-r^*)/4M}$. Vanishes on the horizon, negative in region I and positive in region II." },
            { s: "V", d: "Advanced null coordinate. In region I, $V=e^{(t+r^*)/4M}$; its sign changes between Kruskal regions and it is zero on a horizon." },
            { s: "T", d: "The compactified time of the diagram, $T=\\arctan U+\\arctan V$." },
          ]}
          meaning="The chart in which the horizon is not a coordinate singularity: $U$ and $V$ are smooth across it. Compactifying both with the same arctan turns the infinite Kruskal plane into the finite diagram and keeps every light ray at 45 degrees."
          limits="The compactification is not a physical change: $T$ and $R$ have no units of time or length, and distances on the diagram are not proper distances."></FormulaCard>
        <FormulaCard title="Outgoing light coordinate U" formulaId="penrose-kruskal-u" status="established"
          meaning="In region I, U stays constant along an outgoing radial light ray. Kruskal coordinates extend smoothly across the horizon."
          limits="The displayed exponential uses the exterior region I sign convention; the full extension uses different signs in other regions."></FormulaCard>
        <FormulaCard title="Ingoing light coordinate V" formulaId="penrose-kruskal-v" status="established"
          meaning="In region I, V stays constant along an ingoing radial light ray."
          limits="The displayed exponential uses the exterior region I sign convention; the full extension uses different signs in other regions."></FormulaCard>
        <FormulaCard title="Compactified radial coordinate" formulaId="penrose-compact-r" status="established"
          symbols={[
            { s: "R", d: "The compactified radial coordinate, $R=\\arctan V-\\arctan U$." },
            { s: "U", d: "Retarded null coordinate." },
            { s: "V", d: "Advanced null coordinate." },
          ]}
          meaning="With $T=\\arctan U+\\arctan V$ this completes the map from the Kruskal plane to the diagram. Because only one of $U$ and $V$ moves along a light ray, every null direction comes out at exactly 45 degrees."
          limits="Region I is $R>|T|$, region II $T>|R|$, region III $R<-|T|$ and region IV $T<-|R|$: the four wedges between the horizons."></FormulaCard>
      </div>

      <VizCaption provenanceId="gr-penrose-reissner-nordstrom" status="schematic">
        The right-hand panel is a <strong>schematic</strong> and is labelled as one in the canvas. It states three things:
        that <Eq tex="r_+"></Eq> and <Eq tex="r_-"></Eq> are null surfaces, so the diagram edges they form run at 45 degrees;
        that the singularity at <Eq tex="r=0"></Eq> is <em>timelike</em> — a vertical line here, where Schwarzschild's is
        horizontal — and so can be avoided; and that the regions nest <Eq tex="r>r_+"></Eq>, then{" "}
        <Eq tex="r_-<r<r_+"></Eq>, then <Eq tex="0<r<r_-"></Eq>. The exact maximal extension is an infinite chain of such
        blocks joined at <Eq tex="r_-"></Eq>, which is a Cauchy horizon: data on it does not determine the future. Charged
        black holes with <Eq tex="|Q|"></Eq> comparable to <Eq tex="M"></Eq> are not expected to exist in the sky — the
        surrounding plasma neutralises them — so this panel is about the structure of the solution, not about an object.
      </VizCaption>
      </details>
    </div>
  );
}

function pnPointTex(point) { return String.raw`T=${point.T.toFixed(3)},\quad R=${point.R.toFixed(3)}`; }
window.PenroseAtlas = PenroseAtlas;
