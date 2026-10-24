/*
 * Symbol declarations for the physical constants the library uses. The values
 * come from js/science/constants.mjs (CODATA 2018 / SI 2019); `constant` is the
 * SI value, and gpuSafe binds it to 1 for geometric units.
 */

import { G, C, HBAR, KB } from "../../science/constants.mjs";
import { FERMI_CONSTANT_PER_GEV2 } from "../../science/neutrino.mjs";

const ELEMENTARY_CHARGE = 1.602176634e-19; // C, exact (SI 2019)
const HBAR_C = HBAR * C; // J m
/** G_F in J m^3: (G_F / (hbar c)^3 in GeV^-2) (hbar c)^3 / (1 GeV in J)^2 = 1.4358e-62 J m^3. */
const FERMI_SI = FERMI_CONSTANT_PER_GEV2 * HBAR_C ** 3 / (1e9 * ELEMENTARY_CHARGE) ** 2;

export const CONSTANT_SYMBOLS = Object.freeze({
  G: Object.freeze({ tex: "G", unit: "m^3 kg^-1 s^-2", dims: { L: 3, M: -1, T: -2 }, description: "Newtonian constant of gravitation", constant: G }),
  c: Object.freeze({ tex: "c", unit: "m s^-1", dims: { L: 1, T: -1 }, description: "speed of light in vacuum", constant: C }),
  hbar: Object.freeze({ tex: "\\hbar", unit: "J s", dims: { L: 2, M: 1, T: -1 }, description: "reduced Planck constant", constant: HBAR }),
  GF: Object.freeze({ tex: "G_F", unit: "J m^3", dims: { M: 1, L: 5, T: -2 }, description: "Fermi coupling constant", constant: FERMI_SI }),
  kB: Object.freeze({ tex: "k_B", unit: "J K^-1", dims: { L: 2, M: 1, T: -2, Th: -1 }, description: "Boltzmann constant", constant: KB }),
});

export const CODATA_2018 = Object.freeze({
  citation: "Tiesinga, Mohr, Newell & Taylor, CODATA recommended values of the fundamental physical constants: 2018, Rev. Mod. Phys. 93, 025010 (2021)",
  doi: "10.1103/RevModPhys.93.025010",
  retrieved: "2026-10-22",
});

/** Pick constant symbols by name. */
export const constants = (...names) => Object.fromEntries(names.map((n) => [n, CONSTANT_SYMBOLS[n]]));
