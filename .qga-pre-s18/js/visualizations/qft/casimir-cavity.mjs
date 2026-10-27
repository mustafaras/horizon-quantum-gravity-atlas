/**
 * The Casimir cavity (S15): the Scene3D builder of the cavity lab.
 *
 * Two thin plates (boxes whose faces carry the kit's engraved grid) stand a drawn gap apart. Between them the first eight standing
 * modes of a one-dimensional field are engraved sinusoids that vanish at the plates, amplitude 1/sqrt(n); outside, the same lines at
 * three times the density and 30 per cent opacity stand for the continuum. The geometry is casimir-geometry.mjs. The pressure of the
 * Formula Core expression casimir-plates-pressure is typeset in the scene, and the Formula Lens binds a to the gap and hbar, c to
 * that readout.
 *
 * The scene is static: it draws when the slider (control.gap, metres) changes and not otherwise. It is a schematic and says so in-canvas.
 * Runs on the WebGPU renderer and on the node renderer's WebGL2 backend (node materials, no GLSL).
 */

import { DoubleSide, MeshBasicNodeMaterial } from "three/webgpu";
import { engravedGridMaterial } from "../../render/materials/index.mjs";
import * as TK from "../../design/tokens.mjs";
import { tagLayer as tag } from "../../render/scene-layers.mjs";
import { typesetLabel as typeset } from "../common/katex-label.mjs";
import { idealPressure } from "../../science/casimir.mjs";
import {
  MODE_COUNT, PLATE, drawnGap, plateCenters, modeLevel, insideSegments, outsideSegments, insideLength, outsideLength, pressureTex,
} from "./casimir-geometry.mjs";

const PLATE_COLOR = "surface-2";
const EDGE_COLOR = "ink-dim";
const GRID_COLOR = "ink-faint";
const MODE_COLOR = "pigment-cyan-78";
const CONTINUUM_COLOR = "ink-strong";
const CONTINUUM_OPACITY = 0.3; // "the same lines at 30 % ink"
const GRID_STEP = 0.45;
const FACE_LIFT = 0.004; // the grid planes sit just off the box faces so they are not z-fought away
// Label heights above or below the plates, in scene units: a label is about 2.4 units tall on a 390 px stage, so these keep them apart
const STATUS_CLEARANCE = 1.5; // the status label above the plates
const READOUT_CLEARANCE = 2.3; // the pressure readout below the plates, clear of the n = 8 label
const MARK_DROP = 1.9; // the hbar c mark below the readout

/** The 12 edges of a box centred on the origin, as segment pairs. */
function boxEdges(w, h, d) {
  const x = w / 2, y = h / 2, z = d / 2;
  const c = [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]];
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  return Float32Array.from(edges.flatMap(([a, b]) => [...c[a], ...c[b]]));
}

/** The unit-width rectangle of the gap in the xy plane, as a closed polyline: a group scaled along x by the drawn gap makes it span the gap. */
function gapOutline() {
  const y = PLATE.height / 2;
  return Float32Array.from([-0.5, -y, 0, 0.5, -y, 0, 0.5, y, 0, -0.5, y, 0, -0.5, -y, 0]);
}

/** One plate: a box, an engraved grid on each of its two large faces, and its edges. `owned` collects what dispose must release. */
function buildPlate(ctx, owned) {
  const { THREE } = ctx;
  const group = new THREE.Group();
  const body = new MeshBasicNodeMaterial({ color: TK.hex(PLATE_COLOR), fog: false });
  body.userData.qgaNodeKit = true;
  const geometry = new THREE.BoxGeometry(PLATE.thickness, PLATE.height, PLATE.depth);
  group.add(tag(new THREE.Mesh(geometry, body), "model"));
  owned.push(geometry, body);

  const faceGeometry = new THREE.PlaneGeometry(PLATE.depth, PLATE.height);
  owned.push(faceGeometry);
  for (const face of [-1, 1]) { // -1: the face looking along -x, +1: along +x
    const material = engravedGridMaterial({ space: "local-xy", minor: GRID_STEP, majorEvery: 0, color: GRID_COLOR, widthPx: ctx.engraved.WIDTH_PX.hairline });
    material.side = DoubleSide;
    owned.push(material);
    const plane = new THREE.Mesh(faceGeometry, material);
    plane.rotation.y = face * (Math.PI / 2);
    plane.position.x = face * (PLATE.thickness / 2 + FACE_LIFT);
    group.add(tag(plane, "decoration"));
  }
  group.add(tag(ctx.engraved.segments(boxEdges(PLATE.thickness, PLATE.height, PLATE.depth), {
    color: EDGE_COLOR, widthPx: ctx.engraved.WIDTH_PX.hairline, layer: "decoration",
  }), "decoration"));
  return group;
}

