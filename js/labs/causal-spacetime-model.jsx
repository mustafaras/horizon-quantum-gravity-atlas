// causal-spacetime-model.jsx — the pure parts of the causal spacetime laboratory (Module 04), moved out of mod-gr.jsx in
// S19 so the module file could gain the Penrose section without growing. Nothing here draws: it is the preset table, the
// world window, the clamping and easing the lab's controls use, and the endpoint of a null ray on the plot border.
//
// The numbers are the documented defaults of the laboratory, and the state patch is the shape the URL state stores.

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

/** A coordinate clamped to the plot window, falling back to `fallback` when it is not a number. */
function clampCausalNumber(value, fallback, min = CAUSAL_WORLD.min, max = CAUSAL_WORLD.max) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : fallback;
}

/** Eased follow of a value over `duration` ms; under reduced motion it snaps to the target at once. */
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

/** Where a ray of direction (dx, dct) from `origin` leaves the plot window. */
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

/** The URL-state patch a preset writes. */
function causalStatePatch(preset, next) {
  return {
    grPreset: preset,
    grBeta: next.beta,
    grAt: next.a.ct, grAx: next.a.x,
    grBt: next.b.ct, grBx: next.b.x,
  };
}

window.CAUSAL_MODEL = Object.freeze({
  DEFAULT: CAUSAL_DEFAULT, PRESETS: CAUSAL_PRESET_STATE, WORLD: CAUSAL_WORLD, PLOT: CAUSAL_PLOT,
  clamp: clampCausalNumber, useEasedCausalValue, rayEndpoint: causalRayEndpoint, statePatch: causalStatePatch,
});
