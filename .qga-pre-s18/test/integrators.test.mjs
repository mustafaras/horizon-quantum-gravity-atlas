/*
 * Numerical tests for the deterministic ODE integrators.
 *
 * The integrators are validated against closed-form solutions so that the
 * observed order of accuracy, the tolerance controller, and the termination
 * machinery are all checked against exact mathematics rather than against
 * previously recorded output.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  rk4Step,
  rk45Step,
  createRadialTermination,
  createPlaneCrossingTermination,
  combineTerminations,
  integrateFixedStep,
  integrateAdaptive,
  integrateUntilEvent,
} from "../js/science/integrators.mjs";

/* ---------- reference problems ---------- */

/** y' = y, y(0) = 1 => y(t) = exp(t). */
const exponentialRhs = (state) => [state[0]];

/** y'' = -y as a first-order system => (cos t, -sin t) from (1, 0). */
const oscillatorRhs = (state) => [state[1], -state[0]];

/** y' = -y => y(t) = exp(-t). */
const decayRhs = (state) => [-state[0]];

function integrateFixed(rhs, state, h, steps) {
  return integrateFixedStep({ rhs, state, h, steps });
}

/* ---------- single steps ---------- */

test("rk4Step advances a linear problem to fourth order in one step", () => {
  const h = 0.1;
  const exact = Math.exp(h);
  const numeric = rk4Step(exponentialRhs, [1], h)[0];
  // The RK4 local error is O(h^5); for y' = y it is exactly the truncated series.
  assert.ok(Math.abs(numeric - exact) < 1e-7);
  assert.ok(Math.abs(numeric - (1 + h + h ** 2 / 2 + h ** 3 / 6 + h ** 4 / 24)) < 1e-15);
});

test("rk4Step does not mutate the caller's state", () => {
  const state = [1, 0];
  const snapshot = state.slice();
  rk4Step(oscillatorRhs, state, 0.25);
  assert.deepEqual(state, snapshot);
});

test("rk4Step reproduces the harmonic oscillator phase", () => {
  const h = 0.01;
  let state = [1, 0];
  for (let index = 0; index < 100; index += 1) state = rk4Step(oscillatorRhs, state, h);
  assert.ok(Math.abs(state[0] - Math.cos(1)) < 1e-9);
  assert.ok(Math.abs(state[1] + Math.sin(1)) < 1e-9);
});

test("rk45Step returns a fifth-order state and a finite error estimate", () => {
  const h = 0.1;
  const attempt = rk45Step(exponentialRhs, [1], h, undefined, 1e-10, 1e-10);
  assert.equal(attempt.finite, true);
  assert.equal(attempt.state.length, 1);
  assert.equal(attempt.error.length, 1);
  assert.ok(Number.isFinite(attempt.errorNorm));
  assert.ok(attempt.errorNorm > 0);
  // The fifth-order solution is far more accurate than the embedded fourth-order
  // one, so the propagated state must beat the error estimate by orders of
  // magnitude.
  assert.ok(Math.abs(attempt.state[0] - Math.exp(h)) < 1e-7);
  assert.ok(Math.abs(attempt.error[0]) > Math.abs(attempt.state[0] - Math.exp(h)));
});

test("the rk45 error estimate scales as the fifth power of the step", () => {
  const coarse = rk45Step(exponentialRhs, [1], 0.2, undefined, 1e-10, 1e-10).errorNorm;
  const fine = rk45Step(exponentialRhs, [1], 0.1, undefined, 1e-10, 1e-10).errorNorm;
  const ratio = coarse / fine;
  // Halving h must cut the local error estimate by ~2^5 = 32.
  assert.ok(ratio > 28 && ratio < 36, `expected ~32, received ${ratio}`);
});

test("rk45Step reports a non-finite trial state instead of throwing", () => {
  const blowUp = (state) => [1 / (state[0] - state[0])];
  const attempt = rk45Step(blowUp, [1], 0.1);
  assert.equal(attempt.finite, false);
});

