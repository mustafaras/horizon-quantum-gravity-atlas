// S14: the CPU reference of the phi^4 lattice (js/science/lattice-field.mjs): free-field dispersion, the symplectic integrator's energy,
// the static kink, the pass-through of free packets, the vacuum-like spectrum and the staggered form the GPU kernel runs.

import test from "node:test";
import assert from "node:assert/strict";
import { phi4HamiltonianDensity } from "../js/formula/library/qft.mjs";
import { evaluateTerm } from "../js/formula/lens.mjs";
import {
  createLattice, omega, omegaSquared, maxStableDt, evolve, toStaggered, stepStaggered, stepStaggeredVariable, fromStaggered, acceleration,
  energy, shadowEnergy, energyDensity, energyTerms, modePower, vacuumLike, wavepacket, kink, kick,
} from "../js/science/lattice-field.mjs";

const maxAbs = (a) => a.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const maxDiff = (a, b) => a.reduce((m, v, i) => Math.max(m, Math.abs(v - b[i])), 0);
const mean = (xs) => xs.reduce((s, v) => s + v, 0) / xs.length;

test("createLattice validates its inputs and states the CFL bound it enforces", () => {
  const ok = createLattice({ dim: 2, n: 16, a: 1, mass2: 1, lambda: 0.5, dt: 0.25 });
  assert.equal(ok.size, 256);
  assert.equal(ok.volume, 256);
  assert.ok(Math.abs(ok.omegaMax - Math.sqrt(1 + 4 * 2)) < 1e-12, "omega_max^2 = m^2 + 4 d / a^2");
  assert.throws(() => createLattice({ dim: 3, n: 16, mass2: 1, lambda: 0, dt: 0.1 }), RangeError);
  assert.throws(() => createLattice({ dim: 1, n: 12, mass2: 1, lambda: 0, dt: 0.1 }), RangeError, "n must be a power of two");
  assert.throws(() => createLattice({ dim: 1, n: 16, mass2: 1, lambda: -1, dt: 0.1 }), RangeError, "the potential must be bounded below");
  assert.throws(() => createLattice({ dim: 1, n: 16, a: 1, mass2: 1, lambda: 0, dt: 0.6 }), RangeError, "dt <= 0.5 a");
  assert.throws(() => createLattice({ dim: 1, n: 16, a: 0.1, mass2: 1300, lambda: 0, dt: 0.05 }), RangeError, "dt omega_max < 2");
  assert.ok(maxStableDt({ dim: 2, n: 16, a: 1, mass2: 1 }) <= 0.5);
});

test("free-field dispersion: a single mode oscillates at the lattice frequency omega_k, within 1e-4", () => {
  for (const { dim, n, mode } of [{ dim: 1, n: 64, mode: [3] }, { dim: 2, n: 16, mode: [3, 2] }]) {
    const params = createLattice({ dim, n, a: 1, mass2: 0.64, lambda: 0, dt: 0.02 });
    const w = omega(params, mode);
    const k = mode.map((m) => (2 * Math.PI * m) / n);
    const phi = new Float64Array(params.size);
    for (let i = 0; i < params.size; i++) {
      const x = i % n, y = Math.floor(i / n);
      phi[i] = Math.cos(k[0] * x + (dim === 2 ? k[1] * y : 0));
    }
    // the projection onto the mode, sampled at synchronised times, obeys s(t + dt) + s(t - dt) = 2 cos(w dt) s(t)
    const project = (state) => state.phi.reduce((s, v, i) => s + v * phi[i], 0) / (params.size / 2);
    let previous = { phi, pi: new Float64Array(params.size) }, current = evolve(params, previous, 1);
    const measured = [];
    for (let step = 0; step < 3000; step++) {
      const next = evolve(params, current, 1);
      const [a, b, c] = [project(previous), project(current), project(next)];
      if (Math.abs(b) > 0.3) measured.push(Math.acos((a + c) / (2 * b)) / params.dt);
      previous = current; current = next;
    }
    const numerical = Math.acos(1 - (w * w * params.dt * params.dt) / 2) / params.dt;
    assert.ok(measured.length > 500);
    assert.ok(Math.abs(mean(measured) - numerical) / numerical < 1e-9, `leapfrog frequency ${mean(measured)} vs ${numerical}`);
    assert.ok(Math.abs(mean(measured) - w) / w < 1e-4, `lattice omega_k ${w} vs measured ${mean(measured)}`);
  }
});

