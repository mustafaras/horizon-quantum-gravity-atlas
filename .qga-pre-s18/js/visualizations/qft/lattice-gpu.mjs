/**
 * The phi^4 lattice on the GPU (S14): the leapfrog of js/science/lattice-field.mjs as TSL compute kernels over storage buffers.
 *
 * State: `phi` and `pi` (float per site, n x n sites, row-major, the staggered momentum pi_{n-1/2}). One step is two kernels,
 *
 *   kick   pi  += dt F(phi) (+ the seeded Gaussian kick of a click)      reads phi at the site and its four neighbours, writes pi
 *   drift  phi += dt pi                                                   reads pi and phi at the site, writes phi
 *
 * and each kernel writes exactly ONE buffer, so no invocation reads what another writes in the same dispatch: it is race free on the
 * WebGPU backend, and on the node renderer's WebGL2 backend (a kernel is a transform-feedback pass) the buffers a kernel does not write are
 * not swapped. Reads of a storage buffer go through `setPBO(true)` there (r186: the buffer is copied to a texture after each dispatch and
 * read with texelFetch, which is what a gather needs, in a kernel and in the scene's vertex stage); on WebGPU the flag has no effect. A single fused kernel would race on WebGPU, which is
 * why S08's one-kernel rule (kernels that WRITE the same buffers) does not apply: verified against the CPU reference on both backends,
 * qa/specs/lattice-gpu.spec.mjs.
 *
 * A third kernel, `analyse`, runs once per frame and writes the display buffers: the synchronised momentum pi_n = pi_{n-1/2} + dt/2 F, the
 * squared forward-difference gradient and the energy density, which is the Formula Core expression qft-phi4-hamiltonian compiled by compileTSL:
 * the colour on screen and the equation in the card are one expression.
 *
 * Parameters (m^2, lambda, dt, the kick) are uniforms: changing them compiles nothing. The lattice size is a compile-time constant.
 */

import * as TSL from "three/tsl";
import { compileTSL } from "../../formula/to-tsl.mjs";
import { phi4HamiltonianDensity } from "../../formula/library/qft.mjs";

const { Fn, abs, exp, float, instanceIndex, instancedArray, min, uint, uniform } = TSL;

export const LATTICE_WORKGROUP = 64;
const STATE_NAMES = Object.freeze(["phi", "pi"]);
const BUFFER_NAMES = Object.freeze([...STATE_NAMES, "energy", "momentum", "gradient"]);
let serial = 0;

/**
 * @param {object} options
 * @param {number} options.n          sites per side (the lattice is n x n, periodic)
 * @param {number} options.spacing    lattice spacing a
 * @param {number} options.mass2      m^2 (a uniform afterwards)
 * @param {number} options.lambda     quartic coupling (a uniform afterwards)
 * @param {{phi: Float32Array, pi: Float32Array}} options.start  the staggered state (phi_0, pi_{-1/2}), n*n floats each: the one CPU write
 * @param {number} options.dt         the step length the start's half-step offset was made for (toStaggered)
 */
