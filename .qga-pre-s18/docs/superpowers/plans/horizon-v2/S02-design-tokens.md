# S02 — Art Direction Document, Design Tokens and Stylesheet Extraction

> **Sequence 02 of 36.** Requires **S01** to be `done` in the ledger. Next: **S03**.
> **Closes findings:** F-04 (~199 hex literals plus per-canvas palettes and font strings in module code); F-05 (Nearly all CSS inline in a 2,332-line index.html; no light or print theme).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S02** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
2. Read `docs/design/art-direction.md` and `docs/render/performance-contract.md` if they exist (they are created by S02 and S04).
3. Run `npm ci`, `npm test` and `npm run validate`. If anything is red **before** your change, set the prompt to `blocked` with the failing output and stop.
4. Treat any uncommitted change you did not make as the user's work: do not modify or revert it.

## Rules that apply to every prompt
- Zero bundler, static GitHub Pages deployment, every runtime dependency self-hosted under `vendor/`, no CDN, no new npm runtime dependency.
- Science lives in pure ES modules under `js/science/` or `js/formula/`. They must import in Node without DOM, React, canvas or three.js, and are covered by `node:test` tests using `node:assert/strict`.
- New browser modules are ESM. Expose them to the classic JSX runtime only through `js/bootstrap.mjs` with the existing `Object.defineProperty(window, "QGA_…", …)` pattern.
- Every number shown on screen is computed by a pure, tested function or imported from `js/science/data/*.mjs`, with citation (DOI, arXiv id or URL), value, uncertainty and retrieval date. **Verify every value and citation in this prompt against the primary source.** If one disagrees, use the source, and record the difference in the ledger `decisions`.
- Randomness is seeded (`seededRng` in `js/physics.mjs`, or TSL `hash` on the GPU). No `Math.random` in any data, model or capture path.
- New GPU code is TSL (`three/tsl`) on node materials and must run on both the WebGPU backend and the node renderer's WebGL2 backend (CI runs Chromium with WebGPU disabled on SwiftShader). No new GLSL `ShaderMaterial`.
- Three.js is pinned at 0.186.1. Before using any three.js or TSL API, `grep` it in `vendor/three/build/three.webgpu.js`, `three.tsl.js` or `three.core.js` and read its implementation. Never code an API from memory.
- No per-frame allocations in render loops. Scenes render on demand through the shared stage (from S04/S05 on) and call `invalidate()` on change.
- New files ≤ 600 lines. `js/mod-*.jsx` files may only shrink: new labs go in `js/labs/`, scene code in `js/visualizations/<area>/`.
- Colours, fonts and durations come from tokens (`js/design/tokens.mjs`, `styles/tokens.css`) once S02 is done. 2D plots use the Figure Kit (`js/figure/`) once S09 is done. Equations come from Formula Core (`js/formula/`) once S03 is done.
- Every figure carries a status label and a registered provenance entry with layer classes (`data`, `model`, `decoration`). Schematic or conjectural content says so in-canvas.
- Accessibility: keyboard reachable, visible focus, 44 px touch targets, text alternatives, `prefers-reduced-motion` snaps instead of animating.
- Never refresh a visual baseline just to make a test pass. For each baseline you update, write a one-line justification in the ledger.
- If a required value, algorithm or API cannot be verified or reproduced, set the prompt to `blocked` with the exact reason and stop. Never substitute a fake visual or a tuned number.
- Edit only what this prompt needs.

## Goal
Create the art-direction specification as a repository document, then make one token source drive CSS, canvas 2D and Three.js colours, fonts and motion. The atlas must look the same after this prompt; only the source of every style value changes.

