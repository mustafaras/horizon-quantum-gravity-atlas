import test from "node:test";
import assert from "node:assert/strict";
import {
  schwarzschildRadius, kerrGeometry, hawkingTemperature,
  blackHoleEntropyAreaUnits, seededRng, qftConservation,
  chirpMass, timeToCoalescence, inspiralFrequency, generatedChirp, stftSpectrogram,
} from "../js/physics.mjs";

test("Schwarzschild radius is about 2.95 km per solar mass", () => {
  assert.ok(Math.abs(schwarzschildRadius(1) / 1000 - 2.953) < 0.01);
  assert.ok(Math.abs(schwarzschildRadius(10) / schwarzschildRadius(1) - 10) < 1e-12);
});

test("Kerr zero-spin limits recover Schwarzschild geometry", () => {
  const geometry = kerrGeometry(0);
  assert.equal(geometry.rPlus, 2);
  assert.equal(geometry.rIsco, 6);
  assert.equal(geometry.rIscoRetrograde, 6);
  assert.equal(geometry.rPhoton, 3);
  assert.ok(Math.abs(geometry.rPhotonRetrograde - 3) < 1e-12);
  assert.equal(geometry.rErgoEquator, 2);
  assert.equal(geometry.temperatureFactor, 1);
});

test("Kerr spin separates prograde and retrograde characteristic radii", () => {
  const geometry = kerrGeometry(0.9);
  assert.ok(geometry.rPlus < geometry.rErgoEquator);
  assert.ok(geometry.rPhoton < geometry.rPhotonRetrograde);
  assert.ok(geometry.rIsco < geometry.rIscoRetrograde);
});

test("black-hole temperature scales inversely with mass and entropy with area", () => {
  assert.ok(Math.abs(hawkingTemperature(1) / hawkingTemperature(10) - 10) < 1e-12);
  assert.ok(Math.abs(blackHoleEntropyAreaUnits(10) / blackHoleEntropyAreaUnits(1) - 100) < 1e-12);
});

test("seeded RNG is reproducible", () => {
  const a = seededRng(42), b = seededRng(42);
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
});

test("QFT conservation checks cover valid and invalid vertices", () => {
  assert.equal(qftConservation("e-", "e+", "mu-", "mu+").ok, true);
  assert.equal(qftConservation("e-", "e-", "ph", "ph").ok, false);
  assert.equal(qftConservation("e-", "mu+", "e-", "e+").ok, false);
});

test("chirp mass matches documented binary values", () => {
  // Canonical 1.4+1.4 M☉ neutron-star binary → ℳ ≈ 1.219 M☉
  assert.ok(Math.abs(chirpMass(1.4, 1.4) - 1.2188) < 1e-3);
  // GW150914-like 36+29 M☉ → ℳ ≈ 28.1 M☉ (leading-order formula)
  assert.ok(Math.abs(chirpMass(36, 29) - 28.07) < 0.05);
  assert.ok(Math.abs(chirpMass(2, 8) - chirpMass(8, 2)) < 1e-12); // symmetric
});

test("leading-order coalescence time and frequency are consistent", () => {
  const mc = chirpMass(36, 29);
  const t20 = timeToCoalescence(20, mc);
  assert.ok(t20 > 0.6 && t20 < 1.1, `t_c(20 Hz) = ${t20}s should be ~0.85 s`);
  // Round-trip: the frequency at tau = t_c(f) must return f
  assert.ok(Math.abs(inspiralFrequency(t20, mc) / 20 - 1) < 1e-9);
  // Chirp: frequency rises as tau shrinks; coalescence time falls as f rises
  assert.ok(inspiralFrequency(0.1, mc) > inspiralFrequency(1, mc));
  assert.ok(timeToCoalescence(100, mc) < timeToCoalescence(20, mc));
});

test("generated chirp is seed-reproducible and bounded", () => {
  const a = generatedChirp({ seed: 7 }), b = generatedChirp({ seed: 7 }), c = generatedChirp({ seed: 8 });
  assert.deepEqual(Array.from(a.samples.slice(0, 64)), Array.from(b.samples.slice(0, 64)));
  assert.notDeepEqual(Array.from(a.samples.slice(0, 64)), Array.from(c.samples.slice(0, 64)));
  assert.equal(a.samples.length, Math.round(a.sampleRate * a.duration));
  assert.ok(a.mergerIndex > 0 && a.mergerIndex < a.samples.length);
  assert.ok(Math.max(...a.samples.map(Math.abs)) < 6); // signal ≤1 + bounded noise
  // 7 ms H1→L1 delay shifts the merger by the expected sample count
  const delayed = generatedChirp({ seed: 7, delaySeconds: 0.007 });
  assert.equal(delayed.mergerIndex - a.mergerIndex, Math.round(0.007 * a.sampleRate));
});

test("chirp frequency track rises through the inspiral and locks to the ringdown", () => {
  const { freqTrack, mergerIndex, sampleRate } = generatedChirp({ seed: 7, m1: 36, m2: 29 });
  assert.equal(freqTrack.length, Math.round(sampleRate * 4));
  // monotonic non-decreasing across the inspiral (up to the merger sample)
  for (let i = 1; i < mergerIndex; i++) {
    if (freqTrack[i - 1] === 0) continue; // pre-signal delay region
    assert.ok(freqTrack[i] >= freqTrack[i - 1], "frequency must not decrease during inspiral");
  }
  assert.ok(freqTrack[0] > 10 && freqTrack[0] < 60); // starts in the LIGO band
  assert.ok(freqTrack[mergerIndex - 1] > freqTrack[0]); // chirps upward
  assert.equal(freqTrack[mergerIndex], 190); // damped-sinusoid ringdown frequency
  // component masses reshape the track: heavier binary chirps lower at fixed tau
  const heavy = generatedChirp({ seed: 7, m1: 80, m2: 60 });
  assert.ok(heavy.freqTrack[Math.round(sampleRate)] < freqTrack[Math.round(sampleRate)]);
});

test("STFT spectrogram localizes a pure tone in the correct bin", () => {
  const sampleRate = 512, windowSize = 128, hopSize = 32, n = 1024;
  const toneFreq = 96; // exact bin: 96 = b·512/128 → b = 24
  const samples = Float64Array.from({ length: n }, (_, i) => Math.cos(2 * Math.PI * toneFreq * (i / sampleRate)));
  const spec = stftSpectrogram(samples, { sampleRate, windowSize, hopSize });
  assert.equal(spec.bins, windowSize / 2);
  assert.equal(spec.frames, Math.floor((n - windowSize) / hopSize) + 1);
  assert.equal(spec.nyquist, sampleRate / 2);
  const frame = 5, row = spec.magnitudes.slice(frame * spec.bins, (frame + 1) * spec.bins);
  let peakBin = 0;
  for (let b = 1; b < spec.bins; b++) if (row[b] > row[peakBin]) peakBin = b;
  assert.equal(peakBin, 24);
  assert.ok(Math.abs(spec.freqs[peakBin] - toneFreq) < 1e-9);
});
