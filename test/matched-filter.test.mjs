import test from "node:test";
import assert from "node:assert/strict";
import {
  tukeyWindow, buildBank, snrSeries, psdAt, templateSeries, searchBank,
  optimalSnr, colouredNoise,
} from "../js/science/matched-filter.mjs";
import { CMS_DIMUON, poissonErrors, binCentres, countsInWindow, CMS_RESONANCES } from "../js/science/data/cms-dimuon.mjs";

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} differs from ${b} by more than ${tol}`);

/** A smooth analytic PSD: flat above 30 Hz, rising steeply below it. */
function modelPsd(n, sampleRate) {
  const freqs = [], psd = [];
  for (let i = 0; i <= n / 2; i++) {
    const f = (i * sampleRate) / n;
    freqs.push(f);
    psd.push(1e-46 * (1 + (30 / Math.max(f, 1)) ** 4));
  }
  return { freqs: Float64Array.from(freqs), psd: Float64Array.from(psd) };
}

test("the Tukey window is flat in the middle and tapers to zero at both ends", () => {
  const w = tukeyWindow(100, 0.25);
  assert.equal(w.length, 100);
  near(w[0], 0, 1e-12);
  near(w[99], 0, 1e-12);
  for (let i = 30; i < 70; i++) near(w[i], 1, 1e-12);
  // Monotone up over the leading taper.
  for (let i = 1; i < 12; i++) assert.ok(w[i] >= w[i - 1] - 1e-15);
  assert.deepEqual(Array.from(tukeyWindow(1)), [1]);
});

test("the bank is spaced in chirp mass and each member is a valid TaylorT4 run", () => {
  const bank = buildBank({ count: 16, mcMin: 20, mcMax: 35, sampleRate: 128, duration: 8 });
  assert.equal(bank.templates.length, 16);
  near(bank.spacing, 1, 1e-12);
  for (let i = 0; i < 16; i++) {
    const t = bank.templates[i];
    near(t.mc, 20 + i, 1e-12);
    assert.ok(t.run.reachedIsco, `template ${i} evolves to the ISCO`);
    // Equal masses from the chirp mass: m = Mc * 2^{1/5}.
    near(t.massSolar, t.mc * 2 ** 0.2, 1e-12);
  }
  assert.throws(() => buildBank({ count: 1 }));
  assert.throws(() => buildBank({ mcMin: 40, mcMax: 40 }));
});

test("the matched filter recovers an injected chirp mass and its SNR", () => {
  const sampleRate = 128, n = 1024;
  const psd = modelPsd(n, sampleRate);
  const bank = buildBank({ count: 16, mcMin: 20, mcMax: 35, sampleRate, duration: 8 });
  const injected = bank.templates[7]; // Mc = 27
  const template = templateSeries(injected, { sampleRate, duration: n / sampleRate });
  const rhoOpt = optimalSnr({ timeSeries: template, sampleRate, psd });

  // Noise-free: the filter's own convention must put the peak at rho_opt, which is what makes the SNR physical.
  const clean = snrSeries({ strain: Float64Array.from(template), sampleRate, psd, template: { timeSeries: template }, bandLow: 20 });
  near(Math.max(...clean.snr.map(Math.abs)) / rhoOpt, 1, 0.05);

  // Injected at SNR 15 in seeded coloured noise.
  const noise = colouredNoise({ n, sampleRate, psd, seed: 7 });
  const strain = Float64Array.from(template.map((v, i) => v * (15 / rhoOpt) + noise[i]));
  const best = searchBank({ strain, sampleRate, bank, psd, bandLow: 20 });
  assert.equal(best.bestMc, injected.mc, "the bank index is recovered exactly");
  assert.ok(Math.abs(best.peakSnr / 15 - 1) < 0.1, `peak SNR ${best.peakSnr.toFixed(2)} is within 10 % of 15`);
});

test("the filter finds a quieter signal and not one that is not there", () => {
  const sampleRate = 128, n = 1024;
  const psd = modelPsd(n, sampleRate);
  const bank = buildBank({ count: 16, mcMin: 20, mcMax: 35, sampleRate, duration: 8 });
  const injected = bank.templates[11]; // Mc = 31
  const template = templateSeries(injected, { sampleRate, duration: n / sampleRate });
  const rhoOpt = optimalSnr({ timeSeries: template, sampleRate, psd });

  const noise = colouredNoise({ n, sampleRate, psd, seed: 3 });
  // Pure noise: the peak SNR must stay small, or the search is fitting the noise.
  const noiseOnly = searchBank({ strain: noise, sampleRate, bank, psd, bandLow: 20 });
  assert.ok(noiseOnly.peakSnr < 8, `noise alone peaks at ${noiseOnly.peakSnr.toFixed(1)}`);

  const strain = Float64Array.from(template.map((v, i) => v * (8 / rhoOpt) + noise[i]));
  const best = searchBank({ strain, sampleRate, bank, psd, bandLow: 20 });
  assert.equal(best.bestMc, injected.mc);
  assert.ok(best.peakSnr > noiseOnly.peakSnr * 1.5, "the injected signal beats the noise-only peak");
});

test("psdAt interpolates and the band policy rejects the low-frequency wall", () => {
  const psd = modelPsd(256, 128);
  // Linear interpolation halfway between two bins.
  const f0 = psd.freqs[10], f1 = psd.freqs[11];
  near(psdAt(psd, (f0 + f1) / 2), (psd.psd[10] + psd.psd[11]) / 2, 1e-12);
  // The model PSD is much larger below 30 Hz than above it.
  assert.ok(psdAt(psd, 10) > 10 * psdAt(psd, 60));
});

/* ---------- CMS open data ---------- */

test("the CMS dimuon histogram is real open data with a resolvable citation", async () => {
  const { hasReferenceIdentifier } = await import("../js/science/references.mjs");
  assert.match(CMS_DIMUON.doi, /^10\.7483\/OPENDATA\.CMS\./);
  assert.ok(hasReferenceIdentifier(`doi:${CMS_DIMUON.doi}`));
  assert.equal(CMS_DIMUON.experiment, "CMS");
  assert.equal(CMS_DIMUON.licence, "CC0");
  assert.match(CMS_DIMUON.retrieved, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(CMS_DIMUON.counts.length, CMS_DIMUON.binEdges.length - 1);
  assert.equal(CMS_DIMUON.counts.reduce((a, b) => a + b, 0), CMS_DIMUON.eventsRead, "every read event is binned");
  assert.ok(CMS_DIMUON.counts.every((c) => Number.isInteger(c) && c >= 0));
});

test("the spectrum shows the resonances it is supposed to show", () => {
  const jpsi = countsInWindow(2.95, 3.25);
  const psi2s = countsInWindow(3.55, 3.85);
  const upsilon1s = countsInWindow(9.3, 9.65);
  const upsilon23 = countsInWindow(9.9, 10.5);
  const z = countsInWindow(86, 96);
  // The physical ordering and magnitudes: the J/psi is the largest peak, the psi(2S) is a fraction of it, the
  // Upsilon family is present, and the Z is a handful of events at this early luminosity.
  assert.ok(jpsi > 500, `J/psi has ${jpsi} events`);
  assert.ok(psi2s > 100 && psi2s < jpsi, `psi(2S) has ${psi2s}, below the J/psi`);
  assert.ok(upsilon1s > 100, `Upsilon(1S) has ${upsilon1s}`);
  assert.ok(upsilon23 > 50, `Upsilon(2S+3S) has ${upsilon23}`);
  assert.ok(z > 5 && z < 100, `the Z region has ${z} events`);
  // And the spectrum rises above its own floor at each peak rather than being flat. The comparison must be per
  // unit mass: the J/psi window is 0.3 GeV wide and a continuum window of 5 GeV holds twenty times more bins, so
  // comparing the raw totals would flatter the continuum by that factor.
  const peakDensity = jpsi / 0.3;
  const continuumDensity = countsInWindow(20, 25) / 5;
  assert.ok(peakDensity > 5 * continuumDensity,
    `J/psi ${peakDensity.toFixed(1)}/GeV against ${continuumDensity.toFixed(1)}/GeV in the continuum`);
});

test("Poisson error bars and bin centres line up with the counts", () => {
  const errors = poissonErrors();
  assert.equal(errors.length, CMS_DIMUON.counts.length);
  for (let i = 0; i < errors.length; i++) near(errors[i], Math.sqrt(CMS_DIMUON.counts[i]), 1e-12);
  const centres = binCentres();
  assert.equal(centres.length, CMS_DIMUON.counts.length);
  near(centres[0], (CMS_DIMUON.binEdges[0] + CMS_DIMUON.binEdges[1]) / 2, 1e-12);
  assert.equal(CMS_RESONANCES.length, 6);
  for (const r of CMS_RESONANCES) assert.ok(r.massGeV > 0 && r.label);
});

/* ---------- Q-transform ---------- */

test("the Q-transform finds a pure tone and follows a chirp", async () => {
  const { qTransform, dominantTrack, tileWidth } = await import("../js/science/qtransform.mjs");
  const sampleRate = 128, n = 512;
  const tone = Float64Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * 40 * i) / sampleRate));
  const tf = qTransform(tone, { sampleRate, fMin: 20, bins: 24, hop: 8 });
  // The track of a steady tone is steady and sits on the tone's frequency.
  const middle = dominantTrack(tf).slice(10, 40).sort((a, b) => a - b);
  near(middle[Math.floor(middle.length / 2)], 40, 2);

  // A linear chirp from 20 to 55 Hz must make the track rise.
  const dur = n / sampleRate, rate = 35 / dur;
  const chirp = Float64Array.from({ length: n }, (_, i) => {
    const t = i / sampleRate;
    return Math.sin(2 * Math.PI * (20 * t + 0.5 * rate * t * t));
  });
  const tf2 = qTransform(chirp, { sampleRate, fMin: 20, bins: 24, hop: 8 });
  const track = dominantTrack(tf2);
  assert.ok(track[track.length - 6] > track[5] + 5, `chirp track rises ${track[5].toFixed(1)} -> ${track[track.length - 6].toFixed(1)}`);

  // Tiles are wider at low frequency, which is the defining property of constant Q.
  assert.ok(tileWidth(20, 8, sampleRate) > tileWidth(60, 8, sampleRate));
  // Energy is normalised, so a figure can map it to a palette without the absolute strain scale.
  assert.ok(tf.energy[0][0] >= 0 && tf.energy[0][0] <= 1);
  assert.throws(() => qTransform([], {}));
  // fMax above Nyquist is clipped rather than rejected — the transform cannot show what the sample rate cannot
  // carry — so the error case is a range that is empty after clipping.
  assert.throws(() => qTransform(tone, { sampleRate, fMin: 100, bins: 24 }));
});
