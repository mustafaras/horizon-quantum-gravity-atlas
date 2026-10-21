# S03 — Formula Core: One Definition → JS, KaTeX and TSL

> **Sequence 03 of 36.** Requires **S02** to be `done` in the ledger. Next: **S04**.
> **Closes findings:** F-26 (No numeric check that shader formulas equal the tested JS formulas).
> Copy this whole file into a fresh agent session on a branch created from the latest `main`.

## Before you start
1. Read `docs/superpowers/ledger/README.md`. In `docs/superpowers/ledger/ledger.json` set **S03** to `claimed` with `owner`, `branch` and `startedAt`, run `node --test test/plan-ledger.test.mjs`, and commit that change alone.
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
Every governing equation in the atlas gets one definition that compiles to:
- a float64 JavaScript evaluator for science and tests;
- a float32-emulating evaluator that proves GPU safety in Node;
- typeset KaTeX with addressable terms;
- a TSL node graph for the GPU.

Most later visual prompts render formulas through this. Pixels and formulas then cannot drift apart.

## Steps
1. `js/formula/expr.mjs`, a pure AST of frozen plain objects:
   - Leaves: `num(value)`, `sym(name)`.
   - Arithmetic: `add(...xs)`, `sub(a,b)`, `mul(...xs)`, `div(a,b)`, `neg(a)`, `pow(a, b)` (b may be `num` with a rational `{p,q}` for dimension analysis), `sqrt`, `cbrt`.
   - Functions: `exp`, `log`, `sin`, `cos`, `tan`, `atan`, `atan2(y,x)`, `abs`, `min`, `max`, `clamp(x,lo,hi)`.
   - Comparison and selection: `lt`, `gt`, `select(cond, a, b)`.
   - Terms: `term(id, expr, { tex })` marks a named, addressable subexpression.
   - Constructors validate arity and throw `TypeError` with the operator name.
2. `js/formula/to-js.mjs`:
   - `compileJS(expr, { precision: "f64" | "f32" })` returns `(env) => number`. Build closures (no `eval`, no `new Function`, the page has a strict CSP mindset).
   - In `"f32"` mode every intermediate result passes through `Math.fround`.
   - Unknown symbols throw `ReferenceError` naming the symbol.
3. `js/formula/to-tex.mjs`:
   - `toTeX(expr, symbols)` with correct precedence and minimal parentheses;
   - `div` becomes `\frac`, `sqrt` becomes `\sqrt`, `pow` becomes `^{}` (`pow(x,{1,2})` prints `\sqrt{x}`), `mul` of a number by a symbol prints implicit juxtaposition, and `\cdot` is used only between two numbers;
   - symbols print their declared `tex`;
   - terms wrap as `\htmlData{term=<id>}{…}`.
   - KaTeX 0.16.9 (`vendor/katex`) supports `\htmlData` only with `trust`. In `js/core.jsx` `Eq`, pass `trust: (ctx) => ctx.command === "\\htmlData"` and `strict: (code) => code === "htmlExtension" ? "ignore" : "warn"`.
4. `js/formula/to-tsl.mjs`:
   - `compileTSL(expr, tsl, bindings)`, where `tsl` is the namespace object imported by the caller from `"three/tsl"` (this module must not import three, so Node can load it) and `bindings` maps symbol names to TSL nodes (uniforms, attributes or other nodes).
   - Map operators to `tsl.add`, `tsl.mul`, `tsl.div`, `tsl.pow`, `tsl.sqrt`, `tsl.exp`, `tsl.log`, `tsl.sin`, `tsl.cos`, `tsl.tan`, `tsl.atan`, `tsl.abs`, `tsl.min`, `tsl.max`, `tsl.clamp`, `tsl.select`, `tsl.lessThan`, `tsl.greaterThan`, `tsl.float`.
   - Before coding, grep `vendor/three/build/three.tsl.js` for each name. For `atan2` check whether `atan(y, x)` with two arguments exists in r186. If an operator has no TSL equivalent, throw at compile time.
   - `compileTSL` also returns `terms: { id → node }` so a scene can visualise any term (S10).
5. `js/formula/dimensions.mjs`:
   - dimension vectors over (L, M, T, Θ) with rational exponents;
   - `inferDimensions(expr, symbols)` throws a `TypeError` naming the offending operator when `add`/`sub`/`min`/`max`/`select` branches disagree, or when a transcendental function receives a non-dimensionless argument.
