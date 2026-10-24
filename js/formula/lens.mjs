/*
 * Formula Lens registry (S10): which scene object or surface answers to which term of which formula.
 *
 * A formula's `\htmlData` terms (Formula Core, S03) are the addressable parts of its typeset equation. A scene
 * declares, with bindScene(), what each term it understands means in that scene:
 *
 *   { kind: "object", objectName }                  the term has a counterpart object: it gets an outline
 *   { kind: "field", surfaceName, range, bindings } the term is a quantity over a surface: it is painted as a field
 *
 * This module is pure: it imports in Node without DOM, React or three.js. It only validates declarations and
 * evaluates terms; drawing is js/visualizations/common/term-lens.mjs and the ConceptBus carries the events.
 */

import { library } from "./library/index.mjs";
import { compileJS } from "./to-js.mjs";
import { freeSymbols } from "./expr.mjs";
import { dimensionToString, inferDimensions } from "./dimensions.mjs";
import { texToPlain } from "../figure/spec.mjs";

const SUPERSCRIPT = Object.freeze({ "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" });
const PLAIN_RANGE = Object.freeze([1e-3, 1e4]);
const SIGNIFICANT_FIGURES = 4;

const isPlainObject = (x) => typeof x === "object" && x !== null && !Array.isArray(x);
const isNonEmptyString = (x) => typeof x === "string" && x !== "";

/* ---------- terms of one formula ---------- */

function findTerm(expr, termId) {
  if (expr.op === "term" && expr.id === termId) return expr;
  for (const child of expr.args ?? []) {
    const hit = findTerm(child, termId);
    if (hit) return hit;
  }
  return null;
}

function termNode(formula, termId) {
  const node = findTerm(formula.expr, termId);
  if (!node) throw new RangeError(`${formula.id}: no term "${termId}" (terms: ${formula.termIds.join(", ")})`);
  return node;
}

const unwrapTerms = (node) => (node.op === "term" ? unwrapTerms(node.args[0]) : node);

/** The expression under a term. */
export function termExpr(formula, termId) {
  return termNode(formula, termId).args[0];
}

/** The free symbols of a term, split into the ones a scene must supply and the physical constants. */
export function termSymbols(formula, termId) {
  const names = freeSymbols(termExpr(formula, termId));
  const isConstant = (name) => formula.symbols[name].constant !== undefined;
  return { variables: names.filter((n) => !isConstant(n)), constants: names.filter(isConstant) };
}

const COMPILED = new WeakMap();

/** The value of a term in float64. Constants default to their declared SI values; `env` supplies and overrides the rest. */
export function evaluateTerm(formula, termId, env = {}) {
  if (!COMPILED.has(formula)) COMPILED.set(formula, new Map());
  const cache = COMPILED.get(formula);
  if (!cache.has(termId)) cache.set(termId, compileJS(termExpr(formula, termId)));
  return cache.get(termId)({ ...formula.constants, ...env });
}

/** The unit of a term: the formula's output unit for the whole equation, a symbol's own unit, otherwise its dimensions. */
export function termUnit(formula, termId) {
  const node = termNode(formula, termId);
  if (node === formula.expr && formula.output.unit) return formula.output.unit;
  const leaf = unwrapTerms(node);
  if (leaf.op === "sym") return formula.symbols[leaf.name].unit ?? "1";
  return dimensionToString(inferDimensions(node.args[0], formula.symbols));
}

/** The accessible name of a term. */
export function termLabel(formula, termId) {
  const node = termNode(formula, termId);
  const leaf = unwrapTerms(node);
  if (leaf.op === "sym") {
    const declaration = formula.symbols[leaf.name];
    return `${texToPlain(declaration.tex ?? leaf.name)}: ${declaration.description ?? leaf.name}`;
  }
  return `${formula.title}: ${node === formula.expr && formula.output.tex ? texToPlain(formula.output.tex) : termId}`;
}

const superscript = (n) => [...String(n)].map((ch) => SUPERSCRIPT[ch]).join("");

/** Four significant figures, plain between 10^-3 and 10^4 and m×10^n outside; deterministic and locale independent. */
export function formatTermValue(value) {
  if (!Number.isFinite(value)) throw new RangeError(`formatTermValue: value must be finite, received ${value}`);
  if (value === 0) return "0";
  const magnitude = Math.abs(value);
  if (magnitude >= PLAIN_RANGE[0] && magnitude < PLAIN_RANGE[1]) {
    const plain = value.toPrecision(SIGNIFICANT_FIGURES);
    if (!plain.includes("e")) return plain;
  }
  const [mantissa, exponent] = value.toExponential(SIGNIFICANT_FIGURES - 1).split("e");
  return `${mantissa}×10${superscript(Number(exponent))}`;
}

/** [min, max] of a term over sample environments: what a field legend and the colour range are built from. */
export function termRange(formula, termId, envs) {
  if (!Array.isArray(envs) || envs.length === 0) throw new RangeError("termRange: pass at least one sample environment");
  const values = envs.map((env) => evaluateTerm(formula, termId, env)).filter(Number.isFinite);
  if (values.length === 0) throw new RangeError(`termRange: ${formula.id} term ${termId} has no finite value on the samples`);
  const lo = Math.min(...values), hi = Math.max(...values);
  if (!(lo < hi)) throw new RangeError(`termRange: ${formula.id} term ${termId} spans a single value (${lo}); a field needs a range`);
  return [lo, hi];
}

/* ---------- target declarations ---------- */

function checkBinding(where, name, value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new RangeError(`${where}: binding ${name} must be finite`);
    return value;
  }
  if (isPlainObject(value)) {
    if (!isNonEmptyString(value.node)) throw new TypeError(`${where}: binding ${name} needs a non-empty node name`);
    return Object.freeze({ node: value.node });
  }
  throw new TypeError(`${where}: binding ${name} must be a number or { node }, received ${JSON.stringify(value)}`);
}

