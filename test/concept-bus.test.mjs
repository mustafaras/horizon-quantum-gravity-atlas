import { test } from "node:test";
import assert from "node:assert/strict";
import { createConceptBus, CONCEPT_EVENT_TYPES } from "../js/linking/concept-bus.mjs";

test("typed payloads are runtime-validated on publish", () => {
  const bus = createConceptBus();
  const seen = [];
  bus.on("formula-highlight", (payload) => seen.push(payload));
  bus.publish("formula-highlight", { symbol: "T_{\\mu\\nu}", title: "Einstein field equations", view: "gr", interaction: "hover" });
  assert.deepEqual(seen.map((payload) => payload.symbol), ["T_{\\mu\\nu}"]);
  assert.throws(() => bus.publish("formula-highlight", { symbol: "x", title: "t", view: "gr", interaction: "drag" }), /interaction/);
  assert.throws(() => bus.publish("formula-highlight", { symbol: "", title: "t", view: "gr", interaction: "hover" }), /symbol/);
  assert.throws(() => bus.publish("nonsense-type", {}), /unknown event type/);
  assert.throws(() => bus.publish("formula-highlight", { symbol: "x", title: "t", view: "gr", interaction: "hover", extra: 1 }), /does not declare/);
});

test("unknown mappings are benign diagnostics, not exceptions", () => {
  const diagnostics = [];
  const bus = createConceptBus({ diagnostic: (message) => diagnostics.push(message) });
  const delivered = bus.publish("formula-clear", { reason: "blur" });
  assert.equal(delivered, 0, "no subscribers → nothing visible");
  assert.ok(diagnostics.some((message) => message.includes("no subscriber")), "diagnostic recorded");
  // validate() reports without throwing.
  const result = bus.validate("compare-camera", { side: "C", radius: 1, theta: 0, phi: 0 });
  assert.equal(result.ok, false);
  assert.match(result.error, /side/);
});

test("subscriber exceptions are isolated", () => {
  const bus = createConceptBus();
  let secondCalled = false;
  bus.on("palette-visibility", () => { throw new Error("bad listener"); });
  bus.on("palette-visibility", () => { secondCalled = true; });
  const delivered = bus.publish("palette-visibility", { open: true });
  assert.equal(secondCalled, true, "one bad listener cannot break the bus");
  assert.equal(delivered, 1);
});

test("unsubscribe works and payloads are frozen snapshots", () => {
  const bus = createConceptBus();
  const seen = [];
  const off = bus.on("formula-readout", (payload) => seen.push(payload));
  bus.publish("formula-readout", { symbol: "r_ph", label: "Photon orbit", value: "2.320", unit: "GM/c²" });
  off();
  bus.publish("formula-readout", { symbol: "r_isco", label: "ISCO", value: "1.000", unit: "GM/c²" });
  assert.equal(seen.length, 1);
  assert.throws(() => { seen[0].symbol = "mutate"; }, /Cannot assign|read only/);
  assert.equal(bus.subscriberCount("formula-readout"), 0);
  assert.deepEqual(bus.types, Object.keys(CONCEPT_EVENT_TYPES));
});

test("compare-camera payloads validate finite numbers and sides", () => {
  const bus = createConceptBus();
  const poses = [];
  bus.on("compare-camera", (payload) => poses.push(payload));
  bus.publish("compare-camera", { side: "A", radius: 12, theta: 0.6, phi: 1.1 });
  assert.equal(poses.length, 1);
  assert.throws(() => bus.publish("compare-camera", { side: "A", radius: Number.NaN, theta: 0, phi: 0 }), /finite/);
  assert.throws(() => bus.on("unknown", () => {}), /unknown type/);
});

test("formula-term carries a typed formula term: ids, a finite value and a unit", () => {
  const bus = createConceptBus();
  const seen = [];
  bus.on("formula-term", (payload) => seen.push(payload));
  bus.publish("formula-term", { formulaId: "schwarzschild-radius", termId: "r_s", value: 2953.25, unit: "m" });
  assert.deepEqual({ ...seen[0] }, { formulaId: "schwarzschild-radius", termId: "r_s", value: 2953.25, unit: "m" });
  assert.throws(() => bus.publish("formula-term", { formulaId: "", termId: "r_s", value: 1, unit: "m" }), /formulaId/);
  assert.throws(() => bus.publish("formula-term", { formulaId: "f", termId: "", value: 1, unit: "m" }), /termId/);
  assert.throws(() => bus.publish("formula-term", { formulaId: "f", termId: "t", value: Number.NaN, unit: "m" }), /value.*finite/);
  assert.throws(() => bus.publish("formula-term", { formulaId: "f", termId: "t", value: "2", unit: "m" }), /value.*finite/);
  assert.throws(() => bus.publish("formula-term", { formulaId: "f", termId: "t", value: 1 }), /unit/);
  assert.throws(() => bus.publish("formula-term", { formulaId: "f", termId: "t", value: 1, unit: "m", extra: true }), /does not declare/);
  assert.equal(bus.validate("formula-term", { formulaId: "f", termId: "t", value: 0, unit: "1" }).ok, true, "zero is a value");
});
