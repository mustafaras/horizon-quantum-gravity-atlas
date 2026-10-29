// mod-gr.jsx — Module 04: General Relativity and Spacetime Geometry
// The causal laboratory's presets, window, clamping, easing and ray geometry live in js/labs/causal-spacetime-model.jsx
// (moved there in S19), which this file reads through window.CAUSAL_MODEL.
const { DEFAULT: CAUSAL_DEFAULT, PRESETS: CAUSAL_PRESET_STATE, WORLD: CAUSAL_WORLD, PLOT: CAUSAL_PLOT } = window.CAUSAL_MODEL;
const { clamp: clampCausalNumber, useEasedCausalValue, rayEndpoint: causalRayEndpoint, statePatch: causalStatePatch } = window.CAUSAL_MODEL;

function CausalCoordinateInput({ eventName, axis, value, onChange }) {
  return (
    <label className="causal-coordinate-input">
      <span>{eventName} · {axis}</span>
      <input type="number" min="-4" max="4" step="0.1" value={value}
        aria-label={`${eventName} ${axis} coordinate`}
        onChange={(event) => onChange(clampCausalNumber(event.target.value, value))}></input>
    </label>
  );
}

function CausalSpacetimeLab() {
  const [atlasState, setAtlasState] = useQGAState();
  const reducedMotion = usePRM();
  const [dragging, setDragging] = useState(null);
  const [selected, setSelected] = useState("A");
  const [pulse, setPulse] = useState(0);
  const [pulsePlaying, setPulsePlaying] = useState(false);
  const svgRef = useRef(null);
  const betaPointerRef = useRef(false);

  const sanitized = window.QGA_PHYSICS.sanitizeCausalState({
    beta: atlasState.grBeta,
    a: { ct: atlasState.grAt, x: atlasState.grAx },
    b: { ct: atlasState.grBt, x: atlasState.grBx },
  }, CAUSAL_DEFAULT);
  const beta = sanitized.beta;
  const eventA = sanitized.a;
  const eventB = sanitized.b;
  const animatedBeta = useEasedCausalValue(beta, reducedMotion);
  const settled = Math.abs(animatedBeta - beta) < 1e-5;

  useEffect(() => {
    if (!pulsePlaying || reducedMotion) return undefined;
    let raf = 0;
    let previous = performance.now();
    const frame = (now) => {
      const elapsed = (now - previous) / 1000;
      previous = now;
      setPulse((current) => Math.min(1, current + elapsed * 0.45));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [pulsePlaying, reducedMotion]);
  useEffect(() => {
    if (pulse >= 1 && pulsePlaying) setPulsePlaying(false);
  }, [pulse, pulsePlaying]);

  const deltaCt = eventB.ct - eventA.ct;
  const deltaX = eventB.x - eventA.x;
  const classification = window.QGA_PHYSICS.classifySeparation(deltaCt, deltaX, { c: 1 });
  const interval = classification.ds2;
  const gamma = window.QGA_PHYSICS.lorentzGamma(beta);
  const transform = window.QGA_PHYSICS.lorentzTransform({ deltaCt, deltaX, beta, c: 1 });
  const transformedInterval = window.QGA_PHYSICS.invariantInterval(transform.deltaCtPrime, transform.deltaXPrime);
  const proper = window.QGA_PHYSICS.properTime(deltaCt, deltaX, { c: 1 });
  const simultaneityCandidate = window.QGA_PHYSICS.simultaneityFrameBeta(deltaCt, deltaX);
  const simultaneityBeta = Number.isFinite(simultaneityCandidate) && classification.type === "spacelike"
    ? simultaneityCandidate : null;
  const transformedA = window.QGA_PHYSICS.lorentzTransform({
    deltaCt: eventA.ct, deltaX: eventA.x, beta: animatedBeta,
  });
  const transformedB = window.QGA_PHYSICS.lorentzTransform({
    deltaCt: eventB.ct, deltaX: eventB.x, beta: animatedBeta,
  });
  const activePreset = atlasState.grPreset || "timelike";
  const presetNote = CAUSAL_PRESET_STATE[activePreset]?.note || "Custom event coordinates and frame speed.";
  const invariantResidual = transformedInterval - interval;
  const orderReversed = Math.sign(deltaCt) !== 0
    && Math.sign(transform.deltaCtPrime) !== 0
    && Math.sign(deltaCt) !== Math.sign(transform.deltaCtPrime);
  const simultaneousNow = Math.abs(transform.deltaCtPrime) < 1e-9;
  const orderMessage = classification.type === "timelike"
    ? `Timelike order preserved: ${deltaCt >= 0 ? "A precedes B" : "B precedes A"} in both frames.`
    : classification.type === "null"
      ? "Null separation preserved: the events remain connected by light."
      : simultaneousNow
        ? "Spacelike pair is simultaneous in S′ at this β."
        : orderReversed
          ? "Spacelike coordinate-time order is reversed in S′."
          : "Spacelike order has not reversed at this β; another valid frame can change it.";

  const twinTurn = { ct: 0, x: 2.2 };
  const twinTravelerTime = window.QGA_PHYSICS.piecewiseProperTime([eventA, twinTurn, eventB]);
  const twinHomeTime = window.QGA_PHYSICS.properTime(deltaCt, deltaX);

  const screenX = (x) => CAUSAL_PLOT.left
    + ((x - CAUSAL_WORLD.min) / (CAUSAL_WORLD.max - CAUSAL_WORLD.min))
    * (CAUSAL_PLOT.right - CAUSAL_PLOT.left);
  const screenCt = (ct) => CAUSAL_PLOT.bottom
    - ((ct - CAUSAL_WORLD.min) / (CAUSAL_WORLD.max - CAUSAL_WORLD.min))
    * (CAUSAL_PLOT.bottom - CAUSAL_PLOT.top);
  const pointString = (point) => `${screenX(point.x)},${screenCt(point.ct)}`;
  const origin = { x: 0, ct: 0 };
  const futureLeft = causalRayEndpoint(eventA, -1, 1);
  const futureRight = causalRayEndpoint(eventA, 1, 1);
  const pastLeft = causalRayEndpoint(eventA, -1, -1);
  const pastRight = causalRayEndpoint(eventA, 1, -1);
  const signalEnd = deltaX >= 0 ? futureRight : futureLeft;
  const signalPoint = {
    x: eventA.x + (signalEnd.x - eventA.x) * pulse,
    ct: eventA.ct + (signalEnd.ct - eventA.ct) * pulse,
  };
  const xPrimePositive = causalRayEndpoint(origin, 1, animatedBeta);
  const xPrimeNegative = causalRayEndpoint(origin, -1, -animatedBeta);
  const ctPrimePositive = causalRayEndpoint(origin, animatedBeta, 1);
  const ctPrimeNegative = causalRayEndpoint(origin, -animatedBeta, -1);
  const observerVelocity = 0.55;
  const observerX = (ct) => 1.45 + observerVelocity * ct;
  const observerGamma = window.QGA_PHYSICS.lorentzGamma(observerVelocity);
  const observerTicks = [-3, -2, -1, 0, 1, 2, 3]
    .map((tau) => tau * observerGamma)
    .filter((ct) => ct >= CAUSAL_WORLD.min && ct <= CAUSAL_WORLD.max);

  const svgToWorld = (clientX, clientY) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return origin;
    const svgX = ((clientX - rect.left) / rect.width) * 900;
    const svgY = ((clientY - rect.top) / rect.height) * 560;
    return {
      x: clampCausalNumber(
        CAUSAL_WORLD.min + ((svgX - CAUSAL_PLOT.left) / (CAUSAL_PLOT.right - CAUSAL_PLOT.left)) * 8,
        0,
      ),
      ct: clampCausalNumber(
        CAUSAL_WORLD.max - ((svgY - CAUSAL_PLOT.top) / (CAUSAL_PLOT.bottom - CAUSAL_PLOT.top)) * 8,
        0,
      ),
    };
  };

  const updateEvent = (name, nextCt, nextX, replace = true) => {
    const patch = name === "A"
      ? { grAt: clampCausalNumber(nextCt, eventA.ct), grAx: clampCausalNumber(nextX, eventA.x) }
      : { grBt: clampCausalNumber(nextCt, eventB.ct), grBx: clampCausalNumber(nextX, eventB.x) };
    setAtlasState({ ...patch, grPreset: "custom" }, { replace });
  };
  const handlePointerMove = (event) => {
    if (!dragging) return;
    const world = svgToWorld(event.clientX, event.clientY);
    updateEvent(dragging, Number(world.ct.toFixed(2)), Number(world.x.toFixed(2)), true);
  };
  const stopDragging = (event) => {
    if (event?.pointerId != null && svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId);
    }
    setDragging(null);
  };
  const pointerDown = (name, event) => {
    setSelected(name);
    setDragging(name);
    setAtlasState({}, { replace: false });
    svgRef.current?.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  };
  const nudgeEvent = (name, event) => {
    const current = name === "A" ? eventA : eventB;
    const step = event.shiftKey ? 0.5 : 0.1;
    const movement = {
      ArrowLeft: { ct: current.ct, x: current.x - step },
      ArrowRight: { ct: current.ct, x: current.x + step },
      ArrowUp: { ct: current.ct + step, x: current.x },
      ArrowDown: { ct: current.ct - step, x: current.x },
    }[event.key];
    if (!movement) return;
    event.preventDefault();
    updateEvent(name, movement.ct, movement.x, false);
  };
  const applyPreset = (key) => {
    const preset = CAUSAL_PRESET_STATE[key] || CAUSAL_PRESET_STATE.timelike;
    setAtlasState(causalStatePatch(key, { preset: key, ...preset }), { replace: false });
    setPulse(0);
    setPulsePlaying(false);
  };
  const playSignal = () => {
    if (reducedMotion) {
      setPulse(1);
      setPulsePlaying(false);
      return;
    }
    if (pulse >= 1) setPulse(0);
    setPulsePlaying((playing) => !playing);
  };
  const updateBeta = (value, replace) => {
    setAtlasState({
      grBeta: clampCausalNumber(value, beta, -0.95, 0.95),
      grPreset: activePreset === "custom" ? "custom" : activePreset,
    }, { replace });
  };

  return (
    <div className={`viz-frame causal-lab causal-${classification.type}`}
      data-testid="causal-lab"
      data-exact-beta={beta.toFixed(4)}
      data-displayed-beta={animatedBeta.toFixed(4)}
      data-settled={settled ? "true" : "false"}>
      <div className="kerr-observatory-head causal-head">
        <div className="kerr-head-plate">
          <div className="kerr-head-ident">GR<span>CAUSAL</span></div>
          <div>
            <h3>Causal Spacetime Laboratory</h3>
            <p>Exact 1+1D special-relativistic coordinates inside a pedagogical Minkowski instrument.</p>
          </div>
        </div>
        <div className="kerr-head-state">
          <span className="badge badge-established">Flat spacetime · exact SR</span>
          <div className="kerr-state-line">
            {classification.type} · β = {beta.toFixed(3)} · γ = {gamma.toFixed(3)} · {settled ? "frame settled" : "frame settling"}
          </div>
        </div>
      </div>

      <div className="kerr-instrument-bar causal-presets">
        <div className="kerr-control-group" role="group" aria-label="Causal laboratory presets">
          <span className="kerr-control-label">Preset</span>
          {Object.entries(CAUSAL_PRESET_STATE).map(([key, preset]) => (
            <button key={key} className={"kerr-chip" + (activePreset === key ? " on" : "")}
              aria-pressed={activePreset === key}
              onClick={() => applyPreset(key)}>{preset.label}</button>
          ))}
          {activePreset === "custom" ? <span className="causal-custom-chip">custom</span> : null}
        </div>
        <button className="kerr-chip" onClick={() => {
          setAtlasState(causalStatePatch("timelike", CAUSAL_DEFAULT), { replace: false });
          setPulse(0);
        }}>Reset</button>
      </div>

      <div className="causal-frame-control">
        <div className="causal-beta-control">
          <label htmlFor="causal-beta-range">Frame speed β = v/c</label>
          <input id="causal-beta-range" type="range" min="-0.95" max="0.95" step="0.01" value={beta}
            aria-valuetext={`${beta.toFixed(2)} times the speed of light`}
            onPointerDown={() => {
              betaPointerRef.current = true;
              setAtlasState({}, { replace: false });
            }}
            onPointerUp={() => { betaPointerRef.current = false; }}
            onPointerCancel={() => { betaPointerRef.current = false; }}
            onChange={(event) => updateBeta(event.target.value, betaPointerRef.current)}></input>
          <input className="causal-beta-number" type="number" min="-0.95" max="0.95" step="0.01"
            value={beta} aria-label="Lorentz beta numeric input"
            onChange={(event) => updateBeta(event.target.value, false)}></input>
        </div>
        <div className="causal-frame-actions">
          {simultaneityBeta != null ? (
            <button className="btn primary" onClick={() => updateBeta(simultaneityBeta, false)}>
              Set simultaneous frame β = {simultaneityBeta.toFixed(3)}
            </button>
          ) : null}
          <button className="btn" onClick={playSignal} disabled={false}
            aria-label={pulsePlaying ? "Pause light signal" : "Play light signal"}>
            {pulsePlaying ? "Pause signal" : pulse >= 1 ? "Replay signal" : "Send light signal"}
          </button>
          <span className="causal-motion-note">{reducedMotion ? "reduced motion · signal shown instantly" : "bounded light-cone playback"}</span>
        </div>
      </div>

      <div className="causal-stage-wrap">
        <svg ref={svgRef} className="causal-diagram" viewBox="0 0 900 560" role="img"
          aria-labelledby="causal-diagram-title causal-diagram-desc"
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}>
          <title id="causal-diagram-title">Interactive Minkowski spacetime diagram</title>
          <desc id="causal-diagram-desc">
            ct is vertical and x is horizontal. Drag or keyboard-nudge events A and B. Filled wedges show the
            future and past light cones of A; dashed cyan and amber lines show the boosted frame axes.
          </desc>
          <defs>
            <clipPath id="causal-plot-clip">
              <rect x={CAUSAL_PLOT.left} y={CAUSAL_PLOT.top}
                width={CAUSAL_PLOT.right - CAUSAL_PLOT.left}
                height={CAUSAL_PLOT.bottom - CAUSAL_PLOT.top}></rect>
            </clipPath>
            <linearGradient id="causal-future-fill" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={QGA_TOKENS.alpha("accent", 0.22)}></stop>
              <stop offset="100%" stopColor={QGA_TOKENS.alpha("accent-2", 0.03)}></stop>
            </linearGradient>
            <linearGradient id="causal-past-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={QGA_TOKENS.alpha("signal-warm", 0.03)}></stop>
              <stop offset="100%" stopColor={QGA_TOKENS.alpha("signal-warm", 0.18)}></stop>
            </linearGradient>
            <filter id="causal-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur"></feGaussianBlur>
              <feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
            </filter>
          </defs>
          <rect width="900" height="560" className="causal-sky"></rect>
          <g clipPath="url(#causal-plot-clip)">
            <rect x={CAUSAL_PLOT.left} y={CAUSAL_PLOT.top}
              width={CAUSAL_PLOT.right - CAUSAL_PLOT.left}
              height={CAUSAL_PLOT.bottom - CAUSAL_PLOT.top}
              className="causal-plot-bg"></rect>
            {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((value) => (
              <g key={`grid-${value}`}>
                <line x1={screenX(value)} y1={CAUSAL_PLOT.top} x2={screenX(value)} y2={CAUSAL_PLOT.bottom}
                  className={value === 0 ? "causal-axis" : "causal-grid-line"}></line>
                <line x1={CAUSAL_PLOT.left} y1={screenCt(value)} x2={CAUSAL_PLOT.right} y2={screenCt(value)}
                  className={value === 0 ? "causal-axis" : "causal-grid-line"}></line>
              </g>
            ))}

            <polygon points={`${pointString(eventA)} ${pointString(futureLeft)} ${pointString(futureRight)}`}
              fill="url(#causal-future-fill)"></polygon>
            <polygon points={`${pointString(eventA)} ${pointString(pastLeft)} ${pointString(pastRight)}`}
              fill="url(#causal-past-fill)"></polygon>
            {[futureLeft, futureRight, pastLeft, pastRight].map((end, index) => (
              <line key={`null-${index}`} x1={screenX(eventA.x)} y1={screenCt(eventA.ct)}
                x2={screenX(end.x)} y2={screenCt(end.ct)} className="causal-null-boundary"></line>
            ))}

            <line x1={screenX(-2.7)} y1={screenCt(-4)} x2={screenX(-2.7)} y2={screenCt(4)}
              className="causal-worldline causal-worldline-stationary"></line>
            {[-3, -2, -1, 0, 1, 2, 3].map((ct) => (
              <line key={`stationary-tick-${ct}`} x1={screenX(-2.7) - 7} y1={screenCt(ct)}
                x2={screenX(-2.7) + 7} y2={screenCt(ct)} className="causal-proper-tick"></line>
            ))}
            <line x1={screenX(observerX(-4))} y1={screenCt(-4)}
              x2={screenX(observerX(4))} y2={screenCt(4)}
              className="causal-worldline causal-worldline-inertial"></line>
            {observerTicks.map((ct) => (
              <circle key={`observer-tick-${ct}`} cx={screenX(observerX(ct))} cy={screenCt(ct)}
                r="2.8" className="causal-inertial-tick"></circle>
            ))}

            <line x1={screenX(xPrimeNegative.x)} y1={screenCt(xPrimeNegative.ct)}
              x2={screenX(xPrimePositive.x)} y2={screenCt(xPrimePositive.ct)}
              className="causal-boost-axis causal-boost-x" data-testid="boosted-x-axis"></line>
            <line x1={screenX(ctPrimeNegative.x)} y1={screenCt(ctPrimeNegative.ct)}
              x2={screenX(ctPrimePositive.x)} y2={screenCt(ctPrimePositive.ct)}
              className="causal-boost-axis causal-boost-ct" data-testid="boosted-ct-axis"></line>

            {activePreset === "twin" ? (
              <g className="causal-twin-path">
                <line x1={screenX(eventA.x)} y1={screenCt(eventA.ct)}
                  x2={screenX(twinTurn.x)} y2={screenCt(twinTurn.ct)}></line>
                <line x1={screenX(twinTurn.x)} y1={screenCt(twinTurn.ct)}
                  x2={screenX(eventB.x)} y2={screenCt(eventB.ct)}></line>
                <circle cx={screenX(twinTurn.x)} cy={screenCt(twinTurn.ct)} r="5"></circle>
              </g>
            ) : null}

            <line x1={screenX(eventA.x)} y1={screenCt(eventA.ct)}
              x2={screenX(eventB.x)} y2={screenCt(eventB.ct)}
              className="causal-event-link"></line>
            <line x1={screenX(transformedA.deltaXPrime)} y1={screenCt(transformedA.deltaCtPrime)}
              x2={screenX(transformedB.deltaXPrime)} y2={screenCt(transformedB.deltaCtPrime)}
              className="causal-transformed-link" data-testid="transformed-event-link"></line>
            {[["A′", transformedA], ["B′", transformedB]].map(([label, point]) => (
              <g key={label} className="causal-transformed-event">
                <circle cx={screenX(point.deltaXPrime)} cy={screenCt(point.deltaCtPrime)} r="6"></circle>
                <text x={screenX(point.deltaXPrime) + 9} y={screenCt(point.deltaCtPrime) + 4}>{label}</text>
              </g>
            ))}

            {pulse > 0 ? (
              <g className="causal-signal" filter="url(#causal-glow)">
                <line x1={screenX(eventA.x)} y1={screenCt(eventA.ct)}
                  x2={screenX(signalPoint.x)} y2={screenCt(signalPoint.ct)}></line>
                <circle cx={screenX(signalPoint.x)} cy={screenCt(signalPoint.ct)} r="5"></circle>
              </g>
            ) : null}

            {(["A", "B"]).map((label) => {
              const worldEvent = label === "A" ? eventA : eventB;
              const active = selected === label;
              return (
                <g key={label} className={"causal-event" + (active ? " selected" : "")}
                  role="button" tabIndex="0"
                  aria-label={`Event ${label}: ct ${worldEvent.ct.toFixed(2)}, x ${worldEvent.x.toFixed(2)}. Drag or use arrow keys.`}
                  onFocus={() => setSelected(label)}
                  onKeyDown={(event) => nudgeEvent(label, event)}
                  onPointerDown={(event) => pointerDown(label, event)}>
                  <circle cx={screenX(worldEvent.x)} cy={screenCt(worldEvent.ct)} r={active ? 12 : 9}></circle>
                  <circle cx={screenX(worldEvent.x)} cy={screenCt(worldEvent.ct)} r={active ? 20 : 16}
                    className="causal-event-hit"></circle>
                  <text x={screenX(worldEvent.x) + 15} y={screenCt(worldEvent.ct) - 12}>{label}</text>
                </g>
              );
            })}
          </g>

          {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((value) => (
            <g key={`labels-${value}`} className="causal-axis-labels">
              <text x={screenX(value)} y={CAUSAL_PLOT.bottom + 24}>{value}</text>
              {value === 0 ? null : <text x={CAUSAL_PLOT.left - 16} y={screenCt(value) + 4}>{value}</text>}
            </g>
          ))}
          <text x={CAUSAL_PLOT.right - 2} y={CAUSAL_PLOT.bottom + 42} className="causal-axis-title">x · light-seconds</text>
          <text x={CAUSAL_PLOT.left - 46} y={CAUSAL_PLOT.top + 4} className="causal-axis-title">ct</text>
          <text x={screenX(-2.7) + 8} y={CAUSAL_PLOT.top + 18} className="causal-worldline-label">stationary observer · Δτ ticks</text>
          <text x={screenX(observerX(3.4)) - 132} y={screenCt(3.4) - 10} className="causal-worldline-label">inertial observer · equal Δτ ticks</text>
          <text x={CAUSAL_PLOT.right - 58} y={screenCt(animatedBeta * 3.6) - 8} className="causal-boost-label causal-boost-x-label">x′</text>
          <text x={screenX(animatedBeta * 3.55) + 8} y={CAUSAL_PLOT.top + 18} className="causal-boost-label causal-boost-ct-label">ct′</text>
          <text x={CAUSAL_PLOT.right - 92} y={CAUSAL_PLOT.top + 20} className="causal-cone-label">future cone of A</text>
          <text x={CAUSAL_PLOT.right - 82} y={CAUSAL_PLOT.bottom - 14} className="causal-cone-label">past cone of A</text>
        </svg>
        <div className="causal-diagram-legend" aria-label="Diagram legend">
          <span><i className="legend-event"></i>events A/B</span>
          <span><i className="legend-transform"></i>boosted A′/B′</span>
          <span><i className="legend-null"></i>null boundary</span>
          <span><i className="legend-xprime"></i>x′ axis</span>
          <span><i className="legend-ctprime"></i>ct′ axis</span>
        </div>
      </div>

      <div className="causal-event-controls">
        <div className="causal-coordinate-group">
          <strong>Event A</strong>
          <CausalCoordinateInput eventName="A" axis="ct" value={eventA.ct}
            onChange={(value) => updateEvent("A", value, eventA.x, false)}></CausalCoordinateInput>
          <CausalCoordinateInput eventName="A" axis="x" value={eventA.x}
            onChange={(value) => updateEvent("A", eventA.ct, value, false)}></CausalCoordinateInput>
        </div>
        <div className="causal-coordinate-group">
          <strong>Event B</strong>
          <CausalCoordinateInput eventName="B" axis="ct" value={eventB.ct}
            onChange={(value) => updateEvent("B", value, eventB.x, false)}></CausalCoordinateInput>
          <CausalCoordinateInput eventName="B" axis="x" value={eventB.x}
            onChange={(value) => updateEvent("B", eventB.ct, value, false)}></CausalCoordinateInput>
        </div>
        <p className="causal-preset-note">{presetNote}</p>
      </div>

      <div className="kerr-deck causal-readout-deck">
        <section className="kerr-rgroup">
          <header><h4>Invariant diagnosis</h4><span>exact · c = 1 · signature (−,+,+,+)</span></header>
          <div className="kerr-rgrid">
            <div className="kerr-readout lead"><div className="kerr-readout-label">separation</div>
              <div className="kerr-readout-value">{classification.type}</div>
              <div className="kerr-readout-formula"><Eq tex={"\\Delta s^2 " + (interval < 0 ? "<" : interval > 0 ? ">" : "=") + " 0"}></Eq></div></div>
            <div className="kerr-readout"><div className="kerr-readout-label">Δct / Δx</div>
              <div className="kerr-readout-value">{deltaCt.toFixed(3)} / {deltaX.toFixed(3)}</div>
              <div className="kerr-readout-formula">B − A in frame S</div></div>
            <div className="kerr-readout lead"><div className="kerr-readout-label">invariant interval</div>
              <div className="kerr-readout-value">{interval.toFixed(4)}</div>
              <div className="kerr-readout-formula">light-seconds²</div></div>
            <div className="kerr-readout"><div className="kerr-readout-label">proper time Δτ</div>
              <div className="kerr-readout-value">{Number.isFinite(proper) ? proper.toFixed(4) : "not defined"}</div>
              <div className="kerr-readout-formula">{Number.isFinite(proper) ? "timelike pair · seconds" : "requires Δs² < 0"}</div></div>
            <div className="kerr-readout"><div className="kerr-readout-label">S′ interval residual</div>
              <div className="kerr-readout-value">{invariantResidual.toExponential(1)}</div>
              <div className="kerr-readout-formula"><Eq tex="\Delta s'^2 - \Delta s^2"></Eq> · floating-point</div></div>
            <div className="kerr-readout"><div className="kerr-readout-label">simultaneity frame</div>
              <div className="kerr-readout-value">{simultaneityBeta == null ? "none" : `β = ${simultaneityBeta.toFixed(4)}`}</div>
              <div className="kerr-readout-formula">exists only for spacelike Δx ≠ 0</div></div>
          </div>
        </section>
        <section className="kerr-rgroup">
          <header><h4>Lorentz frame S′</h4><span>exact target values · animation is presentation only</span></header>
          <div className="kerr-rgrid">
            <div className="kerr-readout lead"><div className="kerr-readout-label">β / γ</div>
              <div className="kerr-readout-value">{beta.toFixed(3)} / {gamma.toFixed(4)}</div>
              <div className="kerr-readout-formula"><Eq tex="|\beta| \le 0.95"></Eq></div></div>
            <div className="kerr-readout"><div className="kerr-readout-label">Δct′ / Δx′</div>
              <div className="kerr-readout-value">{transform.deltaCtPrime.toFixed(3)} / {transform.deltaXPrime.toFixed(3)}</div>
              <div className="kerr-readout-formula">Lorentz transformed pair</div></div>
            <div className="kerr-readout"><div className="kerr-readout-label">event A′</div>
              <div className="kerr-readout-value">
                {window.QGA_PHYSICS.lorentzTransform({ deltaCt: eventA.ct, deltaX: eventA.x, beta }).deltaCtPrime.toFixed(2)}
                {" · "}
                {window.QGA_PHYSICS.lorentzTransform({ deltaCt: eventA.ct, deltaX: eventA.x, beta }).deltaXPrime.toFixed(2)}
              </div>
              <div className="kerr-readout-formula">ct′ · x′</div></div>
            <div className="kerr-readout"><div className="kerr-readout-label">event B′</div>
              <div className="kerr-readout-value">
                {window.QGA_PHYSICS.lorentzTransform({ deltaCt: eventB.ct, deltaX: eventB.x, beta }).deltaCtPrime.toFixed(2)}
                {" · "}
                {window.QGA_PHYSICS.lorentzTransform({ deltaCt: eventB.ct, deltaX: eventB.x, beta }).deltaXPrime.toFixed(2)}
              </div>
              <div className="kerr-readout-formula">ct′ · x′</div></div>
            <div className="kerr-readout causal-order-readout"><div className="kerr-readout-label">causal-order verdict</div>
              <div className="kerr-readout-value">{orderReversed ? "reversed" : simultaneousNow ? "simultaneous" : "preserved"}</div>
              <div className="kerr-readout-formula">{orderMessage}</div></div>
            {activePreset === "twin" ? (
              <div className="kerr-readout"><div className="kerr-readout-label">twin-style Δτ</div>
                <div className="kerr-readout-value">{twinHomeTime.toFixed(3)} / {twinTravelerTime.toFixed(3)}</div>
                <div className="kerr-readout-formula">home / piecewise traveler · turnaround schematic</div></div>
            ) : null}
          </div>
        </section>
      </div>

      <section className="causal-formulation" aria-label="Live causal spacetime equations">
        <header>
          <div><span className="causal-panel-id">FORM / 01</span><h4>Live mathematical formulation</h4></div>
          <span>exact substitutions · natural diagram units</span>
        </header>
        <div className="causal-equation-grid">
          <div><span>Invariant interval</span><Eq tex={`\\Delta s^2 = -c^2\\Delta t^2 + \\Delta x^2 = -(${deltaCt.toFixed(3)})^2 + (${deltaX.toFixed(3)})^2 = ${interval.toFixed(4)}`} display={true}></Eq></div>
          <div><span>Lorentz factor</span><Eq tex={`\\gamma = \\frac{1}{\\sqrt{1-\\beta^2}} = \\frac{1}{\\sqrt{1-(${beta.toFixed(3)})^2}} = ${gamma.toFixed(4)}`} display={true}></Eq></div>
          <div><span>Boosted time separation</span><Eq tex={`\\Delta ct' = \\gamma(\\Delta ct-\\beta\\Delta x) = ${gamma.toFixed(4)}[${deltaCt.toFixed(3)}-(${beta.toFixed(3)})(${deltaX.toFixed(3)})] = ${transform.deltaCtPrime.toFixed(4)}`} display={true}></Eq></div>
          <div><span>Boosted spatial separation</span><Eq tex={`\\Delta x' = \\gamma(\\Delta x-\\beta\\Delta ct) = ${gamma.toFixed(4)}[${deltaX.toFixed(3)}-(${beta.toFixed(3)})(${deltaCt.toFixed(3)})] = ${transform.deltaXPrime.toFixed(4)}`} display={true}></Eq></div>
          <div><span>Proper time</span><Eq tex={Number.isFinite(proper)
            ? `\\Delta\\tau = \\sqrt{-\\Delta s^2}/c = \\sqrt{${(-interval).toFixed(4)}} = ${proper.toFixed(4)}`
            : "\\Delta\\tau\\;\\text{is defined here only for timelike separation }(\\Delta s^2<0)"} display={true}></Eq></div>
        </div>
        <p className="causal-equation-note">
          Convention: metric signature (−,+,+,+). The diagram plots <strong>ct</strong> and <strong>x</strong> in
          light-seconds and sets <strong>c = 1 light-second per second</strong>; therefore numerical ct values equal
          seconds while interval values are light-seconds².
        </p>
      </section>

      <div className="causal-validity-grid">
        <section>
          <span className="badge badge-established">Established</span>
          <h4>What is exact</h4>
          <p>Lorentz transformations, interval classification, null-cone boundaries, inertial worldlines, and proper-time sums for timelike inertial segments in 1+1D flat spacetime.</p>
        </section>
        <section>
          <span className="badge badge-schematic">Schematic</span>
          <h4>What is presentation</h4>
          <p>Glow, event pulses, the bounded signal trace, and the twin preset's instantaneous turnaround marker. Animation never supplies a number used by the exact readouts.</p>
        </section>
        <section>
          <span className="badge badge-open">Out of scope</span>
          <h4>What is not simulated</h4>
          <p>No gravity, curvature, acceleration history, geodesic deviation, expanding universe, uncertainty model, or black-hole spacetime. This is a flat-spacetime foundation for GR.</p>
        </section>
      </div>
      <VizCaption provenanceId="gr-simultaneity" status="effective">
        Drag A or B, use their arrow-key controls, choose a documented preset, or change β. The solid event pair is
        frame S; the faint A′/B′ pair and dashed axes are frame S′. Timelike order and null connection are invariant.
        Only a spacelike pair can become simultaneous or reverse coordinate-time order. URL state stores both events,
        β and the selected preset; invalid coordinates fall back to the documented defaults.
      </VizCaption>
    </div>
  );
}

