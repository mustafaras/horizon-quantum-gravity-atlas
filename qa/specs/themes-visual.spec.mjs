// Blueprint and Print, module by module (S34).
//
//   QGA_THEME_SHOTS=evidence   writes one viewport PNG per theme and module to qa/output/themes/ (what the page looks like)
//                              and one PNG of the module's first figure, for a person to read
//   QGA_THEME_SHOTS=compare    compares the first figure of each module with its committed baseline
//   unset                      skipped, like the other visual specs: the baselines come from the CI platform (Linux,
//                              pinned Chromium), so they are compared there and not on a developer's machine
//
// A baseline is never refreshed to make a test pass: it is regenerated with `--update-snapshots` in a run whose
// evidence images were looked at first, and the ledger carries a one-line reason for each update.

import fs from "node:fs";
import path from "node:path";
import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

const MODE = process.env.QGA_THEME_SHOTS || "";
const THEMES = ["blueprint", "print"];
const MODULES = ["overview", "sm", "qft", "rg", "gr", "planck", "approaches", "bh", "exp"];
const OUT = path.join(process.cwd(), "qa", "output", "themes");
const MAX_DIFF_RATIO = 0.01;

test.skip(!MODE, "set QGA_THEME_SHOTS=evidence or compare");
test.use({ viewport: { width: 1280, height: 900 } });
test.setTimeout(180_000);

for (const theme of THEMES) {
  for (const view of MODULES) {
    test(`${theme} · ${view}`, async ({ page, context }) => {
      await context.addInitScript(() => {
        window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2" };
        sessionStorage.setItem("horizon-intro", "1");
      });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await gotoReady(page, `/?view=${view}&theme=${theme}&seed=42`);
      expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe(theme);

      const figure = page.locator(".fig[data-figure]").first();
      const hasFigure = (await figure.count()) > 0;
      if (hasFigure) await figure.scrollIntoViewIfNeeded();

      if (MODE === "evidence") {
        fs.mkdirSync(OUT, { recursive: true });
        await page.screenshot({ path: path.join(OUT, `${theme}-${view}-page.png`) });
        if (hasFigure) await figure.screenshot({ path: path.join(OUT, `${theme}-${view}-figure.png`) });
        fs.appendFileSync(path.join(OUT, "index.txt"), `${theme}\t${view}\tfigure=${hasFigure}\terrors=${errors.length}\n`);
      } else if (hasFigure) {
        await expect(figure).toHaveScreenshot(`theme-${theme}-${view}.png`, { maxDiffPixelRatio: MAX_DIFF_RATIO, animations: "disabled" });
      }
      expect(errors).toEqual([]);
    });
  }
}
