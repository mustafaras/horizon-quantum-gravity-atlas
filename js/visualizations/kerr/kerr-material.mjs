/**
 * WebGL2 backend of the Kerr observatory: a fragment-shader geodesic
 * integrator with real temporal accumulation (Prompt 04).
 *
 *   accumulation pass  (offscreen, float MRT ping-pong; runs until converged)
 *       per pixel: Halton-jittered rays -> Carter/Mino RK4 geodesic ->
 *       disk crossings (order-tagged) + lensed filtered sky -> running mean
 *       target 0: disk radiance rgb, luminance-weighted disk-plane x of the hits
 *       target 1: sky radiance rgb,  luminance-weighted disk-plane y of the hits
 *   display pass       (scene quad, every frame)
 *       recovers the hit position (x, y) = (a0, a1) / luminance, evaluates the
 *       plasma texture there at the current coordinate time (it rotates at the
 *       local Kerr Omega(r) from the disk table), applies the focus defocus,
 *       and leaves tone mapping to the render pipeline (one tone map + sRGB).
 *
 * Because the spacetime and camera are stationary, the expensive geodesics are
 * traced once and accumulated; only the cheap texture animates per frame.
 *
 * Operation order per disk hit (identical to `shadeDiskHit` in
 * kerr-observatory.mjs, which the Node tests check against the science API):
 *   emitted T (table) -> g = 1/(u^t (E - Omega L_z)) -> T_obs = g T -> blackbody
 *   chromaticity (table) -> I = g^4 F/F_max -> exposure -> crossing weights
 *   -> [display: plasma factor] -> [pipeline: tone map].
 *
 * The integrator equations are the same ones the CPU reference tracer uses;
 * nothing here restates ISCO, horizon, spectral or g-factor *values* — they
 * arrive through the science-derived lookup tables and observer coefficients.
 */

import {
  ClampToEdgeWrapping, DataTexture, FloatType, GLSL3, HalfFloatType, LinearFilter,
  LinearMipmapLinearFilter, Mesh, NearestFilter, NoColorSpace, OrthographicCamera,
  PlaneGeometry, RGBAFormat, RepeatWrapping, Scene, ShaderMaterial, UnsignedByteType,
  Vector2, WebGLRenderTarget,
} from "three";
import {
  KERR_RENDER_CONSTANTS,
  KerrTemporalAccumulator,
  buildKerrRenderState,
  kerrAccumulationKey,
  kerrJitter,
  kerrObserverFromCamera,
  kerrQualityBudget,
  normalizeKerrState,
} from "./kerr-observatory.mjs";
import { KERR_PLASMA_GLSL } from "./kerr-plasma.mjs";
import { STARFIELD_MAX_FOOTPRINT_RAD, STARFIELD_VMAX, renderStarfield } from "./starfield-texture.mjs";
import { createKerrTables, kerrPlasmaClock, kerrSeed } from "./kerr-runtime-shared.mjs";

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/** Disk-table and colour-table lookups shared by both passes. */
const TABLES_GLSL = /* glsl */ `
uniform float uRIn, uROut, uColorLogMin, uColorLogSpan;
uniform int uLutSize, uColorSize;
uniform sampler2D uDiskLut, uColorLut;
vec4 diskRow(float r) {
  float s = clamp((r - uRIn) / (uROut - uRIn), 0.0, 1.0);
  float x = sqrt(s) * float(uLutSize - 1);
  int i0 = min(uLutSize - 2, int(floor(x)));
  return mix(texelFetch(uDiskLut, ivec2(i0, 0), 0), texelFetch(uDiskLut, ivec2(i0 + 1, 0), 0), x - float(i0));
}
vec3 chroma(float kelvin) {
  float t = clamp((log(max(kelvin, 1.0)) / 2.302585093 - uColorLogMin) / uColorLogSpan, 0.0, 1.0);
  float x = t * float(uColorSize - 1);
  int i0 = min(uColorSize - 2, int(floor(x)));
  return mix(texelFetch(uColorLut, ivec2(i0, 0), 0), texelFetch(uColorLut, ivec2(i0 + 1, 0), 0), x - float(i0)).rgb;
}
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
`;

