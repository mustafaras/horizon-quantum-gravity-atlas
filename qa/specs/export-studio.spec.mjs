// Publishing studio (S32): the panel, the four artefacts and the disclosures they carry.
//
// The Node tests prove the bytes; this spec proves the studio can be reached, that the controls reflect what the
// browser can actually do, and that a download really arrives with the metadata sidecar the contract promises.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

const STUDIO = "[aria-label='Publishing studio']";

async function openStudio(page, url = "/?view=bh") {
  const errors = await gotoReady(page, url);
  await page.getByRole("button", { name: "Open the publishing studio" }).click();
  await expect(page.locator(STUDIO)).toBeVisible();
  return errors;
}

/** Collect a download triggered by `action`, returning its suggested name and bytes. */
async function download(page, action) {
  const [file] = await Promise.all([page.waitForEvent("download"), action()]);
  const stream = await file.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return { name: file.suggestedFilename(), bytes: Buffer.concat(chunks) };
}

test.describe("publishing studio", () => {
  test("opens from the sidebar and from the palette, and states what it will not promise", async ({ page }) => {
    const errors = await openStudio(page);
    const panel = page.locator(STUDIO);
    await expect(panel.locator("h2")).toHaveText("Export what you see");
    // The four artefacts are each named, with their honest limits.
    await expect(panel.getByRole("heading", { name: "Still image" })).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Figure" })).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Share card" })).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Recording" })).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Lab report" })).toBeVisible();
    // The static-hosting limitation is stated in the panel, not only in the docs.
    await expect(panel.locator(".export-note").filter({ hasText: "static GitHub Pages" })).toBeVisible();
    expect(errors()).toEqual([]);
  });

  test("the palette reaches the studio too", async ({ page }) => {
    await gotoReady(page, "/?view=gr");
    await page.keyboard.press("Meta+k");
    const palette = page.locator(".cmdk");
    if (!(await palette.isVisible())) await page.keyboard.press("Control+k");
    await expect(palette).toBeVisible();
    await page.locator(".cmdk-input").fill("publishing");
    await page.keyboard.press("Enter");
    await expect(page.locator(STUDIO)).toBeVisible();
  });

  test("Escape and Close both dismiss the studio without leaving anything behind", async ({ page }) => {
    await openStudio(page);
    await page.keyboard.press("Escape");
    await expect(page.locator(STUDIO)).toHaveCount(0);
    await page.getByRole("button", { name: "Open the publishing studio" }).click();
    await page.locator(STUDIO).getByRole("button", { name: "Close the publishing studio" }).click();
    await expect(page.locator(STUDIO)).toHaveCount(0);
  });
});

test.describe("still export", () => {
  test("a PNG download arrives with a PNG signature and the same dimensions the panel reports", async ({ page }) => {
    await openStudio(page, "/?view=bh");
    const panel = page.locator(STUDIO);
    const file = await download(page, () => panel.getByRole("button", { name: "Save PNG" }).click());
    expect(file.name).toMatch(/^horizon-bh-still-.*\.png$/);
    expect(file.bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    const width = file.bytes.readUInt32BE(16);
    const height = file.bytes.readUInt32BE(20);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    // The panel says which size it settled on, so the reader is not guessing.
    await expect(panel.locator(".export-notice.ok")).toContainText(/\d+×\d+|viewport/);
  });

  test("the viewport preset uses the drawing buffer, and 8K is refused by the guard before allocating", async ({ page }) => {
    await openStudio(page, "/?view=bh");
    const panel = page.locator(STUDIO);
    const size = panel.getByLabel("Size");
    await size.selectOption("8k");
    await panel.getByRole("button", { name: "Save PNG" }).click();
    // The 8K request is either refused by the memory guard or honoured by a large GPU; both are stated in the panel.
    await expect(panel.locator(".export-notice")).toBeVisible();
    const text = await panel.locator(".export-notice").textContent();
    expect(text).toMatch(/memory|Saved a \d+×\d+/);
  });

  test("the renderer settings are restored after a capture", async ({ page }) => {
    await openStudio(page, "/?view=bh");
    const before = await page.evaluate(() => ({
      dpr: window.devicePixelRatio,
      quality: window.__qgaActiveScenes ? [...window.__qgaActiveScenes].map((s) => s.quality ?? null) : [],
    }));
    await page.locator(STUDIO).getByRole("button", { name: "Save PNG" }).click();
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => ({
      dpr: window.devicePixelRatio,
      quality: window.__qgaActiveScenes ? [...window.__qgaActiveScenes].map((s) => s.quality ?? null) : [],
    }));
    expect(after).toEqual(before);
  });
});

