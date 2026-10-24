import test from "node:test";
import assert from "node:assert/strict";
import { Group, Mesh, Object3D, PlaneGeometry } from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { float, length, max, positionLocal, uniform, vec4 } from "three/tsl";

import { library } from "../js/formula/library/index.mjs";
import { createLensRegistry } from "../js/formula/lens.mjs";
import { createConceptBus } from "../js/linking/concept-bus.mjs";
import { createTermLens } from "../js/visualizations/common/term-lens.mjs";
import { legendModel } from "../js/visualizations/common/term-lens-legend.mjs";

const { schwarzschildRadius, newtonianPotential } = library;

/* A scene context with just what the lens uses; engraved lines are recorded instead of drawn. */
function fakeCtx() {
  const made = { lines: [], labels: [] };
  const ctx = {
    THREE: { Group },
    scene: new Group(),
    invalidations: 0,
    invalidate() { ctx.invalidations += 1; },
    engraved: {
      WIDTH_PX: { focal: 2.5 },
      line(points, options) {
        const line = new Object3D();
        line.userData.engraved = { points, ...options };
        made.lines.push(line);
        return line;
      },
    },
    annotation(text, position) {
      const handle = { text, position, shown: true, setShow(value) { handle.shown = value; } };
      made.labels.push(handle);
      return handle;
    },
  };
  return { ctx, made };
}

const classList = () => {
  const set = new Set();
  return { add: (c) => set.add(c), remove: (c) => set.delete(c), contains: (c) => set.has(c) };
};
const ring = (n = 8) => Float32Array.from({ length: (n + 1) * 3 }, (_, i) => {
  const angle = (Math.floor(i / 3) / n) * 2 * Math.PI;
  return i % 3 === 0 ? Math.cos(angle) : i % 3 === 1 ? Math.sin(angle) : 0;
});
const rsTargets = { r_s: { kind: "object", objectName: "horizon" }, M: { kind: "object", objectName: "mass-readout" } };

async function objectSetup() {
  const bus = createConceptBus({ diagnostic() {} });
  const registry = createLensRegistry({ diagnostic() {} });
  const { ctx, made } = fakeCtx();
  const readout = { el: { classList: classList() }, shown: false, setShow(v) { readout.shown = v; }, set(t) { readout.text = t; } };
  const activations = [];
  const lensHandle = await createTermLens({
    sceneId: "kerr", formulaId: "schwarzschild-radius", termTargets: rsTargets,
    live: () => ({ env: { M: 1.989e31 } }),
    ctx, bus, registry,
    objects: {
      horizon: { outline: [ring()], note: "r_s = 2GM/c² (coordinate radius)", notePosition: () => ({ x: 0, y: 0, z: 0 }) },
      "mass-readout": { label: readout, onActivate: () => activations.push("M") },
    },
  });
  return { bus, registry, ctx, made, readout, activations, lensHandle };
}

/* ---------- object targets ---------- */

test("an object target gets an engraved outline: focal width, halo, ink-strong, decoration layer, hidden until its term is focused", async () => {
  const { made, ctx } = await objectSetup();
  assert.equal(made.lines.length, 1);
  const options = made.lines[0].userData.engraved;
  assert.equal(options.color, "ink-strong");
  assert.equal(options.widthPx, 2.5);
  assert.equal(options.halo, 0.12);
  assert.equal(options.layer, "decoration");
  assert.equal(made.lines[0].parent.visible, false, "the outline group starts hidden");
  assert.equal(ctx.scene.children.includes(made.lines[0].parent), true);
  assert.equal(made.labels[0].shown, false, "the note starts hidden");
});

test("a formula-term event shows the outline and the in-canvas note; formula-clear hides both and restores the scene", async () => {
  const { bus, made, ctx, lensHandle } = await objectSetup();
  const group = made.lines[0].parent;
  bus.publish("formula-term", { formulaId: "schwarzschild-radius", termId: "r_s", value: 2953, unit: "m" });
  assert.equal(group.visible, true);
  assert.equal(made.labels[0].shown, true);
  assert.equal(lensHandle.active, "r_s");
  assert.ok(ctx.invalidations >= 1, "the on-demand renderer is asked for a frame");
  bus.publish("formula-clear", { reason: "blur" });
  assert.equal(group.visible, false);
  assert.equal(made.labels[0].shown, false);
  assert.equal(lensHandle.active, null);
});

