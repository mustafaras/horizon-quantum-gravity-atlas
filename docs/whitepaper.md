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

The application is intentionally a folder of static files. It loads React, Babel, Three.js, KaTeX, and its web fonts from self-hosted copies under `vendor/`, runs from any plain HTTP server, and requires no backend and no build step. This is an archival decision: a reader in ten years should be able to serve the repository and see the same atlas, with no third-party host in the request path, and a reviewer can audit the exact bytes that ship.

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

A validation suite (`npm run validate`) enforces the academic packaging itself: every relative link and image in the README, `docs/` and `paper/` resolves to a file, the README shows every chapter cover, every committed diagram is referenced, the generated parts of this paper are current, Open Graph and manifest metadata are present and point to real assets, PNGs have expected dimensions, diagram SVGs are structurally complete, and every asset the entry document and the vendored stylesheets reference resolves to a real local file with no third-party host in the request path. A schema-validated `CITATION.cff` (CFF 1.2.0, no unverified identifiers) is kept consistent with `package.json` and `LICENSE` by its own test suite.

---

## 7. Limitations and Epistemic Boundaries

The atlas is explicit about what it is not. It is not a claim that quantum gravity has been solved. It does not present Planck-scale discreteness as observed. It does not present Hawking radiation from astrophysical black holes as directly detected. It does not present AdS/CFT as the proven description of our universe. Its 3D scenes are labeled schematic where they are schematic. Its research-program comparison is a map of agendas, not a ranking of merits. Where the atlas visualizes beyond established physics, the visualization itself carries the conjectural label — the epistemic boundary is drawn inside the instrument, not in a footnote outside it.

---

## 8. Conclusion

HORIZON demonstrates that the boundary between established physics, effective theory, schematic modeling, and conjecture can be made a first-class object of interactive study. Its contribution is not a new physical result but a discipline: an atlas in which every claim is labeled, every equation is an interface object, every laboratory is reproducible from its URL, and every visual regression is pinned to a justified tolerance. The quantum-gravity problem is hard precisely because it sits at the edge of what is known; an honest atlas of that edge is the appropriate instrument for studying it.

---

<!-- whitepaper-v2:begin (generated by scripts/build-whitepaper.mjs; do not edit) -->

## 9. Version 2: shared infrastructure and verification record

The second version of the atlas rebuilt the layers every chapter stands on. This section describes them and lists, verbatim from the project ledger, every measurement the work was accepted on.

### 9.1 Formula Core

Each equation the atlas displays or evaluates is defined once, as an expression tree in `js/formula/`. Three compilers emit from that one definition: JavaScript for the science modules (`to-js.mjs`), KaTeX for the page (`to-tex.mjs`) and TSL for the GPU (`to-tsl.mjs`). The library holds 77 definitions, each with units and dimensions that `npm run validate` checks.

Because the evaluated number, the typeset equation and the shader come from the same tree, they cannot drift apart silently. The comparisons of the GPU and float32 evaluations against double precision, and of the library against the earlier hand-written physics, are listed under S03 in §9.5.

### 9.2 The shared stage

On WebGPU the page has one renderer: each scene canvas is a canvas target of a single `WebGPURenderer` (`js/render/stage/shared-stage.mjs`), with one device, one pipeline cache and one shader cache. A WebGL2 context cannot be shared between canvases, so there each visible scene holds its own renderer from a pool of at most four live contexts; a scene created out of view while the pool is full waits without one, and the scene seen longest ago yields its context and leaves a snapshot of its last frame.

Scenes render on demand: a paused or static scene draws no frames. The rules are written down in `docs/render/performance-contract.md`; the renderer counts, idle frame rates and first-frame times measured before and after are listed under S04 and S05 in §9.5.

### 9.3 The Figure Kit

Every 2D scientific plot is a plain description (axes, marks, status and provenance) built by a pure function in `js/figure/plots/`. A canvas renderer paints it on screen and an SVG renderer writes the same scene as a string, so an exported figure is the figure on the page. Ticks follow 1-2-5 nice numbers with log decades, margins are solved from measured label extents, and each figure registers one provenance entry.

The pure modules import in Node and are covered by `test/figure-*.test.mjs`; `docs/render/figure-kit.md` documents the kit. The plots it replaced are counted under S09 in §9.5.

### 9.4 Provenance coverage

The registry holds 89 registered provenance entries: 11 established, 35 effective, 31 schematic, 12 conjectural. Each names its model, assumptions and sources and separates data, model and decoration layers.

`npm run validate` fails when a captioned figure has no entry or a caption's status disagrees with its entry, when a citation has no DOI, arXiv id, ADS bibcode or URL, and when a figure path calls `Math.random`. The check that scene objects carry their layer class needs a browser and runs in the QA suite.

### 9.5 Verification record, S03–S28

