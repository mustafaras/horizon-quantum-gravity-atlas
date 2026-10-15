/**
 * Volumetric accretion plasma (corona) for the Kerr observatory (Prompt 05).
 *
 * PHYSICS ANCHOR (heuristic display layer):
 *   Thin-disk theory (Page-Thorne) describes an optically thick, geometrically
 *   thin equatorial flow. Real accretion flows also carry a hot, optically
 *   thin, magnetized corona above and below the disk, powered by the same
 *   MRI turbulence. In AGN and X-ray binaries that corona has kT ~ 10-300 keV
 *   and radiates in X-rays — it is NOT visible light. This module therefore
 *   models the corona's *structure* (flaring scale height, ISCO-peaked radial
 *   density, seeded clumpy realizations) and maps its thermal emission to a
 *   visible blue-white glow through the display-scaled colour table. The
 *   mapping is explicit in the provenance: the physical corona emits in
 *   X-rays; the rendered colour is a display palette, not an observation.
 *
 * MODEL:
 *   - Geometry: a flaring slab hugging the equatorial plane with
 *     H(r) = h0 r^flare (h0 = 0.12, flare = 1.1), truncated smoothly between
 *     the ISCO and just beyond the disk's outer edge.
 *   - Density: n(r, z, phi) = radial(r) * exp(-(z/H)^2) * clump(r, z, phi),
 *     a seeded, frozen log-normal clumping realization (band-limited value
 *     noise, unit mean). The corona is a static snapshot: it does not animate
 *     (the disk's surface turbulence does; see kerr-plasma.mjs).
 *   - Kinematics: the corona corotates with the local circular orbit Omega(r)
 *     from the disk table, so the same g = 1/(u^t (E - Omega L_z)) factor and
 *     the same g^4 Liouville beaming as the disk apply.
 *   - Radiative transfer: emission/absorption with a small optical depth
 *     (tau ~ 0.2 through the densest column), composited front-to-back along
 *     the geodesic with the ZAMO path length ds — physically ordered with the
 *     disk crossings (the volume between crossings is added before the disk
 *     hit at the end of that segment).
 *
 * Pure module: no DOM, no Three.js. The GLSL chunk keeps the same constants
 * injected from PLASMA_VOLUME so the CPU reference and the shader cannot drift.
 */

import { valueNoise3 } from "./kerr-plasma.mjs";

export const PLASMA_VOLUME = Object.freeze({
  status: "heuristic",
  /** Flaring scale height H(r) = h0 * r^flare (GM/c^2). */
  h0: 0.12,
  flare: 1.1,
  /** Radial extent: [rIsco - innerMargin, rOut + outerMargin] (GM/c^2). */
  innerMargin: 1,
  outerMargin: 5,
  /** Radial density profile: (rPeak/r)^qRad with a soft inner cutoff. */
  qRad: 2,
  /** Display temperature factor over the disk table's effective temperature. */
  temperatureFactor: 2.2,
  /** Absorption coefficient per unit density and path length (1/(GM/c^2)). */
  absorption: 0.0035,
  /** Display gain relative to the disk's flux scale. */
  gain: 0.16,
  /** Seeded clumping: band-limited value noise, unit mean, frozen. */
  clump: Object.freeze({
    lambdaR: 3.5,
    lambdaZ: 1.6,
    azimuthalScale: 2.5,
    octaves: 2,
    gain: 0.55,
    lacunarity: 2.2,
    contrast: 0.75,
  }),
});

/* ------------------------------------------------------------------ */
/* Geometry and density                                                */
/* ------------------------------------------------------------------ */

/** Flaring scale height H(r) (GM/c^2). */
export function coronaScaleHeight(r, { h0 = PLASMA_VOLUME.h0, flare = PLASMA_VOLUME.flare } = {}) {
  return h0 * Math.pow(Math.max(1, Number(r) || 0), flare);
}

/** Radial density profile, peaked at the ISCO and truncated at the edges. */
export function coronaRadialProfile(r, { rIn, rOut, qRad = PLASMA_VOLUME.qRad } = {}) {
  const radius = Number(r) || 0;
  const inner = Number(rIn) || 1;
  const outer = Number(rOut) || inner + 1;
  if (radius < inner || radius > outer) return 0;
  const peak = inner;
  const profile = Math.pow(peak / Math.max(radius, peak), qRad);
  // Soft cutoffs over ~15% of the span so the slab does not end abruptly.
  const span = outer - inner;
  const fadeIn = Math.min(1, (radius - inner) / (0.15 * span));
  const fadeOut = Math.min(1, (outer - radius) / (0.15 * span));
  const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  return profile * smooth(fadeIn) * smooth(fadeOut);
}

