import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  THEME_IDS, THEME_COLOR, THEME_STORAGE_KEY, resolveInitialTheme, createThemeController,
} from "../js/design/theme.mjs";
import { parseTokensCss } from "../js/design/tokens.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseCss = fs.readFileSync(path.join(root, "styles", "tokens.css"), "utf8");

function fakeDocument(initialTheme = null) {
  const attributes = new Map(initialTheme ? [["data-theme", initialTheme]] : []);
  const meta = { content: "", setAttribute(name, value) { if (name === "content") this.content = value; } };
  const events = new EventTarget();
  return {
    documentElement: { getAttribute: (n) => attributes.get(n) ?? null, setAttribute: (n, v) => attributes.set(n, String(v)) },
    querySelector: (selector) => (selector === 'meta[name="theme-color"]' ? meta : null),
    addEventListener: (...a) => events.addEventListener(...a),
    removeEventListener: (...a) => events.removeEventListener(...a),
    dispatchEvent: (e) => events.dispatchEvent(e),
    meta,
  };
}

const memoryStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), data };
};

test("the initial theme: ?theme= beats the remembered choice, unknown values fall back to Observatory", () => {
  assert.equal(resolveInitialTheme(), "observatory");
  assert.equal(resolveInitialTheme({ stored: "blueprint" }), "blueprint");
  assert.equal(resolveInitialTheme({ search: "?theme=print", stored: "blueprint" }), "print");
  assert.equal(resolveInitialTheme({ search: "?theme=sepia", stored: "blueprint" }), "blueprint");
  assert.equal(resolveInitialTheme({ search: "?theme=sepia", stored: "neon" }), "observatory");
});

test("set() writes the attribute and the meta colour, remembers the choice and dispatches qga:theme once", () => {
  const doc = fakeDocument();
  const storage = memoryStorage();
  const theme = createThemeController({ document: doc, storage });
  const seen = [];
  doc.addEventListener("qga:theme", (e) => seen.push(e.detail));
  assert.equal(theme.get(), "observatory");
  assert.equal(doc.documentElement.getAttribute("data-theme"), "observatory");

  assert.equal(theme.set("blueprint"), "blueprint");
  assert.equal(doc.documentElement.getAttribute("data-theme"), "blueprint");
  assert.equal(doc.meta.content, THEME_COLOR.blueprint);
  assert.equal(storage.data.get(THEME_STORAGE_KEY), "blueprint");
  assert.deepEqual(seen, [{ theme: "blueprint", previous: "observatory" }]);

  theme.set("blueprint");
  assert.equal(seen.length, 1, "setting the active theme again is silent");
  assert.throws(() => theme.set("sepia"), /unknown theme/);
  assert.equal(theme.get(), "blueprint", "a rejected theme changes nothing");
});

test("cycle() visits every theme and returns to the start", () => {
  const theme = createThemeController({ document: fakeDocument() });
  const order = [theme.get(), theme.cycle(), theme.cycle(), theme.cycle()];
  assert.deepEqual(order, ["observatory", "blueprint", "print", "observatory"]);
});

test("a stored theme is applied at start; a document that already carries another one is corrected", () => {
  const doc = fakeDocument("print");
  createThemeController({ document: doc, storage: memoryStorage({ [THEME_STORAGE_KEY]: "blueprint" }) });
  assert.equal(doc.documentElement.getAttribute("data-theme"), "blueprint");
});

test("blocked or throwing storage does not break the controller", () => {
  const hostile = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); } };
  const theme = createThemeController({ document: fakeDocument(), storage: hostile });
  assert.equal(theme.get(), "observatory");
  assert.equal(theme.set("print"), "print");
});

test("printing switches to Print for its duration and restores the reader's theme without storing either", () => {
  const doc = fakeDocument();
  const storage = memoryStorage();
  const target = new EventTarget();
  const theme = createThemeController({ document: doc, storage, target });
  theme.set("blueprint");
  target.dispatchEvent(new Event("beforeprint"));
  assert.equal(doc.documentElement.getAttribute("data-theme"), "print");
  assert.equal(storage.data.get(THEME_STORAGE_KEY), "blueprint", "the remembered choice is not overwritten");
  target.dispatchEvent(new Event("beforeprint"));
  target.dispatchEvent(new Event("afterprint"));
  assert.equal(doc.documentElement.getAttribute("data-theme"), "blueprint");
  assert.equal(theme.get(), "blueprint");
  target.dispatchEvent(new Event("afterprint"));
  assert.equal(theme.get(), "blueprint", "a stray afterprint changes nothing");
  theme.dispose();
  target.dispatchEvent(new Event("beforeprint"));
  assert.equal(theme.get(), "blueprint", "a disposed controller no longer listens");
});

test("createThemeController needs a document", () => {
  assert.throws(() => createThemeController({}), TypeError);
});

test("THEME_COLOR equals each theme's --surface-0", () => {
  for (const id of THEME_IDS) {
    const css = id === "observatory" ? "" : fs.readFileSync(path.join(root, "styles", "themes", `${id}.css`), "utf8");
    const values = parseTokensCss(baseCss, id === "observatory" ? {} : { theme: id, themeCss: css });
    assert.equal(values["--surface-0"], THEME_COLOR[id], id);
  }
});

test("index.html loads the three theme sheets after the tokens and applies a saved theme before first paint", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const order = ["styles/tokens.css", "styles/themes/observatory.css", "styles/themes/blueprint.css", "styles/themes/print.css", "styles/base.css"].map((s) => html.indexOf(`href="${s}"`));
  assert.ok(order.every((i) => i >= 0), "all five sheets are linked");
  assert.deepEqual(order, [...order].sort((a, b) => a - b), "tokens, then themes, then the rest");
  const early = html.indexOf('localStorage.getItem("qga-theme")');
  assert.ok(early > order[0] && early < order[4], "the early script runs before base.css");
});