Each prompt of the v2 pack was accepted on measurements written into the project ledger with their units and what they were compared with. The list below is generated from `docs/superpowers/ledger/ledger.json` by `scripts/build-whitepaper.mjs` and checked by `npm run validate`; it is not retyped. Prompts S03 to S28 carry 155 measurements.

#### S03 — Formula Core: One Definition → JS, KaTeX and TSL

- GPU (SwiftShader, node renderer WebGL2) vs evaluateF32, max relative error over 256 samples: 5.7e-7 worst (chirpMass) against 2e-4 tolerance; 7 of 12 formulas exactly 0
- gpuSafe f64 vs f32 max relative error, geometric units: 3.3e-6 worst (lorentzGamma, beta up to 0.999) against 1e-4
- r\_s(1 Msun) = 2953.339 m vs 2953.34; T\_H(1 Msun) = 6.170074e-8 K vs 6.17007e-8; r+(a\*=0.9) = 1.435890 M; chirp mass (36,29) = 28.0956; Casimir(1 um) = 1.3001e-3 Pa; l\_P = 1.616255e-35 m
- Library vs js/physics.mjs: equal to 1e-12 relative for r\_s, T\_H, chirp mass, Lorentz gamma, inspiral frequency, photon sphere, critical impact, r+
- planckLength gpuSafe in SI units: false (hbar\*G/c^3 ~ 7e-45 below float32 range); true in geometric units

#### S04 — Shared GPU Stage: One Renderer per Page, Frames on Demand

- WebGPU live renderers on the QFT view: 4 (stage off) -\> 2 (stage on; 3 pilot scenes share 1, the collision scene is not a pilot yet; 1 after S05); programs 36 -\> 34
- WebGL2 live contexts on the QFT view: 4 both ways (3 pilots pooled + 1 unmigrated scene), at the 4-context budget; budget 2 and 1 hold: pooled contexts \<= limit
- Static scene frames drawn in 2 s idle after pause: 0 (WebGL2 and WebGPU), against continuous drawing before
- WebGPU GPU render time resolved from timestamp-query on SwiftShader: about 110 ms p50 (perf probe, software rasterizer), well over the 8 ms desktop budget; the number is only meaningful on real GPUs
- CPU rAF p50/p95 on SwiftShader, QFT desktop, stage off vs on: 316.7/383.4 ms vs 283.3/366.6 ms (WebGL2); 200/266.7 vs 233.4/300 ms (WebGPU); within run-to-run noise, not a claimed speedup
- Static-frame pixel difference, mean absolute channel diff 0-255: stage off vs off-control 3.4-5.6, off vs on 3.3-5.6 over three runs (unseeded backdrop starfield makes loads differ); no difference attributable to the stage

#### S05 — Migrate Every Scene to the Shared Stage

- QFT view on WebGPU: renderers 4 -\> 1 (target met); overview 2 -\> 1, bh 4 -\> 1; programs 36 -\> 22 (qft), 19 -\> 15, 36 -\> 16
- Idle frames per second (reduced motion, every scene paused): WebGL2 3.26 / 3.75 / 3.64 -\> 0 / 0 / 0 and WebGPU 4.65 / 5.33 / 3.33 -\> 0 / 0 / 0 for overview / qft / bh (target 0 met)
- firstFrameMs legacy -\> default: WebGL2 overview 5594 -\> 5343 (-4.5 %), qft 6408 -\> 5860 (-8.6 %), bh 5725 -\> 6275 (+9.6 %); WebGPU overview 7009 -\> 7206 (+2.8 %), qft 9945 -\> 8461 (-14.9 %), bh 8768 -\> 8495 (-3.1 %); target "no regression above 10 %" met, bh WebGL2 within 0.4 points of the limit and inside the SwiftShader spread
- WebGL2 renderer counts do not fall (2 -\> 2, 4 -\> 4, 4 -\> 4): one context per canvas; the pool caps them at 4
- GPU reference probe p95 on the QFT view: 136.7 ms legacy vs 136.5 ms default (software rasterizer, not representative of hardware)

#### S06 — Engraved Line System

- Engraved line width, cross-section integral, 1.25 px at DPR 1 / 2: classic 1.247 / 1.251, node WebGL2 1.247 / 1.251, node WebGPU 1.247 / 1.251; 2.5 px: classic 2.376 / 2.498, node WebGL2 2.502 / 2.498, node WebGPU 2.376 / 2.498 (bound +-0.5 px)
- Real GR scene, page pipeline with tone mapping and sRGB, calibrated opacity ladder, lines at 0/30/60 deg: DPR 1 1.25 -\> 1.250/1.300/1.300 and 2.5 -\> 2.500/2.565/2.565; DPR 2 1.25 -\> 1.250/1.278/1.278 and 2.5 -\> 2.500/2.444/2.444 (max error 0.065 px vs bound 0.5 px)
- Opacity response of the node line equals the classic line: 0.10/0.25/0.50/0.75 -\> 0.102/0.251/0.502/0.749 (it read 0.114/0.31/0.671/0.922 before the alpha blend factors were set)
- Hairline THREE.Line/LineSegments objects in the GR scene: 0, with more than 3 engraved fan and trail lines (qa/specs/engraved-gr-fan.spec.mjs)
- THREE.Line sites 12 -\> 0, LineBasicMaterial sites 28 -\> 1 (perf:audit); 7 vendored addon files with sha256 in vendor/three/VERSION

