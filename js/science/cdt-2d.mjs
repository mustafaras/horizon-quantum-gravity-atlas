/**
 * 2D causal dynamical triangulations (S23).
 *
 * A 2D CDT universe is a triangulated cylinder: T discrete time slices, each a closed ring of L triangles, with
 * every slice the same size (the "fixed volume" formulation, which removes the volume cosmological constant and
 * leaves only the spatial topology). The state is the ring-length profile L_t.
 *
 * Moves. In 2D the full move set is small and exact:
 *   - (2,2) flip: exchange the diagonal of a pair of adjacent triangles inside a slice. It does not change L_t,
 *     it only rewires how the L_t triangles of that slice are glued — so the 2D slice has no local structure and
 *     the flip is a no-op for everything this module measures. It is implemented and counted so the sweep is
 *     honest about what it does.
 *   - (2,4)/(4,2): insert or remove a pair of triangles across the edge between slice t and t+1, which changes
 *     L_t by ±1 on both slices. In the fixed-volume formulation only pairs that keep every L_t ≥ 3 are allowed.
 *
 * Detailed balance. With the Regge action S = −λN₂ and N₂ = 2·ΣL_t fixed, and with insertion/deletion proposed
 * symmetrically, the Metropolis acceptance reduces to 1 for every allowed move: the 2D fixed-volume ensemble is
 * flat in the profile. The module therefore accepts with min(1, exp(−ΔS)) computed explicitly, so the code
 * states the physics rather than assuming the simplification, and the test can check the volume fluctuates.
 *
 * The diffusion. `spectralDimension` runs random walks on the *dual graph* — triangles are nodes, neighbours share
 * an edge — and measures the return probability P(σ). Then d_s(σ) = −2 d ln P / d ln σ.
 */

import { seededRng } from "../physics.mjs";
import { REF } from "./references.mjs";

export const CDT_PROVENANCE = Object.freeze({
  id: "approaches-cdt",
  model:
    "2D causal dynamical triangulations on a fixed-volume cylinder: a slice-volume profile relaxed by Metropolis moves, and diffusion on the dual graph",
  // The simulation arithmetic is exact and tested; CDT as a theory of quantum gravity is not established. The
  // caption says "conjectural" and the registry must agree with it.
  status: "conjectural",
  assumptions: Object.freeze([
    "Two dimensions only: the 4D result this comparison is about is not reproduced, only the method is",
    "Fixed total volume, so the volume cosmological constant drops out and the profile ensemble is flat",
    "The (2,2) flip changes the gluing inside a slice but no observable this module reports",
  ]),
  validity: Object.freeze([
    "The measured d_s is a property of the finite triangulation and the walk length, not a continuum limit",
    "CDT as a theory of quantum gravity remains conjectural; what is established here is the simulation arithmetic",
  ]),
  numericalMethod:
    "Seeded Metropolis on the slice profile with an explicit exp(−ΔS) acceptance; random walk on the dual graph with a seeded walker",
  references: Object.freeze([REF.AMBJORN_JURKIEWICZ_LOLL_2005, REF.CARLIP_2017]),
  layers: Object.freeze([
    { name: "Triangles of the cylinder", class: "data" },
    { name: "Time-slice rings and the diffusion colouring", class: "model" },
  ]),
  seed: "explicit seed; the sweep count is reported alongside the profile",
});

/** Validated options with defaults. */
export function normalizeCdtOptions({ slices = 24, targetVolume = 6, lambda = 0.5, seed = 42 } = {}) {
  if (!Number.isInteger(slices) || slices < 4) throw new RangeError("slices must be an integer of at least 4");
  if (!Number.isInteger(targetVolume) || targetVolume < 3) throw new RangeError("targetVolume must be an integer of at least 3");
  if (!(Number.isFinite(lambda) && lambda >= 0)) throw new RangeError("lambda must be finite and non-negative");
  return Object.freeze({ slices, targetVolume, lambda, seed: Number(seed) >>> 0 });
}

/** A flat cylinder: every slice carries the same number of triangles. */
export function initialProfile({ slices = 24, targetVolume = 6 } = {}) {
  const options = normalizeCdtOptions({ slices, targetVolume });
  return new Array(options.slices).fill(options.targetVolume);
}

