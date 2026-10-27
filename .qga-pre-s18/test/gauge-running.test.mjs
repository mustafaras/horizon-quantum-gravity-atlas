import test from "node:test";
import assert from "node:assert/strict";
import { PDG } from "../js/science/data/pdg.mjs";
import { PLANCK_MASS_GEV } from "../js/science/higgs-running.mjs";
import {
  ALPHA_EM_INVERSE_MZ, alphaEmInverseMZ, ALPHA_EM_INVERSE_PLAN, GAUGE_INPUT_SOURCES,
} from "../js/science/data/gauge-couplings.mjs";
import {
  B_ONE_LOOP, B_TWO_LOOP, DEFAULT_M_SUSY_GEV, gutInverseCouplings, inputsAtMZ, oneLoopAnalytic,
  runGaugeCouplings, gaugeBand, unificationTriangle,
} from "../js/science/gauge-running.mjs";

const near = (actual, expected, tol, what) => assert.ok(Math.abs(actual - expected) <= tol, `${what}: ${actual} vs ${expected} (tol ${tol})`);
const MZ = PDG.MZ.value;
const TWO_PI = 2 * Math.PI;

test("alpha_em^-1 in MS-bar is derived from PDG 2026 inputs and reproduces the printed PDG 2024 value", () => {
  // PDG 2024 prints 127.930 +- 0.008 for alpha-hat^(5)(M_Z)^-1 with Delta alpha_had^(5) = 0.02783: the same pipeline must return it.
  near(alphaEmInverseMZ({ deltaAlphaHad: 0.02783 }).value, 127.930, 0.002, "PDG 2024 printed value");
  near(ALPHA_EM_INVERSE_MZ.value, 127.961, 0.001, "derived from the 2026 Delta alpha_had");
  near(ALPHA_EM_INVERSE_MZ.uncertainty, 0.014, 0.001, "uncertainty from Delta alpha_had = 0.00010");
  assert.equal(ALPHA_EM_INVERSE_PLAN, 127.951, "the plan's number is kept only as an explicit override");
  for (const key of ["alphaZeroInverse", "deltaAlphaLep", "deltaAlphaHad", "msbarShift"]) {
    const s = GAUGE_INPUT_SOURCES[key];
    assert.ok(s.citation && (s.doi || s.url) && /^\d{4}-\d{2}-\d{2}$/.test(s.retrieved) && Number.isFinite(s.value), `${key} carries citation, locator, value and retrieval date`);
    assert.ok(Number.isFinite(s.uncertainty), `${key} has an uncertainty`);
  }
});

test("GUT-normalised inverse couplings at M_Z: 59.02, 29.58, 8.47 (plan inputs) and the derived-input values", () => {
  const plan = gutInverseCouplings({ alphaEmInverse: ALPHA_EM_INVERSE_PLAN, sin2ThetaW: 0.23122, alphaS: 0.1180 });
  near(plan[0], 59.020, 1e-3, "alpha1^-1");
  near(plan[1], 29.585, 1e-3, "alpha2^-1");
  near(plan[2], 8.475, 1e-3, "alpha3^-1");
  const shipped = inputsAtMZ();
  near(shipped[0], 59.0245, 1e-3, "alpha1^-1 shipped");
  near(shipped[1], 29.5872, 1e-3, "alpha2^-1 shipped");
  near(shipped[2], 1 / PDG.alphaS.value, 1e-12, "alpha3^-1 = 1/alpha_s");
});

test("the coefficient tables are Martin-Vaughn eq. 4.4-4.5 (MSSM) and Buttazzo et al. appendix B (SM)", () => {
  assert.deepEqual(B_ONE_LOOP.sm, [41 / 10, -19 / 6, -7]);
  assert.deepEqual(B_ONE_LOOP.mssm, [33 / 5, 1, -3]);
  assert.deepEqual(B_TWO_LOOP.sm, [[199 / 50, 27 / 10, 44 / 5], [9 / 10, 35 / 6, 12], [11 / 10, 9 / 2, -26]]);
  assert.deepEqual(B_TWO_LOOP.mssm, [[199 / 25, 27 / 5, 88 / 5], [9 / 5, 25, 24], [11 / 5, 9, 14]]);
  assert.ok(Object.isFrozen(B_ONE_LOOP) && Object.isFrozen(B_TWO_LOOP.sm));
});

