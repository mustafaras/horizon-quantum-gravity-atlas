// S13: the pure geometry of the Mexican-hat scene (js/visualizations/sm/hat-geometry.mjs). The scene itself is checked in the
// browser (qa/specs/higgs-lab.spec.mjs); here the numbers it draws are tied back to the potential and the mode curvatures.

import test from "node:test";
import assert from "node:assert/strict";
import { reducedPotential } from "../js/science/higgs.mjs";
import {
  HAT_UNIT, HAT_HEIGHT, HAT_RADIUS, PHYSICAL_PHASE, SYMMETRIC_PHASE, hatHeight, ringPoints, radialArrow, goldstoneArrow,
  vacuumMarker, easePhase,
} from "../js/visualizations/sm/hat-geometry.mjs";

const close = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what ?? "value"}: ${a} vs ${b} (tol ${tol})`);

test("the surface height is the reduced potential, scaled uniformly", () => {
  for (const s of [PHYSICAL_PHASE, 0, SYMMETRIC_PHASE]) {
    for (const x of [0, 0.4, 1, 1.5]) close(hatHeight(x * HAT_UNIT, s), HAT_HEIGHT * reducedPotential(x, s), 1e-12, `x = ${x}, s = ${s}`);
  }
  close(hatHeight(HAT_UNIT, PHYSICAL_PHASE), -0.25 * HAT_HEIGHT, 1e-12, "depth of the vacuum circle");
});

test("the vacuum circle has radius v, lies at constant height and closes", () => {
  const n = 96;
  const ring = ringPoints(PHYSICAL_PHASE, n);
  assert.equal(ring.length, 3 * (n + 1));
  for (let i = 0; i <= n; i++) {
    close(Math.hypot(ring[3 * i], ring[3 * i + 2]), HAT_UNIT, 1e-12, "radius");
    close(ring[3 * i + 1], hatHeight(HAT_UNIT, PHYSICAL_PHASE), 1e-12, "height");
  }
  close(ring[0], ring[3 * n], 1e-9); close(ring[2], ring[3 * n + 2], 1e-9);
});

test("the radial arrow follows the surface outward from the vacuum; its curvature is the Higgs mass, 2 lambda v^2", () => {
  const arrow = radialArrow(PHYSICAL_PHASE);
  assert.ok(arrow.shaft.length >= 6 && arrow.head.length === 9, "a shaft and a chevron head of three points");
  close(arrow.head[3], arrow.shaft.at(-3), 1e-12, "the chevron's middle point is the tip");
  close(arrow.shaft[0], HAT_UNIT, 1e-12, "starts on the vacuum circle");
  for (let i = 0; i < arrow.shaft.length; i += 3) close(arrow.shaft[i + 1], hatHeight(Math.hypot(arrow.shaft[i], arrow.shaft[i + 2]), PHYSICAL_PHASE), 1e-12, "on the surface");
  const e = 1e-3 * HAT_UNIT;
  const second = (hatHeight(HAT_UNIT + e, 1) - 2 * hatHeight(HAT_UNIT, 1) + hatHeight(HAT_UNIT - e, 1)) / (e * e);
  close(second, (HAT_HEIGHT * 2) / (HAT_UNIT * HAT_UNIT), 1e-4, "second derivative along the radius");
});

test("the Goldstone arrow runs along the valley at constant height: the massless direction", () => {
  const arrow = goldstoneArrow(PHYSICAL_PHASE);
  const heights = new Set();
  for (let i = 1; i < arrow.shaft.length; i += 3) heights.add(arrow.shaft[i].toFixed(9));
  assert.equal(heights.size, 1);
  assert.equal([...heights][0], hatHeight(HAT_UNIT, PHYSICAL_PHASE).toFixed(9));
  assert.ok(Math.abs(arrow.shaft.at(-1) - arrow.shaft[2]) > 0.5, "it has a visible extent along the tangent");
});

test("in the symmetric phase the origin is the minimum and the pinned physical point sits on a slope", () => {
  assert.ok(hatHeight(0, SYMMETRIC_PHASE) < hatHeight(HAT_UNIT, SYMMETRIC_PHASE));
  const marker = vacuumMarker(SYMMETRIC_PHASE);
  close(marker[0], HAT_UNIT, 1e-12); close(marker[2], 0, 1e-12);
  close(marker[1], hatHeight(HAT_UNIT, SYMMETRIC_PHASE), 1e-12);
  assert.ok(HAT_RADIUS > Math.SQRT2 * HAT_UNIT, "the rim is beyond the zero of the physical potential, so the brim rises above the centre");
});

test("easing approaches the target monotonically, snaps when close, and snaps at once under reduced motion", () => {
  let s = PHYSICAL_PHASE, previous = s;
  for (let i = 0; i < 400; i++) {
    s = easePhase(s, SYMMETRIC_PHASE, 1 / 60, { motion: 1 });
    assert.ok(s <= previous);
    previous = s;
  }
  assert.equal(s, SYMMETRIC_PHASE);
  assert.equal(easePhase(PHYSICAL_PHASE, SYMMETRIC_PHASE, 1 / 60, { motion: 0 }), SYMMETRIC_PHASE);
  const half = easePhase(1, -1, 0.25, { motion: 1 });
  assert.ok(half < 1 && half > -1);
});

test("the arrows write into a caller-owned buffer, so easing allocates nothing", async () => {
  const { makeArrow } = await import("../js/visualizations/sm/hat-geometry.mjs");
  const out = makeArrow();
  assert.equal(radialArrow(1, out), out);
  const at1 = out.shaft.slice();
  assert.equal(radialArrow(-1, out), out);
  assert.notDeepEqual(out.shaft, at1, "the shaft follows the surface as the phase changes");
  assert.equal(goldstoneArrow(0.3, out), out);
});
