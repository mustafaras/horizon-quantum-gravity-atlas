// Re-runnable performance baseline collector.
//
//   node scripts/perf/collect.mjs [--out=docs/audit/v2-baseline.json] [--views=qft,bh]
//        [--viewports=desktop,mobile] [--duration=5000] [--webgpu] [--launch-arg=…]
//        [--render-option=stage=shared]   (repeatable; sets window.QGA_RENDER_OPTIONS before any page script)
//
// Serves this worktree with the QA static server, loads every view of
// QGA_VIEWS at two viewports in a fresh browser context, waits until every
// renderer diagnostic is ready or static, then records renderer and program
// counts, rAF frame time, optional GPU time, first-frame time, JS transfer
// size and Babel time. By default Chromium runs with WebGPU disabled, exactly
// as CI does (qa/playwright.config.mjs); --webgpu measures the local GPU.
// Set QGA_CHROMIUM_PATH to use a specific Chromium binary.
// Exit code 1 if any view fails to become ready or logs a page error.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startServer } from "../../qa/lib/serve.mjs";
import { runReadiness } from "../../qa/lib/readiness.mjs";
import { summarize } from "./lib/stats.mjs";
import { parseViewIds } from "./lib/views.mjs";
import { formatReport } from "./lib/report.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: "mobile", width: 390, height: 844, deviceScaleFactor: 3 },
];
const READY_TIMEOUT_MS = 120_000;
const STABLE_MS = 1500;
const POLL_MS = 250;
const GPU_PROBE_FRAMES = 120;

function parseArgs(argv) {
  const options = { out: "docs/audit/v2-baseline.json", views: null, viewports: VIEWPORTS.map((v) => v.name), duration: 5000, webgpu: false, launchArgs: [], renderOptions: {} };
  for (const arg of argv) {
    const [flag, value] = arg.split(/=(.*)/s);
    if (flag === "--out") options.out = value;
    else if (flag === "--views") options.views = value.split(",").filter(Boolean);
    else if (flag === "--viewports") options.viewports = value.split(",").filter(Boolean);
    else if (flag === "--duration") options.duration = Number(value);
    else if (flag === "--webgpu") options.webgpu = true;
    else if (flag === "--launch-arg") options.launchArgs.push(value);
    else if (flag === "--render-option") {
      const [key, raw] = value.split(/=(.*)/s);
      if (!key || raw === undefined) throw new RangeError("--render-option needs key=value");
      let parsed = raw;
      try { parsed = JSON.parse(raw); } catch { /* plain string */ }
      options.renderOptions[key] = parsed;
    }
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (!(options.duration > 0)) throw new RangeError("--duration must be a positive number of milliseconds");
  for (const name of options.viewports) if (!VIEWPORTS.some((v) => v.name === name)) throw new RangeError(`Unknown viewport ${name}`);
  return options;
}

// Runs before any page script. Subscribes to the render diagnostics as soon as
// bootstrap publishes them, so the first "ready" is timed from the exact moment
// it happens (performance.now() is relative to navigation start).
function installFirstFrameProbe() {
  const probe = (window.__qgaPerf = { firstReadyMs: null });
  const attach = () => {
    const api = window.QGA_RENDER?.renderDiagnostics;
    if (!api) { requestAnimationFrame(attach); return; }
    const check = () => {
      if (probe.firstReadyMs === null && api.snapshot().some((entry) => entry.phase === "ready")) probe.firstReadyMs = performance.now();
    };
    api.subscribe(check);
    check();
  };
  attach();
}

const sceneSnapshot = () => window.QGA_RENDER.renderDiagnostics.snapshot().map((entry) => ({
  id: entry.id, label: entry.label, phase: entry.phase, backend: entry.backend,
  rendererPath: entry.capabilities?.rendererPath ?? null,
  softwareRasterizer: entry.messages.some((message) => /Software rasterizer detected/.test(message)),
}));

async function waitForScenes(page) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let lastKey = null, since = Date.now(), scenes = [];
  for (;;) {
    scenes = await page.evaluate(sceneSnapshot);
    const settled = scenes.every((scene) => ["ready", "static", "suspended"].includes(scene.phase));
    const key = scenes.map((scene) => `${scene.id}:${scene.phase}`).join("|");
    if (key !== lastKey || !settled) { lastKey = key; since = Date.now(); }
    else if (Date.now() - since >= STABLE_MS) return scenes;
    if (Date.now() > deadline) {
      throw new Error(`scenes not ready within ${READY_TIMEOUT_MS} ms: ${scenes.filter((s) => !["ready", "static", "suspended"].includes(s.phase)).map((s) => `${s.label}=${s.phase}`).join(", ") || "none mounted"}`);
    }
    await page.waitForTimeout(POLL_MS); // poll cadence, not a readiness sleep
  }
}

