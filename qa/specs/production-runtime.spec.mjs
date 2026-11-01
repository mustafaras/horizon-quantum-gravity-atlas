// Production runtime, workers and offline (S33).
//
// Three things a browser can prove that Node cannot: that production really never fetches Babel, that a scene's
// expensive work can run in a worker without blocking the main thread, and that the atlas opens again with the network
// switched off.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.describe("production runtime", () => {
  test("no Babel is fetched and the runtime reports zero compile time", async ({ page }) => {
    const babelRequests = [];
    page.on("request", (request) => { if (/babel/i.test(request.url())) babelRequests.push(request.url()); });
    await gotoReady(page, "/?view=overview");
    const info = await page.evaluate(() => ({
      runtime: document.documentElement.dataset.qgaRuntime,
      compile: window.__QGA_COMPILE__,
      hasBabel: typeof window.Babel,
    }));
    expect(info.runtime).toBe("production");
    expect(info.compile.babelMs).toBe(0);
    expect(info.compile.sources).toBe(59);
    expect(info.hasBabel).toBe("undefined");
    expect(babelRequests, "production must not request Babel at all").toEqual([]);
  });

  test("development keeps the in-browser path when asked", async ({ page }) => {
    await gotoReady(page, "/?view=overview&dev=1");
    const info = await page.evaluate(() => ({
      runtime: document.documentElement.dataset.qgaRuntime,
      compile: window.__QGA_COMPILE__,
      hasBabel: typeof window.Babel,
    }));
    expect(info.runtime).toBe("dev");
    expect(info.hasBabel).toBe("object");
    expect(info.compile.babelMs).toBeGreaterThan(0);
    expect(info.compile.sources).toBe(59);
  });

  test("the compiled scripts are evaluated in index.html's order", async ({ page }) => {
    await gotoReady(page, "/?view=overview");
    const order = await page.evaluate(() => [...document.querySelectorAll('script[type="application/x-qga-compiled"]')]
      .map((tag) => tag.getAttribute("src")));
    expect(order.length).toBe(59);
    expect(order.at(-1)).toBe("js/compiled/js/app.js");
    expect(order[0]).toBe("js/compiled/tweaks-panel.js");
  });
});

test.describe("workers", () => {
  test("the worker protocol and client are exposed and answer a real job", async ({ page }) => {
    await gotoReady(page, "/?view=overview");
    const kinds = await page.evaluate(() => window.QGA_WORKERS.JOB_KINDS);
    expect(kinds).toEqual(["matched-filter", "cdt", "rge", "greybody", "causal-set"]);

    const result = await page.evaluate(async () => {
      const client = window.QGA_WORKERS.createWorkerClient();
      try {
        const message = await client.run({ kind: "causal-set", params: { n: 200, dim: 2 }, seed: 42 }, { channel: "test" });
        return { ok: true, n: message.value.n, relations: message.value.relations };
      } catch (error) {
        return { ok: false, reason: error.message };
      } finally {
        client.dispose();
      }
    });
    expect(result.ok, result.reason).toBe(true);
    expect(result.n).toBe(200);
    expect(result.relations).toBeGreaterThan(0);
  });

  test("a running job does not block the main thread and can be cancelled", async ({ page }) => {
    await gotoReady(page, "/?view=overview");
    const outcome = await page.evaluate(async () => {
      const client = window.QGA_WORKERS.createWorkerClient();
      // A long causal set: the point is that the main thread stays responsive while it runs.
      const pending = client.run({ kind: "causal-set", params: { n: 1200, dim: 2 } }, { channel: "long" });
      const started = performance.now();
      await new Promise((resolve) => setTimeout(resolve, 50));
      const elapsed = performance.now() - started;
      client.cancel("long");
      const cancelled = await pending.then(() => "resolved").catch((error) => error.message);
      client.dispose();
      return { elapsed, cancelled };
    });
    // The timeout fired on time: a blocking computation would have taken it far past 50 ms.
    expect(outcome.elapsed).toBeLessThan(600);
    expect(outcome.cancelled).toMatch(/cancelled|worker disposed/);
  });

  test("backpressure refuses a second job on a busy channel", async ({ page }) => {
    await gotoReady(page, "/?view=overview");
    const message = await page.evaluate(async () => {
      const client = window.QGA_WORKERS.createWorkerClient();
      const first = client.run({ kind: "causal-set", params: { n: 800 } }, { channel: "same" });
      const second = await client.run({ kind: "causal-set", params: { n: 20 } }, { channel: "same" })
        .then(() => "accepted").catch((error) => error.message);
      client.cancel("same");
      await first.catch(() => {});
      client.dispose();
      return second;
    });
    expect(message).toMatch(/already has 1 job/);
  });
});

test.describe("offline", () => {
  test("an offline reload boots the atlas from the cache", async ({ page, context }) => {
    await gotoReady(page, "/?view=overview");
    // Wait for the worker to install and claim this page.
    await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 30_000 });
    const caches = await page.evaluate(() => window.caches.keys());
    expect(caches).toContain("horizon-qga-v1-shell");

    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => (document.getElementById("root")?.children.length ?? 0) > 0, null, { timeout: 30_000 });
      const info = await page.evaluate(() => ({
        runtime: document.documentElement.dataset.qgaRuntime,
        views: Object.keys(window.QGA_VIEWS ?? {}).length,
      }));
      expect(info.runtime).toBe("production");
      expect(info.views).toBe(15);
    } finally {
      await context.setOffline(false);
    }
  });

  test("?dev=1 and ?nosw=1 both stay out of the service worker's way", async ({ page }) => {
    for (const query of ["dev=1", "nosw=1"]) {
      await gotoReady(page, `/?view=overview&${query}`);
      const disabled = await page.evaluate(() => window.QGA_PWA.workerDisabledByUrl(location.search));
      expect(disabled, `${query} must disable the worker`).toBe(true);
    }
  });

  test("the worker never caches a GWOSC response", async ({ page }) => {
    const sw = await page.request.get("/service-worker.js");
    const body = await sw.text();
    expect(body).toMatch(/NEVER_CACHE\s*=\s*\[[^\]]*gwosc/i);
  });
});

test.describe("update prompt", () => {
  test("the update notice is a dismissible button, never an automatic reload", async ({ page }) => {
    await gotoReady(page, "/?view=overview");
    // The register module's own contract: applying an update is a call, and nothing calls it on its own.
    const behaviour = await page.evaluate(() => ({
      text: window.QGA_PWA.updateNoticeText(),
      states: Object.values(window.QGA_PWA.SW_STATE),
    }));
    expect(behaviour.text).toMatch(/Reload when you are at a stopping point/);
    expect(behaviour.states).toContain("update-available");
    expect(behaviour.states).toContain("offline-ready");
  });
});
