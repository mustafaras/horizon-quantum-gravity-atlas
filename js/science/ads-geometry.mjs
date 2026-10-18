/**
 * AdS holography lab — pure geometry contract for Prompt 08.
 *
 * A static AdS3 slice rendered in the Poincaré disk. Every number here is
 * EXACT hyperbolic geometry in closed form:
 *   - geodesics are circular arcs orthogonal to the boundary circle,
 *   - distances use the standard Poincaré disk formula,
 *   - the Ryu–Takayanagi entropy uses the standard regularized geodesic
 *     length S = (c/3)·ln(2·sin(Δφ/2)/ε) for a boundary interval of angle
 *     Δφ on the unit-radius disk.
 *
 * Honest boundaries (mirrored in provenance):
 * - The geometry is established mathematics, computed exactly and tested.
 * - The AdS/CFT interpretation (boundary quantum theory ↔ bulk gravity)
 *   is CONJECTURAL; the scene illustrates the RT proposal, it does not
 *   derive it, and our universe is not anti-de Sitter.
 * - Entropy values are illustrative magnitudes in units of c/3 with a fixed
 *   regulator ε — not CFT two-point-function results.
 *
 * DOM-free and deterministic: no randomness is needed, so no seed is used;
 * every function is a pure function of its arguments.
 */

import { getVisualizationProvenance, registerVisualization } from "./provenance.mjs";

export const ADS_LAB_VIEW_ID = "ads-holography-lab";

export const ADS_LAB_DEFAULTS = Object.freeze({
  links: 5,        // boundary intervals in the partition (0–12)
  region: 0.5,     // featured interval as a fraction of the boundary circle
  regulator: 0.01, // ε in units of the AdS radius
  centralCharge: 1,
});

export const ADS_LAB_PROVENANCE = Object.freeze({
  model: "Static AdS3 slice in the Poincaré disk: exact hyperbolic geodesics drawn as Ryu–Takayanagi minimal surfaces for boundary intervals, with an entanglement wedge for a featured region",
  status: "conjectural",
  assumptions: [
    "Hyperbolic geometry itself (Poincaré disk, orthogonal-circle geodesics, distances): established mathematics, computed in closed form",
    "The Ryu–Takayanagi proposal and AdS/CFT duality: CONJECTURAL — unproven, tested only in theoretical settings; our universe is not anti-de Sitter",
    "Entropy S = (c/3)·ln(2·sin(Δφ/2)/ε) is the standard large-c vacuum result for a single boundary interval; ε is a fixed regulator, values are illustrative magnitudes",
    "The partition mode divides the boundary into equal intervals — a pedagogical weave, not a physical boundary state",
  ],
  validity: [
    "Geodesics are exact: each arc lies on the unique circle orthogonal to the boundary through its two endpoints (verified by tests)",
    "Entropy is symmetric under Δφ → 2π − Δφ and monotone on (0, π], as the vacuum formula requires",
    "Two-dimensional static slice: no time dependence, no bulk dynamics, no backreaction",
  ],
  numericalMethod:
    "Closed-form Poincaré disk geometry: geodesic circle center at (1/cos(Δφ/2)) along the interval bisector with radius |tan(Δφ/2)|; "
    + "hyperbolic distance d = arcosh(1 + 2|p−q|²/((1−|p|²)(1−|q|²))); arcs sampled at fixed angular resolution for rendering only",
  references: [
    "Prompt 08 spec: docs/superpowers/plans/2026-10-08-ultra-realistic-atlas-prompts.md",
    "Ryu & Takayanagi, Phys. Rev. Lett. 96 (2006) 181602",
    "Maldacena, Adv. Theor. Math. Phys. 2 (1998) 231 (AdS/CFT)",
    "Calabrese & Cardy, J. Stat. Mech. (2004) P06002 (interval entropy on a circle)",
  ],
});

export function registerAdsLabProvenance() {
  if (!getVisualizationProvenance(ADS_LAB_VIEW_ID)) {
    registerVisualization(ADS_LAB_VIEW_ID, ADS_LAB_PROVENANCE);
  }
  return ADS_LAB_PROVENANCE;
}

