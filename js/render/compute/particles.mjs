// GPU compute particles (S08): one draw call, zero per-frame uploads per system.
//
// State lives in storage buffers (`position`, `velocity`, `age`, `attr`). `init` and `update` are builder functions that receive a
// context of per-particle nodes and RETURN the particle's new state, `{ position?, velocity?, age?, attr? }` (an omitted field is left
// unchanged). They run inside ONE compute kernel that selects between them with a uniform, and assigns each buffer once, so a particle
// reads only the previous state of itself and a branch is a `select` of two computed values. That is what the node renderer's WebGL2
// backend needs: it runs a kernel as a transform-feedback pass with a ping-pong pair per buffer, and (verified on r186) two kernels over
// the same buffers do not stay in step with each other there, so init and update must be the same kernel.
//
// Randomness is `hash(instanceIndex + seed * 7919 + channel * 15485863)` (a PCG hash, see particles-cpu.mjs), never `Math.random`;
// `randStep` adds the step counter so a respawn draws fresh values. The CPU reference in particles-cpu.mjs mirrors all of it.
//
// r186 facts (read from vendor/three/build/three.webgpu.js): `renderer.compute(node)` runs a kernel on the WebGPU backend and, on the
// node renderer's WebGL2 backend, as a transform-feedback pass over the storage attributes the kernel assigns;
// `renderer.getArrayBufferAsync(attribute)` reads a buffer back on both.
//
// Layout: vec4 for position and velocity (xyz plus a free w) so the WebGPU storage layout needs no vec3 padding and a readback is
// a plain Float32Array; float for age; vec4 for attr.

import { Fn, Return, float, hash, instanceIndex, instancedArray, select, uint, uniform, vec4 } from "three/tsl";
import { STEP_STRIDE, streamBase } from "./particles-cpu.mjs";
import { createDataPoints } from "../materials/data-points.mjs";

export const PARTICLE_WORKGROUP = 64;
export const PARTICLE_BUFFERS = Object.freeze(["position", "velocity", "age", "attr"]);

/** Validated options with defaults. */
export function normalizeParticleOptions({ count, seed = 0, init = null, update, render = {}, initial = null, params = {} } = {}) {
  if (!Number.isInteger(count) || count < 1 || count > 4_000_000) throw new RangeError(`createParticleSystem: count must be an integer in 1..4000000, got ${count}`);
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError(`createParticleSystem: seed must be an unsigned 32-bit integer, got ${seed}`);
  if (init !== null && typeof init !== "function") throw new TypeError("createParticleSystem: init must be a function (ctx) => state, or omitted when `initial` supplies the starting buffers");
  if (init === null && initial === null) throw new TypeError("createParticleSystem: pass init or initial");
  if (typeof update !== "function") throw new TypeError("createParticleSystem: update must be a function (ctx) => state");
  if (render !== null && (typeof render !== "object" || Array.isArray(render))) throw new TypeError("createParticleSystem: render must be an options object or null");
  if (initial !== null) {
    for (const [name, array] of Object.entries(initial)) {
      if (!PARTICLE_BUFFERS.includes(name)) throw new RangeError(`createParticleSystem: initial.${name} is not a particle buffer (${PARTICLE_BUFFERS.join(", ")})`);
      const width = name === "age" ? 1 : 4;
      if (!(array instanceof Float32Array) || array.length !== count * width) throw new RangeError(`createParticleSystem: initial.${name} must be a Float32Array of ${count * width} floats`);
    }
  }
  for (const [name, value] of Object.entries(params)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || !Number.isFinite(value)) throw new RangeError(`createParticleSystem: params.${name} must be a finite number under an identifier name`);
  }
  return Object.freeze({ count, seed, init, update, render, initial, params: Object.freeze({ ...params }) });
}

/**
 * @param {object} options
 * @param {number} options.count     number of particles
 * @param {number} options.seed      unsigned 32-bit seed of every random stream
 * @param {Function} [options.init] (ctx) => { position?, velocity?, age?, attr? } for `system.init(renderer)`; omit it when `initial` is given
 * @param {object} [options.initial] Float32Arrays that fill the buffers once at creation (the one CPU write; never again), keyed by buffer name
 * @param {object} [options.params]  name -> number: uniforms exposed as `ctx.params.name` and `system.params.name` (set `.value` per frame)
 * @param {Function} options.update  (ctx) => { position?, velocity?, age?, attr? } for each `system.step(renderer, dt)`
 * @param {object|null} options.render  extra createDataPoints options (sizePx, profile, ...) plus optional `colorNode` / `opacityNode` /
 *                                   `sizeNode` builders `(buffers) => node`; null builds no drawable
 *
 * ctx: `{ i, seed, dt, time, step, rand(channel), randStep(channel), position, velocity, age, attr }`, the last four being the previous
 * state of particle `i` (`position.xyz`, `age`, ...); `step` is 0 for init.
 */
