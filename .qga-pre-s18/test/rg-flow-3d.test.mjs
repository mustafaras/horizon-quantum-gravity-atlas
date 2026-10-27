import test from "node:test";
import assert from "node:assert/strict";
import {
  RG_FLOW_3D_VIEW_ID, RG_FLOW_3D_DEFAULTS, RG_VALIDITY_G,
  rgBetaR, rgFlow3dRhs, rgFlow3dFixedPoints, integrateStreamline3d,
  seedStreamlines3d, separatrixCurves3d, registerRgFlow3dProvenance,
  rgFlow3dExportMetadata, massAnomalousDimension,
} from "../js/science/rg-flow-3d.mjs";
import { getVisualizationProvenance } from "../js/science/provenance.mjs";
import { rgBeta, rgFixedPoints } from "../js/physics.mjs";

test("r-direction beta uses the disclosed anomalous dimension", () => {
  const g = 1.0, r = 0.5;
  const gamma = massAnomalousDimension(g);
  assert.equal(rgBetaR("qcd", g, r), (2 - gamma) * r);
  assert.equal(rgBetaR("qcd", g, 0), 0); // r = 0 is invariant
});

test("g-direction of the 3-D RHS is exactly the shared beta function", () => {
  const params = { nf: 5, a: 1, b: 1, gStar: 1 };
  for (const model of ["qed", "qcd", "gaussian", "linear", "asymptotic-safety"]) {
    const d = rgFlow3dRhs([1.1, 0.3], { model, params });
    assert.equal(d[0], rgBeta(model, 1.1, params));
  }
});

test("fixed points match the shared analytic fixed points with r = 0", () => {
  const params = { nf: 3, a: 1, b: 1, gStar: 1 };
  const shared = rgFixedPoints("qcd", params);
  const field = rgFlow3dFixedPoints("qcd", params);
  assert.equal(field.length, shared.length);
  for (let i = 0; i < shared.length; i++) {
    assert.equal(field[i].g, shared[i].g);
    assert.equal(field[i].r, 0);
    assert.equal(field[i].stabilityG, shared[i].stability);
    assert.equal(field[i].lambdaG, shared[i].derivative);
  }
});

test("streamlines are deterministic and finite", () => {
  const a = integrateStreamline3d({ g0: 1.0, r0: 0.2, direction: 1, model: "qcd" });
  const b = integrateStreamline3d({ g0: 1.0, r0: 0.2, direction: 1, model: "qcd" });
  assert.deepEqual(a.points, b.points);
  assert.ok(a.points.length > 2);
  for (const p of a.points) {
    assert.ok(Number.isFinite(p.g) && Number.isFinite(p.r) && Number.isFinite(p.t));
  }
});

test("t increases toward the UV and decreases toward the IR", () => {
  const uv = integrateStreamline3d({ g0: 1, r0: 0, direction: 1, model: "qcd" });
  const ir = integrateStreamline3d({ g0: 1, r0: 0, direction: -1, model: "qcd" });
  assert.ok(uv.points[uv.points.length - 1].t > 0);
  assert.ok(ir.points[ir.points.length - 1].t < 0);
});

test("streamlines terminate at the validity wall, never past it silently", () => {
  const run = integrateStreamline3d({ g0: 3.4, r0: 0, direction: 1, model: "qed" });
  assert.equal(run.terminated, "validity-boundary");
  const last = run.points[run.points.length - 1];
  assert.ok(Math.abs(last.g) >= RG_VALIDITY_G - 1e-6);
  assert.equal(RG_VALIDITY_G, Math.sqrt(4 * Math.PI));
});

test("invalid seeds terminate honestly", () => {
  const bad = integrateStreamline3d({ g0: NaN, r0: 0 });
  assert.deepEqual(bad.points, []);
  assert.equal(bad.terminated, "invalid-seed");
});

test("seeded streamlines are deterministic and bounded in count", () => {
  const a = seedStreamlines3d({ model: "qcd", seed: 42, count: 16 });
  const b = seedStreamlines3d({ model: "qcd", seed: 42, count: 16 });
  assert.deepEqual(a, b);
  assert.equal(a.length, 16);
  for (const run of a) {
    assert.ok(run.points.length >= 1);
    assert.ok(Number.isFinite(run.seed.g) && Number.isFinite(run.seed.r));
  }
});

test("separatrices emanate from fixed points on the r = 0 axis", () => {
  const curves = separatrixCurves3d({ model: "qcd" });
  assert.ok(curves.length > 0);
  for (const c of curves) {
    assert.ok(c.points.length >= 1);
    assert.ok(Math.abs(c.points[0].r) < 1e-2, "starts on/near the r = 0 axis");
    assert.ok(Number.isFinite(c.fixedPoint.g));
  }
});

test("provenance registers the field as effective with a validity statement", () => {
  registerRgFlow3dProvenance();
  registerRgFlow3dProvenance();
  const rec = getVisualizationProvenance(RG_FLOW_3D_VIEW_ID);
  assert.equal(rec.status, "effective");
  assert.ok(rec.validity.some((v) => /sqrt|boundary/i.test(v)));
});

test("export metadata reports fixed points and the log scale", () => {
  const meta = rgFlow3dExportMetadata(
    { rgModel: "qcd", rgNf: 5, rgA: 1, rgB: 1, rgGStar: 1 },
    { kind: "cpu-samples", streamlines: 40 },
  );
  assert.equal(meta.rgFlowField3d.view, RG_FLOW_3D_VIEW_ID);
  assert.match(meta.rgFlowField3d.logScale, /ln mu/);
  assert.equal(meta.rgFlowField3d.validityBoundaryG, RG_VALIDITY_G);
  assert.ok(Array.isArray(meta.rgFlowField3d.fixedPoints));
  assert.equal(meta.rgFlowField3d.runtime.streamlines, 40);
});
