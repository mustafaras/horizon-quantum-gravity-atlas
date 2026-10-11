/**
 * Deterministic, distortion-aware procedural sky for the Kerr observatory.
 *
 * Stars are point sources hashed onto a cube-face grid (three magnitude
 * layers, uniform per solid angle) and drawn analytically at the lensed
 * escape direction of each pixel, so they stay pixel-sharp at any resolution
 * instead of being baked into a coarse equirectangular map.
 *
 * Distortion-aware filtering: every star is a normalized Gaussian of width
 * sigma = max(footprint / 2, sigma_min) on the sky, where `footprint` is the
 * lensed angular footprint of the pixel (screen derivatives of the escape
 * direction). Surface brightness is conserved, so a magnified pixel shows a
 * brighter, larger star and a demagnified pixel (near the critical curve)
 * blends into the layer's mean surface brightness instead of flickering.
 *
 * A faint synthetic galactic band gives lensing something extended to bend.
 * Pure: no DOM, no Three.js. Every random draw is a lattice hash of the seed.
 */

import { blackbodyToSrgb } from "../../science/spectrum.mjs";
import { latticeHash01, valueNoise3 } from "./kerr-plasma.mjs";

/** Pixel footprints above this many radians are clamped (the sky is averaged, not sampled). */
export const STARFIELD_MAX_FOOTPRINT_RAD = 0.3;
/** Smallest star width on the sky (radians); stars are unresolved points below this. */
export const STARFIELD_SIGMA_MIN_RAD = 1e-5;

/**
 * Magnitude layers: `cells` per cube-face edge, presence probability at the
 * face centre (scaled by the cell solid angle for uniform density) and a
 * clipped power-law flux distribution F = min(fluxMax, fluxMin u^(-1/slope)).
 */
export const STARFIELD_LAYERS = Object.freeze([
  Object.freeze({ cells: 150, probability: 0.32, fluxMin: 0.035, slope: 1.6, fluxMax: 1.2 }),
  Object.freeze({ cells: 44, probability: 0.42, fluxMin: 0.22, slope: 1.35, fluxMax: 6 }),
  Object.freeze({ cells: 13, probability: 0.5, fluxMin: 1.1, slope: 1.2, fluxMax: 26 }),
]);

/** Sky detail per quality: the faintest layer is skipped on the performance budget. */
export const STARFIELD_PRESETS = Object.freeze({
  performance: Object.freeze({ firstLayer: 1, galaxyOctaves: 1 }),
  balanced: Object.freeze({ firstLayer: 0, galaxyOctaves: 2 }),
  ultra: Object.freeze({ firstLayer: 0, galaxyOctaves: 3 }),
});

export const STARFIELD_GALAXY = Object.freeze({
  normal: Object.freeze((() => {
    const n = [0.31, 0.82, 0.48];
    const length = Math.hypot(...n);
    return n.map((value) => value / length);
  })()),
  /** Gaussian half-width of the band in sin(latitude). */
  width: 0.2,
  surfaceBrightness: 0.018,
  dustWidth: 0.06,
  colorKelvin: 4600,
});

const STAR_KELVIN_MIN = 3000;
const STAR_KELVIN_SPAN = 9000;
const STAR_KELVIN_SKEW = 1.8;

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Linear-sRGB colour with unit luminance (so `flux` is the luminance). */
export function unitLuminanceColor(kelvin) {
  const { linearRgb } = blackbodyToSrgb(kelvin);
  const luminance = 0.2126 * linearRgb.r + 0.7152 * linearRgb.g + 0.0722 * linearRgb.b || 1;
  return [linearRgb.r / luminance, linearRgb.g / luminance, linearRgb.b / luminance];
}

export function starKelvin(h) {
  return STAR_KELVIN_MIN + STAR_KELVIN_SPAN * h ** STAR_KELVIN_SKEW;
}

export function starFlux(layer, h) {
  return Math.min(layer.fluxMax, layer.fluxMin * (1 - h) ** (-1 / layer.slope));
}

/** Layer statistics used for the filtered (mean) sky: E[F] and surface brightness per steradian. */
export const STARFIELD_LAYER_MEANS = Object.freeze(STARFIELD_LAYERS.map((layer) => {
  const n = 4096;
  let flux = 0;
  for (let i = 0; i < n; i += 1) flux += starFlux(layer, (i + 0.5) / n);
  // Density per steradian of a cube-face grid with centre probability p is N^2 p / 4
  // (the face solid angle 2pi/3 cancels the (1 + u^2 + v^2)^(-3/2) acceptance average).
  return Object.freeze({ meanFlux: flux / n, surfaceBrightness: (layer.cells ** 2 * layer.probability * flux) / (4 * n) });
}));

