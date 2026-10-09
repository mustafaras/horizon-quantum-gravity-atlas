import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

import * as constants from "../js/science/constants.mjs";
import * as kerr from "../js/science/kerr.mjs";
import * as integrators from "../js/science/integrators.mjs";
import * as disk from "../js/science/accretion-disk.mjs";
import * as spectrum from "../js/science/spectrum.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

const SCIENCE_MODULES = [constants, kerr, integrators, disk, spectrum];

/**
 * `js/physics.jsx` is a classic script (no ESM import available) that mirrors the
 * pure science layer onto `window.QGA_PHYSICS`. Evaluating it in a `node:vm`
 * context lets us assert that the mirror has not drifted from the ESM modules.
 */
async function loadBridge() {
  const source = await readFile(resolve(ROOT, "js/physics.jsx"), "utf8");
  const context = vm.createContext({ window: {}, console });
  vm.runInContext(source, context, { filename: "js/physics.jsx" });
  return context.window.QGA_PHYSICS;
}

const bridge = await loadBridge();

/** Values cross a `node:vm` realm boundary, so compare by value, not by prototype. */
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function closeTo(actual, expected, tolerance, label) {
  if (Number.isNaN(expected)) {
    assert.ok(Number.isNaN(actual), `${label}: expected NaN, received ${actual}`);
    return;
  }
  if (!Number.isFinite(expected)) {
    assert.equal(actual, expected, `${label}: expected ${expected}, received ${actual}`);
    return;
  }
  const scale = Math.max(1, Math.abs(expected));
  const delta = Math.abs(actual - expected);
  assert.ok(
    delta <= tolerance * scale,
    `${label}: |${actual} - ${expected}| = ${delta} exceeds ${tolerance * scale}`,
  );
}

test("the browser bridge exposes every public science name", () => {
  const expected = new Set();
  for (const module of SCIENCE_MODULES) {
    for (const name of Object.keys(module)) expected.add(name);
  }
  const missing = [...expected].filter((name) => !(name in bridge)).sort();
  assert.deepEqual(missing, [], `bridge is missing: ${missing.join(", ")}`);
  assert.ok(expected.size >= 100, `expected a broad surface, saw ${expected.size}`);
});

test("mirrored values are identical to the ESM modules", () => {
  const shared = [
    "BOLTZMANN_K",
    "C",
    "G",
    "GRAVITATIONAL_CONSTANT",
    "HBAR",
    "H_PLANCK",
    "KB",
    "MAX_SPIN_MAGNITUDE",
    "PLANCK_H",
    "SOLAR_MASS",
    "SOLAR_MASS_KG",
    "SPEED_OF_LIGHT",
    "STEFAN_BOLTZMANN",
    "WIEN_DISPLACEMENT_B",
    "DEFAULT_QUADRATURE_ORDER",
    "FAST_FIT_STEP_NM",
    "NANOMETRE_TO_METRE",
    "SRGB_GAMMA_EXPONENT",
    "SRGB_GAMMA_OFFSET",
    "SRGB_GAMMA_SLOPE",
    "SRGB_GAMMA_THRESHOLD",
    "WIEN_FREQUENCY_COEFFICIENT",
    "TWO_PI",
  ];
  for (const name of shared) {
    const reference = SCIENCE_MODULES.map((m) => m[name]).find((v) => v !== undefined);
    assert.notEqual(reference, undefined, `${name} is not exported by any science module`);
    assert.equal(bridge[name], reference, `${name} drifted`);
  }
  assert.deepEqual(
    plain(bridge.XYZ_TO_LINEAR_SRGB),
    plain(spectrum.XYZ_TO_LINEAR_SRGB),
    "XYZ_TO_LINEAR_SRGB drifted",
  );
  assert.deepEqual(
    plain(bridge.CIE_1931_2DEG_SOURCE),
    plain(spectrum.CIE_1931_2DEG_SOURCE),
    "CIE provenance drifted",
  );
});

