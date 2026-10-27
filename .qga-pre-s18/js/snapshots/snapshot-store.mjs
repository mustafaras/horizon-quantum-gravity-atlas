/**
 * Snapshot store (Prompt 10): named, locally stored atlas states with schema
 * versioning, provenance and optional thumbnails — the same versioning and
 * compatibility discipline as the "horizon-qga-state/v1" export schema.
 *
 * Storage contract:
 *   - Injected `storage` (localStorage in the app, memory in tests) with
 *     read/write failures surfaced as visible errors, never thrown.
 *   - Import validates the full payload against the schema; a conflicting id
 *     is resolved EXPLICITLY: the import is kept as a copy with a fresh id
 *     and the result says so — existing data is never silently overwritten.
 *   - Thumbnails are optional dataURL strings with their own size cap so a
 *     corrupted or oversized image cannot wedge the store.
 */

export const SNAPSHOT_SCHEMA = "horizon-qga-snapshot/v1";

export const SNAPSHOT_LIMITS = Object.freeze({
  maxSnapshots: 8,
  maxNameLength: 60,
  maxThumbnailLength: 131072, // ~128 KB dataURL
  maxStateKeys: 96,
});

const isPlainObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

/** Validate a snapshot payload (own file or localStorage row). Never throws. */
export function validateSnapshotPayload(payload) {
  const errors = [];
  if (!isPlainObject(payload)) return { ok: false, errors: ["snapshot must be an object"] };
  if (payload.schema !== SNAPSHOT_SCHEMA) {
    errors.push(`schema must be "${SNAPSHOT_SCHEMA}" (received ${JSON.stringify(payload.schema)})`);
  }
  if (typeof payload.id !== "string" || !/^[a-z0-9-]{1,64}$/.test(payload.id)) {
    errors.push("id must be a short kebab-case string");
  }
  if (typeof payload.name !== "string" || !payload.name.trim()) errors.push("name must be a non-empty string");
  else if (payload.name.length > SNAPSHOT_LIMITS.maxNameLength) errors.push(`name exceeds ${SNAPSHOT_LIMITS.maxNameLength} characters`);
  if (typeof payload.createdAt !== "string" || Number.isNaN(Date.parse(payload.createdAt))) {
    errors.push("createdAt must be an ISO-8601 timestamp");
  }
  if (!isPlainObject(payload.state)) errors.push("state must be an object");
  else if (Object.keys(payload.state).length > SNAPSHOT_LIMITS.maxStateKeys) {
    errors.push(`state exceeds ${SNAPSHOT_LIMITS.maxStateKeys} keys`);
  }
  if (!isPlainObject(payload.provenance)) errors.push("provenance must be an object");
  else {
    if (typeof payload.provenance.view !== "string" || !payload.provenance.view) errors.push("provenance.view is required");
    if (payload.provenance.url != null && typeof payload.provenance.url !== "string") errors.push("provenance.url must be a string when present");
  }
  if (payload.thumbnail != null) {
    if (typeof payload.thumbnail !== "string" || !/^data:image\/(png|webp);base64,/.test(payload.thumbnail)) {
      errors.push("thumbnail must be a png/webp dataURL");
    } else if (payload.thumbnail.length > SNAPSHOT_LIMITS.maxThumbnailLength) {
      errors.push(`thumbnail exceeds ${SNAPSHOT_LIMITS.maxThumbnailLength} characters`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/** Build a well-formed snapshot from a live state (id/time injected). */
export function createSnapshotRecord({ id, name, state, view, url, thumbnail = null, createdAt = new Date().toISOString() }) {
  return {
    schema: SNAPSHOT_SCHEMA,
    id, name: String(name).slice(0, SNAPSHOT_LIMITS.maxNameLength).trim() || "Untitled snapshot",
    createdAt, state: { ...state },
    provenance: { view: String(view ?? state?.view ?? "overview"), url: url ?? null },
    thumbnail,
  };
}

/**
 * localStorage-backed store. `storage` defaults to a memory map so Node
 * tests and private-mode browsers share one code path.
 */
export function createSnapshotStore({ storage = null, storageKey = "qga-snapshots", limits = SNAPSHOT_LIMITS } = {}) {
  const backend = storage ?? new Map();
  const readAll = () => {
    try {
      const raw = typeof backend.getItem === "function" ? backend.getItem(storageKey) : null;
      if (!raw) return { ok: true, snapshots: [] };
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return { ok: false, error: "stored snapshot list is malformed", snapshots: [] };
      const snapshots = [];
      for (const payload of parsed) {
        const validation = validateSnapshotPayload(payload);
        if (validation.ok) snapshots.push(payload);
        // Invalid rows are dropped, not fatal: one bad row must not take
        // the whole panel down. The count is reported for the UI.
      }
      return { ok: true, snapshots, dropped: parsed.length - snapshots.length };
    } catch (error) {
      return { ok: false, error: `snapshot storage could not be read (${error.message})`, snapshots: [] };
    }
  };
  const writeAll = (snapshots) => {
    try {
      const raw = JSON.stringify(snapshots);
      if (typeof backend.setItem === "function") backend.setItem(storageKey, raw);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: `snapshot storage could not be written (${error.message})` };
    }
  };

  return Object.freeze({
    list: readAll,
    save(record) {
      const validation = validateSnapshotPayload(record);
      if (!validation.ok) return { ok: false, errors: validation.errors };
      const { snapshots } = readAll();
      const withoutSame = snapshots.filter((snapshot) => snapshot.id !== record.id);
      const next = [record, ...withoutSame].slice(0, limits.maxSnapshots);
      const write = writeAll(next);
      if (!write.ok) return write;
      return { ok: true, snapshot: record, evicted: Math.max(0, withoutSame.length + 1 - next.length) };
    },
    remove(id) {
      const { snapshots } = readAll();
      const next = snapshots.filter((snapshot) => snapshot.id !== id);
      if (next.length === snapshots.length) return { ok: false, errors: [`no snapshot with id "${id}"`] };
      const write = writeAll(next);
      return write.ok ? { ok: true } : write;
    },
    /**
     * Import a payload. Conflict behavior is explicit: an id that already
     * exists keeps the stored snapshot untouched and imports the file as a
     * copy with a fresh id — the result always says which id was used.
     */
    import(payload, { now = Date.now() } = {}) {
      const validation = validateSnapshotPayload(payload);
      if (!validation.ok) return { ok: false, errors: validation.errors };
      const { snapshots } = readAll();
      let record = payload;
      let importedAs = payload.id;
      let conflict = false;
      if (snapshots.some((snapshot) => snapshot.id === payload.id)) {
        conflict = true;
        importedAs = `${payload.id}-import-${now.toString(36)}`;
        record = { ...payload, id: importedAs };
      }
      const next = [record, ...snapshots].slice(0, limits.maxSnapshots);
      const write = writeAll(next);
      if (!write.ok) return write;
      return { ok: true, snapshot: record, importedAs, conflict, evicted: Math.max(0, snapshots.length + 1 - next.length) };
    },
    export(id) {
      const { snapshots } = readAll();
      const snapshot = snapshots.find((entry) => entry.id === id);
      if (!snapshot) return { ok: false, errors: [`no snapshot with id "${id}"`] };
      return { ok: true, payload: { ...snapshot, exportedAt: new Date().toISOString() } };
    },
  });
}
