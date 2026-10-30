# S30 — Living Equations · **starter**

> Paste this file as the first message of a fresh agent session. It is a *pre-flight brief*, not a replacement for the
> contract: read [`S30-living-equations.md`](../plans/horizon-v2/S30-living-equations.md) first, then come back here.
>
> **State when written (2026-10-30):** `main` = `bf48d6e`, S29 `done`, working tree clean.
> Every number below was measured in this repository, not read off the plan.

---

## 1. The gate is open

| check | value |
|---|---|
| S29 in ledger | `done`, `commits: [76d4c9c, f8bbf86]` |
| S30 in ledger | `todo`, `dependsOn: ["S29"]`, `findings: []` |
| `node --test test/*.test.mjs` on `main` | 1157 pass, 0 fail, 1 skipped |
| `npm run validate` on `main` | repository valid · provenance 89 entries · cover index matches |

The plan's rule 3 says: if anything is red **before** your change, set the prompt `blocked` and stop. Nothing is red.
So the first action is step 1 of the contract — **claim S30** — and nothing else.

---

## 2. What already exists (do not rebuild it)

S30 is a *migration and wiring* prompt. The three pieces it depends on shipped in earlier stages and are working.
Verified by reading the files:

| piece | file | what it gives you |
|---|---|---|
| `defineFormula` | [`js/formula/formula.mjs`](../../../js/formula/formula.mjs) | validated spec → `evaluate`, `evaluateF32`, `tex` with `\htmlData` terms, `sampleGrid`, `gpuSafe` |
| dimension checker | [`js/formula/dimensions.mjs`](../../../js/formula/dimensions.mjs) | `inferDimensions(expr, symbols)`, `dimension()`, `dimensionToString()` |
| lens (S10) | [`js/formula/lens.mjs`](../../../js/formula/lens.mjs) | `window.QGA_FORMULA.lens.formula(id)` — what `FormulaCard` already calls when given `formulaId` |
| 29 definitions | [`js/formula/library/`](../../../js/formula/library/) · 540 lines, 29 `defineFormula` calls | aggregated by `library/index.mjs` |
| the card | [`js/core.jsx:158`](../../../js/core.jsx) `function FormulaCard` | already accepts `formulaId` and `texAfter`; with a `formulaId` it renders the **Core** TeX, not the `tex` prop |

**Nothing is missing except the 48 cards and `js/formula/derivation.mjs`.**

---

## 3. The actual size of the job — measured, per file

`grep` over `js/**/*.jsx` finds **65 `<FormulaCard>` elements**. **17 already carry `formulaId`; 48 do not.**

```
extras.jsx               24      ← the whitepaper spine; nearly half the work
mod-qft.jsx               6
mod-approaches.jsx        4
mod-rg-stage3.jsx         4
mod-gr.jsx                3
mod-standard-model.jsx    3
mod-blackholes.jsx        2
mod-planck.jsx            2
                        ---
                         48
```

Start with `extras.jsx` — it holds half the cards *and* it is the file `ViewWhitepaper` lives in, which step 5 of the
contract rewires anyway. Doing it first means you touch it once.

---

## 4. Three findings that change the contract's steps

These came out of measurement. Put them in the ledger `decisions`; do not silently follow the plan where it disagrees.

### 4.1 `defineIdentity` is not needed

Step 1 says non-evaluable formulas get "a `defineIdentity` variant". **A constant-only `defineFormula` already works** —
verified in Node:

```js
defineFormula({ id:'t', title:'t', status:'established', symbols:{}, output:{ dims:{} },
                expr: num(2), references:[{ citation:'x', url:'https://example.com', retrieved:'2026-10-30' }] })
// → evaluate({}) = 2, tex = "2"        (no throw)
```

`domain` defaults to `{}`, so a formula with no free symbols validates cleanly. An identity is therefore
**a `defineFormula` whose `expr` has no free symbols, plus a term-addressable `tex`**. Do not invent a second
definition kind; that would fork `lens.mjs`, `to-tex.mjs` and `to-tsl.mjs` for no gain. Record this as a decision.

### 4.2 `formulaId` silently overrides `tex` — so a wrong id is invisible

From [`js/core.jsx:167`](../../../js/core.jsx):

```js
const cardTex = formula ? formula.output.tex + " = " + formula.tex + (texAfter || "") : tex;
```