test("omega_k is the lattice spectrum m^2 + sum (4/a^2) sin^2(k_i a / 2)", () => {
  const params = createLattice({ dim: 2, n: 8, a: 0.5, mass2: 0.3, lambda: 0, dt: 0.1 });
  const expected = Math.sqrt(0.3 + (4 / 0.25) * (Math.sin(Math.PI * 2 / 8) ** 2 + Math.sin(Math.PI * 3 / 8) ** 2));
  assert.ok(Math.abs(omega(params, [2, 3]) - expected) < 1e-12);
  assert.equal(omegaSquared(params, [0, 0]), 0.3);
  assert.ok(Math.abs(omegaSquared(params, [1, 0]) - omegaSquared(params, [7, 0])) < 1e-12, "k and -k share a frequency");
});

test("free field: the leapfrog invariant is conserved to rounding over 10^4 steps at dt = 0.1 a (the plan asks 1e-5)", () => {
  const params = createLattice({ dim: 1, n: 64, a: 1, mass2: 1, lambda: 0, dt: 0.1 });
  let state = vacuumLike(params, 7);
  const e0 = shadowEnergy(params, state), p0 = energy(params, state);
  let deviation = 0, wiggle = 0;
  for (let step = 0; step < 10000; step++) {
    state = evolve(params, state, 1);
    deviation = Math.max(deviation, Math.abs(shadowEnergy(params, state) - e0) / e0);
    wiggle = Math.max(wiggle, Math.abs(energy(params, state) - p0) / p0);
  }
  assert.ok(deviation < 1e-12, `invariant moved by ${deviation}`);
  // the physical energy of a kick-drift-kick state oscillates around it, by an amount of order (omega_max dt)^2
  assert.ok(wiggle > 1e-4 && wiggle < 0.25 * (params.omegaMax * params.dt) ** 2, `oscillation ${wiggle}`);
  assert.throws(() => shadowEnergy(createLattice({ dim: 1, n: 16, mass2: 1, lambda: 1, dt: 0.1 }), vacuumLike(createLattice({ dim: 1, n: 16, mass2: 1, lambda: 1, dt: 0.1 }), 1)), RangeError);
});

test("interacting field: the energy oscillates by O((omega dt)^2), its mean does not drift, and the residual falls by 4 when dt is halved", () => {
  const TIME = 500, WINDOW = 50;
  const run = (dt, seed) => {
    const params = createLattice({ dim: 1, n: 64, a: 1, mass2: 1, lambda: 1, dt });
    let state = vacuumLike(params, seed);
    const series = [energy(params, state)], steps = Math.round(TIME / dt);
    for (let step = 0; step < steps; step++) { state = evolve(params, state, 1); series.push(energy(params, state)); }
    const w = Math.round(WINDOW / dt);
    return {
      drift: Math.abs(mean(series.slice(-w)) - mean(series.slice(0, w))) / series[0],
      wiggle: Math.max(...series.map((e) => Math.abs(e - series[0]))) / series[0],
      omegaMax: params.omegaMax,
    };
  };
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
  const coarse = seeds.map((s) => run(0.1, s)), fine = seeds.map((s) => run(0.05, s));
  const driftCoarse = mean(coarse.map((r) => r.drift)), driftFine = mean(fine.map((r) => r.drift));
  assert.ok(Math.max(...coarse.map((r) => r.wiggle)) < 0.25 * (coarse[0].omegaMax * 0.1) ** 2, "bounded oscillation at dt = 0.1 a");
  assert.ok(driftCoarse < 4e-5, `mean drift at dt = 0.1 a: ${driftCoarse}`);
  assert.ok(driftFine < 1e-5, `mean drift at dt = 0.05 a: ${driftFine} (the plan's 1e-5)`);
  const ratio = driftCoarse / driftFine;
  assert.ok(ratio > 2.5 && ratio < 6, `dt^2 scaling: ${ratio}`);
});