#### S07 — TSL Material Kit and the End of Ad Hoc GLSL

- perf:audit ShaderMaterial sites 13 -\> 8 (remaining: kerr-material.mjs 6, gw-runtime.mjs 2, D-035)
- js/mod-gr.jsx 2408 -\> 1511 lines (-897, required \>= 800); new files all \< 600 lines
- perf:audit Math.random sites 35 -\> 27; needsUpdate sites 37 -\> 38 (4 per-frame sites removed from mod-gr, 4 one-off texture/attribute uploads added in the kit)
- Grid line width, requested 2 px: measured 2.0 px (coverage 0.25/0.75/0.75/0.25) on the node WebGL2 backend (tolerance 0.5)
- Blackbody 6500 K pixel equals the table colour within 3/255; heatmap ends equal viridis entries 0 and 255 within 4/255; 20 discs of 12 px cover their area within 3%
- GR scene renderers: classic WebGLRenderer -\> node renderer (webgl2 backend in CI, webgpu with an adapter); ShaderMaterial in the GR scene 3 -\> 0

#### S08 — GPU Compute Particle Kit

- needsUpdate = true sites: 38 -\> 33 (atlas-stage 1, field-lab 3 (surface stays), flow-field 2, event-display 3 -\> 1 one-off, mod-gr 0); Math.random sites 27 -\> 19
- Per-frame uploads of the migrated systems: atlas backdrop 700 colours/frame -\> 0; Hawking per-frame sprite and trail writes -\> 0; RG 2 attributes/frame -\> 0; collider tower matrices 72/frame during the 1.2 s rise -\> 0; QFT crest sprites -\> 0
- GPU vs CPU after 60 steps: reference system 0, Hawking positions 9.5e-7 (opacity 1.1e-4), RG tracers \<= 1e-4, QFT crest mask exact (heights \<= 1e-3)
- p95 CPU frame (software rasteriser, desktop): overview 316.6 -\> 350.0 ms, qft 350.0 -\> 316.7, rg 333.4 -\> 350.1, bh 766.5 -\> 766.7, exp 283.3 -\> 349.9 (noise, D-043)

#### S09 — Figure Kit: One Scientific 2D Plotting System

- plot sites named in the prompt that hand-rolled axes, ticks and legends: 14 -\> 0 (18 figures on the kit)
- canvas getContext('2d') sites in the six modules that held plots: 11 -\> 3 (strain oscilloscope, scatter plane, ring texture)
- orphaned pigment tokens removed: 27; styles/tokens.css 371 -\> 344 lines
- all 12 DOIs checked against Crossref: 12/12 match (D-046)

#### S10 — Formula Lens: Terms You Can See

- WebGL programs linked while focusing/blurring the potential term twice, and while showing the three Planck gates: 0 (baseline: 25 at load)
- GR well canvas after blur vs before focus: identical FNV-1a hash (4084972173), differs while focused
- GR field range from the formula over the slider corners: -5.5 to -0.0647 (Phi/c^2 = -GM/(rc^2), GM 0.55-5.5, r 1-8.5)
- term hit area \>= 44 x 44 px; running animations while a term is highlighted (reduced motion): 0
- mod-blackholes.jsx 961 -\> 961, mod-planck.jsx 451 -\> 451, mod-gr.jsx 1322 -\> 1322 lines; needsUpdate sites unchanged (33)

#### S11 — Provenance Coverage, Layer Classes and Determinism

- Math.random call sites in js/: 19 -\> 1 (annotation pin id, allowlisted)
- provenance registry entries: 9 views before (19 + 3 + 9 module entries counted by id, 26 captions, 0 requiring an id) -\> 50 entries, 26 of 26 captions registered
- drawn scene objects without a layer class, 9 views: 0 (qa/specs/provenance-layers.spec.mjs)
- scientific mode: every changed pixel lies within 1 px of the decoration-only footprint (orrery scene); 0 outside
- same seed, two loads: identical Points position hash (spin network) and identical FNV-1a canvas hash (orrery); seed 43 differs
- js/mod-\*.jsx lines: 9 files, net 0 (64 lines changed in, 64 out); needsUpdate sites 33 -\> 33; colour literals unchanged

