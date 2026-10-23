import test from "node:test";
import assert from "node:assert/strict";
import { Color } from "three";
import {
  CHANNEL_STRIDE, SEED_STRIDE, STEP_STRIDE, createCpuParticleSystem, hashU32, randomFor, randomForStep, streamBase,
} from "../js/render/compute/particles-cpu.mjs";
import { BALLISTIC, ballisticInit, ballisticUpdate } from "../js/render/compute/ballistic-cpu.mjs";
import { createParticleSystem, normalizeParticleOptions } from "../js/render/compute/particles.mjs";
import { ballisticInit as gpuInit, ballisticUpdate as gpuUpdate } from "../js/render/compute/ballistic.mjs";
import { HAWKING_PAIR, buildPairRig, hawkingPairUpdateCpu, pairDirection } from "../js/visualizations/blackhole/hawking-pairs-cpu.mjs";
import { createHawkingPairs } from "../js/visualizations/blackhole/hawking-pairs.mjs";
import { TRACER, buildTracerRig, makeTracerUpdateCpu, resampleRuns, tableSample } from "../js/visualizations/rg/flow-tracers-cpu.mjs";
import { createFlowTracers } from "../js/visualizations/rg/flow-tracers.mjs";
import { FIELD_PEAKS, buildPeakRig, makePeakUpdateCpu, modeTable, peakX } from "../js/visualizations/qft/field-peaks-cpu.mjs";
import { createFieldPeaks } from "../js/visualizations/qft/field-peaks.mjs";
import { backdropStarData } from "../js/visualizations/atlas/backdrop-stars.mjs";
import { buildFourierModes, sampleField } from "../js/science/qft-fields.mjs";

test("the hash is the PCG hash of three's TSL `hash`: deterministic, in [0, 1), and well spread", () => {
  // pcg-random.org / shadertoy XlGcRh, written out for a few inputs so a change to either constant is caught.
  const pcg = (value) => {
    const state = (Math.imul(value, 747796405) + 2891336453) >>> 0;
    const word = Math.imul(((state >>> ((state >>> 28) + 4)) ^ state) >>> 0, 277803737) >>> 0;
    return Math.fround(((word >>> 22) ^ word) >>> 0) / 2 ** 32;
  };
  for (const v of [0, 1, 2, 7919, 65535, 4294967295]) assert.equal(hashU32(v), pcg(v));
  assert.equal(hashU32(5), hashU32(5));
  assert.notEqual(hashU32(5), hashU32(6));
  let sum = 0;
  const bins = new Array(10).fill(0);
  const n = 20000;
  for (let i = 0; i < n; i++) {
    const value = hashU32(i);
    assert.ok(value >= 0 && value <= 1, `hash(${i}) = ${value}`);
    sum += value; bins[Math.min(9, Math.floor(value * 10))] += 1;
  }
  assert.ok(Math.abs(sum / n - 0.5) < 0.01, `mean ${sum / n}`);
  for (const count of bins) assert.ok(Math.abs(count / n - 0.1) < 0.012, JSON.stringify(bins));
});

test("random streams: seed * 7919, channel * 15485863, and the step offset wrap modulo 2^32", () => {
  assert.equal(SEED_STRIDE, 7919);
  assert.equal(CHANNEL_STRIDE, 15485863);
  assert.equal(streamBase(0, 0), 0);
  assert.equal(streamBase(3, 0), 3 * 7919);
  assert.equal(streamBase(0, 2), 2 * 15485863);
  assert.equal(streamBase(0xffffffff, 1), (Math.imul(0xffffffff, 7919) + 15485863) >>> 0, "wraps like the GPU's uint arithmetic");
  assert.equal(randomFor(10, 4, 1), hashU32(10 + 4 * 7919 + 15485863));
  assert.equal(randomForStep(10, 4, 1, 0), randomFor(10, 4, 1));
  assert.equal(randomForStep(10, 4, 1, 3), hashU32((10 + streamBase(4, 1) + Math.imul(3, STEP_STRIDE)) >>> 0));
  assert.notEqual(randomFor(10, 4, 0), randomFor(10, 4, 1), "channels differ");
  assert.notEqual(randomFor(10, 4, 0), randomFor(10, 5, 0), "seeds differ");
  assert.notEqual(randomForStep(10, 4, 0, 1), randomForStep(10, 4, 0, 2), "steps differ");
});

