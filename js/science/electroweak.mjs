// Tree-level electroweak scattering of massless fermions (S16): e+ e- -> mu+ mu- through gamma and Z exchange, and the QED processes
// Bhabha (e+ e- -> e+ e-), Moller (e- e- -> e- e-) and e- mu- -> e- mu-.
//
// Derivation of e+ e- -> f fbar. Write the Z coupling to a fermion f as (e / (sin th cos th)) gamma^mu (g_L P_L + g_R P_R) with
// g_L = T3 - Q sin^2 th, g_R = -Q sin^2 th, so that g_L,R = (g_V -+ g_A)/2 with
//   g_V = T3 - 2 Q sin^2 th,   g_A = T3.
// For helicities (i, j) of the incoming electron and the outgoing fermion the sum of the photon and Z diagrams is
//   A_ij(s) = Q_e Q_f + chi(s) (g_V^e -+ g_A^e)(g_V^f -+ g_A^f),   chi(s) = s / (s - M_Z^2 + i M_Z Gamma_Z) / (4 sin^2 th cos^2 th),
// and e-_L e+_R -> f_L fbar_R (and the same-handed RR) goes as (1 + cos th)^2, the opposite-handed pairs as (1 - cos th)^2, where th is the
// angle between the incoming e- and the outgoing f:
//   dsigma/dcos th = (pi alpha^2 / 8 s) N_c [ (|A_LL|^2 + |A_RR|^2)(1 + cos th)^2 + (|A_LR|^2 + |A_RL|^2)(1 - cos th)^2 ].
// Expanding the squares gives the form of the plan,
//   dsigma/dcos th = (pi alpha^2 / 2 s) N_c [ A0 (1 + cos^2 th) + A1 cos th ],
//   A0 = Q_e^2 Q_f^2 + 2 Q_e Q_f Re chi g_V^e g_V^f + |chi|^2 (g_V^e2 + g_A^e2)(g_V^f2 + g_A^f2),
//   A1 = 4 Q_e Q_f Re chi g_A^e g_A^f + 8 |chi|^2 g_V^e g_A^e g_V^f g_A^f,
// which for chi = 0 is the pure-QED result that Peskin & Schroeder treat in section 5.1 (the book was not re-read for this file; the test checks
// the limit): the integral over cos th is sigma = 4 pi alpha^2 / 3s.
// The electroweak review of the Review of Particle Physics (REF.PDG_2026, Eq. 10.7a and 10.7b, read 2026-10-26) defines the same couplings. The forward-backward asymmetry is
// A_FB = (sigma_F - sigma_B)/(sigma_F + sigma_B) = 3 A1 / (8 A0), and at the pole (Re chi = 0) it reduces to (3/4) A_e A_mu with
// A_f = 2 g_V g_A / (g_V^2 + g_A^2).
// The test file checks the closed form against the helicity sum above, which is an independent evaluation of the same amplitudes.
//
// Scope: tree level, massless fermions, constant alpha (the value of alpha(M_Z^2); the running below the Z is not modelled), a constant
// Z width, no initial-state radiation. The LEP numbers of js/science/data/electroweak.mjs are ISR-deconvoluted pole values, so they
// are compared with this line only at the pole.
//
// Bhabha, Moller and e mu: with massless fermions and t = -s sin^2(th/2), u = -s cos^2(th/2), the spin-averaged squared amplitudes are
//   Bhabha: 2 e^4 [ (s^2 + u^2)/t^2 + 2 u^2/(s t) + (t^2 + u^2)/s^2 ]   (t channel, s-t interference, s channel),
//   Moller: 2 e^4 [ (s^2 + u^2)/t^2 + 2 s^2/(t u) + (s^2 + t^2)/u^2 ]   (t channel, t-u interference, u channel),
//   e mu:   2 e^4 (s^2 + u^2)/t^2,
// and dsigma/dOmega = <|M|^2> / (64 pi^2 s). These were derived here from the helicity amplitudes (Bhabha: |M| = 2 e^2 u (1/s + 1/t)
// for LL -> LL, 2 e^2 t/s and 2 e^2 s/t for the other two nonzero ones) and were not copied from a source; test/electroweak.test.mjs
// checks that the angular form of the plan, this Mandelstam form and the forward Rutherford limit agree.

import { PDG } from "./data/pdg.mjs";

export const ALPHA_ZERO = 1 / 137.035999084;      // CODATA 2018, the zero-momentum fine-structure constant
export const ALPHA_MZ_INV = 128.945;               // 1/alpha at LEP/SLC energies, Phys. Rep. 427, section 1.2 (REF.LEP_SLC_2006)
export const GEV2_TO_NB = 0.3893793721e6;          // (hbar c)^2: 1 GeV^-2 in nb

export const ELECTRON = Object.freeze({ T3: -0.5, Q: -1 });
export const MUON = ELECTRON;

