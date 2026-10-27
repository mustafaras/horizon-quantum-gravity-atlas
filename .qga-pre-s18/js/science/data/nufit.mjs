// Three-flavour oscillation parameters (NuFIT 6.0) and the long-baseline presets of the neutrino lab.
//
// Source of the parameters: Table 1 of Esteban, Gonzalez-Garcia, Maltoni, Martinez-Soler, Pinheiro & Schwetz,
// JHEP 12 (2024) 216 (arXiv:2410.05380v2), "NuFit-6.0", data up to September 2024. The numbers below were read from the
// published table (best fit, +/- 1 sigma, 3 sigma range) and compared with a second reading of the same HTML; the project
// page nu-fit.org was unreachable from the build environment on the retrieval date, so that this is the latest release
// could not be confirmed there (ledger D-063). Two variants are given: IC19 without Super-Kamiokande atmospheric data and
// IC24 with Super-Kamiokande atmospheric data. For normal ordering (NO) Delta m^2_3l is Delta m^2_31 > 0, for inverted
// ordering (IO) it is Delta m^2_32 < 0. The paper notes that the delta_CP precision is indicative only (non-Gaussian chi^2).
//
// Units: sin^2 theta dimensionless, delta_CP in degrees, Delta m^2 in eV^2.

import { REF } from "../references.mjs";
import { mixingAngles, deltaM31FromOrdering } from "../neutrino.mjs";

export const NUFIT_SOURCE = Object.freeze({
  release: "NuFIT 6.0 (data up to September 2024)",
  citation: REF.NUFIT_6,
  table: "Table 1",
  project: "http://www.nu-fit.org/",
  retrieved: "2026-10-24",
  note: "Read from Table 1 of arXiv:2410.05380v2; nu-fit.org was not reachable on the retrieval date.",
});

const v = (value, plus, minus, low, high) => Object.freeze({ value, plus, minus, range3sigma: Object.freeze([low, high]) });

const DM21 = v(7.49e-5, 0.19e-5, 0.19e-5, 6.92e-5, 8.05e-5);

export const NUFIT = Object.freeze({
  variants: Object.freeze({
    "IC19-without-SK-atm": Object.freeze({
      label: "IC19 without SK atmospheric data",
      NO: Object.freeze({
        sin2theta12: v(0.307, 0.012, 0.011, 0.275, 0.345),
        sin2theta23: v(0.561, 0.012, 0.015, 0.430, 0.596),
        sin2theta13: v(0.02195, 0.00054, 0.00058, 0.02023, 0.02376),
        deltaCP: v(177, 19, 20, 96, 422),
        dm21: DM21,
        dm3l: v(2.534e-3, 0.025e-3, 0.023e-3, 2.463e-3, 2.606e-3),
      }),
      IO: Object.freeze({
        sin2theta12: v(0.308, 0.012, 0.011, 0.275, 0.345),
        sin2theta23: v(0.562, 0.012, 0.015, 0.437, 0.597),
        sin2theta13: v(0.02224, 0.00056, 0.00057, 0.02053, 0.02397),
        deltaCP: v(285, 25, 28, 201, 348),
        dm21: DM21,
        dm3l: v(-2.510e-3, 0.024e-3, 0.025e-3, -2.584e-3, -2.438e-3),
      }),
    }),
    "IC24-with-SK-atm": Object.freeze({
      label: "IC24 with SK atmospheric data",
      NO: Object.freeze({
        sin2theta12: v(0.308, 0.012, 0.011, 0.275, 0.345),
        sin2theta23: v(0.470, 0.017, 0.013, 0.435, 0.585),
        sin2theta13: v(0.02215, 0.00056, 0.00058, 0.02030, 0.02388),
        deltaCP: v(212, 26, 41, 124, 364),
        dm21: DM21,
        dm3l: v(2.513e-3, 0.021e-3, 0.019e-3, 2.451e-3, 2.578e-3),
      }),
      IO: Object.freeze({
        sin2theta12: v(0.308, 0.012, 0.011, 0.275, 0.345),
        sin2theta23: v(0.550, 0.012, 0.015, 0.440, 0.584),
        sin2theta13: v(0.02231, 0.00056, 0.00056, 0.02060, 0.02409),
        deltaCP: v(274, 22, 25, 201, 335),
        dm21: DM21,
        dm3l: v(-2.484e-3, 0.020e-3, 0.020e-3, -2.547e-3, -2.421e-3),
      }),
    }),
  }),
});

export const DEFAULT_VARIANT = "IC24-with-SK-atm";

/** Best-fit parameters of the neutrino model for an ordering ("NO" or "IO"): angles and delta_CP in radians, Delta m^2 in eV^2. */
export function defaultParams(ordering, variant = DEFAULT_VARIANT) {
  if (ordering !== "NO" && ordering !== "IO") throw new RangeError(`ordering must be "NO" or "IO", got ${ordering}`);
  const set = NUFIT.variants[variant];
  if (!set) throw new RangeError(`unknown NuFIT variant: ${variant}`);
  const fit = set[ordering];
  const angles = mixingAngles({
    sin2theta12: fit.sin2theta12.value, sin2theta13: fit.sin2theta13.value, sin2theta23: fit.sin2theta23.value,
  });
  return Object.freeze({
    ...angles,
    deltaCP: (fit.deltaCP.value * Math.PI) / 180,
    dm21: fit.dm21.value,
    dm31: deltaM31FromOrdering({ ordering, dm3l: fit.dm3l.value, dm21: fit.dm21.value }),
  });
}

// Long-baseline and reactor presets. Each number is read from its source (ledger D-064): T2K baseline, beam peak and crust
// density from Phys. Rev. D 103, 112008; NOvA baseline, flux peak (1.9 GeV, the plan's 2 GeV rounded) and CRUST2.0 density
// from Phys. Rev. D 98, 032012; DUNE baseline, on-axis flux peak and average density from the DUNE TDR (the density is the
// one of the 1284.9 km chord); JUNO baseline, reference energy and matter density from J. Phys. G 43, 030401.
export const EXPERIMENTS = Object.freeze([
  Object.freeze({
    id: "t2k", label: "T2K", baselineKm: 295, peakEnergyGeV: 0.6, energyRangeGeV: Object.freeze([0.1, 2]), rhoGcm3: 2.6,
    initialFlavour: 1, antineutrino: false, source: REF.T2K_2021,
  }),
  Object.freeze({
    id: "nova", label: "NOvA", baselineKm: 810, peakEnergyGeV: 1.9, energyRangeGeV: Object.freeze([0.5, 4]), rhoGcm3: 2.84,
    initialFlavour: 1, antineutrino: false, source: REF.NOVA_2018,
  }),
  Object.freeze({
    id: "dune", label: "DUNE", baselineKm: 1300, peakEnergyGeV: 2.5, energyRangeGeV: Object.freeze([0.5, 8]), rhoGcm3: 2.8482,
    initialFlavour: 1, antineutrino: false, source: REF.DUNE_TDR,
  }),
  Object.freeze({
    id: "juno", label: "JUNO", baselineKm: 52.5, peakEnergyGeV: 0.004, energyRangeGeV: Object.freeze([0.002, 0.01]), rhoGcm3: 3,
    initialFlavour: 0, antineutrino: true, source: REF.JUNO_2016,
  }),
]);
