# Electroweak scattering and Feynman diagrams (S16)

The amplitude room of the QFT view now evaluates `e+ e- -> mu+ mu-` through a photon and a Z boson, draws the channels of Bhabha, Møller and electron-muon scattering, and the Feynman builder above it draws vector diagrams after TikZ-Feynman.

```text
js/science/electroweak.mjs                   gamma + Z at tree level, A0 / A1, sigma, A_FB, zero crossing, peak; Bhabha, Moller, e mu; channel split
js/science/data/electroweak.mjs              LEP/SLD Z-pole values with their table numbers; the derived sigma_mumu^0
js/science/data/pdg.mjs                      + GammaZ = 2.4955 +- 0.0023 GeV (PDG 2026, Z width, OUR EVALUATION)
js/formula/library/electroweak.mjs           ew-vector-coupling and ew-pole-asymmetry (Formula Core, GPU safe)
js/figure/plots/electroweak.mjs              crossSectionSpec and asymmetrySpec (stacked, one plot rectangle), channelsSpec
js/visualizations/qft/feynman-svg.mjs        { vertices, edges } -> paths, arrows, dots, labels, momentum arrows, SVG string
js/visualizations/qft/feynman-diagrams.mjs   the s, t and u diagrams of the builder's processes and the Compton pair
js/labs/feynman-diagram.jsx                  FeynmanDiagram and FeynmanDiagramSet (SVG plus KaTeX label overlay)
js/labs/amplitude-room.jsx                   the five processes, the channel figure and the energy scan
```

## The model

With `g_V = T3 - 2 Q sin^2 theta_W`, `g_A = T3` and `chi(s) = s / (s - M_Z^2 + i M_Z Gamma_Z) / (4 sin^2 theta_W cos^2 theta_W)`:

```text
dsigma/dcos(theta) = (pi alpha^2 / 2s) [ A0 (1 + cos^2 theta) + A1 cos theta ]
A0 = Qe^2 Qf^2 + 2 Qe Qf Re chi gVe gVf + |chi|^2 (gVe^2 + gAe^2)(gVf^2 + gAf^2)
A1 = 4 Qe Qf Re chi gAe gAf + 8 |chi|^2 gVe gAe gVf gAf
sigma = (4 pi alpha^2 / 3s) A0        A_FB = 3 A1 / (8 A0)
```

The derivation in the header of `js/science/electroweak.mjs` goes through the four helicity amplitudes `A_ij = Qe Qf + chi (gVe -+ gAe)(gVf -+ gAf)`; the test file evaluates that sum independently and compares it with the closed form to 1e-12. At `sqrt(s) << M_Z` it gives `sigma = 4 pi alpha^2 / 3s = 86.8 nb / s[GeV^2]`.

| Input | Value | Source |
|---|---|---|
| `M_Z`, `sin^2 theta_W` | 91.1879 GeV, 0.23122 | PDG 2026 (`js/science/data/pdg.mjs`) |
| `Gamma_Z` | 2.4955 GeV | PDG 2026, Z listing (read 2026-10-26); LEP-SLC 2006 has 2.4952 |
| `1/alpha(M_Z^2)` | 128.945 | Phys. Rep. 427, section 1 (REF.LEP_SLC_2006) |
| `alpha(0)` | 1/137.035999084 | CODATA 2018, for the QED processes |

Not modelled: initial-state radiation, loops, the running of alpha below the Z (it makes the 10 GeV cross-section about 13 percent higher than with `alpha(0)`), a running width. The pole asymmetry `(3/4) A_e A_mu` is 0.01674 at this angle and the model's `A_FB` on the pole, with the photon term, is 0.01664, against the LEP value 0.0169 +- 0.0013; the peak is 1.981 nb against the derived LEP pole value 1.9986 +- 0.0034 nb (0.9 percent low).

## Data

All numbers are printed in ALEPH, DELPHI, L3, OPAL, SLD and the LEP EWWG, Phys. Rep. 427, 257 (2006), doi:10.1016/j.physrep.2005.12.006, arXiv:hep-ex/0509008, read from the arXiv PDF with pdftotext on 2026-10-26. Nothing was digitised from a figure.

