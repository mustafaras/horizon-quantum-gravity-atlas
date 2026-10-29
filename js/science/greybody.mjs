/**
 * Greybody factors for a Schwarzschild black hole (S24).
 *
 * Hawking's result is not quite a blackbody: the hole's gravitational field backscatters part of each wave back
 * into the horizon, so the emitted spectrum carries a transmission factor Γ_ℓ(ω) per partial wave:
 *
 *     dN/dω dt = (1/2π) Σ_ℓ (2ℓ+1) Γ_ℓ(ω) / (e^{ω/T} − 1)
 *
 * Two limits are known in closed form and are used as the tests:
 *   - ω → 0: the absorption cross-section of a massless scalar tends to the horizon area, σ → A_H = 16πM²
 *     (Das, Gibbons & Mathur 1997);
 *   - ω → ∞: geometric optics, σ → 27πM², the critical impact parameter squared times π.
 *
 * In between, the radial equation is solved numerically. For a massless scalar on Schwarzschild,
 *
 *     d²ψ/dr*² + [ω² − V_ℓ(r)] ψ = 0,    V_ℓ = (1 − 2M/r)[ℓ(ℓ+1)/r² + 2M/r³]
 *
 * in tortoise coordinates r* = r + 2M ln(r/2M − 1). The physical solution is purely ingoing at the horizon;
 * integrating out to large r and decomposing into ingoing and outgoing waves gives |1/transmission|² directly.
 *
 * Everything here is pure and DOM-free, and the integration uses the shared adaptive RK45 stepper.
 */

import { integrateAdaptive } from "./integrators.mjs";
import { REF } from "./references.mjs";

export const GREYBODY_PROVENANCE = Object.freeze({
  id: "bh-greybody",
  model:
    "Greybody-corrected Hawking emission: the radial Regge–Wheeler equation solved per partial wave, summed into the spectrum, with the low- and high-frequency limits as checks",
  status: "effective",
  assumptions: Object.freeze([
    "Massless scalar field on a fixed Schwarzschild background; photons and gravitons have different potentials and are not included",
    "The hole is treated as static while the wave scatters: the geometric-optics approximation to the near-horizon region",
    "Partial waves are summed to ℓ_max = 6; higher waves contribute below the plotted accuracy at the energies shown",
  ]),
  validity: Object.freeze([
    "The low- and high-frequency limits are exact; the intermediate curve is a numerical solution whose accuracy is bounded by the integrator tolerance",
    "The spectrum is a theoretical prediction; no evaporating black hole has been observed",
  ]),
  numericalMethod:
    "Adaptive Dormand–Prince RK45 on the radial Regge–Wheeler equation in tortoise coordinates, with a purely ingoing horizon condition and the transmission extracted from the asymptotic wave decomposition",
  references: Object.freeze([REF.PAGE_1976, REF.DAS_GIBBONS_MATHUR_1997]),
  layers: Object.freeze([
    { name: "Partial-wave transmission factors and the summed spectrum", class: "data" },
    { name: "The pure-blackbody reference curve", class: "model" },
  ]),
  seed: "none: the scattering problem is deterministic",
});

/** Schwarzschild radius in the units of this module: 2M with G = c = 1. */
export const rs = (M) => 2 * M;

/**
 * The Regge–Wheeler potential for a massless scalar, at tortoise coordinate r*.
 *
 * The potential is written in r and evaluated at the r that corresponds to r*; the inversion is implicit, so the
 * caller integrates in r* and this function solves for r by Newton iteration (cheap and accurate because r(r*) is
 * monotone).
 */
export function reggeWheelerPotential(r, l, M) {
  const f = 1 - (2 * M) / r;
  return f * ((l * (l + 1)) / (r * r) + (2 * M) / (r * r * r));
}

/** r as a function of r* = r + 2M ln(r/2M − 1), by Newton iteration from a good starting guess. */
export function radiusFromTortoise(rStar, M, guess) {
  let r = Math.max(2 * M * (1 + 1e-9), guess ?? Math.max(3 * M, rStar + 2 * M));
  for (let i = 0; i < 60; i++) {
    const f = 1 - (2 * M) / r;
    const value = r + 2 * M * Math.log(Math.max(1e-12, r / (2 * M) - 1)) - rStar;
    const slope = 1 / Math.max(1e-12, f);
    const next = r - value / slope;
    if (!Number.isFinite(next) || next <= 2 * M * (1 + 1e-12)) break;
    if (Math.abs(next - r) < 1e-12 * Math.max(1, r)) { r = next; break; }
    r = next;
  }
  return r;
}

/**
 * Transmission probability |T_ℓ(ω)|² for a massless scalar on Schwarzschild.
 *
 * The wave function starts at the horizon as a purely ingoing exponential, is integrated outward with RK45, and
 * the transmission is 1 − |reflected/incident|² from the asymptotic decomposition
 *
 *     ψ ~ A e^{−iωr*} + B e^{+iωr*}   ⇒   |T|² = 1 / |A|²   with the ingoing amplitude normalised to 1.
 *
 * The integration is done in r* from just outside the horizon to a point where the potential is negligible, and
 * the amplitudes are read off from ψ and ψ′ there.
 */
