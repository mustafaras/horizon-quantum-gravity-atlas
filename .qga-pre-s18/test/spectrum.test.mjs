/*
 * Numerical tests for the spectral / color-conversion module.
 *
 * The Planck law, the Wien displacement laws, and the Stefan-Boltzmann
 * integral are checked against closed-form physics. The CIE 1931 integration is
 * checked against the committed colour-matching table and against published
 * blackbody chromaticities. The fast fitted path is checked against the
 * tabulated path, and its measured error is asserted rather than assumed.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  CIE_1931_2DEG_SOURCE,
  NANOMETRE_TO_METRE,
  WIEN_FREQUENCY_COEFFICIENT,
  SRGB_GAMMA_THRESHOLD,
  SRGB_GAMMA_SLOPE,
  SRGB_GAMMA_OFFSET,
  SRGB_GAMMA_EXPONENT,
  XYZ_TO_LINEAR_SRGB,
  FAST_FIT_STEP_NM,
  planckSpectralRadiance,
  planckSpectralRadiancePerFrequency,
  wienPeakWavelengthMeters,
  wienPeakFrequencyHz,
  cieXyzBarAnalytic,
  cieXyzBarTabulated,
  cieXyzFromSpectralRadiance,
  cieXyzFromSpectralRadianceFast,
  xyzToChromaticity,
  xyzToLinearSrgb,
  linearSrgbToSrgb,
  srgbToLinearSrgb,
  linearSrgbToHex,
  blackbodyToSrgb,
  fastBlackbodyToSrgb,
  fastBlackbodyToSrgbMaxError,
} from "../js/science/spectrum.mjs";
import {
  CIE_1931_2DEG_X,
  CIE_1931_2DEG_Y,
  CIE_1931_2DEG_Z,
  CIE_1931_2DEG_SAMPLE_COUNT,
  CIE_1931_2DEG_WAVELENGTH_START_NM,
  CIE_1931_2DEG_WAVELENGTH_STEP_NM,
  CIE_1931_2DEG_WAVELENGTH_END_NM,
} from "../js/science/data/cie-1931-2deg.mjs";
import { STEFAN_BOLTZMANN, WIEN_DISPLACEMENT_B } from "../js/science/constants.mjs";

const NM = NANOMETRE_TO_METRE;

/* ---------- committed colour-matching data ---------- */

test("the committed CIE 1931 table is complete and self-consistent", () => {
  assert.equal(CIE_1931_2DEG_SAMPLE_COUNT, 81);
  assert.equal(CIE_1931_2DEG_X.length, CIE_1931_2DEG_SAMPLE_COUNT);
  assert.equal(CIE_1931_2DEG_Y.length, CIE_1931_2DEG_SAMPLE_COUNT);
  assert.equal(CIE_1931_2DEG_Z.length, CIE_1931_2DEG_SAMPLE_COUNT);
  assert.equal(CIE_1931_2DEG_WAVELENGTH_START_NM, 380);
  assert.equal(CIE_1931_2DEG_WAVELENGTH_STEP_NM, 5);
  assert.equal(CIE_1931_2DEG_WAVELENGTH_END_NM, 780);
  assert.equal(
    CIE_1931_2DEG_WAVELENGTH_START_NM +
      CIE_1931_2DEG_WAVELENGTH_STEP_NM * (CIE_1931_2DEG_SAMPLE_COUNT - 1),
    CIE_1931_2DEG_WAVELENGTH_END_NM,
  );
  for (let index = 0; index < CIE_1931_2DEG_SAMPLE_COUNT; index += 1) {
    assert.ok(Number.isFinite(CIE_1931_2DEG_X[index]));
    assert.ok(Number.isFinite(CIE_1931_2DEG_Y[index]));
    assert.ok(Number.isFinite(CIE_1931_2DEG_Z[index]));
    assert.ok(CIE_1931_2DEG_X[index] >= 0);
    assert.ok(CIE_1931_2DEG_Y[index] >= 0);
    assert.ok(CIE_1931_2DEG_Z[index] >= 0);
  }
});

test("the committed table carries its source and licence", () => {
  assert.ok(CIE_1931_2DEG_SOURCE);
  for (const key of ["name", "table", "origin", "distributor", "url", "license"]) {
    assert.equal(typeof CIE_1931_2DEG_SOURCE[key], "string", `missing provenance field ${key}`);
    assert.ok(CIE_1931_2DEG_SOURCE[key].length > 0, `empty provenance field ${key}`);
  }
  assert.deepEqual(CIE_1931_2DEG_SOURCE.rangeNm, [380, 780]);
  assert.equal(CIE_1931_2DEG_SOURCE.spacingNm, 5);
});

