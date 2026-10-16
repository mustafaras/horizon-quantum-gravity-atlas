import test from "node:test";
import assert from "node:assert/strict";
import {
  createGwSonifier,
  computePlaybackPlan,
  prepareAudioSamples,
  GW_AUDIO_LIMITS,
} from "../js/audio/gw-sonification.mjs";

/* Deterministic mock Web Audio graph — mirrors the subset the sonifier uses. */
class MockAudioContext {
  static instances = 0;
  static all = [];
  constructor() {
    MockAudioContext.instances += 1;
    MockAudioContext.all.push(this);
    this.state = "suspended";
    this.sampleRate = 48000;
    this.currentTime = 0;
    this.closed = false;
    this.destination = { connections: 0, connect() { this.connections += 1; }, disconnect() {} };
    this.buffersCreated = 0;
    this.sources = [];
  }
  resume() { this.state = "running"; return Promise.resolve(); }
  close() { this.closed = true; this.state = "closed"; return Promise.resolve(); }
  createGain() { return node({ gain: param() }); }
  createDynamicsCompressor() {
    return node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() });
  }
  createBufferSource() {
    const self = node({
      buffer: null,
      loop: false,
      onended: null,
      playbackRate: param(1),
      startedWith: null,
      stopped: false,
      start(when, offset) { self.startedWith = { when, offset }; },
      stop() { self.stopped = true; },
    });
    this.sources.push(self);
    return self;
  }
  createBuffer(channels, length, sampleRate) {
    this.buffersCreated += 1;
    const data = new Float32Array(length);
    return {
      duration: length / sampleRate, length, sampleRate,
      getChannelData: () => data,
      __data: data,
    };
  }
}
const param = (v = 0) => ({ value: v });
const node = (extra) => Object.assign({ __live: true, connect() {}, disconnect() { this.__live = false; } }, extra);

const makeSignal = ({ sampleRate = 512, seconds = 4, bandCenterHz = 150 } = {}) => {
  const n = Math.round(sampleRate * seconds);
  const samples = new Float64Array(n);
  for (let i = 0; i < n; i++) samples[i] = Math.sin(2 * Math.PI * bandCenterHz * (i / sampleRate)) * 3e-21;
  return { samples, sampleRate, bandCenterHz };
};

test("the constructor touches no audio API whatsoever", () => {
  const before = MockAudioContext.instances;
  const son = createGwSonifier({ AudioContextCtor: MockAudioContext });
  assert.equal(MockAudioContext.instances, before, "no AudioContext before enable()");
  son.loadSignal(makeSignal());
  assert.equal(son.stats().enabled, false);
  assert.throws(() => son.play(), /not enabled/i);
  assert.equal(MockAudioContext.instances, before, "no AudioContext after failed play()");
});

test("enable() creates exactly one context and the master chain", async () => {
  const before = MockAudioContext.instances;
  const son = createGwSonifier({ AudioContextCtor: MockAudioContext });
  const info = await son.enable();
  assert.equal(MockAudioContext.instances, before + 1);
  assert.equal(info.state, "running");
  const st = son.stats();
  assert.equal(st.enabled, true);
  assert.equal(st.liveNodes, 2); // master gain + limiter
  await son.dispose();
});

test("playback plan: original uses the audibilization shift; shifted multiplies pitch", () => {
  const sig = { samples: new Float64Array(1024), sampleRate: 512, bandCenterHz: 110 };
  const original = computePlaybackPlan(sig, { mode: "original" });
  assert.ok(Math.abs(original.playbackRate - 440 / 110) < 1e-9);
  const shifted = computePlaybackPlan(sig, { mode: "shifted", pitch: 2 });
  assert.ok(Math.abs(shifted.playbackRate - (440 / 110) * 2) < 1e-9);
  assert.equal(shifted.durationSeconds, 2);
  assert.throws(() => computePlaybackPlan(null), /non-empty/);
});

test("position() follows the AudioContext clock and playbackRate", async () => {
  const son = createGwSonifier({ AudioContextCtor: MockAudioContext });
  const signal = makeSignal({ seconds: 4, bandCenterHz: 220 });
  son.loadSignal(signal);
  await son.enable();
  const ctx = ctxOf(son);
  son.play(0);
  ctx.currentTime = 1; // one wall-clock second
  const expected = (440 / 220) * 1; // 2x shift -> 2 signal seconds
  assert.ok(Math.abs(son.position() - expected) < 1e-9, `position ${son.position()} vs ${expected}`);
  son.pause();
  const held = son.position();
  ctx.currentTime = 99;
  assert.equal(son.position(), held, "paused position must hold");
  son.seek(0.25);
  assert.equal(son.position(), 0.25);
  await son.dispose();
});

