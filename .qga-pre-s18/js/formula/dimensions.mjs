/*
 * Dimensional analysis over (L, M, T, Θ) with rational exponents.
 *
 * A dimension vector is a frozen array of four `{ p, q }` fractions. Symbols
 * declare `dims` as `{ L, M, T, Th }` (omitted = 0; values are integers or
 * small rationals). `inferDimensions` walks the expression and throws a
 * TypeError naming the operator that mixes incompatible dimensions.
 */

import { toRational } from "./expr.mjs";

export const AXES = Object.freeze(["L", "M", "T", "Th"]);

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
function frac(p, q = 1) {
  const g = gcd(p, q);
  const s = q < 0 ? -1 : 1;
  return Object.freeze({ p: (s * p) / g, q: (s * q) / g });
}
const fAdd = (x, y) => frac(x.p * y.q + y.p * x.q, x.q * y.q);
const fMul = (x, y) => frac(x.p * y.p, x.q * y.q);

export function dimension(spec = {}) {
  return Object.freeze(AXES.map((axis) => {
    const v = spec[axis] ?? 0;
    if (v && typeof v === "object") return frac(v.p, v.q);
    const r = toRational(v, 12);
    if (!r) throw new TypeError(`dimension: exponent of ${axis} must be a small rational, received ${v}`);
    return frac(r.p, r.q);
  }));
}
export const DIMENSIONLESS = dimension();

export const isDimensionless = (d) => d.every((x) => x.p === 0);
export const dimensionsEqual = (a, b) => a.every((x, i) => x.p === b[i].p && x.q === b[i].q);
const plus = (a, b) => Object.freeze(a.map((x, i) => fAdd(x, b[i])));
const scale = (a, r) => Object.freeze(a.map((x) => fMul(x, r)));

/** `{ L: 1, M: 0, T: -2, Th: 0 }` with plain numbers, for display and tests. */
export const dimensionToObject = (d) => Object.fromEntries(AXES.map((axis, i) => [axis, d[i].p / d[i].q]));

export function dimensionToString(d) {
  const parts = AXES.flatMap((axis, i) => (d[i].p === 0 ? [] : [d[i].q === 1 ? `${axis}^${d[i].p}` : `${axis}^(${d[i].p}/${d[i].q})`]));
  return parts.length ? parts.join(" ") : "1";
}

export function inferDimensions(expr, symbols = {}) {
  const fail = (op, message) => { throw new TypeError(`${op}: ${message}`); };
  const same = (op, ds) => {
    ds.forEach((d) => { if (!dimensionsEqual(d, ds[0])) fail(op, `operands have different dimensions (${ds.map(dimensionToString).join(" vs ")})`); });
    return ds[0];
  };
  const dimless = (op, ds) => ds.forEach((d) => { if (!isDimensionless(d)) fail(op, `argument must be dimensionless, received ${dimensionToString(d)}`); });
  const cache = new Map();

  function go(node) {
    if (!cache.has(node)) cache.set(node, visit(node));
    return cache.get(node);
  }
  function visit(node) {
    const op = node.op;
    if (op === "num") return DIMENSIONLESS;
    if (op === "sym") {
      const decl = symbols[node.name];
      if (!decl) throw new ReferenceError(`Unknown symbol: ${node.name}`);
      return decl.dims ? (Array.isArray(decl.dims) ? decl.dims : dimension(decl.dims)) : DIMENSIONLESS;
    }
    const ds = node.args.map(go);
    switch (op) {
      case "term": case "neg": case "abs": return ds[0];
      case "add": case "sub": case "min": case "max": return same(op, ds);
      case "clamp": return same(op, ds);
      case "mul": return ds.reduce(plus);
      case "div": return plus(ds[0], scale(ds[1], frac(-1)));
      case "sqrt": return scale(ds[0], frac(1, 2));
      case "cbrt": return scale(ds[0], frac(1, 3));
      case "pow": {
        let e = node.args[1];
        while (e.op === "term") e = e.args[0];
        if (isDimensionless(ds[0])) { dimless(op, [ds[1]]); return DIMENSIONLESS; }
        if (e.op !== "num") fail(op, `a dimensional base (${dimensionToString(ds[0])}) needs a constant exponent`);
        const r = e.rational ?? fail(op, `exponent ${e.value} is not a small rational`);
        return scale(ds[0], frac(r.p, r.q));
      }
      case "exp": case "log": case "sin": case "cos": case "tan": case "atan": dimless(op, ds); return DIMENSIONLESS;
      case "atan2": same(op, ds); return DIMENSIONLESS;
      case "lt": case "gt": same(op, ds); return DIMENSIONLESS;
      case "select": dimless(op, [ds[0]]); return same(op, [ds[1], ds[2]]);
      default: return fail(op, "unsupported operator");
    }
  }
  return go(expr);
}
