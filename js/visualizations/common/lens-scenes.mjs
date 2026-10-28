/*
 * Formula Lens wiring for the three scenes of S10. Each attacher says what the terms of one formula mean in one
 * scene and hands that to createTermLens (./term-lens.mjs), which owns the drawing and the events:
 *
 *   kerr-observatory   schwarzschild-radius  r_s -> the coordinate sphere of the Schwarzschild radius
 *                                            M   -> a mass readout
 *   gr-well            newtonian-potential   phi -> the potential painted over the embedding surface
 *   planck-descent     planck-length         hbar, c, G -> the decade gate where each first governs
 *
 * Every attacher registers its own cleanup with the scene (ctx.onDispose) and returns the lens.
 */

import { evaluateTerm, formatTermValue, lens as registry, termRange } from "../../formula/lens.mjs";
import { SOLAR_MASS } from "../../science/constants.mjs";
import { createTermLens } from "./term-lens.mjs";

const CIRCLE_SEGMENTS = 96;
const PLANES = Object.freeze({ xy: [0, 1], xz: [0, 2], yz: [1, 2] });

/** A closed circle of `radius` in one coordinate plane, as a flat xyz polyline (first point repeated at the end). */
export function circlePoints(radius, plane = "xz", segments = CIRCLE_SEGMENTS) {
  const axes = PLANES[plane];
  if (!axes) throw new RangeError(`circlePoints: plane must be one of ${Object.keys(PLANES).join(", ")}, received ${plane}`);
  if (!(radius > 0) || !Number.isFinite(radius)) throw new RangeError(`circlePoints: radius must be positive and finite, received ${radius}`);
  const out = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i += 1) {
    const angle = ((i % segments) / segments) * 2 * Math.PI; // the last point repeats the first exactly
    out[3 * i + axes[0]] = radius * Math.cos(angle);
    out[3 * i + axes[1]] = radius * Math.sin(angle);
  }
  return out;
}

/* ---------- Kerr observatory ---------- */

const KERR_NOTE = "r_s = 2GM/c² · unlensed coordinate sphere, a★ = 0 (schematic)";

/** `massSolar()` is the black-hole mass of the slider in solar masses. */
async function attachKerrObservatory(ctx, { massSolar }) {
  const formula = registry.formula("schwarzschild-radius");
  // r_s in the scene's own unit, GM/c^2: the term evaluated with the constants and M bound to 1.
  const radius = evaluateTerm(formula, "r_s", formula.geometric({ M: 1 }));
  const massLabel = ctx.label("", () => ({ x: 0, y: radius * 1.6, z: 0 }), "s3d-strong");
  const handle = await createTermLens({
    sceneId: "kerr-observatory", formulaId: formula.id, ctx,
    termTargets: { r_s: { kind: "object", objectName: "horizon" }, M: { kind: "object", objectName: "mass-readout" } },
    live: () => ({ env: { M: massSolar() * SOLAR_MASS } }),
    objects: {
      horizon: {
        outline: ["xz", "xy", "yz"].map((plane) => circlePoints(radius, plane)),
        note: KERR_NOTE, notePosition: () => ({ x: 0, y: -radius * 1.8, z: 0 }),
      },
      "mass-readout": { label: massLabel, onActivate: () => massLabel.set(`M = ${formatTermValue(massSolar())} M☉`) },
    },
  });
  ctx.onDispose?.(handle.dispose);
  return handle;
}

/* ---------- curvature engine: the gravity well ---------- */

const WELL_REFERENCE_RADIUS = 4;
const WELL_NOTE = "schematic scale · G = c = 1 · scene length units";

/**
 * @param surface        the well mesh
 * @param nodes          { mass, radius, rim } from createWellMaterial()
 * @param geometricMass  () => GM/c^2 in scene length units
 * @param massRange      [lo, hi] of GM/c^2 over the mass slider
 * @param radiusRange    [lo, hi] of the radial distance the term is drawn over
 */
