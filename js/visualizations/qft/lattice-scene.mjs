/**
 * The lattice laboratory's Scene3D builder (S14): a classical phi^4 field on a 2+1D periodic lattice, evolved on the GPU
 * (lattice-gpu.mjs), drawn as an engraved height field coloured by its energy density (lattice-material.mjs), with the four terms of
 * the Hamiltonian density paintable through the Formula Lens.
 *
 * The simulated time of a frame is fixed (lattice-plan.mjs): the quality governor only changes how finely it is cut, so the physics does not
 * depend on the frame rate. A click kicks the momentum with a seeded Gaussian (js/science/lattice-field.mjs, kickParameters); under reduced motion
 * the lattice rests until Play, Step or a click advances it. Runs on the WebGPU renderer and on the node renderer's WebGL2 backend.
 *
 * env = { control, presetId, seed } where `control` is the lab's mutable state read every frame:
 *   { running, mass2, lambda, stepRequests, contour, stats }  (stats is written here and read by the lab's readouts)
 */

import { createLatticeGpu } from "./lattice-gpu.mjs";
import { createLatticeMaterial, LATTICE_SIZE } from "./lattice-material.mjs";
import { LATTICE_VIEW, budgetFromQuality, stepPlan } from "./lattice-plan.mjs";
import { kickSeed, presetStart, safeCouplings, vacuumLevel } from "./lattice-presets.mjs";
import { createLattice, energy, fromStaggered, kickParameters } from "../../science/lattice-field.mjs";
import { tagLayer as tag } from "../../render/scene-layers.mjs";
import { softwareRendererClamp } from "../../render/software-renderer.mjs";
import { typesetLabel } from "../common/katex-label.mjs";

const READOUT_MS = 450;
const READOUT_COST_FACTOR = 40; // the readback may take at most 1/40 of the time
const FRAME_EDGE = LATTICE_SIZE / 2;

/** Representative values of the current state for the Formula Lens card: the lattice's rms of phi, pi and the gradient, at the live couplings. */
function rmsSample(readout, couplings) {
  const rms = (values) => Math.sqrt(values.reduce((s, v) => s + v * v, 0) / Math.max(1, values.length));
  return { pi: rms(readout.momentum), g2: rms(readout.gradient), phi: rms(readout.phi), m2: couplings.mass2, lambda: couplings.lambda };
}

function frameLoop() {
  return Float32Array.from([-FRAME_EDGE, 0, -FRAME_EDGE, FRAME_EDGE, 0, -FRAME_EDGE, FRAME_EDGE, 0, FRAME_EDGE, -FRAME_EDGE, 0, FRAME_EDGE, -FRAME_EDGE, 0, -FRAME_EDGE]);
}