/* ---------- 3D spacetime curvature engine ---------- */
// Impact parameters for the lensing fan (symmetric — focuses behind the mass).
// The inner pair sits inside the capture cone (b < b_crit) so the fan shows both
// escape and capture; the outer pairs sample the weak-field limit.
const GR_RAY_B = [-3.3, -2.2, -1.25, -0.45, 0.45, 1.25, 2.2, 3.3];
// scene c² = (5.2)²; matches GR_ENGINE_C2 in js/physics.mjs.
const GR_C2 = 27.04;
const GR_BODY_PALETTE = [QGA_TOKENS.hex("pigment-cyan-85"), QGA_TOKENS.hex("pigment-orange-79"), QGA_TOKENS.hex("pigment-violet-73-c17"), QGA_TOKENS.hex("pigment-green-84"), QGA_TOKENS.hex("pigment-pink-78"), QGA_TOKENS.hex("pigment-amber-91")];
const GR_MAX_BODIES = 6;
// Cinematic camera framing per scenario (Scene3D glides the orbit rig).
const GR_CAMERA = {
  classic: { radius: 17, theta: 0.4, phi: 1.08 },
  mercury: { radius: 15, theta: 0.5, phi: 1.0 },
  comet: { radius: 18, theta: 0.35, phi: 1.15 },
  resonance: { radius: 16, theta: 0.6, phi: 1.0 },
  cluster: { radius: 20, theta: 0.45, phi: 0.95 },
  plunge: { radius: 15, theta: 0.55, phi: 1.05 },
  whirl: { radius: 12.5, theta: 0.5, phi: 1.22 },
};
let grUidSeed = 0;

