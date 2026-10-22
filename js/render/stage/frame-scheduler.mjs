/*
 * Frame scheduler: decides which views render on this frame. Pure and
 * deterministic: the same register/handle/plan call sequence always yields
 * the same plans, so it is covered by node:test with an injected clock.
 *
 * Rules (docs/render/performance-contract.md):
 *  - an invisible view never renders; an invalidation that arrives while it
 *    is hidden is remembered and paid once when it becomes visible again;
 *  - a static visible view renders once after each invalidate();
 *  - an animated visible view renders every frame, unless the summed cost of
 *    this frame's candidates exceeds budgetMs: then views are taken in
 *    priority order, and a view that has been skipped maxSkippedFrames times
 *    in a row is forced in, so nothing starves (the budget yields before
 *    that guarantee does; the quality governor is what lowers the cost);
 *  - under reduced motion an animated view renders at most reducedFps times
 *    per second, unless the user is interacting: invalidate() from input
 *    marks the scheduler as interacting for interactingMs.
 */

const DEFAULTS = Object.freeze({
  budgetMs: 8, maxSkippedFrames: 2, reducedFps: 10, interactingMs: 300,
});

export function createFrameScheduler({
  budgetMs = DEFAULTS.budgetMs,
  now = () => 0,
  maxSkippedFrames = DEFAULTS.maxSkippedFrames,
  reducedFps = DEFAULTS.reducedFps,
  interactingMs = DEFAULTS.interactingMs,
  reducedMotion = false,
  onChange = null,
} = {}) {
  if (!(budgetMs > 0)) throw new RangeError("budgetMs must be positive");
  if (!Number.isInteger(maxSkippedFrames) || maxSkippedFrames < 0) throw new RangeError("maxSkippedFrames must be a nonnegative integer");
  if (!(reducedFps > 0) || !(interactingMs >= 0)) throw new RangeError("reducedFps must be positive and interactingMs nonnegative");
  const views = new Map();
  let nextId = 1;
  let interactUntil = -Infinity;
  const isReduced = typeof reducedMotion === "function" ? reducedMotion : () => !!reducedMotion;
  const changed = () => { if (onChange) onChange(); };

  function register({ id, priority = 0, animated = false, visible = true, costMs = 0 } = {}) {
    const viewId = id ?? `view-${nextId++}`;
    if (views.has(viewId)) throw new Error(`Duplicate view id: ${viewId}`);
    const view = { id: viewId, priority, animated: !!animated, visible: !!visible, costMs, dirty: true, skipped: 0, lastRendered: -Infinity, seq: views.size };
    views.set(viewId, view);
    changed();
    const guard = () => { if (!views.has(viewId)) throw new Error(`View ${viewId} is disposed`); };
    return Object.freeze({
      id: viewId,
      invalidate({ input = true } = {}) {
        guard();
        view.dirty = true;
        if (input) interactUntil = now() + interactingMs;
        changed();
      },
      setAnimated(value) { guard(); const next = !!value; if (view.animated !== next) { view.animated = next; if (next) view.skipped = 0; changed(); } },
      setVisible(value) { guard(); const next = !!value; if (view.visible !== next) { view.visible = next; if (next) view.skipped = 0; changed(); } },
      setCostMs(ms) {
        guard();
        if (!Number.isFinite(ms) || ms < 0) throw new RangeError("costMs must be finite and nonnegative");
        view.costMs = ms;
      },
      setPriority(value) { guard(); view.priority = value; },
      dispose() { views.delete(viewId); changed(); },
    });
  }

  /** True while any visible view still has a frame to draw or animates. */
  function hasWork() {
    for (const v of views.values()) if (v.visible && (v.animated || v.dirty)) return true;
    return false;
  }

  function plan(time = now()) {
    const reduced = isReduced();
    const interacting = time < interactUntil;
    const must = [], optional = [];
    for (const v of views.values()) {
      if (!v.visible) continue;
      if (!v.animated) { if (v.dirty) must.push(v); continue; }
      if (reduced && !interacting && !v.dirty && time - v.lastRendered < 1000 / reducedFps) continue;
      (v.dirty || v.skipped >= maxSkippedFrames ? must : optional).push(v);
    }
    const order = (a, b) => b.priority - a.priority || b.skipped - a.skipped || a.seq - b.seq;
    must.sort(order); optional.sort(order);
    const chosen = [...must];
    let spent = must.reduce((sum, v) => sum + v.costMs, 0);
    for (const v of optional) {
      if (chosen.length === 0 || spent + v.costMs <= budgetMs) { chosen.push(v); spent += v.costMs; }
    }
    const picked = new Set(chosen);
    for (const v of optional) if (!picked.has(v)) v.skipped += 1;
    for (const v of chosen) { v.skipped = 0; v.dirty = false; v.lastRendered = time; }
    return chosen.map((v) => v.id);
  }

  return Object.freeze({
    register, plan, hasWork,
    get size() { return views.size; },
    get interacting() { return now() < interactUntil; },
    snapshot() { return [...views.values()].map((v) => ({ id: v.id, animated: v.animated, visible: v.visible, dirty: v.dirty, skipped: v.skipped, costMs: v.costMs })); },
  });
}
