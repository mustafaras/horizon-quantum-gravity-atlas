# S06 — Engraved Line System

> **Sequence 06 of 36.** Requires **S05** to be `done` in the ledger. Next: **S07**.
> **Closes findings:** F-24 (Geometry drawn with 1 px THREE.Line hairlines (20+ sites); no width control).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S06** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Replace 1 px `THREE.Line` hairlines with constant-pixel-width, anti-aliased, dashable lines. This is the visual signature of "geometry is engraved".

## Steps
1. Vendor from the pinned three 0.186.1 tarball (use the same `npm pack` procedure documented in `vendor/three/VERSION` and `scripts/lib/three-vendor.mjs`):
   - `examples/jsm/lines/webgpu/Line2.js`
   - `examples/jsm/lines/webgpu/LineSegments2.js`
   - `examples/jsm/lines/LineGeometry.js`
   - `examples/jsm/lines/LineSegmentsGeometry.js`
   - and their transitive imports.

   Add their SHA-256 hashes to `vendor/three/VERSION` and the list checked by `test/three-vendor.test.mjs`. `Line2NodeMaterial` is already in `three.webgpu.js`.
2. `js/visualizations/common/engraved-lines.mjs`:
   - `engravedLine(points, { widthPx = 1.25, color, opacity = 1, dash = null, halo = 0, depthFade = null, layer = "model" })`;
   - `engravedSegments(pairs, opts)`;
   - `updateEngravedLine(line, points)`, which reuses buffers when the length is unchanged;
   - colour from a token name, never a literal;
   - widths in CSS pixels, scaled by the stage DPR;
   - `halo > 0` adds a second line at `widthPx * 3`, opacity `halo` (≤ 0.12), drawn first;
   - `depthFade` = `[near, far]` fades opacity with view depth in the material's `opacityNode` (TSL).
3. On the classic WebGL path (Kerr dedicated renderer only) keep `THREE.Line`.
4. Migrate every `new THREE.Line(`, `LineSegments` and `LineBasicMaterial` site listed by `npm run perf:audit` (20+ sites in `mod-standard-model.jsx`, `mod-qft.jsx`, `mod-gr.jsx`, `mod-experiments.jsx`, `extras.jsx`, `atlas-stage.jsx`, `scene3d.jsx`, and the visualization modules for hawking, collider, holography, spin-foam and rg). Keep geometry and colours identical; set the focal curve of each scene to 2.5 px and others to 1–1.25 px per the art direction.
5. `s3dLine` in `js/scene3d.jsx` becomes a thin wrapper over `engravedLine`.

## Tests
- `test/engraved-lines.test.mjs`: option validation, buffer reuse, token resolution (mock tokens).
- Visual baselines change. Update them, and for every baseline write a one-line justification in the ledger. Add a Playwright check that the line pixel width measured on the GR geodesic fan at DPR 1 and DPR 2 is within ±0.5 px of the requested width.

## Acceptance
`npm test`, `npm run validate`, `npm run qa:test`, `npm run perf:audit` (zero `new THREE.Line(` outside the Kerr classic path).

## Commit
`feat(render): engraved constant-width line system`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
