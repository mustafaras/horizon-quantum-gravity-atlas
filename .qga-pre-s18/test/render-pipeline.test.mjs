import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { EFFECT_ORDER, planRenderPipeline, createRenderPipeline } from "../js/render/render-pipeline.mjs";
import { attachWebGPUValidation, drainWebGPUValidation, getWebGPUValidation } from "../js/render/webgpu-validation.mjs";
import WebGPUPipelineUtils from "three/src/renderers/webgpu/utils/WebGPUPipelineUtils.js";

const quality = { postEffects: true, temporalSamples: 4, ssgi: true, raySteps: 96 };
const capabilities = { ssgi: true, velocity: true, perspectiveCamera: true, godRays: true };
const source = { isDirectionalLight: true, castShadow: true };
const plan = (options = {}) => planRenderPipeline({ backend: "webgpu", quality, capabilities, source, ...options });
const entry = (effects, name) => effects.find((effect) => effect.name === name);

test("graph is ordered, immutable and reports each effect exactly once", () => {
  const effects = plan({ fullMotion: true });
  assert.deepEqual(effects.map(({ name }) => name), EFFECT_ORDER);
  assert.equal(new Set(EFFECT_ORDER).size, EFFECT_ORDER.length);
  assert.ok(Object.isFrozen(effects));
  for (const effect of effects) {
    assert.ok(Object.isFrozen(effect));
    assert.ok(["enabled", "disabled", "unsupported"].includes(effect.status));
    assert.ok(effect.reason.length > 0);
  }
  assert.equal(entry(effects, "ssgi").status, "enabled");
  assert.equal(entry(effects, "motion-blur").status, "enabled");
});

test("classic fallback never advertises absent upstream effects", () => {
  const effects = plan({ backend: "webgl2", fullMotion: true });
  for (const name of ["ao", "bloom", "depth-of-field", "chromatic-aberration", "film-grain", "vignette", "tone-mapping"]) {
    assert.equal(entry(effects, name).status, "enabled", name);
  }
  for (const name of ["ssgi", "god-rays", "temporal-aa", "motion-blur", "lens-dirt", "lens-flare"]) {
    assert.equal(entry(effects, name).status, "unsupported", name);
  }
});

test("scientific, minimal and capture presets protect scientific legibility", () => {
  const scientific = plan({ preset: "scientific", fullMotion: true });
  for (const name of ["bloom", "depth-of-field", "motion-blur", "chromatic-aberration", "film-grain", "vignette"]) {
    assert.equal(entry(scientific, name).status, "disabled", name);
  }
  for (const name of ["base-render", "ao", "temporal-aa", "tone-mapping"]) {
    assert.equal(entry(scientific, name).status, "enabled", name);
  }
  for (const options of [{ preset: "minimal" }, { quality: { ...quality, postEffects: false } }]) {
    assert.deepEqual(plan(options).filter(({ status }) => status === "enabled").map(({ name }) => name), ["base-render", "tone-mapping"]);
  }
  const capture = plan({ preset: "capture", fullMotion: true });
  for (const name of ["film-grain", "motion-blur", "depth-of-field", "chromatic-aberration", "lens-flare"]) {
    assert.equal(entry(capture, name).status, "disabled", name);
  }
});

test("reduced motion removes temporal camera effects, motion blur and animated grain", () => {
  const effects = plan({ reducedMotion: true, fullMotion: true });
  for (const name of ["temporal-aa", "motion-blur", "film-grain", "depth-of-field"]) {
    assert.equal(entry(effects, name).status, "disabled", name);
  }
  assert.equal(entry(effects, "ao").status, "enabled");
});

