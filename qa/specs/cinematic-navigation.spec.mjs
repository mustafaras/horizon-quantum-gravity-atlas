// Cinematic navigation (Prompt 09): the camera director must never fight the
// user, back navigation must restore the exact view + shot pair, focus must
// stay on the control the user activated, reduced motion must not interpolate
// the camera, and rapid navigation must never stack transition loops.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.describe("cinematic direction", () => {
  test("user input on a flagship scene cancels automated direction", async ({ page }) => {
    const errors = await gotoReady(page, "/?view=bh");
    const bar = page.locator(".cinema-bar");
    await expect(bar).toBeVisible();
    await expect(bar.locator(".cinema-play")).toBeEnabled();
    await bar.locator(".cinema-play").click();
    await expect(bar.locator(".cinema-play")).toHaveAttribute("aria-pressed", "true");

    // drag on the observatory canvas: orbit input pauses automation immediately
    const canvas = page.locator("#shot-section-bh canvas").first();
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.5, { steps: 4 });
    await page.mouse.up();

    await expect(bar.locator(".cinema-control")).toHaveText("Resume tour");
    await expect(bar.locator(".cinema-play")).toHaveAttribute("aria-pressed", "false");
    // and the director reports the user in control
    expect(await page.evaluate(() => window.QGA_CINEMATIC.state.control)).toBe("user");
    expect(errors(), errors().join("\n")).toEqual([]);
  });

  test("deep link places the shot without autoplay; back navigation restores view + shot", async ({ page }) => {
    const errors = await gotoReady(page, "/?view=bh&shot=bh-photon");
    const bar = page.locator(".cinema-bar");
    await expect(bar.locator(".cinema-shot-title")).toContainText("Photon ring");
    expect(await page.evaluate(() => window.QGA_CINEMATIC.state.playing)).toBe(false);

    // navigate away, then back: the exact view + shot pair must return
    await page.locator('.sidebar .nav-item:has-text("Atlas overview")').click();
    await expect(page.locator(".cinema-bar")).toHaveCount(0); // overview has no shots
    await page.goBack();
    await expect(page).toHaveURL(/view=bh/);
    await expect(page).toHaveURL(/shot=bh-photon/);
    await expect(page.locator(".cinema-bar .cinema-shot-title")).toContainText("Photon ring");
    expect(errors(), errors().join("\n")).toEqual([]);
  });

  test("take control keeps keyboard focus on the button", async ({ page }) => {
    const errors = await gotoReady(page, "/?view=gr");
    const control = page.locator(".cinema-bar .cinema-control");
    await control.focus();
    await control.click();
    await expect(control).toHaveText("Resume tour");
    const focused = await page.evaluate(() => document.activeElement?.className || "");
    expect(focused).toContain("cinema-control");
    expect(errors(), errors().join("\n")).toEqual([]);
  });

  test("reduced motion: no camera interpolation, crossfade transition mode", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors = await gotoReady(page, "/?view=bh");
    const bar = page.locator(".cinema-bar");
    await expect(bar.locator(".cinema-play")).toBeDisabled();
    // programmatic play must not advance the timeline (no interpolation)
    const advanced = await page.evaluate(() => {
      window.QGA_CINEMATIC.play();
      return window.QGA_CINEMATIC.state.playing;
    });
    expect(advanced).toBe(false);
    // spatial distortion is off: the transition runs in crossfade mode
    expect(await page.evaluate(() => window.QGA_CINEMATIC.transitionMode())).toBe("crossfade");
    expect(errors(), errors().join("\n")).toEqual([]);
  });

  test("rapid navigation keeps a single transition loop", async ({ page }) => {
    const errors = await gotoReady(page, "/?view=bh");
    const nav = page.locator(".sidebar .nav-item");
    await nav.filter({ hasText: "General Relativity" }).first().click();
    await nav.filter({ hasText: "Experiment" }).first().click();
    await nav.filter({ hasText: "Quantum Fields" }).first().click();
    await nav.filter({ hasText: "Atlas overview" }).first().click();
    const loops = await page.evaluate(() => window.QGA_CINEMATIC.transitionLoops());
    expect(loops).toBeLessThanOrEqual(1);
    // the app stays interactive: the overview mounted cleanly
    await expect(page.locator(".content-inner")).toBeVisible();
    expect(errors(), errors().join("\n")).toEqual([]);
  });
});
