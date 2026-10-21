# S15 — QFT II: The Casimir Cavity

> **Sequence 15 of 36.** Requires **S14** to be `done` in the ledger. Next: **S16**.
> **Closes findings:** none (enables later prompts).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S15** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
A measured vacuum effect, visualised mode by mode.

## Science (`js/science/casimir.mjs`)
- Ideal parallel plates: P(a) = −π²ħc/(240a⁴) (1 μm → 1.3001 × 10⁻³ Pa; 100 nm → 13.001 Pa); energy per area E/A = −π²ħc/(720a³).
- Mode-sum demonstration in 1+1D (scalar between Dirichlet plates):
  - E_in(a, Λ) = Σ_n ½ħω_n f(ω_n/Λ) with ω_n = nπc/a and an exponential regulator f;
  - the regularised difference E_in(a) − E_out(a) converges to the analytic −πħc/(24a) as Λ → ∞;
  - the test checks convergence at three Λ.
- Data: Bressi et al., PRL 88 (2002) 041804 (parallel plates; reported agreement level) and Lamoreaux, PRL 78 (1997) 5 (sphere–plate, PFA).
  - Commit the reported agreement as bands with citations in `js/science/data/casimir.mjs`.
  - Commit digitised points only if the paper's figure licence permits, stating so.
- Caption caveat: Jaffe, PRD 72 (2005) 021301, arXiv:hep-th/0503158 — the force can be derived without reference to vacuum energy.

## Visual (`js/labs/casimir-lab.jsx`, `js/visualizations/qft/casimir-cavity.mjs`)
- Two engraved plates (thin boxes with `engraved-grid` faces) and the gap a on a log slider (10 nm–10 μm).
- Between them, the allowed standing modes n = 1…N drawn as engraved sinusoids with amplitude ∝ 1/√ω_n. Outside, a dense continuum of the same lines at 30 % ink.
- The pressure readout in Pa with KaTeX formula above (Formula Lens binds a → gap, ħ, c → readout).
- A Figure Kit log–log P(a) line with the data bands (focal: the analytic line).
- Static scene; invalidates on slider change only.

## Acceptance
`npm test` (new `test/casimir.test.mjs`), `npm run validate`, captures `qft-casimir-lab`.

## Commit
`feat(qft): casimir cavity lab`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
