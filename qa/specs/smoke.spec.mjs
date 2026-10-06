// Smoke: every registered view mounts with zero console/page errors.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

const VIEWS = ["overview", "sm", "qft", "rg", "gr", "planck", "approaches", "bh", "exp", "glossary", "refs", "open"];

test.describe("view mounting", () => {
  for (const view of VIEWS) {
    test(`view "${view}" mounts cleanly`, async ({ page }) => {
      const errors = await gotoReady(page, `/?view=${view}`);
      await expect(page.locator("#root")).not.toBeEmpty();
      await expect(page).toHaveTitle(/HORIZON/);
      expect(errors(), `console/page errors on view "${view}"`).toEqual([]);
    });
  }
});
