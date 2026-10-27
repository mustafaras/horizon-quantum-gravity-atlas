/**
 * Gravitational-wave signal science (Prompt 06) — pure, DOM-free, deterministic.
 *
 * Every function here is testable in Node with no canvas, React, Three.js or
 * Web Audio. The raw strain always stays separate from display-normalized or
 * processed copies: nothing in this module mutates its inputs, and processed
 * bundles carry both so provenance can never be confused by construction.
 *
 * Processing policy (named, composable, each documented below):
 *   removeMean → detrendLinear → bandpass (zero-phase Butterworth biquad
 *   cascade) → whiten (FFT running-PSD division) → resampleLinear →
 *   decimateUniform → translateFrequency.
 *
 * Provenance discipline:
 *   - Real detector data carries mode "real-strain" (GWOSC fetch provenance).
 *   - Generated fallback signals carry mode "synthetic-generated" and are
 *     asserted with assertSyntheticProvenance(); the module refuses to stamp
 *     a generated signal with real provenance and vice versa.
 */

import { chirpMass, inspiralFrequency } from "../physics.mjs";

export const GW_REAL_MODE = "real-strain";
export const GW_SYNTHETIC_MODE = "synthetic-generated";

export const GW_BAND_DEFAULTS = Object.freeze({ fLow: 20, fHigh: 1024, order: 4 });
export const GW_WHITEN_DEFAULTS = Object.freeze({ segmentSize: 256, smoothingBins: 8 });
export const GW_AUDIBLE_TARGET_HZ = 440;

/**
 * Illustrative detector-frame orientations used by the teaching instrument.
 * The true antenna pattern depends on the source sky position and polarisation
 * angle; these fixed (theta, phi, psi) triples are pedagogical presets, NOT
 * measured detector geometry, and must be labelled as such wherever shown.
 */
export const DETECTOR_ORIENTATIONS = Object.freeze({
  H1: Object.freeze({ label: "Hanford", theta: 0.62, phi: 0.85, psi: 0.70 }),
  L1: Object.freeze({ label: "Livingston", theta: 0.71, phi: 1.12, psi: 0.66 }),
  V1: Object.freeze({ label: "Virgo", theta: 0.55, phi: 2.20, psi: 1.10 }),
});

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* ------------------------------------------------------------------ */
/* FFT — iterative radix-2 Cooley-Tukey                                */
/* ------------------------------------------------------------------ */

export function nextPowerOfTwo(n) {
  let p = 1;
  while (p < n) p *= 2;
  if (p > 1 << 24) throw new RangeError("FFT size would exceed the 16M-point safety bound.");
  return p;
}

/**
 * In-place iterative radix-2 FFT. `re`/`im` lengths must be equal powers of
 * two. `invert = true` computes the inverse (unnormalised; divide by N).
 */
export function fftRadix2(re, im, invert = false) {
  const n = re.length;
  if (n !== im.length) throw new TypeError("fftReal/fftImag lengths must match");
  if (n === 0 || (n & (n - 1)) !== 0) throw new RangeError("FFT length must be a positive power of two");
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len *= 2) {
    const ang = (invert ? 2 : -2) * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let start = 0; start < n; start += len) {
      let curR = 1, curI = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = start + k, b = a + len / 2;
        const xr = re[b] * curR - im[b] * curI;
        const xi = re[b] * curI + im[b] * curR;
        re[b] = re[a] - xr; im[b] = im[a] - xi;
        re[a] += xr; im[a] += xi;
        const nr = curR * wr - curI * wi;
        curI = curR * wi + curI * wr;
        curR = nr;
      }
    }
  }
  return { re, im };
}

/* ------------------------------------------------------------------ */
/* Time-domain conditioning                                            */
/* ------------------------------------------------------------------ */

