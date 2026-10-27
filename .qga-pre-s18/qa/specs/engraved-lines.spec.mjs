// Engraved lines (S06, closes F-24): the line modules draw constant-pixel-width lines on every renderer that
// can reach a scene.
//
//   classic        WebGLRenderer + LineMaterial (lines/Line2): what a browser without navigator.gpu uses.
//   node-webgl2    WebGPURenderer({ forceWebGL: true }) + Line2NodeMaterial: the node renderer's WebGL2 backend.
//   node-webgpu    WebGPURenderer + Line2NodeMaterial; only where the browser exposes an adapter.
//
// The harness renders a white line on black and integrates its cross-section: the sum of coverage over the rows
// that cross the line equals the line width in device pixels, so width_css = sum / devicePixelRatio. The
// requested width is checked at DPR 1 and DPR 2 within +-0.5 CSS px (the acceptance bound of the prompt).

import { test, expect } from "playwright/test";
import { webgpuAdapterKind } from "../lib/webgpu-adapter.mjs";

const PAGE = "/__engraved-lines.html";
const TOLERANCE_PX = 0.5;
const IMPORT_MAP = {
  imports: {
    three: "/vendor/three/build/three.module.js",
    "three/webgpu": "/vendor/three/build/three.webgpu.js",
    "three/tsl": "/vendor/three/build/three.tsl.js",
    "three/addons/": "/vendor/three/examples/jsm/",
  },
};

test.setTimeout(180_000);

async function openHarness(page) {
  await page.route(`**${PAGE}`, (route) => route.fulfill({
    contentType: "text/html; charset=utf-8",
    body: `<!doctype html><meta charset="utf-8"><title>engraved lines</title><script type="importmap">${JSON.stringify(IMPORT_MAP)}</script>`,
  }));
  await page.goto(PAGE);
  await page.evaluate(async () => {
    const backend = await import("/js/visualizations/common/engraved-backend.mjs");
    const lines = await import("/js/visualizations/common/engraved-lines.mjs");
    const THREE = await import("three");
    window.__engraved = { backend, lines, THREE };
    // The design tokens are not loaded on this bare page: a minimal token source stands in.
    lines.setEngravedTokens({ hex: (name) => ({ "qa-white": 0xffffff })[name] });
    window.__measure = async ({ mode, dpr, widthPx, opacity = 1, additive = false, dash = null, size = 160 }) => {
      const canvas = document.createElement("canvas");
      canvas.style.width = `${size}px`; canvas.style.height = `${size}px`;
      document.body.append(canvas);
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 5;
      const prepared = await backend.prepareEngravedLines({ hasWebGPU: mode !== "classic" });
      const api = lines.engravedFor(prepared);
      // A horizontal line at the pixel-grid centre of the view, so it is the cross-section that is measured.
      const line = api.line([{ x: -2, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }], { color: "qa-white", widthPx, opacity, additive, dash });
      scene.add(line);
      let renderer;
      if (mode === "classic") {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      } else {
        const webgpu = await import("three/webgpu");
        renderer = new webgpu.WebGPURenderer({ canvas, antialias: true, forceWebGL: mode === "node-webgl2" });
        await renderer.init();
      }
      renderer.setPixelRatio(dpr);
      renderer.setSize(size, size, false);
      canvas.width = size * dpr; canvas.height = size * dpr;
      renderer.setPixelRatio(dpr);
      renderer.setSize(size, size, false);
      renderer.setClearColor(0x000000, 1);
      renderer.toneMapping = THREE.NoToneMapping;
      // Coverage is measured in linear light: the node renderer would otherwise sRGB-encode a 0.25 coverage to 0.54.
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
      if (renderer.isWebGPURenderer) renderer.render(scene, camera); // warm up: pipelines are built on the first frames
      await new Promise((resolve) => requestAnimationFrame(resolve));
      renderer.render(scene, camera);
      // Read back in the same task as the render: a WebGPU canvas texture expires at the end of the task.
      const copy = document.createElement("canvas");
      copy.width = canvas.width; copy.height = canvas.height;
      const context = copy.getContext("2d", { willReadFrequently: true });
      context.drawImage(canvas, 0, 0);
      const { data } = context.getImageData(0, 0, copy.width, copy.height);
      // Cross-section at the middle column, away from the end caps; the red channel is coverage of a white line.
      const x = Math.floor(copy.width / 2), column = [];
      for (let y = 0; y < copy.height; y += 1) column.push(data[(y * copy.width + x) * 4] / 255);
      const sum = column.reduce((total, value) => total + value, 0);
      const rows = column.filter((value) => value > 0.02).length;
      const result = { backend: renderer.isWebGPURenderer ? (renderer.backend.isWebGPUBackend ? "webgpu" : "webgl2-node") : "webgl2-classic",
        sum, widthCss: sum / dpr, rows, peak: Math.max(...column), dpr,
        samples: renderer.samples ?? null, currentSamples: renderer.currentSamples ?? null, contextAA: renderer.backend?.gl?.getContextAttributes?.().antialias ?? null,
        profile: column.map((v, i) => [i, +v.toFixed(2)]).filter(([, v]) => v > 0.02) };
      renderer.dispose?.();
      canvas.remove();
      return result;
    };
  });
}

const MODES = ["classic", "node-webgl2", "node-webgpu"];

for (const mode of MODES) {
  test.describe(`${mode}`, () => {
    test.beforeEach(async ({ page }) => {
      await openHarness(page);
      if (mode === "node-webgpu" && (await webgpuAdapterKind(page)) === "none") test.skip(true, "no WebGPU adapter in this browser");
    });

    for (const dpr of [1, 2]) {
      for (const widthPx of [1.25, 2.5]) {
        test(`${widthPx} px line measures ${widthPx} +- ${TOLERANCE_PX} CSS px at DPR ${dpr}`, async ({ page }) => {
          const result = await page.evaluate((args) => window.__measure(args), { mode, dpr, widthPx });
          test.info().annotations.push({ type: "measured", description: JSON.stringify(result) });
          expect(Math.abs(result.widthCss - widthPx), JSON.stringify(result)).toBeLessThanOrEqual(TOLERANCE_PX);
        });
      }
    }

    test("opacity 0.5 halves the integrated coverage (real blending, not NoBlending)", async ({ page }) => {
      const full = await page.evaluate((args) => window.__measure(args), { mode, dpr: 1, widthPx: 2.5, opacity: 1 });
      const half = await page.evaluate((args) => window.__measure(args), { mode, dpr: 1, widthPx: 2.5, opacity: 0.5 });
      test.info().annotations.push({ type: "measured", description: JSON.stringify({ full, half }) });
      expect(half.sum / full.sum, JSON.stringify({ full, half })).toBeGreaterThan(0.4);
      expect(half.sum / full.sum, JSON.stringify({ full, half })).toBeLessThan(0.6);
    });
  });
}
