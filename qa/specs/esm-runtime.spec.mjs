import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";
import { installDeterministicRandom } from "../lib/determinism.mjs";

test.use({ contextOptions: { reducedMotion: "reduce" }, viewport: { width: 1600, height: 1000 } });

function observe(page) {
  const errors = [];
  const failed = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("requestfailed", (req) => failed.push(req.url()));
  page.on("request", (req) => {
    if (req.url().startsWith("http") && new URL(req.url()).origin !== new URL(process.env.QA_BASE_URL).origin) {
      failed.push(`External runtime request: ${req.url()}`);
    }
  });
  page.on("response", (res) => { if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`); });
  return { errors, failed };
}

for (const view of ["overview", "gr", "bh"]) {
  test(`${view}: local ESM, one mount and compiled WebGL2 shaders`, async ({ page, context }) => {
    await installDeterministicRandom(context, 42);
    const observed = observe(page);
    await gotoReady(page, `/?view=${view}&seed=42`);
    await expect(page.locator("canvas.s3d-canvas, .atlas-stage canvas").first()).toBeVisible();
    const runtime = await page.evaluate(() => ({
      roots: document.querySelectorAll("#root").length,
      shells: document.querySelectorAll("#root > .shell").length,
      revision: THREE.REVISION,
      motion: document.documentElement.dataset.motion,
      webgl2: [...document.querySelectorAll("canvas.s3d-canvas, .atlas-stage canvas")]
        .every((canvas) => !!canvas.getContext("webgl2")),
    }));
    expect(runtime).toEqual({ roots: 1, shells: 1, revision: "186", motion: "reduced", webgl2: true });
    expect(observed).toEqual({ errors: [], failed: [] });
  });
}

test("legacy deep links, reload and back/forward preserve URL state and dispose old scenes", async ({ page, context }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1000, height: 700 });
  const observed = observe(page);
  await context.addInitScript(() => {
    const pending = new Set();
    const raf = window.requestAnimationFrame;
    const cancel = window.cancelAnimationFrame;
    window.requestAnimationFrame = (fn) => {
      const id = raf.call(window, (time) => { pending.delete(id); fn(time); });
      pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => { pending.delete(id); cancel.call(window, id); };
    window.__qaPendingFrames = pending;
  });
  await gotoReady(page, "/?view=gr&grp=null&grb=-0.55&grat=-2&grax=-2&grbt=2&grbx=2");
  const before = await page.evaluate(() => qgaReadState(location.search));
  await page.reload();
  await expect(page.locator(".s3d-canvas").first()).toBeVisible();
  expect(await page.evaluate(() => qgaReadState(location.search))).toEqual(before);
  const initialFrames = await page.evaluate(() => window.__qaPendingFrames.size);
  for (let i = 0; i < 3; i++) {
    const previous = await page.locator(".s3d-canvas").first().elementHandle();
    await page.getByRole("button", { name: /Black Holes/ }).first().click();
    await expect(page).toHaveURL(/view=bh/);
    expect(await previous.evaluate((canvas) => canvas.isConnected)).toBe(false);
    await previous.dispose();
    await page.goBack();
    await expect(page).toHaveURL(/view=gr/);
    await expect(page.locator(".s3d-canvas").first()).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/view=bh/);
    await expect(page.locator(".s3d-canvas").first()).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/view=gr/);
  }
  await expect.poll(() => page.evaluate(() => window.__qaPendingFrames.size)).toBeLessThanOrEqual(initialFrames);
  await expect(page.locator("#root > .shell")).toHaveCount(1);
  expect(observed).toEqual({ errors: [], failed: [] });
});

for (const webgl1 of [true, false]) {
  test(`${webgl1 ? "WebGL1-only" : "non-WebGL"} devices use the explicit analytical fallback`, async ({ page, context }) => {
    await context.addInitScript((allowWebGL1) => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        const blocked = type === "webgl2" || (!allowWebGL1 && (type === "webgl" || type === "experimental-webgl"));
        return blocked ? null : get.call(this, type, ...args);
      };
    }, webgl1);
    const observed = observe(page);
    await gotoReady(page, "/?view=bh");
    await expect(page.getByText("3D unavailable").first()).toBeVisible();
    await expect(page.getByText(/showing the 2D analytical view instead/).first()).toBeVisible();
    await expect(page.locator(".s3d-canvas")).toHaveCount(0);
    expect(observed).toEqual({ errors: [], failed: [] });
  });
}

test("slow ESM initialization still evaluates JSX once, in order", async ({ page }) => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route("**/vendor/three/build/three.module.js", async (route) => {
    await gate;
    await route.continue();
  });
  const observed = observe(page);
  await page.goto("/?view=overview", { waitUntil: "commit" });
  await expect(page.locator("#root")).toBeAttached();
  expect(await page.evaluate(() => document.getElementById("root").children.length)).toBe(0);
  release();
  await expect(page.locator("#root > .shell")).toHaveCount(1);
  await expect(page.locator(".atlas-stage canvas")).toBeVisible();
  expect(observed).toEqual({ errors: [], failed: [] });
});

test("all import-map entrypoints load locally without enabling a new backend", async ({ page }) => {
  const observed = observe(page);
  await gotoReady(page, "/?view=overview");
  const result = await page.evaluate(async () => {
    const [classic, webgpu, tsl] = await Promise.all([import("three"), import("three/webgpu"), import("three/tsl")]);
    return {
      sameCore: classic.Vector3 === webgpu.Vector3,
      gpuExport: typeof webgpu.WebGPURenderer,
      tslExport: typeof tsl.float,
      frozen: Object.isFrozen(window.THREE),
      hasGlobalGpu: "WebGPURenderer" in window.THREE,
    };
  });
  expect(result).toEqual({ sameCore: true, gpuExport: "function", tslExport: "function", frozen: true, hasGlobalGpu: false });
  expect(observed).toEqual({ errors: [], failed: [] });
});

test("a missing JSX source shows an actionable error without mounting React", async ({ page }) => {
  await page.route("**/js/physics.jsx", (route) => route.fulfill({ status: 404, body: "missing" }));
  await page.goto("/?view=overview");
  await expect(page.getByRole("alert")).toContainText("Cannot load js/physics.jsx: HTTP 404");
  await expect(page.getByRole("alert")).toContainText("self-hosted assets");
  await expect(page.locator("#root > .shell")).toHaveCount(0);
});

test("display compatibility retains additive alpha and disposes all composer passes", async ({ page }) => {
  const observed = observe(page);
  await gotoReady(page, "/?view=overview");
  const result = await page.evaluate(() => {
    const renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(16, 16);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
    camera.position.z = 2;
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff, opacity: 0.5, transparent: true, blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Mesh(geometry, material));
    renderer.render(scene, camera);
    const gl = renderer.getContext();
    const pixel = new Uint8Array(4);
    gl.readPixels(8, 8, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    const composer = qgaMakeComposer(renderer, scene, camera, 16, 16, {});
    let disposed = 0;
    for (const pass of composer.passes) {
      const dispose = pass.dispose.bind(pass);
      pass.dispose = () => { disposed++; dispose(); };
    }
    const blur = composer.passes[1].separableBlurMaterials[0].uniforms;
    if (!composer.passes[1].materialHighPassFilter.fragmentShader.includes("vec3( 0.299, 0.587, 0.114 )")) {
      throw new Error("Legacy bloom luminance compatibility is missing");
    }
    const weight = blur.centerWeight.value + 2 * blur.gaussianWeights.value.reduce((a, b) => a + b, 0);
    composer.dispose();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    return { alpha: pixel[3], disposed, weight };
  });
  expect(result.alpha).toBe(64);
  expect(result.disposed).toBe(3);
  expect(result.weight).toBeCloseTo(1, 12);
  expect(observed).toEqual({ errors: [], failed: [] });
});
