// S14: the step plan of the lattice lab: fixed simulated time per frame, a governor budget that only cuts it finer, and slider ranges that stay stable.

import test from "node:test";
import assert from "node:assert/strict";
import { LATTICE_VIEW, stepPlan, budgetFromQuality } from "../js/visualizations/qft/lattice-plan.mjs";
import { createLattice, maxStableDt, MAX_DT_OVER_A } from "../js/science/lattice-field.mjs";

test("every plan simulates the same time per frame, whatever the budget", () => {
  const { frameTime, baseDt } = LATTICE_VIEW;
  for (const budget of [0, 0.25, 0.5, 0.75, 1]) {
    const plan = stepPlan({ frameTime, dtMax: baseDt, budget });
    assert.ok(Math.abs(plan.steps * plan.dt - frameTime) < 1e-12, `budget ${budget}: ${plan.steps} x ${plan.dt}`);
    assert.ok(Number.isInteger(plan.steps) && plan.dt <= baseDt + 1e-12);
  }
});

test("the budget only changes how finely the frame is cut: 4 steps at the cap, 8 at full headroom", () => {
  const { frameTime, baseDt } = LATTICE_VIEW;
  assert.deepEqual({ ...stepPlan({ frameTime, dtMax: baseDt, budget: 0 }) }, { steps: 4, dt: 0.1 });
  assert.deepEqual({ ...stepPlan({ frameTime, dtMax: baseDt, budget: 1 }) }, { steps: 8, dt: 0.05 });
  let previous = 0;
  for (let budget = 0; budget <= 1; budget += 0.05) {
    const { steps } = stepPlan({ frameTime, dtMax: baseDt, budget });
    assert.ok(steps >= previous, "more headroom never means fewer steps");
    previous = steps;
  }
  assert.throws(() => stepPlan({ frameTime, dtMax: baseDt, budget: 1.2 }), RangeError);
  assert.throws(() => stepPlan({ frameTime: 0, dtMax: baseDt, budget: 0.5 }), RangeError);
});

test("the governor's raySteps maps to the budget: the floor is 0, the ceiling 1, and no quality means full headroom", () => {
  assert.equal(budgetFromQuality({ raySteps: 48 }, 128), 0);
  assert.equal(budgetFromQuality({ raySteps: 128 }, 128), 1);
  assert.equal(budgetFromQuality({ raySteps: 88 }, 128), 0.5);
  assert.equal(budgetFromQuality({ raySteps: 10 }, 128), 0, "below the floor is clamped");
  assert.equal(budgetFromQuality(null, 128), 1);
  assert.equal(budgetFromQuality({ raySteps: 64 }, 40), 1, "a ceiling at or below the floor leaves nothing to govern");
});

test("the lab's slider ranges and its largest step stay inside the stability bound, with the nonlinear stiffening of a field amplitude of 1.5", () => {
  const { spacing, baseDt, mass2Range, lambdaRange } = LATTICE_VIEW;
  for (const mass2 of mass2Range) {
    for (const lambda of lambdaRange) {
      const lattice = createLattice({ dim: 2, n: 256, a: spacing, mass2, lambda, dt: baseDt });
      const amplitude = 1.5;
      const omegaEffective = Math.sqrt(lattice.omegaMax ** 2 + (lambda * amplitude * amplitude) / 2);
      assert.ok(baseDt * omegaEffective < 2, `m^2 = ${mass2}, lambda = ${lambda}: dt omega = ${baseDt * omegaEffective}`);
    }
  }
  assert.ok(baseDt <= MAX_DT_OVER_A * spacing + 1e-12);
  assert.ok(baseDt <= maxStableDt({ dim: 2, a: spacing, mass2: mass2Range[1] }) + 1e-12);
  for (const size of Object.values(LATTICE_VIEW.detailSizes)) assert.ok(Number.isInteger(Math.log2(size)), "the lattice is a power of two, as the CPU reference requires");
});
