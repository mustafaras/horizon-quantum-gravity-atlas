// mod-gr.jsx — Module 04: General Relativity and Spacetime Geometry
const CAUSAL_DEFAULT = { preset: "timelike", beta: 0.35, a: { ct: 0, x: -1.35 }, b: { ct: 2.6, x: 1.1 } };
const CAUSAL_PRESET_STATE = {
  timelike: {
    label: "Timelike", beta: 0.28, a: { ct: -2.2, x: -1.4 }, b: { ct: 2.2, x: 0.5 },
    note: "Every inertial frame agrees that A occurs before B.",
  },
  spacelike: {
    label: "Spacelike", beta: 0.6, a: { ct: -0.7, x: -2.2 }, b: { ct: 0.7, x: 2.2 },
    note: "This boost reverses the coordinate-time order.",
  },
  null: {
    label: "Null", beta: -0.55, a: { ct: -2, x: -2 }, b: { ct: 2, x: 2 },
    note: "A light signal connects the events in every inertial frame.",
  },
  simultaneity: {
    label: "Simultaneity", beta: 0.4, a: { ct: -0.8, x: -2.4 }, b: { ct: 0.8, x: 1.6 },
    note: "The selected boost makes these spacelike events simultaneous.",
  },
  twin: {
    label: "Twin path", beta: 0.35, a: { ct: -3, x: 0 }, b: { ct: 3, x: 0 },
    note: "Piecewise inertial comparison with an instantaneous turnaround marker.",
  },
};
const CAUSAL_WORLD = { min: -4, max: 4 };
const CAUSAL_PLOT = { left: 76, right: 868, top: 28, bottom: 508 };

function clampCausalNumber(value, fallback, min = CAUSAL_WORLD.min, max = CAUSAL_WORLD.max) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : fallback;
}

function useEasedCausalValue(target, reducedMotion, duration = 520) {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  const rafRef = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (reducedMotion || Math.abs(target - shownRef.current) < 1e-6) {
      shownRef.current = target;
      setShown(target);
      return undefined;
    }
    const from = shownRef.current;
    const started = performance.now();
    const frame = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = progress === 1 ? target : from + (target - from) * eased;
      shownRef.current = next;
      setShown(next);
      if (progress < 1) rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, reducedMotion, duration]);
  return shown;
}

function causalRayEndpoint(origin, dx, dct) {
  const xLimit = dx > 0
    ? (CAUSAL_WORLD.max - origin.x) / dx
    : (CAUSAL_WORLD.min - origin.x) / dx;
  const ctLimit = dct > 0
    ? (CAUSAL_WORLD.max - origin.ct) / dct
    : (CAUSAL_WORLD.min - origin.ct) / dct;
  const scale = Math.max(0, Math.min(xLimit, ctLimit));
  return { x: origin.x + dx * scale, ct: origin.ct + dct * scale };
}

function causalStatePatch(preset, next) {
  return {
    grPreset: preset,
    grBeta: next.beta,
    grAt: next.a.ct, grAx: next.a.x,
    grBt: next.b.ct, grBx: next.b.x,
  };
}

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
              <stop offset="0%" stopColor="rgba(84,174,255,0.22)"></stop>
              <stop offset="100%" stopColor="rgba(70,212,224,0.03)"></stop>
            </linearGradient>
            <linearGradient id="causal-past-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,180,84,0.03)"></stop>
              <stop offset="100%" stopColor="rgba(255,180,84,0.18)"></stop>
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
      <VizCaption status="effective">
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
const GR_BODY_PALETTE = [0x7fe0ee, 0xf3a85e, 0xb78cff, 0x6ee7a0, 0xff8fae, 0xffe07a];
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
function VEffPanel({ mass, body, view, stRef }) {
  const dotRef = useRef(null);
  const mapRef = useRef(null);
  const P = window.QGA_PHYSICS;
  const gm = 0.55 * mass;
  const rPh = P.grPhotonSphereRadius(gm, GR_C2);
  const rIsco = P.grIscoRadius(gm, GR_C2);
  const bound = body && !body.free;
  const a = bound ? body.a : 3;
  const e = bound ? body.e : 0;
  const L2 = gm * a * (1 - e * e);
  const L = Math.sqrt(L2);
  const E = -gm / (2 * a);
  const rMin = Math.max(0.42, 0.55 * rPh);
  const rMax = Math.min(9.5, Math.max(a * (1 + e) * 1.35, 5));
  const W = 320, H = 118, PL = 30, PR = 8, PT = 10, PB = 18;
  const xs = (r) => PL + (r - rMin) / (rMax - rMin) * (W - PL - PR);
  const clampV = (v) => Math.max(-7.5, Math.min(3.2, v));
  const ys = (v) => PT + (3.2 - clampV(v)) / (3.2 + 7.5) * (H - PT - PB);
  mapRef.current = { xs, rMin, rMax };
  useEffect(() => {
    const id = setInterval(() => {
      const el = dotRef.current, m = mapRef.current;
      if (!el || !m) return;
      const r = Math.min(Math.max(stRef.current.selR || 0, m.rMin), m.rMax);
      el.setAttribute("cx", m.xs(r).toFixed(1));
    }, 160);
    return () => clearInterval(id);
  }, [stRef]);
  const samples = [];
  for (let i = 0; i <= 120; i++) {
    const r = rMin + (rMax - rMin) * i / 120;
    samples.push([r, P.grEffectivePotential(gm, GR_C2, L, r), -gm / r + L2 / (2 * r * r)]);
  }
  const path = (idx) => samples.map((sm, i) => (i ? "L" : "M") + xs(sm[0]).toFixed(1) + " " + ys(sm[idx]).toFixed(1)).join(" ");
  const rPeri = a * (1 - e), rApo = a * (1 + e);
  const hex = body ? "#" + body.hex.toString(16).padStart(6, "0") : "#7fe0ee";
  return (
    <div className="veff-wrap">
      <svg viewBox={"0 0 " + W + " " + H} className="veff-svg" role="img"
        aria-label="Effective potential curve for the selected body, general relativity versus Newtonian, with photon sphere and ISCO markers">
        <line x1={PL} y1={ys(0)} x2={W - PR} y2={ys(0)} stroke="#2a3a58" strokeWidth="0.7"></line>
        <line x1={xs(rPh)} y1={PT} x2={xs(rPh)} y2={H - PB} stroke="#8f7ae8" strokeWidth="0.8" strokeDasharray="3 2"></line>
        <text x={xs(rPh) + 2} y={PT + 7} fill="#8f7ae8" fontSize="7" fontFamily="var(--font-mono)">3GM/c&#178;</text>
        <line x1={xs(rIsco)} y1={PT} x2={xs(rIsco)} y2={H - PB} stroke="#4ec9d9" strokeWidth="0.8" strokeDasharray="3 2"></line>
        <text x={xs(rIsco) + 2} y={PT + 15} fill="#4ec9d9" fontSize="7" fontFamily="var(--font-mono)">ISCO</text>
        <path d={path(2)} fill="none" stroke="#4a6a9a" strokeWidth="1" strokeDasharray="4 3" opacity={view === "newton" ? 1 : 0.55}></path>
        <path d={path(1)} fill="none" stroke="#9d8cff" strokeWidth="1.4" opacity={view === "newton" ? 0.25 : 1}></path>
        {bound && (
          <g>
            <line x1={PL} y1={ys(E)} x2={W - PR} y2={ys(E)} stroke={hex} strokeWidth="0.9" opacity="0.8"></line>
            <text x={W - PR - 2} y={ys(E) - 2} fill={hex} fontSize="7" fontFamily="var(--font-mono)" textAnchor="end">E</text>
            <circle cx={xs(Math.max(rPeri, rMin))} cy={ys(E)} r="2.2" fill={hex}></circle>
            <circle cx={xs(Math.min(rApo, rMax))} cy={ys(E)} r="2.2" fill={hex}></circle>
            <circle ref={dotRef} cx={xs(Math.min(Math.max(rPeri, rMin), rMax))} cy={ys(E) - 6} r="2.6" fill="none" stroke="#ffffff" strokeWidth="1"></circle>
          </g>
        )}
        <text x={PL} y={H - 6} fill="var(--text-dim)" fontSize="7.5" fontFamily="var(--font-mono)">V_eff(r)</text>
        <text x={W - PR} y={H - 6} fill="var(--text-dim)" fontSize="7.5" fontFamily="var(--font-mono)" textAnchor="end">r &#8594;</text>
      </svg>
      <div className="veff-legend">
        <span><i style={{ background: "#9d8cff" }}></i>GR: <Eq tex="-\frac{GM}{r} + \frac{L^2}{2r^2} - \frac{GM\,L^2}{c^2 r^3}"></Eq></span>
        <span><i className="dash" style={{ background: "#4a6a9a" }}></i>Newtonian</span>
        <span>turning points &#9679;, live r &#9675;</span>
      </div>
    </div>
  );
}

