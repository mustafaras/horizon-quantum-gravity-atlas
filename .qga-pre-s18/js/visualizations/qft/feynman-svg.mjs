// Feynman diagrams as SVG (S16): a diagram description in, publication-style geometry out.
//
//   { vertices: [{ id, x, y, external? }],
//     edges:    [{ from, to, kind: "fermion" | "antifermion" | "photon" | "gluon" | "boson" | "scalar", label?, momentum?: { tex, reverse? } }] }
//
// Conventions of the drawing (after TikZ-Feynman):
//   fermion      straight line, arrow at the middle of the segment pointing from -> to
//   antifermion  the same line with the arrow reversed (it runs against the edge direction)
//   photon       sine curve with an integer number of half-periods, so it leaves and enters on its vertices
//   boson        the same sine curve at a larger amplitude (W, Z), drawn in its own colour role
//   gluon        a trochoid coil whose loop count is proportional to the edge length
//   scalar       dashed straight line
// Internal vertices carry a dot of VERTEX_RADIUS; `external: true` vertices are the open ends of the legs. Labels are returned as TeX
// with a position for a KaTeX overlay (SVG text cannot typeset them); momentum arrows are offset parallel to their edge.
//
// The module is pure and DOM-free. Colours come from the caller's `paint(role)`, which the browser binds to the design tokens, so no
// colour or font literal is written here.

export const EDGE_KINDS = Object.freeze(["fermion", "antifermion", "photon", "gluon", "boson", "scalar"]);
export const VERTEX_RADIUS = 3;
export const ARROW_POINTS = "-4,-3.5 4,0 -4,3.5";

const PHOTON_HALF_PERIOD = 10;
const PHOTON_AMPLITUDE = 4.5;
const BOSON_AMPLITUDE = 7;
const SAMPLES_PER_HALF_PERIOD = 12;
const GLUON_PITCH = 12;
const GLUON_RADIUS = 4.6;
const GLUON_SAMPLES_PER_LOOP = 24;
const MIN_HALF_PERIODS = 2;
const MIN_LOOPS = 2;
const MOMENTUM_OFFSET = 13;
const MOMENTUM_MAX_HALF_LENGTH = 17;
const MOMENTUM_LABEL_GAP = 11;
const LABEL_GAP = 12;
// Constant pixel widths of the art direction: 1 to 1.5 px for engraved geometry.
const STROKE = Object.freeze({ fermion: 1.5, antifermion: 1.5, photon: 1.5, boson: 1.5, gluon: 1.5, scalar: 1.5, momentum: 1 });
const SCALAR_DASH = "5 4";

const num = (v) => v.toFixed(2);
const frame = (a, b) => {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len === 0) throw new RangeError("feynman: an edge needs two distinct vertices");
  return { len, ux: (b.x - a.x) / len, uy: (b.y - a.y) / len };
};
const along = (a, f, s, off) => ({ x: a.x + f.ux * s - f.uy * off, y: a.y + f.uy * s + f.ux * off });
const toPath = (points) => `M${points.map((p) => `${num(p.x)},${num(p.y)}`).join(" L")}`;

/** A sine curve of `halfPeriods` half-periods from a to b (the first and last point are a and b exactly). */
export function photonGeometry(a, b, { halfPeriod = PHOTON_HALF_PERIOD, amplitude = PHOTON_AMPLITUDE } = {}) {
  const f = frame(a, b);
  const halfPeriods = Math.max(MIN_HALF_PERIODS, Math.round(f.len / halfPeriod));
  const count = halfPeriods * SAMPLES_PER_HALF_PERIOD;
  const points = [];
  for (let k = 0; k <= count; k++) {
    const u = k / count;
    points.push(k === 0 ? { ...a } : k === count ? { ...b } : along(a, f, f.len * u, amplitude * Math.sin(Math.PI * halfPeriods * u)));
  }
  return { points, halfPeriods };
}

const smooth = (t) => t * t * (3 - 2 * t);

/**
 * A gluon coil: the trochoid x = c phi - B sin phi, y = -B cos phi with c = length / (2 pi n) and B > c, so each of the n loops doubles
 * back. B is tapered to zero over the first and last half loop so the coil starts and ends on the vertices.
 */
export function gluonGeometry(a, b, { pitch = GLUON_PITCH, radius = GLUON_RADIUS } = {}) {
  const f = frame(a, b);
  const loops = Math.max(MIN_LOOPS, Math.round(f.len / pitch));
  const count = loops * GLUON_SAMPLES_PER_LOOP;
  const c = f.len / (2 * Math.PI * loops);
  const ramp = 0.5 / loops;
  const points = [];
  for (let k = 0; k <= count; k++) {
    const u = k / count;
    const phi = 2 * Math.PI * loops * u;
    const g = smooth(Math.min(1, u / ramp, (1 - u) / ramp));
    points.push(k === 0 ? { ...a } : k === count ? { ...b } : along(a, f, c * phi - radius * g * Math.sin(phi), -radius * g * Math.cos(phi)));
  }
  return { points, loops };
}

/** The arrowhead of a fermion line at t = 0.5, with its angle in radians (reversed for an antifermion). */
export function arrowAt(a, b, reversed) {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, angle: reversed ? angle + Math.PI : angle };
}