/** Remove the arithmetic mean. Returns a new Float64Array plus the mean. */
export function removeMean(samples) {
  const src = Float64Array.from(samples);
  let sum = 0;
  for (let i = 0; i < src.length; i++) sum += src[i];
  const mean = src.length ? sum / src.length : 0;
  for (let i = 0; i < src.length; i++) src[i] -= mean;
  return { samples: src, mean };
}

/** Least-squares linear detrend. Returns a new Float64Array + fitted line. */
export function detrendLinear(samples) {
  const src = Float64Array.from(samples);
  const n = src.length;
  if (n < 2) return { samples: src, intercept: n ? src[0] : 0, slope: 0 };
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += i; sy += src[i]; sxx += i * i; sxy += i * src[i];
  }
  const denom = n * sxx - sx * sx;
  const slope = denom ? (n * sxy - sx * sy) / denom : 0;
  const intercept = (sy - slope * sx) / n;
  for (let i = 0; i < n; i++) src[i] -= intercept + slope * i;
  return { samples: src, intercept, slope };
}

/** Hann window of `size` taps. */
export function hannWindow(size) {
  if (!Number.isInteger(size) || size < 2) throw new RangeError("Window size must be an integer >= 2");
  const w = new Float64Array(size);
  for (let k = 0; k < size; k++) w[k] = 0.5 * (1 - Math.cos((2 * Math.PI * k) / size));
  return w;
}

/** Element-wise windowing. Lengths must match; returns a new array. */
export function applyWindow(samples, window) {
  const n = Math.min(samples.length, window.length);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = samples[i] * window[i];
  return out;
}

/* ------------------------------------------------------------------ */
/* Bandpass policy — zero-phase Butterworth biquad cascade (RBJ)       */
/* ------------------------------------------------------------------ */

function biquadHighpass(fs, f0, q) {
  const w0 = 2 * Math.PI * f0 / fs, cw = Math.cos(w0), sw = Math.sin(w0);
  const alpha = sw / (2 * q);
  const a0 = 1 + alpha;
  return {
    b0: ((1 + cw) / 2) / a0, b1: (-(1 + cw)) / a0, b2: ((1 + cw) / 2) / a0,
    a1: (-2 * cw) / a0, a2: (1 - alpha) / a0,
  };
}

function biquadLowpass(fs, f0, q) {
  const w0 = 2 * Math.PI * f0 / fs, cw = Math.cos(w0), sw = Math.sin(w0);
  const alpha = sw / (2 * q);
  const a0 = 1 + alpha;
  return {
    b0: ((1 - cw) / 2) / a0, b1: (1 - cw) / a0, b2: ((1 - cw) / 2) / a0,
    a1: (-2 * cw) / a0, a2: (1 - alpha) / a0,
  };
}

/**
 * Cascade sections for a bandpass of the given Butterworth-ish order
 * (pairs of Q = 0.7071 biquads, half the sections high-pass at fLow, half
 * low-pass at fHigh). Pure design: returns plain section objects.
 */
export function designBandpassSections({ sampleRate, fLow = GW_BAND_DEFAULTS.fLow, fHigh = GW_BAND_DEFAULTS.fHigh, order = GW_BAND_DEFAULTS.order } = {}) {
  const fs = Number(sampleRate);
  const nyq = fs / 2;
  if (!(fs > 0)) throw new RangeError("sampleRate must be positive");
  if (!(fLow > 0 && fLow < fHigh && fHigh < nyq)) {
    throw new RangeError(`Band edges must satisfy 0 < fLow < fHigh < Nyquist (${nyq} Hz), got ${fLow}-${fHigh} Hz`);
  }
  const pairs = clamp(Math.round(order / 2), 1, 6);
  const q = 0.7071067811865476;
  const sections = [];
  for (let i = 0; i < pairs; i++) {
    sections.push(biquadHighpass(fs, fLow, q));
    sections.push(biquadLowpass(fs, fHigh, q));
  }
  return Object.freeze(sections.map((s) => Object.freeze({ ...s })));
}

