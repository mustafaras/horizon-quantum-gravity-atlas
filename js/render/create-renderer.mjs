import { WebGLRenderer, SRGBColorSpace, AgXToneMapping, NeutralToneMapping } from "three";
import { normalizeRenderQuality } from "./capabilities.mjs";
import { abortIfNeeded, invalidatePrewarm } from "./shader-prewarm.mjs";
import { awaitInitialization } from "./await-initialization.mjs";
import { attachWebGPUValidation, drainWebGPUValidation } from "./webgpu-validation.mjs";
import { retainRenderer } from "./renderer-census.mjs";

const NODE_TYPES = new Set([
  "MeshPhongMaterial", "MeshStandardMaterial", "MeshPhysicalMaterial", "MeshToonMaterial",
  "MeshBasicMaterial", "MeshLambertMaterial", "MeshNormalMaterial", "MeshMatcapMaterial",
  "LineBasicMaterial", "LineDashedMaterial", "PointsMaterial", "SpriteMaterial", "ShadowMaterial",
]);
let gpuInitializationQueue = Promise.resolve();
let sharedGPU = null;
const TEARDOWN_BUDGET_MS = 10_000;

/**
 * A resource destroyed while a submit that still references it is in flight is
 * always teardown noise. three r186 frees buffers synchronously on dispose and
 * never waits for submitted work, so this can only mean "a scene is being torn
 * down", never "the live scene is broken". The time-based quiet window below
 * cannot cover it on its own: the pipeline releases its render targets before
 * the renderer opens that window, and a submit encoded just before teardown can
 * land after it closes. Broadcasting it would blank the always-mounted backdrop
 * for a scene that is merely unmounting.
 */
const TEARDOWN_NOISE = /used in submit while destroyed|destroyed while (?:in use|submitted)|Instance dropped in popErrorScope/i;

/** True when a GPU error message can only describe a teardown race. */
export function isTeardownNoise(message) {
  return TEARDOWN_NOISE.test(String(message ?? ""));
}

/**
 * Chromium resolves popErrorScope() asynchronously and r186 pops scopes on
 * pipeline creation without awaiting those promises. Destroying a GPUDevice
 * with unresolved scopes makes Chromium log "Instance dropped in popErrorScope"
 * once per pending scope, which strict QA error predicates correctly treat as a
 * failure. Settle everything we track and give Dawn a queue tick to resolve the
 * rest before the device goes away. Both waits are bounded so teardown can
 * never hang on a lost or wedged device.
 */
async function quiesceGPUDevice(device) {
  if (!device || typeof device.destroy !== "function") return;
  try { await drainWebGPUValidation(device, { timeoutMs: TEARDOWN_BUDGET_MS }); } catch { /* teardown must not throw */ }
  try {
    const flush = device.queue?.onSubmittedWorkDone?.();
    if (flush) {
      let timer;
      await Promise.race([
        flush.then(() => undefined, () => undefined),
        new Promise((resolve) => { timer = setTimeout(resolve, TEARDOWN_BUDGET_MS); }),
      ]);
      clearTimeout(timer);
    }
  } catch { /* teardown must not throw */ }
}

/**
 * Wait (bounded) for the renderer's GPU queue to drain. three r186 destroys
 * buffers synchronously on dispose events and never waits for submitted
 * work, so callers must drain the queue before releasing any resources an
 * in-flight frame may still reference ("used in submit while destroyed").
 */
export async function quiesceRendererQueue(renderer, timeoutMs = 2000) {
  const flush = renderer?.isWebGPURenderer ? renderer.backend?.device?.queue?.onSubmittedWorkDone?.() : null;
  if (!flush) return;
  let timer;
  try {
    await Promise.race([
      flush.then(() => undefined, () => undefined),
      new Promise((resolve) => { timer = setTimeout(resolve, timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}

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
      signal, label: "WebGPU device request",
      onLateResult: (lateDevice) => { void quiesceGPUDevice(lateDevice).then(() => lateDevice.destroy()); },
    });
    const record = { device, leases: new Set(), quietUntil: 0 };
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
        const name = event.error?.constructor?.name || "GPUError";
        const message = event.error?.message || "";
        // Teardown races are never a live-scene defect, so they are dropped
        // regardless of the quiet window (see TEARDOWN_NOISE).
        if (isTeardownNoise(message)) return;
        // Transient validation/internal errors raised while some scene is
        // mid-teardown are that scene's teardown noise; broadcasting them
        // would blank the always-mounted backdrop for unrelated scenes.
        if (/Validation|Internal/.test(name) && Date.now() < record.quietUntil) return;
        for (const listener of record.leases) listener.onError(new Error(`GPU ${name}: ${message}`));
      };
    },
    beginQuiet() { record.quietUntil = Math.max(record.quietUntil, Date.now() + 2500); },
    async release() {
      if (released) return;
      released = true;
      record.quietUntil = Math.max(record.quietUntil, Date.now() + 2500);
      record.leases.delete(lease);
      if (record.leases.size === 0) {
        if (sharedGPU === record) sharedGPU = null;
        record.device.onuncapturederror = null;
        await quiesceGPUDevice(record.device);
        record.device.destroy();
      }
    },
  };
}

