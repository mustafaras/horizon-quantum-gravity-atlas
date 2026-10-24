// The tree-level Higgs potential of the Standard Model (S13), in physical units.
//
// The doublet H has |H|^2 = (h^2 + chi_1^2 + chi_2^2 + chi_3^2) / 2: h is the radial (Higgs) direction and the chi are the
// three Goldstone directions. V(|H|) = -mu^2 |H|^2 + lambda |H|^4 has its minimum at |H|^2 = mu^2 / 2 lambda = v^2 / 2, so
// mu^2 = lambda v^2. The curvature along h at the minimum is m_H^2 = 2 lambda v^2 and along the Goldstone directions it is 0.
//
// v follows from the Fermi constant, v = (sqrt2 G_F)^(-1/2). The step from the pole mass to the MS-bar quartic is the
// matching in higgs-running.mjs, not here. Units: GeV; G_F in GeV^-2.

const need = (ok, message) => { if (!ok) throw new RangeError(`higgs: ${message}`); };

/** v = (sqrt2 G_F)^(-1/2) in GeV. */
export function vevFromFermi(GF) {
  need(GF > 0 && Number.isFinite(GF), `G_F must be positive, got ${GF}`);
  return Math.pow(Math.SQRT2 * GF, -0.5);
}

/** The tree-level quartic coupling lambda = m_H^2 / (2 v^2). */
export function quarticFromMass(mH, v) {
  need(mH > 0 && v > 0, "m_H and v must be positive");
  return (mH * mH) / (2 * v * v);
}

/** The vacuum value of |H|, v / sqrt2. */
export const vacuumAbsH = (v) => v / Math.SQRT2;

/** V(|H|) = -mu^2 |H|^2 + lambda |H|^4, in GeV^4 for |H| in GeV. */
export function potential(absH, { lambda, mu2 }) {
  const h2 = absH * absH;
  return -mu2 * h2 + lambda * h2 * h2;
}

/** V / (lambda v^4) for x = h / v and s = mu^2 / (lambda v^2): x^4 / 4 - s x^2 / 2. s = 1 is the physical phase, s <= 0 the symmetric one. */
export const reducedPotential = (x, s) => (x * x * x * x) / 4 - (s * x * x) / 2;

/**
 * Second derivatives of V at radial field value h along the radial direction and along a Goldstone direction, with
 * |H|^2 = (h^2 + chi^2) / 2: radial = -mu^2 + 3 lambda h^2, goldstone = -mu^2 + lambda h^2.
 */
export function modeCurvatures({ lambda, mu2, h }) {
  return { radial: -mu2 + 3 * lambda * h * h, goldstone: -mu2 + lambda * h * h };
}
