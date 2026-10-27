// S13: every formula the Higgs lab shows is typeset by KaTeX. The lab source, the figure/view provenance entries and the 3-D scene
// labels are scanned: each $...$ segment and each tex="..." must compile under the shipped options with throwOnError, and the prose
// around the maths must not carry the ASCII spellings (lambda, sqrt, ^) that the typeset forms replaced.

import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { FIGURE_PROVENANCE } from "../js/figure/provenance.mjs";
import { VIEW_PROVENANCE } from "../js/science/view-provenance.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const sandbox = { module: { exports: {} }, exports: {} };
vm.runInNewContext(read("vendor/katex/katex.min.js"), sandbox);
const katex = sandbox.module.exports;
const OPTIONS = { throwOnError: true, trust: (ctx) => ctx.command === "\\htmlData", strict: "ignore" };

const ENTRY_IDS = ["sm-higgs-running", "sm-higgs-stability"];
const entries = [...ENTRY_IDS.map((id) => [id, FIGURE_PROVENANCE[id]]), ["sm-higgs-hat", VIEW_PROVENANCE["sm-higgs-hat"]]];

const strings = (entry) => [entry.model, ...entry.assumptions, ...entry.validity, entry.numericalMethod, ...entry.layers.map((l) => l.name)];
const segments = (text) => [...text.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]);
const outside = (text) => text.replace(/\$[^$]*\$/g, " ");

test("the Higgs provenance entries exist and each of their $...$ segments compiles in KaTeX", () => {
  for (const [id, entry] of entries) {
    assert.ok(entry, id);
    let count = 0;
    for (const text of strings(entry)) {
      for (const tex of segments(text)) {
        assert.doesNotThrow(() => katex.renderToString(tex, OPTIONS), `${id}: ${tex}`);
        count++;
      }
    }
    assert.ok(count >= 5, `${id} typesets its mathematics (${count} segments)`);
  }
});

test("the Higgs provenance prose carries no ASCII-spelt mathematics outside $...$", () => {
  const spelt = /\b(lambda|sqrt|alpha_s|sigma|phi|mu\^|M_Pl|m_t|m_H|y_t|sin\^2)\b|\^\d|_[a-zA-Z]\b/;
  for (const [id, entry] of entries) {
    for (const text of strings(entry)) assert.doesNotMatch(outside(text).replace(/qa\/specs\/[\w.-]+|js\/[\w./-]+/g, ""), spelt, `${id}: ${text.slice(0, 80)}`);
  }
});

test("every tex= and $...$ in the Higgs lab source compiles, and its card text keeps no unicode maths", () => {
  const source = read("js/labs/higgs-lab.jsx");
  const tex = [...source.matchAll(/tex="([^"]+)"/g)].map((m) => m[1]);
  // JS string literals inside the file double their backslashes; JSX attribute strings do not.
  const dollars = segments(source).map((s) => s.replace(/\\\\/g, "\\"));
  assert.ok(tex.length >= 20 && dollars.length >= 10);
  for (const t of [...tex, ...dollars]) assert.doesNotThrow(() => katex.renderToString(t, OPTIONS), t);
  const prose = outside(source.replace(/tex="[^"]*"/g, "").split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n"));
  assert.doesNotMatch(prose, /[α-ωΑ-Ω²³⁴⁻√]/, "no Greek letters, superscripts or radicals outside KaTeX");
});

test("the shared readout helper (core.jsx sciTex) writes a mantissa and a signed exponent as TeX", () => {
  const source = read("js/core.jsx");
  const body = source.match(/function sciTex[\s\S]*?\n}\n/)[0];
  const sciTex = new Function(`${body}; return sciTex;`)();
  assert.equal(sciTex(7.96e8, 2), "7.96\\times10^{8}");
  assert.equal(sciTex(1.2e-3, 1), "1.2\\times10^{-3}");
  assert.doesNotThrow(() => katex.renderToString(`${sciTex(1.2209e19, 2)}\\,\\mathrm{GeV}`, OPTIONS));
});

test("the 3-D scene labels are KaTeX sources that compile", () => {
  const source = read("js/visualizations/sm/mexican-hat.mjs");
  const labels = [...source.matchAll(/typeset\(\w+, "((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`));
  assert.equal(labels.length, 3);
  for (const t of labels) assert.doesNotThrow(() => katex.renderToString(t, OPTIONS), t);
});
