// Neutrino lab (S12): the three-flavour flavour ribbon, its controls, the delta_CP dial and the provenance chip.
//
// Nothing here needs WebGL: the lab is a Figure Kit figure and an SVG dial, so these run on any CI browser.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

const FIGURE = '.fig[data-figure="sm-neutrino-flavour"]';
const READINESS = ["fonts", "network-idle", "view-mounted"];

async function open(page) {
  const errors = await gotoReady(page, "/?view=sm&seed=42", READINESS);
  await page.locator(".nu-lab").scrollIntoViewIfNeeded();
  await expect(page.locator(FIGURE)).toBeVisible();
  return errors;
}

test("the ribbon opens on T2K in matter, with its provenance chip", async ({ page }) => {
  const errors = await open(page);
  await expect(page.getByRole("button", { name: /T2K · 295 km/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('.prov-chip[data-provenance-id="sm-neutrino-flavour-matter"]')).toBeVisible();
  await expect(page.locator(`${FIGURE} .fig-summary`)).toContainText("Status: effective");
  await expect(page.locator(".nu-readouts")).toContainText("matter potential V");
  expect(errors()).toEqual([]);
});

test("without matter the figure is established and its chip names the vacuum entry", async ({ page }) => {
  await open(page);
  const density = page.getByRole("slider", { name: "matter density" });
  await density.focus();
  await page.keyboard.press("Home");
  const chip = page.locator('.prov-chip[data-provenance-id="sm-neutrino-flavour-vacuum"]');
  await expect(chip).toBeVisible();
  await expect(page.locator(`${FIGURE} .fig-summary`)).toContainText("Status: established");
  await expect(page.locator(".nu-readouts")).toContainText("none without matter");
  await chip.focus();
  await page.keyboard.press("Enter");
  const drawer = page.locator('.prov-drawer[data-provenance-id="sm-neutrino-flavour-vacuum"]');
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText("NuFit-6.0");
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
});

test("the delta_CP dial is a slider: 1 degree, 15 degrees with Shift, Home and End", async ({ page }) => {
  await open(page);
  const dial = page.getByRole("slider", { name: "CP phase delta" });
  await expect(dial).toHaveAttribute("aria-valuenow", "212");
  await dial.focus();
  await page.keyboard.press("ArrowRight");
  await expect(dial).toHaveAttribute("aria-valuenow", "213");
  await page.keyboard.press("Shift+ArrowRight");
  await expect(dial).toHaveAttribute("aria-valuenow", "228");
  await page.keyboard.press("ArrowLeft");
  await expect(dial).toHaveAttribute("aria-valuenow", "227");
  await page.keyboard.press("PageDown");
  await expect(dial).toHaveAttribute("aria-valuenow", "212");
  await page.keyboard.press("Home");
  await expect(dial).toHaveAttribute("aria-valuenow", "0");
  await page.keyboard.press("End");
  await expect(dial).toHaveAttribute("aria-valuenow", "360");
  await expect(dial).toHaveAttribute("aria-valuetext", "360 degrees");
});

test("the dial changes the numbers: delta = 0 and delta = 90 degrees give different appearance", async ({ page }) => {
  await open(page);
  const dial = page.getByRole("slider", { name: "CP phase delta" });
  const readout = () => page.locator(".nu-readouts .readout-value").first().textContent();
  await dial.focus();
  await page.keyboard.press("Home");
  const zero = await readout();
  for (let i = 0; i < 6; i += 1) await page.keyboard.press("Shift+ArrowRight");
  await expect(dial).toHaveAttribute("aria-valuenow", "90");
  expect(await readout()).not.toBe(zero);
});

test("experiment presets set the baseline, the flavour, the channel type and the density", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: /DUNE · 1300 km/ }).click();
  await expect(page.getByRole("button", { name: /DUNE · 1300 km/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("slider", { name: "baseline L" })).toHaveValue("1300");
  await expect(page.getByRole("slider", { name: "matter density" })).toHaveValue("2.85");
  await page.getByRole("button", { name: /JUNO · 52.5 km/ }).click();
  await expect(page.getByRole("button", { name: "Born as electron" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "ν̄" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".nu-readouts")).toContainText("1–3 resonance (antineutrinos)");
});

test("ordering and axis buttons rebuild the figure and keep its focal line keyboard-reachable", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "IO", exact: true }).click();
  await expect(page.getByRole("slider", { name: "CP phase delta" })).toHaveAttribute("aria-valuenow", "274");
  await page.getByRole("button", { name: "L/E at fixed E" }).click();
  await expect(page.getByRole("slider", { name: "energy E" })).toBeVisible();
  const plot = page.locator(`${FIGURE} .fig-plot`);
  const readout = page.locator(`${FIGURE} .fig-readout`);
  await plot.focus();
  await page.keyboard.press("Home");
  await expect(readout).toContainText("L/E [km/GeV] = 0,");
  await page.getByRole("button", { name: "E at fixed L" }).click();
  await plot.focus();
  await page.keyboard.press("Home");
  await expect(readout).toContainText("E [GeV] = 0.1,");
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("the lab fits 390 px and every control meets the 44 px touch target", async ({ page }) => {
    await open(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const small = await page.evaluate(() => [...document.querySelectorAll(".nu-lab .nu-btn")]
      .map((el) => ({ text: el.textContent.trim(), h: el.getBoundingClientRect().height, w: el.getBoundingClientRect().width }))
      .filter((b) => b.h < 44 || b.w < 44));
    expect(small).toEqual([]);
    const dial = await page.locator(".nu-dial").boundingBox();
    expect(dial.width).toBeGreaterThanOrEqual(44);
    expect(dial.height).toBeGreaterThanOrEqual(44);
  });
});
