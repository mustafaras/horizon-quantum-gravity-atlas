// Captures the screenshots used by docs/render/s04-visual-changes.md.
//
//   node scripts/docs/capture-s04-visuals.mjs [--out=docs/render/img/s04] [--webgpu] [--launch-arg=…]
//
// Serves this worktree with the QA static server and drives Chromium (WebGPU disabled as in CI unless --webgpu).
// Every shot uses ?seed=42, the QFT view and reduced motion (scenes settle on one frame, so a screenshot does not fight a software rasterizer). The static pair uses reduced motion so the scenes settle on one
// deterministic frame; their pixel difference is printed and written next to the images.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startServer } from "../../qa/lib/serve.mjs";
import { runReadiness } from "../../qa/lib/readiness.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const options = { out: "docs/render/img/s04", webgpu: false, launchArgs: [] };
for (const arg of process.argv.slice(2)) {
  const [flag, value] = arg.split(/=(.*)/s);
  if (flag === "--out") options.out = value;
  else if (flag === "--webgpu") options.webgpu = true;
  else if (flag === "--launch-arg") options.launchArgs.push(value);
  else throw new Error(`Unknown argument ${arg}`);
}
const outDir = path.resolve(root, options.out);
await mkdir(outDir, { recursive: true });

const server = await startServer(root);
const args = [...(options.webgpu ? [] : ["--disable-blink-features=WebGPU"]), ...options.launchArgs];
const browser = await chromium.launch({ args, ...(process.env.QGA_CHROMIUM_PATH ? { executablePath: process.env.QGA_CHROMIUM_PATH } : {}) });
const report = {};

async function open({ renderOptions, reducedMotion = true, viewport = { width: 1280, height: 800 } }) {
  const context = await browser.newContext({ viewport, colorScheme: "dark", reducedMotion: reducedMotion ? "reduce" : "no-preference" });
  await context.addInitScript((value) => {
    window.QGA_RENDER_OPTIONS = { softwareClamp: false, ...value };
    sessionStorage.setItem("horizon-intro", "1");
  }, renderOptions);
  const page = await context.newPage();
  await page.goto(`${server.baseUrl}/?view=qft&seed=42`, { waitUntil: "domcontentloaded" });
  await runReadiness(page, ["fonts", "network-idle", "view-mounted"], { timeoutMs: 90_000 });
  await page.waitForFunction(() => {
    const entries = window.QGA_RENDER.renderDiagnostics.snapshot();
    return entries.length >= 2 && entries.every((e) => e.phase === "ready" || e.phase === "suspended");
  }, null, { timeout: 120_000 });
  await page.waitForTimeout(2500);
  return { context, page };
}
async function shot(page, name) {
  const file = path.join(outDir, name);
  const bytes = await page.screenshot({ timeout: 180_000 });
  await writeFile(file, bytes);
  console.log(`[docs] wrote ${path.relative(root, file)}`);
  return bytes;
}
const stageStats = (page) => page.evaluate(() => QGA_RENDER.stageDiagnostics.snapshot().map((s) => ({ kind: s.kind, renderers: s.renderers, contextLimit: s.contextLimit, views: s.views.map((v) => ({ label: v.label.slice(0, 48), live: v.live, visible: v.visible, frames: v.frames })) })));

// 1 + 2: the same page, stage off and on (reduced motion: static). The backdrop starfield is unseeded
// (pre-existing Math.random in atlas-stage.jsx), so two loads never match pixel for pixel; a second stage-off
// load is the control that says how large the difference between two identical configurations already is.
const pair = {};
for (const [name, renderOptions] of [["off", { forceBackend: "webgl2" }], ["off-control", { forceBackend: "webgl2" }], ["on", { forceBackend: "webgl2", stage: "shared" }]]) {
  const { context, page } = await open({ renderOptions, reducedMotion: true });
  pair[name] = await shot(page, `qft-static-stage-${name}.png`);
  report[`static-${name}`] = { liveRenderers: await page.evaluate(() => QGA_RENDER.renderDiagnostics.liveRenderers()), stage: await stageStats(page) };
  await context.close();
}
{
  const { context, page } = await open({ renderOptions: {}, reducedMotion: true });
  const diff = (a, b) => page.evaluate(async ([x, y]) => {
    const load = async (bytes) => { const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: "image/png" })); const c = new OffscreenCanvas(bitmap.width, bitmap.height); const g = c.getContext("2d"); g.drawImage(bitmap, 0, 0); return g.getImageData(0, 0, bitmap.width, bitmap.height).data; };
    const [da, db] = [await load(x), await load(y)];
    let sum = 0, changed = 0;
    for (let i = 0; i < da.length; i += 4) { const d = (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])) / 3; sum += d; if (d > 8) changed++; }
    return { pixels: da.length / 4, meanAbsDiff: Number((sum / (da.length / 4)).toFixed(3)), changedShare: Number((changed / (da.length / 4)).toFixed(4)) };
  }, [[...a], [...b]]);
  report.staticDiff = { "off vs off-control": await diff(pair.off, pair["off-control"]), "off vs on": await diff(pair.off, pair.on) };
  console.log("[docs] static frame diffs:", JSON.stringify(report.staticDiff));
  await context.close();
}

