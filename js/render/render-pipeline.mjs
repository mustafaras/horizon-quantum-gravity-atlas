/**
 * Three.js 0.186.1: classic passes never enter WebGPURenderer. Node renderers
 * (including their WebGL2 backend) use RenderPipeline and TSL exclusively.
 * Prewarming draws the complete graph while the host keeps its canvas hidden.
 */
import { attachWebGPUValidation, getWebGPUValidation } from "./webgpu-validation.mjs";

export const EFFECT_ORDER = Object.freeze([
  "base-render", "ao", "ssgi", "bloom", "god-rays", "depth-of-field",
  "temporal-aa", "motion-blur", "chromatic-aberration", "lens-dirt",
  "lens-flare", "film-grain", "vignette", "tone-mapping",
]);

const PRESETS = Object.freeze({
  scientific: ["ao", "temporal-aa"],
  cinematic: EFFECT_ORDER,
  minimal: [],
  capture: ["ao", "ssgi", "bloom", "god-rays", "temporal-aa"],
});

const deviceLossStates = new WeakMap();

function observeDeviceLoss(device) {
  let state = deviceLossStates.get(device);
  if (!state) {
    state = { info: null };
    deviceLossStates.set(device, state);
    device.lost.then(
      (info) => { state.info = info; },
      (error) => { state.info = { reason: "unknown", message: String(error) }; },
    );
  }
  return state;
}

/**
 * Pure policy; `capabilities` describes the actual renderer, not browser hints.
 * `depthValid` must be false for raymarched views without physical fragment depth.
 * SSGI is opt-in. TRAA's upstream history uses a fixed 32-position Halton
 * sequence: temporalSamples gates it, it does not change that sequence length.
 */
