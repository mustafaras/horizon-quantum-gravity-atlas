import test from "node:test";
import assert from "node:assert/strict";
import {
  JET_FIELD,
  JET_FIELD_DERIVED,
  blandfordZnajekSpinFactor,
  jetLorentzFactor,
  jetBeta,
  jetDopplerFactor,
  jetFrequencyShift,
  jetObservedExponent,
  jetRadius,
  jetAxialProfile,
  jetRadialProfile,
  jetDisplayKelvin,
  jetKnotModulation,
  jetEmissionSample,
  JET_FIELD_GLSL,
  JET_KNOTS_GLSL,
} from "../js/visualizations/kerr/jet-field.mjs";

test("the Blandford-Znajek spin factor is zero without spin and grows monotonically with |a*|", () => {
  assert.equal(blandfordZnajekSpinFactor(0), 0);
  assert.equal(blandfordZnajekSpinFactor(-0.998), blandfordZnajekSpinFactor(0.998));
  let previous = 0;
  for (let i = 1; i <= 20; i += 1) {
    const a = (i / 20) * 0.998;
    const factor = blandfordZnajekSpinFactor(a);
    assert.ok(factor > previous, "spin factor must grow with a*");
    assert.ok(factor <= 1);
    previous = factor;
  }
  // Literature anchor: Omega_H = a/(2(1+sqrt(1-a^2))); the factor is (2 Omega_H)^2.
  const a = 0.9;
  const omegaH = a / (2 * (1 + Math.sqrt(1 - a * a)));
  assert.ok(Math.abs(blandfordZnajekSpinFactor(a) - (2 * omegaH) ** 2) < 1e-12);
});

test("jet kinematics: Lorentz profile accelerates smoothly and beta matches gamma", () => {
  assert.equal(jetLorentzFactor(0), 1);
  const far = jetLorentzFactor(1000);
  assert.ok(Math.abs(far - JET_FIELD.gammaSpine) < 0.01, "asymptotic spine Lorentz factor");
  for (const s of [0, 1, 5, 15, 50, 200]) {
    const gamma = jetLorentzFactor(s);
    assert.ok(gamma >= 1 && gamma <= JET_FIELD.gammaSpine + 1e-9);
    const beta = jetBeta(gamma);
    assert.ok(Math.abs(beta * beta - (1 - 1 / (gamma * gamma))) < 1e-12);
    assert.ok(beta < 1);
  }
});

test("Doppler factor: approaching material is boosted, receding material is de-boosted", () => {
  const gamma = 8;
  const approaching = jetDopplerFactor(gamma, 0.9);
  const receding = jetDopplerFactor(gamma, -0.9);
  assert.ok(approaching > 1, "delta > 1 when beta.n > 0 (toward the observer)");
  assert.ok(receding < 1, "delta < 1 when beta.n < 0 (away from the observer)");
  // On-axis limit: delta -> 2 Gamma as beta.n -> beta.
  const onAxis = jetDopplerFactor(gamma, jetBeta(gamma));
  assert.ok(Math.abs(onAxis - 2 * gamma) / (2 * gamma) < 0.01, `on-axis delta ~ 2 Gamma (got ${onAxis.toFixed(2)})`);
  assert.equal(jetDopplerFactor(1, 0), 1, "no boost at rest (Gamma = 1, beta = 0)");
  assert.equal(jetObservedExponent(), 3 + JET_FIELD.spectralIndex);
  assert.equal(jetFrequencyShift({ lapse: 0.5, doppler: 2 }), 1);
});

test("collimation is parabolic and the emissivity fades with axial distance", () => {
  const sMin = 2;
  const r1 = jetRadius(sMin + 4, { sMin });
  const r2 = jetRadius(sMin + 16, { sMin });
  // Parabolic in (dist + sColl): the ratio matches the formula exactly.
  const expected = Math.sqrt((16 + JET_FIELD.sColl) / (4 + JET_FIELD.sColl));
  assert.ok(Math.abs(r2 / r1 - expected) < 1e-12, `parabolic collimation (ratio ${r2 / r1})`);
  assert.equal(jetRadius(sMin, { sMin }), JET_FIELD.rhoBase);
  assert.equal(jetAxialProfile(sMin - 1, { sMin }), 0, "no emission behind the horizon");
  const near = jetAxialProfile(sMin + 2, { sMin });
  const far = jetAxialProfile(sMin + 40, { sMin });
  assert.ok(near > far && far > 0, "axial emissivity fades with distance");
  const { spine, sheath } = jetRadialProfile(0);
  assert.ok(spine > sheath, "the spine dominates on the axis");
  const wide = jetRadialProfile(1.1);
  assert.ok(wide.sheath > wide.spine, "the sheath extends beyond the spine");
  // Display colour ages: redder with distance.
  assert.ok(jetDisplayKelvin(sMin + 40, { sMin }) < jetDisplayKelvin(sMin + 1, { sMin }));
});

