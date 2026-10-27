# TSL material kit (S07)

One GPU language for everything except the Kerr classic fallback. The kit in `js/render/materials/` is a small library of
TSL node materials that encode the art direction and the physics; the GR gravity well, central star and starfield, which were three
GLSL `ShaderMaterial`s, are built on it. Closes finding F-25.

```text
js/render/materials/
  blackbody.mjs       blackbodyLUT, blackbodyEmission: temperature -> colour, one definition shared with js/science/spectrum.mjs
  field-heatmap.mjs   fieldMaterial, fieldColorNode, contourNode: a value node through a palette table, iso-contours of constant width
  engraved-grid.mjs   lineCoverage, engravedGridMaterial: analytic grid lines of constant pixel width on any parameterisation
  data-points.mjs     createDataPoints: instanced, screen-space-sized point sprites (disc, soft, ring)
  index.mjs           the public surface, kitPrewarmSignature(), createKitProbeScene()
js/visualizations/gr/
  curvature-materials.mjs   the well, the star and the starfield, written on the kit
  curvature-engine.mjs      the Scene3D builder (moved out of mod-gr.jsx)
  curvature-sim.mjs         pure dynamics: Kepler orbits, plunge, null geodesics, radiation reaction
  lensed-sky.mjs            the lensed-sky ray trace (moved out of mod-gr.jsx)
```

## The materials

| Module | API | What it does |
|---|---|---|
| `blackbody` | `blackbodyLUT({ tMin = 1000, tMax = 40000, size = 256 })` | Half-float `DataTexture` of `blackbodyToSrgb(T).linearRgb`, sampled log-uniformly in temperature. Entries equal the CPU function to 1e-6 (tested on the float32 table; the texture is within half-float precision of it). |
| | `blackbodyEmission(temperatureNode, radianceNode, lut?)` | TSL colour node `lut(T) * radiance`. The table holds the peak-normalised linear triple that `blackbodyToSrgb` returns; brightness is the radiance factor (D-036). |
| `field-heatmap` | `fieldMaterial({ valueNode, range: [lo, hi], palette, paletteName?, contours? })` | `palette` is `"sequential"` (viridis, magma, cividis from `js/design/palettes.mjs`), `"diverging"` (the token ramp, OKLab) or `{ stops }` (linear-light stops). Contours are drawn analytically with `fwidth`, so they keep `widthPx` at any zoom. This is the material S10 uses to visualise a formula term. |
| `engraved-grid` | `lineCoverage(coord, widthPx)`, `engravedGridMaterial({ space, minor, majorEvery, widthPx, color, fade })` | Coverage of the lines at the integers of a coordinate: the pixel distance to the nearest line is `abs(fract(c - 0.5) - 0.5) / fwidth(c)`, and coverage falls linearly to zero at `widthPx`. Works on a plane's x/z or x/y, a mesh's uv, or polar rings and spokes. Colour defaults to `--ink-faint`. Replaces wireframe meshes used as grids. |
| `data-points` | `createDataPoints({ positions, sizePx, colors?, color?, profile, ring?, sizeAttenuation, twinkle?, dynamic })` | An instanced `Sprite` with a `PointsNodeMaterial`. Why a sprite: in r186 a WebGPU `Points` primitive is one pixel and the node WebGL2 backend also writes `gl_PointSize = 1.0`, so a size in pixels needs quads. `sizePx` is CSS pixels, or world units with `sizeAttenuation` (like `PointsMaterial.size`). Edges are antialiased in pixel units, centred on the true radius. |

Every kit material carries `userData.qgaNodeKit = true`.

## Where kit scenes run

A node material cannot be drawn by the classic `WebGLRenderer`. The prompt assumed CI runs the node renderer's WebGL2 backend; the
code (`create-renderer.mjs`) drew every scene with the classic renderer when `navigator.gpu` was absent (D-028). S07 adds the missing
path (D-034):

* `inspectSceneCompatibility(scene)` reports `kit` for a scene holding a kit material (and `nodeOnly`, as for node engraved lines).
* A kit scene is attempted on WebGPU first (when there is an adapter and WebGL2 is not forced), then on **`node-webgl2`**: a
  `WebGPURenderer({ forceWebGL: true })`, which three runs on its WebGL2 backend. It never falls back to the classic renderer. The
  shared WebGPU stage (`forceBackend: "webgpu"`) takes WebGPU or nothing and the session then uses the WebGL2 context pool.
* `Scene3D nodeKit` keeps such a scene on the node engraved lines (`requireNode`), and gives it no classic recovery rebuild.
* The compatibility lights (`AmbientLight`, `DirectionalLight`, `PointLight` of `three-runtime.mjs`) are subclasses, and the node
  renderer looks a light's node class up by exact constructor, so they were ignored ("Light node not found") and lit meshes rendered
  unlit. `createRenderer` registers them on every node renderer (D-037).
* `prewarmShaders` compiles the kit's canonical variants once per renderer (`createKitProbeScene()`, keyed by
  `kitPrewarmSignature()`) before the scene's own shaders, and only when the scene holds a kit material.

## The GR scene

| Before | After |
|---|---|
| `new THREE.ShaderMaterial` x3 (stars, well, star surface) | `createStarfield`, `createWellMaterial`, `createStarMaterial` on the kit |
| `THREE.Points` with `PointsMaterial` (trail dots, dust motes) | `createDataPoints` (1 px points on both node backends) |
| `Math.random` in the starfield and the dust respawn | `seededRng` |
| `GR_BODIES` read in two formula readouts, never defined | the live editable bodies |
| `CurvatureEngine3D` and the lensed-sky ray trace in `mod-gr.jsx` (2408 lines) | `js/visualizations/gr/` (`mod-gr.jsx` 1511 lines) |

The well is a **schematic**: an embedding intuition drawn as an engraved grid (Cartesian lines every world unit, majors every four, a
polar net near the throat) with a field heatmap of its depth through an azure -> blue -> pale ramp, a slow shimmer and descending
pulses. S20 replaces its geometry with the exact Flamm embedding. All colours are design tokens.

## Tests

* `test/material-kit.test.mjs`: LUT entries vs `blackbodyToSrgb` to 1e-6, option validation of every module, palette tables, the
  sprite API, prewarm signature, the ShaderMaterial allowlist.
* `test/curvature-sim.test.mjs`: the extracted dynamics (perihelion advance per orbit equals `6 pi GM / c^2 a (1 - e^2)` within 2%).
* `qa/specs/material-kit.spec.mjs` (node renderer, WebGL2 backend): a 6500 K emission pixel equals the table colour, the heatmap
  ends equal the first and last viridis entries, a 2 px grid line integrates to 2.0 +- 0.5 px, 12 px discs cover their area within 3%,
  and the GR scene on that renderer holds no `ShaderMaterial` and the three kit materials.
