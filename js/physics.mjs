/* The Kerr, integrator, accretion-disk and spectral cores live in
   `js/science/`. This module is the canonical pure-science surface, so it
   re-exports them rather than restating their formulas. `js/physics.jsx`
   mirrors the same names onto `window.QGA_PHYSICS` for the no-build runtime. */
import {
  kerrGeometry as scienceKerrGeometry,
  kerrErgosphere as scienceKerrErgosphere,
} from "./science/kerr.mjs";

export * from "./science/constants.mjs";
export * from "./science/kerr.mjs";
export * from "./science/integrators.mjs";
export * from "./science/accretion-disk.mjs";
export * from "./science/spectrum.mjs";

const G = 6.67430e-11;
const C = 299792458;
const HBAR = 1.054571817e-34;
const KB = 1.380649e-23;
const SOLAR_MASS = 1.98847e30;

export function schwarzschildRadius(massSolar) {
  return (2 * G * massSolar * SOLAR_MASS) / (C * C);
}

/* Legacy spin-clamped geometry, kept byte-compatible with the historical
   implementation. The formula itself lives in `js/science/kerr.mjs`. */
export function kerrGeometry(spin) {
  return scienceKerrGeometry(spin);
}

/* Stationary-limit (ergo) surface in Boyer-Lindquist coordinates,
   r_E(theta) = M + sqrt(M^2 - a^2 cos^2 theta), in units of GM/c^2.
   At theta = pi/2 this reduces exactly to kerrGeometry().rErgoEquator. */
export function kerrErgosphere(spin, theta = Math.PI / 2) {
  return scienceKerrErgosphere(spin, theta);
}

export function hawkingTemperature(massSolar, spin = 0) {
  const geometry = kerrGeometry(spin);
  return (HBAR * C ** 3 / (8 * Math.PI * G * (massSolar * SOLAR_MASS) * KB)) * geometry.temperatureFactor;
}

export function blackHoleEntropyAreaUnits(massSolar, spin = 0) {
  const geometry = kerrGeometry(spin);
  return 1.05e77 * massSolar * massSolar * (geometry.rPlus / 2);
}

/* ---------- General relativity: post-Newtonian observables ----------
   Exact leading-order Schwarzschild results. The same helpers serve the
   curvature engine's scene units and the real-unit literature anchors:
   Mercury's anomalous perihelion advance (42.98″/century) and the 1919
   solar-limb light deflection (1.75″). */

// Perihelion advance Δϖ = 6πGM/[c² a(1−e²)] per orbit, in radians.
export function grPerihelionPrecession(gm, c2, a, e) {
  return (6 * Math.PI * gm) / (c2 * a * (1 - e * e));
}

// Light deflection α = 4GM/(c² b) — twice the Newtonian value, in radians.
export function grLightDeflection(gm, c2, impactParameter) {
  return (4 * gm) / (c2 * impactParameter);
}

/* ---------- Planck units: the unique scale built from ħ, G, c alone ---------- */
export function planckUnits() {
  const lengthMeters = Math.sqrt((HBAR * G) / C ** 3);
  const timeSeconds = Math.sqrt((HBAR * G) / C ** 5);
  const massKg = Math.sqrt((HBAR * C) / G);
  const energyJoules = massKg * C * C;
  const energyGeV = energyJoules / 1.602176634e-10; // J → GeV (CODATA elementary charge)
  return { lengthMeters, timeSeconds, massKg, energyJoules, energyGeV };
}

// Probe energy ħc/l for a resolution l, in GeV (ħc ≈ 1.973×10⁻¹⁶ GeV·m).
export function probeEnergyGeV(lengthMeters) {
  return 1.973e-16 / lengthMeters;
}

/* ---------- Black-hole thermodynamics beyond the static geometry ---------- */

// Order-of-magnitude evaporation time, anchored at 2.1×10⁶⁷ yr per solar mass.
export function blackHoleEvaporationTimeYears(massSolar) {
  return 2.1e67 * massSolar ** 3;
}

/* Unitary Page curve: S_rad = min(thermal, remaining), normalised so the
   peak is 1 at the Page time (half the evaporation). The naive semiclassical
   curve is the ever-rising thermal branch alone. */
