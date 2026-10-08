# HORIZON Ultra-Realistic Atlas Implementation Prompt Pack

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan prompt-by-prompt. Do not run prompts in parallel. Each prompt assumes every earlier prompt has passed its acceptance gate and has been committed.

**Goal:** Transform HORIZON into a scientifically grounded, ultra-realistic, cinematic quantum-gravity atlas using the current stable Three.js/WebGPU/TSL stack while retaining a robust WebGL2 fallback, static GitHub Pages deployment, reduced-motion behavior, and explicit scientific-status labeling.

**Architecture:** Migrate the legacy global Three.js r147 runtime to self-hosted native ESM loaded through an import map, then introduce a renderer capability layer that selects WebGPU or WebGL2 without duplicating application logic. Add physically motivated simulations behind stable interfaces, a composable render pipeline, cinematic direction, premium interaction and export services, and finally enforce scientific, performance, accessibility, and visual-regression gates.

**Tech Stack:** React 18 UMD, Babel standalone JSX, Three.js current stable ESM, WebGPURenderer, TSL, WebGL2 fallback, KaTeX, Web Audio API, MediaRecorder, Service Worker, Node test runner, Playwright.

**Spec:** This document is the executable specification. The “Global execution contract” and prompt acceptance gates are normative.

## Global Constraints

- Preserve zero-bundler static deployment: no Vite, Webpack, Rollup, Next.js, server runtime, database, or required cloud service.
- Self-host every runtime dependency under `vendor/`; production must make no third-party CDN requests.
- Determine the latest stable Three.js version at execution time from the official npm registry, pin that exact version, and record it in `package.json`, `package-lock.json`, `README.md`, and `vendor/three/VERSION`.
- Use native ESM and an import map for Three.js. Do not recreate or depend on the removed Three.js UMD/global build.
- WebGPU is an enhancement, not a requirement. Every core module must remain functional through WebGL2 or a deliberate non-WebGL fallback.
- Preserve the current URL-state contract and old shared links. Schema additions must be versioned and default safely.
- Never describe a schematic, toy, conjectural, extrapolated, or artistically enhanced view as observed or exact.
- Every visualization must expose `model`, `assumptions`, `validity`, `numerical method`, and `references` metadata through a shared provenance interface.
- Scientific computation belongs in pure modules that can be tested without DOM, React, Three.js, WebGPU, or canvas.
- All stochastic output must accept a deterministic seed.
- Never silently lower scientific accuracy. Quality changes may alter sampling density or display resolution, but must not change equations or claim labels.
- Respect `prefers-reduced-motion`; reduced mode must remove automatic camera motion, flashes, continuous parallax, and nonessential temporal effects.
- Preserve keyboard access, visible focus, readable contrast, and usable 44px touch targets.
- Avoid broad catches and success-shaped fallbacks. Surface initialization, shader compilation, media, export, and data errors in the UI with actionable messages.
- Keep edits surgical. Split new responsibilities into focused files rather than extending the existing 1,000+ line module files indefinitely.
- Run `npm test`, `npm run validate`, and the prompt-specific Playwright tests before each prompt is complete.
- Commit exactly one coherent deliverable per prompt with the required co-author trailer:

```text
Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>
```

---

## Global Execution Contract

Copy exactly one prompt at a time into a fresh coding-agent session on the branch containing the preceding prompt’s commit.

Before editing, every agent must:

1. Read this file’s Global Constraints and the assigned prompt completely.
2. Inspect `git status`, the relevant implementation files, existing tests, and the preceding prompt’s commit.
3. Treat unrelated dirty changes as user work and do not overwrite or revert them.
4. Verify all claimed current APIs against official Three.js source/docs for the pinned version; do not implement from stale memory.
5. Write or update tests before implementation when the behavior is testable in Node or Playwright.
6. Preserve the existing scientific-status vocabulary: `established`, `effective`, `conjectural`, `schematic`, `heuristic`, and `open`.
7. Stop and report a concrete blocker rather than replacing a required scientific algorithm with a fake visual.

At completion, every agent must:

1. Run the exact acceptance commands listed in its prompt.
2. Inspect browser console errors and failed network requests.
3. Confirm reduced-motion and WebGL2 fallback behavior where relevant.
4. Update directly related README or in-app documentation.
5. Commit only the files belonging to the prompt.
6. Report the commit hash, files changed, tests run, and any quantitatively measured limits.

---

## Prompt 00 — Establish the Render and Scientific Architecture Contract

