# S12 — Standard Model I: Three-Flavour Oscillations in Matter

> **Sequence 12 of 36.** Requires **S11** to be `done` in the ledger. Next: **S13**.
> **Closes findings:** F-07 (Neutrino lab is two-flavour vacuum only).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S12** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Replace the two-flavour vacuum toy (`NeutrinoOscillationLab`, `js/mod-standard-model.jsx:496`) with an exact three-flavour calculation including constant-density matter, CP violation and both mass orderings, drawn as a "flavour ribbon".

## Science (`js/science/neutrino.mjs`)
1. PMNS in the PDG parametrisation, U(θ₁₂, θ₁₃, θ₂₃, δ_CP), complex arithmetic via a tiny `{re, im}` helper (no dependency).
2. Vacuum Hamiltonian `H = U diag(0, Δm²₂₁, Δm²₃₁) U† / (2E)`. Add the matter potential `V = √2 G_F N_e` on the (e,e) entry, with `N_e = ρ Y_e / m_N`. For antineutrinos, U → U* and V → −V.
3. `oscillationProbabilities({ E_GeV, L_km, params, rhoGcm3 = 0, Ye = 0.5, antineutrino = false })` returns the 3×3 matrix P(α→β).
   - Compute exp(−iHL) exactly: Hermitian 3×3 eigendecomposition by the analytic cubic (Cardano) for eigenvalues plus eigenvectors from cross products.
   - Unit conversion: 1.267 × Δm²[eV²] L[km] / E[GeV] corresponds to the phase Δm²L/(4E). Derive the factor in code from ħc and state it in a comment.
4. `js/science/data/nufit.mjs`:
   - The current NuFIT release (verify at nu-fit.org, record version, date and URL): best fit and 1σ for θ₁₂, θ₁₃, θ₂₃, δ_CP, Δm²₂₁, Δm²₃ℓ for normal and inverted ordering.
   - Experiment presets with sources: T2K 295 km, peak 0.6 GeV; NOvA 810 km, 2 GeV; DUNE 1300 km, 2.5 GeV; JUNO 52.5 km reactor ν̄ₑ, 4 MeV; ρ = 2.6–2.8 g/cm³ crust.

## Tests (`test/neutrino.test.mjs`)
- Rows and columns of P sum to 1 within 1e-12 over a parameter grid.
- θ₁₃ = 0 with Δm²₂₁ → 0 reproduces the two-flavour formula already in the module within 1e-10.
- ρ = 0 equals the vacuum result.
- CPT: P(να→νβ) = P(ν̄β→ν̄α) in vacuum.
- With δ = 0 or π there is no CP asymmetry in vacuum.
- The MSW resonance energy for the 1–3 sector, E_res = Δm²₃₁ cos2θ₁₃ / (2√2 G_F N_e), matches the maximum of P(νμ→νe) in a constant-density scan within the scan step.

## Visual
- `js/labs/neutrino-lab.jsx` with a Figure Kit figure: three stacked bands (P_e, P_μ, P_τ for the chosen initial flavour) over L/E or over E at fixed L.
  - Stacked bands use categorical tokens; the selected appearance channel is the focal line; the vacuum result is ghosted at 30 % when matter is on.
- Controls:
  - initial flavour;
  - ν / ν̄;
  - ordering NO/IO;
  - δ_CP dial (0–360°) rendered as an engraved circular SVG control with keyboard steps of 1°/15°;
  - density slider;
  - experiment preset buttons that set L, E range and ρ.
- FormulaCard with `formulaId` for the vacuum two-flavour limit and the matter potential, defined in `js/formula/library/neutrino.mjs`.
- Provenance registered (established for vacuum oscillation; effective for the constant-density approximation).

## Acceptance
`npm test`, `npm run validate`, Figure Kit and a11y specs, new captures `sm-neutrino-lab` desktop and mobile in `qa/manifest.json`. `mod-standard-model.jsx` shrinks.

## Commit
`feat(sm): three-flavour neutrino oscillations in matter`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
