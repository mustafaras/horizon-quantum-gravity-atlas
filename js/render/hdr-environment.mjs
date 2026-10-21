/**
 * HDR environment map with importance sampling (Prompt 05).
 *
 * A seeded, float equirectangular radiance environment for scenes whose
 * PBR materials need image-based lighting: a diffuse astrophysical
 * background (galactic band + zodiacal glow, display-scaled) plus the
 * starfield catalogue's point sources with their true dynamic range
 * (stars exceed 1.0 — the point of HDR).
 *
 * Importance sampling: a cumulative distribution over the map's texels,
 * weighted by luminance times solid angle, with binary-search inversion
 * and an analytic pdf. This is the standard environment-sampling scheme
 * for Monte Carlo image-based lighting.
 *
 * SCOPE CONTRACT (tested): the environment affects *material lighting
 * only*. It is never applied to the Kerr observatory — the event horizon
 * is ray-traced black and the observatory's sky is its own lensed
 * starfield; applying an environment reflection there would fabricate
 * light the physics does not produce. HDR_ENVIRONMENT_EXCLUSIONS lists
 * the view ids that must never receive it, and applyHdrEnvironment
 * refuses them.
 *
 * Pure model: no DOM, no Three.js. The texture factory is browser-side.
 */

import { STARFIELD_LAYERS, STARFIELD_GALAXY, starKelvin, starFlux, unitLuminanceColor } from "../visualizations/kerr/starfield-sampler.mjs";
import { latticeHash01, valueNoise3 } from "../visualizations/kerr/kerr-plasma.mjs";
import * as TK from "../design/tokens.mjs";

export const HDR_ENVIRONMENT = Object.freeze({
  status: "schematic",
  /** Equirectangular map size (width = 2 x height). */
  width: 512,
  height: 256,
  /** Diffuse components (linear-sRGB radiance, display-scaled). */
  zodiacalGain: 0.012,
  galaxyGain: 1,
  /** Star radiance scale over the catalogue fluxes. */
  starGain: 0.9,
  /** Views that must never receive the environment (the horizon contract). */
  exclusions: Object.freeze(["bh-kerr-observatory"]),
});

/** True when a view must never receive the HDR environment. */
export function hdrEnvironmentExcluded(viewId) {
  return HDR_ENVIRONMENT.exclusions.includes(viewId);
}

/* ------------------------------------------------------------------ */
/* Radiance model                                                      */
/* ------------------------------------------------------------------ */

function directionOf(u, v) {
  // u in [0, 1) azimuth (u = 0 at -z... keep the starfield convention: u = 0.5 at +x)
  const phi = (u - 0.5) * 2 * Math.PI;
  const theta = v * Math.PI;
  const sinTheta = Math.sin(theta);
  return [sinTheta * Math.cos(phi), Math.cos(theta), sinTheta * Math.sin(phi)];
}

/**
 * Build the float equirectangular radiance map. Deterministic: the same seed
 * reproduces the same bytes. Returns { width, height, radiance, stats }.
 */
