import test from "node:test";
import assert from "node:assert/strict";
import {
  GW_REAL_MODE,
  GW_SYNTHETIC_MODE,
  GW_BAND_DEFAULTS,
  DETECTOR_ORIENTATIONS,
  nextPowerOfTwo,
  fftRadix2,
  removeMean,
  detrendLinear,
  hannWindow,
  applyWindow,
  designBandpassSections,
  bandpass,
  estimatePsd,
  smoothSpectrum,
  whiten,
  resampleLinear,
  decimateUniform,
  translateFrequency,
  audibilizeShift,
  peakAbs,
  normalizePeak,
  sampleAtTime,
  syntheticProvenance,
  assertSyntheticProvenance,
  assertRealProvenance,
  synthesizePolarizations,
  antennaPatterns,
  detectorResponse,
  buildRealBundle,
  buildGeneratedBundle,
  processSignal,
} from "../js/science/gravitational-waves.mjs";

const makeSine = ({ frequency, sampleRate, seconds = 1, amplitude = 1, phase = 0 }) => {
  const n = Math.round(sampleRate * seconds);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = amplitude * Math.cos(2 * Math.PI * frequency * (i / sampleRate) + phase);
  return out;
};

/** Dominant frequency via a plain DFT scan (reference, not the module FFT). */
const dominantFrequency = (samples, sampleRate, fMax = sampleRate / 2) => {
  const n = samples.length;
  let best = 0, bestMag = -Infinity;
  const hann = new Float64Array(n);
  for (let k = 0; k < n; k++) hann[k] = 0.5 * (1 - Math.cos((2 * Math.PI * k) / n));
  for (let f = 1; f <= fMax; f += Math.max(0.5, sampleRate / 4096)) {
    let re = 0, im = 0;
    const w = (2 * Math.PI * f) / sampleRate;
    for (let k = 0; k < n; k++) {
      re += samples[k] * hann[k] * Math.cos(w * k);
      im -= samples[k] * hann[k] * Math.sin(w * k);
    }
    const mag = Math.hypot(re, im);
    if (mag > bestMag) { bestMag = mag; best = f; }
  }
  return best;
};

test("fftRadix2 matches a naive DFT and round-trips", () => {
  const N = 64;
  const re = new Float64Array(N);
  const src = new Float64Array(N);
  for (let i = 0; i < N; i++) { re[i] = Math.sin(2 * Math.PI * 3 * i / N) + 0.5 * Math.cos(2 * Math.PI * 9 * i / N); src[i] = re[i]; }
  const im = new Float64Array(N);
  fftRadix2(re, im);
  // Naive DFT at a handful of bins.
  for (const k of [0, 1, 3, 9, 31]) {
    let re0 = 0, im0 = 0;
    for (let n = 0; n < N; n++) {
      const w = (-2 * Math.PI * k * n) / N;
      re0 += src[n] * Math.cos(w);
      im0 += src[n] * Math.sin(w);
    }
    assert.ok(Math.abs(re0 - re[k]) < 1e-8, `real bin ${k}`);
    assert.ok(Math.abs(im0 - im[k]) < 1e-8, `imag bin ${k}`);
  }
  fftRadix2(re, im, true);
  for (let i = 0; i < N; i++) assert.ok(Math.abs(re[i] / N - src[i]) < 1e-9, `round-trip ${i}`);
});

test("fft rejects non-power-of-two lengths", () => {
  assert.throws(() => fftRadix2(new Float64Array(3), new Float64Array(3)), /power of two/);
});

test("removeMean and detrendLinear never mutate the input", () => {
  const src = new Float64Array([1, 2, 3, 4, 5]);
  const frozen = Float64Array.from(src);
  const r = removeMean(src);
  assert.equal(src[0], frozen[0]);
  assert.ok(Math.abs(Array.from(r.samples).reduce((a, b) => a + b, 0)) < 1e-12);
  const trended = new Float64Array(32);
  for (let i = 0; i < 32; i++) trended[i] = 0.25 + 0.5 * i + ((i % 3) - 1) * 0.01;
  const trendedCopy = Float64Array.from(trended);
  const d = detrendLinear(trended);
  assert.ok(Math.abs(d.slope - 0.5) < 0.01);
  assert.ok(Number.isFinite(d.samples[0]));
  assert.deepEqual(Array.from(trended), Array.from(trendedCopy), "detrend must not mutate");
});

