// Kerr observatory visual and numerical acceptance (Prompt 04).
//
// Deterministic reference captures at a* = 0, a* = +0.9 (prograde disk) and
// a* = -0.9 (retrograde disk) with a fixed seed and viewport; readouts checked
// against the Prompt 03 science APIs; NaN/Infinity audit of UI and export; the
// approaching/receding beaming asymmetry; forced WebGL2, native WebGPU when
// the machine offers it, reduced motion, and the static fallback.
//
// Reference-image baselines are GPU-specific. Like visual.spec.mjs they are
// compared locally and in CI only when QGA_QA_VISUAL=1; every structural
// assertion below runs everywhere.

import { test, expect, chromium } from "playwright/test";
import { readFile } from "node:fs/promises";
import { gotoReady } from "./helpers.mjs";
import { installDeterministicRandom } from "../lib/determinism.mjs";
import { kerrHorizonRadii, kerrIsco, kerrPhotonSphere } from "../../js/science/kerr.mjs";

const VIEWPORT = { width: 1440, height: 1000 };
const SEED = 42;
const READINESS = ["fonts", "network-idle", "view-mounted"];
const COMPARE_BASELINES = !process.env.CI || process.env.QGA_QA_VISUAL === "1";

test.describe.configure({ timeout: 240_000 });

async function force(context, backend) {
  await installDeterministicRandom(context, SEED);
  await context.addInitScript((value) => {
    window.QGA_RENDER_OPTIONS = { forceBackend: value, softwareClamp: false };
    sessionStorage.setItem("horizon-intro", "1");
  }, backend);
}

function observe(page) {
  const problems = [];
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.stack || error.message}`));
  page.on("console", (message) => { if (message.type() === "error") problems.push(`console: ${message.text()}`); });
  page.on("response", (response) => { if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`); });
  page.on("requestfailed", (request) => problems.push(`failed: ${request.url()}`));
  return problems;
}

const runtime = (page) => page.evaluate(() => {
  const r = window.__qgaKerrRuntime;
  return r ? { backend: r.backend, frames: r.frames, resets: r.resets, converged: r.converged, budget: r.budget, resolution: r.resolution, observer: r.observer } : null;
});

async function settled(page, timeout = 150_000) {
  await expect.poll(() => page.evaluate(() => {
    const r = window.__qgaKerrRuntime;
    const diag = window.QGA_RENDER.renderDiagnostics.snapshot().filter((entry) => entry.label !== "Atlas backdrop");
    return !!r && r.converged === true && diag.length > 0 && diag.every((entry) => entry.phase === "ready");
  }), { timeout }).toBe(true);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function setRange(page, label, value) {
  await page.getByLabel(label, { exact: true }).evaluate((element, v) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(element, String(v));
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

/** Luminance of the left and right halves of a PNG of the observatory canvas. */
async function halves(page, png) {
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let left = 0, right = 0, lit = 0;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const i = (y * canvas.width + x) * 4;
        const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        if (luma > 24) lit += 1;
        if (x < canvas.width / 2) left += luma; else right += luma;
      }
    }
    return { left, right, lit, pixels: canvas.width * canvas.height, asymmetry: (right - left) / (right + left) };
  }, png.toString("base64"));
}

const canvasPng = (page) => page.locator(".s3d-canvas").first().screenshot();

async function audit(page) {
  const text = await page.locator(".viz-frame").first().innerText();
  expect(text, "NaN or Infinity in the observatory UI").not.toMatch(/NaN|Infinity/);
}

function assertFiniteDeep(value, path = "export") {
  if (typeof value === "number") expect(Number.isFinite(value), `${path} is not finite`).toBe(true);
  else if (Array.isArray(value)) value.forEach((entry, index) => assertFiniteDeep(entry, `${path}[${index}]`));
  else if (value && typeof value === "object") for (const [key, entry] of Object.entries(value)) assertFiniteDeep(entry, `${path}.${key}`);
}

const SPINS = [["schwarzschild", 0], ["prograde-0p9", 0.9], ["retrograde-0p9", -0.9]];
const asymmetryBySpin = {};

