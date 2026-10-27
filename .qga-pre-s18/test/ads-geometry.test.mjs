import test from "node:test";
import assert from "node:assert/strict";

import {
  ADS_LAB_PROVENANCE, ADS_LAB_VIEW_ID, ADS_LAB_DEFAULTS,
  angularSpan, boundaryGeodesic, sampleGeodesic, hyperbolicDistance,
  diskRadius, hyperbolicRadius, regularizedGeodesicLength, rtEntropy,
  partitionIntervals, entanglementWedge, hyperbolicGrid, adsLabState,
  adsExportMetadata, registerAdsLabProvenance, wrapAngle, boundaryPoint,
} from "../js/science/ads-geometry.mjs";
import { getVisualizationProvenance } from "../js/science/provenance.mjs";

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `|${a} − ${b}| > ${eps}`);

test("provenance registers with the fixed status vocabulary", () => {
  const p = registerAdsLabProvenance();
  assert.deepEqual(p, ADS_LAB_PROVENANCE);
  assert.deepEqual(getVisualizationProvenance(ADS_LAB_VIEW_ID), ADS_LAB_PROVENANCE);
  assert.ok(["established", "effective", "conjectural", "schematic", "heuristic", "open"].includes(p.status));
  assert.ok(p.assumptions.some((a) => /conjectural/i.test(a)));
  assert.ok(p.assumptions.some((a) => /established/i.test(a)));
});

test("boundaryGeodesic: circle orthogonal to the boundary through both endpoints", () => {
  for (const [t1, t2] of [[0.3, 1.9], [2.0, 5.1], [0.0, 2.0], [4.0, 0.5], [1.0, 1.0 + Math.PI - 1e-6]]) {
    const g = boundaryGeodesic(t1, t2);
    if (g.kind === "diameter") continue;
    const p1 = boundaryPoint(t1);
    const p2 = boundaryPoint(t2);
    // Orthogonality: C·P = 1 for both endpoints (derived condition; ~1e-9 fp error).
    close(g.center.x * p1.x + g.center.y * p1.y, 1, 1e-7);
    close(g.center.x * p2.x + g.center.y * p2.y, 1, 1e-7);
    // Both endpoints lie on the geodesic circle at the stated radius.
    close(Math.hypot(p1.x - g.center.x, p1.y - g.center.y), g.radius, 1e-9);
    close(Math.hypot(p2.x - g.center.x, p2.y - g.center.y), g.radius, 1e-9);
  }
});

test("boundaryGeodesic: antipodal endpoints give the diameter through the origin", () => {
  const g = boundaryGeodesic(0.7, 0.7 + Math.PI);
  assert.equal(g.kind, "diameter");
  const pts = sampleGeodesic(g, 20);
  // The sampled polyline passes through the origin.
  const mid = pts[Math.floor(pts.length / 2)];
  close(Math.hypot(mid.x, mid.y), 0, 1e-9);
});

test("sampleGeodesic stays inside the closed disk and hits both endpoints", () => {
  for (const [t1, t2] of [[0.2, 2.4], [3.0, 5.8], [0.0, 4.4], [1.2, 1.2 + 4.0]]) {
    const pts = sampleGeodesic(boundaryGeodesic(t1, t2), 64);
    for (const p of pts) assert.ok(Math.hypot(p.x, p.y) <= 1 + 1e-9, `point outside disk: ${Math.hypot(p.x, p.y)}`);
    close(Math.hypot(pts[0].x - Math.cos(t1), pts[0].y - Math.sin(t1)), 0, 1e-9);
    const last = pts[pts.length - 1];
    close(Math.hypot(last.x - Math.cos(t2), last.y - Math.sin(t2)), 0, 1e-9);
  }
});

test("geodesic dips into the bulk: closest approach matches sec−tan", () => {
  // For span < π the arc's closest point to the origin sits at distance
  // sec(span/2) − tan(span/2) along the bisector.
  const span = Math.PI / 2;
  const t1 = Math.PI / 2 - span / 2, t2 = Math.PI / 2 + span / 2;
  const pts = sampleGeodesic(boundaryGeodesic(t1, t2), 256);
  const minR = Math.min(...pts.map((p) => Math.hypot(p.x, p.y)));
  close(minR, 1 / Math.cos(span / 2) - Math.tan(span / 2), 1e-6);
  close(minR, Math.SQRT2 - 1, 1e-6);
});

test("hyperbolicDistance: standard Poincaré formulas and additivity on a diameter", () => {
  close(hyperbolicDistance({ x: 0, y: 0 }, { x: 0.5, y: 0 }), 2 * Math.atanh(0.5), 1e-12);
  close(hyperbolicDistance({ x: 0.3, y: 0.4 }, { x: 0.3, y: 0.4 }), 0, 1e-12);
  // Collinear points on a diameter: hyperbolic distances add.
  const a = { x: 0, y: 0 }, b = { x: 0.5, y: 0 }, c = { x: 0.9, y: 0 };
  close(hyperbolicDistance(a, b) + hyperbolicDistance(b, c), hyperbolicDistance(a, c), 1e-9);
  assert.throws(() => hyperbolicDistance({ x: 1, y: 0 }, { x: 0, y: 0 }), RangeError);
});

