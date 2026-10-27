# Casimir cavity lab (S15)

Two plates, the standing modes between them, the pressure that results, and what experiments measured. The lab sits after the vacuum-fluctuations lab in the QFT view.

```text
js/science/casimir.mjs                       ideal-plate pressure and energy, the regularised 1+1D mode sum, standing modes, the reported bands
js/science/data/casimir.mjs                  Bressi et al. (2002) and Lamoreaux (1997): numbers, ranges, citations, retrieval date; Jaffe's caveat
js/formula/library/casimir.mjs               casimir-plates-pressure (Formula Core, GPU safe), terms a, hbar, c
js/visualizations/qft/casimir-geometry.mjs   pure geometry: drawn gap, plate positions, the mode and continuum segment arrays, TeX of the readouts
js/visualizations/qft/casimir-cavity.mjs     the Scene3D builder (engraved lines, node materials, Formula Lens binding)
js/figure/plots/casimir.mjs                  pressureSpec (log-log |P|(a) with the bands) and agreementSpec (the bands as a ratio to the line)
js/labs/casimir-lab.jsx                      controls, readouts, captions, formula card
js/labs/qft-compute-lab.jsx                  the vacuum-fluctuations lab, moved unchanged out of js/mod-qft.jsx
```

## Science

Ideal plates, perfect conductors, zero temperature: `P(a) = -pi^2 hbar c / (240 a^4)`, `E/A = -pi^2 hbar c / (720 a^3)`, with the CODATA 2018 `hbar` and `c` of `js/science/constants.mjs`. `P(1 um) = -1.3001e-3 Pa` and `P(100 nm) = -13.001 Pa` are tested; `K = pi^2 hbar c / 240 = 1.3001e-27 N m^2` matches the `1.3e-27` that Bressi et al. print for `pi h c / 480`.

**The mode sum.** A scalar field in one dimension between Dirichlet plates, `omega_n = n pi c / a`. The regulator is `f(omega / Lambda) = exp(-omega / Lambda)`.

```text
E_in(a, Lambda)  = sum_{n>=1} (1/2) hbar omega_n exp(-omega_n / Lambda)
E_out(a, Lambda) = hbar a Lambda^2 / (2 pi c)       the same regulated energy of free space over the same length a
```

Outside the plates nothing selects frequencies and the modes are so dense that their sum is an integral over the density of states `a / (pi c)` per unit angular frequency, which gives `E_out`. With `eps = pi c / (a Lambda)`, `sum n exp(-n eps) = 1/(4 sinh^2(eps/2)) = 1/eps^2 - 1/12 + eps^2/240 - ...`, so `E_in - E_out = -pi hbar c / (24 a) + pi hbar c eps^2 / (480 a) + ...`: the terms that grow as `Lambda^2 a` cancel and the difference tends to `-pi hbar c / 24a`, with a remainder `eps^2/20` of the limit. `modeSumDifference` adds the terms one by one (compensated, to `n eps = 45`); the test compares it with the closed form and checks three cutoffs.

| Cutoff `Lambda / omega_1` | `E_in - E_out` over `-pi hbar c / 24a`, minus 1 |
|---|---|
| 10 | `-5.00e-4` |
| 20 | `-1.25e-4` |
| 40 | `-3.12e-5` |

The limit is a one-dimensional scalar result and is not the pressure above; the lab says so.

## Data

| Source | Read from | Number committed |
|---|---|---|
| Bressi, Carugno, Onofrio, Ruoso, PRL 88, 041804 (2002), arXiv:quant-ph/0203002 | the arXiv v1 PDF (the published Letter was not read) | `K = (1.22 +- 0.18)e-27 N m^2` (its eq. 4), 15% precision, 0.5 to 3.0 um, their ideal `1.3e-27` |
| Lamoreaux, PRL 78, 5 (1997) | the Letter's PDF | "Agreement with theory at the level of 5%", 0.6 to 6 um, sphere and plate through the proximity force theorem `F = 2 pi R E` |
| Jaffe, PRD 72, 021301 (2005), arXiv:hep-th/0503158 | arxiv.org abstract page | the force can be computed without reference to zero-point energies (the caption caveat) |

DOIs were checked against Crossref (title, authors, journal, volume, year). No measured point is digitised: the American Physical Society grants permission to republish graphs case by case and "blanket permissions are not granted" (journals.aps.org/copyrightFAQ.html), and no permission was requested. The Bressi et al. fit does not follow the points systematically between 1 and 2 um (their text); the Lamoreaux band is drawn about the ideal line although he compared with theory that included corrections he put at no more than 3%.

## The scene

Static, drawn only when the log slider (10 nm to 10 um, `10^-8` to `10^-5` m) changes. The gap is drawn on a log map onto 2.2 to 7.0 scene units; the plates are boxes with the kit's engraved grid on both large faces; the eight lowest modes between them are engraved sinusoids that vanish at the plates with amplitude `1/sqrt(n)` (the zero-point amplitude goes as `1/sqrt(omega_n)`); outside, three lines per level at 30% opacity stand for the continuum. The in-scene label says SCHEMATIC. The Formula Lens binds `a` to an outline of the gap and `hbar`, `c` to a `P ~ hbar c` mark under the pressure readout.

## Tests

* `test/casimir.test.mjs` (10): the two plan pressures, `a^-4` scaling and `P = -d(E/A)/da`, `K_C`, the mode-sum convergence at three cutoffs and against the closed form, the term budget, the standing modes, the data and the bands.
* `test/casimir-geometry.test.mjs` (7): the drawn gap, the plates, nodes and amplitudes of the modes, the continuum, the TeX of the readouts.
* `test/figure-plots.test.mjs` (+2 cases), `test/formula-core.test.mjs` (the new formula is dimensionally consistent and GPU safe: float32 error `1.9e-7` in geometric units, `1.3e-7` in SI, tolerance `1e-4`).
* `qa/specs/casimir-lab.spec.mjs` (7, node renderer WebGL2): the plates at the drawn gap with the continuum at 30% and no untagged object; the slider from 10 nm to 10 um; the presets; the figures, chips and the Jaffe caveat; the mode sum; the three lens terms; 390 px and 44 px targets.
* Captures `qft-casimir-lab` and `qft-casimir-lab-mobile` (`docs/screenshots/36`, `37`).

## Limits

Ideal plates only: real metals, roughness and temperature change the force and are not modelled. The scene is one dimension and one polarisation standing in for the electromagnetic field. The bands are reported agreement levels, not data; on fourteen decades of pressure they are a pixel or two thick, so a second figure shows them as a ratio to the ideal line.