test("SSGI, source light, projection and velocity capabilities are gated independently", () => {
  assert.equal(entry(plan({ source: null }), "god-rays").status, "disabled");
  assert.equal(entry(plan({ source: {} }), "god-rays").status, "unsupported");
  assert.equal(entry(plan({ quality: { ...quality, ssgi: false } }), "ssgi").status, "disabled");
  assert.equal(entry(plan({ capabilities: { ...capabilities, ssgi: false } }), "ssgi").status, "unsupported");
  const noVelocity = plan({ capabilities: { ...capabilities, velocity: false }, fullMotion: true });
  assert.equal(entry(noVelocity, "temporal-aa").status, "unsupported");
  assert.equal(entry(noVelocity, "motion-blur").status, "unsupported");
  assert.equal(entry(plan({ quality: { ...quality, temporalSamples: 1 } }), "temporal-aa").status, "disabled");
  const orthographic = plan({ capabilities: { ...capabilities, perspectiveCamera: false } });
  assert.equal(entry(orthographic, "ssgi").status, "unsupported");
  assert.equal(entry(orthographic, "depth-of-field").status, "unsupported");
});

test("invalid physical depth rejects every requested depth-dependent effect on either renderer path", () => {
  const depthEffects = ["ao", "ssgi", "god-rays", "depth-of-field", "temporal-aa", "motion-blur"];
  for (const options of [
    { backend: "webgpu" },
    { backend: "webgl2" },
    { backend: "webgl2", capabilities: { ...capabilities, nodePipeline: true } },
  ]) {
    const baseline = plan({ ...options, fullMotion: true });
    const effects = plan({ ...options, fullMotion: true, depthValid: false });
    assert.deepEqual(effects.map(({ name }) => name), EFFECT_ORDER);
    for (const effect of effects) {
      if (depthEffects.includes(effect.name)) {
        assert.equal(effect.status, "unsupported", effect.name);
        assert.match(effect.reason, /physical depth/i, effect.name);
      } else {
        assert.deepEqual(effect, entry(baseline, effect.name));
      }
    }
  }
});

test("physical depth defaults to valid without changing standard-scene graph policy", () => {
  for (const backend of ["webgpu", "webgl2"]) {
    assert.deepEqual(plan({ backend, fullMotion: true }), plan({ backend, fullMotion: true, depthValid: true }));
  }
});

test("invalid depth preserves effects already disabled by presets, quality and motion policy", () => {
  for (const options of [
    { preset: "minimal" },
    { preset: "scientific" },
    { preset: "capture" },
    { quality: { ...quality, postEffects: false } },
    { reducedMotion: true },
    { quality: { ...quality, ssgi: false, temporalSamples: 1 }, source: null, fullMotion: false },
  ]) {
    const baseline = plan(options);
    const effects = plan({ ...options, depthValid: false });
    for (const effect of baseline.filter(({ status }) => status === "disabled")) {
      assert.deepEqual(entry(effects, effect.name), effect);
    }
  }
});

test("WebGPURenderer with a WebGL2 backend retains its real TSL capabilities", () => {
  const effects = plan({
    backend: "webgl2", fullMotion: true,
    capabilities: { ...capabilities, nodePipeline: true },
  });
  for (const name of ["ssgi", "god-rays", "temporal-aa", "motion-blur", "lens-flare"]) {
    assert.equal(entry(effects, name).status, "enabled", name);
  }
  assert.match(entry(effects, "temporal-aa").reason, /fixed 32/);
});

test("static graph is explicit and invalid configuration fails rather than silently changing presets", async () => {
  assert.ok(plan({ backend: "static" }).every(({ status }) => status === "unsupported"));
  assert.throws(() => plan({ backend: "unknown" }), /backend/);
  assert.throws(() => plan({ preset: "unknown" }), /preset/);
  await assert.rejects(createRenderPipeline({ backend: "webgpu", renderer: {}, scene: {}, camera: {} }), /WebGPURenderer/);
  await assert.rejects(createRenderPipeline({ backend: "webgl2", renderer: {}, scene: {}, camera: {} }), /WebGLRenderer/);
});

