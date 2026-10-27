# Formula Lens (S10)

The equation is the interface. Focusing a term of a typeset formula highlights its counterpart in the scene and, for a field, paints the term's value over a surface, computed on the GPU from the same expression tree as the typeset text. Closes the second half of finding F-26 (the compiled shader formulas are compared with the tested JavaScript ones, now also for the formulas the scenes show).

```text
js/formula/
  lens.mjs                       registry: bindScene(sceneId, formulaId, { termTargets, live }); term evaluation, unit, label, range, formatting
  library/*.mjs                  terms added: M (Schwarzschild), hbar, G, c (Planck length); new newtonian-potential
js/linking/
  concept-bus.mjs                new typed event  formula-term { formulaId, termId, value, unit }
  formula-terms.mjs              hover / focus / pin behaviour (pure controller) and the DOM glue for the KaTeX terms
js/visualizations/common/
  term-lens.mjs                  scene half: outlines, label highlights, notes, one mix uniform per field
  term-lens-field.mjs            field half (loaded on demand): compileTSL -> kit heat map -> colour node behind a uniform
  term-lens-legend.mjs           legend model and DOM (term TeX, Figure Kit colour bar, range, unit, status)
  term-lens-provenance.mjs       registered provenance of the three lens figures (all schematic)
  lens-scenes.mjs                the three wirings: Kerr observatory, curvature well, Planck descent
js/core.jsx                      FormulaCard formulaId / texAfter
js/labs/lens-cards.jsx           the Newtonian-limit card of the GR module
```

## How a term reaches a scene

1. `FormulaCard formulaId="schwarzschild-radius"` renders `output.tex = formula.tex` (Formula Core, `\htmlData` terms). KaTeX turns each term into `<span data-term="r_s">`.
2. `attachFormulaTerms` makes every term a focusable `role="button"` with an accessible name from the symbol description, and listens by delegation (a re-render needs no rewiring).
3. Hover or focus asks the registry for the term's value with the **mounted scene's live parameters** (`bindScene(..., { live })`) and publishes `formula-term { formulaId, termId, value, unit }` on the ConceptBus. Leaving publishes `formula-clear`. Enter, Space or a click **pins** a term (it stays while the pointer is elsewhere, which is how a card far from its scene is used, and how touch works); Escape drops the pin. The card shows the value in a polite live region.
4. The scene's `createTermLens` receives the event and shows the target it declared. Everything it can show was built when the scene was built.

A term with variables that no scene explains publishes nothing; a term of constants (the Planck constants) publishes their declared SI value on its own.

## Targets

| Kind | Declared as | Drawn as |
|---|---|---|
| `object` | `{ kind: "object", objectName }` | an engraved outline (focal width, halo, `--ink-strong`, layer `decoration`) around the object, or a highlighted label, plus an in-canvas note |
| `field` | `{ kind: "field", surfaceName, range, bindings, mask?, palette? }` | the term as a heat map over the surface, with a legend |

`bindings` map every symbol of the term to a number or to a scene node (`{ node: "mass" }`); constants not listed are bound to 1 (geometric units, the same binding `gpuSafe` uses). The registry validates all of it in Node: unknown terms, missing or extra bindings, non-finite ranges, custom palettes (the legend draws the Figure Kit ramps) and `mask` names.

### No recompilation

`buildFieldLayer` compiles the term once with `compileTSL`, puts it through `fieldMaterial` of the material kit, and rebuilds the surface's colour node as `mix(base, vec4(field, 1), uniform)`. Showing the field is `uniform.value = 1` and hiding it `= 0`; the material is not touched, so nothing is compiled. With the uniform at exactly 0 the mix returns `base` unchanged, so the canvas after a blur equals the canvas before the focus pixel for pixel. A scene can multiply the uniform by a mask node (the well fades at its rim) with `mask`.

### Reduced motion

Nothing animates: outlines and fields switch on and off. There is no pulse to remove.

