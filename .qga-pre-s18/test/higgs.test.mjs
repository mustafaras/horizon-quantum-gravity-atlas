// S13: the physical Higgs potential and the running of the quartic coupling (js/science/higgs.mjs, higgs-running.mjs).
// Reference values come from outside the code under test: the closed forms of the pure-lambda and gauge-only flows, a
// one-loop beta evaluated independently (Python, hypercharge normalisation g_Y), and the Planck-scale couplings that
// Buttazzo et al., JHEP 12 (2013) 089 (arXiv:1307.3536) print for their own two-loop-matched inputs.

import test from "node:test";
import assert from "node:assert/strict";
import { PDG, PDG_SOURCE, PDG_OMITTED } from "../js/science/data/pdg.mjs";
import { vevFromFermi, quarticFromMass, potential, reducedPotential, modeCurvatures, vacuumAbsH } from "../js/science/higgs.mjs";
import {
  PLANCK_MASS_GEV, HUBBLE_GEV, TOP_SCALE_STEP, betaFunctions, matchAtTop, runCouplings, runFromInputs, instabilityScale,
  vacuumDecay, stabilityRegion, stabilityBoundaries, lambdaBand,
} from "../js/science/higgs-running.mjs";

const close = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what ?? "value"}: ${a} vs ${b} (tol ${tol})`);
const GUT = Math.sqrt(5 / 3);

test("v = (sqrt2 G_F)^(-1/2) and lambda = mH^2 / 2v^2 reproduce the plan's quoted numbers", () => {
  close(vevFromFermi(1.1663788e-5), 246.220, 5e-4, "v for the 2024 G_F");
  const v = vevFromFermi(1.1663788e-5);
  close(quarticFromMass(125.20, v), 0.12928, 5e-6, "lambda at 125.20 GeV");
  close(vevFromFermi(PDG.GF.value), 246.2197, 5e-4, "v for the 2026 G_F");
});

test("the potential has its minimum at |H| = v/sqrt2 with depth -lambda v^4 / 4", () => {
  const v = 246.22, lambda = 0.129, mu2 = lambda * v * v;
  const h0 = vacuumAbsH(v);
  close(h0, v / Math.SQRT2, 1e-12);
  const V = (h) => potential(h, { lambda, mu2 });
  close(V(h0), -lambda * v ** 4 / 4, 1e-6 * lambda * v ** 4);
  assert.ok(V(h0) < V(0.9 * h0) && V(h0) < V(1.1 * h0));
  assert.equal(V(0), 0);
});

test("the radial mode has m_H^2 = 2 lambda v^2 and the Goldstone modes are massless", () => {
  const v = 246.22, lambda = 0.129, mu2 = lambda * v * v;
  const { radial, goldstone } = modeCurvatures({ lambda, mu2, h: v });
  close(radial, 2 * lambda * v * v, 1e-6);
  close(goldstone, 0, 1e-6);
  // Central finite differences of V(h, chi) with |H|^2 = (h^2 + chi^2)/2 agree with the analytic curvatures.
  const V = (h, chi) => potential(Math.sqrt((h * h + chi * chi) / 2), { lambda, mu2 });
  const e = 1e-2;
  close((V(v + e, 0) - 2 * V(v, 0) + V(v - e, 0)) / (e * e), radial, 1e-3 * radial, "radial");
  close((V(v, e) - 2 * V(v, 0) + V(v, -e)) / (e * e), 0, 1e-3 * radial, "goldstone");
});

test("the reduced potential is V / (lambda v^4) and flips to a single well when mu^2 changes sign", () => {
  const v = 246.22, lambda = 0.129, mu2 = lambda * v * v;
  for (const x of [0, 0.3, 1, 1.4]) {
    const physical = potential((x * v) / Math.SQRT2, { lambda, mu2 }) / (lambda * v ** 4);
    close(reducedPotential(x, 1), physical, 1e-12, `x = ${x}`);
  }
  assert.equal(reducedPotential(1, 1), -0.25);
  assert.ok(reducedPotential(0.5, -1) > reducedPotential(0, -1), "symmetric phase: the origin is the minimum");
});

test("PDG 2026 values carry value, uncertainty, unit and table; the unprinted alpha_em is recorded as omitted", () => {
  for (const key of ["GF", "mH", "mt", "MZ", "MW", "alphaS", "sin2ThetaW"]) {
    const e = PDG[key];
    assert.ok(Number.isFinite(e.value) && e.uncertainty > 0, key);
    assert.ok(typeof e.unit === "string" && typeof e.table === "string" && e.table.length > 0, key);
  }
  assert.deepEqual([PDG.mH.value, PDG.mH.uncertainty], [125.13, 0.11]);
  assert.deepEqual([PDG.mt.value, PDG.mt.uncertainty], [172.60, 0.27]);
  assert.match(PDG_SOURCE.edition, /2026/);
  assert.match(PDG_SOURCE.retrieved, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(PDG_OMITTED.some((o) => /alpha/i.test(o.quantity) && o.reason.length > 20));
  assert.equal(PDG.alphaEmInverse, undefined, "an unverified number must not be shipped");
});

test("derived constants: M_Pl = sqrt(hbar c / G) and H0 = 67.4 km/s/Mpc in GeV", () => {
  close(PLANCK_MASS_GEV / 1e19, 1.22089, 2e-5, "M_Pl / 1e19");
  close(HUBBLE_GEV / 1e-42, 1.43772, 1e-4, "H0 / 1e-42 GeV");
});

test("one-loop beta functions equal an independent evaluation at a fixed point", () => {
  const state = [0.1, 0.9, 0.46, 0.65, 1.1];
  const [bl, by, b1, b2, b3] = betaFunctions(state, 1);
  close(bl, -0.018338142894754543, 1e-12, "beta_lambda");
  close(by, -0.04083836746339219, 1e-12, "beta_yt");
  close(b1, 0.002527188424821464, 1e-12, "beta_g1");
  close(b2, -0.0055070965739350336, 1e-12, "beta_g2");
  close(b3, -0.05900059174972883, 1e-12, "beta_g3");
});

test("the pure-lambda flow matches its closed form: lambda(t) = lambda0 / (1 - 24 lambda0 t / 16 pi^2)", () => {
  const lambda0 = 0.13, span = 10;
  const run = runCouplings([lambda0, 0, 0, 0, 0], { tStart: 0, tEnd: span, loops: 1 });
  const exact = lambda0 / (1 - (24 * lambda0 * span) / (16 * Math.PI ** 2));
  close(run.states.at(-1)[0], exact, 1e-9 * exact);
});

test("gauge couplings follow 1/g^2(t) = 1/g0^2 - 2 b t / 16 pi^2 at one loop (b = 41/10, -19/6, -7)", () => {
  const initial = [0, 0, 0.46, 0.65, 1.2], span = 20;
  const run = runCouplings(initial, { tStart: 0, tEnd: span, loops: 1 });
  [[2, 41 / 10], [3, -19 / 6], [4, -7]].forEach(([i, b]) => {
    const exact = 1 / Math.sqrt(1 / initial[i] ** 2 - (2 * b * span) / (16 * Math.PI ** 2));
    close(run.states.at(-1)[i], exact, 1e-9 * exact, `g${i - 1}`);
  });
});

test("the fixed step never exceeds the plan's 0.05 in ln mu and the run is deterministic", () => {
  assert.equal(TOP_SCALE_STEP, 0.05);
  const a = runFromInputs({ mt: 172.6, mH: 125.13, alphaS: 0.118 });
  const b = runFromInputs({ mt: 172.6, mH: 125.13, alphaS: 0.118 });
  assert.deepEqual(a.states, b.states);
  for (let i = 1; i < a.t.length; i++) assert.ok(a.t[i] - a.t[i - 1] <= TOP_SCALE_STEP + 1e-12);
  close(Math.exp(a.t.at(-1)), PLANCK_MASS_GEV, 1e-6 * PLANCK_MASS_GEV);
});

// The couplings Buttazzo et al. print at mu = M_t for their central inputs (eq. 55, 57-60) and at M_Pl (eq. 61).
const BUTTAZZO_AT_TOP = [0.12604, 0.9369, GUT * 0.3583, 0.64779, 1.1666];
test("the two-loop flow reproduces the Planck-scale couplings of Buttazzo et al. (eq. 61)", () => {
  const run = runCouplings(BUTTAZZO_AT_TOP, { tStart: Math.log(173.34), tEnd: Math.log(PLANCK_MASS_GEV), loops: 2 });
  const [lambda, yt, g1, g2, g3] = run.states.at(-1);
  close(g1, 0.6154, 6e-4, "g1(M_Pl)");
  close(g2, 0.5055, 6e-4, "g2(M_Pl)");
  close(g3, 0.4873, 3e-4, "g3(M_Pl)");
  close(yt, 0.3825, 1.5e-3, "yt(M_Pl)");
  close(lambda, -0.0143, 1.2e-3, "lambda(M_Pl)"); // the paper integrates three-loop terms that this flow leaves out
});

test("with those inputs the instability scale lies in the literature range 1e9 - 1e12 GeV", () => {
  const run = runCouplings(BUTTAZZO_AT_TOP, { tStart: Math.log(173.34), tEnd: Math.log(PLANCK_MASS_GEV), loops: 2 });
  const mu = instabilityScale(run);
  assert.ok(mu > 1e9 && mu < 1e12, `mu_inst = ${mu}`);
});

test("matching at m_t: tree-level lambda, y_t with the leading QCD correction, gauge couplings from M_Z, v and the MS-bar angle", () => {
  const [lambda, yt, g1, g2, g3] = matchAtTop({ mt: 173.34, mH: 125.15, alphaS: 0.1184 });
  const v = vevFromFermi(PDG.GF.value);
  close(lambda, (125.15 * 125.15) / (2 * v * v), 1e-12);
  // Buttazzo Table 3: NLO y_t = 0.95113 (tree level 0.99561); the leading QCD factor 1 - 4 alpha_s / 3 pi gets within 0.4 %.
  close(yt, 0.95113, 0.004 * 0.95113, "yt(m_t)");
  // alpha_s(M_t) = 0.1083 follows from g3(M_t) = 1.1666 of eq. (60).
  close((g3 * g3) / (4 * Math.PI), 0.1083, 2e-4, "alpha_s(m_t)");
  close(g2, 0.64779, 0.01 * 0.64779, "g2(m_t)");
  close(g1 / GUT, 0.3583, 0.01 * 0.3583, "gY(m_t)");
});

test("lambda decreases monotonically from 1e3 to 1e10 GeV for the central inputs", () => {
  const run = runFromInputs({ mt: PDG.mt.value, mH: PDG.mH.value, alphaS: PDG.alphaS.value });
  let previous = Infinity, seen = 0;
  run.t.forEach((t, i) => {
    const mu = Math.exp(t);
    if (mu < 1e3 || mu > 1e10) return;
    assert.ok(run.states[i][0] < previous, `lambda rose at mu = ${mu}`);
    previous = run.states[i][0];
    seen += 1;
  });
  assert.ok(seen > 100);
});

test("central inputs: lambda crosses zero, near 1e9 GeV at two loops and well below it at one loop (truncation, D-070)", () => {
  const central = { mt: PDG.mt.value, mH: PDG.mH.value, alphaS: PDG.alphaS.value };
  const two = instabilityScale(runFromInputs(central, { loops: 2 }));
  const one = instabilityScale(runFromInputs(central, { loops: 1 }));
  assert.ok(two > 1e8 && two < 1e11, `two-loop mu_inst = ${two}`);
  assert.ok(one > 1e6 && one < two, `one-loop mu_inst = ${one}`);
});

test("the measured point is metastable: lambda < 0 below M_Pl but the decay probability over the age of the universe is tiny", () => {
  const run = runFromInputs({ mt: PDG.mt.value, mH: PDG.mH.value, alphaS: PDG.alphaS.value });
  const decay = vacuumDecay(run);
  assert.ok(decay.lambdaMin < 0);
  assert.ok(decay.log10Probability < -100, `log10 p0 = ${decay.log10Probability}`);
  assert.equal(stabilityRegion(PDG.mt.value, PDG.mH.value), "metastable");
});

test("a light top is absolutely stable and a heavy top is unstable (decay probability >= 1)", () => {
  assert.equal(stabilityRegion(160, PDG.mH.value), "stable");
  assert.equal(stabilityRegion(190, PDG.mH.value), "unstable");
});

test("the boundaries rise with m_H, and the stable-metastable line lies below the metastable-unstable line", () => {
  const b = stabilityBoundaries({ mHValues: [122, 124, 126, 128], mtRange: [150, 200] });
  assert.equal(b.mH.length, 4);
  for (let i = 1; i < 4; i++) {
    assert.ok(b.stable[i] >= b.stable[i - 1], "heavier Higgs tolerates a heavier top");
    assert.ok(b.unstable[i] >= b.unstable[i - 1]);
  }
  b.mH.forEach((_, i) => assert.ok(b.stable[i] < b.unstable[i]));
});

test("the 1-sigma band in m_t and alpha_s encloses the central curve", () => {
  const band = lambdaBand({ mt: PDG.mt, mH: PDG.mH.value, alphaS: PDG.alphaS });
  const central = runFromInputs({ mt: PDG.mt.value, mH: PDG.mH.value, alphaS: PDG.alphaS.value });
  assert.equal(band.lower.length, central.t.length);
  central.states.forEach((s, i) => {
    assert.ok(band.lower[i] <= s[0] + 1e-12 && s[0] <= band.upper[i] + 1e-12, `index ${i}`);
  });
  assert.ok(band.upper.at(-1) > band.lower.at(-1));
});

test("Formula Core: the reduced potential and the tree quartic evaluate to the textbook numbers and are GPU safe", async () => {
  const { library } = await import("../js/formula/library/index.mjs");
  const V = library.higgsPotentialReduced, lambda = library.higgsQuarticTree;
  assert.equal(V.evaluate({ x: 1, s: 1 }), -0.25);
  assert.equal(V.evaluate({ x: 0, s: 1 }), 0);
  close(V.evaluate({ x: 1.3, s: -1 }), reducedPotential(1.3, -1), 1e-15);
  close(lambda.evaluate({ mH: 125.20, v: 246.220 }), 0.12928, 5e-6, "tree quartic");
  assert.equal(V.gpuSafe().ok, true);
  assert.equal(lambda.gpuSafe().ok, true);
  assert.equal(V.status, "established");
  assert.ok(V.references.every((r) => r.doi || r.arxiv || r.url));
});
