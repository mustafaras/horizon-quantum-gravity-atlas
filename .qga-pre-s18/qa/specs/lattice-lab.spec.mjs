// The lattice laboratory of the QFT view (S14): a classical phi^4 field on a GPU lattice, in the page, on the node renderer's WebGL2 backend.
//
//   motion     the lattice advances while playing; Pause stops it; Step advances exactly one frame (4 to 8 steps, the governor's cut of 0.4)
//   kink       the kink walls are static in the running scene: the field after more steps equals the field before, and the energy readout does not move
//   click      a click kicks the field with the seeded Gaussian: the same seed and click give the same field on two loads, and the field changes
//   rest       under reduced motion the lab rests until Play (no steps), and Play runs it
//   lens       a term of the Hamiltonian card, pinned by keyboard, paints over the lattice through the Formula Lens and Escape clears it
//   typeset    the readouts, the caption, the card and the notes are KaTeX; controls are at least 44 px
//   fallback   without 3D the one-dimensional lab runs the same physics on the CPU
//
// The lattice is 128 x 128 here (a CPU rasterizer is clamped to the low detail tier); the GPU/CPU equality is qa/specs/lattice-gpu.spec.mjs.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ viewport: { width: 1280, height: 2400 } });
test.setTimeout(300_000);
const READINESS = ["fonts", "network-idle", "view-mounted"];
const LAB = ".lt-lab";
const PLAY = `${LAB} .lt-bar button[aria-pressed]:has-text("Pause"), ${LAB} .lt-bar button[aria-pressed]:has-text("Play")`;
const STAGE = `${LAB} .s3d-stage`;

async function open(page, context, { reducedMotion = false, backend = "webgl2" } = {}) {
  await context.addInitScript((forced) => {
    window.QGA_RENDER_OPTIONS = { forceBackend: forced };
    sessionStorage.setItem("horizon-intro", "1");
  }, backend);
  await page.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await gotoReady(page, "/?view=qft&seed=42", READINESS);
  await page.locator(LAB).scrollIntoViewIfNeeded();
  if (backend !== "static") await page.waitForFunction(() => window.__qgaLattice?.backend, null, { timeout: 200_000 });
  return errors;
}

const steps = (page) => page.evaluate(() => window.__qgaLattice?.steps ?? -1);
const stats = (page) => page.evaluate(() => window.__qgaLattice?.stats ?? null);
const field = (page, names = ["phi"]) => page.evaluate(async (wanted) => {
  const state = await window.__qgaLattice.readback(wanted);
  return Object.fromEntries(Object.entries(state).map(([name, values]) => [name, Array.from(values)]));
}, names);
const maxDiff = (a, b) => a.reduce((m, v, i) => Math.max(m, Math.abs(v - b[i])), 0);
const button = (page, name) => page.locator(`${LAB} .lt-bar button`).filter({ hasText: name }).first();
/** A CPU rasterizer (this suite, and CI) starts the lattice at rest, as reduced motion does; this runs it. */
async function play(page) {
  const toggle = page.locator(PLAY).first();
  if ((await toggle.getAttribute("aria-pressed")) !== "true") await button(page, "Play").click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
}

test("the lattice advances while playing, Pause stops it and Step advances exactly one frame", async ({ page, context }) => {
  const errors = await open(page, context);
  // on a CPU rasterizer the lattice rests until Play (it needs seconds per frame), and says so
  if ((await stats(page)).software) {
    await expect(page.locator(PLAY).first()).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(`${LAB} .lt-readouts .lt-note`)).toContainText("software");
    await page.waitForTimeout(1500);
    expect(await steps(page), "nothing runs until Play").toBe(0);
  }
  await play(page);
  const first = await steps(page);
  await expect.poll(() => steps(page), { timeout: 90_000 }).toBeGreaterThan(first + 16);
  await expect(page.locator(`${LAB} .lt-readouts .readout`).first().locator(".readout-value")).not.toHaveText("0.0");

  await button(page, "Pause").click();
  await expect(page.locator(PLAY).first()).toHaveAttribute("aria-pressed", "false");
  const paused = await steps(page);
  await page.waitForTimeout(1500);
  expect(await steps(page)).toBe(paused);

  await button(page, "Step").click();
  await expect.poll(() => steps(page), { timeout: 60_000 }).toBeGreaterThan(paused);
  await page.waitForTimeout(1000);
  const advanced = (await steps(page)) - paused;
  expect(advanced, "one frame is 4 to 8 steps of the fixed simulated time of 0.4").toBeGreaterThanOrEqual(4);
  expect(advanced).toBeLessThanOrEqual(8);
  expect(errors).toEqual([]);
});

test("the kink walls are static in the running scene: the field and the energy do not move", async ({ page, context }) => {
  const errors = await open(page, context);
  await button(page, "Kink walls").click();
  await expect(button(page, "Kink walls")).toHaveAttribute("aria-pressed", "true");
  await play(page);
  await page.waitForFunction(() => window.__qgaLattice?.steps >= 8 && window.__qgaLattice?.n === 128, null, { timeout: 120_000 });
  await button(page, "Pause").click();
  const before = (await field(page)).phi;
  const at = await steps(page);
  await button(page, "Play").click();
  await expect.poll(() => steps(page), { timeout: 90_000 }).toBeGreaterThan(at + 40);
  await button(page, "Pause").click();
  const after = (await field(page)).phi;
  expect(maxDiff(before, after), "float32 field after more than 40 further steps").toBeLessThan(1e-5);
  await expect.poll(async () => (await stats(page)).drift, { timeout: 30_000 }).toBeLessThan(1e-6);
  expect(Math.max(...before)).toBeGreaterThan(0.99);
  expect(Math.min(...before)).toBeLessThan(-0.99);
  expect(errors).toEqual([]);
});

