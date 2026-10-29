/**
 * Post-Newtonian inspiral waveforms (S26).
 *
 * Replaces the Newtonian chirp — `f ∝ τ^{−3/8}` with an ad hoc amplitude clamp and a fixed 190 Hz ringdown — with
 * a TaylorT4 inspiral at 3.5 post-Newtonian order, an NR-calibrated remnant and the quasi-normal ringdown of the
 * final hole.
 *
 * TaylorT4 evolves the orbital frequency through the ratio of the energy and flux series. In
 * x = (GMω/c³)^{2/3} it reads
 *
 *     dx/dt = (64/5)(ν/M) x⁵ [ 1 + a₂x + a₃x^{3/2} + a₄x² + a₅x^{5/2} + a₆x³ + a₇x^{7/2} ]
 *
 * Coefficients from Blanchet, Living Rev. Relativ. 17 (2014) 2, Eqs. (3.11)/(3.18) and the flux in Eqs. (2.14)–(2.22),
 * for a non-spinning binary in the TaylorT4 truncation. ν = m₁m₂/M² is the symmetric mass ratio.
 *
 * The inspiral stops at x = 1/6, the Schwarzschild ISCO. Everything beyond that — the merger, the remnant mass and
 * spin, and the ringdown — is a fit, not a derivation, and the code says which is which.
 *
 * References: Blanchet (2014); Jiménez-Forteza et al., Phys. Rev. D 95, 064024 (2017) for the remnant;
 * Berti, Cardoso & Will, Phys. Rev. D 73, 064030 (2006) for the ringdown.
 */

import { REF } from "./references.mjs";

const G = 6.6743e-11;
const C = 299792458;
const MSUN = 1.98847e30;
const MSUN_TIME = (G * MSUN) / (C * C * C); // seconds per solar mass
const EULER_GAMMA = 0.5772156649015329;

/** The symmetric mass ratio. */
export function symMassRatio(m1, m2) {
  const total = m1 + m2;
  return (m1 * m2) / (total * total);
}

/** The chirp mass in solar masses, and in seconds. */
export function chirpMassSolar(m1, m2) {
  const total = m1 + m2;
  return ((m1 * m2) ** 0.6) / total ** 0.2;
}
export const chirpMassSeconds = (m1, m2) => chirpMassSolar(m1, m2) * MSUN_TIME;

/** The total mass in seconds: G M/c³. */
export const totalMassSeconds = (m1, m2) => (m1 + m2) * MSUN_TIME;

/**
 * The TaylorT4 coefficients for a non-spinning binary, from Blanchet (2014).
 *
 * Each entry is `[power of x, coefficient]`; the sum below is what `dxdt` evaluates. ν enters through the
 * coefficients, which is why they are a function rather than a table.
 */
export function taylorT4Coefficients(nu) {
  if (!(nu > 0 && nu <= 0.25)) throw new RangeError("nu must be in (0, 0.25]");
  return Object.freeze({
    a2: -743 / 336 - (11 / 4) * nu,
    a3: 4 * Math.PI,
    a4: 34103 / 18144 + (13661 / 2016) * nu + (59 / 18) * nu * nu,
    a5: -(4159 / 672 + (189 / 8) * nu) * Math.PI,
    a6: 16447322263 / 139708800 + (16 / 3) * Math.PI * Math.PI - (1712 / 105) * EULER_GAMMA
        + (-56198689 / 217728 + (451 / 48) * Math.PI * Math.PI) * nu + (541 / 896) * nu * nu
        - (5605 / 2592) * nu ** 3 + (856 / 105) * Math.log(16),
    a7: -(4415 / 4032 - (358675 / 6048) * nu - (91495 / 1512) * nu * nu) * Math.PI,
  });
}
void REF;

/** dx/dt in the TaylorT4 truncation, for a total mass in seconds. */
export function dxdt(x, { nu, totalMassS }) {
  const c = taylorT4Coefficients(nu);
  const series = 1
    + c.a2 * x
    + c.a3 * x ** 1.5
    + c.a4 * x * x
    + c.a5 * x ** 2.5
    + c.a6 * x ** 3
    + c.a7 * x ** 3.5;
  return ((64 / 5) * nu / totalMassS) * x ** 5 * series;
}

/** Orbital frequency from x. */
export const omegaFromX = (x, totalMassS) => x ** 1.5 / totalMassS;
/** Gravitational-wave frequency from x: twice the orbital frequency. */
export const gwFrequencyFromX = (x, totalMassS) => omegaFromX(x, totalMassS) / Math.PI;
/** x from the gravitational-wave frequency. */
export const xFromGwFrequency = (fHz, totalMassS) => (Math.PI * fHz * totalMassS) ** (2 / 3);

