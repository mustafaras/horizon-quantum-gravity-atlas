// js/cinematic/timeline.mjs — deterministic playback timeline (Prompt 09).
//
// Pure logic: no clocks, no DOM. The caller drives time with tick(dt), so
// identical call sequences always produce identical states and boundary
// events — the property the QA suite depends on.

/* Deterministic easing family. Every function maps [0,1] → [0,1] exactly:
   f(0)=0, f(1)=1, monotone, no floating-point drift at the endpoints. */
export const EASINGS = Object.freeze({
  linear: (x) => x,
  easeInOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  easeOutCubic: (x) => 1 - Math.pow(1 - x, 3),
  easeInOutQuint: (x) => (x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2),
  smoothstep: (x) => x * x * (3 - 2 * x),
});

export function easingFn(name) {
  return Object.hasOwn(EASINGS, name) ? EASINGS[name] : EASINGS.easeInOutCubic;
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));

/**
 * Create a playback timeline over [0, duration].
 *
 * events: boundary crossings fire exactly once per crossing, in both
 * directions, including crossings caused by seek(). Listener exceptions
 * never break playback.
 */
export function createTimeline({ duration = 0, boundaries = [] } = {}) {
  if (!(duration >= 0) || !Number.isFinite(duration)) {
    throw new TypeError("timeline duration must be a finite non-negative number");
  }
  let t = 0;
  let playing = false;
  let disposed = false;
  let rate = 1;

  const sorted = [...boundaries]
    .filter((b) => Number.isFinite(b.time) && b.time >= 0 && b.time <= duration)
    .sort((a, b) => a.time - b.time);
  const listeners = new Set();

  const assertLive = () => {
    if (disposed) throw new Error("timeline is disposed");
  };

  const emit = (boundary, direction) => {
    for (const fn of listeners) {
      try { fn({ boundary, direction, time: t }); }
      catch (e) { /* a listener must never break playback */ }
    }
  };

  // Fire every boundary in (from, to] (forward) or [to, from) (backward).
  const fireCrossings = (from, to) => {
    if (from === to) return;
    if (to > from) {
      for (const b of sorted) if (b.time > from && b.time <= to) emit(b, "forward");
    } else {
      for (let i = sorted.length - 1; i >= 0; i--) {
        const b = sorted[i];
        if (b.time < from && b.time >= to) emit(b, "backward");
      }
    }
  };

  const api = {
    get duration() { return duration; },
    get t() { return t; },
    get playing() { return playing; },
    get disposed() { return disposed; },
    get rate() { return rate; },
    setRate(v) { assertLive(); if (Number.isFinite(v) && v > 0) rate = v; },

    progress() { return duration > 0 ? clamp01(t / duration) : 0; },

    play() { assertLive(); playing = true; },
    pause() { assertLive(); playing = false; },

    seek(to) {
      assertLive();
      if (!Number.isFinite(to)) return t;
      const next = Math.min(duration, Math.max(0, to));
      const prev = t;
      t = next;
      fireCrossings(prev, next);
      return t;
    },

    /** Advance by dt seconds when playing. Returns the new time. */
    tick(dt) {
      assertLive();
      if (!playing || !Number.isFinite(dt) || dt <= 0) return t;
      const prev = t;
      t = Math.min(duration, t + dt * rate);
      fireCrossings(prev, t);
      if (t >= duration) playing = false; // reached the end: stop cleanly
      return t;
    },

    onBoundary(fn) {
      assertLive();
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    dispose() {
      disposed = true;
      playing = false;
      listeners.clear();
    },
  };
  return api;
}
