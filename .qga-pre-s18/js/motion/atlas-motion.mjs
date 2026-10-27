/**
 * Shared motion foundation for the premium interaction layer (Prompt 10).
 *
 * Single easing + tween source for every new animation: the command palette,
 * compare divider, snapshot fly-to, annotation pop-in and concept-highlight
 * pulses all route through EASINGS and the deterministic tween runner here.
 *
 * Design rules (mirrors the atlas determinism discipline):
 *   - EASINGS are pure functions of t in [0, 1].
 *   - createTweenRunner is deterministic: time is injected (now()), never
 *     sampled internally, so Node tests can step frame by frame.
 *   - The browser runtime owns exactly ONE requestAnimationFrame loop that
 *     runs only while tweens/springs are active — no idle rAF, ever.
 *   - prefers-reduced-motion: every tween snaps to its end value on the next
 *     tick; springs jump to target; nothing animates, everything still works.
 */

export const EASINGS = Object.freeze({
  linear: (t) => t,
  easeOutCubic: (t) => 1 - (1 - t) ** 3,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  easeOutQuint: (t) => 1 - (1 - t) ** 5,
  easeInOutQuint: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2),
  smoothstep: (t) => t * t * (3 - 2 * t),
});

/** Clamp + validate an easing lookup. Unknown names throw (typo guard). */
export function resolveEasing(name) {
  const fn = EASINGS[name];
  if (typeof fn !== "function") throw new TypeError(`Unknown easing "${name}"`);
  return fn;
}

/**
 * Deterministic tween runner. `now()` returns milliseconds; tests inject a
 * fake clock. Tweens are plain descriptors:
 *
 *   runner.add({
 *     from: 0, to: 1, duration: 700, easing: "easeInOutCubic",
 *     onUpdate(value, t), onComplete(), id?, reducedMotion?: bool
 *   })
 *
 * A tween whose reducedMotion flag is true snaps immediately: onUpdate(to)
 * then onComplete() on the next tick. Removing by id cancels silently.
 */
export function createTweenRunner({ now = () => Date.now() } = {}) {
  if (typeof now !== "function") throw new TypeError("Tween runner requires a now() clock");
  const active = new Map();
  let nextKey = 1;
  let lastTime = null;

  function add(tween) {
    if (!tween || typeof tween !== "object") throw new TypeError("Tween descriptor required");
    const { from, to, duration = 300, easing = "easeOutCubic", onUpdate, onComplete } = tween;
    if (typeof onUpdate !== "function") throw new TypeError("Tween requires onUpdate(value, t)");
    if (!Number.isFinite(duration) || duration <= 0) throw new RangeError("Tween duration must be positive milliseconds");
    const ease = typeof easing === "function" ? easing : resolveEasing(easing);
    const key = tween.id ?? `tween-${nextKey++}`;
    const entry = {
      key, from: Number(from) || 0, to: Number(to), duration, ease,
      onUpdate, onComplete: typeof onComplete === "function" ? onComplete : null,
      startTime: lastTime ?? now(), reducedMotion: tween.reducedMotion === true,
    };
    active.set(key, entry);
    return key;
  }

  function remove(key) { return active.delete(key); }
  function clear() { active.clear(); }

  /** Advance to `time` (ms). Returns the finished tween ids this tick. */
  function tick(time = now()) {
    if (!Number.isFinite(time)) throw new RangeError("Tick time must be finite");
    if (time < (lastTime ?? time)) throw new RangeError("Tick time must be monotonic");
    lastTime = time;
    if (active.size === 0) return [];
    const finished = [];
    for (const entry of [...active.values()]) {
      if (entry.reducedMotion) {
        entry.onUpdate(entry.to, 1);
        active.delete(entry.key);
        if (entry.onComplete) entry.onComplete();
        finished.push(entry.key);
        continue;
      }
      const elapsed = time - entry.startTime;
      const t = Math.min(1, Math.max(0, elapsed / entry.duration));
      const value = entry.from + (entry.to - entry.from) * entry.ease(t);
      entry.onUpdate(value, t);
      if (t >= 1) {
        active.delete(entry.key);
        if (entry.onComplete) entry.onComplete();
        finished.push(entry.key);
      }
    }
    return finished;
  }

  return Object.freeze({ add, remove, clear, tick, get size() { return active.size; } });
}

/**
 * Critically damped 1-D spring for pointer-driven inertia (compare divider).
 * Analytic solution — no easing library, no per-frame allocation:
 *
 *   x(t) = target + (x0 - target) * e^(-ωt) * (1 + ωt)   [critical damping]
 *
 * step() advances state by dt seconds and returns the new position; the
 * spring is "settled" when |x - target| is negligible.
 */
export function createCriticallyDampedSpring({ omega = 18, initial = 0.5 } = {}) {
  if (!Number.isFinite(omega) || omega <= 0) throw new RangeError("Spring omega must be positive");
  let x = initial, target = initial, t = 0;
  return Object.freeze({
    get position() { return x; },
    get target() { return target; },
    setTarget(value, { snap = false } = {}) {
      target = Number(value);
      if (snap) { x = target; t = 0; }
      else t = 0;
    },
    /** Advance by dt seconds; returns { position, settled }. */
    step(dt) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError("Spring dt must be nonnegative");
      if (dt === 0) return { position: x, settled: Math.abs(x - target) < 1e-6 };
      t += dt;
      const decay = Math.exp(-omega * t) * (1 + omega * t);
      x = target + (x - target) * decay;
      return { position: x, settled: Math.abs(x - target) < 5e-4 };
    },
  });
}

/**
 * Browser motion runtime: one shared rAF clock for the whole interaction
 * layer. The loop starts lazily when the first listener registers work and
 * stops the moment no listener needs a frame (bounded by design).
 *
 * Listeners are { onFrame(nowMs, dtSeconds) } — the runner itself stays
 * DOM-free and testable; attach() wires it to requestAnimationFrame.
 */
export function createMotionRuntime({ runner, requestFrame = (cb) => requestAnimationFrame(cb), cancelFrame = (id) => cancelAnimationFrame(id), now = () => performance.now() } = {}) {
  const tweens = runner ?? createTweenRunner({ now });
  const frameListeners = new Set();
  let rafId = null, lastFrame = null;

  function pump(nowMs) {
    rafId = null;
    const dt = lastFrame == null ? 0 : Math.min(0.05, (nowMs - lastFrame) / 1000);
    lastFrame = nowMs;
    tweens.tick(nowMs);
    for (const listener of [...frameListeners]) listener.onFrame(nowMs, dt);
    if (frameListeners.size > 0 || tweens.size > 0) rafId = requestFrame(pump);
    else lastFrame = null;
  }
  function ensureLoop() {
    if (rafId == null && (frameListeners.size > 0 || tweens.size > 0)) rafId = requestFrame(pump);
  }
  return Object.freeze({
    tweens,
    addFrameListener(listener) {
      if (!listener || typeof listener.onFrame !== "function") throw new TypeError("Frame listener requires onFrame(now, dt)");
      frameListeners.add(listener);
      ensureLoop();
      return () => frameListeners.delete(listener);
    },
    tween(descriptor) {
      const key = tweens.add(descriptor);
      ensureLoop();
      return () => tweens.remove(key);
    },
    get activeFrameListeners() { return frameListeners.size; },
  });
}

/** Shared system reduced-motion probe (SSR-safe: no matchMedia, no throw). */
export function systemReducedMotion() {
  try {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches === true;
  } catch (error) {
    return false;
  }
}
