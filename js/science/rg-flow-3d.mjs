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
import { REF } from "./references.mjs";
import {
  betaFunctions as gravityBeta, integrateFlow as gravityIntegrateFlow, fixedPoints as gravityFixedPoints,
  separatrix as gravitySeparatrix, etaPoleG, SINGULAR_LAMBDA, classifyTrajectory as classifyGravityTrajectory,
} from "./asymptotic-safety.mjs";

export const RG_FLOW_3D_VIEW_ID = "rg-flow-field-3d";
export const GRAVITY_FLOW_3D_VIEW_ID = "rg-flow-field-3d-gravity";

/** The model id the 3-D field uses for the Einstein–Hilbert flow of js/science/asymptotic-safety.mjs. */
export const GRAVITY_MODEL = "gravity";

/** What the gravity mode of the 3-D field says on the canvas: the status note at the top, the limit note at the wall. */
export const GRAVITY_FLOW_3D_NOTE = Object.freeze({
  status: "CONJECTURAL · Einstein–Hilbert truncation",
  limit: "the plane where the truncation is singular: lambda = 1/2",
});

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
    REF.PESKIN,
    REF.GROSS_WILCZEK,
  ],
  layers: [{ name: "Streamlines, fixed points and separatrices", class: "model" }, { name: "Flow tracers, tube shading and backdrop", class: "decoration" }],
  seed: "Fixed constant 42 for the jitter of the streamline seeds; no URL seed",
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

/** The seeding box of the gravity mode: the same (g, lambda) domain as the silk, below the singular line. */
export const GRAVITY_SPAN = Object.freeze({ g: Object.freeze([-0.2, 1.2]), lambda: Object.freeze([-0.4, 0.49]) });

/**
 * In the gravity mode the second axis is the cosmological constant, not a mass-like coupling: state = [g, lambda] and the field is the
 * Einstein–Hilbert flow of js/science/asymptotic-safety.mjs (the same beta functions as the silk and the trajectory figure).
 */
export function gravityFlow3dRhs(state) {
  return gravityBeta(Number(state[0]), Number(state[1]));
}

/** RHS for RK4: state = [g, r] for the one-coupling models, [g, lambda] for the gravity mode; t is accumulated by the caller. */
export function rgFlow3dRhs(state, { model, params } = {}) {
  if (model === GRAVITY_MODEL) return gravityFlow3dRhs(state);
  const [g, r] = state;
  return [rgBeta(model, g, params), rgBetaR(model, g, r, params)];
}

/** The gravity fixed points of the two-coupling Einstein–Hilbert flow, as { g, lambda, gaussian, matrix, exponents }. */
export function gravityFlow3dFixedPoints() {
  return gravityFixedPoints();
}

/** The non-Gaussian fixed point of the gravity flow, or null when Newton iteration found none. */
function gravityNgfp() {
  return gravityFixedPoints().find((p) => !p.gaussian) ?? null;
}

/** The gravity separatrix as { points, terminated }, thinned to a drawable length. */
export function gravitySeparatrixCurve() {
  return gravitySeparatrix();
}

