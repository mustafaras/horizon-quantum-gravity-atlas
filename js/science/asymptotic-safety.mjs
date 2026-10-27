/**
 * The Einstein-Hilbert truncation of asymptotic safety (S18): the flow of the dimensionless Newton coupling g and cosmological constant lambda.
 *
 * Source of the equations (read from the arXiv PDFs, ledger D-105):
 *
 * Reuter & Saueressig, "Quantum Einstein Gravity", New J. Phys. 14 (2012) 055022, arXiv:1202.2274, section 4:
 *   (4.14)  lambda_k = k^-2 lambda-bar_k,   g_k = k^(d-2) G_k
 *   (4.15)  d_t g = beta_g(g, lambda),   d_t lambda = beta_lambda(g, lambda),   t = ln k
 *   (4.16)  beta_lambda = (eta_N - 2) lambda + (1/2) (4 pi)^(1-d/2) g
 *             x [ 2d(d+1) Phi^1_{d/2}(-2 lambda) - 8d Phi^1_{d/2}(0) - d(d+1) eta_N Phi~^1_{d/2}(-2 lambda) ],
 *           beta_g = (d - 2 + eta_N) g
 *   (4.17)  eta_N = g B1(lambda) / (1 - g B2(lambda))
 *   (4.18)  B1 = (1/3) (4 pi)^(1-d/2) [ d(d+1) Phi^1_{d/2-1}(-2 lambda) - 6d(d-1) Phi^2_{d/2}(-2 lambda) - 4d Phi^1_{d/2-1}(0) - 24 Phi^2_{d/2}(0) ],
 *           B2 = -(1/6) (4 pi)^(1-d/2) [ d(d+1) Phi~^1_{d/2-1}(-2 lambda) - 6d(d-1) Phi~^2_{d/2}(-2 lambda) ]
 *   (4.19)  Phi^p_n(w) = (1/Gamma(n)) int dz z^(n-1) [R0 - z R0'] / [z + R0 + w]^p,   Phi~^p_n(w) = (1/Gamma(n)) int dz z^(n-1) R0 / [z + R0 + w]^p
 *   (4.20)  optimised cutoff R0(w) = (1 - w) theta(1 - w):  Phi^p_n(w) = (1/Gamma(n+1)) (1+w)^-p,   Phi~^p_n(w) = (1/Gamma(n+2)) (1+w)^-p
 * In d = 4, with u = 1 - 2 lambda and c = 1/(4 pi), the optimised cutoff gives the closed forms used below:
 *   B1 = (c/3) (20/u - 36/u^2 - 28),   B2 = -(c/6) (10/u - 12/u^2),
 *   beta_lambda = (eta - 2) lambda + (c/2) g (20/u - 16 - (10/3) eta/u).
 * Its fixed points are g* = 0.7073, lambda* = 0.1932 with critical exponents theta = 1.4753 +- 3.0432 i, the numbers the plan quotes.
 *
 * Litim, "Fixed points of quantum gravity", Phys. Rev. Lett. 92 (2004) 201301, arXiv:hep-th/0312114, eq. (3)-(5) (harmonic gauge, alpha -> infinity,
 * optimised cutoff, d dimensions, with the numerical factor c_d absorbed into g):
 *   (4)  beta_lambda = P1 / (P2 + 4(d+2) g),   beta_g = (d - 2 + eta) g = (d-2) g P2 / (P2 + 4(d+2) g)
 *        P1 = -16 lambda^3 + 4 lambda^2 (4 - 10 d g - 3 d^2 g + d^3 g) + 4 lambda (10 d g + d^2 g - d^3 g - 1) + d(2+d)(d - 16 g + 8 d g - 3) g
 *        P2 = 8 (lambda^2 - lambda - d g) + 2
 *   (5)  eta = (d-2)(d+2) g / ((d-2) g - 2 (lambda - 1/2)^2)
 * In d = 4 its exponents are theta = (5 +- i sqrt(167))/3 = 1.667 +- 4.308 i (his eq. (10)), which differ from the first system's: the two come from
 * different gauges and treatments of the regulator, which is the scheme dependence the lab states. The plan's 1.475 +- 3.043 i belongs to the first one.
 *
 * Trajectory types (Reuter & Weyer; Reuter & Saueressig section 5.1): Type Ia runs to negative lambda in the infrared, Type IIIa to positive lambda and
 * ends at the singular line lambda = 1/2 at a finite scale k_term, and the single Type IIa trajectory, the separatrix, runs into the Gaussian fixed point.
 *
 * Status: conjectural framework. The truncation (two couplings of the infinite tower) and the cutoff scheme change the numbers (g*, lambda* and the
 * exponents) while the structure of the phase portrait stays.
 */

