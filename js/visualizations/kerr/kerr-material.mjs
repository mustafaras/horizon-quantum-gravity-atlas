/**
 * WebGL2 backend of the Kerr observatory: a fragment-shader geodesic
 * integrator with real temporal accumulation (Prompt 04).
 *
 *   accumulation pass  (offscreen, half-float ping-pong)
 *       per pixel: Halton-jittered rays -> Carter/Mino RK4 geodesic ->
 *       disk crossings (order-tagged) + lensed sky -> running mean with history
 *   display pass       (scene quad)
 *       reads the accumulated radiance, applies the focus defocus, and leaves
 *       tone mapping to the render pipeline (exactly one tone map + sRGB).
 *
 * Operation order per disk hit (identical to `shadeDiskHit` in
 * kerr-observatory.mjs, which the Node tests check against the science API):
 *   emitted T (table) -> g = 1/(u^t (E - Omega L_z)) -> T_obs = g T -> blackbody
 *   chromaticity (table) -> I = g^4 F/F_max -> exposure -> [pipeline: tone map].
 *
 * The integrator equations are the same ones the CPU reference tracer uses;
 * nothing here restates ISCO, horizon, spectral or g-factor *values* — they
 * arrive through the science-derived lookup tables and observer coefficients.
 */

import {
  ClampToEdgeWrapping, DataTexture, FloatType, HalfFloatType, LinearFilter,
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
import { STARFIELD_MAX_FOOTPRINT_RAD, STARFIELD_VMAX, renderStarfield } from "./starfield-sampler.mjs";

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/** Integrator + shading. Constants of the model come in as uniforms. */
export const KERR_ACCUMULATE_FRAGMENT = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;
varying vec2 vUv;

uniform vec2 uResolution;
uniform float uTanHalfFov, uAspect;
uniform float uSpin, uRPlus, uRIn, uROut;
uniform float uR0, uU0, uSinT0, uPhi0;
uniform vec4 uCoef;           // E0, E1, L0, L1
uniform vec2 uMom;            // P1 (p_theta per n_theta), R1 (p_r per n_r)
uniform float uStepK, uEscape, uMargin;
uniform int uMaxSteps, uSamples, uLutSize, uColorSize;
uniform vec2 uJitter[4];
uniform float uTransmit, uExposure, uDiskGain, uSkyGain, uOrderTint;
uniform float uColorLogMin, uColorLogSpan, uSkyVmax, uMaxFootprint, uHistoryWeight;
uniform sampler2D uDiskLut, uColorLut, uSky, uHistory;

const float PI = 3.14159265358979;

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

float accR(float r, float E, float Lz, float K, float a) {
  float P = E * (r * r + a * a) - a * Lz;
  return 2.0 * E * r * P - (r - 1.0) * K;
}
float accU(float u, float E, float Lz, float Q, float a2) {
  return -u * (Q + Lz * Lz - a2 * E * E) - 2.0 * a2 * E * E * u * u * u;
}
float dPhi(float r, float u, float E, float Lz, float a) {
  float P = E * (r * r + a * a) - a * Lz;
  float D = max(r * r - 2.0 * r + a * a, 1e-6);
  return -(a * E - Lz / max(1.0 - u * u, 1e-6)) + a * P / D;
}

vec3 skyColor(vec3 dir, float footprint) {
  vec2 uv = vec2(atan(dir.z, dir.x) / (2.0 * PI) + 0.5, acos(clamp(dir.y, -1.0, 1.0)) / PI);
  float fp = min(footprint, uMaxFootprint);
  // Isotropic texel footprint: content is stretched along u near the poles, so the mip level is set by v.
  vec3 enc = textureGrad(uSky, uv, vec2(fp / (2.0 * PI), 0.0), vec2(0.0, fp / PI)).rgb;
  return enc * enc * uSkyVmax * uSkyGain;
}

// out: rgb = disk radiance, transmit = leftover, dir = world direction (escape or last position)
void trace(vec2 ndc, out vec3 rgb, out float transmit, out vec3 dir, out float escaped) {
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
  float r = uR0;
  float vr = (uR0 * uR0 - 2.0 * uR0 + a2) * uMom.y * n.x;
  float vu = -uSinT0 * pth;
  float phi = uPhi0;
  rgb = vec3(0.0);
  transmit = 1.0;
  escaped = 0.0;
  float order = 0.0;
  bool done = false;

  for (int i = 0; i < 512; i++) {
    if (i >= uMaxSteps) break;
    float h = uStepK * min(1.0 / r, (r - uRPlus) / (abs(vr) + 1.0));
    float hh = 0.5 * h;
    float k1r = vr, k1v = accR(r, E, Lz, K, a), k1u = vu, k1w = accU(u, E, Lz, Q, a2), k1p = dPhi(r, u, E, Lz, a);
    float r2 = r + hh * k1r, v2 = vr + hh * k1v, u2 = u + hh * k1u, w2 = vu + hh * k1w;
    float k2r = v2, k2v = accR(r2, E, Lz, K, a), k2u = w2, k2w = accU(u2, E, Lz, Q, a2), k2p = dPhi(r2, u2, E, Lz, a);
    float r3 = r + hh * k2r, v3 = vr + hh * k2v, u3 = u + hh * k2u, w3 = vu + hh * k2w;
    float k3r = v3, k3v = accR(r3, E, Lz, K, a), k3u = w3, k3w = accU(u3, E, Lz, Q, a2), k3p = dPhi(r3, u3, E, Lz, a);
    float r4 = r + h * k3r, v4 = vr + h * k3v, u4 = u + h * k3u, w4 = vu + h * k3w;
    float k4r = v4, k4v = accR(r4, E, Lz, K, a), k4u = w4, k4w = accU(u4, E, Lz, Q, a2), k4p = dPhi(r4, u4, E, Lz, a);
    float s6 = h / 6.0;
    float rn = r + s6 * (k1r + 2.0 * k2r + 2.0 * k3r + k4r);
    float vn = vr + s6 * (k1v + 2.0 * k2v + 2.0 * k3v + k4v);
    float un = u + s6 * (k1u + 2.0 * k2u + 2.0 * k3u + k4u);
    float wn = vu + s6 * (k1w + 2.0 * k2w + 2.0 * k3w + k4w);
    float pn = phi + s6 * (k1p + 2.0 * k2p + 2.0 * k3p + k4p);

    // first-integral projection (|r'| = sqrt(R), |u'| = sqrt(Theta_u)), sign kept
    float P = E * (rn * rn + a2) - a * Lz;
    float R = P * P - (rn * rn - 2.0 * rn + a2) * K;
    float Th = Q - un * un * (Q + Lz * Lz - a2 * E * E) - a2 * E * E * un * un * un * un;
    vn = (vn >= 0.0 ? 1.0 : -1.0) * sqrt(max(R, 0.0));
    wn = (wn >= 0.0 ? 1.0 : -1.0) * sqrt(max(Th, 0.0));

    if (u * un < 0.0) {
      float f = u / (u - un);
      float rc = r + f * (rn - r);
      if (rc >= uRIn && rc <= uROut) {
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
          rgb += transmit * col;
        }
        transmit *= uTransmit;
        if (transmit <= 1e-4) { transmit = 0.0; done = true; }
      }
      order += 1.0;
    }
    r = rn; vr = vn; u = un; vu = wn; phi = pn;
    if (done) break;
    if (r < uRPlus + uMargin && vr < 0.0) { transmit = 0.0; break; }
    if (r > uEscape && vr > 0.0) { escaped = 1.0; break; }
  }

  // Direction of motion in world axes (spin along +y). The tangent is written without 1/sin(theta)
  // (it cancels between theta' and sin(theta) phi'), so it stays exact on the spin axis.
  float sinT = max(sqrt(max(1.0 - u * u, 0.0)), 1e-4);
  float sp = sin(phi), cp = cos(phi);
  float Pf = E * (r * r + a2) - a * Lz;
  float cDrift = a * Pf / max(r * r - 2.0 * r + a2, 1e-6) - a * E;
  float lPhi = Lz + (1.0 - u * u) * cDrift;
  vec3 tangent = vec3(-vu * u * cp - lPhi * sp, vu * sinT, -vu * u * sp + lPhi * cp);
  float tangentNorm = length(tangent);
  float angMom = sqrt(max(Q + Lz * Lz + a2 * E * E * u * u, 0.0));
  vec3 pos = vec3(sinT * cp, u, sinT * sp);
  vec3 v = vr * pos + (tangentNorm > 1e-12 ? r * angMom * tangent / tangentNorm : vec3(0.0));
  dir = escaped > 0.5 ? normalize(v) : pos;
}

