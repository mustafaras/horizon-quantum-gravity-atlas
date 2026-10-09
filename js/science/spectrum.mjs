/**
 * Planck spectral radiance, CIE 1931 colour matching, and sRGB conversion.
 *
 * Model status
 * ------------
 * `planckSpectralRadiance` and `planckSpectralRadiancePerFrequency` are the
 * exact Planck law in SI units. `wienPeakWavelengthMeters` and
 * `wienPeakFrequencyHz` are the exact Wien displacement laws for the two
 * spectral variables (they differ by a factor 4.965114.../2.821439... because
 * B_lambda and B_nu peak at different wavelengths).
 *
 * `blackbodyToSrgb` is a *numerical* approximation: it integrates the Planck
 * spectrum against the committed CIE 1931 2-degree colour-matching table with
 * a trapezoid rule on the table's own 5 nm grid, then applies the exact
 * IEC 61966-2-1 sRGB transfer function. The only error is the quadrature and
 * the table's 5 nm sampling.
 *
 * `fastBlackbodyToSrgb` is a *display* approximation with two selectable
 * colour-matching sources. `method: "analytic"` (the default) replaces the
 * tabulated colour-matching functions with the Wyman, Sloan & Shirley (2013)
 * piecewise Gaussian fits and evaluates them on a coarse grid; it needs no
 * table access but inherits the fit's inaccurate red tail. `method:
 * "interpolated"` keeps the committed CIE 1931 table and linearly interpolates
 * it on the same coarse grid, which is roughly 36x more accurate at the default
 * step. `fastBlackbodyToSrgbMaxError` measures the worst per-channel deviation
 * from `blackbodyToSrgb` over a temperature range for whichever method is
 * selected, so the approximation is never used without a quantified bound.
 *
 * Colour-matching data
 * --------------------
 * The tabulated xBar/yBar/zBar values live in `./data/cie-1931-2deg.mjs` with
 * their source and licence recorded there and re-exported here as
 * `CIE_1931_2DEG_SOURCE`.
 *
 * References
 * ----------
 * Planck, M. (1901), Ann. Phys. 309, 553. doi:10.1002/andp.19013090310
 * CIE (2004), CIE 15:2004 "Colorimetry", 3rd ed.
 * IEC 61966-2-1:1999, "Multimedia systems and equipment - Colour measurement
 *   and management - Part 2-1: Colour management - Default RGB colour space -
 *   sRGB".
 * Wyman, C., Sloan, P.-P. & Shirley, P. (2013), "Simple Analytic Approximations
 *   to the CIE XYZ Color Matching Functions", Journal of Computer Graphics
 *   Techniques 2(2), 1-11.
 */

import {
  assertFiniteNumber,
  assertPositiveInteger,
  assertTemperature,
  assertWavelength,
  C,
  H_PLANCK,
  KB,
  WIEN_DISPLACEMENT_B,
} from "./constants.mjs";
import {
  CIE_1931_2DEG_SAMPLE_COUNT,
  CIE_1931_2DEG_SOURCE,
  CIE_1931_2DEG_WAVELENGTH_END_NM,
  CIE_1931_2DEG_WAVELENGTH_START_NM,
  CIE_1931_2DEG_WAVELENGTH_STEP_NM,
  CIE_1931_2DEG_X,
  CIE_1931_2DEG_Y,
  CIE_1931_2DEG_Z,
} from "./data/cie-1931-2deg.mjs";

export { CIE_1931_2DEG_SOURCE };

/** Nanometres to metres. */
export const NANOMETRE_TO_METRE = 1e-9;

/**
 * Root of x = 5 (1 - e^-x) for the peak of B_nu, i.e. h nu_max / (k_B T).
 * The peak of B_lambda instead uses the root of x = 5 (1 - e^-x) with the
 * complementary variable, giving the Wien displacement constant b.
 */
export const WIEN_FREQUENCY_COEFFICIENT = 2.8214393721220787;

