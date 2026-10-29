/**
 * The Event Horizon Telescope measurements (S25).
 *
 * Two black holes have had their shadows measured. Both ring diameters are *calibrated* to the shadow through a
 * modelling factor (EHT Paper VI), so a comparison with the theoretical 2√27 GM/(c²D) is a ~10 %-level statement,
 * not a precision test — the caption says so and so does the provenance entry.
 *
 * Every value below was read from the cited paper, and the retrieval date is recorded with each.
 */

import { REF } from "../references.mjs";

const source = (reference, retrieved = "2026-10-29") => Object.freeze({ reference, retrieved });

/** The two measured targets, with the mass and distance each paper uses to convert to an angular size. */
export const EHT_TARGETS = Object.freeze([
  Object.freeze({
    id: "m87",
    label: "M87*",
    ringDiameterUas: 42,
    ringSigmaUas: 3,
    massSolar: 6.5e9,
    massNote: "6.5 ± 0.2 (stat) ± 0.7 (syst) × 10⁹ solar masses",
    distanceMpc: 16.8,
    distanceNote: "16.8 Mpc",
    source: source(REF.EHT_M87_2019_VI),
    additionalSources: Object.freeze([source(REF.EHT_M87_2019_I)]),
    note:
      "The 42 μas ring diameter is the measured emission-ring size; calibrating it to the shadow requires the " +
      "modelling factor of Paper VI, which is why the comparison is quoted at the ~10 % level.",
  }),
  Object.freeze({
    id: "sgra",
    label: "Sgr A*",
    ringDiameterUas: 51.8,
    ringSigmaUas: 2.3,
    massSolar: 4.0e6,
    massNote: "4.0 × 10⁶ solar masses, from the GRAVITY astrometry of S2",
    distanceMpc: 0.0080,
    distanceNote: "8.0 kpc",
    source: source(REF.EHT_SGR_A_2022_I),
    additionalSources: Object.freeze([source(REF.GRAVITY_2021_MASS)]),
    note:
      "Sgr A* is a thousand times closer than M87*, so its ring is a similar angular size. The mass and distance " +
      "are the GRAVITY values cited in the EHT paper, not an independent fit.",
  }),
]);

/**
 * The predicted apparent diameter of the shadow, 2√27 GM/(c²D), in microarcseconds.
 *
 * The factor √27 is the critical impact parameter of a Schwarzschild hole; a spinning hole deforms the curve but
 * changes its mean size by only a few per cent at the spins considered here, which is inside the ~10 % comparison
 * this table supports.
 */
export function predictedShadowUas({ massSolar, distanceMpc }) {
  const G = 6.6743e-11, c = 299792458, Msun = 1.98847e30, Mpc = 3.0856775814913673e22;
  const rad2uas = (180 / Math.PI) * 3600 * 1e6;
  if (!(massSolar > 0) || !(distanceMpc > 0)) throw new RangeError("mass and distance must be positive");
  const impact = Math.sqrt(27) * G * massSolar * Msun / (c * c);
  return (2 * impact) / (distanceMpc * Mpc) * rad2uas;
}

/** Predicted against measured for one target, with the fractional difference the caption quotes. */
export function comparisonFor(target) {
  const predicted = predictedShadowUas(target);
  const measured = target.ringDiameterUas;
  return {
    id: target.id,
    label: target.label,
    predictedUas: predicted,
    measuredUas: measured,
    sigmaUas: target.ringSigmaUas,
    massSolar: target.massSolar,
    distanceMpc: target.distanceMpc,
    note: target.note,
    source: target.source,
    ratio: measured / predicted,
    differencePercent: ((measured - predicted) / predicted) * 100,
  };
}

export const EHT_COMPARISONS = Object.freeze(EHT_TARGETS.map(comparisonFor));

export const EHT_PROVENANCE = Object.freeze({
  id: "bh-eht-comparison",
  model: "The measured EHT ring diameters against the predicted Schwarzschild shadow size 2√27 GM/(c²D)",
  status: "effective",
  assumptions: Object.freeze([
    "The ring diameter is calibrated to the shadow through the modelling factor of EHT Paper VI, not equated to it",
    "The mass and distance are those each paper adopts, so the two comparisons are not independent measurements of the same quantity",
    "The predicted value is the Schwarzschild 2√27 GM/(c²D); spin deforms the curve and shifts the mean size by a few per cent",
  ]),
  validity: Object.freeze([
    "The agreement is at the ~10 % level set by the calibration and by the mass uncertainty, not a precision test",
    "Neither image resolves the photon ring itself; the sub-ring markers elsewhere are predictions",
  ]),
  numericalMethod: "Closed-form angular conversion from the critical impact parameter; measured values transcribed with citations",
  references: Object.freeze([REF.EHT_M87_2019_I, REF.EHT_M87_2019_VI, REF.EHT_SGR_A_2022_I, REF.GRAVITY_2021_MASS]),
  layers: Object.freeze([
    { name: "Measured ring diameters and their uncertainties", class: "data" },
    { name: "The predicted shadow size", class: "model" },
  ]),
  seed: "none: literature data",
});

export function registerEhtProvenance(register) {
  return register(EHT_PROVENANCE.id, EHT_PROVENANCE);
}
