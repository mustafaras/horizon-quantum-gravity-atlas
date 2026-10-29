/**
 * Causal-set laboratory — Scene3D runtime (S22).
 *
 * The scene is the conjecture made visible: a Poisson sprinkle of N elements into a causal diamond of Minkowski
 * space, drawn as engraved points, with the causal order drawn as links and the longest chain picked out as the
 * focal golden polyline. Every point, link and chain element comes from `js/science/causal-sets.mjs`.
 *
 * The picture is budgeted, not sampled blindly. A sprinkle large enough to measure the dimension has far more
 * relations than can be drawn legibly (27 552 at N = 4000 in 2D), so `drawableLinks` strides them down and the
 * caller states the stride in-canvas. The computation still uses every element: only the drawing is reduced.
 *
 * 2D is drawn literally in the plane (t vertical, x horizontal). 4D is a disclosed projection: time stays
 * vertical and the three spatial coordinates pass through a fixed, deterministic orthonormal frame.
 *
 * The structure is CONJECTURAL (see CAUSAL_SET_PROVENANCE): whether a causal set underlies our universe is open.
 */

import { Color, Group } from "three";
import { createDataPoints } from "../../render/materials/data-points.mjs";
import { tagLayer as tag } from "../../render/scene-layers.mjs";
import { drawableLinks, drawablePoints, revealProgress, revealCutoff } from "../../science/causal-sets.mjs";
import * as TK from "../../design/tokens.mjs";

const tokenColor = (name) => new Color().fromArray(TK.linearRef(name));

const HEIGHT = 5.6;
const WIDTH = 2.5;
/** Reveal length in milliseconds; the caller snaps to the end when reduced motion is on. */
export const REVEAL_MS = 900;

/** Fixed 4D→3D projection frame (deterministic, so the same seed always draws the same picture). */
const PROJECT_R0 = [0.8607, -0.4173, 0.2905];
const PROJECT_R2 = [-0.2384, -0.1645, 0.9571];

