// Scene description for the Figure Kit. A spec is plain, JSON-like data: build it with
// figure(), axis() and the mark constructors; renderers (canvas, SVG) paint the same scene.

import { SCIENTIFIC_STATUS_LABELS } from "../science/contracts.mjs";
import { makeScale } from "./scale.mjs";

export const MARK_TYPES = Object.freeze(["line", "band", "points", "step", "heatmap", "rule", "callout", "region"]);
export const LAYERS = Object.freeze(["data", "model"]);
export const HEATMAP_PALETTES = Object.freeze(["viridis", "magma", "cividis", "diverging"]);
export const BAND_MAX_OPACITY = 0.18;

// Canvas text never carries Greek letters or mathematical operators: those go through KaTeX.
const MATH_GLYPH = /[Ͱ-Ͽἀ-῿∀-⋿←-⇿⁰-₟±×]/;

const isNumArray = (a) => Array.isArray(a) || ArrayBuffer.isView(a);

function need(cond, message) {
  if (!cond) throw new TypeError(`figure: ${message}`);
}

function checkSeries(label, a, n) {
  need(isNumArray(a), `${label} must be an array`);
  need(n === undefined || a.length === n, `${label} has length ${a.length}, expected ${n}`);
  for (let i = 0; i < a.length; i++) need(typeof a[i] === "number" && !Number.isNaN(a[i]), `${label}[${i}] is not a number`);
}

/** Strip TeX markup to a readable plain string (aria text, SVG fallback, legend measurement). */
export function texToPlain(tex) {
  return String(tex)
    .replace(/\\(?:mathrm|text|mathit|mathbf|operatorname)\s*\{([^}]*)\}/g, "$1")
    .replace(/\\ /g, " ")
    .replace(/\\(?:left|right|,|;|!|quad|qquad)\s*/g, (m) => (m.startsWith("\\q") ? " " : m.startsWith("\\,") ? " " : ""))
    .replace(/\\([A-Za-z]+)/g, (_, name) => GREEK[name] ?? ({ to: "→", times: "×", cdot: "·", pm: "±", infty: "∞", approx: "≈", hbar: "ħ", partial: "∂", langle: "⟨", rangle: "⟩", neq: "≠", ne: "≠", leq: "≤", geq: "≥", sqrt: "√", ell: "ℓ", ln: "ln", log: "log", sin: "sin", cos: "cos", exp: "exp" })[name] ?? name)
    .replace(/[{}]/g, "").replace(/\^/g, "^").replace(/\s+/g, " ").trim();
}
const GREEK = Object.fromEntries("alpha α,beta β,gamma γ,delta δ,epsilon ε,theta θ,lambda λ,mu μ,nu ν,pi π,rho ρ,sigma σ,tau τ,phi φ,omega ω,Delta Δ,Gamma Γ,Omega Ω,Lambda Λ,Sigma Σ,Theta Θ".split(",").map((s) => s.split(" ")));

/**
 * A label is `{ tex }`, `{ text }` (ASCII words only) or `{ formula, symbol }` (a Formula Core
 * symbol: tex and unit come from the formula's declaration). Returns `{ plain, tex, unit }`.
 */
export function resolveLabel(label, unit) {
  if (label == null) return null;
  let tex = null, text = null, symbolUnit = null;
  if (typeof label === "string") text = label;
  else if (label.formula) {
    const decl = label.formula.symbols?.[label.symbol] ?? (label.symbol === "output" ? label.formula.output : undefined);
    need(decl, `formula ${label.formula.id ?? "?"} has no symbol "${label.symbol}"`);
    tex = decl.tex ?? label.symbol;
    symbolUnit = decl.unit && decl.unit !== "1" ? decl.unit : null;
  } else if (label.tex != null) tex = String(label.tex);
  else if (label.text != null) text = String(label.text);
  else need(false, "axis label needs tex, text or formula+symbol");
  const u = unit ?? symbolUnit;
  if (text !== null) {
    need(!MATH_GLYPH.test(text), `label "${text}" has Greek letters or math symbols: use { tex } so KaTeX typesets it`);
    return { plain: u ? `${text} [${u}]` : text, tex: null, unit: u ?? null };
  }
  const unitTex = u ? `\\,\\left[\\mathrm{${String(u).replace(/\^(-?\d+)/g, "^{$1}").replace(/ /g, "\\,")}}\\right]` : "";
  return { plain: texToPlain(tex) + (u ? ` [${u}]` : ""), tex: tex + unitTex, unit: u ?? null };
}

/** `axis({ scale, label, unit })`; scale is `{ type, domain, base?, constant? }`. */
export function axis({ scale, label = null, unit, ticks, decade } = {}) {
  need(scale && Array.isArray(scale.domain), "axis needs scale.domain");
  makeScale(scale, [0, 1]); // validates domain and type
  const resolved = resolveLabel(label, unit);
  if (ticks !== undefined) checkSeries("axis.ticks", ticks);
  return Object.freeze({ scale: { type: "linear", ...scale }, label: resolved, ticks, decade: decade ?? scale.type === "log" });
}

const BUILT = new WeakSet();

