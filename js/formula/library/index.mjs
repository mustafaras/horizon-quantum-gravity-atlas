import * as blackHoles from "./black-holes.mjs";
import * as planckCasimir from "./planck-casimir.mjs";
import * as gravitationalWaves from "./gravitational-waves.mjs";
import * as relativity from "./relativity.mjs";
import * as neutrino from "./neutrino.mjs";
import * as higgs from "./higgs.mjs";
import * as qft from "./qft.mjs";
import * as casimir from "./casimir.mjs";

/** Every library formula by camelCase name. */
export const library = Object.freeze({ ...blackHoles, ...planckCasimir, ...gravitationalWaves, ...relativity, ...neutrino, ...higgs, ...qft, ...casimir });
export default library;
