/**
 * The Kerr shadow: the critical curve and the photon sub-rings (S25).
 *
 * A black hole does not emit a shadow; it silhouettes the emission behind it. For a Schwarzschild hole that
 * silhouette is a circle whose angular radius is set by the critical impact parameter b_c = √27 M, so the
 * apparent diameter is 2√27 GM/(c²D). For a spinning hole the circle deforms: the prograde side is dragged inward
 * and the shadow flattens on one edge.
 *
 * The boundary is the set of spherical photon orbits. In Boyer–Lindquist coordinates a photon on a spherical
 * orbit at radius r has the constants (Bardeen 1973)
 *
 *     ξ(r) = −(r³ − 3Mr² + a²r + a²M) / (a(r − M))
 *     η(r) = −r³(r³ − 6Mr² + 9M²r − 4a²M) / (a²(r − M)²)
 *
 * and an observer at inclination θ_o and distance D sees it at celestial coordinates
 *
 *     α = −ξ / sin θ_o
 *     β = ±√(η + a² cos²θ_o − ξ² cot²θ_o)
 *
 * where α is measured perpendicular to the projected spin axis. The Schwarzschild case is the degenerate limit
 * a → 0 and is handled in closed form, both because the general formula divides by a and because the circle is
 * the reference every test compares against.
 *
 * References: Bardeen, in Black Holes (Les Houches 1972), ed. DeWitt & DeWitt (1973); Johnson, Lupsasca,
 * Strominger, Wong & Hadar, Sci. Adv. 6, eaaz1310 (2020) for the sub-ring demagnification.
 */

import { REF } from "./references.mjs";

/** The critical impact parameter of a Schwarzschild hole, in units of M: √27. */
export const SCHWARZSCHILD_CRITICAL_B = Math.sqrt(27);

export const KERR_SHADOW_PROVENANCE = Object.freeze({
  id: "bh-kerr-shadow",
  model:
    "The Kerr shadow's critical curve from the spherical photon orbits (Bardeen 1973), drawn in the observer's celestial coordinates, with the EHT ring overlaid",
  status: "effective",
  assumptions: Object.freeze([
    "Vacuum Kerr metric; no accretion flow, no emission inside the shadow",
    "The observer is at infinity: the finite distance to M87* is accounted for only through the angular conversion, not through the lensing itself",
    "The critical curve is the boundary of the *direct* image; the sub-rings are labelled n = 1, 2 because each half orbit demagnifies the image",
  ]),
  validity: Object.freeze([
    "The curve is exact for the vacuum Kerr geometry; the comparison with the EHT ring is at the ~10 % level because the measured ring is calibrated to the shadow through a modelling factor",
    "No claim is made that the EHT image resolves the photon ring itself; the sub-ring markers are predictions",
  ]),
  numericalMethod:
    "Closed-form spherical photon orbits and observer projection; the Schwarzschild case is evaluated analytically as a circle of radius √27 M",
  references: Object.freeze([REF.EHT_M87_2019_I, REF.EHT_M87_2019_VI, REF.JOHNSON_2020_PHOTON_RING]),
  layers: Object.freeze([
    { name: "The critical curve and the sub-ring markers", class: "model" },
    { name: "The EHT ring and its uncertainty band", class: "data" },
  ]),
  seed: "none: the curve is closed-form",
});

/**
 * The spherical photon orbit radii of a Kerr hole: the real roots of
 * r³ − 6Mr² + 9M²r − 4a²M = 0 that lie outside the horizon.
 *
 * Returns `{ prograde, retrograde }` in units of M, or the Schwarzschild value 3 for a = 0.
 */
export function sphericalOrbitRadii(a, M = 1) {
  if (!Number.isFinite(a) || !Number.isFinite(M) || M <= 0) throw new RangeError("a and M must be finite, with M > 0");
  const spin = Math.abs(a) / M;
  if (spin < 1e-12) return { prograde: 3 * M, retrograde: 3 * M };
  // Closed-form roots: r = 2M[1 + cos(⅔ arccos(∓a/M))].
  const x = Math.min(1, spin);
  const prograde = 2 * M * (1 + Math.cos((2 / 3) * Math.acos(-x)));
  const retrograde = 2 * M * (1 + Math.cos((2 / 3) * Math.acos(x)));
  return { prograde, retrograde };
}

/** ξ(r) for a photon on a spherical orbit; infinite at a = 0, so the Schwarzschild case is handled separately. */
export function xiOf(r, a, M = 1) {
  return -(r ** 3 - 3 * M * r * r + a * a * r + a * a * M) / (a * (r - M));
}

