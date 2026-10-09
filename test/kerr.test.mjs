/*
 * Numerical tests for the Kerr null-geodesic core.
 *
 * Tolerances are documented next to each assertion. Where a closed-form value
 * exists the tolerance is set by the analytic formula's conditioning; where the
 * quantity is a numerical invariant the tolerance is the measured drift bound
 * with headroom, not a machine-specific timing or platform threshold.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  TWO_PI,
  kerrMetricComponents,
  kerrInverseMetricComponents,
  kerrInverseMetricDerivatives,
  kerrHorizonRadii,
  kerrIsco,
  kerrPhotonSphere,
  kerrErgosphereRadius,
  kerrRadialPotential,
  kerrPolarPotential,
  kerrZamoFrame,
  kerrConservedQuantities,
  carterConstantFromState,
  hamiltonianValue,
  kerrHamiltonianRHS,
  kerrSchildTimeOffset,
  boyerLindquistToKerrSchild,
  traceKerrRay,
  kerrGeometry,
  kerrErgosphere,
} from "../js/science/kerr.mjs";

/* ---------- Schwarzschild limit ---------- */

test("a* = 0 recovers the Schwarzschild horizon, ISCO, photon sphere and ergosphere", () => {
  const horizon = kerrHorizonRadii(0);
  assert.equal(horizon.rPlus, 2);
  assert.equal(horizon.rMinus, 0);
  assert.equal(horizon.extremal, false);

  assert.equal(kerrIsco(0, { prograde: true }), 6);
  assert.equal(kerrIsco(0, { prograde: false }), 6);
  assert.equal(kerrPhotonSphere(0, { prograde: true }), 3);
  assert.ok(Math.abs(kerrPhotonSphere(0, { prograde: false }) - 3) < 1e-12);
  assert.equal(kerrErgosphereRadius(0), 2);
});

test("a* = 0 metric components reduce to the Schwarzschild line element", () => {
  const r = 10;
  const theta = Math.PI / 2;
  const metric = kerrMetricComponents(0, r, theta);
  assert.ok(Math.abs(metric.gTT - -(1 - 2 / r)) < 1e-15);
  assert.ok(Math.abs(metric.gTPhi) < 1e-15);
  assert.ok(Math.abs(metric.gPhiPhi - r * r) < 1e-12);
  assert.ok(Math.abs(metric.gRR - 1 / (1 - 2 / r)) < 1e-15);
  assert.ok(Math.abs(metric.gThetaTheta - r * r) < 1e-12);
  assert.ok(Math.abs(metric.delta - (r * r - 2 * r)) < 1e-12);
  assert.ok(Math.abs(metric.sigma - r * r) < 1e-12);
});

test("the inverse metric inverts the covariant metric at a representative point", () => {
  const a = 0.7;
  const r = 4.5;
  const theta = 1.1;
  const g = kerrMetricComponents(a, r, theta);
  const gUp = kerrInverseMetricComponents(a, r, theta);
  // g^{mu nu} g_{nu rho} = delta^mu_rho, checked on the (t, phi) block and the
  // diagonal r, theta entries.
  const tt = gUp.gTTUp * g.gTT + gUp.gTPhiUp * g.gTPhi;
  const tphi = gUp.gTTUp * g.gTPhi + gUp.gTPhiUp * g.gPhiPhi;
  const phit = gUp.gTPhiUp * g.gTT + gUp.gPhiPhiUp * g.gTPhi;
  const phiphi = gUp.gTPhiUp * g.gTPhi + gUp.gPhiPhiUp * g.gPhiPhi;
  assert.ok(Math.abs(tt - 1) < 1e-12);
  assert.ok(Math.abs(tphi) < 1e-12);
  assert.ok(Math.abs(phit) < 1e-12);
  assert.ok(Math.abs(phiphi - 1) < 1e-12);
  assert.ok(Math.abs(gUp.gRRUp * g.gRR - 1) < 1e-12);
  assert.ok(Math.abs(gUp.gThetaThetaUp * g.gThetaTheta - 1) < 1e-12);
});

