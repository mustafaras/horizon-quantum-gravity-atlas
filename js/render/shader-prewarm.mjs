const caches = new WeakMap();
const kitCaches = new WeakMap();

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

/**
 * Compiles the TSL material kit's canonical shader variants once per renderer (S07). The kit module is loaded only when a
 * scene actually holds a kit material (it pulls in three/webgpu), so scenes without one never pay for it.
 */
function sceneHasKit(scene) {
  let found = false;
  scene?.traverse?.((object) => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some((material) => material?.userData?.qgaNodeKit === true)) found = true;
  });
  return found;
}

async function prewarmKit({ renderer, scene, camera, signal }) {
  if (!renderer?.isWebGPURenderer || !sceneHasKit(scene)) return undefined;
  if (kitCaches.has(renderer)) return kitCaches.get(renderer);
  const kit = await import("./materials/index.mjs");
  const signature = kit.kitPrewarmSignature();
  const promise = (async () => {
    const probe = kit.createKitProbeScene();
    try { await renderer.compileAsync(probe, camera); abortIfNeeded(signal); }
    finally { probe.userData.dispose(); }
    return signature;
  })();
  kitCaches.set(renderer, promise);
  try { return await promise; }
  catch (error) { if (kitCaches.get(renderer) === promise) kitCaches.delete(renderer); throw error; }
}

export async function prewarmShaders({ renderer, backend, scene, camera, view, quality, pipeline, signal }) {
  abortIfNeeded(signal);
  await prewarmKit({ renderer, scene, camera, signal });
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

export function invalidatePrewarm(renderer) { caches.delete(renderer); kitCaches.delete(renderer); }
