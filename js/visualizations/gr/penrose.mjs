/**
 * The Penrose atlas (S19): three conformal diagrams side by side on the shared stage, engraved rather than filled.
 *
 * Left to right: Minkowski, the maximally extended Schwarzschild solution and one schematic block of Reissner-Nordstrom.
 * Every curve comes from js/science/conformal.mjs through js/visualizations/gr/penrose-geometry.mjs; nothing here is
 * drawn by hand or fitted. The lines are engraved, at constant pixel width:
 *
 *   coordinate lines   t = const and r = const, 1 px, --ink-faint
 *   horizons, r = 0    1.5 px, in the status colour of the diagram (established for the maps, schematic for RN)
 *   a singularity      a generated zig-zag polyline, so it reads as a surface rather than as another grid line
 *   one worldline      2.5 px, the single focal curve, with a light-cone glyph at every proper-time tick
 *
 * The scene is static: it draws on demand through the shared stage. A region under the pointer, or focused from the
 * keyboard, is reported back through `focusRegion`, which is what the lab's KaTeX overlay shows. Nothing here animates
 * except the proper-time cursor the lab asks for, and that snaps to its end under reduced motion.
 */

import * as TK from "../../design/tokens.mjs";
import { tagLayer as tag } from "../../render/scene-layers.mjs";
import {
  MINKOWSKI_EXTENT, RN_SCHEMATIC, SCHWARZSCHILD_EXTENT, freeFallFromRest, minkowskiBoundaries, minkowskiMap,
  radialNullRay, regions, sampleCoordinateLines, schwarzschildBoundaries, schwarzschildMap, schwarzschildRegionAt,
  staticObserver,
} from "../../science/conformal.mjs";
import {
  closedLoop, layout, lightConeSegments, panelAtX, polyline,
  properTimeIndex, futureLightRays, futureCausalRegion, schematicRegionAt, fromScene, toScene, zigzag,
} from "./penrose-geometry.mjs";

/** Field of view of the flat-map framing. */
export const PENROSE_FOV = 13;
/** Widths, in CSS px, from the engraved-line kit's own scale. */
const WIDTH = Object.freeze({ coordinate: 1, boundary: 1.5, focal: 2.5, glyph: 1 });
/** The singularity zig-zag, in diagram units. */
const ZIGZAG = Object.freeze({ amplitude: 0.05, period: 0.14 });
/** How many coordinate lines of each family to draw, per panel. */
const COORDINATE_LINES = Object.freeze({ t: 5, r: 5 });
/** How long the proper-time cursor takes to run the fall, at full motion. */
export const RELEASE_SECONDS = 3.4;
/** Radius of the worldline's start marker, in diagram units. */
const START_RING = 0.055;

const tokenHex = (name) => TK.hex(name);

/**
 * The status colour of each panel's boundary lines: the maps are established general relativity, the Reissner-Nordstrom
 * block is a schematic. The colour never carries the status alone, so every panel carries its word too.
 */
const PANEL_STATUS = Object.freeze({
  minkowski: Object.freeze({ status: "established", color: "status-established" }),
  schwarzschild: Object.freeze({ status: "established", color: "status-established" }),
  "reissner-nordstrom": Object.freeze({ status: "schematic", color: "status-schematic" }),
});

/* ---------- the polylines of one panel ---------- */

/** A flat [x, y, z] polyline from a list of diagram points. */
const flat = (panel, points) => polyline(panel, points);

/**
 * The t = const and r = const families of a panel, from the science module's own sampler.
 *
 * Minkowski gets one family over the whole diamond. Schwarzschild is drawn in the chart of EACH of its four regions:
 * a coordinate grid only exists inside one wedge of the maximal extension, and drawing region I's grid across the
 * horizon would put r > 2M lines in the interior, where the coordinate means something else. Radii are dense just
 * outside the horizon, where the map compresses hardest.
 */
