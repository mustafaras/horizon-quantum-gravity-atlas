/*
 * The symbol vocabulary the structural equations share.
 *
 * Every entry declares TeX, a unit ("1" when dimensionless) and dimensions, because the formula audit fails a card
 * whose symbol has neither. Declaring them once means the same quantity cannot be described two ways in two modules —
 * the failure mode where `M` is kilograms on one card and solar masses on the next.
 *
 * Dimensions are (L, M, T, Θ) rationals, as js/formula/dimensions.mjs reads them. In natural units a quantity's unit is
 * "1" and its dimensions still say what it is: a length stays a length whether or not c is set to 1, which is why the
 * dimensionless constants of the electromagnetic sector are declared dimensionless rather than unitless-by-accident.
 */

import { constants } from "./constants.mjs";

const sym = (tex, unit, dims, description) => ({ tex, unit, dims, description });

/* ---------- spacetime and fields ---------- */

export const SPACETIME = Object.freeze({
  /** A Lorentz index running over the D dimensions of the manifold. */
  mu: sym("\\mu", "1", {}, "spacetime index"),
  nu: sym("\\nu", "1", {}, "spacetime index"),
  alpha: sym("\\alpha", "1", {}, "spacetime index"),
  beta: sym("\\beta", "1", {}, "spacetime index"),
  tau: sym("\\tau", "s", { T: 1 }, "proper time"),
  x: sym("x^\\mu", "m", { L: 1 }, "coordinate four-position"),
  g: sym("g_{\\mu\\nu}", "1", {}, "metric tensor; its components are dimensionless"),
  eta: sym("\\eta_{\\mu\\nu}", "1", {}, "Minkowski metric, signature (−, +, +, +)"),
  h: sym("h_{\\mu\\nu}", "1", {}, "metric perturbation about the background"),
  R_munu: sym("R_{\\mu\\nu}", "m^-2", { L: -2 }, "Ricci tensor"),
  R_scalar: sym("R", "m^-2", { L: -2 }, "Ricci scalar"),
  G_munu: sym("G_{\\mu\\nu}", "m^-2", { L: -2 }, "Einstein tensor, R_{μν} − ½ R g_{μν}"),
  Lambda: sym("\\Lambda", "m^-2", { L: -2 }, "cosmological constant"),
  T_munu: sym("T_{\\mu\\nu}", "Pa", { M: 1, L: -1, T: -2 }, "stress–energy–momentum tensor"),
  Gamma: sym("\\Gamma^\\mu_{\\alpha\\beta}", "m^-1", { L: -1 }, "Christoffel connection"),
  phi_field: sym("\\phi", "1", {}, "scalar field; conventionally dimensionless in natural units"),
  box: sym("\\Box", "m^-2", { L: -2 }, "d'Alembertian operator"),
  partialMu: sym("\\partial_\\mu", "m^-1", { L: -1 }, "ordinary derivative"),
  action: sym("S", "J s", { M: 1, L: 2, T: -1 }, "action"),
  lagrangian: sym("\\mathcal{L}", "J m^-3", { M: 1, L: -1, T: -2 }, "Lagrangian density"),
});

/* ---------- the Standard Model ---------- */

