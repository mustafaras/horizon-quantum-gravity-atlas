// Kerr ultra-quality capture acceptance (Prompt 05).
//
// Covers the progressive still renderer end to end on the forced WebGL2
// backend and, when the machine offers it, the native WebGPU compute path:
//   - a 2K capture completes, decodes as a PNG, has the exact dimensions and
//     embeds the metadata sidecar (state, provenance, backend, sample count,
//     commit hash) in a tEXt chunk with valid CRCs;
//   - repeated captures with the same seed and frozen clock are pixel-stable;
//   - the GPU-memory guard rejects unsafe dimensions before allocation with
//     an actionable message;
//   - cancellation mid-capture surfaces a named error and leaves the live
//     observatory rendering (no leaked render targets: repeated captures
//     keep succeeding and the renderer stays alive);
//   - the volumetric layer changes the image (corona + jets on WebGL2), the
//     jets follow the Blandford-Znajek spin scaling (a* = 0 -> no jets) and
//     Doppler beaming brightens the approaching jet near the axis;
//   - the URL state carries the new volume keys and old links default safely.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";
import { installDeterministicRandom } from "../lib/determinism.mjs";
import { parsePngChunks } from "../../js/render/progressive-capture.mjs";

const VIEWPORT = { width: 1440, height: 1000 };
const SEED = 42;
const READINESS = ["fonts", "network-idle", "view-mounted"];
// The statistical tests (stability, volume, beaming) measure image statistics,
// not resolution, so they render a small still: the 2K path is exercised once
// by the acceptance test above. A 2K ultra still costs ~18 s per sample in a
// software rasterizer, so five statistical tests at 2K would add ~6 minutes to
// the suite for no extra coverage.
const SMALL = { width: 640, height: 444 };
const SMALL_SAMPLES = 4;
// The capture API records the commit hash the caller supplies; the control deck
// reads it from window.QGA_BUILD_INFO, and the harness passes it explicitly.
const COMMIT = "qa-test-commit";

test.describe.configure({ timeout: 300_000 });
test.use({ viewport: VIEWPORT, contextOptions: { reducedMotion: "reduce" } });

async function force(context, backend) {
  await installDeterministicRandom(context, SEED);
  await context.addInitScript((value) => {
    window.QGA_RENDER_OPTIONS = { forceBackend: value, softwareClamp: false };
    window.QGA_BUILD_INFO = { commitHash: "qa-test-commit" };
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

async function settled(page, timeout = 150_000) {
  await expect.poll(() => page.evaluate(() => {
    const r = window.__qgaKerrRuntime;
    const diag = window.QGA_RENDER.renderDiagnostics.snapshot().filter((entry) => entry.label !== "Atlas backdrop");
    return !!r && r.converged === true && diag.length > 0 && diag.every((entry) => entry.phase === "ready");
  }), { timeout }).toBe(true);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

const runtime = (page) => page.evaluate(() => {
  const r = window.__qgaKerrRuntime;
  return r ? { backend: r.backend, volume: r.volume, budget: r.budget } : null;
});

/** Mean luminance and lit-pixel count of a captured PNG (decoded in-page). */
async function pngStats(page, png) {
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let total = 0;
    let lit = 0;
    let topHalf = 0;
    let bottomHalf = 0;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const i = (y * canvas.width + x) * 4;
        const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        total += luma;
        if (luma > 24) lit += 1;
        if (y < canvas.height / 2) topHalf += luma; else bottomHalf += luma;
      }
    }
    return {
      width: canvas.width,
      height: canvas.height,
      mean: total / (canvas.width * canvas.height),
      lit,
      topHalf,
      bottomHalf,
    };
  }, png.toString("base64"));
}

/** Decoded RGBA bytes of a captured PNG, as base64 (chunked to avoid the argument limit). */
async function pngPixels(page, png) {
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let binary = "";
    for (let i = 0; i < data.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, data.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }, png.toString("base64"));
}

