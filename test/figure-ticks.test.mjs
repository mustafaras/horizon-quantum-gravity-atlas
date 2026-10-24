import test from "node:test";
import assert from "node:assert/strict";
import { linearTicks, logTicks, formatTick, formatTicks, niceNumber, superscript } from "../js/figure/ticks.mjs";
import { linear, log, symlog, makeScale } from "../js/figure/scale.mjs";

test("nice numbers follow the 1-2-5 sequence", () => {
  for (const [x, round, want] of [[0.9, true, 1], [1.4, true, 1], [1.6, true, 2], [2.9, true, 2], [3.1, true, 5], [6.9, true, 5], [7.1, true, 10], [1.01, false, 2], [2.01, false, 5], [5.01, false, 10], [230, true, 200]]) {
    assert.equal(niceNumber(x, round), want);
  }
});

test("linear ticks sit inside the range on a 1-2-5 step", () => {
  assert.deepEqual(linearTicks(0, 1200, 5), [0, 500, 1000]);
  assert.deepEqual(linearTicks(0, 1, 3), [0, 0.5, 1]);
  assert.deepEqual(linearTicks(-1, 1, 5), [-1, -0.5, 0, 0.5, 1]);
  assert.deepEqual(linearTicks(0, 0.0025, 6), [0, 0.0005, 0.001, 0.0015, 0.002, 0.0025]);
  for (const [lo, hi] of [[0.13, 7.7], [-3.3, 12], [1e-7, 9e-7], [-4e9, 6e9]]) {
    const t = linearTicks(lo, hi, 6);
    assert.ok(t.length >= 2 && t.every((v) => v >= lo && v <= hi), `${lo}..${hi}: ${t}`);
    const steps = t.slice(1).map((v, i) => v - t[i]);
    const mantissa = steps[0] / 10 ** Math.floor(Math.log10(steps[0]));
    assert.ok([1, 2, 5].some((m) => Math.abs(mantissa - m) < 1e-6), `${steps[0]} is not 1-2-5`);
    assert.ok(steps.every((s) => Math.abs(s - steps[0]) < steps[0] * 1e-6));
  }
});

test("degenerate, reversed and tiny ranges", () => {
  assert.deepEqual(linearTicks(3, 3), [3]);
  assert.deepEqual(linearTicks(1, 0, 3), [1, 0.5, 0]);
  assert.ok(Object.is(linearTicks(-0.5, 0.5, 3)[1], 0), "zero is +0");
  const t = linearTicks(1e-12, 5e-12, 5);
  assert.ok(t.length >= 3);
});

test("NaN and infinite ranges are rejected", () => {
  assert.throws(() => linearTicks(NaN, 1), RangeError);
  assert.throws(() => linearTicks(0, Infinity), RangeError);
  assert.throws(() => logTicks(0, 10), RangeError);
  assert.throws(() => linear([0, NaN]), RangeError);
  assert.throws(() => log([-1, 10]), RangeError);
  assert.throws(() => formatTick(NaN), RangeError);
  assert.ok(Number.isNaN(linear([0, 1], [0, 10]).map(NaN)));
});

test("log ticks are decades with minor 2-9", () => {
  assert.deepEqual(logTicks(1, 1000), [1, 10, 100, 1000]);
  assert.deepEqual(logTicks(0.5, 50), [1, 10]);
  const { major, minor } = logTicks(1, 100, 6, true);
  assert.deepEqual(major, [1, 10, 100]);
  assert.deepEqual(minor, [2, 3, 4, 5, 6, 7, 8, 9, 20, 30, 40, 50, 60, 70, 80, 90]);
  assert.ok(logTicks(1e-30, 1e30).length <= 12, "wide ranges stride over decades");
});

test("labels use x10^n, a true minus, and aligned decimals", () => {
  assert.equal(superscript(-12), "⁻¹²");
  assert.deepEqual(formatTicks([-0.2, 0, 0.2, 0.4]), ["−0.2", "0", "0.2", "0.4"]);
  assert.deepEqual(formatTicks([0, 500, 1000]), ["0", "500", "1000"]);
  assert.deepEqual(formatTicks([1e-3, 1e-2, 1e-1, 1, 10], { decade: true }), ["10⁻³", "10⁻²", "10⁻¹", "1", "10"]);
  assert.equal(formatTick(2.5e-7), "2.5×10⁻⁷");
  assert.equal(formatTick(1.2e8), "1.2×10⁸");
  assert.equal(formatTick(1e5), "10⁵");
  assert.equal(formatTick(-3e-5), "−3×10⁻⁵");
  assert.equal(formatTick(9.9996e5), "10⁶", "mantissa rounding carries into the exponent");
});

test("scales map, invert and round-trip", () => {
  const l = linear([0, 10], [100, 300]);
  assert.equal(l.map(5), 200);
  assert.equal(l.invert(200), 5);
  assert.equal(linear([10, 0], [0, 1]).map(2.5), 0.75);
  const g = log([1, 1000], [0, 300]);
  assert.ok(Math.abs(g.map(10) - 100) < 1e-9 && Math.abs(g.invert(g.map(37)) - 37) < 1e-9);
  assert.ok(Number.isNaN(g.map(-1)) && Number.isNaN(g.map(0)));
  const s = symlog([-100, 100], [0, 1], 1);
  assert.ok(Math.abs(s.map(0) - 0.5) < 1e-12 && s.map(-5) < s.map(-1) && s.map(1) < s.map(5));
  for (const v of [-80, -1, -0.2, 0, 0.3, 4, 77]) assert.ok(Math.abs(s.invert(s.map(v)) - v) < 1e-9);
  assert.deepEqual(s.ticks().includes(0), true);
  assert.equal(makeScale({ type: "log", domain: [1, 10], base: 10 }, [0, 1]).type, "log");
  assert.throws(() => makeScale({ type: "bogus", domain: [0, 1] }), RangeError);
});
