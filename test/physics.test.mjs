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
  grPerihelionPrecession, grLightDeflection, planckUnits, probeEnergyGeV,
  GR_ENGINE_C2, grEngineGM, grCaptureRadius, grPlungeStep,
  GR_CURVATURE_SCENARIOS, grCurvatureScenario,
  grPhotonSphereRadius, grIscoRadius, grCriticalImpactParameter, grNullStep, grNullDeflection, grNullTrajectory, grEffectivePotential,
  grPetersDerivatives, grLenseThirringDeg,
  blackHoleEvaporationTimeYears, pageCurveEntropy, hawkingSpectralShape,
  clamp, transformPair, QFT_CONSTANTS,
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

/* ---------- Stage 5: GR, Planck units, and black-hole thermodynamics ---------- */

const ARCSEC_PER_RAD = 206264.80624709636;
const GM_SUN = 6.67430e-11 * 1.98847e30;
const C_SQ = 299792458 ** 2;

test("GR perihelion precession reproduces Mercury's 42.98 arcsec per century", () => {
  const a = 5.7909e10; // semi-major axis, metres
  const e = 0.2056; // eccentricity
  const perOrbit = grPerihelionPrecession(GM_SUN, C_SQ, a, e);
  const orbitsPerCentury = 36525 / 87.969; // days per Julian century / period
  const arcsecPerCentury = perOrbit * orbitsPerCentury * ARCSEC_PER_RAD;
  assert.ok(Math.abs(arcsecPerCentury - 42.98) < 0.05);
});

test("GR perihelion precession scales as 1/[a(1−e²)] and vanishes for circular orbits", () => {
  const base = grPerihelionPrecession(1, 1, 2, 0.5);
  assert.ok(Math.abs(grPerihelionPrecession(1, 1, 4, 0.5) - base / 2) < 1e-15);
  assert.ok(Math.abs(grPerihelionPrecession(1, 1, 2, 0) - base * 0.75) < 1e-15);
  assert.equal(grPerihelionPrecession(1, 1, 2, 0), grPerihelionPrecession(1, 1, 2, 0));
});

test("GR light deflection reproduces the 1.75 arcsec solar-limb anchor", () => {
  const deflection = grLightDeflection(GM_SUN, C_SQ, 6.957e8); // impact parameter = R_sun
  const arcsec = deflection * ARCSEC_PER_RAD;
  assert.ok(Math.abs(arcsec - 1.751) < 0.005);
});

test("GR light deflection is twice the Newtonian value and scales as 1/b", () => {
  const gr = grLightDeflection(GM_SUN, C_SQ, 6.957e8);
  const newtonian = 2 * GM_SUN / (C_SQ * 6.957e8); // Newtonian corpuscular prediction
  assert.ok(Math.abs(gr / newtonian - 2) < 1e-12);
  assert.ok(Math.abs(grLightDeflection(GM_SUN, C_SQ, 2 * 6.957e8) - gr / 2) < 1e-20);
});

test("Planck units match CODATA values within 0.1%", () => {
  const planck = planckUnits();
  assert.ok(Math.abs(planck.lengthMeters / 1.616255e-35 - 1) < 1e-3);
  assert.ok(Math.abs(planck.timeSeconds / 5.391247e-44 - 1) < 1e-3);
  assert.ok(Math.abs(planck.massKg / 2.176434e-8 - 1) < 1e-3);
  assert.ok(Math.abs(planck.energyJoules / 1.9561e9 - 1) < 1e-3);
  assert.ok(Math.abs(planck.energyGeV / 1.2209e19 - 1) < 1e-3);
});

test("Planck units satisfy their defining relations t_P = l_P/c and E_P = m_P·c²", () => {
  const planck = planckUnits();
  const C = 299792458;
  assert.ok(Math.abs(planck.timeSeconds - planck.lengthMeters / C) < 1e-55);
  assert.ok(Math.abs(planck.energyJoules - planck.massKg * C * C) < 1e-6);
});

