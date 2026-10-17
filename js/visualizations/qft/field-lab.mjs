/**
 * QFT field lab — Scene3D runtime (Prompt 07).
 *
 * A 3-D waterfall of the seeded free-field sample: x is space, y is the field
 * amplitude φ, z is the time history (oldest slice at the back). Signed
 * amplitude coloring (positive cyan / negative amber) matches the spacetime
 * instrument's visual language. Modes are evaluated from the pure contract in
 * js/science/qft-fields.mjs; one new time slice is computed per timeline step
 * into a ring buffer, so the per-frame cost is one row, not the whole surface.
 *
 * Overlay modes (mutually exclusive, each labeled in-canvas by the caller):
 *  - "field":       the waterfall alone (effective free-field sample)
 *  - "correlation": equal-time correlation C(r) as a glowing floor curve
 *  - "flux":        schematic flux tube between static sources (analogy!)
 * The optional particle interpretation marks slice peaks with bright sprites
 * and is always labeled as an interpretation, never as observed particles.
 */

import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group, Line,
  LineBasicMaterial, Mesh, MeshBasicMaterial, Points, PointsMaterial,
  SphereGeometry, Sprite, SpriteMaterial,
} from "three";
import {
  QFT_FIELD_DEFAULTS, buildFourierModes, sampleField, equalTimeCorrelation,
  fluxTubeProfile, modeOccupation,
} from "../../science/qft-fields.mjs";

