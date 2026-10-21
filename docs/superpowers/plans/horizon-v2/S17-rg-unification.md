# S17 — RG I: Running of the Standard-Model Gauge Couplings

> **Sequence 17 of 36.** Requires **S16** to be `done` in the ledger. Next: **S18**.
> **Closes findings:** F-14 (RG limited to one-loop QED/QCD and toy fixed points).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S17** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Show the famous near-miss of SM gauge-coupling unification and the MSSM's near-unification, computed and honestly labelled.

## Science (`js/science/gauge-running.mjs`)
- GUT-normalised α₁ = (5/3)α_Y. Inputs from `js/science/data/pdg.mjs` at M_Z:
  - α₁⁻¹ = (3/5)cos²θ_W α_em⁻¹, α₂⁻¹ = sin²θ_W α_em⁻¹, α₃⁻¹ = 1/α_s;
  - with α_em⁻¹ = 127.951, sin²θ_W = 0.23122, α_s = 0.1180 these are 59.020, 29.585, 8.475 (test to 1e-3).
- One loop: dα_i⁻¹/dt = −b_i/(2π), t = ln μ, SM b = (41/10, −19/6, −7), MSSM b = (33/5, 1, −3). Test: the analytic solution at M_Pl = 1.22e19 GeV gives 33.29, 49.46, 52.41 (SM; to 0.01).
- Two loop: dα_i⁻¹/dt = −b_i/(2π) − Σ_j b_ij α_j/(8π²).
  - SM b_ij = [[199/50, 27/10, 44/5], [9/10, 35/6, 12], [11/10, 9/2, −26]].
  - MSSM b_ij = [[199/25, 27/5, 88/5], [9/5, 25, 24], [11/5, 9, 14]].
  - Verify both matrices against Machacek & Vaughn, Nucl. Phys. B222 (1983) 83 and Martin & Vaughn, PRD 50 (1994) 2282; record in the ledger. Yukawa contributions are omitted and stated.
- MSSM above a user-chosen M_SUSY (default 1 TeV) with SM below; status conjectural.
- `unificationTriangle(μ)` returns the area of the triangle formed by the three lines in (log μ, α⁻¹) near their closest approach. Tests: SM area > 0 beyond numerical noise; MSSM area is smaller than SM's by a factor you measure and record.

## Visual (`js/labs/unification-lab.jsx`)
- Figure Kit plot of α_i⁻¹ over log₁₀(μ/GeV), 2 → 19.
  - Three categorical lines, each with an uncertainty band from ±1σ inputs.
  - Two-loop lines solid, one-loop dashed (toggle).
  - The SM crossing region is magnified in an inset callout showing the triangle.
  - The MSSM toggle cross-fades the lines (reduced motion snaps).
  - M_Pl and a "GUT region" hatched as region marks with labels.
- FormulaCard with the one-loop solution as a Formula Core formula; terms bind to the plot lines (object targets = Figure Kit marks, supported by extending the lens to figure marks).

## Acceptance
`npm test`, `npm run validate`, captures `rg-unification`.

## Commit
`feat(rg): standard-model gauge coupling running and unification`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
