# Engraved lines (S06)

Geometry is engraved: mathematical curves are crisp, constant-pixel-width, anti-aliased lines (`docs/design/art-direction.md`, rule 2). This replaces every 1 px `THREE.Line` hairline. Closes F-24.

## API

`js/visualizations/common/engraved-lines.mjs` (pure ES module, imports in Node, covered by `test/engraved-lines.test.mjs`):

| Function | Purpose |
|---|---|
| `engravedLine(points, opts)` | polyline through `points` (Vector3-likes or a flat xyz array) |
| `engravedSegments(pairs, opts)` | independent segments, consecutive point pairs |
| `engravedStream(capacity, opts)` + `setEngravedPoints(line, flat, count, colors?)` | fixed-capacity polyline whose visible length changes every frame (trails) |
| `updateEngravedLine(line, points, colors?)` | rewrite points and colours in place; no allocation when the count is unchanged |
| `setEngravedCount(line, n)` | the instanced `setDrawRange(0, n)` |
| `engravedGrid(size, divisions, opts)` | replaces `THREE.GridHelper` |
| `setEngravedOpacity / setEngravedColor / setEngravedWidth` | run-time changes |
| `expandIndexedSegments(positions, indices, into?)` | indexed line list to consecutive pairs (animated grids) |

Options: `widthPx` (CSS px, default 1.25, at most 16), `color` (a **token name**, or an already resolved `THREE.Color` / `0xRRGGBB` from a palette function), `colors` (per-vertex rgb), `opacity`, `additive`, `dash: { size, gap }` (scene units), `halo` (at most 0.12: a second line at 3x the width and that opacity, drawn first), `depthFade: [near, far]` (view depth), `layer` (`data | model | decoration`, kept in `userData.engraved.layer` for provenance).

Widths: 1 px hairline for backgrounds and grids, 1.25 px standard, 2.5 px for the single focal curve of a scene (`ENGRAVED_WIDTH_PX`).

Scenes get the API as `ctx.engraved` (bound to the backend chosen for that scene build); `ctx.line` and `ctx.grid` are thin wrappers over it. The lab runtimes (`createHawkingLabRuntime`, `createColliderDisplayRuntime`, `createAdsLabRuntime`, `createSpinFoamRuntime`, `createRgFlowFieldRuntime`) take `engraved` as an option.

## Two backends (D-028)

The scene is built before its renderer exists, and a scene holding a `ShaderMaterial` can never use the node renderer, so the line implementation is chosen **before the build**, in `engraved-backend.mjs`:

| Backend | Implementation | Used when |
|---|---|---|
| `node` | `lines/webgpu/Line2` + `Line2NodeMaterial` (TSL) | the node renderer can be reached: `navigator.gpu` exists and nothing forces WebGL2. Runs on WebGPU and on the node renderer's WebGL2 backend |
| `classic` | `lines/Line2` + `LineMaterial` | no `navigator.gpu`, `forceBackend: "webgl2"`, a scene with a classic-only material (the GR gravity well; the Kerr observatory), or a recovery rebuild |

`Scene3D` selects with `QGA_ENGRAVED.prepare(settings)` before `build(ctx)`, and rebuilds **once** on classic lines when (a) the node renderer failed, or (b) the built scene is not node-compatible (`classicLines` skips the first build for known classic scenes). `createRenderer` gives a scene with node-only materials no classic retry. `three/webgpu` (2.2 MB) is only loaded when the node backend is selected. All sources are the unmodified files of the pinned three 0.186.1 tarball (SHA-256 in `vendor/three/VERSION`).

## Appearance

* `Line2NodeMaterial` is `NoBlending` and fakes transparency by sampling the opaque scene. Engraved lines use real framebuffer blending instead (three's non-premultiplied factors, additive as `SrcAlpha, One`), always transparent-sorted, never writing depth, so halos, additive glow and overlap with other transparent objects are correct.
* The quad is 1 CSS px wider than the line and edge coverage is computed from the distance to the centre line, on both backends. The lines are therefore anti-aliased where the target has no MSAA (the node renderer's WebGL2 backend, a post-processing pass with `samples: 0`, the software renderer). The pipeline-facing `alphaToCoverage` is off on the node material so the edge is not attenuated twice.
* Widths are CSS pixels and independent of zoom, depth and DPR.

## Measurements (all through real renderers)

`qa/specs/engraved-lines.spec.mjs` integrates the cross-section of a line (sum of coverage over the rows it crosses):

| Backend | 1.25 px @ DPR 1 / 2 | 2.5 px @ DPR 1 / 2 |
|---|---|---|
| classic WebGL2 | 1.247 / 1.251 | 2.376 / 2.498 |
| node, WebGL2 backend | 1.247 / 1.251 | 2.502 / 2.498 |
| node, WebGPU (SwiftShader adapter, local only) | 1.247 / 1.251 | 2.376 / 2.498 |

`qa/specs/engraved-gr-fan.spec.mjs` measures probe lines made by the GR scene's own `ctx.engraved`, drawn by its renderer and pipeline (tone mapping and sRGB included, calibrated against a ladder of known opacity), at 0, 30 and 60 degrees:

| DPR | requested 1.25 px | requested 2.5 px |
|---|---|---|
| 1 | 1.250, 1.300, 1.300 | 2.500, 2.565, 2.565 |
| 2 | 1.250, 1.278, 1.278 | 2.500, 2.444, 2.444 |

The bound of the prompt is +-0.5 px.

## What stays a mesh

Focal curves drawn as tube meshes with a world-unit radius (the AdS/CFT Ryu-Takayanagi geodesic and its halo, the RG separatrices, the Hawking temperature rail) are geometry, not hairlines; they scale with zoom and are out of this prompt's scope. The GR strong-field markers are filled annuli by design (see the comment in `mod-gr.jsx`).

## Known limits

* Picking: a `Line2` raycasts in screen space and needs `raycaster.camera`; the collider tracks are pickable lines (`pickables`), checked by `qa/specs/prompt08-labs.spec.mjs`.
* `depthFade` on the classic backend patches the vendored `LineMaterial` shader strings (`onBeforeCompile`); the unit test pins the strings it relies on.