import { rk4Step } from "./integrators.mjs";

export const D = 4;
export const SCHEMES = Object.freeze(["optimised", "litim2004"]);
export const SINGULAR_LAMBDA = 0.5;
export const DOMAIN = Object.freeze({ g: Object.freeze([-0.2, 1.2]), lambda: Object.freeze([-0.4, 0.49]) });

const C4 = 1 / (4 * Math.PI);
const NEWTON_TOLERANCE = 1e-13;
const NEWTON_MAX_ITERATIONS = 80;
const DERIVATIVE_STEP = 1e-5;
const SEPARATRIX_SEED = 1e-6;
const FIXED_POINT_RADIUS = 1e-4;
const SINGULAR_MARGIN = 1e-3;
const ETA_POLE_MARGIN = 1e-3;
const CANONICAL_LAMBDA = -1;
const SEPARATRIX_TOLERANCE = 3e-3;
const STEP = 0.01;
const SINGULAR_STEP_FRACTION = 0.05;
const MAX_STEPS = 40000;

const need = (ok, message, Kind = RangeError) => { if (!ok) throw new Kind(`asymptotic-safety: ${message}`); };
const checkScheme = (scheme) => need(SCHEMES.includes(scheme), `scheme is one of ${SCHEMES.join(", ")}, received ${scheme}`);
const finiteOrNaN = (x) => (Number.isFinite(x) ? x : NaN);

/* ---------- the optimised cutoff, d = 4 (Reuter and Saueressig eq. 4.15-4.20) ---------- */

function optimised(g, lambda) {
  if (!(lambda < SINGULAR_LAMBDA)) return { eta: NaN, bg: NaN, bl: NaN };
  const u = 1 - 2 * lambda;
  const B1 = (C4 / 3) * (20 / u - 36 / (u * u) - 28);
  const B2 = -(C4 / 6) * (10 / u - 12 / (u * u));
  const eta = finiteOrNaN((g * B1) / (1 - g * B2));
  const bl = finiteOrNaN((eta - 2) * lambda + 0.5 * C4 * g * (20 / u - 16 - (10 / 3) * eta / u));
  return { eta, bg: finiteOrNaN((2 + eta) * g), bl };
}

/* ---------- Litim 2004, eq. (4)-(5) in d = 4 ---------- */

function litim2004(g, lambda) {
  const d = D;
  const P1 = -16 * lambda ** 3 + 4 * lambda ** 2 * (4 - 10 * d * g - 3 * d * d * g + d ** 3 * g)
    + 4 * lambda * (10 * d * g + d * d * g - d ** 3 * g - 1) + d * (2 + d) * (d - 16 * g + 8 * d * g - 3) * g;
  const P2 = 8 * (lambda * lambda - lambda - d * g) + 2;
  const denominator = P2 + 4 * (d + 2) * g;
  if (denominator === 0) return { eta: NaN, bg: NaN, bl: NaN };
  const eta = finiteOrNaN((d - 2) * (d + 2) * g / ((d - 2) * g - 2 * (lambda - 0.5) ** 2));
  return { eta, bg: finiteOrNaN(((d - 2) * g * P2) / denominator), bl: finiteOrNaN(P1 / denominator) };
}

const SYSTEMS = { optimised, litim2004 };

/** 1 - g B2(lambda) of eq. (4.17): zero on the boundary where eta_N diverges (Litim's g_bound); optimised cutoff only. */
function etaDenominator(g, lambda) {
  const u = 1 - 2 * lambda;
  return 1 + g * (C4 / 6) * (10 / u - 12 / (u * u));
}