```text
You are implementing Prompt 00 of the HORIZON Ultra-Realistic Atlas prompt pack.

Objective
Create the tested architecture contract that every later renderer and physics feature must use. Do not change the current visual output in this prompt.

Required investigation
- Read package.json, index.html, scripts/validate-repo.mjs, js/app.jsx, js/core.jsx, js/scene3d.jsx, js/atlas-stage.jsx, js/state.jsx, js/state-runtime.jsx, js/physics.mjs, js/physics.jsx, and qa/playwright.config.mjs.
- Inventory every direct window.THREE reference, ShaderMaterial/RawShaderMaterial, renderer constructor, animation loop, canvas export path, and renderer disposal path.
- Record the inventory in docs/render-architecture.md with exact file paths and ownership boundaries.

Files
- Create js/render/capabilities.mjs: pure capability policy and normalized capability result.
- Create js/render/contracts.mjs: JSDoc typedefs and runtime validators for RenderCapabilities, RenderQuality, ScientificProvenance, and VisualizationDescriptor.
- Create js/science/provenance.mjs: frozen provenance registry with registerVisualization(), getVisualizationProvenance(), and listVisualizationProvenance().
- Create test/render-contracts.test.mjs and test/provenance.test.mjs.
- Create docs/render-architecture.md.
- Modify package.json only to ensure the existing test glob includes the new tests; do not add dependencies.

Required interfaces
- detectRequestedBackend({ hasWebGPU, hasWebGL2, forceBackend }): returns "webgpu", "webgl2", or "static".
- normalizeRenderQuality({ preset, devicePixelRatio, reducedMotion }): returns a frozen object with preset, maxDpr, particleBudget, raySteps, temporalSamples, and postEffects.
- validateScientificProvenance(value): throws TypeError containing the missing field name.
- registerVisualization(id, provenance): rejects duplicate ids and invalid status labels.
- ScientificProvenance fields: model, status, assumptions[], validity[], numericalMethod, references[].

Tests
- Cover WebGPU preference, forced WebGL2, static fallback, reduced-motion quality, deterministic quality presets, invalid provenance, duplicate registration, and immutable returned data.
- Tests must use node:test and node:assert/strict.

Documentation decisions
- Define module boundaries: science modules never import render modules; render modules may consume science results.
- Define lifecycle order: initialize, resize, update, render, suspend, resume, dispose.
- Define error behavior and the static fallback contract.
- Explain why dynamic social OG metadata cannot be reliably generated for arbitrary URL state on static GitHub Pages; later work may create downloadable share cards but must not claim crawler-visible dynamic OG images.

Acceptance
- npm test
- npm run validate
- Confirm git diff contains no visual/CSS/shader changes.

Commit
git commit -m "docs: define renderer and science contracts"
Include the required co-author trailer.
```

## Prompt 01 — Migrate Three.js r147 Globals to Current Stable ESM

```text
You are implementing Prompt 01. Prompt 00 is complete and committed.

Objective
Replace the legacy Three.js r147 global/UMD runtime and removed examples/js API with the latest stable, exactly pinned, self-hosted Three.js ESM distribution. Preserve current visuals and behavior; this prompt is migration-only.

Version and supply-chain procedure
- Query https://registry.npmjs.org/three/latest and verify the same version on the official three npm package.
- Pin the exact version, never "latest", caret, tilde, or floating URL.
- Use npm pack three@<exact-version> in a temporary directory, verify package name/version, then copy only the required build and examples/jsm files into vendor/three.
- Write the version, package tarball SHA-512 integrity, retrieval date, and upstream URL to vendor/three/VERSION.
- Keep licenses in vendor/three/LICENSE.
- Do not reference unpkg, jsDelivr, esm.sh, or another CDN at runtime.

Architecture
- Add an import map in index.html mapping three, three/webgpu, three/tsl, and three/addons/ to self-hosted paths.
- Create js/render/three-runtime.mjs. It imports the classic ESM renderer path needed to preserve existing GLSL ShaderMaterial behavior, imports required ESM post-processing classes, and exposes a deliberately small compatibility object.
- Create js/bootstrap.mjs as the module entry point. It installs only the explicitly documented compatibility globals required by the existing Babel JSX scripts, then starts the existing app after the runtime is ready.
- Do not mechanically expose all Three.js exports on window. Compatibility globals must be listed in docs/render-architecture.md and removed by later prompts when practical.
- Convert the old global examples/js EffectComposer imports to examples/jsm ESM imports.
- Remove vendor/three/three.min.js and vendor/three/examples/js only after all references and validation rules are updated.

Required files
- Modify index.html, scripts/validate-repo.mjs, package.json, package-lock.json, README.md, and docs/render-architecture.md.
- Create js/bootstrap.mjs, js/render/three-runtime.mjs, vendor/three/VERSION.
- Replace vendor/three contents with the pinned ESM subset and license.
- Create test/three-vendor.test.mjs.
- Create qa/specs/esm-runtime.spec.mjs.

Tests
- three-vendor.test.mjs parses vendor/three/VERSION, package.json, import-map paths, and local files; it fails if the versions differ, an imported asset is missing, a runtime CDN appears, or legacy examples/js paths remain.
- esm-runtime.spec.mjs loads overview, GR, and black-hole views; asserts one application root, no pageerror, no failed local module requests, and a working renderer or explicit static fallback.
- Validate direct deep links and browser back/forward state.

Acceptance
- npm test
- npm run validate
- npm run qa:test -- qa/specs/esm-runtime.spec.mjs
- Search the repository and confirm no runtime reference remains to vendor/three/three.min.js or vendor/three/examples/js/.
- Compare overview, GR, and black-hole screenshots to the pre-migration baseline; there must be no intentional visual redesign.

Commit
git commit -m "refactor: migrate Three.js runtime to ESM"
Include the required co-author trailer.
```

## Prompt 02 — Add WebGPU/WebGL2 Backend Selection and the Cinematic Render Pipeline

