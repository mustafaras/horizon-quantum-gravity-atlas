/*
 * Kerr null geodesics, spin-dependent characteristic radii, and conserved
 * quantities, in Boyer-Lindquist coordinates with G = c = M = 1.
 *
 * Metric convention (signature -+++)
 * ----------------------------------
 *   Delta = r^2 - 2 r + a^2
 *   Sigma = r^2 + a^2 cos^2(theta)
 *   A     = (r^2 + a^2)^2 - a^2 Delta sin^2(theta)
 *
 *   g_tt     = -(1 - 2 r / Sigma)
 *   g_tphi   = -2 a r sin^2(theta) / Sigma
 *   g_phiphi = A sin^2(theta) / Sigma
 *   g_rr     = Sigma / Delta
 *   g_thetatheta = Sigma
 *
 * Coordinate singularity
 * ----------------------
 * Boyer-Lindquist coordinates are singular on the horizons (Delta = 0), where
 * g_rr diverges. The exterior region r > r_+ is regular. Every routine here
 * either refuses to evaluate at or inside r_+ or terminates the integration
 * just outside it; nothing in this module crosses the horizon, and no result
 * should be read as describing the black-hole interior. See
 * docs/science/kerr-rendering.md for the full statement of scope.
 *
 * References
 * ----------
 * - Carter, "Global structure of the Kerr family of gravitational fields",
 *   Phys. Rev. 174 (1968) 1559. doi:10.1103/PhysRev.174.1559
 * - Bardeen, Press & Teukolsky, "Rotating black holes: locally nonrotating
 *   frames, energy extraction, and scalar synchrotron radiation",
 *   Astrophys. J. 178 (1972) 347. doi:10.1086/151796
 * - Chandrasekhar, "The Mathematical Theory of Black Holes" (1983), ch. 7.
 * - Gralla & Lupsasca, "Null geodesics of the Kerr exterior",
 *   Phys. Rev. D 101 (2020) 044032. arXiv:1910.12881
 */

import {
  assertFiniteNumber,
  assertFiniteState,
  assertPositiveInteger,
  assertPositiveNumber,
  assertSpinParameter,
  assertStepSize,
  assertTolerance,
} from "./constants.mjs";
import {
  combineTerminations,
  createPlaneCrossingTermination,
  createRadialTermination,
  integrateAdaptive,
} from "./integrators.mjs";

const TWO_PI = 2 * Math.PI;

/* ---------- internal, non-validating metric kernels ---------- */

