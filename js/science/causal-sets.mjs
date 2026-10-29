/**
 * Causal sets (S22): a quantum-gravity program you can compute in the browser.
 *
 * A causal set is a locally finite partial order. The central conjecture (Hauptvermutung) is that a causal set
 * well approximates a Lorentzian manifold when its elements are Poisson-sprinkled into that manifold, with the
 * order inherited from the light cones. Two independent estimators recover the dimension of that manifold from
 * the order alone:
 *
 *   - Myrheim–Meyer: a sprinkling into d dimensions orders a fraction
 *       f(d) = Γ(d+1) Γ(d/2) / (2 Γ(3d/2))
 *     of its pairs. Inverting f numerically from the measured ordering fraction yields d.
 *       f(2) = 1/2, f(3) = 8/35, f(4) = 1/10.
 *   - Longest chain / proper time: the longest chain in a sprinkling grows as N^(1/d), and the longest chain
 *     between two elements estimates the proper time between them — the order alone carries the metric.
 *
 * References: Bombelli, Lee, Meyer & Sorkin (1987) and Surya (2019), both cited through js/science/references.mjs.
 * The Myrheim (CERN-TH-2538, 1978) and Meyer (Hamburg, 1988) results are print-only; their closed form is
 * reproduced and tested here, but they are not cited as links because no resolvable identifier was verified.
 *
 * Everything here is pure and DOM-free: it imports in Node without React, canvas or three.js.
 */

import { seededRng } from "../physics.mjs";
import { REF } from "./references.mjs";

export const CAUSAL_SET_PROVENANCE = Object.freeze({
  id: "approaches-causal-set",
  model:
    "Poisson sprinkling into a causal diamond of Minkowski spacetime, with the causal order as the only structure; dimension and proper time recovered from the order",
  status: "conjectural",
  assumptions: Object.freeze([
    "Points are Poisson-sprinkled uniformly in a causal diamond of unit height; the continuum manifold is assumed, not derived",
    "The Myrheim–Meyer estimator is a statistical dimension estimator, exact only in the infinite-density limit",
    "The longest-chain proper-time estimate carries an O(N^(-1/d)) statistical spread and a model-dependent constant",
    "The 4D scene shows a 3D projection; drawing is not a faithful embedding of four dimensions",
  ]),
  validity: Object.freeze([
    "The estimators are demonstrated on sprinkled Minkowski space, not on a curved or dynamical spacetime",
    "Whether a causal set really underlies our universe is an open conjecture: no experiment discriminates it",
  ]),
  numericalMethod:
    "Seeded Poisson sprinkling (js/physics.mjs seededRng), Uint32Array bitset causal matrix, transitive reduction by link test, longest chain by DP over a topological order; Myrheim–Meyer f(d) inverted by bisection",
  references: Object.freeze([
    REF.BLMS_1987,
    REF.SURYA_2019,
  ]),
  layers: Object.freeze([
    { name: "Sprinkled elements, causal links and the longest chain", class: "data" },
    { name: "Diamond boundary, light cones and the 3D projection", class: "model" },
    { name: "Point glow and the constellation backdrop", class: "decoration" },
  ]),
  seed: "explicit seed control (default 42), shared by the sprinkling and every derived estimator",
});

/** Ordering fraction of a Poisson sprinkling in d dimensions: f(d) = Γ(d+1)Γ(d/2)/(2Γ(3d/2)). */
export function orderingFractionTheory(dim) {
  return lanczosGamma(dim + 1) * lanczosGamma(dim / 2) / (2 * lanczosGamma((3 * dim) / 2));
}

/** Lanczos approximation (g=7, n=9) of Γ(x) for x > 0; accurate to ~1e-13 over the range used here. */
function lanczosGamma(x) {
  if (!(x > 0)) throw new RangeError("gamma needs a positive argument");
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * lanczosGamma(1 - x));
  const z = x - 1;
  let a = c[0];
  const t = z + g + 0.5;
  for (let i = 1; i < c.length; i++) a += c[i] / (z + i);
  return Math.sqrt(2 * Math.PI) * t ** (z + 0.5) * Math.exp(-t) * a;
}

