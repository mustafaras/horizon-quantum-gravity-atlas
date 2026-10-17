/**
 * 3-D renormalization-group flow field — pure compute contract for Prompt 07.
 *
 * The gauge-coupling direction reuses the SHARED beta functions from
 * js/physics.mjs (rgBeta / rgFixedPoints) — nothing is re-derived and nothing
 * is duplicated in shaders. The second axis is a documented marginally
 * relevant mass-like coupling r with beta function
 *
 *   β_r(g, r) = (2 − γ(g)) · r,   γ(g) = g² / (1 + g²)
 *
 * (a transparent teaching model for a mass anomalous dimension that grows
 * with coupling; stated in the provenance, not hidden in the scene).
 *
 * The third axis is t = ln μ — the SAME logarithmic scale the existing
 * numerics export (t increases toward the ultraviolet). Streamlines are
 * integrated with the shared RK4 stepper from js/science/integrators.mjs and
 * seeded deterministically, so fixed-seed screenshots are reproducible.
 */

import { rgBeta, rgFixedPoints, seededRng } from "../physics.mjs";
import { rk4Step } from "./integrators.mjs";
import { getVisualizationProvenance, registerVisualization } from "./provenance.mjs";

export const RG_FLOW_3D_VIEW_ID = "rg-flow-field-3d";

export const RG_FLOW_3D_DEFAULTS = Object.freeze({
  tMin: -2, tMax: 4,      // ln μ window (natural log, same units as exports)
  gSpan: 3.2, rSpan: 2.0, // seeding box in the coupling plane
  streamlines: 40,
  dt: 0.05,
  maxSteps: 260,
});

/** Perturbative-validity boundary: α = g²/4π = 1 ⇒ g = sqrt(4π). */
export const RG_VALIDITY_G = Math.sqrt(4 * Math.PI);

export const RG_FLOW_3D_PROVENANCE = Object.freeze({
  model: "Two-coupling RG flow: gauge coupling g running via the shared one-loop beta functions (js/physics.mjs) plus a documented mass-like coupling r with β_r = (2 − g²/(1+g²)) r; flow time t = ln μ",
  status: "effective",
  assumptions: [
    "The g-direction beta function is exactly the shared model selected in the RG module (qed/qcd/gaussian/linear/asymptotic-safety); no coefficients are re-derived here",
    "The r-direction anomalous dimension γ(g) = g²/(1+g²) is a transparent teaching model, not a computed anomalous dimension",
    "Flow lines are trajectories in theory space, not physical time evolution",
  ],
  validity: [
    "Streamlines terminate visibly at the perturbative-validity boundary g = sqrt(4π) (α = 1) or when the flow leaves the seeding box; no missing segment is reported as success",
    "One-loop (and toy) beta functions: quantitative only where the shared RG module labels them perturbative",
  ],
  numericalMethod:
    "Fixed-step RK4 (js/science/integrators.mjs) on (g, r) with t accumulated in ln μ; deterministic seeding: a regular grid in the (g, r) box with seeded jitter; "
    + "fixed points from the shared analytic rgFixedPoints plus the r = 0 axis; separatrices integrated from the linearized eigendirections at each fixed point",
  references: [
    "Prompt 07 spec: docs/superpowers/plans/2026-10-08-ultra-realistic-atlas-prompts.md",
    "Peskin & Schroeder §12.1–12.6 (beta functions, relevant/irrelevant directions)",
  ],
});

export function registerRgFlow3dProvenance() {
  if (!getVisualizationProvenance(RG_FLOW_3D_VIEW_ID)) {
    registerVisualization(RG_FLOW_3D_VIEW_ID, RG_FLOW_3D_PROVENANCE);
  }
  return RG_FLOW_3D_PROVENANCE;
}

/** Mass anomalous dimension model γ(g) (documented, see provenance). */
export function massAnomalousDimension(g) {
  const gg = Number(g) * Number(g);
  return gg / (1 + gg);
}

/** β_r for the mass-like coupling. */
export function rgBetaR(model, g, r, params = {}) {
  const rr = Number(r);
  if (!Number.isFinite(rr)) return NaN;
  return (2 - massAnomalousDimension(g)) * rr;
}

/** RHS for RK4: state = [g, r]; t is accumulated by the caller. */
export function rgFlow3dRhs(state, { model, params }) {
  const [g, r] = state;
  return [rgBeta(model, g, params), rgBetaR(model, g, r, params)];
}

/**
 * Fixed points of the 2-coupling system: every shared fixed point g* of the
 * selected model sits on the r = 0 axis. Classification uses the triangular
 * Jacobian: eigenvalues are β_g'(g*) and (2 − γ(g*)).
 */
export function rgFlow3dFixedPoints(model, params = {}) {
  return rgFixedPoints(model, params).map((fp) => {
    const gamma = massAnomalousDimension(fp.g);
    const lambdaR = 2 - gamma; // > 0 ⇒ r is relevant (grows toward IR)
    return {
      g: fp.g, r: 0,
      stabilityG: fp.stability,
      lambdaG: fp.derivative,
      lambdaR,
      rDirection: lambdaR > 0 ? "relevant" : "irrelevant",
      source: fp.source,
    };
  });
}

/**
 * Integrate one streamline. Returns { points, terminated } with points in
 * the shared log scale: { g, r, t } where t = ln μ − t0 accumulates signed
 * steps (direction +1 runs to the UV, −1 to the IR).
 */
