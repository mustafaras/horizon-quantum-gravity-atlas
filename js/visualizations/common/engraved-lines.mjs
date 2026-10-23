// Engraved lines (S06): constant-pixel-width, anti-aliased, dashable lines. This replaces 1 px THREE.Line
// hairlines. Widths are CSS pixels and do not change with zoom or depth; the stage DPR is applied by the
// line material (node: screenDPR; classic: the viewport resolution is in CSS pixels).
//
//   engravedLine(points, opts)        polyline through `points`
//   engravedSegments(pairs, opts)     independent segments, consecutive point pairs
//   updateEngravedLine(line, points)  rewrite the points in place when the count is unchanged
//   setEngravedOpacity(line, value)   change opacity at run time (switches blending on or off)
//
// Colours come from a token name (resolved through the Figure/Design token layer) or an already resolved
// THREE.Color / 0xRRGGBB number from a palette function; there is no colour literal in this module.
import { engravedBackend } from "./engraved-backend.mjs";
import * as designTokens from "../../design/tokens.mjs";

export const ENGRAVED_WIDTH_PX = Object.freeze({ hairline: 1, standard: 1.25, focal: 2.5 });
export const ENGRAVED_HALO_MAX = 0.12;
export const ENGRAVED_HALO_WIDTH_FACTOR = 3;
const LAYERS = new Set(["data", "model", "decoration"]);
const HALO_RENDER_ORDER = -1;

let tokens = designTokens;
/** Test seam: replace the token source (anything with `hex(name)`), or restore the design tokens with no argument. */
export function setEngravedTokens(source = designTokens) { tokens = source; }

function fail(message) { throw new RangeError(`engraved line: ${message}`); }

function resolveColor(three, color) {
  if (typeof color === "string") {
    const hex = tokens.hex(color);
    if (!Number.isInteger(hex)) fail(`unknown colour token "${color}"`);
    return new three.Color(hex);
  }
  if (color?.isColor) return color.clone();
  if (Number.isInteger(color)) return new three.Color(color);
  return fail("color must be a token name, a THREE.Color or a resolved 0xRRGGBB number");
}

/** Per-vertex colours multiply a white base; otherwise the base is the resolved token. */
function baseColor(three, color) { return color === undefined ? new three.Color(1, 1, 1) : resolveColor(three, color); }

/** Validate options once and return a frozen, fully defaulted copy. */
export function normalizeEngravedOptions(options = {}) {
  const { widthPx = ENGRAVED_WIDTH_PX.standard, color, opacity = 1, dash = null, halo = 0, depthFade = null,
    layer = "model", colors = null, additive = false } = options;
  if (!(Number.isFinite(widthPx) && widthPx > 0 && widthPx <= 16)) fail(`widthPx must be in (0, 16], got ${widthPx}`);
  if (!(Number.isFinite(opacity) && opacity >= 0 && opacity <= 1)) fail(`opacity must be in [0, 1], got ${opacity}`);
  if (!(Number.isFinite(halo) && halo >= 0 && halo <= ENGRAVED_HALO_MAX)) fail(`halo must be in [0, ${ENGRAVED_HALO_MAX}], got ${halo}`);
  if (!LAYERS.has(layer)) fail(`layer must be one of ${[...LAYERS].join(", ")}, got ${layer}`);
  if (dash !== null && !(Number.isFinite(dash?.size) && dash.size > 0 && Number.isFinite(dash?.gap) && dash.gap > 0)) {
    fail("dash must be null or { size > 0, gap > 0 } in scene units");
  }
  if (depthFade !== null) {
    const [near, far] = Array.isArray(depthFade) ? depthFade : [];
    if (!(Number.isFinite(near) && Number.isFinite(far) && far > near && near >= 0)) fail("depthFade must be [near, far] with 0 <= near < far");
  }
  if (color === undefined && colors === null) fail("color (a token name) or per-vertex colors is required");
  return Object.freeze({ widthPx, color, opacity, dash: dash && Object.freeze({ ...dash }), halo,
    depthFade: depthFade && Object.freeze([...depthFade]), layer, colors, additive: !!additive });
}

/** Flatten Vector3-like points or a flat array to a Float32Array of xyz triples. */
export function flattenPoints(points, into = null) {
  if (points instanceof Float32Array || (Array.isArray(points) && typeof points[0] === "number")) {
    if (points.length % 3) fail("flat point arrays must hold xyz triples");
    return into ? (into.set(points), into) : Float32Array.from(points);
  }
  const out = into ?? new Float32Array(points.length * 3);
  points.forEach((p, i) => { out[3 * i] = p.x; out[3 * i + 1] = p.y; out[3 * i + 2] = p.z; });
  return out;
}

function applyBlending(backend, material, opacity, additive) {
  const { three } = backend;
  const blended = opacity < 1 || additive;
  material.transparent = blended;
  material.depthWrite = !blended;
  if (blended) {
    if (backend.kind === "node") {
      material.blending = three.CustomBlending;
      material.blendEquation = three.AddEquation;
      material.blendSrc = three.SrcAlphaFactor;
      material.blendDst = additive ? three.OneFactor : three.OneMinusSrcAlphaFactor;
    } else material.blending = additive ? three.AdditiveBlending : three.NormalBlending;
  } else material.blending = backend.kind === "node" ? three.NoBlending : three.NormalBlending;
  material.needsUpdate = true;
}

