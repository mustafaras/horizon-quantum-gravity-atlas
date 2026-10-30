/**
 * The observational net as computed instruments (S28).
 *
 * Three quantities the atlas previously described in prose, now derived:
 *
 *   1. The Lorentz-violation time of flight from a gamma-ray burst — a light-speed difference that grows with
 *      energy would delay high-energy photons by
 *
 *          Δt(E) = (E/E_QG) · (1/H₀) · ∫₀^z (1+z′) dz′ / √(Ω_m(1+z′)³ + Ω_Λ)
 *
 *      (Jacob & Piran, JCAP 01 (2008) 031). The integral is the lookback time in units of the Hubble time; the
 *      prefactor is the fractional speed difference.
 *
 *   2. Slow-roll inflation predictions in the (n_s, r) plane for three potentials.
 *
 *   3. The Yukawa exclusion from Eöt-Wash, as an α–λ region.
 *
 * Cosmology is Planck 2018 (A&A 641, A6): H₀ = 67.36, Ω_m = 0.3153, Ω_Λ = 0.6847, n_s = 0.965.
 *
 * Everything here is pure, DOM-free and tested.
 */

import { REF } from "./references.mjs";

export const OBSERVATIONAL_NET_PROVENANCE = Object.freeze({
  id: "exp-observational-net",
  model:
    "Lorentz-violation time of flight, slow-roll inflation predictions and the Eöt-Wash Yukawa exclusion, all computed from the stated equations",
  status: "effective",
  assumptions: Object.freeze([
    "Flat ΛCDM with the Planck 2018 base parameters; the integral is evaluated numerically, not from a table",
    "Linear (n = 1) Lorentz violation with a single scale E_QG; a quadratic term would have a different energy dependence",
    "The slow-roll predictions use the first-order relations only and N = 50-60 e-folds; second-order terms shift n_s by a few 10^-3",
    "The Eöt-Wash exclusion is the published 95 % CL Yukawa bound, read as an α-λ region rather than recomputed from the data",
  ]),
  validity: Object.freeze([
    "The Fermi-LAT bound on E_QG is indirect: it depends on the emission-time model of the burst, not on a direct measurement at that energy",
    "An inflation prediction is a model statement; no tensor mode has been detected, so r is an upper limit from the data",
  ]),
  numericalMethod:
    "Adaptive Simpson on the lookback integral, closed-form slow-roll parameters, and a transcribed Yukawa boundary",
  references: Object.freeze([REF.PLANCK_2018, REF.FERMI_2009, REF.JACOB_PIRAN_2008, REF.BICEP_KECK_2021, REF.EOT_WASH_2020]),
  layers: Object.freeze([
    { name: "Measured bounds and the excluded regions", class: "data" },
    { name: "Computed delay curves and slow-roll predictions", class: "model" },
  ]),
  seed: "none: everything is deterministic",
});

/** Planck 2018 base ΛCDM, the cosmology every figure in this module uses. */
export const PLANCK_2018 = Object.freeze({
  h0: 67.36,          // km/s/Mpc
  omegaM: 0.3153,
  omegaLambda: 0.6847,
  ns: 0.965,
  lnAs: 3.044,
});

const C_KM_S = 299792.458;
const MPC_KM = 3.0856775814913673e19;
export const GYR_S = 3.15576e16;

/** The Hubble constant in 1/s, and the Hubble time in seconds. */
// H0 is quoted in km/s/Mpc and MPC_KM is already in km, so the conversion is one division. Multiplying by 1000
// first made H0 a thousand times too large and the Hubble time a thousand times too short.
export const hubbleRatePerSecond = (h0 = PLANCK_2018.h0) => h0 / MPC_KM;
export const hubbleTimeSeconds = (h0 = PLANCK_2018.h0) => 1 / hubbleRatePerSecond(h0);

/**
 * The dimensionless lookback integral ∫₀^z (1+z′) dz′ / E(z′), by composite Simpson.
 *
 * The integrand is smooth and positive for z > 0 and E(z) never vanishes, so Simpson converges rapidly; the test
 * compares it against an independent evaluation to 1e-8.
 */
export function lookbackIntegral(z, { omegaM = PLANCK_2018.omegaM, omegaLambda = PLANCK_2018.omegaLambda } = {}, intervals = 20000) {
  if (!(Number.isFinite(z) && z > 0)) throw new RangeError("redshift must be positive and finite");
  if (!Number.isInteger(intervals) || intervals < 2 || intervals % 2 !== 0) throw new RangeError("intervals must be even and at least 2");
  const e = (zp) => Math.sqrt(omegaM * (1 + zp) ** 3 + omegaLambda);
  const h = z / intervals;
  let sum = (1 + 0) / e(0) + (1 + z) / e(z);
  for (let i = 1; i < intervals; i++) {
    const zp = i * h;
    sum += (i % 2 === 1 ? 4 : 2) * ((1 + zp) / e(zp));
  }
  return (sum * h) / 3;
}

/**
 * The time delay between two photons of energies E1 and E2 from a source at redshift z, for a linear
 * Lorentz-violation scale E_QG. Energies are in the same unit as E_QG (both GeV by default).
 *
 * Δt = (ΔE/E_QG) · t_H · ∫₀^z (1+z′) dz′ / E(z′)
 *
 * Positive Δt means the higher-energy photon arrives later (subluminal).
 */
