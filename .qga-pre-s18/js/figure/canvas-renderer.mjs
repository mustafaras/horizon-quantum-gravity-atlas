// Canvas renderer: HiDPI paint of a scene (scene.mjs). Colours come from the design tokens at
// paint time, so `qga:theme` only needs a repaint. Maths is never drawn here: text with `tex`
// is typeset by the KaTeX overlay and skipped.

import { css, alpha } from "../design/tokens.mjs";

const ALIGN = { left: "left", center: "center", right: "right" };

/** Size the backing store to the CSS box at devicePixelRatio and return a ready context. */
export function prepareCanvas(canvas, width, height, dpr = Math.min(2, globalThis.devicePixelRatio || 1)) {
  const w = Math.round(width * dpr), h = Math.round(height * dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  return ctx;
}

function strokeColor(p) {
  return p.a >= 1 ? css(p.c) : alpha(p.c, Number(p.a.toFixed(3)));
}

function drawImagePrim(ctx, p, scratch) {
  const cv = scratch.canvas ?? (scratch.canvas = document.createElement("canvas"));
  if (cv.width !== p.cols || cv.height !== p.rows) { cv.width = p.cols; cv.height = p.rows; }
  const g = cv.getContext("2d");
  g.putImageData(new ImageData(p.data, p.cols, p.rows), 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = p.cols * p.rows > 4 * p.w * p.h ? true : false;
  ctx.drawImage(cv, p.x, p.y, p.w, p.h);
  ctx.restore();
}

function hatchPattern(ctx, c) {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 8;
  const g = tile.getContext("2d");
  g.strokeStyle = css(c);
  g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(0, 8); g.lineTo(8, 0); g.moveTo(-2, 2); g.lineTo(2, -2); g.moveTo(6, 10); g.lineTo(10, 6); g.stroke();
  return ctx.createPattern(tile, "repeat");
}

/**
 * Paint `scene` onto `ctx` (already prepared). Colours resolve through the live design tokens;
 * `fonts.tick` is the ctx.font string for tick labels.
 */
export function drawScene(ctx, scene, { fonts, scratch = {} }) {
  const { clip } = scene;
  for (const p of scene.prims) {
    const clipped = p.role === "data" || p.role === "err" || p.k === "poly" || p.k === "image" || p.k === "hatch" || p.role === "rule" || p.role === "leader";
    if (clipped) { ctx.save(); ctx.beginPath(); ctx.rect(clip.x, clip.y, clip.w, clip.h); ctx.clip(); }
    if (p.k === "image") drawImagePrim(ctx, p, scratch);
    else if (p.k === "hatch") {
      ctx.globalAlpha = p.a * 2;
      ctx.fillStyle = hatchPattern(ctx, p.c);
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.globalAlpha = 1;
    } else if (p.k === "poly") {
      ctx.beginPath();
      p.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = strokeColor(p);
      ctx.fill();
    } else if (p.k === "line") {
      ctx.beginPath();
      p.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = strokeColor(p);
      ctx.lineWidth = p.w;
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.setLineDash(p.dash ? p.dash.split(/\s+/).map(Number) : []);
      // Glow belongs to physical emitters only (art direction: light is data, never text or axes).
      if (p.emitter) { ctx.shadowColor = alpha(p.c, 0.55); ctx.shadowBlur = 6; }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);
    } else if (p.k === "circle") {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor(p); ctx.fill();
    } else if (p.k === "rect") {
      ctx.fillStyle = strokeColor(p); ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    if (clipped) ctx.restore();
  }
  ctx.font = fonts.tick;
  for (const t of scene.texts) {
    if (t.tex) continue; // typeset by the KaTeX overlay
    ctx.save();
    ctx.fillStyle = strokeColor(t);
    ctx.textAlign = ALIGN[t.align] ?? "left";
    ctx.textBaseline = t.base === "top" ? "top" : t.base === "bottom" ? "bottom" : "middle";
    if (t.rotate) { ctx.translate(t.x, t.y); ctx.rotate((t.rotate * Math.PI) / 180); ctx.fillText(t.text, 0, 0); }
    else ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }
}

/** A measure function backed by a 2D context (cached per font string and text). */
export function canvasMeasure(ctx) {
  const cache = new Map();
  return (text, font) => {
    const key = `${font}|${text}`;
    let w = cache.get(key);
    if (w === undefined) {
      ctx.save(); ctx.font = font; w = ctx.measureText(text).width; ctx.restore();
      if (cache.size < 2000) cache.set(key, w);
    }
    return w;
  };
}