export function planRenderPipeline({
  backend, quality = {}, preset = "cinematic", reducedMotion = false,
  fullMotion = false, source = null, capabilities = {}, depthValid = true,
} = {}) {
  if (!["webgpu", "webgl2", "static"].includes(backend)) throw new TypeError("Unknown render backend");
  if (!Object.hasOwn(PRESETS, preset)) throw new TypeError(`Unknown pipeline preset: ${preset}`);
  const nodePipeline = backend === "webgpu" || capabilities.nodePipeline === true;
  return Object.freeze(EFFECT_ORDER.map((name) => {
    let status = "enabled";
    let reason = "Pinned upstream effect with conservative display-only settings";
    if (backend === "static") {
      status = "unsupported";
      reason = "Static backend has no GPU render graph";
    } else if (name === "base-render" || name === "tone-mapping") {
      reason = name === "base-render" ? "Linear scene render" : "Exactly one final tone-map and sRGB output transform";
    } else if (quality.postEffects === false || !PRESETS[preset].includes(name)) {
      status = "disabled";
      reason = quality.postEffects === false ? "Quality policy disables optional post effects" : `${preset} preset preserves legibility`;
    } else if (reducedMotion && ["temporal-aa", "motion-blur", "film-grain", "depth-of-field"].includes(name)) {
      status = "disabled";
      reason = "Reduced motion disables temporal resolve, blur, animated grain and focal effects";
    } else if (name === "ssgi" && quality.ssgi !== true) {
      status = "disabled";
      reason = "SSGI requires explicit quality.ssgi opt-in";
    } else if (name === "motion-blur" && !fullMotion) {
      status = "disabled";
      reason = "Motion blur requires explicit full-motion mode";
    } else if (name === "temporal-aa" && !(quality.temporalSamples > 1)) {
      status = "disabled";
      reason = "Temporal sample budget is one";
    } else if (name === "god-rays" && !source) {
      status = "disabled";
      reason = "No volumetric light source supplied";
    } else if (depthValid === false && ["ao", "ssgi", "god-rays", "depth-of-field", "temporal-aa", "motion-blur"].includes(name)) {
      status = "unsupported";
      reason = "Scene does not provide valid physical depth; raster proxy depth cannot support this effect";
    } else if (name === "lens-dirt") {
      status = "unsupported";
      reason = "No calibrated self-hosted dirt texture supplied; lens flare is separate, not fake lens dirt";
    } else if (!nodePipeline && ["ssgi", "god-rays", "temporal-aa", "motion-blur", "lens-flare"].includes(name)) {
      status = "unsupported";
      reason = {
        ssgi: "Three 0.186.1 has SSGINode but no classic SSGI pass; SSR is not diffuse GI",
        "god-rays": "Three 0.186.1 provides GodraysNode, not a classic god-rays pass",
        "temporal-aa": "Classic TAARenderPass accumulates scene renders, not a post-DOF motion-vector resolve",
        "motion-blur": "No upstream classic velocity-based motion-blur pass; afterimage is not motion blur",
        "lens-flare": "Upstream classic Lensflare is a scene object, not an ordered post-processing pass",
      }[name];
    } else if (name === "ssgi" && (capabilities.ssgi !== true || capabilities.perspectiveCamera === false)) {
      status = "unsupported";
      reason = capabilities.perspectiveCamera === false
        ? "SSGINode requires a perspective camera"
        : "SSGINode requires rg11b10ufloat-renderable on the native WebGPU device";
    } else if (["temporal-aa", "motion-blur"].includes(name) && capabilities.velocity === false) {
      status = "unsupported";
      reason = "Scene has custom fragment outputs that do not supply the upstream velocity MRT";
    } else if (name === "god-rays" && (!(source.isDirectionalLight || source.isPointLight)
      || !source.castShadow || capabilities.godRays !== true)) {
      status = "unsupported";
      reason = "GodraysNode needs a scene-owned shadow-casting DirectionalLight or PointLight, enabled shadows and a depth map or shadow receiver";
    } else if (name === "depth-of-field" && capabilities.perspectiveCamera === false) {
      status = "unsupported";
      reason = "Pinned depth-of-field implementations require perspective depth";
    } else if (name === "temporal-aa") {
      reason = "Upstream TRAANode with depth/velocity reprojection and fixed 32-position Halton jitter";
    } else if (name === "ao") {
      reason = nodePipeline ? "Upstream GTAONode with depth-reconstructed normals" : "Upstream GTAOPass and Poisson denoise";
    } else if (name === "depth-of-field") {
      reason = "Subtle fixed focus; no automatic focal changes";
    } else if (name === "chromatic-aberration" && !nodePipeline) {
      reason = "Upstream RGBShiftShader: subtle fixed channel shift, not radial optical dispersion";
    } else if (name === "vignette") {
      reason = nodePipeline ? "Conservative TSL radial attenuation, preserving alpha" : "Upstream VignetteShader with subtle radial attenuation";
    }
    return Object.freeze({ name, status, reason });
  }));
}

function assertSceneMaterials(scene, nodePipeline) {
  let velocity = true;
  scene.traverse((object) => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      if (nodePipeline && (material.isShaderMaterial || material.isRawShaderMaterial)) {
        throw new TypeError(`WebGPURenderer cannot run raw GLSL material "${material.name || material.type}"; select classic WebGL2`);
      }
      if (material.fragmentNode || material.mrtNode) velocity = false;
    }
  });
  return velocity;
}

function dimensions(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new TypeError("Pipeline resize requires positive finite dimensions");
  }
  return [Math.max(1, Math.round(width)), Math.max(1, Math.round(height))];
}

/**
 * The renderer/scene/camera remain host-owned. A pipeline must be rebuilt when
 * its preset, quality, source, physical-depth validity or material capabilities change.
 * Await dispose() before disposing the renderer if prewarm is still pending.
 */
