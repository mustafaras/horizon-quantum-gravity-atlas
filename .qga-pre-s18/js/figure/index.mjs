// Figure Kit public surface (exposed to the classic JSX runtime as window.QGA_FIGURE).

export { figure, axis, line, band, points, step, heatmap, rule, callout, region, resolveLabel, texToPlain } from "./spec.mjs";
export { buildScene, legendEntries } from "./scene.mjs";
export { prepareCanvas, drawScene, canvasMeasure } from "./canvas-renderer.mjs";
export { renderSvg } from "./svg-renderer.mjs";
export { createFigureLens, markIndexesFor } from "./lens.mjs";
export { figureSummary, dataTable, nearestIndex, zeroCrossings, decimate } from "./summary.mjs";
export { registerFigureProvenance, FIGURE_PROVENANCE } from "./provenance.mjs";
export * as plots from "./plots/index.mjs";
