/* Structural equations of quantum field theory, as cards that state them.
 *
 * `identityFormula` definitions; see equations.mjs for why an identity is a `defineFormula` and not a second kind.
 * Cards here span both halves of the module: the whitepaper's spine and the QFT module's own formulation section.
 */

import { identityFormula } from "./equations.mjs";
import { SPACETIME, QFT, STANDARD_MODEL as SM } from "./symbols.mjs";
import { constants, CODATA_2018 } from "./constants.mjs";

const FEYNMAN_1949 = { citation: "Feynman, Space-time approach to quantum electrodynamics, Phys. Rev. 76, 769 (1949)", doi: "10.1103/PhysRev.76.769", retrieved: "2026-10-30" };
const PESKIN = { citation: "Peskin & Schroeder, An Introduction to Quantum Field Theory (1995; CRC Press edition 2018)", doi: "10.1201/9780429503559", retrieved: "2026-10-30" };
const KLEIN_1926 = { citation: "Klein, Quantentheorie und fünfdimensionale Relativitätstheorie, Z. Phys. 37, 895 (1926)", doi: "10.1007/BF01397481", retrieved: "2026-10-30" };
const GORDON_1926 = { citation: "Gordon, Der Comptoneffekt nach der Schrödingerschen Theorie, Z. Phys. 40, 117 (1926)", doi: "10.1007/BF01390840", retrieved: "2026-10-30" };
const DIRAC_1928 = { citation: "Dirac, The quantum theory of the electron, Proc. R. Soc. A 117, 610 (1928)", doi: "10.1098/rspa.1928.0023", retrieved: "2026-10-30" };
const MANDELSTAM = { citation: "Mandelstam, Determination of the pion-nucleon scattering amplitude from dispersion relations and unitarity. General theory, Phys. Rev. 112, 1344 (1958)", doi: "10.1103/PhysRev.112.1344", retrieved: "2026-10-30" };
const FERMI_1950 = { citation: "Fermi, Nuclear physics (University of Chicago Press, 1950); the rule is Dirac's second-order perturbation result", doi: "10.1063/1.3066912", retrieved: "2026-10-30" };

export const pathIntegralWhitepaper = identityFormula({
  id: "qft-path-integral",
  title: "Path integral for a transition amplitude",
  status: "effective",
  tex: "\\mathcal{A}_{i\\to f} = \\int \\mathcal{D}\\phi\\, e^{\\,iS[\\phi]/\\hbar}",
  terms: ["amplitude"],
  symbols: { A: QFT.amplitude, measure: QFT.pathMeasure, S: SPACETIME.action, hbar: QFT.hbar },
  references: [FEYNMAN_1949, PESKIN],
});

export const pathIntegralModule = identityFormula({
  id: "qft-path-integral-amplitude",
  title: "Path integral amplitude for a scalar field",
  status: "established",
  tex: "\\langle \\phi_f | e^{-iHt/\\hbar} | \\phi_i \\rangle = \\int \\mathcal{D}\\phi \\; e^{\\,iS[\\phi]/\\hbar}",
  terms: ["amplitude"],
  symbols: { measure: QFT.pathMeasure, S: SPACETIME.action, hbar: QFT.hbar, H: { tex: "H", unit: "J", dims: { M: 1, L: 2, T: -2 }, description: "Hamiltonian" }, t: { tex: "t", unit: "s", dims: { T: 1 }, description: "elapsed coordinate time" } },
  references: [FEYNMAN_1949, PESKIN],
});

export const scalarActionAndKleinGordon = identityFormula({
  id: "qft-scalar-action",
  title: "Scalar action and the Klein–Gordon equation",
  status: "established",
  tex: "S = \\int d^4x\\left[\\tfrac{1}{2}\\partial_\\mu\\phi\\,\\partial^\\mu\\phi - \\tfrac{1}{2}m^2\\phi^2 - V(\\phi)\\right], \\qquad (\\Box + m^2)\\phi = 0",
  terms: ["action"],
  symbols: { S: SPACETIME.action, partial: SPACETIME.phi_field, box: SPACETIME.box, m: QFT.mass, phi: SPACETIME.phi_field },
  references: [KLEIN_1926, GORDON_1926, PESKIN],
});

