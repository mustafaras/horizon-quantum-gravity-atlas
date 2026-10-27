# S21 — Planck Frontier: The Map of the Unseen

> **Sequence 21 of 36.** Requires **S20** to be `done` in the ledger. Next: **S22**.
> **Closes findings:** F-12 (The observational net (CMB, ν/DM, QG phenomenology, EHT) is prose only).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S21** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
The atlas's thesis in one image: where experiments have looked, and the void where quantum gravity lives.

## Science
1. `js/science/data/constraints.mjs`: entries `{ id, label, quantity, scaleKind: "length" | "energy", lo, hi, bound, cl, experiment, year, reference }`. At least:
   - Eöt-Wash inverse-square law to 52 μm (Lee et al., PRL 124 (2020) 101101);
   - LHC √s = 13.6 TeV reach and a cited ATLAS or CMS large-extra-dimension bound;
   - Fermi-LAT GRB 090510 E_QG,1 > 1.2 E_Pl (Abdo et al., Nature 462 (2009) 331);
   - GWTC-3 graviton-mass bound (LVK tests-of-GR paper, cite value);
   - EHT horizon scale for M87* (link S25);
   - BICEP/Keck r₀.₀₅ < 0.036 (95 % CL, PRL 127 (2021) 151301) converted to V^{1/4} < (3π²/2 · r · A_s)^{1/4} M̄_Pl with A_s from Planck 2018 (compute; ≈ 1.4 × 10¹⁶ GeV);
   - the CMB last-scattering and Hubble scales.

   Verify every value.
2. Helpers: length ↔ energy via ħc (197.327 MeV·fm), `probeEnergyGeV` (exists), Planck units (exist).
3. LQG spectra in `js/science/spin-networks.mjs`:
   - `areaSpectrum` uses 8πγℓ_P²√(j(j+1)) with γ stated (cite the value and convention, e.g. Meissner 2004 / Domagala–Lewandowski 2004);
   - add the volume spectrum of the 4-valent node for small spins via a cited formula.
   - Status conjectural.

## Visual (`js/labs/constraint-plane.jsx`, Figure Kit)
- A log–log plane: x = length 10⁻³⁵ → 10²⁶ m, y = energy 10⁻³ → 10²⁸ eV; the line E = ħc/L is the diagonal.
- Planck length and energy as engraved rules.
- Each experiment as a hatched region in a categorical colour with label; hover/focus shows value, CL and citation.
- The unexplored region near the Planck corner is the focal dark void with a fine stipple, labelled "no direct data".
- Atlas modules as small markers where their physics lives (links navigate).
- The Planck module's ScaleLadder scroll position drives a crosshair on the plane (via ConceptBus).
- Spin-foam lab: add a Figure Kit area/volume spectrum stem plot beside the 3D foam.

## Acceptance
`npm test` (`test/constraints-data.test.mjs`: every entry cited, finite, units consistent), `npm run validate`, captures `planck-constraint-plane`.

## Commit
`feat(planck): the map of the unseen and lqg spectra`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
