/*
 * Physical constants, geometric-unit conventions, and shared input validation
 * for the HORIZON scientific core.
 *
 * Unit system
 * -----------
 * Every geodesic, disk, and thermodynamic routine in js/science works in
 * geometric units with G = c = 1 and the black-hole mass M = 1. Lengths are
 * therefore in GM/c^2, times in GM/c^3, and angular momenta in GM^2/c. The
 * explicit `geometric*To*` / `*ToGeometric*` helpers below are the only place
 * where SI values enter or leave the core, so a caller can always recover
 * metres, seconds, kelvin, or watts without re-deriving a conversion.
 *
 * Temperature convention
 * ----------------------
 * The geometric temperature unit is tied to the black hole: T_unit =
 * hbar c^3 / (G M k_B). With that choice the Schwarzschild Hawking temperature
 * is exactly T_geom = 1/(8 pi), matching the standard G = c = hbar = k_B = 1
 * convention used in the black-hole thermodynamics literature.
 *
 * References
 * ----------
 * - CODATA 2018 recommended values (G, hbar, k_B, M_sun).
 * - Misner, Thorne & Wheeler, "Gravitation" (1973), geometric-unit appendix.
 */

/* ---------- Fundamental constants (SI) ---------- */

/** Newtonian constant of gravitation, m^3 kg^-1 s^-2 (CODATA 2018). */
export const G = 6.67430e-11;
/** Speed of light in vacuum, m s^-1 (exact, SI definition). */
export const C = 299792458;
/** Reduced Planck constant, J s (CODATA 2018). */
export const HBAR = 1.054571817e-34;
/** Planck constant, J s (exact, SI definition). */
export const H_PLANCK = 6.62607015e-34;
/** Boltzmann constant, J K^-1 (exact, SI definition). */
export const KB = 1.380649e-23;
/** Nominal solar mass, kg (IAU 2015 nominal value). */
export const SOLAR_MASS = 1.98847e30;
/** Stefan-Boltzmann constant, W m^-2 K^-4 (derived from exact SI constants). */
export const STEFAN_BOLTZMANN = 5.670374419e-8;
/** Wien displacement-law constant b = h c / (k_B x_max), m K. */
export const WIEN_DISPLACEMENT_B = 2.897771955e-3;

/* Aliases kept explicit so call sites read like the physics. */
export const GRAVITATIONAL_CONSTANT = G;
export const SPEED_OF_LIGHT = C;
export const PLANCK_H = H_PLANCK;
export const BOLTZMANN_K = KB;
export const SOLAR_MASS_KG = SOLAR_MASS;

/** Largest dimensionless spin magnitude the Kerr exterior admits. */
export const MAX_SPIN_MAGNITUDE = 1;

/* ---------- Validation helpers ---------- */

function describe(value) {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "object") return Array.isArray(value) ? "an array" : "an object";
  return typeof value;
}

/**
 * Require a finite real number.
 * @param {unknown} value
 * @param {string} name
 * @returns {number}
 */
export function assertFiniteNumber(value, name) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (typeof value === "boolean" || value === null || value === "" || !Number.isFinite(numeric)) {
    throw new TypeError(`${name} must be a finite number; received ${describe(value)}`);
  }
  return numeric;
}

/**
 * Require a finite number strictly greater than zero.
 * @param {unknown} value
 * @param {string} name
 * @returns {number}
 */
export function assertPositiveNumber(value, name) {
  const numeric = assertFiniteNumber(value, name);
  if (!(numeric > 0)) {
    throw new RangeError(`${name} must be greater than zero; received ${numeric}`);
  }
  return numeric;
}

/**
 * Require a finite number greater than or equal to zero.
 * @param {unknown} value
 * @param {string} name
 * @returns {number}
 */
export function assertNonNegativeNumber(value, name) {
  const numeric = assertFiniteNumber(value, name);
  if (numeric < 0) {
    throw new RangeError(`${name} must be non-negative; received ${numeric}`);
  }
  return numeric;
}

/**
 * Require a positive integer.
 * @param {unknown} value
 * @param {string} name
 * @returns {number}
 */
