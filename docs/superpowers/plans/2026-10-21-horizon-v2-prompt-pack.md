# HORIZON v2 — Scientific Depth & Visual Language Prompt Pack

> **For agentic workers:** this pack is executed prompt-by-prompt and tracked in the shared ledger at [`docs/superpowers/ledger/ledger.json`](../ledger/ledger.json). Read the [ledger protocol](../ledger/README.md) before you touch anything. A prompt you have not claimed in the ledger is not yours to implement.

## Özet (TR)

Bu paket, HORIZON'u "sağlam bir bilimsel atlas"tan **yayın kalitesinde, kendi görsel dili olan bir bilimsel enstrümana** taşır. v1 paketi (2026-10-08) 00–10 arası tamamlandı; 11 (export), 12 (PWA/tema/worker) ve 13 (release gate) hiç başlanmadı. Bu paket onları D-fazına katar ve her modül için kod incelemesinden çıkan somut bulgulara (F-01…F-20) dayanan derinleştirme promptları ekler.

Fazlar:

- **A — Temel:** baseline denetimi, tasarım token'ları, ortak bilimsel figür kiti, %100 provenance ve determinizm.
- **B — Modüller:** her modül için bilimsel derinlik + imza görsel (SM, QFT, RG, GR, Planck, Yaklaşımlar, Kara delikler, Deneyler).
- **C — Anlatı:** bölüm kimlikleri, canlı denklemler, rehberli turlar ve TR/EN.
- **D — Yayın:** yayın stüdyosu, çalışma zamanı performansı/PWA, temalar ve erişilebilirlik, akademik yayın, release gate.

Her prompt bağımsız bir ajan oturumuna kopyalanabilir. Ajanlar ilerlemeyi ledger'a yazar; `npm test` ledger'ın tutarlılığını otomatik denetler.

---

## How to use this pack

1. Pick the lowest-numbered prompt whose `dependsOn` entries are all `done` in the ledger and whose status is `todo`.
2. Claim it in the ledger (status `claimed`, owner, branch) in a commit of its own, before writing code. If two agents race, the first claim merged to `main` wins; the loser picks another prompt.
3. Read **Global Constraints**, the **Art Direction Bible**, and the prompt in full.
4. Implement, verify, update the ledger to `review` with evidence, open the PR, then `done` with the merge commit.

Parallel lanes are allowed **only after V2-A3 is done** (see *Execution Graph*). Shared files are coordinated through ledger `locks`.

## Global Constraints

Everything in the v1 pack's Global Constraints still holds (zero bundler, self-hosted vendor, WebGPU as enhancement, versioned URL state, pure science modules, seeded stochastic output, reduced motion, 44 px targets, no success-shaped fallbacks, surgical edits). In addition:

- **Every number on screen has a source.** A literature value is committed with citation (DOI or arXiv id), the value, its uncertainty, and the retrieval date, in a `js/science/data/*.mjs` module. A UI string never carries a bare physical number that is not either computed by a pure function or imported from such a data module.
- **Verify every citation and value you add.** The values quoted in this pack are the targets the pack's author checked; you must still confirm each against the primary source before committing it, and record disagreements in the ledger's `decisions`.
- **Every visual layer is classified** as `data`, `model`, or `decoration` (see Art Direction §6). The `scientific` render preset removes every `decoration` layer without changing a `data` or `model` pixel.
- **No new module file over 800 lines.** The existing large files (`mod-gr.jsx` 2,408, `physics.jsx` 2,002, `mod-experiments.jsx` 1,891, `mod-qft.jsx` 1,739, `extras.jsx` 1,303, `mod-blackholes.jsx` 1,076) may only shrink: new labs go in `js/labs/` or `js/visualizations/<area>/`, and pure computation goes in `js/science/`.
- **Colours come from tokens.** After V2-A1, a hex/rgb/oklch literal in module JSX or canvas code fails `npm run validate`, except in token definition files and committed scientific colour data (CIE tables, colormaps).
- **Plots come from the Figure Kit.** After V2-A2, a new 2D plot that hand-rolls axes, ticks, or legends is rejected in review.
- **Ledger hygiene is part of done.** A prompt without ledger evidence (tests run, screenshots, measurements) is not done, whatever its CI says.
- Use the commit trailers your harness requires. Do not copy trailers from this document.

## Art Direction Bible — "The Observatory Instrument"

The atlas must look like a precision instrument built by people who love physics: dark, calm, luminous where the physics emits light, engraved where the physics is geometry. Beauty comes from correct data drawn well, not from effects added on top.

### 1. Principles

1. **Light is data.** Glow, bloom, and colour temperature are reserved for things that physically emit (accretion disks, Hawking flux, jets, blackbody spectra). UI chrome, axes, and labels never glow.
2. **Geometry is engraved.** Curves that are mathematical objects (geodesics, conformal diagrams, RG separatrices, minimal surfaces) are drawn as crisp, hairline-to-1.5 px strokes with optional single-pass soft halo at ≤ 12 % opacity. Think engraved brass, not neon.
3. **One focal point per figure.** Each figure has exactly one element at full luminance; everything else steps down by at least one token level.
4. **Status is always visible, never loud.** The five status colours appear as a 3 px left rule plus a text label, never as a flood fill.
5. **Motion explains.** Every animation must answer "what changes, and why?" Idle wobble, breathing glows, and parallax without meaning are forbidden.

### 2. Colour system

- **Surfaces:** `--surface-0` (void, `#05080f` today), `--surface-1` panel, `--surface-2` raised, `--surface-glass`. Max four surface levels.
- **Ink:** `--ink-strong` (headings), `--ink` (body), `--ink-dim` (secondary), `--ink-faint` (gridlines). All text tokens ≥ 4.5:1 on `--surface-1`; `--ink-faint` is never used for text.
- **Status (single source of truth):** `--status-established`, `--status-effective`, `--status-schematic`, `--status-conjectural`, `--status-open`, plus `--status-heuristic`. Each must be distinguishable under deuteranopia, protanopia, and tritanopia simulation (ΔE₀₀ ≥ 12 pairwise after simulation) and is always paired with its text label.
- **Data palettes:** one categorical palette (8 hues, CVD-validated), one sequential (perceptually uniform, e.g. a committed *viridis*/*magma*/*cividis* table with licence), one diverging (for signed quantities: strain h₊, β(g) sign, redshift vs blueshift). Rainbow/jet is forbidden.
- **Physical colour:** blackbody and spectral colours are computed through `js/science/spectrum.mjs` (CIE 1931 → linear sRGB), never picked by eye.

### 3. Typography

- `--font-head` Space Grotesk (titles, chapter numbers), `--font-body` Sora (prose), `--font-mono` IBM Plex Mono (data, axes, readouts) with `font-variant-numeric: tabular-nums` everywhere a number can change.
- Type scale tokens `--step--2 … --step-5` (modular ratio 1.2, base 15 px); the 10 px floor established in PRs #39/#40 stays the absolute minimum, axis labels default to `--step--1`.
- Mathematics is KaTeX, always. Canvas plots render math labels through a DOM overlay layer, not `ctx.fillText` approximations of Greek letters.
- Units are set in roman with a thin space (`3.0 km`, `42 μas`), uncertainties as `42 ± 3 μas`, scientific notation as `2.1 × 10⁶⁷` with proper superscripts.

### 4. Figure grammar

Every figure, 2D or 3D, follows the same anatomy:

```text
┌ title bar ─ mono, uppercase kicker · figure id · status chip ─────────────┐
│                                                                          │
│   plot / scene  (one focal element, tokenised palette, KaTeX overlay)    │
│                                                                          │
├ legend ─ content-sized flex row, keys match strokes exactly ─────────────┤
│ caption ─ what is shown · model · what it is NOT · provenance id · refs  │
└──────────────────────────────────────────────────────────────────────────┘
```

