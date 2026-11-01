// js/workers/simulation-worker.mjs — the dispatcher (S33).
//
// A module worker over the science modules. It knows nothing about the DOM, so the same file is exercised in Node by
// importing it with a fake `self`: the job kinds, the progress cadence and the cancellation check are all testable
// without a browser.
//
// The worker is a dispatcher, never a second implementation: every number it returns comes from `js/science/`, which is
// the same module the main thread uses. That is the point of moving the work rather than copying the maths.

import {
  JOB_KINDS, WORKER_SCHEMA, errorMessage, progressMessage, resultMessage, validateJob,
} from "./worker-protocol.mjs";

import { buildBank, colouredNoise, searchBank } from "../science/matched-filter.mjs";
import { initialProfile, metropolisSweep, reggeAction } from "../science/cdt-2d.mjs";
import { stabilityBoundaries } from "../science/higgs-running.mjs";
import { transmission } from "../science/greybody.mjs";
import { causalMatrix, links, buildSuccessors, relationCount, sprinkle } from "../science/causal-sets.mjs";

/** How often a long job reports. Ten updates is enough for a progress bar and cheap enough to ignore. */
const PROGRESS_STEPS = 10;

/**
 * Handler table. Each entry takes `(params, { post, isCancelled, seed })` and returns the value to send back.
 *
 * `post` is the only way to talk to the outside, which is what lets the Node test drive a job to completion and read
 * the messages it produced.
 */
export const HANDLERS = Object.freeze({
  "matched-filter": async (params, { post, isCancelled, seed }) => {
    const bank = buildBank({
      count: params.bank.count,
      mcMin: params.bank.mcMin ?? 10,
      mcMax: params.bank.mcMax ?? 40,
      fStartHz: params.bank.fStartHz ?? 30,
      sampleRate: params.sampleRate ?? 128,
      duration: params.duration ?? 8,
    });
    const noise = colouredNoise({
      n: Math.round((params.sampleRate ?? 128) * (params.duration ?? 8)),
      sampleRate: params.sampleRate ?? 128,
      psd: params.psd ?? null,
      seed,
    });
    post(progressMessage("", { done: 0, total: bank.length, label: "bank built" }));
    const scored = [];
    for (let i = 0; i < bank.length; i += 1) {
      if (isCancelled()) return null;
      scored.push(searchBank({ strain: noise, sampleRate: params.sampleRate ?? 128, bank: [bank[i]] }));
      if (i % Math.max(1, Math.floor(bank.length / PROGRESS_STEPS)) === 0) {
        post(progressMessage("", { done: i + 1, total: bank.length, label: "templates scored" }));
      }
    }
    // The series itself is returned as a transferable Float64Array rather than as a plain array of objects.
    const best = scored.map((entry) => (Array.isArray(entry) ? entry[0] : entry));
    return { bankSize: bank.length, best, series: new Float64Array(best.map((entry) => Number(entry?.snr) || 0)) };
  },

  cdt: async (params, { post, isCancelled, seed }) => {
    const slices = params.slices ?? 24;
    const sweeps = params.sweeps ?? 100;
    const lambda = params.lambda ?? 0.5;
    let profile = initialProfile({ slices, targetVolume: params.targetVolume ?? 6 });
    let accepted = 0;
    let proposed = 0;
    // `metropolisSweep` returns the new profile plus its own counters; the loop owns the progress and the cancel check,
    // because the sweep itself has no interior checkpoint to report from.
    for (let sweep = 0; sweep < sweeps; sweep += 1) {
      if (isCancelled()) return null;
      const step = metropolisSweep(profile, { lambda, seed, sweep });
      profile = step.profile;
      accepted += step.accepted;
      proposed += step.proposed;
      if (sweep % Math.max(1, Math.floor(sweeps / PROGRESS_STEPS)) === 0) {
        post(progressMessage("", { done: sweep + 1, total: sweeps, label: "sweeps" }));
      }
    }
    return {
      slices, sweeps, lambda,
      profile: new Float64Array(profile),
      acceptanceRate: proposed > 0 ? accepted / proposed : 0,
      action: reggeAction(profile, lambda),
    };
  },

  rge: async (params, { post, isCancelled }) => {
    const samples = params.samples ?? 24;
    const mHValues = params.mHValues ?? Array.from({ length: samples }, (_, i) => 100 + i * 5);
    const mtRange = params.mtRange ?? [165, 180];
    post(progressMessage("", { done: 0, total: mHValues.length, label: "scan" }));
    if (isCancelled()) return null;
    // The scan is one call into the science module; the progress message above is the honest statement that it has no
    // interior checkpoint to report from.
    const boundaries = stabilityBoundaries({ mHValues, mtRange, loops: params.loops ?? 2 });
    return {
      mH: new Float64Array(boundaries.mH),
      stable: new Float64Array(boundaries.stable.map((v) => (Number.isFinite(v) ? v : Number.NaN))),
      unstable: new Float64Array(boundaries.unstable.map((v) => (Number.isFinite(v) ? v : Number.NaN))),
    };
  },

  greybody: async (params, { post, isCancelled }) => {
    const l = params.l ?? 0;
    const M = params.M ?? 1;
    const omegas = params.omegas ?? Array.from({ length: 64 }, (_, i) => 0.02 + (i * 1.2) / 63);
    const out = [];
    for (let i = 0; i < omegas.length; i += 1) {
      if (isCancelled()) return null;
      out.push(transmission(l, omegas[i], M));
      if (i % Math.max(1, Math.floor(omegas.length / PROGRESS_STEPS)) === 0) {
        post(progressMessage("", { done: i + 1, total: omegas.length, label: "partial waves" }));
      }
    }
    return { l, M, omega: new Float64Array(omegas), gamma: new Float64Array(out) };
  },

  "causal-set": async (params, { post, isCancelled, seed }) => {
    const n = params.n;
    const dim = params.dim ?? 2;
    post(progressMessage("", { done: 0, total: 4, label: "sprinkle" }));
    const points = sprinkle({ dim, n, seed });
    if (isCancelled()) return null;
    post(progressMessage("", { done: 1, total: 4, label: "relation matrix" }));
    const matrix = causalMatrix(points);
    if (isCancelled()) return null;
    post(progressMessage("", { done: 2, total: 4, label: "successors" }));
    const successors = buildSuccessors(matrix);
    if (isCancelled()) return null;
    post(progressMessage("", { done: 3, total: 4, label: "links" }));
    const linked = links(matrix, points, successors);
    return {
      n, dim,
      relations: relationCount(matrix),
      linkCount: linked.length,
      orderingFraction: relationCount(matrix) / ((n * (n - 1)) / 2),
    };
  },
});

