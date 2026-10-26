import test from "node:test";
import assert from "node:assert/strict";

import {
  photonGeometry, gluonGeometry, arrowAt, momentumArrow, layoutDiagram, diagramToSvg, ARROW_POINTS, VERTEX_RADIUS, EDGE_KINDS,
} from "../js/visualizations/qft/feynman-svg.mjs";
import { diagramFor, legendDiagram, DIAGRAM_SIZE } from "../js/visualizations/qft/feynman-diagrams.mjs";

test("the legend draws every edge kind once, each with a label, inside the canvas", () => {
  const def = legendDiagram();
  const layout = layoutDiagram(def);
  assert.deepEqual(layout.paths.map((p) => p.kind).sort(), [...EDGE_KINDS].sort());
  assert.equal(layout.labels.length, EDGE_KINDS.length);
  assert.equal(layout.arrows.length, 2); // fermion and antifermion
  assert.ok(layout.paths.find((p) => p.kind === "scalar").dash);
  for (const v of def.vertices) assert.ok(v.x >= 0 && v.x <= DIAGRAM_SIZE.width && v.y >= 0 && v.y <= DIAGRAM_SIZE.height);
  for (const l of layout.labels) assert.ok(l.x >= 0 && l.x <= DIAGRAM_SIZE.width && l.y >= 0 && l.y <= DIAGRAM_SIZE.height, l.tex);
});

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);
const A = { x: 10, y: 20 };

/** Number of sign changes of the offset from the straight edge. */
function crossings(points, a, b) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
  const side = points.map((p) => (p.x - a.x) * nx + (p.y - a.y) * ny);
  let count = 0, last = 0;
  for (const value of side) {
    if (Math.abs(value) < 1e-9) continue; // a sample on the edge itself (rounding can make it exactly zero)
    if (last * value < 0) count++;
    last = value;
  }
  return count;
}

test("a photon starts and ends on its vertices and has an integer number of half-periods", () => {
  for (const b of [{ x: 130, y: 20 }, { x: 10, y: 190 }, { x: 150, y: 150 }]) {
    const { points, halfPeriods } = photonGeometry(A, b);
    assert.ok(Number.isInteger(halfPeriods) && halfPeriods >= 2);
    assert.deepEqual(points[0], A);
    assert.deepEqual(points[points.length - 1], b);
    // N half-periods cross the edge N - 1 times in the interior.
    assert.equal(crossings(points, A, b), halfPeriods - 1);
  }
});

test("the photon half-period count grows with the edge length", () => {
  const short = photonGeometry(A, { x: 70, y: 20 }).halfPeriods;
  const long = photonGeometry(A, { x: 250, y: 20 }).halfPeriods;
  assert.ok(long > 2 * short);
});

test("a gluon coil is anchored on both vertices and its loop count is proportional to the length", () => {
  const short = gluonGeometry(A, { x: 110, y: 20 });
  const long = gluonGeometry(A, { x: 210, y: 20 });
  assert.deepEqual(short.points[0], A);
  close(short.points[short.points.length - 1].x, 110);
  close(short.points[short.points.length - 1].y, 20);
  assert.ok(Math.abs(long.loops / short.loops - 2) < 0.25, `${long.loops} vs ${short.loops}`);
  // A trochoid doubles back: the coordinate along the edge decreases somewhere inside every loop.
  let backward = 0, inRun = false;
  for (let i = 1; i < long.points.length; i++) {
    const back = long.points[i].x < long.points[i - 1].x - 1e-9;
    if (back && !inRun) backward++;
    inRun = back;
  }
  assert.ok(backward >= long.loops - 1 && backward <= long.loops + 1, `${backward} backward runs for ${long.loops} loops`);
});

test("the fermion arrow sits at the middle of the segment and points along it", () => {
  const arrow = arrowAt({ x: 0, y: 0 }, { x: 100, y: 0 }, false);
  close(arrow.x, 50); close(arrow.y, 0); close(arrow.angle, 0);
  const diagonal = arrowAt({ x: 0, y: 0 }, { x: 40, y: 30 }, false);
  close(diagonal.x, 20); close(diagonal.y, 15); close(diagonal.angle, Math.atan2(30, 40));
});

test("an antifermion arrow runs against the edge direction", () => {
  const arrow = arrowAt({ x: 0, y: 0 }, { x: 100, y: 0 }, true);
  close(Math.abs(arrow.angle), Math.PI);
});

test("a momentum arrow is parallel to its edge and offset from it", () => {
  const m = momentumArrow({ x: 0, y: 0 }, { x: 100, y: 0 }, { tex: "p_1" });
  close(m.y1, m.y2);
  assert.ok(Math.abs(m.y1) > 5);
  assert.ok(m.x2 > m.x1);
  const flipped = momentumArrow({ x: 0, y: 0 }, { x: 100, y: 0 }, { tex: "p_1", reverse: true });
  assert.ok(flipped.x2 < flipped.x1);
});

