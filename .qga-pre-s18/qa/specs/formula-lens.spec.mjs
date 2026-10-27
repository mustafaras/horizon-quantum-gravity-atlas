// Formula Lens (S10): focusing a term of a typeset formula highlights its counterpart in the scene.
//
//   keyboard   focusing a term publishes the typed `formula-term` event; Enter pins, Escape drops
//   field      the Newtonian-potential term paints the GR well: the canvas changes, blur restores it byte for byte,
//              and no WebGL program is linked while doing so (no recompilation)
//   objects    the Schwarzschild terms (Kerr observatory) and the Planck constants (descent) show their object
//
// The scenes run on the CI renderer (the node renderer's WebGL2 backend). Pixel comparisons use reduced motion and a
// paused scene so that nothing but the lens can change the canvas; every hash covers the full-resolution capture.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ viewport: { width: 1280, height: 2400 } });
test.setTimeout(180_000);
const READINESS = ["fonts", "network-idle", "view-mounted"];
const G = 6.6743e-11, C = 299792458, SOLAR_MASS = 1.98847e30; // CODATA 2018 / IAU 2015, as in js/science/constants.mjs

async function open(page, context, url) {
  await context.addInitScript(() => {
    window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2" };
    sessionStorage.setItem("horizon-intro", "1");
    // Dev instrumentation: every WebGL program link is a (re)compilation.
    window.__programLinks = 0;
    const link = WebGL2RenderingContext.prototype.linkProgram;
    WebGL2RenderingContext.prototype.linkProgram = function (...args) { window.__programLinks += 1; return link.apply(this, args); };
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await gotoReady(page, url, READINESS);
  await expect.poll(() => page.evaluate(() => window.__qgaActiveScenes?.size ?? 0), { timeout: 90_000 }).toBeGreaterThan(0);
  await page.evaluate(() => {
    window.__termEvents = [];
    window.QGA_CONCEPT_BUS.on("formula-term", (payload) => window.__termEvents.push({ ...payload }));
    window.QGA_CONCEPT_BUS.on("formula-clear", (payload) => window.__termEvents.push({ clear: payload.reason }));
  });
  return errors;
}

/** FNV-1a of the full-resolution capture of every live scene. */
const sceneHashes = (page) => page.evaluate(() => [...window.__qgaActiveScenes].map((scene) => {
  const canvas = scene.capture();
  if (!canvas) return null;
  const copy = document.createElement("canvas");
  copy.width = canvas.width; copy.height = canvas.height;
  const context = copy.getContext("2d");
  context.drawImage(canvas, 0, 0);
  const data = context.getImageData(0, 0, copy.width, copy.height).data;
  let hash = 2166136261;
  for (let i = 0; i < data.length; i += 1) { hash ^= data[i]; hash = Math.imul(hash, 16777619) >>> 0; }
  return hash;
}));
/**
 * The outline of `term` in the descent's scene graph: is it drawn (visible all the way up), which ring owns it, and
 * how many engraved lines it holds. The descent's probe glow pulses with the scene clock on every frame, so its
 * canvas never repeats exactly; the scene graph is where the lens' own state is exact.
 */
const outlineState = (page, term) => page.evaluate((termId) => {
  const handle = [...window.__qgaActiveScenes].find((scene) => scene.element.closest('[aria-label^="Three-dimensional descent"]'));
  let group = null;
  handle.element.__qga.scene.traverse((node) => { if (node.name === `term-lens:${termId}`) group = node; });
  let drawn = true;
  for (let node = group; node; node = node.parent) drawn = drawn && node.visible;
  const lines = group.children.filter((child) => child.userData.engraved);
  return {
    drawn, lines: lines.length, halo: lines.every((line) => !!line.userData.engraved.halo),
    ringRadius: group.parent.geometry.parameters.radius, ringY: group.parent.position.y,
  };
}, term);
const events = (page) => page.evaluate(() => window.__termEvents);
const lensState = (page) => page.evaluate(() => window.__qgaTermLens ?? null);
const links = (page) => page.evaluate(() => window.__programLinks);
const card = (page, title) => page.locator(`[data-qga-formula="${title}"]`);
/** Pause the scene so only the lens can change its canvas. */
async function pause(stage) {
  await stage.scrollIntoViewIfNeeded();
  await stage.focus();
  await stage.page().keyboard.press("Space");
}
/** Hashes of two consecutive captures that agree: the paused scene has stopped changing. */
async function settledHashes(page) {
  let last = await sceneHashes(page);
  await expect.poll(async () => {
    const next = await sceneHashes(page);
    const same = JSON.stringify(next) === JSON.stringify(last);
    last = next;
    return same;
  }, { timeout: 20_000 }).toBe(true);
  return last;
}
/*
 * A term lives in a card that can be far from its scene, and a scene that is scrolled out of view stops drawing, so
 * the highlight of a term is seen by pinning it (Enter) and bringing the scene back into view.
 */
async function pinTerm(term, stage) {
  await term.focus();
  await term.page().keyboard.press("Enter");
  await stage.scrollIntoViewIfNeeded();
}
const blur = (page) => page.locator("body").click({ position: { x: 4, y: 4 } });
const changed = (before, after) => after.some((hash, i) => hash !== null && hash !== before[i]);
const DESCENT = '[aria-label^="Three-dimensional descent"]';

test.describe("keyboard and accessibility", () => {
  test("terms are focusable named buttons; Enter pins, Escape drops, and the readout is a live region", async ({ page, context }) => {
    const errors = await open(page, context, "/?view=bh&seed=42");
    const schwarzschild = card(page, "Schwarzschild radius");
    const rs = schwarzschild.locator('[data-term="r_s"]');
    await expect(rs).toHaveAttribute("tabindex", "0");
    await expect(rs).toHaveAttribute("role", "button");
    await expect(rs).toHaveAttribute("aria-label", "Schwarzschild radius: r_s");
    await expect(schwarzschild.locator('[data-term="M"]')).toHaveAttribute("aria-label", "M: black-hole mass");
    await expect(schwarzschild.locator(".fc-lens-readout")).toHaveAttribute("aria-live", "polite");

    await rs.focus();
    await expect(rs).toBeFocused();
    expect((await events(page)).at(-1)).toMatchObject({ formulaId: "schwarzschild-radius", termId: "r_s", unit: "m" });
    await expect(schwarzschild.locator(".fc-lens-readout")).toContainText("Schwarzschild radius: r_s");

    await page.keyboard.press("Enter");
    await expect(rs).toHaveAttribute("aria-pressed", "true");
    await blur(page);
    expect(await lensState(page), "a pinned term stays highlighted when focus leaves").toMatchObject({ termId: "r_s" });
    await rs.focus();
    await page.keyboard.press("Escape");
    await expect(rs).toHaveAttribute("aria-pressed", "false");
    expect(await lensState(page)).toBeNull();
    expect((await events(page)).at(-1)).toEqual({ clear: "escape" });
    expect(errors).toEqual([]);
  });

  test("every term has a hit area of at least 44 px and no animation runs while a term is highlighted", async ({ page, context }) => {
    await open(page, context, "/?view=bh&seed=42");
    const term = card(page, "Schwarzschild radius").locator('[data-term="M"]');
    const area = await term.evaluate((el) => { const s = getComputedStyle(el, "::after"); return { w: parseFloat(s.width), h: parseFloat(s.height) }; });
    expect(area.w).toBeGreaterThanOrEqual(44);
    expect(area.h).toBeGreaterThanOrEqual(44);
    await term.focus();
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").map((a) => a.animationName || a.constructor.name));
    expect(running, "reduced motion: the highlight is static").toEqual([]);
  });
});

test.describe("field: the Newtonian potential over the curvature well", () => {
  test("focus paints the field, blur restores the canvas exactly, and nothing is recompiled", async ({ page, context }) => {
    const errors = await open(page, context, "/?view=gr&seed=42");
    await pause(page.locator(".s3d-stage").first());
    const term = card(page, "Newtonian limit · weak-field potential").locator('[data-term="phi"]');
    const baseline = await settledHashes(page);
    expect(baseline.every((hash) => hash !== null), "the scene is rendering").toBe(true);

    const linksBefore = await links(page);
    for (let cycle = 0; cycle < 2; cycle += 1) {
      await term.focus();
      expect(await lensState(page)).toEqual({ sceneId: "gr-well", formulaId: "newtonian-potential", termId: "phi", kind: "field" });
      expect(changed(baseline, await sceneHashes(page)), `cycle ${cycle}: the field changes the canvas`).toBe(true);
      await expect(page.locator(".term-lens-legend")).toBeVisible();
      await blur(page);
      expect(await lensState(page)).toBeNull();
      expect(await sceneHashes(page), `cycle ${cycle}: blur restores every pixel`).toEqual(baseline);
      await expect(page.locator(".term-lens-legend")).toBeHidden();
    }
    expect(await links(page) - linksBefore, "WebGL programs linked while the lens was used").toBe(0);

    const event = (await events(page)).find((e) => e.termId === "phi");
    expect(event).toMatchObject({ formulaId: "newtonian-potential", termId: "phi" });
    expect(event.value).toBeCloseTo(-(0.55 * 5) / 4, 9); // default mass 5, GM = 0.55 * 5, reference radius 4
    expect(errors).toEqual([]);
  });

  test("the legend states the term, its range, its unit and that the scale is schematic", async ({ page, context }) => {
    await open(page, context, "/?view=gr&seed=42");
    await card(page, "Newtonian limit · weak-field potential").locator('[data-term="phi"]').focus();
    const legend = page.locator(".term-lens-legend");
    await expect(legend).toHaveAttribute("role", "img");
    await expect(legend).toHaveAttribute("aria-label", /^Colour scale for Φ\/c\^2: from -5\.500 to -0\.0647\d*, dimensionless\. established; schematic scale/);
    await expect(legend.locator(".katex")).toBeVisible();
    await expect(legend).toContainText("-5.500");
    const z = await legend.evaluate((el) => getComputedStyle(el).zIndex);
    expect(Number(z), "above the canvas, which paints over a z-index: auto label layer").toBeGreaterThan(0);
    const bar = legend.locator("canvas");
    const ends = await bar.evaluate((canvas) => {
      const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      return { top: [...data.slice(0, 3)], bottom: [...data.slice(-4, -1)] };
    });
    expect(ends.top, "high end of the ramp").not.toEqual(ends.bottom);
  });
});

test.describe("objects: the Schwarzschild terms in the Kerr observatory", () => {
  test("r_s outlines the horizon sphere and M reads the slider mass, both with the live value", async ({ page, context }) => {
    const errors = await open(page, context, "/?view=bh&seed=42");
    const stage = page.locator(".s3d-stage").first();
    await pause(stage);
    const baseline = await settledHashes(page);
    const schwarzschild = card(page, "Schwarzschild radius");

    await pinTerm(schwarzschild.locator('[data-term="r_s"]'), stage);
    expect(await lensState(page)).toEqual({ sceneId: "kerr-observatory", formulaId: "schwarzschild-radius", termId: "r_s", kind: "object" });
    const rs = (await events(page)).find((e) => e.termId === "r_s");
    await expect(page.locator(".s3d-annot", { hasText: "r_s = 2GM/c²" })).toBeVisible();
    expect(changed(baseline, await settledHashes(page)), "the outline is drawn over the scene").toBe(true);

    await pinTerm(schwarzschild.locator('[data-term="M"]'), stage);
    const label = page.locator(".s3d-label.s3d-lens-on");
    await expect(label).toBeVisible();
    await expect(page.locator(".s3d-annot", { hasText: "r_s = 2GM/c²" }), "one term at a time").toBeHidden();
    const solar = Number((await label.innerText()).match(/^M = ([\d.]+) M☉$/)[1]);
    expect(rs.value / (2 * G * solar * SOLAR_MASS / (C * C)), "r_s of the slider mass, to the 4 figures shown").toBeCloseTo(1, 3);

    await schwarzschild.locator('[data-term="M"]').focus();
    await page.keyboard.press("Escape");
    await stage.scrollIntoViewIfNeeded();
    expect(await lensState(page)).toBeNull();
    await expect(label).toBeHidden();
    expect(await settledHashes(page), "dropping the pin restores the canvas").toEqual(baseline);
    expect(errors).toEqual([]);
  });
});

test.describe("objects: the Planck constants in the descent", () => {
  const CONSTANTS = [
    { term: "hbar", value: 1.054571817e-34, unit: "J s", gate: /atomic scale/ },
    { term: "c", value: 299792458, unit: "m s^-1", gate: /nuclear scale/ },
    { term: "G", value: 6.6743e-11, unit: "m^3 kg^-1 s^-2", gate: /Planck scale/ },
  ];

  test("each constant reports its CODATA value and shows its own decade gate", async ({ page, context }) => {
    const errors = await open(page, context, "/?view=planck&seed=42");
    const stage = page.locator(DESCENT);
    await pause(stage);
    const planck = card(page, "Planck units");
    const linksBefore = await links(page);
    for (const { term, value, unit, gate } of CONSTANTS) {
      const plain = await outlineState(page, term);
      expect(plain.drawn, `${term}: the outline starts hidden`).toBe(false);
      expect(plain.lines, `${term}: built up front, with a halo`).toBeGreaterThan(0);
      expect(plain.halo).toBe(true);
      await pinTerm(planck.locator(`[data-term="${term}"]`), stage);
      expect(await lensState(page)).toEqual({ sceneId: "planck-descent", formulaId: "planck-length", termId: term, kind: "object" });
      const event = (await events(page)).findLast((e) => e.termId === term);
      expect(event).toMatchObject({ formulaId: "planck-length", termId: term, unit });
      expect(event.value / value).toBeCloseTo(1, 9);
      const note = page.locator(".s3d-annot.s3d-lens-note", { hasText: gate });
      await expect(note).toBeVisible();
      await expect(note).toContainText("schematic association");
      expect((await outlineState(page, term)).drawn, `${term}: the gate outline is drawn`).toBe(true);
      for (const other of CONSTANTS.filter((c) => c.term !== term)) expect((await outlineState(page, other.term)).drawn, `${term} shown: ${other.term} is not`).toBe(false);
      await planck.locator(`[data-term="${term}"]`).focus();
      await page.keyboard.press("Escape");
      await stage.scrollIntoViewIfNeeded();
      await expect(note).toBeHidden();
      expect((await outlineState(page, term)).drawn, `${term}: dropping the pin hides the outline`).toBe(false);
    }
    expect(await links(page) - linksBefore, "outlines reuse the engraved-line programs").toBe(0);
    expect(errors).toEqual([]);
  });

  test("the card still states the Planck energy it showed before the lens", async ({ page, context }) => {
    await open(page, context, "/?view=planck&seed=42");
    await expect(card(page, "Planck units").locator(".fc-eq .katex-mathml annotation")).toContainText("1.22\\times10^{19}");
  });
});
