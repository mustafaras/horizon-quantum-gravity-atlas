/*
 * The six derivations the atlas actually walks, each importing its numbers rather than restating them.
 *
 * Two of these are traps, and the step data names them rather than leaving the warning in prose:
 *
 *   - the Schwarzschild radius. Equating the escape velocity to c gives r = 2GM/c² only because that heuristic
 *     happens to land on the exact answer; the derivation says so on the step that does it, and the exact
 *     derivation from the null geodesic follows.
 *   - the Casimir energy. The one-dimensional mode sum diverges, and every term of that divergence cancels against
 *     the free-space continuum. A stepper that jumps from "divergent sum" to "−πħc/24a" teaches a subtraction
 *     nobody performed; the cancellation is its own step.
 *
 * Every constant comes from js/science/constants.mjs. No number is retyped here.
 */

import { add, div, mul, neg, pow, sqrt, sub, term, PI } from "../expr.mjs";
import { defineDerivation } from "../derivation.mjs";
import { constants, CODATA_2018 } from "./constants.mjs";
import { SCHWARZSCHILD_CRITICAL_B } from "../../science/kerr-shadow.mjs";
import { PAGE_BETA, pageTimeFraction } from "../../science/evaporation.mjs";
import { ZETA_MINUS_ONE, criticalDimension } from "../../science/string-spectrum.mjs";

const PLANCK_REF = { citation: "Planck, Über irreversible Strahlungsvorgänge, Ann. Phys. 306, 69 (1900)", doi: "10.1002/andp.19003060105", retrieved: "2026-10-30" };
const BPT = { citation: "Bardeen, Press & Teukolsky, Rotating black holes: locally nonrotating frames, energy extraction, and scalar synchrotron radiation, Astrophys. J. 178, 347 (1972)", doi: "10.1086/151796", retrieved: "2026-10-22" };
const POLCHINSKI = { citation: "Polchinski, String Theory, vol. 1 (Cambridge University Press, 1998)", doi: "10.1017/CBO9780511816079", retrieved: "2026-10-30" };
const BORDAG = { citation: "Bordag, Mohideen & Mostepanenko, New developments in the Casimir effect, Phys. Rep. 353, 1 (2001)", doi: "10.1016/S0370-1573(01)00015-1", retrieved: "2026-10-30" };
const PAGE_2013 = { citation: "Page, Time dependence of Hawking radiation entropy, JCAP 09 (2013) 028", doi: "10.1088/1475-7516/2013/09/028", arxiv: "1301.4995", retrieved: "2026-10-30" };
const SCHWARZSCHILD = { citation: "Schwarzschild, On the gravitational field of a mass point according to Einstein's theory (1916), trans. Antoci & Loinger", arxiv: "physics/9905030", retrieved: "2026-10-22" };

/**
 * ℓ_P from ħ, G, c by dimensional analysis: the unique length the three constants can form. The step that fixes the
 * exponent of G is the one dimensional analysis does not decide, and it is labelled heuristic.
 */
export const planckLengthDerivation = defineDerivation({
  id: "derivation-planck-length",
  title: "The Planck length by dimensional analysis",
  status: "established",
  symbols: constants("hbar", "G", "c"),
  domain: {},
  steps: [
    {
      id: "ansatz",
      tex: "\\ell_P = \\hbar^{a}\\,G^{b}\\,c^{\\gamma}",
      justification: "Assume the Planck length is a product of powers of the only three constants available; dimensional analysis will fix the exponents.",
    },
    {
      id: "dimensions",
      tex: "[\\hbar] = \\mathrm{M}\\,\\mathrm{L}^{2}\\,\\mathrm{T}^{-1},\\quad [G] = \\mathrm{M}^{-1}\\,\\mathrm{L}^{3}\\,\\mathrm{T}^{-2},\\quad [c] = \\mathrm{L}\\,\\mathrm{T}^{-1}",
      changedTerms: ["ell_P"],
      justification: "Write each constant's dimensions in M, L and T; the target is a length, so [ℓ_P] = L.",
    },
    {
      id: "solve",
      tex: "\\mathrm{L}:\\ 2a + 3b + \\gamma = 1,\\qquad \\mathrm{M}:\\ a - b = 0,\\qquad \\mathrm{T}:\\ -a - 2b - \\gamma = 0",
      changedTerms: ["ell_P"],
      justification: "Requiring the three exponents to sum to a pure length gives three equations in three unknowns.",
    },
    {
      id: "exponents",
      tex: "a = b = \\tfrac{1}{2},\\qquad \\gamma = -\\tfrac{1}{2}",
      justification: "The unique solution is a = b = ½ and γ = −½, so ℓ_P = √(ħG/c³) up to a dimensionless factor dimensional analysis cannot supply.",
    },
    {
      id: "assemble",
      expr: term("ell_P", sqrt(div(mul("hbar", "G"), pow("c", 3)))),
      changedTerms: ["ell_P"],
      justification: "Substituting the exponents and fixing the dimensionless factor to 1 by the definition of the Planck units gives the Planck length.",
    },
  ],
  // The closed form is the exponent product the analysis produced, not a copy of the last step, so `check()` compares
  // two derivations of ℓ_P rather than one string with itself.
  closed: term("ell_P", mul(pow("hbar", 0.5), pow("G", 0.5), pow("c", -1.5))),
  references: [PLANCK_REF, CODATA_2018],
  note: "Dimensional analysis fixes the exponents and not the overall factor; the choice of 1 is the definition, and Newton's constant carries the mass scale.",
});

