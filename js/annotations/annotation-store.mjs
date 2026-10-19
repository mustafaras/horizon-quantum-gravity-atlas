/**
 * Annotation store (Prompt 10): schema-validated, size-limited annotation
 * pins that serialize into the shareable URL state.
 *
 * Pin anchor types (explicit on every pin):
 *   - "semantic": stable anchor id resolved against [data-qga-anchor]
 *     elements in the mounted view.
 *   - "world":    normalized [x,y,z] in the active 3D scene's world space
 *     (projected per frame; depth-aware occlusion fading).
 *   - "screen":   normalized [x,y] within the content column; tracks
 *     scroll and resize.
 *
 * Discipline:
 *   - Text renders as text, never innerHTML (the UI layer enforces this;
 *     the store refuses control characters outright).
 *   - Annotations enter shared state ONLY after text, count and serialized
 *     size limits pass (validate → serialize → URL).
 *   - Annotation state never touches scientific simulation parameters —
 *     it is display-only and no module reads it.
 */

export const ANNOTATION_SCHEMA = "horizon-qga-annotations/v1";

export const ANNOTATION_LIMITS = Object.freeze({
  maxAnnotations: 12,
  maxTextLength: 280,
  maxSerializedLength: 1200, // URL budget for the whole `ann` parameter
  maxIdLength: 48,
});

const ANCHOR_TYPES = Object.freeze(["semantic", "world", "screen"]);
const ID_PATTERN = /^[a-z0-9-]{1,48}$/;
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

/** Validate one annotation pin. Returns { ok, errors: [] } — never throws. */
export function validateAnnotation(annotation) {
  const errors = [];
  if (typeof annotation !== "object" || annotation === null || Array.isArray(annotation)) {
    return { ok: false, errors: ["annotation must be an object"] };
  }
  const { id, anchor, text } = annotation;
  if (typeof id !== "string" || !ID_PATTERN.test(id)) errors.push(`id must match ${ID_PATTERN}`);
  if (!ANCHOR_TYPES.includes(anchor)) errors.push(`anchor must be one of ${ANCHOR_TYPES.join(", ")}`);
  if (typeof text !== "string" || !text.trim()) errors.push("text must be a non-empty string");
  else if (text.length > ANNOTATION_LIMITS.maxTextLength) errors.push(`text exceeds ${ANNOTATION_LIMITS.maxTextLength} characters`);
  else if (CONTROL_CHARS.test(text)) errors.push("text contains control characters");
  if (anchor === "semantic") {
    if (typeof annotation.target !== "string" || !annotation.target || annotation.target.length > ANNOTATION_LIMITS.maxIdLength) {
      errors.push("semantic anchor requires a target id");
    }
  } else if (anchor === "world") {
    const point = annotation.position;
    if (!Array.isArray(point) || point.length !== 3 || !point.every((n) => Number.isFinite(n))) {
      errors.push("world anchor requires position: [x, y, z]");
    }
  } else if (anchor === "screen") {
    const point = annotation.position;
    if (!Array.isArray(point) || point.length !== 2
        || !point.every((n) => Number.isFinite(n) && n >= 0 && n <= 1)) {
      errors.push("screen anchor requires normalized position: [x, y] in [0, 1]");
    }
  }
  if (annotation.view != null && (typeof annotation.view !== "string" || annotation.view.length > 24)) {
    errors.push("view must be a short string when present");
  }
  if (annotation.concept != null && (typeof annotation.concept !== "string" || annotation.concept.length > 96)) {
    errors.push("concept must be a short string when present");
  }
  return { ok: errors.length === 0, errors };
}

/** Validate a full list (count + each pin). Returns { ok, errors }. */
export function validateAnnotationList(list) {
  if (!Array.isArray(list)) return { ok: false, errors: ["annotations must be an array"] };
  const errors = [];
  if (list.length > ANNOTATION_LIMITS.maxAnnotations) errors.push(`at most ${ANNOTATION_LIMITS.maxAnnotations} annotations are shareable`);
  const seen = new Set();
  for (const annotation of list) {
    const result = validateAnnotation(annotation);
    if (!result.ok) errors.push(...result.errors.map((message) => `${annotation?.id ?? "?"}: ${message}`));
    if (seen.has(annotation?.id)) errors.push(`duplicate annotation id "${annotation?.id}"`);
    seen.add(annotation?.id);
  }
  return { ok: errors.length === 0, errors };
}

/** Deterministic short id for new pins (no crypto dependency). */
export function newAnnotationId(now = Date.now()) {
  return `pin-${now.toString(36)}-${Math.floor(Math.random() * 46656).toString(36).padStart(3, "0")}`;
}

