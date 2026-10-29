import { getVisualizationProvenance, registerVisualization } from "./provenance.mjs";
import { CAUSAL_SET_PROVENANCE } from "./causal-sets.mjs";

export function registerCausalSetProvenance() {
  const id = CAUSAL_SET_PROVENANCE.id;
  if (!getVisualizationProvenance(id)) registerVisualization(id, CAUSAL_SET_PROVENANCE);
  return CAUSAL_SET_PROVENANCE;
}
