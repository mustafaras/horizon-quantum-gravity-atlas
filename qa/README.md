# HORIZON QA — Persistent Quality & Screenshot Infrastructure

Stage 4 of the HORIZON roadmap: a reproducible, manifest-driven QA harness for
the zero-build static app. Everything runs locally against **this worktree** —
the harness proves byte-equality between the served `index.html` and the file
on disk before a single test executes.

## Layout

```
qa/
  manifest.json            capture contract: 22 named captures (the source of truth)
  manifest.schema.json     JSON Schema 2020-12 the manifest is validated against
  verify-manifest.mjs      schema + file-existence + README cross-check (fast gate)
  capture.mjs              screenshot CLI (default output, --update baselines, --docs)
  playwright.config.mjs    pinned Chromium, 1 worker, failure traces
  global-setup.mjs         starts the verified 127.0.0.1 static server
  global-teardown.mjs      stops it
  lib/
    serve.mjs              static server + worktree byte-equality proof
    readiness.mjs          measurable readiness probes (no fixed sleeps)
    manifest.mjs           loader: schema validation + state-key/view parity with the app
    jsonschema.mjs         dependency-free JSON Schema subset validator
  fixtures/gwosc/          deterministic synthetic GW150914 strain (NOT real GWOSC data)
  specs/                   Playwright suites (see below)
  baselines/               committed reference PNGs (updated only via qa:update)
  output/                  git-ignored capture output
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run qa:verify` | Validate the manifest: schema, referenced files, README consistency. |
| `npm run qa:capture` | Render all 22 captures into `qa/output/` (scratch). |
| `npm run qa:capture -- --only <id>` | Render a single capture. |
| `npm run qa:update` | Refresh committed baselines in `qa/baselines/`. **Explicit, separate, never implicit.** |
| `npm run qa:capture -- --docs` | Also refresh `docs/screenshots/` referenced by the README. |
| `npm run qa:test` | Full Playwright suite against the local verified server. |
| `npm run qa:test:live` | Live gwosc.org smoke (the only test that touches the network). |

## Suites

| Spec | Coverage |
| --- | --- |
| `smoke.spec.mjs` | All 14 views mount with zero console/page errors. |
| `state.spec.mjs` | URL→state round-trip, reload persistence, back/forward, copy-link, export JSON schema (`horizon-qga-state/v1`). |
| `motion.spec.mjs` | Reduced vs normal motion: GW auto-play and RG settling differ observably. |
| `a11y.spec.mjs` | Keyboard focus (`:focus-visible`), arrow-key sliders, mobile overflow, 44px touch targets, horizontal chart scroll. |
| `rg.spec.mjs` | Conjectural badge on asymptotic safety, Custom transition, Reset preset. |
| `gwosc.spec.mjs` | Deterministic fixture: ok / http-error / abort / oversized / cancel phases, parser contract (≤1200 samples, provenance). |
| `visual.spec.mjs` | Per-capture screenshot vs committed baseline, each with its justified `maxDiffPixelRatio`. |
| `live.spec.mjs` | Real GWOSC fetch. Skipped unless `QGA_QA_LIVE=1`. |

## Principles

- **No fixed sleeps.** Readiness is measured: fonts, network idle, view mount,
  canvas non-blank, animation settled, or an explicit selector/text probe.
- **Deterministic.** Seed 42 everywhere; the GWOSC fixture is generated from the
  app's own `generatedChirp` and is byte-identical across runs (MD5 pinned).
- **Loopback only.** The server binds `127.0.0.1` on a random port and serves
  only this worktree; the GWOSC fixture intercepts `https://gwosc.org/**` so the
  deterministic suite never leaves the machine.
- **Baselines are data, updated deliberately.** `qa:update` is the only writer.
  Functional browser checks run in CI; visual baselines are a local
  capture-platform gate because browser font rasterization and full-page layout
  heights differ between macOS and the Linux runner. Set `QGA_QA_VISUAL=1` on
  a runner with matching baselines to opt into the visual comparison.
- **Failures are debuggable.** Traces and screenshots are retained on failure
  (`qa/test-results/`, uploaded as CI artifacts).

## Baseline update policy

Update baselines only when a visual change is **intended**, and review the diff
like code:

```
npm run qa:update -- --only rg-flow-landscape-qcd
git diff qa/baselines/rg-flow-landscape-qcd.png   # inspect before committing
```

Tolerance rationale lives per capture in `manifest.json` (`baseline.note`):
SVG/DOM captures are deterministic (0.01), WebGL raymarch allows GPU dithering
(0.02), mobile mixed content 0.03.
