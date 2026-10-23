// GPU compute particles (S08, closes the particle part of F-27): on the node renderer's WebGL2 backend (what CI runs: Chromium with
// no WebGPU adapter) every system computes what its CPU reference computes, a run is deterministic in its seed, nothing is uploaded after
// creation, and what is drawn is what was computed.

import { test, expect } from "playwright/test";
import { gotoReady } from "./helpers.mjs";

test.setTimeout(300_000);
const TOLERANCE = 1e-4;

/** Shared page setup: a node renderer on the WebGL2 backend, and the modules under test. */
async function boot(page, context) {
  await context.addInitScript(() => { sessionStorage.setItem("horizon-intro", "1"); });
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await gotoReady(page, "/?view=glossary", ["fonts", "view-mounted"], { timeoutMs: 200_000 });
  return errors;
}

test("every GPU system equals its CPU reference after 60 fixed steps, on the node WebGL2 backend", async ({ page, context }) => {
  const errors = await boot(page, context);
  const result = await page.evaluate(async () => {
    const T = await import("three");
    const W = await import("three/webgpu");
    const P = await import("/js/render/compute/particles.mjs");
    const C = await import("/js/render/compute/particles-cpu.mjs");
    const B = await import("/js/render/compute/ballistic.mjs");
    const BC = await import("/js/render/compute/ballistic-cpu.mjs");
    const H = await import("/js/visualizations/blackhole/hawking-pairs.mjs");
    const HC = await import("/js/visualizations/blackhole/hawking-pairs-cpu.mjs");
    const R = await import("/js/visualizations/rg/flow-tracers.mjs");
    const RC = await import("/js/visualizations/rg/flow-tracers-cpu.mjs");
    const Q = await import("/js/visualizations/qft/field-peaks.mjs");
    const QC = await import("/js/visualizations/qft/field-peaks-cpu.mjs");
    const science = await import("/js/science/qft-fields.mjs");
    const canvas = document.createElement("canvas");
    const renderer = new W.WebGPURenderer({ canvas, forceWebGL: true });
    await renderer.init();
    const diff = (a, b) => { let max = 0; for (let i = 0; i < a.length; i++) max = Math.max(max, Math.abs(a[i] - b[i])); return max; };
    const out = { backend: renderer.backend.isWebGPUBackend ? "webgpu" : "webgl2" };

    // 1. the reference system
    {
      const gpu = P.createParticleSystem({ count: 256, seed: 11, init: B.ballisticInit, update: B.ballisticUpdate, render: { sizePx: 3 } });
      const cpu = C.createCpuParticleSystem({ count: 256, seed: 11, init: BC.ballisticInit, update: BC.ballisticUpdate });
      gpu.init(renderer); cpu.init();
      for (let i = 0; i < 60; i++) { gpu.step(renderer, 1 / 60); cpu.advance(1 / 60); }
      const r = await gpu.readback(renderer);
      out.ballistic = { position: diff(r.position, cpu.buffers.position), velocity: diff(r.velocity, cpu.buffers.velocity), age: diff(r.age, cpu.buffers.age), attr: diff(r.attr, cpu.buffers.attr) };
    }

    // 2. the Hawking pair field: closed form of the phase
    {
      const mk = (n, escapes) => Array.from({ length: n }, (_, i) => ({ energyOverT: 2 + (i % 7), azimuth: i * 0.9, cosPolar: escapes ? 0.3 + 0.05 * (i % 12) : 0.05 * (i % 5), escapes }));
      const escaping = mk(40, true), falling = mk(12, false);
      const colors = { hotColor: new T.Color(1, 0.5, 0.2), fallColor: new T.Color(0.5, 0.1, 0.1), pace: 0.8, fade: 0.9 };
      const gpu = H.createHawkingPairs({ escaping, falling, ...colors });
      const rig = HC.buildPairRig({ escaping, falling });
      const cpu = C.createCpuParticleSystem({ count: rig.count, initial: { velocity: rig.velocity, attr: rig.attr, position: rig.position }, params: { phase: 0, pace: 0.8, fade: 0.9 }, update: HC.hawkingPairUpdateCpu });
      gpu.init(renderer); cpu.init();
      for (let i = 0; i < 60; i++) { const phase = (i / 60) * 1.7; gpu.setPhase(phase); gpu.step(renderer, 1 / 60); cpu.params.phase = phase; cpu.advance(1 / 60); }
      const r = await gpu.readback(renderer);
      const xyz = [], alpha = [];
      for (let i = 0; i < rig.count; i++) { for (let c = 0; c < 3; c++) xyz.push(Math.abs(r.position[i * 4 + c] - cpu.buffers.position[i * 4 + c])); alpha.push(Math.abs(r.position[i * 4 + 3] - cpu.buffers.position[i * 4 + 3])); }
      out.hawking = { count: rig.count, position: Math.max(...xyz), opacity: Math.max(...alpha) };
    }

    // 3. the RG tracers: a table lookup along resampled streamlines
    {
      const run = (offset, dir, points) => {
        const pts = Array.from({ length: points }, (_, i) => ({ x: offset + i * 0.4, y: i * 0.3 + i * i * 0.01, z: Math.sin(i * 0.7) * 0.8 }));
        const cum = [0];
        for (let i = 1; i < points; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z));
        return { pts, cum, total: cum[cum.length - 1], dir };
      };
      const runs = [run(0, 1, 40), run(2, -1, 25), run(-3, 1, 60)];
      const gpu = R.createFlowTracers({ runs, uvColor: new T.Color(0, 1, 1), irColor: new T.Color(1, 0.7, 0) });
      const rig = RC.buildTracerRig(runs);
      const cpu = C.createCpuParticleSystem({ count: rig.count, initial: { attr: rig.attr, position: rig.position }, params: { time: 0, motion: 1 }, update: RC.makeTracerUpdateCpu(gpu.table) });
      gpu.init(renderer); cpu.init();
      for (let i = 0; i < 60; i++) { gpu.setClock(i / 6, 1); gpu.step(renderer, 1 / 60); cpu.params.time = i / 6; cpu.advance(1 / 60); }
      const r = await gpu.readback(renderer);
      out.tracers = { count: rig.count, position: diff(r.position, cpu.buffers.position), age: diff(r.age, cpu.buffers.age) };
      gpu.setClock(3, 0); gpu.step(renderer, 1 / 60);
      const frozenA = (await gpu.readback(renderer)).position.slice();
      gpu.setClock(77, 0); gpu.step(renderer, 1 / 60);
      out.tracers.frozen = diff(frozenA, (await gpu.readback(renderer)).position);
    }

    // 4. the QFT crest markers: the closed-form field from a uniform mode table
    {
      const field = science.buildFourierModes({ seed: 42 });
      const nx = 160;
      const gpu = Q.createFieldPeaks({ field, nx, color: new T.Color(1, 1, 1) });
      const rig = QC.buildPeakRig(nx);
      const cpu = C.createCpuParticleSystem({ count: rig.count, initial: { velocity: rig.velocity, position: rig.position }, params: { time: 0, nx }, update: QC.makePeakUpdateCpu(field) });
      gpu.init(renderer); cpu.init();
      const mismatches = [];
      for (const t of [0, 0.45, 2.7, 5.4]) {
        gpu.setTime(t); gpu.step(renderer, 0); cpu.params.time = t; cpu.advance(0);
        const r = await gpu.readback(renderer);
        let maskMismatch = 0, shown = 0;
        for (let e = 0; e < rig.count; e++) {
          const g = r.position[e * 4 + 3] > 0, c = cpu.buffers.position[e * 4 + 3] > 0;
          if (g !== c) maskMismatch += 1;
          if (g && c) shown += 1;
        }
        // positions of the crests both agree on
        const both = [];
        for (let e = 0; e < rig.count; e++) if (r.position[e * 4 + 3] > 0 && cpu.buffers.position[e * 4 + 3] > 0) both.push(Math.abs(r.position[e * 4 + 1] - cpu.buffers.position[e * 4 + 1]));
        mismatches.push({ t, maskMismatch, shown, position: Math.max(0, ...both) });
      }
      out.peaks = mismatches;
    }
    renderer.dispose();
    return out;
  });
  expect(result.backend).toBe("webgl2");
  for (const [name, value] of Object.entries(result.ballistic)) expect(value, `ballistic ${name}`).toBeLessThanOrEqual(TOLERANCE);
  expect(result.hawking.count).toBe(52 * 7);
  expect(result.hawking.position, "hawking pair positions").toBeLessThanOrEqual(TOLERANCE);
  // Opacity runs through pow(sin(.), 0.7): positions agree to 1e-6, but sin and pow on the software rasteriser are accurate to about
  // 1e-4, so the display value gets 5x the budget (D-040).
  expect(result.hawking.opacity, "hawking pair opacity").toBeLessThanOrEqual(5 * TOLERANCE);
  expect(result.tracers.count).toBe(15);
  expect(result.tracers.position, "tracer positions").toBeLessThanOrEqual(TOLERANCE);
  expect(result.tracers.age, "tracer run parameter").toBeLessThanOrEqual(TOLERANCE);
  expect(result.tracers.frozen, "reduced motion freezes the tracers").toBe(0);
  for (const row of result.peaks) {
    expect(row.shown, `crests at t = ${row.t}`).toBeGreaterThan(0);
    expect(row.maskMismatch, `crest mask at t = ${row.t}`).toBe(0);
    // 24 cosines of arguments up to ~100 rad, each good to ~1e-4 on the software rasteriser (D-040); the crest mask matches exactly.
    expect(row.position, `crest height at t = ${row.t}: ${row.position}`).toBeLessThanOrEqual(1e-3);
  }
  expect(errors).toEqual([]);
});