6. `js/formula/formula.mjs`:
   - `defineFormula({ id, title, status, symbols, output, expr, domain, references })`;
   - `symbols[name] = { tex, unit, dims, description }`; `domain[name] = [min, max, "lin" | "log"]` for GPU-safety sampling;
   - the result is frozen and holds `evaluate(env)`, `evaluateF32(env)`, `tex`, `dims`, `termIds`, and `gpuSafe({ samples = 257 })`.
   - `gpuSafe` returns the max relative error between f64 and f32 over a deterministic grid of the domain (Halton for more than one dimension, seeded) and whether it is ≤ 1e-4.
7. `js/formula/library/*.mjs`, the first formulas.
   - Black holes, geometric units with SI wrappers:
     - `schwarzschildRadius = 2GM/c²` (1 M☉ → 2953.34 m at G = 6.67430e-11, M☉ = 1.98847e30, c = 299792458);
     - `hawkingTemperature = ħc³/(8πGMk_B)` (1 M☉ → 6.17007e-8 K);
     - `bekensteinHawkingEntropy = k_B c³ A/(4Għ)`;
     - `kerrOuterHorizon r₊ = M + √(M² − a²)` (a* = 0.9 → 1.435890 M);
     - `photonSphere = 3M`;
     - `criticalImpact = 3√3 M`.
   - Planck scale: `planckLength = √(ħG/c³)` → 1.616255e-35 m.
   - Gravitational waves:
     - `chirpMass = (m₁m₂)^{3/5}(m₁+m₂)^{−1/5}` (36, 29 → 28.0956);
     - `newtonianGwFrequency f(τ) = (1/π)(5/(256τ))^{3/8}(G𝓜/c³)^{−5/8}`.
   - Casimir: `casimirPressure = π²ħc/(240a⁴)` (1 μm → 1.3001e-3 Pa).
   - Embedding: `flammEmbedding z(r) = 2√(r_s(r − r_s))`.
   - Special relativity: `lorentzGamma`.

   Constants come from `js/science/constants.mjs`. Where `js/physics.mjs` already implements a formula, the tests assert equality to 1e-12 relative and the existing function is left untouched.
8. Expose `window.QGA_FORMULA` (frozen: library, `compileTSL`, `toTeX`) from `js/bootstrap.mjs`.

## Tests
- `test/formula-core.test.mjs`: constructor validation, precedence printing (snapshot strings), f64 values above, f32 emulation equals `Math.fround`-chained manual computation, `ReferenceError` on unknown symbols, dimension inference success and failure, `gpuSafe` for each library formula in geometric units.
- `qa/specs/formula-gpu.spec.mjs` (runs on the node renderer's WebGL2 backend in CI, and on WebGPU locally when available):
  - in the page, create a `WebGPURenderer` with `forceWebGL` when the project's `forceBackend` is `webgl2`;
  - for each library formula with `gpuSafe.ok`, fill a 256×1 `FloatType` `DataTexture` with domain samples;
  - render a `QuadMesh` whose `MeshBasicNodeMaterial.colorNode` is `vec4(compileTSL(expr, tsl, { x: texture(sampleTex, uv()).r }), 0, 0, 1)` into a `RenderTarget(256, 1, { type: FloatType })`;
  - read back with `renderer.readRenderTargetPixelsAsync`;
  - assert max relative error ≤ 2e-4 against `evaluateF32`.
  - Verify each API name in `vendor/three/build/three.webgpu.js` and `three.tsl.js` first. If float render targets are not readable on SwiftShader, document it in the ledger and fall back to `HalfFloatType` with a 2e-3 tolerance; never skip the test silently.

## Acceptance
`npm test`, `npm run validate`, `npm run qa:test -- qa/specs/formula-gpu.spec.mjs`.

## Out of scope
Rewriting existing FormulaCards (S30). Do not change any visual.

## Commit
`feat(formula): single-source formulas compiled to js, katex and tsl`

## Finish
1. Run every acceptance command above and `npm run perf:audit` (from S01 on). All must pass.
2. Ledger: set `review` with `pr`, add `evidence.tests` (commands with pass counts), `evidence.screenshots` (paths) and `evidence.measurements` (numbers with units and what they are compared to). Set each finding this prompt closes to `closed`. Append a `log` entry. Run `node --test test/plan-ledger.test.mjs`.
3. Open one pull request for this prompt. After it merges, set `done` with the merge commit in `commits` and `completedAt`, and set `closedIn` on each closed finding.
