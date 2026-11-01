/**
 * Vector figure export (S32).
 *
 * The Figure Kit already renders a scene to SVG (`js/figure/svg-renderer.mjs`); this module turns that string into a
 * publication artefact: journal width, light or dark theme, an optional figure number and caption, and a text run for
 * the provenance footer. It also writes the "data behind the figure" CSV, because a figure whose numbers cannot be
 * checked is a picture, not a result.
 *
 * What is vector and what is not, stated rather than hidden:
 *   - axes, ticks, gridlines, curves, bands, text and the legend are real SVG paths and text, so they stay sharp at any
 *     zoom and remain selectable in a vector editor;
 *   - a heat map mark stays a grid of `<rect>` elements. It is genuinely raster data, so it is embedded at the plot's
 *     own resolution rather than traced into a false vector shape;
 *   - typeset mathematics in the exported SVG uses the vendored KaTeX woff2 faces through an `@font-face` block naming
 *     a relative path, which keeps the text editable. The alternative the prompt allows — converting KaTeX output to
 *     paths through MathML — is not taken here, because it would make every symbol an unselectable outline and lose
 *     the accessible text.
 */

import { css as tokenCss } from "../design/tokens.mjs";
import { buildExportEnvelope, fileTimestamp, ExportError } from "./export-service.mjs";

/** The two journal widths the prompt names, plus the on-screen width the Figure Kit already knows. */
export const FIGURE_WIDTHS_MM = Object.freeze({
  single: 85,
  double: 174,
});

/** Print is a real theme, not a lightness filter: the two differ in ink and in what they keep. */
export const FIGURE_STYLES = Object.freeze(["light", "dark"]);

const MM_PER_INCH = 25.4;
/** The Figure Kit lays out at CSS pixels; 96 px to the inch is the convention its text sizes assume. */
export const pxPerMm = (mm) => (mm / MM_PER_INCH) * 96;

/**
 * Where the vendored faces live, as a URL relative to the site root.
 *
 * An exported SVG saved at the root of this repository (or served from it) resolves `vendor/…` directly. A file moved
 * elsewhere keeps its text positions and selectable characters and simply falls back to a serif face — the layout
 * degrades, the data does not. Callers that know their own layout pass `base`.
 */
export const KATEX_FONT_BASE = "vendor/katex/fonts";

const KATEX_FACES = Object.freeze([
  ["KaTeX_Main-Regular.woff2", "KaTeX_Main", "normal", "normal"],
  ["KaTeX_Main-Bold.woff2", "KaTeX_Main", "bold", "normal"],
  ["KaTeX_Main-Italic.woff2", "KaTeX_Main", "normal", "italic"],
  ["KaTeX_Math-Italic.woff2", "KaTeX_Math", "normal", "italic"],
  ["KaTeX_AMS-Regular.woff2", "KaTeX_AMS", "normal", "normal"],
  ["KaTeX_Size1-Regular.woff2", "KaTeX_Size1", "normal", "normal"],
  ["KaTeX_Size2-Regular.woff2", "KaTeX_Size2", "normal", "normal"],
]);

/**
 * `@font-face` rules for the exported SVG.
 *
 * The relative URL is what makes the file portable: an SVG opened next to `vendor/` finds its faces, and an SVG whose
 * faces are missing still has correct text positions and selectable characters — the layout degrades, not the data.
 */
export function katexFontFaceCss({ base = KATEX_FONT_BASE } = {}) {
  return KATEX_FACES.map(([file, family, weight, style]) =>
    `@font-face{font-family:"${family}";src:url("${base}/${file}") format("woff2");font-weight:${weight};font-style:${style};}`
  ).join("");
}

/**
 * Rewrite the renderer's root `<svg>` to a physical size in millimetres and add the print scaffolding.
 *
 * The renderer emits pixel units with a viewBox; a journal wants `width="85mm"`. Setting both keeps the viewBox
 * coordinates (and therefore every plot geometry) untouched while the physical size changes.
 */
