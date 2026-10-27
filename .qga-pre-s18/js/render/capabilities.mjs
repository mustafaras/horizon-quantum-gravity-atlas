import { validateRenderCapabilities, deepFreeze } from "./contracts.mjs";

const QUALITY_PRESETS = Object.freeze({
  low: Object.freeze({ maxDpr: 1, particleBudget: 4000, raySteps: 48, temporalSamples: 1, postEffects: false }),
  medium: Object.freeze({ maxDpr: 1.5, particleBudget: 12000, raySteps: 96, temporalSamples: 2, postEffects: true }),
  ultra: Object.freeze({ maxDpr: 2, particleBudget: 24000, raySteps: 160, temporalSamples: 4, postEffects: true }),
});

function normalizeBackendOverride(forceBackend) {
  return forceBackend == null ? null : String(forceBackend).toLowerCase();
}

export function detectRequestedBackend({ hasWebGPU = false, hasWebGL2 = false, forceBackend = null } = {}) {
  const override = normalizeBackendOverride(forceBackend);
  if (override === "static") return "static";
  if (override === "webgpu") return hasWebGPU ? "webgpu" : hasWebGL2 ? "webgl2" : "static";
  if (override === "webgl2") return hasWebGL2 ? "webgl2" : "static";
  return hasWebGPU ? "webgpu" : hasWebGL2 ? "webgl2" : "static";
}

export function normalizeRenderQuality({ preset = "medium", devicePixelRatio = 1, reducedMotion = false } = {}) {
  const selectedPreset = Object.hasOwn(QUALITY_PRESETS, preset) ? preset : "medium";
  const base = QUALITY_PRESETS[selectedPreset];
  const maxDpr = Math.min(base.maxDpr, Math.max(1, Number(devicePixelRatio) || 1));
  return deepFreeze({
    preset: selectedPreset,
    maxDpr,
    particleBudget: base.particleBudget,
    raySteps: base.raySteps,
    temporalSamples: reducedMotion ? 1 : base.temporalSamples,
    postEffects: reducedMotion ? false : base.postEffects,
  });
}

export function normalizeRenderCapabilities({
  hasWebGPU = false,
  hasWebGL2 = false,
  forceBackend = null,
  qualityPreset = "medium",
  devicePixelRatio = 1,
  reducedMotion = false,
} = {}) {
  const requestedBackend = detectRequestedBackend({ hasWebGPU, hasWebGL2, forceBackend });
  return validateRenderCapabilities({
    hasWebGPU: !!hasWebGPU,
    hasWebGL2: !!hasWebGL2,
    forceBackend: normalizeBackendOverride(forceBackend),
    requestedBackend,
    activeBackend: requestedBackend,
    reducedMotion: !!reducedMotion,
    staticFallback: requestedBackend === "static",
    quality: normalizeRenderQuality({ preset: qualityPreset, devicePixelRatio, reducedMotion }),
  });
}

export { QUALITY_PRESETS };
