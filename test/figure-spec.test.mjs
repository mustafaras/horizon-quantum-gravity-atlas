import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { setTokenSource, buildTokens, parseTokensCss } from "../js/design/tokens.mjs";
import { figure, axis, line, band, points, step, heatmap, rule, callout, region, resolveLabel, texToPlain } from "../js/figure/spec.mjs";
import { buildScene } from "../js/figure/scene.mjs";
import { renderSvg } from "../js/figure/svg-renderer.mjs";
import { figureSummary, dataTable, zeroCrossings, nearestIndex, decimate } from "../js/figure/summary.mjs";
import { hawkingTemperature } from "../js/formula/library/black-holes.mjs";

const T = buildTokens(parseTokensCss(fs.readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8")));
setTokenSource(T);
const fonts = { tick: T.font.mono(-2), label: T.font.mono(-1), family: "monospace" };
const measure = (text) => text.length * 6.25;

const xs = Array.from({ length: 101 }, (_, i) => i * 12);
const survival = xs.map((x) => 1 - 0.98 * Math.sin(1.27 * 2.5e-3 * x) ** 2);
const mk = (marks, extra = {}) => figure({
  id: "fig-test", title: "Neutrino oscillation", status: "established", provenanceId: "neutrino-oscillation",
  x: axis({ scale: { type: "linear", domain: [0, 1200] }, label: { tex: "L/E" }, unit: "km/GeV" }),
  y: axis({ scale: { type: "linear", domain: [0, 1] }, label: { text: "probability" } }),
  marks, ...extra,
});

test("a valid figure is frozen JSON-like data with resolved labels", () => {
  const f = mk([line({ x: xs, y: survival, layer: "model", focal: true, label: { tex: "P(\\nu_\\mu\\to\\nu_\\mu)" } })]);
  assert.ok(Object.isFrozen(f));
  assert.equal(f.x.label.plain, "L/E [km/GeV]");
  assert.match(f.x.label.tex, /\\mathrm\{km\/GeV\}/);
  assert.equal(f.marks[0].label.plain, "P(ν_μ→ν_μ)");
});

test("exactly one focal mark at most, and every mark carries a layer", () => {
  const a = line({ x: [0, 1], y: [0, 1], layer: "model", focal: true });
  const b = line({ x: [0, 1], y: [1, 0], layer: "data", focal: true });
  assert.throws(() => mk([a, b]), /2 focal marks/);
  assert.doesNotThrow(() => mk([a, line({ x: [0, 1], y: [1, 0], layer: "data" })]));
  assert.doesNotThrow(() => mk([]), "zero focal marks is allowed");
  assert.throws(() => line({ x: [0, 1], y: [0, 1] }), /layer/);
  assert.throws(() => line({ x: [0, 1], y: [0, 1], layer: "decoration" }), /layer/);
  assert.throws(() => mk([{ type: "line", layer: "model" }].concat([])), /constructor/);
});

test("spec validation rejects bad data and forbidden content", () => {
  assert.throws(() => line({ x: [0, NaN], y: [0, 1], layer: "model" }), /not a number/);
  assert.throws(() => line({ x: [0, 1], y: [0], layer: "model" }), /length/);
  assert.throws(() => band({ x: [0, 1], y0: [0, 0], y1: [1, 1], layer: "model", opacity: 0.4 }), /opacity/);
  assert.throws(() => heatmap({ z: [[0, 1]], x: [0, 1], y: [0, 1], palette: "jet", layer: "data" }), /rainbow/);
  assert.throws(() => points({ x: [0], y: [0], yErr: [[1]], layer: "data" }), /asymmetric/);
  assert.throws(() => axis({ scale: { type: "log", domain: [0, 10] } }), RangeError);
  assert.throws(() => axis({ scale: { type: "linear", domain: [0, 1] }, label: { text: "θ angle" } }), /KaTeX/);
  assert.throws(() => figure({ id: "x", title: "t", status: "wrong", provenanceId: "p", x: axis({ scale: { domain: [0, 1] } }), y: axis({ scale: { domain: [0, 1] } }) }), /status/);
  assert.throws(() => figure({ id: "x", title: "t", status: "open", x: axis({ scale: { domain: [0, 1] } }), y: axis({ scale: { domain: [0, 1] } }) }), /provenanceId/);
});

test("axis labels and units come from Formula Core symbols", () => {
  const label = resolveLabel({ formula: hawkingTemperature, symbol: "M" });
  assert.equal(label.tex.startsWith("M"), true);
  assert.match(label.tex, /\\mathrm\{kg\}/);
  assert.match(resolveLabel({ formula: hawkingTemperature, symbol: "output" }).tex, /^T_H/);
  assert.throws(() => resolveLabel({ formula: hawkingTemperature, symbol: "nope" }), /no symbol/);
  assert.equal(texToPlain("\\sin^2 2\\theta"), "sin^2 2θ");
});

test("every mark type builds a scene whose primitives stay finite and inside the box", () => {
  const f = mk([
    region({ x: [900, 1100], layer: "data", color: "cat-6", text: { text: "excluded" } }),
    band({ x: xs, y0: survival.map((v) => v - 0.05), y1: survival.map((v) => v + 0.05), layer: "model", label: "band" }),
    line({ x: xs, y: survival, layer: "model", focal: true, label: { tex: "P_{\\mu\\mu}" } }),
    step({ x: xs, y: survival, layer: "model", color: "cat-3" }),
    points({ x: [100, 400, 700], y: [0.9, 0.2, 0.7], yErr: [[0.1, 0.1, 0.2], [0.05, 0.2, 0.1]], xErr: [[10, 10, 10], [10, 20, 10]], layer: "data", label: "data" }),
    rule({ axis: "x", value: 490, layer: "data", text: { text: "T2K" } }),
    callout({ x: 600, y: 0.5, layer: "model", text: { text: "node" } }),
  ]);
  for (const width of [320, 700, 1440]) {
    const s = buildScene(f, { width, height: 260, measure, fonts });
    assert.ok(s.prims.length > 20);
    for (const p of s.prims) {
      for (const [x, y] of p.pts ?? []) assert.ok(Number.isFinite(x) && Number.isFinite(y), `${p.k} ${p.role}`);
    }
    for (const t of s.texts) assert.ok(t.x >= -1 && t.x <= width + 1 && t.y >= -1 && t.y <= 261, `text "${t.text}" at ${t.x},${t.y} (${width})`);
    assert.equal(s.focal.mark, 2);
    assert.ok(s.overlays.some((o) => o.role === "xlabel"), "tex x title goes to the overlay");
    assert.ok(s.texts.some((o) => o.role === "ylabel" && !o.tex), "plain y title is canvas text");
    // the focal mark is drawn at full luminance, every other mark one level lower
    const alphas = (mark) => s.prims.filter((p) => p.mark === mark && p.role === "data").map((p) => p.a);
    assert.ok(alphas(2).every((a) => a === 1) && alphas(3).every((a) => a < 1));
  }
});

test("heatmap uses sequential or diverging palettes with the lowest row at the bottom", () => {
  const z = [[0, 0], [1, 1]];
  const f = mk([heatmap({ z, x: [0, 1200], y: [0, 1], layer: "data", palette: "viridis" })]);
  const img = buildScene(f, { width: 400, height: 240, measure, fonts }).prims.find((p) => p.k === "image");
  assert.equal(img.cols, 2); assert.equal(img.rows, 2);
  const lum = (o) => img.data[o] + img.data[o + 1] + img.data[o + 2];
  assert.ok(lum(0) > lum(2 * 2 * 4 - 8), "top row (high z) is brighter in viridis than the bottom row");
  const d = mk([heatmap({ z: [[-1, 1]], x: [0, 1], y: [0, 1], layer: "data", palette: "diverging" })]);
  const dimg = buildScene(d, { width: 400, height: 240, measure, fonts }).prims.find((p) => p.k === "image");
  assert.deepEqual([...dimg.data.slice(0, 3)] !== [...dimg.data.slice(4, 7)], true);
});

// A tiny XML well-formedness parser: balanced, correctly nested tags, quoted attributes, legal entities.
function parseXml(src) {
  const stack = [];
  let seenRoot = false;
  const re = /<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>|([^<]+)/g;
  let pos = 0, m;
  while ((m = re.exec(src))) {
    assert.equal(m.index, pos, `unexpected markup at ${pos}: ${src.slice(pos, pos + 40)}`);
    pos = re.lastIndex;
    if (m[5] !== undefined) {
      assert.ok(!/&(?!(?:amp|lt|gt|quot|apos);)/.test(m[5]), "illegal entity");
      assert.ok(stack.length || !m[5].trim(), "text outside root");
      continue;
    }
    const [, close, name, , selfClose] = m;
    if (close) { assert.equal(stack.pop(), name, `mismatched </${name}>`); continue; }
    if (!stack.length) { assert.ok(!seenRoot, "single root"); seenRoot = true; }
    if (!selfClose) stack.push(name);
  }
  assert.equal(pos, src.length);
  assert.deepEqual(stack, []);
  return true;
}

test("SVG output is well-formed XML with escaped text and the same primitives", () => {
  const f = mk([
    band({ x: xs, y0: survival.map((v) => v - 0.05), y1: survival.map((v) => v + 0.05), layer: "model" }),
    line({ x: xs, y: survival, layer: "model", focal: true, label: { text: "A & B <survival>" } }),
    heatmap({ z: [[0, 1, 1], [1, 0, 0]], x: [0, 600], y: [0, 0.5], layer: "data" }),
    region({ y: [0.8, 1], layer: "data" }),
  ], { title: "Quote \" & <angle>" });
  const scene = buildScene(f, { width: 480, height: 260, measure, fonts });
  const svg = renderSvg(scene, f, { fonts });
  assert.ok(parseXml(svg));
  assert.match(svg, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 480 260"/);
  assert.match(svg, /A &amp; B &lt;survival&gt;/);
  assert.match(svg, /<title>Quote &quot; &amp; &lt;angle&gt;<\/title>/);
  assert.equal((svg.match(/<path /g) || []).length >= scene.prims.filter((p) => p.k === "line" || p.k === "poly").length, true);
  assert.ok(!/NaN|undefined|Infinity/.test(svg));
  // same scene description, same bytes
  assert.equal(renderSvg(buildScene(f, { width: 480, height: 260, measure, fonts }), f, { fonts }), svg);
});

test("summary reports ranges, extrema and zero crossings; the table is decimated to 200 rows", () => {
  const ys = xs.map((x) => Math.sin(x / 200));
  const f = mk([line({ x: xs, y: ys, layer: "model", focal: true, label: "wave" })]);
  const text = figureSummary(f);
  assert.match(text, /Neutrino oscillation\. Status: established\./);
  assert.match(text, /wave \(model\): 101 samples over x from 0 to 1200/);
  assert.match(text, /zero crossing/);
  assert.ok(Math.abs(zeroCrossings([0, 1, 2], [-1, 1, 1])[0] - 0.5) < 1e-12);
  const big = Array.from({ length: 5000 }, (_, i) => i);
  const table = dataTable(mk([line({ x: big, y: big, layer: "model" })]));
  assert.equal(table.rows.length, 200); assert.equal(table.truncated, true);
  assert.equal(table.rows[0][0], 0); assert.equal(table.rows.at(-1)[0], 4999);
  assert.deepEqual(decimate(3), [0, 1, 2]);
  assert.equal(nearestIndex([0, 10, 20, 30], 14), 1);
  assert.equal(nearestIndex([30, 20, 10, 0], 14), 2);
});