void main() {
  vec3 acc = vec3(0.0);
  for (int s = 0; s < 4; s++) {
    if (s >= uSamples) break;
    vec2 uv = vUv + uJitter[s] / uResolution;
    vec3 rgb; float transmit; vec3 dir; float escaped;
    trace(uv * 2.0 - 1.0, rgb, transmit, dir, escaped);
    float fp = max(length(dFdx(dir)), length(dFdy(dir)));
    vec3 col = rgb;
    if (escaped > 0.5 && transmit > 0.0) col += transmit * skyColor(dir, fp);
    acc += col;
  }
  vec3 current = acc / float(uSamples);
  vec3 previous = texelFetch(uHistory, ivec2(gl_FragCoord.xy), 0).rgb;
  gl_FragColor = vec4(mix(previous, current, uHistoryWeight), 1.0);
}`;

const DISPLAY_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uAccum;
uniform vec2 uTexel;
uniform float uAspect;
uniform vec4 uFocus; // center uv.xy, radius, strength
void main() {
  vec3 c = texture2D(uAccum, vUv).rgb;
  float d = length((vUv - uFocus.xy) * vec2(uAspect, 1.0));
  float defocus = uFocus.w * smoothstep(uFocus.z, uFocus.z * 2.4, d);
  if (defocus > 0.001) {
    vec3 b = vec3(0.0);
    for (int j = -2; j <= 2; j++) {
      for (int i = -2; i <= 2; i++) {
        b += texture2D(uAccum, vUv + vec2(float(i), float(j)) * uTexel * (1.0 + 2.5 * defocus)).rgb;
      }
    }
    c = mix(c, b / 25.0, defocus);
  }
  gl_FragColor = vec4(c, 1.0);
}`;