test("events for another formula, an unbound term or after dispose change nothing", async () => {
  const { bus, made, lensHandle, registry } = await objectSetup();
  const group = made.lines[0].parent;
  bus.publish("formula-term", { formulaId: "planck-length", termId: "hbar", value: 1, unit: "J s" });
  bus.publish("formula-term", { formulaId: "schwarzschild-radius", termId: "nope", value: 1, unit: "m" });
  assert.equal(group.visible, false);
  assert.equal(lensHandle.active, null);
  lensHandle.dispose();
  assert.equal(bus.subscriberCount("formula-term"), 0);
  assert.equal(bus.subscriberCount("formula-clear"), 0);
  assert.equal(registry.binding("schwarzschild-radius"), null, "dispose unbinds the scene");
  assert.equal(group.parent, null, "dispose removes the outline");
  bus.publish("formula-term", { formulaId: "schwarzschild-radius", termId: "r_s", value: 1, unit: "m" });
  assert.equal(group.visible, false);
});

test("a label object toggles with its term and runs onActivate (live text) before it is shown", async () => {
  const { bus, readout, activations } = await objectSetup();
  bus.publish("formula-term", { formulaId: "schwarzschild-radius", termId: "M", value: 1.989e31, unit: "kg" });
  assert.equal(readout.shown, true);
  assert.equal(readout.el.classList.contains("s3d-lens-on"), true);
  assert.deepEqual(activations, ["M"]);
  bus.publish("formula-clear", { reason: "blur" });
  assert.equal(readout.shown, false);
  assert.equal(readout.el.classList.contains("s3d-lens-on"), false);
});

test("moving from one term to another swaps the highlight, and repeating a term is a no-op", async () => {
  const { bus, made, readout, ctx } = await objectSetup();
  const group = made.lines[0].parent;
  bus.publish("formula-term", { formulaId: "schwarzschild-radius", termId: "r_s", value: 1, unit: "m" });
  const frames = ctx.invalidations;
  bus.publish("formula-term", { formulaId: "schwarzschild-radius", termId: "r_s", value: 1, unit: "m" });
  assert.equal(ctx.invalidations, frames, "same term: no extra frame");
  bus.publish("formula-term", { formulaId: "schwarzschild-radius", termId: "M", value: 1, unit: "kg" });
  assert.equal(group.visible, false);
  assert.equal(readout.shown, true);
});

test("the dev diagnostic names the active term for the QA suite and clears with it", async () => {
  const { bus } = await objectSetup();
  bus.publish("formula-term", { formulaId: "schwarzschild-radius", termId: "r_s", value: 1, unit: "m" });
  assert.deepEqual({ ...globalThis.__qgaTermLens }, { sceneId: "kerr", formulaId: "schwarzschild-radius", termId: "r_s", kind: "object" });
  bus.publish("formula-clear", { reason: "blur" });
  assert.equal(globalThis.__qgaTermLens, null);
});

test("construction fails fast on a declaration the scene cannot satisfy", async () => {
  const bus = createConceptBus({ diagnostic() {} });
  const registry = createLensRegistry({ diagnostic() {} });
  const { ctx } = fakeCtx();
  const base = { sceneId: "kerr", formulaId: "schwarzschild-radius", termTargets: rsTargets, ctx, bus, registry };
  await assert.rejects(createTermLens({ ...base, objects: { horizon: { outline: [ring()] } } }), { name: "ReferenceError", message: /mass-readout/ });
  assert.equal(registry.binding("schwarzschild-radius"), null, "a failed construction leaves nothing bound");
  await assert.rejects(createTermLens({ ...base, objects: { horizon: {}, "mass-readout": { outline: [ring()] } } }), { message: /horizon.*outline or a label/ });
  await assert.rejects(createTermLens({ ...base, bus: undefined, objects: {} }), { name: "TypeError", message: /bus/ });
});

/* ---------- field targets ---------- */

const geometry = new PlaneGeometry(4, 4, 2, 2);
async function fieldSetup({ nodes } = {}) {
  const bus = createConceptBus({ diagnostic() {} });
  const registry = createLensRegistry({ diagnostic() {} });
  const { ctx } = fakeCtx();
  const material = new MeshBasicNodeMaterial();
  material.colorNode = vec4(0.25, 0.5, 0.75, 1);
  const base = material.colorNode;
  const mesh = new Mesh(geometry, material);
  const uMass = uniform(2.75);
  const lensHandle = await createTermLens({
    sceneId: "gr", formulaId: "newtonian-potential",
    termTargets: { phi: { kind: "field", surfaceName: "well", range: [-5.5, 0], bindings: { M: { node: "mass" }, r: { node: "radius" } } } },
    live: () => ({ env: newtonianPotential.geometric({ M: 2.75, r: 4 }), unit: "1" }),
    ctx, bus, registry,
    surfaces: { well: mesh },
    nodes: nodes ?? { mass: uMass, radius: max(length(positionLocal.xz), float(1)) },
  });
  return { bus, registry, material, base, lensHandle, uMass };
}