Axes use "nice" ticks (1-2-5 sequence, Heckbert), outward 4 px tick marks, labels with units in brackets, and log axes with decade labels `10ⁿ`. Observational data are drawn as points with error bars in `--ink-strong`; models are lines; uncertainty is a filled band at ≤ 18 % opacity.

### 5. Light, render, and post

- Tone mapping AgX by default (already wired); exposure is a documented per-scene constant, never auto-exposure in `scientific` mode.
- Bloom threshold ≥ 1.0 in linear HDR so only emitters bloom; text and UI are composited after post-processing.
- Film grain, chromatic aberration, lens dirt and vignette are `decoration` layers: off in `scientific`, subtle in `cinematic` (grain ≤ 2 % luminance σ, CA ≤ 0.6 px at the frame edge).
- Starfields and backgrounds are seeded so that captures are reproducible.

### 6. Layer classification

Every scene declares its layers in its provenance entry:

| Class | Meaning | Example | `scientific` preset |
|---|---|---|---|
| `data` | observed or measured values | GWOSC strain, EHT ring diameter, LEP A_FB points | shown |
| `model` | output of a pure, tested function | Kerr ray-traced disk, PN waveform, RG streamlines | shown |
| `decoration` | atmosphere with no physical content | nebula haze, grain, ambient particles | hidden |

### 7. Motion

Motion tokens: `--dur-instant 90ms`, `--dur-quick 180ms`, `--dur-settle 420ms`, `--dur-scene 900ms`; easings `--ease-out-quart`, `--ease-in-out-cubic`, and a physically damped spring for camera moves. Reduced motion snaps to the final state with no interpolation. No animation loops on hidden tabs.

### 8. Forbidden patterns

- A rubber-sheet gravity well presented without a "not literal" annotation in-canvas.
- Particles drawn as little balls in QFT contexts without the schematic label.
- `Math.random()` anywhere that feeds a `data` or `model` layer, or a capture.
- Hardcoded colours or fonts in module code (after A1).
- Glow on text, axes, or UI chrome.
- Decorative numbers ("loading quantum foam… 87 %").

---

## Audit Findings

Every finding below was verified against the code at commit `9013fba` while this pack was written. Each prompt names the findings it closes; the ledger tracks closure.

| ID | Finding | Evidence | Closed by |
|---|---|---|---|
| F-01 | v1 prompts 11–13 never executed: no `js/export/`, `service-worker.js`, `js/workers/`, `styles/themes.css`, `docs/release-verification.md`, `scripts/audit-provenance.mjs` | file system at `9013fba` | D1, D2, D3, D5 |
| F-02 | Provenance registry covers 9 views, but the UI has 28 `<VizCaption>` panels; ~19 figures carry a status label with no registered model, assumptions, or references | `grep VIEW_ID` vs `grep <VizCaption` | A3 |
| F-03 | `Math.random()` feeds labelled science figures: the spin-network graph in `mod-approaches.jsx:156`, field kicks in `mod-qft.jsx:268`, debris in `mod-gr.jsx:1689`, the default RNG of `sampleDielectronMass` in `mod-experiments.jsx:685`; starfields in `atlas-stage.jsx`, `core.jsx`, `mod-gr.jsx`, `mod-planck.jsx` are unseeded | grep | A3 |
| F-04 | ~199 hex literals plus per-canvas `rgba()`/`oklch()` palettes and hardcoded `"10px IBM Plex Mono"` fonts across module JSX; the only tokens live in `index.html :root` | grep | A1 |
| F-05 | 2,332-line `index.html` holds nearly all CSS; one external stylesheet (`styles/rg-flow.css`); no light or print theme | file sizes | A1, D3 |
| F-06 | Every 2D plot hand-rolls axes, ticks and legends (neutrino, Higgs, Page curve, Hawking spectrum, V_eff, RG scale/β plots, GW strain/spectrogram, QFT angular/resonance/waterfall) — inconsistent tick logic and typography | `mod-*.jsx` canvas code | A2 |
| F-07 | Neutrino lab is two-flavour vacuum only: no matter (MSW) effect, no CP phase δ, no mass ordering, no named experiment baselines beyond T2K | `mod-standard-model.jsx:496` | B1 |
| F-08 | Higgs potential plotted in toy units (λ = 1, μ² ∈ [−1, 1]); no physical v = 246 GeV, no m_H link, no vacuum-stability story | `mod-standard-model.jsx:436` | B1 |
| F-09 | Page-curve plot hardcodes the thermal slope `1.7 f` and a tent function; it is not derived from evaporation dynamics `M(t)` | `mod-blackholes.jsx:87`, `physics.mjs:312` | B7 |
| F-10 | Hawking spectrum is a pure blackbody `x³/(eˣ−1)`; no greybody factors | `physics.mjs:321` | B7 |
| F-11 | Synthetic GW waveform is a leading-order Newtonian chirp with an ad hoc amplitude clamp `min(1,(f/220)^{2/3})` and a fixed 190 Hz / 60 ms ringdown not derived from the remnant; no matched filtering or SNR | `physics.mjs:655`, `gravitational-waves.mjs:458` | B8 |
| F-12 | "The wider observational net" (CMB, ν/dark matter, QG phenomenology, EHT) is four prose panels with no instrument, plot, or data | `mod-experiments.jsx:1842` | B5, B8 |
| F-13 | The approaches module covers five programs; causal sets and CDT appear only in prose; there is no quantitative cross-program comparison | `data.jsx:108–190` | B6 |
| F-14 | RG covers one-loop QED/QCD plus toy fixed points; no SM three-coupling running, no Einstein–Hilbert truncation flow for asymptotic safety | `physics.mjs rgBeta`, `rg-flow-3d.mjs` | B3 |
| F-15 | Amplitude room is t-channel-pole-only and omits γ–Z⁰ interference (both listed in the limitations registry) | README Appendix P | B2 |
| F-16 | GR engine runs on a display constant `c² = 27.04`; solar-system and stellar tests beyond Mercury and limb deflection are absent; no conformal (Penrose) diagrams; curvature grid reads as a rubber sheet | `physics.mjs:70`, Appendix P | B4 |
| F-17 | Kerr observatory has no analytic shadow outline (Bardeen critical curve) overlay and no comparison with EHT ring diameters | `kerr-observatory.mjs` | B7 |
| F-18 | Production ships `react.development.js` and `react-dom.development.js` and transpiles ~20 k lines of JSX in the browser with Babel standalone (3.0 MB) on every cold load | `index.html:2301–2303`, `bootstrap.mjs:145` | D2 |
| F-19 | README is 2,500+ lines, the Roadmap says "No outstanding items" while v1 11–13 are open, and there is no archival DOI | README | D4 |
| F-20 | `<html lang="en">` only; no localisation, although the maintainer's community is Turkish-speaking | `index.html:2` | C3 |

---

## Execution Graph

```text
A0 baseline ─▶ A1 tokens ─▶ A2 figure kit ─▶ A3 provenance+determinism
                                                   │
          ┌───────────────────────┬────────────────┴─────────────┐
     Lane 1 (matter/scale)   Lane 2 (geometry)            Lane 3 (horizons/data)
          B1 SM                   B4 GR                        B7 BH
          B2 QFT                  B5 Planck ───────────┐       │
          B3 RG                                        └──▶   B8 Experiments
          B6 Approaches (needs B3)
          └───────────────────────┴────────────────┬─────────────┘
                                                   ▼
                          C1 chapter identity ─▶ C2 living equations ─▶ C3 tours + i18n
                                                   ▼
                    D1 publishing studio ─▶ D2 runtime/PWA ─▶ D3 themes+a11y ─▶ D4 scholarly ─▶ D5 release gate
```

