// Browser bridge for the pure calculations in js/physics.mjs.
const QGA_PHYSICS = {
  schwarzschildRadius(massSolar) { return 2.95 * Number(massSolar); },
  kerrGeometry(spin) {
    const a = Math.min(0.998, Math.max(0, Number(spin) || 0));
    const root = Math.sqrt(Math.max(0, 1 - a * a));
    const rPlus = 1 + root;
    const rMinus = 1 - root;
    const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
    const z2 = Math.sqrt(3 * a * a + z1 * z1);
    const rIsco = 3 + z2 - Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
    const rIscoRetrograde = 3 + z2 + Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
    const rPhoton = 2 * (1 + Math.cos((2 / 3) * Math.acos(-a)));
    const rPhotonRetrograde = 2 * (1 + Math.cos((2 / 3) * Math.acos(a)));
    const surfaceGravity = (rPlus - 1) / (rPlus * rPlus + a * a);
    return {
      a, rPlus, rMinus, rErgoEquator: 2, rIsco, rIscoRetrograde, rPhoton, rPhotonRetrograde,
      z1, z2, surfaceGravity, temperatureFactor: surfaceGravity / 0.25,
    };
  },
  kerrErgosphere(spin, theta = Math.PI / 2) {
    const a = Math.min(0.998, Math.max(0, Number(spin) || 0));
    const c = Math.cos(Number(theta) || 0);
    return 1 + Math.sqrt(Math.max(0, 1 - a * a * c * c));
  },
  hawkingTemperature(massSolar, spin = 0) {
    return (6.17e-8 / Number(massSolar)) * this.kerrGeometry(spin).temperatureFactor;
  },
  blackHoleEntropyAreaUnits(massSolar, spin = 0) {
    return 1.05e77 * Number(massSolar) ** 2 * (this.kerrGeometry(spin).rPlus / 2);
  },
  seededRng(seed) {
    let state = (Number(seed) >>> 0) || 1;
    return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
  },
  /* Leading-order binary-inspiral teaching model — mirrors js/physics.mjs exactly. */
  chirpMass(m1Solar, m2Solar) {
    const m1 = Number(m1Solar), m2 = Number(m2Solar);
    return Math.pow(m1 * m2, 3 / 5) / Math.pow(m1 + m2, 1 / 5);
  },
  timeToCoalescence(freqHz, chirpMassSolar) {
    const f = Number(freqHz), mc = Number(chirpMassSolar) * 4.92563989396e-6;
    return (5 / 256) * Math.pow(Math.PI * f, -8 / 3) * Math.pow(mc, -5 / 3);
  },
  inspiralFrequency(tauSeconds, chirpMassSolar) {
    const tau = Math.max(1e-6, Number(tauSeconds));
    const mc = Number(chirpMassSolar) * 4.92563989396e-6;
    return (1 / Math.PI) * Math.pow(5 / (256 * tau), 3 / 8) * Math.pow(mc, -5 / 8);
  },
  generatedChirp({
    seed = 42, sampleRate = 512, duration = 4, m1 = 36, m2 = 29,
    mergerAt = 3.4, noiseRms = 0.35, delaySeconds = 0, ringdownFreq = 190, ringdownTau = 0.06,
  } = {}) {
    const n = Math.max(8, Math.round(sampleRate * duration));
    const mc = this.chirpMass(m1, m2);
    const rng = this.seededRng(seed);
    const gauss = () => {
      const u = Math.max(1e-12, rng()), v = rng();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const delay = Math.round(delaySeconds * sampleRate);
    const samples = new Float64Array(n);
    const freqTrack = new Float32Array(n);
    let phase = 0, prevTau = Math.max(0.02, mergerAt);
    const mergerIndex = Math.min(n - 1, Math.round(mergerAt * sampleRate) + delay);
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate - delaySeconds;
      let h = 0;
      if (t >= 0 && t < mergerAt) {
        const tau = mergerAt - t;
        const f = this.inspiralFrequency(tau, mc);
        phase += 2 * Math.PI * f * (prevTau - tau);
        prevTau = tau;
        h = Math.min(1, Math.pow(f / 220, 2 / 3)) * Math.cos(phase);
        freqTrack[i] = f;
      } else if (t >= mergerAt) {
        const tr = t - mergerAt;
        h = Math.exp(-tr / ringdownTau) * Math.cos(phase + 2 * Math.PI * ringdownFreq * tr);
        freqTrack[i] = ringdownFreq;
      }
      samples[i] = h + noiseRms * gauss();
    }
    return { samples, freqTrack, sampleRate, duration, mergerIndex, chirpMass: mc, model: "leading-order-quadrupole+ringdown" };
  },
  stftSpectrogram(samples, { sampleRate = 512, windowSize = 128, hopSize = 24 } = {}) {
    const n = samples.length;
    const bins = windowSize / 2;
    const frames = Math.max(1, Math.floor((n - windowSize) / hopSize) + 1);
    const hann = new Float64Array(windowSize);
    for (let k = 0; k < windowSize; k++) hann[k] = 0.5 * (1 - Math.cos((2 * Math.PI * k) / (windowSize - 1)));
    const magnitudes = new Float32Array(frames * bins);
    let maxDb = -Infinity;
    for (let f = 0; f < frames; f++) {
      const base = f * hopSize;
      for (let b = 0; b < bins; b++) {
        let re = 0, im = 0;
        const w = (2 * Math.PI * b) / windowSize;
        for (let k = 0; k < windowSize; k++) {
          const v = samples[base + k] * hann[k];
          re += v * Math.cos(w * k); im -= v * Math.sin(w * k);
        }
        const db = 20 * Math.log10(Math.hypot(re, im) / windowSize + 1e-12);
        magnitudes[f * bins + b] = db;
        if (db > maxDb) maxDb = db;
      }
    }
    const times = Array.from({ length: frames }, (_, f) => (f * hopSize + windowSize / 2) / sampleRate);
    const freqs = Array.from({ length: bins }, (_, b) => (b * sampleRate) / windowSize);
    return { magnitudes, frames, bins, times, freqs, maxDb, nyquist: sampleRate / 2 };
  },
  /* ---------- QFT 2→2 kinematics (mirrors js/physics.mjs) ---------- */
  QFT_CONSTANTS: { ALPHA_EM: 1 / 137.035999084, GEV2_TO_NB: 0.3893793721e6, M_ELECTRON: 0.51099895e-3, M_Z: 91.1876, GAMMA_Z: 2.4952 },
  mandelstamKinematics({ sqrtS, cosTheta = 0, masses = [0, 0, 0, 0] }) {
    const [m1, m2, m3, m4] = masses;
    const s = sqrtS * sqrtS;
    const E1 = (s + m1 * m1 - m2 * m2) / (2 * sqrtS);
    const E3 = (s + m3 * m3 - m4 * m4) / (2 * sqrtS);
    const E4 = (s + m4 * m4 - m3 * m3) / (2 * sqrtS);
    const p1 = Math.sqrt(Math.max(0, E1 * E1 - m1 * m1));
    const p3 = Math.sqrt(Math.max(0, E3 * E3 - m3 * m3));
    const t = m1 * m1 + m3 * m3 - 2 * E1 * E3 + 2 * p1 * p3 * cosTheta;
    const u = m1 * m1 + m4 * m4 - 2 * E1 * E4 - 2 * p1 * p3 * cosTheta;
    const sum = m1 * m1 + m2 * m2 + m3 * m3 + m4 * m4;
    return { s, t, u, sum, residual: s + t + u - sum, sqrtS, cosTheta, E1, E3, E4, p1, p3 };
  },
  kleinNishina({ cosTheta = 0, x = 0.1 }) {
    const ratio = 1 / (1 + x * (1 - cosTheta));
    const sin2 = 1 - cosTheta * cosTheta;
    return ratio * ratio * (ratio + 1 / ratio - sin2);
  },
  angularDistribution({ process = "s-channel", cosTheta = 0, photonX = 0.1 }) {
    const c = Math.max(-1, Math.min(1, cosTheta));
    if (process === "s-channel") return 1 + c * c;
    if (process === "t-channel") {
      const half = Math.sin(Math.acos(c) / 2);
      const s2 = half * half;
      return 1 / Math.max(1e-8, s2 * s2);
    }
    if (process === "compton") return this.kleinNishina({ cosTheta: c, x: photonX });
    return 0;
  },
  breitWignerResonance({ sqrtS = 91.1876, mass = 91.1876, width = 2.4952 }) {
    const s = sqrtS * sqrtS;
    const m2 = mass * mass;
    const denom = (s - m2) * (s - m2) + m2 * width * width;
    return (m2 * width * width) / denom;
  },
  qftTotalCrossSection({ sqrtS = 10 }) {
    const s = sqrtS * sqrtS;
    const a = 1 / 137.035999084;
    return ((4 * Math.PI * a * a) / (3 * s)) * 0.3893793721e6;
  },
};
window.QGA_PHYSICS = QGA_PHYSICS;