```text
You are implementing Prompt 02. The exact Three.js API must be verified against the version pinned by Prompt 01.

Objective
Introduce a shared asynchronous renderer factory and a composable cinematic post-processing pipeline. Prefer WebGPU when supported, fall back to WebGL2, and retain an explicit static visual if neither initializes.

Files
- Create js/render/create-renderer.mjs.
- Create js/render/render-pipeline.mjs.
- Create js/render/quality-governor.mjs.
- Create js/render/shader-prewarm.mjs.
- Create js/render/error-overlay.mjs.
- Create test/quality-governor.test.mjs.
- Create qa/specs/render-backends.spec.mjs and qa/specs/reduced-motion.spec.mjs.
- Modify js/render/three-runtime.mjs, js/scene3d.jsx, js/atlas-stage.jsx, js/app.jsx, index.html, and directly related CSS.

Renderer requirements
- createRenderer({ canvas, quality, alpha, antialias, powerPreference, forceBackend }) returns a Promise of { renderer, backend, capabilities, dispose }.
- Try WebGPU first only when navigator.gpu exists and the pinned API supports the required scene/material path.
- If WebGPU initialization or required shader compatibility fails, present the failure in development diagnostics and retry WebGL2 once. Do not retry indefinitely.
- Apply output color space, physically correct lighting where supported, shadow policy, and AgX tone mapping with a documented Neutral tone-mapping comparison option.
- Await async renderer initialization before the first frame.

Pipeline requirements
- render-pipeline.mjs builds an ordered graph for: base render, GTAO/SSAO, optional SSGI, bloom, god rays when a source is supplied, depth of field, temporal AA/temporal reprojection when supported, motion blur only in full-motion mode, subtle chromatic aberration, lens dirt/flare, film grain, vignette, and final tone mapping.
- Use current TSL RenderPipeline nodes for WebGPU where available. Provide capability-gated WebGL2 equivalents without pretending unsupported effects are active.
- Effects must be conservative, physically legible, and toggled through named presets: scientific, cinematic, minimal, and capture.
- reduced-motion disables temporal camera-driven effects, motion blur, animated grain, and automatic focal changes.

Quality governor
- Use a rolling frame-time window, hysteresis, and a minimum 3-second cooldown.
- Downgrade/upscale in this order: DPR, temporal samples, SSGI, volumetric steps, particle budget.
- Never alter equations, seed, state values, labels, or exported numerical results.
- Expose backend, FPS, DPR, and active effects in a developer diagnostics drawer, not the default user UI.

Shader prewarming
- Precompile all shader variants needed by the current view before revealing a transition.
- Cache prewarm completion by backend, view, and quality preset.
- Display a real initialization state rather than a frozen first frame.

Acceptance
- npm test
- npm run validate
- npm run qa:test -- qa/specs/render-backends.spec.mjs qa/specs/reduced-motion.spec.mjs
- Test forced WebGL2 and static fallback using browser init scripts.
- No unhandled promise rejection, shader compile error, infinite renderer retry, or duplicate animation loop.

Commit
git commit -m "feat: add adaptive cinematic render pipeline"
Include the required co-author trailer.
```

## Prompt 03 — Build a Tested Kerr Null-Geodesic and Accretion-Disk Science Core

```text
You are implementing Prompt 03. Do not edit rendering code except to expose existing parameter conventions.

Objective
Create a pure, deterministic, unit-tested scientific core for Kerr null geodesics, spin-dependent characteristic radii, thin-disk thermodynamics, relativistic frequency shifts, and spectral color conversion.

Files
- Create js/science/kerr.mjs.
- Create js/science/integrators.mjs.
- Create js/science/accretion-disk.mjs.
- Create js/science/spectrum.mjs.
- Create js/science/constants.mjs.
- Create test/kerr.test.mjs, test/integrators.test.mjs, test/accretion-disk.test.mjs, and test/spectrum.test.mjs.
- Create docs/science/kerr-rendering.md.
- Modify js/physics.mjs and js/physics.jsx only to re-export or mirror stable public functions required by the existing no-build runtime; avoid duplicated formulas where ESM import is available.

Physics requirements
- Use geometric units internally with explicit SI conversion functions.
- Implement Kerr event horizon radii r± and prograde/retrograde ISCO with validated domains |a*| <= 1.
- Represent conserved ray quantities E, Lz, and Carter Q explicitly.
- Implement separated radial and polar Kerr potentials in Boyer-Lindquist coordinates.
- Implement fixed-step RK4 and adaptive RK45 with absolute/relative tolerances, maximum-step guard, horizon termination, escape termination, disk-plane intersection, and non-finite-state rejection.
- Document the coordinate singularity and the exact scope of any Kerr-Schild conversion. Do not claim horizon crossing if the implementation terminates outside r+.
- Implement Novikov-Thorne/Page-Thorne-inspired thin-disk flux as a clearly labeled model; if using an approximation rather than the full relativistic flux integral, name it and test its limits.
- Implement gravitational plus orbital Doppler g-factor interfaces without double-counting.
- Implement Planck spectral radiance and a deterministic CIE 1931 XYZ to linear-sRGB integration using committed color-matching data with its source/license.
- Provide a separately named fast fitted blackbody-to-sRGB approximation and quantify its maximum color error over the supported temperature range.

Numerical tests
- Schwarzschild limit at a*=0.
- Extremal boundary handling without NaN.
- Known ISCO values for a*=0, +1 limit, and -1 limit within documented tolerances.
- Conserved-quantity drift bounds for representative escaped and captured rays.
- RK45 convergence against a smaller-tolerance reference.
- Disk flux is zero inside ISCO and finite outside.
- Wien displacement trend and monotonic radiance checks.
- XYZ/sRGB reference colors at selected temperatures.
- Invalid mass, spin, wavelength, tolerance, and step inputs throw descriptive RangeError or TypeError.

Documentation
- Cite Carter, Bardeen/Press/Teukolsky, Page & Thorne, Luminet 1979, James et al. DNGR 2015, and Bruneton 2020 with DOI/arXiv/ADS links where available.
- Separate exact equations, numerical approximation, display approximation, and conjectural interpretation.

Acceptance
- npm test
- npm run validate
- A deterministic benchmark script in scripts/benchmark-kerr.mjs reports ray count, median integration time, convergence error, and conserved-quantity drift without enforcing machine-specific timing thresholds.

Commit
git commit -m "feat: add validated Kerr ray-tracing physics"
Include the required co-author trailer.
```

## Prompt 04 — Render the Scientifically Grounded Kerr Observatory

