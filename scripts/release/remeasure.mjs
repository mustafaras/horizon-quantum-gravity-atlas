// S36 release gate: the S03-S28 verification record, re-measured.
//
// MEASUREMENT_CLASSES says, for every ledger measurement of S03-S28 (one letter per entry, in ledger order), how it is
// re-measured at release:
//   N  recomputed below from the science modules, compared with the ledger value
//   T  pinned by a node:test assertion that `npm test` re-runs (the files are named per prompt)
//   B  a browser or GPU measurement: re-run by the named Playwright specs in CI, not in Node
//   P  a timing on a software rasteriser: machine-dependent, re-run by `npm run perf:collect`
//   A  a static count (lines, sites): re-read from today's tree by `npm run perf:audit`, expected to have moved
//   S  a value read from a primary source: the reading is in the ledger and is not repeated
// A test holds each string's length equal to the prompt's measurement count, so a new ledger entry cannot go
// unclassified. Pure apart from the science modules it imports.

import { library } from "../../js/formula/library/index.mjs";
import { SOLAR_MASS } from "../../js/science/constants.mjs";
import { fixedPoints } from "../../js/science/asymptotic-safety.mjs";
import { pageTimeSummary } from "../../js/science/evaporation.mjs";
import { EHT_TARGETS, comparisonFor } from "../../js/science/data/eht.mjs";
import { firstSubringFraction } from "../../js/science/kerr-shadow.mjs";
import { ensemble, orderingFractionTheory } from "../../js/science/causal-sets.mjs";
import { remnant, ringdownHz } from "../../js/science/pn-waveform.mjs";
import { lookbackIntegral, hubbleTimeSeconds, GYR_S, fullDelaySeconds, PLANCK_ENERGY_GEV } from "../../js/science/observational-net.mjs";
import { levelDegeneracies } from "../../js/science/string-spectrum.mjs";
import { spectralDimensionOnFlat } from "../../js/science/cdt-2d.mjs";
import { idealPressure } from "../../js/science/casimir.mjs";
import { DEFAULT_PARAMS, peakEnergy, zeroCrossing } from "../../js/science/electroweak.mjs";
import { inputsAtMZ } from "../../js/science/gauge-running.mjs";
import { vevFromFermi } from "../../js/science/higgs.mjs";
import { PDG } from "../../js/science/data/pdg.mjs";
import { gpsClockOffset } from "../../js/science/data/gr-tests.mjs";
import { inflationEnergyBound } from "../../js/science/data/constraints.mjs";
import { buildBank, templateSeries, optimalSnr, colouredNoise, searchBank } from "../../js/science/matched-filter.mjs";

export const MEASUREMENT_CLASSES = Object.freeze({
  S03: "BTNTT", S04: "BBBPPB", S05: "BBPBP", S06: "BBBBA", S07: "AAABBB", S08: "ABBP", S09: "AAAS",
  S10: "BBTBA", S11: "AABBBA", S12: "TTTTTTA", S13: "NTTTTAA", S14: "BTTAP", S15: "NTTTA", S16: "TTNNTTTAB",
  S17: "NTTTTTTTAB", S18: "NNTTTBB", S19: "TTTTTTBBTT", S20: "TTNT", S21: "NSTTT", S22: "NNTBP", S23: "NTTNPS",
  S24: "NSTTTT", S25: "TTNNNB", S26: "NTNTTT", S27: "NTTTT", S28: "NNNTSB",
});