test("Probe energy ħc/l at the Planck length recovers the Planck energy", () => {
  const planck = planckUnits();
  const ratio = probeEnergyGeV(planck.lengthMeters) / planck.energyGeV;
  assert.ok(Math.abs(ratio - 1) < 1e-3); // ħc ≈ 1.973×10⁻¹⁶ GeV·m vs exact CODATA
  assert.ok(Math.abs(probeEnergyGeV(2e-19) / probeEnergyGeV(1e-19) - 0.5) < 1e-12);
});

test("Black-hole evaporation time anchors at 2.1×10⁶⁷ yr and scales as M³", () => {
  assert.equal(blackHoleEvaporationTimeYears(1), 2.1e67);
  assert.equal(blackHoleEvaporationTimeYears(2), 2.1e67 * 8);
  assert.ok(Math.abs(blackHoleEvaporationTimeYears(3) / blackHoleEvaporationTimeYears(1) - 27) < 1e-9);
});

test("Page curve rises, peaks at the Page time, and falls back to zero", () => {
  assert.equal(pageCurveEntropy(0), 0);
  assert.equal(pageCurveEntropy(0.5), 1);
  assert.equal(pageCurveEntropy(1), 0);
  assert.ok(pageCurveEntropy(0.25) > 0 && pageCurveEntropy(0.25) < 1);
  assert.equal(pageCurveEntropy(0.25), pageCurveEntropy(0.75)); // symmetry about the Page time
  assert.ok(pageCurveEntropy(0.4) > pageCurveEntropy(0.3));
});

test("Page curve clamps out-of-range fractions and propagates NaN", () => {
  assert.equal(pageCurveEntropy(-0.5), 0);
  assert.equal(pageCurveEntropy(1.5), 0);
  assert.ok(Number.isNaN(pageCurveEntropy(NaN)));
  assert.ok(Number.isNaN(pageCurveEntropy(Infinity)));
});

test("Hawking spectral shape peaks at the Wien displacement u ≈ 2.8214", () => {
  let peak = 0, peakU = 0;
  for (let i = 0; i <= 100000; i++) {
    const u = (i / 100000) * 10;
    const s = hawkingSpectralShape(u, 1);
    if (s > peak) { peak = s; peakU = u; }
  }
  assert.ok(Math.abs(peakU - 2.8214) < 0.02);
});

test("Hawking spectral shape stays finite in the exponential tail and guards invalid inputs", () => {
  const tail = hawkingSpectralShape(100, 1);
  assert.ok(Number.isFinite(tail) && tail > 0 && tail < 1e-10); // exponent capped at e⁴⁰
  assert.equal(hawkingSpectralShape(0, 1), 0);
  assert.ok(Number.isNaN(hawkingSpectralShape(1, 0)));
  assert.ok(Number.isNaN(hawkingSpectralShape(1, -1)));
  assert.ok(Number.isNaN(hawkingSpectralShape(1, NaN)));
  assert.ok(Number.isNaN(hawkingSpectralShape(-1, 1)));
});

test("Kerr surface gravity falls with spin and keeps the 0.998 Thorne limit physical", () => {
  const schwarzschild = kerrGeometry(0).temperatureFactor;
  assert.ok(Math.abs(schwarzschild - 1) < 1e-12);
  let previous = schwarzschild;
  for (let i = 1; i <= 10; i++) {
    const factor = kerrGeometry(i / 10).temperatureFactor;
    assert.ok(factor < previous);
    previous = factor;
  }
  assert.ok(kerrGeometry(0.998).temperatureFactor < 0.12);
});

test("clamp returns min for non-finite inputs and respects both bounds", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(11, 0, 10), 10);
  assert.equal(clamp(NaN, 0, 10), 0);
  assert.equal(clamp(Infinity, 0, 10), 0);
});

test("transformPair returns the full Lorentz bookkeeping shape", () => {
  const result = transformPair({ a: { ct: 0, x: 0 }, b: { ct: 5, x: 3 }, beta: 0.6, c: 1 });
  assert.ok(result.a.ct === 0 && result.b.x === 3);
  assert.ok(result.left !== undefined && result.transformed !== undefined);
  assert.ok(result.interval !== undefined && result.gamma !== undefined);
  assert.ok(Math.abs(result.gamma - 1.25) < 1e-12);
});