/**
 * @param ctx   the Scene3D build context
 * @param env   { control: { gap } } where control.gap (metres, read when the scene draws) is the plate separation
 */
export async function buildCasimirCavity(ctx, env) {
  const { THREE, scene } = ctx;
  const { control } = env;
  const owned = [];

  const left = buildPlate(ctx, owned), right = buildPlate(ctx, owned);
  scene.add(left, right);

  const inside = new Float32Array(insideLength()), outside = new Float32Array(outsideLength());
  const drawn0 = drawnGap(control.gap);
  insideSegments(drawn0, inside);
  outsideSegments(drawn0, outside);
  const modes = ctx.engraved.segments(inside, { color: MODE_COLOR, widthPx: ctx.engraved.WIDTH_PX.standard, layer: "model" });
  const continuum = ctx.engraved.segments(outside, {
    color: CONTINUUM_COLOR, opacity: CONTINUUM_OPACITY, widthPx: ctx.engraved.WIDTH_PX.hairline, layer: "model",
  });
  modes.frustumCulled = false; continuum.frustumCulled = false; // the points move with the slider; the first bounding sphere would be stale
  scene.add(tag(modes, "model"), tag(continuum, "model"));

  const gapGroup = new THREE.Group();
  gapGroup.name = "gap";
  scene.add(gapGroup);

  const at = { drawn: drawn0, gap: control.gap, bottom: { x: 0, y: 0, z: 0 }, first: { x: 0, y: 0, z: 0 }, last: { x: 0, y: 0, z: 0 }, note: { x: 0, y: 0, z: 0 }, mark: { x: 0, y: 0, z: 0 } };
  const halfHeight = PLATE.height / 2;
  ctx.label("SCHEMATIC · 1+1D modes", () => ({ x: 0, y: halfHeight + STATUS_CLEARANCE, z: 0 }), "s3d-strong s3d-lens-note");
  const readout = ctx.label("", () => at.bottom, "s3d-strong s3d-lens-note");
  // hbar and c of the Formula Lens point at the readout, which stays visible: this mark is what they show and hide
  const readoutMark = ctx.label("", () => at.mark, "s3d-lens-note");
  typeset(readoutMark, "P\\propto\\hbar c", "P ~ hbar c");
  const firstLabel = ctx.label("", () => at.first, "s3d-lens-note");
  const lastLabel = ctx.label("", () => at.last, "s3d-lens-note");
  typeset(firstLabel, "n=1", "n = 1");
  typeset(lastLabel, `n=${MODE_COUNT}`, `n = ${MODE_COUNT}`);

  const sync = (gap) => {
    const drawn = drawnGap(gap);
    const { left: x0, right: x1 } = plateCenters(drawn);
    left.position.x = x0; right.position.x = x1;
    insideSegments(drawn, inside); outsideSegments(drawn, outside);
    ctx.engraved.update(modes, inside); ctx.engraved.update(continuum, outside);
    gapGroup.scale.x = drawn;
    at.drawn = drawn; at.gap = gap;
    at.bottom.y = -halfHeight - READOUT_CLEARANCE;
    at.mark.y = at.bottom.y - MARK_DROP;
    at.note.y = -halfHeight - 0.2;
    at.first.x = at.last.x = -drawn / 2 + 1.1;
    at.first.y = modeLevel(1) + 0.5; at.last.y = modeLevel(MODE_COUNT) - 0.5;
    typeset(readout, pressureTex(idealPressure(gap)), `P = ${idealPressure(gap).toExponential(2)} Pa`);
  };
  sync(control.gap);

  const { attachLens } = await import("../common/lens-scenes.mjs");
  await attachLens("casimir-cavity", ctx, { gapGroup, outline: gapOutline(), readout: readoutMark, gap: () => at.gap, notePosition: () => at.note });

  return {
    autoRotate: false,
    isAnimated: () => false,
    update: () => { if (control.gap !== at.gap) sync(control.gap); },
    dispose: () => { owned.forEach((item) => item.dispose()); modes.geometry.dispose(); continuum.geometry.dispose(); },
    // QA hook: the live gap and where the plates stand, read by qa/specs/casimir-lab.spec.mjs.
    state: () => ({ gap: at.gap, drawn: at.drawn, plates: [left.position.x, right.position.x] }),
  };
}
