// Data palettes for figures: sequential tables, an 8-colour categorical set, a diverging ramp.
// Sequential tables are committed data (./palette-data.mjs, with licence notes); categorical and
// diverging colours are defined once, in styles/tokens.css, and read here from a token object.
// Rainbow / jet maps are not provided and are forbidden by docs/design/art-direction.md.

import { SEQUENTIAL_TABLES } from "./palette-data.mjs";
import { linearToOklab, oklabToLinear } from "./color.mjs";

export { simulateCvd, CVD_TYPES } from "./cvd.mjs";

export const SEQUENTIAL_NAMES = Object.freeze(["viridis", "magma", "cividis"]);
export const SEQUENTIAL_SIZE = 256;

function table(name) {
  const t = SEQUENTIAL_TABLES[name];
  if (!t) throw new RangeError(`palettes: unknown sequential map "${name}" (use ${SEQUENTIAL_NAMES.join(", ")})`);
  return t;
}

/** Entry `i` (0..255) of a sequential table as a new linear-sRGB triple. */
export function sequentialEntry(name, i) {
  const t = table(name);
  if (!Number.isInteger(i) || i < 0 || i >= SEQUENTIAL_SIZE) throw new RangeError(`palettes: index ${i} outside 0..255`);
  return [t[3 * i], t[3 * i + 1], t[3 * i + 2]];
}

/** All 256 entries of a sequential table as linear-sRGB triples. */
export function sequentialTable(name) {
  return Array.from({ length: SEQUENTIAL_SIZE }, (_, i) => sequentialEntry(name, i));
}

/** Sample a sequential map at t in [0, 1] (clamped), interpolating linearly between entries in linear light. */
export function sampleSequential(name, t) {
  const tab = table(name);
  const x = (Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0) * (SEQUENTIAL_SIZE - 1);
  const i = Math.min(SEQUENTIAL_SIZE - 2, Math.floor(x));
  const f = x - i;
  return [0, 1, 2].map((c) => tab[3 * i + c] * (1 - f) + tab[3 * (i + 1) + c] * f);
}

export const CATEGORICAL_TOKENS = Object.freeze(Array.from({ length: 8 }, (_, i) => `cat-${i + 1}`));
export const DIVERGING_TOKENS = Object.freeze(["div-neg-2", "div-neg-1", "div-mid", "div-pos-1", "div-pos-2"]);

function pick(tokens, names) {
  return names.map((name) => {
    const hit = tokens.color[name];
    if (!hit) throw new RangeError(`palettes: token --${name} is missing`);
    return Object.freeze({ name, css: hit.css, linear: hit.linear });
  });
}

/** The eight categorical colours, in order; neighbours are pairwise distinguishable (tested). */
export const categorical = (tokens) => Object.freeze(pick(tokens, CATEGORICAL_TOKENS));

/**
 * Diverging ramp for signed quantities. `sample(v)` takes v in [-1, 1] (clamped); -1 is the strong
 * negative end, 0 the neutral mid and +1 the strong positive end. Interpolation is in OKLab.
 */
export function diverging(tokens) {
  const stops = pick(tokens, DIVERGING_TOKENS);
  const labs = stops.map((s) => linearToOklab(s.linear));
  const sample = (v) => {
    const x = ((Number.isFinite(v) ? Math.min(1, Math.max(-1, v)) : 0) + 1) * (stops.length - 1) / 2;
    const i = Math.min(stops.length - 2, Math.floor(x));
    const f = x - i;
    const lab = labs[i].map((c, k) => c * (1 - f) + labs[i + 1][k] * f);
    return oklabToLinear(lab).map((c) => Math.min(1, Math.max(0, c)));
  };
  return Object.freeze({ stops: Object.freeze(stops), sample });
}