// Scenario preset bodies → editable runtime bodies (uids keep sim state stable
// across React re-renders; the scene loop re-syncs by uid, not index).
function grMakeBodies(scenarioId) {
  const s = window.QGA_PHYSICS.grCurvatureScenario(scenarioId);
  return s.bodies.map((b, i) => ({
    uid: "b" + (grUidSeed++),
    free: !!b.free,
    a: b.a, e: b.e, phase: b.phase, peri: b.peri,
    incl: b.incl != null ? b.incl : (i % 2 ? 0.05 : -0.04),
    x0: b.x0, y0: b.y0, vx0: b.vx0, vy0: b.vy0,
    hex: GR_BODY_PALETTE[i % GR_BODY_PALETTE.length],
    r: b.free ? 0.15 : 0.2 - i * 0.015,
  }));
}

function grPrecDeg(M, a, e) {
  return window.QGA_PHYSICS.grPerihelionPrecession(0.55 * M, GR_C2, a, e) * 180 / Math.PI;
}

/* Effective-potential panel: V_eff(r) = −GM/r + L²/2r² − GM·L²/c²r³ for the
   selected body, GR vs Newtonian, with photon-sphere / ISCO markers, the
   energy line, turning points, and a live radius marker driven by the scene
   loop through stRef (no per-frame React renders). */

