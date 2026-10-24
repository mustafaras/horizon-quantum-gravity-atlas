/*
 * Formula Lens, field half (S10): paint a formula term over a surface, computed on the GPU from the formula's own AST.
 *
 * The term is compiled once, at scene build time, by compileTSL into a node graph that reads the scene's nodes
 * (uniforms, positions) through the declared bindings, then through the kit's field heat map into a colour. That
 * colour is mixed into the surface's colour node behind a uniform. Showing the field is `uniform.value = 1` and
 * hiding it `= 0`: the material is never touched again, so nothing recompiles, and with the uniform at exactly 0
 * the mix returns the original colour, so the pixels equal the ones drawn without a lens.
 *
 * Loaded on demand (dynamic import) because it pulls in three/tsl and the material kit.
 */

import * as TSL from "three/tsl";
import { compileTSL } from "../../formula/to-tsl.mjs";
import { termExpr, termSymbols } from "../../formula/lens.mjs";
import { fieldMaterial } from "../../render/materials/index.mjs";

const GEOMETRIC_CONSTANT = 1;

function resolveBindings(sceneId, termId, target, constants, nodes) {
  const bindings = {};
  for (const [name, binding] of Object.entries(target.bindings)) {
    if (typeof binding === "number") { bindings[name] = binding; continue; }
    const node = nodes[binding.node];
    if (!node?.isNode) throw new ReferenceError(`term lens: scene ${sceneId} provides no node "${binding.node}" for ${name} of term ${termId}`);
    bindings[name] = node;
  }
  for (const name of constants) if (!(name in bindings)) bindings[name] = GEOMETRIC_CONSTANT;
  return bindings;
}

/**
 * Wrap `surface.material.colorNode` (a vec4 node) with the term's field. Returns the uniform that shows it, the
 * palette texture, and the function that restores the material.
 */
export function buildFieldLayer({ sceneId, formula, termId, target, surface, nodes }) {
  const material = surface.material;
  if (!material?.colorNode?.isNode) throw new TypeError(`term lens: surface "${target.surfaceName}" needs a node material with a colorNode`);
  const bindings = resolveBindings(sceneId, termId, target, termSymbols(formula, termId).constants, nodes);
  const { node } = compileTSL(termExpr(formula, termId), TSL, bindings);
  const kit = fieldMaterial({
    valueNode: node, range: target.range, palette: target.palette ?? "sequential", paletteName: target.paletteName ?? "viridis",
  });
  const color = kit.colorNode.rgb;
  const palette = kit.userData.fieldPalette;
  kit.dispose();

  const state = material.userData.termLens ?? (material.userData.termLens = { base: material.colorNode, uniforms: {}, palette: {} });
  const mix = TSL.uniform(0);
  material.colorNode = TSL.mix(material.colorNode, TSL.vec4(color, 1), mix);
  material.needsUpdate = true;
  state.uniforms[termId] = mix;
  state.palette[termId] = palette;

  return {
    uniform: mix,
    restore() {
      if (material.userData.termLens === state) {
        material.colorNode = state.base;
        material.needsUpdate = true;
        delete material.userData.termLens;
      }
      palette.dispose();
    },
  };
}
