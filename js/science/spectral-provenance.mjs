import { getVisualizationProvenance, registerVisualization } from "./provenance.mjs";
import { SPECTRAL_DIMENSION_PROVENANCE } from "./data/spectral-dimension.mjs";
import { CDT_PROVENANCE } from "./cdt-2d.mjs";
import { STRING_SPECTRUM_PROVENANCE } from "./string-spectrum.mjs";
import { EVAPORATION_PROVENANCE } from "./evaporation.mjs";
import { GREYBODY_PROVENANCE } from "./greybody.mjs";

const ENTRIES = [SPECTRAL_DIMENSION_PROVENANCE, CDT_PROVENANCE, STRING_SPECTRUM_PROVENANCE, EVAPORATION_PROVENANCE, GREYBODY_PROVENANCE];

export function registerSpectralProgramsProvenance() {
  for (const entry of ENTRIES) {
    if (!getVisualizationProvenance(entry.id)) registerVisualization(entry.id, entry);
  }
  return ENTRIES;
}
