/**
 * Guided-tour schema (S31): the pure half of `js/tours/`.
 *
 * A tour is data, not code: `{ id, title, steps: [{ view, shot?, state, formulaFocus?, text, question, expected? }] }`.
 * Everything here runs in Node without DOM, React or three.js, so the shape of every shipped tour is asserted by
 * `node:test` rather than by looking at the page — a tour step that names a view, a shot or a state key the app does
 * not have fails the build instead of rendering a button that does nothing.
 *
 * Two rules the validator enforces on purpose:
 *   - a step's `state` patch may only use keys from the app's own state table, so a tour cannot smuggle in a
 *     parameter that the URL reader would silently drop;
 *   - a step that names a `shot` must also name a `view`, because the cinematic director looks shots up per view.
 */

export const TOUR_SCHEMA = "horizon-qga-tour/v1";

export const TOUR_LIMITS = Object.freeze({
  maxTours: 24,
  maxSteps: 24,
  maxIdLength: 48,
  maxTitleLength: 90,
  maxSummaryLength: 400,
  maxStepTextLength: 600,
  maxQuestionLength: 240,
  maxExpectedLength: 400,
  maxReferenceLabelLength: 240,
  maxFormulaFocusLength: 90,
  maxStateKeys: 12,
  maxReferences: 12,
  maxUrlSteps: 999,
});

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLAIN_URL = /^(https:\/\/|\/|\.\/)?[^\s"'<>]+$/;

const isPlainObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const nonEmptyString = (value, limit) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= limit;

/** The tour id an incoming `?tour=` belongs to, or null when the value cannot name a shipped tour. */
export function parseTourParam(raw) {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  return KEBAB.test(value) && value.length <= TOUR_LIMITS.maxIdLength ? value : null;
}

/** A 1-based step number from `?step=`, or null. Out-of-range numbers are the caller's to clamp. */
export function parseStepParam(raw) {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > TOUR_LIMITS.maxUrlSteps) return null;
  return value;
}

/** Whether `?print=` asks for the teacher worksheet. Only `1` and `true` do; anything else is ignored. */
export function parsePrintParam(raw) {
  return raw === "1" || raw === "true";
}

/** Clamp a 1-based step number into `[1, length]`; an empty tour yields 0. */
export function clampStep(step, length) {
  const total = Math.max(0, Math.trunc(length) || 0);
  if (total === 0) return 0;
  const value = Math.trunc(Number(step)) || 1;
  return Math.min(total, Math.max(1, value));
}

/** Step index helpers used by the runner and the worksheet: clamped, never wrapping. */
export const nextStep = (step, length) => climb(step, length, 1);
export const previousStep = (step, length) => climb(step, length, -1);
function climb(step, length, delta) {
  const total = Math.max(0, Math.trunc(length) || 0);
  if (total === 0) return 0;
  return clampStep(clampStep(step, total) + delta, total);
}

/** One-line counter for the panel and the worksheet, e.g. "Step 3 of 12". */
export function formatStepCounter(step, length) {
  const total = Math.max(0, Math.trunc(length) || 0);
  if (total === 0) return "No steps";
  return `Step ${clampStep(step, total)} of ${total}`;
}

