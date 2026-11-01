/**
 * The worker client (S33): what the main thread holds.
 *
 * A pool with one long-lived worker, a channel per consumer, and the backpressure rule from the protocol: at most one
 * job per channel, refused rather than queued. Every path — result, error, cancel, a worker that dies — releases the
 * channel exactly once, because a channel that leaks a pending job silently stops the simulation it belongs to.
 *
 * Pure apart from the injected `Worker` constructor, so a fake worker in Node exercises the whole client.
 */

import { WORKER_SCHEMA, createChannelTracker, newJobId, validateJob } from "./worker-protocol.mjs";

/**
 * A client over one worker.
 *
 * `WorkerCtor` is passed in rather than read from `globalThis`, so a test can supply a synchronous fake and assert the
 * message flow without a browser.
 */
export function createWorkerClient({
  WorkerCtor = globalThis.Worker,
  url = "./js/workers/simulation-worker.mjs",
  base = globalThis.location?.href ?? "http://localhost/",
  onMessage = null,
} = {}) {
  if (typeof WorkerCtor !== "function") return { supported: false, reason: "This browser has no module workers." };

  let worker = null;
  let ready = false;
  const listeners = new Set();
  const results = new Map();
  const tracker = createChannelTracker({ send: (message) => worker?.postMessage(message) });

  const start = () => {
    if (worker) return worker;
    worker = new WorkerCtor(new URL(url, base), { type: "module" });
    worker.addEventListener("message", (event) => {
      const message = event.data ?? {};
      if (message.schema !== WORKER_SCHEMA) return;
      if (message.type === "ready") { ready = true; return; }
      const entry = results.get(message.id);
      if (message.type === "progress") {
        entry?.onProgress?.(message);
        return;
      }
      // A settled job releases its channel exactly once, whatever the outcome.
      results.delete(message.id);
      if (entry) tracker.settle(entry.channel, message.id);
      if (message.type === "result") entry?.resolve(message);
      else if (message.type === "cancelled") entry?.reject(new Error("cancelled"));
      else entry?.reject(new Error(message.message ?? "worker error"));
      if (onMessage) onMessage(message);
      for (const listener of listeners) listener(message);
    });
    worker.addEventListener("error", (event) => {
      // A worker that dies takes every pending job with it; say so once rather than leaving promises hanging.
      const error = new Error(`worker failed: ${event.message ?? "unknown error"}`);
      for (const [id, entry] of results) {
        tracker.settle(entry.channel, id);
        entry.reject(error);
      }
      results.clear();
    });
    return worker;
  };

  return {
    supported: true,
    /** Send a job. Returns a promise of the result message; a busy channel is refused synchronously. */
    run(request, { channel = request.kind, onProgress = null } = {}) {
      const decision = validateJob(request);
      if (!decision.ok) return Promise.reject(new Error(decision.errors.join("; ")));
      const id = decision.request.id;
      const claim = tracker.claim(channel, id);
      if (!claim.ok) return Promise.reject(new Error(claim.reason));
      const target = start();
      return new Promise((resolve, reject) => {
        results.set(id, { resolve, reject, channel, onProgress });
        target.postMessage({ schema: WORKER_SCHEMA, id, ...decision.request });
      });
    },
    cancel(channel) {
      const [id] = tracker.pendingFor(channel);
      if (!id) return false;
      const entry = results.get(id);
      if (entry) entry.reject(new Error("cancelled"));
      results.delete(id);
      return tracker.cancel(channel, id);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    pendingFor: (channel) => tracker.pendingFor(channel),
    channels: () => tracker.channels(),
    get ready() { return ready; },
    /** Stop the worker and release everything it held. Idempotent. */
    dispose() {
      for (const [id, entry] of results) {
        tracker.settle(entry.channel, id);
        entry.reject(new Error("worker disposed"));
      }
      results.clear();
      listeners.clear();
      if (worker) worker.terminate();
      worker = null;
      ready = false;
    },
  };
}

/** Whether the current view has work worth offloading, so a view without one never pays for a worker. */
export function prefersWorker(kind, params = {}) {
  if (kind === "causal-set") {
    // The threshold lives in the protocol so the client and the worker cannot disagree about it.
    return typeof params.n === "number" && params.n > 2000;
  }
  return ["matched-filter", "cdt", "rge", "greybody"].includes(kind);
}

export { newJobId };
