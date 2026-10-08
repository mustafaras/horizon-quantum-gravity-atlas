import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ contextOptions: { reducedMotion: "reduce" }, viewport: { width: 1200, height: 800 } });

test("system preference overrides full motion, including pipeline grain, temporal effects and focus travel", async ({ page, context }) => {
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
  const image = await page.locator(".s3d-canvas").first().screenshot();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect((await page.locator(".s3d-canvas").first().screenshot()).equals(image), "reduced-motion renderer pixels must remain static").toBe(true);
  expect(errors).toEqual([]);
  expect(loadingErrors()).toEqual([]);
});

test("runtime system reduced-motion change rebuilds safely and leaves interactive keyboard access", async ({ page, context }) => {
  test.setTimeout(180_000);
  await context.addInitScript(() => { window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2" }; sessionStorage.setItem("horizon-intro", "1"); });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await gotoReady(page, "/?view=bh");
  await expect(page.locator(".s3d-canvas").first()).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(async () => page.evaluate(() => QGA_RENDER.renderDiagnostics.snapshot().every((entry) => entry.phase === "ready" && entry.reducedMotion)), { timeout: 120_000 }).toBe(true);
  const stage = page.locator(".s3d-stage").first();
  await stage.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("r");
  await expect(stage).toBeFocused();
  expect(await page.locator(".s3d-canvas").count()).toBe(1);
});
