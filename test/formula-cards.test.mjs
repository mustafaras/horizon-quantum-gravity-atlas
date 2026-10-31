// formula-cards.test.mjs — the migration contract of S30, asserted instead of eyeballed.
//
// The risk this file exists for: js/core.jsx composes a card's equation from the definition and **discards the `tex`
// prop** when a `formulaId` resolves. A migration pointed at the wrong formula therefore renders a correct-looking card
// with the wrong equation, and no existing test would notice. (Starter §4.2.)
//
// So every card is checked three ways, over the source itself:
//
//   1. a card with a `formulaId` renders exactly the mathematics its `tex` prop says, and that definition exists;
//   2. the rendered mathematics is compared as KaTeX's glyph tree, not as a string, so the spacing differences the
//      contract allows are allowed and a changed symbol is not;
//   3. no card is left without a definition, which is what the audit script also enforces at `npm run validate`.

import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readdirSync, readFileSync } from "node:fs";

import { library } from "../js/formula/library/index.mjs";
import { cardTex, topLevel } from "../js/formula/library/equations.mjs";
import { toTeX, KATEX_OPTIONS } from "../js/formula/to-tex.mjs";

const root = new URL("../js/", import.meta.url);
const sandbox = { module: { exports: {} }, exports: {} };
vm.runInNewContext(readFileSync(new URL("../vendor/katex/katex.min.js", import.meta.url), "utf8"), sandbox);
const katex = sandbox.module.exports;

/**
 * KaTeX's glyph tree: the MathML with the source annotation removed, spacing-only nodes dropped, and `<mrow>` grouping
 * flattened. `\htmlData{term=x}{a + b}` wraps its body in an `<mrow>`, which is a grouping node with no glyph of its own,
 * so flattening it makes the addressable and the plain spellings comparable. Every operator, symbol, exponent and
 * delimiter is its own element and survives; a changed symbol or sign changes the tree.
 */
function glyphs(tex) {
  const html = katex.renderToString(tex, { ...KATEX_OPTIONS, throwOnError: true, output: "mathml" });
  return html
    .replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, "")
    .replace(/<mspace[^>]*\/>/g, "")
    .replace(/<mtext>\s*<\/mtext>/g, "")
    .replace(/<\/?mrow>/g, "")
    .replace(/\s+/g, "");
}

/** Every FormulaCard element in js/, with the attributes the card reads. Attribute strings are JSX literals: no escapes. */
function cards() {
  const files = [];
  for (const dir of ["", "labs/"]) {
    for (const name of readdirSync(new URL(dir, root))) if (name.endsWith(".jsx")) files.push(`${dir}${name}`);
  }
  const found = [];
  for (const file of files) {
    const source = readFileSync(new URL(file, root), "utf8");
    for (const match of source.matchAll(/<FormulaCard\b/g)) {
      const close = source.indexOf("</FormulaCard>", match.index);
      const selfClose = source.indexOf("/>", match.index);
      const stop = close >= 0 && (selfClose < 0 || close < selfClose) ? close : selfClose + 2;
      const block = source.slice(match.index, stop);
      const attr = (name) => {
        const braced = new RegExp(`\\b${name}=\\{("(?:[^"\\\\]|\\\\.)*")\\}`).exec(block);
        if (braced) return JSON.parse(braced[1]);
        const plain = new RegExp(`\\b${name}="([^"]*)"`).exec(block);
        return plain ? plain[1] : null;
      };
      found.push({
        file,
        line: source.slice(0, match.index).split("\n").length,
        title: attr("title"),
        tex: attr("tex"),
        formulaId: attr("formulaId"),
        texAfter: attr("texAfter"),
      });
    }
  }
  return found;
}

const ALL = cards();
const byId = new Map(Object.values(library).map((f) => [f.id, f]));

