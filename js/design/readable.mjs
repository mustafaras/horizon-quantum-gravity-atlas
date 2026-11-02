// Readable text on a coloured chip. A cell whose fill comes from data (a mixing-matrix magnitude mapped to opacity) cannot
// carry one fixed label colour: the label that clears 4.5:1 on a dark theme's chip fails on a light theme's. The label is
// chosen from a short list by the contrast it really has on the fill as the browser composites it. Pure and DOM-free.

import { linearToSrgb, srgbToLinear, contrastRatio } from "./color.mjs";

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const toSrgb = (linear) => linear.map((v) => linearToSrgb(clamp01(v)));

/** `fill` at `alpha` over `ground`, blended in sRGB as CSS does; all three are linear-light RGB triples. */
export function blendOver(fill, alpha, ground) {
  const a = clamp01(Number(alpha));
  const f = toSrgb(fill);
  const g = toSrgb(ground);
  return f.map((v, k) => v * a + g[k] * (1 - a)).map(srgbToLinear);
}

/**
 * Index into `candidates` (linear RGB triples, in order of preference) of the first whose contrast on `background`
 * reaches `min`; when none does, the one with the highest contrast. Preference order keeps the usual label wherever it
 * already works, so a theme that was fine stays exactly as it was.
 */
export function pickReadable(background, candidates, min = 4.5) {
  if (!candidates.length) throw new RangeError("pickReadable needs at least one candidate");
  let best = 0, bestRatio = -Infinity;
  for (let i = 0; i < candidates.length; i++) {
    const ratio = contrastRatio(candidates[i], background);
    if (ratio >= min) return i;
    if (ratio > bestRatio) { bestRatio = ratio; best = i; }
  }
  return best;
}