const TAU = Math.PI * 2;

/** Wrap an angle into [0, 2π). */
export function wrapAngle(a) {
  return ((Number(a) || 0) % TAU + TAU) % TAU;
}

/** Boundary point of the unit disk at angle θ. */
export function boundaryPoint(theta) {
  return { x: Math.cos(theta), y: Math.sin(theta) };
}

/**
 * Counterclockwise span of the interval from θ1 to θ2, in (0, 2π].
 * Returns 2π only for a full circle (identical endpoints).
 */
export function angularSpan(theta1, theta2) {
  const span = wrapAngle(wrapAngle(theta2) - wrapAngle(theta1));
  return span === 0 ? TAU : span;
}

/**
 * Exact geodesic between two boundary points of the unit Poincaré disk.
 * The geodesic is the arc (inside the disk) of the unique circle orthogonal
 * to the boundary circle through both endpoints. For antipodal endpoints the
 * geodesic degenerates to a straight diameter.
 *
 * Returns { kind, center, radius, fromAngle, toAngle, throughAngle, span }
 * where from/to/through are polar angles AROUND THE GEODESIC CIRCLE: the
 * rendering arc sweeps from fromAngle to toAngle passing throughAngle.
 */
export function boundaryGeodesic(theta1, theta2) {
  const span = angularSpan(theta1, theta2);
  const half = span / 2;
  const mid = wrapAngle(theta1) + half; // bisector direction
  if (Math.abs(Math.PI - span) < 1e-9) {
    return {
      kind: "diameter", center: { x: 0, y: 0 }, radius: Infinity,
      fromAngle: wrapAngle(theta1), toAngle: wrapAngle(theta1) + Math.PI,
      throughAngle: wrapAngle(theta1), span,
    };
  }
  const c = 1 / Math.cos(half); // signed: negative center for span > π
  const center = { x: c * Math.cos(mid), y: c * Math.sin(mid) };
  const radius = Math.abs(Math.tan(half));
  const p1 = boundaryPoint(theta1);
  const p2 = boundaryPoint(theta2);
  const fromAngle = Math.atan2(p1.y - center.y, p1.x - center.x);
  const toAngle = Math.atan2(p2.y - center.y, p2.x - center.x);
  // Direction from the geodesic circle's center toward the disk interior.
  const throughAngle = Math.atan2(-center.y, -center.x);
  return { kind: "arc", center, radius, fromAngle, toAngle, throughAngle, span };
}

/**
 * Sample the geodesic as a polyline of `segments + 1` points inside the
 * closed disk, sweeping the arc that passes through the bulk interior.
 */
