// Figure sonification (S34): a figure a reader cannot see can be heard. Pitch follows y along x, so a rising curve rises
// in pitch; a steady reference tone sits at a labelled level (a `rule` mark, else the zero line, else the middle of the
// axis), so the moment the curve crosses it is the moment the two tones meet. Pure planning plus a small Web Audio player.
//
//   const plan = sonificationPlan(spec);            // notes, reference tone and the sentence that describes both
//   const player = createFigureSonifier();          // no audio call happens here
//   await player.toggle(plan);                      // call from a user gesture: it creates the AudioContext
//
// Nothing ever autoplays: the context is created inside `toggle`, which the figure calls only from a click or a key press.

import { makeScale } from "./scale.mjs";
import { decimate } from "./summary.mjs";

export const SONIFY_RANGE = Object.freeze({ lowHz: 220, highHz: 880, seconds: 6, maxNotes: 160, gain: 0.12, referenceGain: 0.05 });

const SERIES = ["line", "step", "points"];
const fmt = (v) => Number(v.toPrecision(4)).toString();
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Frequency in Hz for a value on `axis`: log-frequency is linear in the axis position, so equal steps sound equal. */
export function pitchFor(value, axis, range = SONIFY_RANGE) {
  const t = makeScale(axis.scale, [0, 1]).map(value);
  if (!Number.isFinite(t)) return null;
  return range.lowHz * (range.highHz / range.lowHz) ** clamp01(t);
}

/** The level the reference tone marks: the figure's own horizontal rule, else y = 0 when it is on the axis, else the middle. */
export function referenceLevel(spec) {
  const rule = spec.marks.find((m) => m.type === "rule" && m.axis === "y");
  if (rule) return { value: rule.value, label: rule.text?.plain ?? rule.label?.plain ?? `y = ${fmt(rule.value)}`, source: "rule" };
  const [lo, hi] = [...spec.y.scale.domain].sort((a, b) => a - b);
  if (spec.y.scale.type !== "log" && lo < 0 && hi > 0) return { value: 0, label: "the zero line", source: "zero" };
  const middle = spec.y.scale.type === "log" ? Math.sqrt(lo * hi) : (lo + hi) / 2;
  return { value: middle, label: "the middle of the axis", source: "middle" };
}

/**
 * The plan for `spec`'s focal series (else its first line, step or points series), or `null` when it has none.
 * `notes` are `{ t, hz }` with `t` in seconds from the start; `hz` is `null` where the series is not defined (silence).
 */
export function sonificationPlan(spec, range = SONIFY_RANGE) {
  const mark = spec.marks.find((m) => m.focal && SERIES.includes(m.type)) ?? spec.marks.find((m) => SERIES.includes(m.type));
  if (!mark || mark.x.length < 2) return null;
  const order = Array.from(mark.x.keys()).sort((a, b) => mark.x[a] - mark.x[b]);
  const x0 = mark.x[order[0]], x1 = mark.x[order[order.length - 1]];
  const span = x1 - x0;
  if (!(span > 0)) return null;
  const picked = decimate(order.length, range.maxNotes).map((k) => order[k]);
  const notes = picked.map((i) => ({ t: ((mark.x[i] - x0) / span) * range.seconds, hz: pitchFor(mark.y[i], spec.y, range) }));
  const level = referenceLevel(spec);
  const referenceHz = pitchFor(level.value, spec.y, range);
  const name = mark.label?.plain ?? mark.id ?? "the series";
  const xLabel = spec.x.label?.plain ?? "x";
  const yLabel = spec.y.label?.plain ?? "y";
  const [yLow, yHigh] = spec.y.scale.domain;
  return Object.freeze({
    figureId: spec.id,
    series: name,
    notes: Object.freeze(notes),
    durationSeconds: range.seconds,
    reference: Object.freeze({ hz: referenceHz, level: level.value, label: level.label, source: level.source }),
    gain: range.gain,
    referenceGain: range.referenceGain,
    description: `Sound of ${name}: time runs along ${xLabel} from ${fmt(x0)} to ${fmt(x1)} over ${range.seconds} seconds, and pitch follows ${yLabel}, `
      + `${range.lowHz} Hz at ${fmt(yLow)} up to ${range.highHz} Hz at ${fmt(yHigh)}. `
      + `A steady quieter reference tone of ${Math.round(referenceHz)} Hz marks ${yLabel} = ${fmt(level.value)}, ${level.label}.`,
  });
}

/**
 * The live player. `AudioContextCtor` defaults to the browser's; tests inject a mock. The constructor makes no audio call.
 * `toggle(plan)` plays from the start, pauses a playing sound and resumes a paused one; `onState` hears "playing",
 * "paused" and "stopped" so the figure can keep its button and live region truthful.
 */
export function createFigureSonifier({ AudioContextCtor = null, onState = () => {} } = {}) {
  const Ctor = AudioContextCtor ?? globalThis.AudioContext ?? globalThis.webkitAudioContext ?? null;
  let ctx = null, data = null, reference = null, state = "stopped", disposed = false, ended = null;

  function release() {
    clearTimeout(ended);
    ended = null;
    for (const node of [data, reference]) { try { node?.stop(); node?.disconnect(); } catch { /* already stopped */ } }
    data = reference = null;
  }

  function setState(next) {
    if (state === next) return;
    state = next;
    onState(next);
  }

  function start(plan) {
    release();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    data = ctx.createOscillator();
    const dataGain = ctx.createGain();
    data.type = "sine";
    dataGain.gain.value = plan.gain;
    let silent = true;
    for (const { t, hz } of plan.notes) {
      if (hz === null) { dataGain.gain.setValueAtTime(0, now + t); silent = true; continue; }
      if (silent) { dataGain.gain.setValueAtTime(plan.gain, now + t); data.frequency.setValueAtTime(hz, now + t); silent = false; }
      else data.frequency.exponentialRampToValueAtTime(hz, now + t);
    }
    data.connect(dataGain);
    dataGain.connect(master);
    data.start(now);
    data.stop(now + plan.durationSeconds + 0.05);
    reference = ctx.createOscillator();
    const refGain = ctx.createGain();
    reference.type = "triangle";
    reference.frequency.value = plan.reference.hz;
    refGain.gain.value = plan.referenceGain;
    reference.connect(refGain);
    refGain.connect(master);
    reference.start(now);
    reference.stop(now + plan.durationSeconds + 0.05);
    ended = setTimeout(() => { release(); setState("stopped"); }, (plan.durationSeconds + 0.1) * 1000);
    setState("playing");
  }

  return Object.freeze({
    get state() { return state; },
    get supported() { return !!Ctor; },
    async toggle(plan) {
      if (disposed) throw new Error("Sonifier was disposed.");
      if (!Ctor) throw new Error("Web Audio is unavailable in this browser; the sound cannot play.");
      if (!plan) throw new TypeError("toggle needs a plan from sonificationPlan()");
      if (!ctx) ctx = new Ctor();
      if (state === "playing") { await ctx.suspend(); setState("paused"); return state; }
      if (state === "paused") { await ctx.resume(); setState("playing"); return state; }
      if (ctx.state === "suspended") await ctx.resume();
      start(plan);
      return state;
    },
    stop() {
      release();
      if (ctx?.state === "suspended") void ctx.resume();
      setState("stopped");
    },
    dispose() {
      disposed = true;
      release();
      void ctx?.close?.();
      ctx = null;
      setState("stopped");
    },
  });
}
