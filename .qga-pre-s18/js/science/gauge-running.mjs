/**
 * Running of the three Standard-Model gauge couplings, and their near-unification (S17).
 *
 * The couplings are the GUT-normalised alpha_1 = (5/3) alpha_Y, alpha_2 and alpha_3, run as inverses (the lines are straight at one loop):
 *
 *   d alpha_i^-1 / d t = - b_i / 2 pi - sum_j b_ij alpha_j / (8 pi^2),   t = ln mu,
 *
 * the second term only at two loops. Inputs are the PDG 2026 MS-bar values at M_Z; alpha_em^-1 is derived (data/gauge-couplings.mjs).
 *
 * Coefficients, each checked against a source that was read (ledger D-099):
 *   MSSM b_i and b_ij: Martin & Vaughn, PRD 50, 2282 (1994), eq. (4.4)-(4.5), arXiv:hep-ph/9311340.
 *   SM b_i and b_ij:   Buttazzo et al., JHEP 12 (2013) 089, appendix B.1, eq. (96)-(98) (the g^2 coefficients, Yukawas set to zero), arXiv:1307.3536.
 * Machacek & Vaughn, Nucl. Phys. B222 (1983) 83 is the original source of both; it is behind a paywall and was not read.
 *
 * Omitted, and said so wherever the result is shown: the Yukawa terms of the two-loop equations (an estimate from Buttazzo et al. eq. 96-98 with
 * y_t(M_Z) about 0.95 puts them at 5 to 10 percent of the two-loop term at M_Z, less above as y_t falls), the top threshold (all six quarks run
 * from M_Z, the usual approximation; decoupling the top from alpha_em at M_Z shifts alpha_em^-1 by about 0.18), and the matching of the
 * couplings at M_SUSY (they are continuous there; there is a single, sharp threshold with every superpartner at M_SUSY).
 */

import { PDG } from "./data/pdg.mjs";
import { ALPHA_EM_INVERSE_MZ } from "./data/gauge-couplings.mjs";
import { rk4Step } from "./integrators.mjs";

const TWO_PI = 2 * Math.PI;
const EIGHT_PI_SQUARED = 8 * Math.PI * Math.PI;
const GUT_NORMALISATION = 3 / 5; // alpha_1^-1 = (3/5) alpha_Y^-1
const SUBSTEP = 0.1; // largest RK4 step in t = ln mu; the right-hand side is smooth, the error is far below the 1e-6 the tests demand
const BAND_STEP = 0.01; // central-difference step of the uncertainty propagation, in units of the 1-sigma input uncertainty
const PAIRS = Object.freeze([Object.freeze([0, 1]), Object.freeze([0, 2]), Object.freeze([1, 2])]);

export const DEFAULT_M_SUSY_GEV = 1000;
export const DEFAULT_LOG10_MAX = 19;
export const DEFAULT_POINTS = 400;
export const GAUGE_MODELS = Object.freeze(["sm", "mssm"]);

const deepFreeze = (x) => { Object.values(x).forEach((v) => { if (v && typeof v === "object") deepFreeze(v); }); return Object.freeze(x); };

export const B_ONE_LOOP = deepFreeze({ sm: [41 / 10, -19 / 6, -7], mssm: [33 / 5, 1, -3] });
export const B_TWO_LOOP = deepFreeze({
  sm: [[199 / 50, 27 / 10, 44 / 5], [9 / 10, 35 / 6, 12], [11 / 10, 9 / 2, -26]],
  mssm: [[199 / 25, 27 / 5, 88 / 5], [9 / 5, 25, 24], [11 / 5, 9, 14]],
});

const need = (ok, message) => { if (!ok) throw new RangeError(`gauge-running: ${message}`); };

/** [alpha_1^-1, alpha_2^-1, alpha_3^-1] from alpha_em^-1, sin^2 theta_W and alpha_s at one scale. */
export function gutInverseCouplings({ alphaEmInverse, sin2ThetaW, alphaS }) {
  return [GUT_NORMALISATION * (1 - sin2ThetaW) * alphaEmInverse, sin2ThetaW * alphaEmInverse, 1 / alphaS];
}

