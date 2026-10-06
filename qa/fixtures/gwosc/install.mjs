// Playwright route installer for the synthetic GWOSC fixture.
// Intercepts every https://gwosc.org/** request so browser tests and captures
// never touch the real network. Modes model the failure paths the app must
// survive: HTTP errors, aborted connections, and over-limit bodies.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const json = (body) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

/**
 * @param {import("playwright").Page} page
 * @param {"ok"|"http-error"|"abort"|"oversized"} mode
 */
export async function installGwoscFixture(page, mode = "ok") {
  const eventVersion = JSON.parse(await readFile(path.join(here, "event-version.json"), "utf8"));
  const strainFiles = JSON.parse(await readFile(path.join(here, "strain-files.json"), "utf8"));
  const strain = await readFile(path.join(here, "strain.txt"), "utf8");

  await page.route("https://gwosc.org/**", async (route) => {
    const url = route.request().url();

    if (mode === "abort") return route.abort("connectionrefused");
    if (mode === "http-error") {
      return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "fixture: service unavailable" }) });
    }

    if (url.includes("/strain-files")) {
      return route.fulfill(json(strainFiles));
    }
    if (url.includes("/fixture/") && url.endsWith(".txt")) {
      if (mode === "oversized") {
        // Exceeds the app's 4 MB compressed safety bound; the app must reject it.
        const big = "1.0e-19\n".repeat(600_000);
        return route.fulfill({ status: 200, contentType: "text/plain", body: big });
      }
      return route.fulfill({ status: 200, contentType: "text/plain", body: strain });
    }
    if (url.includes("/api/v2/event-versions/")) {
      return route.fulfill(json(eventVersion));
    }
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ detail: "fixture: unknown path" }) });
  });
}
