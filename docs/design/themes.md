# Themes

Three token sets over `styles/tokens.css`. A theme is `<html data-theme="observatory|blueprint|print">`; the files are `styles/themes/*.css` and each overrides tokens under `:root[data-theme="…"]`. Observatory is the base in `tokens.css`. `js/design/theme.mjs` chooses and remembers the theme and dispatches `qga:theme` on `document`.

| Theme | Surface | Ink | Decoration | Notes |
|---|---|---|---|---|
| **Observatory** | `#05080f` | light on dark | on | The default. |
| **Blueprint** | Prussian blue `#002b4a` / `#003153` / `#08395f` | white linework, `#b4cde4` secondary | off, no glow, a 32 px measured grid | Scenes are drawn as unlit engraved ink. |
| **Print** | `#ffffff` / `#f6f7f9` / `#eceff3` | `#000` / `#101418` / `#4a5260` | off, no shadows | Also what the browser prints with (`beforeprint`). |

`?theme=` wins over the remembered choice (`localStorage["qga-theme"]`), which wins over Observatory. `index.html` applies a saved Blueprint or Print before first paint.

## What is checked, per theme

`test/theme-tokens.test.mjs` runs the S02 invariants for each theme on all three surfaces:

- `--ink-strong`, `--ink`, `--ink-dim`, `--accent`, `--accent-2`, `--signal-warm`, `--signal-danger` and the six status colours reach 4.5:1.
- The six status colours are pairwise ΔE00 ≥ 12 for normal, protan, deutan and tritan vision (Machado 2009, severity 1).
- The eight categorical colours are distinct, neighbours are ΔE00 ≥ 10 in every vision, each is ≥ 3:1 on the surfaces.
- The diverging palette keeps blue for negative and orange for positive and its two ends ΔE00 ≥ 30 apart; on paper the neutral is the lightest, on dark surfaces the darkest.
- `--ink-faint` (gridlines only, never text) is visible but stays below 4.5:1 so it is not mistaken for text.

The Blueprint and Print status and categorical colours were found with a seeded hill climb over OKLCH that holds each hue within 30° of its Observatory value, requires chroma ≥ 0.08 (status) and the contrast above, and maximises the smallest pairwise ΔE00. Results: Blueprint status min ΔE00 18.7, categorical 31.1; Print status 13.6, categorical 34.8 (limits 12 and 10).

## Scene pigments

The ~200 `--pigment-*` tokens are not themed one by one. `js/design/theme-pigments.mjs` maps each through one rule in OKLCH: Blueprint keeps lightness on a ramp from `L = 0.30` to white with almost no chroma; Print inverts lightness onto paper with a power curve so near-black backdrops become paper and mid tones stay ≥ 3:1.

## Three.js scenes

`js/render/theme-materials.mjs` follows `qga:theme` from `initializeRenderSession`. It swaps colour nodes in place and never rebuilds geometry or materials; Observatory restores what was saved. `data` layers and the field-heatmap and data-points kits are never touched; `model` is `--accent` (Blueprint) or `--ink` (Print); `decoration` is faint grid ink (Blueprint) or hidden (Print). Lit materials become unlit by zeroing the diffuse colour and using the ink as emission. The material version change reuses the existing "material variants changed" path, which recompiles and prewarms the shader graph.

## Accessible figures

- **Sound** (`js/figure/sonify.mjs`): time follows x over 6 s; pitch follows y over two octaves (220–880 Hz) on the axis scale; a quieter steady triangle tone marks a labelled level (the figure's `y` rule, else zero, else the middle of the axis). The button and the `P` key on the focused plot play, pause and resume. The `AudioContext` is created only inside that gesture.
- **Live summaries** (`js/figure/announce.mjs`): a parameter change is announced once, 500 ms after the last change, from the same spec the plot is drawn from.
- **3D text alternatives** (`js/render/scene-alt-text.mjs`): the author's sentence, then `Model`, `Status` and layer counts from the nearest caption's registered provenance, then the current Formula Core term values when the scene names a bound formula (`describe={{ formulaId }}`; the Kerr observatory and the gravity well do today).
