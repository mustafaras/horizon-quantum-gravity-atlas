/**
 * Conformal (Penrose) maps of the spacetimes of the GR view (S19). Free of DOM and three.js, so Node tests them.
 *
 * Every point of a diagram is the image of a point of the spacetime under an explicit coordinate map; nothing on the
 * picture is drawn by hand:
 *
 *   Minkowski      u = t - r, v = t + r, U = arctan u, V = arctan v, T = (U + V)/2, R = (V - U)/2
 *   Schwarzschild  Kruskal-Szekeres U, V from the tortoise r* = r + 2M ln|r/2M - 1|, then compactified with arctan:
 *                  T = arctan U + arctan V, R = arctan V - arctan U. The compactification carries no factor 1/2; that
 *                  is what puts the r = 0 singularity on T = +-pi/2 while the horizon stays on T = +-R.
 *   Reissner-      explicit polylines with the status of a labelled SCHEMATIC: the exact geometry is an infinite chain
 *   Nordstrom      of blocks around a timelike singularity and this module does not compute it (RN_SCHEMATIC.status).
 *
 * A conformal map scales the metric by a positive factor and so leaves every null direction at 45 degrees. Both maps
 * apply the same monotone function (arctan) to the two null coordinates, so a null ray maps to a straight
 * +-45-degree line exactly rather than approximately; test/conformal.test.mjs checks |dT| = |dR| to 1e-9.
 *
 * The Kruskal coordinates satisfy UV = rho(r) = (1 - r/2M) e^(r/2M) in every region of the maximal extension, with
 * rho = 1 at r = 0, rho = 0 on the horizon and rho -> -infinity as r -> infinity. That identity is what carries the
 * chart through the horizon, and every worldline below is written in terms of it rather than of t.
 *
 * The Killing field d/dt of the extension is K = -(U/4M) d/dU + (V/4M) d/dV, one smooth field for the whole manifold:
 * timelike in regions I and III, spacelike in the interiors II and IV. Its flow carries region I onto region III
 * through the isometry (U, V) -> (-U, -V), so the time arrow of region III is the image of region I's (ledger D-114).
 *
 * Units: G = c = 1; M is a length, r and t are lengths, tau is a length. M defaults to 1.
 */

export const SPACETIME_IDS = Object.freeze(["minkowski", "schwarzschild", "reissner-nordstrom"]);

function assertSpacetime(id) {
  if (!SPACETIME_IDS.includes(id)) throw new RangeError(`conformal: unknown spacetime "${id}" (known: ${SPACETIME_IDS.join(", ")})`);
  return id;
}

/** T = (U + V)/2, R = (V - U)/2 from two compactified null coordinates. */
export function halfSum(U, V) {
  return { T: (U + V) / 2, R: (V - U) / 2 };
}

/* ---------- Minkowski ---------- */

/**
 * Null coordinates of a Minkowski event: u = t - r, v = t + r.
 *
 * `r` is the SIGNED spatial coordinate of the 1+1-dimensional chart, which is what makes the conformal diagram the full
 * diamond: with r >= 0 only, constant-t lines would cover the right half only and the left i0 would not exist. The same
 * convention gives the constant-r lines their familiar hyperbola shape, since r^2 = x^2 is what a fixed radius means
 * in 1+1 dimensions (ledger D-116).
 */
export function minkowskiNull({ t, r }) {
  if (!Number.isFinite(t) || !Number.isFinite(r)) throw new RangeError("minkowski: t and r must be finite numbers");
  return { u: t - r, v: t + r };
}

/** The conformal coordinates of a Minkowski event, and the null coordinates it came from. */
export function minkowskiMap({ t, r }) {
  const { u, v } = minkowskiNull({ t, r });
  const U = Math.atan(u), V = Math.atan(v);
  return { ...halfSum(U, V), U, V, u, v };
}

/** The Minkowski diamond: |T + R| < pi/2 and |T - R| < pi/2, i.e. |T| + |R| < pi/2. */
export const MINKOWSKI_EXTENT = Object.freeze({ T: Math.PI / 2, R: Math.PI / 2 });

/* ---------- Schwarzschild ---------- */

export const horizonRadius = (M = 1) => 2 * M;

/** The tortoise coordinate r* = r + 2M ln|r/2M - 1|, defined for every r > 0 and negative inside the horizon. */
export function tortoiseRadius(r, M = 1) {
  if (!(r > 0) || !Number.isFinite(r)) throw new RangeError(`schwarzschild: r must be a positive finite length, received ${r}`);
  return r + 2 * M * Math.log(Math.abs(r / (2 * M) - 1));
}

