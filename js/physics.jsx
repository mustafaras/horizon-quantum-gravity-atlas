// Browser bridge for the pure calculations in js/physics.mjs.
function qcdB0(nf) {
  const flavors = Number(nf);
  return Number.isFinite(flavors) && flavors >= 0 ? 11 - (2 * flavors) / 3 : NaN;
}
function rgBeta(model, coupling, { nf = 1, a = 1, b = 1, gStar = 1 } = {}) {
  const g = Number(coupling), flavors = Number(nf), aa = Number(a), bb = Number(b), fixed = Number(gStar);
  if (!Number.isFinite(g)) return NaN;
  if (model === "qed") return Number.isFinite(flavors) && flavors >= 0 ? (flavors * g ** 3) / (12 * Math.PI ** 2) : NaN;
  if (model === "qcd") {
    const coefficient = qcdB0(flavors);
    return Number.isFinite(coefficient) ? -(coefficient * g ** 3) / (16 * Math.PI ** 2) : NaN;
  }
  if (model === "gaussian") return Number.isFinite(aa) ? -aa * g : NaN;
  if (model === "linear") return Number.isFinite(aa) && Number.isFinite(fixed) ? aa * (g - fixed) : NaN;
  if (model === "asymptotic-safety") return Number.isFinite(aa) && Number.isFinite(bb) ? aa * g - bb * g ** 3 : NaN;
  return NaN;
}
function rgBetaDerivative(model, coupling, { nf = 1, a = 1, b = 1 } = {}) {
  const g = Number(coupling), flavors = Number(nf), aa = Number(a), bb = Number(b);
  if (!Number.isFinite(g)) return NaN;
  if (model === "qed") return Number.isFinite(flavors) && flavors >= 0 ? (flavors * g * g) / (4 * Math.PI ** 2) : NaN;
  if (model === "qcd") {
    const coefficient = qcdB0(flavors);
    return Number.isFinite(coefficient) ? -(3 * coefficient * g * g) / (16 * Math.PI ** 2) : NaN;
  }
  if (model === "gaussian" || model === "linear") return Number.isFinite(aa) ? (model === "gaussian" ? -aa : aa) : NaN;
  if (model === "asymptotic-safety") return Number.isFinite(aa) && Number.isFinite(bb) ? aa - 3 * bb * g * g : NaN;
  return NaN;
}
function rgStability(derivative, tolerance = 1e-9) {
  const slope = Number(derivative);
  if (!Number.isFinite(slope)) return "invalid";
  if (slope < -Math.abs(tolerance)) return "UV-attractive";
  if (slope > Math.abs(tolerance)) return "IR-attractive";
  return "marginal";
}
function rgFixedPoints(model, parameters = {}) {
  const { a = 1, b = 1, gStar = 1 } = parameters;
  let roots = [];
  if (model === "qed" || model === "qcd" || model === "gaussian") roots = [0];
  else if (model === "linear" && Number.isFinite(Number(gStar))) roots = [Number(gStar)];
  else if (model === "asymptotic-safety" && Number(a) >= 0 && Number(b) > 0) roots = [0, Math.sqrt(Number(a) / Number(b))];
  return roots.map((g) => {
    const derivative = rgBetaDerivative(model, g, parameters);
    return { g, beta: rgBeta(model, g, parameters), derivative, stability: rgStability(derivative), source: "analytic" };
  });
}
function findRGFixedPoints(model, parameters = {}, { gMin = 0, gMax = 4, samples = 512, tolerance = 1e-9 } = {}) {
  const lo = Number(gMin), hi = Number(gMax), count = Math.max(16, Math.min(4096, Math.trunc(Number(samples))));
  const tol = Math.max(1e-14, Math.abs(Number(tolerance)) || 1e-9);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || !(hi > lo)) return [];
  const roots = [];
  const add = (value) => {
    if (!Number.isFinite(value) || value < lo - tol || value > hi + tol) return;
    if (!roots.some((root) => Math.abs(root - value) <= Math.max(tol * 10, 1e-7))) roots.push(value);
  };
  let left = lo, fLeft = rgBeta(model, left, parameters);
  if (Number.isFinite(fLeft) && Math.abs(fLeft) <= tol) add(left);
  for (let index = 1; index <= count; index++) {
    const right = lo + ((hi - lo) * index) / count;
    const fRight = rgBeta(model, right, parameters);
    if (Number.isFinite(fRight) && Math.abs(fRight) <= tol) add(right);
    if (Number.isFinite(fLeft) && Number.isFinite(fRight) && fLeft * fRight < 0) {
      let a0 = left, b0 = right, fa = fLeft;
      for (let iteration = 0; iteration < 80 && b0 - a0 > tol; iteration++) {
        const middle = (a0 + b0) / 2, fm = rgBeta(model, middle, parameters);
        if (!Number.isFinite(fm)) break;
        if (Math.abs(fm) <= tol) { a0 = middle; b0 = middle; break; }
        if (fa * fm <= 0) b0 = middle;
        else { a0 = middle; fa = fm; }
      }
      add((a0 + b0) / 2);
    }
    left = right; fLeft = fRight;
  }
  return roots.sort((x, y) => x - y).map((g) => {
    const derivative = rgBetaDerivative(model, g, parameters);
    return { g, beta: rgBeta(model, g, parameters), derivative, stability: rgStability(derivative), source: "numeric", tolerance: tol };
  });
}
function rgOneLoopRunning(model, g0, deltaLogMu, { nf = 1 } = {}) {
  const coupling = Number(g0), t = Number(deltaLogMu), flavors = Number(nf);
  if (!(coupling >= 0) || !Number.isFinite(coupling) || !Number.isFinite(t) ||
      !Number.isFinite(flavors) || flavors < 0 || !["qed", "qcd"].includes(model)) {
    return { g: NaN, alpha: NaN, denominator: NaN, status: "invalid", poleDelta: NaN };
  }
  const coefficient = model === "qed" ? flavors / (6 * Math.PI ** 2) : -qcdB0(flavors) / (8 * Math.PI ** 2);
  const denominator = 1 - coefficient * coupling * coupling * t;
  const poleDelta = coefficient > 0 && coupling > 0 ? 1 / (coefficient * coupling * coupling) : Infinity;
  if (!(denominator > 0) || !Number.isFinite(denominator)) {
    return { g: NaN, alpha: NaN, denominator, status: "pole", poleDelta };
  }
  const g = coupling / Math.sqrt(denominator), alpha = (g * g) / (4 * Math.PI);
  const status = alpha >= 1 ? (model === "qcd" ? "strong-coupling" : "perturbative-limit") : "perturbative";
  return { g, alpha, denominator, status, poleDelta };
}
function integrateRGFlow({
  model, g0, t0 = 0, tMin = -8, tMax = 8, step = 0.02,
  gLimit = Math.sqrt(4 * Math.PI), maxSteps = 20000, parameters = {},
} = {}) {
  const startG = Number(g0), startT = Number(t0), minT = Number(tMin), maxT = Number(tMax);
  const hMax = Math.abs(Number(step)), limit = Math.abs(Number(gLimit)), iterationLimit = Math.max(1, Math.trunc(Number(maxSteps)));
  const invalid = !Number.isFinite(startG) || startG < 0 || !Number.isFinite(startT) ||
    !Number.isFinite(minT) || !Number.isFinite(maxT) || !(minT <= startT && startT <= maxT) ||
    !(hMax > 0) || !(limit > 0) || !Number.isFinite(rgBeta(model, startG, parameters));
  const diagnostics = { method: "fixed-step-rk4", step: hMax, tolerance: 1e-10, gLimit: limit, maxSteps: iterationLimit };
  if (invalid) {
    return { points: [], infrared: { status: "invalid", reached: startT }, ultraviolet: { status: "invalid", reached: startT },
      status: "invalid", ...diagnostics };
  }
  const boundaryStatus = () => model === "qcd" ? "strong-coupling" : model === "qed" ? "perturbative-limit" : "coupling-boundary";
  const advance = (target) => {
    const direction = target >= startT ? 1 : -1;
    const points = [{ t: startT, g: startG, beta: rgBeta(model, startG, parameters) }];
    let t = startT, g = startG, status = "range-complete", iterations = 0;
    while (Math.abs(target - t) > 1e-12 && iterations < iterationLimit) {
      const h = direction * Math.min(hMax, Math.abs(target - t));
      const k1 = rgBeta(model, g, parameters), k2 = rgBeta(model, g + (h * k1) / 2, parameters);
      const k3 = rgBeta(model, g + (h * k2) / 2, parameters), k4 = rgBeta(model, g + h * k3, parameters);
      const next = g + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      if (![k1, k2, k3, k4, next].every(Number.isFinite)) { status = "divergent"; break; }
      if (Math.abs(next) > limit) {
        const fraction = Math.max(0, Math.min(1, (limit - Math.abs(g)) / Math.max(1e-15, Math.abs(next) - Math.abs(g))));
        const boundaryT = t + h * fraction, boundaryG = Math.sign(next || g || 1) * limit;
        points.push({ t: boundaryT, g: boundaryG, beta: rgBeta(model, boundaryG, parameters), boundary: true });
        t = boundaryT; g = boundaryG; status = boundaryStatus(); break;
      }
      t += h; g = next; iterations += 1;
      points.push({ t, g, beta: rgBeta(model, g, parameters) });
    }
    if (iterations >= iterationLimit && Math.abs(target - t) > 1e-12) status = "iteration-limit";
    return { points, status, reached: t, coupling: g, iterations, terminated: status !== "range-complete" };
  };
  const infrared = advance(minT), ultraviolet = advance(maxT);
  const points = infrared.points.slice(1).reverse().concat(ultraviolet.points);
  return { points, infrared, ultraviolet,
    status: infrared.terminated || ultraviolet.terminated ? "bounded-termination" : "range-complete", ...diagnostics };
}
/* =====================================================================
 * Kerr / accretion-disk / spectrum science core (browser mirror).
 *
 * This block mirrors the Node-importable modules in js/science/. The
 * no-build runtime evaluates this file as a single classic script, so ESM
 * `import` is unavailable here and the formulas are transcribed rather than
 * imported. js/science/*.mjs remains the single source of truth; the parity
 * test in test/physics-bridge.test.mjs checks this mirror against it over a
 * grid of inputs, so the two cannot drift silently.
 *
 * Model status, unit conventions, and the full reference list live in the
 * ESM modules and in docs/science/kerr-rendering.md.
 * ===================================================================== */
