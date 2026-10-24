// Three-flavour neutrino oscillations in constant-density matter (S12).
//
// The flavour state evolves under H = U diag(0, dm21, dm31) U^dagger / (2E) + diag(V, 0, 0), V = sqrt(2) G_F N_e, and the
// probability is P(a -> b) = |<b| exp(-i H L) |a>|^2, with exp(-i H L) from the analytic Hermitian eigendecomposition in
// hermitian3.mjs. For antineutrinos U -> U* and V -> -V. PDG parametrisation of U with c_ij = cos theta_ij.
//
// Units. H is in eV, L in eV^-1 (L[km] / (hbar c)) and E in eV. The familiar 1.267 in
// 1.267 dm2[eV^2] L[km] / E[GeV] is the phase dm2 L / (4 E) in these units: 1 / (4 hbar c[eV km] 1e9 eV/GeV), derived below
// from the exact SI values of hbar, c and the elementary charge.
//
// Matter. N_e = rho Y_e / m_u with the atomic mass constant (the nucleon mass differs from it by less than 1 per cent, and
// Y_e is the electrons per nucleon). G_F and m_u are the CODATA values of the NIST Reference on Constants.
//
// References: Wolfenstein, Phys. Rev. D 17, 2369 (1978); Barger et al., Phys. Rev. D 22, 2718 (1980);
// Maki, Nakagawa & Sakata, Prog. Theor. Phys. 28, 870 (1962); Particle Data Group, PTEP 2022, 083C01.

import { HBAR, C } from "./constants.mjs";
import { cmul, cconj, cscale, cexpi, cabs2, expMinusIHt } from "./hermitian3.mjs";

const ELEMENTARY_CHARGE = 1.602176634e-19; // C, exact (SI 2019)
const EV_PER_GEV = 1e9;
/** hbar c in eV m, from the exact SI values. */
const HBAR_C_EV_M = (HBAR * C) / ELEMENTARY_CHARGE;
const HBAR_C_EV_KM = HBAR_C_EV_M / 1000;
const HBAR_C_EV_CM = HBAR_C_EV_M * 100;

/** 1.267: the phase dm2 L / (4 E) per eV^2 km / GeV. */
export const PHASE_KM_PER_GEV = 1 / (4 * HBAR_C_EV_KM * EV_PER_GEV);
/** Fermi coupling constant G_F / (hbar c)^3 in GeV^-2: 1.1663787(6)e-5 (CODATA, NIST Reference on Constants). */
export const FERMI_CONSTANT_PER_GEV2 = 1.1663787e-5;
/** Atomic mass constant in g: 1.66053906892(52)e-24 (CODATA, NIST Reference on Constants). */
const ATOMIC_MASS_G = 1.66053906892e-24;
const FERMI_CONSTANT_PER_EV2 = FERMI_CONSTANT_PER_GEV2 / (EV_PER_GEV * EV_PER_GEV);
const SQRT2 = Math.SQRT2;

export const FLAVOURS = Object.freeze(["e", "mu", "tau"]);

function finite(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new RangeError(`${name} must be a finite number, got ${value}`);
  return value;
}
const positive = (value, name) => { if (!(finite(value, name) > 0)) throw new RangeError(`${name} must be positive, got ${value}`); return value; };
const nonNegative = (value, name) => { if (finite(value, name) < 0) throw new RangeError(`${name} must not be negative, got ${value}`); return value; };

function checkedParams(params) {
  if (!params || typeof params !== "object") throw new TypeError("params must be an object");
  for (const key of ["theta12", "theta13", "theta23", "deltaCP", "dm21", "dm31"]) finite(params[key], key);
  return params;
}

/** theta_ij in radians from sin^2 theta_ij. */
export function mixingAngles({ sin2theta12, sin2theta13, sin2theta23 }) {
  const angle = (s2, name) => {
    if (!(finite(s2, name) >= 0 && s2 <= 1)) throw new RangeError(`${name} must be in [0, 1], got ${s2}`);
    return Math.asin(Math.sqrt(s2));
  };
  return { theta12: angle(sin2theta12, "sin2theta12"), theta13: angle(sin2theta13, "sin2theta13"), theta23: angle(sin2theta23, "sin2theta23") };
}

/** Delta m^2_31 from Delta m^2_3l: equal for normal ordering, Delta m^2_32 + Delta m^2_21 for inverted ordering. */
export function deltaM31FromOrdering({ ordering, dm3l, dm21 }) {
  if (ordering !== "NO" && ordering !== "IO") throw new RangeError(`ordering must be "NO" or "IO", got ${ordering}`);
  return ordering === "NO" ? dm3l : dm3l + dm21;
}

/** The PMNS matrix U(theta12, theta13, theta23, delta_CP) in the PDG parametrisation, as rows of {re, im}. */
export function pmnsMatrix({ theta12, theta13, theta23, deltaCP }) {
  const [s12, c12, s13, c13, s23, c23] = [Math.sin(theta12), Math.cos(theta12), Math.sin(theta13), Math.cos(theta13), Math.sin(theta23), Math.cos(theta23)];
  const eMinus = cexpi(-deltaCP), ePlus = cexpi(deltaCP);
  const real = (x) => ({ re: x, im: 0 });
  const sum = (a, b) => ({ re: a.re + b.re, im: a.im + b.im });
  return [
    [real(c12 * c13), real(s12 * c13), cscale(eMinus, s13)],
    [
      sum(real(-s12 * c23), cscale(ePlus, -c12 * s23 * s13)),
      sum(real(c12 * c23), cscale(ePlus, -s12 * s23 * s13)),
      real(s23 * c13),
    ],
    [
      sum(real(s12 * s23), cscale(ePlus, -c12 * c23 * s13)),
      sum(real(-c12 * s23), cscale(ePlus, -s12 * c23 * s13)),
      real(c23 * c13),
    ],
  ];
}