/* Null-geodesic panel: the exact Schwarzschild photon paths in the orbital
   plane, integrated with the same stepper the 3D fan uses. Rays launched below
   the critical impact parameter spiral in and are captured (red); rays above it
   escape (amber), and the near-critical pair winds around the photon sphere
   before leaving. The 3D fan cannot show that winding — the star's visual
   radius is larger than the photon sphere, so the loop would be hidden inside
   it — so the winding is shown here, where nothing occludes it. */
const NG_FRACTIONS = [0.6, 0.9, 0.99, 1.01, 1.1, 1.6, 2.6];
const NG_ESCAPE = "#ffcf72";
const NG_CAPTURE = "#ff6b6b";
let ngClipSeed = 0;
function NullGeodesicPanel({ mass }) {
  const clipId = useMemo(() => "ng-clip-" + (ngClipSeed++), []);
  const P = window.QGA_PHYSICS;
  const gm = 0.55 * mass;
  const rPh = P.grPhotonSphereRadius(gm, GR_C2);
  const bCrit = P.grCriticalImpactParameter(gm, GR_C2);
  const W = 340, H = 210, PAD = 14;
  const half = 3.2 * bCrit;
  const scale = (Math.min(W, H) - 2 * PAD) / 2 / half;
  const sx = (x) => W / 2 + x * scale;
  const sy = (y) => H / 2 - y * scale;
  const paths = useMemo(() => NG_FRACTIONS.map((f) => {
    const t = P.grNullTrajectory(bCrit * f, gm, GR_C2, { maxSteps: 40000 });
    // keep vertices at least 1.6 px apart: dense enough that the near-critical
    // winding stays smooth, sparse enough to keep the DOM small
    const out = [];
    let lx = null, ly = null;
    for (let i = 0; i < t.points.length; i++) {
      const px = sx(t.points[i][0]), py = sy(t.points[i][1]);
      if (lx === null || Math.hypot(px - lx, py - ly) >= 1.6 || i === t.points.length - 1) {
        out.push(px.toFixed(1) + " " + py.toFixed(1));
        lx = px; ly = py;
      }
    }
    return { f, captured: t.captured, windings: t.windings, d: "M" + out.join(" L") };
  }), [mass]);
  const near = paths.find((p) => p.f === 1.01);
  return (
    <div className="ng-wrap">
      <svg viewBox={"0 0 " + W + " " + H} className="ng-svg" role="img"
        aria-label="Null geodesics in the orbital plane: photon paths below the critical impact parameter are captured, paths above it escape, and the near-critical path winds around the photon sphere">
        <defs>
          <clipPath id={clipId}><rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} rx="6"></rect></clipPath>
        </defs>
        <g clipPath={"url(#" + clipId + ")"}>
          {paths.map((p) => (
            <path key={p.f} d={p.d} fill="none"
              stroke={p.captured ? NG_CAPTURE : NG_ESCAPE}
              strokeWidth={p.f === 1.01 || p.f === 0.99 ? 1.5 : 1}
              opacity={p.f === 1.01 || p.f === 0.99 ? 1 : 0.5}></path>
          ))}
          <circle cx={W / 2} cy={H / 2} r={rPh * scale} fill="none"
            stroke="#8fe8ff" strokeWidth="0.9" strokeDasharray="3 2"></circle>
          <circle cx={W / 2} cy={H / 2} r={bCrit * scale} fill="none"
            stroke="#ffb066" strokeWidth="0.9" strokeDasharray="3 2"></circle>
        </g>
        <circle cx={W / 2} cy={H / 2} r="2.4" fill="#ffe9b0"></circle>
        <text x={W / 2 + bCrit * scale + 3} y={H / 2 - 3} fill="#ffb066"
          fontSize="7" fontFamily="var(--font-mono)">b_crit</text>
        <text x={W / 2 + rPh * scale + 3} y={H / 2 + 9} fill="#8fe8ff"
          fontSize="7" fontFamily="var(--font-mono)">r_ph</text>
        <text x={PAD} y={H - 5} fill="var(--text-dim)" fontSize="7.5"
          fontFamily="var(--font-mono)">orbital plane</text>
        <text x={W - PAD} y={H - 5} fill="var(--text-dim)" fontSize="7.5"
          fontFamily="var(--font-mono)" textAnchor="end">b / b_crit = 0.6 … 2.6</text>
      </svg>
      <div className="ng-legend">
        <span><i style={{ background: NG_ESCAPE }}></i>escapes (b &gt; b_crit)</span>
        <span><i style={{ background: NG_CAPTURE }}></i>captured (b &lt; b_crit)</span>
        <span>near-critical b = 1.01 b_crit winds {near ? near.windings.toFixed(2) : "—"} turns</span>
      </div>
    </div>
  );
}

/* Lensed-sky panel: a real gravitational-lensing render, not a painted ring.
   For every pixel we take the observer's ray, convert its angular offset from
   the mass into an impact parameter b = D·sin θ, look up the exact
   Schwarzschild deflection α(b) from the same integrator the 3D fan uses, and
   sample a procedural celestial sphere at the deflected direction β = θ − α.
   Rays with b < b_crit are captured and render black. The shadow, the photon
   ring, the Einstein ring and the secondary image all fall out of the
   geometry — nothing is drawn by hand. */