/** Integrator + shading. Constants of the model come in as uniforms. */
export const KERR_ACCUMULATE_FRAGMENT = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;
varying vec2 vUv;
layout(location = 0) out vec4 oDisk;
layout(location = 1) out vec4 oSky;

uniform vec2 uResolution;
uniform float uTanHalfFov, uAspect;
uniform float uSpin, uRPlus;
uniform float uR0, uU0, uSinT0, uPhi0;
uniform vec4 uCoef;           // E0, E1, L0, L1
uniform vec2 uMom;            // P1 (p_theta per n_theta), R1 (p_r per n_r)
uniform float uStepK, uEscape, uMargin;
uniform int uMaxSteps, uSamples;
uniform vec2 uJitter[4];
uniform float uTransmit, uSoftEdge, uExposure, uDiskGain, uSkyGain, uOrderTint;
uniform float uSkyVmax, uMaxFootprint, uHistoryWeight;
uniform uint uSeed;
uniform sampler2D uHistoryDisk, uHistorySky, uSkyTexture;
${TABLES_GLSL}
${KERR_PLASMA_GLSL}
const float PI = 3.14159265358979;

vec3 skyColor(vec3 dir, float footprint) {
  vec2 uv = vec2(atan(dir.z, dir.x) / (2.0 * PI) + 0.5, acos(clamp(dir.y, -1.0, 1.0)) / PI);
  float fp = min(footprint, uMaxFootprint);
  vec3 enc = textureGrad(uSkyTexture, uv, vec2(fp / (2.0 * PI), 0.0), vec2(0.0, fp / PI)).rgb;
  return enc * enc * uSkyVmax * uSkyGain;
}

