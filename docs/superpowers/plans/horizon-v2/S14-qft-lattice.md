# S14 — QFT I: GPU Lattice Field Theory

> **Sequence 14 of 36.** Requires **S13** to be `done` in the ledger. Next: **S15**.
> **Closes findings:** none (enables later prompts).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S14** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
The field laboratory becomes a real simulation: a real scalar φ⁴ field on a periodic lattice evolved on the GPU by a symplectic integrator, with a CPU reference and a conserved-energy test. It is rendered as an engraved height field coloured by local energy density.

## Science (`js/science/lattice-field.mjs`, CPU reference)
- Hamiltonian: H = Σ_x a^d [½π² + ½(∇φ)² + ½m²φ² + (λ/4!)φ⁴], with forward-difference gradients and periodic boundaries.
- Leapfrog (kick-drift-kick) with Δt ≤ 0.5a (state the CFL condition in a comment).
- 1+1D and 2+1D variants.
- Seeded initial conditions:
  - `vacuumLike`: Gaussian random field with the free-field lattice spectrum ⟨|φ_k|²⟩ = 1/(2ω_k), ω_k² = m² + Σᵢ (4/a²) sin²(k_i a/2), built by inverse FFT (reuse the radix-2 FFT in `js/science/gravitational-waves.mjs`);
  - `wavepacket`: two colliding Gaussian packets;
  - `kink`: for m² < 0, the kink φ(x) = v tanh(m x/√2) in 1+1D with v = √(6|m²|/λ).
- `energy(state)`, `energyDensity(state)`, `modePower(state)`.

## GPU (`js/visualizations/qft/lattice-gpu.mjs`)
- Storage buffers φ and π (`instancedArray`, N = 256² in 2+1D).
- Two compute passes per step (kick, drift) in TSL, neighbour indexing with periodic wrap.
- Energy density computed in a third pass into a buffer that drives the height field's colour.
- Steps per frame adapt to the governor's budget; the simulated time per frame is fixed, so physics never depends on frame rate.
- Render: a single plane mesh with N vertices whose `positionNode` reads φ from the storage buffer, `engraved-grid` lines every 16 cells, colour from `field-heatmap` (sequential, energy density), and the kink core as the focal contour.

## Tests
- `test/lattice-field.test.mjs`:
  - free-field dispersion: a single mode oscillates at ω_k within 1e-4;
  - leapfrog energy drift < 1e-5 relative over 10⁴ steps at Δt = 0.1a;
  - kink is static to 1e-6 for m² < 0;
  - packets pass through each other at λ = 0.
- `qa/specs/lattice-gpu.spec.mjs`: GPU vs CPU after 200 steps on a 64² lattice, max abs difference < 1e-3 (float32), on both backends.

## Integration
- Replace the internals of `FieldLab3D` and the vacuum lab in `js/mod-qft.jsx` with this. The old `Math.random` kicks disappear; "excite" becomes a seeded Gaussian kick at the clicked lattice site.
- Move `FieldLab`, `FieldLab3D` and the amplitude room components into `js/labs/` files; `mod-qft.jsx` must end under 900 lines.
- Formula Lens: the φ⁴ Hamiltonian density defined in `js/formula/library/qft.mjs`, with terms kinetic, gradient, mass and interaction bound to field targets (each term paintable over the lattice).

## Acceptance
`npm test`, `npm run validate`, `npm run qa:test`, `npm run perf:collect` (QFT view CPU frame p95 must not regress vs S08).

## Commit
`feat(qft): gpu lattice phi^4 with a conserved-energy integrator`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
