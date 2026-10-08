# Render architecture contract

## Purpose

Prompt 00 establishes a non-visual architecture contract for the atlas renderer and scientific metadata layers. It documents the current zero-bundler runtime, defines ownership boundaries for later prompts, and introduces pure contract modules that later rendering work must consume without changing the present output.

## Module boundaries

- `js/physics.mjs` is the canonical pure science layer for testable calculations. It must stay importable in Node without DOM, React, Three.js, WebGL, WebGPU, or canvas requirements.
- `js/physics.jsx` is a browser bridge that mirrors the pure physics API onto `window.QGA_PHYSICS` for the current Babel/UMD runtime.
- `js/state.jsx` and `js/state-runtime.jsx` own URL-state parsing, share links, JSON export, and bounded external data access.
- `js/render/contracts.mjs` owns runtime-validated renderer contracts and re-exports the shared scientific provenance validator for render consumers.
- `js/render/capabilities.mjs` owns pure backend-selection and render-quality policy. It must not probe the DOM directly.
- `js/science/contracts.mjs` owns the shared scientific provenance validator and deep-freeze utility used by science-owned registries and render-facing descriptors.
- `js/science/provenance.mjs` owns atlas-wide provenance registration and retrieval.
- Render modules may consume science outputs and provenance entries.
- Science modules must never import render modules.

## Lifecycle order

Later renderers must implement the same ordered lifecycle:

1. `initialize`
2. `resize`
3. `update`
4. `render`
5. `suspend`
6. `resume`
7. `dispose`

`update` may advance deterministic simulation state. `render` may present it. `suspend` must stop nonessential animation and expensive GPU work without discarding scientific state. `dispose` must release renderer-owned GPU and DOM resources.

## Error behavior and static fallback contract

- Capability selection must resolve to exactly one backend: `webgpu`, `webgl2`, or `static`.
- `static` is a first-class fallback, not a silent failure mode.
- Initialization, shader compilation, context loss, media, export, and fetch errors must surface actionable UI text instead of broad catches that imply success.
- Reduced-motion mode must disable automatic camera motion, flashes, continuous parallax, and optional temporal/post-processing effects.
- A renderer that cannot initialize must leave the scientific narrative usable through a 2D analytical or textual fallback.

## Dynamic social metadata constraint

GitHub Pages serves this atlas as static files. Open Graph and Twitter crawlers fetch HTML without executing the atlas runtime or reconstructing arbitrary URL state. That means dynamic crawler-visible OG images cannot be generated reliably for atlas states such as `?view=rg&rgp=qcd&seed=42`. Later prompts may generate downloadable share cards for humans, but they must not claim those assets become crawler-visible dynamic OG metadata.

## Current runtime inventory

### Boot/runtime ownership

| File | Ownership boundary |
|---|---|
| `index.html` | Static document shell, local import map, React UMD and Babel Standalone dependencies, and inert JSX source entries evaluated by `js/bootstrap.mjs`. |
| `js/bootstrap.mjs` | Awaits the ESM runtime, installs the compatibility object, fetches/transforms JSX, then evaluates in document order with `js/app.jsx` last. |
| `js/render/three-runtime.mjs` | Imports pinned classic Three.js ESM and ESM post-processing; owns migration-only display compatibility. |
| `js/app.jsx` | React application shell, top-level atlas controls, view routing, and JSON export triggers. |
| `js/core.jsx` | Shared UI/runtime helpers including `usePRM`, `fitCanvas`, and `useSimLoop` for 2D analytical loops. |
| `js/scene3d.jsx` | Shared interactive WebGL scene host, renderer creation, bloom composer wiring, picking, labels, fallback messaging, and disposal helpers. |
| `js/atlas-stage.jsx` | Persistent full-viewport backdrop renderer behind the app shell. |
| `js/state.jsx` / `js/state-runtime.jsx` | URL-state contract, copy-link/export behavior, and GWOSC integration. |
| `js/physics.mjs` / `js/physics.jsx` | Pure scientific calculations and the current browser bridge. |

### Direct `window.THREE` references

Current direct `window.THREE` access is centralized in `js/scene3d.jsx`:

| File | Lines/area | Purpose |
|---|---|---|
| `js/scene3d.jsx` | `qgaWebGLAvailable()` | Capability gate caches `window.__qgaWebGL` and requires `window.THREE` before enabling 3D. |
| `js/scene3d.jsx` | `qgaBloomAvailable()` | Checks global example constructors `EffectComposer`, `UnrealBloomPass`, and `RenderPass`. |
| `js/scene3d.jsx` | `qgaMakeComposer()` | Reads `window.THREE` into `T` to construct post-processing passes. |

All other scene code assumes a global `THREE` symbol injected by `index.html`, but it does not dereference `window.THREE` directly.

### ShaderMaterial / RawShaderMaterial inventory

| File | Construct | Role |
|---|---|---|
| `js/mod-blackholes.jsx` | `new THREE.ShaderMaterial(...)` | Full-screen Kerr black-hole raymarch material for the flagship black-hole observatory. |
| `js/mod-gr.jsx` | `new THREE.ShaderMaterial(...)` | Curved-spacetime well material in the GR module. |
| _(none)_ | `RawShaderMaterial` | No current usage. |

### Renderer constructors

| File | Constructor | Ownership |
|---|---|---|
| `js/scene3d.jsx` | `new THREE.WebGLRenderer({ antialias, alpha, powerPreference, preserveDrawingBuffer: true })` | Shared module-level 3D scene host. |
| `js/atlas-stage.jsx` | `new THREE.WebGLRenderer({ antialias, alpha, powerPreference, preserveDrawingBuffer: true })` | Global backdrop renderer. |

No WebGPU renderer exists yet. Prompt 00 defines the contract for a future backend policy without changing the current WebGL2-first implementation.

### Animation loops

| File | Mechanism | Ownership |
|---|---|---|
| `js/core.jsx` | `useSimLoop()` via `requestAnimationFrame` | Shared Canvas 2D analytical simulations. |
| `js/core.jsx` | tweak-panel drawing loop via `requestAnimationFrame` | UI-only helper animation. |
| `js/scene3d.jsx` | `requestAnimationFrame(tick)` | Shared interactive 3D scene lifecycle. |
| `js/atlas-stage.jsx` | `requestAnimationFrame(tick)` | Persistent backdrop lifecycle. |
| `js/mod-blackholes.jsx` | `requestAnimationFrame(step)` | Module-local transitional animation. |
| `js/mod-experiments.jsx` | `requestAnimationFrame(draw/tick)` | Experiment module waveform and event-display motion. |
| `js/mod-gauge-rg.jsx` | `requestAnimationFrame(tick)` | RG module settling and staged transitions. |
| `js/mod-gr.jsx` | `requestAnimationFrame(frame)` | GR module local animation helpers. |
| `js/mod-qft.jsx` | `requestAnimationFrame(tick)` | QFT module phase animation helpers. |

No current renderer uses `renderer.setAnimationLoop()`.

### Canvas/export paths

| File | Export path | Notes |
|---|---|---|
| `js/state.jsx` | `QGA_EXPORT_JSON` downloads `horizon-qga-state.json` via `Blob` + temporary `<a download>` | State/provenance export only; no pixel capture. |
| `js/state-runtime.jsx` | `QGA_EXPORT_JSON` downloads `horizon-qga-state.json` via `Blob` + temporary `<a download>` | Runtime duplicate kept for the browser bridge. |
| `js/app.jsx` | Topbar `Export JSON` button invokes `QGA_EXPORT_JSON(qgaReadState())` | User entrypoint into the state export path. |
| `js/mod-gauge-rg.jsx` | Module button invokes `QGA_EXPORT_JSON(qgaReadState())` | RG-specific entrypoint into the same JSON export path. |

There is currently **no** canvas/image export path (`toBlob`, `toDataURL`, or equivalent). Both WebGL renderers keep `preserveDrawingBuffer: true`, so later prompts can add an explicit, user-visible capture path without inventing hidden behavior.

### Renderer disposal paths

| File | Disposal path | Ownership |
|---|---|---|
| `js/scene3d.jsx` | `built.dispose?.()`, `s3dDispose(scene)`, `composer.dispose?.()`, `renderer.dispose()`, DOM removal of label layer and canvas | Shared module scene teardown. |
| `js/scene3d.jsx` | `s3dDispose(root)` helper | Traverses scene graph, disposing geometries, materials, and non-shared maps. |
| `js/atlas-stage.jsx` | `s3dDispose(scene)` or geometry-only traverse fallback, `composer.dispose?.()`, `renderer.dispose()`, canvas removal | Backdrop teardown. |
| `js/mod-standard-model.jsx` | explicit `geometry.dispose()` / `material.dispose()` on transient geometry | Module-local resource cleanup outside the shared host. |