test("QFT constants match PDG values", () => {
  assert.equal(QFT_CONSTANTS.M_Z, 91.1876);
  assert.equal(QFT_CONSTANTS.GAMMA_Z, 2.4952);
  assert.ok(Math.abs(QFT_CONSTANTS.GEV2_TO_NB - 0.3893793721e6) < 1e-3);
  assert.ok(Math.abs(QFT_CONSTANTS.M_ELECTRON - 0.51099895e-3) < 1e-12);
});

/* ---------- curvature-engine scenario core ---------- */

test("capture radius is 3GM/c² (1.5 r_s) with a visibility floor", () => {
  const gm = grEngineGM(10); // 3GM/c² ≈ 0.61 > floor
  assert.ok(Math.abs(grCaptureRadius(gm, GR_ENGINE_C2) - 3 * gm / GR_ENGINE_C2) < 1e-12);
  // small mass → floored at 0.45
  assert.equal(grCaptureRadius(grEngineGM(5), GR_ENGINE_C2), 0.45);
});

test("plunge step conserves angular momentum and falls inward", () => {
  const gm = grEngineGM(7);
  const p = { x: -6.2, y: 1.4, vx: 1.61, vy: -0.12 };
  const L0 = p.x * p.vy - p.y * p.vx;
  let r0 = Math.hypot(p.x, p.y);
  let fell = false;
  for (let i = 0; i < 4000; i++) {
    grPlungeStep(p, gm, GR_ENGINE_C2, 0.005);
    const r = Math.hypot(p.x, p.y);
    if (r < r0 - 1e-9) fell = true;
    r0 = r;
    if (r < grCaptureRadius(gm, GR_ENGINE_C2)) break;
  }
  const L1 = p.x * p.vy - p.y * p.vx;
  assert.ok(Math.abs(L1 - L0) / Math.abs(L0) < 1e-3, "L conserved to <0.1%");
  assert.ok(fell, "radius decreases under attraction");
  assert.ok(Math.hypot(p.x, p.y) < grCaptureRadius(gm, GR_ENGINE_C2), "body reaches the capture zone");
});

test("all curvature scenarios are well-formed", () => {
  const ids = Object.keys(GR_CURVATURE_SCENARIOS);
  assert.ok(ids.length >= 5, "at least five scenario presets");
  for (const id of ids) {
    const s = GR_CURVATURE_SCENARIOS[id];
    assert.ok(s.label && s.mass > 0 && Array.isArray(s.bodies) && s.bodies.length >= 1, id);
    for (const b of s.bodies) {
      if (b.free) {
        for (const k of ["x0", "y0", "vx0", "vy0"]) assert.ok(Number.isFinite(b[k]), `${id}.${k}`);
      } else {
        assert.ok(b.a > 0 && b.e >= 0 && b.e < 1, `${id} orbit a/e valid`);
      }
    }
  }
});

test("2:1 resonance preset has period ratio ≈ 2 (Kepler's third law)", () => {
  const [inner, outer] = GR_CURVATURE_SCENARIOS.resonance.bodies;
  const ratio = Math.pow(outer.a / inner.a, 1.5);
  assert.ok(Math.abs(ratio - 2) < 0.02, `ratio ${ratio}`);
});

test("grCurvatureScenario falls back to classic on unknown id", () => {
  assert.equal(grCurvatureScenario("nope"), GR_CURVATURE_SCENARIOS.classic);
  assert.equal(grCurvatureScenario("cluster"), GR_CURVATURE_SCENARIOS.cluster);
});

/* ---------- curvature-engine strong-field core ---------- */

test("photon sphere and ISCO sit at 3GM/c² and 6GM/c²", () => {
  const gm = grEngineGM(8);
  assert.ok(Math.abs(grPhotonSphereRadius(gm, GR_ENGINE_C2) - 3 * gm / GR_ENGINE_C2) < 1e-12);
  assert.ok(Math.abs(grIscoRadius(gm, GR_ENGINE_C2) - 2 * grPhotonSphereRadius(gm, GR_ENGINE_C2)) < 1e-12);
});

