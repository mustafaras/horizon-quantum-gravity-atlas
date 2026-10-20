// js/cinematic/scene-transition.mjs — capability-gated scene transitions.
//
// Cinematic mode gets a short gravitational-lens/metric-distortion flash:
// a full-viewport WebGL2 overlay rendering an expanding lens ring while the
// view swaps underneath. Reduced motion, minimal/scientific/capture modes,
// or missing WebGL2 fall back to a short CSS crossfade with no spatial
// distortion.
//
// Guarantees:
//  - the destination shader is prewarmed (compiled + one draw) before the
//    first lens transition; a compile/link/draw failure or a timeout
//    downgrades to crossfade and reports a clear initialization error
//    instead of trapping the app;
//  - single-flight: rapid navigation reuses the one overlay element and the
//    one animation loop — never a second concurrent loop.

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision mediump float;
uniform float uTime;    // 0..1 normalized progress
uniform float uAspect;
uniform vec2 uResolution;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 c = (uv - 0.5) * vec2(uAspect, 1.0);
  float d = length(c);
  float t = clamp(uTime, 0.0, 1.0);
  // expanding lens ring: light bent into a bright annulus that sweeps outward
  float ringR = t * 1.15;
  float ring = exp(-pow((d - ringR) * 9.0, 2.0));
  // metric pinch near the centre during the first half of the transition
  float pinch = exp(-d * d * 14.0) * (1.0 - t) * 0.6;
  float fade = sin(t * 3.14159265);
  vec3 tint = mix(vec3(0.55, 0.72, 1.0), vec3(1.0, 0.85, 0.6), d);
  float a = (ring * 0.55 + pinch * 0.5) * fade;
  outColor = vec4(tint * (ring + pinch), a);
}`;

function webgl2Available() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGL2RenderingContext && c.getContext("webgl2"));
  } catch (e) { return false; }
}

export function createSceneTransition(options = {}) {
  const {
    reducedMotion = false, vizMode = "cinematic",
    prewarmTimeoutMs = 2500, onError = () => {},
    requestFrame = (typeof requestAnimationFrame === "function" ? requestAnimationFrame : null),
    cancelFrame = (typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : null),
  } = options;

  const wantsLens = !reducedMotion && vizMode === "cinematic";
  let mode = wantsLens && webgl2Available() ? "lens" : "crossfade";
  let gl = null, program = null, vao = null, uTime = null, uAspect = null, uResolution = null;
  let overlay = null, canvas = null, cssTimer = null;
  let loopId = null, loopStart = 0;
  let prewarmed = false, prewarming = null;
  let degraded = false;   // prewarm failed once: shader compile failure is deterministic, stay on crossfade
  let disposed = false;

  const DURATION_MS = 460;
  const CROSSFADE_MS = 220;

  function compilePrewarm() {
    const context = document.createElement("canvas");
    context.width = 4; context.height = 4;
    const ctx = context.getContext("webgl2", { alpha: true, premultipliedAlpha: true });
    if (!ctx) throw new Error("WebGL2 context unavailable for the transition shader");
    const compile = (type, src) => {
      const sh = ctx.createShader(type);
      ctx.shaderSource(sh, src);
      ctx.compileShader(sh);
      if (!ctx.getShaderParameter(sh, ctx.COMPILE_STATUS)) {
        throw new Error("transition shader: " + ctx.getShaderInfoLog(sh));
      }
      return sh;
    };
    const vs = compile(ctx.VERTEX_SHADER, VERT);
    const fs = compile(ctx.FRAGMENT_SHADER, FRAG);
    const prog = ctx.createProgram();
    ctx.attachShader(prog, vs); ctx.attachShader(prog, fs);
    ctx.linkProgram(prog);
    if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) {
      throw new Error("transition program link failed: " + ctx.getProgramInfoLog(prog));
    }
    ctx.useProgram(prog);
    const emptyVao = ctx.createVertexArray();
    ctx.bindVertexArray(emptyVao);
    ctx.viewport(0, 0, 4, 4);
    ctx.uniform1f(ctx.getUniformLocation(prog, "uTime"), 0.5);
    ctx.uniform1f(ctx.getUniformLocation(prog, "uAspect"), 1.0);
    ctx.uniform2f(ctx.getUniformLocation(prog, "uResolution"), 4.0, 4.0);
    ctx.drawArrays(ctx.TRIANGLES, 0, 3);
    if (ctx.getError() !== 0) throw new Error("transition shader test draw raised a GL error");
    // keep the compiled program for the live overlay
    return { ctx, prog, emptyVao, uTime: ctx.getUniformLocation(prog, "uTime"),
      uAspect: ctx.getUniformLocation(prog, "uAspect"),
      uResolution: ctx.getUniformLocation(prog, "uResolution") };
  }

  function withTimeout(promiseFactory, ms, label) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(label + " timed out after " + ms + "ms")), ms);
      Promise.resolve().then(promiseFactory).then(
        (v) => { clearTimeout(timer); resolve(v); },
        (e) => { clearTimeout(timer); reject(e); },
      );
    });
  }

  /** Compile + test-draw the lens shader before it is ever needed. */
  function prewarm() {
    if (mode !== "lens" || prewarmed) return Promise.resolve({ ok: mode === "lens", mode });
    if (!prewarming) {
      prewarming = withTimeout(() => compilePrewarm(), prewarmTimeoutMs, "scene transition shader prewarm")
        .then((res) => {
          gl = res.ctx; program = res.prog; vao = res.emptyVao;
          uTime = res.uTime; uAspect = res.uAspect; uResolution = res.uResolution;
          prewarmed = true;
          return { ok: true, mode };
        })
        .catch((error) => {
          mode = "crossfade";
          degraded = true;
          onError(error.message);
          return { ok: false, mode, error: error.message };
        });
    }
    return prewarming;
  }

  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "scene-transition";
    overlay.setAttribute("aria-hidden", "true");
    canvas = document.createElement("canvas");
    canvas.className = "scene-transition-canvas";
    overlay.appendChild(canvas);
    document.body.appendChild(overlay);
  }

  function stopLoop() {
    if (loopId != null && cancelFrame) cancelFrame(loopId);
    loopId = null;
    if (cssTimer != null) { clearTimeout(cssTimer); cssTimer = null; }
  }

  function teardown() {
    stopLoop();
    if (overlay) overlay.classList.remove("on");
  }

  function frame(now) {
    loopId = null;
    if (disposed || !overlay) return;
    const t = Math.min(1, (now - loopStart) / DURATION_MS);
    if (mode === "lens" && gl && program) {
      const w = Math.max(2, Math.floor(canvas.clientWidth)), h = Math.max(2, Math.floor(canvas.clientHeight));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uAspect, canvas.width / canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (t < 1 && requestFrame) loopId = requestFrame(frame);
    else teardown();
  }

  /**
   * Run one transition. Rapid calls reuse the same overlay and restart the
   * same loop — there is never more than one transition loop alive. If the
   * lens shader has not finished prewarming, this transition crossfades;
   * later transitions get the lens once prewarm succeeds.
   */
  function run() {
    if (disposed) return;
    void prewarm(); // idempotent; schedules compilation on first call
    const useLens = mode === "lens" && prewarmed && !!gl;
    stopLoop();
    ensureOverlay();
    overlay.classList.toggle("scene-transition-lens", useLens);
    overlay.classList.remove("on");
    // restart the CSS animation on the same element
    void overlay.offsetWidth;
    overlay.classList.add("on");
    if (useLens) {
      loopStart = performance.now();
      loopId = requestFrame ? requestFrame(frame) : null;
    } else {
      cssTimer = setTimeout(teardown, CROSSFADE_MS + 60);
    }
  }

  /** Number of live transition loops (QA assertion hook: must stay ≤ 1). */
  function activeLoops() { return loopId != null || cssTimer != null ? 1 : 0; }

  function dispose() {
    disposed = true;
    stopLoop();
    if (overlay) overlay.remove();
    overlay = null; canvas = null;
    if (gl) { try { gl.getExtension("WEBGL_lose_context")?.loseContext(); } catch (e) {} }
    gl = null; program = null;
  }

  return {
    get mode() { return mode; },
    get disposed() { return disposed; },
    prewarm, run, activeLoops, dispose,
    /** Re-evaluate the mode when settings change (vizMode/motion). */
    configure({ reducedMotion: rm = reducedMotion, vizMode: vm = vizMode } = {}) {
      const next = !degraded && !rm && vm === "cinematic" && webgl2Available() ? "lens" : "crossfade";
      if (next !== mode) { mode = next; prewarmed = false; prewarming = null; }
      return mode;
    },
  };
}
