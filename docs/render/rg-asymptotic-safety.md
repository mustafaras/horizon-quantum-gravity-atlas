# Asymptotic safety: the Einstein–Hilbert flow and the GPU silk (S18)

The RG module now carries the two-coupling Einstein–Hilbert truncation of asymptotic safety: the flow of the dimensionless Newton coupling `g` and cosmological constant `lambda`, drawn as a line-integral-convolution "silk", with its fixed points, its separatrix and the line where the truncation breaks down. Closes the second half of finding F-14 (the RG was limited to one-loop QED/QCD and toy fixed points).

```text
js/science/
  asymptotic-safety.mjs            beta functions, the two schemes, fixed points and exponents, stability matrix, separatrix, integrateFlow, classifyTrajectory
  asymptotic-safety-provenance.mjs three registered entries (the silk, the trajectory figure, the 3-D field)
  rg-flow-3d.mjs                   the gravity mode of the 3-D field: lambda as the second axis, its streamlines, its separatrix
js/formula/library/asymptotic-safety.mjs   as-beta-g and as-beta-lambda, GPU-safe, four terms each
js/figure/plots/asymptotic-safety.mjs      trajectoryRun and trajectorySpec (the Figure Kit figure under the silk)
js/visualizations/rg/
  lic-field.mjs                    the TSL silk: per-fragment LIC, the engraved overlays, the focal trajectory
  lic-cpu.mjs                      the CPU twin of the LIC, the reference the tests measure
  silk-geometry.mjs                the (g, lambda) <-> scene map and the overlay polylines
  flow-field.mjs                   the 3-D field, now with the gravity mode
js/labs/gravity-flow-lab.jsx       the lab: presets, start ranges, readouts, the scheme table, two formula cards
js/labs/rg-flow-field-lab.jsx       the 3-D field, moved out of js/mod-rg-stage3.jsx, with its model selector
```

## Science

* **Equations.** Reuter & Saueressig, *Quantum Einstein Gravity*, New J. Phys. 14 (2012) 055022, arXiv:1202.2274, section 4, eq. (4.14)–(4.20); the closed forms for the optimised (Litim) cutoff in d = 4 are in the module's header with the equation numbers. The second scheme is Litim, PRL 92 (2004) 201301, arXiv:hep-th/0312114, eq. (4)–(5) in harmonic gauge. Both were read from the arXiv PDFs.
* **The numbers.** Optimised cutoff: g\* = 0.7073, lambda\* = 0.1932, critical exponents theta = 1.4753 ± 3.0432 i. Litim's own equations give lambda\* = 0.2500 and theta = 1.667 ± 4.308 i — the same truncation in a different gauge and regulator, and the scheme table in the lab prints both. Newton iteration from a 13 × 18 grid of starts returns exactly the Gaussian (0, 0) and the non-Gaussian fixed point.
* **The plan's attribution.** The plan quotes 0.707 / 0.193 / 1.475 ± 3.043 i as Litim's; they are the optimised-cutoff values of Reuter and Saueressig's equations. The source wins, and the difference is recorded (ledger D-105).
* **Trajectory types.** Reuter & Weyer's classification through Reuter & Saueressig section 5.1: Type Ia runs to negative lambda in the infrared, Type IIIa to positive lambda and stops on the singular line lambda = 1/2 or on the boundary `1 − g B₂ = 0` where eta_N diverges, and the single Type IIa trajectory is the separatrix into the Gaussian fixed point.
* **The separatrix** is integrated by RK4 from 1e-6 along the Gaussian fixed point's UV-repulsive eigendirection (eigenvalue +2) to the non-Gaussian fixed point; `classifyTrajectory` calls a start Type IIa within 3e-3 of that polyline.
* **Status.** Conjectural framework. The truncation keeps two couplings of an infinite tower, and the numbers move with the cutoff and the gauge; the structure of the phase portrait does not. The caption, the in-canvas label and the provenance all say so.

## The silk

