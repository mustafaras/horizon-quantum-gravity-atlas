/* Structural equations of general relativity, the Planck scale, black-hole thermodynamics and the quantum-gravity
 * programmes, as cards that state them.
 *
 * `identityFormula` definitions; see equations.mjs for why an identity is a `defineFormula` and not a second kind. The
 * quantitative counterparts of several of these — r_s, T_H, S_BH, ℓ_P, b_c — already exist in black-holes.mjs and
 * planck-casimir.mjs and keep their own ids; the cards here are the statements those quantities are derived from.
 */

import { identityFormula } from "./equations.mjs";
import { SPACETIME, PLANCK, HOLOGRAPHY, PROGRAMS, QFT, STANDARD_MODEL as SM } from "./symbols.mjs";
import { constants, CODATA_2018 } from "./constants.mjs";

const EINSTEIN_1916 = { citation: "Einstein, Die Grundlage der allgemeinen Relativitätstheorie, Ann. Phys. 354, 769 (1916)", doi: "10.1002/andp.19163540702", retrieved: "2026-10-30" };
const HILBERT_1915 = { citation: "Hilbert, Die Grundlagen der Physik, Nachr. Ges. Wiss. Göttingen 395 (1915)", url: "https://eudml.org/doc/58901", retrieved: "2026-10-30" };
const SCHWARZSCHILD = { citation: "Schwarzschild, On the gravitational field of a mass point according to Einstein's theory (1916), trans. Antoci & Loinger", arxiv: "physics/9905030", retrieved: "2026-10-30" };
const PLANCK_1900 = { citation: "Planck, Über irreversible Strahlungsvorgänge, Ann. Phys. 306, 69 (1900)", doi: "10.1002/andp.19003060105", retrieved: "2026-10-30" };
const BEKENSTEIN = { citation: "Bekenstein, Black holes and entropy, Phys. Rev. D 7, 2333 (1973)", doi: "10.1103/PhysRevD.7.2333", retrieved: "2026-10-30" };
const HAWKING = { citation: "Hawking, Particle creation by black holes, Commun. Math. Phys. 43, 199 (1975)", doi: "10.1007/BF02345020", retrieved: "2026-10-30" };
const BPT = { citation: "Bardeen, Press & Teukolsky, Rotating black holes: locally nonrotating frames, energy extraction, and scalar synchrotron radiation, Astrophys. J. 178, 347 (1972)", doi: "10.1086/151796", retrieved: "2026-10-30" };
const KERR = { citation: "Kerr, Gravitational field of a spinning mass as an example of algebraically special metrics, Phys. Rev. Lett. 11, 237 (1963)", doi: "10.1103/PhysRevLett.11.237", retrieved: "2026-10-30" };
const RYU_TAKAYANAGI = { citation: "Ryu & Takayanagi, Holographic derivation of entanglement entropy from the anti-de Sitter space/conformal field theory correspondence, Phys. Rev. Lett. 96, 181602 (2006)", doi: "10.1103/PhysRevLett.96.181602", arxiv: "hep-th/0603001", retrieved: "2026-10-30" };
const MERTENS_THEORY = { citation: "Maldacena, The large N limit of superconformal field theories and supergravity, Adv. Theor. Math. Phys. 2, 231 (1998)", doi: "10.4310/ATMP.1998.v2.n2.a1", arxiv: "hep-th/9711200", retrieved: "2026-10-30" };
const EINSTEIN_1905 = { citation: "Einstein, Zur Elektrodynamik bewegter Körper, Ann. Phys. 322, 891 (1905)", doi: "10.1002/andp.19053221004", retrieved: "2026-10-30" };
const PETERS_1964 = { citation: "Peters, Gravitational radiation and the motion of two point masses, Phys. Rev. 136, B1224 (1964)", doi: "10.1103/PhysRev.136.B1224", retrieved: "2026-10-30" };
const DONOGHUE = { citation: "Donoghue, General relativity as an effective field theory: the leading quantum corrections, Phys. Rev. D 50, 3874 (1994)", doi: "10.1103/PhysRevD.50.3874", arxiv: "gr-qc/9405057", retrieved: "2026-10-30" };
const POLCHINSKI = { citation: "Polchinski, String Theory, vol. 1 (Cambridge University Press, 1998)", doi: "10.1017/CBO9780511816079", retrieved: "2026-10-30" };
const DEWITT_BOOK = { citation: "DeWitt, The global approach to quantum field theory (Oxford University Press, 2003)", doi: "10.1093/acprof:oso/9780198527909.001.0001", retrieved: "2026-10-30" };

