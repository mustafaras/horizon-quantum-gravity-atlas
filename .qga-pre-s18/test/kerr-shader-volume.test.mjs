/*
 * Kerr observatory integrator (Prompt 05): the volumetric layer is a
 * *compile-time* switch.
 *
 * Why this is a contract and not an implementation detail: SwiftShader (and
 * every other CPU rasterizer) lacks `KHR_parallel_shader_compile`, so three.js
 * cannot compile asynchronously and the browser main thread stalls for the
 * whole compile. The volumetric layer roughly doubles the fragment shader, and
 * on a software rasterizer it is gated off anyway — so the GLSL it needs must
 * not reach the compiler at all. These tests pin that: with `volume: false` the
 * shader is the pre-volumetric integrator, and with `volume: true` it is
 * unchanged.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  KERR_ACCUMULATE_FRAGMENT,
  kerrAccumulateFragment,
} from "../js/visualizations/kerr/kerr-material.mjs";

/** Emulate the GLSL preprocessor for the `KERR_VOLUME` guard only. */
function preprocess(source, defined) {
  const out = [];
  let depth = 0;
  for (const line of source.split("\n")) {
    if (/^\s*#ifdef\s+KERR_VOLUME\b/.test(line)) { depth += 1; continue; }
    if (/^\s*#endif\b/.test(line) && depth > 0) { depth -= 1; continue; }
    if (/^\s*#define\s+KERR_VOLUME\b/.test(line)) continue;
    if (depth === 0 || defined) out.push(line);
  }
  return out.join("\n");
}

/**
 * Symbols defined by the volumetric GLSL chunks and never referenced by the
 * shader body, so the gated source must not contain them at all.
 */
const CHUNK_SYMBOLS = [
  "coronaClumping", "coronaRadialProfile", "coronaScaleHeight",
  "jetAxialAt", "jetGammaAt", "jetKelvinAt", "jetRadiusAt", "jetSign", "bzSpinFactor",
];

/**
 * Symbols that stay in the source behind the `#ifdef` guard: the body's own
 * volumetric functions plus the chunk entry points they call. The preprocessor
 * removes them, so they must be gone from what the compiler sees.
 */
const GUARDED_SYMBOLS = ["jetRadiance", "volumeSegment", "coronaDensity", "jetEmission"];

/** Everything that only exists because of the volumetric layer. */
const VOLUME_SYMBOLS = [...CHUNK_SYMBOLS, ...GUARDED_SYMBOLS];

/** Symbols the integrator must keep at every setting. */
const CORE_SYMBOLS = ["oDisk", "oSky", "oJet", "oJetPos", "uHistoryDisk", "uHistorySky", "uSkyTexture", "uCorona", "uJets"];

test("the volumetric GLSL is a compile-time switch, not a uniform", () => {
  const on = kerrAccumulateFragment({ volume: true });
  const off = kerrAccumulateFragment({ volume: false });

  // The chunks are spliced in by JS, so the gated shader must not carry them
  // at all — not even behind a guard.
  for (const symbol of CHUNK_SYMBOLS) {
    assert.ok(on.includes(symbol), `volume shader should define ${symbol}`);
    assert.ok(!off.includes(symbol), `gated shader must not carry ${symbol}`);
  }
  assert.ok(on.includes("#define KERR_VOLUME 1"), "volume shader should define the guard");
  assert.ok(!/^\s*#define\s+KERR_VOLUME/m.test(off), "gated shader must not define the guard");

  // The body stays in the source but is guarded, so the preprocessor drops it.
  for (const symbol of GUARDED_SYMBOLS) {
    assert.ok(on.includes(symbol), `volume shader should define ${symbol}`);
    assert.ok(off.includes(symbol), `${symbol} should stay in the source behind the guard`);
  }

  // The core integrator survives the gate: the disk, the sky and the MRT
  // outputs are what the compositor reads, so dropping them would be a
  // regression, not an optimisation.
  for (const symbol of CORE_SYMBOLS) {
    assert.ok(off.includes(symbol), `gated shader must keep ${symbol}`);
    assert.ok(on.includes(symbol), `volume shader must keep ${symbol}`);
  }
});

test("the gated shader is the pre-volumetric integrator, not a trimmed one", () => {
  const on = preprocess(kerrAccumulateFragment({ volume: true }), true);
  const off = preprocess(kerrAccumulateFragment({ volume: false }), false);

  // What the compiler actually sees. The gate must remove the volumetric body
  // as well as the chunks, so the effective source is the pre-volumetric one.
  for (const symbol of VOLUME_SYMBOLS) {
    assert.ok(on.includes(symbol), `compiled volume shader should contain ${symbol}`);
    assert.ok(!off.includes(symbol), `compiled gated shader must not contain ${symbol}`);
  }
  assert.ok(
    off.length < on.length * 0.65,
    `gated shader should be materially smaller (${off.length} vs ${on.length})`,
  );
  // The pre-volumetric integrator was ~11.1 kB; the gate must land near it.
  assert.ok(off.length < 12_000, `gated shader should be near the pre-volumetric size, got ${off.length}`);
  assert.ok(on.length > 19_000, `volume shader should be unchanged, got ${on.length}`);
});

test("the exported constant is the volumetric integrator", () => {
  // Callers that do not choose get the full model, so the default export and
  // the default argument must agree.
  assert.equal(KERR_ACCUMULATE_FRAGMENT, kerrAccumulateFragment());
  assert.equal(KERR_ACCUMULATE_FRAGMENT, kerrAccumulateFragment({ volume: true }));
  assert.notEqual(KERR_ACCUMULATE_FRAGMENT, kerrAccumulateFragment({ volume: false }));
});

test("the guard is balanced so the shader always compiles", () => {
  for (const volume of [true, false]) {
    const source = kerrAccumulateFragment({ volume });
    const opens = (source.match(/^\s*#ifdef\s+KERR_VOLUME\b/gm) || []).length;
    const closes = (source.match(/^\s*#endif\b/gm) || []).length;
    assert.equal(opens, closes, `unbalanced #ifdef/#endif with volume: ${volume}`);
    assert.ok(opens > 0, "the guard must be present so the body is conditional");
  }
});