test("a field target prebuilds the term node into the surface colour node behind a zero mix uniform", async () => {
  const { material, base } = await fieldSetup();
  assert.notEqual(material.colorNode, base, "the colour node was wrapped at build time");
  assert.equal(material.colorNode.isNode, true);
  const mix = material.userData.termLens.uniforms.phi;
  assert.equal(mix.value, 0, "off by default: the surface is unchanged");
});

test("focusing a field term toggles one uniform and never touches the material version (no recompilation)", async () => {
  const { bus, material, lensHandle } = await fieldSetup();
  const mix = material.userData.termLens.uniforms.phi;
  const version = material.version;
  bus.publish("formula-term", { formulaId: "newtonian-potential", termId: "phi", value: -0.6875, unit: "1" });
  assert.equal(mix.value, 1);
  assert.equal(lensHandle.active, "phi");
  bus.publish("formula-clear", { reason: "blur" });
  assert.equal(mix.value, 0, "blur restores exactly zero, so the pixels are the original ones");
  bus.publish("formula-term", { formulaId: "newtonian-potential", termId: "phi", value: -0.6875, unit: "1" });
  bus.publish("formula-clear", { reason: "blur" });
  assert.equal(material.version, version, "a uniform write is not a material update");
});

test("dispose restores the original colour node and releases the palette texture", async () => {
  const { material, base, lensHandle } = await fieldSetup();
  const lut = material.userData.termLens.palette.phi;
  let disposed = 0;
  lut.addEventListener("dispose", () => { disposed += 1; });
  lensHandle.dispose();
  assert.equal(material.colorNode, base);
  assert.equal(material.userData.termLens, undefined);
  assert.equal(disposed, 1);
});

test("a field binding to a node the scene does not provide, or a missing surface, is a construction error", async () => {
  await assert.rejects(fieldSetup({ nodes: { mass: uniform(1) } }), { name: "ReferenceError", message: /radius/ });
  const bus = createConceptBus({ diagnostic() {} });
  const { ctx } = fakeCtx();
  await assert.rejects(createTermLens({
    sceneId: "gr", formulaId: "newtonian-potential", ctx, bus, registry: createLensRegistry({ diagnostic() {} }),
    termTargets: { phi: { kind: "field", surfaceName: "well", range: [-1, 0], bindings: { M: 1, r: 1 } } },
    surfaces: {}, nodes: {},
  }), { name: "ReferenceError", message: /surface "well"/ });
});

test("the field is evaluated on the GPU from the formula's own AST: the graph holds the supplied uniform and the mix uniform", async () => {
  const { material, uMass } = await fieldSetup();
  const seen = new Set();
  const walk = (node) => {
    if (seen.has(node)) return;
    seen.add(node);
    for (const child of node.getChildren()) walk(child);
  };
  walk(material.colorNode);
  assert.ok(seen.has(uMass), "the scene's mass uniform feeds the compiled term");
  assert.ok(seen.has(material.userData.termLens.uniforms.phi), "the mix uniform gates it");
  assert.ok([...seen].some((n) => n.isTextureNode), "the colour comes from the kit's palette table");
});

/* ---------- legend ---------- */

test("legendModel states the term, its range, its unit and what is schematic", async () => {
  const target = { kind: "field", surfaceName: "well", range: [-5.5, 0], bindings: {}, paletteName: "viridis" };
  const model = legendModel({ formula: newtonianPotential, termId: "phi", target, note: "schematic scale, G = c = 1" });
  assert.equal(model.tex, "\\Phi/c^{2} = -\\frac{G M}{r c^{2}}");
  assert.equal(model.min, "-5.500");
  assert.equal(model.max, "0");
  assert.equal(model.unit, "dimensionless");
  assert.equal(model.palette, "viridis");
  assert.equal(model.status, "established");
  assert.match(model.ariaLabel, /^Colour scale for Φ\/c\^2: from -5\.500 to 0, dimensionless\. established; schematic scale, G = c = 1$/);
  assert.equal(legendModel({ formula: newtonianPotential, termId: "phi", target: { ...target, palette: "diverging" }, note: "n" }).palette, "diverging");
});

test("legendModel of a non-dimensionless term carries its unit and defaults to viridis", async () => {
  const target = { kind: "field", surfaceName: "s", range: [0, 3000], bindings: {} };
  const model = legendModel({ formula: schwarzschildRadius, termId: "r_s", target, note: "n" });
  assert.equal(model.unit, "m");
  assert.equal(model.palette, "viridis");
});