test("a run is deterministic in its seed: the same seed reproduces, another seed differs", async ({ page, context }) => {
  const errors = await boot(page, context);
  const result = await page.evaluate(async () => {
    const W = await import("three/webgpu");
    const P = await import("/js/render/compute/particles.mjs");
    const B = await import("/js/render/compute/ballistic.mjs");
    const canvas = document.createElement("canvas");
    const renderer = new W.WebGPURenderer({ canvas, forceWebGL: true });
    await renderer.init();
    const run = async (seed) => {
      const system = P.createParticleSystem({ count: 512, seed, init: B.ballisticInit, update: B.ballisticUpdate, render: { sizePx: 3 } });
      system.init(renderer);
      for (let i = 0; i < 90; i++) system.step(renderer, 1 / 60);
      const state = await system.readback(renderer);
      return { position: Array.from(state.position), age: Array.from(state.age) };
    };
    const first = await run(7), again = await run(7), other = await run(8);
    // the same system re-initialised
    const system = P.createParticleSystem({ count: 512, seed: 7, init: B.ballisticInit, update: B.ballisticUpdate, render: { sizePx: 3 } });
    const sequence = [];
    for (let round = 0; round < 3; round++) {
      system.init(renderer);
      for (let i = 0; i < 90; i++) system.step(renderer, 1 / 60);
      sequence.push(Array.from((await system.readback(renderer)).position));
    }
    const same = (a, b) => a.length === b.length && a.every((value, i) => value === b[i]);
    renderer.dispose();
    return {
      sameSeed: same(first.position, again.position) && same(first.age, again.age), otherSeed: same(first.position, other.position),
      reinit: same(sequence[0], sequence[1]) && same(sequence[1], sequence[2]), matchesFresh: same(sequence[0], first.position),
    };
  });
  expect(result.sameSeed, "two systems with one seed are bitwise identical").toBe(true);
  expect(result.otherSeed, "a different seed gives a different run").toBe(false);
  expect(result.reinit, "re-initialising reproduces the run").toBe(true);
  expect(result.matchesFresh, "a re-initialised run equals a fresh one").toBe(true);
  expect(errors).toEqual([]);
});