export function buildHdrEnvironment({ seed = 42, width = HDR_ENVIRONMENT.width, height = HDR_ENVIRONMENT.height } = {}) {
  const w = Math.round(width);
  const h = Math.round(height);
  if (w < 2 || h < 2 || w % 2 !== 0) throw new TypeError("HDR environment dimensions must be even and >= 2");
  const radiance = new Float32Array(w * h * 4);
  const galaxy = STARFIELD_GALAXY;
  const galaxyColor = unitLuminanceColor(galaxy.colorKelvin);
  let maxLuminance = 0;
  let totalLuminance = 0;
  for (let y = 0; y < h; y += 1) {
    const v = (y + 0.5) / h;
    for (let x = 0; x < w; x += 1) {
      const u = (x + 0.5) / w;
      const dir = directionOf(u, v);
      // Galactic band: Gaussian in sin(latitude) about the band normal, with
      // seeded mottling (2 octaves) and a dust lane (narrower, subtractive).
      const sinLat = dir[0] * galaxy.normal[0] + dir[1] * galaxy.normal[1] + dir[2] * galaxy.normal[2];
      const band = Math.exp(-((sinLat / galaxy.width) ** 2));
      const dust = Math.exp(-((sinLat / galaxy.dustWidth) ** 2));
      const mottle = 0.7 + 0.3 * valueNoise3(dir[0] * 6, dir[1] * 6, dir[2] * 6, seed)
        + 0.15 * valueNoise3(dir[0] * 14, dir[1] * 14, dir[2] * 14, seed + 7);
      const galaxyTerm = galaxy.surfaceBrightness * band * Math.max(0.25, mottle) * (1 - 0.55 * dust);
      // Zodiacal glow: smooth, symmetric about the same plane, wider.
      const zodiacal = HDR_ENVIRONMENT.zodiacalGain * Math.exp(-((sinLat / 0.55) ** 2));
      const r = galaxyColor[0] * galaxyTerm * HDR_ENVIRONMENT.galaxyGain + zodiacal * 1.0;
      const g = galaxyColor[1] * galaxyTerm * HDR_ENVIRONMENT.galaxyGain + zodiacal * 0.95;
      const b = galaxyColor[2] * galaxyTerm * HDR_ENVIRONMENT.galaxyGain + zodiacal * 0.85;
      const index = (y * w + x) * 4;
      radiance[index] = r;
      radiance[index + 1] = g;
      radiance[index + 2] = b;
      radiance[index + 3] = 1;
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      maxLuminance = Math.max(maxLuminance, luminance);
      totalLuminance += luminance;
    }
  }
  // Stars: hash onto the equirect grid with the catalogue's magnitude layers,
  // adding their flux into the nearest texel (point sources with true range).
  let starCount = 0;
  for (let layer = 0; layer < STARFIELD_LAYERS.length; layer += 1) {
    const info = STARFIELD_LAYERS[layer];
    for (let face = 0; face < 6; face += 1) {
      for (let cy = 0; cy < info.cells; cy += 1) {
        for (let cx = 0; cx < info.cells; cx += 1) {
          const presence = latticeHash01(face * 131 + cx, cy, layer, seed);
          if (presence > info.probability) continue;
          const hx = latticeHash01(cx + 61 * face, cy + 17 * layer, 1, seed);
          const hy = latticeHash01(cx + 29 * layer, cy + 43 * face, 2, seed);
          const hf = latticeHash01(cx, cy + 53 * (face + 1), 3, seed);
          const flux = starFlux(info, hf);
          const kelvin = starKelvin(hy);
          const color = unitLuminanceColor(kelvin);
          // Cube-face cell centre -> direction (approximate placement is fine
          // for a lighting environment; the observatory sky stays separate).
          const fx = (cx + hx) / info.cells * 2 - 1;
          const fy = (cy + hy) / info.cells * 2 - 1;
          const axis = face % 3;
          const sign = face < 3 ? 1 : -1;
          const dir = [0, 0, 0];
          dir[axis] = sign;
          const u1 = axis === 0 ? 1 : 0;
          const u2 = axis === 2 ? 1 : 2;
          dir[u1] = dir[u1] === 0 ? fx : dir[u1];
          dir[u2] = dir[u2] === 0 ? fy : dir[u2];
          const norm = Math.hypot(dir[0], dir[1], dir[2]) || 1;
          const dx = dir[0] / norm;
          const dy = dir[1] / norm;
          const dz = dir[2] / norm;
          const theta = Math.acos(Math.max(-1, Math.min(1, dy)));
          const phi = Math.atan2(dz, dx);
          const px = Math.min(w - 1, Math.max(0, Math.floor(((phi / (2 * Math.PI)) + 0.5) * w)));
          const py = Math.min(h - 1, Math.max(0, Math.floor((theta / Math.PI) * h)));
          const index = (py * w + px) * 4;
          const boost = HDR_ENVIRONMENT.starGain * flux;
          radiance[index] += color[0] * boost;
          radiance[index + 1] += color[1] * boost;
          radiance[index + 2] += color[2] * boost;
          starCount += 1;
        }
      }
    }
  }
  // Refresh the stats with the stars included.
  maxLuminance = 0;
  totalLuminance = 0;
  for (let i = 0; i < w * h; i += 1) {
    const luminance = 0.2126 * radiance[i * 4] + 0.7152 * radiance[i * 4 + 1] + 0.0722 * radiance[i * 4 + 2];
    maxLuminance = Math.max(maxLuminance, luminance);
    totalLuminance += luminance;
  }
  return {
    width: w,
    height: h,
    radiance,
    stats: Object.freeze({
      maxLuminance,
      meanLuminance: totalLuminance / (w * h),
      starCount,
      seed,
    }),
  };
}

