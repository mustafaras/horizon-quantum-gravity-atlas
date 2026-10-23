// Engraved lines (S06): constant-pixel-width, anti-aliased, dashable lines. This replaces 1 px THREE.Line
// hairlines. Widths are CSS pixels and do not change with zoom or depth; the stage DPR is applied by the
// line material (node: screenDPR; classic: the viewport resolution is in CSS pixels).
//
//   engravedLine(points, opts)        polyline through `points`
//   engravedSegments(pairs, opts)     independent segments, consecutive point pairs
//   updateEngravedLine(line, points)  rewrite the points in place when the count is unchanged
//   setEngravedOpacity(line, value)   change opacity at run time
//
// Colours come from a token name (resolved through the Figure/Design token layer) or an already resolved
// THREE.Color / 0xRRGGBB number from a palette function; there is no colour literal in this module.
import { engravedBackend } from "./engraved-backend.mjs";
import * as designTokens from "../../design/tokens.mjs";

export const ENGRAVED_WIDTH_PX = Object.freeze({ hairline: 1, standard: 1.25, focal: 2.5 });
export const ENGRAVED_HALO_MAX = 0.12;
/** The line quad is this many CSS px wider than the line so the analytic edge coverage has room to fade out. */
export const ENGRAVED_PAD_PX = 1;
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
function baseColor(three, color) { return color === undefined ? new three.Color().setScalar(1) : resolveColor(three, color); }

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

/**
 * Engraved lines always blend: the analytic edge coverage is an alpha, and without blending that alpha is dropped.
 * They are transparent-sorted (drawn after the opaque meshes, still depth-tested) and never write depth.
 */
function applyBlending(backend, material, additive) {
  const { three } = backend;
  material.transparent = true;
  material.depthWrite = false;
  if (backend.kind === "node") {
    // The factors three's own NormalBlending (non-premultiplied) and the atlas's additive override use, so the
    // canvas alpha channel stays correct as well as the colour.
    material.blending = three.CustomBlending;
    material.blendEquation = three.AddEquation;
    material.blendEquationAlpha = three.AddEquation;
    material.blendSrc = three.SrcAlphaFactor;
    material.blendDst = additive ? three.OneFactor : three.OneMinusSrcAlphaFactor;
    material.blendSrcAlpha = additive ? three.SrcAlphaFactor : three.OneFactor;
    material.blendDstAlpha = additive ? three.OneFactor : three.OneMinusSrcAlphaFactor;
  } else material.blending = additive ? three.AdditiveBlending : three.NormalBlending;
}

function depthFadeNode(backend, [near, far]) {
  const { float, positionView, smoothstep } = backend.tsl;
  // 1 at view depth <= near, 0 at >= far.
  return float(1).sub(smoothstep(float(near), float(far), positionView.z.negate()));
}

/**
 * The classic LineMaterial gets the same analytic edge coverage as the node material, and the optional depth fade.
 * The uniforms are shared objects, so a later width or pixel-ratio change reaches the compiled program.
 */
function patchClassic(material, widthPx, fade) {
  const engravedWidth = { value: widthPx }, engravedDpr = { value: 1 };
  material.userData.engravedWidth = engravedWidth;
  material.userData.engravedDpr = engravedDpr;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.engravedWidth = engravedWidth;
    shader.uniforms.engravedDpr = engravedDpr;
    shader.uniforms.engravedFade = { value: fade ?? [0, 1] };
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", "varying float vEngravedDepth;\nvoid main() {")
      .replace("gl_Position = clip;", "vEngravedDepth = -( position.y < 0.5 ? start.z : end.z );\n\t\t\tgl_Position = clip;");
    const coverage = "alpha *= clamp( engravedWidth * 0.5 * engravedDpr - abs( vUv.x ) * linewidth * 0.5 * engravedDpr + 0.5, 0.0, 1.0 );\n";
    const fadeAlpha = fade ? "\t\t\talpha *= 1.0 - smoothstep( engravedFade.x, engravedFade.y, vEngravedDepth );\n" : "";
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "varying float vEngravedDepth;\nuniform vec2 engravedFade;\nuniform float engravedWidth;\nuniform float engravedDpr;\nvoid main() {")
      .replace("gl_FragColor = vec4( diffuseColor.rgb, alpha );", `${coverage}${fadeAlpha}\t\t\tgl_FragColor = vec4( diffuseColor.rgb, alpha );`);
  };
  material.customProgramCacheKey = () => `engraved-${fade ? fade.join("-") : "plain"}`;
}