/* ── Effective-potential panel ───────────────────────────────────────────────
   V_eff(r) = −GM/r + L²/2r² − GM·L²/c²r³ for the selected body, GR against
   Newtonian. The y-window is derived from the well itself instead of a fixed
   clamp: a fixed range made the curve a flat line whenever the 1/r² term
   dominated the left edge. Turning points are found by root-finding V = E, not
   from the Newtonian a(1±e), which is wrong once the r⁻³ term matters. */
function VEffPanel({ mass, body, view, stRef }) {
  const dotRef = useRef(null);
  const P = window.QGA_PHYSICS;
  const gm = 0.55 * mass;
  const rPh = P.grPhotonSphereRadius(gm, GR_C2);
  const rIsco = P.grIscoRadius(gm, GR_C2);
  const rs = 2 * gm / GR_C2;
  const bound = body && !body.free;
  const a = bound ? body.a : 3;
  const e = bound ? body.e : 0;
  const L2 = gm * a * (1 - e * e);
  const L = Math.sqrt(L2);
  const E = -gm / (2 * a);

  const V = (r) => P.grEffectivePotential(gm, GR_C2, L, r);
  const VN = (r) => -gm / r + L2 / (2 * r * r);

  // Scan only outside the photon sphere: the r⁻³ term diverges at the origin,
  // so a scan that reaches r → 0 reports a "minimum" of −10³ and flattens the
  // real well into a straight line.
  const rScanLo = 1.02 * rPh;
  const rScanHi = Math.max(a * (1 + e) * 2.2, 7);
  const NS = 400;
  const scan = [];
  for (let i = 0; i <= NS; i++) {
    const r = rScanLo + (rScanHi - rScanLo) * i / NS;
    scan.push([r, V(r)]);
  }
  let rAtMin = rScanLo, vAtMin = Infinity;
  for (const s of scan) if (s[1] < vAtMin) { vAtMin = s[1]; rAtMin = s[0]; }

  const roots = [];
  for (let i = 1; i < scan.length; i++) {
    const f0 = scan[i - 1][1] - E, f1 = scan[i][1] - E;
    if (f0 === 0) { roots.push(scan[i - 1][0]); continue; }
    if (f0 * f1 >= 0) continue;
    let lo = scan[i - 1][0], hi = scan[i][0];
    for (let k = 0; k < 48; k++) {
      const mid = 0.5 * (lo + hi);
      if ((V(lo) - E) * (V(mid) - E) <= 0) hi = mid; else lo = mid;
    }
    roots.push(0.5 * (lo + hi));
  }
  const rPeri = roots.length ? roots[0] : a * (1 - e);
  const rApo = roots.length > 1 ? roots[roots.length - 1] : a * (1 + e);

  const rMin = Math.max(0.60 * rPh, Math.min(0.80 * rPeri, 0.92 * rAtMin, 0.98 * rIsco));
  const rMax = Math.min(rScanHi, Math.max(1.55 * rApo, 1.9 * rAtMin, rMin * 2.4));

  // Frame the window that is actually drawn, not the scan range.
  let vMin = Infinity, vTop = -Infinity;
  for (let i = 0; i <= 200; i++) {
    const v = V(rMin + (rMax - rMin) * i / 200);
    if (v < vMin) vMin = v;
    if (v > vTop) vTop = v;
  }
  if (bound) vTop = Math.max(vTop, E);
  const span = Math.max(1e-6, vTop - vMin);
  // A finer ladder for the value axis keeps five ticks on every scenario; the
  // radius axis keeps the classic ladder so its labels stay 1, 2, 3, 4.
  const niceStep = (raw, ladder) => {
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    return ladder.map((m) => m * mag).find((s) => s >= raw) || raw;
  };
  const NICE_V = [1, 1.5, 2, 2.5, 3, 4, 5, 10];
  const NICE_R = [1, 2, 2.5, 5, 10];
  // Frame the curve that is actually drawn. The Newtonian branch has no r^-3
  // term, so near the star it sits far above the GR well; reserving room for it
  // pushed the well into the bottom half of the plot. Let it leave the frame
  // instead — its divergence is the point — and land the top edge on a round
  // value so the axis reads cleanly.
  const yLo = vMin - 0.16 * span;
  const yTopRaw = vTop + 0.14 * span;
  const yStep = niceStep((yTopRaw - yLo) / 5, NICE_V);
  // Land the top edge on a round value, but on a finer grid than the ticks so
  // the rounding cannot re-open the headroom it was meant to close.
  const ySub = yStep / 5;
  const yHi = Math.ceil(yTopRaw / ySub) * ySub;

  const NPT = 200;
  const rs_ = [], gr_ = [], newton_ = [];
  for (let i = 0; i <= NPT; i++) {
    const r = rMin + (rMax - rMin) * i / NPT;
    rs_.push(r); gr_.push(V(r)); newton_.push(VN(r));
  }
  const hex = body ? "#" + body.hex.toString(16).padStart(6, "0") : QGA_TOKENS.css("pigment-cyan-85");
  const inRange = (r) => r > rMin && r < rMax;
  const marks = [
    { r: rs, color: "pigment-red-76", tex: "r_s" },
    { r: rPh, color: "pigment-violet-65-c16", tex: "r_{\\mathrm{ph}}" },
    { r: rIsco, color: "pigment-cyan-77", tex: "r_{\\mathrm{ISCO}}" },
  ].filter((m) => inRange(m.r));
  const liveR = Math.min(Math.max(rPeri, rMin), rMax);
  const spec = useMemo(() => window.QGA_FIGURE.plots.gr.effectivePotentialSpec({
    r: rs_, gr: gr_, newton: newton_, rDomain: [rMin, rMax], vDomain: [yLo, yHi], marks,
    energy: bound ? E : null,
    turning: bound ? [{ r: rPeri, tex: "r_{\\mathrm{peri}}" }, { r: rApo, tex: "r_{\\mathrm{apo}}" }].filter((t) => inRange(t.r)) : [],
    view,
  }), [mass, a, e, bound, view]); // eslint-disable-line

  // Live radius marker: moved by the scene loop through stRef; no per-frame React renders.
  const sceneRef = useRef(null);
  useEffect(() => {
    const id = setInterval(() => {
      const el = dotRef.current, sc = sceneRef.current;
      if (!el || !sc) return;
      const r = Math.min(Math.max(stRef.current.selR || 0, rMin), rMax);
      el.style.left = sc.sx.map(r).toFixed(1) + "px";
      el.style.top = sc.sy.map(V(r)).toFixed(1) + "px";
    }, 160);
    return () => clearInterval(id);
  }, [stRef, mass, a, e]); // eslint-disable-line

  return (
    <div className="veff-wrap">
      <div className="panel-head">
        <span>Effective potential</span>
        <em>V_eff(r) · selected orbit</em>
      </div>
      <Figure spec={spec} extra={(sc) => {
        sceneRef.current = sc;
        return bound ? <i ref={dotRef} className="fig-live-dot" style={{ left: sc.sx.map(liveR), top: sc.sy.map(V(liveR)) }}></i> : null;
      }}>
        <Eq tex="V_{\mathrm{eff}}=-\frac{GM}{r}+\frac{L^{2}}{2r^{2}}-\frac{GM\,L^{2}}{c^{2}r^{3}}"></Eq>
        <span className="dim"> · GR against Newtonian; the live marker is the selected body's radius.</span>
      </Figure>
    </div>
  );
}

