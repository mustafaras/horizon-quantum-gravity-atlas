import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Group, Mesh, Object3D, PlaneGeometry, TorusGeometry } from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { float, length, max, positionLocal, uniform, vec4 } from "three/tsl";

import { buildTokens, parseTokensCss, setTokenSource } from "../js/design/tokens.mjs";
import { lens } from "../js/formula/lens.mjs";
import { library } from "../js/formula/library/index.mjs";
import { createConceptBus } from "../js/linking/concept-bus.mjs";
import { listVisualizationProvenance } from "../js/science/provenance.mjs";
import { SOLAR_MASS } from "../js/science/constants.mjs";
import { GR_MASS_SLIDER } from "../js/visualizations/gr/curvature-engine.mjs";
import { PLANCK_GATES, attachLens, circlePoints } from "../js/visualizations/common/lens-scenes.mjs";
import { FORMULA_LENS_PROVENANCE, registerFormulaLensProvenance } from "../js/visualizations/common/term-lens-provenance.mjs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function fakeCtx() {
  const labels = [], disposers = [];
  const ctx = {
    THREE: { Group }, scene: new Group(), invalidations: 0,
    invalidate() { ctx.invalidations += 1; },
    engraved: { WIDTH_PX: { focal: 2.5 }, line(points, options) { const o = new Object3D(); o.userData.engraved = { points, ...options }; return o; } },
    label(text, position) { const h = { text, position, shown: true, el: { classList: { add() {}, remove() {} } }, setShow(v) { h.shown = v; }, set(t) { h.text = t; } }; labels.push(h); return h; },
    annotation(text, position) { return ctx.label(text, position); },
    onDispose(fn) { disposers.push(fn); },
  };
  return { ctx, labels, disposers };
}

test.beforeEach(() => { globalThis.QGA_CONCEPT_BUS = createConceptBus({ diagnostic() {} }); });
test.afterEach(() => { delete globalThis.QGA_CONCEPT_BUS; });

/* ---------- geometry ---------- */

test("circlePoints is a closed circle of the given radius in the requested plane", () => {
  const xz = circlePoints(2, "xz", 8);
  assert.equal(xz.length, 9 * 3);
  assert.deepEqual([...xz.slice(0, 3)], [...xz.slice(-3)], "closed");
  for (let i = 0; i < 9; i += 1) {
    assert.ok(Math.abs(Math.hypot(xz[3 * i], xz[3 * i + 2]) - 2) < 1e-6);
    assert.equal(xz[3 * i + 1], 0, "y is the axis of the xz plane");
  }
  assert.ok(circlePoints(1, "xy").every((v, i) => i % 3 !== 2 || v === 0));
  assert.ok(circlePoints(1, "yz").every((v, i) => i % 3 !== 0 || v === 0));
  assert.throws(() => circlePoints(1, "ab"), /plane/);
  assert.throws(() => circlePoints(0, "xz"), /radius/);
});

/* ---------- facts the wiring depends on ---------- */