test("mirrored Kerr radii match the ESM module across the spin domain", () => {
  const spins = [0, 0.1, 0.5, 0.9, 0.998, 1, -1];
  for (const a of spins) {
    const reference = kerr.kerrHorizonRadii(a);
    const mirrored = bridge.kerrHorizonRadii(a);
    closeTo(mirrored.rPlus, reference.rPlus, 1e-15, `rPlus(a=${a})`);
    closeTo(mirrored.rMinus, reference.rMinus, 1e-15, `rMinus(a=${a})`);
    assert.equal(mirrored.extremal, reference.extremal, `extremal(a=${a})`);

    for (const prograde of [true, false]) {
      closeTo(
        bridge.kerrIsco(a, { prograde }),
        kerr.kerrIsco(a, { prograde }),
        1e-15,
        `isco(a=${a}, prograde=${prograde})`,
      );
      closeTo(
        bridge.kerrPhotonSphere(a, { prograde }),
        kerr.kerrPhotonSphere(a, { prograde }),
        1e-15,
        `photon(a=${a}, prograde=${prograde})`,
      );
    }
    for (const theta of [0.3, Math.PI / 2, 2.4]) {
      closeTo(
        bridge.kerrErgosphereRadius(a, theta),
        kerr.kerrErgosphereRadius(a, theta),
        1e-15,
        `ergo(a=${a}, theta=${theta})`,
      );
    }
  }
});

test("mirrored metric components and potentials match the ESM module", () => {
  for (const a of [0, 0.5, 0.9, 0.998]) {
    for (const r of [2.5, 6, 20]) {
      for (const theta of [0.4, Math.PI / 2, 2.2]) {
        const reference = kerr.kerrMetricComponents(a, r, theta);
        const mirrored = bridge.kerrMetricComponents(a, r, theta);
        for (const key of ["gTT", "gTPhi", "gPhiPhi", "gRR", "gThetaTheta", "delta", "sigma", "A"]) {
          closeTo(mirrored[key], reference[key], 1e-14, `metric.${key}(a=${a},r=${r})`);
        }
        const inverse = kerr.kerrInverseMetricComponents(a, r, theta);
        const mirroredInverse = bridge.kerrInverseMetricComponents(a, r, theta);
        for (const key of ["gTTUp", "gTPhiUp", "gPhiPhiUp", "gRRUp", "gThetaThetaUp"]) {
          closeTo(mirroredInverse[key], inverse[key], 1e-14, `inverse.${key}(a=${a},r=${r})`);
        }
        const derivatives = kerr.kerrInverseMetricDerivatives(a, r, theta);
        const mirroredDerivatives = bridge.kerrInverseMetricDerivatives(a, r, theta);
        for (const key of Object.keys(derivatives)) {
          if (typeof derivatives[key] !== "number") continue;
          closeTo(mirroredDerivatives[key], derivatives[key], 1e-13, `d.${key}(a=${a},r=${r})`);
        }
      }
    }
  }

  const ray = { aStar: 0.7, E: 1, Lz: 2.1, Q: 3.4 };
  for (const r of [3, 8, 40]) {
    closeTo(
      bridge.kerrRadialPotential({ ...ray, r }),
      kerr.kerrRadialPotential({ ...ray, r }),
      1e-14,
      `radial(r=${r})`,
    );
  }
  for (const theta of [0.5, 1.2, 2.6]) {
    closeTo(
      bridge.kerrPolarPotential({ ...ray, theta }),
      kerr.kerrPolarPotential({ ...ray, theta }),
      1e-14,
      `polar(theta=${theta})`,
    );
  }
});