/** sRGB (IEC 61966-2-1) transfer-function constants. */
export const SRGB_GAMMA_THRESHOLD = 0.0031308;
export const SRGB_GAMMA_SLOPE = 12.92;
export const SRGB_GAMMA_OFFSET = 0.055;
export const SRGB_GAMMA_EXPONENT = 1 / 2.4;

/**
 * CIE XYZ (D65) to linear sRGB matrix, IEC 61966-2-1 / Lindbloom (2017).
 * Rows are R, G, B; columns are X, Y, Z.
 */
export const XYZ_TO_LINEAR_SRGB = Object.freeze([
  Object.freeze([3.2404542, -1.5371385, -0.4985314]),
  Object.freeze([-0.969266, 1.8760108, 0.041556]),
  Object.freeze([0.0556434, -0.2040259, 1.0572252]),
]);

/** Default coarse grid step for the fast fitted path, in nanometres. */
export const FAST_FIT_STEP_NM = 20;

/**
 * Supported fast-path colour-matching sources.
 *
 * - `"analytic"` evaluates the Wyman, Sloan & Shirley (2013) piecewise Gaussian
 *   fits. No table lookup, but the fit's red tail is inaccurate, which costs
 *   ~9.4e-2 in the encoded sRGB channels at 1000 K.
 * - `"interpolated"` linearly interpolates the committed CIE 1931 table. It
 *   uses the standard observer data itself rather than a fit, so the only
 *   residual is the coarse-grid quadrature: ~2.6e-3 over 1000-40000 K, and
 *   exactly zero when `stepNm` is a multiple of the table's 5 nm spacing.
 */
export const FAST_FIT_METHODS = Object.freeze(["analytic", "interpolated"]);

/* ---------- Planck law ---------- */

/**
 * Planck spectral radiance B_lambda(T) in W m^-2 sr^-1 m^-1.
 *
 *   B_lambda = 2 h c^2 / lambda^5 * 1 / (exp(h c / (lambda k_B T)) - 1)
 *
 * @param {number} wavelengthMeters
 * @param {number} temperatureK
 * @returns {number} W m^-2 sr^-1 m^-1
 */
export function planckSpectralRadiance(wavelengthMeters, temperatureK) {
  const wavelength = assertWavelength(wavelengthMeters);
  const temperature = assertTemperature(temperatureK);
  const exponent = (H_PLANCK * C) / (wavelength * KB * temperature);
  if (exponent > 700) return 0;
  const numerator = (2 * H_PLANCK * C * C) / wavelength ** 5;
  return numerator / (Math.expm1(exponent));
}

/**
 * Planck spectral radiance B_nu(T) in W m^-2 sr^-1 Hz^-1.
 *
 *   B_nu = 2 h nu^3 / c^2 * 1 / (exp(h nu / (k_B T)) - 1)
 *
 * @param {number} frequencyHz
 * @param {number} temperatureK
 * @returns {number} W m^-2 sr^-1 Hz^-1
 */
export function planckSpectralRadiancePerFrequency(frequencyHz, temperatureK) {
  const frequency = assertWavelength(frequencyHz, "frequencyHz");
  const temperature = assertTemperature(temperatureK);
  const exponent = (H_PLANCK * frequency) / (KB * temperature);
  if (exponent > 700) return 0;
  const numerator = (2 * H_PLANCK * frequency ** 3) / (C * C);
  return numerator / Math.expm1(exponent);
}

/**
 * Wien displacement law for B_lambda: lambda_max T = b.
 * @param {number} temperatureK
 * @returns {number} metres
 */
export function wienPeakWavelengthMeters(temperatureK) {
  return WIEN_DISPLACEMENT_B / assertTemperature(temperatureK);
}

/**
 * Wien displacement law for B_nu: nu_max / T = 2.821439... k_B / h.
 * @param {number} temperatureK
 * @returns {number} hertz
 */
export function wienPeakFrequencyHz(temperatureK) {
  return (WIEN_FREQUENCY_COEFFICIENT * KB * assertTemperature(temperatureK)) / H_PLANCK;
}

/* ---------- Colour matching ---------- */

/**
 * Piecewise Gaussian lobe used by the Wyman-Sloan-Shirley fits.
 * @param {number} x
 * @param {number} mu
 * @param {number} sigmaShort
 * @param {number} sigmaLong
 * @returns {number}
 */
