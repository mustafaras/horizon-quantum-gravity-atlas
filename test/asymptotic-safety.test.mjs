import test from "node:test";
import assert from "node:assert/strict";
import {
  SINGULAR_LAMBDA, betaFunctions, anomalousDimension, stabilityMatrix, eigenvalues2, criticalExponents, fixedPoints,
  separatrix, integrateFlow, classifyTrajectory, SCHEMES, etaPoleG,
} from "../js/science/asymptotic-safety.mjs";

const near = (actual, expected, tol, what) => assert.ok(Math.abs(actual - expected) <= tol, `${what}: ${actual} vs ${expected} (tol ${tol})`);

/* An independent implementation of Reuter & Saueressig, New J. Phys. 14 (2012) 055022, eq. (4.14)-(4.20) for general d and the optimised cutoff:
 * threshold functions Phi^p_n(w) = (1/Gamma(n+1)) (1+w)^-p and Phi~^p_n(w) = (1/Gamma(n+2)) (1+w)^-p. d = 4 only needs integer Gamma. */
const gamma = (z) => (z <= 1 ? 1 : (z - 1) * gamma(z - 1));
const phi = (p, n, w) => (1 / gamma(n + 1)) * (1 + w) ** -p;
const phiT = (p, n, w) => (1 / gamma(n + 2)) * (1 + w) ** -p;
function reference(g, lambda, d = 4) {
  const c = (4 * Math.PI) ** (1 - d / 2), h = d / 2;
  const B1 = (c / 3) * (d * (d + 1) * phi(1, h - 1, -2 * lambda) - 6 * d * (d - 1) * phi(2, h, -2 * lambda) - 4 * d * phi(1, h - 1, 0) - 24 * phi(2, h, 0));
  const B2 = -(c / 6) * (d * (d + 1) * phiT(1, h - 1, -2 * lambda) - 6 * d * (d - 1) * phiT(2, h, -2 * lambda));
  const eta = (g * B1) / (1 - g * B2);
  const bl = (eta - 2) * lambda + 0.5 * c * g * (2 * d * (d + 1) * phi(1, h, -2 * lambda) - 8 * d * phi(1, h, 0) - d * (d + 1) * eta * phiT(1, h, -2 * lambda));
  return { eta, bg: (d - 2 + eta) * g, bl };
}

test("the closed forms equal an independent implementation of eq. (4.15)-(4.20) with the optimised threshold functions to 1e-12", () => {
  for (let i = 0; i < 40; i++) {
    const g = 0.02 + 0.03 * i, lambda = -0.4 + 0.02 * i;
    const ref = reference(g, lambda);
    const [bg, bl] = betaFunctions(g, lambda);
    near(bg, ref.bg, 1e-12, `beta_g at (${g}, ${lambda})`);
    near(bl, ref.bl, 1e-12, `beta_lambda at (${g}, ${lambda})`);
    near(anomalousDimension(g, lambda), ref.eta, 1e-12, "eta_N");
  }
});

test("the flow is singular at lambda = 1/2 and reports it instead of a number", () => {
  assert.equal(SINGULAR_LAMBDA, 0.5);
  const [bg, bl] = betaFunctions(0.3, 0.5);
  assert.ok(Number.isNaN(bg) && Number.isNaN(bl));
  assert.ok(Number.isNaN(betaFunctions(0.3, 0.7)[0]));
  assert.ok(Number.isFinite(betaFunctions(0.3, 0.4999)[0]));
  assert.deepEqual(betaFunctions(0, 0), [0, 0]);
});