test("null geodesic reproduces the full 4GM/c²b weak-field deflection", () => {
  const gm = grEngineGM(5);
  const rs = 2 * gm / GR_ENGINE_C2;
  const b = 6;                       // weak field
  const p = { x: -20, y: b, vx: 1, vy: 0 };
  for (let i = 0; i < 60000 && p.x < 20; i++) grNullStep(p, rs, 0.002);
  const deflect = Math.abs(Math.atan2(p.vy, p.vx));
  const expected = 2 * rs / b;       // = 4GM/c²b
  assert.ok(Math.abs(deflect - expected) / expected < 0.1, `deflect ${deflect} vs ${expected}`);
});

test("null geodesic captures rays inside the b_crit = 3√3·GM/c² cone", () => {
  const gm = grEngineGM(9);
  const rs = 2 * gm / GR_ENGINE_C2;
  const bCrit = 3 * Math.sqrt(3) * gm / GR_ENGINE_C2;
  const p = { x: -14, y: 0.9 * bCrit, vx: 1, vy: 0 };
  let minR = Infinity;
  for (let i = 0; i < 40000 && p.x < 14; i++) {
    grNullStep(p, rs, 0.002);
    minR = Math.min(minR, Math.hypot(p.x, p.y));
    if (minR < 1.5 * rs) break;
  }
  assert.ok(minR < 1.5 * rs + 0.05, `captured: minR ${minR} < ${(1.5 * rs).toFixed(3)}`);
  // a wide ray escapes far
  const q = { x: -14, y: 4 * bCrit, vx: 1, vy: 0 };
  let qMin = Infinity;
  for (let i = 0; i < 40000 && q.x < 14; i++) { grNullStep(q, rs, 0.002); qMin = Math.min(qMin, Math.hypot(q.x, q.y)); }
  assert.ok(qMin > 2 * rs, "wide ray escapes");
});

test("grCriticalImpactParameter is √3·r_ph and matches the capture split", () => {
  for (const M of [1, 5, 7, 10]) {
    const gm = grEngineGM(M);
    const rPh = grPhotonSphereRadius(gm, GR_ENGINE_C2);
    const bCrit = grCriticalImpactParameter(gm, GR_ENGINE_C2);
    // b_crit = 3√3·GM/c² and r_ph = 3GM/c², so the ratio is exactly √3.
    assert.ok(Math.abs(bCrit / rPh - Math.sqrt(3)) < 1e-12, `M=${M} ratio ${bCrit / rPh}`);
    // The readout must agree with the integrator's own escape/capture boundary.
    assert.equal(grNullDeflection(0.9 * bCrit, gm, GR_ENGINE_C2).captured, true, `M=${M} inside`);
    assert.equal(grNullDeflection(1.1 * bCrit, gm, GR_ENGINE_C2).captured, false, `M=${M} outside`);
  }
});

test("grNullTrajectory returns the full path and winds near the critical curve", () => {
  const gm = grEngineGM(5);
  const bCrit = grCriticalImpactParameter(gm, GR_ENGINE_C2);

  // A weak-field ray is a near-straight line: half a turn of polar angle.
  const far = grNullTrajectory(4 * bCrit, gm, GR_ENGINE_C2);
  assert.equal(far.captured, false);
  assert.ok(Math.abs(far.windings - 0.5) < 0.12, `far windings ${far.windings}`);
  assert.deepEqual(far.points[0], [-7.6, 4 * bCrit]);

  // The capture boundary is the critical impact parameter, as in grNullDeflection.
  assert.equal(grNullTrajectory(0.9 * bCrit, gm, GR_ENGINE_C2).captured, true);
  assert.equal(grNullTrajectory(1.1 * bCrit, gm, GR_ENGINE_C2).captured, false);

  // Just outside b_crit the ray loops the photon sphere before escaping — the
  // photon-ring effect. This is the whole point of the trajectory helper.
  const near = grNullTrajectory(1.01 * bCrit, gm, GR_ENGINE_C2);
  assert.equal(near.captured, false);
  assert.ok(near.windings > 1, `near-critical windings ${near.windings}`);

  // Winding falls monotonically as the ray is moved away from the critical curve.
  const winds = [1.01, 1.1, 1.6, 2.6].map((f) => grNullTrajectory(f * bCrit, gm, GR_ENGINE_C2).windings);
  for (let i = 1; i < winds.length; i++) assert.ok(winds[i] < winds[i - 1], `winds ${winds}`);

  // The path is finite and continuous: no NaN, no teleporting between samples.
  for (const p of near.points) assert.ok(Number.isFinite(p[0]) && Number.isFinite(p[1]));
  for (let i = 1; i < near.points.length; i++) {
    const step = Math.hypot(near.points[i][0] - near.points[i - 1][0], near.points[i][1] - near.points[i - 1][1]);
    assert.ok(step < 0.05, `step ${step} at ${i}`);
  }
});

