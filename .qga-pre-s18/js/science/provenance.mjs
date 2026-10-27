import { validateScientificProvenance, deepFreeze } from "./contracts.mjs";

const REGISTRY = new Map();

function normalizeId(id) {
  if (typeof id !== "string" || id.trim() === "") {
    throw new TypeError("Visualization id must be a non-empty string");
  }
  return id.trim();
}

export function registerVisualization(id, provenance) {
  const normalizedId = normalizeId(id);
  if (REGISTRY.has(normalizedId)) {
    throw new Error(`Visualization provenance already registered for duplicate id: ${normalizedId}`);
  }
  const normalized = validateScientificProvenance(provenance);
  REGISTRY.set(normalizedId, normalized);
  return normalized;
}

export function getVisualizationProvenance(id) {
  const normalizedId = normalizeId(id);
  return REGISTRY.get(normalizedId) ?? null;
}

export function listVisualizationProvenance() {
  return deepFreeze(
    Array.from(REGISTRY.entries(), ([id, provenance]) => deepFreeze({ id, provenance })),
  );
}

/**
 * A caption names its registry entry and states a status. The two must agree: the registry is the single source of
 * the status a figure is allowed to wear, so a caption can neither drop it nor change it.
 */
export function assertCaptionProvenance(id, status) {
  if (typeof id !== "string" || id.trim() === "") {
    throw new TypeError("A caption requires a provenanceId");
  }
  const provenance = REGISTRY.get(id.trim());
  if (!provenance) throw new Error(`Caption provenanceId is not registered: ${id}`);
  if (status !== undefined && status !== provenance.status) {
    throw new Error(`Caption status "${status}" differs from the registered status "${provenance.status}" of ${id}`);
  }
  return provenance;
}
