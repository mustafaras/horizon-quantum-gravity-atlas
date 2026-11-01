import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { blendOver, pickReadable } from "../js/design/readable.mjs";
import { contrastRatio } from "../js/design/color.mjs";
import { parseTokensCss, buildTokens, setTokenSource, readableText, linearRef, THEME_IDS } from "../js/design/tokens.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => fs.readFileSync(path.join(root, ...p), "utf8");
const baseCss = read("styles", "tokens.css");
const tokensOf = (id) => buildTokens(parseTokensCss(baseCss, id === "observatory" ? {} : { theme: id, themeCss: read("styles", "themes", `${id}.css`) }), id);

test("blendOver composites in sRGB like CSS: alpha 0 is the ground, alpha 1 the fill, and the midpoint is the sRGB mean", () => {
  const white = [1, 1, 1], black = [0, 0, 0];
  assert.deepEqual(blendOver(white, 0, black).map((v) => +v.toFixed(6)), [0, 0, 0]);
  assert.deepEqual(blendOver(white, 1, black).map((v) => +v.toFixed(6)), [1, 1, 1]);
  const mid = blendOver(white, 0.5, black)[0];
  assert.ok(Math.abs(mid - 0.2140) < 1e-3, `sRGB 0.5 is linear ${mid}`);
  assert.equal(blendOver(white, 7, black)[0], 1, "alpha is clamped");
});

test("pickReadable keeps the first label that works and otherwise takes the best", () => {
  const black = [0, 0, 0], white = [1, 1, 1], grey = [0.2, 0.2, 0.2];
  assert.equal(pickReadable(black, [white, black]), 0, "the preferred label wins while it clears the floor");
  assert.equal(pickReadable(white, [white, black]), 1, "and gives way when it does not");
  const mid = [0.18, 0.18, 0.18];
  assert.equal(pickReadable(mid, [grey, white, black], 21), 2, "with nothing clearing the floor the highest contrast wins");
  assert.throws(() => pickReadable(black, []), RangeError);
});

// The mixing-matrix magnitudes drawn by MixingGrid in js/mod-standard-model.jsx (PDG CKM, NuFIT PMNS).
const MAGNITUDES = [0.97435, 0.225, 0.00369, 0.22486, 0.97349, 0.04182, 0.00857, 0.0411, 0.999118, 0.821, 0.55, 0.15, 0.376, 0.61, 0.697, 0.428, 0.58, 0.701];

for (const id of THEME_IDS) {
  test(`${id}: every mixing-matrix cell has a label that clears 4.5:1 on its chip`, () => {
    const T = tokensOf(id);
    setTokenSource(T);
    try {
      const labels = ["pigment-blue-88-c03", "surface-0"];
      for (const v of MAGNITUDES) {
        const alpha = Number((0.1 + 0.85 * v).toFixed(2));
        const background = blendOver(linearRef("chip-data"), alpha, linearRef("surface-1"));
        const label = readableText("chip-data", alpha, "surface-1", labels);
        const token = labels.find((name) => T.color[name].css === label);
        const ratio = contrastRatio(linearRef(token), background);
        assert.ok(ratio >= 4.5, `${id}: |V| = ${v} (alpha ${alpha}) has ${token} at ${ratio.toFixed(2)}:1`);
      }
    } finally {
      setTokenSource(null);
    }
  });
}

test("Observatory keeps the light label on every chip, as it had before the label was chosen by contrast", () => {
  const T = tokensOf("observatory");
  setTokenSource(T);
  try {
    for (const v of MAGNITUDES) {
      const alpha = Number((0.1 + 0.85 * v).toFixed(2));
      assert.equal(readableText("chip-data", alpha, "surface-1", ["pigment-blue-88-c03", "surface-0"]), T.color["pigment-blue-88-c03"].css, `|V| = ${v}`);
    }
  } finally {
    setTokenSource(null);
  }
});
