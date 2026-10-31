/**
 * Tour runner (S31): the pure decision of what a step asks the app to do.
 *
 * The panel draws a step; this module decides what a step means. Keeping the two apart is what makes the answer
 * testable: given a tour and a step number, `stepPlan()` returns the view to show, the state patch the URL reader
 * would accept, and the formula card to open. A wrong answer here is a tour that walks the reader to the wrong
 * chapter, which no screenshot would catch.
 */

import { clampStep, stepUrl } from "./tour-schema.mjs";

/**
 * The plan for one step.
 *
 * `patch` is merged into the live state, so it must only carry keys the app clamps on read; `applyStepState()`
 * filters it against the caller's key list rather than trusting the manifest.
 */
export function stepPlan(tour, step) {
  const steps = Array.isArray(tour?.steps) ? tour.steps : [];
  const index = clampStep(step, steps.length);
  if (!index) return null;
  const current = steps[index - 1];
  return {
    tourId: tour.id,
    index,
    total: steps.length,
    view: current.view,
    shot: current.shot ?? "",
    formulaFocus: current.formulaFocus ?? null,
    text: current.text,
    question: current.question,
    expected: current.expected ?? null,
    patch: current.state ? { ...current.state } : {},
    url: stepUrl(tour, index),
    atStart: index === 1,
    atEnd: index === steps.length,
  };
}

/**
 * Filter a step's state patch down to keys the app actually owns.
 *
 * The schema already refuses unknown keys at build time; this second gate exists because the manifest and the app can
 * ship at different commits, and a stale tour must degrade to "shows the view" rather than writing a parameter the URL
 * reader would drop on the next reload.
 */
export function applyStepState(patch, stateKeys) {
  if (!patch || typeof patch !== "object") return {};
  const allowed = new Set(stateKeys ?? []);
  const clean = {};
  for (const [key, value] of Object.entries(patch)) if (allowed.has(key)) clean[key] = value;
  return clean;
}

/**
 * Where a tour should open for a reader who has been here before.
 *
 * A deep link wins: an explicit `?step=` is the reader (or a worksheet) saying where to go. Otherwise the remembered
 * step is used, clamped to the current length — a tour that gained or lost steps must not resume past its end.
 */
export function resumeStep({ urlStep = null, remembered = null, length = 0 } = {}) {
  if (urlStep != null) return clampStep(urlStep, length);
  if (remembered != null) return clampStep(remembered, length);
  return clampStep(1, length);
}

/** The step the runner should show after a move, plus whether the move was possible at all. */
export function moveStep(step, length, direction) {
  const total = Math.max(0, Math.trunc(length) || 0);
  const at = clampStep(step, total);
  if (!at) return { step: 0, moved: false };
  const next = clampStep(at + direction, total);
  return { step: next, moved: next !== at };
}

/**
 * The view and state a whole tour starts from.
 *
 * Used by the launcher: clicking a tour must land on its first step, so the first step's patch (not the step itself)
 * is what the URL carries. A tour whose first step patches nothing leaves the current parameters alone.
 */
export function tourEntry(tour) {
  const plan = stepPlan(tour, 1);
  if (!plan) return null;
  return { view: plan.view, patch: plan.patch, url: plan.url, formulaFocus: plan.formulaFocus, shot: plan.shot };
}

/** A human-readable summary of a patch for the panel ("spin a* = 0.94"), so a step's precondition is visible. */
export function describePatch(patch) {
  const entries = Object.entries(patch ?? {});
  if (entries.length === 0) return "";
  return entries.map(([key, value]) => `${key} = ${String(value)}`).join(" · ");
}
