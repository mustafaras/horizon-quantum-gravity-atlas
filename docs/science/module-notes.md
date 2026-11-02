# Scientific Module Notes

> Moved from the README in S35, with the Scientific Validity Matrix and the Academic Integrity Notes. Back to the
> [README](../../README.md) · [guide index](../guide/README.md).

## Scientific Validity Matrix

This matrix separates what the app visualizes from what physics currently justifies.

It is deliberately conservative: strong visuals are not allowed to upgrade the epistemic status of a claim.

| Module | Primary visual surface | Highest status used | Scientific guardrail |
|---|---|---|---|
| Standard Model | particle architecture and interaction map | Established physics | gravity is explicitly outside the Standard Model gauge group |
| Quantum Field Theory | field excitation and scattering laboratory | Established / Effective theory | diagrams are perturbative terms, not literal particle movies |
| Gauge Symmetry and RG Flow | local symmetry, running couplings, phase lines, and fixed points | Established / Effective / Schematic / Conjectural | one-loop QED/QCD, two-loop Standard-Model gauge couplings with the MSSM as a conjectural variant, the Einstein–Hilbert flow of asymptotic safety with its two schemes, numerical integration, and teaching toys are separately labeled |
| General Relativity | curvature, geodesics, lensing, gravitational waves | Established physics | rubber-sheet scenes are spatial slices, not full spacetime |
| Planck Frontier | scale ladder and Planck foam rendering | Schematic / Open problem | Planck-scale structure is not presented as observed |
| Theory Comparator | string theory, LQG, asymptotic safety, EFT, holography | Conjectural / Effective theory | no candidate program is ranked as experimentally confirmed |
| Black Holes | horizon, accretion, entropy, temperature, Page curve | Established / Effective / Open problem | raymarching is cinematic, while Hawking radiation remains unobserved |
| Experiment | collider events, gravitational waves, cosmological constraints | Established physics / Constraint | experiments constrain models; they do not detect quantum gravity directly |

## Module 01 — Standard Model

The Standard Model module maps known elementary particles.

It includes quarks, leptons, gauge bosons, and the Higgs boson.

It connects particle identity to charge, spin, generation, interaction channels, mass, and discovery context.

The core pedagogical transition is from a particle table to field representations.

The module makes clear that gravity is absent from the Standard Model gauge group.

It also flags neutrino mass, dark matter, matter-antimatter asymmetry, and the hierarchy problem as unresolved.

## Module 02 — Quantum Field Theory

The QFT module treats particles as localized excitations of fields.

It includes a classical φ⁴ field on a periodic lattice, evolved on the GPU by a symplectic leapfrog and drawn as a height field coloured by its energy density; a click kicks it with a seeded Gaussian and the four terms of its Hamiltonian density can be painted over it (see [docs/render/lattice-field.md](../render/lattice-field.md)).

It includes a Feynman collision builder.

It includes an amplitude room that converts a diagram into numbers: Mandelstam variables, angular distributions, and the Z⁰ resonance, all evaluated live from the pure physics functions.

It shows how a diagram is not a picture of a literal microscopic movie.

It is a term in a perturbative expansion.

The module links field amplitude, dispersion relation, propagator, amplitude, and cross-section.

## Module 03 — Gauge Symmetry and RG Flow

The gauge module explains local symmetry.

It shows why gauge fields are required when phase choices vary from point to point.

It introduces running couplings.

It shows how renormalization turns scale into a physical variable.

Its RG Flow Landscape integrates $dg/d\ln\mu=\beta(g)$ deterministically in both directions from a reference scale and displays the coupling trajectory beside the generating beta function.

The QED and QCD presets are one-loop perturbative results with explicit Landau-pole and infrared strong-coupling caveats. The Gaussian and linear fixed-point systems are pedagogical, and the polynomial preset is labelled a pedagogical toy: its ultraviolet fixed point is built into its coefficients.

The asymptotic-safety lab computes instead of illustrating. It integrates the beta functions of the dimensionless Newton coupling $g$ and cosmological constant $\lambda$ in the Einstein–Hilbert truncation, from Reuter & Saueressig (2012) with the optimised cutoff and from Litim (2004) in harmonic gauge, and finds $g_* = 0.7073$, $\lambda_* = 0.1932$ with $\theta = 1.475 \pm 3.043\,i$ in the first scheme and different exponents in the second. The flow is drawn as a line-integral convolution of its direction, with rings at the two fixed points, the separatrix between them, the singular line $\lambda = \tfrac12$, and the trajectory through a chosen start as the one focal line; the couplings along that trajectory are plotted against $\ln k$ and classified Type Ia, IIa or IIIa by their infrared fate. This is a truncation of an infinite tower, so its numbers move with the cutoff and the gauge — a conjectural framework, not evidence that gravity possesses such a fixed point.

Analytic fixed points, numerical roots, derivatives, stability labels, current substitutions, method/step/tolerance diagnostics, and validity termination are shown live.