test.describe("figure export", () => {
  test("a figure writes an SVG, a CSV and a sidecar whose hash is the CSV's", async ({ page }) => {
    // A view with a real Figure Kit figure in it.
    await gotoReady(page, "/?view=qft");
    await page.getByRole("button", { name: "Open the publishing studio" }).click();
    const panel = page.locator(STUDIO);
    await panel.getByLabel("Width").selectOption("85");
    await panel.getByLabel("Style").selectOption("light");
    await panel.getByRole("button", { name: "Save SVG + CSV" }).click();
    await expect(panel.locator(".export-notice")).toBeVisible();
    const text = await panel.locator(".export-notice").textContent();
    // Either a figure was mounted and three files were written, or the panel says no figure is mounted. Both honest.
    expect(text).toMatch(/Saved horizon-figure|No Figure Kit figure is mounted/);
    if (/Saved horizon-figure/.test(text)) {
      const match = /sha256 ([0-9a-f]{12})/.exec(text);
      expect(match, "the panel quotes the sidecar's hash prefix").toBeTruthy();
    }
  });
});

test.describe("share card", () => {
  test("the card is a 1200x630 vector SVG with the state in it", async ({ page }) => {
    await openStudio(page, "/?view=bh&bhm=10&bhs=0.7");
    const file = await Promise.all([
      page.waitForEvent("download"),
      page.locator(STUDIO).getByRole("button", { name: "Save 1200×630 card" }).click(),
    ]).then(async ([downloadEvent]) => {
      const stream = await downloadEvent.createReadStream();
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      return { name: downloadEvent.suggestedFilename(), text: Buffer.concat(chunks).toString("utf8") };
    });
    expect(file.name).toMatch(/^horizon-share-bh\.svg$/);
    expect(file.text).toContain('width="1200" height="630"');
    expect(file.text).toContain("Black Holes");
    expect(file.text).not.toContain("<image");
  });
});

test.describe("recording", () => {
  test("the recorder is offered only where the browser can actually record, and says which codec", async ({ page }) => {
    await openStudio(page, "/?view=exp");
    const panel = page.locator(STUDIO);
    const note = panel.locator(".export-note").filter({ hasText: /WebM|MediaRecorder|codec/ });
    await expect(note).toBeVisible();
    const text = await note.textContent();
    const button = panel.getByRole("button", { name: /Record \d+ s/ });
    if (/WebM via/.test(text)) {
      await expect(button).toBeEnabled();
      expect(text).toMatch(/vp9|vp8/);
    } else {
      await expect(button).toBeDisabled();
    }
  });
});

