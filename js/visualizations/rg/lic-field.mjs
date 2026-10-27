/**
 * The gravity flow silk (S18): the Einstein-Hilbert flow in the (g, lambda) plane as a GPU line integral convolution.
 *
 * Every fragment integrates the normalised vector field (beta_g, beta_lambda) L steps each way and averages seeded white noise along it with a Hann
 * kernel (lic-cpu.mjs is the CPU twin and the reference the tests use). The vector field is the node graph compileTSL builds from the Formula Core
 * definitions as-beta-g and as-beta-lambda, so the shader and the tested science are one expression. The noise is TSL's `hash` of the integer cell:
 * no texture, no Math.random. Colour is the diverging palette of sign(beta_g), luminance is the LIC value, under a faint engraved grid; beyond
 * lambda = 1/2 the plane is hatched. Over it, as engraved lines: rings at the fixed points, the separatrix (2 px), the singular line, the boundary
 * 1 - g B2 = 0 and the chosen trajectory as the one focal line (2.5 px, updated in place, no allocation per frame).
 *
 * The ripple (bands sliding along the field) runs only in full motion; under reduced motion the amplitude is zero and the picture is the plain LIC.
 * A TSL node material, so it runs on the WebGPU renderer and on the node renderer's WebGL2 backend.
 */

import { MeshBasicNodeMaterial } from "three/webgpu";
import * as TSL from "three/tsl";
import { compileTSL } from "../../formula/to-tsl.mjs";
import { asBetaG, asBetaLambda } from "../../formula/library/asymptotic-safety.mjs";
import * as TK from "../../design/tokens.mjs";
import { fieldColorNode, lineCoverage, paletteTexture } from "../../render/materials/index.mjs";
import { tagLayer as tag } from "../../render/scene-layers.mjs";
import { typesetLabel as typeset } from "../common/katex-label.mjs";
import { RIPPLE_LENGTH, NOISE_STRIDE, CELL_ORIGIN, SEED_X, SEED_Y, SEED_X_MODULUS, SEED_Y_MODULUS } from "./lic-cpu.mjs";
import {
  SILK, TRAJECTORY_CAPACITY, fixedPointRings, separatrixPoints, singularLinePoints, etaPoleCurve, ringPoints, toScene, writeTrajectory,
} from "./silk-geometry.mjs";

const { Fn, Loop, uniform, float, vec2, vec3, vec4, positionLocal, floor, hash, cos, min, clamp, select, mix, max, length: vlength } = TSL;

export const KERNEL_LENGTH = Object.freeze({ low: 16, standard: 24, ultra: 40 }); // steps each way: 24 at medium, 40 at ultra (the plan), 16 on the low tier
const STEP = 0.04; // scene units per LIC step
const CELL = 0.035; // noise cell, scene units
const SEED = 42;
const LAMBDA_CAP = 0.499; // the field is evaluated below the singular line only
const FIELD_LIMIT = 1e6;
const SIGN_GAIN = 3; // beta_g to the palette range [-1, 1]
const LIC_GAIN = 4.5; // white noise averaged over the kernel has a small spread; stretched about 1/2 to fill the luminance range
const MIN_LUMINANCE = 0.14;
const GRID_G = 0.2, GRID_LAMBDA = 0.1, GRID_GAIN = 0.16;
const HATCH_SPACING = 0.12, HATCH_GAIN = 0.55, BEYOND_GAIN = 0.9;
const RIPPLE_AMPLITUDE = 0.6, PHASE_SPEED = 0.3; // ripple depth and periods per second at full motion
const TWO_PI = 2 * Math.PI;
const START_RING_RADIUS = 0.09;
const LINE_WIDTH_PX = Object.freeze({ ring: 1.25, separatrix: 2, hairline: 1 });
const POLE_DASH = Object.freeze({ size: 0.14, gap: 0.1 });
const linear = (name) => vec3(...TK.linearRef(name));

