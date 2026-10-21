import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { percentile, summarize } from "../scripts/perf/lib/stats.mjs";
import { parseViewIds } from "../scripts/perf/lib/views.mjs";
import { formatReport } from "../scripts/perf/lib/report.mjs";
import { runAudit, formatAudit } from "../scripts/perf/static-audit.mjs";
import { describeRenderer, retainRenderer, liveRenderers, rendererStats } from "../js/render/renderer-census.mjs";
import { renderDiagnostics } from "../js/render/error-overlay.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("percentile is nearest-rank and returns an observed sample", () => {
  const samples = Array.from({ length: 100 }, (_, i) => 100 - i); // unsorted 100..1
  assert.equal(percentile(samples, 50), 50);
  assert.equal(percentile(samples, 95), 95);
  assert.equal(percentile(samples, 100), 100);
  assert.equal(percentile(samples, 0), 1);
  assert.equal(percentile([16.7], 95), 16.7);
  assert.equal(percentile([], 50), null);
  assert.throws(() => percentile([1], 101), RangeError);
  assert.deepEqual(summarize([4, 1, 3, 2]), { n: 4, p50: 2, p95: 4, max: 4 });
  assert.equal(summarize([]), null);
});

test("view ids are parsed from the QGA_VIEWS table in js/app.jsx", async () => {
  const ids = parseViewIds(await readFile(path.join(root, "js/app.jsx"), "utf8"));
  assert.deepEqual(ids, ["overview", "sm", "qft", "rg", "gr", "planck", "approaches", "bh", "exp", "glossary", "symbols", "refs", "open", "paper", "compare"]);
  assert.throws(() => parseViewIds("const OTHER = {};"), /QGA_VIEWS/);
  assert.throws(() => parseViewIds("const QGA_VIEWS = {\n  a: 1,"), /not terminated/);
});

test("renderer census counts live renderers and release is idempotent", () => {
  const before = liveRenderers();
  const releaseA = retainRenderer({});
  const releaseB = retainRenderer({});
  assert.equal(liveRenderers(), before + 2);
  assert.equal(renderDiagnostics.liveRenderers(), before + 2, "renderDiagnostics exposes the same counter");
  releaseA(); releaseA();
  assert.equal(liveRenderers(), before + 1);
  releaseB();
  assert.equal(liveRenderers(), before);
});

test("describeRenderer reads stable public counters for both renderer kinds", () => {
  const classic = describeRenderer({ info: { programs: [{}, {}, {}] }, getPixelRatio: () => 2 });
  assert.deepEqual(classic, { rendererPath: "classic", backend: "webgl2", programs: 3, dpr: 2 });
  const beforeFirstRender = describeRenderer({ info: { programs: null }, getPixelRatio: () => 1 });
  assert.equal(beforeFirstRender.programs, null, "classic info.programs is null until the first render");
  const node = describeRenderer({ isWebGPURenderer: true, backend: { isWebGPUBackend: true }, info: { memory: { programs: 12 } }, getPixelRatio: () => 1 });
  assert.deepEqual(node, { rendererPath: "nodes", backend: "webgpu", programs: 12, dpr: 1 });
  const nodeOnGL = describeRenderer({ isWebGPURenderer: true, backend: { isWebGPUBackend: false }, info: { memory: {} }, getPixelRatio: () => 1 });
  assert.equal(nodeOnGL.backend, "webgl2");
  assert.equal(nodeOnGL.programs, null);
  const release = retainRenderer({ info: { programs: [{}] }, getPixelRatio: () => 1 });
  assert.ok(rendererStats().some((s) => s.programs === 1));
  release();
});

test("create-renderer registers and releases every renderer it constructs; bootstrap keeps the Babel marks", async () => {
  const create = await readFile(path.join(root, "js/render/create-renderer.mjs"), "utf8");
  assert.equal(create.match(/retainRenderer\(renderer\)/g).length, 2, "one retain per construction site");
  assert.equal(create.match(/releaseCensus\(\)/g).length, 2, "released on dispose and on the failure path");
  const bootstrap = await readFile(path.join(root, "js/bootstrap.mjs"), "utf8");
  const start = bootstrap.indexOf('performance.mark("qga:babel:start")');
  const transform = bootstrap.indexOf("Babel.transform");
  const end = bootstrap.indexOf('performance.mark("qga:babel:end")');
  assert.ok(start !== -1 && start < transform && transform < end, "marks must wrap the transform loop");
});