/** Where the T, B and P entries of each prompt are re-run. */
export const RERUN_BY = Object.freeze({
  S03: "test/formula-core.test.mjs; qa/specs/formula-gpu.spec.mjs", S04: "qa/specs/shared-stage.spec.mjs; scripts/perf/collect.mjs",
  S05: "qa/specs/shared-stage.spec.mjs; scripts/perf/collect.mjs", S06: "qa/specs/engraved-lines.spec.mjs, engraved-gr-fan.spec.mjs",
  S07: "qa/specs/material-kit.spec.mjs", S08: "qa/specs/compute-particles.spec.mjs; scripts/perf/collect.mjs",
  S09: "qa/specs/figure-kit.spec.mjs", S10: "test/formula-lens-scenes.test.mjs; qa/specs/formula-lens.spec.mjs",
  S11: "test/provenance-coverage.test.mjs; qa/specs/provenance-layers.spec.mjs", S12: "test/neutrino.test.mjs",
  S13: "test/higgs.test.mjs", S14: "test/lattice-field.test.mjs; qa/specs/lattice-gpu.spec.mjs", S15: "test/casimir.test.mjs",
  S16: "test/electroweak.test.mjs; qa/specs/electroweak-lab.spec.mjs", S17: "test/gauge-running.test.mjs; qa/specs/unification-lab.spec.mjs",
  S18: "test/asymptotic-safety.test.mjs, lic-cpu.test.mjs, rg-flow-3d.test.mjs; qa/specs/gravity-flow-lab.spec.mjs",
  S19: "test/penrose-geometry.test.mjs; qa/specs/penrose-atlas.spec.mjs", S20: "test/tidal.test.mjs",
  S21: "test/constraints-data.test.mjs, spin-networks.test.mjs", S22: "test/causal-sets.test.mjs; qa/specs/approaches-causal-set.spec.mjs",
  S23: "test/cdt-spectral.test.mjs", S24: "test/evaporation-greybody.test.mjs", S25: "test/kerr-shadow.test.mjs; qa/specs/kerr-shadow.spec.mjs",
  S26: "test/pn-waveform.test.mjs", S27: "test/matched-filter.test.mjs", S28: "test/observational-net.test.mjs",
});

const L = library;
const ngfp = () => fixedPoints()[1];
const litim = () => fixedPoints({ scheme: "litim2004" }).find((p) => !p.gaussian);
const eht = (id) => comparisonFor(EHT_TARGETS.find((t) => t.id === id));

// The matched-filter injection of S27 item 1, set up exactly as the ledger describes it (and as its test does).
function injectionRecovery() {
  const sampleRate = 128, n = 1024;
  const psd = { freqs: [], psd: [] };
  for (let i = 0; i <= n / 2; i++) {
    const f = (i * sampleRate) / n;
    psd.freqs.push(f);
    psd.psd.push(1e-46 * (1 + (30 / Math.max(f, 1)) ** 4));
  }
  const bank = buildBank({ count: 16, mcMin: 20, mcMax: 35, sampleRate, duration: 8 });
  const injected = bank.templates[7];
  const template = templateSeries(injected, { sampleRate, duration: n / sampleRate });
  const rhoOpt = optimalSnr({ timeSeries: template, sampleRate, psd });
  const noise = colouredNoise({ n, sampleRate, psd, seed: 7 });
  const strain = Float64Array.from(template.map((v, i) => v * (15 / rhoOpt) + noise[i]));
  const best = searchBank({ strain, sampleRate, bank, psd, bandLow: 20 });
  return { mc: best.bestMc, snr: best.peakSnr };
}

let cache = null;
const once = (key, fn) => () => ((cache ??= new Map()).has(key) ? cache.get(key) : (cache.set(key, fn()), cache.get(key)));
const causal2 = once("cs2", () => ensemble({ dim: 2, n: 2000, seeds: 5 }));
const causal4 = once("cs4", () => ensemble({ dim: 4, n: 2000, seeds: 5 }));
const injection = once("mf", injectionRecovery);

/**
 * Each row: the ledger entry it re-measures (`ref` = prompt.item), what it is, the value as the ledger states it, and
 * the tolerance the ledger's own precision allows (half a unit in its last quoted digit, unless the ledger names one).
 */
