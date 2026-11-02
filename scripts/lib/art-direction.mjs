// Art-direction checks (S36 release gate), run by `npm run validate`:
//   1. the 10 px text floor (docs/design/art-direction.md): no CSS font-size below 10 px in styles/, and no
//      tokens monoPx/bodyPx/headPx(<10) or inline fontSize below 10 in js/;
//   2. no blurred text-shadow on the figure text classes .axis, .label and .readout;
//   3. 2D plots go through the Figure Kit: every canvas getContext("2d") in js/ is on CANVAS_2D_ALLOWLIST with the
//      reason it is not a plot (a texture, a thumbnail, the kit itself), so a new hand-drawn plot fails here.
// The colour-literal rule is token-lint (S02); one focal mark per figure is enforced by figure() in js/figure/spec.mjs
// and tested in test/art-direction.test.mjs; layer tags on scene objects are checked in the browser by
// qa/specs/provenance-layers.spec.mjs. Pure apart from reading the tree.

import fs from "node:fs";
import path from "node:path";

export const TEXT_FLOOR_PX = 10;
const FIGURE_TEXT_CLASS = /\.(axis|label|readout)(?![\w-])/;

/** file -> number of getContext("2d") sites allowed, and why each is not a plot. */
export const CANVAS_2D_ALLOWLIST = Object.freeze({
  "js/figure/canvas-renderer.mjs": { sites: 3, reason: "the Figure Kit's own canvas renderer" },
  "js/figure/Figure.jsx": { sites: 1, reason: "text measurement for the kit's layout" },
  "js/core.jsx": { sites: 1, reason: "the shared HiDPI canvas helper of the schematic (non-plot) panels" },
  "js/mod-experiments.jsx": { sites: 2, reason: "the strain oscilloscope kept by S09, and a halo ring texture" },
  "js/labs/amplitude-room.jsx": { sites: 1, reason: "the scattering-plane animation kept by S09 (schematic)" },
  "js/labs/atlas-map.jsx": { sites: 1, reason: "the atlas map graph (S29), a navigable diagram, not a plot" },
  "js/scene3d.jsx": { sites: 1, reason: "a radial glow sprite texture" },
  "js/visualizations/glow-texture.mjs": { sites: 3, reason: "glow sprite textures" },
  "js/visualizations/gr/curvature-engine.mjs": { sites: 1, reason: "a radial gradient texture" },
  "js/visualizations/gr/lensed-sky.mjs": { sites: 2, reason: "a per-pixel lensed-sky image and its sky table" },
  "js/visualizations/common/term-lens-legend.mjs": { sites: 1, reason: "the colour bar of the term-lens legend" },
  "js/snapshots/snapshot-panel.jsx": { sites: 1, reason: "snapshot thumbnails" },
  "js/render/render-session.mjs": { sites: 1, reason: "the last-frame snapshot of an evicted WebGL scene" },
});

function walk(root, dir, extensions) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && extensions.some((ext) => e.name.endsWith(ext)))
    .map((e) => path.relative(root, path.join(e.parentPath, e.name)).split(path.sep).join("/"))
    .sort();
}

const stripCssComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const lineOf = (text, index) => text.slice(0, index).split("\n").length;

/** Product JS: js/ minus the compiled mirror and the generated data that quotes the ledger as text. */
function productScripts(root) {
  return walk(root, "js", [".jsx", ".mjs"])
    .filter((f) => !f.startsWith("js/compiled/") && f !== "js/whitepaper/whitepaper-v2-data.mjs");
}

export function textFloorFindings(root) {
  const findings = [];
  for (const file of walk(root, "styles", [".css"])) {
    const css = stripCssComments(fs.readFileSync(path.join(root, file), "utf8"));
    for (const m of css.matchAll(/font-size\s*:\s*([0-9.]+)px/g)) {
      if (Number(m[1]) < TEXT_FLOOR_PX) findings.push(`${file}:${lineOf(css, m.index)} font-size ${m[1]}px is below the ${TEXT_FLOOR_PX} px floor`);
    }
  }
  for (const file of productScripts(root)) {
    const src = fs.readFileSync(path.join(root, file), "utf8");
    for (const m of src.matchAll(/\b(?:mono|body|head)Px\(\s*([0-9.]+)|\bfontSize:\s*([0-9.]+)\b/g)) {
      const px = Number(m[1] ?? m[2]);
      if (px < TEXT_FLOOR_PX) findings.push(`${file}:${lineOf(src, m.index)} text at ${px}px is below the ${TEXT_FLOOR_PX} px floor`);
    }
  }
  return findings;
}

/** True when a text-shadow value has a non-zero blur radius in any of its comma-separated layers. */
export function hasBlurredShadow(value) {
  if (/^\s*none\s*$/i.test(value)) return false;
  return value.split(/,(?![^(]*\))/).some((layer) => {
    const lengths = layer.replace(/\b(?:rgba?|hsla?|oklch|oklab|color|var)\([^)]*\)/gi, "").match(/-?[0-9.]+(?:px|em|rem)?/g) ?? [];
    return lengths.length >= 3 && parseFloat(lengths[2]) > 0;
  });
}

export function textShadowFindings(root) {
  const findings = [];
  for (const file of walk(root, "styles", [".css"])) {
    const css = stripCssComments(fs.readFileSync(path.join(root, file), "utf8"));
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = rule[1].trim();
      if (!FIGURE_TEXT_CLASS.test(selector)) continue;
      const shadow = rule[2].match(/text-shadow\s*:\s*([^;]+)/);
      if (shadow && hasBlurredShadow(shadow[1])) findings.push(`${file}:${lineOf(css, rule.index)} ${selector} has a blurred text-shadow`);
    }
  }
  return findings;
}

export function canvas2dFindings(root) {
  const counts = new Map();
  for (const file of productScripts(root)) {
    const n = (fs.readFileSync(path.join(root, file), "utf8").match(/getContext\(\s*["']2d["']/g) ?? []).length;
    if (n) counts.set(file, n);
  }
  const findings = [];
  for (const [file, n] of counts) {
    const allowed = CANVAS_2D_ALLOWLIST[file]?.sites ?? 0;
    if (n > allowed) findings.push(`${file} has ${n} canvas getContext("2d") site(s), ${allowed} allowed: draw plots with the Figure Kit, or add the site to CANVAS_2D_ALLOWLIST with the reason it is not a plot`);
  }
  for (const [file, { sites }] of Object.entries(CANVAS_2D_ALLOWLIST)) {
    if ((counts.get(file) ?? 0) < sites) findings.push(`CANVAS_2D_ALLOWLIST grants ${file} ${sites} site(s) it no longer uses; lower the count`);
  }
  return findings;
}

/** All art-direction findings, as strings for validate-repo's failure list. */
export function lintArtDirection(root) {
  return [...textFloorFindings(root), ...textShadowFindings(root), ...canvas2dFindings(root)];
}
