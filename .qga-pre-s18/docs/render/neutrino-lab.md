# Neutrino lab (S12)

Replaces the two-flavour vacuum toy with an exact three-flavour calculation in constant-density matter, with CP violation and both mass orderings, drawn as a flavour ribbon. Closes finding F-07.

```text
js/science/hermitian3.mjs         complex 3 x 3 Hermitian eigendecomposition and exp(-i H t)
js/science/neutrino.mjs           PMNS (PDG), Hamiltonian, matter potential, oscillationProbabilities, flavourCurves
js/science/data/nufit.mjs         NuFIT 6.0 best fits (two variants, both orderings) and the experiment presets
js/formula/library/neutrino.mjs   two-flavour limit and matter potential (Formula Core, FormulaCard formulaId)
js/figure/plots/neutrino.mjs      flavourRibbonSpec: stacked bands, focal channel, vacuum ghost
js/labs/neutrino-lab.jsx          controls, delta_CP dial, readouts, formula cards
```

## The calculation

`H = U diag(0, dm21, dm31) U^dagger / (2E) + diag(V, 0, 0)` with `V = sqrt(2) G_F N_e` and `N_e = rho Y_e / m_u`; for antineutrinos `U -> U*`, `V -> -V`. `P(a -> b) = |<b| exp(-i H L) |a>|^2`. The exponential comes from the analytic eigendecomposition: the trigonometric cubic gives the isolated eigenvalue and its eigenvector (a cross product of two rows), the other two come from the exact 2 x 2 problem in the orthogonal plane, which stays accurate when two eigenvalues coincide. The familiar 1.267 is `1 / (4 hbar c)` in eV^2, km and GeV, derived in code from the exact SI values of hbar, c and e.

Checks (`test/neutrino.test.mjs`): rows and columns sum to 1 within 1e-12 on a 300-point grid; agreement with a Taylor-series matrix exponential and with the closed vacuum formula; the two-flavour limit; CPT in vacuum; no CP asymmetry for delta = 0 or pi in vacuum; matter asymmetry with the ordering's sign; the 1-3 MSW resonance energy equals the argmax of P(mu -> e) in a constant-density scan.

## Data

NuFIT 6.0, Table 1 of Esteban et al., JHEP 12 (2024) 216 (arXiv:2410.05380v2), both variants (IC19 without and IC24 with Super-Kamiokande atmospheric data), best fit, 1 sigma and 3 sigma. The default is IC24 with SK-atmospheric data. `nu-fit.org` was unreachable from the build environment, so the numbers were read from the paper (two independent readings of its HTML agree) and that this is the latest NuFIT release is not confirmed (ledger D-063).

| preset | baseline | peak energy | density | source |
|---|---|---|---|---|
| T2K | 295 km | 0.6 GeV | 2.6 g/cm^3 | Phys. Rev. D 103, 112008 |
| NOvA | 810 km | 1.9 GeV | 2.84 g/cm^3 (CRUST2.0) | Phys. Rev. D 98, 032012 |
| DUNE | 1300 km | 2.5 GeV | 2.8482 g/cm^3 | DUNE TDR Vol. II, arXiv:2002.03005 |
| JUNO (anti-nu_e) | 52.5 km | 4 MeV | 3 g/cm^3 | J. Phys. G 43, 030401 |

Each number was found in the cited paper; where the plan quoted a different one, the source wins (ledger D-064).

## The figure

Three stacked bands (electron, muon, tau) in categorical tokens, the chosen channel's own probability as the focal line, the vacuum result at 30 % when matter is on, the experiment's design point as a rule. Status: established in vacuum, effective with matter (two provenance entries, `sm-neutrino-flavour-vacuum` and `sm-neutrino-flavour-matter`). The delta_CP dial is a keyboard slider: arrows 1 degree, Shift or Page keys 15 degrees, Home and End.
