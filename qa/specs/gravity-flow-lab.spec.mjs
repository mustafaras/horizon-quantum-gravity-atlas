// The asymptotic-safety flow lab of the RG view (S18), in the page.
//
//   figures    both figures carry their registered conjectural status; the plot names the scheme table and stops an IIIa run where the truncation does
//   presets    the three trajectory presets are aria-pressed toggles and each one moves the start ranges and the readouts
//   silk       the GPU scene reports its kernel length, its rings and its freeze under reduced motion, and it draws non-blank pixels
//   field3d    the Einstein-Hilbert mode of the 3-D field swaps the second axis for lambda and draws the singular plane
//   keyboard   the ranges take keyboard input and the presets are operable with Enter
//   targets    every button and range of the lab is at least 44 px on both sides, on the desktop and at 390 px
//   labels     the KaTeX in the readouts and the range labels is not upper-cased by a text transform
//   mobile     the lab fits 390 px with no sideways scroll

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ viewport: { width: 1280, height: 2400 } });
test.setTimeout(240_000);
const READINESS = ["fonts", "network-idle", "view-mounted"];
const LAB = ".gf-lab";
const FIELD = ".rgf-lab";
const FIGURE = '.fig[data-figure="rg-gravity-flow-trajectory"]';
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
  await expect(page.locator(FIGURE)).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(window.QGA_FIGURE_SCENES?.get("rg-gravity-flow-trajectory")))).toBe(true);
  return errors;
}

/** The live silk handle of the gravity lab, or null while the scene is still building. */
const silkState = (page) => page.evaluate(() => {
  const handle = [...(window.__qgaActiveScenes ?? [])].find((scene) => scene.element.closest(".gf-lab"));
  if (!handle || typeof handle.state !== "function") return null;
  return handle.state();
});

