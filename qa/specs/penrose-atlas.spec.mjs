// Penrose Observatory: real user paths and scientific boundaries on the node renderer's WebGL2 backend.
import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ viewport: { width: 1280, height: 1000 } });
test.setTimeout(180_000);
const LAB = ".pn-lab";
const state = (page) => page.evaluate(() => window.__qgaPenroseAtlas?.state?.() ?? null);
async function open(page, context, motion = "reduce") {
  await context.addInitScript(() => { window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2" }; sessionStorage.setItem("horizon-intro", "1"); });
  await page.emulateMedia({ reducedMotion: motion });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await gotoReady(page, "/?view=gr&seed=42", ["fonts", "network-idle", "view-mounted"]);
  await page.locator(".pn-stage-wrap").scrollIntoViewIfNeeded();
  await expect.poll(() => state(page), { timeout: 90_000 }).not.toBeNull();
  await expect(page.locator(".pn-stage-wrap .render-loading")).toBeHidden({ timeout: 90_000 });
  return errors;
}
async function choose(page, name, id) {
  await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
  await expect.poll(async () => (await state(page))?.visiblePanels, { timeout: 90_000 }).toContain(id);
}

test("one large exact map is visible by default and clicks select a real event", async ({ page, context }) => {
  const errors = await open(page, context);
  expect((await state(page)).visiblePanels).toEqual(["minkowski"]);
  await expect(page.getByRole("button", { name: "Watch the map" })).toBeDisabled();
  await expect(page.locator(".pn-intro-control")).toContainText("Reduced motion is on");
  await expect(page.locator(".pn-stage-meta")).toContainText("EXACT MAP");
  const canvas = page.locator(`${LAB} .s3d-canvas`);
  const box = await canvas.boundingBox();
  const projection = await page.locator(`${LAB} .s3d-stage`).evaluate((el) => {
    const camera = el.__qga.camera, rect = el.getBoundingClientRect();
    const a = new window.THREE.Vector3(0, 0, 0).project(camera);
    const b = new window.THREE.Vector3(1, 0, -1).project(camera);
    return { dx: (b.x - a.x) * rect.width / 2, dy: (b.y - a.y) * rect.height / 2 };
  });
  expect(Math.abs(projection.dx)).toBeCloseTo(Math.abs(projection.dy), 5);
  await page.mouse.click(box.x + box.width * .54, box.y + box.height * .50);
  await expect.poll(async () => Math.abs((await state(page))?.event?.R ?? 0)).toBeGreaterThan(0.01);
  const event = (await state(page)).event;
  expect(event.id).toBe("minkowski");
  for (const end of [event.rays.left, event.rays.right]) expect(end.T - event.T).toBeCloseTo(Math.abs(end.R - event.R), 8);
  await page.getByRole("button", { name: "Send light again" }).click();
  const before = (await state(page)).event.R;
  await page.getByRole("button", { name: "Move event right" }).click();
  expect((await state(page)).event.R).toBeCloseTo(before + .1, 8);
  expect(errors).toEqual([]);
});

test("exterior and interior presets show different causal outcomes", async ({ page, context }) => {
  const errors = await open(page, context);
  await choose(page, "Schwarzschild", "schwarzschild");
  await page.getByRole("button", { name: "Outside horizon" }).click();
  await expect(page.locator(".pn-insight")).toContainText("can reach future null infinity");
  expect((await state(page)).event.region).toBe("I");
  await page.getByRole("button", { name: "Inside horizon" }).click();
  await expect(page.locator(".pn-insight")).toContainText("both future-directed radial light paths end at the singularity");
  const event = (await state(page)).event;
  expect(event.region).toBe("II");
  expect(event.rays.left.T).toBeCloseTo(Math.PI / 2, 8);
  expect(event.rays.right.T).toBeCloseTo(Math.PI / 2, 8);
  expect(errors).toEqual([]);
});

test("observer controls seek by proper time, snap on reduced motion, and radius updates", async ({ page, context }) => {
  const errors = await open(page, context);
  await page.getByRole("button", { name: "Follow an observer" }).click();
  await expect.poll(async () => (await state(page))?.visiblePanels, { timeout: 90_000 }).toContain("schwarzschild");
  const seek = page.getByLabel("Observer proper time");
  await seek.fill("500");
  await expect.poll(async () => (await state(page))?.cursorIndex ?? 0).toBeGreaterThan(1);
  const mid = (await state(page));
  const tau = await page.evaluate(({r0,index}) => {const rows=window.QGA_CONFORMAL.freeFallFromRest({r0,M:1,samples:361}).rows; const i=Math.floor(index),w=index-i; return rows[i].tau+(rows[Math.min(i+1,rows.length-1)].tau-rows[i].tau)*w;}, {r0:mid.r0,index:mid.cursorIndex});
  expect(tau / mid.properTimeEnd).toBeCloseTo(.5, 6);
  await page.getByRole("button", { name: "Play fall" }).click();
  await expect.poll(async () => (await state(page))?.cursorIndex).toBe(mid.worldlinePoints - 1);
  await page.getByLabel("infall start radius in units of M").fill("5");
  await expect.poll(async () => (await state(page))?.r0).toBeCloseTo(5, 5);
  expect(errors).toEqual([]);
});

test("full-motion signal and observer playback can pause and resume", async ({ page, context }) => {
  const errors = await open(page, context, "no-preference");
  if (await page.getByRole("button", { name: "Skip intro" }).isVisible()) await page.getByRole("button", { name: "Skip intro" }).click();
  await page.getByRole("button", { name: "Watch the map" }).click();
  await expect.poll(async () => (await state(page))?.introRunning).toBe(true);
  await page.getByRole("button", { name: "Skip intro" }).click();
  expect((await state(page)).introRunning).toBe(false);
  await page.getByRole("button", { name: "Send light again" }).click();
  await expect.poll(async () => (await state(page))?.signalRunning).toBe(true);
  await expect.poll(async () => (await state(page))?.signalRunning, { timeout: 15000 }).toBe(false);
  await page.getByRole("button", { name: "Follow an observer" }).click();
  await expect.poll(async () => (await state(page))?.visiblePanels, { timeout: 90_000 }).toContain("schwarzschild");
  await page.getByRole("button", { name: "Play fall" }).click();
  await expect.poll(async () => (await state(page))?.cursorIndex ?? 0, {timeout:15000}).toBeGreaterThan(0);
  await page.locator(`${LAB} .pn-release`).click();
  expect((await state(page)).released).toBe(false);
  await page.getByRole("button", { name: "Play fall" }).click();
  await expect.poll(async () => (await state(page))?.cursorIndex, {timeout:25000}).toBe((await state(page)).worldlinePoints - 1);
  expect(errors).toEqual([]);
});

test("comparison and schematic status are explicit and selectable", async ({ page, context }) => {
  const errors = await open(page, context);
  await page.getByRole("button", { name: "Compare off" }).click();
  await expect.poll(async () => (await state(page))?.visiblePanels.length, { timeout: 90_000 }).toBe(2);
  expect((await state(page)).comparisonEvent.id).toBe("schwarzschild");
  await expect(page.locator(".pn-insight")).toContainText("independent example events");
  await choose(page, "Reissner", "reissner-nordstrom");
  await expect(page.locator(".pn-stage-meta")).toContainText("SCHEMATIC");
  await page.getByRole("button", { name: "Compare on" }).click();
  await expect.poll(async () => (await state(page))?.visiblePanels, { timeout: 90_000 }).toEqual(["reissner-nordstrom"]);
  await expect(page.locator(".pn-insight")).toContainText("schematic");
  await expect(page.getByRole("button", { name: "Send light again" })).toBeDisabled();
  expect(errors).toEqual([]);
});

test("region and formula controls work with keyboard focus", async ({ page, context }) => {
  const errors = await open(page, context);
  await choose(page, "Schwarzschild", "schwarzschild");
  await page.getByRole("button", { name: "Explore regions" }).click();
  const mapLabel = page.getByRole("button", { name: "Explore Region II: the black-hole interior" });
  await mapLabel.focus(); await page.keyboard.press("Enter");
  await expect.poll(async () => (await state(page))?.focused).toBe("II");
  const region = page.locator(".pn-region").filter({hasText:"black-hole interior"});
  await region.focus(); await page.keyboard.press("Enter");
  await expect(region).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".pn-insight")).toContainText("radial coordinate");
  await page.locator(".pn-math summary").click();
  const formula = page.locator('[data-qga-formula="Kruskal coordinates"]');
  for (const term of ["U", "V"]) {
    const target = formula.locator(`[data-term="${term}"]`); await expect(target).toHaveAttribute("role", "button"); await target.focus();
    await expect.poll(() => page.evaluate(() => window.__qgaTermLens), {timeout: 10000}).toMatchObject({sceneId:"gr-penrose",termId:term});
  }
  expect(errors).toEqual([]);
});

test.describe("mobile", () => {
  test.use({viewport: {width:390,height:844}});
  test("single map fits without horizontal page overflow and controls remain reachable", async ({page,context}) => {
    const errors = await open(page,context);
    const dimensions = await page.evaluate(() => ({page:document.documentElement.scrollWidth, window:innerWidth, stage:document.querySelector('.pn-stage-wrap').getBoundingClientRect().width}));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.window);
    expect(dimensions.stage).toBeGreaterThan(260);
    for (const el of await page.locator('.pn-view-btn, .pn-action, .pn-compare').all()) expect((await el.boundingBox()).height).toBeGreaterThanOrEqual(44);
    await choose(page, "Schwarzschild", "schwarzschild");
    await page.getByRole("button",{name:"Inside horizon"}).click();
    expect((await state(page)).event.region).toBe("II");
    expect(errors).toEqual([]);
  });
});
