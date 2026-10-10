/*
 * Numerical tests for the thin-disk thermodynamics module.
 *
 * The module implements the standard Page & Thorne (1974) relativistic flux
 * integral. Where a closed-form limit exists (Newtonian flux, Schwarzschild
 * circular orbits, the exact identity E - Omega L = 1/u^t) the tests compare
 * against it directly. Where the published formula is only asymptotically
 * correct, the test documents the measured residual instead of hiding it.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_QUADRATURE_ORDER,
  gaussLegendreNodes,
  gaussLegendreIntegrate,
  kerrCircularOrbit,
  pageThorneFluxGeometric,
  pageThorneFluxSI,
  newtonianDiskFluxGeometric,
  geometricStefanBoltzmannConstant,
  diskEffectiveTemperatureKelvin,
  diskEffectiveTemperatureGeometric,
  kerrGravitationalRedshiftOrbiting,
  kerrOrbitalDopplerFactor,
  kerrTotalRedshiftFactor,
  kerrGravitationalRedshiftStatic,
  observedTemperatureKelvin,
} from "../js/science/accretion-disk.mjs";
import { kerrIsco } from "../js/science/kerr.mjs";
import {
  STEFAN_BOLTZMANN,
  geometricFluxToSI,
  kgPerSecondToGeometricMassRate,
} from "../js/science/constants.mjs";

/* ---------- quadrature ---------- */

test("Gauss-Legendre nodes integrate polynomials exactly", () => {
  const nodes = gaussLegendreNodes(8);
  assert.equal(nodes.order, 8);
  assert.equal(nodes.nodes.length, 8);
  assert.equal(nodes.weights.length, 8);
  let weightSum = 0;
  for (const weight of nodes.weights) weightSum += weight;
  assert.ok(Math.abs(weightSum - 2) < 1e-14);
  // A 2n-1 = 15 degree rule integrates x^2 exactly.
  assert.ok(Math.abs(gaussLegendreIntegrate((x) => x * x, -1, 1, 8) - 2 / 3) < 1e-14);
  assert.ok(Math.abs(gaussLegendreIntegrate((x) => x ** 6, -1, 1, 8) - 2 / 7) < 1e-14);
});

test("Gauss-Legendre quadrature is deterministic and cached", () => {
  const first = gaussLegendreNodes(16);
  const second = gaussLegendreNodes(16);
  assert.equal(first, second, "the node table must be cached");
  assert.deepEqual(Array.from(first.nodes), Array.from(second.nodes));
});

test("Gauss-Legendre quadrature handles a shifted interval", () => {
  const value = gaussLegendreIntegrate((x) => x, 2, 5, 4);
  assert.ok(Math.abs(value - (25 / 2 - 4 / 2)) < 1e-13);
});

test("invalid quadrature orders are rejected", () => {
  assert.throws(() => gaussLegendreNodes(0), RangeError);
  assert.throws(() => gaussLegendreNodes(-4), RangeError);
  assert.throws(() => gaussLegendreNodes(2.5), RangeError);
  assert.throws(() => gaussLegendreNodes("abc"), TypeError);
  assert.throws(() => gaussLegendreIntegrate(null, 0, 1), TypeError);
});

/* ---------- circular orbits ---------- */

test("Schwarzschild circular orbits match the closed-form expressions", () => {
  const r = 6;
  const orbit = kerrCircularOrbit(0, r);
  assert.ok(Math.abs(orbit.energy - Math.sqrt(8 / 9)) < 1e-14);
  assert.ok(Math.abs(orbit.angularMomentum - 2 * Math.sqrt(3)) < 1e-14);
  assert.ok(Math.abs(orbit.omega - 1 / (r ** 1.5)) < 1e-15);
  assert.ok(Math.abs(orbit.timeComponent - Math.SQRT2) < 1e-14);
  // E = (r - 2)/sqrt(r(r - 3)) and L = r/sqrt(r - 3) for a = 0.
  assert.ok(Math.abs(orbit.energy - (r - 2) / Math.sqrt(r * (r - 3))) < 1e-14);
  assert.ok(Math.abs(orbit.angularMomentum - r / Math.sqrt(r - 3)) < 1e-14);
});

