/**
 * Geometry of the Penrose atlas (S19), free of three.js so Node tests it: how a diagram's (R, T) coordinates become the
 * scene's plane, which panels sit where, and the polylines the scene draws for the zig-zag singularity, the light-cone
 * glyphs and the region outlines.
 *
 * The diagram is a flat map: R runs to the right (+x) and T up the screen (-z), so the causal structure is read exactly
 * as it is on paper, at 45 degrees, and the three diagrams stand side by side along x. Every number here is either a
 * diagram coordinate or a panel offset; no physical quantity is invented, and the map itself is the one in
 * js/science/conformal.mjs.
 */

import { RN_SCHEMATIC, SCHWARZSCHILD_EXTENT, MINKOWSKI_EXTENT } from "../../science/conformal.mjs";

/** Scene units per diagram unit: large enough that a 1 px engraved line resolves a 45-degree edge cleanly. */
export const DIAGRAM_SCALE = 2.6;
/** Gap between the panels, in scene units. */
export const PANEL_GAP = 1.9;
/** How deep the zig-zag of a drawn singularity swings, in diagram units. */
const ZIGZAG_AMPLITUDE = 0.055;
/** The zig-zag's period, in diagram units along the singularity. */
const ZIGZAG_PERIOD = 0.13;

/**
 * The three panels, left to right. `cx` is the centre of each panel's own diagram frame; the widths follow from the
 * extents the science module publishes, so a panel is as wide as its diagram and no wider.
 */
export const PANELS = Object.freeze([
  Object.freeze({ id: "minkowski", title: "Minkowski", extent: MINKOWSKI_EXTENT }),
  Object.freeze({ id: "schwarzschild", title: "Schwarzschild", extent: SCHWARZSCHILD_EXTENT }),
  Object.freeze({ id: "reissner-nordstrom", title: "Reissner–Nordström", extent: RN_SCHEMATIC.extent }),
]);

const halfWidth = (panel) => panel.extent.R;
const halfHeight = (panel) => panel.extent.T;

/**
 * The layout. Each panel gets an equally wide slot, so the atlas is symmetric about x = 0 and the middle diagram sits
 * at the origin; a panel narrower than its slot is centred in it, which keeps the widest diagram from crowding its
 * neighbours and keeps the whole picture balanced. Widths follow from the extents the science module publishes.
 */
export function layout(panels = PANELS) {
  const widths = panels.map((panel) => 2 * halfWidth(panel) * DIAGRAM_SCALE);
  const slot = Math.max(...widths);
  const total = slot * panels.length + PANEL_GAP * (panels.length - 1);
  const placed = panels.map((panel, i) => Object.freeze({
    ...panel,
    cx: -total / 2 + slot / 2 + i * (slot + PANEL_GAP),
    width: widths[i], slot, halfWidth: halfWidth(panel), halfHeight: halfHeight(panel),
  }));
  return Object.freeze({
    panels: Object.freeze(placed),
    halfWidth: total / 2,
    halfHeight: Math.max(...panels.map(halfHeight)),
    width: total, slot,
  });
}

/** The scene position of a point of one panel's diagram: R to the right, T up the screen. */
export function toScene(panel, { T, R }) {
  return [panel.cx + R * DIAGRAM_SCALE, 0, -T * DIAGRAM_SCALE];
}

/** A flat xyz polyline of a diagram polyline inside one panel. */
export function polyline(panel, points) {
  const out = new Float32Array(points.length * 3);
  points.forEach((p, i) => {
    const [x, y, z] = toScene(panel, p);
    out[3 * i] = x; out[3 * i + 1] = y; out[3 * i + 2] = z;
  });
  return out;
}

