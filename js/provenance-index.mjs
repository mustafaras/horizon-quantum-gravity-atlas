// Every provenance entry of the atlas, registered in one call. The bootstrap runs it before the JSX modules mount, so a
// <VizCaption provenanceId> always finds its entry; the coverage test and scripts/audit-provenance.mjs run the same call
// in Node to compare the registry with the captions in the source. Each registrar is idempotent.

import { registerConstraintProvenance } from "./science/constraint-provenance.mjs";
import { registerCausalSetProvenance } from "./science/causal-set-provenance.mjs";
import { registerSpectralProgramsProvenance } from "./science/spectral-provenance.mjs";
import { registerFigureProvenance } from "./figure/provenance.mjs";
import { registerGaugeRunningProvenance } from "./science/gauge-running-provenance.mjs";
import { registerAsymptoticSafetyProvenance } from "./science/asymptotic-safety-provenance.mjs";
import { registerTidalProvenance } from "./science/tidal-provenance.mjs";
import { registerConformalProvenance } from "./science/conformal-provenance.mjs";
import { registerAdsLabProvenance } from "./science/ads-geometry.mjs";
import { registerColliderLabProvenance } from "./science/collider-kinematics.mjs";
import { registerHawkingLabProvenance } from "./science/hawking.mjs";
import { registerQftLabProvenance } from "./science/qft-fields.mjs";
import { registerRgFlow3dProvenance } from "./science/rg-flow-3d.mjs";
import { registerSpinFoamLabProvenance } from "./science/spin-networks.mjs";
import { registerViewProvenance } from "./science/view-provenance.mjs";
import { registerFormulaLensProvenance } from "./visualizations/common/term-lens-provenance.mjs";
import { registerGwInstrumentProvenance } from "./visualizations/gw/spacetime-instrument.mjs";
import { registerKerrObservatoryProvenance } from "./visualizations/kerr/kerr-observatory.mjs";

const REGISTRARS = Object.freeze([
  registerFigureProvenance,
  registerConstraintProvenance,
  registerCausalSetProvenance,
  registerSpectralProgramsProvenance,
  registerGaugeRunningProvenance,
  registerAsymptoticSafetyProvenance,
  registerConformalProvenance,
  registerTidalProvenance,
  registerViewProvenance,
  registerAdsLabProvenance,
  registerColliderLabProvenance,
  registerHawkingLabProvenance,
  registerQftLabProvenance,
  registerRgFlow3dProvenance,
  registerSpinFoamLabProvenance,
  registerFormulaLensProvenance,
  registerGwInstrumentProvenance,
  registerKerrObservatoryProvenance,
]);

export function registerAllProvenance() {
  for (const register of REGISTRARS) register();
}
