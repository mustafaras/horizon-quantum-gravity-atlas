import test from "node:test";
import assert from "node:assert/strict";
import { pcgHash, cellNoise, hannWeight, licSample, licImage } from "../js/visualizations/rg/lic-cpu.mjs";

/* An independent BigInt port of the PCG hash that TSL's `hash` uses (three.webgpu.js, "Taken from https://www.shadertoy.com/view/XlGcRh"). */
function pcgBig(n) {
  const M = 0xffffffffn;
  const state = (BigInt(n) * 747796405n + 2891336453n) & M;
  const shift = ((state >> 28n) + 4n) & 31n;
  const word = ((((state >> shift) ^ state) & M) * 277803737n) & M;
  const result = ((word >> 22n) ^ word) & M;
  return Number(result) / 2 ** 32;
}

const variance = (values) => {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
};

test("the hash is the PCG hash of TSL, uniform in [0, 1) and deterministic", () => {
  for (let n = 0; n < 2000; n += 7) assert.equal(pcgHash(n), pcgBig(n), `seed ${n}`);
  const values = Array.from({ length: 20000 }, (_, n) => pcgHash(n));
  assert.ok(values.every((v) => v >= 0 && v < 1));
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  assert.ok(Math.abs(mean - 0.5) < 0.01, `mean ${mean}`);
  assert.ok(Math.abs(variance(values) - 1 / 12) < 0.005, "variance of a uniform variable");
  assert.equal(cellNoise(3, 4, 42), cellNoise(3, 4, 42));
  assert.notEqual(cellNoise(3, 4, 42), cellNoise(3, 4, 43), "the seed changes the field");
  assert.notEqual(cellNoise(3, 4, 42), cellNoise(4, 3, 42));
  assert.ok(Number.isFinite(cellNoise(-5, -7, 42)));
});

test("the Hann kernel is 1 at the centre, 0 at the ends and symmetric", () => {
  assert.equal(hannWeight(0), 1);
  assert.ok(Math.abs(hannWeight(1)) < 1e-15 && Math.abs(hannWeight(-1)) < 1e-15);
  assert.equal(hannWeight(0.3), hannWeight(-0.3));
  assert.ok(hannWeight(0.5) > 0.49 && hannWeight(0.5) < 0.51);
});

const SIZE = 128;
const CELL = 1 / SIZE;
const rotation = (x, y) => [-(y - 0.5), x - 0.5]; // uniform rotation about the centre: circular streamlines
const options = { field: rotation, cell: CELL, step: CELL * 0.5, length: 24, seed: 42 };

test("LIC on a uniform rotation field: along a streamline the samples are coherent, across them they are not (128 x 128, windows of 9 pixels)", () => {
  const along = [], across = [];
  for (let w = 0; w < 64; w++) {
    const angle = (w / 64) * 2 * Math.PI, radius = 0.15 + 0.3 * ((w * 7) % 64) / 64;
    // nine samples one pixel apart along the circle through (radius, angle), and nine one pixel apart along the radius
    const arc = Array.from({ length: 9 }, (_, i) => {
      const a = angle + ((i - 4) * CELL) / radius;
      return licSample({ x: 0.5 + radius * Math.cos(a), y: 0.5 + radius * Math.sin(a), ...options });
    });
    const ray = Array.from({ length: 9 }, (_, i) => {
      const r = radius + (i - 4) * CELL;
      return licSample({ x: 0.5 + r * Math.cos(angle), y: 0.5 + r * Math.sin(angle), ...options });
    });
    along.push(variance(arc)); across.push(variance(ray));
  }
  const meanAlong = along.reduce((s, v) => s + v, 0) / along.length, meanAcross = across.reduce((s, v) => s + v, 0) / across.length;
  assert.ok(meanAlong < 0.2 * meanAcross, `along ${meanAlong}, across ${meanAcross}, ratio ${meanAlong / meanAcross}`);
  assert.ok(meanAcross > 1e-3, "the field is not flat");
});

test("licImage returns the samples of licSample on a pixel grid, deterministic and inside [0, 1]", () => {
  const image = licImage({ width: 16, height: 16, domain: { x: [0, 1], y: [0, 1] }, ...options });
  assert.equal(image.length, 16 * 16);
  assert.ok(image.every((v) => v >= 0 && v <= 1));
  const again = licImage({ width: 16, height: 16, domain: { x: [0, 1], y: [0, 1] }, ...options });
  assert.deepEqual([...image], [...again]);
  const x = 0.5 / 16 + 3 / 16, y = 0.5 / 16 + 5 / 16;
  assert.ok(Math.abs(image[5 * 16 + 3] - licSample({ x, y, ...options })) < 1e-6, "pixel (3, 5) at its centre");
  const ripple = (phase) => licImage({ width: 16, height: 16, domain: { x: [0, 1], y: [0, 1] }, ...options, ripple: 0.5, phase });
  assert.notDeepEqual([...ripple(0.5)], [...ripple(0)], "the phase moves the ripple along the field");
  assert.deepEqual([...ripple(1)].map((v) => Math.round(v * 1e5)), [...ripple(0)].map((v) => Math.round(v * 1e5)), "and it is periodic in the phase");
  assert.notDeepEqual([...ripple(0)], [...image], "without a ripple the picture is the plain LIC");
});

test("a field that vanishes or is not finite does not poison the image", () => {
  const dead = licSample({ x: 0.5, y: 0.5, field: () => [0, 0], cell: CELL, step: CELL, length: 8, seed: 1 });
  assert.ok(Number.isFinite(dead));
  const broken = licSample({ x: 0.3, y: 0.3, field: () => [NaN, 1], cell: CELL, step: CELL, length: 8, seed: 1 });
  assert.ok(Number.isFinite(broken));
});
