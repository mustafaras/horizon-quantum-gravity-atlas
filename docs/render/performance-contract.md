# HORIZON render performance contract

This is the contract every scene, lab and renderer change is held to. Numbers marked **measured** come from `npm run perf:collect`; everything else is a rule the code enforces or a budget a test checks. Nothing here is a promise about hardware we have not measured.

Status: S05 (S04 introduced the stage). The shared stage is the **default**: every `<Scene3D>`, the Atlas backdrop, the Kerr observatory and the GW instrument draw through it. `?stage=legacy` (or `QGA_RENDER_OPTIONS.stage = "legacy"`) is the escape hatch back to one renderer per scene. It is kept for one release and is then removed together with the per-scene renderer path in `js/render/render-session.mjs`; a scene can also opt out of the stage with `<Scene3D shared={false}>`.

## 1. Renderer topology

| Backend | Topology | Owner |
|---|---|---|
| WebGPU | **One** `WebGPURenderer` per page. Each scene canvas is wrapped in a `CanvasTarget`; the renderer switches target per view (`setCanvasTarget`). One device, one pipeline cache, one shader cache. | `js/render/stage/shared-stage.mjs` |
| WebGL2 | One renderer **per visible scene**, at most **4 live contexts** (`QGA_RENDER_OPTIONS.maxContexts`, default 4). A WebGL context belongs to exactly one canvas, so contexts cannot be shared. | `shared-stage.mjs` + `context-pool.mjs` |

**Asynchronous setup is exclusive.** On the shared WebGPU renderer a view's pipeline build, shader prewarm and pipeline swap run through `view.exclusive()`: one at a time, with the frame loop paused until they finish. Without it, a prewarm that awaits between "set my canvas target" and "draw" draws into whichever view the loop last activated (seen as validation errors on destroyed or doubly-used textures).

A scene that cannot join the shared WebGPU renderer (classic `ShaderMaterial` content such as the Kerr WebGL2 GLSL path and the GR gravity well, a shadow-casting light source, `forceBackend: "webgl2"`) is granted a dedicated WebGL2 renderer through the pool; a scene outside the shared stage keeps its own renderer exactly as before.

**WebGL2 context budget.**

- A scene created out of view while the budget is full is *parked*: no renderer, no pipeline, an empty host. It gets a context when it is first seen.
- When a scene needs a context and none is free, the live scene that was visible **longest ago** (hidden scenes first, never the requester) snapshots its last frame into an `<img data-qga-snapshot>` placed over the canvas (`toBlob`), disposes its pipeline and renderer, and gives the slot back. When it is visible again it is recreated and the snapshot removed.
- A scene that is not in view never evicts one that is.
- Acquisitions are serialised, and a view that is still being built is never evicted mid-build.

**Drawing buffer.** WebGL contexts are created **without** `preserveDrawingBuffer`. Anything that reads a canvas (snapshot thumbnails, pool snapshots, QA captures) must render and read in the same task: use `sceneHandle.capture()` / `session.capture()`, which renders now and returns the canvas. Page screenshots are unaffected (they read the compositor).

## 2. Frame scheduling

`js/render/stage/frame-scheduler.mjs` decides, once per animation frame, which views draw (pure, deterministic, tested with an injected clock).

- **Invisible** → never draws. An invalidation that arrives while hidden is paid once on return.
- **Static and visible** → draws once after each `invalidate()`; several invalidations before the next frame coalesce into one. An idle static scene draws **0 frames**.
- **Animated and visible** → draws every frame. If the summed measured cost of the candidates exceeds the frame budget, views are taken in priority order, round-robin, and a view that has been skipped twice in a row is forced in (**at most 2 skipped frames**). At least one view always draws.
- **Reduced motion** → animated views draw at most **10 fps**, except while the user is interacting (any input `invalidate()` marks 300 ms of interaction).
- The stage stops its loop when nothing has work and restarts on any state change. Any `input`, `change`, `click`, `keyup` or `pointerup` anywhere on the page invalidates every visible view once, so a paused scene still shows live parameter changes.

Every `<Scene3D>` declares `animated` (policy in `js/render/stage/animation-policy.mjs`, tested):