Lanes 1–3 may run concurrently on separate branches. Within a lane, prompts run in order. Shared files (`index.html`, `js/state.jsx`, `js/state-runtime.jsx`, `js/data.jsx`, `qa/manifest.json`, `README.md`) are edited under a ledger lock (see protocol); keep those edits small and rebase before merging.

---

## V2-A0 — Baseline Audit and Ledger Activation

**Phase** A · **Depends on** — · **Closes** — (measures all) · **Signature** none

```text
You are implementing V2-A0 of the HORIZON v2 prompt pack. Claim it in docs/superpowers/ledger/ledger.json first.

Objective
Measure the current state so that every later prompt can prove improvement with numbers. No product code changes.

Required investigation
- Re-verify every finding F-01…F-20 in the pack against the current main. Record any that no longer hold in the ledger's decisions, with the commit that changed them.
- Run npm test, npm run validate, npm run qa:verify, and npm run qa:critical. Record pass counts and durations.

Measure and record in docs/audit/v2-baseline.md
- Test counts (node and Playwright), provenance-registered views vs <VizCaption> count, Math.random call sites by layer class, hex/rgb/oklch literals per file, 2D plots and their axis code, file line counts over 800.
- Cold-load metrics on the local static server in headless Chromium at 1440×900 and a 390×844 mobile profile: time to first paint, time until the overview Arena canvas renders its first frame, JS bytes transferred, Babel transform time (instrument bootstrap.mjs with performance.mark, do not ship the instrumentation).
- Frame-time p50/p95 for the Kerr observatory, GW theatre, and curvature engine at the default quality, 10-second windows, with renderer backend recorded.
- Contrast ratio of every text token on every surface token.

Files
- Create docs/audit/v2-baseline.md and scripts/audit-baseline.mjs (re-runnable; prints the same tables).
- Update the ledger: evidence.measurements gets the headline numbers.

Acceptance
- npm test, npm run validate.
- node scripts/audit-baseline.mjs reproduces the static counts in the document.

Commit
"docs: record v2 baseline audit"
```

## V2-A1 — Design Tokens v2 and Stylesheet Extraction

**Phase** A · **Depends on** A0 · **Closes** F-04, F-05 (structure) · **Signature** none (zero intended visual change)

```text
You are implementing V2-A1. Claim it in the ledger and take locks on index.html.

Objective
Turn the Art Direction Bible §2, §3 and §7 into a single token source consumed by CSS, canvas and Three.js code. This prompt must not change what the atlas looks like beyond sub-perceptual rounding; it changes where every colour, font and duration comes from.

Files
- Create styles/tokens.css (surfaces, ink, status, categorical/sequential/diverging palettes, type scale, spacing, radii, motion), styles/base.css, styles/layout.css, styles/components.css, styles/modules/*.css. Move the CSS out of index.html into these files, preserving cascade order; index.html keeps only critical above-the-fold CSS (< 4 KB).
- Create js/design/tokens.mjs: reads computed CSS custom properties once per theme change and exposes typed getters (color as linear-RGB triplet and CSS string, font shorthand for canvas, durations in ms). It publishes a "qga:theme" event that canvas code subscribes to.
- Create js/design/palettes.mjs with the committed sequential/diverging tables (cite source and licence) and a CVD simulation helper (Machado, Oliveira & Fernandes 2009 matrices).
- Create test/design-tokens.test.mjs: contrast ≥ 4.5:1 for every text token on surfaces 0–2; pairwise ΔE₀₀ ≥ 12 between status colours under each CVD simulation; categorical palette adjacent-pair ΔE₀₀ ≥ 10.
- Migrate every module JSX and visualization file to tokens: replace hex/rgba/oklch literals and canvas font strings. Three.js materials read colours from tokens.mjs at build time of the scene.
- Extend scripts/validate-repo.mjs: fail on colour literals in js/**/*.jsx and js/visualizations/**/*.mjs outside an allowlist (token files, scientific colour data). Fail on "px IBM Plex Mono"-style canvas font literals.

Acceptance
- npm test, npm run validate (with the new rule active and zero violations).
- npm run qa:test -- qa/specs/visual.spec.mjs: every baseline passes at its existing tolerance. If a baseline moves, explain each pixel delta in the ledger; do not refresh baselines to hide a change.
- Literal count from scripts/audit-baseline.mjs drops to 0 outside the allowlist.

Commit
"refactor(design): single token source for css, canvas and three"
```

## V2-A2 — Figure Kit: one scientific plotting system

**Phase** A · **Depends on** A1 · **Closes** F-06 · **Signature** every 2D plot

```text
You are implementing V2-A2.

Objective
Build js/figure/, a small, dependency-free 2D plotting kit that implements the Art Direction Bible §4 figure grammar, and migrate every existing 2D plot to it.

Design
- Pure layer (testable in Node): js/figure/scale.mjs (linear, log, symlog), js/figure/ticks.mjs (Heckbert nice numbers, decade ticks with minor 2–9, tick label formatting with tabular numerals and ×10ⁿ), js/figure/layout.mjs (margin solving from measured label widths so nothing clips at 320–1440 px).
- Render layer: js/figure/canvas-figure.mjs (HiDPI canvas, token-driven, theme-event aware) and js/figure/svg-figure.mjs (same scene graph to SVG for D1 export).
- Marks: line, band (uncertainty), points with asymmetric error bars, step, heatmap (sequential/diverging palettes only), vertical/horizontal reference rules with label, annotation callout with leader line, shaded exclusion region with hatching.
- Overlay: js/figure/katex-overlay.jsx positions KaTeX labels (axis titles, legend math, callouts) over the canvas; canvas never draws Greek letters itself.
- Interaction: crosshair with nearest-sample readout (keyboard: arrow keys move along the series, Home/End jump), hover never required for information.
- Accessibility: every figure exposes a generated text summary (series names, ranges, extrema, crossing points) and a "data table" disclosure listing the plotted samples (decimated to ≤ 200 rows).

Migrate (one commit per migration is fine, one PR)
- Neutrino oscillation, Higgs potential, Hawking spectrum, Page curve, V_eff, RG scale plot, RG β plot, GW strain, GW spectrogram (heatmap), QFT angular distribution, resonance, waterfall, dispersion plot.

Tests
- test/figure-ticks.test.mjs (nice-number sequences, log decades, label formatting, negative and tiny ranges, NaN rejection).
- test/figure-layout.test.mjs (no label overflow for long unit strings at 320 px).
- qa: a figure-kit spec asserting zero clipped text nodes and zero overlapping labels at 8 widths 320→1440 px for every migrated plot, and that the text summary exists.

Acceptance
- npm test, npm run validate, the new Playwright spec, visual.spec.mjs. Visual baselines for migrated plots will change: inspect each diff, write a one-line justification per baseline in the ledger, then update.

Commit
"feat(figure): unified scientific plotting kit"
```

## V2-A3 — Provenance Coverage and Determinism Sweep

**Phase** A · **Depends on** A2 · **Closes** F-02, F-03 · **Signature** status chips that open the full provenance