test("analytic inverse-metric derivatives match central differences", () => {
  const a = 0.6;
  const r = 5;
  const theta = 1.0;
  const h = 1e-6;
  const d = kerrInverseMetricDerivatives(a, r, theta);
  const plusR = kerrInverseMetricComponents(a, r + h, theta);
  const minusR = kerrInverseMetricComponents(a, r - h, theta);
  const plusTh = kerrInverseMetricComponents(a, r, theta + h);
  const minusTh = kerrInverseMetricComponents(a, r, theta - h);
  const pairs = [
    ["gTTUpR", "gTTUp"],
    ["gTPhiUpR", "gTPhiUp"],
    ["gPhiPhiUpR", "gPhiPhiUp"],
    ["gRRUpR", "gRRUp"],
    ["gThetaThetaUpR", "gThetaThetaUp"],
  ];
  for (const [derivativeKey, componentKey] of pairs) {
    const numeric = (plusR[componentKey] - minusR[componentKey]) / (2 * h);
    assert.ok(
      Math.abs(d[derivativeKey] - numeric) < 1e-6 * Math.max(1, Math.abs(numeric)),
      `${derivativeKey}: analytic ${d[derivativeKey]} vs numeric ${numeric}`,
    );
  }
  const thetaPairs = [
    ["gTTUpTh", "gTTUp"],
    ["gTPhiUpTh", "gTPhiUp"],
    ["gPhiPhiUpTh", "gPhiPhiUp"],
    ["gRRUpTh", "gRRUp"],
    ["gThetaThetaUpTh", "gThetaThetaUp"],
  ];
  for (const [derivativeKey, componentKey] of thetaPairs) {
    const numeric = (plusTh[componentKey] - minusTh[componentKey]) / (2 * h);
    assert.ok(
      Math.abs(d[derivativeKey] - numeric) < 1e-6 * Math.max(1, Math.abs(numeric)),
      `${derivativeKey}: analytic ${d[derivativeKey]} vs numeric ${numeric}`,
    );
  }
});

/* ---------- extremal boundary ---------- */

test("extremal spin a* = +/-1 stays finite and degenerate", () => {
  for (const a of [1, -1]) {
    const horizon = kerrHorizonRadii(a);
    assert.ok(Number.isFinite(horizon.rPlus));
    assert.ok(Number.isFinite(horizon.rMinus));
    assert.equal(horizon.rPlus, 1);
    assert.equal(horizon.rMinus, 1);
    assert.equal(horizon.extremal, true);
    for (const prograde of [true, false]) {
      const isco = kerrIsco(a, { prograde });
      const photon = kerrPhotonSphere(a, { prograde });
      assert.ok(Number.isFinite(isco), `ISCO at a*=${a} prograde=${prograde} must be finite`);
      assert.ok(Number.isFinite(photon), `photon sphere at a*=${a} prograde=${prograde} must be finite`);
      assert.ok(isco >= 1 - 1e-12);
      assert.ok(photon >= 1 - 1e-12);
    }
    assert.ok(Number.isFinite(kerrErgosphereRadius(a)));
  }
});

test("extremal spin gives the known prograde and retrograde ISCO radii", () => {
  // a* -> +1: prograde ISCO -> M, retrograde ISCO -> 9M.
  assert.ok(Math.abs(kerrIsco(1, { prograde: true }) - 1) < 1e-12);
  assert.ok(Math.abs(kerrIsco(1, { prograde: false }) - 9) < 1e-12);
  // a* -> -1: the roles swap.
  assert.ok(Math.abs(kerrIsco(-1, { prograde: true }) - 9) < 1e-12);
  assert.ok(Math.abs(kerrIsco(-1, { prograde: false }) - 1) < 1e-12);
  // Extremal photon spheres: 1M co-rotating, 4M counter-rotating.
  assert.ok(Math.abs(kerrPhotonSphere(1, { prograde: true }) - 1) < 1e-12);
  assert.ok(Math.abs(kerrPhotonSphere(1, { prograde: false }) - 4) < 1e-12);
  assert.ok(Math.abs(kerrPhotonSphere(-1, { prograde: true }) - 4) < 1e-12);
  assert.ok(Math.abs(kerrPhotonSphere(-1, { prograde: false }) - 1) < 1e-12);
});