/** The boundary curve g_bound(lambda) = 1 / B2(lambda) where eta_N diverges (optimised cutoff); NaN at or beyond lambda = 1/2, or where B2 <= 0. */
export function etaPoleG(lambda) {
  if (!(lambda < SINGULAR_LAMBDA)) return NaN;
  const u = 1 - 2 * lambda;
  const B2 = -(C4 / 6) * (10 / u - 12 / (u * u));
  return B2 > 0 ? 1 / B2 : NaN;
}

/** [beta_g, beta_lambda]; NaN where the truncation is singular (lambda >= 1/2 for the optimised cutoff, 1/eta = 0 for Litim's). */
export function betaFunctions(g, lambda, scheme = "optimised") {
  checkScheme(scheme);
  const { bg, bl } = SYSTEMS[scheme](g, lambda);
  return [bg, bl];
}

/** The anomalous dimension eta_N of Newton's constant: beta_g = (2 + eta_N) g. */
export function anomalousDimension(g, lambda, scheme = "optimised") {
  checkScheme(scheme);
  return SYSTEMS[scheme](g, lambda).eta;
}

/* ---------- stability matrix, exponents, fixed points ---------- */

/** M = [[d beta_g/dg, d beta_g/dlambda], [d beta_lambda/dg, d beta_lambda/dlambda]] by the five-point central difference. */
export function stabilityMatrix(g, lambda, scheme = "optimised") {
  const h = DERIVATIVE_STEP;
  const f = (x, y) => betaFunctions(x, y, scheme);
  const d = (shift) => {
    const at = (s) => (shift === "g" ? f(g + s, lambda) : f(g, lambda + s));
    const [m2, m1, p1, p2] = [at(-2 * h), at(-h), at(h), at(2 * h)];
    return [0, 1].map((k) => (8 * (p1[k] - m1[k]) - (p2[k] - m2[k])) / (12 * h));
  };
  const dg = d("g"), dl = d("lambda");
  return [[dg[0], dl[0]], [dg[1], dl[1]]];
}

/** Eigenvalues of a real 2 x 2 matrix as { re, im } pairs (a complex conjugate pair has im of opposite sign). */
export function eigenvalues2(M) {
  const trace = M[0][0] + M[1][1], det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  const discriminant = (trace * trace) / 4 - det;
  if (discriminant >= 0) {
    const root = Math.sqrt(discriminant);
    return [{ re: trace / 2 + root, im: 0 }, { re: trace / 2 - root, im: 0 }];
  }
  const root = Math.sqrt(-discriminant);
  return [{ re: trace / 2, im: root }, { re: trace / 2, im: -root }];
}

/** theta_I = minus the eigenvalues of the stability matrix (Reuter and Saueressig section 2): theta with Re theta > 0 is UV attractive. */
export function criticalExponents(M) {
  return eigenvalues2(M).map(({ re, im }) => ({ re: -re, im: -im }));
}

function newton(start, scheme) {
  let [g, lambda] = start;
  for (let i = 0; i < NEWTON_MAX_ITERATIONS; i++) {
    const F = betaFunctions(g, lambda, scheme);
    if (!F.every(Number.isFinite)) return null;
    if (Math.hypot(F[0], F[1]) < NEWTON_TOLERANCE) return [g, lambda];
    const M = stabilityMatrix(g, lambda, scheme);
    const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
    if (!Number.isFinite(det) || Math.abs(det) < 1e-14) return null;
    g -= (M[1][1] * F[0] - M[0][1] * F[1]) / det;
    lambda -= (-M[1][0] * F[0] + M[0][0] * F[1]) / det;
  }
  return null;
}

/**
 * Every fixed point with g >= 0 and lambda below the singular line, found by Newton iteration from a grid of starts, Gaussian one first.
 * Each carries its stability matrix and exponents.
 */
