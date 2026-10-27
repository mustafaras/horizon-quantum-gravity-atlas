# S22 — Approaches I: Causal Sets

> **Sequence 22 of 36.** Requires **S21** to be `done` in the ledger. Next: **S23**.
> **Closes findings:** F-13 (Approaches cover five programs; no computed program, no quantitative comparison).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S22** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
A quantum-gravity program you can compute in the browser: Poisson-sprinkled causal sets with dimension and proper-time estimators, rendered as a constellation of engraved points.

## Science (`js/science/causal-sets.mjs`)
- `sprinkle({ dim: 2 | 4, n, seed })` places points uniformly in a causal diamond of unit height in light-cone coordinates (2D) or by rejection in 4D Minkowski.
- `causalMatrix(points)` as a bitset (Uint32Array rows); transitive reduction to links.
- `longestChain(matrix)` by dynamic programming over a topological order; `orderingFraction = 2R/(N(N−1))`.
- Myrheim–Meyer: invert f(d) = Γ(d+1)Γ(d/2)/(2Γ(3d/2)) numerically (f(2) = 1/2, f(3) = 0.22857, f(4) = 1/10).
- Tests:
  - f values above;
  - the estimator returns 2 ± 0.1 for N = 2000 in 2D and 4 ± 0.3 for N = 2000 in 4D across 5 seeds (measure and record actual spread);
  - the longest chain grows ∝ N^{1/d} (fit slope within 15 %).
- References: Bombelli, Lee, Meyer & Sorkin, PRL 59 (1987) 521; Myrheim (1978, CERN-TH-2538); Meyer (1988 thesis); Surya, Living Rev. Rel. 22 (2019) 5.

## Visual (`js/labs/causal-set-lab.jsx`, `js/visualizations/approaches/causal-set.mjs`)
- On the shared stage (static scene): sprinkled points as instanced `data-points` (2 px discs).
- Links as `engravedSegments` at 1 px with depth fade (4D shown as a 3D projection with time vertical).
- The longest chain as the 2.5 px focal golden polyline; the diamond boundary as engraved light-cone lines.
- Controls: N (100–4000), dimension 2/4, seed, "show links".
- Readouts: Myrheim–Meyer d with its spread from 5 seeds, chain length vs proper time.
- Replace the unseeded random graph in `MicrostructureViz` (`js/mod-approaches.jsx:156`) with this generator.
- Add "Causal sets" to the comparator data (`js/data.jsx`), status conjectural, all aspect columns filled with cited statements.

## Acceptance
`npm test`, `npm run validate`, captures `approaches-causal-set` desktop and mobile; N = 4000 sprinkle + reduction runs under 300 ms in Node (record).

## Commit
`feat(approaches): causal set laboratory`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
