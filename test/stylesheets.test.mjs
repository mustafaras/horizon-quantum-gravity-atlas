import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");

// Cascade order is the original order of the inline <style>; do not reorder without re-proving the cascade.
const EXPECTED_ORDER = [
  "vendor/fonts/fonts.css",
  "vendor/katex/katex.min.css",
  "styles/tokens.css",
  "styles/base.css",
  "styles/layout.css",
  "styles/components.css",
  "styles/modules/kerr.css",
  "styles/modules/gw.css",
  "styles/modules/qft.css",
  "styles/modules/standard-model.css",
  "styles/modules/reference.css",
  "styles/components-scene.css",
  "styles/shell.css",
  "styles/modules/causal.css",
  "styles/modules/gr-tides.css",
  "styles/modules/planck-constraints.css",
  "styles/modules/causal-set.css",
  "styles/modules/spectral-cdt.css",
  "styles/modules/overview.css",
  "styles/modules/workbench.css",
  "styles/modules/cinematic.css",
  "styles/rg-flow.css",
  "styles/figure.css",
];

test("index.html links the stylesheets in cascade order and every file exists", () => {
  const linked = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(linked, EXPECTED_ORDER);
  for (const file of linked) assert.ok(fs.existsSync(path.join(root, file)), `${file} missing`);
});

test("only a small critical <style> remains inline (≤ 4 KB)", () => {
  const blocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  assert.equal(blocks.length, 1, "exactly one inline <style>");
  assert.ok(Buffer.byteLength(blocks[0]) <= 4096, `critical CSS is ${Buffer.byteLength(blocks[0])} bytes`);
  assert.ok(!/style="[^"]*#[0-9a-f]{3,8}/i.test(html), "no inline colour attributes in index.html");
});

test("tokens.css is linked before any rule that reads a token, and defines every custom property read by the other sheets", () => {
  const defined = new Set([...read("styles/tokens.css").matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const local = new Set();
  const used = new Set();
  const sheets = EXPECTED_ORDER.filter((f) => f.startsWith("styles/") && f !== "styles/tokens.css");
  for (const file of sheets) {
    const css = read(file).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of css.matchAll(/(--[\w-]+)\s*:/g)) local.add(m[1]);
    for (const m of css.matchAll(/var\(\s*(--[\w-]+)/g)) used.add(m[1]);
  }
  // Per-element properties set inline by module code (style={{ "--cell-color": … }}) are not tokens.
  const inline = new Set(["--cell-color", "--sector-color", "--i"]);
  const missing = [...used].filter((name) => !defined.has(name) && !local.has(name) && !inline.has(name));
  assert.deepEqual(missing, [], `var() without a definition: ${missing.join(", ")}`);
});

test("no sheet other than tokens.css declares a :root rule", () => {
  for (const file of EXPECTED_ORDER.filter((f) => f.startsWith("styles/") && f !== "styles/tokens.css")) {
    assert.ok(!/(^|\n)\s*:root\s*\{/.test(read(file)), `${file} must not declare :root`);
  }
});

test("each extracted sheet is non-empty and stays reviewable (≤ 600 lines)", () => {
  for (const file of EXPECTED_ORDER.filter((f) => f.startsWith("styles/"))) {
    const lines = read(file).split("\n").length;
    assert.ok(lines > 3 && lines <= 600, `${file}: ${lines} lines`);
  }
});

test("every extracted sheet has balanced braces and starts with a rule, not a stray brace", () => {
  for (const file of EXPECTED_ORDER.filter((f) => f.startsWith("styles/"))) {
    const css = read(file).replace(/\/\*[\s\S]*?\*\//g, "");
    let depth = 0;
    for (const ch of css) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      assert.ok(depth >= 0, `${file}: unmatched closing brace`);
    }
    assert.equal(depth, 0, `${file}: unclosed block`);
  }
});
