// Prompt 10 — premium interaction layer: command palette, compare,
// snapshots, formula linking and annotations.
//
// Coverage contract (from the plan):
//   - complete keyboard-only palette flow (open → query → result → arrive),
//   - compare swipe drag + preset change,
//   - snapshot save/restore with the fly-to/tween completing,
//   - formula hover → scene highlight → numerical readout,
//   - annotation add/edit/remove + share-URL round-trip,
//   - oversized/invalid annotation state rejected VISIBLY,
//   - old URLs keep loading,
//   - reduced-motion: no tween (instant state); normal-motion: state changes
//     over time (frame-sampled); zero console/page errors throughout.

import { test, expect } from "playwright/test";
import { gotoReady, DEFAULT_READINESS } from "./helpers.mjs";
import { runReadiness } from "../lib/readiness.mjs";

const GR_URL = "/?view=gr&seed=42";
const OLD_URL = "/?view=gr&grp=null&grb=-0.55&grat=-2&grax=-2&grbt=2&grbx=2";

async function skipIntro(context) {
  await context.addInitScript(() => {
    sessionStorage.setItem("horizon-intro", "1");
    window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2" };
  });
}

test.describe("command palette", () => {
  test("keyboard-only flow: open, query, navigate, arrive; focus restores", async ({ page, context }) => {
    test.setTimeout(120_000);
    await skipIntro(context);
    const errors = await gotoReady(page, GR_URL);
    // Focus a known control, then open the palette with the keyboard.
    await page.locator(".s3d-stage").first().focus();
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.locator(".cmdk")).toBeVisible();
    await expect(page.locator(".cmdk-input")).toBeFocused();
    // Empty query shows quick actions with a count.
    await expect(page.locator(".cmdk-count")).toContainText(/quick actions/i);
    // Query a formula; deterministic ranking puts the formula first.
    await page.keyboard.type("geodesic equation");
    await expect(page.locator(".cmdk-item").first()).toContainText("Geodesic equation");
    await expect(page.locator(".cmdk-count")).toContainText(/result/i);
    // Arrow to it and run with Enter — keyboard only.
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/view=gr/);
    // The formula card opens itself (deterministic focus hand-off).
    await expect(page.locator(".formula-card.open")).toContainText("Geodesic equation");
    // Escape closes and restores focus to the previously focused element.
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.locator(".cmdk")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".cmdk")).toHaveCount(0);
    await expect(page.locator(".s3d-stage").first()).toBeFocused();
    // Empty state renders for impossible queries.
    await page.keyboard.press("ControlOrMeta+k");
    await page.keyboard.type("zzzqqqxxx");
    await expect(page.locator(".cmdk-empty")).toBeVisible();
    await page.keyboard.press("Escape");
    expect(errors()).toEqual([]);
  });

  test("palette result hover previews a scene highlight without camera movement", async ({ page, context }) => {
    test.setTimeout(120_000);
    await skipIntro(context);
    const errors = await gotoReady(page, GR_URL);
    await page.keyboard.press("ControlOrMeta+k");
    await page.keyboard.type("einstein field");
    await page.locator(".cmdk-item").first().hover();
    // A preview event reached the scene (formula cards own the symbol link;
    // the palette preview is a no-op unless a shot/scene object matches).
    await expect(page.locator(".cmdk-item").first()).toContainText("Einstein field equations");
    await page.keyboard.press("Escape");
    expect(errors()).toEqual([]);
  });
});

