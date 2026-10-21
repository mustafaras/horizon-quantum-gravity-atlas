/**
 * GW spacetime instrument — WebGL2 backend + runtime selection (Prompt 06).
 *
 * A 12k-120k point "spacetime fabric" lattice whose nodes deform in the
 * vertex shader: every node samples h+(t − r·lag) and hx(t − r·lag) from a
 * float DataTexture of the *whole* signal, so the chirp visibly propagates
 * outward at finite speed for one uniform update per frame regardless of
 * particle count. Detector arms, expanding pulse rings, and energy-tinted
 * glow carry the read-out.
 *
 * The WebGPU/TSL sibling (gw-runtime.tsl.js) computes the identical
 * deformation in a GPU compute kernel over an instanced sprite field. Both
 * consume the shared contract in spacetime-instrument.mjs; selection mirrors
 * the Kerr observatory (native WebGPU adapter -> TSL compute, else WebGL2,
 * with a one-shot recoverable fallback).
 */

import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, Color,
  ClampToEdgeWrapping, DataTexture, FloatType, DoubleSide, Group, Mesh,
  MeshBasicMaterial, NearestFilter, Points, PointsMaterial, RGBAFormat,
  RingGeometry, ShaderMaterial,
} from "three";
import {
  GW_INSTRUMENT_VIEW_ID,
  buildLattice,
  latticeSide,
  particleBudget,
} from "./spacetime-instrument.mjs";
import * as TK from "../../design/tokens.mjs";

const VERT = /* glsl */ `
precision highp float;
attribute vec2 aRest;
attribute float aR;
attribute float aPhase;
uniform sampler2D uSignal;
uniform float uTime, uDuration, uLag, uGain, uRow, uRows, uOffsetX, uMotion, uSize, uPixelRatio;
uniform float uMerger; // merger time in seconds; < 0 disables the shell flash
varying vec3 vColor;
varying float vAlpha;
uniform vec3 uColorLow;
uniform vec3 uColorHigh;
void main() {
  float span = max(1e-3, uDuration);
  // Finite propagation: the node at radius r sees the wave lag(r) later.
  float t = clamp(uTime - aR * uLag, 0.0, span);
  vec4 s = texture2D(uSignal, vec2(t / span, (uRow + 0.5) / uRows));
  float hp = s.g, hx = s.b, env = s.a;
  vec2 p = aRest;
  // Proper-detector-frame quadrupolar tidal deformation (amplified for display):
  // plus stretches x / squeezes z; cross sheers along the diagonals.
  float g = uGain * (0.4 + 0.6 * uMotion);
  vec2 d = vec2(hp * p.x - hx * p.y, -hx * p.x - hp * p.y) * (0.5 * g);
  // Subtle vertical breathing gives the lattice depth cues (visualization aid).
  float y = env * g * 0.9 * cos(aPhase + uTime * 2.0) * (1.0 - aR * 0.6);
  vec3 pos = vec3(p.x + d.x + uOffsetX, y, p.y + d.y);
  // Signed radial strain: + stretch, - squeeze, normalized by the local
  // envelope so the hue reads the wave's direction, not just its strength.
  float rlen = length(p);
  float radial = rlen > 1e-4 ? dot(d, p / rlen) : 0.0;
  float sN = clamp(radial / (0.5 * g * rlen * max(env, 0.12) + 1e-5), -1.0, 1.0);
  // Merger shell: nodes whose delayed time crosses coalescence flash white
  // and the flash travels outward with the visualization's wave speed.
  float wf = uMerger >= 0.0 ? exp(-pow((t - uMerger) * 5.0, 2.0)) * step(0.05, env) : 0.0;
  float energy = clamp(env * 1.45 + wf * 0.55, 0.0, 1.0);
  vec3 tint = mix(mix(uColorLow, vec3(1.0, 0.60, 0.235), max(0.0, -sN)),
    uColorHigh, max(0.0, sN));
  vColor = mix(tint, vec3(1.0), wf * 0.65);
  vAlpha = (0.18 + 0.82 * energy) * (1.0 - 0.5 * aR);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = uSize * uPixelRatio * (1.0 + 2.1 * energy + 1.6 * wf) * (260.0 / max(1.0, -mv.z));
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
precision highp float;
varying vec3 vColor;
varying float vAlpha;
uniform float uOpacity;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r2 = dot(c, c);
  if (r2 > 0.25) discard;
  float a = smoothstep(0.25, 0.015, r2);
  gl_FragColor = vec4(vColor, vAlpha * a * uOpacity);
}
`;

