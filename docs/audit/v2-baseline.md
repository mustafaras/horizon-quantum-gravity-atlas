# HORIZON v2 baseline

Measured by S01 (`npm run perf:collect`, `npm run perf:audit`) on commit `9013fba` plus the S01 harness. Raw data: [`v2-baseline.json`](v2-baseline.json). Date: 2026-10-21.

## Environment

| | |
|---|---|
| Chromium | 141.0.7390.37 (Playwright, headless, linux) |
| WebGPU | disabled (--disable-blink-features=WebGPU, as in CI); `navigator.gpu` present: true; adapter: none |
| GPU string (`WEBGL_debug_renderer_info`) | ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver) |
| Backend per scene | **classic `WebGLRenderer` (WebGL2) in every scene of every view** (see the backends column) |
| Run | 5000 ms of rAF deltas per view, first scene scrolled into view; fresh browser context per view; `?seed=42`; software-rasterizer quality clamp active |

**Backend note.** With WebGPU disabled, `navigator.gpu` still exists but `requestAdapter()` returns null. `createRenderer` therefore attempts WebGPU, throws "WebGPU adapter unavailable" and retries with the classic `WebGLRenderer`. CI does *not* exercise the node renderer's WebGL2 backend, contrary to the S01 context text (ledger D-003).

**Reading the numbers.** This is SwiftShader on a shared CPU, so absolute frame times are pessimistic and noisy: compare future runs on the same configuration, and treat the renderer and program counts (deterministic) as the firm baseline. CPU frame time is the rAF delta (p50/p95, nearest rank). `programs` sums `info.programs.length` over the live classic renderers (the node renderer would use `info.memory.programs`). JS KiB is CDP `encodedDataLength` (headers + body, uncompressed local server) of `.js`/`.jsx`/`.mjs` responses; the compare view loads two embedded app copies. Babel ms is the `qga:babel:start` to `qga:babel:end` measure.

**GPU frame time is `null` everywhere.** The adapter is absent in CI mode. In the sandbox that produced this baseline WebGPU itself is unusable (Chromium 141 + SwiftShader loses the Dawn instance even with timestamps off, and r186 passes a `swizzle` view field that Chromium 141 rejects), so the timestamp probe in `collect.mjs` (a throw-away `WebGPURenderer({ trackTimestamp: true })` timing a fixed reference scene) was written against the r186 source but has **not been exercised on a working WebGPU device**. Run `npm run perf:collect -- --webgpu` on a machine with WebGPU to fill it. The app's own renderers cannot report GPU time: r186 enables timestamp queries only at renderer construction (S04).

## Runtime measurements

### desktop (1440×900, deviceScaleFactor 1)

| view | renderers | programs | CPU p50 ms | CPU p95 ms | GPU p50 ms | GPU p95 ms | first frame ms | JS KiB | Babel ms | backends |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| overview | 2 | 21 | 199.9 | 233.3 | null | null | 5293 | 10437 | 3987 | webgl2/classic |
| sm | 3 | 34 | 183.3 | 216.6 | null | null | 5044 | 10453 | 3718 | webgl2/classic |
| qft | 4 | 38 | 216.6 | 250.1 | null | null | 4732 | 10453 | 3251 | webgl2/classic |
| rg | 2 | 22 | 166.7 | 250 | null | null | 5076 | 10451 | 3894 | webgl2/classic |
| gr | 2 | 30 | 166.7 | 299.9 | null | null | 5305 | 10437 | 3591 | webgl2/classic |
| planck | 3 | 31 | 183.3 | 216.7 | null | null | 5280 | 10448 | 4013 | webgl2/classic |
| approaches | 3 | 35 | 183.3 | 216.7 | null | null | 5342 | 10450 | 3990 | webgl2/classic |
| bh | 4 | 41 | 583.2 | 683.3 | null | null | 5320 | 10548 | 3954 | webgl2/classic |
| exp | 4 | 52 | 200 | 233.3 | null | null | 6273 | 10467 | 4388 | webgl2/classic |
| glossary | 1 | 7 | 183.3 | 216.6 | null | null | 5341 | 10437 | 4176 | webgl2/classic |
| symbols | 1 | 7 | 150 | 199.9 | null | null | 5173 | 10437 | 3801 | webgl2/classic |
| refs | 1 | 7 | 133.3 | 166.7 | null | null | 4852 | 10437 | 3873 | webgl2/classic |
| open | 1 | 7 | 149.9 | 183.4 | null | null | 4790 | 10437 | 3764 | webgl2/classic |
| paper | 1 | 7 | 133.4 | 166.6 | null | null | 5266 | 10437 | 3770 | webgl2/classic |
| compare | 1 | 7 | 133.3 | 166.6 | null | null | 5353 | 24625 | 4054 | webgl2/classic |