```text
You are implementing V2-A3.

Objective
Every figure that carries a status label is registered with full provenance and is deterministic.

Work
- Give VizCaption a required provenanceId prop. The caption's status chip becomes a button that opens a provenance drawer: model, status, assumptions, validity, numerical method, references (linked DOI/arXiv), layer classification (data/model/decoration), seed.
- Register every one of the 28 captioned figures (and any new ones) with registerVisualization. The registry rejects a status mismatch between caption and registry.
- Replace Math.random in every data/model layer with seededRng(seed) from physics.mjs. Decorative starfields also take a seed so captures are reproducible; the seed is part of URL state where the figure is exportable.
- Create scripts/audit-provenance.mjs (absorbs v1 P13): fails if any <VizCaption> lacks a registered provenanceId, any registry entry lacks references, any reference lacks a DOI/arXiv/ADS/URL, or any Math.random call site exists outside an allowlist (annotation ids). Wire it into npm run validate and CI.

Tests
- test/provenance-coverage.test.mjs (parses the JSX sources statically for VizCaption ids and compares with the registry module list).
- Playwright: every status chip opens a drawer whose content matches the registry; keyboard and screen-reader names are correct.

Acceptance
- npm test, npm run validate, node scripts/audit-provenance.mjs (0 violations), relevant Playwright specs.
- Two captures of each figure with the same seed are pixel-identical on the software renderer.

Commit
"feat(provenance): register every figure and seed every model layer"
```

---

## V2-B1 — Standard Model: Three-Flavour Neutrinos, the Physical Higgs, and Vacuum Stability

**Phase** B · Lane 1 · **Depends on** A3 · **Closes** F-07, F-08 · **Signature** the metastable-vacuum "phase diagram"

```text
You are implementing V2-B1.

Science
1. Neutrino oscillations (js/science/neutrino.mjs)
   - Three-flavour PMNS evolution with the standard parametrisation (θ12, θ13, θ23, δ_CP), Δm²21, Δm²31, normal and inverted ordering.
   - Constant-density matter (MSW) via exact diagonalisation of the 3×3 effective Hamiltonian (no two-flavour shortcut); electron density from a chosen ρ and Y_e.
   - Global-fit values from the most recent NuFIT release committed in js/science/data/nufit.mjs with version, date, 1σ ranges, and URL. Verify the values on nu-fit.org; do not use remembered numbers.
   - Presets with real baselines and peak energies: T2K (295 km), NOvA (810 km), DUNE (1300 km), JUNO (~52.5 km reactor ν̄e), with sources.
   - Tests: unitarity (Σ probabilities = 1 to 1e-12), two-flavour limit reproduction, vacuum limit at ρ = 0, CP-conjugate and T-conjugate relations, known matter-resonance energy.
2. Physical Higgs (js/science/higgs.mjs)
   - V(H) = −μ²|H|² + λ|H|⁴ with v = (√2 G_F)^(−1/2) ≈ 246.22 GeV from the PDG Fermi constant, λ = m_H²/(2v²), m_H from PDG.
   - One- or two-loop running of λ together with y_t, g1, g2, g3 from m_t to the Planck mass (Machacek–Vaughn coefficients; cite Buttazzo et al., JHEP 12 (2013) 089, arXiv:1307.3536). The renormalisation scale where λ turns negative and the stability / metastability / instability regions in the (m_t, m_H) plane.
   - Tests: λ(m_t) reproduces the input within scheme tolerance; the instability scale falls in the literature range for central PDG inputs; the flow is monotone where expected.

Visuals
- Neutrino: a "flavour ribbon" — three stacked bands whose heights are P(νe), P(νμ), P(ντ) along L/E (Figure Kit band marks), with an experiment baseline rail and a δ_CP dial; matter on/off comparison ghosted at 30 %.
- Higgs: a 3D Mexican-hat surface (Three.js, tokenised material, engraved iso-contours) with the vacuum ring, the radial (Higgs) mode and the Goldstone direction drawn as arrows; slider for the tree-level shape stays, but the physical point is pinned and labelled.
- Signature: the (m_t, m_H) stability phase diagram with the measured ellipse (data) over stability/metastability/instability regions (model), and a linked λ(μ) plot from M_Z to M_Pl that crosses zero. Linking to the RG and Planck modules via ConceptBridge.

Status
- Oscillation probabilities: established. Vacuum-stability extrapolation to M_Pl: effective (assumes no new physics). Say so in-canvas.

Files
- js/science/neutrino.mjs, js/science/higgs.mjs, js/science/data/nufit.mjs, js/science/data/pdg.mjs (masses, G_F, α_s(M_Z) with edition and uncertainties).
- js/labs/neutrino-lab.jsx, js/labs/higgs-lab.jsx, js/visualizations/sm/mexican-hat.mjs. mod-standard-model.jsx only wires them in (it must get shorter).
- Tests: test/neutrino.test.mjs, test/higgs.test.mjs; QA captures for both labs (desktop + mobile) in qa/manifest.json.

Acceptance
- npm test, npm run validate, audit-provenance, visual + a11y specs for the new captures.

Commit
"feat(sm): three-flavour oscillations, physical higgs and vacuum stability"
```

## V2-B2 — QFT: Lattice Fields, the Casimir Effect, and Full e⁺e⁻ Electroweak Scattering

**Phase** B · Lane 1 · **Depends on** B1 · **Closes** F-15 · **Signature** the Casimir cavity and the A_FB curve through LEP points

```text
You are implementing V2-B2.

Science
1. Lattice scalar field (js/science/lattice-field.mjs)
   - 1+1D (and optionally 2+1D) real scalar φ⁴ on a periodic lattice, symplectic leapfrog, seeded initial conditions; energy drift bound tested; free-field limit reproduces the lattice dispersion ω² = m² + (4/a²) sin²(ka/2).
   - The existing FieldLab and vacuum lab consume it instead of their in-component loops (and lose their Math.random kicks).
2. Casimir effect (js/science/casimir.mjs)
   - Ideal parallel plates: P = −π²ħc/(240 a⁴); energy per area; mode counting picture between plates vs outside with a smooth cutoff, showing that the cutoff dependence cancels in the difference.
   - Data overlay: Lamoreaux, PRL 78, 5 (1997) (sphere–plate, proximity-force approximation) and/or Bressi et al., PRL 88, 041804 (2002) (parallel plates). Commit the digitised points only if the source permits; otherwise plot the reported agreement level as a band and say so.
   - Status: established (measured), with the "vacuum energy" interpretation caveat (Jaffe 2005, arXiv:hep-th/0503158) written in the caption.
3. e⁺e⁻ → μ⁺μ⁻ with γ and Z⁰ (extend physics.mjs or a new js/science/electroweak.mjs)
   - Tree-level differential cross-section with γ, Z and interference; total σ(√s) and forward–backward asymmetry A_FB(√s) from 10 GeV to 200 GeV; Z parameters from pdg.mjs.
   - Overlay the LEP/SLD combined measurements near the pole (Phys. Rept. 427 (2006) 257, arXiv:hep-ex/0509008) as data points with errors.
   - Bhabha/Møller with s-, t-, u-channels and their interference, replacing the "t-channel pole only" limitation. Remove both rows from README Appendix P when done.

Visuals
- Feynman diagrams redrawn to TikZ-Feynman quality as SVG: fermion arrows at mid-segment, photon sine waves with integer half-periods per segment, gluon coils, vertex dots, momentum arrows; generated from a small diagram description (js/visualizations/qft/feynman-svg.mjs) with tests on path geometry.
- Signature 1: the Casimir cavity — two engraved plates, standing modes drawn as hairline sinusoids between them and a denser continuum outside, pressure readout in Pa at the chosen gap, log–log P(a) line through data.
- Signature 2: A_FB(√s) and σ(√s) stacked with shared √s axis, LEP points, the interference zero crossing annotated.

Files
- js/science/lattice-field.mjs, js/science/casimir.mjs, js/science/electroweak.mjs; js/labs/casimir-lab.jsx; js/visualizations/qft/feynman-svg.mjs. Move AmplitudeRoom and friends out of mod-qft.jsx into js/labs/amplitude-room.jsx as part of this prompt.
- Tests for each science module (limits: low-energy QED limit of the γZ formula, A_FB sign change, Casimir scaling a⁻⁴, energy conservation of leapfrog).

Acceptance
- npm test, npm run validate, audit-provenance, QA captures (desktop + mobile) for the Casimir lab and the electroweak plot.

Commit
"feat(qft): lattice fields, casimir lab and full electroweak scattering"
```