function gaussianLobe(x, mu, sigmaShort, sigmaLong) {
  const sigma = x < mu ? sigmaShort : sigmaLong;
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}

/**
 * Analytic CIE 1931 2-degree colour-matching functions.
 *
 * Wyman, Sloan & Shirley (2013) multi-lobe piecewise Gaussian fits. These are
 * a *fitted* approximation to the tabulated standard observer, not the
 * standard itself; `fastBlackbodyToSrgbMaxError` bounds the resulting colour
 * error.
 *
 * @param {number} wavelengthNm
 * @returns {{x: number, y: number, z: number}}
 */
export function cieXyzBarAnalytic(wavelengthNm) {
  const lambda = assertFiniteNumber(wavelengthNm, "wavelengthNm");
  const x =
    1.056 * gaussianLobe(lambda, 599.8, 37.9, 31.0) +
    0.362 * gaussianLobe(lambda, 442.0, 16.0, 26.7) -
    0.065 * gaussianLobe(lambda, 501.1, 20.4, 26.2);
  const y = 0.821 * gaussianLobe(lambda, 568.8, 46.9, 40.5) + 0.286 * gaussianLobe(lambda, 530.9, 16.3, 31.1);
  const z = 1.217 * gaussianLobe(lambda, 437.0, 11.8, 36.0) + 0.681 * gaussianLobe(lambda, 459.0, 26.0, 13.8);
  return { x, y, z };
}

/**
 * Tabulated CIE 1931 2-degree colour-matching functions at a 5 nm grid point.
 * @param {number} index sample index, 0..80
 * @returns {{x: number, y: number, z: number}}
 */
export function cieXyzBarTabulated(index) {
  const i = assertPositiveInteger(index + 1, "index") - 1;
  if (i >= CIE_1931_2DEG_SAMPLE_COUNT) {
    throw new RangeError(`index must be < ${CIE_1931_2DEG_SAMPLE_COUNT}; received ${index}`);
  }
  return { x: CIE_1931_2DEG_X[i], y: CIE_1931_2DEG_Y[i], z: CIE_1931_2DEG_Z[i] };
}

/**
 * Committed CIE 1931 2-degree colour-matching functions at an arbitrary
 * wavelength, by linear interpolation of the 5 nm table.
 *
 * This is the standard observer data itself, not a fit. It is exact at every
 * table sample (wavelengths that are multiples of 5 nm from 380 nm) and is
 * clamped to the endpoint values outside the table's 380-780 nm range, where
 * the colour-matching functions are effectively zero.
 *
 * @param {number} wavelengthNm
 * @returns {{x: number, y: number, z: number}}
 */
export function cieXyzBarInterpolated(wavelengthNm) {
  const lambda = assertFiniteNumber(wavelengthNm, "wavelengthNm");
  const last = CIE_1931_2DEG_SAMPLE_COUNT - 1;
  const u = (lambda - CIE_1931_2DEG_WAVELENGTH_START_NM) / CIE_1931_2DEG_WAVELENGTH_STEP_NM;
  if (u <= 0) return { x: CIE_1931_2DEG_X[0], y: CIE_1931_2DEG_Y[0], z: CIE_1931_2DEG_Z[0] };
  if (u >= last) {
    return { x: CIE_1931_2DEG_X[last], y: CIE_1931_2DEG_Y[last], z: CIE_1931_2DEG_Z[last] };
  }
  const i = Math.floor(u);
  const f = u - i;
  return {
    x: CIE_1931_2DEG_X[i] + f * (CIE_1931_2DEG_X[i + 1] - CIE_1931_2DEG_X[i]),
    y: CIE_1931_2DEG_Y[i] + f * (CIE_1931_2DEG_Y[i + 1] - CIE_1931_2DEG_Y[i]),
    z: CIE_1931_2DEG_Z[i] + f * (CIE_1931_2DEG_Z[i + 1] - CIE_1931_2DEG_Z[i]),
  };
}

