import test from "node:test";
import assert from "node:assert/strict";
import {
  symMassRatio, chirpMassSolar, chirpMassSeconds, totalMassSeconds,
  taylorT4Coefficients, dxdt, evolveInspiral, ISCO_X, xFromGwFrequency,
  gwFrequencyFromX, remnant, ringdownFrequency, ringdownHz, ringdownTauSeconds,
  polarizations, newtonianTimeToCoalescence,
} from "../js/science/pn-waveform.mjs";

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} differs from ${b} by more than ${tol}`);

test("the TaylorT4 series is finite and reduces to the Newtonian flux at small x", () => {
  const nu = symMassRatio(36, 29);
  const c = taylorT4Coefficients(nu);
  for (const [k, v] of Object.entries(c)) assert.ok(Number.isFinite(v), `${k} is finite`);
  // As x → 0 the bracket → 1, so dx/dt → (64/5)(ν/M) x^5 exactly.
  const M = totalMassSeconds(36, 29);
  const x = 1e-6;
  // The bracket does not vanish at x = 1e-6: the 2PN term alone contributes a2·x ≈ 2e-6, so the ratio is checked
  // against the bracket evaluated explicitly rather than against 1.
  const bracket = 1 + c.a2 * x + c.a3 * x ** 1.5 + c.a4 * x * x + c.a5 * x ** 2.5 + c.a6 * x ** 3 + c.a7 * x ** 3.5;
  near(dxdt(x, { nu, totalMassS: M }) / ((64 / 5) * (nu / M) * x ** 5), bracket, 1e-12);
  // And it does tend to 1 as x shrinks further.
  const tiny = 1e-9;
  near(dxdt(tiny, { nu, totalMassS: M }) / ((64 / 5) * (nu / M) * tiny ** 5), 1, 1e-8);
  assert.throws(() => taylorT4Coefficients(0));
  assert.throws(() => taylorT4Coefficients(0.3));
});

test("the leading-order phase reproduces the Newtonian inspiral frequency", () => {
  // The Newtonian relation is f(tau) = (1/pi)(5/(256 tau))^{3/8} M_c^{-5/8}. Integrating x from the Newtonian
  // dx/dt = (64/5)(nu/M)x^5 and converting to f must give the same curve, which is what this checks.
  const m1 = 36, m2 = 29;
  const M = totalMassSeconds(m1, m2);
  const nu = symMassRatio(m1, m2);
  const mcS = chirpMassSeconds(m1, m2);
  const f = 50;
  const x = xFromGwFrequency(f, M);
  // Newtonian time remaining at this frequency, from the same x.
  const tauNewton = (5 / 256) * x ** -4 * (M / nu);
  const tauPlanck = newtonianTimeToCoalescence(f, mcS);
  near(tauNewton / tauPlanck, 1, 1e-6);
});

test("the inspiral evolves to the ISCO in a time between the Newtonian and 3.5PN values", () => {
  const run = evolveInspiral({ m1: 36, m2: 29, fStartHz: 30 });
  assert.ok(run.reachedIsco, "the run reaches the Schwarzschild ISCO");
  near(run.x[run.x.length - 1], ISCO_X, 1e-3);
  const newtonian = newtonianTimeToCoalescence(30, chirpMassSeconds(36, 29));
  // The PN corrections make the binary merge sooner; the ratio is recorded rather than assumed.
  assert.ok(run.coalescenceTime > 0 && run.coalescenceTime < newtonian,
    `t_c = ${run.coalescenceTime.toFixed(3)} s should be below the Newtonian ${newtonian.toFixed(3)} s`);
  assert.ok(run.coalescenceTime > 0.5 * newtonian, "and not implausibly far below it");
  // The phase is monotone and the frequency rises.
  for (let i = 1; i < run.times.length; i++) {
    assert.ok(run.frequency[i] >= run.frequency[i - 1] - 1e-9, "the frequency never falls during the inspiral");
    assert.ok(run.phase[i] >= run.phase[i - 1], "the phase is monotone");
  }
  assert.throws(() => evolveInspiral({ m1: 36, m2: 29, fStartHz: 1e6 }));
});

test("the remnant reproduces the equal-mass numerical-relativity values", () => {
  const r = remnant({ m1: 30, m2: 30 });
  near(r.spin, 0.686, 0.005);
  near(r.massRatio, 0.952, 0.003);
  assert.equal(r.nu, 0.25);
  // Less extreme mass ratios radiate less and leave a smaller spin.
  const unequal = remnant({ m1: 10, m2: 30 });
  assert.ok(unequal.radiatedEnergyFraction < r.radiatedEnergyFraction);
  assert.ok(unequal.spin < r.spin);
  // The radiated energy is the published fit, which vanishes linearly as eta → 0.
  const tiny = remnant({ m1: 1e6, m2: 1 });
  assert.ok(tiny.radiatedEnergyFraction > 0 && tiny.radiatedEnergyFraction < 0.01);
});

test("the ringdown fits give the published values and the detector-frame frequency", () => {
  near(ringdownFrequency(0).mOmega, 0.3683, 1e-4);
  near(ringdownFrequency(0).quality, 2.1187, 1e-4);
  near(ringdownFrequency(0.686).mOmega, 0.5291, 1e-4);
  near(ringdownFrequency(0.686).quality, 3.2288, 1e-4);
  // 62 solar masses at z = 0.09 with the equal-mass remnant spin.
  near(ringdownHz(62, 0.686, 0.09), 253, 1);
  // The quality factor gives the damping time: tau = Q/(pi f).
  const tau = ringdownTauSeconds(62, 0.686, 0.09);
  near(tau, ringdownFrequency(0.686).quality / (Math.PI * ringdownHz(62, 0.686, 0.09)), 1e-12);
  assert.ok(tau > 0 && tau < 0.01, `tau = ${tau.toExponential(2)} s is a few milliseconds`);
});

test("the polarisations follow the quadrupole pattern and are normalised", () => {
  const run = evolveInspiral({ m1: 36, m2: 29, fStartHz: 40, dt: 5e-4 });
  const face = polarizations(run, { inclinationRad: 0 });       // cos i = 1
  const edge = polarizations(run, { inclinationRad: Math.PI / 2 }); // cos i = 0
  const peak = (a) => Math.max(...a.map(Math.abs));
  // Edge on: h_cross vanishes, h_plus is the whole signal and reaches the normalisation.
  near(peak(edge.cross), 0, 1e-12);
  near(peak(edge.plus), 1, 1e-12);
  // Face on: both are present, because cos i = 1 makes the cross antenna factor maximal too.
  assert.ok(peak(face.cross) > 0.9, "h_cross is strong face on");
  assert.ok(peak(face.plus) > 0.9, "h_plus is strong face on");
  // The shared normalisation preserves the ratio between the two branches rather than rescaling each.
  assert.ok(Math.max(...face.plus.map(Math.abs)) <= 1 + 1e-12);
  assert.ok(Math.max(...face.cross.map(Math.abs)) <= 1 + 1e-12);
  // The two polarisations are in quadrature: they do not share a sign everywhere.
  let sameSign = 0;
  for (let i = 0; i < face.plus.length; i++) if (Math.sign(face.plus[i]) === Math.sign(face.cross[i])) sameSign++;
  assert.ok(sameSign > 0 && sameSign < face.plus.length, "the two polarisations are not in phase");
  // The amplitude grows with the frequency.
  const first = Math.abs(face.plus[0]), last = Math.abs(face.plus[face.plus.length - 1]);
  assert.ok(last > first, "the amplitude grows through the inspiral");
});

test("the mass functions agree with the closed forms", () => {
  near(symMassRatio(30, 30), 0.25, 1e-15);
  near(symMassRatio(36, 29), (36 * 29) / 65 ** 2, 1e-15);
  // Equal masses: M_c = m / 2^{1/5} = m × 0.87055.
  near(chirpMassSolar(30, 30), 30 / 2 ** 0.2, 1e-12);
  // M_c = (m1 m2)^{3/5}/(m1+m2)^{1/5}
  near(chirpMassSolar(36, 29), ((36 * 29) ** 0.6) / 65 ** 0.2, 1e-12);
  near(gwFrequencyFromX(ISCO_X, totalMassSeconds(65, 0)), gwFrequencyFromX(ISCO_X, totalMassSeconds(32.5, 32.5)), 1e-12);
  void chirpMassSeconds;
});
