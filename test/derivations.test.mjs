// derivations.test.mjs — the derivation module and the six derivations the atlas walks.
//
// The property that matters: a derivation's steps must land on its closed form. That is asserted numerically here, on
// the declared domain, for every derivation — so a stepper can never show a chain of algebra that ends somewhere else.
// The second property is the one the S30 contract demands explicitly: where an argument is heuristic, that is data the
// stepper renders, not prose in a comment. The third is that the numbers the derivations quote are the numbers the
// science modules compute, imported rather than retyped.

import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

import { defineDerivation } from "../js/formula/derivation.mjs";
import { add, div, mul, neg, pow, sqrt, sub, term, num } from "../js/formula/expr.mjs";
import { derivations } from "../js/formula/library/derivations.mjs";
import { toTeX } from "../js/formula/to-tex.mjs";
import { KATEX_OPTIONS } from "../js/formula/to-tex.mjs";
import { pageTimeFraction, PAGE_BETA } from "../js/science/evaporation.mjs";
import { SCHWARZSCHILD_CRITICAL_B } from "../js/science/kerr-shadow.mjs";
import { ZETA_MINUS_ONE, criticalDimension } from "../js/science/string-spectrum.mjs";
import { modeSumDifference } from "../js/science/casimir.mjs";
import { C } from "../js/science/constants.mjs";

const sandbox = { module: { exports: {} }, exports: {} };
vm.runInNewContext(readFileSync(new URL("../vendor/katex/katex.min.js", import.meta.url), "utf8"), sandbox);
const katex = sandbox.module.exports;
const render = (tex) => katex.renderToString(tex, { ...KATEX_OPTIONS, throwOnError: true });

const REF = [{ citation: "a source", doi: "10.1000/xyz", retrieved: "2026-10-30" }];
const symbols = {
  x: { tex: "x", unit: "m", dims: { L: 1 }, description: "a length" },
  k: { tex: "k", unit: "1", dims: {}, description: "a dimensionless ratio" },
};
const base = (over = {}) => ({
  id: "d", title: "A derivation", status: "established",
  symbols, domain: { x: [1, 10, "lin"], k: [0.5, 2, "lin"] },
  steps: [
    { id: "one", expr: term("a", mul("k", "x")), changedTerms: ["a"], justification: "start" },
    { id: "two", expr: term("A", div(mul("k", "x"), 2)), changedTerms: ["A"], justification: "halve it" },
  ],
  references: REF,
  ...over,
});

/* ---------- the module ---------- */

