/*
 * Expression → TSL node graph.
 *
 * This module must not import three: the caller passes the namespace it got
 * from "three/tsl" (or a numeric stand-in, as the Node tests do), so the module
 * loads in Node. Every operator is checked against `tsl` at compile time and
 * a missing one throws, so a three.js upgrade that drops a name fails loudly
 * instead of rendering garbage.
 *
 * r186 facts this relies on (read in vendor/three/build/three.webgpu.js):
 *  - atan is `setParameterLength(1, 2)`; atan(y, x) is atan2 (MathNode emits
 *    WGSL `atan2` on WebGPU and GLSL `atan(y, x)` on WebGL2);
 *  - cbrt exists in TSL as sign(x) * pow(|x|, 1/3);
 *  - select(cond, a, b) takes a bool, so lt/gt value use is wrapped in select(…, 1, 0).
 * Integer powers up to MAX_POWER_CHAIN become multiplications: pow() of a
 * negative base is undefined in GLSL/WGSL, and x*x is also what JS evaluates.
 */

const MAX_POWER_CHAIN = 8;
const UNARY = { sqrt: "sqrt", exp: "exp", log: "log", sin: "sin", cos: "cos", tan: "tan", atan: "atan", abs: "abs", cbrt: "cbrt" };
const BINARY = { sub: "sub", div: "div", min: "min", max: "max" };
const COMPARE = { lt: "lessThan", gt: "greaterThan" };

export function compileTSL(expr, tsl, bindings = {}) {
  if (!expr || typeof expr.op !== "string") throw new TypeError("compileTSL: expression expected");
  if (!tsl || typeof tsl !== "object") throw new TypeError("compileTSL: pass the \"three/tsl\" namespace as the second argument");
  const need = (name, op) => {
    if (typeof tsl[name] !== "function") throw new TypeError(`compileTSL: tsl.${name} is not available, operator ${op} cannot be compiled`);
    return tsl[name];
  };
  const memo = new Map();
  const terms = {};
  const lit = (v) => need("float", "num")(v);

  const chain = (x, n) => {
    const mul = need("mul", "pow");
    let acc = x;
    for (let i = 1; i < n; i += 1) acc = mul(acc, x);
    return acc;
  };

  function go(node) {
    if (memo.has(node)) return memo.get(node);
    const out = build(node);
    memo.set(node, out);
    return out;
  }

  function build(node) {
    const a = node.args?.map(go);
    const op = node.op;
    switch (op) {
      case "num": return lit(node.value);
      case "sym": {
        if (!(node.name in bindings)) throw new ReferenceError(`Unknown symbol: ${node.name}`);
        const b = bindings[node.name];
        return typeof b === "number" ? lit(b) : b;
      }
      case "term": terms[node.id] = a[0]; return a[0];
      case "add": case "mul": return a.slice(1).reduce((acc, x) => need(op, op)(acc, x), a[0]);
      case "min": case "max": return a.slice(1).reduce((acc, x) => need(op, op)(acc, x), a[0]);
      case "sub": case "div": return need(BINARY[op], op)(a[0], a[1]);
      case "neg": return need("mul", op)(lit(-1), a[0]);
      case "atan2": return need("atan", op)(a[0], a[1]);
      case "clamp": return need("clamp", op)(a[0], a[1], a[2]);
      case "select": return need("select", op)(a[0], a[1], a[2]);
      case "lt": case "gt": return need("select", op)(need(COMPARE[op], op)(a[0], a[1]), lit(1), lit(0));
      case "pow": {
        let e = node.args[1];
        while (e.op === "term") e = e.args[0];
        const r = e.op === "num" ? e.rational : null;
        if (r && r.q === 1 && r.p >= 1 && r.p <= MAX_POWER_CHAIN) return chain(a[0], r.p);
        if (r && r.q === 1 && r.p <= -1 && r.p >= -MAX_POWER_CHAIN) return need("div", op)(lit(1), chain(a[0], -r.p));
        if (r && r.p === 1 && r.q === 2) return need("sqrt", op)(a[0]);
        if (r && r.p === 1 && r.q === 3) return need("cbrt", op)(a[0]);
        return need("pow", op)(a[0], a[1]);
      }
      default:
        if (UNARY[op]) return need(UNARY[op], op)(a[0]);
        throw new TypeError(`compileTSL: unsupported operator ${op}`);
    }
  }

  const node = go(expr);
  return { node, terms: Object.freeze(terms) };
}