export function integrateStreamline3d({
  g0 = 1, r0 = 0, t0 = 0, direction = 1,
  model = "qcd", params = {},
  dt = RG_FLOW_3D_DEFAULTS.dt, maxSteps = RG_FLOW_3D_DEFAULTS.maxSteps,
  gSpan = RG_FLOW_3D_DEFAULTS.gSpan, rSpan = RG_FLOW_3D_DEFAULTS.rSpan,
} = {}) {
  const dir = direction >= 0 ? 1 : -1;
  const h = Math.abs(Number(dt)) || RG_FLOW_3D_DEFAULTS.dt;
  const steps = Math.max(1, Math.min(2000, Math.trunc(Number(maxSteps)) || RG_FLOW_3D_DEFAULTS.maxSteps));
  // rk4Step requires h > 0: run the IR direction through the negated field.
  const rhs = dir === 1
    ? rgFlow3dRhs
    : (state, params) => rgFlow3dRhs(state, params).map((v) => -v);
  let state = [Number(g0), Number(r0)];
  let t = Number(t0) || 0;
  if (!Number.isFinite(state[0]) || !Number.isFinite(state[1])) {
    return { points: [], terminated: "invalid-seed" };
  }
  const points = [{ g: state[0], r: state[1], t }];
  for (let i = 0; i < steps; i++) {
    let next;
    try {
      next = rk4Step(rhs, state, h, { model, params });
    } catch {
      return { points, terminated: "integration-failed" };
    }
    if (!Number.isFinite(next[0]) || !Number.isFinite(next[1])) {
      return { points, terminated: "non-finite" };
    }
    t += dir * h;
    state = next;
    points.push({ g: state[0], r: state[1], t });
    if (Math.abs(state[0]) > RG_VALIDITY_G) return { points, terminated: "validity-boundary" };
    if (Math.abs(state[1]) > rSpan * 2) return { points, terminated: "out-of-box" };
    if (t > RG_FLOW_3D_DEFAULTS.tMax + 4 || t < RG_FLOW_3D_DEFAULTS.tMin - 4) {
      return { points, terminated: "t-window" };
    }
  }
  return { points, terminated: "step-limit" };
}

/**
 * Deterministic streamline seeding: a regular grid over the (g, r) box with
 * seeded jitter, split between UV-directed and IR-directed runs.
 */
export function seedStreamlines3d({
  model = "qcd", params = {}, seed = 42,
  count = RG_FLOW_3D_DEFAULTS.streamlines,
  gSpan = RG_FLOW_3D_DEFAULTS.gSpan, rSpan = RG_FLOW_3D_DEFAULTS.rSpan,
  t0 = 0,
} = {}) {
  const n = Math.max(4, Math.min(200, Math.trunc(Number(count)) || RG_FLOW_3D_DEFAULTS.streamlines));
  const rng = seededRng(seed);
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const out = [];
  let index = 0;
  for (let row = 0; row < rows && index < n; row++) {
    for (let col = 0; col < cols && index < n; col++, index++) {
      const g = -gSpan + (2 * gSpan * (col + 0.5)) / cols + (rng() - 0.5) * (gSpan / cols);
      const r = -rSpan + (2 * rSpan * (row + 0.5)) / rows + (rng() - 0.5) * (rSpan / rows);
      const direction = index % 2 === 0 ? 1 : -1;
      const run = integrateStreamline3d({ g0: g, r0: r, t0, direction, model, params, gSpan, rSpan });
      out.push({ seed: { g, r, t: t0, direction }, ...run });
    }
  }
  return out;
}

/**
 * Separatrices: for each fixed point, integrate along its unstable and
 * stable eigendirections (the system is triangular, so eigenvectors are
 * analytic: the g-axis direction and the r direction decouple at the FP).
 */
export function separatrixCurves3d({ model = "qcd", params = {}, epsilon = 1e-3 } = {}) {
  const eps = Math.max(1e-6, Number(epsilon) || 1e-3);
  const curves = [];
  for (const fp of rgFlow3dFixedPoints(model, params)) {
    const dirs = [];
    if (Number(fp.lambdaG) < 0) dirs.push({ name: "g-unstable-IR", dg: -eps, dr: 0, direction: -1 });
    if (Number(fp.lambdaG) > 0) dirs.push({ name: "g-unstable-UV", dg: eps, dr: 0, direction: 1 });
    // r is relevant (λ_r > 0): the r-axis is unstable toward the IR.
    if (Number(fp.lambdaR) > 0) {
      dirs.push({ name: "r-relevant-IR+", dg: 0, dr: eps, direction: -1 });
      dirs.push({ name: "r-relevant-IR−", dg: 0, dr: -eps, direction: -1 });
    }
    for (const d of dirs) {
      const run = integrateStreamline3d({
        g0: fp.g + d.dg, r0: fp.r + d.dr, t0: 0, direction: d.direction, model, params,
      });
      curves.push({ fixedPoint: { g: fp.g, r: 0 }, label: d.name, ...run });
    }
  }
  return curves;
}

/** Export metadata for the 3-D RG flow field. */
export function rgFlow3dExportMetadata(state, runtime = {}) {
  const params = {
    nf: Number(state?.rgNf ?? 1), a: Number(state?.rgA ?? 1),
    b: Number(state?.rgB ?? 1), gStar: Number(state?.rgGStar ?? 1),
  };
  return {
    rgFlowField3d: {
      view: RG_FLOW_3D_VIEW_ID,
      model: String(state?.rgModel || "qcd"),
      parameters: params,
      logScale: "t = ln mu (natural log, shared with the RG landscape numerics)",
      validityBoundaryG: RG_VALIDITY_G,
      fixedPoints: rgFlow3dFixedPoints(String(state?.rgModel || "qcd"), params),
      runtime: {
        kind: runtime.kind || null,
        streamlines: runtime.streamlines || null,
        terminated: runtime.terminated || null,
      },
      provenance: { status: RG_FLOW_3D_PROVENANCE.status },
    },
  };
}