export function pageCurveEntropy(fractionEvaporated) {
  const f = Number(fractionEvaporated);
  if (!Number.isFinite(f)) return NaN;
  const clamped = Math.min(1, Math.max(0, f));
  return 2 * Math.min(clamped, 1 - clamped);
}

/* Planck blackbody spectral shape x³/(e^{x/T} − 1): the Hawking spectrum up
   to normalisation. The exponent is bounded so large x/T stays finite. */
export function hawkingSpectralShape(x, temperature) {
  const t = Number(temperature);
  if (!Number.isFinite(t) || t <= 0) return NaN;
  const u = Number(x) / t;
  if (!Number.isFinite(u) || u < 0) return NaN;
  return (u * u * u) / (Math.exp(Math.min(40, u)) - 1 + 1e-9);
}

export function seededRng(seed) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function safeBeta(value, fallback = 0.2, { min = -0.999, max = 0.999 } = {}) {
  const beta = Number(value);
  if (!Number.isFinite(beta) || Math.abs(beta) >= 1) return Number.isFinite(fallback) ? clamp(fallback, min, max) : 0;
  return clamp(beta, min, max);
}

export function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function sanitizeCausalState(input = {}, defaults = {}) {
  const fallback = {
    beta: 0.35,
    a: { ct: 0, x: -1.35 },
    b: { ct: 2.6, x: 1.1 },
    ...defaults,
  };
  fallback.a = { ct: 0, x: -1.35, ...(defaults.a || {}) };
  fallback.b = { ct: 2.6, x: 1.1, ...(defaults.b || {}) };
  const inRange = (value, backup, min, max) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= min && numeric <= max ? numeric : backup;
  };
  return {
    beta: inRange(input.beta, fallback.beta, -0.95, 0.95),
    a: {
      ct: inRange(input.a?.ct, fallback.a.ct, -4, 4),
      x: inRange(input.a?.x, fallback.a.x, -4, 4),
    },
    b: {
      ct: inRange(input.b?.ct, fallback.b.ct, -4, 4),
      x: inRange(input.b?.x, fallback.b.x, -4, 4),
    },
  };
}

export function lorentzGamma(beta) {
  const b = safeBeta(beta, 0);
  return 1 / Math.sqrt(Math.max(1e-12, 1 - b * b));
}

export function invariantInterval(deltaCt, deltaX, { c = 1 } = {}) {
  const dct = Number(deltaCt); const dx = Number(deltaX);
  if (!Number.isFinite(dct) || !Number.isFinite(dx) || !(Number(c) > 0)) return NaN;
  return -(dct * dct) + dx * dx;
}

export function classifySeparation(deltaCt, deltaX, { c = 1 } = {}) {
  const ds2 = invariantInterval(deltaCt, deltaX, { c });
  if (!Number.isFinite(ds2)) return { type: "invalid", ds2: NaN, deltaCt: Number(deltaCt), deltaX: Number(deltaX) };
  if (ds2 < 0) return { type: "timelike", ds2, deltaCt: Number(deltaCt), deltaX: Number(deltaX) };
  if (Math.abs(ds2) < 1e-12) return { type: "null", ds2: 0, deltaCt: Number(deltaCt), deltaX: Number(deltaX) };
  return { type: "spacelike", ds2, deltaCt: Number(deltaCt), deltaX: Number(deltaX) };
}

export function properTime(deltaCt, deltaX, { c = 1 } = {}) {
  const ds2 = invariantInterval(deltaCt, deltaX, { c });
  const cs = Number(c);
  if (!Number.isFinite(ds2) || ds2 >= 0 || !(cs > 0)) return NaN;
  return Math.sqrt(-ds2) / cs;
}

export function lorentzTransform({ deltaCt, deltaX, beta, c = 1 } = {}) {
  const b = safeBeta(beta, 0);
  const dct = Number(deltaCt); const dx = Number(deltaX);
  if (!Number.isFinite(dct) || !Number.isFinite(dx) || !(Number(c) > 0)) {
    return { deltaCtPrime: NaN, deltaXPrime: NaN, gamma: lorentzGamma(b), beta: b };
  }
  const gamma = lorentzGamma(b);
  const ctPrime = gamma * (dct - b * dx);
  const xPrime = gamma * (dx - b * dct);
  return { deltaCtPrime: ctPrime, deltaXPrime: xPrime, gamma, beta: b };
}

