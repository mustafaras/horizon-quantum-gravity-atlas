import { test, expect, chromium } from "playwright/test";
import { writeFile } from "node:fs/promises";
import { gotoReady } from "./helpers.mjs";

test.use({ viewport: { width: 1200, height: 800 } });
async function evidence(info, name, value) {
  const file = info.outputPath(`${name}.json`);
  await writeFile(file, JSON.stringify(value, null, 2));
  await info.attach(name, { path: file, contentType: "application/json" });
}

function observe(page) {
  const errors = [], failures = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("requestfailed", (request) => failures.push(request.url()));
  page.on("response", (response) => { if (response.status() >= 400) failures.push(response.url()); });
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(process.env.QA_BASE_URL).origin) failures.push(request.url());
  });
  return { errors, failures };
}
const snapshots = (page) => page.evaluate(() => QGA_RENDER.renderDiagnostics.snapshot());
async function ready(page, timeout = 15_000) {
  await expect.poll(async () => (await snapshots(page)).filter((entry) => entry.phase !== "ready")
    .map((entry) => ({ phase: entry.phase, backend: entry.backend, messages: entry.messages })), { timeout }).toEqual([]);
}
async function force(context, backend) {
  await context.addInitScript((value) => { window.QGA_RENDER_OPTIONS = { forceBackend: value }; sessionStorage.setItem("horizon-intro", "1"); }, backend);
}

for (const view of ["overview", "gr", "bh"]) {
  test(`${view}: forced classic WebGL2 compiles actual scene shaders and reports active effects`, async ({ page, context }) => {
    await force(context, "webgl2");
    const observed = observe(page);
    await gotoReady(page, `/?view=${view}&seed=42`);
    await ready(page);
    const entries = await snapshots(page);
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.backend).toBe("webgl2");
      expect(entry.capabilities.rendererPath).toBe("classic");
      expect(entry.effects.find((effect) => effect.name === "base-render").status).toBe("enabled");
      expect(entry.effects.find((effect) => effect.name === "tone-mapping").status).toBe("enabled");
      expect(entry.effects.find((effect) => effect.name === "ssgi").status).not.toBe("enabled");
    }
    if (view === "bh") {
      const module = entries.find((entry) => entry.label !== "Atlas backdrop");
      expect(module.effects.find((effect) => effect.name === "ao").status).toBe("unsupported");
      expect(module.effects.find((effect) => effect.name === "depth-of-field").status).toBe("unsupported");
    }
    expect(observed).toEqual({ errors: [], failures: [] });
    await page.screenshot({ path: test.info().outputPath(`${view}-webgl2.png`) });
  });
}

test("forced static renders analytical content with actionable diagnostics and no 3D canvases", async ({ page, context }) => {
  await force(context, "static");
  const observed = observe(page);
  await gotoReady(page, "/?view=bh&bhm=2&bhs=0.5&seed=42");
  await expect(page.getByText("3D unavailable").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry 3D initialization" }).first()).toBeVisible();
  await expect(page.locator(".s3d-canvas, .atlas-stage canvas")).toHaveCount(0);
  expect((await snapshots(page)).every((entry) => entry.backend === "static")).toBe(true);
  expect(observed).toEqual({ errors: [], failures: [] });
});

test("legacy GLSL compatibility overrides advertised GPU capability, never forcing ShaderMaterial into nodes", async ({ page, context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "gpu", { configurable: true, value: { requestAdapter: async () => null } });
    sessionStorage.setItem("horizon-intro", "1");
  });
  const observed = observe(page);
  await gotoReady(page, "/?view=gr");
  await ready(page);
  const modules = (await snapshots(page)).filter((entry) => entry.label !== "Atlas backdrop");
  expect(modules.some((entry) => entry.capabilities.unsupportedMaterials.includes("ShaderMaterial"))).toBe(true);
  expect(modules.every((entry) => entry.backend === "webgl2" && entry.capabilities.rendererPath === "classic")).toBe(true);
  expect(observed).toEqual({ errors: [], failures: [] });
});

