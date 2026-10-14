# Kerr observatory renderer

The Kerr observatory (`js/visualizations/kerr/`) turns the Prompt 03 science core
(`js/science/`, see [kerr-rendering.md](kerr-rendering.md)) into the flagship
black-hole image: a spin-dependent shadow, a lensed thin disk with Doppler
beaming and gravitational redshift, distinguishable higher-order images and
anti-aliased lensed background stars.

## Module map

| File | Owns |
| --- | --- |
| `kerr-observatory.mjs` | Pure render model: versioned state, quality budgets, science-derived tables, observer coefficients, CPU reference tracer, picking/focus, accumulation, export, provenance |
| `kerr-material.mjs` | WebGL2 backend (fragment integrator, ping-pong accumulation) and backend selection (`createKerrRuntime`) |
| `kerr-material.tsl.js` | WebGPU backend (TSL compute integrator, storage-buffer accumulation) |
| `starfield-texture.mjs` | Active seeded star catalogue, linear-light mip chain, filtering constants |
| `starfield-sampler.mjs` | Experimental procedural sky sampler; not used by the current renderers |
| `kerr-plasma.mjs` | Seeded, unit-mean heuristic turbulence field and soft outer edge |
| `plasma-volume.mjs` | Volumetric corona: flaring slab geometry, seeded frozen clumping, emission/absorption sample, GLSL chunk |
| `jet-field.mjs` | Bipolar jets: Blandford–Znajek spin scaling, parabolic collimation, spine/sheath beaming, seeded knots, GLSL chunks |
| `kerr-runtime-shared.mjs` | Science-table textures and plasma display clock |
| `kerr-controls.jsx` | Controls, focus explanation, status readout, ultra-quality capture panel |
| `../../render/progressive-capture.mjs` | Progressive still orchestration, GPU-memory guard, PNG encoder with the metadata sidecar, WebGL row-order flip, Lanczos-3 upscale |
| `../../render/hdr-environment.mjs` | Seeded HDR environment with importance sampling; refused on this view (see below) |

The renderer never restates ISCO, horizon, photon-sphere, spectral or g-factor
*values*. They reach the shaders as lookup tables and observer coefficients built
by calling `kerrIsco`, `kerrHorizonRadii`, `kerrPhotonSphere`,
`kerrCircularOrbit`, `pageThorneFluxGeometric`, `kerrConservedQuantities` and
`blackbodyToSrgb`. The only physics next to the shaders is the geodesic
integration loop itself.

## Integration

Per pixel the local ZAMO direction `n = (n_r, n_θ, n_φ)` of the observer
(spin axis along world +y; screen-right = `e_φ`, screen-up = `−e_θ`) gives the
conserved quantities. `E`, `L_z` are affine in `n_φ`, `p_θ` is linear in `n_θ`
and `p_r` in `n_r`; the coefficients are *probed from the science API* with unit
directions (`kerrObserverCoefficients`), and `Q` follows from them.

The ray is integrated in Mino time. For reference, the separated equations in
`u = cos θ` are:

```
r''  = R'(r)/2 = 2 E r P − (r − 1) K,   P = E(r² + a²) − a L_z,  K = (L_z − aE)² + Q
u''  = −u (Q + L_z² − a²E²) − 2 a² E² u³
φ'   = −(aE − L_z/(1 − u²)) + a P/Δ
```

The CPU reference and WebGL2 shader carry polar motion as a unit vector on the
sphere, with frame dragging integrated as a separate axial rotation. This is
equivalent to the equations above and remains regular at the spin axis. They
use RK4 steps `dλ = k · min(1/r, (r − r₊)/(|r'| + 1))`, then re-impose the
radial and angular first integrals. The WebGPU compute backend retains the
separated `u, φ` formulation for the smooth disk models. The first disk
crossing agrees with the science `traceKerrRay` to better than 0.2 % at the
ultra budget (see `test/kerr-render-state.test.mjs`).