test("raw GLSL is rejected before a node renderer initializes, even on its WebGL2 backend", async () => {
  let initialized = false;
  const renderer = { isWebGPURenderer: true, init: () => { initialized = true; } };
  const scene = {
    traverse(callback) { callback({ material: { isShaderMaterial: true, name: "legacy GLSL" } }); },
  };
  await assert.rejects(createRenderPipeline({
    backend: "webgl2", renderer, scene, camera: { isCamera: true },
  }), /raw GLSL.*legacy GLSL/);
  assert.equal(initialized, false);
});

test("minimal classic lifecycle prewarms once, draws synchronously and owns no renderer disposal", async () => {
  const { Scene, PerspectiveCamera, Color } = await import("three");
  const scene = new Scene();
  const camera = new PerspectiveCamera();
  let draws = 0;
  let compiles = 0;
  let target = null;
  const renderer = {
    isWebGLRenderer: true, xr: { enabled: false }, autoClear: true,
    getPixelRatio: () => 1, getSize: (value) => value.set(80, 60),
    getRenderTarget: () => target, setRenderTarget: (value) => { target = value; },
    getClearColor: (value) => value.copy(new Color(0)), getClearAlpha: () => 0,
    clear() {}, render() { draws++; },
    compileAsync: async () => { compiles++; },
  };
  const pipeline = await createRenderPipeline({ backend: "webgl2", renderer, scene, camera, preset: "minimal" });
  assert.throws(() => pipeline.render(), /prewarm/);
  assert.throws(() => pipeline.resize(0, 60), /positive/);
  assert.equal(pipeline.prewarmed, false);
  const first = pipeline.prewarm();
  assert.equal(pipeline.prewarm(), first);
  await first;
  assert.equal(compiles, 1);
  assert.equal(pipeline.prewarmed, true);
  const before = draws;
  assert.equal(pipeline.render(0.016), undefined);
  assert.ok(draws > before);
  pipeline.resize(100, 80);
  assert.throws(() => pipeline.render(-1), /nonnegative/);
  pipeline.dispose();
  pipeline.dispose();
  assert.throws(() => pipeline.render(), /disposed/);
  assert.throws(() => pipeline.prewarm(), /disposed/);
  const noDepth = await createRenderPipeline({
    backend: "webgl2", renderer, scene, camera, preset: "scientific", quality, depthValid: false,
  });
  assert.equal(entry(noDepth.effects, "ao").status, "unsupported");
  assert.match(entry(noDepth.effects, "ao").reason, /physical depth/i);
  await noDepth.prewarm();
  noDepth.render(0.016);
  noDepth.dispose();
  const failure = new Error("test shader compilation failed");
  renderer.compileAsync = async () => { throw failure; };
  const broken = await createRenderPipeline({ backend: "webgl2", renderer, scene, camera, preset: "minimal" });
  await assert.rejects(broken.prewarm(), (error) => error === failure);
  assert.equal(broken.prewarmed, false);
  assert.throws(() => broken.render(), /prewarm/);
  broken.dispose();
});

async function createMockNativePipeline({ compileAsync, popErrorScope, lost, render } = {}) {
  const { Scene, PerspectiveCamera } = await import("three");
  let target = null;
  let mrt = null;
  const renderer = {
    isWebGPURenderer: true, init: async () => {}, hasFeature: () => true,
    xr: { enabled: false },
    backend: {
      isWebGPUBackend: true,
      device: {
        lost: lost ?? new Promise(() => {}),
        pushErrorScope() {},
        popErrorScope: popErrorScope ?? (async () => null),
        queue: { onSubmittedWorkDone: async () => {} },
      },
    },
    getRenderTarget: () => target, setRenderTarget: (value) => { target = value; },
    getMRT: () => mrt, setMRT: (value) => { mrt = value; },
    compileAsync: compileAsync ?? (async () => {}),
    dispose() {},
    onError() {},
    render: render ?? (() => { throw new Error("Unexpected draw after failed or cancelled prewarm"); }),
  };
  renderer.backend.pipelineUtils = new WebGPUPipelineUtils(renderer.backend);
  return createRenderPipeline({
    renderer, backend: "webgpu", scene: new Scene(), camera: new PerspectiveCamera(), preset: "minimal",
  });
}