test("mirrored conserved quantities and Hamiltonian match the ESM module", () => {
  const cases = [
    { aStar: 0, r: 20, theta: 1.2, direction: [0.6, 0.3, 0.2], observer: "zamo" },
    { aStar: 0.9, r: 12, theta: 0.9, direction: [-0.4, 0.5, 0.3], observer: "zamo" },
    { aStar: 0.5, r: 30, theta: 2.0, direction: [0.1, -0.7, 0.4], observer: "static" },
  ];
  for (const options of cases) {
    const reference = kerr.kerrConservedQuantities(options);
    const mirrored = bridge.kerrConservedQuantities(options);
    for (const key of ["E", "Lz", "Q", "pT", "pR", "pTheta", "pPhi", "pt", "pr", "ptheta", "pphi"]) {
      closeTo(mirrored[key], reference[key], 1e-13, `conserved.${key}`);
    }
    const state = [0, options.r, options.theta, 0, -reference.E, reference.pR, reference.pTheta, reference.Lz];
    closeTo(
      bridge.hamiltonianValue(state, options.aStar),
      kerr.hamiltonianValue(state, options.aStar),
      1e-12,
      "hamiltonianValue",
    );
    closeTo(
      bridge.carterConstantFromState(state, options.aStar),
      kerr.carterConstantFromState(state, options.aStar),
      1e-12,
      "carterConstantFromState",
    );
    const rhs = kerr.kerrHamiltonianRHS(state, { aStar: options.aStar });
    const mirroredRhs = bridge.kerrHamiltonianRHS(state, { aStar: options.aStar });
    for (let i = 0; i < rhs.length; i += 1) {
      closeTo(mirroredRhs[i], rhs[i], 1e-12, `rhs[${i}]`);
    }
  }
});

test("mirrored Kerr-Schild conversion matches the ESM module", () => {
  for (const a of [0, 0.5, 0.9, 0.999, 1]) {
    for (const r of [2.5, 5, 25]) {
      closeTo(
        bridge.kerrSchildTimeOffset(a, r),
        kerr.kerrSchildTimeOffset(a, r),
        1e-13,
        `ksOffset(a=${a}, r=${r})`,
      );
    }
  }
  const point = { aStar: 0.6, r: 9, theta: 1.1, phi: 0.7, t: 12 };
  const reference = kerr.boyerLindquistToKerrSchild(point);
  const mirrored = bridge.boyerLindquistToKerrSchild(point);
  for (const key of ["t", "x", "y", "z", "r"]) {
    closeTo(mirrored[key], reference[key], 1e-13, `ks.${key}`);
  }
});

test("mirrored ray tracing reproduces the ESM result", () => {
  const options = {
    aStar: 0.9,
    r: 20,
    theta: 1.2,
    direction: [-0.9, 0.1, -0.3],
    diskInner: 2.32,
    diskOuter: 30,
    atol: 1e-10,
    rtol: 1e-10,
  };
  const reference = kerr.traceKerrRay(options);
  const mirrored = bridge.traceKerrRay(options);
  assert.equal(mirrored.status, reference.status, "ray status drifted");
  assert.equal(mirrored.steps, reference.steps, "ray step count drifted");
  closeTo(mirrored.state[1], reference.state[1], 1e-12, "ray final r");
  closeTo(mirrored.state[2], reference.state[2], 1e-12, "ray final theta");
  closeTo(mirrored.drift.Q, reference.drift.Q, 1e-9, "ray Q drift");
  closeTo(mirrored.drift.hamiltonian, reference.drift.hamiltonian, 1e-9, "ray H drift");
});

test("mirrored integrators reproduce the ESM result", () => {
  const rhs = (state) => [state[1], -state[0]];
  const initial = [1, 0];
  const reference = integrators.rk4Step(rhs, initial, 0.1);
  const mirrored = bridge.rk4Step(rhs, initial, 0.1);
  for (let i = 0; i < reference.length; i += 1) {
    closeTo(mirrored[i], reference[i], 1e-15, `rk4[${i}]`);
  }
  const reference45 = integrators.rk45Step(rhs, initial, 0.1, undefined, 1e-10, 1e-10);
  const mirrored45 = bridge.rk45Step(rhs, initial, 0.1, undefined, 1e-10, 1e-10);
  for (let i = 0; i < reference45.state.length; i += 1) {
    closeTo(mirrored45.state[i], reference45.state[i], 1e-15, `rk45[${i}]`);
  }
  closeTo(mirrored45.errorNorm, reference45.errorNorm, 1e-14, "rk45 errorNorm");

  const adaptiveOptions = {
    rhs,
    state: [0, 1],
    h0: 0.05,
    hMax: 0.5,
    maxSteps: 200,
    atol: 1e-10,
    rtol: 1e-10,
    event: integrators.createRadialTermination({ outerRadius: 0.5, outerType: "escaped" }),
  };
  const referenceRun = integrators.integrateAdaptive(adaptiveOptions);
  const mirroredRun = bridge.integrateAdaptive(adaptiveOptions);
  assert.equal(mirroredRun.status, referenceRun.status, "adaptive status drifted");
  assert.equal(mirroredRun.steps, referenceRun.steps, "adaptive step count drifted");
  closeTo(mirroredRun.state[0], referenceRun.state[0], 1e-12, "adaptive final t");
});

