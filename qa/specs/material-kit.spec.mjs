// TSL material kit (S07, closes F-25): the kit's materials draw what their definitions say on the node renderer's WebGL2 backend
// (the backend CI runs: Chromium with no WebGPU adapter), and the GR gravity well, ported from three GLSL ShaderMaterials, runs on
// that renderer with none left in its scene.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.setTimeout(300_000);
const READY_MS = 200_000;
const READINESS = ["fonts", "network-idle", "view-mounted"];

function observe(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  return errors;
}
const snapshots = (page) => page.evaluate(() => QGA_RENDER.renderDiagnostics.snapshot());
async function ready(page) {
  await expect.poll(async () => {
    const entries = await snapshots(page);
    return entries.length > 0 && entries.every((entry) => entry.phase === "ready");
  }, { timeout: READY_MS }).toBe(true);
}

for (const forced of [null, "webgl2"]) {
  test(`GR gravity well${forced ? " with WebGL2 forced" : ""}: node renderer, kit materials, no ShaderMaterial in the scene`, async ({ page, context }) => {
    await context.addInitScript((backend) => {
      window.QGA_RENDER_OPTIONS = { softwareClamp: false, ...(backend ? { forceBackend: backend } : {}) };
      sessionStorage.setItem("horizon-intro", "1");
    }, forced);
    const errors = observe(page);
    await gotoReady(page, "/?view=gr&seed=42", READINESS, { timeoutMs: READY_MS });
    await ready(page);
    const well = (await snapshots(page)).find((entry) => /gravity well/i.test(entry.label));
    expect(well, "the gravity-well scene is live").toBeTruthy();
    // No WebGPU adapter in CI: the kit scene runs on the node renderer's WebGL2 backend. With an adapter it would be webgpu.
    expect(["webgl2", "webgpu"]).toContain(well.backend);
    expect(well.capabilities.rendererPath).toBe("nodes");
    expect(well.capabilities.unsupportedMaterials).toEqual([]);
    expect(well.capabilities.nodeCompatible).toBe(true);
    const inventory = await page.evaluate(() => {
      const mount = [...document.querySelectorAll("[data-engraved-backend]")].find((node) => node.closest("#shot-section-gr"));
      const kinds = {}, kits = {};
      let shader = 0, nodeMaterials = 0;
      mount.__qga.scene.traverse((object) => {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (!material) continue;
          kinds[material.type] = (kinds[material.type] ?? 0) + 1;
          if (material.isShaderMaterial || material.isRawShaderMaterial) shader += 1;
          if (material.isNodeMaterial) nodeMaterials += 1;
          if (material.userData?.kit) kits[material.userData.kit] = (kits[material.userData.kit] ?? 0) + 1;
        }
      });
      return { shader, nodeMaterials, kits, kinds, engraved: mount.dataset.engravedBackend };
    });
    expect(inventory.shader, `ShaderMaterial in the GR scene: ${JSON.stringify(inventory.kinds)}`).toBe(0);
    expect(inventory.engraved).toBe("node");
    expect(inventory.kits["gr-well"]).toBe(1);
    expect(inventory.kits["gr-star"]).toBe(1);
    expect(inventory.kits["data-points"], "starfield, trail dots and dust motes").toBeGreaterThanOrEqual(2);
    expect(errors).toEqual([]);
  });
}

