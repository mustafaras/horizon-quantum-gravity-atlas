// The Casimir cavity lab of the QFT view (S15): two plates, the standing modes between them, the pressure and its log-log figure, in the page,
// on the node renderer's WebGL2 backend.
//
//   scene      the plates stand at the drawn gap of 1 um, the continuum outside is at 30 per cent, nothing in the scene is untagged
//   slider     the log slider (Home 10 nm, End 10 um) moves the plates, the typeset pressure and the canvas
//   figure     the log-log figure and the three captions carry status and registered provenance; the Jaffe caveat is in the caption
//   modesum    three cutoffs, the remainder falling by four for each doubling
//   lens       a, hbar and c of the card, pinned by keyboard, mark the gap and the readout through the Formula Lens; Escape clears them
//   mobile     the lab fits 390 px and its buttons meet the 44 px target
//
// The scene is static: it draws only when the slider changes, so the spec reads the scene graph rather than waiting for motion.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ viewport: { width: 1280, height: 2600 } });
test.setTimeout(240_000);
const READINESS = ["fonts", "network-idle", "view-mounted"];
const LAB = ".cv-lab";
const CAVITY = `${LAB} .s3d-stage`;
const FIGURE = '.fig[data-figure="qft-casimir-pressure"]';
const CARD = '[data-qga-formula="Casimir pressure between ideal plates"]';
// drawnGap(1e-6) = 2.2 + (2/3)(7.0 - 2.2), and a plate's centre is at +-(g/2 + thickness/2)
const DRAWN_1UM = 5.4, DRAWN_MIN = 2.2, DRAWN_MAX = 7.0, PLATE_THICKNESS = 0.45;