export const DEFAULT_PARAMS = Object.freeze({
  alpha: 1 / ALPHA_MZ_INV,
  sin2: PDG.sin2ThetaW.value,
  mZ: PDG.MZ.value,
  gammaZ: PDG.GammaZ.value,
});

const FORWARD_BACKWARD_FACTOR = 3 / 8;

export function couplings({ T3, Q }, sin2) {
  return { gV: T3 - 2 * Q * sin2, gA: T3 };
}

/** chi(s) as { re, im }. */
export function zPropagator(s, { sin2, mZ, gammaZ }) {
  const m2 = mZ * mZ;
  const re = s - m2, im = mZ * gammaZ;
  const norm = (s / (re * re + im * im)) / (4 * sin2 * (1 - sin2));
  return { re: re * norm, im: -im * norm };
}

export function qedCrossSection(sqrtS, alpha) {
  return ((4 * Math.PI * alpha * alpha) / (3 * sqrtS * sqrtS)) * GEV2_TO_NB;
}

function pieces(s, params) {
  const chi = zPropagator(s, params);
  const ge = couplings(ELECTRON, params.sin2), gf = couplings(MUON, params.sin2);
  const qq = ELECTRON.Q * MUON.Q;
  const chi2 = chi.re * chi.re + chi.im * chi.im;
  return {
    photon: { even: qq * qq, odd: 0 },
    z: {
      even: chi2 * (ge.gV ** 2 + ge.gA ** 2) * (gf.gV ** 2 + gf.gA ** 2),
      odd: 8 * chi2 * ge.gV * ge.gA * gf.gV * gf.gA,
    },
    interference: {
      even: 2 * qq * chi.re * ge.gV * gf.gV,
      odd: 4 * qq * chi.re * ge.gA * gf.gA,
    },
  };
}

const crossSectionUnit = (s, alpha) => ((Math.PI * alpha * alpha) / (2 * s)) * GEV2_TO_NB;

/** The photon, Z and interference parts of dsigma/dcos(theta) in nb, and their sum. */
export function channelTerms(sqrtS, cosTheta, params = DEFAULT_PARAMS) {
  const s = sqrtS * sqrtS;
  const unit = crossSectionUnit(s, params.alpha);
  const even = 1 + cosTheta * cosTheta;
  const p = pieces(s, params);
  const term = (part) => unit * (part.even * even + part.odd * cosTheta);
  const photon = term(p.photon), z = term(p.z), interference = term(p.interference);
  return { photon, z, interference, total: photon + z + interference };
}

export function angularCoefficients(sqrtS, params = DEFAULT_PARAMS) {
  const p = pieces(sqrtS * sqrtS, params);
  return { A0: p.photon.even + p.z.even + p.interference.even, A1: p.photon.odd + p.z.odd + p.interference.odd };
}

export function differentialCrossSection(sqrtS, cosTheta, params = DEFAULT_PARAMS) {
  return channelTerms(sqrtS, cosTheta, params).total;
}

/** sigma over the full angular range, nb: the integral of (1 + cos^2) is 8/3. */
export function totalCrossSection(sqrtS, params = DEFAULT_PARAMS) {
  const { A0 } = angularCoefficients(sqrtS, params);
  return crossSectionUnit(sqrtS * sqrtS, params.alpha) * A0 * (8 / 3);
}

export function forwardBackwardAsymmetry(sqrtS, params = DEFAULT_PARAMS) {
  const { A0, A1 } = angularCoefficients(sqrtS, params);
  return (FORWARD_BACKWARD_FACTOR * A1) / A0;
}

const BISECTION_STEPS = 80;

/** The energy in [lo, hi] where A_FB changes sign (bisection; the sign must differ at the ends). */
export function zeroCrossing(params = DEFAULT_PARAMS, { lo, hi }) {
  let a = lo, b = hi;
  const fa = forwardBackwardAsymmetry(a, params);
  if (fa * forwardBackwardAsymmetry(b, params) > 0) throw new RangeError(`A_FB has the same sign at ${lo} and ${hi} GeV`);
  for (let i = 0; i < BISECTION_STEPS; i++) {
    const mid = 0.5 * (a + b);
    if (forwardBackwardAsymmetry(mid, params) * fa > 0) a = mid; else b = mid;
  }
  return 0.5 * (a + b);
}

const PEAK_WINDOW = 5;
const GOLDEN = (Math.sqrt(5) - 1) / 2;

/** The energy of the maximum of sigma within PEAK_WINDOW GeV of M_Z (golden-section search). */
export function peakEnergy(params = DEFAULT_PARAMS) {
  let a = params.mZ - PEAK_WINDOW, b = params.mZ + PEAK_WINDOW;
  let c = b - GOLDEN * (b - a), d = a + GOLDEN * (b - a);
  for (let i = 0; i < BISECTION_STEPS; i++) {
    if (totalCrossSection(c, params) > totalCrossSection(d, params)) b = d; else a = c;
    c = b - GOLDEN * (b - a); d = a + GOLDEN * (b - a);
  }
  return 0.5 * (a + b);
}

