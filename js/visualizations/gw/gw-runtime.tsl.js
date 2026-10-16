/**
 * GW spacetime instrument — WebGPU/TSL compute backend (Prompt 06).
 *
 * The lattice deformation runs as a GPU compute kernel: one thread per
 * particle reads h+(t − r·lag) and hx(t − r·lag) from a storage buffer
 * staging of the contract signal and applies the same quadrupolar tidal map
 * as the WebGL2 backend, writing displaced positions into an instancedArray
 * consumed directly by a SpriteNodeMaterial field (positionNode/scaleNode/
 * colorNode/opacityNode bound to the buffers through toAttribute()).
 *
 * Requires the native WebGPU backend (renderer.compute); gw-runtime.mjs
 * reaches this file only when an adapter exists, and any failure falls back
 * once to the WebGL2 lattice via the Kerr-style `recoverable` contract.
 */

import {
  Fn, Return, cos, float, instanceIndex, instancedArray, max, min, mix,
  positionGeometry, smoothstep, uniform, vec3,
} from "three/tsl";
import {
  AdditiveBlending, BoxGeometry, DoubleSide, Group, Mesh, MeshBasicNodeMaterial,
  RingGeometry, Sprite, SpriteNodeMaterial,
} from "three/webgpu";
import {
  GW_INSTRUMENT_VIEW_ID,
  buildLattice,
  latticeSide,
  particleBudget,
} from "./spacetime-instrument.mjs";

const WORKGROUP = 64;
const TEXELS = 2048; // signal texels per detector row (GW_SIGNAL_TEXEL_MAX)

