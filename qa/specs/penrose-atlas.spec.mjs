// The Penrose atlas of the GR view (S19), in the page.
//
//   diagrams   three panels, each with its registered status: two established, the Reissner-Nordstrom block schematic
//   maps       the scene reports the extents the science module publishes, so the drawing is the map and not a sketch
//   worldline  the focal free fall crosses the horizon at a finite diagram point and ends on the singularity
//   release    the proper-time cursor runs the fall under full motion and snaps to its end under reduced motion
//   keyboard   the regions of the diagrams are reachable and cycleable from the keyboard, and the overlay follows
//   tokens     the KaTeX in the readouts and labels is not upper-cased by a text transform
//   targets    every button and range of the lab is at least 44 px on both sides, on the desktop and at 390 px
//   mobile     the lab fits 390 px with no sideways scroll

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ viewport: { width: 1280, height: 2400 } });
test.setTimeout(240_000);
const READINESS = ["fonts", "network-idle", "view-mounted"];
const LAB = ".pn-lab";
const MIN_TARGET = 44;

async function open(page, context, url = "/?view=gr&seed=42") {
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
  return errors;
}

/** The live atlas readout, or null while the scene is still building. The lab publishes its own handle. */
const atlasState = (page) => page.evaluate(() => {
  const handle = window.__qgaPenroseAtlas;
  if (!handle || typeof handle.state !== "function") return null;
  return handle.state();
});

/**
 * The same readout, tolerant of the gap while a scene is being rebuilt: changing the frame tears the old scene down
 * before the new one registers, and a poll that ran in that gap would throw rather than retry.
 */
const atlasStateOrNull = (page) => atlasState(page).catch(() => null);

test("the three diagrams carry their status, and the schematic says so in the canvas", async ({ page, context }) => {
  const errors = await open(page, context);
  await expect.poll(() => atlasState(page), { timeout: 90_000 }).not.toBeNull();
  const state = await atlasState(page);
  expect(state.panels).toEqual(["minkowski", "schwarzschild", "reissner-nordstrom"]);
  // the extents the scene draws are the ones the science module publishes
  expect(state.extent.minkowski.T).toBeCloseTo(Math.PI / 2, 9);
  expect(state.extent.schwarzschild.R).toBeCloseTo(Math.PI, 9);
  const statuses = await page.evaluate(() => ["gr-penrose-atlas", "gr-penrose-minkowski", "gr-penrose-schwarzschild", "gr-penrose-reissner-nordstrom"]
    .map((id) => [id, window.QGA_PROVENANCE.get(id)?.status]));
  expect(Object.fromEntries(statuses)).toEqual({
    "gr-penrose-atlas": "established",
    "gr-penrose-minkowski": "established",
    "gr-penrose-schwarzschild": "established",
    "gr-penrose-reissner-nordstrom": "schematic",
  });
  // the schematic is labelled as such inside the stage, not only in a caption
  await expect(page.locator(`${LAB} .pn-head-status[data-status="schematic"]`)).toHaveCount(1);
  await expect(page.locator(`${LAB} .pn-head-status[data-status="schematic"]`)).toHaveText(/schematic/i);
  expect(errors).toEqual([]);
});

test("the focal worldline is a free fall that crosses the horizon and ends on the singularity", async ({ page, context }) => {
  const errors = await open(page, context);
  await expect.poll(() => atlasState(page), { timeout: 90_000 }).not.toBeNull();
  const state = await atlasState(page);
  expect(state.worldlinePoints).toBeGreaterThan(100);
  // the crossing is on the diagonal T = R, at a finite point of the diagram
  expect(state.crossing.T).toBeCloseTo(state.crossing.R, 12);
  expect(Math.abs(state.crossing.T)).toBeLessThan(Math.PI / 2);
  // the fall ends on r = 0, which the Kruskal compactification puts at T = pi/2
  expect(state.crossing.T).toBeGreaterThan(0);
  expect(state.properTimeEnd).toBeGreaterThan(0);
  expect(state.ticks).toBeGreaterThan(2);
  // the ticks are the science module's, evenly spaced in proper time
  const ticks = state.tickPoints;
  expect(ticks.length).toBe(state.ticks);
  const steps = ticks.slice(1).map((t, i) => t.tau - ticks[i].tau);
  const spread = Math.max(...steps) - Math.min(...steps);
  expect(spread).toBeLessThan(1e-9);
  // And every glyph is on the worldline it marks. A tick is interpolated between two sampled rows, so it lies on the
  // chord those rows span rather than on a vertex: the test measures its distance to the drawn polyline.
  const offCurve = await page.evaluate((points) => {
    const fall = window.QGA_CONFORMAL.freeFallFromRest({ r0: 2.6, M: 1, samples: 361 });
    const rows = fall.rows;
    const segmentDistance = (p, a, b) => {
      const dT = b.T - a.T, dR = b.R - a.R;
      const lengthSq = dT * dT + dR * dR;
      const w = lengthSq > 0 ? Math.max(0, Math.min(1, ((p.T - a.T) * dT + (p.R - a.R) * dR) / lengthSq)) : 0;
      return Math.hypot(p.T - (a.T + dT * w), p.R - (a.R + dR * w));
    };
    return points.map((point) => {
      let best = Infinity;
      for (let i = 1; i < rows.length; i += 1) best = Math.min(best, segmentDistance(point, rows[i - 1], rows[i]));
      return best;
    });
  }, ticks);
  expect(Math.max(...offCurve)).toBeLessThan(1e-9);
  expect(errors).toEqual([]);
});