export const STANDARD_MODEL = Object.freeze({
  gaugeGroup: sym("SU(3)_C \\times SU(2)_L \\times U(1)_Y", "1", {}, "the gauge group of the minimal Standard Model"),
  su3: sym("SU(3)_C", "1", {}, "color (strong) factor"),
  su2: sym("SU(2)_L", "1", {}, "weak isospin factor"),
  u1: sym("U(1)_Y", "1", {}, "hypercharge factor"),
  T3: sym("T_3", "1", {}, "third component of weak isospin"),
  Y: sym("Y", "1", {}, "weak hypercharge"),
  Q: sym("Q", "1", {}, "electric charge in units of e"),
  gs: sym("g_s", "1", {}, "strong coupling"),
  g: sym("g", "1", {}, "weak coupling"),
  gprime: sym("g'", "1", {}, "hypercharge coupling"),
  GaugeField: sym("G_\\mu^a", "1", {}, "gluon field"),
  WField: sym("W_\\mu^i", "1", {}, "weak gauge field"),
  BField: sym("B_\\mu", "1", {}, "hypercharge gauge field"),
  generator: sym("T^a", "1", {}, "generator of the gauge algebra"),
  taui: sym("\\tau^i", "1", {}, "weak-isospin generator"),
  Dmu: sym("D_\\mu", "m^-1", { L: -1 }, "gauge-covariant derivative"),
  higgsDoublet: sym("\\Phi", "1", {}, "Higgs doublet field"),
  higgsMu2: sym("\\mu^2", "GeV^2", { M: 1, L: 2, T: -2 }, "Higgs mass parameter; negative in the broken phase"),
  higgsLambda: sym("\\lambda", "1", {}, "quartic Higgs self-coupling"),
  vev: sym("v", "GeV", { M: 1, L: 2, T: -2 }, "vacuum expectation value, 246 GeV"),
  yukawa: sym("Y", "1", {}, "Yukawa coupling matrix"),
  psi: sym("\\psi", "1", {}, "fermion field; conventionally dimensionless in natural units"),
  psiL: sym("\\psi_L", "1", {}, "left-handed fermion doublet"),
  psiR: sym("\\psi_R", "1", {}, "right-handed fermion singlet"),
  gammaMu: sym("\\gamma^\\mu", "1", {}, "Dirac matrix"),
  fieldStrength: sym("F_{\\mu\\nu}^a", "m^-2", { L: -2 }, "non-Abelian field strength"),
});

/* ---------- quantum field theory ---------- */

export const QFT = Object.freeze({
  amplitude: sym("\\mathcal{A}_{i\\to f}", "1", {}, "transition amplitude"),
  pathMeasure: sym("\\mathcal{D}\\phi", "1", {}, "formal path-integral measure"),
  propagator: sym("\\Delta_F(p)", "m^2", { L: 2 }, "Feynman propagator, in units of ħ²/c²"),
  eps: sym("i\\epsilon", "m^2", { L: 2 }, "infinitesimal causal prescription"),
  mass: sym("m", "kg", { M: 1 }, "mass of the field quantum"),
  momentum: sym("p", "kg m s^-1", { M: 1, L: 1, T: -1 }, "four-momentum of the internal line"),
  mandelstam_s: sym("s", "GeV^2", { M: 1, L: 2, T: -2 }, "centre-of-mass energy squared"),
  mandelstam_t: sym("t", "GeV^2", { M: 1, L: 2, T: -2 }, "momentum transfer squared"),
  mandelstam_u: sym("u", "GeV^2", { M: 1, L: 2, T: -2 }, "the crossed channel invariant"),
  alpha: sym("\\alpha", "1", {}, "fine-structure constant"),
  crossSection: sym("\\sigma", "m^2", { L: 2 }, "cross-section"),
  width: sym("\\Gamma", "s^-1", { T: -1 }, "transition rate or decay width"),
  matrixElement: sym("|\\mathcal{M}|^2", "1", {}, "squared invariant matrix element"),
  phaseSpace: sym("d\\rho_f", "1", {}, "density of final states"),
  hbar: constants("hbar").hbar,
});

/* ---------- renormalisation group ---------- */

export const RG = Object.freeze({
  scale: sym("\\mu", "GeV", { M: 1, L: 2, T: -2 }, "renormalisation scale"),
  scale0: sym("\\mu_0", "GeV", { M: 1, L: 2, T: -2 }, "reference scale"),
  beta: sym("\\beta(g)", "1", {}, "beta function of the coupling"),
  b0: sym("b_0", "1", {}, "one-loop coefficient"),
  nf: sym("n_f", "1", {}, "number of active quark flavours"),
  gstar: sym("g_*", "1", {}, "fixed-point coupling"),
  betaSlope: sym("\\beta'(g_*)", "1", {}, "slope of the beta function at the fixed point"),
  coupling: sym("g_s", "1", {}, "strong coupling"),
});