/** Keep the classic dpr uniform equal to the renderer's pixel ratio (the line resolution is in CSS pixels). */
function trackPixelRatio(line) {
  const base = line.onBeforeRender;
  line.onBeforeRender = function onBeforeRender(renderer, ...rest) {
    const dpr = this.material.userData.engravedDpr;
    if (dpr) dpr.value = renderer.getPixelRatio();
    return base.call(this, renderer, ...rest);
  };
}

function makeMaterial(backend, options, widthPx) {
  const { three } = backend;
  const common = { linewidth: widthPx + ENGRAVED_PAD_PX, vertexColors: !!options.colors, dashed: !!options.dash };
  let material;
  if (backend.kind === "node") {
    material = new backend.NodeMaterial({ ...common, color: baseColor(three, options.color) });
    material.worldUnits = false;
    material.engravedWidth.value = widthPx;
    if (options.dash) { material.dashSize = options.dash.size; material.gapSize = options.dash.gap; }
    if (options.depthFade) material.opacityNode = depthFadeNode(backend, options.depthFade);
  } else {
    material = new backend.LineMaterial({ ...common, color: baseColor(three, options.color) });
    material.worldUnits = false;
    if (options.dash) { material.dashSize = options.dash.size; material.gapSize = options.dash.gap; }
    patchClassic(material, widthPx, options.depthFade);
  }
  material.opacity = options.opacity;
  applyBlending(backend, material, options.additive);
  return material;
}

function build(points, rawOptions, segments, backend) {
  const options = normalizeEngravedOptions(rawOptions);
  const positions = flattenPoints(points);
  const count = positions.length / 3;
  if (segments ? count < 2 || count % 2 : count < 2) fail(segments ? "segments need an even number (>= 2) of points" : "a line needs at least 2 points");
  const GeometryClass = segments ? backend.LineSegmentsGeometry : backend.LineGeometry;
  const ClassName = segments ? "LineSegments2" : "Line2";
  const make = (opts, widthPx, renderOrder) => {
    const geometry = new GeometryClass();
    const line = new backend[ClassName](geometry, makeMaterial(backend, opts, widthPx));
    geometry.setPositions(positions);
    if (opts.colors) geometry.setColors(Float32Array.from(opts.colors));
    if (opts.dash) line.computeLineDistances();
    line.renderOrder = renderOrder;
    if (backend.kind === "classic") trackPixelRatio(line);
    line.userData.engraved = { layer: opts.layer, segments, widthPx, backend, additive: opts.additive };
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

/**
 * A polyline of constant pixel width. `points` is Vector3[] or a flat xyz array (n >= 2). The backend is the one
 * chosen by the last prepareEngravedLines() unless `backend` is given (engravedFor binds it per scene).
 */
export function engravedLine(points, options = {}, backend = engravedBackend()) { return build(points, options, false, backend); }

/** Independent segments: consecutive point pairs (a0, b0, a1, b1, ...). */
export function engravedSegments(pairs, options = {}, backend = engravedBackend()) { return build(pairs, options, true, backend); }

/** The API bound to one backend, so a scene keeps its lines consistent while other scenes prepare theirs. */
export function engravedFor(backend) {
  if (!backend?.kind) fail("engravedFor needs the backend returned by prepareEngravedLines()");
  return Object.freeze({
    kind: backend.kind,
    line: (points, options) => engravedLine(points, options, backend),
    segments: (pairs, options) => engravedSegments(pairs, options, backend),
    stream: (capacity, options) => engravedStream(capacity, options, backend),
    grid: (size, divisions, options) => engravedGrid(size, divisions, options, backend),
    update: updateEngravedLine, setPoints: setEngravedPoints, setCount: setEngravedCount, expand: expandIndexedSegments,
    setOpacity: setEngravedOpacity, setColor: setEngravedColor, setWidth: setEngravedWidth,
    WIDTH_PX: ENGRAVED_WIDTH_PX,
  });
}

/**
 * Rewrite the points (and optionally the per-vertex colours, flat rgb per point) of an engraved line. With the
 * same point count the existing instance buffers are written in place (no allocation); with a different count
 * the geometry is rebuilt. Returns the line.
 */
export function updateEngravedLine(line, points, colors = null) {
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
      writeSegmentData(start.data, flat, segmentCount, info.segments);
      const colorStart = geometry.attributes.instanceColorStart;
      if (colors && colorStart) { writeSegmentData(colorStart.data, colors, segmentCount, info.segments); }
      if (target.frustumCulled) { geometry.computeBoundingBox(); geometry.computeBoundingSphere(); }
    } else {
      geometry.setPositions(flat);
      if (colors) geometry.setColors(Float32Array.from(colors));
    }
    if (target.material.dashed) target.computeLineDistances();
  }
  return line;
}

