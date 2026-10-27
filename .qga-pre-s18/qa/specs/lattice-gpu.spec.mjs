// The GPU phi^4 lattice (S14, js/visualizations/qft/lattice-gpu.mjs) against its CPU reference (js/science/lattice-field.mjs).
//
//   steps     200 steps on a 64 x 64 lattice: phi and the staggered pi equal the CPU integrator's, max abs difference < 1e-3 (float32)
//   display   the analyse pass writes the synchronised momentum, the squared gradient and the energy density the CPU computes
//   kick      one click's Gaussian kick equals the CPU kick followed by one step
//   upload    nothing is written from the CPU after creation (the buffers' versions stay put over 40 steps and an analysis)
//   readback  a readback before any kernel ran does not poison the buffers (r186 WebGL2 leaves an empty backend record)
//   repeat    two lattices with one start are bitwise identical after 50 steps
//   variable  a change of step length keeps the half-step offset: equal to the variable-step CPU leapfrog
//
// webgl2  the node renderer's WebGL2 backend (forceWebGL): what CI runs, Chromium with no WebGPU adapter.
// webgpu  a Chromium started with the software (SwiftShader) adapter; reported as an annotation when the browser has no adapter.

import { test, expect, chromium } from "playwright/test";

const PAGE = "/__lattice-gpu.html";
const IMPORT_MAP = {
  imports: {
    three: "/vendor/three/build/three.module.js",
    "three/webgpu": "/vendor/three/build/three.webgpu.js",
    "three/tsl": "/vendor/three/build/three.tsl.js",
  },
};
const WEBGPU_ARGS = ["--enable-unsafe-webgpu", "--enable-features=Vulkan,WebGPU", "--use-angle=swiftshader", "--use-webgpu-adapter=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const TOLERANCE = 1e-3;

test.setTimeout(240_000);

async function openHarness(page, baseURL) {
  await page.route(`**${PAGE}`, (route) => route.fulfill({
    contentType: "text/html; charset=utf-8",
    body: `<!doctype html><meta charset="utf-8"><title>lattice gpu</title><script type="importmap">${JSON.stringify(IMPORT_MAP)}</script>`,
  }));
  await page.goto(new URL(PAGE, baseURL).href, { waitUntil: "load" });
}

/** Runs in the page on the named backend and returns the numbers the assertions read. */
async function runLattice({ backend }) {
  const W = await import("three/webgpu");
  const L = await import("/js/science/lattice-field.mjs");
  const G = await import("/js/visualizations/qft/lattice-gpu.mjs");
  const renderer = new W.WebGPURenderer({ forceWebGL: backend === "webgl2", antialias: false });
  await renderer.init();
  const actual = renderer.backend.isWebGPUBackend === true ? "webgpu" : "webgl2";
  const diff = (a, b) => { let max = 0; for (let i = 0; i < a.length; i++) max = Math.max(max, Math.abs(a[i] - b[i])); return max; };
  const f32 = (state) => ({ phi: Float32Array.from(state.phi), pi: Float32Array.from(state.pi) });
  const n = 64, spacing = 0.25, dt = 0.1;
  const params = L.createLattice({ dim: 2, n, a: spacing, mass2: 1, lambda: 2, dt });
  const start = L.toStaggered(params, L.wavepacket(params));
  const make = () => {
    return G.createLatticeGpu({ n, spacing, mass2: 1, lambda: 2, start: f32(start), dt });
  };

  // readback before any kernel has written the buffers answers from the start state (and leaves no empty backend record behind)
  const fresh = make();
  const early = await fresh.readback(renderer);
  const startF32 = f32(start);
  const earlyReadback = diff(early.phi, startF32.phi) + diff(early.pi, startF32.pi);
  const displayNeedsAnalyse = await fresh.readback(renderer, ["energy"]).then(() => false, (error) => error instanceof RangeError);
  fresh.analyse(renderer); // as the scene does, before its first step
  fresh.step(renderer, 3, dt);
  const stepped = await fresh.readback(renderer, ["phi", "energy"]);
  const earlyThenStep = stepped.phi.every(Number.isFinite) && stepped.energy.every(Number.isFinite);

  // steps + display
  const lattice = make();
  lattice.step(renderer, 200, dt);
  lattice.analyse(renderer);
  const gpu = await lattice.readback(renderer, ["phi", "pi", "energy", "momentum", "gradient"]);
  const reference = L.stepStaggered(params, start, 200);
  const synchronised = L.fromStaggered(params, reference);
  const density = L.energyDensity(params, synchronised);
  const terms = L.energyTerms(params, synchronised);
  const scale = Math.max(...density);
  const out = {
    actual, earlyReadback, displayNeedsAnalyse, earlyThenStep, steps: lattice.steps, time: lattice.time,
    phi: diff(gpu.phi, reference.phi), pi: diff(gpu.pi, reference.pi),
    momentum: diff(gpu.momentum, synchronised.pi), gradient: diff(gpu.gradient, terms.gradient.map((v) => 2 * v)),
    energy: diff(gpu.energy, density) / scale,
  };

  // upload: the CPU wrote the buffers once, at creation
  const versions = () => Object.values(lattice.buffers).map((buffer) => buffer.value.version);
  const before = versions();
  lattice.step(renderer, 40, dt);
  lattice.analyse(renderer);
  out.versionsUnchanged = JSON.stringify(before) === JSON.stringify(versions());

  // repeat: bitwise identical
  const a = make(), b = make();
  a.step(renderer, 50, dt); b.step(renderer, 50, dt);
  const [ra, rb] = [await a.readback(renderer), await b.readback(renderer)];
  out.identical = ra.phi.every((v, i) => v === rb.phi[i]) && ra.pi.every((v, i) => v === rb.pi[i]);

  // kick: the Gaussian bump added to the momentum in the first pass, then cleared
  const kicked = make();
  const { amplitude, width } = L.kickParameters(params, 7);
  kicked.kick({ x: 10, y: 20, amplitude, width });
  kicked.step(renderer, 1, dt);
  const afterKick = await kicked.readback(renderer);
  const bump = L.kick(params, { phi: new Float64Array(n * n), pi: new Float64Array(n * n) }, { site: [10, 20], seed: 7 }).pi;
  const expected = L.stepStaggered(params, { phi: start.phi, pi: start.pi.map((v, i) => v + bump[i]) }, 1);
  out.kick = { phi: diff(afterKick.phi, expected.phi), pi: diff(afterKick.pi, expected.pi), peak: Math.max(...bump) };
  kicked.step(renderer, 1, dt);
  const second = await kicked.readback(renderer);
  const quiet = L.stepStaggered(params, expected, 1);
  out.kickCleared = diff(second.pi, quiet.pi);
  // a change of step length (the quality governor): 30 steps of 0.1, then 30 of 0.05, against the variable-step CPU leapfrog
  const varied = make();
  varied.step(renderer, 30, 0.1); varied.step(renderer, 30, 0.05);
  const schedule = [...Array(30).fill(0.1), ...Array(30).fill(0.05)];
  const variedReference = L.stepStaggeredVariable(params, start, schedule, dt);
  const variedGpu = await varied.readback(renderer);
  out.variable = { phi: diff(variedGpu.phi, variedReference.phi), pi: diff(variedGpu.pi, variedReference.pi), time: varied.time };
  renderer.dispose();
  return out;
}

function expectMatches(result, backend) {
  expect(result.actual).toBe(backend);
  expect(result.steps).toBe(200);
  expect(result.time).toBeCloseTo(20, 9);
  expect(result.phi, "phi after 200 steps vs the CPU integrator").toBeLessThan(TOLERANCE);
  expect(result.pi, "staggered pi after 200 steps vs the CPU integrator").toBeLessThan(TOLERANCE);
  expect(result.momentum, "synchronised pi").toBeLessThan(TOLERANCE);
  expect(result.gradient, "squared gradient").toBeLessThan(TOLERANCE);
  expect(result.energy, "energy density relative to its peak").toBeLessThan(TOLERANCE);
  expect(result.earlyReadback, "a readback before the first step is the start state").toBe(0);
  expect(result.displayNeedsAnalyse, "the display buffers need analyse() first").toBe(true);
  expect(result.earlyThenStep, "a readback before the first step does not break the first kernel").toBe(true);
  expect(result.versionsUnchanged, "no CPU upload after creation").toBe(true);
  expect(result.identical, "two lattices with one start are bitwise identical").toBe(true);
  expect(result.kick.peak).toBeGreaterThan(1);
  expect(result.kick.phi).toBeLessThan(TOLERANCE);
  expect(result.kick.pi, "the kick equals the CPU kick followed by one step").toBeLessThan(TOLERANCE);
  expect(result.kickCleared, "the kick is applied once").toBeLessThan(TOLERANCE);
  expect(result.variable.phi, "phi after the step length changes").toBeLessThan(TOLERANCE);
  expect(result.variable.pi, "pi after the step length changes").toBeLessThan(TOLERANCE);
  expect(result.variable.time).toBeCloseTo(4.5, 9);
}

test("webgl2: 200 steps, the display buffers, a kick, no uploads, bitwise repeatability, against the CPU reference", async ({ page, baseURL }, info) => {
  await openHarness(page, baseURL);
  const result = await page.evaluate(runLattice, { backend: "webgl2" });
  await info.attach("lattice-gpu-webgl2.json", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
  console.log(`[lattice-gpu] webgl2: ${JSON.stringify(result)}`);
  expectMatches(result, "webgl2");
});

test("webgpu: the same checks on the software WebGPU adapter when the browser has one", async ({ baseURL }, info) => {
  const browser = await chromium.launch({ args: WEBGPU_ARGS });
  try {
    const page = await browser.newPage();
    await openHarness(page, baseURL);
    const hasAdapter = await page.evaluate(async () => !!(navigator.gpu && await navigator.gpu.requestAdapter().catch(() => null)));
    if (!hasAdapter) {
      info.annotations.push({ type: "backend-unavailable", description: "no WebGPU adapter in this browser; the webgl2 run is the CI gate" });
      test.skip(true, "no WebGPU adapter in this browser");
      return;
    }
    const result = await page.evaluate(runLattice, { backend: "webgpu" });
    await info.attach("lattice-gpu-webgpu.json", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
    console.log(`[lattice-gpu] webgpu: ${JSON.stringify(result)}`);
    expectMatches(result, "webgpu");
  } finally {
    await browser.close();
  }
});
