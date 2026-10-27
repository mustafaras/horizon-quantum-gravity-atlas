import test from "node:test";
import assert from "node:assert/strict";
import {
  HAWKING_LAB_VIEW_ID,
  extremalTemperatureFactor, hawkingLabState, sampleEmission,
  extremalCurve, registerHawkingLabProvenance, hawkingExportMetadata,
} from "../js/science/hawking.mjs";
import { getVisualizationProvenance } from "../js/science/provenance.mjs";
import { hawkingTemperature } from "../js/physics.mjs";

test("extremal factor is 1 at zero spin, 0 at |a*| = 1, always finite", () => {
  assert.equal(extremalTemperatureFactor(0).factor, 1);
  assert.equal(extremalTemperatureFactor(1).factor, 0);
  assert.equal(extremalTemperatureFactor(1).extremal, true);
  assert.equal(extremalTemperatureFactor(-1).factor, 0);
  for (const a of [0.5, 0.9, 0.99, 0.999, 0.999999]) {
    const { factor } = extremalTemperatureFactor(a);
    assert.ok(Number.isFinite(factor) && factor > 0 && factor < 1);
  }
});

test("extremal factor is monotone non-increasing in |a*|", () => {
  let prev = Infinity;
  for (let i = 0; i <= 50; i++) {
    const { factor } = extremalTemperatureFactor(i / 50);
    assert.ok(factor <= prev + 1e-12, "monotone at a*=" + i / 50);
    prev = factor;
  }
});

test("extremalCurve ends exactly at zero and never goes negative", () => {
  const curve = extremalCurve({ samples: 32 });
  assert.equal(curve.length, 33);
  assert.equal(curve[32].spin, 1);
  assert.equal(curve[32].temperatureRatio, 0);
  assert.equal(curve[32].extremal, true);
  for (const p of curve) assert.ok(p.temperatureRatio >= 0 && Number.isFinite(p.temperatureRatio));
});

test("hawkingLabState uses the shared temperature API unchanged", () => {
  const lab = hawkingLabState({ massSolar: 10, spin: 0 });
  assert.equal(lab.temperatureK, hawkingTemperature(10, 0));
  assert.ok(lab.evaporationYears > 0);
  assert.equal(lab.extremalFactor, 1);
});

test("hawkingLabState rejects non-positive mass", () => {
  assert.throws(() => hawkingLabState({ massSolar: 0 }), RangeError);
  assert.throws(() => hawkingLabState({ massSolar: -5 }), RangeError);
});

test("display gain scales display power but never the physics", () => {
  const low = hawkingLabState({ massSolar: 10, spin: 0, amplification: 1 });
  const high = hawkingLabState({ massSolar: 10, spin: 0, amplification: 100 });
  assert.equal(low.temperatureK, high.temperatureK);
  assert.equal(low.relativePower, high.relativePower);
  assert.equal(high.displayPower, low.displayPower * 100);
});

test("near-extremal spin drives emission power toward zero", () => {
  const cold = hawkingLabState({ massSolar: 10, spin: 0.998 });
  const plain = hawkingLabState({ massSolar: 10, spin: 0 });
  // P ∝ A·T⁴ with T/T₀ = 2s/(1+s): at a* = 0.998 the power drops by ~3.5 orders.
  assert.ok(cold.relativePower < plain.relativePower * 1e-3);
  // The un-clamped extremal model itself reaches exactly zero.
  const ext = hawkingLabState({ massSolar: 10, spin: 1 });
  assert.equal(ext.extremalFactor, 0);
  assert.ok(Number.isFinite(ext.relativePower));
});

test("sampleEmission is deterministic per seed and Planckian-shaped", () => {
  const a = sampleEmission({ seed: 42, count: 200 });
  const b = sampleEmission({ seed: 42, count: 200 });
  assert.deepEqual(a.samples, b.samples);
  assert.equal(a.samples.length, 200);
  for (const s of a.samples) {
    assert.ok(s.energyOverT > 0 && Number.isFinite(s.energyOverT));
    assert.ok(s.azimuth >= 0 && s.azimuth <= Math.PI * 2);
    assert.ok(s.cosPolar >= 0 && s.cosPolar <= 1);
  }
  const c = sampleEmission({ seed: 7, count: 200 });
  assert.notEqual(a.samples[0].energyOverT, c.samples[0].energyOverT);
});

test("provenance registers the lab as schematic", () => {
  registerHawkingLabProvenance();
  registerHawkingLabProvenance();
  const rec = getVisualizationProvenance(HAWKING_LAB_VIEW_ID);
  assert.equal(rec.status, "schematic");
  assert.ok(rec.assumptions.some((s) => /display/i.test(s)));
});

test("export metadata converts the log10 mass slider to solar masses", () => {
  const meta = hawkingExportMetadata(
    { bhMass: 1, bhSpin: 0, hawkingLabAmplify: 12 },
    { kind: "cpu-samples", particles: 40 },
  );
  assert.equal(meta.hawkingLab.massSolar, 10);
  assert.equal(meta.hawkingLab.temperatureK, hawkingTemperature(10, 0));
  assert.equal(meta.hawkingLab.displayAmplification, 12);
  assert.equal(meta.hawkingLab.schematicPairProduction, true);
  assert.equal(meta.hawkingLab.runtime.particles, 40);
});
