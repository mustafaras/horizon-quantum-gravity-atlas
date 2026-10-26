// The Casimir cavity (S15): ideal parallel plates, the regularised 1+1D mode sum, the standing modes the lab draws, and the bands the
// experiments report. Pure functions in SI units; the constants are the CODATA 2018 values of js/science/constants.mjs.
//
//   P(a)   = -pi^2 hbar c / (240 a^4)     pressure between ideal, perfectly conducting plates (negative: attraction)
//   E/A(a) = -pi^2 hbar c / (720 a^3)     energy per area, P = -d(E/A)/da
//
// The mode sum is the one-dimensional scalar field between two Dirichlet plates a distance a apart, where the allowed angular
// frequencies are omega_n = n pi c / a, n = 1, 2, ... The regulator is the exponential f(x) = exp(-x), applied as f(omega / Lambda):
//
//   E_in(a, Lambda)  = sum_{n>=1} (1/2) hbar omega_n exp(-omega_n / Lambda)
//   E_out(a, Lambda) = the same regulated energy of free space over the same length a,
//                    = a * integral_0^inf (d omega / pi c) (1/2) hbar omega exp(-omega / Lambda) = hbar a Lambda^2 / (2 pi c)
//
// "Outside" is the continuum because the region beyond the plates has no boundary that selects frequencies: its modes are so densely
// spaced (the length is much larger than a) that the sum over them is its integral, with the density of states a / (pi c) per unit
// angular frequency for a stretch of length a. With eps = pi c / (a Lambda), sum n exp(-n eps) = 1/(4 sinh^2(eps/2)) = 1/eps^2 - 1/12 + eps^2/240 - ...,
// so E_in - E_out = -pi hbar c / (24 a) + hbar pi c eps^2 / (480 a) + ... : the divergent terms cancel and what remains tends to
// -pi hbar c / (24 a) as Lambda -> infinity, with an error that falls as 1/Lambda^2. The sum below is added term by term (nothing
// is read from the closed form); the tests compare the two.

import { HBAR, C } from "./constants.mjs";
import { CASIMIR_DATA } from "./data/casimir.mjs";

const PI2 = Math.PI * Math.PI;
const TAIL_EXPONENTS = 45; // terms are summed to n * eps = 45, where exp(-n eps) is 3e-20 of the first
const MAX_TERMS = 5_000_000;

function assertPositive(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be a positive finite number, got ${value}`);
}

/** Pressure between ideal plates a metres apart, in pascal; negative for attraction. */
export function idealPressure(gap) {
  assertPositive(gap, "gap");
  return (-PI2 * HBAR * C) / (240 * gap ** 4);
}

/** Energy per unit area between ideal plates, in joule per square metre. */
export function idealEnergyPerArea(gap) {
  assertPositive(gap, "gap");
  return (-PI2 * HBAR * C) / (720 * gap ** 3);
}

/** K_C = pi^2 hbar c / 240 in N m^2, so that |P| = K_C / a^4 (Bressi et al. print pi h c / 480 = 1.3e-27). */
export function idealCoefficient() {
  return (PI2 * HBAR * C) / 240;
}

/** The cutoff Lambda (rad/s) that is `ratio` times the fundamental frequency pi c / a of a gap. */
export function cutoffForRatio(gap, ratio) {
  assertPositive(gap, "gap");
  assertPositive(ratio, "ratio");
  return (ratio * Math.PI * C) / gap;
}

/**
 * The regularised 1+1D sum for a gap and a cutoff (rad/s): the inside sum, the continuum outside, their difference and the limit
 * -pi hbar c / 24a it tends to. Energies in joule.
 */
export function modeSumDifference({ gap, cutoff }) {
  assertPositive(gap, "gap");
  assertPositive(cutoff, "cutoff");
  const eps = (Math.PI * C) / (gap * cutoff);
  const terms = Math.ceil(TAIL_EXPONENTS / eps);
  if (terms > MAX_TERMS) throw new RangeError(`cutoff needs ${terms} modes, above the budget of ${MAX_TERMS}`);
  let sum = 0, compensation = 0; // Kahan: the sum is ~1/eps^2 and the difference we want is 1/12 of it
  for (let n = terms; n >= 1; n -= 1) { // smallest terms first
    const y = n * Math.exp(-n * eps) - compensation;
    const t = sum + y;
    compensation = (t - sum) - y;
    sum = t;
  }
  const inside = (HBAR * Math.PI * C * sum) / (2 * gap);
  const outside = (HBAR * gap * cutoff ** 2) / (2 * Math.PI * C);
  return { inside, outside, difference: inside - outside, limit: (-Math.PI * HBAR * C) / (24 * gap), modes: terms };
}

/** The first `count` standing modes of a gap: n, omega_n = n pi c / a, and the zero-point amplitude 1/sqrt(n) in units of the first mode's. */
export function standingModes({ gap, count }) {
  assertPositive(gap, "gap");
  if (!Number.isInteger(count) || count < 1) throw new RangeError(`count must be a positive integer, got ${count}`);
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return { n, omega: (n * Math.PI * C) / gap, amplitude: 1 / Math.sqrt(n) };
  });
}

/** The magnitude of the ideal pressure at `count` gaps spaced evenly in the logarithm between `min` and `max` metres. */
export function pressureCurve({ min, max, count }) {
  assertPositive(min, "min");
  assertPositive(max, "max");
  if (!(max > min) || !Number.isInteger(count) || count < 2) throw new RangeError("need max > min and an integer count of at least 2");
  const step = Math.log(max / min) / (count - 1);
  const gap = Array.from({ length: count }, (_, i) => (i === count - 1 ? max : min * Math.exp(step * i)));
  return { gap, pressure: gap.map((a) => -idealPressure(a)) };
}

/**
 * The band an experiment reports, as a magnitude of pressure at the given gaps (pascal).
 *   bressi2002     K / a^4 with K = (1.22 +- 0.18)e-27 N m^2, over 0.5 to 3.0 um (parallel plates)
 *   lamoreaux1997  the ideal line times 1 +- 0.05, over 0.6 to 6 um (sphere and plate, mapped by the proximity force theorem)
 */
export function dataBand(source, gaps) {
  const entry = CASIMIR_DATA[source];
  if (!entry?.range) throw new RangeError(`unknown source ${source}`);
  const [lo, hi] = entry.range;
  for (const a of gaps) if (!(a >= lo && a <= hi)) throw new RangeError(`gap ${a} is outside the measured range ${lo}..${hi}`);
  const ideal = (a) => -idealPressure(a);
  if (entry.coefficient) {
    const { value, uncertainty } = entry.coefficient;
    return { gap: [...gaps], low: gaps.map((a) => (value - uncertainty) / a ** 4), high: gaps.map((a) => (value + uncertainty) / a ** 4) };
  }
  const s = entry.reportedAgreement;
  return { gap: [...gaps], low: gaps.map((a) => (1 - s) * ideal(a)), high: gaps.map((a) => (1 + s) * ideal(a)) };
}

/** A band from dataBand as a ratio to the ideal-plate pressure at the same gaps: where the experiments sit relative to the line, unitless. */
export function ratioBand(band) {
  const ideal = band.gap.map((a) => -idealPressure(a));
  return { gap: [...band.gap], low: band.low.map((v, i) => v / ideal[i]), high: band.high.map((v, i) => v / ideal[i]) };
}
