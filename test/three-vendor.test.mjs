import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { inspectThreeVendor } from "../scripts/lib/three-vendor.mjs";

const root = path.resolve(import.meta.dirname, "..");

test("pinned ESM import map, dependency closure and integrity are valid", () => {
  assert.deepEqual(inspectThreeVendor(root), []);
});

test("vendor validation rejects mismatched versions, missing imports, CDN and legacy references", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "qga-three-"));
  try {
    for (const file of ["index.html", "package.json", "package-lock.json", "README.md", "js/bootstrap.mjs", "js/render/three-runtime.mjs", "vendor/three"]) {
      const dest = path.join(fixture, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.cpSync(path.join(root, file), dest, { recursive: true });
    }
    const pkg = JSON.parse(fs.readFileSync(path.join(fixture, "package.json")));
    pkg.dependencies.three = "0.0.0";
    fs.writeFileSync(path.join(fixture, "package.json"), JSON.stringify(pkg));
    assert.ok(inspectThreeVendor(fixture).some((s) => s.includes("version")));
    fs.appendFileSync(path.join(fixture, "vendor/three/build/three.module.js"), "\n// tampered\n");
    assert.ok(inspectThreeVendor(fixture).some((s) => s.includes("integrity mismatch")));
    fs.unlinkSync(path.join(fixture, "vendor/three/build/three.core.js"));
    assert.ok(inspectThreeVendor(fixture).some((s) => s.includes("three.core.js")));
    fs.appendFileSync(path.join(fixture, "js/render/three-runtime.mjs"), '\nimport "https://esm.sh/three";\n');
    assert.ok(inspectThreeVendor(fixture).some((s) => s.includes("external")));
    fs.appendFileSync(path.join(fixture, "index.html"), '<script src="https://cdn.jsdelivr.net/npm/three"></script>');
    assert.ok(inspectThreeVendor(fixture).some((s) => s.includes("index.html loads an external")));
    fs.appendFileSync(path.join(fixture, "index.html"), '<script src="vendor/three/examples/js/postprocessing/EffectComposer.js"></script>');
    assert.ok(inspectThreeVendor(fixture).some((s) => s.includes("legacy")));
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("JSX evaluation is owned only by the module bootstrap", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.doesNotMatch(html, /type="text\/babel"/);
  assert.match(html, /type="module" src="js\/bootstrap\.mjs"/);
  const sources = [...html.matchAll(/type="application\/x-qga-jsx" src="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(sources.at(-1), "js/app.jsx");
  assert.equal(sources.filter((s) => s === "js/app.jsx").length, 1);
  for (const src of sources) assert.ok(fs.existsSync(path.join(root, src)), src);
});