test("the start radius slider redraws the fall, and the readouts are the module's numbers", async ({ page, context }) => {
  const errors = await open(page, context);
  await expect.poll(() => atlasState(page), { timeout: 90_000 }).not.toBeNull();
  const before = await atlasState(page);
  expect(before.r0).toBeCloseTo(2.6, 9);
  // Driven with a real pointer gesture on the track, which is what a reader does: a scripted `fill` on a range input
  // does not reach this control, and the test is about the reader's path anyway.
  const range = page.locator(`${LAB} input[type=range]`);
  const box = await range.boundingBox();
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);
  await expect.poll(async () => (await atlasStateOrNull(page))?.r0 ?? before.r0).toBeGreaterThan(before.r0);
  const after = await atlasState(page);
  // the DOM and the scene agree about the radius, and the label shows it
  const domValue = Number(await range.inputValue());
  expect(after.r0).toBeCloseTo(domValue, 9);
  await expect(page.locator(`${LAB} .ctl-value`)).toContainText(`${domValue.toFixed(1)}M`);
  // the crossing moves toward i+ as r0 grows, which is the whole point of the slider
  expect(after.crossing.T).toBeGreaterThan(before.crossing.T);
  expect(after.properTimeEnd).toBeGreaterThan(before.properTimeEnd);
  // every readout is the closed form at that radius, not a rounded or tuned number
  const readouts = await page.locator(`${LAB} .pn-readouts .readout-value`).allInnerTexts();
  const science = await page.evaluate((r0) => {
    const fall = window.QGA_CONFORMAL.freeFallFromRest({ r0, M: 1, samples: 361 });
    return { tau: fall.properTimeEnd, etaH: fall.etaHorizon, crossing: fall.horizonCrossing };
  }, domValue);
  expect(readouts[1]).toContain(science.tau.toFixed(3));
  expect(readouts[2]).toContain(science.etaH.toFixed(4));
  expect(readouts[0]).toContain(science.crossing.T.toFixed(3));
  expect(errors).toEqual([]);
});

test("the release cursor snaps to the end under reduced motion", async ({ page, context }) => {
  const errors = await open(page, context);
  await expect.poll(() => atlasState(page), { timeout: 90_000 }).not.toBeNull();
  const release = page.locator(`${LAB} .pn-release`);
  await expect(release).toBeEnabled();
  expect((await atlasState(page)).released).toBe(false);
  await release.click();
  // Under reduced motion the cursor snaps instead of animating: the scene is idle at once, and the button parks
  // itself disabled because there is nothing left to run.
  await expect(release).toBeDisabled();
  await expect.poll(async () => (await atlasState(page)).released).toBe(false);
  // the snapped cursor is the END of the fall, not its start
  await expect.poll(async () => (await atlasStateOrNull(page))?.cursorIndex ?? 0).toBe((await atlasState(page)).worldlinePoints - 1);
  expect(errors).toEqual([]);
});

test("the visible release cursor follows the worldline and can be replayed", async ({ page, context }) => {
  const errors = await open(page, context);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(() => atlasState(page), { timeout: 90_000 }).not.toBeNull();
  const verifyPosition = async () => {
    const state = await atlasState(page);
    const point = await page.evaluate(({ r0, index }) => {
      const rows = window.QGA_CONFORMAL.freeFallFromRest({ r0, M: 1, samples: 361 }).rows;
      const lo = Math.floor(index), hi = Math.min(rows.length - 1, lo + 1), w = index - lo;
      return { T: rows[lo].T + (rows[hi].T - rows[lo].T) * w, R: rows[lo].R + (rows[hi].R - rows[lo].R) * w };
    }, { r0: state.r0, index: state.cursorIndex });
    expect(state.cursorPoint.T).toBeCloseTo(point.T, 9);
    expect(state.cursorPoint.R).toBeCloseTo(point.R, 9);
  };
  await verifyPosition();
  await page.locator(`${LAB} .pn-release`).click();
  await expect.poll(async () => (await atlasStateOrNull(page))?.cursorIndex ?? 0, { timeout: 15_000 }).toBeGreaterThan(1);
  await verifyPosition();
  await expect.poll(async () => (await atlasStateOrNull(page))?.released, { timeout: 20_000 }).toBe(false);
  await verifyPosition();
  await expect(page.locator(`${LAB} .pn-release`)).toHaveText("Replay fall");
  expect(errors).toEqual([]);
});

