# The Penrose atlas: conformal diagrams from exact maps (S19)

The Spacetime Observatory shows one large conformal diagram at a time, with optional comparison. Minkowski and Schwarzschild are computed from exact maps; Reissner–Nordström is a labelled schematic. F-16 remains open for S20, including the rubber-sheet well and observational tests.

```text
js/science/
  conformal.mjs                    the exact maps: Minkowski, Kruskal–Szekeres, the worldlines, the RN schematic, the region and boundary tables
  conformal-provenance.mjs         four registered entries (the atlas, its two exact panels, the schematic one)
js/formula/library/penrose.mjs     penrose-tortoise, penrose-kruskal-u, penrose-kruskal-v, penrose-compact-t, penrose-compact-r
js/visualizations/gr/
  penrose-geometry.mjs             the panel layout, the diagram-to-scene map, the generated zig-zag, the light-cone glyph, the framing
  penrose.mjs                      the scene: grid, boundaries, singularities, the focal worldline, the region markers
js/labs/
  penrose-atlas.jsx                the lab: the r0 slider, the release cursor, the region overlay, the readouts, three formula cards
  causal-spacetime-model.jsx       the causal lab's model, moved out of js/mod-gr.jsx so that file only shrinks
```

## The maps

* **Minkowski.** `u = t − r`, `v = t + r`, `U = arctan u`, `V = arctan v`, `T = (U + V)/2`, `R = (V − U)/2`. The diagram is the diamond `|T| + |R| < π/2`.
* **Schwarzschild.** The tortoise `r* = r + 2M ln|r/2M − 1|`, then `U = ∓e^(−u/4M)`, `V = ±e^(v/4M)` with the sign pair of the region, and the same `arctan` applied to each Kruskal coordinate: `T = arctan U + arctan V`, `R = arctan V − arctan U`. There is **no factor ½** here, and that is what puts `r = 0` on `T = ±π/2` while the horizon stays on `T = ±R`. The four regions are `I {R > |T|}`, `II {T > |R|}`, `III {R < −|T|}`, `IV {T < −|R|}`.
* **Why null rays are exactly 45°.** A conformal factor scales the metric by a positive function and so leaves every null direction alone, and applying the *same* monotone map to both null coordinates preserves `|dT| = |dR|` exactly rather than approximately. `test/conformal.test.mjs` measures the worst `|ΔT − ΔR|` over every sampled ray: 1.1e-13 against the plan's 1e-9.

## The worldlines

The free fall from rest at `r0` is the cycloid `r = (r0/2)(1 + cos η)` with `τ = √(r0³/8M)(η + sin η)` and

```text
t = F(η) + 2M ln |(S + tan(η/2)) / (S − tan(η/2))|,   F = 2MS(η + (r0/4M)(η + sin η)),   S = √(r0/2M − 1)
```

The Kruskal pair of the same `η` is written so that its product is exactly `ρ(r) = (1 − r/2M)e^(r/2M)`, which is what carries the curve through the horizon with no absolute value. Verified against quadrature (40 000 steps to `0.98 η_H`, agreement to 1e-13) and against the geodesic equation by finite differences (4e-11). The horizon is at `η_H = 2 arctan S`.

The static observer at `r0` ends exactly on region I's `i⁺`, and the two radial null rays are sampled uniformly in the compactified coordinate so that the 45° property is not a sampling artefact.

## The Reissner–Nordström panel

A labelled **schematic**, and it says so in the canvas. One block of the maximal extension is a chain of three regions along the axis, every boundary null: the triangle `0 < r < r−` whose inner edge is the timelike singularity at `R = 0`, the diamond `r− < r < r+` between the two horizon crossings, and the diamond `r > r+` opening onto `i⁰`. The left half is the mirror image and shares that vertical edge, which is what makes the singularity timelike rather than a cap. `r−` is a Cauchy horizon: data on it does not determine the future of the block.

Nothing here comes from a coordinate map, the exact extension is an infinite chain of such blocks rather than the one drawn, and charged black holes with `|Q|` comparable to `M` are not expected to exist in the sky — the surrounding plasma neutralises them. So the panel is about the structure of the solution, not about an object.

## The observatory

* One large selected diagram fits the available viewport. Compare displays the selected diagram alongside Minkowski (or Schwarzschild when Minkowski is selected), with independent event selection; coordinate scales are uniform within each diagram and are not a physical comparison of size.
* A click, drag, or keyboard-accessible movement buttons places an event on an exact map. Its two future radial null rays are clipped to that spacetime's boundary. The shaded region is the intersection of the diagram with the event's future light cone, obtained by clipping the diagram polygon against the two null half-planes. RN is schematic and does not support computed light signals.
* The Minkowski introduction first interpolates a finite sample of events from linearly scaled null coordinates to their exact arctan compactification; it then follows a stationary observer and a radial light ray toward their finite diagram boundaries. It can be skipped or replayed; reduced motion does not animate it. The first stage is a finite-sample illustration, not a literal animation of all infinity.
* The Schwarzschild observer runs along the computed free-fall worldline at constant proper-time progress. Play, pause, replay and scrubbing work with the starting-radius control. The horizon milestone is computed from the same free-fall parameterization.
* Region controls highlight a region anchor and show its description. The Formula Lens links U and V to computed outgoing and ingoing null rays; it is intended for the Schwarzschild view. The mathematical cards are available in the expandable equations section.
* A fixed camera orientation keeps the diagram plane and its null directions readable; zoom and fullscreen remain available. Screen-space text and controls remain outside the Three.js scene. Line and surface colours use the established tokens.

## Numbers on screen

The four readouts are the crossing point in the diagram, the proper time to `r = 0`, `η` at the horizon, and the coordinate time at the start. All four come from `freeFallFromRest`; the crossing is a closed form evaluated at `η_H` where `ρ = 0` exactly. For the default `r0 = 2.6M`: crossing `(1.238, 1.238)`, `τ = 4.657 M`, `η_H = 1.0022`.

The default radius is 2.6M rather than 10M on purpose. A fall from rest at a large radius crosses the horizon within a hair of `i⁺` — at `r0 = 10M` the curve's interior leg is six thousandths of a diagram unit long — so the plot would be a line hugging a corner. The slider exists to show that movement.

## Verification

The science tests cover the null maps, worldlines and exact crossing. Geometry tests cover the future-light-cone polygon, null-ray boundary clipping, viewport framing, RN schematic hit-testing, proper-time scrubbing and the transverse zig-zag mark. The browser spec exercises scene picking, accessible event controls, outside/inside horizon outcomes, full- and reduced-motion playback, comparison, region selection, formula focus, and mobile layout. Captures `gr-penrose-atlas` and `gr-penrose-atlas-mobile` record the intentional new single-map layout.

## Limits

* The Schwarzschild panel draws the maximal extension, which is not the geometry of a collapsing star: regions III and IV are not part of a real collapse, and the caption says so.
* The RN panel is schematic throughout, and its proportions are chosen for legibility, not computed.
* One block of the RN extension only; the infinite chain of blocks is stated in the note, not drawn.
* The free fall is radial and from rest. A fall with angular momentum has a different `r(τ)` and is not drawn.
