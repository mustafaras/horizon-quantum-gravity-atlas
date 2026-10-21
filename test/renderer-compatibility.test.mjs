import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectSceneCompatibility, createRenderer, isTeardownNoise } from "../js/render/create-renderer.mjs";

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
test("teardown races are classified as noise, real defects are not", () => {
  // A buffer freed while a submit that references it is still in flight can
  // only mean a scene is being torn down; it must never blank a live renderer.
  assert.equal(isTeardownNoise("[Buffer (unlabeled)] used in submit while destroyed."), true);
  assert.equal(isTeardownNoise("Buffer used in submit while destroyed"), true);
  assert.equal(isTeardownNoise("Texture destroyed while in use by a bind group"), true);
  assert.equal(isTeardownNoise("Instance dropped in popErrorScope"), true);
  // Genuine defects must still reach the leases.
  assert.equal(isTeardownNoise("Vertex buffer slot 0 is missing"), false);
  assert.equal(isTeardownNoise("Shader module compilation failed"), false);
  assert.equal(isTeardownNoise(""), false);
  assert.equal(isTeardownNoise(undefined), false);
});
