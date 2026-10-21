/**
 * Spin-foam lab — Scene3D runtime (Prompt 08, premium rendering).
 *
 * NETWORK mode: the current spin network as a Schlegel-projected graph —
 * edge tubes colored cyan→gold by spin (area ∝ √(j(j+1))), node spheres
 * sized by quantum volume (4-valent) or spin weight (3-valent gauge), and
 * faint face membranes. FOAM mode: the deterministic spin-foam sequence
 * rendered as a history — each step's graph ghosted on its own slice along
 * the y (evolution) axis, with the current step highlighted and every node
 * of every slice drawn as one InstancedMesh of glow points (bounded WebGL2
 * graph, per the plan). All labels/spins come from js/science/spin-networks.mjs.
 * The dynamics are CONJECTURAL — no amplitudes are computed — and the caller
 * labels this in-canvas.
 */

import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CatmullRomCurve3, Color,
  DoubleSide, Group, Line, LineBasicMaterial, LineSegments,
  Mesh, MeshBasicMaterial, Points, PointsMaterial, SphereGeometry,
  Sprite, SpriteMaterial, TubeGeometry, Vector3,
} from "three";
import {
  spinFoamLabState, SPIN_FOAM_LAB_DEFAULTS, SPIN_TOPOLOGIES,
} from "../../science/spin-networks.mjs";
import { seededRng } from "../../physics.mjs";
import { sharedGlowTexture } from "../glow-texture.mjs";
import * as TK from "../../design/tokens.mjs";

const tokenColor = (name) => new Color().fromArray(TK.linearRef(name));

const S = 2.6; // graph scale in world units

