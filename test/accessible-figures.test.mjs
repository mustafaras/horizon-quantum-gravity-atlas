import test from "node:test";
import assert from "node:assert/strict";

import { figure, axis, line, rule, points } from "../js/figure/spec.mjs";
import { announcementFor, createDebouncedAnnouncer, createInteractionGate, ANNOUNCE_DELAY_MS } from "../js/figure/announce.mjs";
import { SONIFY_RANGE, pitchFor, referenceLevel, sonificationPlan, createFigureSonifier } from "../js/figure/sonify.mjs";
import { createLensRegistry, termLabel } from "../js/formula/lens.mjs";
import { layerCounts, formatReadout, lensReadouts, sceneAltText, nearestProvenanceId } from "../js/render/scene-alt-text.mjs";

const xs = Array.from({ length: 41 }, (_, i) => i);
const mk = (marks, { yScale = { type: "linear", domain: [-1, 1] }, title = "A wave" } = {}) => figure({
  id: "fig-a11y", title, status: "established", provenanceId: "neutrino-oscillation",
  x: axis({ scale: { type: "linear", domain: [0, 40] }, label: { text: "time" }, unit: "s" }),
  y: axis({ scale: yScale, label: { text: "amplitude" } }),
  marks,
});
const wave = line({ x: xs, y: xs.map((x) => Math.sin(x / 6)), layer: "model", focal: true, label: { text: "sine" } });

// ---- debounced announcements ----------------------------------------------------------------------------------

function fakeClock() {
  let now = 0, next = 1;
  const timers = new Map();
  return {
    setTimer: (fn, ms) => { const id = next++; timers.set(id, { fn, at: now + ms }); return id; },
    clearTimer: (id) => { timers.delete(id); },
    advance(ms) {
      now += ms;
      for (const [id, t] of [...timers]) if (t.at <= now) { timers.delete(id); t.fn(); }
    },
    pending: () => timers.size,
  };
}

test("the announcer speaks once, 500 ms after the last change, and only the last text", () => {
  const clock = fakeClock();
  const spoken = [];
  const announcer = createDebouncedAnnouncer({ announce: (t) => spoken.push(t), setTimer: clock.setTimer, clearTimer: clock.clearTimer });
  assert.equal(ANNOUNCE_DELAY_MS, 500);
  announcer.push("a");
  clock.advance(300);
  announcer.push("b");
  clock.advance(300);
  assert.deepEqual(spoken, [], "300 ms after the second push is still quiet");
  clock.advance(200);
  assert.deepEqual(spoken, ["b"], "500 ms after the last push it speaks the last text, once");
  clock.advance(5000);
  assert.deepEqual(spoken, ["b"]);
  assert.equal(clock.pending(), 0);
});

test("flush speaks now, cancel drops, dispose silences for good", () => {
  const clock = fakeClock();
  const spoken = [];
  const announcer = createDebouncedAnnouncer({ announce: (t) => spoken.push(t), setTimer: clock.setTimer, clearTimer: clock.clearTimer });
  announcer.push("x");
  announcer.flush();
  assert.deepEqual(spoken, ["x"]);
  announcer.flush();
  assert.deepEqual(spoken, ["x"], "flush with nothing pending says nothing");
  announcer.push("y");
  announcer.cancel();
  clock.advance(1000);
  assert.deepEqual(spoken, ["x"]);
  announcer.push("z");
  announcer.dispose();
  clock.advance(1000);
  announcer.push("after");
  clock.advance(1000);
  assert.deepEqual(spoken, ["x"]);
  assert.throws(() => createDebouncedAnnouncer({}), TypeError);
});

test("the announcement names the figure, its status and the focal series' range from the same spec", () => {
  const text = announcementFor(mk([wave]));
  assert.match(text, /^Updated: A wave, status established\./);
  const ys = xs.map((x) => Math.sin(x / 6));
  const four = (v) => Number(v.toPrecision(4)).toString();
  assert.ok(text.includes(`sine: amplitude from ${four(Math.min(...ys))} to ${four(Math.max(...ys))} over time [s] from 0 to 40.`), text);
  assert.equal(announcementFor(mk([rule({ axis: "y", value: 0, layer: "model", text: { text: "zero" } })])), "Updated: A wave, status established.");
  const changed = announcementFor(mk([line({ x: xs, y: xs.map(() => 0.5), layer: "model", focal: true, label: { text: "flat" } })]));
  assert.notEqual(changed, text, "a parameter change changes the sentence");
});

