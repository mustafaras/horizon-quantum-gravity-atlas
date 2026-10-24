import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

import { library } from "../js/formula/library/index.mjs";
import { KATEX_OPTIONS } from "../js/formula/to-tex.mjs";
import { createConceptBus } from "../js/linking/concept-bus.mjs";
import { G, C, HBAR, SOLAR_MASS } from "../js/science/constants.mjs";
import {
  createLensRegistry, evaluateTerm, formatTermValue, termExpr, termLabel, termRange, termSymbols, termUnit,
} from "../js/formula/lens.mjs";

const close = (a, b, rel, label = "") => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${label} ${a} vs ${b}`);
const { schwarzschildRadius, planckLength, newtonianPotential } = library;
const SOLAR_RADIUS_M = 6.957e8; // IAU 2015 Resolution B3 nominal solar radius

/* ---------- the terms the three scenes bind ---------- */

test("the Schwarzschild radius exposes r_s and, inside it, the mass M as addressable terms", () => {
  assert.deepEqual([...schwarzschildRadius.termIds], ["r_s", "M"]);
  close(schwarzschildRadius.evaluate({ M: SOLAR_MASS }), 2 * G * SOLAR_MASS / (C * C), 1e-15, "r_s unchanged by the extra term");
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(readFileSync(new URL("../vendor/katex/katex.min.js", import.meta.url), "utf8"), sandbox);
  const html = sandbox.module.exports.renderToString(schwarzschildRadius.tex, { ...KATEX_OPTIONS, throwOnError: true });
  assert.match(html, /data-term="r_s"/);
  assert.match(html, /data-term="M"/);
});

test("the Planck length exposes l_P and one term per constant, and the terms recompose l_P", () => {
  assert.deepEqual([...planckLength.termIds], ["l_P", "hbar", "G", "c"]);
  const lP = planckLength.evaluate({});
  close(lP, 1.616255e-35, 2e-6, "CODATA 2018 l_P = 1.616255(18)e-35 m");
  const hbar = evaluateTerm(planckLength, "hbar"), g = evaluateTerm(planckLength, "G"), c = evaluateTerm(planckLength, "c");
  assert.deepEqual([hbar, g, c], [HBAR, G, C]);
  close(Math.sqrt(hbar * g / c ** 3), lP, 1e-14, "sqrt(hbar G / c^3)");
});

test("the Newtonian potential term is -GM/(r c^2): geometric, SI and the solar surface", () => {
  assert.deepEqual([...newtonianPotential.termIds], ["phi"]);
  assert.equal(newtonianPotential.evaluate(newtonianPotential.geometric({ M: 2, r: 4 })), -0.5);
  const solar = newtonianPotential.evaluate({ M: SOLAR_MASS, r: SOLAR_RADIUS_M });
  close(solar, -G * SOLAR_MASS / (SOLAR_RADIUS_M * C * C), 1e-14, "closed form");
  close(solar, -2.12e-6, 5e-3, "the textbook value of |Phi|/c^2 at the solar surface");
  assert.deepEqual({ ...newtonianPotential.dims }, { L: 0, M: 0, T: 0, Th: 0 });
  assert.equal(newtonianPotential.gpuSafe().ok, true);
});

/* ---------- term helpers ---------- */

test("termExpr returns the sub-expression under a term and rejects unknown ids", () => {
  assert.equal(termExpr(schwarzschildRadius, "M").op, "sym");
  assert.equal(termExpr(schwarzschildRadius, "r_s").op, "div");
  assert.throws(() => termExpr(schwarzschildRadius, "nope"), { name: "RangeError", message: /schwarzschild-radius.*nope/ });
});

test("termSymbols splits a term's free symbols into variables and constants", () => {
  assert.deepEqual(termSymbols(schwarzschildRadius, "r_s"), { variables: ["M"], constants: ["G", "c"] });
  assert.deepEqual(termSymbols(schwarzschildRadius, "M"), { variables: ["M"], constants: [] });
  assert.deepEqual(termSymbols(planckLength, "hbar"), { variables: [], constants: ["hbar"] });
});

test("evaluateTerm evaluates a sub-term with declared constants and the given variables", () => {
  close(evaluateTerm(schwarzschildRadius, "r_s", { M: SOLAR_MASS }), 2953.25, 1e-4, "1 solar mass: r_s = 2.953 km");
  assert.equal(evaluateTerm(schwarzschildRadius, "M", { M: SOLAR_MASS }), SOLAR_MASS);
  assert.throws(() => evaluateTerm(schwarzschildRadius, "r_s", {}), { name: "ReferenceError", message: /Unknown symbol: M/ });
});

test("termUnit: the output unit for the whole term, the symbol unit for a bare symbol, the dimensions otherwise", () => {
  assert.equal(termUnit(schwarzschildRadius, "r_s"), "m");
  assert.equal(termUnit(schwarzschildRadius, "M"), "kg");
  assert.equal(termUnit(planckLength, "hbar"), "J s");
  assert.equal(termUnit(planckLength, "G"), "m^3 kg^-1 s^-2");
  assert.equal(termUnit(newtonianPotential, "phi"), "1");
});

test("termLabel names a term for assistive technology", () => {
  assert.equal(termLabel(schwarzschildRadius, "M"), "M: black-hole mass");
  assert.equal(termLabel(planckLength, "hbar"), "ħ: reduced Planck constant");
  assert.equal(termLabel(schwarzschildRadius, "r_s"), "Schwarzschild radius: r_s");
});

test("formatTermValue is deterministic and keeps four significant figures", () => {
  assert.equal(formatTermValue(2953.25), "2953");
  assert.equal(formatTermValue(0.5), "0.5000");
  assert.equal(formatTermValue(-0.5), "-0.5000");
  assert.equal(formatTermValue(1.054571817e-34), "1.055×10⁻³⁴");
  assert.equal(formatTermValue(299792458), "2.998×10⁸");
  assert.equal(formatTermValue(0), "0");
  assert.throws(() => formatTermValue(Number.NaN), /finite/);
});

test("termRange spans the finite values of a term over sample environments", () => {
  const envs = [1, 2, 4].map((r) => newtonianPotential.geometric({ M: 1, r }));
  assert.deepEqual(termRange(newtonianPotential, "phi", envs), [-1, -0.25]);
  assert.throws(() => termRange(newtonianPotential, "phi", []), /at least one/);
  const same = newtonianPotential.geometric({ M: 1, r: 1 });
  assert.throws(() => termRange(newtonianPotential, "phi", [same, same]), /spans a single value/);
});

/* ---------- registry ---------- */

const rsTargets = { r_s: { kind: "object", objectName: "horizon" }, M: { kind: "object", objectName: "mass-readout" } };
const fieldTarget = {
  kind: "field", surfaceName: "well", range: [-1, 0],
  bindings: { M: { node: "mass" }, r: { node: "radius" }, G: 1, c: 1 },
};

test("bindScene validates the formula, the term ids and each target kind", () => {
  const lens = createLensRegistry();
  assert.throws(() => lens.bindScene("", "schwarzschild-radius", { termTargets: rsTargets }), /sceneId/);
  assert.throws(() => lens.bindScene("s", "no-such-formula", { termTargets: rsTargets }), { name: "ReferenceError", message: /no-such-formula/ });
  assert.throws(() => lens.bindScene("s", "schwarzschild-radius", { termTargets: {} }), /at least one term/);
  assert.throws(() => lens.bindScene("s", "schwarzschild-radius", { termTargets: { zz: rsTargets.r_s } }), { name: "RangeError", message: /zz/ });
  assert.throws(() => lens.bindScene("s", "schwarzschild-radius", { termTargets: { r_s: { kind: "mesh", objectName: "a" } } }), /kind/);
  assert.throws(() => lens.bindScene("s", "schwarzschild-radius", { termTargets: { r_s: { kind: "object" } } }), /objectName/);
  assert.throws(() => lens.bindScene("s", "newtonian-potential", { termTargets: { phi: { ...fieldTarget, surfaceName: "" } } }), /surfaceName/);
  assert.throws(() => lens.bindScene("s", "newtonian-potential", { termTargets: { phi: { ...fieldTarget, range: [1, 1] } } }), /range/);
  assert.throws(() => lens.bindScene("s", "newtonian-potential", { termTargets: { phi: { ...fieldTarget, range: [0, Number.NaN] } } }), /range/);
});

test("a field palette is sequential or diverging: a custom ramp would not match the Figure Kit legend", () => {
  const lens = createLensRegistry();
  const bind = (extra) => lens.bindScene("s", "newtonian-potential", { termTargets: { phi: { ...fieldTarget, ...extra } } });
  assert.throws(() => bind({ palette: { stops: [[0, 0, 0], [1, 1, 1]] } }), { name: "RangeError", message: /palette/ });
  assert.throws(() => bind({ palette: "rainbow" }), /palette/);
  assert.doesNotThrow(() => bind({ palette: "diverging" }));
  assert.doesNotThrow(() => bind({ palette: "sequential", paletteName: "magma" }));
  assert.equal(lens.target("newtonian-potential", "phi").paletteName, "magma");
});

test("a field target may name a scene node that masks it (e.g. a rim fade) and nothing else", () => {
  const lens = createLensRegistry();
  const bind = (mask) => lens.bindScene("s", "newtonian-potential", { termTargets: { phi: { ...fieldTarget, mask } } });
  assert.throws(() => bind(""), { name: "TypeError", message: /mask/ });
  assert.throws(() => bind({ node: "rim" }), { name: "TypeError", message: /mask/ });
  assert.doesNotThrow(() => bind("rim"));
  assert.equal(lens.target("newtonian-potential", "phi").mask, "rim");
});

test("a field target must bind exactly the symbols of its term", () => {
  const lens = createLensRegistry();
  const bind = (bindings) => lens.bindScene("s", "newtonian-potential", { termTargets: { phi: { ...fieldTarget, bindings } } });
  assert.throws(() => bind({ M: { node: "mass" }, G: 1, c: 1 }), { name: "RangeError", message: /no binding for r/ });
  assert.throws(() => bind({ ...fieldTarget.bindings, q: 1 }), { name: "RangeError", message: /q is not a symbol of term phi/ });
  assert.throws(() => bind({ ...fieldTarget.bindings, r: { node: "" } }), /node/);
  assert.throws(() => bind({ ...fieldTarget.bindings, r: "radius" }), /number or \{ node \}/);
  assert.doesNotThrow(() => bind({ M: { node: "mass" }, r: { node: "radius" } }), "constants default to 1 (geometric units)");
});

test("the latest binding of a formula wins and unbind restores the previous one", () => {
  const lens = createLensRegistry();
  assert.equal(lens.binding("schwarzschild-radius"), null);
  const offA = lens.bindScene("a", "schwarzschild-radius", { termTargets: rsTargets });
  const offB = lens.bindScene("b", "schwarzschild-radius", { termTargets: { r_s: rsTargets.r_s } });
  assert.equal(lens.binding("schwarzschild-radius").sceneId, "b");
  assert.equal(lens.target("schwarzschild-radius", "M"), null, "b does not bind M");
  offB();
  assert.equal(lens.binding("schwarzschild-radius").sceneId, "a");
  assert.deepEqual({ ...lens.target("schwarzschild-radius", "M") }, { kind: "object", objectName: "mass-readout" });
  offA(); offA();
  assert.equal(lens.binding("schwarzschild-radius"), null);
});

test("bindings are frozen snapshots: later edits of the caller's object cannot change them", () => {
  const lens = createLensRegistry();
  const targets = { r_s: { kind: "object", objectName: "horizon" } };
  lens.bindScene("s", "schwarzschild-radius", { termTargets: targets });
  targets.r_s.objectName = "tampered";
  assert.equal(lens.target("schwarzschild-radius", "r_s").objectName, "horizon");
  assert.throws(() => { lens.binding("schwarzschild-radius").termTargets.r_s.objectName = "x"; }, TypeError);
});

test("termEvent evaluates with the scene's live parameters and returns a payload the bus accepts", () => {
  const lens = createLensRegistry();
  const bus = createConceptBus();
  lens.bindScene("bh", "schwarzschild-radius", { termTargets: rsTargets, live: () => ({ env: { M: SOLAR_MASS } }) });
  const event = lens.termEvent("schwarzschild-radius", "r_s");
  assert.equal(event.formulaId, "schwarzschild-radius");
  assert.equal(event.termId, "r_s");
  assert.equal(event.unit, "m");
  close(event.value, 2953.25, 1e-4);
  assert.deepEqual(bus.validate("formula-term", event), { ok: true });
  assert.equal(lens.termEvent("schwarzschild-radius", "M").value, SOLAR_MASS);
});

test("live may override the unit (scene units) and is read at each event", () => {
  const lens = createLensRegistry();
  let mass = 1;
  lens.bindScene("gr", "newtonian-potential", {
    termTargets: { phi: fieldTarget },
    live: () => ({ env: newtonianPotential.geometric({ M: mass, r: 4 }), unit: "1 (G = c = 1)" }),
  });
  assert.deepEqual({ ...lens.termEvent("newtonian-potential", "phi") }, { formulaId: "newtonian-potential", termId: "phi", value: -0.25, unit: "1 (G = c = 1)" });
  mass = 2;
  assert.equal(lens.termEvent("newtonian-potential", "phi").value, -0.5);
});

test("a term of constants needs no scene; a term with variables and no live source has no event", () => {
  const lens = createLensRegistry();
  assert.deepEqual({ ...lens.termEvent("planck-length", "hbar") }, { formulaId: "planck-length", termId: "hbar", value: HBAR, unit: "J s" });
  assert.equal(lens.termEvent("schwarzschild-radius", "r_s"), null, "M is unknown without a scene");
  assert.equal(lens.termEvent("schwarzschild-radius", "nope"), null);
  assert.equal(lens.termEvent("no-such-formula", "r_s"), null);
});

test("a live source that throws or yields a non-finite value produces no event instead of an exception", () => {
  const diagnostics = [];
  const lens = createLensRegistry({ diagnostic: (message) => diagnostics.push(message) });
  const offThrowing = lens.bindScene("s", "newtonian-potential", { termTargets: { phi: fieldTarget }, live: () => { throw new Error("scene torn down"); } });
  assert.equal(lens.termEvent("newtonian-potential", "phi"), null);
  assert.match(diagnostics[0], /newtonian-potential\.phi threw: scene torn down/);
  offThrowing();
  const off = lens.bindScene("s2", "newtonian-potential", { termTargets: { phi: fieldTarget }, live: () => ({ env: newtonianPotential.geometric({ M: 1, r: 0 }) }) });
  assert.equal(lens.termEvent("newtonian-potential", "phi"), null, "-1/0 is not finite");
  assert.match(diagnostics[1], /not finite/);
  off();
});

test("an injected formula table replaces the library (used by the scene tests)", () => {
  const lens = createLensRegistry({ formulas: { [planckLength.id]: planckLength } });
  assert.throws(() => lens.bindScene("s", "schwarzschild-radius", { termTargets: rsTargets }), { name: "ReferenceError" });
  assert.equal(lens.formula("planck-length"), planckLength);
});
