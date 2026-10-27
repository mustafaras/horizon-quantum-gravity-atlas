import { test } from "node:test";
import assert from "node:assert/strict";
import { prewarmShaders, invalidatePrewarm } from "../js/render/shader-prewarm.mjs";

function fixture() {
  let compiled = 0, warmed = 0;
  const material = { uuid: "one", version: 0, customProgramCacheKey: () => "variant" };
  const scene = { traverse: (fn) => fn({ material }) };
  const renderer = { compileAsync: async () => { compiled++; } };
  const pipeline = { prewarm: async () => { warmed++; } };
  return { renderer, scene, pipeline, material, count: () => [compiled, warmed], backend: "webgl2", view: "gr", quality: { preset: "medium", maxDpr: 1.5 } };
}
test("prewarm keys scope completion to renderer, scene, pipeline, material and full quality", async () => {
  const f = fixture();
  await prewarmShaders(f);
  await prewarmShaders(f);
  assert.deepEqual(f.count(), [1, 1]);
  f.material.version++;
  await prewarmShaders(f);
  await prewarmShaders({ ...f, quality: { ...f.quality, maxDpr: 1 } });
  await prewarmShaders({ ...f, view: "bh" });
  invalidatePrewarm(f.renderer);
  await prewarmShaders(f);
  assert.deepEqual(f.count(), [5, 5]);
  await prewarmShaders({ ...f, pipeline: { prewarm: async () => {} } });
  assert.equal(f.count()[0], 6);
});
test("abort and failed shaders never leave successful cache entries", async () => {
  const f = fixture();
  const abort = new AbortController();
  f.renderer.compileAsync = async () => { abort.abort(); };
  await assert.rejects(prewarmShaders({ ...f, signal: abort.signal }), { name: "AbortError" });
  f.renderer.compileAsync = async () => { throw new Error("shader failure"); };
  await assert.rejects(prewarmShaders(f), /shader failure/);
  let count = 0;
  f.renderer.compileAsync = async () => { count++; };
  await prewarmShaders(f);
  assert.equal(count, 1);
});