export function createLatticeGpu({ n, spacing, mass2, lambda, start, dt }) {
  if (!Number.isInteger(n) || n < 4) throw new RangeError(`createLatticeGpu: n must be an integer >= 4, received ${n}`);
  if (!(dt > 0)) throw new RangeError(`createLatticeGpu: dt must be positive, received ${dt}`);
  const count = n * n;
  if (!(start?.phi instanceof Float32Array) || start.phi.length !== count || !(start?.pi instanceof Float32Array) || start.pi.length !== count) {
    throw new RangeError(`createLatticeGpu: start.phi and start.pi must be Float32Arrays of ${count} floats`);
  }
  const id = ++serial; // each kernel's source carries it: r186 caches a program by source and keeps the first kernel's buffers (see S08)
  const buffers = Object.fromEntries(BUFFER_NAMES.map((name) => [name, instancedArray(count, "float")]));
  buffers.phi.value.array.set(start.phi);
  buffers.pi.value.array.set(start.pi);
  // On the WebGL2 backend a storage buffer is read through a texture (the PBO), and the flag must be there before ANY shader that reads the buffer
  // compiles, the scene's own material included (the stage may compile it before the first compute); on WebGPU it has no effect.
  for (const buffer of Object.values(buffers)) buffer.setPBO(true);
  const uniforms = {
    dt: uniform(dt), kickDt: uniform(dt), mass2: uniform(mass2), lambda: uniform(lambda),
    kickAmplitude: uniform(0), kickWidth: uniform(1), kickX: uniform(0), kickY: uniform(0),
  };

  // Site and its four periodic neighbours, as uint index nodes.
  const un = uint(n), i = instanceIndex;
  const x = i.mod(un), y = i.div(un);
  const xm = x.add(uint(n - 1)).mod(un), xp = x.add(uint(1)).mod(un), ym = y.add(uint(n - 1)).mod(un), yp = y.add(uint(1)).mod(un);
  const at = (xx, yy) => buffers.phi.element(yy.mul(un).add(xx));
  const invA2 = 1 / (spacing * spacing);

  /** F = lap phi - m^2 phi - (lambda / 6) phi^3 at this site (the same expression as acceleration() on the CPU). */
  const force = (p) => at(xm, y).add(at(xp, y)).add(at(x, ym)).add(at(x, yp)).sub(p.mul(4)).mul(invA2)
    .sub(p.mul(uniforms.mass2)).sub(p.mul(p).mul(p).mul(uniforms.lambda.div(6)));

  /** The Gaussian kick at (kickX, kickY) in site units, by the periodic distance; zero when kickAmplitude is zero. */
  const kickBump = () => {
    const dxRaw = abs(x.toFloat().sub(uniforms.kickX)), dyRaw = abs(y.toFloat().sub(uniforms.kickY));
    const dx = min(dxRaw, float(n).sub(dxRaw)).mul(spacing), dy = min(dyRaw, float(n).sub(dyRaw)).mul(spacing);
    return uniforms.kickAmplitude.mul(exp(dx.mul(dx).add(dy.mul(dy)).div(uniforms.kickWidth.mul(uniforms.kickWidth).mul(-2))));
  };
  const tag = float(id).mul(0); // changes the source, not the maths

  const kickKernel = Fn(() => {
    const p = buffers.phi.element(i);
    buffers.pi.element(i).assign(buffers.pi.element(i).add(uniforms.kickDt.mul(force(p))).add(kickBump()).add(tag));
  })().compute(count, [LATTICE_WORKGROUP]);
  const driftKernel = Fn(() => {
    buffers.phi.element(i).assign(buffers.phi.element(i).add(uniforms.dt.mul(buffers.pi.element(i))).add(tag));
  })().compute(count, [LATTICE_WORKGROUP]);
  const analyseKernel = Fn(() => {
    const p = buffers.phi.element(i).toVar();
    const synchronised = buffers.pi.element(i).add(uniforms.dt.mul(0.5).mul(force(p))).toVar();
    const gx = at(xp, y).sub(p), gy = at(x, yp).sub(p);
    const gradient = gx.mul(gx).add(gy.mul(gy)).mul(invA2).toVar();
    const { node: density } = compileTSL(phi4HamiltonianDensity.expr, TSL, { pi: synchronised, g2: gradient, phi: p, m2: uniforms.mass2, lambda: uniforms.lambda });
    buffers.momentum.element(i).assign(synchronised.add(tag));
    buffers.gradient.element(i).assign(gradient);
    buffers.energy.element(i).assign(density);
  })().compute(count, [LATTICE_WORKGROUP]);

  const pendingKick = { x: 0, y: 0, amplitude: 0, width: 1 };
  let owner = null, steps = 0, time = 0, lastDt = dt, analysed = false;
  return {
    n, count, spacing, buffers, uniforms, kernels: { kick: kickKernel, drift: driftKernel, analyse: analyseKernel },
    get steps() { return steps; }, get time() { return time; },
    /** Queue the next click's kick: it is applied in the first kick pass of the next step() and then cleared. x and y are in sites. */
    kick({ x: kickX, y: kickY, amplitude, width }) {
      Object.assign(pendingKick, { x: kickX, y: kickY, amplitude, width });
    },
    /**
     * `stepCount` kick-drift steps of length `stepDt`. When the length changes (the quality governor), the first kick uses the mean of the old and
     * the new length, which keeps the momentum's half-step offset (variable-step leapfrog, stepStaggeredVariable on the CPU). A new renderer (a
     * released and restored WebGL2 context) holds none of this state: the clock restarts.
     */
    step(renderer, stepCount, stepDt) {
      if (renderer !== owner) { owner = renderer; steps = 0; time = 0; }
      uniforms.dt.value = stepDt;
      for (let s = 0; s < stepCount; s++) {
        uniforms.kickDt.value = s === 0 ? (lastDt + stepDt) / 2 : stepDt;
        if (s === 0 && pendingKick.amplitude !== 0) {
          uniforms.kickX.value = pendingKick.x; uniforms.kickY.value = pendingKick.y;
          uniforms.kickAmplitude.value = pendingKick.amplitude; uniforms.kickWidth.value = pendingKick.width;
          pendingKick.amplitude = 0;
        } else {
          uniforms.kickAmplitude.value = 0;
        }
        renderer.compute(kickKernel);
        renderer.compute(driftKernel);
      }
      uniforms.kickAmplitude.value = 0;
      steps += stepCount; time += stepCount * stepDt; lastDt = stepDt;
    },
    /** Fill the display buffers (synchronised momentum, gradient, energy density) from the current state. */
    analyse(renderer) { renderer.compute(analyseKernel); analysed = true; },
    /**
     * The named buffers as Float32Arrays (default: phi and the staggered pi). Awaits the GPU: for readouts and tests, not for every frame.
     * A buffer exists on the GPU once a kernel has WRITTEN it, and asking the backend for one that does not yet exist leaves an empty record that
     * breaks the first kernel that writes it (r186 WebGL2). So before the first step phi and pi are answered from the start state the buffers were
     * created with, which is exactly what the GPU holds, and the display buffers need analyse() first.
     */
    async readback(renderer, names = STATE_NAMES) {
      const initial = { phi: start.phi, pi: start.pi };
      const read = async (name) => {
        if (steps === 0 && name in initial) return Float32Array.from(initial[name]);
        if (!(name in initial) && !analysed) throw new RangeError(`readback: "${name}" exists after analyse() has run`);
        return new Float32Array(await renderer.getArrayBufferAsync(buffers[name].value)).subarray(0, count);
      };
      return Object.fromEntries(await Promise.all(names.map(async (name) => [name, await read(name)])));
    },
    dispose() { /* storage buffers are released with the renderer; there is no drawable of its own */ },
  };
}