```text
You are implementing Prompt 04 using the science APIs from Prompt 03 and renderer APIs from Prompt 02.

Objective
Replace the flagship black-hole visual with a capability-scaled Kerr observatory: spin-dependent shadow, lensed thin disk, Doppler beaming, gravitational redshift, higher-order images, and anti-aliased lensed background stars.

Files
- Create js/visualizations/kerr/kerr-observatory.mjs.
- Create js/visualizations/kerr/kerr-material.mjs or kerr-material.tsl.js according to the pinned Three.js API.
- Create js/visualizations/kerr/starfield-sampler.mjs.
- Create js/visualizations/kerr/kerr-controls.jsx.
- Create test/kerr-render-state.test.mjs.
- Create qa/specs/kerr-observatory.spec.mjs.
- Modify js/mod-blackholes.jsx, js/scene3d.jsx, js/state.jsx, js/state-runtime.jsx, js/data.jsx, and relevant CSS.

Rendering requirements
- The renderer consumes the Prompt 03 science interfaces; it must not reimplement ISCO, horizon, spectral, or g-factor formulas in UI code.
- WebGPU path: use compute/storage buffers or the pinned equivalent to evaluate ray samples and accumulate temporally.
- WebGL2 path: use a fragment-shader ray integrator or a precomputed deterministic geodesic lookup texture generated from the same science model.
- Provide quality-specific, documented ray-step and temporal-sample budgets.
- Render direct disk image plus distinguishable higher-order image contributions. Labels may expose image order; the visual must not exaggerate an unresolved ring without a schematic label.
- Apply blackbody color, combined redshift/Doppler factor, intensity beaming, and tone mapping in a documented order.
- Use distortion-aware starfield filtering to prevent severe streaking and single-pixel flicker around the critical curve.
- Reset temporal accumulation on camera, spin, mass, inclination, resolution, backend, or quality changes.
- Add focus picking: clicking horizon, photon region, direct disk, or higher-order image focuses the camera/DOF and opens the exact scientific explanation. Reduced-motion changes focus without animated travel.

State and provenance
- Add versioned URL state for spin, inclination, observer distance, disk model, quality, exposure, and annotation visibility.
- Preserve old links by applying defaults.
- Export exact numerical state and provenance through QGA_EXPORT_JSON.
- Register the view in the shared provenance registry.

Visual acceptance
- Playwright captures deterministic reference images at a*=0, a*=0.9 prograde, and a*=-0.9 retrograde with a fixed seed and viewport.
- Assert event-horizon/ISCO readouts against Prompt 03 APIs.
- Assert no NaN/Infinity appears in UI or exported state.
- Assert a visible approaching/receding brightness asymmetry when inclination and spin produce it.
- Test WebGPU when available, forced WebGL2, reduced-motion, and static fallback.

Acceptance
- npm test
- npm run validate
- npm run qa:test -- qa/specs/kerr-observatory.spec.mjs
- Run scripts/benchmark-kerr.mjs and record results in the commit message body.

Commit
git commit -m "feat: add relativistic Kerr observatory"
Include the required co-author trailer.
```

## Prompt 05 — Add Relativistic Jets, Volumetric Plasma, and Ultra-Quality Capture

```text
You are implementing Prompt 05. Preserve Prompt 04’s scientific image as the base; this prompt adds capability-gated plasma and capture enhancements.

Objective
Add physically motivated volumetric accretion plasma and bipolar jets, plus a progressive ultra-quality still renderer. Clearly separate established equations, phenomenological plasma models, and artistic enhancement.

Files
- Create js/visualizations/kerr/plasma-volume.mjs.
- Create js/visualizations/kerr/jet-field.mjs.
- Create js/render/progressive-capture.mjs.
- Create js/render/hdr-environment.mjs.
- Create test/jet-field.test.mjs and test/progressive-capture.test.mjs.
- Create qa/specs/kerr-ultra-capture.spec.mjs.
- Modify the Kerr observatory, render pipeline, provenance, settings panel, and black-hole documentation.

Requirements
- Generate seeded density/temperature fields with bounded noise; the same seed and parameters must reproduce the same field.
- Anchor jets to the spin axis and label the Blandford-Znajek relationship as a model, not a direct simulation of GRMHD.
- Use raymarched emission/absorption for plasma, physically ordered compositing, depth-aware intersection with the existing disk, and capability-gated god rays/lens flare.
- Do not render visible sound-in-vacuum shockwaves or arbitrary fire textures.
- Add HDR environment/importance sampling only where it affects material lighting; do not apply environment reflection to the event horizon.
- Progressive capture must render to an offscreen high-resolution target, accumulate samples, denoise, upscale if selected, and expose progress/cancel/error states.
- If the pinned three-gpu-pathtracer is adopted, pin and self-host it with license/integrity metadata. Use it only where its material model is scientifically meaningful; do not claim it traces Kerr geodesics unless it actually uses the Prompt 03 geodesic model.
- Support 2K, 4K, and 8K stills subject to a measured GPU-memory guard. Reject unsafe dimensions before allocation with an actionable message.
- Embed a metadata sidecar containing state, provenance, version, backend, sample count, and commit hash.

Acceptance
- npm test
- npm run validate
- npm run qa:test -- qa/specs/kerr-ultra-capture.spec.mjs
- Capture 2K on WebGL2 and the highest supported WebGPU mode without browser crash or leaked render targets.
- Repeated captures with the same seed and fixed backend/settings must be pixel-stable within the documented tolerance.

Commit
git commit -m "feat: add volumetric Kerr plasma and ultra capture"
Include the required co-author trailer.
```

## Prompt 06 — Turn Gravitational-Wave Data into a Visual and Audible Spacetime Instrument

