# S16 — QFT III: Electroweak e⁺e⁻ Scattering and Publication-Grade Feynman Diagrams

> **Sequence 16 of 36.** Requires **S15** to be `done` in the ledger. Next: **S17**.
> **Closes findings:** F-15 (Amplitude room is t-channel-pole-only and omits γ–Z interference).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S16** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Close the two QFT rows of the limitations registry (t-channel pole only; no γ–Z interference) and redraw Feynman diagrams to TikZ-Feynman quality.

## Science (`js/science/electroweak.mjs`)
- e⁺e⁻ → μ⁺μ⁻ at tree level with γ and Z exchange: dσ/dcosθ = (πα²/2s)[A₀(1 + cos²θ) + A₁ cosθ], with the standard A₀, A₁ in terms of vector and axial couplings g_V = T₃ − 2Q sin²θ_W, g_A = T₃ and the Breit–Wigner χ(s) = s/(s − M_Z² + i M_Z Γ_Z) × 1/(4 sin²θ_W cos²θ_W).
- Derive the form in comments, citing Peskin & Schroeder §5.1 (pure QED limit) and PDG "Electroweak model" review.
- σ(√s), A_FB(√s) = 3A₁/(8A₀) from 10 to 200 GeV.
- Tests:
  - the QED limit √s ≪ M_Z gives σ = 4πα²/(3s), i.e. 86.8 nb/s[GeV²];
  - A_FB changes sign below the Z pole;
  - the peak is at M_Z within 0.1 GeV.
- Data: LEP/SLD combined pole results (Phys. Rept. 427 (2006) 257, arXiv:hep-ex/0509008) for σ_had⁰ and A_FB^{0,μ} near the pole. Commit only values printed in the paper's tables, with table numbers.
- Bhabha (e⁺e⁻ → e⁺e⁻) QED with s and t channels and their interference: dσ/dΩ = (α²/2s)[(1+cos⁴(θ/2))/sin⁴(θ/2) − 2cos⁴(θ/2)/sin²(θ/2) + (1+cos²θ)/2]. Møller with t and u channels. Test the forward-pole limits and symmetry (Møller symmetric under θ → π − θ).

## Visual
- `js/visualizations/qft/feynman-svg.mjs`: build SVG from a small diagram description `{ vertices: [{id,x,y}], edges: [{from,to,kind: "fermion"|"antifermion"|"photon"|"gluon"|"boson"|"scalar", label, momentum}] }`.
  - Fermion arrows at mid-segment.
  - Photon sine paths with an integer number of half-periods per edge.
  - Gluon coils as trochoid loops.
  - Dashed scalars.
  - Vertex dots of 3 px; labels as KaTeX overlay; momentum arrows offset parallel to the edge.
  - Strokes via tokens.
  - Tests check path geometry (half-period count, arrow position at t = 0.5, gluon coil count ∝ length).
- `FeynmanSVG` in `mod-qft.jsx` and the `FeynmanBuilder` use it.
- Electroweak figure: σ(√s) (log y) and A_FB(√s) stacked with a shared x axis, LEP points as data, the interference zero crossing as a callout, and the Z pole rule. The focal mark is the γ+Z model line.
- Update the amplitude room to show s/t/u channel decomposition (three thin lines plus total focal).
- Remove the two corresponding rows from README Appendix P.

## Acceptance
`npm test`, `npm run validate`, `npm run qa:test`, captures for the electroweak figure and the redrawn diagrams.

## Commit
`feat(qft): electroweak scattering and publication-grade feynman diagrams`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