// Read when a scene is built, so a theme change takes effect on the next build.
const palette = () => ({
  low: new Color(TK.hex("pigment-blue-58")),
  high: new Color(TK.hex("pigment-cyan-91")),
  arm: new Color(TK.hex("pigment-azure-83")),
  ring: new Color(TK.hex("pigment-azure-75-c14")),
});

function detectorAssembly({ extent }) {
  const group = new Group();
  const { arm: ARM_COLOR, ring: RING_COLOR } = palette();
  const armLength = extent * 0.92;
  const armMat = new MeshBasicMaterial({ color: ARM_COLOR, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false });
  const armXGeo = new BoxGeometry(armLength * 2, 0.05, 0.05);
  const armZGeo = new BoxGeometry(armLength * 2, 0.05, 0.05);
  const armX = new Mesh(armXGeo, armMat);
  const armZ = new Mesh(armZGeo, armMat);
  armZ.rotation.y = Math.PI / 2;
  const ringMat = new MeshBasicMaterial({ color: RING_COLOR, transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false, side: DoubleSide });
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new Mesh(new RingGeometry(0.965, 1, 96), ringMat.clone());
    ring.rotation.x = -Math.PI / 2;
    rings.push(ring);
    group.add(ring);
  }
  group.add(armX, armZ);
  return { group, armX, armZ, armMat, armXGeo, armZGeo, rings, armLength };
}

/**
 * Build the WebGL2 runtime for up to two detector rows (H1, optional L1).
 * `lattice` budgets the per-row particle side length.
 */