/** Fill an instanced (start, end) interleaved buffer from flat per-point data; segments are already in pairs. */
function writeSegmentData(buffer, flat, segmentCount, segments) {
  if (segments) buffer.array.set(flat.subarray(0, 6 * segmentCount));
  else for (let i = 0; i < segmentCount; i += 1) buffer.array.set(flat.subarray(3 * i, 3 * i + 6), 6 * i);
  buffer.needsUpdate = true;
}

/**
 * A square grid in the XZ plane, `size` wide with `divisions` cells, as engraved segments (the replacement for
 * THREE.GridHelper). `centerColor` colours the two centre lines when it differs from `color`.
 */
export function engravedGrid(size, divisions, options = {}, backend = engravedBackend()) {
  if (!(Number.isFinite(size) && size > 0) || !Number.isInteger(divisions) || divisions < 1) fail("a grid needs size > 0 and integer divisions >= 1");
  const { color, centerColor = color, ...rest } = options;
  const lines = divisions + 1, half = size / 2, step = size / divisions;
  const positions = new Float32Array(lines * 12);
  const tinted = centerColor !== color;
  const colors = tinted ? new Float32Array(lines * 12) : null;
  const base = resolveColor(backend.three, color), center = resolveColor(backend.three, centerColor);
  for (let i = 0; i < lines; i += 1) {
    const k = -half + i * step, at = i * 12;
    positions.set([-half, 0, k, half, 0, k, k, 0, -half, k, 0, half], at);
    if (colors) {
      const c = i * 2 === divisions ? center : base;
      for (let v = 0; v < 4; v += 1) colors.set([c.r, c.g, c.b], at + v * 3);
    }
  }
  const grid = build(positions, { ...rest, color: tinted ? undefined : color, colors }, true, backend);
  grid.frustumCulled = false;
  return grid;
}

/**
 * A polyline with a fixed capacity whose visible length changes every frame (orbit trails, travelling packets).
 * It starts empty; fill it with setEngravedPoints(). `vertexColors: true` reserves per-point colours.
 */
export function engravedStream(capacity, options = {}, backend = engravedBackend()) {
  if (!Number.isInteger(capacity) || capacity < 2) fail("a stream needs an integer capacity >= 2");
  const { dash, halo, vertexColors, colors: ignored, ...rest } = options;
  if (dash || halo) fail("streams are solid and have no halo");
  const line = build(new Float32Array(capacity * 3), { ...rest, colors: vertexColors ? new Float32Array(capacity * 3) : null }, false, backend);
  line.geometry.instanceCount = 0;
  line.frustumCulled = false;
  line.userData.engraved.capacity = capacity;
  return line;
}

/** Write points i and i + 1 of a flat xyz/rgb source as segment i of an instanced (start, end) buffer. */
function copyPair(target, source, i) {
  for (let k = 0; k < 6; k += 1) target[6 * i + k] = source[3 * i + k];
}

