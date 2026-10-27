// Provenance and layers (S11).
//
//   chips      every status chip opens the drawer of its own registry entry by keyboard, and Escape returns focus
//   layers     every drawn object of a scene carries a layer class (data, model or decoration)
//   scientific the scientific mode hides decoration objects and changes only their pixels
//   seed       two loads with the same seed draw the same backdrop, frame for frame
//
// Scenes run on the CI renderer (the node renderer's WebGL2 backend). Pixel comparisons use reduced motion and the
// full-resolution canvas, as in formula-lens.spec.mjs.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ viewport: { width: 1280, height: 2400 } });
test.setTimeout(240_000);
const READINESS = ["fonts", "network-idle", "view-mounted"];
const VIEWS = ["overview", "sm", "qft", "rg", "gr", "planck", "approaches", "bh", "exp"];

async function open(page, context, url) {
  await context.addInitScript(() => {
    window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2" };
    sessionStorage.setItem("horizon-intro", "1");
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
  await gotoReady(page, url, READINESS);
  return errors;
}

const scenesReady = (page) => expect.poll(() => page.evaluate(() => {
  const mounts = [...document.querySelectorAll("[data-engraved-backend]")];
  return mounts.length > 0 && mounts.every((mount) => !!mount.__qga) && (window.__qgaActiveScenes?.size ?? 0) > 0;
}), { timeout: 200_000 }).toBe(true);

for (const view of VIEWS) {
  test(`${view}: every status chip opens its own drawer by keyboard`, async ({ page, context }) => {
    const errors = await open(page, context, `/?view=${view}`);
    const ids = await page.evaluate(() => [...document.querySelectorAll(".prov-chip")].map((chip) => chip.dataset.provenanceId));
    expect(ids.length).toBeGreaterThan(0);
    for (const id of new Set(ids)) {
      const chip = page.locator(`.prov-chip[data-provenance-id="${id}"]`).first();
      await chip.scrollIntoViewIfNeeded();
      await chip.focus();
      await page.keyboard.press("Enter");
      const drawer = page.locator(`.prov-drawer[data-provenance-id="${id}"]`);
      await expect(drawer).toBeVisible();
      await expect(drawer).toBeFocused();
      const entry = await page.evaluate((key) => window.QGA_PROVENANCE.get(key), id);
      await expect(drawer.locator(".prov-model")).toHaveText(entry.model);
      await expect(drawer.locator(".prov-layers tbody tr")).toHaveCount(entry.layers.length);
      await expect(drawer.locator(".prov-seed")).toHaveText(entry.seed);
      expect(await drawer.locator(".prov-link").count()).toBeGreaterThan(0);
      await page.keyboard.press("Escape");
      await expect(drawer).toHaveCount(0);
      await expect(chip).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
}

test("every drawn object of every module scene carries a layer class", async ({ page, context }) => {
  test.setTimeout(480_000);
  const missing = [];
  for (const view of VIEWS) {
    await open(page, context, `/?view=${view}`);
    await scenesReady(page);
    const found = await page.evaluate(() => [...document.querySelectorAll("[data-engraved-backend]")].flatMap((mount) =>
      window.QGA_LAYERS.untagged(mount.__qga.scene).map((object) => `${object.type}/${object.geometry?.type ?? "-"}/${object.material?.type ?? "-"}/${object.name || "unnamed"}`)));
    if (found.length) missing.push(`${view}: ${[...new Set(found)].join(", ")}`);
  }
  expect(missing).toEqual([]);
});

const mountOf = (aria) => `[data-engraved-backend][aria-label^="${aria}"], [aria-label^="${aria}"] [data-engraved-backend], [data-engraved-backend]:has([aria-label^="${aria}"])`;

/** FNV-1a of the full-resolution capture of the scene whose element sits inside the labelled stage. */
const canvasHash = (page, aria) => page.evaluate((label) => {
  const handle = [...window.__qgaActiveScenes].find((scene) => scene.element.closest(`[aria-label^="${label}"]`) || scene.element.getAttribute("aria-label")?.startsWith(label));
  const canvas = handle.capture();
  const copy = document.createElement("canvas");
  copy.width = canvas.width; copy.height = canvas.height;
  const context = copy.getContext("2d");
  context.drawImage(canvas, 0, 0);
  const data = context.getImageData(0, 0, copy.width, copy.height).data;
  let hash = 2166136261;
  for (let i = 0; i < data.length; i += 1) { hash ^= data[i]; hash = Math.imul(hash, 16777619) >>> 0; }
  return hash;
}, aria);

/** FNV-1a of every Points position buffer in the labelled scene graph (what the seed decides). */
const pointsHash = (page, aria) => page.evaluate((label) => {
  const handle = [...window.__qgaActiveScenes].find((scene) => scene.element.closest(`[aria-label^="${label}"]`) || scene.element.getAttribute("aria-label")?.startsWith(label));
  const root = handle.element.closest("[data-engraved-backend]")?.__qga?.scene ?? handle.element.__qga.scene;
  let hash = 2166136261, count = 0;
  root.traverse((object) => {
    const position = object.isPoints && object.geometry.getAttribute("position");
    if (!position) return;
    count += 1;
    for (const value of position.array) { hash ^= Math.round(value * 1e4) | 0; hash = Math.imul(hash, 16777619) >>> 0; }
  });
  return { hash, count };
}, aria);

test("two loads with the same seed draw the same backdrop, and another seed draws another", async ({ page, context }) => {
  test.setTimeout(300_000);
  const hashes = [];
  for (const seed of [42, 42, 43]) {
    await open(page, context, `/?view=planck&seed=${seed}`);
    await scenesReady(page);
    hashes.push(await pointsHash(page, "Three-dimensional spin network"));
  }
  expect(hashes[0].count).toBeGreaterThan(0);
  expect(hashes[1]).toEqual(hashes[0]);
  expect(hashes[2].hash).not.toBe(hashes[0].hash);
  const frames = [];
  for (const seed of [42, 42]) {
    await open(page, context, `/?view=approaches&seed=${seed}`);
    await scenesReady(page);
    frames.push(await canvasHash(page, "Constellation"));
  }
  expect(frames[1]).toBe(frames[0]);
});

test("the scientific mode hides decoration objects and changes only their pixels", async ({ page, context }) => {
  test.setTimeout(300_000);
  await open(page, context, "/?view=approaches&seed=42");
  await scenesReady(page);
  await page.getByRole("button", { name: "Rendering settings" }).first().click();
  await page.evaluate(() => { window.__previousScene = document.querySelector("[data-engraved-backend]").__qga.scene; });
  await page.getByLabel("Mode", { exact: true }).selectOption("scientific");
  await expect.poll(() => page.evaluate(() => document.querySelector("[data-engraved-backend]")?.__qga?.scene !== window.__previousScene), { timeout: 200_000 }).toBe(true);
  await scenesReady(page);
  await page.getByRole("button", { name: "Close tweaks" }).click();

  const result = await page.evaluate(() => {
    const handle = [...window.__qgaActiveScenes].find((scene) => scene.element.getAttribute("aria-label")?.startsWith("Constellation") || scene.element.closest('[aria-label^="Constellation"]'));
    const root = (handle.element.closest("[data-engraved-backend]") ?? handle.element).__qga.scene;
    const drawn = [];
    root.traverse((object) => { if (object.isMesh || object.isLine || object.isPoints || object.isSprite) drawn.push(object); });
    const own = (object) => object.userData.layer ?? object.userData.engraved?.layer ?? null;
    const decoration = drawn.filter((object) => window.QGA_LAYERS.layerOf(object) === "decoration");
    const others = drawn.filter((object) => window.QGA_LAYERS.layerOf(object) !== "decoration");
    const hiddenInScientific = decoration.every((object) => { for (let node = object; node; node = node.parent) if (!node.visible) return true; return false; });
    const othersShown = others.every((object) => { for (let node = object; node; node = node.parent) if (!node.visible) return false; return true; });
    let width = 0;
    const read = () => {
      const canvas = handle.capture();
      width = canvas.width;
      const copy = document.createElement("canvas");
      copy.width = canvas.width; copy.height = canvas.height;
      const context2d = copy.getContext("2d");
      context2d.drawImage(canvas, 0, 0);
      return context2d.getImageData(0, 0, copy.width, copy.height).data;
    };
    const saved = new Map(drawn.map((object) => [object, object.visible]));
    const hidden = read();
    // Decoration back on: the render that the scientific mode removed.
    for (const object of decoration) object.visible = true;
    const shown = read();
    // Footprint of the decoration alone: everything else hidden, against a render of nothing.
    for (const object of others) object.visible = false;
    const only = read();
    for (const object of decoration) object.visible = false;
    const empty = read();
    for (const [object, visible] of saved) object.visible = visible;
    root.traverse((object) => { if (own(object) === "decoration" && object.parent) object.visible = false; });
    const footprint = (i) => only[i] !== empty[i] || only[i + 1] !== empty[i + 1] || only[i + 2] !== empty[i + 2];
    // One pixel of slack: the antialiasing filter spreads an edge by a pixel.
    const near = (i) => [0, -4, 4, -4 * width, 4 * width].some((d) => i + d >= 0 && i + d < only.length && footprint(i + d));
    let changed = 0, outside = 0;
    for (let i = 0; i < shown.length; i += 4) {
      const differs = Math.max(Math.abs(hidden[i] - shown[i]), Math.abs(hidden[i + 1] - shown[i + 1]), Math.abs(hidden[i + 2] - shown[i + 2])) > 2; // above 8-bit blend rounding
      if (!differs) continue;
      changed += 1;
      if (!near(i)) outside += 1;
    }
    return { decoration: decoration.length, others: others.length, hiddenInScientific, othersShown, changed, outside };
  });
  expect(result.decoration).toBeGreaterThan(0);
  expect(result.others).toBeGreaterThan(0);
  expect(result.hiddenInScientific).toBe(true);
  expect(result.othersShown).toBe(true);
  expect(result.changed).toBeGreaterThan(0);
  expect(result.outside).toBe(0);
});
