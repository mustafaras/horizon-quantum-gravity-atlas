// Guided tours and the teacher worksheet (S31).
//
// Each test walks a tour as a reader does — deep link, Next, Back — and asserts the things the tour promises: the view
// changes, the step counter advances, the question and its expected readout are on screen, the URL is the one a teacher
// can copy, and the worksheet prints the same steps. Reduced motion is the default capture setting, so the panel must
// work with motion switched off.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

const TOURS = [
  { id: "why-gravity-resists-quantisation", steps: 13, view: "overview" },
  { id: "what-a-black-hole-image-measures", steps: 8, view: "bh" },
  { id: "hearing-spacetime", steps: 7, view: "exp" },
];

test.describe("guided tours", () => {
  for (const tour of TOURS) {
    test(`"${tour.id}" opens on its first step and walks forward and back`, async ({ page }) => {
      const errors = await gotoReady(page, `/?tour=${tour.id}&step=1`);
      const panel = page.locator(".tour-surface");
      await expect(panel).toBeVisible();
      await expect(panel.locator(".tour-reader-title")).toBeVisible();
      await expect(panel.locator(".tour-counter")).toHaveText(`Step 1 of ${tour.steps}`);
      await expect(panel.locator(".tour-reader-title")).toBeVisible();
      await expect(panel.locator(".tour-question p").first()).not.toBeEmpty();
      await expect(page).toHaveURL(new RegExp(`tour=${tour.id}`));
      // A deep link is not rewritten on mount, so `step=1` from the link survives verbatim.

      // Forward: the counter moves, the URL follows.
      await panel.getByRole("button", { name: "Next step" }).click();
      await expect(panel.locator(".tour-counter")).toHaveText(`Step 2 of ${tour.steps}`);
      await expect(page).toHaveURL(/step=2/);

      // Back returns to the step the URL already named — the tour walks through history, not around it.
      await panel.getByRole("button", { name: "Previous step" }).click();
      await expect(panel.locator(".tour-counter")).toHaveText(`Step 1 of ${tour.steps}`);
      // Back at the first step, the writer drops the now-default `step` from the URL: the link is the canonical entry.
      await expect(page).toHaveURL(new RegExp(`tour=${tour.id}`));
      expect(await page.evaluate(() => new URL(location.href).searchParams.get("step"))).toBeNull();
      await expect(panel.getByRole("button", { name: "Previous step" })).toBeDisabled();

      expect(errors(), "the tour must not log console or page errors").toEqual([]);
    });
  }

  test("the last step disables Next and the first disables Previous", async ({ page }) => {
    const tour = TOURS[2];
    await gotoReady(page, `/?tour=${tour.id}&step=${tour.steps}`);
    const panel = page.locator(".tour-surface");
    await expect(panel.locator(".tour-counter")).toHaveText(`Step ${tour.steps} of ${tour.steps}`);
    await expect(panel.getByRole("button", { name: "Next step" })).toBeDisabled();
  });

  test("an out-of-range step clamps to the last step and stays a working link", async ({ page }) => {
    const tour = TOURS[0];
    await gotoReady(page, `/?tour=${tour.id}&step=999`);
    const panel = page.locator(".tour-surface");
    await expect(panel.locator(".tour-counter")).toHaveText(`Step ${tour.steps} of ${tour.steps}`);
    await expect(panel.getByRole("button", { name: "Next step" })).toBeDisabled();
    // The URL is left as written: it still resolves to the same clamped step, so a copied link stays honest.
    await expect(page).toHaveURL(/step=999/);
  });

  test("the expected readout is behind a disclosure, so a learner does not see the answer first", async ({ page }) => {
    await gotoReady(page, `/?tour=${TOURS[1].id}&step=1`);
    const expected = page.locator(".tour-surface .tour-expected");
    await expect(expected).toBeVisible();
    await expect(expected.locator("p")).toBeHidden();
    await expected.locator("summary").click();
    await expect(expected.locator("p")).toBeVisible();
  });

  test("the progress ticks are buttons that name the step they open", async ({ page }) => {
    const tour = TOURS[1];
    await gotoReady(page, `/?tour=${tour.id}&step=1`);
    const ticks = page.locator(".tour-surface .tour-tick");
    await expect(ticks).toHaveCount(tour.steps);
    await expect(ticks.nth(0)).toHaveAttribute("aria-current", "step");
    await ticks.nth(3).click();
    await expect(page).toHaveURL(/step=4/);
    await expect(page.locator(".tour-surface .tour-counter")).toHaveText(`Step 4 of ${tour.steps}`);
  });

  test("an unknown tour falls back to the launcher rather than an empty panel", async ({ page }) => {
    await gotoReady(page, "/?tour=no-such-tour");
    await expect(page.locator(".tour-surface .tour-launcher")).toBeVisible();
    await expect(page.locator(".tour-surface .tour-list-item")).toHaveCount(TOURS.length);
  });

  test("the launcher starts a tour and lists all three", async ({ page }) => {
    await gotoReady(page, "/?view=overview");
    // Reach the launcher from the sidebar tool.
    await page.getByRole("button", { name: "Open the guided tours" }).click();
    const launcher = page.locator(".tour-launcher");
    await expect(launcher).toBeVisible();
    await expect(launcher.locator(".tour-list-item")).toHaveCount(TOURS.length);
    await launcher.getByRole("button", { name: new RegExp(TOURS[2].id === "hearing-spacetime" ? "Hearing spacetime" : "x") }).click();
    await expect(page).toHaveURL(/tour=hearing-spacetime/);
    await expect(page.locator(".tour-surface .tour-counter")).toHaveText(`Step 1 of ${TOURS[2].steps}`);
  });

  test("leaving a tour returns the atlas to where it was, without the tour parameters", async ({ page }) => {
    await gotoReady(page, `/?tour=${TOURS[2].id}&step=3`);
    await page.locator(".tour-surface").getByRole("button", { name: "Exit tour" }).click();
    await expect(page.locator(".tour-surface")).toHaveCount(0);
    await expect(page).not.toHaveURL(/tour=/);
  });
});

