# S09 — Figure Kit: One Scientific 2D Plotting System

> **Sequence 09 of 36.** Requires **S08** to be `done` in the ledger. Next: **S10**.
> **Closes findings:** F-06 (Every 2D plot hand-rolls axes, ticks and legends).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S09** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
2. Read `docs/design/art-direction.md` and `docs/render/performance-contract.md` if they exist (they are created by S02 and S04).
3. Run `npm ci`, `npm test` and `npm run validate`. If anything is red **before** your change, set the prompt to `blocked` with the failing output and stop.
4. Treat any uncommitted change you did not make as the user's work: do not modify or revert it.

## Rules that apply to every prompt
- Zero bundler, static GitHub Pages deployment, every runtime dependency self-hosted under `vendor/`, no CDN, no new npm runtime dependency.
- Science lives in pure ES modules under `js/science/` or `js/formula/`. They must import in Node without DOM, React, canvas or three.js, and are covered by `node:test` tests using `node:assert/strict`.
- New browser modules are ESM. Expose them to the classic JSX runtime only through `js/bootstrap.mjs` with the existing `Object.defineProperty(window, "QGA_…", …)` pattern.
- Every number shown on screen is computed by a pure, tested function or imported from `js/science/data/*.mjs`, with citation (DOI, arXiv id or URL), value, uncertainty and retrieval date. **Verify every value and citation in this prompt against the primary source.** If one disagrees, use the source, and record the difference in the ledger `decisions`.
- Randomness is seeded (`seededRng` in `js/physics.mjs`, or TSL `hash` on the GPU). No `Math.random` in any data, model or capture path.
- New GPU code is TSL (`three/tsl`) on node materials and must run on both the WebGPU backend and the node renderer's WebGL2 backend (CI runs Chromium with WebGPU disabled on SwiftShader). No new GLSL `ShaderMaterial`.
- Three.js is pinned at 0.186.1. Before using any three.js or TSL API, `grep` it in `vendor/three/build/three.webgpu.js`, `three.tsl.js` or `three.core.js` and read its implementation. Never code an API from memory.
- No per-frame allocations in render loops. Scenes render on demand through the shared stage (from S04/S05 on) and call `invalidate()` on change.
- New files ≤ 600 lines. `js/mod-*.jsx` files may only shrink: new labs go in `js/labs/`, scene code in `js/visualizations/<area>/`.
- Colours, fonts and durations come from tokens (`js/design/tokens.mjs`, `styles/tokens.css`) once S02 is done. 2D plots use the Figure Kit (`js/figure/`) once S09 is done. Equations come from Formula Core (`js/formula/`) once S03 is done.
- Every figure carries a status label and a registered provenance entry with layer classes (`data`, `model`, `decoration`). Schematic or conjectural content says so in-canvas.
- Accessibility: keyboard reachable, visible focus, 44 px touch targets, text alternatives, `prefers-reduced-motion` snaps instead of animating.
- Never refresh a visual baseline just to make a test pass. For each baseline you update, write a one-line justification in the ledger.
- If a required value, algorithm or API cannot be verified or reproduced, set the prompt to `blocked` with the exact reason and stop. Never substitute a fake visual or a tuned number.
- Edit only what this prompt needs.

## Goal
Every 2D plot in the atlas uses one dependency-free kit that implements the figure grammar in `docs/design/art-direction.md`, typesets every label with KaTeX, takes axis labels and units from Formula Core symbols, and renders to canvas (screen) and SVG (S32 export) from the same scene description.

## Steps
1. Pure layer (Node-tested):
   - `js/figure/scale.mjs`: `linear`, `log` and `symlog`, each with `domain`, `range`, `map`, `invert` and `ticks`;
   - `js/figure/ticks.mjs`: Heckbert nice numbers in a 1-2-5 sequence, log decades with minor 2–9, labels with `×10ⁿ` and tabular numerals, negative and tiny ranges, NaN rejection;
   - `js/figure/layout.mjs`: solve margins from measured label extents (injected `measure(text, font)`) so nothing clips from 320 px to 1440 px.
2. Scene description `js/figure/spec.mjs`:
   - `figure({ id, title, status, provenanceId, x: axis, y: axis, marks: [], legend, caption })`;
   - `axis({ scale, label: { formulaSymbol | tex }, unit })`;
   - marks: `line`, `band`, `points` (asymmetric error bars), `step`, `heatmap` (sequential/diverging palettes only), `rule` (labelled reference line), `callout` (leader line), `region` (hatched exclusion);
   - every mark has `layer: data | model` and `focal: bool` (at most one focal mark; validated).
3. Renderers:
   - `js/figure/canvas-renderer.mjs`: HiDPI, tokens via `js/design/tokens.mjs`, re-render on `qga:theme`;
   - `js/figure/svg-renderer.mjs`: same output as an SVG string;
   - `js/figure/katex-overlay.jsx`: positions KaTeX spans over the canvas for axis titles, legend math and callouts; canvas never draws Greek letters.
4. Interaction and accessibility:
   - crosshair with nearest-sample readout; keyboard arrows move along the focal series, Home/End jump;
   - `figureSummary(spec, data)` generates a text summary (series, ranges, extrema, zero crossings) used as `aria-describedby`;
   - a "Data" disclosure renders a table of up to 200 decimated rows.
5. `js/figure/Figure.jsx` React component that takes a spec plus data and mounts the canvas, overlay and summary.
6. Migrate every hand-rolled 2D plot:
   - neutrino oscillation, Higgs potential, Hawking spectrum, Page curve (`mod-standard-model.jsx`, `mod-blackholes.jsx`);
   - V_eff, null-geodesic orbital panel axes, lensed-sky frame chrome (`mod-gr.jsx`);
   - RG scale and β plots (`mod-gauge-rg.jsx`);
   - GW strain and spectrogram heatmap (`mod-experiments.jsx`);
   - QFT angular, resonance, waterfall and dispersion (`mod-qft.jsx`).

   Physics stays byte-for-byte: plot data come from the same functions.

## Tests
- `test/figure-ticks.test.mjs`, `test/figure-layout.test.mjs`, `test/figure-spec.test.mjs` (single focal mark, layer required, SVG output is well-formed XML parsed by a tiny parser).
- `qa/specs/figure-kit.spec.mjs`: for every migrated figure at 8 widths 320→1440 px, assert zero clipped text nodes (bounding box inside the figure), zero overlapping labels, a summary present, and keyboard crosshair movement.

## Acceptance
`npm test`, `npm run validate`, `npm run qa:test`. Visual baselines for migrated plots are updated with per-baseline justification.

## Commit
`feat(figure): unified scientific plotting kit`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
