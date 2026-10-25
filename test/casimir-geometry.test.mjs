// S15: the pure geometry of the cavity scene (js/visualizations/qft/casimir-geometry.mjs): where the plates stand for a gap, and the
// segment pairs of the standing modes between them and of the continuum outside. The scene only uploads these arrays.

import test from "node:test";
import assert from "node:assert/strict";
import {
  GAP_RANGE, MODE_COUNT, MODE_SAMPLES, CONTINUUM_PER_MODE, CONTINUUM_SAMPLES, PLATE, drawnGap, gapFromLog, logFromGap, plateCenters,
  modeLevel, insideSegments, outsideSegments, insideLength, outsideLength, gapTex, pressureTex,
} from "../js/visualizations/qft/casimir-geometry.mjs";

const pair = (flat, i) => ({ a: [flat[6 * i], flat[6 * i + 1], flat[6 * i + 2]], b: [flat[6 * i + 3], flat[6 * i + 4], flat[6 * i + 5]] });

test("the gap range is 10 nm to 10 um and the log slider value round-trips", () => {
  assert.deepEqual(GAP_RANGE, [1e-8, 1e-5]);
  for (const a of [1e-8, 3e-7, 1e-6, 1e-5]) assert.ok(Math.abs(gapFromLog(logFromGap(a)) / a - 1) < 1e-12);
  assert.equal(logFromGap(1e-6), -6);
});

test("the drawn gap grows with the true gap on a log scale and stays on the stage", () => {
  const widths = [1e-8, 1e-7, 1e-6, 1e-5].map(drawnGap);
  assert.ok(widths.every((w, i) => i === 0 || w > widths[i - 1]));
  assert.ok(Math.abs((widths[1] - widths[0]) - (widths[2] - widths[1])) < 1e-12, "equal per decade");
  assert.throws(() => drawnGap(1e-9), RangeError);
  assert.throws(() => drawnGap(1e-4), RangeError);
});

test("the plates stand on either side of the drawn gap with their inner faces at +-g/2", () => {
  const g = drawnGap(1e-6);
  const { left, right } = plateCenters(g);
  assert.ok(Math.abs((right - left) - (g + PLATE.thickness)) < 1e-12);
  assert.ok(Math.abs(left + right) < 1e-12);
});

test("inside: n sinusoids with n - 1 interior nodes, zero at the plates, amplitude 1/sqrt(n), contiguous pairs", () => {
  const g = drawnGap(1e-6), out = new Float32Array(insideLength());
  assert.equal(insideSegments(g, out), out, "writes in place and returns the array it was given");
  assert.equal(out.length, MODE_COUNT * MODE_SAMPLES * 6);
  const peaks = [];
  for (let n = 1; n <= MODE_COUNT; n += 1) {
    const level = modeLevel(n);
    const first = pair(out, (n - 1) * MODE_SAMPLES), last = pair(out, n * MODE_SAMPLES - 1);
    assert.ok(Math.abs(first.a[0] + g / 2) < 1e-5 && Math.abs(last.b[0] - g / 2) < 1e-5, `mode ${n} spans the gap`);
    assert.ok(Math.abs(first.a[1] - level) < 1e-5 && Math.abs(last.b[1] - level) < 1e-5, `mode ${n} vanishes at both plates`);
    let crossings = 0, peak = 0, lastSign = 0;
    for (let i = 0; i < MODE_SAMPLES; i += 1) {
      const s = pair(out, (n - 1) * MODE_SAMPLES + i);
      if (i > 0) assert.deepEqual(s.a, pair(out, (n - 1) * MODE_SAMPLES + i - 1).b, "segments chain");
      const d = s.b[1] - level;
      // a node can fall on a sample, where float32 leaves a residue: only values clear of it count towards a sign change
      if (Math.abs(d) > 1e-4 && i < MODE_SAMPLES - 1) {
        const sign = Math.sign(d);
        if (lastSign !== 0 && sign !== lastSign) crossings += 1;
        lastSign = sign;
      }
      peak = Math.max(peak, Math.abs(d));
    }
    assert.equal(crossings, n - 1, `mode ${n} has ${n - 1} interior nodes`);
    peaks.push(peak);
  }
  peaks.forEach((p, i) => assert.ok(Math.abs(p / peaks[0] - 1 / Math.sqrt(i + 1)) < 0.01, `mode ${i + 1} amplitude ${p / peaks[0]}`));
});

test("outside: the continuum starts on the outer faces of the plates and runs away from the gap, three lines per mode", () => {
  const g = drawnGap(1e-6), out = new Float32Array(outsideLength());
  outsideSegments(g, out);
  assert.equal(CONTINUUM_PER_MODE, 3);
  assert.equal(out.length, 2 * MODE_COUNT * CONTINUUM_PER_MODE * CONTINUUM_SAMPLES * 6);
  const pairsPerSide = out.length / 12;
  const left = pair(out, 0), right = pair(out, pairsPerSide);
  const outerFace = g / 2 + PLATE.thickness;
  assert.ok(Math.abs(left.a[0] + outerFace) < 1e-5, `left line starts at -${outerFace}: ${left.a[0]}`);
  assert.ok(Math.abs(right.a[0] - outerFace) < 1e-5, `right line starts at ${outerFace}: ${right.a[0]}`);
  assert.ok(pair(out, CONTINUUM_SAMPLES - 1).b[0] < left.a[0], "the left lines run to the left");
  assert.ok(pair(out, pairsPerSide + CONTINUUM_SAMPLES - 1).b[0] > right.a[0], "the right lines run to the right");
  assert.ok(out.every(Number.isFinite));
});

test("gapTex and pressureTex typeset the readouts in nm or um and in scientific notation", () => {
  assert.equal(gapTex(1e-8), "a = 10.0\\,\\mathrm{nm}");
  assert.equal(gapTex(3.5e-7), "a = 350\\,\\mathrm{nm}");
  assert.equal(gapTex(1e-6), "a = 1.00\\,\\mu\\mathrm{m}");
  assert.equal(gapTex(1e-5), "a = 10.0\\,\\mu\\mathrm{m}");
  assert.equal(pressureTex(-1.3001257724477536e-3), "P = -1.30\\times10^{-3}\\,\\mathrm{Pa}");
  assert.equal(pressureTex(-13.001257724477536), "P = -1.30\\times10^{1}\\,\\mathrm{Pa}");
});

test("the arrays depend only on the gap: the same gap gives the same bytes", () => {
  const a = insideSegments(drawnGap(2e-7), new Float32Array(insideLength()));
  const b = insideSegments(drawnGap(2e-7), new Float32Array(insideLength()));
  assert.deepEqual(a, b);
  assert.throws(() => insideSegments(drawnGap(2e-7), new Float32Array(10)), RangeError);
});
