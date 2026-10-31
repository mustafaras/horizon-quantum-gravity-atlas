/*
 * defineDerivation: an ordered argument whose every step is either an expression the Formula Core can evaluate or
 * bare TeX, with a justification and the terms that changed on the way in.
 *
 * A step is `{ expr | tex, justification, changedTerms }`:
 *
 *   expr          an expression (`js/formula/expr.mjs`); it evaluates, and its TeX is generated, so a step can be
 *                 checked against the closed form of the derivation rather than trusted
 *   tex           TeX for a step whose content is not a scalar quantity (an operator, an integral, an identity)
 *   justification one sentence saying why the step follows from the one before it
 *   changedTerms  the term ids this step rewrote, which the stepper highlights through \htmlData
 *   heuristic     names the step as an argument by analogy rather than a derivation; the stepper renders the label,
 *                 so "this step is heuristic" is data rather than prose someone has to remember
 *
 * A derivation is a definition in the same sense a formula is: pure, frozen, importable in Node, and with no DOM.
 * `evaluateStep` is what a test asserts a step against; `stepTex` is what the stepper and the whitepaper typeset.
 */

import { deepFreeze } from "../science/contracts.mjs";
import { isExpr, termIds, freeSymbols } from "./expr.mjs";
import { toTeX } from "./to-tex.mjs";
import { compileJS } from "./to-js.mjs";
import { inferDimensions, dimensionToString } from "./dimensions.mjs";

const STEP_KINDS = Object.freeze(["expression", "typeset"]);

function validateReferences(id, references) {
  if (!Array.isArray(references) || references.length === 0) throw new TypeError(`${id}: references must be a non-empty array`);
  references.forEach((r, i) => {
    if (!r || typeof r.citation !== "string" || !(r.doi || r.arxiv || r.url) || !/^\d{4}-\d{2}-\d{2}$/.test(r.retrieved ?? "")) {
      throw new TypeError(`${id}: references[${i}] needs a citation, one of doi, arxiv or url, and a retrieved date (YYYY-MM-DD)`);
    }
  });
}

/** The symbols a step or the closed form uses: `{ name: { tex, unit, dims } }`, as a formula declares them. */
function checkSymbols(id, symbols) {
  if (symbols === undefined) return Object.freeze({});
  if (!symbols || typeof symbols !== "object" || Array.isArray(symbols)) throw new TypeError(`${id}: symbols must be an object`);
  for (const [name, decl] of Object.entries(symbols)) {
    if (!decl || typeof decl !== "object") throw new TypeError(`${id}: symbols.${name} must be an object`);
    if (typeof decl.tex !== "string" || decl.tex === "") throw new TypeError(`${id}: symbols.${name} needs TeX`);
    if (typeof decl.unit !== "string" || decl.unit === "") throw new TypeError(`${id}: symbols.${name} needs a unit ("1" when dimensionless)`);
    if (!decl.dims || typeof decl.dims !== "object") throw new TypeError(`${id}: symbols.${name} needs dimensions`);
  }
  return Object.freeze({ ...symbols });
}

function checkStep(id, step, index) {
  const at = `${id}: steps[${index}]`;
  if (!step || typeof step !== "object") throw new TypeError(`${at} must be an object`);
  if (typeof step.justification !== "string" || step.justification.trim() === "") throw new TypeError(`${at} needs a justification`);
  const hasExpr = step.expr !== undefined;
  const hasTex = step.tex !== undefined;
  if (hasExpr === hasTex) throw new TypeError(`${at} needs exactly one of expr or tex`);
  if (hasExpr && !isExpr(step.expr)) throw new TypeError(`${at}.expr must be an expression`);
  if (hasTex && (typeof step.tex !== "string" || step.tex.trim() === "")) throw new TypeError(`${at}.tex must be non-empty TeX`);
  if (step.changedTerms !== undefined && (!Array.isArray(step.changedTerms) || step.changedTerms.length === 0)) {
    throw new TypeError(`${at}.changedTerms must be a non-empty array when given`);
  }
  if (step.heuristic !== undefined && typeof step.heuristic !== "string") throw new TypeError(`${at}.heuristic must be a string when given`);
  return Object.freeze({
    id: step.id ?? `step-${index + 1}`,
    kind: hasExpr ? "expression" : "typeset",
    expr: hasExpr ? step.expr : null,
    tex: hasTex ? step.tex : null,
    justification: step.justification,
    changedTerms: Object.freeze([...(step.changedTerms ?? [])]),
    heuristic: step.heuristic ?? null,
  });
}

/**
 * A derivation. `closed` is the expression the argument arrives at; when it is given, `check` proves the last
 * expression step evaluates to it, which is the property the stepper is claiming by existing.
 */
