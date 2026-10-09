/*
 * Deterministic ODE integrators for the HORIZON scientific core.
 *
 * Two schemes are provided:
 *
 *   - `rk4Step` / `integrateFixedStep`  classical explicit fourth-order
 *     Runge-Kutta with a fixed step. Cheap, deterministic, no error estimate.
 *
 *   - `rk45Step` / `integrateAdaptive`  Dormand-Prince 5(4) embedded pair with
 *     an absolute/relative tolerance controller, a maximum-step guard, and a
 *     minimum-step floor. The fifth-order solution is propagated; the
 *     difference against the embedded fourth-order solution drives the step
 *     size.
 *
 * Both drivers share the same termination machinery:
 *
 *   - `event` callbacks are evaluated after every accepted step and may stop
 *     the integration with a typed payload (horizon, escape, disk crossing).
 *   - non-finite trial states are rejected and the step is retried smaller;
 *     if the step floor is reached the run ends with status "non-finite".
 *   - `maxSteps` bounds the total number of attempted steps.
 *
 * The integrators are pure: they never mutate the caller's state array and
 * they never read a clock, a random source, or global state.
 *
 * References
 * ----------
 * - Dormand & Prince, "A family of embedded Runge-Kutta formulae",
 *   J. Comput. Appl. Math. 6 (1980) 19-26. doi:10.1016/0771-050X(80)90013-3
 * - Hairer, Norsett & Wanner, "Solving Ordinary Differential Equations I"
 *   (2nd ed., 1993), section II.4 (step-size control).
 */

import {
  assertFiniteNumber,
  assertFiniteState,
  assertPositiveInteger,
  assertStepCeiling,
  assertStepSize,
  assertTolerance,
} from "./constants.mjs";

/* ---------- Dormand-Prince 5(4) tableau ---------- */

const DP_C = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1];

