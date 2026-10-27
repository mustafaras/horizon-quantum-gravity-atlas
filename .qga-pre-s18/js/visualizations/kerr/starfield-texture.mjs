/**
 * Deterministic, distortion-aware starfield for the Kerr observatory.
 *
 * Stars are splatted as normalized Gaussians (conserved flux) into an
 * equirectangular linear-radiance map and a full mip chain is built on the CPU
 * in linear light. The renderer reads the map with `textureGrad`, taking the
 * gradients from the *lensed* escape direction's screen-space derivatives, so
 * a pixel whose neighbours map to wildly different sky directions (the
 * critical curve) averages over that whole solid angle instead of point
 * sampling it. That is what removes streaking and single-pixel flicker.
 *
 * Pure: no DOM, no Three.js. Every random draw comes from the seed.
 * Star colour is the science core's CIE blackbody conversion.
 */

import { blackbodyToSrgb } from "../../science/spectrum.mjs";

/** Linear radiance represented by an 8-bit value of 255 (documented encoding). */
export const STARFIELD_VMAX = 4;
/** Gaussian splat width at native resolution, in texels. */
export const STARFIELD_SIGMA_TEXELS = 0.85;
/** Pixel footprints above this many radians are clamped (the sky is averaged, not sampled). */
export const STARFIELD_MAX_FOOTPRINT_RAD = 0.3;

export const STARFIELD_PRESETS = Object.freeze({
  performance: Object.freeze({ width: 1024, height: 512, stars: 3500 }),
  balanced: Object.freeze({ width: 2048, height: 1024, stars: 9000 }),
  ultra: Object.freeze({ width: 3072, height: 1536, stars: 18000 }),
});

const GALACTIC_NORMAL = (() => {
  const n = [0.31, 0.82, 0.48];
  const length = Math.hypot(...n);
  return Object.freeze(n.map((value) => value / length));
})();

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng) {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

let colorTable = null;
function starColor(temperatureK) {
  if (!colorTable) {
    colorTable = Array.from({ length: 48 }, (_, index) => {
      const kelvin = 2800 + (index / 47) * 13200;
      const { linearRgb } = blackbodyToSrgb(kelvin);
      return { kelvin, r: linearRgb.r, g: linearRgb.g, b: linearRgb.b };
    });
  }
  const t = Math.min(1, Math.max(0, (temperatureK - 2800) / 13200));
  return colorTable[Math.round(t * 47)];
}

/**
 * Seeded star catalogue on the unit sphere. `flux` is the integrated linear
 * radiance of the star; about `bandFraction` of the stars are concentrated in a
 * great-circle band so that lensing of extended structure is visible.
 *
 * @returns {{ x: number, y: number, z: number, flux: number, temperatureK: number }[]}
 */
export function generateStarCatalog({ seed = 42, count = 9000, bandFraction = 0.45 } = {}) {
  if (!Number.isInteger(count) || count < 0) throw new RangeError("count must be a non-negative integer");
  const rng = mulberry32((Number(seed) | 0) ^ 0x51ed270b);
  const [nx, ny, nz] = GALACTIC_NORMAL;
  const stars = [];
  for (let i = 0; i < count; i += 1) {
    let x = gaussian(rng);
    let y = gaussian(rng);
    let z = gaussian(rng);
    if (rng() < bandFraction) {
      const d = x * nx + y * ny + z * nz;
      x -= 0.86 * d * nx;
      y -= 0.86 * d * ny;
      z -= 0.86 * d * nz;
    }
    const length = Math.hypot(x, y, z) || 1;
    const flux = Math.min(14, 0.35 * Math.pow(1 - rng(), -0.55));
    const temperatureK = 3000 + 12000 * Math.pow(rng(), 1.6);
    stars.push({ x: x / length, y: y / length, z: z / length, flux, temperatureK });
  }
  return stars;
}

/**
 * Spherical-Gaussian splat. The kernel is evaluated on angular distance, so
 * stars stay round at every latitude (an equirectangular map stretches them
 * toward the poles otherwise). Texel value = radiance per steradian, so the
 * integrated flux of a star is `flux` independent of where it sits.
 */
function splat(buffer, width, height, star, sigmaRad, red, green, blue) {
  const lonStar = Math.atan2(star.z, star.x);
  const thetaStar = Math.acos(Math.max(-1, Math.min(1, star.y)));
  const cosS = Math.cos(thetaStar);
  const sinS = Math.sin(thetaStar);
  const reach = 3 * sigmaRad;
  const cosReach = Math.cos(reach);
  const texelV = Math.PI / height;
  const rowMin = Math.max(0, Math.floor((thetaStar - reach) / texelV));
  const rowMax = Math.min(height - 1, Math.ceil((thetaStar + reach) / texelV));
  // Flux is expressed in texel solid angles (so a flux-1 star peaks near 0.2 at native resolution).
  const amplitude = 1 / (2 * Math.PI * STARFIELD_SIGMA_TEXELS * STARFIELD_SIGMA_TEXELS);
  const twoPi = 2 * Math.PI;
  for (let y = rowMin; y <= rowMax; y += 1) {
    const theta = ((y + 0.5) * Math.PI) / height;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    let half = width;
    const denom = sinT * sinS;
    if (denom > 1e-9) {
      const c = (cosReach - cosT * cosS) / denom;
      if (c > 1) continue;
      if (c > -1) half = Math.min(width, Math.ceil((Math.acos(c) / twoPi) * width) + 1);
    }
    const centre = Math.floor(((lonStar / twoPi) + 0.5) * width);
    const span = half >= width ? width : 2 * half + 1;
    const start = half >= width ? 0 : centre - half;
    for (let k = 0; k < span; k += 1) {
      const x = start + k;
      const lon = ((((x % width) + width) % width + 0.5) / width - 0.5) * twoPi;
      const cosD = cosT * cosS + sinT * sinS * Math.cos(lon - lonStar);
      if (cosD < cosReach) continue;
      const w = amplitude * Math.exp(-(1 - cosD) / (sigmaRad * sigmaRad));
      const index = (y * width + (((x % width) + width) % width)) * 3;
      buffer[index] += red * w;
      buffer[index + 1] += green * w;
      buffer[index + 2] += blue * w;
    }
  }
}

function encode(value) {
  return Math.round(255 * Math.sqrt(Math.min(1, Math.max(0, value / STARFIELD_VMAX))));
}

function toBytes(float, width, height) {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0, j = 0; i < width * height; i += 1, j += 4) {
    data[j] = encode(float[i * 3]);
    data[j + 1] = encode(float[i * 3 + 1]);
    data[j + 2] = encode(float[i * 3 + 2]);
    data[j + 3] = 255;
  }
  return data;
}