const QGA_SCIENCE = (() => {
  /* ---------- constants (js/science/constants.mjs) ---------- */

  const G = 6.67430e-11;
  const C = 299792458;
  const HBAR = 1.054571817e-34;
  const H_PLANCK = 6.62607015e-34;
  const KB = 1.380649e-23;
  const SOLAR_MASS = 1.98847e30;
  const STEFAN_BOLTZMANN = 5.670374419e-8;
  const WIEN_DISPLACEMENT_B = 2.897771955e-3;
  const MAX_SPIN_MAGNITUDE = 1;
  const TWO_PI = 2 * Math.PI;

  function describe(value) {
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : String(value);
    if (typeof value === "string") return JSON.stringify(value);
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "object") return Array.isArray(value) ? "an array" : "an object";
    return typeof value;
  }

  function assertFiniteNumber(value, name) {
    const numeric = typeof value === "number" ? value : Number(value);
    if (typeof value === "boolean" || value === null || value === "" || !Number.isFinite(numeric)) {
      throw new TypeError(`${name} must be a finite number; received ${describe(value)}`);
    }
    return numeric;
  }

  function assertPositiveNumber(value, name) {
    const numeric = assertFiniteNumber(value, name);
    if (!(numeric > 0)) throw new RangeError(`${name} must be greater than zero; received ${numeric}`);
    return numeric;
  }

  function assertNonNegativeNumber(value, name) {
    const numeric = assertFiniteNumber(value, name);
    if (numeric < 0) throw new RangeError(`${name} must be non-negative; received ${numeric}`);
    return numeric;
  }

  function assertPositiveInteger(value, name) {
    const numeric = assertFiniteNumber(value, name);
    if (!Number.isInteger(numeric) || numeric < 1) {
      throw new RangeError(`${name} must be a positive integer; received ${numeric}`);
    }
    return numeric;
  }

  function assertSpinParameter(value, name = "aStar") {
    const numeric = assertFiniteNumber(value, name);
    if (Math.abs(numeric) > MAX_SPIN_MAGNITUDE) {
      throw new RangeError(
        `${name} must satisfy |a*| <= ${MAX_SPIN_MAGNITUDE} for a Kerr exterior; received ${numeric}`,
      );
    }
    return numeric;
  }

  function assertMassSolar(value, name = "massSolar") {
    return assertPositiveNumber(value, name);
  }

  function assertTemperature(value, name = "temperatureK") {
    return assertPositiveNumber(value, name);
  }

  function assertWavelength(value, name = "wavelengthMeters") {
    return assertPositiveNumber(value, name);
  }

  function assertTolerance(value, name) {
    const numeric = assertFiniteNumber(value, name);
    if (!(numeric > 0)) throw new RangeError(`${name} must be a strictly positive tolerance; received ${numeric}`);
    return numeric;
  }

  function assertStepSize(value, name) {
    const numeric = assertFiniteNumber(value, name);
    if (!(numeric > 0)) throw new RangeError(`${name} must be a strictly positive step size; received ${numeric}`);
    return numeric;
  }

  function assertStepCeiling(value, name) {
    if (value === Infinity) return Infinity;
    return assertStepSize(value, name);
  }

  function assertFiniteState(state, name = "state") {
    if (!state || typeof state.length !== "number" || state.length === 0) {
      throw new TypeError(`${name} must be a non-empty array-like of numbers`);
    }
    for (let index = 0; index < state.length; index += 1) {
      if (!Number.isFinite(state[index])) {
        throw new RangeError(`${name}[${index}] must be finite; received ${describe(state[index])}`);
      }
    }
    return state;
  }

  function massKilograms(massSolar) {
    return assertMassSolar(massSolar) * SOLAR_MASS;
  }

  function geometricLengthUnitMeters(massSolar) {
    return (G * massKilograms(massSolar)) / (C * C);
  }

  function geometricTimeUnitSeconds(massSolar) {
    return (G * massKilograms(massSolar)) / (C * C * C);
  }

  function geometricTemperatureUnitKelvin(massSolar) {
    return (HBAR * C * C * C) / (G * massKilograms(massSolar) * KB);
  }

  function geometricLengthToMeters(length, massSolar) {
    return assertFiniteNumber(length, "length") * geometricLengthUnitMeters(massSolar);
  }

  function metersToGeometricLength(meters, massSolar) {
    return assertFiniteNumber(meters, "meters") / geometricLengthUnitMeters(massSolar);
  }

  function geometricTimeToSeconds(time, massSolar) {
    return assertFiniteNumber(time, "time") * geometricTimeUnitSeconds(massSolar);
  }

  function secondsToGeometricTime(seconds, massSolar) {
    return assertFiniteNumber(seconds, "seconds") / geometricTimeUnitSeconds(massSolar);
  }

  function geometricMassToKilograms(mass, massSolar) {
    return assertFiniteNumber(mass, "mass") * massKilograms(massSolar);
  }

  function geometricFrequencyToHertz(frequency, massSolar) {
    return assertFiniteNumber(frequency, "frequency") / geometricTimeUnitSeconds(massSolar);
  }

  function hertzToGeometricFrequency(hertz, massSolar) {
    return assertFiniteNumber(hertz, "hertz") * geometricTimeUnitSeconds(massSolar);
  }

  function geometricTemperatureToKelvin(temperature, massSolar) {
    return assertFiniteNumber(temperature, "temperature") * geometricTemperatureUnitKelvin(massSolar);
  }

  function kelvinToGeometricTemperature(kelvin, massSolar) {
    return assertFiniteNumber(kelvin, "kelvin") / geometricTemperatureUnitKelvin(massSolar);
  }

  function geometricLuminosityToWatts(luminosity, massSolar) {
    assertMassSolar(massSolar);
    return (assertFiniteNumber(luminosity, "luminosity") * C ** 5) / G;
  }

  function geometricMassRateToKgPerSecond(massRate, massSolar) {
    assertMassSolar(massSolar);
    return (assertFiniteNumber(massRate, "massRate") * C ** 3) / G;
  }

  function kgPerSecondToGeometricMassRate(kgPerSecond, massSolar) {
    assertMassSolar(massSolar);
    return (assertFiniteNumber(kgPerSecond, "kgPerSecond") * G) / C ** 3;
  }

  function geometricAngularMomentumToSI(angularMomentum, massSolar) {
    const mass = massKilograms(massSolar);
    return (assertFiniteNumber(angularMomentum, "angularMomentum") * G * mass * mass) / C;
  }

  function geometricFluxToSI(flux, massSolar) {
    const mass = massKilograms(massSolar);
    return (assertFiniteNumber(flux, "flux") * C ** 9) / (G ** 3 * mass * mass);
  }

  function siFluxToGeometric(fluxSI, massSolar) {
    const mass = massKilograms(massSolar);
    return (assertFiniteNumber(fluxSI, "fluxSI") * G ** 3 * mass * mass) / C ** 9;
  }

  function geometricEnergyToJoules(energy, massSolar) {
    return assertFiniteNumber(energy, "energy") * massKilograms(massSolar) * C * C;
  }

  /* ---------- Kerr geometry (js/science/kerr.mjs) ---------- */

  function metricAt(a, r, theta) {
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);
    const s2 = sin * sin;
    const c2 = cos * cos;
    const delta = r * r - 2 * r + a * a;
    const sigma = r * r + a * a * c2;
    const A = (r * r + a * a) ** 2 - a * a * delta * s2;
    return {
      aStar: a, r, theta, sin, cos, delta, sigma, A,
      gTT: -(1 - (2 * r) / sigma),
      gTPhi: (-2 * a * r * s2) / sigma,
      gPhiPhi: (A * s2) / sigma,
      gRR: sigma / delta,
      gThetaTheta: sigma,
    };
  }

  function inverseMetricAt(a, r, theta) {
    const m = metricAt(a, r, theta);
    const { delta, sigma, A, sin } = m;
    const s2 = sin * sin;
    const v = sigma * delta;
    return {
      ...m,
      gTTUp: -A / v,
      gTPhiUp: (-2 * a * r) / v,
      gPhiPhiUp: (delta - a * a * s2) / (v * s2),
      gRRUp: delta / sigma,
      gThetaThetaUp: 1 / sigma,
    };
  }

  function inverseMetricDerivativesAt(a, r, theta) {
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);
    const s2 = sin * sin;
    const c2 = cos * cos;
    const delta = r * r - 2 * r + a * a;
    const deltaR = 2 * r - 2;
    const sigma = r * r + a * a * c2;
    const sigmaR = 2 * r;
    const sigmaTh = -2 * a * a * sin * cos;
    const A = (r * r + a * a) ** 2 - a * a * delta * s2;
    const AR = 4 * r * (r * r + a * a) - a * a * deltaR * s2;
    const ATh = -2 * a * a * delta * sin * cos;
    const v = sigma * delta;
    const vR = sigmaR * delta + sigma * deltaR;
    const vTh = sigmaTh * delta;
    const w = delta - a * a * s2;
    const wR = deltaR;
    const wTh = -2 * a * a * sin * cos;
    const v2 = v * v;
    return {
      gTTUpR: -(AR * v - A * vR) / v2,
      gTTUpTh: -(ATh * v - A * vTh) / v2,
      gTPhiUpR: (-2 * a * (v - r * vR)) / v2,
      gTPhiUpTh: (2 * a * r * vTh) / v2,
      gPhiPhiUpR: (wR * v - w * vR) / (v2 * s2),
      gPhiPhiUpTh: (wTh * v - w * vTh) / (v2 * s2) - (2 * w * cos) / (v * sin * s2),
      gRRUpR: (deltaR * sigma - delta * sigmaR) / (sigma * sigma),
      gRRUpTh: (-delta * sigmaTh) / (sigma * sigma),
      gThetaThetaUpR: -sigmaR / (sigma * sigma),
      gThetaThetaUpTh: -sigmaTh / (sigma * sigma),
    };
  }

  function kerrMetricComponents(aStar, r, theta) {
    return metricAt(assertSpinParameter(aStar, "aStar"), assertPositiveNumber(r, "r"), assertFiniteNumber(theta, "theta"));
  }

  function kerrInverseMetricComponents(aStar, r, theta) {
    return inverseMetricAt(assertSpinParameter(aStar, "aStar"), assertPositiveNumber(r, "r"), assertFiniteNumber(theta, "theta"));
  }

  function kerrInverseMetricDerivatives(aStar, r, theta) {
    return inverseMetricDerivativesAt(assertSpinParameter(aStar, "aStar"), assertPositiveNumber(r, "r"), assertFiniteNumber(theta, "theta"));
  }

  function kerrHorizonRadii(aStar) {
    const a = assertSpinParameter(aStar, "aStar");
    const discriminant = 1 - a * a;
    const root = Math.sqrt(Math.max(0, discriminant));
    return { rPlus: 1 + root, rMinus: 1 - root, extremal: discriminant === 0, aStar: a };
  }

  function kerrIsco(aStar, { prograde = true } = {}) {
    const a = assertSpinParameter(aStar, "aStar");
    const abs = Math.abs(a);
    const z1 = 1 + Math.cbrt(1 - abs * abs) * (Math.cbrt(1 + abs) + Math.cbrt(1 - abs));
    const z2 = Math.sqrt(3 * abs * abs + z1 * z1);
    const root = Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
    const coRotating = 3 + z2 - root;
    const counterRotating = 3 + z2 + root;
    const coRotatingIsPrograde = a >= 0;
    const wantPrograde = Boolean(prograde);
    return wantPrograde === coRotatingIsPrograde ? coRotating : counterRotating;
  }

  function kerrPhotonSphere(aStar, { prograde = true } = {}) {
    const a = assertSpinParameter(aStar, "aStar");
    const abs = Math.abs(a);
    const coRotating = 2 * (1 + Math.cos((2 / 3) * Math.acos(-abs)));
    const counterRotating = 2 * (1 + Math.cos((2 / 3) * Math.acos(abs)));
    const coRotatingIsPrograde = a >= 0;
    const wantPrograde = Boolean(prograde);
    return wantPrograde === coRotatingIsPrograde ? coRotating : counterRotating;
  }

  function kerrErgosphereRadius(aStar, theta = Math.PI / 2) {
    const a = assertSpinParameter(aStar, "aStar");
    const th = assertFiniteNumber(theta, "theta");
    const c = Math.cos(th);
    return 1 + Math.sqrt(Math.max(0, 1 - a * a * c * c));
  }

  function kerrRadialPotential({ aStar, E, Lz, Q, r } = {}) {
    const a = assertSpinParameter(aStar, "aStar");
    const radius = assertPositiveNumber(r, "r");
    const energy = assertFiniteNumber(E, "E");
    const lz = assertFiniteNumber(Lz, "Lz");
    const carter = assertFiniteNumber(Q, "Q");
    const delta = radius * radius - 2 * radius + a * a;
    const p = energy * (radius * radius + a * a) - a * lz;
    return p * p - delta * ((lz - a * energy) ** 2 + carter);
  }

  function kerrPolarPotential({ aStar, E, Lz, Q, theta } = {}) {
    const a = assertSpinParameter(aStar, "aStar");
    const th = assertFiniteNumber(theta, "theta");
    const energy = assertFiniteNumber(E, "E");
    const lz = assertFiniteNumber(Lz, "Lz");
    const carter = assertFiniteNumber(Q, "Q");
    const sin = Math.sin(th);
    const cos = Math.cos(th);
    const s2 = sin * sin;
    if (s2 === 0) return lz === 0 ? carter + a * a * energy * energy : -Infinity;
    return carter + a * a * energy * energy * cos * cos - (lz * lz * cos * cos) / s2;
  }

  function normalizeDirection(direction) {
    if (!direction || typeof direction.length !== "number" || direction.length !== 3) {
      throw new TypeError("direction must be a 3-component array [n_r, n_theta, n_phi]");
    }
    const [nr, nth, nph] = direction;
    for (const [index, value] of [nr, nth, nph].entries()) {
      if (!Number.isFinite(value)) throw new TypeError(`direction[${index}] must be a finite number`);
    }
    const norm = Math.hypot(nr, nth, nph);
    if (!(norm > 0)) throw new RangeError("direction must be a non-zero vector");
    return [nr / norm, nth / norm, nph / norm];
  }

  function kerrZamoFrame(aStar, r, theta) {
    const a = assertSpinParameter(aStar, "aStar");
    const radius = assertPositiveNumber(r, "r");
    const th = assertFiniteNumber(theta, "theta");
    const m = metricAt(a, radius, th);
    const { delta, sigma, A, sin } = m;
    const alpha = Math.sqrt((sigma * delta) / A);
    const omega = (2 * a * radius) / A;
    return {
      aStar: a, r: radius, theta: th, lapse: alpha, frameDragging: omega,
      eT: [1 / alpha, 0, 0, omega / alpha],
      eR: [0, Math.sqrt(delta / sigma), 0, 0],
      eTheta: [0, 0, 1 / Math.sqrt(sigma), 0],
      ePhi: [0, 0, 0, Math.sqrt(sigma / A) / sin],
    };
  }

  function kerrConservedQuantities({ aStar, r, theta, direction, observer = "zamo" } = {}) {
    const a = assertSpinParameter(aStar, "aStar");
    const radius = assertPositiveNumber(r, "r");
    const th = assertFiniteNumber(theta, "theta");
    const [nr, nth, nph] = normalizeDirection(direction);
    const m = metricAt(a, radius, th);
    const sin = Math.sin(th);
    const cos = Math.cos(th);
    let pT;
    let pR;
    let pTheta;
    let pPhi;
    if (observer === "zamo") {
      const frame = kerrZamoFrame(a, radius, th);
      pT = frame.eT[0] + nr * frame.eR[0] + nth * frame.eTheta[0] + nph * frame.ePhi[0];
      pR = frame.eT[1] + nr * frame.eR[1] + nth * frame.eTheta[1] + nph * frame.ePhi[1];
      pTheta = frame.eT[2] + nr * frame.eR[2] + nth * frame.eTheta[2] + nph * frame.ePhi[2];
      pPhi = frame.eT[3] + nr * frame.eR[3] + nth * frame.eTheta[3] + nph * frame.ePhi[3];
    } else if (observer === "static") {
      if (!(m.gTT < 0)) {
        throw new RangeError("static observer requires g_tt < 0, i.e. a position outside the ergosphere");
      }
      pT = 1 / Math.sqrt(-m.gTT);
      pR = nr / Math.sqrt(m.gRR);
      pTheta = nth / Math.sqrt(m.gThetaTheta);
      pPhi = nph / Math.sqrt(m.gPhiPhi);
    } else {
      throw new TypeError(`observer must be "zamo" or "static"; received ${JSON.stringify(observer)}`);
    }
    const pt = m.gTT * pT + m.gTPhi * pPhi;
    const pphi = m.gTPhi * pT + m.gPhiPhi * pPhi;
    const ptheta = m.gThetaTheta * pTheta;
    const pr = m.gRR * pR;
    const E = -pt;
    const Lz = pphi;
    const Q = ptheta * ptheta + cos * cos * (-a * a * E * E + (Lz * Lz) / (sin * sin));
    return { aStar: a, r: radius, theta: th, observer, E, Lz, Q, pT, pR, pTheta, pPhi, pt, pr, ptheta, pphi };
  }

  function carterConstantFromState(state, aStar) {
    assertFiniteState(state, "state");
    if (state.length !== 8) throw new RangeError(`state must have 8 components; received ${state.length}`);
    const a = assertSpinParameter(aStar, "aStar");
    const theta = state[2];
    const ptheta = state[6];
    const pphi = state[7];
    const pt = state[4];
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);
    const E = -pt;
    const Lz = pphi;
    return ptheta * ptheta + cos * cos * (-a * a * E * E + (Lz * Lz) / (sin * sin));
  }

  function hamiltonianValue(state, aStar) {
    assertFiniteState(state, "state");
    if (state.length !== 8) throw new RangeError(`state must have 8 components; received ${state.length}`);
    const a = assertSpinParameter(aStar, "aStar");
    const m = inverseMetricAt(a, state[1], state[2]);
    const pt = state[4];
    const pr = state[5];
    const ptheta = state[6];
    const pphi = state[7];
    return (
      0.5 *
      (m.gTTUp * pt * pt +
        2 * m.gTPhiUp * pt * pphi +
        m.gPhiPhiUp * pphi * pphi +
        m.gRRUp * pr * pr +
        m.gThetaThetaUp * ptheta * ptheta)
    );
  }

  function kerrHamiltonianRHS(state, params) {
    assertFiniteState(state, "state");
    if (state.length !== 8) throw new RangeError(`state must have 8 components; received ${state.length}`);
    if (!params || typeof params !== "object") throw new TypeError("params must be an object with an aStar field");
    const a = assertSpinParameter(params.aStar, "params.aStar");
    const r = state[1];
    const theta = state[2];
    const pt = state[4];
    const pr = state[5];
    const ptheta = state[6];
    const pphi = state[7];
    const m = inverseMetricAt(a, r, theta);
    const d = inverseMetricDerivativesAt(a, r, theta);
    const dt = m.gTTUp * pt + m.gTPhiUp * pphi;
    const dphi = m.gTPhiUp * pt + m.gPhiPhiUp * pphi;
    const dr = m.gRRUp * pr;
    const dtheta = m.gThetaThetaUp * ptheta;
    const dpr =
      -0.5 *
      (d.gTTUpR * pt * pt +
        2 * d.gTPhiUpR * pt * pphi +
        d.gPhiPhiUpR * pphi * pphi +
        d.gRRUpR * pr * pr +
        d.gThetaThetaUpR * ptheta * ptheta);
    const dptheta =
      -0.5 *
      (d.gTTUpTh * pt * pt +
        2 * d.gTPhiUpTh * pt * pphi +
        d.gPhiPhiUpTh * pphi * pphi +
        d.gRRUpTh * pr * pr +
        d.gThetaThetaUpTh * ptheta * ptheta);
    return [dt, dr, dtheta, dphi, 0, dpr, dptheta, 0];
  }

  function kerrSchildTimeOffset(aStar, r) {
    const a = assertSpinParameter(aStar, "aStar");
    const radius = assertPositiveNumber(r, "r");
    const delta = radius * radius - 2 * radius + a * a;
    if (delta <= 0) {
      throw new RangeError(
        `Kerr-Schild time offset is defined only outside the horizon (Delta > 0); received r = ${radius}`,
      );
    }
    const k2 = 1 - a * a;
    if (k2 === 0) return radius + Math.log(delta) - 2 / (radius - 1);
    const k = Math.sqrt(k2);
    return radius + Math.log(delta) + (1 / k) * Math.log(Math.abs((radius - 1 - k) / (radius - 1 + k)));
  }

  function boyerLindquistToKerrSchild({ aStar, r, theta, phi = 0, t = 0 } = {}) {
    const a = assertSpinParameter(aStar, "aStar");
    const radius = assertPositiveNumber(r, "r");
    const th = assertFiniteNumber(theta, "theta");
    const ph = assertFiniteNumber(phi, "phi");
    const time = assertFiniteNumber(t, "t");
    const sin = Math.sin(th);
    const cos = Math.cos(th);
    const x = radius * sin * Math.cos(ph) - a * sin * Math.sin(ph);
    const y = radius * sin * Math.sin(ph) + a * sin * Math.cos(ph);
    const z = radius * cos;
    return { t: time + kerrSchildTimeOffset(a, radius), x, y, z, aStar: a, r: radius };
  }

  /* ---------- integrators (js/science/integrators.mjs) ---------- */

  const DP_C = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1];
  const DP_A = [
    [],
    [1 / 5],
    [3 / 40, 9 / 40],
    [44 / 45, -56 / 15, 32 / 9],
    [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
    [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
    [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
  ];
  const DP_B5 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];
  const DP_B4 = [5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40];
  const SAFETY = 0.9;
  const MIN_FACTOR = 0.2;
  const MAX_FACTOR = 5;

  function assertRhs(rhs) {
    if (typeof rhs !== "function") {
      throw new TypeError("rhs must be a function (state, params) => derivative array");
    }
  }

  function assertStateLength(state, derivative, name) {
    if (derivative.length !== state.length) {
      throw new RangeError(`${name} returned ${derivative.length} components for a ${state.length}-component state`);
    }
  }

  function allFinite(values) {
    for (let index = 0; index < values.length; index += 1) {
      if (!Number.isFinite(values[index])) return false;
    }
    return true;
  }

  function combine(state, h, weights, stages) {
    const out = new Array(state.length);
    for (let i = 0; i < state.length; i += 1) {
      let sum = 0;
      for (let s = 0; s < stages.length; s += 1) {
        const w = weights[s];
        if (w !== 0) sum += w * stages[s][i];
      }
      out[i] = state[i] + h * sum;
    }
    return out;
  }

  function rk4Step(rhs, state, h, params) {
    assertRhs(rhs);
    assertFiniteState(state, "state");
    assertStepSize(h, "h");
    const n = state.length;
    const k1 = rhs(state, params);
    assertStateLength(state, k1, "rhs");
    const y2 = new Array(n);
    for (let i = 0; i < n; i += 1) y2[i] = state[i] + (h / 2) * k1[i];
    const k2 = rhs(y2, params);
    assertStateLength(state, k2, "rhs");
    const y3 = new Array(n);
    for (let i = 0; i < n; i += 1) y3[i] = state[i] + (h / 2) * k2[i];
    const k3 = rhs(y3, params);
    assertStateLength(state, k3, "rhs");
    const y4 = new Array(n);
    for (let i = 0; i < n; i += 1) y4[i] = state[i] + h * k3[i];
    const k4 = rhs(y4, params);
    assertStateLength(state, k4, "rhs");
    const out = new Array(n);
    for (let i = 0; i < n; i += 1) {
      out[i] = state[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }
    return out;
  }

  function rk45Step(rhs, state, h, params, atol = 1e-11, rtol = 1e-11) {
    assertRhs(rhs);
    assertFiniteState(state, "state");
    assertStepSize(h, "h");
    assertTolerance(atol, "atol");
    assertTolerance(rtol, "rtol");
    const n = state.length;
    const stages = new Array(7);
    stages[0] = rhs(state, params);
    assertStateLength(state, stages[0], "rhs");
    for (let s = 1; s < 7; s += 1) {
      const y = new Array(n);
      for (let i = 0; i < n; i += 1) {
        let sum = 0;
        for (let j = 0; j < s; j += 1) {
          const a = DP_A[s][j];
          if (a !== 0) sum += a * stages[j][i];
        }
        y[i] = state[i] + h * sum;
      }
      stages[s] = rhs(y, params);
      assertStateLength(state, stages[s], "rhs");
    }
    const high = combine(state, h, DP_B5, stages);
    const low = combine(state, h, DP_B4, stages);
    const error = new Array(n);
    let sumSquares = 0;
    for (let i = 0; i < n; i += 1) {
      const e = high[i] - low[i];
      error[i] = e;
      const scale = atol + rtol * Math.abs(state[i]);
      const ratio = e / scale;
      sumSquares += ratio * ratio;
    }
    const errorNorm = Math.sqrt(sumSquares / n);
    return { state: high, error, errorNorm, finite: allFinite(high) && Number.isFinite(errorNorm) };
  }

  function createRadialTermination({
    innerRadius = -Infinity,
    outerRadius = Infinity,
    innerType = "inner-boundary",
    outerType = "outer-boundary",
  } = {}) {
    return (state) => {
      const radius = state[1];
      if (Number.isFinite(innerRadius) && radius <= innerRadius) {
        return { type: innerType, state: state.slice(), fraction: 1, radius };
      }
      if (Number.isFinite(outerRadius) && radius >= outerRadius) {
        return { type: outerType, state: state.slice(), fraction: 1, radius };
      }
      return null;
    };
  }

  function createPlaneCrossingTermination({
    planeTheta = Math.PI / 2,
    innerRadius = -Infinity,
    outerRadius = Infinity,
    type = "plane-crossing",
  } = {}) {
    const target = Math.cos(planeTheta);
    return (state, previousState) => {
      if (!previousState) return null;
      const before = Math.cos(previousState[2]) - target;
      const after = Math.cos(state[2]) - target;
      if (before === 0) return null;
      if (before * after > 0) return null;
      const denominator = before - after;
      const fraction = denominator === 0 ? 0 : before / denominator;
      const interpolated = state.map(
        (value, index) => previousState[index] + fraction * (value - previousState[index]),
      );
      interpolated[2] = planeTheta;
      const radius = interpolated[1];
      if (radius < innerRadius || radius > outerRadius) return null;
      return { type, state: interpolated, fraction, radius };
    };
  }

  function combineTerminations(...predicates) {
    const active = predicates.filter((predicate) => typeof predicate === "function");
    return (state, previousState, h) => {
      for (const predicate of active) {
        const hit = predicate(state, previousState, h);
        if (hit) return hit;
      }
      return null;
    };
  }

  function refineEvent(attempt, previous, hit, event) {
    const fallback = Array.isArray(hit.state) ? hit.state : null;
    if (!previous || typeof attempt.refine !== "function") return { state: fallback, event: hit };
    if (!(hit.fraction > 0 && hit.fraction < 1)) return { state: fallback, event: hit };
    let lo = 0;
    let hi = 1;
    let best = null;
    for (let iteration = 0; iteration < 24; iteration += 1) {
      const mid = 0.5 * (lo + hi);
      const refined = attempt.refine(previous, mid);
      if (!refined || !refined.finite) break;
      const refinedHit = event(refined.state, previous, attempt.h * mid);
      if (refinedHit) {
        best = { state: Array.isArray(refinedHit.state) ? refinedHit.state : refined.state, event: refinedHit };
        hi = mid;
      } else {
        lo = mid;
      }
      if (hi - lo < 1e-12) break;
    }
    return best || { state: fallback, event: hit };
  }

  function runDriver({ rhs, state, params, event, maxSteps, stepper }) {
    let current = state.slice();
    let previous = null;
    let steps = 0;
    let rejected = 0;
    let status = "max-steps";
    let termination = null;
    let lastError = 0;
    let h = 0;
    while (steps + rejected < maxSteps) {
      const attempt = stepper(current, previous);
      h = attempt.h;
      if (!attempt.finite) {
        rejected += 1;
        if (attempt.exhausted) {
          status = "non-finite";
          break;
        }
        continue;
      }
      steps += 1;
      lastError = attempt.errorNorm;
      previous = current;
      current = attempt.state;
      if (event) {
        const hit = event(current, previous, h);
        if (hit) {
          const refined = refineEvent(attempt, previous, hit, event);
          termination = refined.event;
          status = "event";
          if (refined.state) current = refined.state;
          break;
        }
      }
      if (attempt.done) {
        status = "completed";
        break;
      }
    }
    return { state: current, previousState: previous, steps, rejected, h, errorNorm: lastError, status, event: termination };
  }

  function integrateFixedStep({ rhs, state, h, steps, params, event = null } = {}) {
    assertRhs(rhs);
    assertFiniteState(state, "state");
    const step = assertStepSize(h, "h");
    const total = assertPositiveInteger(steps, "steps");
    if (event !== null && typeof event !== "function") throw new TypeError("event must be a function or null");
    let taken = 0;
    return runDriver({
      rhs, state, params, event, maxSteps: total,
      stepper: (current) => {
        const next = rk4Step(rhs, current, step, params);
        const finite = allFinite(next);
        if (finite) taken += 1;
        return {
          state: next, h: step, finite, exhausted: true, errorNorm: 0,
          done: finite && taken >= total,
          refine: (from, fraction) => {
            const refined = rk4Step(rhs, from, step * fraction, params);
            return { state: refined, finite: allFinite(refined) };
          },
        };
      },
    });
  }

  function integrateAdaptive({
    rhs, state, h0, hMin = 1e-12, hMax = Infinity, maxSteps = 100000,
    atol = 1e-11, rtol = 1e-11, params, event = null,
  } = {}) {
    assertRhs(rhs);
    assertFiniteState(state, "state");
    const initialStep = assertStepSize(h0, "h0");
    const floor = assertStepSize(hMin, "hMin");
    const ceiling = assertStepCeiling(hMax, "hMax");
    if (floor > ceiling) throw new RangeError(`hMin (${floor}) must not exceed hMax (${ceiling})`);
    const budget = assertPositiveInteger(maxSteps, "maxSteps");
    const absTol = assertTolerance(atol, "atol");
    const relTol = assertTolerance(rtol, "rtol");
    if (event !== null && typeof event !== "function") throw new TypeError("event must be a function or null");
    let h = Math.min(initialStep, ceiling);
    return runDriver({
      rhs, state, params, event, maxSteps: budget,
      stepper: (current) => {
        const attempt = rk45Step(rhs, current, h, params, absTol, relTol);
        if (!attempt.finite) {
          const shrunk = h * MIN_FACTOR;
          if (shrunk < floor) {
            return { state: current, h, finite: false, exhausted: true, errorNorm: Infinity, done: false };
          }
          h = shrunk;
          return { state: current, h, finite: false, exhausted: false, errorNorm: Infinity, done: false };
        }
        const norm = attempt.errorNorm;
        let factor;
        if (norm === 0) factor = MAX_FACTOR;
        else factor = SAFETY * norm ** (-1 / 5);
        if (norm <= 1) {
          const stepUsed = h;
          const next = Math.min(ceiling, Math.max(floor, h * Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, factor))));
          const result = {
            state: attempt.state, h: stepUsed, finite: true, errorNorm: norm, done: false,
            refine: (from, fraction) => rk45Step(rhs, from, stepUsed * fraction, params, absTol, relTol),
          };
          h = next;
          return result;
        }
        const shrunk = Math.max(floor, h * Math.min(1, Math.max(MIN_FACTOR, factor)));
        if (shrunk >= h) {
          const stepUsed = h;
          const result = {
            state: attempt.state, h: stepUsed, finite: true, errorNorm: norm, done: false,
            refine: (from, fraction) => rk45Step(rhs, from, stepUsed * fraction, params, absTol, relTol),
          };
          h = Math.min(ceiling, h * MAX_FACTOR);
          return result;
        }
        h = shrunk;
        return { state: current, h, finite: false, exhausted: false, errorNorm: norm, done: false };
      },
    });
  }

  function integrateUntilEvent(options) {
    return integrateAdaptive(options);
  }

  function traceKerrRay({
    aStar = 0, r, theta, phi = 0, direction, observer = "zamo", rEscape = 1e4,
    diskInner = null, diskOuter = null, maxSteps = 200000, atol = 1e-11, rtol = 1e-11,
    h0 = 0.05, hMax = 1, hMin = 1e-10, horizonEpsilon = 1e-3,
  } = {}) {
    const a = assertSpinParameter(aStar, "aStar");
    const radius = assertPositiveNumber(r, "r");
    const th = assertFiniteNumber(theta, "theta");
    const ph = assertFiniteNumber(phi, "phi");
    const escape = assertPositiveNumber(rEscape, "rEscape");
    const budget = assertPositiveInteger(maxSteps, "maxSteps");
    const absTol = assertTolerance(atol, "atol");
    const relTol = assertTolerance(rtol, "rtol");
    const initialStep = assertStepSize(h0, "h0");
    const ceiling = assertStepSize(hMax, "hMax");
    const floor = assertStepSize(hMin, "hMin");
    const epsilon = assertPositiveNumber(horizonEpsilon, "horizonEpsilon");
    if (!(th > 0 && th < Math.PI)) {
      throw new RangeError(`theta must lie strictly between 0 and pi; received ${th}`);
    }
    const { rPlus } = kerrHorizonRadii(a);
    if (!(radius > rPlus)) {
      throw new RangeError(`r must lie outside the event horizon (r > r_+ = ${rPlus}); received ${radius}`);
    }
    if (radius >= escape) throw new RangeError(`r (${radius}) must be smaller than rEscape (${escape})`);
    const conserved = kerrConservedQuantities({ aStar: a, r: radius, theta: th, direction, observer });
    const initialState = [0, radius, th, ph, -conserved.E, conserved.pr, conserved.ptheta, conserved.Lz];
    const predicates = [
      createRadialTermination({
        innerRadius: rPlus + epsilon, innerType: "captured",
        outerRadius: escape, outerType: "escaped",
      }),
    ];
    if (Number.isFinite(diskInner) && Number.isFinite(diskOuter)) {
      if (!(diskInner < diskOuter)) {
        throw new RangeError(`diskInner (${diskInner}) must be smaller than diskOuter (${diskOuter})`);
      }
      predicates.push(
        createPlaneCrossingTermination({
          planeTheta: Math.PI / 2, innerRadius: diskInner, outerRadius: diskOuter, type: "disk",
        }),
      );
    }
    const result = integrateAdaptive({
      rhs: kerrHamiltonianRHS, state: initialState, h0: initialStep, hMin: floor, hMax: ceiling,
      maxSteps: budget, atol: absTol, rtol: relTol, params: { aStar: a },
      event: combineTerminations(...predicates),
    });
    const finalState = result.state;
    const finalE = -finalState[4];
    const finalLz = finalState[7];
    const finalQ = carterConstantFromState(finalState, a);
    return {
      status: result.event ? result.event.type : result.status,
      state: finalState, initialState, event: result.event,
      steps: result.steps, rejected: result.rejected, h: result.h, errorNorm: result.errorNorm,
      aStar: a, observer,
      conserved: { E: conserved.E, Lz: conserved.Lz, Q: conserved.Q },
      final: { E: finalE, Lz: finalLz, Q: finalQ },
      drift: {
        E: finalE - conserved.E,
        Lz: finalLz - conserved.Lz,
        Q: finalQ - conserved.Q,
        hamiltonian: hamiltonianValue(finalState, a),
      },
    };
  }

  function kerrGeometry(spin) {
    const a = Math.min(0.998, Math.max(0, Number(spin) || 0));
    const root = Math.sqrt(Math.max(0, 1 - a * a));
    const rPlus = 1 + root;
    const rMinus = 1 - root;
    const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
    const z2 = Math.sqrt(3 * a * a + z1 * z1);
    const rIsco = 3 + z2 - Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
    const rIscoRetrograde = 3 + z2 + Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
    const rPhoton = 2 * (1 + Math.cos((2 / 3) * Math.acos(-a)));
    const rPhotonRetrograde = 2 * (1 + Math.cos((2 / 3) * Math.acos(a)));
    const surfaceGravity = (rPlus - 1) / (rPlus * rPlus + a * a);
    return {
      a, rPlus, rMinus, rErgoEquator: 2, rIsco, rIscoRetrograde, rPhoton, rPhotonRetrograde,
      z1, z2, surfaceGravity, temperatureFactor: surfaceGravity / 0.25,
    };
  }

  function kerrErgosphere(spin, theta = Math.PI / 2) {
    const a = Math.min(0.998, Math.max(0, Number(spin) || 0));
    const c = Math.cos(Number(theta) || 0);
    return 1 + Math.sqrt(Math.max(0, 1 - a * a * c * c));
  }

  /* ---------- accretion disk (js/science/accretion-disk.mjs) ---------- */

  const DEFAULT_QUADRATURE_ORDER = 64;
  const legendreCache = new Map();

  function gaussLegendreNodes(order) {
    assertPositiveInteger(order, "order");
    const cached = legendreCache.get(order);
    if (cached) return cached;
    const nodes = new Float64Array(order);
    const weights = new Float64Array(order);
    const half = (order + 1) >> 1;
    for (let i = 0; i < half; i += 1) {
      let z = Math.cos((Math.PI * (i + 0.75)) / (order + 0.5));
      let derivative = 0;
      for (let iteration = 0; iteration < 100; iteration += 1) {
        let previous = 1;
        let current = 0;
        for (let j = 0; j < order; j += 1) {
          const before = current;
          current = previous;
          previous = ((2 * (j + 1) - 1) * z * current - j * before) / (j + 1);
        }
        derivative = (order * (z * previous - current)) / (z * z - 1);
        const next = z - previous / derivative;
        const converged = Math.abs(next - z) <= 1e-15;
        z = next;
        if (converged) break;
      }
      const weight = 2 / ((1 - z * z) * derivative * derivative);
      nodes[i] = -z;
      nodes[order - 1 - i] = z;
      weights[i] = weight;
      weights[order - 1 - i] = weight;
    }
    const rule = Object.freeze({ order, nodes, weights });
    legendreCache.set(order, rule);
    return rule;
  }

  function gaussLegendreIntegrate(f, a, b, order = DEFAULT_QUADRATURE_ORDER) {
    if (typeof f !== "function") throw new TypeError("f must be a function");
    const lower = assertFiniteNumber(a, "a");
    const upper = assertFiniteNumber(b, "b");
    if (upper === lower) return 0;
    const { nodes, weights } = gaussLegendreNodes(order);
    const halfSpan = (upper - lower) / 2;
    const midpoint = (lower + upper) / 2;
    let sum = 0;
    for (let i = 0; i < nodes.length; i += 1) sum += weights[i] * f(midpoint + halfSpan * nodes[i]);
    return sum * halfSpan;
  }

  function kerrCircularOrbit(aStar, r, { prograde = true } = {}) {
    const spin = assertSpinParameter(aStar);
    const radius = assertPositiveNumber(r, "r");
    if (typeof prograde !== "boolean") throw new TypeError("prograde must be a boolean");
    const sign = prograde ? 1 : -1;
    const rootR = Math.sqrt(radius);
    const denominator = radius ** 1.5 - 3 * rootR + 2 * sign * spin;
    if (!(denominator > 0)) {
      throw new RangeError(
        `r must exceed the ${prograde ? "prograde" : "retrograde"} photon sphere for a circular orbit; received r = ${radius}`,
      );
    }
    const rootDenominator = Math.sqrt(denominator);
    const weight = radius ** 0.75 * rootDenominator;
    const energyNumerator = radius ** 1.5 - 2 * rootR + sign * spin;
    const angularMomentumNumerator = sign * (radius * radius - 2 * sign * spin * rootR + spin * spin);
    const energy = energyNumerator / weight;
    const angularMomentum = angularMomentumNumerator / weight;
    const omegaDenominator = radius ** 1.5 + sign * spin;
    const omega = sign / omegaDenominator;
    const omegaDerivative = (-sign * 1.5 * rootR) / (omegaDenominator * omegaDenominator);
    const denominatorDerivative = 1.5 * rootR - 1.5 / rootR;
    const weightDerivative =
      0.75 * radius ** -0.25 * rootDenominator + (radius ** 0.75 * denominatorDerivative) / (2 * rootDenominator);
    const energyNumeratorDerivative = 1.5 * rootR - 1 / rootR;
    const angularMomentumNumeratorDerivative = sign * (2 * radius - (sign * spin) / rootR);
    const energyDerivative =
      (energyNumeratorDerivative * weight - energyNumerator * weightDerivative) / (weight * weight);
    const angularMomentumDerivative =
      (angularMomentumNumeratorDerivative * weight - angularMomentumNumerator * weightDerivative) / (weight * weight);
    const metric = kerrMetricComponents(spin, radius, Math.PI / 2);
    const norm = -(metric.gTT + 2 * omega * metric.gTPhi + omega * omega * metric.gPhiPhi);
    if (!(norm > 0)) throw new RangeError(`circular orbit at r = ${radius} is not timelike for a* = ${spin}`);
    const timeComponent = 1 / Math.sqrt(norm);
    return {
      aStar: spin, r: radius, prograde, sign, omega, omegaDerivative,
      energy, energyDerivative, angularMomentum, angularMomentumDerivative, timeComponent,
      specificEnergyFromMetric: -(metric.gTT + omega * metric.gTPhi) * timeComponent,
      specificAngularMomentumFromMetric: (metric.gTPhi + omega * metric.gPhiPhi) * timeComponent,
    };
  }

  function pageThorneFluxGeometric({
    aStar = 0, r, massRate = 1, prograde = true, innerRadius,
    quadratureOrder = DEFAULT_QUADRATURE_ORDER,
  } = {}) {
    const spin = assertSpinParameter(aStar);
    const radius = assertPositiveNumber(r, "r");
    const rate = assertNonNegativeNumber(massRate, "massRate");
    if (typeof prograde !== "boolean") throw new TypeError("prograde must be a boolean");
    const inner = innerRadius === undefined
      ? kerrIsco(spin, { prograde })
      : assertPositiveNumber(innerRadius, "innerRadius");
    assertPositiveInteger(quadratureOrder, "quadratureOrder");
    if (radius <= inner) return 0;
    const orbit = kerrCircularOrbit(spin, radius, { prograde });
    const innerOrbit = kerrCircularOrbit(spin, inner, { prograde });
    const integrand = (radiusPrime) => {
      const local = kerrCircularOrbit(spin, radiusPrime, { prograde });
      return (local.energy - local.omega * local.angularMomentum) * local.angularMomentumDerivative;
    };
    const integral = gaussLegendreIntegrate(integrand, inner, radius, quadratureOrder);
    const frameEnergy = orbit.energy - orbit.omega * orbit.angularMomentum;
    const innerFrameEnergy = innerOrbit.energy - innerOrbit.omega * innerOrbit.angularMomentum;
    if (!(frameEnergy > 0) || !(innerFrameEnergy > 0)) {
      throw new RangeError(`circular orbit at r = ${radius} has a non-positive comoving energy`);
    }
    return (rate / (4 * Math.PI * radius)) * (-orbit.omegaDerivative) / (frameEnergy * frameEnergy) * integral;
  }

  function pageThorneFluxSI(options = {}) {
    const { massSolar, ...rest } = options;
    return geometricFluxToSI(pageThorneFluxGeometric(rest), massSolar);
  }

  function newtonianDiskFluxGeometric({ r, massRate = 1, innerRadius = 6 } = {}) {
    const radius = assertPositiveNumber(r, "r");
    const rate = assertNonNegativeNumber(massRate, "massRate");
    const inner = assertPositiveNumber(innerRadius, "innerRadius");
    if (radius <= inner) return 0;
    return ((3 * rate) / (8 * Math.PI * radius ** 3)) * (1 - Math.sqrt(inner / radius));
  }

  function geometricStefanBoltzmannConstant(massSolar) {
    const mass = massKilograms(assertPositiveNumber(massSolar, "massSolar"));
    return (Math.PI ** 2 * HBAR * C) / (60 * G * mass * mass);
  }

  function diskEffectiveTemperatureKelvin(fluxGeometric, massSolar) {
    const flux = assertNonNegativeNumber(fluxGeometric, "fluxGeometric");
    const sigma = geometricStefanBoltzmannConstant(massSolar);
    if (flux === 0) return 0;
    return geometricTemperatureToKelvin((flux / sigma) ** 0.25, massSolar);
  }

  function diskEffectiveTemperatureGeometric(fluxGeometric, massSolar) {
    const flux = assertNonNegativeNumber(fluxGeometric, "fluxGeometric");
    const sigma = geometricStefanBoltzmannConstant(massSolar);
    return flux === 0 ? 0 : (flux / sigma) ** 0.25;
  }

  function kerrGravitationalRedshiftOrbiting(aStar, r, options = {}) {
    return 1 / kerrCircularOrbit(aStar, r, options).timeComponent;
  }

  function kerrOrbitalDopplerFactor({ energy, angularMomentum, omega, lz } = {}) {
    const E = assertFiniteNumber(energy, "energy");
    const L = assertFiniteNumber(angularMomentum, "angularMomentum");
    const O = assertFiniteNumber(omega, "omega");
    const Lz = assertFiniteNumber(lz, "lz");
    if (!(E > 0)) throw new RangeError(`energy must be positive for a future-directed photon; received ${E}`);
    const denominator = E - O * Lz;
    if (!(denominator > 0)) throw new RangeError(`E - Omega Lz must be positive; received ${denominator}`);
    return E / denominator;
  }

  function kerrTotalRedshiftFactor({ aStar, r, prograde = true, energy, lz } = {}) {
    const orbit = kerrCircularOrbit(aStar, r, { prograde });
    const gravitational = 1 / orbit.timeComponent;
    const orbital = kerrOrbitalDopplerFactor({
      energy, angularMomentum: orbit.angularMomentum, omega: orbit.omega, lz,
    });
    return { total: gravitational * orbital, gravitational, orbital, timeComponent: orbit.timeComponent };
  }

  function kerrGravitationalRedshiftStatic(aStar, r, theta = Math.PI / 2) {
    const spin = assertSpinParameter(aStar);
    const radius = assertPositiveNumber(r, "r");
    const polar = assertFiniteNumber(theta, "theta");
    const metric = kerrMetricComponents(spin, radius, polar);
    const norm = -metric.gTT;
    if (!(norm > 0)) {
      throw new RangeError(`no static observer exists at r = ${radius}, theta = ${polar} (inside the ergosphere)`);
    }
    return Math.sqrt(norm);
  }

  function observedTemperatureKelvin(emittedKelvin, g) {
    const emitted = assertNonNegativeNumber(emittedKelvin, "emittedKelvin");
    const factor = assertPositiveNumber(g, "g");
    return emitted * factor;
  }

  /* ---------- spectrum (js/science/spectrum.mjs) ---------- */

  const NANOMETRE_TO_METRE = 1e-9;
  const WIEN_FREQUENCY_COEFFICIENT = 2.8214393721220787;
  const SRGB_GAMMA_THRESHOLD = 0.0031308;
  const SRGB_GAMMA_SLOPE = 12.92;
  const SRGB_GAMMA_OFFSET = 0.055;
  const SRGB_GAMMA_EXPONENT = 1 / 2.4;
  const FAST_FIT_STEP_NM = 20;

  const XYZ_TO_LINEAR_SRGB = Object.freeze([
    Object.freeze([3.2404542, -1.5371385, -0.4985314]),
    Object.freeze([-0.969266, 1.8760108, 0.041556]),
    Object.freeze([0.0556434, -0.2040259, 1.0572252]),
  ]);

  const CIE_1931_2DEG_WAVELENGTH_START_NM = 380;
  const CIE_1931_2DEG_WAVELENGTH_STEP_NM = 5;
  const CIE_1931_2DEG_WAVELENGTH_END_NM = 780;
  const CIE_1931_2DEG_SAMPLE_COUNT = 81;

  const CIE_1931_2DEG_SOURCE = Object.freeze({
    name: "CIE 1931 2-deg standard observer colour-matching functions",
    table: "ciexyz31_1",
    origin: "CIE 15:2004 / CIE 018:2019 standard-observer tabulation",
    distributor: "Colour & Vision Research Laboratory (CVRL), UCL Institute of Ophthalmology",
    url: "http://cvrl.ioo.ucl.ac.uk/",
    license: "CVRL research/educational redistribution of factual CIE standard-observer data",
    spacingNm: 5,
    rangeNm: [380, 780],
  });

  const CIE_1931_2DEG_X = Object.freeze([0.001368, 0.002236, 0.004243, 0.00765, 0.01431, 0.02319, 0.04351, 0.07763, 0.13438, 0.21477, 0.2839, 0.3285, 0.34828, 0.34806, 0.3362, 0.3187, 0.2908, 0.2511, 0.19536, 0.1421, 0.09564, 0.05795001, 0.03201, 0.0147, 0.0049, 0.0024, 0.0093, 0.0291, 0.06327, 0.1096, 0.1655, 0.2257499, 0.2904, 0.3597, 0.4334499, 0.5120501, 0.5945, 0.6784, 0.7621, 0.8425, 0.9163, 0.9786, 1.0263, 1.0567, 1.0622, 1.0456, 1.0026, 0.9384, 0.8544499, 0.7514, 0.6424, 0.5419, 0.4479, 0.3608, 0.2835, 0.2187, 0.1649, 0.1212, 0.0874, 0.0636, 0.04677, 0.0329, 0.0227, 0.01584, 0.01135916, 0.008110916, 0.005790346, 0.004109457, 0.002899327, 0.00204919, 0.001439971, 0.000999949, 0.000690079, 0.000476021, 0.000332301, 0.000234826, 0.000166151, 0.000117413, 0.000083075, 0.000058707, 0.00004151]);
  const CIE_1931_2DEG_Y = Object.freeze([0.000039, 0.000064, 0.00012, 0.000217, 0.000396, 0.00064, 0.00121, 0.00218, 0.004, 0.0073, 0.0116, 0.01684, 0.023, 0.0298, 0.038, 0.048, 0.06, 0.0739, 0.09098, 0.1126, 0.13902, 0.1693, 0.20802, 0.2586, 0.323, 0.4073, 0.503, 0.6082, 0.71, 0.7932, 0.862, 0.9148501, 0.954, 0.9803, 0.9949501, 1.0, 0.995, 0.9786, 0.952, 0.9154, 0.87, 0.8163, 0.757, 0.6949, 0.631, 0.5668, 0.503, 0.4412, 0.381, 0.321, 0.265, 0.217, 0.175, 0.1382, 0.107, 0.0816, 0.061, 0.04458, 0.032, 0.0232, 0.017, 0.01192, 0.00821, 0.005723, 0.004102, 0.002929, 0.002091, 0.001484, 0.001047, 0.00074, 0.00052, 0.0003611, 0.0002492, 0.0001719, 0.00012, 0.0000848, 0.00006, 0.0000424, 0.00003, 0.0000212, 0.00001499]);
  const CIE_1931_2DEG_Z = Object.freeze([0.006450001, 0.01054999, 0.02005001, 0.03621, 0.06785001, 0.1102, 0.2074, 0.3713, 0.6456, 1.0390501, 1.3856, 1.62296, 1.74706, 1.7826, 1.77211, 1.7441, 1.6692, 1.5281, 1.28764, 1.0419, 0.8129501, 0.6162, 0.46518, 0.3533, 0.272, 0.2123, 0.1582, 0.1117, 0.07824999, 0.05725001, 0.04216, 0.02984, 0.0203, 0.0134, 0.008749999, 0.005749999, 0.0039, 0.002749999, 0.0021, 0.0018, 0.001650001, 0.0014, 0.0011, 0.001, 0.0008, 0.0006, 0.00034, 0.00024, 0.00019, 0.0001, 0.00005, 0.00003, 0.00002, 0.00001, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);

  function planckSpectralRadiance(wavelengthMeters, temperatureK) {
    const wavelength = assertWavelength(wavelengthMeters);
    const temperature = assertTemperature(temperatureK);
    const exponent = (H_PLANCK * C) / (wavelength * KB * temperature);
    if (exponent > 700) return 0;
    const numerator = (2 * H_PLANCK * C * C) / wavelength ** 5;
    return numerator / Math.expm1(exponent);
  }

  function planckSpectralRadiancePerFrequency(frequencyHz, temperatureK) {
    const frequency = assertWavelength(frequencyHz, "frequencyHz");
    const temperature = assertTemperature(temperatureK);
    const exponent = (H_PLANCK * frequency) / (KB * temperature);
    if (exponent > 700) return 0;
    const numerator = (2 * H_PLANCK * frequency ** 3) / (C * C);
    return numerator / Math.expm1(exponent);
  }

  function wienPeakWavelengthMeters(temperatureK) {
    return WIEN_DISPLACEMENT_B / assertTemperature(temperatureK);
  }

  function wienPeakFrequencyHz(temperatureK) {
    return (WIEN_FREQUENCY_COEFFICIENT * KB * assertTemperature(temperatureK)) / H_PLANCK;
  }

  function gaussianLobe(x, mu, sigmaShort, sigmaLong) {
    const sigma = x < mu ? sigmaShort : sigmaLong;
    const z = (x - mu) / sigma;
    return Math.exp(-0.5 * z * z);
  }

  function cieXyzBarAnalytic(wavelengthNm) {
    const lambda = assertFiniteNumber(wavelengthNm, "wavelengthNm");
    const x =
      1.056 * gaussianLobe(lambda, 599.8, 37.9, 31.0) +
      0.362 * gaussianLobe(lambda, 442.0, 16.0, 26.7) -
      0.065 * gaussianLobe(lambda, 501.1, 20.4, 26.2);
    const y = 0.821 * gaussianLobe(lambda, 568.8, 46.9, 40.5) + 0.286 * gaussianLobe(lambda, 530.9, 16.3, 31.1);
    const z = 1.217 * gaussianLobe(lambda, 437.0, 11.8, 36.0) + 0.681 * gaussianLobe(lambda, 459.0, 26.0, 13.8);
    return { x, y, z };
  }

  function cieXyzBarTabulated(index) {
    const i = assertPositiveInteger(index + 1, "index") - 1;
    if (i >= CIE_1931_2DEG_SAMPLE_COUNT) {
      throw new RangeError(`index must be < ${CIE_1931_2DEG_SAMPLE_COUNT}; received ${index}`);
    }
    return { x: CIE_1931_2DEG_X[i], y: CIE_1931_2DEG_Y[i], z: CIE_1931_2DEG_Z[i] };
  }

  function cieXyzFromSpectralRadiance(radiance) {
    if (typeof radiance !== "function") throw new TypeError("radiance must be a function");
    const stepMeters = CIE_1931_2DEG_WAVELENGTH_STEP_NM * NANOMETRE_TO_METRE;
    let x = 0;
    let y = 0;
    let z = 0;
    for (let i = 0; i < CIE_1931_2DEG_SAMPLE_COUNT; i += 1) {
      const wavelengthNm = CIE_1931_2DEG_WAVELENGTH_START_NM + i * CIE_1931_2DEG_WAVELENGTH_STEP_NM;
      const value = radiance(wavelengthNm * NANOMETRE_TO_METRE);
      if (!Number.isFinite(value)) throw new RangeError(`radiance returned a non-finite value at ${wavelengthNm} nm`);
      const weight = i === 0 || i === CIE_1931_2DEG_SAMPLE_COUNT - 1 ? 0.5 : 1;
      x += weight * value * CIE_1931_2DEG_X[i];
      y += weight * value * CIE_1931_2DEG_Y[i];
      z += weight * value * CIE_1931_2DEG_Z[i];
    }
    return { x: x * stepMeters, y: y * stepMeters, z: z * stepMeters };
  }

  function cieXyzFromSpectralRadianceFast(radiance, { stepNm = FAST_FIT_STEP_NM } = {}) {
    if (typeof radiance !== "function") throw new TypeError("radiance must be a function");
    const step = assertFiniteNumber(stepNm, "stepNm");
    if (!(step > 0)) throw new RangeError(`stepNm must be greater than zero; received ${step}`);
    const start = CIE_1931_2DEG_WAVELENGTH_START_NM;
    const end = CIE_1931_2DEG_WAVELENGTH_END_NM;
    const count = Math.round((end - start) / step);
    if (count < 2) throw new RangeError(`stepNm = ${step} is too coarse for the ${start}-${end} nm range`);
    const actualStep = (end - start) / count;
    const stepMeters = actualStep * NANOMETRE_TO_METRE;
    let x = 0;
    let y = 0;
    let z = 0;
    for (let i = 0; i <= count; i += 1) {
      const wavelengthNm = start + i * actualStep;
      const value = radiance(wavelengthNm * NANOMETRE_TO_METRE);
      if (!Number.isFinite(value)) throw new RangeError(`radiance returned a non-finite value at ${wavelengthNm} nm`);
      const bar = cieXyzBarAnalytic(wavelengthNm);
      const weight = i === 0 || i === count ? 0.5 : 1;
      x += weight * value * bar.x;
      y += weight * value * bar.y;
      z += weight * value * bar.z;
    }
    return { x: x * stepMeters, y: y * stepMeters, z: z * stepMeters };
  }

  function xyzToChromaticity({ x, y, z } = {}) {
    const X = assertFiniteNumber(x, "x");
    const Y = assertFiniteNumber(y, "y");
    const Z = assertFiniteNumber(z, "z");
    const sum = X + Y + Z;
    if (!(sum > 0)) throw new RangeError("tristimulus values must have a positive sum to define a chromaticity");
    return { x: X / sum, y: Y / sum };
  }

  function xyzToLinearSrgb({ x, y, z } = {}) {
    const X = assertFiniteNumber(x, "x");
    const Y = assertFiniteNumber(y, "y");
    const Z = assertFiniteNumber(z, "z");
    const m = XYZ_TO_LINEAR_SRGB;
    return {
      r: m[0][0] * X + m[0][1] * Y + m[0][2] * Z,
      g: m[1][0] * X + m[1][1] * Y + m[1][2] * Z,
      b: m[2][0] * X + m[2][1] * Y + m[2][2] * Z,
    };
  }

  function linearSrgbToSrgb(value) {
    const v = assertFiniteNumber(value, "value");
    if (v <= 0) return 0;
    if (v >= 1) return 1;
    if (v <= SRGB_GAMMA_THRESHOLD) return SRGB_GAMMA_SLOPE * v;
    return (1 + SRGB_GAMMA_OFFSET) * v ** SRGB_GAMMA_EXPONENT - SRGB_GAMMA_OFFSET;
  }

  function srgbToLinearSrgb(value) {
    const v = assertFiniteNumber(value, "value");
    if (v <= 0) return 0;
    if (v >= 1) return 1;
    if (v <= SRGB_GAMMA_SLOPE * SRGB_GAMMA_THRESHOLD) return v / SRGB_GAMMA_SLOPE;
    return ((v + SRGB_GAMMA_OFFSET) / (1 + SRGB_GAMMA_OFFSET)) ** (1 / SRGB_GAMMA_EXPONENT);
  }

  function normalizeLinearRgb(rgb) {
    const peak = Math.max(rgb.r, rgb.g, rgb.b);
    if (!(peak > 0)) return { r: 0, g: 0, b: 0 };
    return {
      r: Math.min(1, Math.max(0, rgb.r / peak)),
      g: Math.min(1, Math.max(0, rgb.g / peak)),
      b: Math.min(1, Math.max(0, rgb.b / peak)),
    };
  }

  function linearSrgbToHex(linearRgb) {
    const channels = ["r", "g", "b"].map((key) => {
      const encoded = linearSrgbToSrgb(linearRgb[key]);
      return Math.round(encoded * 255).toString(16).padStart(2, "0");
    });
    return `#${channels.join("")}`;
  }

  function blackbodyToSrgb(temperatureK) {
    const temperature = assertTemperature(temperatureK);
    const raw = cieXyzFromSpectralRadiance((wavelength) => planckSpectralRadiance(wavelength, temperature));
    if (!(raw.y > 0)) throw new RangeError(`blackbody at ${temperature} K has zero luminance in the visible band`);
    const xyz = { x: raw.x / raw.y, y: 1, z: raw.z / raw.y };
    const linearRgb = normalizeLinearRgb(xyzToLinearSrgb(xyz));
    const srgb = {
      r: linearSrgbToSrgb(linearRgb.r),
      g: linearSrgbToSrgb(linearRgb.g),
      b: linearSrgbToSrgb(linearRgb.b),
    };
    return { temperatureK: temperature, xyz, linearRgb, srgb, hex: linearSrgbToHex(linearRgb) };
  }

  function fastBlackbodyToSrgb(temperatureK, options = {}) {
    const temperature = assertTemperature(temperatureK);
    const raw = cieXyzFromSpectralRadianceFast(
      (wavelength) => planckSpectralRadiance(wavelength, temperature),
      options,
    );
    if (!(raw.y > 0)) throw new RangeError(`blackbody at ${temperature} K has zero luminance in the visible band`);
    const xyz = { x: raw.x / raw.y, y: 1, z: raw.z / raw.y };
    const linearRgb = normalizeLinearRgb(xyzToLinearSrgb(xyz));
    const srgb = {
      r: linearSrgbToSrgb(linearRgb.r),
      g: linearSrgbToSrgb(linearRgb.g),
      b: linearSrgbToSrgb(linearRgb.b),
    };
    return { temperatureK: temperature, xyz, linearRgb, srgb, hex: linearSrgbToHex(linearRgb) };
  }

  function fastBlackbodyToSrgbMaxError({ minK = 1000, maxK = 40000, samples = 400, stepNm = FAST_FIT_STEP_NM } = {}) {
    const low = assertTemperature(minK, "minK");
    const high = assertTemperature(maxK, "maxK");
    if (!(high > low)) throw new RangeError(`maxK must exceed minK; received ${low} and ${high}`);
    const count = assertPositiveInteger(samples, "samples");
    const step = assertFiniteNumber(stepNm, "stepNm");
    const logLow = Math.log(low);
    const logHigh = Math.log(high);
    const perChannel = { r: 0, g: 0, b: 0 };
    let maxChannelError = 0;
    let maxLinearChannelError = 0;
    let maxChromaticityError = 0;
    let maxErrorTemperatureK = low;
    for (let i = 0; i < count; i += 1) {
      const temperature = Math.exp(logLow + ((logHigh - logLow) * i) / (count - 1));
      const reference = blackbodyToSrgb(temperature);
      const fast = fastBlackbodyToSrgb(temperature, { stepNm: step });
      let worst = 0;
      let worstLinear = 0;
      for (const key of ["r", "g", "b"]) {
        const delta = Math.abs(fast.srgb[key] - reference.srgb[key]);
        const deltaLinear = Math.abs(fast.linearRgb[key] - reference.linearRgb[key]);
        if (delta > perChannel[key]) perChannel[key] = delta;
        if (delta > worst) worst = delta;
        if (deltaLinear > worstLinear) worstLinear = deltaLinear;
      }
      const referenceChromaticity = xyzToChromaticity(reference.xyz);
      const fastChromaticity = xyzToChromaticity(fast.xyz);
      const chromaticityError = Math.hypot(
        fastChromaticity.x - referenceChromaticity.x,
        fastChromaticity.y - referenceChromaticity.y,
      );
      if (chromaticityError > maxChromaticityError) maxChromaticityError = chromaticityError;
      if (worst > maxChannelError) {
        maxChannelError = worst;
        maxErrorTemperatureK = temperature;
      }
      if (worstLinear > maxLinearChannelError) maxLinearChannelError = worstLinear;
    }
    return {
      minK: low, maxK: high, samples: count, stepNm: step,
      maxChannelError, maxLinearChannelError, maxChromaticityError, maxErrorTemperatureK, perChannel,
    };
  }

  return {
    /* constants */
    G, C, HBAR, H_PLANCK, KB, SOLAR_MASS, STEFAN_BOLTZMANN, WIEN_DISPLACEMENT_B, MAX_SPIN_MAGNITUDE,
    GRAVITATIONAL_CONSTANT: G, SPEED_OF_LIGHT: C, PLANCK_H: H_PLANCK, BOLTZMANN_K: KB, SOLAR_MASS_KG: SOLAR_MASS,
    /* validation */
    assertFiniteNumber, assertPositiveNumber, assertNonNegativeNumber, assertPositiveInteger,
    assertSpinParameter, assertMassSolar, assertTemperature, assertWavelength, assertTolerance,
    assertStepSize, assertStepCeiling, assertFiniteState,
    /* conversions */
    massKilograms, geometricLengthUnitMeters, geometricTimeUnitSeconds, geometricTemperatureUnitKelvin,
    geometricLengthToMeters, metersToGeometricLength, geometricTimeToSeconds, secondsToGeometricTime,
    geometricMassToKilograms, geometricFrequencyToHertz, hertzToGeometricFrequency,
    geometricTemperatureToKelvin, kelvinToGeometricTemperature, geometricLuminosityToWatts,
    geometricMassRateToKgPerSecond, kgPerSecondToGeometricMassRate, geometricAngularMomentumToSI,
    geometricFluxToSI, siFluxToGeometric, geometricEnergyToJoules,
    /* kerr */
    TWO_PI, kerrMetricComponents, kerrInverseMetricComponents, kerrInverseMetricDerivatives,
    kerrHorizonRadii, kerrIsco, kerrPhotonSphere, kerrErgosphereRadius, kerrRadialPotential,
    kerrPolarPotential, kerrZamoFrame, kerrConservedQuantities, carterConstantFromState,
    hamiltonianValue, kerrHamiltonianRHS, kerrSchildTimeOffset, boyerLindquistToKerrSchild,
    traceKerrRay, kerrGeometry, kerrErgosphere,
    /* integrators */
    rk4Step, rk45Step, createRadialTermination, createPlaneCrossingTermination, combineTerminations,
    integrateFixedStep, integrateAdaptive, integrateUntilEvent,
    /* accretion disk */
    DEFAULT_QUADRATURE_ORDER, gaussLegendreNodes, gaussLegendreIntegrate, kerrCircularOrbit,
    pageThorneFluxGeometric, pageThorneFluxSI, newtonianDiskFluxGeometric,
    geometricStefanBoltzmannConstant, diskEffectiveTemperatureKelvin, diskEffectiveTemperatureGeometric,
    kerrGravitationalRedshiftOrbiting, kerrOrbitalDopplerFactor, kerrTotalRedshiftFactor,
    kerrGravitationalRedshiftStatic, observedTemperatureKelvin,
    /* spectrum */
    CIE_1931_2DEG_SOURCE, NANOMETRE_TO_METRE, WIEN_FREQUENCY_COEFFICIENT, SRGB_GAMMA_THRESHOLD,
    SRGB_GAMMA_SLOPE, SRGB_GAMMA_OFFSET, SRGB_GAMMA_EXPONENT, XYZ_TO_LINEAR_SRGB, FAST_FIT_STEP_NM,
    planckSpectralRadiance, planckSpectralRadiancePerFrequency, wienPeakWavelengthMeters,
    wienPeakFrequencyHz, cieXyzBarAnalytic, cieXyzBarTabulated, cieXyzFromSpectralRadiance,
    cieXyzFromSpectralRadianceFast, xyzToChromaticity, xyzToLinearSrgb, linearSrgbToSrgb,
    srgbToLinearSrgb, linearSrgbToHex, blackbodyToSrgb, fastBlackbodyToSrgb, fastBlackbodyToSrgbMaxError,
  };
})();

