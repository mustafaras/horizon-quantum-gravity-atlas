/**
 * QFT field lab — Scene3D runtime (Prompt 07, premium rendering).
 *
 * A 3-D waterfall of the seeded free-field sample: x is space, y is the field
 * amplitude φ, z is the time history (newest slice in front). The surface is
 * a lit, vertex-colored membrane (MeshStandardMaterial) with an additive
 * "energy" layer that goes near-black in the vacuum and white-hot at crests,
 * so bloom turns wave crests into real light. Signed coloring (positive cyan
 * / negative amber) matches the spacetime instrument's visual language.
 * Modes are evaluated from the pure contract in js/science/qft-fields.mjs;
 * one new time slice is computed per timeline step into a ring buffer, so
 * the per-frame compute cost is one row, not the whole surface.
 *
 * Overlay modes (mutually exclusive, each labeled in-canvas by the caller):
 *  - "field":       the waterfall alone (effective free-field sample)
 *  - "correlation": equal-time correlation C(r) as a glowing tube
 *  - "flux":        schematic flux tube between static sources (analogy!)
 * The optional particle interpretation marks slice peaks with glow sprites
 * and is always labeled as an interpretation, never as observed particles.
 */

import {
  AdditiveBlending, AmbientLight, BufferAttribute, BufferGeometry, Color,
  DirectionalLight, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  CatmullRomCurve3, Sprite, SpriteMaterial, SphereGeometry, TubeGeometry,
  Vector3,
} from "three";
import {
  QFT_FIELD_DEFAULTS, buildFourierModes, sampleField, equalTimeCorrelation,
  fluxTubeProfile,
} from "../../science/qft-fields.mjs";
import { createFieldPeaks } from "./field-peaks.mjs";
import { sharedGlowTexture } from "../glow-texture.mjs";
import * as TK from "../../design/tokens.mjs";
import { tagLayer as tag } from "../../render/scene-layers.mjs";

const EXTENT_X = 9;
const EXTENT_Z = 7;

