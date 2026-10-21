# S23 — Approaches II: CDT, the Spectral Dimension, and the String Spectrum

> **Sequence 23 of 36.** Requires **S22** to be `done` in the ledger. Next: **S24**.
> **Closes findings:** F-13 (Approaches cover five programs; no computed program, no quantitative comparison).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S23** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
The only quantitative cross-program comparison the field has (spectral dimension running), plus two computed toy programs.

## Science
1. `js/science/cdt-2d.mjs`:
   - 2D causal dynamical triangulations on a cylinder with T time slices;
   - Monte Carlo with the (2,2) flip and (2,4)/(4,2) moves and detailed balance at cosmological constant λ;
   - seeded and run in a worker for N > 2000 triangles.
   - `spectralDimension(triangulation, { sigmaMax, walkers, seed })`: random walk on the dual graph, return probability P(σ), d_s(σ) = −2 d ln P/d ln σ.
   - Tests: the volume per slice fluctuates around the target; for a flat regular triangulation d_s → 2 at intermediate σ within 0.15.
2. `js/science/data/spectral-dimension.mjs` with cited UV/IR values or curves:
   - 4D CDT d_s ≈ 4.02 (IR) → 1.80 (UV) (Ambjørn, Jurkiewicz & Loll, PRL 95 (2005) 171301);
   - asymptotic safety 4 → 2 (Lauscher & Reuter, JHEP 10 (2005) 050);
   - LQG/spin foams (Modesto, CQG 26 (2009) 242002);
   - Hořava–Lifshitz 4 → 2 (Hořava, PRL 102 (2009) 161301);
   - causal sets (cite Eichhorn & Mizera 2014 or Carlip's review);
   - and Carlip, CQG 34 (2017) 193001 as the overview.
3. `js/science/string-spectrum.mjs`:
   - open bosonic string levels α′M² = N − 1;
   - level degeneracies from the coefficient of q^N in Π(1 − qⁿ)^{−24} (test: 1, 24, 324, 3200, 25650 for N = 0…4);
   - the tachyon at N = 0 flagged;
   - the critical dimension from the normal-ordering constant a = (D − 2)/24 via ζ(−1) = −1/12 and a = 1 ⇒ D = 26, as a derivation-step data structure reused by S30.

## Visual
- `js/labs/spectral-dimension-chart.jsx`: Figure Kit, d_s over log σ (or log ℓ).
  - Each program as a categorical line or endpoint pair with an explicit "definitions differ between programs" hatched band.
  - The 4 → 2 convergence as a callout; the in-canvas note states the comparison is qualitative.
- `js/labs/cdt-lab.jsx`: the triangulated cylinder on the stage.
  - Time slices as engraved horizontal rings.
  - Triangles as an instanced mesh with per-instance colour from the diffusion heat-kernel value (`field-heatmap`).
  - The current Monte Carlo sweep count displayed.
- `js/labs/string-spectrum.jsx`: a stem plot of α′M² vs N with degeneracy as stem weight (log), the tachyon in the status-open colour, and the D = 26 derivation stepper placeholder (filled by S30).
- Add "CDT" to the comparator.

## Acceptance
`npm test` (CDT tests ≤ 2 s), `npm run validate`, captures for the three figures.

## Commit
`feat(approaches): cdt, spectral dimension comparison and string spectrum`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
