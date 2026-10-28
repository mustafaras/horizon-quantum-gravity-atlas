// The geometry of the Penrose atlas (S19), tested without three.js: the panel layout, the diagram-to-scene map, the
// generated zig-zag of a singularity, and the light-cone glyph. The atlas draws R to the right and T up the screen, so
// a null ray at 45 degrees in the diagram has to come out at 45 degrees in the scene: that is the first thing checked.

import test from "node:test";
import assert from "node:assert/strict";

import {
  DIAGRAM_SCALE, PANEL_GAP, PANELS, closedLoop, framing, fromScene, layout, lightCone, lightConeSegments,
  panelAtX, polyline, properTimeIndex, horizonProgress, compactificationSample, observatoryFrame, futureLightRays, futureCausalRegion, schematicRegionAt, toScene, zigzag,
} from "../js/visualizations/gr/penrose-geometry.mjs";
import { freeFallFromRest } from "../js/science/conformal.mjs";

const close = (actual, expected, tolerance, what) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${what}: ${actual} is not within ${tolerance} of ${expected}`);
};

test("intro samples interpolate between a linear finite chart and the exact compactification", () => {
  for (const u of [-6, -2, 2, 6]) for (const v of [-6, -2, 2, 6]) {
    const start = compactificationSample(u, v, 0), end = compactificationSample(u, v, 1), mid = compactificationSample(u, v, .5);
    close(end.T, (Math.atan(u) + Math.atan(v)) / 2, 1e-12, "compactified T");
    close(end.R, (Math.atan(v) - Math.atan(u)) / 2, 1e-12, "compactified R");
    close(mid.T, (start.T + end.T) / 2, 1e-12, "interpolated T");
    close(mid.R, (start.R + end.R) / 2, 1e-12, "interpolated R");
  }
  assert.throws(() => compactificationSample(7, 0, .5), RangeError);
});

test("future light rays remain null, stop at the boundary, and reject invalid or schematic events", () => {
  for (const [id, point] of [["minkowski", {T: 0, R: 0}], ["schwarzschild", {T: 0, R: 1.2}], ["schwarzschild", {T: 0.9, R: 0.15}]]) {
    const rays = futureLightRays(id, point);
    for (const end of [rays.left, rays.right]) {
      close(end.T - point.T, Math.abs(end.R - point.R), 1e-12, "null slope");
      assert.ok(end.T > point.T);
    }
    if (id === "minkowski") for (const end of [rays.left, rays.right]) close(Math.abs(end.T) + Math.abs(end.R), Math.PI / 2, 1e-12, "diamond edge");
    if (point.T === 0.9) for (const end of [rays.left, rays.right]) close(end.T, Math.PI / 2, 1e-12, "future singularity");
    const region = futureCausalRegion(id, point);
    assert.ok(region.length >= 3 && region.length <= 8);
    for (const vertex of region) assert.ok(vertex.T - point.T + 1e-12 >= Math.abs(vertex.R - point.R), "the shaded point is causally reachable");
  }
  assert.equal(futureLightRays("minkowski", {T: 2, R: 0}), null);
  assert.equal(futureLightRays("reissner-nordstrom", {T: 0, R: 0}), null);
});

test("observatory camera frames the selected panels on desktop and mobile", () => {
  for (const ids of [["minkowski"], ["schwarzschild"], ["reissner-nordstrom"], ["minkowski", "schwarzschild"]]) {
    for (const [width, height] of [[1000, 620], [310, 360]]) {
      const frame = observatoryFrame(ids, width, height);
      const halfHeight = Math.tan(13 * Math.PI / 360) * frame.radius;
      const halfWidth = halfHeight * width / height;
      for (const panel of layout().panels.filter(p => ids.includes(p.id))) {
        assert.ok(Math.abs(panel.cx - frame.targetX) + panel.width / 2 < halfWidth);
        assert.ok(panel.halfHeight < halfHeight);
      }
    }
  }
});

test("schematic region picking matches the three drawn RN regions on both sides", () => {
  for (const sign of [-1, 1]) {
    assert.equal(schematicRegionAt({ T: 0, R: sign * 0.5 }), "S");
    assert.equal(schematicRegionAt({ T: 0, R: sign * 1.45 }), "C");
    assert.equal(schematicRegionAt({ T: 0, R: sign * 2.5 }), "E");
  }
  assert.equal(schematicRegionAt({ T: 2, R: 0 }), null);
});

test("the animation follows equal increments of proper time, including the endpoints", () => {
  const { rows, properTimeEnd } = freeFallFromRest({ r0: 2.6, M: 1, samples: 361 });
  for (const progress of [0, 0.1, 0.5, 0.9, 1]) {
    const index = properTimeIndex(rows, progress);
    const lo = Math.floor(index), hi = Math.min(rows.length - 1, lo + 1), weight = index - lo;
    const tau = rows[lo].tau + weight * (rows[hi].tau - rows[lo].tau);
    close(tau, progress * properTimeEnd, 1e-12, `proper time at ${progress}`);
  }
  assert.equal(properTimeIndex(rows, -1), 0);
  assert.equal(properTimeIndex(rows, 2), rows.length - 1);
  const crossing = horizonProgress(freeFallFromRest({ r0: 2.6, M: 1, samples: 361 }));
  const index = properTimeIndex(rows, crossing), i = Math.floor(index), w = index - i;
  close(rows[i].r + (rows[i + 1].r - rows[i].r) * w, 2, 1e-4, "proper time at horizon");
});

test("the layout places the three panels left to right, separated by the gap and as wide as their diagrams", () => {
  const { panels, width, halfWidth } = layout();
  assert.equal(panels.length, 3);
  assert.deepEqual(panels.map((p) => p.id), ["minkowski", "schwarzschild", "reissner-nordstrom"]);
  for (let i = 1; i < panels.length; i += 1) {
    const previousEdge = panels[i - 1].cx + panels[i - 1].width / 2;
    const thisEdge = panels[i].cx - panels[i].width / 2;
    close(thisEdge - previousEdge, PANEL_GAP, 1e-12, `the gap between ${panels[i - 1].id} and ${panels[i].id}`);
    assert.ok(panels[i].cx > panels[i - 1].cx, "panels run left to right");
  }
  // the band is centred on the origin: the panels are not symmetric about it (their widths differ), but the atlas is
  const left = panels[0].cx - panels[0].width / 2;
  const right = panels[2].cx + panels[2].width / 2;
  close(left + right, 0, 1e-12, "the drawn band is centred on the origin");
  close(right - left, width, 1e-12, "and spans exactly the layout's width");
  close(width, 2 * halfWidth, 1e-12, "the width is twice the half width");
  // every panel is drawn at the same HEIGHT, which is what keeps the atlas inside a frame: the three diagrams are
  // different shapes, so a common scale would make the band thirteen times wider than it is tall
  for (const panel of panels) {
    close(2 * panel.halfHeight, 2 * layout().halfHeight, 1e-12, `${panel.id} is drawn at the common height`);
    close(panel.width, 2 * panel.halfWidth * panel.scale, 1e-12, `${panel.id}'s width follows its own scale`);
    // the scale is uniform within a panel, so a null ray is still at 45 degrees on screen
    const a = toScene(panel, { T: 0, R: 0 });
    const b = toScene(panel, { T: 0.5, R: -0.5 });
    close(Math.abs(b[0] - a[0]), Math.abs(b[2] - a[2]), 1e-12, `${panel.id}: a null step is the same length in x and z`);
  }
  // the tallest panel is drawn at the module's scale, and the atlas comes out a band a frame can hold
  assert.ok(panels.some((p) => Math.abs(p.scale - DIAGRAM_SCALE) < 1e-12), "one panel is drawn at DIAGRAM_SCALE");
  assert.ok(width / (2 * layout().halfHeight) < 8, "the atlas is not absurdly wide");
});

