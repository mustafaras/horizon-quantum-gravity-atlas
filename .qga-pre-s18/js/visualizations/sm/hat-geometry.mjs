// The numbers the Mexican-hat scene draws (S13), pure so that Node can check them against the potential.
//
// Scene axes: X = Re phi and Z = Im phi in units of HAT_UNIT per v, Y = HAT_HEIGHT * V / (lambda v^4). The vertical scale is one
// uniform factor applied to the formula, chosen so that the 0.25 deep valley reads clearly; it is not a physical scale.
// s = mu^2 / (lambda v^2): PHYSICAL_PHASE is the Higgs phase, SYMMETRIC_PHASE the symmetric one (mu^2 < 0 in V = -mu^2 |H|^2 + ...).
// The arrows write into an `out` the caller keeps, so the render loop allocates nothing while the surface eases.

import { reducedPotential } from "../../science/higgs.mjs";

export const HAT_UNIT = 2.6;
export const HAT_HEIGHT = 2.2;
export const HAT_RADIUS = 1.7 * HAT_UNIT;
export const PHYSICAL_PHASE = 1;
export const SYMMETRIC_PHASE = -1;
export const SHAFT_SAMPLES = 14;
export const HEAD_POINTS = 3;

const RADIAL_TIP = 1.45;
const GOLDSTONE_ARC = 0.55;
const BARB_BACK = 0.16 * HAT_UNIT;
const BARB_SIDE = 0.08 * HAT_UNIT;
const EASE_SECONDS = 0.22;
const SNAP_DISTANCE = 1e-3;

/** Height of the surface at radius r (scene units) for phase s. */
export const hatHeight = (r, s) => HAT_HEIGHT * reducedPotential(r / HAT_UNIT, s);

/** A reusable arrow buffer: shaft (SHAFT_SAMPLES points) and head (a three-point chevron, barb - tip - barb). */
export const makeArrow = () => ({ shaft: new Float64Array(3 * SHAFT_SAMPLES), head: new Float64Array(3 * HEAD_POINTS) });

/** The vacuum circle |phi| = v as a closed polyline, flat [x, y, z, ...] with segments + 1 points. */
export function ringPoints(s, segments = 128) {
  const y = hatHeight(HAT_UNIT, s);
  const out = new Float64Array(3 * (segments + 1));
  for (let i = 0; i <= segments; i += 1) {
    const a = (2 * Math.PI * i) / segments;
    out.set([HAT_UNIT * Math.cos(a), y, HAT_UNIT * Math.sin(a)], 3 * i);
  }
  return out;
}

/** Fill `head` with a chevron (barb, tip, barb) behind the last shaft point, for a shaft running along [dx, dz]; barb heights follow `height`. */
function fillHead(shaft, head, dx, dz, height) {
  const tip = 3 * (SHAFT_SAMPLES - 1);
  [-1, 1].forEach((side, k) => {
    const x = shaft[tip] - dx * BARB_BACK - dz * side * BARB_SIDE;
    const z = shaft[tip + 2] - dz * BARB_BACK + dx * side * BARB_SIDE;
    head.set([x, height(x, z), z], 6 * k);
  });
  head.set([shaft[tip], shaft[tip + 1], shaft[tip + 2]], 3);
}

/** The radial (Higgs) direction: from the vacuum circle outward along +X, on the surface. */
export function radialArrow(s, out = makeArrow()) {
  for (let i = 0; i < SHAFT_SAMPLES; i += 1) {
    const r = HAT_UNIT * (1 + ((RADIAL_TIP - 1) * i) / (SHAFT_SAMPLES - 1));
    out.shaft.set([r, hatHeight(r, s), 0], 3 * i);
  }
  fillHead(out.shaft, out.head, 1, 0, (x, z) => hatHeight(Math.hypot(x, z), s));
  return out;
}

/** The Goldstone direction: an arc of the vacuum circle from angle 0 in the +Z sense, at the constant height of the valley. */
export function goldstoneArrow(s, out = makeArrow()) {
  const y = hatHeight(HAT_UNIT, s);
  for (let i = 0; i < SHAFT_SAMPLES; i += 1) {
    const a = (GOLDSTONE_ARC * i) / (SHAFT_SAMPLES - 1);
    out.shaft.set([HAT_UNIT * Math.cos(a), y, HAT_UNIT * Math.sin(a)], 3 * i);
  }
  fillHead(out.shaft, out.head, -Math.sin(GOLDSTONE_ARC), Math.cos(GOLDSTONE_ARC), () => y); // the valley is flat
  return out;
}

/** The physical point: the field at its measured value |phi| = v, pinned there whatever the phase. */
export const vacuumMarker = (s) => Float64Array.of(HAT_UNIT, hatHeight(HAT_UNIT, s), 0);

/** Exponential approach of the phase to its target; reduced motion (motion <= 0) snaps. */
export function easePhase(s, target, dt, { motion = 1 } = {}) {
  if (motion <= 0) return target;
  const next = s + (target - s) * (1 - Math.exp(-dt / EASE_SECONDS));
  return Math.abs(target - next) < SNAP_DISTANCE ? target : next;
}