/** The sidecar without its wall-clock stamp, which can never be reproducible. */
function withoutTimestamp(metadata) {
  const copy = { ...metadata };
  delete copy.capturedAt;
  return copy;
}

async function capture(page, request) {
  return page.evaluate(async (options) => {
    const result = await window.__qgaKerrCapture(options);
    // A 2K PNG is megabytes; String.fromCharCode(...bytes) would exceed the
    // argument limit, so convert in chunks.
    const bytes = result.png;
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return {
      pngBase64: btoa(binary),
      metadata: result.metadata,
      width: result.width,
      height: result.height,
    };
  }, request);
}

test.describe("Kerr ultra-quality capture (WebGL2)", () => {
  test.beforeEach(async ({ context }) => {
    await force(context, "webgl2");
  });

  test("a 2K capture completes, decodes and embeds the metadata sidecar", async ({ page }) => {
    const problems = observe(page);
    await gotoReady(page, "/?view=bh&bhs=0.7", READINESS);
    await settled(page);
    const info = runtime(page) ? await runtime(page) : null;
    expect(info?.backend).toBe("webgl2");
    const result = await capture(page, { preset: "2k", samples: 4, samplesPerChunk: 4, denoise: true, commitHash: COMMIT });
    const png = Buffer.from(result.pngBase64, "base64");
    const parsed = parsePngChunks(png);
    expect(parsed.width).toBe(result.width);
    expect(parsed.height).toBe(result.height);
    expect(result.height).toBe(1440);
    expect(result.width).toBeGreaterThan(1000);
    const sidecar = JSON.parse(parsed.text["horizon-qga-capture"]);
    expect(sidecar.schema).toBe("horizon-qga-capture/v1");
    expect(sidecar.backend).toBe("webgl2");
    expect(sidecar.sampleCount).toBe(4);
    expect(sidecar.commitHash).toBe(COMMIT);
    expect(sidecar.state.aStar).toBeCloseTo(0.7, 6);
    expect(sidecar.provenance.registryId).toBe("bh-kerr-observatory");
    expect(sidecar.provenance.status).toBe("effective");
    expect(sidecar.quality.effective).toBe("ultra");
    expect(sidecar.resolution.height).toBe(1440);
    const stats = await pngStats(page, png);
    expect(stats.mean).toBeGreaterThan(1, "the capture is not black");
    expect(stats.lit).toBeGreaterThan(stats.width * stats.height * 0.005, "the capture has structure");
    expect(problems).toEqual([]);
  });

  test("repeated captures with the same seed and frozen clock are pixel-stable", async ({ page }) => {
    await gotoReady(page, "/?view=bh&bhs=0.7", READINESS);
    await settled(page);
    const first = await capture(page, { ...SMALL, samples: SMALL_SAMPLES, samplesPerChunk: SMALL_SAMPLES });
    const second = await capture(page, { ...SMALL, samples: SMALL_SAMPLES, samplesPerChunk: SMALL_SAMPLES });
    // The sidecar stamps a wall-clock `capturedAt`, so the PNG bytes differ by
    // that one tEXt field. Everything else — every pixel and every other
    // metadata field — must be identical.
    expect(withoutTimestamp(second.metadata)).toEqual(withoutTimestamp(first.metadata));
    expect(first.metadata.deterministic.clockFrozen).toBe(true);
    const firstPixels = await pngPixels(page, Buffer.from(first.pngBase64, "base64"));
    const secondPixels = await pngPixels(page, Buffer.from(second.pngBase64, "base64"));
    expect(secondPixels).toBe(firstPixels, "identical requests must produce identical pixels");
    const stats = await pngStats(page, Buffer.from(first.pngBase64, "base64"));
    expect(stats.mean).toBeGreaterThan(1);
  });

  test("the memory guard rejects unsafe dimensions before allocation with an actionable message", async ({ page }) => {
    await gotoReady(page, "/?view=bh", READINESS);
    await settled(page);
    const error = await page.evaluate(async () => {
      try {
        await window.__qgaKerrCapture({ width: 100, height: 20000, samples: 2 });
        return null;
      } catch (err) {
        return { name: err.name, message: err.message };
      }
    });
    expect(error).not.toBeNull();
    expect(error.message).toMatch(/maximum texture dimension|memory/);
    expect(error.message).toMatch(/smaller preset|upscale/);
    // The live observatory still renders after the rejection.
    await settled(page, 30_000);
  });

  test("cancelling mid-capture surfaces a named error and the observatory keeps rendering", async ({ page }) => {
    const problems = observe(page);
    await gotoReady(page, "/?view=bh", READINESS);
    await settled(page);
    const error = await page.evaluate(async () => {
      const signal = { aborted: false };
      const pending = window.__qgaKerrCapture({ preset: "2k", samples: 400, samplesPerChunk: 2, signal }).catch((err) => err);
      await new Promise((resolve) => setTimeout(resolve, 400));
      signal.aborted = true;
      return pending;
    });
    expect(error.name).toBe("CaptureCancelledError");
    // Repeated captures after a cancellation still succeed (no leaked state).
    const again = await capture(page, { ...SMALL, samples: SMALL_SAMPLES, samplesPerChunk: SMALL_SAMPLES });
    expect(again.height).toBe(SMALL.height);
    await settled(page, 60_000);
    expect(problems.filter((line) => !/WebGL: INVALID_OPERATION|popErrorScope/.test(line))).toEqual([]);
  });

  test("the volumetric layer changes the image and follows the Blandford-Znajek spin scaling", async ({ page }) => {
    await gotoReady(page, "/?view=bh&bhs=0.7&bhq=ultra", READINESS);
    await settled(page);
    const withVolume = await runtime(page);
    expect(withVolume.volume.corona).toBe(true);
    expect(withVolume.volume.jets).toBe(true);
    const on = await capture(page, { ...SMALL, samples: SMALL_SAMPLES, samplesPerChunk: SMALL_SAMPLES });
    const onStats = await pngStats(page, Buffer.from(on.pngBase64, "base64"));
    // Toggle both layers off through the shareable state and recapture.
    await page.evaluate(() => {
      const state = window.QGA_READ_STATE();
      window.QGA_WRITE_STATE({ ...state, bhCorona: false, bhJets: false }, { replace: true });
    });
    await page.waitForTimeout(500);
    await settled(page);
    const off = await runtime(page);
    expect(off.volume.corona).toBe(false);
    expect(off.volume.jets).toBe(false);
    const offCapture = await capture(page, { ...SMALL, samples: SMALL_SAMPLES, samplesPerChunk: SMALL_SAMPLES });
    const offStats = await pngStats(page, Buffer.from(offCapture.pngBase64, "base64"));
    expect(Math.abs(onStats.mean - offStats.mean)).toBeGreaterThan(0.05, "the volumetric layer visibly changes the image");
    // Zero spin: the BZ factor removes the jets entirely, so a* = 0 with the
    // jets toggled on must match a* = 0 with them toggled off. Comparing
    // against the a* = 0.7 baseline above would measure the spin change (ISCO
    // radius, disk shape, photon ring), not the jet.
    await page.evaluate(() => {
      const state = window.QGA_READ_STATE();
      window.QGA_WRITE_STATE({ ...state, bhSpin: 0, bhCorona: false, bhJets: true }, { replace: true });
    });
    await page.waitForTimeout(500);
    await settled(page);
    const zeroSpin = await runtime(page);
    expect(zeroSpin.volume.jets).toBe(true);
    const zero = await capture(page, { ...SMALL, samples: SMALL_SAMPLES, samplesPerChunk: SMALL_SAMPLES });
    const zeroStats = await pngStats(page, Buffer.from(zero.pngBase64, "base64"));
    await page.evaluate(() => {
      const state = window.QGA_READ_STATE();
      window.QGA_WRITE_STATE({ ...state, bhSpin: 0, bhCorona: false, bhJets: false }, { replace: true });
    });
    await page.waitForTimeout(500);
    await settled(page);
    const zeroOff = await capture(page, { ...SMALL, samples: SMALL_SAMPLES, samplesPerChunk: SMALL_SAMPLES });
    const zeroOffStats = await pngStats(page, Buffer.from(zeroOff.pngBase64, "base64"));
    expect(Math.abs(zeroStats.mean - zeroOffStats.mean)).toBeLessThan(0.05, "a* = 0 leaves no BZ jet in the image");
  });

  test("Doppler beaming: the approaching jet brightens when viewed near the axis", async ({ page }) => {
    await gotoReady(page, "/?view=bh&bhs=0.9&bhi=18&bhq=ultra", READINESS);
    await settled(page);
    const near = await capture(page, { ...SMALL, samples: SMALL_SAMPLES, samplesPerChunk: SMALL_SAMPLES });
    const nearStats = await pngStats(page, Buffer.from(near.pngBase64, "base64"));
    // The north jet (pointing toward a northern observer) beams into the top
    // half of the image; at 18 degrees from the axis the asymmetry is strong.
    const asymmetry = (nearStats.topHalf - nearStats.bottomHalf) / (nearStats.topHalf + nearStats.bottomHalf);
    expect(asymmetry).toBeGreaterThan(0.01, `jet beaming must light the approaching half (asymmetry ${asymmetry.toFixed(4)})`);
  });

  test("the URL state carries the volume keys and old links default safely", async ({ page }) => {
    await gotoReady(page, "/?view=bh&bhs=0.7&bhc=false&bhj=false", READINESS);
    await settled(page);
    const off = await runtime(page);
    expect(off.volume.corona).toBe(false);
    expect(off.volume.jets).toBe(false);
    const search = await page.evaluate(() => window.QGA_READ_STATE());
    expect(search.bhCorona).toBe(false);
    // A v2 link without the keys keeps the documented defaults (both on).
    await gotoReady(page, "/?view=bh&bhs=0.7&bhv=2", READINESS);
    await settled(page);
    const legacy = await runtime(page);
    expect(legacy.volume.corona).toBe(true);
    expect(legacy.volume.jets).toBe(true);
  });
});

