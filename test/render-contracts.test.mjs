import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeRenderCapabilities,
  detectRequestedBackend,
  normalizeRenderQuality,
} from "../js/render/capabilities.mjs";
import {
  validateRenderCapabilities,
  validateRenderQuality,
  validateScientificProvenance,
  validateVisualizationDescriptor,
} from "../js/render/contracts.mjs";

test("detectRequestedBackend prefers WebGPU when available", () => {
  assert.equal(detectRequestedBackend({ hasWebGPU: true, hasWebGL2: true }), "webgpu");
});

test("detectRequestedBackend honors a forced WebGL2 backend", () => {
  assert.equal(detectRequestedBackend({ hasWebGPU: true, hasWebGL2: true, forceBackend: "webgl2" }), "webgl2");
});

test("detectRequestedBackend falls back to static when GPU APIs are absent", () => {
  assert.equal(detectRequestedBackend({ hasWebGPU: false, hasWebGL2: false }), "static");
});

test("normalizeRenderQuality lowers motion-heavy settings in reduced-motion mode", () => {
  const quality = normalizeRenderQuality({ preset: "ultra", devicePixelRatio: 3, reducedMotion: true });
  assert.deepEqual(quality, {
    preset: "ultra",
    maxDpr: 2,
    particleBudget: 24000,
    raySteps: 160,
    temporalSamples: 1,
    postEffects: false,
  });
});

test("normalizeRenderQuality is deterministic for a preset and DPR", () => {
  const first = normalizeRenderQuality({ preset: "medium", devicePixelRatio: 1.75, reducedMotion: false });
  const second = normalizeRenderQuality({ preset: "medium", devicePixelRatio: 1.75, reducedMotion: false });
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  assert.throws(() => {
    first.maxDpr = 99;
  }, TypeError);
});

test("normalizeRenderCapabilities returns immutable normalized results", () => {
  const capabilities = normalizeRenderCapabilities({
    hasWebGPU: false,
    hasWebGL2: true,
    forceBackend: "webgl2",
    qualityPreset: "low",
    devicePixelRatio: 2.5,
    reducedMotion: false,
  });
  assert.equal(capabilities.requestedBackend, "webgl2");
  assert.equal(capabilities.activeBackend, "webgl2");
  assert.equal(capabilities.staticFallback, false);
  assert.equal(capabilities.quality.maxDpr, 1);
  assert.throws(() => {
    capabilities.quality = null;
  }, TypeError);
});

test("validateScientificProvenance reports missing field names", () => {
  assert.throws(
    () => validateScientificProvenance({
      model: "Kerr",
      status: "established",
      assumptions: ["stationary vacuum"],
      validity: ["outside the horizon"],
      references: ["Wald (1984)"],
    }),
    (error) => error instanceof TypeError && /numericalMethod/.test(error.message),
  );
});

test("validateScientificProvenance rejects invalid status labels", () => {
  assert.throws(
    () => validateScientificProvenance({
      model: "Toy",
      status: "observed",
      assumptions: ["none"],
      validity: ["nowhere"],
      numericalMethod: "analytic",
      references: ["Example"],
    }),
    /status/,
  );
});

test("runtime validators normalize and freeze contract values", () => {
  const quality = validateRenderQuality(normalizeRenderQuality({ preset: "low", devicePixelRatio: 4 }));
  const capabilities = validateRenderCapabilities(normalizeRenderCapabilities({ hasWebGL2: true, devicePixelRatio: 2 }));
  const descriptor = validateVisualizationDescriptor({
    id: "atlas-stage",
    title: "Atlas Stage",
    provenance: {
      model: "Decorative scene backdrop",
      status: "schematic",
      assumptions: ["non-scientific ambiance only"],
      validity: ["background separation from scientific instruments"],
      numericalMethod: "deterministic animation curves",
      references: ["Internal atlas contract"],
    },
    lifecycle: {
      initialize() {},
      resize() {},
      update() {},
      render() {},
      suspend() {},
      resume() {},
      dispose() {},
    },
  });

  assert.equal(quality.preset, "low");
  assert.equal(capabilities.activeBackend, "webgl2");
  assert.equal(descriptor.lifecycle.render.name, "render");
  assert.throws(() => {
    descriptor.provenance.references.push("mutation");
  }, TypeError);
});