export function sampleGeodesic(geodesic, segments = 48) {
  const n = Math.max(2, Math.trunc(Number(segments)) || 48);
  const pts = [];
  if (geodesic.kind === "diameter") {
    const a = geodesic.fromAngle;
    for (let i = 0; i <= n; i++) {
      const r = -1 + (2 * i) / n; // sweep from one endpoint through 0 to the other
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    return pts;
  }
  const { center, radius, fromAngle, toAngle, throughAngle } = geodesic;
  const norm = (a) => ((a % TAU) + TAU) % TAU;
  const ccw = norm(toAngle - fromAngle);
  const throughCw = norm(fromAngle - throughAngle);
  const throughCcw = norm(throughAngle - fromAngle);
  // Sweep counterclockwise unless the through-direction lies on the
  // clockwise branch (i.e. outside the CCW sweep).
  const dir = throughCcw <= ccw ? 1 : -1;
  const total = dir === 1 ? ccw : norm(fromAngle - toAngle);
  for (let i = 0; i <= n; i++) {
    const a = fromAngle + dir * (total * i) / n;
    pts.push({ x: center.x + Math.cos(a) * radius, y: center.y + Math.sin(a) * radius });
  }
  return pts;
}

/** Hyperbolic distance between two interior points of the unit disk. */
export function hyperbolicDistance(p, q) {
  const rp2 = 1 - (p.x * p.x + p.y * p.y);
  const rq2 = 1 - (q.x * q.x + q.y * q.y);
  if (rp2 <= 0 || rq2 <= 0) throw new RangeError("hyperbolicDistance requires interior points (|p| < 1)");
  const d2 = (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y);
  const arg = 1 + (2 * d2) / (rp2 * rq2);
  return Math.acosh(Math.max(1, arg));
}

/** Euclidean disk radius of a hyperbolic radius ρ (centered at the origin). */
export function diskRadius(rho) {
  return Math.tanh(Math.max(0, Number(rho) || 0) / 2);
}

/** Inverse of diskRadius. */
export function hyperbolicRadius(r) {
  const v = Math.min(0.999999999, Math.max(0, Number(r) || 0));
  return 2 * Math.atanh(v);
}

/**
 * Regularized geodesic length for a boundary interval of angular size span:
 * L = 2·ln(2·sin(span/2)/ε). Diverges at the endpoints of (0, 2π) — the UV
 * and thermal limits the regulator stands in for.
 */
export function regularizedGeodesicLength(span, regulator = ADS_LAB_DEFAULTS.regulator) {
  const eps = Number(regulator);
  if (!(eps > 0)) throw new RangeError("regulator must be > 0");
  const s = Number(span);
  if (!(s > 0) || !(s < TAU)) throw new RangeError("span must lie strictly inside (0, 2π)");
  return 2 * Math.log((2 * Math.sin(s / 2)) / eps);
}

/**
 * Ryu–Takayanagi entropy for a single boundary interval of angular size
 * span: S = (c/3)·ln(2·sin(span/2)/ε). Symmetric under span → 2π − span.
 */
export function rtEntropy(span, { centralCharge = ADS_LAB_DEFAULTS.centralCharge, regulator = ADS_LAB_DEFAULTS.regulator } = {}) {
  return (Number(centralCharge) / 6) * regularizedGeodesicLength(span, regulator);
}

/**
 * Partition of the boundary circle into `links` equal intervals.
 * links = 0 → no intervals (empty weave).
 */
export function partitionIntervals(links) {
  const n = Math.max(0, Math.min(48, Math.trunc(Number(links)) || 0));
  const out = [];
  for (let i = 0; i < n; i++) {
    const start = (i * TAU) / n;
    out.push({ start, end: start + TAU / n, span: TAU / n, index: i });
  }
  return out;
}

/**
 * The entanglement wedge of a single interval: the region bounded by the
 * RT geodesic and the boundary arc. Returned as two polylines (geodesic
 * sampled from θ1 to θ2 through the bulk, boundary arc sampled back) that
 * share endpoints, ready for a triangle-fan mesh.
 */
export function entanglementWedge(theta1, theta2, segments = 48) {
  const geodesic = boundaryGeodesic(theta1, theta2);
  const inner = sampleGeodesic(geodesic, segments);
  const span = geodesic.span;
  const boundary = [];
  const m = Math.max(2, Math.trunc(Number(segments)) || 48);
  for (let i = 0; i <= m; i++) {
    boundary.push(boundaryPoint(theta1 + (span * i) / m));
  }
  return { geodesic, inner, boundary, polygon: [...inner, ...boundary.slice(1, -1).reverse()] };
}

/**
 * Static hyperbolic grid for the bulk: concentric hyperbolic circles
 * (Euclidean radius tanh(ρ/2)), radial spokes, and two families of
 * geodesic arcs weaving between boundary points.
 */
export function hyperbolicGrid({ rings = 6, spokes = 24, arcCount = 12, rhoMax = 3.8 } = {}) {
  const nR = Math.max(1, Math.trunc(Number(rings)) || 6);
  const nS = Math.max(3, Math.trunc(Number(spokes)) || 24);
  const nA = Math.max(0, Math.trunc(Number(arcCount)) || 12);
  const ringPolys = [];
  for (let i = 1; i <= nR; i++) {
    const r = diskRadius((i * rhoMax) / nR);
    const poly = [];
    for (let k = 0; k <= 64; k++) {
      const a = (k * TAU) / 64;
      poly.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
    }
    ringPolys.push(poly);
  }
  const spokeLines = [];
  const rOut = diskRadius(rhoMax);
  for (let k = 0; k < nS; k++) {
    const a = (k * TAU) / nS;
    spokeLines.push([{ x: 0, y: 0 }, { x: rOut * Math.cos(a), y: rOut * Math.sin(a) }]);
  }
  const arcPolys = [];
  for (let k = 0; k < nA; k++) {
    const a1 = (k * TAU) / nA;
    const span = k % 2 === 0 ? (2 * Math.PI) / 3 : Math.PI / 2;
    arcPolys.push(sampleGeodesic(boundaryGeodesic(a1, a1 + span), 32));
  }
  return { ringPolys, spokeLines, arcPolys, rhoMax };
}

/**
 * Full lab state for the scene: partition weave + featured RT surface +
 * wedge + grid. Pure and deterministic — identical arguments give an
 * identical (deep-frozen-free but structurally stable) result.
 */
export function adsLabState({
  links = ADS_LAB_DEFAULTS.links,
  region = ADS_LAB_DEFAULTS.region,
  regulator = ADS_LAB_DEFAULTS.regulator,
  centralCharge = ADS_LAB_DEFAULTS.centralCharge,
} = {}) {
  const nLinks = Math.max(0, Math.min(12, Math.trunc(Number(links)) || 0));
  const frac = Math.min(0.95, Math.max(0.05, Number(region) || ADS_LAB_DEFAULTS.region));
  const eps = Number(regulator) > 0 ? Number(regulator) : ADS_LAB_DEFAULTS.regulator;
  const c = Number(centralCharge) > 0 ? Number(centralCharge) : ADS_LAB_DEFAULTS.centralCharge;

  const intervals = partitionIntervals(nLinks);
  const geodesics = intervals.map((iv) => {
    const geo = boundaryGeodesic(iv.start, iv.end);
    return { ...iv, geo, points: sampleGeodesic(geo, 40) };
  });

  // Featured region: centered at the top of the disk (angle π/2) so the
  // scene composition is deterministic across state changes.
  const featuredSpan = frac * TAU;
  const featuredStart = Math.PI / 2 - featuredSpan / 2;
  const featuredEnd = featuredStart + featuredSpan;
  const featuredGeo = boundaryGeodesic(featuredStart, featuredEnd);
  const wedge = entanglementWedge(featuredStart, featuredEnd, 56);
  const featured = {
    start: featuredStart, end: featuredEnd, span: featuredSpan,
    geo: featuredGeo, points: sampleGeodesic(featuredGeo, 56),
    entropy: rtEntropy(featuredSpan, { centralCharge: c, regulator: eps }),
    length: regularizedGeodesicLength(featuredSpan, eps),
  };

  return {
    links: nLinks,
    region: frac,
    regulator: eps,
    centralCharge: c,
    geodesics,
    featured,
    wedge,
    grid: hyperbolicGrid({}),
    boundaryNodes: nLinks,
  };
}

/** Export metadata for the AdS lab (mirrors hawkingExportMetadata). */
export function adsExportMetadata(state, runtime = {}) {
  let lab = null;
  try {
    lab = adsLabState({
      links: state?.adsLabLinks ?? ADS_LAB_DEFAULTS.links,
      region: state?.adsLabRegion ?? ADS_LAB_DEFAULTS.region,
    });
  } catch {
    lab = null;
  }
  return {
    adsLab: {
      view: ADS_LAB_VIEW_ID,
      links: lab?.links ?? null,
      region: lab?.region ?? null,
      featuredSpan: lab?.featured.span ?? null,
      featuredEntropy: lab?.featured.entropy ?? null,
      regulator: lab?.regulator ?? null,
      interpretation: "conjectural (AdS/CFT); geometry exact",
      runtime: { kind: runtime.kind || null, geodesics: runtime.geodesics || null },
      provenance: { status: ADS_LAB_PROVENANCE.status },
    },
  };
}