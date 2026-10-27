// Gauge-coupling running and unification (S17): the three inverse couplings against log10 mu with their bands, one-loop and two-loop lines,
// the Standard Model or the MSSM, and the magnified triangle where the lines nearly meet.

import { figure, axis, line, band, points, rule, region } from "../spec.mjs";

const COUPLING_COLORS = Object.freeze(["cat-1", "cat-2", "cat-3"]);
const COUPLING_TEX = Object.freeze(["\\alpha_1^{-1}", "\\alpha_2^{-1}", "\\alpha_3^{-1}"]);
const NAMES = Object.freeze(["a1", "a2", "a3"]);
const LINE_WIDTH = 1.5;
const FOCAL_WIDTH = 2.2; // drawn at 1.15 times this: the 2.5 px focal line of the art direction
const ONE_LOOP_WIDTH = 1.2;
const BAND_FILL = 0.12; // at or under the 18 percent of the art direction
const GUT_REGION = Object.freeze([15, 17]); // display convention, not a derived range (ledger D-101)
const X_DOMAIN = Object.freeze([1.9, 19.1]);
const Y_DOMAIN = Object.freeze([0, 64]);
const MIN_VISIBLE = 0.005;
const TRIANGLE_PAD = 1.25;
const MIN_HALF_WIDTH = 0.05;
const WINDOW_Y_PAD = 0.08;

/** The registered provenance entry follows the status: a caption must carry the status its entry declares, and the MSSM view is conjectural. */
export const provenanceFor = (id, status) => (status === "conjectural" ? `${id}-mssm` : id);

const layerLines = (layer, { focusIndex, showOneLoop }) => {
  const id = (prefix, i) => (layer.primary ? `${prefix}:${NAMES[i]}` : null);
  const marks = [];
  for (let i = 0; i < 3; i++) {
    const fill = BAND_FILL * layer.opacity;
    if (fill > BAND_FILL * MIN_VISIBLE) marks.push(band({ x: layer.twoLoop.log10Mu, y0: layer.band.lower[i], y1: layer.band.upper[i], layer: "model", color: COUPLING_COLORS[i], fill, id: id("band", i) }));
  }
  for (let i = 0; i < 3; i++) {
    if (layer.opacity < MIN_VISIBLE) continue;
    marks.push(line({
      x: layer.twoLoop.log10Mu, y: layer.twoLoop.inv[i], layer: "model", color: COUPLING_COLORS[i], width: layer.primary && i === focusIndex ? FOCAL_WIDTH : LINE_WIDTH,
      focal: layer.primary && i === focusIndex, opacity: layer.opacity, id: id("twoloop", i), label: layer.primary ? { tex: COUPLING_TEX[i] } : undefined,
    }));
  }
  if (showOneLoop) {
    for (let i = 0; i < 3; i++) {
      if (layer.opacity < MIN_VISIBLE) continue;
      marks.push(line({
        x: layer.oneLoop.log10Mu, y: layer.oneLoop.inv[i], layer: "model", color: COUPLING_COLORS[i], width: ONE_LOOP_WIDTH, dash: "6 4", opacity: layer.opacity,
        id: id("oneloop", i), label: layer.primary && i === 0 ? { text: "dashed: one loop" } : undefined,
      }));
    }
  }
  return marks;
};

/**
 * The three inverse couplings against log10(mu/GeV).
 *   layers      [{ model, primary, opacity, twoLoop, oneLoop, band }]: one layer, or two while the SM and MSSM cross-fade; only the primary
 *               layer carries the mark ids a formula term can address (twoloop:aN, oneloop:aN, band:aN)
 *   inputs      { log10Mz, values: [3], sigmas: [3] }: the M_Z inputs drawn with their 1-sigma error bars (mark ids inputs:aN)
 *   mSusyLog    log10 of the SUSY threshold in GeV, or null with the Standard Model alone
 *   selectedLog the scale the readout and the formula's logarithm refer to (mark id "scale")
 */
