import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseCss, parseDeclarations, splitTop, colourLiterals, mapColourLiterals, stripComments } from "../scripts/lib/css-rules.mjs";
import { buildThemeSurfaces, themedSelector, linkedSheets, readSources, OUTPUT, GENERATED_THEMES } from "../scripts/build-theme-surfaces.mjs";
import { parseCssColor, relativeLuminance } from "../js/design/color.mjs";
import { themeColor, legibleText, textContrastOnPanel } from "../js/design/theme-pigments.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = buildThemeSurfaces(readSources(root));

// ---- the CSS reader ---------------------------------------------------------------------------------------------

test("the reader keeps rules, nests @media, skips @keyframes and @font-face, and ignores comments", () => {
  const nodes = parseCss(`
    /* a { color: red } */
    .a, .b > .c { color: #fff; background: rgba(1,2,3,.5) !important; }
    @media (max-width: 920px) { .d { color: #000 } @media print { .e { color: #111 } } }
    @keyframes k { from { color: #fff } to { color: #000 } }
    @font-face { font-family: X; src: url(a.woff2); }
    @import url("x.css");
  `);
  assert.deepEqual(nodes.map((n) => n.type), ["rule", "at"]);
  assert.deepEqual(nodes[0].selectors, [".a", ".b > .c"]);
  assert.deepEqual(nodes[0].declarations, [
    { prop: "color", value: "#fff", important: false },
    { prop: "background", value: "rgba(1,2,3,.5)", important: true },
  ]);
  assert.equal(nodes[1].prelude, "@media (max-width: 920px)");
  assert.equal(nodes[1].children[0].selectors[0], ".d");
  assert.equal(nodes[1].children[1].type, "at");
  assert.equal(stripComments("a/*x*/b"), "ab");
});

test("semicolons and commas inside strings and parentheses do not split", () => {
  assert.deepEqual(splitTop("a, :is(b, c), 'd,e'", ","), ["a", ":is(b, c)", "'d,e'"]);
  const decls = parseDeclarations("background: url(data:image/svg+xml;base64,AAA) no-repeat; content: 'a;b'; color: #fff");
  assert.deepEqual(decls.map((d) => d.prop), ["background", "content", "color"]);
  assert.throws(() => parseCss(".a { color: red"), /unbalanced/);
});

test("colour literals are found in order, never inside url(...), and mapped in place", () => {
  const value = "linear-gradient(180deg, rgba(8,12,21,0.86), #05080f) , url(#bead) , #fff";
  assert.deepEqual(colourLiterals(value).map((l) => l.text), ["rgba(8,12,21,0.86)", "#05080f", "#fff"]);
  assert.equal(mapColourLiterals(value, (l) => `<${l}>`), "linear-gradient(180deg, <rgba(8,12,21,0.86)>, <#05080f>) , url(#bead) , <#fff>");
  assert.deepEqual(colourLiterals("var(--x, #abcd)").map((l) => l.text), ["#abcd"]);
  assert.deepEqual(colourLiterals("0 0 0 1px var(--accent)"), []);
});

test("a selector moves under the theme root: html and :root merge, everything else sits below", () => {
  assert.equal(themedSelector(".a .b", "print"), ':root[data-theme="print"] .a .b');
  assert.equal(themedSelector("body", "print"), ':root[data-theme="print"] body');
  assert.equal(themedSelector('html[data-motion="reduced"] .x', "blueprint"), ':root[data-theme="blueprint"][data-motion="reduced"] .x');
  assert.equal(themedSelector(":root", "print"), ':root[data-theme="print"]');
  assert.equal(themedSelector("htmlish .x", "print"), ':root[data-theme="print"] htmlish .x');
});

test("linkedSheets reads index.html in cascade order and leaves the tokens and the themes out", () => {
  const html = '<link rel="stylesheet" href="vendor/x.css"><link rel="stylesheet" href="styles/tokens.css"><link rel="stylesheet" href="styles/themes/print.css"><link rel="stylesheet" href="styles/base.css"><link rel="stylesheet" href="styles/modules/gw.css">';
  assert.deepEqual(linkedSheets(html), ["styles/base.css", "styles/modules/gw.css"]);
});

// ---- the generated stylesheets ------------------------------------------------------------------------------------

test("the committed stylesheets are exactly what the generator produces from the sources", () => {
  for (const theme of GENERATED_THEMES) {
    const committed = fs.readFileSync(path.join(root, OUTPUT[theme]), "utf8");
    assert.equal(committed, built[theme].css, `${OUTPUT[theme]} is stale: run npm run build:themes`);
  }
});