export function simultaneityFrameBeta(deltaCt, deltaX) {
  const dt = Number(deltaCt); const dx = Number(deltaX);
  if (!Number.isFinite(dt) || !Number.isFinite(dx) || Math.abs(dx) < 1e-12) return NaN;
  const beta = dt / dx;
  return Math.abs(beta) < 1 ? beta : NaN;
}

export function transformPair({ a, b, beta, c = 1 } = {}) {
  const left = { deltaCt: Number(b.ct) - Number(a.ct), deltaX: Number(b.x) - Number(a.x) };
  const transformed = lorentzTransform({ ...left, beta, c });
  const interval = classifySeparation(left.deltaCt, left.deltaX, { c });
  return { a, b, left, transformed, interval, gamma: transformed.gamma };
}

export function piecewiseProperTime(points, { c = 1 } = {}) {
  if (!Array.isArray(points) || points.length < 2) return NaN;
  let total = 0;
  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1];
    const current = points[index];
    const segment = properTime(
      Number(current?.ct) - Number(previous?.ct),
      Number(current?.x) - Number(previous?.x),
      { c },
    );
    if (!Number.isFinite(segment)) return NaN;
    total += segment;
  }
  return total;
}

/* ---------- Renormalization-group flow helpers ----------
   Flow time is t = ln(mu / mu0), so dg/dt = beta(g). QED assumes nf
   unit-charge Dirac fermions. QCD is SU(3) with b0 = 11 - 2 nf / 3.
   The linear and asymptotic-safety models are pedagogical toy flows. */
export function qcdB0(nf) {
  const flavors = Number(nf);
  return Number.isFinite(flavors) && flavors >= 0 ? 11 - (2 * flavors) / 3 : NaN;
}

export function rgBeta(model, coupling, { nf = 1, a = 1, b = 1, gStar = 1 } = {}) {
  const g = Number(coupling);
  const flavors = Number(nf);
  const aa = Number(a), bb = Number(b), fixed = Number(gStar);
  if (!Number.isFinite(g)) return NaN;
  if (model === "qed") {
    if (!Number.isFinite(flavors) || flavors < 0) return NaN;
    return (flavors * g ** 3) / (12 * Math.PI ** 2);
  }
  if (model === "qcd") {
    const coefficient = qcdB0(flavors);
    return Number.isFinite(coefficient) ? -(coefficient * g ** 3) / (16 * Math.PI ** 2) : NaN;
  }
  if (model === "gaussian") return Number.isFinite(aa) ? -aa * g : NaN;
  if (model === "linear") {
    return Number.isFinite(aa) && Number.isFinite(fixed) ? aa * (g - fixed) : NaN;
  }
  if (model === "asymptotic-safety") {
    return Number.isFinite(aa) && Number.isFinite(bb) ? aa * g - bb * g ** 3 : NaN;
  }
  return NaN;
}

export function rgBetaDerivative(model, coupling, { nf = 1, a = 1, b = 1 } = {}) {
  const g = Number(coupling);
  const flavors = Number(nf);
  const aa = Number(a), bb = Number(b);
  if (!Number.isFinite(g)) return NaN;
  if (model === "qed") {
    return Number.isFinite(flavors) && flavors >= 0 ? (flavors * g * g) / (4 * Math.PI ** 2) : NaN;
  }
  if (model === "qcd") {
    const coefficient = qcdB0(flavors);
    return Number.isFinite(coefficient) ? -(3 * coefficient * g * g) / (16 * Math.PI ** 2) : NaN;
  }
  if (model === "gaussian") return Number.isFinite(aa) ? -aa : NaN;
  if (model === "linear") return Number.isFinite(aa) ? aa : NaN;
  if (model === "asymptotic-safety") {
    return Number.isFinite(aa) && Number.isFinite(bb) ? aa - 3 * bb * g * g : NaN;
  }
  return NaN;
}