export const STARFIELD_MEAN_COLOR = Object.freeze((() => {
  const sum = [0, 0, 0];
  const n = 256;
  for (let i = 0; i < n; i += 1) {
    const color = unitLuminanceColor(starKelvin((i + 0.5) / n));
    for (let c = 0; c < 3; c += 1) sum[c] += color[c] / n;
  }
  return sum;
})());

/** Cube face and face coordinates (u, v) in [-1, 1] of a unit direction. */
export function cubeFace([x, y, z]) {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const az = Math.abs(z);
  if (ax >= ay && ax >= az) return { face: x > 0 ? 0 : 1, u: z / ax, v: y / ax };
  if (ay >= az) return { face: y > 0 ? 2 : 3, u: x / ay, v: z / ay };
  return { face: z > 0 ? 4 : 5, u: x / az, v: y / az };
}

/** Inverse of cubeFace (not normalized). */
export function cubeFaceDirection(face, u, v) {
  const sign = face % 2 === 0 ? 1 : -1;
  if (face < 2) return [sign, v, u];
  if (face < 4) return [u, sign, v];
  return [u, v, sign];
}

/** The star (if any) in cell (i, j) of `face` for layer `index`. */
export function starInCell(index, face, i, j, seed) {
  const layer = STARFIELD_LAYERS[index];
  const base = face * 32 + index * 8;
  const N = layer.cells;
  const su = ((i + latticeHash01(i, j, base + 1, seed)) / N) * 2 - 1;
  const sv = ((j + latticeHash01(i, j, base + 2, seed)) / N) * 2 - 1;
  const acceptance = layer.probability * (1 + su * su + sv * sv) ** -1.5;
  if (latticeHash01(i, j, base, seed) >= acceptance) return null;
  const d = cubeFaceDirection(face, su, sv);
  const length = Math.hypot(...d);
  return {
    direction: d.map((c) => c / length),
    flux: starFlux(layer, latticeHash01(i, j, base + 3, seed)),
    kelvin: starKelvin(latticeHash01(i, j, base + 4, seed)),
  };
}

const GALAXY_SEED_A = 0x2545f491;
const GALAXY_SEED_B = 0x68e31da4;

function galaxyRadiance(dir, footprint, octaves, seed) {
  const G = STARFIELD_GALAXY;
  const b = dir[0] * G.normal[0] + dir[1] * G.normal[1] + dir[2] * G.normal[2];
  const band = Math.exp(-((b / G.width) ** 2));
  if (band < 1e-4) return 0;
  let structure = 0;
  let norm = 0;
  let frequency = 5;
  let amplitude = 1;
  for (let k = 0; k < octaves; k += 1) {
    const weight = amplitude * (1 - smoothstep(0.3, 0.75, footprint * frequency));
    structure += weight * valueNoise3(dir[0] * frequency, dir[1] * frequency, dir[2] * frequency + 17 * k, (seed ^ GALAXY_SEED_A) >>> 0);
    norm += amplitude;
    frequency *= 2.3;
    amplitude *= 0.55;
  }
  const dustFade = 1 - smoothstep(0.3, 0.75, footprint * 9);
  const dust = dustFade * smoothstep(0.05, 0.5, valueNoise3(dir[0] * 9, dir[1] * 9, dir[2] * 9 + 31, (seed ^ GALAXY_SEED_B) >>> 0))
    * Math.exp(-((b / G.dustWidth) ** 2));
  return G.surfaceBrightness * band * (0.6 + 0.4 * (structure / norm)) * (1 - 0.7 * dust);
}

/**
 * Sky radiance (linear sRGB) for a lensed escape direction.
 *
 * @param {number[]} dir unit world direction
 * @param {number} footprint lensed pixel footprint on the sky, radians
 * @param {{ seed?: number, referenceFootprint: number, quality?: string }} options
 *   referenceFootprint: unlensed pixel size at the screen centre (2 tan(fov/2) / height),
 *   so an unlensed star renders at the same pixel brightness at any resolution
 */
