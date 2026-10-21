/*
 * Expression → TeX with precedence-aware, minimal parentheses.
 *
 * Every printer returns `{ s, p }`: the TeX and its binding strength. A parent
 * wraps a child in \left( \right) only when the child binds more loosely than
 * the position needs. Terms are wrapped in \htmlData{term=<id>}{…}; KaTeX
 * renders that only with `trust` for \htmlData (see KATEX_OPTIONS).
 */

const P = { add: 1, neg: 2, mul: 3, pow: 4, atom: 5 };
const FUNCTIONS = { exp: "\\exp", log: "\\ln", sin: "\\sin", cos: "\\cos", tan: "\\tan", atan: "\\arctan" };
const NAMES = { atan2: "\\operatorname{atan2}", clamp: "\\operatorname{clamp}", min: "\\min", max: "\\max" };

/** KaTeX options that let \htmlData through and nothing else. */
export const KATEX_OPTIONS = Object.freeze({
  trust: (context) => context.command === "\\htmlData",
  strict: (code) => (code === "htmlExtension" ? "ignore" : "warn"),
});

const paren = (s) => `\\left(${s}\\right)`;
const at = (x, minP) => (x.p < minP ? paren(x.s) : x.s);

function number(value) {
  if (Object.is(value, -0)) return "0";
  const text = String(Math.abs(value));
  const m = /^(\d(?:\.\d+)?)e([+-]?\d+)$/.exec(text);
  const body = m ? `${m[1]}\\times 10^{${Number(m[2])}}` : text;
  return value < 0 ? `-${body}` : body;
}

function print(node, symbols) {
  const go = (n) => print(n, symbols);
  const [a, b, c] = node.args ? node.args.map(go) : [];
  const list = () => node.args.map(go);
  switch (node.op) {
    case "num": return { s: node.tex ?? number(node.value), p: node.value < 0 ? P.neg : P.atom };
    case "sym": {
      const decl = symbols?.[node.name];
      const tex = typeof decl === "string" ? decl : decl?.tex;
      return { s: tex ?? node.name, p: P.atom };
    }
    case "term": {
      const inner = node.tex !== undefined ? { s: node.tex, p: P.atom } : a;
      return { s: `\\htmlData{term=${node.id}}{${inner.s}}`, p: inner.p };
    }
    case "add": {
      const parts = list();
      let s = parts[0].s;
      for (let i = 1; i < parts.length; i += 1) {
        const x = parts[i];
        s += x.s.startsWith("-") && x.p === P.neg ? ` - ${x.s.slice(1)}` : ` + ${at(x, P.add)}`;
      }
      return { s, p: P.add };
    }
    case "sub": return { s: `${at(a, P.add)} - ${at(b, P.mul)}`, p: P.add };
    case "neg": return { s: `-${at(a, P.mul)}`, p: P.neg };
    case "mul": {
      const parts = list();
      let s = at(parts[0], P.mul);
      for (let i = 1; i < parts.length; i += 1) {
        const x = at(parts[i], P.mul);
        s += /^\d/.test(x) ? ` \\cdot ${x}` : ` ${x}`;
      }
      return { s, p: P.mul };
    }
    case "div": return { s: `\\frac{${a.s}}{${b.s}}`, p: P.atom };
    case "sqrt": return { s: `\\sqrt{${a.s}}`, p: P.atom };
    case "cbrt": return { s: `\\sqrt[3]{${a.s}}`, p: P.atom };
    case "pow": {
      const e = node.args[1];
      let r = e;
      while (r.op === "term") r = r.args[0];
      const ratio = r.op === "num" ? r.rational : null;
      if (ratio && ratio.p === 1 && ratio.q === 2) return { s: `\\sqrt{${a.s}}`, p: P.atom };
      if (ratio && ratio.p === 1 && ratio.q === 3) return { s: `\\sqrt[3]{${a.s}}`, p: P.atom };
      let exponent = b.s;
      if (ratio && ratio.q !== 1) exponent = `${ratio.p < 0 ? "-" : ""}\\frac{${Math.abs(ratio.p)}}{${ratio.q}}`;
      const base = node.args[0].op === "div" ? paren(a.s) : at(a, P.atom);
      return { s: `${base}^{${exponent}}`, p: P.pow };
    }
    case "exp": case "log": case "sin": case "cos": case "tan": case "atan":
      return { s: `${FUNCTIONS[node.op]}${paren(a.s)}`, p: P.atom };
    case "abs": return { s: `\\left|${a.s}\\right|`, p: P.atom };
    case "min": case "max": case "atan2": case "clamp":
      return { s: `${NAMES[node.op]}${paren(list().map((x) => x.s).join(", "))}`, p: P.atom };
    case "lt": return { s: `${a.s} < ${b.s}`, p: 0 };
    case "gt": return { s: `${a.s} > ${b.s}`, p: 0 };
    case "select":
      return { s: `\\begin{cases} ${b.s} & \\text{if } ${a.s} \\\\ ${c.s} & \\text{otherwise} \\end{cases}`, p: 0 };
    default: throw new TypeError(`toTeX: unsupported operator ${node.op}`);
  }
}

/** `symbols[name]` is `{ tex }` or a bare TeX string; unknown names print as themselves. */
export function toTeX(expr, symbols = {}) {
  if (!expr || typeof expr.op !== "string") throw new TypeError("toTeX: expression expected");
  return print(expr, symbols).s;
}
