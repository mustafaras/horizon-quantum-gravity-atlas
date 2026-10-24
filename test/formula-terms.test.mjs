import test from "node:test";
import assert from "node:assert/strict";

import { library } from "../js/formula/library/index.mjs";
import { createLensRegistry } from "../js/formula/lens.mjs";
import { createConceptBus } from "../js/linking/concept-bus.mjs";
import { createTermController } from "../js/linking/formula-terms.mjs";
import { SOLAR_MASS } from "../js/science/constants.mjs";

const { schwarzschildRadius } = library;

function setup({ bound = true } = {}) {
  const bus = createConceptBus({ diagnostic() {} });
  const registry = createLensRegistry({ diagnostic() {} });
  if (bound) {
    registry.bindScene("bh", "schwarzschild-radius", {
      termTargets: { r_s: { kind: "object", objectName: "horizon" }, M: { kind: "object", objectName: "mass" } },
      live: () => ({ env: { M: SOLAR_MASS } }),
    });
  }
  const events = [], readouts = [];
  bus.on("formula-term", (payload) => events.push(["term", payload.termId, payload.value]));
  bus.on("formula-clear", (payload) => events.push(["clear", payload.reason]));
  const controller = createTermController({ formula: schwarzschildRadius, registry, bus, onReadout: (r) => readouts.push(r) });
  return { bus, registry, controller, events, readouts };
}

test("entering a term publishes formula-term with its live value and reports a readout", () => {
  const { controller, events, readouts } = setup();
  controller.enter("r_s");
  assert.equal(events.length, 1);
  assert.equal(events[0][0], "term");
  assert.equal(events[0][1], "r_s");
  assert.ok(Math.abs(events[0][2] - 2953.25) < 0.5);
  assert.deepEqual(readouts.at(-1), { termId: "r_s", label: "Schwarzschild radius: r_s", value: "2953", unit: "m" });
  assert.equal(controller.shown, "r_s");
});

test("leaving publishes formula-clear once, and entering the same term again publishes nothing new", () => {
  const { controller, events, readouts } = setup();
  controller.enter("r_s");
  controller.enter("r_s");
  assert.equal(events.length, 1, "no duplicate event for the same term");
  controller.leave("r_s");
  assert.deepEqual(events.at(-1), ["clear", "blur"]);
  controller.leave("r_s");
  assert.equal(events.filter((e) => e[0] === "clear").length, 1, "nothing to clear the second time");
  assert.equal(readouts.at(-1), null);
});

test("moving from an inner term to the term around it swaps the highlight without a lasting clear", () => {
  const { controller } = setup();
  controller.enter("M");
  controller.leave("M");
  controller.enter("r_s");
  assert.equal(controller.shown, "r_s");
});

test("a pinned term survives the pointer leaving and returns after a transient hover", () => {
  const { controller, events } = setup();
  assert.equal(controller.toggle("r_s"), true);
  controller.leave("r_s");
  assert.equal(controller.shown, "r_s", "pinned: still shown");
  controller.enter("M");
  assert.equal(controller.shown, "M");
  controller.leave("M");
  assert.equal(controller.shown, "r_s", "back to the pinned term");
  assert.equal(controller.toggle("r_s"), false, "second activation unpins");
  assert.equal(controller.shown, null);
  assert.deepEqual(events.at(-1), ["clear", "blur"]);
});

test("escape drops the pin and the highlight with reason escape; dispose clears with reason navigation", () => {
  const { controller, events } = setup();
  controller.toggle("M");
  controller.escape();
  assert.equal(controller.pinned, null);
  assert.deepEqual(events.at(-1), ["clear", "escape"]);
  controller.enter("r_s");
  controller.dispose();
  assert.deepEqual(events.at(-1), ["clear", "navigation"]);
  controller.enter("r_s");
  assert.equal(controller.shown, null, "a disposed controller ignores input");
});

test("a term no scene explains publishes nothing but still clears cleanly", () => {
  const { controller, events, readouts } = setup({ bound: false });
  controller.enter("r_s");
  assert.deepEqual(events, [], "M is unknown without a scene: no event");
  assert.equal(readouts.at(-1), null);
  controller.leave("r_s");
  assert.deepEqual(events, []);
});

test("unknown term ids are ignored", () => {
  const { controller, events } = setup();
  controller.enter("nope");
  controller.toggle("nope");
  assert.deepEqual(events, []);
  assert.equal(controller.pinned, null);
});