/** rho(r) = (1 - r/2M) e^(r/2M) = U V: 1 at the singularity, 0 on the horizon, -infinity at spatial infinity. */
export function kruskalRho(r, M = 1) {
  return (1 - r / (2 * M)) * Math.exp(r / (2 * M));
}

/**
 * r from rho. rho decreases strictly from 1 at r = 0 through 0 at r = 2M to -infinity, on both branches, so one
 * bisection serves both: rho > 0 lies inside the horizon (r < 2M), rho < 0 outside it.
 */
export function radiusFromRho(rho, M = 1) {
  if (!Number.isFinite(rho) || rho > 1) throw new RangeError(`schwarzschild: rho must be finite and at most 1, received ${rho}`);
  if (rho === 1) return 0;
  const inside = rho > 0;
  let lo = inside ? 0 : 2 * M;
  let hi = inside ? 2 * M : 4 * M;
  if (!inside) while (kruskalRho(hi, M) > rho) hi *= 2;
  for (let i = 0; i < 240; i += 1) {
    const mid = (lo + hi) / 2;
    if (kruskalRho(mid, M) > rho) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** r from the tortoise coordinate. r* is not injective (r*(0) = 0 and r*(2M⁻) = −∞), so the branch is explicit. */
export function invertTortoise(rStar, { M = 1, inside = false } = {}) {
  if (!Number.isFinite(rStar)) throw new RangeError("schwarzschild: r* must be finite");
  const magnitude = Math.exp(rStar / (2 * M));
  return radiusFromRho(inside ? magnitude : -magnitude, M);
}

/**
 * The sign each Kruskal coordinate carries in each region, fixed by UV = rho: rho < 0 outside the horizon (one sign
 * each) and 0 < rho <= 1 inside it (the same sign twice).
 */
export const KRUSKAL_SIGNS = Object.freeze({
  I: Object.freeze([-1, 1]),   // r > 2M, the exterior
  II: Object.freeze([1, 1]),   // r < 2M, the future interior: U crosses zero at the future horizon
  III: Object.freeze([1, -1]), // r > 2M, the mirror exterior
  IV: Object.freeze([-1, -1]), // r < 2M, the past interior
});

/** The Kruskal-Szekeres coordinates of a Schwarzschild event in the chart of one region. */
export function kruskalCoordinates({ t, r }, { M = 1, region = "I" } = {}) {
  const signs = KRUSKAL_SIGNS[region];
  if (!signs) throw new RangeError(`schwarzschild: region must be one of ${Object.keys(KRUSKAL_SIGNS).join(", ")}, received ${region}`);
  if (!Number.isFinite(t)) throw new RangeError("schwarzschild: t must be finite");
  const rho = kruskalRho(r, M);
  const a = Math.sqrt(Math.abs(rho));
  return { U: signs[0] * a * Math.exp(-t / (4 * M)), V: signs[1] * a * Math.exp(t / (4 * M)), rho, region };
}

/** The Schwarzschild compactification: arctan of each Kruskal coordinate, no factor 1/2. */
export function kruskalCompact(U, V) {
  const Uc = Math.atan(U), Vc = Math.atan(V);
  return { T: Uc + Vc, R: Vc - Uc, U: Uc, V: Vc };
}

/** A Schwarzschild event in the compactified diagram. */
export function schwarzschildMap({ t, r, M = 1, region = "I" }) {
  const { U, V, rho } = kruskalCoordinates({ t, r }, { M, region });
  return { ...kruskalCompact(U, V), U, V, rho };
}

/** The exact map of a spacetime: mapEvent(id, { t, r, M, region }) -> { T, R }. */
export function mapEvent(spacetime, event) {
  switch (assertSpacetime(spacetime)) {
    case "minkowski": return minkowskiMap(event);
    case "schwarzschild": return schwarzschildMap(event);
    default: throw new RangeError("conformal: the Reissner-Nordstrom block is schematic and has no coordinate map");
  }
}

/** The extent of the maximally extended Schwarzschild diagram: T in [-pi/2, pi/2], R in [-pi, pi]. */
export const SCHWARZSCHILD_EXTENT = Object.freeze({ T: Math.PI / 2, R: Math.PI });

/* ---------- regions ---------- */

const region = (id, name, where, T, R, meaning) => Object.freeze({
  id, name, where, at: Object.freeze({ T, R }), meaning,
});

/**
 * The four regions of the maximal extension, each with a point inside it and what the focus overlay says. The
 * inequalities that define them are REGION_TESTS below, and the polygons the scene fills are the same regions.
 */
export const SCHWARZSCHILD_REGIONS = Object.freeze([
  region("I", "Region I: the exterior", "schwarzschild", 0, 1.2,
    "r > 2M. Where a static observer can sit, and the only part of the geometry a distant astronomer sees. A signal sent from here can reach infinity."),
  region("II", "Region II: the black-hole interior", "schwarzschild", 1.2, 0,
    "r < 2M. The radial coordinate is a time here: every worldline inside moves toward r = 0. The horizon is a one-way surface, not a place."),
  region("III", "Region III: the other exterior", "schwarzschild", 0, -1.2,
    "r > 2M again, reached only through the interior. A parallel universe of the maximal extension, and not part of the collapse of a real star."),
  region("IV", "Region IV: the white-hole interior", "schwarzschild", -1.2, 0,
    "r < 2M, but the past interior: every worldline leaves it through the past horizon. The time reverse of region II."),
]);

export const MINKOWSKI_REGION = region("M", "Minkowski spacetime", "minkowski", 0, 0,
  "Flat spacetime on its own causal diamond. Every geodesic is a straight line, every null ray is at 45 degrees, and the boundary is infinity itself.");

/**
 * Which region of the maximally extended diagram a point of the diagram lies in, or null outside it. The four regions
 * are the four wedges between the horizons T = +-R: I is {R > |T|}, II {T > |R|}, III {R < -|T|}, IV {T < -|R|}.
 */
export function schwarzschildRegionAt({ T, R }) {
  if (!(Math.abs(T) <= Math.PI / 2 && Math.abs(R) <= Math.PI)) return null;
  return Math.abs(T) > Math.abs(R) ? (T > 0 ? "II" : "IV") : (R > 0 ? "I" : "III");
}

/* ---------- boundaries ---------- */

const point = (T, R) => Object.freeze({ T, R });

function segment(T0, R0, T1, R1, n = 33) {
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const s = n === 1 ? 0 : i / (n - 1);
    out.push(point(T0 + (T1 - T0) * s, R0 + (R1 - R0) * s));
  }
  return Object.freeze(out);
}

const boundary = (id, name, kind, where, points, meaning) => Object.freeze({
  id, name, kind, where, points, meaning,
});

const H = Math.PI / 2;

/** The boundary of the Minkowski diamond: i0, i+-, and four null-infinity edges. */
export function minkowskiBoundaries() {
  return Object.freeze([
    boundary("m-i0-right", "i^0", "infinity", "minkowski", Object.freeze([point(0, H)]), "Spatial infinity: r -> infinity at finite t, a single point of the conformal diagram."),
    boundary("m-i0-left", "i^0", "infinity", "minkowski", Object.freeze([point(0, -H)]), "Spatial infinity of the other direction."),
    boundary("m-i-plus", "i^+", "infinity", "minkowski", Object.freeze([point(H, 0)]), "Future timelike infinity: where every inertial observer ends up."),
    boundary("m-i-minus", "i^-", "infinity", "minkowski", Object.freeze([point(-H, 0)]), "Past timelike infinity: where every inertial observer came from."),
    boundary("m-scri-plus-right", "\\mathcal{I}^+", "null-infinity", "minkowski", segment(0, H, H, 0), "Future null infinity, upper right: where outgoing light rays end. V = pi/2 along this edge."),
    boundary("m-scri-plus-left", "\\mathcal{I}^+", "null-infinity", "minkowski", segment(0, -H, H, 0), "Future null infinity, upper left. U = pi/2 along this edge."),
    boundary("m-scri-minus-right", "\\mathcal{I}^-", "null-infinity", "minkowski", segment(-H, 0, 0, H), "Past null infinity, lower right: where ingoing light rays begin."),
    boundary("m-scri-minus-left", "\\mathcal{I}^-", "null-infinity", "minkowski", segment(-H, 0, 0, -H), "Past null infinity, lower left."),
  ]);
}

/**
 * The boundary of the extended Schwarzschild diagram, read off the map. U = 0 and V = 0 (the horizons) arctan to
 * T = +-R; UV = 1 (the singularity) arctan to T = +-pi/2 with |R| <= pi/2.
 *
 * Region I is {R > |T|}, region II {T > |R|}, region III {R < -|T|}, region IV {T < -|R|}.
 */
export function schwarzschildBoundaries() {
  return Object.freeze([
    boundary("s-horizon-I-II", "H^+", "horizon", "schwarzschild", segment(0, 0, H, H), "Future horizon between regions I and II: r = 2M, a null surface at exactly 45 degrees."),
    boundary("s-horizon-IV-I", "H^-", "horizon", "schwarzschild", segment(0, 0, -H, H), "Past horizon between regions IV and I."),
    boundary("s-horizon-III-II", "H^+", "horizon", "schwarzschild", segment(0, 0, H, -H), "Future horizon between regions III and II."),
    boundary("s-horizon-IV-III", "H^-", "horizon", "schwarzschild", segment(0, 0, -H, -H), "Past horizon between regions IV and III."),
    boundary("s-singularity-future", "r=0", "singularity", "schwarzschild", segment(H, -H, H, H), "The future singularity: spacelike, at r = 0, and the end of every worldline inside the horizon."),
    boundary("s-singularity-past", "r=0", "singularity", "schwarzschild", segment(-H, -H, -H, H), "The past singularity of the white-hole region."),
    boundary("s-i0-right", "i^0", "infinity", "schwarzschild", Object.freeze([point(0, Math.PI)]), "Spatial infinity of region I: where r goes to infinity at finite t, the far right corner of the diagram."),
    boundary("s-i0-left", "i^0", "infinity", "schwarzschild", Object.freeze([point(0, -Math.PI)]), "Spatial infinity of region III, the far left corner of the diagram."),
    boundary("s-i-plus-right", "i^+", "infinity", "schwarzschild", Object.freeze([point(H, H)]), "Future timelike infinity of region I: where a static observer ends up."),
    boundary("s-i-minus-right", "i^-", "infinity", "schwarzschild", Object.freeze([point(-H, H)]), "Past timelike infinity of region I."),
    // Region III is the image of region I under (U, V) -> (-U, -V), which sends (T, R) -> (-T, -R) and reverses the
    // sense of the Killing field: the future of region III is the mirror of the future of region I (ledger D-114).
    boundary("s-i-plus-left", "i^+", "infinity", "schwarzschild", Object.freeze([point(-H, -H)]), "Future timelike infinity of region III, the mirror of region I's."),
    boundary("s-i-minus-left", "i^-", "infinity", "schwarzschild", Object.freeze([point(H, -H)]), "Past timelike infinity of region III."),
    boundary("s-scri-plus-right", "\\mathcal{I}^+", "null-infinity", "schwarzschild", segment(0, Math.PI, H, H), "Future null infinity of region I, from i0 to i+."),
    boundary("s-scri-minus-right", "\\mathcal{I}^-", "null-infinity", "schwarzschild", segment(-H, H, 0, Math.PI), "Past null infinity of region I, from i- to i0."),
    boundary("s-scri-plus-left", "\\mathcal{I}^+", "null-infinity", "schwarzschild", segment(0, -Math.PI, -H, -H), "Future null infinity of region III, from i0 to i+."),
    boundary("s-scri-minus-left", "\\mathcal{I}^-", "null-infinity", "schwarzschild", segment(H, -H, 0, -Math.PI), "Past null infinity of region III, from i- to i0."),
  ]);
}

/** The boundaries of a spacetime. The Reissner-Nordstrom block carries its own in RN_SCHEMATIC. */
export function boundaries(spacetime) {
  switch (assertSpacetime(spacetime)) {
    case "minkowski": return minkowskiBoundaries();
    case "schwarzschild": return schwarzschildBoundaries();
    default: return Object.freeze([]);
  }
}

/** The regions a diagram reports on, for hover and keyboard focus. */
export function regions(spacetime) {
  switch (assertSpacetime(spacetime)) {
    case "minkowski": return Object.freeze([MINKOWSKI_REGION]);
    case "schwarzschild": return SCHWARZSCHILD_REGIONS;
    default: return RN_SCHEMATIC.regions;
  }
}

/* ---------- coordinate lines ---------- */

/**
 * How far a constant-r line runs in t before the map saturates: arctan is within e^-18 of its limit past 18, and the
 * Kruskal coordinate moves by e^(t/4M) times sqrt|rho|.
 */
function timeHalfRange(r, M, spacetime) {
  // Minkowski: a constant-r line is the half-hyperbola t^2 - r^2 = const, whose ends approach the light cone; t has to
  // run well past r for the drawn branch to reach its corner of the diamond.
  if (spacetime === "minkowski") return 3 * Math.abs(r) + 24;
  const magnitude = Math.abs(kruskalRho(r, M));
  return magnitude === 0 ? 72 * M : 4 * M * (0.5 * Math.log(magnitude) + 18);
}

/** Radii for a family of constant-r lines: dense just outside the horizon, where the map compresses hardest. */
function radii(rMin, rMax, samples) {
  const out = [];
  for (let i = 0; i < samples; i += 1) out.push(rMin + (rMax - rMin) * (i / (samples - 1)) ** 2);
  return out;
}

/**
 * The lines of constant t and of constant r as polylines of the compactified diagram:
 * { tLines, rLines }, each an array of { value, kind, points: [{ T, R }] }.
 */
export function sampleCoordinateLines(spacetime, { tValues = [], rValues = [], M = 1, samples = 121, region = "I", rMin, rMax } = {}) {
  assertSpacetime(spacetime);
  if (spacetime === "reissner-nordstrom") throw new RangeError("conformal: the Reissner-Nordstrom block is schematic and has no coordinate lines");
  // The sweep of a constant-t line has to stay inside the wedge of its own chart: regions II and IV have r < 2M, so a
  // sweep starting just outside the horizon would put every sample of those charts in another region.
  const interior = region === "II" || region === "IV";
  const lo = rMin ?? (spacetime === "minkowski" ? 0 : interior ? 1e-6 : 2 * M * 1.004);
  const hi = rMax ?? (spacetime === "minkowski" ? 10 : interior ? 2 * M * 0.996 : 40 * M);
  const map = spacetime === "minkowski"
    ? (t, r) => minkowskiMap({ t, r })
    : (t, r) => schwarzschildMap({ t, r, M, region });
  const toPoint = (mapped) => point(mapped.T, mapped.R);

  // In Minkowski the spatial coordinate is signed, so a constant-t line is swept over [-hi, hi] and a constant-r line
  // is the pair of branches at +-r: together they are the two halves of the hyperbola r^2 = const.
  const sweep = spacetime === "minkowski" ? radii(0, hi, Math.ceil(samples / 2)) : radii(lo, hi, samples);
  const rLines = [];
  for (const r of rValues) {
    const half = timeHalfRange(r, M, spacetime);
    for (const branch of spacetime === "minkowski" ? [1, -1] : [1]) {
      const pts = [];
      for (let i = 0; i < samples; i += 1) pts.push(toPoint(map(-half + (2 * half * i) / (samples - 1), branch * r)));
      rLines.push(Object.freeze({ value: branch * r, kind: "r", points: Object.freeze(pts) }));
    }
  }
  const tLines = tValues.map((t) => Object.freeze({
    value: t, kind: "t",
    points: Object.freeze(
      spacetime === "minkowski"
        ? [...sweep.map((r) => toPoint(map(t, -r))).reverse(), ...sweep.map((r) => toPoint(map(t, r)))]
        : sweep.map((r) => toPoint(map(t, r))),
    ),
  }));
  return Object.freeze({ tLines: Object.freeze(tLines), rLines: Object.freeze(rLines) });
}

/* ---------- worldlines ---------- */

/**
 * Radial free fall from rest at r0, in closed form. The cycloid r = (r0/2)(1 + cos eta) gives
 *
 *   tau = sqrt(r0^3 / 8M) (eta + sin eta)
 *   t   = F(eta) + 2M ln|(S + tan(eta/2)) / (S - tan(eta/2))|,   F = 2 M S (eta + (r0/4M)(eta + sin eta))
 *
 * with S = sqrt(r0/2M - 1); the horizon sits at eta_H = 2 arctan S. `t` is the exterior Schwarzschild coordinate and
 * diverges at the horizon, so the curve is carried through by the Kruskal pair of the same eta,
 *
 *   U = -e^((r - F)/4M) (S cos(eta/2) - sin(eta/2)),   V = e^((F + r)/4M) (S cos(eta/2) + sin(eta/2)),
 *
 * whose product is rho(r) exactly: S cos - sin changes sign at the horizon, so U turns positive in the interior with
 * no absolute value anywhere. Both closed forms are checked against integrations of the geodesic equation in
 * test/conformal.test.mjs.
 */
export function freeFallFromRest({ r0 = 10, M = 1, samples = 241 } = {}) {
  if (!(r0 > 2 * M)) throw new RangeError(`free fall: r0 must exceed the horizon 2M = ${2 * M}, received ${r0}`);
  const S = Math.sqrt(r0 / (2 * M) - 1);
  const etaHorizon = 2 * Math.atan(S);
  const tauScale = Math.sqrt(r0 ** 3 / (8 * M));
  const rows = [];
  let crossing = -1, peakT = -Infinity;
  for (let i = 0; i < samples; i += 1) {
    const eta = (Math.PI * i) / (samples - 1);
    const tanHalf = Math.tan(eta / 2);
    const r = (r0 / 2) * (1 + Math.cos(eta));
    const F = 2 * M * S * (eta + (r0 / (4 * M)) * (eta + Math.sin(eta)));
    const t = F + 2 * M * Math.log(Math.abs((S + tanHalf) / (S - tanHalf)));
    const cos = Math.cos(eta / 2), sin = Math.sin(eta / 2);
    const U = -Math.exp((r - F) / (4 * M)) * (S * cos - sin);
    const V = Math.exp((F + r) / (4 * M)) * (S * cos + sin);
    const { T, R } = kruskalCompact(U, V);
    if (crossing < 0 && eta >= etaHorizon) crossing = rows.length;
    if (T > peakT) peakT = T;
    rows.push(Object.freeze({ eta, r, t, tau: tauScale * (eta + Math.sin(eta)), U, V, T, R }));
  }
  return Object.freeze({
    kind: "free-fall", r0, M, S, etaHorizon, crossing, peakT,
    rows: Object.freeze(rows), properTimeEnd: rows[rows.length - 1].tau,
    ticks: Object.freeze(properTimeTicks(rows, 8)),
    // The crossing itself, in closed form: at eta_H, r = 2M and rho = 0, so U = 0 and the point is exactly on the
    // diagonal with both compactified coordinates equal to arctan V.
    horizonCrossing: Object.freeze((() => {
      const sin = Math.sin(etaHorizon / 2), cos = Math.cos(etaHorizon / 2);
      const F = 2 * M * S * (etaHorizon + (r0 / (4 * M)) * (etaHorizon + Math.sin(etaHorizon)));
      const V = Math.exp((F + 2 * M) / (4 * M)) * (S * cos + sin);
      return { eta: etaHorizon, r: 2 * M, U: 0, V, T: Math.atan(V), R: Math.atan(V) };
    })()),
  });
}

/** Rows at n + 1 evenly spaced values of proper time: the glyphs crowd where the map compresses the curve. */
function properTimeTicks(rows, n) {
  const end = rows[rows.length - 1].tau;
  const out = [];
  let cursor = 0;
  for (let k = 0; k <= n; k += 1) {
    const target = (end * k) / n;
    while (cursor < rows.length - 2 && rows[cursor + 1].tau < target) cursor += 1;
    const a = rows[cursor], b = rows[Math.min(cursor + 1, rows.length - 1)];
    const w = b.tau > a.tau ? (target - a.tau) / (b.tau - a.tau) : 0;
    out.push(Object.freeze({
      tau: target, r: a.r + (b.r - a.r) * w, T: a.T + (b.T - a.T) * w, R: a.R + (b.R - a.R) * w,
    }));
  }
  return out;
}

/** A static observer at r0: t from -infinity to +infinity, so the worldline runs from i- to i+ at constant r. */
export function staticObserver({ r0 = 10, M = 1, samples = 181 } = {}) {
  if (!(r0 > 2 * M)) throw new RangeError(`static observer: r0 must exceed the horizon, received ${r0}`);
  const half = timeHalfRange(r0, M, "schwarzschild");
  const rows = [];
  for (let i = 0; i < samples; i += 1) {
    const t = -half + (2 * half * i) / (samples - 1);
    const { T, R } = schwarzschildMap({ t, r: r0, M });
    rows.push(Object.freeze({ t, r: r0, T, R }));
  }
  const corner = rows[rows.length - 1];
  return Object.freeze({
    kind: "static", r0, M, rows: Object.freeze(rows),
    start: Object.freeze({ T: rows[0].T, R: rows[0].R }), end: Object.freeze({ T: corner.T, R: corner.R }),
  });
}

/**
 * A radial null ray of region I, sampled uniformly in the compactified coordinate it varies, so the drawn curve is
 * smooth where it crowds into a corner.
 *   outgoing  u = t - r* = u0 is fixed: U = -e^(-u0/4M) is constant and V = rho / U. The ray runs from the past
 *             horizon out to future null infinity, and only V moves, so |dT| = |dR| along it.
 *   ingoing   v = t + r* = v0 is fixed: V = e^(v0/4M) is constant and U = rho / V. The ray runs from past null
 *             infinity through the horizon to the future singularity, U crossing zero exactly at r = 2M.
 */
export function radialNullRay({ kind = "outgoing", nullValue = 0, M = 1, samples = 161 } = {}) {
  if (kind !== "outgoing" && kind !== "ingoing") throw new RangeError(`null ray: kind must be outgoing or ingoing, received ${kind}`);
  const constant = Math.exp((kind === "outgoing" ? -nullValue : nullValue) / (4 * M));
  const rows = [];
  if (kind === "outgoing") {
    // U is constant, so the ray is the line T + R = 2 arctan U: sample the compactified coordinate evenly, which is
    // both what the drawing wants and what makes |dT| = |dR| hold to rounding error at every step.
    const Uc = Math.atan(-constant);
    // V > 0 in region I (rho = UV must be negative), so the ray runs from V = 0 (the past horizon) to V -> infinity
    // (future null infinity); the two ends are the limits Vc -> 0 and Vc -> pi/2.
    const VcFrom = 1e-9, VcTo = H - 1e-9;
    for (let i = 0; i < samples; i += 1) {
      const Vc = VcFrom + ((VcTo - VcFrom) * i) / (samples - 1);
      const V = Math.tan(Vc);
      const rho = -constant * V;
      const r = radiusFromRho(rho, M);
      rows.push(Object.freeze({ r, rStar: tortoiseRadius(r, M), U: -constant, V, rho, T: Uc + Vc, R: Vc - Uc }));
    }
  } else {
    // V is constant; U runs from -infinity (past null infinity) through 0 (the horizon, rho = 0, r = 2M) up to 1/V,
    // where rho = UV = 1 and the ray meets the singularity at r = 0.
    const V = constant;
    const Vc = Math.atan(V);
    const UcTo = Math.atan(1 / V);
    const UcFrom = -H + 1e-9;
    for (let i = 0; i < samples; i += 1) {
      const Uc = UcFrom + ((UcTo - UcFrom) * i) / (samples - 1);
      const U = Math.tan(Uc);
      const rho = Math.min(1, U * V);
      rows.push(Object.freeze({ r: radiusFromRho(rho, M), U, V, rho, T: Uc + Vc, R: Vc - Uc }));
    }
  }
  return Object.freeze({ kind, nullValue, M, rows: Object.freeze(rows) });
}

/* ---------- Reissner-Nordstrom: one block, schematic ---------- */

/** Mirror a polyline through R = 0, keeping its traversal order, so the two halves of the block match. */
const mirrored = (points) => Object.freeze(points.map((p) => Object.freeze({ T: p.T, R: -p.R })));

/** One drawn edge: the null segment from `a` to `b`. */
const edge = (a, b) => Object.freeze([a, b]);

/**
 * The drawn geometry of the Reissner-Nordstrom block, before it is frozen with its labels and its extent.
 *
 * One block of the maximal extension, on the right of the timelike singularity, is a chain of three regions. Every
 * boundary is null, so every drawn edge is at exactly 45 degrees:
 *
 *   0 < r < r-     the TRIANGLE whose inner edge is the singularity, a vertical segment at R = 0, and whose other two
 *                  edges are the inner horizon r = r-: the two null lines through the crossing on the axis, which is
 *                  why they meet the two ENDS of the singularity.
 *   r- < r < r+    the diamond between the two horizons' axis crossings.
 *   r > r+         the diamond whose right vertex is spatial infinity i0.
 *
 * The left half is the mirror image through R = 0 and shares that vertical edge, which is what makes the singularity
 * timelike: it runs up the middle of the picture instead of capping it off as Schwarzschild's spacelike one does. A
 * horizon is drawn once, as the two edges each of its two neighbouring regions contributes at the crossing.
 */
const RN_GEOMETRY = (() => {
  const R_MINUS = 1.0;  // where the inner horizon r = r- crosses the axis; also half the singularity's height
  const R_PLUS = 1.9;   // where the outer horizon r = r+ crosses it
  const I0 = 3.1;       // spatial infinity: the exterior's right vertex
  const atR = (R) => Object.freeze({ T: 0, R });
  const top = (from, to) => Object.freeze({ T: (to - from) / 2, R: (from + to) / 2 });
  const bottom = (from, to) => Object.freeze({ T: -(to - from) / 2, R: (from + to) / 2 });

  // the vertices of each region on the right of the singularity: left, top, right, bottom
  const singularityTop = Object.freeze({ T: R_MINUS, R: 0 });
  const singularityBottom = Object.freeze({ T: -R_MINUS, R: 0 });
  const atMinus = atR(R_MINUS);
  const atPlus = atR(R_PLUS);
  const betweenTop = top(R_MINUS, R_PLUS);
  const betweenBottom = bottom(R_MINUS, R_PLUS);
  const exteriorTop = top(R_PLUS, I0);
  const exteriorBottom = bottom(R_PLUS, I0);

  // the two edges of a region that meet at its left vertex, and the two that meet at its right vertex
  const leftEdges = ([left, topv, , bottomv]) => [edge(left, topv), edge(bottomv, left)];
  const rightEdges = ([, topv, right, bottomv]) => [edge(topv, right), edge(right, bottomv)];

  const inside = [singularityTop, atMinus, singularityBottom];
  const between = [atMinus, betweenTop, atPlus, betweenBottom];
  const exterior = [atPlus, exteriorTop, atR(I0), exteriorBottom];
  const insideRight = [edge(singularityTop, atMinus), edge(atMinus, singularityBottom)];

  const innerRight = [...insideRight, ...leftEdges(between)];
  const outerRight = [...rightEdges(between), ...leftEdges(exterior)];
  const infinityRight = rightEdges(exterior);
  const bothSides = (right) => Object.freeze([...right, ...right.map(mirrored)]);

  return {
    singularity: Object.freeze([Object.freeze([singularityBottom, singularityTop])]),
    innerHorizon: bothSides(innerRight),
    outerHorizon: bothSides(outerRight),
    nullInfinity: bothSides(infinityRight),
    // The closed outline of each region, as polygons. This is `polygons`, not `regions`: `regions` on this object is
    // the hover/focus descriptor list that regions("reissner-nordstrom") returns.
    polygons: Object.freeze({
      inside: Object.freeze(inside), between: Object.freeze(between), exterior: Object.freeze(exterior),
    }),
    anchors: Object.freeze({
      exterior: atR((R_PLUS + I0) / 2),
      between: atR((R_MINUS + R_PLUS) / 2),
      inside: atR(R_MINUS / 2),
    }),
    // The block's own bounding box, measured from the vertices it draws. It has to be measured rather than guessed:
    // the scene scales a panel to a common drawn height, so an extent that did not match the drawn geometry would size
    // the whole panel wrongly, and an extent that was too small would clip the horizon crossings.
    extent: Object.freeze((() => {
      const drawn = [...inside, ...between, ...exterior];
      return {
        T: Math.max(...drawn.map((p) => Math.abs(p.T))),
        R: Math.max(...drawn.map((p) => Math.abs(p.R))),
      };
    })()),
  };
})();

/**
 * One block of the maximal extension of Reissner-Nordstrom with 0 < |Q| < M, drawn from explicit polylines in the same
 * (R, T) layout as the exact diagrams, with every null edge at exactly 45 degrees.
 *
 * It is a SCHEMATIC and says so: the three surfaces and their nesting are the textbook ones, but nothing here comes
 * from a coordinate map, and the maximal extension is an infinite chain of such blocks rather than the single block
 * drawn. The block is symmetric about its timelike singularity. Read it from the singularity outward, on either side:
 * the interior (0 < r < r-) against the singularity; the region between the horizons (r- < r < r+) reached across the
 * inner horizon r = r-; and the exterior (r > r+), a wedge opening to i0 beyond the outer horizon r = r+. The
 * singularity is TIMELIKE, a vertical line where Schwarzschild's is spacelike, and r- is a Cauchy horizon: data on it
 * does not determine the future of the block.
 */
export const RN_SCHEMATIC = Object.freeze({
  status: "schematic",
  note: "one block of an infinite chain · r- is a Cauchy horizon · schematic, not a coordinate map",
  ...RN_GEOMETRY,
  regions: Object.freeze([
    region("E", "Exterior, r > r+", "reissner-nordstrom", RN_GEOMETRY.anchors.exterior.T, RN_GEOMETRY.anchors.exterior.R,
      "r+ = M + sqrt(M^2 - Q^2). The region a distant observer sees; the geometry repels a neutral test particle that falls in."),
    region("C", "Between the horizons, r- < r < r+", "reissner-nordstrom", RN_GEOMETRY.anchors.between.T, RN_GEOMETRY.anchors.between.R,
      "r- = M - sqrt(M^2 - Q^2). r is a time between two null horizons, and crossing r- is where predictability fails."),
    region("S", "Timelike singularity, r = 0", "reissner-nordstrom", RN_GEOMETRY.anchors.inside.T, RN_GEOMETRY.anchors.inside.R,
      "A vertical boundary at r = 0. Unlike Schwarzschild's spacelike singularity it can be avoided, and the extension continues past it into another block."),
  ]),
});

/* ---------- what a diagram is made of ---------- */

/** Every boundary and region of a diagram, so a scene draws from one list. */
export function anatomy(spacetime) {
  return Object.freeze({ boundaries: boundaries(spacetime), regions: regions(spacetime) });
}

/** The four worldlines the atlas draws, each in Schwarzschild coordinates and then mapped exactly. */
export function schwarzschildWorldlines({ r0 = 10, M = 1, samples = 241 } = {}) {
  return Object.freeze({
    freeFall: freeFallFromRest({ r0, M, samples }),
    staticObserver: staticObserver({ r0, M, samples: Math.min(samples, 181) }),
    outgoing: radialNullRay({ kind: "outgoing", nullValue: 0, M }),
    ingoing: radialNullRay({ kind: "ingoing", nullValue: 0, M }),
  });
}

/** The sample count a caller asks for so a drawn curve is smooth at the stage's resolution. */
export const DEFAULT_SAMPLES = 181;