test("the reference system is deterministic, seeded, and reproduces itself after a re-init", () => {
  const make = (seed) => createCpuParticleSystem({ count: 64, seed, init: ballisticInit, update: ballisticUpdate });
  const run = (system) => { system.init(); for (let i = 0; i < 60; i++) system.advance(1 / 60); return [...system.buffers.position]; };
  const a = make(11), b = make(11), c = make(12);
  const first = run(a);
  assert.deepEqual(first, run(b), "two systems with one seed agree");
  assert.deepEqual(first, run(a), "re-init reproduces the run");
  assert.notDeepEqual(first, run(c), "another seed differs");
  assert.equal(a.step, 60);
  assert.ok(Math.abs(a.time - 1) < 1e-9);
  for (const v of first) assert.ok(Number.isFinite(v));
});

test("ballistic physics: gravity pulls down, drag slows, a particle respawns when its life ends", () => {
  const system = createCpuParticleSystem({ count: 8, seed: 5, init: ballisticInit, update: ballisticUpdate });
  system.init();
  const { velocity, age, attr, position } = system.buffers;
  for (let i = 0; i < 8; i++) {
    assert.ok(age[i] >= 0 && age[i] <= attr[i * 4], "ages are staggered within life");
    const radius = Math.hypot(position[i * 4], position[i * 4 + 1], position[i * 4 + 2]);
    assert.ok(radius >= BALLISTIC.radius * 0.5 - 1e-5 && radius <= BALLISTIC.radius + 1e-5, `spawn radius ${radius}`);
  }
  const vy0 = velocity[1];
  system.advance(0.1);
  assert.ok(system.buffers.velocity[1] < vy0, "gravity lowers vy");
  const life = attr[0];
  let respawned = 0;
  for (let step = 0; step < 400; step++) {
    const before = system.buffers.age[0];
    system.advance(0.05);
    if (system.buffers.age[0] < before) respawned += 1;
  }
  assert.ok(respawned >= 2, `particle 0 respawned ${respawned} times (life ${life})`);
});

test("createCpuParticleSystem validates its input and accepts initial buffers and params", () => {
  const base = { count: 4, init: () => {}, update: () => {} };
  assert.throws(() => createCpuParticleSystem({ ...base, count: 0 }), RangeError);
  assert.throws(() => createCpuParticleSystem({ ...base, update: null }), TypeError);
  assert.throws(() => createCpuParticleSystem({ count: 4, update: () => {} }), TypeError, "needs init or initial");
  const attr = new Float32Array(16).fill(2);
  const system = createCpuParticleSystem({ count: 4, initial: { attr }, params: { gain: 3 }, update: (p) => { p.position.x = p.attr.x * p.params.gain; } });
  system.init();
  system.advance(0);
  assert.equal(system.buffers.position[0], 6);
  system.params.gain = 5;
  system.advance(0);
  assert.equal(system.buffers.position[0], 10);
});

test("GPU system options are validated and the system builds in Node", () => {
  const update = () => ({});
  assert.deepEqual({ ...normalizeParticleOptions({ count: 8, seed: 3, init: update, update }) }.count, 8);
  for (const bad of [
    { count: 0 }, { count: 4_000_001 }, { count: 2.5 }, { count: 4, seed: -1 }, { count: 4, seed: 2 ** 32 }, { count: 4, seed: 1.5 },
    { count: 4 }, { count: 4, init: update }, { count: 4, init: 5, update }, { count: 4, init: update, update, render: [] },
    { count: 4, initial: { position: new Float32Array(3) }, update }, { count: 4, initial: { nope: new Float32Array(4) }, update },
    { count: 4, init: update, update, params: { "bad name": 1 } }, { count: 4, init: update, update, params: { gain: NaN } },
  ]) assert.throws(() => normalizeParticleOptions(bad), (error) => error instanceof RangeError || error instanceof TypeError, JSON.stringify(Object.keys(bad)));
  const system = createParticleSystem({ count: 16, seed: 2, init: gpuInit, update: gpuUpdate, render: { sizePx: 3 }, params: { phase: 0.5 } });
  assert.equal(system.count, 16);
  assert.equal(system.object.count, 16);
  assert.equal(system.params.phase.value, 0.5);
  for (const name of ["position", "velocity", "age", "attr"]) assert.ok(system.buffers[name], name);
  assert.equal(createParticleSystem({ count: 4, init: gpuInit, update: gpuUpdate, render: null }).object, null);
});