/* The null-geodesic panel (paths, travelling photons and the playback clock) is js/labs/null-geodesic-panel.jsx. */

/* The lensed-sky ray trace (lens model, procedural sky, per-pixel render) lives in js/visualizations/gr/lensed-sky.mjs (S07). */
const { ngTextures, ngLensModel: lensModelFor, renderLensedSky } = window.QGA_GR.lensedSky;
const ngLensModel = (mass) => lensModelFor(mass, window.QGA_PHYSICS, GR_C2);
const NG_MODES = [["sky", "Sky"], ["grid", "Grid"], ["flat", "Unlensed"]];
function LensedSkyPanel({ mass }) {
  const image = useMemo(() => Object.assign(document.createElement("canvas"), { width: 720, height: 720 }), []);
  const [mode, setMode] = useState("sky");
  const [painted, setPainted] = useState(0);
  const tex = useMemo(() => ngTextures(), []);
  const L = useMemo(() => ngLensModel(mass), [mass]);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      renderLensedSky(image, L, mode === "grid" ? tex.grid : tex.sky, mode !== "flat");
      setPainted((v) => v + 1);
    });
    return () => cancelAnimationFrame(raf);
  }, [L, tex, mode, image]);
  const spec = useMemo(() => window.QGA_FIGURE.plots.gr.lensFrameSpec({
    thetaShadow: L.thetaShadow, thetaE: L.thetaE, fov: L.FOV, lensed: mode !== "flat",
  }), [L, mode]);
  return (
    <div className="lens-wrap">
      <div className="panel-head">
        <span>Lensed sky</span>
        <div className="lens-modes" role="group" aria-label="Lensed sky view">
          {NG_MODES.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={mode === k}
              className={"lens-mode" + (mode === k ? " is-on" : "")}
              onClick={() => setMode(k)}>{label}</button>
          ))}
        </div>
      </div>
      <Figure spec={spec} backdropKey={painted}
        backdrop={(ctx, plot) => { if (painted) ctx.drawImage(image, plot.x, plot.y, plot.w, plot.h); }}>
        <span className="lens-note">α(b) integrated per pixel · FOV = 2.5 θ_E</span>
      </Figure>
    </div>
  );
}


