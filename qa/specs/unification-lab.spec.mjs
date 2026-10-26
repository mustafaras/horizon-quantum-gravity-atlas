// The gauge-coupling unification lab of the RG view (S17), in the page.
//
//   figures    both figures carry status and registered provenance; the MSSM toggle (aria-pressed) makes them conjectural, with their own entries
//   motion     under reduced motion the MSSM cross-fade snaps: the final state is there at once
//   lens       focusing a term of the formula lights its mark at the focal width and dims the rest; a blur restores the plain figure
//   keyboard   the plot is a slider: the arrow keys move the scale
//   targets    every button and range of the lab is at least 44 px on both sides, on the desktop and at 390 px
//   labels     the KaTeX in the buttons and readouts is not upper-cased by a text transform
//   mobile     the lab fits 390 px with no sideways scroll

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ viewport: { width: 1280, height: 2600 } });
test.setTimeout(240_000);
const READINESS = ["fonts", "network-idle", "view-mounted"];
const LAB = ".ug-lab";
const COUPLINGS = '.fig[data-figure="rg-unification-couplings"]';
const TRIANGLE = '.fig[data-figure="rg-unification-triangle"]';
const MSSM_TOGGLE = `${LAB} .ug-bar > button`;
const MIN_TARGET = 44;

async function open(page, context, url = "/?view=rg&seed=42") {
  await context.addInitScript(() => {
    window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2" };
    sessionStorage.setItem("horizon-intro", "1");
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await gotoReady(page, url, READINESS);
  await page.locator(LAB).scrollIntoViewIfNeeded();
  await expect(page.locator(COUPLINGS)).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(window.QGA_FIGURE_SCENES?.get("rg-unification-couplings")))).toBe(true);
  return errors;
}

const lines = (page, id) => page.evaluate((figureId) => {
  const scene = window.QGA_FIGURE_SCENES.get(figureId);
  return scene.prims.filter((p) => p.k === "line" && (p.role === "data" || p.role === "rule")).map((p) => ({ mark: p.mark, w: p.w, a: p.a, role: p.role }));
}, id);

test("both figures carry status and registered provenance; the MSSM toggle makes them conjectural", async ({ page, context }) => {
  const errors = await open(page, context);
  for (const selector of [COUPLINGS, TRIANGLE]) {
    await expect(page.locator(selector)).toHaveAttribute("data-status", "effective");
    const id = await page.locator(`${selector} .fig-id`).innerText();
    expect(await page.evaluate((provenanceId) => window.QGA_PROVENANCE.get(provenanceId)?.status, id)).toBe("effective");
  }
  const toggle = page.locator(MSSM_TOGGLE).nth(1);
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  // reduced motion: no cross-fade, the final state is there on the next frame
  await expect(page.locator(COUPLINGS)).toHaveAttribute("data-status", "conjectural");
  await expect(page.locator(TRIANGLE)).toHaveAttribute("data-status", "conjectural");
  const id = await page.locator(`${COUPLINGS} .fig-id`).innerText();
  expect(id).toBe("rg-unification-couplings-mssm");
  expect(await page.evaluate((provenanceId) => window.QGA_PROVENANCE.get(provenanceId)?.status, id)).toBe("conjectural");
  await expect(page.locator(`${LAB} .badge-conjectural`).first()).toBeVisible();
  const opacities = await page.evaluate(() => window.QGA_FIGURE_SCENES.get("rg-unification-couplings").prims.filter((p) => p.role === "data" && p.k === "line").map((p) => p.a));
  expect(Math.min(...opacities), "the Standard-Model lines are gone, not half faded").toBeGreaterThan(0.5);
  expect(errors).toEqual([]);
});

test("the two plots carry the plan: three lines, the inputs, the Planck rule and a hatched GUT region", async ({ page, context }) => {
  const errors = await open(page, context);
  const summary = await page.evaluate(() => {
    const scene = window.QGA_FIGURE_SCENES.get("rg-unification-couplings");
    const right = scene.plot.x + scene.plot.w;
    return {
      hatch: scene.prims.filter((p) => p.k === "hatch").length,
      widths: scene.prims.filter((p) => p.k === "line" && p.role === "data").map((p) => p.w),
      domain: [scene.sx.invert(scene.plot.x), scene.sx.invert(right)],
    };
  });
  expect(summary.hatch).toBe(1);
  expect(Math.max(...summary.widths)).toBeLessThanOrEqual(2.6);
  expect(summary.domain[0]).toBeLessThan(2);
  expect(summary.domain[1]).toBeGreaterThan(19);
  const inputs = await page.evaluate(() => ({ values: window.QGA_GAUGE.inputsAtMZ(), alpha: window.QGA_GAUGE.ALPHA_EM_INVERSE_MZ.value }));
  expect(inputs.alpha).toBeCloseTo(127.961, 2);
  expect(inputs.values[2]).toBeCloseTo(1 / 0.118, 10);
  // the readout of the default scale is the pure function evaluated there
  const expected = await page.evaluate(() => {
    const run = window.QGA_GAUGE.runGaugeCouplings({ loops: 2, model: "sm", log10Max: 10, points: 2 });
    return run.inv.map((l) => l.at(-1));
  });
  const readouts = await page.locator(`${LAB} .ug-readouts .readout-value`).allInnerTexts();
  expect(Number(readouts[2].split("±")[0])).toBeCloseTo(expected[2], 1);
  expect(errors).toEqual([]);
});

