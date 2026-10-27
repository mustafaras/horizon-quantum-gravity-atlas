// CPU rasterizers (SwiftShader, llvmpipe, WARP...) run the cinematic post
// graph at seconds per frame, far slower than the quality governor's rolling
// windows can recover from. Detect them once so sessions start on the low tier.
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|lavapipe|software|microsoft basic render/i;

let cached;

export function isSoftwareRendererName(name) {
  return typeof name === "string" && SOFTWARE_RENDERER.test(name);
}

export function detectSoftwareRenderer() {
  if (cached !== undefined) return cached;
  cached = null;
  try {
    const canvas = globalThis.document?.createElement("canvas");
    const gl = canvas?.getContext("webgl2") || canvas?.getContext("webgl");
    if (!gl) return cached;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    cached = isSoftwareRendererName(name) ? String(name) : null;
  } catch { cached = null; }
  return cached;
}

/**
 * The clamp the render session applies to CPU rasterizers: the detected
 * rasterizer name, or `null` when the caller opted out with
 * `QGA_RENDER_OPTIONS.softwareClamp === false`.
 *
 * Consumers that need the *effective* quality tier rather than the requested
 * one must go through this, so the opt-out is honoured in exactly one place
 * and a module can never disagree with the session about what the device can
 * afford.
 */
export function softwareRendererClamp() {
  const options = globalThis.QGA_RENDER_OPTIONS || {};
  return options.softwareClamp === false ? null : detectSoftwareRenderer();
}