export async function createRenderPipeline({
  renderer, backend, scene, camera, quality = {}, preset = "cinematic",
  reducedMotion = false,   fullMotion = false, source = null, toneMapping = "agx", seed = 0,
  depthValid = true,
} = {}) {
  const nodePipeline = renderer?.isWebGPURenderer === true;
  if (!["webgpu", "webgl2"].includes(backend)) throw new TypeError("Pipeline requires a WebGPU or WebGL2 backend");
  if (backend === "webgpu" && !nodePipeline) throw new TypeError("WebGPU pipeline requires WebGPURenderer");
  if (!nodePipeline && renderer?.isWebGLRenderer !== true) throw new TypeError("Classic pipeline requires WebGLRenderer");
  if (!scene?.traverse || !camera?.isCamera) throw new TypeError("Pipeline requires a Three scene and camera");
  if (!["agx", "neutral"].includes(toneMapping)) throw new TypeError("Unknown toneMapping; use agx or neutral");
  const velocity = assertSceneMaterials(scene, nodePipeline);
  if (nodePipeline) await renderer.init();
  let sourceInScene = false;
  let shadowReceiver = false;
  scene.traverse((object) => {
    if (object === source) sourceInScene = true;
    if (object.receiveShadow && object.material && object.visible) shadowReceiver = true;
  });
  const nativeGPU = renderer.backend?.isWebGPUBackend === true;
  if (nativeGPU) await attachWebGPUValidation(renderer);
  const effects = planRenderPipeline({
    backend, quality, preset, reducedMotion, fullMotion, source, depthValid,
    capabilities: {
      nodePipeline, velocity, perspectiveCamera: camera.isPerspectiveCamera === true,
      ssgi: nodePipeline && (!nativeGPU || renderer.hasFeature("rg11b10ufloat-renderable")),
      godRays: sourceInScene && renderer.shadowMap?.enabled === true
        && (shadowReceiver || !!source?.shadow?.map?.depthTexture),
    },
  });
  const enabled = (name) => effects.some((effect) => effect.name === name && effect.status === "enabled");
  const three = await import("three");
  renderer.toneMapping = toneMapping === "agx" ? three.AgXToneMapping : three.NeutralToneMapping;
  renderer.outputColorSpace = three.SRGBColorSpace;
  return nodePipeline
    ? buildNodePipeline({ renderer, scene, camera, quality, effects, enabled, source, seed })
    : buildClassicPipeline({ renderer, scene, camera, effects, enabled, three, seed });
}

function seedNoiseTexture(texture, SimplexNoise, seed) {
  let state = Number(seed) >>> 0;
  const simplex = new SimplexNoise({
    random() {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    },
  });
  // Preserve the upstream simplex-noise layout, replacing only its unseeded
  // permutation. Do not mutate global Math.random or the byte-identical vendor.
  const { data, width: size } = texture.image;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const offset = (i * size + j) * 4;
      data[offset] = (simplex.noise(i, j) * 0.5 + 0.5) * 255;
      data[offset + 1] = (simplex.noise(i + size, j) * 0.5 + 0.5) * 255;
      data[offset + 2] = (simplex.noise(i, j + size) * 0.5 + 0.5) * 255;
      data[offset + 3] = (simplex.noise(i + size, j + size) * 0.5 + 0.5) * 255;
    }
  }
  texture.needsUpdate = true;
}

