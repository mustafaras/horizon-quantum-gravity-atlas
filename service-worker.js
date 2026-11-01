// service-worker.js — the offline atlas (S33).
//
// Three rules, and each one exists because the opposite is a real failure:
//
//  1. NEVER cache a GWOSC response. Strain data carries provenance (a detector, a GPS start, a retrieval date); a
//     stale copy would silently present yesterday's download as today's measurement. Those requests are passed straight
//     through, and the atlas keeps its own committed fixture for the deterministic path.
//  2. NEVER force a reload. An update is announced and waits. A reader who is mid-annotation or mid-tour decides when
//     to take it, because a reload would drop what they were doing.
//  3. Cache names carry the build version, and activation deletes only older HORIZON caches — never a neighbouring
//     app's storage, which the GitHub Pages subpath shares.
//
// Scoped to the project subpath: this file is served from the deployed root, so every URL is built from
// `self.registration.scope` rather than from a hard-coded leading slash.

/* eslint-env serviceworker */

const VERSION = "horizon-qga-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

/** Everything needed to boot without the network, expressed relative to the scope the worker was registered with. */
const SHELL = [
  "",
  "index.html",
  "manifest.webmanifest",
  "favicon.svg",
  "styles/tokens.css",
  "styles/base.css",
  "styles/layout.css",
  "styles/components.css",
  "styles/components-scene.css",
  "styles/shell.css",
  "styles/figure.css",
  "styles/tours.css",
  "styles/export.css",
  "vendor/fonts/fonts.css",
  "vendor/katex/katex.min.css",
  "vendor/katex/katex.min.js",
  "vendor/react/react.production.min.js",
  "vendor/react/react-dom.production.min.js",
  "js/bootstrap.mjs",
  "js/render/three-runtime.mjs",
  "js/compiled/tweaks-panel.js",
  "js/compiled/js/app.js",
  "js/compiled/.manifest.json",
];

/** Requests this worker must never answer from a cache, whatever else it does. */
const NEVER_CACHE = [/^https:\/\/gwosc\.org\//i, /^https:\/\/[^/]*gravitationalwave[^/]*\//i];

/** Everything under vendor/ is immutable; the compiled JS is rebuilt but always with a new build version. */
const IMMUTABLE = [/\/vendor\//, /\/js\/compiled\//];

const scopePath = () => new URL(self.registration.scope).pathname;
const inScope = (url) => new URL(url, self.registration.scope).href.startsWith(self.registration.scope);

/** A request for a document: the app shell, so an offline reload lands on the page the reader expects. */
const isNavigation = (request) => request.mode === "navigate";

self.addEventListener("install", (event) => {
  // A shell URL that 404s would break the whole install, so each is fetched with `cache: "reload"` and a failure is
  // reported rather than hidden — a silently partial shell is worse than a visible install failure.
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.all(SHELL.map(async (relative) => {
      const url = new URL(relative, self.registration.scope).href;
      try {
        const response = await fetch(new Request(url, { cache: "reload" }));
        if (!response.ok) console.warn(`[sw] shell asset ${relative} returned ${response.status}`);
        else await cache.put(url, response);
      } catch (error) {
        console.warn(`[sw] shell asset ${relative} could not be fetched: ${error.message}`);
      }
    }));
  })());
  // No skipWaiting: the update waits for the reader (rule 2).
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Delete only our own older caches. The scope can be shared with another project on the same Pages domain.
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith("horizon-qga-") && name !== SHELL_CACHE && name !== RUNTIME_CACHE)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  const data = event.data ?? {};
  if (data.type === "skip-waiting") {
    // Only reachable from an explicit reader action: the update prompt's "reload now".
    self.skipWaiting();
    return;
  }
  if (data.type === "cache-status") {
    event.source?.postMessage({ type: "cache-status", version: VERSION, scope: scopePath() });
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = request.url;
  if (!inScope(url)) return;
  if (NEVER_CACHE.some((pattern) => pattern.test(url))) return; // rule 1: straight to the network, never stored

  if (isNavigation(request)) {
    // Network first with a short timeout, then the cached shell: a flaky connection should still open the atlas.
    event.respondWith((async () => {
      try {
        const response = await Promise.race([
          fetch(request),
          new Promise((_, reject) => setTimeout(() => reject(new Error("navigation timeout")), 4000)),
        ]);
        const cache = await caches.open(SHELL_CACHE);
        cache.put(new URL("index.html", self.registration.scope).href, response.clone());
        return response;
      } catch (error) {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match(request)) ?? (await cache.match(new URL("index.html", self.registration.scope).href))
          ?? new Response("The atlas is offline and its shell is not cached yet.", { status: 503, headers: { "content-type": "text/plain" } });
      }
    })());
    return;
  }

  if (IMMUTABLE.some((pattern) => pattern.test(url))) {
    // Cache first for immutable assets: a versioned vendor file never changes, and this is what makes a reload instant.
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) (await caches.open(RUNTIME_CACHE)).put(request, response.clone());
      return response;
    })());
    return;
  }

  // Everything else: stale-while-revalidate. A local doc or screenshot may be updated, and the reader gets the cached
  // copy now and the fresh one next time.
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    const network = fetch(request).then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    }).catch(() => null);
    return cached ?? (await network) ?? new Response("", { status: 504 });
  })());
});