export function starfieldRadiance(dir, footprint, { seed = 42, referenceFootprint, quality = "balanced" }) {
  if (!(referenceFootprint > 0)) throw new RangeError("referenceFootprint must be positive");
  const preset = STARFIELD_PRESETS[quality] ?? STARFIELD_PRESETS.balanced;
  const fp = Math.min(Math.max(footprint, 0), STARFIELD_MAX_FOOTPRINT_RAD);
  const sigma = Math.max(0.5 * fp, STARFIELD_SIGMA_MIN_RAD);
  const solidAngle = referenceFootprint * referenceFootprint;
  const { face, u, v } = cubeFace(dir);
  const rgb = [0, 0, 0];
  for (let index = preset.firstLayer; index < STARFIELD_LAYERS.length; index += 1) {
    const N = STARFIELD_LAYERS[index].cells;
    const ci = Math.min(N - 1, Math.max(0, Math.floor((u * 0.5 + 0.5) * N)));
    const cj = Math.min(N - 1, Math.max(0, Math.floor((v * 0.5 + 0.5) * N)));
    const point = [0, 0, 0];
    for (let dj = -1; dj <= 1; dj += 1) {
      for (let di = -1; di <= 1; di += 1) {
        const i = ci + di;
        const j = cj + dj;
        if (i < 0 || j < 0 || i >= N || j >= N) continue;
        const star = starInCell(index, face, i, j, seed);
        if (!star) continue;
        const distance = Math.hypot(dir[0] - star.direction[0], dir[1] - star.direction[1], dir[2] - star.direction[2]);
        if (distance > 4 * sigma) continue;
        const weight = (star.flux * solidAngle * Math.exp(-(distance * distance) / (2 * sigma * sigma))) / (2 * Math.PI * sigma * sigma);
        const color = unitLuminanceColor(star.kelvin);
        for (let c = 0; c < 3; c += 1) point[c] += weight * color[c];
      }
    }
    const blend = smoothstep(0.35, 1, fp / (Math.PI / 2 / N));
    const mean = STARFIELD_LAYER_MEANS[index].surfaceBrightness * solidAngle;
    for (let c = 0; c < 3; c += 1) rgb[c] += point[c] * (1 - blend) + mean * STARFIELD_MEAN_COLOR[c] * blend;
  }
  const galaxy = galaxyRadiance(dir, fp, preset.galaxyOctaves, seed);
  const galaxyColor = unitLuminanceColor(STARFIELD_GALAXY.colorKelvin);
  for (let c = 0; c < 3; c += 1) rgb[c] += galaxy * galaxyColor[c];
  return rgb;
}

const glslFloat = (value) => (Number.isInteger(value) ? value.toFixed(1) : String(value));
const glslVec3 = (v) => `vec3(${v.map((c) => glslFloat(Number(c.toFixed(7)))).join(", ")})`;

/**
 * GLSL ES 3.00 implementation of `starfieldRadiance`. Requires KERR_PLASMA_GLSL
 * (lattice hash and value noise) and a host function `vec3 chroma(float kelvin)`
 * returning the blackbody chromaticity from the science colour table.
 */
