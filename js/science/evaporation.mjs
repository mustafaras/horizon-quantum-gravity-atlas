/**
 * Black-hole evaporation and the Page curve (S24).
 *
 * A Schwarzschild black hole of mass M emits as a blackbody of temperature T = ħc³/(8πGMk_B), so its mass
 * follows from energy conservation:
 *
 *     dM/dt = −L/M²   ⇒   M(t) = M₀ (1 − t/τ)^{1/3},   τ = M₀³/(3L₀)
 *
 * The Bekenstein–Hawking entropy S = 4πk_B G M²/(ħc) = S₀ (M/M₀)² therefore falls as (1 − t/τ)^{2/3}.
 *
 * The radiation entropy is *not* the black hole entropy. Page (2013) computed the coarse-grained entropy of the
 * emitted radiation for a Schwarzschild hole radiating into empty space and found that at the time when the
 * radiation entropy reaches the black hole's remaining entropy it equals
 *
 *     S_rad = β (S₀ − S_BH),   β = 1.4847
 *
 * Page's β is a computed number, not a fitted one: it comes from summing the entropy of the photon and graviton
 * species with their greybody factors. Its consequence is the Page time — the moment the two curves cross, after
 * which the radiation carries more entropy than the hole has left:
 *
 *     S_BH/S₀ = β/(1 + β) = 0.5975,   M/M₀ = 0.7730,   t/τ = 0.5381
 *
 * References: Page, Phys. Rev. D 13, 198 (1976); Page, JCAP 09 (2013) 028, arXiv:1301.4995 (β = 1.4847);
 * Penington, arXiv:1905.08255 and Almheiri, Engelhardt, Marolf & Maxfield, arXiv:1905.08762 for the island
 * derivation that makes the Page curve follow from a unitary theory.
 */

import { REF } from "./references.mjs";

/** Page's computed coefficient relating radiation entropy to the black hole entropy lost. */
export const PAGE_BETA = 1.4847;

export const EVAPORATION_PROVENANCE = Object.freeze({
  id: "bh-page-curve",
  model:
    "Schwarzschild evaporation with a photon-plus-graviton luminosity law, the Bekenstein–Hawking entropy, and Page's computed radiation-entropy coefficient β = 1.4847",
  status: "effective",
  assumptions: Object.freeze([
    "Schwarzschild (non-rotating, uncharged) hole radiating into empty space",
    "Mass loss follows dM/dt ∝ −1/M² from the Stefan–Boltzmann law with a fixed effective emitting area",
    "β = 1.4847 assumes the Standard-Model-plus-graviton species Page counted; adding light hidden species changes it",
    "The coarse-grained entropy is what is plotted; the fine-grained entropy of the radiation is unknown without a theory of the interior",
  ]),
  validity: Object.freeze([
    "The mass and entropy histories are effective-theory statements valid while M ≫ M_Planck",
    "The Page curve's turn-over is a expectation from unitarity, not a measurement; no experiment has observed an evaporating black hole",
    "The final Planck-scale stage is outside the model and is not drawn",
  ]),
  numericalMethod:
    "Closed-form mass and entropy histories from the luminosity law; Page time by solving S_rad = S_BH in closed form",
  references: Object.freeze([REF.PAGE_1976, REF.PAGE_2013, REF.PENINGTON_2019, REF.AEM_2019]),
  layers: Object.freeze([
    { name: "Black-hole entropy and the radiation entropy", class: "model" },
    { name: "The Page curve and the Page-time rule", class: "model" },
  ]),
  seed: "none: the curve is closed-form",
});

/** Mass as a fraction of the initial mass at evaporated fraction f = t/τ. */
export function massFraction(fraction) {
  const f = Number(fraction);
  if (!Number.isFinite(f)) throw new RangeError("fraction must be finite");
  const clamped = Math.min(1, Math.max(0, f));
  return Math.cbrt(Math.max(0, 1 - clamped));
}

/** The black hole's remaining entropy as a fraction of its initial entropy: S/S₀ = (M/M₀)². */
export function blackHoleEntropyFraction(fraction) {
  return massFraction(fraction) ** 2;
}

/**
 * Page's coarse-grained radiation entropy, as a fraction of the initial black hole entropy.
 *
 * S_rad = β(S₀ − S_BH), so at f = 0 it is zero and it rises as the hole loses entropy. It is *not* capped here:
 * the pageCurve below is what takes the minimum with S_BH.
 */
export function radiationEntropyFraction(fraction, beta = PAGE_BETA) {
  return beta * (1 - blackHoleEntropyFraction(fraction));
}

/** Hawking's ever-rising thermal entropy in the same normalisation: S_rad grows without turning over. */
export function hawkingEntropyFraction(fraction, beta = PAGE_BETA) {
  return beta * (1 - blackHoleEntropyFraction(fraction));
}

/**
 * The Page curve: S_rad until the radiation entropy reaches the remaining black-hole entropy, then S_BH.
 *
 * Taking the minimum is the whole content of the statement that the radiation cannot carry more entropy than a
 * unitary evaporation allows. The two branches meet exactly at the Page time.
 */
export function pageCurve(fraction, beta = PAGE_BETA) {
  return Math.min(radiationEntropyFraction(fraction, beta), blackHoleEntropyFraction(fraction));
}

/**
 * The Page time, in units of the evaporation time, from S_rad = S_BH.
 *
 *     β(1 − f²) = f²   ⇒   f = √(β/(1 + β)),   and with S ∝ (1 − t/τ)^{2/3},   t/τ = 1 − f³
 */
export function pageTimeFraction(beta = PAGE_BETA) {
  if (!(Number.isFinite(beta) && beta > 0)) throw new RangeError("beta must be positive and finite");
  return 1 - (beta / (1 + beta)) ** 1.5;
}

/** The three numbers the Page time is quoted by: entropy fraction, mass fraction and time fraction. */
export function pageTimeSummary(beta = PAGE_BETA) {
  const entropy = beta / (1 + beta);
  return {
    beta,
    entropyFraction: entropy,
    massFraction: Math.sqrt(entropy),
    timeFraction: pageTimeFraction(beta),
  };
}

/**
 * Luminosity of a Schwarzschild hole including photons and gravitons, in natural units where the answer is a
 * multiple of ħc⁶/(G²M²). Page (1976) computed the coefficient; this returns the *shape* so the caller supplies
 * the units it wants.
 */
export function luminosityShape(massRatio) {
  const r = Number(massRatio);
  if (!(Number.isFinite(r) && r > 0)) throw new RangeError("mass ratio must be positive and finite");
  return 1 / (r * r);
}

export function registerEvaporationProvenance(register) {
  return register(EVAPORATION_PROVENANCE.id, EVAPORATION_PROVENANCE);
}
