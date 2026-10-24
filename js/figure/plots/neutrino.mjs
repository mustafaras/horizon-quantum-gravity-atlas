// The flavour ribbon: three stacked bands, P(e), P(mu) and P(tau) for the chosen initial flavour, over the energy at a fixed
// baseline or over L/E at a fixed energy. The curves come from js/science/neutrino.mjs; this file only draws them.
//
//   curves    { x, P }  P[beta][i] = P(initial -> beta) at x[i]
//   ghost     the same for vacuum, drawn at 30 % when matter is on
//   channel   0, 1 or 2: the flavour whose own probability is the focal line
//   marker    { x, text } an experiment's design point

import { figure, axis, line, band, rule } from "../spec.mjs";

const FLAVOURS = [
  { tex: "\\nu_e", name: "electron", color: "cat-2" },
  { tex: "\\nu_\\mu", name: "muon", color: "cat-1" },
  { tex: "\\nu_\\tau", name: "tau", color: "cat-3" },
];
const GHOST_OPACITY = 0.3;
const BAND_FILL = 0.16;

/** Upper edges of the stacked bands: P_e, P_e + P_mu, and the full sum (clamped to 1 against rounding). */
function stack(P) {
  return [
    P[0].slice(),
    P[0].map((p, i) => Math.min(1, p + P[1][i])),
    P[0].map((p, i) => Math.min(1, p + P[1][i] + P[2][i])),
  ];
}

export function flavourRibbonSpec({ curves, ghost = null, mode, channel = 0, initial, antineutrino = false, matter = false, marker = null, height = 300 }) {
  const { x, P } = curves;
  const upper = stack(P);
  const lower = [x.map(() => 0), upper[0], upper[1]];
  const ghostUpper = ghost ? stack(ghost.P) : null;
  const name = FLAVOURS[initial].name;
  const focus = FLAVOURS[channel];
  const kind = antineutrino ? "antineutrino" : "neutrino";
  const marks = [];
  FLAVOURS.forEach((f, b) => {
    marks.push(band({ x, y0: lower[b], y1: upper[b], layer: "model", color: f.color, fill: BAND_FILL, label: { tex: f.tex } }));
  });
  marks.push(line({ x, y: upper[0], layer: "model", color: FLAVOURS[0].color, width: 1 }));
  marks.push(line({ x, y: upper[1], layer: "model", color: FLAVOURS[1].color, width: 1 }));
  if (ghostUpper) {
    marks.push(line({ x, y: ghost.P[channel], layer: "model", color: "ink-dim", width: 1.4, opacity: GHOST_OPACITY, label: "vacuum" }));
    marks.push(line({ x, y: ghostUpper[0], layer: "model", color: "ink-dim", width: 1, opacity: GHOST_OPACITY }));
    marks.push(line({ x, y: ghostUpper[1], layer: "model", color: "ink-dim", width: 1, opacity: GHOST_OPACITY }));
  }
  marks.push(line({ x, y: P[channel], layer: "model", focal: true, color: focus.color, width: 2.6, label: { tex: `P(\\nu\\to ${focus.tex})` } }));
  if (marker) marks.push(rule({ axis: "x", value: marker.x, layer: "data", color: "pigment-amber-79-c12", text: { text: marker.text } }));
  const energy = mode === "energy";
  return figure({
    id: "sm-neutrino-flavour",
    title: `Flavour ribbon: ${kind} born as ${name}${matter ? ", in matter" : ", in vacuum"}`,
    status: matter ? "effective" : "established",
    provenanceId: matter ? "sm-neutrino-flavour-matter" : "sm-neutrino-flavour-vacuum",
    height,
    x: axis({
      scale: { type: "linear", domain: [x[0], x[x.length - 1]] },
      label: energy ? { tex: "E" } : { tex: "L/E" }, unit: energy ? "GeV" : "km/GeV",
    }),
    y: axis({ scale: { type: "linear", domain: [0, 1] }, label: { text: "probability" } }),
    marks,
    summary: `The three bands stack to one: the share of a ${name} ${kind} found as electron, muon or tau flavour. `
      + `The bold line is the probability of the ${focus.name} flavour on its own.`
      + (ghostUpper ? " Faint lines show the vacuum result." : ""),
  });
}
