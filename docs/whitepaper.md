# HORIZON: A Quantum Gravity Atlas

**An epistemically labeled, interactive atlas of the quantum-gravity problem**

*Companion whitepaper to the HORIZON — Quantum Gravity Atlas repository and live application.*

| | |
|---|---|
| **Artifact** | Interactive static web atlas (13 views, 8 physics modules) |
| **Access** | https://mustafaras.github.io/horizon-quantum-gravity-atlas/ |
| **Repository** | https://github.com/mustafaras/horizon-quantum-gravity-atlas |
| **License** | MIT |
| **Citation** | See `CITATION.cff` (CFF 1.2.0) |

---

## Abstract

Quantum gravity is not a single missing equation but a collision between two extraordinarily successful frameworks, and communicating that collision honestly is a persistent failure point of public physics media: speculation is routinely blended with established result. This whitepaper documents **HORIZON**, an interactive atlas that maps *why the problem of quantum gravity exists* — from the experimentally established core, through the formal machinery of quantum field theory and general relativity, to the point where the two frameworks conflict and the major research programs diverge. The atlas enforces a single central rule: *a visualization may be cinematic, but the epistemic status of the physics must remain explicit.* Every panel carries one of five machine-consistent status labels — **established physics**, **effective theory**, **schematic model**, **conjectural framework**, **open problem** — and every equation is treated as an interface object paired with symbol definitions, meaning, and limitations. We describe the atlas's epistemic framework, its chain of physical reasoning, its design methodology, its zero-build software architecture, and its verification infrastructure: literature-anchored unit tests (Mercury's perihelion advance, solar-limb light deflection, CODATA Planck units, black-hole evaporation timescales), a manifest-driven browser QA harness with per-capture justified visual tolerances, and deterministic offline fixtures for real-data network phases. The atlas does not claim that quantum gravity has been solved; it claims something more defensible — that the boundary between what is known, what is effective, and what is conjectured can itself be made a first-class object of interactive study.

---

## 1. Introduction

### 1.1 The pedagogical problem

The quantum-gravity problem is unusually badly served by popular science communication. Three failure modes recur:

1. **Blending.** Speculative frameworks are presented alongside established physics without epistemic distinction, so a reader cannot tell where experiment ends and conjecture begins.
2. **Equation avoidance.** The mathematics that makes the problem *quantitative* — the negative mass dimension of Newton's constant, the power-law growth of gravitational coupling — is replaced by metaphor, precisely where the metaphor is least trustworthy.
3. **False closure.** Research programs (string theory, loop quantum gravity, asymptotic safety, causal sets, holography) are presented as competing answers rather than as serious, unresolved research agendas.

HORIZON is built against all three. It is an *atlas* in the cartographic sense: it does not argue for a destination, it maps the terrain, marks the borders of the known, and labels the unexplored regions as unexplored.

### 1.2 What the atlas is

HORIZON is a static, zero-build web application of thirteen views: eight physics modules (Standard Model, quantum field theory, gauge symmetry and renormalization-group flow, general relativity, the Planck frontier, a theory comparator, black holes, and experiment), plus reference and laboratory surfaces — a Kerr observatory, a gravitational-wave theatre with a bounded real-data mode, a causal spacetime laboratory, an RG-flow landscape, and a Symbol Atlas of 27 symbols across 33 contexts. It runs from a plain local HTTP server with no backend and no build step, yet it presents itself as a research-grade instrument rather than a web demo.

### 1.3 Contributions

This whitepaper makes the atlas's design decisions explicit and auditable:

- an **epistemic labeling system** (Section 2) that classifies every claim into five statuses and is enforced consistently across UI, README, and tests;
- a **chain of reasoning** (Section 3) that leads from established physics to the open problem without a single unmotivated leap;
- a **design methodology** (Section 4) in which equations are interface objects and interactivity carries interpretation;
- a **zero-build architecture** (Section 5) chosen for archival stability and reproducibility;
- a **verification infrastructure** (Section 6) that anchors the implemented physics to literature values and pins the visual output with justified tolerances.

---

## 2. Epistemic Framework

### 2.1 The five status labels

Every major panel in the atlas carries exactly one of five labels, and the labels are ordered by evidential strength:

| Label | Meaning | Example in the atlas |
|---|---|---|
| **Established physics** | Experimentally confirmed or measurement-grade theory | QFT as the framework of the Standard Model; classical general relativity; the Higgs discovery; LIGO's gravitational waves; EHT's horizon-scale imaging |
| **Effective theory** | Valid in a stated domain, with known limits | Low-energy quantum gravity as an effective field theory; one-loop RG flow of QED and QCD |
| **Schematic model** | Deliberately simplified illustration, not a measurement | The collider event display; the Planck-foam scene |
| **Conjectural framework** | A serious research program, not an established description of nature | String theory; loop quantum gravity; asymptotic safety; causal sets; holography |
| **Open problem** | No confirmed answer exists | The information paradox; the completion of quantum gravity |

### 2.2 Honesty rules

The atlas states explicitly what it may and may not claim. It **may** claim that quantum field theory and general relativity are the established frameworks of their domains; that low-energy quantum gravity is a valid effective field theory; that black-hole thermodynamics is a semiclassical theoretical landmark; and that collider and gravitational-wave observations constrain theory space. It **must not** claim that a complete quantum-gravity theory is confirmed; that Planck-scale discreteness is observed; that Hawking radiation from astrophysical black holes has been directly detected; that AdS/CFT is the proven description of our universe; or that a schematic 3D visualization is a literal measurement.

These rules are not disclaimers appended after the fact; they are design inputs. The strongest visual panels carry the strongest caveats: the Planck foam is labeled speculative, the collider display schematic, the holography panel conjectural.

---

## 3. The Chain of Reasoning

The atlas leads a reader through a single continuous argument. Each step is either established physics or an explicitly labeled extrapolation.

### 3.1 Two successful frameworks

Quantum field theory describes fields on a spacetime *background*. General relativity says that background is itself *dynamical*. Both frameworks are extraordinarily successful in their domains — the tension is not philosophical decoration; it becomes quantitative the moment one tries to perturbatively quantize the Einstein–Hilbert action.

### 3.2 Why perturbation fails

In four spacetime dimensions Newton's constant carries negative mass dimension, $[G] = -2$. Consequently the effective dimensionless coupling grows with energy as a power law,

$$\alpha_G(E) \sim \frac{E^2}{E_P^2},$$

rather than logarithmically as in renormalizable gauge theories. At low energies quantum gravity is a perfectly valid effective field theory — the atlas implements this honestly. Near the Planck scale $E_P$ the perturbative expansion loses predictive power, and the atlas marks that boundary rather than papering over it.

### 3.3 Black holes as theoretical laboratories

Black holes sharpen the issue because they combine horizons, thermodynamics, quantum fields in curved spacetime, entropy–area scaling, and information flow in a single object. The Bekenstein–Hawking entropy,

$$S_{BH} = \frac{k_B c^3 A}{4 G \hbar},$$

and the Hawking temperature,

$$T_H = \frac{\hbar c^3}{8 \pi G M k_B},$$

are presented as semiclassical landmarks. Any credible quantum-gravity program must explain why black holes carry entropy proportional to horizon area and how unitary quantum evolution is reconciled with semiclassical evaporation. The atlas gives the information paradox its own decision-tree treatment and the modern entanglement-wedge literature its own conjectural panel.

### 3.4 Research programs, compared without a winner

The theory comparator module places string theory, loop quantum gravity, asymptotic safety, causal sets, and holography side by side — with their leading ideas, their achievements, and their open questions — and deliberately declares no winner, because none is experimentally confirmed.

### 3.5 Experimental anchors

The experiment module grounds the atlas in data: the Higgs boson (2012), the first direct gravitational-wave observation GW150914 (2016), and the EHT horizon-scale image of M87* (2019). The gravitational-wave theatre includes a bounded real-data mode that fetches from GWOSC with a full deterministic offline fixture for every network phase, so the data path itself is honest: success, HTTP error, abort, oversize, and cancel are all first-class, tested states.

---

## 4. Design Methodology

### 4.1 Equations are interface objects

Equations are not decorative glyphs. Each formula is paired with symbol definitions, meaning, and limitations; the interface treats a formula as a compact map of assumptions. The Symbol Atlas extends this to the notation layer itself: 27 symbols across 33 contexts, disambiguating reused letters ($\beta$ as $v/c$ versus $\beta(g)$ as an RG function; the metric $g_{\mu\nu}$ versus a coupling $g$ versus a fixed point $g^\star$), with every glyph and defining equation typeset live with KaTeX.

### 4.2 Interactivity carries interpretation

Sliders are not UI ornaments. A mass slider changes the black-hole radius, temperature, entropy, evaporation time, and Kerr geometry readouts together, so a single gesture moves a *family* of related quantities. A scale slider shows how many decades separate collider physics from the Planck length. A collision selector changes both a 3D scattering animation and the matching diagrammatic amplitude. The causal laboratory computes exact Lorentz transformations and invariant intervals from draggable, keyboard-accessible events. The RG-flow landscape integrates one-loop QED/QCD flows deterministically in both directions and marks the $b_0 = 0$ boundary at $n_f = 16.5$.