/* ---------- order of accuracy ---------- */

test("fixed-step RK4 shows fourth-order global convergence", () => {
  const errors = [0.1, 0.05, 0.025].map((h) => {
    const steps = Math.round(1 / h);
    const result = integrateFixed(exponentialRhs, [1], h, steps);
    return Math.abs(result.state[0] - Math.E);
  });
  const ratio1 = errors[0] / errors[1];
  const ratio2 = errors[1] / errors[2];
  // Halving h must cut the global error by ~2^4 = 16.
  assert.ok(ratio1 > 14 && ratio1 < 18, `expected ~16, received ${ratio1}`);
  assert.ok(ratio2 > 14 && ratio2 < 18, `expected ~16, received ${ratio2}`);
});

test("adaptive RK45 converges as the tolerance is tightened", () => {
  // The driver has no terminal time, so the run is bounded by an event at t = 1.
  const timeRhs = (state) => [1, state[1]];
  const stopAtOne = (state, previous) => {
    if (!previous) return null;
    if (!(previous[0] < 1 && state[0] >= 1)) return null;
    const fraction = (1 - previous[0]) / (state[0] - previous[0]);
    return {
      type: "time",
      state: [1, previous[1] + fraction * (state[1] - previous[1])],
      fraction,
      radius: 0,
    };
  };
  const run = (tolerance) =>
    integrateAdaptive({
      rhs: timeRhs,
      state: [0, 1],
      h0: 0.1,
      atol: tolerance,
      rtol: tolerance,
      event: stopAtOne,
    });
  const coarse = run(1e-4);
  const fine = run(1e-10);
  assert.equal(coarse.status, "event");
  assert.equal(fine.status, "event");
  assert.equal(fine.state[0], 1);
  const coarseError = Math.abs(coarse.state[1] - Math.E);
  const fineError = Math.abs(fine.state[1] - Math.E);
  assert.ok(fineError < coarseError, "a tighter tolerance must reduce the error");
  assert.ok(fineError < 1e-8, `expected < 1e-8, received ${fineError}`);
  assert.ok(fine.steps > coarse.steps, "a tighter tolerance must take more steps");
});

test("adaptive RK45 respects the maximum-step guard", () => {
  const result = integrateAdaptive({
    rhs: exponentialRhs,
    state: [1],
    h0: 0.5,
    hMax: 0.05,
    atol: 1e-10,
    rtol: 1e-10,
  });
  assert.ok(result.h <= 0.05 + 1e-12, `h must not exceed hMax; received ${result.h}`);
  assert.ok(result.steps >= 20, "a capped step must require at least 1/hMax steps");
});

test("adaptive RK45 honours the step budget and reports it", () => {
  const result = integrateAdaptive({
    rhs: exponentialRhs,
    state: [1],
    h0: 0.01,
    maxSteps: 7,
    atol: 1e-14,
    rtol: 1e-14,
  });
  assert.equal(result.status, "max-steps");
  // `maxSteps` bounds attempted steps, so accepted + rejected must equal it.
  assert.equal(result.steps + result.rejected, 7);
});

test("adaptive RK45 rejects a non-finite trajectory with status non-finite", () => {
  const blowUp = (state) => [state[0] * state[0]];
  const result = integrateAdaptive({
    rhs: blowUp,
    state: [1e150],
    h0: 1,
    hMin: 1e-6,
    maxSteps: 500,
    atol: 1e-10,
    rtol: 1e-10,
  });
  assert.equal(result.status, "non-finite");
  assert.ok(result.rejected > 0, "the driver must have rejected shrinking steps");
});

/* ---------- termination predicates ---------- */

test("the radial termination fires on the inner and outer bounds", () => {
  const predicate = createRadialTermination({
    innerRadius: 2,
    outerRadius: 10,
    innerType: "captured",
    outerType: "escaped",
  });
  assert.equal(predicate([0, 5, 0, 0]), null);
  assert.equal(predicate([0, 2, 0, 0]).type, "captured");
  assert.equal(predicate([0, 10, 0, 0]).type, "escaped");
  assert.equal(predicate([0, 1.5, 0, 0]).type, "captured");
  assert.equal(predicate([0, 1e6, 0, 0]).type, "escaped");
});

