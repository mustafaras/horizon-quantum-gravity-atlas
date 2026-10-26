/*
 * Provenance of the Formula Lens figures (S10): one registered entry per scene the lens is wired into. The outlines
 * are decoration (they point at where a term lives), the field is the model layer, and the numbers the lens
 * reports are evaluations of the Formula Core terms, never simulation output. Every lens figure is schematic
 * about where or how large it draws the term, and says so in-canvas.
 */

import { getVisualizationProvenance, registerVisualization } from "../../science/provenance.mjs";

const SCHWARZSCHILD = "Schwarzschild, On the gravitational field of a mass point according to Einstein's theory (1916), arXiv:physics/9905030";
const EINSTEIN_1916 = "Einstein, Die Grundlage der allgemeinen Relativitätstheorie, Ann. Phys. 354, 769 (1916), doi:10.1002/andp.19163540702";
const MONTVAY_MUENSTER = "Montvay & Münster, Quantum Fields on a Lattice, Cambridge University Press (1994), doi:10.1017/CBO9780511470783";
const HAIRER_LUBICH_WANNER = "Hairer, Lubich & Wanner, Geometric numerical integration illustrated by the Störmer–Verlet method, Acta Numerica 12, 399–450 (2003), doi:10.1017/S0962492902000144";
const CODATA = "Tiesinga, Mohr, Newell & Taylor, CODATA recommended values of the fundamental physical constants: 2018, Rev. Mod. Phys. 93, 025010 (2021), doi:10.1103/RevModPhys.93.025010";

