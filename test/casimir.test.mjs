// S15: the Casimir cavity (js/science/casimir.mjs, js/science/data/casimir.mjs).
// Reference values come from outside the code under test: the plan's pressures (1 um -> 1.3001e-3 Pa, 100 nm -> 13.001 Pa), the
// coefficient K_C = pi h c / 480 = 1.3e-27 N m^2 that Bressi et al. print, and the closed form of the regularised 1+1D mode sum,
// sum n exp(-n eps) = 1 / (4 sinh^2(eps/2)) = 1/eps^2 - 1/12 + eps^2/240 - ...

import test from "node:test";
import assert from "node:assert/strict";
import { HBAR, C } from "../js/science/constants.mjs";
import {
  idealPressure, idealEnergyPerArea, idealCoefficient, modeSumDifference, cutoffForRatio, standingModes, pressureCurve, dataBand, ratioBand,
} from "../js/science/casimir.mjs";
import { CASIMIR_DATA, CASIMIR_SOURCES } from "../js/science/data/casimir.mjs";

const relErr = (a, b) => Math.abs(a - b) / Math.abs(b);

test("ideal plates: the plan's two pressures, attractive", () => {
  assert.ok(relErr(idealPressure(1e-6), -1.3001e-3) < 1e-4, `1 um: ${idealPressure(1e-6)}`);
  assert.ok(relErr(idealPressure(100e-9), -13.001) < 1e-4, `100 nm: ${idealPressure(100e-9)}`);
  assert.ok(idealPressure(1e-6) < 0);
});

test("the pressure scales as a^-4 and is minus the derivative of the energy per area", () => {
  assert.ok(relErr(idealPressure(0.5e-6) / idealPressure(1e-6), 16) < 1e-12);
  const a = 2e-7, h = a * 1e-5;
  const derivative = -(idealEnergyPerArea(a + h) - idealEnergyPerArea(a - h)) / (2 * h);
  assert.ok(relErr(derivative, idealPressure(a)) < 1e-8, `${derivative} vs ${idealPressure(a)}`);
  assert.ok(relErr(idealEnergyPerArea(1e-6), -(Math.PI ** 2) * HBAR * C / (720 * 1e-18)) < 1e-12);
});

test("K_C = pi^2 hbar c / 240 is the 1.3e-27 N m^2 of Bressi et al.", () => {
  assert.ok(relErr(idealCoefficient(), 1.3e-27) < 1e-3, `${idealCoefficient()}`);
  assert.ok(relErr(idealCoefficient(), -idealPressure(1)) < 1e-14);
});

test("1+1D mode sum: E_in - E_out converges to -pi hbar c / 24a at three cutoffs, with the error falling as 1/Lambda^2", () => {
  const a = 1e-6, limit = -Math.PI * HBAR * C / (24 * a);
  const errors = [10, 20, 40].map((ratio) => {
    const r = modeSumDifference({ gap: a, cutoff: cutoffForRatio(a, ratio) });
    assert.equal(r.limit, limit);
    return relErr(r.difference, limit);
  });
  assert.ok(errors[0] > errors[1] && errors[1] > errors[2], `monotone: ${errors}`);
  assert.ok(errors[2] < 1e-3, `at the largest cutoff ${errors[2]}`);
  // eps = pi c / (a Lambda) = 1 / ratio; the first neglected term is eps^2/240 against 1/12: relative error eps^2/20 for ratio 10
  assert.ok(relErr(errors[0], (1 / 10) ** 2 / 20) < 0.05, `${errors[0]}`);
  assert.ok(relErr(errors[0] / errors[2], 16) < 0.05, "error ratio for a cutoff 4 times larger is about 16");
});

test("the inside sum matches the closed form and the outside is the continuum of the same length", () => {
  const a = 3e-7, ratio = 25, lambda = cutoffForRatio(a, ratio);
  const r = modeSumDifference({ gap: a, cutoff: lambda });
  const eps = 1 / ratio;
  const closed = (HBAR * Math.PI * C) / (2 * a) / (4 * Math.sinh(eps / 2) ** 2);
  assert.ok(relErr(r.inside, closed) < 1e-9, `${r.inside} vs ${closed}`);
  assert.ok(relErr(r.outside, (HBAR * a * lambda ** 2) / (2 * Math.PI * C)) < 1e-12);
  assert.ok(relErr(r.difference, r.inside - r.outside) < 1e-12);
});

test("the mode sum refuses a cutoff that would need more than the term budget, and bad input", () => {
  assert.throws(() => modeSumDifference({ gap: 1e-6, cutoff: cutoffForRatio(1e-6, 1e9) }), RangeError);
  assert.throws(() => modeSumDifference({ gap: -1, cutoff: 1e15 }), /gap/);
  assert.throws(() => modeSumDifference({ gap: 1e-6, cutoff: 0 }), /cutoff/);
});

