/**
 * QFT field lab — pure compute contract for Prompt 07.
 *
 * A free massive scalar field in 1+1 dimensions, sampled from a seeded set of
 * Fourier modes with a documented ultraviolet cutoff and periodic boundary
 * conditions. Everything here is pure: no THREE, no DOM, no audio. The
 * visualization (js/visualizations/qft/field-lab.mjs) and the Node tests
 * consume exactly these numbers.
 *
 * Conventions: natural units c = ℏ = 1; the Klein-Gordon dispersion
 * ω(k) = sqrt(k² + m²) is exact for the free field. Mode amplitudes use the
 * vacuum normalization a_k = 1/sqrt(2ω_k) scaled by a seeded envelope, so the
 * sample is a deterministic classical analogue of a quantum state, not a
 * quantum trajectory.
 *
 * Honest boundaries (mirrored in the provenance record):
 * - The flux-tube overlay is a Nambu-Goto-style MODEL/ANALOGY for the
 *   chromatic field between static sources; it is not computed from lattice
 *   gauge data and must be labeled as an analogy wherever it renders.
 * - The "particle interpretation" counts modes in a band; occupation counts
 *   are an interpretation layer, never a depiction of observed particles.
 */

import { seededRng } from "../physics.mjs";
import { getVisualizationProvenance, registerVisualization } from "./provenance.mjs";

export const QFT_FIELD_LAB_VIEW_ID = "qft-field-lab";
export const QFT_FLUX_TUBE_VIEW_ID = "qft-flux-tube";

export const QFT_FIELD_DEFAULTS = Object.freeze({
  modes: 24,          // Fourier modes retained (deterministic subset below the cutoff)
  cutoffK: 14,        // UV cutoff: only |k| <= cutoffK contributes (documented)
  length: 4 * Math.PI,// spatial period L; k_n = 2πn/L (periodic BCs)
  mass: 1.2,          // scalar mass m in natural units
  history: 48,        // time slices kept for the 3-D waterfall
});

export const QFT_FIELD_PROVENANCE = Object.freeze({
  model: "Free massive scalar field φ(x,t) sampled from a seeded finite Fourier basis with UV cutoff |k| ≤ 14 and periodic boundary conditions",
  status: "effective",
  assumptions: [
    "Natural units c = ℏ = 1; Klein-Gordon dispersion ω(k) = sqrt(k² + m²) for a free field (no interactions)",
    "Mode amplitudes follow the vacuum normalization 1/sqrt(2ω_k) times a seeded envelope: a deterministic classical sample of the mode spectrum, not a quantum trajectory",
    "The mode set is a seeded subset of all integer wave numbers with |k| ≤ cutoff; the cutoff is a documented regulator, not a physical resonance",
  ],
  validity: [
    "Equal-time correlations are exact for the retained mode set; truncation below the cutoff underestimates short-distance correlations",
    "No interactions, no renormalization, no particle creation are modeled by this field",
  ],
  numericalMethod:
    "φ(x,t) = Σ_n a_n cos(k_n x − ω_n t + ϕ_n) evaluated pointwise; equal-time correlation C(r) = Σ_n (a_n²/2) cos(k_n r); "
    + "mode occupations counted in a documented frequency band",
  references: [
    "Prompt 07 spec: docs/superpowers/plans/2026-10-08-ultra-realistic-atlas-prompts.md",
    "Peskin & Schroeder, An Introduction to Quantum Field Theory, §2.2–2.5 (free-field mode expansion)",
  ],
});

