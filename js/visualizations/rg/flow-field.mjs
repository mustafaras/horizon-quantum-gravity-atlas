/**
 * 3-D RG flow field — Scene3D runtime (Prompt 07, premium rendering).
 *
 * Theory space rendered in three dimensions: x = coupling g, y = t = ln μ
 * (UV up, IR down), z = mass-like coupling r. Streamlines come from the
 * deterministic seeding in js/science/rg-flow-3d.mjs and carry flowing
 * glow-particles (cyan toward the UV, amber toward the IR); separatrices are
 * glowing gold tubes; fixed points pulse as wireframe icosahedra inside glow
 * halos; translucent gradient planes mark the perturbative-validity boundary
 * g = ±sqrt(4π) where streamlines visibly terminate. UV/IR direction is
 * indicated by cones on the axis.
 *
 * The r-direction anomalous dimension is a disclosed teaching model
 * (RG_FLOW_3D_PROVENANCE); the caller labels it in-canvas.
 */

import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CatmullRomCurve3, Color,
  ConeGeometry, GridHelper, Group, IcosahedronGeometry, Line, LineBasicMaterial,
  Mesh, MeshBasicMaterial, PlaneGeometry, Points, PointsMaterial,
  Sprite, SpriteMaterial, TubeGeometry, Vector3,
} from "three";
import {
  seedStreamlines3d, separatrixCurves3d, rgFlow3dFixedPoints,
  RG_FLOW_3D_DEFAULTS, RG_VALIDITY_G,
} from "../../science/rg-flow-3d.mjs";
import { sharedGlowTexture, wallGradientTexture } from "../glow-texture.mjs";