test("fixed points: the Gaussian one and the non-Gaussian one at g* = 0.707, lambda* = 0.193 with theta = 1.475 +- 3.043 i", () => {
  const points = fixedPoints();
  assert.equal(points.length, 2, "exactly two fixed points with g >= 0 and lambda < 1/2");
  const [gfp, ngfp] = points;
  assert.equal(gfp.gaussian, true);
  near(gfp.g, 0, 1e-12, "GFP g"); near(gfp.lambda, 0, 1e-12, "GFP lambda");
  assert.equal(ngfp.gaussian, false);
  near(ngfp.g, 0.707, 2e-3, "g*");
  near(ngfp.lambda, 0.193, 2e-3, "lambda*");
  near(ngfp.exponents[0].re, 1.475, 2e-3, "theta'");
  near(Math.abs(ngfp.exponents[0].im), 3.043, 2e-3, "theta''");
  near(ngfp.exponents[0].im, -ngfp.exponents[1].im, 1e-12, "complex conjugate pair");
  const [bg, bl] = betaFunctions(ngfp.g, ngfp.lambda);
  near(bg, 0, 1e-12, "beta_g at the NGFP"); near(bl, 0, 1e-12, "beta_lambda at the NGFP");
  near(anomalousDimension(ngfp.g, ngfp.lambda), -2, 1e-9, "eta* = -2 at a non-Gaussian fixed point (g > 0, beta_g = 0)");
  near(ngfp.g * ngfp.lambda, 0.1366, 1e-3, "g* lambda*, the scheme-independent product of RS section 5");
});

test("the Gaussian fixed point is a saddle with exponents -2 and +2", () => {
  const gfp = fixedPoints()[0];
  const values = eigenvalues2(stabilityMatrix(0, 0)).map((v) => v.re).sort((a, b) => a - b);
  near(values[0], -2, 1e-6, "eigenvalue -2"); near(values[1], 2, 1e-6, "eigenvalue +2");
  assert.deepEqual(gfp.exponents.map((e) => Math.round(e.re)).sort(), [-2, 2]);
  assert.deepEqual(criticalExponents([[2, 0], [0, -2]]).map((e) => e.re).sort(), [-2, 2]);
});

test("Litim 2004, eq. (4)-(5) with P1 and P2 in d = 4: the exponents are (5 +- i sqrt(167)) / 3, not the optimised-cutoff ones", () => {
  assert.deepEqual([...SCHEMES], ["optimised", "litim2004"]);
  const ngfp = fixedPoints({ scheme: "litim2004" }).find((p) => !p.gaussian);
  near(ngfp.exponents[0].re, 5 / 3, 2e-3, "theta'");
  near(Math.abs(ngfp.exponents[0].im), Math.sqrt(167) / 3, 2e-3, "theta''");
  near(anomalousDimension(ngfp.g, ngfp.lambda, "litim2004"), -2, 1e-9, "eta* = 2 - d");
  near(ngfp.g, (ngfp.lambda - 0.5) ** 2 / 4, 1e-9, "g* = (lambda* - 1/2)^2 / d (P2 = 0)");
  const [bg, bl] = betaFunctions(ngfp.g, ngfp.lambda, "litim2004");
  near(bg, 0, 1e-12, "beta_g"); near(bl, 0, 1e-12, "beta_lambda");
  assert.throws(() => betaFunctions(0.1, 0.1, "nope"), RangeError);
});

test("the separatrix leaves the Gaussian fixed point along its UV-repulsive eigendirection and ends at the NGFP", () => {
  const sep = separatrix();
  const ngfp = fixedPoints()[1];
  const first = sep.points[0], last = sep.points[sep.points.length - 1];
  assert.ok(first.g < 1e-4 && Math.abs(first.lambda) < 1e-4, "starts at the Gaussian fixed point");
  near(first.lambda / first.g, 0.159154943 / 4, 1e-6, "the slope is the eigenvector of the eigenvalue +2: c21 / 4 with c21 = 1 / 2 pi");
  near(last.g, ngfp.g, 1e-3, "ends at g*"); near(last.lambda, ngfp.lambda, 1e-3, "ends at lambda*");
  assert.equal(sep.terminated, "fixed-point");
  assert.ok(sep.points.every((p) => Number.isFinite(p.g) && p.lambda < SINGULAR_LAMBDA));
  for (let k = 1; k < sep.points.length; k++) assert.ok(sep.points[k].t > sep.points[k - 1].t, "t increases toward the UV");
});