## V2-B3 — RG: Gauge-Coupling Unification and the Asymptotic-Safety Flow of Gravity

**Phase** B · Lane 1 · **Depends on** B2 · **Closes** F-14 · **Signature** "flow silk": a line-integral-convolution portrait of the gravitational RG flow

```text
You are implementing V2-B3.

Science
1. SM gauge couplings (js/science/gauge-running.mjs)
   - α1⁻¹, α2⁻¹, α3⁻¹ (GUT-normalised α1) from M_Z to M_Pl at one and two loops (Machacek–Vaughn), with top-threshold handling documented; inputs from pdg.mjs.
   - Optional MSSM running above a chosen SUSY scale (illustrative; status conjectural), showing near-unification (Amaldi, de Boer & Fürstenau, PLB 260 (1991) 447).
   - Tests: one-loop analytic solution matches the integrator; two-loop shifts have the literature sign and magnitude; the SM couplings do not meet at a point (assert the triangle area is non-zero).
2. Gravitational asymptotic safety in the Einstein–Hilbert truncation (js/science/asymptotic-safety.mjs)
   - Dimensionless Newton coupling g and cosmological constant λ with the optimised (Litim) cutoff beta functions (Litim, PRL 92 (2004) 201301, arXiv:hep-th/0312114; Reuter, PRD 57 (1998) 971).
   - Find the Gaussian and non-Gaussian fixed points numerically; compare with the published NGFP (the pack's author's reading: g* ≈ 0.707, λ* ≈ 0.193, θ ≈ 1.475 ± 3.043 i; verify against the paper) and record the comparison in the ledger.
   - Classify trajectories (Type Ia/IIa/IIIa per Reuter–Weyer) and the separatrix to the GFP.
   - Status: conjectural framework, computed in a truncation — the truncation and scheme dependence go into the caption.
   - Replace the toy "asymptotic-safety-style" preset with this computed flow; keep the pedagogical toy only if renamed and labelled schematic.

Visuals
- Signature: a line-integral-convolution (LIC) texture of the (g, λ) beta-function field computed on the GPU from the same beta functions (WebGL2 fragment shader with a CPU reference for tests and the software renderer), tinted by the diverging palette for the sign of β_g, with fixed points engraved, separatrices as hairlines, a selected trajectory as the single focal line, and spiral approach to the NGFP visible.
- Unification: three α⁻¹ lines over log₁₀(μ/GeV) with uncertainty bands from the input errors and the "near-miss" triangle magnified in an inset.
- The 3D flow field lab gains the gravitational flow as a model option.

Files
- js/science/gauge-running.mjs, js/science/asymptotic-safety.mjs, js/visualizations/rg/lic-field.mjs (+ CPU reference), js/labs/unification-lab.jsx, js/labs/gravity-flow-lab.jsx.
- Tests: test/gauge-running.test.mjs, test/asymptotic-safety.test.mjs, test/lic-field.test.mjs (CPU LIC on a known field: streamline-aligned variance ratio).

Acceptance
- npm test, npm run validate, audit-provenance, captures for both labs, reduced-motion (LIC animation phase frozen).

Commit
"feat(rg): gauge unification and einstein-hilbert asymptotic safety flow"
```

## V2-B4 — GR: Penrose Diagrams, Tidal Geometry, and the Tested Universe

**Phase** B · Lane 2 · **Depends on** A3 · **Closes** F-16 · **Signature** an engraved Penrose-diagram atlas

```text
You are implementing V2-B4.

Science
1. Conformal diagrams (js/science/conformal.mjs)
   - Exact compactification maps for Minkowski, Schwarzschild (via Kruskal–Szekeres), and the maximally extended Reissner–Nordström / Kerr (axis) causal structure; light cones stay at 45°.
   - Plot worldlines computed in Schwarzschild coordinates (radial infall, static observer, outgoing null ray) and map them through the exact transformations; tests check null rays map to ±45° lines and the horizon maps to the diagonal.
2. Tidal geometry (js/science/tidal.mjs)
   - Schwarzschild tidal tensor eigenvalues (−2GM/r³ radial, +GM/r³ transverse) in SI; geodesic deviation integration of a ring of test particles; "spaghettification radius" for a human-scale body for stellar and supermassive masses.
3. Embedding diagram: exact Flamm paraboloid z(r) = 2√(r_s(r − r_s)) for the spatial slice, replacing the rubber-sheet look where it claims geometry; the existing grid keeps its schematic label.
4. Observational tests panel, every number in js/science/data/gr-tests.mjs with citation:
   - Shapiro delay and Cassini γ − 1 = (2.1 ± 2.3) × 10⁻⁵ (Bertotti, Iess & Tortora, Nature 425 (2003) 374).
   - Gravitational redshift: Pound–Rebka (1960) and GPS clocks (≈ +38 μs/day net), computed from the actual orbit radius.
   - S2 orbit around Sgr A*: GRAVITY Collaboration, A&A 636 (2020) L5, Schwarzschild precession f_SP = 1.10 ± 0.19.
   - Mercury and limb deflection stay (already tested).
   - Each test shows: prediction from a pure function, measurement with uncertainty, and the residual in σ.

Visuals
- Signature: the Penrose atlas — three conformal diagrams side by side as engraved ink on deep surface: thin coordinate lines (t = const, r = const) in --ink-faint, horizon and singularity in status colours, one animated worldline as the focal element with its light cone drawn at each tick. Hover a region to see its name (I, II, III, IV, i⁰, i±, ℐ±).
- Tidal lab: a ring of particles deforming into an ellipse under the computed tensor; readouts of stretch in m/s² per metre.
- Tested-universe panel: a "pull plot" (Figure Kit points with error bars around zero) of all GR tests in σ — a compact, beautiful, honest summary.

Files
- js/science/conformal.mjs, js/science/tidal.mjs, js/science/data/gr-tests.mjs, js/labs/penrose-atlas.jsx, js/labs/tidal-lab.jsx, js/labs/gr-tests-panel.jsx. Split CurvatureEngine3D out of mod-gr.jsx into js/visualizations/gr/curvature-engine.mjs as part of this prompt.
- Tests for each science module.

Acceptance
- npm test, npm run validate, audit-provenance, captures for each new lab, mod-gr.jsx under 1,600 lines after the split.

Commit
"feat(gr): penrose atlas, tidal geometry and observational tests"
```

## V2-B5 — Planck Frontier: the Constraint Plane

**Phase** B · Lane 2 · **Depends on** B4 · **Closes** F-12 (constraints part) · **Signature** "Map of the Unseen"