test("the committed table matches the published CIE 1931 values", () => {
  const at = (nm) => (nm - CIE_1931_2DEG_WAVELENGTH_START_NM) / CIE_1931_2DEG_WAVELENGTH_STEP_NM;
  // ȳ peaks at exactly 1.0 at 555 nm by construction of the CIE 1931 standard.
  assert.ok(Math.abs(CIE_1931_2DEG_Y[at(555)] - 1) < 1e-9);
  assert.ok(Math.abs(CIE_1931_2DEG_X[at(555)] - 0.5120501) < 1e-6);
  assert.ok(Math.abs(CIE_1931_2DEG_Z[at(555)] - 0.00575) < 1e-6);
  assert.ok(Math.abs(CIE_1931_2DEG_X[at(445)] - 0.34806) < 1e-5);
  assert.ok(Math.abs(CIE_1931_2DEG_Z[at(445)] - 1.7826) < 1e-4);
  assert.ok(Math.abs(CIE_1931_2DEG_X[at(600)] - 1.0622) < 1e-4);
  // The response must vanish at both ends of the visible band.
  assert.ok(CIE_1931_2DEG_Y[0] < 1e-3);
  assert.ok(CIE_1931_2DEG_Y[CIE_1931_2DEG_SAMPLE_COUNT - 1] < 1e-4);
});

test("cieXyzBarTabulated reads the committed table", () => {
  const bar = cieXyzBarTabulated(35); // index 35 = 555 nm
  assert.ok(Math.abs(bar.x - 0.5120501) < 1e-6);
  assert.ok(Math.abs(bar.y - 1) < 1e-9);
  assert.ok(Math.abs(bar.z - 0.00575) < 1e-6);
  assert.throws(() => cieXyzBarTabulated(-1), RangeError);
  assert.throws(() => cieXyzBarTabulated(CIE_1931_2DEG_SAMPLE_COUNT), RangeError);
  assert.throws(() => cieXyzBarTabulated(1.5), RangeError);
});

/* ---------- Planck law ---------- */

test("the Planck law matches the closed-form value at a reference point", () => {
  // B_lambda(500 nm, 6000 K) = 2hc^2/lambda^5 / (exp(hc/(lambda k T)) - 1).
  const wavelength = 500 * NM;
  const temperature = 6000;
  const h = 6.62607015e-34;
  const c = 299792458;
  const kB = 1.380649e-23;
  const expected =
    ((2 * h * c * c) / wavelength ** 5) / Math.expm1((h * c) / (wavelength * kB * temperature));
  const actual = planckSpectralRadiance(wavelength, temperature);
  assert.ok(Math.abs(actual - expected) / expected < 1e-12);
  assert.ok(actual > 0);
});

test("the Planck law is monotone in temperature at fixed wavelength", () => {
  const wavelength = 550 * NM;
  let previous = -Infinity;
  for (const temperature of [1000, 2000, 3000, 5000, 8000, 12000, 20000]) {
    const value = planckSpectralRadiance(wavelength, temperature);
    assert.ok(value > previous, `radiance must increase with T at ${temperature} K`);
    previous = value;
  }
});

test("the Planck law is monotone in wavelength on each side of the peak", () => {
  const temperature = 5800;
  const peak = wienPeakWavelengthMeters(temperature);
  let previous = 0;
  for (let nm = 50; nm < peak / NM; nm += 10) {
    const value = planckSpectralRadiance(nm * NM, temperature);
    assert.ok(value > previous, `radiance must rise toward the peak at ${nm} nm`);
    previous = value;
  }
  previous = 0;
  for (let nm = 2000; nm > peak / NM; nm -= 10) {
    const value = planckSpectralRadiance(nm * NM, temperature);
    assert.ok(value > previous, `radiance must rise toward the peak at ${nm} nm`);
    previous = value;
  }
});

test("the Planck law underflows gracefully at short wavelength", () => {
  const value = planckSpectralRadiance(1 * NM, 1000);
  assert.equal(value, 0);
  assert.ok(Number.isFinite(value));
});

