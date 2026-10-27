import test from "node:test";
import assert from "node:assert/strict";

import { classify } from "../scripts/ci/browser-scope.mjs";

test("documents, the ledger and screenshots need no browser run", () => {
  const paths = ["docs/superpowers/ledger/ledger.json", "docs/render/formula-lens.md", "docs/screenshots/a.png", "README.md", "LICENSE", "CITATION.cff"];
  assert.deepEqual(classify(paths), { code: false, render: false });
  for (const path of paths) assert.equal(classify([path]).code, false, path);
});

test("app code, styles, the page and the QA harness need the critical browser run", () => {
  for (const path of ["js/core.jsx", "styles/components.css", "index.html", "manifest.webmanifest", "favicon.svg", "test/x.test.mjs", "scripts/validate-repo.mjs", "vendor/react/react.development.js"]) {
    assert.deepEqual(classify([path]), { code: true, render: false }, path);
  }
});

test("renderer, three.js, the QA harness, packages and the workflow also need the native WebGPU boundary test", () => {
  for (const path of ["js/render/create-renderer.mjs", "vendor/three/build/three.webgpu.js", "qa/specs/smoke.spec.mjs", "package.json", "package-lock.json", ".github/workflows/quality.yml", "scripts/ci/browser-scope.mjs"]) {
    assert.deepEqual(classify([path]), { code: true, render: true }, path);
  }
});

test("one code file among documents makes the change a code change", () => {
  assert.deepEqual(classify(["docs/a.md", "js/mod-gr.jsx"]), { code: true, render: false });
  assert.deepEqual(classify(["docs/a.md", "js/render/render-session.mjs"]), { code: true, render: true });
});

test("an empty or unreadable change list runs everything (fail safe)", () => {
  assert.deepEqual(classify([]), { code: true, render: true });
  assert.deepEqual(classify(null), { code: true, render: true });
  assert.deepEqual(classify(undefined), { code: true, render: true });
});

test("paths are matched from the repository root, not by substring", () => {
  assert.equal(classify(["js/docs/helper.mjs"]).code, true, "a docs folder inside js is code");
  assert.equal(classify(["js/render-notes.md"]).code, false, "a markdown file anywhere is a document");
  assert.equal(classify(["js/renderer.mjs"]).render, false, "js/renderer.mjs is not js/render/");
});