async function open(page, context) {
  await context.addInitScript(() => {
    window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2" };
    sessionStorage.setItem("horizon-intro", "1");
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await gotoReady(page, "/?view=qft&seed=42", READINESS);
  await page.locator(LAB).scrollIntoViewIfNeeded();
  await expect.poll(() => cavityState(page), { timeout: 120_000 }).not.toBeNull();
  return errors;
}

/** The live scene graph of the cavity: the drawn gap, the plates, the continuum's opacity, untagged objects and the lens outline. */
const cavityState = (page) => page.evaluate((selector) => {
  const handle = [...(window.__qgaActiveScenes ?? [])].find((scene) => scene.element.closest(selector));
  const mount = handle?.element.closest("[data-engraved-backend]") ?? handle?.element;
  const root = mount?.__qga?.scene ?? handle?.element.__qga?.scene;
  if (!root) return null;
  let drawn = null, opacity = null, outline = null;
  const plates = [];
  root.traverse((object) => {
    if (object.name === "gap") drawn = object.scale.x;
    if (object.geometry?.type === "BoxGeometry") plates.push(object.parent.position.x);
    if (object.userData?.engraved?.segments && object.material?.opacity < 1 && object.material.opacity > 0.1) opacity = object.material.opacity;
    if (object.name === "term-lens:a") outline = object.visible;
  });
  return drawn === null ? null : { drawn, plates: plates.sort((a, b) => a - b), continuumOpacity: opacity, untagged: window.QGA_LAYERS.untagged(root).length, outline };
}, CAVITY);

const canvasHash = (page) => page.evaluate((selector) => {
  const handle = [...window.__qgaActiveScenes].find((scene) => scene.element.closest(selector));
  const canvas = handle.capture();
  const copy = document.createElement("canvas");
  copy.width = canvas.width; copy.height = canvas.height;
  const context = copy.getContext("2d");
  context.drawImage(canvas, 0, 0);
  const data = context.getImageData(0, 0, copy.width, copy.height).data;
  let hash = 2166136261;
  for (let i = 0; i < data.length; i += 1) { hash ^= data[i]; hash = Math.imul(hash, 16777619) >>> 0; }
  return hash;
}, CAVITY);

/** The TeX source of every formula in a region (KaTeX keeps it in an annotation), joined. */
const texOf = (page, selector) => page.locator(`${selector} annotation`).allTextContents().then((list) => list.join(" | "));

test("the plates stand at the drawn gap, the continuum is at 30 per cent and every object carries a layer", async ({ page, context }) => {
  const errors = await open(page, context);
  const state = await cavityState(page);
  expect(state.drawn).toBeCloseTo(DRAWN_1UM, 6);
  expect(state.plates).toHaveLength(2);
  expect(state.plates[1]).toBeCloseTo(DRAWN_1UM / 2 + PLATE_THICKNESS / 2, 6);
  expect(state.plates[0]).toBeCloseTo(-state.plates[1], 6);
  expect(state.continuumOpacity).toBeCloseTo(0.3, 6);
  expect(state.untagged).toBe(0);
  await expect(page.locator(CAVITY).first()).toContainText("SCHEMATIC");
  await expect(page.locator(`${CAVITY} .s3d-label .katex`).first()).toBeAttached();
  expect(await texOf(page, `${CAVITY} .s3d-label`)).toContain("P = -1.30\\times10^{-3}\\,\\mathrm{Pa}");
  expect(errors).toEqual([]);
});

test("the log slider moves the plates, the pressure and the canvas, from 10 nm to 10 um", async ({ page, context }) => {
  const errors = await open(page, context);
  const before = await canvasHash(page);
  const slider = page.getByRole("slider", { name: "plate separation" });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect.poll(async () => (await cavityState(page)).drawn).toBeCloseTo(DRAWN_MIN, 6);
  expect(await texOf(page, ".cv-readouts")).toContain("P = -1.30\\times10^{5}\\,\\mathrm{Pa}");
  await expect.poll(() => canvasHash(page)).not.toBe(before);
  await page.keyboard.press("End");
  await expect.poll(async () => (await cavityState(page)).drawn).toBeCloseTo(DRAWN_MAX, 6);
  expect(await texOf(page, ".cv-readouts")).toContain("P = -1.30\\times10^{-7}\\,\\mathrm{Pa}");
  expect(errors).toEqual([]);
});

test("the preset buttons reproduce the plan's pressures", async ({ page, context }) => {
  await open(page, context);
  await page.locator(`${LAB} .cv-btn`).first().click(); // 100 nm
  expect(await texOf(page, ".cv-readouts")).toContain("P = -1.30\\times10^{1}\\,\\mathrm{Pa}");
  await page.locator(`${LAB} .cv-btn`).nth(1).click(); // 1 um
  expect(await texOf(page, ".cv-readouts")).toContain("P = -1.30\\times10^{-3}\\,\\mathrm{Pa}");
});

test("the figure and the captions carry their status and provenance, and the caption names the Jaffe caveat", async ({ page, context }) => {
  const errors = await open(page, context);
  await expect(page.locator(FIGURE)).toBeVisible();
  await expect(page.locator(`${FIGURE} .fig-summary`)).toContainText("Status: established");
  await expect(page.locator('.fig[data-figure="qft-casimir-agreement"] .fig-summary')).toContainText("Status: established");
  for (const id of ["qft-casimir-cavity", "qft-casimir-pressure", "qft-casimir-agreement", "qft-casimir-mode-sum"]) {
    await expect(page.locator(`.prov-chip[data-provenance-id="${id}"]`).first()).toBeVisible();
  }
  await expect(page.locator(LAB)).toContainText("arXiv:hep-th/0503158");
  const chip = page.locator('.prov-chip[data-provenance-id="qft-casimir-cavity"]').first();
  await chip.focus();
  await page.keyboard.press("Enter");
  const drawer = page.locator('.prov-drawer[data-provenance-id="qft-casimir-cavity"]');
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText("Jaffe");
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("the mode sum converges: the remainder falls by four for each doubling of the cutoff", async ({ page, context }) => {
  await open(page, context);
  const tex = await texOf(page, ".cv-sums .cv-readouts");
  expect(tex).toContain("1-5.00\\times10^{-4}");
  expect(tex).toContain("1-1.25\\times10^{-4}");
  expect(tex).toContain("1-3.12\\times10^{-5}");
});

test("a, hbar and c of the card, pinned by keyboard, mark the gap and the readout through the Formula Lens; Escape clears them", async ({ page, context }) => {
  const errors = await open(page, context);
  const card = page.locator(CARD);
  const terms = await card.locator("[data-term]").evaluateAll((nodes) => nodes.map((node) => node.dataset.term));
  expect(terms).toEqual(expect.arrayContaining(["a", "hbar", "c"]));
  for (const termId of ["a", "hbar", "c"]) {
    await card.locator(`[data-term="${termId}"]`).focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => window.__qgaTermLens ?? null)).toMatchObject({ sceneId: "casimir-cavity", formulaId: "casimir-plates-pressure", termId, kind: "object" });
    if (termId === "a") await expect.poll(async () => (await cavityState(page)).outline).toBe(true);
    await page.keyboard.press("Escape");
    await expect.poll(() => page.evaluate(() => window.__qgaTermLens ?? null)).toBeNull();
  }
  expect((await cavityState(page)).outline).toBe(false);
  expect(errors).toEqual([]);
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("the lab fits 390 px and its buttons meet the 44 px touch target", async ({ page, context }) => {
    await open(page, context);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const small = await page.evaluate(() => [...document.querySelectorAll(".cv-lab .cv-btn")]
      .map((el) => ({ text: el.textContent.trim(), h: el.getBoundingClientRect().height, w: el.getBoundingClientRect().width }))
      .filter((b) => b.h < 44 || b.w < 44));
    expect(small).toEqual([]);
  });
});