## Contract files introduced by Prompt 00

- `js/render/capabilities.mjs`
  - `detectRequestedBackend({ hasWebGPU, hasWebGL2, forceBackend })`
  - `normalizeRenderQuality({ preset, devicePixelRatio, reducedMotion })`
  - `normalizeRenderCapabilities(...)`
- `js/render/contracts.mjs`
  - JSDoc typedefs for `RenderCapabilities`, `RenderQuality`, `ScientificProvenance`, and `VisualizationDescriptor`
  - runtime validators that throw `TypeError` with field names on invalid data
- `js/science/contracts.mjs`
  - `validateScientificProvenance(value)`
  - `deepFreeze(value)`
- `js/science/provenance.mjs`
  - `registerVisualization(id, provenance)`
  - `getVisualizationProvenance(id)`
  - `listVisualizationProvenance()`

These modules are pure ESM, frozen on return, and safe to test in Node without the browser runtime.

## Prompt 01: pinned ESM migration

Three.js 0.186.1 (r186) was verified against `https://registry.npmjs.org/three/latest` and `npm view three version dist.integrity dist.tarball` on 2026-10-08. The official npm tarball was acquired with `npm pack three@0.186.1`; its package identity and SHA-512 digest were checked before copying. `vendor/three/VERSION` contains that integrity, timestamp, upstream URL and SHA-256 file manifest. The upstream MIT license is included unchanged.

The import map includes `three`, `three/webgpu`, `three/tsl` and `three/addons/`, but the app imports only the classic renderer and existing post-processing passes. WebGPU/TSL builds are self-hosted for the named import-map contract, not activated. Raw GLSL `ShaderMaterial` remains on WebGLRenderer. Since upstream has required WebGL2 since r163, the capability gate now requires WebGL2; a WebGL1-only device receives the same explicit 2D analytical fallback as an unsupported device.

### Deterministic boot

The JSX tags use `application/x-qga-jsx`, not `text/babel`, so Babel's DOMContentLoaded loader cannot execute them. `js/bootstrap.mjs` dynamically imports the runtime (with visible initialization failure handling), installs `window.THREE`, fetches the JSX sources, transforms them all using Babel's `react` and `env` presets, then evaluates them together in document order. A synchronous load/transform/evaluation error prevents the final app mount and displays an actionable alert. `js/app.jsx` still owns the sole `ReactDOM.createRoot` call. No bundler or server runtime is introduced; all paths remain relative for GitHub Pages subdirectory hosting and old URL parameters are unchanged.

`DOMContentLoaded` alone is not an app-readiness signal while the module entry awaits imports/fetches. Browser reload tests wait for the existing measurable view-mounted readiness probes before reading JSX-owned state globals.

### Compatibility global allowlist

Only `window.THREE` is installed by the ESM bootstrap. It is a frozen object with these members, derived from current JSX usage and existing composer wiring:

```text
AdditiveBlending, AmbientLight, ArrowHelper, BoxGeometry, BufferAttribute,
BufferGeometry, CanvasTexture, CircleGeometry, Color, ConeGeometry,
CylinderGeometry, DirectionalLight, DoubleSide, EffectComposer, FogExp2,
GammaCorrectionShader, GridHelper, Group, IcosahedronGeometry, Line,
LineBasicMaterial, LineDashedMaterial, LineSegments, MathUtils, Mesh,
MeshBasicMaterial, MeshStandardMaterial, OctahedronGeometry, PerspectiveCamera,
PlaneGeometry, Points, PointsMaterial, QuadraticBezierCurve3, Raycaster,
RenderPass, REVISION, Scene, ShaderMaterial, ShaderPass, SphereGeometry,
Sprite, SpriteMaterial, TorusGeometry, TorusKnotGeometry, UnrealBloomPass,
Vector2, Vector3, WebGLRenderer
```

The other JSX-owned globals remain unchanged; the bootstrap does not copy all Three.js exports to `window`. Later approved prompts should remove this bridge as components become ESM.

### Display and cleanup compatibility