test("toScene sends R to the right and T up the screen, so a null ray stays at 45 degrees", () => {
  const { panels } = layout();
  const minkowski = panels.find((p) => p.id === "minkowski");
  const a = toScene(minkowski, { T: 0, R: 0 });
  const b = toScene(minkowski, { T: 1, R: 1 });
  close(b[0] - a[0], minkowski.scale, 1e-12, "dR = 1 moves +x by the scale");
  close(b[2] - a[2], -minkowski.scale, 1e-12, "dT = 1 moves up the screen, which is -z");
  // the 45-degree property: for a null step, the two displacements are equal in magnitude
  close(Math.abs(b[0] - a[0]), Math.abs(b[2] - a[2]), 1e-12, "a null step is the same length in x and z");
  // a panel's own origin sits at its centre, on the ground plane
  const centre = toScene(panels[1], { T: 0, R: 0 });
  close(centre[0], panels[1].cx, 1e-12, "T = R = 0 is the panel's centre in x");
  close(centre[1], 0, 1e-12, "the diagram lies in the y = 0 plane");
  close(centre[2], 0, 1e-12, "and at z = 0");
});

test("fromScene inverts toScene", () => {
  const { panels } = layout();
  for (const panel of panels) {
    for (const point of [{ T: 1.3, R: 0.4 }, { T: -0.8, R: -2 }, { T: 0, R: 0 }]) {
      const back = fromScene(panel, toScene(panel, point));
      close(back.T, point.T, 1e-12, "T round-trips");
      close(back.R, point.R, 1e-12, "R round-trips");
    }
  }
});

test("a polyline is one flat xyz array, and a closed loop repeats its first point", () => {
  const { panels } = layout();
  const flat = polyline(panels[0], [{ T: 0, R: -1 }, { T: 0, R: 1 }]);
  assert.ok(flat instanceof Float32Array);
  assert.equal(flat.length, 6);
  close(flat[1], 0, 0, "the points sit on the ground plane");
  const loop = closedLoop(panels[0], [{ T: 0, R: -1 }, { T: 1, R: 1 }]);
  assert.equal(loop.length, 9);
  close(loop[0], loop[6], 0, "the loop returns to its first x");
  close(loop[2], loop[8], 0, "and to its first z");
});