```text
You are implementing V2-B5.

Science
1. A committed constraint dataset js/science/data/constraints.mjs: each entry has the probed length or energy scale, the quantity constrained, the bound with confidence level, the experiment, year, and citation. At minimum:
   - Eöt-Wash inverse-square-law test to 52 μm (Lee et al., PRL 124 (2020) 101101).
   - LHC energy reach (√s = 13.6 TeV) and contact-interaction / large-extra-dimension bounds from a cited ATLAS or CMS paper.
   - Fermi-LAT GRB 090510 linear Lorentz-violation bound E_QG,1 > 1.2 E_Pl (Abdo et al., Nature 462 (2009) 331).
   - LIGO/Virgo graviton-mass bound from GWTC-3 tests of GR (cite the paper and value).
   - EHT horizon-scale imaging scale (link B7).
   - BICEP/Keck tensor-to-scalar bound r₀.₀₅ < 0.036 at 95 % CL (PRL 127 (2021) 151301) mapped to the inflationary energy scale V^{1/4}.
2. Pure helpers: length ↔ energy (ħc), probe energy for a given resolution (exists), Planck units (exist).
3. Spin-foam upgrade: the LQG area spectrum 8πγℓ_P²√(j(j+1)) with γ from the black-hole entropy matching (state the convention and the cited value), and the volume spectrum for the four-valent node via a cited method; mark both conjectural.

Visuals
- Signature "Map of the Unseen": a log–log plane, length scale (10⁻³⁵ m → 10²⁶ m) against energy, with the Planck length and energy as engraved rules, each experiment as a filled exclusion region (hatched, categorical palette) with label and citation on hover/focus, the region no experiment has reached as the single dark focal void, and the atlas's modules placed as markers where they live. The ScaleLadder scroll drives a cursor across this plane.
- The Planck fluctuation canvas stays, labelled schematic, and is classified decoration in scientific mode only if it carries no model content.

Files
- js/science/data/constraints.mjs, js/labs/constraint-plane.jsx (Figure Kit), spin-networks.mjs extensions, test/constraints-data.test.mjs (every entry has citation, units parse, bounds are finite), spin-foam spectrum tests.

Acceptance
- npm test, npm run validate, audit-provenance, captures desktop + mobile.

Commit
"feat(planck): constraint plane and lqg spectra"
```

## V2-B6 — Approaches: Causal Sets, CDT, and the Spectral-Dimension Comparison

**Phase** B · Lane 1 · **Depends on** B3 · **Closes** F-13 · **Signature** the spectral-dimension chart across programs

```text
You are implementing V2-B6.

Science
1. Causal sets (js/science/causal-sets.mjs)
   - Poisson sprinkling into a causal diamond of 1+1 and 3+1 Minkowski at density ρ (seeded); causal relation matrix; transitive reduction (links); longest-chain proper-time estimate; Myrheim–Meyer dimension estimator from the ordering fraction.
   - Tests: estimator returns ≈ 2 and ≈ 4 for the respective sprinklings within the finite-N error you measure; longest chain scales as ρ^{1/d} × proper time.
2. 2D causal dynamical triangulations (js/science/cdt-2d.mjs)
   - Monte Carlo of 2D CDT with the standard (2,2) and (2,4) moves, seeded; measure the spectral dimension by a diffusion process on the dual graph.
   - Compare with the 4D CDT result d_s ≈ 4.02 at large scales and ≈ 1.80 at short scales (Ambjørn, Jurkiewicz & Loll, PRL 95 (2005) 171301) — quoted as data, not computed; 2D is computed and labelled as the 2D toy it is.
3. Spectral-dimension data module js/science/data/spectral-dimension.mjs with the UV values reported by CDT, asymptotic safety (Lauscher & Reuter 2005), LQG/spin foams (Modesto 2009), Hořava–Lifshitz (Hořava 2009), causal sets, with citations; overview from Carlip, CQG 34 (2017) 193001.
4. String theory: the open bosonic string spectrum α′M² = N − 1 with level degeneracies from the partition function, the tachyon flagged, the critical dimension D = 26 from the normal-ordering constant via ζ(−1) = −1/12 shown as a derivation stepper (C2 will reuse it). Status conjectural for physical interpretation, established as mathematics.
5. Comparator: add causal sets and CDT rows to data.jsx with status conjectural and the same aspect columns.

Visuals
- Signature: the spectral-dimension chart — d_s against log(diffusion scale) with each program's reported curve or UV/IR endpoints (data/model distinguished), converging toward 2 in the UV; a hatched band reminds that definitions differ between programs (state this in-canvas).
- Causal-set lab: sprinkled points in a diamond drawn as small engraved dots, links as hairlines, the longest chain as the focal golden path; density slider; dimension estimate readout with its finite-N error.
- CDT lab: the triangulation strip rendered with time slices as horizontal bands and the diffusion heatmap.
- Replace the unseeded MicrostructureViz graph with the generated causal set / spin network.

Files
- js/science/causal-sets.mjs, js/science/cdt-2d.mjs, js/science/data/spectral-dimension.mjs, js/science/string-spectrum.mjs, js/labs/causal-set-lab.jsx, js/labs/cdt-lab.jsx, js/labs/spectral-dimension-chart.jsx; tests for each.

Acceptance
- npm test (CDT Monte Carlo tests bounded to < 2 s), npm run validate, audit-provenance, captures.

Commit
"feat(approaches): causal sets, cdt and the spectral-dimension comparison"
```

## V2-B7 — Black Holes: Evaporation, Greybody Spectra, and the Shadow Measured

**Phase** B · Lane 3 · **Depends on** A3 · **Closes** F-09, F-10, F-17 · **Signature** ray-traced shadow with the Bardeen curve and EHT ring overlaid

```text
You are implementing V2-B7.

Science
1. Evaporation dynamics (js/science/evaporation.mjs)
   - M(t) for Schwarzschild with a stated emission model (photons + gravitons, or the full SM-species table of Page 1976 / MacGibbon–Webber, as cited), S_BH(t), coarse-grained S_rad(t), the Hawking (monotone) curve and the Page curve as min(S_rad, S_BH); Page time computed, not hardcoded. Compare with Page, JCAP 09 (2013) 028, arXiv:1301.4995, and record the comparison.
   - pageCurveEntropy in physics.mjs becomes a thin wrapper or is deprecated with tests updated.
   - Status: Hawking curve effective; Page curve as unitarity expectation conjectural→ the island/replica-wormhole derivation (Penington 2019; Almheiri et al. 2019) is cited as a semiclassical calculation in specific models.
2. Greybody factors (js/science/greybody.mjs)
   - Low-frequency limits (s = 0: σ → horizon area; s = 1, 2 suppression) and the geometric-optics limit σ → 27πG²M²/c⁴; a cited tabulation or a numerical solution of the Regge–Wheeler / Teukolsky radial problem for s = 0 at least. Tests on both limits.
   - The Hawking spectrum plot shows the pure blackbody as a dashed reference and the greybody-corrected spectrum as the model.
3. Kerr shadow outline (js/science/kerr-shadow.mjs)
   - Bardeen critical curve (α, β) on the observer's sky from the spherical photon orbits, for any spin and inclination; tests: Schwarzschild radius √27 M; extremal edge flattening; symmetry.
   - Overlay on the ray-traced observatory image and measure the agreement (pixel-space distance between the traced shadow edge and the curve) as a regression test on the software renderer.
4. EHT comparison (js/science/data/eht.mjs)
   - M87*: ring diameter 42 ± 3 μas, mass and distance as published (EHT 2019 Paper I/VI, ApJL 875 L1/L6); Sgr A*: 51.8 ± 2.3 μas (EHT 2022 Paper I, ApJL 930 L12).
   - Predicted angular shadow diameter from M and D through kerr-shadow.mjs; show prediction vs measurement with the published caveat that ring ≠ shadow (calibration factor) in the caption.
5. Photon sub-rings: Lyapunov demagnification e^{−γ} per half-orbit (γ = π for Schwarzschild; Johnson et al., Sci. Adv. 6 (2020) eaaz1310), labelled with the observatory's image-order readout.

Visuals
- Signature: the observatory image with three toggleable engraved overlays — Bardeen curve (model, hairline), EHT ring with error band scaled to the chosen target (data), and n = 1, 2 photon sub-ring markers — plus a mini figure "predicted vs measured" in μas. In scientific mode post effects are off and the overlays are crisp at any DPR.
- Page curve figure: S_BH falling, Hawking curve rising, Page curve as the single focal line with the Page time rule, evaporation progress linked to the Hawking lab.

Files
- js/science/evaporation.mjs, js/science/greybody.mjs, js/science/kerr-shadow.mjs, js/science/data/eht.mjs, overlay module js/visualizations/kerr/shadow-overlay.mjs; tests for each; README Appendix P updated.

Acceptance
- npm test, npm run validate, audit-provenance, kerr-observatory spec extended with overlay captures, no regression of the existing three Kerr reference baselines.

Commit
"feat(bh): evaporation, greybody spectra and measured shadows"
```