const skyCache = new Map();
function skyFor(quality, seed) {
  const key = `${quality}|${seed}`;
  if (!skyCache.has(key)) {
    if (skyCache.size >= 2) skyCache.delete(skyCache.keys().next().value);
    skyCache.set(key, renderStarfield({ seed, quality }));
  }
  return skyCache.get(key);
}

function floatTexture(data, size) {
  const texture = new DataTexture(data, size, 1, RGBAFormat, FloatType);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function skyTexture(sky) {
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

/**
 * Create the WebGL2 runtime. Add `runtime.mesh` to the scene; call
 * `runtime.sync(...)` once per frame before rendering.
 */
export function createKerrGlslRuntime({ seed = 42 } = {}) {
  const accumulator = new KerrTemporalAccumulator(1);
  const size = new Vector2(2, 2);
  let targets = [null, null];
  let writeIndex = 0;
  let pending = true;
  let wasConverged = false;
  let diskTable = null;
  let skyQuality = null;
  let skyTex = null;
  let latest = { backend: "webgl2", frames: 0, resets: 0, resolution: [0, 0], budget: null };

  const uniforms = {
    uResolution: { value: new Vector2(2, 2) },
    uTanHalfFov: { value: 0.4 }, uAspect: { value: 1 },
    uSpin: { value: 0 }, uRPlus: { value: 2 }, uRIn: { value: 6 }, uROut: { value: KERR_RENDER_CONSTANTS.diskOuter },
    uR0: { value: 40 }, uU0: { value: 0.25 }, uSinT0: { value: 0.97 }, uPhi0: { value: 0 },
    uCoef: { value: [0, 0, 0, 0] }, uMom: { value: new Vector2() },
    uStepK: { value: 0.16 }, uEscape: { value: KERR_RENDER_CONSTANTS.escapeRadius },
    uMargin: { value: KERR_RENDER_CONSTANTS.captureMargin },
    uMaxSteps: { value: 224 }, uSamples: { value: 1 },
    uLutSize: { value: KERR_RENDER_CONSTANTS.diskLutSize }, uColorSize: { value: KERR_RENDER_CONSTANTS.colorLutSize },
    uJitter: { value: [new Vector2(), new Vector2(), new Vector2(), new Vector2()] },
    uTransmit: { value: 0.35 }, uExposure: { value: 1 }, uDiskGain: { value: KERR_RENDER_CONSTANTS.diskGain },
    uSkyGain: { value: KERR_RENDER_CONSTANTS.skyGain }, uOrderTint: { value: 1 },
    uColorLogMin: { value: 0 }, uColorLogSpan: { value: 1 },
    uSkyVmax: { value: STARFIELD_VMAX }, uMaxFootprint: { value: STARFIELD_MAX_FOOTPRINT_RAD },
    uHistoryWeight: { value: 1 },
    uDiskLut: { value: null }, uColorLut: { value: null }, uSky: { value: null }, uHistory: { value: null },
  };
  uniforms.uCoef.value = { x: 0, y: 0, z: 0, w: 0 };

  const accumulateMaterial = new ShaderMaterial({
    name: "kerr-accumulate", vertexShader: VERTEX, fragmentShader: KERR_ACCUMULATE_FRAGMENT,
    uniforms, depthTest: false, depthWrite: false, toneMapped: false,
  });
  const accumulateScene = new Scene();
  const accumulateQuad = new Mesh(new PlaneGeometry(2, 2), accumulateMaterial);
  accumulateQuad.frustumCulled = false;
  accumulateScene.add(accumulateQuad);
  const accumulateCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const displayUniforms = {
    uAccum: { value: null }, uTexel: { value: new Vector2(1 / 2, 1 / 2) }, uAspect: { value: 1 },
    uFocus: { value: { x: 0.5, y: 0.5, z: 0.2, w: 0 } },
  };
  const displayMaterial = new ShaderMaterial({
    name: "kerr-display", vertexShader: VERTEX, fragmentShader: DISPLAY_FRAGMENT,
    uniforms: displayUniforms, depthTest: false, depthWrite: false, toneMapped: false,
  });
  const mesh = new Mesh(new PlaneGeometry(2, 2), displayMaterial);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  mesh.name = "kerr-observatory-display";

  function ensureTargets(width, height) {
    if (targets[0] && targets[0].width === width && targets[0].height === height) return;
    for (const target of targets) target?.dispose();
    const make = () => new WebGLRenderTarget(width, height, {
      type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter,
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
      ensureTargets(Math.max(2, Math.round(size.x)), Math.max(2, Math.round(size.y)));
    }
    if (!pending) return;
    pending = false;
    const history = targets[1 - writeIndex];
    const write = targets[writeIndex];
    uniforms.uHistory.value = history.texture;
    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(write);
    renderer.render(accumulateScene, accumulateCamera);
    renderer.setRenderTarget(previous);
    displayUniforms.uAccum.value = write.texture;
    writeIndex = 1 - writeIndex;
  };

  /**
   * Per-frame synchronisation.
   * @param {{ renderer: object, camera: object, atlasState: object, detail3d: string,
   *           reducedMotion: boolean, governorRaySteps?: number }} input
   */
  function sync({ renderer, camera, atlasState, detail3d = "medium", reducedMotion = false, governorRaySteps = null }) {
    renderer.getDrawingBufferSize(size);
    const width = Math.max(2, Math.round(size.x));
    const height = Math.max(2, Math.round(size.y));
    ensureTargets(width, height);
    const normalized = normalizeKerrState(atlasState);
    const budget = kerrQualityBudget(normalized.quality, { detail3d, reducedMotion, governorRaySteps });
    const observer = kerrObserverFromCamera([camera.position.x, camera.position.y, camera.position.z]);
    const state = buildKerrRenderState(normalized, { observer, budget, backend: "webgl2" });

    if (skyQuality !== budget.sky) {
      skyQuality = budget.sky;
      skyTex?.dispose();
      skyTex = skyTexture(skyFor(budget.sky, seed));
      uniforms.uSky.value = skyTex;
    }
    if (diskTable !== state.disk) {
      diskTable = state.disk;
      uniforms.uDiskLut.value?.dispose();
      uniforms.uDiskLut.value = floatTexture(state.disk.data, state.disk.size);
    }
    if (!uniforms.uColorLut.value) {
      uniforms.uColorLut.value = floatTexture(state.colorTable.data, state.colorTable.size);
      uniforms.uColorLogMin.value = state.colorTable.logMin;
      uniforms.uColorLogSpan.value = state.colorTable.logMax - state.colorTable.logMin;
    }

    const key = kerrAccumulationKey({
      aStar: state.aStar, massLog10: state.massLog10, inclinationDeg: normalized.inclinationDeg,
      observer: state.observer, resolution: [width, height], backend: "webgl2",
      quality: budget.effective, diskModel: normalized.diskModel, budget,
    });
    const step = accumulator.update(key, budget.temporalSamples);
    const advance = step.reset || !wasConverged;
    wasConverged = step.converged;

    const { coef } = state.observer;
    uniforms.uTanHalfFov.value = Math.tan((camera.fov * Math.PI) / 360);
    uniforms.uAspect.value = displayUniforms.uAspect.value = camera.aspect || 1;
    uniforms.uSpin.value = state.aStar;
    uniforms.uRPlus.value = state.radii.rPlus;
    uniforms.uRIn.value = state.disk.rIn;
    uniforms.uROut.value = state.disk.rOut;
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
    uniforms.uExposure.value = state.exposure;
    uniforms.uOrderTint.value = state.annotations ? 1 : 0;
    uniforms.uHistoryWeight.value = step.reset ? 1 : 1 / (step.frame + 1);
    for (let s = 0; s < 4; s += 1) {
      const [jx, jy] = kerrJitter(step.frame * uniforms.uSamples.value + s);
      uniforms.uJitter.value[s].set(jx, jy);
    }
    if (advance) pending = true;

    latest = {
      backend: "webgl2", frames: step.frame + 1, resets: accumulator.resets,
      resolution: [width, height], budget, converged: step.converged, reducedMotion,
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
      skyTex?.dispose();
      uniforms.uDiskLut.value?.dispose();
      uniforms.uColorLut.value?.dispose();
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
export async function createKerrRuntime({ backendPreference = "auto", seed = 42 } = {}) {
  if (await webGpuAvailable(backendPreference)) {
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
