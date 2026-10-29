import test from 'node:test';
import assert from 'node:assert/strict';
import { G, C, SOLAR_MASS, tidalEigenvalues, schwarzschildRadius, spaghettificationRadius, integrateTidalRing, flammProperDistance } from '../js/science/tidal.mjs';
import { flammEmbedding } from '../js/formula/library/relativity.mjs';
import { GR_TESTS, pull, gpsClockOffset } from '../js/science/data/gr-tests.mjs';

const near = (a, b, eps) => assert.ok(Math.abs(a-b) <= eps, `${a} versus ${b}`);
test('vacuum tidal tensor is traceless and has the correct physical sign', () => {
  const e = tidalEigenvalues(10 * SOLAR_MASS, 1e7);
  near(e.radial + 2 * e.transverse, 0, 1e-15);
  assert.ok(e.radial < 0 && e.transverse > 0);
  near(e.radial, -2 * G * 10 * SOLAR_MASS / 1e21, 1e-15);
});
test('spaghettification threshold crosses the horizon as mass increases', () => {
  for (const [solar, outside] of [[10, true], [1e6, false]]) {
    const m = solar * SOLAR_MASS, r = spaghettificationRadius(m, 2, 100);
    near(2 * G * m * 2 / r ** 3, 100, 1e-10);
    assert.equal(r > schwarzschildRadius(m), outside);
  }
});
test('infall starts at rest and the tidal ring stretches and narrows', () => {
  const m = 10 * SOLAR_MASS, rs = schwarzschildRadius(m);
  const run = integrateTidalRing({ mass: m, startRadius: 30 * rs, endRadius: 2 * rs, count: 8, steps: 400 });
  const first = run.snapshots[0], last = run.snapshots.at(-1);
  near(first.radialScale, 1, 1e-14); near(first.transverseScale, 1, 1e-14);
  near(last.radius, 2 * rs, 1e-7);
  assert.ok(last.radialScale > 1 && last.transverseScale < 1 && last.properTime > 0);
  const ring = run.ring(400); near(ring[0].radial, last.radialScale, 1e-12); near(ring[2].transverse, last.transverseScale, 1e-12);
  const refined = integrateTidalRing({ mass: m, startRadius: 30 * rs, endRadius: 2 * rs, steps: 800 }).snapshots.at(-1);
  near(last.radialScale, refined.radialScale, 1e-5); near(last.transverseScale, refined.transverseScale, 1e-5);
  const startRadius = 1.2 * spaghettificationRadius(m, 2, 100), endRadius = 1.02 * rs;
  const coarse = integrateTidalRing({ mass: m, startRadius, endRadius, steps: 800 }).snapshots.at(-1);
  const fine = integrateTidalRing({ mass: m, startRadius, endRadius, steps: 1600 }).snapshots.at(-1);
  near(coarse.radialScale, fine.radialScale, 1e-5); near(coarse.transverseScale, fine.transverseScale, 1e-8);
});
test('Flamm surface distance matches the Schwarzschild proper radial integral', () => {
  const rs = 2, r1 = 2.5, r2 = 12, n = 20000, h = (r2-r1)/n;
  let sum = 0;
  for (let i=0; i<=n; i++) {
    const r=r1+i*h, integrand=1/Math.sqrt(1-rs/r);
    sum += integrand * (i===0 || i===n ? 1 : i%2 ? 4 : 2);
    if (i===100) near(flammEmbedding.evaluate({r,rs}), 2*Math.sqrt(rs*(r-rs)), 1e-12);
  }
  near(flammProperDistance(r2,rs)-flammProperDistance(r1,rs), sum*h/3, 1e-8);
});
test('GPS prediction and measured pull use separate observables', () => {
  const g = gpsClockOffset();
  near(g.gravitational,45.72,0.01); near(g.kinematic,-7.21,0.01); near(g.net,38.50,0.01);
  assert.equal(GR_TESTS.length,7);
  for (const row of GR_TESTS) { assert.ok(row.url.startsWith('https://') && row.sigma > 0 && Number.isFinite(pull(row))); }
  near(pull(GR_TESTS.find(r=>r.id==='gps')),0.23/1.34,1e-12);
  near(pull(GR_TESTS.find(r=>r.id==='pulsar')),-1.0625,1e-12);
  assert.equal(C,299792458);
});
