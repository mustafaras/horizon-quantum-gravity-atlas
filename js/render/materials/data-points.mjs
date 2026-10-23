// Instanced screen-space point sprites (S07): causal-set points, detector hits, measured data, starfields.
//
// r186 facts this module is built on (read from vendor/three/build/three.webgpu.js): a WebGPU `Points` primitive is always one
// pixel, so a size in pixels needs quads. `PointsNodeMaterial` used on an instanced `Sprite` honours `sizeNode` in CSS pixels
// (times the device pixel ratio) and, with `sizeAttenuation` on a perspective camera, scales it by half the canvas height over
// view depth (the WebGLRenderer's own rule). One draw call, `count` instances, positions and sizes read from instance attributes.

import { DynamicDrawUsage, InstancedBufferAttribute, Sprite, StaticDrawUsage } from "three";
import { BufferAttributeNode, AdditiveBlending, NormalBlending, PointsNodeMaterial } from "three/webgpu";
import { clamp, float, fwidth, length, min, sin, smoothstep, uniform, uv, vec2, vec3 } from "three/tsl";

export const DATA_POINT_PROFILES = Object.freeze(["disc", "soft"]);

/** Validated options with defaults. `positions` is a Float32Array of xyz triples. */
export function normalizeDataPointOptions({
  positions, sizePx = 4, colors = null, color = null, opacity = 1, profile = "disc", ring = null, sizeAttenuation = false,
  additive = false, twinkle = null, dynamic = false,
} = {}) {
  if (!(positions instanceof Float32Array) || positions.length === 0 || positions.length % 3 !== 0) {
    throw new TypeError("createDataPoints: positions must be a non-empty Float32Array of xyz triples");
  }
  const count = positions.length / 3;
  const sizes = sizePx instanceof Float32Array ? sizePx : null;
  if (sizes && sizes.length !== count) throw new RangeError(`createDataPoints: sizePx has ${sizes.length} entries for ${count} points`);
  if (!sizes && !(sizePx > 0 && Number.isFinite(sizePx))) throw new RangeError(`createDataPoints: sizePx must be positive, got ${sizePx}`);
  if (sizes && !sizes.every((s) => s > 0 && Number.isFinite(s))) throw new RangeError("createDataPoints: every size must be positive");
  if (colors && !(colors instanceof Float32Array && colors.length === count * 3)) throw new RangeError("createDataPoints: colors must be a Float32Array of linear rgb triples, one per point");
  if (colors && color !== null) throw new RangeError("createDataPoints: pass colors or color, not both");
  if (!DATA_POINT_PROFILES.includes(profile)) throw new RangeError(`createDataPoints: profile must be one of ${DATA_POINT_PROFILES.join(", ")}`);
  if (!(opacity >= 0 && opacity <= 1)) throw new RangeError(`createDataPoints: opacity must be in [0, 1], got ${opacity}`);
  if (ring && !(ring.widthPx > 0 && ring.widthPx <= 8)) throw new RangeError("createDataPoints: ring.widthPx must be in (0, 8]");
  if (twinkle) {
    if (!(twinkle.phases instanceof Float32Array && twinkle.phases.length === count)) throw new RangeError("createDataPoints: twinkle.phases must be a Float32Array, one phase per point");
    if (!(twinkle.depth >= 0 && twinkle.depth <= 1)) throw new RangeError("createDataPoints: twinkle.depth must be in [0, 1]");
    if (!(twinkle.rate >= 0 && Number.isFinite(twinkle.rate))) throw new RangeError("createDataPoints: twinkle.rate must be non-negative");
  }
  return Object.freeze({ positions, count, sizePx, sizes, colors, color, opacity, profile, ring: ring && Object.freeze({ ...ring }), sizeAttenuation: !!sizeAttenuation, additive: !!additive, twinkle, dynamic: !!dynamic });
}

const instanced = (array, type, dynamic) => {
  // A BufferAttribute of at most 4 components is used as the shader attribute itself, so `attribute.needsUpdate` re-uploads it.
  const attribute = new InstancedBufferAttribute(array, type === "float" ? 1 : 3).setUsage(dynamic ? DynamicDrawUsage : StaticDrawUsage);
  const node = new BufferAttributeNode(attribute, type);
  return { attribute, node };
};

/**
 * Builds the sprite. Returns `{ object, material, count, uniforms: { time }, setPositions, setColors, setCount, dispose }`.
 * Colours are linear-sRGB; the caller converts tokens (`TK.linear`). `sizePx` is CSS pixels, except with `sizeAttenuation`, where it
 * is a size in world units like `PointsMaterial.size` (pixels = size x half the canvas height / view depth).
 * `dynamic: true` marks the positions and colours as rewritten every frame.
 */
