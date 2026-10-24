// Running of the Standard Model couplings from m_t to the Planck mass, and what it says about the Higgs vacuum (S13).
//
// State: [lambda, y_t, g1, g2, g3] in the MS-bar scheme, with g1 in GUT normalisation (g1^2 = 5/3 g_Y^2) as in
// Buttazzo et al., JHEP 12 (2013) 089, arXiv:1307.3536, Appendix B (eq. 96-101). The potential is V = lambda |H|^4 + ...
// Those equations are written for d / d ln(mu^2); beta below is d / d ln(mu), i.e. t = ln mu, so the right-hand side for
// lambda is doubled and, for a coupling with d g^2 / d ln mu^2 = A, d g / d t = A / g.
//
// Truncation, stated: the bottom and tau Yukawa couplings are dropped (their terms are below 1e-3 of the y_t terms), the
// loop order is 1 or 2 (the paper's three-loop terms are left out), and the starting values at mu = m_t are a leading-order
// matching, not the paper's two-loop thresholds (matchAtTop). The two-loop coefficients were checked by integrating the
// paper's own couplings at M_t to M_Pl and comparing with its eq. (61); test/higgs.test.mjs does this.

import { rk4Step } from "./integrators.mjs";
import { G, C, HBAR } from "./constants.mjs";
import { PDG } from "./data/pdg.mjs";
import { vevFromFermi, quarticFromMass } from "./higgs.mjs";

export const TOP_SCALE_STEP = 0.05;
export const LOOPS = Object.freeze([1, 2]);
const K = 1 / (16 * Math.PI * Math.PI);
const GUT = Math.sqrt(5 / 3);
const B_G1 = 41 / 10, B_GY = 41 / 6, B_G2 = -19 / 6, B_G3 = -7;
const NF_BELOW_TOP = 5;
const B0_QCD_5 = 11 - (2 * NF_BELOW_TOP) / 3;
const JOULE_PER_GEV = 1.602176634e-10;
const HBAR_GEV_S = HBAR / JOULE_PER_GEV;
const MPC_M = 3.0856775814913673e22;
const H0_KM_S_MPC = 67.4; // Planck 2018 VI, TT,TE,EE+lowE+lensing; Buttazzo et al. use the same value
const DECAY_PREFACTOR = 0.15; // eq. (83): p0 = 0.15 (Lambda_B / H0)^4 exp(-S)

/** M_Pl = sqrt(hbar c / G) in GeV, derived from the SI constants (1.2209e19 GeV; the plan's 1.22e19 is its rounding). */
export const PLANCK_MASS_GEV = (Math.sqrt((HBAR * C) / G) * C * C) / JOULE_PER_GEV;
/** H0 = 67.4 km/s/Mpc as an energy, hbar H0 in GeV. */
export const HUBBLE_GEV = ((H0_KM_S_MPC * 1e3) / MPC_M) * HBAR_GEV_S;

const need = (ok, message) => { if (!ok) throw new RangeError(`higgs-running: ${message}`); };

/**
 * d [lambda, y_t, g1, g2, g3] / d ln mu at one or two loops (Buttazzo et al. eq. 96-99, 101 with y_b = y_tau = 0).
 */
export function betaFunctions(state, loops = 2) {
  need(LOOPS.includes(loops), `loops must be 1 or 2, got ${loops}`);
  const [l, yt, g1, g2, g3] = state;
  const s1 = g1 * g1, s2 = g2 * g2, s3 = g3 * g3, y2 = yt * yt;
  const two = loops === 2;
  const k2 = K * K;
  // d g_i^2 / d ln mu^2 = g_i^4 (b_i K + K^2 (...))
  const A1 = s1 * s1 * (B_G1 * K + (two ? k2 * (44 * s3 / 5 + 27 * s2 / 10 + 199 * s1 / 50 - 17 * y2 / 10) : 0));
  const A2 = s2 * s2 * (B_G2 * K + (two ? k2 * (12 * s3 + 35 * s2 / 6 + 9 * s1 / 10 - 3 * y2 / 2) : 0));
  const A3 = s3 * s3 * (B_G3 * K + (two ? k2 * (-26 * s3 + 9 * s2 / 2 + 11 * s1 / 10 - 2 * y2) : 0));
  // d y_t^2 / d ln mu^2 = y_t^2 (...)
  let B = K * (9 * y2 / 2 - 8 * s3 - 9 * s2 / 4 - 17 * s1 / 20);
  if (two) {
    B += k2 * (y2 * (-12 * y2 - 12 * l + 36 * s3 + 225 * s2 / 16 + 393 * s1 / 80)
      + 6 * l * l - 108 * s3 * s3 - 23 * s2 * s2 / 4 + 1187 * s1 * s1 / 600
      + 9 * s3 * s2 + 19 * s3 * s1 / 15 - 9 * s2 * s1 / 20);
  }
  // d lambda / d ln mu^2
  let L = K * (l * (12 * l + 6 * y2 - 9 * s2 / 2 - 9 * s1 / 10) - 3 * y2 * y2 + 9 * s2 * s2 / 16 + 27 * s1 * s1 / 400 + 9 * s2 * s1 / 40);
  if (two) {
    L += k2 * (l * l * (-156 * l - 72 * y2 + 54 * s2 + 54 * s1 / 5)
      + l * y2 * (-3 * y2 / 2 + 40 * s3 + 45 * s2 / 4 + 17 * s1 / 4)
      + l * (-73 * s2 * s2 / 16 + 1887 * s1 * s1 / 400 + 117 * s2 * s1 / 40)
      + y2 * y2 * (15 * y2 - 16 * s3 - 4 * s1 / 5)
      + y2 * (-9 * s2 * s2 / 8 - 171 * s1 * s1 / 200 + 63 * s2 * s1 / 20)
      + 305 * s2 * s2 * s2 / 32 - 3411 * s1 * s1 * s1 / 4000 - 289 * s2 * s2 * s1 / 160 - 1677 * s2 * s1 * s1 / 800);
  }
  return [2 * L, yt === 0 ? 0 : (y2 * B) / yt, g1 === 0 ? 0 : A1 / g1, g2 === 0 ? 0 : A2 / g2, g3 === 0 ? 0 : A3 / g3];
}

