// Instanced screen-space point sprites (S07): causal-set points, detector hits, measured data, starfields.
//
// r186 facts this module is built on (read from vendor/three/build/three.webgpu.js): a WebGPU `Points` primitive is always one
// pixel, so a size in pixels needs quads. `PointsNodeMaterial` used on an instanced `Sprite` honours `sizeNode` in CSS pixels
// (times the device pixel ratio) and, with `sizeAttenuation` on a perspective camera, scales it by half the canvas height over
// view depth (the WebGLRenderer's own rule). One draw call, `count` instances, positions and sizes read from instance attributes.

import { Color, DynamicDrawUsage, InstancedBufferAttribute, Sprite, StaticDrawUsage } from "three";
import { BufferAttributeNode, AdditiveBlending, NormalBlending, PointsNodeMaterial } from "three/webgpu";
import { cameraProjectionMatrix, clamp, float, fwidth, length, min, mix, sin, smoothstep, uniform, uv, vec2, vec3 } from "three/tsl";

export const DATA_POINT_PROFILES = Object.freeze(["disc", "soft"]);

/** Validated options with defaults. `positions` is a Float32Array of xyz triples. */
export function normalizeDataPointOptions({
  positions, count: givenCount, nodes = null, sizePx = 4, colors = null, color = null, opacity = 1, profile = "disc", ring = null, sizeAttenuation = false,
  additive = false, twinkle = null, dynamic = false, tint = false,
} = {}) {
  // Two sources of per-point data: CPU arrays (`positions`, `colors`, `sizePx` as Float32Arrays) or TSL nodes (`count` plus
  // `nodes: { position, color?, opacity?, size? }`, e.g. attributes of a compute storage buffer; nothing is uploaded per frame).
  if (nodes !== null) {
    if (!Number.isInteger(givenCount) || givenCount < 1) throw new RangeError("createDataPoints: nodes mode needs an integer count >= 1");
    if (!nodes.position?.isNode) throw new TypeError("createDataPoints: nodes.position must be a TSL node");
    for (const key of ["color", "opacity", "size"]) if (nodes[key] !== undefined && !nodes[key].isNode) throw new TypeError(`createDataPoints: nodes.${key} must be a TSL node`);
    if (positions || colors) throw new RangeError("createDataPoints: pass positions/colors arrays or nodes, not both");
  } else if (!(positions instanceof Float32Array) || positions.length === 0 || positions.length % 3 !== 0) {
    throw new TypeError("createDataPoints: positions must be a non-empty Float32Array of xyz triples");
  }
  const count = nodes ? givenCount : positions.length / 3;
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
    for (const key of ["colorBase", "colorGain", "sizeBase", "sizeGain"]) {
      if (twinkle[key] !== undefined && !(twinkle[key] >= 0 && Number.isFinite(twinkle[key]))) throw new RangeError(`createDataPoints: twinkle.${key} must be non-negative`);
    }
  }
  return Object.freeze({ positions, count, nodes, sizePx, sizes, colors, color, opacity, profile, ring: ring && Object.freeze({ ...ring }), sizeAttenuation: sizeAttenuation === "world" ? "world" : !!sizeAttenuation, additive: !!additive,
    twinkle: twinkle && Object.freeze({ colorBase: 0.55, colorGain: 0.45, sizeBase: 0.7, sizeGain: 0.3, ...twinkle }), dynamic: !!dynamic, tint: !!tint });
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
 * is a size in world units like `PointsMaterial.size` (pixels = size x half the canvas height / view depth); `sizeAttenuation: "world"` is a
 * size in true world units, like a Sprite's scale.
 * `dynamic: true` marks the positions and colours as rewritten every frame.
 */
