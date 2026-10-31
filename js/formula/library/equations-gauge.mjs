/* Structural equations of the Standard Model and of gauge theory, as cards that state them.
 *
 * These are `identityFormula` definitions (js/formula/library/equations.mjs): the equation is carried exactly as the card
 * renders it, split at the printer's own separators so each part becomes a focusable term. None of them evaluates a
 * quantity — a gauge group is not a number — which is the reason they declare no domain. (Ledger D-177.)
 */

import { identityFormula } from "./equations.mjs";
import { SPACETIME, STANDARD_MODEL as SM, RG, QFT } from "./symbols.mjs";

const GLASHOW = { citation: "Glashow, Partial-symmetries of weak interactions, Nucl. Phys. 22, 579 (1961)", doi: "10.1016/0029-5582(61)90469-2", retrieved: "2026-10-30" };
const WEINBERG = { citation: "Weinberg, A model of leptons, Phys. Rev. Lett. 19, 1264 (1967)", doi: "10.1103/PhysRevLett.19.1264", retrieved: "2026-10-30" };
const HIGGS_1964 = { citation: "Higgs, Broken symmetries and the masses of gauge bosons, Phys. Rev. Lett. 13, 508 (1964)", doi: "10.1103/PhysRevLett.13.508", retrieved: "2026-10-30" };
const YANG_MILLS = { citation: "Yang & Mills, Conservation of isotopic spin and isotopic gauge invariance, Phys. Rev. 96, 191 (1954)", doi: "10.1103/PhysRev.96.191", retrieved: "2026-10-30" };
const T_HOOFT_VELTMAN = { citation: "t Hooft & Veltman, Regularization and renormalization of gauge fields, Nucl. Phys. B 44, 189 (1972)", doi: "10.1016/0550-3213(72)90279-9", retrieved: "2026-10-30" };
const PDG = { citation: "Particle Data Group (Takahashi et al.), Review of Particle Physics, Int. J. Mod. Phys. A 41, 2630011 (2026)", url: "https://pdg.lbl.gov/2026/", retrieved: "2026-10-30" };

/** The atlas labels this card "established" and it is: the group is measured, not conjectured. */
export const gaugeGroup = identityFormula({
  id: "sm-gauge-group",
  title: "Standard Model gauge group",
  status: "established",
  tex: "G_{\\mathrm{SM}} = SU(3)_C \\times SU(2)_L \\times U(1)_Y",
  terms: ["gaugeGroup"],
  symbols: { G_SM: SM.gaugeGroup, su3: SM.su3, su2: SM.su2, u1: SM.u1 },
  references: [GLASHOW, WEINBERG, PDG],
});

/** The whitepaper states the group without naming it; the same definition, drawn without its left-hand side. */
export const gaugeGroupBare = identityFormula({
  id: "sm-gauge-group-bare",
  title: "Gauge group",
  status: "established",
  tex: "SU(3)_C \\times SU(2)_L \\times U(1)_Y",
  terms: ["gaugeGroup"],
  symbols: { su3: SM.su3, su2: SM.su2, u1: SM.u1 },
  references: [GLASHOW, WEINBERG, PDG],
});

export const electricCharge = identityFormula({
  id: "sm-electric-charge",
  title: "Electric charge from weak isospin and hypercharge",
  status: "established",
  tex: "Q = T_3 + \\frac{Y}{2}",
  terms: ["isospin", "hypercharge"],
  symbols: { Q: SM.Q, T3: SM.T3, Y: SM.Y },
  references: [GLASHOW, WEINBERG, PDG],
});

/** Two conventions of the same object: the full Standard Model sum, and the single-factor form the RG module uses. */
export const covariantDerivative = identityFormula({
  id: "sm-covariant-derivative",
  title: "Covariant derivative of the Standard Model",
  status: "established",
  tex: "D_\\mu = \\partial_\\mu + i g_s G_\\mu^a T^a + i g W_\\mu^i \\tau^i + i g' Y B_\\mu",
  terms: ["gradient", "strong", "weak", "hypercharge"],
  symbols: {
    D: SM.Dmu, partial: SPACETIME.partialMu, gs: SM.gs, g: SM.g, gp: SM.gprime,
    G: SM.GaugeField, W: SM.WField, B: SM.BField, T: SM.generator, tau: SM.taui, Y: SM.Y,
  },
  references: [YANG_MILLS, GLASHOW, WEINBERG, PDG],
});

