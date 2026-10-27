// The Higgs lab's two Figure Kit figures (S13): the running quartic coupling lambda(mu) from m_t to M_Pl, and the (m_t, m_H)
// stability diagram. The curves come from js/science/higgs-running.mjs; this file only draws them.
//
//   couplingRunSpec     mu[] (GeV), lambda[] the central run, lower[] / upper[] the +-1 sigma envelope in m_t and alpha_s,
//                       instabilityGeV the zero crossing (or null), treeLambda = m_H^2 / 2 v^2 at m_t, mtGeV
//   stabilityDiagramSpec  boundaries { mH[], stable[], unstable[] } as stabilityBoundaries returns them (m_t in GeV),
//                       measured { mt, mH } each { value, uncertainty }, an optional probe { mt, mH } numbers, and the two axis domains

import { figure, axis, line, band, points, rule } from "../spec.mjs";

const RUN_COLOR = "pigment-amber-80";
const MARK_COLOR = "pigment-cyan-78";
const REGION_FILL = 0.14;
const BAND_FILL = 0.16;
const ELLIPSE_POINTS = 48;
const DIAGRAM_SAMPLES = 72;
const PAD = 0.08;
const REGIONS = [
  { key: "stable", text: "absolutely stable", color: "pigment-cyan-78" },
  { key: "metastable", text: "metastable", color: "pigment-amber-80" },
  { key: "unstable", text: "unstable", color: "signal-danger" },
];

export function couplingRunSpec({ mu, lambda, lower, upper, instabilityGeV, treeLambda, mtGeV, height = 300 }) {
  const lo = Math.min(...lower, 0), hi = Math.max(...upper, treeLambda);
  const pad = (hi - lo) * PAD;
  const marks = [
    band({ x: mu, y0: lower, y1: upper, layer: "model", color: RUN_COLOR, fill: BAND_FILL, label: { tex: "\\pm 1\\sigma\\ (m_t,\\alpha_s)" } }),
    rule({ axis: "y", value: 0, layer: "model", color: "ink-dim", dash: "2 4" }),
    line({ x: mu, y: lambda, layer: "model", focal: true, color: RUN_COLOR, width: 2.6, label: { tex: "\\lambda(\\mu)" } }),
    points({ x: [mtGeV], y: [treeLambda], layer: "data", color: MARK_COLOR, radius: 4.5, label: { tex: "m_H^2/2v^2" } }),
  ];
  if (instabilityGeV) marks.push(rule({ axis: "x", value: instabilityGeV, layer: "model", color: MARK_COLOR, text: { tex: "\\mu_{\\mathrm{inst}}" } }));
  return figure({
    id: "sm-higgs-running", title: "Higgs quartic coupling, two-loop running, no new physics", status: "effective",
    provenanceId: "sm-higgs-running", height,
    x: axis({ scale: { type: "log", domain: [mu[0], mu[mu.length - 1]] }, label: { tex: "\\mu" }, unit: "GeV" }),
    y: axis({ scale: { type: "linear", domain: [lo - pad, hi + pad] }, label: { tex: "\\lambda" } }),
    marks,
    summary: instabilityGeV
      ? `The quartic coupling falls from ${treeLambda.toFixed(3)} at the top-quark mass and crosses zero near ${instabilityGeV.toExponential(1)} GeV, then stays slightly negative up to the Planck mass.`
      : "The quartic coupling stays positive from the top-quark mass to the Planck mass.",
  });
}

/** mH at which the boundary curve (m_t increasing with m_H) passes `mt`, clamped to the domain. */
function boundaryMH(curveMt, curveMH, mt, [mHLow, mHHigh]) {
  if (mt <= curveMt[0]) return mHLow;
  const last = curveMt.length - 1;
  if (mt >= curveMt[last]) return mHHigh;
  let i = 0;
  while (curveMt[i + 1] < mt) i += 1;
  const f = (mt - curveMt[i]) / (curveMt[i + 1] - curveMt[i]);
  return Math.min(mHHigh, Math.max(mHLow, curveMH[i] + f * (curveMH[i + 1] - curveMH[i])));
}

function ellipse(center, sigmaX, sigmaY) {
  const x = [], y = [];
  for (let i = 0; i <= ELLIPSE_POINTS; i += 1) {
    const a = (2 * Math.PI * i) / ELLIPSE_POINTS;
    x.push(center.x + sigmaX * Math.cos(a));
    y.push(center.y + sigmaY * Math.sin(a));
  }
  return { x, y };
}

export function stabilityDiagramSpec({ boundaries, measured, probe = null, mtDomain, mHDomain, height = 320 }) {
  const [x0, x1] = mtDomain;
  const x = Array.from({ length: DIAGRAM_SAMPLES }, (_, i) => x0 + ((x1 - x0) * i) / (DIAGRAM_SAMPLES - 1));
  const stable = x.map((mt) => boundaryMH(boundaries.stable, boundaries.mH, mt, mHDomain));
  const unstable = x.map((mt) => boundaryMH(boundaries.unstable, boundaries.mH, mt, mHDomain));
  const bottom = x.map(() => mHDomain[0]), top = x.map(() => mHDomain[1]);
  const edges = { stable: [stable, top], metastable: [unstable, stable], unstable: [bottom, unstable] };
  const marks = REGIONS.map((r) => band({
    x, y0: edges[r.key][0], y1: edges[r.key][1], layer: "model", color: r.color, fill: REGION_FILL, label: { text: r.text },
  }));
  const ring = ellipse({ x: measured.mt.value, y: measured.mH.value }, measured.mt.uncertainty, measured.mH.uncertainty);
  marks.push(line({ x: ring.x, y: ring.y, layer: "data", color: "ink-strong", width: 1.4 }));
  marks.push(points({ x: [measured.mt.value], y: [measured.mH.value], layer: "data", focal: true, color: "ink-strong", radius: 4, label: { text: "measured" } }));
  if (probe) marks.push(points({ x: [probe.mt], y: [probe.mH], layer: "model", color: "accent", radius: 5, shape: "triangle-up", label: { text: "your input" } }));
  return figure({
    id: "sm-higgs-stability", title: "Vacuum stability against the top and Higgs masses", status: "effective",
    provenanceId: "sm-higgs-stability", height,
    x: axis({ scale: { type: "linear", domain: [x0, x1] }, label: { tex: "m_t" }, unit: "GeV" }),
    y: axis({ scale: { type: "linear", domain: [...mHDomain] }, label: { tex: "m_H" }, unit: "GeV" }),
    marks,
    summary: `Three regions of the (top mass, Higgs mass) plane from this lab's own running: absolutely stable, metastable and unstable. `
      + `The measured point, ${measured.mt.value} GeV and ${measured.mH.value} GeV with its one-sigma ellipse, lies in the metastable region.`,
  });
}
