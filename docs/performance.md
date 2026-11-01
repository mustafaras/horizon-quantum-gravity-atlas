# Performance

Every number below was produced by `npm run perf:collect` on this machine, against this checkout, with WebGPU
disabled exactly as CI runs it. They are measurements, not guarantees: a different GPU, a different Chromium build or a
different network will move them, and the method is written down so the comparison can be repeated rather than trusted.

## Environment

| | |
|---|---|
| Chromium | 145.0.7632.6, Playwright's pinned build |
| Platform | macOS (darwin), Node v26.3.1 |
| GPU path | ANGLE / SwiftShader — **software** WebGL2, WebGPU disabled (`--disable-blink-features=WebGPU`, as in CI) |
| Viewport | 1440×900, deviceScaleFactor 1 |
| Motion | reduced (the capture default) |

A software rasteriser is the honest but pessimistic setting: it is what CI uses, so a regression caught here is a
regression CI would also catch. Real-GPU numbers are higher; the shape of the comparison is what matters.

## The change this measures

Before S33, production shipped `vendor/babel/babel.min.js` (3.0 MB) and transpiled 58 JSX entry points in the browser
on every first load. S33 moves that work to `scripts/compile-jsx.mjs`, commits the output to `js/compiled/`, and
`index.html` lists one inert tag per compiled file. Production loads the minified React builds; `?dev=1` keeps the
in-browser path for editing.

## Results

| metric | S01 baseline | S05 baseline | **S33** | change vs S01 |
|---|---:|---:|---:|---|
| Babel time, overview | 3987 ms | 4014 ms | **0 ms** | −3987 ms |
| JS transferred, overview | 10 687 611 B | 10 845 431 B | **8 386 181 B** | −2 301 430 B (−21.5 %) |
| JS transferred, black hole | 10 801 325 B | 10 959 986 B | **8 386 181 B** | −2 415 144 B (−22.4 %) |
| First frame, overview | 5293 ms | 5343 ms | **519 ms** | −4774 ms (−90.2 %) |
| First frame, black hole | 5320 ms | 6275 ms | **2235 ms** | −3085 ms (−58.0 %) |

`babelMs` is read from the `qga:babel:start` / `qga:babel:end` marks that bracket the runtime decision in
`js/bootstrap.mjs`. In production that region contains no transform at all, so the number is a measured zero rather
than a claim; `test/production-runtime.test.mjs` asserts the compiled tree matches a fresh compile and that no Babel
script is fetched.

### Why the first frame moved so far

The 4.8 s saved on the overview is almost exactly the 3.99 s of Babel plus the parse of the freshly transpiled source,
which the browser had to compile from a string. Production downloads already-compiled files, so that second parse
happens once, offline, and the browser can use its ordinary script cache.

The black-hole view still takes 2.2 s: it builds four WebGL2 renderers and 46 shader programs on a software adapter.
That cost is the renderer's, not the loader's, and S04/S05 already own it.

## What did not get faster

- **Renderer count and shader programs are unchanged.** S33 changes how the code arrives, not how it draws; the
  overview still reports 2 renderers / 25 programs and the black hole 4 / 46.
- **The JS is larger than the JSX it replaces** (1.14 MB of `.jsx` compiles to 1.75 MB of JavaScript) because `env`
  lowers syntax to ES5-compatible output. The production payload is smaller anyway, because the 3.0 MB Babel runtime is
  gone; but the compiled tree is not itself smaller than its input.
- **`jsRequests` stays at the same order of magnitude.** Production fetches the compiled files individually rather
  than one blob; on HTTP/2 that is a fair trade, and on the software adapter the difference is not visible in these
  numbers.

## Reproducing

```bash
npm run compile:jsx:check        # fail if js/compiled/ is stale
npm run perf:collect -- --views=overview,bh --viewports=desktop --duration=3000 --out=qa/output/s33-baseline.json
```

`npm run perf:collect` writes JSON with the environment block above, so a later run on different hardware is not
silently compared against this table.
