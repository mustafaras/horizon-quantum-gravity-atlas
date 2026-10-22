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

function gpuWindow(governor, cpuMs, gpuMs, time) {
  let result;
  for (let i = 0; i < 4; i++) result = governor.sample(cpuMs, time + i, gpuMs);
  return result;
}
test("gpuFrameMs: a window judged on GPU time ignores vsync-padded CPU frame time", () => {
  const g = createQualityGovernor({ quality, windowSize: 4, slowWindows: 1, fastWindows: 1 });
  // 16.7 ms CPU frames (vsync) with 3 ms of GPU work are neither slow nor, with the default 4 ms, anything but fast.
  const result = gpuWindow(g, 16.7, 3, 4000);
  assert.equal(result.gpuMs, 3);
  assert.equal(result.change, null, "already at the ceiling, nothing to raise");
  assert.equal(g.quality.maxDpr, 2);
  const slow = gpuWindow(g, 16.7, 12, 8000);
  assert.equal(slow.change.dimension, "maxDpr", "12 ms of GPU time is over the 8 ms desktop budget");
  assert.equal(slow.change.direction, "down");
});
test("gpuFrameMs: thresholds, cooldown and order are the CPU ones; missing GPU samples fall back to CPU time", () => {
  const g = createQualityGovernor({ quality, windowSize: 4, slowWindows: 1, fastWindows: 1, gpuSlowMs: 6, gpuFastMs: 2 });
  assert.equal(gpuWindow(g, 16, 7, 4000).change.dimension, "maxDpr");
  assert.equal(gpuWindow(g, 16, 7, 4100).change, null, "cooldown still applies");
  // one window with a missing GPU sample is judged on CPU frame time: 16 ms is neither slow (26) nor fast (14)
  let result;
  for (let i = 0; i < 4; i++) result = g.sample(16, 9000 + i, i === 2 ? null : 7);
  assert.equal(result.change, null);
  assert.equal(result.gpuMs, null);
  assert.throws(() => createQualityGovernor({ quality, gpuSlowMs: 2, gpuFastMs: 4 }), RangeError);
  const none = createQualityGovernor({ quality, windowSize: 4 });
  assert.equal(none.sample(10, 1).gpuMs, null);
});
