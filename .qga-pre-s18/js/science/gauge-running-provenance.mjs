// Provenance of the two figures of the unification lab (S17): the running of the three gauge couplings and the magnified triangle.

import { getVisualizationProvenance, registerVisualization } from "./provenance.mjs";
import { REF } from "./references.mjs";

const SHARED_ASSUMPTIONS = [
  "Inputs at M_Z from the PDG 2026 review: MS-bar sin^2 theta_W = 0.23122(6), alpha_s = 0.1180(9), and alpha_em^-1 = 127.961 +- 0.014, which is derived (the 2026 review does not print it; the plan's 127.951 is the 2022 edition's value) from alpha(0), the leptonic and hadronic vacuum polarisation and the on-shell to MS-bar shift (ledger D-099)",
  "alpha_1 is the GUT-normalised hypercharge coupling, alpha_1 = (5/3) alpha_Y; the lines are the inverse couplings, straight at one loop",
  "Coefficients: the Standard Model b_i and b_ij from Buttazzo et al. 2013, appendix B.1 (their g^2 equations with the Yukawa couplings set to zero), the MSSM ones from Martin & Vaughn 1994, eq. (4.4)-(4.5); the original Machacek & Vaughn paper is behind a paywall and was not read",
  "Yukawa terms of the two-loop equations are omitted: an estimate from Buttazzo et al. eq. 96-98 with y_t(M_Z) about 0.95 puts them at 5 to 10 percent of the two-loop term at M_Z, and less above",
  "No threshold at the top mass: all six quarks run from M_Z (decoupling the top from alpha_em at M_Z would shift alpha_em^-1 by about 0.18)",
  "The MSSM is the Standard Model below the chosen M_SUSY (default 1 TeV) and the MSSM above it, with every superpartner at that one scale, the couplings continuous there and no matching corrections. No superpartner has been observed, so the MSSM lines are conjectural",
];

const EFFECTIVE_ENTRIES = {
  "rg-unification-couplings": {
    model: "The inverse gauge couplings alpha_i^-1 of U(1)_Y (GUT normalised), SU(2)_L and SU(3)_c against log10(mu/GeV) from M_Z to 10^19 GeV: two-loop running (solid) and the one-loop solution (dashed), in the Standard Model alone or with the MSSM above M_SUSY, with the 1 sigma band of the three inputs",
    status: "effective",
    assumptions: [...SHARED_ASSUMPTIONS,
      "The band is the propagated 1 sigma of the three inputs only (central differences of the run, added in quadrature); it does not contain the higher-order or threshold uncertainty, which dominates the real uncertainty of the unification test",
      "The GUT region (10^15 to 10^17 GeV) is a display convention that frames where the lines meet, not a derived range; M_Pl = 1.2209 x 10^19 GeV is computed from the SI constants"],
    validity: ["Perturbative at every scale shown (the largest coupling is alpha_3 = 0.12)", "The Standard Model with nothing new between M_Z and the Planck mass is itself a 17-decade extrapolation; the near-unification of the MSSM is a numerical coincidence of the coefficients, not a derivation of a grand unified theory"],
    numericalMethod: "Fixed-step RK4 in t = ln mu with steps of at most 0.1 (js/science/gauge-running.mjs); the one-loop run equals the analytic solution to 1e-9, the two-loop run an independent integration of Buttazzo et al. eq. 96-98 to 1e-6 (test/gauge-running.test.mjs)",
    references: [REF.PDG_2026, REF.STEINHAUSER_1998, REF.BUTTAZZO_2013, REF.MARTIN_VAUGHN_1994],
    layers: [{ name: "Inputs at the Z mass with 1 sigma errors", class: "data" }, { name: "Running lines, bands, scale, M_SUSY and Planck rules", class: "model" }, { name: "GUT region hatch", class: "decoration" }],
    seed: "none: deterministic integration",
  },
  "rg-unification-triangle": {
    model: "The triangle the three coupling lines enclose in the (log10 mu, alpha^-1) plane near their closest approach: its vertices are the pairwise crossings of the two-loop lines and its area is in decades times inverse coupling, for the Standard Model or the MSSM",
    status: "effective",
    assumptions: [...SHARED_ASSUMPTIONS,
      "The area depends strongly on M_SUSY and falls through a minimum near 2 TeV (0.0007 against 0.0090 at 1 TeV): with the Yukawa terms and the proper thresholds omitted, a very small MSSM triangle is a property of this model and not a statement that the couplings meet exactly"],
    validity: ["The Standard Model triangle (area 5.47) is large against the input bands (0.07 at most); the MSSM triangle (0.009) is smaller than the omitted Yukawa and threshold effects can shift it, so it indicates near-unification and nothing sharper"],
    numericalMethod: "Pairwise crossings by the first sign change of the difference of two lines, linearly interpolated on the 400-point grid; the area by the shoelace formula (js/science/gauge-running.mjs unificationTriangle); the window is the triangle's width plus a margin",
    references: [REF.PDG_2026, REF.STEINHAUSER_1998, REF.BUTTAZZO_2013, REF.MARTIN_VAUGHN_1994],
    layers: [{ name: "Inputs-derived lines and bands", class: "model" }, { name: "Triangle outline, vertices and the area label", class: "model" }, { name: "Z-mass input values the lines start from", class: "data" }],
    seed: "none: deterministic integration",
  },
};

// A caption carries the status its entry declares, so the MSSM view (conjectural) has entries of its own, identical in everything else.
const mssmVariant = (entry) => ({ ...entry, status: "conjectural", model: `${entry.model}. This entry is the view with the MSSM switched on, whose lines above M_SUSY are conjectural` });

export const GAUGE_RUNNING_PROVENANCE = Object.freeze({
  ...EFFECTIVE_ENTRIES,
  ...Object.fromEntries(Object.entries(EFFECTIVE_ENTRIES).map(([id, entry]) => [`${id}-mssm`, mssmVariant(entry)])),
});

/** Idempotent registration of the two unification figures in the shared provenance registry. */
export function registerGaugeRunningProvenance() {
  for (const [id, entry] of Object.entries(GAUGE_RUNNING_PROVENANCE)) {
    if (!getVisualizationProvenance(id)) registerVisualization(id, entry);
  }
}
