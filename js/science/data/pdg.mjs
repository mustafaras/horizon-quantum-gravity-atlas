// Standard Model inputs of the Higgs lab (S13), from the 2026 edition of the Review of Particle Physics.
//
// Every value below was read from the PDG 2026 summary tables and reviews (pdftotext of the PDFs at pdg.lbl.gov/2026, retrieved
// 2026-10-24): "Gauge and Higgs bosons" (M_W, M_Z, m_H), "Quarks" (m_t), the "Physical constants" booklet (G_F, M_W, M_Z, alpha_s,
// sin^2 theta_W) and Table 10.2 of "Electroweak model and constraints on new physics" (sin^2 theta_W). The plan quoted the 2024
// edition (m_H = 125.20, G_F = 1.1663788e-5, M_W = 80.3692); the 2026 edition differs, so the source wins (ledger D-069).
//
// Units: masses in GeV, G_F in GeV^-2, alpha_s and sin^2 theta_W dimensionless.

import { REF } from "../references.mjs";

export const PDG_SOURCE = Object.freeze({
  edition: "PDG 2026",
  citation: REF.PDG_2026,
  retrieved: "2026-10-24",
  note: "Read from the PDF summary tables and reviews with pdftotext; the journal DOI of the 2026 edition is not yet in Crossref, so the citation is the review's URL.",
});

const entry = (value, uncertainty, unit, table, note = "") => Object.freeze({ value, uncertainty, unit, table, note });

export const PDG = Object.freeze({
  GF: entry(1.1663785e-5, 6e-12, "GeV^-2", "Physical constants: G_F/(hbar c)^3 = 1.166 378 5(6) x 10^-5 GeV^-2"),
  mH: entry(125.13, 0.11, "GeV", "Gauge and Higgs bosons: H, mass m = 125.13 +- 0.11 GeV (S = 1.5)"),
  mt: entry(172.60, 0.27, "GeV", "Quarks: t, mass (direct measurements) m = 172.60 +- 0.27 GeV (S = 1.5)",
    "The direct-measurement average, used as the pole mass as the literature does; it is ambiguous by about Lambda_QCD (PDG footnote). The pole mass from cross sections is 172.1 +- 0.6 GeV."),
  MZ: entry(91.1879, 0.0020, "GeV", "Gauge and Higgs bosons: Z, mass m = 91.1879 +- 0.0020 GeV"),
  MW: entry(80.3625, 0.0077, "GeV", "Gauge and Higgs bosons: W, mass m = 80.3625 +- 0.0077 GeV"),
  alphaS: entry(0.1180, 0.0009, "1", "Physical constants: alpha_s(m_Z) = 0.1180(9)"),
  sin2ThetaW: entry(0.23122, 0.00006, "1", "Electroweak review, Table 10.2: MS-bar sin^2 theta_W(M_Z) = 0.23122 +- 0.00006"),
});

/** Quantities the plan lists that this edition does not print as a number, and so are not shipped. */
export const PDG_OMITTED = Object.freeze([
  Object.freeze({
    quantity: "alpha_em^-1(M_Z) in the MS-bar scheme",
    reason: "Neither the 2024 nor the 2026 edition prints it; the 2026 review gives only Delta alpha_had^(5)(M_Z) = 0.02760 +- 0.00010. The gauge couplings are therefore fixed from M_Z, v and the MS-bar angle instead (js/science/higgs-running.mjs).",
  }),
]);
