// S36 release gate (v1 Prompt 13): the lifecycle and accessibility checks that need a page.
//
// Navigation clicks the sidebar's module buttons, as a reader does, so scenes are unmounted and mounted in one page
// rather than reset by a reload. That is what makes a leak visible: if a view leaves a renderer or a scene behind, the
// counts on the second lap exceed those on the first. (The URL is not a usable signal: the app drops ?view=overview,
// the default, from it.)
// Dialog focus restoration is covered by premium-interactions.spec.mjs (the command palette) and reduced motion by
// reduced-motion.spec.mjs; they are not repeated here.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

// The sidebar button of each module, in sidebar order (js/app.jsx).
const MODULES = Object.freeze({
  overview: "Atlas overview", sm: "Standard Model", qft: "Quantum Fields", rg: "Gauge & RG Flow", gr: "General Relativity",
  planck: "The Planck Frontier", approaches: "Theory Comparator", bh: "Black Holes", exp: "Experiment",
});
const LAPS = 2;
const WEBGL_CONTEXT_BUDGET = 4;

async function navigate(page, view) {
  const button = page.locator("nav button.nav-item").filter({ hasText: MODULES[view] }).first();
  await button.click();
  await expect(button).toHaveClass(/\bactive\b/, { timeout: 30_000 });
  await page.waitForFunction(() => document.querySelector("#root section, #root header"));
}

/** The live renderer and scene counts once they stop changing (three equal reads, 250 ms apart). */
async function settledCounts(page) {
  const read = () => page.evaluate(() => ({
    renderers: globalThis.QGA_RENDER?.renderDiagnostics?.liveRenderers?.() ?? 0,
    scenes: globalThis.__qgaActiveScenes?.size ?? 0,
  }));
  let last = await read(), same = 0;
  for (let i = 0; i < 60 && same < 2; i++) {
    await page.waitForTimeout(250);
    const now = await read();
    same = now.renderers === last.renderers && now.scenes === last.scenes ? same + 1 : 0;
    last = now;
  }
  return last;
}

test.describe("release gate", () => {
  test("two laps through every module leave no renderer or scene behind, and raise no errors", async ({ page }) => {
    test.setTimeout(10 * 60 * 1000);
    const errors = await gotoReady(page, "/?view=overview");
    const laps = [];
    for (let lap = 0; lap < LAPS; lap++) {
      const counts = {};
      for (const view of Object.keys(MODULES)) {
        await navigate(page, view);
        counts[view] = await settledCounts(page);
        expect(counts[view].renderers, `${view}: live renderers within the WebGL2 context budget`).toBeLessThanOrEqual(WEBGL_CONTEXT_BUDGET);
      }
      laps.push(counts);
    }
    for (const view of Object.keys(MODULES)) {
      expect(laps[1][view].renderers, `${view}: renderers on lap 2 vs lap 1 ${JSON.stringify(laps)}`).toBeLessThanOrEqual(laps[0][view].renderers);
      expect(laps[1][view].scenes, `${view}: scenes on lap 2 vs lap 1`).toBeLessThanOrEqual(laps[0][view].scenes);
    }
    expect(errors(), "console/page errors over two laps").toEqual([]);
  });

  test("keyboard focus moves through the overview without being trapped", async ({ page }) => {
    await gotoReady(page, "/?view=overview");
    const seen = new Set();
    let repeats = 0, previous = null;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const key = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return "body";
        return `${el.tagName}#${el.id}.${el.className}|${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 40)}`;
      });
      repeats = key === previous ? repeats + 1 : 0;
      expect(repeats, `focus stuck on ${key}`).toBeLessThan(3);
      previous = key;
      seen.add(key);
    }
    expect(seen.size, `distinct focus stops over 40 Tabs: ${[...seen].slice(0, 8).join(" ; ")}`).toBeGreaterThanOrEqual(15);
  });
});
