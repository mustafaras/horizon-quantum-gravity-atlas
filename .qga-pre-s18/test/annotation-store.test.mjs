import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ANNOTATION_LIMITS, validateAnnotation, validateAnnotationList,
  serializeAnnotationsParam, parseAnnotationsParam, createAnnotationStore, newAnnotationId,
} from "../js/annotations/annotation-store.mjs";

const worldPin = { id: "pin-1", anchor: "world", position: [1.5, -0.4, 2.2], text: "Photon ring", view: "bh" };
const screenPin = { id: "pin-2", anchor: "screen", position: [0.42, 0.31], text: "Read this first" };
const semanticPin = { id: "pin-3", anchor: "semantic", target: "kerr-formulation", text: "Live values" };

test("annotation validation enforces anchor types, text and coordinate shapes", () => {
  assert.equal(validateAnnotation(worldPin).ok, true);
  assert.equal(validateAnnotation(screenPin).ok, true);
  assert.equal(validateAnnotation(semanticPin).ok, true);
  assert.equal(validateAnnotation({ ...worldPin, anchor: "voodoo" }).ok, false);
  assert.equal(validateAnnotation({ ...worldPin, position: [1, 2] }).ok, false);
  assert.equal(validateAnnotation({ ...screenPin, position: [1.4, 0.5] }).ok, false, "screen pins must be normalized");
  assert.equal(validateAnnotation({ ...semanticPin, target: "" }).ok, false);
  assert.equal(validateAnnotation({ ...worldPin, text: "   " }).ok, false);
  assert.equal(validateAnnotation({ ...worldPin, text: "x".repeat(ANNOTATION_LIMITS.maxTextLength + 1) }).ok, false);
  assert.equal(validateAnnotation({ ...worldPin, text: "bad\u0007char" }).ok, false, "control characters rejected");
  assert.equal(validateAnnotation({ ...worldPin, id: "NOT-KEBAB" }).ok, false);
  assert.equal(validateAnnotation(null).ok, false);
});

test("list validation enforces the count limit and duplicate ids", () => {
  const many = Array.from({ length: ANNOTATION_LIMITS.maxAnnotations + 1 }, (_, index) => ({
    id: `pin-${index}`, anchor: "screen", position: [0.1, 0.1], text: "note",
  }));
  const result = validateAnnotationList(many);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((message) => message.includes("at most")));
  const dupes = validateAnnotationList([screenPin, { ...screenPin, text: "other" }]);
  assert.equal(dupes.ok, false);
  assert.ok(dupes.errors.some((message) => message.includes("duplicate")));
});

test("serialization round-trips through the URL parameter format", () => {
  const list = [worldPin, screenPin, semanticPin];
  const serialized = serializeAnnotationsParam(list);
  assert.equal(serialized.ok, true);
  const parsed = parseAnnotationsParam(serialized.value);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.annotations, list);
  // Empty and absent params are valid no-ops.
  assert.deepEqual(parseAnnotationsParam(null), { ok: true, annotations: [] });
  assert.deepEqual(parseAnnotationsParam(""), { ok: true, annotations: [] });
});

test("oversized and invalid annotation state is rejected with a reason", () => {
  const hugeText = "x".repeat(ANNOTATION_LIMITS.maxTextLength);
  // Twelve valid pins whose serialized form blows past the URL budget.
  const bulky = Array.from({ length: ANNOTATION_LIMITS.maxAnnotations }, (_, index) => ({
    id: `pin-${index}`, anchor: "screen", position: [0.2, 0.2], text: hugeText,
  }));
  const oversized = serializeAnnotationsParam(bulky);
  assert.equal(oversized.ok, false);
  assert.match(oversized.reason, /share limit/);

  assert.equal(parseAnnotationsParam("{not json").ok, false);
  assert.equal(parseAnnotationsParam('{"a":1}').ok, false);
  assert.equal(parseAnnotationsParam(JSON.stringify([{ id: "x", a: "voodoo", p: [1, 2, 3], x: "t" }])).ok, false, "unknown anchor rejected");
  assert.equal(parseAnnotationsParam(JSON.stringify([{ id: "x", a: "screen", p: [2, 0], x: "t" }])).ok, false, "unnormalized screen pin rejected");
  const tooManyParsed = parseAnnotationsParam(JSON.stringify(
    Array.from({ length: ANNOTATION_LIMITS.maxAnnotations + 1 }, (_, index) => ({ id: `p${index}`, a: "screen", p: [0.1, 0.1], x: "t" })),
  ));
  assert.equal(tooManyParsed.ok, false);
  assert.match(tooManyParsed.reason, /limit/);
  assert.deepEqual(tooManyParsed.annotations, [], "rejected state loads zero pins");
});

test("the working store validates every mutation result", () => {
  const events = [];
  const store = createAnnotationStore({ onChange: (list) => events.push(list.length) });
  assert.equal(store.add(worldPin).ok, true);
  assert.equal(store.add(screenPin).ok, true);
  assert.equal(store.add({ ...semanticPin, text: "" }).ok, false, "invalid pin refused");
  assert.equal(store.edit("pin-2", { text: "Updated note" }).ok, true);
  assert.deepEqual(store.annotations.find((pin) => pin.id === "pin-2").text, "Updated note");
  assert.equal(store.edit("pin-missing", { text: "x" }).ok, false);
  assert.equal(store.remove("pin-1").ok, true);
  assert.equal(store.remove("pin-1").ok, false);
  assert.equal(store.annotations.length, 1);
  assert.deepEqual(events, [1, 2, 2, 1]);
  // Count limit enforced on add.
  for (let index = 0; index < ANNOTATION_LIMITS.maxAnnotations; index++) {
    store.add({ id: `bulk-${index}`, anchor: "screen", position: [0.3, 0.3], text: "n" });
  }
  const over = store.add({ id: "over", anchor: "screen", position: [0.3, 0.3], text: "n" });
  assert.equal(over.ok, false);
  assert.ok(over.errors[0].includes("at most"));
});

test("newAnnotationId is kebab-safe and unique-ish", () => {
  const id = newAnnotationId(1700000000000);
  assert.match(id, /^pin-[a-z0-9]+-[a-z0-9]{3}$/);
  assert.notEqual(id, newAnnotationId(1700000000001));
});