test("trajectories are classified by the sign of lambda in the infrared and by whether lambda reaches 1/2 (Reuter and Weyer)", () => {
  const ngfp = fixedPoints()[1];
  const sep = separatrix().points;
  const start = sep[Math.floor(sep.length * 0.8)];
  const below = classifyTrajectory({ g0: start.g, lambda0: start.lambda - 0.01 });
  assert.equal(below.type, "Ia");
  assert.ok(below.end.lambda < 0, "Type Ia runs to negative lambda");
  const above = classifyTrajectory({ g0: start.g, lambda0: start.lambda + 0.01 });
  assert.equal(above.type, "IIIa");
  assert.ok(["singular-line", "eta-pole"].includes(above.terminated), "Type IIIa ends where the truncation breaks down");
  assert.ok(above.end.lambda > 0.3 && above.end.lambda < SINGULAR_LAMBDA, "at positive lambda, below the line lambda = 1/2");
  assert.ok(Number.isFinite(above.tTerm) && above.tTerm < 0, "at a finite scale below the start");
  // the breakdown boundary 1 - g B2 = 0 closes in on lambda = 1/2 as g -> 0, so only a start with a tiny g reaches the line itself
  const faint = classifyTrajectory({ g0: 1e-6, lambda0: 0.49 });
  assert.equal(faint.type, "IIIa");
  assert.equal(faint.terminated, "singular-line");
  near(etaPoleG(0.3), 1 / ((-(1 / (4 * Math.PI)) / 6) * (10 / 0.4 - 12 / 0.16)), 1e-12, "g_bound(lambda) = 1 / B2(lambda)");
  assert.ok(Number.isNaN(etaPoleG(0.5)), "no boundary at or beyond the singular line");
  near(1 - etaPoleG(0.3) * (-(1 / (4 * Math.PI)) / 6) * (10 / 0.4 - 12 / 0.16), 0, 1e-12, "1 - g B2 vanishes on the curve");
  const on = classifyTrajectory({ g0: start.g, lambda0: start.lambda });
  assert.equal(on.type, "IIa");
  near(on.end.g, 0, 1e-2, "the separatrix reaches the Gaussian fixed point in the infrared");
  const outside = classifyTrajectory({ g0: 0.3, lambda0: 0.52 });
  assert.equal(outside.type, "outside");
  assert.ok(ngfp.g > 0);
});

test("integrateFlow: both directions, a step cap, and a visible reason for every stop", () => {
  const ir = integrateFlow({ g0: 0.5, lambda0: 0.1, direction: -1 });
  const uv = integrateFlow({ g0: 0.5, lambda0: 0.1, direction: 1 });
  assert.ok(ir.points.at(-1).t < 0 && uv.points.at(-1).t > 0);
  assert.equal(uv.terminated, "fixed-point", "every trajectory with g > 0 runs into the NGFP toward the UV");
  near(uv.points.at(-1).g, 0.7073, 2e-3, "g*");
  // Not only lambda = 1/2: the optimised flow has a second boundary, 1 - g B2 = 0, where eta_N diverges (Litim's g_bound). A trajectory that reaches it
  // stops there, says so, and is still Type IIIa (lambda > 0 in the infrared).
  assert.equal(ir.terminated, "eta-pole");
  assert.ok(ir.points.at(-1).lambda > 0 && ir.points.every((p) => Number.isFinite(p.g)));
  const pole = classifyTrajectory({ g0: 0.5, lambda0: 0.1 });
  assert.equal(pole.type, "IIIa");
  assert.equal(pole.terminated, "eta-pole");
  assert.ok(pole.tTerm < 0);
  const capped = integrateFlow({ g0: 0.5, lambda0: 0.1, direction: 1, maxSteps: 10 });
  assert.equal(capped.terminated, "step-limit");
  assert.equal(capped.points.length, 11);
  assert.throws(() => integrateFlow({ g0: NaN, lambda0: 0 }), TypeError);
});
