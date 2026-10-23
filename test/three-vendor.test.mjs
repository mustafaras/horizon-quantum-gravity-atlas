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
    fs.writeFileSync(path.join(fixture, "vendor/three/unlisted-addon.js"), "export const unexpected = true;");
    assert.ok(inspectThreeVendor(fixture).some((s) => s.includes("unlisted-addon.js") && s.includes("integrity metadata")));
    const metadataPath = path.join(fixture, "vendor/three/VERSION");
    const metadata = JSON.parse(fs.readFileSync(metadataPath));
    metadata.files["../../outside"] = "invalid";
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));
    assert.ok(inspectThreeVendor(fixture).some((s) => s.includes("Invalid vendored manifest entry")));
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

test("the engraved-line addons are vendored with integrity metadata and reach the import graph through the backend loader", () => {
  const metadata = JSON.parse(fs.readFileSync(path.join(root, "vendor/three/VERSION"), "utf8"));
  const lines = [
    "LineGeometry", "LineSegmentsGeometry", "LineMaterial", "LineSegments2", "Line2", "webgpu/LineSegments2", "webgpu/Line2",
  ].map((name) => `examples/jsm/lines/${name}.js`);
  for (const file of lines) {
    assert.match(metadata.files[file] ?? "", /^[a-f0-9]{64}$/, file);
    assert.ok(fs.existsSync(path.join(root, "vendor/three", file)), file);
  }
  // Only the pinned tarball's own sources: no edits, and a loader that names exactly these entry points.
  const loader = fs.readFileSync(path.join(root, "js/visualizations/common/engraved-backend.mjs"), "utf8");
  for (const entry of ["lines/Line2.js", "lines/LineSegments2.js", "lines/LineGeometry.js", "lines/LineSegmentsGeometry.js", "lines/LineMaterial.js", "lines/webgpu/Line2.js", "lines/webgpu/LineSegments2.js"]) {
    assert.ok(loader.includes(`three/addons/${entry}`), entry);
  }
  assert.deepEqual(inspectThreeVendor(root), []);
});
