/**
 * Thin accretion-disk thermodynamics and relativistic frequency shifts.
 *
 * Model status
 * ------------
 * `pageThorneFluxGeometric` evaluates the *exact* Page & Thorne (1974)
 * time-averaged flux expression for a geometrically thin, optically thick disk
 * in the equatorial plane of a Kerr black hole, under that paper's stated
 * assumptions: a stationary axisymmetric flow, circular geodesic orbits, no
 * torque at the inner boundary, and zero stress at the ISCO. The only
 * approximation in this module is the numerical quadrature used to evaluate
 * the radial integral; it is a fixed-node Gauss-Legendre rule, so results are
 * deterministic and reproducible bit-for-bit.
 *
 * `newtonianDiskFluxGeometric` is the non-relativistic Shakura-Sunyaev limit
 * 3 Mdot / (8 pi r^3) * (1 - sqrt(r_in / r)). It is provided as a labelled
 * approximation and is used to test the relativistic expression's limits.
 *
 * Units
 * -----
 * All functions whose name ends in `Geometric` work in G = c = M = 1 units:
 * lengths in GM/c^2, times in GM/c^3, mass rates in c^3/G, and energy fluxes in
 * c^9/(G^3 M^2). Functions ending in `SI` or `Kelvin` convert explicitly using
 * the helpers in `./constants.mjs`.
 *
 * References
 * ----------
 * Page, D. N. & Thorne, K. S. (1974), "Disk-Accretion onto a Black Hole. I.",
 *   ApJ 191, 499. doi:10.1086/152990
 * Novikov, I. D. & Thorne, K. S. (1973), in Black Holes (Les Astres Occluses).
 * Bardeen, J. M., Press, W. H. & Teukolsky, S. A. (1972), "Rotating Black
 *   Holes: Locally Nonrotating Frames, Energy Extraction, and Scalar
 *   Synchrotron Radiation", ApJ 178, 347. doi:10.1086/151796
 */

import {
  assertFiniteNumber,
  assertNonNegativeNumber,
  assertPositiveInteger,
  assertPositiveNumber,
  assertSpinParameter,
  geometricFluxToSI,
  geometricTemperatureToKelvin,
  massKilograms,
  HBAR,
  G,
  C,
  KB,
} from "./constants.mjs";
import { kerrIsco, kerrMetricComponents } from "./kerr.mjs";

/** Default quadrature order for the Page-Thorne radial integral. */
export const DEFAULT_QUADRATURE_ORDER = 64;

const legendreCache = new Map();

/**
 * Deterministic Gauss-Legendre nodes and weights on [-1, 1].
 *
 * Nodes are found by Newton iteration on the Legendre polynomial recurrence
 * (the classical `gauleg` scheme), so the rule is identical on every engine
 * and every run. Results are cached per order.
 *
 * @param {number} order number of nodes, a positive integer
 * @returns {{order: number, nodes: Float64Array, weights: Float64Array}}
 */
export function gaussLegendreNodes(order) {
  assertPositiveInteger(order, "order");
  const cached = legendreCache.get(order);
  if (cached) return cached;
  const nodes = new Float64Array(order);
  const weights = new Float64Array(order);
  const half = (order + 1) >> 1;
  for (let i = 0; i < half; i += 1) {
    let z = Math.cos((Math.PI * (i + 0.75)) / (order + 0.5));
    let derivative = 0;
    for (let iteration = 0; iteration < 100; iteration += 1) {
      let previous = 1;
      let current = 0;
      for (let j = 0; j < order; j += 1) {
        const before = current;
        current = previous;
        previous = ((2 * (j + 1) - 1) * z * current - j * before) / (j + 1);
      }
      derivative = (order * (z * previous - current)) / (z * z - 1);
      const next = z - previous / derivative;
      const converged = Math.abs(next - z) <= 1e-15;
      z = next;
      if (converged) break;
    }
    const weight = 2 / ((1 - z * z) * derivative * derivative);
    nodes[i] = -z;
    nodes[order - 1 - i] = z;
    weights[i] = weight;
    weights[order - 1 - i] = weight;
  }
  const rule = Object.freeze({ order, nodes, weights });
  legendreCache.set(order, rule);
  return rule;
}

/**
 * Integrate `f` over [a, b] with a fixed-node Gauss-Legendre rule.
 * @param {(x: number) => number} f
 * @param {number} a
 * @param {number} b
 * @param {number} [order]
 * @returns {number}
 */
export function gaussLegendreIntegrate(f, a, b, order = DEFAULT_QUADRATURE_ORDER) {
  if (typeof f !== "function") throw new TypeError("f must be a function");
  const lower = assertFiniteNumber(a, "a");
  const upper = assertFiniteNumber(b, "b");
  if (upper === lower) return 0;
  const { nodes, weights } = gaussLegendreNodes(order);
  const halfSpan = (upper - lower) / 2;
  const midpoint = (lower + upper) / 2;
  let sum = 0;
  for (let i = 0; i < nodes.length; i += 1) sum += weights[i] * f(midpoint + halfSpan * nodes[i]);
  return sum * halfSpan;
}