test("the announcement carries what the reader changed, so a moved marker is a different sentence", () => {
  const spec = mk([wave]);
  const a = announcementFor(spec, "Scale 3.2 decades. ");
  assert.match(a, /^Updated: A wave, status established\. Scale 3\.2 decades\. sine:/);
  assert.notEqual(a, announcementFor(spec, "Scale 4.1 decades"));
  assert.equal(announcementFor(spec, ""), announcementFor(spec), "no detail is the plain sentence");
  assert.equal(announcementFor(spec, null), announcementFor(spec));
});

test("the interaction gate is open for two seconds after a key, pointer or input event and closed on its own", () => {
  const target = new EventTarget();
  let t = 1000;
  const gate = createInteractionGate({ target, now: () => t });
  assert.equal(gate.recent(), false, "a page that loads untouched is not interaction");
  target.dispatchEvent(new Event("keydown"));
  assert.equal(gate.recent(), true);
  t += 1999;
  assert.equal(gate.recent(), true);
  t += 2;
  assert.equal(gate.recent(), false);
  for (const name of ["pointerdown", "input", "change", "wheel"]) {
    t += 5000;
    target.dispatchEvent(new Event(name));
    assert.equal(gate.recent(), true, name);
  }
  gate.dispose();
  t += 5000;
  target.dispatchEvent(new Event("keydown"));
  assert.equal(gate.recent(), false, "a disposed gate hears nothing");
  assert.throws(() => createInteractionGate({}), TypeError);
});

// ---- sonification plan -----------------------------------------------------------------------------------------

test("pitch rises with y over two octaves, equal axis steps are equal musical intervals, out-of-domain values clamp", () => {
  const y = mk([wave]).y;
  assert.equal(pitchFor(-1, y), SONIFY_RANGE.lowHz);
  assert.ok(Math.abs(pitchFor(1, y) - SONIFY_RANGE.highHz) < 1e-9);
  assert.ok(Math.abs(pitchFor(0, y) - 440) < 1e-9, "the middle of two octaves is one octave up");
  const step = pitchFor(-0.5, y) / pitchFor(-1, y);
  assert.ok(Math.abs(pitchFor(0.5, y) / pitchFor(0, y) - step) < 1e-9);
  assert.equal(pitchFor(5, y), SONIFY_RANGE.highHz);
  assert.equal(pitchFor(-5, y), SONIFY_RANGE.lowHz);
  assert.equal(pitchFor(NaN, y), null);
});

test("a log axis maps by decade, and a non-positive value on it is silence", () => {
  const spec = mk([line({ x: [0, 40], y: [1, 100], layer: "model", focal: true })], { yScale: { type: "log", domain: [1, 100] } });
  assert.ok(Math.abs(pitchFor(10, spec.y) - 440) < 1e-9, "10 is the middle decade");
  assert.equal(pitchFor(0, spec.y), null);
  assert.equal(pitchFor(-3, spec.y), null);
});

test("the reference tone marks the figure's own y rule, else zero, else the middle of the axis", () => {
  const withRule = mk([wave, rule({ axis: "y", value: 0.5, layer: "model", text: { text: "threshold" } })]);
  assert.deepEqual(referenceLevel(withRule), { value: 0.5, label: "threshold", source: "rule" });
  assert.deepEqual(referenceLevel(mk([wave])), { value: 0, label: "the zero line", source: "zero" });
  const positive = mk([wave], { yScale: { type: "linear", domain: [2, 10] } });
  assert.deepEqual(referenceLevel(positive), { value: 6, label: "the middle of the axis", source: "middle" });
  const logged = mk([wave], { yScale: { type: "log", domain: [1, 100] } });
  assert.equal(referenceLevel(logged).value, 10);
  assert.equal(referenceLevel(mk([wave, rule({ axis: "x", value: 3, layer: "model" })])).source, "zero", "an x rule is not a level");
});

test("the plan runs along x over the stated seconds, in x order, with a description that names both tones", () => {
  const reversed = line({ x: [...xs].reverse(), y: [...xs].reverse().map((x) => Math.sin(x / 6)), layer: "model", focal: true, label: { text: "sine" } });
  const plan = sonificationPlan(mk([reversed]));
  assert.equal(plan.notes[0].t, 0);
  assert.ok(Math.abs(plan.notes.at(-1).t - SONIFY_RANGE.seconds) < 1e-9);
  assert.ok(plan.notes.every((n, i) => i === 0 || n.t >= plan.notes[i - 1].t), "time never runs backwards");
  assert.equal(plan.notes.length, 41);
  assert.equal(plan.reference.source, "zero");
  assert.ok(Math.abs(plan.reference.hz - 440) < 1e-9);
  assert.match(plan.description, /time runs along time \[s\] from 0 to 40 over 6 seconds, and pitch follows amplitude, 220 Hz at -1 up to 880 Hz at 1/);
  assert.match(plan.description, /reference tone of 440 Hz marks amplitude = 0, the zero line/);
  assert.ok(Object.isFrozen(plan));
});

