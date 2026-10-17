/**
 * 3-D RG flow field — Scene3D runtime (Prompt 07).
 *
 * Theory space rendered in three dimensions: x = coupling g, y = t = ln μ
 * (UV up, IR down), z = mass-like coupling r. Streamlines come from the
 * deterministic seeding in js/science/rg-flow-3d.mjs; fixed points get
 * wireframe markers, separatrices are drawn in gold, and translucent planes
 * mark the perturbative-validity boundary g = ±sqrt(4π) where streamlines
 * visibly terminate. UV/IR direction is indicated by cones on the axis.
 *
 * The r-direction anomalous dimension is a disclosed teaching model
 * (RG_FLOW_3D_PROVENANCE); the caller labels it in-canvas.
 */

import {
  AdditiveBlending, BufferGeometry, Color, ConeGeometry,
  Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, PlaneGeometry,
  Vector3, SphereGeometry,
} from "three";
import {
  seedStreamlines3d, separatrixCurves3d, rgFlow3dFixedPoints,
  RG_FLOW_3D_DEFAULTS, RG_VALIDITY_G,
} from "../../science/rg-flow-3d.mjs";

const SCALE = { x: 1.5, y: 1.1, z: 1.5 }; // scene units per (g, t, r)

function toScene(p) {
  const t = Math.max(RG_FLOW_3D_DEFAULTS.tMin - 2, Math.min(RG_FLOW_3D_DEFAULTS.tMax + 2, p.t));
  return new Vector3(p.g * SCALE.x, t * SCALE.y, p.r * SCALE.z);
}

export function createRgFlowFieldRuntime({
  model = "qcd", params = {}, seed = 42,
  count = RG_FLOW_3D_DEFAULTS.streamlines,
} = {}) {
  const group = new Group();
  group.name = "rg-flow-field-3d";
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };

  const streamlines = seedStreamlines3d({ model, params, seed, count });
  const separatrices = separatrixCurves3d({ model, params });
  const fixedPoints = rgFlow3dFixedPoints(model, params);

  // ---- streamlines (color: UV run cyan, IR run amber) ----
  const UV_COLOR = new Color(0.45, 0.8, 1.0);
  const IR_COLOR = new Color(1.0, 0.68, 0.32);
  for (const run of streamlines) {
    if (run.points.length < 2) continue;
    const pts = run.points.map(toScene);
    const geo = track(new BufferGeometry().setFromPoints(pts));
    const mat = track(new LineBasicMaterial({
      color: run.seed.direction >= 0 ? UV_COLOR : IR_COLOR,
      transparent: true, opacity: 0.42, blending: AdditiveBlending, depthWrite: false,
    }));
    group.add(new Line(geo, mat));
    // arrowhead at the running end
    const end = pts[pts.length - 1];
    const prev = pts[Math.max(0, pts.length - 3)];
    const dir = end.clone().sub(prev).normalize();
    const coneGeo = track(new ConeGeometry(0.05, 0.16, 6));
    const coneMat = track(new MeshBasicMaterial({
      color: run.seed.direction >= 0 ? UV_COLOR : IR_COLOR,
      transparent: true, opacity: 0.7, blending: AdditiveBlending, depthWrite: false,
    }));
    const cone = new Mesh(coneGeo, coneMat);
    cone.position.copy(end);
    cone.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir);
    group.add(cone);
  }

  // ---- separatrices in gold ----
  for (const curve of separatrices) {
    if (curve.points.length < 2) continue;
    const geo = track(new BufferGeometry().setFromPoints(curve.points.map(toScene)));
    const mat = track(new LineBasicMaterial({
      color: 0xffd27a, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false,
    }));
    group.add(new Line(geo, mat));
  }

  // ---- fixed-point markers ----
  const fpMarkers = [];
  for (const fp of fixedPoints) {
    const geo = track(new SphereGeometry(0.14, 12, 10));
    const mat = track(new MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.9 }));
    const marker = new Mesh(geo, mat);
    marker.position.copy(toScene({ g: fp.g, r: fp.r, t: 0 }));
    group.add(marker);
    fpMarkers.push({ marker, fp });
  }

  // ---- validity boundary planes at g = ±sqrt(4π) ----
  for (const sign of [-1, 1]) {
    const planeGeo = track(new PlaneGeometry(0.04, (RG_FLOW_3D_DEFAULTS.tMax - RG_FLOW_3D_DEFAULTS.tMin + 2) * SCALE.y));
    const planeMat = track(new MeshBasicMaterial({
      color: 0xff5a5a, transparent: true, opacity: 0.1, side: 2, depthWrite: false,
    }));
    const plane = new Mesh(planeGeo, planeMat);
    plane.position.set(sign * RG_VALIDITY_G * SCALE.x, ((RG_FLOW_3D_DEFAULTS.tMax + RG_FLOW_3D_DEFAULTS.tMin) / 2) * SCALE.y, 0);
    plane.rotation.y = Math.PI / 2;
    group.add(plane);
  }

  // ---- UV/IR axis cones ----
  {
    const axisX = 0;
    const mk = (y, color, flip) => {
      const geo = track(new ConeGeometry(0.16, 0.5, 12));
      const mat = track(new MeshBasicMaterial({ color, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false }));
      const cone = new Mesh(geo, mat);
      cone.position.set(axisX, y, 0);
      if (flip) cone.rotation.x = Math.PI;
      group.add(cone);
    };
    mk((RG_FLOW_3D_DEFAULTS.tMax + 1.4) * SCALE.y, 0x7ec8ff, false); // UV up
    mk((RG_FLOW_3D_DEFAULTS.tMin - 1.4) * SCALE.y, 0xffb066, true);  // IR down
  }

  let clock = 0;
  function sync({ time = 0, motion = 1 } = {}) {
    clock = Number(time) || 0;
    const pulse = 1 + 0.12 * Math.sin(clock * 2.2) * motion;
    for (const { marker } of fpMarkers) marker.scale.setScalar(pulse);
  }

  function dispose() {
    for (const d of disposables) d.dispose?.();
    group.removeFromParent?.();
  }

  return {
    mesh: group,
    kind: "cpu-samples",
    stats: () => ({
      kind: "cpu-samples",
      streamlines: streamlines.filter((r) => r.points.length > 1).length,
      separatrices: separatrices.filter((r) => r.points.length > 1).length,
      fixedPoints: fixedPoints.length,
      terminatedAtValidity: streamlines.filter((r) => r.terminated === "validity-boundary").length,
      model: String(model),
    }),
    sync,
    dispose,
    recoverable: () => false,
  };
}