export function rgStability(derivative, tolerance = 1e-9) {
  const slope = Number(derivative);
  if (!Number.isFinite(slope)) return "invalid";
  if (slope < -Math.abs(tolerance)) return "UV-attractive";
  if (slope > Math.abs(tolerance)) return "IR-attractive";
  return "marginal";
}

export function rgFixedPoints(model, parameters = {}) {
  const { a = 1, b = 1, gStar = 1 } = parameters;
  let roots = [];
  if (model === "qed" || model === "qcd" || model === "gaussian") roots = [0];
  else if (model === "linear" && Number.isFinite(Number(gStar))) roots = [Number(gStar)];
  else if (model === "asymptotic-safety" && Number(a) >= 0 && Number(b) > 0) {
    roots = [0, Math.sqrt(Number(a) / Number(b))];
  }
  return roots.map((g) => {
    const derivative = rgBetaDerivative(model, g, parameters);
    return { g, beta: rgBeta(model, g, parameters), derivative, stability: rgStability(derivative), source: "analytic" };
  });
}

export function findRGFixedPoints(model, parameters = {}, {
  gMin = 0, gMax = 4, samples = 512, tolerance = 1e-9,
} = {}) {
  const lo = Number(gMin), hi = Number(gMax);
  const count = Math.max(16, Math.min(4096, Math.trunc(Number(samples))));
  const tol = Math.max(1e-14, Math.abs(Number(tolerance)) || 1e-9);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || !(hi > lo)) return [];
  const roots = [];
  const add = (value) => {
    if (!Number.isFinite(value) || value < lo - tol || value > hi + tol) return;
    if (!roots.some((root) => Math.abs(root - value) <= Math.max(tol * 10, 1e-7))) roots.push(value);
  };
  let left = lo, fLeft = rgBeta(model, left, parameters);
  if (Number.isFinite(fLeft) && Math.abs(fLeft) <= tol) add(left);
  for (let index = 1; index <= count; index++) {
    const right = lo + ((hi - lo) * index) / count;
    const fRight = rgBeta(model, right, parameters);
    if (Number.isFinite(fRight) && Math.abs(fRight) <= tol) add(right);
    if (Number.isFinite(fLeft) && Number.isFinite(fRight) && fLeft * fRight < 0) {
      let a0 = left, b0 = right, fa = fLeft;
      for (let iteration = 0; iteration < 80 && b0 - a0 > tol; iteration++) {
        const middle = (a0 + b0) / 2;
        const fm = rgBeta(model, middle, parameters);
        if (!Number.isFinite(fm)) break;
        if (Math.abs(fm) <= tol) { a0 = middle; b0 = middle; break; }
        if (fa * fm <= 0) b0 = middle;
        else { a0 = middle; fa = fm; }
      }
      add((a0 + b0) / 2);
    }
    left = right; fLeft = fRight;
  }
  return roots.sort((x, y) => x - y).map((g) => {
    const derivative = rgBetaDerivative(model, g, parameters);
    return { g, beta: rgBeta(model, g, parameters), derivative, stability: rgStability(derivative), source: "numeric", tolerance: tol };
  });
}

export function rgOneLoopRunning(model, g0, deltaLogMu, { nf = 1 } = {}) {
  const coupling = Number(g0), t = Number(deltaLogMu), flavors = Number(nf);
  if (!(coupling >= 0) || !Number.isFinite(coupling) || !Number.isFinite(t) ||
      !Number.isFinite(flavors) || flavors < 0 || !["qed", "qcd"].includes(model)) {
    return { g: NaN, alpha: NaN, denominator: NaN, status: "invalid", poleDelta: NaN };
  }
  const coefficient = model === "qed"
    ? flavors / (6 * Math.PI ** 2)
    : -qcdB0(flavors) / (8 * Math.PI ** 2);
  const denominator = 1 - coefficient * coupling * coupling * t;
  const poleDelta = coefficient > 0 && coupling > 0 ? 1 / (coefficient * coupling * coupling) : Infinity;
  if (!(denominator > 0) || !Number.isFinite(denominator)) {
    return { g: NaN, alpha: NaN, denominator, status: "pole", poleDelta };
  }
  const g = coupling / Math.sqrt(denominator);
  const alpha = (g * g) / (4 * Math.PI);
  let status = "perturbative";
  if (alpha >= 1) status = model === "qcd" ? "strong-coupling" : "perturbative-limit";
  return { g, alpha, denominator, status, poleDelta };
}

