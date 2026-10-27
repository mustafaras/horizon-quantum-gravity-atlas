import test from "node:test";
import assert from "node:assert/strict";
import {
  KERR_PLASMA,
  plasmaEdgeOpacity,
  plasmaModulation,
  plasmaOctaveWeights,
} from "../js/visualizations/kerr/kerr-plasma.mjs";

test("plasma modulation is seeded and removes detail below the pixel footprint", () => {
  const point = { r: 10, phi: 1.2, omega: 0.02, time: 17, seed: 42 };
  const value = plasmaModulation(point);
  assert.ok(Number.isFinite(value) && value > 0);
  assert.equal(plasmaModulation(point), value);
  assert.notEqual(plasmaModulation({ ...point, seed: 43 }), value);
  assert.deepEqual(plasmaOctaveWeights(point.r, 100), Array(KERR_PLASMA.octaves).fill(0));
  assert.equal(plasmaModulation({ ...point, footprint: 100 }), 1);
});

test("turbulent disk opacity stays opaque inside its soft edge and vanishes at rOut", () => {
  const rOut = 24;
  assert.equal(plasmaEdgeOpacity(KERR_PLASMA.edgeStart * rOut, rOut), 1);
  assert.equal(plasmaEdgeOpacity(rOut, rOut), 0);
  const middle = plasmaEdgeOpacity(0.8 * rOut, rOut);
  assert.ok(middle > 0 && middle < 1);
});
