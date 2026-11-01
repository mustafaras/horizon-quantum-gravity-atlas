// Themes and accessible figures (S34), in the page.
//
//   themes     ?theme= and the remembered choice select Observatory, Blueprint or Print; the tokens, the page background and
//              the colour scheme follow; the starfield is gone in Blueprint and Print
//   printing   beforeprint switches to Print and afterprint restores the reader's theme without storing either
//   scenes     a theme change restyles the 3D scenes without console errors and without rebuilding the renderer
//   sound      nothing plays before a gesture; the button and the P key start, pause and resume; the sound describes itself
//   live       a parameter change is announced once, after 500 ms, from the figure's own spec
//   text       a 3D scene's accessible name carries its registered model and status

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.use({ viewport: { width: 1280, height: 2600 } });
test.setTimeout(240_000);
const READINESS = ["fonts", "network-idle", "view-mounted"];
const THEMES = ["observatory", "blueprint", "print"];
const SURFACE_0 = { observatory: "rgb(5, 8, 15)", blueprint: "rgb(0, 43, 74)", print: "rgb(255, 255, 255)" };
const META_COLOR = { observatory: "#05080f", blueprint: "#002b4a", print: "#ffffff" };
const COUPLINGS = '.fig[data-figure="rg-unification-couplings"]';
const ANNOUNCE_DELAY_MS = 500;

async function open(page, context, url, { audioSpy = false } = {}) {
  await context.addInitScript((spy) => {
    window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2" };
    sessionStorage.setItem("horizon-intro", "1");
    if (spy) {
      window.__audioContexts = 0;
      const Native = window.AudioContext;
      window.AudioContext = class extends Native { constructor(...a) { super(...a); window.__audioContexts += 1; } };
    }
  }, audioSpy);
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await gotoReady(page, url, READINESS);
  return errors;
}

for (const theme of THEMES) {
  test(`?theme=${theme} sets the attribute, the tokens, the page background and the colour scheme`, async ({ page, context }) => {
    const errors = await open(page, context, `/?view=gr&theme=${theme}`);
    const state = await page.evaluate(() => ({
      attribute: document.documentElement.getAttribute("data-theme"),
      controller: window.QGA_THEME.get(),
      tokenTheme: window.QGA_TOKENS.current().theme,
      background: getComputedStyle(document.body).backgroundColor,
      scheme: getComputedStyle(document.documentElement).colorScheme,
      meta: document.querySelector('meta[name="theme-color"]').getAttribute("content"),
      starfield: (() => { const el = document.querySelector(".starfield-canvas"); return el ? getComputedStyle(el).display : "absent"; })(),
    }));
    expect(state.attribute).toBe(theme);
    expect(state.controller).toBe(theme);
    expect(state.tokenTheme).toBe(theme);
    expect(state.background).toBe(SURFACE_0[theme]);
    expect(state.scheme).toBe(theme === "print" ? "light" : "dark");
    expect(state.meta).toBe(META_COLOR[theme]);
    if (theme !== "observatory") expect(["none", "absent"]).toContain(state.starfield);
    expect(errors).toEqual([]);
  });
}

test("the choice is remembered across a reload, an unknown ?theme= is ignored and the URL wins over storage", async ({ page, context }) => {
  await open(page, context, "/?view=gr");
  await page.evaluate(() => window.QGA_THEME.set("blueprint"));
  expect(await page.evaluate(() => localStorage.getItem("qga-theme"))).toBe("blueprint");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("blueprint");
  await page.goto("/?view=gr&theme=sepia", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => window.QGA_THEME && window.QGA_THEME.get())).toBe("blueprint");
  await page.goto("/?view=gr&theme=print", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => window.QGA_THEME && window.QGA_THEME.get())).toBe("print");
});

test("printing uses Print and puts the reader's theme back, without storing either", async ({ page, context }) => {
  await open(page, context, "/?view=gr&theme=blueprint");
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("print");
  expect(await page.evaluate(() => localStorage.getItem("qga-theme"))).not.toBe("print");
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("blueprint");
});

test("a theme change repaints canvas figures and keeps the page alive, with no console errors", async ({ page, context }) => {
  const errors = await open(page, context, "/?view=rg&seed=42");
  await page.locator(".ug-lab").scrollIntoViewIfNeeded();
  await expect(page.locator(COUPLINGS)).toBeVisible();
  // The canvas is transparent where nothing is drawn, so one pixel proves nothing: sum the colour of every drawn pixel.
  const paint = () => page.evaluate(() => {
    const canvas = document.querySelector('.fig[data-figure="rg-unification-couplings"] canvas');
    const d = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let drawn = 0, sum = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0) { drawn += 1; sum += d[i] + d[i + 1] + d[i + 2]; }
    return drawn > 0 ? `${drawn}:${Math.round(sum / drawn)}` : "empty";
  });
  for (const theme of ["blueprint", "print", "observatory"]) {
    await page.evaluate((id) => window.QGA_THEME.set(id), theme);
    await expect.poll(() => page.evaluate(() => window.QGA_TOKENS.current().theme)).toBe(theme);
  }
  const dark = await paint();
  expect(dark, "the figure drew something in Observatory").not.toBe("empty");
  await page.evaluate(() => window.QGA_THEME.set("print"));
  await expect.poll(paint).not.toBe(dark);
  expect(errors).toEqual([]);
});