/** Validate one manifest. `views` and `stateKeys` come from the app so the tours cannot name what does not exist. */
export function validateTour(manifest, { views = [], stateKeys = [] } = {}) {
  const errors = [];
  const fail = (message) => errors.push(message);
  if (!isPlainObject(manifest)) return { ok: false, errors: ["a tour must be an object"] };

  if (!nonEmptyString(manifest.id, TOUR_LIMITS.maxIdLength)) fail("id must be a non-empty kebab-case string");
  else if (!KEBAB.test(manifest.id)) fail(`id "${manifest.id}" must be kebab-case`);
  if (!nonEmptyString(manifest.title, TOUR_LIMITS.maxTitleLength)) fail("title must be a non-empty string");
  if (manifest.summary != null && !nonEmptyString(manifest.summary, TOUR_LIMITS.maxSummaryLength)) {
    fail("summary must be a non-empty string when present");
  }
  if (manifest.references != null) {
    if (!Array.isArray(manifest.references)) fail("references must be an array");
    else if (manifest.references.length > TOUR_LIMITS.maxReferences) {
      fail(`references must hold at most ${TOUR_LIMITS.maxReferences} entries`);
    } else {
      manifest.references.forEach((entry, index) => {
        if (!isPlainObject(entry)) { fail(`references[${index}] must be an object`); return; }
        if (!nonEmptyString(entry.label, TOUR_LIMITS.maxReferenceLabelLength)) {
          fail(`references[${index}].label must be a non-empty string`);
        }
        if (typeof entry.url !== "string" || !PLAIN_URL.test(entry.url.trim())) {
          fail(`references[${index}].url must be a plain URL`);
        } else if (/^javascript:/i.test(entry.url)) {
          fail(`references[${index}].url must not be a script URL`);
        }
      });
    }
  }

  if (!Array.isArray(manifest.steps) || manifest.steps.length === 0) {
    fail("steps must be a non-empty array");
    return { ok: errors.length === 0, errors };
  }
  if (manifest.steps.length > TOUR_LIMITS.maxSteps) fail(`steps must hold at most ${TOUR_LIMITS.maxSteps} entries`);

  manifest.steps.forEach((step, index) => {
    const at = `steps[${index}]`;
    if (!isPlainObject(step)) { fail(`${at} must be an object`); return; }
    if (!views.includes(step.view)) fail(`${at}.view "${step.view}" is not a view the app declares`);
    if (step.shot != null) {
      if (!nonEmptyString(step.shot, TOUR_LIMITS.maxIdLength) || !KEBAB.test(step.shot)) {
        fail(`${at}.shot must be a kebab-case shot id when present`);
      }
      if (!nonEmptyString(step.view, 32)) fail(`${at}.shot needs a view to be looked up in`);
    }
    if (step.formulaFocus != null && !nonEmptyString(step.formulaFocus, TOUR_LIMITS.maxFormulaFocusLength)) {
      fail(`${at}.formulaFocus must be a non-empty string when present`);
    }
    if (!nonEmptyString(step.text, TOUR_LIMITS.maxStepTextLength)) fail(`${at}.text must be a non-empty string`);
    if (!nonEmptyString(step.question, TOUR_LIMITS.maxQuestionLength)) {
      fail(`${at}.question must be a non-empty string`);
    }
    if (step.expected != null && !nonEmptyString(step.expected, TOUR_LIMITS.maxExpectedLength)) {
      fail(`${at}.expected must be a non-empty string when present`);
    }
    if (step.state != null) {
      if (!isPlainObject(step.state)) { fail(`${at}.state must be an object when present`); return; }
      const keys = Object.keys(step.state);
      if (keys.length > TOUR_LIMITS.maxStateKeys) fail(`${at}.state holds more than ${TOUR_LIMITS.maxStateKeys} keys`);
      for (const key of keys) {
        if (!stateKeys.includes(key)) fail(`${at}.state.${key} is not an app state key`);
      }
    }
  });

  return { ok: errors.length === 0, errors };
}

/** Validate a whole library: shapes, plus unique ids. */
export function validateTourLibrary(tours, options = {}) {
  const errors = [];
  if (!Array.isArray(tours)) return { ok: false, errors: ["the tour library must be an array"], tours: [] };
  if (tours.length > TOUR_LIMITS.maxTours) errors.push(`the library must hold at most ${TOUR_LIMITS.maxTours} tours`);
  const seen = new Set();
  for (const tour of tours) {
    const result = validateTour(tour, options);
    for (const error of result.errors) errors.push(`${tour && tour.id ? tour.id : "tour"}: ${error}`);
    if (tour && typeof tour.id === "string") {
      if (seen.has(tour.id)) errors.push(`${tour.id}: duplicate tour id`);
      seen.add(tour.id);
    }
  }
  return { ok: errors.length === 0, errors, tours };
}

/** The tour a `?tour=` names, or null. */
export function findTour(tours, id) {
  const wanted = parseTourParam(id);
  if (!wanted) return null;
  return (tours ?? []).find((tour) => tour.id === wanted) ?? null;
}

