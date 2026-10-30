#!/usr/bin/env node
/**
 * Build the CMS dimuon invariant-mass histogram from the CERN Open Data record.
 *
 *   node scripts/data/build-cms-dimuon.mjs <path-to-MuRun2010B_0.csv>
 *
 * Record: CERN Open Data Portal 700, "Dimuon event information derived from the Run2010B public Mu dataset",
 * DOI 10.7483/OPENDATA.CMS.CB8H.MFFA, released CC0. The CSV is a direct download from
 * https://opendata.cern.ch/record/700/files/MuRun2010B_0.csv
 *
 * The histogram is committed so the app never fetches during a run; this script is what produced it, and re-running
 * it on the same file reproduces the same bins byte for byte.
 */

import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: build-cms-dimuon.mjs <MuRun2010B_0.csv>");
  process.exit(2);
}

const BIN = 0.25;
// 2 to 120 GeV in 0.25 GeV bins. One GeV bins cannot separate the J/psi at 3.096 from the psi(2S) at 3.686 — both
// landed in the same bin, which hid the very structure this figure exists to show.
const EDGES = [];
for (let m = 2; m <= 120 + 1e-9; m += BIN) EDGES.push(Number(m.toFixed(4)));

const counts = new Array(EDGES.length - 1).fill(0);
let events = 0;
const text = readFileSync(file, "utf8").split("\n");
const header = text[0].split(",").map((h) => h.trim());
const mIndex = header.indexOf("M");
if (mIndex < 0) throw new Error("the CSV has no M column");
for (let i = 1; i < text.length; i++) {
  const line = text[i].trim();
  if (!line) continue;
  const cols = line.split(",");
  const mass = Number(cols[mIndex]);
  if (!Number.isFinite(mass)) continue;
  events += 1;
  if (mass < EDGES[0] || mass >= EDGES[EDGES.length - 1]) continue;
  const bin = Math.min(counts.length - 1, Math.floor((mass - EDGES[0]) / BIN));
  if (bin >= 0 && bin < counts.length) counts[bin] += 1;
}

const out = {
  source: "CERN Open Data Portal record 700",
  doi: "10.7483/OPENDATA.CMS.CB8H.MFFA",
  title: "Dimuon event information derived from the Run2010B public Mu dataset",
  experiment: "CMS",
  licence: "CC0",
  file: "MuRun2010B_0.csv",
  retrieved: "2026-10-29",
  eventsRead: events,
  binEdges: EDGES,
  counts,
};
writeFileSync(new URL("../../js/science/data/cms-dimuon.mjs", import.meta.url), `/**
 * The CMS dimuon invariant-mass spectrum (S27).
 *
 * Real open data, not a simulation: CERN Open Data Portal record 700, "Dimuon event information derived from the
 * Run2010B public Mu dataset", DOI ${out.doi}, released CC0. The histogram was built from
 * ${out.file} by scripts/data/build-cms-dimuon.mjs; ${events} events were read and the
 * ${counts.reduce((a, b) => a + b, 0)} that fall inside the plotted window are binned here.
 *
 * The peaks this spectrum is expected to show are the J/psi at 3.096 GeV, the psi(2S) at 3.686, the Upsilon
 * family between 9.46 and 10.36, and — at this early luminosity, faintly — the Z near 91 GeV.
 */

export const CMS_DIMUON = Object.freeze({
  source: ${JSON.stringify(out.source)},
  doi: ${JSON.stringify(out.doi)},
  title: ${JSON.stringify(out.title)},
  experiment: ${JSON.stringify(out.experiment)},
  licence: ${JSON.stringify(out.licence)},
  file: ${JSON.stringify(out.file)},
  retrieved: ${JSON.stringify(out.retrieved)},
  eventsRead: ${events},
  binEdges: Object.freeze(${JSON.stringify(EDGES)}),
  counts: Object.freeze(${JSON.stringify(counts)}),
});

/** \u221aN Poisson error bars for each bin, which is what the figure draws. */
export function poissonErrors(counts = CMS_DIMUON.counts) {
  return counts.map((n) => Math.sqrt(Math.max(0, n)));
}

/** Bin centres, for plotting. */
export function binCentres(edges = CMS_DIMUON.binEdges) {
  const out = [];
  for (let i = 0; i + 1 < edges.length; i++) out.push((edges[i] + edges[i + 1]) / 2);
  return out;
}

/** The resonances the spectrum is checked against, with their masses. */
export const CMS_RESONANCES = Object.freeze([
  Object.freeze({ id: "jpsi", label: "J/psi", massGeV: 3.0969 }),
  Object.freeze({ id: "psi2s", label: "psi(2S)", massGeV: 3.6861 }),
  Object.freeze({ id: "upsilon1s", label: "Upsilon(1S)", massGeV: 9.4603 }),
  Object.freeze({ id: "upsilon2s", label: "Upsilon(2S)", massGeV: 10.0233 }),
  Object.freeze({ id: "upsilon3s", label: "Upsilon(3S)", massGeV: 10.3551 }),
  Object.freeze({ id: "z", label: "Z", massGeV: 91.1876 }),
]);

/** The event count inside a mass window, for the readouts and the tests. */
export function countsInWindow(lo, hi, counts = CMS_DIMUON.counts, edges = CMS_DIMUON.binEdges) {
  // Whole bins whose centre lies inside the window: the bin is the resolution, so a partial overlap would
  // double-count or drop events depending on which edge it touches.
  let total = 0;
  for (let i = 0; i + 1 < edges.length; i++) {
    const centre = (edges[i] + edges[i + 1]) / 2;
    if (centre >= lo && centre < hi) total += counts[i];
  }
  return total;
}
`);
console.log(`wrote js/science/data/cms-dimuon.mjs: ${events} events read, ${counts.reduce((a, b) => a + b, 0)} binned`);
