// Text alternatives for a figure: a generated summary (series, ranges, extrema, zero crossings)
// and a decimated data table. Pure, so it is covered by node:test and reused by the SVG export.

const MAX_ROWS = 200;
const fmt = (v) => (Number.isFinite(v) ? Number(v.toPrecision(4)).toString() : "n/a");

function range(a) { let lo = Infinity, hi = -Infinity; for (const v of a) { if (v < lo) lo = v; if (v > hi) hi = v; } return [lo, hi]; }

/** x positions where a series crosses zero, by linear interpolation between samples. */
export function zeroCrossings(xs, ys) {
  const out = [];
  for (let i = 1; i < xs.length; i++) {
    const a = ys[i - 1], b = ys[i];
    if (a === 0 && i === 1) out.push(xs[0]);
    if (a * b < 0) out.push(xs[i - 1] + (xs[i] - xs[i - 1]) * (a / (a - b)));
    else if (b === 0 && a !== 0) out.push(xs[i]);
  }
  return out;
}

function seriesSentence(m, index) {
  const name = m.label?.plain ?? m.id ?? `${m.type} ${index + 1}`;
  if (m.type === "heatmap") {
    const [lo, hi] = range(m.z.flat());
    return `${name}: heat map ${m.z[0].length} by ${m.z.length} cells, values from ${fmt(lo)} to ${fmt(hi)}.`;
  }
  if (m.type === "rule") return `${name}: reference line at ${m.axis} = ${fmt(m.value)}.`;
  if (m.type === "callout") return `${name}: callout at (${fmt(m.x)}, ${fmt(m.y)}).`;
  if (m.type === "region") return `${name}: excluded region.`;
  if (m.type === "band") {
    const [lo] = range(m.y0), [, hi] = range(m.y1);
    return `${name}: band between ${fmt(lo)} and ${fmt(hi)}.`;
  }
  const [xlo, xhi] = range(m.x), [ylo, yhi] = range(m.y);
  const iMax = m.y.indexOf(yhi), iMin = m.y.indexOf(ylo);
  const zeros = zeroCrossings(m.x, m.y);
  const z = zeros.length ? ` ${zeros.length} zero crossing${zeros.length > 1 ? "s" : ""}, first at ${fmt(zeros[0])}.` : "";
  return `${name} (${m.layer}): ${m.x.length} ${m.type === "points" ? "points" : "samples"} over x from ${fmt(xlo)} to ${fmt(xhi)}; y from ${fmt(ylo)} at x = ${fmt(m.x[iMin])} to ${fmt(yhi)} at x = ${fmt(m.x[iMax])}.${z}`;
}

/** `Title. Status. x axis, y axis. One sentence per series.` */
export function figureSummary(spec) {
  const ax = (a, n) => `${n} axis ${a.label?.plain ?? "unlabelled"}, ${a.scale.type}, from ${fmt(a.scale.domain[0])} to ${fmt(a.scale.domain[1])}.`;
  const parts = [`${spec.title}. Status: ${spec.status}.`, ax(spec.x, "x"), ax(spec.y, "y")];
  spec.marks.forEach((m, i) => parts.push(seriesSentence(m, i)));
  if (spec.summary) parts.push(spec.summary);
  return parts.join(" ");
}

/** Evenly decimated row indices, always keeping the first and last sample. */
export function decimate(n, limit = MAX_ROWS) {
  if (n <= limit) return Array.from({ length: n }, (_, i) => i);
  const out = [];
  for (let k = 0; k < limit; k++) out.push(Math.round((k * (n - 1)) / (limit - 1)));
  return out;
}

/** Table for the "Data" disclosure: `{ columns, rows }` with at most 200 decimated rows per figure. */
export function dataTable(spec) {
  const series = spec.marks.filter((m) => ["line", "step", "points"].includes(m.type));
  if (!series.length) return { columns: [], rows: [], truncated: false };
  const columns = [spec.x.label?.plain ?? "x"];
  const base = series[0];
  series.forEach((m, i) => columns.push(m.label?.plain ?? m.id ?? `${spec.y.label?.plain ?? "y"} ${i + 1}`));
  const idx = decimate(base.x.length);
  const rows = idx.map((i) => [base.x[i], ...series.map((m) => (m.x.length === base.x.length ? m.y[i] : m.y[Math.min(m.y.length - 1, Math.round(i * (m.y.length - 1) / (base.x.length - 1)))]))]);
  return { columns, rows, truncated: base.x.length > MAX_ROWS };
}

/** Nearest sample of a series to an x value, by binary search on sorted x; used by the crosshair. */
export function nearestIndex(xs, x) {
  let lo = 0, hi = xs.length - 1;
  if (xs[lo] > xs[hi]) return xs.reduce((best, v, i) => (Math.abs(v - x) < Math.abs(xs[best] - x) ? i : best), 0);
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] < x) lo = mid; else hi = mid; }
  return Math.abs(xs[lo] - x) <= Math.abs(xs[hi] - x) ? lo : hi;
}