export function createGwTslRuntime({ seed = 42, detail3d = "balanced", reducedMotion = false } = {}) {
  const { side } = latticeSide(particleBudget({ detail3d, reducedMotion }));
  const count = side * side;
  const extent = 9;
  const lattice = buildLattice({ side, extent, seed });

  // Storage buffers: rest layout (static vec4 = x, z, r, phase), live
  // positions (vec3), per-particle energy (float), and the signal staging
  // (vec4 per texel: time, h+, hx, envelope) for up to two detector rows.
  const restBuffer = instancedArray(count, "vec4");
  const posBuffer = instancedArray(count, "vec3");
  const energyBuffer = instancedArray(count, "float");
  const signalBuffer = instancedArray(TEXELS * 2, "vec4");

  const restArr = restBuffer.value.array;
  for (let i = 0; i < count * 4; i++) restArr[i] = lattice.positions[i];
  restBuffer.value.needsUpdate = true;

  const U = {
    time: uniform(0),
    duration: uniform(1),
    lag: uniform(0.45),
    gain: uniform(0.5),
    motion: uniform(1),
    rowBase: uniform(0), // element offset of this lattice's texel row
  };

  const kernel = Fn(() => {
    const rest = restBuffer.element(instanceIndex);
    const x = rest.x, z = rest.y, r = rest.z, phase = rest.w;
    const tLagged = max(float(0), U.time.sub(r.mul(U.lag)));
    const tn = min(float(1), tLagged.div(U.duration));
    const texel = U.rowBase.add(tn.mul(float(TEXELS - 1)).toInt());
    const sample = signalBuffer.element(texel);
    const hp = sample.g, hx = sample.b, env = sample.a;
    const g = U.gain.mul(U.motion.mul(0.6).add(float(0.4)));
    const dx = hp.mul(x).sub(hx.mul(z)).mul(float(0.5).mul(g));
    const dz = hx.mul(x).add(hp.mul(z)).mul(float(-0.5).mul(g));
    const y = env.mul(g).mul(float(0.9)).mul(cos(phase.add(U.time.mul(2)))).mul(float(1).sub(r.mul(0.6)));
    posBuffer.element(instanceIndex).assign(vec3(x.add(dx), y, z.add(dz)));
    energyBuffer.element(instanceIndex).assign(min(float(1), env.mul(float(1.45))));
    Return();
  })().compute(count, [WORKGROUP]);

  const material = new SpriteNodeMaterial();
  material.positionNode = posBuffer.toAttribute();
  // SpriteNodeMaterial has no sizeNode (r186): per-particle size is a
  // world-space scale multiplier. A stray sizeNode is silently ignored and
  // every sprite renders at scale 1, blowing the additive field out to white.
  material.scaleNode = energyBuffer.toAttribute().mul(0.16).add(0.04);
  material.colorNode = mix(vec3(0.165, 0.42, 1.0), vec3(0.616, 0.953, 1.0), energyBuffer.toAttribute());
  // Mirror the WebGL2 backend's fragment math: a round soft-edged dot
  // (smoothstep over the squared quad radius, same 0.015→0.25 ramp as the
  // GLSL FRAG). Without this the sprites are hard-edged squares and the
  // additive field saturates to a white sheet.
  const r2 = positionGeometry.xy.dot(positionGeometry.xy);
  const falloff = float(1).sub(smoothstep(float(0.015), float(0.25), r2));
  material.opacityNode = energyBuffer.toAttribute().mul(0.7).add(0.18).mul(falloff);
  material.blending = AdditiveBlending;
  material.depthWrite = false;
  material.transparent = true;

  const sprite = new Sprite(material);
  sprite.count = count;
  sprite.frustumCulled = false;
  sprite.name = `${GW_INSTRUMENT_VIEW_ID}-field`;

  const group = new Group();
  group.name = GW_INSTRUMENT_VIEW_ID;
  group.add(sprite);

  // Detector furniture mirrors the WebGL2 backend's look.
  const armMat = new MeshBasicNodeMaterial({ color: 0x6fd7ff, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false });
  const armLength = extent * 0.92;
  const armXGeo = new BoxGeometry(armLength * 2, 0.05, 0.05);
  const armZGeo = new BoxGeometry(armLength * 2, 0.05, 0.05);
  const armX = new Mesh(armXGeo, armMat);
  const armZ = new Mesh(armZGeo, armMat);
  armZ.rotation.y = Math.PI / 2;
  const ringMat = new MeshBasicNodeMaterial({ color: 0x59b7ff, transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false, side: DoubleSide });
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new Mesh(new RingGeometry(0.965, 1, 96), ringMat.clone());
    ring.rotation.x = -Math.PI / 2;
    rings.push(ring);
    group.add(ring);
  }
  group.add(armX, armZ);

  let disposed = false;
  let duration = 1;
  let rows = 1;

  /** Stage the contract signal rows into the compute storage buffer. */
  function setSignal(textureInfo) {
    const { width, height, data } = textureInfo;
    const arr = signalBuffer.value.array;
    arr.fill(0);
    rows = height;
    for (let row = 0; row < height; row++) {
      const base = row * TEXELS * 4;
      for (let i = 0; i < width; i++) {
        for (let c = 0; c < 4; c++) arr[base + i * 4 + c] = data[(row * width + i) * 4 + c] ?? 0;
      }
    }
    const attr = signalBuffer.value;
    if (attr.clearUpdateRanges) attr.clearUpdateRanges();
    if (attr.addUpdateRange) attr.addUpdateRange(0, arr.length);
    attr.needsUpdate = true;
  }

  /**
   * Per-frame update. `timelineTime` is the shared audio/transport clock, so
   * the compute lattice and the sonifier can never drift beyond one frame.
   */
  function sync({ renderer, timelineTime = 0, durationSeconds = null, gain = 0.5, motion = 1 } = {}) {
    if (disposed) return;
    if (durationSeconds && durationSeconds > 0) duration = durationSeconds;
    if (!renderer?.isWebGPURenderer || !renderer.backend?.isWebGPUBackend) {
      throw new Error("GW compute path requires the native WebGPU backend");
    }
    const t = Math.max(0, Number(timelineTime) || 0);
    U.time.value = t;
    U.duration.value = duration;
    U.gain.value = gain;
    U.motion.value = motion;
    renderer.compute(kernel);
    const span = Math.max(1e-3, duration);
    rings.forEach((ring, k) => {
      const phase = ((t / span) * 2 + k / 3) % 1;
      const r = 0.4 + phase * armLength * 1.05;
      ring.scale.set(r, r, 1);
      ring.material.opacity = 0.55 * (1 - phase) * (0.25 + 0.75 * motion);
    });
    const stretch = 1 + 0.07 * gain;
    armX.scale.x = stretch;
    armZ.scale.x = 2 - stretch;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    material.dispose();
    armXGeo.dispose();
    armZGeo.dispose();
    armMat.dispose();
    rings.forEach((ring) => { ring.geometry.dispose(); ring.material.dispose(); });
    ringMat.dispose();
    group.removeFromParent?.();
  }

  return {
    mesh: group,
    kind: "webgpu",
    particleCount: count,
    setSignal,
    sync,
    dispose,
    stats: () => ({ backend: "webgpu", particles: count, rows, duration }),
  };
}
