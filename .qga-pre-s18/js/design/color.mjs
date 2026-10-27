// Colour mathematics shared by the token reader, the palettes and the tests.
// Pure functions on plain arrays; imports in Node without DOM, canvas or three.js.
//
// References (matrices and constants are transcribed from the primary sources):
//  - sRGB transfer function: IEC 61966-2-1:1999.
//  - OKLab / OKLCH: Bjorn Ottosson, "A perceptual color space for image
//    processing", 2020-12-23, https://bottosson.github.io/posts/oklab/
//  - CIEDE2000: Sharma, Wu, Dalal (2005), Color Res. Appl. 30(1):21-30,
//    doi:10.1002/col.20070 (including their implementation notes).
//  - WCAG 2.1 relative luminance and contrast ratio, success criterion 1.4.3.

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function linearToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

// ---- OKLab / OKLCH (Ottosson 2020) -------------------------------------

export function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

/** Unclamped: out-of-gamut OKLab values give channels outside [0, 1]. */
export function oklabToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

export function oklchToOklab([L, C, hDeg]) {
  const h = (hDeg * Math.PI) / 180;
  return [L, C * Math.cos(h), C * Math.sin(h)];
}

export function oklabToOklch([L, a, b]) {
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return [L, C, C < 1e-8 ? 0 : h];
}

export const oklchToLinear = (lch) => oklabToLinear(oklchToOklab(lch));
export const linearToOklch = (rgb) => oklabToOklch(linearToOklab(rgb));

// ---- CIELAB (D65) and CIEDE2000 -----------------------------------------

const D65 = [0.95047, 1.0, 1.08883];

export function linearToXyz([r, g, b]) {
  return [
    0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    0.2126729 * r + 0.7151522 * g + 0.0721750 * b,
    0.0193339 * r + 0.1191920 * g + 0.9503041 * b,
  ];
}

export function linearToLab(rgb) {
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const xyz = linearToXyz(rgb);
  const fx = f(xyz[0] / D65[0]);
  const fy = f(xyz[1] / D65[1]);
  const fz = f(xyz[2] / D65[2]);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** CIEDE2000 between two CIELAB triples, kL = kC = kH = 1 (Sharma et al. 2005, eqs. 1-23). */
export function deltaE2000(lab1, lab2) {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar7 = ((C1 + C2) / 2) ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const hp = (b, ap) => (b === 0 && ap === 0 ? 0 : (deg(Math.atan2(b, ap)) + 360) % 360);
  const h1p = hp(b1, a1p);
  const h2p = hp(b2, a2p);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2));

  const Lbp = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) {
    hbp = Math.abs(h1p - h2p) <= 180 ? hbp / 2 : (hbp + (hbp < 360 ? 360 : -360)) / 2;
  }

  const T = 1 - 0.17 * Math.cos(rad(hbp - 30)) + 0.24 * Math.cos(rad(2 * hbp))
    + 0.32 * Math.cos(rad(3 * hbp + 6)) - 0.20 * Math.cos(rad(4 * hbp - 63));
  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(rad(2 * dTheta)) * Rc;

  return Math.sqrt(
    (dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh),
  );
}

/** CIEDE2000 between two linear-sRGB triples. */
export const deltaE2000Linear = (a, b) => deltaE2000(linearToLab(a), linearToLab(b));

// ---- WCAG 2.1 ----------------------------------------------------------

export function relativeLuminance([r, g, b]) {
  return 0.2126 * clamp01(r) + 0.7152 * clamp01(g) + 0.0722 * clamp01(b);
}

