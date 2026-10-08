import { WebGLRenderer, SRGBColorSpace, AgXToneMapping, NeutralToneMapping } from "three";
import { normalizeRenderQuality } from "./capabilities.mjs";
import { abortIfNeeded, invalidatePrewarm } from "./shader-prewarm.mjs";
import { awaitInitialization } from "./await-initialization.mjs";

const NODE_TYPES = new Set([
  "MeshPhongMaterial", "MeshStandardMaterial", "MeshPhysicalMaterial", "MeshToonMaterial",
  "MeshBasicMaterial", "MeshLambertMaterial", "MeshNormalMaterial", "MeshMatcapMaterial",
  "LineBasicMaterial", "LineDashedMaterial", "PointsMaterial", "SpriteMaterial", "ShadowMaterial",
]);
let gpuInitializationQueue = Promise.resolve();
let sharedGPU = null;

function initializeGPU(operation) {
  const result = gpuInitializationQueue.then(operation);
  gpuInitializationQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function acquireGPUDevice({ signal, powerPreference, onError }) {
  if (!sharedGPU) {
    const request = powerPreference ? navigator.gpu.requestAdapter({ powerPreference }) : navigator.gpu.requestAdapter();
    const adapter = await awaitInitialization(request, { signal, label: "WebGPU adapter request" });
    if (!adapter) throw new Error("WebGPU adapter unavailable");
    const device = await awaitInitialization(adapter.requestDevice({ requiredFeatures: [...adapter.features] }), {
      signal, label: "WebGPU device request", onLateResult: (lateDevice) => lateDevice.destroy(),
    });
    const record = { device, leases: new Set() };
    sharedGPU = record;
    void device.lost.then(() => { if (sharedGPU === record) sharedGPU = null; });
  }
  const record = sharedGPU;
  const lease = { onError };
  record.leases.add(lease);
  let released = false;
  return {
    device: record.device,
    routeErrors() {
      record.device.onuncapturederror = (event) => {
        for (const listener of record.leases) listener.onError(new Error(`GPU ${event.error.constructor.name}: ${event.error.message}`));
      };
    },
    release() {
      if (released) return;
      released = true;
      record.leases.delete(lease);
      if (record.leases.size === 0) {
        if (sharedGPU === record) sharedGPU = null;
        record.device.onuncapturederror = null;
        record.device.destroy();
      }
    },
  };
}

export function inspectSceneCompatibility(scene) {
  const unsupported = new Set();
  scene?.traverse((object) => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (material && !material.isNodeMaterial && !NODE_TYPES.has(material.type)) unsupported.add(material.type);
      if (material && Object.hasOwn(material, "onBeforeCompile")) unsupported.add("onBeforeCompile GLSL hook");
    }
  });
  return Object.freeze({ nodeCompatible: !!scene && unsupported.size === 0, unsupported: [...unsupported] });
}