test("hannWindow endpoints are zero and mid is one", () => {
  const w = hannWindow(64);
  assert.equal(w[0], 0);
  assert.ok(w[63] < 0.01);
  assert.ok(Math.abs(w[32] - 1) < 1e-6);
  const s = removeMean(applyWindow(makeSine({ frequency: 8, sampleRate: 64 }), w));
  assert.equal(s.samples.length, 64);
});

test("bandpass keeps in-band energy and rejects out-of-band tones", () => {
  const fs = 2048;
  const inBand = makeSine({ frequency: 60, sampleRate: fs, seconds: 2 });
  const lowJunk = makeSine({ frequency: 2, sampleRate: fs, seconds: 2 });
  const highJunk = makeSine({ frequency: 900, sampleRate: fs, seconds: 2 });
  const mixed = new Float64Array(inBand.length);
  for (let i = 0; i < mixed.length; i++) mixed[i] = inBand[i] + lowJunk[i] + highJunk[i];
  const filtered = bandpass(mixed, { sampleRate: fs, fLow: 20, fHigh: 300, order: 4 });
  // In-band sine dominates after filtering.
  const before = peakAbs(inBand) / peakAbs(mixed);
  const after = peakAbs(inBand) / peakAbs(filtered.samples);
  assert.ok(after > before * 1.5, `bandpass should raise in-band share: ${before} -> ${after}`);
  // And a pure out-of-band tone collapses.
  const junkOut = bandpass(highJunk, { sampleRate: fs, fLow: 20, fHigh: 300, order: 4 });
  assert.ok(peakAbs(junkOut.samples) < 0.05 * peakAbs(highJunk));
  assert.equal(filtered.policy.filter, "zero-phase-butterworth-biquad-cascade");
  // Design rejects impossible bands.
  assert.throws(() => designBandpassSections({ sampleRate: 100, fLow: 20, fHigh: 80 }), /Nyquist/);
});

test("PSD estimate finds the injected tone; smoothing keeps it finite", () => {
  const fs = 512;
  const samples = makeSine({ frequency: 80, sampleRate: fs, seconds: 4 });
  const psd = estimatePsd(samples, { sampleRate: fs, segmentSize: 256 });
  let maxBin = 0;
  for (let b = 1; b < psd.psd.length; b++) if (psd.psd[b] > psd.psd[maxBin]) maxBin = b;
  assert.ok(Math.abs(psd.freqs[maxBin] - 80) < 2.5, `peak at ${psd.freqs[maxBin]}`);
  const smoothed = smoothSpectrum(psd.psd, 4);
  assert.equal(smoothed.length, psd.psd.length);
  assert.ok(smoothed.every(Number.isFinite));
});