function CurvatureEngine() {
  const [mass, setMass] = useState(5);
  const [view, setView] = useState("gr"); // 'gr' | 'newton'
  const [showRay, setShowRay] = useState(true);
  const massRef = useRef(mass); massRef.current = mass;
  const viewRef = useRef(view); viewRef.current = view;
  const rayRef = useRef(showRay); rayRef.current = showRay;
  const prm = usePRM();

  // physics state (plane coordinates, world units): orbiting particle + photon
  const stRef = useRef(null);
  const initState = () => {
    stRef.current = {
      p: { x: 0, y: -3.2, vx: 1.45, vy: 0 },          // test particle
      ray: { x: -7.5, y: -1.7, vx: 5.2, vy: 0, trail: [] },
      ptrail: [],
    };
  };
  if (!stRef.current) initState();

  const sim = useSimLoop((ctx, w, h, t, dt) => {
    const M = massRef.current;
    const st = stRef.current;
    const GM = 0.55 * M;
    // --- integrate test particle (Newtonian + schematic precession term in GR view) ---
    const sub = 6, sdt = Math.min(dt, 0.04) / sub;
    for (let s = 0; s < sub; s++) {
      const p = st.p;
      const r2 = p.x * p.x + p.y * p.y, r = Math.sqrt(r2) + 1e-6;
      if (r > 0.45) {
        const L2 = Math.pow(p.x * p.vy - p.y * p.vx, 2);
        const corr = viewRef.current === "gr" ? (1 + 0.18 * GM * L2 / (r2 * r2 + 1e-9)) : 1; // schematic 1/r⁴ GR-style correction
        const a = -GM * corr / (r2 * r + 1e-9);
        p.vx += a * p.x * sdt * 60; p.vy += a * p.y * sdt * 60;
        p.x += p.vx * sdt * 60 * 0.016; p.y += p.vy * sdt * 60 * 0.016;
      }
      // photon
      if (rayRef.current) {
        const q = st.ray;
        const qr2 = q.x * q.x + q.y * q.y, qr = Math.sqrt(qr2) + 1e-6;
        if (qr > 0.4) {
          const af = -2 * GM / (qr2 * qr) * 0.5; // factor-2 light deflection, schematic
          q.vx += af * q.x * sdt * 60; q.vy += af * q.y * sdt * 60;
          const vn = Math.hypot(q.vx, q.vy); q.vx *= 5.2 / vn; q.vy *= 5.2 / vn; // photons keep |v|=c
          q.x += q.vx * sdt * 60 * 0.016; q.y += q.vy * sdt * 60 * 0.016;
        }
        if (q.x > 8.5 || Math.abs(q.y) > 6 || qr <= 0.42) {
          q.x = -7.5; q.y = -1.7; q.vx = 5.2; q.vy = 0; q.trail = [];
        }
        q.trail.push({ x: q.x, y: q.y });
        if (q.trail.length > 240) q.trail.shift();
      }
    }
    if (dt > 0) {
      st.ptrail.push({ x: st.p.x, y: st.p.y });
      if (st.ptrail.length > 300) st.ptrail.shift();
    }

    // --- render: project plane (x,y) + depth z(x,y) into screen ---
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.46, sc = Math.min(w, h * 1.6) / 17;
    const depth = (x, y) => {
      const r = Math.hypot(x, y);
      return viewRef.current === "gr" ? -1.9 * GM / Math.sqrt(r * r + 0.55) : 0;
    };
    const P = (x, y) => {
      const z = depth(x, y);
      return [cx + x * sc, cy + y * sc * 0.5 - z * sc * 0.55];
    };
    // grid
    const R = 8;
    ctx.lineWidth = 1;
    for (let gy = -R; gy <= R; gy++) {
      ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-64", (0.07 + 0.06 * (1 - Math.abs(gy) / R)).toFixed(3));
      ctx.beginPath();
      for (let gx = -R; gx <= R; gx += 0.25) {
        const [px, py] = P(gx, gy);
        if (gx === -R) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    for (let gx = -R; gx <= R; gx++) {
      ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-64", (0.07 + 0.06 * (1 - Math.abs(gx) / R)).toFixed(3));
      ctx.beginPath();
      for (let gy = -R; gy <= R; gy += 0.25) {
        const [px, py] = P(gx, gy);
        if (gy === -R) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // central mass
    const [mx, my] = P(0, 0);
    const mr = 7 + M * 1.6;
    const grad = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 2.4);
    grad.addColorStop(0, QGA_TOKENS.alpha("pigment-amber-90", 0.95));
    grad.addColorStop(0.4, QGA_TOKENS.alpha("pigment-amber-79", 0.5));
    grad.addColorStop(1, QGA_TOKENS.alpha("pigment-amber-79", 0));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(mx, my, mr * 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = QGA_TOKENS.css("pigment-amber-93");
    ctx.beginPath(); ctx.arc(mx, my, mr * 0.55, 0, Math.PI * 2); ctx.fill();
    // particle trail + body
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-cyan-78", 0.5); ctx.lineWidth = 1.5; ctx.beginPath();
    st.ptrail.forEach((q, i) => { const [px, py] = P(q.x, q.y); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
    ctx.stroke();
    const [ppx, ppy] = P(st.p.x, st.p.y);
    ctx.fillStyle = QGA_TOKENS.css("pigment-cyan-78");
    ctx.beginPath(); ctx.arc(ppx, ppy, 4.5, 0, Math.PI * 2); ctx.fill();
    // Newton view: draw force vector; GR view: label geodesic
    ctx.font = QGA_TOKENS.monoPx(10);
    if (viewRef.current === "newton") {
      const r = Math.hypot(st.p.x, st.p.y) + 1e-6;
      const fx = -st.p.x / r, fy = -st.p.y / r;
      const [tx, ty] = P(st.p.x + fx * 1.3, st.p.y + fy * 1.3);
      ctx.strokeStyle = QGA_TOKENS.css("pigment-red-70"); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(ppx, ppy); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = QGA_TOKENS.css("pigment-red-70");
      ctx.fillText("F = −GMm r̂ / r²  (force picture)", ppx + 10, ppy - 10);
    } else {
      ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-81", 0.8);
      ctx.fillText("geodesic — no force, curved geometry", ppx + 10, ppy - 10);
    }
    // light ray
    if (rayRef.current) {
      const q = st.ray;
      ctx.strokeStyle = QGA_TOKENS.css("pigment-amber-80"); ctx.lineWidth = 1.8; ctx.beginPath();
      q.trail.forEach((pt, i) => { const [px, py] = P(pt.x, pt.y); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
      ctx.stroke();
      const [lx, ly] = P(q.x, q.y);
      ctx.fillStyle = QGA_TOKENS.css("pigment-amber-80");
      ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillText("light ray", lx + 8, ly + 4);
    }
  }, [prm]);

  return (
    <div className="viz-frame">
      <div className="viz-toolbar">
        <SliderRow label="mass M" min={1} max={10} step={0.1} value={mass} onChange={setMass}
          format={(v) => v.toFixed(1)}></SliderRow>
        <span className="seg">
          <button className={"btn" + (view === "gr" ? " on" : "")} onClick={() => setView("gr")}>Relativistic geometry</button>
          <button className={"btn" + (view === "newton" ? " on" : "")} onClick={() => setView("newton")}>Newtonian intuition</button>
        </span>
        <Toggle label="light ray" checked={showRay} onChange={setShowRay}></Toggle>
      </div>
      <canvas ref={sim.canvasRef} className="viz-canvas" style={{ height: 380 }}></canvas>
      <SimBar sim={sim}>
        <button className="btn" onClick={() => { initState(); }}>Re-launch bodies</button>
      </SimBar>
      <VizCaption provenanceId="gr-curvature-2d" status="schematic">
        Embedding-diagram-style visualization (Flamm-paraboloid intuition), not a literal picture of 3D space.
        In the relativistic view the orbit precesses — the perihelion advance absent from Newtonian gravity —
        and the light ray bends by twice the Newtonian prediction, the effect that made general relativity famous in 1919.
        Curvature is sourced by the full energy–momentum tensor, not by mass alone.
      </VizCaption>
    </div>
  );
}

function ModuleGR({ go }) {
  return (
    <article>
      <ModuleHeader num="04" kicker="Gravity as geometry" title="General Relativity and Spacetime Geometry"
        lede="General relativity removes gravity from the list of forces. Mass-energy curves spacetime; freely falling bodies follow the straightest available paths through that curved geometry. The theory has passed every experimental test for over a century — and contains the seeds of its own breakdown."></ModuleHeader>

      <Section title="Causal spacetime laboratory">
        <p>
          General relativity inherits its local causal structure from special relativity. This flat-spacetime
          laboratory isolates that foundation: events, light cones, invariant intervals, inertial frames, proper
          time, and relativity of simultaneity. Its calculations are exact for 1+1-dimensional Minkowski spacetime;
          the curved-spacetime engine below addresses a different layer of the theory.
        </p>
        <CausalSpacetimeLab></CausalSpacetimeLab>
      </Section>

      <Section title="Conformal diagrams">
        <p>
          Where can light go? Explore exact conformal maps of flat spacetime and Schwarzschild, then compare them with
          a labelled schematic of a charged black-hole solution.
        </p>
        <PenroseAtlas></PenroseAtlas>
      </Section>

      <Section title="Tidal forces and observation">
        <TidalLab></TidalLab>
        <GRTestsPanel></GRTestsPanel>
      </Section>

      <Section title="The curvature engine">
        <p>
          Compare a schematic potential with an exact embedding of the Schwarzschild equatorial spatial slice.
          The orbit and light-ray models are shown separately and carry their own approximations.
        </p>
        <CurvatureEngine3D></CurvatureEngine3D>
        <div className="formula-grid" style={{ marginTop: 16 }}><NewtonianLimitCard></NewtonianLimitCard></div>
      </Section>

      <Section title="Mathematical formulation">
        <div className="formula-grid">
          <FormulaCard title="Einstein field equations" status="established"
            tex="G_{\mu\nu} + \Lambda g_{\mu\nu} = \frac{8\pi G}{c^4}\, T_{\mu\nu}"
            symbols={[
              { s: "G_{\\mu\\nu}", d: "Einstein tensor — a specific combination of curvature ($R_{\\mu\\nu}-\\tfrac12 R\\,g_{\\mu\\nu}$) that is automatically conserved." },
              { s: "g_{\\mu\\nu}", d: "Metric tensor: the dynamical field encoding distances, durations, and causal structure." },
              { s: "\\Lambda", d: "Cosmological constant; observations indicate a small positive value driving cosmic acceleration." },
              { s: "T_{\\mu\\nu}", d: "Energy–momentum tensor of matter and radiation — the source of curvature. Pressure and momentum flux gravitate, not just mass." },
            ]}
            meaning="Ten coupled nonlinear equations stating: geometry (left) is determined by energy-momentum content (right). Matter tells spacetime how to curve; spacetime tells matter how to move."
            limits="Classical field equations. They predict singularities (Penrose–Hawking theorems) where the description must fail — a primary motivation for quantum gravity."></FormulaCard>
          <FormulaCard title="Geodesic equation" status="established"
            tex="\frac{d^2 x^\mu}{d\tau^2} + \Gamma^{\mu}_{\alpha\beta}\,\frac{dx^\alpha}{d\tau}\frac{dx^\beta}{d\tau} = 0"
            symbols={[
              { s: "x^\\mu(\\tau)", d: "Worldline of the freely falling body, parameterized by proper time $\\tau$." },
              { s: "\\Gamma^{\\mu}_{\\alpha\\beta}", d: "Christoffel symbols — derivatives of the metric playing the role the 'gravitational field' plays in Newtonian language." },
            ]}
            meaning="The equation of motion for free fall: the curve of extremal proper time. No mass of the test body appears — the equivalence principle is built in."
            limits="Valid for test bodies whose own gravity is negligible; extended or self-gravitating bodies require corrections."></FormulaCard>
          <FormulaCard title="Einstein–Hilbert action" status="established"
            tex="S_{EH} = \frac{c^4}{16\pi G} \int R\, \sqrt{-g}\; d^4x"
            symbols={[
              { s: "R", d: "Ricci curvature scalar — the simplest invariant measure of curvature." },
              { s: "\\sqrt{-g}\\,d^4x", d: "Invariant spacetime volume element." },
              { s: "G", d: "Newton's constant. Its dimensions, $[G]=\\mathrm{energy}^{-2}$ in natural units, are the root of gravity's non-renormalizability (Module 05)." },
            ]}
            meaning="Varying this action with respect to the metric yields the Einstein field equations. Its form is what one attempts to quantize — by path integral, canonical methods, or otherwise."
            limits="Lowest-order term only; quantum corrections generate higher-curvature terms ($R^2$, …) suppressed by the Planck scale."></FormulaCard>
        </div>
      </Section>

      <Misconception title="Gravity is not a force in general relativity.">
        The 'rubber sheet' image is itself only an analogy — and a 2D embedding diagram of spatial curvature, at that.
        What the theory actually says: free-falling observers feel no force (they are inertial), and what we call
        gravitational attraction is the convergence of geodesics in curved spacetime. Time curvature, not space
        curvature, dominates everyday gravity.
      </Misconception>
      <ConceptBridge id="gr-planck" go={go}></ConceptBridge>
    </article>
  );
}
window.ModuleGR = ModuleGR;
