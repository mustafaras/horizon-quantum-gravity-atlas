/* Flamm embedding and special-relativity factors. */

import { defineFormula } from "../formula.mjs";
import { sqrt, mul, sub, pow, div, neg, term } from "../expr.mjs";
import { constants, CODATA_2018 } from "./constants.mjs";

export const newtonianPotential = defineFormula({
  id: "newtonian-potential", title: "Newtonian potential (weak-field limit)", status: "established",
  symbols: {
    ...constants("G", "c"),
    M: { tex: "M", unit: "kg", dims: { M: 1 }, description: "mass of the source" },
    r: { tex: "r", unit: "m", dims: { L: 1 }, description: "distance from the source" },
  },
  output: { tex: "\\Phi/c^{2}", unit: "1", dims: {} },
  expr: term("phi", neg(div(mul("G", "M"), mul("r", pow("c", 2))))),
  domain: { M: [1e-2, 1e2, "log"], r: [1, 1e2, "log"] },
  references: [
    { citation: "Einstein, Die Grundlage der allgemeinen Relativitätstheorie, Ann. Phys. 354, 769 (1916)", doi: "10.1002/andp.19163540702", retrieved: "2026-10-24" },
    CODATA_2018,
  ],
});

export const flammEmbedding = defineFormula({
  id: "flamm-embedding", title: "Flamm paraboloid embedding", status: "established",
  symbols: {
    r: { tex: "r", unit: "m", dims: { L: 1 }, description: "areal radius, r ≥ r_s" },
    rs: { tex: "r_s", unit: "m", dims: { L: 1 }, description: "Schwarzschild radius" },
  },
  output: { tex: "z(r)", unit: "m", dims: { L: 1 } },
  expr: term("z", mul(2, sqrt(mul("rs", sub("r", "rs"))))),
  domain: { rs: [0.5, 1, "lin"], r: [1, 20, "lin"] },
  references: [
    { citation: "Morris & Thorne, Wormholes in spacetime and their use for interstellar travel, Am. J. Phys. 56, 395 (1988)", doi: "10.1119/1.15620", retrieved: "2026-10-22" },
  ],
});

export const lorentzGamma = defineFormula({
  id: "lorentz-gamma", title: "Lorentz factor", status: "established",
  symbols: { beta: { tex: "\\beta", unit: "1", dims: {}, description: "v/c" } },
  output: { tex: "\\gamma", unit: "1", dims: {} },
  expr: term("gamma", div(1, sqrt(sub(1, pow("beta", 2))))),
  domain: { beta: [0, 0.999, "lin"] },
  references: [{ citation: "Einstein, Zur Elektrodynamik bewegter Körper, Ann. Phys. 322, 891 (1905)", doi: "10.1002/andp.19053221004", retrieved: "2026-10-22" }],
});
