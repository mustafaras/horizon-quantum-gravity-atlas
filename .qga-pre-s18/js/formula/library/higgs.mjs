/* The Higgs potential in units of its vacuum (S13): the dimensionless form the Mexican-hat surface is compiled from, and the tree-level quartic. */

import { defineFormula } from "../formula.mjs";
import { sub, div, mul, pow, term } from "../expr.mjs";

const BUTTAZZO = { citation: "Buttazzo, Degrassi, Giardino, Giudice, Sala, Salvio & Strumia, Investigating the near-criticality of the Higgs boson, JHEP 12 (2013) 089", doi: "10.1007/JHEP12(2013)089", arxiv: "1307.3536", retrieved: "2026-10-24" };
const HIGGS_1964 = { citation: "Higgs, Broken symmetries and the masses of gauge bosons, Phys. Rev. Lett. 13, 508 (1964)", doi: "10.1103/PhysRevLett.13.508", retrieved: "2026-10-24" };
const PDG_2026 = { citation: "Particle Data Group (Takahashi et al.), Review of Particle Physics, Int. J. Mod. Phys. A 41, 2630011 (2026)", url: "https://pdg.lbl.gov/2026/", retrieved: "2026-10-24" };

/** V / (lambda v^4) = x^4 / 4 - s x^2 / 2 with x = h / v (h is the radial field, |H| = h / sqrt2) and s = mu^2 / (lambda v^2). */
export const higgsPotentialReduced = defineFormula({
  id: "higgs-potential", title: "Higgs potential in units of lambda v^4", status: "established",
  symbols: {
    x: { tex: "x", unit: "1", dims: {}, description: "radial Higgs field h in units of the vacuum value v, x = h/v" },
    s: { tex: "s", unit: "1", dims: {}, description: "mu squared in units of lambda v squared; 1 is the physical phase, 0 or less the symmetric one" },
  },
  output: { tex: "V/\\lambda v^4", unit: "1", dims: {} },
  expr: term("V", sub(div(pow("x", 4), 4), mul(div("s", 2), pow("x", 2)))),
  domain: { x: [0, 1.6, "lin"], s: [-1, 1, "lin"] },
  references: [HIGGS_1964, BUTTAZZO, PDG_2026],
});

/** lambda = m_H^2 / (2 v^2), the quartic coupling before the radiative matching of the running. */
export const higgsQuarticTree = defineFormula({
  id: "higgs-quartic-tree", title: "Tree-level Higgs quartic coupling", status: "established",
  symbols: {
    mH: { tex: "m_H", unit: "GeV", dims: { M: 1, L: 2, T: -2 }, description: "Higgs boson pole mass" },
    v: { tex: "v", unit: "GeV", dims: { M: 1, L: 2, T: -2 }, description: "vacuum expectation value, (sqrt2 G_F)^(-1/2)" },
  },
  output: { tex: "\\lambda", unit: "1", dims: {} },
  expr: term("lambda", div(pow("mH", 2), mul(2, pow("v", 2)))),
  domain: { mH: [100, 150, "lin"], v: [200, 300, "lin"] },
  references: [BUTTAZZO, PDG_2026],
});
