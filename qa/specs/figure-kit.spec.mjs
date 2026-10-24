// Figure Kit: every migrated figure, at eight widths from 320 to 1440 px, has no clipped text,
// no overlapping labels, a generated summary, and a keyboard-driven crosshair.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

const WIDTHS = [320, 480, 640, 768, 1024, 1200, 1280, 1440];
const VIEWS = [
  { view: "sm", figures: ["sm-higgs-running", "sm-higgs-stability", "sm-neutrino-flavour"] },
  { view: "bh", figures: ["bh-kerr-radii", "bh-hawking-spectrum", "bh-page-curve"] },
  { view: "gr", figures: ["gr-effective-potential", "gr-null-geodesics", "gr-lensed-sky"] },
  { view: "rg&rgp=qcd", figures: ["rg-scale-trajectory", "rg-beta-function"] },
  { view: "qft", figures: ["qft-dispersion", "qft-waterfall", "qft-angular-distribution", "qft-photon-cross-section", "qft-z-resonance"] },
  { view: "exp", figures: ["experiments-dielectron-mass", "gw-strain-generated", "gw-spectrogram"] },
];

// Runs in the page: boxes of every label (canvas text measured with the figure's own font, KaTeX
// overlay spans by their rendered rectangles) relative to the figure's plot box.
function audit(id) {
  const fig = document.querySelector(`.fig[data-figure="${id}"]`);
  if (!fig) return { missing: true };
  const plot = fig.querySelector(".fig-plot");
  const box = plot.getBoundingClientRect();
  const scene = window.QGA_FIGURE_SCENES.get(id);
  const font = window.QGA_TOKENS.current().font.mono(-2);
  const g = document.createElement("canvas").getContext("2d");
  g.font = font;
  const boxes = [];
  for (const t of scene.texts) {
    if (t.tex) continue;
    const w = g.measureText(t.text).width, h = t.size * 1.2;
    const x = t.align === "left" ? t.x : t.align === "right" ? t.x - w : t.x - w / 2;
    const y = t.base === "top" ? t.y : t.base === "bottom" ? t.y - h : t.y - h / 2;
    boxes.push(t.rotate ? { x: t.x - h / 2, y: t.y - w / 2, w: h, h: w, label: t.text, role: t.role } : { x, y, w, h, label: t.text, role: t.role });
  }
  for (const el of plot.querySelectorAll(".fig-tex-item")) {
    const r = el.getBoundingClientRect();
    boxes.push({ x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height, label: el.textContent.slice(0, 24), role: "tex" });
  }
  const clipped = boxes.filter((b) => b.x < -1 || b.y < -1 || b.x + b.w > box.width + 1 || b.y + b.h > box.height + 1);
  // Tick labels sit in the margins; annotation texts must not meet each other or a tick label.
  const overlaps = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5) overlaps.push([a.label, b.label]);
    }
  }
  const bar = fig.querySelector(".fig-bar").getBoundingClientRect(), fr = fig.getBoundingClientRect();
  const barClipped = [...fig.querySelectorAll(".fig-bar > *")].filter((el) => { const r = el.getBoundingClientRect(); return r.right > fr.right + 1 || r.left < fr.left - 1; }).length;
  return {
    clipped: clipped.map((b) => b.label), overlaps, barClipped, texts: boxes.length,
    summary: fig.querySelector(".fig-summary").textContent.length,
    describedBy: plot.getAttribute("aria-describedby") === fig.querySelector(".fig-summary").id,
    plotWidth: Math.round(box.width), horizontalOverflow: fig.scrollWidth > fig.clientWidth + 1,
  };
}