test("ISCO and photon sphere are monotone in spin and ordered correctly", () => {
  let previousPrograde = Infinity;
  let previousRetrograde = -Infinity;
  for (let a = 0; a <= 0.998; a += 0.05) {
    const prograde = kerrIsco(a, { prograde: true });
    const retrograde = kerrIsco(a, { prograde: false });
    assert.ok(prograde < previousPrograde, `prograde ISCO must decrease with spin at a*=${a}`);
    assert.ok(retrograde > previousRetrograde, `retrograde ISCO must increase with spin at a*=${a}`);
    assert.ok(prograde <= retrograde);
    if (a > 0) assert.ok(prograde < retrograde);
    const photonPrograde = kerrPhotonSphere(a, { prograde: true });
    const photonRetrograde = kerrPhotonSphere(a, { prograde: false });
    // The two photon spheres coincide only in the Schwarzschild limit.
    if (a > 0) assert.ok(photonPrograde < photonRetrograde);
    else assert.ok(Math.abs(photonPrograde - photonRetrograde) < 1e-12);
    previousPrograde = prograde;
    previousRetrograde = retrograde;
  }
});

test("the ergosphere touches the horizon on the axis and reaches 2M at the equator", () => {
  for (const a of [0, 0.5, 0.9, 0.998]) {
    const { rPlus } = kerrHorizonRadii(a);
    assert.ok(Math.abs(kerrErgosphereRadius(a, 0) - rPlus) < 1e-12);
    assert.ok(Math.abs(kerrErgosphereRadius(a, Math.PI) - rPlus) < 1e-12);
    assert.ok(Math.abs(kerrErgosphereRadius(a, Math.PI / 2) - 2) < 1e-12);
  }
});

/* ---------- conserved quantities ---------- */

test("a ZAMO-launched photon is null and carries the expected Carter constant", () => {
  const aStar = 0.8;
  const r = 12;
  const theta = 1.15;
  const direction = [0.5, 0.4, -0.3];
  const conserved = kerrConservedQuantities({ aStar, r, theta, direction });
  const state = [0, r, theta, 0, -conserved.E, conserved.pr, conserved.ptheta, conserved.Lz];
  assert.ok(Math.abs(hamiltonianValue(state, aStar)) < 1e-12);
  assert.ok(Math.abs(carterConstantFromState(state, aStar) - conserved.Q) < 1e-12);
  assert.ok(Number.isFinite(conserved.E));
  assert.ok(Number.isFinite(conserved.Lz));
  assert.ok(Number.isFinite(conserved.Q));
});

test("the ZAMO frame is orthonormal with a timelike unit observer", () => {
  const aStar = 0.9;
  const r = 6;
  const theta = 1.0;
  const frame = kerrZamoFrame(aStar, r, theta);
  const g = kerrMetricComponents(aStar, r, theta);
  const dot = (u, v) =>
    g.gTT * u[0] * v[0] +
    g.gTPhi * (u[0] * v[3] + u[3] * v[0]) +
    g.gPhiPhi * u[3] * v[3] +
    g.gRR * u[1] * v[1] +
    g.gThetaTheta * u[2] * v[2];
  assert.ok(Math.abs(dot(frame.eT, frame.eT) + 1) < 1e-12);
  for (const leg of [frame.eR, frame.eTheta, frame.ePhi]) {
    assert.ok(Math.abs(dot(leg, leg) - 1) < 1e-12);
    assert.ok(Math.abs(dot(frame.eT, leg)) < 1e-12);
  }
  assert.ok(Math.abs(dot(frame.eR, frame.eTheta)) < 1e-12);
  assert.ok(Math.abs(dot(frame.eR, frame.ePhi)) < 1e-12);
  assert.ok(Math.abs(dot(frame.eTheta, frame.ePhi)) < 1e-12);
});

test("the Hamiltonian right-hand side conserves p_t and p_phi exactly", () => {
  const aStar = 0.7;
  const state = [0, 8, 1.2, 0.4, -0.9, 0.3, 0.2, 2.1];
  const derivative = kerrHamiltonianRHS(state, { aStar });
  assert.equal(derivative[4], 0);
  assert.equal(derivative[7], 0);
  assert.equal(derivative.length, 8);
  for (const value of derivative) assert.ok(Number.isFinite(value));
});