export const FORMULA_LENS_PROVENANCE = Object.freeze({
  "formula-lens-kerr-observatory": {
    model: "The Schwarzschild radius r_s = 2GM/c^2 drawn as three great circles of the coordinate sphere of that radius at the centre of the Kerr observatory scene, and the black-hole mass M of the mass slider",
    status: "schematic",
    assumptions: [
      "Lengths are in units of GM/c^2, the world unit of the scene, so the circles have radius 2",
      "The circles are the non-rotating coordinate sphere and are not lensed; the ray-traced shadow is larger than r_s",
      "For a nonzero spin the Kerr outer horizon r_+ = M + sqrt(M^2 - a^2) is smaller than r_s; the circles still mark r_s",
    ],
    validity: ["Exact for the Schwarzschild radius of the slider mass; marks the horizon only at spin a* = 0"],
    numericalMethod: "The radius and the mass are evaluations of the Formula Core terms r_s and M in float64 (js/formula/lens.mjs); nothing is simulated",
    references: [SCHWARZSCHILD, CODATA],
    layers: [{ name: "Schwarzschild-radius circles and mass readout", class: "model" }, { name: "Observatory scene outside the circles", class: "decoration" }],
    seed: "none: closed forms only",
  },
  "formula-lens-curvature-well": {
    model: "The Newtonian potential Phi/c^2 = -GM/(r c^2) painted over the embedding-diagram surface of the curvature engine as a viridis heat map of the formula term",
    status: "schematic",
    assumptions: [
      "G = c = 1 and lengths in scene units, with the source mass GM = 0.55 times the mass slider; the scale is a display choice",
      "The potential is evaluated at the radial distance from the centre and is clamped inside the central star",
      "The surface height of the well is a softened embedding intuition; the colour is the potential, not the height",
    ],
    validity: ["Weak-field, slow-motion limit (r much greater than GM/c^2)", "Colour range spans the slider range of the mass over the visible radii"],
    numericalMethod: "The term is compiled from the formula AST to a TSL node (js/formula/to-tsl.mjs) and evaluated per pixel on the GPU; the same AST is compared with the float32 JavaScript evaluation in qa/specs/formula-lens.spec.mjs",
    references: [EINSTEIN_1916, CODATA],
    layers: [{ name: "Newtonian potential field on the well", class: "model" }, { name: "Well surface shading outside the field", class: "decoration" }],
    seed: "none: closed forms only",
  },
  "formula-lens-qft-lattice": {
    model: "The four terms of the phi^4 Hamiltonian density, kinetic pi^2/2, gradient (grad phi)^2/2, mass m^2 phi^2/2 and interaction lambda phi^4/24, painted over the surface of the QFT lattice laboratory as heat maps of the formula term, computed on the GPU from the field's current state",
    status: "effective",
    assumptions: [
      "Classical field on the lattice in lattice units (spacing 0.25, hbar = c = 1); each term is the energy per site, not per unit area",
      "The terms are evaluated from the per-vertex values of phi, the synchronised pi and the squared gradient, interpolated between sites: exact at a site, the term of the interpolated field between sites",
      "The colour range is 1.5 times the 99th percentile of the term in the preset's initial state, so a later burst of energy saturates at the top of the scale; the mass term is symmetric about zero and diverging",
      "The value on the card is the term at the root-mean-square phi, pi and gradient of the lattice, not the mean of the term",
    ],
    validity: ["Exact at the lattice sites for the current state of the simulation; the scheme conserves the energy to order (omega dt)^2"],
    numericalMethod: "Each term is compiled from the Formula Core AST to a TSL node (js/formula/to-tsl.mjs) bound to the simulation's buffers; the same AST is compared with the CPU lattice terms in test/lattice-field.test.mjs and with its float32 evaluation in qa/specs/formula-gpu.spec.mjs",
    references: [MONTVAY_MUENSTER, HAIRER_LUBICH_WANNER],
    layers: [{ name: "Hamiltonian-density terms on the lattice", class: "model" }, { name: "Lattice surface shading outside the field", class: "decoration" }],
    seed: "URL state seed for the vacuum sample; the terms themselves are closed forms of the state",
  },
  "formula-lens-casimir-cavity": {
    model: "The terms of P = -pi^2 hbar c / (240 a^4) in the Casimir cavity scene: the gap a is outlined between the plates, and hbar and c show the mark P proportional to hbar c under the pressure readout drawn in the scene, with the value of the focused term on its card",
    status: "schematic",
    assumptions: [
      "The outline marks where the gap is; the drawn width is a log map of the true gap, not its length",
      "hbar and c are not places in the scene: they mark the readout, which is where they enter the number, with the proportionality P ~ hbar c",
    ],
    validity: ["The values are evaluations of the Formula Core terms at the gap of the slider, CODATA 2018 constants"],
    numericalMethod: "Evaluations of the Formula Core terms in float64 (js/formula/lens.mjs); nothing is simulated",
    references: [CODATA],
    layers: [{ name: "Gap outline and pressure readout", class: "model" }, { name: "Plates and grids", class: "decoration" }],
    seed: "none: closed forms only",
  },
  "formula-lens-planck-descent": {
    model: "Each physical constant of l_P = sqrt(hbar G / c^3) is associated with the decade gate of the descent where its physics first governs: hbar at the atomic gate, c at the nuclear gate, G at the Planck gate",
    status: "schematic",
    assumptions: [
      "The association of a constant with a gate is didactic and comes from the regime notes of the ladder; it is not a measured threshold",
      "hbar: quantum mechanics governs atomic structure; c: the probe energy hbar c / l is about 0.2 GeV at 10^-15 m; G: G E^2 / (hbar c^5) reaches 1 at the Planck scale",
    ],
    validity: ["The values of the constants are CODATA 2018 and exact to their uncertainty; the placement of the gates is qualitative"],
    numericalMethod: "The values are the declared SI constants of Formula Core; the gate rings are the existing ladder rings",
    references: [CODATA],
    layers: [{ name: "Constant gates of the Planck-length formula", class: "model" }, { name: "Descent rings, probe glow and backdrop", class: "decoration" }],
    seed: "none: closed forms only",
  },
});

/** Register the entries once (safe to call again). */
export function registerFormulaLensProvenance() {
  for (const [id, entry] of Object.entries(FORMULA_LENS_PROVENANCE)) {
    if (!getVisualizationProvenance(id)) registerVisualization(id, entry);
  }
}
