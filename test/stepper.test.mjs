// stepper.test.mjs — the derivation stepper's state machine, reduced motion, and the label the stepper renders.
//
// The contract asks for two things that are easy to fake and easy to test: ← and → move between steps without leaving the
// range, and reduced motion snaps rather than animates. Both are properties of the controller, so they are asserted here
// without a browser. The third property — that a heuristic step says so on screen — is asserted on `stepView`, which is what
// the component draws.

import test from "node:test";
import assert from "node:assert/strict";

import { createStepper, stepView, STEPPER_KEYS } from "../js/formula/stepper.mjs";
import { derivations } from "../js/formula/library/derivations.mjs";

test("the stepper opens where it is told and clamps into range", () => {
  assert.equal(createStepper({ steps: 5 }).index(), 0);
  assert.equal(createStepper({ steps: 5, at: 3 }).index(), 3);
  assert.equal(createStepper({ steps: 5, at: 99 }).index(), 4, "past the end clamps to the last step");
  assert.equal(createStepper({ steps: 5, at: -3 }).index(), 0, "before the start clamps to the first");
  assert.throws(() => createStepper({ steps: 0 }), /positive integer/);
  assert.throws(() => createStepper({ steps: 1.5 }), /positive integer/);
});

test("← and → walk to the ends and stop there instead of wrapping", () => {
  const s = createStepper({ steps: 3 });
  assert.equal(s.next(), 1);
  assert.equal(s.next(), 2);
  assert.equal(s.next(), 2, "the last step is the end, not the first step again");
  assert.equal(s.previous(), 1);
  assert.equal(s.previous(), 0);
  assert.equal(s.previous(), 0, "the first step is the start");
  assert.deepEqual([s.first(), s.last(), s.goTo(1)], [0, 2, 1]);
  assert.equal(s.goTo(99), 2);
});

test("the state reports its ends, which is what disables the buttons", () => {
  const s = createStepper({ steps: 3 });
  assert.deepEqual([s.state().atStart, s.state().atEnd], [true, false]);
  s.last();
  assert.deepEqual([s.state().atStart, s.state().atEnd], [false, true]);
  assert.equal(s.state().steps, 3);
});

test("reduced motion snaps: the transition duration is zero and nothing else changes", () => {
  const normal = createStepper({ steps: 3 });
  const reduced = createStepper({ steps: 3, reduced: true });
  assert.equal(normal.state().transitionMs, 180);
  assert.equal(reduced.state().transitionMs, 0);
  assert.equal(reduced.state().reduced, true);
  // Stepping is identical: reduced motion changes how a change is drawn, never which step is shown.
  for (const s of [normal, reduced]) { s.next(); s.next(); s.previous(); }
  assert.equal(normal.index(), reduced.index());
});

test("the keyboard map handles the arrows, Home and End, and leaves other keys alone", () => {
  const s = createStepper({ steps: 4 });
  assert.deepEqual(s.key("ArrowRight"), { handled: true, index: 1 });
  assert.deepEqual(s.key("ArrowDown"), { handled: true, index: 2 });
  assert.deepEqual(s.key("ArrowLeft"), { handled: true, index: 1 });
  assert.deepEqual(s.key("ArrowUp"), { handled: true, index: 0 });
  assert.deepEqual(s.key("End"), { handled: true, index: 3 });
  assert.deepEqual(s.key("Home"), { handled: true, index: 0 });
  assert.deepEqual(s.key("Tab"), { handled: false, index: 0 }, "Tab must not be swallowed");
  assert.deepEqual(s.key("Enter"), { handled: false, index: 0 });
  assert.ok(STEPPER_KEYS.includes("ArrowRight"));
});

test("stepView draws the step's TeX, its justification and its position", () => {
  const d = derivations.casimirDerivation;
  const view = stepView(d, 0);
  assert.equal(view.position, 1);
  assert.equal(view.total, d.steps.length);
  assert.equal(view.tex, d.stepTex(d.steps[0].id));
  assert.equal(view.justification, d.steps[0].justification);
  assert.match(view.label, /^Step 1 of \d+\./);
  assert.throws(() => stepView(d, 99), /no step at index 99/);
});

test("a heuristic step puts the label in its accessible name, not just in a caption", () => {
  const d = derivations.schwarzschildRadiusDerivation;
  const index = d.steps.findIndex((s) => s.heuristic);
  const view = stepView(d, index);
  assert.equal(view.heuristic, d.steps[index].heuristic);
  assert.match(view.label, /Heuristic:/);
  // A step without one says nothing about heuristics, so the presence of the label is meaningful.
  const plain = stepView(d, d.steps.findIndex((s) => !s.heuristic));
  assert.equal(plain.heuristic, null);
  assert.doesNotMatch(plain.label, /Heuristic/);
});

test("every derivation can be walked end to end without leaving its range", () => {
  for (const d of Object.values(derivations)) {
    const s = createStepper({ steps: d.steps.length });
    for (let i = 0; i < d.steps.length + 3; i += 1) {
      const at = s.next();
      assert.ok(at >= 0 && at < d.steps.length, `${d.id}: index ${at} out of range`);
      assert.doesNotThrow(() => stepView(d, at), `${d.id} step ${at}`);
    }
    assert.equal(s.state().atEnd, true);
    s.first();
    assert.equal(s.state().atStart, true);
  }
});
