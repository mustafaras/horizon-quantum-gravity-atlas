// Which WebGPU adapter a page really has. Chromium on a CI runner reports a software adapter (architecture
// "swiftshader"): navigator.gpu exists and requestAdapter() succeeds, yet it is not native GPU evidence. Specs that
// assert the native compute path must skip on it; the software-adapter contracts live in render-backends.spec.mjs.

/** Resolves to "none", "software" or "native" for the page's WebGPU adapter. */
export function webgpuAdapterKind(page) {
  return page.evaluate(async () => {
    if (!navigator.gpu) return "none";
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return "none";
      const info = adapter.info ?? {};
      const software = adapter.isFallbackAdapter === true || info.isFallbackAdapter === true
        || /swiftshader|llvmpipe|software|lavapipe/i.test(`${info.architecture ?? ""} ${info.vendor ?? ""} ${info.description ?? ""}`);
      return software ? "software" : "native";
    } catch { return "none"; }
  });
}
