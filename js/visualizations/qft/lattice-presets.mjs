/**
 * The lattice lab's starting points (S14): what each preset is, its initial field, and the display scales read off it. Pure, imports in Node.
 *
 * A preset fixes m^2 and lambda (the sliders move them afterwards) and an initial condition of js/science/lattice-field.mjs. The display scales
 * (height per unit of phi, set so the 99th percentile of |phi| stands `heightAtP99` world units high, the top of the energy colour range, the range of each Formula Lens term) come from the initial field, so a preset
 * shows its own dynamic range whatever the lattice size.
 */

import {
  createLattice, kink, toStaggered, vacuumLike, wavepacket, energyDensity, energyTerms, fromStaggered,
} from "../../science/lattice-field.mjs";
import { LATTICE_VIEW } from "./lattice-plan.mjs";

export const LATTICE_PRESETS = Object.freeze({
  vacuum: Object.freeze({
    id: "vacuum", label: "Vacuum sample", mass2: 1, lambda: 0.5, contour: false, heightAtP99: 0.8,
    hint: "a seeded sample of the free-field vacuum fluctuations, then the quartic coupling takes over",
  }),
  packets: Object.freeze({
    id: "packets", label: "Colliding packets", mass2: 0.5, lambda: 1, contour: false, heightAtP99: 1.7,
    hint: "two wave packets head on: with $\\lambda=0$ they pass through each other, with $\\lambda>0$ they scatter",
  }),
  kink: Object.freeze({
    id: "kink", label: "Kink walls", mass2: -0.5, lambda: 3, contour: true, heightAtP99: 1.7,
    hint: "$m^2<0$: two vacua at $\\pm v$ and a domain wall between them, static by construction; the focal line is $\\phi=0$",
  }),
});

const PHI_FLOOR = 0.3, ENERGY_FLOOR = 0.02, TERM_FLOOR = 0.02;
const ENERGY_HEADROOM = 1.5;

/** The q-quantile of the absolute values of an array (nearest rank). */
export function quantile(values, q) {
  if (!(q >= 0 && q <= 1)) throw new RangeError(`quantile: q must be in [0, 1], received ${q}`);
  const sorted = Float64Array.from(values, Math.abs).sort();
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

/** The seed of the k-th click's kick: a pure function of the URL seed and the click count. */
export const kickSeed = (seed, count) => (Number(seed) * 31 + count * 0x9e3779b1) >>> 0;

/**
 * The couplings the simulation runs with. For m^2 < 0 a vanishing lambda leaves the potential unbounded below (the field would grow without
 * bound), so the quartic coupling never goes below LAMBDA_FLOOR there; the slider keeps its value and the readout says so.
 */
export const LAMBDA_FLOOR = 0.25;
export function safeCouplings(mass2, lambda) {
  return { mass2, lambda: mass2 < 0 ? Math.max(lambda, LAMBDA_FLOOR) : lambda };
}

/** The potential's value in the vacuum, so that the display shows the energy above it: -3 m^4 / (2 lambda) for m^2 < 0, else 0. */
export const vacuumLevel = (mass2, lambda) => (mass2 < 0 && lambda > 0 ? (-3 * mass2 * mass2) / (2 * lambda) : 0);

function initialField(id, params, seed) {
  if (id === "vacuum") return vacuumLike(params, seed);
  if (id === "packets") return wavepacket(params);
  if (id === "kink") return kink(params);
  throw new RangeError(`lattice preset: unknown "${id}" (known: ${Object.keys(LATTICE_PRESETS).join(", ")})`);
}

/**
 * @param id    a key of LATTICE_PRESETS
 * @param n     sites per side (a power of two)
 * @param seed  the URL seed
 * @param dt    the step length the first GPU step will use (it sets the momentum's half-step offset)
 * @returns { params, state, staggered (Float32Array pairs for the GPU), scales }
 */
export function presetStart(id, { n, seed, dt }) {
  const preset = LATTICE_PRESETS[id];
  if (!preset) throw new RangeError(`lattice preset: unknown "${id}" (known: ${Object.keys(LATTICE_PRESETS).join(", ")})`);
  const params = createLattice({ dim: 2, n, a: LATTICE_VIEW.spacing, mass2: preset.mass2, lambda: preset.lambda, dt });
  const state = initialField(id, params, seed);
  const staggered = toStaggered(params, state);
  const synchronised = fromStaggered(params, staggered);
  const base = vacuumLevel(preset.mass2, preset.lambda);
  const density = energyDensity(params, synchronised).map((v) => v - base);
  const terms = energyTerms(params, synchronised);
  const range = (values) => Math.max(TERM_FLOOR, ENERGY_HEADROOM * quantile(values, 0.99));
  return {
    params, state,
    staggered: { phi: Float32Array.from(staggered.phi), pi: Float32Array.from(staggered.pi) },
    scales: {
      phi: Math.max(PHI_FLOOR, quantile(state.phi, 0.99)),
      height: preset.heightAtP99 / Math.max(PHI_FLOOR, quantile(state.phi, 0.99)),
      energy: Math.max(ENERGY_FLOOR, ENERGY_HEADROOM * quantile(density, 0.99)),
      terms: { kinetic: range(terms.kinetic), gradient: range(terms.gradient), mass: range(terms.mass), interaction: range(terms.interaction) },
    },
  };
}