test("standing modes: omega_n = n pi c / a and amplitude proportional to 1/sqrt(omega_n), normalised to the first", () => {
  const modes = standingModes({ gap: 1e-6, count: 5 });
  assert.equal(modes.length, 5);
  modes.forEach((m, i) => {
    assert.equal(m.n, i + 1);
    assert.ok(relErr(m.omega, ((i + 1) * Math.PI * C) / 1e-6) < 1e-14);
    assert.ok(relErr(m.amplitude, 1 / Math.sqrt(i + 1)) < 1e-14);
  });
  assert.throws(() => standingModes({ gap: 1e-6, count: 0 }), /count/);
});

test("pressureCurve samples the gap on a log axis and returns the attraction magnitude", () => {
  const curve = pressureCurve({ min: 1e-8, max: 1e-5, count: 7 });
  assert.equal(curve.gap.length, 7);
  assert.ok(relErr(curve.gap[0], 1e-8) < 1e-14 && relErr(curve.gap[6], 1e-5) < 1e-12);
  assert.ok(relErr(curve.gap[3], Math.sqrt(1e-8 * 1e-5)) < 1e-12);
  curve.gap.forEach((a, i) => assert.ok(relErr(curve.pressure[i], -idealPressure(a)) < 1e-14));
  assert.ok(curve.pressure.every((p) => p > 0));
});

test("data: every source carries a citation, DOI, retrieval date and the numbers the papers print", () => {
  for (const key of ["bressi2002", "lamoreaux1997"]) {
    const s = CASIMIR_SOURCES[key];
    assert.match(s.doi, /^10\.1103\/PhysRev/);
    assert.match(s.retrieved, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(s.citation.length > 20);
  }
  assert.equal(CASIMIR_SOURCES.bressi2002.arxiv, "quant-ph/0203002");
  assert.equal(CASIMIR_SOURCES.jaffe2005.arxiv, "hep-th/0503158");
  assert.deepEqual(CASIMIR_DATA.bressi2002.range, [0.5e-6, 3.0e-6]);
  assert.equal(CASIMIR_DATA.bressi2002.coefficient.value, 1.22e-27);
  assert.equal(CASIMIR_DATA.bressi2002.coefficient.uncertainty, 0.18e-27);
  assert.equal(CASIMIR_DATA.bressi2002.reportedPrecision, 0.15);
  assert.deepEqual(CASIMIR_DATA.lamoreaux1997.range, [0.6e-6, 6e-6]);
  assert.equal(CASIMIR_DATA.lamoreaux1997.reportedAgreement, 0.05);
  assert.equal(CASIMIR_DATA.digitisedPoints.committed, false);
  assert.match(CASIMIR_DATA.digitisedPoints.reason, /licen[cs]e/i);
});

test("data bands: Bressi is K/a^4 over its range, Lamoreaux is the 5 % agreement about the ideal line", () => {
  const gaps = [0.5e-6, 1e-6, 3e-6];
  const b = dataBand("bressi2002", gaps);
  assert.deepEqual(b.gap, gaps);
  gaps.forEach((a, i) => {
    assert.ok(relErr(b.low[i], (1.22e-27 - 0.18e-27) / a ** 4) < 1e-12);
    assert.ok(relErr(b.high[i], (1.22e-27 + 0.18e-27) / a ** 4) < 1e-12);
    assert.ok(b.low[i] < b.high[i]);
  });
  const l = dataBand("lamoreaux1997", [0.6e-6, 6e-6]);
  [0.6e-6, 6e-6].forEach((a, i) => {
    assert.ok(relErr(l.low[i], 0.95 * -idealPressure(a)) < 1e-12);
    assert.ok(relErr(l.high[i], 1.05 * -idealPressure(a)) < 1e-12);
  });
  const ratio = ratioBand(dataBand("bressi2002", gaps));
  gaps.forEach((a, i) => {
    assert.ok(relErr(ratio.low[i], (1.22e-27 - 0.18e-27) / idealCoefficient()) < 1e-12, `${ratio.low[i]}`);
    assert.ok(relErr(ratio.high[i], (1.22e-27 + 0.18e-27) / idealCoefficient()) < 1e-12);
  });
  assert.ok(relErr(ratio.low[0], 0.8) < 0.01 && ratio.high[0] < 1.1, "the Bressi coefficient is about 0.94 of the ideal, 0.80 to 1.08");
  const lr = ratioBand(l);
  assert.ok(lr.low.every((v) => Math.abs(v - 0.95) < 1e-12) && lr.high.every((v) => Math.abs(v - 1.05) < 1e-12));
  assert.throws(() => dataBand("sparnaay1958", gaps), /source/);
  assert.throws(() => dataBand("bressi2002", [1e-7]), RangeError);
});