export function integrateRGFlow({
  model, g0, t0 = 0, tMin = -8, tMax = 8, step = 0.02,
  gLimit = Math.sqrt(4 * Math.PI), maxSteps = 20000, parameters = {},
} = {}) {
  const startG = Number(g0), startT = Number(t0), minT = Number(tMin), maxT = Number(tMax);
  const hMax = Math.abs(Number(step)), limit = Math.abs(Number(gLimit));
  const iterationLimit = Math.max(1, Math.trunc(Number(maxSteps)));
  const invalid = !Number.isFinite(startG) || startG < 0 || !Number.isFinite(startT) ||
    !Number.isFinite(minT) || !Number.isFinite(maxT) || !(minT <= startT && startT <= maxT) ||
    !(hMax > 0) || !(limit > 0) || !Number.isFinite(rgBeta(model, startG, parameters));
  const diagnostics = {
    method: "fixed-step-rk4", step: hMax, tolerance: 1e-10, gLimit: limit, maxSteps: iterationLimit,
  };
  if (invalid) {
    return {
      points: [], infrared: { status: "invalid", reached: startT }, ultraviolet: { status: "invalid", reached: startT },
      status: "invalid", ...diagnostics,
    };
  }
  const boundaryStatus = () => model === "qcd" ? "strong-coupling" :
    model === "qed" ? "perturbative-limit" : "coupling-boundary";
  const advance = (target) => {
    const direction = target >= startT ? 1 : -1;
    const points = [{ t: startT, g: startG, beta: rgBeta(model, startG, parameters) }];
    let t = startT, g = startG, status = "range-complete", iterations = 0;
    while (Math.abs(target - t) > 1e-12 && iterations < iterationLimit) {
      const h = direction * Math.min(hMax, Math.abs(target - t));
      const k1 = rgBeta(model, g, parameters);
      const k2 = rgBeta(model, g + (h * k1) / 2, parameters);
      const k3 = rgBeta(model, g + (h * k2) / 2, parameters);
      const k4 = rgBeta(model, g + h * k3, parameters);
      const next = g + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      if (![k1, k2, k3, k4, next].every(Number.isFinite)) {
        status = "divergent"; break;
      }
      if (Math.abs(next) > limit) {
        const fraction = Math.max(0, Math.min(1, (limit - Math.abs(g)) / Math.max(1e-15, Math.abs(next) - Math.abs(g))));
        const boundaryT = t + h * fraction;
        const boundaryG = Math.sign(next || g || 1) * limit;
        points.push({ t: boundaryT, g: boundaryG, beta: rgBeta(model, boundaryG, parameters), boundary: true });
        t = boundaryT; g = boundaryG; status = boundaryStatus(); break;
      }
      t += h; g = next; iterations += 1;
      points.push({ t, g, beta: rgBeta(model, g, parameters) });
    }
    if (iterations >= iterationLimit && Math.abs(target - t) > 1e-12) status = "iteration-limit";
    return { points, status, reached: t, coupling: g, iterations, terminated: status !== "range-complete" };
  };
  const infrared = advance(minT);
  const ultraviolet = advance(maxT);
  const points = infrared.points.slice(1).reverse().concat(ultraviolet.points);
  const status = infrared.terminated || ultraviolet.terminated ? "bounded-termination" : "range-complete";
  return { points, infrared, ultraviolet, status, ...diagnostics };
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
  const freqTrack = new Float32Array(n);
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
      freqTrack[i] = f;
    } else if (t >= mergerAt) {
      const tr = t - mergerAt;
      h = Math.exp(-tr / ringdownTau) * Math.cos(phase + 2 * Math.PI * ringdownFreq * tr);
      freqTrack[i] = ringdownFreq;
    }
    samples[i] = h + noiseRms * gauss();
  }
  return { samples, freqTrack, sampleRate, duration, mergerIndex, chirpMass: mc, model: "leading-order-quadrupole+ringdown" };
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

