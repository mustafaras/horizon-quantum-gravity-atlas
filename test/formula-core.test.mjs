import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

import * as E from "../js/formula/expr.mjs";
import { compileJS } from "../js/formula/to-js.mjs";
import { toTeX, KATEX_OPTIONS } from "../js/formula/to-tex.mjs";
import { compileTSL } from "../js/formula/to-tsl.mjs";
import { inferDimensions, dimensionToObject } from "../js/formula/dimensions.mjs";
import { defineFormula } from "../js/formula/formula.mjs";
import { library } from "../js/formula/library/index.mjs";
import * as physics from "../js/physics.mjs";
import { SOLAR_MASS } from "../js/science/constants.mjs";

const { add, sub, mul, div, neg, pow, sqrt, cbrt, num, sym, rat, term, lt, gt, select, clamp, atan2, min, max, PI } = E;
const close = (a, b, rel, label) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${label ?? ""} ${a} vs ${b}`);
const REFS = [{ citation: "test", url: "https://example.org", retrieved: "2026-10-22" }];

/* ---------- constructors ---------- */

test("constructors freeze nodes and validate arity with the operator name", () => {
  assert.ok(Object.isFrozen(add("x", 1)) && Object.isFrozen(add("x", 1).args));
  assert.throws(() => add("x"), { name: "TypeError", message: /^add:/ });
  assert.throws(() => mul(), { name: "TypeError", message: /^mul:/ });
  assert.throws(() => div("x"), { name: "TypeError", message: /^div:/ });
  assert.throws(() => sub("x", "y", "z"), { name: "TypeError", message: /^sub:/ });
  assert.throws(() => sqrt("x", "y"), { name: "TypeError", message: /^sqrt:/ });
  assert.throws(() => clamp("x", 0), { name: "TypeError", message: /^clamp:/ });
  assert.throws(() => atan2("y"), { name: "TypeError", message: /^atan2:/ });
  assert.throws(() => pow("x", {}), { name: "TypeError", message: /^pow:/ });
  assert.throws(() => num(Number.NaN), { name: "TypeError", message: /^num:/ });
  assert.throws(() => sym("2x"), { name: "TypeError", message: /^sym:/ });
  assert.throws(() => term("bad id", "x"), { name: "TypeError", message: /^term:/ });
  assert.throws(() => select("x", 1, 2), { name: "TypeError", message: /^select:/ });
  assert.throws(() => num(0.5, { p: 1, q: 3 }), { name: "TypeError" });
});

test("rationals are inferred for small fractions and exact when given", () => {
  assert.deepEqual({ ...num(0.5).rational }, { p: 1, q: 2 });
  assert.deepEqual({ ...rat(-1, 5).rational }, { p: -1, q: 5 });
  assert.equal(num(Math.PI).rational, undefined);
  assert.deepEqual(E.freeSymbols(add(mul("a", "b"), "a", sqrt("c"))), ["a", "b", "c"]);
  assert.throws(() => E.termIds(add(term("t", "x"), term("t", "y"))), /duplicate/);
});

/* ---------- float64 and float32 evaluation ---------- */

test("compileJS f64 evaluates every operator", () => {
  const f = (expr, env = {}) => compileJS(expr)(env);
  assert.equal(f(add(1, 2, 3)), 6);
  assert.equal(f(sub(5, 3)), 2);
  assert.equal(f(mul(2, 3, 4)), 24);
  assert.equal(f(div(1, 4)), 0.25);
  assert.equal(f(neg("x"), { x: 2 }), -2);
  assert.equal(f(pow("x", 3), { x: 2 }), 8);
  assert.equal(f(sqrt(16)), 4);
  assert.equal(f(cbrt(-27)), -3);
  assert.equal(f(E.abs(-3)), 3);
  assert.equal(f(min(3, 1, 2)), 1);
  assert.equal(f(max(3, 1, 2)), 3);
  assert.equal(f(clamp(5, 0, 1)), 1);
  assert.equal(f(atan2(1, 1)), Math.PI / 4);
  assert.equal(f(E.exp(0)), 1);
  assert.equal(f(E.log(Math.E)), 1);
  assert.equal(f(select(lt("x", 0), -1, 1), { x: -5 }), -1);
  assert.equal(f(select(gt("x", 0), 7, 9), { x: -5 }), 9);
  assert.equal(f(lt(1, 2)), 1);
  assert.equal(f(term("t", add(1, 1))), 2);
});

test("f32 mode equals a Math.fround-chained manual computation", () => {
  const r = Math.fround;
  const expr = div(add(mul("a", "b"), sqrt("c")), sub("a", 0.1));
  const env = { a: 1.1, b: 3.3, c: 2.2 };
  const manual = r(r(r(r(env.a) * r(env.b)) + r(Math.sqrt(r(env.c)))) / r(r(env.a) - r(0.1)));
  assert.equal(compileJS(expr, { precision: "f32" })(env), manual);
  assert.notEqual(compileJS(expr, { precision: "f64" })(env), manual);
  const p = pow(sym("a"), rat(3, 5));
  assert.equal(compileJS(p, { precision: "f32" })(env), r(Math.pow(r(env.a), r(0.6))));
  assert.throws(() => compileJS(expr, { precision: "f16" }), TypeError);
});

test("unknown symbols throw ReferenceError naming the symbol", () => {
  assert.throws(() => compileJS(add("x", "y"))({ x: 1 }), { name: "ReferenceError", message: /y/ });
  assert.throws(() => compileJS("x"), TypeError);
  assert.throws(() => compileTSL(add("x", "y"), { add() {}, float() {} }, { x: 1 }), { name: "ReferenceError", message: /y/ });
});

/* ---------- TeX ---------- */

const T = (expr, symbols) => toTeX(expr, symbols);
test("toTeX prints with correct precedence and minimal parentheses (snapshots)", () => {
  assert.equal(T(add("x", mul("y", "z"))), "x + y z");
  assert.equal(T(mul(add("x", "y"), "z")), "\\left(x + y\\right) z");
  assert.equal(T(sub("x", sub("y", "z"))), "x - \\left(y - z\\right)");
  assert.equal(T(sub(sub("x", "y"), "z")), "x - y - z");
  assert.equal(T(sub("x", add("y", "z"))), "x - \\left(y + z\\right)");
  assert.equal(T(div(add("x", 1), mul(2, "y"))), "\\frac{x + 1}{2 y}");
  assert.equal(T(mul(2, "x")), "2 x");
  assert.equal(T(mul(2, 3)), "2 \\cdot 3");
  assert.equal(T(mul(2, pow(3, 2))), "2 \\cdot 3^{2}");
  assert.equal(T(mul(3, sqrt(3), "M")), "3 \\sqrt{3} M");
  assert.equal(T(pow("x", 2)), "x^{2}");
  assert.equal(T(pow(add("x", 1), 2)), "\\left(x + 1\\right)^{2}");
  assert.equal(T(pow(div("a", "b"), 2)), "\\left(\\frac{a}{b}\\right)^{2}");
  assert.equal(T(pow(pow("x", 2), 3)), "\\left(x^{2}\\right)^{3}");
  assert.equal(T(pow("x", rat(1, 2))), "\\sqrt{x}");
  assert.equal(T(pow("x", rat(1, 3))), "\\sqrt[3]{x}");
  assert.equal(T(pow("x", rat(-3, 5))), "x^{-\\frac{3}{5}}");
  assert.equal(T(neg(add("x", "y"))), "-\\left(x + y\\right)");
  assert.equal(T(mul(neg("x"), "y")), "\\left(-x\\right) y");
  assert.equal(T(add("x", neg("y"))), "x - y");
  assert.equal(T(mul(-2, "x")), "\\left(-2\\right) x");
  assert.equal(T(mul(PI, "x")), "\\pi x");
  assert.equal(T(num(6.674e-11)), "6.674\\times 10^{-11}");
  assert.equal(T(E.sin(add("x", 1))), "\\sin\\left(x + 1\\right)");
  assert.equal(T(E.abs("x")), "\\left|x\\right|");
  assert.equal(T(atan2("y", "x")), "\\operatorname{atan2}\\left(y, x\\right)");
  assert.equal(T(select(lt("x", 0), 1, 2)), "\\begin{cases} 1 & \\text{if } x < 0 \\\\ 2 & \\text{otherwise} \\end{cases}");
  assert.equal(T(mul("hbar", pow("c", 3)), { hbar: { tex: "\\hbar" }, c: "c" }), "\\hbar c^{3}");
});

test("terms wrap as \\htmlData and keep the inner precedence", () => {
  assert.equal(T(term("t", add("x", 1))), "\\htmlData{term=t}{x + 1}");
  assert.equal(T(mul(term("t", add("x", 1)), "y")), "\\left(\\htmlData{term=t}{x + 1}\\right) y");
  assert.equal(T(term("t", "x", { tex: "\\Theta" })), "\\htmlData{term=t}{\\Theta}");
});

test("KaTeX 0.16.9 renders \\htmlData terms with the shipped options and rejects them without trust", () => {
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(readFileSync(new URL("../vendor/katex/katex.min.js", import.meta.url), "utf8"), sandbox);
  const katex = sandbox.module.exports;
  assert.equal(katex.version, "0.16.9");
  const tex = library.schwarzschildRadius.tex;
  const html = katex.renderToString(tex, { ...KATEX_OPTIONS, throwOnError: true });
  assert.match(html, /data-term="r_s"/);
  const untrusted = katex.renderToString(tex, { throwOnError: false });
  assert.doesNotMatch(untrusted, /data-term/);
  for (const formula of Object.values(library)) {
    assert.doesNotThrow(() => katex.renderToString(formula.tex, { ...KATEX_OPTIONS, throwOnError: true }), formula.id);
  }
});

/* ---------- TSL (numeric stand-in for the "three/tsl" namespace) ---------- */

const fakeTSL = {
  float: (v) => v, add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b, div: (a, b) => a / b,
  pow: Math.pow, sqrt: Math.sqrt, cbrt: Math.cbrt, exp: Math.exp, log: Math.log, sin: Math.sin, cos: Math.cos,
  tan: Math.tan, abs: Math.abs, min: Math.min, max: Math.max,
  atan: (y, x) => (x === undefined ? Math.atan(y) : Math.atan2(y, x)),
  clamp: (x, lo, hi) => Math.min(Math.max(x, lo), hi),
  lessThan: (a, b) => a < b, greaterThan: (a, b) => a > b, select: (c, a, b) => (c ? a : b),
};

test("compileTSL maps every operator and agrees with compileJS", () => {
  const expr = div(add(mul(2, "x"), sqrt("y"), cbrt("y"), pow("x", 3), pow("x", -2), pow("y", rat(3, 5)), pow("x", "y")),
    add(1, E.exp(0), E.log("y"), E.sin("x"), E.cos("x"), E.tan("x"), E.atan("x"), atan2("y", "x"), E.abs(neg("x")),
      min("x", "y"), max("x", "y"), clamp("x", 0, 1), select(lt("x", "y"), "x", "y"), lt("x", "y"), gt("x", "y")));
  const env = { x: 0.7, y: 2.3 };
  close(compileTSL(expr, fakeTSL, env).node, compileJS(expr)(env), 1e-12);
});

test("compileTSL returns terms, shares subgraphs, and fails loudly on a missing operator", () => {
  const shared = add("x", 1);
  const expr = mul(term("a", shared), term("b", shared), term("c", div(shared, 2)));
  const { node, terms } = compileTSL(expr, fakeTSL, { x: 3 });
  assert.equal(node, 4 * 4 * 2);
  assert.deepEqual(terms, { a: 4, b: 4, c: 2 });
  assert.ok(Object.isFrozen(terms));
  const { atan, ...withoutAtan } = fakeTSL;
  assert.throws(() => compileTSL(atan2("y", "x"), withoutAtan, { x: 1, y: 1 }), { name: "TypeError", message: /tsl\.atan.*atan2/ });
  assert.throws(() => compileTSL("x", null, {}), TypeError);
});

test("integer powers compile to multiplications so a negative base stays defined", () => {
  const calls = [];
  const spy = { ...fakeTSL, pow: (...a) => { calls.push("pow"); return Math.pow(...a); } };
  assert.equal(compileTSL(pow("x", 3), spy, { x: -2 }).node, -8);
  assert.equal(compileTSL(pow("x", -2), spy, { x: -2 }).node, 0.25);
  assert.deepEqual(calls, []);
  compileTSL(pow("x", rat(3, 5)), spy, { x: 2 });
  assert.deepEqual(calls, ["pow"]);
});

/* ---------- dimensions ---------- */

const SYM = {
  L: { dims: { L: 1 } }, T: { dims: { T: 1 } }, M: { dims: { M: 1 } }, n: {},
};
test("inferDimensions propagates and accepts consistent expressions", () => {
  assert.deepEqual(dimensionToObject(inferDimensions(div("L", "T"), SYM)), { L: 1, M: 0, T: -1, Th: 0 });
  assert.deepEqual(dimensionToObject(inferDimensions(sqrt(mul("L", "L")), SYM)), { L: 1, M: 0, T: 0, Th: 0 });
  assert.deepEqual(dimensionToObject(inferDimensions(pow("L", rat(3, 5)), SYM)), { L: 0.6, M: 0, T: 0, Th: 0 });
  assert.deepEqual(dimensionToObject(inferDimensions(cbrt(mul("L", "L", "L")), SYM)), { L: 1, M: 0, T: 0, Th: 0 });
  assert.deepEqual(dimensionToObject(inferDimensions(E.exp(div("L", "L")), SYM)), { L: 0, M: 0, T: 0, Th: 0 });
  assert.deepEqual(dimensionToObject(inferDimensions(select(lt("L", "L"), "T", "T"), SYM)), { L: 0, M: 0, T: 1, Th: 0 });
  assert.deepEqual(dimensionToObject(inferDimensions(pow("n", "n"), SYM)), { L: 0, M: 0, T: 0, Th: 0 });
});

test("inferDimensions throws a TypeError naming the offending operator", () => {
  for (const [op, expr] of [
    ["add", add("L", "T")], ["sub", sub("L", "T")], ["min", min("L", "T")], ["max", max("L", "M")],
    ["clamp", clamp("L", "T", "L")], ["select", select(lt("L", "L"), "L", "T")], ["lt", lt("L", "T")],
    ["exp", E.exp("L")], ["log", E.log("L")], ["sin", E.sin("L")], ["atan", E.atan("T")], ["atan2", atan2("L", "T")],
    ["pow", pow("L", "n")], ["pow", pow("n", "L")], ["pow", pow("L", num(Math.PI))],
  ]) {
    assert.throws(() => inferDimensions(expr, SYM), (e) => e instanceof TypeError && e.message.startsWith(`${op}:`), op);
  }
  assert.throws(() => inferDimensions(sym("nope"), SYM), { name: "ReferenceError", message: /nope/ });
});

/* ---------- defineFormula ---------- */

test("defineFormula validates its input and returns a frozen formula", () => {
  const base = {
    id: "x", title: "X", status: "established", symbols: { x: { tex: "x", dims: { L: 1 } } },
    output: { tex: "y", dims: { L: 1 } }, expr: mul(2, "x"), domain: { x: [1, 2, "lin"] }, references: REFS,
  };
  const f = defineFormula(base);
  assert.ok(Object.isFrozen(f));
  assert.equal(f.evaluate({ x: 4 }), 8);
  assert.equal(f.evaluateF32({ x: 4 }), 8);
  assert.equal(f.tex, "2 x");
  assert.deepEqual(f.termIds, []);
  assert.deepEqual({ ...f.dims }, { L: 1, M: 0, T: 0, Th: 0 });
  assert.throws(() => defineFormula({ ...base, status: "wrong" }), TypeError);
  assert.throws(() => defineFormula({ ...base, id: "" }), TypeError);
  assert.throws(() => defineFormula({ ...base, expr: mul(2, "z") }), { name: "ReferenceError", message: /z/ });
  assert.throws(() => defineFormula({ ...base, domain: {} }), /domain\.x/);
  assert.throws(() => defineFormula({ ...base, domain: { x: [0, 1, "log"] } }), /domain\.x/);
  assert.throws(() => defineFormula({ ...base, references: [] }), /references/);
  assert.throws(() => defineFormula({ ...base, references: [{ citation: "no locator", retrieved: "2026-10-22" }] }), /references\[0\]/);
  assert.throws(() => defineFormula({ ...base, references: [{ citation: "no date", url: "https://example.org" }] }), /retrieved/);
  assert.throws(() => defineFormula({ ...base, output: { dims: { T: 1 } } }), /output declares/);
  assert.throws(() => defineFormula({ ...base, expr: add("x", 1) }), { name: "TypeError", message: /^add:/ });
});

test("gpuSafe is deterministic, flags float32 range loss and catastrophic cancellation", () => {
  const f = library.lorentzGamma;
  assert.deepEqual(f.gpuSafe(), f.gpuSafe());
  assert.deepEqual(f.sampleGrid({ samples: 9 }), f.sampleGrid({ samples: 9 }));
  assert.equal(f.sampleGrid({ samples: 9 }).points.length, 9);
  const si = library.planckLength.gpuSafe({ units: "si" });
  assert.equal(si.ok, false, "ħG/c³ ≈ 7e-45 is below the float32 range in SI");
  assert.equal(library.planckLength.gpuSafe().ok, true);
  const bad = defineFormula({
    id: "cancel", title: "cancel", status: "heuristic", symbols: { x: { tex: "x" } },
    expr: sub(add("x", 1e-4), "x"), domain: { x: [1e4, 1e5, "lin"] }, references: REFS,
  });
  assert.equal(bad.gpuSafe().ok, false);
  assert.ok(bad.gpuSafe().maxRelError > 1e-4);
});

/* ---------- the library ---------- */

test("library values match the literature (geometric/SI wrappers)", () => {
  const L = library, M = SOLAR_MASS;
  close(L.schwarzschildRadius.evaluate({ M }), 2953.34, 1e-6, "r_s of 1 M☉");
  close(L.hawkingTemperature.evaluate({ M }), 6.17007e-8, 1e-6, "T_H of 1 M☉");
  close(L.kerrOuterHorizon.evaluate({ M: 1, a: 0.9 }), 1.435890, 1e-6, "r+ at a*=0.9");
  assert.equal(L.photonSphere.evaluate({ M: 1 }), 3);
  close(L.criticalImpact.evaluate({ M: 1 }), 3 * Math.sqrt(3), 1e-15);
  close(L.planckLength.evaluate({}), 1.616255e-35, 1e-6, "ℓ_P");
  close(L.chirpMass.evaluate({ m1: 36, m2: 29 }), 28.0956, 1e-5, "GW150914 chirp mass");
  close(L.casimirPressure.evaluate({ a: 1e-6 }), 1.3001e-3, 1e-4, "Casimir at 1 μm");
  assert.equal(L.flammEmbedding.evaluate({ r: 5, rs: 1 }), 4);
  close(L.bekensteinHawkingEntropy.evaluate({ A: 1 }), 1.380649e-23 * 299792458 ** 3 / (4 * 6.6743e-11 * 1.054571817e-34), 1e-15);
  close(L.lorentzGamma.evaluate({ beta: 0.6 }), 1.25, 1e-15);
  assert.equal(L.hawkingTemperature.geometric({ M: 2 }).hbar, 1);
  close(L.hawkingTemperature.evaluate(L.hawkingTemperature.geometric({ M: 1 })), 1 / (8 * Math.PI), 1e-15);
});

test("library formulas equal the existing physics.mjs implementations to 1e-12", () => {
  const L = library, M = SOLAR_MASS;
  for (const solar of [0.5, 1, 10, 4.3e6]) {
    close(L.schwarzschildRadius.evaluate({ M: solar * M }), physics.schwarzschildRadius(solar), 1e-12, "r_s");
    close(L.hawkingTemperature.evaluate({ M: solar * M }), physics.hawkingTemperature(solar), 1e-12, "T_H");
  }
  for (const [m1, m2] of [[36, 29], [1.4, 1.4], [10, 3]]) close(L.chirpMass.evaluate({ m1, m2 }), physics.chirpMass(m1, m2), 1e-12, "Mc");
  for (const beta of [0, 0.3, 0.9]) close(L.lorentzGamma.evaluate({ beta }), physics.lorentzGamma(beta), 1e-12, "gamma");
  for (const [tau, mc] of [[1, 28], [0.1, 1.2], [30, 10]]) {
    close(L.newtonianGwFrequency.evaluate({ tau, Mc: mc * M }), physics.inspiralFrequency(tau, mc), 1e-12, "f_gw");
  }
  close(L.photonSphere.evaluate({ M: 2.5 }), physics.grPhotonSphereRadius(2.5, 1), 1e-12);
  close(L.criticalImpact.evaluate({ M: 2.5 }), physics.grCriticalImpactParameter(2.5, 1), 1e-12);
  close(L.kerrOuterHorizon.evaluate({ M: 1, a: 0.9 }), physics.kerrGeometry(0.9).rPlus, 1e-12);
});

test("every library formula is dimensionally consistent, documented and GPU safe in geometric units", () => {
  const dims = {
    schwarzschildRadius: { L: 1 }, hawkingTemperature: { Th: 1 }, bekensteinHawkingEntropy: { M: 1, L: 2, T: -2, Th: -1 },
    kerrOuterHorizon: { L: 1 }, photonSphere: { L: 1 }, criticalImpact: { L: 1 }, planckLength: { L: 1 },
    chirpMass: { M: 1 }, newtonianGwFrequency: { T: -1 }, casimirPressure: { M: 1, L: -1, T: -2 }, flammEmbedding: { L: 1 }, lorentzGamma: {},
  };
  assert.deepEqual(Object.keys(library).sort(), Object.keys(dims).sort());
  for (const [name, f] of Object.entries(library)) {
    assert.deepEqual({ ...f.dims }, { L: 0, M: 0, T: 0, Th: 0, ...dims[name] }, name);
    assert.ok(f.termIds.length >= 1, `${name} exposes a term`);
    const report = f.gpuSafe();
    assert.ok(report.ok, `${name}: float32 error ${report.maxRelError} at ${JSON.stringify(report.worst)}`);
    assert.equal(report.skipped, 0, name);
  }
});