test("the per-frequency Planck law peaks at the Wien frequency", () => {
  const temperature = 5800;
  const peak = wienPeakFrequencyHz(temperature);
  const atPeak = planckSpectralRadiancePerFrequency(peak, temperature);
  for (const factor of [0.5, 0.8, 1.2, 2]) {
    assert.ok(planckSpectralRadiancePerFrequency(peak * factor, temperature) < atPeak);
  }
});

test("the Wien displacement law matches the numeric radiance peak", () => {
  for (const temperature of [1000, 3000, 5800, 10000, 30000]) {
    const predicted = wienPeakWavelengthMeters(temperature);
    assert.ok(Math.abs(predicted - WIEN_DISPLACEMENT_B / temperature) < 1e-18);
    let best = [0, -Infinity];
    for (let nm = 20; nm < 20000; nm += 0.5) {
      const value = planckSpectralRadiance(nm * NM, temperature);
      if (value > best[1]) best = [nm, value];
    }
    assert.ok(
      Math.abs(best[0] * NM - predicted) / predicted < 1e-3,
      `numeric peak ${best[0]} nm vs Wien ${predicted / NM} nm at ${temperature} K`,
    );
  }
});

test("the Wien frequency coefficient is the standard 2.821439...", () => {
  assert.ok(Math.abs(WIEN_FREQUENCY_COEFFICIENT - 2.8214393721220787) < 1e-15);
  const temperature = 5800;
  const expected = (WIEN_FREQUENCY_COEFFICIENT * 1.380649e-23 * temperature) / 6.62607015e-34;
  assert.ok(Math.abs(wienPeakFrequencyHz(temperature) - expected) / expected < 1e-12);
});

test("the Planck law integrates to the Stefan-Boltzmann law", () => {
  for (const temperature of [3000, 5800, 12000]) {
    const steps = 400000;
    const upper = 200 * wienPeakWavelengthMeters(temperature);
    const h = upper / steps;
    let total = 0;
    for (let index = 0; index < steps; index += 1) {
      const wavelength = (index + 0.5) * h;
      total += planckSpectralRadiance(wavelength, temperature);
    }
    total *= h;
    // Integrating B_lambda over all wavelengths and over all solid angles gives
    // pi * integral B_lambda dlambda = sigma T^4.
    const expected = STEFAN_BOLTZMANN * temperature ** 4;
    assert.ok(
      Math.abs(Math.PI * total - expected) / expected < 1e-4,
      `pi * integral B_lambda dlambda = ${Math.PI * total} vs sigma T^4 = ${expected}`,
    );
  }
});

test("invalid wavelength and temperature inputs are rejected", () => {
  assert.throws(() => planckSpectralRadiance(0, 5800), RangeError);
  assert.throws(() => planckSpectralRadiance(-1, 5800), RangeError);
  assert.throws(() => planckSpectralRadiance(500 * NM, 0), RangeError);
  assert.throws(() => planckSpectralRadiance(500 * NM, -100), RangeError);
  assert.throws(() => planckSpectralRadiance("abc", 5800), TypeError);
  assert.throws(() => planckSpectralRadiance(500 * NM, "abc"), TypeError);
  assert.throws(() => planckSpectralRadiancePerFrequency(0, 5800), RangeError);
  assert.throws(() => planckSpectralRadiancePerFrequency(1e14, 0), RangeError);
  assert.throws(() => wienPeakWavelengthMeters(0), RangeError);
  assert.throws(() => wienPeakFrequencyHz(-1), RangeError);
});

/* ---------- CIE 1931 integration ---------- */

test("the analytic colour-matching fit tracks the committed table", () => {
  let worst = 0;
  for (let index = 0; index < CIE_1931_2DEG_SAMPLE_COUNT; index += 1) {
    const nm = CIE_1931_2DEG_WAVELENGTH_START_NM + index * CIE_1931_2DEG_WAVELENGTH_STEP_NM;
    const analytic = cieXyzBarAnalytic(nm);
    const tabulated = cieXyzBarTabulated(index);
    worst = Math.max(
      worst,
      Math.abs(analytic.x - tabulated.x),
      Math.abs(analytic.y - tabulated.y),
      Math.abs(analytic.z - tabulated.z),
    );
  }
  // The published Wyman/Sloan/Shirley fit is accurate to a few percent of the
  // peak; the worst absolute deviation is ~0.024 at 425 nm in z-bar.
  assert.ok(worst < 0.03, `worst analytic CMF error ${worst}`);
  assert.ok(Math.abs(cieXyzBarAnalytic(555).y - 1) < 0.01);
});