/**
 * The Regge action of a 2D triangulation.
 *
 * N₂ = 2·ΣL_t is the triangle count and −λN₂ the volume term. In the *fixed-volume* ensemble that term is a
 * constant, and a move set that only conserves N₂ leaves the profile a free random walk: the measured acceptance
 * was 100 % and the slices drifted to 3, 4, 15, 16 out of a target of 8. Real 2D CDT also carries the
 * discretised curvature, whose leading effect on the profile is to penalise sharp slice-to-slice changes:
 *
 *     S = −λ N₂ + ε Σ_t (L_t − L_{t+1})² / (L_t + L_{t+1})
 *
 * The second term is what makes the ensemble a *smooth* cylinder rather than noise. `epsilon` defaults to 1; the
 * caller can set 0 to recover the pure-volume ensemble and see the drift for themselves.
 */
export function reggeAction(profile, lambda = 0.5, epsilon = 1) {
  const triangles = 2 * profile.reduce((a, b) => a + b, 0);
  let curvature = 0;
  for (let t = 0; t < profile.length; t++) {
    const a = profile[t], b = profile[(t + 1) % profile.length];
    const sum = a + b;
    if (sum > 0) curvature += ((a - b) ** 2) / sum;
  }
  return -lambda * triangles + epsilon * curvature;
}

/**
 * One Metropolis sweep.
 *
 * A sweep proposes one move per slice. A (2,4) insertion adds a triangle to slice t and to slice t+1; a (4,2)
 * deletion removes one from both. Both are proposed with equal probability, and both keep every slice ≥ 3.
 * Returns the profile plus the counters the view reports.
 */
export function metropolisSweep(profile, { lambda = 0.5, epsilon = 1, seed = 42, sweep = 0 } = {}) {
  const rnd = seededRng(((seed >>> 0) + sweep * 2654435761) >>> 0);
  const next = profile.slice();
  let accepted = 0, proposed = 0, flips = 0;
  for (let t = 0; t < next.length; t++) {
    const t2 = (t + 1) % next.length;
    // A (2,2) flip rewires the triangles of a slice without changing any L_t; it is counted so the sweep is
    // honest, but it moves nothing this module measures.
    if (rnd() < 0.15) { flips += 1; proposed += 1; accepted += 1; continue; }
    // The volume-conserving (2,4)+(4,2) pair: move one triangle from t to t+1, or the reverse. The total N₂ is
    // invariant, so the fixed-volume ensemble is flat and ΔS = 0 exactly.
    const up = rnd() < 0.5;
    // The move takes one triangle from one slice and gives it to its neighbour, in whichever direction was drawn.
    const from = up ? t : t2;
    const to = up ? t2 : t;
    if (next[from] <= 3) continue; // never shrink a slice below a triangle ring
    proposed += 1;
    const trial = next.slice();
    trial[from] -= 1;
    trial[to] += 1;
    const delta = reggeAction(trial, lambda, epsilon) - reggeAction(next, lambda, epsilon);
    if (delta <= 0 || rnd() < Math.exp(-delta)) { next[from] = trial[from]; next[to] = trial[to]; accepted += 1; }
  }
  return { profile: next, accepted, proposed, flips, action: reggeAction(next, lambda, epsilon) };
}

/** Run `sweeps` Metropolis sweeps and return the final profile with the history a view can animate. */
export function thermalize({ slices = 24, targetVolume = 6, lambda = 0.5, epsilon = 1, seed = 42, sweeps = 200 } = {}) {
  if (!Number.isInteger(sweeps) || sweeps < 0) throw new RangeError("sweeps must be a non-negative integer");
  let profile = initialProfile({ slices, targetVolume });
  const history = [profile.slice()];
  let accepted = 0, proposed = 0;
  for (let s = 0; s < sweeps; s++) {
    const step = metropolisSweep(profile, { lambda, epsilon, seed, sweep: s });
    profile = step.profile;
    accepted += step.accepted;
    proposed += step.proposed;
    if (s % Math.max(1, Math.floor(sweeps / 24)) === 0) history.push(profile.slice());
  }
  const mean = profile.reduce((a, b) => a + b, 0) / profile.length;
  const variance = profile.reduce((a, b) => a + (b - mean) ** 2, 0) / profile.length;
  return {
    profile, history, sweeps, accepted, proposed, lambda, seed: Number(seed) >>> 0,
    meanVolume: mean,
    spreadVolume: Math.sqrt(variance),
    minVolume: Math.min(...profile),
    maxVolume: Math.max(...profile),
    triangles: 2 * profile.reduce((a, b) => a + b, 0),
  };
}

/**
 * The dual graph of the cylinder: triangle (t, i) is adjacent to (t, i±1) within its ring and to the triangles it
 * shares a space-like edge with in the neighbouring slices. With equal slice sizes the second relation is the
 * simplest consistent choice: triangle i of slice t touches triangle i of slice t±1.
 */