async function measureFrames(page, durationMs) {
  return page.evaluate((ms) => new Promise((resolve) => {
    const deltas = [];
    requestAnimationFrame((start) => {
      let last = start;
      const step = (now) => {
        deltas.push(now - last);
        last = now;
        if (now - start < ms) requestAnimationFrame(step); else resolve(deltas);
      };
      requestAnimationFrame(step);
    });
  }), durationMs);
}

// GPU time of a fixed reference workload. r186 only enables timestamp queries
// when `trackTimestamp: true` is passed at renderer construction, and the
// app's own renderers do not pass it, so this throw-away WebGPURenderer is the
// only way to read GPU time without changing product behaviour. It times a
// deterministic scene (lit sphere + 20 000 points, seeded LCG) on the same
// device while the view runs, so the number is comparable across commits but is
// not the cost of the view's own scenes.
async function probeGPU(frames) {
  if (!navigator.gpu) return { reason: "navigator.gpu unavailable" };
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) return { reason: "no WebGPU adapter" };
  const adapterInfo = { vendor: adapter.info?.vendor ?? "", architecture: adapter.info?.architecture ?? "", description: adapter.info?.description ?? "" };
  if (!adapter.features.has("timestamp-query")) return { reason: "adapter lacks the timestamp-query feature", adapter: adapterInfo };
  const THREE = await import("three/webgpu");
  let renderer;
  try {
    renderer = new THREE.WebGPURenderer({ canvas: document.createElement("canvas"), antialias: true, trackTimestamp: true });
    await renderer.init();
    if (!renderer.backend?.isWebGPUBackend) return { reason: "WebGPURenderer fell back to its WebGL2 backend", adapter: adapterInfo };
    if (!renderer.backend.trackTimestamp) return { reason: "timestamp tracking disabled by the backend", adapter: adapterInfo };
    renderer.setSize(512, 512, false);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 4;
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.MeshStandardMaterial({ color: 0x88aaff, roughness: 0.4 })));
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(2, 3, 4);
    scene.add(light);
    let seed = 12345;
    const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    const positions = new Float32Array(20000 * 3);
    for (let i = 0; i < positions.length; i++) positions[i] = (random() - 0.5) * 6;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.02, color: 0xffffff })));
    const samples = [];
    for (let i = 0; i < frames + 10; i++) {
      renderer.render(scene, camera);
      // Resolves to the GPU duration of the frame in ms (the pool's lastValue
      // until the first query lands, which is 0 and is skipped).
      const ms = await renderer.resolveTimestampsAsync("render");
      if (i >= 10 && Number.isFinite(ms) && ms > 0) samples.push(ms);
    }
    return samples.length ? { samples, adapter: adapterInfo } : { reason: "timestamp queries resolved no samples", adapter: adapterInfo };
  } finally {
    // dispose() awaits init(), so it is only safe once initialization succeeded.
    try { if (renderer?.initialized) await renderer.dispose(); } catch { /* the probe result is what matters */ }
  }
}

function trackScriptBytes(cdp) {
  const urls = new Map();
  const totals = { bytes: 0, requests: 0 };
  cdp.on("Network.responseReceived", (event) => urls.set(event.requestId, event.response.url));
  cdp.on("Network.loadingFinished", (event) => {
    const url = urls.get(event.requestId);
    if (url && /\.(?:js|jsx|mjs)$/.test(new URL(url).pathname)) { totals.bytes += event.encodedDataLength; totals.requests++; }
  });
  return totals;
}