function mark(type, fields, { layer, focal = false, label, color = "accent", id }) {
  need(LAYERS.includes(layer), `${type} mark needs layer "data" or "model" (got ${JSON.stringify(layer)})`);
  need(typeof focal === "boolean", "focal must be boolean");
  const built = { type, layer, focal, label: label == null ? null : resolveLabel(label), color, id: id ?? null, ...fields };
  BUILT.add(built);
  return built;
}

export const line = (o) => {
  checkSeries("line.x", o.x); checkSeries("line.y", o.y, o.x.length);
  return mark("line", { x: o.x, y: o.y, width: o.width ?? 1.8, dash: o.dash ?? null, emitter: !!o.emitter }, o);
};
export const step = (o) => {
  checkSeries("step.x", o.x); checkSeries("step.y", o.y, o.x.length);
  return mark("step", { x: o.x, y: o.y, width: o.width ?? 1.6, dash: o.dash ?? null }, o);
};
export const band = (o) => {
  checkSeries("band.x", o.x); checkSeries("band.y0", o.y0, o.x.length); checkSeries("band.y1", o.y1, o.x.length);
  const opacity = o.opacity ?? 0.16;
  need(opacity > 0 && opacity <= BAND_MAX_OPACITY, `band opacity must be in (0, ${BAND_MAX_OPACITY}] (art direction)`);
  return mark("band", { x: o.x, y0: o.y0, y1: o.y1, opacity }, o);
};
export const points = (o) => {
  checkSeries("points.x", o.x); checkSeries("points.y", o.y, o.x.length);
  for (const key of ["yErr", "xErr"]) {
    if (!o[key]) continue;
    need(Array.isArray(o[key]) && o[key].length === 2, `points.${key} is [lower[], upper[]] (asymmetric)`);
    checkSeries(`points.${key}[0]`, o[key][0], o.x.length); checkSeries(`points.${key}[1]`, o[key][1], o.x.length);
  }
  return mark("points", { x: o.x, y: o.y, yErr: o.yErr ?? null, xErr: o.xErr ?? null, radius: o.radius ?? 3 }, o);
};
export const heatmap = (o) => {
  need(Array.isArray(o.z) && o.z.length > 0 && isNumArray(o.z[0]), "heatmap.z is rows (y) of columns (x)");
  const cols = o.z[0].length;
  o.z.forEach((row, i) => checkSeries(`heatmap.z[${i}]`, row, cols));
  need(Array.isArray(o.x) && o.x.length === 2 && Array.isArray(o.y) && o.y.length === 2, "heatmap.x and .y are [min, max] extents");
  const palette = o.palette ?? "viridis";
  need(HEATMAP_PALETTES.includes(palette), `heatmap palette must be sequential or diverging (${HEATMAP_PALETTES.join(", ")}); rainbow maps are forbidden`);
  return mark("heatmap", { z: o.z, x: o.x, y: o.y, palette, zDomain: o.zDomain ?? null }, o);
};
export const rule = (o) => {
  need(o.axis === "x" || o.axis === "y", "rule.axis is x or y"); need(Number.isFinite(o.value), "rule.value is a number");
  return mark("rule", { axis: o.axis, value: o.value, dash: o.dash ?? "3 3", text: resolveLabel(o.text) }, o);
};
export const callout = (o) => {
  need(Number.isFinite(o.x) && Number.isFinite(o.y), "callout needs x and y");
  return mark("callout", { x: o.x, y: o.y, dx: o.dx ?? 24, dy: o.dy ?? -24, text: resolveLabel(o.text) }, o);
};
export const region = (o) => {
  need(o.x || o.y, "region needs x and/or y extents");
  return mark("region", { x: o.x ?? null, y: o.y ?? null, text: resolveLabel(o.text) }, o);
};

/**
 * figure({ id, title, status, provenanceId, x, y, marks, legend, caption }); the legend lists every labelled mark.
 * At most one mark is focal; every mark has a layer; status is a scientific status label.
 */
export function figure(spec) {
  const { id, title, status, provenanceId, x, y, marks = [], legend = true, caption = "", height, summary } = spec ?? {};
  need(typeof id === "string" && id, "figure.id is required");
  need(typeof title === "string" && title, `${id}: title is required`);
  need(SCIENTIFIC_STATUS_LABELS.includes(status), `${id}: status must be one of ${SCIENTIFIC_STATUS_LABELS.join(", ")}`);
  need(typeof provenanceId === "string" && provenanceId, `${id}: provenanceId is required`);
  need(x && y && x.scale && y.scale, `${id}: x and y axes are required (use axis())`);
  need(Array.isArray(marks), `${id}: marks must be an array`);
  marks.forEach((m, i) => need(BUILT.has(m) && MARK_TYPES.includes(m.type) && LAYERS.includes(m.layer), `${id}: marks[${i}] must come from a mark constructor`));
  const focal = marks.filter((m) => m.focal);
  need(focal.length <= 1, `${id}: ${focal.length} focal marks; the grammar allows one`);
  need(typeof legend === "boolean", `${id}: legend is true (one entry per labelled mark) or false`);
  return Object.freeze({ id, title, status, provenanceId, x, y, marks: Object.freeze(marks), legend, caption, height: height ?? 240, summary: summary ?? null });
}