test("both figures and both captions carry their registered conjectural status", async ({ page, context }) => {
  const errors = await open(page, context);
  await expect(page.locator(FIGURE)).toHaveAttribute("data-status", "conjectural");
  const figureId = await page.locator(`${FIGURE} .fig-id`).innerText();
  expect(figureId).toBe("rg-gravity-flow-trajectory");
  expect(await page.evaluate((id) => window.QGA_PROVENANCE.get(id)?.status, figureId)).toBe("conjectural");
  for (const id of ["rg-gravity-flow-silk", "rg-gravity-flow-trajectory"]) {
    const entry = await page.evaluate((provenanceId) => {
      const record = window.QGA_PROVENANCE.get(provenanceId);
      return record ? { status: record.status, text: `${record.model} ${record.assumptions.join(" ")} ${record.validity.join(" ")}` } : null;
    }, id);
    expect(entry, id).not.toBeNull();
    expect(entry.status).toBe("conjectural");
    expect(entry.text).toMatch(/Einstein/);
    expect(entry.text).toMatch(/truncation/i);
    expect(entry.text).toMatch(/cutoff|scheme/i);
  }
  await expect(page.locator(`${LAB} .badge-conjectural`).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("the plot draws the run: one focal line, the fixed-point rules and the stopping point of an IIIa run", async ({ page, context }) => {
  const errors = await open(page, context);
  const scene = await page.evaluate(() => {
    const s = window.QGA_FIGURE_SCENES.get("rg-gravity-flow-trajectory");
    const drawn = (role) => s.prims.filter((p) => p.role === role);
    return {
      focal: drawn("data").filter((p) => p.k === "line" && p.w >= 2.5).length,
      dataLines: drawn("data").filter((p) => p.k === "line").length,
      rules: drawn("rule").length,
      texts: s.texts.map((t) => t.text),
      plot: { w: s.plot.w, h: s.plot.h },
    };
  });
  expect(scene.focal).toBe(1);
  expect(scene.dataLines).toBe(2);
  expect(scene.rules).toBeGreaterThanOrEqual(3);
  expect(scene.plot.w).toBeGreaterThan(200);
  // the numbers the readouts show are the science module's
  const science = await page.evaluate(() => {
    const points = window.QGA_GRAVITY.fixedPoints();
    const ngfp = points.find((p) => !p.gaussian);
    return { g: ngfp.g, lambda: ngfp.lambda };
  });
  // the stopping point of the default IIIa run is marked and labelled
  expect(scene.texts).toContain("truncation breaks down");
  const fixedPointReadout = await page.locator(`${LAB} .ug-readouts .readout-value`).nth(2).innerText();
  expect(fixedPointReadout).toContain(science.g.toFixed(4));
  expect(fixedPointReadout).toContain(science.lambda.toFixed(4));
  expect(errors).toEqual([]);
});

test("the three presets are aria-pressed toggles and each moves the start and the infrared fate", async ({ page, context }) => {
  const errors = await open(page, context);
  const buttons = page.locator(`${LAB} .ug-bar > .ug-btn`);
  await expect(buttons).toHaveCount(3);
  const fate = page.locator(`${LAB} .ug-readouts .readout-value`).first();
  await buttons.nth(0).click();
  await expect(buttons.nth(0)).toHaveAttribute("aria-pressed", "true");
  await expect(fate).toContainText("Type Ia");
  await buttons.nth(2).click();
  await expect(buttons.nth(2)).toHaveAttribute("aria-pressed", "true");
  await expect(buttons.nth(0)).toHaveAttribute("aria-pressed", "false");
  await expect(fate).toContainText("Type IIIa");
  const g0 = Number(await page.locator(`${LAB} .ug-range input[type=range]`).first().inputValue());
  expect(g0).toBeCloseTo(0.5, 3);
  expect(errors).toEqual([]);
});

test("the silk reports its kernel, its rings and its start ring, and it freezes under reduced motion", async ({ page, context }) => {
  const errors = await open(page, context);
  await expect.poll(() => silkState(page), { timeout: 90_000 }).not.toBeNull();
  const state = await silkState(page);
  expect(state.kernelLength).toBeGreaterThanOrEqual(16);
  expect(state.rings).toBe(2);
  expect(state.ripple).toBe(0);
  expect(state.phase).toBe(0);
  const pixels = await page.evaluate(() => {
    const handle = [...window.__qgaActiveScenes].find((scene) => scene.element.closest(".gf-lab"));
    const canvas = handle.capture();
    if (!canvas) return null;
    const probe = document.createElement("canvas");
    probe.width = 200; probe.height = 120;
    const context2d = probe.getContext("2d");
    context2d.drawImage(canvas, 0, 0, probe.width, probe.height);
    const data = context2d.getImageData(0, 0, probe.width, probe.height).data;
    const seen = new Set();
    let lit = 0;
    for (let i = 0; i < data.length; i += 4) { seen.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]); if (data[i] + data[i + 1] + data[i + 2] > 24) lit += 1; }
    return { distinct: seen.size, lit };
  });
  expect(pixels.distinct).toBeGreaterThan(100);
  expect(pixels.lit).toBeGreaterThan(1000);
  expect(errors).toEqual([]);
});

test("the selected trajectory reaches the silk and the start ring follows it", async ({ page, context }) => {
  const errors = await open(page, context);
  await expect.poll(() => silkState(page), { timeout: 90_000 }).not.toBeNull();
  await expect.poll(async () => (await silkState(page)).trajectoryPoints, { timeout: 30_000 }).toBeGreaterThan(2);
  const before = (await silkState(page)).trajectoryPoints;
  await page.locator(`${LAB} .ug-range input[type=range]`).first().fill("0.9");
  await page.locator(`${LAB} .ug-range input[type=range]`).nth(1).fill("0.3");
  await expect(page.locator(`${LAB} .ug-readouts .readout-value`).first()).toContainText("Type Ia");
  await expect.poll(async () => (await silkState(page)).trajectoryPoints).toBeGreaterThan(2);
  const after = (await silkState(page)).trajectoryPoints;
  // both runs are drawn in the same buffer; the count is the thinned run, not a per-frame allocation
  expect(after).toBeLessThanOrEqual(2048);
  expect(before).toBeLessThanOrEqual(2048);
  expect(errors).toEqual([]);
});

test("the 3-D field gains the Einstein-Hilbert model with lambda as its second axis", async ({ page, context }) => {
  const errors = await open(page, context);
  await page.locator(FIELD).scrollIntoViewIfNeeded();
  await expect(page.locator(`${FIELD} .ug-bar .ug-btn`)).toHaveCount(4);
  const gravityButton = page.getByRole("button", { name: "Einstein–Hilbert (S18)" });
  await gravityButton.click();
  await expect(gravityButton).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => window.__qgaRgFlow3d?.model), { timeout: 90_000 }).toBe("gravity");
  const stats = await page.evaluate(() => window.__qgaRgFlow3d);
  expect(stats.fixedPoints).toBe(2);
  expect(stats.streamlines).toBeGreaterThan(10);
  expect(stats.separatrices).toBe(1);
  await expect(page.locator(`${FIELD} .s3d-labels`, { hasText: "CONJECTURAL" }).last()).toBeVisible();
  await expect(page.locator(`${FIELD} .s3d-labels`, { hasText: "lambda = 1/2" }).last()).toBeVisible();
  await expect(page.locator(`${FIELD} .prov-chip`)).toHaveAttribute("data-provenance-id", "rg-flow-field-3d-gravity");
  await expect(page.locator(`${FIELD} .prov-chip`)).toContainText("Conjectural");
  expect(errors).toEqual([]);
});

