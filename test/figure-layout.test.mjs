import test from "node:test";
import assert from "node:assert/strict";
import { solveLayout, layoutLegend, MIN_PLOT } from "../js/figure/layout.mjs";

const FONT = '10.42px "IBM Plex Mono", monospace';
const measure = (text) => text.length * 6.25;

const base = { measure, font: FONT, xTicks: ["0", "300", "600", "900", "1200"], yTicks: ["0.0", "0.5", "1.0"],
  xLabel: { plain: "L / E [km / GeV]" }, yLabel: { plain: "probability" } };

test("layout fits from 320 to 1440 px with nothing outside the box", () => {
  for (const width of [320, 375, 480, 640, 768, 1024, 1200, 1440]) {
    const height = 260;
    const l = solveLayout({ ...base, width, height, legend: [{ plain: "P(nu_mu -> nu_mu) survival", tex: "P(\\nu)" }, { plain: "appearance" }] });
    const { plot } = l;
    assert.ok(plot.x >= 0 && plot.y >= 0 && plot.x + plot.w <= width && plot.y + plot.h <= height, `plot inside at ${width}`);
    assert.ok(plot.w >= MIN_PLOT || width < MIN_PLOT + 80, `plot width ${plot.w} at ${width}`);
    // y tick labels fit left of the axis; the x label sits under the tick labels; the legend under the x label
    assert.ok(plot.x >= 4 + 3 * 6.25 + 4, "room for y tick labels");
    assert.ok(l.xLabelBox.y >= plot.y + plot.h + 8 && l.xLabelBox.y + l.xLabelBox.h <= l.legend.y);
    assert.ok(l.legend.y + l.legend.height <= height, `legend inside at ${width}`);
    assert.ok(l.yLabelBox.x + l.yLabelBox.w <= plot.x - 3 * 6.25, "y title clears tick labels");
    assert.ok(l.legend.maxWidth <= width);
  }
});

test("margins follow measured label widths", () => {
  const narrow = solveLayout({ ...base, width: 600, height: 240, yTicks: ["0", "1"] });
  const wide = solveLayout({ ...base, width: 600, height: 240, yTicks: ["−1.0×10⁻⁷", "1.0×10⁻⁷"] });
  assert.ok(wide.margins.left - narrow.margins.left >= 8 * 6.25, "wide tick labels widen the left margin");
  const edge = solveLayout({ ...base, width: 600, height: 240, xTicks: ["0", "1 000 000 000"] });
  assert.ok(edge.margins.right >= 6.25 * 13 / 2, "last x label does not clip on the right");
});

test("legend wraps and is content-sized", () => {
  const entries = Array.from({ length: 6 }, (_, i) => ({ plain: `series number ${i}` }));
  const wide = layoutLegend(entries, 2000, measure, FONT);
  const tight = layoutLegend(entries, 260, measure, FONT);
  assert.equal(wide.rows.length, 1);
  assert.ok(tight.rows.length > 2 && tight.height === tight.rows.length * 18);
  for (const row of tight.rows) assert.ok(row.at(-1).x + row.at(-1).w <= 260 + 1, "no entry past the right edge");
  assert.equal(layoutLegend([{ plain: "a" }], 100, measure, FONT).rows[0][0].w < layoutLegend([{ plain: "a much longer label" }], 400, measure, FONT).rows[0][0].w, true);
});

test("invalid sizes are rejected", () => {
  assert.throws(() => solveLayout({ ...base, width: 0, height: 100 }), RangeError);
});