/**
 * Write the first `count` points (flat xyz) and optional per-point colours (flat rgb) into a stream or any line,
 * then show `count - 1` segments. No allocation. Counts above the capacity are clamped.
 */
export function setEngravedPoints(line, flat, count, colors = null) {
  const info = line?.userData?.engraved;
  if (!info) fail("setEngravedPoints needs a line made by engravedLine/engravedStream");
  const geometry = line.geometry;
  const capacity = geometry.attributes.instanceStart.data.count + 1;
  const n = Math.max(0, Math.min(count | 0, capacity));
  const segments = Math.max(0, n - 1);
  const start = geometry.attributes.instanceStart.data;
  const colorBuffer = colors ? geometry.attributes.instanceColorStart?.data : null;
  // Typed arrays (flat or colours) copy by view; plain arrays are indexed. Either way nothing is allocated.
  for (let i = 0; i < segments; i += 1) {
    copyPair(start.array, flat, i);
    if (colorBuffer) copyPair(colorBuffer.array, colors, i);
  }
  start.needsUpdate = true;
  if (colorBuffer) colorBuffer.needsUpdate = true;
  geometry.instanceCount = segments;
  return line;
}

/**
 * Show only the first `pointCount` points of a polyline (or the first `pointCount / 2` segments of a segment set):
 * the instanced replacement for BufferGeometry.setDrawRange(0, n). Allocation-free.
 */
export function setEngravedCount(line, pointCount) {
  const info = line?.userData?.engraved;
  if (!info) fail("setEngravedCount needs a line made by engravedLine/engravedSegments/engravedStream");
  const available = line.geometry.attributes.instanceStart.data.count;
  const wanted = info.segments ? Math.floor(pointCount / 2) : Math.max(0, Math.floor(pointCount) - 1);
  const count = Math.max(0, Math.min(wanted, available));
  line.geometry.instanceCount = count;
  if (info.halo) info.halo.geometry.instanceCount = count;
  return line;
}

/** Expand an indexed line list (BufferGeometry position + index) into consecutive pairs, optionally in place. */
export function expandIndexedSegments(positions, indices, into = null) {
  const out = into ?? new Float32Array(indices.length * 3);
  if (out.length !== indices.length * 3) fail("expandIndexedSegments: output length must be 3 * index count");
  for (let i = 0; i < indices.length; i += 1) {
    const at = 3 * indices[i];
    out[3 * i] = positions[at]; out[3 * i + 1] = positions[at + 1]; out[3 * i + 2] = positions[at + 2];
  }
  return out;
}

/** Change the line width (CSS px) at run time, e.g. to emphasise a selected curve. A halo keeps its 3x ratio. */
export function setEngravedWidth(line, widthPx) {
  if (!(Number.isFinite(widthPx) && widthPx > 0 && widthPx <= 16)) fail(`widthPx must be in (0, 16], got ${widthPx}`);
  const apply = (target, px) => {
    target.material.linewidth = px + ENGRAVED_PAD_PX;
    if (target.material.engravedWidth) target.material.engravedWidth.value = px;
    else if (target.material.userData.engravedWidth) target.material.userData.engravedWidth.value = px;
    target.userData.engraved.widthPx = px;
  };
  apply(line, widthPx);
  if (line.userData.engraved.halo) apply(line.userData.engraved.halo, widthPx * ENGRAVED_HALO_WIDTH_FACTOR);
  return line;
}

/** Change opacity at run time (halos keep their own opacity). */
export function setEngravedOpacity(line, opacity) {
  if (!(Number.isFinite(opacity) && opacity >= 0 && opacity <= 1)) fail(`opacity must be in [0, 1], got ${opacity}`);
  line.material.opacity = opacity;
  return line;
}

/** Re-resolve a line's colour (token name, THREE.Color or 0xRRGGBB), e.g. after a theme change. */
export function setEngravedColor(line, color) {
  const value = resolveColor(line.userData.engraved.backend.three, color);
  line.material.color.copy(value);
  return line;
}