* captured: `r < r₊ + 0.02` while infalling (the tracer never crosses the horizon)
* escaped: `r > 160` while outgoing; the asymptotic direction is the ray's
  direction of motion; the sphere-vector formulation has no polar denominator
* unresolved: step budget exhausted — drawn as shadow, **never** as an enhanced ring
* disk crossing: sign change of `u`, linear interpolation of `r`; `order` counts
  prior equatorial crossings (`n = 0` is the direct image)

The CPU reference tracer mirrors the WebGL2 algorithm. Browser tests also check
the actual shader output and backend selection.

## Operation order for disk light

1. emitted effective temperature from the science table (Page–Thorne flux,
   `T = T_peak (F/F_max)^{1/4}`, **display-scaled** `T_peak = 5000 K`)
2. combined gravitational + Doppler shift `g = 1 / (uᵗ (E − Ω L_z))`
   (equal to `kerrTotalRedshiftFactor(...).total / E`, asserted in tests)
3. observed temperature `T_obs = g T`, blackbody chromaticity from the CIE 1931 table
4. intensity beaming `I_obs = g⁴ F/F_max` (bolometric, Liouville)
5. exposure and display gain, accumulation across samples
6. **one** tone map (AgX or Neutral) and sRGB transform in the render pipeline

The default turbulent model is optically thick. Its outer edge fades from
`0.55 r_out` and a seeded, unit-mean display texture modulates the emissivity
at the local orbital angular velocity. The texture is heuristic, not an MHD
simulation. Reduced motion freezes its clock. The smooth and Newtonian models
retain their documented transmittance.

Per-crossing transmittance is a display parameter (0.35 translucent, 0 opaque)
that makes image orders separable; it is labelled as such in the UI and in the
provenance. Image-order tinting (`n = 1` cyan, `n ≥ 2` magenta) is an annotation
aid controlled by the annotation toggle.

## Volumetric corona and jets

Two volumetric layers sit on top of the disk. Both are **heuristic** — they are
physically motivated, parameterised from published scaling relations, and
explicitly not radiative-transfer solutions. They render only on the WebGL2
integrator (see the capability gate below) and are on by default at `bhv=2`.

### Corona

A flaring optically thin slab above and below the disk, `H(r) = 0.12 r^1.1`,
with an ISCO-peaked radial profile and a seeded, frozen log-normal clumping
field. It corotates with the disk at `Ω(r)`, so it shares the disk's exact
redshift `g` and the `g⁴` beaming factor rather than inventing a second
kinematic model. Emission and absorption are integrated per ray segment with
`τ ≈ 0.2`; the segment length is the ZAMO spatial path length, so the optical
depth is a real path integral, not a per-pixel constant.

### Jets

A bipolar Blandford–Znajek jet. The spin factor is the established
`(a★ / (1 + √(1 − a★²)))²`, so `a★ = 0` removes the jets entirely. Collimation
is heuristic and parabolic (`ρ ∝ √s`), the flow is two-component (spine
`Γ → 8`, sheath `Γ → 2.5`), and the observed brightness uses the exact
relativistic Doppler factor `δ = 1 / (Γ (1 − β·n̂))` multiplied by the ZAMO
lapse, with the spectral index entering as `δ^(3+α)`, `α = 0.5`. Seeded
unit-mean log-normal knots advect along the jet at `0.55 c` on the same display
clock as the disk. The display colour maps synchrotron ageing; it is a display
choice, not a spectral model.

### Capability gate

The volumetric layer needs the per-step emission/absorption sampling and the
extra accumulation attachments, so it is served by the WebGL2 fragment
integrator at `balanced` and `ultra` quality. The `performance` budget and the
WebGPU compute path keep the smooth Prompt 04 image, and the status readout
says which one is live. Requesting the layer selects the WebGL2 backend; the
equations and claim labels never change with the backend.

### Compositing