/**
 * Invert the Myrheim–Meyer relation: the dimension whose sprinkling orders `fraction` of its pairs.
 * Bisection on [1, 12]; f is strictly decreasing there (1 → 0). Outside the bracket the result is clamped and
 * flagged, so the caller can say the estimate left the fitted range instead of inventing a dimension.
 */
export function dimensionFromOrderingFraction(fraction) {
  if (!(Number.isFinite(fraction) && fraction > 0 && fraction < 1)) {
    throw new RangeError("ordering fraction must be strictly inside (0, 1)");
  }
  let lo = 1, hi = 12;
  if (fraction >= orderingFractionTheory(lo)) return { dim: lo, clamped: "high" };
  if (fraction <= orderingFractionTheory(hi)) return { dim: hi, clamped: "low" };
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (orderingFractionTheory(mid) > fraction) lo = mid; else hi = mid;
  }
  return { dim: (lo + hi) / 2, clamped: null };
}

/**
 * Poisson-sprinkle `n` points into a causal diamond of unit height.
 *
 * 2D: uniform in light-cone coordinates (u, v) over the unit square, with u = t + x and v = t − x. The square
 * maps exactly onto the diamond: t = (u+v)/2 ∈ [0,1] and |x| = |u−v|/2 ≤ min(t, 1−t). The causal order is then
 * the product order u_i ≤ u_j and v_i ≤ v_j, which implies both dt ≥ 0 and |dx| ≤ dt — the light-cone condition.
 * (Sorting u and v into high/low instead would fold the order and destroy the very information being measured.)
 *
 * 4D: uniform with respect to the flat volume element inside the diamond. The cross-section at time t is a
 * 3-ball of radius min(t, 1−t), so its volume grows as r³. Drawing t uniformly and then r uniformly inside that
 * ball is *not* volume-uniform: it over-samples small t, where the ball is small, and the ordering fraction
 * comes out near 0.49 instead of 1/10. t is therefore drawn with density ∝ min(t, 1−t)³ — by rejection, which
 * keeps the routine seed-reproducible and exact — and the radius then follows r = r_max·∛u.
 */
export function sprinkle({ dim = 2, n = 200, seed = 42 } = {}) {
  if (dim !== 2 && dim !== 4) throw new RangeError("dim must be 2 or 4");
  if (!Number.isInteger(n) || n < 2 || n > 20000) throw new RangeError("n must be an integer in [2, 20000]");
  const rnd = seededRng(seed);
  const points = [];
  if (dim === 2) {
    for (let i = 0; i < n; i++) {
      const u = rnd(), v = rnd();
      points.push({ t: (u + v) / 2, x: (u - v) / 2, y: 0, z: 0 });
    }
  } else {
    const peak = 0.5 ** 3; // min(t, 1−t)³ at its maximum, t = 1/2
    for (let i = 0; i < n; i++) {
      let t, rMax;
      // Rejection against the true volume weight min(t, 1−t)³; the mean acceptance is 1/4.
      for (let guard = 0; guard < 10000; guard++) {
        t = rnd();
        rMax = Math.min(t, 1 - t);
        if (rnd() <= (rMax / 0.5) ** 3) break;
      }
      const r = rMax * Math.cbrt(rnd());
      const cosT = 2 * rnd() - 1;
      const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
      const phi = 2 * Math.PI * rnd();
      points.push({ t, x: r * sinT * Math.cos(phi), y: r * sinT * Math.sin(phi), z: r * cosT });
      void peak;
    }
  }
  return points;
}

