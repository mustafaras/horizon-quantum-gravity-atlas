/* The phi^4 Hamiltonian density of the lattice laboratory (S14): the formula the energy buffer and the Formula Lens terms are compiled from. */

import { defineFormula } from "../formula.mjs";
import { add, div, mul, pow, term } from "../expr.mjs";

const MONTVAY_MUENSTER = { citation: "Montvay & Münster, Quantum Fields on a Lattice, Cambridge University Press (1994)", doi: "10.1017/CBO9780511470783", retrieved: "2026-10-25" };
const HAIRER_LUBICH_WANNER = { citation: "Hairer, Lubich & Wanner, Geometric numerical integration illustrated by the Störmer–Verlet method, Acta Numerica 12, 399–450 (2003)", doi: "10.1017/S0962492902000144", retrieved: "2026-10-25" };
const DASHEN_HASSLACHER_NEVEU = { citation: "Dashen, Hasslacher & Neveu, Nonperturbative methods and extended-hadron models in field theory. II. Two-dimensional models and extended hadrons, Phys. Rev. D 10, 4130 (1974)", doi: "10.1103/PhysRevD.10.4130", retrieved: "2026-10-25" };

/**
 * H = pi^2/2 + (grad phi)^2/2 + m^2 phi^2/2 + (lambda/4!) phi^4 per lattice site, in lattice units (hbar = c = 1; the field and the energy density
 * are measured with the spacing a as the unit of length). `g2` is the squared forward-difference gradient, the quantity the lattice shader and
 * js/science/lattice-field.mjs (energyTerms) both compute; the four terms are addressable for the Formula Lens.
 */
export const phi4HamiltonianDensity = defineFormula({
  id: "qft-phi4-hamiltonian", title: "Hamiltonian density of the lattice scalar field", status: "established",
  symbols: {
    pi: { tex: "\\pi", unit: "1", dims: {}, description: "momentum density conjugate to the field, its time derivative" },
    g2: { tex: "(\\nabla\\phi)^2", unit: "1", dims: {}, description: "squared forward-difference gradient of the field" },
    phi: { tex: "\\phi", unit: "1", dims: {}, description: "scalar field" },
    m2: { tex: "m^2", unit: "1", dims: {}, description: "mass squared; negative selects the broken phase with kinks" },
    lambda: { tex: "\\lambda", unit: "1", dims: {}, description: "quartic self-coupling" },
  },
  output: { tex: "\\mathcal{H}", unit: "1", dims: {} },
  expr: term("H", add(
    term("kinetic", div(pow("pi", 2), 2)),
    term("gradient", div("g2", 2)),
    term("mass", div(mul("m2", pow("phi", 2)), 2)),
    term("interaction", mul(div("lambda", 24), pow("phi", 4))),
  )),
  domain: { pi: [-2, 2, "lin"], g2: [0, 4, "lin"], phi: [-2, 2, "lin"], m2: [-1, 3, "lin"], lambda: [0, 6, "lin"] },
  references: [MONTVAY_MUENSTER, HAIRER_LUBICH_WANNER, DASHEN_HASSLACHER_NEVEU],
});
