import { test } from "node:test";
import assert from "node:assert/strict";
import { createQualityGovernor } from "../js/render/quality-governor.mjs";

const quality = { preset: "ultra", maxDpr: 2, temporalSamples: 4, ssgi: true, raySteps: 160, particleBudget: 24000, postEffects: true };
function windowOf(governor, ms, time) {
  let result;
  for (let i = 0; i < 4; i++) result = governor.sample(ms, time + i);
  return result;
}
test("rolling windows, hysteresis and minimum cooldown reject transient load", () => {
  const g = createQualityGovernor({ quality, windowSize: 4, slowWindows: 2, fastWindows: 2 });
  assert.equal(windowOf(g, 30, 0).change, null);
  assert.equal(windowOf(g, 30, 3000).change.dimension, "maxDpr");
  assert.equal(g.quality.maxDpr, 1.75);
  assert.equal(windowOf(g, 30, 3100).change, null);
  assert.equal(windowOf(g, 30, 4000).change, null);
  assert.equal(windowOf(g, 20, 6500).change, null);
  assert.equal(windowOf(g, 12, 6600).change, null);
  assert.equal(windowOf(g, 12, 7000).change.dimension, "maxDpr");
  assert.equal(g.quality.maxDpr, 2);
  assert.equal(g.quality.preset, "ultra");
});
test("downgrade and upgrade use deterministic DPR, samples, SSGI, steps, particles order", () => {
  const g = createQualityGovernor({ quality, windowSize: 4, slowWindows: 1, fastWindows: 1 });
  const changes = [];
  for (let t = 4000; t < 100000; t += 4000) {
    const result = windowOf(g, 40, t);
    if (result.change) changes.push(result.change.dimension);
  }
  assert.deepEqual([...new Set(changes)], ["maxDpr", "temporalSamples", "ssgi", "raySteps", "particleBudget"]);
  const before = g.quality;
  const up = windowOf(g, 10, 110000);
  assert.equal(up.change.dimension, "maxDpr");
  assert.equal(g.quality.particleBudget, before.particleBudget);
  assert.ok(Object.isFrozen(g.quality));
  const upgrades = [up.change.dimension];
  for (let t = 114000; t < 220000; t += 4000) {
    const result = windowOf(g, 10, t);
    if (result.change) upgrades.push(result.change.dimension);
  }
  assert.deepEqual([...new Set(upgrades)], ["maxDpr", "temporalSamples", "ssgi", "raySteps", "particleBudget"]);
  assert.deepEqual(g.quality, quality);
});
test("FPS is a bounded rolling mean, not the last frame or a lifetime average", () => {
  const g = createQualityGovernor({ quality, windowSize: 4 });
  g.sample(10, 10); g.sample(10, 20); g.sample(10, 30);
  assert.equal(g.sample(30, 40).fps, 1000 / 15);
  assert.equal(g.sample(30, 50).fps, 50);
  assert.equal(g.sample(300, 60).fps, 1000 / 92.5);
});
test("severely slow visible frames retain honest FPS and trigger sustained downgrades", () => {
  const g = createQualityGovernor({ quality, windowSize: 4 });
  assert.equal(windowOf(g, 1000, 0).fps, 1);
  const result = windowOf(g, 1000, 4000);
  assert.equal(result.fps, 1);
  assert.equal(result.change.dimension, "maxDpr");
  g.resetWindow();
  assert.equal(g.sample(16, 8000).fps, 62.5);
});
test("inactive budgets are not adjusted and samples remain bounded", () => {
  const g = createQualityGovernor({ quality, windowSize: 4, slowWindows: 1, active: ["particleBudget"] });
  const result = windowOf(g, 40, 4000);
  assert.equal(result.change.dimension, "particleBudget");
  assert.equal(result.quality.maxDpr, 2);
  assert.equal(g.sample(0, 5000).change, null);
  assert.throws(() => g.sample(NaN, 6000), /frame/);
  assert.throws(() => g.sample(20, -1), /time/);
  assert.throws(() => createQualityGovernor({ quality, cooldownMs: 2000 }), /3000/);
  g.resetWindow();
  assert.equal(g.sample(20, 6001).fps, 50);
});
