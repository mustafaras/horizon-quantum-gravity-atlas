import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lintSource, lintTokenLiterals, describeLiteral, EXEMPT } from "../scripts/lib/token-lint.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const lint = (source) => lintSource(root, source).map((f) => f.message);

test("flags every literal form the art direction forbids", () => {
  const cases = {
    'const a = "#abc";': /colour literal #abc/,
    'const a = "#aabbcc";': /colour literal/,
    'const a = "#aabbccdd";': /colour literal/,
    "const a = '#ABCD';": /colour literal/,
    "const a = 0xaabbcc;": /colour literal 0xaabbcc/,
    'ctx.fillStyle = "rgb(1,2,3)";': /colour function rgb\(/,
    'ctx.fillStyle = "rgba(1,2,3,0.5)";': /colour function rgba\(/,
    'ctx.fillStyle = "oklch(0.7 0.1 200)";': /colour function oklch\(/,
    'ctx.fillStyle = "hsl(10, 20%, 30%)";': /colour function hsl\(/,
    'ctx.fillStyle = "hsla(10, 20%, 30%, 1)";': /colour function hsla\(/,
    'ctx.fillStyle = "color(srgb 1 0 0)";': /colour function color\(/,
    'ctx.fillStyle = "rgba(" + r + ",0,0," + a + ")";': /colour function rgba\(/,
    "ctx.fillStyle = `rgba(1,2,3,${a})`;": /colour function rgba\(/,
    'ctx.font = "10px IBM Plex Mono";': /font/,
    'ctx.font = `${size}px mono`;': /literal assigned to \.font/,
    'const f = "9.5px \\"Sora\\", sans-serif";': /font/,
    'el.style.fontFamily = "Space Grotesk";': /font family literal/,
    "const c = new THREE.Color(1.0, 0.5, 0.2);": /numeric new Color/,
    "const c = new Color(0.1, 0.2, 0.3);": /numeric new Color/,
    "c.setRGB(0.1, 0.2, 0.3);": /numeric \.setRGB/,
    "c.setHSL(0.5, 0.6, 0.7);": /numeric \.setHSL/,
    '<text fill="#fff" />;': /colour literal #fff/,
  };
  for (const [source, expected] of Object.entries(cases)) {
    const found = lint(source);
    assert.ok(found.length >= 1, `not flagged: ${source}`);
    assert.match(found.join(" | "), expected, source);
  }
});

test("accepts token reads, CSS variable references, selectors, comments and identifiers", () => {
  const clean = [
    'ctx.fillStyle = QGA_TOKENS.css("ink");',
    'ctx.fillStyle = TK.alpha("accent", 0.4);',
    "const c = new THREE.Color(TK.hex(\"accent\"));",
    "const c = new THREE.Color();",
    "c.setHex(TK.hex(\"accent\"));",
    "c.setHSL(h / 360, s, l);",
    'ctx.font = QGA_TOKENS.monoPx(10);',
    '<text fontFamily="var(--font-mono)" fill="var(--gold)" />;',
    'el.querySelector("#panel-3");',
    'const id = "#add-note";',
    'const s = "1px solid var(--line)";',
    'const s = "12px 0 0 0";',
    "// colour #ff0000 and rgba(1,2,3,4) in a comment\nconst x = 1;",
    "/* oklch(0.7 0.1 200) */ const y = 2;",
    "const rgb = blackbodyToSrgb(5800); const h = hash(0x9e3779b9);",
    'const key = "color-scheme";',
  ];
  for (const source of clean) assert.deepEqual(lint(source), [], source);
});

test("a token-lint-allow comment exempts its own line and the next one only", () => {
  assert.deepEqual(lint('ctx.fillStyle = "#abc"; // token-lint-allow: encodes a CIE primary'), []);
  assert.deepEqual(lint('// token-lint-allow: shader constant\nconst a = 0xaabbcc;'), []);
  assert.equal(lint('// token-lint-allow: x\n\nconst a = 0xaabbcc;').length, 1);
});

test("reports line numbers and ignores nothing else on the line", () => {
  const found = lintSource(root, 'const a = 1;\nconst b = "#abcdef";\n');
  assert.deepEqual(found.map((f) => f.line), [2]);
});

test("describeLiteral is quiet on ordinary text", () => {
  for (const text of ["hello", "10px", "2.5px solid", "translate(10px, 4px)", "a#b", "#"]) assert.equal(describeLiteral(text), null, text);
});

test("the module code under js/ has zero colour or font literals", () => {
  assert.deepEqual(lintTokenLiterals(root), []);
});

test("exemptions are exactly the token layer and the physical colour data", () => {
  assert.deepEqual(EXEMPT.map(String), [String(/^js\/design\//), String(/^js\/science\/data\//), String(/^js\/science\/spectrum\.mjs$/)]);
});
