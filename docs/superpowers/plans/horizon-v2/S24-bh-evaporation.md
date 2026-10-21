# S24 — Black Holes I: Evaporation Dynamics and Greybody Spectra

> **Sequence 24 of 36.** Requires **S23** to be `done` in the ledger. Next: **S25**.
> **Closes findings:** F-09 (Page curve hardcodes slope 1.7 and a tent function); F-10 (Hawking spectrum is a pure blackbody; no greybody factors).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S24** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Replace the hardcoded Page-curve plot (`mod-blackholes.jsx:87`, slope 1.7 and a tent function; `physics.mjs:312`) and the pure-blackbody Hawking spectrum (`physics.mjs:321`) with derived quantities.

## Science
1. `js/science/evaporation.mjs`:
   - photon + graviton emission model per Page, PRD 13 (1976) 198, and Page, JCAP 09 (2013) 028, arXiv:1301.4995;
   - M(t) = M₀(1 − t/τ)^{1/3}; S_BH(t) = S₀(M/M₀)²;
   - coarse-grained radiation entropy S_rad(t) = β(S₀ − S_BH(t)) with β = 1.4847 (verify in Page 2013);
   - Page curve = min(S_rad, S_BH); Page time from S_rad = S_BH.
   - Tests: S_BH/S₀ at the Page time = β/(1+β) = 0.5975; M/M₀ = 0.7730; t/τ = 0.5381 (all to 1e-4); the Hawking curve is monotone; the Page curve is continuous and returns to 0 at t = τ.
   - `pageCurveEntropy` in `physics.mjs` stays for backward compatibility but is marked `@deprecated` in a comment; the UI no longer uses it.
2. `js/science/greybody.mjs`:
   - s = 0 absorption cross-section σ(ω) for Schwarzschild;
   - low-frequency limit σ → A_H = 16πM² (Das, Gibbons & Mathur, PRL 78 (1997) 417);
   - high-frequency geometric-optics limit σ → 27πM²;
   - in between, numerically solve the radial Regge–Wheeler equation for ℓ = 0…ℓ_max with tortoise coordinates and ingoing boundary at the horizon (RK45 from `integrators.mjs`), summing partial waves.
   - Tests: both limits to 1 %, the ratio 27/16, and the transmission ∈ [0, 1].
   - Greybody-corrected spectrum dN/dω dt = (1/2π) Σ Γ_ℓ(ω)/(e^{ω/T} − 1).

## Visual
- Page-curve figure (Figure Kit): S_BH falling (model), the Hawking curve rising (model, dashed), the Page curve as the focal line, a Page-time rule with its value, and the evaporated fraction axis on top.
  - Linked to the Hawking lab's mass slider through ConceptBus.
  - Status chips: Hawking curve effective; Page curve conjectural (unitarity expectation), with the island derivation cited (Penington 2019 arXiv:1905.08255; Almheiri, Engelhardt, Marolf & Maxfield 2019 arXiv:1905.08762).
- Spectrum figure: pure blackbody dashed reference and the greybody-corrected model line (focal), with the s = 0 partial-wave transmissions in a small multiple below.

## Acceptance
`npm test`, `npm run validate`, captures `bh-page-curve`, `bh-greybody`; README Appendix P updated.

## Commit
`feat(bh): evaporation-derived page curve and greybody spectra`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
