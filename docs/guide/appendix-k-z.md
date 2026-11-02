# Extended Academic Appendix — K to Z

> Moved from the README in S35. Appendices A to J are in [appendix-a-j.md](appendix-a-j.md). Several appendices
> below describe the long-form README they were written for; they are kept as written, and the README now links here.
> Back to the [README](../../README.md) · [guide index](README.md).

## Appendix K — Formula Card Design Specification

Each formula card should answer five questions.

1. What is the equation?

2. What are the symbols?

3. What does it mean physically?

4. What domain is it valid in?

5. What misconception could it create?

Example:

```text
Formula: S_BH = k_B A / 4 l_P^2
Meaning: entropy scales with horizon area, not volume
Domain: semiclassical black-hole thermodynamics
Risk: may be mistaken as a fully understood microscopic count for generic black holes
Status: established semiclassical formula, unresolved microstate interpretation
```

## Appendix L — Visual Scene Audit

| Scene | Visual strength | Scientific risk | README treatment |
|---|---|---|---|
| black-hole raymarch | very high | mistaken for exact GRMHD or observation | label as schematic/cinematic |
| holography boundary-bulk | high | mistaken for literal universe projection | label as conjectural |
| Planck foam | high | mistaken for established discreteness | label as schematic/speculative |
| QFT collision | high | mistaken for literal virtual-particle trajectory | explain diagrams as perturbative terms |
| curvature grid | high | rubber-sheet misconception | explicitly distinguish spatial slice from full spacetime curvature |
| collider event | high | mistaken for real detector reconstruction | label as stylized |
| gravitational wave sheet | high | mistaken for quantum-gravity signal | frame as GR-confirming observation |
| theory constellation | medium-high | mistaken for ranking | state no winner implied |

## Appendix M — Static Diagram Rendering Notes

Markdown-native diagram blocks can depend on GitHub's rich-display asset pipeline.

This repository uses committed SVG diagrams instead.

The README uses static SVG diagrams for:

- architecture flow;
- state transitions;
- status taxonomy;
- black-hole information flow;
- renderer pipeline;
- theory comparison;
- screenshot reproducibility.

The diagrams are intentionally not too dense and are stored under `docs/diagrams/`.

They should support scanning.

They should not replace the mathematical text.

They should not imply causal certainty where the subject is conjectural.

## Appendix N — App State Notes

The app stores the active view in:

```text
localStorage["qga-view"]
```

The tweak state is also persisted in local storage.

The shareable state grammar is implemented in `js/state.jsx` and `js/state-runtime.jsx`. The URL query string carries the active view, the learning pathway, the black-hole mass and spin, the gravitational-wave controls, the QFT amplitude-room controls, and the seed. Any key equal to its default is omitted, so a default state produces a clean URL.

| Parameter | Example | Purpose |
|---|---|---|
| `view` | `bh` | select module |
| `pathway` | `advanced` | choose explanation depth |
| `motion` | `full` | animation intensity |
| `detail` | `ultra` | 3D complexity |
| `labels` | `1` | show labels |
| `annotations` | `1` | show annotations |
| `accent` | `ffb454` | theme accent |
| `shot` | `black-hole` | optional capture preset |
| `seed` | `12345` | reproducible generated data |
| `bhm` / `bha` | `10` / `0.9` | black-hole mass and spin |
| `gwm1` / `gwm2` | `30` / `30` | gravitational-wave component masses |
| `qfp` | `compton` | QFT process |
| `qfs` | `91` | QFT centre-of-mass energy in GeV |
| `qfa` | `0.6` | QFT scattering cosine |
| `qfx` | `0.5` | Compton lab-frame photon ratio |

Numeric parameters are clamped to their documented ranges on read, and enum parameters fall back to their default when the value is not recognised. Module and pathway changes push a history entry; parameter tweaks replace the current entry, so sliders do not flood the back stack.

## Appendix O — Suggested GitHub Repository Metadata

Recommended description:

```text
An interactive scientific atlas of quantum gravity: live WebGL simulations, black-hole thermodynamics, QFT scattering, spacetime curvature, Planck-scale obstructions, and experimental constraints.
```

