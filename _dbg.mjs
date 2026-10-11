import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", colorScheme: "dark" });
await context.addInitScript((s) => { let state = s>>>0||1; Math.random = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; }; }, 42);
await context.addInitScript(() => { window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2", softwareClamp: false }; sessionStorage.setItem("horizon-intro", "1"); });
const page = await context.newPage();
await page.goto("http://127.0.0.1:8790/?view=bh&bhm=1&bhs=0&seed=42", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(3000);
  console.log(i, JSON.stringify(await page.evaluate(() => ({ prm: matchMedia("(prefers-reduced-motion: reduce)").matches, rt: window.__qgaKerrRuntime && { b: window.__qgaKerrRuntime.budget?.temporalSamples, f: window.__qgaKerrRuntime.frames, c: window.__qgaKerrRuntime.converged, r: window.__qgaKerrRuntime.resets, rm: window.__qgaKerrRuntime.reducedMotion } }))));
}
await browser.close();
