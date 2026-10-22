// Shared GPU stage (S04; closes F-21, F-22, F-23).
//
// With QGA_RENDER_OPTIONS.stage = "shared" the pilots (Atlas backdrop and the two QFT Fourier/field scenes) run
// on one frame loop: one renderer with a CanvasTarget per canvas on WebGPU, at most `maxContexts` live
// renderers on WebGL2. Static scenes must not draw. Captures must still be non-blank now that the WebGL drawing
// buffer is no longer preserved.
//
//   webgl2  the CI gate (WebGPU is disabled there).
//   webgpu  runs only when the browser exposes a WebGPU adapter; otherwise annotated and skipped.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ viewport: { width: 1200, height: 800 } });
test.setTimeout(240_000);
const READINESS = ["fonts", "network-idle", "view-mounted"];

function observe(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  return errors;
}
async function configure(context, options) {
  await context.addInitScript((value) => {
    window.QGA_RENDER_OPTIONS = { softwareClamp: false, ...value };
    sessionStorage.setItem("horizon-intro", "1");
  }, options);
}
const stage = (page, kind) => page.evaluate((k) => QGA_RENDER.stageDiagnostics.snapshot().find((s) => s.kind === k) ?? null, kind);
const phases = (page) => page.evaluate(() => QGA_RENDER.renderDiagnostics.snapshot().map((e) => ({ label: e.label, phase: e.phase, backend: e.backend })));
async function settle(page, kind, minViews) {
  await expect.poll(async () => {
    const s = await stage(page, kind);
    return s ? s.views.length : 0;
  }, { timeout: 90_000 }).toBeGreaterThanOrEqual(minViews);
  await expect.poll(async () => (await phases(page)).every((e) => ["ready", "suspended"].includes(e.phase)), { timeout: 90_000 }).toBe(true);
}
/** Draws every captured scene canvas into a 2-D canvas and reports how many distinct pixels it has. */
const captureStats = (page) => page.evaluate(() => [...window.__qgaActiveScenes].map((handle) => {
  const canvas = handle.capture();
  if (!canvas) return { captured: false };
  const probe = document.createElement("canvas");
  probe.width = Math.min(canvas.width, 240); probe.height = Math.min(canvas.height, 160);
  const context = probe.getContext("2d");
  context.drawImage(canvas, 0, 0, probe.width, probe.height);
  const data = context.getImageData(0, 0, probe.width, probe.height).data;
  const seen = new Set();
  let lit = 0;
  for (let i = 0; i < data.length; i += 4) { seen.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]); if (data[i] + data[i + 1] + data[i + 2] > 24) lit += 1; }
  return { captured: true, width: canvas.width, height: canvas.height, distinct: seen.size, lit };
}));

test("webgl2: the QFT view keeps at most 4 live contexts and its static scenes draw nothing while idle", async ({ page, context }) => {
  await configure(context, { forceBackend: "webgl2", stage: "shared" });
  // Reduced motion removes cinematic drift and the backdrop's animation, so a paused scene can truly go idle.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = observe(page);
  await gotoReady(page, "/?view=qft&seed=42", READINESS);
  await settle(page, "webgl2", 2);
  const s = await stage(page, "webgl2");
  expect(s.contextLimit).toBe(4);
  expect(s.renderers, "pooled WebGL2 contexts").toBeLessThanOrEqual(4);
  expect(await page.evaluate(() => QGA_RENDER.renderDiagnostics.liveRenderers()), "every live renderer on the page, pooled or not").toBeLessThanOrEqual(4);
  expect(s.views.some((v) => v.label.startsWith("Atlas backdrop")), "backdrop is a pilot").toBe(true);
  expect(s.views.some((v) => /scalar field membrane/.test(v.label)), "field membrane is a pilot").toBe(true);
  expect(s.views.some((v) => /Fourier modes/.test(v.label)), "Fourier vacuum lab is a pilot").toBe(true);

  // Pause every scene (the backdrop follows the Motion setting, so it is handled separately) and let the loop go idle.
  // Pause the scene at the top of the page (clicking the others would scroll it out of view).
  await page.getByRole("button", { name: "Pause simulation" }).first().click();
  await expect.poll(async () => (await stage(page, "webgl2")).views.filter((v) => /scalar field/.test(v.label) && v.visible).every((v) => !v.animated && !v.dirty), { timeout: 20_000 }).toBe(true);
  const before = await stage(page, "webgl2");
  await page.waitForTimeout(2000);
  const after = await stage(page, "webgl2");
  expect(before.views.some((x) => /scalar field/.test(x.label) && x.visible), "a visible paused scene is under test").toBe(true);
  for (const v of before.views.filter((x) => /scalar field/.test(x.label) && x.visible)) {
    expect(after.views.find((x) => x.id === v.id).frames, `${v.label}: frames drawn during 2 s idle`).toBe(v.frames);
  }
  expect(errors).toEqual([]);
});