Recommended topics:

```text
quantum-gravity
general-relativity
quantum-field-theory
black-holes
holography
standard-model
threejs
webgl
physics-education
scientific-visualization
```

Recommended social preview:

```text
docs/screenshots/01-black-hole-kerr-raymarch.png
```

## Appendix P — Scientific Limitations Registry

| Limitation | Why it matters | Where the app mitigates it |
|---|---|---|
| no direct Planck-scale data | prevents confirmation of candidate theories | Planck module caveats |
| Hawking radiation unobserved | black-hole thermodynamics remains indirect | black-hole captions |
| Page curve is a unitarity expectation, not a measurement | no evaporating hole has been observed, so the turn-over rests on the assumption that evaporation is unitary | the Page curve is drawn as the minimum of two derived branches and its status chip says effective theory; the island derivation is cited |
| Page's beta assumes a species content | beta = 1.4847 counts the Standard-Model fields plus the graviton; a different light spectrum moves the Page time | the coefficient and its assumption are stated in the figure and the ledger rather than presented as universal |
| EHT ring is calibrated to the shadow | the measured diameter is not the theoretical critical curve, so the agreement is a ~10 % statement | the comparison figure draws the measured band beside the predicted point and states the calibration |
| the photon sub-rings are predicted, not observed | no telescope resolves them yet; quoting e^{-gamma} as a measurement would be false | the sub-ring readout is labelled as a prediction from the Lyapunov exponent |
| the Fermi bound is model-dependent | the E_QG limit comes from a burst's emission model, not a measured transition | the panel names the model dependence and plots the curve the bound excludes |
| the tensor bound is a limit, not a detection | r is not measured; the band is the 95 % CL upper limit that excludes phi^2 | the band is drawn as an exclusion and the caption says so |
| the Eöt-Wash result is one point | the paper publishes a single alpha = 1 exclusion, not an alpha-lambda contour | only that point is drawn; an invented smooth envelope was removed |
| the matched filter is a simplified search | no chi-squared veto, no multi-detector coincidence and no false-alarm rate, so its peak SNR is not the LVK detection statistic | the panel says so in canvas; the CMS spectrum beside it is real data and labelled as observation |
| the bundled GWOSC fixture is synthetic | a recovery on it demonstrates the method, not an observation | the fixture's own README and the app's captions say so; the CMS panel is the real measurement |
| the CMS histogram is one CSV shard | one file of the record, uncorrected for acceptance or efficiency | the provenance entry states the shard and that event counts are not branching fractions |
| the inspiral is an expansion truncated at the ISCO | post-Newtonian terms stop being reliable in the last orbits, so the merger is fitted rather than computed | the caption separates the TaylorT4 phase from the NR-calibrated remnant and ringdown |
| the waveform is a non-spinning template | aligned spin changes the ringdown frequency by tens of per cent; eccentricity shifts it further | the module states that spinning and eccentric systems need terms it does not carry |
| greybody factors computed for a scalar only | photons and gravitons have different Regge-Wheeler potentials, so the plotted spectrum is not the full Standard-Model emission | the caption states the scalar restriction; the two cross-section limits are used as the check |
| visual grids can mislead | spacetime curvature is not a rubber sheet | GR caption |
| causal diagram is flat and 1+1D | it cannot represent curvature, gravity, expansion, or geodesic deviation | causal-laboratory validity panel and export metadata |
| twin path omits acceleration history | an instantaneous turnaround is not a complete physical twin-paradox trajectory | twin preset labels the path piecewise inertial and schematic |
| diagrams can mislead | virtual particles are not observed trajectories | QFT caption |
| holography is background-specific | AdS/CFT is not automatically our universe | holography caption |
| collider energies far below Planck scale | null results are indirect | experiment module |
| no unique theory ranking | programs solve different subproblems | theory comparator |
| one-loop RG omits thresholds and higher orders | perturbative coefficients and active fields depend on scale and scheme | QED/QCD presets name their convention and terminate at $\alpha=1$; the unification lab runs the Standard-Model couplings at two loops, and states that Yukawa terms, the top threshold and the matching at $M_{\mathrm{SUSY}}$ are omitted |
| gauge-coupling near-unification is a coincidence of coefficients | the MSSM triangle shrinks by orders of magnitude, but its size depends on the omitted thresholds and Yukawa terms and on $M_{\mathrm{SUSY}}$, and no superpartner has been seen | the MSSM lines and captions are labeled conjectural and the bands are stated to hold only the three input uncertainties |
| QED Landau pole is only a formal extrapolation | a one-loop singularity far beyond the controlled domain is not an observation | the pole is labeled as a warning; the numerical curve stops earlier |
| QCD becomes strongly coupled in the infrared | perturbative running cannot describe confinement | the trajectory terminates visibly at $\alpha_s=1$ without claiming a physical divergence |
| fixed-point toys are not empirical flows | chosen polynomial beta functions can build in the desired stability | the polynomial preset is labelled a pedagogical toy and the asymptotic-safety lab computes its fixed point from the published beta functions instead |
| an asymptotic-safety fixed point is a truncation result | the numbers move with the cutoff scheme and the gauge, and the full tower is not solved | the lab prints both schemes side by side, labels the picture conjectural in-canvas and in the registry, and states the truncation and the scheme in the caption |
| pure-physics coverage is complete for every exported helper | scene integrators and renderers stay outside unit tests by design | `test/physics.test.mjs` covers all shared helpers, including the Stage 5 GR, Planck, and black-hole thermodynamics additions |