export function fixedPoints({ scheme = "optimised" } = {}) {
  checkScheme(scheme);
  const found = [];
  for (let i = 0; i <= 12; i++) {
    for (let j = 0; j <= 17; j++) {
      const root = newton([0.1 * i, -0.4 + 0.05 * j], scheme);
      if (!root || root[0] < -1e-9 || !(root[1] < SINGULAR_LAMBDA)) continue;
      const gaussian = Math.hypot(root[0], root[1]) < 1e-9;
      const point = gaussian ? [0, 0] : root;
      if (found.some((p) => Math.hypot(p.g - point[0], p.lambda - point[1]) < 1e-6)) continue;
      const matrix = stabilityMatrix(point[0], point[1], scheme);
      found.push({ g: point[0], lambda: point[1], gaussian, matrix, exponents: criticalExponents(matrix) });
    }
  }
  return found.sort((a, b) => Number(b.gaussian) - Number(a.gaussian) || a.g - b.g);
}

/* ---------- integration, separatrix, classification ---------- */

/**
 * Integrate the flow by RK4 in t = ln k from (g0, lambda0); direction +1 runs to the ultraviolet, -1 to the infrared.
 * The step shrinks near the singular line so the step never jumps over it. Stops, and says why:
 *   "fixed-point"       within 1e-4 of the non-Gaussian fixed point
 *   "singular-line"     within 1e-3 of lambda = 1/2 (Type IIIa ends here at a finite scale)
 *   "eta-pole"          within 1e-3 of the boundary 1 - g B2 = 0 where eta_N diverges (Litim's g_bound); also Type IIIa, the truncation breaks down
 *   "canonical-scaling" lambda below -1: the canonical regime, g -> 0 (Type Ia)
 *   "non-finite", "step-limit"
 * Returns { points: [{ t, g, lambda }], terminated }.
 */
export function integrateFlow({ g0, lambda0, direction = -1, scheme = "optimised", h = STEP, maxSteps = MAX_STEPS } = {}) {
  need(Number.isFinite(g0) && Number.isFinite(lambda0), "g0 and lambda0 must be finite numbers", TypeError);
  checkScheme(scheme);
  const sign = direction >= 0 ? 1 : -1;
  const ngfp = fixedPoints({ scheme }).find((p) => !p.gaussian);
  const rhs = (state) => betaFunctions(state[0], state[1], scheme).map((v) => sign * v);
  let state = [g0, lambda0], t = 0;
  const points = [{ t, g: g0, lambda: lambda0 }];
  for (let step = 0; step < maxSteps; step++) {
    const slope = rhs(state);
    if (!slope.every(Number.isFinite)) return { points, terminated: "non-finite" };
    const toSingular = scheme === "optimised" ? SINGULAR_LAMBDA - state[1] : Infinity;
    let size = Math.min(h, (SINGULAR_STEP_FRACTION * toSingular) / Math.max(Math.abs(slope[1]), 1e-12));
    if (scheme === "optimised") {
      // the second boundary, 1 - g B2 = 0: slow down as the denominator closes on zero
      const den = etaDenominator(state[0], state[1]);
      const rate = (etaDenominator(state[0] + 1e-6 * slope[0], state[1] + 1e-6 * slope[1]) - den) / 1e-6;
      if (rate * den < 0) size = Math.min(size, (SINGULAR_STEP_FRACTION * Math.abs(den)) / Math.abs(rate));
    }
    let next;
    try { next = rk4Step(rhs, state, size); } catch { return { points, terminated: "non-finite" }; }
    if (!next.every(Number.isFinite)) return { points, terminated: "non-finite" };
    state = next; t += sign * size;
    points.push({ t, g: state[0], lambda: state[1] });
    if (scheme === "optimised" && SINGULAR_LAMBDA - state[1] < SINGULAR_MARGIN) return { points, terminated: "singular-line" };
    if (scheme === "optimised" && Math.abs(etaDenominator(state[0], state[1])) < ETA_POLE_MARGIN) return { points, terminated: "eta-pole" };
    if (state[1] < CANONICAL_LAMBDA) return { points, terminated: "canonical-scaling" };
    if (ngfp && Math.hypot(state[0] - ngfp.g, state[1] - ngfp.lambda) < FIXED_POINT_RADIUS) return { points, terminated: "fixed-point" };
  }
  return { points, terminated: "step-limit" };
}

