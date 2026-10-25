/* The Casimir pressure of the cavity laboratory (S15), with its three symbols addressable for the Formula Lens: a (the gap), hbar and c. */

import { defineFormula } from "../formula.mjs";
import { div, mul, neg, pow, term, PI } from "../expr.mjs";
import { constants, CODATA_2018 } from "./constants.mjs";

const BORDAG = { citation: "Bordag, Mohideen & Mostepanenko, New developments in the Casimir effect, Phys. Rep. 353, 1 (2001)", doi: "10.1016/S0370-1573(01)00015-1", retrieved: "2026-10-25" };
const BRESSI = { citation: "Bressi, Carugno, Onofrio & Ruoso, Measurement of the Casimir force between parallel metallic surfaces, Phys. Rev. Lett. 88, 041804 (2002)", doi: "10.1103/PhysRevLett.88.041804", arxiv: "quant-ph/0203002", retrieved: "2026-10-25" };

/**
 * P = -pi^2 hbar c / (240 a^4): ideal, perfectly conducting plates at zero temperature, negative for attraction. It differs from the
 * S03 formula casimir-pressure (the magnitude, with terms that cannot be addressed) in its sign and in the three terms a, hbar and c.
 */
export const casimirPlatesPressure = defineFormula({
  id: "casimir-plates-pressure", title: "Casimir pressure between ideal parallel plates", status: "established",
  symbols: { ...constants("hbar", "c"), a: { tex: "a", unit: "m", dims: { L: 1 }, description: "plate separation" } },
  output: { tex: "P", unit: "Pa", dims: { M: 1, L: -1, T: -2 } },
  expr: term("P", neg(div(mul(pow(PI, 2), term("hbar", "hbar"), term("c", "c")), mul(240, pow(term("a", "a"), 4))))),
  domain: { a: [1e-8, 1e-5, "log"] },
  references: [BORDAG, BRESSI, CODATA_2018],
});