function applySectionsForward(sections, input) {
  let cur = input;
  for (const s of sections) {
    const out = new Float64Array(input.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < input.length; i++) {
      const x0 = cur[i];
      const y0 = s.b0 * x0 + s.b1 * x1 + s.b2 * x2 - s.a1 * y1 - s.a2 * y2;
      x2 = x1; x1 = x0; y2 = y1; y1 = y0;
      out[i] = y0;
    }
    cur = out;
  }
  return cur === input ? Float64Array.from(input) : cur;
}

/**
 * Zero-phase bandpass: the cascade runs forward then backward (filtfilt), so
 * the composite response is a squared-magnitude Butterworth with no phase
 * distortion. Returns a new Float64Array; the input is untouched.
 */
export function bandpass(samples, options = {}) {
  const sections = designBandpassSections(options);
  const n = samples.length;
  // Even-reflection padding (scipy filtfilt style) suppresses the zero-state
  // startup transient that would otherwise dominate the output edges.
  const pad = Math.min(Math.floor(n / 2), 6 * sections.length + 6);
  const padded = new Float64Array(n + 2 * pad);
  for (let i = 0; i < pad; i++) padded[i] = samples[pad - i];
  padded.set(samples, pad);
  for (let i = 0; i < pad; i++) padded[pad + n + i] = samples[n - 2 - i];
  const forward = applySectionsForward(sections, padded);
  const reversed = new Float64Array(forward.length);
  for (let i = 0; i < forward.length; i++) reversed[i] = forward[forward.length - 1 - i];
  const back = applySectionsForward(sections, reversed);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = back[pad + i];
  return {
    samples: out,
    policy: Object.freeze({ filter: "zero-phase-butterworth-biquad-cascade", fLow: options.fLow ?? GW_BAND_DEFAULTS.fLow, fHigh: options.fHigh ?? GW_BAND_DEFAULTS.fHigh, order: options.order ?? GW_BAND_DEFAULTS.order }),
  };
}

/* ------------------------------------------------------------------ */
/* Whitening policy — running-PSD division in the frequency domain     */
/* ------------------------------------------------------------------ */

/**
 * Welch running power-spectral-density estimate with Hann segments.
 * Pure; returns { freqs, psd, segmentSize, sampleRate, segments }.
 */
export function estimatePsd(samples, { sampleRate, segmentSize = GW_WHITEN_DEFAULTS.segmentSize, hop = null } = {}) {
  const size = nextPowerOfTwo(Math.max(2, Math.round(segmentSize)));
  const step = Math.max(1, hop == null ? Math.floor(size / 2) : Math.round(hop));
  const win = hannWindow(size);
  const bins = size / 2 + 1;
  const psd = new Float64Array(bins);
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  let segments = 0;
  let normSum = 0;
  for (let k = 0; k < size; k++) normSum += win[k] * win[k];
  for (let start = 0; start + size <= samples.length; start += step) {
    for (let k = 0; k < size; k++) { re[k] = samples[start + k] * win[k]; im[k] = 0; }
    fftRadix2(re, im);
    for (let b = 0; b < bins; b++) psd[b] += re[b] * re[b] + im[b] * im[b];
    segments++;
  }
  if (!segments) throw new RangeError(`PSD estimate needs at least one ${size}-sample segment (got ${samples.length} samples)`);
  const scale = 1 / (segments * Math.max(sampleRate, 1e-9) * normSum);
  for (let b = 0; b < bins; b++) psd[b] *= scale;
  const freqs = new Float64Array(bins);
  for (let b = 0; b < bins; b++) freqs[b] = (b * sampleRate) / size;
  return { freqs, psd, segmentSize: size, sampleRate, segments };
}