function depthFadeNode(backend, [near, far]) {
  const { float, positionView, smoothstep } = backend.tsl;
  // 1 at view depth <= near, 0 at >= far.
  return float(1).sub(smoothstep(float(near), float(far), positionView.z.negate()));
}

function patchClassicDepthFade(material, [near, far]) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.engravedFade = { value: [near, far] };
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", "varying float vEngravedDepth;\nvoid main() {")
      .replace("gl_Position = clip;", "vEngravedDepth = -( position.y < 0.5 ? start.z : end.z );\n\t\t\tgl_Position = clip;");
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "varying float vEngravedDepth;\nuniform vec2 engravedFade;\nvoid main() {")
      .replace("gl_FragColor = vec4( diffuseColor.rgb, alpha );",
        "alpha *= 1.0 - smoothstep( engravedFade.x, engravedFade.y, vEngravedDepth );\n\t\t\tgl_FragColor = vec4( diffuseColor.rgb, alpha );");
  };
  material.customProgramCacheKey = () => `engraved-fade-${near}-${far}`;
}

function makeMaterial(backend, options, widthPx) {
  const { three } = backend;
  const common = { linewidth: widthPx, vertexColors: !!options.colors, dashed: !!options.dash };
  let material;
  if (backend.kind === "node") {
    material = new backend.NodeMaterial({ ...common, color: baseColor(three, options.color) });
    material.worldUnits = false;
    if (options.dash) { material.dashSize = options.dash.size; material.gapSize = options.dash.gap; }
    if (options.depthFade) material.opacityNode = depthFadeNode(backend, options.depthFade);
  } else {
    material = new backend.LineMaterial({ ...common, color: baseColor(three, options.color) });
    material.worldUnits = false;
    if (options.dash) { material.dashSize = options.dash.size; material.gapSize = options.dash.gap; }
    if (options.depthFade) patchClassicDepthFade(material, options.depthFade);
  }
  material.opacity = options.opacity;
  applyBlending(backend, material, options.opacity, options.additive);
  return material;
}

function build(points, rawOptions, segments) {
  const options = normalizeEngravedOptions(rawOptions);
  const backend = engravedBackend();
  const positions = flattenPoints(points);
  const count = positions.length / 3;
  if (segments ? count < 2 || count % 2 : count < 2) fail(segments ? "segments need an even number (>= 2) of points" : "a line needs at least 2 points");
  const GeometryClass = segments ? backend.LineSegmentsGeometry : backend.LineGeometry;
  const ClassName = segments ? "LineSegments2" : "Line2";
  const make = (opts, widthPx, renderOrder) => {
    const geometry = new GeometryClass();
    const line = new backend[ClassName](geometry, makeMaterial(backend, opts, widthPx));
    geometry.setPositions(positions);
    if (opts.colors) geometry.setColors(opts.colors);
    if (opts.dash) line.computeLineDistances();
    line.renderOrder = renderOrder;
    line.userData.engraved = { layer: opts.layer, segments, widthPx };
    return line;
  };
  const line = make(options, options.widthPx, 0);
  if (options.halo > 0) {
    const haloLine = make({ ...options, opacity: options.halo, dash: null, depthFade: options.depthFade }, options.widthPx * ENGRAVED_HALO_WIDTH_FACTOR, HALO_RENDER_ORDER);
    line.userData.engraved.halo = haloLine;
    line.add(haloLine);
  }
  return line;
}

/** A polyline of constant pixel width. `points` is Vector3[] or a flat xyz array (n >= 2). */
export function engravedLine(points, options = {}) { return build(points, options, false); }

/** Independent segments: consecutive point pairs (a0, b0, a1, b1, ...). */
export function engravedSegments(pairs, options = {}) { return build(pairs, options, true); }

/**
 * Rewrite the points of an engraved line. With the same point count the existing instance buffer is written
 * in place (no allocation); with a different count the geometry is rebuilt. Returns the line.
 */
export function updateEngravedLine(line, points) {
  const info = line?.userData?.engraved;
  if (!info) fail("updateEngravedLine needs a line made by engravedLine/engravedSegments");
  const flat = flattenPoints(points);
  const count = flat.length / 3;
  const targets = info.halo ? [line, info.halo] : [line];
  for (const target of targets) {
    const geometry = target.geometry;
    const start = geometry.attributes.instanceStart;
    const segmentCount = info.segments ? count / 2 : count - 1;
    if (start && start.data.count === segmentCount) {
      const array = start.data.array;
      if (info.segments) array.set(flat);
      else for (let i = 0; i < segmentCount; i += 1) { array.set(flat.subarray(3 * i, 3 * i + 6), 6 * i); }
      start.data.needsUpdate = true;
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    } else {
      geometry.setPositions(flat);
    }
    if (target.material.dashed) target.computeLineDistances();
  }
  return line;
}

/** Change opacity at run time. Blending is switched on below 1 and off at 1 (halos keep their own opacity). */
export function setEngravedOpacity(line, opacity) {
  if (!(Number.isFinite(opacity) && opacity >= 0 && opacity <= 1)) fail(`opacity must be in [0, 1], got ${opacity}`);
  const material = line.material;
  const wasBlended = material.transparent;
  material.opacity = opacity;
  if ((opacity < 1) !== wasBlended) applyBlending(engravedBackend(), material, opacity, false);
  return line;
}

/** Re-resolve a line's colour (token name, THREE.Color or 0xRRGGBB), e.g. after a theme change. */
export function setEngravedColor(line, color) {
  const backend = engravedBackend();
  const value = resolveColor(backend.three, color);
  line.material.color.copy(value);
  return line;
}
