// null-geodesic-panel.jsx — the orbital-plane light paths of the GR view, with photons travelling along them.
// The paths are the exact Schwarzschild null geodesics of js/physics.mjs drawn by the Figure Kit (plots/gr.mjs); on top, a plane
// wavefront of photons is released at once and played back on the integrator's own clock (js/visualizations/gr/null-photons.mjs).
// The capture, the lag of the near-critical ray and the distortion of the wavefront are therefore the physics, not an effect.

const NG_FRACTIONS = [0.55, 0.8, 0.95, 0.995, 1.005, 1.05, 1.25, 1.7, 2.4];
const NG_NEAR_FRACTION = 1.005;
const NG_LOOP_SECONDS = 9;
const NG_HOLD_SECONDS = 1.6;
const NG_READOUT_MS = 100;
const NG_PARKED_CROSSINGS = 0.7; // where the clock rests when motion is reduced: the wavefront mid-flight

function NullPhotonLayer({ scene, model, clock, playing, redraw }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const visibleRef = useRef(true);
  const palette = useMemo(() => ({ escape: QGA_TOKENS.css("pigment-amber-88"), capture: QGA_TOKENS.css("pigment-red-71-c18") }), []);
  const draw = useCallback(() => {
    if (contextRef.current) window.QGA_GR.nullPhotons.drawPhotons(contextRef.current, scene, model, clock.current, palette);
  }, [scene, model, palette, clock]);

  useEffect(() => {
    contextRef.current = window.QGA_FIGURE.prepareCanvas(canvasRef.current, scene.width, scene.height);
    draw();
  }, [scene, draw]);
  useEffect(() => { draw(); }, [redraw, draw]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => { visibleRef.current = entries[0].isIntersecting; });
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing) return undefined;
    let frame = 0, last = performance.now();
    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      const seconds = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visibleRef.current || document.hidden) return;
      clock.current = window.QGA_GR.nullPhotons.advanceClock(clock.current, seconds, model.span, { loopSeconds: NG_LOOP_SECONDS, holdSeconds: NG_HOLD_SECONDS });
      draw();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, model, draw, clock]);

  // prepareCanvas sizes the backing store at devicePixelRatio; the CSS box must stay the scene's, as the figure's own canvas does.
  return <canvas ref={canvasRef} className="ng-photons" style={{ width: scene.width, height: scene.height }} aria-hidden="true"></canvas>;
}

function NullGeodesicPanel({ mass, c2 }) {
  const P = window.QGA_PHYSICS;
  const N = window.QGA_GR.nullPhotons;
  const reduced = usePRM();
  const gm = 0.55 * mass;
  const rPh = P.grPhotonSphereRadius(gm, c2);
  const bCrit = P.grCriticalImpactParameter(gm, c2);
  const rs = 2 * gm / c2;
  const rays = useMemo(() => NG_FRACTIONS.map((f) => {
    // rCap just outside the horizon so a captured ray is drawn plunging in rather than stopping in mid-air at the photon
    // sphere; the fine step keeps the stiff near-horizon integration smooth.
    const t = P.grNullTrajectory(bCrit * f, gm, c2, { maxSteps: 60000, dt: N.NULL_PHOTON_STEP, v0: N.NULL_PHOTON_SPEED, rCap: 1.02 * rs });
    return { f, captured: t.captured, windings: t.windings, points: t.points };
  }), [mass, c2]); // eslint-disable-line
  const model = useMemo(() => N.buildPhotonRays(rays, 2.5 * bCrit), [rays]); // eslint-disable-line
  const spec = useMemo(() => window.QGA_FIGURE.plots.gr.nullGeodesicSpec({ rays, bCrit, rPh, rs }), [rays]); // eslint-disable-line

  const clock = useRef(reduced ? NG_PARKED_CROSSINGS * model.crossing : 0);
  const [playing, setPlaying] = useState(!reduced);
  const [shown, setShown] = useState(clock.current / model.crossing);
  const [redraw, setRedraw] = useState(0);

  useEffect(() => { clock.current = Math.min(clock.current, model.span); }, [model]);
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setShown(N.clockInCrossings(clock.current, model.crossing)), NG_READOUT_MS);
    return () => clearInterval(id);
  }, [playing, model]); // eslint-disable-line
  const scrub = (crossings) => {
    clock.current = crossings * model.crossing;
    setPlaying(false);
    setShown(crossings);
    setRedraw((n) => n + 1);
  };

  const near = model.photons.find((p) => p.f === NG_NEAR_FRACTION);
  const undeflected = model.photons.reduce((a, b) => (b.f > a.f ? b : a));
  const lastCaptured = Math.max(...model.photons.filter((p) => p.captured).map((p) => p.steps));
  const crossings = (steps) => (steps / model.crossing).toFixed(2);

  return (
    <div className="ng-wrap">
      <div className="panel-head">
        <span>Null geodesics</span>
        <em>orbital plane · light released together</em>
      </div>
      <div className="viz-toolbar ng-bar" role="group" aria-label="Photon playback">
        <button type="button" className={"btn ng-btn" + (playing ? " on" : "")} aria-pressed={playing}
          onClick={() => setPlaying(!playing)}>{playing ? "Pause" : "Play"}</button>
        <SliderRow label="light-travel time" min={0} max={model.span / model.crossing} step={0.005} value={shown}
          onChange={scrub} format={(x) => x.toFixed(2)}></SliderRow>
        <span className="ng-clock"><Eq tex="t/t_0"></Eq></span>
      </div>
      <Figure spec={spec} extra={(scene) => <NullPhotonLayer scene={scene} model={model} clock={clock} playing={playing} redraw={redraw}></NullPhotonLayer>}>
        <span className="ng-note">
          A plane wavefront of photons is released at once; <Eq tex="t_0"></Eq> is the time an undeflected ray needs to cross the frame.
          Rays with <Eq tex="b<b_{\mathrm{crit}}"></Eq> are absorbed within <Eq tex={"t<" + crossings(lastCaptured) + "\\,t_0"}></Eq>; the ray
          at <Eq tex="b=1.005\,b_{\mathrm{crit}}"></Eq> winds {near ? near.windings.toFixed(2) : "\u2014"} turns and leaves at{" "}
          <Eq tex={"t=" + (near ? crossings(near.steps) : "") + "\\,t_0"}></Eq> against <Eq tex={"t=" + crossings(undeflected.steps) + "\\,t_0"}></Eq> for
          the farthest ray: a bent path is a longer one, and light that nearly orbits the photon sphere is delayed well beyond the straight crossing.
        </span>
      </Figure>
    </div>
  );
}
