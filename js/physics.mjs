const G = 6.67430e-11;
const C = 299792458;
const HBAR = 1.054571817e-34;
const KB = 1.380649e-23;
const SOLAR_MASS = 1.98847e30;

export function schwarzschildRadius(massSolar) {
  return (2 * G * massSolar * SOLAR_MASS) / (C * C);
}

export function kerrGeometry(spin) {
  const a = Math.min(0.998, Math.max(0, Number(spin) || 0));
  const rPlus = 1 + Math.sqrt(Math.max(0, 1 - a * a));
  const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  const rIsco = 3 + z2 - Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
  const rIscoRetrograde = 3 + z2 + Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
  const rPhoton = 2 * (1 + Math.cos((2 / 3) * Math.acos(-a)));
  const rPhotonRetrograde = 2 * (1 + Math.cos((2 / 3) * Math.acos(a)));
  const surfaceGravity = (rPlus - 1) / (rPlus * rPlus + a * a);
  return {
    a, rPlus, rErgoEquator: 2, rIsco, rIscoRetrograde, rPhoton, rPhotonRetrograde,
    surfaceGravity, temperatureFactor: surfaceGravity / 0.25,
  };
}

export function hawkingTemperature(massSolar, spin = 0) {
  const geometry = kerrGeometry(spin);
  return (HBAR * C ** 3 / (8 * Math.PI * G * (massSolar * SOLAR_MASS) * KB)) * geometry.temperatureFactor;
}

export function blackHoleEntropyAreaUnits(massSolar, spin = 0) {
  const geometry = kerrGeometry(spin);
  return 1.05e77 * massSolar * massSolar * (geometry.rPlus / 2);
}

export function seededRng(seed) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/* ---------- Leading-order binary-inspiral signal model (teaching approximation) ---------- */
/* Newtonian chirp: f_gw(tau) = (1/pi)(5/256·1/tau)^{3/8}(G Mc/c^3)^{-5/8}, tau = t_c - t.
   Documented approximation: valid only far from merger; no spins, no higher PN orders. */
const SOLAR_TIME = (G * SOLAR_MASS) / (C * C * C); // ~4.925e-6 s

export function chirpMass(m1Solar, m2Solar) {
  const m1 = Number(m1Solar), m2 = Number(m2Solar);
  return Math.pow(m1 * m2, 3 / 5) / Math.pow(m1 + m2, 1 / 5);
}

export function timeToCoalescence(freqHz, chirpMassSolar) {
  const f = Number(freqHz), mc = Number(chirpMassSolar) * SOLAR_TIME;
  return (5 / 256) * Math.pow(Math.PI * f, -8 / 3) * Math.pow(mc, -5 / 3);
}

export function inspiralFrequency(tauSeconds, chirpMassSolar) {
  const tau = Math.max(1e-6, Number(tauSeconds));
  const mc = Number(chirpMassSolar) * SOLAR_TIME;
  return (1 / Math.PI) * Math.pow(5 / (256 * tau), 3 / 8) * Math.pow(mc, -5 / 8);
}

/* Seeded teaching waveform: inspiral chirp + damped ringdown + Gaussian noise.
   Amplitude normalized so the merger peak is ~1; noise is seeded Gaussian
   (Box–Muller over seededRng), NOT a measured detector noise PSD. */
export function generatedChirp({
  seed = 42, sampleRate = 512, duration = 4, m1 = 36, m2 = 29,
  mergerAt = 3.4, noiseRms = 0.35, delaySeconds = 0, ringdownFreq = 190, ringdownTau = 0.06,
} = {}) {
  const n = Math.max(8, Math.round(sampleRate * duration));
  const mc = chirpMass(m1, m2);
  const rng = seededRng(seed);
  const gauss = () => {
    const u = Math.max(1e-12, rng()), v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const delay = Math.round(delaySeconds * sampleRate);
  const samples = new Float64Array(n);
  let phase = 0, prevTau = Math.max(0.02, mergerAt);
  const mergerIndex = Math.min(n - 1, Math.round(mergerAt * sampleRate) + delay);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate - delaySeconds;
    let h = 0;
    if (t >= 0 && t < mergerAt) {
      const tau = mergerAt - t;
      const f = inspiralFrequency(tau, mc);
      phase += 2 * Math.PI * f * (prevTau - tau);
      prevTau = tau;
      h = Math.min(1, Math.pow(f / 220, 2 / 3)) * Math.cos(phase);
    } else if (t >= mergerAt) {
      const tr = t - mergerAt;
      h = Math.exp(-tr / ringdownTau) * Math.cos(phase + 2 * Math.PI * ringdownFreq * tr);
    }
    samples[i] = h + noiseRms * gauss();
  }
  return { samples, sampleRate, duration, mergerIndex, chirpMass: mc, model: "leading-order-quadrupole+ringdown" };
}

/* Hann-windowed STFT magnitude spectrogram in dB (naive DFT; bounded inputs only).
   Returns frames × bins with freqs up to Nyquist. Pure and deterministic. */
export function stftSpectrogram(samples, { sampleRate = 512, windowSize = 128, hopSize = 24 } = {}) {
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
}

const PARTICLES = {
  "e-": { q: -1, le: 1, lmu: 0 }, "e+": { q: 1, le: -1, lmu: 0 },
  "mu-": { q: -1, le: 0, lmu: 1 }, "mu+": { q: 1, le: 0, lmu: -1 },
  q: { q: 2 / 3, le: 0, lmu: 0 }, qbar: { q: -2 / 3, le: 0, lmu: 0 },
  ph: { q: 0, le: 0, lmu: 0 },
};

export function qftConservation(in1, in2, out1, out2) {
  const particles = [in1, in2, out1, out2].map((id) => PARTICLES[id]);
  if (particles.some((particle) => !particle)) return { ok: false, reason: "Unknown particle." };
  const [a, b, c, d] = particles;
  const delta = (key) => a[key] + b[key] - c[key] - d[key];
  return {
    ok: Math.abs(delta("q")) < 1e-9 && Math.abs(delta("le")) < 1e-9 && Math.abs(delta("lmu")) < 1e-9,
    deltaQ: delta("q"), deltaLe: delta("le"), deltaLmu: delta("lmu"),
  };
}
