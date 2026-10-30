/**
 * Matched filtering (S27).
 *
 * The statistic a gravitational-wave search actually computes is the signal-to-noise ratio of the data against a
 * template, weighted by the noise power:
 *
 *     ρ(t) = 4 Re ∫ s̃(f) h̃*(f) e^{2πift} / S_n(f) df / σ_h,     σ_h² = 4 ∫ |h̃(f)|² / S_n(f) df
 *
 * The division by S_n(f) is what makes this a *matched* filter rather than a correlation: frequency bins where the
 * detector is noisy are trusted less. Doing it in the frequency domain turns the whole time series of ρ into one
 * inverse FFT for the entire template bank member, which is why searches work this way.
 *
 * This is a **simplified** search. It has no χ² veto, no coincidence between detectors, and no background estimate,
 * so its peak SNR is not the LVK detection statistic and must not be read as one. The caption says so.
 */

import { estimatePsd, fftRadix2, hannWindow, nextPowerOfTwo } from "./gravitational-waves.mjs";
import { REF } from "./references.mjs";
import { evolveInspiral, chirpMassSeconds, chirpMassSolar } from "./pn-waveform.mjs";

export const MATCHED_FILTER_PROVENANCE = Object.freeze({
  id: "gw-matched-filter",
  model:
    "Frequency-domain matched filter against a TaylorT4 template bank, with a Welch PSD from the same data and a Tukey-windowed band policy",
  status: "effective",
  assumptions: Object.freeze([
    "The noise is stationary and Gaussian over the analysed segment; a real search tracks its non-stationarity",
    "The templates are non-spinning TaylorT4 waveforms, so a spinning signal loses SNR against them",
    "No chi-squared veto, no multi-detector coincidence and no false-alarm-rate estimate: this is a single-detector detection statistic, not a detection",
  ]),
  validity: Object.freeze([
    "The recovered parameters are limited by the bank spacing, which is stated with every result",
    "On the bundled fixture the data is synthetic, so a recovery there demonstrates the method and not an observation",
  ]),
  numericalMethod:
    "Welch PSD from the segment itself, frequency-domain inner product per template, one inverse FFT for the SNR time series",
  references: Object.freeze([REF.ALLEN_2005_MATCHED_FILTER]),
  layers: Object.freeze([
    { name: "SNR time series and the recovered template", class: "model" },
    { name: "The PSD and the band mask", class: "data" },
  ]),
  seed: "explicit seed for the noise in the injection tests; the filter itself is deterministic",
});

/** A Tukey window: flat in the middle, cosine-tapered at both ends. */
export function tukeyWindow(n, alpha = 0.25) {
  const w = new Float64Array(n);
  if (n <= 1) { w[0] = 1; return w; }
  const edge = Math.max(1, Math.floor((alpha * (n - 1)) / 2));
  for (let i = 0; i < n; i++) {
    if (i < edge) w[i] = 0.5 * (1 - Math.cos((Math.PI * i) / edge));
    else if (i >= n - edge) w[i] = 0.5 * (1 - Math.cos((Math.PI * (n - 1 - i)) / edge));
    else w[i] = 1;
  }
  return w;
}

/**
 * The template bank: equal-mass TaylorT4 waveforms spaced in chirp mass.
 *
 * The plan asks for 64 templates over the detector-frame chirp mass range [10, 40] solar masses. Equal spacing in
 * chirp mass is used rather than a metric-based placement, so the parameter resolution is exactly the step, which
 * is what the recovery test asserts against.
 */
