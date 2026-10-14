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
  KERR_VIEW_ID,
  KerrTemporalAccumulator,
  buildKerrRenderState,
  kerrAccumulationKey,
  kerrJitter,
  kerrObserverFromCamera,
  kerrQualityBudget,
  normalizeKerrState,
  registerKerrObservatoryProvenance,
} from "./kerr-observatory.mjs";
import { KERR_PLASMA_GLSL } from "./kerr-plasma.mjs";
import { PLASMA_VOLUME_GLSL, PLASMA_VOLUME } from "./plasma-volume.mjs";
import { JET_FIELD_GLSL, JET_KNOTS_GLSL, JET_FIELD } from "./jet-field.mjs";
import { STARFIELD_MAX_FOOTPRINT_RAD, STARFIELD_VMAX, renderStarfield } from "./starfield-texture.mjs";
import { createKerrTables, kerrPlasmaClock, kerrSeed } from "./kerr-runtime-shared.mjs";
import {
  buildCaptureMetadata,
  encodePng,
  flipRgbaVertically,
  resolveCaptureDimensions,
  runProgressiveCapture,
  upscaleRgba,
  validateCaptureRequest,
} from "../../render/progressive-capture.mjs";

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
layout(location = 2) out vec4 oJet;
layout(location = 3) out vec4 oJetPos;

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
uniform float uCorona, uJets, uCoronaRIn, uCoronaROut;
uniform uint uSeed;
uniform sampler2D uHistoryDisk, uHistorySky, uHistoryJet, uHistoryJetPos, uSkyTexture;
${TABLES_GLSL}
${KERR_PLASMA_GLSL}
${PLASMA_VOLUME_GLSL}
${JET_FIELD_GLSL}
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

// Jet radiance (chroma included) at a BL-Cartesian sample: the chunk's
// jetEmission provides the beamed emissivity and the emission-weighted mean
// frequency shift; this wrapper applies the chroma table.
vec3 jetRadiance(vec3 pos, vec3 rayDir, float r, float u, float a, float sMin) {
  float meanShift;
  float kelvin;
  float emissivity = jetEmission(pos, rayDir, r, u, a, sMin, meanShift, kelvin);
  if (emissivity <= 0.0) return vec3(0.0);
  return chroma(meanShift * kelvin) * emissivity;
}

// Volumetric emission/absorption over one (sub)segment of the geodesic,
// composited front-to-back with the current transmittance. The corona adds
// into the sky/static target; the jet adds into the jet target together with
// the luminance-weighted mean jet position (s, rho, cos phi, sin phi) that
// the display pass re-evaluates per frame with the knot modulation.
void volumeSegment(RayState s, RayState next, float f, float h, float E, float Lz, float Q, float a,
                   inout float transmit, inout vec3 corona, inout vec3 jet, inout vec4 jetPos) {
  if (h <= 0.0 || transmit <= 0.0) return;
  RayState mid;
  mid.r = mix(s.r, next.r, f);
  mid.vr = mix(s.vr, next.vr, f);
  mid.m = normalize(mix(s.m, next.m, f));
  mid.w = mix(s.w, next.w, f);
  mid.drag = mix(s.drag, next.drag, f);
  // ZAMO spatial path length: dl/dlambda = sqrt((Sigma/Delta) vr^2 + Sigma |w + dragRate z x m|^2)
  // (azimuthal coefficient approximated by Sigma; exact for a = 0 and the polar part).
  float a2 = a * a;
  float Sigma = mid.r * mid.r + a2 * mid.m.z * mid.m.z;
  float Delta = max(mid.r * mid.r - 2.0 * mid.r + a2, 1e-6);
  float dragRate = rayDerivative(mid, E, Lz, Q, a).drag;
  vec3 angRate = mid.w + dragRate * vec3(-mid.m.y, mid.m.x, 0.0);
  float dl = h * sqrt(max((Sigma / Delta) * mid.vr * mid.vr + Sigma * dot(angRate, angRate), 0.0));
  if (dl <= 0.0) return;
  vec3 n = rotateAxis(mid.m, mid.drag);
  vec3 pos = mid.r * n;
  vec3 velocity = mid.vr * n + mid.r * rotateAxis(angRate, mid.drag);
  float vNorm = length(velocity);
  if (vNorm < 1e-12) return;
  vec3 rayDir = velocity / vNorm;

  if (uCorona > 0.5 && mid.r >= uCoronaRIn && mid.r <= uCoronaROut) {
    float density = coronaDensity(pos, mid.r, uCoronaRIn, uCoronaROut, uSeed);
    if (density > 0.0) {
      vec4 row = diskRow(clamp(mid.r, uRIn, uROut));
      float den = row.y * (E - row.x * Lz);
      if (den > 1e-4) {
        float g = 1.0 / den;
        float intensity = coronaEmissionScale(density, g) * uExposure * dl;
        corona += transmit * chroma(g * coronaKelvin(row.w)) * intensity;
      }
      transmit *= exp(-coronaAbsorption(density) * dl);
    }
  }

  if (uJets > 0.5) {
    vec3 radiance = jetRadiance(pos, rayDir, mid.r, mid.m.z, uSpin, uRPlus) * uExposure * dl;
    float luma = dot(radiance, LUMA);
    if (luma > 0.0) {
      jet += transmit * radiance;
      float phi = atan(pos.y, pos.x);
      jetPos += transmit * luma * vec4(abs(pos.z), length(pos.xy), cos(phi), sin(phi));
    }
  }
}