test("the Kruskal formula connects U and V to their null-ray highlights", async ({ page, context }) => {
  const errors = await open(page, context);
  await expect.poll(() => atlasState(page), { timeout: 90_000 }).not.toBeNull();
  const formula = page.locator('[data-qga-formula="Kruskal coordinates"]');
  for (const term of ["U", "V"]) {
    const target = formula.locator(`[data-term="${term}"]`);
    await expect(target).toHaveAttribute("role", "button");
    await target.focus();
    await expect.poll(() => page.evaluate(() => window.__qgaTermLens), { timeout: 10_000 })
      .toMatchObject({ sceneId: "gr-penrose", formulaId: "penrose-compact-t", termId: term, kind: "object" });
  }
  expect(errors).toEqual([]);
});

test("the regions are keyboard reachable and the overlay follows the focus", async ({ page, context }) => {
  const errors = await open(page, context);
  await expect.poll(() => atlasState(page), { timeout: 90_000 }).not.toBeNull();
  const list = page.locator(`${LAB} .pn-region-list`);
  await list.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => (await atlasState(page)).focused).not.toBeNull();
  const first = (await atlasState(page)).focused;
  await expect(page.locator(`${LAB} .pn-overlay-title`)).toContainText(/region|exterior|interior|spacetime|singularity/i);
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => (await atlasState(page)).focused).not.toBe(first);
  const second = (await atlasState(page)).focused;
  expect(second).not.toBe(first);
  // the region buttons are pressed state toggles, so the overlay is a control and not a decoration
  await expect(page.locator(`${LAB} .pn-region[aria-pressed="true"]`)).toHaveCount(1);
  // and the focus cycles through the regions of every diagram, not just one panel
  expect(await page.locator(`${LAB} .pn-region`).count()).toBeGreaterThanOrEqual(8);
  expect(errors).toEqual([]);
});

test("every button and range is at least 44 px and no KaTeX label is upper-cased", async ({ page, context }) => {
  const errors = await open(page, context);
  const boxes = await page.evaluate(() => [...document.querySelectorAll(".pn-lab .btn, .pn-lab input[type=range]")].map((el) => {
    const r = el.getBoundingClientRect();
    return { name: (el.getAttribute("aria-label") || el.textContent || el.className).trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) };
  }));
  expect(boxes.length).toBeGreaterThanOrEqual(9);
  for (const box of boxes) {
    expect(box.h, `${box.name} height`).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(box.w, `${box.name} width`).toBeGreaterThanOrEqual(MIN_TARGET);
  }
  const transforms = await page.evaluate(() => [...document.querySelectorAll(".pn-lab .readout-label .katex, .pn-lab .readout-value .katex, .pn-lab .ctl-label .katex, .pn-lab .ctl-value .katex, .pn-lab .pn-overlay-title .katex")]
    .map((el) => getComputedStyle(el).textTransform));
  expect(transforms.length).toBeGreaterThan(4);
  expect(new Set(transforms)).toEqual(new Set(["none"]));
  expect(errors).toEqual([]);
});

test.describe("at 390 px", () => {
  test.use({ viewport: { width: 390, height: 3000 } });
  test("the lab fits the screen, its targets stay 44 px and its stage keeps a picture", async ({ page, context }) => {
    const errors = await open(page, context);
    const fit = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth, lab: document.querySelector(".pn-lab").getBoundingClientRect().width }));
    expect(fit.scroll).toBeLessThanOrEqual(fit.inner);
    expect(fit.lab).toBeLessThanOrEqual(fit.inner);
    const scroll = page.locator(`${LAB} .pn-stage-scroll`);
    expect(await scroll.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
    await scroll.evaluate(el => { el.scrollLeft = el.scrollWidth; });
    expect(await scroll.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Minkowski", exact: true }).click();
    expect(await scroll.evaluate(el => el.scrollLeft)).toBe(0);
    await page.getByRole("button", { name: "Schwarzschild", exact: true }).click();
    expect(await scroll.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    for (const box of await page.evaluate(() => [...document.querySelectorAll(".pn-lab .btn, .pn-lab input[type=range]")].map((el) => {
      const r = el.getBoundingClientRect();
      return { name: (el.getAttribute("aria-label") || el.textContent || el.className).trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) };
    }))) expect(box.h, `${box.name} height`).toBeGreaterThanOrEqual(MIN_TARGET);
    await expect.poll(() => atlasState(page), { timeout: 90_000 }).not.toBeNull();
    // the stage keeps a usable picture on a phone rather than collapsing to a sliver
    const stage = await page.evaluate(() => {
      const r = document.querySelector(".pn-lab .s3d-stage").getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    expect(stage.w).toBeGreaterThan(260);
    expect(stage.h).toBeGreaterThan(200);
    expect(errors).toEqual([]);
  });
});
