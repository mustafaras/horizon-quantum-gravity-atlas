/**
 * 3-D RG flow field — Scene3D runtime (Prompt 07, premium rendering).
 *
 * Theory space rendered in three dimensions: x = coupling g, y = t = ln μ
 * (UV up, IR down), z = mass-like coupling r. Streamlines come from the
 * deterministic seeding in js/science/rg-flow-3d.mjs and carry flowing
 * glow-particles, a GPU particle system (cyan toward the UV, amber toward the IR); separatrices are
 * glowing gold tubes; fixed points pulse as wireframe icosahedra inside glow
 * halos; translucent gradient planes mark the perturbative-validity boundary
 * g = ±sqrt(4π) where streamlines visibly terminate. UV/IR direction is
 * indicated by cones on the axis.
 *
 * The r-direction anomalous dimension is a disclosed teaching model
 * (RG_FLOW_3D_PROVENANCE); the caller labels it in-canvas.
 */

import {
  AdditiveBlending, CatmullRomCurve3, Color,
  ConeGeometry, Group, IcosahedronGeometry,
  Mesh, MeshBasicMaterial, PlaneGeometry,
  Sprite, SpriteMaterial, TubeGeometry, Vector3,
} from "three";
import { createFlowTracers } from "./flow-tracers.mjs";
import {
  seedStreamlines3d, separatrixCurves3d, rgFlow3dFixedPoints,
  RG_FLOW_3D_DEFAULTS, RG_VALIDITY_G,
} from "../../science/rg-flow-3d.mjs";
import { sharedGlowTexture, wallGradientTexture } from "../glow-texture.mjs";
import * as TK from "../../design/tokens.mjs";
import { tagLayer as tag } from "../../render/scene-layers.mjs";

const tokenColor = (name) => new Color().fromArray(TK.linearRef(name));

const SCALE = { x: 1.5, y: 1.1, z: 1.5 }; // scene units per (g, t, r)
const PARTICLES_PER_RUN = 5;

function toScene(p) {
  const t = Math.max(RG_FLOW_3D_DEFAULTS.tMin - 2, Math.min(RG_FLOW_3D_DEFAULTS.tMax + 2, p.t));
  return new Vector3(p.g * SCALE.x, t * SCALE.y, p.r * SCALE.z);
}