export const covariantDerivativeSingle = identityFormula({
  id: "gauge-covariant-derivative",
  title: "Covariant derivative of a single gauge field",
  status: "established",
  tex: "D_\\mu = \\partial_\\mu - i g\\, A_\\mu^a T^a",
  terms: ["derivative"],
  symbols: {
    D: SM.Dmu, partial: SPACETIME.partialMu, g: SM.g,
    A: { tex: "A_\\mu^a", unit: "1", dims: {}, description: "gauge potential of the factor being gauged" },
    T: SM.generator,
  },
  references: [YANG_MILLS],
});

export const higgsPotentialWhitepaper = identityFormula({
  id: "higgs-potential-full",
  title: "Higgs potential and its vacuum expectation value",
  status: "established",
  tex: "V(\\Phi) = \\mu^2 \\Phi^\\dagger \\Phi + \\lambda(\\Phi^\\dagger \\Phi)^2, \\qquad v = \\sqrt{-\\mu^2/\\lambda} \\approx 246\\ \\mathrm{GeV}",
  terms: ["massTerm", "quarticTerm"],
  symbols: { V: { tex: "V(\\Phi)", unit: "GeV^4", dims: { M: 1, L: -1, T: -2 }, description: "potential energy density of the Higgs doublet" }, mu2: SM.higgsMu2, lambda: SM.higgsLambda, v: SM.vev, Phi: SM.higgsDoublet },
  references: [HIGGS_1964, PDG],
});

export const higgsPotentialModule = identityFormula({
  id: "higgs-potential-card",
  title: "Higgs potential",
  status: "established",
  tex: "V(\\phi) = \\mu^2\\,\\phi^\\dagger\\phi + \\lambda\\,(\\phi^\\dagger\\phi)^2",
  terms: ["massTerm", "quarticTerm"],
  symbols: { V: { tex: "V(\\phi)", unit: "GeV^4", dims: { M: 1, L: -1, T: -2 }, description: "potential energy density" }, mu2: SM.higgsMu2, lambda: SM.higgsLambda, phi: { tex: "\\phi", unit: "GeV", dims: { M: 1, L: 2, T: -2 }, description: "complex scalar doublet" } },
  references: [HIGGS_1964],
});

export const lagrangianStructure = identityFormula({
  id: "sm-lagrangian",
  title: "Lagrangian structure of the Standard Model",
  status: "established",
  tex: "\\mathcal{L} = -\\tfrac{1}{4}F_{\\mu\\nu}^a F^{a\\,\\mu\\nu} + i\\bar\\psi\\,\\gamma^\\mu D_\\mu \\psi + |D_\\mu\\phi|^2 - V(\\phi) - \\left(\\bar\\psi_L\\, Y\\, \\phi\\, \\psi_R + \\mathrm{h.c.}\\right)",
  terms: ["gaugeKinetic", "fermionKinetic", "higgsAndYukawa"],
  symbols: {
    L: SPACETIME.lagrangian, F: SM.fieldStrength, psi: SM.psi, gamma: SM.gammaMu, D: SM.Dmu,
    phi: { tex: "\\phi", unit: "GeV", dims: { M: 1, L: 2, T: -2 }, description: "Higgs doublet" },
    V: { tex: "V(\\phi)", unit: "GeV^4", dims: { M: 1, L: -1, T: -2 }, description: "Higgs potential" },
    psiL: SM.psiL, psiR: SM.psiR, Y: SM.yukawa,
  },
  references: [GLASHOW, WEINBERG, T_HOOFT_VELTMAN, PDG],
});

export const yangMillsFieldStrength = identityFormula({
  id: "gauge-field-strength",
  title: "Yang–Mills field strength",
  status: "established",
  tex: "F_{\\mu\\nu}^a = \\partial_\\mu A_\\nu^a - \\partial_\\nu A_\\mu^a + g f^{abc} A_\\mu^b A_\\nu^c",
  terms: ["abelian", "nonAbelian"],
  symbols: {
    F: SM.fieldStrength, partial: SPACETIME.partialMu,
    A: { tex: "A_\\mu^a", unit: "1", dims: {}, description: "gauge potential" },
    g: SM.g,
    f: { tex: "f^{abc}", unit: "1", dims: {}, description: "structure constants of the gauge algebra" },
  },
  references: [YANG_MILLS],
});