export function assertPositiveInteger(value, name) {
  const numeric = assertFiniteNumber(value, name);
  if (!Number.isInteger(numeric) || numeric < 1) {
    throw new RangeError(`${name} must be a positive integer; received ${numeric}`);
  }
  return numeric;
}

/**
 * Require a dimensionless spin a* inside the Kerr domain |a*| <= 1.
 * @param {unknown} value
 * @param {string} [name]
 * @returns {number}
 */
export function assertSpinParameter(value, name = "aStar") {
  const numeric = assertFiniteNumber(value, name);
  if (Math.abs(numeric) > MAX_SPIN_MAGNITUDE) {
    throw new RangeError(
      `${name} must satisfy |a*| <= ${MAX_SPIN_MAGNITUDE} for a Kerr exterior; received ${numeric}`,
    );
  }
  return numeric;
}

/**
 * Require a strictly positive mass in solar masses.
 * @param {unknown} value
 * @param {string} [name]
 * @returns {number}
 */
export function assertMassSolar(value, name = "massSolar") {
  return assertPositiveNumber(value, name);
}

/**
 * Require a strictly positive absolute temperature in kelvin.
 * @param {unknown} value
 * @param {string} [name]
 * @returns {number}
 */
export function assertTemperature(value, name = "temperatureK") {
  return assertPositiveNumber(value, name);
}

/**
 * Require a strictly positive wavelength in metres.
 * @param {unknown} value
 * @param {string} [name]
 * @returns {number}
 */
export function assertWavelength(value, name = "wavelengthMeters") {
  return assertPositiveNumber(value, name);
}

/**
 * Require a strictly positive integration tolerance.
 * @param {unknown} value
 * @param {string} name
 * @returns {number}
 */
export function assertTolerance(value, name) {
  const numeric = assertFiniteNumber(value, name);
  if (!(numeric > 0)) {
    throw new RangeError(`${name} must be a strictly positive tolerance; received ${numeric}`);
  }
  return numeric;
}

/**
 * Require a strictly positive integration step size.
 * @param {unknown} value
 * @param {string} name
 * @returns {number}
 */
export function assertStepSize(value, name) {
  const numeric = assertFiniteNumber(value, name);
  if (!(numeric > 0)) {
    throw new RangeError(`${name} must be a strictly positive step size; received ${numeric}`);
  }
  return numeric;
}

/**
 * Require a strictly positive step ceiling, which may be `Infinity` to mean
 * "unbounded". Used for the maximum-step guard of the adaptive driver.
 * @param {unknown} value
 * @param {string} name
 * @returns {number}
 */
export function assertStepCeiling(value, name) {
  if (value === Infinity) return Infinity;
  return assertStepSize(value, name);
}

/**
 * Require a finite state vector (array or typed array) with no NaN/Infinity.
 * @param {ArrayLike<number>} state
 * @param {string} [name]
 * @returns {ArrayLike<number>}
 */
export function assertFiniteState(state, name = "state") {
  if (!state || typeof state.length !== "number" || state.length === 0) {
    throw new TypeError(`${name} must be a non-empty array-like of numbers`);
  }
  for (let index = 0; index < state.length; index += 1) {
    if (!Number.isFinite(state[index])) {
      throw new RangeError(`${name}[${index}] must be finite; received ${describe(state[index])}`);
    }
  }
  return state;
}

/* ---------- Geometric <-> SI conversions ---------- */

/** Mass scale M = massSolar * M_sun in kilograms. */
export function massKilograms(massSolar) {
  return assertMassSolar(massSolar) * SOLAR_MASS;
}

/** Length unit GM/c^2 in metres. */
export function geometricLengthUnitMeters(massSolar) {
  return (G * massKilograms(massSolar)) / (C * C);
}

/** Time unit GM/c^3 in seconds. */
export function geometricTimeUnitSeconds(massSolar) {
  return (G * massKilograms(massSolar)) / (C * C * C);
}

/** Temperature unit hbar c^3 / (G M k_B) in kelvin. */
export function geometricTemperatureUnitKelvin(massSolar) {
  return (HBAR * C * C * C) / (G * massKilograms(massSolar) * KB);
}

