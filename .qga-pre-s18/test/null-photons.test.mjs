// The photons that travel the null-geodesic figure (js/visualizations/gr/null-photons.mjs): the clock is the integrator's own
// step, so the lag of the near-critical ray, the early capture and the clock are properties of the physics,
// not of the animation. C2 is the panel's GR_C2 and the mass is the one of the reference screenshot (b_crit = 0.528).

import test from "node:test";
import assert from "node:assert/strict";
import { grNullTrajectory, grCriticalImpactParameter } from "../js/physics.mjs";
import {
  NULL_PHOTON_STEP, NULL_PHOTON_SPEED, frameWindow, crossingSteps, buildPhotonRays, photonState, trailRange,
  clockInCrossings, drawPhotons, photonPosition, advanceClock,
} from "../js/visualizations/gr/null-photons.mjs";

const C2 = 27.04, GM = 0.55 * 5;
const BCRIT = grCriticalImpactParameter(GM, C2), RS = (2 * GM) / C2, HALF = 2.5 * BCRIT;
const FRACTIONS = [0.55, 0.8, 0.95, 0.995, 1.005, 1.05, 1.25, 1.7, 2.4];
const rays = FRACTIONS.map((f) => {
  const t = grNullTrajectory(BCRIT * f, GM, C2, { maxSteps: 60000, dt: NULL_PHOTON_STEP, rCap: 1.02 * RS });
  return { f, captured: t.captured, windings: t.windings, points: t.points };
});
const model = buildPhotonRays(rays, HALF);
const byF = (f) => model.photons.find((p) => p.f === f);

test("the crossing time is the frame width over the launch speed, in integrator steps", () => {
  assert.equal(crossingSteps(HALF), (2 * HALF) / (NULL_PHOTON_SPEED * NULL_PHOTON_STEP));
  assert.equal(model.crossing, crossingSteps(HALF));
});

test("frameWindow keeps the visible span and a point of margin on each side", () => {
  assert.deepEqual(frameWindow([[-9, 0], [-3, 0], [0, 0], [3, 0], [9, 0]], 4), { i0: 0, i1: 4 });
  assert.deepEqual(frameWindow([[-9, 0], [-8, 0], [-3, 0], [0, 0], [3, 0], [8, 0], [9, 0]], 4), { i0: 1, i1: 5 });
});

test("all photons start on one clock at the left edge of the frame", () => {
  for (const p of model.photons) assert.ok(p.x[0] <= -HALF * 0.97 && p.x[0] >= -HALF * 1.2, `x0 = ${p.x[0]}`);
});

test("a ray with an impact parameter well above critical crosses the frame in about the undeflected time", () => {
  const far = byF(2.4);
  assert.ok(Math.abs(far.steps / model.crossing - 1) < 0.05, `${far.steps} steps against ${model.crossing}`);
});

test("captured photons end early at the horizon, escaping ones after, and the near-critical ray lags the rest", () => {
  const captured = model.photons.filter((p) => p.captured), escaped = model.photons.filter((p) => !p.captured);
  assert.deepEqual(captured.map((p) => p.f), [0.55, 0.8, 0.95, 0.995]);
  assert.ok(Math.max(...captured.map((p) => p.steps)) < byF(2.4).steps, "every plunge is quicker than the straight crossing");
  assert.ok(byF(1.005).steps > 1.25 * byF(2.4).steps, "winding the photon sphere costs time");
  assert.equal(model.span, Math.max(...escaped.map((p) => p.steps)), "the longest path is an escaping one, deflected and wound");
  const end = captured[0];
  assert.ok(Math.hypot(end.x[end.steps], end.y[end.steps]) < 1.1 * RS, "a captured photon ends at the horizon");
});

test("photonState clamps at the ends and reports how long ago a photon ended", () => {
  const p = byF(0.55);
  assert.deepEqual(photonState(p, -5), { index: 0, flying: true, sinceEnd: 0 });
  assert.equal(photonState(p, 10.7).index, 10);
  assert.deepEqual(photonState(p, p.steps + 40), { index: p.steps, flying: false, sinceEnd: 40 });
});

test("photonPosition interpolates between samples and holds the end point", () => {
  const p = byF(2.4);
  const [x, y] = photonPosition(p, 10.25);
  assert.ok(Math.abs(x - (p.x[10] + 0.25 * (p.x[11] - p.x[10]))) < 1e-12 && Math.abs(y - (p.y[10] + 0.25 * (p.y[11] - p.y[10]))) < 1e-12);
  assert.deepEqual(photonPosition(p, p.steps + 500), [p.x[p.steps], p.y[p.steps]]);
});

test("the wake range is clipped at the start of the path", () => {
  assert.deepEqual(trailRange(500, 200), [300, 500]);
  assert.deepEqual(trailRange(120, 200), [0, 120]);
});

test("the clock runs the longest path in the loop time, holds the finished frame, then wraps", () => {
  const timing = { loopSeconds: 10, holdSeconds: 2 };
  const span = 1000;
  assert.equal(advanceClock(0, 1, span, timing), 100);
  assert.equal(advanceClock(990, 0.1, span, timing), 1000, "the end of the longest path is reached after loopSeconds");
  assert.equal(advanceClock(1100, 0.5, span, timing), 1150, "the hold keeps counting past the span");
  assert.ok(Math.abs(advanceClock(1190, 0.2, span, timing) - 10) < 1e-9, "after the hold it wraps to the start");
});

test("the clock readout is the step over the crossing time", () => {
  assert.equal(clockInCrossings(model.crossing * 1.5, model.crossing), 1.5);
});

test("drawPhotons clips to the plot, draws a dot per flying photon and a ring for an absorbed one, and balances the context", () => {
  const calls = [];
  const recorded = new Set(["save", "restore", "arc", "clip", "clearRect"]);
  const ctx = new Proxy({}, { get: (_, name) => (recorded.has(name) ? (...a) => calls.push([name, ...a]) : () => {}), set: () => true });
  const scene = { width: 400, height: 400, plot: { x: 40, y: 10, w: 340, h: 340 },
    sx: { map: (v) => 200 + (v / HALF) * 170 }, sy: { map: (v) => 180 - (v / HALF) * 170 } };
  const count = (n) => calls.filter((c) => c[0] === n).length;
  drawPhotons(ctx, scene, model, 600, { escape: "e", capture: "c" });
  assert.deepEqual([count("save"), count("restore"), count("clip")], [1, 1, 1]);
  assert.equal(count("arc"), 9 + 2, "nine flying photons; the two near-critical ones also carry a halo");
  calls.length = 0;
  drawPhotons(ctx, scene, model, byF(0.55).steps + 20, { escape: "e", capture: "c" });
  assert.equal(count("arc"), 8 + 2 + 1, "eight photons still fly (two haloed) and one absorption ring is drawn");
});
