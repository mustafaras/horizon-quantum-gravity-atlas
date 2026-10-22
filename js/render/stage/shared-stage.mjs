/*
 * Shared stage: one frame loop and one scheduler per page.
 *
 *  webgpu  one WebGPURenderer (built with the same createRenderer path as an
 *          unshared session, so error handling and validation are identical)
 *          draws into every scene canvas through a CanvasTarget. One pipeline
 *          cache, one shader cache, one device.
 *  webgl2  a WebGL context belongs to one canvas, so each scene keeps its own
 *          renderer, but at most `maxContexts` are live at once. The least
 *          recently visible scene snapshots, releases its renderer and gets a
 *          new one when it is visible again (see context-pool.mjs).
 *
 * Both kinds render only what frame-scheduler.mjs plans. Every view keeps
 * its own pipeline object (a spike on r186 showed a bloom view and a plain
 * view presenting correctly side by side on one renderer).
 */

import { createRenderer } from "../create-renderer.mjs";
import { createFrameScheduler } from "./frame-scheduler.mjs";
import { createContextPool } from "./context-pool.mjs";

export const DEFAULT_MAX_CONTEXTS = 4;
const COST_SMOOTHING = 0.2;
const TIMESTAMP_EVERY_FRAMES = 30;
const GPU_TIME_TTL_MS = 1000;

export class StageUnavailableError extends Error {
  constructor(message) { super(message); this.name = "StageUnavailableError"; }
}

const stages = new Map();
const diagnostics = { snapshot: () => [...stages.values()].map((stage) => stage.stats()) };
export const stageDiagnostics = diagnostics;

/** True when the page opted in with QGA_RENDER_OPTIONS.stage = "shared". */
export function sharedStageRequested(options = globalThis.QGA_RENDER_OPTIONS) {
  return options?.stage === "shared";
}

/** Whether the running page can host the single-renderer WebGPU stage. */
export function canUseWebGPUStage({ forceBackend = null, nodeCompatible = true, shadows = false } = {}) {
  return !!globalThis.navigator?.gpu && forceBackend !== "webgl2" && forceBackend !== "static" && nodeCompatible && !shadows;
}

export function acquireStage({ backend = "webgpu", maxContexts = globalThis.QGA_RENDER_OPTIONS?.maxContexts ?? DEFAULT_MAX_CONTEXTS, now = () => performance.now(), requestFrame = null } = {}) {
  if (!["webgpu", "webgl2"].includes(backend)) throw new RangeError("stage backend must be webgpu or webgl2");
  const existing = stages.get(backend);
  if (existing) return existing;
  const stage = createStage({ backend, maxContexts, now, requestFrame });
  stages.set(backend, stage);
  return stage;
}

/** Test hook: forget every stage so a page (or test) can start from nothing. */
export function resetStagesForTests() { stages.clear(); }

