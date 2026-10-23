// The TSL material kit (S07): node materials that encode the art direction and the physics.
//
// Every kit material is flagged `userData.qgaNodeKit`, which tells the renderer factory (create-renderer.mjs) that the scene
// needs the node renderer (WebGPU, or its WebGL2 backend) and has no classic fallback.

import { Mesh, PlaneGeometry, Scene } from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { positionLocal, vec4 } from "three/tsl";
import * as blackbody from "./blackbody.mjs";
import * as engravedGrid from "./engraved-grid.mjs";
import * as fieldHeatmap from "./field-heatmap.mjs";
import * as dataPoints from "./data-points.mjs";

export const KIT_MODULES = Object.freeze({ blackbody, engravedGrid, fieldHeatmap, dataPoints });

export {
  BLACKBODY_LUT_DEFAULTS, blackbodyEmission, blackbodyLUT, blackbodyLutCoordinate, blackbodyLutData, blackbodyLutTemperature, normalizeBlackbodyOptions,
} from "./blackbody.mjs";
export { GRID_SPACES, GRID_WIDTH_PX, engravedGridCoverage, engravedGridMaterial, engravedGridNodes, lineCoverage, normalizeGridOptions } from "./engraved-grid.mjs";
export {
  FIELD_PALETTE_SIZE, contourNode, fieldColorNode, fieldMaterial, normalizeFieldOptions, paletteLutData, paletteTexture,
} from "./field-heatmap.mjs";
export { DATA_POINT_PROFILES, createDataPoints, normalizeDataPointOptions } from "./data-points.mjs";

/** The shader variants the kit contributes, as one stable string: the prewarm cache key (js/render/shader-prewarm.mjs). */
export function kitPrewarmSignature() {
  return Object.values(KIT_MODULES).map((module) => module.prewarmSignature()).sort().join("|");
}

/** A scene with one object per canonical kit shader variant; compiling it warms the kit once per renderer. */
export function createKitProbeScene() {
  const scene = new Scene();
  const plane = new PlaneGeometry(1, 1);
  scene.add(engravedGrid.prewarmProbe(Mesh, plane));
  scene.add(new Mesh(plane, fieldHeatmap.fieldMaterial({ valueNode: positionLocal.x, range: [-1, 1] })));
  const emission = new MeshBasicNodeMaterial({ fog: false });
  emission.colorNode = vec4(blackbody.blackbodyEmission(positionLocal.x.mul(5000).add(6000), 1), 1);
  emission.userData.qgaNodeKit = true;
  scene.add(new Mesh(plane, emission));
  const points = dataPoints.createDataPoints({ positions: new Float32Array([0, 0, 0]), sizePx: 4 });
  scene.add(points.object);
  scene.userData.dispose = () => {
    plane.dispose();
    scene.traverse((object) => { object.material?.dispose?.(); });
  };
  return scene;
}
