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
| `kerr-runtime-shared.mjs` | Science-table textures and plasma display clock |
| `kerr-controls.jsx` | Controls, focus explanation, status readout |

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

## Quality budgets

| Preset | max steps | step constant `k` | temporal samples | rays / px / frame | sky map |
| --- | --- | --- | --- | --- | --- |
| performance | 112 | 0.30 | 1 | 1 | 1024×512, 3 500 stars |
| balanced | 224 | 0.16 | 8 | 1 | 2048×1024, 9 000 stars |
| ultra | 448 | 0.08 | 24 | 2 | 3072×1536, 18 000 stars |

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

## State, export, provenance

URL keys use `bhv=2` for the turbulent default. Unversioned and `bhv=1`
black-hole links retain the earlier smooth Page–Thorne disk and annotations;
unknown future versions fall back safely. Keys: `bhs` spin (−0.998…0.998),
`bhi` inclination (3…89°), `bhd` observer distance (12…120 GM/c²), `bhdm`
disk model (`page-thorne-turbulent`, `page-thorne`, `page-thorne-opaque`,
`newtonian`), `bhq` quality, `bhe` exposure (EV, −3…3), `bha` annotations.

`QGA_EXPORT_JSON` on the black-hole view adds `kerrSchema`, `observatory` (exact
radii, observer coefficients, table checksums, constants), `numerics` (integrator,
budget, backend, accumulation counters), `validity` and `provenance`, and asserts
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

## Verification

```
npm test                                                    # includes test/kerr-render-state.test.mjs
npm run validate
npm run qa:test -- qa/specs/kerr-observatory.spec.mjs
npm run benchmark:kerr
```