test("volume and pitch are clamped; invalid inputs cannot escape", async () => {
  const son = createGwSonifier({ AudioContextCtor: MockAudioContext });
  son.loadSignal(makeSignal());
  await son.enable();
  assert.equal(son.setVolume(4), GW_AUDIO_LIMITS.maxVolume);
  assert.equal(son.setVolume(-2), 0);
  assert.ok(Number.isFinite(son.setVolume(Number.NaN)) && son.setVolume(Number.NaN) >= 0);
  son.play(0);
  const beforeRate = son.stats().playbackRate;
  son.setPitch(1000);
  assert.ok(son.stats().playbackRate <= beforeRate * GW_AUDIO_LIMITS.maxShift + 1e-9);
  assert.equal(son.setMode("vibes").mode, "original", "unknown modes fall back to original");
  await son.dispose();
});

test("prepareAudioSamples normalizes under full scale and rate-limits", () => {
  const huge = { samples: new Float64Array(2048).map((_, i) => 5e-21 * Math.sin(i)), sampleRate: 96000 };
  const out = prepareAudioSamples(huge, {});
  assert.equal(out.sampleRate, GW_AUDIO_LIMITS.maxBufferRate);
  let peak = 0;
  for (const v of out.samples) peak = Math.max(peak, Math.abs(v));
  assert.ok(peak <= GW_AUDIO_LIMITS.peakTarget + 1e-6);
});

test("prepareAudioSamples upsamples sub-3kHz previews to a buffer-legal rate", () => {
  // 512 Hz is what the generated theatre preview runs at; AudioContext
  // .createBuffer rejects anything below 3000 Hz, so it must be upsampled
  // while preserving duration exactly.
  const slow = { samples: Float64Array.from({ length: 256 }, (_, i) => Math.sin(i / 8)), sampleRate: 512 };
  const out = prepareAudioSamples(slow, {});
  assert.ok(out.sampleRate >= 3000, "rate must be legal for createBuffer");
  assert.ok(Math.abs(out.samples.length / out.sampleRate - 256 / 512) < 1e-9, "duration preserved");
});

test("buffer content is the normalized signal (no silent sonification)", async () => {
  const son = createGwSonifier({ AudioContextCtor: MockAudioContext });
  son.loadSignal(makeSignal({ bandCenterHz: 100, seconds: 1 }));
  await son.enable();
  son.play(0);
  const ctx = ctxOf(son);
  const src = ctx.sources[ctx.sources.length - 1];
  assert.ok(src.buffer.length > 0);
  let peak = 0;
  for (const v of src.buffer.getChannelData(0)) peak = Math.max(peak, Math.abs(v));
  assert.ok(peak > 0.5, "buffer must carry the peak-normalized strain");
  assert.ok(peak <= 0.85 + 1e-6, "buffer must stay under the clip margin");
  await son.dispose();
});

test("loop flag reaches the source and position wraps", async () => {
  const son = createGwSonifier({ AudioContextCtor: MockAudioContext });
  son.loadSignal(makeSignal({ seconds: 2, bandCenterHz: 220 }));
  await son.enable();
  son.setLoop(true);
  son.play(0);
  const ctx = ctxOf(son);
  const src = ctx.sources[ctx.sources.length - 1];
  assert.equal(src.loop, true);
  ctx.currentTime = 20; // 40 signal seconds at 2x
  assert.ok(son.position() >= 0 && son.position() < 2, "looped position must wrap inside the signal");
  await son.dispose();
});

test("dispose disconnects every node and closes the context", async () => {
  const son = createGwSonifier({ AudioContextCtor: MockAudioContext });
  son.loadSignal(makeSignal());
  await son.enable();
  son.play(0);
  const ctx = ctxOf(son);
  assert.ok(son.stats().liveNodes >= 3);
  await son.dispose();
  const st = son.stats();
  assert.equal(st.liveNodes, 0, "no node may outlive dispose()");
  assert.equal(st.contextClosed ?? ctx.closed, true);
  assert.equal(ctx.closed, true);
  assert.ok(ctx.sources.every((s) => s.stopped), "every source must be stopped");
  await son.dispose(); // idempotent
});

test("dispose after navigation blocks reuse without recreating a context", async () => {
  const son = createGwSonifier({ AudioContextCtor: MockAudioContext });
  await son.enable();
  const before = MockAudioContext.instances;
  await son.dispose();
  await assert.rejects(() => Promise.resolve().then(() => son.enable()), /disposed/);
  assert.equal(MockAudioContext.instances, before, "a disposed sonifier must never mint a new context");
});

/** Reach into the closure only for clock simulation (white-box test hook). */
function ctxOf(son) {
  if (!son.stats().enabled) throw new Error("not enabled");
  return MockAudioContext.all[MockAudioContext.all.length - 1];
}
