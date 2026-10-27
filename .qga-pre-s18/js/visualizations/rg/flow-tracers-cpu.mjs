/**
 * RG flow tracers (S08), the pure part: the streamlines resampled to uniform arc length into a lookup table, the rig of per-tracer
 * constants, and the CPU mirror of the GPU update. Imports in Node.
 *
 * The streamlines themselves stay on the CPU, computed once from the shared beta functions (js/science/rg-flow-3d.mjs); nothing about the
 * physics is duplicated in a shader. The GPU only walks them: a tracer is `u = fract(offset + time * SPEED)` along its run, and its
 * position is the table lerp at `u`. The table is uploaded once.
 */

export const TRACER = Object.freeze({ speed: 0.055, frozenShift: 0.35, perRun: 5, samples: 256 });

/**
 * Resamples each run (`{ pts: [{x,y,z}], cum: [...], total }`, the flow-field's arc-length tables) to `samples` points of uniform arc length.
 * Row r of the table is run r: `data[(r * samples + k) * 4 .. +2]` is position k, w = 1.
 */
export function resampleRuns(runs, samples = TRACER.samples) {
  if (!Number.isInteger(samples) || samples < 2) throw new RangeError(`resampleRuns: samples must be an integer >= 2, got ${samples}`);
  const data = new Float32Array(Math.max(1, runs.length) * samples * 4);
  runs.forEach((run, row) => {
    let seg = 0;
    for (let k = 0; k < samples; k++) {
      const target = (k / (samples - 1)) * run.total;
      while (seg < run.cum.length - 2 && run.cum[seg + 1] <= target) seg++;
      const span = run.cum[seg + 1] - run.cum[seg] || 1;
      const f = Math.min(1, Math.max(0, (target - run.cum[seg]) / span));
      const a = run.pts[seg], b = run.pts[seg + 1];
      const o = (row * samples + k) * 4;
      data[o] = a.x + (b.x - a.x) * f; data[o + 1] = a.y + (b.y - a.y) * f; data[o + 2] = a.z + (b.z - a.z) * f; data[o + 3] = 1;
    }
  });
  return { data, rows: runs.length, samples };
}

/** Initial buffers: attr = (run row, cycle offset, direction +1 UV / -1 IR, 0), one tracer per element. */
export function buildTracerRig(runs, perRun = TRACER.perRun) {
  const items = [];
  runs.forEach((run, ri) => {
    for (let k = 0; k < perRun; k++) items.push({ row: ri, offset: (k + (ri % 3) * 0.17) / perRun, dir: run.dir });
  });
  const count = items.length;
  const attr = new Float32Array(Math.max(1, count) * 4);
  items.forEach((it, i) => attr.set([it.row, it.offset, it.dir, 0], i * 4));
  return { count, attr, position: new Float32Array(Math.max(1, count) * 4), items };
}

const fract = (x) => x - Math.floor(x);

/** The table lerp at `u` in [0, 1] for table row `row` (the mirror of the kernel's two texel loads). */
export function tableSample(table, row, u) {
  const x = Math.min(1, Math.max(0, u)) * (table.samples - 1);
  const i0 = Math.min(table.samples - 1, Math.floor(x)), i1 = Math.min(table.samples - 1, i0 + 1), f = x - i0;
  const a = (row * table.samples + i0) * 4, b = (row * table.samples + i1) * 4;
  return [0, 1, 2].map((c) => table.data[a + c] + (table.data[b + c] - table.data[a + c]) * f);
}

/**
 * The mirror of tracerUpdate (flow-tracers.mjs) for createCpuParticleSystem: `p.params` carries `time` (seconds) and `motion` (0 freezes the
 * tracers on a fixed phase, so captures are deterministic). Writes position.xyz and age = u (the position along the run).
 */
export function makeTracerUpdateCpu(table) {
  return (p) => {
    const u = p.params.motion < 0.5 ? fract(p.attr.y + TRACER.frozenShift) : fract(p.attr.y + p.params.time * TRACER.speed);
    const [x, y, z] = tableSample(table, Math.round(p.attr.x), u);
    p.position.x = x; p.position.y = y; p.position.z = z; p.position.w = 1;
    p.age = u;
  };
}