/** Causal order for a sprinkle: i ≺ j when j is in i's future light cone (timelike separation). */
export function causalMatrix(points) {
  const n = points.length;
  const words = Math.ceil(n / 32) || 1;
  const rows = new Uint32Array(n * words);

  // Coordinates in typed arrays: the build is O(N²) and property access dominates it otherwise.
  const ts = new Float64Array(n), xs = new Float64Array(n), ys = new Float64Array(n), zs = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const p = points[i];
    ts[i] = p.t; xs[i] = p.x; ys[i] = p.y ?? 0; zs[i] = p.z ?? 0;
  }

  // Visit candidates in increasing time: a point can only precede a later one, so the inner loop is the suffix
  // that starts at i in time order rather than the whole set. That halves the work for a sprinkle and lets the
  // inner test bail out on dt before touching the spatial coordinates.
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => ts[a] - ts[b] || a - b);

  for (let rank = 0; rank < n; rank++) {
    const i = order[rank];
    const ti = ts[i], xi = xs[i], yi = ys[i], zi = zs[i];
    const base = i * words;
    for (let k = rank + 1; k < n; k++) {
      const j = order[k];
      const dt = ts[j] - ti;
      if (dt <= 0) continue;
      const dx = xs[j] - xi, dy = ys[j] - yi, dz = zs[j] - zi;
      if (dt * dt <= dx * dx + dy * dy + dz * dz) continue;
      // OR directly into the row word: candidates arrive in index order, so a buffered word cannot be shared.
      rows[base + (j >> 5)] |= 1 << (j & 31);
    }
  }
  return { rows, words, n };
}

/** True when element i precedes j in the stored matrix. */
export function isRelated(matrix, i, j) {
  return (matrix.rows[i * matrix.words + (j >> 5)] & (1 << (j & 31))) !== 0;
}

/** Successor lists from the bitset rows: the O(N²/32) scan happens once and every consumer reuses it. */
export function buildSuccessors(matrix) {
  const { n, words, rows } = matrix;
  const succ = new Array(n);
  for (let i = 0; i < n; i++) {
    const list = [];
    const base = i * words;
    for (let w = 0; w < words; w++) {
      let bits = rows[base + w];
      while (bits !== 0) {
        // Lowest set bit -> element index; clearing it keeps the loop at one iteration per relation.
        const bit = bits & -bits;
        list.push((w << 5) + (31 - Math.clz32(bit)));
        bits ^= bit;
      }
    }
    succ[i] = list;
  }
  return succ;
}

/**
 * Transitive reduction: the relations that are not implied by a longer path.
 *
 * i ≺ j is a link when no k satisfies i ≺ k ≺ j. Candidates are walked in increasing time order, which makes the
 * test exact and cheap: if such a k exists then t_k < t_j, so k was processed first. Either k was itself a cover
 * — its row was unioned into `reach` — or k was already in `reach`, which by transitivity already held every
 * descendant of k, j included. So a related j still absent from `reach` when its turn comes is a genuine cover.
 *
 * Walking a precomputed time order and testing membership with a single bit costs O(N) bit tests per element,
 * instead of sorting each element's successor list — which is what kept the dense 2D case over budget.
 */
export function links(matrix, points = null) {
  const { n, words, rows } = matrix;
  if (!points) throw new TypeError("links needs the points to order the candidates by time");
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => points[a].t - points[b].t || a - b);
  const reach = new Uint32Array(words);
  const out = [];
  for (let i = 0; i < n; i++) {
    const base = i * words;
    reach.fill(0);
    for (let pos = 0; pos < n; pos++) {
      const j = order[pos];
      if (j === i) continue;
      if ((rows[base + (j >> 5)] & (1 << (j & 31))) === 0) continue; // not a relation
      if ((reach[j >> 5] & (1 << (j & 31))) !== 0) continue; // already implied by a path
      out.push([i, j]);
      const below = j * words;
      for (let w = 0; w < words; w++) reach[w] |= rows[below + w];
    }
  }
  return out;
}

/** Number of related pairs (i ≺ j), counted once per ordered pair. */
export function relationCount(matrix) {
  const { n, words, rows } = matrix;
  let count = 0;
  for (let i = 0; i < n; i++) {
    const base = i * words;
    for (let w = 0; w < words; w++) {
      let bits = rows[base + w];
      while (bits !== 0) { bits &= bits - 1; count++; }
    }
  }
  return count;
}