test("the kink pair is static to 1e-6 for m^2 < 0, and its energy is 2 x (2 sqrt2 / 3) mu v^2 above the vacuum", () => {
  const a = 0.1, mass2 = -0.5, lambda = 3;
  const params = createLattice({ dim: 1, n: 512, a, mass2, lambda, dt: 0.05 });
  const mu = Math.sqrt(-mass2), v = Math.sqrt((6 * -mass2) / lambda);
  const state = kink(params);
  assert.ok(Math.abs(Math.max(...state.phi) - v) < 1e-3 && Math.abs(Math.min(...state.phi) + v) < 1e-3, "the vacua are +-v = sqrt(6 |m^2| / lambda)");
  let evolved = state;
  for (let chunk = 0; chunk < 20; chunk++) evolved = evolve(params, evolved, 100);
  assert.ok(maxDiff(evolved.phi, state.phi) < 1e-6, `moved by ${maxDiff(evolved.phi, state.phi)}`);
  assert.ok(maxAbs(evolved.pi) < 1e-6, "no momentum develops");
  const analytic = kink(params, { relax: false });
  assert.ok(maxDiff(analytic.phi, state.phi) < 20 * a * a * mu * mu * v, "the lattice kink differs from tanh by O(a^2) only");
  const vacuumEnergy = (-mu * mu * v * v / 4) * params.n * a; // V(v) per unit length times the box
  const kinkEnergy = energy(params, state) - vacuumEnergy;
  const closedForm = 2 * ((2 * Math.SQRT2) / 3) * mu * v * v;
  assert.ok(Math.abs(kinkEnergy - closedForm) / closedForm < 2e-3, `pair energy ${kinkEnergy} vs ${closedForm}`);
  // the unpolished analytic profile is not static on the lattice: the relaxation is what makes the test meaningful
  let loose = analytic;
  for (let chunk = 0; chunk < 20; chunk++) loose = evolve(params, loose, 100);
  assert.ok(maxDiff(loose.phi, analytic.phi) > 1e-6);
});

test("a kink is a domain wall in 2+1 dimensions: constant along y, and static", () => {
  const params = createLattice({ dim: 2, n: 32, a: 0.5, mass2: -0.5, lambda: 3, dt: 0.1 });
  const state = kink(params);
  for (let y = 1; y < 32; y++) for (let x = 0; x < 32; x++) assert.equal(state.phi[y * 32 + x], state.phi[x]);
  const evolved = evolve(params, state, 300);
  assert.ok(maxDiff(evolved.phi, state.phi) < 1e-6);
});

test("with lambda = 0 two packets pass through each other (superposition to 1e-10); with lambda > 0 they do not", () => {
  const base = { dim: 1, n: 256, a: 0.5, mass2: 0.25, dt: 0.1 };
  const free = createLattice({ ...base, lambda: 0 });
  const both = wavepacket(free);
  const left = wavepacket(free, { only: "left" }), right = wavepacket(free, { only: "right" });
  const steps = 700; // 70 time units: the packets close at about 1.7 per unit time, cross near t = 37 and are apart again
  const together = evolve(free, both, steps);
  const a = evolve(free, left, steps), b = evolve(free, right, steps);
  const sum = a.phi.map((v, i) => v + b.phi[i]);
  assert.ok(maxDiff(together.phi, sum) < 1e-10, `superposition error ${maxDiff(together.phi, sum)}`);
  // each packet came out where it was heading: the left one started left of the middle and is now right of it
  const centreOf = (phi) => phi.reduce((s, v, i) => s + v * v * i, 0) / phi.reduce((s, v) => s + v * v, 0);
  assert.ok(centreOf(left.phi) < 128 && centreOf(a.phi) > 128);
  const strong = createLattice({ ...base, lambda: 6 });
  const bothS = evolve(strong, wavepacket(strong), steps);
  const sumS = evolve(strong, wavepacket(strong, { only: "left" }), steps).phi.map((v, i) => v + evolve(strong, wavepacket(strong, { only: "right" }), steps).phi[i]);
  assert.ok(maxDiff(bothS.phi, sumS) > 1e-3, "the interaction breaks superposition");
});