export function createRgFlowFieldRuntime({
  model = "qcd", params = {}, seed = 42,
  count = RG_FLOW_3D_DEFAULTS.streamlines, engraved,
} = {}) {
  if (!engraved) throw new TypeError("createRgFlowFieldRuntime needs ctx.engraved (the scene's engraved line API)");
  const group = new Group();
  group.name = "rg-flow-field-3d";
  const UV_COLOR = tokenColor("rg-flow-uv");
  const IR_COLOR = tokenColor("rg-flow-ir");
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };
  const trackLine = (line) => { track(line.geometry); track(line.material); return line; };

  const streamlines = seedStreamlines3d({ model, params, seed, count });
  const separatrices = separatrixCurves3d({ model, params });
  const fixedPoints = rgFlow3dFixedPoints(model, params);

  // ---- dim reference grid at the IR floor ----
  {
    const grid = trackLine(engraved.grid(16, 16, {
      color: "pigment-blue-29", centerColor: "pigment-blue-37", opacity: 0.22, widthPx: engraved.WIDTH_PX.hairline, layer: "decoration",
    }));
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
    group.add(trackLine(engraved.line(pts, {
      color: run.seed.direction >= 0 ? UV_COLOR : IR_COLOR, opacity: 0.34, additive: true,
      widthPx: engraved.WIDTH_PX.hairline, layer: "model",
    })));
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
    group.add(tag(cone, "model"));
  }

  // ---- flowing tracers: one GPU particle system over all streamlines (S08) ----
  // The streamlines are resampled once into a table; the kernel walks each tracer along its run from the clock uniform, so nothing is
  // rewritten or uploaded per frame (flow-tracers.mjs).
  const tracers = createFlowTracers({ runs, uvColor: UV_COLOR, irColor: IR_COLOR });
  tracers.object.visible = tracers.tracers > 0;
  group.add(tag(tracers.object, "model"));

  // ---- separatrices: glowing gold tubes (core + halo) ----
  for (const curve of separatrices) {
    if (curve.points.length < 2) continue;
    const path = new CatmullRomCurve3(curve.points.map(toScene));
    const coreGeo = track(new TubeGeometry(path, 96, 0.028, 6, false));
    const coreMat = track(new MeshBasicMaterial({
      color: TK.hex("pigment-amber-88-c12-h083"), transparent: true, opacity: 0.95,
      blending: AdditiveBlending, depthWrite: false,
    }));
    group.add(tag(new Mesh(coreGeo, coreMat), "model"));
    const haloGeo = track(new TubeGeometry(path, 96, 0.09, 6, false));
    const haloMat = track(new MeshBasicMaterial({
      color: TK.hex("pigment-orange-82-c13-h064"), transparent: true, opacity: 0.14,
      blending: AdditiveBlending, depthWrite: false,
    }));
    group.add(tag(new Mesh(haloGeo, haloMat), "decoration"));
  }

  // ---- fixed points: pulsing wireframe icosahedron inside a glow halo ----
  const fpMarkers = [];
  for (const fp of fixedPoints) {
    const pos = toScene({ g: fp.g, r: fp.r, t: 0 });
    const geo = track(new IcosahedronGeometry(0.17, 1));
    const mat = track(new MeshBasicMaterial({ color: TK.hex("pigment-white"), wireframe: true, transparent: true, opacity: 0.9 }));
    const marker = new Mesh(geo, mat);
    marker.position.copy(pos);
    group.add(tag(marker, "model"));
    const haloMat = track(new SpriteMaterial({
      map: sharedGlowTexture(), color: TK.hex("pigment-white"), transparent: true,
      opacity: 0.75, blending: AdditiveBlending, depthWrite: false,
    }));
    const halo = new Sprite(haloMat);
    halo.scale.setScalar(1.15);
    halo.position.copy(pos);
    group.add(tag(halo, "decoration"));
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
        map: wallTex, color: TK.hex("pigment-red-69"), transparent: true, opacity: 0.5,
        side: 2, depthWrite: false,
      }));
      const plane = new Mesh(planeGeo, planeMat);
      plane.position.set(sign * RG_VALIDITY_G * SCALE.x, ((RG_FLOW_3D_DEFAULTS.tMax + RG_FLOW_3D_DEFAULTS.tMin) / 2) * SCALE.y, 0);
      plane.rotation.y = Math.PI / 2;
      group.add(tag(plane, "model"));
      const edgePts = [
        new Vector3(sign * RG_VALIDITY_G * SCALE.x, plane.position.y - h / 2, -zSpan / 2),
        new Vector3(sign * RG_VALIDITY_G * SCALE.x, plane.position.y + h / 2, -zSpan / 2),
        new Vector3(sign * RG_VALIDITY_G * SCALE.x, plane.position.y + h / 2, zSpan / 2),
        new Vector3(sign * RG_VALIDITY_G * SCALE.x, plane.position.y - h / 2, zSpan / 2),
      ];
      // explicit segment pairs: the WebGPU renderer does not draw LineLoop
      const loopPts = [...edgePts, edgePts[0]];
      group.add(trackLine(engraved.line(loopPts, {
        color: "pigment-red-71", opacity: 0.55, additive: true, widthPx: engraved.WIDTH_PX.standard, layer: "model",
      })));
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
      group.add(tag(cone, "model"));
      const tipMat = track(new SpriteMaterial({
        map: sharedGlowTexture(), color, transparent: true, opacity: 0.7,
        blending: AdditiveBlending, depthWrite: false,
      }));
      const tip = new Sprite(tipMat);
      tip.scale.setScalar(0.9);
      tip.position.set(axisX, y + (flip ? -0.35 : 0.35), 0);
      group.add(tag(tip, "decoration"));
    };
    mk((RG_FLOW_3D_DEFAULTS.tMax + 1.4) * SCALE.y, TK.hex("pigment-azure-81"), false); // UV up
    mk((RG_FLOW_3D_DEFAULTS.tMin - 1.4) * SCALE.y, TK.hex("pigment-orange-82-c13"), true);  // IR down
  }

  function sync({ time = 0, motion = 1 } = {}) {
    const clock = Number(time) || 0;
    const pulse = 1 + 0.12 * Math.sin(clock * 2.2) * motion;
    for (const { marker, halo } of fpMarkers) {
      marker.scale.setScalar(pulse);
      halo.scale.setScalar(1.15 * (1 + 0.1 * Math.sin(clock * 2.2 + 0.6) * motion));
    }
    tracers.setClock(clock, motion);
  }

  function dispose() {
    tracers.dispose();
    for (const d of disposables) d.dispose?.();
    group.removeFromParent?.();
  }

  return {
    mesh: group,
    kind: "gpu-compute",
    stats: () => ({
      kind: "gpu-compute",
      streamlines: streamlines.filter((r) => r.points.length > 1).length,
      separatrices: separatrices.filter((r) => r.points.length > 1).length,
      fixedPoints: fixedPoints.length,
      flowParticles: tracers.tracers,
      terminatedAtValidity: streamlines.filter((r) => r.terminated === "validity-boundary").length,
      model: String(model),
    }),
    sync,
    /** One compute step of the tracers; Scene3D calls it every frame with the live node renderer. */
    compute: (renderer, dt) => tracers.step(renderer, dt),
    /** Compiles and seeds the kernel once, before the first frame is drawn. */
    prepare: (renderer) => tracers.init(renderer),
    dispose,
    recoverable: () => false,
  };
}
