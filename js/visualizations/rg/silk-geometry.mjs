/**
 * Geometry of the gravity flow silk (S18), free of three.js so Node tests it: the map between the couplings (g, lambda) and the plane of the scene, and
 * the polylines laid over the silk (fixed-point rings, the separatrix, the singular line lambda = 1/2, the boundary 1 - g B2 = 0, a trajectory).
 *
 * The plane lies in x-z, seen from above: g runs to the right (+x) and lambda up the screen (-z). Its lambda range reaches 0.55, past the singular line
 * at 1/2, so the line and the hatched region beyond it are inside the picture (ledger D-106); the plan's range stopped at 0.49.
 */

import { fixedPoints, separatrix, etaPoleG, SINGULAR_LAMBDA } from "../../science/asymptotic-safety.mjs";

const SCALE = 6; // scene units per unit of coupling
const DOMAIN = Object.freeze({ g: Object.freeze([-0.2, 1.2]), lambda: Object.freeze([-0.4, 0.55]) });
const CENTRE = Object.freeze({ g: (DOMAIN.g[0] + DOMAIN.g[1]) / 2, lambda: (DOMAIN.lambda[0] + DOMAIN.lambda[1]) / 2 });

export const SILK = Object.freeze({
  scale: SCALE, domain: DOMAIN, centre: CENTRE,
  width: (DOMAIN.g[1] - DOMAIN.g[0]) * SCALE, depth: (DOMAIN.lambda[1] - DOMAIN.lambda[0]) * SCALE,
});

export const TRAJECTORY_CAPACITY = 2048;
const RING_RADIUS = 0.14;
const RING_SEGMENTS = 48;
const RING_LIFT = 0.03;
const LINE_LIFT = 0.02;
const SEPARATRIX_POINTS = 500;
const ETA_POLE_STEP = 0.005;

/** [x, y, z] of (g, lambda) on the plane. */
export const toScene = (g, lambda) => [(g - CENTRE.g) * SCALE, 0, -(lambda - CENTRE.lambda) * SCALE];

/** The couplings at a point of the plane. */
export const fromScene = (x, z) => ({ g: x / SCALE + CENTRE.g, lambda: CENTRE.lambda - z / SCALE });

const inside = (g, lambda) => g >= DOMAIN.g[0] && g <= DOMAIN.g[1] && lambda >= DOMAIN.lambda[0] && lambda <= DOMAIN.lambda[1];

/** A closed circle of `radius` scene units around a fixed point, as a flat xyz array. */
export function ringPoints(g, lambda, radius = RING_RADIUS, segments = RING_SEGMENTS) {
  const [cx, , cz] = toScene(g, lambda);
  const out = new Float32Array((segments + 1) * 3);
  for (let k = 0; k <= segments; k++) {
    const a = (2 * Math.PI * k) / segments;
    out[3 * k] = cx + radius * Math.cos(a); out[3 * k + 1] = RING_LIFT; out[3 * k + 2] = cz + radius * Math.sin(a);
  }
  return out;
}

/** A polyline of { g, lambda } thinned evenly to at most `limit` points (first and last kept), as a flat xyz array. */
export function curvePoints(points, limit) {
  const usable = points.filter((p) => Number.isFinite(p.g) && Number.isFinite(p.lambda));
  const stride = Math.max(1, Math.ceil((usable.length - 1) / (limit - 2)));
  const picked = usable.filter((_, k) => k % stride === 0);
  if (usable.length && picked[picked.length - 1] !== usable[usable.length - 1]) picked.push(usable[usable.length - 1]);
  const out = new Float32Array(picked.length * 3);
  picked.forEach((p, k) => { const [x, , z] = toScene(p.g, p.lambda); out[3 * k] = x; out[3 * k + 1] = LINE_LIFT; out[3 * k + 2] = z; });
  return out;
}

/** The fixed points with a ring each: [{ g, lambda, gaussian, exponents, points }]. */
export function fixedPointRings() {
  return fixedPoints().map((p) => ({ ...p, points: ringPoints(p.g, p.lambda) }));
}

export const separatrixPoints = () => curvePoints(separatrix().points, SEPARATRIX_POINTS);

/** The line lambda = 1/2 across the plane. */
export function singularLinePoints() {
  const [x0, , z] = toScene(DOMAIN.g[0], SINGULAR_LAMBDA), [x1] = toScene(DOMAIN.g[1], SINGULAR_LAMBDA);
  return Float32Array.from([x0, LINE_LIFT, z, x1, LINE_LIFT, z]);
}

/** The boundary g = 1 / B2(lambda) where eta_N diverges, over the part of it that lies inside the plane. */
export function etaPoleCurve() {
  const points = [];
  for (let lambda = -0.1; lambda < SINGULAR_LAMBDA; lambda += ETA_POLE_STEP) {
    const g = etaPoleG(lambda);
    if (Number.isFinite(g) && inside(g, lambda)) points.push({ g, lambda });
  }
  return curvePoints(points, 400);
}

/**
 * Write a trajectory into a flat xyz buffer of fixed capacity, no allocation: points outside the plane are dropped and a long run is thinned to fit.
 * Returns the number of points written (for ctx.engraved.setPoints).
 */
export function writeTrajectory(points, buffer) {
  const capacity = Math.floor(buffer.length / 3);
  const stride = Math.max(1, Math.ceil(points.length / capacity));
  let count = 0;
  for (let k = 0; k < points.length && count < capacity; k += stride) {
    const p = points[k];
    if (!inside(p.g, p.lambda)) continue;
    const [x, , z] = toScene(p.g, p.lambda);
    buffer[3 * count] = x; buffer[3 * count + 1] = LINE_LIFT; buffer[3 * count + 2] = z;
    count++;
  }
  return count;
}
