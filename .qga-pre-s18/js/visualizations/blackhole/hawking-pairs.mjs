/**
 * Hawking pair field as a GPU particle system (S08). The pure rig and the CPU mirror are in hawking-pairs-cpu.mjs; this file is the TSL
 * kernel and the drawable. One compute kernel and one instanced draw call carry every head and tail dot; the CPU writes the rig once
 * and then only sets the `phase` uniform (the shared timeline phase in cycles), so there are no per-frame uploads.
 */

import { Color } from "three";
import { clamp, cross, float, fract, length, max, pow, select, sin, vec3, vec4 } from "three/tsl";
import { createParticleSystem } from "../../render/compute/particles.mjs";
import { HAWKING_PAIR, buildPairRig } from "./hawking-pairs-cpu.mjs";

const SWIRL = 0.55;

/** The kernel: position.xyz and opacity (position.w) for this element at the shared phase. Mirrors hawkingPairUpdateCpu. */
export function hawkingPairUpdate(ctx) {
  const { phase, pace, fade } = ctx.params;
  const dir = ctx.velocity.xyz, family = ctx.velocity.w;
  const energy = ctx.attr.x, offset = ctx.attr.y, segment = ctx.attr.z;
  const S = HAWKING_PAIR.segments, R = HAWKING_PAIR.horizon;
  const local = fract(phase.sub(offset));
  const along = segment.div(S - 1);
  const envelope = pow(sin(local.min(1).mul(Math.PI)), 0.7).mul(fade);
  const isEscape = family.lessThan(0.5);
  // escape
  const lagged = max(float(0), local.sub(along.mul(HAWKING_PAIR.tailSpan)));
  const rad = lagged.mul(pace.mul(4.6).add(energy.mul(0.22))).add(R * 1.08);
  const rawSwirl = cross(dir, vec3(0, 1, 0));
  const swirlDir = select(length(rawSwirl).mul(length(rawSwirl)).lessThan(1e-4), vec3(1, 0, 0), rawSwirl.div(max(length(rawSwirl), 1e-6)));
  const escapePos = dir.mul(rad).add(swirlDir.mul(lagged.mul(lagged).mul(SWIRL)));
  const tailFade = pow(float(1).sub(along), 1.5);
  const escapeAlpha = envelope.mul(select(segment.lessThan(0.5), float(HAWKING_PAIR.escapeAlpha), tailFade.mul(HAWKING_PAIR.tailAlpha)));
  // fall
  const fallRad = max(float(R * 0.2), float(R * 2.2).sub(local.mul(R * 1.9)));
  const fallPos = dir.mul(fallRad.add(along.mul(HAWKING_PAIR.fallTail)));
  const fallAlpha = envelope.mul(select(segment.lessThan(0.5), float(HAWKING_PAIR.fallAlpha), tailFade.mul(HAWKING_PAIR.tailAlpha)));
  return { position: vec4(select(isEscape, escapePos, fallPos), select(isEscape, escapeAlpha, fallAlpha)) };
}

/**
 * @param {object} options
 * @param {Array} options.escaping  samples (energyOverT, azimuth, cosPolar) of the escaping partners
 * @param {Array} options.falling   samples of the infalling partners
 * @param {Color} options.hotColor  linear-sRGB colour of the escaping partners (temperature tinted)
 * @param {Color} options.fallColor linear-sRGB colour of the infalling partners' heads
 * @param {Color} [options.fallTailColor] linear-sRGB colour of their tail dots (defaults to fallColor)
 * @param {number} options.pace     0.35..1: colder holes emit slower, lazier particles
 * @param {number} options.fade     0.35..1: the field's overall visibility from the display rate
 * @returns the particle system, with `setPhase(cycles)` and `particles`
 */
export function createHawkingPairs({ escaping, falling, hotColor, fallColor, fallTailColor = fallColor, pace, fade }) {
  const rig = buildPairRig({ escaping, falling });
  const hot = new Color(hotColor), fall = new Color(fallColor), fallTail = new Color(fallTailColor);
  const system = createParticleSystem({
    count: Math.max(1, rig.count), seed: 0,
    initial: rig.count ? { position: rig.position, velocity: rig.velocity, attr: rig.attr } : { attr: new Float32Array(4) },
    params: { phase: 0, pace, fade },
    update: hawkingPairUpdate,
    render: {
      sizePx: 1, sizeAttenuation: "world", profile: "soft", additive: true, opacity: 1,
      sizeNode: (b) => b.attr.toAttribute().w,
      opacityNode: (b) => clamp(b.position.toAttribute().w, 0, 1),
      colorNode: (b) => {
        const escapes = b.velocity.toAttribute().w.lessThan(0.5), head = b.attr.toAttribute().z.lessThan(0.5);
        return select(escapes, vec3(hot.r, hot.g, hot.b), select(head, vec3(fall.r, fall.g, fall.b), vec3(fallTail.r, fallTail.g, fallTail.b)));
      },
    },
  });
  // An empty field (extremal spin: the emission vanishes) still needs one element of storage; nothing is drawn.
  if (rig.count === 0 && system.object) system.object.visible = false;
  return Object.assign(system, {
    particles: rig.particles,
    /** The shared timeline phase in cycles (time / period); under reduced motion the caller passes a fixed phase. */
    setPhase(cycles) { system.params.phase.value = cycles; },
  });
}