/** The silk material and its two uniforms. `length` is the number of LIC steps each way. */
export function createSilkMaterial({ length = KERNEL_LENGTH.standard, seed = SEED } = {}) {
  const uPhase = uniform(0), uRipple = uniform(0);
  const sx = (seed * SEED_X) % SEED_X_MODULUS, sy = (seed * SEED_Y) % SEED_Y_MODULUS;
  const gOf = (x) => x.div(SILK.scale).add(SILK.centre.g);
  const lambdaOf = (z) => float(SILK.centre.lambda).sub(z.div(SILK.scale));

  const betas = (p) => {
    const g = gOf(p.x), lam = min(lambdaOf(p.y), LAMBDA_CAP);
    const bg = compileTSL(asBetaG.expr, TSL, { g, lam }).node;
    const bl = compileTSL(asBetaLambda.expr, TSL, { g, lam }).node;
    return [clamp(bg, -FIELD_LIMIT, FIELD_LIMIT), clamp(bl, -FIELD_LIMIT, FIELD_LIMIT)];
  };
  // unit direction of the flow in the plane (lambda up the screen is -z), zero where the field vanishes
  const direction = Fn(([p]) => {
    const [bg, bl] = betas(p);
    const v = vec2(bg, bl.negate());
    const size = vlength(v);
    return select(size.greaterThan(1e-9), v.div(size), vec2(0, 0));
  });
  const noise = Fn(([p]) => {
    const cx = floor(p.x.div(CELL)).add(CELL_ORIGIN + sx);
    const cy = floor(p.y.div(CELL)).add(CELL_ORIGIN + sy);
    return hash(cx.add(cy.mul(NOISE_STRIDE)));
  });
  const hann = (s) => cos(s.mul(Math.PI)).add(1).mul(0.5);

  const lic = Fn(() => {
    const p0 = vec2(positionLocal.x, positionLocal.z);
    const w0 = float(1).add(uRipple.mul(cos(uPhase.mul(TWO_PI))));
    const sum = noise(p0).mul(w0).toVar();
    const total = w0.toVar();
    for (const dir of [1, -1]) {
      const pos = p0.toVar();
      Loop(length, ({ i }) => {
        pos.addAssign(direction(pos).mul(STEP * dir));
        const k = float(i).add(1);
        const ripple = float(1).add(uRipple.mul(cos(k.mul((dir * TWO_PI) / RIPPLE_LENGTH).sub(uPhase.mul(TWO_PI)))));
        const w = hann(k.div(length)).mul(ripple);
        sum.addAssign(noise(pos).mul(w));
        total.addAssign(w);
      });
    }
    return sum.div(total);
  });

  const lut = paletteTexture({ range: [-1, 1], palette: "diverging" });
  const colour = Fn(() => {
    const p = vec2(positionLocal.x, positionLocal.z);
    const [bgHere] = betas(p);
    const base = fieldColorNode(clamp(bgHere.mul(SIGN_GAIN), -1, 1), [-1, 1], lut);
    const value = clamp(lic().sub(0.5).mul(LIC_GAIN).add(0.5), 0, 1);
    let c = base.mul(mix(float(MIN_LUMINANCE), float(1), value));
    const grid = max(lineCoverage(gOf(p.x).div(GRID_G), LINE_WIDTH_PX.hairline), lineCoverage(lambdaOf(p.y).div(GRID_LAMBDA), LINE_WIDTH_PX.hairline));
    c = mix(c, linear("ink-dim"), grid.mul(GRID_GAIN));
    const beyond = select(lambdaOf(p.y).greaterThanEqual(0.5), float(1), float(0));
    const hatch = lineCoverage(p.x.add(p.y).div(HATCH_SPACING), 1.2);
    c = mix(c, mix(linear("surface-0"), linear("ink-dim"), hatch.mul(HATCH_GAIN)), beyond.mul(BEYOND_GAIN));
    return vec4(c, 1);
  });

  const material = new MeshBasicNodeMaterial({ fog: false });
  material.colorNode = colour();
  material.userData.qgaNodeKit = true;
  material.userData.kit = "rg-lic-silk";
  return { material, uniforms: { phase: uPhase, ripple: uRipple }, lut };
}

/**
 * @param ctx   the Scene3D build context
 * @returns the scene handle; setTrajectory({ points, start }) redraws the chosen trajectory in place
 */
