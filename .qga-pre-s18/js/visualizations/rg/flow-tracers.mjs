/**
 * RG flow tracers as a GPU particle system (S08). The streamlines are resampled once (flow-tracers-cpu.mjs) into a float table texture; the
 * kernel walks each tracer along its run from the `time` and `motion` uniforms with two texel loads, and one instanced draw call shows them.
 * The old version rewrote every tracer's position and colour on the CPU each frame and re-uploaded both attributes.
 */

import { Color, DataTexture, FloatType, NearestFilter, RGBAFormat, ClampToEdgeWrapping, NoColorSpace } from "three";
import { clamp, float, floor, fract, int, ivec2, min, mix, select, sin, textureLoad, vec3, vec4 } from "three/tsl";
import { createParticleSystem } from "../../render/compute/particles.mjs";
import { TRACER, buildTracerRig, resampleRuns } from "./flow-tracers-cpu.mjs";

/** The table as a nearest-filtered float texture (no OES_texture_float_linear needed: the kernel interpolates itself). */
export function tracerTableTexture(table) {
  const texture = new DataTexture(table.data, table.samples, Math.max(1, table.rows), RGBAFormat, FloatType);
  texture.minFilter = texture.magFilter = NearestFilter;
  texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
  texture.colorSpace = NoColorSpace;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/** The kernel for a table texture: mirrors makeTracerUpdateCpu. */
export function makeTracerUpdate(texture, samples) {
  return (ctx) => {
    const { time, motion } = ctx.params;
    const row = ctx.attr.x.round().toInt();
    const offset = ctx.attr.y;
    const u = fract(offset.add(select(motion.lessThan(0.5), float(TRACER.frozenShift), time.mul(TRACER.speed))));
    const x = clamp(u, 0, 1).mul(samples - 1);
    const i0 = min(int(samples - 1), floor(x).toInt());
    const i1 = min(int(samples - 1), i0.add(1));
    const f = x.sub(i0.toFloat());
    const a = textureLoad(texture, ivec2(i0, row)).xyz, b = textureLoad(texture, ivec2(i1, row)).xyz;
    return { position: vec4(mix(a, b, f), 1), age: u };
  };
}

/**
 * @param {Array} runs   the flow-field's runs ({ pts, cum, total, dir })
 * @param {Color} uvColor / irColor  linear-sRGB tracer colours (UV runs cyan, IR runs amber)
 */
export function createFlowTracers({ runs, uvColor, irColor, size = 0.16, opacity = 0.95 }) {
  const rig = buildTracerRig(runs);
  const table = resampleRuns(runs);
  const texture = tracerTableTexture(table);
  const uv = new Color(uvColor), ir = new Color(irColor);
  const system = createParticleSystem({
    count: Math.max(1, rig.count), seed: 0,
    initial: { attr: rig.attr, position: rig.position }, params: { time: 0, motion: 1 },
    update: makeTracerUpdate(texture, table.samples),
    render: {
      sizePx: size, sizeAttenuation: true, profile: "soft", additive: true, opacity,
      // brighten mid-run, fade at both ends so tracers appear and disappear smoothly
      colorNode: (b) => {
        const brightness = sin(b.age.toAttribute().mul(Math.PI)).mul(0.85).add(0.35);
        return select(b.attr.toAttribute().z.greaterThan(0), vec3(uv.r, uv.g, uv.b), vec3(ir.r, ir.g, ir.b)).mul(brightness);
      },
    },
  });
  const disposeSystem = system.dispose;
  return Object.assign(system, {
    tracers: rig.count, table,
    /** Sets the timeline time (seconds) and the motion flag (0 freezes the tracers on a fixed phase). */
    setClock(time, motion) { system.params.time.value = time; system.params.motion.value = motion === 0 ? 0 : 1; },
    dispose() { texture.dispose(); disposeSystem.call(system); },
  });
}
