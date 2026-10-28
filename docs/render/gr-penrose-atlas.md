# The Penrose atlas: conformal diagrams from exact maps (S19)

The GR module now shows causal structure the way the subject draws it: three conformal diagrams side by side, computed from exact coordinate maps rather than sketched. Closes the third part of finding F-16 (no Penrose diagrams); the rubber-sheet well and the observational tests are S20's.

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

## The picture

* Three panels on the shared stage, drawn flat (`R` right, `T` up the screen, `z = −T·scale`) with a small field of view from far away, so the projection is as close to orthographic as a `PerspectiveCamera` gets.
* **The panels do not share a scale.** A conformal diagram is one coordinate system, so its `R` and `T` extents are set by the physics and the three diagrams come out different shapes: Minkowski square, Schwarzschild two to one, the RN block wider. Drawing them all at one scale makes a band thirteen times wider than it is tall, which no frame can show. Instead every panel is scaled to the **same drawn height**, the convention of a plate of diagrams; the scale stays uniform *within* a panel, so a null ray is still exactly 45° on screen (ledger D-121).
* Coordinate lines `t = const` and `r = const` at 1 px `--ink-faint`, drawn in the chart of **each** of Schwarzschild's four regions: a coordinate grid only exists inside one wedge, and drawing region I's grid across the horizon would put `r > 2M` lines in the interior. The interiors get two lines each so the families are seen to continue without hatching the middle of the picture.
* Horizons and the `r = 0` surfaces at 1.5 px in the status colour of their diagram (`--status-established`, `--status-schematic`). The singularities are **generated** zig-zag polylines — a triangle wave in the geometry module, never a texture — so they read as surfaces and not as another grid line.
* One 2.5 px focal curve: the free fall, with a light-cone glyph (two short 45° engraved segments) at every proper-time tick. The ticks are evenly spaced in `τ`, so they *crowd* where the map compresses the fall; that crowding is the diagram's own statement about the coordinate, not about the fall.
* The region overlay is a real control: eight buttons, arrow-key cycling on the list, `aria-pressed` state and a `role="status"` readout of what each region means. Every readout is a tested closed form from `js/science/conformal.mjs`.
* The Formula Lens binds `U` and `V` to their null-ray families (`js/formula/library/penrose.mjs`, five established definitions, all GPU-safe).

### Readability follow-up

The lab introduces the reading directions, light paths and the falling observer before the figure, with a short explanation of each spacetime and the coordinate transformations. On narrow screens the diagram retains its width inside a keyboard-focusable horizontal scroller; buttons bring each panel into view. The release cursor is centred on the computed worldline and its animation advances uniformly in proper time by interpolating the sampled trajectory. The Formula Lens highlights computed outgoing and ingoing null rays for U and V, respectively, rather than the unrelated constant-time and constant-radius grid. Reduced motion still snaps the cursor to the endpoint.

## Numbers on screen

The four readouts are the crossing point in the diagram, the proper time to `r = 0`, `η` at the horizon, and the coordinate time at the start. All four come from `freeFallFromRest`; the crossing is a closed form evaluated at `η_H` where `ρ = 0` exactly. For the default `r0 = 2.6M`: crossing `(1.238, 1.238)`, `τ = 4.657 M`, `η_H = 1.0022`.

The default radius is 2.6M rather than 10M on purpose. A fall from rest at a large radius crosses the horizon within a hair of `i⁺` — at `r0 = 10M` the curve's interior leg is six thousandths of a diagram unit long — so the plot would be a line hugging a corner. The slider exists to show that movement.

## Rules the lab keeps

* Status label and a registered provenance entry on every panel; two established, one schematic, and the schematic note is a caption line under the stage in the lab's own flow (pinned over the canvas it collides with the diagrams as soon as the stage is short).
* Colours and fonts from tokens only; lines 1 px / 1.5 px / 2.5 px; no colour or font literal in the new files.
* Keyboard reachable, visible focus, 44 px targets, `prefers-reduced-motion` snaps the release cursor to its end instead of animating it.
* The scene is static: it draws on demand through the shared stage and calls `invalidate()` on change. The only animated thing is the release cursor, and the `r0` slider redraws in place rather than rebuilding the scene.
* `js/mod-gr.jsx` shrank 1285 → 1225 (the causal lab's model moved to `js/labs/`); every new file is under 600 lines.

## Tests

`test/conformal.test.mjs` (19: the plan's four assertions — null rays at 45°, the horizon on the diagonal, the infalling worldline crossing at finite `(T, R)` and ending on the singularity, the static observer approaching `i⁺` — plus the closed form against quadrature and finite differences, `UV = ρ` in all four regions, the region tiling, every drawn edge at 45°, the RN chain, and each chart's grid staying inside its own wedge), `test/penrose-geometry.test.mjs` (9: the layout, the diagram-to-scene map and its inverse, the uniform scale within a panel, the generated zig-zag, the light-cone glyph, the panel hit test, the framing), `test/formula-core.test.mjs` (+1: the Kruskal relations equal the science module and are GPU safe), and `qa/specs/penrose-atlas.spec.mjs` (7, node renderer WebGL2). Captures `gr-penrose-atlas` and `gr-penrose-atlas-mobile`.

## Limits

* The Schwarzschild panel draws the maximal extension, which is not the geometry of a collapsing star: regions III and IV are not part of a real collapse, and the caption says so.
* The RN panel is schematic throughout, and its proportions are chosen for legibility, not computed.
* One block of the RN extension only; the infinite chain of blocks is stated in the note, not drawn.
* The free fall is radial and from rest. A fall with angular momentum has a different `r(τ)` and is not drawn.