test("the XYZ integration of a flat spectrum is finite and positive", () => {
  const flat = () => 1;
  const xyz = cieXyzFromSpectralRadiance(flat);
  assert.ok(xyz.x > 0 && xyz.y > 0 && xyz.z > 0);
  assert.ok(Number.isFinite(xyz.x + xyz.y + xyz.z));
});

test("the XYZ integration is linear in the radiance", () => {
  const spectrum = (wavelength) => planckSpectralRadiance(wavelength, 5800);
  const unit = cieXyzFromSpectralRadiance(spectrum);
  const scaled = cieXyzFromSpectralRadiance((wavelength) => 3 * spectrum(wavelength));
  for (const key of ["x", "y", "z"]) {
    assert.ok(
      Math.abs(scaled[key] - 3 * unit[key]) / (3 * unit[key]) < 1e-12,
      `XYZ integration must be linear in ${key}`,
    );
  }
});

test("the fast XYZ integration agrees with the tabulated one", () => {
  for (const temperature of [2000, 4000, 6500, 10000, 20000]) {
    const spectrum = (wavelength) => planckSpectralRadiance(wavelength, temperature);
    const reference = xyzToChromaticity(cieXyzFromSpectralRadiance(spectrum));
    const fast = xyzToChromaticity(cieXyzFromSpectralRadianceFast(spectrum));
    const distance = Math.hypot(fast.x - reference.x, fast.y - reference.y);
    assert.ok(distance < 0.02, `chromaticity distance ${distance} at ${temperature} K`);
  }
});

test("xyzToChromaticity normalises to x + y + z = 1", () => {
  const chromaticity = xyzToChromaticity({ x: 2, y: 3, z: 5 });
  assert.ok(Math.abs(chromaticity.x - 0.2) < 1e-15);
  assert.ok(Math.abs(chromaticity.y - 0.3) < 1e-15);
  assert.throws(() => xyzToChromaticity({ x: 0, y: 0, z: 0 }), RangeError);
  assert.throws(() => xyzToChromaticity({ x: -1, y: 0, z: 0 }), RangeError);
  assert.throws(() => xyzToChromaticity({ x: "abc", y: 1, z: 1 }), TypeError);
});

/* ---------- sRGB conversion ---------- */

test("the XYZ to linear sRGB matrix is the standard D65 matrix", () => {
  assert.equal(XYZ_TO_LINEAR_SRGB.length, 3);
  for (const row of XYZ_TO_LINEAR_SRGB) assert.equal(row.length, 3);
  // The rows must sum to the D65 white point in linear sRGB.
  const white = xyzToLinearSrgb({ x: 0.95047, y: 1, z: 1.08883 });
  assert.ok(Math.abs(white.r - 1) < 1e-4);
  assert.ok(Math.abs(white.g - 1) < 1e-4);
  assert.ok(Math.abs(white.b - 1) < 1e-4);
});

test("the sRGB transfer function round-trips", () => {
  for (const value of [0, 0.001, 0.0031308, 0.01, 0.2, 0.5, 0.9, 1]) {
    const encoded = linearSrgbToSrgb(value);
    const decoded = srgbToLinearSrgb(encoded);
    assert.ok(Math.abs(decoded - value) < 1e-12, `round-trip failed at ${value}`);
  }
  assert.equal(linearSrgbToSrgb(0), 0);
  assert.equal(linearSrgbToSrgb(1), 1);
  assert.equal(srgbToLinearSrgb(0), 0);
  assert.equal(srgbToLinearSrgb(1), 1);
});

test("the sRGB transfer function uses the standard constants", () => {
  assert.equal(SRGB_GAMMA_THRESHOLD, 0.0031308);
  assert.equal(SRGB_GAMMA_SLOPE, 12.92);
  assert.equal(SRGB_GAMMA_OFFSET, 0.055);
  assert.ok(Math.abs(SRGB_GAMMA_EXPONENT - 1 / 2.4) < 1e-15);
  // Below the threshold the curve is linear.
  assert.ok(Math.abs(linearSrgbToSrgb(0.001) - 12.92 * 0.001) < 1e-15);
  // Above it the curve is the power law.
  assert.ok(Math.abs(linearSrgbToSrgb(0.5) - (1.055 * 0.5 ** (1 / 2.4) - 0.055)) < 1e-15);
});

