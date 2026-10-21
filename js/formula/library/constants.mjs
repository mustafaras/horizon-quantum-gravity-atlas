/*
 * Symbol declarations for the physical constants the library uses. The values
 * come from js/science/constants.mjs (CODATA 2018 / SI 2019); `constant` is the
 * SI value, and gpuSafe binds it to 1 for geometric units.
 */

import { G, C, HBAR, KB } from "../../science/constants.mjs";

export const CONSTANT_SYMBOLS = Object.freeze({
  G: Object.freeze({ tex: "G", unit: "m^3 kg^-1 s^-2", dims: { L: 3, M: -1, T: -2 }, description: "Newtonian constant of gravitation", constant: G }),
  c: Object.freeze({ tex: "c", unit: "m s^-1", dims: { L: 1, T: -1 }, description: "speed of light in vacuum", constant: C }),
  hbar: Object.freeze({ tex: "\\hbar", unit: "J s", dims: { L: 2, M: 1, T: -1 }, description: "reduced Planck constant", constant: HBAR }),
  kB: Object.freeze({ tex: "k_B", unit: "J K^-1", dims: { L: 2, M: 1, T: -2, Th: -1 }, description: "Boltzmann constant", constant: KB }),
});

export const CODATA_2018 = Object.freeze({
  citation: "Tiesinga, Mohr, Newell & Taylor, CODATA recommended values of the fundamental physical constants: 2018, Rev. Mod. Phys. 93, 025010 (2021)",
  doi: "10.1103/RevModPhys.93.025010",
});

/** Pick constant symbols by name. */
export const constants = (...names) => Object.fromEntries(names.map((n) => [n, CONSTANT_SYMBOLS[n]]));