async function measureView(browser, baseUrl, viewport, view, options) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
    colorScheme: "dark",
  });
  const result = { viewport: viewport.name, view, ok: false };
  const pageErrors = [];
  try {
    await context.addInitScript(() => sessionStorage.setItem("horizon-intro", "1"));
    if (Object.keys(options.renderOptions).length) await context.addInitScript((value) => { window.QGA_RENDER_OPTIONS = { ...(window.QGA_RENDER_OPTIONS || {}), ...value }; }, options.renderOptions);
    await context.addInitScript(installFirstFrameProbe);
    const page = await context.newPage();
    page.on("pageerror", (error) => pageErrors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") pageErrors.push(`console: ${message.text()}`); });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    const scripts = trackScriptBytes(cdp);

    await page.goto(`${baseUrl}/?view=${view}&seed=42`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await runReadiness(page, ["fonts", "network-idle", "view-mounted"], { timeoutMs: READY_TIMEOUT_MS });
    const scenes = await waitForScenes(page);

    result.scrolledTo = await page.evaluate(() => {
      const stage = document.querySelector(".s3d-stage");
      stage?.scrollIntoView({ block: "center" });
      return stage ? ".s3d-stage" : null;
    });
    const deltas = await measureFrames(page, options.duration);
    const gpu = await page.evaluate(probeGPU, GPU_PROBE_FRAMES).catch((error) => ({ reason: `probe failed: ${String(error.message).split("\n")[0]}` }));

    const marks = await page.evaluate(() => {
      const at = (name) => performance.getEntriesByName(name)[0]?.startTime ?? null;
      return { start: at("qga:babel:start"), end: at("qga:babel:end"), firstReadyMs: window.__qgaPerf.firstReadyMs };
    });
    const [renderers, stats] = await page.evaluate(() => [QGA_RENDER.renderDiagnostics.liveRenderers(), QGA_RENDER.renderDiagnostics.rendererStats()]);
    const counted = stats.map((s) => s.programs).filter((n) => n !== null);

    Object.assign(result, {
      ok: true,
      renderers,
      scenes: scenes.map(({ label, phase, backend, rendererPath, softwareRasterizer }) => ({ label, phase, backend, rendererPath, softwareRasterizer })),
      programs: { total: counted.length ? counted.reduce((a, b) => a + b, 0) : null, perRenderer: stats.map((s) => s.programs) },
      rendererStats: stats,
      cpuFrameMs: summarize(deltas),
      gpuFrameMs: gpu.samples ? summarize(gpu.samples, 3) : null,
      gpuNote: gpu.samples ? "reference probe (fixed scene), not the view's own scenes" : gpu.reason,
      firstFrameMs: marks.firstReadyMs === null ? null : Number(marks.firstReadyMs.toFixed(0)),
      jsBytes: scripts.bytes,
      jsRequests: scripts.requests,
      babelMs: marks.start === null || marks.end === null ? null : Number((marks.end - marks.start).toFixed(0)),
    });
    if (gpu.adapter) result.gpuAdapter = gpu.adapter;
  } catch (error) {
    result.error = String(error.message ?? error).split("\n")[0];
  } finally {
    result.pageErrors = pageErrors;
    await context.close();
  }
  return result;
}

async function describeEnvironment(browser, baseUrl, options) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(`${baseUrl}/package.json`); // any same-origin document: navigator.gpu needs a secure context
    const probe = await page.evaluate(async () => {
      const gl = document.createElement("canvas").getContext("webgl2");
      const ext = gl?.getExtension("WEBGL_debug_renderer_info");
      const adapter = navigator.gpu ? await navigator.gpu.requestAdapter() : null;
      return {
        webgl2: !!gl, gpuString: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null,
        gpuVendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null,
        navigatorGpu: !!navigator.gpu,
        webgpuAdapter: adapter ? { vendor: adapter.info?.vendor ?? "", architecture: adapter.info?.architecture ?? "", timestampQuery: adapter.features.has("timestamp-query") } : null,
      };
    });
    return {
      chromium: browser.version(), platform: process.platform, node: process.version,
      webgpu: options.webgpu ? "not disabled" : "disabled (--disable-blink-features=WebGPU, as in CI)",
      ...probe,
    };
  } finally { await context.close(); }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const allViews = parseViewIds(await readFile(path.join(root, "js/app.jsx"), "utf8"));
  const views = options.views ?? allViews;
  for (const view of views) if (!allViews.includes(view)) throw new RangeError(`Unknown view ${view}; known: ${allViews.join(", ")}`);

  const server = await startServer(root);
  const args = [...(options.webgpu ? [] : ["--disable-blink-features=WebGPU"]), ...options.launchArgs];
  const browser = await chromium.launch({ args, ...(process.env.QGA_CHROMIUM_PATH ? { executablePath: process.env.QGA_CHROMIUM_PATH } : {}) });
  try {
    const report = {
      schema: "horizon-perf/v1",
      date: new Date().toISOString().slice(0, 10),
      environment: await describeEnvironment(browser, server.baseUrl, options),
      config: {
        durationMs: options.duration, renderOptions: options.renderOptions, gpuProbeFrames: GPU_PROBE_FRAMES, launchArgs: args, readyStableMs: STABLE_MS,
        viewports: VIEWPORTS.filter((v) => options.viewports.includes(v.name)),
      },
      results: [],
    };
    for (const viewport of report.config.viewports) {
      for (const view of views) {
        const result = await measureView(browser, server.baseUrl, viewport, view, options);
        report.results.push(result);
        console.error(`[perf] ${viewport.name} ${view}: ${result.ok ? `renderers=${result.renderers} cpu p95=${result.cpuFrameMs?.p95} ms` : `FAILED ${result.error}`}${result.pageErrors.length ? ` (${result.pageErrors.length} page errors)` : ""}`);
      }
    }
    const outFile = path.resolve(root, options.out);
    await mkdir(path.dirname(outFile), { recursive: true });
    await writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`);
    console.log(formatReport(report));
    console.error(`[perf] wrote ${path.relative(root, outFile)}`);
    const failed = report.results.filter((r) => !r.ok || r.pageErrors.length);
    if (failed.length) {
      for (const r of failed) console.error(`[perf] ${r.viewport}/${r.view}: ${r.error ?? ""} ${r.pageErrors.join(" | ")}`);
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

await main();
