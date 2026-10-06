# GWOSC fixture — `gwosc-gw150914`

**This fixture is synthetic. It is not, and must never be presented as, real
GWOSC detector data.**

## Provenance

`strain.txt` is generated deterministically by `generate.mjs` from the app's
own seeded teaching waveform (`generatedChirp` in `js/physics.mjs`):

| Parameter | Value |
|---|---|
| seed | 42 |
| sample rate | 128 Hz (declared as `sample_rate_kHz: 0.128`) |
| duration | 32 s |
| GPS window | 1126259438 – 1126259470 |
| merger at | 20 s file-local (GPS 1126259458) |
| component masses | 36 + 29 M☉ (GW150914-like) |
| amplitude scale | 1e-19 strain |

Regenerate byte-identically with:

```bash
node qa/fixtures/gwosc/generate.mjs
```

## Shape of the stub

The app (`js/state-runtime.jsx`, `qgaFetchGWOSC`) performs three requests; the
fixture answers all of them under `https://gwosc.org/**`:

1. `GET /api/v2/event-versions/GW150914` → `event-version.json`
   (`name`, `version` drive the `-v3` candidate resolution)
2. `GET /api/v2/event-versions/GW150914-v3/strain-files?…` → `strain-files.json`
   (`results[0].download_url`, `sample_rate_kHz`, `gps_start`, `duration`)
3. `GET https://gwosc.org/fixture/GW150914-synthetic-strain.txt` → `strain.txt`

The selected window (default `gws=1126259446`, `gwt=16`) lies fully inside the
fixture's GPS window, so the app slices 2048 samples and downsamples to the
≤1200-sample preview exactly as it would with real data.

## Failure modes

`install.mjs` also models the paths the app must survive: `http-error` (503),
`abort` (connection refused), and `oversized` (a body beyond the app's 4 MB
safety bound). In every failure mode the UI must fall back to the seeded
generated signal and must not label anything as a real observation.