The integrator writes four attachments: disk radiance, sky radiance, jet
radiance and the luminance-weighted jet position. The display pass composites
them depth-ordered, splitting the volume segment at disk crossings so the
corona is correctly occluded by the disk rather than added on top of it. The
jet knot pattern is evaluated at the luminance-weighted mean jet position, so
it animates without retracing rays.

## Quality budgets

| Preset | max steps | step constant `k` | temporal samples | rays / px / frame | sky map | volume |
| --- | --- | --- | --- | --- | --- | --- |
| performance | 112 | 0.30 | 1 | 1 | 1024×512, 3 500 stars | off |
| balanced | 224 | 0.16 | 8 | 1 | 2048×1024, 9 000 stars | on |
| ultra | 448 | 0.08 | 24 | 2 | 3072×1536, 18 000 stars | on |

* The `volume` column is the corona + jets capability gate: it is `on` only on
  the WebGL2 integrator, so the performance budget and the WebGPU compute path
  keep the smooth disk image.

* The atlas detail tier caps the request (`low → performance`, `medium → balanced`).
* The adaptive governor scales `max steps` by its current ray-step ratio (floor 64);
  it never changes the equations.
* Reduced motion removes temporal accumulation (`temporalSamples = 1`) and
  compensates with four deterministic jittered rays per pixel, so reference images
  are reproducible.
* Quality changes sampling density and resolution only. Claim labels and equations
  are unchanged.

## Temporal accumulation

Each frame adds one Halton(2,3)-jittered sample to a running mean until
`temporalSamples` is reached, then the integrator stops until something changes.
The history resets when any of these change: camera (distance, polar, azimuth),
spin, mass, inclination, resolution, backend, quality (effective), disk model, or
the step budget (`kerrAccumulationKey`). Exposure, annotations and focus are
display-only and do not reset it.

* **WebGL2**: fragment integrator into a two-attachment float or half-float
  ping-pong render target. Disk and sky radiance accumulate separately; the
  disk attachment also retains the luminance-weighted hit position so the
  turbulence texture can animate without retracing rays.
* **WebGPU**: TSL compute kernel, one invocation per pixel, `vec4` storage buffer.
  Chosen for the smooth disk models when a native WebGPU adapter exists and the
  backend is not forced to WebGL2. The turbulent model uses WebGL2 because its
  display texture needs the disk-hit attachment. If compute fails, the scene
  rebuilds once on WebGL2.

## Distortion-aware starfield

The sky is an equirectangular linear-radiance map of spherical-Gaussian stars
(conserved flux, round at every latitude) with a solid-angle-weighted mip chain
built in linear light and stored with an `enc = sqrt(v / 4)` 8-bit encoding. The
lensed escape direction's pixel footprint is measured from the escape-direction
derivatives (`dFdx/dFdy` on WebGL2; two neighbouring rays on WebGPU, which has no
derivatives in compute) and sets the mip level, clamped to 0.3 rad. Pixels beside
the critical curve therefore average over the sky solid angle they actually see
instead of point-sampling it, which removes streaking and single-pixel flicker.
The band of dense faint stars is there on purpose so extended lensing is visible.

## Focus picking

Clicking (or the Focus buttons) traces the clicked pixel with the reference tracer
and classifies it: `horizon` (captured), `direct-disk` (first in-disk crossing is
order 0), `higher-order` (first in-disk crossing is order ≥ 1), `photon-region`
(closest approach within 1.35 × the retrograde photon radius, or unresolved) and
`sky`. The camera dollies to a documented distance (instantly under reduced
motion), a defocus disc is drawn around the feature, and the explanation panel
shows the exact science values (`r₊`, ISCO, photon radii, `g`, order, `r` at hit).

## Ultra-quality still capture