test.describe("forced WebGL2, reduced motion", () => {
  test.use({ viewport: VIEWPORT, contextOptions: { reducedMotion: "reduce" } });

  for (const [name, a] of SPINS) {
    test(`reference image and readouts: ${name} (a* = ${a})`, async ({ page, context }) => {
      await force(context, "webgl2");
      const problems = observe(page);
      await gotoReady(page, `/?view=bh&bhm=1&bhs=${a}&seed=${SEED}`, READINESS);
      await settled(page);

      const info = await runtime(page);
      expect(info.backend).toBe("webgl2");
      expect(info.budget.temporalSamples).toBe(1);
      expect(info.budget.samplesPerFrame).toBeGreaterThanOrEqual(4);

      // Readouts are the Prompt 03 values (QGA_PHYSICS mirrors the ESM science core value for value).
      const readouts = await page.locator(".kerr-readout").allInnerTexts();
      const joined = readouts.join("\n");
      expect(joined).toContain(kerrHorizonRadii(a).rPlus.toFixed(3));
      expect(joined).toContain(kerrIsco(a, { prograde: true }).toFixed(3));
      expect(joined).toContain(kerrIsco(a, { prograde: false }).toFixed(3));
      expect(joined).toContain(kerrPhotonSphere(a, { prograde: true }).toFixed(3));
      expect(joined).toContain(kerrPhotonSphere(a, { prograde: false }).toFixed(3));
      await audit(page);

      const png = await canvasPng(page);
      const measured = await halves(page, png);
      expect(measured.lit / measured.pixels, "canvas is not blank").toBeGreaterThan(0.05);
      asymmetryBySpin[name] = measured.asymmetry;
      if (COMPARE_BASELINES) {
        expect(png).toMatchSnapshot(`kerr-observatory-ref-${name}.png`, { maxDiffPixelRatio: 0.02 });
      }
      expect(problems).toEqual([]);
    });
  }

  test("v2 turbulent disk renders on WebGL2 and freezes under reduced motion", async ({ page, context }) => {
    await force(context, "webgl2");
    const problems = observe(page);
    await gotoReady(page, `/?view=bh&bhv=2&bhs=0.9&seed=${SEED}`, READINESS);
    await settled(page);
    const state = await page.evaluate(() => window.QGA_READ_STATE());
    expect(state).toMatchObject({ bhStateVersion: 2, bhDiskModel: "page-thorne-turbulent", bhAnnotations: false });
    const info = await page.evaluate(() => window.__qgaKerrRuntime);
    expect(info.backend).toBe("webgl2");
    expect(info.reducedMotion).toBe(true);
    expect(info.plasmaTime).toBe(0);
    const png = await canvasPng(page);
    const measured = await halves(page, png);
    expect(measured.lit / measured.pixels).toBeGreaterThan(0.05);
    if (COMPARE_BASELINES) {
      expect(png).toMatchSnapshot("kerr-observatory-ref-turbulent.png", { maxDiffPixelRatio: 0.02 });
    }
    expect(problems).toEqual([]);
  });

  test("beaming asymmetry: visible when inclined, the same side for both spin signs, near zero face-on", async ({ page, context }) => {
    await force(context, "webgl2");
    const measure = async (query) => {
      await gotoReady(page, `/?view=bh&bhm=1&seed=${SEED}&${query}`, READINESS);
      await settled(page);
      return halves(page, await canvasPng(page));
    };
    const pro = await measure("bhs=0.9&bhi=75&bhv=1");
    const retro = await measure("bhs=-0.9&bhi=75&bhv=1");
    const faceOn = await measure("bhs=0.9&bhi=4&bhv=1");
    expect(Math.abs(pro.asymmetry)).toBeGreaterThan(0.1);
    expect(Math.abs(retro.asymmetry)).toBeGreaterThan(0.1);
    expect(Math.sign(pro.asymmetry)).toBe(Math.sign(retro.asymmetry));
    expect(Math.abs(faceOn.asymmetry)).toBeLessThan(Math.abs(pro.asymmetry) / 2);
  });

  test("old links keep working: missing observatory keys take defaults, a future version is ignored", async ({ page, context }) => {
    await force(context, "webgl2");
    await gotoReady(page, "/?view=bh&bhm=1&bhs=0.7", READINESS);
    const old = await page.evaluate(() => window.QGA_READ_STATE());
    expect(old).toMatchObject({ bhSpin: 0.7, bhInclination: 75, bhObserverDistance: 40, bhDiskModel: "page-thorne", bhRenderQuality: "balanced", bhExposure: 0, bhAnnotations: true });
    const v2 = await page.evaluate(() => window.QGA_READ_STATE("?view=bh&bhv=2"));
    expect(v2).toMatchObject({ bhStateVersion: 2, bhDiskModel: "page-thorne-turbulent", bhAnnotations: false });
    const future = await page.evaluate(() => window.QGA_READ_STATE("?view=bh&bhv=9&bhi=30&bhq=ultra&bhs=-0.5"));
    expect(future).toMatchObject({ bhSpin: -0.5, bhInclination: 75, bhRenderQuality: "balanced" });
    const trip = await page.evaluate(() => {
      const state = { ...window.QGA_READ_STATE("?view=bh"), bhInclination: 60, bhDiskModel: "newtonian", bhAnnotations: false };
      const search = qgaStateSearch(state);
      return { search, back: window.QGA_READ_STATE(search) };
    });
    expect(trip.search).toContain("bhv=1");
    expect(trip.back).toMatchObject({ bhInclination: 60, bhDiskModel: "newtonian", bhAnnotations: false });
  });

  test("controls write the shareable state, reset accumulation only for scene changes, and drive the budget readout", async ({ page, context }) => {
    await force(context, "webgl2");
    const problems = observe(page);
    await gotoReady(page, `/?view=bh&bhm=1&bhs=0.5&seed=${SEED}`, READINESS);
    await settled(page);
    const before = await runtime(page);

    await setRange(page, "exposure", 1);
    await expect.poll(() => page.evaluate(() => window.QGA_READ_STATE().bhExposure)).toBe(1);
    await settled(page);
    expect((await runtime(page)).resets, "exposure is display-only").toBe(before.resets);

    await setRange(page, "spin a★ (negative = retrograde disk)", -0.4);
    await expect.poll(async () => (await runtime(page)).resets).toBeGreaterThan(before.resets);
    await settled(page);
    const afterSpin = await runtime(page);

    await page.locator(".kerr-controls").getByRole("button", { name: "Page–Thorne opaque" }).click();
    await expect.poll(() => page.evaluate(() => window.QGA_READ_STATE().bhDiskModel)).toBe("page-thorne-opaque");
    await expect.poll(async () => (await runtime(page)).resets).toBeGreaterThan(afterSpin.resets);
    await settled(page);

    await page.locator(".kerr-controls").getByRole("button", { name: "Performance" }).click();
    await expect.poll(async () => (await runtime(page)).budget.effective).toBe("performance");
    expect((await runtime(page)).budget.maxSteps).toBe(112);
    await expect(page.locator(".kerr-status")).toContainText("112");

    const search = await page.evaluate(() => window.location.search);
    expect(search).toContain("bhv=1");
    expect(search).toContain("bhdm=page-thorne-opaque");
    expect(search).toContain("bhq=performance");
    expect(search).toContain("bhe=1");
    await audit(page);
    expect(problems).toEqual([]);
  });

  test("focus picking: each feature opens its exact explanation and the camera snaps under reduced motion", async ({ page, context }) => {
    await force(context, "webgl2");
    const problems = observe(page);
    const a = 0.9;
    await gotoReady(page, `/?view=bh&bhm=1&bhs=${a}&seed=${SEED}`, READINESS);
    await settled(page);
    const panel = page.locator(".kerr-focus-panel");
    const controls = page.locator(".kerr-controls");

    const expectations = [
      ["Horizon", "Event horizon and shadow", kerrHorizonRadii(a).rPlus.toFixed(4)],
      ["Photon region", "Photon region and critical curve", kerrPhotonSphere(a, { prograde: false }).toFixed(4)],
      ["Direct disk", "Direct disk image (order n = 0)", kerrIsco(a, { prograde: true }).toFixed(4)],
      ["Higher-order image", "Higher-order image", null],
    ];
    for (const [button, title, exact] of expectations) {
      await controls.getByRole("button", { name: button, exact: true }).click();
      await expect(panel.locator("h4")).toContainText(title);
      if (exact) await expect(panel).toContainText(exact);
      await expect(panel).not.toContainText(/NaN|Infinity/);
      // Reduced motion: the camera is at the planned distance without animated travel.
      await expect.poll(async () => Math.round((await runtime(page)).observer.r0), { timeout: 5_000 }).toBeLessThanOrEqual(26);
    }
    await expect(panel).toContainText("no ring is thickened");
    await expect(page.getByRole("button", { name: "Higher-order image", exact: true })).toHaveAttribute("aria-pressed", "true");

    // Clicking the shadow centre focuses the horizon.
    await panel.getByRole("button", { name: "Close explanation" }).click();
    const box = await page.locator(".s3d-canvas").first().boundingBox();
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await expect(panel.locator("h4")).toContainText("Event horizon and shadow");
    expect(problems).toEqual([]);
  });

  test("QGA_EXPORT_JSON exports exact finite state and provenance", async ({ page, context }) => {
    await force(context, "webgl2");
    await gotoReady(page, `/?view=bh&bhm=1&bhs=-0.9&bhi=60&bhq=ultra&seed=${SEED}`, READINESS);
    await settled(page);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export Kerr JSON" }).click(),
    ]);
    const payload = JSON.parse(await readFile(await download.path(), "utf8"));
    expect(payload.schema).toBe("horizon-qga-state/v1");
    expect(payload.kerrSchema).toBe("horizon-qga-kerr-observatory/v1");
    expect(payload.state).toMatchObject({ view: "bh", bhSpin: -0.9, bhInclination: 60, bhRenderQuality: "ultra" });
    expect(payload.observatory.radii.rPlus).toBe(kerrHorizonRadii(-0.9).rPlus);
    expect(payload.observatory.radii.rIsco).toBe(kerrIsco(-0.9, { prograde: true }));
    expect(payload.observatory.radii.rPhotonPro).toBe(kerrPhotonSphere(-0.9, { prograde: true }));
    expect(payload.numerics.backend).toBe("webgl2");
    expect(payload.numerics.budget.maxSteps).toBeGreaterThan(0);
    expect(payload.provenance.registryId).toBe("bh-kerr-observatory");
    expect(["established", "effective", "conjectural", "schematic", "heuristic", "open"]).toContain(payload.provenance.status);
    expect(payload.provenance.references.length).toBeGreaterThan(3);
    expect(payload.validity.some((line) => /unresolved/.test(line))).toBe(true);
    assertFiniteDeep(payload);
  });
});