## Appendix Q — Academic README Rubric

This README follows the style pattern visible in the author's other GitHub repositories.

It includes:

- centered hero visual;
- dense shields.io badge cluster;
- long-form scientific thesis;
- visual atlas;
- static SVG architecture;
- static SVG state and flow diagrams;
- mathematical formulation section;
- status taxonomy;
- module matrix;
- screenshot reproduction guide;
- technical architecture;
- limitation registry;
- references;
- citation block.

It avoids:

- vague marketing claims;
- unlabeled speculation;
- stock images;
- unsupported "breakthrough" wording;
- pretending a static visualization is a validated simulation engine.

## Appendix R — Suggested Reviewer Reading Paths

For a fast visual review:

1. Start with the hero black-hole image.

2. Scan the Visual Atlas.

3. Read the Module Matrix.

4. Check the Run Locally section.

For a scientific review:

1. Read Scientific Position.

2. Read Mathematical Formulations.

3. Read Scientific Status System.

4. Read Academic Integrity Notes.

5. Read References.

For an engineering review:

1. Read Architecture Preview.

2. Read Technical Architecture.

3. Read Screenshot Reproduction Guide.

4. Read Development Notes.

5. Read Roadmap.

For a portfolio review:

1. Start with badges.

2. Inspect black-hole, QFT, GR, and gravitational-wave screenshots.

3. Read Design Principles.

4. Read Feature Inventory.

5. Read Deployment.

## Appendix S — Extended Glossary

**Background independence**

A theory is background independent when spacetime geometry is not fixed in advance but is part of the dynamical system.

**Beta function**

A function describing how a coupling changes with energy scale.

**Black-hole entropy**

Entropy proportional to horizon area, suggesting that gravitational systems store information differently from ordinary volume-based systems.

**Causal structure**

The ordering of events by possible lightlike or timelike connections.

**Covariant derivative**

A derivative modified by connection fields so that local symmetry transformations remain meaningful.

**Effective field theory**

A theory valid below a cutoff scale, organized by all symmetry-allowed operators ordered by relevance.

**Event horizon**

A causal boundary beyond which future-directed paths cannot escape to infinity.

**Geodesic**

The straightest possible path in curved geometry.

**Holographic principle**

The idea that the degrees of freedom in a gravitational region may scale with boundary area rather than volume.

**Kerr black hole**

A rotating black-hole solution characterized by mass and angular momentum.

**Mandelstam variables**

Lorentz-invariant combinations of scattering momenta used in $2\to2$ processes.

**Metric tensor**

The field that defines distances, times, angles, and causal structure in general relativity.