```text
You are implementing Prompt 06. Reuse the existing bounded GWOSC fetch path; do not create a backend.

Objective
Build a synchronized gravitational-wave observatory that visualizes detector strain and a pedagogical spacetime response while safely sonifying real or generated signals.

Files
- Create js/science/gravitational-waves.mjs.
- Create js/audio/gw-sonification.mjs.
- Create js/visualizations/gw/spacetime-instrument.mjs.
- Create test/gravitational-waves.test.mjs and test/gw-sonification.test.mjs.
- Create qa/specs/gw-instrument.spec.mjs.
- Modify js/mod-experiments.jsx, js/state-runtime.jsx, js/state.jsx, provenance, settings, and CSS.

Scientific requirements
- Preserve raw strain values and provenance separately from display-normalized samples.
- Implement windowing, detrending, bandpass policy, whitening policy, resampling, and optional frequency translation as named pure functions.
- Document that the animated spatial deformation is a pedagogical mapping with amplified displacement, not literal detector-arm motion at display scale.
- Generated fallback waveforms must be labeled synthetic and must never reuse real-data provenance.
- Show plus/cross polarization basis and detector response assumptions.

Audio requirements
- Audio is off by default and starts only after explicit user interaction.
- Use AudioContext/AudioWorklet or a tested Web Audio graph; never autoplay.
- Expose volume, original/pitch-shifted mode, play/pause, loop, and a visible time cursor.
- Clamp gain and prevent clipping. Disconnect and close nodes on view disposal.
- reduced-motion does not disable user-requested audio but removes automatic visual camera motion and flashing transients.

Visual requirements
- Use compute particles where supported for a synchronized propagation field; use bounded instancing on WebGL2.
- Drive the visual from the processed timeline, not an independent animation clock.
- Add a split detector comparison for H1/L1 when both are available.
- Display fetch, decompression, processing, CORS, timeout, and audio-init errors explicitly.

Acceptance
- npm test
- npm run validate
- npm run qa:test -- qa/specs/gw-instrument.spec.mjs
- Playwright verifies no AudioContext starts before interaction, timeline synchronization remains within 50 ms over a 10-second deterministic fixture, generated fallback is labeled, and all audio nodes are disposed on navigation.

Commit
git commit -m "feat: add gravitational-wave spacetime instrument"
Include the required co-author trailer.
```

## Prompt 07 — Add Quantum-Field, Hawking, and Renormalization Compute Visualizations

```text
You are implementing Prompt 07.

Objective
Add three visually exceptional but explicitly bounded physics laboratories: a QFT field/flux-tube lab, a Hawking-radiation horizon lab, and a 3D renormalization-group flow field.

Files
- Create js/science/qft-fields.mjs, js/science/hawking.mjs, and js/science/rg-flow-3d.mjs.
- Create js/visualizations/qft/field-lab.mjs, js/visualizations/blackhole/hawking-lab.mjs, and js/visualizations/rg/flow-field.mjs.
- Create one focused Node test file per science module and one Playwright spec covering all three labs.
- Modify js/mod-qft.jsx, js/mod-blackholes.jsx, js/mod-gauge-rg.jsx, state/provenance, and CSS.

QFT field lab
- Use seeded Fourier modes or lattice samples with a documented cutoff and boundary condition.
- Render correlation structure and optional particle interpretation separately; do not depict virtual particles as directly observed objects.
- Flux tubes must be identified as a model/analogy unless computed from actual gauge-field data.
- WebGPU may run compute updates; WebGL2 uses ping-pong textures or reduced CPU-precomputed samples.

Hawking lab
- Compute Schwarzschild/Kerr temperature through the shared black-hole science APIs.
- Visual pair production is schematic. Put that status in the canvas annotation, legend, export, and accessibility description.
- Emission rate/color scales with the selected model and mass while remaining visible through a separately disclosed display amplification.
- Show extremal-limit behavior without division-by-zero or false finite emission.

RG flow field
- Reuse existing beta functions and numerical integrators from physics.mjs; do not duplicate them in shaders.
- Render fixed points, separatrices, UV/IR direction, perturbative-validity boundary, and uncertainty/status annotations.
- Streamlines must be seeded deterministically and integrate in the same logarithmic scale as exported numerics.

Acceptance
- npm test
- npm run validate
- Run the new Playwright spec.
- Verify deterministic fixed-seed screenshots, WebGL2 fallback, reduced-motion, and provenance export.
- Confirm every schematic visual has an in-canvas status label, not only explanatory prose below it.

Commit
git commit -m "feat: add quantum field and RG compute labs"
Include the required co-author trailer.
```

## Prompt 08 — Add Holography, Collider Events, and Spin-Foam Geometry

```text
You are implementing Prompt 08.

Objective
Upgrade the approaches, Standard Model/experiment, and Planck modules with three high-impact scientific scenes: AdS bulk-boundary geometry with minimal surfaces, collider event display, and spin-network/spin-foam geometry.

Files
- Create js/science/ads-geometry.mjs, js/science/collider-kinematics.mjs, and js/science/spin-networks.mjs.
- Create js/visualizations/holography/ads-lab.mjs, js/visualizations/collider/event-display.mjs, and js/visualizations/planck/spin-foam.mjs.
- Add Node tests for all pure geometry/kinematics functions and a Playwright integration spec.
- Modify js/mod-approaches.jsx, js/mod-standard-model.jsx, js/mod-experiments.jsx, js/mod-planck.jsx, state, provenance, and CSS.

Holography requirements
- Render a mathematically defined Poincare disk/half-space or AdS3 slice with a named coordinate convention.
- Compute geodesics/minimal curves used by the Ryu-Takayanagi illustration from tested functions.
- Distinguish proven geometric calculation in the selected toy spacetime from conjectural AdS/CFT interpretation.
- Animate boundary-region changes into bulk minimal-surface changes; reduced-motion snaps between states.

Collider requirements
- Use four-vectors and invariant-mass calculations from pure tested code.
- Render tracks, calorimeter towers, missing transverse momentum, and jet cones with detector-coordinate labels.
- Ship deterministic synthetic fixtures; if external event data is later used, preserve source/event provenance.
- Never label generated events as CERN observations.

Spin-network requirements
- Generate valid labeled graphs and 4-simplex-derived cells with deterministic seeds.
- Validate triangle/intertwiner constraints implemented by the chosen pedagogical model.
- Label spin foam and discrete geometry claims according to their theory status.
- Use instancing/compute for scale, with a bounded WebGL2 graph.

Acceptance
- npm test
- npm run validate
- Run the new Playwright integration spec.
- Keyboard controls, status labels, export state, reduced-motion, and forced WebGL2 must pass for all three scenes.

Commit
git commit -m "feat: add holography collider and spin-foam scenes"
Include the required co-author trailer.
```

