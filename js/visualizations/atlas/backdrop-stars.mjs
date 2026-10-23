/**
 * The atlas backdrop's depth starfield (S08): a static, seeded buffer drawn by one instanced sprite call. The twinkle is computed in
 * the vertex stage from the time uniform and a per-star phase, and the palette tint is a uniform, so the CPU uploads nothing per frame
 * (the previous version rewrote 700 stars' colours every frame and re-uploaded the whole colour attribute).
 */

import { Color } from "three";
import { seededRng } from "../../physics.mjs";
import { createDataPoints } from "../../render/materials/data-points.mjs";

const TAU = Math.PI * 2;

/** The star positions, colours (linear sRGB) and twinkle phases (turns) for `count` stars, deterministic in `seed`. */
export function backdropStarData(count, seed = 42) {
  if (!Number.isInteger(count) || count < 1) throw new RangeError(`backdropStarData: count must be a positive integer, got ${count}`);
  const rng = seededRng(seed);
  const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3), phases = new Float32Array(count);
  const tmp = new Color();
  for (let i = 0; i < count; i++) {
    // shell distribution with a denser galactic band
    const theta = rng() * TAU;
    const band = Math.pow(rng(), 1.7);
    const phi = Math.acos((2 * rng() - 1) * (0.5 + 0.5 * band));
    const radius = 40 + rng() * 120;
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) * 0.55;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 40;
    const warmish = rng();
    tmp.setHSL(0.58 + warmish * 0.06, 0.25 + rng() * 0.3, 0.7 + rng() * 0.25);
    const base = 0.45 + rng() * 0.55;                      // base brightness: folded into the colour
    const scale = 0.5 + 0.5 * base;
    colors[i * 3] = tmp.r * scale; colors[i * 3 + 1] = tmp.g * scale; colors[i * 3 + 2] = tmp.b * scale;
    phases[i] = rng();                                      // turns; the shader multiplies by 2 pi
  }
  return { positions, colors, phases };
}

/** The starfield sprite. `points.uniforms.time` drives the twinkle (0 = a still, byte-stable sky); `points.uniforms.tint` is the palette tint. */
export function createBackdropStars({ count, seed = 42 }) {
  const { positions, colors, phases } = backdropStarData(count, seed);
  // sizeAttenuation: size x (canvas height / 2) / depth, the rule PointsMaterial.size followed; the profile is a soft glow.
  return createDataPoints({
    positions, colors, sizePx: 1.35, sizeAttenuation: true, profile: "soft", additive: true, opacity: 1, tint: true,
    twinkle: { phases, depth: 0.8, rate: 1.6, colorBase: 0.6, colorGain: 0.4, sizeBase: 1, sizeGain: 0 },
  });
}