test("one-loop analytic solution at the Planck mass: 33.29, 49.46, 52.41 (SM, plan inputs)", () => {
  const inv0 = gutInverseCouplings({ alphaEmInverse: ALPHA_EM_INVERSE_PLAN, sin2ThetaW: 0.23122, alphaS: 0.1180 });
  const t = Math.log(PLANCK_MASS_GEV / MZ);
  const planck = oneLoopAnalytic(inv0, B_ONE_LOOP.sm, t);
  near(planck[0], 33.29, 0.01, "alpha1^-1(M_Pl)");
  near(planck[1], 49.46, 0.01, "alpha2^-1(M_Pl)");
  near(planck[2], 52.41, 0.01, "alpha3^-1(M_Pl)");
});

test("numerical one-loop running equals the analytic solution, with and without the SUSY threshold", () => {
  const inv0 = inputsAtMZ();
  const sm = runGaugeCouplings({ loops: 1, model: "sm", points: 200 });
  const tEnd = Math.log(10) * sm.log10Mu.at(-1) - Math.log(MZ);
  const analytic = oneLoopAnalytic(inv0, B_ONE_LOOP.sm, tEnd);
  for (let i = 0; i < 3; i++) near(sm.inv[i].at(-1), analytic[i], 1e-9, `SM alpha${i + 1}^-1`);
  const mssm = runGaugeCouplings({ loops: 1, model: "mssm", mSusyGeV: 1000, points: 200 });
  const tS = Math.log(1000 / MZ);
  for (let i = 0; i < 3; i++) {
    const expected = inv0[i] - (B_ONE_LOOP.sm[i] * tS + B_ONE_LOOP.mssm[i] * (tEnd - tS)) / TWO_PI;
    near(mssm.inv[i].at(-1), expected, 1e-9, `MSSM alpha${i + 1}^-1`);
  }
});

test("two-loop running agrees with an independent integration of Buttazzo et al. eq. 96-98 (Yukawas off)", () => {
  // Independent form: d g_i^2 / d ln mu^2 = g_i^4 [ b_i / 16 pi^2 + sum_j c_ij g_j^2 / (16 pi^2)^2 ] on the g^2 of the GUT-normalised couplings.
  const c = [[199 / 50, 27 / 10, 44 / 5], [9 / 10, 35 / 6, 12], [11 / 10, 9 / 2, -26]];
  const b = [41 / 10, -19 / 6, -7];
  const inv0 = inputsAtMZ();
  let g2 = inv0.map((x) => 4 * Math.PI / x);
  const tEnd = Math.log(1e16 / MZ), steps = 20000, h = tEnd / steps;
  const rhs = (y) => y.map((gi, i) => {
    const sixteen = 16 * Math.PI * Math.PI;
    const dlnmu2 = gi * gi * (b[i] / sixteen + c[i].reduce((s, cij, j) => s + cij * y[j], 0) / (sixteen * sixteen));
    return 2 * dlnmu2; // per ln mu
  });
  for (let n = 0; n < steps; n++) {
    const k1 = rhs(g2), k2 = rhs(g2.map((v, i) => v + h / 2 * k1[i])), k3 = rhs(g2.map((v, i) => v + h / 2 * k2[i])), k4 = rhs(g2.map((v, i) => v + h * k3[i]));
    g2 = g2.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }
  const run = runGaugeCouplings({ loops: 2, model: "sm", log10Max: 16, points: 400 });
  for (let i = 0; i < 3; i++) near(run.inv[i].at(-1), (4 * Math.PI) / g2[i], 1e-6, `alpha${i + 1}^-1 at 1e16 GeV`);
});

test("two loops shift the one-loop lines by a few tenths, asymptotic freedom and the hypercharge trend survive", () => {
  const one = runGaugeCouplings({ loops: 1, model: "sm", log10Max: 19 });
  const two = runGaugeCouplings({ loops: 2, model: "sm", log10Max: 19 });
  for (let i = 0; i < 3; i++) {
    const d = Math.abs(one.inv[i].at(-1) - two.inv[i].at(-1));
    assert.ok(d > 0.01 && d < 6, `alpha${i + 1}^-1 two-loop shift ${d}`);
  }
  assert.ok(two.inv[2].at(-1) > two.inv[2][0], "alpha_3^-1 grows with mu (asymptotic freedom)");
  assert.ok(two.inv[0].at(-1) < two.inv[0][0], "alpha_1^-1 falls with mu (not asymptotically free)");
  assert.equal(two.log10Mu.length, 400);
  near(two.log10Mu[0], Math.log10(MZ), 1e-12, "the run starts at M_Z");
  near(two.log10Mu.at(-1), 19, 1e-12, "and ends at the requested scale");
});