test("vacuumLike draws the free-field spectrum <|phi_k|^2> = 1 / (2 omega_k) and is determined by its seed", () => {
  for (const { dim, n } of [{ dim: 1, n: 32 }, { dim: 2, n: 8 }]) {
    const params = createLattice({ dim, n, a: 1, mass2: 0.5, lambda: 0, dt: 0.1 });
    const seeds = 1500, sums = new Float64Array(params.size);
    for (let s = 1; s <= seeds; s++) modePower(params, vacuumLike(params, s)).forEach((p, i) => { sums[i] += p / seeds; });
    for (let i = 0; i < params.size; i++) {
      const mode = dim === 1 ? [i] : [i % n, Math.floor(i / n)];
      const expected = 1 / (2 * omega(params, mode));
      // |phi_k|^2 is exponentially distributed (std = mean) except the real modes (std = sqrt 2 x mean)
      assert.ok(Math.abs(sums[i] - expected) / expected < (5 * Math.SQRT2) / Math.sqrt(seeds), `mode ${mode}: ${sums[i]} vs ${expected}`);
    }
  }
  const params = createLattice({ dim: 2, n: 16, a: 1, mass2: 1, lambda: 0, dt: 0.1 });
  assert.deepEqual(vacuumLike(params, 5).phi, vacuumLike(params, 5).phi);
  assert.notDeepEqual(vacuumLike(params, 5).phi, vacuumLike(params, 6).phi);
  assert.throws(() => vacuumLike(createLattice({ dim: 1, n: 16, mass2: -1, lambda: 1, dt: 0.1 }), 1), RangeError, "an unstable mode has no vacuum spectrum");
});

test("Parseval: the mode power sums to the field's L2 norm, and the energy density sums to the energy", () => {
  const params = createLattice({ dim: 2, n: 8, a: 0.7, mass2: 0.4, lambda: 2, dt: 0.1 });
  const state = vacuumLike(params, 11);
  const norm = state.phi.reduce((s, v) => s + v * v, 0) * params.a ** 2;
  assert.ok(Math.abs(modePower(params, state).reduce((s, v) => s + v, 0) - norm) / norm < 1e-12);
  const density = energyDensity(params, state);
  assert.ok(Math.abs(density.reduce((s, v) => s + v, 0) * params.a ** 2 - energy(params, state)) < 1e-10);
  const terms = energyTerms(params, state);
  for (let i = 0; i < params.size; i++) {
    assert.ok(Math.abs(terms.kinetic[i] + terms.gradient[i] + terms.mass[i] + terms.interaction[i] - density[i]) < 1e-12);
  }
  assert.ok(terms.kinetic.every((v) => v >= 0) && terms.gradient.every((v) => v >= 0) && terms.interaction.every((v) => v >= 0));
});

test("the staggered form the GPU kernel runs is the same integrator", () => {
  const params = createLattice({ dim: 2, n: 16, a: 1, mass2: -0.3, lambda: 2, dt: 0.2 });
  const state = wavepacket(params);
  const direct = evolve(params, state, 200);
  const staggered = fromStaggered(params, stepStaggered(params, toStaggered(params, state), 200));
  assert.ok(maxDiff(direct.phi, staggered.phi) < 1e-11 && maxDiff(direct.pi, staggered.pi) < 1e-11);
  const force = acceleration(params, state.phi);
  assert.equal(force.length, params.size);
});