test("knot modulation is seeded, unit-mean and advects along the jet", () => {
  const args = { s: 30, rho: 2, phi: 1.2, time: 5, seed: 42 };
  const value = jetKnotModulation(args);
  assert.ok(Number.isFinite(value) && value > 0);
  assert.equal(jetKnotModulation(args), value, "deterministic for the same inputs");
  assert.notEqual(jetKnotModulation({ ...args, seed: 43 }), value, "seeded");
  assert.notEqual(jetKnotModulation({ ...args, time: 6 }), value, "the pattern advects with time");
  // Unit mean over many samples (the log-normal bias is removed).
  let sum = 0;
  const n = 4000;
  for (let i = 0; i < n; i += 1) {
    sum += jetKnotModulation({ s: 20 + (i % 37) * 1.3, rho: (i % 11) * 0.4, phi: (i % 17) * 0.37, time: 3, seed: 42 });
  }
  const mean = sum / n;
  assert.ok(Math.abs(mean - 1) < 0.12, `ensemble mean near 1 (got ${mean.toFixed(3)})`);
});

test("jet emission samples: beaming, spin scaling and the volume bounds", () => {
  const base = { r: 20, u: 0.9, aStar: 0.9, sMin: 2, lapse: 1 };
  // Outside the jet: no emission.
  assert.equal(jetEmissionSample({ ...base, s: 1, rho: 0, rayDirZ: 0 }), null, "behind the horizon");
  assert.equal(jetEmissionSample({ ...base, s: 200, rho: 0, rayDirZ: 0 }), null, "beyond the truncation");
  assert.equal(jetEmissionSample({ ...base, s: 30, rho: 50, rayDirZ: 0 }), null, "outside the collimation");
  // Zero spin: the BZ factor kills the jet.
  assert.equal(jetEmissionSample({ ...base, aStar: 0, s: 30, rho: 1, rayDirZ: 0 }), null, "no BZ jet at a* = 0");
  // Approaching vs receding: the Doppler factor boosts the approaching jet.
  const approaching = jetEmissionSample({ ...base, s: 30, rho: 1, rayDirZ: -0.9 });
  const receding = jetEmissionSample({ ...base, s: 30, rho: 1, rayDirZ: 0.9 });
  assert.ok(approaching.emission > receding.emission, "the approaching jet is beamed brighter");
  // Spin scaling: the emission grows with the BZ factor.
  const lowSpin = jetEmissionSample({ ...base, aStar: 0.3, s: 30, rho: 1, rayDirZ: 0 });
  const highSpin = jetEmissionSample({ ...base, aStar: 0.99, s: 30, rho: 1, rayDirZ: 0 });
  const ratio = highSpin.emission / lowSpin.emission;
  const bzRatio = blandfordZnajekSpinFactor(0.99) / blandfordZnajekSpinFactor(0.3);
  assert.ok(Math.abs(ratio - bzRatio) / bzRatio < 1e-6, "emission scales exactly with the BZ spin factor");
  // The lapse suppresses emission near the horizon.
  const deep = jetEmissionSample({ ...base, s: 4, rho: 0.5, rayDirZ: 0, lapse: 0.1 });
  assert.ok(deep.emission < jetEmissionSample({ ...base, s: 4, rho: 0.5, rayDirZ: 0, lapse: 1 }).emission);
});

test("the GLSL chunks carry the same constants as the pure module", () => {
  for (const chunk of [JET_FIELD_GLSL, JET_KNOTS_GLSL]) {
    assert.ok(chunk.includes("float") && chunk.length > 200);
  }
  assert.ok(JET_FIELD_GLSL.includes("jetEmission"), "the base chunk owns the emission sampling");
  assert.ok(JET_FIELD_GLSL.includes(JET_FIELD.gammaSpine.toFixed(1)));
  assert.ok(JET_FIELD_GLSL.includes(JET_FIELD.sheathFraction.toFixed(1)));
  assert.ok(JET_KNOTS_GLSL.includes(JET_FIELD.knot.patternSpeed.toFixed(2)));
  assert.ok(JET_KNOTS_GLSL.includes(JET_FIELD_DERIVED.knotVariance.toFixed(8)));
  assert.ok(JET_FIELD_GLSL.includes(jetObservedExponent().toFixed(1)));
});