test("a derivation validates its steps, freezes them, and exposes TeX for each", () => {
  const d = defineDerivation(base());
  assert.equal(Object.isFrozen(d), true);
  assert.equal(Object.isFrozen(d.steps), true);
  assert.deepEqual(d.steps.map((s) => s.id), ["one", "two"]);
  assert.deepEqual(d.steps.map((s) => s.kind), ["expression", "expression"]);
  assert.deepEqual([...d.termIds], ["a", "A"]);
  assert.match(d.stepTex("one"), /\\htmlData\{term=a\}\{/);
  assert.equal(render(d.stepTex("two")).startsWith('<span class="katex">'), true);
  assert.deepEqual([...d.trace("A")], ["two"]);
});

test("a typeset step has no value and carries its TeX verbatim", () => {
  const d = defineDerivation(base({
    steps: [
      { id: "one", expr: term("a", mul("k", "x")), changedTerms: ["a"], justification: "start" },
      { id: "two", tex: "a \\to A", justification: "rename" },
      { id: "three", expr: term("A", div(mul("k", "x"), 2)), changedTerms: ["A"], justification: "halve it" },
    ],
  }));
  assert.equal(d.steps[1].kind, "typeset");
  assert.equal(d.evaluateStep("two"), null);
  assert.equal(d.stepTex("two"), "a \\to A");
  assert.deepEqual([...d.trace("a")], ["one"]);
});

test("the check compares the last expression step with the closed form over the domain", () => {
  const d = defineDerivation(base({ closed: term("A", mul(mul(0.5, "k"), "x")) }));
  const report = d.check();
  assert.equal(report.ok, true);
  assert.equal(report.step, "two");
  assert.ok(report.samples > 1);
  assert.ok(report.maxRelError <= 1e-12);
});

test("a derivation whose steps disagree with its closed form fails the check", () => {
  // The last step halves the product; the closed form triples it. That is a broken argument, and check() must say so.
  const d = defineDerivation(base({ closed: term("A", mul(mul(3, "k"), "x")) }));
  const report = d.check();
  assert.equal(report.ok, false);
  assert.ok(report.maxRelError > 0.5, `relative error ${report.maxRelError}`);
});

test("a derivation without a closed form reports that rather than claiming agreement", () => {
  const d = defineDerivation(base());
  const report = d.check();
  assert.equal(report.ok, null);
  assert.match(report.reason, /no closed form/);
  assert.throws(() => d.evaluateClosed({}), /no closed form/);
});

test("an expression step evaluates with the constants the symbols declare", () => {
  const withConstant = {
    ...symbols,
    hbar: { tex: "\\hbar", unit: "J s", dims: { L: 2, M: 1, T: -1 }, description: "reduced Planck constant", constant: 1.5 },
  };
  const d = defineDerivation(base({
    symbols: withConstant,
    steps: [
      { id: "one", expr: term("a", "hbar"), changedTerms: ["a"], justification: "read the constant" },
      { id: "two", expr: term("A", mul("hbar", 2)), changedTerms: ["A"], justification: "double it" },
    ],
  }));
  assert.equal(d.evaluateStep("one"), 1.5);
  assert.equal(d.evaluateStep("one", { hbar: 4 }), 4, "an env override wins, as defineFormula's does");
});

/* ---------- validation ---------- */

test("malformed derivations are rejected with a message naming the step", () => {
  assert.throws(() => defineDerivation(base({ steps: [{ id: "one", expr: num(1), justification: "x" }] })), /at least two steps/);
  assert.throws(() => defineDerivation(base({ steps: [] })), /at least two steps/);
  assert.throws(() => defineDerivation(base({ steps: [
    { id: "one", expr: num(1), justification: "ok" },
    { id: "two", expr: num(2) },
  ] })), /steps\[1\] needs a justification/);
  assert.throws(() => defineDerivation(base({ steps: [
    { id: "one", expr: num(1), justification: "ok" },
    { id: "two", expr: num(2), tex: "2", justification: "ok" },
  ] })), /exactly one of expr or tex/);
  assert.throws(() => defineDerivation(base({ steps: [
    { id: "one", expr: num(1), justification: "ok" },
    { id: "two", expr: num(2), changedTerms: [], justification: "ok" },
  ] })), /changedTerms must be a non-empty array/);
  assert.throws(() => defineDerivation(base({ steps: [
    { id: "one", expr: num(1), justification: "ok" },
    { id: "one", expr: num(2), justification: "ok" },
  ] })), /duplicate step id one/);
  assert.throws(() => defineDerivation(base({ references: [] })), /references must be a non-empty array/);
  assert.throws(() => defineDerivation(base({ references: [{ citation: "x", doi: "10.1/x" }] })), /retrieved date/);
});

test("a step cannot highlight a term it does not contain, and an unknown symbol is an error", () => {
  assert.throws(() => defineDerivation(base({ steps: [
    { id: "one", expr: term("a", "k"), changedTerms: ["nope"], justification: "x" },
    { id: "two", expr: term("A", "k"), changedTerms: ["A"], justification: "x" },
  ] })), /changedTerms names "nope"/);
  assert.throws(() => defineDerivation(base({ steps: [
    { id: "one", expr: term("a", "undefinedSymbol"), changedTerms: ["a"], justification: "x" },
    { id: "two", expr: term("A", "k"), changedTerms: ["A"], justification: "x" },
  ] })), /unknown symbol undefinedSymbol/);
  assert.throws(() => defineDerivation(base({ symbols: { x: { tex: "x" } }, steps: [
    { id: "one", expr: term("a", "x"), changedTerms: ["a"], justification: "x" },
    { id: "two", expr: term("A", "x"), changedTerms: ["A"], justification: "x" },
  ] })), /symbols\.x needs a unit/);
});

test("a domain is required for every symbol an expression step uses", () => {
  assert.throws(() => defineDerivation(base({ domain: { k: [0.5, 2, "lin"] } })), /domain\.x must be/);
  assert.throws(() => defineDerivation(base({ domain: { x: [10, 1, "lin"], k: [0, 1, "lin"] } })), /domain\.x must be/);
  assert.throws(() => defineDerivation(base({ domain: { x: [0, 1, "log"], k: [0, 1, "lin"] } })), /domain\.x must be/);
});

test("a step's expression must be dimensionally consistent against its symbols", () => {
  assert.throws(() => defineDerivation(base({ steps: [
    { id: "one", expr: term("a", add("x", "k")), changedTerms: ["a"], justification: "x" },
    { id: "two", expr: term("A", "x"), changedTerms: ["A"], justification: "x" },
  ] })), /operands have different dimensions/);
});

/* ---------- the six derivations ---------- */

test("every derivation in the library agrees with its own closed form on its domain", () => {
  const all = Object.values(derivations);
  assert.ok(all.length >= 6, `${all.length} derivations`);
  for (const d of all) {
    const report = d.check();
    assert.equal(report.ok, true, `${d.id}: ${report.reason ?? `relative error ${report.maxRelError}`}`);
    assert.ok(report.samples >= 1, d.id);
  }
});

test("every derivation step typesets in KaTeX and every justification is a sentence", () => {
  for (const d of Object.values(derivations)) {
    for (const step of d.steps) {
      assert.doesNotThrow(() => render(d.stepTex(step.id)), `${d.id}.${step.id}: ${d.stepTex(step.id)}`);
      assert.ok(step.justification.trim().length > 20, `${d.id}.${step.id} justification is too short to say anything`);
    }
    assert.ok(d.references.length >= 1, `${d.id} cites its source`);
    assert.ok(d.references.every((r) => r.doi || r.arxiv || r.url), `${d.id} carries a resolvable identifier`);
  }
});

test("the Planck-length derivation reproduces the CODATA Planck length in SI", () => {
  const d = derivations.planckLengthDerivation;
  // 1.616255e-35 m is the CODATA 2018 value of the Planck length; js/science/constants.mjs holds the constants.
  assert.ok(Math.abs(d.evaluateStep("assemble") - 1.616255e-35) / 1.616255e-35 < 1e-6);
  assert.ok(Math.abs(d.evaluateClosed() - 1.616255e-35) / 1.616255e-35 < 1e-6);
});

test("the Schwarzschild derivation labels the escape-velocity step heuristic and derives the exact surface", () => {
  const d = derivations.schwarzschildRadiusDerivation;
  const heuristic = d.steps.filter((s) => s.heuristic);
  assert.equal(heuristic.length, 1, "exactly one step is labelled heuristic");
  assert.equal(heuristic[0].id, "escape");
  assert.match(heuristic[0].heuristic, /heuristic|not a derivation|coincidence|coincid/i);
  // The two routes agree numerically for every mass — which is why the label, not the number, is what distinguishes them.
  for (const M of [1e-2, 1, 1.98847e30, 1e2]) {
    const heur = d.evaluateStep("escape", { M });
    const exact = d.evaluateStep("identify", { M });
    assert.ok(Math.abs(heur - exact) / exact < 1e-15, `M = ${M}`);
  }
  // 2GM/c² for one solar mass is 2953.34 m, the value the atlas prints.
  const solar = 1.98847e30;
  assert.ok(Math.abs(d.evaluateStep("identify", { M: solar }) - 2953.34) < 0.01);
});

test("the critical-dimension derivation lands on 26 through the imported ζ(−1), not a retyped −1/12", () => {
  const d = derivations.criticalDimensionDerivation;
  assert.equal(d.evaluateStep("solve"), 26);
  assert.equal(criticalDimension(), 26);
  // The step's value is the imported constant: changing the science module changes the derivation.
  assert.equal(d.evaluateStep("zeta"), ZETA_MINUS_ONE);
  assert.ok(Math.abs(d.evaluateStep("shift", { D: 26 }) + 1) < 1e-15, "a = −(D − 2)/24 is −1 at D = 26");
  assert.match(d.stepTex("solve"), /26/);
});

test("the shadow-radius derivation reproduces √27 M from the imported critical impact parameter", () => {
  const d = derivations.shadowRadiusDerivation;
  assert.equal(d.evaluateStep("orbit", { M: 1 }), 3, "the photon sphere is at r = 3M");
  for (const M of [0.5, 1, 2.5]) {
    assert.ok(Math.abs(d.evaluateStep("critical", { M }) - SCHWARZSCHILD_CRITICAL_B * M) < 1e-12 * M);
    // √27 = 3√3 to the last bit, so the two forms of the last two steps are the same function.
    assert.equal(d.evaluateStep("impact", { M }), d.evaluateStep("critical", { M }));
  }
  assert.ok(Math.abs(SCHWARZSCHILD_CRITICAL_B - Math.sqrt(27)) < 1e-15);
});

test("the Casimir derivation cancels the divergence in its own step and lands on −πħc/24a", () => {
  const d = derivations.casimirDerivation;
  const ids = d.steps.map((s) => s.id);
  // The cancellation is a step of its own: it is not collapsed into the limit.
  assert.ok(ids.indexOf("cancel") > -1 && ids.indexOf("cancel") < ids.indexOf("limit"), ids.join(" → "));
  assert.match(d.stepTex("cancel"), /\{24a\}/);
  assert.match(d.stepTex("cancel"), /\\varepsilon\^2|varepsilon/, "the vanishing remainder is shown");
  // The last step agrees with the science module's own closed form for the 1+1D sum.
  const gap = 1e-6;
  const limit = modeSumDifference({ gap, cutoff: (600 * Math.PI * C) / gap }).limit;
  assert.ok(Math.abs(d.evaluateStep("limit", { a: gap }) - limit) / Math.abs(limit) < 1e-12);
});

test("the Page-time derivation gives 0.5381 τ from the imported β", () => {
  const d = derivations.pageTimeDerivation;
  assert.equal(d.evaluateStep("value"), pageTimeFraction());
  assert.ok(Math.abs(d.evaluateStep("value") - 0.5381) < 5e-5, `got ${d.evaluateStep("value")}`);
  assert.ok(Math.abs(d.evaluateStep("entropy", { f: 0.5 }) - 0.25) < 1e-15);
  assert.ok(Math.abs(d.evaluateStep("radiation", { f: 0.5 }) - PAGE_BETA * 0.75) < 1e-15);
  // The crossing step's premise: at the Page fraction the two entropies are equal.
  const f = Math.sqrt(PAGE_BETA / (1 + PAGE_BETA));
  assert.ok(Math.abs(d.evaluateStep("entropy", { f }) - d.evaluateStep("radiation", { f })) < 1e-12);
});

test("the two traps the contract names are labelled as data the stepper can render", () => {
  // The escape-velocity step is heuristic; the Casimir cancellation step exists at all.
  const escape = derivations.schwarzschildRadiusDerivation.steps.find((s) => s.id === "escape");
  assert.ok(escape.heuristic, "the heuristic step carries a label a renderer can print");
  const cancel = derivations.casimirDerivation.steps.find((s) => s.id === "cancel");
  assert.ok(cancel && cancel.kind === "typeset" && /cancel/i.test(cancel.justification), "the cancellation is shown, not skipped");
  // Every heuristic label across the library is attached to a step whose TeX renders.
  for (const d of Object.values(derivations)) {
    for (const step of d.steps.filter((s) => s.heuristic)) {
      assert.doesNotThrow(() => render(d.stepTex(step.id)), `${d.id}.${step.id}`);
    }
  }
});

test("the derivations typeset their own terms addressably, so the lens can follow a step", () => {
  for (const d of Object.values(derivations)) {
    const withTerms = d.steps.filter((s) => s.expr);
    assert.ok(withTerms.length >= 1, `${d.id} has at least one evaluable step`);
    for (const step of withTerms) assert.match(d.stepTex(step.id), /\\htmlData\{term=/, `${d.id}.${step.id}`);
  }
  assert.match(toTeX(term("t", num(1))), /htmlData\{term=t\}/);
});
