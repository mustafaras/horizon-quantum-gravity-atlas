/**
 * How many integrator steps the lattice lab runs per frame (S14). Pure, imports in Node.
 *
 * The simulated time of one frame is FIXED (`frameTime`): physics never depends on the frame rate. What the quality governor's budget
 * changes is how finely that time is cut: the fewest steps use the largest stable step `dtMax`, the most use half of it. A smaller step
 * is more accurate (the energy oscillation falls with dt^2, js/science/lattice-field.mjs), a larger one is cheaper.
 */

/** The lab's lattice and clock. a is in the lab's length unit; the step cap is 0.5 a (the CFL bound of the integrator, see lattice-field.mjs). */
export const LATTICE_VIEW = Object.freeze({
  spacing: 0.25,
  baseDt: 0.1,
  frameTime: 0.4,
  detailSizes: Object.freeze({ low: 128, medium: 256, ultra: 256 }), // the atlas's 3D detail settings; a CPU rasterizer is clamped to low
  mass2Range: Object.freeze([-1, 2]),
  lambdaRange: Object.freeze([0, 4]),
  defaults: Object.freeze({ mass2: 1, lambda: 0.5 }),
});

const FINEST_DIVISOR = 2; // the finest step is dtMax / 2

/** { steps, dt } with steps * dt === frameTime exactly; `budget` in [0, 1] is the governor's headroom (1 = full). */
export function stepPlan({ frameTime, dtMax, budget }) {
  if (!(frameTime > 0) || !(dtMax > 0)) throw new RangeError(`stepPlan: frameTime and dtMax must be positive, received ${frameTime}, ${dtMax}`);
  if (!(budget >= 0 && budget <= 1)) throw new RangeError(`stepPlan: budget must be in [0, 1], received ${budget}`);
  const fewest = Math.ceil(frameTime / dtMax - 1e-9), most = fewest * FINEST_DIVISOR;
  const steps = Math.round(fewest + (most - fewest) * budget);
  return Object.freeze({ steps, dt: frameTime / steps });
}

/**
 * The budget from a governor quality: raySteps runs from `floorSteps` (slow frames) to its ceiling (headroom). The lab has no rays; the
 * governed raySteps is the one per-frame cost dimension that applyRenderQuality is given, so it carries the substep budget (D-076).
 */
export function budgetFromQuality(quality, ceiling) {
  if (!quality || !Number.isFinite(quality.raySteps) || !(ceiling >= 1)) return 1;
  const floorSteps = Math.min(48, ceiling);
  if (ceiling <= floorSteps) return 1;
  return Math.min(1, Math.max(0, (quality.raySteps - floorSteps) / (ceiling - floorSteps)));
}