test("the Hamiltonian is stationary along a numerically integrated ray", () => {
  const aStar = 0.6;
  const r = 15;
  const theta = 1.3;
  const conserved = kerrConservedQuantities({ aStar, r, theta, direction: [0.4, 0.5, 0.1] });
  const state = [0, r, theta, 0, -conserved.E, conserved.pr, conserved.ptheta, conserved.Lz];
  const derivative = kerrHamiltonianRHS(state, { aStar });
  const h = 1e-5;
  const advanced = state.map((value, index) => value + h * derivative[index]);
  const before = hamiltonianValue(state, aStar);
  const after = hamiltonianValue(advanced, aStar);
  assert.ok(Math.abs(before) < 1e-12);
  assert.ok(Math.abs(after - before) < 1e-9);
});

/* ---------- separated potentials ---------- */

test("the separated potentials reproduce the null condition", () => {
  const aStar = 0.85;
  const r = 9;
  const theta = 1.05;
  const conserved = kerrConservedQuantities({ aStar, r, theta, direction: [0.3, 0.6, 0.2] });
  const radial = kerrRadialPotential({ aStar, r, E: conserved.E, Lz: conserved.Lz, Q: conserved.Q });
  const polar = kerrPolarPotential({ aStar, theta, E: conserved.E, Lz: conserved.Lz, Q: conserved.Q });
  const metric = kerrMetricComponents(aStar, r, theta);
  const sin2 = Math.sin(theta) ** 2;

  // R(r) = Delta^2 p_r^2 and Theta(theta) = p_theta^2 by construction.
  assert.ok(Math.abs(radial - metric.delta ** 2 * conserved.pr ** 2) < 1e-9);
  assert.ok(Math.abs(polar - conserved.ptheta ** 2) < 1e-12);

  // The null condition in separated form:
  //   R/Delta + Theta = [A E^2 - 4 a r E Lz - (Delta - a^2 sin^2) Lz^2/sin^2] / Delta
  const right =
    (metric.A * conserved.E ** 2 -
      4 * aStar * r * conserved.E * conserved.Lz -
      ((metric.delta - aStar * aStar * sin2) * conserved.Lz ** 2) / sin2) /
    metric.delta;
  assert.ok(Math.abs(radial / metric.delta + polar - right) < 1e-9);
});

test("the polar potential is non-negative on the photon's own theta", () => {
  const aStar = 0.5;
  const theta = 0.9;
  const conserved = kerrConservedQuantities({ aStar, r: 10, theta, direction: [0.2, 0.7, 0.1] });
  const polar = kerrPolarPotential({
    aStar,
    theta,
    E: conserved.E,
    Lz: conserved.Lz,
    Q: conserved.Q,
  });
  assert.ok(polar >= -1e-12);
});

test("the polar potential diverges on the axis unless Lz vanishes", () => {
  assert.equal(kerrPolarPotential({ aStar: 0.5, theta: 0, E: 1, Lz: 0, Q: 0.3 }), 0.3 + 0.25);
  assert.equal(kerrPolarPotential({ aStar: 0.5, theta: 0, E: 1, Lz: 1, Q: 0.3 }), -Infinity);
});

/* ---------- Kerr-Schild conversion ---------- */

test("the Kerr-Schild time offset differentiates to (r^2 + a^2)/Delta", () => {
  const h = 1e-6;
  for (const a of [0, 0.5, 0.9, 0.999, 1]) {
    const r = 5;
    const numeric = (kerrSchildTimeOffset(a, r + h) - kerrSchildTimeOffset(a, r - h)) / (2 * h);
    const exact = (r * r + a * a) / (r * r - 2 * r + a * a);
    assert.ok(
      Math.abs(numeric - exact) < 1e-6 * Math.abs(exact),
      `a*=${a}: numeric ${numeric} vs exact ${exact}`,
    );
  }
});