export function contrastRatio(rgbA, rgbB) {
  const la = relativeLuminance(rgbA);
  const lb = relativeLuminance(rgbB);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Composite a colour with alpha over an opaque linear background (premultiplied, in linear light). */
export const compositeLinear = (fg, alpha, bg) => fg.map((v, i) => v * alpha + bg[i] * (1 - alpha));

// ---- CSS colour strings -------------------------------------------------

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function parseChannel(token, scale) {
  if (token.endsWith("%")) return (parseFloat(token) / 100) * scale;
  return parseFloat(token);
}

function parseAlpha(token) {
  if (token === undefined) return 1;
  const v = token.endsWith("%") ? parseFloat(token) / 100 : parseFloat(token);
  return Number.isFinite(v) ? clamp01(v) : 1;
}

function splitFunctionArgs(body) {
  const [main, alphaSlash] = body.split("/").map((s) => s.trim());
  const parts = main.split(/[\s,]+/).filter(Boolean);
  // legacy comma syntax carries alpha as the fourth component
  if (alphaSlash === undefined && parts.length === 4) return { parts: parts.slice(0, 3), alpha: parts[3] };
  return { parts, alpha: alphaSlash };
}

/**
 * Parse #rgb, #rgba, #rrggbb, #rrggbbaa, rgb[a](), oklch(), color(srgb | srgb-linear …) into
 * `{ linear: [r, g, b], srgb: [r, g, b], alpha }`. Linear values are clamped to the sRGB gamut.
 * Returns null for anything else (named colours, var(), gradients).
 */
export function parseCssColor(input) {
  if (typeof input !== "string") return null;
  const str = input.trim();
  if (HEX.test(str)) {
    let h = str.slice(1);
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
    const srgb = [n(0), n(2), n(4)];
    return { srgb, linear: srgb.map(srgbToLinear), alpha: h.length === 8 ? n(6) : 1 };
  }
  const cs = /^color\(\s*(srgb-linear|srgb)\s+([^)]*)\)$/i.exec(str);
  if (cs) {
    const { parts, alpha } = splitFunctionArgs(cs[2]);
    const v = parts.map((p) => (p.endsWith("%") ? parseFloat(p) / 100 : parseFloat(p)));
    if (parts.length !== 3 || !v.every(Number.isFinite)) return null;
    const channels = v.map(clamp01);
    return cs[1].toLowerCase() === "srgb-linear"
      ? { srgb: channels.map(linearToSrgb), linear: channels, alpha: parseAlpha(alpha) }
      : { srgb: channels, linear: channels.map(srgbToLinear), alpha: parseAlpha(alpha) };
  }
  const fn = /^(rgba?|oklch)\(\s*([^)]*)\)$/i.exec(str);
  if (!fn) return null;
  const kind = fn[1].toLowerCase();
  const { parts, alpha } = splitFunctionArgs(fn[2]);
  if (parts.length !== 3) return null;
  if (kind === "oklch") {
    const L = parts[0].endsWith("%") ? parseFloat(parts[0]) / 100 : parseFloat(parts[0]);
    const C = parts[1].endsWith("%") ? (parseFloat(parts[1]) / 100) * 0.4 : parseFloat(parts[1]);
    const H = parts[2] === "none" ? 0 : parseFloat(parts[2]);
    if (![L, C, H].every(Number.isFinite)) return null;
    const linear = oklchToLinear([L, C, H]).map(clamp01);
    return { srgb: linear.map(linearToSrgb), linear, alpha: parseAlpha(alpha) };
  }
  const srgb = parts.map((p) => clamp01(parseChannel(p, 255) / 255));
  if (!srgb.every(Number.isFinite)) return null;
  return { srgb, linear: srgb.map(srgbToLinear), alpha: parseAlpha(alpha) };
}

/** Linear-sRGB triple for a CSS colour string; throws on anything unparseable. */
export function cssColorToLinear(str) {
  const parsed = parseCssColor(str);
  if (!parsed) throw new TypeError(`cssColorToLinear: cannot parse colour "${str}"`);
  return parsed.linear;
}

/** 0xRRGGBB integer for a linear-sRGB triple (what three.js Color(hex) expects, sRGB-encoded). */
export function linearToHex(rgb) {
  const q = (v) => Math.round(clamp01(linearToSrgb(clamp01(v))) * 255);
  return (q(rgb[0]) << 16) | (q(rgb[1]) << 8) | q(rgb[2]);
}
