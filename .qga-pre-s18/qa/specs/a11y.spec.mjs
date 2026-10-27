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

test.describe("bypass blocks", () => {
  test("skip link is the first Tab stop and moves focus into main", async ({ page }) => {
    await gotoReady(page, "/?view=gr");
    // The once-per-session intro splash is itself focusable and auto-dismisses
    // after 3s; drop it so the skip link is unambiguously the first stop.
    await page.evaluate(() => document.querySelector(".horizon-intro")?.remove());
    await page.evaluate(() => document.activeElement?.blur?.());

    await page.keyboard.press("Tab");
    const first = await page.evaluate(() => {
      const el = document.activeElement;
      return { cls: el?.getAttribute?.("class") || "", text: (el?.textContent || "").trim() };
    });
    expect(first.cls, "first Tab stop is not the skip link").toContain("skip-link");
    expect(first.text.length).toBeGreaterThan(0);

    // The reveal is a 0.16s transform transition; wait for it to land rather
    // than sampling mid-flight.
    await page.waitForFunction(() => {
      const el = document.querySelector(".skip-link");
      return !!el && el.getBoundingClientRect().top >= 0;
    }, null, { timeout: 3000 });
    const onScreen = await page.evaluate(() => {
      const r = document.querySelector(".skip-link").getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height };
    });
    expect(onScreen.height, "skip link has no box").toBeGreaterThan(0);
    expect(onScreen.top, "skip link is still parked off-screen while focused").toBeGreaterThanOrEqual(0);
    expect(onScreen.bottom).toBeLessThanOrEqual(200);

    await page.keyboard.press("Enter");
    const landed = await page.evaluate(() => {
      const el = document.activeElement;
      return { id: el?.id || "", tag: el?.tagName || "" };
    });
    expect(landed.tag, "skip link did not move focus into <main>").toBe("MAIN");
    expect(landed.id).toBe("main-content");
  });

  test("skip link target exists and is programmatically focusable", async ({ page }) => {
    await gotoReady(page, "/?view=gr");
    const target = await page.evaluate(() => {
      const link = document.querySelector(".skip-link");
      if (!link) return null;
      const id = (link.getAttribute("href") || "").replace(/^#/, "");
      const el = id ? document.getElementById(id) : null;
      return el ? { tag: el.tagName, tabindex: el.getAttribute("tabindex") } : null;
    });
    expect(target, "skip link target is missing").not.toBeNull();
    expect(target.tag).toBe("MAIN");
    expect(target.tabindex, "skip target must accept programmatic focus").toBe("-1");
  });
});

test.describe("contrast", () => {
  // WCAG 2.2 SC 1.4.3 (AA): 4.5:1 for body text, 3:1 for large text.
  // Colours are resolved through a 1x1 canvas because getComputedStyle can
  // return oklch()/color(), which a naive numeric parse misreads as RGB.
  // Backgrounds are composited bottom-up across every ancestor: a single
  // "first non-transparent layer" read un-premultiplies a 6% overlay into a
  // light colour and reports hundreds of false failures.
  const MEASURE = () => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    const parse = (color) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
      const w = ctx.getImageData(0, 0, 1, 1).data;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
      const b = ctx.getImageData(0, 0, 1, 1).data;
      const a = 1 - ((w[0] - b[0]) + (w[1] - b[1]) + (w[2] - b[2])) / 3 / 255;
      if (a <= 0.002) return { rgb: [0, 0, 0], a: 0 };
      return { rgb: [b[0] / a, b[1] / a, b[2] / a], a };
    };
    const lum = (rgb) => {
      const f = rgb.map((v) => {
        const s = Math.min(1, Math.max(0, v / 255));
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
    };
    const ratio = (x, y) => {
      const l1 = lum(x), l2 = lum(y);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };
    const bgOf = (el) => {
      const layers = [];
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c.a > 0) layers.push(c);
      }
      let out = [0, 0, 0];
      for (let i = layers.length - 1; i >= 0; i--) {
        const { rgb, a } = layers[i];
        out = out.map((v, k) => v * (1 - a) + rgb[k] * a);
      }
      return out;
    };
    const SKIP = ".katex, .katex-mathml, .sym-glyph-tile";
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      if (el.closest(SKIP)) continue;
      const ownsText = [...el.childNodes].some(
        (n) => n.nodeType === 3 && n.textContent.trim().length > 1
      );
      if (!ownsText) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const fg = parse(cs.color);
      if (fg.a === 0) continue;
      const bg = bgOf(el);
      const fgRgb = fg.a < 1 ? fg.rgb.map((v, k) => v * fg.a + bg[k] * (1 - fg.a)) : fg.rgb;
      const size = parseFloat(cs.fontSize) || 16;
      const bold = Number(cs.fontWeight) >= 700;
      const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
      const got = ratio(fgRgb, bg);
      if (got < need) {
        out.push({
          text: el.textContent.trim().slice(0, 48),
          cls: (typeof el.className === "string" ? el.className : el.getAttribute("class") || "").slice(0, 48),
          got: Math.round(got * 100) / 100,
          need,
        });
      }
    }
    return out;
  };

  for (const view of VIEWS) {
    test(`view "${view}" meets WCAG AA text contrast`, async ({ page }) => {
      await gotoReady(page, `/?view=${view}`);
      const failures = await page.evaluate(MEASURE);
      expect(
        failures,
        `${failures.length} contrast failure(s): ${JSON.stringify(failures.slice(0, 8))}`
      ).toEqual([]);
    });
  }
});