export function createGwGlslRuntime({ seed = 42, detail3d = "balanced", reducedMotion = false, mergerSeconds = null } = {}) {
  const count = particleBudget({ detail3d, reducedMotion });
  const { side } = latticeSide(count);
  const extent = 9;
  const lattice = buildLattice({ side, extent, seed });

  const group = new Group();
  group.name = GW_INSTRUMENT_VIEW_ID;

  const signalTexture = new DataTexture(new Float32Array(2 * 4), 2, 1, RGBAFormat, FloatType);
  signalTexture.minFilter = NearestFilter;
  signalTexture.magFilter = NearestFilter;
  signalTexture.wrapS = ClampToEdgeWrapping;
  signalTexture.wrapT = ClampToEdgeWrapping;
  signalTexture.needsUpdate = true;

  const rowObjects = [];
  let disposed = false;
  let signal = null;
  let duration = 1;
  let pixelRatio = 1;

  const makeRow = (rowIndex) => {
    const geo = new BufferGeometry();
    const rest = new Float32Array(lattice.total * 2);
    const radii = new Float32Array(lattice.total);
    const phases = new Float32Array(lattice.total);
    for (let i = 0; i < lattice.total; i++) {
      rest[i * 2] = lattice.positions[i * 4];
      rest[i * 2 + 1] = lattice.positions[i * 4 + 1];
      radii[i] = lattice.positions[i * 4 + 2];
      phases[i] = lattice.positions[i * 4 + 3];
    }
    geo.setAttribute("aRest", new BufferAttribute(rest, 2));
    geo.setAttribute("aR", new BufferAttribute(radii, 1));
    geo.setAttribute("aPhase", new BufferAttribute(phases, 1));
    // Rest-position ghost: a static, dim reference lattice so the deformed
    // field visibly reads as motion relative to "no wave".
    const ghostGeo = new BufferGeometry();
    const ghostPos = new Float32Array(lattice.total * 3);
    for (let i = 0; i < lattice.total; i++) {
      ghostPos[i * 3] = lattice.positions[i * 4];
      ghostPos[i * 3 + 1] = 0;
      ghostPos[i * 3 + 2] = lattice.positions[i * 4 + 1];
    }
    ghostGeo.setAttribute("position", new BufferAttribute(ghostPos, 3));
    const ghostMat = new PointsMaterial({
      color: TK.hex("pigment-blue-48-c09"), size: 1.5, sizeAttenuation: false,
      transparent: true, opacity: 0.28, depthWrite: false,
    });
    const ghost = new Points(ghostGeo, ghostMat);
    ghost.frustumCulled = false;
    const { low: COLOR_LOW, high: COLOR_HIGH } = palette();
    const material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uSignal: { value: signalTexture },
        uTime: { value: 0 },
        uDuration: { value: 1 },
        uLag: { value: 0.45 },
        uGain: { value: 0.5 },
        uRow: { value: rowIndex },
        uRows: { value: 1 },
        uOffsetX: { value: 0 },
        uMotion: { value: 1 },
        uSize: { value: 2.1 },
        uOpacity: { value: 0.9 },
        uPixelRatio: { value: 1 },
        uMerger: { value: mergerSeconds != null && mergerSeconds >= 0 ? mergerSeconds : -1 },
        uColorLow: { value: COLOR_LOW.clone() },
        uColorHigh: { value: COLOR_HIGH.clone() },
      },
    });
    const points = new Points(geo, material);
    points.frustumCulled = false;
    const detector = detectorAssembly({ extent });
    const rowGroup = new Group();
    rowGroup.add(ghost, points, detector.group);
    group.add(rowGroup);
    return { points, material, geometry: geo, detector, rowGroup, ghost, ghostGeo, ghostMat };
  };

  makeRow(0);

  /** Attach (or replace) the signal texture from contract-built rows. */
  function setSignal(textureInfo) {
    signal = textureInfo;
    const { width, height, data } = textureInfo;
    signalTexture.image = { data, width, height };
    signalTexture.needsUpdate = true;
    rowObjects.forEach((row, i) => {
      row.material.uniforms.uRows.value = height;
      row.material.uniforms.uRow.value = Math.min(i, height - 1);
    });
  }

  /** Add or remove the second (L1) lattice to match the split layout. */
  function setRows(rows) {
    const wanted = Math.max(1, Math.min(2, rows?.length || 1));
    while (rowObjects.length < wanted) rowObjects.push(makeRow(rowObjects.length));
    while (rowObjects.length > wanted) {
      const row = rowObjects.pop();
      group.remove(row.rowGroup);
      row.geometry.dispose();
      row.material.dispose();
      row.ghostGeo.dispose();
      row.ghostMat.dispose();
    }
    rowObjects.forEach((row, i) => {
      row.rowGroup.position.x = rows ? (rows[i]?.offsetX ?? 0) : 0;
      row.detector.group.position.x = 0;
      row.material.uniforms.uOffsetX.value = 0;
      row.material.uniforms.uLag.value = wanted > 1 ? 0.32 : 0.45;
      row.material.uniforms.uSize.value = wanted > 1 ? 1.7 : 2.1;
    });
    if (signal) setSignal(signal);
  }

  /**
   * Per-frame update. `timelineTime` is the shared audio/transport clock;
   * the shader derives every node's phase from it, so audio and visuals can
   * never drift beyond one frame.
   */
  function sync({ timelineTime = 0, durationSeconds = null, gain = 0.5, motion = 1, ratio = 1, lagSeconds = null } = {}) {
    if (disposed) return;
    pixelRatio = ratio || pixelRatio;
    if (durationSeconds && durationSeconds > 0) duration = durationSeconds;
    const t = Math.max(0, Number(timelineTime) || 0);
    const envNow = signal ? envAt(signal, t / Math.max(1e-3, duration)) : 0;
    rowObjects.forEach((row, i) => {
      const u = row.material.uniforms;
      u.uTime.value = t;
      u.uDuration.value = duration;
      u.uMotion.value = motion;
      u.uGain.value = gain;
      u.uPixelRatio.value = pixelRatio;
      if (lagSeconds != null) u.uLag.value = lagSeconds;
      // Pulse rings breathe outward with the timeline (one wavefront each third).
      const span = Math.max(1e-3, duration);
      row.detector.rings.forEach((ring, k) => {
        const phase = ((t / span) * 2 + k / 3) % 1;
        const r = 0.4 + phase * row.detector.armLength * 1.05;
        ring.scale.set(r, r, 1);
        ring.material.opacity = 0.55 * (1 - phase) * (0.25 + 0.75 * motion);
      });
      // Arms flex with the current strain at the detector centre.
      const stretch = 1 + 0.14 * gain * Math.sin((t / span) * 40) * envNow;
      row.detector.armX.scale.x = stretch;
      row.detector.armZ.scale.x = 2 - stretch;
      void i;
    });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const row of rowObjects) {
      row.geometry.dispose();
      row.material.dispose();
      row.ghostGeo.dispose();
      row.ghostMat.dispose();
      row.detector.rings.forEach((ring) => { ring.geometry.dispose(); ring.material.dispose(); });
      row.detector.armXGeo.dispose();
      row.detector.armZGeo.dispose();
      row.detector.armMat.dispose();
    }
    signalTexture.dispose();
    group.removeFromParent?.();
  }

  return {
    mesh: group,
    kind: "webgl2",
    particleCount: lattice.total,
    setSignal,
    setRows,
    sync,
    dispose,
    recoverable: () => false,
    stats: () => ({ backend: "webgl2", particles: lattice.total, rows: rowObjects.length, duration }),
  };
}

