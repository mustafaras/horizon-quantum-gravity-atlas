// Shared spec helpers: console/page-error collection and readiness-driven
// navigation (no fixed sleeps anywhere in the suite).

import { runReadiness } from "../lib/readiness.mjs";

export const DEFAULT_READINESS = ["fonts", "network-idle", "view-mounted", "animation-settled"];

/**
 * Navigate and wait for measurable readiness. Returns a function that lists
 * the console errors and page errors observed since navigation.
 */
export async function gotoReady(page, url, readiness = DEFAULT_READINESS, opts = {}) {
  const errors = [];
  const onConsole = (msg) => { if (msg.type() === "error") errors.push(msg.text()); };
  const onPageError = (err) => errors.push(err.stack || String(err));
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  // Requests in flight, by URL, so a network-idle timeout can say what kept the page busy (qa/lib/readiness.mjs).
  // Tracked as request objects, not URLs: the same URL is loaded by the page and by each embedded copy of it, and one of
  // them finishing must not hide another still open.
  const inflight = new Set();
  const opened = (request) => inflight.add(request);
  const closed = (request) => inflight.delete(request);
  page.__qgaInflightUrls = () => [...inflight].map((r) => `${r.resourceType()} ${r.url().replace(/^https?:\/\/[^/]+/, "")}`);
  page.on("request", opened);
  page.on("requestfinished", closed);
  page.on("requestfailed", closed);
  page.__qgaInflight = inflight;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: opts.timeoutMs ?? 45_000 });
    await runReadiness(page, readiness, { timeoutMs: opts.timeoutMs ?? 45_000, settleMs: opts.settleMs ?? 12_000 });
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("request", opened);
    page.off("requestfinished", closed);
    page.off("requestfailed", closed);
  }
  return () => errors;
}
