# HORIZON v2 — Sequential Prompt Pack

Thirty-six prompts, executed **one at a time, in order**. Each file is a complete, self-contained prompt: copy it into a fresh agent session, and it states everything the agent needs (context verified in the code, exact files, interfaces, formulas with numeric test targets, acceptance commands, and when to stop). Progress, evidence and decisions are recorded in the shared ledger, [`docs/superpowers/ledger/`](../../ledger/README.md); `npm test` rejects a ledger that starts a prompt before its predecessor is done.

## What this pack builds

**Formula-first rendering.** One definition per equation (Formula Core, S03) compiles to:
- a tested float64 evaluator;
- a float32 GPU-safety check in Node;
- addressable KaTeX;
- a TSL node graph.

The pixels on screen and the equation in the card are the same expression, verified numerically on the GPU (S03, S10). Focusing a term of an equation paints that term over the scene.

**Three.js at full performance.** The pack uses verified r186 capabilities:
- One `WebGPURenderer` per page drawing into every scene canvas through `CanvasTarget`, so there is one shader and pipeline cache (S04, S05).
- Frames only when something changes.
- At most four WebGL2 contexts.
- A quality governor driven by GPU timestamp queries.
- Storage-buffer compute instead of CPU uploads (S08).
- Constant-width engraved lines (`Line2NodeMaterial`, S06).
- One TSL material kit instead of ad hoc GLSL (S07).

**A visual language.** "The Observatory Instrument" (S02):
- light only where physics emits;
- geometry engraved;
- one focal element per figure;
- colour-blind-validated palettes;
- every 2D plot through one Figure Kit with KaTeX labels (S09).

**Scientific depth in every module** (S12–S28):
- three-flavour neutrinos in matter;
- the physical Higgs and vacuum metastability;
- GPU lattice φ⁴, the Casimir cavity, γ/Z electroweak scattering vs LEP;
- gauge unification and the asymptotic-safety flow as a GPU LIC "flow silk";
- exact Penrose diagrams, tidal geometry and the Flamm embedding;
- the map of experimental constraints;
- causal sets, CDT and the spectral-dimension comparison;
- the evaporation-derived Page curve and greybody spectra;
- the Bardeen shadow vs EHT;
- 3.5PN waveforms and matched filtering on GW150914;
- the observational net as instruments.

**Then** chapter identity, living equations, tours in Turkish and English, publishing, the production runtime, themes, the scholarly release, and the release gate (S29–S36). v1 prompts 11–13 are absorbed into S32–S34 and S36.

## Order

| # | Prompt | Title |
|---|---|---|
| 01 | [S01](S01-baseline-harness.md) | Measurement Harness and Baseline |
| 02 | [S02](S02-design-tokens.md) | Art Direction Document, Design Tokens and Stylesheet Extraction |
| 03 | [S03](S03-formula-core.md) | Formula Core: One Definition → JS, KaTeX and TSL |
| 04 | [S04](S04-shared-stage.md) | Shared GPU Stage: One Renderer per Page, Frames on Demand |
| 05 | [S05](S05-stage-migration.md) | Migrate Every Scene to the Shared Stage |
| 06 | [S06](S06-engraved-lines.md) | Engraved Line System |
| 07 | [S07](S07-tsl-materials.md) | TSL Material Kit and the End of Ad Hoc GLSL |
| 08 | [S08](S08-compute-particles.md) | GPU Compute Particle Kit |
| 09 | [S09](S09-figure-kit.md) | Figure Kit: One Scientific 2D Plotting System |
| 10 | [S10](S10-formula-lens.md) | Formula Lens: Terms You Can See |
| 11 | [S11](S11-provenance-sweep.md) | Provenance Coverage, Layer Classes and Determinism |
| 12 | [S12](S12-sm-neutrinos.md) | Standard Model I: Three-Flavour Oscillations in Matter |
| 13 | [S13](S13-sm-higgs.md) | Standard Model II: The Physical Higgs and Vacuum Stability |
| 14 | [S14](S14-qft-lattice.md) | QFT I: GPU Lattice Field Theory |
| 15 | [S15](S15-qft-casimir.md) | QFT II: The Casimir Cavity |
| 16 | [S16](S16-qft-electroweak.md) | QFT III: Electroweak e⁺e⁻ Scattering and Publication-Grade Feynman Diagrams |
| 17 | [S17](S17-rg-unification.md) | RG I: Running of the Standard-Model Gauge Couplings |
| 18 | [S18](S18-rg-asymptotic-safety.md) | RG II: Asymptotic Safety and the Flow Silk |
| 19 | [S19](S19-gr-penrose.md) | GR I: The Penrose Atlas |
| 20 | [S20](S20-gr-tidal-embedding.md) | GR II: Tidal Geometry, the Flamm Embedding and the Tested Universe |
| 21 | [S21](S21-planck-constraints.md) | Planck Frontier: The Map of the Unseen |
| 22 | [S22](S22-approaches-causal-sets.md) | Approaches I: Causal Sets |
| 23 | [S23](S23-approaches-cdt-spectral.md) | Approaches II: CDT, the Spectral Dimension, and the String Spectrum |
| 24 | [S24](S24-bh-evaporation.md) | Black Holes I: Evaporation Dynamics and Greybody Spectra |
| 25 | [S25](S25-bh-shadow-eht.md) | Black Holes II: The Shadow, Measured |
| 26 | [S26](S26-gw-waveforms.md) | Gravitational Waves I: Post-Newtonian Waveforms and a GPU Spacetime Field |
| 27 | [S27](S27-gw-matched-filter.md) | Gravitational Waves II: Matched Filtering on Real Data |
| 28 | [S28](S28-exp-observational-net.md) | Experiments III: The Observational Net as Instruments |
| 29 | [S29](S29-chapter-covers.md) | Chapter Identity and the Atlas Map |
| 30 | [S30](S30-living-equations.md) | Living Equations: Every Formula Card from Formula Core |
| 31 | [S31](S31-tours-i18n.md) | Guided Tours, Teacher Mode, and Turkish |
| 32 | [S32](S32-publishing-studio.md) | Publishing Studio |
| 33 | [S33](S33-runtime-offline.md) | Production Runtime, Workers and Offline |
| 34 | [S34](S34-themes-a11y.md) | Themes and Accessible Figures |
| 35 | [S35](S35-scholarly-release.md) | Scholarly Release Structure |
| 36 | [S36](S36-release-gate.md) | Release Gate |

