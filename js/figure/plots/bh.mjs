// Black-hole plots: the Hawking blackbody spectrum shape and the Page curve.

import { figure, axis, line, band, rule } from "../spec.mjs";
import { hawkingSpectralShape, pageCurveEntropy } from "../../physics.mjs";
import { grid, evaluate } from "./sample.mjs";

export const HAWKING_X_MAX = 3;

/** Visual temperature of the illustrative spectrum: smaller mass and weaker spin suppression run hotter. */
export const hawkingVisualTemperature = (logM, tempFactor) => Math.max(0.06, (1 - logM / 9) * tempFactor * 0.95 + 0.05);

/** x^3 / (e^(x/T) - 1) on 0..3, normalised to its peak. The absolute scale is illustrative. */
export function hawkingSpectrumSpec({ logM, tempFactor, height = 150 }) {
  const T = hawkingVisualTemperature(logM, tempFactor);
  const x = grid(0, HAWKING_X_MAX, 200);
  const raw = evaluate(x, (v) => hawkingSpectralShape(v, T));
  let peak = 0;
  for (let i = 1; i <= 200; i++) peak = Math.max(peak, hawkingSpectralShape((i / 200) * HAWKING_X_MAX, T));
  const y = raw.map((v) => (Number.isFinite(v) ? v / peak : 0));
  return figure({
    id: "bh-hawking-spectrum", title: "Hawking spectrum (blackbody)", status: "schematic",
    provenanceId: "bh-hawking-spectrum", height,
    x: axis({ scale: { type: "linear", domain: [0, HAWKING_X_MAX] }, label: { text: "photon energy (arb.)" } }),
    y: axis({ scale: { type: "linear", domain: [0, 1.05] }, label: { text: "flux (arb.)" } }),
    marks: [
      band({ x, y0: y.map(() => 0), y1: y, layer: "model", color: "pigment-orange-78", opacity: 0.16 }),
      line({ x, y, layer: "model", focal: true, emitter: true, color: "pigment-orange-85", label: { tex: "x^3/(e^{x/T}-1)" } }),
    ],
    summary: "Illustrative blackbody shape; the peak moves with the mass and spin sliders, the absolute scale is not physical.",
  });
}

/** Page curve S_rad(f): Hawking's ever-rising thermal entropy against the unitary curve. */
export function pageCurveSpec({ height = 150 } = {}) {
  const f = grid(0, 1, 100);
  const naive = evaluate(f, (v) => Math.min(1, Math.min(1.6, 1.7 * v)));
  const unitary = evaluate(f, (v) => 0.85 * pageCurveEntropy(v));
  return figure({
    id: "bh-page-curve", title: "Page curve S_rad(t)", status: "schematic",
    provenanceId: "bh-page-curve", height,
    x: axis({ scale: { type: "linear", domain: [0, 1] }, label: { text: "evaporated fraction" } }),
    y: axis({ scale: { type: "linear", domain: [0, 1.05] }, label: { tex: "S_{\\mathrm{rad}}" } }),
    marks: [
      line({ x: f, y: naive, layer: "model", dash: "4 4", color: "pigment-red-65", label: "Hawking (info lost)" }),
      line({ x: f, y: unitary, layer: "model", focal: true, color: "pigment-azure-82", label: "unitary (Page)" }),
      rule({ axis: "x", value: 0.5, layer: "model", color: "pigment-amber-79-c12", text: { text: "Page time" } }),
    ],
    summary: "Unitary evaporation: the radiation entropy rises until the Page time and then falls back to zero.",
  });
}
