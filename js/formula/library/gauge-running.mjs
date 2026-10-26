/* The one-loop solution of the gauge-coupling running (S17): a straight line in ln mu for the inverse coupling. */

import { defineFormula } from "../formula.mjs";
import { sub, div, mul, log, term, PI } from "../expr.mjs";

const PDG_2026 = { citation: "Particle Data Group (Takahashi et al.), Review of Particle Physics, Int. J. Mod. Phys. A 41, 2630011 (2026), Electroweak model and constraints on new physics", url: "https://pdg.lbl.gov/2026/reviews/rpp2026-rev-standard-model.pdf", retrieved: "2026-10-26" };
const BUTTAZZO = { citation: "Buttazzo, Degrassi, Giardino, Giudice, Sala, Salvio & Strumia, Investigating the near-criticality of the Higgs boson, JHEP 12 (2013) 089, appendix B", doi: "10.1007/JHEP12(2013)089", arxiv: "1307.3536", retrieved: "2026-10-26" };
const MARTIN_VAUGHN = { citation: "Martin & Vaughn, Two-loop renormalization group equations for soft supersymmetry-breaking couplings, Phys. Rev. D 50, 2282 (1994), eq. (4.4)", doi: "10.1103/PhysRevD.50.2282", arxiv: "hep-ph/9311340", retrieved: "2026-10-26" };

/** alpha_i^-1(mu) = alpha_i^-1(M_Z) - (b_i / 2 pi) ln(mu / M_Z), with alpha_1 in the GUT normalisation. */
export const gaugeRunningOneLoop = defineFormula({
  id: "gauge-running-one-loop", title: "One-loop running of a gauge coupling", status: "effective",
  symbols: {
    ainv0: { tex: "\\alpha_i^{-1}(M_Z)", unit: "1", dims: {}, description: "inverse coupling at the Z mass, from the measured alpha_em, sin^2 theta_W and alpha_s" },
    b: { tex: "b_i", unit: "1", dims: {}, description: "one-loop coefficient: (41/10, -19/6, -7) in the Standard Model, (33/5, 1, -3) in the MSSM" },
    mu: { tex: "\\mu", unit: "GeV", dims: { M: 1, L: 2, T: -2 }, description: "renormalisation scale" },
    MZ: { tex: "M_Z", unit: "GeV", dims: { M: 1, L: 2, T: -2 }, description: "mass of the Z boson, where the couplings are measured" },
  },
  output: { tex: "\\alpha_i^{-1}(\\mu)", unit: "1", dims: {} },
  expr: term("ainv", sub(term("inputs", "ainv0"), mul(term("b_over_2pi", div("b", mul(2, PI))), term("ln_mu_over_MZ", log(div("mu", "MZ")))))),
  domain: { ainv0: [5, 60, "lin"], b: [-7, 7, "lin"], mu: [91.1876, 1.22e19, "log"], MZ: [91, 92, "lin"] },
  references: [PDG_2026, BUTTAZZO, MARTIN_VAUGHN],
});
