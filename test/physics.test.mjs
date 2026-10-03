import test from "node:test";
import assert from "node:assert/strict";
import {
  schwarzschildRadius, kerrGeometry, hawkingTemperature,
  blackHoleEntropyAreaUnits, seededRng, qftConservation,
} from "../js/physics.mjs";

test("Schwarzschild radius is about 2.95 km per solar mass", () => {
  assert.ok(Math.abs(schwarzschildRadius(1) / 1000 - 2.953) < 0.01);
  assert.ok(Math.abs(schwarzschildRadius(10) / schwarzschildRadius(1) - 10) < 1e-12);
});

test("Kerr zero-spin limits recover Schwarzschild geometry", () => {
  const geometry = kerrGeometry(0);
  assert.equal(geometry.rPlus, 2);
  assert.equal(geometry.rIsco, 6);
  assert.equal(geometry.rIscoRetrograde, 6);
  assert.equal(geometry.rPhoton, 3);
  assert.ok(Math.abs(geometry.rPhotonRetrograde - 3) < 1e-12);
  assert.equal(geometry.rErgoEquator, 2);
  assert.equal(geometry.temperatureFactor, 1);
});

test("Kerr spin separates prograde and retrograde characteristic radii", () => {
  const geometry = kerrGeometry(0.9);
  assert.ok(geometry.rPlus < geometry.rErgoEquator);
  assert.ok(geometry.rPhoton < geometry.rPhotonRetrograde);
  assert.ok(geometry.rIsco < geometry.rIscoRetrograde);
});

test("black-hole temperature scales inversely with mass and entropy with area", () => {
  assert.ok(Math.abs(hawkingTemperature(1) / hawkingTemperature(10) - 10) < 1e-12);
  assert.ok(Math.abs(blackHoleEntropyAreaUnits(10) / blackHoleEntropyAreaUnits(1) - 100) < 1e-12);
});

test("seeded RNG is reproducible", () => {
  const a = seededRng(42), b = seededRng(42);
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
});

test("QFT conservation checks cover valid and invalid vertices", () => {
  assert.equal(qftConservation("e-", "e+", "mu-", "mu+").ok, true);
  assert.equal(qftConservation("e-", "e-", "ph", "ph").ok, false);
  assert.equal(qftConservation("e-", "mu+", "e-", "e+").ok, false);
});