/** The set of kinds this build can actually run; a job outside it is refused with the reason. */
export function supportedKinds() {
  return JOB_KINDS.filter((kind) => typeof HANDLERS[kind] === "function");
}

/**
 * Run one job.
 *
 * Returns `{ ok: true, value }` or `{ ok: false, reason }`. Cancellation is cooperative and checked at every loop
 * boundary the handler has, so a cancelled job returns promptly rather than after the whole computation.
 */
export async function runJob(request, { post = () => {}, isCancelled = () => false, seed = 42 } = {}) {
  const decision = validateJob(request);
  if (!decision.ok) return { ok: false, reason: decision.errors.join("; ") };
  const handler = HANDLERS[decision.request.kind];
  if (!handler) return { ok: false, reason: `no handler for job kind "${decision.request.kind}"` };
  const id = decision.request.id;
  const emit = (message) => post({ ...message, id });
  const started = Date.now();
  try {
    const value = await handler(decision.request.params, {
      post: emit, isCancelled, seed: Number(decision.request.seed ?? seed),
    });
    if (value === null) return { ok: false, reason: "cancelled", id };
    return { ok: true, id, value, durationMs: Date.now() - started };
  } catch (error) {
    return { ok: false, reason: error.message, id, message: errorMessage(id, error.message, { kind: decision.request.kind }) };
  }
}

/**
 * The browser entry point.
 *
 * Kept behind a `self` check so importing this file in Node (for the tests) does not try to attach a listener to a
 * WorkerGlobalScope that is not there.
 */
export function attachWorker(scope) {
  if (!scope || typeof scope.postMessage !== "function" || typeof scope.addEventListener !== "function") {
    throw new TypeError("attachWorker needs a WorkerGlobalScope-like object");
  }
  const cancelled = new Set();
  scope.addEventListener("message", async (event) => {
    const data = event.data ?? {};
    if (data.type === "cancel" && typeof data.id === "string") { cancelled.add(data.id); return; }
    const request = data.request ?? data;
    const result = await runJob(request, {
      post: (message) => scope.postMessage(message),
      isCancelled: () => cancelled.has(request.id),
    });
    if (result.ok) {
      scope.postMessage(resultMessage(result.id, { value: result.value, durationMs: result.durationMs }));
    } else if (result.reason === "cancelled") {
      scope.postMessage({ schema: WORKER_SCHEMA, type: "cancelled", id: result.id });
    } else {
      scope.postMessage(result.message ?? errorMessage(result.id ?? request.id ?? null, result.reason));
    }
    cancelled.delete(result.id ?? request.id);
  });
  scope.postMessage({ schema: WORKER_SCHEMA, type: "ready", kinds: supportedKinds() });
}

if (typeof WorkerGlobalScope !== "undefined" && globalThis instanceof WorkerGlobalScope) {
  attachWorker(globalThis);
}