/* ---------- general relativity ---------- */

/** Two spellings of the same equations; the whitepaper adds the definition of the Einstein tensor. */
export const einsteinFieldEquations = identityFormula({
  id: "gr-einstein-field-equations",
  title: "Einstein field equations",
  status: "established",
  tex: "G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4}T_{\\mu\\nu}, \\qquad G_{\\mu\\nu} = R_{\\mu\\nu} - \\tfrac{1}{2}R g_{\\mu\\nu}",
  terms: ["source"],
  symbols: { G: SPACETIME.G_munu, Lambda: SPACETIME.Lambda, g: SPACETIME.g, T: SPACETIME.T_munu, Rmunu: SPACETIME.R_munu, R: SPACETIME.R_scalar, ...constants("G", "c") },
  references: [EINSTEIN_1916, CODATA_2018],
});

export const einsteinFieldEquationsModule = identityFormula({
  id: "gr-einstein-field-equations-compact",
  title: "Einstein field equations with a cosmological constant",
  status: "established",
  tex: "G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4}\\, T_{\\mu\\nu}",
  terms: ["source"],
  symbols: { G: SPACETIME.G_munu, Lambda: SPACETIME.Lambda, g: SPACETIME.g, T: SPACETIME.T_munu, ...constants("G", "c") },
  references: [EINSTEIN_1916, CODATA_2018],
});

export const geodesicEquation = identityFormula({
  id: "gr-geodesic",
  title: "Geodesic equation",
  status: "established",
  tex: "\\frac{d^2x^\\mu}{d\\tau^2} + \\Gamma^\\mu_{\\alpha\\beta}\\frac{dx^\\alpha}{d\\tau}\\frac{dx^\\beta}{d\\tau} = 0",
  terms: ["equation"],
  symbols: { x: SPACETIME.x, tau: SPACETIME.tau, Gamma: SPACETIME.Gamma },
  references: [EINSTEIN_1916, SCHWARZSCHILD],
});

export const geodesicEquationModule = identityFormula({
  id: "gr-geodesic-spaced",
  title: "Geodesic equation in the curvature module's spelling",
  status: "established",
  tex: "\\frac{d^2 x^\\mu}{d\\tau^2} + \\Gamma^{\\mu}_{\\alpha\\beta}\\,\\frac{dx^\\alpha}{d\\tau}\\frac{dx^\\beta}{d\\tau} = 0",
  terms: ["equation"],
  symbols: { x: SPACETIME.x, tau: SPACETIME.tau, Gamma: SPACETIME.Gamma },
  references: [EINSTEIN_1916, SCHWARZSCHILD],
});

export const einsteinHilbertAction = identityFormula({
  id: "gr-einstein-hilbert-action",
  title: "Einstein–Hilbert action",
  status: "established",
  tex: "S_{EH} = \\frac{c^4}{16\\pi G} \\int R\\, \\sqrt{-g}\\; d^4x",
  terms: ["integrand"],
  symbols: { S: SPACETIME.action, R: SPACETIME.R_scalar, ...constants("G", "c") },
  references: [HILBERT_1915, CODATA_2018],
});

