/**
 * QFT field lab, particle interpretation as a GPU particle system (S08): one particle per interior sample point of the newest slice,
 * visible where that point is a crest. The kernel evaluates the closed-form field itself from a uniform mode table, so the CPU sets one
 * uniform (the newest slice's time) per frame and uploads nothing. (The waterfall surface itself is a mesh, not a particle system: it keeps
 * its CPU ring buffer until the GPU lattice field theory of S14 replaces it.)
 */

import { cos, float, select, uniformArray, vec3, vec4 } from "three/tsl";
import { Vector4 } from "three";
import { createParticleSystem } from "../../render/compute/particles.mjs";
import { FIELD_PEAKS, buildPeakRig, modeTable } from "./field-peaks-cpu.mjs";

/** Builds the kernel for a mode set: mirrors makePeakUpdateCpu. */
export function makeFieldPeaksUpdate(field, modes) {
  const L = field.length;
  return (ctx) => {
    const { time, nx } = ctx.params;
    const index = ctx.velocity.x;
    const phiAt = (j) => {
      const x = j.div(nx.sub(1)).mul(2 * FIELD_PEAKS.extentX).sub(FIELD_PEAKS.extentX).div(FIELD_PEAKS.extentX).mul(L / 2);
      let sum = float(0);
      for (let m = 0; m < field.modes.length; m++) {
        const mode = modes.element(m);
        sum = sum.add(mode.z.mul(cos(mode.x.mul(x).sub(mode.y.mul(time)).add(mode.w))));
      }
      return sum;
    };
    const h = phiAt(index), hl = phiAt(index.sub(1)), hr = phiAt(index.add(1));
    const crest = h.greaterThan(hl).and(h.greaterThan(hr)).and(h.greaterThan(FIELD_PEAKS.crestMin));
    const x = index.div(nx.sub(1)).mul(2 * FIELD_PEAKS.extentX).sub(FIELD_PEAKS.extentX);
    return { position: vec4(vec3(x, h.mul(FIELD_PEAKS.yScale).add(FIELD_PEAKS.lift), FIELD_PEAKS.extentZ), select(crest, float(FIELD_PEAKS.opacity), float(0))) };
  };
}

/**
 * @param {object} options
 * @param {object} options.field  the mode set from buildFourierModes
 * @param {number} options.nx     samples across the lab's width
 * @param {Color} options.color   linear-sRGB colour of the crest sprites
 */
export function createFieldPeaks({ field, nx, color }) {
  const rig = buildPeakRig(nx);
  const modes = uniformArray(modeTable(field).map(([k, omega, amplitude, phase]) => new Vector4(k, omega, amplitude, phase)), "vec4");
  const system = createParticleSystem({
    count: rig.count, seed: 0,
    initial: { velocity: rig.velocity, position: rig.position }, params: { time: 0, nx },
    update: makeFieldPeaksUpdate(field, modes),
    render: {
      sizePx: 0.55, sizeAttenuation: "world", profile: "soft", additive: true, opacity: 1,
      colorNode: () => vec3(color.r, color.g, color.b),
      opacityNode: (b) => b.position.toAttribute().w,
    },
  });
  return Object.assign(system, {
    /** The time of the newest slice. */
    setTime(time) { system.params.time.value = time; },
  });
}