### 4.3 Aesthetic density must not hide epistemic boundaries

The atlas uses a dark scientific atmosphere, raymarched scenes, bloom, and instrument-like typography. The design rule is that aesthetic density is permitted only where the epistemic labeling survives it — cinematic visuals, never cinematic certainty.

### 4.4 Accessibility as a scientific requirement

Motion is fully bounded and every animated surface snaps under `prefers-reduced-motion`. Keyboard focus, arrow-key sliders, 44 px touch targets, and horizontal chart scrolling are tested, not aspirational. An atlas that claims to serve understanding must be usable by the people trying to understand it.

---

## 5. Software Architecture

### 5.1 Zero-build, static-first

The application is intentionally a folder of static files. It loads React, Babel, Three.js, and KaTeX from CDN URLs declared in `index.html`, runs from any plain HTTP server, and requires no backend and no build step. This is an archival decision: a reader in ten years should be able to serve the repository and see the same atlas, and a reviewer can audit the exact bytes that ship.

### 5.2 Module structure

Pure physics lives in `js/physics.mjs` as framework-free ES modules, mirrored into the browser through a bridge, so the same code paths are testable under `node --test` and exercised by the UI. Views are declarative components over a shared state layer; every laboratory view supports URL state, back/forward restoration, and a versioned export JSON schema.

### 5.3 Reproducible sharing

Every laboratory view encodes its full state in the URL (deep links with documented fallback), so an exact configuration — a Kerr geometry, an RG flow, a causal-lab arrangement — is a shareable, citable object.

---

## 6. Verification and Validation

### 6.1 Literature-anchored unit tests

The pure-physics suite (`test/physics.test.mjs`, run under `node --test`) anchors the implemented observables to literature values, including:

| Observable | Literature anchor |
|---|---|
| Mercury perihelion advance | $42.98''$ per century |
| Solar-limb light deflection | $1.75''$ |
| Planck units | CODATA values |
| Solar-mass evaporation timescale | $\sim 2.1 \times 10^{67}$ yr |
| Hawking spectrum Wien peak | $u \approx 2.8214$ |
| RG: one-loop QED UV growth, QCD asymptotic freedom, $b_0 = 0$ at $n_f = 16.5$ | Standard one-loop results |

The RG cases additionally cover analytic and numerical fixed points, the UV/IR stability convention, deterministic integration and reversal, invalid inputs, and graceful QED/QCD validity termination.

### 6.2 Manifest-driven browser QA

A persistent browser-QA harness (`qa/`, pinned Chromium, separate CI job) is driven by a machine-readable capture manifest validated against a JSON schema. It covers: clean mounting of all thirteen views with zero console/page errors; URL-state round-trips, reload persistence, back/forward navigation, copy-link, and the versioned export schema; observable differences between reduced and normal motion; keyboard focus, arrow-key sliders, mobile overflow, 44 px touch targets, and horizontal chart scrolling; conjectural labeling and preset reset; every GWOSC network phase through a deterministic offline fixture; and per-capture visual regression against committed baselines, each with its own justified pixel tolerance. A single live gwosc.org smoke test exists but runs only on explicit request, never in CI.

### 6.3 Repository-presentation guardrails

A validation suite (`npm run validate`) enforces the academic packaging itself: README image paths exist, screenshot and diagram counts are met, Open Graph and manifest metadata are present and point to real assets, PNGs have expected dimensions, and diagram SVGs are structurally complete. A schema-validated `CITATION.cff` (CFF 1.2.0, no unverified identifiers) is kept consistent with `package.json` and `LICENSE` by its own test suite.

---

## 7. Limitations and Epistemic Boundaries

The atlas is explicit about what it is not. It is not a claim that quantum gravity has been solved. It does not present Planck-scale discreteness as observed. It does not present Hawking radiation from astrophysical black holes as directly detected. It does not present AdS/CFT as the proven description of our universe. Its 3D scenes are labeled schematic where they are schematic. Its research-program comparison is a map of agendas, not a ranking of merits. Where the atlas visualizes beyond established physics, the visualization itself carries the conjectural label — the epistemic boundary is drawn inside the instrument, not in a footnote outside it.

---

## 8. Conclusion