/** Where a gravity streamline stopped: its infrared fate from classifyTrajectory, on the (g, lambda) plane. */
export function classifyGravityRun({ g0, lambda0 } = {}) {
  return classifyGravityTrajectory({ g0, lambda0 });
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
 * One streamline of the gravity mode: the Einstein–Hilbert flow of js/science/asymptotic-safety.mjs integrated from (g0, lambda0) in one
 * direction, cut at the t window of the 3-D scene. The integration (adaptive stepping at the singular line and the eta pole) is the
 * silk's own, so the 3-D field and the 2-D picture cannot disagree. Points are { g, r, t } with `r` the lambda slot.
 */
export function integrateGravityStreamline3d({
  g0, lambda0, t0 = 0, direction = 1,
  dt = RG_FLOW_3D_DEFAULTS.dt, maxSteps = 3000,
  tMin = RG_FLOW_3D_DEFAULTS.tMin, tMax = RG_FLOW_3D_DEFAULTS.tMax,
  box = GRAVITY_SPAN,
} = {}) {
  const seedLambda = Math.min(Number(lambda0), SINGULAR_LAMBDA - 1e-6);
  const run = gravityIntegrateFlow({ g0: Number(g0), lambda0: seedLambda, direction, h: Math.abs(Number(dt)) || RG_FLOW_3D_DEFAULTS.dt, maxSteps });
  const inside = (p) => p.g >= box.g[0] && p.g <= box.g[1] && p.lambda >= box.lambda[0] && p.lambda <= box.lambda[1];
  const points = [];
  let terminated = run.terminated === "eta-pole" ? "truncation-boundary" : run.terminated;
  for (const p of run.points) {
    if (p.t < tMin - 4 || p.t > tMax + 4) { terminated = "t-window"; break; }
    if (!Number.isFinite(p.g) || !Number.isFinite(p.lambda) || !inside(p)) { terminated = points.length > 1 ? "out-of-box" : "invalid-seed"; break; }
    points.push({ g: p.g, r: p.lambda, t: p.t + (Number(t0) || 0) });
  }
  if (!points.length) return { points: [{ g: Number(g0), r: seedLambda, t: Number(t0) || 0 }], terminated: "invalid-seed" };
  return { points, terminated };
}

/**
 * Integrate one streamline. Returns { points, terminated } with points in
 * the shared log scale: { g, r, t } where t = ln μ − t0 accumulates signed
 * steps (direction +1 runs to the UV, −1 to the IR). In the gravity mode the
 * second coordinate of a point is the cosmological constant lambda (the field
 * is two-dimensional, so `r` and `lambda` are the same slot).
 */
export function integrateStreamline3d({
  g0 = 1, r0 = 0, t0 = 0, direction = 1,
  model = "qcd", params = {},
  dt = RG_FLOW_3D_DEFAULTS.dt, maxSteps = RG_FLOW_3D_DEFAULTS.maxSteps,
  gSpan = RG_FLOW_3D_DEFAULTS.gSpan, rSpan = RG_FLOW_3D_DEFAULTS.rSpan,
} = {}) {
  if (model === GRAVITY_MODEL) return integrateGravityStreamline3d({ g0, lambda0: r0, t0, direction, dt, maxSteps });
  const dir = direction >= 0 ? 1 : -1;
  const h = Math.abs(Number(dt)) || RG_FLOW_3D_DEFAULTS.dt;
  const steps = Math.max(1, Math.min(2000, Math.trunc(Number(maxSteps)) || RG_FLOW_3D_DEFAULTS.maxSteps));
  // rk4Step requires h > 0: run the IR direction through the negated field.
  const rhs = dir === 1
    ? rgFlow3dRhs
    : (state, context) => rgFlow3dRhs(state, context).map((v) => -v);
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
  if (model === GRAVITY_MODEL) {
    // the gravity box is the silk's (g, lambda) domain, with the same seeded jitter; every seed runs both ways and the runs that leave the box stop there
    const [gLo, gHi] = GRAVITY_SPAN.g, [lamLo, lamHi] = GRAVITY_SPAN.lambda;
    for (let row = 0; row < rows && index < n; row++) {
      for (let col = 0; col < cols && index < n; col++, index++) {
        const g = gLo + ((gHi - gLo) * (col + 0.5)) / cols + (rng() - 0.5) * ((gHi - gLo) / cols);
        const lambda = lamLo + ((lamHi - lamLo) * (row + 0.5)) / rows + (rng() - 0.5) * ((lamHi - lamLo) / rows);
        const direction = index % 2 === 0 ? 1 : -1;
        out.push({ seed: { g, r: lambda, t: t0, direction }, ...integrateGravityStreamline({ g0: g, lambda0: lambda, t0, direction }) });
      }
    }
    return out;
  }
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

/** One gravity streamline in the (g, lambda) plane from the seed in one direction; points keep `r` as the lambda slot. */
function integrateGravityStreamline({ g0, lambda0, t0, direction }) {
  return integrateStreamline3d({ g0, r0: lambda0, t0, direction, model: GRAVITY_MODEL, box: insideGravityBox });
}

const insideGravityBox = (g, lambda) => g >= GRAVITY_SPAN.g[0] && g <= GRAVITY_SPAN.g[1]
  && lambda >= GRAVITY_SPAN.lambda[0] && lambda <= GRAVITY_SPAN.lambda[1];

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
