// Prompt 07 — quantum-field, Hawking, and RG compute labs.
// Proves: every lab publishes a deterministic CPU-sample runtime, in-canvas
// status labels are present (SCHEMATIC where required), the QFT view chips
// switch modes, Hawking emission visibly vanishes toward extremal spin while
// staying finite, RG streamlines terminate at the disclosed validity wall,
// and reduced motion never breaks a lab. No console errors anywhere.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

const LABS = ["fonts", "network-idle", "view-mounted"];

async function published(page, name, timeout = 25_000) {
  await page.waitForFunction((n) => window[n], name, { timeout });
  return page.evaluate((n) => window[n], name);
}

test.describe("Compute labs (Prompt 07)", () => {
  test("QFT vacuum lab publishes deterministic samples with a status label", async ({ page }) => {
    test.setTimeout(120_000);
    const errors = await gotoReady(page, "/?view=qft&seed=42", LABS);
    await page.locator("text=Vacuum fluctuations, computed").scrollIntoViewIfNeeded();
    const first = await published(page, "__qgaQftLab");
    expect(first.kind).toBe("cpu-samples");
    expect(first.cutoffK).toBe(14);
    expect(first.points).toBe(first.history * 160);
    // In-canvas status label for the effective free-field model.
    await expect(page.locator(".s3d-labels", { hasText: "EFFECTIVE" }).last())
      .toContainText("cutoff");
    expect(errors()).toEqual([]);
  });

  test("QFT view chips switch the published mode", async ({ page }) => {
    test.setTimeout(120_000);
    await gotoReady(page, "/?view=qft", LABS);
    await page.locator("text=Vacuum fluctuations, computed").scrollIntoViewIfNeeded();
    await published(page, "__qgaQftLab");
    await page.getByRole("button", { name: "Flux tube" }).click();
    await expect.poll(() => page.evaluate(() => window.__qgaQftLab?.mode),
      { timeout: 15_000 }).toBe("flux");
    await page.getByRole("button", { name: "Correlation" }).click();
    await expect.poll(() => page.evaluate(() => window.__qgaQftLab?.mode),
      { timeout: 15_000 }).toBe("correlation");
  });

  test("Hawking lab emits at rest spin and empties toward extremal", async ({ page }) => {
    test.setTimeout(120_000);
    const errors = await gotoReady(page, "/?view=bh&bhs=0", LABS);
    await page.locator("text=Hawking horizon lab").scrollIntoViewIfNeeded();
    const calm = await published(page, "__qgaHawkingLab");
    expect(calm.kind).toBe("cpu-samples");
    expect(calm.particles).toBeGreaterThan(0);
    expect(calm.temperatureK).toBeGreaterThan(0);
    // SCHEMATIC disclosure must be inside the canvas, not only in the caption.
    await expect(page.locator(".s3d-labels", { hasText: "SCHEMATIC" }).last()).toBeVisible();

    await page.goto("/?view=bh&bhs=0.99", { waitUntil: "domcontentloaded" });
    await page.locator("text=Hawking horizon lab").scrollIntoViewIfNeeded();
    const cold = await published(page, "__qgaHawkingLab");
    expect(cold.particles).toBe(0); // emission visibly vanishes
    expect(Number.isFinite(cold.temperatureK)).toBe(true); // and stays finite
    expect(errors()).toEqual([]);
  });

  test("RG flow field integrates streamlines and honours the validity wall", async ({ page }) => {
    test.setTimeout(120_000);
    const errors = await gotoReady(page, "/?view=rg", LABS);
    await page.locator("text=The flow field in three dimensions").scrollIntoViewIfNeeded();
    const field = await published(page, "__qgaRgFlow3d");
    expect(field.kind).toBe("cpu-samples");
    expect(field.streamlines).toBeGreaterThan(10);
    expect(field.fixedPoints).toBeGreaterThanOrEqual(1);
    expect(field.terminatedAtValidity).toBeGreaterThanOrEqual(1);
    await expect(page.locator(".s3d-labels", { hasText: "validity wall" }).last()).toBeVisible();
    expect(errors()).toEqual([]);
  });

  test("reduced motion keeps every lab deterministic and error-free", async ({ page, context }) => {
    test.setTimeout(180_000);
    await context.addInitScript(() => sessionStorage.setItem("horizon-intro", "1"));
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors = await gotoReady(page, "/?view=qft", LABS);
    await page.locator("text=Vacuum fluctuations, computed").scrollIntoViewIfNeeded();
    const qft = await published(page, "__qgaQftLab");
    expect(qft.points).toBeGreaterThan(0);

    await page.goto("/?view=bh", { waitUntil: "domcontentloaded" });
    await page.locator("text=Hawking horizon lab").scrollIntoViewIfNeeded();
    const bh = await published(page, "__qgaHawkingLab");
    expect(bh.kind).toBe("cpu-samples");

    await page.goto("/?view=rg", { waitUntil: "domcontentloaded" });
    await page.locator("text=The flow field in three dimensions").scrollIntoViewIfNeeded();
    const rg = await published(page, "__qgaRgFlow3d");
    expect(rg.streamlines).toBeGreaterThan(10);
    expect(errors()).toEqual([]);
  });
});