When a `formulaId` resolves, the `tex` prop is **discarded**. That means a migration that points at the wrong formula
renders a *correct-looking* card with *the wrong equation*, and no existing test would catch it. This is the single
highest-risk part of S30, and it is exactly why step 1 asks you to compare screenshots.

Mitigation, and it is cheap: for each card you migrate, assert in a test that the rendered `output.tex` matches the `tex`
you just deleted. That turns a visual comparison into a test. Prefer this over eyeballing 48 screenshots.

Note the existing coverage so you extend rather than duplicate: `test/formula-core.test.mjs`,
`test/formula-card-katex.test.mjs`, `test/formula-terms.test.mjs`, `test/formula-lens.test.mjs`,
`test/formula-lens-scenes.test.mjs`. There is **no** `test/formula-cards.test.mjs` yet — that is the file to add, and it
should hold the migration assertions for all 65 cards.

### 4.3 The six derivations already have tested sources — do not re-derive them

Step 4 names six derivations. Every value already exists in a tested science module, so `defineDerivation` should
**import** rather than restate:

| derivation | source in repo | the number |
|---|---|---|
| Page time | [`js/science/evaporation.mjs:102`](../../../js/science/evaporation.mjs) | `pageTimeFraction()` → **0.5381** τ from β = 1.4847 |
| Schwarzschild shadow √27 M | [`js/science/kerr-shadow.mjs:31`](../../../js/science/kerr-shadow.mjs) | `SCHWARZSCHILD_CRITICAL_B = Math.sqrt(27)` |
| Casimir −πħc/24a | [`js/science/casimir.mjs:18`](../../../js/science/casimir.mjs) | regularised sum, `−πħc/(24a)` as Λ→∞ |
| D = 26 | [`js/science/string-spectrum.mjs:160`](../../../js/science/string-spectrum.mjs) | the ζ(−1) = −1/12 level-one step, `tex: "D = 26"`, `value: 26` |
| Planck length | `js/formula/library/planck-casimir.mjs` | constants already defined there |
| r_s heuristic vs exact | `js/formula/library/black-holes.mjs` | `schwarzschildRadius` already defined |

**Two of these are the traps.** The escape-velocity argument gives r_s = 2GM/c² only by coincidence — the contract
demands you label which step is heuristic, and that label must be data the stepper renders, not prose. And the Casimir
line is a *regularised limit*; a stepper that shows "sum diverges → −πħc/24a" without showing the cancellation is
teaching the wrong thing.

---

## 5. Order of work (each step ends green)

1. **Claim** — ledger `claimed` + `owner` + `branch` + `startedAt`, `node --test test/plan-ledger.test.mjs`, commit alone.
2. **`js/formula/derivation.mjs`** first, with its own test file. It is pure ESM with no DOM, so it is testable before
   any card moves. `defineDerivation({ id, steps })` where a step is `{ expr | tex, justification, changedTerms }`.
   Write the test that asserts a step's `expr` evaluates to the same value as the derivation's closed form.
3. **`DerivationStepper`** component + `test/` coverage for reduce-motion snapping.
4. **`extras.jsx`** — 24 cards. Screenshot before/after, one file.
5. **The six remaining modules**, smallest first (`mod-planck` 2, `mod-blackholes` 2, then 3, 3, 4, 4, 6).
6. **`scripts/audit-formulas.mjs`** last, wired into `npm run validate`. Written last it encodes what you actually did;
   written first it encodes what you guessed.
7. **`ViewWhitepaper`** spine from the same definitions.

Run `node --test test/formula-cards.test.mjs` after each file, not once at the end.

---

## 6. Pre-flight checklist

- [ ] `npm ci && npm test && npm run validate` — all green **before** touching anything
- [ ] read `docs/design/art-direction.md` and `docs/render/performance-contract.md` if present
- [ ] `git status` clean; `git log -1` is `bf48d6e` or later `main`
- [ ] any uncommitted change you did not make is the user's — leave it alone
- [ ] confirmed `defineIdentity` is unnecessary (§4.1) and recorded it
- [ ] plan in hand: `docs/superpowers/plans/horizon-v2/S30-living-equations.md`

## 7. Definition of done

`npm test` · `npm run validate` (now including the formula audit) · `npm run qa:test` · `npm run perf:audit`.
Then ledger `review` → PR → merge → `done` with the merge commit and `completedAt`.

**Do not** start S31 in the same session. S31 needs this prompt to be `done`, and the sequencing test enforces it.
