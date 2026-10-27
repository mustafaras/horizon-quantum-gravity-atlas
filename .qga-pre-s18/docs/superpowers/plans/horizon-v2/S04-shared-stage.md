# S04 — Shared GPU Stage: One Renderer per Page, Frames on Demand

> **Sequence 04 of 36.** Requires **S03** to be `done` in the ledger. Next: **S05**.
> **Closes findings:** F-21 (Every Scene3D builds its own renderer: 4 renderers and 4 shader caches on the QFT view); F-22 (WebGL2 contexts always use preserveDrawingBuffer: true); F-23 (Quality governor uses CPU frame time only; GPU timestamps unused).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S04** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Make the renderer architecture the fastest it can be with Three.js r186:
- one `WebGPURenderer` per page drawing into every scene canvas through `CanvasTarget`, so there is one pipeline and shader cache;
- frames rendered only when something changed;
- a hard budget on WebGL2 contexts;
- a governor driven by GPU timestamps when the hardware offers them.

## Verified facts (r186 vendored)
- `CanvasTarget` and `renderer.setCanvasTarget(target)` / `getCanvasTarget()` exist (`three.webgpu.js` ~61372, ~64445). The WebGPU backend creates one `GPUCanvasContext` per canvas target. The WebGL backend does not: a WebGL context belongs to one canvas.
- `trackTimestamp`, `resolveTimestampsAsync`, `compileAsync`, `hasFeature` exist. Read their implementations before use.

## Steps
1. Write `docs/render/performance-contract.md`:
   - renderer topology (WebGPU: one renderer, N canvas targets; WebGL2: one renderer per visible scene, at most 4 live contexts);
   - frame scheduling (on-demand; animated scenes declare it);
   - budgets per tier (desktop: GPU ≤ 8 ms per frame for all visible scenes at 60 Hz; integrated: ≤ 12 ms; mobile: ≤ 14 ms at DPR ≤ 2; measured, not promised);
   - the quality ladder order (DPR → temporal samples → SSGI → ray steps → particle budget; never equations, seeds or labels);
   - rules: no per-frame allocation in render loops, no per-frame `needsUpdate` on buffers above 4 k elements (use compute, S08), `compileAsync` before reveal, instancing for repeated geometry, one draw call per particle system.
2. `js/render/stage/frame-scheduler.mjs` (pure, Node-tested):
   - `createFrameScheduler({ budgetMs, now })` with `register(view)` → handle `{ invalidate(), setAnimated(bool), setVisible(bool), setCostMs(ms), dispose() }` and `plan(now)` → ordered view ids to render this frame;
   - rules: invisible → never; animated & visible → every frame unless over budget, then round-robin by priority with at most 2 skipped frames per view; static & visible → render once after each `invalidate()`; reduced motion → animated views render at most 10 fps unless the user is interacting (`invalidate()` from input marks "interacting" for 300 ms);
   - deterministic given inputs.
3. `js/render/stage/shared-stage.mjs`:
   - `acquireStage({ backend })`. For WebGPU it returns a singleton holding one renderer (built with the existing `createRenderer` path so error handling and validation stay identical) plus a single `renderer.setAnimationLoop` driving the scheduler.
   - `stage.attach({ canvas, scene, camera, pipelineFactory, animated, onFrame })` wraps the canvas in `new CanvasTarget(canvas)`, keeps a per-view render pipeline, and returns the scheduler handle.
   - Each frame, for each planned view: `setCanvasTarget(view.target)`, `onFrame(dt)`, then the view's pipeline `render()` (or `renderer.render`).
   - Spike first: render two canvases, one with the bloom pipeline, one without, and confirm both present correctly with no validation errors. If a pipeline cannot be shared across canvas targets, give each view its own pipeline object (still one renderer). If CanvasTarget rendering fails on r186 at all, stop and record the exact error in the ledger.
   - For WebGL2: `acquireStage` returns a pool that grants at most 4 live renderers. When a fifth scene becomes visible, the least recently visible scene snapshots its last frame (`canvas.toBlob` → `<img>` placeholder over the canvas), disposes its renderer, and recreates it when visible again.
4. Remove `preserveDrawingBuffer: true` from both WebGL2 constructors. Grep every `toDataURL`, `toBlob`, `drawImage(renderer.domElement` and capture path (progressive capture, compare view, snapshots, QA capture) and make them render to a render target or call `render()` immediately before reading, in the same task. Add a Playwright assertion that captures still return non-blank images.
5. Governor (`js/render/quality-governor.mjs`) gains an optional `gpuFrameMs` input. When the WebGPU device has `timestamp-query`, the stage enables `trackTimestamp` and feeds resolved render times. Otherwise it keeps CPU time. Existing hysteresis and cooldown rules and their tests stay.
6. Integrate behind `QGA_RENDER_OPTIONS.stage = "shared"` (default off in this prompt). Migrate `AtlasStage` and the two QFT Fourier/field scenes as pilots. `Scene3D` reads the option and calls `stage.attach` instead of creating its own session; picking, labels and fullscreen keep working.

## Tests
- `test/frame-scheduler.test.mjs`: every rule above, plus starvation and determinism.
- `qa/specs/shared-stage.spec.mjs`: with the option on, the QFT view has exactly 1 live renderer on WebGPU-capable runs, or ≤ 4 on WebGL2; static scenes render 0 frames during 2 s of idle (count `onFrame`); captures are non-blank; no page errors.

## Acceptance
`npm test`, `npm run validate`, `npm run qa:critical`, `npm run qa:test -- qa/specs/shared-stage.spec.mjs`, `npm run perf:collect` with the option on and off, both recorded in the ledger.

## Commit
`feat(render): shared gpu stage with on-demand frames`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