test("a 3D scene is restyled by a theme change in place: same canvas, no errors", async ({ page, context }) => {
  const errors = await open(page, context, "/?view=bh");
  const stage = page.locator(".s3d-stage").first();
  await expect(stage).toBeVisible();
  await expect(stage).toHaveAttribute("aria-busy", "false", { timeout: 120_000 });
  const mark = () => page.evaluate(() => { const c = document.querySelector(".s3d-stage canvas"); c.dataset.probe ||= String(Math.random()); return c.dataset.probe; });
  const before = await mark();
  for (const theme of ["blueprint", "print", "observatory"]) {
    await page.evaluate((id) => window.QGA_THEME.set(id), theme);
    await page.waitForTimeout(400);
  }
  expect(await mark(), "the canvas element was kept").toBe(before);
  await expect(stage).toHaveAttribute("aria-busy", "false");
  expect(errors).toEqual([]);
});

test("a figure plays only after a gesture: the button and the P key start, pause and resume it", async ({ page, context }) => {
  await open(page, context, "/?view=rg&seed=42", { audioSpy: true });
  await page.locator(".ug-lab").scrollIntoViewIfNeeded();
  const button = page.locator(`${COUPLINGS} .fig-sound`);
  await expect(button).toBeVisible();
  expect(await page.evaluate(() => window.__audioContexts), "no audio before a gesture").toBe(0);
  await expect(button).toHaveText("Play sound");
  expect(await button.getAttribute("aria-pressed")).toBe("false");
  const box = await button.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);

  await button.click();
  await expect(button).toHaveText("Pause sound");
  expect(await button.getAttribute("aria-pressed")).toBe("true");
  expect(await page.evaluate(() => window.__audioContexts)).toBe(1);

  await page.locator(`${COUPLINGS} .fig-plot`).focus();
  await page.keyboard.press("p");
  await expect(button).toHaveText("Resume sound");
  await page.keyboard.press("p");
  await expect(button).toHaveText("Pause sound");
  expect(await page.evaluate(() => window.__audioContexts), "pause and resume reuse the context").toBe(1);

  const description = await page.evaluate(() => document.getElementById(document.querySelector('.fig[data-figure="rg-unification-couplings"] .fig-sound').getAttribute("aria-describedby")).textContent);
  expect(description).toMatch(/reference tone of \d+ Hz marks/);
  expect(description).toMatch(/Press P with the plot focused/);
});

test("a parameter change is announced once, 500 ms after the last change", async ({ page, context }) => {
  await open(page, context, "/?view=rg&seed=42");
  await page.locator(".ug-lab").scrollIntoViewIfNeeded();
  const live = page.locator(`${COUPLINGS} [data-figure-live]`);
  await expect(live).toHaveText("");
  await page.locator(`${COUPLINGS} .fig-plot`).focus();
  // The timing is read on the page's own clock. A loaded CI page can stall its main thread for longer than the delay, and
  // then a Node-side wait says nothing about when the timer was set; performance.now() inside the page does. Four presses
  // go in one task so a stall cannot split them either.
  const result = await page.evaluate(({ selector }) => new Promise((resolve) => {
    const region = document.querySelector(`${selector} [data-figure-live]`);
    const plot = document.querySelector(`${selector} .fig-plot`);
    const changes = [];
    const observer = new MutationObserver(() => { if (region.textContent) changes.push({ at: performance.now(), text: region.textContent }); });
    observer.observe(region, { childList: true, characterData: true, subtree: true });
    const pressedAt = performance.now();
    for (let i = 0; i < 4; i++) plot.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    // Let it settle well past the delay, then report every announcement seen.
    setTimeout(() => { observer.disconnect(); resolve({ pressedAt, changes }); }, 4_000);
  }), { selector: COUPLINGS });
  expect(result.changes.length, "four presses are one announcement").toBe(1);
  expect(result.changes[0].text).toMatch(/^Updated: /);
  expect(result.changes[0].at - result.pressedAt, "spoken no earlier than the debounce delay after the last change").toBeGreaterThanOrEqual(ANNOUNCE_DELAY_MS - 5);
  await expect(live).toHaveText(/^Updated: /);
});

test("a visible button steps through the themes: in the sidebar on a desktop and in the top bar on a phone", async ({ page, context }) => {
  await open(page, context, "/?view=gr");
  const side = page.locator(".sidebar [data-theme-button]");
  await expect(side).toBeVisible();
  expect((await side.boundingBox()).height).toBeGreaterThanOrEqual(44);
  const order = ["observatory", "blueprint", "print", "observatory"];
  const names = { observatory: "Observatory", blueprint: "Blueprint", print: "Print" };
  for (let i = 0; i < order.length - 1; i++) {
    await expect(side).toHaveAccessibleName(`Colour theme: ${names[order[i]]}. Switch to ${names[order[i + 1]]}`);
    await side.click();
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe(order[i + 1]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const top = page.locator(".topbar [data-theme-button]");
  await expect(top).toBeVisible();
  expect((await top.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await top.click();
  await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("blueprint");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("a 3D scene's accessible name carries its registered model and status", async ({ page, context }) => {
  await open(page, context, "/?view=bh");
  const stage = page.locator(".s3d-stage").first();
  await expect(stage).toBeVisible();
  await expect.poll(() => stage.getAttribute("aria-label"), { timeout: 10_000 }).toMatch(/Model: .+\. Status: (established|effective|schematic|conjectural|open|heuristic)\. Layers: \d+ data, \d+ model, \d+ decoration\./);
});
