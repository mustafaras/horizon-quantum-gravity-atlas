// Prompt 06 — gravitational-wave spacetime instrument + sonification.
// Proves: audio is gesture-gated (zero AudioContexts before the click), the
// visible lattice cursor and the AudioContext clock agree within the 50 ms
// contract while playing, generated signals stay labeled as generated, and
// leaving the view disposes the sonifier (context closed, runtime cleared).
// No test here touches the live gwosc.org service; the theatre's own
// deterministic generated mode is the fixture.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

async function instrumentPage(context) {
  await context.addInitScript(() => {
    sessionStorage.setItem("horizon-intro", "1");
    window.__audio = { created: 0, closed: 0 };
    const Real = window.AudioContext || window.webkitAudioContext;
    class Tracked extends Real {
      constructor(...a) { super(...a); window.__audio.created += 1; }
      close() { window.__audio.closed += 1; return super.close(); }
    }
    window.AudioContext = Tracked;
    window.webkitAudioContext = Tracked;
  });
}

async function waitForInstrument(page) {
  await page.locator(".gw-instrument-figure").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => window.__qgaGwRuntime, null, { timeout: 20_000 });
}

test.describe("GW spacetime instrument", () => {
  test("audio is gesture-gated: zero contexts until Enable audio, one after", async ({ page, context }) => {
    test.setTimeout(120_000);
    await instrumentPage(context);
    const errors = await gotoReady(page, "/?view=exp", [
      "fonts", "network-idle", "view-mounted",
      { selector: ".gw-theatre" },
    ]);
    await waitForInstrument(page);
    expect(await page.evaluate(() => window.__audio.created)).toBe(0);
    await page.locator(".gw-audio-enable").click();
    await expect.poll(() => page.evaluate(() => window.__qgaGwRuntime?.audioEnabled),
      { timeout: 10_000 }).toBe(true);
    expect(await page.evaluate(() => window.__audio.created)).toBe(1);
    expect(errors()).toEqual([]);
  });

  test("lattice cursor and audio clock agree within 50 ms while playing", async ({ page, context }) => {
    test.setTimeout(120_000);
    await instrumentPage(context);
    const errors = await gotoReady(page, "/?view=exp", [
      "fonts", "network-idle", "view-mounted",
      { selector: ".gw-theatre" },
    ]);
    await waitForInstrument(page);
    // Loop first, and wait until the commit lands, so the Enable handler's
    // closure sees gwLoop=true and the sonifier's source.loop is set before
    // playback starts — a clip that loops can never end mid-measurement.
    const loopBtn = page.getByRole("button", { name: "Loop" });
    await loopBtn.click();
    await expect(loopBtn).toHaveAttribute("aria-pressed", "true");
    await page.locator(".gw-audio-enable").click();
    await expect.poll(() => page.evaluate(() => window.__qgaGwRuntime?.audioEnabled),
      { timeout: 10_000 }).toBe(true);
    await page.getByRole("button", { name: "Replay from the start" }).click();
    // Bring the lattice back into view: its rAF publish pauses when culled,
    // and the drift measurement must observe rendered lattice frames.
    await page.locator(".gw-instrument-figure").scrollIntoViewIfNeeded();
    // Wait for the audio clock to actually be running, then sample tightly.
    await expect.poll(() => page.evaluate(() => window.__qgaGwRuntime?.audioPlaying === true),
      { timeout: 10_000 }).toBe(true);
    let maxDrift = 0;
    let samples = 0;
    for (let i = 0; i < 25; i++) {
      await page.waitForTimeout(40); // poll cadence, not a readiness sleep
      const d = await page.evaluate(() => {
        const r = window.__qgaGwRuntime;
        if (!r || !r.audioPlaying || r.audioPosition == null) return null;
        return Math.abs(r.timelineTime - r.audioPosition);
      });
      if (d != null) { maxDrift = Math.max(maxDrift, d); samples += 1; }
    }
    expect(samples, "expected ≥4 frames with the audio clock running").toBeGreaterThanOrEqual(4);
    expect(maxDrift).toBeLessThanOrEqual(0.05);
    expect(errors()).toEqual([]);
  });

  test("generated signal stays labeled generated and the lattice publishes", async ({ page, context }) => {
    test.setTimeout(120_000);
    await context.addInitScript(() => sessionStorage.setItem("horizon-intro", "1"));
    const errors = await gotoReady(page, "/?view=exp", [
      "fonts", "network-idle", "view-mounted",
      { selector: ".gw-theatre" },
    ]);
    await waitForInstrument(page);
    const figure = page.locator(".gw-instrument-figure");
    await expect(figure).toContainText("SPACETIME INSTRUMENT");
    await expect(figure).toContainText("GENERATED · SEEDED");
    const runtime = await page.evaluate(() => window.__qgaGwRuntime);
    expect(["webgl2", "webgpu", "tsl"]).toContain(runtime.kind);
    expect(runtime.particles).toBeGreaterThan(1000);
    expect(runtime.rows).toBe(2); // H1 + L1 split layout for generated mode
    expect(runtime.audioPosition).toBeNull(); // no audio, no clock claim
    // Export metadata must carry the live runtime and never claim audio played.
    const meta = await page.evaluate(() => window.QGA_GW.INSTRUMENT.gwInstrumentExportMetadata(
      { gwMode: "generated", gwDetector: "H1", gwEvent: "GW150914", gwStart: 1126259446,
        gwDuration: 16, seed: 42, gwM1: 36, gwM2: 29,
        gwAudioMode: "original", gwPitch: 1, gwVolume: 0.7, gwLoop: false },
      window.__qgaGwRuntime,
    ));
    expect(meta.gwInstrument.view).toBe("exp-gw-spacetime-instrument");
    expect(meta.gwInstrument.source.seed).toBe(42);
    expect(meta.gwInstrument.audio.enabled).toBe(false);
    expect(meta.gwInstrument.runtime.particles).toBeGreaterThan(1000);
    expect(meta.gwInstrument.provenance.status).toBeTruthy();
    expect(errors()).toEqual([]);
  });

  test("navigating away disposes the sonifier and clears the runtime", async ({ page, context }) => {
    test.setTimeout(120_000);
    await instrumentPage(context);
    await gotoReady(page, "/?view=exp", [
      "fonts", "network-idle", "view-mounted",
      { selector: ".gw-theatre" },
    ]);
    await waitForInstrument(page);
    await page.locator(".gw-audio-enable").click();
    await expect.poll(() => page.evaluate(() => window.__audio.created),
      { timeout: 10_000 }).toBe(1);
    // SPA navigation unmounts the theatre; cleanup must dispose the sonifier.
    await page.getByRole("button", { name: /Atlas overview/ }).click();
    await expect.poll(() => page.evaluate(() => window.__audio.closed),
      { timeout: 10_000 }).toBe(1);
    await page.waitForFunction(() => window.__qgaGwRuntime === undefined, null, { timeout: 10_000 });
  });
});
