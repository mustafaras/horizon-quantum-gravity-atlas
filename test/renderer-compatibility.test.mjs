import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectSceneCompatibility, createRenderer } from "../js/render/create-renderer.mjs";

const sceneWith = (...materials) => ({ traverse: (fn) => fn({ material: materials }) });
test("only pinned standard mapped/node materials qualify; raw shaders never do", () => {
  assert.equal(inspectSceneCompatibility(sceneWith({ type: "MeshStandardMaterial" }, { isNodeMaterial: true })).nodeCompatible, true);
  assert.deepEqual(inspectSceneCompatibility(sceneWith({ type: "ShaderMaterial" }, { type: "RawShaderMaterial" })).unsupported, ["ShaderMaterial", "RawShaderMaterial"]);
  assert.equal(inspectSceneCompatibility(sceneWith({ type: "MeshBasicMaterial", onBeforeCompile() {} })).nodeCompatible, false);
  assert.equal(inspectSceneCompatibility(null).nodeCompatible, false);
});
test("static factory is explicit, frozen and requires no canvas or GPU", async () => {
  const result = await createRenderer({ forceBackend: "static" });
  assert.equal(result.backend, "static");
  assert.equal(result.renderer, null);
  assert.equal(result.capabilities.staticFallback, true);
  assert.ok(Object.isFrozen(result.capabilities));
  assert.match(result.capabilities.diagnostics[0], /explicitly/);
  await result.dispose();
});
test("invalid options and cancellation are surfaced", async () => {
  await assert.rejects(createRenderer({ forceBackend: "invalid" }), /forceBackend/);
  await assert.rejects(createRenderer({ toneMapping: "fake" }), /toneMapping/);
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(createRenderer({ signal: abort.signal }), { name: "AbortError" });
});
