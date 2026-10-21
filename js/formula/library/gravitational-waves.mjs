/* Leading-order (Newtonian quadrupole) inspiral. Teaching approximation: no spins, no higher PN orders. */

import { defineFormula } from "../formula.mjs";
import { div, mul, pow, add, rat, term, PI } from "../expr.mjs";
import { constants, CODATA_2018 } from "./constants.mjs";

const BLANCHET = { citation: "Blanchet, Gravitational radiation from post-Newtonian sources and inspiralling compact binaries, Living Rev. Relativ. 17, 2 (2014)", doi: "10.12942/lrr-2014-2", arxiv: "1310.1528" };
const mass = (tex, description) => ({ tex, unit: "kg", dims: { M: 1 }, description });

export const chirpMass = defineFormula({
  id: "chirp-mass", title: "Chirp mass", status: "established",
  symbols: { m1: mass("m_1", "primary mass"), m2: mass("m_2", "secondary mass") },
  output: { tex: "\\mathcal{M}", unit: "kg", dims: { M: 1 } },
  expr: term("Mc", mul(pow(mul("m1", "m2"), rat(3, 5)), pow(add("m1", "m2"), rat(-1, 5)))),
  domain: { m1: [1, 100, "log"], m2: [1, 100, "log"] },
  references: [BLANCHET],
});

export const newtonianGwFrequency = defineFormula({
  id: "newtonian-gw-frequency", title: "Newtonian gravitational-wave frequency", status: "effective",
  symbols: {
    ...constants("G", "c"),
    tau: { tex: "\\tau", unit: "s", dims: { T: 1 }, description: "time to coalescence t_c − t" },
    Mc: mass("\\mathcal{M}", "chirp mass"),
  },
  output: { tex: "f_{gw}", unit: "Hz", dims: { T: -1 } },
  expr: term("f_gw", mul(div(1, PI), pow(div(5, mul(256, "tau")), rat(3, 8)), pow(div(mul("G", "Mc"), pow("c", 3)), rat(-5, 8)))),
  domain: { tau: [1e-3, 1e3, "log"], Mc: [0.5, 50, "log"] },
  references: [BLANCHET, CODATA_2018],
});
