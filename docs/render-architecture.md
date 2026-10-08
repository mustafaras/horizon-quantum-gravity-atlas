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
