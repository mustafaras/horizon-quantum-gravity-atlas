import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SNAPSHOT_SCHEMA, SNAPSHOT_LIMITS, validateSnapshotPayload,
  createSnapshotRecord, createSnapshotStore,
} from "../js/snapshots/snapshot-store.mjs";

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)); },
    removeItem: (key) => { map.delete(key); },
    _map: map,
  };
}

const baseRecord = () => createSnapshotRecord({
  id: "snap-kerr-09", name: "Kerr a★ 0.9 edge view",
  state: { view: "bh", bhMass: 1, bhSpin: 0.9, bhInclination: 75 },
  view: "bh", url: "?view=bh&bhs=0.9",
});

test("snapshot schema validation accepts well-formed records and rejects corruption", () => {
  const record = baseRecord();
  assert.equal(record.schema, SNAPSHOT_SCHEMA);
  const validation = validateSnapshotPayload(record);
  assert.equal(validation.ok, true, validation.errors?.join("; "));

  assert.equal(validateSnapshotPayload({ ...record, schema: "horizon-qga-snapshot/v2" }).ok, false, "wrong schema version");
  assert.equal(validateSnapshotPayload({ ...record, id: "NOT VALID" }).ok, false);
  assert.equal(validateSnapshotPayload({ ...record, createdAt: "yesterday" }).ok, false);
  assert.equal(validateSnapshotPayload({ ...record, state: null }).ok, false);
  assert.equal(validateSnapshotPayload({ ...record, provenance: {} }).ok, false);
  assert.equal(validateSnapshotPayload({ ...record, thumbnail: "data:image/jpeg;base64,xxx" }).ok, false, "only png/webp thumbnails");
  assert.equal(validateSnapshotPayload({ ...record, thumbnail: "data:image/webp;base64," + "A".repeat(SNAPSHOT_LIMITS.maxThumbnailLength + 1) }).ok, false);
  assert.equal(validateSnapshotPayload(null).ok, false);
  assert.equal(validateSnapshotPayload({ ...record, name: "x".repeat(SNAPSHOT_LIMITS.maxNameLength + 1) }).ok, false);
});

test("store save/list/remove round-trips through injected storage", () => {
  const storage = memoryStorage();
  const store = createSnapshotStore({ storage });
  const record = baseRecord();
  const saved = store.save(record);
  assert.equal(saved.ok, true);
  const { snapshots } = store.list();
  assert.equal(snapshots.length, 1);
  assert.deepEqual(snapshots[0].state, record.state);
  assert.equal(store.remove(record.id).ok, true);
  assert.equal(store.remove(record.id).ok, false);
  assert.equal(store.list().snapshots.length, 0);
});

test("save enforces the snapshot cap with explicit eviction", () => {
  const store = createSnapshotStore({ storage: memoryStorage() });
  for (let index = 0; index < SNAPSHOT_LIMITS.maxSnapshots + 2; index++) {
    const result = store.save(createSnapshotRecord({
      id: `snap-${index}`, name: `Snapshot ${index}`,
      state: { view: "rg" }, view: "rg", url: "?view=rg",
    }));
    assert.equal(result.ok, true);
  }
  const { snapshots } = store.list();
  assert.equal(snapshots.length, SNAPSHOT_LIMITS.maxSnapshots);
  assert.equal(snapshots[0].id, `snap-${SNAPSHOT_LIMITS.maxSnapshots + 1}`, "newest kept first");
});

test("import validates schema and resolves id conflicts explicitly as copies", () => {
  const storage = memoryStorage();
  const store = createSnapshotStore({ storage });
  const record = baseRecord();
  store.save(record);

  // Invalid payload refused.
  const bad = store.import({ ...record, id: "bad record", schema: "nope" });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.length > 0);

  // Conflicting id → imported as an explicit copy, original untouched.
  const conflict = store.import({ ...record, name: "Imported copy" }, { now: 1700000000000 });
  assert.equal(conflict.ok, true);
  assert.equal(conflict.conflict, true);
  assert.match(conflict.importedAs, /-import-/);
  const { snapshots } = store.list();
  assert.equal(snapshots.length, 2);
  assert.deepEqual(snapshots.find((entry) => entry.id === record.id).name, record.name, "original untouched");
  assert.equal(snapshots.find((entry) => entry.id === conflict.importedAs).name, "Imported copy");

  // Fresh id imports directly.
  const fresh = store.import(createSnapshotRecord({ id: "snap-other", name: "Other", state: { view: "sm" }, view: "sm" }));
  assert.equal(fresh.ok, true);
  assert.equal(fresh.conflict, false);
  assert.equal(fresh.importedAs, "snap-other");
});

test("export returns the stored payload plus an export timestamp", () => {
  const store = createSnapshotStore({ storage: memoryStorage() });
  const record = baseRecord();
  store.save(record);
  const exported = store.export(record.id);
  assert.equal(exported.ok, true);
  assert.equal(exported.payload.id, record.id);
  assert.ok(Date.parse(exported.payload.exportedAt) > 0);
  assert.equal(store.export("missing").ok, false);
});

test("corrupted storage rows are dropped, not fatal", () => {
  const storage = memoryStorage();
  storage.setItem("qga-snapshots", JSON.stringify([
    baseRecord(),
    { schema: "garbage", id: "x", name: 5 },
    "not-even-an-object",
  ]));
  const store = createSnapshotStore({ storage });
  const { ok, snapshots, dropped } = store.list();
  assert.equal(ok, true);
  assert.equal(snapshots.length, 1);
  assert.equal(dropped, 2);
});

test("storage failures surface as visible errors, never throws", () => {
  const failing = {
    getItem: () => { throw new Error("quota"); },
    setItem: () => { throw new Error("quota"); },
  };
  const store = createSnapshotStore({ storage: failing });
  const listed = store.list();
  assert.equal(listed.ok, false);
  assert.match(listed.error, /quota/);
  const saved = store.save(baseRecord());
  assert.equal(saved.ok, false);
  assert.match(saved.error, /quota/);
});