test("the Kerr-Schild map is a bijective relabelling of the exterior", () => {
  const aStar = 0.7;
  const r = 6;
  const theta = 1.1;
  const phi = 0.8;
  const point = boyerLindquistToKerrSchild({ aStar, r, theta, phi, t: 3 });
  const sin = Math.sin(theta);
  const cos = Math.cos(theta);
  assert.ok(Math.abs(point.x - (r * sin * Math.cos(phi) - aStar * sin * Math.sin(phi))) < 1e-12);
  assert.ok(Math.abs(point.y - (r * sin * Math.sin(phi) + aStar * sin * Math.cos(phi))) < 1e-12);
  assert.ok(Math.abs(point.z - r * cos) < 1e-12);
  assert.ok(Math.abs(point.t - (3 + kerrSchildTimeOffset(aStar, r))) < 1e-12);
  // The oblate-spheroidal radius is recovered from the Cartesian coordinates.
  const recovered = Math.sqrt(
    ((point.x * point.x + point.y * point.y + point.z * point.z - aStar * aStar) +
      Math.sqrt(
        (point.x * point.x + point.y * point.y + point.z * point.z - aStar * aStar) ** 2 +
          4 * aStar * aStar * point.z * point.z,
      )) /
      2,
  );
  assert.ok(Math.abs(recovered - r) < 1e-9);
});

test("the Kerr-Schild time offset refuses to evaluate on or inside the horizon", () => {
  assert.throws(() => kerrSchildTimeOffset(0, 2), RangeError);
  assert.throws(() => kerrSchildTimeOffset(0, 1), RangeError);
  assert.throws(() => kerrSchildTimeOffset(0.9, 1.4), RangeError);
  assert.ok(Number.isFinite(kerrSchildTimeOffset(0, 2.0001)));
});

/* ---------- ray tracing ---------- */

test("an outward ray escapes and conserves E, Lz and Q", () => {
  const result = traceKerrRay({
    aStar: 0.9,
    r: 20,
    theta: 1.2,
    direction: [0.6, 0.3, 0.2],
    rEscape: 1e4,
  });
  assert.equal(result.status, "escaped");
  assert.ok(result.state[1] >= 1e4);
  assert.equal(result.drift.E, 0);
  assert.equal(result.drift.Lz, 0);
  // Measured drift is ~8e-10; the bound carries an order of magnitude of headroom.
  assert.ok(Math.abs(result.drift.Q) < 1e-8, `Carter drift ${result.drift.Q}`);
  assert.ok(Math.abs(result.drift.hamiltonian) < 1e-9, `null drift ${result.drift.hamiltonian}`);
});

test("an inward ray is captured and terminates outside the horizon", () => {
  const aStar = 0.9;
  const result = traceKerrRay({
    aStar,
    r: 20,
    theta: 1.2,
    direction: [-1, 0, 0],
    rEscape: 1e4,
  });
  const { rPlus } = kerrHorizonRadii(aStar);
  assert.equal(result.status, "captured");
  assert.ok(result.state[1] > rPlus, "the integration must stop strictly outside r_+");
  assert.ok(result.state[1] <= rPlus + 1e-3 + 1e-9);
  assert.equal(result.drift.E, 0);
  assert.equal(result.drift.Lz, 0);
  assert.ok(Math.abs(result.drift.Q) < 1e-8, `Carter drift ${result.drift.Q}`);
  // The null constraint degrades near r_+ because g^rr = Sigma/Delta diverges;
  // the measured drift at the default horizonEpsilon = 1e-3 is ~2e-7.
  assert.ok(Math.abs(result.drift.hamiltonian) < 1e-5, `null drift ${result.drift.hamiltonian}`);
});

test("the null-constraint drift shrinks as the horizon stand-off grows", () => {
  const drifts = [1e-2, 1e-3, 1e-4].map(
    (horizonEpsilon) =>
      Math.abs(
        traceKerrRay({
          aStar: 0.9,
          r: 20,
          theta: 1.2,
          direction: [-1, 0, 0],
          rEscape: 1e4,
          horizonEpsilon,
        }).drift.hamiltonian,
      ),
  );
  assert.ok(drifts[0] < drifts[1], `expected ${drifts[0]} < ${drifts[1]}`);
  assert.ok(drifts[1] < drifts[2], `expected ${drifts[1]} < ${drifts[2]}`);
});