test.describe("Kerr ultra-quality capture (WebGPU compute path)", () => {
  test("the highest supported WebGPU mode captures without crash or leaked targets", async ({}, testInfo) => {
    testInfo.skip(process.env.QGA_QA_FORCE_BACKEND === "webgl2", "WebGL2 forced");
    const { chromium } = await import("playwright/test");
    const browser = await chromium.launch({ args: ["--enable-unsafe-webgpu"] });
    const context = await browser.newContext({ viewport: VIEWPORT, reducedMotion: "reduce", baseURL: process.env.QA_BASE_URL });
    try {
      await force(context, "webgpu");
      const page = await context.newPage();
      const problems = observe(page);
      await gotoReady(page, "/?view=bh&bhs=0.7&bhdm=page-thorne", READINESS);
      await settled(page);
      const info = await runtime(page);
      if (info?.backend !== "webgpu") {
        testInfo.skip(true, `native WebGPU unavailable (backend: ${info?.backend})`);
        return;
      }
      const first = await capture(page, { preset: "2k", samples: 2, samplesPerChunk: 2 });
      const parsed = parsePngChunks(Buffer.from(first.pngBase64, "base64"));
      expect(parsed.width).toBe(first.width);
      const sidecar = JSON.parse(parsed.text["horizon-qga-capture"]);
      expect(sidecar.backend).toBe("webgpu");
      expect(sidecar.sampleCount).toBe(2);
      // A second capture after the buffer rebuild proves nothing leaked.
      const second = await capture(page, { preset: "2k", samples: 2, samplesPerChunk: 2 });
      expect(second.height).toBe(1440);
      const stats = await pngStats(page, Buffer.from(second.pngBase64, "base64"));
      expect(stats.mean).toBeGreaterThan(1);
      await settled(page, 60_000);
      expect(problems.filter((line) => !/popErrorScope|Instance dropped/.test(line))).toEqual([]);
    } finally {
      await browser.close();
    }
  });
});