export function couplingRunSpec({ layers, inputs, mSusyLog, mSusyOpacity = 1, selectedLog, focusIndex, showOneLoop, status, planckLog, height = 400 }) {
  const marks = [region({ x: GUT_REGION, layer: "model", color: "ink-dim", style: "hatch", id: "gut", text: { tex: "\\text{GUT region (schematic)}" } })];
  for (const layer of layers) marks.push(...layerLines(layer, { focusIndex, showOneLoop }));
  inputs.values.forEach((value, i) => marks.push(points({
    x: [inputs.log10Mz], y: [value], yErr: [[inputs.sigmas[i]], [inputs.sigmas[i]]], layer: "data", color: COUPLING_COLORS[i], radius: 3, id: `inputs:${NAMES[i]}`,
    label: i === 0 ? { text: "inputs at the Z mass" } : undefined,
  })));
  if (mSusyLog !== null) marks.push(rule({ axis: "x", value: mSusyLog, layer: "model", color: "ink-dim", dash: "2 4", opacity: mSusyOpacity, id: "susy", text: { tex: "M_{\\mathrm{SUSY}}\\ \\text{(conjectural)}" } }));
  marks.push(rule({ axis: "x", value: planckLog, layer: "model", color: "ink-dim", dash: "6 4", id: "planck", text: { tex: "M_{\\mathrm{Pl}}" } }));
  marks.push(rule({ axis: "x", value: selectedLog, layer: "model", color: "accent", dash: "", id: "scale" }));
  return figure({
    id: "rg-unification-couplings", title: "Running of the gauge couplings", status, provenanceId: provenanceFor("rg-unification-couplings", status), height,
    x: axis({ scale: { type: "linear", domain: [...X_DOMAIN] }, label: { tex: "\\log_{10}(\\mu/\\mathrm{GeV})" } }),
    y: axis({ scale: { type: "linear", domain: [...Y_DOMAIN] }, label: { tex: "\\alpha_i^{-1}" } }),
    marks,
    summary: "The inverse couplings of U(1), SU(2) and SU(3) against the logarithm of the scale. The SU(2) and SU(3) lines rise, the U(1) line falls; in the Standard Model the three lines cross pairwise between ten to the thirteen and ten to the seventeen gigaelectronvolts, in the supersymmetric model at about ten to the sixteen.",
  });
}

/**
 * The window around the triangle of the three lines: its horizontal half-width is the triangle's own width plus a margin (at least a few hundredths
 * of a decade), its vertical range the three lines over that width.
 */
function triangleWindow(layer, triangle) {
  const xs = triangle.vertices.map((v) => v.log10Mu);
  const centre = (Math.min(...xs) + Math.max(...xs)) / 2;
  const half = Math.max(((Math.max(...xs) - Math.min(...xs)) / 2) * TRIANGLE_PAD, MIN_HALF_WIDTH);
  const [x0, x1] = [centre - half, centre + half];
  let lo = Infinity, hi = -Infinity;
  const consider = (xValues, yValues) => xValues.forEach((x, k) => { if (x >= x0 && x <= x1) { lo = Math.min(lo, yValues[k]); hi = Math.max(hi, yValues[k]); } });
  layer.twoLoop.inv.forEach((y) => consider(layer.twoLoop.log10Mu, y));
  layer.band.lower.forEach((y) => consider(layer.twoLoop.log10Mu, y));
  layer.band.upper.forEach((y) => consider(layer.twoLoop.log10Mu, y));
  triangle.vertices.forEach((v) => { lo = Math.min(lo, v.inv); hi = Math.max(hi, v.inv); });
  const pad = (hi - lo) * WINDOW_Y_PAD;
  return { x: [x0, x1], y: [lo - pad, hi + pad] };
}

const formatArea = (area) => (area >= 1 ? area.toFixed(2) : area.toPrecision(2));

/** The magnified region where the three lines nearly meet: the triangle they enclose, its vertices and its area. */
export function triangleSpec({ layer, triangle, status, height = 340 }) {
  const win = triangleWindow(layer, triangle);
  const marks = [];
  for (let i = 0; i < 3; i++) marks.push(band({ x: layer.twoLoop.log10Mu, y0: layer.band.lower[i], y1: layer.band.upper[i], layer: "model", color: COUPLING_COLORS[i], fill: BAND_FILL }));
  for (let i = 0; i < 3; i++) marks.push(line({ x: layer.twoLoop.log10Mu, y: layer.twoLoop.inv[i], layer: "model", color: COUPLING_COLORS[i], width: LINE_WIDTH, id: `line:${NAMES[i]}`, label: { tex: COUPLING_TEX[i] } }));
  const closed = [...triangle.vertices, triangle.vertices[0]];
  marks.push(line({ x: closed.map((v) => v.log10Mu), y: closed.map((v) => v.inv), layer: "model", color: "ink-strong", width: FOCAL_WIDTH, focal: true, id: "triangle", label: { tex: `A=${formatArea(triangle.area)}\\ \\mathrm{dex}\\cdot\\alpha^{-1}` } }));
  marks.push(points({ x: triangle.vertices.map((v) => v.log10Mu), y: triangle.vertices.map((v) => v.inv), layer: "model", color: "ink-strong", radius: 3, id: "vertices" }));
  return figure({
    id: "rg-unification-triangle", title: "Where the three lines nearly meet", status, provenanceId: provenanceFor("rg-unification-triangle", status), height,
    x: axis({ scale: { type: "linear", domain: win.x }, label: { tex: "\\log_{10}(\\mu/\\mathrm{GeV})" } }),
    y: axis({ scale: { type: "linear", domain: win.y }, label: { tex: "\\alpha_i^{-1}" } }),
    marks,
    summary: `The three coupling lines magnified around their pairwise crossings. They enclose a triangle of area ${formatArea(triangle.area)} decades times inverse coupling: a perfect unification would make it a point.`,
  });
}
