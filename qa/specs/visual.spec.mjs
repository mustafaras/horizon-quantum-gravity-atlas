// Visual regression: every manifest capture is compared against its committed
// baseline with the capture's own justified pixel tolerance.
// Baselines are refreshed exclusively via `npm run qa:update` (qa/capture.mjs --update).

import { test, expect } from "playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadManifest } from "../lib/manifest.mjs";
import { runReadiness } from "../lib/readiness.mjs";
import { installGwoscFixture } from "../fixtures/gwosc/install.mjs";
import { installDeterministicRandom } from "../lib/determinism.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { manifest, captures } = await loadManifest(root);

for (const capture of captures) {
  test(`capture ${capture.id}`, async ({ browser }) => {
    test.setTimeout(capture.timeoutMs + 30_000);
    const vp = capture.viewport ?? manifest.defaults.viewport;
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor ?? 1,
      reducedMotion: (capture.motion ?? manifest.defaults.motion) === "reduced" ? "reduce" : "no-preference",
      colorScheme: capture.colorScheme ?? "dark",
    });
    await installDeterministicRandom(context, capture.seed);
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    page.on("console", (msg) => { if (msg.type() === "error") pageErrors.push(msg.text()); });

    try {
      if (capture.fixture === "gwosc-gw150914") await installGwoscFixture(page, "ok");

      const baseUrl = process.env.QA_BASE_URL;
      if (!baseUrl) throw new Error("QA_BASE_URL was not published by global setup");
      await page.goto(`${baseUrl}/${capture.url}`, {
        waitUntil: "domcontentloaded",
        timeout: capture.timeoutMs,
      });
      await runReadiness(page, capture.readiness ?? manifest.defaults.readiness,
        { timeoutMs: capture.timeoutMs, settleMs: capture.settleMs });

      let png;
      if (capture.scope === "element") {
        const target = page.locator(capture.target).first();
        await target.scrollIntoViewIfNeeded({ timeout: capture.timeoutMs });
        await runReadiness(page, ["animation-settled"],
          { timeoutMs: capture.timeoutMs, settleMs: capture.settleMs });
        png = await target.screenshot({ timeout: capture.timeoutMs });
      } else if (capture.scope === "page") {
        png = await page.screenshot({ fullPage: true, timeout: capture.timeoutMs });
      } else {
        if (capture.target) {
          await page.locator(capture.target).first()
            .scrollIntoViewIfNeeded({ timeout: capture.timeoutMs });
        }
        png = await page.screenshot({ timeout: capture.timeoutMs });
      }

      expect(pageErrors, `console/page errors during capture ${capture.id}`).toEqual([]);
      expect(png).toMatchSnapshot(`${capture.id}.png`, {
        maxDiffPixelRatio: capture.baseline.maxDiffPixelRatio,
      });
    } finally {
      await context.close();
    }
  });
}