## Prompt 09 — Build the Cinematic Camera Director, Scroll Narrative, and Scene Transitions

```text
You are implementing Prompt 09 after all flagship visualizations are stable.

Objective
Create a reusable cinematic direction system that turns the atlas into a coherent visual journey without stealing control or compromising reduced-motion/accessibility.

Files
- Create js/cinematic/camera-director.mjs.
- Create js/cinematic/timeline.mjs.
- Create js/cinematic/scroll-driver.mjs.
- Create js/cinematic/scene-transition.mjs.
- Create js/cinematic/shot-manifests.mjs.
- Create test/timeline.test.mjs and test/camera-director.test.mjs.
- Create qa/specs/cinematic-navigation.spec.mjs.
- Modify app shell, AtlasStage, Scene3D, modules with flagship shots, settings, and CSS.

Requirements
- Define declarative shot manifests with id, duration, camera pose, target, focal distance, exposure, active annotations, and easing.
- CameraDirector methods: loadManifest(), play(), pause(), seek(), next(), previous(), takeControl(), releaseControl(), dispose().
- User orbit/pan/zoom immediately pauses automated direction and never fights input.
- Scroll-driven sections map normalized intersection progress to a timeline. Do not attach unthrottled window scroll handlers.
- Scene transitions use a capability-gated gravitational-lens/metric-distortion effect. Minimal/reduced mode uses a short crossfade with no spatial distortion.
- Prewarm destination shaders before transition; timeout reveals a clear initialization error instead of trapping the app.
- Add visible Play/Pause, shot progress, chapter title, and “Take control” UI.
- Deep links may target a shot id without autoplaying audio.
- No camera path may cross invalid geometry, enter a singularity, or expose unloaded assets.

Tests
- Timeline boundary, seek, pause/resume, disposal, and deterministic easing tests.
- Playwright verifies user input cancels autoplay, back navigation restores the correct view/shot, focus is retained, reduced-motion has no camera interpolation, and rapid navigation creates only one transition/animation loop.

Acceptance
- npm test
- npm run validate
- npm run qa:test -- qa/specs/cinematic-navigation.spec.mjs

Commit
git commit -m "feat: add cinematic atlas direction system"
Include the required co-author trailer.
```

## Prompt 10 — Add Command Palette, Search, Comparison, Snapshots, Formula Linking, and Annotations

```text
You are implementing Prompt 10.

Objective
Build the premium interaction layer: global command/search, A/B scientific comparison, parameter snapshots, formula-to-scene highlighting, and shareable annotation pins.

Files
- Create js/search/search-index.mjs and js/search/command-palette.jsx.
- Create js/compare/compare-state.mjs and js/compare/compare-view.jsx.
- Create js/snapshots/snapshot-store.mjs and js/snapshots/snapshot-panel.jsx.
- Create js/linking/concept-bus.mjs.
- Create js/annotations/annotation-store.mjs and js/annotations/annotation-layer.jsx.
- Add focused Node tests and qa/specs/premium-interactions.spec.mjs.
- Modify app shell, FormulaCard, Scene3D, state serialization, modules, and CSS.

Command/search
- Open with Cmd/Ctrl+K and a visible mobile button.
- Index modules, glossary terms, symbols, formula titles, references, open problems, camera shots, and available actions.
- Use deterministic local ranking: exact prefix, token prefix, substring, then metadata keywords.
- Provide keyboard navigation, result counts, empty state, escaped highlighting, and focus restoration.

Comparison/snapshots
- Support synchronized side-by-side or swipe comparison using two validated state snapshots.
- Provide initial presets including Schwarzschild vs Kerr a*=0.9 and scientific vs cinematic render modes.
- Synchronize camera only when both scenes declare compatible camera spaces.
- Store named snapshots locally with schema version, timestamp, state, provenance id, and optional thumbnail.
- Add import/export with schema validation and explicit conflict behavior.

Formula linking
- ConceptBus publish/subscribe events must use typed runtime-validated payloads.
- Hover/focus/click on a formula symbol highlights the corresponding scene object/readout and exposes its current numerical value and units.
- Keyboard focus must provide the same behavior as hover.
- Unknown mappings do nothing visible and produce a development diagnostic rather than an exception.

Annotations
- Pins attach to stable semantic anchors or normalized screen/world coordinates with explicit anchor type.
- Serialize annotations into share state only after size limits, text limits, and schema validation.
- Sanitize all text by rendering as text, never innerHTML.
- Provide add/edit/remove controls; removal requires only the normal in-app confirmation pattern.
- Annotation state must not alter scientific simulation results.

Acceptance
- npm test
- npm run validate
- npm run qa:test -- qa/specs/premium-interactions.spec.mjs
- Complete keyboard-only flows for palette, comparison, snapshots, formula linking, and annotation editing.
- Confirm old URLs still load and oversized/invalid annotation state is rejected visibly.

Commit
git commit -m "feat: add premium atlas interaction tools"
Include the required co-author trailer.
```

