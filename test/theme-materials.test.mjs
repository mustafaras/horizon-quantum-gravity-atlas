import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { applySceneTheme, bindSceneTheme, THEME_INK } from "../js/render/theme-materials.mjs";
import { parseTokensCss, buildTokens } from "../js/design/tokens.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => fs.readFileSync(path.join(root, ...p), "utf8");
const baseCss = read("styles", "tokens.css");
const tokensOf = (id) => buildTokens(parseTokensCss(baseCss, id === "observatory" ? {} : { theme: id, themeCss: read("styles", "themes", `${id}.css`) }), id);

// A node is just a tagged value here; the factory records the linear colour it was asked for.
const colorNodeFactory = (rgb) => ({ node: "color", rgb: [...rgb] });

function material(kind = "basic", extra = {}) {
  const base = { isNodeMaterial: true, userData: {}, colorNode: { node: "original-color" }, needsUpdate: false, ...extra };
  if (kind === "standard") return { ...base, isMeshStandardNodeMaterial: true, emissiveNode: { node: "original-emissive" } };
  return { ...base, isMeshBasicNodeMaterial: true };
}

function mesh(mat, layer = null, flag = "isMesh") {
  return { [flag]: true, material: mat, visible: true, userData: layer ? { layer } : {}, parent: null, geometry: { id: "geometry" } };
}

function scene(children, background = null) {
  const s = { userData: {}, parent: null, children, background, traverse(fn) { fn(s); children.forEach(fn); } };
  children.forEach((c) => { c.parent = s; });
  return s;
}

const colour = (rgb) => ({ isColor: true, rgb: [...rgb], clone() { return colour(this.rgb); }, fromArray(a) { this.rgb = [...a]; return this; }, copy(o) { this.rgb = [...o.rgb]; return this; } });

test("Blueprint draws model objects in --accent, decoration in faint ink and leaves data alone", () => {
  const T = tokensOf("blueprint");
  const model = mesh(material(), "model");
  const decor = mesh(material(), "decoration", "isLine");
  const data = mesh(material(), "data", "isPoints");
  const untagged = mesh(material());
  const s = scene([model, decor, data, untagged]);

  const r = applySceneTheme(s, "blueprint", { tokens: T, colorNodeFactory });
  assert.deepEqual(r, { restyled: 3, restored: 0, hidden: 0, shown: 0 });
  assert.deepEqual(model.material.colorNode.rgb, [...T.color.accent.linear]);
  assert.deepEqual(decor.material.colorNode.rgb, [...T.color["ink-faint"].linear]);
  assert.deepEqual(untagged.material.colorNode.rgb, [...T.color.ink.linear]);
  assert.deepEqual(data.material.colorNode, { node: "original-color" }, "data keeps the colours that carry its values");
  assert.ok(model.material.needsUpdate, "the material recompiles");
});

test("kit data materials are never restyled, whatever their tag", () => {
  const T = tokensOf("print");
  const heat = mesh(material("basic", { userData: { kit: "field-heatmap" } }), "model");
  const pts = mesh(material("basic", { userData: { kit: "data-points" } }), "model", "isPoints");
  applySceneTheme(scene([heat, pts]), "print", { tokens: T, colorNodeFactory });
  assert.deepEqual(heat.material.colorNode, { node: "original-color" });
  assert.deepEqual(pts.material.colorNode, { node: "original-color" });
});

test("Print hides decoration and draws the rest in --ink", () => {
  const T = tokensOf("print");
  const decor = mesh(material(), "decoration");
  const model = mesh(material(), "model");
  const r = applySceneTheme(scene([decor, model]), "print", { tokens: T, colorNodeFactory });
  assert.equal(r.hidden, 1);
  assert.equal(decor.visible, false);
  assert.deepEqual(decor.material.colorNode, { node: "original-color" }, "a hidden object keeps its material");
  assert.deepEqual(model.material.colorNode.rgb, [...T.color.ink.linear]);
});

test("a lit material becomes unlit: black diffuse, the ink as emission", () => {
  const T = tokensOf("blueprint");
  const lit = mesh(material("standard"), "model");
  applySceneTheme(scene([lit]), "blueprint", { tokens: T, colorNodeFactory });
  assert.deepEqual(lit.material.colorNode.rgb, [0, 0, 0]);
  assert.deepEqual(lit.material.emissiveNode.rgb, [...T.color.accent.linear]);
});