test("a long series is decimated to at most 160 notes; a gap in the data is silence; no series, no plan", () => {
  const n = 5000;
  const big = mk([line({ x: Array.from({ length: n }, (_, i) => i / 125), y: Array.from({ length: n }, (_, i) => Math.sin(i / 300)), layer: "model", focal: true })]);
  assert.ok(sonificationPlan(big).notes.length <= SONIFY_RANGE.maxNotes);
  // A figure spec holds only finite numbers, so silence comes from the axis: zero has no place on a log axis.
  const gappy = mk([points({ x: [0, 10, 20, 40], y: [1, 0, 10, 100], layer: "data", focal: true })], { yScale: { type: "log", domain: [1, 100] } });
  assert.equal(sonificationPlan(gappy).notes[1].hz, null);
  assert.ok(sonificationPlan(gappy).notes[2].hz > 0);
  assert.equal(sonificationPlan(mk([rule({ axis: "y", value: 0, layer: "model" })])), null);
  assert.equal(sonificationPlan(mk([line({ x: [3, 3], y: [0, 1], layer: "model" })])), null, "a zero-width x range cannot be played");
});

// ---- the player ------------------------------------------------------------------------------------------------

function mockAudio() {
  const log = { contexts: 0, oscillators: [], resumes: 0, suspends: 0, closed: 0 };
  const param = () => ({ value: 0, calls: [], setValueAtTime(v, t) { this.calls.push(["set", v, t]); }, exponentialRampToValueAtTime(v, t) { this.calls.push(["ramp", v, t]); } });
  class Ctx {
    constructor() { log.contexts += 1; this.state = "suspended"; this.currentTime = 0; this.destination = {}; }
    createGain() { return { gain: param(), connect() {}, disconnect() {} }; }
    createOscillator() { const o = { type: "", frequency: param(), connect() {}, disconnect() {}, start() { o.started = true; }, stop() { o.stopped = true; } }; log.oscillators.push(o); return o; }
    async resume() { this.state = "running"; log.resumes += 1; }
    async suspend() { this.state = "suspended"; log.suspends += 1; }
    async close() { log.closed += 1; }
  }
  return { Ctx, log };
}

test("nothing touches Web Audio until toggle is called from a gesture", () => {
  const { Ctx, log } = mockAudio();
  const states = [];
  const player = createFigureSonifier({ AudioContextCtor: Ctx, onState: (s) => states.push(s) });
  assert.equal(log.contexts, 0);
  assert.equal(player.state, "stopped");
  assert.equal(player.supported, true);
  assert.deepEqual(states, []);
});

test("toggle plays, pauses and resumes; a data oscillator follows the notes and a reference oscillator holds one pitch", async () => {
  const { Ctx, log } = mockAudio();
  const states = [];
  const player = createFigureSonifier({ AudioContextCtor: Ctx, onState: (s) => states.push(s) });
  const plan = sonificationPlan(mk([wave]));

  assert.equal(await player.toggle(plan), "playing");
  assert.equal(log.contexts, 1);
  assert.equal(log.oscillators.length, 2);
  const [data, reference] = log.oscillators;
  assert.equal(data.type, "sine");
  assert.equal(reference.type, "triangle");
  assert.ok(Math.abs(reference.frequency.value - plan.reference.hz) < 1e-9);
  assert.equal(data.frequency.calls.filter((c) => c[0] === "set").length, 1, "the first note sets the pitch");
  assert.equal(data.frequency.calls.filter((c) => c[0] === "ramp").length, plan.notes.length - 1, "the rest glide");
  assert.ok(data.started && reference.started);

  assert.equal(await player.toggle(plan), "paused");
  assert.equal(log.suspends, 1);
  assert.equal(await player.toggle(plan), "playing");
  assert.equal(log.contexts, 1, "pause and resume reuse the context");
  assert.deepEqual(states, ["playing", "paused", "playing"]);

  player.stop();
  assert.equal(player.state, "stopped");
  assert.ok(data.stopped && reference.stopped);
  player.dispose();
  assert.equal(log.closed, 1);
  await assert.rejects(() => player.toggle(plan), /disposed/);
});