const separatrixCache = new Map();

/**
 * The separatrix: the trajectory that leaves the Gaussian fixed point along the eigendirection of its UV-repulsive eigenvalue (+2) and runs to the
 * non-Gaussian fixed point, integrated toward the ultraviolet from 1e-6 away. Returns { points, terminated } like integrateFlow.
 */
export function separatrix({ scheme = "optimised" } = {}) {
  checkScheme(scheme);
  if (separatrixCache.has(scheme)) return separatrixCache.get(scheme);
  const M = stabilityMatrix(0, 0, scheme);
  const mu = eigenvalues2(M).map((v) => v.re).sort((a, b) => b - a)[0];
  const v = Math.abs(M[0][1]) > 1e-12 ? [M[0][1], mu - M[0][0]] : [mu - M[1][1], M[1][0]];
  const norm = Math.hypot(v[0], v[1]);
  const direction = v[0] < 0 ? -1 : 1; // the branch with g > 0
  const run = integrateFlow({ g0: (direction * SEPARATRIX_SEED * v[0]) / norm, lambda0: (direction * SEPARATRIX_SEED * v[1]) / norm, direction: 1, scheme });
  const result = Object.freeze({ points: Object.freeze(run.points), terminated: run.terminated });
  separatrixCache.set(scheme, result);
  return result;
}

function distanceToPolyline(g, lambda, points) {
  let best = Infinity;
  for (let k = 1; k < points.length; k++) {
    const [ax, ay, bx, by] = [points[k - 1].g, points[k - 1].lambda, points[k].g, points[k].lambda];
    const [dx, dy] = [bx - ax, by - ay];
    const s = Math.max(0, Math.min(1, ((g - ax) * dx + (lambda - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(g - (ax + s * dx), lambda - (ay + s * dy)));
  }
  return best;
}

/**
 * Classify the trajectory through (g0, lambda0) by its infrared fate. type: "Ia" (lambda < 0 in the IR), "IIIa" (lambda reaches 1/2 at a finite scale,
 * tTerm = t_term - t_start), "IIa" (on the separatrix, within 3e-3; points run down it to the Gaussian fixed point), "outside" (lambda >= 1/2 or
 * g <= 0, where the truncation is not defined or has no gravity) or "other". Returns { type, terminated, points, end, tTerm }.
 */
export function classifyTrajectory({ g0, lambda0, scheme = "optimised" } = {}) {
  need(Number.isFinite(g0) && Number.isFinite(lambda0), "g0 and lambda0 must be finite numbers", TypeError);
  checkScheme(scheme);
  if ((scheme === "optimised" && !(lambda0 < SINGULAR_LAMBDA)) || !(g0 > 0)) {
    return { type: "outside", terminated: "outside", points: [{ t: 0, g: g0, lambda: lambda0 }], end: { t: 0, g: g0, lambda: lambda0 }, tTerm: null };
  }
  const sep = separatrix({ scheme }).points;
  if (distanceToPolyline(g0, lambda0, sep) < SEPARATRIX_TOLERANCE) {
    let nearest = 0, best = Infinity;
    sep.forEach((p, k) => { const dist = Math.hypot(p.g - g0, p.lambda - lambda0); if (dist < best) { best = dist; nearest = k; } });
    const points = sep.slice(0, nearest + 1).reverse().map((p) => ({ t: p.t - sep[nearest].t, g: p.g, lambda: p.lambda }));
    return { type: "IIa", terminated: "gaussian-fixed-point", points, end: points[points.length - 1], tTerm: null };
  }
  const run = integrateFlow({ g0, lambda0, direction: -1, scheme });
  const end = run.points[run.points.length - 1];
  const breaksDown = run.terminated === "singular-line" || run.terminated === "eta-pole";
  const type = breaksDown ? "IIIa" : run.terminated === "canonical-scaling" ? "Ia" : "other";
  return { type, terminated: run.terminated, points: run.points, end, tTerm: breaksDown ? end.t : null };
}