/**
 * r_s. The escape-velocity argument is the trap: it gives 2GM/c² by coincidence (the non-relativistic kinetic and
 * potential energies each transform in a way that cancels the error), and the step says so. The exact route is the
 * null geodesic of the Schwarzschild metric.
 */
export const schwarzschildRadiusDerivation = defineDerivation({
  id: "derivation-schwarzschild-radius",
  title: "The Schwarzschild radius: escape velocity and the exact null surface",
  status: "established",
  symbols: { ...constants("G", "c"), M: { tex: "M", unit: "kg", dims: { M: 1 }, description: "mass of the source" } },
  domain: { M: [1e-2, 1e2, "log"] },
  steps: [
    {
      id: "escape",
      expr: term("r_esc", div(mul(2, "G", "M"), pow("c", 2))),
      changedTerms: ["r_esc"],
      heuristic: "Newtonian escape velocity = c. This lands on the exact answer only because the Newtonian kinetic and potential energies each carry an error that cancels in the ratio; it is not a derivation.",
      justification: "Set the Newtonian escape speed v = √(2GM/r) to c and solve for r.",
    },
    {
      id: "exact",
      tex: "ds^2 = -\\left(1 - \\frac{r_s}{r}\\right)c^2 dt^2 + \\left(1 - \\frac{r_s}{r}\\right)^{-1} dr^2 + r^2 d\\Omega^2",
      changedTerms: ["r_s"],
      justification: "Replace the heuristic with the metric whose horizon is defined by a trapped surface, not by a classical escape speed.",
    },
    {
      id: "null",
      tex: "0 = -\\left(1 - \\frac{r_s}{r}\\right)c^2 dt^2 + \\left(1 - \\frac{r_s}{r}\\right)^{-1} dr^2 \\ \\Longrightarrow\\ \\left(\\frac{dr}{dt}\\right)^2 = c^2\\left(1 - \\frac{r_s}{r}\\right)^{2}",
      changedTerms: ["r_s"],
      justification: "A radial null geodesic has ds² = 0; at r = r_s its coordinate speed vanishes, so no future-directed signal escapes — the defining property of the horizon.",
    },
    {
      id: "identify",
      expr: term("r_s", div(mul(2, "G", "M"), pow("c", 2))),
      changedTerms: ["r_s"],
      justification: "Matching the weak-field limit g_tt → −(1 + 2Φ/c²) with Φ = −GM/r identifies r_s = 2GM/c², which is the same expression the heuristic guessed.",
    },
  ],
  closed: term("r_s", mul(2, "G", "M", pow("c", -2))),
  references: [SCHWARZSCHILD, CODATA_2018],
  note: "r_s is a coordinate statement: the horizon is where the metric component vanishes, not where a rocket would need infinite fuel.",
});

/** D = 26, from the ζ(−1) = −1/12 level-one shift; every number is read from js/science/string-spectrum.mjs. */
export const criticalDimensionDerivation = defineDerivation({
  id: "derivation-critical-dimension",
  title: "The bosonic critical dimension D = 26",
  status: "conjectural",
  symbols: { D: { tex: "D", unit: "1", dims: {}, description: "number of spacetime dimensions" } },
  domain: { D: [1, 40, "lin"] },
  steps: [
    {
      id: "sum",
      tex: "a = \\tfrac{1}{2}\\sum_{k=1}^{D-2}\\sum_{n=1}^{\\infty} n",
      changedTerms: ["D"],
      justification: "Each of the D − 2 transverse directions contributes a zero-point sum of ½ n over its oscillator modes.",
    },
    {
      id: "zeta",
      expr: term("zeta", ZETA_MINUS_ONE),
      changedTerms: ["zeta"],
      justification: `Zeta-regularising the divergent sum gives ζ(−1) = ${ZETA_MINUS_ONE.toPrecision(4)}; this is a regularisation, not a convergent sum.`,
    },
    {
      id: "shift",
      expr: term("a", div(neg(sub("D", 2)), 24)),
      changedTerms: ["a"],
      justification: "Half the ζ(−1) sum over D − 2 transverse directions gives a = −(D − 2)/24.",
    },
    {
      id: "massless",
      tex: "\\alpha'M^2 = N + a = 1 + a \\ \\overset{!}{=}\\ 0",
      changedTerms: ["D"],
      justification: "The level-one state of the open string must be a massless vector, so its mass-shell condition has to vanish at N = 1.",
    },
    {
      id: "solve",
      expr: term("D", 2 + 24),
      changedTerms: ["D"],
      justification: `Solving a = −1 gives D = ${criticalDimension()}; any other D leaves the level-one state massive or tachyonic.`,
    },
  ],
  closed: term("D", criticalDimension()),
  references: [POLCHINSKI],
  note: "The tachyon at N = 0 is the signal that the bosonic spectrum is not a physical spectrum; 26 is a consistency condition, not a prediction of a world.",
});