export const KERR_STARFIELD_GLSL = /* glsl */ `
const int STAR_LAYERS = ${STARFIELD_LAYERS.length};
const float STAR_CELLS[STAR_LAYERS] = float[](${STARFIELD_LAYERS.map((l) => glslFloat(l.cells)).join(", ")});
const float STAR_PROB[STAR_LAYERS] = float[](${STARFIELD_LAYERS.map((l) => glslFloat(l.probability)).join(", ")});
const float STAR_FMIN[STAR_LAYERS] = float[](${STARFIELD_LAYERS.map((l) => glslFloat(l.fluxMin)).join(", ")});
const float STAR_SLOPE[STAR_LAYERS] = float[](${STARFIELD_LAYERS.map((l) => glslFloat(l.slope)).join(", ")});
const float STAR_FMAX[STAR_LAYERS] = float[](${STARFIELD_LAYERS.map((l) => glslFloat(l.fluxMax)).join(", ")});
const float STAR_MEAN_SB[STAR_LAYERS] = float[](${STARFIELD_LAYER_MEANS.map((m) => m.surfaceBrightness.toFixed(8)).join(", ")});
const vec3 STAR_MEAN_COLOR = ${glslVec3(STARFIELD_MEAN_COLOR)};
const vec3 GALAXY_NORMAL = ${glslVec3(STARFIELD_GALAXY.normal)};
const vec3 GALAXY_COLOR = ${glslVec3(unitLuminanceColor(STARFIELD_GALAXY.colorKelvin))};

vec3 unitLuma(vec3 c) { return c / max(dot(c, vec3(0.2126, 0.7152, 0.0722)), 1e-6); }

vec3 cubeFaceDirection(int face, float u, float v) {
  float s = (face % 2 == 0) ? 1.0 : -1.0;
  if (face < 2) return vec3(s, v, u);
  if (face < 4) return vec3(u, s, v);
  return vec3(u, v, s);
}

float galaxyRadiance(vec3 dir, float fp, int octaves, uint seed) {
  float b = dot(dir, GALAXY_NORMAL);
  float band = exp(-pow(b / ${glslFloat(STARFIELD_GALAXY.width)}, 2.0));
  if (band < 1e-4) return 0.0;
  float structure = 0.0, norm = 0.0, frequency = 5.0, amplitude = 1.0;
  for (int k = 0; k < 3; k++) {
    if (k >= octaves) break;
    float weight = amplitude * (1.0 - smoothstep(0.3, 0.75, fp * frequency));
    structure += weight * qgaValueNoise(dir * frequency + vec3(0.0, 0.0, 17.0 * float(k)), seed ^ ${GALAXY_SEED_A}u);
    norm += amplitude;
    frequency *= 2.3;
    amplitude *= 0.55;
  }
  float dustFade = 1.0 - smoothstep(0.3, 0.75, fp * 9.0);
  float dust = dustFade * smoothstep(0.05, 0.5, qgaValueNoise(dir * 9.0 + vec3(0.0, 0.0, 31.0), seed ^ ${GALAXY_SEED_B}u))
    * exp(-pow(b / ${glslFloat(STARFIELD_GALAXY.dustWidth)}, 2.0));
  return ${glslFloat(STARFIELD_GALAXY.surfaceBrightness)} * band * (0.6 + 0.4 * structure / norm) * (1.0 - 0.7 * dust);
}

vec3 starfieldRadiance(vec3 dir, float footprint, float refFootprint, int firstLayer, int galaxyOctaves, uint seed) {
  float fp = clamp(footprint, 0.0, ${glslFloat(STARFIELD_MAX_FOOTPRINT_RAD)});
  float sigma = max(0.5 * fp, ${STARFIELD_SIGMA_MIN_RAD.toExponential()});
  float solidAngle = refFootprint * refFootprint;
  vec3 a = abs(dir);
  int face; float u, v;
  if (a.x >= a.y && a.x >= a.z) { face = dir.x > 0.0 ? 0 : 1; u = dir.z / a.x; v = dir.y / a.x; }
  else if (a.y >= a.z) { face = dir.y > 0.0 ? 2 : 3; u = dir.x / a.y; v = dir.z / a.y; }
  else { face = dir.z > 0.0 ? 4 : 5; u = dir.x / a.z; v = dir.y / a.z; }
  vec3 rgb = vec3(0.0);
  for (int index = 0; index < STAR_LAYERS; index++) {
    if (index < firstLayer) continue;
    float N = STAR_CELLS[index];
    int n = int(N);
    int ci = clamp(int(floor((u * 0.5 + 0.5) * N)), 0, n - 1);
    int cj = clamp(int(floor((v * 0.5 + 0.5) * N)), 0, n - 1);
    int base = face * 32 + index * 8;
    vec3 point = vec3(0.0);
    for (int dj = -1; dj <= 1; dj++) {
      for (int di = -1; di <= 1; di++) {
        int i = ci + di, j = cj + dj;
        if (i < 0 || j < 0 || i >= n || j >= n) continue;
        float su = (float(i) + qgaHash01(ivec3(i, j, base + 1), seed)) / N * 2.0 - 1.0;
        float sv = (float(j) + qgaHash01(ivec3(i, j, base + 2), seed)) / N * 2.0 - 1.0;
        float acceptance = STAR_PROB[index] * pow(1.0 + su * su + sv * sv, -1.5);
        if (qgaHash01(ivec3(i, j, base), seed) >= acceptance) continue;
        vec3 s = normalize(cubeFaceDirection(face, su, sv));
        float distance = length(dir - s);
        if (distance > 4.0 * sigma) continue;
        float flux = min(STAR_FMAX[index], STAR_FMIN[index] * pow(1.0 - qgaHash01(ivec3(i, j, base + 3), seed), -1.0 / STAR_SLOPE[index]));
        float kelvin = ${glslFloat(STAR_KELVIN_MIN)} + ${glslFloat(STAR_KELVIN_SPAN)} * pow(qgaHash01(ivec3(i, j, base + 4), seed), ${glslFloat(STAR_KELVIN_SKEW)});
        float weight = flux * solidAngle * exp(-(distance * distance) / (2.0 * sigma * sigma)) / (${glslFloat(2 * Math.PI)} * sigma * sigma);
        point += weight * unitLuma(chroma(kelvin));
      }
    }
    float blend = smoothstep(0.35, 1.0, fp / (${glslFloat(Math.PI / 2)} / N));
    rgb += mix(point, STAR_MEAN_SB[index] * solidAngle * STAR_MEAN_COLOR, blend);
  }
  return rgb + galaxyRadiance(dir, fp, galaxyOctaves, seed) * GALAXY_COLOR;
}
`;

/** Constants the TSL backend needs to rebuild the same sky in node form. */
export const STARFIELD_DERIVED = Object.freeze({
  kelvin: Object.freeze({ min: STAR_KELVIN_MIN, span: STAR_KELVIN_SPAN, skew: STAR_KELVIN_SKEW }),
  galaxySeeds: Object.freeze([GALAXY_SEED_A, GALAXY_SEED_B]),
});