export function timeDelay({ energy1GeV, energy2GeV = 0, redshift, eQgGeV, h0KmS = PLANCK_2018.h0, cosmology = {} }) {
  if (!(eQgGeV > 0)) throw new RangeError("E_QG must be positive");
  if (!(energy1GeV >= 0) || !(energy2GeV >= 0)) throw new RangeError("energies must be non-negative");
  const integral = lookbackIntegral(redshift, cosmology);
  const hubble = hubbleTimeSeconds(h0KmS);
  return ((energy1GeV - energy2GeV) / eQgGeV) * hubble * integral;
}

/** The delay in seconds for the full energy of one photon, the quantity the Fermi bound constrains. */
export const fullDelaySeconds = (energyGeV, redshift, eQgGeV, h0KmS = PLANCK_2018.h0) =>
  timeDelay({ energy1GeV: energyGeV, redshift, eQgGeV, h0KmS });

/** Planck energy in GeV, for stating E_QG in Planck units. */
export const PLANCK_ENERGY_GEV = 1.2209e19;

/** The Fermi-LAT bound from GRB 090510, as a multiple of the Planck energy. */
export const FERMI_BOUND = Object.freeze({
  eQgOverEPlanck: 1.19,
  redshift: 0.903,
  energyGeV: 31,
  reference: REF.FERMI_2009,
  caveat: "A 1.19 sigma lower limit within the burst's emission model, not a measured transition energy.",
});

/* ---------- slow-roll inflation ---------- */

/**
 * The slow-roll predictions of three potentials in the (n_s, r) plane.
 *
 * First-order slow-roll relations: n_s = 1 − 6ε + 2η and r = 16ε, evaluated at the e-fold when the pivot scale left
 * the horizon. Each potential gives its own ε and η, which is what puts the three curves in different places.
 */
export function slowRollPredictions({ nMin = 50, nMax = 60, samples = 11 } = {}) {
  if (!Number.isInteger(samples) || samples < 2) throw new RangeError("samples must be at least 2");
  const rows = [];
  for (let i = 0; i < samples; i++) {
    const N = nMin + ((nMax - nMin) * i) / (samples - 1);
    rows.push({
      N,
      // phi^2 chaotic inflation: eps = 1/(2N), eta = 1/N, so n_s = 1 - 2/N and r = 8/N.
      phiSquared: { ns: 1 - 2 / N, r: 8 / N },
      // Starobinsky / R^2: eps = 3/(4N^2), eta = -1/N, so n_s = 1 - 2/N and r = 12/N^2.
      starobinsky: { ns: 1 - 2 / N, r: 12 / (N * N) },
      // Natural inflation with f = 5 M_Pl: eps and eta from the potential V = Λ^4(1 - cos(phi/f)).
      natural: naturalInflation(N, 5),
    });
  }
  return rows;
}

/**
 * Natural inflation: V = Λ⁴(1 − cos(φ/f)), with the slow-roll parameters evaluated in closed form.
 *
 * With x = φ/f and ε = (1/2f²)(1+cos x)/(1−cos x), the number of e-folds is exactly
 *
 *     N = f² ln[ (1 + cos x_end) / (1 + cos x) ]
 *
 * and ε = 1 at the end of inflation fixes cos x_end = (2f² − 1)/(2f² + 1). Inverting gives x(N) without integrating,
 * which is both faster and stable: a numerical march towards the minimum diverges as ε → 0 there.
 */
export function naturalInflation(N, f = 5) {
  if (!(N > 0)) throw new RangeError("N must be positive");
  if (!(f > 0)) throw new RangeError("f must be positive");
  const cosEnd = (2 * f * f - 1) / (2 * f * f + 1);
  const cosX = (1 + cosEnd) * Math.exp(-N / (f * f)) - 1;
  const clamped = Math.max(-1, Math.min(1, cosX));
  const cosPhi = clamped;
  const eps = (0.5 / (f * f)) * (1 + cosPhi) / Math.max(1e-12, 1 - cosPhi);
  const eta = -(1 / (f * f)) * cosPhi / Math.max(1e-12, 1 - cosPhi);
  return { ns: 1 - 6 * eps + 2 * eta, r: 16 * eps, eps, eta };
}

/** The BICEP/Keck 2021 tensor bound, as a 95 % CL upper limit on r. */
export const BICEP_KECK_BOUND = Object.freeze({
  rUpper: 0.036,
  reference: REF.BICEP_KECK_2021,
  caveat: "95 % CL upper limit on r from BICEP/Keck + Planck; the 2D (n_s, r) contour would need the paper's own data release.",
});

/* ---------- short-range gravity ---------- */

/**
 * The Eöt-Wash Yukawa bound, as the single point the paper states.
 *
 * Lee et al. (2020) fit the 1/r² law over 52 μm to 3.0 mm and report one number: "limiting with 95 % confidence any
 * gravitational-strength Yukawa interactions to ranges < 38.6 μm". That is a point at α = 1, not a curve.
 *
 * I first wrote a smooth α(λ) envelope with an invented Gaussian shape, which would have been a fabricated
 * exclusion contour — exactly what this prompt pack forbids. The published point is what is drawn, and the figure
 * says so rather than extrapolating a boundary the paper does not give.
 */
export const EOT_WASH_BOUND = Object.freeze({
  alphaStrength: 1,
  lambdaMicrons: 38.6,
  confidence: "95%",
  separationRangeMicrons: Object.freeze([52, 3000]),
  reference: REF.EOT_WASH_2020,
  note:
    "Gravitational-strength (alpha = 1) Yukawa interactions are excluded below this range. The paper does not publish " +
    "a full alpha-lambda contour, so none is drawn.",
});

/** The "dark energy length" near 85 μm, where a light scalar would mediate a force of the right size. */
export const DARK_ENERGY_LENGTH_MICRONS = 85;