test("the sound stops by itself when the plan ends; missing Web Audio and a missing plan fail loudly", async () => {
  const { Ctx } = mockAudio();
  const states = [];
  const quick = { ...sonificationPlan(mk([wave])), durationSeconds: 0.01 };
  const player = createFigureSonifier({ AudioContextCtor: Ctx, onState: (s) => states.push(s) });
  await player.toggle(quick);
  await new Promise((resolve) => setTimeout(resolve, 250));
  assert.deepEqual(states, ["playing", "stopped"]);
  player.dispose();

  const savedCtx = globalThis.AudioContext, savedWebkit = globalThis.webkitAudioContext;
  delete globalThis.AudioContext; delete globalThis.webkitAudioContext;
  try {
    const none = createFigureSonifier();
    assert.equal(none.supported, false);
    await assert.rejects(() => none.toggle(sonificationPlan(mk([wave]))), /Web Audio is unavailable/);
  } finally {
    if (savedCtx) globalThis.AudioContext = savedCtx;
    if (savedWebkit) globalThis.webkitAudioContext = savedWebkit;
  }
  const ok = createFigureSonifier({ AudioContextCtor: mockAudio().Ctx });
  await assert.rejects(() => ok.toggle(null), TypeError);
});

// ---- 3D scene text alternatives ---------------------------------------------------------------------------------

const provenance = Object.freeze({
  model: "Schwarzschild geodesics, null rays only.", status: "effective",
  layers: [{ name: "disk", class: "model" }, { name: "photon ring", class: "model" }, { name: "stars", class: "decoration" }, { name: "EHT ring", class: "data" }],
});

test("layer classes are counted from the provenance entry", () => {
  assert.deepEqual(layerCounts(provenance), { data: 1, model: 2, decoration: 1 });
  assert.deepEqual(layerCounts(null), { data: 0, model: 0, decoration: 0 });
});

test("the alternative text keeps the author's sentence and adds model, status, layers and key values", () => {
  const text = sceneAltText({
    base: "Ray-traced black hole with a lensed disk.", provenance,
    readouts: [{ label: "spin a/M", value: 0.9, unit: "" }, { label: "inclination", value: 60, unit: "deg" }, { label: "bad", value: NaN, unit: "x" }],
  });
  assert.equal(text, "Ray-traced black hole with a lensed disk. Model: Schwarzschild geodesics, null rays only. Status: effective. Layers: 1 data, 2 model, 1 decoration. Key values: spin a/M = 0.9, inclination = 60 deg.");
  assert.equal(sceneAltText({ base: "Only the author's words" }), "Only the author's words.");
  assert.match(sceneAltText({}), /^Interactive 3D scientific visualization\.$/);
  assert.equal(formatReadout({ label: "g", value: 1234.5678, unit: "" }), "g = 1235");
});

test("key values come from the Formula Core lens registry: the bound terms, evaluated with the scene's live parameters", () => {
  const registry = createLensRegistry({ diagnostic: () => {} });
  assert.deepEqual(lensReadouts(registry, "ew-vector-coupling"), [], "nothing is bound yet");
  assert.deepEqual(lensReadouts(registry, "no-such-formula"), []);
  const unbind = registry.bindScene("alt-test", "ew-vector-coupling", {
    termTargets: { charge: { kind: "object", objectName: "charge" }, isospin: { kind: "object", objectName: "isospin" } },
    live: () => ({ env: { T3: -0.5, Q: -1, sin2: 0.23122 } }),
  });
  const readouts = lensReadouts(registry, "ew-vector-coupling", { termLabel });
  assert.equal(readouts.length, 2);
  assert.ok(readouts.every((r) => Number.isFinite(r.value) && typeof r.label === "string" && r.label.length > 0));
  assert.equal(lensReadouts(registry, "ew-vector-coupling", { limit: 1 }).length, 1);
  const text = sceneAltText({ base: "Weak-mixing view", provenance, readouts });
  assert.match(text, /Key values: .+ = -?[\d.]+/);
  unbind();
  assert.deepEqual(lensReadouts(registry, "ew-vector-coupling"), [], "unbinding removes the values");
});

test("a term the scene cannot evaluate is left out, never invented", () => {
  const registry = createLensRegistry({ diagnostic: () => {} });
  registry.bindScene("alt-test", "ew-vector-coupling", {
    termTargets: { charge: { kind: "object", objectName: "charge" }, isospin: { kind: "object", objectName: "isospin" } },
    live: () => ({ env: {} }),
  });
  assert.deepEqual(lensReadouts(registry, "ew-vector-coupling"), []);
});

test("the provenance id is found from the caption chip nearest the scene mount", () => {
  const chip = { getAttribute: (n) => (n === "data-provenance-id" ? "kerr-observatory" : null) };
  const section = { parentElement: null, querySelector: (s) => (s === "[data-provenance-id]" ? chip : null) };
  const wrapper = { parentElement: section, querySelector: () => null };
  const mount = { parentElement: wrapper };
  assert.equal(nearestProvenanceId(mount), "kerr-observatory");
  assert.equal(nearestProvenanceId({ parentElement: { parentElement: null, querySelector: () => null } }), null);
  assert.equal(nearestProvenanceId(null), null);
});