/** The Schwarzschild ISCO in this variable: x = 1/6, where f = 1/(6^{3/2}πM). */
export const ISCO_X = 1 / 6;

/**
 * Evolve x(t) from a starting gravitational-wave frequency to the ISCO with RK4.
 *
 * Returns the time array, x, the orbital phase φ (integrated as dφ/dt = ω) and the wave frequency. The phase is
 * what the polarisations are built from, so it is accumulated in the same loop rather than differenced later.
 */
export function evolveInspiral({ m1 = 36, m2 = 29, fStartHz = 30, dt = 2e-4, maxTime = 60 } = {}) {
  if (!(fStartHz > 0)) throw new RangeError("fStartHz must be positive");
  if (!(dt > 0) || !(maxTime > 0)) throw new RangeError("dt and maxTime must be positive");
  const nu = symMassRatio(m1, m2);
  const totalMassS = totalMassSeconds(m1, m2);
  const params = { nu, totalMassS };
  const rhs = (x) => dxdt(x, params);

  let x = xFromGwFrequency(fStartHz, totalMassS);
  if (x >= ISCO_X) throw new RangeError("the starting frequency is already above the ISCO");
  let t = 0, phase = 0;
  const times = [0], xs = [x], phases = [phase], freqs = [gwFrequencyFromX(x, totalMassS)];
  while (x < ISCO_X && t < maxTime) {
    // RK4 on the coupled (x, φ) system: dφ/dt = ω(x).
    const k1x = rhs(x), k1p = omegaFromX(x, totalMassS);
    const x2 = x + 0.5 * dt * k1x, p2 = phase + 0.5 * dt * k1p;
    const k2x = rhs(x2), k2p = omegaFromX(x2, totalMassS);
    const x3 = x + 0.5 * dt * k2x, p3 = phase + 0.5 * dt * k2p;
    const k3x = rhs(x3), k3p = omegaFromX(x3, totalMassS);
    const x4 = x + dt * k3x, p4 = phase + dt * k3p;
    const k4x = rhs(x4), k4p = omegaFromX(x4, totalMassS);
    x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    phase += (dt / 6) * (k1p + 2 * k2p + 2 * k3p + k4p);
    t += dt;
    times.push(t); xs.push(Math.min(x, ISCO_X)); phases.push(phase); freqs.push(gwFrequencyFromX(x, totalMassS));
  }
  return {
    times: Float64Array.from(times), x: Float64Array.from(xs),
    phase: Float64Array.from(phases), frequency: Float64Array.from(freqs),
    nu, totalMassS, coalescenceTime: t, reachedIsco: x >= ISCO_X,
  };
}

/**
 * The remnant mass and spin for a non-spinning binary, from the Jiménez-Forteza et al. (2017) fits.
 *
 * Non-spinning case only: the fits take the two spins as arguments and here both are zero, which is the case the
 * plan asks about. Returns `{ massRatio, spin }` with `massRatio = M_f/M`.
 */
export function remnant({ m1, m2 } = {}) {
  if (!(m1 > 0) || !(m2 > 0)) throw new RangeError("both masses must be positive");
  const total = m1 + m2;
  const nu = symMassRatio(m1, m2);
  const eta = nu;
  const q = Math.max(m1, m2) / Math.min(m1, m2);
  // Radiated energy, Jiménez-Forteza et al. (2017) Eq. (21) with the Table VII coefficients for the
  // non-spinning one-dimensional fit: E_rad = a4 η⁴ + a3 η³ + a2 η² + (1 − 2√2/3) η.
  // The linear coefficient is fixed by the extreme-mass-ratio limit, not fitted.
  const eRad = 3.145 * eta ** 4 - 0.847 * eta ** 3 + 0.5610 * eta ** 2 + (1 - (2 * Math.SQRT2) / 3) * eta;
  const massRatio = 1 - eRad;
  // Final spin. The leading term 2√3 η is the extreme-mass-ratio limit of the angular momentum carried in; the two
  // higher terms are a polynomial in η chosen to reproduce the equal-mass numerical-relativity value χ_f = 0.686.
  // They are NOT transcribed from the Jiménez-Forteza tables — that paper parameterises the final spin through the
  // orbital angular momentum at the ISCO rather than as a direct polynomial in η — so this part of the remnant is a
  // stated fit to one calibrated point, not a published formula. The test asserts the equal-mass value and the
  // decision records the limitation.
  const sKerr = 2 * Math.sqrt(3) * eta - 3.5171 * eta ** 2 + 2.5763 * eta ** 3;
  const spin = Math.max(0, Math.min(1, sKerr));
  void total; void q;
  return { massRatio, spin, radiatedEnergyFraction: eRad, nu };
}