test("MSSM: SM below M_SUSY, the continuous MSSM above, default 1 TeV", () => {
  assert.equal(DEFAULT_M_SUSY_GEV, 1000);
  const sm = runGaugeCouplings({ loops: 2, model: "sm", points: 600 });
  const mssm = runGaugeCouplings({ loops: 2, model: "mssm", points: 600 });
  let beyond = 0;
  for (let k = 0; k < sm.log10Mu.length; k++) {
    if (sm.log10Mu[k] < 3) for (let i = 0; i < 3; i++) near(mssm.inv[i][k], sm.inv[i][k], 1e-9, "below the threshold");
    else beyond = Math.max(beyond, Math.abs(mssm.inv[0][k] - sm.inv[0][k]));
  }
  assert.ok(beyond > 5, `the MSSM leaves the SM above 1 TeV (${beyond})`);
  const high = runGaugeCouplings({ loops: 2, model: "mssm", mSusyGeV: 1e4, points: 600 });
  const k = sm.log10Mu.findIndex((x) => x > 3.5);
  near(high.inv[0][k], sm.inv[0][k], 1e-9, "a heavier threshold leaves the SM longer");
  assert.throws(() => runGaugeCouplings({ model: "mssm", mSusyGeV: 10 }), RangeError, "M_SUSY below M_Z is rejected");
  assert.throws(() => runGaugeCouplings({ model: "nope" }), RangeError);
  assert.throws(() => runGaugeCouplings({ loops: 3 }), RangeError);
});

test("the triangle of the three lines: positive for the SM, much smaller for the MSSM", () => {
  const triangle = (model, loops) => unificationTriangle(runGaugeCouplings({ loops, model, log10Max: 19, points: 1500 }));
  const sm = triangle("sm", 2), mssm = triangle("mssm", 2);
  assert.equal(sm.vertices.length, 3);
  assert.ok(sm.area > 0.5, `SM area ${sm.area} dex x alpha^-1`);
  assert.ok(mssm.area > 0 && mssm.area < sm.area, `MSSM area ${mssm.area}`);
  // Measured (ledger D-100): two loops 5.472 / 0.00896 = 611, one loop 7.265 / 0.0724 = 100; the MSSM area falls to 0.0007 at 2 TeV.
  near(sm.area, 5.472, 0.005, "SM two-loop area");
  near(mssm.area, 0.00896, 0.0005, "MSSM two-loop area");
  const ratio = sm.area / mssm.area;
  assert.ok(ratio > 500 && ratio < 750, `SM / MSSM two-loop area ratio ${ratio}`);
  const ratio1 = triangle("sm", 1).area / triangle("mssm", 1).area;
  assert.ok(ratio1 > 90 && ratio1 < 110, `SM / MSSM one-loop area ratio ${ratio1}`);
  // the vertices are the pairwise crossings: at each, the two lines have the same value
  const run = runGaugeCouplings({ loops: 2, model: "sm", points: 1500 });
  for (const v of sm.vertices) {
    const k = run.log10Mu.findIndex((x) => x >= v.log10Mu);
    const [i, j] = v.pair;
    near(run.inv[i][k], run.inv[j][k], 0.05, `alpha${i + 1}^-1 = alpha${j + 1}^-1 at the vertex`);
  }
  assert.ok(Number.isFinite(triangle("sm", 1).area), "the one-loop triangle exists too");
  const none = unificationTriangle(runGaugeCouplings({ loops: 1, model: "sm", log10Max: 5, points: 50 }));
  assert.equal(none.area, null, "no crossing inside the run: no triangle");
  assert.equal(none.missing.length, 3);
});

test("1-sigma bands: central line, symmetric width, propagated from the three inputs", () => {
  const band = gaugeBand({ loops: 2, model: "sm", points: 80 });
  assert.equal(band.lower.length, 3);
  const w3 = band.upper[2][0] - band.lower[2][0];
  near(w3 / 2, PDG.alphaS.uncertainty / PDG.alphaS.value ** 2, 1e-9, "alpha_3^-1 half-width at M_Z");
  const dAlphaEm = ALPHA_EM_INVERSE_MZ.uncertainty, s2 = PDG.sin2ThetaW.uncertainty, a = ALPHA_EM_INVERSE_MZ.value;
  near((band.upper[1][0] - band.lower[1][0]) / 2, Math.hypot(0.23122 * dAlphaEm, s2 * a), 1e-9, "alpha_2^-1 half-width at M_Z");
  for (let i = 0; i < 3; i++) for (let k = 0; k < 80; k++) assert.ok(band.lower[i][k] <= band.upper[i][k]);
});
