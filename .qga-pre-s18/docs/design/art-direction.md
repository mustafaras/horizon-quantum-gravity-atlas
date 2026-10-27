# HORIZON Art Direction

This is the specification every figure, panel and scene in the atlas is judged against. The tokens it names live in one place, [`styles/tokens.css`](../../styles/tokens.css), and are read by CSS (`var()`), by canvas 2D and by three.js through [`js/design/tokens.mjs`](../../js/design/tokens.mjs) (`window.QGA_TOKENS` for the classic JSX runtime). `npm run validate` fails on any colour or font literal in `js/` outside the exceptions listed under [Forbidden](#forbidden); `test/design-tokens.test.mjs` enforces the contrast and distinguishability numbers below.

## Principles

1. **Light is data.** Bloom, glow and colour temperature appear only on physical emitters: the accretion disk, jets, Hawking flux, blackbody curves. Never on text, axes or UI. Example: the Kerr disk may bloom; its axis labels may not.
2. **Geometry is engraved.** Mathematical curves (geodesics, conformal diagrams, separatrices, minimal surfaces, field lines) are crisp, constant-pixel-width lines: 1–1.5 px, and 2.5 px for the single focal curve. An optional halo stays at or below 12 % opacity. Line width never scales with zoom or depth.
3. **One focal element per figure at full luminance.** Everything else sits at least one ink level lower (`--ink-strong` → `--ink` → `--ink-dim` → `--ink-faint`). If two things shine, the reader has to guess which one is the result.
4. **Status is visible, never loud.** A 3 px left rule plus a label, never a flood fill. Colour alone never carries status; the label always does.
5. **Motion explains.** Every animation answers "what changes and why". No idle wobble, no breathing glow, no meaningless parallax.
6. **The formula is the protagonist.** Every flagship figure shows its governing equation, and each visual element maps to a term of it.

## Colour

All colour is a custom property in `styles/tokens.css`. Module code reads it; it never writes a literal.

### Surfaces

| Token | Role |
|---|---|
| `--surface-0` | page and canvas ground |
| `--surface-1` | raised ground (sidebar, wells) |
| `--surface-2` | opaque panel |
| `--surface-glass` | translucent panel over the backdrop (`-thin`, `-strong` for the two other densities) |

### Ink

`--ink-strong` (headings, the focal element), `--ink` (body), `--ink-dim` (secondary text), `--ink-faint` (**gridlines only, never text**). Every ink token except `--ink-faint` reaches 4.5:1 on all three surfaces; the test computes this with the WCAG 2.1 relative-luminance formula.

### Status (epistemic)

`--status-established`, `--status-effective`, `--status-schematic`, `--status-conjectural`, `--status-open`, `--status-heuristic`. The six are pairwise ΔE₀₀ ≥ 12 under normal vision and under protan, deutan and tritan simulation (Machado, Oliveira & Fernandes 2009, severity 1), and each reaches 4.5:1 as text on every surface. They are always paired with the label.

### Data palettes

- **Categorical (8):** `--cat-1 … --cat-8`, the Okabe & Ito (2008) set with the black replaced by a light neutral for the dark ground. Neighbours are ΔE₀₀ ≥ 10 in all four vision conditions and every entry is ≥ 3:1 against the surfaces (non-text contrast).
- **Sequential:** viridis, magma and cividis, committed as 256-entry linear-sRGB tables in `js/design/palette-data.mjs`. viridis and magma are CC0 (mpl-colormaps); cividis (Nuñez, Anderton & Renslow 2018) is distributed under the Battelle licence, whose notice is reproduced in that file. Use `sampleSequential(name, t)` from `js/design/palettes.mjs`.
- **Diverging (signed quantities):** `--div-neg-2 … --div-pos-2`, blue ← dark neutral → orange, lightness rising away from zero. Use `diverging(tokens).sample(v)` for v in [−1, 1].

### Physical colour

Colour that represents a physical quantity (blackbody temperature, redshift) comes only from `js/science/spectrum.mjs`. A designer's palette is never used to stand in for temperature.

### Forbidden palettes

Rainbow, jet and HSV-ramp colormaps are never offered: they are not perceptually ordered and fail under colour-vision deficiency.

### Pigments

Section 10 of `tokens.css` holds the `--pigment-*` tokens: the exact values of the literals that scene code used before this specification existed (`pigment-<hue>-<lightness>`). They keep every scene identical during the migration and are **frozen**: new work picks from the sections above, and later prompts fold pigments into them.

## Typography

- **Families:** Space Grotesk for headings (`--font-head`), Sora for body (`--font-body`), IBM Plex Mono for data (`--font-mono`).
- **Numbers:** `font-variant-numeric: tabular-nums` on every number that changes, so digits do not jitter.
- **Scale:** `--step--2 … --step-5`, ratio 1.2 from a 15 px base (10.42, 12.5, 15, 18, 21.6, 25.92, 31.1, 37.32 px). The absolute floor is 10 px. Canvas code asks for `tokens.font.mono(step)`; labels that predate the scale use `tokens.font.monoPx(px)` and keep their size until the Figure Kit replaces them (some are 8–9.5 px and are tracked for removal, see the S02 ledger decisions).
- **Math is always KaTeX**, including over canvases (a DOM overlay, never canvas text).
- **Units** are roman with a thin space: `42 ± 3 μas`, `2.1 × 10⁶⁷`.

## Figure grammar

1. **Title bar:** mono kicker · figure id · status chip.
2. **Plot.**
3. **Legend**, content-sized (as wide as its longest label).
4. **Caption:** what is shown · the model · what it is not · provenance id · references.

Axes use nice 1-2-5 ticks, outward ticks 4 px long, and decade labels on log axes. Data are points with error bars; models are lines; uncertainty is a band at ≤ 18 % opacity.

## Light and post-processing

- Tone mapping is AgX by default; scientific mode uses a fixed per-scene exposure.
- Bloom threshold ≥ 1.0 in linear light, so only emitters bloom.
- The UI is composited after post-processing.
- Film grain ≤ 2 % σ and chromatic aberration ≤ 0.6 px at the edge. Both are decoration.

## Layer classes

Every figure layer is exactly one of **`data`**, **`model`** or **`decoration`**. The `scientific` preset hides `decoration` and nothing else.

## Motion

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 90 ms | hover, press |
| `--dur-quick` | 180 ms | small state changes |
| `--dur-settle` | 420 ms | panels, tooltips settling |
| `--dur-scene` | 900 ms | scene and camera transitions |
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | things arriving |
| `--ease-in-out-cubic` | `cubic-bezier(0.65, 0, 0.35, 1)` | things moving between two rests |

Cameras use a damped spring. Under `prefers-reduced-motion` everything snaps to its end state.

## Forbidden

- Unlabelled rubber sheets.
- Balls standing for particles without a schematic label.
- `Math.random` in data or model layers, or in captures (seeded generators only).
- Colour or font literals in module code. Enforced by `scripts/lib/token-lint.mjs` on every `js/**/*.{jsx,mjs}` except `js/design/**`, `js/science/data/**` and `js/science/spectrum.mjs`; a line that encodes physics may carry a `token-lint-allow: <reason>` comment.
- Glow on text.
- Decorative numbers.

## Using the tokens

```js
// canvas 2D (classic JSX runtime)
ctx.font = QGA_TOKENS.monoPx(10);
ctx.fillStyle = QGA_TOKENS.alpha("ink-dim", 0.6);

// ES module, three.js: read once when the scene is built
import * as TK from "../../design/tokens.mjs";
const material = new MeshBasicMaterial({ color: TK.hex("accent") });
const emitter = new Color().fromArray(TK.linearRef("emit-hawking-cold"));
```

`qga:theme` dispatched on `document` invalidates the cache; `onThemeChange(cb)` receives the fresh snapshot. Scenes pick it up the next time they are built.
