// Curvature engine controls, extracted from mod-gr for S20.
function CurvatureEngine3D() {
  const [scenario, setScenario] = useState("classic");
  const [mass, setMass] = useState(5);
  const [view, setView] = useState("gr");
  const [geometry, setGeometry] = useState("flamm");
  const [showRay, setShowRay] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [rr, setRr] = useState(false);
  const [spin, setSpin] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [lightSpeed, setLightSpeed] = useState(1);
  const [bodies, setBodies] = useState(() => grMakeBodies("classic"));
  const [selected, setSelected] = useState(0);
  const [cameraGoal, setCameraGoal] = useState(null);
  const massRef = useRef(mass); massRef.current = mass;
  const viewRef = useRef(view); viewRef.current = view;
  const geometryRef = useRef(geometry); geometryRef.current = geometry;
  const rayRef = useRef(showRay); rayRef.current = showRay;
  const trailRef = useRef(showTrails); trailRef.current = showTrails;
  const rrRef = useRef(rr); rrRef.current = rr;
  const spinRef = useRef(spin); spinRef.current = spin;
  const speedRef = useRef(speed); speedRef.current = speed;
  const lightRef = useRef(lightSpeed); lightRef.current = lightSpeed;
  const bodiesRef = useRef(bodies); bodiesRef.current = bodies;
  const selRef = useRef(selected); selRef.current = selected;
  const stRef = useRef({
    sim: [],
    rays: GR_RAY_B.map((b) => ({ x: -7.6, y: b, vx: 4, vy: 0, b, trail: [], near: false })),
  });

  const selIdx = Math.min(selected, bodies.length - 1);
  const selBody = bodies[selIdx];
  const precDeg = selBody && !selBody.free && view === "gr"
    ? grPrecDeg(mass, selBody.a, selBody.e) : 0;
  const ltDeg = selBody && !selBody.free && view === "gr" && spin > 0
    ? window.QGA_PHYSICS.grLenseThirringDeg(spin * Math.pow(0.55 * mass, 2) / GR_C2 * 10, GR_C2, selBody.a, selBody.e) : 0;
  const rrDa = rr && selBody && !selBody.free && view === "gr"
    ? window.QGA_PHYSICS.grPetersDerivatives(selBody.a, selBody.e, 0.5).da : 0;

  // Strong-field anchors for the light fan: photon sphere, critical impact
  // parameter, and the integrated deflection of the outermost ray.
  const gmScene = 0.55 * mass;
  const rPhoton = window.QGA_PHYSICS.grPhotonSphereRadius(gmScene, GR_C2);
  const bCrit = window.QGA_PHYSICS.grCriticalImpactParameter(gmScene, GR_C2);
  const deflDeg = useMemo(() => {
    const d = window.QGA_PHYSICS.grNullDeflection(3.3, 0.55 * mass, GR_C2);
    return d.captured ? 0 : (d.deflection * 180) / Math.PI;
  }, [mass]);

  const applyScenario = (id) => {
    const s = window.QGA_PHYSICS.grCurvatureScenario(id);
    setScenario(id); setMass(s.mass); setShowRay(s.rays);
    setSpin(s.spin || 0); setRr(!!s.rr);
    setBodies(grMakeBodies(id)); setSelected(0);
    if (GR_CAMERA[id]) setCameraGoal({ ...GR_CAMERA[id] });
  };
  const addBody = () => {
    if (bodies.length >= GR_MAX_BODIES) return;
    const i = bodies.length;
    setBodies(bodies.concat([{
      uid: "b" + (grUidSeed++), free: false,
      a: Math.min(6.2, 2.0 + i * 0.75), e: 0.15 + 0.13 * (i % 3),
      phase: i * 1.7, peri: i * 0.9,
      incl: i % 2 ? 0.05 : -0.04,
      x0: undefined, y0: undefined, vx0: undefined, vy0: undefined,
      hex: GR_BODY_PALETTE[i % GR_BODY_PALETTE.length], r: 0.14,
    }]));
    setSelected(i);
  };
  const removeSelected = () => {
    if (bodies.length <= 1) return;
    const next = bodies.filter((_, i) => i !== selIdx);
    setBodies(next);
    setSelected(Math.max(0, Math.min(selected, next.length - 1)));
  };
  const patchSelected = (patch) => {
    setBodies(bodies.map((b, i) => (i === selIdx ? { ...b, ...patch } : b)));
  };
  const relaunch = () => {
    stRef.current.sim = [];
    stRef.current.rays = GR_RAY_B.map((b) => ({ x: -7.6, y: b, vx: 4, vy: 0, b, trail: [], near: false }));
  };

  const refs = {
    mass: massRef, view: viewRef, geometry: geometryRef, ray: rayRef, trail: trailRef, rr: rrRef, spin: spinRef,
    speed: speedRef, light: lightRef, bodies: bodiesRef, sel: selRef, st: stRef,
  };
  // The scene builder (TSL materials on the material kit, S07) lives in js/visualizations/gr/curvature-engine.mjs and loads with the scene.
  const build = async (ctx) => {
    const { buildCurvatureScene } = await window.QGA_GR.loadCurvatureEngine();
    return buildCurvatureScene(ctx, {
      refs, setSelected, constants: { GR_RAY_B, GR_C2, GR_MAX_BODIES }, precessionDeg: grPrecDeg,
    });
  };

  const scenarioIds = Object.keys(window.QGA_PHYSICS.GR_CURVATURE_SCENARIOS);
  return (
    <div className="viz-frame" id="shot-section-gr">
      <div className="viz-toolbar">
        <SliderRow label="mass M" min={1} max={10} step={0.1} value={mass} onChange={setMass}
          format={(v) => v.toFixed(1)}></SliderRow>
        <SliderRow label="spin a★" min={0} max={0.95} step={0.05} value={spin} onChange={setSpin}
          format={(v) => v.toFixed(2)}></SliderRow>
        <span className="seg">
          <button className={"btn" + (view === "gr" ? " on" : "")} onClick={() => setView("gr")}>Relativistic geometry</button>
          <button className={"btn" + (view === "newton" ? " on" : "")} onClick={() => setView("newton")}>Newtonian intuition</button>
        </span>
        <span className="seg" role="group" aria-label="Surface geometry">
          <button type="button" className={"btn" + (geometry === "schematic" ? " on" : "")} aria-pressed={geometry === "schematic"} onClick={() => setGeometry("schematic")}>Newtonian potential · schematic</button>
          <button type="button" className={"btn" + (geometry === "flamm" ? " on" : "")} aria-pressed={geometry === "flamm"} onClick={() => setGeometry("flamm")}>Exact geometry · Flamm</button>
        </span>
        <Toggle label="null geodesics" checked={showRay} onChange={setShowRay}></Toggle>
        <Toggle label="orbit trails" checked={showTrails} onChange={setShowTrails}></Toggle>
        <Toggle label="radiation reaction" checked={rr} onChange={setRr}></Toggle>
        <SliderRow label="time ×" min={0.25} max={2.5} step={0.05} value={speed} onChange={setSpeed}
          format={(v) => v.toFixed(2)}></SliderRow>
        <SliderRow label="light ×" min={0.1} max={2} step={0.05} value={lightSpeed} onChange={setLightSpeed}
          format={(v) => v.toFixed(2)}></SliderRow>
        <button className="btn" onClick={relaunch}>Re-launch bodies</button>
      </div>
      <div className="viz-toolbar">
        <span className="chip-row" role="group" aria-label="scenario presets">
          {scenarioIds.map((id) => (
            <button key={id} className={"chip" + (scenario === id ? " on" : "")}
              aria-pressed={scenario === id} onClick={() => applyScenario(id)}
            >{window.QGA_PHYSICS.grCurvatureScenario(id).label}</button>
          ))}
        </span>
      </div>
      <div className="viz-toolbar">
        <span className="chip-row" role="group" aria-label="orbiting bodies">
          {bodies.map((b, i) => (
            <button key={b.uid} className={"chip body-chip" + (i === selIdx ? " on" : "")}
              aria-pressed={i === selIdx} onClick={() => setSelected(i)}
            ><span className="body-dot" style={{ background: "#" + b.hex.toString(16).padStart(6, "0") }}></span
            >{b.free ? "plunge" : "body " + (i + 1)}</button>
          ))}
          <button className="chip" onClick={addBody} disabled={bodies.length >= GR_MAX_BODIES}>+ body</button>
          <button className="chip" onClick={removeSelected} disabled={bodies.length <= 1}>− remove</button>
        </span>
        {selBody && !selBody.free && (
          <React.Fragment>
            <SliderRow label="semi-major a" min={1.4} max={6.5} step={0.05} value={selBody.a}
              onChange={(v) => patchSelected({ a: v })} format={(v) => v.toFixed(2)}></SliderRow>
            <SliderRow label="eccentricity e" min={0} max={0.9} step={0.01} value={selBody.e}
              onChange={(v) => patchSelected({ e: v })} format={(v) => v.toFixed(2)}></SliderRow>
          </React.Fragment>
        )}
        {selBody && selBody.free && (
          <span className="chip-hint">plunge body — numerically integrated; captured at r = 3GM/c²</span>
        )}
      </div>
      <div className="gr-well-stage"><div className="gr-geometry-label" aria-live="polite">{geometry === "flamm" ? "EXACT · Schwarzschild equatorial spatial slice" : "SCHEMATIC · Newtonian potential"}</div>
      <Scene3D animated nodeKit height={480} shotSpace="gr-curvature" aria="Three-dimensional gravity well: selectable exact Flamm spatial embedding or schematic potential surface with separately modelled orbits and light rays"
        initial={{ radius: 17, theta: 0.4, phi: 1.08, target: [0, -1.2, 0], minR: 8, maxR: 38, bloom: { strength: 1.12, radius: 0.66, threshold: 0.1 } }}
        cameraGoal={cameraGoal}
        build={build} fallback={<CurvatureEngine></CurvatureEngine>}></Scene3D></div>
      <div className="panel-deck">
        <VEffPanel mass={mass} body={selBody} view={view} stRef={stRef}></VEffPanel>
        <NullGeodesicPanel mass={mass} c2={GR_C2}></NullGeodesicPanel>
        <LensedSkyPanel mass={mass}></LensedSkyPanel>
      </div>
      <div className="viz-toolbar viz-toolbar-bottom readout-grid" style={{ display: "grid" }}>
        <div className="readout"><div className="readout-label">selected body eccentricity e</div>
          <div className="readout-value">{selBody && !selBody.free ? selBody.e.toFixed(3) : "—"}</div></div>
        <div className="readout"><div className="readout-label">perihelion advance (selected)</div>
          <div className="readout-value">{precDeg > 0.05 ? "+" + precDeg.toFixed(1) : "0.0"}<span className="unit">° / orbit</span></div></div>
        <div className="readout"><div className="readout-label">Lense–Thirring node (selected)</div>
          <div className="readout-value">{ltDeg > 0.01 ? "+" + ltDeg.toFixed(1) : "0.0"}<span className="unit">° / orbit ×10</span></div></div>
        <div className="readout"><div className="readout-label">GW inspiral ⟨ȧ⟩ (selected)</div>
          <div className="readout-value">{rrDa < -0.001 ? rrDa.toFixed(3) : "off"}<span className="unit">a / s</span></div></div>
        <div className="readout"><div className="readout-label">photon sphere r = 3GM/c²</div>
          <div className="readout-value">{rPhoton.toFixed(3)}<span className="unit">scene units</span></div></div>
        <div className="readout"><div className="readout-label">critical impact b = 3√3 GM/c²</div>
          <div className="readout-value">{bCrit.toFixed(3)}<span className="unit">capture below</span></div></div>
        <div className="readout"><div className="readout-label">deflection at b = 3.3 (integrated)</div>
          <div className="readout-value">{deflDeg.toFixed(2)}<span className="unit">°</span></div></div>
        <div className="readout"><div className="readout-label">Mercury (real, GR)</div>
          <div className="readout-value">42.98<span className="unit">″ / century</span></div></div>
        <div className="readout"><div className="readout-label">Solar-limb light deflection (real)</div>
          <div className="readout-value">1.75<span className="unit">″</span></div></div>
      </div>
      <VizCaption provenanceId="gr-curvature-well" status="schematic">
        Flamm mode embeds the equatorial spatial slice of a non-rotating Schwarzschild solution outside the horizon;
        concentric lines are equally spaced in proper radial distance. Its vertical direction is an embedding aid,
        not an extra dimension of space or a picture of time. The alternative potential well is schematic.
        The overlaid trajectories use separate models: bound orbits use an amplified precession approximation,
        light rays are numerically integrated Schwarzschild null geodesics, and frame dragging and radiation reaction
        are illustrative additions. The scene mass and distances use display units.
      </VizCaption>
    </div>
  );
}