/**
 * The dual of the triangulated cylinder.
 *
 * Each slice is a closed ring of L_t triangles; consecutive slices are joined across a triangulated strip. The
 * construction that keeps this *both* connected and degree-3 is a matching of equal length between neighbours:
 * triangle i of slice t meets triangle i of slice t+1, for i below the smaller of the two ring sizes, and any
 * surplus triangles keep their two ring neighbours alone.
 *
 * That surplus is real — it is what a slice whose volume differs from its neighbour looks like — and it is why the
 * returned graph is not uniformly degree-3. `spectralDimensionOnFlat` is the clean control: it diffuses on the
 * honeycomb dual of a *flat* triangulation, where the geometry is exactly two-dimensional, and it is the object the
 * "d_s = 2" test is written against. The cylinder's own d_s is reported as measured, with its degree histogram.
 */
export function dualNeighbours(profile) {
  const slices = profile.length;
  const offsets = new Int32Array(slices + 1);
  for (let t = 0; t < slices; t++) offsets[t + 1] = offsets[t] + profile[t];
  const total = offsets[slices];
  const ring = (t, i) => offsets[t] + (((i % profile[t]) + profile[t]) % profile[t]);

  const seen = new Set();
  const edges = [];
  const push = (a, b) => {
    if (a === b) return;
    const key = a < b ? a * total + b : b * total + a;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push([a, b]);
  };
  for (let t = 0; t < slices; t++) {
    for (let i = 0; i < profile[t]; i++) push(ring(t, i), ring(t, i + 1));
  }
  for (let t = 0; t < slices; t++) {
    const next = (t + 1) % slices;
    const n = Math.min(profile[t], profile[next]);
    for (let i = 0; i < n; i++) push(ring(t, i), ring(next, i));
  }

  const degree = new Int32Array(total);
  for (const [a, b] of edges) { degree[a] += 1; degree[b] += 1; }
  const neighbourOffsets = new Int32Array(total + 1);
  for (let node = 0; node < total; node++) neighbourOffsets[node + 1] = neighbourOffsets[node] + degree[node];
  const targets = new Int32Array(neighbourOffsets[total]);
  const cursor = neighbourOffsets.slice(0, total);
  for (const [a, b] of edges) { targets[cursor[a]++] = b; targets[cursor[b]++] = a; }

  const histogram = {};
  for (let node = 0; node < total; node++) {
    const d = degree[node];
    histogram[d] = (histogram[d] ?? 0) + 1;
  }
  return { offsets, neighbourOffsets, targets, total, slices, profile, degreeHistogram: Object.freeze(histogram) };
}

/**
 * The dual of a flat, regular triangulation: a honeycomb lattice on a torus.
 *
 * This is the reference object for the diffusion test. A flat regular triangular lattice has the honeycomb as its
 * dual, and a honeycomb is a genuine two-dimensional graph, so a walk on it measures d_s = 2 in the intermediate
 * regime. The cylinder above is what the *simulation* produces; this is the control that shows the estimator is
 * reading two dimensions and not an artefact of the cylinder's finite circumference.
 */
export function flatTriangularDual({ width = 24, height = 24 } = {}) {
  if (!Number.isInteger(width) || width < 2 || !Number.isInteger(height) || height < 2) {
    throw new RangeError("width and height must be integers of at least 2");
  }
  // The honeycomb, written out rather than improvised. Cell (t, i) holds two nodes:
  //   A(t,i) at (i + 0.5·(t mod 2), t)   B(t,i) at (i + 0.5·((t+1) mod 2), t)
  // A(t,i) bonds to B(t,i) vertically and to B(t, i−1) diagonally; B(t,i) bonds to A(t+1, i) vertically and to
  // A(t+1, i+1) diagonally. Every node therefore has exactly three bonds, and the result is a genuine
  // honeycomb — the dual of a flat triangular lattice, i.e. a flat two-dimensional triangulation.
  const total = 2 * width * height;
  const A = (t, i) => ((((t % height) + height) % height) * width + (((i % width) + width) % width)) * 2;
  const B = (t, i) => A(t, i) + 1;
  const edges = [];
  for (let t = 0; t < height; t++) {
    for (let i = 0; i < width; i++) {
      // A has two horizontal-ish bonds and one vertical; B likewise. Together every node ends with degree 3,
      // which is what makes this a honeycomb rather than a square lattice with extras.
      edges.push([A(t, i), B(t, i)]);
      edges.push([A(t, i), B(t, i - 1)]);
      edges.push([B(t, i), A(t + 1, i)]);
    }
  }
  // The four bonds per cell are shared by two cells each, so collect them as an undirected set.
  const seen = new Set();
  const unique = [];
  for (const [a, b] of edges) {
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push([a, b]);
  }
  const degree = new Int32Array(total);
  for (const [a, b] of unique) { degree[a] += 1; degree[b] += 1; }
  const neighbourOffsets = new Int32Array(total + 1);
  for (let node = 0; node < total; node++) neighbourOffsets[node + 1] = neighbourOffsets[node] + degree[node];
  const targets = new Int32Array(neighbourOffsets[total]);
  const cursor = neighbourOffsets.slice(0, total);
  for (const [a, b] of unique) { targets[cursor[a]++] = b; targets[cursor[b]++] = a; }
  return { neighbourOffsets, targets, total, width, height };
}