The capture panel renders the current observatory view offscreen at 2K, 4K or
8K (height-driven; width follows the live aspect) with the `ultra` ray budget
regardless of the live quality — a still is offline, so the equations and
labels never change. The capture API accepts an explicit `quality` override
(`performance`/`balanced`/`ultra`) for callers that want a cheaper still; the
equations, labels and provenance are identical at every budget, only the RK4
step budget changes. Halton-jittered samples accumulate in chunks across
animation frames with progress and cancellation, then the display pass runs at
a frozen plasma time, an optional edge-aware bilateral denoise (3×3) is
applied, the pipeline's exact tone mapping and sRGB transform are used, and an
optional Lanczos-3 upscale renders smaller and enlarges. The result is a PNG
with a `horizon-qga-capture/v1` metadata sidecar in a `tEXt` chunk: state,
provenance (model, status, numerical method, references), backend, quality
budget, resolution, sample count, seed, commit hash and the volume flags.

* A GPU-memory guard rejects unsafe dimensions **before** allocation with an
  actionable message (smaller preset or upscale), so a bad request cannot take
  the renderer down.
* Repeated captures with the same seed and a frozen clock are pixel-stable;
  the QA spec asserts identical decoded pixels and an identical sidecar apart
  from its wall-clock `capturedAt` stamp.
* `readRenderTargetPixels` returns rows bottom-to-top, so the readback is
  flipped before encoding; a still matches the live view's orientation.
* All capture-side render targets, materials and geometries are disposed on
  completion, cancellation and error, and the live view is restored.
* The WebGPU compute path captures the smooth disk models it serves; the
  volumetric layer is WebGL2-only, as documented above.

## State, export, provenance

URL keys use `bhv=2` for the turbulent default. Unversioned and `bhv=1`
black-hole links retain the earlier smooth Page–Thorne disk and annotations;
unknown future versions fall back safely. Keys: `bhs` spin (−0.998…0.998),
`bhi` inclination (3…89°), `bhd` observer distance (12…120 GM/c²), `bhdm`
disk model (`page-thorne-turbulent`, `page-thorne`, `page-thorne-opaque`,
`newtonian`), `bhq` quality, `bhe` exposure (EV, −3…3), `bha` annotations,
`bhc` corona (boolean, default on) and `bhj` jets (boolean, default on). A
versioned link that omits `bhc`/`bhj` keeps the documented defaults, so old
links are unchanged.

`QGA_EXPORT_JSON` on the black-hole view adds `kerrSchema`, `observatory` (exact
radii, observer coefficients, table checksums, constants), `numerics` (integrator,
budget, backend, accumulation counters), `volume` (corona and jets flags and the
capability gate), `validity` and `provenance`, and asserts
that every number is finite. The view is registered once in the shared provenance
registry as `bh-kerr-observatory` with status `effective`.

## Validity and limits

* Exterior only; no horizon crossing, no interior claims.
* Thin, equatorial, circular-orbit disk; zero-torque at the ISCO; no emission
  inside it, no disk thickness, no radiative transfer, no returning radiation.
* `T_peak = 5000 K`, transmittance, disk outer edge 24 GM/c² and the star catalogue
  are display parameters, not measurements.
* Rays exhausting the budget are shadow; photon-ring subimages beyond the resolved
  order are not drawn.
* Observer is a ZAMO; the sky is not given the ≈ `1/α` observer blueshift.
* The corona and jets are **heuristic**: the flaring-slab geometry, the
  collimation law, the spine/sheath Lorentz factors, the knot spectrum and the
  synchrotron display colour are parameterised, not solved. The Blandford–Znajek
  spin factor, the Doppler factor and the `g⁴` beaming are exact given those
  parameters. No jet is drawn at `a★ = 0`.
* The HDR environment is deliberately **not** applied to this view: the horizon
  is ray-traced black and the observatory sky is its own lensed starfield, so an
  external environment would be a false light source. The exclusion is enforced
  by view id and by structural mesh detection.

## Verification

```
npm test                                                    # includes test/kerr-render-state.test.mjs
npm run validate
npm run qa:test -- qa/specs/kerr-observatory.spec.mjs
npm run qa:test -- qa/specs/kerr-ultra-capture.spec.mjs
npm run benchmark:kerr
```
