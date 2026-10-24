// Renormalisation-group plots: the running coupling g(mu) and the beta function with its phase line.

import { figure, axis, line, points, rule, callout } from "../spec.mjs";

const STABILITY_COLOR = { "UV-attractive": "cat-3", "IR-attractive": "cat-2" };
const stabilityColor = (s) => STABILITY_COLOR[s] ?? "ink-dim";

/**
 * g(mu) against log10 mu.
 *   points       [{ t, g, boundary? }] with log10 mu = mu0 + t / ln10
 *   fixedPoints  [{ g, stability }]
 *   markerLog, markerG   the selected scale and the coupling there (markerG null outside the trajectory)
 */
export function scaleTrajectorySpec({ points: traj, fixedPoints, logMin, logMax, mu0, ln10, gLimit, yMax, markerLog, markerG, status, height = 350 }) {
  const x = traj.map((p) => mu0 + p.t / ln10);
  const g = traj.map((p) => p.g);
  const ended = traj.map((p, i) => ({ p, i })).filter(({ p }) => p.boundary);
  const marks = [
    line({ x, y: g, layer: "model", focal: true, color: "accent", width: 2.2, label: { tex: "g(\\mu)" } }),
    rule({ axis: "x", value: mu0, layer: "data", color: "ink-dim", text: { tex: "\\mu_0" } }),
  ];
  if (gLimit <= yMax) marks.push(rule({ axis: "y", value: gLimit, layer: "model", color: "pigment-amber-79-c12", dash: "6 4", text: { tex: "\\alpha=1\\ \\text{display boundary}" } }));
  for (const fp of fixedPoints) marks.push(rule({ axis: "y", value: fp.g, layer: "model", color: stabilityColor(fp.stability), dash: "2 4", text: { tex: `g_*=${fp.g.toFixed(3)}` } }));
  if (ended.length) {
    marks.push(points({ x: ended.map(({ i }) => x[i]), y: ended.map(({ i }) => g[i]), layer: "model", color: "pigment-red-65", radius: 5, label: "terminated" }));
  }
  if (Number.isFinite(markerG)) marks.push(points({ x: [markerLog], y: [markerG], layer: "model", color: "ink-strong", radius: 5, label: "selected scale" }));
  marks.push(rule({ axis: "x", value: markerLog, layer: "model", color: "accent", dash: null }));
  return figure({
    id: "rg-scale-trajectory", title: "Running coupling g(μ) against log10 μ", status, provenanceId: "rg-scale-trajectory", height,
    x: axis({ scale: { type: "linear", domain: [logMin, logMax] }, label: { tex: "\\log_{10}(\\mu/\\mathrm{GeV})" } }),
    y: axis({ scale: { type: "linear", domain: [0, yMax] }, label: { tex: "g" } }),
    marks,
    summary: "The coupling flows with the energy scale; fixed points are the horizontal dotted lines, the display boundary is alpha equal to one.",
  });
}

/** beta(g) against g (g vertical) with fixed points and phase-line arrows at beta = 0. */
export function betaFunctionSpec({ samples, fixedPoints, yMax, betaMax, currentPoint, status, height = 350 }) {
  const arrows = Array.from({ length: 8 }, (_, i) => ((i + 0.5) * yMax) / 8);
  const slope = (g) => {
    let best = samples[0];
    for (const s of samples) if (Math.abs(s.g - g) < Math.abs(best.g - g)) best = s;
    return best.beta;
  };
  const dirs = arrows.map((g) => { const b = slope(g); return b > 1e-8 ? "triangle-up" : b < -1e-8 ? "triangle-down" : "circle"; });
  const marks = [
    line({ x: samples.map((s) => s.beta), y: samples.map((s) => s.g), layer: "model", focal: true, color: "pigment-amber-80", width: 2.2, label: { tex: "\\beta(g)" } }),
    rule({ axis: "x", value: 0, layer: "model", color: "ink-dim", dash: null, text: { tex: "\\beta=0" } }),
    points({ x: arrows.map(() => 0), y: arrows, shape: dirs, radius: 4, layer: "model", color: "ink-dim", label: "flow toward the UV" }),
  ];
  for (const fp of fixedPoints) {
    marks.push(points({ x: [0], y: [fp.g], layer: "model", color: stabilityColor(fp.stability), radius: 6 }));
    marks.push(callout({ x: 0, y: fp.g, layer: "model", color: stabilityColor(fp.stability), dx: 14, dy: -14, text: { tex: `g_*=${fp.g.toFixed(3)},\\ \\beta'=${fp.derivative.toFixed(3)}` } }));
  }
  if (currentPoint) {
    marks.push(line({ x: [0, currentPoint.beta], y: [currentPoint.g, currentPoint.g], layer: "model", color: "accent", width: 1.2 }));
    marks.push(points({ x: [currentPoint.beta], y: [currentPoint.g], layer: "model", color: "accent", radius: 4, label: "current scale" }));
  }
  return figure({
    id: "rg-beta-function", title: "β(g) and fixed points", status, provenanceId: "rg-beta-function", height,
    x: axis({ scale: { type: "linear", domain: [-betaMax, betaMax] }, label: { tex: "\\beta(g)" } }),
    y: axis({ scale: { type: "linear", domain: [0, yMax] }, label: { tex: "g" } }),
    marks,
    summary: "Phase line of the selected beta function: triangles show which way g flows toward the ultraviolet; roots of beta are the fixed points.",
  });
}
