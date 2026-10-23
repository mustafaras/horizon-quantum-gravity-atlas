// CPU reference for the GPU particle kit (S08). Pure: imports in Node without three.js, DOM or a GPU.
//
// It reproduces, bit for bit where integer arithmetic allows, what js/render/compute/particles.mjs computes on the GPU: the
// same PCG hash for randomness (three's TSL `hash`, from pcg-random.org), the same per-channel and per-step stream offsets, and
// the same buffer layout. A system author writes its `init` and `update` twice, in TSL and in JS; the tests then assert that the GPU
// readback equals this reference.

/** Channel stride of a random stream (a prime, so channels of one particle never collide with another particle's index). */
export const CHANNEL_STRIDE = 15485863;
/** Seed stride: the `seed * 7919` of the prompt. */
export const SEED_STRIDE = 7919;
/** Per-step stride of the update-time random stream (the golden-ratio odd constant). */
export const STEP_STRIDE = 2654435761;

const U32 = 0x100000000;

/** three.js TSL `hash`: the PCG hash of an unsigned integer, mapped to [0, 1) through float32 as on the GPU. */
export function hashU32(value) {
  const state = (Math.imul(value >>> 0, 747796405) + 2891336453) >>> 0;
  const word = Math.imul(((state >>> ((state >>> 28) + 4)) ^ state) >>> 0, 277803737) >>> 0;
  const result = ((word >>> 22) ^ word) >>> 0;
  return Math.fround(result) / U32;
}

/** The uint added to the instance index for (seed, channel): wraps modulo 2^32 exactly like the GPU's uint arithmetic. */
export function streamBase(seed, channel = 0) {
  return (Math.imul(seed >>> 0, SEED_STRIDE) + Math.imul(channel >>> 0, CHANNEL_STRIDE)) >>> 0;
}

/** Random in [0, 1) for particle `index`: `hash(index + seed * 7919 + channel * 15485863)`. */
export function randomFor(index, seed, channel = 0) {
  return hashU32((index + streamBase(seed, channel)) >>> 0);
}

/** Update-time random for a given step, so a respawn draws fresh values each time. */
export function randomForStep(index, seed, channel, step) {
  return hashU32((index + streamBase(seed, channel) + Math.imul(step >>> 0, STEP_STRIDE)) >>> 0);
}

/**
 * The same system on the CPU. `init(p)` and `update(p)` mutate one particle `p`:
 * `{ i, seed, step, dt, time, params, rand(channel), randStep(channel), position: {x,y,z,w}, velocity: {x,y,z,w}, age, attr: {x,y,z,w} }`
 * (`params` is the same object as `system.params`). Assigning a field leaves the others as they were, like omitting it in the GPU's returned state.
 * Buffers are float32, as on the GPU.
 */
export function createCpuParticleSystem({ count, seed = 0, init = null, update, initial = null, params = {} }) {
  if (!Number.isInteger(count) || count < 1) throw new RangeError(`createCpuParticleSystem: count must be a positive integer, got ${count}`);
  if (typeof update !== "function" || (init !== null && typeof init !== "function")) throw new TypeError("createCpuParticleSystem: update must be a function and init a function or null");
  if (init === null && initial === null) throw new TypeError("createCpuParticleSystem: pass init or initial");
  const buffers = {
    position: new Float32Array(count * 4), velocity: new Float32Array(count * 4), age: new Float32Array(count), attr: new Float32Array(count * 4),
  };
  if (initial) for (const [name, array] of Object.entries(initial)) buffers[name].set(array);
  const userParams = { ...params };
  let step = 0, time = 0;
  const particle = { i: 0, seed, step: 0, dt: 0, time: 0, params: userParams, position: { x: 0, y: 0, z: 0, w: 0 }, velocity: { x: 0, y: 0, z: 0, w: 0 }, age: 0, attr: { x: 0, y: 0, z: 0, w: 0 } };
  particle.rand = (channel = 0) => randomFor(particle.i, seed, channel);
  particle.randStep = (channel = 0) => randomForStep(particle.i, seed, channel, particle.step);
  const load = (i) => {
    particle.i = i;
    for (const name of ["position", "velocity", "attr"]) {
      const target = particle[name], source = buffers[name];
      target.x = source[i * 4]; target.y = source[i * 4 + 1]; target.z = source[i * 4 + 2]; target.w = source[i * 4 + 3];
    }
    particle.age = buffers.age[i];
  };
  const store = (i) => {
    for (const name of ["position", "velocity", "attr"]) {
      const source = particle[name], target = buffers[name];
      target[i * 4] = source.x; target[i * 4 + 1] = source.y; target[i * 4 + 2] = source.z; target[i * 4 + 3] = source.w;
    }
    buffers.age[i] = particle.age;
  };
  const run = (fn) => { for (let i = 0; i < count; i++) { load(i); fn(particle); store(i); } };
  return {
    count, seed, buffers, params: userParams,
    get step() { return step; }, get time() { return time; },
    init() { particle.step = 0; particle.dt = 0; particle.time = 0; if (init) run(init); step = 0; time = 0; },
    /** One update of every particle by `dt`, with the step counter the GPU uses (starts at 0, +1 per step). */
    advance(dt) {
      particle.step = step; particle.dt = dt; particle.time = time;
      run(update);
      step += 1; time += dt;
    },
  };
}
