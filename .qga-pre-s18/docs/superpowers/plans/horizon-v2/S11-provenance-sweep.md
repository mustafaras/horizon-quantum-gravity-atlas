# S11 — Provenance Coverage, Layer Classes and Determinism

> **Sequence 11 of 36.** Requires **S10** to be `done` in the ledger. Next: **S12**.
> **Closes findings:** F-02 (Provenance registry covers 9 views while 28 VizCaption panels exist); F-03 (Math.random feeds labelled science figures; starfields unseeded).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S11** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Every figure that shows a status label is registered with full provenance and layer classification, every model or data layer is seeded, and the `scientific` preset hides decoration without touching model pixels.

## Steps
1. `VizCaption` (`js/core.jsx`) requires `provenanceId`. Its status chip becomes a button opening a drawer with model, status, assumptions, validity, numerical method, references (DOI/arXiv links), layer table and seed.
2. Extend `validateScientificProvenance` (`js/science/contracts.mjs`) with `layers: [{ name, class: "data" | "model" | "decoration" }]`.
3. Register every captioned figure. There are 28 `<VizCaption>` today; 9 are registered. The registry rejects a status that differs from the caption's.
4. Replace every `Math.random` listed by `npm run perf:audit` with `seededRng(seed)` from `js/physics.mjs` (or the TSL `hash` for GPU work). Seeds come from URL state where the figure exports state, otherwise a fixed per-figure constant. The only allowlisted `Math.random` is annotation id generation.
5. Scenes tag decoration objects with `object.userData.layer = "decoration"`. The `scientific` vizMode sets `visible = false` on those, and the render pipeline's scientific preset already drops post decoration.
6. `scripts/audit-provenance.mjs` fails on:
   - an unregistered caption;
   - a missing reference;
   - a reference without a DOI, arXiv id, ADS bibcode or URL;
   - a `Math.random` outside the allowlist;
   - a scene object without a layer tag in a registered scene (traverse in a Playwright helper).

   Wire it into `npm run validate`.

## Tests
- `test/provenance-coverage.test.mjs` (static JSX scan vs registry).
- Playwright: chips open the correct drawer by keyboard; two captures with the same seed are pixel-identical on SwiftShader; switching to `scientific` changes only pixels of decoration-tagged objects (render with decoration hidden vs a layer mask and compare).

## Acceptance
`npm test`, `npm run validate` (including the audit), `npm run qa:test`.

## Commit
`feat(provenance): full coverage, layer classes and seeded figures`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