function metricAt(a, r, theta) {
  const sin = Math.sin(theta);
  const cos = Math.cos(theta);
  const s2 = sin * sin;
  const c2 = cos * cos;
  const delta = r * r - 2 * r + a * a;
  const sigma = r * r + a * a * c2;
  const A = (r * r + a * a) ** 2 - a * a * delta * s2;
  return {
    aStar: a,
    r,
    theta,
    sin,
    cos,
    delta,
    sigma,
    A,
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

/* ---------- public metric API ---------- */

/**
 * Covariant Kerr metric components in Boyer-Lindquist coordinates.
 * @param {number} aStar dimensionless spin, |a*| <= 1
 * @param {number} r Boyer-Lindquist radius in GM/c^2, r > 0
 * @param {number} theta polar angle in radians
 */
export function kerrMetricComponents(aStar, r, theta) {
  const a = assertSpinParameter(aStar, "aStar");
  const radius = assertPositiveNumber(r, "r");
  const th = assertFiniteNumber(theta, "theta");
  return metricAt(a, radius, th);
}

/**
 * Contravariant Kerr metric components. `gRRUp` diverges on the horizons
 * (Delta = 0); callers must stay in the exterior r > r_+.
 */
export function kerrInverseMetricComponents(aStar, r, theta) {
  const a = assertSpinParameter(aStar, "aStar");
  const radius = assertPositiveNumber(r, "r");
  const th = assertFiniteNumber(theta, "theta");
  return inverseMetricAt(a, radius, th);
}

/** Analytic partial derivatives of the contravariant metric, d/dr and d/dtheta. */
export function kerrInverseMetricDerivatives(aStar, r, theta) {
  const a = assertSpinParameter(aStar, "aStar");
  const radius = assertPositiveNumber(r, "r");
  const th = assertFiniteNumber(theta, "theta");
  return inverseMetricDerivativesAt(a, radius, th);
}

/* ---------- characteristic radii ---------- */

/**
 * Kerr event-horizon radii r_+/- = M +/- sqrt(M^2 - a^2).
 * @returns {{ rPlus: number, rMinus: number, extremal: boolean, aStar: number }}
 */
export function kerrHorizonRadii(aStar) {
  const a = assertSpinParameter(aStar, "aStar");
  const discriminant = 1 - a * a;
  const root = Math.sqrt(Math.max(0, discriminant));
  return { rPlus: 1 + root, rMinus: 1 - root, extremal: discriminant === 0, aStar: a };
}

/**
 * Innermost stable circular orbit in the equatorial plane.
 *
 * Bardeen-Press-Teukolsky closed form. The two roots are the co-rotating and
 * counter-rotating orbits; which one is "prograde" depends on the sign of the
 * spin, so the branch is selected from `sign(aStar)`.
 *
 * @param {number} aStar dimensionless spin
 * @param {{ prograde?: boolean }} [options]
 * @returns {number} r_ISCO in GM/c^2
 */
export function kerrIsco(aStar, { prograde = true } = {}) {
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

/**
 * Equatorial circular photon orbit radius.
 * r_ph = 2 M (1 + cos[(2/3) arccos(-/+ a)]) for the co-/counter-rotating orbit.
 */
export function kerrPhotonSphere(aStar, { prograde = true } = {}) {
  const a = assertSpinParameter(aStar, "aStar");
  const abs = Math.abs(a);
  const coRotating = 2 * (1 + Math.cos((2 / 3) * Math.acos(-abs)));
  const counterRotating = 2 * (1 + Math.cos((2 / 3) * Math.acos(abs)));
  const coRotatingIsPrograde = a >= 0;
  const wantPrograde = Boolean(prograde);
  return wantPrograde === coRotatingIsPrograde ? coRotating : counterRotating;
}

/**
 * Stationary-limit (ergo) surface radius r_E(theta) = M + sqrt(M^2 - a^2 cos^2 theta).
 * Validated variant of the legacy `kerrErgosphere`.
 */
export function kerrErgosphereRadius(aStar, theta = Math.PI / 2) {
  const a = assertSpinParameter(aStar, "aStar");
  const th = assertFiniteNumber(theta, "theta");
  const c = Math.cos(th);
  return 1 + Math.sqrt(Math.max(0, 1 - a * a * c * c));
}

/* ---------- separated potentials and conserved quantities ---------- */

/**
 * Carter radial potential R(r) = [E (r^2 + a^2) - a Lz]^2
 *                              - Delta [(Lz - a E)^2 + Q].
 * R > 0 is the classically allowed radial region; simple zeros are turning
 * points of the radial motion.
 */
export function kerrRadialPotential({ aStar, E, Lz, Q, r } = {}) {
  const a = assertSpinParameter(aStar, "aStar");
  const radius = assertPositiveNumber(r, "r");
  const energy = assertFiniteNumber(E, "E");
  const lz = assertFiniteNumber(Lz, "Lz");
  const carter = assertFiniteNumber(Q, "Q");
  const delta = radius * radius - 2 * radius + a * a;
  const p = energy * (radius * radius + a * a) - a * lz;
  return p * p - delta * ((lz - a * energy) ** 2 + carter);
}

/**
 * Carter polar potential Theta(theta) = Q + a^2 E^2 cos^2 theta
 *                                     - Lz^2 cot^2 theta.
 * Returns -Infinity on the polar axis when Lz != 0, where the potential is
 * genuinely unbounded below.
 */
export function kerrPolarPotential({ aStar, E, Lz, Q, theta } = {}) {
  const a = assertSpinParameter(aStar, "aStar");
  const th = assertFiniteNumber(theta, "theta");
  const energy = assertFiniteNumber(E, "E");
  const lz = assertFiniteNumber(Lz, "Lz");
  const carter = assertFiniteNumber(Q, "Q");
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  const s2 = sin * sin;
  if (s2 === 0) {
    return lz === 0 ? carter + a * a * energy * energy : -Infinity;
  }
  return carter + a * a * energy * energy * cos * cos - (lz * lz * cos * cos) / s2;
}

function normalizeDirection(direction) {
  if (!direction || typeof direction.length !== "number" || direction.length !== 3) {
    throw new TypeError("direction must be a 3-component array [n_r, n_theta, n_phi]");
  }
  const [nr, nth, nph] = direction;
  for (const [index, value] of [nr, nth, nph].entries()) {
    if (!Number.isFinite(value)) {
      throw new TypeError(`direction[${index}] must be a finite number`);
    }
  }
  const norm = Math.hypot(nr, nth, nph);
  if (!(norm > 0)) {
    throw new RangeError("direction must be a non-zero vector");
  }
  return [nr / norm, nth / norm, nph / norm];
}

/**
 * Local orthonormal frame of the zero-angular-momentum observer (ZAMO).
 *
 *   e_t = alpha^-1 (d_t + omega d_phi),  alpha = sqrt(Sigma Delta / A)
 *   e_r = sqrt(Delta / Sigma) d_r
 *   e_theta = Sigma^-1/2 d_theta
 *   e_phi = sqrt(Sigma / A) / sin(theta) d_phi
 *
 * Components are returned in the coordinate order (t, r, theta, phi).
 */
export function kerrZamoFrame(aStar, r, theta) {
  const a = assertSpinParameter(aStar, "aStar");
  const radius = assertPositiveNumber(r, "r");
  const th = assertFiniteNumber(theta, "theta");
  const m = metricAt(a, radius, th);
  const { delta, sigma, A, sin } = m;
  const alpha = Math.sqrt((sigma * delta) / A);
  const omega = (2 * a * radius) / A;
  return {
    aStar: a,
    r: radius,
    theta: th,
    lapse: alpha,
    frameDragging: omega,
    eT: [1 / alpha, 0, 0, omega / alpha],
    eR: [0, Math.sqrt(delta / sigma), 0, 0],
    eTheta: [0, 0, 1 / Math.sqrt(sigma), 0],
    ePhi: [0, 0, 0, Math.sqrt(sigma / A) / sin],
  };
}

/**
 * Conserved quantities E, Lz, Q for a null ray launched from a local
 * orthonormal frame with a unit spatial direction.
 *
 * The construction p^mu = e_t^mu + n_r e_r^mu + n_theta e_theta^mu
 * + n_phi e_phi^mu is null by construction (u . u = -1, n . n = 1, u . n = 0),
 * so no separate null-normalisation step is needed.
 *
 * @param {object} options
 * @param {number} options.aStar
 * @param {number} options.r
 * @param {number} options.theta
 * @param {number[]} options.direction unit-ish [n_r, n_theta, n_phi] in the local frame
 * @param {"zamo"|"static"} [options.observer]
 */
export function kerrConservedQuantities({
  aStar,
  r,
  theta,
  direction,
  observer = "zamo",
} = {}) {
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
      throw new RangeError(
        "static observer requires g_tt < 0, i.e. a position outside the ergosphere",
      );
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

  return {
    aStar: a,
    r: radius,
    theta: th,
    observer,
    E,
    Lz,
    Q,
    pT,
    pR,
    pTheta,
    pPhi,
    pt,
    pr,
    ptheta,
    pphi,
  };
}

/**
 * Carter constant recovered from a phase-space state, used to measure
 * conserved-quantity drift along a numerically integrated ray.
 */
export function carterConstantFromState(state, aStar) {
  assertFiniteState(state, "state");
  if (state.length !== 8) {
    throw new RangeError(`state must have 8 components; received ${state.length}`);
  }
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

/**
 * Value of the null Hamiltonian H = 1/2 g^{mu nu} p_mu p_nu. Exactly zero for
 * a null geodesic; used as a numerical-consistency diagnostic.
 */
export function hamiltonianValue(state, aStar) {
  assertFiniteState(state, "state");
  if (state.length !== 8) {
    throw new RangeError(`state must have 8 components; received ${state.length}`);
  }
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

/**
 * Right-hand side of the Hamiltonian form of the geodesic equations.
 *
 * State layout: [t, r, theta, phi, p_t, p_r, p_theta, p_phi].
 * p_t = -E and p_phi = Lz are Killing constants, so their derivatives are
 * identically zero and the integrator conserves them to machine precision.
 *
 * @param {number[]} state
 * @param {{ aStar: number }} params
 */
export function kerrHamiltonianRHS(state, params) {
  assertFiniteState(state, "state");
  if (state.length !== 8) {
    throw new RangeError(`state must have 8 components; received ${state.length}`);
  }
  if (!params || typeof params !== "object") {
    throw new TypeError("params must be an object with an aStar field");
  }
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

/* ---------- Kerr-Schild coordinate conversion ---------- */

/**
 * Closed-form antiderivative of (r^2 + a^2) / Delta, the Boyer-Lindquist to
 * Kerr-Schild time offset. Valid for r > r_+.
 *
 *   integral (r^2 + a^2)/Delta dr
 *     = r + ln|Delta| + (1/k) ln|(r - 1 - k)/(r - 1 + k)|,  k = sqrt(1 - a^2)
 *     = r + ln|Delta| - 2/(r - 1)                          (extremal, k = 0)
 *
 * The result is defined up to an additive constant, which is a pure time
 * translation of the Kerr-Schild chart.
 */
export function kerrSchildTimeOffset(aStar, r) {
  const a = assertSpinParameter(aStar, "aStar");
  const radius = assertPositiveNumber(r, "r");
  const delta = radius * radius - 2 * radius + a * a;
  if (delta <= 0) {
    throw new RangeError(
      `Kerr-Schild time offset is defined only outside the horizon (Delta > 0); received r = ${radius}`,
    );
  }
  const k2 = 1 - a * a;
  if (k2 === 0) {
    return radius + Math.log(delta) - 2 / (radius - 1);
  }
  const k = Math.sqrt(k2);
  return radius + Math.log(delta) + (1 / k) * Math.log(Math.abs((radius - 1 - k) / (radius - 1 + k)));
}

/**
 * Map a Boyer-Lindquist event to Kerr-Schild Cartesian coordinates.
 *
 *   x + i y = (r + i a) sin(theta) e^{i phi}
 *   z       = r cos(theta)
 *   t_KS    = t_BL + integral (r^2 + a^2) / Delta dr
 *
 * Scope: this is a coordinate relabelling of the exterior only. It is provided
 * so a renderer can place geometry in a horizon-penetrating chart; the ray
 * tracer in this module never uses it and never crosses r_+.
 */
export function boyerLindquistToKerrSchild({ aStar, r, theta, phi = 0, t = 0 } = {}) {
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

/* ---------- ray tracing ---------- */

/**
 * Trace a null geodesic in the Kerr exterior.
 *
 * Termination statuses:
 *   "captured"   r fell to r_+ + horizonEpsilon (the ray is lost; the
 *                integration stops outside the horizon and does not cross it)
 *   "escaped"    r reached rEscape
 *   "disk"       the ray crossed the equatorial plane inside [diskInner, diskOuter]
 *   "max-steps"  the step budget was exhausted
 *   "non-finite" the step floor was reached while the state stayed non-finite
 *
 * @param {object} options
 * @param {number} options.aStar
 * @param {number} options.r starting radius, r > r_+
 * @param {number} options.theta starting polar angle, 0 < theta < pi
 * @param {number} [options.phi]
 * @param {number[]} options.direction local-frame direction [n_r, n_theta, n_phi]
 * @param {"zamo"|"static"} [options.observer]
 * @param {number} [options.rEscape]
 * @param {number|null} [options.diskInner]
 * @param {number|null} [options.diskOuter]
 */
export function traceKerrRay({
  aStar = 0,
  r,
  theta,
  phi = 0,
  direction,
  observer = "zamo",
  rEscape = 1e4,
  diskInner = null,
  diskOuter = null,
  maxSteps = 200000,
  atol = 1e-10,
  rtol = 1e-10,
  h0 = 0.05,
  hMax = 1,
  hMin = 1e-10,
  horizonEpsilon = 1e-3,
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
    throw new RangeError(
      `r must lie outside the event horizon (r > r_+ = ${rPlus}); received ${radius}`,
    );
  }
  if (radius >= escape) {
    throw new RangeError(`r (${radius}) must be smaller than rEscape (${escape})`);
  }

  const conserved = kerrConservedQuantities({ aStar: a, r: radius, theta: th, direction, observer });
  const initialState = [
    0,
    radius,
    th,
    ph,
    -conserved.E,
    conserved.pr,
    conserved.ptheta,
    conserved.Lz,
  ];

  const predicates = [
    createRadialTermination({
      innerRadius: rPlus + epsilon,
      innerType: "captured",
      outerRadius: escape,
      outerType: "escaped",
    }),
  ];
  if (Number.isFinite(diskInner) && Number.isFinite(diskOuter)) {
    if (!(diskInner < diskOuter)) {
      throw new RangeError(`diskInner (${diskInner}) must be smaller than diskOuter (${diskOuter})`);
    }
    predicates.push(
      createPlaneCrossingTermination({
        planeTheta: Math.PI / 2,
        innerRadius: diskInner,
        outerRadius: diskOuter,
        type: "disk",
      }),
    );
  }

  const result = integrateAdaptive({
    rhs: kerrHamiltonianRHS,
    state: initialState,
    h0: initialStep,
    hMin: floor,
    hMax: ceiling,
    maxSteps: budget,
    atol: absTol,
    rtol: relTol,
    params: { aStar: a },
    event: combineTerminations(...predicates),
  });

  const finalState = result.state;
  const finalE = -finalState[4];
  const finalLz = finalState[7];
  const finalQ = carterConstantFromState(finalState, a);

  return {
    status: result.event ? result.event.type : result.status,
    state: finalState,
    initialState,
    event: result.event,
    steps: result.steps,
    rejected: result.rejected,
    h: result.h,
    errorNorm: result.errorNorm,
    aStar: a,
    observer,
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

/* ---------- legacy-compatible helpers ---------- */

/**
 * Legacy spin-clamped geometry summary used by the existing no-build runtime.
 *
 * Behaviour is frozen for backward compatibility: the spin is clamped to
 * [0, 0.998] and non-numeric input becomes 0. New code should prefer the
 * validated `kerrHorizonRadii`, `kerrIsco`, and `kerrPhotonSphere`.
 */
export function kerrGeometry(spin) {
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
    a,
    rPlus,
    rMinus,
    rErgoEquator: 2,
    rIsco,
    rIscoRetrograde,
    rPhoton,
    rPhotonRetrograde,
    z1,
    z2,
    surfaceGravity,
    temperatureFactor: surfaceGravity / 0.25,
  };
}

/**
 * Legacy stationary-limit surface, spin clamped to [0, 0.998].
 * r_E(theta) = M + sqrt(M^2 - a^2 cos^2 theta); at theta = pi/2 this equals
 * `kerrGeometry().rErgoEquator`.
 */
export function kerrErgosphere(spin, theta = Math.PI / 2) {
  const a = Math.min(0.998, Math.max(0, Number(spin) || 0));
  const c = Math.cos(Number(theta) || 0);
  return 1 + Math.sqrt(Math.max(0, 1 - a * a * c * c));
}

export { TWO_PI };