export async function buildGravityFlowSilk(ctx) {
  const { THREE, scene } = ctx;
  const length = KERNEL_LENGTH[ctx.settings.current.detail3d] ?? KERNEL_LENGTH.standard;
  const silk = createSilkMaterial({ length });
  const geometry = new THREE.PlaneGeometry(SILK.width, SILK.depth);
  geometry.rotateX(-Math.PI / 2);
  const plane = new THREE.Mesh(geometry, silk.material);
  plane.frustumCulled = false;
  scene.add(tag(plane, "model"));

  const engraved = ctx.engraved;
  const add = (points, options) => { const line = engraved.line(points, { layer: "model", ...options }); scene.add(tag(line, "model")); return line; };
  add(singularLinePoints(), { color: "ink-dim", widthPx: LINE_WIDTH_PX.hairline });
  add(etaPoleCurve(), { color: "ink-dim", widthPx: LINE_WIDTH_PX.hairline, dash: POLE_DASH });
  add(separatrixPoints(), { color: "ink", widthPx: LINE_WIDTH_PX.separatrix });
  const rings = fixedPointRings();
  for (const ring of rings) add(ring.points, { color: "ink-strong", widthPx: LINE_WIDTH_PX.ring });

  // the chosen trajectory: one focal line in a fixed-capacity stream, and a ring at its start
  const buffer = new Float32Array(TRAJECTORY_CAPACITY * 3);
  const trajectory = engraved.stream(TRAJECTORY_CAPACITY, { color: "ink-strong", widthPx: engraved.WIDTH_PX.focal, layer: "model" });
  scene.add(tag(trajectory, "model"));
  engraved.setPoints(trajectory, buffer, 0);
  const startRing = add(ringPoints(SILK.centre.g, SILK.centre.lambda, START_RING_RADIUS), { color: "ink-strong", widthPx: LINE_WIDTH_PX.ring });
  startRing.visible = false; // built around the centre of the plane, which is the origin of the scene, and moved to the start point

  // labels: status first, then what is on the picture (positions are fixed, never rebuilt)
  const at = (g, lambda, dx = 0, dz = 0) => { const p = toScene(g, lambda); return { x: p[0] + dx, y: 0.2, z: p[2] + dz }; };
  const ngfp = rings.find((r) => !r.gaussian);
  const gfpAt = at(0, 0, 0.3, 0.35), ngfpAt = at(ngfp.g, ngfp.lambda, 0.3, -0.45);
  const singularAt = at(0.82, 0.5, 0.3, 0.5), sepAt = at(0.3, 0.07, 0.1, 0.55);
  // The status is DOM pinned to the top-left of the stage (mountOverlay), not a world position: at 390 px the plane is wider than the
  // frame, so a world label at a corner of it would be clipped. The caption and the scheme table carry the rest of the qualifier.
  if (typeof ctx.mountOverlay === "function" && globalThis.document) {
    const chip = globalThis.document.createElement("div");
    chip.className = "s3d-label s3d-strong gf-silk-status";
    chip.textContent = "CONJECTURAL · Einstein–Hilbert truncation";
    ctx.mountOverlay(chip);
  }
  const labels = [
    ["\\text{GFP}", "GFP", gfpAt], ["\\text{NGFP}\\ (g_*,\\lambda_*)", "NGFP", ngfpAt],
    ["\\lambda=\\tfrac12\\ \\text{singular}", "lambda = 1/2 singular", singularAt], ["\\text{separatrix (IIa)}", "separatrix (IIa)", sepAt],
  ];
  for (const [tex, plain, position] of labels) typeset(ctx.label("", () => position, "s3d-lens-note"), tex, plain);

  let phase = 0;
  let trajectoryPoints = 0;
  return {
    autoRotate: false,
    update: (t, dt) => {
      const motion = ctx.motion();
      silk.uniforms.ripple.value = motion > 0 ? RIPPLE_AMPLITUDE : 0;
      if (motion > 0 && dt > 0) { phase = (phase + dt * PHASE_SPEED * motion) % 1; silk.uniforms.phase.value = phase; }
    },
    setTrajectory({ points, start }) {
      trajectoryPoints = writeTrajectory(points, buffer);
      engraved.setPoints(trajectory, buffer, trajectoryPoints);
      startRing.visible = Boolean(start);
      if (start) { const p = toScene(start.g, start.lambda); startRing.position.set(p[0], 0, p[2]); }
      ctx.invalidate();
    },
    dispose: () => { geometry.dispose(); silk.material.dispose(); silk.lut.dispose(); },
    // QA hook: qa/specs/gravity-flow-lab.spec.mjs reads the live uniforms and the rings drawn
    state: () => ({ phase, ripple: silk.uniforms.ripple.value, kernelLength: length, rings: rings.length, trajectoryPoints }),
  };
}
