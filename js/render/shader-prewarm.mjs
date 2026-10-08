const caches = new WeakMap();

export function abortIfNeeded(signal) {
  if (signal?.aborted) throw new DOMException("Renderer initialization cancelled", "AbortError");
}

export function materialSignature(scene) {
  const parts = [];
  scene.traverse((object) => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (material) parts.push(`${material.uuid}:${material.version}:${material.customProgramCacheKey()}`);
    }
  });
  return parts.join("|");
}

export async function prewarmShaders({ renderer, backend, scene, camera, view, quality, pipeline, signal }) {
  abortIfNeeded(signal);
  let cache = caches.get(renderer);
  if (!cache) { cache = new Map(); caches.set(renderer, cache); }
  const key = `${backend}:${view}:${JSON.stringify(quality)}:${materialSignature(scene)}`;
  const existing = cache.get(scene);
  if (existing?.key === key && existing.pipeline === pipeline) return existing.promise;
  const promise = (async () => {
    await renderer.compileAsync(scene, camera);
    abortIfNeeded(signal);
    await pipeline.prewarm();
    abortIfNeeded(signal);
  })();
  cache.set(scene, { key, pipeline, promise });
  try { await promise; }
  catch (error) {
    if (cache.get(scene)?.promise === promise) cache.delete(scene);
    throw error;
  }
}

export function invalidatePrewarm(renderer) { caches.delete(renderer); }
