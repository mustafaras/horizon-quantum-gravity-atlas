# S13 — Standard Model II: The Physical Higgs and Vacuum Stability

> **Sequence 13 of 36.** Requires **S12** to be `done` in the ledger. Next: **S14**.
> **Closes findings:** F-08 (Higgs potential in toy units; no vacuum-stability story).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S13** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Replace the toy-unit Higgs potential with the physical one, render it as a TSL "Mexican hat" whose surface is the formula, and show the Standard Model's metastable vacuum through the running quartic coupling.

## Science
1. `js/science/data/pdg.mjs`: G_F, m_H, m_t (pole), M_Z, M_W, α_s(M_Z), α_em⁻¹(M_Z) (MS-bar), sin²θ_W(M_Z) MS-bar, from the current PDG Review. Record edition, value and uncertainty; verify each.
2. `js/science/higgs.mjs`:
   - `v = (√2 G_F)^{−1/2}` (246.220 GeV for G_F = 1.1663788e-5 GeV⁻²);
   - `λ_tree = m_H² / (2v²)` (0.12928 at 125.20 GeV);
   - `V(|H|) = −μ²|H|² + λ|H|⁴` with μ² = λv²;
   - radial and Goldstone mode curvatures (m_H² = 2λv², Goldstone mass 0).
3. Running: one-loop (and two-loop where you can verify the coefficients) RGEs for λ, y_t, g₁, g₂, g₃ in MS-bar from μ = m_t to M_Pl = 1.22 × 10¹⁹ GeV.
   - Use Buttazzo et al., JHEP 12 (2013) 089, arXiv:1307.3536 for the equations and matching.
   - Match y_t(m_t) and λ(m_t) at tree level plus the leading QCD correction for y_t, stated explicitly.
   - Integrate in t = ln μ with RK4 at a fixed step (Δt = 0.05), reusing `js/science/integrators.mjs`.
   - Report μ_inst where λ < 0.
   - The literature instability scale for central inputs is ~10¹⁰–10¹¹ GeV. The test checks yours lies in 10⁹–10¹² GeV for the one-loop truncation and records the exact value in the ledger.
4. `stabilityRegion(m_t, m_H)` classifies stable / metastable / unstable using the published boundary lines from Buttazzo et al. (digitise the two boundary lines as committed data with citation, or compute them from your RGE with the documented truncation; label which).

## Visual
- `js/visualizations/sm/mexican-hat.mjs`: a TSL surface over (Re φ, Im φ).
  - Height `positionNode` = `compileTSL(V)` from a `js/formula/library/higgs.mjs` definition (dimensionless φ/v).
  - Surface uses `engraved-grid` + `field-heatmap` of V.
  - The vacuum circle |φ| = v is an engraved 2.5 px focal ring.
  - Radial mode arrow and Goldstone tangent arrow are engraved lines with KaTeX labels (overlay).
  - Toggle "symmetric phase" (μ² > 0) eases the surface between shapes (reduced motion snaps); the physical point is pinned and labelled.
  - Static scene except during easing.
- `js/labs/higgs-lab.jsx`:
  - the hat;
  - a Figure Kit λ(μ) plot over log₁₀ μ from m_t to M_Pl, with the zero line, μ_inst rule and an uncertainty band from varying m_t and α_s by ±1σ;
  - a (m_t, m_H) stability diagram with the measured ellipse (data) over the three regions (model).
- ConceptBridges to RG (S17) and Planck.
- Status: tree potential established; running to M_Pl effective (assumes no new physics), stated in-canvas.

## Tests
`test/higgs.test.mjs`: v and λ values; RGE beta at one loop against a hand-evaluated point; λ monotone decreasing over 10³–10¹⁰ GeV for central inputs; μ_inst range; region classification of the measured point is "metastable".

## Acceptance
`npm test`, `npm run validate`, captures `sm-higgs-lab` (desktop, mobile), formula-gpu spec extended with the Higgs potential.

## Commit
`feat(sm): physical higgs potential and vacuum stability`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