test("Observatory restores every colour node, emission, visibility and the background exactly", () => {
  const T = { print: tokensOf("print"), observatory: tokensOf("observatory") };
  const lit = mesh(material("standard"), "model");
  const decor = mesh(material(), "decoration");
  const originals = { color: lit.material.colorNode, emissive: lit.material.emissiveNode, decorColor: decor.material.colorNode };
  const s = scene([lit, decor], colour([0.01, 0.02, 0.03]));

  applySceneTheme(s, "print", { tokens: T.print, colorNodeFactory });
  assert.deepEqual(s.background.rgb, [...T.print.color["surface-0"].linear]);
  const back = applySceneTheme(s, "observatory", { tokens: T.observatory, colorNodeFactory });
  assert.equal(lit.material.colorNode, originals.color);
  assert.equal(lit.material.emissiveNode, originals.emissive);
  assert.equal(decor.material.colorNode, originals.decorColor);
  assert.equal(decor.visible, true);
  assert.deepEqual(s.background.rgb, [0.01, 0.02, 0.03]);
  assert.deepEqual(back, { restored: 1, restyled: 0, hidden: 0, shown: 1 });
  assert.equal(lit.material.userData.qgaThemeSaved, undefined);
});

test("switching Print to Blueprint shows decoration again and restyles it; saved originals survive the round trip", () => {
  const T = { blueprint: tokensOf("blueprint"), print: tokensOf("print") };
  const decor = mesh(material(), "decoration");
  const original = decor.material.colorNode;
  const s = scene([decor]);
  applySceneTheme(s, "print", { tokens: T.print, colorNodeFactory });
  assert.equal(decor.visible, false);
  applySceneTheme(s, "blueprint", { tokens: T.blueprint, colorNodeFactory });
  assert.equal(decor.visible, true);
  assert.deepEqual(decor.material.colorNode.rgb, [...T.blueprint.color["ink-faint"].linear]);
  applySceneTheme(s, "observatory", { tokens: tokensOf("observatory"), colorNodeFactory });
  assert.equal(decor.material.colorNode, original);
});

test("applying the same theme twice keeps the first saved original", () => {
  const T = tokensOf("blueprint");
  const model = mesh(material(), "model");
  const original = model.material.colorNode;
  const s = scene([model]);
  applySceneTheme(s, "blueprint", { tokens: T, colorNodeFactory });
  applySceneTheme(s, "blueprint", { tokens: T, colorNodeFactory });
  applySceneTheme(s, "observatory", { tokens: tokensOf("observatory"), colorNodeFactory });
  assert.equal(model.material.colorNode, original);
});

test("geometry, material identity and non-node materials are never replaced", () => {
  const T = tokensOf("blueprint");
  const node = mesh(material(), "model");
  const classic = mesh({ isMaterial: true, userData: {}, color: "untouched" }, "model");
  const geometry = node.geometry, mat = node.material;
  applySceneTheme(scene([node, classic]), "blueprint", { tokens: T, colorNodeFactory });
  assert.equal(node.geometry, geometry);
  assert.equal(node.material, mat);
  assert.equal(classic.material.color, "untouched");
});

test("a material array is restyled entry by entry", () => {
  const T = tokensOf("blueprint");
  const multi = mesh([material(), material()], "model");
  const r = applySceneTheme(scene([multi]), "blueprint", { tokens: T, colorNodeFactory });
  assert.equal(r.restyled, 2);
});

test("bindSceneTheme re-applies on qga:theme with the theme in the event, reads fresh tokens, and unsubscribes", () => {
  const model = mesh(material(), "model");
  const s = scene([model]);
  const target = new EventTarget();
  const applied = [];
  const off = bindSceneTheme(s, {
    target, readTheme: () => "observatory", readTokens: () => tokensOf("blueprint"), colorNodeFactory, onApplied: (t) => applied.push(t),
  });
  target.dispatchEvent(new CustomEvent("qga:theme", { detail: { theme: "blueprint" } }));
  assert.deepEqual(applied, ["blueprint"]);
  assert.deepEqual(model.material.colorNode.rgb, [...tokensOf("blueprint").color.accent.linear]);
  off();
  target.dispatchEvent(new CustomEvent("qga:theme", { detail: { theme: "print" } }));
  assert.deepEqual(applied, ["blueprint"]);
});

test("THEME_INK names only tokens that exist in every theme", () => {
  for (const id of ["observatory", "blueprint", "print"]) {
    const T = tokensOf(id);
    for (const [theme, inks] of Object.entries(THEME_INK)) for (const name of Object.values(inks)) {
      if (name !== null) assert.ok(T.color[name], `${theme} uses --${name}, missing in ${id}`);
    }
  }
});