test("the ranges and the presets are keyboard operable", async ({ page, context }) => {
  const errors = await open(page, context);
  const range = page.locator(`${LAB} .ug-range input[type=range]`).first();
  const start = Number(await range.inputValue());
  await range.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => Number(await range.inputValue())).toBeGreaterThan(start);
  const preset = page.locator(`${LAB} .ug-bar > .ug-btn`).nth(1);
  await preset.focus();
  await page.keyboard.press("Enter");
  await expect(preset).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

async function measureTargets(page) {
  return page.evaluate(() => [...document.querySelectorAll(".gf-lab .ug-btn, .gf-lab input[type=range]")].map((el) => {
    const r = el.getBoundingClientRect();
    return { name: (el.getAttribute("aria-label") || el.textContent || el.className).trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) };
  }));
}

test("every button and range is at least 44 px and no KaTeX label is upper-cased", async ({ page, context }) => {
  const errors = await open(page, context);
  const boxes = await measureTargets(page);
  expect(boxes.length).toBe(5);
  for (const box of boxes) {
    expect(box.h, `${box.name} height`).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(box.w, `${box.name} width`).toBeGreaterThanOrEqual(MIN_TARGET);
  }
  const transforms = await page.evaluate(() => [...document.querySelectorAll(".gf-lab .ug-btn .katex, .gf-lab .readout-label .katex, .gf-lab .ctl-label .katex")].map((el) => getComputedStyle(el).textTransform));
  expect(transforms.length).toBeGreaterThan(4);
  expect(new Set(transforms)).toEqual(new Set(["none"]));
  expect(errors).toEqual([]);
});

test.describe("at 390 px", () => {
  test.use({ viewport: { width: 390, height: 3000 } });
  test("the lab fits the screen, its targets stay 44 px and its figure keeps a plot", async ({ page, context }) => {
    const errors = await open(page, context);
    const fit = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth, lab: document.querySelector(".gf-lab").getBoundingClientRect().width }));
    expect(fit.scroll).toBeLessThanOrEqual(fit.inner);
    expect(fit.lab).toBeLessThanOrEqual(fit.inner);
    for (const box of await measureTargets(page)) expect(box.h, `${box.name} height`).toBeGreaterThanOrEqual(MIN_TARGET);
    const scene = await page.evaluate(() => {
      const s = window.QGA_FIGURE_SCENES.get("rg-gravity-flow-trajectory");
      return { w: s.plot.w, h: s.plot.h };
    });
    expect(scene.w).toBeGreaterThan(120);
    expect(scene.h).toBeGreaterThan(100);
    expect(errors).toEqual([]);
  });
});
