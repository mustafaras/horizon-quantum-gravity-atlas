# S31 — Guided Tours, Teacher Mode, and Turkish

> **Sequence 31 of 36.** Requires **S30** to be `done` in the ledger. Next: **S32**.
> **Closes findings:** F-20 (English only; no localisation).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S31** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Paths through the atlas for learners and teachers, in English and Turkish.

> **Scope change (2026-10-31).** The Turkish half of this prompt was withdrawn by the project owner. Steps 1, 2 and 4
> shipped in PR #127; step 3 (the `js/i18n/` dictionary, `?lang=` resolution and Turkish terminology) did not, and
> will not. F-20 is therefore recorded as **accepted** rather than closed — see ledger decision D-184.

## Steps
1. `js/tours/` declarative manifests `{ id, title, steps: [{ view, shot?, state, formulaFocus?, text, question, expected? }] }`, validated by a pure schema. Deep links `?tour=<id>&step=<n>`; resume from localStorage (try/catch). Ship:
   - "Why gravity resists quantisation" (≈ 12 steps);
   - "What a black hole image measures" (≈ 8);
   - "Hearing spacetime" (≈ 7).
2. Teacher mode: print stylesheet plus `?tour=…&print=1` renders a worksheet (questions, expected readouts, references, QR-free plain URLs).
3. `js/i18n/`:
   - `t(key, params)` with English and Turkish dictionaries covering UI chrome, module headers, captions, tours, glossary;
   - Turkish physics terminology follows established usage (olay ufku, kara cisim ışıması, yeniden normalizasyon grubu, kütleçekim dalgası, kuantum alan kuramı, belirsizlik, gözlemsel kısıt);
   - KaTeX unchanged;
   - language from `?lang=` then `navigator.language`, `html[lang]` updated;
   - a missing Turkish key falls back to English and is reported by a test.
4. Numbers formatted with `Intl.NumberFormat` per language, except inside KaTeX.

## Acceptance
`npm test` (i18n completeness, tour schema), `npm run validate`, a Playwright spec running each tour end to end in both languages, a11y spec in Turkish.

## Commit
`feat(narrative): guided tours, teacher worksheets and turkish`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