test("the 1.1·rs capture test agrees with b_crit at every mass", () => {
  // The ray-fan panel decides a ray is captured when it crosses 1.1·rs but
  // colours it by |b| < b_crit. Those two rules must never disagree: an
  // escaping ray turns at r_t > r_ph = 1.5·rs, so it can never reach 1.1·rs.
  for (const M of [1, 2, 3, 5, 8, 12, 20]) {
    const gm = grEngineGM(M);
    const rs = 2 * gm / GR_ENGINE_C2;
    const bCrit = grCriticalImpactParameter(gm, GR_ENGINE_C2);
    const capRay = 1.1 * rs;
    for (const f of [1.02, 1.1, 1.4, 2.0, 3.0]) {
      const t = grNullTrajectory(f * bCrit, gm, GR_ENGINE_C2, { maxSteps: 200000 });
      assert.equal(t.captured, false, `M=${M} f=${f} should escape`);
      let rMin = Infinity;
      for (const p of t.points) rMin = Math.min(rMin, Math.hypot(p[0], p[1]));
      assert.ok(rMin > capRay, `M=${M} f=${f}: turning point ${rMin} must clear 1.1·rs=${capRay}`);
    }
    // A plunging ray penetrates inside the photon sphere; the helper stops it
    // there, which is still well outside 1.1·rs, so the two rules stay disjoint.
    for (const f of [0.5, 0.9, 0.99]) {
      const t = grNullTrajectory(f * bCrit, gm, GR_ENGINE_C2, { maxSteps: 200000 });
      assert.equal(t.captured, true, `M=${M} f=${f} should be captured`);
      let rMin = Infinity;
      for (const p of t.points) rMin = Math.min(rMin, Math.hypot(p[0], p[1]));
      assert.ok(rMin < 1.5 * rs, `M=${M} f=${f}: plunging ray must enter the photon sphere, got ${rMin}`);
    }
  }
});

test("grNullDeflection reproduces the weak-field 4GM/c²b limit", () => {
  const gm = grEngineGM(5);
  const rs = 2 * gm / GR_ENGINE_C2;
  const b = 6;
  const d = grNullDeflection(b, gm, GR_ENGINE_C2);
  assert.equal(d.captured, false);
  const expected = 2 * rs / b;       // = 4GM/c²b
  assert.ok(Math.abs(d.deflection - expected) / expected < 0.05,
    `deflection ${d.deflection} vs ${expected}`);
});

test("grNullDeflection splits escape from capture exactly at b_crit", () => {
  for (const M of [1, 5, 9]) {
    const gm = grEngineGM(M);
    const bCrit = 3 * Math.sqrt(3) * gm / GR_ENGINE_C2;
    assert.equal(grNullDeflection(0.9 * bCrit, gm, GR_ENGINE_C2).captured, true, `M=${M} inside`);
    const out = grNullDeflection(1.1 * bCrit, gm, GR_ENGINE_C2);
    assert.equal(out.captured, false, `M=${M} outside`);
    // just outside the cone the ray still wraps far past 90° before escaping
    assert.ok(out.deflection > Math.PI / 2, `M=${M} strong-field wrap ${out.deflection}`);
  }
});

