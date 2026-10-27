/**
 * Three r186 boundary for WebGPUPipelineUtils' orphaned scope/diagnostic promises.
 * Descriptor generation stays upstream and native GPU pipelines stay real.
 * Only each renderer's utility instance is adapted; vendor bytes, GPUDevice
 * prototypes, Promise and global rejection handlers are never modified.
 */
const adapters = new WeakMap();
const deviceQueues = new WeakMap();
// device -> Set<api>. A single GPUDevice can back several renderers, so every
// adapter attached to it must be drained before that device is destroyed.
const deviceAdapters = new WeakMap();

function combined(errors) {
  const unique = [...new Set(errors)];
  if (unique.length === 1) return unique[0];
  return new AggregateError(unique, unique.map((error) => error.message).join("; "), { cause: unique[0] });
}

export function getWebGPUValidation(renderer) {
  return adapters.get(renderer) ?? null;
}

/**
 * Settle every adapter's pending error scopes for one device. Call before
 * device.destroy(): Chromium resolves an error scope asynchronously, and
 * destroying a device while a popped scope is unresolved logs
 * "Instance dropped in popErrorScope" once per pending scope. Bounded, because
 * teardown must never hang on a lost or wedged device.
 * Returns true when nothing was left pending within the budget.
 */
export async function drainWebGPUValidation(device, { timeoutMs = 10_000 } = {}) {
  const attached = deviceAdapters.get(device);
  if (!attached?.size) return true;
  const results = await Promise.all([...attached].map((api) => api.drainScopes(timeoutMs)));
  return results.every(Boolean);
}

/**
 * Attach after renderer.init(), before its first compileAsync().
 * compileAsync/compileComputeAsync and dispose are protected automatically.
 * run(operation) additionally brackets hidden post-processing draws.
 */
