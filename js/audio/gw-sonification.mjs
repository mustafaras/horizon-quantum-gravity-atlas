/**
 * Gravitational-wave sonification (Prompt 06) — a tested Web Audio graph.
 *
 * Contract enforced by construction:
 *  - No AudioContext is created until enable() runs, which the UI calls only
 *    from an explicit user gesture. Nothing here ever autoplays.
 *  - The graph is source -> pitchRate -> trim gain -> limiter -> master gain
 *    -> destination. Peak-normalized samples plus a DynamicsCompressor keep
 *    the summed signal below full scale; the trim gain is clamped to [0, 1].
 *  - dispose() disconnects every node it created and closes the context.
 *  - position() reads the AudioContext clock, so the visible time cursor and
 *    the strain visual can stay sample-locked to what is audible.
 *  - "original" mode plays the strain at the audibilization shift that maps
 *    the signal band into hearing range; "shifted" multiplies the user's
 *    pitch factor on top (a turntable-style translation: frequencies and
 *    perceived duration scale together — never a duration-preserving claim).
 *
 * The module is injectable: pass { AudioContextCtor } to test the whole
 * state machine in Node against a mock context (see test/gw-sonification).
 */

import { GW_AUDIBLE_TARGET_HZ, audibilizeShift, normalizePeak, peakAbs, resampleLinear } from "../science/gravitational-waves.mjs";

export const GW_AUDIO_LIMITS = Object.freeze({
  minShift: 0.25,
  maxShift: 8,
  maxVolume: 1,
  defaultVolume: 0.7,
  /** Safety headroom for the normalized buffer under full scale. */
  peakTarget: 0.85,
  /** Inputs above this rate are decimated before hitting the buffer. */
  maxBufferRate: 48000,
  /**
   * AudioContext.createBuffer rejects rates below 3000 Hz; generated previews
   * run slower than that (512 Hz), so low-rate signals are upsampled here.
   * Linear upsampling adds no information but keeps duration and pitch math
   * exact — Web Audio resamples to the context rate on playback regardless.
   */
  minBufferRate: 8000,
});

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Deterministic playback plan for a signal; pure and Node-testable. */
export function computePlaybackPlan(signal, { mode = "original", pitch = 1, targetHz = GW_AUDIBLE_TARGET_HZ } = {}) {
  if (!signal || !signal.samples || !signal.samples.length) throw new RangeError("sonifier needs a non-empty signal");
  const rate = Number(signal.sampleRate);
  if (!(rate > 0)) throw new RangeError("signal.sampleRate must be positive");
  const base = signal.bandCenterHz && signal.bandCenterHz > 0
    ? audibilizeShift({ bandCenterHz: signal.bandCenterHz, targetHz })
    : clamp(targetHz / (rate / 8), 1, 40);
  const shift = mode === "shifted"
    ? clamp(base * clamp(Number(pitch) || 1, GW_AUDIO_LIMITS.minShift, GW_AUDIO_LIMITS.maxShift), 0.01, 100)
    : clamp(base, 0.01, 100);
  return Object.freeze({
    playbackRate: shift,
    durationSeconds: signal.samples.length / rate,
    mode: mode === "shifted" ? "shifted" : "original",
    pitch: clamp(Number(pitch) || 1, GW_AUDIO_LIMITS.minShift, GW_AUDIO_LIMITS.maxShift),
  });
}

/** Prepare Float32 buffer data: rate-limit, normalize, copy. Pure. */
export function prepareAudioSamples(signal, { peakTarget = GW_AUDIO_LIMITS.peakTarget, maxRate = GW_AUDIO_LIMITS.maxBufferRate, minRate = GW_AUDIO_LIMITS.minBufferRate } = {}) {
  const src = signal.samples;
  let samples = src;
  let sampleRate = Number(signal.sampleRate);
  if (sampleRate > maxRate) {
    samples = resampleLinear(samples, sampleRate, maxRate);
    sampleRate = maxRate;
  } else if (sampleRate < minRate) {
    samples = resampleLinear(samples, sampleRate, minRate);
    sampleRate = minRate;
  }
  const norm = normalizePeak(samples, peakTarget);
  return { samples: norm, sampleRate, rawPeak: peakAbs(src) };
}