for (const { view, figures } of VIEWS) {
  test(`figures of ?view=${view}: no clipped text, no overlapping labels, a summary, at 8 widths`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1200, height: 900 });
    await gotoReady(page, `/?view=${view}`, undefined, { timeoutMs: 120_000 });
    for (const id of figures) await expect(page.locator(`.fig[data-figure="${id}"]`)).toHaveCount(1, { timeout: 30_000 });
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      for (const id of figures) {
        const locator = page.locator(`.fig[data-figure="${id}"]`);
        await locator.scrollIntoViewIfNeeded();
        // Layout settles after the ResizeObserver, the font check and the canvas redraw.
        await expect.poll(async () => {
          const r = await page.evaluate(audit, id);
          return !r.missing && r.plotWidth > 0 && Math.abs(r.plotWidth - Math.floor((await locator.boundingBox()).width)) <= 2 ? "settled" : "pending";
        }, { timeout: 15_000, message: `${id} at ${width}px settles` }).toBe("settled");
        const r = await page.evaluate(audit, id);
        const where = `${id} @ ${width}px`;
        expect(r.clipped, `${where}: clipped text ${JSON.stringify(r.clipped)}`).toEqual([]);
        expect(r.overlaps, `${where}: overlapping labels ${JSON.stringify(r.overlaps)}`).toEqual([]);
        expect(r.barClipped, `${where}: title bar overflow`).toBe(0);
        expect(r.summary, `${where}: summary text`).toBeGreaterThan(60);
        expect(r.describedBy, `${where}: aria-describedby points at the summary`).toBe(true);
      }
    }
  });
}

test("keyboard moves the crosshair along the focal series; Home and End jump to the ends", async ({ page }) => {
  await gotoReady(page, "/?view=sm");
  const plot = page.locator('.fig[data-figure="sm-neutrino-flavour"] .fig-plot');
  const readout = page.locator('.fig[data-figure="sm-neutrino-flavour"] .fig-readout');
  await plot.scrollIntoViewIfNeeded();
  await plot.focus();
  await expect(readout).toHaveText("");
  await page.keyboard.press("Home");
  await expect(readout).toContainText("E [GeV] = 0.1,");
  const first = await readout.textContent();
  await page.keyboard.press("ArrowRight");
  const second = await readout.textContent();
  expect(second).not.toBe(first);
  await page.keyboard.press("Shift+ArrowRight");
  await expect(readout).not.toHaveText(second);
  await page.keyboard.press("End");
  await expect(readout).toContainText("E [GeV] = 2,");
  await expect(plot.locator(".fig-cross-dot")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(readout).toHaveText("");
});

test("the Data disclosure lists at most 200 decimated rows and the summary names the figure", async ({ page }) => {
  await gotoReady(page, "/?view=sm");
  const fig = page.locator('.fig[data-figure="sm-neutrino-flavour"]');
  await fig.scrollIntoViewIfNeeded();
  await fig.locator(".fig-data > summary").click();
  const rows = fig.locator(".fig-table tbody tr");
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeLessThanOrEqual(200);
  await expect(fig.locator(".fig-summary")).toContainText("Flavour ribbon");
  const box = await fig.locator(".fig-data > summary").boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test("RG scale plot stays a keyboard slider and selects the scale", async ({ page }) => {
  await gotoReady(page, "/?view=rg&rgp=qcd");
  const plot = page.locator('.fig[data-figure="rg-scale-trajectory"] .fig-plot');
  await plot.scrollIntoViewIfNeeded();
  await expect(plot).toHaveAttribute("role", "slider");
  const before = Number(await plot.getAttribute("aria-valuenow"));
  await plot.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => Number(await plot.getAttribute("aria-valuenow"))).toBeCloseTo(before + 0.1, 5);
  await page.keyboard.press("End");
  await expect.poll(async () => Number(await plot.getAttribute("aria-valuenow"))).toBe(Number(await plot.getAttribute("aria-valuemax")));
});

test("theme change repaints figures without errors", async ({ page }) => {
  const errors = await gotoReady(page, "/?view=sm");
  await page.locator('.fig[data-figure="sm-neutrino-flavour"]').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.dispatchEvent(new CustomEvent("qga:theme")));
  await expect(page.locator('.fig[data-figure="sm-neutrino-flavour"] canvas')).toBeVisible();
  expect(errors()).toEqual([]);
});