test("scope rejection preserves the original compilation failure rather than replacing it", async () => {
  const compileFailure = new Error("WGSL compilation failed");
  const scopeFailure = new Error("Instance dropped in popErrorScope");
  const pipeline = await createMockNativePipeline({
    compileAsync: async () => { throw compileFailure; },
    popErrorScope: async () => { throw scopeFailure; },
  });
  await assert.rejects(pipeline.prewarm(), (error) => {
    assert.ok(error instanceof AggregateError);
    assert.deepEqual(error.errors, [compileFailure, scopeFailure]);
    assert.equal(error.cause, compileFailure);
    return true;
  });
  assert.equal(pipeline.prewarmed, false);
  await pipeline.dispose();
});

test("genuine GPU validation errors still reject prewarm rather than reporting success", async () => {
  const pipeline = await createMockNativePipeline({
    render() {},
    popErrorScope: async () => ({ message: "test WGSL validation failure" }),
  });
  await assert.rejects(pipeline.prewarm(), /Pipeline WebGPU validation failed: test WGSL validation failure/);
  assert.equal(pipeline.prewarmed, false);
  await pipeline.dispose();
});

test("dispose waits for an in-flight compile and prevents subsequent graph work", async () => {
  let finishCompile;
  const compiling = new Promise((resolve) => { finishCompile = resolve; });
  let compilations = 0;
  let scopesPopped = 0;
  const pipeline = await createMockNativePipeline({
    compileAsync: () => { compilations++; return compiling; },
    popErrorScope: async () => { scopesPopped++; return null; },
  });
  const warming = pipeline.prewarm();
  const rejected = assert.rejects(warming, /disposed/);
  await Promise.resolve();
  const disposing = pipeline.dispose();
  assert.ok(disposing instanceof Promise);
  assert.equal(pipeline.dispose(), disposing);
  let released = false;
  disposing.then(() => { released = true; });
  await Promise.resolve();
  assert.equal(released, false);
  finishCompile();
  await rejected;
  await disposing;
  assert.equal(released, true);
  assert.equal(compilations, 1);
  assert.equal(scopesPopped, 1);
  assert.equal(pipeline.prewarmed, false);
});

test("device loss during compilation stops before preparing or drawing the node graph", async () => {
  let finishCompile;
  let loseDevice;
  const compiling = new Promise((resolve) => { finishCompile = resolve; });
  const lost = new Promise((resolve) => { loseDevice = resolve; });
  let compilations = 0;
  const pipeline = await createMockNativePipeline({
    lost, compileAsync: () => { compilations++; return compiling; },
  });
  const warming = pipeline.prewarm();
  const rejected = assert.rejects(warming, (error) =>
    error.name === "GPUDeviceLostError" && /unknown.*test device loss/.test(error.message));
  await Promise.resolve();
  loseDevice({ reason: "unknown", message: "test device loss" });
  await Promise.resolve();
  finishCompile();
  await rejected;
  assert.equal(compilations, 1);
  assert.equal(pipeline.prewarmed, false);
  assert.throws(() => pipeline.render(), /device lost/i);
  pipeline.dispose();
});

function validationFixture({ scope = async () => null, diagnostics = async () => ({ messages: [] }) } = {}) {
  const errors = [];
  const calls = [];
  const data = new WeakMap();
  const device = {
    pushErrorScope() { calls.push("push"); },
    popErrorScope() { calls.push("pop"); return scope(); },
    createPipelineLayout() { return {}; },
    createComputePipeline() { calls.push("native-sync-compute"); return {}; },
    createComputePipelineAsync() { throw new Error("Broken upstream async executor must not run"); },
  };
  const backend = {
    isWebGPUBackend: true, device,
    get(object) {
      if (!data.has(object)) data.set(object, {});
      return data.get(object);
    },
  };
  backend.pipelineUtils = new WebGPUPipelineUtils(backend);
  const program = { stage: "compute", code: "@compute @workgroup_size(1) fn main() {}" };
  const pipeline = { computeProgram: program };
  backend.get(program).module = { module: { getCompilationInfo: diagnostics }, entryPoint: "main" };
  const renderer = {
    isWebGPURenderer: true, backend, onError(info) { errors.push(info); },
    async compileAsync() {
      const promises = [];
      backend.pipelineUtils.createComputePipeline(pipeline, [], promises);
      await Promise.all(promises);
    },
    async compileComputeAsync() { return this.compileAsync(); },
    dispose() { calls.push("renderer-dispose"); },
  };
  return { renderer, backend, device, calls, errors, pipeline };
}