HORIZON demonstrates that the boundary between established physics, effective theory, schematic modeling, and conjecture can be made a first-class object of interactive study. Its contribution is not a new physical result but a discipline: an atlas in which every claim is labeled, every equation is an interface object, every laboratory is reproducible from its URL, and every visual regression is pinned to a justified tolerance. The quantum-gravity problem is hard precisely because it sits at the edge of what is known; an honest atlas of that edge is the appropriate instrument for studying it.

---

## References

The atlas ships an in-app references list; the following are especially central to the chain of reasoning in Section 3.

1. A. Einstein, "Die Feldgleichungen der Gravitation," *Sitzungsberichte der Preussischen Akademie der Wissenschaften*, 1915.
2. P. A. M. Dirac, "The Quantum Theory of the Electron," *Proceedings of the Royal Society A*, 1928.
3. R. P. Feynman, "Space-Time Approach to Non-Relativistic Quantum Mechanics," *Reviews of Modern Physics*, 1948.
4. C. N. Yang and R. L. Mills, "Conservation of Isotopic Spin and Isotopic Gauge Invariance," *Physical Review*, 1954.
5. S. Weinberg, "A Model of Leptons," *Physical Review Letters*, 1967.
6. D. J. Gross and F. Wilczek, "Ultraviolet Behavior of Non-Abelian Gauge Theories," *Physical Review Letters*, 1973.
7. H. D. Politzer, "Reliable Perturbative Results for Strong Interactions?," *Physical Review Letters*, 1973.
8. J. D. Bekenstein, "Black Holes and Entropy," *Physical Review D*, 1973.
9. S. W. Hawking, "Particle Creation by Black Holes," *Communications in Mathematical Physics*, 1975.
10. G. 't Hooft and M. Veltman, "One-loop divergencies in the theory of gravitation," *Annales de l'Institut Henri Poincaré A*, 1974.
11. S. Weinberg, "Ultraviolet divergences in quantum theories of gravitation," in *General Relativity: An Einstein Centenary Survey*, 1979.
12. M. H. Goroff and A. Sagnotti, "The ultraviolet behavior of Einstein gravity," *Nuclear Physics B*, 1986.
13. A. Ashtekar, "New Variables for Classical and Quantum Gravity," *Physical Review Letters*, 1986.
14. G. 't Hooft, "Dimensional Reduction in Quantum Gravity," arXiv:gr-qc/9310026, 1993.
15. L. Susskind, "The World as a Hologram," *Journal of Mathematical Physics*, 1995.
16. A. Strominger and C. Vafa, "Microscopic Origin of the Bekenstein-Hawking Entropy," *Physics Letters B*, 1996.
17. J. Maldacena, "The Large N Limit of Superconformal Field Theories and Supergravity," *Advances in Theoretical and Mathematical Physics*, 1998.
18. J. F. Donoghue, "General relativity as an effective field theory: The leading quantum corrections," *Physical Review D*, 1994.
19. S. Ryu and T. Takayanagi, "Holographic Derivation of Entanglement Entropy from AdS/CFT," *Physical Review Letters*, 2006.
20. ATLAS and CMS Collaborations, Higgs boson discovery papers, *Physics Letters B*, 2012.
21. LIGO Scientific and Virgo Collaborations, "Observation of Gravitational Waves from a Binary Black Hole Merger," *Physical Review Letters*, 2016.
22. Event Horizon Telescope Collaboration, "First M87 Event Horizon Telescope Results," *Astrophysical Journal Letters*, 2019.
23. G. Penington, "Entanglement Wedge Reconstruction and the Information Paradox," *JHEP*, 2020.
24. A. Almheiri, N. Engelhardt, D. Marolf, and H. Maxfield, "The entropy of bulk quantum fields and the entanglement wedge of an evaporating black hole," *JHEP*, 2019.
25. M. E. Peskin and D. V. Schroeder, *An Introduction to Quantum Field Theory*, 1995.
26. S. Weinberg, *The Quantum Theory of Fields*, Vols. I–II, 1995–1996.
27. C. W. Misner, K. S. Thorne, and J. A. Wheeler, *Gravitation*, 1973.
28. R. M. Wald, *General Relativity*, 1984.
29. J. Polchinski, *String Theory*, Vols. I–II, 1998.
30. C. Rovelli, *Quantum Gravity*, 2004.
31. M. Gell-Mann and F. E. Low, "Quantum Electrodynamics at Small Distances," *Physical Review* 95, 1300–1312 (1954).
32. M. Reuter, "Nonperturbative Evolution Equation for Quantum Gravity," *Physical Review D* 57, 971–985 (1998).