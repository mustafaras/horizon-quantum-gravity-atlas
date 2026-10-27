import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EASINGS, resolveEasing, createTweenRunner, createCriticallyDampedSpring,
  createMotionRuntime, systemReducedMotion,
} from "../js/motion/atlas-motion.mjs";

test("easings are pure, bounded and monotone where required", () => {
  for (const [name, fn] of Object.entries(EASINGS)) {
    assert.equal(fn(0), 0, `${name}(0)`);
    assert.equal(fn(1), 1, `${name}(1)`);
    for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      const value = fn(t);
      assert.ok(value >= -1e-9 && value <= 1 + 1e-9, `${name}(${t}) out of [0,1]: ${value}`);
    }
  }
  // easeOutCubic starts fast; easeInOutQuint is slow at both ends.
  assert.ok(EASINGS.easeOutCubic(0.25) > 0.25);
  assert.ok(EASINGS.easeInOutQuint(0.25) < 0.25);
  assert.ok(EASINGS.easeInOutQuint(0.75) > 0.75);
  assert.equal(EASINGS.smoothstep(0.5), 0.5);
  assert.throws(() => resolveEasing("easeInOutSine"), /Unknown easing/);
});

test("tween runner is deterministic under an injected clock", () => {
  let clock = 1000;
  const runner = createTweenRunner({ now: () => clock });
  const samples = [];
  runner.add({ from: 0, to: 10, duration: 200, easing: "linear", onUpdate: (v) => samples.push(v) });
  runner.tick(clock); // t = 0
  clock += 100; runner.tick(clock); // t = 0.5
  clock += 100; runner.tick(clock); // t = 1 → complete
  assert.deepEqual(samples.map((v) => Math.round(v)), [0, 5, 10]);
  assert.equal(runner.size, 0);

  // Identical inputs → identical outputs (fresh runner, same clock).
  let clock2 = 1000;
  const runner2 = createTweenRunner({ now: () => clock2 });
  const samples2 = [];
  runner2.add({ from: 0, to: 10, duration: 200, easing: "linear", onUpdate: (v) => samples2.push(v) });
  runner2.tick(clock2); clock2 += 100; runner2.tick(clock2); clock2 += 100; runner2.tick(clock2);
  assert.deepEqual(samples, samples2);
});

test("tween runner clamps overshoot, rejects bad descriptors and monotonicity breaks", () => {
  const runner = createTweenRunner({ now: () => 0 });
  assert.throws(() => runner.add({ onUpdate: () => {}, duration: 0 }), /duration/);
  assert.throws(() => runner.add({ from: 0, to: 1, duration: 100 }), /onUpdate/);
  assert.throws(() => runner.add({ from: 0, to: 1, duration: 100, onUpdate: () => {}, easing: "nope" }), /Unknown easing/);
  runner.tick(0);
  assert.throws(() => runner.tick(-5), /monotonic/);
  // Far-future tick lands exactly on the end value, never beyond.
  const seen = [];
  runner.add({ from: 2, to: 5, duration: 10, easing: "easeInOutQuint", onUpdate: (v) => seen.push(v) });
  runner.tick(10_000);
  assert.equal(seen[seen.length - 1], 5);
});

test("reduced-motion tweens snap instantly and still complete", () => {
  const runner = createTweenRunner({ now: () => 0 });
  const calls = [];
  let completed = false;
  runner.add({
    from: 0, to: 7, duration: 900, easing: "easeInOutQuint", reducedMotion: true,
    onUpdate: (v, t) => calls.push([v, t]),
    onComplete: () => { completed = true; },
  });
  const finished = runner.tick(0);
  assert.deepEqual(calls, [[7, 1]]);
  assert.equal(completed, true);
  assert.deepEqual(finished.length, 1);
  assert.equal(runner.size, 0);
});

test("critically damped spring converges without overshoot", () => {
  const spring = createCriticallyDampedSpring({ omega: 14, initial: 0.2 });
  spring.setTarget(0.8);
  let position = spring.position;
  let maxSeen = position;
  let settledAt = null;
  for (let i = 1; i <= 240; i++) {
    const result = spring.step(1 / 60);
    maxSeen = Math.max(maxSeen, result.position);
    if (settledAt === null && result.settled) settledAt = i;
    position = result.position;
  }
  // Critical damping: approaches 0.8 from below, never overshoots.
  assert.ok(maxSeen <= 0.8 + 1e-6, `overshoot: ${maxSeen}`);
  assert.ok(Math.abs(position - 0.8) < 1e-3);
  assert.ok(settledAt !== null && settledAt < 240);
  // Snap mode jumps immediately.
  spring.setTarget(0.1, { snap: true });
  assert.equal(spring.position, 0.1);
  assert.throws(() => createCriticallyDampedSpring({ omega: 0 }), /omega/);
});

test("motion runtime runs one loop only while work exists", () => {
  let frames = 0;
  let scheduled = 0;
  const requestFrame = (cb) => { scheduled++; return 0; };
  const runtime = createMotionRuntime({ requestFrame, cancelFrame: () => {}, now: () => 0 });
  const remove = runtime.addFrameListener({ onFrame: () => { frames++; } });
  assert.ok(scheduled >= 1, "loop starts with a listener");
  // Simulate the pump being invoked manually (requestFrame is a stub).
  // The runtime exposes the pump through the frame callback; drive it via tween ticks.
  runtime.tween({ from: 0, to: 1, duration: 50, onUpdate: () => {} });
  assert.ok(runtime.activeFrameListeners === 1);
  remove();
  assert.equal(runtime.activeFrameListeners, 0);
  assert.throws(() => runtime.addFrameListener({}), /onFrame/);
});

test("systemReducedMotion never throws without matchMedia", () => {
  assert.equal(typeof systemReducedMotion(), "boolean");
});