test("mirrored accretion-disk physics matches the ESM module", () => {
  for (const a of [0, 0.5, 0.9, 0.998]) {
    for (const r of [4.5, 6, 10, 40]) {
      for (const prograde of [true, false]) {
        const reference = disk.kerrCircularOrbit(a, r, { prograde });
        const mirrored = bridge.kerrCircularOrbit(a, r, { prograde });
        for (const key of ["energy", "angularMomentum", "omega", "omegaDerivative", "timeComponent"]) {
          closeTo(mirrored[key], reference[key], 1e-13, `orbit.${key}(a=${a},r=${r})`);
        }
      }
    }
  }

  for (const a of [0, 0.5, 0.9]) {
    for (const r of [6, 10, 30]) {
      closeTo(
        bridge.pageThorneFluxGeometric({ aStar: a, r }),
        disk.pageThorneFluxGeometric({ aStar: a, r }),
        1e-12,
        `flux(a=${a}, r=${r})`,
      );
    }
  }

  const nodes = disk.gaussLegendreNodes(16);
  const mirroredNodes = bridge.gaussLegendreNodes(16);
  for (let i = 0; i < nodes.nodes.length; i += 1) {
    closeTo(mirroredNodes.nodes[i], nodes.nodes[i], 1e-15, `gl.node[${i}]`);
    closeTo(mirroredNodes.weights[i], nodes.weights[i], 1e-15, `gl.weight[${i}]`);
  }

  closeTo(
    bridge.geometricStefanBoltzmannConstant(10),
    disk.geometricStefanBoltzmannConstant(10),
    1e-15,
    "sigmaGeom",
  );
  const flux = disk.pageThorneFluxGeometric({ aStar: 0.5, r: 12 });
  closeTo(
    bridge.diskEffectiveTemperatureKelvin(flux, 10),
    disk.diskEffectiveTemperatureKelvin(flux, 10),
    1e-12,
    "diskTemperature",
  );

  const g = { energy: 0.95, angularMomentum: 3.1, omega: 0.05, lz: 3.1 };
  closeTo(
    bridge.kerrOrbitalDopplerFactor(g),
    disk.kerrOrbitalDopplerFactor(g),
    1e-15,
    "dopplerFactor",
  );
  const totalOptions = { aStar: 0.5, r: 10, prograde: true, energy: 0.95, lz: 3.1 };
  const referenceTotal = disk.kerrTotalRedshiftFactor(totalOptions);
  const mirroredTotal = bridge.kerrTotalRedshiftFactor(totalOptions);
  for (const key of ["total", "gravitational", "orbital", "timeComponent"]) {
    closeTo(mirroredTotal[key], referenceTotal[key], 1e-14, `totalRedshift.${key}`);
  }
  closeTo(
    bridge.kerrGravitationalRedshiftStatic(0.5, 8),
    disk.kerrGravitationalRedshiftStatic(0.5, 8),
    1e-15,
    "staticRedshift",
  );
});