test("the comparison is sensitive to a changed symbol and insensitive to a changed space", () => {
  // Without this, a normalisation that flattened too much would make the fidelity tests above vacuous. The spacing
  // allowance is the contract's ("small spacing differences allowed and justified"); the rest are not allowed at all.
  const base = "T_H = \\frac{\\hbar c^3}{8\\pi G M k_B}";
  assert.equal(glyphs("T_H = \\frac{\\hbar\\, c^3}{8\\pi G M k_B}"), glyphs(base), "a thin space is not a different equation");
  for (const wrong of [
    "T_H = \\frac{\\hbar c^4}{8\\pi G M k_B}",
    "T_H = \\frac{\\hbar c^3}{4\\pi G M k_B}",
    "T_H = \\frac{\\hbar c^3}{8\\pi g M k_B}",
    "T_H = \\frac{\\hbar c^3}{8\\pi G M}",
    "T_H - \\frac{\\hbar c^3}{8\\pi G M k_B}",
  ]) assert.notEqual(glyphs(wrong), glyphs(base), wrong);
});

test("the atlas has the cards this file was written against", () => {
  assert.ok(ALL.length >= 65, `${ALL.length} FormulaCards found`);
});

test("every card names a definition that exists", () => {
  const missing = ALL.filter((c) => c.formulaId && !byId.has(c.formulaId));
  assert.deepEqual(missing.map((c) => `${c.file}:${c.line} ${c.title} -> ${c.formulaId}`), []);
});

test("no card is left without a definition", () => {
  const unmigrated = ALL.filter((c) => !c.formulaId).map((c) => `${c.file}:${c.line} ${c.title}`);
  assert.deepEqual(unmigrated, [], `${unmigrated.length} cards still render a tex prop`);
});

test("no card still passes a tex prop beside its formulaId", () => {
  // Once a card has a formulaId, js/core.jsx ignores the tex prop entirely. Keeping one around is worse than useless: it
  // looks authoritative and is dead. This asserts the migration removed every one of the 48.
  const both = ALL.filter((c) => c.formulaId && c.tex !== null);
  assert.deepEqual(both.map((c) => `${c.file}:${c.line} ${c.title}`), []);
  assert.equal(ALL.filter((c) => c.tex !== null).length, 0, "48 cards carried a tex prop before this prompt");
});

/**
 * The string a card rendered before S30, from the reference file committed with this test. Comparing against the
 * committed reference rather than against the live card is the point: the live card no longer carries the string, so a
 * migration that changed a symbol would have nothing to catch it otherwise.
 */
