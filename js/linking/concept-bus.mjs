/**
 * ConceptBus (Prompt 10): typed publish/subscribe bus connecting formula
 * symbols, scene objects, annotations and the command palette.
 *
 * Contract:
 *   - Every event has a declared type with a runtime-validated payload.
 *   - publish() with an unknown type or an invalid payload THROWS in
 *     development (programmer error) — subscribers never see malformed data.
 *   - Unknown *mappings* (e.g. a formula symbol no scene registered) are a
 *     different, benign class: the bus reports them through the dev
 *     diagnostic channel (console.debug) and nothing visible happens.
 *   - Subscriptions return an unsubscribe function; subscriber exceptions
 *     are isolated so one bad listener cannot break the bus.
 */

const isPlainObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

/** Field validators: "string", "number", "boolean", or exact-match enums. */
export const CONCEPT_EVENT_TYPES = Object.freeze({
  "formula-highlight": Object.freeze({
    description: "A formula symbol was hovered, focused or clicked.",
    fields: Object.freeze({
      symbol: "string", title: "string", view: "string",
      interaction: Object.freeze(["hover", "focus", "click", "preview"]),
    }),
  }),
  "formula-readout": Object.freeze({
    description: "A scene concept target reports the live numerical value for a symbol.",
    fields: Object.freeze({ symbol: "string", label: "string", value: "string", unit: "string" }),
  }),
  "formula-clear": Object.freeze({
    description: "The active formula highlight ended.",
    fields: Object.freeze({ reason: Object.freeze(["blur", "escape", "navigation", "end"]) }),
  }),
  "palette-visibility": Object.freeze({
    description: "The command palette opened or closed (scenes pause idle drift while open).",
    fields: Object.freeze({ open: "boolean" }),
  }),
  "annotation-hover": Object.freeze({
    description: "An annotation pin was hovered or focused; highlights its linked scene object.",
    fields: Object.freeze({ id: "string", concept: "string" }),
  }),
  "compare-camera": Object.freeze({
    description: "A compare side broadcast its camera pose for synchronized orbit.",
    fields: Object.freeze({ side: Object.freeze(["A", "B"]), radius: "number", theta: "number", phi: "number" }),
  }),
});

function validatePayload(type, payload) {
  const declaration = CONCEPT_EVENT_TYPES[type];
  if (!declaration) throw new TypeError(`ConceptBus: unknown event type "${type}"`);
  if (!isPlainObject(payload)) throw new TypeError(`ConceptBus: "${type}" payload must be an object`);
  for (const [field, rule] of Object.entries(declaration.fields)) {
    const value = payload[field];
    if (Array.isArray(rule)) {
      if (!rule.includes(value)) throw new TypeError(`ConceptBus: "${type}.${field}" must be one of ${JSON.stringify(rule)}; received ${JSON.stringify(value)}`);
    } else if (rule === "string") {
      if (typeof value !== "string" || !value) throw new TypeError(`ConceptBus: "${type}.${field}" must be a non-empty string`);
    } else if (rule === "number") {
      if (!Number.isFinite(value)) throw new TypeError(`ConceptBus: "${type}.${field}" must be a finite number`);
    } else if (rule === "boolean") {
      if (typeof value !== "boolean") throw new TypeError(`ConceptBus: "${type}.${field}" must be a boolean`);
    }
  }
  for (const key of Object.keys(payload)) {
    if (!(key in declaration.fields)) throw new TypeError(`ConceptBus: "${type}" does not declare field "${key}"`);
  }
}

/**
 * Create a bus. `diagnostic` receives benign mapping misses (default:
 * console.debug, only when a devtools console is present).
 */
export function createConceptBus({ diagnostic } = {}) {
  const report = typeof diagnostic === "function"
    ? diagnostic
    : (message) => { try { console.debug("[ConceptBus]", message); } catch (error) { /* no console */ } };
  const subscribers = new Map(); // type -> Set<listener>
  let sequence = 0;

  function on(type, listener) {
    const declaration = CONCEPT_EVENT_TYPES[type];
    if (!declaration) throw new TypeError(`ConceptBus: cannot subscribe to unknown type "${type}"`);
    if (typeof listener !== "function") throw new TypeError("ConceptBus: listener must be a function");
    if (!subscribers.has(type)) subscribers.set(type, new Set());
    subscribers.get(type).add(listener);
    return () => subscribers.get(type)?.delete(listener);
  }

  function publish(type, payload) {
    validatePayload(type, payload);
    const listeners = subscribers.get(type);
    if (!listeners || listeners.size === 0) {
      report(`no subscriber for "${type}"`);
      return 0;
    }
    const envelope = Object.freeze({ type, payload: Object.freeze({ ...payload }), sequence: sequence++ });
    let delivered = 0;
    for (const listener of [...listeners]) {
      try {
        listener(envelope.payload, envelope);
        delivered++;
      } catch (error) {
        report(`subscriber for "${type}" threw: ${error?.message ?? error}`);
      }
    }
    return delivered;
  }

  /** Validate without delivering — used by tests and pre-flight checks. */
  function validate(type, payload) {
    try {
      validatePayload(type, payload);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  return Object.freeze({
    on, publish, validate,
    get types() { return Object.keys(CONCEPT_EVENT_TYPES); },
    subscriberCount(type) { return subscribers.get(type)?.size ?? 0; },
  });
}
