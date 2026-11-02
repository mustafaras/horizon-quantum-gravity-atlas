import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "compiled" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(mjs|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// In an ordinary JavaScript string "\beta" is a backspace followed by "eta", "\omega" is "omega", "\," is ",": KaTeX then
// shows a parse error (found by the contrast spec as a red .katex-error on the black-hole figure). TeX in a quoted string
// needs "\\beta"; String.raw or a template literal are the alternatives and are not matched here.
const SINGLE_BACKSLASH = /\b(tex|latex)\s*:\s*"[^"\n]*?\\[a-zA-Z ,;!:{}][^"\n]*"/;
const withoutEscapedBackslashes = (line) => line.replace(/\\\\/g, "§§");

test("no tex or latex string in the sources uses a single backslash escape", () => {
  const offenders = [];
  for (const file of walk(path.join(root, "js"))) {
    fs.readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      if (SINGLE_BACKSLASH.test(withoutEscapedBackslashes(line))) offenders.push(`${path.relative(root, file)}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, [], `single-backslash TeX in a normal string: ${offenders.join(", ")}`);
});

test("the scanner does catch the mistake it guards against", () => {
  assert.ok(SINGLE_BACKSLASH.test(withoutEscapedBackslashes(String.raw`label: { tex: "\beta(S)" }`)));
  assert.ok(SINGLE_BACKSLASH.test(withoutEscapedBackslashes(String.raw`label: { tex: "\omega\,(\hbar=c=1)" }`)));
  assert.ok(!SINGLE_BACKSLASH.test(withoutEscapedBackslashes(String.raw`label: { tex: "\\beta(S)" }`)));
  assert.ok(!SINGLE_BACKSLASH.test(withoutEscapedBackslashes(String.raw`label: { tex: "\\omega\\,(\\hbar=c=1)" }`)));
});