// The reference recorded by the migration, with the paths made relative to js/ so they compare with the live scan.
const BEFORE = JSON.parse(readFileSync(new URL("./fixtures/formula-cards-before.json", import.meta.url), "utf8"))
  .map((c) => ({ ...c, file: c.file.replace(/^js\//, "") }));

test("every definition a card points at reproduces the card's pre-migration TeX character for character", () => {
  // Structural equations were generated by splitting the card's own string at the printer's separators, so removing the
  // \htmlData wrappers must give the original back byte for byte. This catches a mistyped LaTeX command that still parses.
  const unwrap = (s) => {
    let out = "", i = 0;
    while (i < s.length) {
      if (s.startsWith("\\htmlData{", i)) {
        const headEnd = s.indexOf("}", i);
        const bodyStart = headEnd + 2;
        let depth = 1, j = bodyStart;
        while (j < s.length && depth > 0) {
          if (s[j] === "\\") { j += 2; continue; }
          if (s[j] === "{") depth += 1;
          else if (s[j] === "}") depth -= 1;
          j += 1;
        }
        out += unwrap(s.slice(bodyStart, j - 1));
        i = j;
      } else { out += s[i]; i += 1; }
    }
    return out;
  };
  const before = new Map(BEFORE.map((c) => [`${c.file}:${c.title}`, c]));
  const wrong = [];
  let checked = 0;
  for (const card of ALL) {
    const formula = byId.get(card.formulaId);
    const recorded = before.get(`${card.file}:${card.title}`);
    if (!formula || !recorded || recorded.tex === null) continue;
    const expected = recorded.tex + (recorded.texAfter ?? "");
    const rendered = cardTex(formula, recorded.texAfter ?? "");
    if (unwrap(rendered) !== expected) wrong.push(`${card.file} ${card.title}\n    rendered: ${unwrap(rendered)}\n    expected: ${expected}`);
    checked += 1;
  }
  assert.equal(checked, 48, `${checked} cards compared against the committed pre-migration reference`);
  assert.deepEqual(wrong, []);
});

test("every pre-migration TeX string still compiles, and the definition renders the same mathematics", () => {
  // The committed reference is the record of what the page used to draw. Each definition must draw the same glyph tree,
  // so the 48 screenshots the contract asks for are replaced by 48 comparisons.
  const before = new Map(BEFORE.map((c) => [`${c.file}:${c.title}`, c]));
  const wrong = [];
  let checked = 0;
  for (const card of ALL) {
    const recorded = before.get(`${card.file}:${card.title}`);
    if (!recorded || recorded.tex === null) continue;
    assert.doesNotThrow(() => katex.renderToString(recorded.tex, { ...KATEX_OPTIONS, throwOnError: true }), `${card.title}: the old string does not compile`);
    const formula = byId.get(card.formulaId);
    if (!formula) { wrong.push(`${card.file} ${card.title}: no definition`); continue; }
    if (glyphs(cardTex(formula, recorded.texAfter ?? "")) !== glyphs(recorded.tex + (recorded.texAfter ?? ""))) {
      wrong.push(`${card.file} ${card.title}: ${cardTex(formula, recorded.texAfter ?? "")}`);
    }
    checked += 1;
  }
  assert.equal(checked, 48);
  assert.deepEqual(wrong, []);
});

test("every definition a card points at declares addressable terms, so the lens has something to focus", () => {
  for (const card of ALL) {
    const formula = byId.get(card.formulaId);
    if (!formula) continue;
    assert.ok(formula.termIds.length >= 1, `${card.title} (${formula.id}) exposes no term`);
    assert.match(formula.tex, /\\htmlData\{term=/, `${card.title} (${formula.id}) typesets no \htmlData term`);
  }
});

test("the one card that appends TeX still appends it, and the definition does not absorb it", () => {
  // mod-planck's Planck card carries a texAfter naming t_P, m_P and E_P. The definition is the Planck length; the card
  // appends the rest. Keeping them apart is what lets the lens focus the single term the definition owns.
  const withAfter = ALL.filter((c) => c.texAfter);
  assert.equal(withAfter.length, 1, `${withAfter.length} cards append TeX`);
  const card = withAfter[0];
  const formula = byId.get(card.formulaId);
  assert.equal(formula.id, "planck-length");
  const base = cardTex(formula);
  assert.ok(!glyphs(base).includes(glyphs(card.texAfter)), "the appended TeX is already in the definition");
  assert.doesNotThrow(() => glyphs(cardTex(formula, card.texAfter)), "texAfter does not compile with the definition");
});

test("a definition's left-hand side is the pre-migration card's own left-hand side", () => {
  // equations.mjs splits at the first top-level " = ". A definition that names a left-hand side must agree with the
  // string the card used to render, or the migration silently moved the equals sign.
  const before = new Map(BEFORE.map((c) => [`${c.file}:${c.title}`, c]));
  for (const card of ALL) {
    const formula = byId.get(card.formulaId);
    const recorded = before.get(`${card.file}:${card.title}`);
    if (!formula || !recorded || recorded.tex === null) continue;
    const [firstEquals] = topLevel(recorded.tex, " = ");
    if (formula.output.tex !== "") {
      assert.notEqual(firstEquals, undefined, `${card.title}: the definition declares a left-hand side but the card has no top-level " = "`);
      assert.equal(recorded.tex.slice(0, firstEquals), formula.output.tex, `${card.title}: the declared left-hand side is not the card's`);
    } else {
      assert.equal(firstEquals, undefined, `${card.title}: the card has a top-level equals the definition does not declare`);
    }
  }
});