test("mirrored spectral conversion matches the ESM module", () => {
  for (const temperature of [1000, 3000, 5800, 6500, 20000, 40000]) {
    closeTo(
      bridge.planckSpectralRadiance(500e-9, temperature),
      spectrum.planckSpectralRadiance(500e-9, temperature),
      1e-15,
      `planck(500nm, ${temperature}K)`,
    );
    closeTo(
      bridge.wienPeakWavelengthMeters(temperature),
      spectrum.wienPeakWavelengthMeters(temperature),
      1e-15,
      `wienLambda(${temperature}K)`,
    );
    closeTo(
      bridge.wienPeakFrequencyHz(temperature),
      spectrum.wienPeakFrequencyHz(temperature),
      1e-15,
      `wienNu(${temperature}K)`,
    );
    const reference = spectrum.blackbodyToSrgb(temperature);
    const mirrored = bridge.blackbodyToSrgb(temperature);
    assert.equal(mirrored.hex, reference.hex, `blackbody hex at ${temperature}K`);
    for (const key of ["x", "y", "z"]) {
      closeTo(mirrored.xyz[key], reference.xyz[key], 1e-13, `xyz.${key}(${temperature}K)`);
    }
    const fast = spectrum.fastBlackbodyToSrgb(temperature);
    const mirroredFast = bridge.fastBlackbodyToSrgb(temperature);
    assert.equal(mirroredFast.hex, fast.hex, `fast blackbody hex at ${temperature}K`);
  }

  for (const wavelength of [380, 445, 555, 600, 700, 780]) {
    const reference = spectrum.cieXyzBarAnalytic(wavelength);
    const mirrored = bridge.cieXyzBarAnalytic(wavelength);
    for (const key of ["x", "y", "z"]) {
      closeTo(mirrored[key], reference[key], 1e-15, `cmf.${key}(${wavelength}nm)`);
    }
  }
  for (const index of [0, 35, 80]) {
    const reference = spectrum.cieXyzBarTabulated(index);
    const mirrored = bridge.cieXyzBarTabulated(index);
    for (const key of ["x", "y", "z"]) {
      closeTo(mirrored[key], reference[key], 1e-15, `tabulated.${key}(${index})`);
    }
  }

  const radiance = (lambda) => spectrum.planckSpectralRadiance(lambda, 6500);
  const referenceXyz = spectrum.cieXyzFromSpectralRadiance(radiance);
  const mirroredXyz = bridge.cieXyzFromSpectralRadiance(radiance);
  for (const key of ["x", "y", "z"]) {
    closeTo(mirroredXyz[key], referenceXyz[key], 1e-13, `cieXyz.${key}`);
  }

  const referenceError = spectrum.fastBlackbodyToSrgbMaxError({ samples: 40 });
  const mirroredError = bridge.fastBlackbodyToSrgbMaxError({ samples: 40 });
  closeTo(mirroredError.maxChannelError, referenceError.maxChannelError, 1e-12, "fast maxChannelError");
  closeTo(
    mirroredError.maxChromaticityError,
    referenceError.maxChromaticityError,
    1e-12,
    "fast maxChromaticityError",
  );
});

test("the bridge rejects the same invalid inputs as the ESM modules", () => {
  const cases = [
    () => bridge.kerrHorizonRadii("not-a-number"),
    () => bridge.kerrIsco(1.5),
    () => bridge.kerrMetricComponents(0.5, -1, 0),
    () => bridge.kerrConservedQuantities({ aStar: 0, r: 10, theta: 1, direction: [0, 0, 0] }),
    () => bridge.planckSpectralRadiance(-1, 5000),
    () => bridge.planckSpectralRadiance(500e-9, -1),
    () => bridge.blackbodyToSrgb(0),
    () => bridge.rk4Step("nope", [1], 0.1),
    () => bridge.integrateAdaptive({ rhs: (s) => s, state: [1], h0: 0.1, hMin: 1, hMax: 0.1 }),
    () => bridge.pageThorneFluxGeometric({ aStar: 0.5, r: 10, prograde: "yes" }),
  ];
  for (const [index, run] of cases.entries()) {
    assert.throws(
      run,
      (error) => error.name === "RangeError" || error.name === "TypeError",
      `case ${index}`,
    );
  }
});

test("the bridge is deterministic across evaluations", async () => {
  const second = await loadBridge();
  assert.equal(second.blackbodyToSrgb(6500).hex, bridge.blackbodyToSrgb(6500).hex);
  assert.equal(
    second.kerrIsco(0.9, { prograde: true }),
    bridge.kerrIsco(0.9, { prograde: true }),
  );
  assert.equal(
    second.traceKerrRay({ aStar: 0, r: 20, theta: 1.2, direction: [0.6, 0.3, 0.2] }).steps,
    bridge.traceKerrRay({ aStar: 0, r: 20, theta: 1.2, direction: [0.6, 0.3, 0.2] }).steps,
  );
});