async function attachCurvatureWell(ctx, { surface, nodes, geometricMass, massRange, radiusRange }) {
  const formula = registry.formula("newtonian-potential");
  const corners = [[massRange[1], radiusRange[0]], [massRange[0], radiusRange[1]]];
  const range = termRange(formula, "phi", corners.map(([M, r]) => formula.geometric({ M, r })));
  const handle = await createTermLens({
    sceneId: "gr-well", formulaId: formula.id, ctx, surfaces: { well: surface }, nodes, legendNote: WELL_NOTE,
    termTargets: {
      phi: { kind: "field", surfaceName: "well", range, mask: "rim", bindings: { M: { node: "mass" }, r: { node: "radius" }, G: 1, c: 1 } },
    },
    live: () => ({
      env: formula.geometric({ M: geometricMass(), r: WELL_REFERENCE_RADIUS }),
      unit: `(G = c = 1, at r = ${WELL_REFERENCE_RADIUS} scene units)`,
    }),
  });
  ctx.onDispose?.(handle.dispose);
  return handle;
}

/* ---------- Planck descent ---------- */

/** The regime each constant of l_P first governs, from the ladder's own notes; a didactic association (see the provenance). */
export const PLANCK_GATES = Object.freeze({
  hbar: Object.freeze({ log: -10, note: "ħ · quantum mechanics first governs structure here (atomic scale) · schematic association" }),
  c: Object.freeze({ log: -15, note: "c · probes turn relativistic here, ħc/l ≈ 0.2 GeV (nuclear scale) · schematic association" }),
  G: Object.freeze({ log: -35, note: "G · gravity becomes strong where G E² ≈ ħc⁵ (Planck scale) · schematic association" }),
});

/** `rings` is the descent's list of { ring: Mesh (a torus), log } decade gates. */
async function attachPlanckDescent(ctx, { rings }) {
  const termTargets = {}, objects = {};
  for (const [termId, gate] of Object.entries(PLANCK_GATES)) {
    const entry = rings.find((candidate) => candidate.log === gate.log);
    if (!entry) throw new ReferenceError(`planck descent: no decade gate at 10^${gate.log} m for ${termId}`);
    const objectName = `gate-${gate.log}`;
    termTargets[termId] = { kind: "object", objectName };
    objects[objectName] = {
      // The torus lies in its local xy plane before the scene turns it, so the outline is drawn in that frame.
      outline: [circlePoints(entry.ring.geometry.parameters.radius, "xy")], parent: entry.ring,
      note: gate.note, notePosition: () => ({ x: -1.2, y: entry.ring.position.y + 0.5, z: 0 }),
    };
  }
  const handle = await createTermLens({ sceneId: "planck-descent", formulaId: "planck-length", ctx, termTargets, objects });
  ctx.onDispose?.(handle.dispose);
  return handle;
}

/* ---------- QFT lattice: the phi^4 Hamiltonian density ---------- */

const LATTICE_NOTE = "lattice units · classical field · each term over the current state";
/** Each term of qft-phi4-hamiltonian, the symbols it reads (all of them scene nodes) and the palette of its colour. */
const LATTICE_TERMS = Object.freeze({
  kinetic: Object.freeze({ symbols: ["pi"] }),
  gradient: Object.freeze({ symbols: ["g2"] }),
  mass: Object.freeze({ symbols: ["m2", "phi"], palette: "diverging" }),
  interaction: Object.freeze({ symbols: ["lambda", "phi"] }),
});

/**
 * @param surface  the lattice mesh
 * @param nodes    { phi, pi, g2, m2, lambda } from createLatticeMaterial (varyings and the simulation's uniforms)
 * @param ranges   { kinetic, gradient, mass, interaction }: the [lo, hi] each term is coloured over (the mass term symmetric about 0)
 * @param sample   () => { pi, g2, phi, m2, lambda }: representative (rms) values, for the value a focused term shows on its card
 */