async function fixture(files) {
  const dir = await mkdtemp(path.join(tmpdir(), "qga-audit-"));
  for (const [name, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, name)), { recursive: true });
    await writeFile(path.join(dir, name), text);
  }
  return dir;
}

test("static audit counts what it promises and ignores comments, vendor and non-product files", async () => {
  const dir = await fixture({
    "js/a.jsx": [
      "// <VizCaption in a comment does not count",
      "const x = <VizCaption id=\"a\" />; const y = <VizCaption id=\"b\" />;",
      "/* Math.random() in a block",
      "   comment */",
      "const r = Math.random();",
      "registerVisualization({ id: 1 });",
      "function registerVisualization(entry) {}",
      "const c = \"#ff00aa\" + \"#abc\" + 'rgba(0,0,0,.5)' + 'rgb(1,2,3)' + 'oklch(70% 0.1 200)' + 0xff8800;",
      "geometry.attributes.position.needsUpdate = true;",
      "const l = new THREE.Line(g, new THREE.LineBasicMaterial()); const s = new THREE.ShaderMaterial(); new THREE.RawShaderMaterial();",
      "const lines = new THREE.LineSegments();",
      "",
    ].join("\n"),
    "js/b.mjs": "const k = 1;\n",
    "vendor/big.js": `${"x\n".repeat(900)}Math.random();\n`,
    "test/t.mjs": "Math.random();\n",
    "docs/long.md": "line\n".repeat(801),
    "docs/short.md": "line\n".repeat(800),
  });
  try {
    const audit = await runAudit(dir);
    assert.deepEqual(audit.vizCaption, [{ file: "js/a.jsx", count: 2 }]);
    assert.deepEqual(audit.registerVisualization, ["js/a.jsx:6"]);
    assert.deepEqual(audit.mathRandom, ["js/a.jsx:5"]);
    assert.deepEqual(audit.colorLiterals, [{ file: "js/a.jsx", hex: 2, "rgb(": 1, "rgba(": 1, "oklch(": 1, "0xRRGGBB": 1 }]);
    assert.deepEqual(audit.needsUpdate, [{ file: "js/a.jsx", count: 1 }]);
    assert.deepEqual(audit.sites["new THREE.Line("], ["js/a.jsx:10"]);
    assert.deepEqual(audit.sites.LineBasicMaterial, ["js/a.jsx:10"]);
    assert.deepEqual(audit.sites.ShaderMaterial, ["js/a.jsx:10"]);
    assert.deepEqual(audit.longFiles, [{ file: "docs/long.md", lines: 801 }]);
    assert.equal(formatAudit(audit), formatAudit(await runAudit(dir)), "same tree, same report");
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("static audit of this repository is deterministic", async () => {
  const first = formatAudit(await runAudit(root));
  const second = formatAudit(await runAudit(root));
  assert.equal(first, second);
  assert.match(first, /^## <VizCaption per file \(total \d+ in \d+ files\)/);
});

test("report tables render nulls explicitly and flag failed views", () => {
  const report = {
    config: { viewports: [{ name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1 }] },
    results: [
      { viewport: "desktop", view: "qft", ok: true, renderers: 4, programs: { total: 38 }, cpuFrameMs: { p50: 16.7, p95: 33.3 }, gpuFrameMs: null, firstFrameMs: 6316, jsBytes: 10240, babelMs: 4000, scenes: [{ backend: "webgl2", rendererPath: "classic" }] },
      { viewport: "desktop", view: "bh", ok: false, error: "scenes not ready" },
    ],
  };
  const text = formatReport(report);
  assert.match(text, /\| qft \| 4 \| 38 \| 16\.7 \| 33\.3 \| null \| null \| 6316 \| 10 \| 4000 \| webgl2\/classic \|/);
  assert.match(text, /\| bh \| null .* ERROR: scenes not ready \|/);
});
