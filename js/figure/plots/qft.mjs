// Quantum field theory plots: scalar-field dispersion, the collision waterfall, the angular
// distribution and the energy scan. Data come from js/physics.mjs.

import { figure, axis, line, points, rule, callout, heatmap } from "../spec.mjs";
import { angularDistribution } from "../../physics.mjs";
import { grid, evaluate } from "./sample.mjs";

/** omega(k) = sqrt(c^2 k^2 + m_eff^2) with the lab's constants c^2 = 30, m_eff = 3m. */
export function dispersionSpec({ mass, height = 150 }) {
  const C = Math.sqrt(30), kmax = 2.2, m0 = 3 * mass;
  const wmax = Math.sqrt(C * C * kmax * kmax + 9 * 9); // fixed y-scale (m up to 3 gives m0 = 9)
  const k = grid(0, kmax, 120);
  const omega = evaluate(k, (v) => Math.sqrt(C * C * v * v + m0 * m0));
  return figure({
    id: "qft-dispersion", title: "Dispersion ω(k)", status: "schematic", provenanceId: "qft-dispersion", height,
    x: axis({ scale: { type: "linear", domain: [0, kmax] }, label: { tex: "k" } }),
    y: axis({ scale: { type: "linear", domain: [0, wmax] }, label: { tex: "\\omega" } }),
    marks: [
      line({ x: [0, kmax], y: [0, C * kmax], layer: "model", dash: "4 4", color: "ink-dim", label: { tex: "\\omega=ck\\ \\text{(massless)}" } }),
      line({ x: k, y: omega, layer: "model", focal: true, color: "pigment-cyan-80", label: { tex: "\\omega=\\sqrt{c^2k^2+m^2}" } }),
      points({ x: [0], y: [m0], layer: "model", color: "pigment-amber-85", radius: 3.5 }),
      callout({ x: 0, y: m0, layer: "model", color: "pigment-amber-85", dx: 28, dy: m0 > wmax * 0.6 ? 20 : -24, text: { tex: "\\text{mass gap }\\omega_0=mc^2" } }),
    ],
    summary: "Raising the mass lifts the whole curve; at zero mass it collapses onto the light cone.",
  });
}

export const WATERFALL_COLS = 220;
export const WATERFALL_ROWS = 130;

/** Two wave packets converging, interacting at the midpoint and receding; rows are tau, columns are position. */
export function waterfallField(cosTheta, cols = WATERFALL_COLS, rows = WATERFALL_ROWS) {
  const sigma = 0.15, k = 30;
  const ct = Math.cos(Math.acos(Math.max(-1, Math.min(1, cosTheta))));
  const z = [];
  for (let j = 0; j < rows; j++) {
    const t = j / (rows - 1);
    const f = t <= 0.5 ? 1 - t / 0.5 : (t - 0.5) / 0.5 * ct;
    const a = -f, b = f;
    const row = new Array(cols);
    for (let i = 0; i < cols; i++) {
      const x = -1 + (2 * i) / (cols - 1);
      const da = x - a, db = x - b;
      row[i] = Math.exp(-(da * da) / (sigma * sigma)) * Math.cos(k * da) + Math.exp(-(db * db) / (sigma * sigma)) * Math.cos(k * db);
    }
    z.push(row);
  }
  return z;
}

export function waterfallSpec({ cosTheta, tau, height = 268 }) {
  const t = Math.min(1, Math.max(0, tau));
  return figure({
    id: "qft-waterfall", title: "Spacetime picture: wave-packet collision", status: "schematic", provenanceId: "qft-waterfall", height,
    x: axis({ scale: { type: "linear", domain: [-1, 1] }, label: { text: "longitudinal position (arb.)" } }),
    y: axis({ scale: { type: "linear", domain: [1, 0] }, label: { tex: "\\tau" } }),
    marks: [
      heatmap({ z: waterfallField(cosTheta), x: [-1, 1], y: [0, 1], palette: "diverging", zDomain: [-1.2, 1.2], layer: "model" }),
      rule({ axis: "y", value: t, layer: "model", color: "pigment-amber-89", dash: null, text: { tex: "\\tau" } }),
      rule({ axis: "x", value: 0, layer: "model", color: "ink-dim", dash: "3 4" }),
    ],
    summary: "Schematic wave packets: two packets approach along the beam axis, overlap at tau = 0.5 and recede at the scattering angle.",
  });
}

/** Differential cross-section against cos(theta), normalised to its 90 degree value, y clipped at 20. */
export function angularSpec({ process, cosTheta, photonX, height = 196 }) {
  const shape = (c) => angularDistribution({ process: process.id, cosTheta: c, photonX });
  const s90 = shape(0) || 1;
  const N = 240;
  const x = grid(-1, 1, N);
  const ratio = x.map((c) => shape(c) / s90);
  const yMax = Math.min(20, Math.max(...ratio));
  const cNow = Math.max(-1, Math.min(1, cosTheta));
  const clipped = ratio.map((r) => Math.min(r, yMax));
  return figure({
    id: "qft-angular-distribution", title: "Angular distribution", status: "effective", provenanceId: "qft-angular-distribution", height,
    x: axis({ scale: { type: "linear", domain: [-1, 1] }, label: { tex: "\\cos\\theta" } }),
    y: axis({ scale: { type: "linear", domain: [0, yMax] }, label: { tex: "\\sigma(\\theta)/\\sigma(90^\\circ)" } }),
    marks: [
      rule({ axis: "y", value: 1, layer: "model", color: "pigment-amber-89", text: { tex: "90^\\circ" } }),
      line({ x, y: clipped, layer: "model", focal: true, color: "pigment-azure-80-c11", label: process.sub ?? process.id }),
      rule({ axis: "x", value: cNow, layer: "model", color: "pigment-amber-89", dash: null }),
      points({ x: [cNow], y: [Math.min(yMax, shape(cNow) / s90)], layer: "model", color: "pigment-amber-89", radius: 3.4, label: "selected angle" }),
    ],
    summary: `Normalised angular distribution for ${process.name ?? process.id}; the vertical axis is clipped at ${yMax.toFixed(1)} times the 90 degree value.`,
  });
}