## Audit findings

Verified against commit `9013fba` while the pack was written. Each prompt header names the findings it closes; the ledger tracks closure.

| ID | Finding | Evidence | Closed by |
|---|---|---|---|
| F-01 | v1 prompts 11–13 never executed (export, PWA/workers/themes, release gate) | no js/export, service-worker.js, js/workers, styles/themes.css, docs/release-verification.md | S32, S33, S34, S36 |
| F-02 | Provenance registry covers 9 views while 28 VizCaption panels exist | grep VIEW_ID vs <VizCaption | S11 |
| F-03 | Math.random feeds labelled science figures; starfields unseeded | mod-approaches.jsx:156, mod-qft.jsx:268, mod-gr.jsx:1689, mod-experiments.jsx:685 | S11 |
| F-04 | ~199 hex literals plus per-canvas palettes and font strings in module code | grep over js/*.jsx | S02 |
| F-05 | Nearly all CSS inline in a 2,332-line index.html; no light or print theme | index.html | S02, S34 |
| F-06 | Every 2D plot hand-rolls axes, ticks and legends | canvas code in mod-*.jsx | S09 |
| F-07 | Neutrino lab is two-flavour vacuum only | mod-standard-model.jsx:496 | S12 |
| F-08 | Higgs potential in toy units; no vacuum-stability story | mod-standard-model.jsx:436 | S13 |
| F-09 | Page curve hardcodes slope 1.7 and a tent function | mod-blackholes.jsx:87, physics.mjs:312 | S24 |
| F-10 | Hawking spectrum is a pure blackbody; no greybody factors | physics.mjs:321 | S24 |
| F-11 | Synthetic GW: Newtonian chirp, ad hoc amplitude clamp, fixed 190 Hz/60 ms ringdown; no matched filter | physics.mjs:655, gravitational-waves.mjs:458 | S26, S27 |
| F-12 | The observational net (CMB, ν/DM, QG phenomenology, EHT) is prose only | mod-experiments.jsx:1842 | S21, S28 |
| F-13 | Approaches cover five programs; no computed program, no quantitative comparison | data.jsx:108–190 | S22, S23 |
| F-14 | RG limited to one-loop QED/QCD and toy fixed points | physics.mjs rgBeta, rg-flow-3d.mjs | S17, S18 |
| F-15 | Amplitude room is t-channel-pole-only and omits γ–Z interference | README Appendix P | S16 |
| F-16 | GR engine on a display constant; few observational tests; no Penrose diagrams; rubber-sheet well | physics.mjs:70, Appendix P | S19, S20 |
| F-17 | Kerr observatory lacks the Bardeen-curve overlay and an EHT comparison | kerr-observatory.mjs | S25 |
| F-18 | Production ships React development builds and transpiles JSX in the browser with Babel (3.0 MB) | index.html:2301–2303, bootstrap.mjs:145 | S33 |
| F-19 | README 2,500+ lines, stale Roadmap, no archival DOI | README.md | S35 |
| F-20 | English only; no localisation | index.html:2 | S31 |
| F-21 | Every Scene3D builds its own renderer: 4 renderers and 4 shader caches on the QFT view | scene3d.jsx, render-session.mjs, create-renderer.mjs | S04, S05 |
| F-22 | WebGL2 contexts always use preserveDrawingBuffer: true | create-renderer.mjs:205,208 | S04 |
| F-23 | Quality governor uses CPU frame time only; GPU timestamps unused | quality-governor.mjs | S04 |
| F-24 | Geometry drawn with 1 px THREE.Line hairlines (20+ sites); no width control | perf:audit | S06 |
| F-25 | GPU work split between ad hoc GLSL ShaderMaterials and TSL | mod-gr.jsx:1378,1423,1500 | S07 |
| F-26 | No numeric check that shader formulas equal the tested JS formulas | tests cover images only | S03, S10 |
| F-27 | CPU per-frame buffer uploads (needsUpdate) at ~38 sites in 15 files | perf:audit | S08 |
