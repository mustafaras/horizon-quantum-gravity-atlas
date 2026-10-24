# Higgs lab (S13)

Replaces the toy-unit Higgs slice with the physical potential, a TSL Mexican hat whose surface is the formula, and the running of the quartic coupling that makes the electroweak vacuum metastable. Closes finding F-08.

```text
js/science/data/pdg.mjs                 PDG 2026 inputs with value, uncertainty, unit and table; the unprinted alpha_em(M_Z) listed as omitted
js/science/higgs.mjs                    v = (sqrt2 G_F)^-1/2, lambda = m_H^2 / 2v^2, V(|H|), the reduced potential, mode curvatures
js/science/higgs-running.mjs            two-loop RGEs, matching at m_t, RK4 run, instability scale, vacuum decay, stability regions, 1 sigma band
js/formula/library/higgs.mjs            higgs-potential (V / lambda v^4) and higgs-quartic-tree (Formula Core, GPU safe)
js/visualizations/sm/hat-geometry.mjs   pure geometry: surface height, vacuum ring, mode arrows, easing
js/visualizations/sm/mexican-hat.mjs    the TSL scene (compileTSL positionNode, kit heat map and engraved grid)
js/figure/plots/higgs.mjs               couplingRunSpec (lambda(mu)) and stabilityDiagramSpec
js/labs/higgs-lab.jsx                   controls, readouts, formula cards, concept bridges
```

## The hat

`V / (lambda v^4) = x^4/4 - s x^2/2`, with `x = |phi|/v` and `s = mu^2/(lambda v^2)`, for `V = -mu^2 |H|^2 + lambda |H|^4` (`|H|^2 = (h^2 + chi^2)/2`). The Formula Core definition `higgs-potential` is compiled by `compileTSL` into the vertex `positionNode`; the heat map is the same node through the kit's field map (viridis), the grid is the kit's `lineCoverage`. `s` is the only uniform, so the toggle never recompiles. The vacuum circle is a 2.5 px engraved ring, the radial arrow follows the surface (curvature `m_H^2 = 2 lambda v^2`, tested by a second difference), the Goldstone arrow runs along the flat valley. The physical point `|phi| = v` is pinned in both phases; in the symmetric phase (`s = -1`) it sits on a slope. Reduced motion snaps; otherwise the surface eases for about a second and the scene is static again. The vertical scale is one display factor (`HAT_HEIGHT`).

Sign convention: the plan writes `V = -mu^2 |H|^2 + lambda |H|^4` and calls the symmetric phase `mu^2 > 0`; with that sign the symmetric phase is `mu^2 < 0` (ledger D-071). The older Higgs card of this module uses `+mu^2`; each card states its own convention.

## Inputs

PDG 2026 (Int. J. Mod. Phys. A 41, 2630011), summary tables and reviews read with `pdftotext`: `m_H = 125.13 +- 0.11` GeV, `m_t = 172.60 +- 0.27` GeV (direct measurements, used as the pole mass), `M_Z = 91.1879`, `M_W = 80.3625`, `G_F = 1.1663785(6)e-5` GeV^-2, `alpha_s(M_Z) = 0.1180(9)`, MS-bar `sin^2 theta_W = 0.23122(6)`. The plan quoted the 2024 edition (125.20, 1.1663788e-5); the source wins (D-069). `alpha_em^-1(M_Z)` is not printed in either edition and is not shipped.

## The running

Two-loop equations of Buttazzo et al., JHEP 12 (2013) 089, Appendix B (eq. 96-99, 101, bottom and tau Yukawas dropped), written for `t = ln mu` and integrated with `rk4Step` at a fixed step of at most 0.05 (777 steps from `m_t` to `M_Pl = sqrt(hbar c / G) = 1.2209e19` GeV).

Matching at `m_t`, leading order and stated: `lambda = m_H^2 / 2v^2`; `y_t = sqrt2 m_t / v (1 - 4 alpha_s(m_t) / 3 pi)`; `g2`, `g_Y` from `g_Z = 2 M_Z / v` and the MS-bar angle at `M_Z`, run to `m_t`; `alpha_s(m_t)` by one-loop QCD with five flavours.

| Check (`test/higgs.test.mjs`) | Reference | Result |
|---|---|---|
| pure-lambda flow, gauge-only flow | closed forms | 1e-9 |
| one-loop beta at a point | independent Python evaluation | 1e-12 |
| two-loop flow from the paper's couplings at M_t | the paper's eq. (61) at M_Pl: lambda -0.0143, y_t 0.3825, g1 0.6154, g2 0.5055, g3 0.4873 | -0.0151, 0.3831, 0.6153, 0.5054, 0.4873 (three-loop terms omitted) |
| instability scale with those inputs | literature 1e10 to 1e11 GeV | 4.9e9 GeV |
| y_t(m_t) with the leading QCD factor | the paper's NLO 0.95113 | within 0.4 percent |

For the measured masses lambda crosses zero at 8.0e8 GeV (two loops) and 3.7e7 GeV (one loop). The plan expected 1e9 to 1e12 GeV for one loop; neither truncation reaches it, and the cause is the matching, not the equations: at the paper's inputs its own thresholds (lambda 0.1260, y_t 0.9369 against 0.1292, 0.9498 here) move the zero from 3e8 to 5e9 GeV (D-070). The figures say so.

## Vacuum stability

`vacuumDecay` follows eq. (80)-(83): bounce action `8 pi^2 / 3|lambda|` at the minimum of lambda, `p0 = 0.15 (Lambda_B / H0)^4 exp(-S)` with `H0 = 67.4 km/s/Mpc` (Planck 2018). For the measured point lambda is smallest, -0.0228, at 4.5e17 GeV, `log10 p0 = -265`: metastable. `stabilityBoundaries` bisects the stable and decay-probability conditions in `m_t` at 21 values of `m_H`; at `m_H = 125.13` the lines sit near 169.2 and 176.3 GeV. They come from this lab's own truncation and carry its offset; the figure labels them so (computed, not digitised).

## Tests

* `test/higgs.test.mjs` (20), `test/mexican-hat.test.mjs` (7): the above, the potential, the mode curvatures, the geometry and easing; `test/figure-plots.test.mjs`: both figures; `test/formula-core.test.mjs`: the two new formulas.
* `qa/specs/higgs-lab.spec.mjs` (6, node renderer WebGL2): the hat's phase uniform, pinned point and ring follow the toggle and the canvas changes; figures and chips; sliders and reset; 390 px and 44 px targets.
* `qa/specs/formula-gpu.spec.mjs` compares the compiled TSL of `higgsPotentialReduced` (max relative error 1.7e-6) and `higgsQuarticTree` (0) with the float32 evaluation. On this machine its `twoFlavourOscillation` case also fails on a clean `main` (1.06e-3 against 2e-4), so that failure is not part of S13 (D-072).

## Limits

The extrapolation is the Standard Model alone over 17 decades; new physics below `M_Pl` changes the verdict. The decay rate is dominated by field values near 4e17 GeV, close to `M_Pl`, where Planck-suppressed operators can matter. The top mass is the direct-measurement average, ambiguous by about 0.2 GeV. The hat's vertical scale is not physical, and the symmetric phase is a what-if on the sign of `mu^2`, not the thermal restoration.
