// Blackbody emission material node (S07).
//
// A lookup table of blackbody chromaticity, sampled log-uniformly in temperature from js/science/spectrum.mjs
// `blackbodyToSrgb`, so the colour of a hot surface has exactly one definition on the CPU and the GPU. The table
// holds the linear-sRGB triple that function returns (peak channel 1); brightness is a separate radiance factor.

import { DataTexture, DataUtils, HalfFloatType, LinearFilter, ClampToEdgeWrapping, NoColorSpace, RGBAFormat } from "three";
import { float, log, texture, vec2, clamp } from "three/tsl";
import { blackbodyToSrgb } from "../../science/spectrum.mjs";

export const BLACKBODY_LUT_DEFAULTS = Object.freeze({ tMin: 1000, tMax: 40000, size: 256 });

/** Validated options with the defaults filled in. */
export function normalizeBlackbodyOptions({ tMin = BLACKBODY_LUT_DEFAULTS.tMin, tMax = BLACKBODY_LUT_DEFAULTS.tMax, size = BLACKBODY_LUT_DEFAULTS.size } = {}) {
  if (!Number.isFinite(tMin) || !Number.isFinite(tMax) || tMin <= 0 || tMax <= tMin) {
    throw new RangeError(`blackbodyLUT: need 0 < tMin < tMax, got tMin=${tMin} tMax=${tMax}`);
  }
  if (!Number.isInteger(size) || size < 2 || size > 4096) throw new RangeError(`blackbodyLUT: size must be an integer in 2..4096, got ${size}`);
  return Object.freeze({ tMin, tMax, size });
}

/** Temperature of table entry `i` (log-uniform from tMin to tMax inclusive). */
export function blackbodyLutTemperature(i, options = {}) {
  const { tMin, tMax, size } = normalizeBlackbodyOptions(options);
  return tMin * (tMax / tMin) ** (i / (size - 1));
}

/** The RGBA table (linear sRGB, alpha 1) as float32; entry i is blackbodyToSrgb(blackbodyLutTemperature(i)).linearRgb. */
export function blackbodyLutData(options = {}) {
  const normalized = normalizeBlackbodyOptions(options);
  const { size } = normalized;
  const rgba = new Float32Array(size * 4);
  for (let i = 0; i < size; i++) {
    const { r, g, b } = blackbodyToSrgb(blackbodyLutTemperature(i, normalized)).linearRgb;
    rgba.set([r, g, b, 1], i * 4);
  }
  return { ...normalized, rgba };
}

/** The table as a half-float DataTexture (filterable on every backend without OES_texture_float_linear). */
export function blackbodyLUT(options = {}) {
  const data = blackbodyLutData(options);
  const half = new Uint16Array(data.rgba.length);
  for (let i = 0; i < half.length; i++) half[i] = DataUtils.toHalfFloat(data.rgba[i]);
  const lut = new DataTexture(half, data.size, 1, RGBAFormat, HalfFloatType);
  lut.colorSpace = NoColorSpace;
  lut.minFilter = lut.magFilter = LinearFilter;
  lut.wrapS = lut.wrapT = ClampToEdgeWrapping;
  lut.generateMipmaps = false;
  lut.needsUpdate = true;
  lut.userData.blackbodyLut = { tMin: data.tMin, tMax: data.tMax, size: data.size };
  return lut;
}

/** Texture coordinate of a temperature: log-uniform, clamped, aimed at texel centres. */
export function blackbodyLutCoordinate(temperatureK, options = {}) {
  const { tMin, tMax, size } = normalizeBlackbodyOptions(options);
  const u = Math.min(1, Math.max(0, Math.log(temperatureK / tMin) / Math.log(tMax / tMin)));
  return (0.5 + u * (size - 1)) / size;
}

/**
 * TSL colour node: `lut(T) * radiance`. `temperatureNode` is in kelvin; `radianceNode` is a scalar or vec3 factor.
 * `lut` defaults to a table built with the default options; pass one table to share it between materials.
 */
export function blackbodyEmission(temperatureNode, radianceNode, lut = blackbodyLUT()) {
  const { tMin, tMax, size } = lut.userData.blackbodyLut ?? BLACKBODY_LUT_DEFAULTS;
  const u = clamp(log(float(temperatureNode).div(tMin)).div(Math.log(tMax / tMin)), 0, 1);
  const coordinate = u.mul(size - 1).add(0.5).div(size);
  return texture(lut, vec2(coordinate, 0.5)).rgb.mul(radianceNode);
}

/** Stable key of the shader variant this module contributes (js/render/shader-prewarm.mjs). */
export function prewarmSignature() {
  return `blackbody:${BLACKBODY_LUT_DEFAULTS.size}`;
}