## Prompt 11 — Add Publication-Grade PNG, WebM, Figure, Share-Card, and Lab-Report Export

```text
You are implementing Prompt 11.

Objective
Create a unified, capability-aware publishing studio for high-resolution images, short WebM recordings, print figures, deterministic share cards, and PDF lab reports.

Files
- Create js/export/export-service.mjs.
- Create js/export/image-export.mjs.
- Create js/export/video-export.mjs.
- Create js/export/figure-export.mjs.
- Create js/export/share-card.mjs.
- Create js/export/lab-report.mjs.
- Create js/export/export-studio.jsx.
- Create test/export-metadata.test.mjs and qa/specs/export-studio.spec.mjs.
- Modify app shell, state runtime, print CSS, README, and provenance docs.

Shared export contract
- Every export includes application version, commit hash, UTC timestamp, state schema, view parameters, backend, quality, scientific provenance id/status, references, seed, and display-amplification disclosures.
- File names are deterministic, portable, and include view plus timestamp.
- Surface unsupported MIME types, codec failure, memory guard, canvas taint, and user cancellation.

PNG
- Support viewport, 2K, 4K, and guarded 8K render targets.
- Composite WebGL/WebGPU canvas, HTML labels, title, legend, scale/units, and provenance footer without screenshotting unrelated browser chrome.
- Use capture preset, then restore the exact previous renderer settings in finally.

WebM
- Use canvas.captureStream and MediaRecorder where supported.
- Provide 6s and 12s presets, fixed FPS, loopable camera shot, live progress, cancel, and cleanup.
- Choose supported codecs via MediaRecorder.isTypeSupported; do not promise MP4.
- Recording starts only on explicit user action and excludes audio unless the user explicitly enables an available synchronized track.

Figure mode
- Produce light and dark publication styles, high-contrast axes, selectable annotation density, figure number, caption, and references.
- Use SVG for diagrams that are genuinely vector; embed raster scientific canvases at target resolution rather than tracing them falsely.

Share card
- Generate a downloadable 1200x630 deterministic card for the current state.
- State plainly in docs that static GitHub Pages cannot provide arbitrary crawler-visible dynamic OG metadata without prebuilt routes or a server/edge function.
- Keep the existing static OG image valid.

Lab report
- Generate a print/PDF-ready document containing state, selected screenshots, formulas, numerical results, assumptions, validity, references, and provenance.
- Prefer browser print with dedicated CSS and a print preview route; do not add a large PDF dependency unless demonstrably required.

Acceptance
- npm test
- npm run validate
- npm run qa:test -- qa/specs/export-studio.spec.mjs
- Verify PNG dimensions/metadata, WebM decodability and duration tolerance, print layout, state restoration after capture, and URL revocation/no retained recorder tracks.

Commit
git commit -m "feat: add publication export studio"
Include the required co-author trailer.
```

## Prompt 12 — Add Adaptive Performance, Worker Offloading, Offline PWA, and Complete Themes

```text
You are implementing Prompt 12.

Objective
Make the enhanced atlas fast, resilient, offline-capable, and visually coherent across observatory, blueprint, and print themes.

Files
- Create js/render/frame-budget.mjs and js/render/worker-bridge.mjs.
- Create js/workers/simulation-worker.mjs.
- Create service-worker.js and js/pwa/register-service-worker.mjs.
- Create styles/themes.css.
- Create test/frame-budget.test.mjs, test/service-worker-manifest.test.mjs, and qa/specs/performance-pwa-themes.spec.mjs.
- Modify manifest.webmanifest, app/settings, render quality governor, science tasks suitable for workers, index.html, validation script, and CSS.

Performance
- Measure CPU frame time, GPU time only when a supported non-blocking API exists, long tasks, memory hints, and dropped frames.
- Define documented budgets for desktop, integrated GPU, and mobile profiles.
- Move expensive pure computation to a module worker using transferable buffers.
- Use OffscreenCanvas only when supported and only where lifecycle/input integration remains correct; otherwise offload computation but retain main-thread rendering.
- Apply backpressure: at most one pending frame/result per simulation channel.
- Pause rendering and audio when the document is hidden; resume without time jumps or duplicate loops.
- Dispose workers, buffers, render targets, observers, and listeners.

PWA
- Precache the versioned application shell and self-hosted vendor assets.
- Use cache-first for immutable versioned assets, stale-while-revalidate for local docs/images, and network-first with timeout for navigations.
- Never cache arbitrary GWOSC responses indefinitely. Use explicit bounded runtime caching or no cache, preserving provenance.
- Show update-available and offline states. Never force reload while the user has unsaved annotations/snapshots.
- Scope the service worker correctly for GitHub Pages project paths.
- Increment cache names from an application build/version constant and delete only older HORIZON caches.

Themes
- Implement Observatory, Blueprint, and Print as full semantic token themes, not accent swaps.
- Theme all panels, labels, plots, focus states, canvas overlays, formulas, exports, and browser theme-color.
- Blueprint favors measured grid/technical drawing presentation; Print is high-contrast and disables decorative effects; Observatory retains cinematic rendering.
- Ensure status colors retain meaning and pass contrast checks in every theme.

Acceptance
- npm test
- npm run validate
- npm run qa:test -- qa/specs/performance-pwa-themes.spec.mjs
- Run Lighthouse or equivalent local audits for performance, accessibility, best practices, and PWA; record scores and environment in docs/performance.md without inventing universal guarantees.
- Verify cold offline reload after one successful online visit and service-worker update behavior under the GitHub Pages subpath.

Commit
git commit -m "feat: add adaptive offline themed runtime"
Include the required co-author trailer.
```

## Prompt 13 — Final Scientific, Visual, Accessibility, and Release Gate

