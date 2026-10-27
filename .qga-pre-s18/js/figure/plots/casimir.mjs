// The Casimir lab's Figure Kit figure (S15): the magnitude of the ideal-plate pressure against the gap on log-log axes, with the agreement
// bands the two experiments report. The numbers come from js/science/casimir.mjs; this file only draws them.
//
//   pressureSpec  curve { gap[], pressure[] } (m, Pa, as pressureCurve returns), bressi and lamoreaux { gap[], low[], high[] } (as dataBand
//                 returns), probe { gap, pressure } the gap of the slider

import { figure, axis, line, band, points } from "../spec.mjs";

const LINE_COLOR = "pigment-amber-80";
const BRESSI_COLOR = "pigment-cyan-78";
const LAMOREAUX_COLOR = "ink-dim";
const BAND_FILL = 0.16;
const PRESSURE_DOMAIN = [1e-8, 1e6];
const GAP_DOMAIN = [1e-8, 1e-5];

const RATIO_DOMAIN = [0.6, 1.4];
const MEASURED_GAP_DOMAIN = [0.4e-6, 8e-6];
const MEASURED_GAP_TICKS = [0.5e-6, 1e-6, 2e-6, 5e-6];

/**
 * The same bands as a ratio to the ideal line, where ±5 and ±15 percent are visible (on the log-log axes of pressureSpec they are one to
 * three pixels thick). bressi and lamoreaux are { gap[], low[], high[] } as ratioBand returns them.
 */
export function agreementSpec({ bressi, lamoreaux, height = 220 }) {
  const edge = [MEASURED_GAP_DOMAIN[0], MEASURED_GAP_DOMAIN[1]];
  return figure({
    id: "qft-casimir-agreement", title: "Measured pressure against the ideal plates", status: "established",
    provenanceId: "qft-casimir-agreement", height,
    x: axis({ scale: { type: "log", domain: MEASURED_GAP_DOMAIN }, ticks: MEASURED_GAP_TICKS, label: { tex: "a" }, unit: "m" }),
    y: axis({ scale: { type: "linear", domain: RATIO_DOMAIN }, label: { tex: "P/P_{\\mathrm{ideal}}" } }),
    marks: [
      band({ x: lamoreaux.gap, y0: lamoreaux.low, y1: lamoreaux.high, layer: "data", color: LAMOREAUX_COLOR, fill: BAND_FILL, label: { text: "Lamoreaux 1997, 5% agreement" } }),
      band({ x: bressi.gap, y0: bressi.low, y1: bressi.high, layer: "data", color: BRESSI_COLOR, fill: BAND_FILL, label: { text: "Bressi 2002, 15% precision" } }),
      line({ x: edge, y: [1, 1], layer: "model", focal: true, color: LINE_COLOR, width: 2.6, label: { text: "ideal plates" } }),
    ],
    summary: `Relative to the ideal-plate pressure, the Lamoreaux band runs from ${Math.min(...lamoreaux.low).toFixed(2)} to ${Math.max(...lamoreaux.high).toFixed(2)} between 0.6 and 6 micrometres, `
      + `and the Bressi and colleagues band from ${Math.min(...bressi.low).toFixed(2)} to ${Math.max(...bressi.high).toFixed(2)} between 0.5 and 3 micrometres.`,
  });
}

export function pressureSpec({ curve, bressi, lamoreaux, probe, height = 320 }) {
  const marks = [
    band({ x: lamoreaux.gap, y0: lamoreaux.low, y1: lamoreaux.high, layer: "data", color: LAMOREAUX_COLOR, fill: BAND_FILL, label: { text: "Lamoreaux 1997, 5% agreement" } }),
    band({ x: bressi.gap, y0: bressi.low, y1: bressi.high, layer: "data", color: BRESSI_COLOR, fill: BAND_FILL, label: { text: "Bressi 2002, 15% precision" } }),
    line({ x: curve.gap, y: curve.pressure, layer: "model", focal: true, color: LINE_COLOR, width: 2.6, label: { tex: "|P| = \\pi^2\\hbar c/240a^4" } }),
    points({ x: [probe.gap], y: [probe.pressure], layer: "model", color: "ink-strong", radius: 4.5, label: { text: "your gap" } }),
  ];
  return figure({
    id: "qft-casimir-pressure", title: "Casimir pressure between ideal plates", status: "established",
    provenanceId: "qft-casimir-pressure", height,
    x: axis({ scale: { type: "log", domain: GAP_DOMAIN }, label: { tex: "a" }, unit: "m" }),
    y: axis({ scale: { type: "log", domain: PRESSURE_DOMAIN }, label: { tex: "|P|" }, unit: "Pa" }),
    marks,
    summary: `The attractive pressure between ideal plates falls as the fourth power of the gap, from ${curve.pressure[0].toExponential(1)} pascal at 10 nanometres to ${curve.pressure[curve.pressure.length - 1].toExponential(1)} pascal at 10 micrometres. `
      + "Two bands mark where experiments measured it: Lamoreaux between 0.6 and 6 micrometres to 5 percent, Bressi and colleagues between 0.5 and 3 micrometres to 15 percent.",
  });
}