export function defineDerivation({ id, title, status, steps, symbols = {}, closed, domain = {}, references, note } = {}) {
  for (const [key, value] of Object.entries({ id, title })) {
    if (typeof value !== "string" || value === "") throw new TypeError(`defineDerivation: ${key} must be a non-empty string`);
  }
  if (!Array.isArray(steps) || steps.length < 2) throw new TypeError(`${id}: a derivation needs at least two steps`);
  validateReferences(id, references);

  const declared = checkSymbols(id, symbols);
  const checked = steps.map((step, index) => checkStep(id, step, index));
  const seen = new Set();
  for (const step of checked) {
    if (seen.has(step.id)) throw new TypeError(`${id}: duplicate step id ${step.id}`);
    seen.add(step.id);
  }

  // `changedTerms` names the term a step rewrites. An expression step can only rewrite a term it contains; a typeset
  // step can only name a term some expression step declares, so no step highlights a term the argument never introduces.
  const vocabulary = new Set(checked.flatMap((step) => (step.expr ? [...termIds(step.expr)] : [])));
  for (const step of checked) {
    const own = step.expr ? new Set(termIds(step.expr)) : vocabulary;
    for (const termId of step.changedTerms) {
      if (!own.has(termId)) {
        throw new RangeError(`${id}.${step.id}: changedTerms names "${termId}", which ${step.expr ? "the step" : "no step"} declares (${[...own].join(", ") || "none"})`);
      }
    }
    if (step.expr) {
      for (const name of freeSymbols(step.expr)) {
        if (!declared[name]) throw new ReferenceError(`${id}.${step.id}: unknown symbol ${name}`);
      }
      inferDimensions(step.expr, declared);
    }
  }

  if (closed !== undefined) {
    if (!isExpr(closed)) throw new TypeError(`${id}: closed must be an expression`);
    for (const name of freeSymbols(closed)) {
      if (!declared[name]) throw new ReferenceError(`${id}.closed: unknown symbol ${name}`);
    }
    inferDimensions(closed, declared);
  }

  // Every symbol that is not a physical constant needs a domain, so `check()` samples a declared region rather than
  // inventing numbers for a derivation nobody bounded.
  const variables = Object.entries(declared).filter(([, decl]) => decl.constant === undefined).map(([name]) => name);
  for (const name of variables) {
    const d = domain[name];
    const valid = Array.isArray(d) && d.length === 3 && d[0] <= d[1] && (d[2] === "lin" || (d[2] === "log" && d[0] > 0));
    if (!valid && checked.some((step) => step.expr && freeSymbols(step.expr).includes(name))) {
      throw new TypeError(`${id}: domain.${name} must be [min, max, "lin" | "log"] with min <= max (and min > 0 for log)`);
    }
  }

  const compiled = new Map();
  const closure = (node) => {
    if (!compiled.has(node)) compiled.set(node, compileJS(node));
    return compiled.get(node);
  };
  const constants = Object.fromEntries(
    Object.entries(declared).filter(([, decl]) => decl.constant !== undefined).map(([name, decl]) => [name, decl.constant]),
  );
  const withConstants = (env) => ({ ...constants, ...env });

  /** The value of an expression step in float64. A typeset step has no value: it is an operator, not a quantity. */
  function evaluateStep(stepId, env = {}) {
    const step = checked.find((s) => s.id === stepId);
    if (!step) throw new RangeError(`${id}: no step "${stepId}" (steps: ${checked.map((s) => s.id).join(", ")})`);
    if (!step.expr) return null;
    return closure(step.expr)(withConstants(env));
  }

  /** The value the argument arrives at. */
  function evaluateClosed(env = {}) {
    if (closed === undefined) throw new TypeError(`${id}: this derivation declares no closed form`);
    return closure(closed)(withConstants(env));
  }

  /**
   * Agreement between the last expression step and the closed form over the declared domain, as `gpuSafe` reports a
   * GPU: the worst relative error and where it was found. A derivation whose steps do not land on its closed form
   * is a broken argument, and this is the number that says so.
   */
  function check({ samples = 65 } = {}) {
    if (closed === undefined) return Object.freeze({ ok: null, reason: "no closed form declared" });
    const last = [...checked].reverse().find((step) => step.expr);
    if (!last) return Object.freeze({ ok: false, reason: "no expression step to compare with the closed form" });
    // Only the symbols the comparison actually uses are sampled; a symbol the closed form ignores needs no domain.
    const used = new Set([...freeSymbols(last.expr), ...freeSymbols(closed)]);
    const variables = Object.keys(declared).filter((name) => used.has(name) && declared[name].constant === undefined);
    const points = variables.length > 0
      ? Array.from({ length: samples }, (_, i) => {
        const point = {};
        variables.forEach((name) => {
          const [lo, hi, scale] = domain[name];
          const t = samples === 1 ? 0.5 : i / (samples - 1);
          point[name] = scale === "log" ? Math.exp(Math.log(lo) + t * (Math.log(hi) - Math.log(lo))) : lo + t * (hi - lo);
        });
        return point;
      })
      : [{}];
    let maxRelError = 0, worst = null;
    for (const point of points) {
      const env = withConstants(point);
      const a = closure(last.expr)(env);
      const b = closure(closed)(env);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      const err = Math.abs(a - b) / (Math.abs(b) || 1);
      if (err > maxRelError) { maxRelError = err; worst = point; }
    }
    return Object.freeze({ ok: maxRelError <= 1e-12, maxRelError, worst, samples: points.length, step: last.id });
  }

  return deepFreezeDerivation({
    id, title, status: status ?? null, steps: Object.freeze(checked), symbols: declared, closed: closed ?? null,
    domain, references, note: note ?? null,
    closedTex: closed === undefined ? null : toTeX(closed, declared),
    closedDims: closed === undefined ? null : dimensionToString(inferDimensions(closed, declared)),
    termIds: Object.freeze([...new Set(checked.flatMap((step) => step.changedTerms))]),
    evaluateStep, evaluateClosed, check,
    /** The TeX of a step, from its expression or verbatim. */
    stepTex: (stepId) => {
      const step = checked.find((s) => s.id === stepId);
      if (!step) throw new RangeError(`${id}: no step "${stepId}"`);
      return step.expr ? toTeX(step.expr, declared) : step.tex;
    },
    /** Which steps rewrite a given term, in order: the sequence the stepper lights up. */
    trace: (termId) => checked.filter((step) => step.changedTerms.includes(termId)).map((step) => step.id),
  });
}

function deepFreezeDerivation(d) {
  deepFreeze(d.steps); deepFreeze(d.symbols); deepFreeze(d.domain); deepFreeze(d.references);
  return Object.freeze(d);
}

export { STEP_KINDS };