export const minkowskiInterval = identityFormula({
  id: "gr-minkowski-interval",
  title: "Minkowski interval and the Lorentz factor",
  status: "established",
  tex: "\\Delta s^2 = -c^2\\Delta t^2 + \\Delta x^2, \\qquad \\gamma = \\frac{1}{\\sqrt{1-\\beta^2}}",
  terms: ["interval", "lorentzFactor"],
  symbols: {
    ds2: { tex: "\\Delta s^2", unit: "m^2", dims: { L: 2 }, description: "invariant interval" },
    dt: { tex: "\\Delta t", unit: "s", dims: { T: 1 }, description: "coordinate time difference" },
    dx: { tex: "\\Delta x", unit: "m", dims: { L: 1 }, description: "coordinate length difference" },
    beta: { tex: "\\beta", unit: "1", dims: {}, description: "v/c" },
    gamma: { tex: "\\gamma", unit: "1", dims: {}, description: "Lorentz factor" },
    ...constants("c"),
  },
  references: [EINSTEIN_1905, CODATA_2018],
});

/* ---------- the Planck scale ---------- */

export const planckUnits = identityFormula({
  id: "planck-units",
  title: "The Planck units",
  status: "established",
  tex: "\\ell_P = \\sqrt{\\frac{\\hbar G}{c^3}},\\quad t_P = \\sqrt{\\frac{\\hbar G}{c^5}},\\quad m_P = \\sqrt{\\frac{\\hbar c}{G}},\\quad E_P = \\sqrt{\\frac{\\hbar c^5}{G}}",
  terms: ["length"],
  symbols: { ellP: PLANCK.ellP, tP: PLANCK.tP, mP: PLANCK.mP, EP: PLANCK.EP, ...constants("hbar", "G", "c") },
  references: [PLANCK_1900, CODATA_2018],
});

export const heuristicObstruction = identityFormula({
  id: "planck-heuristic-obstruction",
  title: "The Compton–Schwarzschild obstruction",
  status: "heuristic",
  tex: "\\lambda_C \\sim r_s, \\qquad \\lambda_C = \\frac{\\hbar}{mc}, \\qquad r_s = \\frac{2Gm}{c^2}",
  terms: ["threshold"],
  symbols: { lambdaC: PLANCK.compton, rs: PLANCK.rs, m: QFT.mass, ...constants("hbar", "G", "c") },
  references: [PLANCK_1900, SCHWARZSCHILD, CODATA_2018],
});

export const gravitonExpansion = identityFormula({
  id: "planck-graviton-expansion",
  title: "Graviton expansion of the metric",
  status: "effective",
  tex: "g_{\\mu\\nu} = \\eta_{\\mu\\nu} + \\kappa h_{\\mu\\nu}, \\qquad \\kappa^2 = 32\\pi G",
  terms: ["perturbation", "coupling"],
  symbols: { g: SPACETIME.g, eta: SPACETIME.eta, h: SPACETIME.h, kappa: PLANCK.kappa, ...constants("G") },
  references: [DONOGHUE, CODATA_2018],
});

export const perturbativeExpansion = identityFormula({
  id: "planck-metric-perturbation",
  title: "Perturbative expansion of the metric",
  status: "effective",
  tex: "g_{\\mu\\nu} = \\eta_{\\mu\\nu} + \\kappa\\, h_{\\mu\\nu}, \\qquad \\kappa^2 = 32\\pi G",
  terms: ["perturbation", "coupling"],
  symbols: { g: SPACETIME.g, eta: SPACETIME.eta, h: SPACETIME.h, kappa: PLANCK.kappa, ...constants("G") },
  references: [DONOGHUE, CODATA_2018],
});

export const effectiveCouplingGrowth = identityFormula({
  id: "planck-effective-coupling",
  title: "Growth of the dimensionless gravitational coupling",
  status: "established",
  tex: "\\alpha_{\\mathrm{grav}}(E) \\sim \\frac{G E^2}{\\hbar c^5} = \\left(\\frac{E}{E_P}\\right)^{2}",
  terms: ["scaling"],
  symbols: { alphaGrav: PLANCK.alphaGrav, E: PLANCK.energy, EP: PLANCK.EP, ...constants("G", "hbar", "c") },
  references: [DONOGHUE, CODATA_2018],
});