function fieldTarget(where, formula, termId, target) {
  if (!isNonEmptyString(target.surfaceName)) throw new TypeError(`${where}: field target needs a surfaceName`);
  const { range, bindings } = target;
  if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isFinite) || !(range[0] < range[1])) {
    throw new RangeError(`${where}: field target needs range [lo, hi] with lo < hi, received ${JSON.stringify(range)}`);
  }
  if (!isPlainObject(bindings)) throw new TypeError(`${where}: field target needs bindings`);
  const { variables, constants } = termSymbols(formula, termId);
  for (const name of Object.keys(bindings)) {
    if (!variables.includes(name) && !constants.includes(name)) {
      throw new RangeError(`${where}: bindings: ${name} is not a symbol of term ${termId}`);
    }
  }
  for (const name of variables) {
    if (!(name in bindings)) throw new RangeError(`${where}: bindings: no binding for ${name}`);
  }
  const checked = Object.fromEntries(Object.entries(bindings).map(([name, value]) => [name, checkBinding(where, name, value)]));
  const optional = Object.fromEntries(["palette", "paletteName"].filter((key) => target[key] !== undefined).map((key) => [key, target[key]]));
  return Object.freeze({ kind: "field", surfaceName: target.surfaceName, range: Object.freeze([...range]), bindings: Object.freeze(checked), ...optional });
}

function checkTarget(formula, termId, target) {
  const where = `bindScene: ${formula.id}.${termId}`;
  if (!isPlainObject(target)) throw new TypeError(`${where}: a target is { kind, … }`);
  if (target.kind === "object") {
    if (!isNonEmptyString(target.objectName)) throw new TypeError(`${where}: object target needs an objectName`);
    return Object.freeze({ kind: "object", objectName: target.objectName });
  }
  if (target.kind === "field") return fieldTarget(where, formula, termId, target);
  throw new TypeError(`${where}: kind must be "object" or "field", received ${JSON.stringify(target.kind)}`);
}

/* ---------- the registry ---------- */

const byId = (formulas) => Object.freeze(Object.fromEntries(Object.values(formulas).map((f) => [f.id, f])));

/**
 * `formulas` maps formula id to a defineFormula result (default: the library). `diagnostic` receives benign
 * misses (default: console.debug when a console exists), like the ConceptBus.
 */
export function createLensRegistry({ formulas = byId(library), diagnostic } = {}) {
  const report = typeof diagnostic === "function"
    ? diagnostic
    : (message) => { try { console.debug("[FormulaLens]", message); } catch (error) { /* no console */ } };
  const stacks = new Map(); // formula id -> bindings, the last one is active

  const formula = (id) => (Object.hasOwn(formulas, id) ? formulas[id] : null);

  /** Declare what the terms of `formulaId` mean in scene `sceneId`. Returns the function that removes the declaration. */
  function bindScene(sceneId, formulaId, { termTargets, live } = {}) {
    if (!isNonEmptyString(sceneId)) throw new TypeError("bindScene: sceneId must be a non-empty string");
    const f = formula(formulaId);
    if (!f) throw new ReferenceError(`bindScene: unknown formula "${formulaId}"`);
    if (!isPlainObject(termTargets) || Object.keys(termTargets).length === 0) throw new TypeError(`bindScene: ${formulaId} needs at least one term target`);
    if (live !== undefined && typeof live !== "function") throw new TypeError("bindScene: live must be a function(termId) -> { env, unit? }");
    const targets = {};
    for (const [termId, target] of Object.entries(termTargets)) {
      if (!f.termIds.includes(termId)) throw new RangeError(`bindScene: ${formulaId} has no term "${termId}" (terms: ${f.termIds.join(", ")})`);
      targets[termId] = checkTarget(f, termId, target);
    }
    const entry = Object.freeze({ sceneId, formulaId, termTargets: Object.freeze(targets), live });
    if (!stacks.has(formulaId)) stacks.set(formulaId, []);
    stacks.get(formulaId).push(entry);
    return () => {
      const stack = stacks.get(formulaId);
      const at = stack?.indexOf(entry) ?? -1;
      if (at >= 0) stack.splice(at, 1);
    };
  }

  const binding = (formulaId) => stacks.get(formulaId)?.at(-1) ?? null;
  const target = (formulaId, termId) => binding(formulaId)?.termTargets[termId] ?? null;

  /**
   * The payload of the ConceptBus `formula-term` event for a term: its current value with the active scene's
   * live parameters. Null when the term is unknown, when a scene must supply a variable and none does, or when
   * the value is not finite.
   */
  function termEvent(formulaId, termId) {
    const f = formula(formulaId);
    if (!f || !f.termIds.includes(termId)) return null;
    let env = {}, unit = null;
    const source = binding(formulaId)?.live;
    if (source) {
      try {
        const live = source(termId);
        env = live?.env ?? {};
        unit = live?.unit ?? null;
      } catch (error) {
        report(`live source for ${formulaId}.${termId} threw: ${error?.message ?? error}`);
        return null;
      }
    }
    if (termSymbols(f, termId).variables.some((name) => typeof env[name] !== "number")) return null;
    const value = evaluateTerm(f, termId, env);
    if (!Number.isFinite(value)) {
      report(`${formulaId}.${termId} is not finite for the live parameters`);
      return null;
    }
    return { formulaId, termId, value, unit: unit ?? termUnit(f, termId) };
  }

  return Object.freeze({ bindScene, binding, target, termEvent, formula });
}

/** The registry the page shares: scenes bind into it, FormulaCard reads from it. */
export const lens = createLensRegistry();
export const bindScene = lens.bindScene;
