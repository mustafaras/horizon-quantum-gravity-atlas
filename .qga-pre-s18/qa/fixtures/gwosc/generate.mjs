#!/usr/bin/env node
// Generates qa/fixtures/gwosc/strain.txt deterministically.
// The fixture is SYNTHETIC: it is the app's own seeded teaching waveform
// (js/physics.mjs generatedChirp, seed 42) rescaled to strain units (~1e-19),
// formatted as a GWOSC-style plain-text strain series. It is NOT real
// detector data and must never be presented as such. See README.md here.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generatedChirp } from "../../../js/physics.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

export const FIXTURE_PARAMS = {
  sampleRate: 128,          // Hz; strain-files.json declares sample_rate_kHz: 0.128
  duration: 32,             // s;  GPS window [1126259438, 1126259470]
  gpsStart: 1126259438,
  mergerAt: 20,             // s file-local → GPS 1126259458, inside the app's default 16 s window
  seed: 42,
  m1: 36, m2: 29,           // GW150914-like component masses
  strainScale: 1e-19,       // dimensionless strain amplitude
};

export function buildFixtureSamples() {
  const { samples } = generatedChirp({
    seed: FIXTURE_PARAMS.seed,
    sampleRate: FIXTURE_PARAMS.sampleRate,
    duration: FIXTURE_PARAMS.duration,
    m1: FIXTURE_PARAMS.m1,
    m2: FIXTURE_PARAMS.m2,
    mergerAt: FIXTURE_PARAMS.mergerAt,
    noiseRms: 0.35,
  });
  return samples;
}

async function main() {
  const samples = buildFixtureSamples();
  const lines = new Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    lines[i] = (samples[i] * FIXTURE_PARAMS.strainScale).toExponential(10);
  }
  const out = path.join(here, "strain.txt");
  await writeFile(out, lines.join("\n") + "\n");
  console.log(`✓ wrote ${out} (${samples.length} synthetic samples, seed ${FIXTURE_PARAMS.seed})`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
