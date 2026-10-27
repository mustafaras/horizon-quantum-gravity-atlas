// Motion behavior: reduced-motion and normal-motion modes must differ in
// observable behavior, not just in timing.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    window.QGA_RENDER_OPTIONS = { forceBackend: "static" };
    sessionStorage.setItem("horizon-intro", "1");
    window.__qaGWAutoPlayback = { started: false, progressed: false };
    new MutationObserver(() => {
      if (document.querySelector('.gw-transport [aria-label="Pause playback"]')) window.__qaGWAutoPlayback.started = true;
      const position = document.querySelector('.gw-transport [aria-label="Playback position"]');
      if (Number(position?.getAttribute("aria-valuenow")) > 0) window.__qaGWAutoPlayback.progressed = true;
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-label", "aria-valuenow"] });
  });
});

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("GW theatre does not auto-play", async ({ page }) => {
    await gotoReady(page, "/?view=exp&seed=42");
    await expect(page.getByRole("button", { name: "Play signal" })).toBeVisible();
    expect(await page.evaluate(() => window.__qaGWAutoPlayback)).toEqual({ started: false, progressed: false });
  });

  test("RG landscape renders without a settling phase", async ({ page }) => {
    await gotoReady(page, "/?view=rg&rgp=qcd", ["fonts", "network-idle", "view-mounted"]);
    await expect(page.locator(".rg-plot.settling")).toHaveCount(0);
  });
});

test.describe("normal motion", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("GW theatre auto-plays the seeded signal", async ({ page }) => {
    await gotoReady(page, "/?view=exp&seed=42", ["view-mounted"]);
    await expect.poll(() => page.evaluate(() => window.__qaGWAutoPlayback)).toEqual({ started: true, progressed: true });
  });
});
