// buildScene: turns a figure spec into resolved drawing primitives in CSS pixels. Both the canvas
// and the SVG renderer paint exactly these primitives, so the two outputs cannot drift apart.
//
// Primitive colours are `{ c: tokenName, a: alpha }`; renderers resolve them through the design
// tokens. Text carries `text` (plain) and, for anything with maths, `tex` (typeset by the overlay).

import { makeScale } from "./scale.mjs";
import { formatTicks, logMinorTicks, linearTicks } from "./ticks.mjs";
import { solveLayout, TICK_LENGTH, TICK_GAP, texExtent } from "./layout.mjs";
import { sampleSequential, diverging } from "../design/palettes.mjs";
import { linearToSrgb } from "../design/color.mjs";
import { current } from "../design/tokens.mjs";

const LIT_WIDTH = 2.5; // the focal line width of the art direction
const LIT_DIM = 0.3; // what is not lit recedes
const LIT_RADIUS_GAIN = 1.5;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const byte = (linear) => Math.round(clamp01(linearToSrgb(clamp01(linear))) * 255);
const parsePx = (font) => parseFloat(/([\d.]+)px/.exec(font)?.[1] ?? "12");

/** Drop ticks (keeping the first) until adjacent labels have `gap` px between them. */
function thin(positions, widths, gap = 8) {
  for (let stride = 1; stride < positions.length + 1; stride++) {
    const keep = positions.map((_, i) => i).filter((i) => i % stride === 0);
    let ok = true;
    for (let k = 1; k < keep.length && ok; k++) {
      const a = keep[k - 1], b = keep[k];
      ok = Math.abs(positions[b] - positions[a]) - (widths[b] + widths[a]) / 2 >= gap;
    }
    if (ok) return keep;
  }
  return [0];
}

function axisTicks(def, scale, measure, font, pixels, vertical) {
  const logAxis = def.scale.type === "log";
  const count = vertical ? Math.max(3, Math.min(8, Math.floor(pixels / 28))) : Math.max(2, Math.min(9, Math.floor(pixels / 64)));
  let values = def.ticks ? [...def.ticks] : scale.ticks(count);
  if (values.length === 0) values = linearTicks(def.scale.domain[0], def.scale.domain[1], count);
  const labels = formatTicks(values, { decade: logAxis && def.decade });
  const minor = logAxis ? logMinorTicks(Math.min(...def.scale.domain), Math.max(...def.scale.domain)).filter((v) => !values.includes(v)) : [];
  return { values, labels, minor };
}

function colorRamp(name) {
  const sample = name === "diverging" ? ((d) => (t) => d.sample(2 * t - 1))(diverging(current())) : (t) => sampleSequential(name, t);
  // 256-entry byte table: heat maps redraw every animation frame, so no per-cell allocation.
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) { const c = sample(i / 255); lut[i * 3] = byte(c[0]); lut[i * 3 + 1] = byte(c[1]); lut[i * 3 + 2] = byte(c[2]); }
  const ramp = (t) => { const i = Math.round(clamp01(t) * 255) * 3; return [lut[i], lut[i + 1], lut[i + 2]]; };
  ramp.lut = lut;
  return ramp;
}

/** RGBA bytes of a colour bar, one pixel per row, the high end first. Shared with the Formula Lens legend (S10). */
export function colorbarBytes(palette, rows = 32) {
  const ramp = colorRamp(palette);
  const data = new Uint8ClampedArray(rows * 4);
  for (let r = 0; r < rows; r++) {
    const rgb = ramp(1 - r / (rows - 1)); // top is the high end
    data[r * 4] = rgb[0]; data[r * 4 + 1] = rgb[1]; data[r * 4 + 2] = rgb[2]; data[r * 4 + 3] = 255;
  }
  return data;
}

function colorbar(m, zDomain) {
  const rows = 32;
  return { rows, data: colorbarBytes(m.palette, rows), zDomain };
}