**Page curve**

The expected time profile of radiation entropy if black-hole evaporation is unitary.

**Planck scale**

The scale built from $\hbar$, $G$, and $c$ where quantum and gravitational effects are both expected to be strong.

**Propagator**

A Green's function encoding how field excitations contribute between interaction points in perturbation theory.

**Renormalization**

The systematic organization of scale dependence and ultraviolet sensitivity in quantum field theory.

**Spin network**

A graph-like quantum state of geometry used in loop quantum gravity.

**String worldsheet**

The two-dimensional surface traced by a string moving through spacetime.

**UV completion**

A theory that remains well-defined at arbitrarily high energies or explains what replaces the low-energy theory.

## Appendix T — Final Scientific Guardrail

The most important sentence in the repository is not a formula.

It is this:

> No complete theory of quantum gravity has been experimentally confirmed.

The rest of the atlas is built around that sentence.

The screenshots can be beautiful.

The equations can be dense.

The diagrams can be elaborate.

But the boundary between knowledge and conjecture must remain visible.

---

## Appendix U — Release Audit Manifest

This README revision was prepared as a presentation-grade repository front page.

The following audit manifest records what the document is expected to contain.

| Requirement | Status | Evidence |
|---|---|---|
| professional academic English | applied | long-form scientific sections |
| visual-first screenshot set | applied | Visual Atlas |
| black-hole screenshots | applied | hero image and Visual Atlas rows |
| shields.io badges | applied | centered badge cluster |
| static SVG diagrams | applied | architecture, state, status, theory, renderer, information-flow diagrams |
| mathematical formulation | applied | Standard Model, QFT, GR, Planck, black-hole equations |
| epistemic caveats | applied | Scientific Position and Academic Integrity Notes |
| local run instructions | applied | Run Locally |
| static deployment notes | applied | Deployment |
| social preview metadata | applied | Social Preview and Install Metadata |
| install icon manifest | applied | `manifest.webmanifest` and `docs/icons/` |
| automated repository quality gate | applied | `.github/workflows/quality.yml` |
| scientific validity matrix | applied | Scientific Validity Matrix |
| reference layer | applied | References |
| citation block | applied | Citation |
| screenshot reproducibility | applied | Screenshot Reproduction Guide |

## Appendix V — Screenshot Manifest

The README now uses the following image contract. The machine-readable form of this contract — with exact URL state, viewport, readiness probes, scope, fixture, and tolerance per capture — is `qa/manifest.json`, kept consistent with this README by `npm run qa:verify`.

Each screenshot has a scientific function.

Each screenshot also has a caveat.

