// Text alternatives for 3D scenes (S34). A scene's author writes what it looks like; this module adds what it *is*: the
// model and the status from the scene's registered provenance, its layer classes, and the current values of the Formula
// Core terms the scene is bound to, so a reader who cannot see the canvas still learns which model is running and where
// its parameters stand. Pure: it reads a provenance entry and a lens registry, both injected.

const fmt = (v) => (Number.isFinite(v) ? Number(v.toPrecision(4)).toString() : "n/a");
const MAX_READOUTS = 4;

/** `{ data, model, decoration }` counts of an entry's layers. */
export function layerCounts(provenance) {
  const counts = { data: 0, model: 0, decoration: 0 };
  for (const layer of provenance?.layers ?? []) if (layer.class in counts) counts[layer.class] += 1;
  return counts;
}

/** `name = value unit` for one readout; the unit is omitted when there is none. */
export function formatReadout({ label, value, unit }) {
  return `${label} = ${fmt(value)}${unit ? ` ${unit}` : ""}`;
}

/**
 * The current values of the terms a lens registry has bound for `formulaId`: `[{ label, value, unit }]`, at most
 * `limit`. A term the scene cannot evaluate yet (`termEvent` returns null) is left out rather than invented.
 */
export function lensReadouts(registry, formulaId, { limit = MAX_READOUTS, termLabel = (_formula, termId) => termId } = {}) {
  const formula = registry?.formula?.(formulaId);
  const binding = registry?.binding?.(formulaId);
  if (!formula || !binding) return [];
  const out = [];
  for (const termId of Object.keys(binding.termTargets)) {
    if (out.length >= limit) break;
    const event = registry.termEvent(formulaId, termId);
    if (!event) continue;
    out.push({ label: termLabel(formula, termId), value: event.value, unit: event.unit });
  }
  return out;
}

/**
 * `<what it looks like>. Model: <model>. Status: <status>. Layers: <n> data, <n> model, <n> decoration. Key values: a = 1, b = 2 kg.`
 * Sections whose source is missing are left out; the author's own sentence is always first.
 */
export function sceneAltText({ base, provenance = null, readouts = [] } = {}) {
  const parts = [String(base ?? "Interactive 3D scientific visualization").replace(/[.\s]+$/, "")];
  if (provenance) {
    const c = layerCounts(provenance);
    parts.push(`Model: ${String(provenance.model).replace(/[.\s]+$/, "")}`);
    parts.push(`Status: ${provenance.status}`);
    parts.push(`Layers: ${c.data} data, ${c.model} model, ${c.decoration} decoration`);
  }
  const values = readouts.filter((r) => r && Number.isFinite(r.value)).slice(0, MAX_READOUTS).map(formatReadout);
  if (values.length) parts.push(`Key values: ${values.join(", ")}`);
  return `${parts.join(". ")}.`;
}

/**
 * The provenance id of the caption nearest a scene: climb from `mount` until an ancestor contains a
 * `[data-provenance-id]` chip (VizCaption renders one) and return the first. `null` when there is none.
 */
export function nearestProvenanceId(mount) {
  for (let node = mount?.parentElement ?? null; node; node = node.parentElement) {
    const chip = node.querySelector?.("[data-provenance-id]");
    if (chip) return chip.getAttribute("data-provenance-id");
  }
  return null;
}