| `animated` | Meaning | Draws frames |
|---|---|---|
| `true` | evolves while the simulation plays, with or without motion (a field integrating in time, a binary inspiral, orbiting bodies) | while playing |
| `"motion"` | ambient or decorative motion that the scene's own code freezes when the motion factor is 0 (pulses, jitter, drift, dust) | while playing **and** motion > 0; under reduced motion it settles on one frame and idles |
| `false` | changes only on input and `invalidate()` | on demand |

A scene may report its own state with `isAnimated()` instead of the declaration: the **Kerr observatory** draws until its progressive accumulation converges (and while the WebGL2 disk plasma animates), then idles; the **GW spacetime lattice** draws while the transport or audio clock runs and gets one frame per scrub (`invalidateKey={playT}`); the Planck descent keeps drawing until its probe has eased onto its slider target. Transient motion (inertia, camera easing, the intro, a highlight, a drag, cinematic drift) always keeps a scene animated until it settles. Every parameter change reaches the scene as an `input`/`change`/`click`/`keyup` event or an explicit `invalidate()`.

## 3. Budgets per tier

GPU time for **all visible scenes together**, per frame:

| Tier | Budget | Frame rate |
|---|---|---|
| Desktop | GPU ≤ 8 ms | 60 Hz |
| Integrated GPU | GPU ≤ 12 ms | 60 Hz |
| Mobile | GPU ≤ 14 ms, DPR ≤ 2 | 60 Hz |

These are budgets the quality governor steers by and the perf harness reports against, **measured, not promised**. The scheduler's `budgetMs` is 8 ms by default (`QGA_RENDER_OPTIONS.frameBudgetMs`).

**Where GPU time comes from.** On WebGPU the stage creates the renderer with `trackTimestamp: true`. When the device has `timestamp-query`, every 30 frames it resolves the render timestamps (`renderer.resolveTimestampsAsync("render")`, milliseconds for the last renderer frame). The value is attributed to the view drawn last in that frame: exact with one visible view, an approximation with several. Fresh values (under 1 s old) replace CPU time as that view's scheduler cost and are passed to the governor as `gpuFrameMs`. Without `timestamp-query` (and on WebGL2) the governor keeps CPU frame time.

**Governor.** `createQualityGovernor` judges a window on GPU time only when every frame in the window carries one (`gpuSlowMs` 8 ms, `gpuFastMs` 4 ms by default); otherwise on CPU time (`slowMs` 26, `fastMs` 14). Window length, hysteresis and the 3 s cooldown are the same in both modes.

## 4. Quality ladder

When the governor must give up quality it moves in this fixed order, down and back up in reverse:

1. device pixel ratio (`maxDpr`)
2. temporal samples (TRAA)
3. SSGI
4. ray-march steps
5. particle budget

It **never** changes equations, seeds or labels. Only rendering budgets move.

## 5. Rules for render code

- **No per-frame allocation** in render loops (vectors, arrays, closures, objects).
- **No per-frame `needsUpdate`** on buffers above 4 k elements. Use compute (S08) or update a sub-range on change.
- **`compileAsync` before reveal**: a scene is prewarmed (shaders and pipeline graph) while hidden.
- **Instancing** for repeated geometry; **one draw call per particle system**.
- Scenes render **on demand**: call `invalidate()` when something that affects the frame changes; declare animation with `setAnimated`.
- WebGL drawing buffers are not preserved: read pixels only via `capture()` or a render target.
- TSL on node materials for new GPU code; it must run on both WebGPU and the node renderer's WebGL2 backend.

## 6. How it is checked

| Check | What it asserts |
|---|---|
| `test/frame-scheduler.test.mjs` | every scheduling rule, starvation bound, determinism, context-pool eviction order |
| `test/quality-governor.test.mjs` | existing hysteresis and cooldown, plus `gpuFrameMs` |
| `qa/specs/shared-stage.spec.mjs` | live-context budget on WebGL2, parking / snapshot / restore, 0 frames while idle, non-blank captures, one renderer and GPU time on WebGPU |
| `npm run perf:collect -- --render-option=stage=shared` | renderer count, programs and frame times with the stage on, next to the default run |

## 7. Measured (S04)

Recorded in the ledger (S04 `evidence.measurements`) with the raw files `docs/audit/s04-stage-off.json` and `docs/audit/s04-stage-on.json`. Environment: Playwright Chromium on SwiftShader (software rasterizer), WebGPU disabled as in CI. Absolute frame times on a shared CPU are pessimistic and noisy; renderer and program counts are the firm numbers.