test("a ray crossing the equatorial plane inside the disk terminates there", () => {
  const result = traceKerrRay({
    aStar: 0.9,
    r: 20,
    theta: 1.2,
    direction: [-0.9, 0.1, -0.3],
    rEscape: 1e4,
    diskInner: 2.32,
    diskOuter: 30,
  });
  assert.equal(result.status, "disk");
  assert.equal(result.event.type, "disk");
  assert.ok(Math.abs(Math.cos(result.state[2])) < 1e-12, "the crossing must be equatorial");
  assert.ok(result.state[1] > 2.32 && result.state[1] < 30);
  assert.ok(Math.abs(result.drift.Q) < 1e-8);
  assert.ok(Math.abs(result.drift.hamiltonian) < 1e-9);
});

test("a crossing outside the disk annulus is not reported as a disk hit", () => {
  const result = traceKerrRay({
    aStar: 0.9,
    r: 20,
    theta: 1.2,
    direction: [-0.9, 0.1, -0.3],
    rEscape: 1e4,
    diskInner: 2.32,
    diskOuter: 3,
  });
  assert.notEqual(result.status, "disk");
});

test("RK45 converges: a loose run agrees with a tight-tolerance reference", () => {
  const options = { aStar: 0.9, r: 20, theta: 1.2, direction: [0.6, 0.3, 0.2], rEscape: 1e4 };
  const reference = traceKerrRay({ ...options, atol: 1e-13, rtol: 1e-13 });
  const loose = traceKerrRay({ ...options, atol: 1e-8, rtol: 1e-8 });
  assert.equal(reference.status, "escaped");
  assert.equal(loose.status, "escaped");
  // The accumulated azimuth is the well-conditioned observable: the escape
  // radius itself is step-size dependent because the termination is a threshold.
  // Measured difference in phi is ~2.5e-8.
  assert.ok(Math.abs(reference.state[3] - loose.state[3]) < 1e-6);
  assert.ok(Math.abs(reference.drift.Q - loose.drift.Q) < 1e-8);
  assert.ok(reference.steps > loose.steps, "the tighter tolerance must take more steps");
});

test("the step budget is honoured and reported", () => {
  const result = traceKerrRay({
    aStar: 0.9,
    r: 20,
    theta: 1.2,
    direction: [0.6, 0.3, 0.2],
    rEscape: 1e4,
    maxSteps: 25,
  });
  assert.equal(result.status, "max-steps");
  assert.ok(result.steps + result.rejected <= 25);
});

test("ray tracing is deterministic", () => {
  const options = { aStar: 0.4, r: 12, theta: 1.1, direction: [0.2, 0.5, 0.3], rEscape: 1e3 };
  const first = traceKerrRay(options);
  const second = traceKerrRay(options);
  assert.deepEqual(first.state, second.state);
  assert.equal(first.steps, second.steps);
  assert.equal(first.status, second.status);
});

/* ---------- input validation ---------- */

test("invalid spin, radius, angle and tolerance inputs are rejected", () => {
  assert.throws(() => kerrHorizonRadii(1.5), RangeError);
  assert.throws(() => kerrHorizonRadii(-1.5), RangeError);
  assert.throws(() => kerrHorizonRadii(Number.NaN), TypeError);
  assert.throws(() => kerrHorizonRadii("not-a-number"), TypeError);
  // `prograde` is coerced with Boolean(), matching the repo's lenient option style.
  assert.equal(kerrIsco(0.5, { prograde: "yes" }), kerrIsco(0.5, { prograde: true }));
  assert.equal(kerrIsco(0.5, { prograde: 0 }), kerrIsco(0.5, { prograde: false }));
  assert.throws(() => kerrMetricComponents(0.5, 0, 1), RangeError);
  assert.throws(() => kerrMetricComponents(0.5, -1, 1), RangeError);
  assert.throws(() => kerrMetricComponents(0.5, 5, Number.NaN), TypeError);
  assert.throws(() => kerrErgosphereRadius(0.5, Number.NaN), TypeError);
});

