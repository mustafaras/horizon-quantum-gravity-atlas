import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ contextOptions: { reducedMotion: "reduce" }, viewport: { width: 1200, height: 800 } });

test("system preference overrides full motion, including pipeline grain, temporal effects and focus travel", async ({ page, context }) => {
  test.setTimeout(180_000);
  await context.addInitScript(() => {
    window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2" };
    sessionStorage.setItem("horizon-intro", "1");
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const loadingErrors = await gotoReady(page, "/?view=gr&seed=42");
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  await expect(page.locator(".s3d-canvas").first()).toBeVisible();
  await page.getByRole("button", { name: "Rendering settings" }).first().click();
  await page.getByLabel("Motion", { exact: true }).selectOption("full");
  expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBe("reduced");
  const entries = await page.evaluate(() => QGA_RENDER.renderDiagnostics.snapshot());
  for (const entry of entries) {
    expect(entry.reducedMotion).toBe(true);
    expect(entry.quality.temporalSamples).toBe(1);
    for (const effect of entry.effects) {
      if (!["base-render", "tone-mapping"].includes(effect.name)) expect(effect.status).not.toBe("enabled");
    }
  }
  await page.getByRole("button", { name: "Close tweaks" }).click();
  await page.getByRole("button", { name: "Pause simulation", exact: true }).first().click();
  // The shared stage draws on demand: the pause and the closing settings panel owe the scene a few settling
  // frames, so first wait until the pixels stop changing, then require them (and the frame count) to stay put.
  const shot = () => page.locator(".s3d-canvas").first().screenshot();
  const drawn = () => page.evaluate(() => QGA_RENDER.stageDiagnostics.snapshot().flatMap((s) => s.views).reduce((sum, v) => sum + v.frames, 0));
  let previous = await shot();
  await expect.poll(async () => { const now = await shot(); const same = now.equals(previous); previous = now; return same; },
    { intervals: [500], timeout: 20_000 }).toBe(true);
  const framesBefore = await drawn();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect((await shot()).equals(previous), "reduced-motion renderer pixels must remain static").toBe(true);
  expect(await drawn(), "reduced-motion paused scene draws no frames").toBe(framesBefore);
  expect(errors).toEqual([]);
  expect(loadingErrors()).toEqual([]);
});

test("runtime system reduced-motion change rebuilds safely and leaves interactive keyboard access", async ({ page, context }) => {
  test.setTimeout(180_000);
  await context.addInitScript(() => { window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2" }; sessionStorage.setItem("horizon-intro", "1"); });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  // Full motion animates continuously, so "animation-settled" is not a valid
  // precondition here; wait for mounted, compiled renderers instead.
  await gotoReady(page, "/?view=sm", ["fonts", "network-idle", "view-mounted"]);
  await expect.poll(async () => page.evaluate(() => {
    const entries = QGA_RENDER.renderDiagnostics.snapshot();
    return entries.length > 0 && entries.every((entry) => entry.phase === "ready" && !entry.reducedMotion);
  }), { timeout: 120_000 }).toBe(true);
  await expect(page.locator(".s3d-canvas").first()).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(async () => page.evaluate(() => {
    const entries = QGA_RENDER.renderDiagnostics.snapshot();
    return entries.length > 0 && entries.every((entry) => entry.phase === "ready" && entry.reducedMotion);
  }), { timeout: 120_000 }).toBe(true);
  const stage = page.locator(".s3d-stage").first();
  await stage.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("r");
  await expect(stage).toBeFocused();
  // The view may mount several scenes (e.g. the collider display on the
  // Standard Model view); assert no orphan canvas is left by the rebuild.
  // The retiring canvas is removed only after the GPU queue drains (async),
  // so allow the swap window to settle before asserting.
  await expect.poll(async () => {
    const canvases = await page.locator(".s3d-canvas").count();
    const stages = await page.locator(".s3d-stage").count();
    return canvases === stages;
  }, { timeout: 15_000 }).toBe(true);
});
