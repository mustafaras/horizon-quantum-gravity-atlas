import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  lintArtDirection, textFloorFindings, textShadowFindings, canvas2dFindings, hasBlurredShadow, CANVAS_2D_ALLOWLIST,
} from "../scripts/lib/art-direction.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function tree(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "art-direction-"));
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  }
  return dir;
}

test("the repository passes every art-direction check (S36)", () => {
  assert.deepEqual(lintArtDirection(root), []);
});

test("the 10 px floor catches CSS sizes and token font calls below it, and ignores comments", () => {
  const dir = tree({
    "styles/a.css": ".a { font-size: 9.5px; }\n/* .b { font-size: 8px; } */\n.c { font-size: 10px; }",
    "js/b.jsx": "ctx.font = QGA_TOKENS.monoPx(9);\nctx.font = QGA_TOKENS.monoPx(10);\nconst s = { fontSize: 8 };",
    "js/compiled/js/b.js": "ctx.font = QGA_TOKENS.monoPx(6);",
  });
  const found = textFloorFindings(dir);
  assert.equal(found.length, 3, found.join("\n"));
  assert.match(found[0], /styles\/a\.css:1 font-size 9\.5px/);
  assert.ok(found.some((f) => /js\/b\.jsx:1 text at 9px/.test(f)));
  assert.ok(found.some((f) => /js\/b\.jsx:3 text at 8px/.test(f)));
});

test("a blurred text-shadow is refused on .axis, .label and .readout, not on other classes", () => {
  assert.equal(hasBlurredShadow("0 1px 4px rgba(0,0,0,0.9)"), true);
  assert.equal(hasBlurredShadow("1px 1px 0 var(--ink)"), false);
  assert.equal(hasBlurredShadow("none"), false);
  assert.equal(hasBlurredShadow("1px 0 0 #000, 0 0 3px rgba(1, 2, 3, 0.5)"), true);
  const dir = tree({
    "styles/a.css": [
      ".fig .axis { text-shadow: 0 0 6px rgba(0,0,0,0.8); }",
      ".readout { text-shadow: 1px 1px 0 #000; }",
      ".s3d-label { text-shadow: 0 1px 4px rgba(0,0,0,0.9); }",
      ".label, .tick { text-shadow: 0 0 2px #000; }",
    ].join("\n"),
  });
  const found = textShadowFindings(dir);
  assert.equal(found.length, 2, found.join("\n"));
  assert.match(found[0], /\.fig \.axis/);
  assert.match(found[1], /\.label, \.tick/);
});

test("a canvas 2D context outside the allowlist fails, and an unused allowance is reported", () => {
  const dir = tree({
    "js/figure/canvas-renderer.mjs": "a.getContext(\"2d\"); b.getContext('2d'); c.getContext(\"2d\");",
    "js/new-plot.jsx": "const ctx = cv.getContext(\"2d\");",
  });
  const found = canvas2dFindings(dir);
  assert.ok(found.some((f) => /js\/new-plot\.jsx has 1/.test(f)), found.join("\n"));
  assert.ok(found.some((f) => /grants js\/core\.jsx 1 site/.test(f)), "a stale allowance is reported");
});

test("every allowlisted canvas states why it is not a plot", () => {
  for (const [file, entry] of Object.entries(CANVAS_2D_ALLOWLIST)) {
    assert.ok(Number.isInteger(entry.sites) && entry.sites > 0, file);
    assert.ok(entry.reason.length > 10, `${file} needs a reason`);
  }
});

// One focal mark per figure: figure() refuses a second one (test/figure-spec.test.mjs, "exactly one focal mark at
// most"), and every shipped figure is built through it (test/figure-plots.test.mjs builds them all).