#### S12 — Standard Model I: Three-Flavour Oscillations in Matter

- probability matrix rows and columns sum to 1 within 1e-12 over a 300-point grid (2 orderings, 5 energies, 5 baselines to 8000 km, 3 densities, nu and anti-nu)
- exact exponential vs a Taylor-series matrix exponential: worst difference 3.3e-11 over the same grid, equal to the difference between two Taylor evaluations (reference-limited); vs the closed vacuum formula: below 1e-10
- theta13 = 0, dm21 = 0 vs the two-flavour formula: below 1e-10; the two-flavour library formula agrees with the exact result to 1e-9
- matter potential V = sqrt(2) G\_F N\_e: 9.92e-14 eV at rho = 2.6 g/cm^3, Y\_e = 0.5, i.e. 7.63e-14 eV x Y\_e rho within 0.5 per cent
- 1-3 MSW resonance energy 12.1 GeV at rho = 2.6 g/cm^3 (normal ordering, neutrinos); the argmax of P(nu\_mu -\> nu\_e) in a constant-density scan equals E\_res within the 1 per cent scan step
- at the T2K design point (295 km, 0.6 GeV, 2.6 g/cm^3, NuFIT 6.0 NO, delta 212 deg): P\_e 0.0517, P\_mu 0.0085, P\_tau 0.9397
- js/mod-standard-model.jsx 639 -\> 612 lines; needsUpdate sites 33 -\> 33; Math.random sites 1 -\> 1; colour literals unchanged; registerVisualization sites 11 -\> 11

#### S13 — Standard Model II: The Physical Higgs and Vacuum Stability

- v = (sqrt2 G\_F)^-1/2 = 246.2197 GeV for PDG 2026 G\_F = 1.1663785e-5 vs 246.220 for the planned 1.1663788e-5; tree lambda 0.12914 at m\_H = 125.13 (0.12928 at the planned 125.20)
- two-loop flow from Buttazzo et al. couplings at M\_t to M\_Pl: lambda -0.0151 vs paper eq. (61) -0.0143, y\_t 0.3831 vs 0.3825, g1 0.6153 vs 0.6154, g2 0.5054 vs 0.5055, g3 0.4873 vs 0.4873; instability scale 4.9e9 GeV vs literature 1e9 to 1e12
- measured masses, leading-order matching: lambda crosses zero at 7.96e8 GeV (two loops) and 3.7e7 GeV (one loop) vs the planned range 1e9 to 1e12 for one loop (D-070); lambda\_min -0.0228 at 4.5e17 GeV, log10 p0 = -265: metastable
- stability lines at m\_H = 125.13: stable below m\_t = 169.2 GeV, unstable above 176.3 GeV (computed from this running, D-070)
- pure-lambda and gauge-only flows match their closed forms to 1e-9; one-loop beta equals an independent Python evaluation to 1e-12
- js/mod-standard-model.jsx 612 -\> 594 lines (net -18); toy figure sm-higgs-potential removed; new files all under 210 lines
- static audit: ShaderMaterial sites 8 -\> 8, Math.random 1 -\> 1, colour literals unchanged, files over 800 lines 13 -\> 13, \<VizCaption 27 -\> 30

#### S14 — QFT I: GPU Lattice Field Theory

- GPU vs CPU after 200 steps on 64 x 64: phi 2.9e-7, pi 1.5e-6, synchronised pi 1.3e-6, squared gradient 4.4e-7, energy density 2.5e-6 of its peak (tolerance 1e-3), identical on webgl2 and the software webgpu adapter; a step-length change (30 x 0.1 then 30 x 0.05) 2.2e-7 / 1.4e-6; one kick 6e-8 / 3.7e-7
- free field: leapfrog invariant conserved to 3.6e-15 over 10^4 steps at dt = 0.1 a (plan: 1e-5); lambda = 1: mean-energy drift 1.9e-5 at dt = 0.1 a and 4.7e-6 at dt = 0.05 a (eight seeds), ratio 4.1 (D-078)
- kink pair static to 1e-6 over 100 time units and its energy 2 (2 sqrt2 / 3) mu v^2 to 2e-3; free packets superpose to 1e-10; vacuum spectrum within 5 standard errors over 1500 seeds
- js/mod-qft.jsx 1476 -\> 695 lines (plan: under 900); new files all under 450 lines; three pigments removed with the code that used them
- QFT view CPU frame on the software rasterizer, scripts/perf/collect.mjs, this machine: running lattice p50 2117 to 2483 ms, p95 2201 to 2533 ms against 100 and 133 ms before; at rest p95 117.4, 116.8, 133.4 ms against 133.4, 1067.6, 733.4 before (three runs each; programs 35 -\> 39); no GPU adapter here, so hardware GPU time is not measured (D-077)

