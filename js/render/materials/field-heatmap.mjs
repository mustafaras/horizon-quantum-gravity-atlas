// Scalar-field heatmap material (S07): a value node mapped through a palette table, with optional iso-contours of
// constant pixel width. S10 uses it to show any formula term.
//
// Palettes come from js/design/palettes.mjs (sequential tables are committed data; the diverging ramp is built from the
// design tokens), or from explicit linear-light stops. Interpolation between stops is linear in linear light.

import { DataTexture, DataUtils, HalfFloatType, LinearFilter, ClampToEdgeWrapping, NoColorSpace, RGBAFormat } from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { clamp, float, mix, texture, vec2, vec3, vec4 } from "three/tsl";
import { SEQUENTIAL_NAMES, SEQUENTIAL_SIZE, diverging, sampleSequential } from "../../design/palettes.mjs";
import * as TK from "../../design/tokens.mjs";
import { lineCoverage } from "./engraved-grid.mjs";

export const FIELD_PALETTE_SIZE = 256;

/** Validated options with defaults. */
export function normalizeFieldOptions({ range, palette = "sequential", paletteName = "viridis", contours = null, tokens = null } = {}) {
  if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isFinite) || !(range[0] < range[1])) {
    throw new RangeError(`fieldMaterial: range must be [lo, hi] with lo < hi, got ${JSON.stringify(range)}`);
  }
  const custom = palette && typeof palette === "object";
  if (!custom && !["sequential", "diverging"].includes(palette)) throw new RangeError(`fieldMaterial: palette must be "sequential", "diverging" or { stops }, got ${palette}`);
  if (custom && !(Array.isArray(palette.stops) && palette.stops.length >= 2 && palette.stops.every((s) => Array.isArray(s) && s.length === 3 && s.every(Number.isFinite)))) {
    throw new RangeError("fieldMaterial: a custom palette needs { stops: [[r, g, b], ...] } with at least two linear-sRGB stops");
  }
  if (palette === "sequential" && !SEQUENTIAL_NAMES.includes(paletteName)) throw new RangeError(`fieldMaterial: unknown sequential map "${paletteName}"`);
  let contour = null;
  if (contours) {
    const { step, widthPx = 1, opacity = 0.6, color = "pigment-white" } = contours;
    if (!(step > 0) || !Number.isFinite(step)) throw new RangeError(`fieldMaterial: contours.step must be positive, got ${step}`);
    if (!(widthPx > 0 && widthPx <= 8)) throw new RangeError(`fieldMaterial: contours.widthPx must be in (0, 8], got ${widthPx}`);
    if (!(opacity >= 0 && opacity <= 1)) throw new RangeError(`fieldMaterial: contours.opacity must be in [0, 1], got ${opacity}`);
    contour = Object.freeze({ step, widthPx, opacity, color });
  }
  return Object.freeze({ range: Object.freeze([...range]), palette: custom ? Object.freeze({ stops: palette.stops.map((s) => [...s]) }) : palette, paletteName, contours: contour, tokens });
}

function stopsRamp(stops, size) {
  const out = new Float32Array(size * 4);
  for (let i = 0; i < size; i++) {
    const x = (i / (size - 1)) * (stops.length - 1);
    const k = Math.min(stops.length - 2, Math.floor(x));
    const f = x - k;
    for (let c = 0; c < 3; c++) out[i * 4 + c] = stops[k][c] * (1 - f) + stops[k + 1][c] * f;
    out[i * 4 + 3] = 1;
  }
  return out;
}

/** The palette as a linear-sRGB RGBA float32 table of `size` entries (pure; used by the texture builder and the tests). */
export function paletteLutData(options, size = FIELD_PALETTE_SIZE) {
  const { palette, paletteName, tokens } = normalizeFieldOptions({ range: [0, 1], ...options });
  if (!Number.isInteger(size) || size < 2 || size > 4096) throw new RangeError(`paletteLutData: size must be an integer in 2..4096, got ${size}`);
  if (typeof palette === "object") return stopsRamp(palette.stops, size);
  const out = new Float32Array(size * 4);
  if (palette === "sequential") {
    for (let i = 0; i < size; i++) out.set([...sampleSequential(paletteName, i / (size - 1)), 1], i * 4);
  } else {
    const ramp = diverging(tokens ?? TK.current());
    for (let i = 0; i < size; i++) out.set([...ramp.sample((i / (size - 1)) * 2 - 1), 1], i * 4);
  }
  return out;
}

/** The palette table as a half-float DataTexture. */
export function paletteTexture(options, size = FIELD_PALETTE_SIZE) {
  const data = paletteLutData(options, size);
  const half = new Uint16Array(data.length);
  for (let i = 0; i < half.length; i++) half[i] = DataUtils.toHalfFloat(data[i]);
  const lut = new DataTexture(half, size, 1, RGBAFormat, HalfFloatType);
  lut.colorSpace = NoColorSpace;
  lut.minFilter = lut.magFilter = LinearFilter;
  lut.wrapS = lut.wrapT = ClampToEdgeWrapping;
  lut.generateMipmaps = false;
  lut.needsUpdate = true;
  return lut;
}

/** The colour node of `valueNode` through `lut` over `range`; the value is clamped to the range. */
export function fieldColorNode(valueNode, range, lut) {
  const [lo, hi] = range;
  const t = clamp(float(valueNode).sub(lo).div(hi - lo), 0, 1);
  const size = lut.image.width;
  return texture(lut, vec2(t.mul(size - 1).add(0.5).div(size), 0.5)).rgb;
}

/** Iso-contour coverage of `valueNode`: a line of constant pixel width every `step`. */
export function contourNode(valueNode, { step, widthPx }) {
  return lineCoverage(float(valueNode).div(step), widthPx);
}

/** A node material colouring a surface by `valueNode`, with optional contours. */
export function fieldMaterial({ valueNode, ...rest } = {}) {
  if (!valueNode || !valueNode.isNode) throw new TypeError("fieldMaterial: valueNode must be a TSL node");
  const options = normalizeFieldOptions(rest);
  const lut = paletteTexture(options);
  let color = fieldColorNode(valueNode, options.range, lut);
  if (options.contours) {
    const [r, g, b] = TK.linear(options.contours.color);
    color = mix(color, vec3(r, g, b), contourNode(valueNode, options.contours).mul(options.contours.opacity));
  }
  const material = new MeshBasicNodeMaterial({ fog: false });
  material.colorNode = vec4(color, 1);
  material.userData.qgaNodeKit = true;
  material.userData.kit = "field-heatmap";
  material.userData.fieldPalette = lut;
  return material;
}

export function prewarmSignature() {
  return `field-heatmap:${SEQUENTIAL_SIZE}`;
}