test("delayed initialization plus rapid navigation cancels stale scenes before reveal", async ({ page, context }) => {
  await force(context, "webgl2");
  await context.addInitScript(() => { window.__qaCompileGate = new Promise((resolve) => { window.__qaReleaseCompile = resolve; }); });
  await page.route("**/js/render/create-renderer.mjs", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      "if (scene && camera) await renderer.compileAsync(scene, camera);",
      "if (scene && camera) { await window.__qaCompileGate; await renderer.compileAsync(scene, camera); }",
    );
    await route.fulfill({ response, body });
  });
  const observed = observe(page);
  await page.goto("/?view=gr");
  await expect(page.locator("#root > .shell")).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Initializing renderer" }).first()).toBeVisible();
  await expect(page.locator(".s3d-canvas")).toHaveCount(0);
  await page.getByRole("button", { name: /Black Holes/ }).first().click();
  await page.evaluate(() => window.__qaReleaseCompile());
  await expect(page.locator(".s3d-canvas").first()).toBeVisible();
  await ready(page);
  expect((await snapshots(page)).filter((entry) => entry.label !== "Atlas backdrop").length).toBe(1);
  expect(observed).toEqual({ errors: [], failures: [] });
});

test("failed compile surfaces an actionable static fallback without unhandled rejection", async ({ page, context }) => {
  await force(context, "webgl2");
  await page.route("**/js/render/create-renderer.mjs", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      "if (scene && camera) await renderer.compileAsync(scene, camera);",
      'if (scene && camera) throw new Error("QA compile failure");',
    );
    await route.fulfill({ response, body });
  });
  const observed = observe(page);
  await gotoReady(page, "/?view=bh");
  await expect(page.getByRole("alert").first()).toContainText("QA compile failure");
  await expect(page.locator(".s3d-canvas")).toHaveCount(0);
  expect(observed).toEqual({ errors: [], failures: [] });
});

test("runtime budget changes resize real drawing buffers and reduce rendered points without changing physics state", async ({ page, context }) => {
  await force(context, "webgl2");
  const observed = observe(page);
  await gotoReady(page, "/?view=overview&seed=42");
  await ready(page);
  const result = await page.evaluate(async () => {
    const { initializeRenderSession } = await import("./js/render/render-session.mjs");
    const mount = document.createElement("div");
    mount.style.cssText = "position:fixed;width:160px;height:100px;top:0;left:0";
    document.body.append(mount);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(24000 * 3), 3));
    const material = new THREE.PointsMaterial({ size: 0.02 });
    scene.add(new THREE.Points(geometry, material));
    const abort = new AbortController();
    const id = QGA_RENDER.renderDiagnostics.allocate("QA budgets");
    const state = JSON.stringify(qgaReadState());
    const session = await initializeRenderSession({
      scene, camera, mount, settings: { detail3d: "ultra", vizMode: "minimal", motion: "full", renderBackend: "webgl2" },
      view: "qa-budget", signal: abort.signal, diagnosticId: id, onError: (error) => { throw error; },
    });
    material.needsUpdate = true;
    session.render(0.016, 1000, false);
    session.resize();
    await new Promise((resolve, reject) => {
      const start = performance.now();
      const check = () => {
        const phase = QGA_RENDER.renderDiagnostics.snapshot().find((entry) => entry.id === id)?.phase;
        if (phase === "ready") resolve();
        else if (performance.now() - start > 10_000) reject(new Error("Material rebuild did not become ready"));
        else requestAnimationFrame(check);
      };
      check();
    });
    session.renderer.setPixelRatio(2);
    session.resize();
    const before = { width: session.renderer.domElement.width, particles: geometry.drawRange.count };
    let time = 5000;
    for (let window = 0; window < 16; window++) {
      for (let i = 0; i < 60; i++) session.render(0.05, time += 1000, true, 1000);
      time += 4000;
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    const after = { width: session.renderer.domElement.width, particles: geometry.drawRange.count };
    const fps = QGA_RENDER.renderDiagnostics.snapshot().find((entry) => entry.id === id)?.fps;
    abort.abort();
    await session.dispose();
    await session.dispose();
    geometry.dispose(); material.dispose(); mount.remove(); QGA_RENDER.renderDiagnostics.remove(id);
    return { before, after, fps, unchanged: state === JSON.stringify(qgaReadState()), connected: session.renderer.domElement.isConnected };
  });
  expect(result.after.width).toBeLessThan(result.before.width);
  expect(result.after.particles).toBeLessThan(result.before.particles);
  expect(result.fps).toBe(1);
  expect(result.unchanged).toBe(true);
  expect(result.connected).toBe(false);
  await evidence(test.info(), "applied-budget-changes", result);
  expect(observed).toEqual({ errors: [], failures: [] });
});