export const REMEASUREMENTS = Object.freeze([
  { ref: "S03.3", label: "r_s(1 Msun), m", ledger: 2953.339, tol: 5e-4, measure: () => L.schwarzschildRadius.evaluate({ M: SOLAR_MASS }) },
  { ref: "S03.3", label: "T_H(1 Msun), K", ledger: 6.170074e-8, tol: 5e-15, measure: () => L.hawkingTemperature.evaluate({ M: SOLAR_MASS }) },
  { ref: "S03.3", label: "r+(a*=0.9), M", ledger: 1.43589, tol: 5e-7, measure: () => L.kerrOuterHorizon.evaluate({ M: 1, a: 0.9 }) },
  { ref: "S03.3", label: "chirp mass (36, 29), Msun", ledger: 28.0956, tol: 5e-5, measure: () => L.chirpMass.evaluate({ m1: 36, m2: 29 }) },
  { ref: "S03.3", label: "l_P, m", ledger: 1.616255e-35, tol: 5e-42, measure: () => L.planckLength.evaluate({}) },
  { ref: "S13.1", label: "v from PDG 2026 G_F, GeV", ledger: 246.2197, tol: 5e-5, measure: () => vevFromFermi(PDG.GF.value) },
  { ref: "S15.1", label: "Casimir P(1 um), Pa", ledger: -1.30013e-3, tol: 5e-9, measure: () => idealPressure(1e-6) },
  { ref: "S15.1", label: "Casimir P(100 nm), Pa", ledger: -13.0013, tol: 5e-5, measure: () => idealPressure(100e-9) },
  { ref: "S16.3", label: "peak of sigma(e+e- -> mu+mu-), GeV", ledger: 91.2054, tol: 5e-5, measure: () => peakEnergy(DEFAULT_PARAMS) },
  { ref: "S16.4", label: "A_FB zero crossing, GeV", ledger: 91.0075, tol: 5e-5, measure: () => zeroCrossing(DEFAULT_PARAMS, { lo: 40, hi: DEFAULT_PARAMS.mZ }) },
  { ref: "S17.1", label: "alpha_1^-1(M_Z)", ledger: 59.0245, tol: 5e-5, measure: () => inputsAtMZ()[0] },
  { ref: "S17.1", label: "alpha_2^-1(M_Z)", ledger: 29.5872, tol: 5e-5, measure: () => inputsAtMZ()[1] },
  { ref: "S17.1", label: "alpha_3^-1(M_Z)", ledger: 8.4746, tol: 5e-5, measure: () => inputsAtMZ()[2] },
  { ref: "S18.1", label: "NGFP g*, optimised cutoff", ledger: 0.7073208809868444, tol: 1e-12, measure: () => ngfp().g },
  { ref: "S18.1", label: "NGFP lambda*, optimised cutoff", ledger: 0.19320050715078568, tol: 1e-12, measure: () => ngfp().lambda },
  { ref: "S18.1", label: "NGFP theta', optimised cutoff", ledger: 1.4753024, tol: 5e-8, measure: () => ngfp().exponents[0].re },
  { ref: "S18.1", label: "NGFP abs(theta''), optimised cutoff", ledger: 3.0432058, tol: 5e-8, measure: () => Math.abs(ngfp().exponents[0].im) },
  { ref: "S18.2", label: "NGFP g*, Litim 2004", ledger: 0.015625, tol: 1e-12, measure: () => litim().g },
  { ref: "S18.2", label: "NGFP theta', Litim 2004", ledger: 1.6666667, tol: 5e-8, measure: () => litim().exponents[0].re },
  { ref: "S18.2", label: "NGFP abs(theta''), Litim 2004", ledger: 4.307616, tol: 5e-7, measure: () => Math.abs(litim().exponents[0].im) },
  { ref: "S20.3", label: "GPS gravitational offset, us/day", ledger: 45.71821278, tol: 5e-9, measure: () => gpsClockOffset().gravitational },
  { ref: "S20.3", label: "GPS kinematic offset, us/day", ledger: -7.21359982, tol: 5e-9, measure: () => gpsClockOffset().kinematic },
  { ref: "S20.3", label: "GPS net offset, us/day", ledger: 38.50461296, tol: 5e-9, measure: () => gpsClockOffset().net },
  { ref: "S21.1", label: "inflation energy bound, 1e16 GeV", ledger: 1.40859, tol: 5e-6, measure: () => inflationEnergyBound() / 1e25 },
  { ref: "S22.1", label: "Myrheim-Meyer f(2)", ledger: 0.5, tol: 1e-13, measure: () => orderingFractionTheory(2) },
  { ref: "S22.1", label: "Myrheim-Meyer f(3)", ledger: 0.228571, tol: 5e-7, measure: () => orderingFractionTheory(3) },
  { ref: "S22.1", label: "Myrheim-Meyer f(4)", ledger: 0.1, tol: 1e-13, measure: () => orderingFractionTheory(4) },
  { ref: "S22.2", label: "2D sprinkling N = 2000, 5 seeds: mean d", ledger: 2.0055, tol: 5e-5, measure: () => causal2().meanDimension },
  { ref: "S22.2", label: "2D sprinkling: spread of d", ledger: 0.0313, tol: 5e-5, measure: () => causal2().spreadDimension },
  { ref: "S22.2", label: "4D sprinkling N = 2000, 5 seeds: mean d", ledger: 4.0294, tol: 5e-5, measure: () => causal4().meanDimension },
  { ref: "S22.2", label: "4D sprinkling: spread of d", ledger: 0.0531, tol: 5e-5, measure: () => causal4().spreadDimension },
  { ref: "S23.1", label: "string level N = 5 degeneracy", ledger: 176256, tol: 0, measure: () => levelDegeneracies(5)[5] },
  { ref: "S23.4", label: "spectral dimension, flat honeycomb control", ledger: 1.929, tol: 5e-4, measure: () => spectralDimensionOnFlat({ width: 24, height: 24, walkers: 1500, seed: 42 }).mean },
  { ref: "S24.1", label: "Page time: S_BH/S0", ledger: 0.5975369, tol: 5e-8, measure: () => pageTimeSummary().entropyFraction },
  { ref: "S24.1", label: "Page time: M/M0", ledger: 0.7730051, tol: 5e-8, measure: () => pageTimeSummary().massFraction },
  { ref: "S24.1", label: "Page time: t/tau", ledger: 0.5381009, tol: 5e-8, measure: () => pageTimeSummary().timeFraction },
  { ref: "S25.3", label: "M87* shadow, microarcsec", ledger: 39.689, tol: 5e-4, measure: () => eht("m87").predictedUas },
  { ref: "S25.3", label: "Sgr A* shadow, microarcsec", ledger: 51.291, tol: 5e-4, measure: () => eht("sgra").predictedUas },
  { ref: "S25.4", label: "M87*: measured / predicted - 1, %", ledger: 5.8, tol: 0.05, measure: () => 100 * (eht("m87").measuredUas / eht("m87").predictedUas - 1) },
  { ref: "S25.4", label: "Sgr A*: measured / predicted - 1, %", ledger: 1.0, tol: 0.05, measure: () => 100 * (eht("sgra").measuredUas / eht("sgra").predictedUas - 1) },
  { ref: "S25.5", label: "first photon sub-ring fraction", ledger: 0.043214, tol: 5e-7, measure: () => firstSubringFraction() },
  { ref: "S26.1", label: "equal-mass remnant spin", ledger: 0.6865, tol: 5e-5, measure: () => remnant({ m1: 30, m2: 30 }).spin },
  { ref: "S26.1", label: "equal-mass remnant M_f/M", ledger: 0.9516, tol: 5e-5, measure: () => remnant({ m1: 30, m2: 30 }).massRatio },
  { ref: "S26.3", label: "ringdown, 62 Msun, z = 0.09, j = 0.686, Hz", ledger: 253.0, tol: 0.05, measure: () => ringdownHz(62, 0.686, 0.09) },
  { ref: "S27.1", label: "injection: recovered chirp mass, Msun", ledger: 27.0, tol: 0.05, measure: () => injection().mc },
  { ref: "S27.1", label: "injection: peak SNR (injected 15)", ledger: 14.5, tol: 0.05, measure: () => injection().snr },
  { ref: "S28.1", label: "lookback integral at z = 0.903", ledger: 1.0006, tol: 5e-5, measure: () => lookbackIntegral(0.903) },
  { ref: "S28.2", label: "Hubble time 1/H0, Gyr", ledger: 14.516, tol: 5e-4, measure: () => hubbleTimeSeconds() / GYR_S },
  { ref: "S28.3", label: "31 GeV photon delay at E_QG = E_P, s", ledger: 1.16, tol: 5e-3, measure: () => fullDelaySeconds(31, 0.903, PLANCK_ENERGY_GEV) },
]);

/** Every row measured now: `{ ...row, value, difference, pass }`, in the order above. */
export function runRemeasurements(rows = REMEASUREMENTS) {
  cache = null;
  return rows.map((row) => {
    const value = row.measure();
    const difference = value - row.ledger;
    return { ref: row.ref, label: row.label, ledger: row.ledger, tol: row.tol, value, difference, pass: Math.abs(difference) <= row.tol };
  });
}