test("the zig-zag stays inside its amplitude and turns sharply", () => {
  const spacelike = zigzag({ axis: "T", fixed: 0.5, from: -1, to: 1, amplitude: 0.05, period: 0.2 });
  assert.ok(spacelike.length > 30, "the zig-zag is sampled");
  for (const p of spacelike) {
    assert.ok(Math.abs(p.T - 0.5) <= 0.05 + 1e-12, "the engraved mark stays close to the spacelike boundary");
    assert.ok(Math.abs(p.R) <= 1 + 1e-12, "it stays within the boundary's endpoints");
  }
  assert.ok(spacelike.some((p) => Math.abs(p.T - 0.5) > 0.01), "it visibly crosses the boundary");
  // the timelike case swaps the roles, which is what Reissner-Nordstrom needs
  const timelike = zigzag({ axis: "R", fixed: -1.2, from: -0.5, to: 0.5, amplitude: 0.04, period: 0.15 });
  for (const p of timelike) assert.ok(Math.abs(p.R + 1.2) <= 0.04 + 1e-12, "the engraved mark stays close to the timelike boundary");
  assert.ok(timelike.some((p) => Math.abs(p.R + 1.2) > 0.01), "it visibly crosses the boundary");
  // the endpoints are the requested range, so the zig-zag meets the corners of the diagram
  close(spacelike[0].R, -1, 0.06, "it starts at the requested end");
  close(spacelike[spacelike.length - 1].R, 1, 0.06, "and stops at the other");
  assert.throws(() => zigzag({ axis: "X", fixed: 0, from: 0, to: 1 }), RangeError, "axis must be T or R");
  assert.throws(() => zigzag({ axis: "T", fixed: 0, from: 1, to: 0 }), RangeError, "the range must be increasing");
  assert.throws(() => zigzag({ axis: "T", fixed: 0, from: 0, to: 1, amplitude: 0 }), RangeError, "amplitude must be positive");
});

test("a light-cone glyph is two 45-degree diagonals and nothing else", () => {
  const glyph = lightCone({ T: 0.4, R: -0.2 }, 0.1);
  assert.equal(glyph.length, 4);
  for (const p of glyph) close(Math.abs(p.T - 0.4), Math.abs(p.R + 0.2), 1e-15, "each arm end is a null displacement");
  assert.ok(glyph !== lightCone({ T: 0.4, R: -0.2 }, 0.1), "a new object every call");
  // two segments: the first pair and the second pair
  const { panels } = layout();
  const segments = lightConeSegments(panels[1], { T: 0, R: 0 }, 0.2);
  assert.equal(segments.length, 12, "four points is two segments");
  // the buffer is float32, so the two arms agree to its rounding, not to double precision
  close(Math.abs(segments[3] - segments[0]), Math.abs(segments[5] - segments[2]), 1e-6, "the first arm is at 45 degrees in the scene");
  close(Math.abs(segments[9] - segments[6]), Math.abs(segments[11] - segments[8]), 1e-6, "and so is the second");
  assert.throws(() => lightCone({ T: 0, R: 0 }, 0), RangeError, "the size must be positive");
});

test("panelAtX finds the panel under a pointer and nothing in the gaps", () => {
  const { panels } = layout();
  assert.equal(panelAtX(panels[0].cx, panels).id, "minkowski");
  assert.equal(panelAtX(panels[1].cx, panels).id, "schwarzschild");
  assert.equal(panelAtX(panels[2].cx, panels).id, "reissner-nordstrom");
  // just outside a panel's own width, in the gap, there is no panel
  const edge = panels[1].cx + panels[1].width / 2;
  assert.equal(panelAtX(edge + PANEL_GAP * 0.5, panels), null, "the gap between panels belongs to no diagram");
  assert.equal(panelAtX(1000, panels), null, "and neither does the space beyond the atlas");
});

test("framing returns a distance that fits the atlas at the given aspect", () => {
  const wide = framing(12, 2.2);
  const narrow = framing(12, 0.6);
  assert.ok(wide > 0 && Number.isInteger(wide), "a whole number of scene units");
  assert.ok(narrow >= wide, "a narrow frame has to pull back further to fit the same width");
  assert.ok(framing(30, 1.6) < framing(12, 1.6), "a wider field of view needs less distance");
  // the distance really does cover the half height at the given field of view
  const d = framing(12, 3);
  const covered = Math.tan((12 * Math.PI) / 360) * d;
  const { halfHeight } = layout();
  assert.ok(covered >= halfHeight, `the frame covers the atlas: ${covered} against ${halfHeight}`);
});

test("the panel list is the three diagrams of the atlas, in the order the prompt gives", () => {
  assert.deepEqual(PANELS.map((p) => p.id), ["minkowski", "schwarzschild", "reissner-nordstrom"]);
  assert.deepEqual(PANELS.map((p) => p.title), ["Minkowski", "Schwarzschild", "Reissner–Nordström"]);
  close(PANELS[0].extent.T, Math.PI / 2, 1e-15, "the Minkowski diamond's half height");
  close(PANELS[1].extent.R, Math.PI, 1e-15, "the extended Schwarzschild diagram's half width");
});
