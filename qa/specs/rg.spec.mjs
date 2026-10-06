// RG module: conjectural labeling, custom-preset transition, preset reset.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.describe("RG flow landscape", () => {
  test("asymptotic-safety preset is visibly labeled conjectural", async ({ page }) => {
    await gotoReady(page, "/?view=rg&rgp=asymptotic-safety");
    await expect(page.locator(".rg-landscape .badge-conjectural").first()).toBeVisible();
  });

  test("editing a control switches to Custom and Reset preset restores it", async ({ page }) => {
    await gotoReady(page, "/?view=rg&rgp=qcd");
    const pressed = page.locator(".rg-preset[aria-pressed='true']");
    await expect(pressed).toHaveCount(1);
    await expect(pressed).toContainText("QCD");

    const slider = page.locator(".rg-control-deck input[type='range']").first();
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    // Custom state: no documented preset remains selected.
    await expect(page.locator(".rg-preset[aria-pressed='true']")).toHaveCount(0);
    await expect(page).toHaveURL(/rgp=custom/);

    await page.getByRole("button", { name: "Reset preset" }).click();
    await expect(page.locator(".rg-preset[aria-pressed='true']")).toHaveCount(1);
    // qcd is the default preset, so the URL omits rgp entirely once restored.
    await expect(page).not.toHaveURL(/rgp=custom/);
    await expect.poll(() => slider.inputValue()).toBe("1.218");
  });
});