test("diskRadius / hyperbolicRadius are inverse maps", () => {
  for (const rho of [0.5, 1.3, 2.8, 6]) close(hyperbolicRadius(diskRadius(rho)), rho, 1e-12);
});

test("rtEntropy: symmetric, monotone on (0, π], consistent with the geodesic length", () => {
  const eps = 0.01, c = 1;
  close(rtEntropy(Math.PI, { centralCharge: c, regulator: eps }), Math.log(200) / 3, 1e-12);
  // Symmetry under span → 2π − span.
  close(rtEntropy(1.1, { regulator: eps }), rtEntropy(2 * Math.PI - 1.1, { regulator: eps }), 1e-12);
  // Monotone increasing on (0, π].
  let prev = -Infinity;
  for (let i = 1; i <= 10; i++) {
    const s = rtEntropy((i * Math.PI) / 10, { regulator: eps });
    assert.ok(s > prev, `entropy not increasing at span=${(i * Math.PI) / 10}`);
    prev = s;
  }
  // S = (c/6)·L_reg.
  close(rtEntropy(1.4, { centralCharge: 2, regulator: eps }), (2 / 6) * regularizedGeodesicLength(1.4, eps), 1e-12);
  assert.throws(() => regularizedGeodesicLength(0, eps), RangeError);
  assert.throws(() => regularizedGeodesicLength(2 * Math.PI, eps), RangeError);
  assert.throws(() => regularizedGeodesicLength(1, 0), RangeError);
});

test("partitionIntervals: equal spans summing to 2π; zero links → empty", () => {
  assert.deepEqual(partitionIntervals(0), []);
  for (const n of [1, 3, 5, 12]) {
    const ivs = partitionIntervals(n);
    assert.equal(ivs.length, n);
    close(ivs.reduce((s, iv) => s + iv.span, 0), 2 * Math.PI, 1e-12);
    for (const iv of ivs) close(iv.span, (2 * Math.PI) / n, 1e-12);
  }
});

test("entanglementWedge: geodesic and boundary arcs share endpoints", () => {
  const w = entanglementWedge(0.4, 2.9, 24);
  const g0 = w.inner[0], g1 = w.inner[w.inner.length - 1];
  const b0 = w.boundary[0], b1 = w.boundary[w.boundary.length - 1];
  close(Math.hypot(g0.x - b0.x, g0.y - b0.y), 0, 1e-9);
  close(Math.hypot(g1.x - b1.x, g1.y - b1.y), 0, 1e-9);
  assert.equal(w.polygon.length, w.inner.length + w.boundary.length - 2);
});

test("hyperbolicGrid: rings at constant radius, arcs end on the boundary", () => {
  const grid = hyperbolicGrid({ rings: 5, spokes: 12, arcCount: 8 });
  for (const ring of grid.ringPolys) {
    const r = Math.hypot(ring[0].x, ring[0].y);
    for (const p of ring) close(Math.hypot(p.x, p.y), r, 1e-9);
    assert.ok(r < 1);
  }
  for (const arc of grid.arcPolys) {
    close(Math.hypot(arc[0].x, arc[0].y), 1, 1e-9);
    const last = arc[arc.length - 1];
    close(Math.hypot(last.x, last.y), 1, 1e-9);
  }
});

test("adsLabState: deterministic, structurally consistent", () => {
  const a = adsLabState({ links: 5, region: 0.5 });
  const b = adsLabState({ links: 5, region: 0.5 });
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  assert.equal(a.geodesics.length, 5);
  assert.equal(a.boundaryNodes, 5);
  assert.ok(Number.isFinite(a.featured.entropy));
  close(a.featured.span, Math.PI, 1e-12);
  // Clamps: region outside [0.05, 0.95] is clamped, links outside [0, 12] too.
  close(adsLabState({ region: 3 }).region, 0.95, 1e-12);
  assert.equal(adsLabState({ links: 99 }).links, 12);
  assert.equal(adsLabState({ links: -2 }).links, 0);
});

test("export metadata mirrors the lab state and flags the conjecture", () => {
  const meta = adsExportMetadata({ adsLabLinks: 7, adsLabRegion: 0.4 }, { kind: "ads-geometry", geodesics: 7 });
  assert.equal(meta.adsLab.view, ADS_LAB_VIEW_ID);
  assert.equal(meta.adsLab.links, 7);
  assert.equal(meta.adsLab.geodesics ?? meta.adsLab.runtime.geodesics, 7);
  assert.ok(/conjectural/i.test(meta.adsLab.interpretation));
  assert.ok(Number.isFinite(meta.adsLab.featuredEntropy));
  assert.equal(ADS_LAB_DEFAULTS.links, 5);
  assert.equal(wrapAngle(-0.5), 2 * Math.PI - 0.5);
});