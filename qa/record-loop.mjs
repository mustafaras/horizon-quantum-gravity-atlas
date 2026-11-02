#!/usr/bin/env node
// qa/record-loop.mjs — records the README loop (S35) through the publishing studio's own recorder.
//
// It serves this checkout, opens the Kerr hero state of the capture manifest, waits for the same readiness probes the
// screenshot uses, and calls window.QGA_EXPORT.recordCanvas on the observatory canvas with the scene's own capture()
// as the per-frame draw, exactly as the studio's Record button does, for a duration the studio's presets do not offer.
// Writes qa/output/loop/: horizon-loop.webm, horizon-loop-poster.png and horizon-loop.json (the sidecar). It never
// writes into docs/: a person looks at the file first, then commits it.
//
//   node qa/record-loop.mjs [--seconds=24] [--fps=30]
//
// Exit 1, with the reason printed, when the browser cannot record, the recorder produces nothing, or the file is over
// the 6 MB budget. Nothing is substituted for a recording that did not happen.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { loadManifest } from "./lib/manifest.mjs";
import { startServer } from "./lib/serve.mjs";
import { runReadiness } from "./lib/readiness.mjs";
import { installDeterministicRandom } from "./lib/determinism.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(root, "qa/output/loop");
const HERO_CAPTURE = "bh-kerr-hero";
const MAX_BYTES = 6 * 1024 * 1024;
// The studio's 8 Mbit/s made a 24 s loop 14.47 MiB on CI (run 41409504598); 1.5 Mbit/s budgets about 4.3 MiB.
const BITS_PER_SECOND = 1_500_000;
const VIEWPORT = { width: 1280, height: 720 };
const SEED = 42;

const opt = (name, fallback) => Number(process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback);

/** Runs in the page: records the largest live scene canvas and returns the WebM as base64 with its clip rectangle. */
async function recordInPage({ seconds, fps, bitsPerSecond }) {
  const EXPORT = window.QGA_EXPORT;
  if (!EXPORT) return { error: "window.QGA_EXPORT is not loaded" };
  const support = EXPORT.recordingSupport(window);
  if (!support.supported) return { error: `recording not supported: ${support.reason}` };
  const canvasOf = (handle) => (handle?.element?.tagName === "CANVAS" ? handle.element : handle?.element?.querySelector("canvas"));
  const area = (el) => { const r = el.getBoundingClientRect(); return r.width * r.height; };
  const handles = [...(window.__qgaActiveScenes ?? [])].filter((h) => canvasOf(h));
  if (!handles.length) return { error: "no live scene canvas in this view" };
  const handle = handles.reduce((best, h) => (area(canvasOf(h)) > area(canvasOf(best)) ? h : best));
  const canvas = canvasOf(handle);
  canvas.scrollIntoView({ block: "center" });
  const rect = canvas.getBoundingClientRect();
  try {
    const result = await EXPORT.recordCanvas({ canvas, seconds, fps, bitsPerSecond, draw: handle.capture ? () => handle.capture() : null });
    const bytes = new Uint8Array(await result.blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return {
      base64: btoa(binary), mime: result.mime, frames: result.frames, bytes: result.bytes, hasCapture: Boolean(handle.capture),
      clip: { x: Math.max(0, rect.left), y: Math.max(0, rect.top), width: Math.min(rect.width, innerWidth), height: Math.min(rect.height, innerHeight) },
    };
  } catch (error) {
    return { error: `${error.code ?? "error"}: ${error.message}` };
  }
}

async function main() {
  const seconds = opt("seconds", 24);
  const fps = opt("fps", 30);
  const { captures } = await loadManifest(root);
  const hero = captures.find((c) => c.id === HERO_CAPTURE);
  if (!hero) throw new Error(`capture ${HERO_CAPTURE} is not in qa/manifest.json`);

  const server = await startServer(root);
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, reducedMotion: "no-preference", colorScheme: "dark" });
    await installDeterministicRandom(context, SEED);
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
    page.on("pageerror", (err) => consoleErrors.push(String(err)));
    const url = `${hero.url}&seed=${SEED}`;
    await page.goto(`${server.baseUrl}/${url}`, { waitUntil: "domcontentloaded", timeout: hero.timeoutMs });
    await runReadiness(page, hero.readiness, { timeoutMs: hero.timeoutMs, settleMs: hero.settleMs });

    // A long software-rasterised recording: allow two seconds a frame before giving up.
    page.setDefaultTimeout(seconds * fps * 2000);
    const started = Date.now();
    const result = await page.evaluate(recordInPage, { seconds, fps, bitsPerSecond: BITS_PER_SECOND });
    const wallSeconds = (Date.now() - started) / 1000;
    if (result.error) throw new Error(result.error);
    if (result.bytes > MAX_BYTES) throw new Error(`recording is ${(result.bytes / 1024 ** 2).toFixed(2)} MiB, over the 6 MB budget`);

    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(path.join(OUT_DIR, "horizon-loop.webm"), Buffer.from(result.base64, "base64"));
    await writeFile(path.join(OUT_DIR, "horizon-loop-poster.png"), await page.screenshot({ clip: result.clip }));
    const sidecar = {
      kind: "readme-loop", url, viewport: VIEWPORT, seconds, fps, bitsPerSecond: BITS_PER_SECOND, frames: result.frames, mime: result.mime,
      bytes: result.bytes, perFrameCapture: result.hasCapture, wallSeconds, browser: browser.version(),
      commit: process.env.GITHUB_SHA ?? null, provenance: HERO_CAPTURE, status: hero.scientificStatus, statusNote: hero.statusNote,
      consoleErrors,
    };
    await writeFile(path.join(OUT_DIR, "horizon-loop.json"), `${JSON.stringify(sidecar, null, 2)}\n`);
    console.log(`✓ recorded ${result.frames} frames (${seconds} s at ${fps} fps) as ${result.mime}: ${(result.bytes / 1024 ** 2).toFixed(2)} MiB in ${wallSeconds.toFixed(0)} s → qa/output/loop/`);
    if (consoleErrors.length) console.warn(`  ${consoleErrors.length} console error(s): ${consoleErrors.slice(0, 5).join(" | ")}`);
    await context.close();
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((err) => {
  console.error(`✗ loop recording failed: ${err.message ?? err}`);
  process.exit(1);
});