/**
 * Circular equatorial geodesic orbit in the Kerr exterior.
 *
 * Exact closed forms in Boyer-Lindquist coordinates with G = c = M = 1. The
 * sign convention is `s = +1` for prograde (co-rotating) and `s = -1` for
 * retrograde orbits, matching Bardeen, Press & Teukolsky (1972) eq. (2.12).
 *
 * @param {number} aStar dimensionless spin, |a*| <= 1
 * @param {number} r Boyer-Lindquist radius in GM/c^2
 * @param {{prograde?: boolean}} [options]
 * @returns {{
 *   aStar: number, r: number, prograde: boolean, sign: number,
 *   omega: number, omegaDerivative: number,
 *   energy: number, energyDerivative: number,
 *   angularMomentum: number, angularMomentumDerivative: number,
 *   timeComponent: number, specificEnergyFromMetric: number,
 *   specificAngularMomentumFromMetric: number,
 * }}
 */
export function kerrCircularOrbit(aStar, r, { prograde = true } = {}) {
  const spin = assertSpinParameter(aStar);
  const radius = assertPositiveNumber(r, "r");
  if (typeof prograde !== "boolean") throw new TypeError("prograde must be a boolean");
  const sign = prograde ? 1 : -1;
  const rootR = Math.sqrt(radius);
  const denominator = radius ** 1.5 - 3 * rootR + 2 * sign * spin;
  if (!(denominator > 0)) {
    throw new RangeError(
      `r must exceed the ${prograde ? "prograde" : "retrograde"} photon sphere for a circular orbit; received r = ${radius}`,
    );
  }
  const rootDenominator = Math.sqrt(denominator);
  const weight = radius ** 0.75 * rootDenominator;
  const energyNumerator = radius ** 1.5 - 2 * rootR + sign * spin;
  const angularMomentumNumerator = sign * (radius * radius - 2 * sign * spin * rootR + spin * spin);
  const energy = energyNumerator / weight;
  const angularMomentum = angularMomentumNumerator / weight;
  const omegaDenominator = radius ** 1.5 + sign * spin;
  const omega = sign / omegaDenominator;
  const omegaDerivative = (-sign * 1.5 * rootR) / (omegaDenominator * omegaDenominator);
  const denominatorDerivative = 1.5 * rootR - 1.5 / rootR;
  const weightDerivative =
    0.75 * radius ** -0.25 * rootDenominator + (radius ** 0.75 * denominatorDerivative) / (2 * rootDenominator);
  const energyNumeratorDerivative = 1.5 * rootR - 1 / rootR;
  const angularMomentumNumeratorDerivative = sign * (2 * radius - (sign * spin) / rootR);
  const energyDerivative =
    (energyNumeratorDerivative * weight - energyNumerator * weightDerivative) / (weight * weight);
  const angularMomentumDerivative =
    (angularMomentumNumeratorDerivative * weight - angularMomentumNumerator * weightDerivative) / (weight * weight);
  const metric = kerrMetricComponents(spin, radius, Math.PI / 2);
  const norm = -(metric.gTT + 2 * omega * metric.gTPhi + omega * omega * metric.gPhiPhi);
  if (!(norm > 0)) {
    throw new RangeError(`circular orbit at r = ${radius} is not timelike for a* = ${spin}`);
  }
  const timeComponent = 1 / Math.sqrt(norm);
  return {
    aStar: spin,
    r: radius,
    prograde,
    sign,
    omega,
    omegaDerivative,
    energy,
    energyDerivative,
    angularMomentum,
    angularMomentumDerivative,
    timeComponent,
    specificEnergyFromMetric: -(metric.gTT + omega * metric.gTPhi) * timeComponent,
    specificAngularMomentumFromMetric: (metric.gTPhi + omega * metric.gPhiPhi) * timeComponent,
  };
}

/**
 * Page & Thorne (1974) time-averaged radiative flux, in geometric units.
 *
 *   F(r) = Mdot / (4 pi r) * (-dOmega/dr) / (E - Omega L)^2
 *          * Integral_{r_in}^{r} (E - Omega L) (dL/dr) dr
 *
 * The integral is evaluated with a fixed-node Gauss-Legendre rule, so the
 * result is deterministic. `F` is exactly zero for `r <= innerRadius`, which
 * encodes the zero-torque inner boundary condition at the ISCO.
 *
 * @param {{
 *   aStar?: number, r: number, massRate?: number, prograde?: boolean,
 *   innerRadius?: number, quadratureOrder?: number,
 * }} options
 * @returns {number} geometric energy flux in c^9/(G^3 M^2)
 */