```text
You are implementing the final integration prompt. Do not add a new flagship feature. Close defects discovered by comprehensive verification, update evidence, and prepare a release-quality edition.

Objective
Prove that the complete atlas is scientifically labeled, visually stable, performant across capability tiers, accessible, reproducible, and deployable as a static GitHub Pages site.

Files
- Create qa/specs/release-gate.spec.mjs.
- Create scripts/audit-provenance.mjs.
- Create scripts/audit-render-lifecycle.mjs.
- Create docs/release-verification.md.
- Update qa manifest/baselines, README.md, docs/whitepaper.md, CITATION.cff, package version, screenshots, social image if the hero visual changed, and all directly affected architecture/science docs.
- Modify implementation files only for defects demonstrated by the gate.

Scientific gate
- Every interactive visualization is registered in the provenance registry.
- Every registry entry has model, status, assumptions, validity, numerical method, and references.
- Every schematic/display amplification is visible in-canvas and in export metadata.
- Numerically compare public UI readouts with pure science APIs over deterministic parameter grids.
- Run conserved-quantity, convergence, limiting-case, dimensional, and invalid-input tests.
- Verify citations exist and support the stated algorithm/model; do not cite a source merely because it discusses the same topic.

Visual gate
- Capture deterministic desktop/mobile baselines for every module in scientific and cinematic mode.
- Capture WebGPU where CI/runtime supports it and always capture forced WebGL2.
- Check for NaN pixels where readable, blank canvases, shader errors, clipping, label overlap, missing glyphs, extreme bloom, banding, temporal ghost trails, and transition flashes.
- Verify no first-use shader compilation hitch exceeds the documented target on the reference test machine; report measurements rather than universal claims.

Lifecycle/performance gate
- Navigate through every module repeatedly and assert one active renderer loop per visible scene.
- Assert disposal of render targets, workers, audio nodes, observers, media tracks, and event listeners.
- Exercise quality governor upgrades/downgrades, hidden-tab pause, resize, DPR change, context loss/restoration, offline reload, and service-worker update.
- Record reproducible benchmark environment and percentile frame times for representative desktop and mobile emulation profiles.

Accessibility gate
- Keyboard-only navigation reaches every control and never traps focus.
- Dialogs/palettes restore focus.
- Reduced-motion removes all nonessential automatic motion and flashes.
- Canvas scenes have concise text alternatives that describe the scientific content/status, not decorative appearance only.
- Color is never the only carrier of status or direction.
- Run automated accessibility checks and perform documented manual checks.

Compatibility gate
- Current stable Chrome/Edge, Firefox, and Safari where available.
- WebGPU preferred path, forced WebGL2 path, and static fallback.
- Old shared URLs, new versioned state, JSON exports, snapshot imports, and offline routes.
- No third-party runtime asset request except explicit user-requested scientific data such as GWOSC.

Commands
- npm test
- npm run validate
- npm run qa:verify
- npm run qa:test
- Run scripts/audit-provenance.mjs and scripts/audit-render-lifecycle.mjs.
- Run the documented benchmark and accessibility commands.

Completion standard
- Fix every blocker/high-severity gate failure.
- For a lower-severity limitation that cannot be fixed safely, document exact reproduction, affected capability tier, user-visible behavior, and mitigation in docs/release-verification.md.
- Do not update visual baselines merely to make failing tests green; inspect each diff and explain accepted changes in the verification document.
- The final report must list exact versions, commit hash, test counts, browsers/backends tested, measured performance, known limits, and evidence file paths.

Commit
git commit -m "release: verify ultra-realistic atlas edition"
Include the required co-author trailer.
```

---

## Prompt-to-Feature Coverage Matrix

| Capability | Implemented by |
|---|---|
| Current stable Three.js, ESM, import map, zero bundler | 01 |
| WebGPU with WebGL2/static fallback | 02 |
| AgX/Neutral tone mapping, bloom, GTAO, SSGI, DOF, TAA, grain, aberration, flare, god rays | 02 |
| Adaptive quality and shader prewarming | 02, 12 |
| Kerr RK4/RK45 geodesics, Carter constants, ISCO | 03 |
| Novikov-Thorne/Page-Thorne disk and blackbody spectrum | 03 |
| Doppler beaming, redshift, photon/higher-order images, lensed starfield | 04 |
| Volumetric plasma, relativistic jets, HDR/IBL | 05 |
| Progressive/path-traced ultra-quality still capture | 05 |
| Real GW strain visualization and sonification | 06 |
| QFT fields, Hawking lab, 3D RG flow | 07 |
| AdS/CFT geometry, collider event display, spin foam | 08 |
| Camera shots, scrollytelling, lens transitions | 09 |
| Command palette and global search | 10 |
| Split comparison and A/B snapshots | 10 |
| Formula-to-scene linking and annotation pins | 10 |
| PNG/WebM, figure, share card, PDF-ready lab report | 11 |
| Worker/OffscreenCanvas strategy and frame budgets | 12 |
| Offline PWA and complete themes | 12 |
| Scientific, visual, lifecycle, accessibility release audit | 13 |

## Required Execution Order

```text
00 Contracts
  → 01 ESM migration
  → 02 renderer/pipeline
  → 03 Kerr science
  → 04 Kerr observatory
  → 05 plasma/capture
  → 06 gravitational waves
  → 07 quantum fields/Hawking/RG
  → 08 holography/collider/spin foam
  → 09 cinematic direction
  → 10 premium interactions
  → 11 publishing studio
  → 12 performance/PWA/themes
  → 13 release gate
```

Do not skip Prompt 00, 01, 02, or 03. Prompts 06, 07, and 08 affect separate scientific modules but still run sequentially because they share renderer budgets, state schema, provenance, and QA infrastructure.