function heatImage(m, sx, sy) {
  const rows = m.z.length, cols = m.z[0].length;
  let [lo, hi] = m.zDomain ?? [Infinity, -Infinity];
  if (!m.zDomain) for (const row of m.z) for (const v of row) { if (v < lo) lo = v; if (v > hi) hi = v; }
  if (m.palette === "diverging" && !m.zDomain) { const a = Math.max(Math.abs(lo), Math.abs(hi)); lo = -a; hi = a; }
  const span = hi - lo || 1;
  const lut = colorRamp(m.palette).lut;
  const data = new Uint8ClampedArray(rows * cols * 4);
  const flip = sy.map(m.y[0]) > sy.map(m.y[1]); // z[0] is the row at y[0]: the bottom unless the axis is reversed
  for (let r = 0; r < rows; r++) {
    const out = (flip ? rows - 1 - r : r) * cols;
    for (let c = 0; c < cols; c++) {
      const li = Math.round(clamp01((m.z[r][c] - lo) / span) * 255) * 3;
      const o = (out + c) * 4;
      data[o] = lut[li]; data[o + 1] = lut[li + 1]; data[o + 2] = lut[li + 2]; data[o + 3] = 255;
    }
  }
  const x0 = sx.map(m.x[0]), x1 = sx.map(m.x[1]), y0 = sy.map(m.y[0]), y1 = sy.map(m.y[1]);
  return { k: "image", x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0), cols, rows, data, zDomain: [lo, hi] };
}