test("a click kicks the field with the seeded Gaussian: the same seed and click give the same field on two loads", async ({ browser }) => {
  const fields = [];
  for (let load = 0; load < 2; load++) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 2400 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = await open(page, context, { reducedMotion: true });
    const before = (await field(page, ["phi", "pi"]));
    const box = await page.locator(STAGE).boundingBox();
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.55);
    await expect.poll(() => steps(page), { timeout: 90_000 }).toBeGreaterThan(0);
    await expect(page.locator(PLAY).first()).toHaveAttribute("aria-pressed", "false"); // the click advanced one frame and the lab still rests
    await page.waitForTimeout(500);
    const after = await field(page, ["phi", "pi"]);
    expect(maxDiff(before.pi, after.pi), "the kick changed the momentum").toBeGreaterThan(0.05);
    fields.push({ phi: after.phi, pi: after.pi, steps: await steps(page) });
    expect(errors).toEqual([]);
    await context.close();
  }
  expect(fields[1].steps).toBe(fields[0].steps);
  expect(fields[1].phi).toEqual(fields[0].phi);
  expect(fields[1].pi).toEqual(fields[0].pi);
});

test("under reduced motion the lab rests until Play", async ({ page, context }) => {
  const errors = await open(page, context, { reducedMotion: true });
  await expect(page.locator(PLAY).first()).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(PLAY).first()).toHaveText("Play");
  await page.waitForTimeout(1500);
  expect(await steps(page)).toBe(0);
  await button(page, "Play").click();
  await expect.poll(() => steps(page), { timeout: 90_000 }).toBeGreaterThan(8);
  expect(errors).toEqual([]);
});

test("a term of the Hamiltonian card, pinned by keyboard, paints over the lattice and Escape clears it", async ({ page, context }) => {
  const errors = await open(page, context);
  const card = page.locator('[data-qga-formula="Hamiltonian density of the lattice field"]');
  const terms = await card.locator("[data-term]").evaluateAll((nodes) => nodes.map((node) => node.dataset.term));
  expect(terms).toEqual(expect.arrayContaining(["kinetic", "gradient", "mass", "interaction"]));
  for (const termId of ["kinetic", "gradient", "mass", "interaction"]) {
    const term = card.locator(`[data-term="${termId}"]`);
    await term.focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => window.__qgaTermLens ?? null)).toMatchObject({ sceneId: "qft-lattice", formulaId: "qft-phi4-hamiltonian", termId, kind: "field" });
    await page.locator(LAB).scrollIntoViewIfNeeded();
    await expect(page.locator(`${LAB} .term-lens-legend:visible`)).toContainText(termId);
    await page.keyboard.press("Escape");
    await expect.poll(() => page.evaluate(() => window.__qgaTermLens ?? null)).toBeNull();
  }
  expect(errors).toEqual([]);
});

test("the readouts, the caption, the card and the notes are typeset, and the controls are at least 44 px", async ({ page, context }) => {
  const errors = await open(page, context);
  await play(page);
  await expect(page.locator(`${LAB} .lt-readouts .katex`).first()).toBeVisible();
  expect(await page.locator(`${LAB} .lt-readouts .katex`).count()).toBeGreaterThanOrEqual(4);
  await expect(page.locator(`${LAB} .viz-caption .katex`).first()).toBeVisible();
  await expect(page.locator(`${LAB} .fc-eq .katex`).first()).toBeVisible();
  const heights = await page.locator(`${LAB} .lt-bar button`).evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
  // a negative m^2 with no quartic term would be unbounded below: the simulation holds lambda at the floor and says so, typeset
  await page.locator(`${LAB} input[aria-label="mass squared"]`).fill("-0.5");
  await page.locator(`${LAB} input[aria-label="quartic coupling"]`).fill("0");
  await expect(page.locator(`${LAB} .lt-note .katex`).first()).toBeVisible();
  await expect(page.locator(`${LAB} .lt-note`)).toContainText("0.25");
  expect(errors).toEqual([]);
});

test("without 3D the one-dimensional lab runs the same physics on the CPU and answers a click", async ({ page, context }) => {
  const errors = await open(page, context, { backend: "static" });
  const canvas = page.locator(`${LAB} canvas.viz-canvas`);
  await expect(canvas).toBeVisible();
  const hash = () => canvas.evaluate((node) => {
    const data = node.getContext("2d").getImageData(0, 0, node.width, node.height).data;
    let h = 2166136261;
    for (let i = 0; i < data.length; i += 4) { h ^= data[i] + data[i + 1] * 3 + data[i + 2] * 7 + data[i + 3] * 13; h = Math.imul(h, 16777619) >>> 0; }
    return h;
  });
  const flat = await hash();
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.5);
  await expect.poll(hash, { timeout: 20_000 }).not.toBe(flat);
  const kicked = await hash();
  await expect.poll(hash, { timeout: 20_000 }).not.toBe(kicked); // the field keeps evolving
  await expect(page.locator(`${LAB} .viz-caption .katex`).first()).toBeVisible();
  expect(errors).toEqual([]);
});
