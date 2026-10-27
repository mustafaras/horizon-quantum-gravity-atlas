import { test } from "node:test";
import assert from "node:assert/strict";
import { isSoftwareRendererName, detectSoftwareRenderer, softwareRendererClamp } from "../js/render/software-renderer.mjs";

test("CPU rasterizer renderer strings are classified as software", () => {
  for (const name of [
    "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) (0x0000C0DE)), SwiftShader driver)",
    "llvmpipe (LLVM 15.0.7, 256 bits)",
    "Mesa softpipe",
    "ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0)",
  ]) assert.equal(isSoftwareRendererName(name), true, name);
});

test("hardware renderer strings and missing values are not software", () => {
  for (const name of ["ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)",
    "ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)", "", null, undefined]) {
    assert.equal(isSoftwareRendererName(name), false, String(name));
  }
});

test("detection without a DOM degrades to hardware", () => {
  assert.equal(detectSoftwareRenderer(), null);
});

test("the clamp reports the rasterizer and honours the softwareClamp opt-out", async () => {
  const originalDocument = globalThis.document;
  const originalOptions = globalThis.QGA_RENDER_OPTIONS;
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({
        getExtension: (name) => (name === "WEBGL_debug_renderer_info" ? { UNMASKED_RENDERER_WEBGL: 0x9246 } : null),
        getParameter: () => "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0)), SwiftShader driver)",
        RENDERER: 0x1f01,
      }),
    }),
  };
  try {
    // A distinct module instance so the detection cache stays private to this
    // test and the DOM-free assertions above keep their meaning.
    const fresh = await import("../js/render/software-renderer.mjs?clamp-opt-out");
    globalThis.QGA_RENDER_OPTIONS = {};
    assert.match(fresh.softwareRendererClamp(), /SwiftShader/);
    globalThis.QGA_RENDER_OPTIONS = { softwareClamp: false };
    assert.equal(fresh.softwareRendererClamp(), null);
    globalThis.QGA_RENDER_OPTIONS = { softwareClamp: true };
    assert.match(fresh.softwareRendererClamp(), /SwiftShader/);
  } finally {
    if (originalOptions === undefined) delete globalThis.QGA_RENDER_OPTIONS;
    else globalThis.QGA_RENDER_OPTIONS = originalOptions;
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

test("the clamp is the same policy the render session applies", () => {
  // No DOM in Node, so both agree on "no rasterizer detected" — the point is
  // that the session and every module read the clamp through one function.
  assert.equal(softwareRendererClamp(), detectSoftwareRenderer());
});
