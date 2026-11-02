// Design-token reader: styles/tokens.css is the only place a colour, font, size or
// duration is defined; this module hands the same values to canvas 2D and three.js.
//
//   const T = readTokens();                    // frozen snapshot of the live :root
//   T.color["ink-dim"].css                     // "#93a1ba"          → ctx.fillStyle
//   T.color["ink-dim"].linear                  // [r, g, b] linear   → three.js node colours
//   T.font.mono(-2)                            // '10.42px "IBM Plex Mono", monospace' → ctx.font
//   T.dur.quick, T.step[0], T.ease["out-quart"]
//
// Short forms for module code (css, hex, rgba, linear, monoPx, …) read the cached snapshot of the
// document. Read once when a scene is built or at the top of a draw function; never per element.
//
// The module is DOM-free at import. In Node, build tokens from the stylesheet text with
// `parseTokensCss` + `buildTokens`, or install them with `setTokenSource`.

import { parseCssColor, cssColorToLinear, linearToSrgb, linearToHex } from "./color.mjs";

export { cssColorToLinear };

export const TYPE_STEPS = Object.freeze([-2, -1, 0, 1, 2, 3, 4, 5]);

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const toByte = (linearChannel) => Math.round(clamp01(linearToSrgb(clamp01(linearChannel))) * 255);

function deepFreeze(obj) {
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) deepFreeze(value);
  }
  return Object.freeze(obj);
}

// ---- stylesheet text → { name: value } (Node and tests) ------------------------------------

function resolveVars(name, raw, values, trail) {
  return raw.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g, (_, ref, fallback) => {
    if (trail.includes(ref)) throw new Error(`tokens: circular reference ${[...trail, ref].join(" → ")}`);
    if (ref in values) return resolveVars(ref, values[ref], values, [...trail, ref]);
    if (fallback !== undefined) return fallback.trim();
    throw new Error(`tokens: ${name} references undefined ${ref}`);
  });
}

/** Parse every `:root { … }` block of a stylesheet into `{ "--name": resolvedValue }` (var() aliases resolved). */
export function parseTokensCss(cssText) {
  const text = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const raw = {};
  for (const block of text.matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const decl of block[1].split(";")) {
      const m = /^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(decl);
      if (m) raw[m[1]] = m[2];
    }
  }
  const out = {};
  for (const [name, value] of Object.entries(raw)) out[name] = resolveVars(name, value, raw, [name]);
  return out;
}

// ---- { name: value } → frozen token object --------------------------------------------------

function parseDuration(value) {
  const m = /^(-?\d+(?:\.\d+)?)(ms|s)$/.exec(value);
  return m ? Number(m[1]) * (m[2] === "s" ? 1000 : 1) : null;
}

function parsePx(value) {
  const m = /^(-?\d+(?:\.\d+)?)px$/.exec(value);
  return m ? Number(m[1]) : null;
}

function formatPx(px) {
  return `${Number(px.toFixed(3))}px`;
}

function makeFont(family, steps) {
  const spec = (size, weight) => `${weight ? `${weight} ` : ""}${size}`;
  const fromStep = (fam) => (step, weight) => {
    const px = steps[step];
    if (px === undefined) throw new RangeError(`font: type step ${step} is not on the scale (${TYPE_STEPS.join(", ")})`);
    return `${spec(formatPx(px), weight)} ${fam}`;
  };
  const fromPx = (fam) => (px, weight) => {
    if (!(px > 0) || !Number.isFinite(px)) throw new RangeError(`font: invalid size ${px}`);
    return `${spec(formatPx(px), weight)} ${fam}`;
  };
  return {
    family,
    head: fromStep(family.head),
    body: fromStep(family.body),
    mono: fromStep(family.mono),
    // Exact pixel sizes for canvas labels that predate the type scale (kept identical on migration).
    headPx: fromPx(family.head),
    bodyPx: fromPx(family.body),
    monoPx: fromPx(family.mono),
  };
}

/**
 * Build the frozen token object from `{ "--name": "value" }` (values already var()-resolved).
 * Colours are every property whose value is a hex, rgb[a]() or oklch() colour.
 */
export function buildTokens(values) {
  const color = {};
  const dur = {};
  const ease = {};
  const step = {};
  const family = {};
  const length = {};
  const tintParts = {};
  for (const [prop, value] of Object.entries(values)) {
    const name = prop.slice(2);
    const parsed = parseCssColor(value);
    if (parsed) {
      color[name] = {
        css: value,
        linear: Object.freeze(parsed.linear.slice()),
        alpha: parsed.alpha,
        hex: linearToHex(parsed.linear),
        bytes: Object.freeze(parsed.linear.map(toByte)),
      };
    } else if (name.startsWith("dur-")) {
      const ms = parseDuration(value);
      if (ms !== null) dur[name.slice(4)] = ms;
    } else if (name.startsWith("ease-")) {
      ease[name.slice(5)] = value;
    } else if (/^step-/.test(name)) {
      const px = parsePx(value);
      if (px !== null) step[Number(name.slice(5))] = px;
    } else if (/^font-(head|body|mono)$/.test(name)) {
      family[name.slice(5)] = value;
    } else if (/^tint-[\w]+-[sl]$/.test(name) && /^\d+(?:\.\d+)?%$/.test(value)) {
      const [, key, channel] = /^tint-([\w]+)-([sl])$/.exec(name);
      (tintParts[key] ??= {})[channel] = parseFloat(value);
    } else if (parsePx(value) !== null) {
      length[name] = parsePx(value);
    }
  }
  const tint = {};
  for (const [key, { s, l }] of Object.entries(tintParts)) {
    if (s === undefined || l === undefined) throw new Error(`tokens: tint "${key}" needs both --tint-${key}-s and --tint-${key}-l`);
    tint[key] = { s: s / 100, l: l / 100, sPct: s, lPct: l };
  }
  for (const key of ["head", "body", "mono"]) {
    if (!family[key]) throw new Error(`tokens: --font-${key} is not defined`);
  }
  return deepFreeze({ color, font: makeFont(family, step), dur, ease, step, length, tint });
}

