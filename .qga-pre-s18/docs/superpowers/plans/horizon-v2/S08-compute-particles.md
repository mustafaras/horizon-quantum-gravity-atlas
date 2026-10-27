# S08 — GPU Compute Particle Kit

> **Sequence 08 of 36.** Requires **S07** to be `done` in the ledger. Next: **S09**.
> **Closes findings:** F-27 (CPU per-frame buffer uploads (needsUpdate) at ~38 sites in 15 files).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S08** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Move every particle system that is updated on the CPU every frame (`needsUpdate = true` sites: about 38 across 15 files) to TSL compute on storage buffers, deterministic from a seed. One draw call and zero per-frame uploads per system.

## Steps
1. `js/render/compute/particles.mjs`:
   - `createParticleSystem({ count, seed, init, update, render })`;
   - `init` and `update` are TSL `Fn`s over `instancedArray` buffers (`position`, `velocity`, `age`, `attr`); verify `instancedArray`, `instanceIndex`, `Fn` and `hash` in `three.tsl.js`;
   - randomness is `hash(instanceIndex + seed * 7919)`, never `Math.random`;
   - `system.step(renderer, dt)` calls `renderer.compute(updateNode)`; render uses the `data-points` material or a sprite reading the storage buffer;
   - `system.readback()` is for tests only.
2. CPU reference: `js/render/compute/particles-cpu.mjs` implements the same `init`/`update` math in JS for a small count so Node tests can assert the GPU readback (Playwright) equals the CPU reference within 1e-4 after 60 fixed steps.
3. Migrate, in this order, verifying each visually:
   - Hawking pair emission (`js/visualizations/blackhole/hawking-lab.mjs`);
   - QFT field-lab particles (`js/visualizations/qft/field-lab.mjs`);
   - GW lattice where it still uploads per frame (`js/visualizations/gw/gw-runtime.mjs`; the TSL runtime already exists, so share code rather than duplicating it);
   - RG flow-field tracers (`js/visualizations/rg/flow-field.mjs`);
   - collider event hits (`js/visualizations/collider/event-display.mjs`);
   - AtlasStage stars (`js/atlas-stage.jsx`; make them a static seeded buffer with twinkle computed in the vertex stage from time, no uploads).
4. On the node renderer's WebGL2 backend, compute uses transform feedback. If a system fails there, keep a CPU path only for that system and backend, documented in the ledger. Never break WebGL2.

## Tests
- `test/particles-cpu.test.mjs`.
- `qa/specs/compute-particles.spec.mjs`: GPU vs CPU readback, seeded determinism (two runs identical), zero `needsUpdate` assignments per frame (instrument with a counter in dev).

## Acceptance
`npm test`, `npm run validate`, `npm run qa:test`, `npm run perf:collect` (record CPU frame p95 deltas per migrated view).

## Commit
`perf(render): compute particles on storage buffers`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
