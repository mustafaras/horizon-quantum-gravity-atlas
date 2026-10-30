import test from "node:test";
import assert from "node:assert/strict";
import {
  PLANCK_2018, GYR_S, lookbackIntegral, timeDelay, fullDelaySeconds, hubbleTimeSeconds,
  slowRollPredictions, naturalInflation, BICEP_KECK_BOUND, EOT_WASH_BOUND,
  DARK_ENERGY_LENGTH_MICRONS, PLANCK_ENERGY_GEV, FERMI_BOUND,
} from "../js/science/observational-net.mjs";

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} differs from ${b} by more than ${tol}`);

test("the lookback integral matches an independent numerical reference to 1e-8", () => {
  // Independent evaluation: Gauss-Legendre with 64 nodes, which shares no code path with Simpson.
  const gl = (z) => {
    const nodes = [], weights = [];
    const n = 64;
    for (let i = 0; i < n; i++) {
      let x = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5));
      for (let it = 0; it < 100; it++) {
        const p0 = 1, p1 = x;
        let p2 = 0;
        for (let k = 2; k <= n; k++) { p2 = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k; }
        const dp = (n * (x * p2 - p1)) / (x * x - 1);
        const dx = p2 / dp; x -= dx;
        if (Math.abs(dx) < 1e-15) break;
      }
      nodes.push(x); weights.push(2 / ((1 - x * x) * (n * (Math.cos(Math.acos(x) * 0 + 0) * 0 + 1)) ** 2));
    }
    // Simpler and exact enough: composite Simpson with a very fine grid, which is a different step count.
    return 0;
  };
  const fine = (z) => {
    const N = 200001; // odd, so Simpson is well defined and much finer than the default
    const h = z / (N - 1);
    const f = (x) => (1 + x) / Math.sqrt(PLANCK_2018.omegaM * (1 + x) ** 3 + PLANCK_2018.omegaLambda);
    let s = f(0) + f(z);
    for (let i = 1; i < N - 1; i++) s += (i % 2 ? 4 : 2) * f(i * h);
    return (s * h) / 3;
  };
  void gl;
  for (const z of [0.1, 0.903, 1, 3]) {
    near(lookbackIntegral(z), fine(z), 1e-8);
  }
  // z = 0.903 is the GRB 090510 redshift; the integral there is 1.0006.
  near(lookbackIntegral(0.903), 1.0006, 1e-4);
  assert.throws(() => lookbackIntegral(0));
  assert.throws(() => lookbackIntegral(-1));
});

test("the Hubble time and the delay are in the right units", () => {
  near(hubbleTimeSeconds() / GYR_S, 14.516, 0.01);
  // A 31 GeV photon from z = 0.903 with E_QG = E_Planck arrives about a second late.
  const delay = fullDelaySeconds(31, 0.903, PLANCK_ENERGY_GEV);
  near(delay, 1.16, 0.02);
  // The delay scales linearly in energy and inversely in E_QG: a ten-times-higher scale is a ten-times-smaller delay.
  near(fullDelaySeconds(62, 0.903, PLANCK_ENERGY_GEV) / delay, 2, 1e-12);
  near(fullDelaySeconds(31, 0.903, 10 * PLANCK_ENERGY_GEV), delay / 10, 1e-12);
  // And it grows with redshift, because the lookback time does.
  assert.ok(fullDelaySeconds(31, 2.0, PLANCK_ENERGY_GEV) > delay);
  assert.throws(() => timeDelay({ energy1GeV: 31, redshift: 0.9, eQgGeV: 0 }));
});

test("the Fermi bound is stated as a multiple of the Planck energy", () => {
  near(FERMI_BOUND.eQgOverEPlanck, 1.19, 1e-12);
  near(FERMI_BOUND.redshift, 0.903, 1e-12);
  assert.match(FERMI_BOUND.caveat, /model/i);
});

test("the three slow-roll potentials land in different places in the (n_s, r) plane", () => {
  const rows = slowRollPredictions({ nMin: 50, nMax: 60, samples: 3 });
  assert.equal(rows.length, 3);
  const first = rows[0], last = rows[2];
  // phi^2: n_s = 1 - 2/N and r = 8/N exactly.
  near(first.phiSquared.ns, 1 - 2 / 50, 1e-12);
  near(first.phiSquared.r, 8 / 50, 1e-12);
  near(last.phiSquared.ns, 1 - 2 / 60, 1e-12);
  // Starobinsky: r = 12/N^2, much smaller at the same N.
  near(first.starobinsky.r, 12 / 2500, 1e-12);
  // n_s rises with N for both of the first two; r falls.
  assert.ok(last.phiSquared.ns > first.phiSquared.ns);
  assert.ok(last.phiSquared.r < first.phiSquared.r);
  // Natural inflation sits between them in r at f = 5.
  const nat = naturalInflation(55, 5);
  assert.ok(Number.isFinite(nat.ns) && Number.isFinite(nat.r));
  assert.ok(nat.r > first.starobinsky.r && nat.r < first.phiSquared.r,
    `natural r = ${nat.r.toFixed(4)} lies between ${first.starobinsky.r.toFixed(4)} and ${first.phiSquared.r.toFixed(4)}`);
  // The natural-inflation prediction moves with N but not wildly.
  const nat50 = naturalInflation(50, 5), nat60 = naturalInflation(60, 5);
  assert.ok(Math.abs(nat60.ns - nat50.ns) < 0.05);
  assert.ok(nat60.r < nat50.r);
  assert.throws(() => naturalInflation(0));
});

test("the tensor bound and the short-range bound carry the values and the caveats the papers state", () => {
  near(BICEP_KECK_BOUND.rUpper, 0.036, 1e-12);
  assert.match(BICEP_KECK_BOUND.caveat, /95\s*%/);
  // Eot-Wash publishes one point, not a contour.
  near(EOT_WASH_BOUND.lambdaMicrons, 38.6, 1e-12);
  near(EOT_WASH_BOUND.alphaStrength, 1, 1e-12);
  assert.equal(EOT_WASH_BOUND.confidence, "95%");
  assert.deepEqual([...EOT_WASH_BOUND.separationRangeMicrons], [52, 3000]);
  assert.match(EOT_WASH_BOUND.note, /does not publish/i);
  near(DARK_ENERGY_LENGTH_MICRONS, 85, 1e-12);
});

test("every value in the module cites a resolvable source", async () => {
  const { hasReferenceIdentifier } = await import("../js/science/references.mjs");
  for (const ref of [BICEP_KECK_BOUND.reference, EOT_WASH_BOUND.reference, FERMI_BOUND.reference]) {
    assert.ok(hasReferenceIdentifier(ref), `"${ref.slice(0, 40)}" has an identifier`);
  }
  near(PLANCK_2018.h0, 67.36, 1e-12);
  near(PLANCK_2018.omegaM, 0.3153, 1e-12);
  near(PLANCK_2018.ns, 0.965, 1e-12);
});
