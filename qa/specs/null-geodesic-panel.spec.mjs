// Null-geodesic panel (GR view): photons travel the light paths on the integrator's clock.
//
//   motion    with motion allowed the overlay canvas changes frame to frame and the clock readout advances; Pause freezes both
//   scrub     the time slider pauses, places the photons at the chosen time and redraws them
//   reduced   with reduced motion the panel starts paused, at the wavefront mid-flight, and nothing moves until Play
//   figure    the static geodesics stay a Figure Kit figure with its provenance
//
// The overlay is a plain 2-D canvas, so no GPU backend is involved.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ viewport: { width: 1280, height: 1800 } });
test.setTimeout(120_000);
const READINESS = ["fonts", "network-idle", "view-mounted"];
const FIGURE = '.fig[data-figure="gr-null-geodesics"]';
const PHOTONS = `${FIGURE} .ng-photons`;
const SLIDER = '.ng-bar input[type="range"]';
const PLAY = ".ng-bar .ng-btn";

async function open(page, { reducedMotion }) {
  await page.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await gotoReady(page, "/?view=gr&seed=42", READINESS);
  await page.locator(FIGURE).scrollIntoViewIfNeeded();
  await expect(page.locator(PHOTONS)).toBeVisible();
  return errors;
}

/** A cheap fingerprint of the overlay: the count of painted pixels and a checksum of the alpha channel. */
const fingerprint = (page) => page.evaluate((selector) => {
  const canvas = document.querySelector(selector);
  const { data } = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
  let painted = 0, sum = 0;
  for (let i = 3; i < data.length; i += 4) { if (data[i]) { painted++; sum = (sum + data[i] * (i % 9973)) % 1_000_003; } }
  return { painted, sum };
}, PHOTONS);
const clock = (page) => page.locator(SLIDER).inputValue().then(Number);

test("with motion allowed the photons move, and Pause stops them", async ({ page }) => {
  const errors = await open(page, { reducedMotion: false });
  await expect(page.locator(PLAY)).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await fingerprint(page)).painted).toBeGreaterThan(0);
  const first = await fingerprint(page), t0 = await clock(page);
  await expect.poll(async () => (await fingerprint(page)).sum, { timeout: 5_000 }).not.toBe(first.sum);
  await expect.poll(() => clock(page), { timeout: 5_000 }).not.toBe(t0);

  await page.locator(PLAY).click();
  await expect(page.locator(PLAY)).toHaveAttribute("aria-pressed", "false");
  const frozen = await fingerprint(page), frozenClock = await clock(page);
  await page.waitForTimeout(600);
  expect(await fingerprint(page)).toEqual(frozen);
  expect(await clock(page)).toBe(frozenClock);
  expect(errors).toEqual([]);
});

test("scrubbing the time slider pauses and redraws the photons at that time", async ({ page }) => {
  const errors = await open(page, { reducedMotion: false });
  const slider = page.locator(SLIDER);
  await slider.fill("0.4");
  await expect(page.locator(PLAY)).toHaveAttribute("aria-pressed", "false");
  const early = await fingerprint(page);
  expect(early.painted).toBeGreaterThan(0);
  await slider.fill("1.1");
  const later = await fingerprint(page);
  expect(later.sum).not.toBe(early.sum);
  await page.waitForTimeout(400);
  expect(await fingerprint(page)).toEqual(later);
  expect(errors).toEqual([]);
});

test("with reduced motion the panel rests mid-flight until Play is pressed", async ({ page }) => {
  const errors = await open(page, { reducedMotion: true });
  await expect(page.locator(PLAY)).toHaveAttribute("aria-pressed", "false");
  expect(await clock(page)).toBeCloseTo(0.7, 2);
  const resting = await fingerprint(page);
  expect(resting.painted).toBeGreaterThan(0);
  await page.waitForTimeout(600);
  expect(await fingerprint(page)).toEqual(resting);
  await page.locator(PLAY).click();
  await expect.poll(async () => (await fingerprint(page)).sum, { timeout: 5_000 }).not.toBe(resting.sum);
  expect(errors).toEqual([]);
});

test.describe("on a 2x display", () => {
  test.use({ deviceScaleFactor: 2, viewport: { width: 390, height: 1800 } });
  test("the photon overlay has the CSS box of the figure canvas and a 2x backing store", async ({ page }) => {
    const errors = await open(page, { reducedMotion: true });
    const sizes = await page.evaluate(() => {
      const box = (el) => { const r = el.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
      const figure = document.querySelector('.fig[data-figure="gr-null-geodesics"] .fig-canvas');
      const overlay = document.querySelector('.fig[data-figure="gr-null-geodesics"] .ng-photons');
      return { figure: box(figure), overlay: box(overlay), backing: [overlay.width, overlay.height] };
    });
    expect(sizes.overlay).toEqual(sizes.figure);
    expect(sizes.backing).toEqual(sizes.figure.map((n) => n * 2));
    expect((await fingerprint(page)).painted).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
});

test("the static geodesics remain a registered Figure Kit figure and the readout is typeset", async ({ page }) => {
  await open(page, { reducedMotion: true });
  await expect(page.locator(FIGURE)).toHaveAttribute("data-status", "effective");
  await expect(page.locator(".ng-bar .ng-clock .katex")).toBeVisible();
  await expect(page.locator(`${FIGURE} .ng-note .katex`).first()).toBeVisible();
});