const QGA_PHYSICS = {
  ...QGA_SCIENCE,
  qcdB0, rgBeta, rgBetaDerivative, rgStability, rgFixedPoints, findRGFixedPoints,
  rgOneLoopRunning, integrateRGFlow,
  schwarzschildRadius(massSolar) { return 2.95 * Number(massSolar); },
  kerrGeometry(spin) {
    const a = Math.min(0.998, Math.max(0, Number(spin) || 0));
    const root = Math.sqrt(Math.max(0, 1 - a * a));
    const rPlus = 1 + root;
    const rMinus = 1 - root;
    const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
    const z2 = Math.sqrt(3 * a * a + z1 * z1);
    const rIsco = 3 + z2 - Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
    const rIscoRetrograde = 3 + z2 + Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
    const rPhoton = 2 * (1 + Math.cos((2 / 3) * Math.acos(-a)));
    const rPhotonRetrograde = 2 * (1 + Math.cos((2 / 3) * Math.acos(a)));
    const surfaceGravity = (rPlus - 1) / (rPlus * rPlus + a * a);
    return {
      a, rPlus, rMinus, rErgoEquator: 2, rIsco, rIscoRetrograde, rPhoton, rPhotonRetrograde,
      z1, z2, surfaceGravity, temperatureFactor: surfaceGravity / 0.25,
    };
  },
  kerrErgosphere(spin, theta = Math.PI / 2) {
    const a = Math.min(0.998, Math.max(0, Number(spin) || 0));
    const c = Math.cos(Number(theta) || 0);
    return 1 + Math.sqrt(Math.max(0, 1 - a * a * c * c));
  },
  hawkingTemperature(massSolar, spin = 0) {
    return (6.17e-8 / Number(massSolar)) * this.kerrGeometry(spin).temperatureFactor;
  },
  blackHoleEntropyAreaUnits(massSolar, spin = 0) {
    return 1.05e77 * Number(massSolar) ** 2 * (this.kerrGeometry(spin).rPlus / 2);
  },
  grPerihelionPrecession(gm, c2, a, e) {
    return (6 * Math.PI * Number(gm)) / (Number(c2) * Number(a) * (1 - Number(e) * Number(e)));
  },
  grLightDeflection(gm, c2, impactParameter) {
    return (4 * Number(gm)) / (Number(c2) * Number(impactParameter));
  },
  planckUnits() {
    const HBAR = 1.054571817e-34, G = 6.67430e-11, C = 299792458;
    const lengthMeters = Math.sqrt((HBAR * G) / C ** 3);
    const timeSeconds = Math.sqrt((HBAR * G) / C ** 5);
    const massKg = Math.sqrt((HBAR * C) / G);
    const energyJoules = massKg * C * C;
    const energyGeV = energyJoules / 1.602176634e-10;
    return { lengthMeters, timeSeconds, massKg, energyJoules, energyGeV };
  },
  probeEnergyGeV(lengthMeters) { return 1.973e-16 / Number(lengthMeters); },
  blackHoleEvaporationTimeYears(massSolar) { return 2.1e67 * Number(massSolar) ** 3; },
  pageCurveEntropy(fractionEvaporated) {
    const f = Number(fractionEvaporated);
    if (!Number.isFinite(f)) return NaN;
    const clamped = Math.min(1, Math.max(0, f));
    return 2 * Math.min(clamped, 1 - clamped);
  },
  hawkingSpectralShape(x, temperature) {
    const t = Number(temperature);
    if (!Number.isFinite(t) || t <= 0) return NaN;
    const u = Number(x) / t;
    if (!Number.isFinite(u) || u < 0) return NaN;
    return (u * u * u) / (Math.exp(Math.min(40, u)) - 1 + 1e-9);
  },
  seededRng(seed) {
    let state = (Number(seed) >>> 0) || 1;
    return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
  },
  safeBeta(value, fallback = 0.2, { min = -0.999, max = 0.999 } = {}) {
    const beta = Number(value);
    if (!Number.isFinite(beta) || Math.abs(beta) >= 1) {
      return Number.isFinite(fallback) ? Math.min(max, Math.max(min, Number(fallback))) : 0;
    }
    return Math.min(max, Math.max(min, beta));
  },
  clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  },
  sanitizeCausalState(input = {}, defaults = {}) {
    const fallback = {
      beta: 0.35,
      a: { ct: 0, x: -1.35 },
      b: { ct: 2.6, x: 1.1 },
      ...defaults,
    };
    fallback.a = { ct: 0, x: -1.35, ...(defaults.a || {}) };
    fallback.b = { ct: 2.6, x: 1.1, ...(defaults.b || {}) };
    const inRange = (value, backup, min, max) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) && numeric >= min && numeric <= max ? numeric : backup;
    };
    return {
      beta: inRange(input.beta, fallback.beta, -0.95, 0.95),
      a: {
        ct: inRange(input.a?.ct, fallback.a.ct, -4, 4),
        x: inRange(input.a?.x, fallback.a.x, -4, 4),
      },
      b: {
        ct: inRange(input.b?.ct, fallback.b.ct, -4, 4),
        x: inRange(input.b?.x, fallback.b.x, -4, 4),
      },
    };
  },
  lorentzGamma(beta) {
    const b = this.safeBeta(beta, 0);
    return 1 / Math.sqrt(Math.max(1e-12, 1 - b * b));
  },
  invariantInterval(deltaCt, deltaX, { c = 1 } = {}) {
    const dct = Number(deltaCt); const dx = Number(deltaX);
    if (!Number.isFinite(dct) || !Number.isFinite(dx) || !(Number(c) > 0)) return NaN;
    return -(dct * dct) + dx * dx;
  },
  classifySeparation(deltaCt, deltaX, { c = 1 } = {}) {
    const ds2 = this.invariantInterval(deltaCt, deltaX, { c });
    if (!Number.isFinite(ds2)) return { type: "invalid", ds2: NaN, deltaCt: Number(deltaCt), deltaX: Number(deltaX) };
    if (ds2 < 0) return { type: "timelike", ds2, deltaCt: Number(deltaCt), deltaX: Number(deltaX) };
    if (Math.abs(ds2) < 1e-12) return { type: "null", ds2: 0, deltaCt: Number(deltaCt), deltaX: Number(deltaX) };
    return { type: "spacelike", ds2, deltaCt: Number(deltaCt), deltaX: Number(deltaX) };
  },
  properTime(deltaCt, deltaX, { c = 1 } = {}) {
    const ds2 = this.invariantInterval(deltaCt, deltaX, { c });
    const cs = Number(c);
    if (!Number.isFinite(ds2) || ds2 >= 0 || !(cs > 0)) return NaN;
    return Math.sqrt(-ds2) / cs;
  },
  lorentzTransform({ deltaCt, deltaX, beta, c = 1 } = {}) {
    const b = this.safeBeta(beta, 0);
    const dct = Number(deltaCt); const dx = Number(deltaX);
    if (!Number.isFinite(dct) || !Number.isFinite(dx) || !(Number(c) > 0)) {
      return { deltaCtPrime: NaN, deltaXPrime: NaN, gamma: this.lorentzGamma(b), beta: b };
    }
    const gamma = this.lorentzGamma(b);
    const ctPrime = gamma * (dct - b * dx);
    const xPrime = gamma * (dx - b * dct);
    return { deltaCtPrime: ctPrime, deltaXPrime: xPrime, gamma, beta: b };
  },
  simultaneityFrameBeta(deltaCt, deltaX) {
    const dt = Number(deltaCt); const dx = Number(deltaX);
    if (!Number.isFinite(dt) || !Number.isFinite(dx) || Math.abs(dx) < 1e-12) return NaN;
    const beta = dt / dx;
    return Math.abs(beta) < 1 ? beta : NaN;
  },
  transformPair({ a, b, beta, c = 1 } = {}) {
    const left = { deltaCt: Number(b.ct) - Number(a.ct), deltaX: Number(b.x) - Number(a.x) };
    const transformed = this.lorentzTransform({ ...left, beta, c });
    const interval = this.classifySeparation(left.deltaCt, left.deltaX, { c });
    return { a, b, left, transformed, interval, gamma: transformed.gamma };
  },
  piecewiseProperTime(points, { c = 1 } = {}) {
    if (!Array.isArray(points) || points.length < 2) return NaN;
    let total = 0;
    for (let index = 1; index < points.length; index++) {
      const previous = points[index - 1];
      const current = points[index];
      const segment = this.properTime(
        Number(current?.ct) - Number(previous?.ct),
        Number(current?.x) - Number(previous?.x),
        { c },
      );
      if (!Number.isFinite(segment)) return NaN;
      total += segment;
    }
    return total;
  },
  /* Leading-order binary-inspiral teaching model — mirrors js/physics.mjs exactly. */
  chirpMass(m1Solar, m2Solar) {
    const m1 = Number(m1Solar), m2 = Number(m2Solar);
    return Math.pow(m1 * m2, 3 / 5) / Math.pow(m1 + m2, 1 / 5);
  },
  timeToCoalescence(freqHz, chirpMassSolar) {
    const f = Number(freqHz), mc = Number(chirpMassSolar) * 4.92563989396e-6;
    return (5 / 256) * Math.pow(Math.PI * f, -8 / 3) * Math.pow(mc, -5 / 3);
  },
  inspiralFrequency(tauSeconds, chirpMassSolar) {
    const tau = Math.max(1e-6, Number(tauSeconds));
    const mc = Number(chirpMassSolar) * 4.92563989396e-6;
    return (1 / Math.PI) * Math.pow(5 / (256 * tau), 3 / 8) * Math.pow(mc, -5 / 8);
  },
  generatedChirp({
    seed = 42, sampleRate = 512, duration = 4, m1 = 36, m2 = 29,
    mergerAt = 3.4, noiseRms = 0.35, delaySeconds = 0, ringdownFreq = 190, ringdownTau = 0.06,
  } = {}) {
    const n = Math.max(8, Math.round(sampleRate * duration));
    const mc = this.chirpMass(m1, m2);
    const rng = this.seededRng(seed);
    const gauss = () => {
      const u = Math.max(1e-12, rng()), v = rng();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const delay = Math.round(delaySeconds * sampleRate);
    const samples = new Float64Array(n);
    const freqTrack = new Float32Array(n);
    let phase = 0, prevTau = Math.max(0.02, mergerAt);
    const mergerIndex = Math.min(n - 1, Math.round(mergerAt * sampleRate) + delay);
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate - delaySeconds;
      let h = 0;
      if (t >= 0 && t < mergerAt) {
        const tau = mergerAt - t;
        const f = this.inspiralFrequency(tau, mc);
        phase += 2 * Math.PI * f * (prevTau - tau);
        prevTau = tau;
        h = Math.min(1, Math.pow(f / 220, 2 / 3)) * Math.cos(phase);
        freqTrack[i] = f;
      } else if (t >= mergerAt) {
        const tr = t - mergerAt;
        h = Math.exp(-tr / ringdownTau) * Math.cos(phase + 2 * Math.PI * ringdownFreq * tr);
        freqTrack[i] = ringdownFreq;
      }
      samples[i] = h + noiseRms * gauss();
    }
    return { samples, freqTrack, sampleRate, duration, mergerIndex, chirpMass: mc, model: "leading-order-quadrupole+ringdown" };
  },
  stftSpectrogram(samples, { sampleRate = 512, windowSize = 128, hopSize = 24 } = {}) {
    const n = samples.length;
    const bins = windowSize / 2;
    const frames = Math.max(1, Math.floor((n - windowSize) / hopSize) + 1);
    const hann = new Float64Array(windowSize);
    for (let k = 0; k < windowSize; k++) hann[k] = 0.5 * (1 - Math.cos((2 * Math.PI * k) / (windowSize - 1)));
    const magnitudes = new Float32Array(frames * bins);
    let maxDb = -Infinity;
    for (let f = 0; f < frames; f++) {
      const base = f * hopSize;
      for (let b = 0; b < bins; b++) {
        let re = 0, im = 0;
        const w = (2 * Math.PI * b) / windowSize;
        for (let k = 0; k < windowSize; k++) {
          const v = samples[base + k] * hann[k];
          re += v * Math.cos(w * k); im -= v * Math.sin(w * k);
        }
        const db = 20 * Math.log10(Math.hypot(re, im) / windowSize + 1e-12);
        magnitudes[f * bins + b] = db;
        if (db > maxDb) maxDb = db;
      }
    }
    const times = Array.from({ length: frames }, (_, f) => (f * hopSize + windowSize / 2) / sampleRate);
    const freqs = Array.from({ length: bins }, (_, b) => (b * sampleRate) / windowSize);
    return { magnitudes, frames, bins, times, freqs, maxDb, nyquist: sampleRate / 2 };
  },
  /* ---------- QFT 2→2 kinematics (mirrors js/physics.mjs) ---------- */
  QFT_CONSTANTS: { ALPHA_EM: 1 / 137.035999084, GEV2_TO_NB: 0.3893793721e6, M_ELECTRON: 0.51099895e-3, M_Z: 91.1876, GAMMA_Z: 2.4952 },
  mandelstamKinematics({ sqrtS, cosTheta = 0, masses = [0, 0, 0, 0] }) {
    const [m1, m2, m3, m4] = masses;
    const s = sqrtS * sqrtS;
    const E1 = (s + m1 * m1 - m2 * m2) / (2 * sqrtS);
    const E3 = (s + m3 * m3 - m4 * m4) / (2 * sqrtS);
    const E4 = (s + m4 * m4 - m3 * m3) / (2 * sqrtS);
    const p1 = Math.sqrt(Math.max(0, E1 * E1 - m1 * m1));
    const p3 = Math.sqrt(Math.max(0, E3 * E3 - m3 * m3));
    const t = m1 * m1 + m3 * m3 - 2 * E1 * E3 + 2 * p1 * p3 * cosTheta;
    const u = m1 * m1 + m4 * m4 - 2 * E1 * E4 - 2 * p1 * p3 * cosTheta;
    const sum = m1 * m1 + m2 * m2 + m3 * m3 + m4 * m4;
    return { s, t, u, sum, residual: s + t + u - sum, sqrtS, cosTheta, E1, E3, E4, p1, p3 };
  },
  kleinNishina({ cosTheta = 0, x = 0.1 }) {
    const ratio = 1 / (1 + x * (1 - cosTheta));
    const sin2 = 1 - cosTheta * cosTheta;
    return ratio * ratio * (ratio + 1 / ratio - sin2);
  },
  angularDistribution({ process = "s-channel", cosTheta = 0, photonX = 0.1 }) {
    const c = Math.max(-1, Math.min(1, cosTheta));
    if (process === "s-channel") return 1 + c * c;
    if (process === "t-channel") {
      const half = Math.sin(Math.acos(c) / 2);
      const s2 = half * half;
      return 1 / Math.max(1e-8, s2 * s2);
    }
    if (process === "compton") return this.kleinNishina({ cosTheta: c, x: photonX });
    return 0;
  },
  breitWignerResonance({ sqrtS = 91.1876, mass = 91.1876, width = 2.4952 }) {
    const s = sqrtS * sqrtS;
    const m2 = mass * mass;
    const denom = (s - m2) * (s - m2) + m2 * width * width;
    return (m2 * width * width) / denom;
  },
  qftTotalCrossSection({ sqrtS = 10 }) {
    const s = sqrtS * sqrtS;
    const a = 1 / 137.035999084;
    return ((4 * Math.PI * a * a) / (3 * s)) * 0.3893793721e6;
  },
};
window.QGA_PHYSICS = QGA_PHYSICS;