test("linearSrgbToHex clamps and formats correctly", () => {
  assert.equal(linearSrgbToHex({ r: 1, g: 1, b: 1 }), "#ffffff");
  assert.equal(linearSrgbToHex({ r: 0, g: 0, b: 0 }), "#000000");
  // 0.5 linear encodes to 1.055 * 0.5^(1/2.4) - 0.055 = 0.7148 -> 0xbc.
  assert.equal(linearSrgbToHex({ r: 2, g: -1, b: 0.5 }), "#ff00bc");
  assert.equal(linearSrgbToHex({ r: 1, g: 0, b: 0 }), "#ff0000");
});

/* ---------- blackbody colours ---------- */

test("blackbody colours follow the red-to-white-to-blue trend", () => {
  const cool = blackbodyToSrgb(2000);
  const warm = blackbodyToSrgb(6500);
  const hot = blackbodyToSrgb(20000);
  // Cool stars are red-dominant, hot stars blue-dominant.
  assert.ok(cool.linearRgb.r > cool.linearRgb.b, "a 2000 K blackbody must be red-dominant");
  assert.ok(hot.linearRgb.b > hot.linearRgb.r, "a 20000 K blackbody must be blue-dominant");
  // The red channel must fall monotonically with temperature.
  assert.ok(cool.linearRgb.r >= warm.linearRgb.r);
  assert.ok(warm.linearRgb.r >= hot.linearRgb.r);
  // The blue channel must rise monotonically with temperature.
  assert.ok(cool.linearRgb.b <= warm.linearRgb.b);
  assert.ok(warm.linearRgb.b <= hot.linearRgb.b);
});

test("blackbody colours match published reference values", () => {
  const references = [
    [1000, "#ff1700"],
    [2000, "#ff8b16"],
    [3000, "#ffb86d"],
    [4000, "#ffd3a5"],
    [5000, "#ffe6d0"],
    [6500, "#fff9fe"],
    [10000, "#cdd9ff"],
    [20000, "#abc2ff"],
    [40000, "#9eb8ff"],
  ];
  for (const [temperature, hex] of references) {
    assert.equal(blackbodyToSrgb(temperature).hex, hex, `unexpected colour at ${temperature} K`);
  }
});

test("blackbody chromaticities match the Planckian locus", () => {
  // Published CIE 1931 chromaticities for blackbody radiators.
  const references = [
    [1000, 0.6527, 0.3445],
    [2000, 0.5267, 0.4133],
    [3000, 0.4369, 0.4041],
    [4000, 0.3805, 0.3768],
    [5000, 0.3451, 0.3517],
    [6500, 0.3136, 0.3237],
    [10000, 0.2807, 0.2884],
    [20000, 0.2565, 0.2578],
    [40000, 0.2472, 0.2449],
  ];
  for (const [temperature, x, y] of references) {
    const chromaticity = xyzToChromaticity(blackbodyToSrgb(temperature).xyz);
    assert.ok(
      Math.abs(chromaticity.x - x) < 0.005,
      `x mismatch at ${temperature} K: ${chromaticity.x} vs ${x}`,
    );
    assert.ok(
      Math.abs(chromaticity.y - y) < 0.005,
      `y mismatch at ${temperature} K: ${chromaticity.y} vs ${y}`,
    );
  }
});