/** The inverse couplings at M_Z from the shipped inputs (PDG 2026 and the derived alpha_em^-1), any of which can be overridden. */
export function inputsAtMZ({ alphaEmInverse = ALPHA_EM_INVERSE_MZ.value, sin2ThetaW = PDG.sin2ThetaW.value, alphaS = PDG.alphaS.value } = {}) {
  return gutInverseCouplings({ alphaEmInverse, sin2ThetaW, alphaS });
}

/** One-loop solution at t = ln(mu / M_Z): alpha_i^-1(mu) = alpha_i^-1(M_Z) - b_i t / 2 pi. */
export function oneLoopAnalytic(inverse0, b, t) {
  return inverse0.map((a, i) => a - (b[i] * t) / TWO_PI);
}

function checkOptions({ loops, model, mSusyGeV, points, log10Max }) {
  need(loops === 1 || loops === 2, `loops is 1 or 2, received ${loops}`);
  need(GAUGE_MODELS.includes(model), `model is one of ${GAUGE_MODELS.join(", ")}, received ${model}`);
  need(Number.isInteger(points) && points >= 2, `points is an integer of at least 2, received ${points}`);
  need(Number.isFinite(log10Max) && log10Max > Math.log10(PDG.MZ.value), `log10Max must exceed log10 M_Z, received ${log10Max}`);
  if (model === "mssm") need(Number.isFinite(mSusyGeV) && mSusyGeV > PDG.MZ.value, `M_SUSY must exceed M_Z (${PDG.MZ.value} GeV), received ${mSusyGeV}`);
}

const rhs = (y, { b, B, loops }) => y.map((_, i) => {
  let two = 0;
  if (loops === 2) for (let j = 0; j < 3; j++) two += B[i][j] / y[j];
  return -b[i] / TWO_PI - two / EIGHT_PI_SQUARED;
});

function advance(y, t0, t1, table) {
  const steps = Math.max(1, Math.ceil((t1 - t0) / SUBSTEP - 1e-12));
  const h = (t1 - t0) / steps;
  let state = y;
  for (let s = 0; s < steps; s++) state = rk4Step(rhs, state, h, table);
  return state;
}

/**
 * Run the three inverse couplings from M_Z up to 10^log10Max GeV on `points` equally spaced values of log10(mu/GeV).
 * model "mssm" uses the SM coefficients below `mSusyGeV` and the MSSM ones above it, continuous at the threshold.
 * Returns { log10Mu: number[], inv: [number[], number[], number[]] }.
 */
export function runGaugeCouplings({
  loops = 2, model = "sm", mSusyGeV = DEFAULT_M_SUSY_GEV, log10Max = DEFAULT_LOG10_MAX, points = DEFAULT_POINTS, inputs = inputsAtMZ(),
} = {}) {
  checkOptions({ loops, model, mSusyGeV, points, log10Max });
  const log10Z = Math.log10(PDG.MZ.value);
  const tSusy = model === "mssm" ? Math.LN10 * (Math.log10(mSusyGeV) - log10Z) : Infinity;
  const tables = {
    sm: { b: B_ONE_LOOP.sm, B: B_TWO_LOOP.sm, loops },
    mssm: { b: B_ONE_LOOP.mssm, B: B_TWO_LOOP.mssm, loops },
  };
  const log10Mu = Array.from({ length: points }, (_, k) => (k === points - 1 ? log10Max : log10Z + ((log10Max - log10Z) * k) / (points - 1)));
  const inv = [[inputs[0]], [inputs[1]], [inputs[2]]];
  let y = inputs, t = 0;
  for (let k = 1; k < points; k++) {
    const tNext = Math.LN10 * (log10Mu[k] - log10Z);
    if (t < tSusy && tSusy < tNext) { y = advance(y, t, tSusy, tables.sm); y = advance(y, tSusy, tNext, tables.mssm); }
    else y = advance(y, t, tNext, (t + tNext) / 2 > tSusy ? tables.mssm : tables.sm);
    t = tNext;
    for (let i = 0; i < 3; i++) inv[i].push(y[i]);
  }
  return { log10Mu, inv };
}

