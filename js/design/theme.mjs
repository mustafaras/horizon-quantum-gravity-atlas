// Theme runtime (S34): which of the three themes is active, how the choice is remembered, and the `qga:theme` event
// that tells canvas figures, tokens and three.js scenes to repaint. The colours themselves live in styles/themes/*.css;
// this module only flips `<html data-theme>`.
//
//   const theme = createThemeController({ document, storage: localStorage, search: location.search, target: window });
//   theme.get();            // "observatory" | "blueprint" | "print"
//   theme.set("blueprint"); // sets the attribute, remembers the choice, dispatches `qga:theme` on document
//
// Printing always uses Print: `beforeprint` switches to it for the duration and `afterprint` restores the reader's
// theme without touching the remembered choice. Every dependency is injected, so the module runs in Node tests.

import { THEME_IDS, DEFAULT_THEME } from "./theme-pigments.mjs";

export { THEME_IDS, DEFAULT_THEME };

export const THEME_STORAGE_KEY = "qga-theme";
export const THEME_LABELS = Object.freeze({ observatory: "Observatory", blueprint: "Blueprint", print: "Print" });
/** Browser chrome colour per theme (the `theme-color` meta tag); each equals that theme's `--surface-0`. */
export const THEME_COLOR = Object.freeze({ observatory: "#05080f", blueprint: "#002b4a", print: "#ffffff" });

/** `?theme=` wins over the remembered choice, which wins over the default; unknown values are ignored. */
export function resolveInitialTheme({ search = "", stored = null } = {}) {
  const fromUrl = new URLSearchParams(search).get("theme");
  for (const candidate of [fromUrl, stored]) if (THEME_IDS.includes(candidate)) return candidate;
  return DEFAULT_THEME;
}

function readStored(storage) {
  try { return storage?.getItem(THEME_STORAGE_KEY) ?? null; } catch { return null; }
}

function writeStored(storage, id) {
  try { storage?.setItem(THEME_STORAGE_KEY, id); } catch { /* private window or blocked storage: the choice lasts for this page only */ }
}

export function createThemeController({ document: doc, storage = null, search = "", target = null } = {}) {
  if (!doc?.documentElement) throw new TypeError("createThemeController needs a document");
  const root = doc.documentElement;
  let current = resolveInitialTheme({ search, stored: readStored(storage) });
  let beforePrint = null;

  function paint(id, previous) {
    root.setAttribute("data-theme", id);
    const meta = doc.querySelector?.('meta[name="theme-color"]');
    meta?.setAttribute("content", THEME_COLOR[id]);
    doc.dispatchEvent(new CustomEvent("qga:theme", { detail: { theme: id, previous } }));
  }

  function set(id, { persist = true } = {}) {
    if (!THEME_IDS.includes(id)) throw new RangeError(`theme: unknown theme "${id}" (${THEME_IDS.join(", ")})`);
    if (id === current && root.getAttribute("data-theme") === id) return current;
    const previous = current;
    current = id;
    if (persist) writeStored(storage, id);
    paint(id, previous);
    return current;
  }

  const onBeforePrint = () => {
    if (beforePrint !== null) return;
    beforePrint = current;
    set("print", { persist: false });
  };
  const onAfterPrint = () => {
    if (beforePrint === null) return;
    const restore = beforePrint;
    beforePrint = null;
    set(restore, { persist: false });
  };
  target?.addEventListener?.("beforeprint", onBeforePrint);
  target?.addEventListener?.("afterprint", onAfterPrint);

  // The first paint already carried the attribute from index.html; keep the document and the controller in step.
  if (root.getAttribute("data-theme") !== current) root.setAttribute("data-theme", current);
  doc.querySelector?.('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[current]);

  return Object.freeze({
    get: () => current,
    set,
    cycle: () => set(THEME_IDS[(THEME_IDS.indexOf(current) + 1) % THEME_IDS.length]),
    ids: THEME_IDS,
    labels: THEME_LABELS,
    dispose() {
      target?.removeEventListener?.("beforeprint", onBeforePrint);
      target?.removeEventListener?.("afterprint", onAfterPrint);
    },
  });
}
