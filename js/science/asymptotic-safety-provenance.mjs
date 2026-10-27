// Provenance of the two figures of the gravity flow lab (S18): the LIC silk of the (g, lambda) plane and the couplings along a trajectory.

import { getVisualizationProvenance, registerVisualization } from "./provenance.mjs";
import { REF } from "./references.mjs";

const SHARED_ASSUMPTIONS = [
  "A truncation: the Einstein-Hilbert truncation keeps two couplings, g and lambda, of an infinite tower. Whether the non-Gaussian fixed point survives in the full theory is the open question of asymptotic safety; the figure shows the truncated flow, a conjectural framework, not a result about nature",
  "The cutoff scheme and gauge matter for the numbers. The equations are Reuter and Saueressig, New J. Phys. 14 (2012) 055022, eq. (4.15)-(4.20) in d = 4 with the optimised cutoff: g* = 0.7073, lambda* = 0.1932, critical exponents 1.4753 +- 3.0432 i. Litim, PRL 92 (2004) 201301, eq. (4)-(5) (harmonic gauge) gives 1.667 +- 4.308 i for the same truncation: the position and the exponents are scheme dependent, the structure of the phase portrait and the product g* lambda* are not",
  "The plan quotes g* = 0.707, lambda* = 0.193 and theta = 1.475 +- 3.043 i as Litim's; they are the optimised-cutoff values of Reuter and Saueressig's equations, and Litim's own equations give different exponents (ledger D-105)",
  "Trajectories stop where the truncation breaks down: on the line lambda = 1/2 or on the boundary 1 - g B2 = 0 where the anomalous dimension of Newton's constant diverges (Litim's g_bound). The figure stops there and says so instead of drawing past it",
];

const BASE = {
  "rg-gravity-flow-silk": {
    model: "The flow of the dimensionless Newton coupling g and cosmological constant lambda in the Einstein-Hilbert truncation (d = 4, optimised cutoff) in the plane g in [-0.2, 1.2], lambda in [-0.4, 0.55]: a GPU line integral convolution of the normalised vector field (beta_g, beta_lambda), coloured by the sign of beta_g, with the fixed points, the separatrix, the singular line lambda = 1/2, the boundary 1 - g B2 = 0 and one chosen trajectory",
    status: "conjectural",
    assumptions: [...SHARED_ASSUMPTIONS,
      "The silk shows the direction of the flow and the sign of beta_g, not the sense of the flow along its lines; the texture is seeded white noise (TSL hash of the integer cell, seed 42) smoothed along the field, and carries no information beyond the direction. The ripple that slides along the lines runs only in full motion",
      "The plane reaches lambda = 0.55 so the singular line and the hatched region beyond it are in the picture; the field is evaluated below lambda = 0.499"],
    validity: ["g and lambda inside the plane; g < 0 has no gravitational reading", "The structure of the phase portrait, the Reuter-Weyer Types Ia, IIa and IIIa, holds for every cutoff tested; the numbers do not"],
    numericalMethod: "Per-fragment LIC in TSL (js/visualizations/rg/lic-field.mjs), Hann kernel of 24 steps each way at medium and 40 at ultra quality, over the node graph compiled from the Formula Core definitions as-beta-g and as-beta-lambda, which equal the science module to 1e-12 and the float32 evaluation in qa/specs/formula-gpu.spec.mjs; the CPU reference (lic-cpu.mjs) gives a variance along streamlines of 0.115 of that across them on a uniform rotation field; fixed points by Newton iteration from a grid of starts, the separatrix by RK4 from the Gaussian fixed point's eigendirection (js/science/asymptotic-safety.mjs)",
    references: [REF.REUTER_SAUERESSIG_2012, REF.LITIM_2004, REF.REUTER],
    layers: [{ name: "Direction and sign of the flow, fixed points, separatrix, singular line, boundary and trajectory", class: "model" }, { name: "Noise texture, grid underlay and hatch", class: "decoration" }],
    seed: "42: the hash of the noise cells; the picture is otherwise deterministic",
  },
  "rg-gravity-flow-trajectory": {
    model: "The couplings g(k) and lambda(k) of the Einstein-Hilbert flow along the trajectory through the chosen start, against t = ln(k / k_0): the infrared part until the trajectory leaves the truncation, the ultraviolet part into the non-Gaussian fixed point, with the fixed-point values as rules",
    status: "conjectural",
    assumptions: [...SHARED_ASSUMPTIONS, "t = ln(k / k_0) with k_0 the scale of the chosen start; the figure has no dimensionful scale, so it does not say where the Planck mass is"],
    validity: ["Inside the plane of the silk; a start with lambda >= 1/2 or g <= 0 is outside the truncation and has no trajectory"],
    numericalMethod: "RK4 in t = ln k with a step of 0.01, shrinking near the boundaries so a step never crosses them (js/science/asymptotic-safety.mjs integrateFlow); the type is read from the sign of lambda in the infrared and from where the run stops (classifyTrajectory)",
    references: [REF.REUTER_SAUERESSIG_2012, REF.LITIM_2004, REF.REUTER],
    layers: [{ name: "g(k) and lambda(k)", class: "model" }, { name: "Fixed-point rules, the singular line and the stopping point", class: "model" }],
    seed: "none: deterministic integration",
  },
  "rg-flow-field-3d-gravity": {
    model: "The same Einstein–Hilbert flow as the silk, in three dimensions: the horizontal axes are the dimensionless Newton coupling g and the cosmological constant lambda, the vertical axis is t = ln k; streamlines come from the same integrator (js/science/asymptotic-safety.mjs through js/science/rg-flow-3d.mjs), with the non-Gaussian and Gaussian fixed points and a plane at lambda = 1/2",
    status: "conjectural",
    assumptions: [...SHARED_ASSUMPTIONS,
      "The three-dimensional field has no second coupling of its own: the mass-like coupling r of the perturbative mode is replaced by lambda, not added to it, so the picture is the two-dimensional flow lifted onto the t axis",
      "The vertical extent is a fixed log window, not a physical scale, and the t axis carries no dimensionful unit"],
    validity: ["Inside the silk's (g, lambda) domain; a seed at or above lambda = 1/2 has no trajectory", "Streamlines stop where the truncation does: on lambda = 1/2 or on the boundary where the anomalous dimension of Newton's constant diverges"],
    numericalMethod: "RK4 in t = ln k through integrateFlow of js/science/asymptotic-safety.mjs (step 0.01, shrinking at the boundaries), seeded on a deterministic grid in the (g, lambda) plane with seeded jitter (seed 42); the fixed points by Newton iteration from a grid of starts, the separatrix from the Gaussian fixed point's eigendirection",
    references: [REF.REUTER_SAUERESSIG_2012, REF.LITIM_2004, REF.REUTER],
    layers: [{ name: "Streamlines, the fixed points and the separatrix", class: "model" }, { name: "The singular plane, the glow halos, the flow tracers and the backdrop", class: "decoration" }],
    seed: "42: the jitter of the streamline seeds",
  },
};

export const ASYMPTOTIC_SAFETY_PROVENANCE = Object.freeze(BASE);

/** Idempotent registration of the two gravity flow figures in the shared provenance registry. */
export function registerAsymptoticSafetyProvenance() {
  for (const [id, entry] of Object.entries(ASYMPTOTIC_SAFETY_PROVENANCE)) {
    if (!getVisualizationProvenance(id)) registerVisualization(id, entry);
  }
}
