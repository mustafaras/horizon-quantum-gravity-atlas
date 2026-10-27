/**
 * Compare swipe divider GPU overlay (Prompt 10).
 *
 * A WebGL2 fullscreen-triangle pass (gl_VertexID — no vertex buffers, the
 * same pattern the scene-transition layer uses) that draws the swipe seam:
 * a thin lens-distortion band with a ±2px chromatic fringe, plus a soft
 * grip glow. The underlying panes are DOM (clipped by the host), so this
 * overlay is purely the seam treatment — it never samples page content.
 *
 * Discipline:
 *   - Capability-gated: WebGL2 only; the host falls back to a CSS divider
 *     when creation fails or the first draw exceeds the prewarm timeout
 *     (software rasterizers are detected and refused up front).
 *   - Uniform-driven: the host sets uX/uTime per frame from the shared
 *     motion clock; the overlay owns no loop of its own.
 *   - Deterministic degradation: dispose() is idempotent and never throws.
 */

const VERT_SRC = `#version 300 es
out vec2 vUv;
void main() {
  // Fullscreen triangle from gl_VertexID — no attributes, no buffers.
  vec2 positions[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
  vUv = positions[gl_VertexID] * 0.5 + 0.5;
}`;

const FRAG_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float uX;        // seam position in [0, 1]
uniform float uTime;     // seconds, shared motion clock
uniform vec2  uSize;     // drawing-buffer pixels
uniform float uReduced;  // 1.0 → distortion/fringe disabled

const float FRINGE_PX = 2.0;

void main() {
  float px = vUv.x * uSize.x;
  float seam = uX * uSize.x;
  float d = px - seam;

  // Thin lens distortion: a refraction-like wobble band hugging the seam.
  // Two octaves of sideways shear, faded by |d| so it stays "thin".
  float band = exp(-abs(d) / 9.0);
  float wobble = sin((vUv.y * 42.0) + uTime * 2.4) * 0.55
               + sin((vUv.y * 91.0) - uTime * 3.7) * 0.25;
  float distortion = uReduced > 0.5 ? 0.0 : band * wobble;

  // Chromatic fringe: three seam lines offset by ±2px in R/G/B.
  float fringe = uReduced > 0.5 ? 0.0 : 1.0;
  float rLine = exp(-abs(d - FRINGE_PX * fringe) / 1.6);
  float gLine = exp(-abs(d) / 1.6);
  float bLine = exp(-abs(d + FRINGE_PX * fringe) / 1.6);

  vec3 col = vec3(0.32, 0.62, 1.0) * gLine
           + vec3(1.0, 0.42, 0.38) * (rLine * 0.55 + bLine * 0.55) * 0.5;

  // Lens band: brightened, hue-shifted strip with the wobble modulating width.
  float lens = band * (0.55 + 0.45 * abs(wobble));
  col += vec3(0.5, 0.68, 1.0) * lens * 0.35;
  col += vec3(0.85, 0.9, 1.0) * exp(-abs(d) / 0.9) * 0.9; // crisp core

  // Vertical fade at the very top/bottom so the seam reads as glass.
  float endFade = smoothstep(0.0, 0.04, vUv.y) * smoothstep(1.0, 0.96, vUv.y);
  float alpha = (gLine * 0.85 + lens * 0.3 + exp(-abs(d) / 0.9)) * endFade;
  alpha = clamp(alpha, 0.0, 1.0) * 0.9;

  outColor = vec4(col * endFade + distortion * vec3(0.2, 0.35, 0.6) * 0.18, alpha);
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = new Error(`divider shader compile failed: ${gl.getShaderInfoLog(shader)}`);
    gl.deleteShader(shader);
    throw error;
  }
  return shader;
}

/**
 * Create the overlay on a canvas. Throws when WebGL2 is unavailable or the
 * context is a known software rasterizer — the host catches and degrades
 * to the CSS divider. `render(x, time)` draws one frame; the host drives it
 * from the shared motion clock.
 */
export function createDividerOverlay(canvas, { softwareRendererClamp = null } = {}) {
  if (!canvas || typeof canvas !== "object") throw new TypeError("divider overlay requires a canvas");
  const clamped = typeof softwareRendererClamp === "function" ? softwareRendererClamp() : null;
  if (clamped) throw new Error(`software rasterizer (${clamped}) refuses the divider overlay`);
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: false, antialias: false, depth: false, stencil: false });
  if (!gl) throw new Error("WebGL2 is unavailable for the divider overlay");
  let disposed = false;
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT_SRC));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`divider shader link failed: ${gl.getProgramInfoLog(program)}`);
    }
  } catch (error) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    throw error;
  }
  const uniforms = {
    uX: gl.getUniformLocation(program, "uX"),
    uTime: gl.getUniformLocation(program, "uTime"),
    uSize: gl.getUniformLocation(program, "uSize"),
    uReduced: gl.getUniformLocation(program, "uReduced"),
  };
  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  return Object.freeze({
    backend: "webgl2",
    resize(width, height) {
      if (disposed) return;
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = Math.max(1, Math.round(height));
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    /** Draw one frame. x in [0,1]; time in seconds; reduced disables effects. */
    render(x, time, { reduced = false } = {}) {
      if (disposed) return;
      gl.uniform1f(uniforms.uX, Math.min(1, Math.max(0, x)));
      gl.uniform1f(uniforms.uTime, Number(time) || 0);
      gl.uniform2f(uniforms.uSize, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uReduced, reduced ? 1 : 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        gl.deleteProgram(program);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      } catch (error) { /* degradation must never throw */ }
    },
  });
}