## V2-B8 — Experiments: Post-Newtonian Waveforms, Matched Filtering, and the Observational Net

**Phase** B · Lane 3 · **Depends on** B5, B7 · **Closes** F-11, F-12 · **Signature** a Q-transform with the best-fit template riding the real chirp

```text
You are implementing V2-B8.

Science
1. Waveforms (js/science/pn-waveform.mjs)
   - TaylorT4 phasing to 3.5PN for non-spinning (optionally aligned-spin) binaries (Blanchet, Living Rev. Rel. 17 (2014) 2; Buonanno et al., PRD 80 (2009) 084043), stopped at a stated frequency, plus a phenomenological merger blend.
   - Remnant mass and spin from a cited numerical-relativity fit, and the ringdown ℓ = m = 2 QNM frequency and damping time from Berti, Cardoso & Will, PRD 73 (2006) 064030 fits. The ringdown is no longer a fixed 190 Hz / 60 ms.
   - The synthetic generator in physics.mjs and gravitational-waves.mjs switches to this model; provenance stays "synthetic" and the model name is exported.
   - Tests: Newtonian limit of the phase; chirp-mass recovery from the frequency evolution; QNM fit values for a known remnant; time-to-coalescence consistency.
2. Matched filtering (js/science/matched-filter.mjs)
   - Frequency-domain matched filter with the existing whitening PSD, a small seeded template bank over chirp mass, SNR time series, peak SNR and recovered chirp mass, run on the bundled GWOSC fixture of GW150914 in a worker.
   - Report recovered chirp mass vs the published value with honest error (template-bank resolution); never claim a detection statistic beyond what is computed.
3. Observational-net instruments, replacing the four prose panels with figures built on js/science/data/constraints.mjs (from B5) and eht.mjs (from B7):
   - Fermi-LAT time-of-flight: Δt vs E for a linear modified dispersion at E_QG = E_Pl compared with the GRB 090510 bound.
   - CMB tensor modes: the n_s–r plane with the Planck 2018 + BICEP/Keck contours (cite; use published contour points only if licensing permits, otherwise the 1D bound) and a few inflation-model predictions computed from slow-roll formulas (status: model).
   - Short-range gravity: Yukawa α–λ exclusion plot from Eöt-Wash.
   - EHT: link to the B7 comparison.
4. Collider: a small real dimuon invariant-mass histogram from CMS Open Data (CC0; cite the record DOI) committed as a fixture, overlaid on the synthetic InvariantMassLab, with J/ψ, Υ, Z peaks labelled. Real and synthetic are never mixed in one series.

Visuals
- Signature: the whitened GW150914 strain as a Q-transform (sequential palette, Figure Kit heatmap) with the best-fit template's frequency track as the focal engraved line, the SNR time series beneath sharing the time axis, and the audio console driving one playhead across all three.
- Each observational-net figure follows the figure grammar with status and citation in its caption.

Files
- js/science/pn-waveform.mjs, js/science/matched-filter.mjs, js/workers/matched-filter.worker.mjs, js/science/data/cms-dimuon.mjs (+ fixture), js/labs/observational-net/*.jsx; move GWAnalysisTheatre out of mod-experiments.jsx into js/labs/gw-theatre.jsx.
- Tests: test/pn-waveform.test.mjs, test/matched-filter.test.mjs (injection–recovery on synthetic noise), data tests.

Acceptance
- npm test, npm run validate, audit-provenance, gw-instrument and gwosc specs, new captures; mod-experiments.jsx under 1,000 lines.

Commit
"feat(exp): pn waveforms, matched filtering and the observational net"
```

---

## V2-C1 — Chapter Identity and the Atlas Map

**Phase** C · **Depends on** B1–B8 · **Closes** — · **Signature** eight chapter covers and a living knowledge map

```text
You are implementing V2-C1.

Objective
Give every module a recognisable, scientifically generated visual identity and turn the overview into a navigable map of the argument.

Work
- Chapter covers: each ModuleHeader gets a hero band rendered from that module's own science core, seeded and deterministic, at most 25 % of first-viewport height on desktop and collapsed on mobile:
  01 SM — the PMNS flavour ribbon; 02 QFT — the lattice field heightfield coloured by local energy density; 03 RG — the LIC flow silk; 04 GR — the Penrose atlas; 05 Planck — the constraint plane; 06 Approaches — the spectral-dimension convergence; 07 BH — the Kerr image with Bardeen curve; 08 Exp — the GW150914 Q-transform.
  Each cover is a static render (pre-rendered at build-free capture time into docs/covers/ and served as AVIF/WebP with PNG fallback) with a live upgrade on interaction, so first paint stays cheap.
- Atlas map on the overview: a node–link graph of concepts (modules, key results, open problems) whose edges are the ConceptBridge links and whose node rule colour is the status; laid out deterministically (seeded force layout, committed positions); keyboard navigable; each node deep-links. It replaces nothing that tests depend on; place it under the Arena of Scales.
- A consistent chapter number system (01–08) in mono with the status distribution of the chapter shown as a five-segment bar.

Acceptance
- npm test, npm run validate, a11y spec (map is operable by keyboard and has a text alternative listing nodes and edges), captures; LCP on the overview not worse than the A0 baseline.

Commit
"feat(narrative): chapter covers and the atlas map"
```

## V2-C2 — Living Equations

**Phase** C · **Depends on** C1 · **Closes** — · **Signature** terms that light up their scene counterparts

```text
You are implementing V2-C2.

Work
- Term-level linking: FormulaCard and PaperEq accept a term map; KaTeX output is annotated with \htmlData / \htmlClass so that each symbol is focusable. Focusing r_s in the Schwarzschild card highlights the horizon in the BH scene and shows its current value with units (ConceptBus, already typed). Every module's primary formula card gets at least two linked terms.
- Derivation stepper: a reusable component that walks a derivation step by step with the changed term highlighted and a one-line justification per step. Ship at least: Planck length from ħ, G, c by dimensional analysis; r_s from the escape-velocity heuristic vs the exact metric (labelled); the bosonic-string critical dimension (from B6); the Schwarzschild shadow √27 M (from B7).
- Live dimensional analysis: each formula declares its symbols' dimensions; a pure checker (js/science/dimensions.mjs) verifies both sides agree; npm test fails on a dimensionally inconsistent formula card.

Acceptance
- npm test (dimension checker over all registered formula cards), npm run validate, premium-interactions spec extended for term focus by keyboard.

Commit
"feat(equations): term linking, derivation stepper and dimensional checks"
```

## V2-C3 — Guided Tours, Teacher Mode, and Turkish/English

**Phase** C · **Depends on** C2 · **Closes** F-20 · **Signature** none

```text
You are implementing V2-C3.

Work
- Tours: declarative tour manifests (js/tours/*.mjs) that chain views, camera shots, parameter states and a question per step; deep-linkable (?tour=…&step=…), resumable, reduced-motion safe. Ship three: "Why gravity resists quantisation" (20 min), "What a black hole image measures" (10 min), "Hearing spacetime" (8 min).
- Teacher mode: a printable worksheet per tour generated from the manifest (questions, expected readouts, references), using D1's print styles once available; until then a plain print stylesheet.
- i18n: a tiny dictionary-based layer (js/i18n/) with English and Turkish; UI chrome, module headers, captions, tours, and glossary translated; physics terms follow Turkish physics usage (e.g. "olay ufku", "kara cisim ışıması", "yeniden normalizasyon"); KaTeX unchanged. Language follows ?lang= then navigator.language; html lang updates. A missing key falls back to English and is reported by a test.

Acceptance
- npm test (i18n completeness for both languages, tour manifest validation), npm run validate, a Playwright spec running each tour end-to-end in both languages.

Commit
"feat(narrative): guided tours, teacher mode and turkish localisation"
```

