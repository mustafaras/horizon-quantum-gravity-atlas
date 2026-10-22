/*
 * WebGL2 context budget. A WebGL context belongs to one canvas, so on WebGL2
 * every live scene owns a renderer; browsers drop the oldest context past
 * roughly 8-16. The pool keeps at most `limit` live. When a scene needs a
 * context and none is free, the live scene that was visible longest ago
 * (never the requester) must snapshot and release its renderer. Pure: the
 * session layer performs the snapshot, disposal and recreation.
 */

export function createContextPool({ limit = 4 } = {}) {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError("limit must be a positive integer");
  const entries = new Map();
  let tick = 0;

  const entry = (id) => {
    const e = entries.get(id);
    if (!e) throw new Error(`Unknown pool entry: ${id}`);
    return e;
  };

  return Object.freeze({
    limit,
    register(id) {
      if (entries.has(id)) throw new Error(`Duplicate pool entry: ${id}`);
      entries.set(id, { id, live: false, visible: false, lastVisible: -1 });
    },
    unregister(id) { entries.delete(id); },
    setVisible(id, visible) {
      const e = entry(id);
      e.visible = !!visible;
      if (e.visible) e.lastVisible = ++tick;
    },
    /** Reserve a context for `id`. Returns the ids that must release theirs first. */
    request(id) {
      const e = entry(id);
      if (e.live) return Object.freeze([]);
      const victims = [];
      const candidates = [...entries.values()].filter((o) => o.live && o.id !== id)
        .sort((a, b) => Number(a.visible) - Number(b.visible) || a.lastVisible - b.lastVisible);
      let live = candidates.length + 1;
      while (live > limit && candidates.length) { victims.push(candidates.shift().id); live -= 1; }
      for (const v of victims) entries.get(v).live = false;
      e.live = true;
      return Object.freeze(victims);
    },
    release(id) { const e = entries.get(id); if (e) e.live = false; },
    isLive(id) { return entries.get(id)?.live === true; },
    liveIds() { return [...entries.values()].filter((e) => e.live).map((e) => e.id); },
    get liveCount() { return [...entries.values()].filter((e) => e.live).length; },
  });
}
