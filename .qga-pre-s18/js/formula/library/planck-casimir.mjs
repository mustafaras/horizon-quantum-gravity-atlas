/* Planck length and Casimir pressure. */

import { defineFormula } from "../formula.mjs";
import { div, mul, sqrt, pow, term, PI } from "../expr.mjs";
import { constants, CODATA_2018 } from "./constants.mjs";

export const planckLength = defineFormula({
  id: "planck-length", title: "Planck length", status: "established",
  symbols: constants("hbar", "G", "c"),
  output: { tex: "\\ell_P", unit: "m", dims: { L: 1 } },
  expr: term("l_P", sqrt(div(mul(term("hbar", "hbar"), term("G", "G")), pow(term("c", "c"), 3)))),
  references: [CODATA_2018],
});

export const casimirPressure = defineFormula({
  id: "casimir-pressure", title: "Casimir pressure between ideal plates", status: "established",
  symbols: { ...constants("hbar", "c"), a: { tex: "a", unit: "m", dims: { L: 1 }, description: "plate separation" } },
  output: { tex: "P_C", unit: "Pa", dims: { M: 1, L: -1, T: -2 } },
  expr: term("P_C", div(mul(pow(PI, 2), "hbar", "c"), mul(240, pow("a", 4)))),
  domain: { a: [0.1, 10, "log"] },
  references: [
    { citation: "Bordag, Mohideen & Mostepanenko, New developments in the Casimir effect, Phys. Rep. 353, 1 (2001)", doi: "10.1016/S0370-1573(01)00015-1", retrieved: "2026-10-22" },
    { citation: "Lamoreaux, Demonstration of the Casimir force in the 0.6 to 6 μm range, Phys. Rev. Lett. 78, 5 (1997)", doi: "10.1103/PhysRevLett.78.5", retrieved: "2026-10-22" },
  ],
});