test("validation adapter protects first compile, rejects scope failure, and has no orphan rejection", async () => {
  const failure = new Error("Injected Instance dropped in popErrorScope");
  const fixture = validationFixture({ scope: async () => { throw failure; } });
  const unhandled = [];
  const observe = (error) => unhandled.push(error);
  process.on("unhandledRejection", observe);
  try {
    const validation = await attachWebGPUValidation(fixture.renderer);
    assert.equal(await attachWebGPUValidation(fixture.renderer), validation);
    assert.equal(getWebGPUValidation(fixture.renderer), validation);
    await assert.rejects(fixture.renderer.compileAsync(), (error) => error === failure);
    await fixture.renderer.dispose();
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(unhandled, []);
    assert.deepEqual(fixture.calls, ["push", "native-sync-compute", "pop", "renderer-dispose"]);
    assert.equal(fixture.backend.device, fixture.device);
    assert.equal(getWebGPUValidation(fixture.renderer), null);
  } finally {
    process.removeListener("unhandledRejection", observe);
  }
});

test("genuine validation and diagnostic failures both surface with original upstream error flag", async () => {
  const diagnosticsFailure = new Error("Compilation-info failed");
  const fixture = validationFixture({
    scope: async () => ({ message: "Invalid WGSL" }),
    diagnostics: async () => { throw diagnosticsFailure; },
  });
  await attachWebGPUValidation(fixture.renderer);
  await assert.rejects(fixture.renderer.compileComputeAsync(), (error) =>
    /Invalid WGSL/.test(error.message) && /Compilation-info failed/.test(error.message));
  assert.equal(fixture.backend.get(fixture.pipeline).error, true);
  await fixture.renderer.dispose();
});

test("validation disposal drains standalone draw diagnostics before renderer resource release", async () => {
  let finishScope;
  const fixture = validationFixture({ scope: () => new Promise((resolve) => { finishScope = resolve; }) });
  await attachWebGPUValidation(fixture.renderer);
  fixture.backend.pipelineUtils.createComputePipeline(fixture.pipeline, []);
  const disposing = fixture.renderer.dispose();
  await Promise.resolve();
  assert.ok(!fixture.calls.includes("renderer-dispose"));
  finishScope({ message: "Draw validation failure" });
  await disposing;
  assert.equal(fixture.errors[0].error.message, "WebGPU validation failed: Draw validation failure");
  assert.equal(fixture.calls.at(-1), "renderer-dispose");
});

test("validation disposal waits for queued compilation and restores original hooks", async () => {
  let finishScope;
  const fixture = validationFixture({ scope: () => new Promise((resolve) => { finishScope = resolve; }) });
  const originalCompile = fixture.renderer.compileAsync;
  const originalCompute = fixture.backend.pipelineUtils.createComputePipeline;
  const validation = await attachWebGPUValidation(fixture.renderer);
  const compiling = fixture.renderer.compileAsync();
  const disposing = validation.dispose();
  await Promise.resolve();
  assert.equal(typeof finishScope, "function");
  finishScope(null);
  await compiling;
  await disposing;
  assert.equal(fixture.renderer.compileAsync, originalCompile);
  assert.equal(fixture.backend.pipelineUtils.createComputePipeline, originalCompute);
});

