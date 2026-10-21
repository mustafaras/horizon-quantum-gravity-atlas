# S33 — Production Runtime, Workers and Offline

> **Sequence 33 of 36.** Requires **S32** to be `done` in the ledger. Next: **S34**.
> **Closes findings:** F-01 (v1 prompts 11–13 never executed (export, PWA/workers/themes, release gate)); F-18 (Production ships React development builds and transpiles JSX in the browser with Babel (3.0 MB)).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S33** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Implement v1 Prompt 12's Performance and PWA sections (normative) and remove the development runtime from production.

## Steps
1. `scripts/compile-jsx.mjs` uses the vendored Babel in Node to transpile each `.jsx` one-to-one into `js/compiled/<path>.js` (committed).
   - `npm run validate` fails if committed output differs from a fresh compile.
   - `index.html` loads compiled classic scripts in the same order.
   - `?dev=1` keeps the in-browser Babel path.
   - Babel standalone is not fetched in production.
2. Vendor `react.production.min.js` and `react-dom.production.min.js` for the pinned React version with SRI. Production uses them; `?dev=1` uses development builds.
3. Workers: matched filter (exists from S27), CDT Monte Carlo, Higgs/gauge RGE scans, greybody partial waves, causal-set reduction above N = 2000. All use transferable buffers, cancellation and progress events.
4. Service worker per v1 Prompt 12 (scope for the Pages subpath, versioned caches, update prompt that never reloads with unsaved annotations).
5. Measure with `npm run perf:collect`. Record against S01 and S05 in `docs/performance.md`:
   - `babelMs` must be 0 in production;
   - `jsBytes` reduction;
   - first frame.

## Acceptance
`npm test`, `npm run validate`, the full `npm run qa:test` on the compiled path, offline reload under the subpath.

## Commit
`perf: production runtime, workers and offline atlas`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