test("the three Planck gates exist on the descent's ladder and each association is defensible", () => {
  const planck = source("js/mod-planck.jsx");
  const stops = Object.fromEntries([...planck.matchAll(/\{ log: (-?\d+), name: "([^"]+)", note: "([^"]+)"/g)].map((m) => [Number(m[1]), { name: m[2], note: m[3] }]));
  for (const [constant, gate] of Object.entries(PLANCK_GATES)) assert.ok(stops[gate.log], `${constant}: a ladder stop at 10^${gate.log} m`);
  assert.match(stops[PLANCK_GATES.hbar.log].note, /Quantum mechanics governs structure/);
  assert.match(stops[PLANCK_GATES.c.log].name, /Nuclear/);
  assert.match(stops[PLANCK_GATES.G.log].name, /Planck scale/);
  // G: the Planck length sits at the Planck gate to the decade.
  assert.equal(Math.round(Math.log10(library.planckLength.evaluate({}))), PLANCK_GATES.G.log);
  // c: at the nuclear gate the probe energy hbar c / l is the 0.2 GeV the note quotes.
  const probeGeV = 1.973e-16 / 10 ** PLANCK_GATES.c.log;
  assert.ok(Math.abs(probeGeV - 0.2) < 0.01, `probe energy ${probeGeV} GeV`);
  assert.match(PLANCK_GATES.c.note, /0\.2 GeV/);
  // hbar: the Bohr radius a0 = 5.29e-11 m sits at the atomic gate to the decade.
  assert.equal(Math.round(Math.log10(5.29177210903e-11)), PLANCK_GATES.hbar.log);
  for (const gate of Object.values(PLANCK_GATES)) assert.match(gate.note, /schematic/, "in-canvas status label");
});

test("the engine's mass slider range is the slider of mod-gr.jsx", () => {
  const [, lo, hi] = source("js/mod-gr.jsx").match(/<SliderRow label="mass M" min=\{(\d+)\} max=\{(\d+)\}/);
  assert.deepEqual([...GR_MASS_SLIDER], [Number(lo), Number(hi)]);
});

test("every lens scene has a registered, schematic provenance entry, and registering twice is safe", () => {
  registerFormulaLensProvenance();
  registerFormulaLensProvenance();
  const registered = Object.fromEntries(listVisualizationProvenance().map((e) => [e.id, e.provenance]));
  for (const id of ["formula-lens-kerr-observatory", "formula-lens-curvature-well", "formula-lens-planck-descent"]) {
    assert.ok(registered[id], id);
    assert.equal(registered[id].status, "schematic", id);
    assert.ok(registered[id].references.length >= 1, id);
  }
  // the lattice lens shows exact terms of a computed classical field, not a schematic: it says "effective"
  assert.equal(registered["formula-lens-qft-lattice"].status, "effective");
  assert.ok(registered["formula-lens-qft-lattice"].references.length >= 2);
  assert.deepEqual(Object.keys(FORMULA_LENS_PROVENANCE).sort(), Object.keys(registered).filter((id) => id.startsWith("formula-lens-")).sort());
});

/* ---------- the attachers ---------- */

test("attachLens rejects a scene it does not know", () => {
  assert.throws(() => attachLens("nowhere", fakeCtx().ctx, {}), { name: "RangeError", message: /nowhere/ });
});

test("Kerr observatory: r_s is the sphere of radius 2 GM/c^2 and M reads the slider mass", async () => {
  const { ctx, labels, disposers } = fakeCtx();
  const massSolar = 10;
  const handle = await attachLens("kerr-observatory", ctx, { massSolar: () => massSolar });
  assert.equal(disposers.length, 1, "cleanup is registered with the scene");
  const outline = ctx.scene.children.find((child) => child.name === "term-lens:r_s");
  assert.equal(outline.children.length, 3, "three great circles");
  for (const circle of outline.children) {
    const points = circle.userData.engraved.points;
    assert.ok(Math.abs(Math.hypot(points[0], points[1], points[2]) - 2) < 1e-6, "radius = r_s in GM/c^2");
  }
  const event = lens.termEvent("schwarzschild-radius", "r_s");
  assert.ok(Math.abs(event.value - 2 * 6.6743e-11 * massSolar * SOLAR_MASS / (299792458 ** 2)) / event.value < 1e-3);
  globalThis.QGA_CONCEPT_BUS.publish("formula-term", { ...event });
  assert.equal(outline.visible, true);
  globalThis.QGA_CONCEPT_BUS.publish("formula-term", { ...lens.termEvent("schwarzschild-radius", "M") });
  const massLabel = labels.find((label) => /^M = /.test(label.text));
  assert.equal(massLabel.text, "M = 10.00 M☉");
  assert.equal(massLabel.shown, true);
  handle.dispose();
  assert.equal(lens.binding("schwarzschild-radius"), null);
});

test("Planck descent: each constant outlines its own gate ring in the ring's local frame", async () => {
  const { ctx, disposers } = fakeCtx();
  const rings = [0, -5, -10, -15, -18, -19, -30, -35].map((log) => {
    const ring = new Mesh(new TorusGeometry(1.7, 0.04, 10, 80));
    ring.position.y = 5 - (-log / 35) * 10;
    ctx.scene.add(ring);
    return { ring, log };
  });
  const handle = await attachLens("planck-descent", ctx, { rings });
  assert.equal(disposers.length, 1);
  const outlineOf = (log) => rings.find((r) => r.log === log).ring.children.find((c) => c.name.startsWith("term-lens:"));
  for (const [constant, gate] of Object.entries(PLANCK_GATES)) {
    const outline = outlineOf(gate.log);
    assert.equal(outline.visible, false, `${constant} starts hidden`);
    globalThis.QGA_CONCEPT_BUS.publish("formula-term", { ...lens.termEvent("planck-length", constant) });
    assert.equal(outline.visible, true, `${constant} shows its gate`);
    assert.equal(rings.filter((r) => outlineOf(r.log)?.visible).length, 1, "exactly one gate at a time");
    const points = outline.children[0].userData.engraved.points;
    assert.ok(Math.abs(Math.hypot(points[0], points[1]) - 1.7) < 1e-6, "on the ring's own radius");
  }
  handle.dispose();
  assert.equal(outlineOf(-10), undefined, "dispose removes the outline from the ring");
  await assert.rejects(attachLens("planck-descent", ctx, { rings: rings.filter((r) => r.log !== -15) }), { name: "ReferenceError", message: /10\^-15/ });
});

test("curvature well: the colour range is the term over the slider corners, derived from the formula", async () => {
  const { ctx } = fakeCtx();
  const material = new MeshBasicNodeMaterial();
  material.colorNode = vec4(0.1, 0.2, 0.3, 1);
  const nodes = { mass: uniform(0), radius: max(length(positionLocal.xz), float(1)), rim: uniform(1) };
  const handle = await attachLens("gr-well", ctx, {
    surface: new Mesh(new PlaneGeometry(2, 2), material), nodes,
    geometricMass: () => 2.75, massRange: GR_MASS_SLIDER.map((m) => 0.55 * m), radiusRange: [1, 8.5],
  });
  const target = lens.target("newtonian-potential", "phi");
  assert.ok(Math.abs(target.range[0] - -5.5) < 1e-12);
  assert.ok(Math.abs(target.range[1] - -0.55 / 8.5) < 1e-12);
  assert.equal(target.mask, "rim");
  const event = lens.termEvent("newtonian-potential", "phi");
  assert.equal(event.value, -2.75 / 4);
  assert.match(event.unit, /G = c = 1/);
  handle.dispose();
});

test("QFT lattice: each term of the Hamiltonian density is a field over the surface, bound to the simulation's nodes and ranged from the preset", async () => {
  setTokenSource(buildTokens(parseTokensCss(source("styles/tokens.css")))); // the diverging palette of the mass term reads the colour tokens
  const { ctx, disposers } = fakeCtx();
  const material = new MeshBasicNodeMaterial();
  material.colorNode = vec4(0.1, 0.2, 0.3, 1);
  const nodes = { phi: uniform(0), pi: uniform(0), g2: uniform(0), m2: uniform(0.5), lambda: uniform(1) };
  const ranges = { kinetic: [0, 0.43], gradient: [0, 0.34], mass: [-0.15, 0.15], interaction: [0, 0.02] };
  const sample = { pi: 0.4, g2: 0.6, phi: 0.5, m2: 0.5, lambda: 1 };
  const handle = await attachLens("qft-lattice", ctx, { surface: new Mesh(new PlaneGeometry(2, 2), material), nodes, ranges, sample: () => sample });
  assert.equal(disposers.length, 1);
  for (const termId of ["kinetic", "gradient", "mass", "interaction"]) {
    const target = lens.target("qft-phi4-hamiltonian", termId);
    assert.equal(target.kind, "field", termId);
    assert.deepEqual([...target.range], ranges[termId], termId);
    assert.equal(target.surfaceName, "lattice");
  }
  assert.equal(lens.target("qft-phi4-hamiltonian", "mass").palette, "diverging", "the mass term changes sign with m^2");
  assert.equal(lens.target("qft-phi4-hamiltonian", "kinetic").palette, undefined);
  // the card's readout is the term at the lattice's rms values
  assert.equal(lens.termEvent("qft-phi4-hamiltonian", "kinetic").value, 0.4 ** 2 / 2);
  assert.equal(lens.termEvent("qft-phi4-hamiltonian", "gradient").value, 0.6 / 2);
  assert.ok(Math.abs(lens.termEvent("qft-phi4-hamiltonian", "mass").value - (0.5 * 0.5 ** 2) / 2) < 1e-15);
  assert.ok(Math.abs(lens.termEvent("qft-phi4-hamiltonian", "interaction").value - (1 / 24) * 0.5 ** 4) < 1e-15);
  assert.match(lens.termEvent("qft-phi4-hamiltonian", "kinetic").unit, /lattice units/);
  handle.dispose();
  assert.equal(lens.binding("qft-phi4-hamiltonian"), null);
});