const DP_A = [
  [],
  [1 / 5],
  [3 / 40, 9 / 40],
  [44 / 45, -56 / 15, 32 / 9],
  [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
  [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
  [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
];

/** Fifth-order weights (also the a7 row of the tableau). */
const DP_B5 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];

/** Embedded fourth-order weights used only for the error estimate. */
const DP_B4 = [
  5179 / 57600,
  0,
  7571 / 16695,
  393 / 640,
  -92097 / 339200,
  187 / 2100,
  1 / 40,
];

const SAFETY = 0.9;
const MIN_FACTOR = 0.2;
const MAX_FACTOR = 5;

/* ---------- helpers ---------- */

function assertRhs(rhs) {
  if (typeof rhs !== "function") {
    throw new TypeError("rhs must be a function (state, params) => derivative array");
  }
}

function assertStateLength(state, derivative, name) {
  if (derivative.length !== state.length) {
    throw new RangeError(
      `${name} returned ${derivative.length} components for a ${state.length}-component state`,
    );
  }
}

function allFinite(values) {
  for (let index = 0; index < values.length; index += 1) {
    if (!Number.isFinite(values[index])) return false;
  }
  return true;
}

function combine(state, h, weights, stages) {
  const out = new Array(state.length);
  for (let i = 0; i < state.length; i += 1) {
    let sum = 0;
    for (let s = 0; s < stages.length; s += 1) {
      const w = weights[s];
      if (w !== 0) sum += w * stages[s][i];
    }
    out[i] = state[i] + h * sum;
  }
  return out;
}

/* ---------- single steps ---------- */

/**
 * One classical RK4 step.
 * @param {(state: number[], params: unknown) => number[]} rhs
 * @param {number[]} state
 * @param {number} h
 * @param {unknown} [params]
 * @returns {number[]} the state advanced by h
 */
export function rk4Step(rhs, state, h, params) {
  assertRhs(rhs);
  assertFiniteState(state, "state");
  assertStepSize(h, "h");
  const n = state.length;
  const k1 = rhs(state, params);
  assertStateLength(state, k1, "rhs");
  const y2 = new Array(n);
  for (let i = 0; i < n; i += 1) y2[i] = state[i] + (h / 2) * k1[i];
  const k2 = rhs(y2, params);
  assertStateLength(state, k2, "rhs");
  const y3 = new Array(n);
  for (let i = 0; i < n; i += 1) y3[i] = state[i] + (h / 2) * k2[i];
  const k3 = rhs(y3, params);
  assertStateLength(state, k3, "rhs");
  const y4 = new Array(n);
  for (let i = 0; i < n; i += 1) y4[i] = state[i] + h * k3[i];
  const k4 = rhs(y4, params);
  assertStateLength(state, k4, "rhs");
  const out = new Array(n);
  for (let i = 0; i < n; i += 1) {
    out[i] = state[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }
  return out;
}

/**
 * One Dormand-Prince 5(4) step.
 * @returns {{ state: number[], error: number[], errorNorm: number, finite: boolean }}
 */
export function rk45Step(rhs, state, h, params, atol = 1e-10, rtol = 1e-10) {
  assertRhs(rhs);
  assertFiniteState(state, "state");
  assertStepSize(h, "h");
  assertTolerance(atol, "atol");
  assertTolerance(rtol, "rtol");
  const n = state.length;
  const stages = new Array(7);
  stages[0] = rhs(state, params);
  assertStateLength(state, stages[0], "rhs");
  for (let s = 1; s < 7; s += 1) {
    const y = new Array(n);
    for (let i = 0; i < n; i += 1) {
      let sum = 0;
      for (let j = 0; j < s; j += 1) {
        const a = DP_A[s][j];
        if (a !== 0) sum += a * stages[j][i];
      }
      y[i] = state[i] + h * sum;
    }
    stages[s] = rhs(y, params);
    assertStateLength(state, stages[s], "rhs");
  }
  const high = combine(state, h, DP_B5, stages);
  const low = combine(state, h, DP_B4, stages);
  const error = new Array(n);
  let sumSquares = 0;
  for (let i = 0; i < n; i += 1) {
    const e = high[i] - low[i];
    error[i] = e;
    const scale = atol + rtol * Math.abs(state[i]);
    const ratio = e / scale;
    sumSquares += ratio * ratio;
  }
  const errorNorm = Math.sqrt(sumSquares / n);
  return { state: high, error, errorNorm, finite: allFinite(high) && Number.isFinite(errorNorm) };
}

/* ---------- termination predicates ---------- */

/**
 * Terminate when the radial coordinate leaves an allowed band.
 * Used for horizon capture (inner bound) and escape (outer bound).
 */
export function createRadialTermination({
  innerRadius = -Infinity,
  outerRadius = Infinity,
  innerType = "inner-boundary",
  outerType = "outer-boundary",
} = {}) {
  return (state) => {
    const radius = state[1];
    if (Number.isFinite(innerRadius) && radius <= innerRadius) {
      return { type: innerType, state: state.slice(), fraction: 1, radius };
    }
    if (Number.isFinite(outerRadius) && radius >= outerRadius) {
      return { type: outerType, state: state.slice(), fraction: 1, radius };
    }
    return null;
  };
}

/**
 * Terminate when the polar coordinate crosses a plane (default the equatorial
 * plane theta = pi/2) while the radius lies inside [innerRadius, outerRadius].
 * The radius and azimuth are linearly interpolated inside the accepted step and
 * the polar angle is set to the plane exactly, so the reported event lies on the
 * plane rather than O(h^2) away from it.
 */
export function createPlaneCrossingTermination({
  planeTheta = Math.PI / 2,
  innerRadius = -Infinity,
  outerRadius = Infinity,
  type = "plane-crossing",
} = {}) {
  const target = Math.cos(planeTheta);
  return (state, previousState) => {
    if (!previousState) return null;
    const before = Math.cos(previousState[2]) - target;
    const after = Math.cos(state[2]) - target;
    if (before === 0) return null;
    if (before * after > 0) return null;
    const denominator = before - after;
    const fraction = denominator === 0 ? 0 : before / denominator;
    const interpolated = state.map(
      (value, index) => previousState[index] + fraction * (value - previousState[index]),
    );
    interpolated[2] = planeTheta;
    const radius = interpolated[1];
    if (radius < innerRadius || radius > outerRadius) return null;
    return { type, state: interpolated, fraction, radius };
  };
}

/** Evaluate a list of termination predicates in order; first hit wins. */
export function combineTerminations(...predicates) {
  const active = predicates.filter((predicate) => typeof predicate === "function");
  return (state, previousState, h) => {
    for (const predicate of active) {
      const hit = predicate(state, previousState, h);
      if (hit) return hit;
    }
    return null;
  };
}

/* ---------- drivers ---------- */

/**
 * Locate an event to the stepper's own order by bisecting the bracketing step
 * fraction and re-taking the step from the pre-event state. The predicate itself
 * is the sign oracle, so this works for any termination predicate that reports a
 * `fraction` inside (0, 1). Falls back to the predicate's linear interpolation
 * when the stepper cannot refine.
 */
function refineEvent(attempt, previous, hit, event) {
  const fallback = Array.isArray(hit.state) ? hit.state : null;
  if (!previous || typeof attempt.refine !== "function") return { state: fallback, event: hit };
  if (!(hit.fraction > 0 && hit.fraction < 1)) return { state: fallback, event: hit };
  let lo = 0;
  let hi = 1;
  let best = null;
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const mid = 0.5 * (lo + hi);
    const refined = attempt.refine(previous, mid);
    if (!refined || !refined.finite) break;
    const refinedHit = event(refined.state, previous, attempt.h * mid);
    if (refinedHit) {
      best = {
        state: Array.isArray(refinedHit.state) ? refinedHit.state : refined.state,
        event: refinedHit,
      };
      hi = mid;
    } else {
      lo = mid;
    }
    if (hi - lo < 1e-12) break;
  }
  return best || { state: fallback, event: hit };
}

function runDriver({ rhs, state, params, event, maxSteps, stepper }) {
  let current = state.slice();
  let previous = null;
  let steps = 0;
  let rejected = 0;
  let status = "max-steps";
  let termination = null;
  let lastError = 0;
  let h = 0;

  while (steps + rejected < maxSteps) {
    const attempt = stepper(current, previous);
    h = attempt.h;
    if (!attempt.finite) {
      rejected += 1;
      if (attempt.exhausted) {
        status = "non-finite";
        break;
      }
      continue;
    }
    steps += 1;
    lastError = attempt.errorNorm;
    previous = current;
    current = attempt.state;
    if (event) {
      const hit = event(current, previous, h);
      if (hit) {
        const refined = refineEvent(attempt, previous, hit, event);
        termination = refined.event;
        status = "event";
        // Terminate *at* the event, not at the far side of the bracketing step.
        if (refined.state) current = refined.state;
        break;
      }
    }
    if (attempt.done) {
      status = "completed";
      break;
    }
  }

  return {
    state: current,
    previousState: previous,
    steps,
    rejected,
    h,
    errorNorm: lastError,
    status,
    event: termination,
  };
}

/**
 * Fixed-step RK4 driver.
 * @returns {{ state: number[], steps: number, h: number, status: string, event: object|null }}
 */
export function integrateFixedStep({
  rhs,
  state,
  h,
  steps,
  params,
  event = null,
} = {}) {
  assertRhs(rhs);
  assertFiniteState(state, "state");
  const step = assertStepSize(h, "h");
  const total = assertPositiveInteger(steps, "steps");
  if (event !== null && typeof event !== "function") {
    throw new TypeError("event must be a function or null");
  }
  let taken = 0;
  return runDriver({
    rhs,
    state,
    params,
    event,
    maxSteps: total,
    stepper: (current) => {
      const next = rk4Step(rhs, current, step, params);
      const finite = allFinite(next);
      if (finite) taken += 1;
      return {
        state: next,
        h: step,
        finite,
        exhausted: true,
        errorNorm: 0,
        done: finite && taken >= total,
        refine: (from, fraction) => {
          const refined = rk4Step(rhs, from, step * fraction, params);
          return { state: refined, finite: allFinite(refined) };
        },
      };
    },
  });
}

/**
 * Adaptive Dormand-Prince 5(4) driver with absolute/relative tolerances, a
 * maximum-step guard (`hMax`), a minimum-step floor (`hMin`), and a hard
 * `maxSteps` budget.
 *
 * @returns {{
 *   state: number[], steps: number, rejected: number, h: number,
 *   errorNorm: number, status: string, event: object|null
 * }}
 */
export function integrateAdaptive({
  rhs,
  state,
  h0,
  hMin = 1e-12,
  hMax = Infinity,
  maxSteps = 100000,
  atol = 1e-10,
  rtol = 1e-10,
  params,
  event = null,
} = {}) {
  assertRhs(rhs);
  assertFiniteState(state, "state");
  const initialStep = assertStepSize(h0, "h0");
  const floor = assertStepSize(hMin, "hMin");
  const ceiling = assertStepCeiling(hMax, "hMax");
  if (floor > ceiling) {
    throw new RangeError(`hMin (${floor}) must not exceed hMax (${ceiling})`);
  }
  const budget = assertPositiveInteger(maxSteps, "maxSteps");
  const absTol = assertTolerance(atol, "atol");
  const relTol = assertTolerance(rtol, "rtol");
  if (event !== null && typeof event !== "function") {
    throw new TypeError("event must be a function or null");
  }

  let h = Math.min(initialStep, ceiling);

  return runDriver({
    rhs,
    state,
    params,
    event,
    maxSteps: budget,
    stepper: (current) => {
      const attempt = rk45Step(rhs, current, h, params, absTol, relTol);
      if (!attempt.finite) {
        const shrunk = h * MIN_FACTOR;
        if (shrunk < floor) {
          return { state: current, h, finite: false, exhausted: true, errorNorm: Infinity, done: false };
        }
        h = shrunk;
        return { state: current, h, finite: false, exhausted: false, errorNorm: Infinity, done: false };
      }
      const norm = attempt.errorNorm;
      let factor;
      if (norm === 0) {
        factor = MAX_FACTOR;
      } else {
        factor = SAFETY * norm ** (-1 / 5);
      }
      if (norm <= 1) {
        const stepUsed = h;
        const next = Math.min(ceiling, Math.max(floor, h * Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, factor))));
        const result = {
          state: attempt.state,
          h: stepUsed,
          finite: true,
          errorNorm: norm,
          done: false,
          refine: (from, fraction) => rk45Step(rhs, from, stepUsed * fraction, params, absTol, relTol),
        };
        h = next;
        return result;
      }
      const shrunk = Math.max(floor, h * Math.min(1, Math.max(MIN_FACTOR, factor)));
      if (shrunk >= h) {
        // Cannot make progress: accept the step rather than spin forever.
        const stepUsed = h;
        const result = {
          state: attempt.state,
          h: stepUsed,
          finite: true,
          errorNorm: norm,
          done: false,
          refine: (from, fraction) => rk45Step(rhs, from, stepUsed * fraction, params, absTol, relTol),
        };
        h = Math.min(ceiling, h * MAX_FACTOR);
        return result;
      }
      h = shrunk;
      return { state: current, h, finite: false, exhausted: false, errorNorm: norm, done: false };
    },
  });
}

/**
 * Convenience wrapper: integrate until `event` fires or `maxSteps` is reached,
 * returning only the terminal state and status.
 */
export function integrateUntilEvent(options) {
  return integrateAdaptive(options);
}

/** Re-exported for callers that want to validate a state before integrating. */
export { assertFiniteState, assertFiniteNumber };