test("grNullDeflection reports unwrapped angles past a full half-turn", () => {
  // The lensed-sky renderer maps beta = theta - alpha(theta) back onto the
  // sphere, so a deflection that wraps to [-pi, pi] would fold the sky the
  // wrong way. Just outside the critical curve the true sweep exceeds pi.
  const gm = grEngineGM(5);
  const bCrit = 3 * Math.sqrt(3) * gm / GR_ENGINE_C2;
  const near = grNullDeflection(bCrit * 1.0002, gm, GR_ENGINE_C2, { maxSteps: 400000 });
  assert.equal(near.captured, false);
  assert.ok(near.deflection > Math.PI, `near-critical sweep ${near.deflection} should exceed pi`);
  assert.ok(near.deflection < 4 * Math.PI, `near-critical sweep ${near.deflection} should stay finite`);
  // Far outside the cone the sweep is small and must be unchanged by the fix.
  const far = grNullDeflection(bCrit * 6, gm, GR_ENGINE_C2);
  assert.ok(far.deflection > 0 && far.deflection < Math.PI / 2, `far sweep ${far.deflection}`);
});

test("grNullDeflection is step-converged at the shipped dt", () => {
  const gm = grEngineGM(5);
  for (const b of [1.25, 3.3]) {
    const coarse = grNullDeflection(b, gm, GR_ENGINE_C2, { dt: 0.002 });
    const fine = grNullDeflection(b, gm, GR_ENGINE_C2, { dt: 0.0001 });
    const errDeg = Math.abs(coarse.deflection - fine.deflection) * 180 / Math.PI;
    assert.ok(errDeg < 0.1, `b=${b}: ${errDeg.toFixed(4)}° from converged`);
  }
});

test("grNullDeflection decreases monotonically with impact parameter", () => {
  const gm = grEngineGM(7);
  let prev = Infinity;
  for (const b of [1.0, 1.5, 2.2, 3.3, 5.0]) {
    const d = grNullDeflection(b, gm, GR_ENGINE_C2);
    assert.equal(d.captured, false, `b=${b} should escape`);
    assert.ok(d.deflection < prev, `b=${b}: ${d.deflection} < ${prev}`);
    prev = d.deflection;
  }
});

test("effective potential: GR well is deeper than Newtonian at small r", () => {
  const gm = grEngineGM(6);
  const L = 3;
  for (const r of [1, 2, 4]) {
    const gr = grEffectivePotential(gm, GR_ENGINE_C2, L, r);
    const newt = -gm / r + (L * L) / (2 * r * r);
    assert.ok(gr < newt, `r=${r}: GR ${gr} < Newton ${newt}`);
  }
  // converges to Newton at large r
  const far = grEffectivePotential(gm, GR_ENGINE_C2, L, 500);
  const farN = -gm / 500 + (L * L) / (2 * 500 * 500);
  assert.ok(Math.abs(far - farN) < 1e-4);
});

test("Peters derivatives shrink circular and eccentric orbits", () => {
  const k = 0.25;
  const circ = grPetersDerivatives(3, 0, k);
  assert.ok(circ.da < 0 && circ.de === 0);
  const ecc = grPetersDerivatives(3, 0.5, k);
  assert.ok(ecc.da < 0 && ecc.de < 0);
  // circular decay steepens as a⁻³
  const near = grPetersDerivatives(1.5, 0, k);
  assert.ok(Math.abs(near.da / circ.da - 8) < 0.01);
});

test("Lense–Thirring scales with J and a⁻³, vanishes at J = 0", () => {
  assert.equal(grLenseThirringDeg(0, GR_ENGINE_C2, 3, 0.3), 0);
  const j1 = grLenseThirringDeg(1, GR_ENGINE_C2, 3, 0.3);
  const j2 = grLenseThirringDeg(2, GR_ENGINE_C2, 3, 0.3);
  assert.ok(Math.abs(j2 / j1 - 2) < 1e-12);
  const a2 = grLenseThirringDeg(1, GR_ENGINE_C2, 6, 0.3);
  assert.ok(Math.abs(j1 / a2 - 8) < 1e-9);
  const ecc = grLenseThirringDeg(1, GR_ENGINE_C2, 3, 0.6);
  assert.ok(ecc > j1, "eccentric orbits precess the node faster");
});

test("zoom-whirl preset is well-formed with spin and radiation reaction", () => {
  const w = GR_CURVATURE_SCENARIOS.whirl;
  assert.ok(w && w.spin > 0 && w.rr === true && w.mass > 8);
  assert.ok(w.bodies.every((b) => b.a > 0 && b.e >= 0 && b.e < 1));
});