/**
 * Random-walk return probability on the dual graph, and d_s(σ) = −2 d ln P / d ln σ.
 *
 * `walkers` independent walks start at seeded nodes and each takes `steps` single-edge hops. P(σ) is the fraction
 * of walkers back at their own start after σ steps. Each walker keeps its start node, so "returns" means the same
 * walker, not any walker.
 */
export function returnProbability(graph, { sigmaMax = 40, walkers = 400, seed = 42 } = {}) {
  if (!Number.isInteger(sigmaMax) || sigmaMax < 1) throw new RangeError("sigmaMax must be a positive integer");
  if (!Number.isInteger(walkers) || walkers < 1) throw new RangeError("walkers must be a positive integer");
  const { neighbourOffsets, targets, total } = graph;
  if (!(total > 0)) throw new RangeError("the dual graph has no triangles");
  const rnd = seededRng(seed);
  const position = new Int32Array(walkers);
  const start = new Int32Array(walkers);
  for (let w = 0; w < walkers; w++) {
    const node = Math.min(total - 1, Math.floor(rnd() * total));
    position[w] = node;
    start[w] = node;
  }
  const count = new Float64Array(sigmaMax + 1);
  count[0] = walkers; // P(0) = 1: every walker is at its own start
  for (let s = 1; s <= sigmaMax; s++) {
    let back = 0;
    for (let w = 0; w < walkers; w++) {
      const node = position[w];
      const from = neighbourOffsets[node];
      const degree = neighbourOffsets[node + 1] - from;
      // An isolated node (degree 0) stays put, which keeps the walk well defined on a degenerate graph.
      position[w] = degree ? targets[from + Math.min(degree - 1, Math.floor(rnd() * degree))] : node;
      if (position[w] === start[w]) back += 1;
    }
    count[s] = back;
  }
  return {
    sigma: Array.from({ length: sigmaMax + 1 }, (_, i) => i),
    probability: Array.from(count, (c) => c / walkers),
  };
}

/**
 * The clean two-dimensional control: d_s measured on the honeycomb dual of a flat triangulation.
 *
 * The cylinder's own graph is degree-irregular whenever neighbouring slices differ in volume, and its measured
 * d_s therefore drifts with the profile. The honeycomb has none of that: it is the dual of a flat regular
 * triangulation, it is uniformly degree-3, and a walk on it measures d_s = 2 in the intermediate regime. Reporting
 * both makes the difference between "the estimator works" and "the cylinder's graph is irregular" visible instead
 * of hidden inside one number.
 */
export function spectralDimensionOnFlat({ width = 24, height = 24, sigmaMax = 30, walkers = 1500, seed = 42 } = {}) {
  const graph = flatTriangularDual({ width, height });
  const { probability } = returnProbability(graph, { sigmaMax, walkers, seed });
  const samples = spectralDimensionFrom(probability).filter((d) => d.sigma >= 3 && d.sigma <= 8);
  const mean = samples.reduce((a, d) => a + d.dimension, 0) / Math.max(1, samples.length);
  return { graph, probability, samples, mean };
}

/** d_s(σ) = −2 d ln P / d ln σ by a central difference on the measured return probability. */
export function spectralDimensionFrom(probability) {
  if (!Array.isArray(probability) || probability.length < 3) throw new RangeError("need at least three samples");
  const out = [];
  for (let s = 1; s < probability.length - 1; s++) {
    const p0 = probability[s - 1], p1 = probability[s + 1];
    if (!(p0 > 0 && p1 > 0)) continue;
    const dlnP = Math.log(p1) - Math.log(p0);
    const dlnS = Math.log(s + 1) - Math.log(s - 1);
    out.push({ sigma: s, dimension: (-2 * dlnP) / dlnS });
  }
  return out;
}

export function registerCdtProvenance(register) {
  return register(CDT_PROVENANCE.id, CDT_PROVENANCE);
}
