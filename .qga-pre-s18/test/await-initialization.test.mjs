import { test } from "node:test";
import assert from "node:assert/strict";
import { awaitInitialization } from "../js/render/await-initialization.mjs";

test("bounded initialization resolves normally and preserves failures", async () => {
  assert.equal(await awaitInitialization(Promise.resolve("ready")), "ready");
  await assert.rejects(awaitInitialization(Promise.reject(new Error("driver failure"))), /driver failure/);
});
test("abort releases late owned GPU results without unhandled rejection", async () => {
  const abort = new AbortController();
  let resolve, released = 0;
  const pending = new Promise((value) => { resolve = value; });
  const result = awaitInitialization(pending, { signal: abort.signal, onLateResult: () => { released++; } });
  abort.abort();
  await assert.rejects(result, { name: "AbortError" });
  resolve("device");
  await Promise.resolve();
  assert.equal(released, 1);
});
test("timeout surfaces the stage and late failures remain handled", async () => {
  let reject;
  const pending = new Promise((_, fail) => { reject = fail; });
  await assert.rejects(awaitInitialization(pending, { timeoutMs: 5, label: "adapter request" }), /adapter request timed out/);
  reject(new Error("late failure"));
  await Promise.resolve();
});