test("the plane-crossing termination interpolates and lands exactly on the plane", () => {
  const predicate = createPlaneCrossingTermination({ innerRadius: 0, outerRadius: 100 });
  const previous = [0, 8, 1.4, 0];
  const current = [0, 7, 1.7, 0.1];
  const hit = predicate(current, previous);
  assert.ok(hit, "the crossing must be detected");
  assert.equal(hit.type, "plane-crossing");
  assert.equal(hit.state[2], Math.PI / 2);
  assert.ok(hit.fraction > 0 && hit.fraction < 1);
  assert.ok(hit.radius > 7 && hit.radius < 8);
  // No crossing when both samples stay on the same side of the plane.
  assert.equal(predicate([0, 7, 1.2, 0], [0, 8, 1.0, 0]), null);
  // The first sample has no predecessor to bracket against.
  assert.equal(predicate(previous, null), null);
});

test("the plane-crossing termination respects the radial window", () => {
  const predicate = createPlaneCrossingTermination({ innerRadius: 10, outerRadius: 20 });
  assert.equal(predicate([0, 7, 1.7, 0], [0, 8, 1.4, 0]), null);
  assert.ok(predicate([0, 15, 1.7, 0], [0, 16, 1.4, 0]));
});

test("combineTerminations reports the first predicate that fires", () => {
  const combined = combineTerminations(
    createRadialTermination({ innerRadius: 2, innerType: "captured" }),
    createPlaneCrossingTermination({ type: "disk" }),
  );
  assert.equal(combined([0, 1.5, 1.0, 0], [0, 1.6, 1.0, 0]).type, "captured");
  assert.equal(combined([0, 8, 1.7, 0], [0, 9, 1.4, 0]).type, "disk");
  assert.equal(combined([0, 8, 1.0, 0], [0, 9, 1.0, 0]), null);
});

/* ---------- drivers with events ---------- */

test("integrateFixedStep stops at the first event and reports the event state", () => {
  const result = integrateFixedStep({
    rhs: exponentialRhs,
    state: [1],
    h: 0.1,
    steps: 1000,
    event: (state) => (state[0] >= 2 ? { type: "threshold", state: state.slice(), fraction: 1 } : null),
  });
  assert.equal(result.status, "event");
  assert.equal(result.event.type, "threshold");
  assert.ok(result.state[0] >= 2);
  assert.ok(result.state[0] < 2.2, "the event must stop the run promptly");
  assert.ok(result.steps < 1000);
});

test("integrateFixedStep reports completion when the budget is exhausted", () => {
  const result = integrateFixed(exponentialRhs, [1], 0.1, 10);
  assert.equal(result.status, "completed");
  assert.equal(result.steps, 10);
  // RK4 global error over [0, 1] with h = 0.1 is O(h^4) ~ 1e-4.
  assert.ok(Math.abs(result.state[0] - Math.exp(1)) < 1e-3);
});

test("integrateAdaptive refines an event to the stepper's order", () => {
  // y' = -y crosses y = 0.5 at t = ln 2.
  const result = integrateAdaptive({
    rhs: decayRhs,
    state: [1],
    h0: 0.4,
    atol: 1e-12,
    rtol: 1e-12,
    event: (state, previous) => {
      if (!previous) return null;
      const before = previous[0] - 0.5;
      const after = state[0] - 0.5;
      if (before === 0 || before * after > 0) return null;
      const fraction = before / (before - after);
      const interpolated = previous[0] + fraction * (state[0] - previous[0]);
      return { type: "level", state: [interpolated], fraction, radius: 0 };
    },
  });
  assert.equal(result.status, "event");
  assert.equal(result.event.type, "level");
  // Bisection refinement must locate the crossing far better than the raw step.
  assert.ok(Math.abs(result.state[0] - 0.5) < 1e-9, `received ${result.state[0]}`);
});