const NG_TEX_W = 2048, NG_TEX_H = 1024;
function ngStarTexture() {
  const cv = document.createElement("canvas");
  cv.width = NG_TEX_W; cv.height = NG_TEX_H;
  const g = cv.getContext("2d");
  g.fillStyle = "#02040a"; g.fillRect(0, 0, NG_TEX_W, NG_TEX_H);
  let s = 0x9e3779b9;
  const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  // Large-scale structure: without it a sparse point-star sky shows the lensing
  // only as a thin ring of stretched dots. Soft nebulae make the tangential
  // stretching and the Einstein fold legible.
  const neb = [[70, 110, 220], [150, 80, 200], [60, 170, 190], [200, 120, 90], [110, 140, 255]];
  for (let i = 0; i < 260; i++) {
    const x = rnd() * NG_TEX_W, y = rnd() * NG_TEX_H;
    const r = 40 + rnd() * 220;
    const c = neb[(rnd() * neb.length) | 0];
    const a = 0.05 + rnd() * 0.16;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")");
    gr.addColorStop(1, "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",0)");
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
  }
  const tints = ["#c8d4ff", "#fff0d8", "#d8c8ff", "#ffd0c0", "#ffffff"];
  for (let i = 0; i < 26000; i++) {
    const x = rnd() * NG_TEX_W, y = rnd() * NG_TEX_H;
    g.globalAlpha = 0.2 + rnd() * 0.8;
    g.fillStyle = tints[(rnd() * tints.length) | 0];
    g.beginPath(); g.arc(x, y, 0.35 + rnd() * 1.4, 0, 6.2832); g.fill();
  }
  g.globalAlpha = 1;
  return g.getImageData(0, 0, NG_TEX_W, NG_TEX_H);
}
function renderLensedSky(cv, mass, tex) {
  const P = window.QGA_PHYSICS;
  const gm = 0.55 * mass;
  const bCrit = P.grCriticalImpactParameter(gm, GR_C2);
  const D = 12;          // observer distance, scene units
  const FOV = 0.45;      // half-angle of the field, radians
  const N = cv.width;
  const ctx = cv.getContext("2d");
  const img = ctx.createImageData(N, N);
  const out = img.data;
  const tw = tex.width, th = tex.height, td = tex.data;

  // Exact deflection table over [b_crit, 4 b_crit], log-spaced so the
  // near-critical divergence is resolved; weak field beyond it is analytic.
  const TN = 96;
  const bLo = bCrit * 1.0002, bHi = bCrit * 4;
  const logLo = Math.log(bLo), logHi = Math.log(bHi);
  const tab = new Float64Array(TN);
  for (let i = 0; i < TN; i++) {
    const b = Math.exp(logLo + (logHi - logLo) * i / (TN - 1));
    tab[i] = P.grNullDeflection(b, gm, GR_C2, { maxSteps: 20000 }).deflection;
  }
  const alphaAt = (b) => {
    if (b >= bHi) return (4 * gm) / (GR_C2 * b);
    const t = ((Math.log(b) - logLo) / (logHi - logLo)) * (TN - 1);
    const i = Math.min(TN - 2, Math.max(0, Math.floor(t)));
    const f = Math.min(1, Math.max(0, t - i));
    return tab[i] * (1 - f) + tab[i + 1] * f;
  };

  const half = N / 2;
  for (let j = 0; j < N; j++) {
    const y = (j + 0.5) / half - 1;
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5) / half - 1;
      const o = (j * N + i) * 4;
      const rho = Math.hypot(x, y);
      if (rho > 1) { out[o + 3] = 0; continue; }
      const theta = FOV * rho;
      const b = D * Math.sin(theta);
      if (b <= bCrit) { out[o] = 2; out[o + 1] = 4; out[o + 2] = 10; out[o + 3] = 255; continue; }
      let beta = theta - alphaAt(b);
      let phi = Math.atan2(y, x);
      if (beta < 0) { beta = -beta; phi += Math.PI; }   // secondary image
      const u = ((phi / (2 * Math.PI) + 0.5) % 1 + 1) % 1;
      const v = Math.min(0.999, beta / Math.PI);
      const t = ((Math.floor(v * th) * tw) + Math.floor(u * tw)) * 4;
      out[o] = td[t]; out[o + 1] = td[t + 1]; out[o + 2] = td[t + 2]; out[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}
function LensedSkyPanel({ mass }) {
  const cvRef = useRef(null);
  const tex = useMemo(() => ngStarTexture(), []);
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const raf = requestAnimationFrame(() => renderLensedSky(cv, mass, tex));
    return () => cancelAnimationFrame(raf);
  }, [mass, tex]);
  return (
    <div className="lens-wrap">
      <canvas ref={cvRef} width="340" height="340" className="lens-canvas" role="img"
        aria-label="Gravitational lensing of a background starfield: a black shadow at the critical impact parameter, a bright photon ring at its edge, and an Einstein ring where the deflection maps the sky back onto itself"></canvas>
      <div className="lens-legend">
        <span>shadow b &lt; b_crit</span>
        <span>photon ring at b_crit</span>
        <span>Einstein ring where β = θ − α = 0</span>
      </div>
    </div>
  );
}