export function buildBank({ count = 64, mcMin = 10, mcMax = 40, fStartHz = 30, sampleRate = 128, duration = 8 } = {}) {
  if (!Number.isInteger(count) || count < 2) throw new RangeError("count must be an integer of at least 2");
  if (!(mcMax > mcMin)) throw new RangeError("mcMax must exceed mcMin");
  const templates = [];
  for (let i = 0; i < count; i++) {
    const mc = mcMin + ((mcMax - mcMin) * i) / (count - 1);
    // Equal masses from a chirp mass: Mc = m/2^{1/5} for m1 = m2.
    const m = mc * 2 ** 0.2;
    const run = evolveInspiral({ m1: m, m2: m, fStartHz, dt: 1 / sampleRate, maxTime: duration });
    templates.push({ index: i, mc, massSolar: m, run });
  }
  return { templates, count, mcMin, mcMax, spacing: (mcMax - mcMin) / (count - 1) };
}

/** The SNR time series of one template against the data, in the frequency domain. */
export function snrSeries({ strain, sampleRate, psd, template, bandLow = 20, bandHigh = null }) {
  const n = nextPowerOfTwo(strain.length);
  const re = new Float64Array(n), im = new Float64Array(n);
  // The data, Tukey-windowed so the segment edges do not leak into the band.
  const win = tukeyWindow(strain.length, 0.25);
  for (let i = 0; i < strain.length; i++) re[i] = strain[i] * win[i];
  fftRadix2(re, im);
  const dt = 1 / sampleRate;
  const freqs = Array.from({ length: n }, (_, k) => (k <= n / 2 ? k : k - n) / (n * dt));

  // The template in the frequency domain, by direct FFT of its time series resampled onto the same grid.
  const tr = new Float64Array(n), ti = new Float64Array(n);
  const h = template.timeSeries;
  for (let i = 0; i < n && i < h.length; i++) tr[i] = h[i];
  fftRadix2(tr, ti);

  const high = bandHigh ?? sampleRate / 2;
  const df = 1 / (n * dt);
  const sre = new Float64Array(n), sim = new Float64Array(n);
  let sigma2 = 0;
  // The same discrete convention as optimalSnr: continuous transform = FFT·dt, integral = sum·df, one-sided.
  for (let k = 0; k <= n / 2; k++) {
    const f = k * df;
    if (f < bandLow || f > high) continue;
    const s = psdAt(psd, f);
    if (!(s > 0)) continue;
    const weight = (4 * dt * dt * df) / s;
    sre[k] = weight * (re[k] * tr[k] + im[k] * ti[k]);
    sim[k] = weight * (im[k] * tr[k] - re[k] * ti[k]);
    sigma2 += weight * (tr[k] * tr[k] + ti[k] * ti[k]);
  }
  // fftRadix2's inverse already carries the n that an unnormalised forward-plus-inverse pair needs, so the
  // time-domain correlation comes out scaled correctly and needs no further division. (Dividing by n here made
  // every SNR smaller by exactly that factor, which is how the error was found.)
  fftRadix2(sre, sim, true);
  const sigma = Math.sqrt(Math.max(sigma2, 1e-300));
  const snr = new Float64Array(n);
  for (let i = 0; i < n; i++) snr[i] = sre[i] / sigma;
  return { snr, sigma, freqs };
}

/** Linear interpolation of the PSD onto an arbitrary frequency. */
export function psdAt(psd, f) {
  const { freqs, psd: values } = psd;
  if (freqs.length < 2) return values[0] ?? 0;
  const df = freqs[1] - freqs[0];
  const x = f / df;
  const i = Math.max(0, Math.min(freqs.length - 2, Math.floor(x)));
  const t = x - i;
  return values[i] * (1 - t) + values[i + 1] * t;
}

/**
 * The template's time series, sampled on the analysis grid.
 *
 * The inspiral ends at the ISCO; past that the amplitude is zero, because a real search's template also stops where
 * the post-Newtonian model stops being valid.
 */
export function templateSeries(template, { sampleRate = 128, duration = 8, peakAt = 1.0 } = {}) {
  const n = Math.round(sampleRate * duration);
  const out = new Float64Array(n);
  const run = template.run;
  const tPeakIndex = Math.round(peakAt * sampleRate);
  const offset = tPeakIndex - Math.round((run.times.length / sampleRate) * sampleRate);
  for (let i = 0; i < run.times.length; i++) {
    const idx = offset + i;
    if (idx >= 0 && idx < n) {
      // A leading-order amplitude with the PN phase, normalised so the bank members are comparable.
      out[idx] = run.frequency[i] ** (2 / 3) * Math.cos(2 * run.phase[i]);
    }
  }
  return out;
}

