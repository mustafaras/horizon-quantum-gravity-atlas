/**
 * QFT field lab, particle interpretation (S08), the pure part: the CPU mirror of the GPU peak marker. Imports in Node.
 *
 * The interpretation marks the crests of the newest slice of the seeded free-field sample with glow sprites (always labelled as an
 * interpretation, never as observed particles). A crest is a local maximum above CREST_MIN. phi(x, t) is a closed form of the mode set
 * (js/science/qft-fields.mjs), so one particle per interior sample point evaluates it and its two neighbours itself; nothing is read back
 * from the CPU's slice buffer.
 */

import { sampleField } from "../../science/qft-fields.mjs";

export const FIELD_PEAKS = Object.freeze({ extentX: 9, extentZ: 7, crestMin: 0.35, lift: 0.4, yScale: 1.6, opacity: 0.9 });

/** x of sample i of nx across the lab's width. */
export const peakX = (i, nx) => (i / (nx - 1)) * 2 * FIELD_PEAKS.extentX - FIELD_PEAKS.extentX;

/** The modes as an array of [k, omega, amplitude, phase] (the layout of the GPU uniform array). */
export const modeTable = (field) => field.modes.map((m) => [m.k, m.omega, m.amplitude, m.phase]);

/** Initial buffers: element e is interior sample i = e + 1; velocity.x holds i. */
export function buildPeakRig(nx) {
  const count = nx - 2;
  const velocity = new Float32Array(count * 4);
  for (let e = 0; e < count; e++) velocity[e * 4] = e + 1;
  return { count, velocity, position: new Float32Array(count * 4) };
}

/** The mirror of fieldPeaksUpdate: `p.params` carries `time` (the newest slice's time) and `nx`; `field` is the mode set. */
export function makePeakUpdateCpu(field) {
  const L = field.length;
  return (p) => {
    const nx = p.params.nx, t = p.params.time, i = Math.round(p.velocity.x);
    const at = (j) => sampleField(field, (peakX(j, nx) / FIELD_PEAKS.extentX) * (L / 2), t);
    const h = Math.fround(at(i)), hl = Math.fround(at(i - 1)), hr = Math.fround(at(i + 1));
    const crest = h > hl && h > hr && h > FIELD_PEAKS.crestMin;
    p.position.x = peakX(i, nx); p.position.y = h * FIELD_PEAKS.yScale + FIELD_PEAKS.lift; p.position.z = FIELD_PEAKS.extentZ;
    p.position.w = crest ? FIELD_PEAKS.opacity : 0;
  };
}
