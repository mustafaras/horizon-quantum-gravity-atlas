/**
 * Hawking pair field (S08), the pure part: the rig of per-particle constants and the CPU mirror of the GPU update. Imports in Node.
 *
 * The picture is schematic (see HAWKING_LAB_PROVENANCE): escaping partners leave on gently curved, temperature-coloured paths with
 * luminous tails, their partners fall in. Every position is a closed form of the shared timeline phase and the particle's constants, so
 * the GPU system recomputes the whole field each frame from one uniform, and nothing is uploaded after creation.
 *
 * One element per (particle, segment): segment 0 is the glowing head, segments 1.. are the tail dots, lagged along the same path.
 */

export const HAWKING_PAIR = Object.freeze({
  horizon: 1.4,            // R_HORIZON of the lab
  segments: 7,             // head + 6 tail dots
  tailSpan: 0.13,          // fraction of a cycle the escape tail spans (the old trail's `local - 0.13`)
  fallTail: 0.32,          // world length of the infall tail
  headSize: (energyOverT) => 0.4 + 0.16 * energyOverT / 6,
  fallHeadSize: 0.24,
  dotSize: 0.085,
  escapeAlpha: 0.95, fallAlpha: 0.75, tailAlpha: 0.85,
});

const SWIRL = 0.55;

/** Unit direction of a sample (the lab's dirOf): outward hemisphere, or dipped toward the pole for the infalling partner. */
export function pairDirection(sample, dip = false) {
  const s = Math.sqrt(1 - sample.cosPolar * sample.cosPolar);
  const x = Math.cos(sample.azimuth) * s;
  const y = dip ? -Math.abs(sample.cosPolar) * 0.4 : sample.cosPolar;
  const z = Math.sin(sample.azimuth) * s;
  const n = Math.hypot(x, y, z);
  return [x / n, y / n, z / n];
}

/**
 * The initial buffers for `escaping` and `falling` sample lists (each `{ energyOverT, azimuth, cosPolar }`).
 * velocity = (dir, family 0 escape / 1 fall); attr = (energy over T, cycle offset in cycles, segment, size).
 */
export function buildPairRig({ escaping, falling }) {
  const S = HAWKING_PAIR.segments;
  const count = (escaping.length + falling.length) * S;
  const velocity = new Float32Array(count * 4), attr = new Float32Array(count * 4), position = new Float32Array(count * 4);
  let e = 0;
  const put = (dir, family, energy, offset, headSize) => {
    for (let s = 0; s < S; s++, e++) {
      velocity.set([dir[0], dir[1], dir[2], family], e * 4);
      const size = s === 0 ? headSize : HAWKING_PAIR.dotSize * (1 - 0.5 * s / (S - 1));
      attr.set([energy, offset, s, size], e * 4);
    }
  };
  escaping.forEach((sample, i) => put(pairDirection(sample), 0, sample.energyOverT, i / Math.max(1, escaping.length), HAWKING_PAIR.headSize(sample.energyOverT)));
  falling.forEach((sample, i) => put(pairDirection(sample, true), 1, sample.energyOverT, i / Math.max(1, falling.length), HAWKING_PAIR.fallHeadSize));
  return { count, particles: escaping.length + falling.length, position, velocity, attr };
}

const fract = (x) => x - Math.floor(x);

/**
 * The mirror of hawkingPairUpdate (hawking-pairs.mjs): mutates `p` (a createCpuParticleSystem particle). `p.params` carries
 * `phase` (cycles: the timeline phase divided by the period), `pace`, `fade`.
 */
export function hawkingPairUpdateCpu(p) {
  const { phase, pace, fade } = p.params;
  const dir = [p.velocity.x, p.velocity.y, p.velocity.z], family = p.velocity.w;
  const energy = p.attr.x, offset = p.attr.y, segment = p.attr.z;
  const S = HAWKING_PAIR.segments, R = HAWKING_PAIR.horizon;
  const local = fract(phase - offset);
  const along = segment / (S - 1);
  let pos, alpha;
  const envelope = Math.pow(Math.sin(Math.PI * Math.min(1, local)), 0.7) * fade;
  if (family < 0.5) {
    const lagged = Math.max(0, local - HAWKING_PAIR.tailSpan * along);
    const rad = R * 1.08 + lagged * (4.6 * pace + energy * 0.22);
    // swirl = normalize(dir x up) * 0.55 (the x axis when dir is (anti)parallel to up)
    let sx = dir[1] * 0 - dir[2] * 1, sy = dir[2] * 0 - dir[0] * 0, sz = dir[0] * 1 - dir[1] * 0;
    let sl = Math.hypot(sx, sy, sz);
    if (sl * sl < 1e-4) { sx = 1; sy = 0; sz = 0; sl = 1; }
    const k = SWIRL / sl * lagged * lagged;
    pos = [dir[0] * rad + sx * k, dir[1] * rad + sy * k, dir[2] * rad + sz * k];
    alpha = HAWKING_PAIR.escapeAlpha * envelope * (segment === 0 ? 1 : HAWKING_PAIR.tailAlpha / HAWKING_PAIR.escapeAlpha * Math.pow(1 - along, 1.5));
  } else {
    const rad = Math.max(R * 0.2, R * 2.2 - local * R * 1.9);
    const tail = HAWKING_PAIR.fallTail * along;
    pos = [dir[0] * (rad + tail), dir[1] * (rad + tail), dir[2] * (rad + tail)];
    alpha = HAWKING_PAIR.fallAlpha * envelope * (segment === 0 ? 1 : HAWKING_PAIR.tailAlpha / HAWKING_PAIR.fallAlpha * Math.pow(1 - along, 1.5));
  }
  p.position.x = pos[0]; p.position.y = pos[1]; p.position.z = pos[2]; p.position.w = alpha;
}
