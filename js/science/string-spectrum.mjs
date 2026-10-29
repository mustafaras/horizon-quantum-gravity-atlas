/**
 * The open bosonic string spectrum (S23).
 *
 * The mass formula for the open bosonic string is α′M² = N − 1, where N counts the total oscillator level. The
 * number of states at level N is the coefficient of q^N in
 *
 *     Π_{n≥1} (1 − qⁿ)^(−24)
 *
 * — twenty-four sets of oscillator modes, one per transverse direction. The level N = 0 state is a tachyon
 * (M² = −1/α′), which is a genuine problem with the bosonic theory, not a rounding artefact.
 *
 * The critical dimension follows from the normal-ordering constant. With a = (D − 2)/24 and the regularised sum
 * Σ n = ζ(−1) = −1/12, the level-one state is massless only when a = 1, i.e. D = 26. Both steps are exposed as a
 * data structure so later views can step through the derivation rather than assert its result.
 *
 * Everything here is pure and DOM-free.
 */

import { REF } from "./references.mjs";

export const STRING_SPECTRUM_PROVENANCE = Object.freeze({
  id: "approaches-string-spectrum",
  model:
    "Free open bosonic string: oscillator levels, their degeneracies from the generating function, and the critical dimension from the normal-ordering constant",
  status: "established",
  assumptions: Object.freeze([
    "Free open bosonic string in flat spacetime: no interactions, no compactification, no supersymmetry",
    "Transverse oscillators only; the two light-cone directions are fixed by the gauge choice",
    "The level degeneracy counts states, not physical polarisations after further constraints",
  ]),
  validity: Object.freeze([
    "The integer-spin spectrum contains a tachyon at N = 0: the bosonic string is unstable and must be replaced by the superstring for a physical theory",
    "The mass formula and D = 26 are exact statements about the free bosonic theory, not a claim that it describes nature",
  ]),
  numericalMethod:
    "Partition numbers convolved twenty-four times (the q-series coefficient), and the zeta-regularised normal-ordering sum",
  references: Object.freeze([REF.POLCHINSKI, REF.ROVELLI_BOOK]),
  layers: Object.freeze([
    { name: "Oscillator levels and their degeneracies", class: "data" },
    { name: "Critical-dimension derivation steps", class: "model" },
  ]),
  seed: "none: the spectrum is exact and deterministic",
});

/** The twenty-four transverse directions of the bosonic string. */
export const TRANSVERSE_MODES = 24;

/** α′M² for oscillator level N: the open bosonic string mass formula. */
export function massSquaredLevel(n) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError("level must be a non-negative integer");
  return n - 1;
}

/** True at N = 0, where α′M² = −1: the tachyon the bosonic theory cannot avoid. */
export function isTachyon(n) {
  return massSquaredLevel(n) < 0;
}

/** Partition numbers p(0…max), by the standard pentagonal recurrence (cheap and exact for the levels used here). */
export function partitionNumbers(max) {
  if (!Number.isInteger(max) || max < 0) throw new RangeError("max must be a non-negative integer");
  const p = new Array(max + 1).fill(0);
  p[0] = 1;
  for (let n = 1; n <= max; n++) {
    let total = 0;
    for (let k = 1; ; k++) {
      const g1 = (k * (3 * k - 1)) / 2;
      const g2 = (k * (3 * k + 1)) / 2;
      if (g1 > n && g2 > n) break;
      const sign = k % 2 === 1 ? 1 : -1;
      if (g1 <= n) total += sign * p[n - g1];
      if (g2 <= n) total += sign * p[n - g2];
    }
    p[n] = total;
  }
  return p;
}

/**
 * Level degeneracies: the coefficient of q^N in Π(1 − qⁿ)^(−24), computed as the 24-fold convolution of the
 * partition numbers — the same series, evaluated without floating point.
 */
export function levelDegeneracies(maxLevel) {
  if (!Number.isInteger(maxLevel) || maxLevel < 0) throw new RangeError("maxLevel must be a non-negative integer");
  const p = partitionNumbers(maxLevel);
  let coefficients = new Array(maxLevel + 1).fill(0);
  coefficients[0] = 1;
  for (let mode = 0; mode < TRANSVERSE_MODES; mode++) {
    const next = new Array(maxLevel + 1).fill(0);
    for (let i = 0; i <= maxLevel; i++) {
      const value = coefficients[i];
      if (!value) continue;
      for (let j = 0; i + j <= maxLevel; j++) next[i + j] += value * p[j];
    }
    coefficients = next;
  }
  return coefficients;
}

/** The spectrum as rows the views read: level, α′M², degeneracy and whether the row is the tachyon. */
export function spectrumRows(maxLevel = 8) {
  const degeneracies = levelDegeneracies(maxLevel);
  return degeneracies.map((count, n) => ({
    n,
    massSquared: massSquaredLevel(n),
    degeneracy: count,
    tachyon: isTachyon(n),
  }));
}

/** ζ(−1) = −1/12, the regularised value behind the normal-ordering constant. */
export const ZETA_MINUS_ONE = -1 / 12;

/**
 * The normal-ordering constant a = −(D − 2)/24.
 *
 * The zero-point energy is ½·Σ n over each of the D − 2 transverse directions. Regularising Σ n as ζ(−1) = −1/12
 * gives ½·(D − 2)·(−1/12) = −(D − 2)/24, which is the shift in α′M² = N + a.
 */
export function normalOrderingConstant(dimensions) {
  if (!(Number.isFinite(dimensions) && dimensions > 2)) {
    throw new RangeError("dimensions must be a finite number above 2");
  }
  // ½ · (D − 2) · ζ(−1) = −(D − 2)/24
  return (dimensions - 2) * 0.5 * ZETA_MINUS_ONE;
}

/**
 * The critical-dimension derivation, as ordered steps a later view can walk.
 *
 * The physical content: the mass-shell condition is α′M² = N + a, the level-one state must be a massless vector,
 * and consistency therefore requires a = −1, which fixes D.
 */
export function criticalDimensionSteps() {
  return [
    {
      id: "sum",
      statement: "The zero-point sum over one transverse direction diverges.",
      tex: "\\sum_{n=1}^{\\infty} n",
    },
    {
      id: "zeta",
      statement: "Zeta-regularise it: the sum takes the value ζ(−1).",
      tex: "\\zeta(-1) = -\\tfrac{1}{12}",
      value: ZETA_MINUS_ONE,
    },
    {
      id: "transverse",
      statement: "Half the sum over each of the D − 2 transverse directions gives the shift a.",
      tex: "a = \\tfrac{1}{2}\\,(D-2)\\,\\zeta(-1) = -\\frac{D-2}{24}",
    },
    {
      id: "massless",
      statement: "The level-one state is a massless vector, so α′M² = 1 + a must vanish.",
      tex: "N + a = 1 + a = 0",
    },
    {
      id: "solve",
      statement: "Solving a = −1 for D gives the critical dimension of the bosonic string.",
      tex: "D = 26",
      value: 26,
    },
  ];
}

/** The dimension at which a = −1, i.e. the critical dimension of the bosonic string. */
export function criticalDimension() {
  // a = −(D − 2)/24 = −1  ⇒  D − 2 = 24  ⇒  D = 26.
  return 2 + 24;
}

export function registerStringSpectrumProvenance(register) {
  return register(STRING_SPECTRUM_PROVENANCE.id, STRING_SPECTRUM_PROVENANCE);
}
