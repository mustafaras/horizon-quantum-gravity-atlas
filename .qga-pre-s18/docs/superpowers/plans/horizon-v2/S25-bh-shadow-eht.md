# S25 — Black Holes II: The Shadow, Measured

> **Sequence 25 of 36.** Requires **S24** to be `done` in the ledger. Next: **S26**.
> **Closes findings:** F-17 (Kerr observatory lacks the Bardeen-curve overlay and an EHT comparison).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S25** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Overlay the analytic critical curve on the ray-traced Kerr image, compare with EHT, mark the photon sub-rings, and let the Kerr metric functions be painted over the image through the Formula Lens.

## Science
1. `js/science/kerr-shadow.mjs`:
   - Bardeen (1973) critical curve from spherical photon orbits r ∈ [r_ph⁺, r_ph⁻];
   - ξ(r) = −(r³ − 3Mr² + a²r + a²M)/(a(r − M)), η(r) = −r³(r³ − 6Mr² + 9M²r − 4a²M)/(a²(r − M)²);
   - observer-sky coordinates α = −ξ/sin θ_o, β = ±√(η + a²cos²θ_o − ξ²cot²θ_o).
   - Schwarzschild limit handled analytically (circle radius √27 M).
   - Tests: a → 0 radius 5.196152 M; symmetric about α for θ_o = 90°; for a = 0.998 at θ_o = 90° the prograde edge flattens (record α_min, α_max); no NaN at a = 0 or 1.
2. `js/science/data/eht.mjs`:
   - M87*: ring diameter 42 ± 3 μas, M = 6.5 × 10⁹ M☉, D = 16.8 Mpc (EHT 2019 Papers I and VI, ApJL 875 L1, L6);
   - Sgr A*: 51.8 ± 2.3 μas (EHT 2022 Paper I, ApJL 930 L12) with the GRAVITY mass and distance cited there.
   - Predicted shadow diameter 2√27 GM/(c²D): 39.69 μas for M87* with those values; 51.29 μas for 4.0 × 10⁶ M☉ at 8.0 kpc (tests to 0.01).
   - The caption states that the ring diameter is calibrated to the shadow through a factor (EHT Paper VI) and that the comparison is at the ~10 % level.
3. Photon sub-rings: demagnification per half orbit e^{−γ}, γ = π for Schwarzschild; for Kerr use the Lyapunov exponent from Johnson et al., Sci. Adv. 6 (2020) eaaz1310 (implement for the equatorial-ish observer, label approximate).

## Visual (`js/visualizations/kerr/shadow-overlay.mjs`)
- Three toggleable engraved overlays drawn in screen space over the Kerr observatory image, on the stage, with no re-trace:
  - the Bardeen curve (1.25 px, model);
  - the EHT ring with its ±1σ annulus band scaled to the selected target (data);
  - n = 1, 2 sub-ring markers.
- Alignment test: on the software renderer at a = 0 and a = 0.9, θ = 60°, the traced shadow edge (threshold on the accumulated image) lies within 1.5 px of the curve over ≥ 95 % of the perimeter.
- A small Figure Kit "predicted vs measured" panel in μas for M87* and Sgr A*.
- Formula Lens on the Kerr FormulaCard: Δ = r² − 2Mr + a² and Σ = r² + a²cos²θ as terms.
  - Focusing one paints that function, evaluated at the ray's closest-approach radius, over the image.
  - Add closest-approach r as an extra output of the TSL integrator (`kerr-material.tsl.js`; storage buffer channel) on the WebGPU path only. On WebGL2 the lens shows "available on WebGPU", in-canvas and in the a11y description.

## Acceptance
`npm test`, `npm run validate`, the Kerr observatory spec with overlay captures, the three existing Kerr reference baselines unchanged.

## Commit
`feat(bh): bardeen curve, eht comparison and kerr formula lens`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
