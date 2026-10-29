import test from "node:test";
import assert from "node:assert/strict";
import {
  PAGE_BETA, massFraction, blackHoleEntropyFraction, radiationEntropyFraction,
  pageCurve, pageTimeFraction, pageTimeSummary, luminosityShape,
} from "../js/science/evaporation.mjs";
import {
  transmission, lowFrequencyCrossSection, highFrequencyCrossSection, CROSS_SECTION_RATIO,
  reggeWheelerPotential, radiusFromTortoise, greybodySpectrum,
} from "../js/science/greybody.mjs";

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} differs from ${b} by more than ${tol}`);

test("the Page time follows from S_rad = S_BH with Page's computed beta", () => {
  // beta = 1.4847 is read from Page 2013, arXiv:1301.4995.
  near(PAGE_BETA, 1.4847, 1e-12);
  const summary = pageTimeSummary();
  near(summary.entropyFraction, 0.5975, 1e-4);
  near(summary.massFraction, 0.7730, 1e-4);
  near(summary.timeFraction, 0.5381, 1e-4);
  // And it is genuinely the crossing point, not just a number that matches.
  const f = summary.timeFraction;
  near(radiationEntropyFraction(f), blackHoleEntropyFraction(f), 1e-12);
});

test("mass and entropy follow the luminosity law", () => {
  near(massFraction(0), 1, 1e-15);
  near(massFraction(1), 0, 1e-15);
  near(massFraction(0.5), Math.cbrt(0.5), 1e-15);
  // S/S0 = (M/M0)^2
  for (const f of [0, 0.2, 0.5, 0.8]) near(blackHoleEntropyFraction(f), massFraction(f) ** 2, 1e-15);
  // Monotone decreasing.
  let previous = 1;
  for (let f = 0; f <= 1; f += 0.05) {
    const s = blackHoleEntropyFraction(f);
    assert.ok(s <= previous + 1e-15, "the black hole entropy never rises");
    previous = s;
  }
  assert.throws(() => massFraction(Infinity));
});

test("the Page curve is the minimum of the two branches, continuous, and returns to zero", () => {
  near(pageCurve(0), 0, 1e-15);
  near(pageCurve(1), 0, 1e-15);
  let previous = 0;
  for (let f = 0; f <= 0.5381; f += 0.01) {
    const s = pageCurve(f);
    assert.ok(s >= previous - 1e-12, "rising before the Page time");
    previous = s;
  }
  // Continuous across the Page time: the two branches agree there, so there is no jump.
  const fPage = pageTimeFraction();
  near(pageCurve(fPage - 1e-6), pageCurve(fPage + 1e-6), 1e-6);
  // And it always sits below the Hawking branch.
  for (let f = 0.01; f < 1; f += 0.01) assert.ok(pageCurve(f) <= radiationEntropyFraction(f) + 1e-15);
});

test("luminosity falls as 1/M^2", () => {
  near(luminosityShape(1), 1, 1e-15);
  near(luminosityShape(2), 0.25, 1e-15);
  assert.throws(() => luminosityShape(0));
});

/* ---------- greybody ---------- */

test("the cross-section limits are the horizon area and the geometric-optics value", () => {
  near(lowFrequencyCrossSection(1), 16 * Math.PI, 1e-12);
  near(highFrequencyCrossSection(1), 27 * Math.PI, 1e-12);
  near(CROSS_SECTION_RATIO, 27 / 16, 1e-15);
  // Scale with M^2.
  near(lowFrequencyCrossSection(2) / lowFrequencyCrossSection(1), 4, 1e-12);
});

test("the tortoise coordinate inverts and the potential has the right shape", () => {
  const M = 1;
  for (const r of [2.5, 4, 10, 50]) {
    const rStar = r + 2 * M * Math.log(r / (2 * M) - 1);
    near(radiusFromTortoise(rStar, M), r, 1e-9);
  }
  // The potential is positive outside the horizon, peaks near r = 3M for l = 0, and vanishes at both ends.
  assert.ok(reggeWheelerPotential(3, 0, 1) > 0);
  assert.ok(reggeWheelerPotential(3, 0, 1) > reggeWheelerPotential(2.01, 0, 1));
  assert.ok(reggeWheelerPotential(200, 0, 1) < 1e-6);
});

test("the transmission is bounded, rises with omega, and reaches 1 for the s-wave", () => {
  const M = 1;
  let previous = -1;
  for (const w of [0.1, 0.2, 0.3, 0.5, 0.8]) {
    const g = transmission(0, w, M);
    assert.ok(g >= 0 && g <= 1, `Gamma in [0,1] at omega=${w}: ${g}`);
    assert.ok(g >= previous - 1e-9, "no threshold below the barrier top for l = 0");
    previous = g;
  }
  // Well above the barrier the s-wave passes almost freely.
  assert.ok(transmission(0, 2, M) > 0.99, "the s-wave saturates");
  // Higher partial waves are suppressed at low frequency: the centrifugal barrier.
  assert.ok(transmission(1, 0.2, M) < 0.01, "l = 1 is closed at omega = 0.2");
  assert.ok(transmission(2, 0.4, M) < 0.01, "l = 2 is closed at omega = 0.4");
  assert.throws(() => transmission(-1, 0.5, 1));
  assert.throws(() => transmission(0, 0, 1));
});

test("the low-frequency transmission scales as omega squared", () => {
  // For a massless scalar the low-energy absorption cross-section tends to the horizon area, so Gamma_0 grows as
  // omega^2. Measured: Gamma/omega^2 settles to 1.83e-2 at omega = 0.002 and drifts up only once the wavelength
  // approaches the barrier (3.07e-2 at omega = 0.04). The test therefore checks the *ratio* over a window where
  // the asymptotic form holds, rather than a single pair that straddles the crossover.
  const ratios = [];
  for (const w of [0.002, 0.004, 0.008]) {
    const g = transmission(0, w, 1);
    ratios.push(g / (w * w));
  }
  const spread = Math.max(...ratios) / Math.min(...ratios);
  assert.ok(spread < 1.15, `Gamma/omega^2 is flat to ${spread.toFixed(3)} across the window`);
  // Doubling omega quadruples the transmission.
  near(transmission(0, 0.008, 1) / transmission(0, 0.004, 1), 4, 0.2);
});

test("the greybody spectrum differs from the blackbody and reports its partial waves", () => {
  const spec = greybodySpectrum({ omegaMax: 2, samples: 24, lMax: 2, M: 1, temperature: 0.15 });
  assert.equal(spec.omega.length, 24);
  assert.equal(spec.transmissions.length, 3);
  assert.ok(spec.greybody.every((v) => Number.isFinite(v) && v >= 0));
  // The greybody curve is not the blackbody curve: the factor is what the figure is about.
  const maxDiff = Math.max(...spec.greybody.map((v, i) => Math.abs(v - spec.blackbody[i])));
  assert.ok(maxDiff > 0.05, `the corrected spectrum differs from the blackbody by ${maxDiff.toFixed(3)}`);
  for (const row of spec.transmissions) {
    assert.ok(row.gamma.every((g) => g >= 0 && g <= 1), `l = ${row.l} stays in [0, 1]`);
  }
});
