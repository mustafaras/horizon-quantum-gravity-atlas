import test from "node:test";
import assert from "node:assert/strict";
import {
  QFT_FIELD_LAB_VIEW_ID, QFT_FLUX_TUBE_VIEW_ID, QFT_FIELD_DEFAULTS,
  buildFourierModes, sampleField, equalTimeCorrelation, fluxTubeProfile,
  modeOccupation, registerQftLabProvenance, qftFieldExportMetadata,
} from "../js/science/qft-fields.mjs";
import { getVisualizationProvenance } from "../js/science/provenance.mjs";

test("buildFourierModes is deterministic for a fixed seed", () => {
  const a = buildFourierModes({ seed: 42, mass: 1 });
  const b = buildFourierModes({ seed: 42, mass: 1 });
  assert.deepEqual(a.modes, b.modes);
});

test("different seeds select different mode subsets", () => {
  const a = buildFourierModes({ seed: 42 });
  const b = buildFourierModes({ seed: 1337 });
  const ka = a.modes.map((m) => m.k).join(",");
  const kb = b.modes.map((m) => m.k).join(",");
  assert.notEqual(ka, kb);
});

test("modes respect the disclosed cutoff and dispersion relation", () => {
  const field = buildFourierModes({ seed: 7, mass: 1.3 });
  for (const mode of field.modes) {
    assert.ok(mode.k <= field.cutoffK + 1e-12, "k within cutoff");
    assert.ok(Math.abs(mode.omega - Math.sqrt(mode.k * mode.k + 1.3 * 1.3)) < 1e-12);
    assert.ok(Number.isFinite(mode.phase) && mode.phase >= 0 && mode.phase <= Math.PI * 2);
  }
});

test("sampleField is finite and reproducible", () => {
  const field = buildFourierModes({ seed: 42, mass: 1 });
  const v1 = sampleField(field, 2.5, 7.25);
  const v2 = sampleField(field, 2.5, 7.25);
  assert.equal(v1, v2);
  assert.ok(Number.isFinite(v1));
});

test("mass raises every mode frequency (mass gap)", () => {
  const low = buildFourierModes({ seed: 42, mass: 0 });
  const high = buildFourierModes({ seed: 42, mass: 3 });
  assert.equal(low.modes.length, high.modes.length);
  for (let i = 0; i < low.modes.length; i++) {
    assert.equal(low.modes[i].k, high.modes[i].k);
    assert.ok(high.modes[i].omega > low.modes[i].omega);
  }
});

test("equalTimeCorrelation is finite, peaked at r = 0, and deterministic", () => {
  const field = buildFourierModes({ seed: 42, mass: 1 });
  const c1 = equalTimeCorrelation(field, { samples: 64 });
  const c2 = equalTimeCorrelation(field, { samples: 64 });
  assert.deepEqual(c1, c2);
  assert.equal(c1[0].r, 0);
  const peak = Math.max(...c1.map((p) => p.c));
  assert.equal(c1[0].c, peak);
  for (const p of c1) assert.ok(Number.isFinite(p.c));
});

test("fluxTubeProfile is a finite schematic grid with soft ends", () => {
  const tube = fluxTubeProfile({ separation: 6, tension: 1.2 });
  assert.equal(tube.separation, 6);
  assert.equal(tube.rows.length, 48);
  const centerPeak = tube.rows[24].radial[0].density;
  const edgePeak = tube.rows[0].radial[0].density;
  assert.ok(centerPeak > edgePeak, "profile tapers toward the sources");
  for (const row of tube.rows) {
    for (const s of row.radial) assert.ok(Number.isFinite(s.density) && s.density >= 0);
    for (let j = 1; j < row.radial.length; j++) {
      assert.ok(row.radial[j].density <= row.radial[j - 1].density + 1e-12);
    }
  }
});

test("modeOccupation counts and energies stay within the mode census", () => {
  const field = buildFourierModes({ seed: 42, mass: 1 });
  const all = modeOccupation(field);
  assert.equal(all.count, field.modes.length);
  assert.ok(all.energy > 0);
  const band = modeOccupation(field, { bandLow: 0, bandHigh: 0.5 });
  assert.ok(band.count <= all.count);
  assert.ok(band.energy <= all.energy + 1e-12);
});

test("provenance registers both lab views with honest statuses", () => {
  registerQftLabProvenance();
  registerQftLabProvenance(); // idempotent, no throw
  assert.equal(getVisualizationProvenance(QFT_FIELD_LAB_VIEW_ID).status, "effective");
  assert.equal(getVisualizationProvenance(QFT_FLUX_TUBE_VIEW_ID).status, "schematic");
  assert.ok(getVisualizationProvenance(QFT_FIELD_LAB_VIEW_ID).validity.length > 0);
});

test("export metadata reports the cutoff and mode census", () => {
  const meta = qftFieldExportMetadata(
    { qftLabMode: "correlation", qftLabMass: 2, seed: 42 },
    { kind: "cpu-samples", modes: 12 },
  );
  assert.equal(meta.qftFieldLab.view, QFT_FIELD_LAB_VIEW_ID);
  assert.equal(meta.qftFieldLab.mode, "correlation");
  assert.equal(meta.qftFieldLab.cutoffK, QFT_FIELD_DEFAULTS.cutoffK);
  assert.equal(meta.qftFieldLab.runtime.modes, 12);
});
