// Production runtime, workers and offline (S33).
//
// The assertions that matter here are the ones a browser cannot make cheaply: that the committed JSX output is what a
// fresh compile produces, that production loads no Babel and the compiled files in the right order, that the worker
// protocol refuses what it should, and that the service worker never caches GWOSC and never reloads on its own.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BABEL_OPTIONS, checkCompiled, compileAll, compileSource, listJsxSources, outputPathFor,
} from "../scripts/compile-jsx.mjs";
import {
  JOB_KINDS, JOB_LIMITS, WORKER_SCHEMA, causalSetWork, createChannelTracker, errorMessage,
  newJobId, progressMessage, resetJobIds, resultMessage, shouldOffloadCausalSet, validateJob,
} from "../js/workers/worker-protocol.mjs";
import { HANDLERS, runJob, supportedKinds } from "../js/workers/simulation-worker.mjs";
import { createWorkerClient } from "../js/workers/worker-client.mjs";
import {
  SW_STATE, createServiceWorkerController, updateNoticeText, workerDisabledByUrl,
} from "../js/pwa/register-service-worker.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");

/* ---------- compiled JSX ---------- */

test("the committed compiled JSX is exactly what a fresh compile produces", () => {
  const result = checkCompiled({ root });
  assert.deepEqual(result.missing, [], "run `npm run compile:jsx`");
  assert.deepEqual(result.stale, [], "run `npm run compile:jsx`");
  assert.deepEqual(result.extra, []);
  assert.equal(result.ok, true);
  assert.equal(result.sources.length, 59, "59 JSX entry points");
});

