# Figure Kit (S09)

One dependency-free kit for every scientific 2D plot in the atlas. A figure is a plain description (axes, marks, status, provenance);
the canvas renderer paints it on screen and the SVG renderer writes the same drawing as a string (the source for S32 export). Closes finding F-06.

```text
js/figure/
  scale.mjs            linear, log, symlog: domain, range, map, invert, ticks
  ticks.mjs            Heckbert nice numbers in a 1-2-5 sequence, log decades with minor 2-9, 10^n and m x 10^n labels
  layout.mjs           margins solved from measured label extents (injected measure(text, font)); legend wrapping
  spec.mjs             figure(), axis(), line, band, points, step, heatmap, rule, callout, region; validation
  scene.mjs            buildScene(spec, { width, measure, fonts }) -> drawing primitives in CSS pixels
  canvas-renderer.mjs  HiDPI paint of a scene; colours through js/design/tokens.mjs
  svg-renderer.mjs     the same scene as an SVG string
  summary.mjs          figureSummary(), dataTable() (<= 200 decimated rows), nearestIndex(), zeroCrossings()
  provenance.mjs       one registered provenance entry per figure id
  plots/               pure builders, one per figure: controls in, figure() spec out (sm, bh, gr, rg, qft, gw)
  Figure.jsx           the React component; katex-overlay.jsx positions KaTeX over the canvas
```

Pure modules import in Node without a DOM; `test/figure-*.test.mjs` cover them.

## Writing a figure

```js
import { figure, axis, line, points, rule } from "../spec.mjs";

export function neutrinoOscillationSpec({ dm2, s22t }) {
  const le = grid(0, 1200, 300);                       // plots/sample.mjs
  return figure({
    id: "sm-neutrino-oscillation", title: "Neutrino oscillation probability",
    status: "established", provenanceId: "sm-neutrino-oscillation", height: 230,
    x: axis({ scale: { type: "linear", domain: [0, 1200] }, label: { tex: "L/E" }, unit: "km/GeV" }),
    y: axis({ scale: { type: "linear", domain: [0, 1] }, label: { text: "probability" } }),
    marks: [
      line({ x: le, y: survival, layer: "model", focal: true, color: "pigment-azure-80", label: { tex: "P(\\nu_\\mu\\to\\nu_\\mu)" } }),
      rule({ axis: "x", value: 490, layer: "data", text: { text: "T2K" } }),
    ],
  });
}
```

```jsx
const spec = useMemo(() => QGA_FIGURE.plots.sm.neutrinoOscillationSpec({ dm2, s22t }), [dm2, s22t]);
return <Figure spec={spec}>caption</Figure>;
```

Rules the validators enforce:

* **Layer.** Every mark is `data` or `model` (`decoration` is not a plot layer). **One focal mark at most**; it is drawn at full ink, every other mark one level lower (x0.72).
* **Status and provenance.** `status` is a scientific status label and `provenanceId` must exist in `js/figure/provenance.mjs` (tested for every builder).
* **Labels.** Axis labels are `{ tex }`, `{ text }` (ASCII words only: Greek letters and operators are rejected at construction) or `{ formula, symbol }`, which takes the TeX and unit from a Formula Core symbol declaration. Maths is typeset by KaTeX in a DOM overlay; the canvas never draws it.
* **Palettes.** Heat maps accept `viridis`, `magma`, `cividis` or `diverging`; rainbow maps are rejected. Bands are capped at 18 % fill. Colours are token names, never literals.
* **Glow** only with `emitter: true` on a line (a physical emitter: the Hawking flux).

## Axes and layout

Ticks are nice 1-2-5 numbers inside the domain; log axes label decades as 10^n and add minor ticks; negative, tiny and reversed ranges work; NaN is rejected. `solveLayout` reserves the left margin from the widest y label, keeps half of the last x label inside the box, wraps the legend, and the scene thins x labels until none touch. Annotation labels (rules, regions, callouts) are nudged apart, clamped inside the plot, or omitted when wider than the plot (the summary still names them). `aspect` makes a square plot (null geodesics, lensed sky, Kerr radii); `backdrop(ctx, plot)` paints an image under the scene (the lensed sky).

## Interaction and accessibility

* The plot box is a focusable `group` (role `slider` when `slider` is passed) described by a generated summary: title, status, both axes, then per series the range, extrema and zero crossings.
* Pointer move and arrow keys move a crosshair along the focal series; Home and End jump to its ends; Escape clears; the nearest-sample readout is a polite live region. Controlled variants: `onHover`, `onSelect`, `onNudge` (RG scale plot), `onScrub` (GW strain).
* The **Data** disclosure (44 px target) renders up to 200 evenly decimated rows.
* Figures repaint on `qga:theme`; motion is never added by the kit.

`qa/specs/figure-kit.spec.mjs` loads every migrated figure and, at 320, 480, 640, 768, 1024, 1200, 1280 and 1440 px, asserts no clipped label, no overlapping labels (canvas text measured with its font, KaTeX spans by their rectangles), the summary linked by `aria-describedby`, and the keyboard crosshair.

## Migrated figures

| Figure id | Where | Marks |
|---|---|---|
| `sm-neutrino-oscillation`, `sm-higgs-potential` | `mod-standard-model.jsx` | model lines, T2K rule, vacuum points and callout |
| `bh-hawking-spectrum`, `bh-page-curve`, `bh-kerr-radii` | `mod-blackholes.jsx` | emitter line and band; two curves and a rule; nested circles |
| `gr-effective-potential`, `gr-null-geodesics`, `gr-lensed-sky` | `mod-gr.jsx` | GR and Newtonian curves with turning points and a live marker; rays and circles; ring chrome over the rendered sky |
| `rg-scale-trajectory`, `rg-beta-function` | `mod-gauge-rg.jsx` | trajectory, fixed-point rules, selected-scale marker; beta curve with phase-line triangles |
| `qft-dispersion`, `qft-waterfall`, `qft-angular-distribution`, `qft-photon-cross-section`, `qft-z-resonance` | `mod-qft.jsx` | lines, diverging heat map, log axis |
| `experiments-dielectron-mass`, `gw-strain-generated` / `gw-strain-observation`, `gw-spectrogram` | `mod-experiments.jsx` | step and points with Poisson errors; ghost and revealed traces with phase bands; magma heat map with the chirp track |

Plot data come from the same functions as before (`js/physics.mjs`); `test/figure-plots.test.mjs` checks values against the closed forms.

## Not migrated

The live strain oscilloscope under the 3D inspiral (`GWStrainScope`), the scattering-plane polar diagram (`QFTScatterCanvas`), and the Feynman and causal-structure SVGs are diagrams or live scenes without data axes; they keep their own drawing (ledger D-044).