struct RayState { float r; float vr; vec3 m; vec3 w; float drag; };
vec3 rotateAxis(vec3 v, float angle) {
  float c = cos(angle), sn = sin(angle);
  return vec3(c * v.x - sn * v.y, sn * v.x + c * v.y, v.z);
}
RayState rayDerivative(RayState s, float E, float Lz, float Q, float a) {
  float a2 = a * a;
  float P = E * (s.r * s.r + a2) - a * Lz;
  float K = (Lz - a * E) * (Lz - a * E) + Q;
  float D = max(s.r * s.r - 2.0 * s.r + a2, 1e-6);
  float aE2 = a2 * E * E;
  float omega2 = Q + Lz * Lz + aE2 * s.m.z * s.m.z;
  RayState d;
  d.r = s.vr;
  d.vr = 2.0 * E * s.r * P - (s.r - 1.0) * K;
  d.m = s.w;
  d.w = -omega2 * s.m + aE2 * s.m.z * (vec3(0.0, 0.0, 1.0) - s.m.z * s.m);
  d.drag = a * P / D - a * E;
  return d;
}
RayState rayAdd(RayState s, RayState d, float h) {
  RayState t;
  t.r = s.r + h * d.r; t.vr = s.vr + h * d.vr;
  t.m = s.m + h * d.m; t.w = s.w + h * d.w;
  t.drag = s.drag + h * d.drag;
  return t;
}
RayState rayStep(RayState s, float h, float E, float Lz, float Q, float a) {
  RayState k1 = rayDerivative(s, E, Lz, Q, a);
  RayState k2 = rayDerivative(rayAdd(s, k1, 0.5 * h), E, Lz, Q, a);
  RayState k3 = rayDerivative(rayAdd(s, k2, 0.5 * h), E, Lz, Q, a);
  RayState k4 = rayDerivative(rayAdd(s, k3, h), E, Lz, Q, a);
  float sixth = h / 6.0;
  RayState t;
  t.r = s.r + sixth * (k1.r + 2.0 * k2.r + 2.0 * k3.r + k4.r);
  t.vr = s.vr + sixth * (k1.vr + 2.0 * k2.vr + 2.0 * k3.vr + k4.vr);
  t.m = s.m + sixth * (k1.m + 2.0 * k2.m + 2.0 * k3.m + k4.m);
  t.w = s.w + sixth * (k1.w + 2.0 * k2.w + 2.0 * k3.w + k4.w);
  t.drag = s.drag + sixth * (k1.drag + 2.0 * k2.drag + 2.0 * k3.drag + k4.drag);
  float a2 = a * a;
  float P = E * (t.r * t.r + a2) - a * Lz;
  float K = (Lz - a * E) * (Lz - a * E) + Q;
  float R = P * P - (t.r * t.r - 2.0 * t.r + a2) * K;
  t.vr = (t.vr >= 0.0 ? 1.0 : -1.0) * sqrt(max(R, 0.0));
  t.m = normalize(t.m);
  t.w -= dot(t.w, t.m) * t.m;
  float wLength = length(t.w);
  float speed = sqrt(max(Q + Lz * Lz + a2 * E * E * t.m.z * t.m.z, 0.0));
  if (wLength > 1e-12) t.w *= speed / wLength;
  return t;
}
// out: rgb = disk radiance, hit = luminance-weighted disk-plane (x, y) of the emitting crossings,
//      transmit = leftover, dir = world direction (escape or last position)
void trace(vec2 ndc, out vec3 rgb, out vec2 hit, out float transmit, out vec3 dir, out float escaped) {
  float sx = ndc.x * uTanHalfFov * uAspect;
  float sy = ndc.y * uTanHalfFov;
  float inv = inversesqrt(1.0 + sx * sx + sy * sy);
  vec3 n = vec3(-inv, -sy * inv, sx * inv);
  float a = uSpin;
  float a2 = a * a;
  float E = uCoef.x + uCoef.y * n.z;
  float Lz = uCoef.z + uCoef.w * n.z;
  float pth = uMom.x * n.y;
  float u = uU0;
  float Q = pth * pth + u * u * (-a2 * E * E + Lz * Lz / max(1.0 - u * u, 1e-12));
  float K = (Lz - a * E) * (Lz - a * E) + Q;
  RayState s;
  s.r = uR0;
  s.vr = (uR0 * uR0 - 2.0 * uR0 + a2) * uMom.y * n.x;
  float cp = cos(uPhi0), sp = sin(uPhi0);
  float azimuthal = Lz / max(uSinT0, 1e-6);
  s.m = vec3(uSinT0 * cp, uSinT0 * sp, u);
  s.w = vec3(pth * u * cp - azimuthal * sp,
             pth * u * sp + azimuthal * cp, -pth * uSinT0);
  s.drag = 0.0;
  rgb = vec3(0.0);
  hit = vec2(0.0);
  transmit = 1.0;
  escaped = 0.0;
  float order = 0.0;
  bool done = false;

  for (int i = 0; i < 512; i++) {
    if (i >= uMaxSteps) break;
    float h = uStepK * min(1.0 / s.r, (s.r - uRPlus) / (abs(s.vr) + 1.0));
    RayState next = rayStep(s, h, E, Lz, Q, a);
    if (s.m.z * next.m.z < 0.0) {
      float f = s.m.z / (s.m.z - next.m.z);
      float rc = s.r + f * (next.r - s.r);
      if (rc >= uRIn && rc <= uROut) {
        float alpha = uSoftEdge > 0.5 ? kerrEdgeOpacity(rc, uROut) : 1.0;
        vec4 row = diskRow(rc);
        float den = row.y * (E - row.x * Lz);
        if (den > 1e-4) {
          float g = 1.0 / den;
          float I = pow(g, 4.0) * row.z * uDiskGain * uExposure;
          vec3 col = chroma(g * row.w) * I;
          if (uOrderTint > 0.5) {
            if (order > 1.5) col *= vec3(1.25, 0.55, 1.2);
            else if (order > 0.5) col *= vec3(0.5, 1.0, 1.25);
          }
          vec3 emitted = transmit * alpha * col;
          vec2 mc = mix(s.m.xy, next.m.xy, f);
          float phiC = atan(mc.y, mc.x) + mix(s.drag, next.drag, f);
          rgb += emitted;
          hit += dot(emitted, LUMA) * rc * vec2(cos(phiC), sin(phiC));
        }
        transmit *= uSoftEdge > 0.5 ? 1.0 - alpha : uTransmit;
        if (transmit <= 1e-4) { transmit = 0.0; done = true; }
      }
      order += 1.0;
    }
    s = next;
    if (done) break;
    if (s.r < uRPlus + uMargin && s.vr < 0.0) { transmit = 0.0; break; }
    if (s.r > uEscape && s.vr > 0.0) { escaped = 1.0; break; }
  }

  vec3 position = rotateAxis(s.m, s.drag);
  float dragRate = rayDerivative(s, E, Lz, Q, a).drag;
  vec3 angular = rotateAxis(s.w, s.drag) + dragRate * vec3(-position.y, position.x, 0.0);
  vec3 velocity = s.vr * position + s.r * angular;
  vec3 world = vec3(velocity.x, velocity.z, velocity.y);
  dir = escaped > 0.5 ? normalize(world) : vec3(position.x, position.z, position.y);
}