test("validation private-hook guard rejects unknown shapes and leaves node WebGL2 untouched", async () => {
  const fixture = validationFixture();
  fixture.backend.pipelineUtils.createRenderPipeline = () => {};
  await assert.rejects(attachWebGPUValidation(fixture.renderer), /verified Three 0.186.1/);
  assert.equal(await attachWebGPUValidation({ isWebGPURenderer: true, backend: { isWebGLBackend: true } }), null);
});

test("validation operations serialize different renderers sharing one device", async () => {
  const finish = [];
  const first = validationFixture({ scope: () => new Promise((resolve) => finish.push(resolve)) });
  const second = validationFixture();
  second.backend.device = first.device;
  await attachWebGPUValidation(first.renderer);
  await attachWebGPUValidation(second.renderer);
  const a = first.renderer.compileAsync();
  const b = second.renderer.compileAsync();
  await Promise.resolve();
  assert.equal(finish.length, 1);
  finish[0](null);
  await a;
  await Promise.resolve();
  assert.equal(finish.length, 2);
  finish[1](null);
  await b;
  await first.renderer.dispose();
  await second.renderer.dispose();
});

test("factory-first concurrent attachment is idempotent through nested awaited compilation", async () => {
  const fixture = validationFixture();
  const [first, second] = await Promise.all([
    attachWebGPUValidation(fixture.renderer),
    attachWebGPUValidation(fixture.renderer),
  ]);
  assert.equal(first, second);
  const compile = fixture.renderer.compileAsync;
  await fixture.renderer.compileAsync();
  assert.equal(await attachWebGPUValidation(fixture.renderer), first);
  assert.equal(fixture.renderer.compileAsync, compile);
  await first.run(async () => {
    await fixture.renderer.compileAsync();
    await first.run(() => fixture.renderer.compileComputeAsync());
  });
  assert.equal(fixture.calls.filter((call) => call === "native-sync-compute").length, 3);
  await fixture.renderer.dispose();
  assert.equal(getWebGPUValidation(fixture.renderer), null);
});

