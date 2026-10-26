/* The Z-pole couplings behind the electroweak figure (S16): the vector coupling of a lepton and the pole forward-backward asymmetry. */

import { defineFormula } from "../formula.mjs";
import { add, div, mul, pow, sub, term } from "../expr.mjs";

const LEP_SLC = { citation: "ALEPH, DELPHI, L3, OPAL, SLD Collaborations et al., Precision electroweak measurements on the Z resonance, Phys. Rep. 427, 257 (2006)", doi: "10.1016/j.physrep.2005.12.006", arxiv: "hep-ex/0509008", retrieved: "2026-10-26" };
const PDG_2026 = { citation: "Particle Data Group, Review of Particle Physics (2026), Electroweak model and constraints on new physics", url: "https://pdg.lbl.gov/2026/", retrieved: "2026-10-26" };

/** g_V = T3 - 2 Q sin^2 theta_W for a fermion of weak isospin T3 and charge Q (in units of e). */
export const ewVectorCoupling = defineFormula({
  id: "ew-vector-coupling", title: "Vector coupling of a fermion to the Z", status: "established",
  symbols: {
    T3: { tex: "T_3", unit: "1", dims: {}, description: "third component of weak isospin of the left-handed fermion" },
    Q: { tex: "Q", unit: "1", dims: {}, description: "electric charge in units of the positron charge" },
    sin2: { tex: "\\sin^2\\theta_W", unit: "1", dims: {}, description: "weak mixing angle" },
  },
  output: { tex: "g_V", unit: "1", dims: {} },
  expr: term("gV", sub(term("isospin", "T3"), term("charge", mul(2, "Q", "sin2")))),
  domain: { T3: [-0.5, 0.5, "lin"], Q: [-1, 1, "lin"], sin2: [0.2, 0.26, "lin"] },
  references: [PDG_2026, LEP_SLC],
});

/**
 * A_FB^0 = (3/4) A_e A_mu with A_f = 2 g_V g_A / (g_V^2 + g_A^2): the forward-backward asymmetry of e+ e- -> mu+ mu- on the Z pole, where
 * Re chi vanishes and only the Z squared survives, for lepton universality (the same couplings for the electron and the muon).
 */
export const ewPoleAsymmetry = defineFormula({
  id: "ew-pole-asymmetry", title: "Forward-backward asymmetry on the Z pole", status: "established",
  symbols: {
    gV: { tex: "g_V", unit: "1", dims: {}, description: "vector coupling of the charged lepton" },
    gA: { tex: "g_A", unit: "1", dims: {}, description: "axial coupling of the charged lepton" },
  },
  output: { tex: "A_{\\mathrm{FB}}^{0}", unit: "1", dims: {} },
  expr: term("A_FB", mul(div(3, 4), pow(term("A_l", div(mul(2, "gV", "gA"), add(pow("gV", 2), pow("gA", 2)))), 2))),
  domain: { gV: [-0.2, 0.2, "lin"], gA: [-0.6, -0.4, "lin"] },
  references: [LEP_SLC, PDG_2026],
});
