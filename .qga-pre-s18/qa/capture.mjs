#!/usr/bin/env node
// qa/capture.mjs — reproducible screenshot capture driven by qa/manifest.json.
//
//   node qa/capture.mjs                 capture all into qa/output/ (inspection only)
//   node qa/capture.mjs --only=<id,...> capture a subset
//   node qa/capture.mjs --update        write qa/baselines/<id>.png (explicit baseline update)
//   node qa/capture.mjs --docs          also refresh the committed docs/screenshots/*.png
//
// Guarantees: server bound to 127.0.0.1 and verified to serve THIS worktree;
// deterministic seed/pathway/motion per capture; readiness probes only (no
// fixed sleeps); every capture reports its scientific status.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { loadManifest } from "./lib/manifest.mjs";
import { startServer } from "./lib/serve.mjs";
import { runReadiness } from "./lib/readiness.mjs";
import { installGwoscFixture } from "./fixtures/gwosc/install.mjs";
import { installDeterministicRandom } from "./lib/determinism.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

const MOTION_EMULATION = { reduced: "reduce", balanced: "no-preference", cinematic: "no-preference" };

async function captureOne(browser, baseUrl, capture, outFile) {
  const context = await browser.newContext({
    viewport: { width: capture.viewport.width, height: capture.viewport.height },
    deviceScaleFactor: capture.viewport.deviceScaleFactor,
    reducedMotion: MOTION_EMULATION[capture.motion] ?? "reduce",
    colorScheme: capture.colorScheme ?? "dark",
  });
  await installDeterministicRandom(context, capture.seed);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  try {
    if (capture.fixture === "gwosc-gw150914") await installGwoscFixture(page, "ok");
    await page.goto(`${baseUrl}/${capture.url}`, { waitUntil: "domcontentloaded", timeout: capture.timeoutMs });
    await runReadiness(page, capture.readiness, { timeoutMs: capture.timeoutMs, settleMs: capture.settleMs });

    let shot;
    if (capture.scope === "element") {
      const locator = page.locator(capture.target).first();
      await locator.scrollIntoViewIfNeeded({ timeout: capture.timeoutMs });
      await runReadiness(page, ["animation-settled"], { timeoutMs: capture.timeoutMs, settleMs: capture.settleMs });
      shot = await locator.screenshot({ timeout: capture.timeoutMs });
    } else {
      if (capture.target) {
        await page.locator(capture.target).first().scrollIntoViewIfNeeded({ timeout: capture.timeoutMs }).catch(() => {});
      }
      shot = await page.screenshot({ fullPage: capture.scope === "page", timeout: capture.timeoutMs });
    }
    await mkdir(path.dirname(outFile), { recursive: true });
    await writeFile(outFile, shot);
    return { id: capture.id, bytes: shot.length, consoleErrors };
  } finally {
    await context.close();
  }
}

async function main() {
  const { captures } = await loadManifest(root);
  const only = opt("only")?.split(",").map((s) => s.trim());
  const selected = only ? captures.filter((c) => only.includes(c.id)) : captures;
  if (only && selected.length !== only.length) {
    const found = new Set(selected.map((c) => c.id));
    const missing = only.filter((id) => !found.has(id));
    throw new Error(`unknown capture id(s): ${missing.join(", ")}`);
  }
  const update = flag("update");
  const docs = flag("docs");
  if (docs && !update) {
    console.warn("note: --docs refreshes committed documentation images; combine with --update for a full refresh");
  }

  const server = await startServer(root);
  console.log(`✓ serving this worktree at ${server.baseUrl} (verified byte-identical index.html)`);
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const capture of selected) {
      const outFile = update
        ? path.join(root, "qa/baselines", `${capture.id}.png`)
        : path.join(root, "qa/output", `${capture.id}.png`);
      const result = await captureOne(browser, server.baseUrl, capture, outFile);
      if (docs) {
        const docsFile = path.join(root, capture.file);
        const docShot = await captureOne(browser, server.baseUrl, capture, docsFile);
        result.docsBytes = docShot.bytes;
      }
      results.push({ ...result, file: path.relative(root, outFile), status: capture.scientificStatus });
      console.log(`  ✓ ${capture.id} [${capture.scientificStatus}] → ${path.relative(root, outFile)} (${result.bytes} B${result.consoleErrors.length ? `, ${result.consoleErrors.length} console error(s)!` : ""})`);
      for (const e of result.consoleErrors) console.warn(`      console: ${e}`);
    }
  } finally {
    await browser.close();
    await server.close();
  }

  const withErrors = results.filter((r) => r.consoleErrors.length);
  console.log(`\n${results.length} capture(s) written${update ? " to qa/baselines/" : " to qa/output/ (use --update to bless baselines)"}.`);
  if (withErrors.length) {
    console.error(`✗ ${withErrors.length} capture(s) had console/page errors — failing.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`✗ capture failed: ${err.message ?? err}`);
  process.exit(1);
});
