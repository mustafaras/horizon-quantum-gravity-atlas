// Provenance entries for every Figure Kit figure. Layer classes are carried by each mark
// (`data` or `model`); the entries below state what the figure is and what it is not.

import { getVisualizationProvenance, registerVisualization } from "../science/provenance.mjs";

const PDG = "Particle Data Group, Review of Particle Physics, PTEP 2022, 083C01, doi:10.1093/ptep/ptac097";
const HAWKING = "Hawking, Particle creation by black holes, Commun. Math. Phys. 43, 199 (1975), doi:10.1007/BF02345020";
const PAGE = "Page, Information in black hole radiation, Phys. Rev. Lett. 71, 3743 (1993), doi:10.1103/PhysRevLett.71.3743";

export const FIGURE_PROVENANCE = Object.freeze({
  "sm-neutrino-oscillation": {
    model: "Two-flavour vacuum neutrino oscillation P = sin^2(2 theta) sin^2(1.27 dm2 L/E)",
    status: "established",
    assumptions: ["Two-flavour approximation of the three-flavour PMNS mixing", "Vacuum propagation; matter effects are neglected", "Defaults are the atmospheric values dm2_32 ~ 2.5e-3 eV^2 and sin^2 2 theta_23 ~ 0.98"],
    validity: ["L/E from 0 to 1200 km/GeV", "Muon-neutrino survival and tau appearance only"],
    numericalMethod: "Closed form sampled at 301 points; no fitting",
    references: [PDG],
  },
  "sm-higgs-potential": {
    model: "Radial slice of V(phi) = mu^2 phi^2 + lambda phi^4 with lambda = 1",
    status: "schematic",
    assumptions: ["Dimensionless units with lambda = 1; the vertical scale is not the physical electroweak scale", "The slice is the radial direction of the complex doublet"],
    validity: ["Qualitative shape of the symmetric and broken phases only"],
    numericalMethod: "Closed form sampled at 241 points",
    references: [PDG],
  },
  "bh-hawking-spectrum": {
    model: "Planck spectral shape x^3 / (exp(x/T) - 1), normalised to its peak",
    status: "schematic",
    assumptions: ["Visual temperature maps the mass and spin sliders to a shift of the peak; the absolute scale is illustrative", "Greybody factors are not included"],
    validity: ["Peak position trend with mass and spin"],
    numericalMethod: "Closed form sampled at 201 points",
    references: [HAWKING],
  },
  "bh-page-curve": {
    model: "Unitary Page curve S = min(thermal, remaining) against the semiclassical rising entropy",
    status: "schematic",
    assumptions: ["Piecewise-linear Page curve with the peak at half the evaporation", "Entropies are normalised, not in bits"],
    validity: ["Shape of the curve; the Page time is the midpoint by construction"],
    numericalMethod: "Closed form sampled at 101 points",
    references: [PAGE, HAWKING],
  },
});

/** Idempotent registration of every figure above in the shared provenance registry. */
export function registerFigureProvenance() {
  for (const [id, entry] of Object.entries(FIGURE_PROVENANCE)) {
    if (!getVisualizationProvenance(id)) registerVisualization(id, entry);
  }
}
