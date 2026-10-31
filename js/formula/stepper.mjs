/*
 * The stepper's state machine, pure and testable: which step is showing, what ← and → do at the ends, and whether a
 * transition is animated. The DOM half is js/labs/derivation-stepper.jsx.
 *
 * Reduced motion is a property of the controller, not of a CSS media query the component hopes is set: `reduced`
 * makes every transition snap, so a test can assert it without a browser.
 */

const isReduced = (value) => value === true;

/**
 * @param {object} options
 * @param {number} options.steps       how many steps the derivation has
 * @param {number} [options.at]        the step to open on, clamped into range
 * @param {boolean} [options.reduced]  prefers-reduced-motion: snap instead of animating
 */
export function createStepper({ steps, at = 0, reduced = false } = {}) {
  if (!Number.isInteger(steps) || steps < 1) throw new RangeError(`createStepper: steps must be a positive integer, received ${steps}`);
  const last = steps - 1;
  const clamp = (i) => (Number.isFinite(i) ? Math.min(last, Math.max(0, Math.trunc(i))) : 0);
  let index = clamp(at);

  const state = () => Object.freeze({
    index,
    steps,
    atStart: index === 0,
    atEnd: index === last,
    reduced: isReduced(reduced),
    /** The duration a transition may take, 0 when motion is reduced. The component reads this, it does not choose. */
    transitionMs: isReduced(reduced) ? 0 : 180,
  });

  return Object.freeze({
    state,
    index: () => index,
    /** One step forward; returns the index actually shown so a caller never has to guess. */
    next() { index = clamp(index + 1); return index; },
    /** One step back. */
    previous() { index = clamp(index - 1); return index; },
    first() { index = 0; return index; },
    last() { index = last; return index; },
    goTo(i) { index = clamp(i); return index; },
    /**
     * A keyboard event's effect: ArrowRight/ArrowLeft/Home/End move, and every other key is reported as unhandled so
     * the caller can leave it to the page.
     */
    key(key) {
      switch (key) {
        case "ArrowRight": case "ArrowDown": case "PageDown": return { handled: true, index: this.next() };
        case "ArrowLeft": case "ArrowUp": case "PageUp": return { handled: true, index: this.previous() };
        case "Home": return { handled: true, index: this.first() };
        case "End": return { handled: true, index: this.last() };
        default: return { handled: false, index };
      }
    },
  });
}

/**
 * What a step shows: its TeX, its justification, whether it is labelled heuristic, and the terms it highlights. Kept
 * here rather than in the component so the label rendering is covered by a test that needs no DOM.
 */
export function stepView(derivation, index) {
  const step = derivation.steps[index];
  if (!step) throw new RangeError(`${derivation.id}: no step at index ${index}`);
  return Object.freeze({
    id: step.id,
    position: index + 1,
    total: derivation.steps.length,
    tex: derivation.stepTex(step.id),
    justification: step.justification,
    changedTerms: step.changedTerms,
    heuristic: step.heuristic,
    kind: step.kind,
    /** The accessible name of the step: position, justification and the heuristic label when there is one. */
    label: [
      `Step ${index + 1} of ${derivation.steps.length}`,
      step.heuristic ? `Heuristic: ${step.heuristic}` : null,
      step.justification,
    ].filter(Boolean).join(". "),
  });
}

export const STEPPER_KEYS = Object.freeze(["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"]);