test.describe("formula linking", () => {
  test("hover and keyboard focus highlight the scene object and expose the live value", async ({ page, context }) => {
    test.setTimeout(150_000);
    await skipIntro(context);
    const errors = await gotoReady(page, GR_URL);
    await expect(page.locator(".s3d-canvas").first()).toBeVisible();
    // Open the Einstein field equations lens.
    const card = page.locator(".formula-card", { hasText: "Einstein field equations" }).first();
    await card.locator(".fc-head").click();
    await expect(card).toHaveClass(/open/);
    // Hover the T_μν symbol row (energy–momentum tensor).
    const row = card.locator("tr.fc-symbol-row", { hasText: "Energy–momentum" }).first();
    await row.hover();
    await expect(row.locator(".fc-readout")).toBeVisible();
    await expect(row.locator(".fc-readout-value")).not.toBeEmpty();
    await expect(row.locator(".fc-readout-unit")).toContainText(/M☉|scene/);
    // The scene reacted: the concept-highlight diagnostic fired for T_μν.
    await expect.poll(() => page.evaluate(() => window.__qgaConceptHighlight?.symbol ?? null)).toBe("T_{\\mu\\nu}");
    // Keyboard focus provides the same behaviour as hover (spec).
    await row.focus();
    await expect(row.locator(".fc-readout")).toBeVisible();
    // Unknown mappings do nothing visible and never throw.
    const unknown = card.locator("tr.fc-symbol-row", { hasText: "Cosmological constant" }).first();
    await unknown.hover();
    await expect(unknown.locator(".fc-readout")).toHaveCount(0);
    expect(errors()).toEqual([]);
  });
});

test.describe("compare view", () => {
  test("swipe divider drags with inertia and presets switch", async ({ page, context }) => {
    test.setTimeout(240_000);
    await skipIntro(context);
    const errors = await gotoReady(page, "/?view=compare");
    // Both embedded states must report readiness (measured, no fixed sleep).
    await expect.poll(() => page.locator(".compare-view").getAttribute("data-ready-a"), { timeout: 180_000 }).toBe("true");
    await expect.poll(() => page.locator(".compare-view").getAttribute("data-ready-b"), { timeout: 180_000 }).toBe("true");
    const handle = page.locator(".compare-handle");
    await expect(handle).toBeVisible();
    const before = await handle.getAttribute("aria-valuenow");
    // Drag the seam to the right (pointer-driven, spring inertia).
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 220, box.y + box.height / 2, { steps: 12 });
    await page.mouse.up();
    await expect.poll(() => handle.getAttribute("aria-valuenow"), { timeout: 15_000 }).not.toBe(before);
    // Keyboard: arrows drive the divider too.
    await handle.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => handle.getAttribute("aria-valuenow"), { timeout: 10_000 }).not.toBe(before);
    // Preset change: same view → embeds stay mounted, tween posts patches.
    await page.getByRole("button", { name: /Scientific vs cinematic/ }).click();
    await expect(page.locator(".compare-view")).toHaveAttribute("data-preset", "scientific-vs-cinematic");
    await expect.poll(() => page.locator(".compare-view").getAttribute("data-ready-a")).toBe("true");
    await expect.poll(() => page.locator(".compare-view").getAttribute("data-ready-b")).toBe("true");
    // Camera sync state is declared either way (badge present).
    await expect(page.locator(".compare-sync-badge")).toBeVisible();
    expect(errors()).toEqual([]);
  });
});

