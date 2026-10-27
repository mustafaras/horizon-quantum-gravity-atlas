/*
 * Formula terms (S10): the glue between a typeset Formula Core equation and the ConceptBus.
 *
 * createTermController() is the behaviour, free of the DOM and covered in Node: hover or focus on a term
 * publishes `formula-term` (its live value and unit), leaving publishes `formula-clear`, and activating a term
 * (click, Enter, Space) pins it so the highlight stays while the pointer is elsewhere; Escape drops the pin.
 *
 * attachFormulaTerms() applies it to the `[data-term]` elements KaTeX renders for \htmlData: it makes each one
 * focusable with an accessible name and listens by delegation, so a re-render of the equation needs no rewiring.
 */

import { lens as sharedRegistry, formatTermValue, termLabel } from "../formula/lens.mjs";

const NO_UNIT = "1";

export function createTermController({ formula, registry = sharedRegistry, bus, onReadout = () => {} }) {
  if (!bus || typeof bus.publish !== "function") throw new TypeError("createTermController: bus (the ConceptBus) is required");
  let hovered = null, pinned = null, shown = null, disposed = false;

  const hide = (reason) => {
    if (shown === null) return;
    shown = null;
    bus.publish("formula-clear", { reason });
    onReadout(null);
  };

  function show(termId) {
    if (shown === termId) return;
    const event = registry.termEvent(formula.id, termId);
    if (!event) { hide("blur"); onReadout(null); return; }
    shown = termId;
    bus.publish("formula-term", event);
    onReadout({ termId, label: termLabel(formula, termId), value: formatTermValue(event.value), unit: event.unit === NO_UNIT ? "" : event.unit });
  }

  /** What should be on display now: the hovered or focused term, else the pinned one, else nothing. */
  const settle = (reason) => {
    const wanted = hovered ?? pinned;
    if (wanted === null) hide(reason); else show(wanted);
  };

  const known = (termId) => formula.termIds.includes(termId);

  return {
    enter(termId) { if (disposed || !known(termId)) return; hovered = termId; settle("blur"); },
    leave(termId) { if (disposed) return; if (hovered === termId) hovered = null; settle("blur"); },
    toggle(termId) {
      if (disposed || !known(termId)) return false;
      pinned = pinned === termId ? null : termId;
      settle("blur");
      return pinned === termId;
    },
    escape() { if (disposed) return; pinned = null; hovered = null; hide("escape"); },
    dispose() { if (disposed) return; pinned = null; hovered = null; hide("navigation"); disposed = true; },
    get shown() { return shown; },
    get pinned() { return pinned; },
  };
}

const termOf = (node) => node?.closest?.("[data-term]") ?? null;

/** Make the terms of `container` interactive. Returns the function that detaches everything. */
export function attachFormulaTerms({ container, formula, registry = sharedRegistry, bus = globalThis.QGA_CONCEPT_BUS, onReadout }) {
  const controller = createTermController({ formula, registry, bus, onReadout });
  const terms = () => [...container.querySelectorAll("[data-term]")];
  const idOf = (node) => termOf(node)?.getAttribute("data-term") ?? null;

  const syncPressed = () => terms().forEach((el) => el.setAttribute("aria-pressed", String(el.getAttribute("data-term") === controller.pinned)));
  const decorate = () => {
    for (const el of terms()) {
      const id = el.getAttribute("data-term");
      if (!formula.termIds.includes(id) || el.hasAttribute("data-term-ready")) continue;
      el.setAttribute("data-term-ready", "");
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", termLabel(formula, id));
      el.setAttribute("aria-pressed", "false");
      el.classList.add("fc-term");
    }
  };

  const on = {
    focusin: (e) => { const id = idOf(e.target); if (id) controller.enter(id); },
    focusout: (e) => { const id = idOf(e.target); if (id) controller.leave(id); },
    mouseover: (e) => { const id = idOf(e.target); if (id) controller.enter(id); },
    mouseout: (e) => { const id = idOf(e.target); if (id) controller.leave(id); },
    click: (e) => { const id = idOf(e.target); if (id) { controller.toggle(id); syncPressed(); } },
    keydown: (e) => {
      const id = idOf(e.target);
      if (e.key === "Escape") { controller.escape(); syncPressed(); return; }
      if (id && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); controller.toggle(id); syncPressed(); }
    },
  };
  for (const [type, handler] of Object.entries(on)) container.addEventListener(type, handler);
  decorate();
  const observer = new MutationObserver(() => { decorate(); syncPressed(); });
  observer.observe(container, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    for (const [type, handler] of Object.entries(on)) container.removeEventListener(type, handler);
    controller.dispose();
  };
}