test("factory-first native shared-device pipelines prewarm and dispose every preset", {
  skip: process.env.QGA_NATIVE_GPU !== "1",
}, async () => {
  const { chromium } = await import("playwright");
  const { startServer } = await import("../qa/lib/serve.mjs");
  const server = await startServer(path.resolve(import.meta.dirname, ".."));
  let browser;
  try {
    browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-webgpu"] });
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.route("**/factory-probe", (route) => route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><script type="importmap">{"imports":{
        "three":"/vendor/three/build/three.module.js",
        "three/webgpu":"/vendor/three/build/three.webgpu.js",
        "three/tsl":"/vendor/three/build/three.tsl.js",
        "three/addons/":"/vendor/three/examples/jsm/"
      }}</script>`,
    }));
    await page.goto(`${server.baseUrl}/factory-probe`);
    const result = await page.evaluate(async () => {
      const T = await import("three/webgpu");
      const { createRenderer } = await import("/js/render/create-renderer.mjs");
      const { createRenderPipeline } = await import("/js/render/render-pipeline.mjs");
      const { prewarmShaders } = await import("/js/render/shader-prewarm.mjs");
      const { getWebGPUValidation } = await import("/js/render/webgpu-validation.mjs");
      const quality = { postEffects: true, maxDpr: 1, temporalSamples: 2, ssgi: false };
      const fixtures = await Promise.all([0, 1].map(async () => {
        const scene = new T.Scene();
        const camera = new T.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.z = 8;
        const geometry = new T.SphereGeometry(1, 16, 8);
        const material = new T.MeshStandardNodeMaterial();
        scene.add(new T.Mesh(geometry, material), new T.AmbientLight(0xffffff, 2));
        const handle = await createRenderer({ forceBackend: "webgpu", scene, camera, quality });
        if (handle.backend !== "webgpu") {
          await handle.dispose();
          throw new Error("Factory-first native proof unexpectedly fell back from WebGPU");
        }
        handle.renderer.setSize(128, 96);
        return { scene, camera, geometry, material, handle, validation: getWebGPUValidation(handle.renderer) };
      }));
      const sharedDevice = fixtures[0].handle.renderer.backend.device === fixtures[1].handle.renderer.backend.device;
      const results = [];
      try {
        for (const preset of ["scientific", "cinematic", "minimal", "capture"]) {
          const value = { ...quality, ssgi: preset === "capture" };
          results.push(...await Promise.all(fixtures.map(async (fixture, index) => {
            const renderer = fixture.handle.renderer;
            const pipeline = await createRenderPipeline({
              renderer, backend: "webgpu", scene: fixture.scene, camera: fixture.camera,
              quality: value, preset, fullMotion: true,
            });
            try {
              await prewarmShaders({
                renderer, backend: "webgpu", scene: fixture.scene, camera: fixture.camera,
                quality: value, pipeline, view: String(index),
              });
              pipeline.render(0.016);
              return { preset, prewarmed: pipeline.prewarmed, sameAdapter: fixture.validation === getWebGPUValidation(renderer) };
            } finally {
              await pipeline.dispose();
            }
          })));
        }
      } finally {
        await Promise.all(fixtures.map(async (fixture) => {
          await fixture.handle.dispose();
          fixture.geometry.dispose();
          fixture.material.dispose();
        }));
      }
      return { sharedDevice, results, detached: fixtures.every((fixture) => getWebGPUValidation(fixture.handle.renderer) === null) };
    });
    assert.equal(result.sharedDevice, true);
    assert.equal(result.results.length, 8);
    assert.ok(result.results.every(({ prewarmed, sameAdapter }) => prewarmed && sameAdapter));
    assert.equal(result.detached, true);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await server.close();
  }
});

test("device drain settles pending popErrorScope promises before destroy and is bounded", async () => {
  let finishScope;
  const fixture = validationFixture({ scope: () => new Promise((resolve) => { finishScope = resolve; }) });
  assert.equal(await drainWebGPUValidation(fixture.device), true);
  await attachWebGPUValidation(fixture.renderer);
  fixture.backend.pipelineUtils.createComputePipeline(fixture.pipeline, []);
  assert.equal(await drainWebGPUValidation(fixture.device, { timeoutMs: 20 }), false);
  let drained = false;
  const draining = drainWebGPUValidation(fixture.device).then((value) => { drained = value; });
  await Promise.resolve();
  assert.equal(drained, false);
  finishScope(null);
  await draining;
  assert.equal(drained, true);
  await fixture.renderer.dispose();
  assert.equal(await drainWebGPUValidation(fixture.device), true);
  assert.deepEqual(fixture.errors, []);
});

test("every vendored addon is official pinned source, checksum-covered and self-hosted transitively", () => {
  const root = path.resolve(import.meta.dirname, "..");
  const vendor = path.join(root, "vendor/three");
  const upstream = path.join(root, "node_modules/three");
  const metadata = JSON.parse(fs.readFileSync(path.join(vendor, "VERSION"), "utf8"));
  assert.equal(metadata.version, "0.186.1");
  const queue = Object.keys(metadata.files);
  const seen = new Set();
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const bytes = fs.readFileSync(path.join(vendor, file));
    assert.deepEqual(bytes, fs.readFileSync(path.join(upstream, file)), file);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), metadata.files[file], file);
    if (!file.endsWith(".js")) continue;
    for (const [, specifier] of bytes.toString().matchAll(/^\s*(?:import|export)\s+(?:[^;]*?\bfrom\s*)?["']([^"']+)["']/gm)) {
      if (["three", "three/webgpu", "three/tsl"].includes(specifier)) continue;
      assert.ok(specifier.startsWith("."), `unmapped external import ${specifier}`);
      const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
      assert.ok(metadata.files[dependency], `missing transitive manifest entry ${dependency}`);
      queue.push(dependency);
    }
  }
});