/**
 * Longest chain by dynamic programming over a causal (topological) order.
 *
 * The order is by time, with ties broken by index; because a point can only precede a later-in-time point, that
 * is a valid topological order for any sprinkle. The DP walks each element's successor list once, so the cost is
 * O(N + relations) rather than O(N²) — the difference matters at N = 4000.
 */
export function longestChain(matrix, points) {
  const { n } = matrix;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => points[a].t - points[b].t || a - b);
  const rank = new Int32Array(n);
  order.forEach((id, pos) => { rank[id] = pos; });
  const succ = buildSuccessors(matrix);
  const succByRank = new Array(n);
  for (let pos = 0; pos < n; pos++) succByRank[pos] = succ[order[pos]].map((j) => rank[j]);
  const best = new Int32Array(n).fill(1);
  const prev = new Int32Array(n).fill(-1);
  for (let pos = 0; pos < n; pos++) {
    const nexts = succByRank[pos];
    for (let idx = 0; idx < nexts.length; idx++) {
      const next = nexts[idx];
      if (best[pos] + 1 > best[next]) { best[next] = best[pos] + 1; prev[next] = pos; }
    }
  }
  let endPos = 0;
  for (let pos = 1; pos < n; pos++) if (best[pos] > best[endPos]) endPos = pos;
  const chain = [];
  for (let pos = endPos; pos !== -1; pos = prev[pos]) chain.push(order[pos]);
  chain.reverse();
  return { length: best[endPos], indices: chain };
}

/**
 * The full estimator bundle for one sprinkle: ordering fraction, Myrheim–Meyer dimension, longest chain and the
 * link count. This is the object the lab and the tests read.
 */
export function estimate({ dim = 2, n = 200, seed = 42 } = {}) {
  const points = sprinkle({ dim, n, seed });
  const matrix = causalMatrix(points);
  const pairs = (n * (n - 1)) / 2;
  const relations = relationCount(matrix);
  const fraction = relations / pairs;
  const dimension = dimensionFromOrderingFraction(fraction);
  const linksOut = links(matrix, points);
  const chain = longestChain(matrix, points);
  return {
    dim, n, seed, points, matrix,
    relations, pairs, orderingFraction: fraction,
    myrheimMeyer: { dim: dimension.dim, clamped: dimension.clamped, expected: orderingFractionTheory(dim) },
    links: linksOut,
    chain,
  };
}

/**
 * Run the estimator over several seeds and return the mean and spread, which is what the readout reports:
 * a single sprinkle is one draw, and quoting one draw without its spread would overstate the precision.
 */
export function ensemble({ dim = 2, n = 200, seeds = 5, firstSeed = 42 } = {}) {
  if (!Number.isInteger(seeds) || seeds < 1) throw new RangeError("seeds must be a positive integer");
  const runs = [];
  for (let i = 0; i < seeds; i++) runs.push(estimate({ dim, n, seed: firstSeed + i }));
  const dims = runs.map((r) => r.myrheimMeyer.dim);
  const mean = dims.reduce((a, b) => a + b, 0) / dims.length;
  const variance = dims.reduce((a, b) => a + (b - mean) ** 2, 0) / dims.length;
  const chains = runs.map((r) => r.chain.length);
  return {
    dim, n, seeds, runs, dims,
    meanDimension: mean,
    spreadDimension: Math.sqrt(variance),
    minDimension: Math.min(...dims),
    maxDimension: Math.max(...dims),
    meanChain: chains.reduce((a, b) => a + b, 0) / chains.length,
    chainLengths: chains,
  };
}

/** Least-squares slope of log(chain) against log(N): the chain-growth exponent, which should approach 1/d. */
export function chainGrowthSlope(samples) {
  if (!Array.isArray(samples) || samples.length < 2) throw new RangeError("chainGrowthSlope needs at least two samples");
  const xs = samples.map((s) => Math.log(s.n));
  const ys = samples.map((s) => Math.log(s.chain));
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0, den = 0;
  for (let i = 0; i < xs.length; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  return num / den;
}

/** Register this figure's provenance once, idempotently. */
export function registerCausalSetProvenance(register) {
  return register(CAUSAL_SET_PROVENANCE.id, CAUSAL_SET_PROVENANCE);
}
