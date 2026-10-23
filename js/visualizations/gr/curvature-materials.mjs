/**
 * Curvature engine materials (S07): the twinkling starfield, the luminous gravity well and the granulated central star, written
 * in TSL on top of the material kit (js/render/materials/). They replace the three GLSL ShaderMaterials that kept this scene on the
 * classic renderer; they run on the WebGPU renderer and on the node renderer's WebGL2 backend.
 *
 * The well is a schematic: a Flamm-style embedding intuition drawn with an engraved grid and a field heatmap of its depth (S20
 * replaces the geometry with the exact Flamm embedding). Colours come from the design tokens.
 */

import { AdditiveBlending, MeshBasicNodeMaterial } from "three/webgpu";
import {
  Fn, atan, clamp, cameraPosition, dot, exp, float, floor, fract, length, max, mix, normalize, normalWorld, positionLocal,
  positionWorld, pow, select, sin, smoothstep, uniform, varying, vec3, vec4,
} from "three/tsl";
import { seededRng } from "../../physics.mjs";
import * as TK from "../../design/tokens.mjs";
import { createDataPoints, fieldColorNode, lineCoverage, paletteTexture } from "../../render/materials/index.mjs";

const TAU = Math.PI * 2;
const STAR_TINTS = ["pigment-blue-94", "pigment-orange-96", "pigment-violet-81-c11", "pigment-pink-78"];
const WELL_RAMP = ["pigment-azure-64", "pigment-blue-79-c11", "pigment-blue-89-c05"];
const kitMaterial = (material, kit) => {
  material.userData.qgaNodeKit = true;
  material.userData.kit = kit;
  return material;
};

/** Twinkling starfield: a seeded shell above the sheet, instanced sprites sized like the former point sizes. */
export function createStarfield({ count, seed = 7 }) {
  const rng = seededRng(seed);
  const positions = new Float32Array(count * 3), phases = new Float32Array(count), sizes = new Float32Array(count), colors = new Float32Array(count * 3);
  const tints = STAR_TINTS.map((token) => TK.linear(token));
  for (let i = 0; i < count; i++) {
    const u = rng() * 2 - 1, a = rng() * TAU;
    const rr = Math.sqrt(1 - u * u), R = 78 + rng() * 60;
    positions[i * 3] = Math.cos(a) * rr * R;
    positions[i * 3 + 1] = Math.abs(u) * R * 0.85 + 6;     // bias above the sheet
    positions[i * 3 + 2] = Math.sin(a) * rr * R;
    phases[i] = rng();
    sizes[i] = 0.7 + rng() * 1.9;
    colors.set(tints[Math.floor(rng() * tints.length)], i * 3);
  }
  // sizeAttenuation: size x (canvas height / 2) / depth, the rule the former gl_PointSize = aSize * 240 / -z followed at 480 px.
  return createDataPoints({
    positions, sizePx: sizes, colors, profile: "soft", additive: true, sizeAttenuation: true, opacity: 1,
    twinkle: { phases, depth: 0.4, rate: 1.3 },
  });
}