test("webgl2: a context budget below the scene count parks unseen scenes, then snapshots, releases and restores on demand", async ({ page, context }) => {
  await configure(context, { forceBackend: "webgl2", stage: "shared", maxContexts: 2 });
  const errors = observe(page);
  await gotoReady(page, "/?view=qft&seed=42", READINESS);
  await settle(page, "webgl2", 3);
  let s = await stage(page, "webgl2");
  expect(s.contextLimit).toBe(2);
  expect(s.renderers, "pooled WebGL2 contexts").toBeLessThanOrEqual(2);
  const vacuum = () => stage(page, "webgl2").then((st) => st.views.find((v) => /Fourier modes/.test(v.label)));
  expect((await vacuum()).live, "the scene below the fold has no context yet").toBe(false);
  expect(await page.evaluate(() => QGA_RENDER.renderDiagnostics.snapshot().find((e) => /Fourier modes/.test(e.label)).phase)).toBe("suspended");

  // Scroll it into view: the pool must give it a context by snapshotting and releasing another scene.
  await page.evaluate(() => {
    document.querySelector('.s3d-stage[aria-label*="Fourier modes"]')?.scrollIntoView({ block: "center" });
  });
  await expect.poll(async () => (await vacuum()).live, { timeout: 90_000 }).toBe(true);
  await expect.poll(async () => (await phases(page)).every((e) => ["ready", "suspended"].includes(e.phase)), { timeout: 60_000 }).toBe(true);
  s = await stage(page, "webgl2");
  expect(s.renderers, "pooled WebGL2 contexts after the swap").toBeLessThanOrEqual(2);
  expect(s.views.filter((v) => !v.live).length, "one scene gave its context back").toBeGreaterThanOrEqual(1);
  await expect(page.locator("img[data-qga-snapshot]").first(), "the released scene shows its last frame").toBeAttached();
  const snapshot = await page.evaluate(() => { const img = document.querySelector("img[data-qga-snapshot]"); return img ? { w: img.naturalWidth, h: img.naturalHeight } : null; });
  expect(snapshot?.w).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("webgl2: the tightest budget (1 context) still settles: no deadlock, the displaced scene keeps its last frame", async ({ page, context }) => {
  await configure(context, { forceBackend: "webgl2", stage: "shared", maxContexts: 1 });
  const errors = observe(page);
  await gotoReady(page, "/?view=qft&seed=42", READINESS);
  await settle(page, "webgl2", 3);
  const s = await stage(page, "webgl2");
  expect(s.renderers, "pooled WebGL2 contexts").toBe(1);
  expect(s.views.filter((v) => v.live).length).toBe(1);
  await expect(page.locator("img[data-qga-snapshot]").first(), "the displaced scene shows its last frame").toBeAttached();
  expect(errors).toEqual([]);
});

test("webgl2: captures are non-blank without preserveDrawingBuffer, with and without the shared stage", async ({ page, context }) => {
  for (const mode of ["classic", "shared"]) {
    const fresh = await page.context().browser().newContext({ viewport: { width: 1200, height: 800 } });
    const p = await fresh.newPage();
    await configure(fresh, mode === "shared" ? { forceBackend: "webgl2", stage: "shared" } : { forceBackend: "webgl2" });
    const errors = observe(p);
    await gotoReady(p, "/?view=qft&seed=42", READINESS);
    await expect.poll(async () => (await phases(p)).length >= 2 && (await phases(p)).every((e) => e.phase === "ready"), { timeout: 90_000 }).toBe(true);
    await p.waitForTimeout(1500);
    const stats = await captureStats(p);
    expect(stats.length, `${mode}: registered scenes`).toBeGreaterThanOrEqual(1);
    for (const st of stats) {
      expect(st.captured, `${mode}: capture() returned a canvas`).toBe(true);
      expect(st.distinct, `${mode}: distinct colours`).toBeGreaterThan(8);
      expect(st.lit, `${mode}: lit pixels`).toBeGreaterThan(50);
    }
    expect(errors).toEqual([]);
    await fresh.close();
  }
});

test("webgpu: one renderer serves every pilot canvas, static scenes draw nothing, GPU time is measured", async ({ page, context }) => {
  await configure(context, { forceBackend: "webgpu", stage: "shared" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/favicon.svg");
  const gpu = await page.evaluate(async () => {
    const adapter = navigator.gpu ? await navigator.gpu.requestAdapter().catch(() => null) : null;
    return { available: !!adapter, timestamps: !!adapter?.features.has("timestamp-query") };
  });
  const hasWebGPU = gpu.available;
  if (!hasWebGPU) {
    test.info().annotations.push({ type: "backend-unavailable", description: "no WebGPU adapter in this browser; the webgl2 cases are the CI gate" });
    test.skip(true, "no WebGPU adapter in this browser");
    return;
  }
  const errors = observe(page);
  await gotoReady(page, "/?view=qft&seed=42", READINESS);
  await settle(page, "webgpu", 4);
  const s = await stage(page, "webgpu");
  expect(s.renderers, "live WebGPU renderers").toBe(1);
  expect(await page.evaluate(() => QGA_RENDER.renderDiagnostics.liveRenderers()), "every renderer on the page: the QFT view needs exactly one (S05 target, was 4)").toBe(1);
  expect(s.views.every((v) => v.live)).toBe(true);
  expect((await phases(page)).every((e) => e.backend === "webgpu")).toBe(true);
  if (gpu.timestamps) {
    // F-23: the governor is fed resolved GPU render time, not just CPU frame time.
    await expect.poll(async () => (await stage(page, "webgpu")).views.some((v) => v.gpuMs > 0), { timeout: 60_000 }).toBe(true);
  } else {
    test.info().annotations.push({ type: "no-timestamp-query", description: "adapter lacks timestamp-query; the governor stays on CPU time" });
  }
  // Pause the scene at the top of the page (clicking the others would scroll it out of view).
  await page.getByRole("button", { name: "Pause simulation" }).first().click();
  await expect.poll(async () => (await stage(page, "webgpu")).views.filter((v) => /scalar field/.test(v.label) && v.visible).every((v) => !v.animated && !v.dirty), { timeout: 20_000 }).toBe(true);
  const before = await stage(page, "webgpu");
  await page.waitForTimeout(2000);
  const after = await stage(page, "webgpu");
  expect(before.views.some((x) => /scalar field/.test(x.label) && x.visible), "a visible paused scene is under test").toBe(true);
  for (const v of before.views.filter((x) => /scalar field/.test(x.label) && x.visible)) {
    expect(after.views.find((x) => x.id === v.id).frames, `${v.label}: frames drawn during 2 s idle`).toBe(v.frames);
  }
  for (const st of await captureStats(page)) { expect(st.captured).toBe(true); expect(st.distinct).toBeGreaterThan(8); }
  expect(errors).toEqual([]);
});

const totalFrames = (stages) => stages.flatMap((s) => s.views).reduce((sum, v) => sum + v.frames, 0);
const allStages = (page) => page.evaluate(() => QGA_RENDER.stageDiagnostics.snapshot());

test("default: the shared stage is on without any option, and ?stage=legacy gives every scene its own renderer", async ({ browser }) => {
  for (const [name, url, expectStage] of [["default", "/?view=qft&seed=42", true], ["legacy", "/?view=qft&seed=42&stage=legacy", false]]) {
    const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
    await context.addInitScript(() => { window.QGA_RENDER_OPTIONS = { softwareClamp: false, forceBackend: "webgl2" }; sessionStorage.setItem("horizon-intro", "1"); });
    const page = await context.newPage();
    const errors = observe(page);
    await gotoReady(page, url, READINESS);
    await expect.poll(async () => { const e = await phases(page); return e.length >= 4 && e.every((x) => ["ready", "suspended"].includes(x.phase)); }, { timeout: 120_000 }).toBe(true);
    const stages = await allStages(page);
    expect(stages.length > 0, `${name}: stage registered`).toBe(expectStage);
    expect(await page.evaluate(() => QGA_RENDER.renderDiagnostics.liveRenderers()), `${name}: live renderers`).toBeLessThanOrEqual(4);
    expect(errors, name).toEqual([]);
    await context.close();
  }
});

test("webgl2: under reduced motion a paused QFT view is fully idle: no view of the stage draws a frame", async ({ page, context }) => {
  await configure(context, { forceBackend: "webgl2" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = observe(page);
  await gotoReady(page, "/?view=qft&seed=42", READINESS);
  await settle(page, "webgl2", 3);
  await page.getByRole("button", { name: "Pause simulation" }).first().click();
  // Frames drawn by every view (backdrop, membrane, collision event, vacuum lab) stop growing.
  let last = -1, still = 0;
  await expect.poll(async () => { const n = totalFrames(await allStages(page)); still = n === last ? still + 1 : 0; last = n; return still; }, { timeout: 60_000, intervals: [700] }).toBeGreaterThanOrEqual(3);
  const before = totalFrames(await allStages(page));
  await page.waitForTimeout(2000);
  expect(totalFrames(await allStages(page)) - before, "frames drawn by all views in 2 s idle").toBe(0);
  expect(errors).toEqual([]);
});

test("webgl2: the Kerr observatory draws until its accumulation converges, then idles", async ({ page, context }) => {
  await configure(context, { forceBackend: "webgl2" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = observe(page);
  await gotoReady(page, "/?view=bh&seed=42", READINESS);
  await settle(page, "webgl2", 2);
  await expect.poll(() => page.evaluate(() => window.__qgaKerrRuntime?.converged === true), { timeout: 180_000 }).toBe(true);
  const kerr = async () => (await allStages(page)).flatMap((st) => st.views).find((v) => /Ray-traced Kerr/.test(v.label));
  await expect.poll(async () => (await kerr()).animated, { timeout: 30_000 }).toBe(false);
  const before = (await kerr()).frames;
  await page.waitForTimeout(2000);
  expect((await kerr()).frames - before, "Kerr frames drawn in 2 s once converged").toBe(0);
  expect(errors).toEqual([]);
});

test("webgl2: the GW spacetime lattice is static while the transport is stopped", async ({ page, context }) => {
  await configure(context, { forceBackend: "webgl2" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = observe(page);
  await gotoReady(page, "/?view=exp&seed=42", READINESS);
  await settle(page, "webgl2", 2);
  await page.evaluate(() => document.querySelector('.s3d-stage[aria-label*="spacetime lattice"]')?.scrollIntoView({ block: "center" }));
  const lattice = async () => (await allStages(page)).flatMap((st) => st.views).find((v) => /spacetime lattice/.test(v.label));
  await expect.poll(async () => { const v = await lattice(); return v?.visible && v.live; }, { timeout: 90_000 }).toBe(true);
  await expect.poll(async () => (await lattice()).animated, { timeout: 30_000 }).toBe(false);
  const before = (await lattice()).frames;
  await page.waitForTimeout(2000);
  expect((await lattice()).frames - before, "lattice frames drawn in 2 s with the transport stopped").toBe(0);
  expect(errors).toEqual([]);
});
