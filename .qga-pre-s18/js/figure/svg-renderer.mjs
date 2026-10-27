// SVG renderer: paints a scene (scene.mjs) to an SVG string, for S32 export and for tests.
// Colours resolve through the same design tokens as the canvas renderer.

import { css as tokenCss, rgb255 } from "../design/tokens.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const n = (v) => Number(v.toFixed(2));

const css = (c) => tokenCss(c);

const BASE = { start: "start", left: "start", center: "middle", right: "end" };

/** Run-length merge a row of an image into rects (keeps heat maps compact without a PNG encoder). */
function imageRects(p) {
  const out = [];
  const cw = p.w / p.cols, ch = p.h / p.rows;
  for (let r = 0; r < p.rows; r++) {
    let c = 0;
    while (c < p.cols) {
      const o = (r * p.cols + c) * 4;
      const key = `${p.data[o]},${p.data[o + 1]},${p.data[o + 2]}`;
      const fill = rgb255(p.data[o], p.data[o + 1], p.data[o + 2]);
      let e = c + 1;
      while (e < p.cols) { const q = (r * p.cols + e) * 4; if (`${p.data[q]},${p.data[q + 1]},${p.data[q + 2]}` !== key) break; e++; }
      out.push(`<rect x="${n(p.x + c * cw)}" y="${n(p.y + r * ch)}" width="${n((e - c) * cw + 0.4)}" height="${n(ch + 0.4)}" fill="${fill}"/>`);
      c = e;
    }
  }
  return out.join("");
}

export function renderSvg(scene, spec, { fonts, title = spec.title, desc = "" } = {}) {
  const { width, height, clip } = scene;
  const clipId = `clip-${spec.id}`;
  const defs = `<defs><clipPath id="${esc(clipId)}"><rect x="${n(clip.x)}" y="${n(clip.y)}" width="${n(clip.w)}" height="${n(clip.h)}"/></clipPath>` +
    `<pattern id="hatch-${esc(spec.id)}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${css("ink-dim")}" stroke-width="1.5"/></pattern></defs>`;
  const parts = [];
  for (const p of scene.prims) {
    const clipped = p.role === "data" || p.role === "err" || p.k === "poly" || p.k === "image" || p.k === "hatch" || p.role === "rule" || p.role === "leader" ? ` clip-path="url(#${esc(clipId)})"` : "";
    if (p.k === "line") {
      const d = p.pts.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join("");
      parts.push(`<path d="${d}" fill="none" stroke="${css(p.c)}" stroke-opacity="${n(p.a)}" stroke-width="${n(p.w)}"${p.dash ? ` stroke-dasharray="${esc(p.dash)}"` : ""} stroke-linejoin="round" stroke-linecap="round"${clipped}/>`);
    } else if (p.k === "poly") {
      parts.push(`<path d="${p.pts.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join("")}Z" fill="${css(p.c)}" fill-opacity="${n(p.a)}" stroke="none"${clipped}/>`);
    } else if (p.k === "circle") {
      parts.push(`<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(p.r)}" fill="${css(p.c)}" fill-opacity="${n(p.a)}"/>`);
    } else if (p.k === "rect") {
      parts.push(`<rect x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" fill="${css(p.c)}" fill-opacity="${n(p.a)}"/>`);
    } else if (p.k === "hatch") {
      parts.push(`<rect x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" fill="url(#hatch-${esc(spec.id)})" fill-opacity="${n(p.a * 2)}"${clipped}/>`);
    } else if (p.k === "image") {
      parts.push(`<g${clipped}>${imageRects(p)}</g>`);
    }
  }
  for (const t of scene.texts) {
    const anchor = BASE[t.align] ?? "start";
    const dy = t.base === "middle" ? "0.35em" : t.base === "top" ? "0.8em" : "0";
    const rot = t.rotate ? ` transform="rotate(${t.rotate} ${n(t.x)} ${n(t.y)})"` : "";
    parts.push(`<text x="${n(t.x)}" y="${n(t.y)}" dy="${dy}" text-anchor="${anchor}" font-size="${n(t.size)}" fill="${css(t.c)}" fill-opacity="${n(t.a)}"${rot}>${esc(t.text)}</text>`);
  }
  const font = fonts?.family ?? "monospace";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(title)}" font-family="${esc(font)}" style="font-variant-numeric:tabular-nums">` +
    `<title>${esc(title)}</title>${desc ? `<desc>${esc(desc)}</desc>` : ""}${defs}${parts.join("")}</svg>`;
}
