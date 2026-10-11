import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--ignore-gpu-blocklist"] });
const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, reducedMotion: "reduce" });
await context.addInitScript(() => { window.QGA_RENDER_OPTIONS = { forceBackend: "webgl2", softwareClamp: false }; sessionStorage.setItem("horizon-intro", "1"); });
const page = await context.newPage();
const logs = [];
page.on("console", (m) => { if (m.type() === "error") logs.push("err: " + m.text().slice(0, 300)); });
page.on("pageerror", (e) => logs.push("pageerror: " + (e.stack || e.message).slice(0, 500)));
await page.goto("http://127.0.0.1:8790/?view=bh&bhm=1&bhs=0.9&seed=42", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".s3d-canvas", { timeout: 90000 });
await page.waitForTimeout(4000);
const stage = page.locator(".s3d-stage").first();
await stage.scrollIntoViewIfNeeded();
const box = await stage.boundingBox();
console.log("box", box);
for (const [fx, fy, label] of [[0.5, 0.5, "center"], [0.9, 0.2, "far"]]) {
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await page.waitForTimeout(800);
  const panel = await page.locator(".kerr-focus-panel h4").first().textContent().catch(() => "none");
  console.log(label, "->", panel, "| url", new URL(page.url()).search);
}
await page.getByRole("button", { name: "Higher-order image" }).click();
await page.waitForTimeout(800);
console.log("higher-order ->", await page.locator(".kerr-focus-panel h4").first().textContent(), await page.locator(".kerr-focus-values").innerText());
await page.screenshot({ path: "/tmp/kerr-interact.png" });
const status = await page.locator(".kerr-status").innerText();
console.log(status.replace(/\n/g, " | "));
console.log(logs.join("\n") || "no errors");
await browser.close();
