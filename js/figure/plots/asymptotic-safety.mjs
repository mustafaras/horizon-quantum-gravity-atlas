// The couplings along a trajectory of the Einstein-Hilbert flow (S18): g(k) and lambda(k) against ln k, through the chosen start.

import { figure, axis, line, points, rule } from "../spec.mjs";
import { classifyTrajectory, integrateFlow, fixedPoints, SINGULAR_LAMBDA } from "../../science/asymptotic-safety.mjs";

const LINE_WIDTH = 1.5;
const FOCAL_WIDTH = 2.2; // drawn at 1.15 times this: the 2.5 px focal line
const Y_PAD = 0.06;
const MIN_Y_TOP = 0.55;

/**
 * The whole trajectory through (g0, lambda0): the infrared part from classifyTrajectory and the ultraviolet part toward the non-Gaussian fixed point,
 * joined at t = 0 = ln(k / k_0) and sorted by t. Returns { type, terminated, tTerm, points, end } with `end` the infrared end.
 */
export function trajectoryRun({ g0, lambda0 }) {
  const ir = classifyTrajectory({ g0, lambda0 });
  if (ir.type === "outside") return { ...ir, points: ir.points };
  const uv = integrateFlow({ g0, lambda0, direction: 1 });
  const joined = [...ir.points.slice(1).reverse(), ...uv.points];
  return { type: ir.type, terminated: ir.terminated, tTerm: ir.tTerm, end: ir.end, points: joined };
}

/** g(k) and lambda(k) of a run from trajectoryRun, with the non-Gaussian fixed point's values and, where a Type IIIa run stops, that point. */
export function trajectorySpec({ run, height = 320 }) {
  const ngfp = fixedPoints().find((p) => !p.gaussian);
  const t = run.points.map((p) => p.t), g = run.points.map((p) => p.g), lambda = run.points.map((p) => p.lambda);
  const breaksDown = run.type === "IIIa";
  const marks = [
    line({ x: t, y: g, layer: "model", color: "cat-1", width: FOCAL_WIDTH, focal: true, id: "g", label: { tex: "g(k)" } }),
    line({ x: t, y: lambda, layer: "model", color: "cat-2", width: LINE_WIDTH, id: "lambda", label: { tex: "\\lambda(k)" } }),
    rule({ axis: "y", value: ngfp.g, layer: "model", color: "cat-1", dash: "2 4", id: "gstar", text: { tex: "g_*" } }),
    rule({ axis: "y", value: ngfp.lambda, layer: "model", color: "cat-2", dash: "2 4", id: "lstar", text: { tex: "\\lambda_*" } }),
    rule({ axis: "x", value: 0, layer: "model", color: "ink-dim", dash: "3 3", id: "k0", text: { tex: "k_0" } }),
  ];
  if (breaksDown) {
    marks.push(rule({ axis: "y", value: SINGULAR_LAMBDA, layer: "model", color: "ink-dim", dash: "6 4", id: "singular", text: { tex: "\\lambda=\\tfrac12" } }));
    marks.push(points({ x: [run.end.t], y: [run.end.lambda], layer: "model", color: "ink-strong", radius: 4, id: "end", label: { text: "truncation breaks down" } }));
  }
  const lo = Math.min(0, ...lambda), hi = Math.max(MIN_Y_TOP, ...g);
  const pad = (hi - lo) * Y_PAD;
  return figure({
    id: "rg-gravity-flow-trajectory", title: "Newton coupling and cosmological constant along the trajectory", status: "conjectural", provenanceId: "rg-gravity-flow-trajectory", height,
    x: axis({ scale: { type: "linear", domain: [Math.min(...t), Math.max(...t)] }, label: { tex: "t=\\ln(k/k_0)" } }),
    y: axis({ scale: { type: "linear", domain: [lo - pad, hi + pad] }, label: { tex: "g,\\ \\lambda" } }),
    marks,
    summary: `The dimensionless Newton coupling g and cosmological constant lambda along the chosen trajectory against the logarithm of the scale. Toward the ultraviolet both run into the non-Gaussian fixed point, g equal to ${ngfp.g.toFixed(3)} and lambda to ${ngfp.lambda.toFixed(3)}; toward the infrared the trajectory is of Type ${run.type}.`,
  });
}
