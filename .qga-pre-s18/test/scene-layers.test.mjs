import test from "node:test";
import assert from "node:assert/strict";

import { tagLayer, layerOf, applyLayerMode, untaggedObjects } from "../js/render/scene-layers.mjs";

function node(props = {}, children = []) {
  const self = { visible: true, userData: {}, children, parent: null, ...props };
  children.forEach((child) => { child.parent = self; });
  self.traverse = (visit) => { visit(self); self.children.forEach((child) => child.traverse(visit)); };
  return self;
}

test("tagLayer stores the class on userData and returns the object", () => {
  const object = node();
  assert.equal(tagLayer(object, "decoration"), object);
  assert.equal(layerOf(object), "decoration");
});

test("tagLayer rejects an unknown class", () => {
  assert.throws(() => tagLayer(node(), "overlay"), /layer class/);
});

test("layerOf inherits the class of the nearest tagged ancestor", () => {
  const leaf = node({ isMesh: true });
  const group = tagLayer(node({}, [leaf]), "model");
  assert.equal(layerOf(leaf), "model");
  assert.equal(layerOf(group), "model");
  assert.equal(layerOf(node()), null);
});

test("scientific mode hides decoration and leaves model and data objects alone", () => {
  const stars = tagLayer(node({ isPoints: true }), "decoration");
  const curve = tagLayer(node({ isLine: true }), "model");
  const samples = tagLayer(node({ isPoints: true }), "data");
  const root = node({}, [stars, curve, samples]);
  applyLayerMode(root, "scientific");
  assert.deepEqual([stars.visible, curve.visible, samples.visible], [false, true, true]);
});

test("leaving scientific mode restores what was visible before, not everything", () => {
  const shown = tagLayer(node(), "decoration");
  const alreadyHidden = tagLayer(node({ visible: false }), "decoration");
  const root = node({}, [shown, alreadyHidden]);
  applyLayerMode(root, "scientific");
  applyLayerMode(root, "cinematic");
  assert.deepEqual([shown.visible, alreadyHidden.visible], [true, false]);
});

test("applying scientific mode twice keeps the original visibility", () => {
  const decoration = tagLayer(node(), "decoration");
  const root = node({}, [decoration]);
  applyLayerMode(root, "scientific");
  applyLayerMode(root, "scientific");
  applyLayerMode(root, "minimal");
  assert.equal(decoration.visible, true);
});

test("untaggedObjects lists drawn objects with no class on themselves or an ancestor", () => {
  const tagged = tagLayer(node({ isMesh: true, name: "a" }), "model");
  const inherited = node({ isMesh: true, name: "b" });
  tagLayer(node({}, [inherited]), "decoration");
  const bare = node({ isLine: true, name: "c" });
  const light = node({ isLight: true, name: "d" });
  const root = node({ isScene: true }, [tagged, bare, light]);
  assert.deepEqual(untaggedObjects(root).map((object) => object.name), ["c"]);
});

test("an engraved line carries its class in userData.engraved and counts as tagged", () => {
  const line = node({ isLine: true, userData: { engraved: { layer: "decoration" } } });
  const root = node({ isScene: true }, [line]);
  assert.deepEqual(untaggedObjects(root), []);
  applyLayerMode(root, "scientific");
  assert.equal(line.visible, false);
});