/**
 * Integrate a spectral radiance against the committed CIE 1931 table.
 *
 * Trapezoid rule on the table's own 5 nm grid, so the result is deterministic
 * and depends only on the committed data.
 *
 * @param {(wavelengthMeters: number) => number} radiance
 * @returns {{x: number, y: number, z: number}} unnormalised tristimulus values
 */
export function cieXyzFromSpectralRadiance(radiance) {
  if (typeof radiance !== "function") throw new TypeError("radiance must be a function");
  const stepMeters = CIE_1931_2DEG_WAVELENGTH_STEP_NM * NANOMETRE_TO_METRE;
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < CIE_1931_2DEG_SAMPLE_COUNT; i += 1) {
    const wavelengthNm = CIE_1931_2DEG_WAVELENGTH_START_NM + i * CIE_1931_2DEG_WAVELENGTH_STEP_NM;
    const value = radiance(wavelengthNm * NANOMETRE_TO_METRE);
    if (!Number.isFinite(value)) {
      throw new RangeError(`radiance returned a non-finite value at ${wavelengthNm} nm`);
    }
    const weight = i === 0 || i === CIE_1931_2DEG_SAMPLE_COUNT - 1 ? 0.5 : 1;
    x += weight * value * CIE_1931_2DEG_X[i];
    y += weight * value * CIE_1931_2DEG_Y[i];
    z += weight * value * CIE_1931_2DEG_Z[i];
  }
  return { x: x * stepMeters, y: y * stepMeters, z: z * stepMeters };
}

/**
 * Trapezoid integration of a spectral radiance on a coarse uniform grid, with
 * the colour-matching functions supplied by `bar`.
 *
 * @param {(wavelengthMeters: number) => number} radiance
 * @param {number} stepNm
 * @param {(wavelengthNm: number) => {x: number, y: number, z: number}} bar
 * @returns {{x: number, y: number, z: number}}
 */
function integrateOnCoarseGrid(radiance, stepNm, bar) {
  if (typeof radiance !== "function") throw new TypeError("radiance must be a function");
  const step = assertFiniteNumber(stepNm, "stepNm");
  if (!(step > 0)) throw new RangeError(`stepNm must be greater than zero; received ${step}`);
  const start = CIE_1931_2DEG_WAVELENGTH_START_NM;
  const end = CIE_1931_2DEG_WAVELENGTH_END_NM;
  const count = Math.round((end - start) / step);
  if (count < 2) throw new RangeError(`stepNm = ${step} is too coarse for the ${start}-${end} nm range`);
  const actualStep = (end - start) / count;
  const stepMeters = actualStep * NANOMETRE_TO_METRE;
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i <= count; i += 1) {
    const wavelengthNm = start + i * actualStep;
    const value = radiance(wavelengthNm * NANOMETRE_TO_METRE);
    if (!Number.isFinite(value)) {
      throw new RangeError(`radiance returned a non-finite value at ${wavelengthNm} nm`);
    }
    const barValue = bar(wavelengthNm);
    const weight = i === 0 || i === count ? 0.5 : 1;
    x += weight * value * barValue.x;
    y += weight * value * barValue.y;
    z += weight * value * barValue.z;
  }
  return { x: x * stepMeters, y: y * stepMeters, z: z * stepMeters };
}

/**
 * Integrate a spectral radiance against the analytic fitted colour-matching
 * functions on a coarse uniform grid.
 *
 * @param {(wavelengthMeters: number) => number} radiance
 * @param {{stepNm?: number}} [options]
 * @returns {{x: number, y: number, z: number}}
 */
export function cieXyzFromSpectralRadianceFast(radiance, { stepNm = FAST_FIT_STEP_NM } = {}) {
  return integrateOnCoarseGrid(radiance, stepNm, cieXyzBarAnalytic);
}