---

## V2-D1 — Publishing Studio (absorbs v1 Prompt 11)

**Phase** D · **Depends on** C1 · **Closes** F-01 (export) · **Signature** journal-ready figures

```text
You are implementing V2-D1. Read v1 Prompt 11 in docs/superpowers/plans/2026-10-08-ultra-realistic-atlas-prompts.md; its requirements are normative here except where this prompt is stricter.

Additions to v1 Prompt 11
- Figure export uses the Figure Kit's SVG renderer for every 2D figure (true vector axes and KaTeX as SVG paths), at journal column widths 85 mm / 174 mm, with a publication style that switches to the Print theme tokens, embeds fonts or converts text to outlines on request, and writes a sidecar JSON with provenance, seed and data hash.
- A "data behind the figure" CSV export for every Figure Kit figure.
- The existing Kerr ultra capture (2K/4K/8K) is reached from the same studio; do not duplicate it.

Acceptance
- As v1 Prompt 11, plus: SVG output validates as XML, contains no raster for vector figures, and round-trips its data hash.

Commit
"feat: add publication export studio"
```

## V2-D2 — Runtime: Precompiled JSX, Production React, Workers, Offline (absorbs v1 Prompt 12 minus themes)

**Phase** D · **Depends on** D1 · **Closes** F-18, F-01 (PWA/workers) · **Signature** a fast first paint

```text
You are implementing V2-D2. v1 Prompt 12's Performance and PWA sections are normative here.

Additions
- Precompiled JSX without a bundler: scripts/compile-jsx.mjs uses the vendored Babel in Node to transpile each .jsx file one-to-one into dist-free sibling output under js/compiled/ (committed), with a CI check that the committed output matches the sources byte-for-byte. index.html loads the compiled classic scripts; ?dev=1 keeps the in-browser Babel path for authoring. Babel standalone is no longer loaded in production.
- Ship react.production.min.js / react-dom.production.min.js (self-hosted, pinned, SRI) in production; development builds only with ?dev=1.
- Move matched filtering (B8), CDT Monte Carlo (B6), LIC CPU reference, and long RG integrations to module workers with transferable buffers.
- Measure against the A0 baseline and record in docs/performance.md: cold-load JS bytes, time to first Arena frame, Babel time (must be 0 in production).

Acceptance
- npm test, npm run validate, performance-pwa spec, every existing Playwright spec green on the compiled path, offline reload verified under the Pages subpath.

Commit
"feat: precompiled runtime, workers and offline atlas"
```

## V2-D3 — Themes and Accessibility+ (absorbs v1 Prompt 12 themes)

**Phase** D · **Depends on** D2 · **Closes** F-05 (themes) · **Signature** Blueprint theme

```text
You are implementing V2-D3. v1 Prompt 12's Themes section is normative here.

Additions
- Themes are token sets over styles/tokens.css: Observatory (current), Blueprint (Prussian-blue surface, white engraved linework, measured grid, no glow; every figure reads like a technical drawing), Print (white surface, black ink, status colours re-validated on white, decorations off). Canvas and Three.js scenes follow via the qga:theme event from A1.
- Accessibility+: each Figure Kit figure gains an optional data sonification (pitch ∝ value along x, with a reference tone at a labelled level) and the text summary from A2 becomes an aria-live description when the parameters change (debounced). Every 3D scene's text alternative names its model, status and current key values.
- Contrast and CVD tests from A1 run for every theme.

Acceptance
- npm test, npm run validate, a11y spec in all three themes, visual baselines for Blueprint and Print for one figure per module.

Commit
"feat: observatory, blueprint and print themes with accessible figures"
```

## V2-D4 — Scholarly Release

**Phase** D · **Depends on** D3 · **Closes** F-19 · **Signature** a README that reads like an abstract

```text
You are implementing V2-D4.

Work
- README restructure: at most ~400 lines — hero, 30-second GIF/video loop (WebM + poster, self-hosted, < 6 MB), what it is / what it is not, one screenshot per chapter cover, run locally, cite, licence. Move the appendices and module notes to docs/ (docs/science/, docs/guide/), keeping every anchor that external links may use as a stub pointing to the new location. Update validate-repo.mjs rules accordingly.
- Fix the Roadmap: it points to this pack and the ledger.
- Whitepaper v2: new sections for the Figure Kit, provenance coverage, the new science modules with their verification numbers from the ledger evidence; both the in-app paper view and docs/whitepaper.md.
- Archival: a .zenodo.json and the CITATION.cff fields needed for a Zenodo release (the maintainer creates the DOI; do not invent one). A JOSS-style paper.md + paper.bib draft under paper/ (the maintainer decides whether to submit).

Acceptance
- npm test (citation tests still pass), npm run validate, no broken internal links (add a link checker to validate-repo.mjs).

Commit
"docs: scholarly release structure"
```

## V2-D5 — Release Gate (absorbs v1 Prompt 13)

**Phase** D · **Depends on** every prompt above · **Closes** F-01 (gate) · **Signature** none

```text
You are implementing V2-D5. v1 Prompt 13 is normative here in full.

Additions
- The scientific gate includes every verification number recorded in the ledger by B1–B8 (e.g. NGFP agreement, shadow-edge agreement, chirp-mass recovery, Myrheim–Meyer dimension), re-measured and compared to the ledger values.
- The visual gate includes the Art Direction Bible: automated checks for colour literals (A1 rule), text over 10 px floor, glow on text (no text-shadow blur on .axis/.label/.readout classes), Figure Kit usage for all 2D plots, and a manual review checklist for focal-point and layer classification per figure, with screenshots in docs/release-verification.md.
- All findings F-01…F-20 are closed in the ledger, or explicitly accepted with rationale.

Acceptance
- As v1 Prompt 13.

Commit
"release: verify horizon v2"
```

---

## Coverage Matrix

| Capability | Prompt |
|---|---|
| Baseline numbers for every later claim | A0 |
| Token system, CSS extraction, colour-literal ban | A1 |
| Unified plotting kit with KaTeX overlay, SVG renderer, text summaries | A2 |
| 100 % provenance, seeded model layers, audit script | A3 |
| Three-flavour ν with matter, physical Higgs, vacuum stability | B1 |
| Lattice φ⁴, Casimir, γ/Z interference and A_FB vs LEP, TikZ-grade diagrams | B2 |
| Two-loop gauge running, Einstein–Hilbert asymptotic safety, LIC flow | B3 |
| Penrose diagrams, tidal tensor, Flamm paraboloid, GR test pull plot | B4 |
| Constraint plane, LQG area/volume spectra | B5 |
| Causal sets, 2D CDT, spectral-dimension comparison, string spectrum | B6 |
| Evaporation-derived Page curve, greybody, Bardeen curve, EHT | B7 |
| 3.5PN waveforms, QNM ringdown, matched filter, observational-net figures, CMS open data | B8 |
| Chapter covers, atlas map | C1 |
| Term-linked equations, derivation stepper, dimensional checks | C2 |
| Tours, teacher worksheets, Turkish localisation | C3 |
| Publishing studio (v1 P11) | D1 |
| Precompiled JSX, production React, workers, PWA (v1 P12) | D2 |
| Themes, accessible figures (v1 P12) | D3 |
| README, whitepaper v2, Zenodo/JOSS preparation | D4 |
| Release gate (v1 P13) | D5 |
