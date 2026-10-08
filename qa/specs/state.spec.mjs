// URL state: round-trip, reload persistence, back/forward, copy-link, export schema.

import { test, expect } from "playwright/test";
import { readFile } from "node:fs/promises";
import { gotoReady, DEFAULT_READINESS } from "./helpers.mjs";
import { runReadiness } from "../lib/readiness.mjs";

const GR_URL = "/?view=gr&grp=null&grb=-0.55&grat=-2&grax=-2&grbt=2&grbx=2";

test.describe("URL state", () => {
  test("URL parameters survive a reload unchanged", async ({ page }) => {
    await gotoReady(page, GR_URL);
    const before = await page.evaluate(() => window.qgaReadState(window.location.search));
    expect(before.grPreset).toBe("null");
    expect(before.grBeta).toBe(-0.55);
    await page.reload({ waitUntil: "domcontentloaded" });
    await runReadiness(page, DEFAULT_READINESS);
    const after = await page.evaluate(() => window.qgaReadState(window.location.search));
    expect(after).toEqual(before);
  });

  test("view navigation participates in history (back/forward)", async ({ page }) => {
    await gotoReady(page, "/?view=gr");
    await page.getByRole("button", { name: /Black Holes/ }).first().click();
    await expect(page).toHaveURL(/view=bh/);
    await page.goBack();
    await expect(page).toHaveURL(/view=gr/);
    await page.goForward();
    await expect(page).toHaveURL(/view=bh/);
  });

  // The global Copy link / Export JSON controls live in the topbar, which is
  // part of the mobile shell (`.topbar { display: none }` on desktop).
  test.describe("mobile shell share controls", () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test("copy link reproduces the current URL state", async ({ page, context }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      // rgg=1.5 is non-default, so it must survive into the copied link;
      // default-valued parameters are legitimately omitted from the URL.
      await gotoReady(page, "/?view=rg&rgp=qcd&rgg=1.5");
      await page.getByRole("button", { name: "Copy link" }).click();
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      expect(clip).toContain("view=rg");
      expect(clip).toContain("rgg=1.5");
    });

    test("export JSON carries the versioned schema and full state", async ({ page }) => {
      await gotoReady(page, GR_URL);
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Export JSON" }).click(),
      ]);
      const path = await download.path();
      const payload = JSON.parse(await readFile(path, "utf8"));
      expect(payload.schema).toBe("horizon-qga-state/v1");
      expect(payload.state.grPreset).toBe("null");
      expect(payload.state.grBeta).toBe(-0.55);
      expect(payload.state.view).toBe("gr");
    });
  });

  test("RG export includes model and provenance metadata", async ({ page }) => {
    await gotoReady(page, "/?view=rg&rgp=qcd");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export RG JSON" }).click(),
    ]);
    const payload = JSON.parse(await readFile(await download.path(), "utf8"));
    expect(payload.schema).toBe("horizon-qga-state/v1");
    expect(payload.state.rgPreset).toBe("qcd");
    expect(payload.model?.id).toBe("qcd");
    expect(payload.provenance?.implementation).toContain("physics");
  });
});