/**
 * Search the bank: the template with the highest peak SNR, and where that peak sits.
 *
 * Returns the peak SNR, the peak time, the recovered chirp mass and the full SNR series of the best template.
 */
export function searchBank({ strain, sampleRate, bank, psd = null, bandLow = 20, bandHigh = null } = {}) {
  if (!bank?.templates?.length) throw new RangeError("searchBank needs a template bank");
  const spectrum = psd ?? estimatePsd(strain, { sampleRate });
  let best = { peakSnr: -Infinity, tPeak: 0, bestMc: 0, bestIndex: -1, snrSeries: null, sigma: 0 };
  for (const template of bank.templates) {
    const series = templateSeries(template, { sampleRate, duration: strain.length / sampleRate });
    const { snr, sigma } = snrSeries({ strain, sampleRate, psd: spectrum, template: { ...template, timeSeries: series }, bandLow, bandHigh });
    let peak = -Infinity, at = 0;
    for (let i = 0; i < snr.length; i++) if (snr[i] > peak) { peak = snr[i]; at = i; }
    if (peak > best.peakSnr) {
      best = { peakSnr: peak, tPeak: at / sampleRate, bestMc: template.mc, bestIndex: template.index, snrSeries: snr, sigma };
    }
  }
  return best;
}

/**
 * The optimal SNR of a known injection, computed analytically:
 *   ρ_opt² = 4 ∫ |h̃(f)|² / S_n(f) df
 * This is what the recovered peak is compared against, and the ratio is what the 10 % test asserts.
 */
export function optimalSnr({ timeSeries, sampleRate, psd, bandLow = 20, bandHigh = null }) {
  const n = nextPowerOfTwo(timeSeries.length);
  const re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < timeSeries.length; i++) re[i] = timeSeries[i];
  fftRadix2(re, im);
  const dt = 1 / sampleRate;
  const df = 1 / (n * dt); // the frequency spacing of the discrete transform
  const high = bandHigh ?? sampleRate / 2;
  let total = 0;
  // One-sided sum. The PSD from estimatePsd is one-sided (bins 0..n/2), so summing the negative-frequency bins as
  // well would double-count the same physical power and inflate the result by sqrt(2).
  for (let k = 0; k <= n / 2; k++) {
    const f = k * df;
    if (f < bandLow || f > high) continue;
    const s = psdAt(psd, f);
    if (!(s > 0)) continue;
    // The continuous transform is FFT·dt, and the integral over df carries one more factor: 4·|h̃|²/S_n·df.
    total += (4 * (re[k] * re[k] + im[k] * im[k]) * dt * dt * df) / s;
  }
  return Math.sqrt(total);
}

/** Seeded Gaussian noise coloured by a target PSD, by filtering white noise in the frequency domain. */
export function colouredNoise({ n, sampleRate, psd, seed = 42, rng = null }) {
  let state = (Number(seed) >>> 0) || 1;
  const next = rng ?? (() => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; });
  const gauss = () => {
    const u = Math.max(1e-12, next()), v = next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const size = nextPowerOfTwo(n);
  const re = new Float64Array(size), im = new Float64Array(size);
  const dt = 1 / sampleRate;
  for (let k = 0; k < size; k++) {
    const f = (k <= size / 2 ? k : k - size) / (size * dt);
    const amplitude = Math.sqrt(Math.max(0, psdAt(psd, Math.abs(f))) * sampleRate * size) / Math.SQRT2;
    re[k] = gauss() * amplitude;
    im[k] = gauss() * amplitude;
  }
  fftRadix2(re, im, true);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = re[i] / size;
  return out;
}

void chirpMassSeconds; void chirpMassSolar; void hannWindow;