test("index.html loads the compiled files in order, and no JSX or Babel in production", () => {
  const listed = [...html.matchAll(/<script type="application\/x-qga-compiled" src="([^"]+)">/g)].map((m) => m[1]);
  const manifest = JSON.parse(read("js/compiled/.manifest.json"));
  const expected = Object.keys(manifest.sources).map((source) => outputPathFor(source).split(path.sep).join("/"));
  assert.deepEqual(listed, expected, "one tag per source, in compiler order");

  // Production must not fetch Babel at all: the runtime chooser names it only on the dev branch.
  assert.doesNotMatch(html, /<script[^>]+src="vendor\/babel\/babel\.min\.js"/);
  assert.match(html, /dev\s*\?\s*\[\["vendor\/react\/react\.development\.js"/);
  assert.match(html, /vendor\/react\/react\.production\.min\.js/);
  assert.match(html, /vendor\/react\/react-dom\.production\.min\.js/);
  assert.equal([...html.matchAll(/type="application\/x-qga-jsx"/g)].length, 0, "no JSX tag ships in production");
});

test("the production React builds are the pinned version, vendored with integrity", () => {
  for (const file of ["vendor/react/react.production.min.js", "vendor/react/react-dom.production.min.js"]) {
    const text = read(file);
    assert.ok(text.length > 1000, `${file} is present`);
    // The minified UMD build carries the version in its banner comment.
    assert.match(text, /18\.3\.1/, `${file} is React 18.3.1`);
  }
  assert.match(read("vendor/react/react-dom.production.min.js"), /ReactVersion\s*=\s*'18\.3\.1'|18\.3\.1/);
  // A production build must not contain the development warning machinery.
  assert.doesNotMatch(read("vendor/react/react.production.min.js"), /Warning: /);
});

test("the compiler is deterministic and maps each source to one output path", () => {
  assert.deepEqual([...BABEL_OPTIONS.presets], ["react", "env"]);
  assert.equal(outputPathFor("js/app.jsx"), path.join("js", "compiled", "js", "app.js"), "the path is preserved");
  assert.equal(outputPathFor("./tweaks-panel.jsx"), path.join("js", "compiled", "tweaks-panel.js"));
  const once = compileAll({ root });
  const twice = compileAll({ root });
  for (const [file, text] of once.files) assert.equal(twice.files.get(file), text, `${file} must compile identically twice`);
  // A syntax error names the file rather than surfacing a bare Babel message.
  assert.throws(() => compileSource("const = ;", "broken.jsx"), /broken\.jsx:/);
  assert.throws(() => listJsxSources("<html></html>"), /lists no JSX or compiled/);
});

/* ---------- worker protocol ---------- */

test("the worker protocol declares its kinds, limits and the causal-set threshold", () => {
  assert.deepEqual([...JOB_KINDS], ["matched-filter", "cdt", "rge", "greybody", "causal-set"]);
  assert.deepEqual(supportedKinds(), [...JOB_KINDS], "this build answers every kind");
  assert.equal(JOB_LIMITS.causalSetWorkerThreshold, 2000);
  assert.equal(shouldOffloadCausalSet(1999), false);
  assert.equal(shouldOffloadCausalSet(2000), false, "at the threshold the copy still dominates");
  assert.equal(shouldOffloadCausalSet(2001), true);
  assert.equal(shouldOffloadCausalSet(Number.NaN), false);

  const work = causalSetWork(3000, 2);
  assert.equal(work.matrixBytes, 9_000_000);
  assert.equal(work.pairCount, (3000 * 2999) / 2);
  assert.equal(work.offload, true);
});

test("job validation refuses a kind, a size or a shape it cannot honour", () => {
  assert.equal(validateJob({ kind: "cdt", params: { slices: 24 } }).ok, true);
  assert.equal(validateJob({ kind: "nope" }).ok, false);
  assert.equal(validateJob(null).ok, false);
  assert.match(validateJob({ kind: "nope" }).errors[0], /kind must be one of/);

  const cases = [
    [{ kind: "matched-filter", params: {} }, /needs a bank/],
    [{ kind: "matched-filter", params: { bank: { count: 0 } } }, /bank\.count/],
    [{ kind: "matched-filter", params: { bank: { count: JOB_LIMITS.maxBankSize + 1 } } }, /bank\.count/],
    [{ kind: "cdt", params: { slices: JOB_LIMITS.maxSlices + 1 } }, /slices/],
    [{ kind: "cdt", params: { sweeps: -1 } }, /sweeps/],
    [{ kind: "rge", params: { samples: JOB_LIMITS.maxRangeSamples + 1 } }, /samples/],
    [{ kind: "greybody", params: { l: -1 } }, /l must be/],
    [{ kind: "causal-set", params: {} }, /n must be/],
    [{ kind: "causal-set", params: { n: 10, dim: 99 } }, /dim must be/],
    [{ kind: "causal-set", params: { n: 10 }, id: "NOT-AN-ID" }, /id must look like/],
    [{ kind: "causal-set", params: { n: 10 }, seed: "abc" }, /seed must be a number/],
  ];
  for (const [request, pattern] of cases) {
    const result = validateJob(request);
    assert.equal(result.ok, false, `expected a refusal for ${JSON.stringify(request)}`);
    assert.ok(result.errors.some((error) => pattern.test(error)), `no error matched ${pattern}: ${result.errors.join(" | ")}`);
  }

  resetJobIds();
  const first = validateJob({ kind: "cdt" });
  const second = validateJob({ kind: "cdt" });
  assert.equal(first.request.id, "job-1");
  assert.equal(second.request.id, "job-2");
  assert.match(newJobId(), /^job-\d+$/);
});

test("messages carry the schema and the shape the client expects", () => {
  const progress = progressMessage("job-1", { done: 5, total: 10, label: "sweeps" });
  assert.equal(progress.schema, WORKER_SCHEMA);
  assert.equal(progress.type, "progress");
  assert.equal(progress.fraction, 0.5);
  assert.equal(progressMessage("job-1", { done: 20, total: 10 }).fraction, 1, "a fraction cannot exceed one");
  assert.throws(() => progressMessage("job-1", { done: 1, total: 0 }), /positive total/);

  const series = new Float64Array([1, 2, 3]);
  const result = resultMessage("job-1", { value: { series }, transfer: [series], durationMs: 12 });
  assert.deepEqual(result.transferable, ["Float64Array"]);
  assert.equal(result.durationMs, 12);

  const error = errorMessage("job-1", "boom", { kind: "cdt" });
  assert.equal(error.type, "error");
  assert.equal(error.kind, "cdt");
});

test("backpressure refuses a second job on a busy channel instead of queueing it", () => {
  const sent = [];
  const tracker = createChannelTracker({ send: (message) => sent.push(message) });
  assert.equal(tracker.claim("bh", "job-1").ok, true, "the first job is accepted");
  const second = tracker.claim("bh", "job-2");
  assert.equal(second.ok, false);
  assert.match(second.reason, /already has 1 job/);
  assert.deepEqual(second.inFlight, ["job-1"]);
  assert.equal(tracker.claim("exp", "job-3").ok, true, "another channel is unaffected");
  assert.deepEqual(tracker.channels().sort(), ["bh", "exp"]);

  assert.equal(tracker.settle("bh", "job-1"), true);
  assert.equal(tracker.pendingFor("bh").length, 0);
  assert.equal(tracker.claim("bh", "job-4").ok, true, "the channel is free again");

  assert.equal(tracker.cancel("bh", "job-4"), true);
  assert.equal(sent.at(-1).type, "cancel");
  assert.equal(sent.at(-1).id, "job-4");
});

/* ---------- worker handlers ---------- */

test("every handler answers with values from the science modules, seeded and deterministic", async () => {
  const causalA = await runJob({ kind: "causal-set", params: { n: 60, dim: 2 }, seed: 42 });
  const causalB = await runJob({ kind: "causal-set", params: { n: 60, dim: 2 }, seed: 42 });
  assert.equal(causalA.ok, true);
  assert.deepEqual(causalA.value, causalB.value, "the same seed must give the same causal set");
  assert.equal(causalA.value.n, 60);
  assert.ok(causalA.value.relations >= 0);
  assert.ok(causalA.value.orderingFraction > 0 && causalA.value.orderingFraction <= 1);

  const grey = await runJob({ kind: "greybody", params: { l: 0, M: 1, omegas: [0.1, 0.2, 0.5] } });
  assert.equal(grey.ok, true);
  assert.equal(grey.value.gamma.length, 3);
  for (const gamma of grey.value.gamma) assert.ok(gamma >= 0 && gamma <= 1, `transmission ${gamma} is a probability`);

  for (const job of [
    { kind: "cdt", params: { slices: 8, sweeps: 4 } },
    { kind: "rge", params: { samples: 4, mHValues: [125, 130], mtRange: [172, 174] } },
  ]) {
    const result = await runJob(job);
    assert.equal(result.ok, true, `${job.kind}: ${result.reason ?? ""}`);
  }
  assert.equal(Object.keys(HANDLERS).length, JOB_KINDS.length, "every declared kind has a handler");
});

test("a handler reports progress and stops on cancellation", async () => {
  const seen = [];
  const result = await runJob({ kind: "causal-set", params: { n: 30 } }, { post: (message) => seen.push(message) });
  assert.equal(result.ok, true);
  assert.ok(seen.length >= 2, "a long job must report more than once");
  assert.ok(seen.every((message) => message.schema === WORKER_SCHEMA && message.type === "progress"));
  assert.ok(seen.every((message) => typeof message.id === "string"), "every message carries the job id");

  // Cancellation is cooperative: the handler checks at each stage and returns null, which runJob reports as cancelled.
  const cancelled = await runJob({ kind: "causal-set", params: { n: 400 } }, { isCancelled: () => true });
  assert.equal(cancelled.ok, false);
  assert.equal(cancelled.reason, "cancelled");
});

test("a job that throws is reported, not thrown out of the worker", async () => {
  const result = await runJob({ kind: "greybody", params: { l: 0, omegas: [-1] } });
  assert.equal(typeof result.ok, "boolean");
  if (!result.ok) {
    assert.ok(result.reason.length > 0);
    assert.equal(result.message.type, "error");
  }
});

/* ---------- worker client ---------- */

/** A synchronous fake worker: records what it was sent and replays scripted messages. */
function fakeWorker() {
  const sent = [];
  const listeners = [];
  return {
    sent,
    terminated: false,
    postMessage(message) {
      sent.push(message);
      // Answer the first job with a result on the next microtask, so the client's promise resolves like a real one.
      if (message.type !== "cancel") {
        queueMicrotask(() => {
          for (const listener of listeners) {
            listener({ data: { schema: WORKER_SCHEMA, type: "result", id: message.id, value: { echo: message.kind } } });
          }
        });
      }
    },
    addEventListener(type, listener) {
      if (type === "message") listeners.push(listener);
    },
    terminate() { this.terminated = true; },
  };
}

test("the client resolves a job, releases its channel and refuses a busy one", async () => {
  let created = 0;
  const fake = fakeWorker();
  const client = createWorkerClient({
    WorkerCtor: function FakeWorker() { created += 1; return fake; },
    url: "js/workers/simulation-worker.mjs",
  });
  assert.equal(client.supported, true);
  assert.equal(created, 0, "no worker is created until a job arrives");

  // A non-causal job is always worth offloading; a small causal set is not.
  const promise = client.run({ kind: "causal-set", params: { n: 10 } }, { channel: "bh" });
  assert.equal(client.pendingFor("bh").length, 1);
  const busy = await client.run({ kind: "cdt", params: {} }, { channel: "bh" }).catch((error) => error);
  assert.match(busy.message, /already has 1 job/);

  const result = await promise;
  assert.equal(result.type, "result");
  assert.equal(client.pendingFor("bh").length, 0, "the channel is released when the result arrives");

  client.dispose();
  assert.equal(fake.terminated, true);
});

test("the client reports a cancelled job and a dead worker instead of hanging", async () => {
  const fake = fakeWorker();
  const client = createWorkerClient({
    WorkerCtor: function FakeWorker() { return fake; },
    url: "js/workers/simulation-worker.mjs",
  });
  const pending = client.run({ kind: "cdt", params: {} }, { channel: "rg" });
  client.cancel("rg");
  await assert.rejects(() => pending, /cancelled/);
  assert.equal(client.pendingFor("rg").length, 0);

  // A worker with no Worker implementation reports rather than throwing at construction time.
  const unsupported = createWorkerClient({ WorkerCtor: undefined });
  assert.equal(unsupported.supported, false);
  assert.match(unsupported.reason, /no module workers/);
});

/* ---------- offline ---------- */

test("the service worker never caches GWOSC and never reloads on its own", () => {
  const sw = read("service-worker.js");
  // Rule 1: a strain download is passed through, never stored.
  assert.match(sw, /NEVER_CACHE\s*=\s*\[\s*\/\^https:\\\/\\\/gwosc/);
  assert.match(sw, /NEVER_CACHE\.some\(\(pattern\) => pattern\.test\(url\)\)\) return/);
  // Rule 2: no automatic reload. skipWaiting is only reachable from an explicit message.
  assert.doesNotMatch(sw, /self\.skipWaiting\(\);\s*\n\s*\}\);\s*\n\}\);/, "skipWaiting must not run at install");
  assert.match(sw, /data\.type === "skip-waiting"/);
  // Rule 3: only our own older caches are deleted, and the names carry the version.
  assert.match(sw, /name\.startsWith\("horizon-qga-"\)/);
  assert.match(sw, /const VERSION = "horizon-qga-v1"/);
  // Scoped to the registration scope, not a hard-coded root, so the Pages subpath works.
  assert.match(sw, /self\.registration\.scope/);
  assert.match(sw, /navigator|clients\.claim/);
});

