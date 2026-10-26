/*
 * Formula Lens for Figure Kit figures (S17): focusing a term of a typeset formula lights its counterpart marks in a 2-D figure.
 *
 * It is the figure half of what js/visualizations/common/term-lens.mjs is for a 3-D scene, and it uses the same registry
 * (js/formula/lens.mjs) and the same ConceptBus events (`formula-term`, `formula-clear`). A figure declares object targets only:
 * the object name addresses a mark by its `id`, or every mark whose id starts with `name:`, so "oneloop" lights "oneloop:a1", "oneloop:a2"
 * and "oneloop:a3" together. A field target is rejected: the Figure Kit has no surface to paint a field over.
 *
 * Nothing here draws. The lens reports the indexes of the lit marks through `onChange`; buildScene(spec, { lit }) draws them at the
 * focal width and lets the others recede. The module is pure: it imports in Node without DOM, React or canvas.
 */

import { lens as sharedRegistry } from "../formula/lens.mjs";

/** Indexes (into spec.marks) of the marks an object name addresses: an exact id, or any id that starts with `name:`. */
export function markIndexesFor(spec, objectName) {
  const prefix = `${objectName}:`;
  const hits = [];
  spec.marks.forEach((m, i) => { if (m.id === objectName || (typeof m.id === "string" && m.id.startsWith(prefix))) hits.push(i); });
  return hits;
}

/**
 * @param spec        the figure() result the lens belongs to, or a function returning the current one
 * @param sceneId     stable id for the registry ("rg-unification")
 * @param formulaId   id of a Formula Core formula
 * @param termTargets { termId: { kind: "object", objectName } }
 * @param live        (termId) => ({ env, unit? }): the figure's live parameters for the value of a focused term
 * @param onChange    (litIndexes: number[]) called when the set of lit marks changes
 * @returns { dispose(), lit }
 */
export function createFigureLens({ spec, sceneId, formulaId, termTargets, live, onChange, bus = globalThis.QGA_CONCEPT_BUS, registry = sharedRegistry }) {
  if (!bus || typeof bus.on !== "function") throw new TypeError("createFigureLens: bus (the ConceptBus) is required");
  if (typeof onChange !== "function") throw new TypeError("createFigureLens: onChange must be a function");
  const specOf = typeof spec === "function" ? spec : () => spec; // a function follows a figure that is rebuilt (a cross-fade adds marks)
  for (const [termId, target] of Object.entries(termTargets ?? {})) {
    if (target?.kind !== "object") throw new TypeError(`createFigureLens: ${formulaId}.${termId}: a figure has object targets (mark ids) only, received ${JSON.stringify(target?.kind)}`);
  }
  const unbind = registry.bindScene(sceneId, formulaId, { termTargets, live });
  const objectOf = new Map();
  let offTerm = null, offClear = null, lit = [], disposed = false;
  try {
    for (const [termId, target] of Object.entries(registry.binding(formulaId).termTargets)) {
      if (markIndexesFor(specOf(), target.objectName).length === 0) throw new ReferenceError(`createFigureLens: figure ${specOf().id} has no mark "${target.objectName}" for term ${termId}`);
      objectOf.set(termId, target.objectName);
    }
  } catch (error) {
    unbind();
    throw error;
  }

  const set = (next) => {
    if (next.length === lit.length && next.every((v, i) => v === lit[i])) return;
    lit = next;
    onChange(lit);
  };
  offTerm = bus.on("formula-term", (payload) => { if (!disposed && payload.formulaId === formulaId) set(objectOf.has(payload.termId) ? markIndexesFor(specOf(), objectOf.get(payload.termId)) : []); });
  offClear = bus.on("formula-clear", () => { if (!disposed) set([]); });

  return Object.freeze({
    get lit() { return lit; },
    dispose() {
      if (disposed) return;
      disposed = true;
      offTerm?.(); offClear?.();
      unbind();
      set([]);
    },
  });
}
