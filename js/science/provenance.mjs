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