const CLUMP_VARIANCE = (() => {
  let sum = 0;
  let sumSq = 0;
  const n = 6000;
  for (let i = 0; i < n; i += 1) {
    const v = valueNoise3(i * 0.7548776662, i * 0.5698402910, i * 0.3141592654, 23);
    sum += v;
    sumSq += v * v;
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
})();

/**
 * Unit-mean log-normal clumping factor at (r, z, phi). Frozen realization:
 * the same seed and position always reproduce the same factor.
 */
export function coronaClumping({ r, z, phi, seed = 42 }) {
  const C = PLASMA_VOLUME.clump;
  const height = Math.max(0, Math.abs(Number(z) || 0)) / C.lambdaZ;
  const radial = (Number(r) || 0) / C.lambdaR;
  const domain = [
    radial,
    height * Math.cos(Number(phi) || 0),
    height * Math.sin(Number(phi) || 0),
  ];
  let frequency = C.azimuthalScale;
  let amplitude = 1;
  let field = 0;
  let variance = 0;
  for (let k = 0; k < C.octaves; k += 1) {
    field += amplitude * valueNoise3(
      domain[0] * frequency + 7.3 * k,
      domain[1] * frequency,
      domain[2] * frequency,
      seed);
    variance += amplitude * amplitude;
    frequency *= C.lacunarity;
    amplitude *= C.gain;
  }
  const normalized = field / Math.sqrt(Math.max(variance, 1e-6));
  return Math.exp(C.contrast * normalized - 0.5 * C.contrast * C.contrast * CLUMP_VARIANCE * variance);
}

/**
 * Normalized corona density at a BL-Cartesian sample (spin axis = z, disk
 * plane = z 0). Returns 0 outside the slab. Peak value is ~1 near the ISCO.
 */
export function coronaDensity({ r, z, phi, rIn, rOut, seed = 42 }) {
  const radius = Number(r) || 0;
  const radial = coronaRadialProfile(radius, { rIn, rOut });
  if (!(radial > 0)) return 0;
  const height = Math.abs(Number(z) || 0);
  const scale = coronaScaleHeight(radius);
  const vertical = Math.exp(-((height / scale) ** 2));
  if (vertical <= 1e-3) return 0;
  return radial * vertical * coronaClumping({ r: radius, z: height, phi, seed });
}

/* ------------------------------------------------------------------ */
/* Emission / absorption sample                                        */
/* ------------------------------------------------------------------ */

/**
 * One corona sample along a traced ray.
 *
 * @param {object} input
 *   r, z, phi: BL-Cartesian cylindrical coordinates of the sample
 *   rIn, rOut: corona radial extent (usually [rIsco - 1, rOut + 5])
 *   g: the disk's combined shift factor 1/(u^t (E - Omega L_z)) (the corona
 *     corotates at the table's Omega(r))
 *   tableKelvin: the disk table's emitted effective temperature at r
 *   seed
 * @returns {{ emission: number, absorption: number, kelvin: number } | null}
 *   null outside the slab. `emission` is the emissivity coefficient (before
 *   the path length ds); the caller shades chroma(g * kelvin) * g^4 *
 *   emission * ds. `absorption` multiplies ds in exp(-absorption * ds).
 */
export function coronaSample({ r, z, phi, rIn, rOut, g, tableKelvin, seed = 42 }) {
  const density = coronaDensity({ r, z, phi, rIn, rOut, seed });
  if (!(density > 0)) return null;
  const shift = Number(g) || 0;
  if (!(shift > 0)) return null;
  const kelvin = Math.min(
    60000,
    Math.max(500, (Number(tableKelvin) || 5000) * PLASMA_VOLUME.temperatureFactor));
  return {
    emission: PLASMA_VOLUME.gain * density * shift ** 4,
    absorption: PLASMA_VOLUME.absorption * density,
    kelvin,
  };
}

/** Variance constant shared with the GLSL/TSL implementations. */
export const PLASMA_VOLUME_DERIVED = Object.freeze({ clumpVariance: CLUMP_VARIANCE });

/* ------------------------------------------------------------------ */
/* GLSL                                                                */
/* ------------------------------------------------------------------ */

const glslFloat = (value) => (Number.isInteger(value) ? value.toFixed(1) : String(value));

/**
 * GLSL ES 3.00 chunk for the corona (accumulate pass). Requires the
 * qgaValueNoise helper from KERR_PLASMA_GLSL. rIn/rOut are the corona's
 * radial extent (uniforms uCoronaRIn/uCoronaROut, usually the disk extent
 * widened by the margins). The clumping realization is frozen (no time).
 */
export const PLASMA_VOLUME_GLSL = /* glsl */ `
float coronaScaleHeight(float r) {
  return ${glslFloat(PLASMA_VOLUME.h0)} * pow(max(r, 1.0), ${glslFloat(PLASMA_VOLUME.flare)});
}
float coronaRadialProfile(float r, float rIn, float rOut) {
  if (r < rIn || r > rOut) return 0.0;
  float profile = pow(rIn / max(r, rIn), ${glslFloat(PLASMA_VOLUME.qRad)});
  float span = max(rOut - rIn, 1e-3);
  float fadeIn = clamp((r - rIn) / (0.15 * span), 0.0, 1.0);
  float fadeOut = clamp((rOut - r) / (0.15 * span), 0.0, 1.0);
  fadeIn = fadeIn * fadeIn * (3.0 - 2.0 * fadeIn);
  fadeOut = fadeOut * fadeOut * (3.0 - 2.0 * fadeOut);
  return profile * fadeIn * fadeOut;
}
float coronaClumping(float r, float z, float phi, uint seed) {
  float height = max(abs(z), 0.0) / ${glslFloat(PLASMA_VOLUME.clump.lambdaZ)};
  float radial = r / ${glslFloat(PLASMA_VOLUME.clump.lambdaR)};
  vec3 domain = vec3(radial, height * cos(phi), height * sin(phi));
  float frequency = ${glslFloat(PLASMA_VOLUME.clump.azimuthalScale)};
  float amplitude = 1.0;
  float field = 0.0;
  float variance = 0.0;
  for (int k = 0; k < ${PLASMA_VOLUME.clump.octaves}; k++) {
    field += amplitude * qgaValueNoise(vec3(domain.x * frequency + 7.3 * float(k), domain.y * frequency, domain.z * frequency), seed);
    variance += amplitude * amplitude;
    frequency *= ${glslFloat(PLASMA_VOLUME.clump.lacunarity)};
    amplitude *= ${glslFloat(PLASMA_VOLUME.clump.gain)};
  }
  float normalized = field / sqrt(max(variance, 1e-6));
  float sigma = ${glslFloat(PLASMA_VOLUME.clump.contrast)};
  return exp(sigma * normalized - 0.5 * sigma * sigma * ${CLUMP_VARIANCE.toFixed(8)} * variance);
}
// Normalized density at a BL-Cartesian sample (spin axis = z, disk plane z=0).
float coronaDensity(vec3 pos, float r, float rIn, float rOut, uint seed) {
  float radial = coronaRadialProfile(r, rIn, rOut);
  if (radial <= 0.0) return 0.0;
  float scale = coronaScaleHeight(r);
  float vertical = exp(-pow(abs(pos.z) / scale, 2.0));
  if (vertical <= 1e-3) return 0.0;
  float phi = atan(pos.y, pos.x);
  return radial * vertical * coronaClumping(r, pos.z, phi, seed);
}
// Display-mapped thermal structure: the physical corona emits in X-rays, so
// the rendered colour multiplies the disk table's kelvin by a fixed factor.
float coronaKelvin(float tableKelvin) {
  return clamp(tableKelvin * ${glslFloat(PLASMA_VOLUME.temperatureFactor)}, 500.0, 60000.0);
}
// Optically thin absorption per unit path length at a sample of this density.
float coronaAbsorption(float density) {
  return ${glslFloat(PLASMA_VOLUME.absorption)} * density;
}
// Emissivity coefficient (before chroma, exposure and the path length): the
// corona corotates, so it shares the disk's g^4 Liouville beaming.
float coronaEmissionScale(float density, float g) {
  return ${glslFloat(PLASMA_VOLUME.gain)} * density * pow(g, 4.0);
}
`;