const samples = (n, escapes) => Array.from({ length: n }, (_, i) => ({
  energyOverT: 2 + (i % 7), azimuth: i * 0.9, cosPolar: escapes ? 0.3 + 0.05 * (i % 12) : 0.05 * (i % 5), escapes,
}));

test("Hawking pair rig: one element per particle and segment, unit directions, offsets spread over the cycle", () => {
  const escaping = samples(10, true), falling = samples(4, false);
  const rig = buildPairRig({ escaping, falling });
  const S = HAWKING_PAIR.segments;
  assert.equal(rig.count, 14 * S);
  assert.equal(rig.particles, 14);
  for (let e = 0; e < rig.count; e++) {
    assert.ok(Math.abs(Math.hypot(rig.velocity[e * 4], rig.velocity[e * 4 + 1], rig.velocity[e * 4 + 2]) - 1) < 1e-6, "unit direction");
    assert.equal(rig.attr[e * 4 + 2], e % S, "segment index");
    assert.equal(rig.velocity[e * 4 + 3], e < 10 * S ? 0 : 1, "family");
  }
  assert.equal(rig.attr[1], 0);
  assert.ok(Math.abs(rig.attr[S * 4 + 1] - 0.1) < 1e-6, "second escaping partner is offset by 1/10 of a cycle");
  assert.deepEqual(pairDirection({ azimuth: 0, cosPolar: 1 }).map((v) => +v.toFixed(6)), [0, 1, 0]);
  assert.ok(pairDirection({ azimuth: 1, cosPolar: 0.5 }, true)[1] < 0, "the infalling partner dips below the plane");
  const empty = buildPairRig({ escaping: [], falling: [] });
  assert.equal(empty.count, 0);
});

test("Hawking pair update (CPU mirror): escape leaves the horizon on a curved path, fall sinks to 0.2 r+, opacity follows the cycle", () => {
  const escaping = samples(6, true), falling = samples(3, false);
  const rig = buildPairRig({ escaping, falling });
  const system = createCpuParticleSystem({ count: rig.count, initial: { velocity: rig.velocity, attr: rig.attr, position: rig.position }, params: { phase: 0, pace: 0.8, fade: 0.9 }, update: hawkingPairUpdateCpu });
  system.init();
  const S = HAWKING_PAIR.segments, R = HAWKING_PAIR.horizon;
  const radiusOf = (e) => Math.hypot(system.buffers.position[e * 4], system.buffers.position[e * 4 + 1], system.buffers.position[e * 4 + 2]);
  const opacityOf = (e) => system.buffers.position[e * 4 + 3];
  // head of escaping particle 0 (offset 0): local = phase
  system.params.phase = 0; system.advance(0);
  assert.ok(Math.abs(radiusOf(0) - R * 1.08) < 1e-5, "starts at 1.08 r+");
  assert.ok(opacityOf(0) < 1e-6, "invisible at the start of its cycle");
  system.params.phase = 0.5; system.advance(0);
  assert.ok(radiusOf(0) > R * 1.08 + 1, "moved outward");
  assert.ok(Math.abs(opacityOf(0) - HAWKING_PAIR.escapeAlpha * 0.9) < 1e-5, "peak opacity at mid-cycle");
  assert.ok(opacityOf(1) < opacityOf(0) && opacityOf(1) > 0, "a tail dot is dimmer");
  assert.ok(radiusOf(1) < radiusOf(0), "a tail dot lags behind the head");
  system.params.phase = 0.999; system.advance(0);
  const fall0 = 6 * S;
  assert.ok(radiusOf(fall0) <= R * 0.2 + HAWKING_PAIR.fallTail * 0 + 0.3, "an infalling head ends near the centre");
  system.params.fade = 0; system.advance(0);
  assert.equal(opacityOf(0), 0, "fade 0 hides everything");
});

