import { createRenderer } from "./create-renderer.mjs";
import { createRenderPipeline } from "./render-pipeline.mjs";
import { normalizeRenderQuality } from "./capabilities.mjs";
import { createQualityGovernor } from "./quality-governor.mjs";
import { prewarmShaders, abortIfNeeded, materialSignature } from "./shader-prewarm.mjs";
import { renderDiagnostics } from "./error-overlay.mjs";
import { detectSoftwareRenderer } from "./software-renderer.mjs";

/**
 * Combine the caller's cancellation signal with the session's own teardown
 * signal. AbortSignal.any is not available everywhere the WebGL2 path runs, so
 * fall back to a manual bridge that keeps the same semantics.
 */
function combineSignals(...signals) {
  const active = signals.filter(Boolean);
  if (active.length === 0) return undefined;
  if (active.length === 1) return active[0];
  if (typeof AbortSignal.any === "function") return AbortSignal.any(active);
  const controller = new AbortController();
  const abort = (event) => controller.abort(event.target.reason);
  for (const signal of active) {
    if (signal.aborted) { controller.abort(signal.reason); break; }
    signal.addEventListener("abort", abort, { once: true });
  }
  return controller.signal;
}

export async function initializeRenderSession({
  scene, camera, mount, settings, view, signal, diagnosticId, onError, onReady, onPhase,
  source = null, applyQuality = null, depthValid = true,
}) {
  const reducedMotion = settings.motion === "reduced";
  const options = globalThis.QGA_RENDER_OPTIONS || {};
  const softwareRenderer = options.softwareClamp === false ? null : detectSoftwareRenderer();
  const quality = { ...normalizeRenderQuality({
    preset: softwareRenderer ? "low" : settings.detail3d, devicePixelRatio: globalThis.devicePixelRatio || 1, reducedMotion,
  }), ssgi: !softwareRenderer && settings.vizMode === "capture" && !reducedMotion };
  // r186 TRAA has a fixed jitter sequence, not a configurable sample count.
  // Its only effective budget change is switching reprojection off at one.
  quality.temporalSamples = Math.min(2, quality.temporalSamples);
  const messages = (message) => renderDiagnostics.message(diagnosticId, message);
  // Teardown must be able to cancel work that is already in flight. dispose()
  // aborts this synchronously, so an in-flight quality change can no longer
  // reach prewarm()/draw() after the host has started releasing the scene.
  const lifecycle = new AbortController();
  const sessionSignal = combineSignals(signal, lifecycle.signal);
  let handle, pipeline, retiringPipeline, disposal, pendingChange, disposed = false, changing = false, fpsTime = -Infinity, warmedSignature;
  const ranges = new Map();
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
  function resize() {
    if (disposed || !handle?.renderer) return;
    const [w, h] = dimensions();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    handle.renderer.setSize(w, h, false);
    pipeline?.resize(w, h);
  }
  function publish(phase, value = quality) {
    onPhase?.(phase);
    renderDiagnostics.update(diagnosticId, {
      phase, backend: handle.backend, capabilities: handle.capabilities,
      quality: value, dpr: handle.renderer?.getPixelRatio() ?? 0,
      effects: pipeline?.effects ?? [], reducedMotion,
      renderPreset: settings.vizMode, toneMapping: settings.toneMapping || "agx",
    });
  }
  async function warm(value) {
    resize();
    applyBudgets(value);
    await prewarmShaders({
      renderer: handle.renderer, backend: handle.backend, scene, camera, view,
      quality: value, pipeline, signal: sessionSignal,
    });
    abortIfNeeded(sessionSignal);
    warmedSignature = materialSignature(scene);
  }
  async function buildPipeline(value) {
    return createRenderPipeline({
      renderer: handle.renderer, backend: handle.backend, scene, camera, quality: value,
      preset: settings.vizMode, reducedMotion, fullMotion: settings.motion === "full",
      source, depthValid, toneMapping: settings.toneMapping || "agx",
    });
  }
  function dispose() {
    if (disposal) return disposal;
    disposed = true;
    lifecycle.abort();
    disposal = (async () => {
      try { await pendingChange; }
      finally {
        try { await Promise.all([pipeline?.dispose(), retiringPipeline?.dispose()]); }
        finally {
          try { await handle?.dispose(); }
          finally { handle?.renderer?.domElement.remove(); }
        }
      }
    })();
    return disposal;
  }
  try {
    if (softwareRenderer) messages(`Software rasterizer detected (${softwareRenderer}); using the low-cost tier without optional post effects.`);
    handle = await createRenderer({
      quality, scene, camera, signal: sessionSignal, reducedMotion, antialias: !softwareRenderer && settings.detail3d !== "low",
      forceBackend: options.forceBackend ?? (settings.renderBackend === "auto" ? null : settings.renderBackend),
      toneMapping: settings.toneMapping || "agx", onDiagnostic: messages, onDeviceLost: onError,
      shadows: !!source?.castShadow,
    });
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
      handle = await createRenderer({ quality, scene, camera, signal: sessionSignal, reducedMotion, forceBackend: "webgl2", toneMapping: settings.toneMapping || "agx", shadows: !!source?.castShadow, onDiagnostic: messages });
      if (handle.backend === "static") { publish("static"); return { backend: "static", capabilities: handle.capabilities, dispose }; }
      pipeline = await buildPipeline(quality);
      await warm(quality);
    }
    abortIfNeeded(sessionSignal);
    const renderer = handle.renderer;
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);
    const active = ["maxDpr"];
    if (ranges.size) active.push("particleBudget");
    if (pipeline.effects.some((effect) => effect.name === "temporal-aa" && effect.status === "enabled")) active.push("temporalSamples");
    if (pipeline.effects.some((effect) => effect.name === "ssgi" && effect.status === "enabled")) active.push("ssgi");
    if (applyQuality) active.push("raySteps");
    const governor = createQualityGovernor({ quality, active });
    const contextLost = (event) => {
      event.preventDefault();
      onError(new Error("Graphics context lost"));
    };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    const ownedDispose = dispose;
    const disposeSession = async () => {
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      await ownedDispose();
    };
    async function changeQuality(value, change) {
      changing = true;
      publish("prewarming", value);
      renderer.domElement.style.visibility = "hidden";
      try {
        renderer.setPixelRatio(value.maxDpr);
        if (["temporalSamples", "ssgi", "material"].includes(change.dimension)) {
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
        renderer.domElement.style.visibility = "";
        publish("ready", value);
        messages(change.dimension === "material" ? "Material variants changed; shader graph rebuilt and prewarmed."
          : `Adaptive ${change.direction}: ${change.dimension} ${change.previous} -> ${change.value} (rendering budget only).`);
      } catch (error) {
        if (error.name !== "AbortError" && !disposed) onError(error);
      } finally { changing = false; }
    }
    publish("ready");
    onReady?.();
    return {
      renderer, backend: handle.backend, capabilities: handle.capabilities, resize,
      get pipeline() { return pipeline; },
      get quality() { return governor.quality; },
      suspend() { governor.resetWindow(); },
      render(delta = 0, now = performance.now(), sample = true, frameMs = delta * 1000) {
        if (disposed || changing) return;
        if (materialSignature(scene) !== warmedSignature) {
          pendingChange = changeQuality(governor.quality, { dimension: "material" });
          return;
        }
        pipeline.render(delta);
        if (!sample) return;
        const result = governor.sample(frameMs, now);
        if (now - fpsTime > 500 && result.fps) {
          fpsTime = now;
          renderDiagnostics.update(diagnosticId, { fps: result.fps });
        }
        if (result.change) pendingChange = changeQuality(result.quality, result.change);
      },
      dispose: disposeSession,
    };
  } catch (error) {
    await dispose();
    throw error;
  }
}
