# S20 — GR II: Tidal Geometry, the Flamm Embedding and the Tested Universe

> **Sequence 20 of 36.** Requires **S19** to be `done` in the ledger. Next: **S21**.
> **Closes findings:** F-16 (GR engine on a display constant; few observational tests; no Penrose diagrams; rubber-sheet well).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S20** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Make curvature physical (tides), make the "gravity well" geometrically exact (Flamm's paraboloid), and summarise every GR test in one honest pull plot.

## Science
1. `js/science/tidal.mjs`:
   - Schwarzschild tidal eigenvalues in the static frame: radial −2GM/r³, transverse +GM/r³;
   - geodesic deviation integration of a ring of N test particles around a free-falling centre (Newtonian tidal limit plus exact radial infall of the centre, stated);
   - `spaghettificationRadius(M, bodyLength, maxAccel)`.
   - Tests: eigenvalues sum to zero (vacuum), and for M = 10 M☉ and a 2 m body with 100 m/s² tolerance the radius is above the horizon while for 10⁶ M☉ it is inside (compute and record exact values).
2. Embedding via `flammEmbedding` from S03 (z(r) = 2√(r_s(r − r_s))) for r ≥ r_s. Test the proper radial distance between r₁ and r₂ along the surface equals ∫ dr/√(1 − r_s/r) to 1e-8.
3. `js/science/data/gr-tests.mjs`, each entry with prediction function, measured value, 1σ, citation (verify each):
   - Mercury perihelion 42.98″/cy (exists in tests);
   - solar-limb deflection 1.75″;
   - Shapiro / Cassini γ − 1 = (2.1 ± 2.3) × 10⁻⁵ (Bertotti, Iess & Tortora, Nature 425 (2003) 374);
   - Pound–Rebka (1960) redshift ratio;
   - GPS clock offset: +45.72 μs/day gravitational, −7.21 μs/day kinematic, +38.50 net for r = 26 560 km (test these to 0.01);
   - S2 Schwarzschild precession f_SP = 1.10 ± 0.19 (GRAVITY, A&A 636 (2020) L5);
   - Hulse–Taylor orbital decay ratio (Weisberg & Huang 2016).
   - `pull(entry)` = (measured − predicted)/σ.

## Visual
- `js/labs/tidal-lab.jsx`: a ring of compute particles (S08 kit) deforming into the tidal ellipse as the centre falls. Readouts in m/s² per metre. A Figure Kit plot of stretch vs r with the horizon and spaghettification rules.
- The curvature engine's well (`js/visualizations/gr/curvature-engine.mjs`) gains a "geometry: exact (Flamm)" mode.
  - In it the surface is the Flamm paraboloid (TSL `positionNode` from the formula), with radial `engraved-grid` lines at equal proper distance, not equal r, so the stretching is visible.
  - The old well remains as "Newtonian potential (schematic)".
  - The mode label is in-canvas.
- `js/labs/gr-tests-panel.jsx`: the pull plot — Figure Kit points with ±1σ bars around 0, one row per test, shaded ±1σ and ±2σ bands, each row labelled with the observable and citation (hover/focus).

## Acceptance
`npm test`, `npm run validate`, captures `gr-tidal-lab`, `gr-flamm`, `gr-tests-pull`.

## Commit
`feat(gr): tidal geometry, exact embedding and the tested-universe pull plot`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