export function pageThorneFluxGeometric({
  aStar = 0,
  r,
  massRate = 1,
  prograde = true,
  innerRadius,
  quadratureOrder = DEFAULT_QUADRATURE_ORDER,
} = {}) {
  const spin = assertSpinParameter(aStar);
  const radius = assertPositiveNumber(r, "r");
  const rate = assertNonNegativeNumber(massRate, "massRate");
  if (typeof prograde !== "boolean") throw new TypeError("prograde must be a boolean");
  const inner = innerRadius === undefined
    ? kerrIsco(spin, { prograde })
    : assertPositiveNumber(innerRadius, "innerRadius");
  assertPositiveInteger(quadratureOrder, "quadratureOrder");
  if (radius <= inner) return 0;
  const orbit = kerrCircularOrbit(spin, radius, { prograde });
  const innerOrbit = kerrCircularOrbit(spin, inner, { prograde });
  const integrand = (radiusPrime) => {
    const local = kerrCircularOrbit(spin, radiusPrime, { prograde });
    return (local.energy - local.omega * local.angularMomentum) * local.angularMomentumDerivative;
  };
  const integral = gaussLegendreIntegrate(integrand, inner, radius, quadratureOrder);
  const frameEnergy = orbit.energy - orbit.omega * orbit.angularMomentum;
  const innerFrameEnergy = innerOrbit.energy - innerOrbit.omega * innerOrbit.angularMomentum;
  if (!(frameEnergy > 0) || !(innerFrameEnergy > 0)) {
    throw new RangeError(`circular orbit at r = ${radius} has a non-positive comoving energy`);
  }
  return (rate / (4 * Math.PI * radius)) * (-orbit.omegaDerivative) / (frameEnergy * frameEnergy) * integral;
}

/**
 * Page & Thorne flux converted to SI watts per square metre.
 * @param {Parameters<typeof pageThorneFluxGeometric>[0] & {massSolar: number}} options
 * @returns {number} W m^-2
 */
export function pageThorneFluxSI(options = {}) {
  const { massSolar, ...rest } = options;
  return geometricFluxToSI(pageThorneFluxGeometric(rest), massSolar);
}

/**
 * Non-relativistic Shakura-Sunyaev flux, in geometric units.
 *
 *   F(r) = 3 Mdot / (8 pi r^3) * (1 - sqrt(r_in / r))
 *
 * Labelled approximation: it is the leading-order limit of the Page-Thorne
 * expression and is used to test that expression's limits, not as a model of
 * the relativistic disk.
 *
 * @param {{r: number, massRate?: number, innerRadius?: number}} options
 * @returns {number}
 */
export function newtonianDiskFluxGeometric({ r, massRate = 1, innerRadius = 6 } = {}) {
  const radius = assertPositiveNumber(r, "r");
  const rate = assertNonNegativeNumber(massRate, "massRate");
  const inner = assertPositiveNumber(innerRadius, "innerRadius");
  if (radius <= inner) return 0;
  return ((3 * rate) / (8 * Math.PI * radius ** 3)) * (1 - Math.sqrt(inner / radius));
}

/**
 * Geometric Stefan-Boltzmann constant for the temperature convention used by
 * `./constants.mjs`.
 *
 * `geometricTemperatureUnitKelvin` measures temperature in units of
 * hbar c^3 / (G M k_B) (the Hawking scale, so T_H = 1/(8 pi) geometrically),
 * while `geometricFluxToSI` measures flux in c^9/(G^3 M^2). Requiring
 * F = sigma T^4 in both systems fixes
 *
 *   sigma_geom = pi^2 hbar c / (60 G M^2).
 *
 * @param {number} massSolar
 * @returns {number} geometric flux per geometric temperature^4
 */
export function geometricStefanBoltzmannConstant(massSolar) {
  const mass = massKilograms(assertPositiveNumber(massSolar, "massSolar"));
  return (Math.PI ** 2 * HBAR * C) / (60 * G * mass * mass);
}

/**
 * Effective blackbody temperature of a disk annulus, in kelvin.
 * @param {number} fluxGeometric geometric flux in c^9/(G^3 M^2)
 * @param {number} massSolar
 * @returns {number} K
 */
export function diskEffectiveTemperatureKelvin(fluxGeometric, massSolar) {
  const flux = assertNonNegativeNumber(fluxGeometric, "fluxGeometric");
  const sigma = geometricStefanBoltzmannConstant(massSolar);
  if (flux === 0) return 0;
  return geometricTemperatureToKelvin((flux / sigma) ** 0.25, massSolar);
}

/**
 * Effective temperature in the geometric temperature unit.
 * @param {number} fluxGeometric
 * @param {number} massSolar
 * @returns {number}
 */