export const QFT_FLUX_TUBE_PROVENANCE = Object.freeze({
  model: "Nambu-Goto-style flux-tube ANALOGY: transverse Gaussian energy-density profile between two static sources with a linear longitudinal tension",
  status: "schematic",
  assumptions: [
    "The tube profile is a model/analogy chosen for visual clarity; it is NOT computed from lattice gauge-field data",
    "Static (infinitely heavy) sources; no string breaking, no transverse oscillations (Lüscher broadening is not modeled)",
  ],
  validity: [
    "Qualitative only: the true non-Abelian field between heavy quarks requires lattice QCD; the Gaussian width and tension here are display parameters",
  ],
  numericalMethod:
    "ε(s, ρ) = tension · exp(−ρ²/w²) · edge taper, evaluated along the source axis s ∈ [0, separation] at transverse radius ρ; "
    + "width grows mildly toward the ends as a visual analogue of Lüscher broadening",
  references: [
    "Prompt 07 spec (flux tubes must be identified as a model/analogy unless computed from actual gauge-field data)",
    "Sommer, Lattice QCD and Heavy Quark Potentials (review) — flux tubes as a lattice-observable concept",
  ],
});

export function registerQftLabProvenance() {
  for (const record of [
    [QFT_FIELD_LAB_VIEW_ID, QFT_FIELD_PROVENANCE],
    [QFT_FLUX_TUBE_VIEW_ID, QFT_FLUX_TUBE_PROVENANCE],
  ]) {
    if (!getVisualizationProvenance(record[0])) registerVisualization(record[0], record[1]);
  }
  return { field: QFT_FIELD_PROVENANCE, fluxTube: QFT_FLUX_TUBE_PROVENANCE };
}

/**
 * Build the deterministic mode set. Wave numbers are the integers n with
 * 0 < |k_n| ≤ cutoffK (k_n = 2πn/L); a seeded shuffle keeps the first
 * `modes` of them, so increasing `modes` never changes the existing subset.
 */
export function buildFourierModes({
  seed = 42, modes = QFT_FIELD_DEFAULTS.modes, cutoffK = QFT_FIELD_DEFAULTS.cutoffK,
  length = QFT_FIELD_DEFAULTS.length, mass = QFT_FIELD_DEFAULTS.mass,
} = {}) {
  const n = Math.max(1, Math.min(256, Math.trunc(Number(modes)) || QFT_FIELD_DEFAULTS.modes));
  const kMax = Math.max(1, Math.min(64, Number(cutoffK) || QFT_FIELD_DEFAULTS.cutoffK));
  const L = Number(length) > 0 ? Number(length) : QFT_FIELD_DEFAULTS.length;
  const m = Math.max(0, Number(mass) || 0);
  const candidates = [];
  for (let i = 1; i <= 64; i++) {
    const k = (2 * Math.PI * i) / L;
    if (k > kMax) break;
    candidates.push(k);
  }
  if (candidates.length === 0) candidates.push((2 * Math.PI) / L);
  // Deterministic seeded selection: Fisher-Yates on a copy, take first n.
  const rng = seededRng(seed);
  const pool = candidates.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = pool.slice(0, Math.min(n, pool.length));
  // Deterministic phases and envelope amplitudes (uniform rng stream).
  const out = chosen.map((k) => {
    const omega = Math.sqrt(k * k + m * m);
    const vacuum = 1 / Math.sqrt(2 * omega);
    const envelope = 0.55 + 0.9 * rng();
    return { k, omega, amplitude: vacuum * envelope, phase: rng() * Math.PI * 2 };
  });
  out.sort((a, b) => a.k - b.k);
  return Object.freeze({
    seed: seed >>> 0, length: L, cutoffK: kMax, mass: m,
    modes: Object.freeze(out),
  });
}

/** φ(x, t) for the built mode set. */
export function sampleField(field, x, t) {
  let sum = 0;
  for (const mode of field.modes) {
    sum += mode.amplitude * Math.cos(mode.k * x - mode.omega * t + mode.phase);
  }
  return sum;
}

/**
 * Equal-time two-point correlation C(r) = ⟨φ(x)φ(x+r)⟩ for the mode sample
 * (mode-sum exact for this classical configuration; the ensemble average of
 * the same expression is the free-field Wightman function restricted to the
 * retained modes).
 */
