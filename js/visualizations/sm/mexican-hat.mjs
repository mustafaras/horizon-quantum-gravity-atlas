/**
 * The Mexican hat (S13): the Scene3D builder of the Higgs lab.
 *
 * The surface is the formula. Its height is the node graph compileTSL builds from the Formula Core definition
 * higgs-potential (V / lambda v^4 = x^4/4 - s x^2/2, x = |phi| / v), evaluated per vertex on the GPU; the heat map is the same node
 * through the kit's field heat map, and the engraved grid is the kit's line coverage. s is one uniform: 1 is the Higgs phase and
 * -1 the symmetric phase, and the surface eases between them. The vacuum circle |phi| = v is an engraved focal ring, and the
 * radial and Goldstone directions are engraved arrows with KaTeX labels. The scene is static except while it eases.
 *
 * Runs on the WebGPU renderer and on the node renderer's WebGL2 backend (TSL node material, no GLSL).
 */

import { DoubleSide, MeshBasicNodeMaterial } from "three/webgpu";
import * as TSL from "three/tsl";
import { compileTSL } from "../../formula/to-tsl.mjs";
import { higgsPotentialReduced } from "../../formula/library/higgs.mjs";
import * as TK from "../../design/tokens.mjs";
import { fieldColorNode, lineCoverage, paletteTexture } from "../../render/materials/index.mjs";
import { tagLayer as tag } from "../../render/scene-layers.mjs";
import {
  HAT_UNIT, HAT_HEIGHT, HAT_RADIUS, PHYSICAL_PHASE, SYMMETRIC_PHASE, SHAFT_SAMPLES, HEAD_POINTS, hatHeight, makeArrow, ringPoints,
  radialArrow, goldstoneArrow, vacuumMarker, easePhase,
} from "./hat-geometry.mjs";

const { uniform, vec3, vec4, float, positionLocal, length, vec2, varying, max, mix } = TSL;

const HEAT_RANGE = [-0.25, 2.2]; // V / (lambda v^4): from the valley floor to the brim of the symmetric bowl
const GRID_STEP = 0.25; // grid lines every quarter of v
const GRID_WIDTH_PX = 1.1;
const HEAT_DIM = 0.55;
const GRID_GAIN = 0.8;
const MARKER_RADIUS = 0.13;
const ARROW_WIDTH_PX = 2.2;
const ARROW_LIFT = 0.04; // the arrows sit just above the surface so they are not z-fought away
const SEGMENTS = { low: [96, 40], standard: [160, 64], ultra: [224, 96] };

/** The hat material and its uniforms: s is the only thing that ever changes. */
export function createHatMaterial() {
  const uS = uniform(PHYSICAL_PHASE);
  const x = length(vec2(positionLocal.x, positionLocal.z)).div(HAT_UNIT);
  const { node: V } = compileTSL(higgsPotentialReduced.expr, TSL, { x, s: uS });
  const material = new MeshBasicNodeMaterial({ side: DoubleSide, fog: false });
  material.positionNode = vec3(positionLocal.x, V.mul(HAT_HEIGHT), positionLocal.z);

  const vPotential = varying(V, "hatPotential");
  const lut = paletteTexture({ range: [0, 1], palette: "sequential", paletteName: "viridis" });
  const heat = fieldColorNode(vPotential, HEAT_RANGE, lut);
  const cx = positionLocal.x.div(HAT_UNIT * GRID_STEP), cz = positionLocal.z.div(HAT_UNIT * GRID_STEP);
  const rings = length(vec2(positionLocal.x, positionLocal.z)).div(HAT_UNIT * GRID_STEP);
  const grid = max(max(lineCoverage(cx, GRID_WIDTH_PX), lineCoverage(cz, GRID_WIDTH_PX)), lineCoverage(rings, GRID_WIDTH_PX));
  material.colorNode = vec4(mix(heat.mul(HEAT_DIM), heat.mul(float(1)), grid.mul(GRID_GAIN)), 1);
  material.userData.qgaNodeKit = true;
  material.userData.kit = "sm-hat";
  material.userData.phaseUniform = uS; // QA hook: qa/specs/higgs-lab.spec.mjs reads the live phase from it
  return { material, uniforms: { s: uS }, lut };
}

function typeset(handle, tex, plain) {
  const katex = globalThis.katex;
  if (!katex) { handle.el.textContent = plain; return; }
  try { katex.render(tex, handle.el, { throwOnError: true }); } catch { handle.el.textContent = plain; }
}

/**
 * @param ctx   the Scene3D build context
 * @param env   { control: { symmetric }, vGeV } where control.symmetric (read every frame) selects the symmetric phase
 */
