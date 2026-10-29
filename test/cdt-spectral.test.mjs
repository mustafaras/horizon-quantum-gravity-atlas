import test from "node:test";
import assert from "node:assert/strict";
import {
  initialProfile, reggeAction, metropolisSweep, thermalize, dualNeighbours,
  returnProbability, spectralDimensionFrom, normalizeCdtOptions, flatTriangularDual, spectralDimensionOnFlat,
} from "../js/science/cdt-2d.mjs";
import { massSquaredLevel, isTachyon, levelDegeneracies, spectrumRows,
  normalOrderingConstant, criticalDimension, criticalDimensionSteps, ZETA_MINUS_ONE } from "../js/science/string-spectrum.mjs";
import { SPECTRAL_DIMENSION, convergenceSummary, SPECTRAL_DIMENSION_OVERVIEW } from "../js/science/data/spectral-dimension.mjs";

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} differs from ${b} by more than ${tol}`);

test("the initial profile is a flat cylinder and its action follows N2 = 2·sum L", () => {
  const profile = initialProfile({ slices: 10, targetVolume: 5 });
  assert.equal(profile.length, 10);
  assert.ok(profile.every((v) => v === 5));
  near(reggeAction(profile, 0.5), -0.5 * 2 * 50, 1e-12);
  assert.equal(profile.reduce((a, b) => a + b, 0), 50);
});

test("a sweep conserves total volume, keeps every slice non-empty and accepts a real fraction", () => {
  let profile = initialProfile({ slices: 16, targetVolume: 6 });
  const startVolume = profile.reduce((a, b) => a + b, 0);
  let accepted = 0, proposed = 0;
  for (let s = 0; s < 40; s++) {
    const step = metropolisSweep(profile, { seed: 3, sweep: s });
    profile = step.profile;
    accepted += step.accepted;
    proposed += step.proposed;
    assert.equal(profile.reduce((a, b) => a + b, 0), startVolume, "the pair move conserves the total");
    assert.ok(profile.every((v) => v >= 3), "no slice is ever emptied");
  }
  assert.ok(accepted > 0 && accepted <= proposed, "moves are accepted and never more than proposed");
});

test("the volume per slice fluctuates around the target and the spread is finite", () => {
  for (const target of [4, 6, 10]) {
    const run = thermalize({ slices: 24, targetVolume: target, seed: 42, sweeps: 300 });
    near(run.meanVolume, target, 0.05);
    assert.ok(run.spreadVolume > 0, `target ${target}: the profile actually fluctuates`);
    assert.ok(run.minVolume >= 3);
    assert.equal(run.triangles, 2 * 24 * target, "the triangulation size is fixed by the profile");
  }
});

test("the dual graph is symmetric and every edge is mutual", () => {
  const profile = initialProfile({ slices: 8, targetVolume: 4 });
  const g = dualNeighbours(profile);
  assert.equal(g.total, 32);
  for (let node = 0; node < g.total; node++) {
    const from = g.neighbourOffsets[node], to = g.neighbourOffsets[node + 1];
    assert.ok(to - from >= 2, `node ${node} has at least its two ring neighbours`);
    for (let at = from; at < to; at++) {
      const other = g.targets[at];
      const oFrom = g.neighbourOffsets[other], oTo = g.neighbourOffsets[other + 1];
      let mutual = false;
      for (let k = oFrom; k < oTo; k++) if (g.targets[k] === node) mutual = true;
      assert.ok(mutual, `edge ${node}-${other} is mutual`);
    }
  }
});

test("a flat regular triangulation has d_s = 2 at intermediate sigma", () => {
  // The honeycomb is the dual of a flat triangular lattice: a genuine two-dimensional graph, uniformly degree-3,
  // so this is the control that shows the estimator reads two dimensions.
  const control = spectralDimensionOnFlat({ width: 24, height: 24, walkers: 1500, seed: 42 });
  const degrees = new Set();
  for (let node = 0; node < control.graph.total; node++) {
    degrees.add(control.graph.neighbourOffsets[node + 1] - control.graph.neighbourOffsets[node]);
  }
  assert.deepEqual([...degrees], [3], "the honeycomb is degree 3");
  near(control.probability[0], 1, 1e-12);
  assert.ok(control.samples.length >= 3, `there are samples in the window (${control.samples.length})`);
  near(control.mean, 2, 0.15);
});

test("the cylinder's own graph is connected and reports its degree histogram honestly", () => {
  const run = thermalize({ slices: 24, targetVolume: 8, seed: 42, sweeps: 240, epsilon: 4 });
  const graph = dualNeighbours(run.profile);
  // Connectivity is the property that made the earlier construction useless: a walk confined to a component
  // cannot see the cylinder at all.
  const parent = Array.from({ length: graph.total }, (_, i) => i);
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  for (let n = 0; n < graph.total; n++) {
    for (let k = graph.neighbourOffsets[n]; k < graph.neighbourOffsets[n + 1]; k++) {
      const a = find(n), b = find(graph.targets[k]);
      if (a !== b) parent[a] = b;
    }
  }
  const components = new Set(Array.from({ length: graph.total }, (_, i) => find(i)));
  assert.equal(components.size, 1, "the dual cylinder is one connected graph");
  // The histogram is reported rather than assumed: uneven slice volumes leave surplus triangles at degree 2 or 4.
  const total = Object.values(graph.degreeHistogram).reduce((a, b) => a + b, 0);
  assert.equal(total, graph.total);
  assert.ok(graph.degreeHistogram[2] + graph.degreeHistogram[3] + graph.degreeHistogram[4] > 0);
});

test("the walk is seeded: the same seed returns the same probability, another does not", () => {
  const graph = dualNeighbours(initialProfile({ slices: 10, targetVolume: 6 }));
  const a = returnProbability(graph, { sigmaMax: 12, walkers: 200, seed: 5 });
  const b = returnProbability(graph, { sigmaMax: 12, walkers: 200, seed: 5 });
  const c = returnProbability(graph, { sigmaMax: 12, walkers: 200, seed: 6 });
  assert.deepEqual(a.probability, b.probability);
  assert.notDeepEqual(a.probability, c.probability);
});

test("CDT options are validated", () => {
  assert.throws(() => normalizeCdtOptions({ slices: 2 }));
  assert.throws(() => normalizeCdtOptions({ targetVolume: 1 }));
  assert.throws(() => normalizeCdtOptions({ lambda: -1 }));
  assert.throws(() => returnProbability(dualNeighbours(initialProfile({})), { sigmaMax: 0 }));
  assert.throws(() => thermalize({ sweeps: -1 }));
});

/* ---------- string spectrum ---------- */

test("the open bosonic string mass formula and its tachyon", () => {
  assert.equal(massSquaredLevel(0), -1);
  assert.equal(massSquaredLevel(1), 0);
  assert.equal(massSquaredLevel(2), 1);
  assert.equal(isTachyon(0), true);
  assert.equal(isTachyon(1), false);
  assert.throws(() => massSquaredLevel(-1));
});

test("level degeneracies are the q-series coefficients of the 24-mode product", () => {
  assert.deepEqual(levelDegeneracies(4), [1, 24, 324, 3200, 25650]);
  const rows = spectrumRows(2);
  assert.equal(rows[0].tachyon, true);
  assert.equal(rows[0].degeneracy, 1);
  assert.equal(rows[1].massSquared, 0);
  assert.equal(rows[1].degeneracy, 24);
});

test("the normal-ordering constant reproduces a = -(D-2)/24 and fixes D = 26", () => {
  near(normalOrderingConstant(4), -2 / 24, 1e-12);
  near(normalOrderingConstant(26), -1, 1e-12);
  assert.equal(criticalDimension(), 26);
  near(ZETA_MINUS_ONE, -1 / 12, 1e-15);
  // a = -1 is exactly the value at which the level-one state is massless.
  near(1 + normalOrderingConstant(26), 0, 1e-12);
  const steps = criticalDimensionSteps();
  assert.equal(steps.length, 5);
  assert.equal(steps.at(-1).value, 26);
  assert.ok(steps.some((s) => s.id === "zeta" && Math.abs(s.value - (-1 / 12)) < 1e-15));
});

/* ---------- the comparison data ---------- */

test("every spectral-dimension entry is sourced, finite and has a resolvable citation", async () => {
  const { hasReferenceIdentifier } = await import("../js/science/references.mjs");
  assert.ok(hasReferenceIdentifier(SPECTRAL_DIMENSION_OVERVIEW));
  for (const entry of SPECTRAL_DIMENSION) {
    assert.ok(Number.isFinite(entry.ir) && Number.isFinite(entry.uv));
    assert.ok(entry.ir >= entry.uv, `${entry.id}: the ultraviolet dimension does not exceed the infrared one`);
    assert.match(entry.source.retrieved, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(hasReferenceIdentifier(entry.source.reference), `${entry.id} cites a reference with an identifier`);
    assert.ok(entry.note.length > 20, `${entry.id} carries a stated caveat`);
  }
  const summary = convergenceSummary();
  assert.equal(summary.allFourInInfrared, true);
  assert.ok(summary.count >= 4);
  near(summary.uvMean, 1.96, 0.15);
  assert.deepEqual(summary.cdtIsMeasured, ["cdt4"]);
});
