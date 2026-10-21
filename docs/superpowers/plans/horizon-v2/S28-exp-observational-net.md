# S28 — Experiments III: The Observational Net as Instruments

> **Sequence 28 of 36.** Requires **S27** to be `done` in the ledger. Next: **S29**.
> **Closes findings:** F-12 (The observational net (CMB, ν/DM, QG phenomenology, EHT) is prose only).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S28** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Replace the four prose panels in "The wider observational net" (`mod-experiments.jsx` ~1842) with four computed figures.

## Figures (`js/labs/observational-net/*.jsx`, Figure Kit)
1. **Lorentz-violation time of flight.**
   - Δt(E) = (E/E_QG)(1/H₀)∫₀^z (1+z′)dz′/√(Ω_m(1+z′)³ + Ω_Λ) (Jacob & Piran, JCAP 01 (2008) 031) for linear dispersion;
   - GRB 090510 at z = 0.903;
   - curves for E_QG = E_Pl and 10 E_Pl;
   - the Fermi-LAT bound (Abdo et al. 2009) as a region.
   - Cosmology from Planck 2018 (cite).
   - Test the integral against a numerical reference to 1e-8.
2. **Inflationary tensors.**
   - The (n_s, r) plane with the BICEP/Keck 2021 + Planck bound (1D r < 0.036 as a region, plus the published 2D contour only if its data release permits);
   - slow-roll predictions computed for N = 50–60 e-folds: φ² (n_s = 1 − 2/N, r = 8/N), Starobinsky/R² (n_s ≈ 1 − 2/N, r ≈ 12/N²), natural inflation (computed from its slow-roll parameters);
   - status: model; data are data.
3. **Short-range gravity.**
   - Yukawa α–λ exclusion from Eöt-Wash (Lee et al. 2020) with the excluded region hatched and the "dark-energy length" ~85 μm rule (cite).
   - Commit only boundary points available from the paper's data or text, citing the figure.
4. **Horizon-scale imaging.** Link the S25 comparison panel (reuse the component).

## Acceptance
`npm test` (integral and slow-roll tests), `npm run validate`, captures for each figure; the four prose panels are removed or reduced to captions.

## Commit
`feat(exp): the observational net as computed instruments`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