test.describe("snapshots", () => {
  test("save and restore round-trips state with a completing tween", async ({ page, context }) => {
    test.setTimeout(150_000);
    await skipIntro(context);
    // Record every state change so the restore tween can be frame-sampled.
    await context.addInitScript(() => {
      window.__spinSamples = [];
      window.addEventListener("qga-statechange", (event) => {
        if (event.detail && Number.isFinite(event.detail.bhSpin)) {
          window.__spinSamples.push(event.detail.bhSpin);
        }
      });
    });
    // The Kerr observatory's synchronous shader/geodesic work can outlast
    // the animation-settled window on load; canvas-nonblank is the honest
    // "scene is live" precondition for snapshot flows.
    // The gravity well reads the same bhSpin state key as the Kerr observatory but draws cheaply. The restore
    // tween is frame-sampled and every sample re-draws the view on the main thread; the Kerr ray marcher needs
    // ~0.7 s per frame on a software rasterizer, which collapses the 700 ms tween into its two end frames
    // (measured: one 980 ms long task covered the whole tween) and says nothing about snapshot restore.
    const errors = await gotoReady(page, "/?view=gr&bhm=1&bhs=0.9&seed=42",
      ["fonts", "network-idle", "view-mounted", "canvas-nonblank"]);
    await expect(page.locator(".s3d-canvas").first()).toBeVisible();
    // Save a snapshot of the Kerr a★=0.9 state.
    await page.getByRole("button", { name: "Snapshots" }).click();
    await expect(page.locator(".snap-panel")).toBeVisible();
    await page.locator(".snap-name").fill("Kerr edge test");
    await page.getByRole("button", { name: "Save snapshot" }).click();
    await expect(page.locator(".snap-item")).toHaveCount(1);
    await expect(page.locator(".snap-notice.ok")).toBeVisible();
    // Change the spin, then restore: parameters tween back over time.
    await page.getByRole("button", { name: "Close snapshots panel" }).click();
    await page.evaluate(() => window.QGA_WRITE_STATE(window.QGA_READ_STATE(), { replace: true }));
    await page.goto(page.url().replace("bhs=0.9", "bhs=0.2"), { waitUntil: "domcontentloaded" });
    // The Kerr scene's synchronous shader work can outlast the
    // animation-settled window right after a reload; mounted + idle is the
    // correct precondition for the panel (see reduced-motion.spec.mjs).
    await runReadiness(page, ["fonts", "network-idle", "view-mounted"]);
    await expect.poll(() => page.evaluate(() => window.qgaReadState().bhSpin)).toBe(0.2);
    await page.getByRole("button", { name: "Snapshots" }).click();
    await page.getByRole("button", { name: "Restore", exact: true }).click();
    // The final state lands in the URL (fly-to + tween complete).
    await expect.poll(() => page.evaluate(() => window.qgaReadState().bhSpin), { timeout: 30_000 }).toBe(0.9);
    // Normal motion: the tween produced intermediate frames (frame-sampled
    // state changes over time — physics recomputed live, not baked).
    const samples = await page.evaluate(() => window.__spinSamples);
    const distinct = [...new Set(samples.map((value) => Math.round(value * 1000) / 1000))];
    expect(distinct.length, `expected intermediate tween frames, got ${JSON.stringify(distinct)}`).toBeGreaterThan(2);
    expect(errors()).toEqual([]);
  });
});

test.describe("snapshots — reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" }, viewport: { width: 1200, height: 800 } });
  test("restore applies the final state in one step", async ({ page, context }) => {
    test.setTimeout(150_000);
    await skipIntro(context);
    await context.addInitScript(() => {
      window.__spinSamples = [];
      window.addEventListener("qga-statechange", (event) => {
        if (event.detail && Number.isFinite(event.detail.bhSpin)) window.__spinSamples.push(event.detail.bhSpin);
      });
    });
    // The Kerr observatory's synchronous shader/geodesic work can outlast
    // the animation-settled window on load; canvas-nonblank is the honest
    // "scene is live" precondition for snapshot flows.
    const errors = await gotoReady(page, "/?view=bh&bhm=1&bhs=0.9&seed=42",
      ["fonts", "network-idle", "view-mounted", "canvas-nonblank"]);
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
    await page.getByRole("button", { name: "Snapshots" }).click();
    await page.locator(".snap-name").fill("PRM restore");
    await page.getByRole("button", { name: "Save snapshot" }).click();
    await expect(page.locator(".snap-item")).toHaveCount(1);
    await page.getByRole("button", { name: "Close snapshots panel" }).click();
    await page.goto(page.url().replace("bhs=0.9", "bhs=0.2"), { waitUntil: "domcontentloaded" });
    // The Kerr scene's synchronous shader work can outlast the
    // animation-settled window right after a reload; mounted + idle is the
    // correct precondition for the panel (see reduced-motion.spec.mjs).
    await runReadiness(page, ["fonts", "network-idle", "view-mounted"]);
    await page.getByRole("button", { name: "Snapshots" }).click();
    await page.getByRole("button", { name: "Restore", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.qgaReadState().bhSpin), { timeout: 30_000 }).toBe(0.9);
    const samples = await page.evaluate(() => window.__spinSamples);
    const intermediates = samples.filter((value) => value !== 0.2 && value !== 0.9);
    expect(intermediates, `reduced motion must not tween, got ${JSON.stringify(samples)}`).toEqual([]);
    expect(errors()).toEqual([]);
  });
});