test("integrateUntilEvent is the adaptive driver", () => {
  const result = integrateUntilEvent({ rhs: exponentialRhs, state: [1], h0: 0.1, maxSteps: 5 });
  assert.equal(result.status, "max-steps");
  assert.equal(result.steps + result.rejected, 5);
});

test("integration is deterministic and never mutates the input state", () => {
  const state = [1, 0];
  const snapshot = state.slice();
  const options = { rhs: oscillatorRhs, state, h0: 0.1, maxSteps: 40, atol: 1e-10, rtol: 1e-10 };
  const first = integrateAdaptive(options);
  const second = integrateAdaptive(options);
  assert.deepEqual(state, snapshot);
  assert.deepEqual(first.state, second.state);
  assert.equal(first.steps, second.steps);
});

/* ---------- input validation ---------- */

test("invalid rhs, state, step and tolerance inputs are rejected", () => {
  assert.throws(() => rk4Step(null, [1], 0.1), TypeError);
  assert.throws(() => rk4Step(exponentialRhs, [], 0.1), TypeError);
  assert.throws(() => rk4Step(exponentialRhs, [Number.NaN], 0.1), RangeError);
  assert.throws(() => rk4Step(exponentialRhs, [1], 0), RangeError);
  assert.throws(() => rk4Step(exponentialRhs, [1], -0.1), RangeError);
  assert.throws(() => rk4Step(exponentialRhs, [1], "abc"), TypeError);
  assert.throws(() => rk45Step(exponentialRhs, [1], 0.1, undefined, 0, 1e-10), RangeError);
  assert.throws(() => rk45Step(exponentialRhs, [1], 0.1, undefined, 1e-10, -1), RangeError);
  assert.throws(() => rk45Step(exponentialRhs, [1], 0.1, undefined, "abc", 1e-10), TypeError);
});

test("a rhs with the wrong output length is rejected", () => {
  const wrongLength = () => [1, 2];
  assert.throws(() => rk4Step(wrongLength, [1], 0.1), RangeError);
  assert.throws(() => rk45Step(wrongLength, [1], 0.1), RangeError);
});

test("invalid driver options are rejected with descriptive errors", () => {
  assert.throws(() => integrateFixedStep({ rhs: exponentialRhs, state: [1], h: 0.1, steps: 0 }), RangeError);
  assert.throws(() => integrateFixedStep({ rhs: exponentialRhs, state: [1], h: 0.1, steps: 1.5 }), RangeError);
  assert.throws(
    () => integrateFixedStep({ rhs: exponentialRhs, state: [1], h: 0.1, steps: 10, event: 5 }),
    TypeError,
  );
  assert.throws(
    () => integrateAdaptive({ rhs: exponentialRhs, state: [1], h0: 0.1, hMin: 1, hMax: 0.1 }),
    RangeError,
  );
  assert.throws(
    () => integrateAdaptive({ rhs: exponentialRhs, state: [1], h0: 0.1, maxSteps: 0 }),
    RangeError,
  );
  assert.throws(
    () => integrateAdaptive({ rhs: exponentialRhs, state: [1], h0: 0.1, atol: 0 }),
    RangeError,
  );
  assert.throws(
    () => integrateAdaptive({ rhs: exponentialRhs, state: [1], h0: 0.1, event: "nope" }),
    TypeError,
  );
});

test("validation errors name the offending option", () => {
  assert.throws(
    () => integrateAdaptive({ rhs: exponentialRhs, state: [1], h0: 0.1, atol: -1 }),
    /atol/,
  );
  assert.throws(
    () => integrateAdaptive({ rhs: exponentialRhs, state: [1], h0: 0.1, hMin: 2, hMax: 1 }),
    /hMin/,
  );
  assert.throws(() => rk4Step(exponentialRhs, [1], 0), /h must be a strictly positive step size/);
});
