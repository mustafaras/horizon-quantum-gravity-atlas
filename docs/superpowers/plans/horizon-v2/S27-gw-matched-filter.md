# S27 — Gravitational Waves II: Matched Filtering on Real Data

> **Sequence 27 of 36.** Requires **S26** to be `done` in the ledger. Next: **S28**.
> **Closes findings:** F-11 (Synthetic GW: Newtonian chirp, ad hoc amplitude clamp, fixed 190 Hz/60 ms ringdown; no matched filter).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S27** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Find GW150914 in the bundled GWOSC fixture with a matched filter, and show it the way detector scientists do: a Q-transform with the best template riding the chirp.

## Science
- `js/science/matched-filter.mjs`:
  - frequency-domain matched filter ρ(t) = 4 Re ∫ s̃(f) h̃*(f) e^{2πift}/S_n(f) df / σ_h, with the PSD from the existing `estimatePsd` (Welch);
  - Tukey window and the same band policy as the processing path.
- Template bank: a seeded, chirp-mass-spaced bank (e.g. 64 templates, 𝓜 ∈ [10, 40] M☉ detector frame, equal mass) from S26 waveforms.
- `searchBank(strain, bank)` → `{ peakSnr, tPeak, bestMc, snrSeries }`.
- Worker: `js/workers/matched-filter.worker.mjs` with transferable buffers; the UI shows progress and allows cancel.
- Tests (`test/matched-filter.test.mjs`): injection–recovery in seeded Gaussian noise coloured by a model PSD; recovered 𝓜 within the bank spacing; SNR within 10 % of the optimal SNR computed analytically for the injection.
- On the GW150914 fixture (`qa/fixtures`), record the recovered detector-frame chirp mass and peak SNR in the ledger. State in the UI that this is a simplified search (no χ² veto, no coincidence, no false-alarm rate) and must not be read as the LVK detection statistic.
- `js/science/qtransform.mjs`: constant-Q transform (Q = 8 default) via windowed FFT tiles; tests on a pure tone and a linear chirp.
- CMS Open Data:
  - commit a small dimuon invariant-mass histogram (bin edges + counts) derived from a CMS open dataset record (CC0; cite the record DOI) in `js/science/data/cms-dimuon.mjs`, with the derivation script or record of how it was produced;
  - if you cannot obtain and verify the data offline, stop and block rather than fabricate.

## Visual
- `js/labs/gw-theatre.jsx` (move `GWAnalysisTheatre` out of `mod-experiments.jsx`; it must end under 1,000 lines):
  - a Figure Kit heatmap of the Q-transform (sequential palette, normalised energy);
  - the best template's frequency track as the focal 2.5 px line over it;
  - the SNR time series in a figure below sharing the time axis;
  - the existing audio console's playhead drives a shared cursor across all.
- Invariant-mass lab: real CMS histogram as data points with √N error bars on a log-log axis with J/ψ, ψ(2S), Υ(1S–3S), Z labels; the synthetic generator is drawn separately, never mixed into one series.

## Acceptance
`npm test`, `npm run validate`, `npm run qa:test -- qa/specs/gwosc.spec.mjs qa/specs/gw-instrument.spec.mjs`, captures `exp-gw-qtransform`, `exp-cms-dimuon`.

## Commit
`feat(exp): matched filtering, q-transform and cms open data`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