Upstream sources for the pinned package (`src/renderers/WebGLRenderer.js`, `src/math/ColorManagement.js`, `src/renderers/webgl/WebGLState.js`, `src/renderers/shaders/ShaderChunk/lights_pars_begin.glsl.js`, and the vendored post-processing modules) define the migrated APIs. The bridge deliberately retains r147's display conventions: `ColorManagement.enabled = false`, `LinearSRGBColorSpace` output, the existing GammaCorrectionShader pass, and ambient/directional intensities scaled by pi to compensate for removal of legacy lighting. Composer and bloom targets use `UnsignedByteType` rather than the current HDR default, preserving the old clipping/bloom range.

Two upstream defaults caused measurable visual regressions and require narrowly pinned adapters. Non-premultiplied additive blending now accumulates alpha with `ONE, ONE`; the renderer's `state.setMaterial` adapter supplies `CustomBlending` with r147's `SRC_ALPHA, ONE` factors for both color and alpha, without modifying scene materials. Current bloom uses a different Gaussian kernel, RGB-derived alpha and luminance coefficients. The subclass overrides the pinned `_getSeparableBlurMaterial` / `_getCompositeMaterial` hooks to retain normalized r147 weights through the current bilinear sampler, the old alpha-based composition and `0.299, 0.587, 0.114` high-pass coefficients. The small preserved composition shader derives from the upstream MIT-licensed r147 example; vendored r186 sources remain byte-identical to the official package. These adapters are deliberately version-specific and must be reverified before any version upgrade. There is no tone-map, camera or scientific-equation redesign.

The compatibility composer disposes each installed pass as well as its internal targets; upstream `EffectComposer.dispose()` alone does not dispose added passes. Existing scene and backdrop teardown still own their animation frames, observers, listeners, geometry/material disposal and canvas removal.

### Migration gates

`test/three-vendor.test.mjs` and `scripts/lib/three-vendor.mjs` check exact manifest versions, local import-map roots, transitive imports, integrity and absence of legacy assets. `qa/specs/esm-runtime.spec.mjs` checks overview/GR/BH rendering, single mounting, shader/console errors, failed/external requests, old deep links, reload/history, animation cleanup, WebGL1-only/non-WebGL fallback, delayed-module boot ordering, import-map entrypoints and visible bootstrap failure. A pixel-level alpha assertion and normalized bloom/pass-disposal checks protect the compatibility settings. Run `npm test`, `npm run validate`, and `npm run qa:test -- qa/specs/esm-runtime.spec.mjs`; compare seeded reduced-motion overview/GR/BH captures with the pre-migration images without updating committed baselines.

Pre/post visual comparisons on Chromium used seed 42, reduced motion, fixed animation time, a 1600x1000 viewport and separate application/vendor random streams (UUID allocation counts change between releases). The overview viewport and GR/BH renderer regions retained identical geometry/layout; mean absolute RGB channel differences were respectively 0.02625, 0.05634 and 0.16821 on a 0-255 scale. Pixels differing by more than 16 in any channel were 0/1,600,000, 3/480,000 and 0/460,000. The remaining differences are minor rasterization/rounding, not an approved redesign. Ordinary seeded captures can still reposition decorative stars because the legacy app shares `Math.random` with renderer UUID generation; scientific seeded state/equations are unchanged. Committed screenshot baselines were not refreshed.

## Prompt 02: asynchronous cinematic rendering

The previous section records the migration baseline, not the current production policy. The production hosts no longer instantiate the compatibility renderer or call `qgaMakeComposer`. The retained helpers support legacy integration checks only. Native color management is enabled; ambient/directional intensities no longer receive the legacy pi multiplier. Native renderer output uses sRGB and AgX (Neutral is an explicit comparison option), with HDR effect targets and final output conversion exactly once. Shadows are disabled in current atlas scenes; no artificial shadow source is invented.

### Ownership and compatibility