export function createDataPoints(input) {
  const options = normalizeDataPointOptions(input);
  const { count } = options;
  const position = instanced(options.positions, "vec3", options.dynamic);
  const material = new PointsNodeMaterial({ transparent: true, depthWrite: false, fog: false });
  material.blending = options.additive ? AdditiveBlending : NormalBlending;
  material.sizeAttenuation = options.sizeAttenuation;
  material.positionNode = position.node;

  const sizeBuffer = options.sizes ? instanced(options.sizes, "float", false) : null;
  const sizeNode = sizeBuffer ? sizeBuffer.node : float(options.sizePx);
  const timeUniform = uniform(0);
  const twinkleNode = options.twinkle
    ? (() => {
      const phase = instanced(options.twinkle.phases, "float", false).node;
      const wave = sin(timeUniform.mul(options.twinkle.rate).add(phase.mul(6.2831853)));
      return float(1 - options.twinkle.depth).add(wave.mul(0.5).add(0.5).mul(options.twinkle.depth));
    })()
    : float(1);
  // Without attenuation the quad is one pixel larger than the disc on every side, so the edge antialiasing is centred on the disc's
  // true radius (a point of `sizePx` covers a disc of exactly that diameter). With attenuation the on-screen size is not known when
  // the vertex stage adds to it, so the quad is the disc and the outer half of the edge ramp is clipped (a fraction of a pixel).
  const padPx = options.sizeAttenuation ? 0 : 1;
  material.sizeNode = vec2(sizeNode.mul(options.twinkle ? float(0.7).add(twinkleNode.mul(0.3)) : 1).add(2 * padPx));

  // Profile in screen pixels: the quad's on-screen width follows from the uv derivative (the sprite is axis aligned), so every
  // measure below is in pixels whatever the size, attenuation or device pixel ratio.
  const quadPx = float(1).div(fwidth(uv().x).max(1e-6));
  const radiusPx = quadPx.mul(0.5).sub(padPx);
  const distancePx = length(uv().sub(0.5)).mul(quadPx);
  let coverage = options.profile === "soft"
    ? float(1).sub(smoothstep(0.12, 1, distancePx.div(radiusPx)))
    : clamp(radiusPx.sub(distancePx).add(0.5), 0, 1);
  if (options.ring) {
    const ring = clamp(min(distancePx.sub(radiusPx.sub(options.ring.widthPx)), radiusPx.sub(distancePx)).add(0.5), 0, 1);
    coverage = coverage.mul(options.ring.fill === true ? 1 : ring);
  }
  const colorBuffer = options.colors ? instanced(options.colors, "vec3", options.dynamic) : null;
  const rgb = colorBuffer ? colorBuffer.node : vec3(...(options.color ?? [1, 1, 1]));
  material.colorNode = rgb.mul(options.twinkle ? float(0.55).add(twinkleNode.mul(0.45)) : 1);
  material.opacityNode = coverage.mul(options.opacity).mul(options.profile === "soft" ? 0.85 : 1);
  material.userData.qgaNodeKit = true;
  material.userData.kit = "data-points";

  const object = new Sprite(material);
  object.count = count;
  object.frustumCulled = false;
  return {
    object, material, count, uniforms: { time: timeUniform },
    /** Overwrite the positions in place (the array length must not change) and re-upload them. */
    setPositions(array) {
      if (!(array instanceof Float32Array) || array.length !== position.attribute.array.length) throw new RangeError("setPositions: need a Float32Array of the original length");
      if (array !== position.attribute.array) position.attribute.array.set(array);
      position.attribute.needsUpdate = true;
    },
    /** Overwrite the per-point colours (linear sRGB) in place and re-upload them; needs `colors` at creation. */
    setColors(array) {
      if (!colorBuffer) throw new TypeError("setColors: this point set was created without per-point colors");
      if (!(array instanceof Float32Array) || array.length !== colorBuffer.attribute.array.length) throw new RangeError("setColors: need a Float32Array of the original length");
      if (array !== colorBuffer.attribute.array) colorBuffer.attribute.array.set(array);
      colorBuffer.attribute.needsUpdate = true;
    },
    /** Draw only the first n points. */
    setCount(n) { object.count = Math.max(0, Math.min(count, Math.floor(n))); },
    dispose() { material.dispose(); },
  };
}

export function prewarmSignature() {
  return "data-points:disc";
}