/** Symmetric moving-average smoother (spectral leakage trade-off knob). */
export function smoothSpectrum(psd, widthBins = GW_WHITEN_DEFAULTS.smoothingBins) {
  const w = Math.max(1, Math.round(widthBins));
  const out = new Float64Array(psd.length);
  let acc = 0;
  const pad = (i) => psd[clamp(i, 0, psd.length - 1)];
  for (let i = 0; i < psd.length; i++) {
    if (i === 0) for (let j = -w; j <= w; j++) acc += pad(j);
    else acc += pad(i + w) - pad(i - w - 1);
    out[i] = acc / (2 * w + 1);
  }
  return out;
}

/**
 * Whitening policy: divide the full-signal spectrum by sqrt(smoothed PSD),
 * zeroing the DC bin and anything at the Nyquist edge, then transform back.
 * Heuristic by design (a display/audition aid, not a calibrated detector
 * whitening); labelled accordingly by callers. Returns { samples, policy }.
 */
export function whiten(samples, { sampleRate, segmentSize = GW_WHITEN_DEFAULTS.segmentSize, smoothingBins = GW_WHITEN_DEFAULTS.smoothingBins } = {}) {
  const n = samples.length;
  if (n < 8) throw new RangeError("whiten needs at least 8 samples");
  const psd = estimatePsd(samples, { sampleRate, segmentSize });
  const smoothed = smoothSpectrum(psd.psd, smoothingBins);
  const size = nextPowerOfTwo(Math.max(16, n * 2));
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  for (let i = 0; i < n; i++) re[i] = samples[i];
  fftRadix2(re, im);
  const half = size / 2;
  const psdScale = size / psd.segmentSize;
  for (let b = 0; b <= half; b++) {
    const pBin = Math.min(psd.psd.length - 1, Math.round(b / psdScale));
    let weight = b === 0 || b >= half * 0.995 ? 0 : 1 / Math.sqrt(Math.max(smoothed[pBin], 1e-30));
    if (!Number.isFinite(weight)) weight = 0;
    re[b] *= weight; im[b] *= weight;
    if (b > 0 && b < half) {
      const mirror = size - b;
      re[mirror] = re[b]; im[mirror] = -im[b];
    }
  }
  fftRadix2(re, im, true);
  const out = new Float64Array(n);
  const inv = 1 / size;
  for (let i = 0; i < n; i++) out[i] = re[i] * inv;
  return {
    samples: out,
    policy: Object.freeze({ filter: "running-psd-whitening", segmentSize: psd.segmentSize, smoothingBins: Math.round(smoothingBins), note: "heuristic display whitening, not a calibrated detector PSD" }),
  };
}

/* ------------------------------------------------------------------ */
/* Resampling and frequency translation                                */
/* ------------------------------------------------------------------ */

/** Linear-interpolated resampling to a new rate. Never mutates the input. */
export function resampleLinear(samples, sourceRate, targetRate) {
  const fs = Number(sourceRate), ft = Number(targetRate);
  if (!(fs > 0 && ft > 0)) throw new RangeError("rates must be positive");
  const n = samples.length;
  if (n === 0) return new Float64Array(0);
  if (fs === ft) return Float64Array.from(samples);
  const out = new Float64Array(Math.max(1, Math.round((n * ft) / fs)));
  for (let i = 0; i < out.length; i++) {
    const src = (i / ft) * fs;
    const i0 = Math.min(n - 1, Math.floor(src));
    const i1 = Math.min(n - 1, i0 + 1);
    const frac = clamp(src - i0, 0, 1);
    out[i] = samples[i0] * (1 - frac) + samples[i1] * frac;
  }
  return out;
}

/** Uniform stride decimation (matches the bounded GWOSC preview contract). */
export function decimateUniform(samples, maxSamples) {
  const max = Math.max(2, Math.round(maxSamples));
  const stride = Math.max(1, Math.ceil(samples.length / max));
  const out = new Float64Array(Math.floor(samples.length / stride));
  for (let i = 0; i < out.length; i++) out[i] = samples[i * stride];
  return { samples: out, stride };
}