test("a Gaussian kick is deterministic from its seed, wraps periodically and leaves phi alone", () => {
  const params = createLattice({ dim: 2, n: 16, a: 1, mass2: 1, lambda: 0, dt: 0.2 });
  const state = vacuumLike(params, 3);
  const a = kick(params, state, { site: [15, 0], seed: 9 }), b = kick(params, state, { site: [15, 0], seed: 9 });
  assert.deepEqual(a.pi, b.pi);
  assert.notDeepEqual(a.pi, kick(params, state, { site: [15, 0], seed: 10 }).pi);
  assert.deepEqual(a.phi, state.phi, "a kick changes the momentum only");
  const delta = a.pi.map((v, i) => v - state.pi[i]);
  assert.ok(Math.abs(delta[15]) > Math.abs(delta[8 * 16 + 8]), "strongest at the clicked site");
  assert.ok(Math.abs(delta[0]) > 0.3 * Math.abs(delta[15]), "site 0 is a neighbour of site 15 on a periodic lattice");
});

test("a step that changes length re-staggers the momentum with the mean of the two steps, and the energy does not jump", () => {
  const params = createLattice({ dim: 2, n: 16, a: 0.25, mass2: 1, lambda: 1, dt: 0.1 });
  const fine = createLattice({ dim: 2, n: 16, a: 0.25, mass2: 1, lambda: 1, dt: 0.05 });
  const start = toStaggered(params, vacuumLike(params, 4));
  // a constant schedule is the plain integrator
  const same = stepStaggeredVariable(params, start, [0.1, 0.1, 0.1], 0.1);
  const plain = stepStaggered(params, start, 3);
  assert.ok(maxDiff(same.phi, plain.phi) < 1e-13 && maxDiff(same.pi, plain.pi) < 1e-13);
  // run, then halve the step: the synchronised energy of the last state before and after the change
  const before = stepStaggeredVariable(params, start, Array(20).fill(0.1), 0.1);
  const e = (p, state) => energy(p, fromStaggered(p, state));
  const proper = stepStaggeredVariable(params, before, [0.05], 0.1), naive = stepStaggered(fine, before, 1);
  const eBefore = e(params, before), eProper = e(fine, proper), eNaive = e(fine, naive);
  // both include the O((omega dt)^2) wiggle of the scheme itself; the proper change is the smaller step
  assert.ok(Math.abs(eProper - eBefore) < Math.abs(eNaive - eBefore), `proper ${Math.abs(eProper - eBefore)} vs naive ${Math.abs(eNaive - eBefore)}`);
  assert.ok(Math.abs(eProper - eBefore) / eBefore < 2e-3, `energy step at the change ${Math.abs(eProper - eBefore) / eBefore}`);
  assert.throws(() => stepStaggeredVariable(params, start, [0.1], 0), RangeError);
});

test("the Formula Core terms of qft-phi4-hamiltonian are the energy terms of the lattice, site by site", () => {
  const params = createLattice({ dim: 2, n: 16, a: 0.25, mass2: -0.3, lambda: 2, dt: 0.1 });
  const state = wavepacket(params);
  const terms = energyTerms(params, state);
  const f = phi4HamiltonianDensity;
  // the formula's gradient symbol is the squared forward difference over a^2, which is twice the gradient energy of a site
  const gradient = (i) => 2 * terms.gradient[i];
  for (let i = 0; i < params.size; i++) {
    const env = { pi: state.pi[i], g2: gradient(i), phi: state.phi[i], m2: params.mass2, lambda: params.lambda };
    assert.ok(Math.abs(evaluateTerm(f, "kinetic", env) - terms.kinetic[i]) < 1e-12);
    assert.ok(Math.abs(evaluateTerm(f, "gradient", env) - terms.gradient[i]) < 1e-12);
    assert.ok(Math.abs(evaluateTerm(f, "mass", env) - terms.mass[i]) < 1e-12);
    assert.ok(Math.abs(evaluateTerm(f, "interaction", env) - terms.interaction[i]) < 1e-12);
    assert.ok(Math.abs(f.evaluate(env) - energyDensity(params, state)[i]) < 1e-12 || i > 0, "the whole density at site 0");
  }
  assert.deepEqual(f.termIds.slice().sort(), ["H", "gradient", "interaction", "kinetic", "mass"]);
});
