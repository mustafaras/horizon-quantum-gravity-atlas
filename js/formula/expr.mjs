/*
 * Formula AST: frozen plain objects, validated at construction.
 *
 * Every node is `{ op, ... }`. Leaves are `num` and `sym`; every other node
 * carries `args` (child expressions). The AST knows nothing about numbers,
 * TeX, GPUs or units: to-js, to-tex, to-tsl and dimensions each interpret it.
 * Numbers and strings are accepted wherever an expression is, and become
 * `num` / `sym`.
 */

const FIXED_ARITY = {
  sub: 2, div: 2, pow: 2, atan2: 2, lt: 2, gt: 2,
  neg: 1, sqrt: 1, cbrt: 1, exp: 1, log: 1, sin: 1, cos: 1, tan: 1, atan: 1, abs: 1,
  clamp: 3, select: 3,
};
const VARIADIC = new Set(["add", "mul", "min", "max"]);
const SYMBOL_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TERM_ID = /^[A-Za-z][A-Za-z0-9_.-]*$/;

export const OPERATORS = Object.freeze([
  "num", "sym", "term", ...Object.keys(FIXED_ARITY), ...VARIADIC,
].sort());

const isNode = (x) => x !== null && typeof x === "object" && typeof x.op === "string" && Object.isFrozen(x);

export function isExpr(x) {
  return isNode(x) && OPERATORS.includes(x.op);
}

/** Smallest `{p, q}` (q ≤ maxDenominator) equal to `x` within 1e-12, or null. */
export function toRational(x, maxDenominator = 64) {
  if (!Number.isFinite(x)) return null;
  for (let q = 1; q <= maxDenominator; q += 1) {
    const p = Math.round(x * q);
    if (Math.abs(p / q - x) <= 1e-12 * Math.max(1, Math.abs(x))) {
      let a = Math.abs(p), b = q;
      while (b) [a, b] = [b, a % b];
      return { p: p / (a || 1), q: q / (a || 1) };
    }
  }
  return null;
}

function coerce(op, x, index) {
  if (typeof x === "number") return num(x);
  if (typeof x === "string") return sym(x);
  if (isExpr(x)) return x;
  throw new TypeError(`${op}: argument ${index} is not an expression (${typeof x})`);
}

function make(op, args) {
  const min = VARIADIC.has(op) ? 2 : FIXED_ARITY[op];
  if (VARIADIC.has(op) ? args.length < min : args.length !== min) {
    throw new TypeError(`${op}: expected ${VARIADIC.has(op) ? `at least ${min}` : min} argument(s), received ${args.length}`);
  }
  return Object.freeze({ op, args: Object.freeze(args.map((a, i) => coerce(op, a, i))) });
}

/** Numeric literal. `rational` is `{p, q}` or inferred when the value is a small rational. */
export function num(value, rational) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`num: value must be a finite number, received ${value}`);
  const r = rational ?? toRational(value);
  if (rational && (!Number.isInteger(rational.p) || !Number.isInteger(rational.q) || rational.q === 0 || rational.p / rational.q !== value)) {
    throw new TypeError(`num: rational {p, q} must equal the value ${value}`);
  }
  return Object.freeze(r ? { op: "num", value, rational: Object.freeze({ ...r }) } : { op: "num", value });
}
/** The constant π, printed as \pi. */
export const PI = Object.freeze({ op: "num", value: Math.PI, tex: "\\pi" });

/** Exact rational literal p/q, for exponents in dimension analysis. */
export const rat = (p, q) => num(p / q, { p, q });

export function sym(name) {
  if (typeof name !== "string" || !SYMBOL_NAME.test(name)) throw new TypeError(`sym: name must match ${SYMBOL_NAME}, received ${JSON.stringify(name)}`);
  return Object.freeze({ op: "sym", name });
}

export const add = (...xs) => make("add", xs);
export const sub = (a, b, ...rest) => make("sub", [a, b, ...rest]);
export const mul = (...xs) => make("mul", xs);
export const div = (a, b, ...rest) => make("div", [a, b, ...rest]);
export const neg = (...a) => make("neg", a);
export const pow = (...a) => make("pow", a);
export const sqrt = (...a) => make("sqrt", a);
export const cbrt = (...a) => make("cbrt", a);
export const exp = (...a) => make("exp", a);
export const log = (...a) => make("log", a);
export const sin = (...a) => make("sin", a);
export const cos = (...a) => make("cos", a);
export const tan = (...a) => make("tan", a);
export const atan = (...a) => make("atan", a);
export const atan2 = (...a) => make("atan2", a);
export const abs = (...a) => make("abs", a);
export const min = (...xs) => make("min", xs);
export const max = (...xs) => make("max", xs);
export const clamp = (...a) => make("clamp", a);
export const lt = (...a) => make("lt", a);
export const gt = (...a) => make("gt", a);

export function select(...a) {
  const node = make("select", a);
  let cond = node.args[0];
  while (cond.op === "term") cond = cond.args[0];
  if (cond.op !== "lt" && cond.op !== "gt") throw new TypeError(`select: condition must be an lt or gt comparison, received ${cond.op}`);
  return node;
}

/** Marks a named, addressable subexpression. `tex` overrides how the term is typeset. */
export function term(id, expr, { tex } = {}) {
  if (typeof id !== "string" || !TERM_ID.test(id)) throw new TypeError(`term: id must match ${TERM_ID}, received ${JSON.stringify(id)}`);
  if (tex !== undefined && typeof tex !== "string") throw new TypeError("term: tex must be a string");
  const node = { op: "term", id, args: Object.freeze([coerce("term", expr, 0)]) };
  if (tex !== undefined) node.tex = tex;
  return Object.freeze(node);
}

/** Names of every free symbol, in first-use order. */
export function freeSymbols(expr) {
  const seen = new Set();
  (function walk(n) {
    if (n.op === "sym") seen.add(n.name);
    else if (n.args) n.args.forEach(walk);
  })(expr);
  return [...seen];
}

/** Ids of every term, in first-use order; a duplicate id is an error. */
export function termIds(expr) {
  const ids = [];
  (function walk(n) {
    if (n.op === "term") {
      if (ids.includes(n.id)) throw new TypeError(`term: duplicate id ${n.id}`);
      ids.push(n.id);
    }
    if (n.args) n.args.forEach(walk);
  })(expr);
  return ids;
}