/* ---------- Planck scale ---------- */

export const PLANCK = Object.freeze({
  ellP: sym("\\ell_P", "m", { L: 1 }, "Planck length"),
  tP: sym("t_P", "s", { T: 1 }, "Planck time"),
  mP: sym("m_P", "kg", { M: 1 }, "Planck mass"),
  EP: sym("E_P", "GeV", { M: 1, L: 2, T: -2 }, "Planck energy"),
  ELHC: sym("E_{\\mathrm{LHC}}", "GeV", { M: 1, L: 2, T: -2 }, "collider reach, about 10^4 GeV"),
  kappa: sym("\\kappa", "m kg^-1 s^2", { L: -1, M: -1, T: 2 }, "graviton coupling, κ² = 32πG"),
  alphaGrav: sym("\\alpha_{\\mathrm{grav}}", "1", {}, "dimensionless gravitational coupling at energy E"),
  energy: sym("E", "GeV", { M: 1, L: 2, T: -2 }, "probe energy"),
  compton: sym("\\lambda_C", "m", { L: 1 }, "Compton wavelength"),
  rs: sym("r_s", "m", { L: 1 }, "Schwarzschild radius"),
});

/* ---------- black holes and holography ---------- */

export const HOLOGRAPHY = Object.freeze({
  entropy: sym("S_{BH}", "J K^-1", { M: 1, L: 2, T: -2, Th: -1 }, "Bekenstein–Hawking entropy"),
  area: sym("A", "m^2", { L: 2 }, "horizon area"),
  hawkingT: sym("T_H", "K", { Th: 1 }, "Hawking temperature"),
  evaporation: sym("t_{\\mathrm{evap}}", "s", { T: 1 }, "evaporation time; scales as M³"),
  spin: sym("a_\\star", "1", {}, "dimensionless spin, cJ/GM²"),
  surfaceGravity: sym("\\kappa", "m s^-2", { L: 1, T: -2 }, "surface gravity"),
  horizonRadius: sym("r_\\pm", "m", { L: 1 }, "outer (+) and inner (−) horizon radii"),
  extremalSurface: sym("\\gamma_A", "1", {}, "extremal bulk surface anchored to boundary region A"),
  boundaryRegion: sym("A", "1", {}, "a region of the boundary theory"),
  partition: sym("Z_{\\mathrm{grav}}", "1", {}, "bulk gravitational partition function with boundary sources"),
  operator: sym("\\mathcal{O}", "1", {}, "boundary operator dual to the bulk field"),
  source: sym("J", "1", {}, "boundary source coupled to the operator"),
  quadrupole: sym("Q_{ij}", "kg m^2", { M: 1, L: 2 }, "mass quadrupole moment"),
  quadrupoleThird: sym("Q^{(3)}_{ij}", "kg m^2 s^-3", { M: 1, L: 2, T: -3 }, "third time derivative of the quadrupole"),
  power: sym("P", "W", { M: 1, L: 2, T: -3 }, "radiated power"),
});

/* ---------- quantum gravity programmes ---------- */

export const PROGRAMS = Object.freeze({
  polyakovAction: sym("S_P", "J s", { M: 1, L: 2, T: -1 }, "Polyakov action of the string"),
  stringTension: sym("T", "kg s^-2", { M: 1, T: -2 }, "string tension, 1/(2πα′)"),
  worldsheetMetric: sym("h_{ab}", "1", {}, "worldsheet metric"),
  embedding: sym("X^\\mu(\\sigma,\\tau)", "m", { L: 1 }, "string embedding coordinates"),
  hamiltonianConstraint: sym("\\hat{\\mathcal{H}}", "m^-3", { L: -3 }, "Wheeler–DeWitt Hamiltonian constraint operator"),
  wavefunctional: sym("\\Psi[h_{ij}]", "1", {}, "wavefunctional of the spatial metric"),
});