/**
 * The couplings at mu = m_t from the inputs, at leading order, every ingredient stated:
 *   v          = (sqrt2 G_F)^(-1/2)
 *   lambda     = m_H^2 / 2 v^2                              (tree level)
 *   y_t        = sqrt2 m_t / v (1 - 4 alpha_s(m_t) / 3 pi)   (tree level plus the leading QCD correction to the MS-bar mass)
 *   g2, g_Y    from g_Z = 2 M_Z / v and the MS-bar angle: g2 = g_Z cos, g_Y = g_Z sin, at M_Z, then run to m_t with the
 *              one-loop equations (Standard Model coefficients; the top threshold between M_Z and m_t changes g by 0.1 percent)
 *   alpha_s    run from M_Z to m_t at one loop with five flavours
 */
export function matchAtTop({ mt, mH, alphaS }, data = PDG) {
  need(mt > data.MZ.value, "m_t must exceed M_Z");
  const v = vevFromFermi(data.GF.value);
  const alphaSTop = 1 / (1 / alphaS + (B0_QCD_5 / (2 * Math.PI)) * Math.log(mt / data.MZ.value));
  const yt = ((Math.SQRT2 * mt) / v) * (1 - (4 * alphaSTop) / (3 * Math.PI));
  const gZ = (2 * data.MZ.value) / v;
  const s2w = data.sin2ThetaW.value;
  const span = Math.log(mt / data.MZ.value);
  const g2 = 1 / Math.sqrt(1 / (gZ * gZ * (1 - s2w)) - 2 * B_G2 * K * span);
  const gY = 1 / Math.sqrt(1 / (gZ * gZ * s2w) - 2 * B_GY * K * span);
  return [quarticFromMass(mH, v), yt, GUT * gY, g2, Math.sqrt(4 * Math.PI * alphaSTop)];
}

/**
 * RK4 at a fixed step in t = ln mu (the step is the largest of the form span / n that does not exceed `step`).
 * @returns {{ t: number[], states: number[][], loops: number }}
 */
export function runCouplings(initial, { tStart, tEnd, step = TOP_SCALE_STEP, loops = 2 } = {}) {
  need(Array.isArray(initial) && initial.length === 5, "initial must be [lambda, y_t, g1, g2, g3]");
  need(tEnd > tStart && step > 0, "tEnd must exceed tStart and the step be positive");
  const count = Math.ceil((tEnd - tStart) / step - 1e-9);
  const h = (tEnd - tStart) / count;
  const rhs = (state) => betaFunctions(state, loops);
  const t = new Array(count + 1), states = new Array(count + 1);
  t[0] = tStart;
  states[0] = initial.slice();
  for (let i = 0; i < count; i += 1) {
    states[i + 1] = rk4Step(rhs, states[i], h);
    t[i + 1] = tStart + (i + 1) * h;
  }
  return { t, states, loops };
}

/** Matching at m_t, then the run to M_Pl. */
export function runFromInputs({ mt, mH, alphaS }, { loops = 2, data = PDG } = {}) {
  return runCouplings(matchAtTop({ mt, mH, alphaS }, data), { tStart: Math.log(mt), tEnd: Math.log(PLANCK_MASS_GEV), loops });
}