/** b_c = √27 M, from the spherical photon orbit at r = 3M. */
export const shadowRadiusDerivation = defineDerivation({
  id: "derivation-shadow-radius",
  title: "The Schwarzschild shadow radius √27 M",
  status: "established",
  symbols: {
    M: { tex: "M", unit: "m", dims: { L: 1 }, description: "mass in length units, GM/c²" },
    r: { tex: "r", unit: "m", dims: { L: 1 }, description: "areal radius of the orbit, outside the horizon" },
  },
  domain: { M: [1e-2, 1e2, "log"], r: [3, 100, "log"] },
  steps: [
    {
      id: "potential",
      expr: term("V_eff", mul(pow(sub(1, div(mul(2, "M"), "r")), 1), div(1, pow("r", 2)))),
      changedTerms: ["V_eff"],
      justification: "For a photon the effective radial potential per unit L² is (1/r²)(1 − 2M/r); light moves on its stationary points.",
    },
    {
      id: "orbit",
      expr: term("r_ph", mul(3, "M")),
      changedTerms: ["r_ph"],
      justification: "Imposing V_eff′ = 0 gives r = 3M for the circular photon orbit, the light-sphere the atlas draws.",
    },
    {
      id: "impact",
      expr: term("b_c", mul(3, sqrt(3), "M")),
      changedTerms: ["b_c"],
      justification: "The impact parameter of that orbit is b = r/√(1 − 2M/r) evaluated at r = 3M, which is √27 M = 3√3 M.",
    },
    {
      id: "critical",
      expr: term("b_c", mul(SCHWARZSCHILD_CRITICAL_B, "M")),
      changedTerms: ["b_c"],
      justification: `A ray aimed inside b_c terminates on the horizon; one aimed outside escapes, so √27 M is the edge of the silhouette. The number is the tested constant from js/science/kerr-shadow.mjs (${SCHWARZSCHILD_CRITICAL_B.toFixed(12)}).`,
    },
  ],
  closed: term("b_c", mul(3, sqrt(3), "M")),
  references: [BPT],
  note: "The shadow is a property of the background geometry, not of the accretion flow: a bare Schwarzschild hole silhouettes the sky just as sharply.",
});

/**
 * The Casimir energy: the divergent mode sum, the free-space continuum, and the cancellation that leaves
 * −πħc/24a. The cancellation and the limit are separate steps because collapsing them is the standard error.
 */
