// Standard Model plots: the radial slice of the Higgs potential. The neutrino figure is plots/neutrino.mjs.

import { figure, axis, line, points, rule, callout } from "../spec.mjs";
import { grid, evaluate } from "./sample.mjs";

export const HIGGS_LAMBDA = 1;
export const higgsPotential = (phi, mu2, lambda = HIGGS_LAMBDA) => mu2 * phi * phi + lambda * phi * phi * phi * phi;
export const higgsVev = (mu2, lambda = HIGGS_LAMBDA) => (mu2 < 0 ? Math.sqrt(-mu2 / (2 * lambda)) : 0);

/** Radial slice V(phi) = mu^2 phi^2 + lambda phi^4 with the vacuum state marked. */
export function higgsPotentialSpec({ mu2, height = 260 }) {
  const phi = grid(-1.2, 1.2, 240);
  const v = evaluate(phi, (p) => higgsPotential(p, mu2));
  const vev = higgsVev(mu2);
  let vmin = 0, vmax = 0.4;
  for (const value of v) { if (value < vmin) vmin = value; if (value > vmax) vmax = value; }
  const pad = (vmax - vmin) * 0.06;
  const broken = vev > 0;
  const vac = higgsPotential(vev, mu2);
  return figure({
    id: "sm-higgs-potential", title: "Higgs potential, radial slice", status: "schematic",
    provenanceId: "sm-higgs-potential", height,
    x: axis({ scale: { type: "linear", domain: [-1.2, 1.2] }, label: { tex: "\\phi" } }),
    y: axis({ scale: { type: "linear", domain: [vmin - pad, vmax + pad] }, label: { tex: "V(\\phi)" } }),
    marks: [
      line({ x: phi, y: v, layer: "model", color: "pigment-amber-80", label: { tex: "V=\\mu^2\\phi^2+\\lambda\\phi^4" } }),
      points({ x: broken ? [vev, -vev] : [0], y: broken ? [vac, vac] : [vac], layer: "model", focal: true, color: "pigment-cyan-78", radius: 5, label: "vacuum" }),
      callout({ x: broken ? vev : 0, y: vac, layer: "model", color: "pigment-cyan-78", dx: broken ? -24 : 40, dy: broken ? -64 : -56,
        text: { tex: broken ? "\\langle\\phi\\rangle=v\\neq 0" : "\\langle\\phi\\rangle=0" } }),
    ],
    summary: broken ? "Broken phase: two degenerate minima at plus and minus the vacuum expectation value." : "Unbroken phase: a single minimum at the origin.",
  });
}