test("context loss disposes rendering, preserves analytical content, and resize remains healthy beforehand", async ({ page, context }) => {
  await force(context, "webgl2");
  const observed = observe(page);
  await gotoReady(page, "/?view=bh");
  await ready(page);
  await page.setViewportSize({ width: 1000, height: 720 });
  await page.locator(".s3d-canvas").first().evaluate((canvas) => canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(page.getByText("3D unavailable").first()).toBeVisible();
  await expect(page.getByRole("alert").first()).toContainText("context lost");
  await expect(page.locator(".s3d-canvas")).toHaveCount(0);
  expect(observed).toEqual({ errors: [], failures: [] });
});

test("real WebGPU availability is measured, not inferred from mocks", async ({ page }, info) => {
  const observed = observe(page);
  await gotoReady(page, "/?view=overview");
  await ready(page);
  const evidence = await page.evaluate(async () => {
    const adapter = navigator.gpu ? await navigator.gpu.requestAdapter() : null;
    return { hasNavigatorGpu: !!navigator.gpu, hasAdapter: !!adapter,
      adapter: adapter ? { vendor: adapter.info.vendor, architecture: adapter.info.architecture, device: adapter.info.device, description: adapter.info.description, isFallbackAdapter: adapter.info.isFallbackAdapter } : null,
      entries: QGA_RENDER.renderDiagnostics.snapshot() };
  });
  const file = info.outputPath("webgpu-availability.json");
  await writeFile(file, JSON.stringify(evidence, null, 2));
  await info.attach("webgpu-availability", { path: file, contentType: "application/json" });
  if (evidence.hasAdapter) expect(evidence.entries.find((entry) => entry.label === "Atlas backdrop").backend).toBe("webgpu");
  else expect(evidence.entries.every((entry) => entry.backend !== "webgpu")).toBe(true);
  expect(observed).toEqual({ errors: [], failures: [] });
});

test.describe("real WebGPU API on a software adapter (not hardware evidence)", () => {
  test("atlas and mapped Standard Model scenes initialize native WebGPU and switch all presets", async ({}, info) => {
    test.setTimeout(240_000);
    const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-webgpu"] });
    const context = await browser.newContext({ baseURL: process.env.QA_BASE_URL, viewport: { width: 1200, height: 800 } });
    await context.addInitScript(() => {
      window.__qaDeviceDestroyCount = 0;
      window.__qaUnexpectedDeviceLosses = [];
      if (typeof GPUAdapter !== "undefined") {
        const request = GPUAdapter.prototype.requestDevice;
        GPUAdapter.prototype.requestDevice = async function (...args) {
          const device = await request.apply(this, args);
          void device.lost.then((info) => {
            if (info.reason !== "destroyed") window.__qaUnexpectedDeviceLosses.push({ reason: info.reason, message: info.message });
          });
          return device;
        };
      }
      if (typeof GPUDevice === "undefined") return;
      const destroy = GPUDevice.prototype.destroy;
      GPUDevice.prototype.destroy = function () {
        window.__qaDeviceDestroyCount++;
        return destroy.call(this);
      };
    });
    const page = await context.newPage();
    try {
    await page.route("**/gpu-probe", (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>GPU probe</title>" }));
    await page.goto("/gpu-probe");
    const availability = await page.evaluate(async () => {
      if (!navigator.gpu) return { available: false, reason: "navigator.gpu absent" };
      const result = await Promise.race([
        navigator.gpu.requestAdapter().then((adapter) => adapter ? { available: true, vendor: adapter.info.vendor, architecture: adapter.info.architecture, isFallbackAdapter: adapter.info.isFallbackAdapter } : { available: false, reason: "no adapter" }),
        new Promise((resolve) => setTimeout(() => resolve({ available: false, reason: "adapter request did not settle within 5 seconds" }), 5000)),
      ]);
      return result;
    });
    await evidence(info, "software-webgpu-availability", availability);
    test.skip(!availability.available, `Actual software WebGPU unavailable: ${availability.reason}`);
    await context.addInitScript(() => { sessionStorage.setItem("horizon-intro", "1"); });
    const observed = observe(page);
    await gotoReady(page, "/?view=sm&seed=42");
    await ready(page, 120_000);
    const initialized = await snapshots(page);
    await evidence(info, "initial-native-and-bounded-fallback-matrix", initialized);
    for (const entry of initialized.filter((entry) => entry.backend !== "webgpu")) {
      expect(entry.backend).toBe("webgl2");
      expect(entry.messages.some((message) => /(?:webgpu initialization\/compile failed:|Node pipeline compilation failed:).*Retrying classic WebGL2 once/.test(message))).toBe(true);
    }
    if (!initialized.some((entry) => entry.backend === "webgpu")) {
      const losses = await page.evaluate(() => window.__qaUnexpectedDeviceLosses);
      await evidence(info, "unexpected-software-device-losses", losses);
      expect(initialized.length).toBeGreaterThan(0);
      const unexpected = observed.errors.filter((message) => !/Instance dropped in popErrorScope/.test(message));
      expect({ errors: unexpected, failures: observed.failures }).toEqual({ errors: [], failures: [] });
      test.skip(losses.length > 0, `Real software GPU device lost: ${JSON.stringify(losses)}; explicit classic fallback verified, native GPU rendering unavailable on this runner`);
    }
    expect(initialized.some((entry) => entry.backend === "webgpu")).toBe(true);
    await page.getByRole("button", { name: "Rendering settings" }).first().click();
    await page.getByLabel("Motion", { exact: true }).selectOption("full");
    for (const preset of ["scientific", "minimal", "capture", "cinematic"]) {
      await page.getByLabel("Mode", { exact: true }).selectOption(preset);
      await expect.poll(async () => (await snapshots(page)).every((entry) => entry.phase === "ready" && entry.renderPreset === preset), { timeout: 90_000 }).toBe(true);
      const entries = await snapshots(page);
      expect(entries.every((entry) => entry.backend === "webgpu")).toBe(true);
      if (preset === "minimal") expect(entries.every((entry) => entry.effects.filter((effect) => effect.status === "enabled").length === 2)).toBe(true);
      if (preset === "capture") expect(entries.every((entry) => entry.effects.find((effect) => effect.name === "ssgi").status === "enabled")).toBe(true);
      await evidence(info, `${preset}-active-effects`, entries);
    }
    const adapter = await page.evaluate(async () => {
      const adapter = await navigator.gpu.requestAdapter();
      return { vendor: adapter.info.vendor, architecture: adapter.info.architecture, isFallbackAdapter: adapter.info.isFallbackAdapter };
    });
    await evidence(info, "software-adapter-identity", adapter);
    expect(adapter.isFallbackAdapter).toBe(true);
    await page.getByRole("button", { name: "Close tweaks" }).click();
    await page.screenshot({ path: info.outputPath("sm-native-webgpu-software.png") });
    const performanceEvidence = await page.evaluate(async () => {
      const frames = [];
      const start = performance.now();
      let last;
      await new Promise((resolve) => {
        function sample(now) {
          if (last !== undefined) frames.push(now - last);
          last = now;
          if (frames.length >= 30 || (frames.length && now - start >= 15_000)) resolve();
          else requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      });
      const sorted = [...frames].sort((a, b) => a - b);
      return { samples: frames.length, meanMs: frames.reduce((a, b) => a + b, 0) / frames.length,
        p95Ms: sorted[Math.floor(sorted.length * 0.95)], diagnostics: QGA_RENDER.renderDiagnostics.snapshot() };
    });
    await evidence(info, "software-webgpu-frame-times", performanceEvidence);
    const before = await page.evaluate(() => window.__qaDeviceDestroyCount);
    await page.getByRole("button", { name: "Rendering settings" }).first().click();
    await page.getByLabel("Render backend", { exact: true }).selectOption("static");
    await expect.poll(async () => (await snapshots(page)).every((entry) => entry.backend === "static")).toBe(true);
    await expect.poll(() => page.evaluate(() => window.__qaDeviceDestroyCount)).toBeGreaterThan(before);
    await expect(page.locator(".s3d-canvas, .atlas-stage canvas")).toHaveCount(0);
    expect(observed).toEqual({ errors: [], failures: [] });
    } finally { await browser.close(); }
  });
});