export async function buildLatticeScene(ctx, env) {
  const { scene } = ctx;
  const { control, presetId, seed } = env;
  const software = !!softwareRendererClamp(); // a CPU rasterizer needs seconds per frame of this lattice, as the Kerr observatory needs seconds for its disk
  const detail = software ? "low" : ctx.settings.current.detail3d;
  const size = LATTICE_VIEW.detailSizes[detail] ?? LATTICE_VIEW.detailSizes.medium;
  const spacing = LATTICE_VIEW.spacing;
  const planFor = (budget) => stepPlan({ frameTime: LATTICE_VIEW.frameTime, dtMax: LATTICE_VIEW.baseDt, budget });

  let budget = 1, ceiling = 1, lastPlan = planFor(1);
  const start = presetStart(presetId, { n: size, seed, dt: lastPlan.dt });
  const initial = safeCouplings(control.mass2, control.lambda);
  const lattice = createLatticeGpu({ n: size, spacing, mass2: initial.mass2, lambda: initial.lambda, start: start.staggered, dt: lastPlan.dt });
  const surfaceKit = createLatticeMaterial({ lattice, scales: start.scales, contour: control.contour });
  surfaceKit.uniforms.vacuum.value = vacuumLevel(initial.mass2, initial.lambda);

  const geometry = new ctx.THREE.PlaneGeometry(LATTICE_SIZE, LATTICE_SIZE, size - 1, size - 1);
  geometry.rotateX(-Math.PI / 2); // vertex k is site k: x = k mod n, y = k div n, z increasing with y
  const surface = new ctx.THREE.Mesh(geometry, surfaceKit.material);
  surface.frustumCulled = false; // the vertex stage moves the vertices: the bounding sphere of the flat plane is not the surface
  surface.name = "lattice-surface";
  scene.add(tag(surface, "model"));
  const frame = ctx.engraved.line(frameLoop(), { color: "ink-faint", widthPx: ctx.engraved.WIDTH_PX.hairline, layer: "decoration" });
  scene.add(tag(frame, "decoration"));

  // labels: the status first, the equation of motion typeset, then the instruction
  ctx.label("EFFECTIVE · classical φ⁴ lattice", () => ({ x: 0, y: 1.6, z: -FRAME_EDGE }), "s3d-strong s3d-lens-note");
  const equation = ctx.label("", () => ({ x: FRAME_EDGE - 2.4, y: 1.9, z: FRAME_EDGE + 0.3 }), "s3d-lens-note");
  typesetLabel(equation, "\\ddot\\phi=\\nabla^{2}\\phi-m^{2}\\phi-\\tfrac{\\lambda}{6}\\phi^{3}", "phi'' = lap phi - m^2 phi - (lambda/6) phi^3");
  const hint = ctx.annotation("click to kick the field", () => ({ x: 0, y: 1.4, z: FRAME_EDGE + 1.6 }));
  hint?.el?.classList.add("s3d-lens-note"); // above the opaque surface, like the labels

  // Formula Lens: the four terms of the Hamiltonian density over the surface
  let rms = { pi: 0.5, g2: 0.5, phi: 0.5, m2: initial.mass2, lambda: initial.lambda };
  const ranges = {
    kinetic: [0, start.scales.terms.kinetic], gradient: [0, start.scales.terms.gradient],
    mass: [-start.scales.terms.mass, start.scales.terms.mass], interaction: [0, start.scales.terms.interaction],
  };
  const { attachLens } = await import("../common/lens-scenes.mjs");
  await attachLens("qft-lattice", ctx, { surface, nodes: surfaceKit.nodes, ranges, sample: () => rms });

  // run state
  let renderer = null, ready = false, dirty = true, kickPending = false, kickCount = 0;
  let appliedMass2 = initial.mass2, appliedLambda = initial.lambda;
  // The first energy comes from the CPU start state; the GPU is read back only after its first step (see readback in lattice-gpu.mjs).
  const startEnergy = energy(start.params, start.state) - vacuumLevel(initial.mass2, initial.lambda) * start.params.volume;
  let readoutBusy = false, lastReadout = -Infinity, energy0 = startEnergy, energyKey = `${initial.mass2}|${initial.lambda}|0`;
  const stats = control.stats = { n: size, backend: null, time: 0, steps: 0, stepsPerFrame: lastPlan.steps, dt: lastPlan.dt, energy: startEnergy, energy0: startEnergy, drift: 0, lambdaRaised: false, software: false };
  stats.software = software;
  if (ctx.motion() === 0 || software) control.running = false; // reduced motion or a CPU rasterizer (seconds per frame): the lattice rests until Play, Step or a click

  const publish = () => {
    // QA hook (qa/specs/lattice-lab.spec.mjs): the live counters and a readback of the named buffers
    window.__qgaLattice = {
      n: size, backend: stats.backend, get time() { return lattice.time; }, get steps() { return lattice.steps; }, running: control.running, stats,
      readback: (names) => lattice.readback(renderer, names),
    };
  };

  // A readback waits for the GPU to finish what it has queued, so it is the one expensive call of the frame. On hardware it costs milliseconds and
  // runs at an interval of 40 times its own measured cost (never more than about 2.5 percent of the time); on a CPU rasterizer it costs seconds, so
  // it runs only while the lattice is not advancing, when no frame is being paid for.
  let readoutCost = 0, nextReadout = 0, readVersion = -1, stateVersion = 0;
  function readout(now, advancing) {
    if (readoutBusy || !renderer || lattice.steps === 0 || now < nextReadout) return;
    if (software ? advancing || stateVersion === readVersion : stateVersion === readVersion && !advancing) return;
    readoutBusy = true; readVersion = stateVersion;
    const couplings = { mass2: appliedMass2, lambda: appliedLambda };
    const key = `${couplings.mass2}|${couplings.lambda}|${kickCount}`;
    const began = performance.now();
    const request = lattice.readback(renderer, ["phi", "pi", "momentum", "gradient"]);
    readoutCost = performance.now() - began; // the synchronous wait, where the stall is
    nextReadout = now + Math.max(READOUT_MS, READOUT_COST_FACTOR * readoutCost);
    request.then((state) => {
      const params = createLattice({ dim: 2, n: size, a: spacing, mass2: couplings.mass2, lambda: couplings.lambda, dt: lastPlan.dt });
      const synchronised = fromStaggered(params, { phi: Float64Array.from(state.phi), pi: Float64Array.from(state.pi) });
      const total = energy(params, synchronised) - vacuumLevel(couplings.mass2, couplings.lambda) * params.volume;
      if (energy0 === null || key !== energyKey) { energy0 = total; energyKey = key; }
      rms = rmsSample(state, couplings);
      Object.assign(stats, {
        time: lattice.time, steps: lattice.steps, energy: total, energy0, drift: Math.abs(total - energy0) / Math.max(1e-12, Math.abs(energy0)),
        stepsPerFrame: lastPlan.steps, dt: lastPlan.dt,
      });
    }).catch(() => { /* a lost context resets the lattice; the next readout starts again */ }).finally(() => { readoutBusy = false; });
  }

  const onPick = (object, hit) => {
    if (!hit?.uv) return;
    kickCount += 1;
    const { amplitude, width } = kickParameters({ a: spacing }, kickSeed(seed, kickCount));
    lattice.kick({ x: Math.round(hit.uv.x * (size - 1)), y: Math.round((1 - hit.uv.y) * (size - 1)), amplitude, width });
    kickPending = true;
    ctx.invalidate();
  };

  return {
    autoRotate: false,
    pickables: [surface],
    onPick,
    isAnimated: () => control.running || control.stepRequests > 0 || kickPending || dirty,
    /** The quality governor's budget: the finer cut of the frame's fixed simulated time. */
    applyRenderQuality(quality) {
      ceiling = Math.max(ceiling, quality.raySteps);
      budget = budgetFromQuality(quality, ceiling);
    },
    async prepare(activeRenderer) {
      renderer = activeRenderer;
      stats.backend = renderer.backend?.isWebGPUBackend === true ? "webgpu" : "webgl2";
      lattice.analyse(renderer);
      ready = true; dirty = false;
      publish();
    },
    compute(activeRenderer, dt) {
      if (!ready) return;
      renderer = activeRenderer;
      const couplings = safeCouplings(control.mass2, control.lambda);
      stats.lambdaRaised = couplings.lambda !== control.lambda;
      if (couplings.mass2 !== appliedMass2 || couplings.lambda !== appliedLambda) {
        lattice.uniforms.mass2.value = appliedMass2 = couplings.mass2;
        lattice.uniforms.lambda.value = appliedLambda = couplings.lambda;
        surfaceKit.uniforms.vacuum.value = vacuumLevel(appliedMass2, appliedLambda);
        dirty = true; stateVersion += 1; // the Hamiltonian changed: the energy is read again and its baseline reset
      }
      const advance = (control.running && dt > 0) || control.stepRequests > 0 || kickPending;
      if (advance) {
        lastPlan = planFor(budget);
        lattice.step(renderer, lastPlan.steps, lastPlan.dt);
        if (control.stepRequests > 0) control.stepRequests -= 1;
        kickPending = false; dirty = true; stateVersion += 1;
      }
      surfaceKit.uniforms.contour.value = control.contour ? 1 : 0;
      if (dirty) { lattice.analyse(renderer); dirty = false; }
      readout(performance.now(), advance);
      publish();
    },
    dispose() {
      lattice.dispose();
      geometry.dispose();
      surfaceKit.material.dispose();
      surfaceKit.lut.dispose();
      delete window.__qgaLattice;
    },
    recoverable: () => false,
  };
}
