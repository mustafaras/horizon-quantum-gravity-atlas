# S26 — Gravitational Waves I: Post-Newtonian Waveforms and a GPU Spacetime Field

> **Sequence 26 of 36.** Requires **S25** to be `done` in the ledger. Next: **S27**.
> **Closes findings:** F-11 (Synthetic GW: Newtonian chirp, ad hoc amplitude clamp, fixed 190 Hz/60 ms ringdown; no matched filter).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S26** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Replace the Newtonian chirp with the ad hoc amplitude clamp and fixed 190 Hz / 60 ms ringdown (`physics.mjs:655`, `gravitational-waves.mjs:458`) with a post-Newtonian inspiral, a numerical-relativity-calibrated remnant and its quasi-normal ringdown. Drive the 3D spacetime field directly from h₊ and h× evaluated on the GPU.

## Science (`js/science/pn-waveform.mjs`)
- TaylorT4 to 3.5PN, non-spinning:
  - dx/dt as the Taylor-expanded flux/energy ratio in x = (GMω/c³)^{2/3} with symmetric mass ratio ν;
  - take every coefficient from Blanchet, Living Rev. Rel. 17 (2014) 2 (copy into a comment with equation numbers);
  - orbital phase φ(t) by RK4;
  - amplitude h ∝ (G𝓜/c²D)(πGfℳ/c³)^{2/3} at leading order;
  - polarisations h₊ = A(1+cos²ι)/2 cos 2φ and h× = A cos ι sin 2φ.
- Stop the inspiral at x = 1/6 (Schwarzschild ISCO, stated).
- Remnant: final mass and spin from a cited non-spinning NR fit (e.g. Jiménez-Forteza et al., PRD 95 (2017) 064024, or Healy & Lousto 2017).
  - Test: equal mass gives χ_f = 0.686 ± 0.005 and M_f/M = 0.952 ± 0.003.
- Ringdown ℓ = m = 2, n = 0 from Berti, Cardoso & Will, PRD 73 (2006) 064030 fits: Mω = 1.5251 − 1.1568(1 − j)^{0.1292}, Q = 0.7000 + 1.4187(1 − j)^{−0.4990}.
  - Tests: j = 0 gives Mω = 0.3683, Q = 2.1187; j = 0.686 gives 0.5291 and 3.2288.
  - The detector-frame f for 62 M☉ × (1+z), z = 0.09, j = 0.686 is ≈ 253 Hz (compute and record).
- Blend inspiral and ringdown with a C¹ window over ±2 cycles around the peak (phenomenological, stated).
- Tests:
  - the leading-order limit of the phase reproduces `inspiralFrequency` (`physics.mjs`) within 1e-6;
  - the time to coalescence from f = 30 Hz for 36 + 29 M☉ matches the 3.5PN-corrected value you compute and record against the Newtonian one;
  - chirp-mass recovery from ḟ at leading order within 1 %.
- `physics.mjs generatedChirp` and `gravitational-waves.mjs synthesizePolarizations` delegate to this module.
  - Keep their signatures; their provenance stays synthetic and gains `model: "TaylorT4-3.5PN + BCW ringdown"`.
  - Update `test/gravitational-waves.test.mjs` and `test/physics.test.mjs` expectations only where the waveform intentionally changed, explaining each in the ledger.

## GPU field (`js/visualizations/gw/spacetime-instrument.mjs` + the TSL runtime)
- Upload the processed h₊(t), h×(t) once as a 1D float texture.
- The lattice vertex displacement is computed in TSL from the TT-gauge plane wave: δx = ½(h₊ x − h× y), δy = ½(−h₊ y − h× x) for a wave along z, sampling h at the retarded time t − z/c and the audio playhead uniform, with display amplification stated in-canvas.
- No per-frame CPU uploads; the audio clock only updates a uniform.
- A ring of test masses shows the + and × patterns as engraved ellipses.
- The plus/cross basis glyphs are KaTeX labelled.
- Formula Lens: h₊ and h× terms bound to the lattice field (S10 field targets).

## Acceptance
`npm test`, `npm run validate`, `qa/specs/gw-instrument.spec.mjs` (audio–visual sync ≤ 50 ms still holds), `npm run perf:collect`.

## Commit
`feat(gw): 3.5pn waveforms, nr remnant ringdown and a gpu tt-gauge field`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
