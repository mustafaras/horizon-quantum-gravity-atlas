# GPU compute particles (S08)

Every particle system that the CPU rewrote each frame is now state in storage buffers, advanced by one compute kernel and drawn in one
instanced call, deterministic from a seed. The kit is `js/render/compute/`; the CPU reference that the tests compare it against is
`particles-cpu.mjs`. Closes the particle part of finding F-27 (see "What stays" below for the rest).

```text
js/render/compute/
  particles.mjs       createParticleSystem({ count, seed, init, update, render, initial, params })
  particles-cpu.mjs   hashU32, randomFor, createCpuParticleSystem: the same system on the CPU (pure, imports in Node)
  ballistic.mjs       the reference behaviour (a seeded burst: gravity, drag, respawn) in TSL
  ballistic-cpu.mjs   its CPU mirror
js/visualizations/
  atlas/backdrop-stars.mjs            the atlas backdrop starfield: a static seeded buffer, twinkle in the vertex stage
  blackhole/hawking-pairs(.mjs|-cpu)  Hawking pair field: closed form of the timeline phase
  rg/flow-tracers(.mjs|-cpu)          RG flow tracers: a walk along streamlines resampled into a table texture
  qft/field-peaks(.mjs|-cpu)          QFT crest markers: the closed-form field from a uniform mode table
  collider/event-display.mjs          calorimeter towers rise in the vertex stage; ambient dust is instanced sprites
```

## The kit

* **State.** `position` and `velocity` are `vec4` (xyz plus a free w, so the WebGPU storage layout needs no padding and a readback is a
  plain `Float32Array`), `age` is a `float`, `attr` a `vec4`. `initial` fills them once at creation (the one CPU write); nothing is
  uploaded afterwards.
* **init and update** are builder functions `(ctx) => { position?, velocity?, age?, attr? }`: they receive the particle's previous state as
  nodes and return its new state; an omitted field is left unchanged. `ctx` has `i`, `seed`, `dt`, `time`, `step`, `params`, `rand(channel)`
  and `randStep(channel)`.
* **One kernel.** Both builders run inside a single compute kernel selected by a uniform, and every buffer is assigned exactly once,
  unconditionally. This is a hard requirement of the node renderer's WebGL2 backend, which runs a kernel as a transform-feedback pass
  (D-038, D-039).
* **Randomness** is `hash(instanceIndex + seed * 7919 + channel * 15485863)`, three's PCG `hash`; `randStep` adds `step * 2654435761`
  (uint arithmetic, wrapping) so a respawn draws fresh values. `particles-cpu.mjs` reproduces it bit for bit (`Math.fround` of the uint over
  2^32), so a seed is the whole state of a run. No `Math.random`.
* **Per frame**: `system.step(renderer, dt)` calls `renderer.compute(kernel)`. `Scene3D` calls a scene's `prepare(renderer)` once the
  renderer exists and `compute(renderer, dt)` every frame after `update()`.
* **Render**: `createDataPoints` (S07) with the position read from the storage buffer (`nodes` mode); `colorNode`, `opacityNode` and
  `sizeNode` builders receive the buffers. `readback(renderer)` is for tests only.

## Two things r186 does on the WebGL2 backend that the kit works around

1. **A kernel reads its own buffers through the variable it writes** (a transform-feedback varying), so a read placed after an
   assignment sees the new value. The kit copies the previous state into locals before anything is assigned (`.toVar()`).
2. **A compiled program is cached by its source and keeps the attribute list of the first kernel that produced it.** A second system with
   identical source computed into the first system's buffers and left its own untouched (a re-mounted lab would have drawn stale
   buffers). Each kernel therefore carries a per-system serial constant that changes the source and not the maths.

Also: two separate kernels (init and update) over the same buffers do not stay in step on this backend, hence the single kernel.

## The migrated systems

| System | Before | After |
|---|---|---|
| Atlas backdrop stars | 700 colours rewritten per frame, the colour attribute re-uploaded | static seeded sprites; twinkle from `time` and a per-star phase in the vertex stage, palette tint a uniform |
| Hawking pair field | per-frame sprite positions and engraved trail segments | one system, one element per (particle, segment): heads and 6 tail dots, closed form of the shared phase; the engraved trails became dotted tails |
| RG flow tracers | per-frame positions and colours uploaded | one system walking a float table of the resampled streamlines (two `textureLoad`s and a lerp) |
| QFT crest markers | peak finding over the CPU slice buffer, sprite positions set per frame | one system, one element per interior sample, evaluating the closed-form field from a uniform mode table |
| Collider towers | the 72 tower matrices rewritten per frame during the 1.2 s rise | final matrices uploaded once; the rise is a vertex-stage scale along each tower's axis about its base |
| Collider and Hawking dust, starfields | `THREE.Points` (one pixel on both node backends) | instanced sprites |

The streamlines (RG) and the mode set (QFT) stay CPU-computed science: nothing about the physics is duplicated in a shader beyond the
documented closed form of the mode sum.

## What stays, and why

* **QFT waterfall surface** (the Fourier-mode vacuum lab): a mesh with a CPU ring buffer, not a particle system; it stays. The CPU membrane of the field laboratory was replaced in S14 by the GPU lattice field theory (`docs/render/lattice-field.md`).
* **GW lattice**: its `needsUpdate` sites upload the signal texture once per signal, never per frame, and its WebGL2 twin already deforms
  in the vertex stage; nothing per-frame to move. S26 replaces it.
* **Engraved lines** (`engraved-lines.mjs`, 3 sites) and the Planck, experiment and QFT-module canvases (`mod-*.jsx`) are line and 2D
  upload paths outside S08's list.

## Tests

* `test/particles-cpu.test.mjs`: the hash, the stream offsets, determinism, the reference physics, option validation, and each system's rig
  and CPU mirror (crest mask, tracer table vs the old arc-length walk, pair envelope).
* `qa/specs/compute-particles.spec.mjs` (node renderer, WebGL2 backend): GPU readback equals the CPU reference after 60 fixed steps
  (ballistic, Hawking, tracers, crests); two systems with one seed are bitwise identical and a re-initialised run equals a fresh one;
  zero `needsUpdate` assignments over 40 frames of step plus render; the picture shows the particles where the CPU reference puts them.