test("every colour literal is understood: none is left unmapped, and the count matches an independent scan of the sources", () => {
  const sources = readSources(root);
  const independent = sources.reduce((total, { css }) => {
    let n = 0;
    const walk = (nodes) => nodes.forEach((node) => {
      if (node.type === "at") return walk(node.children);
      node.declarations.forEach(({ prop, value }) => { if (!["box-shadow", "text-shadow", "filter", "backdrop-filter", "-webkit-backdrop-filter"].includes(prop)) n += colourLiterals(value).length; });
    });
    walk(parseCss(css));
    return total + n;
  }, 0);
  for (const theme of GENERATED_THEMES) {
    assert.deepEqual(built[theme].stats.unmapped, []);
    // The page background of html and body is owned by the theme files, so those literals are the only ones not restated.
    assert.ok(built[theme].stats.literals <= independent && independent - built[theme].stats.literals <= 12, `${theme}: ${built[theme].stats.literals} of ${independent}`);
    assert.ok(built[theme].stats.literals >= 450, `${theme}: only ${built[theme].stats.literals} literals mapped`);
  }
});

test("nothing in a generated file applies to Observatory: every selector sits under its own theme root", () => {
  for (const theme of GENERATED_THEMES) {
    const selectors = themedRules(theme).flatMap((rule) => rule.selectors);
    assert.ok(selectors.length > 300);
    for (const s of selectors) assert.ok(s.startsWith(`:root[data-theme="${theme}"]`), `${theme}: "${s}" is not under the theme root`);
    assert.ok(built[theme].css.split("\n").length <= 600, `${theme}: the sheet must stay within 600 lines`);
  }
});

function themedRules(theme) {
  const out = [];
  const walk = (nodes) => nodes.forEach((n) => (n.type === "at" ? walk(n.children) : out.push(n)));
  walk(parseCss(built[theme].css));
  return out;
}

/** `{ L, alpha }` of the first oklch() literal in a value, or null. */
function firstColour(value) {
  const m = /oklch\([^()]*\)/.exec(value);
  if (!m) return null;
  const c = parseCssColor(m[0]);
  return { L: relativeLuminance(c.linear), alpha: c.alpha };
}

// A rule that sets pale text must sit on a dark fill (and the reverse on Blueprint's dark surface). The mapping inverts
// text and fill together, so the pair survives; a rule whose fill is a token (not a literal) shows no fill here, and
// each such rule is named below with the reason it is right.
const TOKEN_FILL = new Set([".skip-link"]); // fill: var(--accent): dark blue on paper, pale blue on Blueprint; text is mapped to match

test("Print has no pale text on a light panel and no dark panel with dark text: text and fill are mapped as a pair", () => {
  const rules = themedRules("print");
  let panels = 0, texts = 0;
  for (const rule of rules) {
    const color = rule.declarations.find((d) => d.prop === "color");
    const fill = rule.declarations.find((d) => /^background/.test(d.prop));
    const t = color && firstColour(color.value);
    const b = fill && firstColour(fill.value);
    if (b && b.alpha >= 0.5) panels++;
    if (!t || t.alpha < 0.6) continue;
    texts++;
    const paleText = t.L > 0.45;
    const darkFill = b && b.alpha >= 0.5 && b.L < 0.45;
    const name = rule.selectors[0].replace(/^:root\[data-theme="print"\] /, "");
    if (paleText) assert.ok(darkFill || TOKEN_FILL.has(name), `Print: ${name} has pale text ${color.value} without a dark fill`);
    if (b && b.alpha >= 0.5 && b.L < 0.02 && !/gradient/.test(fill.value)) assert.fail(`Print: ${name} keeps a near-black fill ${fill.value}`);
  }
  assert.ok(panels > 80 && texts > 80, `expected the sweep to cover many panels and texts, saw ${panels} and ${texts}`);
});

test("Blueprint keeps text legible on its Prussian surface: dim text only on a light fill", () => {
  const surface = relativeLuminance(parseCssColor("#002b4a").linear);
  let texts = 0;
  for (const rule of themedRules("blueprint")) {
    const color = rule.declarations.find((d) => d.prop === "color");
    const fill = rule.declarations.find((d) => /^background/.test(d.prop));
    const t = color && firstColour(color.value);
    if (!t || t.alpha < 0.6) continue;
    texts++;
    const b = fill && firstColour(fill.value);
    const name = rule.selectors[0].replace(/^:root\[data-theme="blueprint"\] /, "");
    if (t.L < surface * 3) assert.ok((b && b.alpha >= 0.5 && b.L > 0.1) || TOKEN_FILL.has(name), `Blueprint: ${name} has dim text ${color.value} without a light fill`);
  }
  assert.ok(texts > 80, `expected many text rules, saw ${texts}`);
});