export async function attachWebGPUValidation(renderer) {
  if (!renderer?.isWebGPURenderer || !renderer.backend?.isWebGPUBackend) return null;
  if (adapters.has(renderer)) return adapters.get(renderer);
  const { REVISION } = await import("three");
  if (adapters.has(renderer)) return adapters.get(renderer);
  const backend = renderer.backend;
  const utils = backend.pipelineUtils;
  const originals = {
    render: utils?.createRenderPipeline,
    compute: utils?.createComputePipeline,
    diagnostics: utils?._reportShaderDiagnostics,
    compile: renderer.compileAsync,
    compileCompute: renderer.compileComputeAsync,
    dispose: renderer.dispose,
  };
  const shape = (method) => typeof method === "function"
    && /promises\s*===\s*null/.test(method.toString())
    && /device\.popErrorScope\(\)\.then/.test(method.toString())
    && /new Promise\(\s*async/.test(method.toString());
  if (REVISION !== "186" || utils?.backend !== backend || !shape(originals.render)
    || !shape(originals.compute) || typeof originals.diagnostics !== "function"
    || typeof originals.compile !== "function" || typeof originals.dispose !== "function"
    || typeof renderer.onError !== "function") {
    throw new Error("WebGPU validation adapter requires the verified Three 0.186.1/r186 utility shape");
  }
  const device = backend.device;
  const pending = new Set();
  const operations = new Set();
  const failures = [];
  const reported = new Set();
  let depth = 0;
  let closing = false;
  let disposal = null;

  function record(error) {
    const failure = error instanceof Error ? error : new Error(String(error));
    if (failures.includes(failure)) return;
    failures.push(failure);
    if (depth === 0) {
      try {
        renderer.onError({ api: "WebGPU", type: "validation", message: failure.message, error: failure });
        reported.add(failure);
      } catch (callbackError) {
        failures.push(callbackError);
      }
    }
  }

  function track(promise, scope = false) {
    const observed = Promise.resolve(promise).then((value) => {
      if (scope && value !== null) record(new Error(`WebGPU validation failed: ${value.message}`, { cause: value }));
    }).catch(record);
    pending.add(observed);
    observed.then(() => pending.delete(observed));
    return promise;
  }

  async function settle() {
    while (pending.size) await Promise.all([...pending]);
  }

  // Bounded settle for teardown: never wait forever on a scope whose
  // continuation the browser has stopped delivering.
  async function drainScopes(timeoutMs) {
    const settled = settle().then(() => true, () => true);
    let timer;
    const expiry = new Promise((resolve) => { timer = setTimeout(() => resolve(false), timeoutMs); });
    try {
      return await Promise.race([settled, expiry]);
    } finally {
      clearTimeout(timer);
    }
  }

  // popErrorScope's original .then continuation is tracked separately from
  // the underlying scope. Returned promises keep their rejection semantics.
  function popScope() {
    const promise = device.popErrorScope();
    track(promise, true);
    return {
      then(fulfilled, rejected) {
        return track(promise.then(fulfilled, rejected));
      },
    };
  }

  let openScopes = 0;
  const facade = new Proxy(device, {
    get(target, key) {
      if (key === "popErrorScope") return () => { openScopes--; return popScope(); };
      if (key === "pushErrorScope") return (filter) => { target.pushErrorScope(filter); openScopes++; };
      const value = Reflect.get(target, key, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });

  function adapt(original, args, promises) {
    if (closing && depth === 0) throw new Error("WebGPU validation adapter is disposing");
    const firstFailure = failures.length;
    const savedDevice = backend.device;
    backend.device = facade;
    try {
      // r186's async executor cannot propagate unexpected await rejections.
      // Its real synchronous GPU creation path is reused instead; scope and
      // shader diagnostics still finish asynchronously and are fully awaited.
      original.call(utils, ...args, null);
    } finally {
      backend.device = savedDevice;
      while (openScopes > 0) {
        openScopes--;
        track(device.popErrorScope(), true);
      }
    }
    if (promises) {
      const result = (async () => {
        await settle();
        if (failures.length > firstFailure) throw combined(failures.slice(firstFailure));
      })();
      result.then(undefined, record);
      promises.push(result);
    }
  }

  utils.createRenderPipeline = (object, promises) => adapt(originals.render, [object], promises);
  utils.createComputePipeline = (pipeline, bindings, promises = null) => adapt(originals.compute, [pipeline, bindings], promises);
  utils._reportShaderDiagnostics = (...args) => track(originals.diagnostics.apply(utils, args));

  async function execute(operation) {
    if (failures.length) throw combined(failures);
    depth++;
    let value;
    let failure;
    const firstFailure = failures.length;
    try {
      value = await operation();
    } catch (error) {
      failure = error;
    }
    try {
      await settle();
      const errors = [...(failure ? [failure] : []), ...failures.slice(firstFailure)];
      if (errors.length) {
        for (const error of failures.slice(firstFailure)) reported.add(error);
        throw combined(errors);
      }
      return value;
    } finally {
      depth--;
    }
  }

  const api = {
    drainScopes,
    run(operation) {
      if (closing) return Promise.reject(new Error("WebGPU validation adapter is disposing"));
      let result;
      if (depth > 0) result = execute(operation);
      else {
        const queued = deviceQueues.get(device) ?? Promise.resolve();
        result = queued.then(() => execute(operation));
        deviceQueues.set(device, result.then(() => undefined, () => undefined));
      }
      const observed = result.then(() => undefined, () => undefined);
      operations.add(observed);
      observed.then(() => operations.delete(observed));
      return result;
    },
    async drain() {
      await settle();
      // Failures already delivered through an awaited operation or onError
      // must not prevent cleanup/fallback. New failures still reject.
      const unreported = failures.filter((error) => !reported.has(error));
      if (unreported.length) {
        for (const error of unreported) reported.add(error);
        throw combined(unreported);
      }
    },
    dispose() {
      if (disposal) return disposal;
      closing = true;
      disposal = (async () => {
        while (operations.size) await Promise.all([...operations]);
        await settle();
        utils.createRenderPipeline = originals.render;
        utils.createComputePipeline = originals.compute;
        utils._reportShaderDiagnostics = originals.diagnostics;
        renderer.compileAsync = originals.compile;
        if (originals.compileCompute) renderer.compileComputeAsync = originals.compileCompute;
        renderer.dispose = originals.dispose;
        adapters.delete(renderer);
        // The device -> adapters registry is intentionally left in place: it is
        // keyed weakly by device and a final drain may still be requested
        // between renderer.dispose() and device.destroy().
      })();
      return disposal;
    },
  };
  renderer.compileAsync = (...args) => api.run(() => originals.compile.apply(renderer, args));
  if (originals.compileCompute) renderer.compileComputeAsync = (...args) => api.run(() => originals.compileCompute.apply(renderer, args));
  renderer.dispose = async (...args) => {
    await api.dispose();
    return originals.dispose.apply(renderer, args);
  };
  adapters.set(renderer, api);
  const attached = deviceAdapters.get(device) ?? new Set();
  attached.add(api);
  deviceAdapters.set(device, attached);
  return api;
}
