#!/usr/bin/env node
/**
 * Render each chapter's signature image from its own science (S29).
 *
 *   node scripts/render-covers.mjs              render every cover
 *   node scripts/render-covers.mjs --only=planck
 *
 * Each cover is a real screenshot of the module's signature figure at a fixed seed and viewport, not a stock image.
 * A provenance sidecar records the state, the seed and the commit that produced it, so a cover can be traced back to
 * the code that drew it.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startServer } from "../qa/lib/serve.mjs";
import { runReadiness } from "../qa/lib/readiness.mjs";
import { installDeterministicRandom } from "../qa/lib/determinism.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith("--only="))?.split("=")[1]?.split(",");

/**
 * The eight chapters, each with the figure that carries its argument.
 *
 * `target` is a selector inside the module; the cover frames that element rather than the whole page, so what the
 * reader sees on the chapter header is the same object the chapter computes.
 */
// Each target is a FIGURE the chapter actually renders, verified against the running page. The plan named eight
// signature scenes; where a chapter's named scene is a WebGL panel that the cover cannot frame in 16:6 (the Penrose
// atlas is 1000x1261, the gravity-flow silk 2010 px tall) the cover frames the chapter's Figure Kit plot instead, and
// the ledger records which one and why.
// A cover is a 16:6 band. Every target below was measured in the running page, and each is the chapter's most
// landscape figure: the vertical WebGL panels (the Penrose atlas at 1000x1216, the gravity-flow silk at 2010 px tall)
// cannot fill a 16:6 band without being cropped to a strip, so the chapters whose signature scene is one of those are
// covered by their widest Figure Kit plot instead. The ledger records the substitution per chapter.
const COVERS = [
  { id: "standard-model", view: "sm", target: ".fig[data-figure=\"sm-neutrino-flavour\"]", label: "PMNS flavour oscillation" },
  { id: "qft", view: "qft", target: '.fig[data-figure="qft-dispersion"]', label: "lattice dispersion relation" },
  { id: "rg", view: "rg", target: '.fig[data-figure="rg-gravity-flow-trajectory"]', label: "gravity-flow trajectory" },
  { id: "gr", view: "gr", target: '.fig[data-figure="gr-effective-potential"]', label: "the effective potential of a geodesic" },
  { id: "planck", view: "planck", target: ".planck-spectra-grid", label: "the discrete area and volume spectra of loop quantum gravity" },
  { id: "approaches", view: "approaches", target: '.fig[data-figure="approaches-string-spectrum"]', label: "the string mass spectrum" },
  { id: "blackholes", view: "bh", target: '.fig[data-figure="bh-page-curve"]', label: "the Page curve" },
  { id: "experiments", view: "exp", target: '.fig[data-figure="gw-strain-generated"]', label: "the GW150914 strain" },
];

/** The two sizes the header uses: 2400x900 on desktop (16:6) and 1200x450 for the phone thumbnail. */
const SIZES = Object.freeze([
  { width: 2400, height: 900, suffix: "" },
  { width: 1200, height: 450, suffix: "-sm" },
]);

const commit = (() => {
  try { return execSync("git rev-parse HEAD", { cwd: root, encoding: "utf8" }).trim(); }
  catch { return "unknown"; }
})();

const server = await startServer(root);
console.log(`✓ serving ${server.baseUrl}`);
const browser = await chromium.launch();
await mkdir(path.join(root, "docs/covers"), { recursive: true });
const written = [];

try {
  for (const cover of COVERS) {
    if (only && !only.includes(cover.id)) continue;
    const context = await browser.newContext({ viewport: { width: 2400, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: "dark" });
    await installDeterministicRandom(context, 42);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    try {
      await page.goto(`${server.baseUrl}/?view=${cover.view}&seed=42`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await runReadiness(page, ["fonts", "network-idle", "view-mounted"], { timeoutMs: 45000 });
      // The first matching selector wins; a chapter whose signature figure is not on screen falls back to the article
      // so the cover is never a blank frame.
      const candidates = cover.target.split(",").map((s) => s.trim());
      let element = null;
      for (const selector of candidates) {
        const locator = page.locator(selector).first();
        if (await locator.count()) { element = locator; break; }
      }
      // A cover must frame a figure. There is no article fallback: a screenshot of the whole page would show the
      // navigation rail and the empty background, which is exactly what the hero band must not be. A missing target
      // is an error the build has to fix, not something to paper over.
      if (!element) throw new Error(`${cover.id}: none of the target selectors matched (${cover.target})`);
      for (const size of SIZES) {
        // The viewport is set FIRST: a clip rectangle is in the coordinate system of the viewport it is captured in,
        // so measuring the element at 2400x900 and then capturing at 1200x450 clips the wrong region.
        await page.setViewportSize({ width: size.width, height: size.height });
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(900);
        const box = await element.boundingBox();
        if (!box || box.width < 80 || box.height < 60) {
          throw new Error(`${cover.id}: target ${cover.target} measured ${Math.round(box?.width ?? 0)}x${Math.round(box?.height ?? 0)}`);
        }
        // The hero band is ~998 CSS px wide on a desktop. A narrower source would be upscaled on every visit, so a
        // narrow target is a build error with the figure named, not a blurry cover shipped silently.
        if (size.width === 2400 && box.width < 900) {
          throw new Error(`${cover.id}: target ${cover.target} is only ${Math.round(box.width)} px wide; a cover must not be upscaled`);
        }
        // Fit the element into the cover's aspect without distorting it: keep the figure's own aspect and let the
        // renderer scale it. A figure taller than 16:6 is cropped from its top, where a figure's own title sits.
        const clip = {
          x: Math.max(0, Math.min(box.x, size.width - 1)),
          y: Math.max(0, Math.min(box.y, size.height - 1)),
          width: Math.max(1, Math.min(box.width, size.width - Math.max(0, box.x))),
          height: Math.max(1, Math.min(box.height, size.height - Math.max(0, box.y))),
        };
        const file = path.join(root, "docs/covers", `${cover.id}${size.suffix}.png`);
        await page.screenshot({ path: file, type: "png", clip });
        written.push({ ...cover, ...size, file: path.relative(root, file), clipped: true, box: { width: Math.round(clip.width), height: Math.round(clip.height) } });
        console.log(`  ✓ ${cover.id}${size.suffix} → ${path.relative(root, file)} (${Math.round(clip.width)}x${Math.round(clip.height)})`);
      }
      await writeFile(
        path.join(root, "docs/covers", `${cover.id}.json`),
        JSON.stringify({
          id: cover.id, label: cover.label, view: cover.view, seed: 42,
          url: `?view=${cover.view}&seed=42`, target: cover.target,
          sizes: SIZES.map((s) => ({ width: s.width, height: s.height, file: `${cover.id}${s.suffix}.png` })),
          renderedAt: new Date().toISOString(), commit,
          status: "screenshot of the module's own computed figure",
        }, null, 2) + "\n",
      );
      if (errors.length) console.warn(`      ${errors.length} page error(s): ${errors[0]}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}

console.log(`\n${written.length} cover file(s) written to docs/covers/.`);