| Quantity | Value | Table |
|---|---|---|
| `A_FB^{0,mu}` | 0.0169 +- 0.0013 | 2.13, without lepton universality |
| `sigma_had^0` | 41.541 +- 0.037 nb | 2.13, without lepton universality |
| `R_mu^0` | 20.785 +- 0.033 | 2.13, without lepton universality |
| correlation of `sigma_had^0` and `R_mu^0` | 0.131 | 2.13 |
| `Gamma_mumu` | 83.99 +- 0.18 MeV | 7.1 |
| `m_Z`, `Gamma_Z` | 91.1875 +- 0.0021 GeV, 2.4952 +- 0.0023 GeV | 2.13 (with lepton universality) |

The figure's cross-section point is **derived**: `sigma_mumu^0 = sigma_had^0 / R_mu^0 = 1.9986 +- 0.0034 nb`, because `sigma_ff^0 = 12 pi Gamma_ee Gamma_ff / (M_Z^2 Gamma_Z^2)` and `R_mu^0 = Gamma_had / Gamma_mumu`; the error uses the printed correlation. The asymmetry point is printed. Both are Z-pole pseudo-observables (deconvoluted for radiation, photon term removed) and are placed at `sqrt(s) = m_Z` only.

## Bhabha, Møller, electron-muon

Massless, spin averaged: `<|M|^2> = 2 e^4 [ (s^2+u^2)/t^2 + 2u^2/(st) + (t^2+u^2)/s^2 ]` (Bhabha), `2 e^4 [ (s^2+u^2)/t^2 + 2s^2/(tu) + (s^2+t^2)/u^2 ]` (Møller), `2 e^4 (s^2+u^2)/t^2` (e mu), `dsigma/dOmega = <|M|^2> / (64 pi^2 s)`. The plan's angular form of Bhabha equals this one (tested to 1e-12), the forward limit is the Rutherford pole `alpha^2 / (s sin^4(theta/2))`, Møller equals `alpha^2 (3 + cos^2 theta)^2 / (s sin^4 theta)` and is symmetric under `theta -> pi - theta`. These were derived from helicity amplitudes here, not copied from a printed source (ledger D-092).

## Diagrams

`layoutDiagram` returns paths, arrows, dots, labels and momentum arrows for `{ vertices, edges }`. Fermion arrows sit at `t = 0.5` of the segment (reversed for an antifermion); a photon is a sine of an integer number of half-periods, so it starts and ends on its vertices; a gluon is a trochoid whose loop count is proportional to its length; a scalar is dashed; internal vertices are dots of 3 px; labels are KaTeX spans over the SVG; momentum arrows are offset parallel to the edge. Colours are tokens read in `js/labs/feynman-diagram.jsx`; the module has none. The builder draws every tree diagram of the process: s and t for Bhabha, t and u for Møller, s and u for Compton. The old streaming animation of the lines and the travelling dot were removed with `FeynmanSVG`; the 3-D collision above still moves.

## Figures and the shared axis

`crossSectionSpec` (log y) and `asymmetrySpec` are two Figure Kit figures with the same x range, the same ticks and `minLeft = 64`, a new optional spec field that fixes the least left margin so both plot rectangles coincide (`test/figure-layout.test.mjs`). The focal mark of each is the gamma + Z model line; the Z pole is a rule, the LEP points are on the data layer, the interference zero crossing is a marked point with a callout. `channelsSpec` draws the terms of the selected process as thin lines and their sum as the focal line.

## Checks

`npm test` (test/electroweak.test.mjs, feynman-svg.test.mjs, figure-plots, figure-layout, formula-core), `qa/specs/electroweak-lab.spec.mjs`, captures `qft-electroweak`, `qft-electroweak-mobile`, `qft-feynman-diagram`, `qft-feynman-diagram-mobile` and the refreshed `qft-amplitude-room` pair.
