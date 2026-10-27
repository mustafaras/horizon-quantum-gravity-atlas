# S19 — GR I: The Penrose Atlas

> **Sequence 19 of 36.** Requires **S18** to be `done` in the ledger. Next: **S20**.
> **Closes findings:** F-16 (GR engine on a display constant; few observational tests; no Penrose diagrams; rubber-sheet well).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S19** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Engraved conformal diagrams computed from exact coordinate maps, the most elegant way to show causal structure.

## Science (`js/science/conformal.mjs`)
- Minkowski: u = t − r, v = t + r, U = arctan u, V = arctan v, T = (U+V)/2, R = (V−U)/2.
- Schwarzschild via Kruskal–Szekeres:
  - for r > 2M, U = −e^{−u/4M}, V = e^{v/4M}, with tortoise r* = r + 2M ln|r/2M − 1|;
  - for r < 2M the continuation;
  - compactify with arctan.
- `mapEvent(spacetime, {t, r, region})` → (T, R).
- `sampleCoordinateLines(spacetime, { tValues, rValues })` → polylines.
- Regions I–IV, horizons, singularity r = 0 at T = ±π/2-type boundaries, and the boundaries i⁰, i±, ℐ± with labels.
- Reissner–Nordström causal structure (one block of the maximal extension) as a labelled schematic diagram built from the same mapping style; its status is stated.
- Worldlines integrated in Schwarzschild coordinates: radial free fall from rest at r₀, static observer at r₀, outgoing and ingoing radial null rays. Map them through the exact transformation.
- Tests:
  - every null ray maps to a ±45° line within 1e-9 (|dT| = |dR|);
  - the horizon maps to the diagonal;
  - an infalling worldline crosses the horizon at finite (T, R) and ends on the singularity;
  - a static observer approaches i⁺.

## Visual (`js/labs/penrose-atlas.jsx`, `js/visualizations/gr/penrose.mjs`)
- An orthographic Three.js view (on the shared stage; static scene) showing three diagrams side by side: Minkowski, Schwarzschild (maximally extended), and Reissner–Nordström (schematic).
- Coordinate lines t = const and r = const as 1 px `--ink-faint` engraved lines.
- Horizons and singularities in status-coloured 1.5 px lines; the singularity is drawn as a zig-zag polyline (generated, not a texture).
- One worldline is the 2.5 px focal curve, with light-cone glyphs (two short 45° engraved segments) every proper-time tick.
- Hover or focus a region to see its name and meaning (KaTeX overlay); keyboard cycles regions.
- A slider for the infall start r₀, and a "release" button that animates the proper-time cursor along the worldline in full motion only.
- Formula Lens: the Kruskal relations as Formula Core definitions with terms bound to the diagram (U, V lines highlight).

## Acceptance
`npm test` (new `test/conformal.test.mjs`), `npm run validate`, captures `gr-penrose-atlas` desktop and mobile, a11y spec covering region keyboard focus.

## Commit
`feat(gr): penrose atlas from exact conformal maps`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