export function crossSectionScan({ from, to, n, params = DEFAULT_PARAMS }) {
  const sqrtS = new Array(n), sigma = new Array(n), afb = new Array(n);
  for (let i = 0; i < n; i++) {
    sqrtS[i] = i === n - 1 ? to : from + ((to - from) * i) / (n - 1);
    sigma[i] = totalCrossSection(sqrtS[i], params);
    afb[i] = forwardBackwardAsymmetry(sqrtS[i], params);
  }
  return { sqrtS, sigma, afb };
}

/** Mandelstam t and u for massless 2 -> 2 scattering at angle theta. */
function tu(s, cosTheta) {
  return { t: -s * (1 - cosTheta) / 2, u: -s * (1 + cosTheta) / 2 };
}

const solidAngleUnit = (s, alpha) => ((alpha * alpha) / (2 * s)) * GEV2_TO_NB;

/** Bhabha dsigma/dOmega in nb/sr, split into the s-channel, t-channel and s-t interference terms. */
export function bhabhaTerms(sqrtS, cosTheta, alpha = ALPHA_ZERO) {
  const s = sqrtS * sqrtS, { t, u } = tu(s, cosTheta);
  const unit = solidAngleUnit(s, alpha);
  const sChannel = (unit * (t * t + u * u)) / (s * s);
  const tChannel = (unit * (s * s + u * u)) / (t * t);
  const interference = (unit * 2 * u * u) / (s * t);
  return { s: sChannel, t: tChannel, interference, total: sChannel + tChannel + interference };
}

/** Moller dsigma/dOmega in nb/sr: t channel, u channel and their interference. Identical particles: integrate over half the sphere. */
export function mollerTerms(sqrtS, cosTheta, alpha = ALPHA_ZERO) {
  const s = sqrtS * sqrtS, { t, u } = tu(s, cosTheta);
  const unit = solidAngleUnit(s, alpha);
  const tChannel = (unit * (s * s + u * u)) / (t * t);
  const uChannel = (unit * (s * s + t * t)) / (u * u);
  const interference = (unit * 2 * s * s) / (t * u);
  return { t: tChannel, u: uChannel, interference, total: tChannel + uChannel + interference };
}

export const CHANNEL_PROCESSES = Object.freeze(["s-channel", "bhabha", "moller", "t-channel"]);

/**
 * The thin lines of the amplitude room: the terms of the cross-section of a process and their sum, each with the TeX of its label.
 * e+e- -> mu+mu- (id "s-channel") splits into photon, Z and their interference (nb per unit cos theta); Bhabha into s, t and s-t
 * interference; Moller into t, u and t-u interference; e mu (id "t-channel") has the single t term (nb per steradian). Returns null for
 * a process without a split (Compton).
 */
export function channelDecomposition(processId, sqrtS, cosTheta, params = DEFAULT_PARAMS) {
  if (processId === "s-channel") {
    const t = channelTerms(sqrtS, cosTheta, params);
    return {
      terms: [{ id: "photon", tex: "|\\gamma|^2", value: t.photon }, { id: "z", tex: "|Z|^2", value: t.z }, { id: "interference", tex: "\\gamma Z\\ \\mathrm{interference}", value: t.interference }],
      total: t.total,
    };
  }
  if (processId === "bhabha") {
    const t = bhabhaTerms(sqrtS, cosTheta, ALPHA_ZERO);
    return {
      terms: [{ id: "s", tex: "s\\ \\mathrm{channel}", value: t.s }, { id: "t", tex: "t\\ \\mathrm{channel}", value: t.t }, { id: "interference", tex: "s\\text{-}t\\ \\mathrm{interference}", value: t.interference }],
      total: t.total,
    };
  }
  if (processId === "moller") {
    const t = mollerTerms(sqrtS, cosTheta, ALPHA_ZERO);
    return {
      terms: [{ id: "t", tex: "t\\ \\mathrm{channel}", value: t.t }, { id: "u", tex: "u\\ \\mathrm{channel}", value: t.u }, { id: "interference", tex: "t\\text{-}u\\ \\mathrm{interference}", value: t.interference }],
      total: t.total,
    };
  }
  if (processId === "t-channel") {
    const t = electronMuonTerms(sqrtS, cosTheta, ALPHA_ZERO);
    return { terms: [{ id: "t", tex: "t\\ \\mathrm{channel}", value: t.t }], total: t.total };
  }
  return null;
}

/** e- mu- -> e- mu-: a single photon exchanged in the t channel; the complete massless result, not only the pole. */
export function electronMuonTerms(sqrtS, cosTheta, alpha = ALPHA_ZERO) {
  const s = sqrtS * sqrtS, { t, u } = tu(s, cosTheta);
  const tChannel = (solidAngleUnit(s, alpha) * (s * s + u * u)) / (t * t);
  return { t: tChannel, total: tChannel };
}