test("Hawking pair system builds, hides when empty, and takes its phase from the caller", () => {
  const colors = { hotColor: new Color(1, 0.5, 0.2), fallColor: new Color(0.5, 0.1, 0.1), pace: 0.7, fade: 0.8 };
  const empty = createHawkingPairs({ escaping: [], falling: [], ...colors });
  assert.equal(empty.particles, 0);
  assert.equal(empty.object.visible, false, "an empty field (extremal spin) draws nothing");
  const field = createHawkingPairs({ escaping: samples(5, true), falling: samples(2, false), ...colors });
  assert.equal(field.particles, 7);
  assert.equal(field.count, 7 * HAWKING_PAIR.segments);
  assert.equal(field.object.visible, true);
  field.setPhase(0.25);
  assert.equal(field.params.phase.value, 0.25);
});

const straightRun = (offsetX, dir, points = 12) => {
  const pts = Array.from({ length: points }, (_, i) => ({ x: offsetX + i, y: i * 0.5 + (i * i) * 0.02, z: Math.sin(i) * 0.3 }));
  const cum = [0];
  for (let i = 1; i < points; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z));
  return { pts, cum, total: cum[cum.length - 1], dir };
};
// The previous implementation, kept here as the oracle for the resampled table.
function oracleSample(run, u) {
  const target = u * run.total;
  let lo = 0, hi = run.cum.length - 1;
  while (lo < hi - 1) { const mid = (lo + hi) >> 1; if (run.cum[mid] <= target) lo = mid; else hi = mid; }
  const seg = run.cum[hi] - run.cum[lo] || 1;
  const f = (target - run.cum[lo]) / seg;
  const a = run.pts[lo], b = run.pts[hi];
  return [a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f];
}

test("RG tracer table: uniform arc-length resampling reproduces the old walk along a run", () => {
  const runs = [straightRun(0, 1), straightRun(5, -1, 30)];
  const table = resampleRuns(runs);
  assert.equal(table.rows, 2);
  assert.equal(table.samples, TRACER.samples);
  assert.equal(table.data.length, 2 * TRACER.samples * 4);
  for (let r = 0; r < runs.length; r++) {
    for (const u of [0, 0.013, 0.25, 0.5, 0.777, 0.999, 1]) {
      const got = tableSample(table, r, u), want = oracleSample(runs[r], u);
      for (let c = 0; c < 3; c++) assert.ok(Math.abs(got[c] - want[c]) < 0.03, `run ${r} u ${u} component ${c}: ${got[c]} vs ${want[c]}`);
    }
  }
  assert.deepEqual(tableSample(table, 0, 0), [runs[0].pts[0].x, runs[0].pts[0].y, runs[0].pts[0].z].map(Math.fround), "starts at the first point");
  assert.throws(() => resampleRuns(runs, 1), RangeError);
  assert.equal(resampleRuns([]).data.length, TRACER.samples * 4, "an empty run list still yields a one-row table");
});

test("RG tracer rig and update (CPU mirror): offsets, directions, motion freeze, and the clock", () => {
  const runs = [straightRun(0, 1), straightRun(5, -1)];
  const rig = buildTracerRig(runs);
  assert.equal(rig.count, 10);
  assert.equal(rig.attr[2], 1);
  assert.equal(rig.attr[5 * 4 + 2], -1);
  assert.ok(Math.abs(rig.attr[1 * 4 + 1] - 0.2) < 1e-6);
  assert.ok(Math.abs(rig.attr[6 * 4 + 1] - (1 + 0.17) / 5) < 1e-6, "runs after the first are offset by (run % 3) * 0.17");
  const table = resampleRuns(runs);
  const system = createCpuParticleSystem({ count: rig.count, initial: { attr: rig.attr, position: rig.position }, params: { time: 0, motion: 1 }, update: makeTracerUpdateCpu(table) });
  system.init(); system.advance(0);
  const at0 = [...system.buffers.position.slice(0, 3)], u0 = system.buffers.age[0];
  system.params.time = 10; system.advance(0);
  assert.notDeepEqual([...system.buffers.position.slice(0, 3)], at0, "tracers move with the clock");
  assert.notEqual(system.buffers.age[0], u0);
  system.params.motion = 0;
  system.params.time = 3; system.advance(0);
  const frozen = [...system.buffers.position];
  system.params.time = 99; system.advance(0);
  assert.deepEqual([...system.buffers.position], frozen, "reduced motion freezes the tracers on one phase");
  assert.ok(Math.abs(system.buffers.age[0] - 0.35) < 1e-6);
});