const SCALE = { x: 1.5, y: 1.1, z: 1.5 }; // scene units per (g, t, r)
const UV_COLOR = new Color(0.45, 0.8, 1.0);
const IR_COLOR = new Color(1.0, 0.68, 0.32);
const PARTICLES_PER_RUN = 5;

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

  // ---- dim reference grid at the IR floor ----
  {
    const grid = track(new GridHelper(16, 16, 0x24406b, 0x182c49));
    grid.material.transparent = true;
    grid.material.opacity = 0.22;
    grid.material.depthWrite = false;
    grid.position.y = (RG_FLOW_3D_DEFAULTS.tMin - 0.6) * SCALE.y;
    group.add(grid);
  }

  // ---- streamlines (color: UV run cyan, IR run amber) + arc-length tables ----
  const runs = [];
  for (const run of streamlines) {
    if (run.points.length < 2) continue;
    const pts = run.points.map(toScene);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    runs.push({ pts, cum, total: cum[cum.length - 1], dir: run.seed.direction >= 0 ? 1 : -1 });
    const geo = track(new BufferGeometry().setFromPoints(pts));
    const mat = track(new LineBasicMaterial({
      color: run.seed.direction >= 0 ? UV_COLOR : IR_COLOR,
      transparent: true, opacity: 0.34, blending: AdditiveBlending, depthWrite: false,
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

  // ---- flowing particles: one Points cloud over all streamlines ----
  const flow = { pos: null, col: null, geo: null, items: [] };
  {
    for (const [ri, run] of runs.entries()) {
      for (let k = 0; k < PARTICLES_PER_RUN; k++) {
        flow.items.push({ run: ri, offset: (k + (ri % 3) * 0.17) / PARTICLES_PER_RUN });
      }
    }
    flow.pos = new Float32Array(flow.items.length * 3);
    flow.col = new Float32Array(flow.items.length * 3);
    flow.geo = track(new BufferGeometry());
    flow.geo.setAttribute("position", new BufferAttribute(flow.pos, 3));
    flow.geo.setAttribute("color", new BufferAttribute(flow.col, 3));
    const mat = track(new PointsMaterial({
      size: 0.16, sizeAttenuation: true, map: sharedGlowTexture(), vertexColors: true,
      transparent: true, opacity: 0.95, depthWrite: false, blending: AdditiveBlending,
    }));
    const cloud = new Points(flow.geo, mat);
    cloud.frustumCulled = false;
    group.add(cloud);
  }
  const tmpColor = new Color();
  function sampleRun(run, u) {
    const target = u * run.total;
    let lo = 0, hi = run.cum.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (run.cum[mid] <= target) lo = mid; else hi = mid;
    }
    const seg = run.cum[hi] - run.cum[lo] || 1;
    const f = (target - run.cum[lo]) / seg;
    return run.pts[lo].clone().lerp(run.pts[hi], f);
  }
  function updateFlow(time, motion) {
    for (let i = 0; i < flow.items.length; i++) {
      const it = flow.items[i];
      const run = runs[it.run];
      const u = motion === 0
        ? (it.offset + 0.35) % 1
        : (it.offset + time * 0.055) % 1;
      const p = sampleRun(run, u);
      flow.pos[i * 3] = p.x; flow.pos[i * 3 + 1] = p.y; flow.pos[i * 3 + 2] = p.z;
      // brighten mid-run, fade at both ends so particles appear/disappear smoothly
      const a = Math.sin(u * Math.PI);
      tmpColor.copy(run.dir === 1 ? UV_COLOR : IR_COLOR).multiplyScalar(0.35 + 0.85 * a);
      flow.col[i * 3] = tmpColor.r; flow.col[i * 3 + 1] = tmpColor.g; flow.col[i * 3 + 2] = tmpColor.b;
    }
    flow.geo.attributes.position.needsUpdate = true;
    flow.geo.attributes.color.needsUpdate = true;
  }
  updateFlow(0, 0);

  // ---- separatrices: glowing gold tubes (core + halo) ----
  for (const curve of separatrices) {
    if (curve.points.length < 2) continue;
    const path = new CatmullRomCurve3(curve.points.map(toScene));
    const coreGeo = track(new TubeGeometry(path, 96, 0.028, 6, false));
    const coreMat = track(new MeshBasicMaterial({
      color: 0xffd27a, transparent: true, opacity: 0.95,
      blending: AdditiveBlending, depthWrite: false,
    }));
    group.add(new Mesh(coreGeo, coreMat));
    const haloGeo = track(new TubeGeometry(path, 96, 0.09, 6, false));
    const haloMat = track(new MeshBasicMaterial({
      color: 0xffb060, transparent: true, opacity: 0.14,
      blending: AdditiveBlending, depthWrite: false,
    }));
    group.add(new Mesh(haloGeo, haloMat));
  }

  // ---- fixed points: pulsing wireframe icosahedron inside a glow halo ----
  const fpMarkers = [];
  for (const fp of fixedPoints) {
    const pos = toScene({ g: fp.g, r: fp.r, t: 0 });
    const geo = track(new IcosahedronGeometry(0.17, 1));
    const mat = track(new MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.9 }));
    const marker = new Mesh(geo, mat);
    marker.position.copy(pos);
    group.add(marker);
    const haloMat = track(new SpriteMaterial({
      map: sharedGlowTexture(), color: 0xffffff, transparent: true,
      opacity: 0.75, blending: AdditiveBlending, depthWrite: false,
    }));
    const halo = new Sprite(haloMat);
    halo.scale.setScalar(1.15);
    halo.position.copy(pos);
    group.add(halo);
    fpMarkers.push({ marker, halo, fp });
  }

  // ---- validity boundary walls at g = ±sqrt(4π): gradient planes + edge glow ----
  {
    const h = (RG_FLOW_3D_DEFAULTS.tMax - RG_FLOW_3D_DEFAULTS.tMin + 2) * SCALE.y;
    const zSpan = RG_FLOW_3D_DEFAULTS.rSpan * 2.4 * SCALE.z;
    const wallTex = track(wallGradientTexture());
    for (const sign of [-1, 1]) {
      const planeGeo = track(new PlaneGeometry(zSpan, h));
      const planeMat = track(new MeshBasicMaterial({
        map: wallTex, color: 0xff5a5a, transparent: true, opacity: 0.5,
        side: 2, depthWrite: false,
      }));
      const plane = new Mesh(planeGeo, planeMat);
      plane.position.set(sign * RG_VALIDITY_G * SCALE.x, ((RG_FLOW_3D_DEFAULTS.tMax + RG_FLOW_3D_DEFAULTS.tMin) / 2) * SCALE.y, 0);
      plane.rotation.y = Math.PI / 2;
      group.add(plane);
      const edgePts = [
        new Vector3(sign * RG_VALIDITY_G * SCALE.x, plane.position.y - h / 2, -zSpan / 2),
        new Vector3(sign * RG_VALIDITY_G * SCALE.x, plane.position.y + h / 2, -zSpan / 2),
        new Vector3(sign * RG_VALIDITY_G * SCALE.x, plane.position.y + h / 2, zSpan / 2),
        new Vector3(sign * RG_VALIDITY_G * SCALE.x, plane.position.y - h / 2, zSpan / 2),
      ];
      // explicit segment pairs: the WebGPU renderer does not draw LineLoop
      const loopPts = [...edgePts, edgePts[0]];
      const edgeGeo = track(new BufferGeometry().setFromPoints(loopPts));
      const edgeMat = track(new LineBasicMaterial({
        color: 0xff6a5a, transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false,
      }));
      group.add(new Line(edgeGeo, edgeMat));
    }
  }

  // ---- UV/IR axis cones with glow tips ----
  {
    const axisX = 0;
    const mk = (y, color, flip) => {
      const geo = track(new ConeGeometry(0.16, 0.5, 12));
      const mat = track(new MeshBasicMaterial({ color, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false }));
      const cone = new Mesh(geo, mat);
      cone.position.set(axisX, y, 0);
      if (flip) cone.rotation.x = Math.PI;
      group.add(cone);
      const tipMat = track(new SpriteMaterial({
        map: sharedGlowTexture(), color, transparent: true, opacity: 0.7,
        blending: AdditiveBlending, depthWrite: false,
      }));
      const tip = new Sprite(tipMat);
      tip.scale.setScalar(0.9);
      tip.position.set(axisX, y + (flip ? -0.35 : 0.35), 0);
      group.add(tip);
    };
    mk((RG_FLOW_3D_DEFAULTS.tMax + 1.4) * SCALE.y, 0x7ec8ff, false); // UV up
    mk((RG_FLOW_3D_DEFAULTS.tMin - 1.4) * SCALE.y, 0xffb066, true);  // IR down
  }

  function sync({ time = 0, motion = 1 } = {}) {
    const clock = Number(time) || 0;
    const pulse = 1 + 0.12 * Math.sin(clock * 2.2) * motion;
    for (const { marker, halo } of fpMarkers) {
      marker.scale.setScalar(pulse);
      halo.scale.setScalar(1.15 * (1 + 0.1 * Math.sin(clock * 2.2 + 0.6) * motion));
    }
    updateFlow(clock, motion);
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
      flowParticles: flow.items.length,
      terminatedAtValidity: streamlines.filter((r) => r.terminated === "validity-boundary").length,
      model: String(model),
    }),
    sync,
    dispose,
    recoverable: () => false,
  };
}