test("invalid ray-tracing inputs are rejected with descriptive errors", () => {
  const base = { aStar: 0.5, r: 10, theta: 1.2, direction: [0.5, 0.5, 0.5] };
  assert.throws(() => traceKerrRay({ ...base, theta: 0 }), RangeError);
  assert.throws(() => traceKerrRay({ ...base, theta: Math.PI }), RangeError);
  assert.throws(() => traceKerrRay({ ...base, r: 1.5 }), RangeError);
  assert.throws(() => traceKerrRay({ ...base, rEscape: 5 }), RangeError);
  assert.throws(() => traceKerrRay({ ...base, atol: 0 }), RangeError);
  assert.throws(() => traceKerrRay({ ...base, rtol: -1 }), RangeError);
  assert.throws(() => traceKerrRay({ ...base, h0: 0 }), RangeError);
  assert.throws(() => traceKerrRay({ ...base, hMax: -1 }), RangeError);
  assert.throws(() => traceKerrRay({ ...base, maxSteps: 0 }), RangeError);
  assert.throws(() => traceKerrRay({ ...base, maxSteps: 1.5 }), RangeError);
  assert.throws(() => traceKerrRay({ ...base, horizonEpsilon: 0 }), RangeError);
  assert.throws(() => traceKerrRay({ ...base, diskInner: 30, diskOuter: 10 }), RangeError);
  assert.throws(() => traceKerrRay({ ...base, direction: [0, 0, 0] }), RangeError);
  assert.throws(() => traceKerrRay({ ...base, observer: "comoving" }), TypeError);
});

test("invalid conserved-quantity and state inputs are rejected", () => {
  assert.throws(() => kerrConservedQuantities({ aStar: 0.5, r: 10, theta: 1, direction: [1, 0] }), TypeError);
  assert.throws(() => kerrConservedQuantities({ aStar: 0.5, r: 10, theta: 1, direction: [0, 0, 0] }), RangeError);
  assert.throws(() => kerrConservedQuantities({ aStar: 0.5, r: 10, theta: 1, direction: [1, 0, 0], observer: "nope" }), TypeError);
  assert.throws(() => carterConstantFromState([1, 2, 3], 0.5), RangeError);
  assert.throws(() => hamiltonianValue([1, 2, 3], 0.5), RangeError);
  assert.throws(() => kerrHamiltonianRHS([1, 2, 3], { aStar: 0.5 }), RangeError);
  assert.throws(() => kerrHamiltonianRHS([0, 5, 1, 0, -1, 0, 0, 0], null), TypeError);
  assert.throws(() => kerrHamiltonianRHS([0, 5, 1, 0, -1, 0, 0, 0], { aStar: 2 }), RangeError);
});

/* ---------- legacy compatibility ---------- */

test("the legacy spin-clamped geometry summary is unchanged", () => {
  const zero = kerrGeometry(0);
  assert.equal(zero.rPlus, 2);
  assert.equal(zero.rIsco, 6);
  assert.equal(zero.rIscoRetrograde, 6);
  assert.equal(zero.rPhoton, 3);
  assert.equal(zero.rErgoEquator, 2);
  assert.equal(zero.temperatureFactor, 1);
  assert.ok(Math.abs(kerrGeometry(5).a - 0.998) < 1e-12);
  assert.equal(kerrGeometry("nonsense").a, 0);
  assert.equal(kerrGeometry(-3).a, 0);
  assert.ok(Math.abs(kerrErgosphere(0.9, Math.PI / 2) - 2) < 1e-12);
  assert.ok(Math.abs(kerrErgosphere(0.9, 0) - kerrGeometry(0.9).rPlus) < 1e-12);
});

test("the legacy summary agrees with the validated radii in the clamped domain", () => {
  for (const a of [0, 0.3, 0.6, 0.9, 0.998]) {
    const legacy = kerrGeometry(a);
    assert.ok(Math.abs(legacy.rPlus - kerrHorizonRadii(a).rPlus) < 1e-12);
    assert.ok(Math.abs(legacy.rIsco - kerrIsco(a, { prograde: true })) < 1e-12);
    assert.ok(Math.abs(legacy.rIscoRetrograde - kerrIsco(a, { prograde: false })) < 1e-12);
    assert.ok(Math.abs(legacy.rPhoton - kerrPhotonSphere(a, { prograde: true })) < 1e-12);
    assert.ok(Math.abs(legacy.rPhotonRetrograde - kerrPhotonSphere(a, { prograde: false })) < 1e-12);
  }
});

test("TWO_PI is exported for downstream geometry code", () => {
  assert.equal(TWO_PI, 2 * Math.PI);
});