export const kleinGordonModule = identityFormula({
  id: "qft-klein-gordon",
  title: "Klein–Gordon equation",
  status: "established",
  tex: "\\left(\\Box + \\frac{m^2 c^2}{\\hbar^2}\\right)\\phi = 0, \\qquad \\Box \\equiv \\frac{1}{c^2}\\frac{\\partial^2}{\\partial t^2} - \\nabla^2",
  terms: ["equation"],
  symbols: { phi: SPACETIME.phi_field, box: SPACETIME.box, m: QFT.mass, ...constants("hbar", "c") },
  references: [KLEIN_1926, GORDON_1926, CODATA_2018],
});

export const diracEquation = identityFormula({
  id: "qft-dirac",
  title: "Dirac equation",
  status: "established",
  tex: "\\left(i\\gamma^\\mu \\partial_\\mu - \\frac{mc}{\\hbar}\\right)\\psi = 0",
  terms: ["equation"],
  symbols: { psi: SM.psi, gamma: SM.gammaMu, partial: SPACETIME.partialMu, m: QFT.mass, ...constants("hbar", "c") },
  references: [DIRAC_1928, CODATA_2018],
});

export const propagatorAndMandelstam = identityFormula({
  id: "qft-propagator-mandelstam",
  title: "Feynman propagator and the Mandelstam identity",
  status: "effective",
  tex: "\\Delta_F(p) = \\frac{i}{p^2 - m^2 + i\\epsilon}, \\qquad s + t + u = \\sum_i m_i^2",
  terms: ["propagator", "s", "t"],
  symbols: { DeltaF: QFT.propagator, p: QFT.momentum, m: QFT.mass, eps: QFT.eps, s: QFT.mandelstam_s, t: QFT.mandelstam_t, u: QFT.mandelstam_u },
  references: [PESKIN, MANDELSTAM],
});

export const feynmanPropagatorModule = identityFormula({
  id: "qft-feynman-propagator",
  title: "Feynman propagator",
  status: "established",
  tex: "\\tilde{G}_F(p) = \\frac{i}{p^2 - m^2 + i\\epsilon}",
  terms: ["propagator"],
  symbols: { GF: { tex: "\\tilde{G}_F(p)", unit: "m^2", dims: { L: 2 }, description: "momentum-space Feynman propagator" }, p: QFT.momentum, m: QFT.mass, eps: QFT.eps },
  references: [PESKIN, FEYNMAN_1949],
});

export const mandelstamVariables = identityFormula({
  id: "qft-mandelstam",
  title: "Mandelstam variables",
  status: "established",
  tex: "s + t + u = \\sum_i m_i^2 c^4, \\quad s = (p_1+p_2)^2,\\ t = (p_1-p_3)^2",
  terms: ["invariant"],
  symbols: { s: QFT.mandelstam_s, t: QFT.mandelstam_t, u: QFT.mandelstam_u, m: QFT.mass, c: constants("c").c },
  references: [MANDELSTAM],
});

export const leadingCrossSection = identityFormula({
  id: "qft-leading-cross-section",
  title: "Leading cross-section for e+e− → μ+μ−",
  status: "effective",
  tex: "\\sigma(e^+e^- \\to \\mu^+\\mu^-) \\sim \\frac{4\\pi\\alpha^2}{3s}",
  terms: ["crossSection"],
  symbols: { sigma: QFT.crossSection, alpha: QFT.alpha, s: QFT.mandelstam_s },
  references: [PESKIN],
});

export const fermiGoldenRule = identityFormula({
  id: "qft-fermi-golden-rule",
  title: "Fermi's golden rule",
  status: "established",
  tex: "d\\Gamma = \\frac{2\\pi}{\\hbar}\\,|\\mathcal{M}|^2\\,d\\rho_f",
  terms: ["rate"],
  symbols: { Gamma: QFT.width, M2: QFT.matrixElement, rho: QFT.phaseSpace, hbar: QFT.hbar },
  references: [FERMI_1950, PESKIN],
});
