/*
 * Formula Lens, scene half (S10): focusing a term of a typeset formula highlights its counterpart in a scene.
 *
 * A scene calls createTermLens() while it builds. The lens binds the scene's term targets into the Formula Lens
 * registry (js/formula/lens.mjs), builds everything it can show up front, and then only toggles visibility and
 * one uniform per term as `formula-term` and `formula-clear` events arrive on the ConceptBus:
 *
 *   object targets  an engraved outline (focal width, halo, --ink-strong) around the object, or a highlighted
 *                   label, plus an optional in-canvas note
 *   field targets   the term painted over a surface as a heat map, with a legend (term TeX, colour bar, range, unit)
 *
 * The highlight is static: nothing pulses or animates, so reduced motion needs no special case. The scene is
 * rendered on demand, so every change asks for one frame through ctx.invalidate().
 */

import { lens as sharedRegistry } from "../../formula/lens.mjs";
import { ENGRAVED_HALO_MAX } from "./engraved-lines.mjs";
import { createLensLegend, legendModel } from "./term-lens-legend.mjs";

const OUTLINE_COLOR = "ink-strong";
const LABEL_ON_CLASS = "s3d-lens-on";
const ORIGIN = () => ({ x: 0, y: 0, z: 0 });

function outlineGroup(ctx, name, spec) {
  const group = new ctx.THREE.Group();
  group.name = name;
  group.visible = false;
  for (const polyline of spec.outline) {
    group.add(ctx.engraved.line(polyline, {
      color: OUTLINE_COLOR, widthPx: ctx.engraved.WIDTH_PX.focal, halo: ENGRAVED_HALO_MAX, layer: "decoration",
    }));
  }
  (spec.parent ?? ctx.scene).add(group);
  return group;
}

/** Show/hide pair for an object target: its outline group, its label and its note, each optional. */
function objectEntry(ctx, termId, objectName, spec) {
  if (!spec) throw new ReferenceError(`term lens: the scene has no object "${objectName}" for term ${termId}`);
  if (!spec.outline && !spec.label) throw new TypeError(`term lens: object "${objectName}" needs an outline or a label`);
  const group = spec.outline ? outlineGroup(ctx, `term-lens:${termId}`, spec) : null;
  const note = spec.note ? ctx.annotation(spec.note, spec.notePosition ?? ORIGIN) : null;
  note?.setShow(false);
  const label = spec.label ?? null;
  label?.setShow(false);
  return {
    kind: "object",
    show() {
      spec.onActivate?.();
      if (group) group.visible = true;
      note?.setShow(true);
      label?.el?.classList.add(LABEL_ON_CLASS);
      label?.setShow(true);
    },
    hide() {
      if (group) group.visible = false;
      note?.setShow(false);
      label?.el?.classList.remove(LABEL_ON_CLASS);
      label?.setShow(false);
    },
    dispose() { group?.removeFromParent(); },
  };
}

/** Show/hide pair for a field target: the prebuilt mix uniform and the legend. */
function fieldEntry(layer, legend) {
  return {
    kind: "field",
    show() { layer.uniform.value = 1; legend?.show(); },
    hide() { layer.uniform.value = 0; legend?.hide(); },
    dispose() { layer.restore(); legend?.dispose(); },
  };
}

/**
 * @param sceneId     stable id of the scene ("gr-curvature-engine")
 * @param formulaId   id of a Formula Core formula the scene links to
 * @param termTargets { termId: { kind: "object", objectName } | { kind: "field", surfaceName, range, bindings } }
 * @param live        (termId) => ({ env, unit? }): the scene's live parameters, for the value of a focused term
 * @param ctx         Scene3D build context ({ THREE, scene, engraved, annotation, invalidate, mountOverlay? })
 * @param objects     objectName -> { outline: [flat xyz polyline], parent?, label?, note?, notePosition?, onActivate? }
 * @param surfaces    surfaceName -> Mesh with a node material whose colorNode is a vec4
 * @param nodes       name -> TSL node the field bindings refer to ({ node: "name" })
 * @param legendNote  what the scene says about the field's scale (it must say "schematic" when it is)
 */
export async function createTermLens({
  sceneId, formulaId, termTargets, live, ctx, objects = {}, surfaces = {}, nodes = {}, legendNote = "",
  bus = globalThis.QGA_CONCEPT_BUS, registry = sharedRegistry,
}) {
  if (!bus || typeof bus.on !== "function") throw new TypeError("createTermLens: bus (the ConceptBus) is required");
  const unbind = registry.bindScene(sceneId, formulaId, { termTargets, live });
  const entries = new Map();
  let offTerm = null, offClear = null, active = null, disposed = false;

  const teardown = () => {
    offTerm?.(); offClear?.();
    entries.forEach((entry) => entry.dispose());
    entries.clear();
    unbind();
  };

  try {
    const formula = registry.formula(formulaId);
    const targets = registry.binding(formulaId).termTargets;
    const field = Object.values(targets).some((target) => target.kind === "field")
      ? await import("./term-lens-field.mjs")
      : null;
    for (const [termId, target] of Object.entries(targets)) {
      if (target.kind === "object") {
        entries.set(termId, objectEntry(ctx, termId, target.objectName, objects[target.objectName]));
        continue;
      }
      const surface = surfaces[target.surfaceName];
      if (!surface) throw new ReferenceError(`term lens: the scene has no surface "${target.surfaceName}" for term ${termId}`);
      const layer = field.buildFieldLayer({ sceneId, formula, termId, target, surface, nodes });
      let legend = null;
      if (typeof ctx.mountOverlay === "function" && globalThis.document) {
        legend = createLensLegend({ document: globalThis.document, model: legendModel({ formula, termId, target, note: legendNote }) });
        ctx.mountOverlay(legend.element);
      }
      entries.set(termId, fieldEntry(layer, legend));
    }
  } catch (error) {
    teardown();
    throw error;
  }

  const publishState = (termId) => {
    globalThis.__qgaTermLens = termId === null ? null : { sceneId, formulaId, termId, kind: entries.get(termId).kind };
  };

  function clear() {
    if (active === null) return;
    entries.get(active).hide();
    active = null;
    publishState(null);
    ctx.invalidate();
  }

  function activate(termId) {
    if (disposed || active === termId) return;
    const entry = entries.get(termId);
    if (!entry) { clear(); return; }
    if (active !== null) entries.get(active).hide();
    entry.show();
    active = termId;
    publishState(termId);
    ctx.invalidate();
  }

  offTerm = bus.on("formula-term", (payload) => { if (payload.formulaId === formulaId) activate(payload.termId); });
  offClear = bus.on("formula-clear", () => { if (!disposed) clear(); });

  return Object.freeze({
    activate,
    clear,
    get active() { return active; },
    dispose() {
      if (disposed) return;
      clear();
      disposed = true;
      teardown();
    },
  });
}