/* ---------- QFT 2→2 kinematics and leading-order observables ----------
   Natural units (ħ = c = 1). Energies in GeV, cross-sections in nb.
   Every form below is a textbook leading-order result; the reference is
   named in the comment so the displayed number can be checked by hand. */

const ALPHA_EM = 1 / 137.035999084;   // CODATA fine-structure constant
const GEV2_TO_NB = 0.3893793721e6;   // 1 GeV⁻² = 3.8938e5 nb
const M_ELECTRON = 0.51099895e-3;    // GeV
export const M_Z = 91.1876;          // GeV (PDG Z⁰ mass)
export const GAMMA_Z = 2.4952;       // GeV (PDG Z⁰ total width)

/* Mandelstam variables for a 2→2 process in the centre-of-mass frame.
   s = (p₁+p₂)², t = (p₁−p₃)², u = (p₁−p₄)², with particle 3 emitted at
   polar angle θ from the beam axis. The kinematic identity
   s + t + u = m₁² + m₂² + m₃² + m₄²  holds exactly and is returned as
   `residual` so callers can display the numerical check. */
export function mandelstamKinematics({ sqrtS, cosTheta = 0, masses = [0, 0, 0, 0] }) {
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
}

/* Klein–Nishina differential cross-section for γe⁻ → γe⁻, normalised to
   the prefactor α²/2mₑ² so the returned value is a pure shape.
   x = E_γ / (mₑc²) in the electron rest frame, E'/E = 1/(1+x(1−cosθ)).
   As x → 0 this reduces to the Thomson form 1 + cos²θ. */
export function kleinNishina({ cosTheta = 0, x = 0.1 }) {
  const ratio = 1 / (1 + x * (1 - cosTheta));
  const sin2 = 1 - cosTheta * cosTheta;
  return ratio * ratio * (ratio + 1 / ratio - sin2);
}

/* Angular shape of the leading-order differential cross-section.
   - "s-channel": e⁺e⁻ → μ⁺μ⁻ with massless fermions, dσ/dΩ ∝ 1 + cos²θ.
   - "t-channel": leading t-channel pole (Mott/Rutherford), ∝ 1/sin⁴(θ/2).
     This is the dominant small-angle behaviour, not the full Møller or
     Bhabha amplitude, which also carries s- and u-channel terms.
   - "compton": Klein–Nishina, see kleinNishina(). */
export function angularDistribution({ process = "s-channel", cosTheta = 0, photonX = 0.1 }) {
  const c = Math.max(-1, Math.min(1, cosTheta));
  if (process === "s-channel") return 1 + c * c;
  if (process === "t-channel") {
    const half = Math.sin(Math.acos(c) / 2);
    const s2 = half * half;
    return 1 / Math.max(1e-8, s2 * s2);
  }
  if (process === "compton") return kleinNishina({ cosTheta: c, x: photonX });
  return 0;
}

/* Breit–Wigner resonance shape, normalised to 1 at √s = mass.
   σ ∝ m²Γ² / [(s − m²)² + m²Γ²]. */
export function breitWignerResonance({ sqrtS = M_Z, mass = M_Z, width = GAMMA_Z }) {
  const s = sqrtS * sqrtS;
  const m2 = mass * mass;
  const denom = (s - m2) * (s - m2) + m2 * width * width;
  return (m2 * width * width) / denom;
}

/* Total cross-section for the massless s-channel benchmark
   e⁺e⁻ → μ⁺μ⁻: σ = 4πα²/(3s), returned in nb. */
export function qftTotalCrossSection({ sqrtS = 10 }) {
  const s = sqrtS * sqrtS;
  return ((4 * Math.PI * ALPHA_EM * ALPHA_EM) / (3 * s)) * GEV2_TO_NB;
}

export const QFT_CONSTANTS = { ALPHA_EM, GEV2_TO_NB, M_ELECTRON, M_Z, GAMMA_Z };
