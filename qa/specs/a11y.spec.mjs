// Accessibility & responsive ergonomics: keyboard operability, visible focus,
// mobile overflow containment, touch-target size, horizontal chart scrolling.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

const VIEWS = ["overview", "sm", "qft", "rg", "gr", "planck", "approaches", "bh", "exp", "glossary", "refs", "open", "paper"];

test.describe("keyboard", () => {
  test("Tab reaches interactive elements with :focus-visible", async ({ page }) => {
    await gotoReady(page, "/?view=gr");
    let focused = null;
    for (let i = 0; i < 20 && !focused; i++) {
      await page.keyboard.press("Tab");
      focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el && el !== document.body && el.matches(":focus-visible")
          ? el.tagName : null;
      });
    }
    expect(focused, "no element received visible keyboard focus within 20 Tabs").toBeTruthy();
  });

  test("range sliders are arrow-key operable", async ({ page }) => {
    await gotoReady(page, "/?view=gr&grp=custom");
    const slider = page.locator("section:has-text('Causal spacetime laboratory') input[type='range']").first();
    await slider.focus();
    const before = Number(await slider.inputValue());
    await page.keyboard.press("ArrowRight");
    const after = Number(await slider.inputValue());
    expect(after).toBeGreaterThan(before);
  });
});

test.describe("mobile ergonomics", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  for (const view of VIEWS) {
    test(`view "${view}" has no horizontal page overflow`, async ({ page }) => {
      await gotoReady(page, `/?view=${view}`);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `horizontal overflow of ${overflow}px on view "${view}"`).toBeLessThanOrEqual(1);
    });
  }

  test("primary controls meet the 44px touch target", async ({ page }) => {
    await gotoReady(page, "/?view=gr");
    const buttons = page.locator("section:has-text('Causal spacetime laboratory') button:visible");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      expect(box.height, `control ${i} height ${box.height}px < 44px`).toBeGreaterThanOrEqual(44);
    }
  });

  test("RG chart scrolls horizontally instead of overflowing", async ({ page }) => {
    await gotoReady(page, "/?view=rg&rgp=qcd");
    await expect(page.locator(".rg-mobile-gesture-note")).toBeVisible();
    const scrollable = await page.evaluate(() => {
      const plot = document.querySelector(".rg-plot");
      if (!plot) return null;
      let el = plot;
      while (el && el !== document.body) {
        const style = getComputedStyle(el);
        if (/(auto|scroll)/.test(style.overflowX) && el.scrollWidth > el.clientWidth) {
          return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
        }
        el = el.parentElement;
      }
      return null;
    });
    expect(scrollable, "no horizontal scroll container around .rg-plot").toBeTruthy();
  });
});
