// LEP/SLD Z-pole results used by the electroweak figure (S16).
//
// Source: ALEPH, DELPHI, L3, OPAL, SLD and the LEP Electroweak Working Group, "Precision electroweak measurements on the Z resonance",
// Phys. Rep. 427, 257 (2006), arXiv:hep-ex/0509008. The arXiv PDF was downloaded and read with pdftotext on 2026-10-26; every number
// below is printed in the table named in its entry. No figure was digitised. They are the Z-pole pseudo-observables: deconvoluted for
// initial-state radiation and without the photon-exchange term, so they are compared with the tree-level line at the pole, not
// drawn as a scan.
//
// Units: nb, GeV, MeV; asymmetries and ratios are dimensionless.

import { REF } from "../references.mjs";

export const LEP_SOURCE = Object.freeze({
  citation: REF.LEP_SLC_2006,
  retrieved: "2026-10-26",
  licence: "Numbers (facts) are quoted from the tables; the paper's figures are not reproduced or digitised.",
});

const entry = (value, uncertainty, unit, table, note = "") => Object.freeze({ value, uncertainty, unit, table, note });

export const LEP_POLE = Object.freeze({
  mZ: entry(91.1875, 0.0021, "GeV", "Table 2.13, with lepton universality"),
  gammaZ: entry(2.4952, 0.0023, "GeV", "Table 2.13, with lepton universality"),
  sigmaHad0: entry(41.541, 0.037, "nb", "Table 2.13, without lepton universality",
    "41.540 +- 0.037 nb with lepton universality."),
  rMu0: entry(20.785, 0.033, "1", "Table 2.13, without lepton universality", "R_mu^0 = Gamma_had / Gamma_mumu."),
  afbMu0: entry(0.0169, 0.0013, "1", "Table 2.13, without lepton universality", "A_FB^{0,mu}. With lepton universality A_FB^{0,l} = 0.0171 +- 0.0010."),
  gammaMuMu: entry(83.99, 0.18, "MeV", "Table 7.1, without lepton universality"),
});

/** Correlation of sigma_had^0 with R_mu^0, printed in the same table (Table 2.13, row R_mu^0, column sigma_had^0). */
export const SIGMA_HAD_RMU_CORRELATION = 0.131;

/**
 * sigma_mumu^0 = sigma_had^0 / R_mu^0, since sigma_ff^0 = 12 pi Gamma_ee Gamma_ff / (M_Z^2 Gamma_Z^2) and R_mu^0 = Gamma_had / Gamma_mumu.
 * This is derived, not printed: the paper tabulates the two factors. The uncertainty uses the printed correlation.
 */
export function derivedMuonPoleCrossSection() {
  const { sigmaHad0, rMu0 } = LEP_POLE;
  const value = sigmaHad0.value / rMu0.value;
  const a = sigmaHad0.uncertainty / sigmaHad0.value;
  const b = rMu0.uncertainty / rMu0.value;
  const relative = Math.sqrt(a * a + b * b - 2 * SIGMA_HAD_RMU_CORRELATION * a * b);
  return Object.freeze({
    value,
    uncertainty: value * relative,
    unit: "nb",
    table: "derived from Table 2.13: sigma_had^0 / R_mu^0, correlation 0.131 from the same table",
  });
}