export const scaleGap = identityFormula({
  id: "planck-scale-gap",
  title: "The scale gap between the Planck energy and collider reach",
  status: "open",
  tex: "E_P \\sim 10^{19}\\ \\mathrm{GeV} \\quad\\text{vs}\\quad E_{\\mathrm{LHC}} \\sim 10^{4}\\ \\mathrm{GeV}",
  terms: ["gap"],
  symbols: { EP: PLANCK.EP, ELHC: PLANCK.ELHC },
  references: [CODATA_2018],
});

/* ---------- black-hole thermodynamics and holography ---------- */

export const bekensteinHawkingWhitepaper = identityFormula({
  id: "bh-entropy-area-law",
  title: "Bekenstein–Hawking entropy as an area law",
  status: "effective",
  tex: "S_{BH} = \\frac{k_B c^3 A}{4G\\hbar} = k_B\\frac{A}{4\\ell_P^2}",
  terms: ["areaLaw"],
  symbols: { S: HOLOGRAPHY.entropy, A: HOLOGRAPHY.area, ellP: PLANCK.ellP, ...constants("kB", "c", "G", "hbar") },
  references: [BEKENSTEIN, HAWKING, CODATA_2018],
});

export const bekensteinHawkingPlain = identityFormula({
  id: "bh-entropy-plain",
  title: "Bekenstein–Hawking entropy",
  status: "established",
  tex: "S_{BH} = \\frac{k_B\\, c^3 A}{4 G \\hbar}",
  terms: ["areaLaw"],
  symbols: { S: HOLOGRAPHY.entropy, A: HOLOGRAPHY.area, ...constants("kB", "c", "G", "hbar") },
  references: [BEKENSTEIN, HAWKING, CODATA_2018],
});

export const bekensteinHawkingSpaced = identityFormula({
  id: "bh-entropy-spaced",
  title: "Bekenstein–Hawking entropy with the Planck-area form",
  status: "established",
  tex: "S_{BH} = \\frac{k_B c^3 A}{4 G \\hbar} = k_B \\frac{A}{4\\, l_P^2}",
  terms: ["areaLaw"],
  symbols: { S: HOLOGRAPHY.entropy, A: HOLOGRAPHY.area, lP: { ...PLANCK.ellP, tex: "l_P" }, ...constants("kB", "c", "G", "hbar") },
  references: [BEKENSTEIN, HAWKING, CODATA_2018],
});

export const hawkingTemperatureCard = identityFormula({
  id: "bh-hawking-temperature",
  title: "Hawking temperature",
  status: "established",
  tex: "T_H = \\frac{\\hbar c^3}{8\\pi G M k_B}",
  terms: ["temperature"],
  symbols: { T: HOLOGRAPHY.hawkingT, M: { tex: "M", unit: "kg", dims: { M: 1 }, description: "black-hole mass" }, ...constants("hbar", "c", "G", "kB") },
  references: [HAWKING, CODATA_2018],
});

export const hawkingAndEvaporation = identityFormula({
  id: "bh-hawking-evaporation",
  title: "Hawking temperature and the cubic evaporation law",
  status: "effective",
  tex: "T_H = \\frac{\\hbar c^3}{8\\pi G M k_B}, \\qquad t_{\\mathrm{evap}} \\propto M^3",
  terms: ["temperature"],
  symbols: { T: HOLOGRAPHY.hawkingT, evap: HOLOGRAPHY.evaporation, M: { tex: "M", unit: "kg", dims: { M: 1 }, description: "black-hole mass" }, ...constants("hbar", "c", "G", "kB") },
  references: [HAWKING, CODATA_2018],
});

