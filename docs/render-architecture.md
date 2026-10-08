# Render architecture contract

## Purpose

Prompt 00 establishes a non-visual architecture contract for the atlas renderer and scientific metadata layers. It documents the current zero-bundler runtime, defines ownership boundaries for later prompts, and introduces pure contract modules that later rendering work must consume without changing the present output.

## Module boundaries

- `js/physics.mjs` is the canonical pure science layer for testable calculations. It must stay importable in Node without DOM, React, Three.js, WebGL, WebGPU, or canvas requirements.
- `js/physics.jsx` is a browser bridge that mirrors the pure physics API onto `window.QGA_PHYSICS` for the current Babel/UMD runtime.
- `js/state.jsx` and `js/state-runtime.jsx` own URL-state parsing, share links, JSON export, and bounded external data access.
- `js/render/contracts.mjs` owns runtime-validated renderer and provenance contracts.
- `js/render/capabilities.mjs` owns pure backend-selection and render-quality policy. It must not probe the DOM directly.
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
| `index.html` | Static document shell, vendor script order, CSS, and Babel-loaded module entrypoints. Current runtime depends on self-hosted React UMD, Babel Standalone, Three.js r147 UMD, and Three example globals. |
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
- `js/science/provenance.mjs`
  - `registerVisualization(id, provenance)`
  - `getVisualizationProvenance(id)`
  - `listVisualizationProvenance()`

These modules are pure ESM, frozen on return, and safe to test in Node without the browser runtime.