/** `?tour=<id>&step=<n>` for a step, as a relative URL. The worksheet prints these verbatim. */
export function stepUrl(tour, step) {
  const id = typeof tour === "string" ? tour : tour?.id;
  const total = typeof tour === "string" ? 0 : (tour?.steps?.length ?? 0);
  const number = total ? clampStep(step, total) : clampStep(step, TOUR_LIMITS.maxUrlSteps);
  return `?tour=${encodeURIComponent(id)}&step=${number}`;
}

/** `?tour=<id>&print=1` — the worksheet this tour prints to. */
export function worksheetUrl(tour) {
  const id = typeof tour === "string" ? tour : tour?.id;
  return `?tour=${encodeURIComponent(id)}&print=1`;
}

/**
 * The worksheet rows: every question with its expected readout, its plain URL and the step's formula focus.
 *
 * The URL is written out in full rather than encoded as a QR square, so the sheet prints on any printer and stays
 * readable when it is copied by hand — the constraint the prompt sets.
 */
export function worksheetRows(tour) {
  if (!isPlainObject(tour) || !Array.isArray(tour.steps)) return [];
  return tour.steps.map((step, index) => ({
    number: index + 1,
    view: step.view,
    text: step.text,
    question: step.question,
    expected: step.expected ?? null,
    url: stepUrl(tour, index + 1),
    formulaFocus: step.formulaFocus ?? null,
  }));
}

/** The plain-language header a worksheet carries for the whole tour. */
export function worksheetHeader(tour) {
  if (!isPlainObject(tour)) return null;
  return {
    id: tour.id,
    title: tour.title,
    summary: tour.summary ?? null,
    stepCount: Array.isArray(tour.steps) ? tour.steps.length : 0,
    url: worksheetUrl(tour),
    references: Array.isArray(tour.references) ? tour.references : [],
  };
}

/* ---------- resume ---------- */

export const TOUR_RESUME_SCHEMA = "horizon-qga-tour-resume/v1";

/**
 * localStorage-backed resume points. Storage failures are swallowed on purpose: a browser with storage disabled
 * must still be able to walk a tour, it just cannot remember where the reader stopped.
 */
export function createTourResumeStore({ storage } = {}) {
  const store = storage ?? null;
  const key = "horizon-qga-tour-resume/v1";

  const readAll = () => {
    if (!store) return {};
    try {
      const raw = store.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!isPlainObject(parsed) || parsed.schema !== TOUR_RESUME_SCHEMA || !isPlainObject(parsed.steps)) return {};
      const clean = {};
      for (const [tourId, step] of Object.entries(parsed.steps)) {
        if (KEBAB.test(tourId) && Number.isInteger(step) && step >= 1) clean[tourId] = step;
      }
      return clean;
    } catch (error) {
      return {};
    }
  };

  const writeAll = (steps) => {
    if (!store) return { ok: false, reason: "no storage" };
    try {
      store.setItem(key, JSON.stringify({ schema: TOUR_RESUME_SCHEMA, steps }));
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error && error.message ? error.message : "storage refused the write" };
    }
  };

  return {
    /** The remembered 1-based step for a tour, or null. */
    read(tourId) {
      const id = parseTourParam(tourId);
      if (!id) return null;
      const steps = readAll();
      return Number.isInteger(steps[id]) ? steps[id] : null;
    },
    /** Remember a step. Returns { ok } and never throws. */
    write(tourId, step) {
      const id = parseTourParam(tourId);
      const value = parseStepParam(step);
      if (!id || !value) return { ok: false, reason: "invalid tour id or step" };
      const steps = readAll();
      steps[id] = value;
      return writeAll(steps);
    },
    clear(tourId) {
      const id = parseTourParam(tourId);
      if (!id) return { ok: false, reason: "invalid tour id" };
      const steps = readAll();
      delete steps[id];
      return writeAll(steps);
    },
    /** Every remembered tour id — the launcher marks these "continue". */
    ids() {
      return Object.keys(readAll());
    },
  };
}