test("the blackbody result is normalised and well formed", () => {
  for (const temperature of [1000, 3000, 6500, 20000]) {
    const result = blackbodyToSrgb(temperature);
    assert.equal(result.temperatureK, temperature);
    assert.ok(Math.abs(result.xyz.y - 1) < 1e-12, "XYZ must be normalised to Y = 1");
    const brightest = Math.max(result.linearRgb.r, result.linearRgb.g, result.linearRgb.b);
    assert.ok(Math.abs(brightest - 1) < 1e-12, "the brightest linear channel must be 1");
    for (const key of ["r", "g", "b"]) {
      assert.ok(result.linearRgb[key] >= 0, "linear channels must be clamped to non-negative");
      assert.ok(result.srgb[key] >= 0 && result.srgb[key] <= 1);
    }
    assert.match(result.hex, /^#[0-9a-f]{6}$/);
  }
});

test("the fast blackbody path tracks the tabulated path", () => {
  for (const temperature of [2000, 3000, 5000, 6500, 10000, 20000, 40000]) {
    const reference = blackbodyToSrgb(temperature);
    const fast = fastBlackbodyToSrgb(temperature);
    assert.equal(fast.temperatureK, temperature);
    assert.match(fast.hex, /^#[0-9a-f]{6}$/);
    const distance = Math.hypot(
      xyzToChromaticity(fast.xyz).x - xyzToChromaticity(reference.xyz).x,
      xyzToChromaticity(fast.xyz).y - xyzToChromaticity(reference.xyz).y,
    );
    assert.ok(distance < 0.02, `chromaticity distance ${distance} at ${temperature} K`);
  }
});

test("the fast blackbody path is deterministic and honours the step option", () => {
  assert.equal(fastBlackbodyToSrgb(6500).hex, fastBlackbodyToSrgb(6500).hex);
  const coarse = fastBlackbodyToSrgb(6500, { stepNm: 25 });
  const fine = fastBlackbodyToSrgb(6500, { stepNm: 5 });
  assert.ok(Math.abs(coarse.xyz.y - fine.xyz.y) < 1e-9);
  assert.equal(FAST_FIT_STEP_NM, 20);
});

test("the fast-fit error is bounded and reported honestly", () => {
  const wide = fastBlackbodyToSrgbMaxError({ minK: 1000, maxK: 40000, samples: 200 });
  assert.equal(wide.minK, 1000);
  assert.equal(wide.maxK, 40000);
  assert.equal(wide.samples, 200);
  // The published Wyman/Sloan/Shirley fit is worst in the deep red tail, so the
  // encoded-channel error at 1000 K is ~0.094. Assert the measured bound.
  assert.ok(wide.maxChannelError < 0.1, `encoded error ${wide.maxChannelError}`);
  assert.ok(wide.maxLinearChannelError < 0.03, `linear error ${wide.maxLinearChannelError}`);
  assert.ok(wide.maxChromaticityError < 0.02, `chromaticity error ${wide.maxChromaticityError}`);
  assert.ok(wide.maxErrorTemperatureK >= 1000 - 1e-9 && wide.maxErrorTemperatureK <= 40000);
  for (const key of ["r", "g", "b"]) {
    assert.ok(wide.perChannel[key] <= wide.maxChannelError + 1e-15);
  }

  // Over the range where the fit is intended to be used the error is far smaller.
  const narrow = fastBlackbodyToSrgbMaxError({ minK: 2000, maxK: 40000, samples: 200 });
  assert.ok(narrow.maxChannelError < 0.02, `encoded error ${narrow.maxChannelError}`);
  assert.ok(narrow.maxChromaticityError < 0.01, `chromaticity error ${narrow.maxChromaticityError}`);
});

test("the fast-fit error scan is deterministic", () => {
  const first = fastBlackbodyToSrgbMaxError({ minK: 2000, maxK: 20000, samples: 50 });
  const second = fastBlackbodyToSrgbMaxError({ minK: 2000, maxK: 20000, samples: 50 });
  assert.deepEqual(first, second);
});

test("invalid colour-conversion inputs are rejected", () => {
  assert.throws(() => blackbodyToSrgb(0), RangeError);
  assert.throws(() => blackbodyToSrgb(-100), RangeError);
  assert.throws(() => blackbodyToSrgb("abc"), TypeError);
  assert.throws(() => fastBlackbodyToSrgb(0), RangeError);
  assert.throws(() => fastBlackbodyToSrgb(6500, { stepNm: 0 }), RangeError);
  assert.throws(() => fastBlackbodyToSrgb(6500, { stepNm: -5 }), RangeError);
  assert.throws(() => fastBlackbodyToSrgbMaxError({ minK: 40000, maxK: 1000 }), RangeError);
  assert.throws(() => fastBlackbodyToSrgbMaxError({ minK: 1000, maxK: 1000 }), RangeError);
  assert.throws(() => fastBlackbodyToSrgbMaxError({ samples: 0 }), RangeError);
  assert.throws(() => fastBlackbodyToSrgbMaxError({ samples: 1.5 }), RangeError);
  assert.throws(() => cieXyzFromSpectralRadianceFast(() => 1, { stepNm: 0 }), RangeError);
  assert.throws(() => cieXyzFromSpectralRadiance(null), TypeError);
});
