/* The Einstein-Hilbert beta functions of asymptotic safety in d = 4 with the optimised cutoff (S18): the vector field of the flow silk.
 * Reuter & Saueressig, New J. Phys. 14 (2012) 055022, eq. (4.15)-(4.20); the closed forms are derived in js/science/asymptotic-safety.mjs. */

import { defineFormula } from "../formula.mjs";
import { add, sub, mul, div, neg, pow, term, PI } from "../expr.mjs";

const REUTER_SAUERESSIG = { citation: "Reuter & Saueressig, Quantum Einstein Gravity, New J. Phys. 14 (2012) 055022, eq. (4.15)-(4.20)", doi: "10.1088/1367-2630/14/5/055022", arxiv: "1202.2274", retrieved: "2026-10-26" };

const SYMBOLS = {
  g: { tex: "g", unit: "1", dims: {}, description: "dimensionless Newton coupling, g = k^2 G_k" },
  lam: { tex: "\\lambda", unit: "1", dims: {}, description: "dimensionless cosmological constant, lambda = lambda-bar_k / k^2" },
};
const DOMAIN = { g: [0, 1.2, "lin"], lam: [-0.4, 0.3, "lin"] }; // 1 - g B2 stays away from zero here, so no pole is sampled

const C4 = div(1, mul(4, PI)); // (4 pi)^(1 - d/2) at d = 4
const U = sub(1, mul(2, "lam")); // 1 + w at w = -2 lambda

/** eta_N = g B1 / (1 - g B2) with B1 = (c/3)(20/u - 36/u^2 - 28) and B2 = -(c/6)(10/u - 12/u^2); one node, shared by both formulas. */
const B1 = mul(div(C4, 3), sub(sub(div(20, U), div(36, pow(U, 2))), 28));
const B2 = neg(mul(div(C4, 6), sub(div(10, U), div(12, pow(U, 2)))));
const ETA_EXPR = div(mul("g", B1), sub(1, mul("g", B2)));
const ETA = term("eta", ETA_EXPR); // a term id appears once per expression; beta_lambda uses eta twice, the second time unlabelled

/** beta_g = (2 + eta_N) g. */
export const asBetaG = defineFormula({
  id: "as-beta-g", title: "Beta function of the Newton coupling, Einstein-Hilbert truncation", status: "conjectural",
  symbols: SYMBOLS,
  output: { tex: "\\beta_g", unit: "1", dims: {} },
  expr: term("beta_g", mul(add(2, ETA), "g")),
  domain: DOMAIN,
  references: [REUTER_SAUERESSIG],
});

/** beta_lambda = (eta_N - 2) lambda + (c/2) g (20/u - 16 - (10/3) eta_N / u). */
export const asBetaLambda = defineFormula({
  id: "as-beta-lambda", title: "Beta function of the cosmological constant, Einstein-Hilbert truncation", status: "conjectural",
  symbols: SYMBOLS,
  output: { tex: "\\beta_\\lambda", unit: "1", dims: {} },
  expr: term("beta_lambda", add(mul(sub(ETA, 2), "lam"), mul(div(C4, 2), "g", sub(sub(div(20, U), 16), mul(div(10, 3), div(ETA_EXPR, U)))))),
  domain: DOMAIN,
  references: [REUTER_SAUERESSIG],
});