export function createQftFieldLabRuntime({
  seed = 42, mass = QFT_FIELD_DEFAULTS.mass, mode = "field",
  showParticles = false, nx = 160, history = QFT_FIELD_DEFAULTS.history,
} = {}) {
  const field = buildFourierModes({ seed, mass });
  const L = field.length;
  const group = new Group();
  group.name = "qft-field-lab";

  // ---- lights (the membrane is lit, not flat) ----
  group.add(new AmbientLight(TK.hex("pigment-blue-68"), 0.65));
  const key = new DirectionalLight(TK.hex("pigment-blue-86"), 1.05);
  key.position.set(4, 9, 6);
  group.add(key);
  const rim = new DirectionalLight(TK.hex("pigment-blue-62-c20"), 0.5);
  rim.position.set(-6, 3, -8);
  group.add(rim);

  // ---- field value ring buffer (one row per timeline step) ----
  const phiBuf = new Float64Array(nx * history);
  let head = 0; // ring index of the newest slice
  let simTime = 0;
  const sliceDt = 0.09;

  function writeSlice(row, t) {
    const base = row * nx;
    for (let i = 0; i < nx; i++) {
      const x = (i / (nx - 1)) * 2 * EXTENT_X - EXTENT_X;
      phiBuf[base + i] = sampleField(field, (x / EXTENT_X) * (L / 2), t);
    }
  }
  // Pre-fill the history so the first frame is complete and deterministic.
  for (let s = 0; s < history; s++) writeSlice(s, simTime - (history - 1 - s) * sliceDt);
  head = history - 1; // newest prefilled slice is the front row

  // ---- surface meshes: mesh row 0 = newest slice (front), copied in age order ----
  const total = nx * history;
  const positions = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  const glowColors = new Float32Array(total * 3);
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(positions, 3));
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  const index = [];
  for (let s = 0; s < history - 1; s++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = s * nx + i, b = a + 1, c = a + nx, d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  geo.setIndex(index);

  const surfMat = new MeshStandardMaterial({
    vertexColors: true, metalness: 0.42, roughness: 0.32,
    emissive: TK.hex("pigment-blue-21"), emissiveIntensity: 0.75, side: 2,
  });
  const surf = new Mesh(geo, surfMat);
  surf.frustumCulled = false;
  group.add(tag(surf, "model"));

  // additive energy layer: shares the position buffer, own hot colors
  const glowGeo = new BufferGeometry();
  glowGeo.setIndex(index);
  glowGeo.setAttribute("position", geo.attributes.position);
  glowGeo.setAttribute("color", new BufferAttribute(glowColors, 3));
  const glowMat = new MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.85,
    blending: AdditiveBlending, depthWrite: false, side: 2,
  });
  const glow = new Mesh(glowGeo, glowMat);
  glow.renderOrder = 2;
  glow.frustumCulled = false;
  group.add(tag(glow, "model"));

  const tmp = new Color();
  const COLOR_POS = new Color(TK.hex("pigment-cyan-91"));
  const COLOR_NEG = new Color().fromArray(TK.linearRef("field-negative"));
  const COLOR_BASE = new Color(TK.hex("pigment-blue-33"));
  const COLOR_HOT = new Color(TK.hex("pigment-grey-98"));
  function rebuildSurface() {
    for (let s = 0; s < history; s++) {
      const row = (head - s + history) % history;
      const z = EXTENT_Z - (s / (history - 1)) * 2 * EXTENT_Z;
      const fade = 1 - 0.55 * (s / (history - 1)); // older slices recede into fog
      for (let i = 0; i < nx; i++) {
        const phi = phiBuf[row * nx + i];
        const p = (s * nx + i) * 3;
        positions[p] = (i / (nx - 1)) * 2 * EXTENT_X - EXTENT_X;
        positions[p + 1] = phi * 1.6;
        positions[p + 2] = z;
        const mag = Math.min(1, Math.abs(phi) * 1.4);
        tmp.copy(COLOR_BASE).lerp(phi >= 0 ? COLOR_POS : COLOR_NEG, mag).multiplyScalar(fade);
        colors[p] = tmp.r; colors[p + 1] = tmp.g; colors[p + 2] = tmp.b;
        // energy layer: near-black in the vacuum, white-hot at crests
        const hot = Math.max(0, Math.min(1, (Math.abs(phi) - 0.32) * 1.15));
        const e = hot * hot * fade;
        tmp.copy(COLOR_HOT).multiplyScalar(e);
        glowColors[p] = tmp.r; glowColors[p + 1] = tmp.g; glowColors[p + 2] = tmp.b;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    glowGeo.attributes.color.needsUpdate = true;
    geo.computeVertexNormals();
    glowGeo.computeBoundingSphere();
  }
  rebuildSurface();

  // ---- correlation overlay: glowing tube + halo (equal-time, static) ----
  const corr = equalTimeCorrelation(field, { samples: 120 });
  const cMax = Math.max(...corr.map((p) => Math.abs(p.c)), 1e-6);
  const corrCurve = new CatmullRomCurve3(corr.map((p) => new Vector3(
    (p.r / (L / 2)) * EXTENT_X, -2.4, (p.c / cMax) * 2.2 - 1.1,
  )));
  const corrTubeGeo = new TubeGeometry(corrCurve, 160, 0.045, 8, false);
  const corrTubeMat = new MeshBasicMaterial({
    color: TK.hex("pigment-azure-86"), transparent: true, opacity: 0.95,
    blending: AdditiveBlending, depthWrite: false,
  });
  const corrTube = new Mesh(corrTubeGeo, corrTubeMat);
  const corrHaloGeo = new TubeGeometry(corrCurve, 160, 0.16, 8, false);
  const corrHaloMat = new MeshBasicMaterial({
    color: TK.hex("pigment-blue-58"), transparent: true, opacity: 0.16,
    blending: AdditiveBlending, depthWrite: false,
  });
  const corrHalo = new Mesh(corrHaloGeo, corrHaloMat);
  const corrGroup = new Group();
  corrGroup.add(corrHalo, corrTube);
  corrGroup.visible = false;
  group.add(tag(corrGroup, "model"));

  // ---- flux-tube overlay (SCHEMATIC analogy), vertex-alpha density shell ----
  const tube = new Group();
  tube.visible = false;
  {
    const profile = fluxTubeProfile({ separation: 2 * EXTENT_X * 0.7, transverseWidth: 0.6 });
    const rings = profile.rows.length;
    const seg = 16;
    const tubePos = new Float32Array(rings * seg * 3);
    const tubeCol = new Float32Array(rings * seg * 4);
    const idx = [];
    const dMax = Math.max(...profile.rows.flatMap((r) => r.radial.map((s) => s.density)), 1e-6);
    for (let i = 0; i < rings; i++) {
      const w = profile.rows[i].width * 1.5;
      const x = profile.rows[i].s - profile.separation / 2;
      for (let j = 0; j < seg; j++) {
        const th = (j / seg) * Math.PI * 2;
        const p = (i * seg + j) * 3;
        tubePos[p] = x;
        tubePos[p + 1] = Math.cos(th) * w - 0.4;
        tubePos[p + 2] = Math.sin(th) * w;
        const dens = profile.rows[i].radial[0].density / dMax;
        const q = (i * seg + j) * 4;
        tubeCol[q] = 0.35 + 0.55 * dens;
        tubeCol[q + 1] = 0.62 + 0.3 * dens;
        tubeCol[q + 2] = 1.0;
        tubeCol[q + 3] = 0.10 + 0.5 * dens * dens;
      }
    }
    for (let i = 0; i < rings - 1; i++) {
      for (let j = 0; j < seg; j++) {
        const a = i * seg + j, b = i * seg + ((j + 1) % seg);
        const c = (i + 1) * seg + j, d = (i + 1) * seg + ((j + 1) % seg);
        idx.push(a, b, c, b, d, c);
      }
    }
    const tubeGeo = new BufferGeometry();
    tubeGeo.setAttribute("position", new BufferAttribute(tubePos, 3));
    tubeGeo.setAttribute("color", new BufferAttribute(tubeCol, 4));
    const tubeMat = new MeshBasicMaterial({
      vertexColors: true, transparent: true,
      blending: AdditiveBlending, depthWrite: false, side: 2,
    });
    tube.add(new Mesh(tubeGeo, tubeMat));
    // the string itself: a hot core line between the sources
    const coreCurve = new CatmullRomCurve3([
      new Vector3(-profile.separation / 2, -0.4, 0),
      new Vector3(0, -0.4, 0),
      new Vector3(profile.separation / 2, -0.4, 0),
    ]);
    const coreMat = new MeshBasicMaterial({
      color: TK.hex("pigment-amber-92"), transparent: true, opacity: 0.9,
      blending: AdditiveBlending, depthWrite: false,
    });
    tube.add(new Mesh(new TubeGeometry(coreCurve, 32, 0.035, 6, false), coreMat));
    const srcMat = new MeshBasicMaterial({ color: TK.hex("pigment-orange-90") });
    const srcGeo = new SphereGeometry(0.26, 20, 14);
    for (const s of [-1, 1]) {
      const src = new Mesh(srcGeo, srcMat);
      src.position.set(s * (profile.separation / 2), -0.4, 0);
      tube.add(src);
      const halo = new Sprite(new SpriteMaterial({
        map: sharedGlowTexture(), color: TK.hex("pigment-orange-85-c11"), transparent: true,
        opacity: 0.8, blending: AdditiveBlending, depthWrite: false,
      }));
      halo.scale.setScalar(1.6);
      halo.position.copy(src.position);
      tube.add(halo);
    }
  }
  group.add(tag(tube, "model"));

  // ---- particle interpretation (slice crests): a GPU particle system (S08) ----
  // One particle per interior sample point; the kernel evaluates the closed-form field from the mode table itself, so the CPU sets one
  // uniform per frame and uploads nothing (field-peaks.mjs). The waterfall surface above is a mesh: it keeps its CPU ring buffer until
  // the GPU lattice field theory (S14) replaces it.
  const peaks = createFieldPeaks({ field, nx, color: new Color(TK.hex("pigment-white")) });
  peaks.object.renderOrder = 3;
  peaks.object.visible = false;
  group.add(tag(peaks.object, "model"));

  function setMode(next) {
    mode = next;
    corrGroup.visible = next === "correlation";
    tube.visible = next === "flux";
    surfMat.transparent = next !== "field";
    surfMat.opacity = next === "field" ? 1 : 0.55;
    glowMat.opacity = next === "field" ? 0.85 : 0.3;
  }
  setMode(mode);
  peaks.object.visible = showParticles;

  function sync({ time = 0, motion = 1 } = {}) {
    // Advance the ring buffer deterministically with the shared timeline.
    // Under reduced motion (motion === 0) the window freezes on the prefilled
    // slices: the scene stays complete but frame-deterministic for captures.
    const target = Math.floor(time / sliceDt);
    const current = Math.floor(simTime / sliceDt);
    if (motion === 0) {
      peaks.setTime(simTime);
      return;
    }
    if (target < current - history) {
      // Scrub/replay backwards: rebuild the whole window at the new time.
      simTime = target * sliceDt;
      for (let s = 0; s < history; s++) writeSlice(s, simTime - (history - 1 - s) * sliceDt);
      head = history - 1;
    }
    const advance = Math.min(history, Math.max(0, target - current));
    for (let k = 0; k < advance; k++) {
      simTime += sliceDt;
      head = (head + 1) % history;
      writeSlice(head, simTime);
    }
    if (advance > 0) rebuildSurface();
    peaks.setTime(simTime);
  }

  function dispose() {
    geo.dispose(); surfMat.dispose();
    glowGeo.dispose(); glowMat.dispose();
    corrTubeGeo.dispose(); corrTubeMat.dispose();
    corrHaloGeo.dispose(); corrHaloMat.dispose();
    tube.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    peaks.dispose();
    group.removeFromParent?.();
  }

  return {
    mesh: group,
    kind: "cpu-samples",
    stats: () => ({
      kind: "cpu-samples", points: total, history,
      modes: field.modes.length, cutoffK: field.cutoffK, mode,
      particleInterpretation: peaks.object.visible,
      particleKind: "gpu-compute",
    }),
    setMode,
    setParticles: (v) => { peaks.object.visible = !!v; },
    sync,
    /** One compute step of the crest markers (only while shown); Scene3D calls it every frame with the live node renderer. */
    compute: (renderer, dt) => { if (peaks.object.visible) peaks.step(renderer, dt); },
    /** Compiles and seeds the kernel once, before the first frame is drawn. */
    prepare: (renderer) => peaks.init(renderer),
    dispose,
    recoverable: () => false,
  };
}