export function createCausalSetRuntime({ run, dim = 2, showLinks = true, engraved, reveal = "auto" } = {}) {
  if (!engraved) throw new TypeError("createCausalSetRuntime needs ctx.engraved (the scene's engraved line API)");
  if (!run || !Array.isArray(run.points) || run.points.length < 2) {
    throw new TypeError("createCausalSetRuntime needs a sprinkle run");
  }
  const group = new Group();
  group.name = "causal-set-lab";
  const n = run.points.length;

  // One projection shared by points, links and chain, so an endpoint and its line always coincide.
  const project = (p) => {
    const y = (p.t - 0.5) * HEIGHT;
    if (dim === 2) return [(p.x / 0.5) * WIDTH, y, 0];
    const k = WIDTH / 0.5;
    return [
      (PROJECT_R0[0] * p.x + PROJECT_R0[1] * p.y + PROJECT_R0[2] * p.z) * k,
      y,
      (PROJECT_R2[0] * p.x + PROJECT_R2[1] * p.y + PROJECT_R2[2] * p.z) * k,
    ];
  };

  const all = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const [x, y, z] = project(run.points[i]);
    all[i * 3] = x; all[i * 3 + 1] = y; all[i * 3 + 2] = z;
  }

  // ---- points: a strided subset, 2 px discs, chain members tinted gold through the colour array ----
  const draw = drawablePoints(run);
  const chainSet = new Set(run.chain.indices);
  const positions = new Float32Array(draw.indices.length * 3);
  const colors = new Float32Array(draw.indices.length * 3);
  const base = tokenColor("pigment-blue-78-c08");
  const gold = tokenColor("lab-gold");
  draw.indices.forEach((id, k) => {
    positions[k * 3] = all[id * 3]; positions[k * 3 + 1] = all[id * 3 + 1]; positions[k * 3 + 2] = all[id * 3 + 2];
    const c = chainSet.has(id) ? gold : base;
    colors[k * 3] = c.r; colors[k * 3 + 1] = c.g; colors[k * 3 + 2] = c.b;
  });
  const pointKit = createDataPoints({ positions, colors, sizePx: 2.2, opacity: 0.92, profile: "disc" });
  const points = pointKit.object;
  points.frustumCulled = false;
  group.add(tag(points, "data"));

  // ---- links: strided down to a legible count, hairline width, depth fade ----
  const linkDraw = drawableLinks(run);
  let linkLine = null;
  if (showLinks && linkDraw.links.length) {
    const pairs = new Float32Array(linkDraw.links.length * 6);
    linkDraw.links.forEach(([a, b], i) => {
      pairs[i * 6] = all[a * 3]; pairs[i * 6 + 1] = all[a * 3 + 1]; pairs[i * 6 + 2] = all[a * 3 + 2];
      pairs[i * 6 + 3] = all[b * 3]; pairs[i * 6 + 4] = all[b * 3 + 1]; pairs[i * 6 + 5] = all[b * 3 + 2];
    });
    linkLine = engraved.segments(pairs, {
      color: "pigment-blue-54", opacity: 0.22,
      widthPx: engraved.WIDTH_PX.hairline, depthFade: [7, 18], layer: "model",
    });
    linkLine.frustumCulled = false;
    group.add(linkLine);
  }

  // ---- the longest chain: the one focal curve the figure is about ----
  let chainLine = null;
  if (run.chain.indices.length > 1) {
    const cpts = new Float32Array(run.chain.indices.length * 3);
    run.chain.indices.forEach((id, i) => {
      cpts[i * 3] = all[id * 3]; cpts[i * 3 + 1] = all[id * 3 + 1]; cpts[i * 3 + 2] = all[id * 3 + 2];
    });
    chainLine = engraved.line(cpts, {
      color: "lab-gold", opacity: 0.95, widthPx: engraved.WIDTH_PX.focal, layer: "data", halo: 0.08,
    });
    chainLine.frustumCulled = false;
    group.add(chainLine);
  }

  // ---- the diamond boundary as engraved light cones ----
  const coneA = engraved.line(new Float32Array([-WIDTH, HEIGHT / 2, 0, 0, -HEIGHT / 2, 0]), {
    color: "pigment-blue-64", opacity: 0.5, widthPx: engraved.WIDTH_PX.hairline, layer: "model",
  });
  const coneB = engraved.line(new Float32Array([WIDTH, HEIGHT / 2, 0, 0, -HEIGHT / 2, 0]), {
    color: "pigment-blue-64", opacity: 0.5, widthPx: engraved.WIDTH_PX.hairline, layer: "model",
  });
  coneA.frustumCulled = false; coneB.frustumCulled = false;
  group.add(tag(coneA, "model"));
  group.add(tag(coneB, "model"));

  // ---- reveal: points and links appear along time, the chain draws last ----
  let elapsed = reveal === "auto" ? 0 : REVEAL_MS;
  let progress = reveal === "auto" ? 0 : 1;
  const applyReveal = () => {
    if (progress >= 1) {
      pointKit.setCount(pointKit.count);
      if (linkLine) linkLine.geometry.instanceCount = linkDraw.links.length;
      if (chainLine) chainLine.geometry.instanceCount = Math.max(0, run.chain.indices.length - 1);
      return;
    }
    pointKit.setCount(revealCutoff(pointKit.count, progress));
    if (linkLine) linkLine.geometry.instanceCount = revealCutoff(linkDraw.links.length, progress);
    if (chainLine) chainLine.geometry.instanceCount = revealCutoff(run.chain.indices.length - 1, Math.max(0, progress * 1.4 - 0.4));
  };
  applyReveal();

  return {
    group,
    revealMs: REVEAL_MS,
    /** Advance the reveal; returns true while it still owes frames. */
    tick: (dtMs) => {
      if (progress >= 1) return false;
      elapsed += Math.max(0, Number(dtMs) || 0);
      progress = revealProgress(elapsed, REVEAL_MS);
      applyReveal();
      return progress < 1;
    },
    completeReveal: () => { elapsed = REVEAL_MS; progress = 1; applyReveal(); },
    stats: () => ({
      n, dim, links: run.links.length, chain: run.chain.length,
      orderingFraction: run.orderingFraction,
      dimension: run.myrheimMeyer.dim,
      // What is on screen right now, versus the budgeted totals the picture is drawn from.
      drawnPoints: points.count,
      drawnLinks: linkLine ? linkLine.geometry.instanceCount : 0,
      budgetPoints: pointKit.count,
      budgetLinks: linkDraw.shown,
      linkStride: linkDraw.stride,
      reveal: progress,
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
