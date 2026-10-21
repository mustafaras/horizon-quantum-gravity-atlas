/*
 * defineFormula: one definition, four consumers.
 *
 *   evaluate(env)     float64 JavaScript, for science and tests
 *   evaluateF32(env)  float32-emulating JavaScript, proves GPU safety in Node
 *   tex               KaTeX source with addressable \htmlData terms
 *   (compileTSL)      the same `expr` compiles to a TSL graph (to-tsl.mjs)
 *
 * Symbols with a `constant` are physical constants. `evaluate` fills them from
 * the declared SI value unless the env overrides them. Geometric units mean
 * binding every constant to 1: `geometric(env)` does that, and it is what
 * `gpuSafe` samples by default, because SI constants such as ħG/c³ ≈ 7e-45
 * fall below the float32 range while the same expression in G = c = ħ = k_B = 1
 * does not.
 */

import { SCIENTIFIC_STATUS_LABELS, deepFreeze } from "../science/contracts.mjs";
import { seededRng } from "../physics.mjs";
import { compileJS } from "./to-js.mjs";
import { toTeX } from "./to-tex.mjs";
import { freeSymbols, termIds, isExpr } from "./expr.mjs";
import { inferDimensions, dimension, dimensionsEqual, dimensionToObject, dimensionToString } from "./dimensions.mjs";

export const GPU_TOLERANCE = 1e-4;
const HALTON_BASES = [2, 3, 5, 7, 11, 13, 17, 19];

function halton(index, base) {
  let f = 1, r = 0;
  for (let i = index; i > 0; i = Math.floor(i / base)) { f /= base; r += f * (i % base); }
  return r;
}

function validateReferences(id, references) {
  if (!Array.isArray(references) || references.length === 0) throw new TypeError(`${id}: references must be a non-empty array`);
  references.forEach((r, i) => {
    if (!r || typeof r.citation !== "string" || !(r.doi || r.arxiv || r.url)) {
      throw new TypeError(`${id}: references[${i}] needs a citation and one of doi, arxiv or url`);
    }
  });
}

function mapAxis(t, [lo, hi, scale]) {
  return scale === "log" ? Math.exp(Math.log(lo) + t * (Math.log(hi) - Math.log(lo))) : lo + t * (hi - lo);
}

export function defineFormula(spec) {
  const { id, title, status, symbols, output, expr, domain = {}, references, seed = 1 } = spec ?? {};
  for (const [key, value] of Object.entries({ id, title })) {
    if (typeof value !== "string" || value === "") throw new TypeError(`defineFormula: ${key} must be a non-empty string`);
  }
  if (!SCIENTIFIC_STATUS_LABELS.includes(status)) throw new TypeError(`${id}: status must be one of ${SCIENTIFIC_STATUS_LABELS.join(", ")}`);
  if (!isExpr(expr)) throw new TypeError(`${id}: expr must be an expression`);
  if (!symbols || typeof symbols !== "object") throw new TypeError(`${id}: symbols must be an object`);
  validateReferences(id, references);

  const used = freeSymbols(expr);
  for (const name of used) if (!symbols[name]) throw new ReferenceError(`Unknown symbol: ${name}`);
  const constants = Object.fromEntries(used.filter((n) => symbols[n].constant !== undefined).map((n) => [n, symbols[n].constant]));
  const variables = used.filter((n) => !(n in constants));
  for (const name of variables) {
    const d = domain[name];
    const valid = Array.isArray(d) && d.length === 3 && d[0] <= d[1] && (d[2] === "lin" || (d[2] === "log" && d[0] > 0));
    if (!valid) {
      throw new TypeError(`${id}: domain.${name} must be [min, max, "lin" | "log"] with min ≤ max (and min > 0 for log)`);
    }
  }

  const dims = inferDimensions(expr, symbols);
  if (output?.dims && !dimensionsEqual(dimension(output.dims), dims)) {
    throw new TypeError(`${id}: output declares ${dimensionToString(dimension(output.dims))} but the expression has ${dimensionToString(dims)}`);
  }
  const ids = termIds(expr);
  const f64 = compileJS(expr, { precision: "f64" });
  const f32 = compileJS(expr, { precision: "f32" });
  const withConstants = (env) => ({ ...constants, ...env });
  const geometric = (env = {}) => ({ ...env, ...Object.fromEntries(Object.keys(constants).map((n) => [n, 1])) });

  /** Deterministic sample points over the domain, rounded to float32 as a GPU texture would hold them. */
  function sampleGrid({ samples = 257 } = {}) {
    const names = variables;
    const rng = seededRng(seed);
    const shift = names.map(() => rng());
    const points = [];
    for (let i = 0; i < samples; i += 1) {
      const point = {};
      names.forEach((name, k) => {
        const t = names.length === 1 ? (samples === 1 ? 0.5 : i / (samples - 1)) : (halton(i + 1, HALTON_BASES[k]) + shift[k]) % 1;
        point[name] = Math.fround(mapAxis(t, domain[name]));
      });
      points.push(point);
    }
    return { names, points };
  }

  function gpuSafe({ samples = 257, units = "geometric" } = {}) {
    const { points } = sampleGrid({ samples });
    let maxRelError = 0, worst = null, skipped = 0;
    for (const p of points) {
      const env = units === "geometric" ? geometric(p) : p;
      const exact = evaluate(env);
      if (!Number.isFinite(exact)) { skipped += 1; continue; }
      const approx = f32(withConstants(env));
      const err = Number.isFinite(approx) ? Math.abs(approx - exact) / (Math.abs(exact) || 1) : Infinity;
      if (err > maxRelError) { maxRelError = err; worst = p; }
    }
    return Object.freeze({ maxRelError, ok: maxRelError <= GPU_TOLERANCE, samples, skipped, worst, units });
  }

  function evaluate(env = {}) { return f64(withConstants(env)); }
  function evaluateF32(env = {}) { return f32(withConstants(env)); }

  return deepFreezeFormula({
    id, title, status, symbols, output: output ?? {}, expr, domain, references, constants, variables,
    dims: dimensionToObject(dims), dimString: dimensionToString(dims),
    tex: toTeX(expr, symbols), termIds: ids,
    evaluate, evaluateF32, geometric, sampleGrid, gpuSafe,
  });
}

function deepFreezeFormula(f) {
  deepFreeze(f.symbols); deepFreeze(f.output); deepFreeze(f.domain); deepFreeze(f.references);
  return Object.freeze(f);
}