export function equalTimeCorrelation(field, { samples = 96, maxOffset = null } = {}) {
  const count = Math.max(8, Math.min(512, Math.trunc(Number(samples)) || 96));
  const rMax = Number(maxOffset) > 0 ? Number(maxOffset) : field.length / 2;
  const out = new Array(count);
  for (let i = 0; i < count; i++) {
    const r = (rMax * i) / (count - 1);
    let c = 0;
    for (const mode of field.modes) c += 0.5 * mode.amplitude * mode.amplitude * Math.cos(mode.k * r);
    out[i] = { r, c };
  }
  return out;
}

/**
 * Flux-tube energy-density profile between two static sources (SCHEMATIC
 * analogy — see QFT_FLUX_TUBE_PROVENANCE). Returns a grid of samples along
 * the axis s and transverse radius ρ.
 */
export function fluxTubeProfile({
  separation = 6, tension = 1, transverseWidth = 0.55, axisSamples = 48, radialSamples = 12,
} = {}) {
  const sep = Math.max(0.5, Number(separation) || 6);
  const w0 = Math.max(0.05, Number(transverseWidth) || 0.55);
  const nS = Math.max(4, Math.min(256, Math.trunc(Number(axisSamples)) || 48));
  const nR = Math.max(2, Math.min(64, Math.trunc(Number(radialSamples)) || 12));
  const rows = [];
  for (let i = 0; i < nS; i++) {
    const s = sep * (i / (nS - 1));
    // Lüscher-broadening analogue: the tube flares near the sources.
    const edge = Math.min(s, sep - s) / sep;
    const w = w0 * (1 + 0.9 * Math.exp(-edge * 9));
    const taper = Math.min(1, 0.25 + 4 * edge); // soft ends
    const radial = new Array(nR);
    for (let j = 0; j < nR; j++) {
      const rho = (j / (nR - 1)) * 3 * w;
      radial[j] = { rho, density: tension * taper * Math.exp(-(rho * rho) / (w * w)) };
    }
    rows.push({ s, width: w, radial });
  }
  return { separation: sep, tension: Number(tension) || 1, rows };
}

/**
 * Optional particle interpretation: count modes whose ω falls in a band and
 * sum their occupation proxies a_k²ω_k / 2 (mode energy). This is an
 * INTERPRETATION layer over the mode decomposition — never a claim that
 * particles were observed.
 */
export function modeOccupation(field, { bandLow = 0, bandHigh = Infinity } = {}) {
  const lo = Number(bandLow) >= 0 ? Number(bandLow) : 0;
  const hi = Number.isFinite(Number(bandHigh)) ? Number(bandHigh) : Infinity;
  let count = 0, energy = 0;
  for (const mode of field.modes) {
    if (mode.omega >= lo && mode.omega <= hi) {
      count += 1;
      energy += 0.5 * mode.amplitude * mode.amplitude * mode.omega;
    }
  }
  return { count, energy, band: { low: lo, high: hi === Infinity ? null : hi } };
}

/** Export metadata for the QFT lab (mirrors gwInstrumentExportMetadata). */
export function qftFieldExportMetadata(state, runtime = {}) {
  return {
    qftFieldLab: {
      view: QFT_FIELD_LAB_VIEW_ID,
      mode: String(state?.qftLabMode || "field"),
      mass: Number(state?.qftLabMass ?? QFT_FIELD_DEFAULTS.mass),
      seed: Number(state?.seed ?? 42),
      cutoffK: QFT_FIELD_DEFAULTS.cutoffK,
      boundary: "periodic",
      runtime: {
        kind: runtime.kind || null,
        points: runtime.points || null,
        history: runtime.history || null,
        modes: runtime.modes || null,
        cutoffK: runtime.cutoffK || null,
      },
      provenance: {
        field: QFT_FIELD_PROVENANCE.status,
        fluxTube: QFT_FLUX_TUBE_PROVENANCE.status,
      },
    },
  };
}