async function attachQftLattice(ctx, { surface, nodes, ranges, sample }) {
  const formula = registry.formula("qft-phi4-hamiltonian");
  const termTargets = Object.fromEntries(Object.entries(LATTICE_TERMS).map(([termId, spec]) => [termId, {
    kind: "field", surfaceName: "lattice", range: ranges[termId], ...(spec.palette ? { palette: spec.palette } : {}),
    bindings: Object.fromEntries(spec.symbols.map((name) => [name, { node: name }])),
  }]));
  const handle = await createTermLens({
    sceneId: "qft-lattice", formulaId: formula.id, ctx, surfaces: { lattice: surface }, nodes, legendNote: LATTICE_NOTE, termTargets,
    live: () => ({ env: sample(), unit: "(lattice units, rms over the lattice)" }),
  });
  ctx.onDispose?.(handle.dispose);
  return handle;
}

/* ---------- Casimir cavity: the pressure between ideal plates ---------- */

/**
 * @param gapGroup  a Group the scene scales along x to the drawn gap, so a unit-width outline always spans the gap
 * @param outline   flat xyz polyline of the unit-width gap rectangle, in the group's frame
 * @param readout   the in-scene label that marks the pressure readout (P ~ hbar c); hbar and c show it, because that is where they enter the number
 * @param gap       () => the plate separation in metres
 * @param notePosition () => the position of the note under the gap
 */
async function attachCasimirCavity(ctx, { gapGroup, outline, readout, gap, notePosition }) {
  const formula = registry.formula("casimir-plates-pressure");
  const handle = await createTermLens({
    sceneId: "casimir-cavity", formulaId: formula.id, ctx,
    termTargets: {
      a: { kind: "object", objectName: "gap" },
      hbar: { kind: "object", objectName: "readout" },
      c: { kind: "object", objectName: "readout" },
    },
    live: () => ({ env: { a: gap() } }),
    objects: {
      gap: { outline: [outline], parent: gapGroup, note: "schematic scale · the drawn gap is a log map of a", notePosition },
      readout: { label: readout },
    },
  });
  ctx.onDispose?.(handle.dispose);
  return handle;
}

/* ---------- Penrose atlas: the Kruskal relations on the diagram ---------- */

/**
 * The two Kruskal relations of the atlas, with each null coordinate bound to the family of coordinate lines it is
 * constant along: U is constant on an outgoing null ray and V on an ingoing one, so focusing U lifts the outgoing
 * family and focusing V the ingoing family. These families are null rays, not the t = const and r = const grid.
 *
 * @param uLines   flat xyz polylines of the lines U is constant along
 * @param vLines   the same for V
 * @param r0       () => the infall radius the lab's slider sets, so the focused term reports the value in the diagram
 */
async function attachPenroseAtlas(ctx, { uLines = [], vLines = [], r0 = () => 10 }) {
  const { freeFallFromRest } = await import("../../science/conformal.mjs");
  const handle = await createTermLens({
    sceneId: "gr-penrose", formulaId: "penrose-compact-t", ctx,
    termTargets: { U: { kind: "object", objectName: "u-lines" }, V: { kind: "object", objectName: "v-lines" } },
    objects: {
      // A term bound to a whole family highlights every line of it, at the focal width and with the halo the lens uses.
      "u-lines": { outline: uLines.length ? uLines : [new Float32Array(6)] },
      "v-lines": { outline: vLines.length ? vLines : [new Float32Array(6)] },
    },
    live: () => {
      const fall = freeFallFromRest({ r0: r0(), samples: 61 });
      const start = fall.rows[0];
      // U and V at the start of the fall: the two numbers the compactified diagram is built from
      return { env: { U: start.U, V: start.V }, unit: `(region I, at the start of the fall, r_0 = ${r0().toFixed(2)}M)` };
    },
  });
  ctx.onDispose?.(handle.dispose);
  return handle;
}

const ATTACHERS = Object.freeze({
  "gr-penrose": attachPenroseAtlas,
  "casimir-cavity": attachCasimirCavity,
  "kerr-observatory": attachKerrObservatory,
  "gr-well": attachCurvatureWell,
  "planck-descent": attachPlanckDescent,
  "qft-lattice": attachQftLattice,
});

export function attachLens(key, ctx, params) {
  const attach = ATTACHERS[key];
  if (!attach) throw new RangeError(`attachLens: unknown scene "${key}" (known: ${Object.keys(ATTACHERS).join(", ")})`);
  return attach(ctx, params);
}
