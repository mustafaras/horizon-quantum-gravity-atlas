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

test("engraved node lines make a scene node-only: it has no classic fallback attempt", async () => {
  const lines = sceneWith({ type: "Line2NodeMaterial", isNodeMaterial: true, isLine2NodeMaterial: true });
  const result = inspectSceneCompatibility(lines);
  assert.equal(result.nodeCompatible, true);
  assert.equal(result.nodeOnly, true);
  assert.equal(inspectSceneCompatibility(sceneWith({ type: "MeshStandardMaterial" })).nodeOnly, false);
  // A classic engraved line is a ShaderMaterial (LineMaterial): the scene is classic-only, never node.
  const classic = inspectSceneCompatibility(sceneWith({ type: "LineMaterial", isShaderMaterial: true }));
  assert.equal(classic.nodeCompatible, false);
  assert.equal(classic.nodeOnly, false);
  // With no WebGPU a node-only scene must fail visibly (Scene3D then rebuilds it on classic lines) instead of
  // handing node materials to the classic WebGLRenderer.
  const outcome = await createRenderer({ scene: lines, camera: {} });
  assert.equal(outcome.backend, "static");
  assert.ok(outcome.capabilities.diagnostics.some((message) => /webgpu initialization/i.test(message)), outcome.capabilities.diagnostics.join(" | "));
  assert.ok(!outcome.capabilities.diagnostics.some((message) => /webgl2 initialization/i.test(message)), "no classic retry");
});

test("a scene built from the TSL material kit is node-only, and without WebGPU it attempts the node renderer's WebGL2 backend, never the classic one (S07)", async () => {
  const kit = sceneWith({ type: "MeshBasicNodeMaterial", isNodeMaterial: true, userData: { qgaNodeKit: true } });
  const result = inspectSceneCompatibility(kit);
  assert.equal(result.nodeCompatible, true);
  assert.equal(result.nodeOnly, true);
  assert.equal(result.kit, true);
  const lines = inspectSceneCompatibility(sceneWith({ type: "Line2NodeMaterial", isNodeMaterial: true, isLine2NodeMaterial: true }));
  assert.equal(lines.kit, false, "engraved node lines alone are not a kit scene: they keep their classic recovery");
  // No navigator.gpu here: the one attempt is "node-webgl2". It cannot construct in Node (no canvas), so it fails visibly.
  const outcome = await createRenderer({ scene: kit, camera: {} });
  assert.equal(outcome.backend, "static");
  const diagnostics = outcome.capabilities.diagnostics.join(" | ");
  assert.match(diagnostics, /node renderer on its WebGL2 backend/i, diagnostics);
  assert.match(diagnostics, /node-webgl2 initialization\/compile failed/i, diagnostics);
  assert.ok(!/webgl2 initialization/i.test(diagnostics.replace(/node-webgl2 initialization/gi, "")), "no classic retry");
  // WebGL2 forced is the same attempt, not a classic one.
  const forced = await createRenderer({ scene: kit, camera: {}, forceBackend: "webgl2" });
  assert.match(forced.capabilities.diagnostics.join(" | "), /node renderer on its WebGL2 backend/i);
});