/**
 * Record-style frequency translation: interpret the buffer as playing at
 * `sampleRate * factor` and resample back to `sampleRate`. All frequencies
 * scale by `factor` and the duration scales by 1/factor (analogous to a
 * turntable speed-up — no duration-preserving claim is made).
 */
export function translateFrequency(samples, sampleRate, factor) {
  const f = clamp(Number(factor) || 1, 0.01, 100);
  const resampled = resampleLinear(samples, sampleRate * f, sampleRate);
  return {
    samples: resampled,
    sampleRate,
    factor: f,
    durationSeconds: resampled.length / sampleRate,
    policy: Object.freeze({ filter: "playback-rate-frequency-translation", factor: f }),
  };
}

/**
 * Audibilisation shift: how much to raise a signal whose characteristic
 * frequency is `bandCenterHz` so it sits at `targetHz` (default A4 = 440 Hz).
 */
export function audibilizeShift({ bandCenterHz, targetHz = GW_AUDIBLE_TARGET_HZ } = {}) {
  const f = Number(bandCenterHz);
  if (!(f > 0)) throw new RangeError("bandCenterHz must be positive");
  return clamp(targetHz / f, 0.01, 100);
}

/* ------------------------------------------------------------------ */
/* Display helpers                                                     */
/* ------------------------------------------------------------------ */

export function peakAbs(samples) {
  let m = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > m) m = a;
  }
  return m;
}

/** Display normalization to a peak target. Returns a new Float32Array copy. */
export function normalizePeak(samples, target = 1) {
  const peak = peakAbs(samples);
  const out = new Float32Array(samples.length);
  const gain = peak > 0 ? target / peak : 1;
  for (let i = 0; i < samples.length; i++) out[i] = samples[i] * gain;
  return out;
}

/** Linear-interpolated sample read in seconds; clamped at both ends. */
export function sampleAtTime(samples, sampleRate, time) {
  const x = clamp((Number(time) || 0) * sampleRate, 0, Math.max(0, samples.length - 1));
  const i0 = Math.floor(x);
  const i1 = Math.min(samples.length - 1, i0 + 1);
  return samples[i0] * (1 - (x - i0)) + samples[i1] * (x - i0);
}

/* ------------------------------------------------------------------ */
/* Polarizations and detector response                                 */
/* ------------------------------------------------------------------ */

