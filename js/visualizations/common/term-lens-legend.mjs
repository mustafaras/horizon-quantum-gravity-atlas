/*
 * Formula Lens legend (S10): the key that appears while a field term is painted over a surface.
 *
 * legendModel() is pure and covered in Node. createLensLegend() builds the DOM element from it (text through
 * textContent only, KaTeX for the term's TeX, the colour bar painted from the Figure Kit ramp so the legend and
 * the plots of the atlas share one set of palettes).
 */

import { colorbarBytes } from "../../figure/scene.mjs";
import { texToPlain } from "../../figure/spec.mjs";
import { formatTermValue, termExpr, termUnit } from "../../formula/lens.mjs";
import { KATEX_OPTIONS, toTeX } from "../../formula/to-tex.mjs";

const BAR_ROWS = 32;
const DEFAULT_PALETTE = "viridis";

/** Everything the legend says, as plain data. `note` is the scene's own statement of what is schematic. */
export function legendModel({ formula, termId, target, note }) {
  const [lo, hi] = target.range;
  const isWholeFormula = formula.expr.op === "term" && formula.expr.id === termId;
  const symbolTex = isWholeFormula && formula.output.tex ? formula.output.tex : termId;
  const unitSymbol = termUnit(formula, termId);
  const unit = unitSymbol === "1" ? "dimensionless" : unitSymbol;
  const min = formatTermValue(lo), max = formatTermValue(hi);
  return Object.freeze({
    termId,
    tex: `${symbolTex} = ${toTeX(termExpr(formula, termId), formula.symbols)}`,
    min, max, unit,
    palette: target.palette === "diverging" ? "diverging" : (target.paletteName ?? DEFAULT_PALETTE),
    status: formula.status,
    note,
    ariaLabel: `Colour scale for ${texToPlain(symbolTex)}: from ${min} to ${max}, ${unit}. ${formula.status}; ${note}`,
  });
}

function element(document, tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function paintBar(document, palette) {
  const canvas = element(document, "canvas", "lens-legend-bar");
  canvas.width = 1;
  canvas.height = BAR_ROWS;
  canvas.setAttribute("aria-hidden", "true");
  const context = canvas.getContext("2d");
  context.putImageData(new ImageData(colorbarBytes(palette, BAR_ROWS), 1, BAR_ROWS), 0, 0);
  return canvas;
}

/**
 * The legend element, hidden until show(). Pass `katex` (window.katex) to typeset the term; without it the
 * TeX source is shown as text.
 */
export function createLensLegend({ document, model, katex = globalThis.katex }) {
  const root = element(document, "div", "lens-legend");
  root.hidden = true;
  root.setAttribute("role", "img");
  root.setAttribute("aria-label", model.ariaLabel);
  root.dataset.termLensLegend = model.termId;

  const equation = element(document, "div", "lens-legend-eq");
  let typeset = false;
  if (katex) {
    try { katex.render(model.tex, equation, { ...KATEX_OPTIONS, throwOnError: true }); typeset = true; }
    catch (error) { typeset = false; }
  }
  if (!typeset) equation.textContent = model.tex;

  const scale = element(document, "div", "lens-legend-scale");
  scale.append(element(document, "span", "lens-legend-max", model.max), element(document, "span", "lens-legend-min", model.min));
  const body = element(document, "div", "lens-legend-body");
  body.append(paintBar(document, model.palette), scale);

  root.append(
    equation, body,
    element(document, "div", "lens-legend-unit", model.unit),
    element(document, "div", "lens-legend-note", `${model.status} · ${model.note}`),
  );
  return {
    element: root,
    show() { root.hidden = false; },
    hide() { root.hidden = true; },
    dispose() { root.remove(); },
  };
}