test("every text colour drawn on the panel clears 4.5:1 on the panel the theme produces, and the sources' oklch colours are mapped too", () => {
  for (const theme of GENERATED_THEMES) {
    let checked = 0;
    for (const rule of themedRules(theme)) {
      const color = rule.declarations.find((d) => d.prop === "color");
      if (!color || rule.declarations.some((d) => /^background/.test(d.prop))) continue;
      if (TOKEN_FILL.has(rule.selectors[0].replace(/^:root\[data-theme="[a-z]+"\] /, ""))) continue; // its fill is a token, so the pair is mapped, not clamped
      const literal = /^oklch\([^()]*\)$/.exec(color.value.trim());
      if (!literal) continue;
      checked++;
      const ratio = textContrastOnPanel(literal[0], theme);
      assert.ok(ratio >= 4.5, `${theme}: ${rule.selectors[0]} text ${color.value} is ${ratio.toFixed(2)}:1 on the panel`);
    }
    assert.ok(checked > 60, `${theme}: only ${checked} panel text colours were checked`);
  }
  // The badges name their colours in oklch(); before the reader understood that, Print kept them pale on light panels.
  const badge = themedRules("print").find((r) => r.selectors[0].endsWith(".badge-established"));
  assert.ok(badge, "the established badge is restated under Print");
  assert.notEqual(badge.declarations.find((d) => d.prop === "color").value, "oklch(0.78 0.1 160)");
});

test("a background shorthand restated in a theme keeps the longhands the source sets after it (a gradient clipped to text)", () => {
  const css = ".brand { background: linear-gradient(90deg, #05080f, #ffffff); -webkit-background-clip: text; background-clip: text; color: transparent; }\n.plain { background: #05080f; background-size: cover; }\n.early { background-size: cover; background: #05080f; }";
  for (const theme of GENERATED_THEMES) {
    const out = buildThemeSurfaces([{ file: "x.css", css }])[theme].css;
    const brand = out.split("\n").find((l) => l.includes(".brand"));
    assert.match(brand, /background: linear-gradient\(90deg, oklch\(/);
    assert.match(brand, /-webkit-background-clip: text !important;/);
    assert.match(brand, /(?<!-webkit-)background-clip: text !important;/);
    assert.ok(!/color: transparent/.test(brand), "a declaration without a colour literal is not restated unless it is a background longhand");
    assert.match(out.split("\n").find((l) => l.includes(".plain")), /background-size: cover !important;/);
    assert.ok(!/background-size/.test(out.split("\n").find((l) => l.includes(".early"))), "a longhand written before the shorthand was reset by it in the source too");
  }
});

test("legibleText leaves a colour that already clears the target, and otherwise opaques then darkens (Print) or lightens (Blueprint)", () => {
  assert.equal(legibleText("oklch(0.20 0.02 260)", "print"), "oklch(0.200 0.020 260.0)", "an ink that already clears the target is only reformatted");
  const faint = "oklch(0.75 0.03 260 / 0.5)";
  const printText = legibleText(faint, "print");
  assert.ok(textContrastOnPanel(printText, "print") >= 4.7, printText);
  const blueprintText = legibleText("oklch(0.55 0.03 250 / 0.4)", "blueprint");
  assert.ok(textContrastOnPanel(blueprintText, "blueprint") >= 4.7, blueprintText);
  assert.ok(parseCssColor(blueprintText).alpha > 0.4, "opacity is raised before lightness is touched");
  assert.equal(legibleText("not a colour", "print"), "not a colour");
  assert.equal(legibleText("oklch(0.5 0.1 100)", "observatory"), "oklch(0.5 0.1 100)", "Observatory has no panel to measure against");
  assert.ok(Number.isNaN(textContrastOnPanel("oklch(0.5 0.1 100)", "observatory")));
});

test("the generated colours are the same rule as scene pigments, with alpha kept", () => {
  assert.equal(themeColor("#05080f", "observatory"), "#05080f");
  assert.match(themeColor("rgba(148,176,224,0.72)", "print"), /^oklch\([\d.]+ [\d.]+ [\d.]+ \/ 0\.72\)$/);
  assert.match(themeColor("#fff", "print"), /^oklch\([\d.]+ [\d.]+ [\d.]+\)$/, "an opaque colour has no alpha tail");
  assert.equal(themeColor("not a colour", "print"), "not a colour");
});

test("shadows, filters and the page background are left to the theme files", () => {
  for (const theme of GENERATED_THEMES) {
    assert.ok(!/box-shadow|text-shadow|backdrop-filter/.test(built[theme].css), `${theme} must not restate shadows or filters`);
    assert.ok(!/:root\[data-theme="[a-z]+"\] (body|html)\s*\{[^}]*background/.test(built[theme].css), `${theme} must not restate the page background`);
  }
});