| Module | Responsibility |
|---|---|
| `create-renderer.mjs` | Actual material audit, awaited GPU/GL initialization and scene compilation, bounded fallback, output/light/shadow policy, owned GPU device leases and idempotent renderer disposal |
| `await-initialization.mjs` | Abort/timeout propagation and release of late platform results |
| `webgpu-validation.mjs` | Version-guarded native r186 validation boundary, tracked error scopes, shared-device compilation serialization and awaited diagnostic disposal |
| `render-pipeline.mjs` | Ordered real TSL/classic effect graph, precise support reasons, prewarm and effect disposal |
| `render-session.mjs` | Host-independent sizing, quality application, pipeline rebuild/prewarm, context loss and diagnostics publication |
| `quality-governor.mjs` | Pure bounded rolling window, hysteresis, cooldown and deterministic rendering-budget changes |
| `shader-prewarm.mjs` | Renderer-scoped weak cache keyed by scene/view/backend/material versions/full quality/pipeline identity |
| `error-overlay.mjs` | Bounded developer messages, active-session diagnostics and actionable failure descriptions |
| `Scene3D` / `AtlasStage` | Scene construction, abort ownership, camera/input, visible initialization/fallback, one render loop and scene disposal |

The official r186 `StandardNodeLibrary` maps standard basic/standard/physical/phong/lambert/toon/normal/matcap, line, points, sprite and shadow materials to node materials. It does **not** map `ShaderMaterial`/`RawShaderMaterial` or custom GLSL `onBeforeCompile` hooks. The factory audits the complete built scene before choosing a renderer. GR and BH therefore use **classic WebGL2**, even on a GPU-capable machine. Compatible scenes may use **native WebGPU**. A node renderer actually initialized on its upstream **WebGL2 node backend** reports `webgl2 / nodes`, not WebGPU. Neither API presence nor requested backend is presented as active backend.

GPU initialization is serialized and active node renderers share a reference-counted, externally supplied GPUDevice, avoiding repeated device acquisition while a backdrop is rendering. Each renderer still owns its textures/buffers/pipeline caches. The last device lease destroys the device. Uncaptured device errors are routed to all current owners; disposed owners are removed. The pinned backend explicitly leaves externally supplied devices to their owner. Platform acquisition/init stages have 20-second upper bounds, abort immediately, and dispose late results. A failed GPU attempt retries classic GL once. A failed GL attempt returns an explicit analytical fallback. No promise rejection is treated as successful GPU initialization.

### Verified pinned APIs

API authority is the installed official `three@0.186.1` source, checked against the unchanged vendored builds and checksum manifest:

- `src/renderers/webgpu/WebGPURenderer.js`: asynchronous `init()`, `forceWebGL`, inherited backend `device` option and automatic fallback.
- `src/renderers/common/Renderer.js`: `initialized`, `compileAsync(scene, camera)`, `setAnimationLoop(callback)`, asynchronous `dispose()`, `onDeviceLost` and `onError`.
- `src/renderers/webgpu/WebGPUBackend.js`: adapter/device requirements, externally owned device disposal, real feature detection and uncaptured error delivery.
- `src/renderers/webgpu/nodes/StandardNodeLibrary.js`: exact material and tone-mapping mappings.
- `src/renderers/common/RenderPipeline.js`: `new RenderPipeline(renderer)` and automatic final output transform.
- Classic `WebGLRenderer`: `compileAsync` and `debug.onShaderError`; current `AgXToneMapping`, `NeutralToneMapping`, `SRGBColorSpace`.

The native factory attaches `webgpu-validation.mjs` after initialization and before its first compilation. Pinned `WebGPUPipelineUtils` has untracked `popErrorScope().then(...)` continuations and asynchronous Promise executors that can orphan failures. The adapter guards the r186 private utility shape, uses genuine synchronous native pipeline creation, and tracks scope/diagnostic continuations through compilation, draw error delivery and disposal. Genuine shader/validation failures still reject the awaited operation or reach `renderer.onError`; no global rejection suppression, synthetic success or vendor-source patch is used. Shared-device compilation operations are serialized. This private boundary must be reverified before upgrading Three.js. Before the last lease destroys the shared device, `drainWebGPUValidation(device)` settles every tracked error scope and `device.queue.onSubmittedWorkDone()` gives the browser a queue tick (each bounded to 10 seconds). Chromium logs `Instance dropped in popErrorScope` for every scope still unresolved at `device.destroy()`; QA keeps that console error as a hard failure rather than filtering it. This mitigation is verified on Linux CI only; macOS SwiftShader resolves scopes synchronously and could not reproduce the message.