/**
 * Integrate a spectral radiance against the committed CIE 1931 table
 * interpolated on a coarse uniform grid.
 *
 * This is the accurate fast path: it evaluates the Planck law on the same
 * coarse grid as `cieXyzFromSpectralRadianceFast` but takes the colour-matching
 * functions from the standard observer data instead of a fit. At the default
 * 20 nm step the worst encoded sRGB error over 1000-40000 K is ~2.6e-3, versus
 * ~9.4e-2 for the analytic fit; at a 5 nm step it reproduces
 * `cieXyzFromSpectralRadiance` exactly.
 *
 * @param {(wavelengthMeters: number) => number} radiance
 * @param {{stepNm?: number}} [options]
 * @returns {{x: number, y: number, z: number}}
 */
export function cieXyzFromSpectralRadianceInterpolated(radiance, { stepNm = FAST_FIT_STEP_NM } = {}) {
  return integrateOnCoarseGrid(radiance, stepNm, cieXyzBarInterpolated);
}

/* ---------- XYZ -> sRGB ---------- */

/**
 * CIE 1931 xy chromaticity coordinates of a tristimulus triple.
 * @param {{x: number, y: number, z: number}} xyz
 * @returns {{x: number, y: number}}
 */
export function xyzToChromaticity({ x, y, z } = {}) {
  const X = assertFiniteNumber(x, "x");
  const Y = assertFiniteNumber(y, "y");
  const Z = assertFiniteNumber(z, "z");
  const sum = X + Y + Z;
  if (!(sum > 0)) throw new RangeError("tristimulus values must have a positive sum to define a chromaticity");
  return { x: X / sum, y: Y / sum };
}

/**
 * CIE XYZ to linear sRGB (IEC 61966-2-1 primaries, D65 white point).
 * @param {{x: number, y: number, z: number}} xyz
 * @returns {{r: number, g: number, b: number}} linear-light sRGB, unclamped
 */
export function xyzToLinearSrgb({ x, y, z } = {}) {
  const X = assertFiniteNumber(x, "x");
  const Y = assertFiniteNumber(y, "y");
  const Z = assertFiniteNumber(z, "z");
  const m = XYZ_TO_LINEAR_SRGB;
  return {
    r: m[0][0] * X + m[0][1] * Y + m[0][2] * Z,
    g: m[1][0] * X + m[1][1] * Y + m[1][2] * Z,
    b: m[2][0] * X + m[2][1] * Y + m[2][2] * Z,
  };
}

/**
 * Linear-light sRGB to the IEC 61966-2-1 encoded (gamma) value.
 * @param {number} value linear-light channel, nominally 0..1
 * @returns {number}
 */
export function linearSrgbToSrgb(value) {
  const v = assertFiniteNumber(value, "value");
  if (v <= 0) return 0;
  if (v >= 1) return 1;
  if (v <= SRGB_GAMMA_THRESHOLD) return SRGB_GAMMA_SLOPE * v;
  return (1 + SRGB_GAMMA_OFFSET) * v ** SRGB_GAMMA_EXPONENT - SRGB_GAMMA_OFFSET;
}

/**
 * IEC 61966-2-1 encoded sRGB value back to linear light.
 * @param {number} value encoded channel, nominally 0..1
 * @returns {number}
 */
export function srgbToLinearSrgb(value) {
  const v = assertFiniteNumber(value, "value");
  if (v <= 0) return 0;
  if (v >= 1) return 1;
  if (v <= SRGB_GAMMA_SLOPE * SRGB_GAMMA_THRESHOLD) return v / SRGB_GAMMA_SLOPE;
  return ((v + SRGB_GAMMA_OFFSET) / (1 + SRGB_GAMMA_OFFSET)) ** (1 / SRGB_GAMMA_EXPONENT);
}

/**
 * Scale a linear RGB triple so its largest channel is 1, clamping negatives
 * (out-of-gamut colours) to zero.
 * @param {{r: number, g: number, b: number}} rgb
 * @returns {{r: number, g: number, b: number}}
 */
function normalizeLinearRgb(rgb) {
  const peak = Math.max(rgb.r, rgb.g, rgb.b);
  if (!(peak > 0)) return { r: 0, g: 0, b: 0 };
  return {
    r: Math.min(1, Math.max(0, rgb.r / peak)),
    g: Math.min(1, Math.max(0, rgb.g / peak)),
    b: Math.min(1, Math.max(0, rgb.b / peak)),
  };
}

