/**
 * Causal-set laboratory — Scene3D runtime (S22).
 *
 * The scene is the conjecture made visible: a Poisson sprinkle of N elements into a causal diamond of Minkowski
 * space, drawn as engraved points, with the causal order drawn as links and the longest chain picked out as the
 * focal golden polyline. Every point, link and chain element comes from `js/science/causal-sets.mjs`, and the
 * readouts are computed from the same run.
 *
 * 2D is drawn literally in the plane (t vertical, x horizontal). 4D is a disclosed projection: time stays
 * vertical and the three spatial coordinates pass through a fixed, deterministic orthonormal frame, so the
 * picture is a faithful projection of a 4D sprinkle — never a claim to display four dimensions.
 *
 * The structure is CONJECTURAL (see CAUSAL_SET_PROVENANCE): whether a causal set underlies our universe is open.
 */

import { Color, Group } from "three";
import { createDataPoints } from "../../render/materials/data-points.mjs";
import { tagLayer as tag } from "../../render/scene-layers.mjs";
import * as TK from "../../design/tokens.mjs";

const tokenColor = (name) => new Color().fromArray(TK.linearRef(name));

const HEIGHT = 5.6;
const WIDTH = 2.5;

/** Fixed 4D→3D projection frame (deterministic, so the same seed always draws the same picture). */
const PROJECT = [
  [0.8607, -0.4173, 0.2905],
  [0.4472, 0.8944, 0.0],
  [-0.2384, -0.1645, 0.9571],
];

export function createCausalSetRuntime({ run, dim = 2, showLinks = true, engraved } = {}) {
  if (!engraved) throw new TypeError("createCausalSetRuntime needs ctx.engraved (the scene's engraved line API)");
  if (!run || !Array.isArray(run.points) || run.points.length < 2) {
    throw new TypeError("createCausalSetRuntime needs a sprinkle run");
  }
  const group = new Group();
  group.name = "causal-set-lab";
  const n = run.points.length;
  const positions = new Float32Array(n * 3);

  // One projection shared by points, links and chain, so an endpoint and its line always coincide.
  const project = (p) => {
    const y = (p.t - 0.5) * HEIGHT;
    if (dim === 2) return [(p.x / 0.5) * WIDTH, y, 0];
    const [r0, r1, r2] = PROJECT;
    const sx = p.x, sy = p.y, sz = p.z;
    const px = r0[0] * sx + r0[1] * sy + r0[2] * sz;
    const pz = r2[0] * sx + r2[1] * sy + r2[2] * sz;
    const k = WIDTH / 0.5;
    return [px * k, y, pz * k];
  };
  for (let i = 0; i < n; i++) {
    const [x, y, z] = project(run.points[i]);
    positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
  }

  // Points: 2 px discs. Chain members take the gold tint through the per-point colour array, not a second pass.
  const chainSet = new Set(run.chain.indices);
  const colors = new Float32Array(n * 3);
  const base = tokenColor("pigment-blue-78-c08");
  const chainColor = tokenColor("lab-gold");
  for (let i = 0; i < n; i++) {
    const c = chainSet.has(i) ? chainColor : base;
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  const pointKit = createDataPoints({ positions, colors, sizePx: 2, opacity: 0.92, profile: "disc" });
  const points = pointKit.object;
  points.frustumCulled = false;
  group.add(tag(points, "data"));

  // Links at the hairline width with a depth fade, so the constellation reads as a volume.
  let linkLine = null;
  if (showLinks && run.links.length) {
    const pairs = new Float32Array(run.links.length * 6);
    for (let i = 0; i < run.links.length; i++) {
      const [a, b] = run.links[i];
      pairs[i * 6] = positions[a * 3]; pairs[i * 6 + 1] = positions[a * 3 + 1]; pairs[i * 6 + 2] = positions[a * 3 + 2];
      pairs[i * 6 + 3] = positions[b * 3]; pairs[i * 6 + 4] = positions[b * 3 + 1]; pairs[i * 6 + 5] = positions[b * 3 + 2];
    }
    linkLine = engraved.segments(pairs, {
      color: "pigment-blue-54", opacity: 0.22,
      widthPx: engraved.WIDTH_PX.hairline, depthFade: [7, 18], layer: "model",
    });
    linkLine.frustumCulled = false;
    group.add(linkLine);
  }

  // The longest chain: the one focal curve the figure is about.
  let chainLine = null;
  if (run.chain.indices.length > 1) {
    const pts = new Float32Array(run.chain.indices.length * 3);
    run.chain.indices.forEach((id, i) => {
      pts[i * 3] = positions[id * 3]; pts[i * 3 + 1] = positions[id * 3 + 1]; pts[i * 3 + 2] = positions[id * 3 + 2];
    });
    chainLine = engraved.line(pts, {
      color: "lab-gold", opacity: 0.95, widthPx: engraved.WIDTH_PX.focal, layer: "data",
    });
    chainLine.frustumCulled = false;
    group.add(chainLine);
  }

  // The diamond boundary as engraved light cones.
  const coneA = engraved.line(new Float32Array([-WIDTH, HEIGHT / 2, 0, 0, -HEIGHT / 2, 0]), {
    color: "pigment-blue-64", opacity: 0.45, widthPx: engraved.WIDTH_PX.hairline, layer: "model",
  });
  const coneB = engraved.line(new Float32Array([WIDTH, HEIGHT / 2, 0, 0, -HEIGHT / 2, 0]), {
    color: "pigment-blue-64", opacity: 0.45, widthPx: engraved.WIDTH_PX.hairline, layer: "model",
  });
  coneA.frustumCulled = false; coneB.frustumCulled = false;
  group.add(tag(coneA, "model"));
  group.add(tag(coneB, "model"));

  return {
    group,
    stats: () => ({
      n, dim, links: run.links.length, chain: run.chain.length,
      orderingFraction: run.orderingFraction,
      dimension: run.myrheimMeyer.dim,
    }),
    setVisible: ({ links = true } = {}) => { if (linkLine) linkLine.visible = links; },
    dispose: () => {
      pointKit.dispose();
      for (const obj of [linkLine, chainLine, coneA, coneB]) {
        if (!obj) continue;
        group.remove(obj);
        obj.geometry?.dispose?.();
      }
      group.clear();
    },
  };
}

export { CAUSAL_SET_PROVENANCE } from "../../science/causal-sets.mjs";