function createStage({ backend, maxContexts, now, requestFrame }) {
  const isGPU = backend === "webgpu";
  const views = new Map();
  const pool = isGPU ? null : createContextPool({ limit: maxContexts });
  let running = false, rafId = 0, loopFrames = 0, renderer = null, rendererHandle = null, rendererPromise = null;
  let listening = false, nextViewId = 1, timestampCountdown = TIMESTAMP_EVERY_FRAMES, resolving = false;
  const reducedQuery = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  const scheduler = createFrameScheduler({
    now, budgetMs: globalThis.QGA_RENDER_OPTIONS?.frameBudgetMs ?? 8,
    reducedMotion: () => !!(reducedQuery?.matches) || globalThis.QGA_RENDER_OPTIONS?.reducedMotion === true,
    onChange: () => wake(),
  });
  const raf = requestFrame ?? ((fn) => globalThis.requestAnimationFrame(fn));

  function startLoop() {
    if (running) return;
    running = true;
    if (isGPU) void renderer?.setAnimationLoop(frame);
    else rafId = raf(frame);
  }
  function stopLoop() {
    if (!running) return;
    running = false;
    if (isGPU) void renderer?.setAnimationLoop(null);
    else if (rafId) { globalThis.cancelAnimationFrame?.(rafId); rafId = 0; }
  }
  // A paused scene still shows live parameter changes (its update() runs with dt = 0), so any user input
  // anywhere on the page owes every visible view one frame. Sliders fire "input" continuously.
  const WAKE_EVENTS = ["input", "change", "click", "keyup", "pointerup"];
  const invalidateAll = () => { for (const view of views.values()) if (view.visible && view.live) view.handle.invalidate(); };
  function listenForInput(on) {
    const target = globalThis.document;
    if (!target || listening === on) return;
    listening = on;
    for (const name of WAKE_EVENTS) (on ? target.addEventListener : target.removeEventListener).call(target, name, invalidateAll, { capture: true, passive: true });
  }
  function wake() { if (!running && views.size && (!isGPU || renderer) && scheduler.hasWork()) startLoop(); }

  function renderView(view, time) {
    const dt = Math.min(0.05, Math.max(0, (time - view.lastFrameAt) / 1000));
    view.lastFrameAt = time;
    if (isGPU) renderer.setCanvasTarget(view.target);
    view.drawn = false;
    const t0 = now();
    try {
      view.onFrame?.(dt, time);
      if (!view.drawn) view.render(dt);
    } catch (error) {
      if (view.onError) view.onError(error); else throw error;
    }
    const cost = now() - t0;
    view.cpuMs = view.cpuMs === 0 ? cost : view.cpuMs + COST_SMOOTHING * (cost - view.cpuMs);
    view.frames += 1;
    const fresh = view.gpuMs !== null && time - view.gpuAt < GPU_TIME_TTL_MS;
    view.handle.setCostMs(fresh ? view.gpuMs : view.cpuMs);
  }

  function frame(timestamp) {
    const time = typeof timestamp === "number" ? timestamp : now();
    if (!isGPU && running) rafId = raf(frame);
    loopFrames += 1;
    const ids = scheduler.plan(time);
    let last = null;
    for (const id of ids) {
      const view = views.get(id);
      if (!view || !view.live) continue;
      renderView(view, time);
      last = view;
    }
    if (isGPU && last && renderer.backend?.trackTimestamp && --timestampCountdown <= 0 && !resolving) {
      timestampCountdown = TIMESTAMP_EVERY_FRAMES;
      resolving = true;
      // The resolved duration is the last renderer frame, i.e. the last view drawn: exact with one
      // visible view, an approximation attributed to the last view otherwise (see the contract).
      renderer.resolveTimestampsAsync("render").then((ms) => {
        if (Number.isFinite(ms) && ms > 0 && views.has(last.id)) { last.gpuMs = ms; last.gpuAt = now(); }
      }, () => {}).finally(() => { resolving = false; });
    }
    if (!scheduler.hasWork()) stopLoop();
  }

  async function ensureRenderer(rendererOptions, signal) {
    if (renderer) return rendererHandle;
    rendererPromise ??= (async () => {
      const handle = await createRenderer({ ...rendererOptions, signal, forceBackend: "webgpu", trackTimestamp: true });
      if (handle.backend !== "webgpu") {
        await handle.dispose();
        throw new StageUnavailableError(`WebGPU stage needs a WebGPU renderer, got ${handle.backend}`);
      }
      handle.renderer.domElement.setAttribute("aria-hidden", "true");
      renderer = handle.renderer;
      rendererHandle = handle;
      return handle;
    })();
    try { return await rendererPromise; }
    catch (error) { rendererPromise = null; throw error; }
  }

  function broadcastError(error) { for (const view of [...views.values()]) view.onError?.(error); }

  async function releaseRenderer() {
    const handle = rendererHandle;
    stopLoop();
    renderer = null; rendererHandle = null; rendererPromise = null;
    await handle?.dispose();
  }

  function makeView({ id, label, animated, priority, onFrame, onError, visible = true }) {
    const viewId = id ?? `stage-view-${nextViewId++}`;
    const handle = scheduler.register({ id: viewId, animated, priority, visible });
    const view = {
      id: viewId, label: label ?? viewId, handle, onFrame: onFrame ?? null, onError: onError ?? null,
      live: true, visible, drawn: false, frames: 0, cpuMs: 0, gpuMs: null, gpuAt: -Infinity, lastFrameAt: now(),
      target: null, pipeline: null, canvas: null,
      render() { throw new Error("view has nothing to render"); },
    };
    views.set(viewId, view);
    listenForInput(true);
    return view;
  }

  /** The public face of a view. `view` stays private to the stage. */
  function publicView(view, extra = {}) {
    const refreshVisibility = () => view.handle.setVisible(view.visible && view.live);
    const api = {
      id: view.id,
      get frames() { return view.frames; },
      get gpuMs() { return view.gpuMs !== null && now() - view.gpuAt < GPU_TIME_TTL_MS ? view.gpuMs : null; },
      get live() { return view.live; },
      invalidate: (options) => view.handle.invalidate(options),
      setAnimated: (value) => view.handle.setAnimated(value),
      setPriority: (value) => view.handle.setPriority(value),
      setVisible(value) {
        view.visible = !!value;
        if (pool) pool.setVisible(view.id, view.visible);
        refreshVisibility();
        if (view.visible) view.handle.invalidate({ input: false });
      },
      drive(onFrame) { view.onFrame = onFrame; },
      onError(fn) { view.onError = fn; },
      /** The view was drawn this frame by its own code; the stage will not draw it again. */
      markRendered() { view.drawn = true; },
    };
    view.refreshVisibility = refreshVisibility;
    // Copy descriptors, not values: `extra` carries live getters.
    return Object.freeze(Object.defineProperties(api, Object.getOwnPropertyDescriptors(extra)));
  }

  const stage = {
    kind: backend, scheduler, pool, invalidateAll,
    get renderer() { return renderer; },
    get contextLimit() { return pool?.limit ?? null; },

    /**
     * attach({ canvas, scene, camera, pipelineFactory, animated, onFrame, ... }) for the WebGPU stage.
     * `rendererOptions` is what the first attach hands to createRenderer. The pipeline factory runs with
     * this view's canvas target active and may return a promise; the view keeps it and draws it when its
     * own onFrame did not.
     */
    async attach({ canvas, scene, camera, pipelineFactory = null, animated = false, onFrame = null, onError = null, priority = 0, label, id, rendererOptions = {}, signal } = {}) {
      if (!isGPU) throw new StageUnavailableError("attach() is for the WebGPU stage; WebGL2 views use attachContext()");
      if (!canvas) throw new TypeError("attach requires a canvas");
      const handle = await ensureRenderer({ ...rendererOptions, scene: rendererOptions.scene ?? scene, camera: rendererOptions.camera ?? camera, onDeviceLost: (error) => { broadcastError(error); rendererOptions.onDeviceLost?.(error); } }, signal);
      const { CanvasTarget } = await import("three/webgpu");
      const view = makeView({ id, label, animated, priority, onFrame, onError });
      const target = new CanvasTarget(canvas);
      view.target = target; view.canvas = canvas;
      renderer.setCanvasTarget(target);
      let pipeline = null;
      try { pipeline = pipelineFactory ? await pipelineFactory(renderer, target) : null; }
      catch (error) { views.delete(view.id); view.handle.dispose(); target.dispose(); throw error; }
      view.pipeline = pipeline;
      view.render = (dt) => {
        renderer.setCanvasTarget(view.target);
        if (view.pipeline) view.pipeline.render(dt); else renderer.render(scene, camera);
        view.drawn = true;
      };
      const result = publicView(view, {
        renderer, target, handle, capabilities: handle.capabilities,
        beginQuiet: () => rendererHandle?.beginQuiet?.(),
        get pipeline() { return view.pipeline; },
        setPipeline(next) { view.pipeline = next; },
        /** Activate this view's canvas target and draw it now (captures, session render()). */
        render: (dt = 0) => view.render(dt),
        activate() { renderer.setCanvasTarget(view.target); },
        async detach() {
          if (!views.has(view.id)) return;
          views.delete(view.id);
          view.handle.dispose();
          try { view.target.dispose(); } catch { /* target already released */ }
          if (views.size === 0) { listenForInput(false); await releaseRenderer(); }
        },
      });
      wake();
      return result;
    },

    /**
     * WebGL2 stage: register a scene that owns its renderer. `suspend()` must snapshot and release the
     * renderer, `resume()` must recreate it; the pool calls them to hold the context budget.
     */
    attachContext({ animated = false, onFrame = null, onError = null, priority = 0, label, id, suspend, resume } = {}) {
      if (isGPU) throw new StageUnavailableError("attachContext() is for the WebGL2 stage; WebGPU views use attach()");
      const view = makeView({ id, label, animated, priority, onFrame, onError, visible: false });
      view.live = false;
      view.suspendFn = suspend; view.resumeFn = resume;
      view.render = () => { throw new Error("a WebGL2 view draws itself from onFrame"); };
      pool.register(view.id);
      view.handle.setVisible(false);
      const result = publicView(view, {
        /** Reserve a context; resolves once the budget is free (other scenes may be suspended first). */
        async acquireContext() {
          const victims = pool.request(view.id);
          for (const victimId of victims) {
            const victim = views.get(victimId);
            if (!victim) continue;
            victim.live = false;
            victim.refreshVisibility();
            await victim.suspendFn?.();
          }
        },
        contextCreated() { view.live = true; view.refreshVisibility(); view.handle.invalidate({ input: false }); wake(); },
        /** The scene's visible state changed while suspended: bring its context back. */
        async resumeIfNeeded() {
          if (view.live || !view.visible || view.resuming || !view.resumeFn) return;
          view.resuming = true;
          try { await this.acquireContext(); await view.resumeFn(); this.contextCreated(); }
          finally { view.resuming = false; }
        },
        releaseContext() { pool.release(view.id); view.live = false; view.refreshVisibility(); },
        render: () => { view.drawn = true; },
        async detach() {
          if (!views.has(view.id)) return;
          views.delete(view.id);
          view.handle.dispose();
          pool.release(view.id);
          pool.unregister(view.id);
          if (views.size === 0) { listenForInput(false); stopLoop(); }
        },
      });
      // Becoming visible while suspended must resume; wrap setVisible once pool state is updated.
      const baseSetVisible = result.setVisible;
      const wrapped = Object.freeze(Object.defineProperties({}, {
        ...Object.getOwnPropertyDescriptors(result),
        setVisible: { enumerable: true, value(value) { baseSetVisible(value); if (value) void wrapped.resumeIfNeeded().catch((error) => view.onError?.(error)); } },
      }));
      return wrapped;
    },

    stats() {
      return {
        kind: backend, renderers: isGPU ? (renderer ? 1 : 0) : (pool?.liveCount ?? 0),
        contextLimit: pool?.limit ?? null, loopRunning: running, loopFrames,
        views: [...views.values()].map((v) => {
          const planned = scheduler.snapshot().find((entry) => entry.id === v.id);
          return { id: v.id, label: v.label, frames: v.frames, live: v.live, visible: v.visible, animated: planned?.animated ?? false, dirty: planned?.dirty ?? false, cpuMs: Math.round(v.cpuMs * 100) / 100, gpuMs: v.gpuMs };
        }),
      };
    },
  };
  return stage;
}
