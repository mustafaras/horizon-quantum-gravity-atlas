// Themes and scene pigments (S34). The ~200 `--pigment-*` tokens are colours that scene and canvas code picked for a
// dark observatory sky. They are not themed one by one: each theme maps all of them through one rule in OKLCH, so a
// theme is a handful of numbers rather than a second table. Pure and DOM-free.
//
//   observatory  identity.
//   blueprint    luminance kept, mapped onto a Prussian-blue-to-white ramp, chroma almost removed: engraved linework.
//   print        lightness inverted onto paper: light tints become dark ink, near-black backdrops become paper.

import { cssColorToLinear, linearToOklch, oklchToLinear } from "./color.mjs";

export const THEME_IDS = Object.freeze(["observatory", "blueprint", "print"]);
export const DEFAULT_THEME = "observatory";

const BLUEPRINT = Object.freeze({ lightFloor: 0.3, lightSpan: 0.68, chromaScale: 0.18, hue: 240, hueKeep: 0.1 });
// L' = top - slope * L^gamma: a power curve keeps near-black backdrops near paper while mid tones stay dark enough for 3:1.
const PRINT = Object.freeze({ lightTop: 0.99, lightSlope: 1.06, lightGamma: 1.3, lightFloor: 0.12, chromaScale: 0.9 });
const GAMUT_STEPS = 24;
const GAMUT_SLACK = 1e-4;

const inGamut = (rgb) => rgb.every((v) => v >= -GAMUT_SLACK && v <= 1 + GAMUT_SLACK);

/** `oklch(L C H)` with the chroma reduced, if needed, until the colour fits sRGB. */
function formatOklch(lightness, chroma, hue) {
  let c = chroma;
  for (let i = 0; i < GAMUT_STEPS && !inGamut(oklchToLinear([lightness, c, hue])); i++) c *= 0.92;
  return `oklch(${lightness.toFixed(3)} ${c.toFixed(3)} ${(((hue % 360) + 360) % 360).toFixed(1)})`;
}

/** The pigment `css` as drawn in `theme`. Unknown themes throw; unparseable input is returned unchanged. */
export function themePigment(css, theme) {
  if (theme === DEFAULT_THEME) return css;
  if (!THEME_IDS.includes(theme)) throw new RangeError(`theme: unknown theme "${theme}" (${THEME_IDS.join(", ")})`);
  let lch;
  try { lch = linearToOklch(cssColorToLinear(css)); } catch { return css; }
  const [l, c, h] = lch;
  if (theme === "print") {
    const inverted = PRINT.lightTop - PRINT.lightSlope * Math.pow(Math.max(0, l), PRINT.lightGamma);
    return formatOklch(Math.min(PRINT.lightTop, Math.max(PRINT.lightFloor, inverted)), c * PRINT.chromaScale, h);
  }
  const hue = BLUEPRINT.hue + (((h - BLUEPRINT.hue + 540) % 360) - 180) * BLUEPRINT.hueKeep;
  return formatOklch(BLUEPRINT.lightFloor + BLUEPRINT.lightSpan * l, c * BLUEPRINT.chromaScale, hue);
}