function lifecycle({ renderer, scene, camera, effects, draw, resize, release, prepare }) {
  let disposed = false;
  let warmed = false;
  let warming = null;
  let prewarming = false;
  let disposing = null;
  const device = renderer.backend?.isWebGPUBackend ? renderer.backend.device : null;
  const deviceLoss = device ? observeDeviceLoss(device) : null;
  const validation = getWebGPUValidation(renderer);
  const check = () => {
    if (disposed) throw new Error("Render pipeline is disposed");
    if (deviceLoss?.info) {
      const error = new Error(`GPU device lost (${deviceLoss.info.reason}): ${deviceLoss.info.message}`);
      error.name = "GPUDeviceLostError";
      throw error;
    }
  };
  return {
    effects,
    render(delta = 0) {
      check();
      if (!warmed) throw new Error("Await render pipeline prewarm() before rendering");
      if (!Number.isFinite(delta) || delta < 0) throw new TypeError("Render delta must be finite and nonnegative");
      draw(delta);
    },
    resize(width, height) {
      check();
      resize(...dimensions(width, height));
    },
    prewarm() {
      check();
      if (!warming) {
        prewarming = true;
        const warm = async () => {
          const target = renderer.getRenderTarget();
          const currentMRT = renderer.getMRT?.();
          const toneMapping = renderer.toneMapping;
          const outputColorSpace = renderer.outputColorSpace;
          const xrEnabled = renderer.xr.enabled;
          const view = camera.view ? { ...camera.view } : null;
          let scopePushed = false;
          const failures = [];
          try {
            device?.pushErrorScope("validation");
            scopePushed = !!device;
            check();
            await renderer.compileAsync(scene, camera);
            check();
            if (prepare) await prepare(check);
            check();
            // Drawing while hidden compiles every normal/depth, fullscreen, blend
            // and render-target variant actually used by the pinned upstream graph.
            draw(0);
            if (device) await device.queue.onSubmittedWorkDone();
          } catch (error) {
            failures.push(error);
          } finally {
            // Upstream RenderPipeline/PassNode do not use finally around their
            // state changes. An initialization failure must not poison fallback.
            try {
              renderer.setRenderTarget(target);
              if (renderer.setMRT) renderer.setMRT(currentMRT);
              renderer.toneMapping = toneMapping;
              renderer.outputColorSpace = outputColorSpace;
              renderer.xr.enabled = xrEnabled;
              camera.view = view;
              camera.updateProjectionMatrix();
            } catch (error) {
              failures.push(error);
            }
            try {
              if (scopePushed) {
                const validationError = await device.popErrorScope();
                if (validationError) failures.push(new Error(`Pipeline WebGPU validation failed: ${validationError.message}`));
              }
            } catch (error) {
              failures.push(error);
            }
          }
          if (failures.length === 1) throw failures[0];
          if (failures.length > 1) {
            throw new AggregateError(failures, `Pipeline prewarm failed: ${failures.map((error) => error.message).join("; ")}`, { cause: failures[0] });
          }
          check();
        };
        warming = (validation ? validation.run(warm) : warm()).then(() => {
          prewarming = false;
          check();
          warmed = true;
        }, (error) => {
          prewarming = false;
          throw error;
        });
      }
      return warming;
    },
    dispose() {
      if (disposed) return disposing;
      disposed = true;
      if (prewarming) {
        // Drain compilation before freeing resources it may still reference.
        // Both branches release, while the original prewarm rejection is retained.
        disposing = warming.then(release, release);
        return disposing;
      }
      if (validation) {
        disposing = validation.drain().then(release, (error) => { release(); throw error; });
        return disposing;
      }
      release();
    },
    get prewarmed() { return warmed; },
  };
}

async function buildClassicPipeline({ renderer, scene, camera, effects, enabled, three, seed }) {
  const [
    { EffectComposer }, { RenderPass }, { GTAOPass }, { UnrealBloomPass },
    { BokehPass }, { ShaderPass }, { FilmPass }, { OutputPass },
    { RGBShiftShader }, { VignetteShader }, { SimplexNoise },
  ] = await Promise.all([
    import("three/addons/postprocessing/EffectComposer.js"),
    import("three/addons/postprocessing/RenderPass.js"),
    import("three/addons/postprocessing/GTAOPass.js"),
    import("three/addons/postprocessing/UnrealBloomPass.js"),
    import("three/addons/postprocessing/BokehPass.js"),
    import("three/addons/postprocessing/ShaderPass.js"),
    import("three/addons/postprocessing/FilmPass.js"),
    import("three/addons/postprocessing/OutputPass.js"),
    import("three/addons/shaders/RGBShiftShader.js"),
    import("three/addons/shaders/VignetteShader.js"),
    import("three/addons/math/SimplexNoise.js"),
  ]);
  const composer = new EffectComposer(renderer);
  const passes = [];
  const extraResources = new Set();
  const add = (pass) => { passes.push(pass); composer.addPass(pass); return pass; };
  const release = () => {
    for (const pass of passes) pass.dispose();
    // Upstream r186 omits these owned materials in its pass dispose methods.
    for (const resource of extraResources) resource.dispose();
    composer.timer.dispose();
    composer.dispose();
  };
  try {
    add(new RenderPass(scene, camera));
    if (enabled("ao")) {
      const ao = add(new GTAOPass(scene, camera));
      ao.blendIntensity = 0.2;
      ao.updateGtaoMaterial({ radius: 0.25, samples: 8 });
      extraResources.add(ao.gtaoMaterial);
      extraResources.add(ao.blendMaterial);
      seedNoiseTexture(ao.pdNoiseTexture, SimplexNoise, seed);
    }
    if (enabled("bloom")) {
      const bloom = add(new UnrealBloomPass(new three.Vector2(256, 256), 0.14, 0.25, 1.1));
      extraResources.add(bloom.materialHighPassFilter);
    }
    if (enabled("depth-of-field")) {
      add(new BokehPass(scene, camera, { focus: Math.max(camera.near * 2, 8), aperture: 0.00001, maxblur: 0.002 }));
    }
    if (enabled("chromatic-aberration")) {
      const chromatic = add(new ShaderPass(RGBShiftShader));
      chromatic.uniforms.amount.value = 0.0002;
    }
    if (enabled("film-grain")) add(new FilmPass(0.012, false));
    if (enabled("vignette")) {
      const vignette = add(new ShaderPass(VignetteShader));
      vignette.uniforms.offset.value = 0.35;
      vignette.uniforms.darkness.value = 1;
    }
    add(new OutputPass());
  } catch (error) {
    release();
    throw error;
  }
  return lifecycle({
    renderer, scene, camera, effects,
    draw: (delta) => composer.render(delta),
    resize: (width, height) => {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(width, height);
    },
    release,
  });
}