/** Convert a geometric length (GM/c^2) to metres. */
export function geometricLengthToMeters(length, massSolar) {
  return assertFiniteNumber(length, "length") * geometricLengthUnitMeters(massSolar);
}

/** Convert metres to a geometric length (GM/c^2). */
export function metersToGeometricLength(meters, massSolar) {
  return assertFiniteNumber(meters, "meters") / geometricLengthUnitMeters(massSolar);
}

/** Convert a geometric time (GM/c^3) to seconds. */
export function geometricTimeToSeconds(time, massSolar) {
  return assertFiniteNumber(time, "time") * geometricTimeUnitSeconds(massSolar);
}

/** Convert seconds to a geometric time (GM/c^3). */
export function secondsToGeometricTime(seconds, massSolar) {
  return assertFiniteNumber(seconds, "seconds") / geometricTimeUnitSeconds(massSolar);
}

/** Convert a geometric mass (M = 1) to kilograms. */
export function geometricMassToKilograms(mass, massSolar) {
  return assertFiniteNumber(mass, "mass") * massKilograms(massSolar);
}

/** Convert a geometric frequency (c^3/GM) to hertz. */
export function geometricFrequencyToHertz(frequency, massSolar) {
  return assertFiniteNumber(frequency, "frequency") / geometricTimeUnitSeconds(massSolar);
}

/** Convert hertz to a geometric frequency (c^3/GM). */
export function hertzToGeometricFrequency(hertz, massSolar) {
  return assertFiniteNumber(hertz, "hertz") * geometricTimeUnitSeconds(massSolar);
}

/** Convert a geometric temperature to kelvin. */
export function geometricTemperatureToKelvin(temperature, massSolar) {
  return assertFiniteNumber(temperature, "temperature") * geometricTemperatureUnitKelvin(massSolar);
}

/** Convert kelvin to a geometric temperature. */
export function kelvinToGeometricTemperature(kelvin, massSolar) {
  return assertFiniteNumber(kelvin, "kelvin") / geometricTemperatureUnitKelvin(massSolar);
}

/** Convert a geometric luminosity (c^5/G) to watts. */
export function geometricLuminosityToWatts(luminosity, massSolar) {
  assertMassSolar(massSolar);
  return (assertFiniteNumber(luminosity, "luminosity") * C ** 5) / G;
}

/** Convert a geometric mass rate (c^3/G) to kg s^-1. */
export function geometricMassRateToKgPerSecond(massRate, massSolar) {
  assertMassSolar(massSolar);
  return (assertFiniteNumber(massRate, "massRate") * C ** 3) / G;
}

/** Convert kg s^-1 to a geometric mass rate (c^3/G). */
export function kgPerSecondToGeometricMassRate(kgPerSecond, massSolar) {
  assertMassSolar(massSolar);
  return (assertFiniteNumber(kgPerSecond, "kgPerSecond") * G) / C ** 3;
}

/** Convert a geometric angular momentum (GM^2/c) to kg m^2 s^-1. */
export function geometricAngularMomentumToSI(angularMomentum, massSolar) {
  const mass = massKilograms(massSolar);
  return (assertFiniteNumber(angularMomentum, "angularMomentum") * G * mass * mass) / C;
}

/**
 * Convert a geometric energy flux (energy per area per geometric time) to
 * W m^-2. The unit is c^9 / (G^3 M^2).
 */
export function geometricFluxToSI(flux, massSolar) {
  const mass = massKilograms(massSolar);
  return (assertFiniteNumber(flux, "flux") * C ** 9) / (G ** 3 * mass * mass);
}

/** Convert W m^-2 to a geometric energy flux. */
export function siFluxToGeometric(fluxSI, massSolar) {
  const mass = massKilograms(massSolar);
  return (assertFiniteNumber(fluxSI, "fluxSI") * G ** 3 * mass * mass) / C ** 9;
}

/** Convert a geometric energy (M c^2) to joules. */
export function geometricEnergyToJoules(energy, massSolar) {
  return assertFiniteNumber(energy, "energy") * massKilograms(massSolar) * C * C;
}