export async function createRenderer({
  canvas, quality = normalizeRenderQuality(), alpha = true, antialias = true,
  powerPreference, forceBackend = null, scene, camera,
  signal, toneMapping = "agx", onDiagnostic = () => {}, onDeviceLost = () => {},
  reducedMotion = false,
  shadows = false,
} = {}) {
  abortIfNeeded(signal);
  if (!["agx", "neutral"].includes(toneMapping)) throw new RangeError("toneMapping must be agx or neutral");
  if (![null, "webgpu", "webgl2", "static"].includes(forceBackend)) throw new RangeError("Invalid forceBackend");
  const hasWebGPU = !!globalThis.navigator?.gpu;
  let hasWebGL2 = false;
  const compatibility = inspectSceneCompatibility(scene);
  const diagnostics = [];
  const report = (message) => { diagnostics.push(message); onDiagnostic(message); };
  const capabilities = (activeBackend, renderer) => Object.freeze({
    hasWebGPU, hasWebGL2, forceBackend, reducedMotion,
    requestedBackend: forceBackend ?? (hasWebGPU ? "webgpu" : "webgl2"),
    activeBackend, staticFallback: activeBackend === "static", quality,
    nodeCompatible: compatibility.nodeCompatible, unsupportedMaterials: compatibility.unsupported,
    rendererPath: renderer?.isWebGPURenderer ? "nodes" : renderer ? "classic" : "static",
    shadowsEnabled: !!renderer?.shadowMap.enabled,
    diagnostics: Object.freeze([...diagnostics]),
  });
  if (forceBackend === "static") {
    report("Static rendering explicitly requested. Analytical content remains available.");
    return { renderer: null, backend: "static", capabilities: capabilities("static"), dispose: async () => {} };
  }
  if (hasWebGPU && !compatibility.nodeCompatible) report(`Classic WebGL2 required by ${compatibility.unsupported.join(", ") || "unclassified scene"}.`);
  const attempts = hasWebGPU && compatibility.nodeCompatible && forceBackend !== "webgl2"
    ? ["webgpu", "webgl2"] : ["webgl2"];
  for (const requested of attempts) {
    let renderer, deviceLease, initialization;
    try {
      abortIfNeeded(signal);
      if (requested === "webgpu") {
        report("Initializing WebGPU; awaiting adapter and device.");
        const { WebGPURenderer } = await import("three/webgpu");
        report("WebGPU module loaded; creating renderer.");
        await initializeGPU(async () => {
        abortIfNeeded(signal);
        if (document.readyState !== "complete") {
          let loaded;
          const readiness = new Promise((resolve) => { loaded = resolve; window.addEventListener("load", loaded, { once: true }); });
          try { await awaitInitialization(readiness, { signal, label: "Document readiness for WebGPU" }); }
          finally { window.removeEventListener("load", loaded); }
        }
        deviceLease = await acquireGPUDevice({ signal, powerPreference, onError: onDeviceLost });
        renderer = new WebGPURenderer({ canvas, alpha, antialias, powerPreference, device: deviceLease.device });
        renderer.onDeviceLost = (info) => onDeviceLost(new Error(`GPU device lost: ${info.message || info.reason}`));
        renderer.onError = (info) => onDeviceLost(new Error(`GPU ${info.type}: ${info.message}`));
        report("WebGPU renderer created; awaiting init().");
        initialization = renderer.init();
        await awaitInitialization(initialization, { signal, label: "WebGPU renderer initialization",
          onLateResult: () => { void renderer.dispose().catch((error) => report(`Late GPU cleanup failed: ${error.message}`)); },
        });
        deviceLease.routeErrors();
        });
        report("Node renderer initialization completed; compiling current scene shaders.");
      } else {
        canvas ??= document.createElement("canvas");
        const context = canvas.getContext("webgl2", { alpha, antialias, powerPreference, preserveDrawingBuffer: true });
        if (!context) throw new Error("WebGL2 context unavailable");
        hasWebGL2 = true;
        renderer = new WebGLRenderer({ canvas, context, alpha, antialias, powerPreference, preserveDrawingBuffer: true });
        renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
          throw new Error(`Shader compilation failed: ${gl.getProgramInfoLog(program)} ${gl.getShaderInfoLog(vertex)} ${gl.getShaderInfoLog(fragment)}`);
        };
      }
      abortIfNeeded(signal);
      const backend = renderer.isWebGPURenderer
        ? renderer.backend.isWebGPUBackend ? "webgpu" : "webgl2" : "webgl2";
      if (backend === "webgl2") hasWebGL2 = true;
      if (requested === "webgpu" && backend !== "webgpu") report("WebGPU initialization unavailable; Three.js initialized its WebGL2 node backend (one upstream fallback).");
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = toneMapping === "neutral" ? NeutralToneMapping : AgXToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.shadowMap.enabled = !!shadows;
      renderer.setPixelRatio(quality.maxDpr);
      if (scene && camera) await renderer.compileAsync(scene, camera);
      report(`${backend} scene compilation completed.`);
      abortIfNeeded(signal);
      let disposed = false;
      return {
        renderer, backend, capabilities: capabilities(backend, renderer),
        async dispose() {
          if (disposed) return;
          disposed = true;
          invalidatePrewarm(renderer);
          try { await renderer.dispose(); }
          finally {
            renderer.onDeviceLost = () => {};
            deviceLease?.release();
          }
        },
      };
    } catch (error) {
      try {
        if (renderer) {
          invalidatePrewarm(renderer);
          // r186 dispose() calls setAnimationLoop(), which awaits init().
          // Do not call it on a rejected/pending node initialization.
          if (!renderer.isWebGPURenderer || renderer.initialized) await renderer.dispose();
        }
      } finally {
        if (renderer?.isWebGPURenderer) renderer.onDeviceLost = () => {};
        deviceLease?.release();
      }
      if (error.name === "AbortError") throw error;
      report(`${requested} initialization/compile failed: ${error.message}. ${requested === "webgpu" ? "Retrying classic WebGL2 once." : "Use a WebGL2-enabled browser or enable hardware acceleration; analytical content is still available."}`);
      // A canvas with an established WebGPU context cannot subsequently acquire WebGL2.
      if (requested === "webgpu" && canvas) canvas = canvas.cloneNode(false);
    }
  }
  return { renderer: null, backend: "static", capabilities: capabilities("static"), dispose: async () => {} };
}
