import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { setTokenSource, buildTokens, parseTokensCss } from "../js/design/tokens.mjs";
import { trajectorySpec, trajectoryRun } from "../js/figure/plots/asymptotic-safety.mjs";
import { buildScene } from "../js/figure/scene.mjs";
import { renderSvg } from "../js/figure/svg-renderer.mjs";
import { figureSummary, dataTable } from "../js/figure/summary.mjs";
import { registerAsymptoticSafetyProvenance } from "../js/science/asymptotic-safety-provenance.mjs";
import { getVisualizationProvenance } from "../js/science/provenance.mjs";
import { hasReferenceIdentifier } from "../js/science/references.mjs";
import { fixedPoints, separatrix } from "../js/science/asymptotic-safety.mjs";
import { parseXml } from "./support/xml.mjs";

const T = buildTokens(parseTokensCss(fs.readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8")));
setTokenSource(T);
registerAsymptoticSafetyProvenance();
const fonts = { tick: T.font.mono(-2), label: T.font.mono(-1), family: "monospace" };
const measure = (text) => text.length * 6.25;
const sceneOf = (spec, width = 760) => buildScene(spec, { width, height: spec.height, measure, fonts });
const [, ngfp] = fixedPoints();

test("trajectoryRun joins the infrared and ultraviolet runs through the start at t = 0", () => {
  const run = trajectoryRun({ g0: 0.9, lambda0: 0.3 });
  assert.equal(run.type, "Ia");
  const t = run.points.map((p) => p.t);
  for (let k = 1; k < t.length; k++) assert.ok(t[k] > t[k - 1], "t increases along the whole run");
  assert.ok(t[0] < 0 && t.at(-1) > 0);
  const start = run.points.find((p) => p.t === 0);
  assert.equal(start.g, 0.9); assert.equal(start.lambda, 0.3);
  assert.ok(Math.abs(run.points.at(-1).g - ngfp.g) < 2e-3, "toward the UV every trajectory runs into the NGFP");
  const sep = trajectoryRun({ g0: separatrix().points[600].g, lambda0: separatrix().points[600].lambda });
  assert.equal(sep.type, "IIa");
  assert.equal(trajectoryRun({ g0: 0.3, lambda0: 0.52 }).type, "outside");
});

test("the trajectory figure: g and lambda against ln k, one focal line, the fixed-point values and where an IIIa run stops", () => {
  const run = trajectoryRun({ g0: 0.5, lambda0: 0.1 });
  assert.equal(run.type, "IIIa");
  const spec = trajectorySpec({ run });
  assert.equal(spec.status, "conjectural");
  assert.equal(spec.provenanceId, "rg-gravity-flow-trajectory");
  assert.equal(spec.marks.filter((m) => m.focal).length, 1);
  assert.equal(spec.marks.find((m) => m.id === "g").focal, true);
  assert.deepEqual(["g", "lambda"].map((id) => spec.marks.find((m) => m.id === id).color), ["cat-1", "cat-2"]);
  for (const m of spec.marks.filter((x) => x.type === "line")) assert.ok(m.width <= 1.5 || m.focal, "ordinary lines are 1 to 1.5 px");
  const rules = spec.marks.filter((m) => m.type === "rule");
  assert.ok(rules.some((m) => m.axis === "y" && Math.abs(m.value - ngfp.g) < 1e-9), "g* is a rule");
  assert.ok(rules.some((m) => m.axis === "y" && Math.abs(m.value - ngfp.lambda) < 1e-9), "lambda* is a rule");
  assert.ok(rules.some((m) => m.axis === "x" && m.value === 0), "the start scale k_0");
  assert.ok(spec.marks.find((m) => m.id === "end" && m.type === "points"), "the point where the IIIa run stops, labelled");
  for (const c of new Set(spec.marks.map((m) => m.color))) assert.ok(!c.startsWith("pigment-"), `${c} is not a pigment`);
});

test("a Type Ia run has no stopping point mark and a separatrix reaches the Gaussian fixed point", () => {
  const ia = trajectorySpec({ run: trajectoryRun({ g0: 0.9, lambda0: 0.3 }) });
  assert.ok(!ia.marks.some((m) => m.id === "end"));
  const iia = trajectorySpec({ run: trajectoryRun({ g0: separatrix().points[600].g, lambda0: separatrix().points[600].lambda }) });
  const g = iia.marks.find((m) => m.id === "g");
  assert.ok(Math.min(...g.y) < 1e-2);
});

test("the figure renders at phone and desktop width, inside the plot, with a summary, a table and valid SVG", () => {
  const spec = trajectorySpec({ run: trajectoryRun({ g0: 0.5, lambda0: 0.1 }) });
  for (const width of [340, 760]) {
    const scene = sceneOf(spec, width);
    assert.ok(scene.plot.w > 120 && scene.plot.h > 120, `plot ${scene.plot.w} x ${scene.plot.h} at ${width}`);
    for (const t of scene.texts.filter((x) => ["rule", "region", "callout"].includes(x.role))) {
      assert.ok(t.x >= scene.plot.x - 1 && t.x <= scene.plot.x + scene.plot.w + 1, `${t.text} at ${width}`);
    }
  }
  parseXml(renderSvg(sceneOf(spec), spec, { fonts }));
  assert.match(figureSummary(spec), /coupling|Newton/i);
  assert.ok(dataTable(spec).rows.length > 0);
});

test("both gravity figures have registered, conjectural provenance that names the truncation and the scheme", () => {
  for (const id of ["rg-gravity-flow-silk", "rg-gravity-flow-trajectory"]) {
    const p = getVisualizationProvenance(id);
    assert.ok(p, `${id} is registered`);
    assert.equal(p.status, "conjectural");
    assert.ok(p.layers.length >= 2 && p.layers.every((l) => ["data", "model", "decoration"].includes(l.class)));
    assert.ok(p.layers.some((l) => l.class !== "decoration"));
    assert.ok(p.references.some(hasReferenceIdentifier));
    const text = [...p.assumptions, ...p.validity].join(" ");
    assert.match(text, /truncation/i); assert.match(text, /cutoff|scheme/i); assert.match(text, /Litim/);
    assert.match(p.model, /Einstein/);
  }
});