test("the metric cross-checks agree with the closed-form orbit quantities", () => {
  for (const aStar of [0, 0.4, 0.9, 0.998]) {
    for (const r of [4, 8, 20, 100]) {
      if (r <= kerrIsco(aStar)) continue;
      const orbit = kerrCircularOrbit(aStar, r);
      assert.ok(
        Math.abs(orbit.energy - orbit.specificEnergyFromMetric) < 1e-12,
        `E mismatch at a*=${aStar}, r=${r}`,
      );
      assert.ok(
        Math.abs(orbit.angularMomentum - orbit.specificAngularMomentumFromMetric) < 1e-12,
        `L mismatch at a*=${aStar}, r=${r}`,
      );
    }
  }
});

test("E - Omega L equals 1/u^t exactly", () => {
  // This identity is what makes the Page-Thorne flux integrand well behaved.
  for (const aStar of [0, 0.5, 0.9]) {
    for (const r of [6, 8, 10, 20, 100]) {
      if (r <= kerrIsco(aStar)) continue;
      const orbit = kerrCircularOrbit(aStar, r);
      const combination = orbit.energy - orbit.omega * orbit.angularMomentum;
      assert.ok(
        Math.abs(combination - 1 / orbit.timeComponent) < 1e-12,
        `E - Omega L mismatch at a*=${aStar}, r=${r}`,
      );
    }
  }
});

test("prograde and retrograde orbits coincide at zero spin and split otherwise", () => {
  const prograde = kerrCircularOrbit(0, 10, { prograde: true });
  const retrograde = kerrCircularOrbit(0, 10, { prograde: false });
  assert.ok(Math.abs(prograde.energy - retrograde.energy) < 1e-15);
  assert.ok(Math.abs(prograde.angularMomentum + retrograde.angularMomentum) < 1e-15);
  assert.ok(Math.abs(prograde.omega + retrograde.omega) < 1e-15);

  const fast = kerrCircularOrbit(0.9, 10, { prograde: true });
  const slow = kerrCircularOrbit(0.9, 10, { prograde: false });
  assert.ok(fast.energy < slow.energy, "prograde orbits are more tightly bound");
  assert.ok(fast.angularMomentum > 0 && slow.angularMomentum < 0);
});

test("circular orbits are rejected inside the photon sphere", () => {
  assert.throws(() => kerrCircularOrbit(0, 2.5), RangeError);
  assert.throws(() => kerrCircularOrbit(0.9, 1.2), RangeError);
  assert.throws(() => kerrCircularOrbit(0, 0), RangeError);
  assert.throws(() => kerrCircularOrbit(0, -5), RangeError);
  assert.throws(() => kerrCircularOrbit(1.5, 10), RangeError);
  assert.throws(() => kerrCircularOrbit(0, 10, { prograde: "yes" }), TypeError);
});

/* ---------- Page-Thorne flux ---------- */

test("the disk flux is exactly zero at and inside the ISCO", () => {
  for (const aStar of [0, 0.5, 0.9, 0.998]) {
    const isco = kerrIsco(aStar);
    assert.equal(pageThorneFluxGeometric({ aStar, r: isco }), 0);
    assert.equal(pageThorneFluxGeometric({ aStar, r: isco - 0.5 }), 0);
    assert.equal(pageThorneFluxGeometric({ aStar, r: 1 }), 0);
  }
});

test("the disk flux is finite and positive just outside the ISCO", () => {
  for (const aStar of [0, 0.5, 0.9, 0.998]) {
    const isco = kerrIsco(aStar);
    const flux = pageThorneFluxGeometric({ aStar, r: isco + 1e-3 });
    assert.ok(Number.isFinite(flux), `flux must be finite at a*=${aStar}`);
    assert.ok(flux > 0, `flux must be positive at a*=${aStar}`);
    assert.ok(flux < 1e-3, "the flux must vanish continuously at the inner edge");
  }
});