export function applyFigureFrame(svg, { widthMm, style, title, caption, figureNumber, footer }) {
  if (typeof svg !== "string" || !svg.startsWith("<svg")) throw new ExportError("not-supported", "The figure renderer did not return an SVG document.");
  const opened = /^<svg[^>]*>/.exec(svg);
  if (!opened) throw new ExportError("not-supported", "The figure SVG has no opening tag.");
  const tag = opened[0];
  const viewBox = /viewBox="([^"]+)"/.exec(tag);
  if (!viewBox) throw new ExportError("not-supported", "The figure SVG has no viewBox, so it cannot be scaled to a physical width.");
  const [, , vbWidth, vbHeight] = viewBox[1].split(/\s+/).map(Number);
  if (!(vbWidth > 0) || !(vbHeight > 0)) throw new ExportError("not-supported", "The figure SVG has an empty viewBox.");
  // The viewBox stays in the renderer's own coordinates; only the physical size is stated in millimetres, which is what
  // makes the file land at the journal's column width wherever it is placed.
  const heightMm = (vbHeight / vbWidth) * widthMm;
  const height = (vbHeight / vbWidth) * widthMm;

  const fontCss = katexFontFaceCss();
  // Light is the paper theme: white ground, near-black ink. Dark leaves the SVG transparent, so the figure takes the
  // page's own background and sits in the atlas without a white box around it.
  const bg = style === "light" ? tokenCss("surface-paper") : "none";
  const ink = style === "light" ? tokenCss("ink-paper") : "inherit";
  const header = figureNumber
    ? `<text x="0" y="-14" font-size="11" font-weight="bold" fill="${ink}" font-family="KaTeX_Main, serif">Figure ${escapeXml(figureNumber)}</text>`
    : "";
  const captionText = caption
    ? `<text x="0" y="${(height + 22).toFixed(2)}" font-size="10.5" fill="${ink}" font-family="KaTeX_Main, serif">${escapeXml(caption)}</text>`
    : "";
  const footerText = footer
    ? `<text x="0" y="${(height + (caption ? 38 : 22)).toFixed(2)}" font-size="8.5" fill="${ink}" fill-opacity="0.72" font-family="KaTeX_AMS, serif">${escapeXml(footer)}</text>`
    : "";
  const extraHeight = 16 + (caption ? 18 : 0) + (footer ? 16 : 0);
  const totalHeight = height + extraHeight;

  const body = svg
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthMm.toFixed(2)}mm" height="${(heightMm + 4).toFixed(2)}mm" `
    + `viewBox="0 -20 ${vbWidth} ${vbHeight + extraHeight + 4}" role="img" aria-label="${escapeXml(title)}">`
    + `<style>${fontCss}</style>`
    + (bg === "none" ? "" : `<rect x="0" y="-20" width="${vbWidth}" height="${vbHeight + extraHeight + 4}" fill="${bg}"/>`)
    + header + body + captionText + footerText
    + `</svg>`;
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/* ---------- CSV ---------- */

/** RFC 4180 quoting: a field is quoted only when it has to be, and an embedded quote is doubled. */
export function csvField(value) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * The "data behind the figure" CSV.
 *
 * A comment header carries the identity of the figure and its provenance id, so a spreadsheet and a sidecar cannot
 * drift apart: the same id is in both files and the hash in the sidecar covers these exact bytes.
 */
export function dataTableCsv({ figureId, columns, rows, notes = [], eol = "\n" } = {}) {
  if (!Array.isArray(columns) || columns.length === 0) throw new TypeError("a CSV needs at least one column");
  if (!Array.isArray(rows)) throw new TypeError("a CSV needs rows");
  const header = [
    `# HORIZON figure data: ${figureId}`,
    ...notes.map((note) => `# ${note}`),
  ];
  const body = [columns.map(csvField).join(","), ...rows.map((row) => row.map(csvField).join(","))];
  return `${header.join(eol)}${eol}${body.join(eol)}${eol}`;
}

/**
 * Build the pair that a figure export actually writes: the SVG, the CSV and the sidecar that binds them.
 *
 * `renderSvg` and `dataTable` are passed in rather than imported, so this module is testable without the Figure Kit's
 * layout engine and stays free of its DOM assumptions.
 */
export async function buildFigureExport({
  spec, scene, renderSvg, dataTable, provenance, references = [], state = {}, seed = 42,
  widthMm = FIGURE_WIDTHS_MM.double, style = "dark", caption = null, figureNumber = null,
  backend = "none (vector)", quality = "vector", commitHash = null, when = new Date(),
  dataNotes = [],
}) {
  if (!FIGURE_STYLES.includes(style)) throw new ExportError("not-supported", `Unknown figure style "${style}".`);
  if (!Object.values(FIGURE_WIDTHS_MM).includes(widthMm) && !(widthMm >= 40 && widthMm <= 250)) {
    throw new ExportError("not-supported", `Figure width must be one of ${Object.values(FIGURE_WIDTHS_MM).join(" or ")} mm, or between 40 and 250 mm; received ${widthMm}.`);
  }
  const raw = renderSvg(scene, spec, {});
  const envelope = buildExportEnvelope({
    view: spec.provenanceId ?? spec.id, kind: "figure", state, backend, quality,
    provenance, references, seed, commitHash, when,
    extras: { figureId: spec.id, widthMm, style },
  });
  const title = caption || spec.caption || spec.title;
  const footer = `HORIZON · ${spec.id} · provenance ${spec.provenanceId} · ${envelope.exportedAt} · seed ${envelope.seed}`;
  const svg = applyFigureFrame(raw, { widthMm, style, title, caption: caption ?? spec.caption ?? "", figureNumber, footer });

  const table = dataTable(spec);
  // A note that already carries a leading "#" would print a doubled comment marker, so the prefix is stripped first.
  const notes = [
    `figure: ${spec.id}`,
    `provenance: ${spec.provenanceId}`,
    `status: ${spec.status}`,
    `seed: ${envelope.seed}`,
    `exported: ${envelope.exportedAt}`,
    ...(table.truncated ? ["rows decimated for legibility; the figure draws the same samples"] : []),
    ...dataNotes.map((note) => String(note).replace(/^#\s*/, "")),
  ];
  const csv = dataTableCsv({ figureId: spec.id, columns: table.columns, rows: table.rows, notes });

  const stamp = fileTimestamp(when);
  return {
    envelope, svg, csv,
    files: {
      svg: `horizon-figure-${spec.id}-${stamp}.svg`,
      csv: `horizon-figure-${spec.id}-${stamp}.csv`,
      json: `horizon-figure-${spec.id}-${stamp}.json`,
    },
    rowCount: table.rows.length,
    truncated: table.truncated,
  };
}