void main() {
  vec3 disk = vec3(0.0), sky = vec3(0.0);
  vec2 hits = vec2(0.0);
  for (int s = 0; s < 4; s++) {
    if (s >= uSamples) break;
    vec2 uv = vUv + uJitter[s] / uResolution;
    vec3 rgb; vec2 hit; float transmit; vec3 dir; float escaped;
    trace(uv * 2.0 - 1.0, rgb, hit, transmit, dir, escaped);
    float fp = max(length(dFdx(dir)), length(dFdy(dir)));
    disk += rgb;
    hits += hit;
    if (escaped > 0.5 && transmit > 0.0) {
      sky += transmit * skyColor(dir, fp);
    }
  }
  float inv = 1.0 / float(uSamples);
  ivec2 texel = ivec2(gl_FragCoord.xy);
  oDisk = mix(texelFetch(uHistoryDisk, texel, 0), vec4(disk, hits.x) * inv, uHistoryWeight);
  oSky = mix(texelFetch(uHistorySky, texel, 0), vec4(sky, hits.y) * inv, uHistoryWeight);
}`;

const DISPLAY_FRAGMENT = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;
varying vec2 vUv;
layout(location = 0) out vec4 oColor;
uniform sampler2D uDisk, uSky;
uniform vec2 uTexel;
uniform float uAspect, uTime, uPlasma;
uniform uint uSeed;
uniform vec4 uFocus; // center uv.xy, radius, strength
${TABLES_GLSL}
${KERR_PLASMA_GLSL}

vec3 radiance(vec2 uv, float m) {
  return texture(uDisk, uv).rgb * m + texture(uSky, uv).rgb;
}

void main() {
  vec4 d = texture(uDisk, vUv);
  vec4 s = texture(uSky, vUv);
  float lum = dot(d.rgb, LUMA);
  // Luminance-weighted mean hit position in the disk plane, and its footprint per pixel
  // (derivatives are taken in uniform control flow; at image-order boundaries the footprint
  // is large, every octave fades and the factor becomes exactly 1).
  vec2 xy = vec2(d.a, s.a) / max(lum, 1e-12);
  float footprint = max(length(dFdx(xy)), length(dFdy(xy)));
  float m = 1.0;
  float r = length(xy);
  if (uPlasma > 0.5 && lum > 1e-9 && r >= uRIn && r <= uROut) {
    m = kerrPlasma(r, atan(xy.y, xy.x), diskRow(r).x, uTime, footprint, uSeed);
  }
  vec3 c = d.rgb * m + s.rgb;
  float dist = length((vUv - uFocus.xy) * vec2(uAspect, 1.0));
  float defocus = uFocus.w * smoothstep(uFocus.z, uFocus.z * 2.4, dist);
  if (defocus > 0.001) {
    vec3 b = vec3(0.0);
    for (int j = -2; j <= 2; j++) {
      for (int i = -2; i <= 2; i++) {
        b += radiance(vUv + vec2(float(i), float(j)) * uTexel * (1.0 + 2.5 * defocus), m);
      }
    }
    c = mix(c, b / 25.0, defocus);
  }
  oColor = vec4(c, 1.0);
}`;

/**
 * Create the WebGL2 runtime. Add `runtime.mesh` to the scene; call
 * `runtime.sync(...)` once per frame before rendering.
 */