export async function buildMexicanHat(ctx, env) {
  const { THREE, scene } = ctx;
  const detail = ctx.settings.current.detail3d;
  const [thetaSegments, phiSegments] = SEGMENTS[detail] ?? SEGMENTS.standard;

  const geometry = new THREE.RingGeometry(0, HAT_RADIUS, thetaSegments, phiSegments);
  geometry.rotateX(-Math.PI / 2);
  const hat = createHatMaterial();
  const surface = new THREE.Mesh(geometry, hat.material);
  surface.frustumCulled = false; // the vertex stage moves the vertices: the bounding sphere of the flat ring is not the surface
  scene.add(tag(surface, "model"));

  // The vacuum circle: built once at the Higgs phase, then lifted with the surface.
  const ringBase = hatHeight(HAT_UNIT, PHYSICAL_PHASE);
  const ring = ctx.engraved.line(Float32Array.from(ringPoints(PHYSICAL_PHASE)), {
    color: "pigment-amber-80", widthPx: ctx.engraved.WIDTH_PX.focal, layer: "model",
  });
  scene.add(tag(ring, "model"));

  const style = (color) => ({ color, widthPx: ARROW_WIDTH_PX, layer: "model" });
  const radial = makeArrow(), goldstone = makeArrow();
  radialArrow(PHYSICAL_PHASE, radial);
  goldstoneArrow(PHYSICAL_PHASE, goldstone);
  const buffers = {
    radialShaft: Float32Array.from(radial.shaft), radialHead: Float32Array.from(radial.head),
    goldstoneShaft: Float32Array.from(goldstone.shaft), goldstoneHead: Float32Array.from(goldstone.head),
  };
  const lines = {
    radialShaft: ctx.engraved.line(buffers.radialShaft, style("pigment-red-76")),
    radialHead: ctx.engraved.line(buffers.radialHead, style("pigment-red-76")),
    goldstoneShaft: ctx.engraved.line(buffers.goldstoneShaft, style("pigment-cyan-78")),
    goldstoneHead: ctx.engraved.line(buffers.goldstoneHead, style("pigment-cyan-78")),
  };
  for (const line of Object.values(lines)) { line.position.y = ARROW_LIFT; scene.add(tag(line, "model")); }

  // The physical point, pinned at |phi| = v.
  const markerMaterial = new MeshBasicNodeMaterial({ color: TK.hex("pigment-amber-93-c07"), fog: false });
  markerMaterial.userData.qgaNodeKit = true;
  const marker = new THREE.Mesh(new THREE.SphereGeometry(MARKER_RADIUS, 20, 14), markerMaterial);
  scene.add(tag(marker, "data"));

  // Labels: status first, then the physics of each direction. Positions are mutated in place, never rebuilt.
  const tipRadial = { x: 0, y: 0, z: 0 }, tipGoldstone = { x: 0, y: 0, z: 0 }, pointAt = { x: 0, y: 0, z: 0 };
  const statusAt = { x: -4.4, y: 1.2, z: 0 };
  // s3d-lens-note carries the z-index that keeps a label above the opaque surface (the canvas paints over plain labels).
  ctx.label("ESTABLISHED · tree level", () => statusAt, "s3d-strong s3d-lens-note");
  const radialLabel = ctx.label("", () => tipRadial, "s3d-lens-note");
  const goldstoneLabel = ctx.label("", () => tipGoldstone, "s3d-lens-note");
  const vacuumLabel = ctx.label("", () => pointAt, "s3d-strong s3d-lens-note");
  typeset(radialLabel, "\\text{radial: } m_H^2 = 2\\lambda v^2", "radial: m_H^2 = 2 lambda v^2");
  typeset(goldstoneLabel, "\\text{Goldstone } m = 0", "Goldstone m = 0");
  typeset(vacuumLabel, "\\langle h\\rangle = v", "<h> = v");

  const targetPhase = () => (env.control.symmetric ? SYMMETRIC_PHASE : PHYSICAL_PHASE);
  let phase = targetPhase();
  let settled = false;
  const last = 3 * (SHAFT_SAMPLES - 1);

  const sync = (s) => {
    hat.uniforms.s.value = s;
    ring.position.y = hatHeight(HAT_UNIT, s) - ringBase;
    radialArrow(s, radial);
    goldstoneArrow(s, goldstone);
    buffers.radialShaft.set(radial.shaft); buffers.radialHead.set(radial.head);
    buffers.goldstoneShaft.set(goldstone.shaft); buffers.goldstoneHead.set(goldstone.head);
    ctx.engraved.setPoints(lines.radialShaft, buffers.radialShaft, SHAFT_SAMPLES);
    ctx.engraved.setPoints(lines.radialHead, buffers.radialHead, HEAD_POINTS);
    ctx.engraved.setPoints(lines.goldstoneShaft, buffers.goldstoneShaft, SHAFT_SAMPLES);
    ctx.engraved.setPoints(lines.goldstoneHead, buffers.goldstoneHead, HEAD_POINTS);
    const m = vacuumMarker(s);
    marker.position.set(m[0], m[1], m[2]);
    // The camera looks along +X, so +Z is screen right: the vacuum label sits left of the point, the radial label above its arrow
    // and the Goldstone label right of its arc.
    pointAt.x = m[0] - 0.4; pointAt.y = m[1] + 1.3; pointAt.z = m[2] - 3.0;
    tipRadial.x = radial.shaft[last]; tipRadial.y = radial.shaft[last + 1] + 0.9; tipRadial.z = radial.shaft[last + 2];
    tipGoldstone.x = goldstone.shaft[last] + 0.4; tipGoldstone.y = goldstone.shaft[last + 1] + 1.6; tipGoldstone.z = goldstone.shaft[last + 2] + 1.4;
  };
  sync(phase);

  return {
    autoRotate: false,
    isAnimated: () => !settled,
    update: (t, dt) => {
      const target = targetPhase();
      const next = easePhase(phase, target, dt, { motion: ctx.motion() });
      settled = next === target;
      if (next !== phase) { phase = next; sync(phase); }
    },
    dispose: () => {
      geometry.dispose(); hat.material.dispose(); hat.lut.dispose(); markerMaterial.dispose(); marker.geometry.dispose();
    },
    // QA hook: the live phase and the physical point, read by qa/specs/higgs-lab.spec.mjs.
    state: () => ({ phase, target: targetPhase(), marker: [marker.position.x, marker.position.y, marker.position.z], settled }),
  };
}