export function diskEffectiveTemperatureGeometric(fluxGeometric, massSolar) {
  const flux = assertNonNegativeNumber(fluxGeometric, "fluxGeometric");
  const sigma = geometricStefanBoltzmannConstant(massSolar);
  return flux === 0 ? 0 : (flux / sigma) ** 0.25;
}

/* ---------- Relativistic frequency shifts ---------- */

/**
 * Gravitational plus transverse time-dilation factor for an emitter on a
 * circular equatorial orbit: g_grav = 1 / u^t.
 *
 * This is the part of the total shift that survives when the photon's
 * conserved energy and angular momentum are ignored. It is *not* the total
 * shift; multiply by `kerrOrbitalDopplerFactor` to obtain it.
 *
 * @param {number} aStar
 * @param {number} r
 * @param {{prograde?: boolean}} [options]
 * @returns {number}
 */
export function kerrGravitationalRedshiftOrbiting(aStar, r, options = {}) {
  return 1 / kerrCircularOrbit(aStar, r, options).timeComponent;
}

/**
 * Orbital Doppler / beaming factor for a photon with conserved energy `E` and
 * axial angular momentum `Lz` emitted by matter with angular velocity `Omega`:
 *
 *   g_orb = E / (E - Omega Lz) = 1 / (1 - Omega b),  b = Lz / E.
 *
 * @param {{energy: number, angularMomentum: number, omega: number, lz: number}} options
 * @returns {number}
 */
export function kerrOrbitalDopplerFactor({ energy, angularMomentum, omega, lz } = {}) {
  const E = assertFiniteNumber(energy, "energy");
  const L = assertFiniteNumber(angularMomentum, "angularMomentum");
  const O = assertFiniteNumber(omega, "omega");
  const Lz = assertFiniteNumber(lz, "lz");
  if (!(E > 0)) throw new RangeError(`energy must be positive for a future-directed photon; received ${E}`);
  const denominator = E - O * Lz;
  if (!(denominator > 0)) {
    throw new RangeError(`E - Omega Lz must be positive; received ${denominator}`);
  }
  return E / denominator;
}

/**
 * Total redshift factor g = nu_observed / nu_emitted for a photon emitted by
 * circularly orbiting matter.
 *
 * The decomposition is exact and free of double counting:
 *
 *   g_total = g_grav * g_orb = E / (u^t (E - Omega Lz)).
 *
 * `g_grav` carries the gravitational and transverse-Doppler time dilation of
 * the emitter; `g_orb` carries the line-of-sight beaming. Neither factor
 * contains the other, and their product is the full shift.
 *
 * @param {{
 *   aStar: number, r: number, prograde?: boolean,
 *   energy: number, lz: number,
 * }} options
 * @returns {{total: number, gravitational: number, orbital: number, timeComponent: number}}
 */
export function kerrTotalRedshiftFactor({ aStar, r, prograde = true, energy, lz } = {}) {
  const orbit = kerrCircularOrbit(aStar, r, { prograde });
  const gravitational = 1 / orbit.timeComponent;
  const orbital = kerrOrbitalDopplerFactor({
    energy,
    angularMomentum: orbit.angularMomentum,
    omega: orbit.omega,
    lz,
  });
  return {
    total: gravitational * orbital,
    gravitational,
    orbital,
    timeComponent: orbit.timeComponent,
  };
}

/**
 * Gravitational redshift of a *static* emitter, g = sqrt(-g_tt).
 *
 * Distinct from `kerrGravitationalRedshiftOrbiting`: a static observer has no
 * orbital motion, so this factor contains no Doppler contribution. It is
 * undefined inside the ergosphere, where no static observer exists.
 *
 * @param {number} aStar
 * @param {number} r
 * @param {number} [theta] polar angle in radians
 * @returns {number}
 */
export function kerrGravitationalRedshiftStatic(aStar, r, theta = Math.PI / 2) {
  const spin = assertSpinParameter(aStar);
  const radius = assertPositiveNumber(r, "r");
  const polar = assertFiniteNumber(theta, "theta");
  const metric = kerrMetricComponents(spin, radius, polar);
  const norm = -metric.gTT;
  if (!(norm > 0)) {
    throw new RangeError(`no static observer exists at r = ${radius}, theta = ${polar} (inside the ergosphere)`);
  }
  return Math.sqrt(norm);
}

/**
 * Observed effective temperature of a disk annulus after a shift factor g.
 * @param {number} emittedKelvin
 * @param {number} g
 * @returns {number} K
 */
export function observedTemperatureKelvin(emittedKelvin, g) {
  const emitted = assertNonNegativeNumber(emittedKelvin, "emittedKelvin");
  const factor = assertPositiveNumber(g, "g");
  return emitted * factor;
}

/**
 * Boltzmann constant re-exported for callers that build their own temperature
 * conversions without importing `./constants.mjs` directly.
 */
export { KB };
