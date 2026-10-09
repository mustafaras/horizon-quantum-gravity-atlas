export function awaitInitialization(promise, { signal, timeoutMs = 20_000, label = "GPU initialization", onLateResult } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return false;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      callback(value);
      return true;
    };
    const abort = () => finish(reject, new DOMException(`${label} cancelled`, "AbortError"));
    const timer = setTimeout(() => finish(reject, new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    Promise.resolve(promise).then((value) => {
      if (!finish(resolve, value)) onLateResult?.(value);
    }, (error) => { finish(reject, error); });
  });
}
