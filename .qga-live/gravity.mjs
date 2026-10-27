import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 180)); });
page.on("pageerror", (e) => errors.push(String(e).slice(0, 220)));
await page.goto("https://mustafaras.github.io/horizon-quantum-gravity-atlas/?view=rg&seed=42", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".rgf-lab", { timeout: 90000 });
await page.locator(".rgf-lab").scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "Einstein–Hilbert (S18)" }).click();
await page.waitForTimeout(9000);
console.log(JSON.stringify(await page.evaluate(() => ({
  flow3d: window.__qgaRgFlow3d ?? null,
  chip: document.querySelector(".rgf-lab .prov-chip")?.textContent.trim() ?? null,
  chipId: document.querySelector(".rgf-lab .prov-chip")?.dataset.provenanceId ?? null,
  labels: [...document.querySelectorAll(".rgf-lab .s3d-label")].map((e) => e.textContent.trim().slice(0, 40)),
})), null, 1));
console.log("errors", JSON.stringify(errors.slice(0, 6)));
await page.locator(".rgf-lab .s3d-stage").screenshot({ path: "/tmp/live-gravity-3d.png" });
await browser.close();
