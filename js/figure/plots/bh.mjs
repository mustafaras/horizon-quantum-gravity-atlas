// Black-hole plots: the Hawking blackbody spectrum shape and the Page curve.

import { figure, axis, line, band, rule } from "../spec.mjs";
import { hawkingSpectralShape } from "../../physics.mjs";
import { pageCurve, radiationEntropyFraction, pageTimeSummary } from "../../science/evaporation.mjs";
import { greybodySpectrum } from "../../science/greybody.mjs";
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
      band({ x, y0: y.map(() => 0), y1: y, layer: "model", color: "pigment-orange-78", fill: 0.16 }),
      line({ x, y, layer: "model", focal: true, emitter: true, color: "pigment-orange-85", label: { tex: "x^3/(e^{x/T}-1)" } }),
    ],
    summary: "Illustrative blackbody shape; the peak moves with the mass and spin sliders, the absolute scale is not physical.",
  });
}

/**
 * The Page curve, derived rather than drawn.
 *
 * Three curves: the black hole's remaining entropy S_BH = S₀(1−t/τ)^{2/3}, the radiation entropy Page computed
 * S_rad = β(S₀ − S_BH) with β = 1.4847, and the Page curve, which is the minimum of the two. The crossing is the
 * Page time and it is computed, not placed by hand.
 */
export function pageCurveSpec({ height = 190 } = {}) {
  const f = grid(0, 1, 120);
  const summary = pageTimeSummary();
  const bh = evaluate(f, (v) => Math.min(1, Math.max(0, 1 - v) ** (2 / 3)));
  const rad = evaluate(f, (v) => Math.min(1, radiationEntropyFraction(v)));
  const page = evaluate(f, (v) => Math.min(1, pageCurve(v)));
  return figure({
    id: "bh-page-curve", title: "The Page curve, derived", status: "effective",
    provenanceId: "bh-page-curve", height,
    x: axis({ scale: { type: "linear", domain: [0, 1] }, label: { text: "evaporated fraction t/tau" } }),
    y: axis({ scale: { type: "linear", domain: [0, 1.05] }, label: { tex: "S/S_0" } }),
    marks: [
      line({ x: f, y: bh, layer: "model", color: "pigment-blue-64", label: { text: "black hole entropy" } }),
      line({ x: f, y: rad, layer: "model", dash: "4 4", color: "pigment-red-65", label: { tex: "\beta(S_0-S_{BH}),\ \beta=1.4847" } }),
      line({ x: f, y: page, layer: "model", focal: true, color: "pigment-azure-82", label: { text: "Page curve" } }),
      rule({ axis: "x", value: summary.timeFraction, layer: "model", color: "pigment-amber-79-c12", text: { text: "t/tau = 0.5381" } }),
    ],
    summary:
      `The Page curve is the minimum of the black hole's remaining entropy and the entropy the radiation has carried away. ` +
      `Page's coefficient beta = ${summary.beta} puts the crossing where S_BH/S_0 = ${summary.entropyFraction.toFixed(4)}, ` +
      `i.e. M/M_0 = ${summary.massFraction.toFixed(4)} at t/tau = ${summary.timeFraction.toFixed(4)} — not at half the evaporation.`,
  });
}

/**
 * The emitted spectrum: the pure blackbody Hawking shape against the greybody-corrected one.
 *
 * The correction is not a cosmetic wobble: the gravitational barrier suppresses the low-energy part of the
 * spectrum, which is why an evaporating hole emits fewer soft quanta than a blackbody of the same temperature.
 */
export function greybodySpectrumSpec({ temperature = 0.15, height = 200 } = {}) {
  const spec = greybodySpectrum({ omegaMax: 2, samples: 48, lMax: 2, M: 1, temperature });
  const peak = (values) => Math.max(...values.map((v) => Math.abs(v)), 1e-30);
  return figure({
    id: "bh-greybody-spectrum", title: "Hawking spectrum with greybody factors", status: "effective",
    provenanceId: "bh-greybody", height,
    legend: true,
    x: axis({ scale: { type: "linear", domain: [0, 2] }, label: { tex: "\omega\,(\hbar=c=1)" } }),
    y: axis({ scale: { type: "linear", domain: [0, 1.05] }, label: { text: "dN/domega dt (norm.)" } }),
    marks: [
      line({ x: spec.omega, y: spec.blackbody.map((v) => v / peak(spec.blackbody)), layer: "model", dash: "4 4",
        color: "pigment-orange-85", label: { text: "blackbody" } }),
      line({ x: spec.omega, y: spec.greybody.map((v) => v / peak(spec.blackbody)), layer: "model", focal: true,
        color: "pigment-azure-82", label: { text: "with greybody factors" } }),
    ],
    summary:
      "The thermal spectrum a black hole emits, with and without the greybody correction. The gravitational barrier " +
      "suppresses the low-energy end, so the corrected curve is lower where the blackbody is largest. The " +
      "transmission factors themselves are computed by solving the radial Regge-Wheeler equation.",
  });
}

const ring = (r, n = 121) => {
  const x = [], y = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * 2 * Math.PI; x.push(r * Math.cos(a)); y.push(r * Math.sin(a)); }
  return { x, y };
};

/**
 * Nested Kerr coordinate radii in the equatorial plane, in units of GM/c^2 (Boyer-Lindquist radii, not
 * image-plane distances). `rings` are `{ radius, color, dash, width, label }`; the horizon is focal.
 */
export function kerrRadiiSpec({ rings, domain, spin, height = 220 }) {
  const marks = rings.map((r) => line({ ...ring(r.radius), layer: "model", color: r.color, dash: r.dash || null, width: r.width, focal: !!r.focal, label: r.label }));
  return figure({
    id: "bh-kerr-radii", title: "Kerr radii, equatorial plane", status: "effective", provenanceId: "bh-kerr-radii", height, aspect: 1, maxPlotWidth: 300, legend: false,
    x: axis({ scale: { type: "linear", domain: [-domain, domain] }, label: { tex: "x" }, unit: "GM/c^2" }),
    y: axis({ scale: { type: "linear", domain: [-domain, domain] }, label: { tex: "y" }, unit: "GM/c^2" }),
    marks,
    summary: `Nested Kerr radii for a* = ${spin.toFixed(2)}: horizon, ergosurface, photon orbits and ISCO, prograde and retrograde, plotted to ${domain} GM/c^2.`,
  });
}
