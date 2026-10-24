# Provenance, layer classes and determinism (S11)

Every figure that wears a status label is registered with full provenance, every drawn thing has a layer class, and no data, model or capture path draws from `Math.random`. Closes findings F-02 (the registry covered 9 views while 26 captions exist today) and F-03 (unseeded `Math.random` in labelled figures and backdrops).

```text
js/science/contracts.mjs          validateScientificProvenance: layers [{ name, class }] and seed are required
js/science/provenance.mjs         registry; assertCaptionProvenance(id, status) rejects an unknown id or a different status
js/science/references.mjs         REF (each DOI checked on Crossref), referenceLinks(text), hasReferenceIdentifier(text)
js/science/view-provenance.mjs    the 20 entries of captioned views that had none
js/provenance-index.mjs           registerAllProvenance(): every registrar, idempotent
js/render/scene-layers.mjs        tagLayer, layerOf, applyLayerMode, untaggedObjects (pure)
js/labs/provenance-drawer.jsx     the drawer behind the status chip
scripts/audit-provenance.mjs      run by `npm run validate`
scripts/lib/provenance-scan.mjs   the static scan (captions, references, Math.random)
qa/specs/provenance-layers.spec.mjs   chips by keyboard, untagged objects, seed, scientific mode
```

## Captions

`<VizCaption provenanceId="gr-curvature-well" status="schematic">`. The id is required. The chip is a button that opens a drawer with the model, status, assumptions, validity, numerical method, references (DOI, arXiv, bibcode or URL links), the layer table and the seed; Escape closes it and returns focus to the chip. `status` is optional and, when given, must equal the registered one. Two captions choose among several entries with a conditional (`provenanceId={mode === "flux" ? ... : ...}`); the scan reads every literal result.

## Layer classes

| class | meaning | scientific mode |
|---|---|---|
| `data` | measured or tabulated | drawn |
| `model` | computed from the stated equations | drawn |
| `decoration` | carries no quantity | `visible = false` |

A scene tags what it adds: `scene.add(ctx.tag(object, "decoration"))` (module scenes) or `tag(object, "model")` from `scene-layers.mjs` (runtimes). A tag on a group covers its children; an engraved line carries its class in `userData.engraved.layer`. `Scene3D` applies the mode after the build (`applyLayerMode`), so the scientific mode changes the pixels of decoration objects and of nothing else (`qa/specs/provenance-layers.spec.mjs` renders with the decoration shown and hidden and requires every changed pixel to lie in the decoration-only footprint, within one pixel of antialiasing). `s3dGlow` sprites are decoration; the concept highlight overlay and selection markers are tagged `model` so that they stay visible.

## Seeds

`Math.random` appears once, in annotation pin ids (`js/annotations/annotation-store.mjs`). Everything else uses `seededRng`/`QGA_SEEDED`: the URL `seed` where the figure exports state (the QFT vacuum kicks, the GW sheet stars), a fixed constant per figure otherwise. Each entry's `seed` field says which. The QA bootstrap `qa/lib/determinism.mjs` still replaces `Math.random`, which is now unused by the product.

## Citations

Chapter, section and equation numbers are not written (they cannot be checked offline). Books without a DOI link to the publisher page. Citations that could not be given an identifier were replaced or removed (ledger D-060).
