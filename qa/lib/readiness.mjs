// Measurable readiness probes for captures and browser tests.
// The Stage-4 spec forbids fixed-duration sleeps: every probe terminates on an
// observable predicate (a resolved promise, a selector state, a quiet rAF window).

const PROBE_NAMES = ["fonts", "network-idle", "view-mounted", "canvas-nonblank", "animation-settled"];

async function probeFonts(page, timeout) {
  await page.waitForFunction(() => document.fonts.status === "loaded", null, { timeout });
}

async function probeNetworkIdle(page, timeout) {
  await page.waitForLoadState("networkidle", { timeout });
}

async function probeViewMounted(page, timeout) {
  await page.waitForFunction(() => {
    const root = document.getElementById("root");
    if (!root || root.children.length === 0 || !root.querySelector("section, header, canvas, svg")) {
      return false;
    }

    const intro = document.querySelector(".horizon-intro");
    if (!intro) return true;
    const style = getComputedStyle(intro);
    return style.visibility === "hidden"
      || style.display === "none"
      || Number(style.opacity) === 0
      || style.pointerEvents === "none";
  }, null, { timeout });
}

// Heuristic, documented: a blank canvas compresses to a tiny PNG; a rendered
// scene does not. We screenshot every visible canvas and require at least one
// above the threshold. This is a readiness gate, not a correctness check.
const CANVAS_MIN_PNG_BYTES = 8 * 1024;

async function probeCanvasNonblank(page, timeout) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const handles = await page.$$("canvas");
    for (const handle of handles) {
      const box = await handle.boundingBox();
      if (!box || box.width < 2 || box.height < 2) continue;
      const png = await handle.screenshot();
      if (png.length > CANVAS_MIN_PNG_BYTES) return;
    }
    if (Date.now() > deadline) {
      throw new Error(`canvas-nonblank: no canvas exceeded ${CANVAS_MIN_PNG_BYTES} PNG bytes within ${timeout} ms`);
    }
    await page.waitForTimeout(100); // poll cadence, not a readiness sleep
  }
}

async function probeAnimationSettled(page, timeout, settleMs) {
  // A predicate that returns a Promise is not awaited by `waitForFunction`: it is treated as truthy, so the probe
  // would silently pass. It is also fragile — a page whose rAF loop is busy can make the inner promise never settle
  // while the outer poll keeps re-arming. The predicate below is synchronous and self-contained: it counts frames
  // into a page-level counter that `evaluate` then reads, so every wait terminates on an observable value.
  await page.evaluate(() => {
    window.__qgaSettle = { frames: 0, blocked: null };
    const tick = () => {
      const hit = document.querySelector(".settling, .animating, [data-animating]");
      if (hit) window.__qgaSettle.blocked = hit.className || hit.className === "" ? hit.tagName : hit.className;
      window.__qgaSettle.frames += 1;
      if (window.__qgaSettle.frames < 60) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.waitForFunction(
    () => window.__qgaSettle && window.__qgaSettle.frames >= 3 && !window.__qgaSettle.blocked,
    null,
    { timeout: Math.min(timeout, settleMs), polling: 50 },
  );
}

/**
 * Run a readiness list against a page. Each entry is a probe name or
 * { selector, state?, text? }. Throws on the first failed probe.
 */
export async function runReadiness(page, readiness, { timeoutMs = 45000, settleMs = 4000 } = {}) {
  for (const probe of readiness) {
    if (typeof probe === "string") {
      if (!PROBE_NAMES.includes(probe)) throw new Error(`unknown readiness probe "${probe}"`);
      if (probe === "fonts") await probeFonts(page, timeoutMs);
      else if (probe === "network-idle") await probeNetworkIdle(page, timeoutMs);
      else if (probe === "view-mounted") await probeViewMounted(page, timeoutMs);
      else if (probe === "canvas-nonblank") await probeCanvasNonblank(page, timeoutMs);
      else if (probe === "animation-settled") await probeAnimationSettled(page, timeoutMs, settleMs);
    } else {
      const locator = probe.text
        ? page.locator(probe.selector).filter({ hasText: probe.text }).first()
        : page.locator(probe.selector).first();
      await locator.waitFor({ state: probe.state ?? "visible", timeout: timeoutMs });
    }
  }
}