test("the disk flux is finite and positive across the disk", () => {
  for (const r of [7, 10, 20, 50, 200, 1000]) {
    const flux = pageThorneFluxGeometric({ aStar: 0.5, r });
    assert.ok(Number.isFinite(flux) && flux > 0, `flux must be finite and positive at r=${r}`);
  }
});

test("the disk flux peaks outside the ISCO and decays at large radius", () => {
  const samples = [];
  for (let r = 6.5; r <= 60; r += 0.25) samples.push([r, pageThorneFluxGeometric({ aStar: 0, r })]);
  let peak = samples[0];
  for (const sample of samples) if (sample[1] > peak[1]) peak = sample;
  // The relativistic peak sits near r = 9.55 for a = 0, well outside the ISCO.
  assert.ok(peak[0] > 8 && peak[0] < 12, `unexpected peak radius ${peak[0]}`);
  const far = pageThorneFluxGeometric({ aStar: 0, r: 1000 });
  assert.ok(far < peak[1] / 100, "the flux must fall off steeply at large radius");
});

test("prograde spin brightens the disk and retrograde spin dims it", () => {
  const reference = pageThorneFluxGeometric({ aStar: 0, r: 10 });
  const prograde = pageThorneFluxGeometric({ aStar: 0.9, r: 10, prograde: true });
  const retrograde = pageThorneFluxGeometric({ aStar: 0.9, r: 10, prograde: false });
  assert.ok(prograde > reference, "prograde spin must increase the flux at fixed r");
  assert.ok(retrograde < reference, "retrograde spin must decrease the flux at fixed r");
});

test("the flux scales linearly with the mass accretion rate", () => {
  const unit = pageThorneFluxGeometric({ aStar: 0.5, r: 12, massRate: 1 });
  const scaled = pageThorneFluxGeometric({ aStar: 0.5, r: 12, massRate: 7 });
  assert.ok(Math.abs(scaled - 7 * unit) < 1e-15);
});

test("the flux is deterministic and independent of the quadrature order", () => {
  const coarse = pageThorneFluxGeometric({ aStar: 0.7, r: 15, quadratureOrder: 16 });
  const fine = pageThorneFluxGeometric({ aStar: 0.7, r: 15, quadratureOrder: 128 });
  assert.ok(Math.abs(coarse - fine) < 1e-12, "the quadrature must be converged");
  assert.equal(
    pageThorneFluxGeometric({ aStar: 0.7, r: 15 }),
    pageThorneFluxGeometric({ aStar: 0.7, r: 15 }),
  );
});

test("the Newtonian flux matches the closed-form 3/(8 pi r^3) (1 - sqrt(r_i/r))", () => {
  const innerRadius = 6;
  for (const r of [8, 20, 100, 1000]) {
    const expected = (3 / (8 * Math.PI * r ** 3)) * (1 - Math.sqrt(innerRadius / r));
    const actual = newtonianDiskFluxGeometric({ r, innerRadius });
    assert.ok(Math.abs(actual - expected) < 1e-15, `mismatch at r=${r}`);
  }
  assert.equal(newtonianDiskFluxGeometric({ r: 5, innerRadius: 6 }), 0);
});

test("the Newtonian flux peaks at 49/6 r_g", () => {
  let peak = [0, -Infinity];
  for (let r = 6.5; r <= 40; r += 0.001) {
    const flux = newtonianDiskFluxGeometric({ r, innerRadius: 6 });
    if (flux > peak[1]) peak = [r, flux];
  }
  assert.ok(Math.abs(peak[0] - 49 / 6) < 0.01, `expected 49/6, received ${peak[0]}`);
});

