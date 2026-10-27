import test from "node:test";
import assert from "node:assert/strict";
import { createFrameScheduler } from "../js/render/stage/frame-scheduler.mjs";
import { createContextPool } from "../js/render/stage/context-pool.mjs";

function clock() {
  let t = 0;
  return { now: () => t, advance: (ms) => { t += ms; return t; } };
}

test("validation", () => {
  assert.throws(() => createFrameScheduler({ budgetMs: 0 }), RangeError);
  assert.throws(() => createFrameScheduler({ maxSkippedFrames: -1 }), RangeError);
  assert.throws(() => createFrameScheduler({ reducedFps: 0 }), RangeError);
  const s = createFrameScheduler();
  s.register({ id: "a" });
  assert.throws(() => s.register({ id: "a" }), /Duplicate/);
  const h = s.register({ id: "b" });
  assert.throws(() => h.setCostMs(-1), RangeError);
  h.dispose();
  assert.throws(() => h.invalidate(), /disposed/);
  assert.equal(s.size, 1);
});

test("a static visible view renders once after each invalidate", () => {
  const c = clock(), s = createFrameScheduler({ now: c.now });
  const v = s.register({ id: "s" });
  assert.deepEqual(s.plan(c.advance(16)), ["s"], "first frame is owed at registration");
  for (let i = 0; i < 20; i++) assert.deepEqual(s.plan(c.advance(16)), []);
  v.invalidate();
  assert.deepEqual(s.plan(c.advance(16)), ["s"]);
  assert.deepEqual(s.plan(c.advance(16)), []);
  assert.equal(s.hasWork(), false);
  v.invalidate();
  v.invalidate();
  assert.equal(s.hasWork(), true);
  assert.deepEqual(s.plan(c.advance(16)), ["s"], "several invalidations coalesce into one frame");
});

test("an invisible view never renders; its pending invalidation is paid when it returns", () => {
  const c = clock(), s = createFrameScheduler({ now: c.now });
  const v = s.register({ id: "a", animated: true, visible: false });
  for (let i = 0; i < 5; i++) assert.deepEqual(s.plan(c.advance(16)), []);
  assert.equal(s.hasWork(), false);
  v.invalidate({ input: false });
  assert.deepEqual(s.plan(c.advance(16)), []);
  v.setVisible(true);
  assert.deepEqual(s.plan(c.advance(16)), ["a"]);
  v.setAnimated(false);
  assert.deepEqual(s.plan(c.advance(16)), []);
});

test("animated visible views render every frame while under budget", () => {
  const c = clock(), s = createFrameScheduler({ now: c.now, budgetMs: 8 });
  const a = s.register({ id: "a", animated: true }), b = s.register({ id: "b", animated: true });
  a.setCostMs(3); b.setCostMs(4);
  for (let i = 0; i < 10; i++) assert.deepEqual(s.plan(c.advance(16)).sort(), ["a", "b"]);
});

test("over budget: priority order, round robin, and no view is skipped more than twice in a row", () => {
  const c = clock(), s = createFrameScheduler({ now: c.now, budgetMs: 8, maxSkippedFrames: 2 });
  const handles = ["a", "b", "c", "d"].map((id, i) => {
    const h = s.register({ id, animated: true, priority: id === "a" ? 5 : 0 });
    h.setCostMs(5);
    return h;
  });
  assert.equal(handles.length, 4);
  const run = {};
  const gap = { a: 0, b: 0, c: 0, d: 0 };
  let worst = 0;
  const frames = [];
  for (let f = 0; f < 60; f++) {
    const planned = s.plan(c.advance(16));
    frames.push(planned);
    for (const id of Object.keys(gap)) {
      if (planned.includes(id)) { gap[id] = 0; run[id] = (run[id] ?? 0) + 1; } else { gap[id] += 1; worst = Math.max(worst, gap[id]); }
    }
  }
  assert.ok(worst <= 2, `a view was skipped ${worst} frames in a row`);
  assert.equal(frames[0][0], "a", "highest priority first");
  assert.ok(Object.keys(gap).every((id) => run[id] >= 15), `every view progresses: ${JSON.stringify(run)}`);
  assert.ok(frames.every((p) => p.length >= 1), "at least one view per frame");
});

test("a single view over budget still renders", () => {
  const c = clock(), s = createFrameScheduler({ now: c.now, budgetMs: 8 });
  const v = s.register({ id: "heavy", animated: true });
  v.setCostMs(30);
  for (let i = 0; i < 5; i++) assert.deepEqual(s.plan(c.advance(16)), ["heavy"]);
});

