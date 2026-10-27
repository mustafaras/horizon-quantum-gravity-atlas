# S07 — TSL Material Kit and the End of Ad Hoc GLSL

> **Sequence 07 of 36.** Requires **S06** to be `done` in the ledger. Next: **S08**.
> **Closes findings:** F-25 (GPU work split between ad hoc GLSL ShaderMaterials and TSL).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S07** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Build a small library of node materials that encode the art direction and the physics, and port the remaining non-Kerr GLSL (`mod-gr.jsx` stars, gravity well, star surface) to it. From here on there is one GPU language (TSL) for everything except the Kerr classic fallback.

## Steps
1. `js/render/materials/blackbody.mjs`:
   - `blackbodyLUT({ tMin = 1000, tMax = 40000, size = 256 })` builds a `DataTexture` of linear-sRGB chromaticity (unit luminance) from `js/science/spectrum.mjs` `blackbodyToSrgb`, sampled log-uniformly in T;
   - `blackbodyEmission(temperatureNode, radianceNode)` → TSL colour node `lut(T) * radiance`;
   - tests compare LUT entries with `blackbodyToSrgb` to 1e-6.
2. `js/render/materials/field-heatmap.mjs`:
   - `fieldMaterial({ valueNode, range: [lo, hi], palette: "sequential" | "diverging", contours: { step, widthPx, opacity } })`;
   - colour from a palette LUT texture built from `js/design/palettes.mjs`;
   - optional iso-contours drawn analytically with `fwidth` (constant pixel width);
   - this is the material S10 uses to visualise any formula term.
3. `js/render/materials/engraved-grid.mjs`: anti-aliased analytic grid lines (`fwidth`-based, constant pixel width) on any surface parameterisation, major/minor spacing, `--ink-faint` colour, distance fade. It replaces wireframe meshes used as grids.
4. `js/render/materials/data-points.mjs`: an instanced, screen-space-sized point sprite (`SpriteNodeMaterial` or `PointsNodeMaterial`; read r186 to pick the one that supports instanced size in pixels) with a crisp disc edge and an optional ring. Used for sprinkled causal sets, detector hits, measured data.
5. Port `mod-gr.jsx` `ShaderMaterial` sites (lines ~1378 stars, ~1423 well, ~1500 star) to node materials using the kit. The well surface uses `engraved-grid` plus a field heatmap of the Newtonian potential labelled schematic (S20 replaces its geometry with the exact Flamm embedding). Move `CurvatureEngine3D` out of `mod-gr.jsx` into `js/visualizations/gr/curvature-engine.mjs` while doing so; `mod-gr.jsx` must shrink by at least 800 lines.
6. Prewarm: each material kit module exports `prewarmSignature()` so `js/render/shader-prewarm.mjs` can `compileAsync` the kit once per stage.

## Tests
- Node tests for the LUT builders and option validation.
- Playwright: the GR view renders with no `ShaderMaterial` on the node renderer (assert by traversing the scene in the page).
- Visual baseline updates with per-baseline justification.

## Acceptance
`npm test`, `npm run validate`, `npm run qa:test`, `npm run perf:audit` (no `ShaderMaterial` outside `js/visualizations/kerr/kerr-material.mjs`).

## Commit
`feat(render): tsl material kit; port gr shaders`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
