import test from "node:test";
import assert from "node:assert/strict";
import {
  PLASMA_VOLUME,
  PLASMA_VOLUME_DERIVED,
  coronaScaleHeight,
  coronaRadialProfile,
  coronaClumping,
  coronaDensity,
  coronaSample,
  PLASMA_VOLUME_GLSL,
} from "../js/visualizations/kerr/plasma-volume.mjs";

const RADII = { rIn: 5, rOut: 29 };

test("the corona scale height flares with radius", () => {
  assert.ok(coronaScaleHeight(10) > 0);
  assert.ok(coronaScaleHeight(20) > coronaScaleHeight(10), "H(r) grows with r");
  const ratio = coronaScaleHeight(20) / coronaScaleHeight(10);
  assert.ok(Math.abs(ratio - 2 ** PLASMA_VOLUME.flare) < 1e-9, "H = h0 r^flare");
});

test("the radial profile peaks near the ISCO and truncates smoothly at the edges", () => {
  assert.equal(coronaRadialProfile(RADII.rIn - 1, RADII), 0, "no corona inside the inner edge");
  assert.equal(coronaRadialProfile(RADII.rOut + 1, RADII), 0, "no corona beyond the outer edge");
  const peak = coronaRadialProfile(RADII.rIn + 2, RADII);
  const mid = coronaRadialProfile(15, RADII);
  const outer = coronaRadialProfile(RADII.rOut - 2, RADII);
  assert.ok(peak > mid && mid > outer && outer > 0, "density falls outward but stays positive inside");
});

test("clumping is seeded, frozen and unit-mean", () => {
  const args = { r: 10, z: 0.5, phi: 1, seed: 42 };
  const value = coronaClumping(args);
  assert.ok(Number.isFinite(value) && value > 0);
  assert.equal(coronaClumping(args), value, "frozen realization is deterministic");
  assert.notEqual(coronaClumping({ ...args, seed: 43 }), value, "seeded");
  let sum = 0;
  const n = 4000;
  for (let i = 0; i < n; i += 1) {
    sum += coronaClumping({ r: 6 + (i % 23) * 0.7, z: (i % 13) * 0.11, phi: (i % 19) * 0.33, seed: 42 });
  }
  const mean = sum / n;
  assert.ok(Math.abs(mean - 1) < 0.12, `ensemble mean near 1 (got ${mean.toFixed(3)})`);
});

test("density hugs the disk plane and vanishes far from it", () => {
  const plane = coronaDensity({ r: 10, z: 0, phi: 0, ...RADII, seed: 42 });
  assert.ok(plane > 0, "densest at the disk plane");
  const height = coronaScaleHeight(10);
  const at3H = coronaDensity({ r: 10, z: 3 * height, phi: 0, ...RADII, seed: 42 });
  assert.equal(at3H, 0, "the slab is truncated at ~3 scale heights");
  assert.ok(coronaDensity({ r: 10, z: height, phi: 0, ...RADII, seed: 42 }) < plane, "Gaussian vertical profile");
  assert.equal(coronaDensity({ r: 3, z: 0, phi: 0, ...RADII, seed: 42 }), 0, "radial truncation");
});

test("corona samples share the disk's beaming and stay optically thin", () => {
  const sample = coronaSample({ r: 10, z: 0.3, phi: 0.5, ...RADII, g: 1.2, tableKelvin: 5000, seed: 42 });
  assert.ok(sample, "in-slab sample exists");
  assert.ok(sample.emission > 0 && sample.absorption > 0);
  assert.ok(sample.kelvin > 5000, "the corona is display-mapped hotter than the disk");
  assert.equal(sample.kelvin, Math.min(60000, 5000 * PLASMA_VOLUME.temperatureFactor));
  // g^4 beaming: a stronger shift factor brightens the emission exactly.
  const boosted = coronaSample({ r: 10, z: 0.3, phi: 0.5, ...RADII, g: 2.4, tableKelvin: 5000, seed: 42 });
  assert.ok(Math.abs(boosted.emission / sample.emission - 2 ** 4) < 1e-9, "g^4 Liouville scaling");
  // Optically thin: the peak optical depth across the slab is small.
  const worst = PLASMA_VOLUME.absorption * coronaDensity({ r: 6, z: 0, phi: 0, rIn: 5, rOut: 29, seed: 42 }) * 2 * coronaScaleHeight(6);
  assert.ok(worst < 0.5, `peak optical depth ${worst.toFixed(3)} stays thin`);
  assert.equal(coronaSample({ r: 10, z: 5, phi: 0, ...RADII, g: 1, tableKelvin: 5000, seed: 42 }), null, "null outside the slab");
  assert.equal(coronaSample({ r: 10, z: 0.3, phi: 0, ...RADII, g: 0, tableKelvin: 5000, seed: 42 }), null, "null at zero shift");
});

test("the GLSL chunk carries the same constants as the pure module", () => {
  assert.ok(PLASMA_VOLUME_GLSL.includes(PLASMA_VOLUME.h0.toFixed(2)));
  assert.ok(PLASMA_VOLUME_GLSL.includes(PLASMA_VOLUME.flare.toFixed(1)));
  assert.ok(PLASMA_VOLUME_GLSL.includes(PLASMA_VOLUME.temperatureFactor.toFixed(1)));
  assert.ok(PLASMA_VOLUME_GLSL.includes(PLASMA_VOLUME.absorption.toString()));
  assert.ok(PLASMA_VOLUME_GLSL.includes(PLASMA_VOLUME.gain.toFixed(2)));
  assert.ok(PLASMA_VOLUME_GLSL.includes(PLASMA_VOLUME_DERIVED.clumpVariance.toFixed(8)));
  assert.ok(PLASMA_VOLUME_GLSL.includes("coronaDensity"));
  assert.ok(PLASMA_VOLUME_GLSL.includes("coronaKelvin"));
  assert.ok(PLASMA_VOLUME_GLSL.includes("coronaAbsorption"));
  assert.ok(PLASMA_VOLUME_GLSL.includes("coronaEmissionScale"));
});
