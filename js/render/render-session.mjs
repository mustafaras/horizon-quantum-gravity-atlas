import { createRenderer, quiesceRendererQueue, inspectSceneCompatibility } from "./create-renderer.mjs";
import { acquireStage, sharedStageRequested, canUseWebGPUStage, StageUnavailableError } from "./stage/shared-stage.mjs";
import { createRenderPipeline } from "./render-pipeline.mjs";
import { normalizeRenderQuality } from "./capabilities.mjs";
import { createQualityGovernor } from "./quality-governor.mjs";
import { prewarmShaders, abortIfNeeded, materialSignature } from "./shader-prewarm.mjs";
import { renderDiagnostics } from "./error-overlay.mjs";
import { softwareRendererClamp } from "./software-renderer.mjs";

export async function initializeRenderSession({
  scene, camera, mount, settings, view, signal, diagnosticId, onError, onReady, onPhase,
  source = null, applyQuality = null, depthValid = true, shared = false,
}) {
  const reducedMotion = settings.motion === "reduced";
  const options = globalThis.QGA_RENDER_OPTIONS || {};
  const softwareRenderer = softwareRendererClamp();
  const quality = { ...normalizeRenderQuality({
    preset: softwareRenderer ? "low" : settings.detail3d, devicePixelRatio: globalThis.devicePixelRatio || 1, reducedMotion,
  }), ssgi: !softwareRenderer && settings.vizMode === "capture" && !reducedMotion };
  // r186 TRAA has a fixed jitter sequence, not a configurable sample count.
  // Its only effective budget change is switching reprojection off at one.
  quality.temporalSamples = Math.min(2, quality.temporalSamples);
  const messages = (message) => renderDiagnostics.message(diagnosticId, message);
  let handle, pipeline, retiringPipeline, disposal, pendingChange, disposed = false, changing = false, fpsTime = -Infinity, warmedSignature;
  const ranges = new Map();
  // Shared stage (docs/render/performance-contract.md): opt-in per view AND per page
  // (QGA_RENDER_OPTIONS.stage = "shared"). "webgpu": one renderer, a CanvasTarget per view.
  // "webgl2": one renderer per view, at most `maxContexts` live. null: the classic own-renderer path.
  const forceBackend = options.forceBackend ?? (settings.renderBackend === "auto" ? null : settings.renderBackend);
  const wantsStage = shared === true && sharedStageRequested(options) && forceBackend !== "static";
  let stageKind = !wantsStage ? null
    : canUseWebGPUStage({ forceBackend, nodeCompatible: inspectSceneCompatibility(scene).nodeCompatible, shadows: !!source?.castShadow }) ? "webgpu" : "webgl2";
  let stageView = null, host = null, snapshotImage = null, snapshotUrl = null, suspended = false, suspendPromise = null, governor, contextLostBound = null;
  // Resolves when the first bring-up has finished (or failed): a pool eviction must not tear down a view that is still being built.
  let resolveReady;
  const initialized = new Promise((resolve) => { resolveReady = resolve; });
  scene.traverse((object) => {
    if (object.isPoints && object.geometry) {
      const range = object.geometry.drawRange;
      const total = object.geometry.index?.count ?? object.geometry.attributes.position?.count ?? 0;
      ranges.set(object.geometry, { start: range.start, count: Math.min(range.count, total) });
    }
  });
  const totalParticles = [...ranges.values()].reduce((total, range) => total + range.count, 0);
  function applyBudgets(value) {
    for (const [geometry, original] of ranges) {
      geometry.setDrawRange(original.start, Math.floor(original.count * Math.min(1, value.particleBudget / Math.max(1, totalParticles))));
    }
    if (applyQuality) applyQuality(value);
  }
  const dimensions = () => [Math.max(40, mount.clientWidth), Math.max(40, mount.clientHeight)];
  // The drawing surface: the renderer itself, or this view's CanvasTarget on the shared WebGPU stage.
  const surface = () => handle.surface ?? handle.renderer;
  const canvasOf = () => handle?.canvas ?? handle?.renderer?.domElement ?? null;
  const activate = () => { if (stageView?.activate) stageView.activate(); };
  function resize() {
    if (disposed || suspended || !handle?.renderer) return;
    const [w, h] = dimensions();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    surface().setSize(w, h, false);
    pipeline?.resize(w, h);
    stageView?.invalidate({ input: false });
  }
  function publish(phase, value = quality) {
    onPhase?.(phase);
    renderDiagnostics.update(diagnosticId, {
      phase, backend: handle.backend, capabilities: handle.capabilities,
      quality: value, dpr: surface()?.getPixelRatio() ?? 0,
      effects: pipeline?.effects ?? [], reducedMotion,
      renderPreset: settings.vizMode, toneMapping: settings.toneMapping || "agx",
    });
  }
  async function warm(value) {
    activate();
    resize();
    applyBudgets(value);
    await prewarmShaders({
      renderer: handle.renderer, backend: handle.backend, scene, camera, view,
      quality: value, pipeline, signal,
    });
    abortIfNeeded(signal);
    warmedSignature = materialSignature(scene);
  }
  async function buildPipeline(value) {
    return createRenderPipeline({
      renderer: handle.renderer, backend: handle.backend, scene, camera, quality: value,
      preset: settings.vizMode, reducedMotion, fullMotion: settings.motion === "full",
      source, depthValid, toneMapping: settings.toneMapping || "agx",
      environment: settings.hdrEnvironment === true ? "hdr" : null, viewId: view ?? null,
    });
  }
  function dispose() {
    if (disposal) return disposal;
    disposed = true;
    disposal = (async () => {
      try { await pendingChange; }
      finally {
        // Stop submitting frames and drain the GPU queue before anything is
        // destroyed: three r186 frees buffers synchronously on dispose and
        // never waits for submitted work, so a buffer still referenced by
        // an in-flight submit raises "used in submit while destroyed".
        try {
          const renderer = handle?.renderer;
          // Open the teardown window before the pipeline releases its render
          // targets — those are GPU resources too, and they are destroyed
          // before renderer.dispose() gets a chance to open it.
          handle?.beginQuiet?.();
          // A shared WebGPU renderer keeps serving the other views: only its owner-less loop is stopped, by the stage.
          if (!stageView && renderer?.isWebGPURenderer && renderer.initialized) {
            try { await renderer.setAnimationLoop(null); } catch { /* loop already stopped */ }
          }
          await quiesceRendererQueue(renderer);
        } finally {
          try { await Promise.all([pipeline?.dispose(), retiringPipeline?.dispose()]); }
          finally {
            try { await handle?.dispose(); }
            finally {
              canvasOf()?.remove();
              host?.remove();
              releaseSnapshot();
              await stageView?.detach();
            }
          }
        }
      }
    })();
    return disposal;
  }

  function releaseSnapshot() {
    snapshotImage?.remove(); snapshotImage = null;
    if (snapshotUrl) { URL.revokeObjectURL(snapshotUrl); snapshotUrl = null; }
  }
  function bindContextLost() {
    const canvas = canvasOf();
    if (!canvas || contextLostBound) return;
    const onLost = (event) => { event.preventDefault(); onError(new Error("Graphics context lost")); };
    canvas.addEventListener("webglcontextlost", onLost);
    contextLostBound = () => { canvas.removeEventListener("webglcontextlost", onLost); contextLostBound = null; };
  }
  function mountCanvas() {
    const canvas = canvasOf();
    canvas.style.cssText = "display:block;width:100%;height:100%";
    canvas.setAttribute("aria-hidden", "true");
    if (stageKind) ensureHost().appendChild(canvas);
    else mount.appendChild(canvas);
    bindContextLost();
  }
  function ensureHost() {
    if (!host) {
      host = document.createElement("div");
      host.style.cssText = "display:block;position:relative;width:100%;height:100%";
      mount.appendChild(host);
    }
    return host;
  }
  function makeGovernor() {
    const active = ["maxDpr"];
    if (ranges.size) active.push("particleBudget");
    if (pipeline.effects.some((effect) => effect.name === "temporal-aa" && effect.status === "enabled")) active.push("temporalSamples");
    if (pipeline.effects.some((effect) => effect.name === "ssgi" && effect.status === "enabled")) active.push("ssgi");
    if (applyQuality) active.push("raySteps");
    return createQualityGovernor({ quality, active });
  }
  const currentQuality = () => governor?.quality ?? quality;

  /** Creates the renderer (or joins the shared WebGPU renderer) for the current stage kind. */
  async function createHandle(backendOverride = null) {
    const common = {
      quality, scene, camera, signal, reducedMotion, toneMapping: settings.toneMapping || "agx",
      shadows: !!source?.castShadow, onDiagnostic: messages, onDeviceLost: onError,
    };
    if (stageKind === "webgpu" && backendOverride !== "webgl2") {
      try {
        const stage = acquireStage({ backend: "webgpu" });
        const canvas = document.createElement("canvas");
        stageView = await stage.attach({
          canvas, scene, camera, label: diagnosticId, signal, onError,
          rendererOptions: { ...common, antialias: !softwareRenderer && settings.detail3d !== "low" },
        });
        return {
          renderer: stageView.renderer, backend: "webgpu", capabilities: stageView.capabilities, surface: stageView.target, canvas,
          beginQuiet: () => stageView.beginQuiet(), dispose: async () => {},
        };
      } catch (error) {
        if (error.name === "AbortError" || !(error instanceof StageUnavailableError)) throw error;
        messages(`Shared WebGPU stage unavailable (${error.message}); using the WebGL2 context pool.`);
        stageKind = "webgl2";
      }
    }
    if (stageKind === "webgl2") {
      if (!stageView) {
        stageView = acquireStage({ backend: "webgl2" }).attachContext({
          label: diagnosticId, onError, suspend: suspendGPU, resume: resumeGPU,
        });
      }
      // A fallback from WebGPU may exceed the budget by one rather than park a scene that has nothing to show.
      await stageView.acquireContext({ force: true });
    }
    // The unshared path keeps the original arguments exactly: the initial attempt honours detail/antialias,
    // the retry after a failed node pipeline does not.
    return createRenderer(backendOverride
      ? { quality, scene, camera, signal, reducedMotion, forceBackend: "webgl2", toneMapping: settings.toneMapping || "agx", shadows: !!source?.castShadow, onDiagnostic: messages }
      : { ...common, antialias: !softwareRenderer && settings.detail3d !== "low", forceBackend });
  }

  /** WebGL2 pool eviction: freeze the last frame as an image, then give the context back. */
  function suspendGPU() {
    suspendPromise = (async () => {
      await initialized;
      if (disposed || suspended || !handle?.renderer) return;
      suspended = true;
      await pendingChange;
      const canvas = canvasOf();
      if (pipeline && canvas && host) {
        try {
          // Rendered and copied in this task: the drawing buffer is not preserved past it.
          pipeline.render(0);
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
          if (blob) {
            releaseSnapshot();
            snapshotUrl = URL.createObjectURL(blob);
            snapshotImage = document.createElement("img");
            snapshotImage.alt = "";
            snapshotImage.setAttribute("aria-hidden", "true");
            snapshotImage.dataset.qgaSnapshot = "true";
            snapshotImage.style.cssText = "display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none";
            snapshotImage.src = snapshotUrl;
            host.appendChild(snapshotImage);
          }
        } catch (error) { messages(`Snapshot before releasing the WebGL context failed: ${error.message}`); }
      }
      contextLostBound?.();
      const releasing = { pipeline, handle };
      pipeline = null; handle = null; warmedSignature = undefined;
      try {
        await releasing.pipeline?.dispose();
        releasing.handle?.beginQuiet?.();
        await releasing.handle?.dispose();
      } finally { releasing.handle?.renderer?.domElement.remove(); }
      renderDiagnostics.update(diagnosticId, { phase: "suspended", effects: [] });
      stageView?.markSuspended?.();
    })();
    return suspendPromise;
  }
  async function resumeGPU() {
    await suspendPromise;
    if (disposed || !suspended) return;
    handle = await createRenderer({
      quality, scene, camera, signal, reducedMotion, toneMapping: settings.toneMapping || "agx", shadows: !!source?.castShadow,
      onDiagnostic: messages, onDeviceLost: onError, antialias: !softwareRenderer && settings.detail3d !== "low", forceBackend: "webgl2",
    });
    const value = currentQuality();
    pipeline = await buildPipeline(value);
    await warm(value);
    governor ??= makeGovernor();
    mountCanvas();
    releaseSnapshot();
    suspended = false;
    publish("ready", value);
  }

  async function changeQuality(value, change) {
    changing = true;
    const pipelineSwap = ["temporalSamples", "ssgi"].includes(change.dimension);
    // A material-signature change only adds shader derivations to compile —
    // the pipeline effect graph is unaffected, so keep the canvas visible
    // instead of tearing the pipeline down and hiding the frame (the visible
    // outcome was a blank scene for the whole prewarm, which on software
    // rasterizers reads as "fullscreen goes black").
    publish(pipelineSwap ? "prewarming" : "ready", value);
    const canvas = canvasOf();
    if (pipelineSwap) canvas.style.visibility = "hidden";
    try {
      activate();
      surface().setPixelRatio(value.maxDpr);
      if (pipelineSwap) {
        const previousPipeline = pipeline;
        pipeline = null;
        retiringPipeline = previousPipeline;
        await previousPipeline.dispose();
        retiringPipeline = null;
        if (disposed) return;
        const replacement = await buildPipeline(value);
        if (disposed) { await replacement.dispose(); return; }
        pipeline = replacement;
      }
      await warm(value);
      if (disposed) return;
      canvas.style.visibility = "";
      publish("ready", value);
      stageView?.invalidate({ input: false });
      messages(change.dimension === "material" ? "Material variants changed; shader graph rebuilt and prewarmed."
        : `Adaptive ${change.direction}: ${change.dimension} ${change.previous} -> ${change.value} (rendering budget only).`);
    } catch (error) {
      if (error.name !== "AbortError" && !disposed) onError(error);
    } finally { changing = false; }
  }

  function buildApi() {
    const disposeSession = async () => {
      contextLostBound?.();
      await dispose();
    };
    return {
      get renderer() { return handle?.renderer ?? null; },
      backend: handle?.backend ?? "webgl2", capabilities: handle?.capabilities ?? null, resize,
      /** The element Scene3D listens on: the canvas, or a stable host that wraps it when a stage owns the canvas. */
      get element() { return host ?? canvasOf(); },
      get canvas() { return canvasOf(); },
      get shared() { return stageKind; },
      get stageView() { return stageView; },
      get pipeline() { return pipeline; },
      get quality() { return currentQuality(); },
      get suspended() { return suspended; },
      suspend() { governor?.resetWindow(); },
      /** Hand the per-frame callback (it takes the frame timestamp) to the stage; without a stage the caller keeps its own loop. */
      drive(onFrame) { if (stageView) stageView.drive((_dt, time) => onFrame(time)); return !!stageView; },
      invalidate(options) { if (!disposed) stageView?.invalidate(options); },
      setAnimated(value) { if (!disposed) stageView?.setAnimated(value); },
      setVisible(value) { if (!disposed) stageView?.setVisible(value); },
      /**
       * Render now, in the current task, and return the canvas so the caller can read it before the browser
       * clears the (no longer preserved) drawing buffer. Null while the context is suspended.
       */
      capture() {
        if (disposed || suspended || changing || !pipeline) return null;
        activate();
        pipeline.render(0);
        stageView?.markRendered();
        return canvasOf();
      },
      render(delta = 0, now = performance.now(), sample = true, frameMs = delta * 1000) {
        if (disposed || changing || suspended) return;
        if (materialSignature(scene) !== warmedSignature) {
          pendingChange = changeQuality(governor.quality, { dimension: "material" });
          return;
        }
        activate();
        pipeline.render(delta);
        stageView?.markRendered();
        if (!sample) return;
        const result = governor.sample(frameMs, now, stageView?.gpuMs ?? null);
        if (now - fpsTime > 500 && result.fps) {
          fpsTime = now;
          renderDiagnostics.update(diagnosticId, { fps: result.fps, ...(result.gpuMs ? { gpuMs: result.gpuMs } : {}) });
        }
        if (result.change) pendingChange = changeQuality(result.quality, result.change);
      },
      dispose: disposeSession,
    };
  }

  /** WebGL2 pool: a scene that starts out of view while the budget is full gets no context until it is seen. */
  function parkedSession() {
    suspended = true;
    ensureHost();
    renderDiagnostics.update(diagnosticId, { phase: "suspended", backend: "webgl2", effects: [], quality });
    onPhase?.("ready");
    stageView.markSuspended();
    stageView.setVisible(false);
    onReady?.();
    return buildApi();
  }

  try {
    if (softwareRenderer) messages(`Software rasterizer detected (${softwareRenderer}); using the low-cost tier without optional post effects.`);
    if (stageKind === "webgl2") {
      stageView = acquireStage({ backend: "webgl2" }).attachContext({ label: diagnosticId, onError, suspend: suspendGPU, resume: resumeGPU });
      if (!(await stageView.acquireContext())) return parkedSession();
    }
    handle = await createHandle();
    if (handle.backend === "static") {
      publish("static");
      return { backend: "static", capabilities: handle.capabilities, dispose };
    }
    try {
      pipeline = await buildPipeline(quality);
      await warm(quality);
    } catch (error) {
      if (error.name === "AbortError" || !handle.renderer.isWebGPURenderer) throw error;
      messages(`Node pipeline compilation failed: ${error.message}. Retrying classic WebGL2 once.`);
      await pipeline?.dispose();
      pipeline = null;
      await handle.dispose();
      if (stageView?.detach && stageKind === "webgpu") { await stageView.detach(); stageView = null; stageKind = "webgl2"; }
      handle = await createHandle("webgl2");
      if (handle.backend === "static") { publish("static"); return { backend: "static", capabilities: handle.capabilities, dispose }; }
      pipeline = await buildPipeline(quality);
      await warm(quality);
    }
    abortIfNeeded(signal);
    mountCanvas();
    governor = makeGovernor();
    publish("ready");
    stageView?.contextCreated?.();
    stageView?.setVisible(true);
    onReady?.();
    return buildApi();
  } catch (error) {
    await dispose();
    throw error;
  } finally {
    resolveReady();
  }
}
