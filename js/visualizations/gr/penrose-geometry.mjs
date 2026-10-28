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

/**
 * Scene units per diagram unit for the TALLEST diagrams: large enough that a 1 px engraved line resolves a 45-degree
 * edge cleanly. The other panels are scaled up to the same drawn height (see `layout`), so this is the scale of the
 * panels whose T extent is `halfHeight` of the atlas.
 */
export const DIAGRAM_SCALE = 2.6;
/** Gap between the panels, in scene units. */
export const PANEL_GAP = 1.2;
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
 * The layout: three diagrams side by side, packed edge to edge with one gap between neighbours and the whole band
 * centred on x = 0.
 *
 * The panels do NOT share a scale. A conformal diagram's axes are one coordinate system, so its `R` extent and its `T`
 * extent are set by the physics and the three diagrams come out different shapes: Minkowski is square, Schwarzschild
 * two to one, the Reissner-Nordstrom block wider still. Drawing them all at one scale would make the atlas thirteen
 * times wider than it is tall, which no frame can show. Instead every panel is scaled so that all three are the SAME
 * DRAWN HEIGHT, the convention of a plate of diagrams: the scale is uniform within a panel (so a null ray is still
 * exactly 45 degrees on screen, which is the one thing a conformal diagram has to get right) and differs between
 * panels, whose relative size means nothing because they are conformal pictures of different manifolds.
 */
export function layout(panels = PANELS) {
  const tallest = Math.max(...panels.map(halfHeight));
  const drawnHalfHeight = tallest * DIAGRAM_SCALE;
  const placed0 = panels.map((panel) => {
    const scale = drawnHalfHeight / halfHeight(panel);
    return {
      panel, scale,
      // the width is whatever this panel's own R extent comes to at the scale that gives it the common height
      width: 2 * halfWidth(panel) * scale,
    };
  });
  const total = placed0.reduce((sum, p) => sum + p.width, 0) + PANEL_GAP * (panels.length - 1);
  let cursor = -total / 2;
  const placed = placed0.map(({ panel, scale, width }) => {
    const cx = cursor + width / 2;
    cursor += width + PANEL_GAP;
    return Object.freeze({
      ...panel,
      cx, scale, width, slot: width, halfWidth: halfWidth(panel), halfHeight: drawnHalfHeight,
    });
  });
  return Object.freeze({
    panels: Object.freeze(placed),
    halfWidth: total / 2,
    halfHeight: drawnHalfHeight,
    width: total,
  });
}

/** The scene position of a point of one panel's diagram: R to the right, T up the screen, at that panel's scale. */
export function toScene(panel, { T, R }) {
  const scale = panel.scale ?? DIAGRAM_SCALE;
  return [panel.cx + R * scale, 0, -T * scale];
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
  for (const panel of panels) if (Math.abs(x - panel.cx) <= panel.width / 2) return panel;
  return null;
}

/** The diagram point under a scene position of one panel, if any (the inverse of toScene). */
export function fromScene(panel, [x, , z]) {
  const scale = panel.scale ?? DIAGRAM_SCALE;
  return { T: -z / scale, R: (x - panel.cx) / scale };
}

/** Fractional position in a monotone worldline, sampled at a fraction of elapsed proper time. */
export function properTimeIndex(rows, progress) {
  if (rows.length < 2) return 0;
  const target = rows[0].tau + Math.max(0, Math.min(1, progress)) * (rows[rows.length - 1].tau - rows[0].tau);
  let lo = 0, hi = rows.length - 1;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (rows[mid].tau < target) lo = mid; else hi = mid;
  }
  const span = rows[hi].tau - rows[lo].tau;
  return lo + (span > 0 ? (target - rows[lo].tau) / span : 0);
}

/**
 * Room above and below the drawn band, in scene units, for the panels' titles and the schematic note. The framing
 * counts it as part of the picture, so a title is never cropped by the edge of the stage.
 */
export const LABEL_PAD = 0.75;
/** The gap between a panel's drawn bottom edge and its title, in scene units, as a fraction of LABEL_PAD. */
export const TITLE_DROP = 0.95;

/**
 * The width-to-height ratio of the drawn atlas. Three conformal diagrams side by side are three 2:1 panels, so the
 * atlas is a wide band, and the stage has to take its height from this ratio or it wastes most of the frame above and
 * below the band.
 */
export function atlasAspect(panels = PANELS) {
  const { width, halfHeight } = layout(panels);
  return width / (2 * halfHeight);
}

/**
 * The stage height that shows the atlas without wasting the frame: three conformal diagrams side by side are a wide
 * band, so a tall stage would leave most of itself empty. The height follows the drawn aspect of the atlas and is
 * clamped so it stays legible on a phone and does not become a letterbox on a desktop.
 */
export function stageHeight(width, { min = 250, max = 470 } = {}) {
  if (!(width > 0)) throw new RangeError(`stageHeight: width must be positive, received ${width}`);
  return Math.round(Math.min(max, Math.max(min, width / frameAspect())));
}

/** The aspect of the framed picture, which is the band plus the label room above and below it. */
export function frameAspect(panels = PANELS) {
  const { width, halfHeight } = layout(panels);
  return width / (2 * (halfHeight + LABEL_PAD));
}

/**
 * Where each panel lands across the stage, as fractions of its width, for a camera at `distance` with field of view
 * `fovDeg` in a frame of `aspect`: { band: [left, right], panels: [{ id, left, right }] }.
 *
 * The projection is the perspective one, but the atlas is a flat plane facing the camera, so a scene x maps linearly
 * across the frame and the fractions follow from the half width the frustum covers at that distance. This is what lets
 * an overlay element sit exactly over its diagram without measuring anything in the browser.
 */
export function screenFractions(fovDeg, aspect, distance, panels = PANELS) {
  const half = Math.tan((fovDeg * Math.PI) / 360) * distance;
  const halfWidth = half * Math.max(0.2, aspect);
  const fraction = (x) => 0.5 + x / (2 * halfWidth);
  const { panels: placed, halfWidth: bandHalf } = layout(panels);
  return Object.freeze({
    band: Object.freeze([fraction(-bandHalf), fraction(bandHalf)]),
    panels: Object.freeze(placed.map((panel) => Object.freeze({
      id: panel.id,
      left: fraction(panel.cx - panel.width / 2),
      right: fraction(panel.cx + panel.width / 2),
    }))),
  });
}

/** The camera distance that fits the whole atlas in a frame of `aspect` at field of view `fovDeg`. */
export function framing(fovDeg, aspect, { margin = 1.06 } = {}) {
  const half = Math.tan((fovDeg * Math.PI) / 360);
  const { halfWidth, halfHeight } = layout();
  const needHeight = ((halfHeight + LABEL_PAD) * margin) / half;
  const needWidth = (halfWidth * margin) / (half * Math.max(0.2, aspect));
  return Math.round(Math.max(needHeight, needWidth));
}
