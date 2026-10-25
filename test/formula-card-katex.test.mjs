// Every FormulaCard in the atlas typesets its mathematics with KaTeX. The card's own equation is TeX already; this checks the
// prose around it: the symbol descriptions (d), the meaning and the limits may carry maths only as $...$, each segment must
// compile, each symbol (s) must be TeX, and no Greek letter, superscript, subscript or radical may stand outside a $...$.

import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readdirSync, readFileSync } from "node:fs";

const root = new URL("../js/", import.meta.url);
const sandbox = { module: { exports: {} }, exports: {} };
vm.runInNewContext(readFileSync(new URL("../vendor/katex/katex.min.js", import.meta.url), "utf8"), sandbox);
const katex = sandbox.module.exports;
const OPTIONS = { throwOnError: true, trust: (ctx) => ctx.command === "\\htmlData", strict: "ignore" };

const MATH = /[α-ωΑ-Ω²³⁴⁵⁻⁺⁰¹√≈≤≥≠±×∂∇ℏ∫∑∞∼ₐₑₒₓₙₘₜ₀₁₂₃ᵢⱼ]|\b[A-Za-z]_\{?[A-Za-z0-9]|\^\{?[-\d]|\b(?:hbar|sqrt|lambda|sigma|alpha|beta|gamma|delta|theta|omega)\b/;
const outside = (text) => text.replace(/\$[^$]*\$/g, " ");

function sources() {
  const files = [];
  for (const dir of ["", "labs/"]) {
    for (const name of readdirSync(new URL(dir, root))) if (name.endsWith(".jsx")) files.push(`${dir}${name}`);
  }
  return files;
}

/** Every FormulaCard block of a file with its prose fields and symbols, JS escapes undone for string-literal fields. */
function cards(file) {
  const source = readFileSync(new URL(file, root), "utf8");
  const found = [];
  for (const match of source.matchAll(/<FormulaCard\b/g)) {
    const block = source.slice(match.index, source.indexOf("</FormulaCard>", match.index));
    const title = /title="([^"]*)"/.exec(block)?.[1] ?? "?";
    const fields = [];
    for (const key of ["meaning", "limits"]) {
      const m = new RegExp(`${key}=(?:"([^"]*)"|\\{"((?:[^"\\\\]|\\\\.)*)"\\})`).exec(block);
      if (m) fields.push([key, m[1] ?? JSON.parse(`"${m[2]}"`)]);
    }
    const equation = /<FormulaCard\b[^>]*?\btex="([^"]*)"/s.exec(block)?.[1] ?? null;
    const symbols = [];
    for (const m of block.matchAll(/\{\s*s:\s*"((?:[^"\\]|\\.)*)",\s*d:\s*"((?:[^"\\]|\\.)*)"/g)) {
      symbols.push(JSON.parse(`"${m[1]}"`));
      fields.push([`d[${JSON.parse(`"${m[1]}"`)}]`, JSON.parse(`"${m[2]}"`)]);
    }
    found.push({ file, title, fields, symbols, equation });
  }
  return found;
}

const all = sources().flatMap(cards);

test("the atlas has FormulaCards to check, with prose fields and symbols", () => {
  assert.ok(all.length >= 50, `${all.length} cards`);
  assert.ok(all.reduce((n, c) => n + c.fields.length, 0) >= 150);
});

test("no FormulaCard prose carries mathematics outside $...$", () => {
  const offenders = [];
  for (const card of all) {
    for (const [key, text] of card.fields) if (MATH.test(outside(text))) offenders.push(`${card.file} ${card.title} ${key}: ${text.slice(0, 70)}`);
  }
  assert.deepEqual(offenders, []);
});

test("every $...$ segment of a FormulaCard compiles in KaTeX and every symbol is TeX", () => {
  for (const card of all) {
    if (card.equation) assert.doesNotThrow(() => katex.renderToString(card.equation, OPTIONS), `${card.file} ${card.title} equation ${card.equation}`);
    for (const [key, text] of card.fields) {
      for (const [, tex] of text.matchAll(/\$([^$]+)\$/g)) {
        assert.doesNotThrow(() => katex.renderToString(tex, OPTIONS), `${card.file} ${card.title} ${key}: ${tex}`);
      }
    }
    for (const symbol of card.symbols) assert.doesNotThrow(() => katex.renderToString(symbol, OPTIONS), `${card.file} ${card.title} symbol ${symbol}`);
  }
});