## Steps
1. Create `docs/design/art-direction.md` with exactly the sections below, expanded into full prose (keep every rule; you may add examples taken from the codebase).
   - **Principles.**
     1. Light is data: bloom, glow and colour temperature only on physical emitters (accretion disk, jets, Hawking flux, blackbody curves). Never on text, axes, UI.
     2. Geometry is engraved: mathematical curves (geodesics, conformal diagrams, separatrices, minimal surfaces, field lines) are crisp constant-pixel-width lines (1–1.5 px; 2.5 px for the single focal curve), optional halo ≤ 12 % opacity.
     3. One focal element per figure at full luminance; everything else at least one ink level lower.
     4. Status is visible, never loud: 3 px left rule plus label, never a flood fill.
     5. Motion explains: every animation answers "what changes and why"; no idle wobble, breathing glow or meaningless parallax.
     6. The formula is the protagonist: every flagship figure shows its governing equation, and each visual element maps to a term of it.
   - **Colour.**
     - Surfaces: `--surface-0..2`, `--surface-glass`.
     - Ink: `--ink-strong`, `--ink`, `--ink-dim`, `--ink-faint` (gridlines only, never text).
     - Status: `--status-established`, `-effective`, `-schematic`, `-conjectural`, `-open`, `-heuristic`.
     - Data palettes: categorical (8), sequential (committed viridis/magma/cividis tables with their CC0 licence note), diverging (signed quantities).
     - Physical colour only through `js/science/spectrum.mjs`.
     - Rainbow/jet forbidden.
   - **Typography.**
     - Space Grotesk headings, Sora body, IBM Plex Mono data.
     - `tabular-nums` on every changing number.
     - Type scale `--step--2..--step-5` (ratio 1.2, base 15 px); 10 px absolute floor.
     - Math always KaTeX, including over canvases via a DOM overlay.
     - Units roman with thin space; `42 ± 3 μas`; `2.1 × 10⁶⁷`.
   - **Figure grammar.** Title bar (mono kicker · figure id · status chip), plot, content-sized legend, caption (what is shown · model · what it is not · provenance id · references). Nice 1-2-5 ticks, outward 4 px ticks, decade labels on log axes, data as points with error bars, models as lines, uncertainty as ≤ 18 % bands.
   - **Light and post.**
     - AgX by default; fixed per-scene exposure in scientific mode.
     - Bloom threshold ≥ 1.0 linear.
     - UI composited after post.
     - Grain ≤ 2 % σ, chromatic aberration ≤ 0.6 px at the edge, both decoration.
   - **Layer classes.** `data` / `model` / `decoration`; the `scientific` preset hides `decoration` only.
   - **Motion.** `--dur-instant 90ms`, `--dur-quick 180ms`, `--dur-settle 420ms`, `--dur-scene 900ms`; `--ease-out-quart`, `--ease-in-out-cubic`; damped spring for cameras; reduced motion snaps.
   - **Forbidden.** Unlabelled rubber sheets; balls-as-particles without a schematic label; `Math.random` in data/model layers or captures; colour or font literals in module code; glow on text; decorative numbers.
2. Create `styles/tokens.css` holding every custom property now in `index.html :root` blocks (lines 40–60 and 1493+), renamed to the vocabulary above. Keep the old names as aliases (`--text: var(--ink);` etc.) so nothing breaks; S34 removes the aliases. Values stay identical.
3. Move all CSS from `index.html` into `styles/base.css`, `styles/layout.css`, `styles/components.css` and `styles/modules/<module>.css`, preserving cascade order exactly (concatenate in original order, then split at section comments). Leave at most 4 KB of critical CSS inline. Link the stylesheets in the same order. `styles/rg-flow.css` stays.
4. Create `js/design/tokens.mjs`:
   - `readTokens(root = document.documentElement)` returns a frozen object `{ color: { name: { css, linear: [r,g,b] } }, font: { mono(sizeStep), body(sizeStep), head(sizeStep) }, dur: { name: ms }, step: { n: px } }`;
   - `onThemeChange(cb)` listens for a `qga:theme` CustomEvent on `document` and returns an unsubscribe function;
   - `cssColorToLinear(str)` handles hex, `rgb[a]()` and `oklch()`. Write the OKLCH → linear sRGB conversion yourself from Björn Ottosson's published matrices and test it.
   - Expose it as `window.QGA_TOKENS` from `js/bootstrap.mjs`, following the existing `Object.defineProperty` pattern.
5. Create `js/design/palettes.mjs` with the sequential tables (256 entries each, linear sRGB floats; viridis, magma and cividis are CC0, cite the matplotlib source), a categorical palette of 8, a diverging palette, and `simulateCvd(rgbLinear, type, severity = 1)` using the Machado, Oliveira & Fernandes (2009) matrices.
6. Replace every colour literal and canvas font string in `js/*.jsx`, `js/labs/*.jsx` and `js/visualizations/**/*.mjs` with token reads. For three.js materials read the token once when the scene is built. For canvases, read in the draw function setup. Exceptions are allowed only in `js/design/*`, `js/science/data/*`, `js/science/spectrum.mjs`, and shader code that encodes physics (state the reason in a one-line comment).
7. Extend `scripts/validate-repo.mjs` to fail on any colour literal (`#rgb`, `#rrggbb`, `#rrggbbaa`, `0xRRGGBB`, `rgb(`, `rgba(`, `oklch(`, `hsl(`) or `"<n>px <Font>"` string in those paths outside the exceptions.

## Tests
`test/design-tokens.test.mjs` (Node, parse `styles/tokens.css` with a small regex parser):
- every ink token except `--ink-faint` has ≥ 4.5:1 contrast on `--surface-0`, `--surface-1` and `--surface-2` (WCAG relative luminance);
- the six status colours pairwise ΔE₀₀ ≥ 12 under normal vision and under protan, deutan and tritan simulation;
- categorical neighbours ΔE₀₀ ≥ 10;
- OKLCH round trip within 1e-6.

If a current token fails, adjust it minimally and record before/after in the ledger `decisions`.

## Acceptance
- `npm test`, `npm run validate` (new rules active, zero violations).
- `npm run qa:test -- qa/specs/visual.spec.mjs qa/specs/a11y.spec.mjs`. Baselines must pass at their existing tolerances. If any moves, explain each in the ledger. Never refresh a baseline without that explanation.

## Commit
`refactor(design): art direction spec and a single token source`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