#### S15 — QFT II: The Casimir Cavity

- P(1 um) = -1.30013e-3 Pa vs the plan's 1.3001e-3 Pa; P(100 nm) = -13.0013 Pa vs 13.001 Pa
- K = pi^2 hbar c / 240 = 1.30013e-27 N m^2 vs Bressi et al.'s printed 1.3e-27 N m^2; their measured K = (1.22 +- 0.18)e-27, ratio 0.94 (band 0.80 to 1.08)
- mode sum (E\_in - E\_out)/(-pi hbar c / 24a) - 1 = -5.00e-4, -1.25e-4, -3.12e-5 at Lambda = 10, 20, 40 times pi c / a, against the analytic eps^2/20 (eps = 1/10, 1/20, 1/40): the remainder falls by four per doubling
- casimir-plates-pressure float32 error 1.9e-7 (geometric units) and 1.3e-7 (SI) vs the 1e-4 tolerance: GPU safe
- js/mod-qft.jsx 695 -\> 625 lines (+8 / -78); new files 56 to 169 lines each (limit 600)

#### S16 — QFT III: Electroweak e⁺e⁻ Scattering and Publication-Grade Feynman Diagrams

- QED limit sigma(1 GeV) = 4 pi alpha(0)^2 / 3s = 86.855 nb GeV^2 / s vs the plan's 86.8; the full gamma + Z function agrees with it to 2e-3 at 1, 2 and 5 GeV
- closed form vs the independent helicity-amplitude sum: agreement to 1e-12 relative at 6 energies x 5 angles
- peak of sigma at 91.2054 GeV vs M\_Z = 91.1879 GeV (PDG 2026): +0.0175 GeV, against the plan's 0.1 GeV
- A\_FB zero crossing at 91.0075 GeV (0.18 GeV below M\_Z); A\_FB(50 GeV) = -0.2213, A\_FB(100 GeV) = +0.5883
- A\_FB(M\_Z) = 0.01664 (3/4 A\_e A\_mu = 0.01674 at sin^2 theta\_W = 0.23122) vs LEP A\_FB^{0,mu} = 0.0169 +- 0.0013 (Table 2.13): 0.2 sigma
- sigma(M\_Z) = 1.9812 nb vs the derived LEP pole value sigma\_had^0 / R\_mu^0 = 1.9986 +- 0.0034 nb: -0.9 percent (the test allows 3 percent)
- Bhabha = the plan's angular form = the Mandelstam form to 1e-12; forward limit alpha^2 / (s sin^4(theta/2)) to 2e-3 at theta = 0.01; Moller symmetric under theta -\> pi - theta and equal to alpha^2 (3 + cos^2)^2 / (s sin^4) to 1e-12
- js/mod-qft.jsx 625 -\> 501 lines (+30 / -154); js/labs/amplitude-room.jsx 423 -\> 504; new files 37 to 226 lines each (limit 600)
- Figure Kit: the two stacked figures share one plot rectangle (x and width equal), checked in the page by qa/specs/electroweak-lab.spec.mjs

#### S17 — RG I: Running of the Standard-Model Gauge Couplings