/** Electron number density in cm^-3: rho Y_e / m_u. */
export function electronDensityPerCm3({ rhoGcm3, Ye = 0.5 }) {
  nonNegative(rhoGcm3, "rhoGcm3");
  if (!(finite(Ye, "Ye") >= 0 && Ye <= 1)) throw new RangeError(`Ye must be in [0, 1], got ${Ye}`);
  return (rhoGcm3 * Ye) / ATOMIC_MASS_G;
}

/** The charged-current matter potential V = sqrt(2) G_F N_e in eV. */
export function matterPotentialEv({ rhoGcm3, Ye = 0.5 }) {
  const electronsPerCm3 = electronDensityPerCm3({ rhoGcm3, Ye });
  const electronsPerEv3 = electronsPerCm3 * HBAR_C_EV_CM ** 3;
  return SQRT2 * FERMI_CONSTANT_PER_EV2 * electronsPerEv3;
}

/**
 * Energy of the 1-3 MSW resonance in GeV, dm31 cos(2 theta13) / (2 V). Positive for neutrinos in normal ordering and for
 * antineutrinos in inverted ordering (the sign of dm31 carries it); Infinity without matter.
 */
export function resonanceEnergyGeV({ dm31, theta13, rhoGcm3, Ye = 0.5 }) {
  const V = matterPotentialEv({ rhoGcm3, Ye });
  if (V === 0) return Infinity;
  return (finite(dm31, "dm31") * Math.cos(2 * finite(theta13, "theta13"))) / (2 * V) / EV_PER_GEV;
}

/** The flavour-basis Hamiltonian in eV as rows of {re, im} (Hermitian). */
export function hamiltonian({ E_GeV, params, rhoGcm3 = 0, Ye = 0.5, antineutrino = false }) {
  positive(E_GeV, "E_GeV");
  checkedParams(params);
  const U = pmnsMatrix(params);
  const V = matterPotentialEv({ rhoGcm3, Ye });
  const masses = [0, params.dm21, params.dm31];
  const energyEv = E_GeV * EV_PER_GEV;
  const mix = antineutrino ? U.map((row) => row.map(cconj)) : U;
  return [0, 1, 2].map((a) => [0, 1, 2].map((b) => {
    let h = { re: 0, im: 0 };
    for (let i = 1; i < 3; i += 1) {
      const t = cmul(mix[a][i], cconj(mix[b][i]));
      h = { re: h.re + t.re * masses[i], im: h.im + t.im * masses[i] };
    }
    h = { re: h.re / (2 * energyEv), im: h.im / (2 * energyEv) };
    return a === 0 && b === 0 ? { re: h.re + (antineutrino ? -V : V), im: h.im } : h;
  }));
}

/**
 * P(alpha -> beta) as a frozen 3 x 3 matrix indexed [alpha][beta] (flavours e, mu, tau): each row and each column sums to 1.
 * `E_GeV` is positive and `L_km` non-negative, `rhoGcm3` is the constant matter density in g/cm^3, `Ye` the electrons per
 * nucleon and `antineutrino` selects the CP-conjugate channel.
 */
export function oscillationProbabilities({ E_GeV, L_km, params, rhoGcm3 = 0, Ye = 0.5, antineutrino = false }) {
  nonNegative(L_km, "L_km");
  const S = expMinusIHt(hamiltonian({ E_GeV, params, rhoGcm3, Ye, antineutrino }), L_km / HBAR_C_EV_KM);
  return Object.freeze([0, 1, 2].map((alpha) => Object.freeze([0, 1, 2].map((beta) => cabs2(S[beta][alpha])))));
}

/**
 * The probabilities P(initial -> e, mu, tau) along one axis, for the flavour ribbon. `mode: "energy"` sweeps E over
 * `range` (GeV) at the baseline `fixed` (km); `mode: "baseline"` sweeps L/E over `range` (km/GeV) at the energy `fixed`
 * (GeV), so L = (L/E) E. Returns `{ x, P }` with P[beta][i] = P(initial -> beta) at x[i].
 */
export function flavourCurves({ initial, mode, range, fixed, samples = 240, params, rhoGcm3 = 0, Ye = 0.5, antineutrino = false }) {
  if (![0, 1, 2].includes(initial)) throw new RangeError(`initial must be 0, 1 or 2 (e, mu, tau), got ${initial}`);
  if (mode !== "energy" && mode !== "baseline") throw new RangeError(`mode must be "energy" or "baseline", got ${mode}`);
  if (!Array.isArray(range) || range.length !== 2 || !(finite(range[0], "range[0]") < finite(range[1], "range[1]"))) {
    throw new RangeError(`range must be [low, high] with low < high, got ${JSON.stringify(range)}`);
  }
  positive(fixed, "fixed");
  if (!Number.isInteger(samples) || samples < 2) throw new RangeError(`samples must be an integer of at least 2, got ${samples}`);
  const x = new Array(samples + 1);
  const P = [new Array(samples + 1), new Array(samples + 1), new Array(samples + 1)];
  for (let i = 0; i <= samples; i += 1) {
    x[i] = range[0] + ((range[1] - range[0]) * i) / samples;
    const E_GeV = mode === "energy" ? x[i] : fixed;
    const L_km = mode === "energy" ? fixed : x[i] * fixed;
    const row = oscillationProbabilities({ E_GeV, L_km, params, rhoGcm3, Ye, antineutrino })[initial];
    for (let b = 0; b < 3; b += 1) P[b][i] = row[b];
  }
  return { x, P };
}
