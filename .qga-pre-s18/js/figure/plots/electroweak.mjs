// The electroweak figures of the amplitude room (S16): sigma(sqrt s) on a log axis and A_FB(sqrt s) stacked over one shared x axis, and the
// channel decomposition of the angular distribution. The numbers come from js/science/electroweak.mjs and js/science/data/electroweak.mjs;
// this file only draws them. The two energy figures share the x domain, the ticks and (through minLeft) the plot rectangle, so a vertical
// line through one is a vertical line through the other.

import { figure, axis, line, points, rule, callout } from "../spec.mjs";
import { grid } from "./sample.mjs";
import {
  DEFAULT_PARAMS, crossSectionScan, qedCrossSection, totalCrossSection, forwardBackwardAsymmetry, zeroCrossing, channelDecomposition,
} from "../../science/electroweak.mjs";
import { LEP_POLE, derivedMuonPoleCrossSection } from "../../science/data/electroweak.mjs";

export const ENERGY_RANGE = Object.freeze([10, 200]);
const SCAN_POINTS = 600;
const SHARED_MIN_LEFT = 64;
const SIGMA_DOMAIN = [1e-3, 10];
const AFB_DOMAIN = [-0.8, 0.8];
const ZERO_SEARCH = Object.freeze({ lo: 60, hi: DEFAULT_PARAMS.mZ });
// Colours come from the token families of the art direction (accent for the focal model line, the categorical set for the rest), not from the frozen pigments.
const MODEL_COLOR = "accent";
const MARK_COLOR = "cat-1";
const DATA_COLOR = "cat-3";
const QED_COLOR = "ink-dim";

let cachedScan = null;
const scan = () => (cachedScan ??= crossSectionScan({ from: ENERGY_RANGE[0], to: ENERGY_RANGE[1], n: SCAN_POINTS }));

const energyAxis = () => axis({ scale: { type: "linear", domain: ENERGY_RANGE }, label: { tex: "\\sqrt{s}" }, unit: "GeV" });
const poleRule = () => rule({ axis: "x", value: DEFAULT_PARAMS.mZ, layer: "model", color: MARK_COLOR, dash: "3 4", text: { tex: "M_Z" } });
const inRange = (v) => v >= ENERGY_RANGE[0] && v <= ENERGY_RANGE[1];

/** sigma(e+ e- -> mu+ mu-) in nb: the gamma + Z line, the photon-only line, the LEP pole value and the selected energy. */
export function crossSectionSpec({ sqrtS, height = 250 }) {
  const { sqrtS: x, sigma } = scan();
  const pole = derivedMuonPoleCrossSection();
  const photon = x.map((v) => qedCrossSection(v, DEFAULT_PARAMS.alpha));
  const marks = [
    poleRule(),
    line({ x, y: photon, layer: "model", color: QED_COLOR, dash: "4 4", width: 1.4, label: { tex: "\\gamma\\ \\mathrm{only}" } }),
    line({ x, y: sigma, layer: "model", focal: true, color: MODEL_COLOR, width: 2.6, label: { tex: "\\gamma+Z" } }),
    points({ x: [LEP_POLE.mZ.value], y: [pole.value], yErr: [[pole.uncertainty], [pole.uncertainty]], layer: "data", color: DATA_COLOR, radius: 4, label: { text: "LEP pole value (derived)" } }),
  ];
  if (inRange(sqrtS)) {
    marks.push(rule({ axis: "x", value: sqrtS, layer: "model", color: MARK_COLOR, dash: null }));
    marks.push(points({ x: [sqrtS], y: [totalCrossSection(sqrtS)], layer: "model", color: MARK_COLOR, radius: 3.4, label: { text: "selected energy" } }));
  }
  return figure({
    id: "qft-ew-cross-section", title: "σ(e⁺e⁻ → μ⁺μ⁻), tree level γ + Z", status: "effective", provenanceId: "qft-ew-cross-section", height, minLeft: SHARED_MIN_LEFT,
    x: energyAxis(),
    y: axis({ scale: { type: "log", domain: SIGMA_DOMAIN }, label: { tex: "\\sigma" }, unit: "nb" }),
    marks,
    summary: `Tree-level cross-section for electron-positron annihilation into muons through a photon and a Z boson, from 10 to 200 GeV on a logarithmic axis. `
      + `It falls as one over s from ${totalCrossSection(ENERGY_RANGE[0]).toFixed(2)} nb at 10 GeV, peaks at ${totalCrossSection(DEFAULT_PARAMS.mZ).toFixed(2)} nb on the Z pole, `
      + `and the LEP pole value, ${pole.value.toFixed(3)} nb, lies within 1 percent of it. The photon-only line shows what the Z adds.`,
  });
}