test("focusing a term lights its mark at the focal width and dims the rest; a blur restores the plain figure", async ({ page, context }) => {
  const errors = await open(page, context);
  const before = await lines(page, "rg-unification-couplings");
  const term = page.locator(`${LAB} .ug-cards [data-term="ln_mu_over_MZ"]`).first();
  await term.scrollIntoViewIfNeeded();
  await term.focus();
  await expect.poll(async () => (await lines(page, "rg-unification-couplings")).some((l) => l.role === "rule" && l.w === 2.5)).toBe(true);
  const lit = await lines(page, "rg-unification-couplings");
  const others = lit.filter((l) => l.role === "data");
  expect(others.length).toBeGreaterThan(0);
  expect(Math.max(...others.map((l) => l.a)), "everything else recedes").toBeLessThanOrEqual(0.3);
  await term.blur();
  await expect.poll(async () => JSON.stringify(await lines(page, "rg-unification-couplings"))).toBe(JSON.stringify(before));
  // the output term lights the running line of the selected coupling
  const output = page.locator(`${LAB} .ug-cards [data-term="ainv"]`).first();
  await output.focus();
  await expect.poll(async () => (await lines(page, "rg-unification-couplings")).filter((l) => l.role === "data" && l.w >= 2.5).length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("the plot is a slider: the arrow keys move the scale, and the toggles are keyboard operable", async ({ page, context }) => {
  const errors = await open(page, context);
  const plot = page.locator(`${COUPLINGS} .fig-plot`);
  await expect(plot).toHaveAttribute("role", "slider");
  const start = Number(await plot.getAttribute("aria-valuenow"));
  await plot.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => Number(await plot.getAttribute("aria-valuenow"))).toBeCloseTo(start + 0.1, 5);
  await page.keyboard.press("Shift+ArrowLeft");
  await expect.poll(async () => Number(await plot.getAttribute("aria-valuenow"))).toBeCloseTo(start - 0.9, 5);
  const one = page.locator(MSSM_TOGGLE).first();
  await expect(one).toHaveAttribute("aria-pressed", "true");
  await one.focus();
  await page.keyboard.press("Enter");
  await expect(one).toHaveAttribute("aria-pressed", "false");
  expect(errors).toEqual([]);
});

async function measureTargets(page) {
  return page.evaluate(() => [...document.querySelectorAll(".ug-lab .ug-btn, .ug-lab input[type=range]")].map((el) => {
    const r = el.getBoundingClientRect();
    return { name: (el.getAttribute("aria-label") || el.textContent || el.className).trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) };
  }));
}

test("every button and range of the lab is at least 44 px, and no label is upper-cased", async ({ page, context }) => {
  const errors = await open(page, context);
  const boxes = await measureTargets(page);
  expect(boxes.length).toBe(7);
  for (const box of boxes) {
    expect(box.h, `${box.name} height`).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(box.w, `${box.name} width`).toBeGreaterThanOrEqual(MIN_TARGET);
  }
  const transforms = await page.evaluate(() => [...document.querySelectorAll(".ug-lab .ug-btn .katex, .ug-lab .readout-label .katex, .ug-lab .ctl-label .katex")].map((el) => getComputedStyle(el).textTransform));
  expect(transforms.length).toBeGreaterThan(6);
  expect(new Set(transforms)).toEqual(new Set(["none"]));
  expect(errors).toEqual([]);
});

test.describe("at 390 px", () => {
  test.use({ viewport: { width: 390, height: 3200 } });
  test("the lab fits the screen, its targets stay 44 px and its figures keep a legend and an axis", async ({ page, context }) => {
    const errors = await open(page, context);
    const fit = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth, lab: document.querySelector(".ug-lab").getBoundingClientRect().width }));
    expect(fit.scroll).toBeLessThanOrEqual(fit.inner);
    expect(fit.lab).toBeLessThanOrEqual(fit.inner);
    for (const box of await measureTargets(page)) expect(box.h, `${box.name} height`).toBeGreaterThanOrEqual(MIN_TARGET);
    const scene = await page.evaluate(() => {
      const s = window.QGA_FIGURE_SCENES.get("rg-unification-couplings");
      return { w: s.plot.w, h: s.plot.h, legend: s.legend.length };
    });
    expect(scene.w).toBeGreaterThan(150);
    expect(scene.legend).toBeGreaterThanOrEqual(4);
    expect(errors).toEqual([]);
  });
});