test.describe("forced WebGL2, full motion", () => {
  test.use({ viewport: VIEWPORT, contextOptions: { reducedMotion: "no-preference" } });

  test("quality budget: temporal accumulation converges at the documented sample count", async ({ page, context }) => {
    await force(context, "webgl2");
    const problems = observe(page);
    await gotoReady(page, `/?view=bh&bhm=1&bhs=0.9&seed=${SEED}`, READINESS);
    await settled(page);
    const info = await runtime(page);
    expect(info.budget).toMatchObject({ effective: "balanced", maxSteps: 224, temporalSamples: 8, samplesPerFrame: 1 });
    expect(info.frames).toBe(8);
    expect(info.backend).toBe("webgl2");
    await audit(page);
    expect(problems).toEqual([]);
  });
});

test.describe("static fallback", () => {
  test.use({ viewport: VIEWPORT, contextOptions: { reducedMotion: "reduce" } });

  test("no canvas, actionable message, readouts and export stay available", async ({ page, context }) => {
    await force(context, "static");
    const problems = observe(page);
    await gotoReady(page, `/?view=bh&bhm=1&bhs=0.9&seed=${SEED}`, READINESS);
    await expect(page.getByText("3D unavailable").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry 3D initialization" }).first()).toBeVisible();
    await expect(page.locator(".s3d-canvas")).toHaveCount(0);
    expect(await page.locator(".kerr-readout").allInnerTexts()).toEqual(expect.arrayContaining([expect.stringContaining(kerrIsco(0.9, { prograde: true }).toFixed(3))]));
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export Kerr JSON" }).click(),
    ]);
    const payload = JSON.parse(await readFile(await download.path(), "utf8"));
    assertFiniteDeep(payload);
    expect(payload.numerics.backend).toBe("unknown");
    await audit(page);
    expect(problems).toEqual([]);
  });
});