export function createSpinFoamRuntime({
  topology = SPIN_FOAM_LAB_DEFAULTS.topology,
  jMaxHalf = SPIN_FOAM_LAB_DEFAULTS.jMaxHalf,
  seed = SPIN_FOAM_LAB_DEFAULTS.seed,
  step = 0,
  mode = "network",
  camera = null,
} = {}) {
  if (!SPIN_TOPOLOGIES.includes(topology)) {
    throw new TypeError(`unknown topology: ${topology}`);
  }
  const lab = spinFoamLabState({ topology, jMaxHalf, seed, step });
  const group = new Group();
  group.name = "spin-foam-lab";
  const CYAN = tokenColor("lab-cyan");
  const GOLD = tokenColor("lab-gold");
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };
  const spinColor = (j) => {
    const f = lab.spectrum.length > 1
      ? (j - lab.spectrum[0].spin) / (lab.spectrum[lab.spectrum.length - 1].spin - lab.spectrum[0].spin)
      : 0;
    return CYAN.clone().lerp(GOLD, Math.max(0, Math.min(1, f)));
  };

  // ---- seeded starfield ----
  {
    const rng = seededRng((seed >>> 0) + 13);
    const n = 380;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const tmp = new Color();
    for (let i = 0; i < n; i++) {
      const u = rng() * 2 - 1, th = rng() * Math.PI * 2;
      const r = 24 + rng() * 12;
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(th);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * s * Math.sin(th);
      tmp.setHSL(0.6 + 0.08 * rng(), 0.32, 0.55 + 0.35 * rng());
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    const starGeo = track(new BufferGeometry());
    starGeo.setAttribute("position", new BufferAttribute(pos, 3));
    starGeo.setAttribute("color", new BufferAttribute(col, 3));
    const stars = new Points(starGeo, track(new PointsMaterial({
      size: 0.45, sizeAttenuation: true, map: sharedGlowTexture(), vertexColors: true,
      transparent: true, opacity: 0.65, depthWrite: false, blending: AdditiveBlending,
    })));
    stars.frustumCulled = false;
    group.add(stars);
  }

  const nodePos = (i, lift = 0) => {
    const p = lab.projection.points[i];
    return new Vector3(p.x * S, lift, p.z * S);
  };

  // ---- current graph: edge tubes colored by spin ----
  const edgeMats = [];
  for (const e of lab.config.edges) {
    const curve = new CatmullRomCurve3([nodePos(e.a, 0.02), nodePos(e.b, 0.02)]);
    const geo = track(new TubeGeometry(curve, 24, 0.035 + 0.02 * e.spin, 6, false));
    const mat = track(new MeshBasicMaterial({
      color: spinColor(e.spin), transparent: true, opacity: 0.85,
      blending: AdditiveBlending, depthWrite: false,
    }));
    edgeMats.push(mat);
    group.add(new Mesh(geo, mat));
  }

  // ---- face membranes: one merged triangle mesh, vertex-colored by spin sum ----
  let faceMat = null;
  {
    const faces = lab.config.faces;
    const pos = new Float32Array(faces.length * 9);
    const col = new Float32Array(faces.length * 9);
    faces.forEach((tri, i) => {
      const c = spinColor(tri.spinSum / 3);
      tri.nodes.forEach((n, k) => {
        const v = nodePos(n, 0.012);
        pos.set([v.x, v.y, v.z], (i * 3 + k) * 3);
        col.set([c.r * 0.5, c.g * 0.5, c.b * 0.5], (i * 3 + k) * 3);
      });
    });
    const g = track(new BufferGeometry());
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("color", new BufferAttribute(col, 3));
    faceMat = track(new MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.16, side: DoubleSide,
      blending: AdditiveBlending, depthWrite: false,
    }));
    const mesh = new Mesh(g, faceMat);
    mesh.frustumCulled = false;
    group.add(mesh);
  }

  // ---- nodes: spheres sized by weight, glow sprites on top ----
  const nodeGlows = [];
  const maxWeight = Math.max(1e-6, ...lab.config.nodes.map((n) => n.weight));
  for (const n of lab.config.nodes) {
    const v = nodePos(n.index, 0.03);
    const r = 0.09 + 0.16 * (n.weight / maxWeight);
    const geo = track(new SphereGeometry(r, 16, 12));
    const mat = track(new MeshBasicMaterial({
      color: n.volume > 0 ? GOLD : CYAN, transparent: true, opacity: 0.95,
      blending: AdditiveBlending, depthWrite: false,
    }));
    const m = new Mesh(geo, mat);
    m.position.copy(v);
    group.add(m);
    const gm = track(new SpriteMaterial({
      map: sharedGlowTexture(), color: n.volume > 0 ? TK.hex("pigment-orange-86") : TK.hex("pigment-cyan-89"),
      transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false,
    }));
    const sp = new Sprite(gm);
    sp.scale.setScalar(r * 4);
    sp.position.copy(v);
    group.add(sp);
    nodeGlows.push(sp);
  }

  // ---- FOAM mode: ghost history slices along y + instanced node points ----
  let foamPoints = null;
  if (mode === "foam") {
    const steps = lab.sequence.steps;
    const GAP = 1.15;
    const sliceLineMat = track(new LineBasicMaterial({
      color: TK.hex("pigment-blue-54"), transparent: true, opacity: 0.16, depthWrite: false,
    }));
    const slicePositions = [];
    for (let s = 0; s < steps; s++) {
      const cfg = lab.sequence.configs[s];
      const lift = (s - (steps - 1) / 2) * GAP;
      for (const e of cfg.edges) {
        const a = nodePos(e.a, lift), b = nodePos(e.b, lift);
        slicePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const g = track(new BufferGeometry());
    g.setAttribute("position", new BufferAttribute(new Float32Array(slicePositions), 3));
    const ls = new LineSegments(g, sliceLineMat);
    ls.frustumCulled = false;
    group.add(ls);

    // every node of every slice as one InstancedMesh of glow points
    const count = steps * lab.config.nodes.length;
    const pGeo = track(new BufferGeometry());
    pGeo.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
    foamPoints = new Points(pGeo, track(new PointsMaterial({
      size: 0.5, sizeAttenuation: true, map: sharedGlowTexture(), color: TK.hex("pigment-cyan-89"),
      transparent: true, opacity: 0.5, depthWrite: false, blending: AdditiveBlending,
    })));
    foamPoints.frustumCulled = false;
    group.add(foamPoints);
    const arr = foamPoints.geometry.attributes.position;
    let k = 0;
    for (let s = 0; s < steps; s++) {
      const cfg = lab.sequence.configs[s];
      const lift = (s - (steps - 1) / 2) * GAP;
      for (const n of cfg.nodes) {
        const v = nodePos(n.index, lift);
        arr.setXYZ(k++, v.x, v.y, v.z);
      }
    }
    arr.needsUpdate = true;
  }

  const period = 5.5;

  function sync({ time = 0, motion = 1 } = {}) {
    const phase = motion === 0
      ? period * 0.42
      : ((Number(time) || 0) % period + period) % period;
    const pulse = 0.5 + 0.5 * Math.sin(phase * 1.7);
    for (let i = 0; i < edgeMats.length; i++) {
      edgeMats[i].opacity = 0.65 + 0.3 * Math.sin(phase * 1.4 + i * 0.8);
    }
    faceMat.opacity = 0.1 + 0.1 * pulse;
    for (let i = 0; i < nodeGlows.length; i++) {
      nodeGlows[i].material.opacity = 0.35 + 0.3 * Math.sin(phase * 1.8 + i * 1.1);
    }
    if (foamPoints) {
      foamPoints.material.opacity = 0.3 + 0.25 * pulse;
    }
  }

  function dispose() {
    for (const d of disposables) d.dispose?.();
    group.removeFromParent?.();
  }

  return {
    mesh: group,
    kind: "spin-foam",
    stats: () => ({
      kind: "spin-foam",
      topology: lab.topology,
      nodes: lab.config.nodes.length,
      edges: lab.config.edges.length,
      faces: lab.config.faces.length,
      totalArea: lab.config.totalArea,
      totalVolume: lab.config.totalVolume,
      maxSpin: lab.config.maxSpin,
      step: lab.step,
      steps: lab.steps,
      mode,
    }),
    sync,
    dispose,
    recoverable: () => false,
  };
}