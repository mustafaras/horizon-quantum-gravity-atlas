/**
 * The worker protocol (S33).
 *
 * Expensive, pure computation — matched-filter banks, CDT sweeps, RGE scans, greybody partial waves, causal-set
 * reduction — moves off the main thread. What stays here is the *contract*: which job kinds exist, what each one
 * accepts, how a cancel is expressed, and the backpressure rule that at most one result may be in flight per channel.
 *
 * Pure and DOM-free, so the protocol is tested in Node and the worker is a thin dispatcher over it.
 */

export const WORKER_SCHEMA = "horizon-qga-worker/v1";

/** Every job kind the worker answers. A kind outside this list is refused, not silently ignored. */
export const JOB_KINDS = Object.freeze([
  "matched-filter",
  "cdt",
  "rge",
  "greybody",
  "causal-set",
]);

export const JOB_LIMITS = Object.freeze({
  maxBankSize: 256,
  maxSamples: 1 << 20,
  maxSlices: 512,
  maxPoints: 200_000,
  maxRangeSamples: 512,
  /** Causal-set reduction is only worth a worker above this N; below it the copy costs more than the work. */
  causalSetWorkerThreshold: 2000,
});

/**
 * The point above which a causal-set computation belongs in a worker.
 *
 * The prompt names N = 2000. Below it the structured-clone cost of a dense relation matrix dominates the O(N²) build,
 * so moving the work would make the interaction slower, not faster.
 */
export function shouldOffloadCausalSet(n) {
  return Number.isFinite(n) && n > JOB_LIMITS.causalSetWorkerThreshold;
}

/** A monotonically increasing id, so a late result can be matched to the request that produced it. */
let nextId = 1;
export function newJobId() {
  return `job-${nextId++}`;
}

/** Reset the counter — tests need deterministic ids and nothing else should call this. */
export function resetJobIds() {
  nextId = 1;
}

const isPlainObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const positiveInt = (value, max) => Number.isInteger(value) && value > 0 && value <= max;

/**
 * Validate a job request. Returns `{ ok, errors, request }` with the request normalised to its defaults.
 *
 * Each kind validates only the fields it uses: a `cdt` job that also carries `points` is not silently accepted as a
 * causal set, it is a malformed request.
 */
export function validateJob(request) {
  const errors = [];
  const fail = (message) => errors.push(message);
  if (!isPlainObject(request)) return { ok: false, errors: ["a job must be an object"] };
  if (!JOB_KINDS.includes(request.kind)) {
    return { ok: false, errors: [`kind must be one of ${JOB_KINDS.join(", ")} (received ${JSON.stringify(request.kind)})`] };
  }
  if (request.id != null && (typeof request.id !== "string" || !/^job-\d+$/.test(request.id))) {
    fail("id must look like job-<n> when present");
  }
  if (request.seed != null && !Number.isFinite(Number(request.seed))) fail("seed must be a number when present");
  const params = request.params ?? {};
  if (!isPlainObject(params)) fail("params must be an object");

  switch (request.kind) {
    case "matched-filter": {
      if (!isPlainObject(params.bank)) fail("matched-filter needs a bank object");
      else if (!positiveInt(params.bank.count, JOB_LIMITS.maxBankSize)) fail(`bank.count must be a positive integer <= ${JOB_LIMITS.maxBankSize}`);
      if (params.sampleRate != null && !(Number(params.sampleRate) > 0)) fail("sampleRate must be positive");
      if (params.duration != null && !(Number(params.duration) > 0)) fail("duration must be positive");
      break;
    }
    case "cdt": {
      if (params.slices != null && !positiveInt(params.slices, JOB_LIMITS.maxSlices)) fail(`slices must be a positive integer <= ${JOB_LIMITS.maxSlices}`);
      if (params.sweeps != null && !positiveInt(params.sweeps, 10_000)) fail("sweeps must be a positive integer");
      break;
    }
    case "rge": {
      if (params.samples != null && !positiveInt(params.samples, JOB_LIMITS.maxRangeSamples)) fail(`samples must be a positive integer <= ${JOB_LIMITS.maxRangeSamples}`);
      break;
    }
    case "greybody": {
      if (params.l != null && !(Number.isInteger(params.l) && params.l >= 0)) fail("l must be a non-negative integer");
      break;
    }
    case "causal-set": {
      if (!positiveInt(params.n, JOB_LIMITS.maxPoints)) fail(`n must be a positive integer <= ${JOB_LIMITS.maxPoints}`);
      if (params.dim != null && !(Number(params.dim) >= 1 && Number(params.dim) <= 8)) fail("dim must be between 1 and 8");
      break;
    }
    default:
      break;
  }
  return { ok: errors.length === 0, errors, request: { ...request, params, id: request.id ?? newJobId() } };
}

/** Messages the worker sends back. `progress` is throttled by the worker, not by the consumer. */
export const MESSAGE_TYPES = Object.freeze(["progress", "result", "error", "cancelled", "ready"]);

export function progressMessage(id, { done, total, label = null }) {
  if (!(Number.isFinite(done) && Number.isFinite(total) && total > 0)) {
    throw new TypeError("progress needs a finite done and a positive total");
  }
  const fraction = Math.min(1, Math.max(0, done / total));
  return { schema: WORKER_SCHEMA, type: "progress", id, done, total, fraction, label };
}

export function resultMessage(id, { value, transfer = [], durationMs = null }) {
  return {
    schema: WORKER_SCHEMA, type: "result", id, value, durationMs,
    transferable: transfer.map((item) => item?.constructor?.name ?? "unknown"),
  };
}

export function errorMessage(id, message, { kind = null } = {}) {
  return { schema: WORKER_SCHEMA, type: "error", id, message: String(message), kind };
}

/**
 * One pending result per channel (backpressure).
 *
 * A consumer that sends a second job for a channel while the first is unresolved would build a queue nobody drains;
 * this tracker refuses the second request and says so, which is the behaviour the prompt asks for.
 */
export function createChannelTracker({ send = () => {}, maxPending = 1 } = {}) {
  const pending = new Map();
  return {
    /** Claim a channel for a job id. Returns `{ ok }`; a full channel is refused, never queued. */
    claim(channel, id) {
      const inFlight = pending.get(channel);
      if (inFlight && inFlight.length >= maxPending) {
        return { ok: false, reason: `channel "${channel}" already has ${inFlight.length} job(s) in flight`, inFlight: [...inFlight] };
      }
      const list = inFlight ?? [];
      list.push(id);
      pending.set(channel, list);
      return { ok: true };
    },
    settle(channel, id) {
      const list = pending.get(channel);
      if (!list) return false;
      const at = list.indexOf(id);
      if (at === -1) return false;
      list.splice(at, 1);
      if (list.length === 0) pending.delete(channel);
      return true;
    },
    /** Cancel means "stop and report nothing"; the worker is told, and the channel is released immediately. */
    cancel(channel, id) {
      send({ schema: WORKER_SCHEMA, type: "cancel", id });
      return this.settle(channel, id);
    },
    pendingFor(channel) {
      return [...(pending.get(channel) ?? [])];
    },
    channels() {
      return [...pending.keys()];
    },
  };
}

/**
 * The reduction a causal set of `n` points needs, kept pure so the worker is a dispatcher and not a second
 * implementation of the science.
 */
export function causalSetWork(n, dim = 2) {
  // The dense relation matrix is n² bytes; the successor lists and the link count are the O(n²) part a worker can carry.
  return Object.freeze({
    matrixBytes: n * n,
    pairCount: (n * (n - 1)) / 2,
    dim,
    offload: shouldOffloadCausalSet(n),
  });
}