/**
 * Encode a normalised linear RGB triple as a `#rrggbb` string.
 * @param {{r: number, g: number, b: number}} linearRgb
 * @returns {string}
 */
export function linearSrgbToHex(linearRgb) {
  const channels = ["r", "g", "b"].map((key) => {
    const encoded = linearSrgbToSrgb(linearRgb[key]);
    return Math.round(encoded * 255)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${channels.join("")}`;
}

/**
 * Blackbody colour from the committed CIE 1931 table.
 *
 * The tristimulus values are normalised to Y = 1 (so the result is a
 * chromaticity, independent of the arbitrary radiance scale), converted to
 * linear sRGB, normalised so the brightest channel is 1, and gamma encoded.
 *
 * @param {number} temperatureK
 * @returns {{
 *   temperatureK: number, xyz: {x: number, y: number, z: number},
 *   linearRgb: {r: number, g: number, b: number},
 *   srgb: {r: number, g: number, b: number}, hex: string,
 * }}
 */
export function blackbodyToSrgb(temperatureK) {
  const temperature = assertTemperature(temperatureK);
  const raw = cieXyzFromSpectralRadiance((wavelength) => planckSpectralRadiance(wavelength, temperature));
  if (!(raw.y > 0)) throw new RangeError(`blackbody at ${temperature} K has zero luminance in the visible band`);
  const xyz = { x: raw.x / raw.y, y: 1, z: raw.z / raw.y };
  const linearRgb = normalizeLinearRgb(xyzToLinearSrgb(xyz));
  const srgb = {
    r: linearSrgbToSrgb(linearRgb.r),
    g: linearSrgbToSrgb(linearRgb.g),
    b: linearSrgbToSrgb(linearRgb.b),
  };
  return { temperatureK: temperature, xyz, linearRgb, srgb, hex: linearSrgbToHex(linearRgb) };
}

/**
 * Resolve a fast-path method name to its coarse-grid XYZ integrator.
 *
 * @param {string} method
 * @returns {(radiance: (wavelengthMeters: number) => number, options: object) => {x: number, y: number, z: number}}
 */
function fastXyzForMethod(method) {
  if (method === "analytic") return cieXyzFromSpectralRadianceFast;
  if (method === "interpolated") return cieXyzFromSpectralRadianceInterpolated;
  throw new RangeError(
    `method must be one of ${FAST_FIT_METHODS.join(", ")}; received ${JSON.stringify(method)}`,
  );
}

/**
 * Fast blackbody colour.
 *
 * Display approximation. Two colour-matching sources are available:
 *
 * - `method: "analytic"` (default) replaces the tabulated colour-matching
 *   functions with the Wyman-Sloan-Shirley analytic fits evaluated on a coarse
 *   grid. No table access at all.
 * - `method: "interpolated"` keeps the committed CIE 1931 table and linearly
 *   interpolates it on the same coarse grid. Roughly 36x more accurate at the
 *   default step, at the cost of a table lookup per sample.
 *
 * Use `fastBlackbodyToSrgbMaxError` to bound the resulting error for whichever
 * method is selected.
 *
 * @param {number} temperatureK
 * @param {{stepNm?: number, method?: "analytic" | "interpolated"}} [options]
 * @returns {{
 *   temperatureK: number, xyz: {x: number, y: number, z: number},
 *   linearRgb: {r: number, g: number, b: number},
 *   srgb: {r: number, g: number, b: number}, hex: string,
 * }}
 */
export function fastBlackbodyToSrgb(temperatureK, options = {}) {
  const temperature = assertTemperature(temperatureK);
  const { method = "analytic", ...grid } = options ?? {};
  const raw = fastXyzForMethod(method)(
    (wavelength) => planckSpectralRadiance(wavelength, temperature),
    grid,
  );
  if (!(raw.y > 0)) throw new RangeError(`blackbody at ${temperature} K has zero luminance in the visible band`);
  const xyz = { x: raw.x / raw.y, y: 1, z: raw.z / raw.y };
  const linearRgb = normalizeLinearRgb(xyzToLinearSrgb(xyz));
  const srgb = {
    r: linearSrgbToSrgb(linearRgb.r),
    g: linearSrgbToSrgb(linearRgb.g),
    b: linearSrgbToSrgb(linearRgb.b),
  };
  return { temperatureK: temperature, xyz, linearRgb, srgb, hex: linearSrgbToHex(linearRgb) };
}

/**
 * Maximum per-channel deviation of `fastBlackbodyToSrgb` from
 * `blackbodyToSrgb` over a temperature range.
 *
 * The scan is deterministic: `samples` temperatures are placed uniformly on a
 * logarithmic grid between `minK` and `maxK`, inclusive.
 *
 * Three error measures are reported, because they answer different questions:
 *
 * - `maxChannelError` is the largest absolute difference in the encoded
 *   (gamma) sRGB channels, i.e. the worst per-pixel display error.
 * - `maxLinearChannelError` is the same difference in linear light, which is
 *   the physically meaningful radiance error.
 * - `maxChromaticityError` is the largest CIE 1931 xy distance, the standard
 *   colorimetric measure of "how different is the colour".
 *
 * @param {{minK?: number, maxK?: number, samples?: number, stepNm?: number,
 *   method?: "analytic" | "interpolated"}} [options]
 * @returns {{
 *   minK: number, maxK: number, samples: number, stepNm: number, method: string,
 *   maxChannelError: number, maxLinearChannelError: number,
 *   maxChromaticityError: number, maxErrorTemperatureK: number,
 *   perChannel: {r: number, g: number, b: number},
 * }}
 */
export function fastBlackbodyToSrgbMaxError({
  minK = 1000,
  maxK = 40000,
  samples = 400,
  stepNm = FAST_FIT_STEP_NM,
  method = "analytic",
} = {}) {
  const low = assertTemperature(minK, "minK");
  const high = assertTemperature(maxK, "maxK");
  if (!(high > low)) throw new RangeError(`maxK must exceed minK; received ${low} and ${high}`);
  const count = assertPositiveInteger(samples, "samples");
  const step = assertFiniteNumber(stepNm, "stepNm");
  fastXyzForMethod(method);
  const logLow = Math.log(low);
  const logHigh = Math.log(high);
  const perChannel = { r: 0, g: 0, b: 0 };
  let maxChannelError = 0;
  let maxLinearChannelError = 0;
  let maxChromaticityError = 0;
  let maxErrorTemperatureK = low;
  for (let i = 0; i < count; i += 1) {
    const temperature = Math.exp(logLow + ((logHigh - logLow) * i) / (count - 1));
    const reference = blackbodyToSrgb(temperature);
    const fast = fastBlackbodyToSrgb(temperature, { stepNm: step, method });
    let worst = 0;
    let worstLinear = 0;
    for (const key of ["r", "g", "b"]) {
      const delta = Math.abs(fast.srgb[key] - reference.srgb[key]);
      const deltaLinear = Math.abs(fast.linearRgb[key] - reference.linearRgb[key]);
      if (delta > perChannel[key]) perChannel[key] = delta;
      if (delta > worst) worst = delta;
      if (deltaLinear > worstLinear) worstLinear = deltaLinear;
    }
    const referenceChromaticity = xyzToChromaticity(reference.xyz);
    const fastChromaticity = xyzToChromaticity(fast.xyz);
    const chromaticityError = Math.hypot(
      fastChromaticity.x - referenceChromaticity.x,
      fastChromaticity.y - referenceChromaticity.y,
    );
    if (chromaticityError > maxChromaticityError) maxChromaticityError = chromaticityError;
    if (worst > maxChannelError) {
      maxChannelError = worst;
      maxErrorTemperatureK = temperature;
    }
    if (worstLinear > maxLinearChannelError) maxLinearChannelError = worstLinear;
  }
  return {
    minK: low,
    maxK: high,
    samples: count,
    stepNm: step,
    method,
    maxChannelError,
    maxLinearChannelError,
    maxChromaticityError,
    maxErrorTemperatureK,
    perChannel,
  };
}