### mobile (390×844, deviceScaleFactor 3)

| view | renderers | programs | CPU p50 ms | CPU p95 ms | GPU p50 ms | GPU p95 ms | first frame ms | JS KiB | Babel ms | backends |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| overview | 2 | 21 | 50 | 66.7 | null | null | 4933 | 10437 | 3842 | webgl2/classic |
| sm | 3 | 34 | 50.1 | 66.7 | null | null | 5542 | 10453 | 4196 | webgl2/classic |
| qft | 4 | 38 | 83.3 | 100 | null | null | 5460 | 10453 | 3946 | webgl2/classic |
| rg | 2 | 22 | 66.6 | 83.3 | null | null | 5399 | 10451 | 4067 | webgl2/classic |
| gr | 2 | 30 | 66.6 | 100 | null | null | 5621 | 10437 | 3784 | webgl2/classic |
| planck | 3 | 31 | 50 | 66.7 | null | null | 5463 | 10448 | 4283 | webgl2/classic |
| approaches | 3 | 35 | 50 | 66.7 | null | null | 4973 | 10450 | 3766 | webgl2/classic |
| bh | 4 | 41 | 166.6 | 200 | null | null | 5294 | 10548 | 3812 | webgl2/classic |
| exp | 4 | 52 | 66.7 | 116.7 | null | null | 5755 | 10467 | 4132 | webgl2/classic |
| glossary | 1 | 7 | 33.4 | 50.1 | null | null | 5207 | 10437 | 3970 | webgl2/classic |
| symbols | 1 | 7 | 33.4 | 50.1 | null | null | 5203 | 10437 | 3846 | webgl2/classic |
| refs | 1 | 7 | 33.4 | 50.1 | null | null | 4931 | 10437 | 4022 | webgl2/classic |
| open | 1 | 7 | 50 | 66.7 | null | null | 5450 | 10437 | 4435 | webgl2/classic |
| paper | 1 | 7 | 33.4 | 50 | null | null | 5182 | 10437 | 3764 | webgl2/classic |
| compare | 1 | 7 | 50 | 116.7 | null | null | 5523 | 26767 | 4254 | webgl2/classic |

## Static audit

Output of `npm run perf:audit` (deterministic; run twice and diffed).

