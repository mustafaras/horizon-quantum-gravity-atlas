// Layer classes of scene objects (S11). A scene tags what it draws as `data` (measured or tabulated), `model` (computed
// from the stated equations) or `decoration` (no quantity). The scientific mode hides decoration and touches nothing else,
// so the pixels of every model and data object are the same in every mode. Pure: it only reads `userData`, `visible`
// and `traverse`, so it runs in Node on plain objects.

import { SCIENTIFIC_LAYER_CLASSES } from "../science/contracts.mjs";

const HIDDEN_BY_LAYER = "layerHidden";
const DRAWN = ["isMesh", "isLine", "isPoints", "isSprite"];

export function tagLayer(object, layerClass) {
  if (!SCIENTIFIC_LAYER_CLASSES.includes(layerClass)) {
    throw new TypeError(`layer class must be one of: ${SCIENTIFIC_LAYER_CLASSES.join(", ")}`);
  }
  object.userData.layer = layerClass;
  return object;
}

const ownLayer = (object) => object.userData?.layer ?? object.userData?.engraved?.layer ?? null;

/** The class of an object: its own tag, else that of the nearest tagged ancestor, else null. */
export function layerOf(object) {
  for (let node = object; node; node = node.parent) {
    const own = ownLayer(node);
    if (own) return own;
  }
  return null;
}

/** Hides decoration in the scientific mode and restores exactly what it hid in any other mode. Returns the count hidden. */
export function applyLayerMode(root, mode) {
  let hidden = 0;
  root.traverse((object) => {
    if (ownLayer(object) !== "decoration") return;
    if (mode === "scientific") {
      if (object.userData[HIDDEN_BY_LAYER] === undefined) object.userData[HIDDEN_BY_LAYER] = object.visible;
      object.visible = false;
      hidden += 1;
    } else if (object.userData[HIDDEN_BY_LAYER] !== undefined) {
      object.visible = object.userData[HIDDEN_BY_LAYER];
      delete object.userData[HIDDEN_BY_LAYER];
    }
  });
  return hidden;
}

/** Drawn objects (mesh, line, points, sprite) that carry no class themselves or through an ancestor. */
export function untaggedObjects(root) {
  const found = [];
  root.traverse((object) => {
    if (DRAWN.some((flag) => object[flag]) && layerOf(object) === null) found.push(object);
  });
  return found;
}