test.describe("native WebGPU when available", () => {
  test("compute path renders the same observatory with storage-buffer accumulation", async ({}, testInfo) => {
    // channel/launchOptions cannot be set per describe, so this case launches its own browser.
    let browser;
    try {
      browser = await chromium.launch({
        channel: "chromium",
        args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan,WebGPU", "--use-angle=metal", "--ignore-gpu-blocklist"],
      });
    } catch (error) {
      testInfo.skip(true, `Chromium channel unavailable for native WebGPU: ${String(error.message).split("\n")[0]}`);
    }
    try {
      const context = await browser.newContext({ viewport: VIEWPORT, reducedMotion: "reduce", baseURL: process.env.QA_BASE_URL });
      await installDeterministicRandom(context, SEED);
      await context.addInitScript(() => {
        window.QGA_RENDER_OPTIONS = { softwareClamp: false };
        sessionStorage.setItem("horizon-intro", "1");
      });
      const page = await context.newPage();
      const problems = observe(page);
      await gotoReady(page, `/?view=bh&bhm=1&bhs=0.9&seed=${SEED}`, READINESS);
      const adapter = await page.evaluate(async () => {
        if (!navigator.gpu) return false;
        try { return !!(await navigator.gpu.requestAdapter()); } catch { return false; }
      });
      testInfo.skip(!adapter, "No WebGPU adapter on this machine; the forced-WebGL2 cases cover the fallback.");
      await settled(page);
      const info = await runtime(page);
      expect(info.backend).toBe("webgpu");
      const diagnostics = await page.evaluate(() => window.QGA_RENDER.renderDiagnostics.snapshot().filter((entry) => entry.label !== "Atlas backdrop"));
      expect(diagnostics.every((entry) => entry.backend === "webgpu")).toBe(true);
      const measured = await halves(page, await canvasPng(page));
      expect(measured.lit / measured.pixels).toBeGreaterThan(0.05);
      expect(Math.abs(measured.asymmetry)).toBeGreaterThan(0.1);
      await audit(page);
      expect(problems.filter((line) => !/popErrorScope|Instance dropped/.test(line))).toEqual([]);
    } finally {
      await browser?.close();
    }
  });
});