It prepares the reader for the gravitational obstruction by contrasting marginal gauge couplings with Newton's dimensionful coupling.

## Module 04 — General Relativity

The GR module reframes gravity as geometry.

It first isolates the local flat-spacetime foundation in the Causal Spacetime Laboratory.

The Minkowski diagram classifies event pairs, displays past and future light cones, compares stationary and inertial observers, and transforms events and axes between frames.

Its interval, Lorentz, order, simultaneity, and proper-time calculations are exact for 1+1D inertial special relativity.

Its eased axes, event pulses, light-signal playback, and twin turnaround are explicitly schematic presentation layers.

It shows a deformable spatial slice.

It adds geodesic motion and light-bending rays.

It compares relativistic geometry with Newtonian intuition.

It includes Einstein's equations, the geodesic equation, and the Einstein-Hilbert action.

It also notes that classical GR predicts singularities.

The strong-field core behind the curvature engine — Schwarzschild null geodesics, the photon sphere and ISCO, the critical impact parameter, the effective potential with its $r^{-3}$ correction, and the lensed-sky render — is specified in **[docs/science/gr-null-geodesics.md](gr-null-geodesics.md)**.

## Module 05 — Planck Frontier

The Planck module identifies where the tension becomes unavoidable.

It explains background independence and the problem of time.

It explains perturbative non-renormalizability.

It shows the scale ladder from human dimensions to the Planck length.

Its foam-like visualization is explicitly labeled schematic.

The app does not claim spacetime is actually a foam lattice.

**The map of the unseen** turns the module's thesis into one image: where experiments have actually looked, and the void where quantum gravity lives. Eleven published limits and observed scales — the Eöt-Wash inverse-square test, the LHC's collision energy and a CMS large-extra-dimension bound, IceCube's neutrino absorption, XENONnT's WIMP limit, Fermi's linear-dispersion bound, GWTC-3's graviton mass, the Event Horizon Telescope's M87* radius, BICEP/Keck's tensor limit converted to an inflation energy, and the CMB sound horizon and Hubble radius — sit on a logarithmic length–energy plane with `E = ħc/L` as the diagonal. Each entry carries its value, confidence level, stated uncertainty, a model caveat and a link to its primary source, so the figure is a map of *different* questions rather than a joint exclusion. The dark Planck corner is labelled "no direct data": indirect limits reach that scale, no experiment starts there.

Beside the 3-D graph, the loop-quantum-gravity spectra are computed rather than drawn: the single-link area levels and the volume eigenvalues of a four-valent quantum tetrahedron, the latter by diagonalizing the Bianchi–Haggard squared-volume operator and reproducing their published Appendix C values. The chosen Immirzi parameter γ = 1 is a convention, not a measurement, and the whole section is labelled conjectural.

The module's length slider also drives a crosshair on the map through the shared concept bus, so the descent and the frontier stay in step.

## Module 06 — Theory Comparator

The theory comparator avoids declaring a winner.

It compares string theory, loop quantum gravity, effective field theory, asymptotic safety, and holography.

The 3D constellation is a mnemonic map.

The real comparison is conceptual:

- What are the fundamental objects?
- Is the framework background independent?
- How does spacetime emerge or persist?
- What does it say about black-hole entropy?
- What does it predict or fail to predict experimentally?

## Module 07 — Black Holes

The black-hole module is the theoretical laboratory of the atlas.

It joins GR, QFT, and thermodynamics.

It visualizes ray-bent accretion disk light.

It computes horizon radius, Kerr quantities, Hawking temperature, entropy, and evaporation scaling.

It includes the Page curve and a holographic boundary-bulk visualization.

It states clearly that Hawking radiation is not directly observed.

It states clearly that black-hole microstates remain incompletely understood in the generic case.

## Module 08 — Experiment

The experiment module shows the observational net.

It includes collider event displays.

It includes resonance reconstruction.

It includes gravitational-wave inspiral.

It includes a wider map of constraints.

It distinguishes confirmed strong-field GR from unconfirmed quantum-gravity signatures.

## Academic Integrity Notes

This documentation is intentionally explicit about limitations.

That is not a weakness.

It is a scientific requirement.

The most common failure mode in quantum-gravity outreach is to blend speculation with established result.

HORIZON avoids that by making the epistemic state part of the UI.

### What the App May Claim

- Quantum field theory is the established framework of the Standard Model.
- General relativity is the established classical theory of gravity.
- Low-energy quantum gravity can be treated as an effective field theory.
- Black-hole thermodynamics is a semiclassical theoretical landmark.
- Collider and gravitational-wave observations constrain theory space.

### What the App Must Not Claim

- It must not claim a complete quantum-gravity theory is confirmed.
- It must not claim Planck-scale discreteness is observed.
- It must not claim Hawking radiation from astrophysical black holes has been directly detected.
- It must not claim AdS/CFT is the proven description of our universe.
- It must not claim a schematic 3D visualization is a literal measurement.