/** Envelope sample from a contract texture row set at normalized time. */
function envAt(textureInfo, tNorm) {
  const { width, height, data } = textureInfo;
  if (!data || width < 2) return 0;
  const x = Math.max(0, Math.min(1, tNorm));
  const i = Math.min(width - 1, Math.round(x * (width - 1)));
  let env = 0;
  for (let row = 0; row < height; row++) env = Math.max(env, data[(row * width + i) * 4 + 3] || 0);
  return Math.min(1, env * 1.45);
}

/** True when a native WebGPU adapter is obtainable and not forced off. */
async function webGpuAvailable(preference) {
  if (preference === "webgl2" || preference === "static") return false;
  if (globalThis.__qgaGwWebGpuFailed || !globalThis.navigator?.gpu) return false;
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
 * Runtime selection used by the theatre: WebGPU adapter present -> TSL
 * compute lattice; otherwise the WebGL2 vertex-shader lattice. A WebGPU
 * runtime that fails at render time asks for a one-shot rebuild on WebGL2
 * (the Kerr `recoverable` contract).
 */
export async function createGwRuntime({ backendPreference = "auto", seed = 42, detail3d = "balanced", reducedMotion = false, mergerSeconds = null } = {}) {
  if (await webGpuAvailable(backendPreference)) {
    try {
      const { createGwTslRuntime } = await import("./gw-runtime.tsl.js");
      const runtime = createGwTslRuntime({ seed, detail3d, reducedMotion, mergerSeconds });
      return Object.assign(runtime, {
        kind: "webgpu",
        recoverable() { globalThis.__qgaGwWebGpuFailed = true; return true; },
      });
    } catch (error) {
      globalThis.__qgaGwWebGpuFailed = true;
      console.warn("GW instrument WebGPU compute path unavailable; using the WebGL2 lattice.", error);
    }
  }
  const runtime = createGwGlslRuntime({ seed, detail3d, reducedMotion, mergerSeconds });
  return Object.assign(runtime, { kind: "webgl2", recoverable: () => false });
}