/** Polyline segments, breaking at non-finite or off-scale samples. */
function segments(xs, ys, sx, sy) {
  const out = [];
  let cur = [];
  for (let i = 0; i < xs.length; i++) {
    const px = sx.map(xs[i]), py = sy.map(ys[i]);
    if (Number.isFinite(px) && Number.isFinite(py)) cur.push([px, py]);
    else if (cur.length) { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  return out;
}

function stepPath(xs, ys, sx, sy) {
  const pts = [];
  for (let i = 0; i < xs.length; i++) {
    const px = sx.map(xs[i]), py = sy.map(ys[i]);
    if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
    if (pts.length) pts.push([px, pts[pts.length - 1][1]]);
    pts.push([px, py]);
  }
  return pts;
}

export function legendEntries(spec) {
  if (!spec.legend) return [];
  return spec.marks.map((m, markIndex) => ({ m, markIndex })).filter(({ m }) => m.label)
    .map(({ m, markIndex }) => ({ markIndex, plain: m.label.plain, tex: m.label.tex, color: m.color, kind: m.type, dash: m.dash ?? null, layer: m.layer, focal: m.focal }));
}

/**
 * @param spec     figure() result
 * @param opts     { width, height, measure, fonts: { tick, label } }
 */
export function buildScene(spec, { width, height: requestedHeight = spec.height, measure, fonts, lit = [] }) {
  let height = requestedHeight;
  const litSet = new Set(lit); // marks a focused formula term points at (figure/lens.mjs): focal width, the others recede
  const tickFont = fonts.tick, labelFont = fonts.label;
  const tickPx = parsePx(tickFont);
  const legend = legendEntries(spec);
  const xDef = spec.x, yDef = spec.y;

  const pass = (plotW, plotH) => {
    const sx = makeScale(xDef.scale, [0, plotW]), sy = makeScale(yDef.scale, [plotH, 0]);
    return { xt: axisTicks(xDef, sx, measure, tickFont, plotW, false), yt: axisTicks(yDef, sy, measure, tickFont, plotH, true) };
  };
  const solve = (t) => solveLayout({ width, height, measure, font: tickFont, xTicks: t.xt.labels, yTicks: t.yt.labels,
    xLabel: xDef.label, yLabel: yDef.label, legend, aspect: spec.aspect, maxPlotWidth: spec.maxPlotWidth ?? Infinity, minLeft: spec.minLeft ?? 0 });
  let layout = solve(pass(Math.max(60, width - 56), Math.max(60, height - 70)));
  let t = pass(layout.plot.w, layout.plot.h);
  layout = solve(t);
  t = pass(layout.plot.w, layout.plot.h);
  const { plot } = layout;
  height = layout.height;

  const sx = makeScale(xDef.scale, [plot.x, plot.x + plot.w]);
  const sy = makeScale(yDef.scale, [plot.y + plot.h, plot.y]);
  const prims = [], texts = [], overlays = [];
  // Annotation labels (rules, regions, callouts) are nudged apart so none overlap another.
  const placed = [];
  const boxOf = (o) => {
    const w = Math.ceil(measure(o.text, tickFont) * (o.tex ? 1.15 : 1)), h = Math.ceil(o.size * 1.35);
    const x = o.align === "left" ? o.x : o.align === "right" ? o.x - w : o.x - w / 2;
    const y = o.base === "top" ? o.y : o.base === "bottom" ? o.y - h : o.y - h / 2;
    return { x, y, w, h };
  };
  const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const text = (o) => {
    if (o.role === "region" || o.role === "rule" || o.role === "callout") {
      let box = boxOf(o);
      // Keep the label inside the plot; one wider than the plot is left to the summary and the legend.
      if (box.w > plot.w - 4) return;
      if (box.x + box.w > plot.x + plot.w - 2) { o.x -= box.x + box.w - (plot.x + plot.w - 2); box = boxOf(o); }
      if (box.x < plot.x + 2) { o.x += plot.x + 2 - box.x; box = boxOf(o); }
      for (let tries = 0; tries < 8 && placed.some((p) => hit(box, p)); tries++) {
        o.y += o.base === "bottom" ? -(box.h + 2) : box.h + 2;
        box = boxOf(o);
      }
      placed.push(box);
    }
    texts.push(o);
    if (o.tex) overlays.push(o);
  };

  // ---- under-layers: heatmaps and regions
  spec.marks.forEach((m, i) => {
    if (m.type === "heatmap") {
      const img = { ...heatImage(m, sx, sy), mark: i };
      prims.push(img);
      const bar = colorbar(m, img.zDomain);
      const bx = plot.x + plot.w - 14, by = plot.y + 8;
      prims.push({ k: "rect", x: bx - 46, y: by - 6, w: 58, h: 68, c: "surface-0", a: 0.8, role: "colorbar" });
      prims.push({ k: "image", x: bx, y: by, w: 8, h: 56, cols: 1, rows: bar.rows, data: bar.data, role: "colorbar", mark: i });
      text({ x: bx - 4, y: by, text: formatTicks([img.zDomain[1]])[0], align: "right", base: "middle", c: "ink-dim", a: 1, size: tickPx, role: "colorbar" });
      text({ x: bx - 4, y: by + 56, text: formatTicks([img.zDomain[0]])[0], align: "right", base: "middle", c: "ink-dim", a: 1, size: tickPx, role: "colorbar" });
    }
    if (m.type === "region") {
      const x0 = m.x ? sx.map(m.x[0]) : plot.x, x1 = m.x ? sx.map(m.x[1]) : plot.x + plot.w;
      const y0 = m.y ? sy.map(m.y[0]) : plot.y + plot.h, y1 = m.y ? sy.map(m.y[1]) : plot.y;
      const r = { k: m.style === "fill" ? "rect" : "hatch", x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0), c: m.color, a: m.style === "fill" ? 0.14 : 0.22, mark: i, role: "region" };
      prims.push(r);
      if (m.text) text({ x: r.x + 6, y: r.y + 4, text: m.text.plain, tex: m.text.tex, align: "left", base: "top", c: "ink-dim", a: 1, size: tickPx, role: "region" });
    }
  });

  // ---- grid, ticks, axes
  const xs = t.xt.values.map((v) => sx.map(v)), ys = t.yt.values.map((v) => sy.map(v));
  const keepX = thin(xs, t.xt.labels.map((l) => Math.ceil(measure(l, tickFont))));
  const keepY = thin(ys, t.yt.labels.map(() => layout.lineH), 2);
  const grid = (kind, x1, y1, x2, y2) => prims.push({ k: "line", pts: [[x1, y1], [x2, y2]], c: "ink-faint", a: kind === "minor" ? 0.14 : 0.3, w: 1, role: "grid" });
  keepX.forEach((i) => grid("major", xs[i], plot.y, xs[i], plot.y + plot.h));
  keepY.forEach((i) => grid("major", plot.x, ys[i], plot.x + plot.w, ys[i]));
  prims.push({ k: "line", pts: [[plot.x, plot.y], [plot.x, plot.y + plot.h], [plot.x + plot.w, plot.y + plot.h]], c: "ink-dim", a: 0.7, w: 1, role: "axis" });
  keepX.forEach((i) => {
    prims.push({ k: "line", pts: [[xs[i], plot.y + plot.h], [xs[i], plot.y + plot.h + TICK_LENGTH]], c: "ink-dim", a: 0.7, w: 1, role: "tick" });
    text({ x: xs[i], y: plot.y + plot.h + TICK_LENGTH + TICK_GAP, text: t.xt.labels[i], align: "center", base: "top", c: "ink-dim", a: 1, size: tickPx, role: "xtick" });
  });
  keepY.forEach((i) => {
    prims.push({ k: "line", pts: [[plot.x - TICK_LENGTH, ys[i]], [plot.x, ys[i]]], c: "ink-dim", a: 0.7, w: 1, role: "tick" });
    text({ x: plot.x - TICK_LENGTH - TICK_GAP, y: ys[i], text: t.yt.labels[i], align: "right", base: "middle", c: "ink-dim", a: 1, size: tickPx, role: "ytick" });
  });
  for (const v of t.xt.minor) { const x = sx.map(v); prims.push({ k: "line", pts: [[x, plot.y + plot.h], [x, plot.y + plot.h + 2]], c: "ink-dim", a: 0.5, w: 1, role: "tick" }); }
  for (const v of t.yt.minor) { const y = sy.map(v); prims.push({ k: "line", pts: [[plot.x - 2, y], [plot.x, y]], c: "ink-dim", a: 0.5, w: 1, role: "tick" }); }

  // ---- marks
  const focalIndex = spec.marks.findIndex((m) => m.focal);
  const level = (i) => (litSet.size ? (litSet.has(i) ? 1 : LIT_DIM) : (focalIndex < 0 || i === focalIndex ? 1 : 0.72)) * spec.marks[i].alpha; // one ink level below the focal mark
  spec.marks.forEach((m, i) => {
    const a = level(i);
    if (m.type === "band") {
      const upper = segments(m.x, m.y1, sx, sy)[0] ?? [];
      const lower = (segments(m.x, m.y0, sx, sy)[0] ?? []).reverse();
      if (upper.length && lower.length) prims.push({ k: "poly", pts: [...upper, ...lower], c: m.color, a: m.opacity, mark: i });
    } else if (m.type === "line" || m.type === "step") {
      const segs = m.type === "step" ? [stepPath(m.x, m.y, sx, sy)] : segments(m.x, m.y, sx, sy);
      for (const pts of segs) if (pts.length > 1) prims.push({ k: "line", pts, c: m.color, a, w: litSet.has(i) ? Math.max(m.width, LIT_WIDTH) : m.width * (i === focalIndex ? 1.15 : 1), dash: m.dash, emitter: !!m.emitter, mark: i, role: "data" });
    } else if (m.type === "points") {
      m.x.forEach((xv, j) => {
        const px = sx.map(xv), py = sy.map(m.y[j]);
        if (!Number.isFinite(px) || !Number.isFinite(py)) return;
        if (m.yErr) prims.push({ k: "line", pts: [[px, sy.map(m.y[j] - m.yErr[0][j])], [px, sy.map(m.y[j] + m.yErr[1][j])]], c: m.color, a, w: 1.2, mark: i, role: "err" });
        if (m.xErr) prims.push({ k: "line", pts: [[sx.map(xv - m.xErr[0][j]), py], [sx.map(xv + m.xErr[1][j]), py]], c: m.color, a, w: 1.2, mark: i, role: "err" });
        const sh = Array.isArray(m.shape) ? m.shape[j] : m.shape;
        const r = m.radius + (litSet.has(i) ? LIT_RADIUS_GAIN : 0);
        if (sh === "triangle-up") prims.push({ k: "poly", pts: [[px - r, py + r * 0.8], [px, py - r], [px + r, py + r * 0.8]], c: m.color, a, mark: i });
        else if (sh === "triangle-down") prims.push({ k: "poly", pts: [[px - r, py - r * 0.8], [px, py + r], [px + r, py - r * 0.8]], c: m.color, a, mark: i });
        else prims.push({ k: "circle", x: px, y: py, r, c: m.color, a, mark: i });
      });
    } else if (m.type === "rule") {
      const v = (m.axis === "x" ? sx : sy).map(m.value);
      if (!Number.isFinite(v)) return;
      const pts = m.axis === "x" ? [[v, plot.y], [v, plot.y + plot.h]] : [[plot.x, v], [plot.x + plot.w, v]];
      prims.push({ k: "line", pts, c: m.color, a: litSet.has(i) ? 1 : Math.min(a, 0.8), w: litSet.has(i) ? LIT_WIDTH : 1.2, dash: m.dash, mark: i, role: "rule" });
      if (m.text) {
        const right = m.axis === "x" ? v + 4 + texExtent(m.text.plain, measure, tickFont) > plot.x + plot.w : false;
        text(m.axis === "x"
          ? { x: right ? v - 4 : v + 4, y: plot.y + 4, text: m.text.plain, tex: m.text.tex, align: right ? "right" : "left", base: "top", c: m.color, a: 1, size: tickPx, role: "rule" }
          : { x: plot.x + plot.w - 4, y: v - 3, text: m.text.plain, tex: m.text.tex, align: "right", base: "bottom", c: m.color, a: 1, size: tickPx, role: "rule" });
      }
    } else if (m.type === "callout") {
      const px = sx.map(m.x), py = sy.map(m.y);
      if (!Number.isFinite(px) || !Number.isFinite(py)) return;
      const w = m.text ? texExtent(m.text.plain, measure, tickFont) : 0;
      const tx = Math.min(plot.x + plot.w - 2, Math.max(plot.x + 2, px + m.dx)), ty = Math.min(plot.y + plot.h - 2, Math.max(plot.y + 2, py + m.dy));
      const room = (side) => (side === "left" ? plot.x + plot.w - (tx + 3) : tx - 3 - plot.x);
      const align = m.dx < 0 ? (room("right") >= w || room("right") >= room("left") ? "right" : "left") : (room("left") >= w || room("left") >= room("right") ? "left" : "right");
      prims.push({ k: "circle", x: px, y: py, r: 2.5, c: m.color, a: 1, mark: i });
      prims.push({ k: "line", pts: [[px, py], [tx, ty]], c: m.color, a: 0.8, w: 1, mark: i, role: "leader" });
      if (m.text) {
        const anchorX = align === "left" ? Math.min(tx + 3, plot.x + plot.w - w) : Math.max(tx - 3, plot.x + w);
        text({ x: anchorX, y: ty, text: m.text.plain, tex: m.text.tex, align, base: ty < py ? "bottom" : "top", c: m.color, a: 1, size: tickPx, role: "callout" });
      }
    }
  });

  // ---- axis titles and legend
  if (xDef.label && layout.xLabelBox) {
    const b = layout.xLabelBox;
    text({ x: b.x + b.w / 2, y: b.y + b.h / 2, text: xDef.label.plain, tex: xDef.label.tex, align: "center", base: "middle", c: "ink", a: 1, size: parsePx(labelFont), role: "xlabel" });
  }
  if (yDef.label && layout.yLabelBox) {
    const b = layout.yLabelBox;
    text({ x: b.x + b.w / 2, y: b.y + b.h / 2, text: yDef.label.plain, tex: yDef.label.tex, align: "center", base: "middle", c: "ink", a: 1, size: parsePx(labelFont), rotate: -90, role: "ylabel" });
  }
  if (layout.legend) {
    layout.legend.rows.forEach((row, r) => row.forEach((slot) => {
      const e = legend[slot.index];
      const x = layout.legend.x + slot.x, y = layout.legend.y + r * 18 + 9;
      prims.push(e.kind === "points" ? { k: "circle", x: x + 9, y, r: 3, c: e.color, a: 1, role: "legend" }
        : e.kind === "band" ? { k: "rect", x, y: y - 4, w: 18, h: 8, c: e.color, a: 0.3, role: "legend" }
        : { k: "line", pts: [[x, y], [x + 18, y]], c: e.color, a: 1, w: 2, dash: e.dash, role: "legend" });
      text({ x: x + 24, y, text: e.plain, tex: e.tex, align: "left", base: "middle", c: "ink", a: 1, size: tickPx, role: "legend" });
    }));
  }

  const first = spec.marks.find((m) => m.focal) ?? spec.marks.find((m) => ["line", "step", "points"].includes(m.type));
  return {
    width, height, layout, plot, prims, texts, overlays, sx, sy, legend,
    focal: first ? { mark: spec.marks.indexOf(first), x: first.x, y: first.y, label: first.label?.plain ?? first.id ?? first.type } : null,
    clip: { x: plot.x, y: plot.y, w: plot.w, h: plot.h },
  };
}
