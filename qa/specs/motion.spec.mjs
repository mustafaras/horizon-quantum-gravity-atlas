// Motion behavior: reduced-motion and normal-motion modes must differ in
// observable behavior, not just in timing.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("GW theatre does not auto-play", async ({ page }) => {
    await gotoReady(page, "/?view=exp&seed=42");
    await expect(page.getByRole("button", { name: "Play signal" })).toBeVisible();
  });

  test("RG landscape renders without a settling phase", async ({ page }) => {
    await gotoReady(page, "/?view=rg&rgp=qcd", ["fonts", "network-idle", "view-mounted"]);
    await expect(page.locator(".rg-plot.settling")).toHaveCount(0);
  });
});

test.describe("normal motion", () => {
  test.use({ reducedMotion: "no-preference" });

  test("GW theatre auto-plays the seeded signal", async ({ page }) => {
    await gotoReady(page, "/?view=exp&seed=42", ["fonts", "network-idle", "view-mounted"]);
    await expect(page.getByRole("button", { name: "Pause playback" })).toBeVisible();
  });
});
