// The geometry of the Penrose atlas (S19), tested without three.js: the panel layout, the diagram-to-scene map, the
// generated zig-zag of a singularity, and the light-cone glyph. The atlas draws R to the right and T up the screen, so
// a null ray at 45 degrees in the diagram has to come out at 45 degrees in the scene: that is the first thing checked.

import test from "node:test";
import assert from "node:assert/strict";

import {
  DIAGRAM_SCALE, PANEL_GAP, PANELS, closedLoop, framing, fromScene, layout, lightCone, lightConeSegments,
  panelAtX, polyline, toScene, zigzag,
} from "../js/visualizations/gr/penrose-geometry.mjs";

const close = (actual, expected, tolerance, what) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${what}: ${actual} is not within ${tolerance} of ${expected}`);
};

test("the layout places the three panels left to right, separated by the gap and as wide as their diagrams", () => {
  const { panels, width, halfWidth } = layout();
  assert.equal(panels.length, 3);
  assert.deepEqual(panels.map((p) => p.id), ["minkowski", "schwarzschild", "reissner-nordstrom"]);
  for (let i = 1; i < panels.length; i += 1) {
    const previousEdge = panels[i - 1].cx + panels[i - 1].slot / 2;
    const thisEdge = panels[i].cx - panels[i].slot / 2;
    close(thisEdge - previousEdge, PANEL_GAP, 1e-12, `the gap between ${panels[i - 1].id} and ${panels[i].id}`);
    assert.ok(panels[i].cx > panels[i - 1].cx, "panels run left to right");
    // a narrow panel is centred in its own slot, so it cannot touch its neighbour
    assert.ok(panels[i].width <= panels[i].slot + 1e-12, `${panels[i].id} fits its slot`);
  }
  // the whole atlas is centred on the origin
  close(panels[1].cx, 0, 1e-12, "the middle panel is centred at x = 0");
  close(panels[0].cx + panels[2].cx, 0, 1e-12, "and the outer two are symmetric about it");
  close(width, 2 * halfWidth, 1e-12, "the width is twice the half width");
  // each panel is as wide as its own diagram, and no wider
  for (const panel of panels) close(panel.width, 2 * panel.halfWidth * DIAGRAM_SCALE, 1e-12, `${panel.id}'s width`);
});

test("toScene sends R to the right and T up the screen, so a null ray stays at 45 degrees", () => {
  const { panels } = layout();
  const [minkowski] = panels;
  const a = toScene(minkowski, { T: 0, R: 0 });
  const b = toScene(minkowski, { T: 1, R: 1 });
  close(b[0] - a[0], DIAGRAM_SCALE, 1e-12, "dR = 1 moves +x by the scale");
  close(b[2] - a[2], -DIAGRAM_SCALE, 1e-12, "dT = 1 moves up the screen, which is -z");
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
    close(p.T, 0.5, 0, "a spacelike singularity holds T fixed");
    assert.ok(Math.abs(p.R) <= 1 + 0.05 + 1e-12, "and stays within its amplitude of the surface");
  }
  assert.ok(new Set(spacelike.map((p) => p.R.toFixed(4))).size > 10, "it really does move");
  // the timelike case swaps the roles, which is what Reissner-Nordstrom needs
  const timelike = zigzag({ axis: "R", fixed: -1.2, from: -0.5, to: 0.5, amplitude: 0.04, period: 0.15 });
  for (const p of timelike) close(p.R, -1.2, 0, "a timelike singularity holds R fixed");
  assert.ok(timelike.some((p) => Math.abs(p.T) > 0.01), "and moves in T");
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
  // just outside a panel's slot, in the gap, there is no panel
  const edge = panels[1].cx + panels[1].slot / 2;
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