/** Box-Muller Gaussian noise over a seeded mulberry32 stream. */
function seededGaussians(seed) {
  let a = (seed >>> 0) || 1;
  const rng = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => {
    const u = Math.max(1e-12, rng());
    const v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

/** Frozen provenance stamped on every generated waveform. */
export function syntheticProvenance(params = {}) {
  return Object.freeze({
    mode: GW_SYNTHETIC_MODE,
    model: "leading-order-quadrupole+ringdown",
    generator: "js/science/gravitational-waves.mjs",
    seed: Number.isFinite(params.seed) ? params.seed : null,
    deterministic: true,
    note: "teaching waveform; noise is seeded Gaussian, not a measured detector noise PSD",
  });
}

/** Throws if `provenance` is missing or claims real detector data. */
export function assertSyntheticProvenance(provenance, context = "signal") {
  if (!provenance || provenance.mode !== GW_SYNTHETIC_MODE) {
    throw new Error(`${context}: generated signals must carry mode "${GW_SYNTHETIC_MODE}" and may never reuse real-data provenance`);
  }
  return provenance;
}

/** Throws if `provenance` is missing or does not carry the real-data mode. */
export function assertRealProvenance(provenance, context = "observation") {
  if (!provenance || provenance.mode !== GW_REAL_MODE) {
    throw new Error(`${context}: real observations must carry mode "${GW_REAL_MODE}" from the GWOSC fetch`);
  }
  return provenance;
}

/**
 * Newtonian quadrupole polarizations of the teaching binary, using the SAME
 * scalings as physics.mjs generatedChirp (f ∝ τ^-3/8, h ∝ f^2/3):
 *   h+ = A(τ) · (1 + cos²ι)/2 · cos Φ(t)
 *   h× = A(τ) · cos ι · sin Φ(t)
 * with A = min(1, (f/220)^{2/3}); after merger a damped ringdown at
 * ringdownFreq. Seeded Gaussian noise is added to both polarizations.
 */
export function synthesizePolarizations({
  m1 = 36, m2 = 29, seed = 42, sampleRate = 512, duration = 4, mergerAt = 3.4,
  inclinationRad = 0.4, noiseRms = 0.35, ringdownFreq = 190, ringdownTau = 0.06,
} = {}) {
  const n = Math.max(8, Math.round(sampleRate * duration));
  const mc = chirpMass(m1, m2);
  const gauss = seededGaussians(seed);
  const plus = new Float64Array(n);
  const cross = new Float64Array(n);
  const freqTrack = new Float32Array(n);
  const incl = Number(inclinationRad);
  const fPlus = (1 + Math.cos(incl) * Math.cos(incl)) / 2;
  const fCross = Math.cos(incl);
  let phase = 0;
  let prevTau = Math.max(0.02, mergerAt);
  const mergerIndex = Math.min(n - 1, Math.round(mergerAt * sampleRate));
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    let amp = 0;
    if (t < mergerAt) {
      const tau = mergerAt - t;
      const f = inspiralFrequency(tau, mc);
      phase += 2 * Math.PI * f * (prevTau - tau);
      prevTau = tau;
      amp = Math.min(1, Math.pow(f / 220, 2 / 3));
      freqTrack[i] = f;
      plus[i] = amp * fPlus * Math.cos(phase);
      cross[i] = amp * fCross * Math.sin(phase);
    } else {
      const tr = t - mergerAt;
      amp = Math.exp(-tr / ringdownTau);
      freqTrack[i] = ringdownFreq;
      const rdPhase = phase + 2 * Math.PI * ringdownFreq * tr;
      plus[i] = amp * fPlus * Math.cos(rdPhase);
      cross[i] = amp * fCross * Math.sin(rdPhase);
    }
    plus[i] += noiseRms * gauss();
    cross[i] += noiseRms * gauss();
  }
  return {
    plus, cross, freqTrack, mergerIndex, sampleRate, duration,
    chirpMassSolar: mc, inclinationRad: incl,
    model: "leading-order-quadrupole+ringdown",
    provenance: syntheticProvenance({ seed }),
  };
}

/**
 * Pattern functions for the illustrative source geometry
 * (theta = inclination of the source in the detector frame, phi = azimuth,
 * psi = polarisation angle):
 *   F+ = ½(1 + cos²θ) cos 2φ cos 2ψ − cos θ sin 2φ sin 2ψ
 *   F× = ½(1 + cos²θ) cos 2φ sin 2ψ + cos θ sin 2φ cos 2ψ
 */
export function antennaPatterns({ theta, phi, psi } = {}) {
  const ct = Math.cos(theta), st2 = Math.sin(2 * phi), ct2 = Math.cos(2 * phi);
  const c2psi = Math.cos(2 * psi), s2psi = Math.sin(2 * psi);
  const half = 0.5 * (1 + ct * ct);
  return Object.freeze({
    plus: half * ct2 * c2psi - ct * st2 * s2psi,
    cross: half * ct2 * s2psi + ct * st2 * c2psi,
  });
}

/** h(t) = F+·h+(t) + F×·h×(t), with an optional whole-sample delay. */
export function detectorResponse({ plus, cross, pattern, delaySamples = 0 }) {
  if (!plus || !cross) throw new TypeError("detectorResponse needs plus and cross series");
  const { plus: Fp, cross: Fx } = pattern || { plus: 1, cross: 0 };
  const delay = Math.max(0, Math.round(delaySamples));
  const out = new Float64Array(plus.length);
  for (let i = 0; i < out.length; i++) {
    const j = i - delay;
    out[i] = j >= 0 ? Fp * plus[j] + Fx * cross[j] : 0;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Signal bundles — raw and display kept provably separate             */
/* ------------------------------------------------------------------ */

function freezeBundle(bundle) {
  // Typed arrays with elements cannot be Object.freeze'd; freezing the bundle
  // makes the raw/display bindings immutable, and no consumer writes in place.
  return Object.freeze(bundle);
}

/**
 * Bundle a real GWOSC preview. `samples` are kept verbatim in `raw`;
 * `display` is a peak-normalized copy. Provenance must carry the real mode.
 */
export function buildRealBundle({ samples, sampleRate, start, duration, provenance }) {
  assertRealProvenance(provenance, "GWOSC bundle");
  const raw = new Float64Array(samples.length);
  for (let i = 0; i < samples.length; i++) raw[i] = samples[i];
  return freezeBundle({
    kind: "real",
    raw,
    display: normalizePeak(raw, 1),
    sampleRate: Number(sampleRate),
    start: Number.isFinite(start) ? Number(start) : null,
    duration: Number(duration),
    provenance: Object.freeze({ ...provenance }),
  });
}

/** Bundle a generated (synthetic) signal; refuses real-mode provenance. */
export function buildGeneratedBundle({ samples, sampleRate, duration, provenance, extra = {} }) {
  assertSyntheticProvenance(provenance, "generated bundle");
  const raw = new Float64Array(samples.length);
  for (let i = 0; i < samples.length; i++) raw[i] = samples[i];
  return freezeBundle({
    kind: "generated",
    raw,
    display: normalizePeak(raw, 1),
    sampleRate: Number(sampleRate),
    start: null,
    duration: Number(duration),
    provenance,
    ...extra,
  });
}

/* ------------------------------------------------------------------ */
/* Processing chain — named policy applied to a copy of the raw data   */
/* ------------------------------------------------------------------ */

/**
 * Apply the named display/audition processing chain to a *copy* of the
 * signal; the bundle's raw array is never touched. Every executed stage is
 * recorded in `chain` so the UI can state exactly what was done.
 */
export function processSignal(raw, sampleRate, {
  detrend = true,
  bandpassPolicy = null,
  whitenPolicy = null,
  targetRate = null,
  maxSamples = null,
  normalize = true,
} = {}) {
  let samples = Float64Array.from(raw);
  let rate = Number(sampleRate);
  const chain = [];
  if (detrend) {
    const r = detrendLinear(samples);
    samples = r.samples;
    chain.push(`linear detrend (slope ${r.slope.toExponential(2)}/sample)`);
  }
  if (bandpassPolicy) {
    const r = bandpass(samples, { sampleRate: rate, ...bandpassPolicy });
    samples = r.samples;
    chain.push(`zero-phase bandpass ${r.policy.fLow}-${r.policy.fHigh} Hz order ${r.policy.order}`);
  }
  if (whitenPolicy) {
    const r = whiten(samples, { sampleRate: rate, ...whitenPolicy });
    samples = r.samples;
    chain.push(`PSD whitening (${r.policy.segmentSize}-pt segments, ${r.policy.smoothingBins}-bin smoothing)`);
  }
  if (targetRate && targetRate !== rate) {
    samples = resampleLinear(samples, rate, targetRate);
    chain.push(`resample ${rate} -> ${targetRate} Hz`);
    rate = Number(targetRate);
  }
  if (maxSamples && samples.length > maxSamples) {
    const r = decimateUniform(samples, maxSamples);
    samples = r.samples;
    chain.push(`uniform decimate stride ${r.stride}`);
  }
  return {
    samples,
    sampleRate: rate,
    durationSeconds: samples.length / rate,
    display: normalize ? normalizePeak(samples, 1) : null,
    chain,
  };
}
