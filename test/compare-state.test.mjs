import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COMPARE_PRESETS, COMPARE_RENDER_MODES, validateCompareSide,
  cameraSpacesCompatible, diffStates, sampleTweenState,
} from "../js/compare/compare-state.mjs";

// Mirror of the app's clamping reader (js/state.jsx) — enough for the
// presets used here: enums validate, numbers clamp. The short-key map
// mirrors QGA_STATE_KEYS so validation round-trips exactly like the app.
const DEFAULTS = { view: "overview", bhMass: 1, bhSpin: 0, bhInclination: 75, pathway: "student" };
const STATE_KEYS = { view: "view", bhMass: "bhm", bhSpin: "bhs", bhInclination: "bhi", pathway: "pathway" };
const ENUMS = { view: ["overview", "sm", "qft", "rg", "gr", "planck", "approaches", "bh", "exp"], pathway: ["beginner", "student", "advanced"] };
const CLAMPS = { bhMass: [0, 9], bhSpin: [-0.998, 0.998], bhInclination: [3, 89] };
function fakeReadState(search = "") {
  const params = new URLSearchParams(search);
  const state = { ...DEFAULTS };
  const longKeys = Object.fromEntries(Object.entries(STATE_KEYS).map(([long, short]) => [short, long]));
  for (const [param, value] of params.entries()) {
    const key = longKeys[param] ?? param;
    if (ENUMS[key]?.includes(value)) state[key] = value;
    else if (CLAMPS[key]) {
      const number = Number(value);
      if (Number.isFinite(number)) state[key] = Math.min(CLAMPS[key][1], Math.max(CLAMPS[key][0], number));
    }
  }
  return state;
}

test("built-in presets are well-formed and render modes map to pipeline presets", () => {
  assert.ok(COMPARE_PRESETS.length >= 2);
  const ids = COMPARE_PRESETS.map((preset) => preset.id);
  assert.ok(ids.includes("schwarzschild-vs-kerr"));
  assert.ok(ids.includes("scientific-vs-cinematic"));
  for (const preset of COMPARE_PRESETS) {
    assert.equal(preset.sides.length, 2);
    assert.equal(new Set(preset.sides.map((side) => side.patch.view)).size, 1, "both sides share one view");
    for (const side of preset.sides) {
      assert.ok(COMPARE_RENDER_MODES[side.renderMode], "render mode must map to a pipeline preset");
    }
  }
  assert.equal(COMPARE_RENDER_MODES.scientific.pipelinePreset, "scientific");
  assert.equal(COMPARE_RENDER_MODES.cinematic.pipelinePreset, "cinematic");
});

test("compare sides validate through the app state reader", () => {
  const schwarzschild = validateCompareSide({ patch: { view: "bh", bhSpin: 0 }, readState: fakeReadState, defaults: DEFAULTS, stateKeys: STATE_KEYS });
  assert.equal(schwarzschild.ok, true);
  assert.equal(schwarzschild.state.view, "bh");
  const kerr = validateCompareSide({ patch: { view: "bh", bhSpin: 0.9 }, readState: fakeReadState, defaults: DEFAULTS, stateKeys: STATE_KEYS });
  assert.equal(kerr.ok, true);
  assert.equal(kerr.state.bhSpin, 0.9);

  // Unknown state keys are refused.
  const badKey = validateCompareSide({ patch: { view: "bh", nonsense: 1 }, readState: fakeReadState, defaults: DEFAULTS, stateKeys: STATE_KEYS });
  assert.equal(badKey.ok, false);
  assert.match(badKey.errors[0], /not an app state key/);
  // Values that do not survive clamping are refused (honesty guard).
  const clamped = validateCompareSide({ patch: { view: "bh", bhSpin: 5 }, readState: fakeReadState, defaults: DEFAULTS, stateKeys: STATE_KEYS });
  assert.equal(clamped.ok, false);
  assert.match(clamped.errors[0], /did not survive/);
  // Unknown render mode refused.
  const badMode = validateCompareSide({ patch: { view: "bh" }, renderMode: "vaporwave", readState: fakeReadState, defaults: DEFAULTS, stateKeys: STATE_KEYS });
  assert.equal(badMode.ok, false);
});

test("camera sync requires the same view and orbit declarations on both sides", () => {
  assert.equal(cameraSpacesCompatible({ view: "bh", cameraSpace: "orbit" }, { view: "bh", cameraSpace: "orbit" }), true);
  assert.equal(cameraSpacesCompatible({ view: "bh", cameraSpace: "orbit" }, { view: "gr", cameraSpace: "orbit" }), false, "different views never sync");
  assert.equal(cameraSpacesCompatible({ view: "bh", cameraSpace: "orbit" }, { view: "bh", cameraSpace: null }), false, "2D side never syncs");
  assert.equal(cameraSpacesCompatible(null, { view: "bh", cameraSpace: "orbit" }), false);
});

test("diffStates separates tweenable numbers from midpoint switches, deterministically", () => {
  const from = { view: "bh", bhMass: 1, bhSpin: 0, bhInclination: 75, seed: 42 };
  const to = { view: "bh", bhMass: 2, bhSpin: 0.9, bhInclination: 40, seed: 42 };
  const diff = diffStates(from, to);
  assert.deepEqual(diff.tweenable.map((entry) => entry.key), ["bhInclination", "bhMass", "bhSpin"], "sorted keys");
  assert.equal(diff.switches.length, 0);
  const withSwitch = diffStates({ view: "bh", gwMode: "generated" }, { view: "bh", gwMode: "real" });
  assert.deepEqual(withSwitch.tweenable, []);
  assert.deepEqual(withSwitch.switches, [{ key: "gwMode", value: "real" }]);
  // Deterministic: same inputs, same output.
  assert.deepEqual(diffStates(from, to), diff);
  assert.throws(() => diffStates(null, to), /two states/);
});

test("sampleTweenState interpolates numbers and lands switches at midpoint", () => {
  const from = { view: "bh", bhMass: 1, bhSpin: 0, gwMode: "generated" };
  const to = { view: "bh", bhMass: 3, bhSpin: 0.8, gwMode: "real" };
  const diff = diffStates(from, to);
  const quarter = sampleTweenState(from, diff, 0.25);
  assert.equal(quarter.bhMass, 1.5);
  assert.equal(quarter.bhSpin, 0.2);
  assert.equal(quarter.gwMode, "generated", "switch not yet applied");
  const mid = sampleTweenState(from, diff, 0.5);
  assert.equal(mid.bhMass, 2);
  assert.equal(mid.gwMode, "real", "switch applied at midpoint");
  const end = sampleTweenState(from, diff, 1);
  assert.equal(end.bhMass, 3);
  assert.equal(end.bhSpin, 0.8);
  // Base is never mutated.
  assert.equal(from.bhMass, 1);
});
