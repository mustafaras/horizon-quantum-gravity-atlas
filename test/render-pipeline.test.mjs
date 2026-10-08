import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { EFFECT_ORDER, planRenderPipeline, createRenderPipeline } from "../js/render/render-pipeline.mjs";

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
