/*
 * Expression → JavaScript closure. No eval and no `new Function`: the AST is
 * folded into nested closures once, so evaluation allocates nothing.
 *
 * precision "f64" is ordinary double arithmetic. precision "f32" emulates a
 * single-precision GPU: every input, literal and intermediate result goes
 * through Math.fround. Transcendentals are rounded after a double-precision
 * evaluation, which is the best a GPU can do and a bound on its error, not
 * a model of any one vendor's implementation.
 */

const MODES = new Set(["f64", "f32"]);

function build(node, round) {
  const args = node.args?.map((a) => build(a, round));
  const unary = (fn) => { const [a] = args; return (env) => round(fn(a(env))); };
  const binary = (fn) => { const [a, b] = args; return (env) => round(fn(a(env), b(env))); };
  const fold = (fn) => (env) => {
    let acc = args[0](env);
    for (let i = 1; i < args.length; i += 1) acc = round(fn(acc, args[i](env)));
    return acc;
  };
  switch (node.op) {
    case "num": { const v = round(node.value); return () => v; }
    case "sym": {
      const name = node.name;
      return (env) => {
        const v = env[name];
        if (typeof v !== "number") throw new ReferenceError(`Unknown symbol: ${name}`);
        return round(v);
      };
    }
    case "term": return args[0];
    case "add": return fold((x, y) => x + y);
    case "mul": return fold((x, y) => x * y);
    case "min": return fold(Math.min);
    case "max": return fold(Math.max);
    case "sub": return binary((x, y) => x - y);
    case "div": return binary((x, y) => x / y);
    case "pow": return binary(Math.pow);
    case "atan2": return binary(Math.atan2);
    case "lt": return binary((x, y) => (x < y ? 1 : 0));
    case "gt": return binary((x, y) => (x > y ? 1 : 0));
    case "neg": return unary((x) => -x);
    case "sqrt": return unary(Math.sqrt);
    case "cbrt": return unary(Math.cbrt);
    case "exp": return unary(Math.exp);
    case "log": return unary(Math.log);
    case "sin": return unary(Math.sin);
    case "cos": return unary(Math.cos);
    case "tan": return unary(Math.tan);
    case "atan": return unary(Math.atan);
    case "abs": return unary(Math.abs);
    case "clamp": { const [x, lo, hi] = args; return (env) => round(Math.min(Math.max(x(env), lo(env)), hi(env))); }
    case "select": { const [c, a, b] = args; return (env) => (c(env) !== 0 ? a(env) : b(env)); }
    default: throw new TypeError(`compileJS: unsupported operator ${node.op}`);
  }
}

export function compileJS(expr, { precision = "f64" } = {}) {
  if (!MODES.has(precision)) throw new TypeError(`compileJS: precision must be "f64" or "f32", received ${JSON.stringify(precision)}`);
  if (!expr || typeof expr.op !== "string") throw new TypeError("compileJS: expression expected");
  return build(expr, precision === "f32" ? Math.fround : (x) => x);
}