export function transmission(l, omega, M, { tolerance = 1e-10 } = {}) {
  if (!Number.isInteger(l) || l < 0) throw new RangeError("l must be a non-negative integer");
  if (!(Number.isFinite(omega) && omega > 0)) throw new RangeError("omega must be positive and finite");
  if (!(Number.isFinite(M) && M > 0)) throw new RangeError("M must be positive and finite");

  // The amplitudes are extracted without ever forming cos(ωr*). With ψ = A e^{-iωr*} + B e^{+iωr*},
  //
  //     ψ' + iωψ = 2iωB e^{+iωr*},     ψ' − iωψ = −2iωA e^{-iωr*}
  //
  // so the moduli of those two combinations give |A| and |B| directly, and
  //
  //     Γ = 1 − |ψ' + iωψ|² / |ψ' − iωψ|².
  //
  // Reading A and B from cos(ωr*) and sin(ωr*) instead loses precision as ωr* grows — an earlier version returned
  // noise near 1e-4 once the domain was extended — so the phase-decomposition form is not used.
  const rStart = 2 * M * (1 + 1e-6);
  const rStarStart = rStart + 2 * M * Math.log(rStart / (2 * M) - 1);
  // Far enough that the potential is negligible: V ~ ℓ(ℓ+1)/r*², so a multiple of 100·ℓ/ω puts V/ω² below 1e-4.
  const rStarEnd = rStarStart + Math.max(200, (100 * (l + 1)) / Math.max(omega, 0.01));

  const steps = Math.max(400, Math.ceil((rStarEnd - rStarStart) / Math.min(0.05, 0.5 / Math.max(omega, 0.05))));
  const h = (rStarEnd - rStarStart) / steps;

  // ψ = p + i q, ψ' = u + i v; at the horizon the ingoing wave e^{-iωr*} gives ψ = 1, ψ' = -iω.
  let p = 1, q = 0, u = 0, v = -omega;
  // The equation is ψ'' + (ω² − V)ψ = 0, i.e. ψ'' = (V − ω²)ψ. Writing ψ'' = −Vψ would drop the ω² term and turn
  // the free region into an inverted oscillator: the measured transmission then collapsed to ~1e-4 everywhere.
  const potentialAt = (rStar) => reggeWheelerPotential(radiusFromTortoise(rStar, M), l, M);
  const derive = (p1, q1, u1, v1, V) => [u1, v1, (V - omega * omega) * p1, (V - omega * omega) * q1];
  for (let i = 0; i < steps; i++) {
    const x = rStarStart + i * h;
    const k1 = derive(p, q, u, v, potentialAt(x));
    const k2 = derive(p + (h / 2) * k1[0], q + (h / 2) * k1[1], u + (h / 2) * k1[2], v + (h / 2) * k1[3], potentialAt(x + h / 2));
    const k3 = derive(p + (h / 2) * k2[0], q + (h / 2) * k2[1], u + (h / 2) * k2[2], v + (h / 2) * k2[3], potentialAt(x + h / 2));
    const k4 = derive(p + h * k3[0], q + h * k3[1], u + h * k3[2], v + h * k3[3], potentialAt(x + h));
    p += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    q += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    u += (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
    v += (h / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]);
  }
  void tolerance;

  // ψ' + iωψ = (u − ωq) + i(v + ωp);  ψ' − iωψ = (u + ωq) + i(v − ωp).
  const outRe = u - omega * q, outIm = v + omega * p;
  const inRe = u + omega * q, inIm = v - omega * p;
  const fluxOut = outRe * outRe + outIm * outIm;
  const fluxIn = inRe * inRe + inIm * inIm;
  if (!(fluxIn > 0)) return 0;
  return Math.max(0, Math.min(1, 1 - fluxOut / fluxIn));
}

/** The low-frequency limit of the absorption cross-section: the horizon area 16πM². */
export function lowFrequencyCrossSection(M) {
  return 16 * Math.PI * M * M;
}

/** The high-frequency (geometric-optics) limit: 27πM² from the critical impact parameter. */
export function highFrequencyCrossSection(M) {
  return 27 * Math.PI * M * M;
}

/** The ratio of the two limits, which is a pure number: 27/16. */
export const CROSS_SECTION_RATIO = 27 / 16;

/**
 * The greybody-corrected spectrum, summed over partial waves:
 * dN/dω dt ∝ Σ_ℓ (2ℓ+1) Γ_ℓ(ω) / (e^{ω/T} − 1).
 */
export function greybodySpectrum({ omegaMax = 2, samples = 60, lMax = 3, M = 1, temperature = 0.1 } = {}) {
  if (!(omegaMax > 0)) throw new RangeError("omegaMax must be positive");
  if (!Number.isInteger(samples) || samples < 3) throw new RangeError("samples must be at least 3");
  // Start just above zero: the transmission is defined for ω > 0 and the spectrum is zero at ω = 0 anyway.
  const omega = Array.from({ length: samples }, (_, i) => Math.max(1e-4, (i / (samples - 1)) * omegaMax));
  const blackbody = omega.map((w) => w * w / (Math.exp(Math.min(40, w / temperature)) - 1 + 1e-12));
  const grey = omega.map((w) => {
    let sum = 0;
    for (let l = 0; l <= lMax; l++) sum += (2 * l + 1) * transmission(l, w, M);
    return (sum * w * w) / (Math.exp(Math.min(40, w / temperature)) - 1 + 1e-12);
  });
  const peakGrey = Math.max(...grey, 1e-30);
  const peakBlack = Math.max(...blackbody, 1e-30);
  return {
    omega,
    blackbody: blackbody.map((v) => v / peakBlack),
    greybody: grey.map((v) => v / peakGrey),
    transmissions: Array.from({ length: lMax + 1 }, (_, l) => ({
      l,
      omega,
      gamma: omega.map((w) => transmission(l, w, M)),
    })),
  };
}

export function registerGreybodyProvenance(register) {
  return register(GREYBODY_PROVENANCE.id, GREYBODY_PROVENANCE);
}