/**
 * Serialize a validated list into the compact `ann` URL parameter value.
 * Returns { ok: true, value } or { ok: false, reason } — the caller only
 * writes shared state on ok.
 */
export function serializeAnnotationsParam(list) {
  const validation = validateAnnotationList(list);
  if (!validation.ok) return { ok: false, reason: validation.errors.join("; ") };
  const compact = list.map((annotation) => {
    const record = { id: annotation.id, a: annotation.anchor };
    if (annotation.anchor === "semantic") record.t = annotation.target;
    else record.p = annotation.position.map((n) => Math.round(n * 1000) / 1000);
    if (annotation.view) record.v = annotation.view;
    if (annotation.concept) record.c = annotation.concept;
    record.x = annotation.text;
    return record;
  });
  const encoded = JSON.stringify(compact);
  if (encoded.length > ANNOTATION_LIMITS.maxSerializedLength) {
    return {
      ok: false,
      reason: `annotations exceed the ${ANNOTATION_LIMITS.maxSerializedLength}-character share limit (${encoded.length} characters); remove or shorten pins`,
    };
  }
  return { ok: true, value: encoded };
}

/**
 * Parse and validate an `ann` parameter value. Always returns a decision:
 *   { ok: true, annotations }            — load them
 *   { ok: false, reason, annotations: [] } — reject visibly, load none
 */
export function parseAnnotationsParam(raw) {
  if (raw == null || raw === "") return { ok: true, annotations: [] };
  const fail = (reason) => ({ ok: false, reason, annotations: [] });
  if (typeof raw !== "string" || raw.length > ANNOTATION_LIMITS.maxSerializedLength * 2) {
    return fail("annotation state is missing or oversized");
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return fail("annotation state is not valid JSON");
  }
  if (!Array.isArray(parsed)) return fail("annotation state must be an array");
  if (parsed.length > ANNOTATION_LIMITS.maxAnnotations) {
    return fail(`annotation state exceeds the ${ANNOTATION_LIMITS.maxAnnotations}-pin limit`);
  }
  const annotations = [];
  for (const record of parsed) {
    if (typeof record !== "object" || record === null) return fail("annotation entry is malformed");
    const annotation = {
      id: record.id,
      anchor: record.a,
      text: typeof record.x === "string" ? record.x : "",
    };
    if (annotation.anchor === "semantic") annotation.target = record.t;
    else if (annotation.anchor === "world" || annotation.anchor === "screen") {
      annotation.position = Array.isArray(record.p) ? record.p : null;
    } else return fail(`unknown annotation anchor "${record.a}"`);
    if (record.v) annotation.view = record.v;
    if (record.c) annotation.concept = record.c;
    const validation = validateAnnotation(annotation);
    if (!validation.ok) return fail(`annotation rejected: ${validation.errors.join("; ")}`);
    annotations.push(annotation);
  }
  const sizeCheck = serializeAnnotationsParam(annotations);
  if (!sizeCheck.ok) return fail(sizeCheck.reason);
  return { ok: true, annotations };
}

/**
 * Working-store operations over the current list. Every mutator validates
 * the RESULT before returning it, so an invalid edit can never enter state.
 */
export function createAnnotationStore({ list = [], onChange } = {}) {
  let current = [...list];
  const commit = (next, validation) => {
    if (!validation.ok) return { ok: false, errors: validation.errors };
    current = next;
    if (typeof onChange === "function") onChange(current);
    return { ok: true, annotations: current };
  };
  return Object.freeze({
    get annotations() { return [...current]; },
    add(annotation) {
      if (current.length >= ANNOTATION_LIMITS.maxAnnotations) {
        return { ok: false, errors: [`at most ${ANNOTATION_LIMITS.maxAnnotations} annotations are shareable`] };
      }
      const next = [...current, annotation];
      return commit(next, validateAnnotationList(next));
    },
    edit(id, patch) {
      const next = current.map((annotation) => annotation.id === id ? { ...annotation, ...patch, id } : annotation);
      if (next.every((annotation, index) => annotation === current[index])) {
        return { ok: false, errors: [`no annotation with id "${id}"`] };
      }
      return commit(next, validateAnnotationList(next));
    },
    remove(id) {
      const next = current.filter((annotation) => annotation.id !== id);
      if (next.length === current.length) return { ok: false, errors: [`no annotation with id "${id}"`] };
      return commit(next, validateAnnotationList(next));
    },
    replace(list) {
      return commit([...list], validateAnnotationList(list));
    },
  });
}
