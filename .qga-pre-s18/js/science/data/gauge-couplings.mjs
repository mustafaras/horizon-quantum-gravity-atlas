// The electromagnetic input of the gauge-coupling running (S17): alpha_em^-1(M_Z) in the MS-bar scheme.
//
// The PDG 2026 review does not print this number (ledger D-069), and the plan's 127.951 is the value printed by the 2022 edition
// (127.951 +- 0.009, PTEP 2022 electroweak review); the 2024 edition prints 127.930 +- 0.008, with the older
// Delta alpha_had^(5) = 0.02783. Each edition differs because its hadronic input differs, so a number from one edition does not go with the
// sin^2 theta_W and alpha_s of another. The value used here is therefore derived from the 2026 inputs by the relation the PDG review
// states (Section 10.3.1):
//
//   alpha-hat^(5)(M_Z)^-1 = alpha(0)^-1 [ 1 - Delta alpha_lep - Delta alpha_had^(5) - (Delta alpha-hat - Delta alpha) ]
//
// alpha(0)^-1 and Delta alpha_had^(5) are read from the PDG 2026 PDF (pdftotext, 2026-10-26); the shift between the on-shell and the
// MS-bar Delta alpha is the PDG's eq. (10.21); the leptonic part is Steinhauser's three-loop sum (his Table 1), which the PDG review
// does not print. The same pipeline with the 2024 edition's Delta alpha_had returns 127.9299, which the 2024 review prints as 127.930: that is
// the check on the derivation (test/gauge-running.test.mjs).

import { REF } from "../references.mjs";

const PDG_2026_REVIEW = "https://pdg.lbl.gov/2026/reviews/rpp2026-rev-standard-model.pdf";
const RETRIEVED = "2026-10-26";
const source = (value, uncertainty, citation, locator, table) => Object.freeze({ value, uncertainty, citation, ...locator, table, retrieved: RETRIEVED });

export const GAUGE_INPUT_SOURCES = Object.freeze({
  alphaZeroInverse: source(137.035999177, 0.000000021, REF.PDG_2026, { url: PDG_2026_REVIEW }, "Electroweak review, eq. (10.19): alpha(0)^-1 = 137.035 999 177(21)"),
  deltaAlphaLep: source(314.97686e-4, 1e-6, REF.STEINHAUSER_1998, { doi: "10.1016/S0370-2693(98)00503-6", arxiv: "hep-ph/9803313" },
    "Table 1, e+mu+tau, sum of one, two and three loops: 314.97686 x 10^-4. The paper quotes no uncertainty; its three-loop term, 1.06 x 10^-6, is taken as the bound on what is left out"),
  deltaAlphaHad: source(0.02760, 0.00010, REF.PDG_2026, { url: PDG_2026_REVIEW }, "Electroweak review, Section 10.3.1: Delta alpha_had^(5)(M_Z^2) = 0.02760 +- 0.00010"),
  msbarShift: source(0.007123, 5e-6, REF.PDG_2026, { url: PDG_2026_REVIEW }, "Electroweak review, eq. (10.21): Delta alpha-hat - Delta alpha = 0.007123(1)(5), the two uncertainties added linearly"),
});

const { alphaZeroInverse: A0, deltaAlphaLep: LEP, deltaAlphaHad: HAD, msbarShift: SHIFT } = GAUGE_INPUT_SOURCES;

/** alpha-hat^(5)(M_Z)^-1 and its 1-sigma uncertainty, for a hadronic input other than the 2026 one when `deltaAlphaHad` is given. */
export function alphaEmInverseMZ({ deltaAlphaHad = HAD.value, deltaAlphaHadUncertainty = HAD.uncertainty } = {}) {
  const sum = LEP.value + deltaAlphaHad + SHIFT.value;
  const value = A0.value * (1 - sum);
  const uncertainty = Math.hypot(A0.uncertainty * (1 - sum), A0.value * LEP.uncertainty, A0.value * deltaAlphaHadUncertainty, A0.value * SHIFT.uncertainty);
  return Object.freeze({ value, uncertainty });
}

/** The value the lab uses: derived from the PDG 2026 inputs. About 127.961 +- 0.014. */
export const ALPHA_EM_INVERSE_MZ = alphaEmInverseMZ();

/** The plan's number, PDG 2022 edition; kept only so the plan's checks (59.020, 29.585, 8.475) can be reproduced. */
export const ALPHA_EM_INVERSE_PLAN = 127.951;
