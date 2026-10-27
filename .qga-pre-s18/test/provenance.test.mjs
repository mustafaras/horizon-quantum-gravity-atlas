import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  registerVisualization,
  getVisualizationProvenance,
  listVisualizationProvenance,
  assertCaptionProvenance,
} from "../js/science/provenance.mjs";
import { SCIENTIFIC_LAYER_CLASSES } from "../js/science/contracts.mjs";

function makeId(name) {
  return `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeProvenance(overrides = {}) {
  return {
    model: "Kerr black hole exterior",
    status: "effective",
    assumptions: ["stationary axisymmetric vacuum exterior", "dimensionless spin a* <= 0.998"],
    validity: ["outside the horizon", "visual shading is schematic while radii remain labeled"],
    numericalMethod: "analytic Kerr radii with deterministic sampling",
    references: ["Wald (1984)", "Bardeen, Press & Teukolsky (1972)"],
    layers: [
      { name: "Kerr radii", class: "model" },
      { name: "Backdrop stars", class: "decoration" },
    ],
    seed: "none: closed forms only",
    ...overrides,
  };
}

test("registerVisualization stores immutable provenance by id", () => {
  const id = makeId("kerr-observatory");
  const stored = registerVisualization(id, makeProvenance());
  const fetched = getVisualizationProvenance(id);
  assert.equal(fetched, stored);
  assert.equal(fetched.model, "Kerr black hole exterior");
  assert.throws(() => {
    fetched.assumptions.push("late mutation");
  }, TypeError);
});

test("registerVisualization rejects duplicate ids", () => {
  const id = makeId("duplicate");
  registerVisualization(id, makeProvenance());
  assert.throws(() => registerVisualization(id, makeProvenance()), /duplicate/i);
});

test("registerVisualization rejects invalid provenance status labels", () => {
  const id = makeId("invalid-status");
  assert.throws(
    () => registerVisualization(id, makeProvenance({ status: "observed" })),
    /status/,
  );
});

test("listVisualizationProvenance returns frozen inventory entries", () => {
  const id = makeId("inventory");
  registerVisualization(id, makeProvenance({ status: "schematic" }));
  const entries = listVisualizationProvenance().filter((entry) => entry.id === id);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].provenance.status, "schematic");
  assert.throws(() => {
    entries[0].id = "mutated";
  }, TypeError);
});

test("science provenance stays independent from render-layer imports", async () => {
  const source = await readFile(new URL("../js/science/provenance.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\.\.\/render\/contracts\.mjs/);
  assert.match(source, /from "\.\/contracts\.mjs"/);
});

test("layer classes are exactly data, model and decoration", () => {
  assert.deepEqual([...SCIENTIFIC_LAYER_CLASSES], ["data", "model", "decoration"]);
});

test("registerVisualization stores the layer table and the seed", () => {
  const stored = registerVisualization(makeId("layers"), makeProvenance());
  assert.deepEqual(stored.layers.map((layer) => layer.class), ["model", "decoration"]);
  assert.equal(stored.seed, "none: closed forms only");
  assert.throws(() => {
    stored.layers[0].class = "data";
  }, TypeError);
});

test("registerVisualization rejects a missing, empty or malformed layer table", () => {
  const id = makeId("bad-layers");
  assert.throws(() => registerVisualization(id, makeProvenance({ layers: undefined })), /layers/);
  assert.throws(() => registerVisualization(id, makeProvenance({ layers: [] })), /layers/);
  assert.throws(() => registerVisualization(id, makeProvenance({ layers: "model" })), /layers/);
  assert.throws(() => registerVisualization(id, makeProvenance({ layers: [null] })), /layers\[0\]/);
  assert.throws(() => registerVisualization(id, makeProvenance({ layers: [{ name: "x", class: "overlay" }] })), /class/);
  assert.throws(() => registerVisualization(id, makeProvenance({ layers: [{ name: " ", class: "data" }] })), /name/);
});

test("registerVisualization rejects two layers with the same name", () => {
  const layers = [{ name: "Field", class: "model" }, { name: "Field", class: "decoration" }];
  assert.throws(() => registerVisualization(makeId("dup-layers"), makeProvenance({ layers })), /duplicate layer/i);
});

test("registerVisualization requires the seed to be stated", () => {
  assert.throws(() => registerVisualization(makeId("no-seed"), makeProvenance({ seed: undefined })), /seed/);
  assert.throws(() => registerVisualization(makeId("blank-seed"), makeProvenance({ seed: "  " })), /seed/);
});

test("assertCaptionProvenance passes when the caption status matches the registry", () => {
  const id = makeId("caption-ok");
  registerVisualization(id, makeProvenance({ status: "schematic" }));
  assert.equal(assertCaptionProvenance(id, "schematic").status, "schematic");
});

test("assertCaptionProvenance rejects a status that differs from the registered one", () => {
  const id = makeId("caption-mismatch");
  registerVisualization(id, makeProvenance({ status: "effective" }));
  assert.throws(() => assertCaptionProvenance(id, "schematic"), /status/);
});

test("assertCaptionProvenance rejects a caption without a registered id", () => {
  assert.throws(() => assertCaptionProvenance(makeId("unregistered"), "schematic"), /not registered/);
  assert.throws(() => assertCaptionProvenance(undefined, "schematic"), /provenanceId/);
});