test("kit materials render their definitions on the node renderer's WebGL2 backend", async ({ page, context }) => {
  await context.addInitScript(() => { sessionStorage.setItem("horizon-intro", "1"); });
  const errors = observe(page);
  await gotoReady(page, "/?view=glossary", ["fonts", "view-mounted"], { timeoutMs: READY_MS });
  const result = await page.evaluate(async () => {
    const T = await import("three");
    const W = await import("three/webgpu");
    const tsl = await import("three/tsl");
    const kit = await import("/js/render/materials/index.mjs");
    const spectrum = await import("/js/science/spectrum.mjs");
    const palettes = await import("/js/design/palettes.mjs");
    const WIDTH = 480, HEIGHT = 320;
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH; canvas.height = HEIGHT;
    const renderer = new W.WebGPURenderer({ canvas, forceWebGL: true, antialias: false });
    await renderer.init();
    renderer.setSize(WIDTH, HEIGHT, false);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = T.SRGBColorSpace;
    const camera = new T.OrthographicCamera(-WIDTH / 2, WIDTH / 2, HEIGHT / 2, -HEIGHT / 2, -10, 10);   // one world unit is one pixel
    const pixels = async (scene) => {
      await renderer.compileAsync(scene, camera);
      renderer.render(scene, camera);
      const bitmap = await createImageBitmap(canvas);
      const copy = document.createElement("canvas");
      copy.width = WIDTH; copy.height = HEIGHT;
      const context2d = copy.getContext("2d", { willReadFrequently: true });
      context2d.drawImage(bitmap, 0, 0);
      return context2d.getImageData(0, 0, WIDTH, HEIGHT).data;
    };
    const at = (data, x, y) => Array.from(data.slice((y * WIDTH + x) * 4, (y * WIDTH + x) * 4 + 3));
    const out = {};
    const quad = (material) => { const scene = new T.Scene(); scene.background = new T.Color(0, 0, 0); scene.add(new T.Mesh(new T.PlaneGeometry(WIDTH, HEIGHT), material)); return scene; };

    // 1. Blackbody emission: a 6500 K surface at unit radiance is the table colour, within half-float precision.
    const bb = new W.MeshBasicNodeMaterial({ fog: false });
    bb.colorNode = tsl.vec4(kit.blackbodyEmission(tsl.float(6500), 1), 1);
    const { r, g, b } = spectrum.blackbodyToSrgb(6500).srgb;
    out.blackbody = { got: at(await pixels(quad(bb)), 240, 160), want: [r, g, b].map((v) => Math.round(v * 255)) };

    // 2. Field heatmap: the value ramps across the quad, so the ends are the first and last palette entries (viridis).
    const field = kit.fieldMaterial({ valueNode: tsl.positionLocal.x, range: [-WIDTH / 2, WIDTH / 2], palette: "sequential", paletteName: "viridis" });
    const fieldPixels = await pixels(quad(field));
    const srgb = (linear) => Math.round(spectrum.linearSrgbToSrgb(linear) * 255);
    out.field = { left: at(fieldPixels, 1, 160), right: at(fieldPixels, WIDTH - 2, 160),
      wantLeft: palettes.sequentialEntry("viridis", 0).map(srgb), wantRight: palettes.sequentialEntry("viridis", 255).map(srgb) };

    // 3. Engraved grid: lines every 40 px, 2 px wide. The summed coverage across one line is its width (a 2 px line sampled at pixel
    // centres reads 0.25, 0.75, 0.75, 0.25).
    const grid = kit.engravedGridMaterial({ space: "local-xy", minor: 40, majorEvery: 0, widthPx: 2, color: "pigment-white" });
    const gridScene = quad(grid);
    gridScene.children[0].material.depthWrite = false;
    const gridPixels = await pixels(gridScene);
    // The page output is sRGB-encoded: decode to linear, where coverage composites on black and so reads back as the coverage itself.
    const linearCoverage = (encoded) => (encoded <= 0.04045 ? encoded / 12.92 : ((encoded + 0.055) / 1.055) ** 2.4);
    const luminance = (x, y) => linearCoverage(at(gridPixels, x, y)[1] / 255);
    let best = 0, bestX = 0;
    for (let x = 60; x < WIDTH - 60; x++) if (luminance(x, 100) > best) { best = luminance(x, 100); bestX = x; }
    out.grid = { peak: best, peakX: bestX, between: luminance(Math.min(WIDTH - 1, bestX + 20), 100) };
    let integral = 0;
    for (let x = bestX - 6; x <= bestX + 6; x++) integral += luminance(x, 100);
    out.grid.widthPx = integral;
    out.grid.profile = Array.from({ length: 9 }, (_, i) => +luminance(bestX - 4 + i, 100).toFixed(3));

    // 4. Data points: 12 px discs, count them by lit area.
    const positions = new Float32Array(20 * 3);
    for (let i = 0; i < 20; i++) { positions[i * 3] = (i % 5 - 2) * 60; positions[i * 3 + 1] = (Math.floor(i / 5) - 1.5) * 60; }
    const points = kit.createDataPoints({ positions, sizePx: 12, color: [1, 1, 1] });
    const pointScene = new T.Scene(); pointScene.background = new T.Color(0, 0, 0); pointScene.add(points.object);
    const pointPixels = await pixels(pointScene);
    let area = 0;
    for (let i = 0; i < pointPixels.length; i += 4) area += linearCoverage(pointPixels[i + 1] / 255);
    out.points = { area, want: 20 * Math.PI * 36 };
    renderer.dispose();
    return out;
  });
  const near = (got, want, tolerance) => got.forEach((value, i) => expect(Math.abs(value - want[i]), `${JSON.stringify(got)} vs ${JSON.stringify(want)}`).toBeLessThanOrEqual(tolerance));
  near(result.blackbody.got, result.blackbody.want, 3);
  near(result.field.left, result.field.wantLeft, 4);
  near(result.field.right, result.field.wantRight, 4);
  expect(result.grid.peak).toBeGreaterThan(0.5);
  expect(result.grid.between, "between lines the surface is empty").toBeLessThan(0.02);
  expect(Math.abs(result.grid.widthPx - 2), `grid line width ${result.grid.widthPx}, profile ${JSON.stringify(result.grid.profile)}`).toBeLessThanOrEqual(0.5);
  expect(Math.abs(result.points.area - result.points.want) / result.points.want, `disc area ${result.points.area}`).toBeLessThan(0.03);
  expect(errors).toEqual([]);
});