/* ------------------------------------------------------------------ */
/* Importance sampling                                                 */
/* ------------------------------------------------------------------ */

/**
 * Cumulative distribution over the environment's texels, weighted by
 * luminance times the texel's solid angle (equirect texels near the poles
 * cover less sky). `cdf[i]` is the probability of texel <= i; the last
 * entry is exactly 1.
 */
export function buildImportanceTable(environment, { bins = null } = {}) {
  const { width, height, radiance } = environment;
  const count = bins ?? width * height;
  if (count < 1) throw new TypeError("Importance table needs at least one bin");
  const stride = Math.max(1, Math.floor((width * height) / count));
  const weights = new Float64Array(count);
  let total = 0;
  for (let bin = 0; bin < count; bin += 1) {
    const texel = Math.min(width * height - 1, bin * stride);
    const y = Math.floor(texel / width);
    const sinTheta = Math.sin((Math.PI * (y + 0.5)) / height);
    const luminance = 0.2126 * radiance[texel * 4] + 0.7152 * radiance[texel * 4 + 1] + 0.0722 * radiance[texel * 4 + 2];
    const weight = Math.max(luminance, 0) * sinTheta;
    weights[bin] = weight;
    total += weight;
  }
  if (!(total > 0)) throw new RangeError("Environment luminance is identically zero; cannot importance-sample");
  const cdf = new Float64Array(count);
  let cumulative = 0;
  for (let bin = 0; bin < count; bin += 1) {
    cumulative += weights[bin] / total;
    cdf[bin] = Math.min(1, cumulative);
  }
  cdf[count - 1] = 1;
  return Object.freeze({
    cdf,
    totalWeight: total,
    bins: count,
    stride,
    environmentWidth: width,
    environmentHeight: height,
  });
}

/**
 * Invert the importance table: u in [0, 1) -> a direction and its pdf
 * (probability per solid angle). Binary search; deterministic.
 */
export function sampleEnvironmentDirection(table, u) {
  // Clamp to [0, 1) without relying on Math.nextafter (not universal).
  const raw = Math.max(0, Number(u) || 0);
  const value = raw >= 1 ? 1 - 1e-12 : raw;
  const { cdf, bins, stride, environmentWidth: width, environmentHeight: height } = table;
  let low = 0;
  let high = bins - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (cdf[mid] < value) low = mid + 1;
    else high = mid;
  }
  const bin = low;
  const texel = Math.min(width * height - 1, bin * stride);
  const y = Math.floor(texel / width);
  const x = texel % width;
  const dir = directionOf((x + 0.5) / width, (y + 0.5) / height);
  // pdf = bin probability / bin solid angle (stride texels of sin(theta) dtheta dphi each).
  const previous = bin > 0 ? cdf[bin - 1] : 0;
  const probability = cdf[bin] - previous;
  const sinTheta = Math.sin((Math.PI * (y + 0.5)) / height);
  const solidAngle = stride * sinTheta * ((2 * Math.PI) / width) * (Math.PI / height);
  const pdf = probability / Math.max(solidAngle, 1e-12);
  return { direction: dir, pdf, bin };
}

/** Bilinear radiance lookup for a unit direction (linear sRGB). */
export function environmentRadiance(environment, direction) {
  const { width, height, radiance } = environment;
  const [x, y, z] = direction;
  const theta = Math.acos(Math.max(-1, Math.min(1, y)));
  const phi = Math.atan2(z, x);
  const u = ((phi / (2 * Math.PI)) + 0.5) * width - 0.5;
  const v = (theta / Math.PI) * height - 0.5;
  const x0 = Math.floor(u);
  const y0 = Math.floor(v);
  const fx = u - x0;
  const fy = v - y0;
  const wrap = (column) => ((column % width) + width) % width;
  const clampRow = (row) => Math.min(height - 1, Math.max(0, row));
  const sample = (column, row) => {
    const index = (clampRow(row) * width + wrap(column)) * 4;
    return [radiance[index], radiance[index + 1], radiance[index + 2]];
  };
  const a = sample(x0, y0);
  const b = sample(x0 + 1, y0);
  const c = sample(x0, y0 + 1);
  const d = sample(x0 + 1, y0 + 1);
  return [
    a[0] * (1 - fx) * (1 - fy) + b[0] * fx * (1 - fy) + c[0] * (1 - fx) * fy + d[0] * fx * fy,
    a[1] * (1 - fx) * (1 - fy) + b[1] * fx * (1 - fy) + c[1] * (1 - fx) * fy + d[1] * fx * fy,
    a[2] * (1 - fx) * (1 - fy) + b[2] * fx * (1 - fy) + c[2] * (1 - fx) * fy + d[2] * fx * fy,
  ];
}