Node effects use `pass(scene,camera,{samples:0})`, `mrt({output,velocity})`, `ao(depth,null,camera)` with `denoise`, genuine `ssgi(texture,depth,null,camera).getGINode()`, `bloom`, `godrays`, `dof`, `traa`, `motionBlur`, `chromaticAberration`, `lensflare`, `film` and a TSL radial vignette. The SSGI default AO output is **not** mislabeled indirect illumination. MotionBlur's pinned inclusive kernel is explicitly normalized. Temporal AA uses upstream's fixed 32-position jitter; the application's temporal budget gate switches it off at one, not a fictitious adjustable jitter count.

Classic effects use current `EffectComposer`, `RenderPass`, `GTAOPass`, `UnrealBloomPass`, `BokehPass`, `ShaderPass(RGBShiftShader)`, `FilmPass`, `ShaderPass(VignetteShader)` and `OutputPass`. These are not the old migration adapters. Film/GTAO display noise uses deterministic seeded display permutations. All newly needed upstream addons and their complete import closure are byte-identical, licensed and SHA-256 covered in `vendor/three/VERSION`; validation walks the runtime's transitive imports.

### Ordered effect policy

Every diagnostics entry includes all effect stages, in this order: base render, AO, SSGI, bloom, god rays, DOF, temporal AA, motion blur, chromatic aberration, lens dirt, flare, grain, vignette, final tone mapping. A disabled stage is distinguishable from an unsupported requested stage.

| Effect | Node path | Classic WebGL2 | Current default |
|---|---|---|---|
| Base / final tone mapping | Real render / output transform | RenderPass / OutputPass | Enabled |
| AO | GTAO + denoise | GTAOPass | Scientific/cinematic/capture, not minimal |
| SSGI | Genuine GI output, format/perspective gated | Unsupported | Opt-in capture only |
| Bloom | BloomNode | UnrealBloomPass | Cinematic/capture |
| God rays | Shadow-source/receiver gated GodraysNode | Unsupported | No source supplied, disabled |
| DOF | DOFNode | BokehPass | Fixed focus, cinematic non-reduced motion only |
| Temporal AA | TRAANode, velocity gated | Unsupported | Scientific/cinematic/capture if temporal gate > 1 |
| Motion blur | Velocity gated MotionBlur | Unsupported | Cinematic **full** motion only |
| Chromatic aberration | ChromaticAberrationNode | RGBShiftShader | Conservative cinematic only |
| Lens dirt | Unsupported without a verified texture | Unsupported | No fabricated texture |
| Lens flare | LensflareNode | Unsupported | Cinematic node path only |
| Grain | FilmNode | FilmPass | Subtle cinematic, no reduced-motion grain |
| Vignette | TSL radial attenuation | VignetteShader | Conservative cinematic only |

Low-detail and system/user reduced-motion quality disable all optional effects. Reduced motion also removes automatic orbit intro/drift/parallax, animated focus and the GR decorative star pulse. It does not change science equations; analytical simulation pause remains explicit. Capture excludes optical distortions/DOF/motion blur/grain. Focus is fixed at `max(2*near,8)` world units; current cameras have far planes comfortably beyond this value. Current scenes do not supply light sources for volumetric effects.

Scene depth is an independent capability. The black-hole fullscreen raymarch does not write ray-hit depth; `renderCapabilities.depth = false` therefore marks requested AO, SSGI, god rays, DOF, temporal AA and motion blur unsupported. Proxy-quad depth is never relabeled physical geometry. Other scenes retain the default geometric-depth policy.

### Lifecycle and adaptive budgets

Scenes are built before renderer selection. Real initialization/prewarming is shown instead of a frozen first frame. The factory compiles scene materials; pipeline prewarm renders its complete hidden graph and waits for GPU validation/work completion before reveal. Cache invalidation includes material identity/version, view, backend, full quality and pipeline instance. Failure or cancellation cannot leave a successful cache record. Renderers and pipelines are never reused across an incompatible scene/material path.

Resize updates the actual drawing buffer, camera and all effect targets. Frame-time measurement uses elapsed wall time rather than the simulation's clamped timestep. Hidden/offscreen/covered hosts suspend GPU work and clear governor history. Classic hosts own one RAF; node hosts use the renderer's already-running animation loop instead of adding another RAF. Teardown aborts pending work, removes listeners/observers, disposes effect resources and scene geometry/materials, releases the renderer/device and removes canvases/labels. Runtime errors replace the scene with analytical content and an actionable retry rather than logging a success-shaped fallback.

