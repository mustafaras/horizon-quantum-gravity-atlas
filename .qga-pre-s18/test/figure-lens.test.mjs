import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { setTokenSource, buildTokens, parseTokensCss } from "../js/design/tokens.mjs";
import { figure, axis, line, points, rule } from "../js/figure/spec.mjs";
import { buildScene } from "../js/figure/scene.mjs";
import { markIndexesFor, createFigureLens } from "../js/figure/lens.mjs";
import { createLensRegistry } from "../js/formula/lens.mjs";
import { createConceptBus } from "../js/linking/concept-bus.mjs";

const T = buildTokens(parseTokensCss(fs.readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8")));
setTokenSource(T);
const fonts = { tick: T.font.mono(-2), label: T.font.mono(-1), family: "monospace" };
const measure = (text) => text.length * 6.25;

const spec = figure({
  id: "lens-test", title: "Lens test", status: "effective", provenanceId: "lens-test",
  x: axis({ scale: { type: "linear", domain: [0, 3] }, label: { tex: "x" } }),
  y: axis({ scale: { type: "linear", domain: [0, 3] }, label: { tex: "y" } }),
  marks: [
    line({ x: [0, 3], y: [0, 3], layer: "model", id: "charge:a" }),
    line({ x: [0, 3], y: [1, 2], layer: "model", id: "charge:b" }),
    points({ x: [1], y: [1], layer: "data", id: "isospin" }),
    rule({ axis: "x", value: 2, layer: "model", id: "scale" }),
  ],
});

const setup = (overrides = {}) => {
  const events = [];
  const bus = createConceptBus({ diagnostic: () => {} });
  const registry = createLensRegistry({ diagnostic: () => {} });
  const handle = createFigureLens({
    spec, sceneId: "lens-test", formulaId: "ew-vector-coupling", bus, registry, onChange: (lit) => events.push(lit),
    termTargets: { charge: { kind: "object", objectName: "charge" }, isospin: { kind: "object", objectName: "isospin" } },
    live: () => ({ env: { T3: -0.5, Q: -1, sin2: 0.23122 } }),
    ...overrides,
  });
  return { bus, registry, handle, events };
};

test("an object name addresses a mark by id, or every mark whose id starts with name:", () => {
  assert.deepEqual(markIndexesFor(spec, "charge"), [0, 1]);
  assert.deepEqual(markIndexesFor(spec, "charge:b"), [1]);
  assert.deepEqual(markIndexesFor(spec, "isospin"), [2]);
  assert.deepEqual(markIndexesFor(spec, "charg"), [], "a partial name matches nothing");
});

test("the lens binds the terms into the registry and lights the marks of the focused term", () => {
  const { bus, registry, handle, events } = setup();
  assert.equal(registry.target("ew-vector-coupling", "charge").objectName, "charge");
  const term = registry.termEvent("ew-vector-coupling", "isospin");
  bus.publish("formula-term", term);
  assert.deepEqual(events.at(-1), [2]);
  bus.publish("formula-term", registry.termEvent("ew-vector-coupling", "charge"));
  assert.deepEqual(events.at(-1), [0, 1]);
  bus.publish("formula-clear", { reason: "blur" });
  assert.deepEqual(events.at(-1), []);
  handle.dispose();
  bus.publish("formula-term", term);
  assert.deepEqual(events.at(-1), [], "after dispose the lens no longer reacts");
  assert.equal(registry.binding("ew-vector-coupling"), null, "and the registry binding is removed");
});

test("the spec can be a function: the lit marks follow the figure as it is rebuilt, without rebinding", () => {
  let current = spec;
  const { bus, registry, events } = setup({ spec: () => current });
  const term = registry.termEvent("ew-vector-coupling", "isospin");
  bus.publish("formula-term", term);
  assert.deepEqual(events.at(-1), [2]);
  bus.publish("formula-clear", { reason: "blur" });
  current = figure({
    id: "lens-test", title: "Lens test", status: "effective", provenanceId: "lens-test", x: spec.x, y: spec.y,
    marks: [points({ x: [1], y: [1], layer: "data", id: "isospin" }), ...spec.marks.filter((m) => m.id !== "isospin")],
  });
  bus.publish("formula-term", term);
  assert.deepEqual(events.at(-1), [0], "the same term now addresses the mark's new index");
});

test("a term without a target, or from another formula, lights nothing", () => {
  const { bus, registry, handle, events } = setup();
  bus.publish("formula-term", registry.termEvent("ew-vector-coupling", "gV"));
  assert.deepEqual(handle.lit, []);
  assert.equal(events.length, 0, "no change, no event");
  const before = events.length;
  bus.publish("formula-term", { formulaId: "higgs-quartic-tree", termId: "lambda", value: 1, unit: "1" });
  assert.equal(events.length, before, "another formula's events are ignored");
});

test("wiring errors fail loudly: a target with no mark, a field target, an unknown term", () => {
  assert.throws(() => setup({ termTargets: { charge: { kind: "object", objectName: "nothing" } } }), ReferenceError);
  assert.throws(() => setup({ termTargets: { charge: { kind: "field", surfaceName: "s", range: [0, 1], bindings: {} } } }), TypeError);
  assert.throws(() => setup({ termTargets: { nope: { kind: "object", objectName: "charge" } } }), RangeError);
});

test("buildScene draws the lit marks at the focal width and dims the rest; nothing changes without a lit set", () => {
  const base = buildScene(spec, { width: 480, height: 320, measure, fonts });
  const none = buildScene(spec, { width: 480, height: 320, measure, fonts, lit: [] });
  assert.deepEqual(none.prims, base.prims, "an empty lit set is the plain scene");
  const lit = buildScene(spec, { width: 480, height: 320, measure, fonts, lit: [0] });
  const lines = (scene) => scene.prims.filter((p) => p.role === "data" && p.k === "line");
  const [on, off] = [lines(lit).find((p) => p.mark === 0), lines(lit).find((p) => p.mark === 1)];
  assert.equal(on.w, 2.5, "the focal line width of the art direction");
  assert.equal(on.a, 1);
  assert.ok(off.a < 0.4 && off.w <= 1.8, `the other lines recede (${off.a}, ${off.w})`);
  const dot = lit.prims.find((p) => p.k === "circle" && p.mark === 2);
  assert.ok(dot.a < 0.4, "unlit points recede too");
  const litDot = buildScene(spec, { width: 480, height: 320, measure, fonts, lit: [2] }).prims.find((p) => p.k === "circle" && p.mark === 2);
  assert.ok(litDot.r > dot.r && litDot.a === 1);
});