/**
 * The zig-zag of a drawn singularity: a polyline that swings across the surface so it reads as a singularity rather
 * than as another grid line. It is generated, never a texture, and it stays within `amplitude` of the surface so it
 * does not stray into a neighbouring region.
 *
 * `axis: "T"` is a spacelike singularity (a horizontal line at fixed T, as in Schwarzschild): the zig-zag moves in R.
 * `axis: "R"` is a timelike one (a vertical line at fixed R, as in Reissner-Nordstrom): the zig-zag moves in T.
 */
export function zigzag({ axis = "T", fixed, from, to, amplitude = ZIGZAG_AMPLITUDE, period = ZIGZAG_PERIOD } = {}) {
  if (axis !== "T" && axis !== "R") throw new RangeError(`zigzag: axis must be "T" or "R", received ${axis}`);
  if (!(to > from)) throw new RangeError(`zigzag: to must exceed from, received ${from} -> ${to}`);
  if (!(amplitude > 0) || !(period > 0)) throw new RangeError("zigzag: amplitude and period must be positive");
  const steps = Math.max(8, Math.round((to - from) / (period / 4)));
  const out = [];
  for (let i = 0; i <= steps; i += 1) {
    const s = from + ((to - from) * i) / steps;
    // a triangle wave in [-1, 1] of the given period, so the turns are sharp corners rather than a smooth wiggle
    const phase = ((s - from) / period) % 1;
    const triangle = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
    const offset = amplitude * triangle;
    out.push(axis === "T" ? Object.freeze({ T: fixed, R: s + offset }) : Object.freeze({ T: s + offset, R: fixed }));
  }
  return Object.freeze(out);
}

/**
 * The two engraved segments of a light-cone glyph at a point of a diagram, in diagram units: the null directions are
 * exactly +-45 degrees, so the glyph is the cross of the two diagonals and nothing else. `size` is its arm length.
 */
export function lightCone({ T, R }, size = 0.13) {
  if (!(size > 0)) throw new RangeError(`lightCone: size must be positive, received ${size}`);
  return Object.freeze([
    Object.freeze({ T: T - size, R: R - size }), Object.freeze({ T: T + size, R: R + size }),
    Object.freeze({ T: T + size, R: R - size }), Object.freeze({ T: T - size, R: R + size }),
  ]);
}

/** A light-cone glyph as two independent segments (four points, consecutive pairs), ready for engraved.segments. */
export function lightConeSegments(panel, points, size = 0.13) {
  const [a, b, c, d] = lightCone(points, size);
  const out = new Float32Array(12);
  [a, b, c, d].forEach((p, i) => {
    const [x, y, z] = toScene(panel, p);
    out[3 * i] = x; out[3 * i + 1] = y; out[3 * i + 2] = z;
  });
  return out;
}

/** A closed outline of a list of diagram points, as a flat xyz loop (the first point repeated). */
export function closedLoop(panel, points) {
  const loop = [...points, points[0]];
  return polyline(panel, loop);
}

/**
 * Which panel a scene-space x falls in, for hover and keyboard navigation: the nearest panel centre within its own
 * half width, or null in a gap. This is what lets a pointer over a region say which diagram it is over.
 */
export function panelAtX(x, panels) {
  for (const panel of panels) if (Math.abs(x - panel.cx) <= panel.slot / 2) return panel;
  return null;
}

/** The diagram point under a scene position of one panel, if any (the inverse of toScene). */
export function fromScene(panel, [x, , z]) {
  return { T: -z / DIAGRAM_SCALE, R: (x - panel.cx) / DIAGRAM_SCALE };
}

/** The camera distance that fits the whole atlas in a frame of `aspect` at field of view `fovDeg`. */
export function framing(fovDeg, aspect, { margin = 1.12 } = {}) {
  const half = Math.tan((fovDeg * Math.PI) / 360);
  const { halfWidth, halfHeight } = layout();
  const needHeight = (halfHeight * margin) / half;
  const needWidth = (halfWidth * margin) / (half * Math.max(0.2, aspect));
  return Math.round(Math.max(needHeight, needWidth));
}
