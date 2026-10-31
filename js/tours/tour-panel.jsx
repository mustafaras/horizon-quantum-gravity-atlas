// tour-panel.jsx — S31 guided tours and the teacher worksheet.
//
// The panel is a step reader, not a slide deck: it shows the step's text, its question, the expected readout a teacher
// can grade against, the formula card the step opens, and two real buttons. Every decision about *where* a step points
// lives in js/tours/tour-runner.mjs, so this file only draws.
//
// Print mode (`?tour=…&print=1`) swaps the reader for a worksheet: the same steps as numbered questions with their
// expected answers, their plain URLs and the tour's references. No QR code — a printed URL survives a photocopier, a
// QR square does not.

const { useState, useEffect, useMemo, useRef, useCallback } = React;

function tourStore() {
  return window.QGA_TOURS?.createTourResumeStore({ storage: (() => { try { return window.localStorage; } catch (e) { return null; } })() }) ?? null;
}

/** The launcher: pick a tour, or continue the one this browser stopped in. */
function TourLauncher({ onStart, onClose }) {
  const tours = window.QGA_TOURS?.TOUR_LIBRARY ?? [];
  const store = useMemo(tourStore, []);
  const remembered = useMemo(() => (store ? store.ids() : []), [store]);
  return (
    <div className="tour-launcher">
      <ul className="tour-list">
        {tours.map((tour) => {
          const step = store ? store.read(tour.id) : null;
          return (
            <li key={tour.id} className="tour-list-item">
              <button className="tour-start" onClick={() => onStart(tour.id, step ?? 1)}>
                <span className="tour-list-title">{tour.title}</span>
                <span className="tour-list-meta">
                  {tour.steps.length} steps
                  {step ? ` · continue at step ${step}` : remembered.includes(tour.id) ? " · resume" : ""}
                </span>
              </button>
              <p className="tour-list-summary">{tour.summary}</p>
            </li>
          );
        })}
      </ul>
      {tours.length === 0 ? <p className="dim small">No tours are registered in this build.</p> : null}
      <div className="tour-launcher-foot">
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/** The reader for one step. */
function TourReader({ tour, step, onStep, onExit, onPrint }) {
  const plan = window.QGA_TOURS?.stepPlan(tour, step) ?? null;
  const store = useMemo(tourStore, []);
  const focusRef = useRef(null);

  // Remember where the reader stopped. A browser with storage disabled still walks the tour; it just forgets.
  useEffect(() => { if (plan) store?.write(tour.id, plan.index); }, [plan && plan.index, store, tour.id]);
  // The step is announced rather than silently repainted: moving on is a navigation, and a screen reader should hear
  // it. Focus lands on the panel itself, not on a heading — a visible focus ring around a title in a step reader reads
  // as "the title is a control", which it is not.
  useEffect(() => {
    if (!plan) return;
    focusRef.current?.focus({ preventScroll: true });
  }, [plan && plan.index]);

  if (!plan) return null;
  const patchNote = window.QGA_TOURS?.describePatch(plan.patch) ?? "";
  return (
    <div className="tour-reader" role="region" aria-label={`Guided tour: ${tour.title}`}>
      <div className="tour-reader-head">
        <div>
          <div className="tour-kicker">Guided tour</div>
          <h2 className="tour-reader-title">{tour.title}</h2>
        </div>
        <span className="tour-focus-sink" aria-hidden="true" ref={focusRef} tabIndex={-1}></span>
        <span className="tour-counter mono">{window.QGA_TOURS.formatStepCounter(plan.index, plan.total)}</span>
      </div>

      <div className="tour-progress" role="progressbar" aria-valuemin={1} aria-valuemax={plan.total}
        aria-valuenow={plan.index} aria-label="Tour progress">
        {tour.steps.map((_, i) => (
          <button key={i} className={"tour-tick" + (i + 1 === plan.index ? " is-current" : i + 1 < plan.index ? " is-done" : "")}
            aria-label={`Go to step ${i + 1}`} aria-current={i + 1 === plan.index ? "step" : undefined}
            onClick={() => onStep(i + 1)}></button>
        ))}
      </div>

      <p className="tour-text"><RichText text={plan.text}></RichText></p>

      <div className="tour-question">
        <div className="tour-label">Question</div>
        <p><RichText text={plan.question}></RichText></p>
        {plan.expected ? (
          <details className="tour-expected">
            <summary>Expected readout</summary>
            <p><RichText text={plan.expected}></RichText></p>
          </details>
        ) : null}
      </div>

      <div className="tour-target">
        <span className="tour-label">Shows</span>
        <span className="mono">view: {plan.view}</span>
        {plan.shot ? <span className="mono">shot: {plan.shot}</span> : null}
        {plan.formulaFocus ? <span className="mono">formula: {plan.formulaFocus}</span> : null}
        {patchNote ? <span className="mono tour-patch">{patchNote}</span> : null}
      </div>

      <div className="tour-controls">
        <button className="btn" onClick={() => onStep(plan.index - 1)} disabled={plan.atStart}
          aria-label="Previous step">← Previous</button>
        <button className="btn primary" onClick={() => onStep(plan.index + 1)} disabled={plan.atEnd}
          aria-label="Next step">Next →</button>
        <button className="btn" onClick={onPrint}>Worksheet</button>
        <button className="btn" onClick={onExit}>Exit tour</button>
      </div>
    </div>
  );
}

/** The printable worksheet: questions, expected readouts, plain URLs, references. */
function TourWorksheet({ tour, onExit }) {
  const header = window.QGA_TOURS?.worksheetHeader(tour) ?? null;
  const rows = window.QGA_TOURS?.worksheetRows(tour) ?? [];
  useEffect(() => {
    const previous = document.title;
    document.title = `Worksheet — ${tour.title}`;
    return () => { document.title = previous; };
  }, [tour.title]);
  if (!header) return null;
  return (
    <div className="tour-worksheet" role="region" aria-label={`Worksheet: ${tour.title}`}>
      <header className="tour-sheet-head">
        <div className="tour-kicker">Teacher worksheet · HORIZON</div>
        <h2>{header.title}</h2>
        {header.summary ? <p className="tour-sheet-summary">{header.summary}</p> : null}
        <p className="tour-sheet-meta mono">
          {header.stepCount} steps · worksheet link: {header.url}
        </p>
        <div className="tour-sheet-fields">
          <span>Name</span><span className="tour-sheet-rule"></span>
          <span>Date</span><span className="tour-sheet-rule"></span>
        </div>
      </header>

      <ol className="tour-sheet-list">
        {rows.map((row) => (
          <li key={row.number} className="tour-sheet-item">
            <div className="tour-sheet-line">
              <span className="tour-sheet-num mono">{row.number}.</span>
              <p className="tour-sheet-question"><RichText text={row.question}></RichText></p>
            </div>
            <p className="tour-sheet-context"><RichText text={row.text}></RichText></p>
            <p className="tour-sheet-url mono">{row.url}</p>
            <div className="tour-sheet-answer">
              <span className="tour-label">Answer / expected readout</span>
              <p>{row.expected
                ? <RichText text={row.expected}></RichText>
                : "Open the step and read the value on screen."}</p>
            </div>
            {row.formulaFocus ? <p className="tour-sheet-focus mono">Formula: {row.formulaFocus}</p> : null}
          </li>
        ))}
      </ol>

      {header.references.length ? (
        <section className="tour-sheet-refs">
          <h3>References</h3>
          <ol>
            {header.references.map((reference, i) => (
              <li key={i}>{reference.label} — <span className="mono">{reference.url}</span></li>
            ))}
          </ol>
        </section>
      ) : null}

      <p className="tour-sheet-foot mono">
        Printed from the HORIZON Quantum Gravity Atlas. Every number on this sheet is computed by the atlas's own
        tested physics modules; nothing here is quoted from memory. No quantum gravity theory is experimentally
        confirmed, and the atlas marks every claim with its scientific status.
      </p>
      <div className="tour-controls tour-sheet-controls no-print">
        <button className="btn primary" onClick={() => window.print()}>Print</button>
        <button className="btn" onClick={onExit}>Back to the atlas</button>
      </div>
    </div>
  );
}

/**
 * The tour surface. Rendered by the shell when the URL names a tour; it owns no state the URL does not.
 *
 * `onNavigate(view, patch, formulaFocus, shot)` is the shell's navigation, so the panel never writes the URL itself.
 */
function TourSurface({ tourId, step, print, onNavigate, onClose }) {
  const tours = window.QGA_TOURS?.TOUR_LIBRARY ?? [];
  const tour = useMemo(() => window.QGA_TOURS?.findTour(tours, tourId) ?? null, [tours, tourId]);
  const [launcher, setLauncher] = useState(!tour);

  const goToStep = useCallback((next) => {
    if (!tour) return;
    const plan = window.QGA_TOURS.stepPlan(tour, next);
    if (!plan) return;
    onNavigate({ view: plan.view, patch: plan.patch, formulaFocus: plan.formulaFocus, shot: plan.shot, step: plan.index });
  }, [tour, onNavigate]);

  const start = useCallback((id, at) => {
    const chosen = window.QGA_TOURS.findTour(tours, id);
    if (!chosen) return;
    setLauncher(false);
    const plan = window.QGA_TOURS.stepPlan(chosen, at);
    if (!plan) return;
    onNavigate({ view: plan.view, patch: plan.patch, formulaFocus: plan.formulaFocus, shot: plan.shot, step: plan.index, tour: id });
  }, [tours, onNavigate]);

  useEffect(() => { setLauncher(!tour); }, [tour]);

  if (launcher) {
    return (
      <section className="tour-surface" aria-label="Guided tours">
        <div className="tour-surface-inner">
          <div className="tour-surface-head">
            <div>
              <div className="tour-kicker">Learning paths</div>
              <h2>Guided tours</h2>
              <p className="small dim">Paths through the atlas for learners and teachers. Each step names the view it
                opens, the question it asks and the readout that answers it; the worksheet prints the same steps.</p>
            </div>
          </div>
          <TourLauncher onStart={start} onClose={onClose}></TourLauncher>
        </div>
      </section>
    );
  }

  return (
    <section className={"tour-surface" + (print ? " is-print" : "")} aria-label="Guided tour">
      <div className="tour-surface-inner">
        {print
          ? <TourWorksheet tour={tour} onExit={onClose}></TourWorksheet>
          : <TourReader tour={tour} step={step} onStep={goToStep} onExit={onClose}
              onPrint={() => onNavigate({ view: tour.steps[step - 1]?.view ?? "overview", patch: {}, step: Math.max(1, step), print: true })}></TourReader>}
      </div>
    </section>
  );
}