test("reduced motion caps animated views at 10 fps unless the user is interacting", () => {
  const c = clock();
  let reduced = true;
  const s = createFrameScheduler({ now: c.now, reducedMotion: () => reduced });
  const v = s.register({ id: "a", animated: true });
  let rendered = 0;
  for (let i = 0; i < 120; i++) rendered += s.plan(c.advance(1000 / 60)).length; // 2 s at 60 Hz
  assert.ok(rendered >= 19 && rendered <= 21, `expected ~20 frames in 2 s, got ${rendered}`);
  v.invalidate();
  assert.equal(s.interacting, true);
  let during = 0;
  for (let i = 0; i < 12; i++) during += s.plan(c.advance(16)).length; // 192 ms < 300 ms
  assert.equal(during, 12, "full rate while interacting");
  c.advance(400);
  assert.equal(s.interacting, false);
  reduced = false;
  assert.deepEqual(s.plan(c.advance(16)), ["a"]);
  assert.deepEqual(s.plan(c.advance(16)), ["a"]);
});

test("non-input invalidations do not count as interaction", () => {
  const c = clock(), s = createFrameScheduler({ now: c.now, reducedMotion: true });
  const v = s.register({ id: "a", animated: true });
  s.plan(c.advance(16));
  v.invalidate({ input: false });
  assert.equal(s.interacting, false);
});

test("onChange fires on every state change so a stage can wake its loop", () => {
  let changes = 0;
  const c = clock(), s = createFrameScheduler({ now: c.now, onChange: () => { changes += 1; } });
  const v = s.register({ id: "a" });
  v.invalidate(); v.setAnimated(true); v.setAnimated(true); v.setVisible(false); v.dispose();
  assert.equal(changes, 5, "register, invalidate, setAnimated(true), setVisible(false), dispose (the repeat is a no-op)");
});

test("plans are deterministic for the same call sequence", () => {
  const trace = () => {
    const c = clock(), s = createFrameScheduler({ now: c.now, budgetMs: 6 });
    const hs = ["x", "y", "z"].map((id) => { const h = s.register({ id, animated: true }); h.setCostMs(4); return h; });
    const out = [];
    for (let f = 0; f < 40; f++) { if (f === 10) hs[1].setVisible(false); if (f === 20) hs[1].setVisible(true); out.push(s.plan(c.advance(16))); }
    return out;
  };
  assert.deepEqual(trace(), trace());
});

test("context pool keeps at most `limit` live and evicts the least recently visible", () => {
  const pool = createContextPool({ limit: 4 });
  for (const id of ["a", "b", "c", "d", "e"]) pool.register(id);
  for (const id of ["a", "b", "c", "d"]) { pool.setVisible(id, true); assert.deepEqual(pool.request(id), []); }
  assert.equal(pool.liveCount, 4);
  pool.setVisible("a", false); pool.setVisible("b", false);
  pool.setVisible("e", true);
  assert.deepEqual(pool.request("e"), ["a"], "hidden and visible longest ago");
  assert.equal(pool.liveCount, 4);
  assert.equal(pool.isLive("a"), false);
  pool.setVisible("a", true);
  assert.deepEqual(pool.request("a"), ["b"], "the other hidden scene goes next");
  pool.setVisible("b", true);
  const victims = pool.request("b");
  assert.equal(victims.length, 1);
  assert.ok(!victims.includes("b"));
  assert.ok(pool.liveCount <= 4);
});

test("context pool never evicts the requester, is idempotent, and validates", () => {
  assert.throws(() => createContextPool({ limit: 0 }), RangeError);
  const pool = createContextPool({ limit: 1 });
  pool.register("a"); pool.register("b");
  pool.setVisible("a", true);
  assert.deepEqual(pool.request("a"), []);
  assert.deepEqual(pool.request("a"), []);
  pool.setVisible("b", true);
  assert.deepEqual(pool.request("b"), ["a"]);
  assert.deepEqual(pool.liveIds(), ["b"]);
  pool.release("b");
  assert.equal(pool.liveCount, 0);
  assert.throws(() => pool.request("zzz"), /Unknown/);
});

test("context pool: a scene out of view never evicts one in view; it is denied until seen, or forced", () => {
  const pool = createContextPool({ limit: 2 });
  for (const id of ["a", "b", "c"]) pool.register(id);
  pool.setVisible("a", true); pool.request("a");
  pool.setVisible("b", true); pool.request("b");
  assert.equal(pool.request("c"), null, "c is not visible and every candidate is");
  assert.equal(pool.isLive("c"), false);
  assert.deepEqual(pool.liveIds().sort(), ["a", "b"], "a denied request changes nothing");
  assert.deepEqual(pool.request("c", { force: true }), ["a"], "forced requests still evict the least recently visible");
  pool.release("c");
  pool.setVisible("b", false);
  assert.deepEqual(pool.request("c"), [], "a hidden live scene makes room without eviction of a visible one: free slot");
});
test("context pool: an out-of-view requester may evict out-of-view scenes", () => {
  const pool = createContextPool({ limit: 1 });
  pool.register("a"); pool.register("b");
  pool.setVisible("a", true); pool.request("a"); pool.setVisible("a", false);
  assert.deepEqual(pool.request("b"), ["a"]);
});