| Screenshot | Function | Caveat |
|---|---|---|
| `01-black-hole-kerr-raymarch.png` | establishes visual identity and black-hole thermodynamics | cinematic approximation, not observational image |
| `02-holographic-boundary-bulk.png` | introduces boundary-bulk intuition | conceptual and conjectural |
| `03-qft-feynman-collision.png` | connects scattering, amplitudes, and diagrams | diagram is perturbative bookkeeping |
| `04-planck-scale-foam.png` | makes the scale desert visible | Planck foam is speculative |
| `05-spacetime-curvature-lensing.png` | visualizes geodesics and lensing | grid is spatial-slice pedagogy |
| `06-collider-event-display.png` | shows indirect experimental constraints | stylized detector event |
| `07-gravitational-wave-inspiral.png` | shows strong-field GR observation | not a quantum-gravity detection |
| `08-theory-constellation.png` | compares research programs | no winner implied |
| `09-mobile-black-hole-lab.png` | documents responsive visual layout | mobile crop is documentation, not hero art |
| `14-qft-amplitude-room.png` | shows the Feynman rules evaluated as live numbers | scattering plane and waterfall are schematic; the cross-section and asymmetry are tree level (no radiation or loops) |
| `15-qft-amplitude-room-mobile.png` | documents the responsive amplitude-room layout | mobile crop is documentation, not hero art |
| `16-causal-spacetime-lab.png` | demonstrates invariant and Lorentz readouts tied to the Minkowski diagram | exact only for flat 1+1D inertial special relativity |
| `17-causal-spacetime-lab-mobile.png` | documents 44 px controls and contained diagram scrolling | mobile viewport shows only part of the horizontally scrollable diagram |
| `18-rg-flow-landscape.png` | demonstrates one-loop QCD running, β geometry, and bounded integration | infrared continuation stops at the chosen perturbative boundary |
| `19-rg-flow-landscape-mobile.png` | documents responsive controls and the conjectural fixed-point toy | the displayed UV fixed point is built into an illustrative polynomial |
| `25-ads-bulk-boundary-lab.png` | computes hyperbolic geodesics, the RT minimal surface and the entanglement wedge from the tested geometry module | the AdS/CFT duality reading is conjectural and labeled in-canvas |
| `26-collider-event-lab.png` | shows seeded synthetic collision kinematics with exact four-momentum conservation | synthetic fixture, never a CERN observation; labeled in-canvas |
| `27-spin-foam-lab.png` | shows the spin-network area spectrum and a four-simplex foam step, with the computed area and volume levels alongside | pedagogical sketch with no amplitudes computed; conjectural, labeled in-canvas |
| `28-qft-field-lab.png` | shows the φ⁴ lattice field with its energy-density colours, readouts and the Hamiltonian-density card | classical lattice field, equal to its float64 CPU reference to 3e-7 after 200 steps; reduced motion and software rasterizers park it at its initial state |
| `51-planck-constraint-plane.png` | shows eleven published limits and observed scales, each linked to its primary source, on the length–energy plane | the axes are independent quantities joined by `E = ħc/L`; the Fermi, graviton-mass and inflation entries are model-dependent, and the hatched corner means no direct Planck-energy experiment |

## Appendix W — Badge Manifest

Badges are used as quick scientific and technical affordances.

They are not substitutes for the README body.

The badge block communicates:

- static runtime;
- GitHub Actions repository quality status;
- Three.js and Canvas rendering;
- status-labeled claims;
- MIT licensing;
- eight-module scientific structure;
- black-hole emphasis;
- holography emphasis;
- experiment emphasis;
- zero-bundler deployment.

## Appendix X — README Maintenance Protocol

When a scientific module changes, update the module matrix.

When a visual changes, regenerate the screenshot manifest.

When a formula changes, update both the formula section and the symbol table.

When a claim becomes outdated, update the status label first.

When a new research program is added, add it to the theory comparator and the static theory map.

When an experimental claim is added, specify the measurement channel.

When a conjectural visualization is added, label it before merging.

When a screenshot is replaced, verify it comes from the running app.

When a deployment target changes, update the Deployment section.

When the app gains URL state, update the Screenshot Reproduction Guide.

## Appendix Y — Minimal Reviewer Checklist

- [ ] The hero image renders on GitHub.

- [ ] Every screenshot path resolves.

- [ ] static SVG diagrams render without syntax errors.

- [ ] Badges do not imply CI/test status that the repository does not actually have.

- [ ] The README does not claim quantum gravity is experimentally confirmed.

- [ ] Hawking radiation is described as theoretical, not directly observed.

- [ ] The Planck-scale visualization is called speculative.

- [ ] The collider section is framed as indirect constraint evidence.

- [ ] The black-hole module is presented as a theoretical laboratory.

- [ ] The local run command matches `package.json`.

- [ ] The license section points to the repository license.

- [ ] References are relevant to the scientific claims.

## Appendix Z — Closing Research Statement

HORIZON should read as a scientific atlas, not a landing page.

Its strongest claim is not that it solves quantum gravity.

Its strongest claim is that it makes the structure of the problem navigable.

It shows the road from experimentally tested physics to open theoretical territory.

It uses black holes as the most compact arena where that road becomes visible.

It uses equations to keep the visuals honest.

It uses status labels to keep the reader oriented.

It uses static SVG diagrams to expose the architecture of the explanation.

It uses screenshots from the running application to prove the experience exists.

The result is a repository front page that can serve as portfolio artifact, teaching document, technical overview, and scientific orientation map at once.
