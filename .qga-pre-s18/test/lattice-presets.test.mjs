// S14: the lattice lab's presets: their initial fields, the display scales and the seeds, all pure and deterministic.

import test from "node:test";
import assert from "node:assert/strict";
import { LATTICE_PRESETS, LAMBDA_FLOOR, presetStart, quantile, kickSeed, vacuumLevel, safeCouplings } from "../js/visualizations/qft/lattice-presets.mjs";
import { LATTICE_VIEW } from "../js/visualizations/qft/lattice-plan.mjs";
import { fromStaggered, toStaggered, evolve, energyDensity } from "../js/science/lattice-field.mjs";

const N = 64, DT = 0.05;
const maxDiff = (a, b) => a.reduce((m, v, i) => Math.max(m, Math.abs(v - b[i])), 0);

test("every preset starts from a finite field with usable display scales, and the GPU start is the float32 staggered state", () => {
  for (const id of Object.keys(LATTICE_PRESETS)) {
    const start = presetStart(id, { n: N, seed: 42, dt: DT });
    assert.equal(start.staggered.phi.length, N * N);
    assert.ok(start.staggered.phi instanceof Float32Array && start.staggered.pi instanceof Float32Array);
    assert.ok(start.staggered.phi.every(Number.isFinite) && start.staggered.pi.every(Number.isFinite), id);
    for (const scale of [start.scales.height, start.scales.energy, ...Object.values(start.scales.terms)]) assert.ok(scale > 0 && Number.isFinite(scale), `${id}: ${scale}`);
    // the stagger is the one the GPU assumes for its first step of length dt
    const staggered = toStaggered(start.params, start.state);
    assert.ok(maxDiff(Array.from(start.staggered.pi), staggered.pi) < 1e-4, `${id}: pi_{-1/2}`);
    assert.ok(maxDiff(fromStaggered(start.params, staggered).pi, start.state.pi) < 1e-12);
  }
});

test("a preset is a function of its seed: the vacuum sample changes with it, the packets and the kink do not", () => {
  const a = presetStart("vacuum", { n: N, seed: 42, dt: DT }), b = presetStart("vacuum", { n: N, seed: 42, dt: DT }), c = presetStart("vacuum", { n: N, seed: 43, dt: DT });
  assert.deepEqual(a.staggered.phi, b.staggered.phi);
  assert.notDeepEqual(a.staggered.phi, c.staggered.phi);
  for (const id of ["packets", "kink"]) assert.deepEqual(presetStart(id, { n: N, seed: 1, dt: DT }).staggered.phi, presetStart(id, { n: N, seed: 2, dt: DT }).staggered.phi);
  assert.throws(() => presetStart("nope", { n: N, seed: 1, dt: DT }), RangeError);
});

test("the presets' sliders sit inside the lab's ranges, and the kink preset is the broken phase with v = 1", () => {
  const [mLo, mHi] = LATTICE_VIEW.mass2Range, [lLo, lHi] = LATTICE_VIEW.lambdaRange;
  for (const preset of Object.values(LATTICE_PRESETS)) {
    assert.ok(preset.mass2 >= mLo && preset.mass2 <= mHi && preset.lambda >= lLo && preset.lambda <= lHi, preset.id);
  }
  const { mass2, lambda } = LATTICE_PRESETS.kink;
  assert.ok(mass2 < 0 && Math.abs(Math.sqrt((6 * -mass2) / lambda) - 1) < 1e-12);
  assert.equal(LATTICE_PRESETS.kink.contour, true);
  assert.equal(LATTICE_PRESETS.vacuum.contour, false);
});

test("the kink preset is static on the lattice the lab uses (a = 0.25, 256 sites): the field after 500 steps equals the start", () => {
  const start = presetStart("kink", { n: 256, seed: 1, dt: 0.1 });
  const later = evolve(start.params, start.state, 500);
  assert.ok(maxDiff(later.phi, start.state.phi) < 1e-6, `moved by ${maxDiff(later.phi, start.state.phi)}`);
});

test("the vacuum level is the potential at its minimum, so the display shows the energy above it", () => {
  for (const [mass2, lambda] of [[-0.5, 3], [-1, 0.25], [-0.2, 4]]) {
    const v2 = (6 * -mass2) / lambda;
    assert.ok(Math.abs(vacuumLevel(mass2, lambda) - (0.5 * mass2 * v2 + (lambda / 24) * v2 * v2)) < 1e-12);
  }
  assert.equal(vacuumLevel(1, 2), 0, "the symmetric phase has its minimum at phi = 0 where V = 0");
  assert.equal(vacuumLevel(-1, 0), 0, "no quartic term: no vacuum to measure from");
  // the kink's vacua carry no energy density above that level, its walls do: walls at x = 16 and 48, the box is 64 long
  const start = presetStart("kink", { n: 256, seed: 1, dt: 0.1 });
  const above = energyDensity(start.params, { phi: start.state.phi, pi: new Float64Array(start.params.size) }).map((e) => e - vacuumLevel(start.params.mass2, start.params.lambda));
  const site = (x) => above[x]; // row y = 0; x counts sites of a = 0.25
  assert.ok(Math.abs(site(0)) < 1e-9 && Math.abs(site(128)) < 1e-9, "the two vacua, 16 away from either wall");
  assert.ok(site(64) > 0.05 && site(192) > 0.05, "the walls hold the energy");
});

test("quantile and kickSeed", () => {
  assert.equal(quantile([-5, 1, 2, 3, 4], 1), 5);
  assert.equal(quantile([-5, 1, 2, 3, 4], 0), 1);
  assert.equal(quantile(Array.from({ length: 100 }, (_, i) => i + 1), 0.99), 100);
  assert.throws(() => quantile([1], 1.5), RangeError);
  assert.equal(kickSeed(42, 3), kickSeed(42, 3));
  const seeds = new Set([0, 1, 2, 3, 4, 5].map((k) => kickSeed(42, k)));
  assert.equal(seeds.size, 6, "every click draws its own kick");
  assert.notEqual(kickSeed(42, 1), kickSeed(43, 1));
});

test("a negative m^2 never runs with a vanishing quartic coupling: the potential must stay bounded below", () => {
  assert.deepEqual(safeCouplings(-0.5, 0), { mass2: -0.5, lambda: LAMBDA_FLOOR });
  assert.deepEqual(safeCouplings(-0.5, 3), { mass2: -0.5, lambda: 3 });
  assert.deepEqual(safeCouplings(0.5, 0), { mass2: 0.5, lambda: 0 }, "the symmetric phase is stable at lambda = 0");
  assert.ok(LAMBDA_FLOOR > LATTICE_VIEW.lambdaRange[0] && LAMBDA_FLOOR < LATTICE_VIEW.lambdaRange[1]);
  const start = presetStart("packets", { n: N, seed: 1, dt: DT });
  assert.ok(start.scales.phi > 0 && Math.abs(start.scales.height * start.scales.phi - LATTICE_PRESETS.packets.heightAtP99) < 1e-9, "the height scale puts the 99th percentile of |phi| at the preset's height");
  const vacuum = presetStart("vacuum", { n: N, seed: 1, dt: DT });
  assert.ok(Math.abs(vacuum.scales.height * vacuum.scales.phi - LATTICE_PRESETS.vacuum.heightAtP99) < 1e-9 && LATTICE_PRESETS.vacuum.heightAtP99 < LATTICE_PRESETS.packets.heightAtP99, "the vacuum sample, all lattice-scale noise, is drawn lower");
});