- inputs at M\_Z with the derived alpha\_em^-1 = 127.9614: alpha\_1^-1 = 59.0245, alpha\_2^-1 = 29.5872, alpha\_3^-1 = 8.4746; with the plan's 127.951 they are 59.0197, 29.5848, 8.4746 vs the plan's 59.020, 29.585, 8.475 (test tolerance 1e-3)
- alpha\_em^-1 derivation: 127.9299 with the PDG 2024 Delta alpha\_had = 0.02783 vs the 127.930 +- 0.008 that edition prints; 127.9614 +- 0.0137 with the 2026 value 0.02760 +- 0.00010
- one-loop SM at M\_Pl (plan inputs; computed with the plan's 1.22e19 GeV, the shipped 1.2209e19 GeV shifts each by under 0.001): 33.287, 49.460, 52.409 vs the plan's 33.29, 49.46, 52.41 (to 0.01)
- numerical one-loop run vs the analytic solution, SM and MSSM with the threshold: 1e-9; two-loop run vs an independent integration of Buttazzo et al. eq. 96-98 in g^2: 1e-6
- two-loop SM at 1e19 GeV: alpha^-1 = 33.16, 49.03, 52.65 (one loop 33.42, 49.36, 52.19)
- triangle area (decades x alpha^-1): SM two loop 5.472 (vertices at 13.04, 14.24, 16.47), one loop 7.265; MSSM at 1 TeV two loop 0.00896 (crossings at 16.03 to 16.17, alpha^-1 = 25.0 to 25.2), one loop 0.0724; ratios SM/MSSM 611 (two loop) and 100 (one loop); MSSM area 0.0269 at 500 GeV, 0.0007 at 2 TeV, 0.0002 at 3 TeV
- 1-sigma band half-width at M\_Z: 0.0078, 0.0083, 0.0646 for alpha\_1^-1, alpha\_2^-1, alpha\_3^-1; at 1e19 GeV 0.0079, 0.0084, 0.0628
- Yukawa terms vs the two-loop gauge term at M\_Z (y\_t = 0.95): 10, 7 and 5 percent for the three couplings (estimate); top decoupling in alpha\_em^-1: 0.18
- js/mod-rg-stage3.jsx +8 / -10 lines (net -2); js/labs/unification-lab.jsx 191 lines; new files 70 to 191 lines (limit 600)
- controls of the lab: 7 buttons and ranges, all 44 px high and at least 44 px wide at 1280 and at 390 px; the provenance chips of the figures (21 px) are the existing shared component

#### S18 — RG II: Asymptotic Safety and the Flow Silk

- fixed points, optimised cutoff: GFP (0, 0) with theta = (-2, +2); NGFP g\* = 0.7073208809868444, lambda\* = 0.19320050715078568, theta = 1.4753024 +- 3.0432058 i, against the plan's 0.707, 0.193 and 1.475 +- 3.043 i (tolerance 2e-3)
- fixed points, Litim 2004 harmonic gauge: NGFP g\* = 0.015625, lambda\* = 0.25, theta = 1.6666667 +- 4.3076160 i, against his eq. (10) 1.667 +- 4.308 i; g\* = (lambda\* - 1/2)^2 / d exactly
- LIC coherence on a uniform rotation field, 128^2 image, Hann kernel of 24 steps: mean variance along streamlines 6.03e-4, across them 5.26e-3, ratio 0.115 (the plan asks for under 0.2)
- trajectory classes at the presets: (0.4, -0.1) Type Ia to canonical scaling; (0.5, 0.1) Type IIIa, ending on the eta pole at t\_term = -0.9448 (k\_term/k\_0 = 0.389); the separatrix start Type IIa into the Gaussian fixed point. The separatrix integrates from (1e-6, 4e-8) to the NGFP in 1213 RK4 steps
- 3-D gravity field at seed 42 and 40 streamlines: 37 drawn, 6 stop on the truncation boundary, 0 on a validity wall (that wall belongs to the perturbative models), 2 fixed points, 1 separatrix
- the silk's plane at 390 px is 308 px wide; the status chip measures 288 x 40 px inside the stage after the move, and was clipping 132 px off the left edge before it (ledger D-109)
- the two-coupling box is 1.4 x 0.89 couplings; at the one-coupling scale of 1.5 scene units per coupling the 3-D scene drew a 1.3-unit sliver, so the gravity mode uses 4.6

#### S19 — GR I: The Penrose Atlas

- null rays are at 45 degrees: worst \|dT - dR\| over every sampled ray of both kinds 1.1e-13, against the plan's 1e-9
- the horizon maps to the diagonal: \|T - R\| at the crossing 0 (closed form), and the interpolated crossing point agrees with T = R to 1e-7 (the samples straddle rho = 0)
- the free-fall closed form against quadrature: agreement to 1.3e-13 at 40000 steps to 0.98 eta\_H, for r0 = 4, 6, 10, 30; against finite differences of the geodesic equation 4e-11 (eta = pi skipped, where dr/dtau is 0/0)
- the Kruskal identity UV = rho(r) in all four regions: 1e-13 to 1e-15
- the Schwarzschild diagram's bounding box, measured: T in \[-3.1396, 3.1396\], R in \[-3.1396, 3.1396\], max (\|T\| + \|R\|) = 3.1416 = pi, consistent with the published extents T = pi/2 and R = pi
- the static observer at r0 = 4M ends exactly at (pi/2, pi/2) = region I's i+
- the atlas band at a common drawn height: 43.24 scene units wide, 8.17 tall, aspect 5.29 (13.03 before the change in ledger D-113); the framed picture with the label pad is 4.99:1
- the label rows on the desktop stage: titles at y = 9..31 px of a 250 px stage, drawn band 56..204, schematic note below the stage in the lab's flow, all clear of each other and of the stage's controls at x \>= 844
- the tick spacing is even in proper time: spread between consecutive gaps below 1e-9, and every tick's distance to the drawn polyline below 1e-9 (the ticks are interpolated between rows, so they lie on the chords)
- the readouts for the default r0 = 2.6M: crossing (1.2382, 1.2382), tau = 4.657 M, eta\_H = 1.0022, all from freeFallFromRest

#### S20 — GR II: Tidal Geometry, the Flamm Embedding and the Tested Universe

- 10 solar masses, 2 m and 100 m/s^2: threshold 3758330.075654403 m \> horizon 29533.393820668785 m (127.2569654 rs).
- 1e6 solar masses, same body and threshold: threshold 174446229.12188548 m \< horizon 2953339382.0668783 m (0.05906745 rs).
- Spherical GPS model r=26560 km: gravitational +45.71821278, kinematic -7.21359982 and net +38.50461296 microseconds/day; compare +45.72, -7.21 and +38.50 to 0.01.
- Flamm proper radial distance versus Simpson integration agrees within 1e-8 in test/tidal.test.mjs.

#### S21 — Planck Frontier: The Map of the Unseen

- Inflation bound 1.40859 x 10^16 GeV from r = 0.036, A\_s = 2.100 x 10^-9, reduced Planck mass; compare plan approximately 1.4 x 10^16 GeV.
- Fermi Table 2(a) lower limit M\_QG,1/M\_Planck \> 1.19 read from the paper (plotted 1.19 E\_P); plan rounded it to 1.2. GWTC-3 v3 abstract quotes m\_g \<= 2.42 x 10^-23 eV/c^2 at 90% credibility (plotted), against 1.27 x 10^-23 in the first preprint.
- Quantum tetrahedron volumes in (8\*pi\*gamma)^1.5 l\_P^3: j=1/2 0.3102016 vs Appendix C 0.310, j=1 0 and 0.6204032 vs 0 and 0.620, j=3/2 0.537285 and 0.992982 vs 0.537 and 0.992.
- Eot-Wash guide now spans the quoted 52 um to 3.0 mm (was a 52 um +/-3x locator box); IceCube spans the quoted 6.3 to 980 TeV.
- Area axis window at max spin 1: 0 to 29.4 l\_P^2 for a top level of 21.8 l\_P^2 (was a fixed 0 to 67.7 from spin 2, leaving the value in the lowest third).

#### S22 — Approaches I: Causal Sets

- Myrheim–Meyer inversion reproduces f(2) = 0.5, f(3) = 0.228571, f(4) = 0.1 to 1e-13, and inverts them back to the input dimension to 1e-9.
- N = 2000 sprinkling, five seeds: 2D mean d = 2.0055 with spread 0.0313 (range 1.956–2.043); 4D mean d = 4.0294 with spread 0.0531 (range 3.945–4.105). Planned tolerance was 2 ± 0.1 and 4 ± 0.3.
- Longest-chain growth from N = 250–2000, three seeds each: 2D slope 0.5687 against 1/2 (13.7% high); 4D slope 0.2453 against 1/4 (1.9% low). Both inside the 15% band.
- The 4D in-browser run at N = 600, seed 42: ordering fraction 0.1005 against the theoretical 0.1000, recovered d = 3.994.
- N = 4000, median of five runs on an idle machine: 4D 149 ms, 2D 196 ms, against the 300 ms budget. Under parallel test load CPU time stays at 192 ms (4D) and 232 ms (2D); the wall-clock figure rises with contention, so the test measures CPU time.

#### S23 — Approaches II: CDT, the Spectral Dimension, and the String Spectrum

- String level degeneracies computed as the 24-fold convolution of the partition numbers: 1, 24, 324, 3200, 25650 for N = 0..4, matching the plan exactly; N = 5 gives 176256.
- Normal-ordering constant: a(4) = -0.083333 = -2/24 and a(26) = -1.000000 = -24/24, so the massless level-one condition 1 + a = 0 fixes D = 26. zeta(-1) = -1/12 to 1e-15.
- CDT volume control: profile mean 8.000 against a target of 8, spread 1.47, range 5-10, with 4002 of 5726 moves accepted after the curvature term was added.
- Spectral dimension on the flat honeycomb control (24x24, 1500 walkers, seed 42): d\_s = 1.929 over sigma 3-8, against 2 within the planned 0.15.
- CDT science path (240 sweeps plus the flat control) runs in 3 ms, well inside the 2 s test budget.
- 4D CDT values transcribed as 4.02 (infrared) and 1.80 (ultraviolet) from Ambjorn-Jurkiewicz-Loll, PRL 95 (2005) 171301; the other four programs' values were each checked against their own paper.

#### S24 — Black Holes I: Evaporation Dynamics and Greybody Spectra

- Page time from S\_rad = S\_BH with beta = 1.4847: S\_BH/S0 = 0.5975369, M/M0 = 0.7730051, t/tau = 0.5381009, each matching the plan's 0.5975 / 0.7730 / 0.5381 to 1e-4.
- beta = 1.4847 read from Page 2013 (arXiv:1301.4995) page 1 and section 5; the paper states 'about 1.4847 times the BH entropy loss'.
- Greybody limits: low-frequency 16 pi M^2 = 50.2655, geometric-optics 27 pi M^2 = 84.8230, ratio exactly 1.6875, the last two to 1e-12.
- s-wave transmission: 0.0002 at omega M = 0.1, 0.941 at 0.2, \>0.999 above 0.5; l = 1 stays below 0.01 at 0.2 and l = 2 below 0.01 at 0.4, which is the centrifugal threshold.
- Low-frequency scaling: Gamma/omega^2 flat to within 15 % across omega = 0.002-0.008, and Gamma(0.008)/Gamma(0.004) = 4.02.
- The old tent function peaked at 0.5 with a hardcoded slope; the derived curve peaks at 0.5975 at t/tau = 0.5381.

#### S25 — Black Holes II: The Shadow, Measured

- Schwarzschild critical curve: every sampled radius equals sqrt(27) M = 5.196152 to 1e-12, symmetric about alpha to 1.8e-15.
- a = 0.998 at 90 degrees: alpha runs from -2.111 to +6.997 M, so the prograde edge sits well inside the -5.196 M circle while the retrograde side bulges out; beta max 5.196 M, so the flattening is horizontal.
- Shadow angular size: 39.689 microarcsec for M87\* (6.5e9 Msun, 16.8 Mpc) and 51.291 for Sgr A\* (4.0e6 Msun, 8.0 kpc), each matching the plan's 39.69 and 51.29 to 0.01.
- EHT comparison: measured 42 +/- 3 microarcsec against 39.689 predicted (+5.8 %) and 51.8 +/- 2.3 against 51.291 (+1.0 %), both inside the ~10 % the calibration supports.
- First photon sub-ring: e^-pi = 0.043214 of the direct image, matching Math.exp(-Math.PI) to 1e-15.
- In-browser: the width/height ratio reads 1.000 at a = 0 and 1.141 at a = 0.998, with the readout switching from 'very nearly circular' to 'flattened on the prograde edge'.

#### S26 — Gravitational Waves I: Post-Newtonian Waveforms and a GPU Spacetime Field

- Remnant at equal masses: spin 0.6865 and M\_f/M 0.9516, against the plan's 0.686 +/- 0.005 and 0.952 +/- 0.003.
- Ringdown fits reproduce Berti-Cardoso-Will: j = 0 gives M\*omega = 0.3683 and Q = 2.1187; j = 0.686 gives 0.5291 and 3.2288, each to 1e-4.
- Detector-frame ringdown for 62 solar masses at z = 0.09 with j = 0.686: 253.0 Hz, matching the plan's approximately 253 Hz.
- Coalescence from 30 Hz for 36 + 29 solar masses: TaylorT4 gives 0.195 s against the Newtonian 0.287 s, i.e. 32 % sooner.
- The 3.5PN bracket tends to 1 as x shrinks: the ratio at x = 1e-9 matches 1 to 1e-8, and at x = 1e-6 it matches the bracket itself to 1e-12.
- The generated signal's ringdown moved from the fixed 190 Hz / 60 ms to 275 Hz with a 3.7 ms damping time at 36 + 29 solar masses.

#### S27 — Gravitational Waves II: Matched Filtering on Real Data

- Injection-recovery in seeded coloured noise: the bank recovers the injected chirp mass exactly (Mc = 27.0 from a 1.0 Msun-spaced bank) and the peak SNR is 14.5 against an injected optimum of 15, i.e. within 3 %.
- Noise-only data peaks below 8 in the same search, so the filter is not fitting the noise.
- On the bundled fixture (synthetic): peak SNR 5.79, recovered chirp mass 15.8 Msun, peak time 6.06 s. Recorded as a method demonstration, not an observation.
- CMS dimuon spectrum from CERN Open Data record 700: 10 000 events read, 10 000 binned at 0.25 GeV. J/psi window 1014 events, psi(2S) 223, Upsilon(1S) 343, Upsilon(2S+3S) 248, Z region 18.
- The Q-transform finds a 40 Hz pure tone at 39.4 Hz and follows a 20-55 Hz chirp from 23.1 to 43.3 Hz.

#### S28 — Experiments III: The Observational Net as Instruments

- Lookback integral at z = 0.903: 1.000600, matching a 200001-point Simpson reference to 1e-8.
- Hubble time 1/H0 = 14.516 Gyr for H0 = 67.36 km/s/Mpc.
- A 31 GeV photon from z = 0.903 arrives 1.16 s late at E\_QG = E\_Planck, and 0.116 s at ten Planck energies.
- Slow-roll at N = 50: phi^2 gives n\_s = 0.9600, r = 0.1600 (above the 0.036 bound, so excluded); R^2 gives r = 0.0048; natural inflation with f = 5 gives n\_s = 1.0155, r = 0.0490.
- Eot-Wash: 38.6 um at alpha = 1, 95 % CL, over separations of 52 um to 3.0 mm, read from the paper's abstract.
- The four prose panels are gone: the experiments view now reports zero .panel headings in that section.

<!-- whitepaper-v2:end -->

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