/** The luminous gravity well. Returns the material and the uniforms the scene loop drives. */
export function createWellMaterial() {
  const uTime = uniform(0), uMaxDepth = uniform(3), uFlat = uniform(0), uRippleT = uniform(-1);
  const material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false, fog: false });
  material.blending = AdditiveBlending;

  // Vertex stage: a curvature ripple travelling outward since the last capture, added to the CPU-written funnel depth.
  const rad = length(positionLocal.xz);
  const front = uRippleT.mul(4.6).add(0.6);
  const band = exp(pow(rad.sub(front).mul(1.5), 2).negate());
  const ripple = band.mul(sin(rad.sub(front).mul(9))).mul(exp(uRippleT.mul(-1.35))).mul(0.55);
  const y = positionLocal.y.add(select(uRippleT.greaterThanEqual(0), ripple, float(0)));
  material.positionNode = vec3(positionLocal.x, y, positionLocal.z);
  const vDepth = varying(clamp(y.negate().div(max(uMaxDepth, 0.4)), 0, 1), "wellDepth");
  const vR = varying(rad, "wellRadius");

  // Engraved grid: Cartesian lines every world unit plus majors every four, and a polar net (rings and 24 spokes) near the throat.
  const x = positionLocal.x, z = positionLocal.z;
  const cart = max(lineCoverage(x, 1.35), lineCoverage(z, 1.35));
  const cartMajor = max(lineCoverage(x.mul(0.25), 1.1), lineCoverage(z.mul(0.25), 1.1));
  const ring = lineCoverage(vR, 1.25);
  const spoke = lineCoverage(atan(z, x).mul(12 / Math.PI), 0.9);
  const near = float(1).sub(smoothstep(1.6, 5.6, vR));
  const far = float(1).sub(near.mul(0.85));
  const grid = clamp(max(cart.mul(far).add(cartMajor.mul(0.5).mul(far)), ring.add(spoke).mul(near)), 0, 1.4);

  // Field heatmap of the embedding depth, through the iridescent rim -> mid -> deep ramp, with a slow shimmer and descending pulses.
  const ramp = paletteTexture({ range: [0, 1], palette: { stops: WELL_RAMP.map((token) => TK.linear(token)) } });
  const [dr, dg, db] = TK.linear(WELL_RAMP[2]);
  const deep = vec3(dr, dg, db);
  const shimmer = float(1).add(sin(vR.mul(2.6).sub(uTime.mul(1.25)).add(vDepth.mul(5))).mul(0.14));
  const color = fieldColorNode(vDepth, [0, 1], ramp).mul(shimmer);
  const pulse = sin(vDepth.mul(7).sub(uTime.mul(1.1)).mul(TAU)).mul(0.5).add(0.5);
  const bright = mix(
    float(0.34).add(pow(vDepth, 1.4).mul(1.7)).mul(float(0.76).add(pulse.mul(0.36))),
    float(0.34), uFlat,
  );
  const fill = float(0.05).add(pow(vDepth, 2).mul(0.32)).mul(float(1).sub(uFlat.mul(0.7)));
  const rimFade = float(1).sub(smoothstep(6.2, 8.8, vR));
  const lit = color.mul(grid).mul(bright).add(deep.mul(fill)).mul(rimFade);
  const [fr, fg, fb] = TK.linear("pigment-blue-75-c05");
  const flat = vec3(fr, fg, fb).mul(grid.mul(0.35).add(fill.mul(0.5)));
  material.colorNode = vec4(mix(lit, flat, uFlat.mul(0.55)), 1);
  return { material: kitMaterial(material, "gr-well"), uniforms: { time: uTime, maxDepth: uMaxDepth, flat: uFlat, rippleT: uRippleT } };
}

const hash3 = Fn(([p]) => fract(sin(dot(p, vec3(127.1, 311.7, 74.7))).mul(43758.5453)));
const noise3 = Fn(([p]) => {
  const i = floor(p), f = fract(p);
  const u = f.mul(f).mul(float(3).sub(f.mul(2)));
  const corner = (dx, dy, dz) => hash3(i.add(vec3(dx, dy, dz)));
  const x00 = mix(corner(0, 0, 0), corner(1, 0, 0), u.x), x10 = mix(corner(0, 1, 0), corner(1, 1, 0), u.x);
  const x01 = mix(corner(0, 0, 1), corner(1, 0, 1), u.x), x11 = mix(corner(0, 1, 1), corner(1, 1, 1), u.x);
  return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);
});
const fbm = (p0) => {
  let p = p0, v = float(0), a = 0.5;
  for (let i = 0; i < 4; i++) { v = v.add(noise3(p).mul(a)); p = p.mul(2.07); a *= 0.5; }
  return v;
};

/** The fBm-granulated central star: hot granules on a cool base, limb-darkened with a bright rim. */
export function createStarMaterial() {
  const uTime = uniform(0);
  const material = new MeshBasicNodeMaterial({ fog: false });
  const n = fbm(normalize(positionLocal).mul(3.4).add(vec3(0, uTime.mul(0.1), uTime.mul(0.04))));
  const granules = smoothstep(0.3, 0.78, n);
  const [hr, hg, hb] = TK.linear("pigment-orange-96"), [cr, cg, cb] = TK.linear("pigment-orange-84-c13"), [kr, kg, kb] = TK.linear("pigment-amber-92");
  const base = mix(vec3(cr, cg, cb), vec3(hr, hg, hb), granules);
  const facing = max(dot(normalize(normalWorld), normalize(cameraPosition.sub(positionWorld))), 0);
  const lit = base.mul(float(0.5).add(pow(facing, 0.55).mul(0.8))).add(vec3(kr, kg, kb).mul(pow(float(1).sub(facing), 2.8)).mul(1.5));
  material.colorNode = vec4(lit, 1);
  return { material: kitMaterial(material, "gr-star"), uniforms: { time: uTime } };
}
