// Engraved grid: anti-aliased analytic grid lines of constant pixel width (S07).
//
// A grid line is where a surface coordinate crosses an integer. Its coverage comes from the coordinate's own screen-space
// derivative (`fwidth`), so the line is `widthPx` wide at any distance, on any surface parameterisation (a plane's x/z,
// a mesh's uv, polar rings and spokes), with no wireframe geometry. It replaces wireframe meshes used as grids.

import { MeshBasicNodeMaterial, AdditiveBlending, NormalBlending } from "three/webgpu";
import {
  abs, cameraPosition, float, fract, fwidth, max, min, positionLocal, positionWorld, smoothstep, uv, vec3, vec4, length,
} from "three/tsl";
import * as TK from "../../design/tokens.mjs";

export const GRID_SPACES = Object.freeze(["local-xz", "local-xy", "uv"]);
export const GRID_WIDTH_PX = Object.freeze({ hairline: 1, standard: 1.25, major: 1.6 });

/**
 * Coverage in 0..1 of the lines at the integers of `coordNode`, `widthPx` wide on screen. The pixel distance to the
 * nearest line is |fract(c - 0.5) - 0.5| / fwidth(c); coverage falls linearly to zero at `widthPx` from the centre.
 */
export function lineCoverage(coordNode, widthPx) {
  if (!(widthPx > 0) || !Number.isFinite(widthPx)) throw new RangeError(`lineCoverage: widthPx must be a positive number, got ${widthPx}`);
  const c = coordNode;
  const distancePx = abs(fract(c.sub(0.5)).sub(0.5)).div(max(fwidth(c), 1e-5));
  return float(1).sub(min(distancePx.div(widthPx), 1));
}

/** Validated options with defaults. `space` selects the surface parameterisation of the default coordinates. */
export function normalizeGridOptions({ space = "local-xz", minor = 1, majorEvery = 4, widthPx = GRID_WIDTH_PX.hairline, majorWidthPx = GRID_WIDTH_PX.major, color = "ink-faint", opacity = 1, fade = null, additive = false } = {}) {
  if (!GRID_SPACES.includes(space)) throw new RangeError(`engravedGrid: space must be one of ${GRID_SPACES.join(", ")}, got ${space}`);
  if (!(minor > 0) || !Number.isFinite(minor)) throw new RangeError(`engravedGrid: minor spacing must be positive, got ${minor}`);
  if (!Number.isInteger(majorEvery) || majorEvery < 0) throw new RangeError(`engravedGrid: majorEvery must be a non-negative integer, got ${majorEvery}`);
  if (!(widthPx > 0 && widthPx <= 8) || !(majorWidthPx > 0 && majorWidthPx <= 8)) throw new RangeError("engravedGrid: line widths must be in (0, 8] px");
  if (!(opacity >= 0 && opacity <= 1)) throw new RangeError(`engravedGrid: opacity must be in [0, 1], got ${opacity}`);
  if (fade !== null && !(Number.isFinite(fade.near) && Number.isFinite(fade.far) && fade.near >= 0 && fade.far > fade.near)) {
    throw new RangeError("engravedGrid: fade needs 0 <= near < far");
  }
  return Object.freeze({ space, minor, majorEvery, widthPx, majorWidthPx, color, opacity, fade: fade && Object.freeze({ ...fade }), additive: !!additive });
}

/** Coverage node of minor lines plus, every `majorEvery`, wider major lines; `u` and `v` are the two surface coordinates. */
export function engravedGridCoverage(u, v, options) {
  const { minor, majorEvery, widthPx, majorWidthPx } = normalizeGridOptions(options);
  const minorU = u.div(minor), minorV = v.div(minor);
  let coverage = max(lineCoverage(minorU, widthPx), lineCoverage(minorV, widthPx));
  if (majorEvery > 0) {
    coverage = max(coverage, max(lineCoverage(minorU.div(majorEvery), majorWidthPx), lineCoverage(minorV.div(majorEvery), majorWidthPx)));
  }
  return coverage;
}

/** `{ coverage, opacityNode }`: the grid's coverage with the optional camera-distance fade and the constant opacity. */
export function engravedGridNodes(options = {}) {
  const normalized = normalizeGridOptions(options);
  const [u, v] = normalized.space === "uv" ? [uv().x, uv().y]
    : normalized.space === "local-xy" ? [positionLocal.x, positionLocal.y] : [positionLocal.x, positionLocal.z];
  let coverage = engravedGridCoverage(u, v, normalized);
  if (normalized.fade) {
    const distance = length(cameraPosition.sub(positionWorld));
    coverage = coverage.mul(float(1).sub(smoothstep(normalized.fade.near, normalized.fade.far, distance)));
  }
  return { coverage, opacityNode: coverage.mul(normalized.opacity), options: normalized };
}

/** A transparent node material drawing only the grid lines, in the token colour `color` (default `--ink-faint`). */
export function engravedGridMaterial(options = {}) {
  const { coverage, options: normalized } = engravedGridNodes(options);
  const material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false, fog: false });
  material.blending = normalized.additive ? AdditiveBlending : NormalBlending;
  const [r, g, b] = TK.linear(normalized.color);
  material.colorNode = vec4(vec3(r, g, b), coverage.mul(normalized.opacity));
  material.userData.qgaNodeKit = true;
  material.userData.kit = "engraved-grid";
  return material;
}

export function prewarmSignature() {
  return "engraved-grid:local-xz";
}

/** One mesh per canonical shader variant, for js/render/shader-prewarm.mjs. */
export function prewarmProbe(Mesh, geometry) {
  return new Mesh(geometry, engravedGridMaterial());
}