export function createKerrGlslRuntime({ seed = 42 } = {}) {
  const accumulator = new KerrTemporalAccumulator(1);
  const tables = createKerrTables();
  const clock = kerrPlasmaClock();
  const skyCache = new Map();
  let skyQuality = null;
  let skyTex = null;
  function skyFor(quality) {
    const key = `${quality}|${seed}`;
    if (!skyCache.has(key)) {
      if (skyCache.size >= 2) skyCache.delete(skyCache.keys().next().value);
      skyCache.set(key, renderStarfield({ seed, quality }));
    }
    return skyCache.get(key);
  }
  function makeSkyTexture(sky) {
    const texture = new DataTexture(sky.levels[0].data, sky.width, sky.height, RGBAFormat, UnsignedByteType);
    texture.mipmaps = sky.levels.map((level) => ({ data: level.data, width: level.width, height: level.height }));
    texture.generateMipmaps = false;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.magFilter = LinearFilter;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.colorSpace = NoColorSpace;
    texture.needsUpdate = true;
    return texture;
  }
  const size = new Vector2(2, 2);
  let targets = [null, null];
  let writeIndex = 0;
  let pending = true;
  let wasConverged = false;
  let latest = { backend: "webgl2", frames: 0, resets: 0, resolution: [0, 0], budget: null };

  const shared = {
    uRIn: { value: 6 }, uROut: { value: KERR_RENDER_CONSTANTS.diskOuter },
    uColorLogMin: { value: 0 }, uColorLogSpan: { value: 1 },
    uLutSize: { value: KERR_RENDER_CONSTANTS.diskLutSize }, uColorSize: { value: KERR_RENDER_CONSTANTS.colorLutSize },
    uDiskLut: { value: null }, uColorLut: { value: null },
    uSeed: { value: kerrSeed(seed) },
  };
  const uniforms = {
    ...shared,
    uResolution: { value: new Vector2(2, 2) },
    uTanHalfFov: { value: 0.4 }, uAspect: { value: 1 },
    uSpin: { value: 0 }, uRPlus: { value: 2 },
    uR0: { value: 40 }, uU0: { value: 0.25 }, uSinT0: { value: 0.97 }, uPhi0: { value: 0 },
    uCoef: { value: { x: 0, y: 0, z: 0, w: 0 } }, uMom: { value: new Vector2() },
    uStepK: { value: 0.16 }, uEscape: { value: KERR_RENDER_CONSTANTS.escapeRadius },
    uMargin: { value: KERR_RENDER_CONSTANTS.captureMargin },
    uMaxSteps: { value: 224 }, uSamples: { value: 1 },
    uJitter: { value: [new Vector2(), new Vector2(), new Vector2(), new Vector2()] },
    uTransmit: { value: 0 }, uSoftEdge: { value: 1 }, uExposure: { value: 1 },
    uDiskGain: { value: KERR_RENDER_CONSTANTS.diskGain },
    uSkyGain: { value: KERR_RENDER_CONSTANTS.skyGain }, uOrderTint: { value: 0 },
    uSkyTexture: { value: null }, uSkyVmax: { value: STARFIELD_VMAX },
    uMaxFootprint: { value: STARFIELD_MAX_FOOTPRINT_RAD },
    uHistoryWeight: { value: 1 },
    uHistoryDisk: { value: null }, uHistorySky: { value: null },
  };

  const accumulateMaterial = new ShaderMaterial({
    name: "kerr-accumulate", glslVersion: GLSL3, vertexShader: VERTEX, fragmentShader: KERR_ACCUMULATE_FRAGMENT,
    uniforms, depthTest: false, depthWrite: false, toneMapped: false,
  });
  const accumulateScene = new Scene();
  const accumulateQuad = new Mesh(new PlaneGeometry(2, 2), accumulateMaterial);
  accumulateQuad.frustumCulled = false;
  accumulateScene.add(accumulateQuad);
  const accumulateCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const displayUniforms = {
    ...shared,
    uDisk: { value: null }, uSky: { value: null },
    uTexel: { value: new Vector2(1 / 2, 1 / 2) }, uAspect: { value: 1 },
    uTime: { value: 0 }, uPlasma: { value: 1 },
    uFocus: { value: { x: 0.5, y: 0.5, z: 0.2, w: 0 } },
  };
  const displayMaterial = new ShaderMaterial({
    name: "kerr-display", glslVersion: GLSL3, vertexShader: VERTEX, fragmentShader: DISPLAY_FRAGMENT,
    uniforms: displayUniforms, depthTest: false, depthWrite: false, toneMapped: false,
  });
  const mesh = new Mesh(new PlaneGeometry(2, 2), displayMaterial);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  mesh.name = "kerr-observatory-display";

  function ensureTargets(renderer, width, height) {
    if (targets[0] && targets[0].width === width && targets[0].height === height) return;
    for (const target of targets) target?.dispose();
    // 32-bit targets keep the luminance-weighted hit position exact; half floats are the fallback.
    const type = renderer.extensions?.has?.("EXT_color_buffer_float") ? FloatType : HalfFloatType;
    const make = () => new WebGLRenderTarget(width, height, {
      count: 2, type, format: RGBAFormat, minFilter: NearestFilter, magFilter: NearestFilter,
      depthBuffer: false, stencilBuffer: false, generateMipmaps: false,
    });
    targets = [make(), make()];
    writeIndex = 0;
    size.set(width, height);
    uniforms.uResolution.value.set(width, height);
    displayUniforms.uTexel.value.set(1 / width, 1 / height);
  }

  mesh.onBeforeRender = (renderer) => {
    if (!targets[0]) {
      renderer.getDrawingBufferSize(size);
      ensureTargets(renderer, Math.max(2, Math.round(size.x)), Math.max(2, Math.round(size.y)));
    }
    if (!pending) return;
    pending = false;
    const history = targets[1 - writeIndex];
    const write = targets[writeIndex];
    uniforms.uHistoryDisk.value = history.textures[0];
    uniforms.uHistorySky.value = history.textures[1];
    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(write);
    renderer.render(accumulateScene, accumulateCamera);
    renderer.setRenderTarget(previous);
    displayUniforms.uDisk.value = write.textures[0];
    displayUniforms.uSky.value = write.textures[1];
    writeIndex = 1 - writeIndex;
  };

  /**
   * Per-frame synchronisation.
   * @param {{ renderer: object, camera: object, atlasState: object, detail3d: string,
   *           reducedMotion: boolean, governorRaySteps?: number, time?: number }} input
   *   time: wall-clock seconds driving the plasma texture (frozen under reduced motion)
   */
  function sync({ renderer, camera, atlasState, detail3d = "medium", reducedMotion = false, governorRaySteps = null, time = 0 }) {
    renderer.getDrawingBufferSize(size);
    const width = Math.max(2, Math.round(size.x));
    const height = Math.max(2, Math.round(size.y));
    ensureTargets(renderer, width, height);
    const normalized = normalizeKerrState(atlasState);
    const budget = kerrQualityBudget(normalized.quality, { detail3d, reducedMotion, governorRaySteps });
    const observer = kerrObserverFromCamera([camera.position.x, camera.position.y, camera.position.z]);
    const state = buildKerrRenderState(normalized, { observer, budget, backend: "webgl2" });
    const textures = tables.update(state);
    if (skyQuality !== budget.sky) {
      skyTex?.dispose();
      skyTex = makeSkyTexture(skyFor(budget.sky));
      skyQuality = budget.sky;
    }
    uniforms.uSkyTexture.value = skyTex;
    shared.uDiskLut.value = textures.disk;
    shared.uColorLut.value = textures.color;
    shared.uColorLogMin.value = state.colorTable.logMin;
    shared.uColorLogSpan.value = state.colorTable.logMax - state.colorTable.logMin;

    const key = kerrAccumulationKey({
      aStar: state.aStar, massLog10: state.massLog10, inclinationDeg: normalized.inclinationDeg,
      observer: state.observer, resolution: [width, height], backend: "webgl2",
      quality: budget.effective, diskModel: normalized.diskModel, budget,
    });
    const step = accumulator.update(key, budget.temporalSamples);
    const advance = step.reset || !wasConverged;
    wasConverged = step.converged;

    const { coef } = state.observer;
    const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);
    uniforms.uTanHalfFov.value = tanHalfFov;
    uniforms.uAspect.value = displayUniforms.uAspect.value = camera.aspect || 1;
    uniforms.uSpin.value = state.aStar;
    uniforms.uRPlus.value = state.radii.rPlus;
    shared.uRIn.value = state.disk.rIn;
    shared.uROut.value = state.disk.rOut;
    uniforms.uR0.value = state.observer.r0;
    uniforms.uU0.value = state.observer.u0;
    uniforms.uSinT0.value = Math.sin(state.observer.theta0);
    uniforms.uPhi0.value = state.observer.phi0;
    uniforms.uCoef.value = { x: coef.E0, y: coef.E1, z: coef.L0, w: coef.L1 };
    uniforms.uMom.value.set(coef.P1, coef.R1);
    uniforms.uStepK.value = budget.stepK;
    uniforms.uMaxSteps.value = Math.min(512, budget.maxSteps);
    uniforms.uSamples.value = Math.min(4, budget.samplesPerFrame);
    uniforms.uTransmit.value = state.transmittance;
    uniforms.uSoftEdge.value = state.softEdge ? 1 : 0;
    uniforms.uExposure.value = state.exposure;
    uniforms.uOrderTint.value = state.annotations ? 1 : 0;
    uniforms.uHistoryWeight.value = step.reset ? 1 : 1 / (step.frame + 1);
    for (let s = 0; s < 4; s += 1) {
      const [jx, jy] = kerrJitter(step.frame * uniforms.uSamples.value + s);
      uniforms.uJitter.value[s].set(jx, jy);
    }
    if (advance) pending = true;

    displayUniforms.uPlasma.value = state.plasma ? 1 : 0;
    displayUniforms.uTime.value = clock.tick(time, reducedMotion);

    latest = {
      backend: "webgl2", frames: step.frame + 1, resets: accumulator.resets,
      resolution: [width, height], budget, converged: step.converged, reducedMotion,
      plasmaTime: displayUniforms.uTime.value, animated: state.plasma && !reducedMotion,
    };
    return { state, budget, observer, step };
  }

  return {
    mesh,
    sync,
    setFocus({ x, y, radius, strength }) {
      displayUniforms.uFocus.value = { x: x * 0.5 + 0.5, y: y * 0.5 + 0.5, z: radius, w: strength };
    },
    clearFocus() { displayUniforms.uFocus.value = { x: 0.5, y: 0.5, z: 0.2, w: 0 }; },
    forceRender() { pending = true; },
    snapshot: () => ({ ...latest }),
    dispose() {
      for (const target of targets) target?.dispose();
      tables.dispose();
      skyTex?.dispose();
      accumulateQuad.geometry.dispose();
      accumulateMaterial.dispose();
      mesh.geometry.dispose();
      displayMaterial.dispose();
    },
  };
}