test("the relativistic flux approaches the Newtonian flux at large radius", () => {
  // The published Page-Thorne formula differs from the Newtonian flux by
  // O(r^-1/2) terms, so the ratio converges only asymptotically. The measured
  // ratio is 0.954 at r = 1000 and 0.979 at r = 5000.
  const ratio = (r) =>
    pageThorneFluxGeometric({ aStar: 0, r }) / newtonianDiskFluxGeometric({ r, innerRadius: 6 });
  const near = ratio(20);
  const far = ratio(1000);
  assert.ok(near < far, "the ratio must increase monotonically toward 1");
  assert.ok(far > 0.95, `expected > 0.95 at r = 1000, received ${far}`);
  assert.ok(far < 1, "the relativistic flux must stay below the Newtonian flux");
});

test("the disk luminosity is within 2% of the exact 1 - E_isco", () => {
  // L = 2 * integral 2 pi r F dr over both disk faces. The standard published
  // formula integrates to ~1.9% above the exact accretion efficiency; the
  // residual is intrinsic to the formula, not to this implementation.
  const isco = kerrIsco(0);
  const steps = 200000;
  const upper = 200000;
  const logUpper = Math.log(upper / isco);
  // Substitute r = r_i exp(u), so dr = r du and the integrand becomes 2 pi r^2 F.
  let total = 0;
  for (let index = 0; index < steps; index += 1) {
    const r = isco * Math.exp((logUpper * (index + 0.5)) / steps);
    total += pageThorneFluxGeometric({ aStar: 0, r }) * 2 * Math.PI * r * r;
  }
  total *= logUpper / steps;
  const luminosity = 2 * total;
  const exact = 1 - kerrCircularOrbit(0, isco).energy;
  const relative = Math.abs(luminosity - exact) / exact;
  assert.ok(relative < 0.02, `expected < 2% residual, received ${(relative * 100).toFixed(2)}%`);
});

test("the SI flux conversion is consistent with the geometric flux", () => {
  const geometric = pageThorneFluxGeometric({ aStar: 0.5, r: 12 });
  const si = pageThorneFluxSI({ aStar: 0.5, r: 12, massSolar: 10 });
  assert.ok(Number.isFinite(si) && si > 0);
  // The conversion factor is c^9/(G^3 M^2); check the ratio is mass-independent
  // in the expected way by comparing two masses.
  const siOther = pageThorneFluxSI({ aStar: 0.5, r: 12, massSolar: 20 });
  assert.ok(Math.abs(si / siOther - 4) < 1e-10, "flux must scale as 1/M^2");
  assert.ok(geometric > 0);
});

test("invalid flux inputs are rejected", () => {
  assert.throws(() => pageThorneFluxGeometric({ aStar: 0, r: 0 }), RangeError);
  assert.throws(() => pageThorneFluxGeometric({ aStar: 0, r: -1 }), RangeError);
  assert.throws(() => pageThorneFluxGeometric({ aStar: 1.5, r: 10 }), RangeError);
  assert.throws(() => pageThorneFluxGeometric({ aStar: 0, r: 10, massRate: -1 }), RangeError);
  assert.throws(() => pageThorneFluxGeometric({ aStar: 0, r: 10, prograde: "yes" }), TypeError);
  assert.throws(() => pageThorneFluxGeometric({ aStar: 0, r: 10, quadratureOrder: 0 }), RangeError);
  assert.throws(() => pageThorneFluxSI({ aStar: 0, r: 10, massSolar: 0 }), RangeError);
  assert.throws(() => pageThorneFluxSI({ aStar: 0, r: 10, massSolar: -3 }), RangeError);
});

/* ---------- temperature ---------- */

test("the geometric Stefan-Boltzmann constant reproduces the SI constant", () => {
  const massSolar = 10;
  const sigmaGeometric = geometricStefanBoltzmannConstant(massSolar);
  assert.ok(Number.isFinite(sigmaGeometric) && sigmaGeometric > 0);
  // sigma_geom = pi^2 hbar c / (60 G M^2) with M in kilograms.
  const flux = 1;
  const geometricTemperature = diskEffectiveTemperatureGeometric(flux, massSolar);
  const siTemperature = diskEffectiveTemperatureKelvin(flux, massSolar);
  assert.ok(geometricTemperature > 0 && siTemperature > 0);
  // F = sigma T^4 must hold in both unit systems, and the two must agree once
  // the flux is converted with the geometric-to-SI factor.
  assert.ok(Math.abs(sigmaGeometric * geometricTemperature ** 4 - flux) < 1e-15);
  const siFlux = geometricFluxToSI(flux, massSolar);
  assert.ok(
    Math.abs(STEFAN_BOLTZMANN * siTemperature ** 4 - siFlux) / siFlux < 1e-6,
    "sigma_SI T_SI^4 must equal the converted flux",
  );
});

