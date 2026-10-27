// GWOSC integration: deterministic offline fixture drives every network phase.
// No test in this file touches the live gwosc.org service.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";
import { installGwoscFixture } from "../fixtures/gwosc/install.mjs";

const REAL_URL = "/?view=exp&gwm=real&gwe=GW150914&gwd=H1&gws=1126259446&gwt=16";
const LOADED = "GWOSC observation loaded";
const FALLBACK = "GWOSC unavailable";

test.describe("GWOSC fixture", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.QGA_RENDER_OPTIONS = { forceBackend: "static" };
      sessionStorage.setItem("horizon-intro", "1");
    });
  });

  test("ok mode: observation loads with provenance", async ({ page }) => {
    await installGwoscFixture(page, "ok");
    await gotoReady(page, REAL_URL, [
      "fonts", "network-idle", "view-mounted",
      { selector: ".gw-theatre", text: LOADED },
    ]);
    await expect(page.locator(".gw-theatre")).toContainText("GWOSC API v2");
  });

  for (const mode of ["http-error", "abort", "oversized"]) {
    test(`${mode} mode: falls back to the generated signal, never labeled observation`, async ({ page }) => {
      await installGwoscFixture(page, mode);
      await gotoReady(page, REAL_URL, [
        "fonts", "network-idle", "view-mounted",
        { selector: ".gw-theatre", text: FALLBACK },
      ]);
      const theatre = page.locator(".gw-theatre");
      await expect(theatre).toContainText(FALLBACK);
      await expect(theatre).not.toContainText(LOADED);
      await expect(theatre).toContainText("generated");
    });
  }

  test("cancel during load reports the cancelled phase", async ({ page }) => {
    await installGwoscFixture(page, "ok");
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    await page.route("**/fixture/GW150914-synthetic-strain.txt", async (route) => {
      await gate;
      await route.fallback();
    });
    try {
      await gotoReady(page, REAL_URL, ["view-mounted"]);
      await page.locator(".gw-theatre").getByRole("button", { name: "Cancel" }).click();
      await expect(page.locator(".gw-theatre")).toContainText(/cancelled/i);
    } finally { release(); }
  });

  test("parser contract: bounded samples, calibrated provenance", async ({ page }) => {
    await installGwoscFixture(page, "ok");
    await gotoReady(page, "/?view=exp");
    const result = await page.evaluate(() =>
      window.QGA_FETCH_GWOSC("GW150914", { detector: "H1", start: 1126259446, duration: 16 }));
    expect(result.ok).toBe(true);
    expect(result.samples.length).toBeGreaterThan(0);
    expect(result.samples.length).toBeLessThanOrEqual(1200);
    expect(result.provenance.mode).toBe("real-strain");
    expect(result.provenance.source).toContain("GWOSC API v2");
  });
});