/** True when a native WebGPU adapter is obtainable and the user has not forced another backend. */
async function webGpuAvailable(preference) {
  if (preference === "webgl2" || preference === "static") return false;
  if (globalThis.__qgaKerrWebGpuFailed || !globalThis.navigator?.gpu) return false;
  try {
    const adapter = await Promise.race([
      navigator.gpu.requestAdapter(),
      new Promise((resolve) => { setTimeout(() => resolve(null), 2500); }),
    ]);
    return !!adapter;
  } catch {
    return false;
  }
}

/**
 * Backend selection and the single entry point used by the module.
 *
 *   WebGPU available (and not forced off) -> TSL compute integrator with storage-buffer accumulation
 *   otherwise                              -> WebGL2 fragment integrator with ping-pong accumulation
 *
 * Both integrate the same equations. If the WebGPU path fails at runtime the
 * scene asks to be rebuilt once on the WebGL2 path (`recoverable`).
 */
export async function createKerrRuntime({ backendPreference = "auto", seed = 42, diskModel = "page-thorne" } = {}) {
  // The turbulence display layer needs its disk-hit MRT. The compute backend
  // retains the smooth Page–Thorne models until it implements the same pass.
  if (diskModel !== "page-thorne-turbulent" && await webGpuAvailable(backendPreference)) {
    try {
      const { createKerrTslRuntime } = await import("./kerr-material.tsl.js");
      const runtime = createKerrTslRuntime({ seed });
      return Object.assign(runtime, {
        kind: "webgpu",
        recoverable() { globalThis.__qgaKerrWebGpuFailed = true; return true; },
      });
    } catch (error) {
      globalThis.__qgaKerrWebGpuFailed = true;
      console.warn("Kerr WebGPU compute path unavailable; using the WebGL2 integrator.", error);
    }
  }
  const runtime = createKerrGlslRuntime({ seed });
  return Object.assign(runtime, { kind: "webgl2", recoverable: () => false });
}
