// Margin solver: derives the plot rectangle from measured label extents so nothing clips
// between 320 px and 1440 px. `measure(text, font) -> width in CSS px` is injected (canvas
// measureText in the browser, a metric table in Node tests).

export const TICK_LENGTH = 4;
export const TICK_GAP = 4;
export const EDGE_PAD = 6;
export const TITLE_LINE = 18;
export const LEGEND_ROW = 18;
export const LEGEND_SWATCH = 18;
export const LEGEND_GAP = 14;
export const MIN_PLOT = 48;

/** Width estimate for tex labels, which KaTeX typesets after layout: the plain text, 1.15× for safety. */
export const texExtent = (plain, measure, font) => Math.ceil(measure(plain, font) * 1.15);

/**
 * Lay legend entries in rows that wrap at `maxWidth`. Entries are `{ plain, tex? }`.
 * Returns `{ rows: [[{ index, x, w }]], height }`, x relative to the row origin.
 */
export function layoutLegend(entries, maxWidth, measure, font) {
  const rows = [[]];
  let x = 0;
  entries.forEach((entry, index) => {
    const w = LEGEND_SWATCH + 6 + (entry.tex ? texExtent(entry.plain, measure, font) : Math.ceil(measure(entry.plain, font)));
    if (x > 0 && x + w > maxWidth) { rows.push([]); x = 0; }
    rows[rows.length - 1].push({ index, x, w: Math.min(w, maxWidth) });
    x += w + LEGEND_GAP;
  });
  return { rows: rows.filter((r) => r.length), height: rows.filter((r) => r.length).length * LEGEND_ROW };
}

/**
 * Solve the layout of one figure.
 *   width, height   CSS pixels of the whole figure box
 *   measure, font   text metrics
 *   xTicks, yTicks  label strings
 *   xLabel, yLabel  `{ plain, tex? }` or null
 *   legend          array of entries or null (laid out under the plot)
 *   aspect          plot width / height; the plot is then sized from its width and `height` is derived
 *   maxPlotWidth    upper bound of the plot width (with aspect)
 */
export function solveLayout({ width, height, measure, font, xTicks = [], yTicks = [], xLabel = null, yLabel = null, legend = null, aspect = null, maxPlotWidth = Infinity }) {
  if (!(width > 0) || !(height > 0)) throw new RangeError(`layout: invalid size ${width}x${height}`);
  const lineH = Math.ceil(parseFloat(/([\d.]+)px/.exec(font)?.[1] ?? "12") * 1.35);
  const yTickW = yTicks.length ? Math.max(...yTicks.map((t) => Math.ceil(measure(t, font)))) : 0;
  const xFirstHalf = xTicks.length ? Math.ceil(measure(xTicks[0], font) / 2) : 0;
  const xLastHalf = xTicks.length ? Math.ceil(measure(xTicks[xTicks.length - 1], font) / 2) : 0;

  const yLabelW = yLabel ? TITLE_LINE : 0;
  const left = Math.max(EDGE_PAD + yLabelW + (yLabelW ? 4 : 0) + yTickW + TICK_GAP + TICK_LENGTH, EDGE_PAD + xFirstHalf);
  const right = Math.max(EDGE_PAD, xLastHalf + 2);
  let plotW = Math.min(maxPlotWidth, Math.max(MIN_PLOT, width - left - right));

  const top = EDGE_PAD + Math.ceil(lineH / 2);
  const legendBox = legend && legend.length ? layoutLegend(legend, Math.max(MIN_PLOT, width - 2 * EDGE_PAD), measure, font) : { rows: [], height: 0 };
  const xAxisH = TICK_LENGTH + TICK_GAP + lineH + (xLabel ? TITLE_LINE + 2 : 0);
  const bottom = xAxisH + (legendBox.height ? legendBox.height + 6 : 0) + EDGE_PAD;
  const plotH = aspect ? plotW / aspect : Math.max(MIN_PLOT / 2, height - top - bottom);
  if (aspect) height = Math.ceil(top + plotH + bottom);

  return {
    width, height, lineH,
    plot: { x: left, y: top, w: plotW, h: plotH },
    margins: { left, right, top, bottom },
    xLabelBox: xLabel ? { x: left, y: top + plotH + TICK_LENGTH + TICK_GAP + lineH + 2, w: plotW, h: TITLE_LINE } : null,
    yLabelBox: yLabel ? { x: EDGE_PAD, y: top, w: TITLE_LINE, h: plotH } : null,
    legend: legendBox.rows.length
      ? { x: EDGE_PAD, y: top + plotH + xAxisH + 6, rows: legendBox.rows, height: legendBox.height, maxWidth: width - 2 * EDGE_PAD }
      : null,
    /** Height the figure needs for a given plot height. */
    heightFor: (plotHeight) => Math.ceil(top + plotHeight + bottom),
  };
}