function coordinatePolylines(panel, { M = 1 } = {}) {
  const extent = panel.extent;
  if (panel.id === "minkowski") {
    const tValues = [-0.82, -0.42, 0, 0.42, 0.82].slice(0, COORDINATE_LINES.t).map((s) => s * extent.T * 0.55);
    return sampleCoordinateLines("minkowski", {
      tValues, rValues: [1.2, 2.6, 4.6, 7.4, 11].slice(0, COORDINATE_LINES.r), samples: 96, rMin: 0.001, rMax: 13,
    });
  }
  // The two exterior wedges carry the readable grid, because that is where an observer sits; the interiors carry two
  // lines each, enough to show that the coordinate families continue through the horizon without turning the middle of
  // the picture into a hatch.
  const tLines = [], rLines = [];
  for (const region of ["I", "II", "III", "IV"]) {
    const interior = region === "II" || region === "IV";
    const tValues = interior ? [-0.34, 0.34] : [-0.62, 0, 0.62];
    const rValues = interior
      ? [0.7, 1.5].map((r) => r * M)
      : [2.3, 4.2].map((r) => r * M);
    const sampled = sampleCoordinateLines(panel.id, {
      tValues, rValues, M, region, samples: 80,
      rMin: interior ? 1e-6 : 2 * M * 1.01,
      rMax: interior ? 2 * M * 0.999 : 22 * M,
    });
    tLines.push(...sampled.tLines);
    rLines.push(...sampled.rLines);
  }
  return { tLines: Object.freeze(tLines), rLines: Object.freeze(rLines) };
}

/**
 * The two worldlines of the Schwarzschild panel, both from js/science/conformal.mjs: the radial free fall from rest at
 * r0 (the focal curve) and the static observer at the same radius. `r0` is the lab's slider.
 */
function schwarzschildWorldlinePolylines(panel, { r0 = 10, M = 1 } = {}) {
  const fall = freeFallFromRest({ r0, M, samples: 361 });
  const observer = staticObserver({ r0, M, samples: 241 });
  return {
    fall, observer,
    fallPoints: flat(panel, fall.rows),
    observerPoints: flat(panel, observer.rows),
    ticks: fall.ticks.map((tick) => ({ tick, glyph: lightConeSegments(panel, tick, 0.075) })),
  };
}

/** A small closed ring around a point of a diagram, as a flat xyz loop. */
function ringPolyline(panel, { T, R }, radius = START_RING, segments = 20) {
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const a = (2 * Math.PI * (i % segments)) / segments;
    points.push({ T: T + radius * Math.sin(a), R: R + radius * Math.cos(a) });
  }
  return flat(panel, points);
}

/**
 * @param ctx  the Scene3D build context
 * @returns the scene handle. `setStartRadius(r0)` redraws the focal worldline; `release(playing)` runs the proper-time
 *          cursor; `focusRegion(id | null)` reports the region under a pointer or the keyboard; `state()` is the QA hook.
 */