/* ------------------------------------------------------------------ */
/* Application contract                                                */
/* ------------------------------------------------------------------ */

/**
 * Apply (or refuse) the HDR environment to a scene. Refuses the excluded
 * views (the Kerr observatory: the event horizon is ray-traced black and
 * must never receive environment reflection — detected both by view id and
 * structurally by the observatory's display mesh, so no call path can
 * bypass it) and scenes without lit PBR materials (the environment only
 * affects material lighting).
 * @returns {{ applied: boolean, reason: string }}
 */
export function applyHdrEnvironment(scene, { viewId = null, texture = null } = {}) {
  let kerrScene = false;
  scene?.traverse?.((object) => {
    if (object?.name === "kerr-observatory-display") kerrScene = true;
  });
  if (hdrEnvironmentExcluded(viewId) || kerrScene) {
    if (scene?.environment) scene.environment = null;
    return {
      applied: false,
      reason: "The HDR environment is never applied to the Kerr observatory: the event horizon is ray-traced black and the observatory sky is its own lensed starfield.",
    };
  }
  let hasLitMaterial = false;
  scene?.traverse?.((object) => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (material?.isMeshStandardMaterial || material?.isMeshPhysicalMaterial) hasLitMaterial = true;
    }
  });
  if (!hasLitMaterial) {
    if (scene?.environment) scene.environment = null;
    return { applied: false, reason: "Scene has no lit PBR materials; the environment affects material lighting only." };
  }
  if (!texture) return { applied: false, reason: "No HDR environment texture was supplied." };
  scene.environment = texture;
  return { applied: true, reason: "HDR environment applied for image-based lighting of PBR materials." };
}

/** Browser-side texture factory (half-float equirect, linear colour space). */
export async function createHdrEnvironmentTexture({ seed = 42 } = {}) {
  const { DataTexture, EquirectangularReflectionMapping, HalfFloatType, LinearSRGBColorSpace, RGBAFormat } = await import("three");
  const environment = buildHdrEnvironment({ seed });
  const half = new Uint16Array(environment.width * environment.height * 4);
  const toHalf = (value) => {
    // Float32 -> float16 (IEEE 754 binary16), manual conversion.
    const buffer = new DataView(new ArrayBuffer(4));
    buffer.setFloat32(0, value);
    const bits = buffer.getUint32(0);
    const sign = (bits >>> 31) & 1;
    const exponent = (bits >>> 23) & 0xff;
    const mantissa = bits & TK.hex("pigment-cyan-93");
    if (exponent === 0xff) return (sign << 15) | 0x7c00;
    let newExponent = exponent - 127 + 15;
    if (newExponent >= 0x1f) return (sign << 15) | 0x7bff;
    if (newExponent <= 0) {
      if (newExponent < -10) return sign << 15;
      const mantissaShift = 14 - newExponent + 13;
      const restored = TK.hex("pigment-red-23") | mantissa;
      const fraction = restored >> mantissaShift;
      return (sign << 15) | fraction;
    }
    return (sign << 15) | (newExponent << 10) | (mantissa >> 13);
  };
  for (let i = 0; i < environment.radiance.length; i += 1) half[i] = toHalf(environment.radiance[i]);
  const texture = new DataTexture(half, environment.width, environment.height, RGBAFormat, HalfFloatType);
  texture.mapping = EquirectangularReflectionMapping;
  texture.colorSpace = LinearSRGBColorSpace;
  texture.needsUpdate = true;
  return Object.freeze({ texture, environment, dispose: () => texture.dispose() });
}