/** The scale in GeV where lambda first crosses zero (linear interpolation in ln mu), or null. */
export function instabilityScale(run) {
  for (let i = 1; i < run.t.length; i += 1) {
    const a = run.states[i - 1][0], b = run.states[i][0];
    if (a >= 0 && b < 0) return Math.exp(run.t[i - 1] + ((run.t[i] - run.t[i - 1]) * a) / (a - b));
  }
  return null;
}

/**
 * Tunnelling out of the electroweak vacuum (Buttazzo et al. eq. 80-83): the bounce action is S = 8 pi^2 / 3 |lambda(Lambda_B)|
 * at the scale Lambda_B where lambda is smallest (beta_lambda = 0, or M_Pl if lambda is still falling there), and the
 * probability that a bubble formed in our past light cone is p0 = 0.15 (Lambda_B / H0)^4 exp(-S). Gravitational corrections
 * are neglected, as they are for Lambda_B well below M_Pl. log10 is returned because p0 underflows a double.
 */
export function vacuumDecay(run) {
  let index = 0;
  run.states.forEach((s, i) => { if (s[0] < run.states[index][0]) index = i; });
  const lambdaMin = run.states[index][0];
  const scaleGeV = Math.exp(run.t[index]);
  if (lambdaMin >= 0) return { lambdaMin, scaleGeV, action: Infinity, log10Probability: -Infinity, absolutelyStable: true };
  const action = (8 * Math.PI * Math.PI) / (3 * -lambdaMin);
  const log10Probability = Math.log10(DECAY_PREFACTOR) + 4 * Math.log10(scaleGeV / HUBBLE_GEV) - action / Math.LN10;
  return { lambdaMin, scaleGeV, action, log10Probability, absolutelyStable: false };
}

/** "stable" (lambda >= 0 up to M_Pl), "metastable" (decay probability below 1) or "unstable", from a vacuumDecay result. */
export function regionOf(decay) {
  if (decay.absolutelyStable) return "stable";
  return decay.log10Probability < 0 ? "metastable" : "unstable";
}

export function stabilityRegion(mt, mH, { alphaS = PDG.alphaS.value, loops = 2 } = {}) {
  return regionOf(vacuumDecay(runFromInputs({ mt, mH, alphaS }, { loops })));
}

const BISECTION_STEPS = 12;

/** The largest m_t in `range` for which `inside(mt)` holds, assuming it holds below a threshold; the range ends clamp. */
function thresholdMt(inside, [low, high]) {
  if (!inside(low)) return low;
  if (inside(high)) return high;
  let lo = low, hi = high;
  for (let i = 0; i < BISECTION_STEPS; i += 1) {
    const mid = (lo + hi) / 2;
    if (inside(mid)) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** For each m_H: the m_t below which the vacuum is absolutely stable (`stable`) and the m_t below which it is not unstable (`unstable`). */
export function stabilityBoundaries({ mHValues, mtRange, alphaS = PDG.alphaS.value, loops = 2 }) {
  const decayAt = (mt, mH) => vacuumDecay(runFromInputs({ mt, mH, alphaS }, { loops }));
  const stable = mHValues.map((mH) => thresholdMt((mt) => decayAt(mt, mH).absolutelyStable, mtRange));
  const unstable = mHValues.map((mH) => thresholdMt((mt) => decayAt(mt, mH).log10Probability < 0, mtRange));
  return { mH: mHValues.slice(), stable, unstable };
}

const valueAt = (run, t) => {
  const { t: grid, states } = run;
  if (t <= grid[0]) return states[0][0];
  if (t >= grid[grid.length - 1]) return states[states.length - 1][0];
  const i = Math.min(grid.length - 2, Math.floor((t - grid[0]) / (grid[1] - grid[0])));
  const f = (t - grid[i]) / (grid[i + 1] - grid[i]);
  return states[i][0] * (1 - f) + states[i + 1][0] * f;
};

/** lambda(mu) envelope over the four corners (m_t +- sigma, alpha_s +- sigma), sampled on the central run's grid. */
export function lambdaBand({ mt, mH, alphaS }, { loops = 2 } = {}) {
  const central = runFromInputs({ mt: mt.value, mH, alphaS: alphaS.value }, { loops });
  const corners = [-1, 1].flatMap((dm) => [-1, 1].map((da) => runFromInputs(
    { mt: mt.value + dm * mt.uncertainty, mH, alphaS: alphaS.value + da * alphaS.uncertainty }, { loops })));
  const lower = [], upper = [];
  central.t.forEach((t, i) => {
    const values = [central.states[i][0], ...corners.map((run) => valueAt(run, t))];
    lower.push(Math.min(...values));
    upper.push(Math.max(...values));
  });
  return { t: central.t, lower, upper };
}