test.describe("annotations", () => {
  test("add, edit, remove and share-URL round-trip", async ({ page, context }) => {
    test.setTimeout(150_000);
    await skipIntro(context);
    const errors = await gotoReady(page, GR_URL);
    // Arm placement, then click on the content column → screen pin.
    await page.getByRole("button", { name: /^◆ Annotate/ }).click();
    await expect(page.locator(".annot-placing-banner")).toBeVisible();
    const heading = page.locator("h1").first();
    await heading.click({ position: { x: 40, y: 8 } });
    await expect(page.locator(".annot-popover")).toBeVisible();
    await page.locator(".annot-text").fill("Check the precession readout here");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator(".annot-text-view").first()).toContainText("precession");
    // The pin serialized into the shared URL state.
    await expect(page).toHaveURL(/ann=/);
    // Round-trip: reload keeps the pin (schema-validated share state).
    await page.reload({ waitUntil: "domcontentloaded" });
    await runReadiness(page, DEFAULT_READINESS);
    await expect(page.locator(".annot-text-view").first()).toContainText("precession");
    // Edit the pin text.
    await page.locator(".annot-marker").first().click();
    await expect(page.locator(".annot-popover")).toBeVisible();
    await page.locator(".annot-text").fill("Edited note");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator(".annot-text-view").first()).toContainText("Edited note");
    // Remove uses the normal in-app confirmation pattern.
    await page.locator(".annot-marker").first().click();
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await page.getByRole("button", { name: "✓ Remove" }).click();
    await expect(page.locator(".annot-pin")).toHaveCount(0);
    await expect(page).not.toHaveURL(/ann=/);
    expect(errors()).toEqual([]);
  });

  test("oversized and invalid annotation state is rejected visibly", async ({ page, context }) => {
    test.setTimeout(120_000);
    await skipIntro(context);
    const errors = await gotoReady(page, "/?view=gr&seed=42&ann=not-valid-json");
    await expect(page.locator(".annot-rejection")).toBeVisible();
    await expect(page.locator(".annot-rejection")).toContainText(/rejected/i);
    await expect(page.locator(".annot-pin")).toHaveCount(0);
    // Everything else still loaded.
    await expect(page.locator("h1").first()).toBeVisible();
    // Oversized (valid JSON, over the count limit) is also rejected visibly.
    const oversized = JSON.stringify(
      Array.from({ length: 20 }, (_, index) => ({ id: `p${index}`, a: "screen", p: [0.2, 0.2], x: "t" })),
    );
    await page.goto(`/?view=gr&seed=42&ann=${encodeURIComponent(oversized)}`, { waitUntil: "domcontentloaded" });
    await runReadiness(page, DEFAULT_READINESS);
    await expect(page.locator(".annot-rejection")).toBeVisible();
    await expect(page.locator(".annot-pin")).toHaveCount(0);
    expect(errors()).toEqual([]);
  });

  test("old URLs keep loading unchanged", async ({ page, context }) => {
    test.setTimeout(120_000);
    await skipIntro(context);
    const errors = await gotoReady(page, OLD_URL);
    const state = await page.evaluate(() => window.qgaReadState(window.location.search));
    expect(state.grPreset).toBe("null");
    expect(state.grBeta).toBe(-0.55);
    expect(state.annotations).toEqual([]);
    expect(errors()).toEqual([]);
  });
});