```text
## <VizCaption per file (total 28 in 13 files)
file                         count
js/compare/compare-view.jsx      1
js/extras.jsx                    1
js/labs/ads-lab.jsx              1
js/labs/collider-lab.jsx         1
js/mod-approaches.jsx            2
js/mod-blackholes.jsx            3
js/mod-experiments.jsx           4
js/mod-gauge-rg.jsx              1
js/mod-gr.jsx                    3
js/mod-planck.jsx                2
js/mod-qft.jsx                   5
js/mod-rg-stage3.jsx             1
js/mod-standard-model.jsx        3

## registerVisualization( call sites (8)
js/science/ads-geometry.mjs:62
js/science/collider-kinematics.mjs:71
js/science/hawking.mjs:61
js/science/qft-fields.mjs:83
js/science/rg-flow-3d.mjs:60
js/science/spin-networks.mjs:74
js/visualizations/gw/spacetime-instrument.mjs:52
js/visualizations/kerr/kerr-observatory.mjs:100

## Math.random( call sites (35)
js/annotations/annotation-store.mjs:89
js/atlas-stage.jsx:111
js/atlas-stage.jsx:112
js/atlas-stage.jsx:113
js/atlas-stage.jsx:114
js/atlas-stage.jsx:118
js/atlas-stage.jsx:119
js/atlas-stage.jsx:121
js/atlas-stage.jsx:122
js/atlas-stage.jsx:156
js/atlas-stage.jsx:157
js/atlas-stage.jsx:158
js/atlas-stage.jsx:169
js/atlas-stage.jsx:170
js/core.jsx:364
js/core.jsx:366
js/core.jsx:368
js/core.jsx:369
js/mod-approaches.jsx:31
js/mod-approaches.jsx:156
js/mod-approaches.jsx:164
js/mod-gr.jsx:1363
js/mod-gr.jsx:1364
js/mod-gr.jsx:1368
js/mod-gr.jsx:1369
js/mod-gr.jsx:1370
js/mod-gr.jsx:1689
js/mod-gr.jsx:1690
js/mod-gr.jsx:2031
js/mod-planck.jsx:78
js/mod-qft.jsx:268
js/mod-qft.jsx:269
js/mod-standard-model.jsx:78
js/mod-standard-model.jsx:95
js/mod-standard-model.jsx:177

## colour literals under js/ (hex 83, rgb( 1, rgba( 246, oklch( 49, 0xRRGGBB 230)
file                                          hex  rgb(  rgba(  oklch(  0xRRGGBB
js/app.jsx                                      7     0      0       0         0
js/atlas-stage.jsx                              0     0      0       0         3
js/core.jsx                                     0     0      1       0         0
js/data.jsx                                     0     0      0       7         0
js/extras.jsx                                   1     0     13       0        15
js/labs/ads-lab.jsx                             0     0      0       0         1
js/labs/collider-lab.jsx                        0     0      0       0         1
js/mod-approaches.jsx                           1     0      5       3        14
js/mod-blackholes.jsx                          13     0     28       6         1
js/mod-experiments.jsx                          3     1     80      10        19
js/mod-gr.jsx                                  40     0     34       6        29
js/mod-planck.jsx                               0     0      4       0        16
js/mod-qft.jsx                                 17     0     57       9        31
js/mod-rg-stage3.jsx                            0     0      0       0         1
js/mod-standard-model.jsx                       1     0      9       8        16
js/render/hdr-environment.mjs                   0     0      0       0         2
js/scene3d.jsx                                  0     0      4       0         3
js/visualizations/blackhole/hawking-lab.mjs     0     0      0       0        17
js/visualizations/collider/event-display.mjs    0     0      0       0        21
js/visualizations/glow-texture.mjs              0     0     11       0         0
js/visualizations/gw/gw-runtime.mjs             0     0      0       0         5
js/visualizations/gw/gw-runtime.tsl.js          0     0      0       0         2
js/visualizations/holography/ads-lab.mjs        0     0      0       0         6
js/visualizations/planck/spin-foam.mjs          0     0      0       0         4
js/visualizations/qft/field-lab.mjs             0     0      0       0        13
js/visualizations/rg/flow-field.mjs             0     0      0       0        10

## needsUpdate = true sites per file (total 48 in 19 files)
file                                            count
js/atlas-stage.jsx                                  3
js/extras.jsx                                       1
js/mod-experiments.jsx                              5
js/mod-gr.jsx                                       6
js/mod-planck.jsx                                   1
js/mod-qft.jsx                                      5
js/mod-standard-model.jsx                           1
js/render/hdr-environment.mjs                       1
js/render/render-pipeline.mjs                       1
js/visualizations/blackhole/hawking-lab.mjs         5
js/visualizations/collider/event-display.mjs        3
js/visualizations/gw/gw-runtime.mjs                 2
js/visualizations/gw/gw-runtime.tsl.js              3
js/visualizations/kerr/kerr-material.mjs            1
js/visualizations/kerr/kerr-material.tsl.js         3
js/visualizations/kerr/kerr-runtime-shared.mjs      1
js/visualizations/planck/spin-foam.mjs              1
js/visualizations/qft/field-lab.mjs                 3
js/visualizations/rg/flow-field.mjs                 2

## new THREE.Line( sites (12)
js/mod-experiments.jsx:450
js/mod-gr.jsx:1571
js/mod-qft.jsx:609
js/mod-qft.jsx:653
js/mod-standard-model.jsx:168
js/scene3d.jsx:75
js/visualizations/collider/event-display.mjs:77
js/visualizations/collider/event-display.mjs:140
js/visualizations/collider/event-display.mjs:229
js/visualizations/holography/ads-lab.mjs:121
js/visualizations/rg/flow-field.mjs:75
js/visualizations/rg/flow-field.mjs:208

## LineBasicMaterial sites (28)
js/atlas-stage.jsx:195
js/extras.jsx:210
js/mod-experiments.jsx:450
js/mod-gr.jsx:1571
js/mod-qft.jsx:609
js/mod-qft.jsx:653
js/mod-standard-model.jsx:56
js/mod-standard-model.jsx:164
js/render/create-renderer.mjs:11
js/render/three-runtime.mjs:6
js/render/three-runtime.mjs:138
js/scene3d.jsx:74
js/visualizations/blackhole/hawking-lab.mjs:29
js/visualizations/blackhole/hawking-lab.mjs:194
js/visualizations/blackhole/hawking-lab.mjs:241
js/visualizations/blackhole/hawking-lab.mjs:274
js/visualizations/blackhole/hawking-lab.mjs:350
js/visualizations/collider/event-display.mjs:18
js/visualizations/collider/event-display.mjs:77
js/visualizations/collider/event-display.mjs:136
js/visualizations/holography/ads-lab.mjs:17
js/visualizations/holography/ads-lab.mjs:85
js/visualizations/holography/ads-lab.mjs:88
js/visualizations/planck/spin-foam.mjs:18
js/visualizations/planck/spin-foam.mjs:157
js/visualizations/rg/flow-field.mjs:19
js/visualizations/rg/flow-field.mjs:71
js/visualizations/rg/flow-field.mjs:205

## ShaderMaterial sites (13)
js/mod-gr.jsx:1378
js/mod-gr.jsx:1423
js/mod-gr.jsx:1500
js/render/three-runtime.mjs:10
js/render/three-runtime.mjs:141
js/visualizations/gw/gw-runtime.mjs:22
js/visualizations/gw/gw-runtime.mjs:172
js/visualizations/kerr/kerr-material.mjs:33
js/visualizations/kerr/kerr-material.mjs:551
js/visualizations/kerr/kerr-material.mjs:570
js/visualizations/kerr/kerr-material.mjs:823
js/visualizations/kerr/kerr-material.mjs:828
js/visualizations/kerr/kerr-material.mjs:833

## files over 800 lines (14)
file                                                                lines
README.md                                                            2557
js/mod-gr.jsx                                                        2408
index.html                                                           2332
js/physics.jsx                                                       2002
js/mod-experiments.jsx                                               1891
js/mod-qft.jsx                                                       1740
js/extras.jsx                                                        1303
js/mod-blackholes.jsx                                                1076
js/visualizations/kerr/kerr-material.mjs                             1036
js/visualizations/kerr/kerr-observatory.mjs                           992
js/scene3d.jsx                                                        847
test/physics.test.mjs                                                 827
docs/superpowers/plans/2026-10-08-ultra-realistic-atlas-prompts.md    819
js/physics.mjs                                                        812
```

Note: F-04 quotes ~199 hex literals; `#rrggbb` literals number 83 under `js/` and `0xRRGGBB` three.js colours 230, so the finding's figure matches neither alone (ledger D-004). F-27 quotes ~38 `needsUpdate` sites in 15 files; the audit counts the `needsUpdate = true` occurrences above.