// out: rgb = disk radiance, hit = luminance-weighted disk-plane (x, y) of the emitting crossings,
//      transmit = leftover, dir = world direction (escape or last position),
//      corona = static volumetric corona radiance, jet/jetPos = jet base radiance and
//      its luminance-weighted mean (s, rho, cos phi, sin phi) for the knot modulation
void trace(vec2 ndc, out vec3 rgb, out vec2 hit, out float transmit, out vec3 dir, out float escaped,
           out vec3 corona, out vec3 jet, out vec4 jetPos) {
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
  corona = vec3(0.0);
  jet = vec3(0.0);
  jetPos = vec4(0.0);
  float order = 0.0;
  bool done = false;
  bool volume = (uCorona + uJets) > 0.5;

  for (int i = 0; i < 512; i++) {
    if (i >= uMaxSteps) break;
    float h = uStepK * min(1.0 / s.r, (s.r - uRPlus) / (abs(s.vr) + 1.0));
    RayState next = rayStep(s, h, E, Lz, Q, a);
    // Disk crossing fraction within this segment (1 when there is none); the
    // volumetric segment is split there so the volume and the disk composite
    // in depth order.
    float fCross = 1.0;
    bool crossing = s.m.z * next.m.z < 0.0;
    if (crossing) fCross = s.m.z / (s.m.z - next.m.z);
    if (volume) volumeSegment(s, next, 0.5 * fCross, h * fCross, E, Lz, Q, a, transmit, corona, jet, jetPos);
    if (crossing) {
      float f = fCross;
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
    if (volume && fCross < 1.0 && !done) {
      volumeSegment(s, next, fCross + 0.5 * (1.0 - fCross), h * (1.0 - fCross), E, Lz, Q, a, transmit, corona, jet, jetPos);
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
  vec3 jetSum = vec3(0.0);
  float jetLuma = 0.0;
  vec4 jetPosSum = vec4(0.0);
  for (int s = 0; s < 4; s++) {
    if (s >= uSamples) break;
    vec2 uv = vUv + uJitter[s] / uResolution;
    vec3 rgb; vec2 hit; float transmit; vec3 dir; float escaped;
    vec3 corona; vec3 jet; vec4 jetPos;
    trace(uv * 2.0 - 1.0, rgb, hit, transmit, dir, escaped, corona, jet, jetPos);
    float fp = max(length(dFdx(dir)), length(dFdy(dir)));
    disk += rgb;
    hits += hit;
    sky += corona;
    if (escaped > 0.5 && transmit > 0.0) {
      sky += transmit * skyColor(dir, fp);
    }
    // The jet target keeps the base radiance and the luminance-weighted mean
    // position; the knot modulation is a per-frame display factor.
    jetSum += jet;
    jetLuma += dot(jet, LUMA);
    jetPosSum += jetPos;
  }
  float inv = 1.0 / float(uSamples);
  ivec2 texel = ivec2(gl_FragCoord.xy);
  oDisk = mix(texelFetch(uHistoryDisk, texel, 0), vec4(disk, hits.x) * inv, uHistoryWeight);
  oSky = mix(texelFetch(uHistorySky, texel, 0), vec4(sky, hits.y) * inv, uHistoryWeight);
  oJet = mix(texelFetch(uHistoryJet, texel, 0), vec4(jetSum, jetLuma) * inv, uHistoryWeight);
  oJetPos = mix(texelFetch(uHistoryJetPos, texel, 0), jetPosSum * inv, uHistoryWeight);
}`;

/** Edge-aware (bilateral) denoise for the capture path: a gentle 3x3 kernel
 *  on the linear radiance before tone mapping. Deterministic (no randomness). */
const CAPTURE_DENOISE_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
layout(location = 0) out vec4 oColor;
uniform sampler2D tDiffuse;
uniform vec2 uTexel;
uniform float uSigma;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
void main() {
  vec3 center = texture(tDiffuse, vUv).rgb;
  float centerLuma = dot(center, LUMA);
  vec3 sum = center;
  float weightSum = 1.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      if (i == 0 && j == 0) continue;
      vec3 neighbour = texture(tDiffuse, vUv + vec2(float(i), float(j)) * uTexel).rgb;
      float dl = dot(neighbour, LUMA) - centerLuma;
      float w = exp(-dl * dl / (2.0 * uSigma * uSigma));
      sum += neighbour * w;
      weightSum += w;
    }
  }
  oColor = vec4(sum / weightSum, 1.0);
}`;

const DISPLAY_FRAGMENT = /* glsl */ `precision highp float;
precision highp int;
precision highp sampler2D;
varying vec2 vUv;
layout(location = 0) out vec4 oColor;
uniform sampler2D uDisk, uSky, uJet, uJetPos;
uniform vec2 uTexel;
uniform float uAspect, uTime, uPlasma, uJets;
uniform uint uSeed;
uniform vec4 uFocus; // center uv.xy, radius, strength
${TABLES_GLSL}
${KERR_PLASMA_GLSL}
${JET_KNOTS_GLSL}

vec3 radiance(vec2 uv, float m, float mj) {
  return texture(uDisk, uv).rgb * m + texture(uSky, uv).rgb + texture(uJet, uv).rgb * mj;
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
  // Jet knot modulation at the luminance-weighted mean jet position; the
  // pattern advects along the jet with the same display clock as the disk.
  float mj = 1.0;
  vec4 j = texture(uJet, vUv);
  if (uJets > 0.5 && j.a > 1e-9) {
    vec4 jp = texture(uJetPos, vUv);
    float jLuma = max(j.a, 1e-12);
    float js = jp.x / jLuma;
    float jrho = jp.y / jLuma;
    float jphi = atan(jp.w, jp.z);
    mj = jetKnots(js, jrho, jphi, uTime, uSeed);
  }
  vec3 c = d.rgb * m + s.rgb + j.rgb * mj;
  float dist = length((vUv - uFocus.xy) * vec2(uAspect, 1.0));
  float defocus = uFocus.w * smoothstep(uFocus.z, uFocus.z * 2.4, dist);
  if (defocus > 0.001) {
    vec3 b = vec3(0.0);
    for (int jy = -2; jy <= 2; jy++) {
      for (int jx = -2; jx <= 2; jx++) {
        b += radiance(vUv + vec2(float(jx), float(jy)) * uTexel * (1.0 + 2.5 * defocus), m, mj);
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
  let captureContext = null;
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
    uCorona: { value: 0 }, uJets: { value: 0 },
    uCoronaRIn: { value: 5 }, uCoronaROut: { value: 29 },
    uHistoryDisk: { value: null }, uHistorySky: { value: null },
    uHistoryJet: { value: null }, uHistoryJetPos: { value: null },
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
    uJet: { value: null }, uJetPos: { value: null },
    uTexel: { value: new Vector2(1 / 2, 1 / 2) }, uAspect: { value: 1 },
    uTime: { value: 0 }, uPlasma: { value: 1 }, uJets: { value: 0 },
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
    // 32-bit targets keep the luminance-weighted hit positions exact; half floats are the fallback.
    const type = renderer.extensions?.has?.("EXT_color_buffer_float") ? FloatType : HalfFloatType;
    const make = () => new WebGLRenderTarget(width, height, {
      count: 4, type, format: RGBAFormat, minFilter: NearestFilter, magFilter: NearestFilter,
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
    uniforms.uHistoryJet.value = history.textures[2];
    uniforms.uHistoryJetPos.value = history.textures[3];
    const previous = renderer.getRenderTarget();
    renderer.setRenderTarget(write);
    renderer.render(accumulateScene, accumulateCamera);
    renderer.setRenderTarget(previous);
    displayUniforms.uDisk.value = write.textures[0];
    displayUniforms.uSky.value = write.textures[1];
    displayUniforms.uJet.value = write.textures[2];
    displayUniforms.uJetPos.value = write.textures[3];
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
    captureContext = {
      renderer, normalized, observer, state,
      lens: { tanHalfFov: Math.tan((camera.fov * Math.PI) / 360), aspect: camera.aspect || 1 },
      reducedMotion, plasmaTime: displayUniforms.uTime.value,
      focus: { ...displayUniforms.uFocus.value },
    };
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
      corona: state.corona, jets: state.jets,
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
    uniforms.uCorona.value = state.corona ? 1 : 0;
    uniforms.uJets.value = state.jets ? 1 : 0;
    uniforms.uCoronaRIn.value = state.coronaRadii.rIn;
    uniforms.uCoronaROut.value = state.coronaRadii.rOut;
    uniforms.uHistoryWeight.value = step.reset ? 1 : 1 / (step.frame + 1);
    for (let s = 0; s < 4; s += 1) {
      const [jx, jy] = kerrJitter(step.frame * uniforms.uSamples.value + s);
      uniforms.uJitter.value[s].set(jx, jy);
    }
    if (advance) pending = true;

    displayUniforms.uPlasma.value = state.plasma ? 1 : 0;
    displayUniforms.uJets.value = state.jets ? 1 : 0;
    displayUniforms.uTime.value = clock.tick(time, reducedMotion);

    latest = {
      backend: "webgl2", frames: step.frame + 1, resets: accumulator.resets,
      resolution: [width, height], budget, converged: step.converged, reducedMotion,
      plasmaTime: displayUniforms.uTime.value, animated: state.plasma && !reducedMotion,
      volume: { corona: state.corona, jets: state.jets, capable: budget.volume === true },
    };
    return { state, budget, observer, step };
  }

  /**
   * Progressive ultra-quality still capture (Prompt 05). Renders the current
   * observatory view offscreen at 2K/4K/8K (or explicit dimensions) with the
   * ultra ray budget, accumulates Halton-jittered samples in chunks, applies
   * the display pass at a frozen plasma time, an optional edge-aware denoise,
   * the pipeline's exact tone mapping, an optional Lanczos-3 upscale, and
   * encodes a PNG with the metadata sidecar. All capture-side targets and
   * materials are disposed on completion, cancellation and error.
   *
   * @param {object} request
   *   preset: "2k" | "4k" | "8k" (height-driven; width follows the live aspect)
   *   width/height: explicit dimensions (overrides the preset)
   *   samples: total jittered samples (default 96)
   *   samplesPerChunk: samples per animation frame (default 4)
   *   denoise: edge-aware denoise pass (default true)
   *   upscale: integer upscale factor 1-4 (renders smaller, upscales)
   *   signal: { aborted } or AbortSignal to cancel
   *   onProgress({ stage, fraction }): progress sink
   *   commitHash: recorded in the metadata sidecar
   * @returns {Promise<{ png: Uint8Array, metadata: object, width: number, height: number }>}
   */
  async function captureStill(request = {}) {
    const {
      preset = "2k", width = null, height = null, samples = 96, samplesPerChunk = 4,
      denoise = true, upscale = 1, quality = "ultra", signal = null, onProgress = null, commitHash = null,
    } = request;
    if (!captureContext) throw new Error("The observatory must render at least one frame before capture.");
    const { renderer, normalized, observer, lens, reducedMotion, plasmaTime, focus } = captureContext;
    const factor = Math.max(1, Math.min(4, Math.round(Number(upscale) || 1)));
    const resolved = resolveCaptureDimensions({ preset, aspect: lens.aspect, width, height });
    const renderWidth = Math.max(2, Math.round(resolved.width / factor));
    const renderHeight = Math.max(2, Math.round(resolved.height / factor));
    const floatBytes = renderer.extensions?.has?.("EXT_color_buffer_float") ? 16 : 8;
    const maxDimension = renderer.capabilities?.maxTextureSize ?? 8192;
    validateCaptureRequest({ width: renderWidth, height: renderHeight, maxDimension, floatBytesPerPixel: floatBytes });

    // Capture render state. A still is offline, so it defaults to the ultra ray
    // budget regardless of the live quality (the equations and labels never
    // change); `quality` lowers it when the caller wants a cheaper still.
    const budget = kerrQualityBudget(quality, { detail3d: "ultra" });
    const state = buildKerrRenderState(normalized, { observer, budget, backend: "webgl2" });
    const textures = tables.update(state);
    const sky = skyFor(budget.sky);
    const skyTextureCapture = makeSkyTexture(sky);
    const provenance = registerKerrObservatoryProvenance();

    const type = floatBytes === 16 ? FloatType : HalfFloatType;
    const makeTarget = (count, targetType) => new WebGLRenderTarget(renderWidth, renderHeight, {
      count, type: targetType, format: RGBAFormat, minFilter: NearestFilter, magFilter: NearestFilter,
      depthBuffer: false, stencilBuffer: false, generateMipmaps: false,
    });
    const captureTargets = [makeTarget(4, type), makeTarget(4, type)];
    const displayTarget = makeTarget(1, type);
    const denoiseTarget = denoise ? makeTarget(1, type) : null;
    const outputTarget = new WebGLRenderTarget(renderWidth, renderHeight, {
      type: UnsignedByteType, format: RGBAFormat, minFilter: NearestFilter, magFilter: NearestFilter,
      depthBuffer: false, stencilBuffer: false, generateMipmaps: false,
    });

    const captureShared = {
      uRIn: { value: state.disk.rIn }, uROut: { value: state.disk.rOut },
      uColorLogMin: { value: state.colorTable.logMin },
      uColorLogSpan: { value: state.colorTable.logMax - state.colorTable.logMin },
      uLutSize: { value: KERR_RENDER_CONSTANTS.diskLutSize }, uColorSize: { value: KERR_RENDER_CONSTANTS.colorLutSize },
      uDiskLut: { value: textures.disk }, uColorLut: { value: textures.color },
      uSeed: { value: kerrSeed(seed) },
    };
    const { coef } = state.observer;
    const captureUniforms = {
      ...captureShared,
      uResolution: { value: new Vector2(renderWidth, renderHeight) },
      uTanHalfFov: { value: lens.tanHalfFov }, uAspect: { value: lens.aspect },
      uSpin: { value: state.aStar }, uRPlus: { value: state.radii.rPlus },
      // The capture must read the *derived* observer (state.observer), which is the
      // single source of truth the live path uses: kerrObserverFromCamera returns
      // only { r0, theta0, phi0 }, so reading u0 off it would upload undefined and
      // collapse the ray into the equatorial plane (a fully black still).
      uR0: { value: state.observer.r0 }, uU0: { value: state.observer.u0 },
      uSinT0: { value: Math.sin(state.observer.theta0) }, uPhi0: { value: state.observer.phi0 },
      uCoef: { value: { x: coef.E0, y: coef.E1, z: coef.L0, w: coef.L1 } },
      uMom: { value: new Vector2(coef.P1, coef.R1) },
      uStepK: { value: budget.stepK }, uEscape: { value: KERR_RENDER_CONSTANTS.escapeRadius },
      uMargin: { value: KERR_RENDER_CONSTANTS.captureMargin },
      uMaxSteps: { value: Math.min(512, budget.maxSteps) }, uSamples: { value: 1 },
      uJitter: { value: [new Vector2(), new Vector2(), new Vector2(), new Vector2()] },
      uTransmit: { value: state.transmittance }, uSoftEdge: { value: state.softEdge ? 1 : 0 },
      uExposure: { value: state.exposure },
      uDiskGain: { value: KERR_RENDER_CONSTANTS.diskGain },
      uSkyGain: { value: KERR_RENDER_CONSTANTS.skyGain }, uOrderTint: { value: 0 },
      uSkyTexture: { value: skyTextureCapture }, uSkyVmax: { value: STARFIELD_VMAX },
      uMaxFootprint: { value: STARFIELD_MAX_FOOTPRINT_RAD },
      uHistoryWeight: { value: 1 },
      uCorona: { value: state.corona ? 1 : 0 }, uJets: { value: state.jets ? 1 : 0 },
      uCoronaRIn: { value: state.coronaRadii.rIn }, uCoronaROut: { value: state.coronaRadii.rOut },
      uHistoryDisk: { value: null }, uHistorySky: { value: null },
      uHistoryJet: { value: null }, uHistoryJetPos: { value: null },
    };
    // A uniform whose value is `undefined` uploads as garbage and silently
    // produces a black still (the observer's u0 was read off the wrong object
    // once). `null` is a legitimate "not bound yet" placeholder; `undefined`
    // never is, so fail loudly instead of shipping a blank image.
    for (const [name, uniform] of Object.entries(captureUniforms)) {
      if (uniform.value === undefined) throw new Error(`capture uniform ${name} is undefined`);
    }
    const captureDisplayUniforms = {
      ...captureShared,
      uDisk: { value: null }, uSky: { value: null }, uJet: { value: null }, uJetPos: { value: null },
      uTexel: { value: new Vector2(1 / renderWidth, 1 / renderHeight) }, uAspect: { value: lens.aspect },
      uTime: { value: plasmaTime }, uPlasma: { value: state.plasma ? 1 : 0 }, uJets: { value: state.jets ? 1 : 0 },
      uFocus: { value: { ...focus } },
    };
    const captureAccumulateMaterial = new ShaderMaterial({
      name: "kerr-capture-accumulate", glslVersion: GLSL3, vertexShader: VERTEX,
      fragmentShader: KERR_ACCUMULATE_FRAGMENT,
      uniforms: captureUniforms, depthTest: false, depthWrite: false, toneMapped: false,
    });
    const captureDisplayMaterial = new ShaderMaterial({
      name: "kerr-capture-display", glslVersion: GLSL3, vertexShader: VERTEX,
      fragmentShader: DISPLAY_FRAGMENT,
      uniforms: captureDisplayUniforms, depthTest: false, depthWrite: false, toneMapped: false,
    });
    const denoiseMaterial = new ShaderMaterial({
      name: "kerr-capture-denoise", glslVersion: GLSL3, vertexShader: VERTEX,
      fragmentShader: CAPTURE_DENOISE_FRAGMENT,
      uniforms: {
        tDiffuse: { value: null }, uTexel: { value: new Vector2(1 / renderWidth, 1 / renderHeight) },
        uSigma: { value: 0.08 },
      },
      depthTest: false, depthWrite: false, toneMapped: false,
    });
    const captureScene = new Scene();
    const captureCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const accumulateQuadCapture = new Mesh(new PlaneGeometry(2, 2), captureAccumulateMaterial);
    const displayQuadCapture = new Mesh(new PlaneGeometry(2, 2), captureDisplayMaterial);
    const denoiseQuad = new Mesh(new PlaneGeometry(2, 2), denoiseMaterial);
    for (const quad of [accumulateQuadCapture, displayQuadCapture, denoiseQuad]) {
      quad.frustumCulled = false;
      captureScene.add(quad);
      quad.visible = false;
    }

    let captureWriteIndex = 0;
    const release = () => {
      for (const target of captureTargets) target.dispose();
      displayTarget.dispose();
      denoiseTarget?.dispose();
      outputTarget.dispose();
      skyTextureCapture.dispose();
      accumulateQuadCapture.geometry.dispose();
      displayQuadCapture.geometry.dispose();
      denoiseQuad.geometry.dispose();
      captureAccumulateMaterial.dispose();
      captureDisplayMaterial.dispose();
      denoiseMaterial.dispose();
    };

    try {
      const result = await runProgressiveCapture({
        width: renderWidth, height: renderHeight, samples, samplesPerChunk, signal, onProgress,
        prepare() {},
        drawSample(sampleIndex) {
          const history = captureTargets[1 - captureWriteIndex];
          const write = captureTargets[captureWriteIndex];
          const [jx, jy] = kerrJitter(sampleIndex);
          captureUniforms.uJitter.value[0].set(jx, jy);
          captureUniforms.uHistoryWeight.value = 1 / (sampleIndex + 1);
          captureUniforms.uHistoryDisk.value = history.textures[0];
          captureUniforms.uHistorySky.value = history.textures[1];
          captureUniforms.uHistoryJet.value = history.textures[2];
          captureUniforms.uHistoryJetPos.value = history.textures[3];
          const previous = renderer.getRenderTarget();
          accumulateQuadCapture.visible = true;
          renderer.setRenderTarget(write);
          renderer.render(captureScene, captureCamera);
          accumulateQuadCapture.visible = false;
          renderer.setRenderTarget(previous);
          captureWriteIndex = 1 - captureWriteIndex;
        },
        async compose() {
          const accumulated = captureTargets[1 - captureWriteIndex];
          captureDisplayUniforms.uDisk.value = accumulated.textures[0];
          captureDisplayUniforms.uSky.value = accumulated.textures[1];
          captureDisplayUniforms.uJet.value = accumulated.textures[2];
          captureDisplayUniforms.uJetPos.value = accumulated.textures[3];
          const previous = renderer.getRenderTarget();
          displayQuadCapture.visible = true;
          renderer.setRenderTarget(displayTarget);
          renderer.render(captureScene, captureCamera);
          displayQuadCapture.visible = false;
          let source = displayTarget;
          if (denoiseTarget) {
            denoiseMaterial.uniforms.tDiffuse.value = displayTarget.texture;
            denoiseQuad.visible = true;
            renderer.setRenderTarget(denoiseTarget);
            renderer.render(captureScene, captureCamera);
            denoiseQuad.visible = false;
            source = denoiseTarget;
          }
          const { OutputPass } = await import("three/addons/postprocessing/OutputPass.js");
          const outputPass = new OutputPass();
          try {
            outputPass.render(renderer, outputTarget, source);
          } finally {
            outputPass.dispose();
          }
          const rgba = new Uint8Array(renderWidth * renderHeight * 4);
          renderer.readRenderTargetPixels(outputTarget, 0, 0, renderWidth, renderHeight, rgba);
          renderer.setRenderTarget(previous);
          // readRenderTargetPixels returns rows bottom-to-top; PNG and the
          // upscaler expect top-to-bottom.
          return flipRgbaVertically(rgba, renderWidth, renderHeight);
        },
      });
      let rgba = result.rgba;
      let finalWidth = renderWidth;
      let finalHeight = renderHeight;
      if (factor > 1) {
        rgba = upscaleRgba(rgba, renderWidth, renderHeight, factor);
        finalWidth = renderWidth * factor;
        finalHeight = renderHeight * factor;
      }
      const metadata = buildCaptureMetadata({
        state: normalized,
        provenance: {
          registryId: KERR_VIEW_ID,
          model: provenance.model,
          status: provenance.status,
          numericalMethod: provenance.numericalMethod,
          references: provenance.references,
        },
        backend: "webgl2",
        quality: { requested: budget.requested, effective: budget.effective, budget },
        resolution: { width: finalWidth, height: finalHeight, renderWidth, renderHeight, upscale: factor, preset: resolved.preset },
        sampleCount: result.samplesCompleted,
        seed,
        commitHash,
        volume: { corona: state.corona, jets: state.jets },
        deterministic: { plasmaTime, clockFrozen: reducedMotion, note: "pixel-stable when the plasma clock is frozen (reduced motion or the QA harness)" },
      });
      const png = await encodePng({
        width: finalWidth, height: finalHeight, rgba,
        textChunks: {
          Software: "HORIZON Quantum Gravity Atlas",
          Description: "Kerr observatory ultra-quality still; see the horizon-qga-capture metadata",
          "horizon-qga-capture": JSON.stringify(metadata),
        },
      });
      return { png, metadata, width: finalWidth, height: finalHeight };
    } finally {
      release();
    }
  }

  return {
    mesh,
    sync,
    captureStill,
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
 *
 * The Prompt 05 volumetric layer (corona + jets), like the turbulent disk
 * texture before it, is implemented on the WebGL2 integrator's 4-target
 * accumulation MRT; requesting it selects that backend. The WebGPU compute
 * path retains the smooth Page-Thorne models.
 */
export async function createKerrRuntime({ backendPreference = "auto", seed = 42, diskModel = "page-thorne", wantsVolume = false } = {}) {
  // The turbulence display layer needs its disk-hit MRT, and the volumetric
  // layer needs the per-step emission/absorption sampling; both retain the
  // WebGL2 integrator until the compute backend implements the same passes.
  const glslOnly = diskModel === "page-thorne-turbulent" || wantsVolume === true;
  if (!glslOnly && await webGpuAvailable(backendPreference)) {
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
