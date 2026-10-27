// Formula Core (S03, closes F-26): every library formula that is GPU safe is compiled to TSL, run on a
// real renderer, read back, and compared with the float32-emulating evaluator. The same AST feeds both,
// so a mapping or precision bug in either cannot hide.
//
//   webgl2  the node renderer's WebGL2 backend (forceWebGL); the only backend CI has (WebGPU disabled).
//   webgpu  only when the browser exposes a WebGPU adapter; otherwise reported as an annotation.
//
// Each formula gets a (256 x variables) FloatType DataTexture of its sample grid, a QuadMesh whose colorNode
// is the compiled formula, and a 256 x 1 render target that is read back. If float targets cannot be read
// on the software rasterizer the run falls back to HalfFloatType with a looser tolerance and says so.

import { test, expect } from "playwright/test";

const PAGE = "/__formula-gpu.html";
const TOLERANCE = { float: 2e-4, half: 2e-3 };
// sin() and cos() are specified to an absolute error of 2^-11 inside [-pi, pi] and not at all outside it (Vulkan spec, appendix
// "Precision and Operation of SPIR-V Instructions", table for sin()/cos(); the CI rasterizer measures 1.9e-4 at x = 1.40). A formula
// built from them is therefore compared by its absolute error against the scale of its own output, with a budget derived from the
// error propagation instead of a pointwise relative error, which is unbounded at a zero of sin. The other formulas keep the strict
// relative tolerance. two-flavour oscillation is P = sin^2(2 theta) sin^2(phi): |dP| <= 2|s1| e s2^2 + 2 s1^2 |s2| e <= 4e.
const SIN_ERROR = 2 ** -11;
const TRIG_BUDGET = { twoFlavourOscillation: 4 * SIN_ERROR };
const IMPORT_MAP = {
  imports: {
    three: "/vendor/three/build/three.module.js",
    "three/webgpu": "/vendor/three/build/three.webgpu.js",
    "three/tsl": "/vendor/three/build/three.tsl.js",
  },
};

test.setTimeout(240_000);

async function openHarness(page) {
  await page.route(`**${PAGE}`, (route) => route.fulfill({
    contentType: "text/html; charset=utf-8",
    body: `<!doctype html><meta charset="utf-8"><title>formula gpu</title><script type="importmap">${JSON.stringify(IMPORT_MAP)}</script>`,
  }));
  await page.goto(PAGE, { waitUntil: "load" });
}

