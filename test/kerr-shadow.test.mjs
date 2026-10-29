import test from "node:test";
import assert from "node:assert/strict";
import {
  SCHWARZSCHILD_CRITICAL_B, sphericalOrbitRadii, xiOf, etaOf, criticalCurve,
  shadowDiameterMicroarcsec, subringDemagnification, firstSubringFraction,
} from "../js/science/kerr-shadow.mjs";
import { EHT_TARGETS, EHT_COMPARISONS, predictedShadowUas, comparisonFor } from "../js/science/data/eht.mjs";

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} differs from ${b} by more than ${tol}`);

test("the Schwarzschild critical curve is the circle of radius sqrt(27) M", () => {
  near(SCHWARZSCHILD_CRITICAL_B, 5.196152422706632, 1e-15);
  const curve = criticalCurve({ a: 0, samples: 128, M: 1 });
  for (let i = 0; i < curve.alpha.length; i++) {
    near(Math.hypot(curve.alpha[i], curve.beta[i]), SCHWARZSCHILD_CRITICAL_B, 1e-12);
  }
  // Symmetric about the alpha axis at any inclination: the a = 0 circle does not care about theta.
  for (const deg of [90, 60, 17]) {
    const c = criticalCurve({ a: 0, inclinationDeg: deg, samples: 64 });
    for (let i = 0; i < c.alpha.length; i++) near(Math.abs(c.beta[i]), Math.abs(c.beta[c.beta.length - 1 - i]), 1e-12);
  }
});

test("the spherical photon orbits shrink to 3M as the spin vanishes", () => {
  for (const a of [0.1, 0.3, 0.5, 0.9, 0.998]) {
    const { prograde, retrograde } = sphericalOrbitRadii(a, 1);
    assert.ok(prograde > 1 && prograde < 3.0001, `prograde r = ${prograde} lies between the horizon and 3M`);
    assert.ok(retrograde >= 3 && retrograde < 4.0001, `retrograde r = ${retrograde} lies between 3M and 4M`);
  }
  const tiny = sphericalOrbitRadii(1e-14, 1);
  near(tiny.prograde, 3, 1e-9);
  near(tiny.retrograde, 3, 1e-9);
});

test("the Kerr curve flattens on the prograde edge without producing NaN", () => {
  const schwarzschild = criticalCurve({ a: 0, inclinationDeg: 90, samples: 200 });
  const extreme = criticalCurve({ a: 0.998, inclinationDeg: 90, samples: 200 });
  const alphaMin = Math.min(...extreme.alpha), alphaMax = Math.max(...extreme.alpha);
  const betaMax = Math.max(...extreme.beta.map(Math.abs));
  // The prograde side is dragged inward: the left edge moves inside the Schwarzschild circle's -sqrt(27).
  assert.ok(alphaMin > -SCHWARZSCHILD_CRITICAL_B, `alpha_min = ${alphaMin.toFixed(3)} lies inside -sqrt(27) = -5.196`);
  assert.ok(alphaMin > -3, `alpha_min = ${alphaMin.toFixed(3)} is pulled a long way in from the circle`);
  assert.ok(alphaMax > 6, `alpha_max = ${alphaMax.toFixed(3)} is outside it on the retrograde side`);
  // The vertical extent stays close to the Schwarzschild value; the flattening is horizontal.
  near(betaMax, SCHWARZSCHILD_CRITICAL_B, 0.2);
  assert.ok(alphaMax - alphaMin > 2 * SCHWARZSCHILD_CRITICAL_B - 2, "the curve is wider than the circle");
  // Every sampled spin and inclination is finite: the general formula divides by a and by r − M.
  for (const a of [0, 1e-9, 0.5, 0.9, 0.998, 0.9999]) {
    for (const inclinationDeg of [90, 60, 20]) {
      const c = criticalCurve({ a, inclinationDeg, samples: 80 });
      assert.ok(c.alpha.every(Number.isFinite), `alpha finite at a = ${a}, theta = ${inclinationDeg}`);
      assert.ok(c.beta.every(Number.isFinite), `beta finite at a = ${a}, theta = ${inclinationDeg}`);
    }
  }
  void schwarzschild;
});

test("the curve is closed and rejects nonsense options", () => {
  const c = criticalCurve({ a: 0.6, inclinationDeg: 75, samples: 40 });
  near(c.alpha[0], c.alpha[c.alpha.length - 1], 1e-12);
  near(c.beta[0], c.beta[c.beta.length - 1], 1e-12);
  assert.throws(() => criticalCurve({ inclinationDeg: 0 }));
  assert.throws(() => criticalCurve({ inclinationDeg: 120 }));
  assert.throws(() => criticalCurve({ samples: 2 }));
  assert.throws(() => sphericalOrbitRadii(NaN));
});

test("the shadow's angular size matches the closed form for both EHT targets", () => {
  near(shadowDiameterMicroarcsec({ massSolar: 6.5e9, distanceMpc: 16.8 }), 39.689, 0.01);
  near(shadowDiameterMicroarcsec({ massSolar: 4.0e6, distanceMpc: 0.008 }), 51.291, 0.01);
  // The function's own conversion agrees with the data module's.
  for (const target of EHT_TARGETS) {
    near(shadowDiameterMicroarcsec(target), predictedShadowUas(target), 1e-9);
  }
});

test("each sub-ring is demagnified by e^{-gamma} per half orbit", () => {
  near(subringDemagnification(1, { a: 0 }), Math.exp(-Math.PI), 1e-15);
  near(firstSubringFraction({ a: 0 }), 0.043214, 1e-5);
  // Successive rings are the same factor apart.
  const one = subringDemagnification(1, { a: 0 }), two = subringDemagnification(2, { a: 0 });
  near(two / one, one, 1e-14);
  assert.ok(subringDemagnification(3, { a: 0 }) < two);
  assert.throws(() => subringDemagnification(0));
  assert.throws(() => subringDemagnification(1.5));
});

test("every EHT target is sourced, finite and compared at the stated level", async () => {
  const { hasReferenceIdentifier } = await import("../js/science/references.mjs");
  assert.equal(EHT_TARGETS.length, 2);
  assert.equal(EHT_COMPARISONS.length, 2);
  for (const target of EHT_TARGETS) {
    assert.ok(hasReferenceIdentifier(target.source.reference), `${target.id} cites an identifier`);
    assert.match(target.source.retrieved, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(target.massSolar > 0 && target.distanceMpc > 0);
    assert.ok(target.ringSigmaUas > 0 && target.ringSigmaUas < target.ringDiameterUas);
    assert.ok(target.note.length > 40, `${target.id} carries a caveat`);
    for (const extra of target.additionalSources ?? []) assert.ok(hasReferenceIdentifier(extra.reference));
  }
  // The plan's two predictions, read as the comparison the figure shows.
  const m87 = comparisonFor(EHT_TARGETS.find((t) => t.id === "m87"));
  near(m87.predictedUas, 39.69, 0.01);
  near(m87.measuredUas, 42, 1e-12);
  const sgra = comparisonFor(EHT_TARGETS.find((t) => t.id === "sgra"));
  near(sgra.predictedUas, 51.29, 0.01);
  near(sgra.measuredUas, 51.8, 1e-12);
  // Both agree at the ~10 % level the caption claims, and the test says so rather than assuming it.
  for (const row of EHT_COMPARISONS) {
    assert.ok(Math.abs(row.differencePercent) < 10, `${row.label}: ${row.differencePercent.toFixed(1)} % is inside 10 %`);
  }
});
