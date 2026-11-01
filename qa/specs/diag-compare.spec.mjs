// Temporary diagnostic (S34): why does the compare view never go network-idle in Blueprint and Print?
// Runs only with QGA_DIAG=1. It records 25 s of requests and frame navigations and prints a summary; it asserts nothing.
import { test } from "playwright/test";

test.skip(!process.env.QGA_DIAG, "diagnostic only");
test.setTimeout(120_000);

const path = (url) => url.replace(/^https?:\/\/[^/]+/, "");

for (const theme of ["observatory", "blueprint", "print"]) {
  test(`compare traffic in ${theme}`, async ({ page, context }) => {
    await context.addInitScript(() => { sessionStorage.setItem("horizon-intro", "1"); });
    const requests = new Map();
    const navigations = [];
    const consoleErrors = [];
    const started = Date.now();
    const open = new Set();
    const timeline = [];
    page.on("request", (r) => { open.add(r); requests.set(path(r.url()), (requests.get(path(r.url())) ?? 0) + 1); });
    page.on("requestfinished", (r) => open.delete(r));
    page.on("requestfailed", (r) => open.delete(r));
    const sampler = setInterval(() => timeline.push(`${Date.now() - started}ms open=${open.size} total=${[...requests.values()].reduce((a, b) => a + b, 0)}`), 2500);
    page.on("framenavigated", (f) => navigations.push(`${Date.now() - started}ms ${f === page.mainFrame() ? "main" : "iframe"} ${path(f.url()).slice(0, 120)}`));
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 160)); });
    await page.goto(`/?view=compare&theme=${theme}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(25_000);
    clearInterval(sampler);
    const stillOpen = [...open].slice(0, 10).map((r) => `${r.resourceType()} ${path(r.url()).slice(0, 110)}`);
    const top = [...requests.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const info = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute("data-theme"),
      iframes: [...document.querySelectorAll("iframe")].map((f) => ({ src: f.getAttribute("src"), theme: (() => { try { return f.contentDocument.documentElement.getAttribute("data-theme"); } catch { return "blocked"; } })() })),
      stored: localStorage.getItem("qga-theme"),
    }));
    console.log(`DIAG ${theme} ${JSON.stringify({ timeline, stillOpen, requestsTotal: [...requests.values()].reduce((a, b) => a + b, 0), distinct: requests.size, top, navigationCount: navigations.length, navigations: navigations.slice(0, 14), consoleErrors: consoleErrors.slice(0, 5), info })}`);
  });
}
