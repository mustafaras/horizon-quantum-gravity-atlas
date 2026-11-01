// Scene themes (S34). Blueprint and Print draw every three.js scene as engraved, unlit linework: this module swaps the
// colour nodes of the materials a scene already has and never rebuilds a geometry, a material or a pipeline. Observatory
// restores exactly what was saved. It follows the layer classes of scene-layers.mjs:
//
//   data         never touched: a measurement or a tabulated field keeps the colours that carry its values.
//   model        the theme's line colour (--accent in Blueprint, --ink in Print).
//   decoration   Blueprint: faint grid ink. Print: hidden.
//   untagged     --ink, so an object nobody classified still reads on the new surface.
//
// The module is DOM- and GPU-free: the colour node is made by an injected factory (`loadColorNodeFactory` builds the
// TSL one in the browser), and objects are walked through `traverse`, so node:test drives it with plain objects.

import { layerOf } from "./scene-layers.mjs";

const SAVED = "qgaThemeSaved";
const HIDDEN = "qgaThemeHidden";
const DRAWN = ["isMesh", "isLine", "isPoints", "isSprite"];

/** Which token colours a theme uses per layer class; `null` hides the object. Observatory has no entry: it restores. */
export const THEME_INK = Object.freeze({
  blueprint: Object.freeze({ model: "accent", decoration: "ink-faint", untagged: "ink" }),
  print: Object.freeze({ model: "ink", decoration: null, untagged: "ink" }),
});

/** The factory the browser uses: `([r, g, b]) => vec3(r, g, b)` from three/tsl, loaded on first use. */
export async function loadColorNodeFactory() {
  const { vec3 } = await import("three/tsl");
  return ([r, g, b]) => vec3(r, g, b);
}

const asList = (material) => (Array.isArray(material) ? material : material ? [material] : []);
const isDrawn = (object) => DRAWN.some((flag) => object[flag]);
const isData = (material, layer) => layer === "data" || material.userData?.kit === "field-heatmap" || material.userData?.kit === "data-points";

function save(material) {
  if (material.userData[SAVED]) return;
  material.userData[SAVED] = { colorNode: material.colorNode ?? null, emissiveNode: material.emissiveNode ?? null };
}

function restoreMaterial(material) {
  const saved = material.userData?.[SAVED];
  if (!saved) return false;
  material.colorNode = saved.colorNode;
  if ("emissiveNode" in material) material.emissiveNode = saved.emissiveNode;
  delete material.userData[SAVED];
  material.needsUpdate = true;
  return true;
}

function flatten(material, node, black) {
  save(material);
  if (material.isMeshStandardNodeMaterial) {
    // A lit material cannot be made unlit by swapping a node: zero the diffuse and let the ink be its emission.
    material.colorNode = black;
    material.emissiveNode = node;
  } else {
    material.colorNode = node;
  }
  material.needsUpdate = true;
}

/**
 * Put `scene` into `theme`. Returns `{ restyled, restored, hidden, shown }` so a caller (and a test) can see what moved.
 * `tokens` is the frozen token object of the new theme (`readTokens()` after `qga:theme`); `colorNodeFactory` turns a
 * linear `[r, g, b]` into a colour node.
 */
export function applySceneTheme(scene, theme, { tokens, colorNodeFactory }) {
  const result = { restyled: 0, restored: 0, hidden: 0, shown: 0 };
  const inks = THEME_INK[theme] ?? null;
  const nodeCache = new Map();
  const nodeFor = (name) => {
    if (!nodeCache.has(name)) nodeCache.set(name, colorNodeFactory(tokens.color[name].linear));
    return nodeCache.get(name);
  };
  const black = inks ? colorNodeFactory([0, 0, 0]) : null;

  scene.traverse((object) => {
    if (object.userData?.[HIDDEN] !== undefined && (!inks || inks[layerOf(object) ?? "untagged"] !== null)) {
      object.visible = object.userData[HIDDEN];
      delete object.userData[HIDDEN];
      result.shown += 1;
    }
    if (!isDrawn(object)) return;
    const layer = layerOf(object);
    for (const material of asList(object.material)) {
      if (!material?.isNodeMaterial) continue;
      if (!inks) { if (restoreMaterial(material)) result.restored += 1; continue; }
      if (isData(material, layer)) continue;
      const key = layer ?? "untagged";
      const name = inks[key];
      if (name === null) {
        if (object.userData[HIDDEN] === undefined) object.userData[HIDDEN] = object.visible;
        object.visible = false;
        result.hidden += 1;
      } else {
        flatten(material, nodeFor(name), black);
        result.restyled += 1;
      }
    }
  });

  if (scene.background?.isColor) {
    if (inks) {
      scene.userData.qgaThemeBackground ??= scene.background.clone();
      scene.background.fromArray(tokens.color["surface-0"].linear);
    } else if (scene.userData.qgaThemeBackground) {
      scene.background.copy(scene.userData.qgaThemeBackground);
      delete scene.userData.qgaThemeBackground;
    }
  }
  return result;
}

/** Subscribe `scene` to `qga:theme` on `target`; `onApplied` runs after each change (a session invalidates its view). */
export function bindSceneTheme(scene, { target, readTheme, readTokens, colorNodeFactory, onApplied = null }) {
  const handler = (event) => {
    const theme = event?.detail?.theme ?? readTheme();
    applySceneTheme(scene, theme, { tokens: readTokens(), colorNodeFactory });
    onApplied?.(theme);
  };
  target.addEventListener("qga:theme", handler);
  return () => target.removeEventListener("qga:theme", handler);
}