test("RG tracer system builds in Node", () => {
  const runs = [straightRun(0, 1), straightRun(5, -1)];
  const tracers = createFlowTracers({ runs, uvColor: new Color(0, 1, 1), irColor: new Color(1, 0.7, 0) });
  assert.equal(tracers.tracers, 10);
  assert.equal(tracers.table.rows, 2);
  tracers.setClock(4, 0);
  assert.equal(tracers.params.time.value, 4);
  assert.equal(tracers.params.motion.value, 0);
  tracers.setClock(4, 1);
  assert.equal(tracers.params.motion.value, 1);
  tracers.dispose();
});

test("QFT crest markers (CPU mirror): a crest is a local maximum above the threshold and sits on the field", () => {
  const field = buildFourierModes({ seed: 42 });
  const nx = 160;
  const rig = buildPeakRig(nx);
  assert.equal(rig.count, nx - 2);
  assert.equal(rig.velocity[0], 1);
  assert.equal(rig.velocity[(nx - 3) * 4], nx - 2);
  const system = createCpuParticleSystem({ count: rig.count, initial: { velocity: rig.velocity, position: rig.position }, params: { time: 0, nx }, update: makePeakUpdateCpu(field) });
  system.init();
  const L = field.length;
  const phi = (i, t) => sampleField(field, (peakX(i, nx) / FIELD_PEAKS.extentX) * (L / 2), t);
  for (const t of [0, 0.9, 7.3]) {
    system.params.time = t; system.advance(0);
    let crests = 0;
    for (let e = 0; e < rig.count; e++) {
      const i = e + 1, h = phi(i, t);
      const expected = h > phi(i - 1, t) && h > phi(i + 1, t) && h > FIELD_PEAKS.crestMin;
      const shown = system.buffers.position[e * 4 + 3] > 0;
      assert.equal(shown, expected, `i ${i} t ${t}`);
      if (shown) {
        crests += 1;
        assert.ok(Math.abs(system.buffers.position[e * 4 + 1] - (h * FIELD_PEAKS.yScale + FIELD_PEAKS.lift)) < 1e-4);
        assert.equal(system.buffers.position[e * 4 + 2], FIELD_PEAKS.extentZ);
      }
    }
    assert.ok(crests >= 1 && crests < 60, `${crests} crests at t = ${t}`);
  }
  assert.equal(modeTable(field).length, field.modes.length);
  assert.deepEqual(modeTable(field)[0], [field.modes[0].k, field.modes[0].omega, field.modes[0].amplitude, field.modes[0].phase]);
});

test("QFT crest system builds in Node", () => {
  const field = buildFourierModes({ seed: 42 });
  const peaks = createFieldPeaks({ field, nx: 160, color: new Color(1, 1, 1) });
  assert.equal(peaks.count, 158);
  peaks.setTime(2.5);
  assert.equal(peaks.params.time.value, 2.5);
  assert.equal(peaks.params.nx.value, 160);
});

test("backdrop stars are a deterministic function of the seed, with one twinkle phase per star in [0, 1)", () => {
  const a = backdropStarData(200, 42), b = backdropStarData(200, 42), c = backdropStarData(200, 43);
  assert.deepEqual([...a.positions], [...b.positions]);
  assert.deepEqual([...a.colors], [...b.colors]);
  assert.deepEqual([...a.phases], [...b.phases]);
  assert.notDeepEqual([...a.positions], [...c.positions]);
  assert.equal(a.positions.length, 600);
  assert.equal(a.phases.length, 200);
  for (const p of a.phases) assert.ok(p >= 0 && p < 1);
  for (let i = 0; i < 200; i++) {
    const r = Math.hypot(a.positions[i * 3], a.positions[i * 3 + 1] / 0.55, a.positions[i * 3 + 2] + 40);
    assert.ok(r >= 39.9 && r <= 160.1, `star ${i} radius ${r}`);
  }
  for (const v of a.colors) assert.ok(v >= 0 && v <= 1);
  assert.throws(() => backdropStarData(0), RangeError);
});
