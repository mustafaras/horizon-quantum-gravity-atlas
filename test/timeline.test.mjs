import test from "node:test";
import assert from "node:assert/strict";
import { createTimeline, EASINGS, easingFn } from "../js/cinematic/timeline.mjs";

test("timeline: duration validation", () => {
  assert.throws(() => createTimeline({ duration: NaN }), TypeError);
  assert.throws(() => createTimeline({ duration: -1 }), TypeError);
  assert.equal(createTimeline({ duration: 0 }).duration, 0);
});

test("timeline: play/tick/pause advances time only while playing", () => {
  const tl = createTimeline({ duration: 10 });
  tl.tick(1);
  assert.equal(tl.t, 0); // paused: no advance
  tl.play();
  tl.tick(2);
  assert.equal(tl.t, 2);
  tl.pause();
  tl.tick(3);
  assert.equal(tl.t, 2);
  tl.play();
  tl.tick(1);
  assert.equal(tl.t, 3);
});

test("timeline: clamps at boundaries and stops at the end", () => {
  const tl = createTimeline({ duration: 2 });
  tl.play();
  tl.tick(5);
  assert.equal(tl.t, 2);
  assert.equal(tl.playing, false);
  tl.seek(-100);
  assert.equal(tl.t, 0);
  tl.seek(100);
  assert.equal(tl.t, 2);
});

test("timeline: seek fires boundary crossings in both directions exactly once", () => {
  const hits = [];
  const tl = createTimeline({
    duration: 9,
    boundaries: [{ time: 3, shotId: "b" }, { time: 6, shotId: "c" }],
  });
  tl.onBoundary((e) => hits.push(e.boundary.shotId + ":" + e.direction));
  tl.seek(4);            // cross 3 forward
  assert.deepEqual(hits, ["b:forward"]);
  tl.seek(8);            // cross 6 forward
  tl.seek(0);            // cross 6 then 3 backward
  assert.deepEqual(hits, ["b:forward", "c:forward", "c:backward", "b:backward"]);
  hits.length = 0;
  tl.seek(3);            // landing exactly on a boundary counts as a forward crossing
  assert.deepEqual(hits, ["b:forward"]);
  hits.length = 0;
  tl.seek(3);            // no movement: no events
  assert.deepEqual(hits, []);
});

test("timeline: tick crossing fires the same events as an equivalent seek", () => {
  const events = (useSeek) => {
    const hits = [];
    const tl = createTimeline({ duration: 6, boundaries: [{ time: 3, shotId: "x" }] });
    tl.onBoundary((e) => hits.push(e.boundary.shotId));
    if (useSeek) tl.seek(4);
    else { tl.play(); tl.tick(4); }
    return hits;
  };
  assert.deepEqual(events(false), events(true));
});

test("timeline: progress is normalized and clamped", () => {
  const tl = createTimeline({ duration: 8 });
  tl.seek(2);
  assert.equal(tl.progress(), 0.25);
  tl.seek(99);
  assert.equal(tl.progress(), 1);
});

test("timeline: rate scales ticks", () => {
  const tl = createTimeline({ duration: 100 });
  tl.play();
  tl.setRate(2);
  tl.tick(1.5);
  assert.equal(tl.t, 3);
});

test("timeline: dispose freezes the object and clears listeners", () => {
  const tl = createTimeline({ duration: 5, boundaries: [{ time: 1, shotId: "a" }] });
  let fired = 0;
  tl.onBoundary(() => { fired++; });
  tl.dispose();
  assert.equal(tl.disposed, true);
  assert.throws(() => tl.play(), /disposed/);
  assert.throws(() => tl.seek(1), /disposed/);
  assert.throws(() => tl.tick(1), /disposed/);
  assert.equal(fired, 0);
});

test("timeline: listener exceptions never break playback", () => {
  const tl = createTimeline({ duration: 4, boundaries: [{ time: 2, shotId: "a" }] });
  tl.onBoundary(() => { throw new Error("boom"); });
  let ok = 0;
  tl.onBoundary(() => { ok++; });
  tl.seek(3);
  assert.equal(ok, 1);
  assert.equal(tl.t, 3);
});

test("easings: deterministic endpoints and monotonicity", () => {
  for (const [name, fn] of Object.entries(EASINGS)) {
    assert.equal(fn(0), 0, name + " f(0)");
    assert.equal(fn(1), 1, name + " f(1)");
    let prev = -1;
    for (let i = 0; i <= 100; i++) {
      const v = fn(i / 100);
      assert.ok(v >= prev - 1e-12, name + " monotone at " + i);
      assert.ok(v >= 0 && v <= 1, name + " range at " + i);
      prev = v;
    }
    // determinism: same input → same output
    assert.equal(fn(0.37), fn(0.37));
  }
});

test("easingFn: unknown names fall back to easeInOutCubic", () => {
  assert.equal(easingFn("nope"), EASINGS.easeInOutCubic);
  assert.equal(easingFn("linear"), EASINGS.linear);
});