const DEFINITION = {
  vertices: [
    { id: "a", x: 20, y: 20, external: true }, { id: "b", x: 20, y: 140, external: true },
    { id: "v", x: 120, y: 80 }, { id: "w", x: 260, y: 80 },
    { id: "c", x: 360, y: 20, external: true }, { id: "d", x: 360, y: 140, external: true },
  ],
  edges: [
    { from: "a", to: "v", kind: "fermion", label: "e^-", momentum: { tex: "p_1" } },
    { from: "b", to: "v", kind: "antifermion", label: "e^+" },
    { from: "v", to: "w", kind: "photon", label: "\\gamma" },
    { from: "w", to: "c", kind: "fermion", label: "\\mu^-" },
    { from: "w", to: "d", kind: "antifermion", label: "\\mu^+" },
  ],
};

test("layoutDiagram draws one dot per internal vertex, of radius 3, and a KaTeX label per labelled edge", () => {
  const layout = layoutDiagram(DEFINITION);
  assert.equal(VERTEX_RADIUS, 3);
  assert.deepEqual(layout.dots.map((d) => d.id), ["v", "w"]);
  assert.ok(layout.dots.every((d) => d.r === 3));
  assert.equal(layout.labels.length, 6); // five edge labels and the momentum label of the first leg
  assert.ok(layout.labels.every((l) => typeof l.tex === "string" && Number.isFinite(l.x) && Number.isFinite(l.y)));
  assert.equal(layout.arrows.length, 4);
  assert.equal(layout.momenta.length, 1);
});

test("layoutDiagram rejects an unknown vertex or edge kind", () => {
  assert.throws(() => layoutDiagram({ vertices: [{ id: "a", x: 0, y: 0 }], edges: [{ from: "a", to: "z", kind: "photon" }] }), /unknown vertex/);
  assert.throws(() => layoutDiagram({ vertices: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 9, y: 0 }], edges: [{ from: "a", to: "b", kind: "weird" }] }), /edge kind/);
});

test("diagramToSvg paints every role through the injected token resolver and never writes a colour itself", () => {
  const roles = new Set();
  const svg = diagramToSvg(DEFINITION, { paint: (role) => { roles.add(role); return `var(--${role})`; }, ariaLabel: "e+e- to mu+mu-" });
  assert.match(svg, /^<svg /);
  assert.match(svg, /role="img"/);
  assert.match(svg, /aria-label="e\+e- to mu\+mu-"/);
  assert.ok(["fermion", "photon", "vertex", "momentum"].every((r) => roles.has(r)), [...roles].join());
  assert.doesNotMatch(svg, /#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(|oklch\(/);
  assert.ok(svg.includes(ARROW_POINTS));
});

test("scalar edges are dashed and the boson has its own role", () => {
  const def = {
    vertices: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 100, y: 0 }, { id: "c", x: 200, y: 0 }],
    edges: [{ from: "a", to: "b", kind: "scalar" }, { from: "b", to: "c", kind: "boson" }],
  };
  const svg = diagramToSvg(def, { paint: (role) => `var(--${role})` });
  assert.match(svg, /stroke-dasharray/);
  assert.match(svg, /var\(--boson\)/);
});

test("every process diagram of the builder is well formed and fits its canvas", () => {
  const labels = ["e^-", "e^+", "\\mu^-", "\\mu^+"];
  const cases = [
    { topo: "s", boson: "\\gamma / Z^0", channel: "s" },
    { topo: "s", boson: "\\gamma / Z^0", channel: "t" },
    { topo: "t", boson: "\\gamma", channel: "t" },
    { topo: "t", boson: "\\gamma", channel: "u" },
    { topo: "compton", boson: null, channel: "s" },
    { topo: "compton", boson: null, channel: "u" },
  ];
  for (const c of cases) {
    const photon = { tex: "\\gamma", anti: false, photon: true };
    const ends = c.topo === "compton"
      ? [photon, { tex: labels[0], anti: false, photon: false }, photon, { tex: labels[0], anti: false, photon: false }]
      : [{ tex: labels[0], anti: false, photon: false }, { tex: labels[1], anti: true, photon: false },
        { tex: labels[2], anti: false, photon: false }, { tex: labels[3], anti: true, photon: false }];
    const def = diagramFor({ ...c, ends });
    const layout = layoutDiagram(def);
    assert.ok(layout.paths.length >= 5, `${c.topo}/${c.channel}`);
    for (const v of def.vertices) {
      assert.ok(v.x >= 0 && v.x <= DIAGRAM_SIZE.width && v.y >= 0 && v.y <= DIAGRAM_SIZE.height, `${c.topo} ${v.id}`);
    }
  }
});
