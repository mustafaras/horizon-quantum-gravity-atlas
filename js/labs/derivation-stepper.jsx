// derivation-stepper.jsx — the DOM half of js/formula/stepper.mjs.
//
// The state machine (index, clamping, reduced motion, keyboard mapping) is pure and lives in the ESM module, so it can be
// tested in Node without React. This file only draws it: the equation for the current step, the justification line, the
// heuristic label when the step has one, and ← / → buttons that are real buttons.
//
// Reduced motion is honoured from the controller's `transitionMs`, which is 0 when the media query matches. No transition
// is declared in CSS for the equation: the only motion is the step marker, so nothing animates that a reader has to wait
// for.

const { useState, useEffect, useMemo, useRef, useCallback } = React;

/**
 * The step index, carried across a rebuild of the controller.
 *
 * `reduced` comes from a media query that can change while the page is open, so the controller is rebuilt when it does.
 * The index lives here rather than in the controller so the rebuild does not lose the reader's place; `goTo` clamps it into
 * the new range, which is why a shorter derivation after a rebuild cannot leave the index dangling.
 */
function useDerivationStepper(steps, { start = 0, reduced = false } = {}) {
  const stepper = useMemo(
    () => window.QGA_FORMULA.stepper.createStepper({ steps, at: start, reduced }),
    [steps, start, reduced],
  );
  const [index, setIndex] = useState(() => stepper.index());
  useEffect(() => { setIndex((current) => stepper.goTo(current)); }, [stepper]);
  return { stepper, index, setIndex };
}

function DerivationStepper({ derivationId, start = 0, compact = false, onStep = () => {} }) {
  const derivation = window.QGA_FORMULA?.derivation?.(derivationId) ?? null;
  const reduced = usePRM();
  // Hooks run for every render, so the stepper needs a step count even when the id does not resolve. One step is the
  // smallest valid derivation, and the missing-derivation branch below never draws it.
  const { stepper, index, setIndex } = useDerivationStepper(Math.max(1, derivation?.steps.length ?? 1), { start, reduced });
  const rootRef = useRef(null);

  // The step is announced, not just repainted: a reader who cannot see the highlight learns the position from a live
  // region, and the heuristic label is part of that announcement rather than a caption someone might miss.
  const view = derivation ? window.QGA_FORMULA.stepper.stepView(derivation, index) : null;
  useEffect(() => { if (view) onStep(view); }, [view?.id]);

  const move = useCallback((act) => {
    const next = act();
    setIndex(next);
  }, [stepper, setIndex]);

  const onKeyDown = useCallback((event) => {
    const result = stepper.key(event.key);
    if (!result.handled) return;
    event.preventDefault();
    setIndex(result.index);
  }, [stepper, setIndex]);

  if (!derivation) {
    return (
      <div className="derivation-stepper derivation-missing" role="note">
        No derivation is registered under <code>{derivationId}</code>.
      </div>
    );
  }

  return (
    <div className={"derivation-stepper" + (compact ? " is-compact" : "")} ref={rootRef}
      role="group" aria-roledescription="derivation" aria-label={derivation.title}
      onKeyDown={onKeyDown} tabIndex={0} data-qga-derivation={derivation.id}>
      <div className="ds-head">
        <span className="ds-title">{derivation.title}</span>
        <span className="ds-position" aria-hidden="true">{view?.position} / {view?.total}</span>
      </div>
      <div className="ds-eq" role="img" aria-label={view?.label}>
        <Eq tex={view?.tex ?? ""} display={true}></Eq>
      </div>
      {view?.heuristic ? (
        <p className="ds-heuristic"><Badge kind="heuristic"></Badge> {view.heuristic}</p>
      ) : null}
      <p className="ds-justification">{view?.justification}</p>
      <div className="ds-controls">
        <button type="button" className="ds-step" onClick={() => move(() => stepper.previous())}
          disabled={stepper.state().atStart} aria-label="Previous step">←</button>
        <div className="ds-track" role="presentation">
          {derivation.steps.map((step, i) => (
            <button type="button" key={step.id} className={"ds-dot" + (i === index ? " is-current" : "")}
              aria-label={`Step ${i + 1}: ${step.justification.slice(0, 60)}`}
              aria-current={i === index ? "step" : undefined}
              onClick={() => move(() => stepper.goTo(i))}></button>
          ))}
        </div>
        <button type="button" className="ds-step" onClick={() => move(() => stepper.next())}
          disabled={stepper.state().atEnd} aria-label="Next step">→</button>
      </div>
      <p className="ds-live" role="status" aria-live="polite">Step {view?.position} of {view?.total}. {view?.justification}</p>
    </div>
  );
}

Object.assign(window, { DerivationStepper });
