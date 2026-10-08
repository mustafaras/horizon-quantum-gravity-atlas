const SCIENTIFIC_STATUS_LABELS = Object.freeze([
  "established",
  "effective",
  "conjectural",
  "schematic",
  "heuristic",
  "open",
]);

const RENDER_BACKENDS = Object.freeze(["webgpu", "webgl2", "static"]);
const RENDER_PRESETS = Object.freeze(["low", "medium", "ultra"]);
const LIFECYCLE_ORDER = Object.freeze(["initialize", "resize", "update", "render", "suspend", "resume", "dispose"]);

function typeError(message) {
  return new TypeError(message);
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const key of Reflect.ownKeys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

function expectRecord(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw typeError(`${name} must be an object`);
  }
}

function expectString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw typeError(`${fieldName} must be a non-empty string`);
  }
  return value.trim();
}

function expectBoolean(value, fieldName) {
  if (typeof value !== "boolean") throw typeError(`${fieldName} must be a boolean`);
  return value;
}

function expectInteger(value, fieldName) {
  if (!Number.isInteger(value)) throw typeError(`${fieldName} must be an integer`);
  return value;
}

function expectFinite(value, fieldName) {
  if (!Number.isFinite(value)) throw typeError(`${fieldName} must be a finite number`);
  return value;
}

function expectArrayOfStrings(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw typeError(`${fieldName} must be a non-empty array`);
  }
  return value.map((entry, index) => expectString(entry, `${fieldName}[${index}]`));
}

function expectEnum(value, allowed, fieldName) {
  const normalized = expectString(value, fieldName);
  if (!allowed.includes(normalized)) {
    throw typeError(`${fieldName} must be one of: ${allowed.join(", ")}`);
  }
  return normalized;
}

function expectFunction(value, fieldName) {
  if (typeof value !== "function") throw typeError(`${fieldName} must be a function`);
  return value;
}

/** @typedef {"webgpu" | "webgl2" | "static"} RenderBackend */

/**
 * @typedef {object} RenderQuality
 * @property {"low" | "medium" | "ultra"} preset
 * @property {number} maxDpr
 * @property {number} particleBudget
 * @property {number} raySteps
 * @property {number} temporalSamples
 * @property {boolean} postEffects
 */

/**
 * @typedef {object} RenderCapabilities
 * @property {boolean} hasWebGPU
 * @property {boolean} hasWebGL2
 * @property {RenderBackend | null} forceBackend
 * @property {RenderBackend} requestedBackend
 * @property {RenderBackend} activeBackend
 * @property {boolean} reducedMotion
 * @property {boolean} staticFallback
 * @property {RenderQuality} quality
 */

/**
 * @typedef {object} ScientificProvenance
 * @property {string} model
 * @property {"established" | "effective" | "conjectural" | "schematic" | "heuristic" | "open"} status
 * @property {string[]} assumptions
 * @property {string[]} validity
 * @property {string} numericalMethod
 * @property {string[]} references
 */

/**
 * @typedef {object} VisualizationDescriptor
 * @property {string} id
 * @property {string} title
 * @property {ScientificProvenance} provenance
 * @property {{initialize: Function, resize: Function, update: Function, render: Function, suspend: Function, resume: Function, dispose: Function}} lifecycle
 */

export function validateRenderQuality(value) {
  expectRecord(value, "RenderQuality");
  const normalized = {
    preset: expectEnum(value.preset, RENDER_PRESETS, "RenderQuality.preset"),
    maxDpr: expectFinite(value.maxDpr, "RenderQuality.maxDpr"),
    particleBudget: expectInteger(value.particleBudget, "RenderQuality.particleBudget"),
    raySteps: expectInteger(value.raySteps, "RenderQuality.raySteps"),
    temporalSamples: expectInteger(value.temporalSamples, "RenderQuality.temporalSamples"),
    postEffects: expectBoolean(value.postEffects, "RenderQuality.postEffects"),
  };
  return deepFreeze(normalized);
}

export function validateRenderCapabilities(value) {
  expectRecord(value, "RenderCapabilities");
  const normalized = {
    hasWebGPU: expectBoolean(value.hasWebGPU, "RenderCapabilities.hasWebGPU"),
    hasWebGL2: expectBoolean(value.hasWebGL2, "RenderCapabilities.hasWebGL2"),
    forceBackend: value.forceBackend == null
      ? null
      : expectEnum(value.forceBackend, RENDER_BACKENDS, "RenderCapabilities.forceBackend"),
    requestedBackend: expectEnum(value.requestedBackend, RENDER_BACKENDS, "RenderCapabilities.requestedBackend"),
    activeBackend: expectEnum(value.activeBackend, RENDER_BACKENDS, "RenderCapabilities.activeBackend"),
    reducedMotion: expectBoolean(value.reducedMotion, "RenderCapabilities.reducedMotion"),
    staticFallback: expectBoolean(value.staticFallback, "RenderCapabilities.staticFallback"),
    quality: validateRenderQuality(value.quality),
  };
  if (normalized.activeBackend === "static" && normalized.staticFallback !== true) {
    throw typeError("RenderCapabilities.staticFallback must be true when activeBackend is static");
  }
  return deepFreeze(normalized);
}

export function validateScientificProvenance(value) {
  expectRecord(value, "ScientificProvenance");
  const normalized = {
    model: expectString(value.model, "ScientificProvenance.model"),
    status: expectEnum(value.status, SCIENTIFIC_STATUS_LABELS, "ScientificProvenance.status"),
    assumptions: expectArrayOfStrings(value.assumptions, "ScientificProvenance.assumptions"),
    validity: expectArrayOfStrings(value.validity, "ScientificProvenance.validity"),
    numericalMethod: expectString(value.numericalMethod, "ScientificProvenance.numericalMethod"),
    references: expectArrayOfStrings(value.references, "ScientificProvenance.references"),
  };
  return deepFreeze(normalized);
}

export function validateVisualizationDescriptor(value) {
  expectRecord(value, "VisualizationDescriptor");
  const lifecycle = value.lifecycle;
  expectRecord(lifecycle, "VisualizationDescriptor.lifecycle");
  const normalized = {
    id: expectString(value.id, "VisualizationDescriptor.id"),
    title: expectString(value.title, "VisualizationDescriptor.title"),
    provenance: validateScientificProvenance(value.provenance),
    lifecycle: Object.fromEntries(
      LIFECYCLE_ORDER.map((name) => [
        name,
        expectFunction(lifecycle[name], `VisualizationDescriptor.lifecycle.${name}`),
      ]),
    ),
  };
  return deepFreeze(normalized);
}

export {
  LIFECYCLE_ORDER,
  RENDER_BACKENDS,
  RENDER_PRESETS,
  SCIENTIFIC_STATUS_LABELS,
  deepFreeze,
};
