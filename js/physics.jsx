// Browser bridge for the pure calculations in js/physics.mjs.
function qcdB0(nf) {
  const flavors = Number(nf);
  return Number.isFinite(flavors) && flavors >= 0 ? 11 - (2 * flavors) / 3 : NaN;
}
function rgBeta(model, coupling, { nf = 1, a = 1, b = 1, gStar = 1 } = {}) {
  const g = Number(coupling), flavors = Number(nf), aa = Number(a), bb = Number(b), fixed = Number(gStar);
  if (!Number.isFinite(g)) return NaN;
  if (model === "qed") return Number.isFinite(flavors) && flavors >= 0 ? (flavors * g ** 3) / (12 * Math.PI ** 2) : NaN;
  if (model === "qcd") {
    const coefficient = qcdB0(flavors);
    return Number.isFinite(coefficient) ? -(coefficient * g ** 3) / (16 * Math.PI ** 2) : NaN;
  }
  if (model === "gaussian") return Number.isFinite(aa) ? -aa * g : NaN;
  if (model === "linear") return Number.isFinite(aa) && Number.isFinite(fixed) ? aa * (g - fixed) : NaN;
  if (model === "asymptotic-safety") return Number.isFinite(aa) && Number.isFinite(bb) ? aa * g - bb * g ** 3 : NaN;
  return NaN;
}
function rgBetaDerivative(model, coupling, { nf = 1, a = 1, b = 1 } = {}) {
  const g = Number(coupling), flavors = Number(nf), aa = Number(a), bb = Number(b);
  if (!Number.isFinite(g)) return NaN;
  if (model === "qed") return Number.isFinite(flavors) && flavors >= 0 ? (flavors * g * g) / (4 * Math.PI ** 2) : NaN;
  if (model === "qcd") {
    const coefficient = qcdB0(flavors);
    return Number.isFinite(coefficient) ? -(3 * coefficient * g * g) / (16 * Math.PI ** 2) : NaN;
  }
  if (model === "gaussian" || model === "linear") return Number.isFinite(aa) ? (model === "gaussian" ? -aa : aa) : NaN;
  if (model === "asymptotic-safety") return Number.isFinite(aa) && Number.isFinite(bb) ? aa - 3 * bb * g * g : NaN;
  return NaN;
}
function rgStability(derivative, tolerance = 1e-9) {
  const slope = Number(derivative);
  if (!Number.isFinite(slope)) return "invalid";
  if (slope < -Math.abs(tolerance)) return "UV-attractive";
  if (slope > Math.abs(tolerance)) return "IR-attractive";
  return "marginal";
}
function rgFixedPoints(model, parameters = {}) {
  const { a = 1, b = 1, gStar = 1 } = parameters;
  let roots = [];
  if (model === "qed" || model === "qcd" || model === "gaussian") roots = [0];
  else if (model === "linear" && Number.isFinite(Number(gStar))) roots = [Number(gStar)];
  else if (model === "asymptotic-safety" && Number(a) >= 0 && Number(b) > 0) roots = [0, Math.sqrt(Number(a) / Number(b))];
  return roots.map((g) => {
    const derivative = rgBetaDerivative(model, g, parameters);
    return { g, beta: rgBeta(model, g, parameters), derivative, stability: rgStability(derivative), source: "analytic" };
  });
}
function findRGFixedPoints(model, parameters = {}, { gMin = 0, gMax = 4, samples = 512, tolerance = 1e-9 } = {}) {
  const lo = Number(gMin), hi = Number(gMax), count = Math.max(16, Math.min(4096, Math.trunc(Number(samples))));
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
        const middle = (a0 + b0) / 2, fm = rgBeta(model, middle, parameters);
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
function rgOneLoopRunning(model, g0, deltaLogMu, { nf = 1 } = {}) {
  const coupling = Number(g0), t = Number(deltaLogMu), flavors = Number(nf);
  if (!(coupling >= 0) || !Number.isFinite(coupling) || !Number.isFinite(t) ||
      !Number.isFinite(flavors) || flavors < 0 || !["qed", "qcd"].includes(model)) {
    return { g: NaN, alpha: NaN, denominator: NaN, status: "invalid", poleDelta: NaN };
  }
  const coefficient = model === "qed" ? flavors / (6 * Math.PI ** 2) : -qcdB0(flavors) / (8 * Math.PI ** 2);
  const denominator = 1 - coefficient * coupling * coupling * t;
  const poleDelta = coefficient > 0 && coupling > 0 ? 1 / (coefficient * coupling * coupling) : Infinity;
  if (!(denominator > 0) || !Number.isFinite(denominator)) {
    return { g: NaN, alpha: NaN, denominator, status: "pole", poleDelta };
  }
  const g = coupling / Math.sqrt(denominator), alpha = (g * g) / (4 * Math.PI);
  const status = alpha >= 1 ? (model === "qcd" ? "strong-coupling" : "perturbative-limit") : "perturbative";
  return { g, alpha, denominator, status, poleDelta };
}
function integrateRGFlow({
  model, g0, t0 = 0, tMin = -8, tMax = 8, step = 0.02,
  gLimit = Math.sqrt(4 * Math.PI), maxSteps = 20000, parameters = {},
} = {}) {
  const startG = Number(g0), startT = Number(t0), minT = Number(tMin), maxT = Number(tMax);
  const hMax = Math.abs(Number(step)), limit = Math.abs(Number(gLimit)), iterationLimit = Math.max(1, Math.trunc(Number(maxSteps)));
  const invalid = !Number.isFinite(startG) || startG < 0 || !Number.isFinite(startT) ||
    !Number.isFinite(minT) || !Number.isFinite(maxT) || !(minT <= startT && startT <= maxT) ||
    !(hMax > 0) || !(limit > 0) || !Number.isFinite(rgBeta(model, startG, parameters));
  const diagnostics = { method: "fixed-step-rk4", step: hMax, tolerance: 1e-10, gLimit: limit, maxSteps: iterationLimit };
  if (invalid) {
    return { points: [], infrared: { status: "invalid", reached: startT }, ultraviolet: { status: "invalid", reached: startT },
      status: "invalid", ...diagnostics };
  }
  const boundaryStatus = () => model === "qcd" ? "strong-coupling" : model === "qed" ? "perturbative-limit" : "coupling-boundary";
  const advance = (target) => {
    const direction = target >= startT ? 1 : -1;
    const points = [{ t: startT, g: startG, beta: rgBeta(model, startG, parameters) }];
    let t = startT, g = startG, status = "range-complete", iterations = 0;
    while (Math.abs(target - t) > 1e-12 && iterations < iterationLimit) {
      const h = direction * Math.min(hMax, Math.abs(target - t));
      const k1 = rgBeta(model, g, parameters), k2 = rgBeta(model, g + (h * k1) / 2, parameters);
      const k3 = rgBeta(model, g + (h * k2) / 2, parameters), k4 = rgBeta(model, g + h * k3, parameters);
      const next = g + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      if (![k1, k2, k3, k4, next].every(Number.isFinite)) { status = "divergent"; break; }
      if (Math.abs(next) > limit) {
        const fraction = Math.max(0, Math.min(1, (limit - Math.abs(g)) / Math.max(1e-15, Math.abs(next) - Math.abs(g))));
        const boundaryT = t + h * fraction, boundaryG = Math.sign(next || g || 1) * limit;
        points.push({ t: boundaryT, g: boundaryG, beta: rgBeta(model, boundaryG, parameters), boundary: true });
        t = boundaryT; g = boundaryG; status = boundaryStatus(); break;
      }
      t += h; g = next; iterations += 1;
      points.push({ t, g, beta: rgBeta(model, g, parameters) });
    }
    if (iterations >= iterationLimit && Math.abs(target - t) > 1e-12) status = "iteration-limit";
    return { points, status, reached: t, coupling: g, iterations, terminated: status !== "range-complete" };
  };
  const infrared = advance(minT), ultraviolet = advance(maxT);
  const points = infrared.points.slice(1).reverse().concat(ultraviolet.points);
  return { points, infrared, ultraviolet,
    status: infrared.terminated || ultraviolet.terminated ? "bounded-termination" : "range-complete", ...diagnostics };
}
const QGA_PHYSICS = {
  qcdB0, rgBeta, rgBetaDerivative, rgStability, rgFixedPoints, findRGFixedPoints,
  rgOneLoopRunning, integrateRGFlow,
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
  safeBeta(value, fallback = 0.2, { min = -0.999, max = 0.999 } = {}) {
    const beta = Number(value);
    if (!Number.isFinite(beta) || Math.abs(beta) >= 1) {
      return Number.isFinite(fallback) ? Math.min(max, Math.max(min, Number(fallback))) : 0;
    }
    return Math.min(max, Math.max(min, beta));
  },
  clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  },
  sanitizeCausalState(input = {}, defaults = {}) {
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
  },
  lorentzGamma(beta) {
    const b = this.safeBeta(beta, 0);
    return 1 / Math.sqrt(Math.max(1e-12, 1 - b * b));
  },
  invariantInterval(deltaCt, deltaX, { c = 1 } = {}) {
    const dct = Number(deltaCt); const dx = Number(deltaX);
    if (!Number.isFinite(dct) || !Number.isFinite(dx) || !(Number(c) > 0)) return NaN;
    return -(dct * dct) + dx * dx;
  },
  classifySeparation(deltaCt, deltaX, { c = 1 } = {}) {
    const ds2 = this.invariantInterval(deltaCt, deltaX, { c });
    if (!Number.isFinite(ds2)) return { type: "invalid", ds2: NaN, deltaCt: Number(deltaCt), deltaX: Number(deltaX) };
    if (ds2 < 0) return { type: "timelike", ds2, deltaCt: Number(deltaCt), deltaX: Number(deltaX) };
    if (Math.abs(ds2) < 1e-12) return { type: "null", ds2: 0, deltaCt: Number(deltaCt), deltaX: Number(deltaX) };
    return { type: "spacelike", ds2, deltaCt: Number(deltaCt), deltaX: Number(deltaX) };
  },
  properTime(deltaCt, deltaX, { c = 1 } = {}) {
    const ds2 = this.invariantInterval(deltaCt, deltaX, { c });
    const cs = Number(c);
    if (!Number.isFinite(ds2) || ds2 >= 0 || !(cs > 0)) return NaN;
    return Math.sqrt(-ds2) / cs;
  },
  lorentzTransform({ deltaCt, deltaX, beta, c = 1 } = {}) {
    const b = this.safeBeta(beta, 0);
    const dct = Number(deltaCt); const dx = Number(deltaX);
    if (!Number.isFinite(dct) || !Number.isFinite(dx) || !(Number(c) > 0)) {
      return { deltaCtPrime: NaN, deltaXPrime: NaN, gamma: this.lorentzGamma(b), beta: b };
    }
    const gamma = this.lorentzGamma(b);
    const ctPrime = gamma * (dct - b * dx);
    const xPrime = gamma * (dx - b * dct);
    return { deltaCtPrime: ctPrime, deltaXPrime: xPrime, gamma, beta: b };
  },
  simultaneityFrameBeta(deltaCt, deltaX) {
    const dt = Number(deltaCt); const dx = Number(deltaX);
    if (!Number.isFinite(dt) || !Number.isFinite(dx) || Math.abs(dx) < 1e-12) return NaN;
    const beta = dt / dx;
    return Math.abs(beta) < 1 ? beta : NaN;
  },
  transformPair({ a, b, beta, c = 1 } = {}) {
    const left = { deltaCt: Number(b.ct) - Number(a.ct), deltaX: Number(b.x) - Number(a.x) };
    const transformed = this.lorentzTransform({ ...left, beta, c });
    const interval = this.classifySeparation(left.deltaCt, left.deltaX, { c });
    return { a, b, left, transformed, interval, gamma: transformed.gamma };
  },
  piecewiseProperTime(points, { c = 1 } = {}) {
    if (!Array.isArray(points) || points.length < 2) return NaN;
    let total = 0;
    for (let index = 1; index < points.length; index++) {
      const previous = points[index - 1];
      const current = points[index];
      const segment = this.properTime(
        Number(current?.ct) - Number(previous?.ct),
        Number(current?.x) - Number(previous?.x),
        { c },
      );
      if (!Number.isFinite(segment)) return NaN;
      total += segment;
    }
    return total;
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