export const oneLoopBeta = identityFormula({
  id: "gauge-one-loop-beta",
  title: "One-loop beta function of a gauge coupling",
  status: "effective",
  tex: "\\mu\\frac{dg}{d\\mu} = \\beta(g) = -\\frac{b_0}{16\\pi^2}g^3 + \\mathcal{O}(g^5), \\qquad b_0 = 11 - \\frac{2}{3}n_f",
  terms: ["beta", "coefficient"],
  symbols: { mu: RG.scale, g: SM.g, beta: RG.beta, b0: RG.b0, nf: RG.nf },
  references: [
    { citation: "Gross & Wilczek, Ultraviolet behavior of non-abelian gauge theories, Phys. Rev. Lett. 30, 1343 (1973)", doi: "10.1103/PhysRevLett.30.1343", retrieved: "2026-10-30" },
    { citation: "Politzer, Reliable perturbative results for strong interactions?, Phys. Rev. Lett. 30, 1346 (1973)", doi: "10.1103/PhysRevLett.30.1346", retrieved: "2026-10-30" },
  ],
});

export const runningCouplingSolution = identityFormula({
  id: "gauge-running-solution",
  title: "One-loop solution for the running coupling",
  status: "effective",
  tex: "\\frac{1}{g_s^2(\\mu)} = \\frac{1}{g_s^2(\\mu_0)} + \\frac{b_0}{8\\pi^2}\\ln\\frac{\\mu}{\\mu_0}",
  terms: ["inverseCoupling", "logRunning"],
  symbols: { gs: RG.coupling, mu: RG.scale, mu0: RG.scale0, b0: RG.b0 },
  references: [
    { citation: "Particle Data Group (Takahashi et al.), Review of Particle Physics, Int. J. Mod. Phys. A 41, 2630011 (2026), Electroweak model and constraints on new physics", url: "https://pdg.lbl.gov/2026/reviews/rpp2026-rev-standard-model.pdf", retrieved: "2026-10-30" },
  ],
});

/** The two fixed-point cards say the same thing in two spellings; both are kept because both are on screen. */
export const fixedPointWhitepaper = identityFormula({
  id: "rg-fixed-point",
  title: "Fixed point and its linearisation",
  status: "conjectural",
  tex: "\\beta(g_*) = 0, \\qquad \\beta(g) \\simeq \\beta'(g_*)(g - g_*)",
  terms: ["fixedPoint"],
  symbols: { beta: RG.beta, gstar: RG.gstar, slope: RG.betaSlope },
  references: [
    { citation: "Wilson & Kogut, The renormalization group and the epsilon expansion, Phys. Rep. 12, 75 (1974)", doi: "10.1016/0370-1573(74)90023-4", retrieved: "2026-10-30" },
  ],
});

export const fixedPointModule = identityFormula({
  id: "rg-fixed-point-linearization",
  title: "Fixed-point linearisation of the beta function",
  status: "effective",
  tex: "\\beta(g_*)=0,\\qquad \\beta(g)\\simeq\\beta'(g_*)(g-g_*)",
  terms: ["fixedPoint"],
  symbols: { beta: RG.beta, gstar: RG.gstar, slope: RG.betaSlope },
  references: [
    { citation: "Wilson & Kogut, The renormalization group and the epsilon expansion, Phys. Rep. 12, 75 (1974)", doi: "10.1016/0370-1573(74)90023-4", retrieved: "2026-10-30" },
  ],
});

export const qcdBetaOneLoop = identityFormula({
  id: "qcd-beta-one-loop",
  title: "QCD beta function at one loop",
  status: "effective",
  tex: "\\beta(g_s)=-\\frac{b_0}{16\\pi^2}g_s^3+\\mathcal{O}(g_s^5),\\qquad b_0=11-\\frac{2}{3}n_f",
  terms: ["beta"],
  symbols: { beta: RG.beta, gs: RG.coupling, b0: RG.b0, nf: RG.nf },
  references: [
    { citation: "Gross & Wilczek, Ultraviolet behavior of non-abelian gauge theories, Phys. Rev. Lett. 30, 1343 (1973)", doi: "10.1103/PhysRevLett.30.1343", retrieved: "2026-10-30" },
  ],
});

export const qedBetaOneLoop = identityFormula({
  id: "qed-beta-one-loop",
  title: "QED beta function at one loop",
  status: "effective",
  tex: "\\beta(e)=\\frac{n_f e^3}{12\\pi^2},\\qquad \\alpha=\\frac{e^2}{4\\pi}",
  terms: ["beta"],
  symbols: {
    beta: { tex: "\\beta(e)", unit: "1", dims: {}, description: "beta function of the electric charge" },
    e: { tex: "e", unit: "1", dims: {}, description: "electric charge in natural units" },
    nf: RG.nf, alpha: QFT.alpha,
  },
  references: [
    { citation: "Peskin & Schroeder, An Introduction to Quantum Field Theory (1995; CRC Press edition 2018)", doi: "10.1201/9780429503559", retrieved: "2026-10-30" },
  ],
});