/** A short arrow parallel to the edge, offset to its left, and the position of its TeX label. */
export function momentumArrow(a, b, { tex, reverse = false }) {
  const f = frame(a, b);
  const half = Math.min(MOMENTUM_MAX_HALF_LENGTH, f.len * 0.2);
  const mid = along(a, f, f.len / 2, MOMENTUM_OFFSET);
  const tail = along(a, f, f.len / 2 - (reverse ? -half : half), MOMENTUM_OFFSET);
  const head = along(a, f, f.len / 2 + (reverse ? -half : half), MOMENTUM_OFFSET);
  const label = along(a, f, f.len / 2, MOMENTUM_OFFSET + MOMENTUM_LABEL_GAP);
  return {
    tex, x1: tail.x, y1: tail.y, x2: head.x, y2: head.y, mid,
    angle: Math.atan2(head.y - tail.y, head.x - tail.x), label,
  };
}

function edgeGeometry(kind, a, b) {
  if (kind === "photon") return { d: toPath(photonGeometry(a, b).points) };
  if (kind === "boson") return { d: toPath(photonGeometry(a, b, { amplitude: BOSON_AMPLITUDE }).points) };
  if (kind === "gluon") return { d: toPath(gluonGeometry(a, b).points) };
  return { d: `M${num(a.x)},${num(a.y)} L${num(b.x)},${num(b.y)}` };
}

function labelPosition(a, b, from, to) {
  const f = frame(a, b);
  if (from.external || to.external) {
    const tip = from.external ? a : b;
    const dir = from.external ? -1 : 1;
    const anchor = Math.abs(f.ux) > 0.5 ? (f.ux * dir > 0 ? "start" : "end") : "middle";
    return { x: tip.x + f.ux * dir * LABEL_GAP, y: tip.y + f.uy * dir * LABEL_GAP, anchor };
  }
  // Beside the edge, on the side opposite its momentum arrow: above a flat edge, to the right of an upright one (left-aligned there, so a wide
  // label starts clear of the wave instead of straddling it).
  const nx = f.uy, ny = -f.ux;
  const sideways = Math.abs(nx) > 0.5;
  const gap = sideways ? LABEL_GAP : LABEL_GAP + 8;
  const mid = along(a, f, f.len / 2, 0);
  return { x: mid.x + nx * gap, y: mid.y + ny * gap, anchor: sideways ? (nx > 0 ? "start" : "end") : "middle" };
}

/** Geometry of a diagram: `paths`, `arrows`, `dots`, `labels` (TeX for the overlay) and `momenta`, all in the diagram's own units. */
export function layoutDiagram(def) {
  const byId = new Map();
  for (const v of def.vertices) {
    if (byId.has(v.id)) throw new Error(`feynman: duplicate vertex ${v.id}`);
    byId.set(v.id, v);
  }
  const paths = [], arrows = [], labels = [], momenta = [];
  def.edges.forEach((edge, index) => {
    const from = byId.get(edge.from), to = byId.get(edge.to);
    if (!from || !to) throw new Error(`feynman: unknown vertex in edge ${edge.from} -> ${edge.to}`);
    if (!EDGE_KINDS.includes(edge.kind)) throw new Error(`feynman: unknown edge kind ${edge.kind}`);
    const geometry = edgeGeometry(edge.kind, from, to);
    paths.push({ index, kind: edge.kind, d: geometry.d, dash: edge.kind === "scalar" ? SCALAR_DASH : null, width: STROKE[edge.kind] });
    if (edge.kind === "fermion" || edge.kind === "antifermion") arrows.push({ index, kind: edge.kind, ...arrowAt(from, to, edge.kind === "antifermion") });
    if (edge.label) labels.push({ index, tex: edge.label, ...labelPosition(from, to, from, to) });
    if (edge.momentum) {
      const m = momentumArrow(from, to, edge.momentum);
      momenta.push({ index, ...m });
      labels.push({ index, tex: edge.momentum.tex, x: m.label.x, y: m.label.y, anchor: "middle", momentum: true });
    }
  });
  const dots = def.vertices.filter((v) => !v.external).map((v) => ({ id: v.id, x: v.x, y: v.y, r: VERTEX_RADIUS }));
  return { paths, arrows, dots, labels, momenta };
}

const escapeAttr = (text) => String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** The diagram as an SVG string (labels are left to the KaTeX overlay). `paint(role)` returns a CSS colour for a role. */
export function diagramToSvg(def, { paint, width = 560, height = 240, ariaLabel = "Feynman diagram" }) {
  const layout = layoutDiagram(def);
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(ariaLabel)}" style="width:100%;display:block">`];
  for (const p of layout.paths) {
    const role = p.kind === "antifermion" ? "fermion" : p.kind;
    const dash = p.dash ? ` stroke-dasharray="${p.dash}"` : "";
    out.push(`<path d="${p.d}" fill="none" stroke="${paint(role)}" stroke-width="${p.width}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`);
  }
  for (const a of layout.arrows) {
    out.push(`<polygon points="${ARROW_POINTS}" fill="${paint("fermion")}" transform="translate(${num(a.x)},${num(a.y)}) rotate(${num((a.angle * 180) / Math.PI)})"/>`);
  }
  for (const m of layout.momenta) {
    out.push(`<line x1="${num(m.x1)}" y1="${num(m.y1)}" x2="${num(m.x2)}" y2="${num(m.y2)}" stroke="${paint("momentum")}" stroke-width="${STROKE.momentum}"/>`);
    out.push(`<polygon points="${ARROW_POINTS}" fill="${paint("momentum")}" transform="translate(${num(m.x2)},${num(m.y2)}) rotate(${num((m.angle * 180) / Math.PI)}) scale(0.8)"/>`);
  }
  for (const d of layout.dots) out.push(`<circle cx="${num(d.x)}" cy="${num(d.y)}" r="${d.r}" fill="${paint("vertex")}"/>`);
  out.push("</svg>");
  return out.join("");
}