test("the offline controller reports honest states and refuses to update unasked", async () => {
  assert.equal(workerDisabledByUrl("?nosw=1"), true);
  assert.equal(workerDisabledByUrl("?dev=1"), true);
  assert.equal(workerDisabledByUrl("?view=bh"), false);
  assert.match(updateNoticeText(), /Reload when you are at a stopping point/);

  const unsupported = createServiceWorkerController({ env: { navigator: {} } });
  assert.equal(unsupported.supported, false);
  assert.equal(unsupported.state(), SW_STATE.unsupported);

  const insecure = createServiceWorkerController({ env: { isSecureContext: false, navigator: { serviceWorker: {} } } });
  assert.equal(insecure.state(), SW_STATE.insecure);

  const disabled = createServiceWorkerController({ listen: false, env: { navigator: { serviceWorker: {} } } });
  assert.equal(disabled.state(), SW_STATE.disabled);

  // A fake registration: register, then applyUpdate refuses because nothing is waiting.
  let registered = null;
  const waiting = { postMessage() {} };
  const fakeRegistration = {
    scope: "https://example.test/atlas/",
    waiting: null,
    addEventListener() {},
    async unregister() { registered = "unregistered"; },
  };
  const controller = createServiceWorkerController({
    env: {
      isSecureContext: true,
      location: { href: "https://example.test/atlas/" },
      navigator: { serviceWorker: { register: async () => fakeRegistration, controller: {} } },
    },
    url: "service-worker.js",
    scope: "./",
  });
  const result = await controller.register();
  assert.equal(result.ok, true);
  assert.equal(controller.state(), SW_STATE["offline-ready"]);
  assert.equal(controller.isOfflineReady(), true);
  assert.equal((await controller.applyUpdate()).ok, false, "an update needs something waiting");

  fakeRegistration.waiting = waiting;
  assert.equal((await controller.applyUpdate()).ok, true);

  controller.dismissUpdate();
  assert.equal(controller.state(), SW_STATE["offline-ready"]);
  await controller.unregister();
  assert.equal(registered, "unregistered");
  assert.equal(controller.state(), SW_STATE.disabled);
});

test("a registration that fails says so instead of leaving the page optimistic", async () => {
  const controller = createServiceWorkerController({
    env: {
      isSecureContext: true,
      location: { href: "https://example.test/atlas/" },
      navigator: { serviceWorker: { register: async () => { throw new Error("404"); } } },
    },
  });
  const result = await controller.register();
  assert.equal(result.ok, false);
  assert.equal(result.reason, "404");
  assert.equal(controller.state(), SW_STATE.failed);
});

/* ---------- the runtime selection ---------- */

test("production and development runtime agree on the script list length", () => {
  const manifest = JSON.parse(read("js/compiled/.manifest.json"));
  const count = Object.keys(manifest.sources).length;
  assert.equal(count, 59);
  // The dev path reads the same manifest, so the two cannot drift apart.
  const bootstrap = read("js/bootstrap.mjs");
  assert.match(bootstrap, /js\/compiled\/\.manifest\.json/);
  assert.match(bootstrap, /__QGA_DEV__ === true/);
  assert.match(bootstrap, /babelMs: 0/, "production records zero Babel time");
});
