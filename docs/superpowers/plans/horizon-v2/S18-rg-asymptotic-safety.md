# S18 — RG II: Asymptotic Safety and the Flow Silk

> **Sequence 18 of 36.** Requires **S17** to be `done` in the ledger. Next: **S19**.
> **Closes findings:** F-14 (RG limited to one-loop QED/QCD and toy fixed points).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S18** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Replace the toy "asymptotic-safety-style" preset with the Einstein–Hilbert truncation flow of (g, λ), and render the flow as a GPU line-integral-convolution "silk", the most striking scientific image in the atlas.

## Science (`js/science/asymptotic-safety.mjs`)
- Beta functions of the dimensionless Newton coupling g and cosmological constant λ in the Einstein–Hilbert truncation with the optimised (Litim) cutoff, d = 4, taken exactly from Reuter & Saueressig, New J. Phys. 14 (2012) 055022, arXiv:1202.2274, and/or Litim, PRL 92 (2004) 201301, arXiv:hep-th/0312114.
  - Copy the equations into a comment with equation numbers.
- `fixedPoints()` uses Newton iteration from a grid of starts. It must return the Gaussian fixed point (0, 0) and the non-Gaussian fixed point.
  - Test against Litim 2004: g* = 0.707, λ* = 0.193, critical exponents θ = 1.475 ± 3.043i, each to 2e-3.
  - If you cannot reproduce these from the published equations, stop and mark the prompt blocked with your numbers; do not tune.
- Stability matrix and eigenvectors at the NGFP; separatrix from the GFP to the NGFP integrated by RK4 from the GFP's relevant eigendirection.
- Trajectory classification per Reuter & Weyer (Types Ia, IIa, IIIa) by the sign of λ in the IR and whether λ → 1/2 is hit (singular line). Terminate integration near λ = 1/2 and report.
- Status: conjectural framework; the truncation and cutoff-scheme dependence are stated in-canvas.

## GPU flow silk (`js/visualizations/rg/lic-field.mjs`)
- A full-viewport quad over the (g, λ) domain [−0.2, 1.2] × [−0.4, 0.49].
- The vector field (β_g, β_λ), normalised, is evaluated in TSL from a Formula Core definition of the beta functions (`js/formula/library/asymptotic-safety.mjs`, gpuSafe-checked).
- LIC: integrate ±L steps along the field in the fragment stage (TSL `Loop`), sampling a seeded white-noise texture (hash-based; no `Math.random`) with a Hann kernel; L = 24 at medium, 40 at ultra quality.
- Colour: diverging palette by sign(β_g), luminance by the LIC value, a faint `engraved-grid` underlay.
- Overlays:
  - engraved fixed points (rings);
  - the separatrix (2 px);
  - the λ = 1/2 singular line as a hatched region;
  - a user-selected trajectory as the single 2.5 px focal line, integrated on the CPU and drawn with `engravedLine`.
- Animated phase (noise offset advecting along the field) only in full motion; reduced motion freezes it. Static otherwise (on-demand frames).
- CPU reference LIC for tests (`lic-cpu.mjs`): on a uniform rotation field, the variance of samples along streamlines is < 0.2 × the variance across them (measured on a 128² image).

## Integration
- The RG landscape gains the gravity model.
- The 3D flow field lab (`js/visualizations/rg/flow-field.mjs`) gains it as a model option using the same science.
- The old toy preset is renamed "pedagogical toy (schematic)" if kept.

## Acceptance
`npm test`, `npm run validate`, `npm run qa:test`, captures `rg-gravity-flow` desktop and mobile, formula-gpu spec covers the beta functions.

## Commit
`feat(rg): einstein-hilbert asymptotic safety flow and gpu lic silk`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
