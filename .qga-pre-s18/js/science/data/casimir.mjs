// Casimir measurements for the cavity lab (S15): the agreement each experiment reports, as bands, and the one caveat the caption carries.
//
// Every number below was read from the paper itself on 2026-10-25: Bressi et al. from the arXiv v1 PDF (quant-ph/0203002), Lamoreaux
// from the Physical Review Letters PDF of the paper; DOIs and bibliographic data were checked against Crossref (api.crossref.org) on
// the same day; Jaffe's title, journal reference and abstract were read on arxiv.org/abs/hep-th/0503158. The arXiv text of Bressi et al.
// is version 1 of March 2002; the published Letter was not read, and a difference between them would not be visible here.
//
// Units: gaps in metres, force coefficients in N m^2 (pressure = K / a^4), agreements as fractions.

import { REF } from "../references.mjs";

const RETRIEVED = "2026-10-25";

export const CASIMIR_SOURCES = Object.freeze({
  bressi2002: Object.freeze({
    citation: "Bressi, Carugno, Onofrio & Ruoso, Measurement of the Casimir force between parallel metallic surfaces, Phys. Rev. Lett. 88, 041804 (2002)",
    doi: "10.1103/PhysRevLett.88.041804", arxiv: "quant-ph/0203002", retrieved: RETRIEVED,
  }),
  lamoreaux1997: Object.freeze({
    citation: "Lamoreaux, Demonstration of the Casimir force in the 0.6 to 6 μm range, Phys. Rev. Lett. 78, 5 (1997)",
    doi: "10.1103/PhysRevLett.78.5", retrieved: RETRIEVED,
  }),
  jaffe2005: Object.freeze({
    citation: "Jaffe, The Casimir effect and the quantum vacuum, Phys. Rev. D 72, 021301 (2005)",
    doi: "10.1103/PhysRevD.72.021301", arxiv: "hep-th/0503158", retrieved: RETRIEVED,
  }),
  bordag2001: Object.freeze({ citation: "Bordag, Mohideen & Mostepanenko, New developments in the Casimir effect, Phys. Rep. 353, 1 (2001)", doi: "10.1016/S0370-1573(01)00015-1", retrieved: RETRIEVED }),
  codata2018: Object.freeze({ citation: REF.CODATA, doi: "10.1103/RevModPhys.93.025010", retrieved: RETRIEVED }),
});

export const CASIMIR_DATA = Object.freeze({
  bressi2002: Object.freeze({
    source: "bressi2002",
    configuration: "parallel plates: a chromium-coated silicon cantilever facing a rigid chromium-coated surface, force read from the shift of the cantilever frequency",
    range: Object.freeze([0.5e-6, 3.0e-6]),
    coefficient: Object.freeze({ value: 1.22e-27, uncertainty: 0.18e-27, unit: "N m^2", note: "K_C of eq. (4), P = K_C / d^4" }),
    reportedIdealCoefficient: Object.freeze({ value: 1.3e-27, unit: "N m^2", note: "the paper's own K_C = pi h c / 480" }),
    reportedPrecision: 0.15,
    reportedText: "the scaling of the force was tested in the 0.5-3.0 μm range and the force coefficient determined at the 15% precision level; the fit does not follow the points systematically between 1 and 2 μm",
  }),
  lamoreaux1997: Object.freeze({
    source: "lamoreaux1997",
    configuration: "sphere and flat plate (gold over copper on quartz), torsion pendulum; the proximity force theorem maps the parallel-plate result to the sphere, F = 2 pi R E",
    range: Object.freeze([0.6e-6, 6e-6]),
    reportedAgreement: 0.05,
    reportedText: "agreement with theory at the level of 5%; the thermal correction and a finite-conductivity correction (no more than 3% by the author's estimate) were not resolved",
  }),
  digitisedPoints: Object.freeze({
    committed: false,
    reason: "The measured points are drawn in Figure 4 of each Letter. The American Physical Society grants permission to republish graphs case by case and states that blanket permissions are not granted (journals.aps.org/copyrightFAQ.html, read 2026-10-25); no permission was requested, so no figure licence covers a reuse and no point is digitised and only the numbers printed in the text and abstracts are committed.",
  }),
  caveat: Object.freeze({
    source: "jaffe2005",
    text: "Jaffe: Casimir forces can be computed without reference to zero-point energies, as relativistic quantum forces between charges and currents; the vacuum-energy reading here is one route to the same number, not the only one.",
  }),
});
