import { getVisualizationProvenance, registerVisualization } from "./provenance.mjs";
import { SPECTRAL_DIMENSION_PROVENANCE } from "./data/spectral-dimension.mjs";
import { CDT_PROVENANCE } from "./cdt-2d.mjs";
import { STRING_SPECTRUM_PROVENANCE } from "./string-spectrum.mjs";
import { EVAPORATION_PROVENANCE } from "./evaporation.mjs";
import { GREYBODY_PROVENANCE } from "./greybody.mjs";
import { KERR_SHADOW_PROVENANCE } from "./kerr-shadow.mjs";
import { EHT_PROVENANCE } from "./data/eht.mjs";
import { PN_WAVEFORM_PROVENANCE } from "./pn-waveform.mjs";
import { MATCHED_FILTER_PROVENANCE } from "./matched-filter.mjs";
import { QTRANSFORM_PROVENANCE } from "./qtransform.mjs";
import { CMS_DIMUON_PROVENANCE } from "./data/cms-dimuon-provenance.mjs";

const ENTRIES = [SPECTRAL_DIMENSION_PROVENANCE, CDT_PROVENANCE, STRING_SPECTRUM_PROVENANCE, EVAPORATION_PROVENANCE, GREYBODY_PROVENANCE, KERR_SHADOW_PROVENANCE, EHT_PROVENANCE, PN_WAVEFORM_PROVENANCE, MATCHED_FILTER_PROVENANCE, QTRANSFORM_PROVENANCE, CMS_DIMUON_PROVENANCE];

export function registerSpectralProgramsProvenance() {
  for (const entry of ENTRIES) {
    if (!getVisualizationProvenance(entry.id)) registerVisualization(entry.id, entry);
  }
  return ENTRIES;
}
