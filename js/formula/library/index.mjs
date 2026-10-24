import * as blackHoles from "./black-holes.mjs";
import * as planckCasimir from "./planck-casimir.mjs";
import * as gravitationalWaves from "./gravitational-waves.mjs";
import * as relativity from "./relativity.mjs";
import * as neutrino from "./neutrino.mjs";

/** Every library formula by camelCase name. */
export const library = Object.freeze({ ...blackHoles, ...planckCasimir, ...gravitationalWaves, ...relativity, ...neutrino });
export default library;
