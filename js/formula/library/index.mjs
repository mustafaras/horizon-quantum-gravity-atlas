import * as blackHoles from "./black-holes.mjs";
import * as planckCasimir from "./planck-casimir.mjs";
import * as gravitationalWaves from "./gravitational-waves.mjs";
import * as relativity from "./relativity.mjs";
import * as neutrino from "./neutrino.mjs";
import * as higgs from "./higgs.mjs";
import * as qft from "./qft.mjs";
import * as casimir from "./casimir.mjs";
import * as electroweak from "./electroweak.mjs";
import * as gaugeRunning from "./gauge-running.mjs";
import * as asymptoticSafety from "./asymptotic-safety.mjs";
import * as penrose from "./penrose.mjs";
import * as equationsGauge from "./equations-gauge.mjs";
import * as equationsQft from "./equations-qft.mjs";
import * as equationsGr from "./equations-gr.mjs";

/**
 * Every library formula by camelCase name.
 *
 * The `equations*` modules (S30) are the structural equations the cards and the whitepaper state rather than compute:
 * a gauge group, an action, a horizon. They are `defineFormula` results like every other entry, so the lens, the TeX
 * printer and the TSL compiler need no special case.
 */
export const library = Object.freeze({
  ...blackHoles, ...planckCasimir, ...gravitationalWaves, ...relativity, ...neutrino, ...higgs, ...qft, ...casimir,
  ...electroweak, ...gaugeRunning, ...asymptoticSafety, ...penrose,
  ...equationsGauge, ...equationsQft, ...equationsGr,
});
export default library;
