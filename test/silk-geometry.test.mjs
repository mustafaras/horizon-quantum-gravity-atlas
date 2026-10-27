import test from "node:test";
import assert from "node:assert/strict";
import {
  SILK, toScene, fromScene, ringPoints, curvePoints, fixedPointRings, separatrixPoints, singularLinePoints, etaPoleCurve, writeTrajectory, TRAJECTORY_CAPACITY,
} from "../js/visualizations/rg/silk-geometry.mjs";
import { fixedPoints, etaPoleG, SINGULAR_LAMBDA, classifyTrajectory } from "../js/science/asymptotic-safety.mjs";

const near = (actual, expected, tol, what) => assert.ok(Math.abs(actual - expected) <= tol, `${what}: ${actual} vs ${expected} (tol ${tol})`);

test("the plane covers g in [-0.2, 1.2] and lambda in [-0.4, 0.55], so the singular line sits inside it", () => {
  assert.deepEqual([...SILK.domain.g], [-0.2, 1.2]);
  assert.deepEqual([...SILK.domain.lambda], [-0.4, 0.55]);
  assert.ok(SILK.domain.lambda[1] > SINGULAR_LAMBDA);
  const corner = toScene(-0.2, 0.55), opposite = toScene(1.2, -0.4);
  near(opposite[0] - corner[0], SILK.width, 1e-12, "plane width"); near(opposite[2] - corner[2], SILK.depth, 1e-12, "plane depth");
  near(corner[0], -SILK.width / 2, 1e-12, "centred in x"); near(corner[2], -SILK.depth / 2, 1e-12, "lambda up is -z, centred");
});

test("toScene and fromScene are inverse; lambda grows toward the top of the screen (-z) and g to the right (+x)", () => {
  for (const [g, lambda] of [[0, 0], [0.7, 0.19], [-0.1, -0.3], [1.1, 0.5]]) {
    const [x, y, z] = toScene(g, lambda);
    assert.equal(y, 0);
    const back = fromScene(x, z);
    near(back.g, g, 1e-12, "g"); near(back.lambda, lambda, 1e-12, "lambda");
  }
  assert.ok(toScene(1, 0)[0] > toScene(0, 0)[0]);
  assert.ok(toScene(0, 0.3)[2] < toScene(0, 0)[2]);
});

test("rings are closed circles of the given radius around a fixed point, lifted above the plane", () => {
  const ring = ringPoints(0.7, 0.19, 0.12, 48);
  assert.equal(ring.length, 49 * 3);
  const centre = toScene(0.7, 0.19);
  for (let k = 0; k < 49; k++) near(Math.hypot(ring[3 * k] - centre[0], ring[3 * k + 2] - centre[2]), 0.12, 1e-6, "radius");
  near(ring[0], ring[48 * 3], 1e-6, "closed"); near(ring[2], ring[48 * 3 + 2], 1e-6, "closed");
  assert.ok(ring[1] > 0 && ring[1] < 0.2, "a small lift keeps it from z-fighting with the plane");
});

test("the overlays are the science: fixed points, the separatrix, lambda = 1/2 and the eta-pole curve", () => {
  const rings = fixedPointRings();
  assert.equal(rings.length, fixedPoints().length);
  const sep = separatrixPoints();
  assert.ok(sep.length / 3 <= 600 && sep.length / 3 >= 100, "thinned to a drawable length");
  const last = fromScene(sep[sep.length - 3], sep[sep.length - 1]);
  const ngfp = fixedPoints()[1];
  near(last.g, ngfp.g, 2e-3, "the separatrix ends at the NGFP"); near(last.lambda, ngfp.lambda, 2e-3, "");
  const first = fromScene(sep[0], sep[2]);
  near(first.g, 0, 1e-3, "and starts at the GFP");
  const line = singularLinePoints();
  assert.equal(line.length, 2 * 3);
  near(fromScene(line[0], line[2]).lambda, SINGULAR_LAMBDA, 1e-6, "lambda = 1/2");
  const pole = etaPoleCurve();
  assert.ok(pole.length / 3 > 20);
  for (let k = 0; k < pole.length / 3; k++) {
    const p = fromScene(pole[3 * k], pole[3 * k + 2]);
    near(p.g, etaPoleG(p.lambda), 1e-5, "on 1 - g B2 = 0");
    assert.ok(p.g >= SILK.domain.g[0] && p.g <= SILK.domain.g[1] && p.lambda < SINGULAR_LAMBDA);
  }
});

test("curvePoints thins a polyline to a limit without moving its ends", () => {
  const points = Array.from({ length: 1000 }, (_, k) => ({ g: k / 1000, lambda: 0 }));
  const flat = curvePoints(points, 100);
  assert.ok(flat.length / 3 <= 100);
  near(fromScene(flat[0], flat[2]).g, 0, 1e-6, "first"); near(fromScene(flat[flat.length - 3], flat[flat.length - 1]).g, 0.999, 1e-6, "last");
});

test("writeTrajectory fills a fixed buffer without allocating and reports the count; points outside the plane are clipped", () => {
  const buffer = new Float32Array(TRAJECTORY_CAPACITY * 3);
  const run = classifyTrajectory({ g0: 0.9, lambda0: 0.3 });
  const count = writeTrajectory(run.points, buffer);
  assert.ok(count >= 2 && count <= TRAJECTORY_CAPACITY);
  const p0 = fromScene(buffer[0], buffer[2]);
  near(p0.g, 0.9, 1e-5, "starts at the chosen point"); near(p0.lambda, 0.3, 1e-5, "");
  assert.equal(writeTrajectory([], buffer), 0);
  const many = Array.from({ length: 50000 }, (_, k) => ({ g: 0.5, lambda: 0.1 + 1e-6 * k }));
  assert.ok(writeTrajectory(many, buffer) <= TRAJECTORY_CAPACITY, "never more than the capacity");
  const outside = writeTrajectory([{ g: 0.5, lambda: 0 }, { g: 5, lambda: 0 }, { g: 0.6, lambda: 0 }], buffer);
  assert.equal(outside, 2, "the point far outside the plane is dropped, the run continues");
});