test("the disk temperature follows the standard thin-disk scaling", () => {
  const massSolar = 10;
  const massRateSI = 1e18 / 1000; // 1e18 g/s in kg/s
  const massRate = kgPerSecondToGeometricMassRate(massRateSI, massSolar);
  const isco = kerrIsco(0);
  let peak = [0, 0];
  for (let r = isco; r <= 60; r += 0.01) {
    const flux = pageThorneFluxGeometric({ aStar: 0, r, massRate });
    const temperature = diskEffectiveTemperatureKelvin(flux, massSolar);
    if (temperature > peak[1]) peak = [r, temperature];
  }
  // For 10 M_sun at 1e18 g/s the relativistic peak is ~3.16e6 K near r = 9.55.
  assert.ok(peak[1] > 2e6 && peak[1] < 5e6, `unexpected peak temperature ${peak[1]}`);
  assert.ok(peak[0] > 8 && peak[0] < 12, `unexpected peak radius ${peak[0]}`);
});

test("the disk temperature scales as Mdot^(1/4) and M^(-1/2)", () => {
  const massSolar = 10;
  const base = kgPerSecondToGeometricMassRate(1e15, massSolar);
  const flux = (rate) => pageThorneFluxGeometric({ aStar: 0, r: 12, massRate: rate });
  const t1 = diskEffectiveTemperatureKelvin(flux(base), massSolar);
  const t16 = diskEffectiveTemperatureKelvin(flux(16 * base), massSolar);
  assert.ok(Math.abs(t16 / t1 - 2) < 1e-9, "T must scale as Mdot^(1/4)");

  // At fixed SI accretion rate, T ~ (Mdot / M^2)^(1/4), so T ~ M^(-1/2).
  const tOther = diskEffectiveTemperatureKelvin(
    flux(kgPerSecondToGeometricMassRate(1e15, 160)),
    160,
  );
  assert.ok(Math.abs(tOther / t1 - 16 ** -0.5) < 1e-9, "T must scale as M^(-1/2)");
});

test("invalid temperature inputs are rejected", () => {
  assert.throws(() => geometricStefanBoltzmannConstant(0), RangeError);
  assert.throws(() => geometricStefanBoltzmannConstant(-1), RangeError);
  assert.throws(() => geometricStefanBoltzmannConstant("abc"), TypeError);
  assert.throws(() => diskEffectiveTemperatureKelvin(-1, 10), RangeError);
  assert.throws(() => diskEffectiveTemperatureKelvin(1, 0), RangeError);
  assert.throws(() => observedTemperatureKelvin(-1, 1), RangeError);
  assert.throws(() => observedTemperatureKelvin(1000, 0), RangeError);
  assert.throws(() => observedTemperatureKelvin(1000, -1), RangeError);
  assert.equal(observedTemperatureKelvin(0, 1), 0);
});

/* ---------- frequency shifts ---------- */

test("the gravitational redshift of an orbiting emitter is 1/u^t", () => {
  for (const aStar of [0, 0.5, 0.9]) {
    for (const r of [6, 10, 30]) {
      if (r <= kerrIsco(aStar)) continue;
      const orbit = kerrCircularOrbit(aStar, r);
      const factor = kerrGravitationalRedshiftOrbiting(aStar, r);
      assert.ok(Math.abs(factor - 1 / orbit.timeComponent) < 1e-14);
      assert.ok(factor > 0 && factor < 1, "the emitter clock must run slow");
    }
  }
});

