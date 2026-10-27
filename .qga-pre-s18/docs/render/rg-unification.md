# Gauge-coupling running and unification (S17)

The RG module now runs the three Standard-Model gauge couplings from the Z mass to the Planck scale and shows how nearly they meet. Closes the numerical half of finding F-14 (the RG was limited to one-loop QED and QCD and toy fixed points).

```text
js/science/
  gauge-running.mjs              inverse couplings, one-loop analytic and two-loop RK4 run, SM and MSSM, 1-sigma band, unificationTriangle
  data/gauge-couplings.mjs       alpha_em^-1(M_Z) in MS-bar, derived from PDG 2026 inputs, every input with citation, value, uncertainty, date
  gauge-running-provenance.mjs   four registered entries (two figures, each with an MSSM variant labelled conjectural)
js/figure/
  lens.mjs                       Formula Lens for Figure Kit marks (createFigureLens, markIndexesFor)
  plots/unification.mjs          couplingRunSpec and triangleSpec
js/formula/library/gauge-running.mjs   the one-loop solution as a Formula Core formula with four terms
js/labs/unification-lab.jsx      controls, readouts and the formula card
```

## Science

* Inputs at M_Z (PDG 2026): MS-bar sin²θ_W = 0.23122(6), α_s = 0.1180(9), α_em⁻¹ = 127.961 ± 0.014. The last is **derived**, not printed: the 2026 review has no α̂⁻¹ number (ledger D-099). It is α(0)⁻¹[1 − Δα_lep − Δα_had⁽⁵⁾ − (Δα̂ − Δα)] with α(0)⁻¹ = 137.035 999 177(21), Δα_had⁽⁵⁾ = 0.02760(10) and the shift 0.007123 from the PDG review, and Δα_lep = 314.97686 × 10⁻⁴ from Steinhauser (1998). The same pipeline with the 2024 edition's Δα_had returns 127.9299 against the 127.930 that edition prints. The plan's 127.951 is the 2022 edition's value.
* One loop, dα_i⁻¹/dt = −b_i/2π with b = (41/10, −19/6, −7) in the SM and (33/5, 1, −3) in the MSSM; two loops add −Σ_j b_ij α_j/8π² with the matrices of the plan, checked against Buttazzo et al. appendix B (SM) and Martin & Vaughn eq. (4.5) (MSSM). The Machacek–Vaughn paper itself is paywalled and was not read.
* Plan numbers reproduced: 59.020, 29.585, 8.475 at M_Z (with 127.951; 59.024, 29.587, 8.475 with the derived value) and 33.29, 49.46, 52.41 at the Planck mass.
* Omitted: Yukawa terms (an estimate: 5 to 10 percent of the two-loop term at M_Z), the top threshold (about 0.18 in α_em⁻¹), matching at M_SUSY. The MSSM is the SM below M_SUSY (default 1 TeV) and conjectural above it.
* The triangle of the three lines, in decades × α⁻¹: SM 5.47, MSSM 0.0090 at 1 TeV (a factor 611 smaller; one loop 7.26 and 0.072, a factor 100). The MSSM area falls to 0.0007 at 2 TeV, so how small it gets is a property of the omitted thresholds and Yukawa terms, and the captions say so.

## Formula Lens on a figure

A formula's terms light the marks of a Figure Kit figure. `createFigureLens` uses the same registry and ConceptBus events as the 3-D scenes (`formula-term`, `formula-clear`). Deviations from the 3-D lens, recorded in D-102:

* only `object` targets; the object name addresses a mark by `id` or every mark whose id starts with `name:` (`oneloop` lights `oneloop:a1…a3`); a `field` target is rejected;
* the lit marks are drawn at the focal 2.5 px and the others recede to 30 percent (`buildScene(spec, { lit })`), instead of an outline: the Figure Kit has no layer above its marks, and one focal element is the art direction's own rule;
* `spec` may be a function, so the lens follows a figure that is rebuilt (the SM/MSSM cross-fade adds marks).

In the lab: `ainv` lights the running line of the chosen coupling, `inputs` its Z-mass point with the error bar, `ln_mu_over_MZ` the selected-scale rule, `b_over_2pi` the dashed one-loop line.

## Rules the lab keeps

* Status label and a registered provenance entry on both figures; the caption carries the status its entry declares, so the MSSM view has entries of its own (`…-mssm`, conjectural).
* Colours are `cat-1…3`, `ink-*` and `accent`; lines 1.2 to 1.5 px, the focal one 2.5 px, bands 12 percent; no pigment.
* Reduced motion: the MSSM cross-fade (420 ms, `--dur-settle`) is replaced by the final state. The toggles carry `aria-pressed`; buttons and ranges are 44 px (`qa/specs/unification-lab.spec.mjs` measures them at 1280 and 390 px). KaTeX labels in the buttons and readouts carry `text-transform: none`.
* `js/mod-*.jsx` shrank by 2 lines; the lab is 191 lines.

## Tests

`test/gauge-running.test.mjs` (10), `test/figure-lens.test.mjs` (6), `test/unification-plots.test.mjs` (9), `test/formula-core.test.mjs` (+1), and `qa/specs/unification-lab.spec.mjs` (6, node renderer WebGL2). Captures `rg-unification` and `rg-unification-mobile`.

## Limits

* The bands are the propagated 1σ of three inputs; the real uncertainty of the unification test is dominated by thresholds, which are not modelled.
* The GUT region (10¹⁵ to 10¹⁷ GeV) and the plot domain (1.9 to 19.1, so the Z-mass inputs sit inside) are display conventions.
* The formula card evaluates the Standard-Model one-loop line from M_Z; in the MSSM view it stays valid up to M_SUSY.