// 3: animated, stage on, WebGL2 (a live frame)
{
  const { context, page } = await open({ renderOptions: { forceBackend: "webgl2", stage: "shared" } });
  await shot(page, "qft-shared-webgl2.png");
  report.sharedWebgl2 = { liveRenderers: await page.evaluate(() => QGA_RENDER.renderDiagnostics.liveRenderers()), stage: await stageStats(page) };
  await context.close();
}

// 4: context budget of 1: the backdrop gives its context to the scene, keeps its last frame as an image
{
  const { context, page } = await open({ renderOptions: { forceBackend: "webgl2", stage: "shared", maxContexts: 1 } });
  await shot(page, "qft-budget-1-snapshot-placeholder.png");
  const placeholders = await page.evaluate(() => [...document.querySelectorAll("img[data-qga-snapshot]")].map((img) => ({ w: img.naturalWidth, h: img.naturalHeight, parent: img.parentElement?.parentElement?.className || img.parentElement?.className || "" })));
  report.budget1 = { placeholders, stage: await stageStats(page), liveRenderers: await page.evaluate(() => QGA_RENDER.renderDiagnostics.liveRenderers()) };
  await context.close();
}

// 5: WebGPU, stage on: one renderer, a canvas target per scene
if (options.webgpu) {
  for (const [name, renderOptions, key] of [["off", { forceBackend: "webgpu" }, "webgpuOff"], ["shared", { forceBackend: "webgpu", stage: "shared" }, "sharedWebgpu"]]) {
    const { context, page } = await open({ renderOptions });
    await shot(page, name === "off" ? "qft-webgpu-stage-off.png" : "qft-shared-webgpu.png");
    report[key] = { liveRenderers: await page.evaluate(() => QGA_RENDER.renderDiagnostics.liveRenderers()), stage: await stageStats(page) };
    await context.close();
  }
}

// 6: Formula Core: one definition typeset with addressable terms
{
  const context = await browser.newContext({ viewport: { width: 980, height: 560 }, colorScheme: "dark", deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.route("**/__formula.html", (r) => r.fulfill({ contentType: "text/html", body: `<!doctype html><meta charset=utf-8><link rel=stylesheet href="/vendor/katex/katex.min.css"><script src="/vendor/katex/katex.min.js"></script>
<style>body{margin:0;padding:28px 32px;background:#0b1020;color:#e8ecf6;font:15px system-ui,sans-serif}h1{font-size:15px;font-weight:600;margin:0 0 4px;color:#9fb4ff}p{margin:0 0 18px;color:#9aa6c0}.row{display:grid;grid-template-columns:230px 1fr;gap:12px;align-items:center;padding:10px 0;border-top:1px solid #1d2742}.name{color:#9aa6c0;font-size:13px}.row .katex{font-size:1.35em}[data-term]{outline:1.5px dashed #5b8cff;outline-offset:3px;border-radius:3px}</style>
<h1>Formula Core: typeset with addressable terms</h1><p>Each outlined span is a <code>data-term</code> element produced by <code>\\htmlData</code>; scenes use the same term ids to highlight a term on the GPU.</p><div id=rows></div>` }));
  await page.goto(`${server.baseUrl}/__formula.html`);
  const info = await page.evaluate(async () => {
    const { library } = await import("/js/formula/library/index.mjs");
    const { KATEX_OPTIONS } = await import("/js/formula/to-tex.mjs");
    const rows = document.getElementById("rows");
    const out = [];
    for (const key of ["schwarzschildRadius", "hawkingTemperature", "kerrOuterHorizon", "chirpMass", "casimirPressure", "lorentzGamma"]) {
      const f = library[key];
      const row = document.createElement("div"); row.className = "row";
      const name = document.createElement("div"); name.className = "name"; name.textContent = f.title;
      const eq = document.createElement("div");
      window.katex.render(`${f.output.tex} = ${f.tex}`, eq, { ...KATEX_OPTIONS, throwOnError: false });
      row.append(name, eq); rows.append(row);
      out.push({ id: f.id, terms: f.termIds, rendered: [...eq.querySelectorAll("[data-term]")].map((n) => n.getAttribute("data-term")) });
    }
    return out;
  });
  report.formulas = info;
  await shot(page, "formula-core-terms.png");
  await context.close();
}

await writeFile(path.join(outDir, "report.json"), JSON.stringify(report, null, 2) + "\n");
await browser.close();
await server.close();
