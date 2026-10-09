import { test } from "node:test";
import assert from "node:assert/strict";
import { isSoftwareRendererName, detectSoftwareRenderer } from "../js/render/software-renderer.mjs";

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