export function createParticleSystem(input) {
  const options = normalizeParticleOptions(input);
  const { count, seed } = options;
  const buffers = {
    position: instancedArray(count, "vec4"), velocity: instancedArray(count, "vec4"),
    age: instancedArray(count, "float"), attr: instancedArray(count, "vec4"),
  };
  const uniforms = { dt: uniform(0), time: uniform(0), step: uniform(0, "uint"), initPhase: uniform(1) };
  const params = Object.fromEntries(Object.entries(options.params).map(([name, value]) => [name, uniform(value)]));
  const rand = (channel = 0) => hash(instanceIndex.add(uint(streamBase(seed, channel))));
  const randStep = (channel = 0) => hash(instanceIndex.add(uint(streamBase(seed, channel))).add(uniforms.step.mul(uint(STEP_STRIDE))));
  const previous = {
    position: buffers.position.element(instanceIndex), velocity: buffers.velocity.element(instanceIndex),
    age: buffers.age.element(instanceIndex), attr: buffers.attr.element(instanceIndex),
  };
  // The previous state is copied into locals first: the WebGL2 backend reads a buffer through the same variable it writes (a
  // transform-feedback varying), so a read placed after an assignment would see the new value.
  const context = () => {
    const state = Object.fromEntries(Object.entries(previous).map(([name, element]) => [name, element.toVar()]));
    return { i: instanceIndex, seed, dt: uniforms.dt, time: uniforms.time, step: uniforms.step, params, rand, randStep, ...state };
  };
  if (options.initial) for (const [name, array] of Object.entries(options.initial)) buffers[name].value.array.set(array);
  const kernel = Fn(() => {
    const ctx = context();
    const fresh = options.init ? options.init(ctx) : null, next = options.update(ctx);
    const keep = { position: ctx.position, velocity: ctx.velocity, age: ctx.age, attr: ctx.attr };
    const isInit = uniforms.initPhase.greaterThan(0.5);
    const pick = (name, type) => {
      const a = fresh?.[name] ?? keep[name], b = next?.[name] ?? keep[name];
      return select(isInit, type(a), type(b));
    };
    // Every buffer is assigned exactly once, unconditionally (a transform-feedback pass must write all its outputs).
    previous.position.assign(pick("position", vec4));
    previous.velocity.assign(pick("velocity", vec4));
    previous.attr.assign(pick("attr", vec4));
    previous.age.assign(pick("age", float));
    Return();
  })().compute(count, [PARTICLE_WORKGROUP]);

  let drawable = null;
  if (options.render !== null) {
    const { colorNode, opacityNode, sizeNode, ...rest } = options.render;
    drawable = createDataPoints({
      count, ...rest, nodes: {
        position: buffers.position.toAttribute().xyz,
        ...(colorNode ? { color: colorNode(buffers) } : {}), ...(opacityNode ? { opacity: opacityNode(buffers) } : {}), ...(sizeNode ? { size: sizeNode(buffers) } : {}),
      },
    });
  }

  let steps = 0, clock = 0, ready = false;
  return {
    count, seed, buffers, uniforms, params, kernel, object: drawable?.object ?? null, points: drawable,
    get steps() { return steps; }, get time() { return clock; },
    /** Runs `init` over every particle and resets the step counter and clock. */
    init(renderer) {
      uniforms.dt.value = 0; uniforms.time.value = 0; uniforms.step.value = 0; uniforms.initPhase.value = 1;
      renderer.compute(kernel);
      steps = 0; clock = 0; ready = true;
    },
    /** One update of every particle by `dt` seconds (a fixed dt keeps runs identical). */
    step(renderer, dt) {
      if (!ready) this.init(renderer);
      uniforms.dt.value = dt; uniforms.time.value = clock; uniforms.step.value = steps; uniforms.initPhase.value = 0;
      renderer.compute(kernel);
      steps += 1; clock += dt;
    },
    /** For tests only: the state as Float32Arrays (position and velocity are xyzw per particle). Awaits the GPU. */
    async readback(renderer) {
      const read = async (buffer) => new Float32Array(await renderer.getArrayBufferAsync(buffer.value));
      const [position, velocity, age, attr] = await Promise.all(PARTICLE_BUFFERS.map((name) => read(buffers[name])));
      return { position, velocity, age, attr };
    },
    dispose() { drawable?.dispose(); },
  };
}
