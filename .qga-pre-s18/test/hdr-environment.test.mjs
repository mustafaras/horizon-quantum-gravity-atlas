import test from "node:test";
import assert from "node:assert/strict";
import {
  HDR_ENVIRONMENT,
  hdrEnvironmentExcluded,
  buildHdrEnvironment,
  buildImportanceTable,
  sampleEnvironmentDirection,
  environmentRadiance,
  applyHdrEnvironment,
} from "../js/render/hdr-environment.mjs";

function fakeScene(objects) {
  return {
    environment: null,
    traverse(fn) { for (const object of objects) fn(object); },
  };
}
const kerrMesh = { name: "kerr-observatory-display", material: null };
const pbrMesh = { material: { isMeshStandardMaterial: true } };
const basicMesh = { material: { isMeshBasicMaterial: true } };

test("the exclusion contract keeps the environment off the Kerr observatory", () => {
  assert.ok(hdrEnvironmentExcluded("bh-kerr-observatory"));
  assert.ok(!hdrEnvironmentExcluded("overview"));
  // By view id...
  const refused = applyHdrEnvironment(fakeScene([pbrMesh]), { viewId: "bh-kerr-observatory", texture: {} });
  assert.equal(refused.applied, false);
  assert.match(refused.reason, /ray-traced black/);
  // ...and structurally, so no call path can bypass it.
  const structural = applyHdrEnvironment(fakeScene([kerrMesh, pbrMesh]), { viewId: "overview", texture: {} });
  assert.equal(structural.applied, false);
  assert.match(structural.reason, /ray-traced black/);
});

test("the environment applies only where it affects material lighting", () => {
  const scene = fakeScene([pbrMesh]);
  const applied = applyHdrEnvironment(scene, { viewId: "overview", texture: { id: 1 } });
  assert.equal(applied.applied, true);
  assert.equal(scene.environment.id, 1);
  const noPbr = applyHdrEnvironment(fakeScene([basicMesh]), { viewId: "overview", texture: {} });
  assert.equal(noPbr.applied, false);
  assert.match(noPbr.reason, /material lighting only/);
  const noTexture = applyHdrEnvironment(fakeScene([pbrMesh]), { viewId: "overview" });
  assert.equal(noTexture.applied, false);
});

test("the radiance map is seeded, finite, non-negative and HDR", () => {
  const a = buildHdrEnvironment({ seed: 42, width: 64, height: 32 });
  const b = buildHdrEnvironment({ seed: 42, width: 64, height: 32 });
  const c = buildHdrEnvironment({ seed: 43, width: 64, height: 32 });
  assert.deepEqual(a.radiance, b.radiance, "deterministic for the same seed");
  assert.notDeepEqual(a.radiance, c.radiance, "seeded");
  let max = 0;
  let nonZero = 0;
  for (let i = 0; i < a.radiance.length; i += 4) {
    for (let channel = 0; channel < 3; channel += 1) {
      const value = a.radiance[i + channel];
      assert.ok(Number.isFinite(value) && value >= 0, "finite and non-negative");
      max = Math.max(max, value);
    }
    if (a.radiance[i] + a.radiance[i + 1] + a.radiance[i + 2] > 0) nonZero += 1;
  }
  assert.ok(max > 1, `stars exceed display white (max ${max.toFixed(2)}) — the point of HDR`);
  assert.ok(nonZero > a.width * a.height * 0.3, "the diffuse background fills the map");
  assert.ok(a.stats.starCount > 100, "the catalogue rasterized stars");
  assert.throws(() => buildHdrEnvironment({ width: 63, height: 32 }), TypeError);
});

test("the importance table is a normalized CDF and sampling respects it", () => {
  const environment = buildHdrEnvironment({ seed: 42, width: 64, height: 32 });
  const table = buildImportanceTable(environment);
  assert.equal(table.bins, 64 * 32);
  assert.ok(Math.abs(table.cdf[table.bins - 1] - 1) < 1e-12, "the CDF ends at exactly 1");
  for (let i = 1; i < table.bins; i += 1) {
    assert.ok(table.cdf[i] >= table.cdf[i - 1], "monotone CDF");
  }
  // Sampled directions are unit vectors with a positive pdf.
  const seen = new Set();
  for (let i = 0; i < 2000; i += 1) {
    const { direction, pdf, bin } = sampleEnvironmentDirection(table, i / 2000);
    assert.ok(Math.abs(Math.hypot(...direction) - 1) < 1e-6, "unit direction");
    assert.ok(pdf > 0 && Number.isFinite(pdf));
    seen.add(bin);
  }
  assert.ok(seen.size > 100, "the sampler covers the bright bins");
  // The pdf is self-consistent: a histogram over uniform draws matches the
  // CDF's bin probabilities (expected = probability * n).
  const counts = new Map();
  const n = 20000;
  for (let i = 0; i < n; i += 1) {
    const { bin } = sampleEnvironmentDirection(table, (i + 0.5) / n);
    counts.set(bin, (counts.get(bin) ?? 0) + 1);
  }
  let checked = 0;
  for (const [bin, count] of counts) {
    const probability = table.cdf[bin] - (bin > 0 ? table.cdf[bin - 1] : 0);
    const expected = probability * n;
    if (expected > 20) {
      assert.ok(Math.abs(count - expected) / expected < 0.25, `bin ${bin}: ${count} vs ${expected.toFixed(0)}`);
      checked += 1;
    }
  }
  assert.ok(checked > 5, "enough bright bins verified");
  assert.throws(() => buildImportanceTable({ width: 2, height: 2, radiance: new Float32Array(16) }), /identically zero/);
});

test("radiance lookup is continuous and matches the map at texel centres", () => {
  const environment = buildHdrEnvironment({ seed: 42, width: 64, height: 32 });
  const { width, height, radiance } = environment;
  for (let y = 0; y < height; y += 7) {
    for (let x = 0; x < width; x += 11) {
      const u = (x + 0.5) / width;
      const v = (y + 0.5) / height;
      const phi = (u - 0.5) * 2 * Math.PI;
      const theta = v * Math.PI;
      const sinTheta = Math.sin(theta);
      const direction = [sinTheta * Math.cos(phi), Math.cos(theta), sinTheta * Math.sin(phi)];
      const rgb = environmentRadiance(environment, direction);
      const index = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        assert.ok(Math.abs(rgb[channel] - radiance[index + channel]) < 1e-4, `texel centre match at (${x}, ${y})`);
      }
    }
  }
});
