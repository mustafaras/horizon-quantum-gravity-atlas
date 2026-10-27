// Higgs lab (S13): the TSL Mexican hat, its symmetric-phase toggle, the running quartic coupling and the stability diagram.
//
//   hat       the surface is the Formula Core potential: the phase uniform, the pinned physical point and the vacuum ring
//             follow the toggle (reduced motion snaps), and the canvas changes
//   figures   lambda(mu) and the (m_t, m_H) diagram are Figure Kit figures with registered provenance
//   controls  the mass sliders move the verdict; the reset button restores the measured point
//
// The scene runs on the CI renderer (the node renderer's WebGL2 backend). Reduced motion is on so that nothing but the
// toggle changes the canvas.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ viewport: { width: 1280, height: 2600 } });
test.setTimeout(240_000);
const READINESS = ["fonts", "network-idle", "view-mounted"];
const HAT = '[aria-label^="Three-dimensional Mexican hat"]';
const RUNNING = '.fig[data-figure="sm-higgs-running"]';
const STABILITY = '.fig[data-figure="sm-higgs-stability"]';
const HAT_UNIT = 2.6, HAT_HEIGHT = 2.2;

async function open(page, context) {
  await context.addInitScript(() => {
    window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2" };
    sessionStorage.setItem("horizon-intro", "1");
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await gotoReady(page, "/?view=sm&seed=42", READINESS);
  await page.locator(".hg-lab").scrollIntoViewIfNeeded();
  await expect.poll(() => hatState(page), { timeout: 120_000 }).not.toBeNull();
  return errors;
}

/** The live state of the hat's scene graph: the phase uniform, the physical point and the vacuum ring. */
const hatState = (page) => page.evaluate((selector) => {
  const handle = [...(window.__qgaActiveScenes ?? [])].find((scene) => scene.element.closest(selector));
  const mount = handle?.element.closest("[data-engraved-backend]") ?? handle?.element;
  const root = mount?.__qga?.scene ?? handle?.element.__qga?.scene;
  if (!root) return null;
  let phase = null, marker = null, ring = null, kit = 0;
  root.traverse((object) => {
    if (object.material?.userData?.kit === "sm-hat") { phase = object.material.userData.phaseUniform.value; kit += 1; }
    if (object.geometry?.type === "SphereGeometry") marker = [object.position.x, object.position.y, object.position.z];
    if (object.userData?.engraved?.widthPx === 2.5) ring = object.position.y;
  });
  return phase === null ? null : { phase, marker, ringLift: ring, kit };
}, HAT);

const hatHash = (page) => page.evaluate((selector) => {
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
}, HAT);

test("the hat is built from the formula, with its KaTeX labels and a registered provenance chip", async ({ page, context }) => {
  const errors = await open(page, context);
  const state = await hatState(page);
  expect(state.kit).toBe(1);
  expect(state.phase).toBe(1);
  expect(state.marker[0]).toBeCloseTo(HAT_UNIT, 6);
  expect(state.marker[1]).toBeCloseTo(-0.25 * HAT_HEIGHT, 6);
  await expect(page.locator('.prov-chip[data-provenance-id="sm-higgs-hat"]')).toBeVisible();
  await expect(page.locator(`${HAT} .s3d-label .katex`).first()).toBeAttached();
  await expect(page.locator(`${HAT}`).first()).toContainText("ESTABLISHED");
  expect(errors).toEqual([]);
});

test("the symmetric phase eases the surface, pins the physical point and changes the canvas; reduced motion snaps", async ({ page, context }) => {
  await open(page, context);
  const before = await hatHash(page);
  const toggle = page.getByRole("button", { name: "Symmetric phase" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await hatState(page)).phase, { timeout: 30_000 }).toBe(-1);
  const symmetric = await hatState(page);
  expect(symmetric.marker[0]).toBeCloseTo(HAT_UNIT, 6);
  expect(symmetric.marker[1]).toBeCloseTo(HAT_HEIGHT * (0.25 + 0.5), 6);
  expect(symmetric.ringLift).toBeCloseTo(HAT_HEIGHT * (0.25 + 0.5) - -0.25 * HAT_HEIGHT, 6);
  await expect.poll(() => hatHash(page), { timeout: 30_000 }).not.toBe(before);
  await toggle.click();
  await expect.poll(async () => (await hatState(page)).phase, { timeout: 30_000 }).toBe(1);
  await expect.poll(() => hatHash(page), { timeout: 30_000 }).toBe(before);
});

test("the figures carry their status and provenance, and the measured point is metastable", async ({ page, context }) => {
  const errors = await open(page, context);
  await expect(page.locator(RUNNING)).toBeVisible();
  await expect(page.locator(`${RUNNING} .fig-summary`)).toContainText("Status: effective");
  await expect(page.locator(STABILITY)).toBeVisible();
  await expect(page.locator(`${STABILITY} .fig-summary`)).toContainText("Status: effective");
  for (const id of ["sm-higgs-running", "sm-higgs-stability"]) await expect(page.locator(`.prov-chip[data-provenance-id="${id}"]`)).toBeVisible();
  const readouts = page.locator(".hg-readouts");
  await expect(readouts).toContainText("246.22 GeV");
  await expect(readouts).toContainText("metastable");
  await expect(readouts).toContainText("quartic crosses zero");
  expect(errors).toEqual([]);
});

test("the running figure's provenance drawer states the truncation", async ({ page, context }) => {
  await open(page, context);
  const chip = page.locator('.prov-chip[data-provenance-id="sm-higgs-running"]');
  await chip.focus();
  await page.keyboard.press("Enter");
  const drawer = page.locator('.prov-drawer[data-provenance-id="sm-higgs-running"]');
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText("Standard Model alone");
  await expect(drawer).toContainText("Buttazzo");
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
});

test("the mass sliders move the verdict and the reset button restores the measured point", async ({ page, context }) => {
  await open(page, context);
  const reset = page.getByRole("button", { name: "measured masses" });
  await expect(reset).toBeDisabled();
  const top = page.getByRole("slider", { name: "top quark mass" });
  await top.focus();
  await page.keyboard.press("End"); // 185 GeV
  await expect(page.locator(".hg-readouts")).toContainText("unstable");
  await expect(reset).toBeEnabled();
  await expect(page.locator(`${STABILITY} .fig-summary`)).toContainText("Status: effective");
  await page.keyboard.press("Home"); // 160 GeV
  await expect(page.locator(".hg-readouts")).toContainText("absolutely stable");
  await reset.click();
  await expect(page.locator(".hg-readouts")).toContainText("metastable");
  await expect(reset).toBeDisabled();
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("the lab fits 390 px and its buttons meet the 44 px touch target", async ({ page, context }) => {
    await open(page, context);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const small = await page.evaluate(() => [...document.querySelectorAll(".hg-lab .hg-btn")]
      .map((el) => ({ text: el.textContent.trim(), h: el.getBoundingClientRect().height, w: el.getBoundingClientRect().width }))
      .filter((b) => b.h < 44 || b.w < 44));
    expect(small).toEqual([]);
  });
});