/** A_FB of the same process: the gamma + Z line, the LEP pole asymmetry, the pole rule and the zero crossing of the interference. */
export function asymmetrySpec({ sqrtS, height = 250 }) {
  const { sqrtS: x, afb } = scan();
  const crossing = zeroCrossing(DEFAULT_PARAMS, ZERO_SEARCH);
  const lep = LEP_POLE.afbMu0;
  const marks = [
    poleRule(),
    rule({ axis: "y", value: 0, layer: "model", color: QED_COLOR, dash: "2 4" }),
    line({ x, y: afb, layer: "model", focal: true, color: MODEL_COLOR, width: 2.6, label: { tex: "\\gamma+Z" } }),
    points({ x: [LEP_POLE.mZ.value], y: [lep.value], yErr: [[lep.uncertainty], [lep.uncertainty]], layer: "data", color: DATA_COLOR, radius: 4, label: { text: "LEP pole value" } }),
    points({ x: [crossing], y: [0], layer: "model", color: MARK_COLOR, radius: 3.4, label: { text: `interference zero crossing, ${crossing.toFixed(1)} GeV` } }),
    callout({ x: crossing, y: 0, layer: "model", color: MARK_COLOR, dx: 24, dy: 40, text: { tex: "A_{\\mathrm{FB}}=0" } }),
  ];
  if (inRange(sqrtS)) {
    marks.push(rule({ axis: "x", value: sqrtS, layer: "model", color: MARK_COLOR, dash: null }));
    marks.push(points({ x: [sqrtS], y: [forwardBackwardAsymmetry(sqrtS)], layer: "model", color: MARK_COLOR, radius: 3.4, label: { text: "selected energy" } }));
  }
  return figure({
    id: "qft-ew-asymmetry", title: "Forward-backward asymmetry A_FB", status: "effective", provenanceId: "qft-ew-asymmetry", height, minLeft: SHARED_MIN_LEFT,
    x: energyAxis(),
    y: axis({ scale: { type: "linear", domain: AFB_DOMAIN }, label: { tex: "A_{\\mathrm{FB}}" } }),
    marks,
    summary: `Forward-backward asymmetry of the muons. It is negative below the Z pole, where the photon-Z interference dominates, crosses zero at ${crossing.toFixed(2)} GeV, `
      + `just under the pole, and rises to ${forwardBackwardAsymmetry(DEFAULT_PARAMS.mZ).toFixed(4)} on it; the LEP pole value is ${lep.value} plus or minus ${lep.uncertainty}.`,
  });
}

const CHANNEL_COLORS = ["cat-3", "cat-7", "cat-1"];
const CLIP = 20;
// Linear within +-0.01 of the 90 degree value and logarithmic outside, so a term a hundredth of the total (the photon on the Z pole) and a
// Coulomb pole twenty times it share one axis.
const CHANNEL_SYMLOG_CONSTANT = 0.01;
const POLE_MARGIN = 1 - 1e-4;

/** The terms of the angular distribution and their sum, each divided by the sum at 90 degrees; the sum is the focal line. */
export function channelsSpec({ processId, name, sqrtS, cosTheta, height = 232 }) {
  const x = grid(-1, 1, 241);
  // The forward and backward poles diverge exactly at cos theta = +-1 (t or u = 0): sample just inside, where the clip takes over.
  const at = (c) => channelDecomposition(processId, sqrtS, Math.max(-POLE_MARGIN, Math.min(POLE_MARGIN, c)));
  const reference = Math.abs(at(0).total) || 1;
  const columns = x.map((c) => at(c));
  const totals = columns.map((col) => col.total / reference);
  const yMax = Math.min(CLIP, Math.max(...totals));
  const termValues = columns[0].terms.map((_, i) => columns.map((col) => col.terms[i].value / reference));
  const yMin = Math.max(-CLIP, Math.min(0, ...termValues.flat()));
  const clip = (v) => Math.max(yMin, Math.min(yMax, v));
  const thin = columns[0].terms.length > 1
    ? columns[0].terms.map((term, i) => line({ x, y: termValues[i].map(clip), layer: "model", color: CHANNEL_COLORS[i], width: 1.2, label: { tex: term.tex } }))
    : [];
  const here = Math.max(-1, Math.min(1, cosTheta));
  return figure({
    id: "qft-angular-channels", title: `Channels of ${name}`, status: "effective", provenanceId: "qft-angular-channels", height,
    x: axis({ scale: { type: "linear", domain: [-1, 1] }, label: { tex: "\\cos\\theta" } }),
    y: axis({ scale: { type: "symlog", domain: [yMin, yMax], constant: CHANNEL_SYMLOG_CONSTANT }, label: { tex: "\\sigma(\\theta)/\\sigma(90^\\circ)" } }),
    marks: [
      rule({ axis: "y", value: 0, layer: "model", color: QED_COLOR, dash: "2 4" }),
      ...thin,
      line({ x, y: totals.map(clip), layer: "model", focal: true, color: MODEL_COLOR, width: 2.6, label: { text: "total" } }),
      rule({ axis: "x", value: here, layer: "model", color: MARK_COLOR, dash: null }),
    ],
    summary: `Angular distribution of ${name} at ${sqrtS.toFixed(1)} GeV split into its ${columns[0].terms.length} term${columns[0].terms.length > 1 ? "s" : ""}, `
      + `each divided by the total at 90 degrees; the vertical axis is symmetric-logarithmic and clipped at ${yMax.toFixed(1)}. The thick line is their sum.`,
  });
}
