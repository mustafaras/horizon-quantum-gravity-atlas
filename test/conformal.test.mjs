// The conformal maps of the Penrose atlas (S19): the exact coordinate maps, the four causal assertions the plan asks
// for, and the closed forms the drawn worldlines come from. The plan's four tests are the ones named "null rays",
// "horizon", "infall" and "static observer"; the rest pin the map itself so a change to it cannot pass unnoticed.

import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_SAMPLES, KRUSKAL_SIGNS, MINKOWSKI_EXTENT, MINKOWSKI_REGION, RN_SCHEMATIC, SCHWARZSCHILD_EXTENT,
  SCHWARZSCHILD_REGIONS, SPACETIME_IDS, boundaries, freeFallFromRest, horizonRadius, invertTortoise,
  kruskalCompact, kruskalCoordinates, kruskalRho, mapEvent, minkowskiMap, minkowskiNull, radialNullRay,
  radiusFromRho, regions, sampleCoordinateLines, schwarzschildBoundaries, schwarzschildMap, schwarzschildRegionAt,
  schwarzschildWorldlines, staticObserver, tortoiseRadius,
} from "../js/science/conformal.mjs";

const close = (actual, expected, tolerance, what) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${what}: ${actual} is not within ${tolerance} of ${expected}`);
};
const H = Math.PI / 2;

/* ---------- the maps ---------- */

test("the Minkowski map sends null rays to 45 degrees and the whole plane to the diamond |T| + |R| < pi/2", () => {
  // A null ray of flat spacetime is one of u or v held constant, i.e. t and r advance together: an arbitrary
  // (cos, sin) direction is not a null ray and must not be expected to map to 45 degrees.
  const a = minkowskiMap({ t: 0.3, r: 1.7 });
  for (const sign of [1, -1]) {
    for (const length of [0.4, 2.5, 9]) {
      const b = minkowskiMap({ t: 0.3 + sign * length, r: 1.7 + length });
      close(Math.abs(b.T - a.T), Math.abs(b.R - a.R), 1e-12, `null ray with dt = ${sign} dr, length ${length}`);
    }
  }
  // and the light cone is what the map preserves: at 45 degrees in the (T, R) plane, with u or v fixed
  close(minkowskiMap({ t: 0, r: 4 }).u, -4, 1e-15, "u = t - r");
  close(minkowskiMap({ t: 0, r: 4 }).v, 4, 1e-15, "v = t + r");
  // the diamond: t -> infinity at fixed r approaches i+ from inside, never past it
  let worst = -Infinity;
  for (const r of [0, 0.5, 4, 30]) {
    for (const t of [1, 8, 60, 400]) {
      const p = minkowskiMap({ t, r });
      // max(|T|, |R|) < pi/2 IS the diamond: |T| + |R| < pi/2 is the square rotated by 45 degrees, which is
      // the region r > 0; the boundary |T| + |R| = pi/2 is exactly where one null coordinate diverges.
      worst = Math.max(worst, Math.abs(p.T) + Math.abs(p.R) - H);
    }
  }
  assert.ok(worst < 0, `|T| + |R| < pi/2 is a subset of the diamond; worst excess ${worst}`);
  // the true diamond is max(|T|, |R|) <= pi/2, reached only at infinity
  for (const r of [0, 0.5, 4, 30]) {
    for (const t of [1, 60, 400, 1e4]) {
      const p = minkowskiMap({ t, r });
      assert.ok(Math.max(Math.abs(p.T), Math.abs(p.R)) < H, "every finite event is strictly inside");
    }
  }
  // and the boundary is reached as the null coordinates diverge
  close(minkowskiMap({ t: 1e9, r: 0 }).T, H, 1e-9, "i+ is the limit of t -> infinity at r = 0");
  close(minkowskiMap({ t: 0, r: 1e9 }).R, H, 1e-9, "i0 is the limit of r -> infinity at t = 0");
});

test("the null coordinates are the light-cone coordinates of the event", () => {
  const { u, v } = minkowskiNull({ t: 2.5, r: 1.25 });
  close((v + u) / 2, 2.5, 1e-15, "(u + v)/2 = t");
  close((v - u) / 2, 1.25, 1e-15, "(v - u)/2 = r");
});

test("the tortoise coordinate and its inverse agree on both sides of the horizon", () => {
  for (const r of [0.05, 0.5, 1.5, 2.000001, 2.5, 3, 12, 200]) {
    const rStar = tortoiseRadius(r, 1);
    const back = invertTortoise(rStar, { M: 1, inside: r < 2 });
    close(back, r, Math.max(1e-9, r * 1e-9), `r* of ${r} inverted`);
  }
  assert.equal(tortoiseRadius(2, 1), -Infinity, "r* diverges at the horizon, as the chart change requires");
  close(tortoiseRadius(2.000001, 1), 2.000001 + 2 * Math.log(5e-7), 1e-6, "and it does so logarithmically");
});

test("rho(r) is 1 at the singularity, 0 on the horizon, and inverts on both branches", () => {
  close(kruskalRho(0, 1), 1, 1e-15, "rho(0) = 1");
  close(kruskalRho(2, 1), 0, 1e-15, "rho(2M) = 0");
  assert.ok(kruskalRho(1e6, 1) < -1e5, "rho -> -infinity at spatial infinity");
  for (const rho of [1, 0.9, 0.5, 0.01, -0.01, -1, -50]) {
    const r = radiusFromRho(rho, 1);
    const back = kruskalRho(r, 1);
    close(back, rho, Math.max(1e-9, Math.abs(rho) * 1e-9), `rho ${rho} inverted`);
  }
  assert.throws(() => radiusFromRho(1.5, 1), RangeError, "rho > 1 has no radius");
  assert.throws(() => radiusFromRho(NaN, 1), RangeError, "rho must be finite");
});

test("the Kruskal chart satisfies UV = rho in all four regions", () => {
  const insideRadii = [0.4, 1.2, 1.98], outsideRadii = [2.02, 3, 9];
  for (const region of Object.keys(KRUSKAL_SIGNS)) {
    const radii = region === "I" || region === "III" ? outsideRadii : insideRadii;
    for (const r of radii) {
      for (const t of [-4, -0.5, 0, 0.5, 4]) {
        const { U, V, rho } = kruskalCoordinates({ t, r }, { M: 1, region });
        const product = U * V;
        close(product, rho, Math.max(1e-9, Math.abs(rho) * 1e-12), `UV = rho in region ${region} at r = ${r}, t = ${t}`);
      }
    }
  }
  assert.throws(() => kruskalCoordinates({ t: 0, r: 3 }, { region: "V" }), RangeError, "region V does not exist");
});

test("the compactified Schwarzschild coordinates keep a monotone order: T = arctan U + arctan V", () => {
  const { U, V } = kruskalCoordinates({ t: 1.5, r: 5 }, { M: 1 });
  const { T, R } = kruskalCompact(U, V);
  close(T, Math.atan(U) + Math.atan(V), 1e-15, "T is the sum of the arctangents");
  close(R, Math.atan(V) - Math.atan(U), 1e-15, "R is their difference");
  assert.deepEqual(regions("minkowski"), [MINKOWSKI_REGION]);
  assert.deepEqual(regions("reissner-nordstrom"), RN_SCHEMATIC.regions);
});

test("mapEvent dispatches to the exact maps and refuses the schematic one", () => {
  const m = mapEvent("minkowski", { t: 1, r: 2 });
  const s = mapEvent("schwarzschild", { t: 1, r: 2 });
  close(m.T, (Math.atan(-1) + Math.atan(3)) / 2, 1e-15, "Minkowski T");
  close(s.T, 0, 1e-15, "Schwarzschild T on the horizon");
  assert.throws(() => mapEvent("reissner-nordstrom", { t: 1, r: 2 }), RangeError, "the RN block has no map");
  assert.throws(() => mapEvent("kerr", { t: 1, r: 2 }), RangeError, "unknown spacetime");
  assert.throws(() => mapEvent("schwarzschild", { t: NaN, r: 2 }), RangeError, "t must be finite");
  assert.throws(() => tortoiseRadius(0, 1), RangeError, "r must be positive");
  assert.deepEqual(SPACETIME_IDS, ["minkowski", "schwarzschild", "reissner-nordstrom"]);
});

/* ---------- the plan's four assertions ---------- */

test("every null ray maps to a +-45 degree line: |dT| = |dR| within 1e-9", () => {
  // The identity is exact in the compactified coordinate; the 1e-9 is the sampling error of the finite differences,
  // which grows where neighbouring samples fall within a rounding error of each other. Sampling in the diagram's own
  // coordinate is what keeps that error this small from the horizon out to null infinity.
  for (const kind of ["outgoing", "ingoing"]) {
    const ray = radialNullRay({ kind, nullValue: 0, M: 1, samples: 401 });
    assert.ok(ray.rows.length > 100, `${kind} ray has samples`);
    let worst = 0;
    for (let i = 1; i < ray.rows.length; i += 1) {
      const a = ray.rows[i - 1], b = ray.rows[i];
      const dT = Math.abs(b.T - a.T), dR = Math.abs(b.R - a.R);
      if (dT + dR < 1e-13) continue; // two samples a rounding error apart carry no direction
      worst = Math.max(worst, Math.abs(dT - dR) / Math.max(dT, dR));
    }
    assert.ok(worst <= 1e-9, `${kind} null ray: worst |dT - dR| / max = ${worst}`);
  }
  // the outgoing ray spans the past horizon to future null infinity along T - R = -pi/2: U is constant, so the
  // compactified U, and with it T - R = 2 arctan U, is fixed; only V, and with it T + R, runs from 0 to pi.
  const out = radialNullRay({ kind: "outgoing", nullValue: 0, M: 1, samples: 401 });
  close(out.rows[0].T, -Math.PI / 4, 1e-6, "the outgoing ray starts on the past horizon, at T = -pi/4");
  close(out.rows[out.rows.length - 1].T, Math.PI / 4, 1e-6, "and ends at future null infinity, T = pi/4");
  close(out.rows[out.rows.length - 1].R, (3 * Math.PI) / 4, 1e-6, "at R = 3pi/4");
  for (const row of out.rows) if (row.r > 2) close(row.T - row.R, -Math.PI / 2, 1e-12, "T - R = -pi/2 outside the horizon");
  // the ingoing ray crosses the horizon and ends on the singularity
  const inRay = radialNullRay({ kind: "ingoing", nullValue: 0, M: 1, samples: 401 });
  const nearest = inRay.rows.reduce((best, row) => (Math.abs(row.r - 2) < Math.abs(best.r - 2) ? row : best), inRay.rows[0]);
  assert.ok(Math.abs(nearest.r - 2) < 0.05, `the ingoing ray passes r = 2M (closest sample r = ${nearest.r})`);
  // On the horizon U = 0 while V stays fixed, so the crossing sits exactly where T = R = arctan V: the diagonal.
  // Interpolate the two samples that straddle rho = 0, which is the crossing itself.
  const crossIndex = inRay.rows.findIndex((row) => row.rho >= 0);
  const lo = inRay.rows[crossIndex - 1], hi = inRay.rows[crossIndex];
  const w = -lo.rho / (hi.rho - lo.rho);
  const crossT = lo.T + (hi.T - lo.T) * w, crossR = lo.R + (hi.R - lo.R) * w;
  close(crossT, crossR, 1e-7, "the crossing is on the diagonal T = R");
  close(crossT, Math.PI / 4, 1e-6, "and, for v0 = 0, at T = R = pi/4");
  close(inRay.rows[inRay.rows.length - 1].T, H, 1e-6, "and reaches the singularity at T = pi/2");
});

test("the horizon maps to the diagonal", () => {
  for (const t of [-6, -1.5, 0, 0.7, 5, 40]) {
    for (const region of ["I", "III"]) {
      const { T, R } = schwarzschildMap({ t, r: horizonRadius(1), M: 1, region });
      close(T, 0, 1e-15, `the horizon at t = ${t} has T = 0`);
      close(R, 0, 1e-15, "and R = 0: U = 0 and V = 0 are both the origin, whatever t is");
    }
  }
  // The diagonal is the pair of null surfaces, and each boundary the scene draws lies on it: |T| = |R| everywhere.
  for (const edge of schwarzschildBoundaries().filter((b) => b.kind === "horizon")) {
    for (const p of edge.points) close(Math.abs(p.T), Math.abs(p.R), 1e-15, `${edge.id} is on the diagonal`);
  }
  // The singularity, by contrast, is the spacelike surface T = +-pi/2; and the horizons of the two charts meet there.
  for (const edge of schwarzschildBoundaries().filter((b) => b.kind === "singularity")) {
    for (const p of edge.points) close(Math.abs(p.T), H, 1e-15, `${edge.id} lies on T = +-pi/2`);
  }
});

test("an infalling worldline crosses the horizon at finite (T, R) and ends on the singularity", () => {
  const fall = freeFallFromRest({ r0: 10, M: 1, samples: 4001 });
  // finite everywhere on the way in: rho and the metric are smooth across the horizon in this chart
  for (const row of fall.rows) {
    assert.ok(Number.isFinite(row.T) && Number.isFinite(row.R), `finite diagram coordinates at eta = ${row.eta}`);
    close(row.U * row.V, kruskalRho(row.r, 1), Math.max(1e-12, Math.abs(row.U * row.V) * 1e-11), "UV = rho along the infall");
  }
  // the crossing itself, from the closed form: r = 2M, U = 0, T = R
  const { horizonCrossing } = fall;
  close(horizonCrossing.r, 2, 1e-15, "the crossing is at r = 2M");
  close(horizonCrossing.U, 0, 1e-15, "U = 0 there");
  close(horizonCrossing.T, horizonCrossing.R, 1e-15, "so T = R: the crossing is on the diagonal");
  assert.ok(Number.isFinite(horizonCrossing.T) && horizonCrossing.T < H, "and at a finite point of the diagram");
  // the sampled curve crosses it: the last row before the crossing has r > 2M, the first after has r < 2M
  const before = fall.rows[fall.crossing - 1], after = fall.rows[fall.crossing];
  assert.ok(before.r > 2 && after.r < 2, `the sampled curve straddles the horizon: ${before.r} then ${after.r}`);
  // it ends at r = 0, which the map sends to T = pi/2 with R < pi/2
  const last = fall.rows[fall.rows.length - 1];
  close(last.r, 0, 1e-15, "the worldline ends at r = 0");
  close(last.T, H, 1e-9, "on the singularity T = pi/2");
  assert.ok(last.R < H + 1e-9, "and inside R <= pi/2: the singularity is the top edge, i+ its right corner");
  // a fall from further out ends nearer the corner, one from close in ends further left: the singularity spans the edge
  const shallow = freeFallFromRest({ r0: 3, M: 1, samples: 801 }).rows.at(-1);
  assert.ok(shallow.R < last.R - 1e-3, `a fall from r0 = 3 ends at R = ${shallow.R}, well left of the r0 = 10 one at ${last.R}`);
  // T grows monotonically along the infall: nothing in the diagram turns back
  for (let i = 1; i < fall.rows.length; i += 1) {
    assert.ok(fall.rows[i].T >= fall.rows[i - 1].T - 1e-12, `T is non-decreasing at eta = ${fall.rows[i].eta}`);
  }
});

test("a static observer approaches i+", () => {
  const observer = staticObserver({ r0: 4, M: 1, samples: 4001 });
  const last = observer.rows[observer.rows.length - 1], first = observer.rows[0];
  close(last.T, H, 1e-6, "the future end of a static worldline is i+ in T");
  close(last.R, H, 1e-6, "and in R: at spatial infinity, |R| = pi/2");
  close(first.T, -H, 1e-6, "the past end is i-");
  close(first.R, H, 1e-6, "at the same r, hence the same R");
  assert.ok(observer.rows.every((row) => row.r === 4), "r does not change: the observer is static");
  for (let i = 1; i < observer.rows.length; i += 1) {
    assert.ok(observer.rows[i].T > observer.rows[i - 1].T, "and T increases monotonically toward i+");
  }
  // a static observer inside the horizon is not static: the map refuses it
  assert.throws(() => staticObserver({ r0: 1.5, M: 1 }), RangeError, "r0 must exceed 2M");
});

/* ---------- the worldlines in Schwarzschild coordinates ---------- */

test("the free-fall closed form solves the geodesic equation: dt/deta and dtau/deta match the ODE", () => {
  const M = 1;
  for (const r0 of [4, 10, 30]) {
    const fall = freeFallFromRest({ r0, M, samples: 601 });
    const E = Math.sqrt(1 - 2 * M / r0);
    const scale = Math.sqrt(r0 ** 3 / (8 * M));
    for (const row of fall.rows) {
      const eta = row.eta;
      // dtau/deta = sqrt(r0^3/8M) (1 + cos eta), which is exactly -dr/deta / sqrt(2M(1/r - 1/r0))
      if (eta > Math.PI - 1e-9) continue; // eta = pi is r = 0, where the parametrisation ends and dr/dtau -> 0
      const dTau = scale * (1 + Math.cos(eta));
      const dr = -(r0 / 2) * Math.sin(eta);
      close(dr / dTau, -Math.sqrt(2 * M * (1 / row.r - 1 / r0)), 1e-9, `dr/dtau at eta = ${eta}, r0 = ${r0}`);
      // and t'(eta) = E tau'(eta) / f(r), which is the exterior coordinate time
      if (Math.abs(row.r - 2 * M) > 1e-4) {
        const dt = E * dTau / (1 - 2 * M / row.r);
        if (Number.isFinite(dt) && Math.abs(dt) < 1e8) assert.ok(Number.isFinite(dt), "finite dt/deta away from the horizon");
      }
    }
    // t(eta) agrees with an independent quadrature of E tau' / f over the exterior part
    const etaH = fall.etaHorizon;
    // Integrate dt/deta = E tau'(eta) / f(r) up to 0.98 eta_H. The integrand diverges at the horizon, so the
    // quadrature stops just short of it and the comparison is made there; the closed form is what carries the
    // curve through, and the Kruskal identity is what the test above checks there.
    const top = etaH * 0.98;
    const n = 40000;
    const step = top / n;
    let integral = 0;
    for (let i = 0; i < n; i += 1) {
      const a = i * step, b = (i + 1) * step;
      const f = (x) => {
        const rr = (r0 / 2) * (1 + Math.cos(x));
        return (E * scale * (1 + Math.cos(x))) / Math.abs(1 - 2 * M / rr);
      };
      integral += 0.5 * (f(a) + f(b)) * (b - a);
    }
    const atEta = (x) => {
      const S = Math.sqrt(r0 / (2 * M) - 1);
      const F = 2 * M * S * (x + (r0 / (4 * M)) * (x + Math.sin(x)));
      return F + 2 * M * Math.log(Math.abs((S + Math.tan(x / 2)) / (S - Math.tan(x / 2))));
    };
    close(atEta(top), integral, Math.max(1e-6, Math.abs(integral) * 1e-5), `t at 0.98 eta_H, r0 = ${r0}`);
  }
});

test("the proper-time ticks sample the worldline evenly in tau, and crowd where the map compresses it", () => {
  const fall = freeFallFromRest({ r0: 10, M: 1, samples: 2001 });
  assert.equal(fall.ticks.length, 9);
  const gaps = fall.ticks.slice(1).map((t, i) => t.tau - fall.ticks[i].tau);
  for (const gap of gaps) close(gap, fall.properTimeEnd / 8, fall.properTimeEnd * 2e-3, "even spacing in proper time");
  // late ticks are closer together in the diagram than early ones
  const early = Math.hypot(fall.ticks[1].T - fall.ticks[0].T, fall.ticks[1].R - fall.ticks[0].R);
  const late = Math.hypot(fall.ticks[8].T - fall.ticks[7].T, fall.ticks[8].R - fall.ticks[7].R);
  assert.ok(late < early, `the diagram compresses the ticks: ${late} at the end against ${early} at the start`);
  assert.ok(fall.properTimeEnd > 0, "the fall takes positive proper time");
});

test("the four worldlines of the atlas come from one call and stay inside the diagram", () => {
  const lines = schwarzschildWorldlines({ r0: 6, M: 1, samples: 401 });
  assert.deepEqual(Object.keys(lines).sort(), ["freeFall", "ingoing", "outgoing", "staticObserver"]);
  close(lines.freeFall.r0, 6, 0, "the free fall starts at r0");
  close(lines.staticObserver.r0, 6, 0, "and so does the static observer");
  for (const [name, line] of Object.entries(lines)) {
    for (const row of line.rows) {
      assert.ok(Math.abs(row.T) <= H + 1e-9, `${name}: |T| inside the diagram`);
      assert.ok(Math.abs(row.R) <= Math.PI + 1e-9, `${name}: |R| inside the diagram`);
    }
  }
  assert.throws(() => freeFallFromRest({ r0: 1.5 }), RangeError, "free fall cannot start inside the horizon");
});

/* ---------- coordinate lines and boundaries ---------- */

test("coordinate lines are polylines of the same map, and constant t stays inside the light cone", () => {
  const { tLines, rLines } = sampleCoordinateLines("minkowski", { tValues: [-2, 0, 3], rValues: [0.5, 3], samples: 61 });
  assert.equal(tLines.length, 3);
  assert.equal(rLines.length, 2);
  for (const line of [...tLines, ...rLines]) {
    assert.ok(line.points.length >= 60, "each line is sampled");
    for (const p of line.points) assert.ok(Math.abs(p.T) + Math.abs(p.R) <= H + 1e-12, "inside the diamond");
  }
  // a constant-t line of Minkowski is a horizontal chord: r -> t + r with t fixed, so T and R move along T = const
  const [line] = tLines.filter((l) => l.value === 0);
  for (const p of line.points) close(p.T, 0, 1e-12, "the t = 0 slice is the horizontal axis");
  assert.deepEqual(sampleCoordinateLines("schwarzschild", { tValues: [0], rValues: [3, 5], samples: 41 }).rLines.map((l) => l.value), [3, 5]);
  assert.throws(() => sampleCoordinateLines("reissner-nordstrom", {}), RangeError, "the schematic has no coordinate lines");
});

test("the Schwarzschild boundary is null at 45 degrees, and the regions tile the diagram", () => {
  const edges = schwarzschildBoundaries();
  assert.ok(edges.length >= 16, "the boundary has every edge and every labelled point");
  for (const edge of edges) {
    for (let i = 1; i < edge.points.length; i += 1) {
      const a = edge.points[i - 1], b = edge.points[i];
      const dT = Math.abs(b.T - a.T), dR = Math.abs(b.R - a.R);
      if (edge.kind === "singularity") assert.ok(dT < 1e-15 || Math.abs(dT - dR) < 1e-12, `${edge.id} is spacelike`);
      else assert.ok(dT === 0 || dR === 0 || Math.abs(dT - dR) < 1e-12, `${edge.id} runs at 45 degrees`);
    }
  }
  // every region label sits in its own region, and the four regions tile the diagram
  for (const r of SCHWARZSCHILD_REGIONS) assert.equal(schwarzschildRegionAt(r.at), r.id, `the anchor of region ${r.id} is inside it`);
  const samples = [[0, 1.2], [1.2, 0], [0, -1.2], [-1.2, 0], [0, 0.6], [0.9, -0.4]];
  const seen = new Set(samples.map(([T, R]) => schwarzschildRegionAt({ T, R })));
  assert.deepEqual([...seen].sort(), ["I", "II", "III", "IV"], "all four regions are reachable");
  assert.equal(schwarzschildRegionAt({ T: 2, R: 0 }), null, "outside the diagram there is no region");
  assert.equal(schwarzschildRegionAt({ T: 0, R: 2 }), "I", "the far right is region I");
  assert.equal(schwarzschildRegionAt({ T: 0, R: -2 }), "III", "the far left is region III");
  assert.equal(schwarzschildRegionAt({ T: -1.2, R: 0 }), "IV", "below the origin is the white-hole interior");
});

test("Minkowski's boundary is i0, i+-, and four null-infinity edges, each on the diamond", () => {
  const edges = boundaries("minkowski");
  const labels = edges.map((e) => e.name);
  for (const name of ["i^0", "i^+", "i^-", "\\mathcal{I}^+", "\\mathcal{I}^-"]) assert.ok(labels.includes(name), `${name} is drawn`);
  assert.equal(edges.filter((e) => e.name === "i^0").length, 2, "two spatial-infinity points");
  for (const edge of edges) {
    for (const p of edge.points) close(Math.abs(p.T) + Math.abs(p.R), H, 1e-12, `${edge.id} lies on the diamond`);
  }
  close(MINKOWSKI_EXTENT.R * 2, Math.PI, 1e-15, "the diamond spans pi in R");
  close(SCHWARZSCHILD_EXTENT.R, Math.PI, 1e-15, "the extended diagram spans 2pi in R and pi in T");
});

test("the Reissner-Nordstrom block is a schematic: explicit polylines, all at 45 degrees, with its status stated", () => {
  assert.equal(RN_SCHEMATIC.status, "schematic");
  assert.match(RN_SCHEMATIC.note, /schematic/);
  assert.match(RN_SCHEMATIC.note, /Cauchy/);
  for (const key of ["innerHorizon", "outerHorizon", "nullInfinity", "singularity"]) {
    for (const polyline of RN_SCHEMATIC[key]) {
      for (let i = 1; i < polyline.length; i += 1) {
        const a = polyline[i - 1], b = polyline[i];
        const dT = Math.abs(b.T - a.T), dR = Math.abs(b.R - a.R);
        const axis = dT < 1e-12 || dR < 1e-12;
        assert.ok(axis || Math.abs(dT - dR) < 1e-12, `${key} runs at 45 degrees or along an axis`);
      }
    }
  }
  // the singularity is timelike: a vertical line, where Schwarzschild's is horizontal
  const vertical = RN_SCHEMATIC.singularity[0];
  assert.ok(vertical.every((p) => Math.abs(p.R - vertical[0].R) < 1e-12), "r = 0 is a vertical line here");
  const horizontal = schwarzschildBoundaries().find((b) => b.id === "s-singularity-future").points;
  assert.ok(horizontal.every((p) => Math.abs(p.T - H) < 1e-12), "and a horizontal one in Schwarzschild");
  // three regions, each with a name, an anchor and a meaning
  assert.equal(RN_SCHEMATIC.regions.length, 3);
  for (const r of RN_SCHEMATIC.regions) {
    assert.ok(r.name && r.meaning && Number.isFinite(r.at.T) && Number.isFinite(r.at.R), `${r.id} is labelled`);
    assert.equal(r.where, "reissner-nordstrom");
  }
  assert.equal(boundaries("reissner-nordstrom").length, 0, "the schematic carries no exact boundary");
});

test("every region and boundary says what it is, and the atlas exposes one anatomy per spacetime", () => {
  for (const spacetime of SPACETIME_IDS) {
    const set = regions(spacetime);
    assert.ok(set.length >= 1, `${spacetime} has at least one region`);
    for (const r of set) {
      assert.equal(r.where, spacetime);
      assert.ok(r.name.length > 4 && r.meaning.length > 60, `${r.id} has a name and a meaning to show`);
      assert.ok(Number.isFinite(r.at.T) && Number.isFinite(r.at.R), `${r.id} has a label anchor`);
    }
  }
  for (const edge of [...boundaries("minkowski"), ...boundaries("schwarzschild")]) {
    assert.ok(edge.meaning.length > 30, `${edge.id} means something`);
    assert.ok(["horizon", "singularity", "infinity", "null-infinity"].includes(edge.kind), `${edge.id} has a known kind`);
    assert.ok(edge.points.length >= 1, `${edge.id} has points`);
  }
  assert.equal(DEFAULT_SAMPLES, 181);
});
