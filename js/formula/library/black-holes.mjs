/* Black-hole formulas. SI constants as symbols; geometric units bind them to 1. */

import { defineFormula } from "../formula.mjs";
import { div, mul, add, sqrt, pow, sub, term, PI } from "../expr.mjs";
import { constants, CODATA_2018 } from "./constants.mjs";

const SCHWARZSCHILD = { citation: "Schwarzschild, On the gravitational field of a mass point according to Einstein's theory (1916), trans. Antoci & Loinger", arxiv: "physics/9905030", retrieved: "2026-10-22" };
const HAWKING = { citation: "Hawking, Particle creation by black holes, Commun. Math. Phys. 43, 199 (1975)", doi: "10.1007/BF02345020", retrieved: "2026-10-22" };
const BEKENSTEIN = { citation: "Bekenstein, Black holes and entropy, Phys. Rev. D 7, 2333 (1973)", doi: "10.1103/PhysRevD.7.2333", retrieved: "2026-10-22" };
const KERR = { citation: "Kerr, Gravitational field of a spinning mass as an example of algebraically special metrics, Phys. Rev. Lett. 11, 237 (1963)", doi: "10.1103/PhysRevLett.11.237", retrieved: "2026-10-22" };
const BPT = { citation: "Bardeen, Press & Teukolsky, Rotating black holes: locally nonrotating frames, energy extraction, and scalar synchrotron radiation, Astrophys. J. 178, 347 (1972)", doi: "10.1086/151796", retrieved: "2026-10-22" };

const mass = { tex: "M", unit: "kg", dims: { M: 1 }, description: "black-hole mass" };

export const schwarzschildRadius = defineFormula({
  id: "schwarzschild-radius", title: "Schwarzschild radius", status: "established",
  symbols: { ...constants("G", "c"), M: mass },
  output: { tex: "r_s", unit: "m", dims: { L: 1 } },
  expr: term("r_s", div(mul(2, "G", "M"), pow("c", 2))),
  domain: { M: [1e-2, 1e2, "log"] },
  references: [SCHWARZSCHILD, CODATA_2018],
});

export const hawkingTemperature = defineFormula({
  id: "hawking-temperature", title: "Hawking temperature", status: "established",
  symbols: { ...constants("hbar", "c", "G", "kB"), M: mass },
  output: { tex: "T_H", unit: "K", dims: { Th: 1 } },
  expr: term("T_H", div(mul("hbar", pow("c", 3)), mul(8, PI, "G", "M", "kB"))),
  domain: { M: [1e-2, 1e2, "log"] },
  references: [HAWKING, CODATA_2018],
});

export const bekensteinHawkingEntropy = defineFormula({
  id: "bekenstein-hawking-entropy", title: "Bekenstein–Hawking entropy", status: "established",
  symbols: { ...constants("kB", "c", "G", "hbar"), A: { tex: "A", unit: "m^2", dims: { L: 2 }, description: "horizon area" } },
  output: { tex: "S_{BH}", unit: "J K^-1", dims: { M: 1, L: 2, T: -2, Th: -1 } },
  expr: term("S_BH", div(mul("kB", pow("c", 3), "A"), mul(4, "G", "hbar"))),
  domain: { A: [1e-2, 1e2, "log"] },
  references: [BEKENSTEIN, HAWKING, CODATA_2018],
});

const length = (tex, description) => ({ tex, unit: "m", dims: { L: 1 }, description });

export const kerrOuterHorizon = defineFormula({
  id: "kerr-outer-horizon", title: "Kerr outer horizon", status: "established",
  symbols: { M: length("M", "mass in length units, GM/c^2"), a: length("a", "spin parameter in length units, J/(Mc), a ≤ M") },
  output: { tex: "r_+", unit: "m", dims: { L: 1 } },
  expr: term("r_plus", add("M", sqrt(sub(pow("M", 2), pow("a", 2))))),
  domain: { M: [0.5, 2, "lin"], a: [0, 0.5, "lin"] },
  references: [KERR, BPT],
});

export const photonSphere = defineFormula({
  id: "schwarzschild-photon-sphere", title: "Schwarzschild photon sphere", status: "established",
  symbols: { M: length("M", "mass in length units, GM/c^2") },
  output: { tex: "r_{ph}", unit: "m", dims: { L: 1 } },
  expr: term("r_ph", mul(3, "M")),
  domain: { M: [1e-2, 1e2, "log"] },
  references: [BPT],
});

export const criticalImpact = defineFormula({
  id: "schwarzschild-critical-impact", title: "Schwarzschild critical impact parameter", status: "established",
  symbols: { M: length("M", "mass in length units, GM/c^2") },
  output: { tex: "b_c", unit: "m", dims: { L: 1 } },
  expr: term("b_c", mul(3, sqrt(3), "M")),
  domain: { M: [1e-2, 1e2, "log"] },
  references: [BPT],
});