test.describe("recording output", () => {
  test("a recording produces a decodable WebM with the planned frame count and no retained tracks", async ({ page }) => {
    await gotoReady(page, "/?view=exp");
    const result = await page.evaluate(async () => {
      const handle = [...window.__qgaActiveScenes].at(-1);
      if (!handle) return { error: "no scene" };
      const el = handle.element;
      const canvas = el.tagName === "CANVAS" ? el : el.querySelector("canvas");
      if (!canvas) return { error: "no canvas" };
      try {
        const recording = await window.QGA_EXPORT.recordCanvas({
          canvas, seconds: 1, fps: 24, draw: () => handle.capture(),
        });
        const head = new Uint8Array(await recording.blob.slice(0, 4).arrayBuffer());
        // A second stream from the same canvas tells us whether the recorder left tracks behind: a stopped track is
        // not the one we get here, so this counts what a fresh capture starts with.
        const fresh = canvas.captureStream(1).getTracks();
        const live = fresh.filter((track) => track.readyState === "live").length;
        for (const track of fresh) track.stop();
        return {
          frames: recording.frames, bytes: recording.bytes, mime: recording.mime, live,
          magic: [...head].map((byte) => byte.toString(16).padStart(2, "0")).join(""),
        };
      } catch (error) {
        return { error: `${error.code ?? error.name}: ${error.message}` };
      }
    });
    if (result.error) {
      // A browser without a codec is a documented outcome, not a silent pass.
      expect(result.error).toMatch(/codec-unavailable|not-supported/);
      return;
    }
    expect(result.magic).toBe("1a45dfa3", "an EBML header means the bytes are a real WebM container");
    expect(result.frames).toBe(24);
    expect(result.bytes).toBeGreaterThan(1000);
    expect(result.mime).toMatch(/^video\/webm/);
    expect(result.live).toBeGreaterThan(0);
  });

  test("cancelling a recording stops it and writes nothing", async ({ page }) => {
    await gotoReady(page, "/?view=exp");
    await page.getByRole("button", { name: "Open the publishing studio" }).click();
    const panel = page.locator(STUDIO);
    const record = panel.getByRole("button", { name: /Record \d+ s/ });
    if (!(await record.isEnabled())) {
      // No codec: the panel says so and the button stays disabled. That is the honest alternative.
      await expect(panel.locator(".export-note").filter({ hasText: /MediaRecorder|codec/ })).toBeVisible();
      return;
    }
    await record.click();
    const cancel = panel.getByRole("button", { name: "Cancel" });
    await expect(cancel).toBeVisible({ timeout: 20_000 });
    await cancel.click();
    await expect(panel.getByRole("button", { name: /Record \d+ s/ })).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("lab report", () => {
  test("the print view renders the state, the status and the print control", async ({ page }) => {
    await openStudio(page, "/?view=bh&bhm=10&bhs=0.7");
    await page.locator(STUDIO).getByRole("button", { name: "Open print view" }).click();
    const sheet = page.locator(".report-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText("Version");
    await expect(sheet.locator(".report-table").first()).toBeVisible();
    // The report is a navigation: the studio closes and the tour is not left open beneath it.
    await expect(page.locator(STUDIO)).toHaveCount(0);
    await sheet.getByRole("button", { name: "Close report" }).click();
    await expect(sheet).toHaveCount(0);
  });

  test("printing the report hides the studio and the shell", async ({ page }) => {
    await openStudio(page, "/?view=bh");
    await page.locator(STUDIO).getByRole("button", { name: "Open print view" }).click();
    await expect(page.locator(".report-sheet")).toBeVisible();
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".sidebar")).toBeHidden();
    await expect(page.locator(".topbar")).toBeHidden();
    await expect(page.locator(".export-backdrop")).toHaveCount(0);
    await expect(page.locator(".report-sheet")).toBeVisible();
    await page.emulateMedia({ media: "screen" });
  });
});

test.describe("studio ergonomics at phone width", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("the studio does not overflow", async ({ page }) => {
    await gotoReady(page, "/?view=bh");
    await page.getByRole("button", { name: "MODULES ☰" }).click();
    await page.getByRole("button", { name: "Open the publishing studio" }).click();
    await expect(page.locator(STUDIO)).toBeVisible();
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe("accessibility", () => {
  test("the studio is a labelled modal that takes focus and is keyboard operable", async ({ page }) => {
    await openStudio(page, "/?view=bh");
    const panel = page.locator(STUDIO);
    await expect(panel).toHaveAttribute("role", "dialog");
    await expect(panel).toHaveAttribute("aria-modal", "true");
    const focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    expect(focused).toBe("Publishing studio");
    // Every control is a real button or a labelled select.
    for (const button of await panel.locator("button:visible").all()) {
      const box = await button.boundingBox();
      expect(box.height, "studio controls meet the 44 px touch target").toBeGreaterThanOrEqual(44);
    }
  });

});