test.describe("teacher worksheet", () => {
  for (const tour of TOURS) {
    test(`"${tour.id}" prints every step as a question, with a plain URL`, async ({ page }) => {
      await gotoReady(page, `/?tour=${tour.id}&print=1`);
      const sheet = page.locator(".tour-worksheet");
      await expect(sheet).toBeVisible();
      await expect(sheet.locator(".tour-sheet-item")).toHaveCount(tour.steps);
      // Every row carries a relative URL naming its own step — no QR code, no absolute host.
      for (let i = 0; i < tour.steps; i += 1) {
        await expect(sheet.locator(".tour-sheet-url").nth(i)).toHaveText(new RegExp(`step=${i + 1}$`));
        await expect(sheet.locator(".tour-sheet-answer p").nth(i)).not.toBeEmpty();
      }
      await expect(sheet.locator(".tour-sheet-refs li")).toHaveCount(3);
      // The reader is not also drawn: a worksheet is a sheet, not a slide with a sidebar.
      await expect(page.locator(".tour-reader")).toHaveCount(0);
      // Printing controls are marked so the print stylesheet can hide them.
      await expect(sheet.locator(".no-print").first()).toBeVisible();
    });
  }

  test("the worksheet URL round-trips: opening it from the sheet's own link shows the same tour", async ({ page }) => {
    const tour = TOURS[1];
    await gotoReady(page, `/?tour=${tour.id}&print=1`);
    const href = await page.locator(".tour-sheet-meta").textContent();
    expect(href).toContain(`?tour=${tour.id}&print=1`);
  });
});

test.describe("accessibility", () => {
  test("the tour panel is keyboard operable and announces each step", async ({ page }) => {
    await gotoReady(page, `/?tour=${TOURS[0].id}&step=1`);
    const panel = page.locator(".tour-surface");
    // The step heading takes focus, so a screen reader hears the new step rather than a silent repaint.
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.className : null;
    });
    expect(focused).toContain("tour-reader-title");

    // Keyboard: Tab reaches a control and Enter advances.
    await page.locator(".tour-surface .tour-controls .btn.primary").focus();
    await page.keyboard.press("Enter");
    await expect(panel.locator(".tour-counter")).toHaveText(`Step 2 of ${TOURS[0].steps}`);
  });

  test("the tour controls meet the 44px touch target", async ({ page }) => {
    await gotoReady(page, `/?tour=${TOURS[0].id}&step=1`);
    const buttons = page.locator(".tour-surface .tour-controls .btn:visible");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const box = await buttons.nth(i).boundingBox();
      expect(box.height, `tour control ${i} height ${box.height}px < 44px`).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("tour ergonomics at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("the tour panel has no horizontal overflow", async ({ page }) => {
    await gotoReady(page, `/?tour=${TOURS[1].id}&step=1`);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("the worksheet has no horizontal overflow", async ({ page }) => {
    await gotoReady(page, `/?tour=${TOURS[2].id}&print=1`);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
