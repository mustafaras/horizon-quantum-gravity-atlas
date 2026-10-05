import test from "node:test";
import assert from "node:assert/strict";
import {
  schwarzschildRadius, kerrGeometry, kerrErgosphere, hawkingTemperature,
  blackHoleEntropyAreaUnits, seededRng, qftConservation,
  chirpMass, timeToCoalescence, inspiralFrequency, generatedChirp, stftSpectrogram,
  mandelstamKinematics, kleinNishina, angularDistribution,
  breitWignerResonance, qftTotalCrossSection, M_Z, GAMMA_Z,
  safeBeta, lorentzGamma, invariantInterval, classifySeparation,
  properTime, lorentzTransform, simultaneityFrameBeta, sanitizeCausalState,
  piecewiseProperTime,
  qcdB0, rgBeta, rgBetaDerivative, rgStability, rgFixedPoints,
  findRGFixedPoints, rgOneLoopRunning, integrateRGFlow,
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

test("Kerr horizon pair r± brackets the extremal limit", () => {
  for (const a of [0, 0.3, 0.7, 0.9, 0.998]) {
    const g = kerrGeometry(a);
    // r± = M ± sqrt(M^2 - a^2) in units of GM/c^2
    assert.ok(Math.abs(g.rPlus - (1 + Math.sqrt(1 - a * a))) < 1e-12);
    assert.ok(Math.abs(g.rMinus - (1 - Math.sqrt(1 - a * a))) < 1e-12);
    assert.ok(g.rMinus <= g.rPlus);
    assert.ok(g.rPlus >= 1 && g.rPlus <= 2);
  }
  // the documented clamp is a★ ≤ 0.998, so the extremal limit is approached, not reached
  const nearExtremal = kerrGeometry(0.998);
  assert.ok(Math.abs(nearExtremal.rPlus - (1 + Math.sqrt(1 - 0.998 * 0.998))) < 1e-12);
  assert.ok(nearExtremal.rPlus < 1.07 && nearExtremal.rMinus > 0.93);
  assert.ok(Math.abs(kerrGeometry(5).a - 0.998) < 1e-12);
});

test("Kerr ergosphere reduces to the implemented equatorial value at theta = pi/2", () => {
  for (const a of [0, 0.25, 0.5, 0.75, 0.9, 0.998]) {
    const g = kerrGeometry(a);
    assert.ok(Math.abs(kerrErgosphere(a, Math.PI / 2) - g.rErgoEquator) < 1e-12);
    // on the polar axis the ergosurface meets the horizon
    assert.ok(Math.abs(kerrErgosphere(a, 0) - g.rPlus) < 1e-12);
    // and it is monotone between the two
    assert.ok(kerrErgosphere(a, Math.PI / 4) >= g.rPlus - 1e-12);
    assert.ok(kerrErgosphere(a, Math.PI / 4) <= g.rErgoEquator + 1e-12);
  }
  assert.equal(kerrErgosphere(0, 0.3), 2);
});

test("Kerr ISCO closed form matches the Z1/Z2 intermediates it exposes", () => {
  for (const a of [0, 0.4, 0.8, 0.95]) {
    const g = kerrGeometry(a);
    const root = Math.sqrt(Math.max(0, (3 - g.z1) * (3 + g.z1 + 2 * g.z2)));
    assert.ok(Math.abs(g.rIsco - (3 + g.z2 - root)) < 1e-12);
    assert.ok(Math.abs(g.rIscoRetrograde - (3 + g.z2 + root)) < 1e-12);
  }
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

/* ---------- Stage 3: QFT 2→2 kinematics and leading-order observables ---------- */

test("Mandelstam identity s + t + u = Σmᵢ² holds for massless and massive legs", () => {
  const massless = mandelstamKinematics({ sqrtS: 10, cosTheta: 0.5, masses: [0, 0, 0, 0] });
  assert.ok(Math.abs(massless.residual) < 1e-9);
  assert.ok(Math.abs(massless.s - 100) < 1e-9);
  // massless limit: t = −s(1−cosθ)/2, u = −s(1+cosθ)/2
  assert.ok(Math.abs(massless.t - (-100 * (1 - 0.5) / 2)) < 1e-9);
  assert.ok(Math.abs(massless.u - (-100 * (1 + 0.5) / 2)) < 1e-9);

  const massive = mandelstamKinematics({
    sqrtS: 10, cosTheta: 0.5, masses: [0.51099895e-3, 0.51099895e-3, 0.10566, 0.10566],
  });
  assert.ok(Math.abs(massive.residual) < 1e-9);
  assert.ok(Math.abs(massive.sum - (2 * 0.51099895e-3 ** 2 + 2 * 0.10566 ** 2)) < 1e-15);
});

test("Mandelstam t and u are symmetric about cosθ = 0 in the massless limit", () => {
  const fwd = mandelstamKinematics({ sqrtS: 20, cosTheta: 0.8, masses: [0, 0, 0, 0] });
  const bwd = mandelstamKinematics({ sqrtS: 20, cosTheta: -0.8, masses: [0, 0, 0, 0] });
  assert.ok(Math.abs(fwd.t - bwd.u) < 1e-9);
  assert.ok(Math.abs(fwd.u - bwd.t) < 1e-9);
  const head = mandelstamKinematics({ sqrtS: 20, cosTheta: 0, masses: [0, 0, 0, 0] });
  assert.ok(Math.abs(head.t - head.u) < 1e-9);
});

test("s-channel angular distribution is 1 + cos²θ: symmetric, 2:1 forward-to-side ratio", () => {
  const at = (c) => angularDistribution({ process: "s-channel", cosTheta: c });
  assert.ok(Math.abs(at(0) - 1) < 1e-12);
  assert.ok(Math.abs(at(1) - 2) < 1e-12);
  assert.ok(Math.abs(at(-1) - 2) < 1e-12);
  assert.ok(Math.abs(at(0.5) - at(-0.5)) < 1e-12);
  assert.ok(Math.abs(at(1) / at(0) - 2) < 1e-12);
});

test("t-channel leading pole diverges forward and is finite at back-scattering", () => {
  const fwd = angularDistribution({ process: "t-channel", cosTheta: 0.999999 });
  const back = angularDistribution({ process: "t-channel", cosTheta: -1 });
  assert.ok(fwd > 1e6);
  assert.ok(Math.abs(back - 1) < 1e-9); // sin⁴(π/2) = 1
  assert.ok(angularDistribution({ process: "t-channel", cosTheta: 0.9 }) >
            angularDistribution({ process: "t-channel", cosTheta: 0.5 }));
});

test("Klein–Nishina reduces to the Thomson form 1 + cos²θ as x → 0", () => {
  for (const c of [-1, -0.4, 0, 0.3, 1]) {
    const kn = kleinNishina({ cosTheta: c, x: 1e-9 });
    assert.ok(Math.abs(kn - (1 + c * c)) < 1e-6, `cosθ=${c} gave ${kn}`);
  }
  // forward scattering is unshifted at any x: E'/E = 1 when cosθ = 1
  assert.ok(Math.abs(kleinNishina({ cosTheta: 1, x: 5 }) - 2) < 1e-12);
  // high-energy back-scattering is strongly suppressed relative to forward
  const fwd = kleinNishina({ cosTheta: 1, x: 5 });
  const bwd = kleinNishina({ cosTheta: -1, x: 5 });
  assert.ok(bwd < fwd / 20, `back/forward = ${bwd / fwd}`);
  // analytic check at cosθ = −1: ratio = 1/(1+2x), shape = ratio²(ratio + 1/ratio)
  const r = 1 / 11;
  assert.ok(Math.abs(bwd - r * r * (r + 1 / r)) < 1e-12);
});

test("Breit–Wigner peaks at √s = m and falls off symmetrically", () => {
  assert.ok(Math.abs(breitWignerResonance({ sqrtS: M_Z }) - 1) < 1e-12);
  // the shape is symmetric in s = √s², not in √s itself
  const delta = 25;
  const below = breitWignerResonance({ sqrtS: Math.sqrt(M_Z * M_Z - delta) });
  const above = breitWignerResonance({ sqrtS: Math.sqrt(M_Z * M_Z + delta) });
  assert.ok(Math.abs(below - above) < 1e-12);
  assert.ok(below < 1);
  assert.ok(breitWignerResonance({ sqrtS: M_Z + 40 }) < 1e-3);
  // half-maximum sits at |√s − m| ≈ Γ/2 for Γ ≪ m
  const half = breitWignerResonance({ sqrtS: M_Z + GAMMA_Z / 2 });
  assert.ok(Math.abs(half - 0.5) < 0.01, `half-max was ${half}`);
});

test("s-channel total cross-section follows 4πα²/(3s) and matches the 0.87 nb benchmark", () => {
  const s10 = qftTotalCrossSection({ sqrtS: 10 });
  assert.ok(Math.abs(s10 - 0.8685) < 0.001, `σ(10 GeV) = ${s10} nb`);
  const s20 = qftTotalCrossSection({ sqrtS: 20 });
  assert.ok(Math.abs(s10 / s20 - 4) < 1e-9); // 1/s scaling
  const analytic = (4 * Math.PI * (1 / 137.035999084) ** 2) / (3 * 100) * 0.3893793721e6;
  assert.ok(Math.abs(s10 - analytic) < 1e-12);
});

// ---------- Causal structure and Lorentz invariants ----------

test("invariant interval is Lorentz-invariant under a valid boost", () => {
  const before = invariantInterval(2, 1);
  const boosted = lorentzTransform({ deltaCt: 2, deltaX: 1, beta: 0.4 });
  const after = invariantInterval(boosted.deltaCtPrime, boosted.deltaXPrime);
  assert.ok(Math.abs(before - after) < 1e-12, `before=${before}, after=${after}`);
  assert.ok(Math.abs(invariantInterval(0, 0)) < 1e-12);
});

test("gamma tends to the correct limiting values at beta = 0 and subluminal beta", () => {
  assert.equal(lorentzGamma(0), 1);
  assert.ok(Math.abs(lorentzGamma(0.5) - 1.1547005383792517) < 1e-12);
  assert.ok(Math.abs(lorentzGamma(-0.8) - 1.6666666666666667) < 1e-12);
  assert.ok(Number.isFinite(lorentzGamma(0.99)));
});

test("null intervals remain null under valid Lorentz transforms", () => {
  const pair = { deltaCt: 3, deltaX: 3 };
  const transformed = lorentzTransform({ ...pair, beta: 0.6 });
  assert.ok(Math.abs(invariantInterval(pair.deltaCt, pair.deltaX)) < 1e-12);
  assert.ok(Math.abs(invariantInterval(transformed.deltaCtPrime, transformed.deltaXPrime)) < 1e-9);
  assert.equal(classifySeparation(pair.deltaCt, pair.deltaX).type, "null");
  assert.equal(classifySeparation(transformed.deltaCtPrime, transformed.deltaXPrime).type, "null");
});

test("timelike event ordering is preserved in a standard valid frame", () => {
  const pair = { deltaCt: 2.5, deltaX: 1.0 };
  const boosted = lorentzTransform({ ...pair, beta: 0.6 });
  assert.equal(classifySeparation(pair.deltaCt, pair.deltaX).type, "timelike");
  assert.equal(classifySeparation(boosted.deltaCtPrime, boosted.deltaXPrime).type, "timelike");
  assert.ok(boosted.deltaCtPrime > 0);
  assert.ok(Math.abs(boosted.deltaCtPrime) > Math.abs(boosted.deltaXPrime));
});

test("spacelike pairs can reverse order and admit a simultaneity frame", () => {
  const pair = { deltaCt: 0.2, deltaX: 1.0 };
  const beta = simultaneityFrameBeta(pair.deltaCt, pair.deltaX);
  assert.ok(Math.abs(beta - 0.2) < 1e-12); // Δct/Δx = 0.2
  const simultaneous = lorentzTransform({ ...pair, beta });
  assert.ok(Math.abs(simultaneous.deltaCtPrime) < 1e-12, `simultaneous ct' = ${simultaneous.deltaCtPrime}`);
  assert.ok(classifySeparation(pair.deltaCt, pair.deltaX).type === "spacelike");

  const reversed = lorentzTransform({ ...pair, beta: 0.75 });
  assert.ok(reversed.deltaCtPrime < 0, `reversed Δct' = ${reversed.deltaCtPrime}`);
  assert.equal(classifySeparation(reversed.deltaCtPrime, reversed.deltaXPrime).type, "spacelike");
});

test("proper time and the c = 1 convention are handled consistently", () => {
  const pair = { deltaCt: 3, deltaX: 1 };
  const ds2 = invariantInterval(pair.deltaCt, pair.deltaX, { c: 1 });
  assert.ok(Math.abs(ds2 - (-8)) < 1e-12);
  assert.ok(Math.abs(properTime(pair.deltaCt, pair.deltaX, { c: 1 }) - Math.sqrt(8)) < 1e-12);
  assert.ok(Number.isNaN(properTime(0, 0, { c: 1 })));
  assert.ok(Math.abs(properTime(3, 1, { c: 2 }) - Math.sqrt(8) / 2) < 1e-12);
});

test("safeBeta and invalid event values reject out-of-range input cleanly", () => {
  assert.equal(safeBeta(2, 0.25), 0.25);
  assert.equal(safeBeta(-2, -0.25), -0.25);
  assert.equal(safeBeta(NaN, 0.3), 0.3);
  assert.equal(safeBeta(0.5), 0.5);
  assert.ok(Number.isNaN(invariantInterval(Number.NaN, 1)));
  assert.equal(classifySeparation(Number.NaN, 1).type, "invalid");
  assert.ok(Number.isNaN(properTime(0.5, 1)));

  const defaults = { beta: 0.35, a: { ct: 0, x: -1.35 }, b: { ct: 2.6, x: 1.1 } };
  assert.deepEqual(sanitizeCausalState({
    beta: 1, a: { ct: 99, x: "bad" }, b: { ct: -4, x: 4 },
  }, defaults), {
    beta: 0.35, a: { ct: 0, x: -1.35 }, b: { ct: -4, x: 4 },
  });
  assert.deepEqual(sanitizeCausalState({
    beta: -0.95, a: { ct: 4, x: -4 }, b: { ct: 0, x: 0 },
  }, defaults), {
    beta: -0.95, a: { ct: 4, x: -4 }, b: { ct: 0, x: 0 },
  });
});

test("piecewise proper time sums only timelike inertial legs", () => {
  const points = [{ ct: -3, x: 0 }, { ct: 0, x: 2.2 }, { ct: 3, x: 0 }];
  const expected = 2 * Math.sqrt(3 ** 2 - 2.2 ** 2);
  assert.ok(Math.abs(piecewiseProperTime(points) - expected) < 1e-12);
  assert.ok(Number.isNaN(piecewiseProperTime([{ ct: 0, x: 0 }, { ct: 1, x: 2 }])));
});

// ---------- Renormalization-group flow landscape ----------

test("QED one-loop running increases toward the ultraviolet and exposes its formal pole", () => {
  const g0 = Math.sqrt(4 * Math.PI / 137.035999084);
  const uv = rgOneLoopRunning("qed", g0, Math.log(1e12), { nf: 1 });
  const ir = rgOneLoopRunning("qed", g0, -Math.log(1e6), { nf: 1 });
  assert.equal(uv.status, "perturbative");
  assert.ok(uv.g > g0);
  assert.ok(ir.g < g0);
  assert.ok(Number.isFinite(uv.poleDelta) && uv.poleDelta > Math.log(1e12));
  const pole = rgOneLoopRunning("qed", g0, uv.poleDelta * 1.001, { nf: 1 });
  assert.equal(pole.status, "pole");
  assert.ok(Number.isNaN(pole.g));
});

test("QCD one-loop running is asymptotically free for physical nf", () => {
  const g0 = Math.sqrt(4 * Math.PI * 0.118);
  const uv = rgOneLoopRunning("qcd", g0, Math.log(1e5), { nf: 5 });
  const ir = rgOneLoopRunning("qcd", g0, -1, { nf: 5 });
  assert.ok(uv.g < g0);
  assert.ok(ir.g > g0);
  assert.ok(rgBeta("qcd", g0, { nf: 5 }) < 0);
  assert.ok(rgBetaDerivative("qcd", g0, { nf: 5 }) < 0);
});

test("QCD b0 changes sign at nf = 16.5", () => {
  assert.ok(qcdB0(16) > 0);
  assert.equal(qcdB0(16.5), 0);
  assert.ok(qcdB0(17) < 0);
  assert.ok(Number.isNaN(qcdB0(-1)));
});

test("analytic and numeric fixed points agree with the documented stability convention", () => {
  const uvParameters = { a: -0.8, gStar: 1.25 };
  const analytic = rgFixedPoints("linear", uvParameters)[0];
  const numeric = findRGFixedPoints("linear", uvParameters, { gMin: 0, gMax: 3, tolerance: 1e-10 })[0];
  assert.ok(Math.abs(analytic.g - 1.25) < 1e-12);
  assert.ok(Math.abs(numeric.g - analytic.g) < 1e-8);
  assert.equal(analytic.derivative, -0.8);
  assert.equal(analytic.stability, "UV-attractive");
  assert.equal(rgStability(0.8), "IR-attractive");
  assert.equal(rgStability(0), "marginal");

  const safety = rgFixedPoints("asymptotic-safety", { a: 1, b: 0.25 });
  assert.deepEqual(safety.map((point) => point.g), [0, 2]);
  assert.equal(safety[0].stability, "IR-attractive");
  assert.equal(safety[1].stability, "UV-attractive");
});

test("bounded RK4 integration is deterministic and approximately reversible", () => {
  const options = {
    model: "linear", g0: 2.1, t0: 0, tMin: -1, tMax: 2, step: 0.01,
    parameters: { a: -0.6, gStar: 1 },
  };
  const first = integrateRGFlow(options);
  const second = integrateRGFlow(options);
  assert.deepEqual(first, second);
  assert.equal(first.status, "range-complete");
  assert.equal(first.ultraviolet.status, "range-complete");
  assert.equal(first.infrared.status, "range-complete");
  const uv = first.ultraviolet.points.at(-1);
  const reversed = integrateRGFlow({
    ...options, g0: uv.g, t0: 2, tMin: 0, tMax: 2,
  });
  assert.ok(Math.abs(reversed.infrared.points.at(-1).g - options.g0) < 1e-9);
});

test("integration terminates gracefully at QED and QCD perturbative boundaries", () => {
  const qed = integrateRGFlow({
    model: "qed", g0: 2.8, t0: 0, tMin: 0, tMax: 20, step: 0.01, parameters: { nf: 1 },
  });
  assert.equal(qed.ultraviolet.status, "perturbative-limit");
  assert.equal(qed.ultraviolet.terminated, true);
  assert.ok(qed.ultraviolet.points.every((point) => Number.isFinite(point.t) && Number.isFinite(point.g)));
  assert.ok(qed.ultraviolet.reached < 20);

  const qcd = integrateRGFlow({
    model: "qcd", g0: 1.2, t0: 0, tMin: -20, tMax: 0, step: 0.01, parameters: { nf: 5 },
  });
  assert.equal(qcd.infrared.status, "strong-coupling");
  assert.equal(qcd.infrared.terminated, true);
  assert.ok(qcd.infrared.reached > -20);
  assert.ok(qcd.infrared.points.every((point) => Number.isFinite(point.beta)));
});

test("RG helpers reject invalid models and non-finite inputs without fake success", () => {
  assert.ok(Number.isNaN(rgBeta("unknown", 1)));
  assert.ok(Number.isNaN(rgBeta("qed", NaN)));
  assert.deepEqual(findRGFixedPoints("linear", { a: 1, gStar: 1 }, { gMin: 2, gMax: 1 }), []);
  assert.equal(rgOneLoopRunning("qed", -1, 2).status, "invalid");
  const invalid = integrateRGFlow({ model: "qcd", g0: NaN });
  assert.equal(invalid.status, "invalid");
  assert.equal(invalid.points.length, 0);
  assert.equal(invalid.ultraviolet.status, "invalid");
});