/** 1-sigma inputs at M_Z: [alpha_em^-1, sin^2 theta_W, alpha_s] with their uncertainties. */
function inputSigmas() {
  return [
    { value: ALPHA_EM_INVERSE_MZ.value, sigma: ALPHA_EM_INVERSE_MZ.uncertainty },
    { value: PDG.sin2ThetaW.value, sigma: PDG.sin2ThetaW.uncertainty },
    { value: PDG.alphaS.value, sigma: PDG.alphaS.uncertainty },
  ];
}

/**
 * The +-1 sigma band of the run: the three input uncertainties (alpha_em^-1, sin^2 theta_W, alpha_s), independent, propagated to every
 * scale by central differences of the run itself and added in quadrature. Returns { lower, upper } shaped like `inv` of the run.
 */
export function gaugeBand({ loops = 2, model = "sm", mSusyGeV = DEFAULT_M_SUSY_GEV, log10Max = DEFAULT_LOG10_MAX, points = DEFAULT_POINTS } = {}) {
  const options = { loops, model, mSusyGeV, log10Max, points };
  const central = runGaugeCouplings(options);
  const sigmas = inputSigmas();
  const variance = central.inv.map((line) => line.map(() => 0));
  sigmas.forEach((_, p) => {
    const at = (offset) => {
      const v = sigmas.map((s, q) => (q === p ? s.value + offset * s.sigma : s.value));
      return runGaugeCouplings({ ...options, inputs: gutInverseCouplings({ alphaEmInverse: v[0], sin2ThetaW: v[1], alphaS: v[2] }) });
    };
    const up = at(BAND_STEP), down = at(-BAND_STEP);
    for (let i = 0; i < 3; i++) for (let k = 0; k < points; k++) variance[i][k] += ((up.inv[i][k] - down.inv[i][k]) / (2 * BAND_STEP)) ** 2;
  });
  const half = variance.map((line) => line.map(Math.sqrt));
  return {
    lower: central.inv.map((line, i) => line.map((v, k) => v - half[i][k])),
    upper: central.inv.map((line, i) => line.map((v, k) => v + half[i][k])),
  };
}

/**
 * The triangle the three lines make in the (log10 mu, alpha^-1) plane: its vertices are the pairwise crossings (first sign change of the
 * difference, linearly interpolated between grid points), its area is in dex x alpha^-1. A pair that does not cross inside the run is
 * listed in `missing` and the area is null.
 */
export function unificationTriangle(run) {
  const vertices = [], missing = [];
  for (const [i, j] of PAIRS) {
    let found = null;
    for (let k = 1; k < run.log10Mu.length && !found; k++) {
      const d0 = run.inv[i][k - 1] - run.inv[j][k - 1], d1 = run.inv[i][k] - run.inv[j][k];
      if (d0 === 0 || d0 * d1 < 0 || d1 === 0) {
        const f = d0 === d1 ? 0 : d0 / (d0 - d1);
        found = { pair: [i, j], log10Mu: run.log10Mu[k - 1] + f * (run.log10Mu[k] - run.log10Mu[k - 1]), inv: run.inv[i][k - 1] + f * (run.inv[i][k] - run.inv[i][k - 1]) };
      }
    }
    if (found) vertices.push(found); else missing.push(`${i + 1}${j + 1}`);
  }
  if (missing.length) return { vertices, missing, area: null, centroid: null };
  const [a, b, c] = vertices;
  const area = Math.abs((b.log10Mu - a.log10Mu) * (c.inv - a.inv) - (c.log10Mu - a.log10Mu) * (b.inv - a.inv)) / 2;
  return { vertices, missing, area, centroid: [(a.log10Mu + b.log10Mu + c.log10Mu) / 3, (a.inv + b.inv + c.inv) / 3] };
}