export const casimirDerivation = defineDerivation({
  id: "derivation-casimir-energy",
  title: "The Casimir energy from the regularised 1D mode sum",
  status: "established",
  symbols: { ...constants("hbar", "c"), a: { tex: "a", unit: "m", dims: { L: 1 }, description: "plate separation" } },
  domain: { a: [1e-8, 1e-5, "log"] },
  steps: [
    {
      id: "modes",
      tex: "\\omega_n = \\frac{n\\pi c}{a},\\qquad E_{\\mathrm{in}} = \\sum_{n=1}^{\\infty}\\tfrac{1}{2}\\hbar\\omega_n e^{-\\omega_n/\\Lambda}",
      justification: "Dirichlet plates at separation a admit the standing modes ω_n = nπc/a; an exponential regulator makes the sum momentarily finite and Λ → ∞ at the end.",
    },
    {
      id: "geometric",
      tex: "\\sum_{n=1}^{\\infty} n\\,e^{-n\\varepsilon} = \\frac{1}{4\\sinh^2(\\varepsilon/2)} = \\frac{1}{\\varepsilon^2} - \\frac{1}{12} + \\frac{\\varepsilon^2}{240} - \\cdots",
      justification: "The regulated sum is a geometric derivative with ε = πc/(aΛ); expanding it separates a divergent piece, the finite −1/12, and a vanishing remainder.",
    },
    {
      id: "continuum",
      tex: "E_{\\mathrm{out}} = \\frac{\\hbar a \\Lambda^2}{2\\pi c} = \\frac{\\hbar\\pi c}{2a}\\cdot\\frac{1}{\\varepsilon^2}",
      justification: "Outside the plates there is no boundary selecting frequencies, so the sum becomes an integral — and its divergent piece is exactly as large as the inside's.",
    },
    {
      id: "cancel",
      tex: "E_{\\mathrm{in}} - E_{\\mathrm{out}} = -\\frac{\\pi\\hbar c}{24a} + \\frac{\\pi\\hbar c}{480a}\\,\\varepsilon^2 + \\cdots",
      justification: "The 1/ε² terms are identical and cancel term by term; what survives is the finite −πħc/24a plus a remainder that falls as 1/Λ². This step is why the answer is not a subtraction of infinities dressed up as arithmetic.",
    },
    {
      id: "limit",
      expr: term("E_casimir", neg(div(mul(PI, "hbar", "c"), mul(24, "a")))),
      changedTerms: ["E_casimir"],
      justification: "Taking Λ → ∞ leaves E/A = −πħc/24a for the one-dimensional scalar field, whose derivative with respect to a gives the −π²ħc/240a⁴ pressure the cavity laboratory plots.",
    },
  ],
  closed: term("E_casimir", div(neg(mul(PI, "hbar", "c")), mul(24, "a"))),
  references: [BORDAG, CODATA_2018],
  note: "A one-dimensional scalar field between Dirichlet plates, not the three-dimensional electromagnetic case; the coefficient 1/24 belongs to the geometry, and the lab's own js/science/casimir.mjs sums the series rather than reading this closed form.",
});

/** Page time: 0.5381 τ from Page's computed β = 1.4847, read from js/science/evaporation.mjs. */
export const pageTimeDerivation = defineDerivation({
  id: "derivation-page-time",
  title: "The Page time from Page's entropy coefficient",
  status: "effective",
  symbols: {
    beta: { tex: "\\beta", unit: "1", dims: {}, description: "Page's computed coefficient relating radiation entropy to the black-hole entropy lost", constant: PAGE_BETA },
    f: { tex: "f", unit: "1", dims: {}, description: "remaining mass fraction M/M0, from 1 at formation to 0 at evaporation" },
  },
  domain: { f: [1e-3, 1, "lin"] },
  steps: [
    {
      id: "entropy",
      expr: term("S_BH", pow("f", 2)),
      changedTerms: ["S_BH"],
      justification: "Bekenstein–Hawking entropy is proportional to M², so in units of its initial value it is exactly f².",
    },
    {
      id: "radiation",
      expr: term("S_rad", mul("beta", sub(1, pow("f", 2)))),
      changedTerms: ["S_rad"],
      justification: `Page's computed coefficient β = ${PAGE_BETA} relates the coarse-grained radiation entropy to the entropy the hole has lost.`,
    },
    {
      id: "cross",
      tex: "\\beta(1 - f^2) = f^2 \\ \\Longrightarrow\\ f^2 = \\frac{\\beta}{1 + \\beta}",
      changedTerms: ["S_rad"],
      justification: "The Page time is when the two entropies meet; after it the radiation carries more entropy than the hole has left.",
    },
    {
      id: "time",
      expr: term("t_over_tau", sub(1, pow(div("beta", add(1, "beta")), 1.5))),
      changedTerms: ["t_over_tau"],
      justification: "Mass falls as (1 − t/τ)^{1/3}, so the entropy fraction f² is (1 − t/τ)^{2/3} and inverting it gives t/τ = 1 − (β/(1 + β))^{3/2}.",
    },
    {
      id: "value",
      expr: term("t_over_tau", pageTimeFraction()),
      changedTerms: ["t_over_tau"],
      justification: `With β = ${PAGE_BETA} the crossing sits at t = ${pageTimeFraction().toFixed(4)} τ, the value js/science/evaporation.mjs computes and the Page curve is drawn from.`,
    },
  ],
  // The closed form is the algebraic inversion; the last step is the number. `check()` therefore proves the committed
  // 0.5381 is the same function the stepper's fourth step derives, not a hard-coded quote.
  closed: term("t_over_tau", sub(1, pow(div("beta", add(1, "beta")), 1.5))),
  references: [PAGE_2013],
  note: "β is a computed greybody-weighted sum over photon and graviton species, not a fitted parameter; the derivation is effective-theory bookkeeping, not a unitary calculation.",
});

export const derivations = Object.freeze({
  planckLengthDerivation,
  schwarzschildRadiusDerivation,
  criticalDimensionDerivation,
  shadowRadiusDerivation,
  casimirDerivation,
  pageTimeDerivation,
});
export default derivations;
