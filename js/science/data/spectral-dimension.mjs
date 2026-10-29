/**
 * The spectral dimension across quantum-gravity programs (S23).
 *
 * This is the one place where the field has a genuinely quantitative cross-program comparison. The spectral
 * dimension d_s is read off the return probability of a diffusion process, P(σ) ∼ σ^(−d_s/2), so a random walk
 * measures how many dimensions it effectively sees at the probed scale.
 *
 * The different programs do not compute the same thing: some quote a lattice measurement, some a functional
 * renormalisation-group flow, some a semiclassical argument. The values are therefore *comparable in shape*, not
 * in provenance, and the figure says so in canvas.
 *
 * Every value below was checked against its source; the retrieval date is recorded with each entry.
 */

import { REF } from "../references.mjs";

const source = (reference, retrieved = "2026-10-29") => Object.freeze({ reference, retrieved });

/**
 * One curve per program: `ir` is the large-scale (infrared) dimension, `uv` the short-distance one. A program
 * that predicts no running has `uv === ir`.
 */
const ENTRIES = [
  {
    id: "cdt4",
    label: "4D CDT",
    ir: 4.02,
    uv: 1.8,
    kind: "measured",
    note: "Lattice measurement: the diffusion process is run on the triangulations themselves, so this is the one entry that is a computed number rather than an analytic expectation.",
    source: source(REF.AMBJORN_JURKIEWICZ_LOLL_2005),
  },
  {
    id: "asymsafe",
    label: "Asymptotic safety",
    ir: 4,
    uv: 2,
    kind: "computed",
    note: "Functional renormalisation group on an Einstein–Hilbert truncation, from the anomalous dimension of the graviton.",
    source: source(REF.LAUSCHER_REUTER_2005),
  },
  {
    id: "lqg",
    label: "Loop quantum gravity",
    ir: 4,
    uv: 2,
    kind: "computed",
    note: "Semiclassical analysis of the spin-foam / loop-gravity path integral; the short-distance value depends on the chosen boundary state.",
    source: source(REF.MODESTO_2009),
  },
  {
    id: "horava",
    label: "Hořava–Lifshitz",
    ir: 4,
    uv: 2,
    kind: "computed",
    note: "Follows from the anisotropic scaling z = 2 in the ultraviolet: the spectral dimension is the exponent the diffusion sees.",
    source: source(REF.HORAVA_2009),
  },
  {
    id: "causalset",
    label: "Causal sets",
    ir: 4,
    uv: 2,
    kind: "computed",
    note: "Diffusion on a sprinkled causal set; the value drifts with the sprinkling density, so the curve is a trend rather than a sharp number.",
    source: source(REF.EICHHORN_MIZERA_2014),
  },
];

export const SPECTRAL_DIMENSION = Object.freeze(ENTRIES.map(Object.freeze));

/** The overview this table is read against. */
export const SPECTRAL_DIMENSION_OVERVIEW = REF.CARLIP_2017;

/**
 * The convergence the figure highlights: every program that predicts running agrees on 4 → 2, and they differ in
 * *how* the dimension gets there. This is what makes the comparison worth drawing, and what limits it.
 */
export function convergenceSummary() {
  const running = SPECTRAL_DIMENSION.filter((e) => e.uv !== e.ir);
  const uvValues = running.map((e) => e.uv);
  return {
    count: running.length,
    total: SPECTRAL_DIMENSION.length,
    allFourInInfrared: SPECTRAL_DIMENSION.every((e) => Math.abs(e.ir - 4) < 0.05),
    uvMin: Math.min(...uvValues),
    uvMax: Math.max(...uvValues),
    uvMean: uvValues.reduce((a, b) => a + b, 0) / uvValues.length,
    cdtIsMeasured: SPECTRAL_DIMENSION.filter((e) => e.kind === "measured").map((e) => e.id),
  };
}

export const SPECTRAL_DIMENSION_PROVENANCE = Object.freeze({
  id: "approaches-spectral-dimension",
  model:
    "Spectral dimension d_s in the infrared and ultraviolet, collected from five quantum-gravity programs and read against the field review",
  status: "effective",
  assumptions: Object.freeze([
    "The programs define d_s differently: a lattice diffusion measurement, a functional RG anomalous dimension, a semiclassical spin-foam estimate and an anisotropic-scaling exponent are not interchangeable",
    "Values are quoted at whichever scale each program calls infrared and ultraviolet; the crossover scale differs and is not shown",
    "Only the 4D CDT entry is a direct measurement on the theory's own configurations",
  ]),
  validity: Object.freeze([
    "The shared 4 → 2 shape is a qualitative agreement, not a measurement of a common theory",
    "No experiment measures d_s at either end of these curves",
  ]),
  numericalMethod: "Literature values transcribed with their citations; the convergence summary is a plain statistic over them",
  references: Object.freeze([
    REF.AMBJORN_JURKIEWICZ_LOLL_2005,
    REF.LAUSCHER_REUTER_2005,
    REF.MODESTO_2009,
    REF.HORAVA_2009,
    REF.EICHHORN_MIZERA_2014,
    REF.CARLIP_2017,
  ]),
  layers: Object.freeze([
    { name: "Spectral-dimension endpoints per program", class: "data" },
    { name: "Connecting curves and the infrared/ultraviolet labels", class: "model" },
  ]),
  seed: "none: the table is literature data",
});

export function registerSpectralDimensionProvenance(register) {
  return register(SPECTRAL_DIMENSION_PROVENANCE.id, SPECTRAL_DIMENSION_PROVENANCE);
}