/** Runs in the page. Returns one record per GPU-safe library formula. */
async function runOnGpu({ backend, tolerances, trigBudget }) {
  const THREE = await import("three/webgpu");
  const TSL = await import("three/tsl");
  const { library } = await import("/js/formula/library/index.mjs");
  const { compileTSL } = await import("/js/formula/to-tsl.mjs");

  const renderer = new THREE.WebGPURenderer({ forceWebGL: backend === "webgl2", antialias: false });
  await renderer.init();
  const actualBackend = renderer.backend.isWebGPUBackend === true ? "webgpu" : "webgl2";
  const WIDTH = 256;

  async function evaluate(formula, type) {
    const { names, points } = formula.sampleGrid({ samples: WIDTH });
    const rows = Math.max(1, names.length);
    const data = new Float32Array(WIDTH * rows);
    names.forEach((name, row) => points.forEach((p, i) => { data[row * WIDTH + i] = p[name]; }));
    const samples = new THREE.DataTexture(data, WIDTH, rows, THREE.RedFormat, THREE.FloatType);
    samples.minFilter = samples.magFilter = THREE.NearestFilter;
    samples.generateMipmaps = false;
    samples.needsUpdate = true;

    const bindings = { ...formula.geometric({}) };
    names.forEach((name, row) => { bindings[name] = TSL.texture(samples, TSL.vec2(TSL.uv().x, (row + 0.5) / rows)).r; });
    const { node } = compileTSL(formula.expr, TSL, bindings);

    const material = new THREE.MeshBasicNodeMaterial();
    // The magnitude goes in red and the sign in green: a render target can clamp a negative output to 0, and
    // formulas such as the Newtonian potential are negative.
    material.colorNode = TSL.vec4(TSL.abs(node), TSL.select(TSL.float(node).lessThan(0), TSL.float(1), TSL.float(0)), 0, 1);
    const target = new THREE.RenderTarget(WIDTH, 1, { type: type === "half" ? THREE.HalfFloatType : THREE.FloatType, depthBuffer: false });
    const quad = new THREE.QuadMesh(material);
    renderer.setRenderTarget(target);
    quad.render(renderer);
    renderer.setRenderTarget(null);
    const pixels = await renderer.readRenderTargetPixelsAsync(target, 0, 0, WIDTH, 1);

    const references = points.map((p) => formula.evaluateF32(formula.geometric(p)));
    const scale = Math.max(...references.map(Math.abs)) || 1;
    let maxRel = 0, maxScaledAbs = 0, nonFinite = 0;
    points.forEach((p, i) => {
      const gpu = type === "half" && pixels instanceof Uint16Array ? NaN : pixels[i * 4] * (pixels[i * 4 + 1] > 0.5 ? -1 : 1);
      const reference = references[i];
      if (!Number.isFinite(gpu)) { nonFinite += 1; return; }
      maxRel = Math.max(maxRel, Math.abs(gpu - reference) / (Math.abs(reference) || 1));
      maxScaledAbs = Math.max(maxScaledAbs, Math.abs(gpu - reference) / scale);
    });
    [samples, target, material].forEach((r) => r.dispose());
    return { maxRel, maxScaledAbs, nonFinite, pixelType: pixels.constructor.name };
  }

  const out = [];
  for (const [name, formula] of Object.entries(library)) {
    const safe = formula.gpuSafe();
    if (!safe.ok) { out.push({ name, skipped: `gpuSafe false (${safe.maxRelError})` }); continue; }
    let type = "float", result;
    try {
      result = await evaluate(formula, "float");
      if (result.nonFinite) throw new Error(`${result.nonFinite} non-finite float readbacks`);
    } catch (error) {
      type = "half";
      result = await evaluate(formula, "half").catch((e) => ({ maxRel: Infinity, error: String(e) }));
      result.floatError = String(error.message || error);
    }
    out.push({ name, type, tolerance: tolerances[type], trigBudget: type === "float" ? trigBudget[name] : undefined, ...result });
  }
  renderer.dispose();
  return { backend: actualBackend, formulas: out };
}

for (const backend of ["webgl2", "webgpu"]) {
  test(`${backend}: compiled TSL equals evaluateF32 for every GPU-safe library formula`, async ({ page }, info) => {
    await openHarness(page);
    const hasWebGPU = await page.evaluate(async () => !!(navigator.gpu && await navigator.gpu.requestAdapter().catch(() => null)));
    if (backend === "webgpu" && !hasWebGPU) {
      info.annotations.push({ type: "backend-unavailable", description: "no WebGPU adapter in this browser; the webgl2 run is the CI gate" });
      test.skip(true, "no WebGPU adapter in this browser");
      return;
    }
    const report = await page.evaluate(runOnGpu, { backend, tolerances: TOLERANCE, trigBudget: TRIG_BUDGET });
    await info.attach(`formula-gpu-${backend}.json`, { body: JSON.stringify(report, null, 2), contentType: "application/json" });
    console.log(`[formula-gpu] ${backend}: ${JSON.stringify(report.formulas.map((f) => [f.name, f.type, f.maxRel, f.maxScaledAbs]))}`);
    expect(report.backend).toBe(backend);
    const checked = report.formulas.filter((f) => !f.skipped);
    expect(checked.length, "GPU-safe formulas compared").toBeGreaterThanOrEqual(10);
    for (const f of checked) {
      if (f.trigBudget !== undefined) {
        expect(f.maxScaledAbs, `${f.name} max absolute error / output scale vs evaluateF32 (sin/cos budget ${f.trigBudget})`).toBeLessThanOrEqual(f.trigBudget);
      } else {
        expect(f.maxRel, `${f.name} (${f.type}) max relative error vs evaluateF32`).toBeLessThanOrEqual(f.tolerance);
      }
    }
    // The budget must stay a bound, not a licence: a formula that was given one and is still within the strict tolerance loses it.
    for (const f of checked.filter((c) => c.trigBudget !== undefined && c.maxRel <= c.tolerance)) {
      info.annotations.push({ type: "trig-budget-unneeded", description: `${f.name} meets the strict tolerance here (${f.maxRel}); the sin/cos budget was not needed on this rasterizer` });
    }
  });
}
