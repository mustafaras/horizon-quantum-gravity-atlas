import { CMS_DIMUON } from "./cms-dimuon.mjs";

/** The provenance entry for the real CMS spectrum, kept beside the data it describes. */
export const CMS_DIMUON_PROVENANCE = Object.freeze({
  id: "exp-cms-dimuon",
  model: "The dimuon invariant-mass spectrum of the CMS Run2010B public Mu dataset, binned at 0.25 GeV",
  status: "established",
  assumptions: Object.freeze([
    "The histogram is built from one CSV shard (MuRun2010B_0.csv) of the record, so it is a fraction of the dataset",
    "No detector corrections are applied: this is the raw reconstructed invariant mass, not a cross-section measurement",
    "The Z region holds a handful of events at this luminosity, which is why the axis is logarithmic",
  ]),
  validity: Object.freeze([
    "The data are real and the peaks are where the known resonances are; nothing in the figure is simulated",
    "Event counts are not corrected for acceptance or efficiency and must not be quoted as branching fractions",
  ]),
  numericalMethod: `scripts/data/build-cms-dimuon.mjs: ${CMS_DIMUON.eventsRead} events read from the CSV, binned at 0.25 GeV`,
  references: Object.freeze([`CERN Open Data Portal record 700, doi:${CMS_DIMUON.doi}, CC0`]),
  layers: Object.freeze([
    { name: "Measured dimuon events", class: "data" },
    { name: "Resonance markers and the logarithmic axes", class: "model" },
  ]),
  seed: "none: real data",
});
