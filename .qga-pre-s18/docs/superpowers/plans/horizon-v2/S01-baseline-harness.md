# S01 — Measurement Harness and Baseline

> **Sequence 01 of 36.** First prompt; no prerequisite. Next: **S02**.
> **Closes findings:** none (enables later prompts).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S01** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Build a re-runnable measurement harness and record the baseline that every later prompt must beat or preserve. No product behaviour changes.

## Context you can rely on
- Every `<Scene3D>` in `js/scene3d.jsx` creates its own renderer through `QGA_RENDER.initializeRenderSession` → `js/render/create-renderer.mjs`. The WebGPU device is shared (`acquireGPUDevice`), but each renderer has its own pipeline and shader cache.
- The QFT view mounts three `<Scene3D>` plus the `AtlasStage` backdrop (`js/atlas-stage.jsx`).
- WebGL2 contexts are created with `preserveDrawingBuffer: true` (`create-renderer.mjs:205,208`).
- `js/render/quality-governor.mjs` adapts on rAF CPU frame time only.
- Production loads `react.development.js`, `react-dom.development.js` and Babel standalone; `js/bootstrap.mjs:145` transpiles every JSX file at load.
- CI's Playwright Chromium runs with `--disable-blink-features=WebGPU` (`qa/playwright.config.mjs:31`), so CI exercises the node renderer's WebGL2 backend on SwiftShader. WebGPU is measured only when the local browser exposes `navigator.gpu`.

## Steps
1. Create `scripts/perf/collect.mjs`. It launches Playwright Chromium against a local static server (reuse the server logic in `qa/global-setup.mjs`), visits every view id in `QGA_VIEWS` (`js/app.jsx:64`) at 1440×900 and at 390×844 (deviceScaleFactor 3), waits for `window.QGA_RENDER.renderDiagnostics` to report every scene `ready` or `static` (read `js/render/error-overlay.mjs` for the API), then records per view:
   - `renderers`: count of live renderers (add a read-only counter to `renderDiagnostics`: increment in `create-renderer.mjs` after construction, decrement in its dispose path; expose `renderDiagnostics.liveRenderers()`).
   - `programs`: WebGL `renderer.info.programs?.length` or, for node renderers, `renderer.info.render` plus the count of compiled pipelines if `renderer._pipelines` exposes it. Read the vendored source to find a stable field; if none exists, record `null` and say so in the report.
   - `cpuFrameMs` p50/p95 over 5 s of `requestAnimationFrame` deltas with the page scrolled so the first scene is in view.
   - `gpuFrameMs` p50/p95 when the renderer is a WebGPU renderer and the adapter has `timestamp-query`. Use `trackTimestamp: true` on a throw-away renderer created in the page plus `renderer.resolveTimestampsAsync(...)`. Read `vendor/three/build/three.webgpu.js` for the exact signature and return value before coding; record `null` when unsupported.
   - `firstFrameMs`: navigation start → first `ready` diagnostic.
   - `jsBytes`: transferred bytes of `.js`, `.jsx` and `.mjs` responses.
   - `babelMs`: wrap the transform loop in `js/bootstrap.mjs` with `performance.mark("qga:babel:start")` and `performance.mark("qga:babel:end")`. The marks stay; they cost nothing.
2. Create `scripts/perf/static-audit.mjs` (Node only) that prints:
   - count of `<VizCaption` per file and of `registerVisualization(` call sites;
   - `Math.random(` call sites with file:line;
   - hex, `rgb(`, `rgba(` and `oklch(` literals per file under `js/`;
   - `needsUpdate = true` sites per file;
   - `new THREE.Line(`, `LineBasicMaterial` and `ShaderMaterial` sites;
   - files over 800 lines.
3. Write `docs/audit/v2-baseline.md` with both tables, the environment (Chromium version, GPU string from `WEBGL_debug_renderer_info`, backend per scene) and the date.
4. Add `"perf:collect": "node scripts/perf/collect.mjs"` and `"perf:audit": "node scripts/perf/static-audit.mjs"` to `package.json`.
5. Record the headline numbers in the ledger under `evidence.measurements`, at minimum renderers on the QFT view, p95 CPU frame time on the BH view, and `babelMs`.

## Acceptance
- `npm test`, `npm run validate`, `npm run perf:audit` (deterministic output: run it twice and diff).
- `npm run perf:collect` completes on the CI-equivalent browser (WebGPU disabled) with no page errors.

## Out of scope
Any optimisation. If a metric cannot be read without changing behaviour, record `null` with the reason.

## Commit
`chore(perf): add measurement harness and v2 baseline`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