// ---- live document ---------------------------------------------------------------------------

const live = new WeakMap();
let injected = null;

function collectRootPropertyNames(doc) {
  const names = new Set();
  const visit = (rules) => {
    for (const rule of rules) {
      if (rule.cssRules && !rule.selectorText) visit(rule.cssRules);
      else if (rule.selectorText && /(^|,)\s*(:root|html)\b/.test(rule.selectorText)) {
        for (const prop of rule.style) if (prop.startsWith("--")) names.add(prop);
      }
    }
  };
  for (const sheet of doc.styleSheets) {
    try { visit(sheet.cssRules); } catch { /* cross-origin sheet: no custom properties of ours */ }
  }
  return names;
}

/** Frozen snapshot of the tokens that apply to `root` (default: the document element). */
export function readTokens(root = document.documentElement) {
  const doc = root.ownerDocument;
  const style = doc.defaultView.getComputedStyle(root);
  const values = {};
  for (const prop of collectRootPropertyNames(doc)) {
    const v = style.getPropertyValue(prop).trim();
    if (v) values[prop] = v;
  }
  return buildTokens(values);
}

/** Install a token object for environments without a stylesheet (Node tests); pass null to clear. */
export function setTokenSource(tokens) {
  injected = tokens;
}

/** The cached tokens of the current document, or the injected source. Invalidated on `qga:theme`. */
export function current() {
  if (injected) return injected;
  if (typeof document === "undefined") {
    throw new Error("design tokens: no document and no source; call setTokenSource(buildTokens(parseTokensCss(css)))");
  }
  let tokens = live.get(document.documentElement);
  if (!tokens) {
    tokens = readTokens(document.documentElement);
    live.set(document.documentElement, tokens);
  }
  return tokens;
}

/** Subscribe to `qga:theme` (dispatched on `document` after the root tokens change). Returns unsubscribe. */
export function onThemeChange(callback, target = document) {
  const handler = (event) => {
    const root = target.documentElement ?? document.documentElement;
    live.delete(root);
    callback(readTokens(root), event);
  };
  target.addEventListener("qga:theme", handler);
  return () => target.removeEventListener("qga:theme", handler);
}

// ---- short forms over current() -----------------------------------------------------------------

function entry(name) {
  const hit = current().color[name];
  if (!hit) throw new RangeError(`design tokens: unknown colour token "--${name}"`);
  return hit;
}

/** CSS colour string of a token. */
export const css = (name) => entry(name).css;
/** Linear-sRGB triple of a token (new array). */
export const linear = (name) => entry(name).linear.slice();
/** The token's frozen linear-sRGB triple itself (no copy): `color.fromArray(linearRef(name))` allocates nothing. */
export const linearRef = (name) => entry(name).linear;
/** 0xRRGGBB (sRGB encoded) as three.js `new Color(hex)` expects; precomputed, allocation-free. */
export const hex = (name) => entry(name).hex;
/** `#rrggbb` string of a token (alpha dropped). */
export const hexString = (name) => `#${entry(name).hex.toString(16).padStart(6, "0")}`;

const alphaCache = new WeakMap();
const ALPHA_CACHE_LIMIT = 256;

/**
 * The token's colour with an explicit alpha as a CSS string. `oklch()` tokens stay `oklch(L C H / a)`;
 * every other token becomes `rgba(r,g,b,a)`. Numeric alphas are memoised per token (bounded), so a
 * draw loop that reuses an alpha allocates nothing.
 */
export function alpha(name, a) {
  const hit = entry(name);
  const memo = typeof a === "number";
  let cache;
  if (memo) {
    cache = alphaCache.get(hit);
    if (!cache) alphaCache.set(hit, (cache = new Map()));
    const cached = cache.get(a);
    if (cached !== undefined) return cached;
  }
  let out;
  if (hit.css.startsWith("oklch(") && !hit.css.includes("/")) out = `${hit.css.slice(0, -1)} / ${a})`;
  else out = `rgba(${hit.bytes[0]},${hit.bytes[1]},${hit.bytes[2]},${a})`;
  if (memo && cache.size < ALPHA_CACHE_LIMIT) cache.set(a, out);
  return out;
}

/** `rgb(r,g,b)` from 0..255 channels (for computed colormaps whose channels are data, not style). */
export const rgb255 = (r, g, b) => `rgb(${r | 0},${g | 0},${b | 0})`;

function tintEntry(name) {
  const hit = current().tint[name];
  if (!hit) throw new RangeError(`design tokens: unknown tint "${name}"`);
  return hit;
}

/** `{ s, l }` (fractions 0..1, for three.js `Color.setHSL(h / 360, s, l)`) of a hue tint. */
export const tint = (name) => tintEntry(name);

/** `hsla()` string for a hue tint: the hue (degrees) is state, saturation and lightness come from the token. */
export function hueTint(name, hueDeg, a = 1) {
  const { sPct, lPct } = tintEntry(name);
  return `hsla(${Math.round(hueDeg)}, ${sPct}%, ${lPct}%, ${a})`;
}

export const monoPx = (px, weight) => current().font.monoPx(px, weight);
export const bodyPx = (px, weight) => current().font.bodyPx(px, weight);
export const headPx = (px, weight) => current().font.headPx(px, weight);