test("whiten flattens a colored spectrum without mutating input", () => {
  const fs = 512;
  const lowHeavy = new Float64Array(2048);
  let acc = 0;
  const seedv = (i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
  for (let i = 0; i < lowHeavy.length; i++) {
    acc = acc * 0.98 + (seedv(i) - 0.5);
    lowHeavy[i] = acc;
  }
  const before = estimatePsd(lowHeavy, { sampleRate: fs, segmentSize: 256 });
  const w = whiten(lowHeavy, { sampleRate: fs, segmentSize: 256 });
  const after = estimatePsd(w.samples, { sampleRate: fs, segmentSize: 256 });
  const ratio = (psd, lo, hi) => {
    const band = psd.psd.slice(Math.round(lo / (fs / 2) * (psd.psd.length / 2)), Math.round(hi / (fs / 2) * (psd.psd.length / 2)));
    return Math.max(...band) / (Math.min(...band.filter((v) => v > 0)) || 1e-12);
  };
  const flatBefore = ratio(before, 40, 200);
  const flatAfter = ratio(after, 40, 200);
  assert.ok(flatAfter < flatBefore, `whitening should flatten: ${flatBefore} -> ${flatAfter}`);
  assert.equal(w.policy.filter, "running-psd-whitening");
  assert.ok(Number.isFinite(peakAbs(w.samples)));
});

test("resampleLinear preserves a slow tone and length ratio", () => {
  const fs = 512;
  const tone = makeSine({ frequency: 10, sampleRate: fs, seconds: 2 }); // 1024 samples
  const up = resampleLinear(tone, fs, 1024);
  assert.equal(up.length, 2048);
  const f = dominantFrequency(Array.from(up.slice(256, 1280)), 1024, 60);
  assert.ok(Math.abs(f - 10) < 1.5, `got ${f}`);
  const same = resampleLinear(tone, fs, fs);
  assert.deepEqual(Array.from(same), Array.from(tone));
});

test("decimateUniform respects the max bound and reports the stride", () => {
  const src = new Float64Array(1001).map((_, i) => i);
  const d = decimateUniform(src, 1200);
  assert.equal(d.stride, 1);
  const d2 = decimateUniform(src, 100);
  assert.equal(d2.stride, 11);
  assert.ok(d2.samples.length <= 100);
});

test("translateFrequency scales frequency by the factor (turntable semantics)", () => {
  const fs = 512;
  const tone = makeSine({ frequency: 40, sampleRate: fs, seconds: 4 }); // 2048 samples
  const shifted = translateFrequency(tone, fs, 4);
  assert.equal(shifted.factor, 4);
  assert.equal(shifted.samples.length, 512); // duration compressed 1/f
  const f = dominantFrequency(Array.from(shifted.samples.slice(32, shifted.samples.length - 32)), fs, fs / 2 - 1);
  assert.ok(Math.abs(f - 160) < 8, `expected ~160 Hz, got ${f}`);
});

test("audibilizeShift maps a band centre onto the target", () => {
  const s = audibilizeShift({ bandCenterHz: 150 });
  assert.ok(Math.abs(s - 440 / 150) < 1e-9);
  assert.throws(() => audibilizeShift({ bandCenterHz: 0 }), /positive/);
});

test("normalizePeak is display-only: raw values survive untouched", () => {
  const raw = new Float64Array([0.5e-21, -1e-21, 0]);
  const display = normalizePeak(raw, 1);
  assert.equal(display[1], -1); // peak element normalized
  assert.equal(display[0], 0.5);
  assert.equal(raw[0], 0.5e-21);
  assert.equal(peakAbs(display), 1);
});

test("sampleAtTime interpolates linearly and clamps", () => {
  const s = new Float64Array([0, 1, 2, 3]);
  assert.equal(sampleAtTime(s, 1, 1.5), 1.5);
  assert.equal(sampleAtTime(s, 1, -5), 0);
  assert.equal(sampleAtTime(s, 1, 99), 3);
});

test("synthetic provenance is frozen, labeled, and enforced", () => {
  const p = syntheticProvenance({ seed: 42 });
  assert.equal(p.mode, GW_SYNTHETIC_MODE);
  assert.equal(p.deterministic, true);
  assert.throws(() => { p.mode = "changed"; }, TypeError);
  assert.doesNotThrow(() => assertSyntheticProvenance(p, "x"));
  assert.throws(() => assertSyntheticProvenance({ mode: GW_REAL_MODE }, "x"), /never reuse/);
  assert.throws(() => assertRealProvenance(p, "x"), /real-strain/);
});

test("synthesizePolarizations is seed-deterministic and polarization-structured", () => {
  const a = synthesizePolarizations({ seed: 7, sampleRate: 512, duration: 2, mergerAt: 1.5 });
  const b = synthesizePolarizations({ seed: 7, sampleRate: 512, duration: 2, mergerAt: 1.5 });
  assert.deepEqual(Array.from(a.plus), Array.from(b.plus));
  assert.deepEqual(Array.from(a.cross), Array.from(b.cross));
  const c = synthesizePolarizations({ seed: 8, sampleRate: 512, duration: 2, mergerAt: 1.5 });
  assert.notDeepEqual(Array.from(a.plus), Array.from(c.plus));
  // Edge-on (iota = pi/2): the cross pattern factor cos(iota) vanishes exactly.
  const edgeOn = synthesizePolarizations({ seed: 3, sampleRate: 512, duration: 1, mergerAt: 0.5, inclinationRad: Math.PI / 2, noiseRms: 0 });
  assert.ok(peakAbs(edgeOn.cross) < 1e-12, "cross must vanish exactly edge-on with no noise");
  assert.ok(peakAbs(edgeOn.plus) > 0.3, "plus must remain edge-on");
  // Face-on with no noise: circular polarization — both components comparable.
  const faceOn = synthesizePolarizations({ seed: 3, sampleRate: 512, duration: 1, mergerAt: 0.5, inclinationRad: 0, noiseRms: 0 });
  assert.ok(peakAbs(faceOn.cross) > 0.5 * peakAbs(faceOn.plus), "face-on is near-circular");
  // Frequency track rises through inspiral.
  assert.ok(a.freqTrack[10] < a.freqTrack[Math.floor(1.4 * 512)]);
  assert.equal(a.provenance.mode, GW_SYNTHETIC_MODE);
});

test("antennaPatterns obey the pattern function identity F+^2 + Fx^2 <= 2", () => {
  const p = antennaPatterns(DETECTOR_ORIENTATIONS.H1);
  assert.ok(p.plus ** 2 + p.cross ** 2 <= 2.001);
  const faceOn = antennaPatterns({ theta: 0, phi: 0, psi: 0 });
  assert.ok(Math.abs(faceOn.plus - 1) < 1e-12);
  assert.equal(faceOn.cross, 0);
});

test("detectorResponse mixes polarizations with the pattern and delay", () => {
  const plus = new Float64Array([1, 2, 3, 4]);
  const cross = new Float64Array([10, 20, 30, 40]);
  const h = detectorResponse({ plus, cross, pattern: { plus: 1, cross: 1 }, delaySamples: 2 });
  assert.equal(h[0], 0);
  assert.equal(h[1], 0);
  assert.equal(h[2], 11);
  assert.equal(h[3], 22);
});

test("bundles keep raw and display separate and enforce provenance", () => {
  const samples = new Float64Array([2e-21, -1e-21, 0, 1e-21]);
  const real = buildRealBundle({
    samples, sampleRate: 150, start: 1126259446, duration: 16 / 1,
    provenance: { mode: GW_REAL_MODE, source: "GWOSC API v2" },
  });
  assert.equal(real.kind, "real");
  assert.equal(real.raw[0], 2e-21);
  assert.equal(real.display[0], 1);
  assert.ok(Object.isFrozen(real) && Object.isFrozen(real.provenance));
  assert.throws(() => buildRealBundle({ samples, sampleRate: 150, duration: 4, provenance: syntheticProvenance({ seed: 1 }) }), /real-strain/);
  assert.throws(() => buildGeneratedBundle({
    samples, sampleRate: 150, duration: 4, provenance: { mode: GW_REAL_MODE },
  }), /never reuse real-data provenance/);
});

test("processSignal reports its chain and leaves raw untouched", () => {
  const fs = 1024;
  const chirp = synthesizePolarizations({ seed: 11, sampleRate: fs, duration: 2, mergerAt: 1.5, noiseRms: 0.1 });
  const raw = chirp.plus;
  const rawCopy = Float64Array.from(raw);
  const out = processSignal(raw, fs, {
    bandpassPolicy: { fLow: 30, fHigh: 300, order: 4 },
    whitenPolicy: { segmentSize: 128, smoothingBins: 6 },
    maxSamples: 512,
  });
  assert.deepEqual(Array.from(raw), Array.from(rawCopy));
  assert.ok(out.chain.length >= 4);
  assert.ok(out.samples.length <= 512);
  assert.equal(out.display.length, out.samples.length);
  assert.equal(peakAbs(out.display), 1);
  assert.ok(out.durationSeconds > 0);
});

test("defaults match the documented policy", () => {
  assert.equal(GW_BAND_DEFAULTS.fLow, 20);
  assert.equal(DETECTOR_ORIENTATIONS.H1.label, "Hanford");
  assert.ok(Object.isFrozen(DETECTOR_ORIENTATIONS));
});