/**
 * Factory for the live sonifier. `AudioContextCtor` defaults to the browser
 * constructor; tests inject a mock. The constructor performs no audio calls.
 */
export function createGwSonifier({ AudioContextCtor = null, onEnded = () => {} } = {}) {
  const Ctor = AudioContextCtor ?? (typeof globalThis !== "undefined" ? globalThis.AudioContext || globalThis.webkitAudioContext : null);
  let ctx = null;
  let source = null;
  let gainNode = null;
  let limiter = null;
  let buffer = null;
  let signal = null;
  let plan = computePlaybackPlanFallback;
  let volume = GW_AUDIO_LIMITS.defaultVolume;
  let playing = false;
  let loop = false;
  let startCtxTime = 0;
  let startSignalTime = 0;
  let pausedSignalTime = 0;
  let disposed = false;
  let nodes = 0;
  let liveNodes = 0;
  let mode = "original";
  let pitch = 1;
  let targetHz = GW_AUDIBLE_TARGET_HZ;

  function computePlaybackPlanFallback() {
    return { playbackRate: 1, durationSeconds: 0, mode, pitch, };
  }

  function recomputePlan() {
    plan = signal ? computePlaybackPlan(signal, { mode, pitch, targetHz }) : computePlaybackPlanFallback();
    return plan;
  }

  function live(node) { nodes += 1; liveNodes += 1; return node; }
  function drop(node) {
    if (!node) return;
    try { node.disconnect(); } catch { /* already disconnected */ }
    liveNodes -= 1;
  }

  /** Create the context and the master chain. Call from a user gesture. */
  async function enable() {
    if (disposed) throw new Error("Sonifier was disposed; create a new one.");
    if (!Ctor) throw new Error("Web Audio is unavailable in this browser; sonification cannot start.");
    if (!ctx) {
      ctx = new Ctor();
      gainNode = live(ctx.createGain());
      gainNode.gain.value = clamp(volume, 0, GW_AUDIO_LIMITS.maxVolume);
      limiter = live(ctx.createDynamicsCompressor ? ctx.createDynamicsCompressor() : ctx.createGain());
      if (limiter.threshold) {
        limiter.threshold.value = -6;
        limiter.knee.value = 6;
        limiter.ratio.value = 12;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.25;
      }
      gainNode.connect(limiter);
      limiter.connect(ctx.destination);
    }
    if (ctx.state === "suspended" && ctx.resume) await ctx.resume();
    return { state: ctx.state, sampleRate: ctx.sampleRate };
  }

  /** Load a signal (from buildRealBundle/buildGeneratedBundle or processSignal). */
  function loadSignal(next) {
    if (!next || !next.samples || !next.samples.length) throw new TypeError("loadSignal needs { samples, sampleRate }");
    signal = {
      samples: Float64Array.from(next.samples),
      sampleRate: Number(next.sampleRate),
      bandCenterHz: Number.isFinite(next.bandCenterHz) ? next.bandCenterHz : null,
      kind: next.kind || null,
    };
    buffer = null;
    pausedSignalTime = 0;
    recomputePlan();
    return recomputePlan();
  }

  function ensureBuffer() {
    if (buffer || !ctx || !signal) return buffer;
    const prepared = prepareAudioSamples(signal);
    buffer = ctx.createBuffer(1, Math.max(1, prepared.samples.length), prepared.sampleRate);
    buffer.getChannelData(0).set(prepared.samples);
    return buffer;
  }

  function stopSource() {
    if (!source) return;
    try { source.onended = null; source.stop(); } catch { /* already stopped */ }
    drop(source);
    source = null;
  }

  /** Start (or restart) playback at a signal-relative time in seconds. */
  function play(atSeconds = null) {
    if (disposed) throw new Error("Sonifier was disposed.");
    if (!ctx) throw new Error("Audio is not enabled: call enable() from a user gesture first.");
    if (!signal) throw new Error("No signal loaded for sonification.");
    const p = recomputePlan();
    stopSource();
    const buf = ensureBuffer();
    const duration = buf.duration;
    let offset = atSeconds == null ? pausedSignalTime : Number(atSeconds);
    offset = clamp(offset, 0, Math.max(0, duration - 1e-4));
    if (!loop && offset >= duration - 1e-4) offset = 0;
    source = live(ctx.createBufferSource());
    source.buffer = buf;
    // The buffer carries the signal's own rate; Web Audio resamples it to the
    // context rate on playback, so playbackRate *is* the audibilization shift.
    source.playbackRate.value = p.playbackRate;
    source.loop = loop;
    source.connect(gainNode);
    startCtxTime = ctx.currentTime;
    startSignalTime = offset;
    playing = true;
    source.start(0, offset);
    if (!loop) {
      source.onended = () => {
        if (!playing) return;
        playing = false;
        pausedSignalTime = 0;
        onEnded();
      };
    }
    return p;
  }

  /** Pause playback; keeps the cursor position for resume. */
  function pause() {
    if (playing) {
      pausedSignalTime = position();
      stopSource();
      playing = false;
    }
    return pausedSignalTime;
  }

  /** Cursor position in signal seconds (drives the visible time cursor). */
  function position() {
    if (!signal) return 0;
    const duration = signalDuration();
    if (!playing || !ctx) return clamp(pausedSignalTime, 0, duration);
    const p = plan.playbackRate || 1;
    const held = startSignalTime + (ctx.currentTime - startCtxTime) * p;
    if (loop && duration > 0) return held % duration;
    return clamp(held, 0, duration);
  }

  function signalDuration() {
    return signal ? signal.samples.length / signal.sampleRate : 0;
  }

  function seek(atSeconds) {
    const t = clamp(Number(atSeconds) || 0, 0, signalDuration());
    if (playing) play(t);
    else pausedSignalTime = t;
    return t;
  }

  function setVolume(v) {
    const x = Number(v);
    volume = clamp(Number.isFinite(x) ? x : volume, 0, GW_AUDIO_LIMITS.maxVolume);
    if (gainNode) gainNode.gain.value = volume;
    return volume;
  }

  function setMode(next, nextPitch = null) {
    mode = next === "shifted" ? "shifted" : "original";
    if (nextPitch != null) pitch = clamp(Number(nextPitch) || 1, GW_AUDIO_LIMITS.minShift, GW_AUDIO_LIMITS.maxShift);
    const p = recomputePlan();
    if (playing) play(position());
    return p;
  }

  function setPitch(next) {
    return setMode(mode, next);
  }

  function setLoop(next) {
    loop = !!next;
    if (source) source.loop = loop;
    return loop;
  }

  /** Diagnostic snapshot; also the QA hook for leak checks. */
  function stats() {
    return {
      enabled: !!ctx,
      contextState: ctx ? (disposed ? "closed" : ctx.state) : "none",
      liveNodes,
      nodesCreated: nodes,
      playing,
      loop,
      mode,
      pitch,
      volume,
      playbackRate: plan.playbackRate,
      duration: signalDuration(),
      position: position(),
      signalKind: signal ? signal.kind : null,
    };
  }

  /** Disconnect everything and close the context. Idempotent. */
  async function dispose() {
    if (disposed) return;
    disposed = true;
    playing = false;
    stopSource();
    drop(gainNode); drop(limiter);
    gainNode = null; limiter = null;
    if (ctx && ctx.close) {
      try { await ctx.close(); } catch { /* closing a closed context is fine */ }
    }
    ctx = null;
    buffer = null;
    signal = null;
  }

  return { enable, loadSignal, play, pause, position, seek, signalDuration, setVolume, setMode, setPitch, setLoop, stats, dispose };
}