test("nothing is uploaded after creation, and what is drawn is what was computed", async ({ page, context }) => {
  const errors = await boot(page, context);
  const result = await page.evaluate(async () => {
    const T = await import("three");
    const W = await import("three/webgpu");
    const P = await import("/js/render/compute/particles.mjs");
    const B = await import("/js/render/compute/ballistic.mjs");
    const C = await import("/js/render/compute/particles-cpu.mjs");
    const BC = await import("/js/render/compute/ballistic-cpu.mjs");
    const WIDTH = 400, HEIGHT = 300;
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH; canvas.height = HEIGHT;
    const renderer = new W.WebGPURenderer({ canvas, forceWebGL: true, antialias: false });
    await renderer.init();
    renderer.setSize(WIDTH, HEIGHT, false); renderer.setPixelRatio(1); renderer.outputColorSpace = T.SRGBColorSpace;
    const camera = new T.OrthographicCamera(-WIDTH / 2, WIDTH / 2, HEIGHT / 2, -HEIGHT / 2, -500, 500);   // one world unit is one pixel
    const SCALE = 60;
    const system = P.createParticleSystem({
      count: 200, seed: 3, init: B.ballisticInit, update: B.ballisticUpdate,
      render: { sizePx: 7, profile: "disc", additive: false, color: [1, 1, 1] },
    });
    system.object.scale.setScalar(SCALE);                  // spread the unit-scale burst over the view
    const scene = new T.Scene(); scene.background = new T.Color(0, 0, 0); scene.add(system.object);
    await renderer.compileAsync(scene, camera);
    system.init(renderer);
    renderer.render(scene, camera);

    // Count needsUpdate assignments on every buffer attribute and texture from here on.
    let uploads = 0;
    const patch = (proto) => {
      const descriptor = Object.getOwnPropertyDescriptor(proto, "needsUpdate");
      Object.defineProperty(proto, "needsUpdate", { ...descriptor, set(value) { if (value === true) uploads += 1; descriptor.set.call(this, value); } });
    };
    patch(T.BufferAttribute.prototype); patch(T.Texture.prototype);
    const cpu = C.createCpuParticleSystem({ count: 200, seed: 3, init: BC.ballisticInit, update: BC.ballisticUpdate });
    cpu.init();
    for (let i = 0; i < 40; i++) { system.step(renderer, 1 / 60); cpu.advance(1 / 60); renderer.render(scene, camera); }
    const during = uploads;

    // Draw the final state and look for the particles at their computed positions.
    const bitmap = await createImageBitmap(canvas);
    const copy = document.createElement("canvas"); copy.width = WIDTH; copy.height = HEIGHT;
    const context2d = copy.getContext("2d", { willReadFrequently: true });
    context2d.drawImage(bitmap, 0, 0);
    const pixels = context2d.getImageData(0, 0, WIDTH, HEIGHT).data;
    let found = 0, inView = 0;
    for (let i = 0; i < 200; i++) {
      const x = Math.round(WIDTH / 2 + cpu.buffers.position[i * 4] * SCALE), y = Math.round(HEIGHT / 2 - cpu.buffers.position[i * 4 + 1] * SCALE);
      if (x < 4 || y < 4 || x >= WIDTH - 4 || y >= HEIGHT - 4) continue;
      inView += 1;
      if (pixels[(y * WIDTH + x) * 4 + 1] > 128) found += 1;
    }
    let lit = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 1] > 128) lit += 1;
    renderer.dispose();
    return { during, found, inView, lit };
  });
  expect(result.during, "needsUpdate assignments over 40 frames of step + render").toBe(0);
  expect(result.inView).toBeGreaterThan(40);
  expect(result.found / result.inView, `${result.found} of ${result.inView} particles drawn where the CPU reference puts them`).toBeGreaterThan(0.97);
  expect(result.lit, "the picture is not just one big blob").toBeLessThan(200 * 60);
  expect(errors).toEqual([]);
});
