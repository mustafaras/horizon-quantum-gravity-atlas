/* The Kruskal-Szekeres relations of the Penrose atlas (S19): the tortoise coordinate and the two null Kruskal
 * coordinates, in geometric units (G = c = 1), which is what the diagrams are drawn in. The scene binds terms of these
 * to the U and V coordinate lines it draws (js/visualizations/common/lens-scenes.mjs, "gr-penrose").
 *
 * Kruskal, Phys. Rev. 119, 1743 (1960). js/science/conformal.mjs evaluates the same closed forms, and
 * test/formula-core.test.mjs checks the two against each other point by point. */

import { defineFormula } from "../formula.mjs";
import { sub, add, mul, div, log, abs, exp, neg, atan, term } from "../expr.mjs";

const KRUSKAL = {
  citation: "Kruskal, Maximal extension of the Schwarzschild metric, Phys. Rev. 119, 1743 (1960)",
  doi: "10.1103/PhysRev.119.1743", retrieved: "2026-10-27",
};
const TORTOISE = {
  citation: "Misner, Thorne & Wheeler, Gravitation (Freeman, 1973), the tortoise coordinate of the Schwarzschild chart",
  url: "https://press.princeton.edu/books/hardcover/9780691177793/gravitation", retrieved: "2026-10-27",
};

// Geometric units: M and r are lengths and every exponent below is dimensionless.
const R_DESC = { tex: "r", unit: "1", dims: { L: 1 }, description: "Schwarzschild radial coordinate, r > 0" };
const M_DESC = { tex: "M", unit: "1", dims: { L: 1 }, description: "black-hole mass, a length in geometric units (G = c = 1)" };
const T_DESC = { tex: "t", unit: "1", dims: { L: 1 }, description: "Schwarzschild coordinate time, finite outside the horizon" };
const R_STAR_DESC = { tex: "r^*", unit: "1", dims: { L: 1 }, description: "tortoise coordinate r + 2M ln|r/2M - 1|, negative inside the horizon" };
const U_DESC = { tex: "U", unit: "1", dims: {}, description: "retarded Kruskal coordinate, negative in region I" };
const V_DESC = { tex: "V", unit: "1", dims: {}, description: "advanced Kruskal coordinate, positive in region I" };

/** r/2M - 1: the dimensionless quantity whose logarithm the tortoise coordinate takes. */
const CROSSING = sub(div("r", mul(2, "M")), 1);

/**
 * r* = r + 2M ln|r/2M - 1|. The absolute value is the whole point: r* is defined on both sides of the horizon and goes
 * to -infinity at r = 2M, which is what lets the Kruskal chart cover the interior as well as the exterior.
 */
export const penroseTortoise = defineFormula({
  id: "penrose-tortoise", title: "Tortoise coordinate of the Schwarzschild chart", status: "established",
  symbols: { r: R_DESC, M: M_DESC },
  output: { tex: "r^*", unit: "1", dims: { L: 1 } },
  expr: term("r_star", add("r", mul(2, "M", log(abs(CROSSING))))),
  domain: { r: [2.001, 60, "log"], M: [1, 1, "lin"] },
  references: [TORTOISE],
});

/**
 * U = -e^(-u/4M) with u = t - r*: the retarded null Kruskal coordinate. It vanishes on the horizon r = 2M, is negative
 * in the exterior and positive in the interior, which is how region II is reached without a coordinate singularity.
 */
export const penroseKruskalU = defineFormula({
  id: "penrose-kruskal-u", title: "Retarded Kruskal coordinate U", status: "established",
  symbols: { t: T_DESC, rStar: R_STAR_DESC, M: M_DESC },
  output: { tex: "U", unit: "1", dims: {} },
  expr: term("U", neg(exp(div(sub("rStar", "t"), mul(4, "M"))))),
  domain: { t: [-60, 60, "lin"], rStar: [-12, 60, "lin"], M: [1, 1, "lin"] },
  references: [KRUSKAL],
});

/** V = e^(v/4M) with v = t + r*: the advanced null Kruskal coordinate, positive everywhere and zero on the horizon. */
export const penroseKruskalV = defineFormula({
  id: "penrose-kruskal-v", title: "Advanced Kruskal coordinate V", status: "established",
  symbols: { t: T_DESC, rStar: R_STAR_DESC, M: M_DESC },
  output: { tex: "V", unit: "1", dims: {} },
  expr: term("V", exp(div(add("t", "rStar"), mul(4, "M")))),
  domain: { t: [-60, 60, "lin"], rStar: [-12, 60, "lin"], M: [1, 1, "lin"] },
  references: [KRUSKAL],
});

/**
 * T = arctan U + arctan V: the compactification that turns the infinite Kruskal plane into the finite diagram. Because
 * the same monotone arctan acts on both null coordinates, a null ray (one of U, V held fixed) stays at exactly 45
 * degrees. That is the relation the whole atlas rests on.
 */
export const penroseCompactT = defineFormula({
  id: "penrose-compact-t", title: "Compactified time coordinate T of the Penrose diagram", status: "established",
  symbols: { U: U_DESC, V: V_DESC },
  output: { tex: "T", unit: "rad", dims: {} },
  expr: term("T", add(atan("U"), atan("V"))),
  // Region I only, and away from the light cone T = 0: atan U + atan V cancels to zero where V = -U, and no float32
  // evaluation of a sum can be relative-accurate about a zero (the GPU-safety contract in Formula Core).
  domain: { U: [-1, -0.05, "lin"], V: [2, 20, "lin"] },
  references: [KRUSKAL],
});

/** R = arctan V - arctan U, the compactified radial coordinate, by the same construction. */
export const penroseCompactR = defineFormula({
  id: "penrose-compact-r", title: "Compactified radial coordinate R of the Penrose diagram", status: "established",
  symbols: { U: U_DESC, V: V_DESC },
  output: { tex: "R", unit: "rad", dims: {} },
  expr: term("R", sub(atan("V"), atan("U"))),
  // The same region-I window as penrose-compact-t: R is a difference of two arctangents and would cancel elsewhere.
  domain: { U: [-1, -0.05, "lin"], V: [2, 20, "lin"] },
  references: [KRUSKAL],
});