async function buildNodePipeline({ renderer, scene, camera, quality, effects, enabled, source, seed }) {
  const [
    { RenderPipeline }, tsl, { ao }, { ssgi }, { bloom }, { godrays },
    { dof }, { traa }, { motionBlur }, { chromaticAberration },
    { lensflare }, { film }, { denoise }, { SimplexNoise },
  ] = await Promise.all([
    import("three/webgpu"), import("three/tsl"),
    import("three/addons/tsl/display/GTAONode.js"),
    import("three/addons/tsl/display/SSGINode.js"),
    import("three/addons/tsl/display/BloomNode.js"),
    import("three/addons/tsl/display/GodraysNode.js"),
    import("three/addons/tsl/display/DepthOfFieldNode.js"),
    import("three/addons/tsl/display/TRAANode.js"),
    import("three/addons/tsl/display/MotionBlur.js"),
    import("three/addons/tsl/display/ChromaticAberrationNode.js"),
    import("three/addons/tsl/display/LensflareNode.js"),
    import("three/addons/tsl/display/FilmNode.js"),
    import("three/addons/tsl/display/DenoiseNode.js"),
    import("three/addons/math/SimplexNoise.js"),
  ]);
  const { pass, mrt, output, velocity, vec4, vec3, uv, convertToTexture } = tsl;
  const owned = new Set();
  const extraResources = new Set();
  const own = (node) => { owned.add(node); return node; };
  const asTexture = (node) => {
    const texture = convertToTexture(node);
    if (texture !== node) own(texture);
    return texture;
  };
  const scenePass = own(pass(scene, camera, { samples: 0 }));
  if (enabled("temporal-aa") || enabled("motion-blur")) scenePass.setMRT(mrt({ output, velocity }));
  const beauty = scenePass.getTextureNode("output");
  const depth = scenePass.getTextureNode("depth");
  let color = beauty;
  const pipeline = new RenderPipeline(renderer);
  const release = () => {
    pipeline.dispose();
    for (const node of [...owned].reverse()) node.dispose();
    for (const resource of extraResources) resource.dispose();
  };
  try {
    if (enabled("ao")) {
      const occlusion = own(ao(depth, null, camera));
      occlusion.samples.value = 8;
      occlusion.radius.value = 0.25;
      occlusion.useTemporalFiltering = false;
      const filteredAO = own(denoise(asTexture(occlusion), depth, null, camera));
      seedNoiseTexture(filteredAO._noiseTexture, SimplexNoise, seed);
      filteredAO.radius.value = 2;
      color = vec4(color.rgb.mul(filteredAO.r.mul(0.2).add(0.8)), color.a);
    }
    if (enabled("ssgi")) {
      const illumination = own(ssgi(asTexture(color), depth, null, camera));
      illumination.sliceCount.value = 2;
      illumination.stepCount.value = Math.max(4, Math.min(16, Math.round((quality.raySteps || 96) / 12)));
      illumination.giIntensity.value = 0.2;
      illumination.aoIntensity.value = 0;
      illumination.useTemporalFiltering = enabled("temporal-aa");
      // SSGINode itself resolves to AO. Diffuse GI is its separate attachment.
      let indirect = illumination.getGINode();
      if (!enabled("temporal-aa")) {
        indirect = own(denoise(indirect, depth, null, camera));
        seedNoiseTexture(indirect._noiseTexture, SimplexNoise, seed);
        indirect.radius.value = 2;
      }
      color = vec4(color.rgb.add(indirect.rgb), color.a);
    }
    if (enabled("bloom")) {
      const glow = own(bloom(color, 0.14, 0.25, 1.1));
      color = vec4(color.rgb.add(glow.rgb), color.a);
    }
    if (enabled("god-rays")) {
      const rays = own(godrays(depth, camera, source));
      rays.raymarchSteps.value = Math.max(8, Math.min(96, quality.raySteps || 48));
      rays.density.value = 0.15;
      rays.maxDensity.value = 0.08;
      color = vec4(color.rgb.add(rays.rgb.mul(vec3(source.color))), color.a);
    }
    if (enabled("depth-of-field")) {
      color = own(dof(asTexture(color), scenePass.getViewZNode(), Math.max(camera.near * 2, 8), 4, 0.15));
    }
    if (enabled("temporal-aa")) {
      color = own(traa(asTexture(color), depth, scenePass.getTextureNode("velocity"), camera));
      // r186 replaces this placeholder after the first depth copy without
      // disposing it. Its WebGL backend also uploads history as a standalone
      // copy destination, which render-target disposal alone does not release.
      extraResources.add(color._previousDepthNode.value);
      extraResources.add(color._historyRenderTarget.texture);
    }
    if (enabled("motion-blur")) {
      // r186 includes the center plus four taps but divides by four; normalize
      // the upstream kernel so enabling blur does not brighten scientific data.
      color = motionBlur(asTexture(color), scenePass.getTextureNode("velocity").mul(tsl.vec2(0.05, -0.05)), tsl.int(4)).mul(4 / 5);
    }
    if (enabled("chromatic-aberration")) color = own(chromaticAberration(asTexture(color), 0.025, tsl.vec2(0.5, 0.5)));
    if (enabled("lens-flare")) {
      const flare = own(lensflare(asTexture(color), { threshold: 1.5, ghostSamples: 2, ghostAttenuationFactor: 30 }));
      color = vec4(color.rgb.add(flare.rgb.mul(0.025)), color.a);
    }
    if (enabled("film-grain")) color = own(film(color, tsl.float(0.012)));
    if (enabled("vignette")) {
      const radiusSquared = uv().sub(0.5).dot(uv().sub(0.5));
      color = vec4(color.rgb.mul(tsl.float(1).sub(radiusSquared.mul(0.12))), color.a);
    }
    pipeline.outputNode = color;
    pipeline.outputColorTransform = true;
  } catch (error) {
    release();
    throw error;
  }
  return lifecycle({
    renderer, scene, camera, effects,
    draw: () => pipeline.render(),
    // PassNode and display nodes derive their actual sizes from the drawing
    // buffer each frame. The host resizes its renderer before calling this.
    resize: (width, height) => scenePass.setSize(width, height),
    prepare: async (check) => {
      const target = renderer.getRenderTarget();
      const currentMRT = renderer.getMRT();
      try {
        await scenePass.compileAsync(renderer);
        check();
        // GodraysNode samples light.shadow.map.depthTexture during shader setup.
        // Material precompile alone does not allocate that scene-owned map.
        if (enabled("god-rays")) {
          renderer.setRenderTarget(scenePass.renderTarget);
          renderer.setMRT(scenePass.getMRT());
          renderer.render(scene, camera);
          if (!source.shadow.map?.depthTexture) {
            throw new Error("GodraysNode source has no initialized shadow depth map; add a visible shadow receiver");
          }
        }
      } finally {
        renderer.setMRT(currentMRT);
        renderer.setRenderTarget(target);
      }
    },
    release,
  });
}
