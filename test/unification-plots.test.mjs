import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { setTokenSource, buildTokens, parseTokensCss } from "../js/design/tokens.mjs";
import { couplingRunSpec, triangleSpec } from "../js/figure/plots/unification.mjs";
import { buildScene } from "../js/figure/scene.mjs";
import { renderSvg } from "../js/figure/svg-renderer.mjs";
import { figureSummary, dataTable } from "../js/figure/summary.mjs";
import { registerGaugeRunningProvenance } from "../js/science/gauge-running-provenance.mjs";
import { getVisualizationProvenance } from "../js/science/provenance.mjs";
import { hasReferenceIdentifier } from "../js/science/references.mjs";
import { runGaugeCouplings, gaugeBand, unificationTriangle, inputsAtMZ } from "../js/science/gauge-running.mjs";
import { PDG } from "../js/science/data/pdg.mjs";
import { ALPHA_EM_INVERSE_MZ } from "../js/science/data/gauge-couplings.mjs";
import { parseXml } from "./support/xml.mjs";

const T = buildTokens(parseTokensCss(fs.readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8")));
setTokenSource(T);
registerGaugeRunningProvenance();
const fonts = { tick: T.font.mono(-2), label: T.font.mono(-1), family: "monospace" };
const measure = (text) => text.length * 6.25;

const POINTS = 200;
const layerOf = (model, { primary = true, opacity = 1 } = {}) => ({
  model, primary, opacity,
  twoLoop: runGaugeCouplings({ loops: 2, model, points: POINTS }),
  oneLoop: runGaugeCouplings({ loops: 1, model, points: POINTS }),
  band: gaugeBand({ loops: 2, model, points: POINTS }),
});
const SM = layerOf("sm"), MSSM = layerOf("mssm");
const log10Mz = Math.log10(PDG.MZ.value);
const SIGMAS = [0.0078, 0.0083, PDG.alphaS.uncertainty / PDG.alphaS.value ** 2];
const base = { inputs: { log10Mz, values: inputsAtMZ(), sigmas: SIGMAS }, mSusyLog: null, selectedLog: 10, focusIndex: 2, showOneLoop: true, status: "effective", planckLog: 19.0866 };
const sceneOf = (spec, width = 760) => buildScene(spec, { width, height: spec.height, measure, fonts });

test("the coupling plot: three solid two-loop lines, three dashed one-loop lines, three bands, the M_Z inputs with errors", () => {
  const spec = couplingRunSpec({ ...base, layers: [SM] });
  const ids = (prefix) => spec.marks.filter((m) => m.id?.startsWith(prefix));
  assert.equal(ids("twoloop:").length, 3);
  assert.deepEqual(ids("oneloop:").map((m) => m.dash !== null), [true, true, true]);
  assert.equal(spec.marks.filter((m) => m.type === "band").length, 3);
  for (const band of spec.marks.filter((m) => m.type === "band")) assert.ok(band.opacity <= 0.18, "bands stay at or under 18 percent");
  const inputs = ids("inputs:");
  assert.equal(inputs.length, 3);
  inputs.forEach((m, i) => { assert.equal(m.x[0], log10Mz); assert.deepEqual(m.yErr, [[SIGMAS[i]], [SIGMAS[i]]]); });
  assert.equal(ids("oneloop:").length, 3);
  for (const m of spec.marks.filter((x) => x.type === "line" && x.id?.startsWith("twoloop:"))) assert.ok(m.width <= 1.5 || m.focal, "ordinary lines are 1 to 1.5 px");
});

test("one focal line (the selected coupling), drawn at the focal width, in categorical colours and no pigment", () => {
  const spec = couplingRunSpec({ ...base, layers: [SM] });
  const focal = spec.marks.filter((m) => m.focal);
  assert.equal(focal.length, 1);
  assert.equal(focal[0].id, "twoloop:a3");
  const scene = sceneOf(spec);
  const widths = scene.prims.filter((p) => p.k === "line" && p.role === "data" && p.mark === spec.marks.indexOf(focal[0]));
  assert.ok(widths.every((p) => p.w >= 1.5 && p.w <= 2.6));
  const colours = new Set(spec.marks.map((m) => m.color));
  for (const c of colours) assert.ok(!c.startsWith("pigment-"), `${c} is not a pigment`);
  assert.deepEqual(["twoloop:a1", "twoloop:a2", "twoloop:a3"].map((id) => spec.marks.find((m) => m.id === id).color), ["cat-1", "cat-2", "cat-3"]);
});

test("a figure's provenance id follows its status: the MSSM view is registered as conjectural", () => {
  const sm = couplingRunSpec({ ...base, layers: [SM] }), ms = couplingRunSpec({ ...base, layers: [MSSM], mSusyLog: 3, status: "conjectural" });
  assert.equal(sm.provenanceId, "rg-unification-couplings");
  assert.equal(ms.provenanceId, "rg-unification-couplings-mssm");
  assert.equal(triangleSpec({ layer: MSSM, triangle: unificationTriangle(MSSM.twoLoop), status: "conjectural" }).provenanceId, "rg-unification-triangle-mssm");
});

test("the one-loop toggle removes exactly the dashed lines", () => {
  const spec = couplingRunSpec({ ...base, layers: [SM], showOneLoop: false });
  assert.equal(spec.marks.filter((m) => m.id?.startsWith("oneloop:")).length, 0);
  assert.equal(spec.marks.filter((m) => m.id?.startsWith("twoloop:")).length, 3);
});

test("the region marks: the Planck mass rule, the GUT region, the selected scale; M_SUSY only with the MSSM", () => {
  const sm = couplingRunSpec({ ...base, layers: [SM] });
  assert.ok(sm.marks.find((m) => m.id === "planck" && m.type === "rule"));
  const gut = sm.marks.find((m) => m.id === "gut");
  assert.equal(gut.type, "region");
  assert.equal(gut.style, "hatch");
  assert.ok(/schematic/i.test(gut.text.plain), "the GUT region says it is schematic");
  assert.equal(sm.marks.find((m) => m.id === "scale").value, 10);
  assert.ok(!sm.marks.some((m) => m.id === "susy"));
  const ms = couplingRunSpec({ ...base, layers: [MSSM], mSusyLog: 3, status: "conjectural" });
  const susy = ms.marks.find((m) => m.id === "susy");
  assert.equal(susy.value, 3);
  assert.ok(/conjectural/i.test(susy.text.plain), "the MSSM threshold is labelled conjectural in the canvas");
  assert.equal(ms.status, "conjectural");
});

test("a cross-fade draws both models, the outgoing one without lens ids and at its own opacity", () => {
  const spec = couplingRunSpec({ ...base, layers: [{ ...SM, primary: false, opacity: 0.4 }, { ...MSSM, opacity: 0.6 }], mSusyLog: 3, status: "conjectural" });
  const lines = spec.marks.filter((m) => m.type === "line");
  assert.equal(lines.filter((m) => m.id?.startsWith("twoloop:")).length, 3, "only the primary layer carries the lens ids");
  assert.ok(lines.some((m) => m.id === null && Math.abs(m.alpha - 0.4) < 1e-9));
  assert.ok(lines.some((m) => m.id?.startsWith("twoloop:") && Math.abs(m.alpha - 0.6) < 1e-9));
  const hidden = couplingRunSpec({ ...base, layers: [{ ...SM, primary: false, opacity: 0 }, MSSM], mSusyLog: 3, status: "conjectural" });
  assert.equal(hidden.marks.filter((m) => m.type === "line" && m.id === null).length, 0, "a layer at opacity 0 is not drawn");
});

test("the coupling plot renders at phone and desktop width with a legend, inside the plot, and as valid SVG", () => {
  const spec = couplingRunSpec({ ...base, layers: [SM] });
  for (const width of [340, 760]) {
    const scene = sceneOf(spec, width);
    assert.ok(scene.plot.w > 120 && scene.plot.h > 120, `plot ${scene.plot.w} x ${scene.plot.h} at ${width}`);
    assert.ok(scene.legend.length >= 4);
    for (const t of scene.texts.filter((x) => ["rule", "region", "callout"].includes(x.role))) {
      assert.ok(t.x >= scene.plot.x - 1 && t.x <= scene.plot.x + scene.plot.w + 1, `${t.text} at ${width}`);
    }
  }
  const scene = sceneOf(spec);
  parseXml(renderSvg(scene, spec, { fonts }));
  assert.match(figureSummary(spec), /alpha|coupling/i);
  assert.ok(dataTable(spec).rows.length > 0);
});

test("the triangle detail: the triangle is the one focal line, its vertices are marked and its area is labelled", () => {
  const triangle = unificationTriangle(SM.twoLoop);
  const spec = triangleSpec({ layer: SM, triangle, focusIndex: 2, status: "effective" });
  const focal = spec.marks.filter((m) => m.focal);
  assert.equal(focal.length, 1);
  assert.equal(focal[0].id, "triangle");
  assert.equal(focal[0].x.length, 4, "three vertices and the closing point");
  assert.equal(focal[0].x[0], focal[0].x[3]);
  assert.equal(spec.marks.find((m) => m.id === "vertices").x.length, 3);
  assert.match(focal[0].label.plain, /A ?= ?5\.47.*dex/, "the area is the triangle's own legend entry, where it cannot sit on a line");
  assert.ok(!spec.marks.some((m) => m.type === "callout"), "no callout: in a small triangle every position sits on a line");
  const [x0, x1] = spec.x.scale.domain, [y0, y1] = spec.y.scale.domain;
  for (const v of triangle.vertices) assert.ok(v.log10Mu > x0 && v.log10Mu < x1 && v.inv > y0 && v.inv < y1, "every vertex is inside the window");
  assert.ok(x1 - x0 < 8, "the window is a magnification of the crossing region");
  const mssm = triangleSpec({ layer: MSSM, triangle: unificationTriangle(MSSM.twoLoop), focusIndex: 2, status: "conjectural" });
  assert.ok(mssm.x.scale.domain[1] - mssm.x.scale.domain[0] < 1.5, "the MSSM triangle is far smaller, so the window is too");
  parseXml(renderSvg(sceneOf(spec, 420), spec, { fonts }));
  assert.ok(ALPHA_EM_INVERSE_MZ.value > 127);
});

test("both figures have registered provenance with data, model and decoration-free layer classes and a reference with an identifier", () => {
  const ids = ["rg-unification-couplings", "rg-unification-triangle", "rg-unification-couplings-mssm", "rg-unification-triangle-mssm"];
  for (const id of ids) {
    const p = getVisualizationProvenance(id);
    assert.ok(p, `${id} is registered`);
    assert.equal(p.status, id.endsWith("-mssm") ? "conjectural" : "effective", `${id}: the registered status is the one the caption must carry`);
    assert.ok(p.layers.length >= 1 && p.layers.every((l) => ["data", "model", "decoration"].includes(l.class)));
    assert.ok(p.layers.some((l) => l.class === "data"), `${id} lists its data layer`);
    assert.ok(p.references.some(hasReferenceIdentifier));
    assert.ok(/MSSM/.test(p.assumptions.join(" ")), `${id} states the MSSM scope`);
    assert.ok(/Yukawa/i.test(p.assumptions.join(" ")), `${id} states the omitted Yukawa terms`);
  }
});