export async function buildPenroseAtlas(ctx, { visiblePanels = ["minkowski"], onEvent = () => {}, onProgress = () => {}, onIntro = () => {}, onRegion = () => {} } = {}) {
  const { THREE, scene } = ctx;
  const engraved = ctx.engraved;
  const atlas = layout();
  const M = 1;
  const panelOf = Object.fromEntries(atlas.panels.map((panel) => [panel.id, panel]));
  const groups = Object.fromEntries(atlas.panels.map((p) => {
    const group = new THREE.Group(); group.visible = visiblePanels.includes(p.id); scene.add(group); return [p.id, group];
  }));

  let currentR0 = 6;
  const ownerFor = (x) => atlas.panels.find((p) => Math.abs(x - p.cx) <= p.width / 2 + 1e-4);
  const add = (points, options) => {
    const line = engraved.line(points, { layer: "model", ...options });
    const owner = ownerFor(points[0]);
    (groups[owner?.id] ?? scene).add(tag(line, options?.layer ?? "model"));
    return line;
  };
  const addSegments = (pairs, options) => {
    const line = engraved.segments(pairs, { layer: "model", ...options });
    const owner = ownerFor(pairs[0]);
    (groups[owner?.id] ?? scene).add(tag(line, options?.layer ?? "model"));
    return line;
  };

  /* ---- coordinate lines: 1 px, --ink-faint, the first thing to recede ---- */
  const coordinate = { color: "ink-faint", widthPx: WIDTH.coordinate, opacity: 0.55 };
  for (const panel of atlas.panels) {
    if (panel.id === "reissner-nordstrom") continue; // the schematic has no coordinate families: it is one block
    const { tLines, rLines } = coordinatePolylines(panel, { M });
    for (const line of [...tLines, ...rLines]) {
      if (line.points.length >= 2) add(flat(panel, line.points), coordinate);
    }
  }

  /* ---- boundaries, at the status colour of the diagram ---- */
  for (const edge of [...minkowskiBoundaries(), ...schwarzschildBoundaries()]) {
    const panel = panelOf[edge.where];
    const status = PANEL_STATUS[edge.where];
    if (edge.points.length >= 2 && edge.kind !== "singularity") add(flat(panel, edge.points), { color: status.color, widthPx: WIDTH.boundary, opacity: 0.95 });
  }

  /* ---- singularities: generated zig-zags, never a texture ---- */
  const H = Math.PI / 2;
  const singularityStyle = { color: "status-established", widthPx: WIDTH.boundary, opacity: 1 };
  add(flat(panelOf.schwarzschild, zigzag({ axis: "T", fixed: H, from: -H, to: H, ...ZIGZAG })), singularityStyle);
  add(flat(panelOf.schwarzschild, zigzag({ axis: "T", fixed: -H, from: -H, to: H, ...ZIGZAG })), singularityStyle);
  // Reissner-Nordstrom's singularity is timelike: the vertical edge at r = 0, so its zig-zag swings in T across that
  // edge and it is drawn in the schematic status colour, once, on the shared boundary of the two interior triangles.
  const rnPanel = panelOf["reissner-nordstrom"];
  const rnSingularity = RN_SCHEMATIC.singularity[0];
  add(flat(rnPanel, zigzag({
    axis: "R", fixed: rnSingularity[0].R, from: rnSingularity[0].T, to: rnSingularity[rnSingularity.length - 1].T,
    amplitude: ZIGZAG.amplitude * 1.2, period: ZIGZAG.period * 1.3,
  })), { color: PANEL_STATUS["reissner-nordstrom"].color, widthPx: WIDTH.boundary, opacity: 1 });

  /* ---- the schematic block of Reissner-Nordstrom, in its own status colour ---- */
  // The block is a chain of regions, each of them a closed polygon: drawing the closed outlines rather than the edges
  // in isolation is what makes the chain read as three nested regions sharing their horizons.
  const rnStyle = { color: PANEL_STATUS["reissner-nordstrom"].color, widthPx: WIDTH.boundary, opacity: 0.95 };
  for (const polygon of Object.values(RN_SCHEMATIC.polygons)) {
    add(closedLoop(rnPanel, polygon), rnStyle);
    add(closedLoop(rnPanel, polygon.map((p) => ({ T: p.T, R: -p.R }))), rnStyle);
  }

  /* ---- the focal worldline: 2.5 px, the one heavy curve of the picture ---- */
  const panel = panelOf.schwarzschild;
  const focalStyle = { color: "ink-strong", widthPx: WIDTH.focal, opacity: 1 };
  let worldline = schwarzschildWorldlinePolylines(panel, { r0: currentR0, M });
  // The static observer is drawn once and redrawn on the slider: a line whose geometry is rebuilt in place allocates
  // nothing per frame, and this scene has no per-frame work at all except the release cursor.
  let observerLine = add(worldline.observerPoints, { color: "ink-dim", widthPx: WIDTH.boundary, opacity: 0.8 });
  let fallLine = null;
  let tickGlyphs = [];
  const retiredLines = [];
  const redrawWorldline = (r0) => {
    worldline = schwarzschildWorldlinePolylines(panel, { r0, M });
    if (fallLine) engraved.update(fallLine, worldline.fallPoints); else fallLine = add(worldline.fallPoints, focalStyle);
    if (tickGlyphs.length !== worldline.ticks.length) {
      for (const glyph of tickGlyphs) { glyph.removeFromParent(); retiredLines.push(glyph); }
      tickGlyphs = worldline.ticks.map(({ glyph }) => addSegments(glyph, { color: "ink-dim", widthPx: WIDTH.glyph, opacity: 0.9, layer: "decoration" }));
    } else {
      worldline.ticks.forEach(({ glyph }, i) => engraved.update(tickGlyphs[i], glyph));
    }
    engraved.update(observerLine, worldline.observerPoints);
    ctx.invalidate();
  };

  /* ---- the Formula Lens: the Kruskal relations, with U and V bound to their coordinate lines ---- */
  const uLines = [];
  const vLines = [];
  {
    // Lens highlights must be null rays, not the t=const and r=const grid: U and V are constant along these rays.
    for (const nullValue of [-4, 0, 4]) {
      uLines.push(flat(panelOf.schwarzschild, radialNullRay({ kind: "outgoing", nullValue, M, samples: 64 }).rows));
      vLines.push(flat(panelOf.schwarzschild, radialNullRay({ kind: "ingoing", nullValue, M, samples: 64 }).rows));
    }
  }
  try {
    const { attachLens } = await import("../common/lens-scenes.mjs");
    await attachLens("gr-penrose", ctx, { uLines, vLines, r0: () => currentR0 });
  } catch (error) {
    // The lens is an enhancement: a scene that cannot bind it still draws the atlas.
    if (globalThis.QGA_RENDER?.renderDiagnostics) {
      globalThis.QGA_RENDER.renderDiagnostics.message?.("penrose-atlas", `formula lens unavailable: ${error.message}`);
    }
  }

  /* ---- the proper-time cursor: the only animated thing here ---- */
  let cursor = { t: 0, index: 0 };
  let released = false;
  const cursorRing = add(ringPolyline(panel, { T: 0, R: 0 }), {
    color: "ink-strong", widthPx: WIDTH.boundary, opacity: 1, layer: "decoration",
  });
  cursorRing.userData.decoration = true;
  const moveCursor = (index) => {
    const rows = worldline.fall?.rows ?? [];
    if (!rows.length) return;
    const clamped = Math.max(0, Math.min(rows.length - 1, index));
    const lo = Math.floor(clamped), hi = Math.min(rows.length - 1, lo + 1), w = clamped - lo;
    cursor.index = index;
    const T = rows[lo].T + (rows[hi].T - rows[lo].T) * w;
    const R = rows[lo].R + (rows[hi].R - rows[lo].R) * w;
    cursorRing.position.set(R * panel.scale, 0, -T * panel.scale);
    ctx.invalidate();
  };

  redrawWorldline(currentR0);
  moveCursor(0);

  /* An event and its future-directed null rays. The RN panel has no coordinate map and cannot emit computed rays. */
  const eventGroup = new THREE.Group();
  scene.add(eventGroup);
  eventGroup.visible = false;
  const eventRing = engraved.line(ringPolyline({ cx: 0, scale: 1 }, { T: 0, R: 0 }, 0.13), { color: "accent-2", widthPx: 2.5, layer: "model" });
  const rayA = engraved.line(new Float32Array([0, 0, 0, 1, 0, -1]), { color: "accent-2", widthPx: 2.5, layer: "model" });
  const rayB = engraved.line(new Float32Array([0, 0, 0, -1, 0, -1]), { color: "accent-2", widthPx: 2.5, layer: "model" });
  const futureGeometry = new THREE.BufferGeometry();
  const futurePositions = new Float32Array(54);
  futureGeometry.setAttribute("position", new THREE.BufferAttribute(futurePositions, 3));
  const futureMaterial = new THREE.MeshBasicMaterial({ color: tokenHex("accent-2"), transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false });
  const futureMesh = new THREE.Mesh(futureGeometry, futureMaterial);
  futureMesh.frustumCulled = false;
  futureMesh.position.y = -0.02;
  eventGroup.add(eventRing, rayA, rayB, tag(futureMesh, "model"));
  const comparisonGroup = new THREE.Group(); scene.add(comparisonGroup); comparisonGroup.visible = false;
  const comparisonRing = engraved.line(ringPolyline({ cx: 0, scale: 1 }, { T: 0, R: 0 }, 0.13), { color: "accent-2", widthPx: WIDTH.boundary, layer: "model" });
  const comparisonA = engraved.line(new Float32Array([0, 0, 0, 1, 0, -1]), { color: "accent-2", widthPx: WIDTH.boundary, layer: "model" });
  const comparisonB = engraved.line(new Float32Array([0, 0, 0, -1, 0, -1]), { color: "accent-2", widthPx: WIDTH.boundary, layer: "model" });
  comparisonGroup.add(comparisonRing, comparisonA, comparisonB);
  const eventPoints = {};
  let comparisonEvent = null;
  let event = null, interactionMode = "signal", signalTime = 1, signalRunning = false;
  const placeEvent = (id, point) => {
    if (!visiblePanels.includes(id)) return false;
    const rays = futureLightRays(id, point);
    if (!rays) return false;
    const p = panelOf[id];
    const [x, y, z] = toScene(p, point);
    eventGroup.position.set(x, y, z);
    const fill = (line, end) => ctx.engraved.update(line, new Float32Array([0, 0, 0, (end.R - point.R) * p.scale, 0, -(end.T - point.T) * p.scale]));
    fill(rayA, rays.right); fill(rayB, rays.left);
    eventPoints[id] = { T: point.T, R: point.R };
    const otherId = visiblePanels.find((item) => item !== id && item !== "reissner-nordstrom");
    comparisonEvent = null;
    if (otherId) {
      const q = panelOf[otherId];
      const otherPoint = eventPoints[otherId] ?? (otherId === "minkowski" ? { T: 0, R: 0 } : { T: 0, R: 1.2 });
      const otherRays = futureLightRays(otherId, otherPoint);
      const [ox, oy, oz] = toScene(q, otherPoint);
      comparisonGroup.position.set(ox, oy, oz);
      const fillOther = (line, end) => ctx.engraved.update(line, new Float32Array([0, 0, 0, (end.R - otherPoint.R) * q.scale, 0, -(end.T - otherPoint.T) * q.scale]));
      fillOther(comparisonA, otherRays.right); fillOther(comparisonB, otherRays.left);
      comparisonEvent = { id: otherId, ...otherPoint, rays: otherRays };
    }
    comparisonGroup.visible = !!comparisonEvent && interactionMode === "signal";
    const polygon = futureCausalRegion(id, point);
    let vertex = 0;
    for (let i = 1; i < polygon.length - 1; i += 1) {
      for (const v of [polygon[0], polygon[i], polygon[i + 1]]) {
        futurePositions[vertex++] = (v.R - point.R) * p.scale;
        futurePositions[vertex++] = 0;
        futurePositions[vertex++] = -(v.T - point.T) * p.scale;
      }
    }
    futureGeometry.setDrawRange(0, vertex / 3);
    futureGeometry.attributes.position.needsUpdate = true;
    eventGroup.visible = interactionMode === "signal";
    rayA.scale.setScalar(1); rayB.scale.setScalar(1); comparisonA.scale.setScalar(1); comparisonB.scale.setScalar(1);
    signalTime = 1; signalRunning = false;
    event = { id, T: point.T, R: point.R, region: id === "schwarzschild" ? schwarzschildRegionAt(point) : "M", rays };
    onEvent(event); ctx.invalidate(); return true;
  };
  const pointerRay = new THREE.Raycaster();
  const intersection = new THREE.Vector3();
  // Two exact Minkowski trajectories illustrate how timelike and null infinity become finite edges.
  const flatPanel = panelOf.minkowski;
  const introGroup = new THREE.Group(); groups.minkowski.add(introGroup); introGroup.visible = false;
  const introObserver = engraved.line(ringPolyline(flatPanel, { T: 0, R: 0 }, 0.07), { color: "ink-strong", widthPx: WIDTH.focal, layer: "model" });
  const introLight = engraved.line(ringPolyline(flatPanel, { T: 0, R: 0 }, 0.07), { color: "accent-2", widthPx: WIDTH.focal, layer: "model" });
  introGroup.add(introObserver, introLight);
  let introRunning = false, introTime = 0;
  const stopIntro = () => { introRunning = false; introGroup.visible = false; eventGroup.visible = !!event && interactionMode === "signal"; onIntro(false); ctx.invalidate(); };

  /* ---- focus, hover and keyboard ---- */
  const regionHighlights = Object.fromEntries(atlas.panels.map((p) => {
    const ring = engraved.line(ringPolyline(p, { T: 0, R: 0 }, 0.15), { color: "accent-2", widthPx: WIDTH.focal, layer: "model" });
    ring.visible = false; groups[p.id].add(tag(ring, "model")); return [p.id, ring];
  }));
  let focused = null;
  const focusListeners = new Set();
  const setFocused = (id) => {
    if (id === focused) return;
    focused = id;
    for (const ring of Object.values(regionHighlights)) ring.visible = false;
    for (const p of atlas.panels) {
      const region = regions(p.id).find((item) => item.id === id);
      if (!region) continue;
      const ring = regionHighlights[p.id];
      ring.position.set(region.at.R * p.scale, 0, -region.at.T * p.scale); ring.visible = true;
    }
    for (const listener of focusListeners) listener(id);
    ctx.invalidate();
  };
  const regionLabelButtons = [];
  for (const p of atlas.panels.filter((item) => visiblePanels.includes(item.id) && item.id !== "minkowski")) {
    for (const region of regions(p.id)) {
      const [x, y, z] = toScene(p, region.at);
      const position = { x, y, z };
      const label = ctx.label("", () => position, "pn-region-label");
      const button = document.createElement("button");
      button.type = "button"; button.className = "pn-map-region"; button.textContent = region.id;
      button.style.pointerEvents = "none"; button.tabIndex = -1; regionLabelButtons.push(button);
      button.setAttribute("aria-label", `Explore ${region.name}`);
      button.addEventListener("click", () => { setFocused(region.id); onRegion(region.id); });
      label.el.appendChild(button);
    }
  }


  const pickEvent = (ndc) => {
      if (interactionMode === "observer") return;
      if (introRunning) stopIntro();
      pointerRay.setFromCamera(ndc, ctx.camera);
      const ray = pointerRay.ray;
      if (Math.abs(ray.direction.y) < 1e-9) return;
      const distance = -ray.origin.y / ray.direction.y;
      if (distance < 0) return;
      intersection.copy(ray.origin).addScaledVector(ray.direction, distance);
      const panelRef = panelAtX(intersection.x, atlas.panels);
      if (!panelRef || !visiblePanels.includes(panelRef.id)) return;
      const point = fromScene(panelRef, [intersection.x, intersection.y, intersection.z]);
      if (interactionMode === "regions") {
        if (panelRef.id === "schwarzschild" && futureLightRays(panelRef.id, point)) setFocused(schwarzschildRegionAt(point));
        if (panelRef.id === "minkowski" && futureLightRays(panelRef.id, point)) setFocused("M");
        if (panelRef.id === "reissner-nordstrom") setFocused(schematicRegionAt(point));
        return;
      }
      if (placeEvent(panelRef.id, point)) setFocused(panelRef.id === "schwarzschild" ? schwarzschildRegionAt(point) : "M");
  };
  return {
    autoRotate: false,
    onScreenPick: pickEvent,
    onScreenDrag: pickEvent,
    update: (t, dt) => {
      if (introRunning) {
        introTime = ctx.motion() <= 0 ? 1 : Math.min(1, introTime + dt / 4);
        const time = 30 * introTime / (1.03 - introTime);
        const observerT = Math.atan(time), lightT = Math.atan(2 * time) / 2;
        introObserver.position.set(0, 0, -observerT * flatPanel.scale);
        introLight.position.set(lightT * flatPanel.scale, 0, -lightT * flatPanel.scale);
        if (introTime >= 1) stopIntro(); else ctx.invalidate();
      }
      if (signalRunning) {
        signalTime = ctx.motion() <= 0 ? 1 : Math.min(1, signalTime + dt / 1.4);
        rayA.scale.setScalar(signalTime); rayB.scale.setScalar(signalTime);
        comparisonA.scale.setScalar(signalTime); comparisonB.scale.setScalar(signalTime);
        signalRunning = signalTime < 1; ctx.invalidate();
      }
      if (!released) return;
      const motion = ctx.motion();
      if (motion <= 0) {
        moveCursor((worldline.fall?.rows.length ?? 1) - 1);
        released = false;
        return;
      }
      cursor.t += dt;
      const progress = Math.min(1, cursor.t / RELEASE_SECONDS);
      moveCursor(properTimeIndex(worldline.fall.rows, progress));
      onProgress(progress);
      if (progress >= 1) released = false;
    },
    isAnimated: () => released || signalRunning || introRunning,
    /** The lab's r0 slider: redraw the free fall from the new radius and park the cursor at the start. */
    setStartRadius(r0) {
      currentR0 = r0;
      redrawWorldline(r0);
      moveCursor(0);
      cursor.t = 0;
      released = false;
      onProgress(0);
      return worldline.fall.etaHorizon;
    },
    /** Run the proper-time cursor along the worldline. Under reduced motion it snaps to the end and says so. */
    release() {
      if (ctx.motion() <= 0) { moveCursor((worldline.fall?.rows.length ?? 1) - 1); cursor.t = RELEASE_SECONDS; onProgress(1); ctx.invalidate(); return "snapped"; }
      if (cursor.t >= RELEASE_SECONDS) cursor.t = 0;
      released = true;
      ctx.invalidate();
      return "running";
    },
    pause() { released = false; ctx.invalidate(); },
    seek(progress) { cursor.t = Math.max(0, Math.min(1, progress)) * RELEASE_SECONDS; released = false; moveCursor(properTimeIndex(worldline.fall.rows, cursor.t / RELEASE_SECONDS)); onProgress(cursor.t / RELEASE_SECONDS); },
    placeEvent,
    setInteractionMode(mode) { interactionMode = mode; if (introRunning && mode !== "signal") stopIntro(); eventGroup.visible = !!event && mode === "signal" && !introRunning; comparisonGroup.visible = !!comparisonEvent && mode === "signal"; for (const button of regionLabelButtons) { button.style.pointerEvents = mode === "regions" ? "auto" : "none"; button.tabIndex = mode === "regions" ? 0 : -1; } ctx.invalidate(); },
    playIntro() { if (!visiblePanels.includes("minkowski")) return false; if (ctx.motion() <= 0) { stopIntro(); return false; } introTime = 0; introRunning = true; introGroup.visible = true; eventGroup.visible = false; onIntro(true); ctx.invalidate(); return true; },
    skipIntro: stopIntro,
    sendSignal() { if (!event) return false; if (introRunning) stopIntro(); signalTime = ctx.motion() <= 0 ? 1 : 0; signalRunning = signalTime < 1; rayA.scale.setScalar(signalTime); rayB.scale.setScalar(signalTime); comparisonA.scale.setScalar(signalTime); comparisonB.scale.setScalar(signalTime); ctx.invalidate(); return true; },
    focusRegion: (id) => setFocused(id),
    onFocusChange: (listener) => { focusListeners.add(listener); return () => focusListeners.delete(listener); },
    dispose() { for (const line of retiredLines) line.traverse((item) => { item.geometry?.dispose(); item.material?.dispose(); }); },
    // QA hook: qa/specs/penrose-atlas.spec.mjs reads the atlas without touching scene internals
    state: () => ({
      panels: atlas.panels.map((p) => p.id),
      visiblePanels, event, comparisonEvent, signalRunning, introRunning,
      r0: currentR0,
      focused,
      released,
      coordinateLines: COORDINATE_LINES,
      worldlinePoints: worldline.fall?.rows.length ?? 0,
      ticks: worldline.ticks.length,
      // where each proper-time tick sits on the diagram, so a test can check the glyphs follow the curve
      tickPoints: worldline.ticks.map(({ tick }) => ({ tau: tick.tau, T: tick.T, R: tick.R })),
      cursorIndex: cursor.index,
      cursorPoint: { T: -cursorRing.position.z / panel.scale, R: cursorRing.position.x / panel.scale },
      etaHorizon: worldline.fall?.etaHorizon ?? null,
      properTimeEnd: worldline.fall?.properTimeEnd ?? null,
      crossing: worldline.fall?.horizonCrossing ?? null,
      extent: { minkowski: MINKOWSKI_EXTENT, schwarzschild: SCHWARZSCHILD_EXTENT, rn: RN_SCHEMATIC.extent },
    }),
  };
}