function halve(float, width, height) {
  const w = Math.max(1, width >> 1);
  const h = Math.max(1, height >> 1);
  const out = new Float32Array(w * h * 3);
  // Rows are weighted by sin(theta): the mip average is a solid-angle average.
  const rowWeight = (y) => Math.max(Math.sin(((y + 0.5) * Math.PI) / height), 1e-6);
  for (let y = 0; y < h; y += 1) {
    const y0 = Math.min(height - 1, 2 * y);
    const y1 = Math.min(height - 1, 2 * y + 1);
    const w0 = rowWeight(y0);
    const w1 = rowWeight(y1);
    const norm = 1 / (2 * (w0 + w1));
    for (let x = 0; x < w; x += 1) {
      const x0 = Math.min(width - 1, 2 * x);
      const x1 = Math.min(width - 1, 2 * x + 1);
      for (let c = 0; c < 3; c += 1) {
        out[(y * w + x) * 3 + c] = norm * (
          w0 * (float[(y0 * width + x0) * 3 + c] + float[(y0 * width + x1) * 3 + c])
          + w1 * (float[(y1 * width + x0) * 3 + c] + float[(y1 * width + x1) * 3 + c]));
      }
    }
  }
  return { float: out, width: w, height: h };
}

/**
 * Render the equirectangular sky and its mip chain.
 *
 * @returns {{
 *   width: number, height: number, vmax: number, seed: number, stars: number,
 *   levels: { data: Uint8Array, width: number, height: number }[],
 *   meanLinear: number[], checksum: number,
 * }}
 */
export function renderStarfield({ seed = 42, quality = "balanced", width, height, stars } = {}) {
  const preset = STARFIELD_PRESETS[quality] ?? STARFIELD_PRESETS.balanced;
  const W = width ?? preset.width;
  const H = height ?? preset.height;
  const catalog = generateStarCatalog({ seed, count: stars ?? preset.stars });
  let float = new Float32Array(W * H * 3);
  for (const star of catalog) {
    const color = starColor(star.temperatureK);
    const luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b || 1;
    const scale = star.flux / luminance;
    splat(float, W, H, star, (STARFIELD_SIGMA_TEXELS * Math.PI) / H,
      color.r * scale, color.g * scale, color.b * scale);
  }
  const levels = [];
  let w = W;
  let h = H;
  let checksum = 2166136261;
  let meanLinear = [0, 0, 0];
  for (;;) {
    const data = toBytes(float, w, h);
    if (levels.length === 0) {
      for (let i = 0; i < data.length; i += 97) checksum = Math.imul(checksum ^ data[i], 16777619) >>> 0;
      let weightSum = 0;
      meanLinear = [0, 0, 0];
      for (let y = 0; y < h; y += 1) {
        const weight = Math.sin(((y + 0.5) * Math.PI) / h);
        for (let x = 0; x < w; x += 1) {
          const i = (y * w + x) * 3;
          meanLinear[0] += weight * float[i]; meanLinear[1] += weight * float[i + 1]; meanLinear[2] += weight * float[i + 2];
        }
        weightSum += weight * w;
      }
      meanLinear = meanLinear.map((value) => value / weightSum);
    }
    levels.push({ data, width: w, height: h });
    if (w === 1 && h === 1) break;
    const next = halve(float, w, h);
    float = next.float; w = next.width; h = next.height;
  }
  return { width: W, height: H, vmax: STARFIELD_VMAX, seed, stars: catalog.length, levels, meanLinear, checksum };
}

/**
 * Footprint-to-LOD relation used by the renderer: one texel of the equirect map
 * subtends 2π/width radians at the equator.
 */
export function starfieldLod(footprintRad, widthTexels) {
  const footprint = Math.min(Math.max(footprintRad, 0), STARFIELD_MAX_FOOTPRINT_RAD);
  const texel = (2 * Math.PI) / widthTexels;
  return Math.max(0, Math.log2(Math.max(footprint / texel, 1e-9)));
}

/**
 * Texture-space gradients (u, v) for a clamped angular pixel footprint. The
 * gradients are isotropic in texels (one texel is 2π/width radians at the
 * equator): near the poles the map content is stretched along u, so dividing
 * du by sin(theta) would blur whole latitude rows into concentric bands.
 */
export function starfieldGradients(footprintRad) {
  const footprint = Math.min(Math.max(footprintRad, 0), STARFIELD_MAX_FOOTPRINT_RAD);
  return { du: footprint / (2 * Math.PI), dv: footprint / Math.PI };
}