## The three scenes

| Scene | Formula | Term | Target |
|---|---|---|---|
| Kerr observatory (BH) | `schwarzschild-radius` | `r_s` | three great circles of radius 2 GM/c² (the term evaluated with `M = 1`), an unlensed coordinate sphere, with the note "a★ = 0 (schematic)" |
| | | `M` | a label "M = 10.00 M☉" read from the mass slider |
| Curvature engine (GR) | `newtonian-potential` (new card "Newtonian limit") | `phi` | Φ/c² = −GM/(rc²) painted over the well; range from the term over the corners of the mass slider and the visible radii (−5.5 to −0.065); legend "schematic scale · G = c = 1 · scene length units" |
| Planck descent | `planck-length` | `hbar` | the atomic gate, 10⁻¹⁰ m |
| | | `c` | the nuclear gate, 10⁻¹⁵ m (the probe energy ħc/l is 0.2 GeV there) |
| | | `G` | the Planck gate, 10⁻³⁵ m (l_P = 1.616×10⁻³⁵ m rounds to it) |

The Planck association of a constant with a gate is didactic, not a measured threshold; each note says "schematic association", and `test/formula-lens-scenes.test.mjs` checks the claims it can check (the gates exist on the ladder with the ladder's own wording, ħc/l at 10⁻¹⁵ m, the decades of l_P and of the Bohr radius).

## Rules the wiring keeps

* `js/mod-*.jsx` did not grow: the three module files changed by the same number of lines they lost. The scene code lives in `js/visualizations/`, the new card in `js/labs/`.
* The label layer and the canvas are both `z-index: auto` and the canvas comes later in the DOM, so the existing labels paint under opaque pixels. Lens items (legend, notes, highlighted labels) carry their own `z-index`; the existing labels are untouched.
* The term elements are controls of their own, so for a lens card the equation sits outside the `fc-head` button (a button may not contain a button). Other cards are unchanged.
* Every lens figure has a registered provenance entry (`formula-lens-kerr-observatory`, `-curvature-well`, `-planck-descent`), all `schematic`.

## Tests

* `test/formula-lens.test.mjs`: the registry (validation, binding stack, payloads accepted by the bus, live parameters, units) and the library terms (values against CODATA and closed forms).
* `test/formula-terms.test.mjs`: hover, leave, pin, Escape, dispose, unbound terms.
* `test/term-lens.test.mjs`: outlines (width, halo, colour, layer), the colour node wrap, the zero mix, the material `version` unchanged by a focus, the node graph holding the scene's uniform, dispose, the legend model.
* `test/formula-lens-scenes.test.mjs`: the three wirings against fake contexts, the Planck gate facts, the mass slider range read from `mod-gr.jsx`, provenance.
* `qa/specs/formula-lens.spec.mjs` (the node renderer's WebGL2 backend): keyboard focus publishes the event; focusing the potential term changes the canvas and a blur restores every pixel (FNV-1a of the full-resolution capture, reduced motion, paused scene), with **no WebGL program linked** (`linkProgram` is counted); the Kerr outline and mass label; the Planck outlines in the scene graph (the descent's probe glow pulses with the scene clock on every frame, so its canvas never repeats exactly and a hash would measure that instead of the lens); the legend; 44 px hit areas; no running animation while a term is highlighted.
* `qa/specs/formula-gpu.spec.mjs` already compares the compiled TSL of every library formula, the new one included, with the float32 evaluation.

## Limits

* A scene scrolled out of view stops drawing, so hovering a card that is far from its scene shows nothing until the scene is back in view; pin the term first. The Planck constants card sits above the descent for this reason.
* The Kerr sphere is the coordinate sphere of the Schwarzschild radius at a★ = 0, drawn unlensed; for a nonzero spin the Kerr outer horizon is smaller.
* Field legends and ranges are scene-scale choices (the well's mass is display-scaled); the term, its units and its values are exact.