* A full-viewport quad over g ∈ [−0.2, 1.2] × lambda ∈ [−0.4, 0.55]. The lambda range reaches 0.55 past the singular line so the line and the hatched region beyond it are inside the picture (ledger D-106); the plan stopped at 0.49.
* Every fragment integrates the normalised vector field ±L steps and averages TSL `hash` white noise along it with a Hann kernel; L = 16 (low), 24 (standard) and 40 (ultra). No texture, no `Math.random`; the noise is the hash of the integer cell with seed 42.
* The vector field is the node graph `compileTSL` builds from the Formula Core definitions `as-beta-g` and `as-beta-lambda`, so the shader and the tested science are one expression (equal to the science module to 1e-12).
* Colour is the diverging palette of `sign(beta_g)`, luminance is the LIC value, a faint engraved grid lies under it, and beyond lambda = 1/2 the plane is hatched. Over it: rings at both fixed points, the separatrix at 2 px, the singular line, the dashed curve where eta_N diverges, and the chosen trajectory as the single 2.5 px focal line in a fixed-capacity stream (no allocation per frame).
* The ripple that slides along the streaks runs only in full motion; under reduced motion the amplitude is zero and the picture is the plain LIC, and the scene draws only when invalidated.

**CPU reference.** `lic-cpu.mjs` is the same algorithm in plain JavaScript. On a uniform rotation field at 128² the variance of the samples along a streamline is 0.115 of the variance across them (the plan asks for under 0.2), so the streaks are shown to follow the field rather than the noise.

## The 3-D field

The existing three-dimensional field (Prompt 07) gains the Einstein–Hilbert flow as a fourth model button. In that mode the second horizontal axis is the cosmological constant, not the teaching model's mass-like coupling `r`: the field is the same two-dimensional flow lifted onto the `t = ln k` axis, its streamlines come from `integrateFlow` (the silk's own adaptive RK4), and the plane lambda = 1/2 marks where the truncation stops. The scene is drawn at 4.6 scene units per coupling rather than 1.5, because the two-coupling box is 1.4 × 0.89 couplings wide and the one-coupling scale would draw a sliver.

## Rules the lab keeps

* Status label and a registered provenance entry on both figures and on the 3-D scene; the caption carries the status its entry declares. The silk's in-canvas status is DOM pinned to the stage corner (`mountOverlay`), so it cannot be clipped when the plane is wider than the stage.
* Colours are `cat-*`, `ink-*`, `accent`, `div-*`; lines 1.25 to 2 px, the focal 2.5 px; no pigment in the figure, no colour or font literal.
* Presets and start ranges are keyboard operable; buttons and ranges are 44 px (`qa/specs/gravity-flow-lab.spec.mjs` measures them at 1280 and 390 px); KaTeX labels are not upper-cased; reduced motion freezes the ripple instead of animating it.
* `js/mod-*.jsx` shrank by 40 lines (the 3-D lab moved to `js/labs/`); every new file is under 600 lines.

## Tests

`test/asymptotic-safety.test.mjs` (the fixed points and the plan's numbers to 2e-3, the stability matrix, the separatrix, the trajectory classes, the singular boundaries), `test/gravity-plots.test.mjs` (the figure), `test/lic-cpu.test.mjs` (the LIC reference and the coherence measurement), `test/silk-geometry.test.mjs` (the maps and the overlays), `test/rg-flow-3d.test.mjs` (+6 for the gravity mode), `test/formula-core.test.mjs` (+1: the beta functions equal the science module and are GPU safe), and `qa/specs/gravity-flow-lab.spec.mjs` (9, node renderer WebGL2). Captures `rg-gravity-flow` and `rg-gravity-flow-mobile`.

## Limits

* The plan asks for the LIC length L = 24 at medium and 40 at ultra; the low detail tier uses 16 so that a phone can draw it.
* The 3-D gravity field reuses the (g, lambda) domain of the silk; a seed outside it is dropped and a run that leaves it stops, so the picture is the truncation's domain, not all of theory space.
* Both schemes are truncations at two couplings. Nothing here tests whether the non-Gaussian fixed point survives in the full tower, which is the open question of asymptotic safety.