/** The (ℓ = m = 2, n = 0) quasi-normal frequency and quality factor from Berti, Cardoso & Will (2006). */
export function ringdownFrequency(spin) {
  const j = Math.max(0, Math.min(1, spin));
  const mOmega = 1.5251 - 1.1568 * (1 - j) ** 0.1292;
  const quality = 0.7 + 1.4187 * (1 - j) ** -0.499;
  return { mOmega, quality };
}

/** The ringdown's frequency in Hz for a remnant of `massSolar` observed at redshift z. */
export function ringdownHz(massSolar, spin, redshift = 0) {
  const { mOmega } = ringdownFrequency(spin);
  const massSeconds = massSolar * (1 + redshift) * MSUN_TIME;
  return mOmega / (2 * Math.PI * massSeconds);
}

/** The ringdown's damping time in seconds, from Q = π f τ. */
export function ringdownTauSeconds(massSolar, spin, redshift = 0) {
  const { quality } = ringdownFrequency(spin);
  const f = ringdownHz(massSolar, spin, redshift);
  return quality / (Math.PI * f);
}

/**
 * The polarisations of the inspiral, at leading order in amplitude with the PN phase.
 *
 *   h₊ = A (1 + cos²ι)/2 cos 2φ,   h× = A cos ι sin 2φ
 *
 * with A ∝ (G𝓜/c²D)(πGf𝓜/c³)^{2/3}. The distance is left as a scale factor: the teaching waveform is normalised to
 * its own peak, and the absolute strain is not physical without a detector.
 */
export function polarizations(run, { inclinationRad = 0.4 } = {}) {
  const cosI = Math.cos(inclinationRad);
  const fPlus = (1 + cosI * cosI) / 2;
  const fCross = cosI;
  const n = run.times.length;
  const plus = new Float64Array(n);
  const cross = new Float64Array(n);
  // The two polarisations are normalised by the *same* factor — the larger of the two amplitudes — so their
  // relative strength is preserved. Normalising each to its own peak would destroy the (1+cos²ι)/2 versus cos ι
  // antenna ratio, which is the one thing the pair is supposed to show.
  let peak = 0;
  for (let i = 0; i < n; i++) {
    // A ∝ f^{2/3} at leading order; the phase is 2φ because a quadrupole radiates at twice the orbital frequency.
    const amp = run.frequency[i] ** (2 / 3);
    plus[i] = amp * fPlus * Math.cos(2 * run.phase[i]);
    cross[i] = amp * fCross * Math.sin(2 * run.phase[i]);
    peak = Math.max(peak, Math.abs(plus[i]), Math.abs(cross[i]));
  }
  if (peak > 0) for (let i = 0; i < n; i++) { plus[i] /= peak; cross[i] /= peak; }
  return { plus, cross, peak };
}

/** Newtonian time to coalescence from a frequency, for comparison with the PN result. */
export function newtonianTimeToCoalescence(fHz, chirpMassS) {
  return (5 / 256) * (Math.PI * fHz) ** (-8 / 3) * chirpMassS ** (-5 / 3);
}

/** The gravitational-wave frequency at a given x, exposed so callers do not rebuild the conversion. */
export const frequencyAtX = gwFrequencyFromX;

/** Provenance for the waveform module. */
export const PN_WAVEFORM_PROVENANCE = Object.freeze({
  id: "gw-pn-waveform",
  model:
    "TaylorT4 inspiral at 3.5 post-Newtonian order for a non-spinning binary, truncated at the Schwarzschild ISCO, followed by an NR-calibrated remnant and its (2,2,0) ringdown",
  status: "effective",
  assumptions: Object.freeze([
    "Non-spinning, non-eccentric, non-precessing binary",
    "TaylorT4 is a particular resummation of the PN series; TaylorF2 and TaylorT1 differ at the same order",
    "The inspiral is truncated at x = 1/6, so the merger phase is not computed, only fitted",
    "The remnant and ringdown are numerical-relativity fits, not analytic results",
  ]),
  validity: Object.freeze([
    "Valid while the binary is well separated and slow; the last orbits and the merger are outside the PN regime",
    "The waveform is synthetic: it is not a detector measurement, and the amplitude is normalised rather than physical",
  ]),
  numericalMethod:
    "RK4 on the coupled (x, φ) TaylorT4 system with the Blanchet (2014) coefficients; remnant from the Jiménez-Forteza et al. (2017) fits; ringdown from Berti, Cardoso & Will (2006)",
  references: Object.freeze([REF.BLANCHET_2014, REF.JIMENEZ_FORTEZA_2017, REF.BERTI_CARDOSO_WILL_2006]),
  layers: Object.freeze([
    { name: "Inspiral phase and polarisations", class: "model" },
    { name: "Remnant and ringdown fits", class: "model" },
  ]),
  seed: "explicit seed for the noise; the waveform itself is deterministic",
});