export function inspectSceneCompatibility(scene) {
  const unsupported = new Set();
  let nodeOnly = false;
  scene?.traverse((object) => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      // Node-only materials (engraved Line2NodeMaterial lines) cannot be drawn by the classic WebGLRenderer.
      if (material?.isLine2NodeMaterial) nodeOnly = true;
      if (material && !material.isNodeMaterial && !NODE_TYPES.has(material.type)) unsupported.add(material.type);
      if (material && Object.hasOwn(material, "onBeforeCompile")) unsupported.add("onBeforeCompile GLSL hook");
    }
  });
  return Object.freeze({ nodeCompatible: !!scene && unsupported.size === 0, unsupported: [...unsupported], nodeOnly });
}

export async function createRenderer({
  canvas, quality = normalizeRenderQuality(), alpha = true, antialias = true,
  powerPreference, forceBackend = null, scene, camera,
  signal, toneMapping = "agx", onDiagnostic = () => {}, onDeviceLost = () => {},
  reducedMotion = false,
  shadows = false,
  trackTimestamp = false,
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
  // A scene with node-only materials has no classic fallback; Scene3D rebuilds it on classic lines instead.
  const attempts = compatibility.nodeOnly ? ["webgpu"]
    : hasWebGPU && compatibility.nodeCompatible && forceBackend !== "webgl2" ? ["webgpu", "webgl2"] : ["webgl2"];
  for (const requested of attempts) {
    let renderer, deviceLease, initialization, releaseCensus = () => {};
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
        renderer = new WebGPURenderer({ canvas, alpha, antialias, powerPreference, device: deviceLease.device, trackTimestamp });
        releaseCensus = retainRenderer(renderer);
        renderer.onDeviceLost = (info) => onDeviceLost(new Error(`GPU device lost: ${info.message || info.reason}`));
        renderer.onError = (info) => onDeviceLost(new Error(`GPU ${info.type}: ${info.message}`));
        report("WebGPU renderer created; awaiting init().");
        initialization = renderer.init();
        await awaitInitialization(initialization, { signal, label: "WebGPU renderer initialization",
          onLateResult: () => { void renderer.dispose().catch((error) => report(`Late GPU cleanup failed: ${error.message}`)); },
        });
        if (renderer.backend.isWebGPUBackend) await attachWebGPUValidation(renderer);
        deviceLease.routeErrors();
        });
        report("Node renderer initialization completed; compiling current scene shaders.");
      } else {
        canvas ??= document.createElement("canvas");
        const context = canvas.getContext("webgl2", { alpha, antialias, powerPreference });
        if (!context) throw new Error("WebGL2 context unavailable");
        hasWebGL2 = true;
        renderer = new WebGLRenderer({ canvas, context, alpha, antialias, powerPreference });
        releaseCensus = retainRenderer(renderer);
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
        // Callers that release GPU resources of their own (render targets,
        // passes, composer) must open the teardown window first: those are
        // destroyed before renderer.dispose() runs, and an in-flight submit
        // that still references one raises "used in submit while destroyed".
        beginQuiet: () => deviceLease?.beginQuiet(),
        async dispose() {
          if (disposed) return;
          disposed = true;
          invalidatePrewarm(renderer);
          deviceLease?.beginQuiet();
          try { await renderer.dispose(); }
          finally {
            releaseCensus();
            renderer.onDeviceLost = () => {};
            await deviceLease?.release();
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
        releaseCensus();
        if (renderer?.isWebGPURenderer) renderer.onDeviceLost = () => {};
        await deviceLease?.release();
      }
      if (error.name === "AbortError") throw error;
      report(`${requested} initialization/compile failed: ${error.message}. ${requested === "webgpu" ? "Retrying classic WebGL2 once." : "Use a WebGL2-enabled browser or enable hardware acceleration; analytical content is still available."}`);
      // A canvas with an established WebGPU context cannot subsequently acquire WebGL2.
      if (requested === "webgpu" && canvas) canvas = canvas.cloneNode(false);
    }
  }
  return { renderer: null, backend: "static", capabilities: capabilities("static"), dispose: async () => {} };
}