const COLOR_POS = new Color(0x9df3ff);
const COLOR_NEG = new Color(1.0, 0.60, 0.235);
const COLOR_BASE = new Color(0x2a6cff);
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

  // ---- waterfall surface (ring buffer of time slices) ----
  const total = nx * history;
  const positions = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(positions, 3));
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  const mat = new PointsMaterial({
    size: 2.4, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0.92, depthWrite: false, blending: AdditiveBlending,
  });
  const points = new Points(geo, mat);
  points.frustumCulled = false;
  group.add(points);

  let head = 0; // ring index of the newest slice
  let simTime = 0;
  const sliceDt = 0.09;

  function writeSlice(row, t) {
    const base = row * nx;
    for (let i = 0; i < nx; i++) {
      const x = (i / (nx - 1)) * 2 * EXTENT_X - EXTENT_X;
      const phi = sampleField(field, (x / EXTENT_X) * (L / 2), t);
      const p = (base + i) * 3;
      positions[p] = x;
      positions[p + 1] = phi * 1.6;
      const c = phi >= 0
        ? COLOR_BASE.clone().lerp(COLOR_POS, Math.min(1, Math.abs(phi) * 1.4))
        : COLOR_BASE.clone().lerp(COLOR_NEG, Math.min(1, Math.abs(phi) * 1.4));
      colors[p] = c.r; colors[p + 1] = c.g; colors[p + 2] = c.b;
    }
  }
  // Pre-fill the history so the first frame is complete and deterministic.
  for (let s = 0; s < history; s++) writeSlice(s, simTime - (history - 1 - s) * sliceDt);
  head = history - 1; // newest prefilled slice is the front row

  // ---- correlation overlay ----
  const corr = equalTimeCorrelation(field, { samples: 120 });
  const corrGeo = new BufferGeometry();
  const corrPos = new Float32Array(corr.length * 3);
  const cMax = Math.max(...corr.map((p) => Math.abs(p.c)), 1e-6);
  corr.forEach((p, i) => {
    corrPos[i * 3] = (p.r / (L / 2)) * EXTENT_X;
    corrPos[i * 3 + 1] = -2.4;
    corrPos[i * 3 + 2] = (p.c / cMax) * 2.2 - 1.1;
  });
  corrGeo.setAttribute("position", new BufferAttribute(corrPos, 3));
  const corrMat = new LineBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false });
  const corrLine = new Line(corrGeo, corrMat);
  corrLine.visible = false;
  group.add(corrLine);

  // ---- flux-tube overlay (SCHEMATIC analogy) ----
  const tube = new Group();
  tube.visible = false;
  {
    const profile = fluxTubeProfile({ separation: 2 * EXTENT_X * 0.7, transverseWidth: 0.6 });
    const rings = profile.rows.length;
    const seg = 14;
    const tubePos = new Float32Array(rings * seg * 3);
    const idx = [];
    for (let i = 0; i < rings; i++) {
      const w = profile.rows[i].width * 1.5;
      const x = profile.rows[i].s - profile.separation / 2;
      for (let j = 0; j < seg; j++) {
        const th = (j / seg) * Math.PI * 2;
        const p = (i * seg + j) * 3;
        tubePos[p] = x;
        tubePos[p + 1] = Math.cos(th) * w - 0.4;
        tubePos[p + 2] = Math.sin(th) * w;
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
    tubeGeo.setIndex(idx);
    const tubeMat = new MeshBasicMaterial({
      color: 0x59b7ff, transparent: true, opacity: 0.22,
      blending: AdditiveBlending, depthWrite: false, side: 2,
    });
    tube.add(new Mesh(tubeGeo, tubeMat));
    const srcMat = new MeshBasicMaterial({ color: 0xffd9a0 });
    const srcGeo = new SphereGeometry(0.28, 20, 14);
    for (const s of [-1, 1]) {
      const src = new Mesh(srcGeo, srcMat);
      src.position.set(s * (profile.separation / 2), -0.4, 0);
      tube.add(src);
    }
  }
  group.add(tube);

  // ---- particle interpretation sprites (slice peaks) ----
  const particles = new Group();
  particles.visible = false;
  const spriteMat = new SpriteMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false });
  const occ = modeOccupation(field);
  for (let i = 0; i < Math.min(occ.count, 24); i++) {
    const s = new Sprite(spriteMat);
    s.scale.setScalar(0.34);
    particles.add(s);
  }
  group.add(particles);

  function setMode(next) {
    mode = next;
    corrLine.visible = next === "correlation";
    tube.visible = next === "flux";
    mat.opacity = next === "field" ? 0.92 : 0.34;
  }
  setMode(mode);
  particles.visible = showParticles;

  function sync({ time = 0, motion = 1 } = {}) {
    // Advance the ring buffer deterministically with the shared timeline.
    // Under reduced motion (motion === 0) the window freezes on the prefilled
    // slices: the scene stays complete but frame-deterministic for captures.
    const target = Math.floor(time / sliceDt);
    const current = Math.floor(simTime / sliceDt);
    if (motion === 0) {
      if (particles.visible) markParticles();
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
    // Re-map z by ring age (newest slice in front).
    for (let s = 0; s < history; s++) {
      const row = (head - s + history) % history;
      const z = (s / (history - 1)) * 2 * EXTENT_Z - EXTENT_Z;
      for (let i = 0; i < nx; i++) positions[(row * nx + i) * 3 + 2] = z;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    // Particle interpretation: mark the newest slice's local maxima.
    if (particles.visible) markParticles();
  }

  function markParticles() {
    let slot = 0;
    for (let i = 1; i < nx - 1 && slot < particles.children.length; i++) {
      const p = (head * nx + i) * 3;
      const h = positions[p + 1];
      const hl = positions[(head * nx + i - 1) * 3 + 1];
      const hr = positions[(head * nx + i + 1) * 3 + 1];
      if (h > hl && h > hr && h > 0.35) {
        const sprite = particles.children[slot++];
        sprite.position.set(positions[p], h + 0.35, EXTENT_Z);
      }
    }
    for (; slot < particles.children.length; slot++) particles.children[slot].position.set(0, -999, 0);
  }

  function dispose() {
    geo.dispose(); mat.dispose();
    corrGeo.dispose(); corrMat.dispose();
    tube.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    spriteMat.dispose();
    group.removeFromParent?.();
  }

  return {
    mesh: group,
    kind: "cpu-samples",
    stats: () => ({
      kind: "cpu-samples", points: total, history,
      modes: field.modes.length, cutoffK: field.cutoffK, mode,
      particleInterpretation: particles.visible,
    }),
    setMode,
    setParticles: (v) => { particles.visible = !!v; },
    sync,
    dispose,
    recoverable: () => false,
  };
}