The governor retains at most 60 frame times. A mean above 26 ms for two windows downgrades; below 14 ms for three windows upgrades, with at least 3 seconds between changes. Both directions prioritize DPR, temporal gate, SSGI, volumetric steps, then particle budget. Unsupported/inactive dimensions are skipped. Point-cloud quality changes use deterministic geometry draw ranges distributed across existing point geometries, never rerolling the seed. Volumetric steps require an explicit display-budget hook; **BH geodesic integration uniforms are not modified**. Rebuilds hide and prewarm before reveal; actual effects/budgets are published after application, not inferred from requested settings.

Visible frames longer than 250 ms remain part of the measured window: severe software-rendering stalls must lower the reported FPS and trigger adaptation, not be mistaken for hidden-tab gaps. Hosts explicitly suspend/reset measurements when hidden or offscreen. A pipeline being rebuilt is detached before asynchronous construction so a concurrent ResizeObserver cannot resize the disposed graph; the replacement receives the latest dimensions during prewarm.

Pipeline disposal waits for in-flight compilation and diagnostics before releasing effect resources. Sessions retain ownership of detached retiring pipelines and await their disposal before renderer/device release, including cancellation and fallback.

The standalone Rendering settings control exposes named presets, backend policy and tone-mapping comparison with labeled 44px native controls. Developer metrics remain in a collapsed drawer, not the normal scientific UI. Backend/preset additions are presentation settings only; existing URL schema and exported science state are unchanged.

Acceptance: `npm test`, `npm run validate`, `npm run qa:test -- qa/specs/render-backends.spec.mjs qa/specs/reduced-motion.spec.mjs`, followed by ESM/state/runtime regressions. Native GPU availability and software-versus-hardware identity are recorded explicitly; software WebGPU is not physical GPU evidence.

### Prompt 02 verification evidence

On 2026-10-08, all 105 Node tests and repository validation passed. The exact backend/reduced-motion acceptance command passed 13/13 cases; ESM, state, render-contract and all-view smoke regressions passed 30/30. These exercise failed/delayed initialization, navigation cancellation, shader compilation, context loss, material rebuild concurrent with resize, actual buffer/particle budgets, preset switching and device destruction. Browser observers reject unexpected page/console/shader errors, failed requests and external runtime assets.

The applied-budget fixture reduced the drawing-buffer width from 320 to 160 pixels and the rendered point range from 24,000 to 1,000, retained an honest 1 FPS for injected 1,000 ms foreground frame times, preserved exported state byte-for-byte, and removed the disposed canvas. The native GPU test rendered both the backdrop and mapped Standard Model scene through all four presets on Google's SwiftShader (`isFallbackAdapter: true`). One cold adapter request timed out at the documented 20-second bound and visibly fell back to classic GL; subsequent initialization used actual native WebGPU.

The final bounded software-only cinematic timing sample contained 14 frames: mean 1,023.79 ms and p95 1,350.10 ms. The two live diagnostics showed approximately 1.06 and 0.98 FPS, not stale warmup rates. This is approximately 1 FPS on this software adapter, **not** evidence of acceptable hardware performance. Physical GPU performance remains unverified. Performance sampling is capped at 30 frames or about 15 seconds (finishing the current frame), without skipping shader/preset/disposal assertions.

Overview/GR/BH classic-GL and native-software SM screenshots, adapter identity, actual effect matrices, budget changes and timing JSON are retained as session evidence rather than replacing historical screenshot baselines. Authored-source whitespace checks pass; upstream addon whitespace is intentionally unchanged to preserve official byte-identical checksums and license integrity.

CI installs pinned dependencies before renderer contract tests. Its ordinary Chromium regression project explicitly disables WebGPU to exercise the classic/static baseline deterministically; the dedicated native test launches a separate WebGPU-enabled browser, unaffected by that baseline policy. API/adapter presence is not rendering success. If that separate browser demonstrably loses a real device unexpectedly, records the loss, and cleanly reports the bounded classic fallback, its native-rendering assertions are marked unavailable on that runner. Shader/validation failures without actual device loss still fail the test. The earlier Linux failure recorded no unexpected device losses: its orphaned validation promises motivated the pinned boundary above, not a hardware-unavailability exemption. GW load-cancellation tests hold the response until cancellation, and motion tests record actual initial autoplay/playhead progression rather than inspecting a button after the entire four-second signal can finish.
