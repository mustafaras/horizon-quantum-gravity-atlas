// Accessibility & responsive ergonomics: keyboard operability, visible focus,
// mobile overflow containment, touch-target size, horizontal chart scrolling.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

const VIEWS = ["overview", "sm", "qft", "rg", "gr", "planck", "approaches", "bh", "exp", "glossary", "symbols", "refs", "open", "paper", "compare"];

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

// Structural accessibility: the document outline and the accessible names of
// interactive controls. These are the properties a screen-reader user depends
// on to navigate at all, and they regress silently because nothing visual
// changes when they break.
test.describe("document structure", () => {
  for (const view of VIEWS) {
    test(`view "${view}" has a single H1 and no skipped heading levels`, async ({ page }) => {
      await gotoReady(page, `/?view=${view}`);
      const outline = await page.evaluate(() => {
        const els = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
          .filter((e) => e.getClientRects().length > 0);
        return els.map((e) => ({ level: Number(e.tagName[1]), text: e.textContent.trim() }));
      });
      expect(outline.length, `view "${view}" exposes only ${outline.length} heading(s)`).toBeGreaterThanOrEqual(2);
      const h1s = outline.filter((h) => h.level === 1);
      expect(h1s.length, `view "${view}" has ${h1s.length} H1 elements`).toBe(1);
      for (let i = 1; i < outline.length; i++) {
        const jump = outline[i].level - outline[i - 1].level;
        expect(jump, `heading level jumps ${outline[i - 1].level}→${outline[i].level} at "${outline[i].text}"`).toBeLessThanOrEqual(1);
      }
    });
  }
});

test.describe("accessible names", () => {
  for (const view of VIEWS) {
    test(`view "${view}" names every interactive control`, async ({ page }) => {
      await gotoReady(page, `/?view=${view}`);
      const unnamed = await page.evaluate(() => {
        const SEL = "a[href], button, input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex='-1'])";
        const nameOf = (el) => {
          const aria = el.getAttribute("aria-label");
          if (aria && aria.trim()) return aria.trim();
          const labelledby = el.getAttribute("aria-labelledby");
          if (labelledby) {
            const text = labelledby.split(/\s+/)
              .map((id) => document.getElementById(id)?.textContent || "")
              .join(" ").trim();
            if (text) return text;
          }
          // Real <label> association: wrapping label or for= — omitting this
          // produces false positives for every properly labelled input.
          if (el.labels && el.labels.length) {
            const text = [...el.labels].map((l) => l.textContent).join(" ").trim();
            if (text) return text;
          }
          const text = (el.textContent || "").trim();
          if (text) return text;
          const img = el.querySelector("img[alt]");
          if (img && img.alt.trim()) return img.alt.trim();
          const title = el.getAttribute("title");
          if (title && title.trim()) return title.trim();
          return "";
        };
        return [...document.querySelectorAll(SEL)]
          .filter((el) => el.getClientRects().length > 0)
          .filter((el) => !nameOf(el))
          .map((el) => `${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).split(/\s+/).join(".") : ""}`);
      });
      expect(unnamed, `unnamed controls in view "${view}"`).toEqual([]);
    });
  }
});

test.describe("symbol atlas", () => {
  test("every symbol card announces its glyph", async ({ page }) => {
    await gotoReady(page, "/?view=symbols");
    // The glyph tile is aria-hidden (it renders KaTeX, which would otherwise
    // be read as a formula), so the card's own accessible name is the only
    // path by which the symbol reaches assistive technology.
    const cards = await page.evaluate(() =>
      [...document.querySelectorAll(".sym-card")].map((el) => ({
        label: el.getAttribute("aria-label") || "",
        role: el.getAttribute("role") || "",
      }))
    );
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.role, "symbol card is not exposed as a group").toBe("group");
      expect(card.label.trim().length, "symbol card has an empty accessible name").toBeGreaterThan(0);
    }
  });
});
