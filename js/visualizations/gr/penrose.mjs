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
  LABEL_PAD, PANELS, TITLE_DROP, closedLoop, framing, layout, lightConeSegments, panelAtX, polyline, screenFractions,
  toScene, zigzag,
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
export async function buildPenroseAtlas(ctx) {
  const { THREE, scene } = ctx;
  const engraved = ctx.engraved;
  const atlas = layout();
  const M = 1;
  const panelOf = Object.fromEntries(atlas.panels.map((panel) => [panel.id, panel]));

  const pickables = [];
  let currentR0 = 6;
  const add = (points, options) => {
    const line = engraved.line(points, { layer: "model", ...options });
    scene.add(tag(line, "model"));
    return line;
  };
  const addSegments = (pairs, options) => {
    const line = engraved.segments(pairs, { layer: "model", ...options });
    scene.add(tag(line, "model"));
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
  const boundaryLines = [];
  for (const edge of [...minkowskiBoundaries(), ...schwarzschildBoundaries()]) {
    const panel = panelOf[edge.where];
    const status = PANEL_STATUS[edge.where];
    const drawn = edge.points.length >= 2
      ? add(flat(panel, edge.points), { color: status.color, widthPx: WIDTH.boundary, opacity: 0.95 })
      : null;
    if (drawn) boundaryLines.push({ edge, line: drawn });
    // every boundary is also a place: a marker so hover and the lens have something to point at
    const marker = markerAt(panel, edge.points[0], status.status);
    marker.userData.edge = edge.id;
    marker.userData.panel = edge.where;
    pickables.push(marker);
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

  const redrawWorldline = (r0) => {
    if (fallLine) scene.remove(fallLine);
    for (const glyph of tickGlyphs) scene.remove(glyph);
    tickGlyphs = [];
    worldline = schwarzschildWorldlinePolylines(panel, { r0, M });
    fallLine = add(worldline.fallPoints, focalStyle);
    for (const { glyph } of worldline.ticks) {
      const line = addSegments(glyph, { color: "ink-dim", widthPx: WIDTH.glyph, opacity: 0.9, layer: "decoration" });
      tickGlyphs.push(line);
    }
    scene.remove(observerLine);
    observerLine = add(worldline.observerPoints, { color: "ink-dim", widthPx: WIDTH.boundary, opacity: 0.8 });
    ctx.invalidate();
  };

  /* ---- labels: the diagram titles, the status word, and what each diagram is ---- */
  // One header per panel, in the stage's own overlay rather than as a projected label. A projected label is offset by
  // its own height and knows nothing about its neighbours, so at a phone's width the three of them overlap and run off
  // the frame. As overlay children laid out by CSS they wrap, shrink to the panel and stay inside the stage at any
  // width, and the titles stay above their diagrams because that is where the grid puts them.
  // The cells are spaced to the fractions the drawn band actually occupies, so a title is centred over its own diagram
  // at every stage width rather than over the panel's share of the scene coordinates.
  // The scene is built before the camera has been placed, so the fraction helper is given the same distance the lab's
  // `initial` would ask for at this aspect: any distance gives the same fractions, since the band is flat at z = 0 and
  // the projection is linear across it, but passing one keeps the result finite and the code honest.
  const frameAspect = ctx.camera?.aspect || 3.8;
  const fractions = screenFractions(PENROSE_FOV, frameAspect, framing(PENROSE_FOV, frameAspect));
  const headerRow = document.createElement("div");
  headerRow.className = "pn-heads";
  headerRow.style.left = `${fractions.band[0] * 100}%`;
  headerRow.style.right = `${(1 - fractions.band[1]) * 100}%`;
  const bandSpan = fractions.band[1] - fractions.band[0];
  for (const [index, p] of atlas.panels.entries()) {
    const status = PANEL_STATUS[p.id];
    const span = fractions.panels[index];
    const cell = document.createElement("div");
    cell.className = "pn-head";
    // Each cell is placed at its own diagram's extent, as a fraction of the row: absolute placement from the projection
    // is exact at every width, where flex would depend on content width and on how a browser rounds the shrink.
    cell.style.left = `${((span.left - fractions.band[0]) / bandSpan) * 100}%`;
    cell.style.width = `${((span.right - span.left) / bandSpan) * 100}%`;
    const title = document.createElement("span");
    title.className = "pn-head-title";
    title.textContent = p.title;
    const word = document.createElement("span");
    word.className = "pn-head-status";
    word.dataset.status = status.status;
    word.textContent = status.status;
    cell.append(title, word);
    headerRow.appendChild(cell);
  }
  ctx.mountOverlay(headerRow);


  /* ---- region markers: what the pointer and the keyboard report on ---- */
  const markers = [];
  function markerAt(panelRef, at, status) {
    const material = new THREE.MeshBasicMaterial({ color: tokenHex(PANEL_STATUS[panelRef.id]?.color ?? "ink-dim"), transparent: true, opacity: 0.001 });
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(0.42, 12), material);
    const [x, y, z] = toScene(panelRef, at);
    mesh.position.set(x, y, z + 0.005);
    mesh.userData.panel = panelRef.id;
    mesh.userData.layer = "data";
    scene.add(mesh);
    return mesh;
  }
  for (const id of ["minkowski", "schwarzschild", "reissner-nordstrom"]) {
    for (const region of regions(id)) {
      const marker = markerAt(panelOf[id], region.at);
      marker.userData.region = region.id;
      marker.userData.status = PANEL_STATUS[id].status;
      pickables.push(marker);
      markers.push(marker);
    }
  }

  /* ---- the Formula Lens: the Kruskal relations, with U and V bound to their coordinate lines ---- */
  const uLines = [];
  const vLines = [];
  {
    const { tLines, rLines } = coordinatePolylines(panelOf.schwarzschild, { M });
    // U = -e^(-(t - r*)/4M) is constant along an outgoing null ray, V = e^((t + r*)/4M) along an ingoing one; the two
    // families of coordinate lines are the closest drawn objects to those congruences, so they carry the terms.
    for (const line of tLines) uLines.push(flat(panelOf.schwarzschild, line.points));
    for (const line of rLines) vLines.push(flat(panelOf.schwarzschild, line.points));
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
  const cursorRing = add(ringPolyline(panel, worldline.ticks[0]?.tick ?? { T: 0, R: 0 }), {
    color: "ink-strong", widthPx: WIDTH.boundary, opacity: 1, layer: "decoration",
  });
  cursorRing.userData.decoration = true;
  const cursorAt = (index) => {
    const rows = worldline.fall?.rows ?? [];
    if (!rows.length) return { T: 0, R: 0 };
    const clamped = Math.max(0, Math.min(rows.length - 1, Math.round(index)));
    return rows[clamped];
  };
  const moveCursor = (index) => {
    cursor.index = index;
    const point = cursorAt(index);
    const [x, y, z] = toScene(panel, point);
    cursorRing.position.set(x - toScene(panel, { T: 0, R: 0 })[0], y, z);
    ctx.invalidate();
  };

  redrawWorldline(currentR0);
  moveCursor(0);

  /* ---- focus, hover and keyboard ---- */
  let focused = null;
  const focusListeners = new Set();
  const setFocused = (id) => {
    if (id === focused) return;
    focused = id;
    for (const listener of focusListeners) listener(id);
    ctx.invalidate();
  };
  const regionFromObject = (object) => {
    if (!object) return null;
    let node = object;
    while (node) {
      if (node.userData?.region) return { panel: node.userData.panel, region: node.userData.region };
      node = node.parent;
    }
    return null;
  };

  return {
    autoRotate: false,
    pickables,
    onHover: (object) => setFocused(regionFromObject(object)?.region ?? null),
    onPick: (object) => setFocused(regionFromObject(object)?.region ?? null),
    onScreenPick: (ndc) => {
      // A pointer over a diagram with no marker under it still says which panel it is over, so the overlay is never
      // blank inside a panel: the nearest region of that panel is reported instead.
      const panelRef = panelAtX(ndc.x * (atlas.halfWidth + 1) * 2.2, atlas.panels);
      if (!panelRef) return setFocused(null);
      const nearest = regions(panelRef.id)
        .map((region) => ({ region, d: Math.hypot(region.at.T + ndc.y * panelRef.extent.T * 2, region.at.R) }))
        .sort((a, b) => a.d - b.d)[0];
      setFocused(nearest ? nearest.region.id : null);
    },
    update: (t, dt) => {
      if (!released) return;
      const motion = ctx.motion();
      if (motion <= 0) {
        moveCursor((worldline.fall?.rows.length ?? 1) - 1);
        released = false;
        return;
      }
      cursor.t += dt;
      const progress = Math.min(1, cursor.t / RELEASE_SECONDS);
      moveCursor(progress * ((worldline.fall?.rows.length ?? 1) - 1));
      if (progress >= 1) released = false;
    },
    isAnimated: () => released,
    /** The lab's r0 slider: redraw the free fall from the new radius and park the cursor at the start. */
    setStartRadius(r0) {
      currentR0 = r0;
      redrawWorldline(r0);
      moveCursor(0);
      cursor.t = 0;
      released = false;
      return worldline.fall.etaHorizon;
    },
    /** Run the proper-time cursor along the worldline. Under reduced motion it snaps to the end and says so. */
    release() {
      if (ctx.motion() <= 0) { moveCursor((worldline.fall?.rows.length ?? 1) - 1); ctx.invalidate(); return "snapped"; }
      cursor.t = 0;
      released = true;
      ctx.invalidate();
      return "running";
    },
    focusRegion: (id) => setFocused(id),
    onFocusChange: (listener) => { focusListeners.add(listener); return () => focusListeners.delete(listener); },
    dispose: () => { for (const marker of markers) marker.material.dispose(); },
    // QA hook: qa/specs/penrose-atlas.spec.mjs reads the atlas without touching scene internals
    state: () => ({
      panels: atlas.panels.map((p) => p.id),
      r0: currentR0,
      focused,
      released,
      coordinateLines: COORDINATE_LINES,
      worldlinePoints: worldline.fall?.rows.length ?? 0,
      ticks: worldline.ticks.length,
      // where each proper-time tick sits on the diagram, so a test can check the glyphs follow the curve
      tickPoints: worldline.ticks.map(({ tick }) => ({ tau: tick.tau, T: tick.T, R: tick.R })),
      cursorIndex: cursor.index,
      etaHorizon: worldline.fall?.etaHorizon ?? null,
      properTimeEnd: worldline.fall?.properTimeEnd ?? null,
      crossing: worldline.fall?.horizonCrossing ?? null,
      extent: { minkowski: MINKOWSKI_EXTENT, schwarzschild: SCHWARZSCHILD_EXTENT, rn: RN_SCHEMATIC.extent },
    }),
  };
}
