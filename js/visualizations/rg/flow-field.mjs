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
  gravityFlow3dFixedPoints, gravitySeparatrixCurve, GRAVITY_MODEL, GRAVITY_SPAN,
  RG_FLOW_3D_DEFAULTS, RG_VALIDITY_G,
} from "../../science/rg-flow-3d.mjs";
import { SINGULAR_LAMBDA } from "../../science/asymptotic-safety.mjs";
import { sharedGlowTexture, wallGradientTexture } from "../glow-texture.mjs";
import * as TK from "../../design/tokens.mjs";
import { tagLayer as tag } from "../../render/scene-layers.mjs";

const tokenColor = (name) => new Color().fromArray(TK.linearRef(name));

const SCALE = { x: 1.5, y: 1.1, z: 1.5 }; // scene units per (g, t, r)
// The gravity box is the silk's (g, lambda) domain, 1.4 by 0.89 couplings wide; the same scale as the one-coupling box would draw a sliver.
const GRAVITY_SCALE = { x: 4.6, y: 1.1, z: 4.6 };
// its box is centred on the middle of the silk's domain, so the camera looks at the picture and not at a corner of it
const GRAVITY_CENTRE = {
  g: (GRAVITY_SPAN.g[0] + GRAVITY_SPAN.g[1]) / 2,
  lambda: (GRAVITY_SPAN.lambda[0] + GRAVITY_SPAN.lambda[1]) / 2,
};
const PARTICLES_PER_RUN = 5;

const toScene = (p, gravity = false) => {
  const scale = gravity ? GRAVITY_SCALE : SCALE;
  const t = Math.max(RG_FLOW_3D_DEFAULTS.tMin - 2, Math.min(RG_FLOW_3D_DEFAULTS.tMax + 2, p.t));
  const g = gravity ? p.g - GRAVITY_CENTRE.g : p.g;
  const second = gravity ? p.r - GRAVITY_CENTRE.lambda : p.r;
  return new Vector3(g * scale.x, t * scale.y, second * scale.z);
};

/** Drops consecutive coincident points: the adaptive stepper's tiny steps would give the engraved line a zero-length segment and a NaN normal. */
function dedupe(points) {
  const out = [];
  for (const p of points) if (!out.length || out[out.length - 1].distanceToSquared(p) > 1e-12) out.push(p);
  return out;
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

  const gravity = model === GRAVITY_MODEL;
  const S = gravity ? GRAVITY_SCALE : SCALE;
  const toSceneS = (p) => toScene(p, gravity);
  const streamlines = seedStreamlines3d({ model, params, seed, count });
  const separatrices = gravity ? [] : separatrixCurves3d({ model, params });
  const fixedPoints = gravity
    ? gravityFlow3dFixedPoints().map((fp) => ({ g: fp.g, r: fp.lambda, stabilityG: null, lambdaG: null, lambdaR: null, source: "newton", gaussian: fp.gaussian, exponents: fp.exponents }))
    : rgFlow3dFixedPoints(model, params);

  // ---- dim reference grid at the IR floor ----
  {
    const grid = trackLine(engraved.grid(16, 16, {
      color: "pigment-blue-29", centerColor: "pigment-blue-37", opacity: 0.22, widthPx: engraved.WIDTH_PX.hairline, layer: "decoration",
    }));
    grid.position.y = (RG_FLOW_3D_DEFAULTS.tMin - 0.6) * S.y;
    group.add(grid);
  }

  // ---- streamlines (color: UV run cyan, IR run amber) + arc-length tables ----
  const runs = [];
  for (const run of streamlines) {
    // the adaptive stepper shrinks its step at the truncation boundaries, so consecutive points can coincide: a degenerate line has no radius
    const pts = dedupe(run.points.map(toSceneS));
    if (pts.length < 2) continue;
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
    const dir = end.clone().sub(prev);
    if (dir.lengthSq() > 1e-12) dir.normalize();
    else dir.set(0, 1, 0);
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
    const pos = toSceneS({ g: fp.g, r: fp.r, t: 0 });
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
  // In the gravity mode the plane lambda = 1/2, where the truncation is singular, takes their place, with the separatrix as an engraved line.
  {
    const h = (RG_FLOW_3D_DEFAULTS.tMax - RG_FLOW_3D_DEFAULTS.tMin + 2) * S.y;
    const zSpan = RG_FLOW_3D_DEFAULTS.rSpan * 2.4 * SCALE.z;
    const midpointY = ((RG_FLOW_3D_DEFAULTS.tMax + RG_FLOW_3D_DEFAULTS.tMin) / 2) * S.y;
    if (gravity) {
      const planeGeo = track(new PlaneGeometry((GRAVITY_SPAN.g[1] - GRAVITY_SPAN.g[0]) * S.x * 1.15, h));
      const planeMat = track(new MeshBasicMaterial({
        color: TK.hex("cat-5"), transparent: true, opacity: 0.16, side: 2, depthWrite: false,
      }));
      const plane = new Mesh(planeGeo, planeMat);
      plane.position.set(0, midpointY, (SINGULAR_LAMBDA - GRAVITY_CENTRE.lambda) * S.z);
      group.add(tag(plane, "model"));
      const sep = dedupe(gravitySeparatrixCurve().points.filter((p) => p.t <= RG_FLOW_3D_DEFAULTS.tMax + 2).map(toSceneS));
      if (sep.length > 1) {
        group.add(trackLine(engraved.line(sep, {
          color: "cat-2", opacity: 0.9, additive: true, widthPx: engraved.WIDTH_PX.standard, layer: "model",
        })));
      }
    } else {
      const wallTex = track(wallGradientTexture());
      for (const sign of [-1, 1]) {
        const planeGeo = track(new PlaneGeometry(zSpan, h));
        const planeMat = track(new MeshBasicMaterial({
          map: wallTex, color: TK.hex("pigment-red-69"), transparent: true, opacity: 0.5,
          side: 2, depthWrite: false,
        }));
        const plane = new Mesh(planeGeo, planeMat);
        plane.position.set(sign * RG_VALIDITY_G * SCALE.x, midpointY, 0);
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
    mk((RG_FLOW_3D_DEFAULTS.tMax + 1.4) * S.y, TK.hex("pigment-azure-81"), false); // UV up
    mk((RG_FLOW_3D_DEFAULTS.tMin - 1.4) * S.y, TK.hex("pigment-orange-82-c13"), true);  // IR down
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
      separatrices: gravity ? (gravitySeparatrixCurve().points.length > 1 ? 1 : 0) : separatrices.filter((r) => r.points.length > 1).length,
      fixedPoints: fixedPoints.length,
      flowParticles: tracers.tracers,
      terminatedAtValidity: streamlines.filter((r) => r.terminated === "validity-boundary").length,
      terminatedAtSingular: streamlines.filter((r) => r.terminated === "truncation-boundary").length,
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
