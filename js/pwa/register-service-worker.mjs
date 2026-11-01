/**
 * Service-worker registration (S33).
 *
 * What the page does with the worker, and — more importantly — what it refuses to do:
 *   - it registers only when the browser supports it and the context is trustworthy (HTTPS or localhost);
 *   - it reports three states to the UI: registered, update-available, offline-ready;
 *   - an update is never applied on its own. `applyUpdate()` is the reader's click; the atlas keeps annotations and
 *     snapshots in localStorage as they change, but a module that reloaded by itself would also lose an in-progress
 *     tour step, and the prompt's rule is explicit;
 *   - `?nosw=1` (and `?dev=1`) skips registration, because a stale worker during development is worse than none.
 *
 * The browser pieces are injected, so the state machine is testable in Node without a Service Worker implementation.
 */

export const SW_STATE = Object.freeze({
  unsupported: "unsupported",
  insecure: "insecure",
  disabled: "disabled",
  registering: "registering",
  registered: "registered",
  "update-available": "update-available",
  "offline-ready": "offline-ready",
  failed: "failed",
});

/**
 * Register the worker and return a controller the UI can subscribe to.
 *
 * `env` carries the pieces of the browser this needs, so a test can supply a fake registration and watch the state
 * transitions.
 */
export function createServiceWorkerController({
  env = globalThis,
  url = "service-worker.js",
  scope = "./",
  listen = true,
} = {}) {
  const serviceWorker = env.navigator?.serviceWorker;
  const listeners = new Set();
  let state = SW_STATE.registering;
  let registration = null;
  let offlineReady = false;
  const log = [];

  const emit = (next, detail = null) => {
    state = next;
    log.push({ state: next, at: Date.now(), detail });
    for (const listener of listeners) listener({ state, detail });
  };

  if (!listen) {
    emit(SW_STATE.disabled, { reason: "disabled by ?nosw=1 or ?dev=1" });
    return { supported: false, state: () => state, reason: "disabled by ?nosw=1 or ?dev=1" };
  }
  if (!serviceWorker) {
    emit(SW_STATE.unsupported);
    return { supported: false, state: () => state, reason: "no navigator.serviceWorker" };
  }
  if (env.isSecureContext === false) {
    emit(SW_STATE.insecure);
    return { supported: false, state: () => state, reason: "the worker needs HTTPS or localhost" };
  }

  const controller = {
    supported: true,
    state: () => state,
    isOfflineReady: () => offlineReady,
    registration: () => registration,
    log: () => [...log],

    async register() {
      try {
        const base = env.location?.href ?? "http://localhost/";
        registration = await serviceWorker.register(new URL(url, base).href, { scope });
        emit(SW_STATE.registered);
        offlineReady = true;
        emit(SW_STATE["offline-ready"]);
        registration.addEventListener?.("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener?.("statechange", () => {
            if (installing.state !== "installed") return;
            // An installed worker with a live controller is an update; without one it is the first install, which the
            // reader has just seen happen.
            if (serviceWorker.controller) emit(SW_STATE["update-available"], { scope: registration.scope });
          });
        });
        return { ok: true, scope: registration.scope };
      } catch (error) {
        emit(SW_STATE.failed, { message: error.message });
        return { ok: false, reason: error.message };
      }
    },

    /**
     * Take the waiting worker now.
     *
     * The caller decides when this is safe. Annotations and snapshots are written to localStorage as they change, so
     * this is a convenience rather than a data-loss risk — but the choice stays explicit, because a reload would still
     * lose an in-progress tour step, and a module that reloaded on its own would have taken that decision away.
     */
    async applyUpdate() {
      const waiting = registration?.waiting;
      if (!waiting) return { ok: false, reason: "no update is waiting" };
      waiting.postMessage({ type: "skip-waiting" });
      return { ok: true };
    },

    /** The reader dismissed the prompt; it should not return until the next navigation. */
    dismissUpdate() {
      emit(offlineReady ? SW_STATE["offline-ready"] : SW_STATE.registered);
    },

    async unregister() {
      if (registration) await registration.unregister();
      registration = null;
      offlineReady = false;
      emit(SW_STATE.disabled);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return controller;
}

/** Whether the URL asks for the worker to stay out of the way. */
export function workerDisabledByUrl(search = "") {
  const params = new URLSearchParams(search);
  return params.get("nosw") === "1" || params.get("dev") === "1";
}

/**
 * The message a reader sees.
 *
 * A sentence a person can act on; "reload now" is deliberately not automatic.
 */
export function updateNoticeText() {
  return "A newer version of the atlas is ready. Reload when you are at a stopping point — your annotations and snapshots are saved.";
}
