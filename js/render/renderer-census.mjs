// Read-only census of live renderers, for the performance harness
// (scripts/perf/collect.mjs). It never touches rendering: create-renderer.mjs
// retains a renderer after construction and releases it on dispose, and the
// harness reads plain-data snapshots through renderDiagnostics.

const live = new Map();
let serial = 0;

const count = (value) => (Number.isFinite(value) ? value : null);

/**
 * Plain-data description of one renderer. `programs` is the number of compiled
 * shader programs: the public `info.memory.programs` counter on the node
 * renderer (either backend) and the `info.programs` array on the classic
 * WebGLRenderer, which stays null until its first render.
 */
export function describeRenderer(renderer) {
  const node = !!renderer?.isWebGPURenderer;
  const info = renderer?.info;
  return {
    rendererPath: node ? "nodes" : "classic",
    backend: node && renderer.backend?.isWebGPUBackend ? "webgpu" : "webgl2",
    programs: node ? count(info?.memory?.programs) : Array.isArray(info?.programs) ? info.programs.length : null,
    dpr: count(renderer?.getPixelRatio?.()),
  };
}

/** Register a constructed renderer; the returned release function is idempotent. */
export function retainRenderer(renderer) {
  const id = ++serial;
  live.set(id, renderer);
  return () => { live.delete(id); };
}

export function liveRenderers() { return live.size; }

export function rendererStats() {
  return [...live.values()].map(describeRenderer);
}
