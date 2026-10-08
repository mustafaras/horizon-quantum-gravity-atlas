import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  registerVisualization,
  getVisualizationProvenance,
  listVisualizationProvenance,
} from "../js/science/provenance.mjs";

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