/** η(r) for a photon on a spherical orbit. */
export function etaOf(r, a, M = 1) {
  return -(r ** 3 * (r ** 3 - 6 * M * r * r + 9 * M * M * r - 4 * a * a * M)) / (a * a * (r - M) ** 2);
}

/**
 * The critical curve in the observer's sky: arrays `alpha` and `beta` in units of M.
 *
 * For a = 0 the curve is the circle α² + β² = 27M². Otherwise it is sampled over the spherical orbits, and the
 * upper and lower halves are returned as one closed loop: β changes sign across the equatorial plane.
 */
export function criticalCurve({ a = 0, inclinationDeg = 90, M = 1, samples = 240 } = {}) {
  if (!(Number.isFinite(inclinationDeg) && inclinationDeg > 0 && inclinationDeg <= 90)) {
    throw new RangeError("inclination must be in (0, 90] degrees");
  }
  if (!Number.isInteger(samples) || samples < 8) throw new RangeError("samples must be an integer of at least 8");
  const spin = Math.abs(a);
  const theta = (inclinationDeg * Math.PI) / 180;
  const sinT = Math.sin(theta), cosT = Math.cos(theta);

  if (spin < 1e-12) {
    // Schwarzschild: the circle, sampled so the loop closes exactly.
    const radius = SCHWARZSCHILD_CRITICAL_B * M;
    const alpha = [], beta = [];
    for (let i = 0; i <= samples; i++) {
      const phi = (i / samples) * 2 * Math.PI;
      alpha.push(radius * Math.cos(phi));
      beta.push(radius * Math.sin(phi));
    }
    return { alpha, beta, closed: true, spin: 0, inclinationDeg };
  }

  const { prograde, retrograde } = sphericalOrbitRadii(spin, M);
  const alpha = [], beta = [];
  // Sweep the orbit radius; each radius gives one (α, ±β) pair on the curve.
  for (let i = 0; i <= samples; i++) {
    const r = prograde + ((retrograde - prograde) * i) / samples;
    const xi = xiOf(r, spin, M);
    const eta = etaOf(r, spin, M);
    const arg = eta + spin * spin * cosT * cosT - xi * xi * (cosT * cosT) / (sinT * sinT);
    const b = arg >= 0 ? Math.sqrt(arg) : 0;
    alpha.push(-xi / sinT);
    beta.push(b);
  }
  // Close the loop: the negative-β branch, walked backwards.
  for (let i = samples; i >= 0; i--) {
    alpha.push(alpha[i]);
    beta.push(-beta[i]);
  }
  return { alpha, beta, closed: true, spin, inclinationDeg };
}

/** The shadow's angular diameter in microarcseconds for a mass and distance. */
export function shadowDiameterMicroarcsec({ massSolar, distanceMpc, a = 0, inclinationDeg = 90 }) {
  const G = 6.6743e-11, c = 299792458, Msun = 1.98847e30, Mpc = 3.0856775814913673e22;
  const rad2uas = (180 / Math.PI) * 3600 * 1e6;
  // The critical impact parameter in metres: √27 GM/c² for Schwarzschild, the equatorial edge for Kerr.
  const curve = criticalCurve({ a, inclinationDeg, M: 1 });
  const bMax = Math.max(...curve.alpha.map((alpha, i) => Math.hypot(alpha, curve.beta[i])));
  const impact = bMax * G * massSolar * Msun / (c * c);
  return (2 * impact) / (distanceMpc * Mpc) * rad2uas;
}

/**
 * The demagnification of the n-th photon sub-ring: each half orbit costs a factor e^{−γ}, where γ is the
 * Lyapunov exponent of the unstable photon orbit.
 *
 * For Schwarzschild γ = π exactly, so consecutive rings are fainter by e^{−π} ≈ 0.0432. For Kerr the exponent
 * depends on the spin and on which side of the shadow the ring is; this returns the Schwarzschild value always
 * and the Kerr value only as a stated approximation, because the general expression needs the full Lyapunov
 * calculation the reference performs.
 */
export function subringDemagnification(n, { a = 0 } = {}) {
  if (!Number.isInteger(n) || n < 1) throw new RangeError("n must be a positive integer");
  const gamma = Math.abs(a) < 1e-12 ? Math.PI : Math.PI * (1 + 0.12 * Math.abs(a));
  return Math.exp(-gamma * n);
}

/** The same number as a fraction, for the caption: e^{-π} for the first sub-ring. */
export function firstSubringFraction({ a = 0 } = {}) {
  return subringDemagnification(1, { a });
}

export function registerKerrShadowProvenance(register) {
  return register(KERR_SHADOW_PROVENANCE.id, KERR_SHADOW_PROVENANCE);
}
