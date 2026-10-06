// Live GWOSC smoke: the only spec that touches the real gwosc.org service.
// Skipped unless QGA_QA_LIVE=1 — run explicitly via `npm run qa:test:live`.
// Kept separate from the deterministic suite so CI never depends on an
// external network service.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.skip(!process.env.QGA_QA_LIVE, "live GWOSC smoke requires QGA_QA_LIVE=1");

test.describe("live GWOSC smoke", () => {
  test("real GW150914 strain loads from gwosc.org", async ({ page }) => {
    test.setTimeout(120000);
    await gotoReady(page, "/?view=exp&gwm=real&gwe=GW150914&gwd=H1&gws=1126259446&gwt=16", [
      "fonts", "view-mounted",
      { selector: ".gw-theatre", text: "GWOSC observation loaded" },
    ], { timeoutMs: 90000 });
    await expect(page.locator(".gw-theatre")).toContainText("GWOSC API v2");
  });
});