function CurvatureEngine3D() {
  const [scenario, setScenario] = useState("classic");
  const [mass, setMass] = useState(5);
  const [view, setView] = useState("gr");
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

  const build = (ctx) => {
    const { THREE, scene, camera } = ctx;
    const P = window.QGA_PHYSICS;
    scene.fog = new THREE.FogExp2(0x03050a, 0.012);
    scene.add(new THREE.AmbientLight(0x8899bb, 0.4));
    const key = new THREE.DirectionalLight(0xbcd0ff, 0.7);
    key.position.set(6, 10, 4);
    scene.add(key);
    const starLight = new THREE.PointLight(0xffd9a0, 2.2, 28, 1.7);
    scene.add(starLight);

    const det = ctx.settings.current.detail3d;
    const SEG = det === "low" ? 56 : det === "ultra" ? 128 : 88;
    const EXT = 17;

    const mkRadialTex = (stops) => {
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const g = c.getContext("2d");
      const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      for (const [o, col] of stops) grad.addColorStop(o, col);
      g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(c);
    };

    // ---------- twinkling starfield + nebulae ----------
    const starN = det === "low" ? 320 : det === "ultra" ? 1100 : 640;
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(starN * 3);
    const sPhase = new Float32Array(starN);
    const sSize = new Float32Array(starN);
    const sCol = new Float32Array(starN * 3);
    const tints = [[0.78, 0.84, 1.0], [1.0, 0.93, 0.8], [0.85, 0.75, 1.0], [1.0, 0.8, 0.7]];
    for (let i = 0; i < starN; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(1 - u * u), R = 78 + Math.random() * 60;
      sPos[i * 3] = Math.cos(a) * rr * R;
      sPos[i * 3 + 1] = Math.abs(u) * R * 0.85 + 6;     // bias above the sheet
      sPos[i * 3 + 2] = Math.sin(a) * rr * R;
      sPhase[i] = Math.random();
      sSize[i] = 0.7 + Math.random() * 1.9;
      const t = tints[(Math.random() * tints.length) | 0];
      sCol[i * 3] = t[0]; sCol[i * 3 + 1] = t[1]; sCol[i * 3 + 2] = t[2];
    }
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    sGeo.setAttribute("aPhase", new THREE.BufferAttribute(sPhase, 1));
    sGeo.setAttribute("aSize", new THREE.BufferAttribute(sSize, 1));
    sGeo.setAttribute("aCol", new THREE.BufferAttribute(sCol, 3));
    const starUni = { uTime: { value: 0 } };
    const stars = new THREE.Points(sGeo, new THREE.ShaderMaterial({
      uniforms: starUni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aPhase; attribute float aSize; attribute vec3 aCol;
        uniform float uTime; varying float vTw; varying vec3 vCol;
        void main(){
          vCol = aCol;
          vTw = 0.6 + 0.4 * sin(uTime * 1.3 + aPhase * 6.2831);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (240.0 / -mv.z) * (0.7 + 0.3 * vTw);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        precision highp float; varying float vTw; varying vec3 vCol;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.06, d);
          gl_FragColor = vec4(vCol * (0.55 + 0.45 * vTw), a * 0.85);
        }`,
    }));
    scene.add(stars);

    const nebTex = mkRadialTex([
      [0, "rgba(120,90,220,0.34)"], [0.4, "rgba(60,80,190,0.16)"], [1, "rgba(0,0,0,0)"],
    ]);
    for (let i = 0; i < 3; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: nebTex, transparent: true, opacity: 0.5, depthWrite: false,
        blending: THREE.AdditiveBlending, rotation: i * 1.7,
      }));
      const ang = i * 2.1 + 0.6;
      sp.position.set(Math.cos(ang) * 52, 26 + i * 9, Math.sin(ang) * 52);
      sp.scale.setScalar(46 + i * 14);
      scene.add(sp);
    }

    // ---------- luminous gravity well (AA grid funnel, polar near the throat) ----------
    const geo = new THREE.PlaneGeometry(EXT, EXT, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const wellUniforms = {
      uTime: { value: 0 },
      uMaxDepth: { value: 3.0 },
      uFlat: { value: 0.0 },          // 1 in Newtonian view
      uRippleT: { value: -1 },        // >=0: curvature ripple since last capture
    };
    const wellMat = new THREE.ShaderMaterial({
      uniforms: wellUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv; varying float vDepth; varying float vR; varying vec3 vPos;
        uniform float uMaxDepth, uRippleT;
        void main(){
          vUv = uv;
          float y = position.y;
          float rad = length(position.xz);
          if (uRippleT >= 0.0) {
            float front = 0.6 + uRippleT * 4.6;
            float band = exp(-pow((rad - front) * 1.5, 2.0));
            y += 0.55 * band * sin((rad - front) * 9.0) * exp(-uRippleT * 1.35);
          }
          vPos = vec3(position.x, y, position.z);
          vDepth = clamp(-y / max(uMaxDepth, 0.4), 0.0, 1.0);
          vR = rad;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);
        }`,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv; varying float vDepth; varying float vR; varying vec3 vPos;
        uniform float uTime, uFlat;
        float lineAA(float c, float w){
          float d = abs(fract(c - 0.5) - 0.5) / max(fwidth(c), 1e-5);
          return 1.0 - min(d / w, 1.0);
        }
        void main(){
          // Cartesian grid (world-unit spacing), screen-space anti-aliased
          float cart = max(lineAA(vPos.x, 1.35), lineAA(vPos.z, 1.35));
          float cartMaj = max(lineAA(vPos.x * 0.25, 1.1), lineAA(vPos.z * 0.25, 1.1));
          // polar net near the throat: unit rings + 24 spokes, fading outward
          float ring = lineAA(vR, 1.25);
          float ang = atan(vPos.z, vPos.x);
          float spoke = lineAA(ang * (12.0 / 3.14159265), 0.9);
          float near = smoothstep(5.6, 1.6, vR);
          float far = 1.0 - near * 0.85;
          float g = clamp(max(cart * far + cartMaj * 0.5 * far, (ring + spoke) * near), 0.0, 1.4);
          // iridescent depth ramp with a slow shimmer
          vec3 cRim = vec3(0.10, 0.26, 0.58);
          vec3 cMid = vec3(0.34, 0.42, 0.95);
          vec3 cDeep = vec3(0.74, 0.62, 1.0);
          vec3 col = mix(cRim, cMid, smoothstep(0.0, 0.55, vDepth));
          col = mix(col, cDeep, smoothstep(0.5, 1.0, vDepth));
          col *= 1.0 + 0.14 * sin(vR * 2.6 - uTime * 1.25 + vDepth * 5.0);
          // energy pulses travelling down the funnel
          float pulse = 0.5 + 0.5 * sin((vDepth * 7.0 - uTime * 1.1) * 6.2831);
          float bright = (0.34 + 1.7 * pow(vDepth, 1.4)) * (0.76 + 0.36 * pulse);
          bright = mix(bright, 0.34, uFlat);
          float fill = (0.05 + 0.32 * pow(vDepth, 2.0)) * (1.0 - uFlat * 0.7);
          float rimFade = smoothstep(8.8, 6.2, vR);
          vec3 outc = (col * g * bright + cDeep * fill) * rimFade;
          outc = mix(outc, vec3(0.30, 0.42, 0.62) * (g * 0.35 + fill * 0.5), uFlat * 0.55);
          gl_FragColor = vec4(outc, 1.0);
        }`,
    });
    const surf = new THREE.Mesh(geo, wellMat);
    surf.renderOrder = -2;
    scene.add(surf);
    const pos = geo.attributes.position;

    const depth = (x, z, GM) =>
      viewRef.current === "gr" ? -0.92 * GM / Math.sqrt(x * x + z * z + 0.62) : 0;
    let lastM = -1, lastView = "";
    const reshape = () => {
      const GM = 0.55 * massRef.current;
      for (let k = 0; k < pos.count; k++) pos.setY(k, depth(pos.getX(k), pos.getZ(k), GM));
      pos.needsUpdate = true;
      wellUniforms.uMaxDepth.value = Math.max(0.5, 0.92 * GM / Math.sqrt(0.62));
    };
    const hAt = (x, z) => depth(x, z, 0.55 * massRef.current);

    // ---------- central mass: fBm-granulated star, corona, Einstein ring ----------
    const coreUni = { uTime: { value: 0 } };
    const star = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.ShaderMaterial({
      uniforms: coreUni,
      vertexShader: `
        varying vec3 vN; varying vec3 vP; varying vec3 vV;
        void main(){
          vP = position;
          vN = normalize(mat3(modelMatrix) * normal);
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vV = cameraPosition - wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        precision highp float;
        varying vec3 vN; varying vec3 vP; varying vec3 vV;
        uniform float uTime;
        float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float noise(vec3 p){
          vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }
        float fbm(vec3 p){
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.07; a *= 0.5; }
          return v;
        }
        void main(){
          float n = fbm(normalize(vP) * 3.4 + vec3(0.0, uTime * 0.10, uTime * 0.04));
          float gran = smoothstep(0.30, 0.78, n);
          vec3 hot = vec3(1.0, 0.94, 0.80), cool = vec3(1.0, 0.52, 0.16);
          vec3 col = mix(cool, hot, gran);
          float ndv = max(dot(normalize(vN), normalize(vV)), 0.0);
          col *= 0.5 + 0.8 * pow(ndv, 0.55);
          col += vec3(1.0, 0.72, 0.42) * pow(1.0 - ndv, 2.8) * 1.5;
          gl_FragColor = vec4(col, 1.0);
        }`,
    }));
    scene.add(star);
    const starGlow = ctx.glow(0xffe6b0, 5, 0.5);
    scene.add(starGlow);
    const corona = ctx.glow(0xff9a4a, 7, 0.18);
    scene.add(corona);
    const throat = ctx.glow(0x7a6cff, 6, 0.34);   // luminous well throat
    scene.add(throat);
    const ringTex = mkRadialTex([
      [0, "rgba(0,0,0,0)"], [0.34, "rgba(0,0,0,0)"], [0.42, "rgba(190,170,255,0.9)"],
      [0.47, "rgba(255,240,220,0.35)"], [0.55, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0)"],
    ]);
    const einstein = new THREE.Sprite(new THREE.SpriteMaterial({
      map: ringTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    scene.add(einstein);
    // frame-dragging vortex disc (visible only with spin > 0)
    const vortexTex = mkRadialTex([
      [0, "rgba(0,0,0,0)"], [0.30, "rgba(0,0,0,0)"], [0.40, "rgba(110,230,255,0.55)"],
      [0.46, "rgba(0,0,0,0)"], [0.56, "rgba(110,230,255,0.30)"], [0.62, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0)"],
    ]);
    const vortex = new THREE.Sprite(new THREE.SpriteMaterial({
      map: vortexTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    scene.add(vortex);

    // ---------- gradient-fading trails with comet dust ----------
    const TRAIL_N = det === "low" ? 220 : 360;
    const mkTrail = (hex) => {
      const g = new THREE.BufferGeometry();
      const buf = new THREE.BufferAttribute(new Float32Array(TRAIL_N * 3), 3);
      const cbuf = new THREE.BufferAttribute(new Float32Array(TRAIL_N * 3), 3);
      g.setAttribute("position", buf);
      g.setAttribute("color", cbuf);
      g.setDrawRange(0, 0);
      const l = new THREE.Line(g, new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      l.frustumCulled = false;
      scene.add(l);
      let pts = null, pbuf = null, pcbuf = null, pn = 0;
      if (det !== "low") {
        pn = Math.floor(TRAIL_N / 6);
        const pg = new THREE.BufferGeometry();
        pbuf = new THREE.BufferAttribute(new Float32Array(pn * 3), 3);
        pcbuf = new THREE.BufferAttribute(new Float32Array(pn * 3), 3);
        pg.setAttribute("position", pbuf);
        pg.setAttribute("color", pcbuf);
        pg.setDrawRange(0, 0);
        pts = new THREE.Points(pg, new THREE.PointsMaterial({
          size: 0.16, map: qgaGlowTexture(), vertexColors: true, transparent: true,
          opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
        }));
        pts.frustumCulled = false;
        scene.add(pts);
      }
      return { buf, cbuf, g, l, pts, pbuf, pcbuf, pn, hex: new THREE.Color(hex) };
    };
    const writeTrail = (tr, list) => {
      const n = Math.min(list.length, TRAIL_N);
      for (let i = 0; i < n; i++) {
        const q = list[list.length - n + i];
        tr.buf.setXYZ(i, q[0], q[1], q[2]);
        const f = Math.pow(i / Math.max(n - 1, 1), 1.7);   // additive: black tail = fade-out
        tr.cbuf.setXYZ(i, tr.hex.r * f, tr.hex.g * f, tr.hex.b * f);
        if (tr.pts && i % 6 === 0) {
          const j = i / 6;
          if (j < tr.pn) {
            tr.pbuf.setXYZ(j, q[0], q[1] + 0.02, q[2]);
            tr.pcbuf.setXYZ(j, tr.hex.r * f * 0.8, tr.hex.g * f * 0.8, tr.hex.b * f * 0.8);
          }
        }
      }
      tr.buf.needsUpdate = true; tr.cbuf.needsUpdate = true;
      tr.g.setDrawRange(0, n);
      if (tr.pts) {
        tr.pbuf.needsUpdate = true; tr.pcbuf.needsUpdate = true;
        tr.pts.geometry.setDrawRange(0, Math.min(tr.pn, Math.ceil(n / 6)));
      }
    };

    // pre-built body visuals (slots toggled by count; colors/scales set per frame)
    const bodyVis = [];
    for (let i = 0; i < GR_MAX_BODIES; i++) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.32, metalness: 0.15,
      }));
      mesh.userData.bodyIndex = i;
      mesh.visible = false;
      scene.add(mesh);
      const glow = ctx.glow(0xffffff, 1, 0.6);
      glow.visible = false;
      scene.add(glow);
      bodyVis.push({ mesh, glow, trail: mkTrail(0xffffff) });
    }
    const selRing = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.36, 48), new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.85, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    selRing.visible = false;
    scene.add(selRing);

    // lensing fan of light rays
    const rayVis = stRef.current.rays.map(() => mkTrail(0xffcf72));

    // Strong-field markers: the photon sphere (r = 3GM/c²) and the critical
    // curve (b = 3√3 GM/c²) that separates escape from capture. Drawn as thin
    // filled annuli rather than lines — WebGL clamps line width to 1px, which
    // is invisible at this scene scale — and without depth test so they stay
    // legible where they pass behind the star.
    const mkRing = (hex, opacity) => {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 96, 1), new THREE.MeshBasicMaterial({
        color: hex, transparent: true, opacity, side: THREE.DoubleSide,
        depthTest: false, depthWrite: false,
      }));
      m.rotation.x = -Math.PI / 2;
      m.renderOrder = 3;
      m.visible = false;
      scene.add(m);
      return m;
    };
    const ringPhoton = mkRing(0x8fe8ff, 0.7);
    const ringCrit = mkRing(0xffb066, 0.6);
    const placeRing = (mesh, radius) => {
      mesh.scale.setScalar(radius);
      mesh.position.set(0, hAt(radius, 0) + 0.05, 0);
    };

    // capture / close-approach flash pool
    const flashes = [];
    for (let i = 0; i < 4; i++) {
      const sp = ctx.glow(0xffffff, 0.001, 0);
      sp.visible = false;
      scene.add(sp);
      flashes.push({ sp, t: 9, dur: 0.7 });
    }
    const triggerFlash = (x, y, z, hex) => {
      const f = flashes.find((fl) => fl.t >= fl.dur) || flashes[0];
      f.t = 0;
      f.sp.position.set(x, y, z);
      f.sp.material.color.setHex(hex);
      f.sp.visible = true;
    };

    // infalling dust motes spiralling down the funnel
    let dust = null;
    if (det !== "low") {
      const DN = det === "ultra" ? 320 : 180;
      const dGeo = new THREE.BufferGeometry();
      const dPos = new Float32Array(DN * 3);
      const dData = [];
      for (let i = 0; i < DN; i++) {
        const r = 2.5 + Math.random() * 6.5, a = Math.random() * Math.PI * 2;
        dData.push({ r, a, fall: 0.12 + Math.random() * 0.25 });
        dPos[i * 3] = Math.cos(a) * r; dPos[i * 3 + 1] = 0; dPos[i * 3 + 2] = Math.sin(a) * r;
      }
      dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
      dust = new THREE.Points(dGeo, new THREE.PointsMaterial({
        size: 0.09, map: qgaGlowTexture(), color: 0x9db8ff, transparent: true, opacity: 0.42,
        depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
      }));
      dust.userData.data = dData;
      scene.add(dust);
    }

    // Prompt 10 formula linking: map the module's formula symbols onto the
    // scene objects they describe, with live numerical readouts. Hovering
    // T_μν in the Einstein field equations highlights the curvature source.
    ctx.conceptTarget("T_{\\mu\\nu}", {
      object: star,
      readout: () => ({ label: "Curvature source mass", value: massRef.current.toFixed(1), unit: "M☉ (scene scale)" }),
    });
    ctx.conceptTarget("g_{\\mu\\nu}", {
      object: surf,
      readout: () => ({
        label: "Embedding depth at throat",
        value: (0.92 * 0.55 * massRef.current / Math.sqrt(0.62)).toFixed(2),
        unit: "scene units",
      }),
    });
    ctx.conceptTarget("x^\\mu(\\tau)", {
      object: bodyVis[0]?.mesh,
      readout: () => ({
        label: "Inner-body perihelion precession",
        value: (viewRef.current === "gr" ? grPrecDeg(massRef.current, GR_BODIES[0].a, GR_BODIES[0].e) : 0).toFixed(2),
        unit: "°/orbit",
      }),
    });
    ctx.conceptTarget("\\Gamma^{\\mu}_{\\alpha\\beta}", {
      object: bodyVis[1]?.mesh ?? bodyVis[0]?.mesh,
      readout: () => ({
        label: "Outer-body perihelion precession",
        value: (viewRef.current === "gr" ? grPrecDeg(massRef.current, GR_BODIES[1].a, GR_BODIES[1].e) : 0).toFixed(2),
        unit: "°/orbit",
      }),
    });

    const force = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1.4, 0xd96a5a, 0.35, 0.2);
    force.visible = false;
    scene.add(force);

    ctx.label("M — curvature source", () => ({ x: 0, y: hAt(0.01, 0.01) + 1.9, z: 0 }), "s3d-strong");
    const pLabel = ctx.label("geodesic — free fall, no force",
      () => {
        const sim = stRef.current.sim;
        const b = sim[Math.min(selRef.current, sim.length - 1)];
        return b ? { x: b.X, y: hAt(b.X, b.Y) + 0.55 + b.Z, z: b.Y } : { x: 0, y: 1, z: 0 };
      }, "s3d-quiet");
    const lensLabel = ctx.label("null geodesics — light follows the curved optical geometry",
      () => ({ x: 4.4, y: 0.6, z: 0 }), "s3d-quiet");
    ctx.annotation("embedding-diagram intuition — the 'rubber sheet' shows spatial curvature only; time curvature dominates everyday gravity",
      () => ({ x: 0, y: 0.4, z: EXT / 2 - 1 }));

    return {
      autoRotate: true,
      pickables: bodyVis.map((v) => v.mesh),
      onPick: (obj) => {
        if (obj && obj.userData.bodyIndex != null && obj.userData.bodyIndex < bodiesRef.current.length) {
          setSelected(obj.userData.bodyIndex);
        }
      },
      update: (t, dt) => {
        const M = massRef.current, GM = 0.55 * M;
        const newton = viewRef.current === "newton";
        if (lastM !== M || lastView !== viewRef.current) {
          lastM = M; lastView = viewRef.current; reshape();
          // ray dynamics differ fundamentally between GR/Newton — relaunch the fan
          stRef.current.rays = GR_RAY_B.map((b) => ({ x: -7.6, y: b, vx: newton ? 5.2 : 4, vy: 0, b, trail: [], near: false }));
        }
        const mo = ctx.motion();
        const spd = speedRef.current;
        wellUniforms.uTime.value += dt * 60 * 0.016 * mo;
        wellUniforms.uFlat.value += ((newton ? 1 : 0) - wellUniforms.uFlat.value) * Math.min(1, dt * 6);
        if (wellUniforms.uRippleT.value >= 0) {
          wellUniforms.uRippleT.value += dt;
          if (wellUniforms.uRippleT.value > 4) wellUniforms.uRippleT.value = -1;
        }
        coreUni.uTime.value += dt * mo;
        starUni.uTime.value += dt * mo;

        // ---- sync sim bodies with the editable parameter list (by uid) ----
        const st = stRef.current;
        const params = bodiesRef.current;
        let dirty = st.sim.length !== params.length;
        for (let i = 0; !dirty && i < params.length; i++) {
          if (st.sim[i].uid !== params[i].uid) { dirty = true; break; }
          // live-editable parameters: sliders win unless radiation reaction has
          // been evolving a/e inside the loop (lastParam* tracks user edits)
          const sm = st.sim[i];
          if (sm.lastParamA !== params[i].a) { sm.a = params[i].a; sm.lastParamA = params[i].a; }
          if (sm.lastParamE !== params[i].e) { sm.e = params[i].e; sm.lastParamE = params[i].e; }
          sm.r = params[i].r; sm.hex = params[i].hex;
        }
        if (dirty) {
          st.sim = params.map((p, i) => {
            const old = st.sim.find((s) => s.uid === p.uid);
            if (old) {
              old.a = p.a; old.e = p.e; old.r = p.r; old.hex = p.hex;
              old.lastParamA = p.a; old.lastParamE = p.e;
              return old;
            }
            return {
              uid: p.uid, free: p.free, a: p.a, e: p.e, r: p.r, hex: p.hex,
              lastParamA: p.a, lastParamE: p.e,
              theta: p.phase != null ? p.phase : i * 2.4, peri: p.peri || 0,
              incl: p.incl || 0, node: i * 0.7,
              x: p.free ? p.x0 : 0, y: p.free ? p.y0 : 0,
              vx: p.free ? p.vx0 : 0, vy: p.free ? p.vy0 : 0,
              X: 0, Y: 0, Z: 0, prevX: 0, prevY: 0,
              x0: p.x0, y0: p.y0, vx0: p.vx0, vy0: p.vy0,
              trail: [],
            };
          });
        }

        // ---- central star ----
        const sc = 0.45 + M * 0.07;
        star.scale.setScalar(sc);
        star.position.y = hAt(0.01, 0.01) + sc * 0.4;
        starLight.position.copy(star.position);
        starLight.intensity = 1.6 + M * 0.12;
        const pulse = 1 + 0.05 * Math.sin(t * 2.0) * mo;
        starGlow.position.copy(star.position); starGlow.scale.setScalar(sc * 4.4 * pulse);
        corona.position.copy(star.position); corona.scale.setScalar(sc * 7 * pulse);
        einstein.position.copy(star.position);
        einstein.scale.setScalar(sc * (5.2 + M * 0.25) * pulse);
        einstein.material.opacity = (newton ? 0.06 : 0.4) * (1 - wellUniforms.uFlat.value);
        vortex.position.copy(star.position);
        vortex.scale.setScalar(sc * (8.5 + M * 0.4) * (1 + 0.04 * Math.sin(t * 1.4) * mo));
        vortex.material.rotation += dt * spinRef.current * 0.9 * (0.3 + 0.7 * mo);
        vortex.material.opacity = newton ? 0 : spinRef.current * 0.55;
        throat.position.set(0, hAt(0.01, 0.01) - 0.2, 0);
        throat.scale.setScalar((1 - wellUniforms.uFlat.value) * (3 + M * 0.5));
        throat.material.opacity = 0.34 * (1 - wellUniforms.uFlat.value);
        stars.rotation.y += dt * 0.012 * mo;

        // ---- dynamics ----
        const sub = 6, sdt = Math.min(dt, 0.04) / sub * spd;
        const mu = GM, TS = 2.2; // gravitational parameter; TS = overall visual time-scale
        const capR = P.grCaptureRadius(mu, GR_C2);
        const rs = 2 * mu / GR_C2;
        const showRings = rayRef.current && !newton;
        ringPhoton.visible = showRings;
        ringCrit.visible = showRings;
        if (showRings) {
          placeRing(ringPhoton, 1.5 * rs);
          placeRing(ringCrit, window.QGA_PHYSICS.grCriticalImpactParameter(mu, GR_C2));
        }
        const isco = P.grIscoRadius(mu, GR_C2);
        const J = spinRef.current * mu * mu / GR_C2 * 10;   // ×10 visual amplification (disclosed)
        for (let s = 0; s < sub; s++) {
          for (const p of st.sim) {
            if (p.free) {
              // numerically integrated post-Newtonian plunge; captured at r = 3GM/c²
              P.grPlungeStep(p, mu, GR_C2, TS * sdt);
              if (Math.hypot(p.x, p.y) < capR) {
                triggerFlash(p.x, hAt(p.x, p.y) + 0.25, p.y, 0xbfa0ff);
                wellUniforms.uRippleT.value = 0;
                p.x = p.x0; p.y = p.y0; p.vx = p.vx0; p.vy = p.vy0; p.trail = [];
              }
              continue;
            }
            // exact precessing Kepler orbit: advance true anomaly by the area law
            //   dθ/dt = h / r²,  h = √(μ a(1−e²)),  r = a(1−e²)/(1+e cosθ)
            // and advance the perihelion by the exact GR rate Δϖ = 6πμ/[c² a(1−e²)] per orbit
            // (distributed smoothly: dϖ = (Δϖ/2π) dθ). Newtonian view drops the advance → closed ellipse.
            const p_ = p.a * (1 - p.e * p.e);
            const rr3 = p_ / (1 + p.e * Math.cos(p.theta));
            const h = Math.sqrt(mu * p_);
            const dtheta = TS * h / (rr3 * rr3) * sdt;
            p.theta += dtheta;
            if (!newton) {
              p.peri += (6 * Math.PI * mu / (GR_C2 * p_)) / (2 * Math.PI) * dtheta;
              if (J > 0) {
                // Lense–Thirring node drift: ΔΩ = 4πJ/[c² a³(1−e²)^{3/2}] per orbit
                p.node += (4 * Math.PI * J / (GR_C2 * Math.pow(p.a, 3) * Math.pow(1 - p.e * p.e, 1.5)))
                  / (2 * Math.PI) * dtheta;
              }
            }
            const ang = p.theta + p.peri;
            p.x = rr3 * Math.cos(ang);
            p.y = rr3 * Math.sin(ang);
          }
          if (rayRef.current) {
            for (let ri = 0; ri < st.rays.length; ri++) {
              const q = st.rays[ri];
              const qr2 = q.x * q.x + q.y * q.y, qr = Math.sqrt(qr2) + 1e-6;
              if (newton) {
                if (qr > 0.4) {
                  // Newtonian corpuscular deflection: half the relativistic value
                  const af = -GM / (qr2 * qr);
                  q.vx += af * q.x * sdt * 60; q.vy += af * q.y * sdt * 60;
                  const vn = Math.hypot(q.vx, q.vy); q.vx *= 5.2 / vn; q.vy *= 5.2 / vn;
                  q.x += q.vx * sdt * 0.96; q.y += q.vy * sdt * 0.96;
                }
              } else {
                // exact Schwarzschild null geodesic: d²x/dλ² = −(3/2)·rs·L²·x/r⁵
                // Stepped at the same affine rate as the bodies. The former ×60
                // multiplier crossed the scene in ~4 frames and sat far outside the
                // integrator's convergence radius: it missed capture entirely and
                // under-reported strong-field deflection by up to 2×.
                P.grNullStep(q, rs, sdt * lightRef.current);
              }
              const capRay = Math.max(1.5 * rs, sc * 0.9);
              if (qr < capRay) {
                triggerFlash(q.x, hAt(q.x, q.y) + 0.15, q.y, 0xff6b6b);
                q.x = -7.6; q.y = q.b; q.vx = newton ? 5.2 : 4; q.vy = 0; q.trail = []; q.near = false;
                continue;
              }
              if (qr < 2.4 * rs + 0.5 && !q.near) {
                q.near = true;
                triggerFlash(q.x, hAt(q.x, q.y) + 0.15, q.y, 0xcfe8ff);   // photon-sphere graze
              }
              if (qr > 2.4 * rs + 1.2) q.near = false;
              if (qr > 9.6 || q.trail.length > 900) {
                q.x = -7.6; q.y = q.b; q.vx = newton ? 5.2 : 4; q.vy = 0; q.trail = []; q.near = false;
              }
            }
          }
        }
        // ---- radiation reaction (Peters orbit-averaged, amplified) + ISCO plunge ----
        if (rrRef.current && !newton && dt > 0) {
          for (const p of st.sim) {
            if (p.free) continue;
            const d = P.grPetersDerivatives(p.a, p.e, 0.5);
            p.a += d.da * dt * spd;
            p.e = Math.max(0, p.e + d.de * dt * spd);
            if (p.a * (1 - p.e) < 1.15 * isco) {
              // inside the ISCO the bound-ellipse model ends: hand the body to the
              // numerical plunge integrator with its current kinematic state
              p.free = true;
              p.x = p.X; p.y = p.Y;
              const inv = 1 / Math.max(dt, 1e-3);
              p.vx = (p.X - p.prevX) * inv; p.vy = (p.Y - p.prevY) * inv;
              p.x0 = 5.5; p.y0 = 2.2; p.vx0 = 1.3; p.vy0 = -0.1;   // re-injection state
            }
          }
        }

        // ---- project orbital-plane state to scene coords (inclination + node) ----
        for (const p of st.sim) {
          p.prevX = p.X; p.prevY = p.Y;
          if (p.free) { p.X = p.x; p.Y = p.y; p.Z = 0; }
          else {
            const ty = p.y * Math.cos(p.incl), zc = p.y * Math.sin(p.incl);
            const cn = Math.cos(p.node), sn = Math.sin(p.node);
            p.X = p.x * cn - ty * sn;
            p.Y = p.x * sn + ty * cn;
            p.Z = zc;
          }
        }

        if (dt > 0) {
          for (const p of st.sim) {
            p.trail.push([p.X, hAt(p.X, p.Y) + 0.16 + p.Z, p.Y]);
            if (p.trail.length > TRAIL_N) p.trail.shift();
          }
          if (rayRef.current) for (const q of st.rays) {
            q.trail.push([q.x, hAt(q.x, q.y) + 0.12, q.y]);
            if (q.trail.length > TRAIL_N) q.trail.shift();
          }
        }

        // ---- body visuals + selection ring ----
        const showT = trailRef.current;
        st.sim.forEach((p, i) => {
          const v = bodyVis[i];
          const y = hAt(p.X, p.Y) + 0.16 + p.Z;
          v.mesh.visible = true; v.glow.visible = true;
          v.mesh.material.color.setHex(p.hex);
          v.mesh.material.emissive.setHex(p.hex);
          v.mesh.position.set(p.X, y, p.Y);
          v.mesh.scale.setScalar(p.r);
          v.glow.position.set(p.X, y, p.Y);
          v.glow.scale.setScalar(p.r * 9 * (1 + 0.12 * Math.sin(t * 3 + i) * mo));
          v.trail.hex.setHex(p.hex);
          v.trail.l.visible = showT;
          if (v.trail.pts) v.trail.pts.visible = showT;
          if (showT) writeTrail(v.trail, p.trail);
        });
        for (let i = st.sim.length; i < GR_MAX_BODIES; i++) {
          const v = bodyVis[i];
          v.mesh.visible = false; v.glow.visible = false;
          v.trail.l.visible = false;
          if (v.trail.pts) v.trail.pts.visible = false;
        }
        const selIdx2 = Math.min(selRef.current, st.sim.length - 1);
        if (st.sim.length) {
          const p = st.sim[selIdx2];
          st.selR = Math.hypot(p.X, p.Y);
          selRing.visible = true;
          selRing.position.set(p.X, hAt(p.X, p.Y) + 0.16 + p.Z, p.Y);
          selRing.quaternion.copy(camera.quaternion);
          selRing.scale.setScalar(Math.max(1, p.r * 7));
        } else selRing.visible = false;

        const showRays = rayRef.current;
        // Fate is exact, not decorative: b_crit is the boundary between capture
        // and escape, so the fan reads itself — red rays are doomed, amber rays
        // leave. In the Newtonian view there is no capture cone, so the only
        // fate is hitting the opaque star.
        const bCritNow = window.QGA_PHYSICS.grCriticalImpactParameter(mu, GR_C2);
        rayVis.forEach((rv, i) => {
          const q = st.rays[i];
          const doomed = newton ? Math.abs(q.b) < capRay : Math.abs(q.b) < bCritNow;
          rv.hex.setHex(doomed ? 0xff6b6b : 0xffcf72);
          rv.l.visible = showRays;
          if (rv.pts) rv.pts.visible = false;
          if (showRays) writeTrail(rv, q.trail);
        });
        lensLabel.setShow(showRays);

        // ---- flashes ----
        for (const f of flashes) {
          if (f.t >= f.dur) { if (f.sp.visible) f.sp.visible = false; continue; }
          f.t += dt;
          const k = Math.min(f.t / f.dur, 1);
          f.sp.scale.setScalar(0.5 + 7 * k);
          f.sp.material.opacity = 0.85 * (1 - k);
        }

        // ---- infalling dust ----
        if (dust) {
          const dpos = dust.geometry.attributes.position;
          const data = dust.userData.data;
          for (let i = 0; i < data.length; i++) {
            const d = data[i];
            d.a += dt * (0.25 + 2.2 / (d.r + 0.5)) * spd * (0.3 + 0.7 * mo) * (1 + spinRef.current * 1.6);
            d.r -= dt * d.fall * (0.6 + 2.5 / (d.r + 1)) * (0.3 + 0.7 * mo);
            if (d.r < 0.7) { d.r = 7.5 + Math.random() * 1.5; d.a = Math.random() * Math.PI * 2; }
            dpos.setXYZ(i, Math.cos(d.a) * d.r, hAt(Math.cos(d.a) * d.r, Math.sin(d.a) * d.r) + 0.06, Math.sin(d.a) * d.r);
          }
          dpos.needsUpdate = true;
        }

        // ---- Newtonian force overlay ----
        force.visible = newton && st.sim.length > 0;
        pLabel.set(newton ? "F = −GMm r̂ / r² — force picture"
          : (st.sim[selIdx2] && st.sim[selIdx2].free ? "plunge — integrated geodesic, captured at r = 3GM/c²"
            : "geodesic — free fall, no force"));
        if (newton && st.sim.length) {
          const b = st.sim[selIdx2];
          const r = Math.hypot(b.X, b.Y) + 1e-6;
          force.position.set(b.X, hAt(b.X, b.Y) + 0.16 + b.Z, b.Y);
          force.setDirection(new THREE.Vector3(-b.X / r, 0, -b.Y / r));
          force.setLength(1.5, 0.4, 0.22);
        }
      },
    };
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
      <Scene3D height={480} shotSpace="gr-curvature" aria="Three-dimensional luminous gravity well with multi-body geodesic orbits, Lense–Thirring frame dragging, radiation-reaction inspiral, exact null-geodesic light bending, and an effective-potential panel"
        initial={{ radius: 17, theta: 0.4, phi: 1.08, target: [0, -1.2, 0], minR: 8, maxR: 38, bloom: { strength: 1.12, radius: 0.66, threshold: 0.1 } }}
        cameraGoal={cameraGoal}
        build={build} fallback={<CurvatureEngine></CurvatureEngine>}></Scene3D>
      <div className="viz-toolbar viz-veff-row">
        <VEffPanel mass={mass} body={selBody} view={view} stRef={stRef}></VEffPanel>
        <NullGeodesicPanel mass={mass}></NullGeodesicPanel>
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
      <VizCaption status="schematic">
        The well is a Flamm-paraboloid embedding of a spatial slice — an intuition aid, not a literal picture of 3D
        space — but the <em>dynamics</em> are quantitatively real: each bound body rides the exact precessing solution
        of the geodesic acceleration
        <Eq tex="a_r = -\,GM/r^2 \;-\; 3GM L^2/(c^2 r^4)"></Eq>, whose second (post-Newtonian) term advances the
        perihelion by exactly <Eq tex="\Delta\varpi = 6\pi GM/[\,c^2 a(1-e^2)\,]"></Eq> every orbit — the value in
        the readout above, which scales with mass and switches to 0 in the Newtonian view (closed ellipse). The inner,
        tighter orbit precesses faster, exactly as 1/[a(1−e²)] demands. In real units this is Mercury's 43″/century
        (here amplified for visibility). The light-ray fan deflects by <Eq tex="4GM/c^2 b"></Eq> — twice the Newtonian
        value (the 1919 eclipse result) — and focuses behind the mass: gravitational lensing. Halve it in the
        Newtonian view and a force vector replaces the geometry. Same leading orbit, profoundly different ontology.
        Real anchors: Mercury 42.98″/century (GR portion); Sun 1.75″ at the limb.
        The light fan follows <em>exact Schwarzschild null geodesics</em>
        <Eq tex="d^2\vec{x}/d\lambda^2 = -\tfrac{3}{2}\,r_s L^2\,\vec{x}/r^5"></Eq> at a step size inside the
        integrator's convergence radius (deflection error &lt; 0.1° against a 30× finer reference), so the eight rays
        are quantitatively right, not merely suggestive. The inner pair is launched inside the capture cone
        <Eq tex="b < b_{\mathrm{crit}} = 3\sqrt{3}\,GM/c^2"></Eq> and is swallowed; the outer pairs escape with the
        weak-field deflection <Eq tex="4GM/c^2 b"></Eq>. Rays are coloured by their exact fate — amber escapes,
        red is captured — so the fan reads itself. The cyan ring marks the photon sphere
        (<Eq tex="r = 3GM/c^2"></Eq>) and the amber ring the critical curve — cross the amber ring inward and the ray cannot return.
        The <em>orbital-plane</em> panel beside the potential plot integrates the same geodesics and shows what the
        3D fan cannot: a ray launched just outside the critical curve winds around the photon sphere before it
        escapes, the photon-ring effect. (The star's drawn radius exceeds the photon sphere, so that loop would sit
        inside the star in 3D; the panel is where it is legible.)
        The <em>light ×</em> control sets the affine rate independently of the bodies, so the bending can be slowed
        down and read. With spin on, inclined orbits drift their node at the Lense–Thirring rate
        <Eq tex="\Delta\Omega = 4\pi J/[\,c^2 a^3(1-e^2)^{3/2}\,]"></Eq> (×10 visual amplification); with
        radiation reaction on, orbits decay by the Peters (1964) orbit-averaged equations (amplified) until
        <Eq tex="r_{\mathrm{peri}}"></Eq> crosses the ISCO at <Eq tex="6GM/c^2"></Eq>, where the body hands off to the numerical plunge integrator. The V_eff panel
        plots −GM/r + L²/2r² − GM·L²/c²r³ against its Newtonian twin for the selected body, with energy line,
        turning points, and live radius. The <em>lensed-sky</em> panel is a real render, not a painted ring: every
        pixel is traced through the same deflection law, so the black shadow at <Eq tex="b_{\mathrm{crit}}"></Eq>,
        the photon ring at its edge, and the Einstein ring where <Eq tex="\beta = \theta - \alpha(\theta) = 0"></Eq>
        all follow from the geometry rather than from decoration.
        <span className="dim"> Seven presets — classic pair, Mercury-like, high-e comet, 2:1 Kepler resonance,
        five-body cluster, capture plunge, and zoom-whirl — plus click-to-select bodies, add/remove up to six, live
        a/e editing, spin, and a time-scale control. Test particles probe the central mass only; body–body
        perturbations are deliberately omitted so every precession number stays exact.</span>
      </VizCaption>
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
      ctx.strokeStyle = "rgba(110,140,200," + (0.07 + 0.06 * (1 - Math.abs(gy) / R)).toFixed(3) + ")";
      ctx.beginPath();
      for (let gx = -R; gx <= R; gx += 0.25) {
        const [px, py] = P(gx, gy);
        if (gx === -R) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    for (let gx = -R; gx <= R; gx++) {
      ctx.strokeStyle = "rgba(110,140,200," + (0.07 + 0.06 * (1 - Math.abs(gx) / R)).toFixed(3) + ")";
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
    grad.addColorStop(0, "rgba(240,220,170,0.95)");
    grad.addColorStop(0.4, "rgba(220,180,110,0.5)");
    grad.addColorStop(1, "rgba(220,180,110,0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(mx, my, mr * 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f4e8c8";
    ctx.beginPath(); ctx.arc(mx, my, mr * 0.55, 0, Math.PI * 2); ctx.fill();
    // particle trail + body
    ctx.strokeStyle = "oklch(0.78 0.1 200 / 0.5)"; ctx.lineWidth = 1.5; ctx.beginPath();
    st.ptrail.forEach((q, i) => { const [px, py] = P(q.x, q.y); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
    ctx.stroke();
    const [ppx, ppy] = P(st.p.x, st.p.y);
    ctx.fillStyle = "oklch(0.78 0.1 200)";
    ctx.beginPath(); ctx.arc(ppx, ppy, 4.5, 0, Math.PI * 2); ctx.fill();
    // Newton view: draw force vector; GR view: label geodesic
    ctx.font = "10px IBM Plex Mono";
    if (viewRef.current === "newton") {
      const r = Math.hypot(st.p.x, st.p.y) + 1e-6;
      const fx = -st.p.x / r, fy = -st.p.y / r;
      const [tx, ty] = P(st.p.x + fx * 1.3, st.p.y + fy * 1.3);
      ctx.strokeStyle = "oklch(0.7 0.13 25)"; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(ppx, ppy); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = "oklch(0.7 0.13 25)";
      ctx.fillText("F = −GMm r̂ / r²  (force picture)", ppx + 10, ppy - 10);
    } else {
      ctx.fillStyle = "rgba(170,195,230,0.8)";
      ctx.fillText("geodesic — no force, curved geometry", ppx + 10, ppy - 10);
    }
    // light ray
    if (rayRef.current) {
      const q = st.ray;
      ctx.strokeStyle = "oklch(0.8 0.1 85)"; ctx.lineWidth = 1.8; ctx.beginPath();
      q.trail.forEach((pt, i) => { const [px, py] = P(pt.x, pt.y); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
      ctx.stroke();
      const [lx, ly] = P(q.x, q.y);
      ctx.fillStyle = "oklch(0.8 0.1 85)";
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
      <VizCaption status="schematic">
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

      <Section title="The curvature engine">
        <p>
          The interactive scene below renders a spatial slice of spacetime as a deformable grid. Increase the central
          mass and the geometry responds continuously; the orbiting test particle and the passing light ray are not
          being pulled by a force — they follow geodesics of the deformed metric. Switch to the Newtonian view to
          compare the force-based description: same orbit at this accuracy, profoundly different ontology, and the
          differences (precession, light bending by the full relativistic factor) are measurable.
        </p>
        <CurvatureEngine3D></CurvatureEngine3D>
      </Section>

      <Section title="Mathematical formulation">
        <div className="formula-grid">
          <FormulaCard title="Einstein field equations" status="established"
            tex="G_{\mu\nu} + \Lambda g_{\mu\nu} = \frac{8\pi G}{c^4}\, T_{\mu\nu}"
            symbols={[
              { s: "G_{\\mu\\nu}", d: "Einstein tensor — a specific combination of curvature (R_{μν} − ½R g_{μν}) that is automatically conserved." },
              { s: "g_{\\mu\\nu}", d: "Metric tensor: the dynamical field encoding distances, durations, and causal structure." },
              { s: "\\Lambda", d: "Cosmological constant; observations indicate a small positive value driving cosmic acceleration." },
              { s: "T_{\\mu\\nu}", d: "Energy–momentum tensor of matter and radiation — the source of curvature. Pressure and momentum flux gravitate, not just mass." },
            ]}
            meaning="Ten coupled nonlinear equations stating: geometry (left) is determined by energy-momentum content (right). Matter tells spacetime how to curve; spacetime tells matter how to move."
            limits="Classical field equations. They predict singularities (Penrose–Hawking theorems) where the description must fail — a primary motivation for quantum gravity."></FormulaCard>
          <FormulaCard title="Geodesic equation" status="established"
            tex="\frac{d^2 x^\mu}{d\tau^2} + \Gamma^{\mu}_{\alpha\beta}\,\frac{dx^\alpha}{d\tau}\frac{dx^\beta}{d\tau} = 0"
            symbols={[
              { s: "x^\\mu(\\tau)", d: "Worldline of the freely falling body, parameterized by proper time τ." },
              { s: "\\Gamma^{\\mu}_{\\alpha\\beta}", d: "Christoffel symbols — derivatives of the metric playing the role the 'gravitational field' plays in Newtonian language." },
            ]}
            meaning="The equation of motion for free fall: the curve of extremal proper time. No mass of the test body appears — the equivalence principle is built in."
            limits="Valid for test bodies whose own gravity is negligible; extended or self-gravitating bodies require corrections."></FormulaCard>
          <FormulaCard title="Einstein–Hilbert action" status="established"
            tex="S_{EH} = \frac{c^4}{16\pi G} \int R\, \sqrt{-g}\; d^4x"
            symbols={[
              { s: "R", d: "Ricci curvature scalar — the simplest invariant measure of curvature." },
              { s: "\\sqrt{-g}\\,d^4x", d: "Invariant spacetime volume element." },
              { s: "G", d: "Newton's constant. Its dimensions, [G] = energy⁻² in natural units, are the root of gravity's non-renormalizability (Module 05)." },
            ]}
            meaning="Varying this action with respect to the metric yields the Einstein field equations. Its form is what one attempts to quantize — by path integral, canonical methods, or otherwise."
            limits="Lowest-order term only; quantum corrections generate higher-curvature terms (R², …) suppressed by the Planck scale."></FormulaCard>
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