export const kerrHorizons = identityFormula({
  id: "bh-kerr-horizons",
  title: "Kerr horizons and surface gravity",
  status: "established",
  tex: "r_\\pm = \\frac{GM}{c^2}\\left[1 \\pm \\sqrt{1-a_\\star^2}\\right], \\qquad \\kappa = \\frac{c^4}{2GM}\\frac{\\sqrt{1-a_\\star^2}}{1+\\sqrt{1-a_\\star^2}}",
  terms: ["horizon"],
  symbols: { r: HOLOGRAPHY.horizonRadius, spin: HOLOGRAPHY.spin, kappa: HOLOGRAPHY.surfaceGravity, M: { tex: "M", unit: "kg", dims: { M: 1 }, description: "black-hole mass" }, ...constants("G", "c") },
  references: [KERR, BPT, CODATA_2018],
});

export const ryuTakayanagi = identityFormula({
  id: "bh-ryu-takayanagi",
  title: "Ryu–Takayanagi formula",
  status: "conjectural",
  tex: "S(A) = \\frac{\\mathrm{Area}(\\gamma_A)}{4G_N\\hbar}",
  terms: ["areaLaw"],
  symbols: { S: { tex: "S(A)", unit: "1", dims: {}, description: "entanglement entropy of boundary region A" }, gamma: HOLOGRAPHY.extremalSurface, GN: { tex: "G_N", unit: "m^3 kg^-1 s^-2", dims: { L: 3, M: -1, T: -2 }, description: "Newton's constant of the bulk theory" }, ...constants("hbar") },
  references: [RYU_TAKAYANAGI, MERTENS_THEORY],
});

export const adsCftDictionary = identityFormula({
  id: "bh-ads-cft",
  title: "AdS/CFT dictionary",
  status: "conjectural",
  tex: "Z_{\\mathrm{grav}}\\big[\\phi \\to J \\big]_{\\mathrm{AdS}} \\;=\\; \\Big\\langle e^{\\int J\\, \\mathcal{O}}\\Big\\rangle_{\\mathrm{CFT}}",
  terms: ["dictionary"],
  symbols: { Z: HOLOGRAPHY.partition, J: HOLOGRAPHY.source, O: HOLOGRAPHY.operator, phi: SPACETIME.phi_field },
  references: [MERTENS_THEORY],
});

export const quadrupolePower = identityFormula({
  id: "gw-quadrupole-power",
  title: "Quadrupole radiated power",
  status: "established",
  tex: "P = \\frac{G}{5c^5}\\left\\langle Q^{(3)}_{ij}Q^{(3)}_{ij} \\right\\rangle",
  terms: ["power"],
  symbols: { P: HOLOGRAPHY.power, Q: HOLOGRAPHY.quadrupole, Q3: HOLOGRAPHY.quadrupoleThird, ...constants("G", "c") },
  references: [PETERS_1964, CODATA_2018],
});

/* ---------- the quantum-gravity programmes ---------- */

export const polyakovAction = identityFormula({
  id: "qg-polyakov-action",
  title: "Polyakov action of the string",
  status: "conjectural",
  tex: "S_P = -\\frac{T}{2}\\int d^2\\sigma\\, \\sqrt{-h}\\, h^{ab}\\, \\partial_a X^\\mu \\partial_b X_\\mu",
  terms: ["action"],
  symbols: { S: PROGRAMS.polyakovAction, T: PROGRAMS.stringTension, h: PROGRAMS.worldsheetMetric, X: PROGRAMS.embedding },
  references: [POLCHINSKI],
});

export const wheelerDeWitt = identityFormula({
  id: "qg-wheeler-dewitt",
  title: "Wheeler–DeWitt equation",
  status: "conjectural",
  tex: "\\hat{\\mathcal{H}}\\, \\Psi[h_{ij}] = 0",
  terms: ["constraint"],
  symbols: { H: PROGRAMS.hamiltonianConstraint, Psi: PROGRAMS.wavefunctional },
  references: [DEWITT_BOOK],
});