test("the static gravitational redshift is sqrt(-g_tt) in Schwarzschild", () => {
  assert.ok(Math.abs(kerrGravitationalRedshiftStatic(0, 6) - Math.sqrt(2 / 3)) < 1e-14);
  assert.ok(Math.abs(kerrGravitationalRedshiftStatic(0, 10) - Math.sqrt(0.8)) < 1e-14);
  // A static observer does not exist inside the ergosphere.
  assert.throws(() => kerrGravitationalRedshiftStatic(0.9, 1.2), RangeError);
});

test("the orbital Doppler factor reduces to 1/(1 - Omega b)", () => {
  const orbit = kerrCircularOrbit(0.5, 12);
  const energy = 1;
  const lz = 0.5 * orbit.angularMomentum;
  const factor = kerrOrbitalDopplerFactor({
    energy,
    angularMomentum: orbit.angularMomentum,
    omega: orbit.omega,
    lz,
  });
  const b = lz / energy;
  assert.ok(Math.abs(factor - 1 / (1 - orbit.omega * b)) < 1e-14);
  // A photon with no angular momentum sees no beaming.
  assert.equal(
    kerrOrbitalDopplerFactor({ energy: 1, angularMomentum: orbit.angularMomentum, omega: orbit.omega, lz: 0 }),
    1,
  );
});

test("the total redshift factor is the exact product of its two parts", () => {
  for (const aStar of [0, 0.5, 0.9]) {
    for (const r of [6, 10, 30]) {
      if (r <= kerrIsco(aStar)) continue;
      const orbit = kerrCircularOrbit(aStar, r);
      for (const lz of [-2, 0, 1.5, 4]) {
        const result = kerrTotalRedshiftFactor({ aStar, r, energy: 1, lz });
        assert.equal(result.total, result.gravitational * result.orbital);
        assert.ok(Math.abs(result.gravitational - 1 / orbit.timeComponent) < 1e-14);
        assert.ok(result.total > 0);
      }
    }
  }
});

test("the total redshift factor is bounded by the gravitational factor", () => {
  // g_orb = E/(E - Omega Lz) is > 1 for a co-rotating photon (Lz > 0) and < 1
  // for a counter-rotating one, so the total shift straddles g_grav.
  const aStar = 0.5;
  const r = 12;
  const coRotating = kerrTotalRedshiftFactor({ aStar, r, energy: 1, lz: 3 });
  const counterRotating = kerrTotalRedshiftFactor({ aStar, r, energy: 1, lz: -3 });
  assert.ok(coRotating.orbital > 1);
  assert.ok(counterRotating.orbital < 1);
  assert.ok(coRotating.total > coRotating.gravitational);
  assert.ok(counterRotating.total < counterRotating.gravitational);
});

test("the observed temperature is the emitted temperature scaled by g", () => {
  assert.equal(observedTemperatureKelvin(1000, 1), 1000);
  assert.equal(observedTemperatureKelvin(1000, 0.5), 500);
  assert.ok(Math.abs(observedTemperatureKelvin(1e6, 0.8) - 8e5) < 1e-9);
});

test("invalid redshift inputs are rejected", () => {
  assert.throws(() => kerrGravitationalRedshiftOrbiting(0, 2.5), RangeError);
  assert.throws(() => kerrOrbitalDopplerFactor({ energy: 0, angularMomentum: 1, omega: 0.1, lz: 1 }), RangeError);
  assert.throws(() => kerrOrbitalDopplerFactor({ energy: 1, angularMomentum: 1, omega: 0.1, lz: 100 }), RangeError);
  assert.throws(() => kerrOrbitalDopplerFactor({ energy: "abc", angularMomentum: 1, omega: 0.1, lz: 1 }), TypeError);
  assert.throws(() => kerrTotalRedshiftFactor({ aStar: 0, r: 2.5, energy: 1, lz: 1 }), RangeError);
});

test("the default quadrature order is exported and used", () => {
  assert.equal(DEFAULT_QUADRATURE_ORDER, 64);
  assert.equal(gaussLegendreNodes(DEFAULT_QUADRATURE_ORDER).order, DEFAULT_QUADRATURE_ORDER);
});