export function createDataPoints(input) {
  const options = normalizeDataPointOptions(input);
  const { count } = options;
  const position = options.nodes ? { node: options.nodes.position, attribute: null } : instanced(options.positions, "vec3", options.dynamic);
  const material = new PointsNodeMaterial({ transparent: true, depthWrite: false, fog: false });
  material.blending = options.additive ? AdditiveBlending : NormalBlending;
  material.sizeAttenuation = !!options.sizeAttenuation;
  material.positionNode = position.node;

  const sizeBuffer = options.sizes ? instanced(options.sizes, "float", false) : null;
  const sizeNode = options.nodes?.size ?? (sizeBuffer ? sizeBuffer.node : float(options.sizePx));
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
  // "world": a size in world units like a Sprite's scale. PointsNodeMaterial attenuates by (canvas height / 2) / depth, a sprite by
  // (canvas height / 2) * cot(fov / 2) / depth, so the size is multiplied by the projection's cot(fov / 2) (P[1][1]).
  const worldFactor = options.sizeAttenuation === "world" ? cameraProjectionMatrix.element(1).y : float(1);
  material.sizeNode = vec2(sizeNode.mul(worldFactor).mul(options.twinkle ? float(options.twinkle.sizeBase).add(twinkleNode.mul(options.twinkle.sizeGain)) : 1).add(2 * padPx));

  // Profile in screen pixels: the quad's on-screen width follows from the uv derivative (the sprite is axis aligned), so every
  // measure below is in pixels whatever the size, attenuation or device pixel ratio.
  const quadPx = float(1).div(fwidth(uv().x).max(1e-6));
  const radiusPx = quadPx.mul(0.5).sub(padPx);
  const distancePx = length(uv().sub(0.5)).mul(quadPx);
  // "soft" follows the shared glow texture (js/visualizations/glow-texture.mjs: alpha 1 at the centre, 0.55 at a quarter of the radius,
  // 0.12 at 0.6, 0 at the edge), so a migrated THREE.Points / Sprite glow keeps its look.
  const t = distancePx.div(radiusPx);
  const glow = mix(mix(mix(float(1), float(0.55), smoothstep(0, 0.25, t)), float(0.12), smoothstep(0.25, 0.6, t)), float(0), smoothstep(0.6, 1, t));
  let coverage = options.profile === "soft" ? glow : clamp(radiusPx.sub(distancePx).add(0.5), 0, 1);
  if (options.ring) {
    const ring = clamp(min(distancePx.sub(radiusPx.sub(options.ring.widthPx)), radiusPx.sub(distancePx)).add(0.5), 0, 1);
    coverage = coverage.mul(options.ring.fill === true ? 1 : ring);
  }
  const colorBuffer = options.colors ? instanced(options.colors, "vec3", options.dynamic) : null;
  const rgb = options.nodes?.color ?? (colorBuffer ? colorBuffer.node : vec3(...(options.color ?? [1, 1, 1])));
  // `tint`: a colour (linear sRGB) added to every point, driven by a uniform so a palette change costs no upload.
  const tintUniform = uniform(new Color().setScalar(0));
  const shaded = rgb.mul(options.twinkle ? float(options.twinkle.colorBase).add(twinkleNode.mul(options.twinkle.colorGain)) : 1);
  material.colorNode = options.tint ? shaded.add(tintUniform) : shaded;
  const baseOpacity = options.nodes?.opacity ? options.nodes.opacity.mul(options.opacity) : float(options.opacity);
  material.opacityNode = coverage.mul(baseOpacity).mul(options.profile === "soft" ? 0.85 : 1);
  material.userData.qgaNodeKit = true;
  material.userData.kit = "data-points";

  const object = new Sprite(material);
  object.count = count;
  object.frustumCulled = false;
  return {
    object, material, count, uniforms: { time: timeUniform, tint: tintUniform },
    /** Overwrite the positions in place (the array length must not change) and re-upload them. */
    setPositions(array) {
      if (!position.attribute) throw new TypeError("setPositions: this point set reads its positions from a node (compute buffer)");
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
