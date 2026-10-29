import test from "node:test";
import assert from "node:assert/strict";
import {
  orderingFractionTheory, dimensionFromOrderingFraction, sprinkle, causalMatrix, isRelated,
  links, relationCount, longestChain, estimate, ensemble, chainGrowthSlope,
} from "../js/science/causal-sets.mjs";

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} differs from ${b} by more than ${tol}`);

test("the Myrheim–Meyer ordering fraction takes its closed-form values", () => {
  near(orderingFractionTheory(2), 0.5, 1e-13);
  near(orderingFractionTheory(3), 8 / 35, 1e-13);
  near(orderingFractionTheory(4), 0.1, 1e-13);
  // Strictly decreasing on the fitted range, which the inversion relies on.
  for (let d = 1.5; d < 11; d += 0.5) {
    assert.ok(orderingFractionTheory(d) > orderingFractionTheory(d + 0.5), `f decreases at ${d}`);
  }
});

test("inverting the ordering fraction recovers the dimension it was computed from", () => {
  for (const d of [1.5, 2, 2.5, 3, 4, 6, 8]) {
    near(dimensionFromOrderingFraction(orderingFractionTheory(d)).dim, d, 1e-9);
  }
  // A fraction just under 1 is a very low dimension, not a clamp: f(1) is itself 1.
  const low = dimensionFromOrderingFraction(0.9);
  assert.equal(low.clamped, null);
  assert.ok(low.dim > 1 && low.dim < 1.5, `0.9 orders to d = ${low.dim}`);
  assert.equal(dimensionFromOrderingFraction(1e-6).clamped, "low");
  assert.throws(() => dimensionFromOrderingFraction(0));
  assert.throws(() => dimensionFromOrderingFraction(1));
});

test("a 2D sprinkle is contained by its own light cones and is genuinely a partial order", () => {
  const points = sprinkle({ dim: 2, n: 300, seed: 7 });
  assert.equal(points.length, 300);
  for (const p of points) {
    assert.ok(p.t >= 0 && p.t <= 1, `t ${p.t} inside the unit-height diamond`);
    // The diamond condition: |x| ≤ min(t, 1−t).
    assert.ok(Math.abs(p.x) <= Math.min(p.t, 1 - p.t) + 1e-12, `|x| ${Math.abs(p.x)} inside the cone at t=${p.t}`);
  }
  const m = causalMatrix(points);
  // Irreflexive, antisymmetric and transitive: the three defining properties of a causal set.
  let checked = 0;
  for (let i = 0; i < 300; i++) {
    assert.equal(isRelated(m, i, i), false, "no element precedes itself");
    for (let j = 0; j < 300; j++) {
      if (i === j) continue;
      if (isRelated(m, i, j)) {
        assert.equal(isRelated(m, j, i), false, "antisymmetry");
        for (let k = 0; k < 300 && checked < 4000; k++) {
          if (isRelated(m, j, k)) { assert.ok(isRelated(m, i, k), "transitivity"); checked++; }
        }
      }
    }
  }
  assert.ok(checked > 0, "the transitivity sample actually exercised relations");
});

test("every link is a relation, and every relation is covered by a chain of links", () => {
  const run = estimate({ dim: 2, n: 220, seed: 11 });
  const linkSet = new Set(run.links.map(([i, j]) => `${i},${j}`));
  for (const [i, j] of run.links) assert.ok(isRelated(run.matrix, i, j), "a link is a relation");
  // A link has no element strictly between its endpoints.
  for (const [i, j] of run.links) {
    for (let k = 0; k < run.n; k++) {
      if (k === i || k === j) continue;
      assert.ok(!(isRelated(run.matrix, i, k) && isRelated(run.matrix, k, j)), `link ${i}->${j} is uncovered`);
    }
  }
  assert.ok(linkSet.size === run.links.length, "links are unique");
  assert.ok(run.links.length < run.relations, "the reduction is a proper subset of the relations");
});

test("the longest chain is a genuine chain ordered by the causal relation", () => {
  const run = estimate({ dim: 2, n: 200, seed: 3 });
  assert.equal(run.chain.indices.length, run.chain.length);
  for (let i = 1; i < run.chain.indices.length; i++) {
    assert.ok(isRelated(run.matrix, run.chain.indices[i - 1], run.chain.indices[i]), "consecutive chain elements are related");
  }
  assert.ok(run.chain.length >= 2, "a 200-point sprinkle always has a non-trivial chain");
});

test("the ordering fraction equals related pairs over all pairs", () => {
  const run = estimate({ dim: 2, n: 150, seed: 5 });
  assert.equal(run.relations, relationCount(run.matrix));
  near(run.orderingFraction, run.relations / run.pairs, 1e-15);
  near(run.orderingFraction, orderingFractionTheory(2), 0.02);
});

test("N = 2000 sprinklings recover d = 2 and d = 4 across five seeds", () => {
  const two = ensemble({ dim: 2, n: 2000, seeds: 5 });
  near(two.meanDimension, 2, 0.1);
  const four = ensemble({ dim: 4, n: 2000, seeds: 5 });
  near(four.meanDimension, 4, 0.3);
  // Record the measured spread so the readout can quote it rather than a single draw.
  assert.ok(two.spreadDimension >= 0 && four.spreadDimension >= 0);
  assert.ok(two.maxDimension - two.minDimension < 0.5, `2D spread ${two.maxDimension - two.minDimension}`);
  assert.ok(four.maxDimension - four.minDimension < 1.5, `4D spread ${four.maxDimension - four.minDimension}`);
});

test("the longest chain grows as N^(1/d)", () => {
  for (const dim of [2, 4]) {
    const sizes = [250, 500, 1000, 2000];
    const samples = sizes.map((n) => {
      // Average a few seeds so the fit is not dominated by one draw.
      const runs = [0, 1, 2].map((k) => estimate({ dim, n, seed: 100 + k }));
      return { n, chain: runs.reduce((a, r) => a + r.chain.length, 0) / runs.length };
    });
    const slope = chainGrowthSlope(samples);
    const expected = 1 / dim;
    assert.ok(Math.abs(slope - expected) / expected < 0.15,
      `${dim}D chain slope ${slope.toFixed(4)} should be within 15% of ${expected.toFixed(4)}`);
  }
});

test("the same seed reproduces the same sprinkle, and a different seed does not", () => {
  const a = estimate({ dim: 4, n: 120, seed: 42 });
  const b = estimate({ dim: 4, n: 120, seed: 42 });
  const c = estimate({ dim: 4, n: 120, seed: 43 });
  assert.deepEqual(a.points, b.points);
  assert.equal(a.chain.length, b.chain.length);
  assert.notDeepEqual(a.points, c.points);
});

test("an N = 4000 sprinkle and reduction stays inside the 300 ms budget", () => {
  // `npm test` runs these files in parallel, so wall-clock time here measures the machine's load as much as the
  // algorithm's cost. CPU time is what the budget is about and it stays reproducible under contention; the
  // isolated wall-clock figure is recorded in the ledger instead.
  const cpuMs = (fn) => {
    const before = process.cpuUsage();
    fn();
    const delta = process.cpuUsage(before);
    return (delta.user + delta.system) / 1000;
  };
  const median = (dim) => {
    assert.ok(estimate({ dim, n: 4000, seed: 42 }).chain.length > 1, `${dim}D chain is non-trivial`); // warm-up
    const runs = [];
    for (let i = 0; i < 3; i++) runs.push(cpuMs(() => estimate({ dim, n: 4000, seed: 42 })));
    runs.sort((a, b) => a - b);
    return runs[1];
  };
  for (const dim of [4, 2]) {
    const elapsed = median(dim);
    assert.ok(elapsed < 300, `${dim}D N = 4000 median CPU ${elapsed.toFixed(1)} ms, over the 300 ms budget`);
  }
});
