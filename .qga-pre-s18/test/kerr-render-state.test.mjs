/*
 * Kerr observatory render model (Prompt 04): numerical and contract tests.
 *
 * The shaders cannot run in Node, so the CPU reference tracer in
 * kerr-observatory.mjs mirrors their equations line by line. These tests pin
 * that mirror to the Prompt 03 science core, and pin every number the UI and
 * the export show to the science APIs.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

import {
  KERR_DISK_MODELS,
  KERR_ENUMS,
  KERR_FOCUS_KINDS,
  KERR_LIMITS,
  KERR_OBSERVATORY_PROVENANCE,
  KERR_QUALITY_BUDGETS,
  KERR_RENDER_CONSTANTS,
  KERR_STATE_DEFAULTS,
  KERR_STATE_VERSION,
  KERR_VIEW_ID,
  KerrTemporalAccumulator,
  assertNoNonFinite,
  buildKerrRenderState,
  classifyKerrTrace,
  kerrAccumulationKey,
  kerrExportMetadata,
  kerrFeatureExplanation,
  kerrFocusPlan,
  kerrJitter,
  kerrLocalDirection,
  kerrObserverCoefficients,
  kerrObserverFromCamera,
  kerrQualityBudget,
  kerrRayConstants,
  kerrVolumeReason,
  locateKerrFeature,
  normalizeKerrState,
  pickKerrPixel,
  registerKerrObservatoryProvenance,
  sampleDiskTable,
  shadeDiskHit,
  shadeKerrReferenceRay,
  traceKerrReferenceRay,
} from "../js/visualizations/kerr/kerr-observatory.mjs";
import {
  STARFIELD_MAX_FOOTPRINT_RAD,
  generateStarCatalog,
  renderStarfield,
  starfieldGradients,
  starfieldLod,
} from "../js/visualizations/kerr/starfield-texture.mjs";
import {
  kerrConservedQuantities,
  kerrHorizonRadii,
  kerrIsco,
  kerrPhotonSphere,
  traceKerrRay,
} from "../js/science/kerr.mjs";
import { kerrCircularOrbit, kerrTotalRedshiftFactor } from "../js/science/accretion-disk.mjs";
import { getVisualizationProvenance, listVisualizationProvenance } from "../js/science/provenance.mjs";
import { SCIENTIFIC_STATUS_LABELS } from "../js/science/contracts.mjs";

const LENS = { tanHalfFov: Math.tan((20 * Math.PI) / 180), aspect: 1.6 };

function stateFor({ a = 0.9, incl = 75, dist = 40, quality = "balanced", disk = "page-thorne", detail = "ultra" } = {}) {
  const normalized = normalizeKerrState({
    bhSpin: a, bhInclination: incl, bhObserverDistance: dist, bhDiskModel: disk, bhRenderQuality: quality,
  });
  const budget = kerrQualityBudget(quality, { detail3d: detail });
  return buildKerrRenderState(normalized, { budget });
}

/* ---------- state ---------- */

test("v2 defaults are turbulent and v1 defaults preserve old shared links", () => {
  const n = normalizeKerrState({ bhMass: 1, bhSpin: 0.7 });
  assert.equal(n.aStar, 0.7);
  assert.equal(n.inclinationDeg, KERR_STATE_DEFAULTS.bhInclination);
  assert.equal(n.observerDistance, KERR_STATE_DEFAULTS.bhObserverDistance);
  assert.equal(n.diskModel, KERR_STATE_DEFAULTS.bhDiskModel);
  assert.equal(n.quality, KERR_STATE_DEFAULTS.bhRenderQuality);
  assert.equal(n.exposureEv, 0);
  assert.equal(n.annotations, false);
  const old = normalizeKerrState({ bhStateVersion: 1, bhSpin: 0.7 });
  assert.equal(old.diskModel, "page-thorne");
  assert.equal(old.annotations, true);
});

test("state is clamped to the documented domain and enums fall back safely", () => {
  const n = normalizeKerrState({
    bhSpin: -7, bhInclination: 500, bhObserverDistance: 1, bhExposure: 99,
    bhDiskModel: "nope", bhRenderQuality: "nope", bhAnnotations: false,
  });
  assert.equal(n.aStar, KERR_LIMITS.spin[0]);
  assert.equal(n.inclinationDeg, KERR_LIMITS.inclinationDeg[1]);
  assert.equal(n.observerDistance, KERR_LIMITS.observerDistance[0]);
  assert.equal(n.exposureEv, KERR_LIMITS.exposureEv[1]);
  assert.equal(n.diskModel, KERR_STATE_DEFAULTS.bhDiskModel);
  assert.equal(n.quality, KERR_STATE_DEFAULTS.bhRenderQuality);
  assert.equal(n.annotations, false);
  assert.throws(() => normalizeKerrState({ bhSpin: Number.NaN }), TypeError);
});

test("a future state version is ignored rather than misread", () => {
  const n = normalizeKerrState({ bhStateVersion: KERR_STATE_VERSION + 1, bhInclination: 33, bhRenderQuality: "ultra" });
  assert.equal(n.inclinationDeg, KERR_STATE_DEFAULTS.bhInclination);
  assert.equal(n.quality, KERR_STATE_DEFAULTS.bhRenderQuality);
});

function loadStateRuntime(search) {
  const source = fs.readFileSync(new URL("../js/state.jsx", import.meta.url), "utf8");
  const window = {
    location: { search, pathname: "/", hash: "", href: "http://x/" },
    QGA_PHYSICS: { sanitizeCausalState: (state) => state },
  };
  const context = vm.createContext({ window, localStorage: { getItem: () => null }, URLSearchParams, URL });
  vm.runInContext(`${source}\n;globalThis.__api = { qgaReadState, qgaStateSearch, QGA_DEFAULT_STATE };`, context);
  return context.__api;
}

test("URL state: old link, versioned round trip, future version, junk values", () => {
  const api = loadStateRuntime("");
  const old = api.qgaReadState("?view=bh&bhm=1&bhs=0.7&seed=42");
  assert.equal(old.bhSpin, 0.7);
  assert.equal(old.bhInclination, 75);
  assert.equal(old.bhDiskModel, "page-thorne");
  assert.equal(old.bhAnnotations, true);
  assert.match(api.qgaStateSearch(old), /bhv=1/);

  const next = { ...old, bhSpin: -0.9, bhInclination: 60, bhObserverDistance: 25, bhDiskModel: "newtonian",
    bhRenderQuality: "ultra", bhExposure: 1.5, bhAnnotations: false };
  const search = api.qgaStateSearch(next);
  assert.match(search, /bhv=1/);
  const back = api.qgaReadState(search);
  for (const key of ["bhSpin", "bhInclination", "bhObserverDistance", "bhDiskModel", "bhRenderQuality", "bhExposure", "bhAnnotations"]) {
    assert.equal(back[key], next[key], key);
  }

  const current = api.qgaReadState("?view=bh&bhv=2&bhs=0.5");
  assert.equal(current.bhDiskModel, "page-thorne-turbulent");
  assert.equal(current.bhAnnotations, false);
  assert.match(api.qgaStateSearch(current), /bhv=2/);
  const future = api.qgaReadState("?view=bh&bhv=3&bhi=33&bhq=ultra&bhs=0.5");
  assert.equal(future.bhInclination, 75);
  assert.equal(future.bhRenderQuality, "balanced");
  assert.equal(future.bhSpin, 0.5);

  const junk = api.qgaReadState("?view=bh&bhi=abc&bhd=Infinity&bhdm=evil&bha=maybe&bhs=-5");
  assert.equal(junk.bhInclination, 75);
  assert.equal(junk.bhObserverDistance, 40);
  assert.equal(junk.bhDiskModel, "page-thorne");
  assert.equal(junk.bhAnnotations, true);
  assert.equal(junk.bhSpin, -0.998);
});

/* ---------- budgets ---------- */

test("quality budgets are documented and monotone in every dimension", () => {
  const order = KERR_ENUMS.bhRenderQuality.map((key) => KERR_QUALITY_BUDGETS[key]);
  for (const field of ["maxSteps", "temporalSamples", "samplesPerFrame"]) {
    for (let i = 1; i < order.length; i += 1) assert.ok(order[i][field] >= order[i - 1][field], field);
  }
  for (let i = 1; i < order.length; i += 1) assert.ok(order[i].stepK < order[i - 1].stepK, "finer step at higher quality");
});

test("budget folds to the device tier, scales with the governor and drops history under reduced motion", () => {
  assert.equal(kerrQualityBudget("ultra", { detail3d: "low" }).effective, "performance");
  assert.equal(kerrQualityBudget("ultra", { detail3d: "medium" }).effective, "balanced");
  assert.equal(kerrQualityBudget("performance", { detail3d: "ultra" }).effective, "performance");
  const full = kerrQualityBudget("balanced", { detail3d: "medium" });
  const governed = kerrQualityBudget("balanced", { detail3d: "medium", governorRaySteps: 48 });
  assert.ok(governed.maxSteps < full.maxSteps && governed.maxSteps >= 64);
  assert.equal(governed.stepK, full.stepK);
  const reduced = kerrQualityBudget("ultra", { detail3d: "ultra", reducedMotion: true });
  assert.equal(reduced.temporalSamples, 1);
  assert.ok(reduced.samplesPerFrame >= 4);
});

test("the volume gate names the reason it stopped, in gate order", () => {
  const capable = kerrQualityBudget("balanced", { detail3d: "medium" });
  const gated = kerrQualityBudget("balanced", { detail3d: "low" });
  assert.equal(capable.volume, true);
  assert.equal(gated.volume, false);
  // The backend gate outranks every other reason: the compute path has no
  // volumetric pass at all, so it can never read as a quality choice.
  assert.equal(kerrVolumeReason({ backend: "webgpu", softwareClamped: true, budget: gated }), "webgpu");
  // A CPU rasterizer is clamped to the low tier, so it must not read as the
  // user having chosen the performance budget.
  assert.equal(kerrVolumeReason({ softwareClamped: true, budget: gated, corona: true, jets: true }), "software");
  assert.equal(kerrVolumeReason({ budget: gated, corona: true, jets: true }), "quality");
  assert.equal(kerrVolumeReason({ budget: capable, corona: false, jets: false }), "toggles");
  assert.equal(kerrVolumeReason({ budget: capable, corona: true, jets: false }), "on");
  assert.equal(kerrVolumeReason({ budget: capable, corona: false, jets: true }), "on");
  // A missing budget is not a licence to claim the layer is running.
  assert.equal(kerrVolumeReason({ corona: true, jets: true }), "quality");
  assert.equal(kerrVolumeReason(), "quality");
});

/* ---------- observer frame and conserved quantities ---------- */

test("observer coefficients reproduce kerrConservedQuantities for arbitrary directions", () => {
  for (const [a, incl, dist] of [[0, 75, 40], [0.9, 30, 25], [-0.9, 85, 60], [0.998, 5, 15]]) {
    const rs = stateFor({ a, incl, dist });
    const { r0, theta0 } = rs.observer;
    for (const direction of [[-0.97, -0.1, 0.2], [-0.99, 0.05, -0.1], [-1, 0, 0], [-0.9, 0.3, 0.3]]) {
      const norm = Math.hypot(...direction);
      const unit = direction.map((c) => c / norm);
      const mine = kerrRayConstants(rs, unit);
      const ref = kerrConservedQuantities({ aStar: a, r: r0, theta: theta0, direction: unit });
      assert.ok(Math.abs(mine.E - ref.E) < 1e-10, `E a=${a}`);
      assert.ok(Math.abs(mine.Lz - ref.Lz) < 1e-9, `Lz a=${a}`);
      assert.ok(Math.abs(mine.Q - ref.Q) < 1e-8 * Math.max(1, Math.abs(ref.Q)), `Q a=${a} ${mine.Q} vs ${ref.Q}`);
      const delta = r0 * r0 - 2 * r0 + a * a;
      assert.ok(Math.abs(mine.vr - delta * ref.pr) < 1e-8 * Math.max(1, Math.abs(mine.vr)), "vr = Delta p_r");
      assert.ok(Math.abs(mine.vu + Math.sin(theta0) * ref.ptheta) < 1e-9, "u' = -sin(theta) p_theta");
    }
  }
});

test("initial data satisfies Carter's first integrals R(r0) = r'^2 and Theta_u(u0) = u'^2", () => {
  for (const a of [0, 0.9, -0.9]) {
    const rs = stateFor({ a });
    const { r0, u0 } = rs.observer;
    const c = kerrRayConstants(rs, kerrLocalDirection(0.3, 0.2, LENS.tanHalfFov, LENS.aspect));
    const P = c.E * (r0 * r0 + a * a) - a * c.Lz;
    const K = (c.Lz - a * c.E) ** 2 + c.Q;
    const R = P * P - (r0 * r0 - 2 * r0 + a * a) * K;
    assert.ok(Math.abs(R - c.vr * c.vr) < 1e-6 * R);
    const Theta = c.Q - u0 * u0 * (c.Q + c.Lz ** 2 - a * a * c.E ** 2) - a * a * c.E ** 2 * u0 ** 4;
    assert.ok(Math.abs(Theta - c.vu * c.vu) < 1e-9 * Math.max(1, Theta));
  }
});

test("camera position maps to the observer (r, theta, phi) with the spin axis along +y", () => {
  const o = kerrObserverFromCamera([0, 40, 0.0001]);
  assert.ok(o.theta0 < 1e-3);
  const e = kerrObserverFromCamera([40, 0, 0]);
  assert.ok(Math.abs(e.theta0 - Math.PI / 2) < 1e-12 && Math.abs(e.phi0) < 1e-12 && e.r0 === 40);
  assert.throws(() => kerrObserverFromCamera([0, 0, 0]), RangeError);
});

/* ---------- science-derived tables ---------- */

test("disk table agrees with the science core at every node and has a zero-torque inner edge", () => {
  for (const [a, model] of [[0, "page-thorne"], [0.9, "page-thorne"], [-0.9, "newtonian"]]) {
    const { disk } = stateFor({ a, disk: model });
    assert.equal(disk.rIn, kerrIsco(a, { prograde: true }));
    assert.equal(disk.data[2], 0, "flux vanishes at the ISCO");
    let peak = 0;
    for (const i of [0, 7, 64, 130, 255]) {
      const r = disk.rIn + (disk.rOut - disk.rIn) * (i / 255) ** 2;
      const orbit = kerrCircularOrbit(a, r, { prograde: true });
      assert.ok(Math.abs(disk.data[i * 4] - orbit.omega) < 1e-6 * Math.abs(orbit.omega) + 1e-9);
      assert.ok(Math.abs(disk.data[i * 4 + 1] - orbit.timeComponent) < 1e-6 * orbit.timeComponent);
      assert.ok(disk.data[i * 4 + 2] >= 0 && disk.data[i * 4 + 2] <= 1);
    }
    for (let i = 0; i < 256; i += 1) peak = Math.max(peak, disk.data[i * 4 + 2]);
    assert.equal(peak, 1);
    assert.ok(disk.data[255 * 4 + 3] < KERR_RENDER_CONSTANTS.displayPeakKelvin);
  }
});

test("disk shading equals the science g-factor: g_cam = g_total / E", () => {
  for (const a of [0, 0.9, -0.9]) {
    const rs = stateFor({ a });
    for (const x of [0.06, -0.06]) {
      const c = kerrRayConstants(rs, kerrLocalDirection(x, 0.1, LENS.tanHalfFov, LENS.aspect));
      for (const i of [30, 90, 160, 220]) {
        const r = rs.disk.rIn + (rs.disk.rOut - rs.disk.rIn) * (i / 255) ** 2;
        const mine = shadeDiskHit(rs, r, c.E, c.Lz);
        const ref = kerrTotalRedshiftFactor({ aStar: a, r, prograde: true, energy: c.E, lz: c.Lz });
        assert.ok(Math.abs(mine.g - ref.total / c.E) < 1e-5 * mine.g, `g a=${a} r=${r}`);
        assert.ok(mine.intensity >= 0 && mine.rgb.every(Number.isFinite));
      }
    }
  }
  // A photon that the science core rejects (E - Omega L_z <= 0) contributes nothing.
  const rs = stateFor({ a: 0.9 });
  const dead = shadeDiskHit(rs, 4, 1, 1e3);
  assert.equal(dead.intensity, 0);
});

test("approaching emission is hotter and brighter than receding emission (beaming)", () => {
  const rs = stateFor({ a: 0.9 });
  const r = 6;
  const side = (sign) => {
    const c = kerrRayConstants(rs, kerrLocalDirection(sign * 0.3, 0, LENS.tanHalfFov, LENS.aspect));
    return shadeDiskHit(rs, r, c.E, c.Lz);
  };
  const a = side(+1);
  const b = side(-1);
  const [bright, dim] = a.g > b.g ? [a, b] : [b, a];
  assert.ok(bright.g > dim.g && bright.kelvin > dim.kelvin && bright.intensity > 2 * dim.intensity);
});

/* ---------- tracer vs science ---------- */

test("reference tracer matches traceKerrRay: classification, disk radius, escape direction", () => {
  for (const a of [0, 0.9, -0.9]) {
    const rs = stateFor({ a, quality: "ultra" });
    for (const [x, y] of [[0.5, 0.2], [0.2, -0.1], [0.0, 0.3], [-0.35, 0.05]]) {
      const direction = kerrLocalDirection(x, y, LENS.tanHalfFov, LENS.aspect);
      const mine = traceKerrReferenceRay(rs, direction);
      const ref = traceKerrRay({
        aStar: a, r: rs.observer.r0, theta: rs.observer.theta0, direction,
        diskInner: rs.radii.rIsco, diskOuter: KERR_RENDER_CONSTANTS.diskOuter, rEscape: 1e4,
      });
      if (ref.status === "captured") {
        assert.equal(mine.status, "captured", `a=${a} (${x},${y})`);
      } else if (ref.status === "disk") {
        const first = mine.hits.find((h) => h.inDisk);
        assert.ok(first, `a=${a} (${x},${y}) missed the disk`);
        assert.ok(Math.abs(first.r - ref.state[1]) < 2e-3 * ref.state[1], `r_hit ${first.r} vs ${ref.state[1]}`);
      }
      if (ref.status !== "captured") {
        const free = traceKerrRay({
          aStar: a, r: rs.observer.r0, theta: rs.observer.theta0, direction, rEscape: 1e4, maxSteps: 400000,
        });
        if (free.status === "escaped" && mine.status === "escaped") {
          const [, , theta, phi] = free.state;
          const d = [Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)];
          const dot = d[0] * mine.escapeDirection[0] + d[1] * mine.escapeDirection[1] + d[2] * mine.escapeDirection[2];
          assert.ok(Math.acos(Math.min(1, dot)) < 4e-3, `escape direction a=${a} (${x},${y})`);
        }
      }
    }
  }
});

test("tracer is deterministic and finite over a pixel grid at extreme spin, inclination and distance", () => {
  for (const [a, incl, dist] of [[0.998, 3, 12], [-0.998, 89, 120], [0.5, 45, 40]]) {
    const rs = stateFor({ a, incl, dist, quality: "performance" });
    let first = null;
    for (let pass = 0; pass < 2; pass += 1) {
      const hash = [];
      for (let j = 0; j < 9; j += 1) {
        for (let i = 0; i < 16; i += 1) {
          const x = (i / 15) * 2 - 1;
          const y = (j / 8) * 2 - 1;
          const t = traceKerrReferenceRay(rs, kerrLocalDirection(x, y, LENS.tanHalfFov, LENS.aspect));
          const s = shadeKerrReferenceRay(rs, t);
          for (const v of [...s.rgb, s.transmit, ...t.escapeDirection, t.rMin, t.E, t.Lz, t.Q]) {
            assert.ok(Number.isFinite(v), `non-finite at a=${a} (${x},${y})`);
          }
          hash.push(s.rgb[0], t.status, t.steps);
        }
      }
      if (pass === 0) first = hash; else assert.deepEqual(hash, first);
    }
  }
});

test("budget exhaustion is reported as unresolved, never as a drawn ring", () => {
  const rs = stateFor({ a: 0, quality: "performance" });
  const t = traceKerrReferenceRay(rs, kerrLocalDirection(0, 0.28, LENS.tanHalfFov, LENS.aspect), { maxSteps: 12 });
  assert.equal(t.status, "unresolved");
  assert.equal(classifyKerrTrace(rs, t).kind, "photon-region");
  assert.equal(shadeKerrReferenceRay(rs, t).escaped, false);
});

/* ---------- image-level physics ---------- */

function halfImageLuminance(rs, incl) {
  void incl;
  let left = 0;
  let right = 0;
  for (let j = 0; j < 40; j += 1) {
    for (let i = 0; i < 80; i += 1) {
      const x = ((i + 0.5) / 80) * 2 - 1;
      const y = 1 - ((j + 0.5) / 40) * 2;
      const t = traceKerrReferenceRay(rs, kerrLocalDirection(x, y, LENS.tanHalfFov, LENS.aspect));
      const lum = shadeKerrReferenceRay(rs, t).rgb.reduce((s, c) => s + c, 0);
      if (x < 0) left += lum; else right += lum;
    }
  }
  return { left, right, asymmetry: (right - left) / (right + left) };
}

test("approaching/receding brightness asymmetry appears with inclination and vanishes face-on", () => {
  const inclined = halfImageLuminance(stateFor({ a: 0.9, incl: 75, quality: "performance" }), 75);
  assert.ok(Math.abs(inclined.asymmetry) > 0.2, `inclined asymmetry ${inclined.asymmetry}`);
  const retro = halfImageLuminance(stateFor({ a: -0.9, incl: 75, quality: "performance" }), 75);
  assert.ok(Math.abs(retro.asymmetry) > 0.2);
  assert.equal(Math.sign(retro.asymmetry), Math.sign(inclined.asymmetry), "the disk rotates the same way for both spin signs");
  const faceOn = halfImageLuminance(stateFor({ a: 0.9, incl: 3, quality: "performance" }), 3);
  assert.ok(Math.abs(faceOn.asymmetry) < 0.08, `face-on asymmetry ${faceOn.asymmetry}`);
});

test("opaque disk terminates at the first hit; translucent disk shows higher image orders", () => {
  const translucent = stateFor({ a: 0.9, incl: 80, quality: "balanced", disk: "page-thorne" });
  const opaque = stateFor({ a: 0.9, incl: 80, quality: "balanced", disk: "page-thorne-opaque" });
  assert.equal(opaque.transmittance, 0);
  assert.equal(translucent.transmittance, KERR_DISK_MODELS["page-thorne"].transmittance);
  let multi = 0;
  let dimmer = 0;
  for (let j = 0; j < 60; j += 1) {
    for (let i = 0; i < 100; i += 1) {
      const x = ((i + 0.5) / 100) * 2 - 1;
      const y = 1 - ((j + 0.5) / 60) * 2;
      const dir = kerrLocalDirection(x, y, LENS.tanHalfFov, LENS.aspect);
      const t = traceKerrReferenceRay(translucent, dir);
      const hits = t.hits.filter((h) => h.inDisk);
      if (hits.length >= 2) {
        multi += 1;
        const a = shadeKerrReferenceRay(translucent, t).rgb[0];
        const b = shadeKerrReferenceRay(opaque, t).rgb[0];
        if (a > b) dimmer += 1;
        assert.equal(shadeKerrReferenceRay(opaque, t).transmit, 0);
      }
    }
  }
  assert.ok(multi > 20, `expected multiply-imaged pixels, found ${multi}`);
  assert.ok(dimmer > 0, "higher orders add light only when the disk is translucent");
});

/* ---------- picking and focus ---------- */

test("every focus kind can be located and classified from the image", () => {
  const rs = stateFor({ a: 0.9, incl: 80, dist: 40, quality: "balanced" });
  for (const kind of KERR_FOCUS_KINDS) {
    const point = locateKerrFeature(rs, kind, LENS);
    assert.ok(Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1);
    const picked = pickKerrPixel(rs, point.x, point.y, LENS);
    assert.equal(picked.kind, kind, `${kind} located at (${point.x}, ${point.y}) classified as ${picked.kind}`);
  }
  const far = pickKerrPixel(rs, 0.98, 0.9, LENS);
  assert.ok(["sky", "direct-disk", "photon-region"].includes(far.kind));
});

test("explanations carry exact science values and honest labels", () => {
  for (const a of [0, 0.9, -0.9]) {
    const rs = stateFor({ a });
    for (const kind of [...KERR_FOCUS_KINDS, "sky"]) {
      const info = kerrFeatureExplanation(kind, rs, { order: 1, r: 7.5, g: 1.2 });
      assert.ok(SCIENTIFIC_STATUS_LABELS.includes(info.status), info.status);
      assert.ok(info.title && info.summary && info.formula);
      for (const row of info.values) assert.ok(row.every((cell) => !/NaN|Infinity/.test(String(cell))));
    }
    const disk = kerrFeatureExplanation("direct-disk", rs);
    assert.ok(disk.values.some(([, v]) => v === kerrIsco(a, { prograde: true }).toFixed(4)));
    const horizon = kerrFeatureExplanation("horizon", rs);
    assert.ok(horizon.values.some(([, v]) => v === kerrHorizonRadii(a).rPlus.toFixed(4)));
    const photon = kerrFeatureExplanation("photon-region", rs);
    assert.ok(photon.values.some(([, v]) => v === kerrPhotonSphere(a, { prograde: false }).toFixed(4)));
  }
  assert.match(kerrFeatureExplanation("higher-order", stateFor(), { order: 2 }).summary, /no ring is thickened/);
  assert.ok(kerrFocusPlan("horizon").distance >= KERR_LIMITS.observerDistance[0]);
  assert.equal(kerrFocusPlan("sky").strength, 0);
});

/* ---------- temporal accumulation ---------- */

test("accumulation resets on camera, spin, mass, inclination, resolution, backend, quality and model changes", () => {
  const base = {
    aStar: 0.9, massLog10: 1, inclinationDeg: 75,
    observer: { r0: 40, theta0: 1.3, phi0: 0.2 }, resolution: [800, 450],
    backend: "webgl2", quality: "balanced", diskModel: "page-thorne",
    budget: { maxSteps: 224, samplesPerFrame: 1 },
  };
  const key = kerrAccumulationKey(base);
  assert.equal(kerrAccumulationKey({ ...base }), key);
  const variants = {
    spin: { aStar: 0.91 }, mass: { massLog10: 1.05 }, inclination: { inclinationDeg: 76 },
    distance: { observer: { ...base.observer, r0: 41 } }, polar: { observer: { ...base.observer, theta0: 1.31 } },
    azimuth: { observer: { ...base.observer, phi0: 0.21 } }, width: { resolution: [801, 450] },
    height: { resolution: [800, 451] }, backend: { backend: "webgpu" }, quality: { quality: "ultra" },
    model: { diskModel: "newtonian" }, steps: { budget: { maxSteps: 112, samplesPerFrame: 1 } },
  };
  const acc = new KerrTemporalAccumulator(4);
  assert.deepEqual(acc.update(key), { reset: true, frame: 0, converged: false });
  assert.equal(acc.update(key).frame, 1);
  for (const [name, patch] of Object.entries(variants)) {
    const k = kerrAccumulationKey({ ...base, ...patch });
    assert.notEqual(k, key, `${name} must change the key`);
    const step = acc.update(k);
    assert.equal(step.reset, true, `${name} must reset history`);
    assert.equal(step.frame, 0);
    acc.update(key);
    acc.update(key);
  }
});

test("accumulation converges at the temporal-sample budget and then holds", () => {
  const acc = new KerrTemporalAccumulator(3);
  const seen = [acc.update("k"), acc.update("k"), acc.update("k"), acc.update("k"), acc.update("k")];
  assert.deepEqual(seen.map((s) => s.frame), [0, 1, 2, 2, 2]);
  assert.deepEqual(seen.map((s) => s.converged), [false, false, true, true, true]);
  assert.equal(acc.resets, 1);
  const single = new KerrTemporalAccumulator(1);
  assert.equal(single.update("a").converged, true);
});

test("sub-pixel jitter is the deterministic Halton (2,3) sequence inside the pixel", () => {
  assert.deepEqual(kerrJitter(0), [0, 1 / 3 - 0.5]);
  assert.deepEqual(kerrJitter(0), kerrJitter(0));
  for (let i = 0; i < 64; i += 1) {
    const [x, y] = kerrJitter(i);
    assert.ok(x >= -0.5 && x < 0.5 && y >= -0.5 && y < 0.5);
  }
  assert.equal(new Set(Array.from({ length: 16 }, (_, i) => kerrJitter(i).join())).size, 16);
});

/* ---------- starfield ---------- */

test("starfield is deterministic per seed, differs across seeds and keeps a full mip chain", () => {
  const options = { seed: 7, width: 256, height: 128, stars: 300 };
  const a = renderStarfield(options);
  const b = renderStarfield(options);
  const c = renderStarfield({ ...options, seed: 8 });
  assert.equal(a.checksum, b.checksum);
  assert.deepEqual(a.levels[0].data, b.levels[0].data);
  assert.notEqual(a.checksum, c.checksum);
  assert.deepEqual(generateStarCatalog({ seed: 1, count: 5 }), generateStarCatalog({ seed: 1, count: 5 }));
  assert.equal(a.levels.length, 9);
  assert.deepEqual([a.levels.at(-1).width, a.levels.at(-1).height], [1, 1]);
  const decode = (byte) => (byte / 255) ** 2 * a.vmax;
  const last = a.levels.at(-1).data;
  for (let c2 = 0; c2 < 3; c2 += 1) {
    const expected = a.meanLinear[c2];
    assert.ok(Math.abs(decode(last[c2]) - expected) <= 0.05 * expected + 2e-3, `solid-angle mean channel ${c2}`);
  }
});

test("starfield filtering: LOD is monotone, clamped, and gradients stay finite and latitude-independent", () => {
  let previous = -1;
  for (const footprint of [0, 1e-4, 1e-3, 1e-2, 5e-2, STARFIELD_MAX_FOOTPRINT_RAD, 1]) {
    const lod = starfieldLod(footprint, 2048);
    assert.ok(lod >= previous);
    previous = lod;
  }
  assert.equal(starfieldLod(1, 2048), starfieldLod(STARFIELD_MAX_FOOTPRINT_RAD, 2048));
  const g = starfieldGradients(0.02);
  assert.ok(Number.isFinite(g.du) && Number.isFinite(g.dv) && g.du > 0 && g.dv > g.du);
  assert.deepEqual(starfieldGradients(10), starfieldGradients(STARFIELD_MAX_FOOTPRINT_RAD));
});

/* ---------- provenance and export ---------- */

test("view is registered once in the shared provenance registry with a legal status", () => {
  const first = registerKerrObservatoryProvenance();
  const second = registerKerrObservatoryProvenance();
  assert.equal(first, second);
  assert.equal(getVisualizationProvenance(KERR_VIEW_ID), first);
  assert.ok(SCIENTIFIC_STATUS_LABELS.includes(first.status));
  assert.equal(listVisualizationProvenance().filter((entry) => entry.id === KERR_VIEW_ID).length, 1);
  for (const field of ["model", "assumptions", "validity", "numericalMethod", "references"]) {
    assert.ok(KERR_OBSERVATORY_PROVENANCE[field] && KERR_OBSERVATORY_PROVENANCE[field].length > 0, field);
  }
  assert.ok(first.assumptions.some((line) => /DISPLAY-SCALED/.test(line)));
});

test("export carries exact finite numbers equal to the science APIs, plus provenance", () => {
  for (const a of [0, 0.9, -0.9]) {
    const payload = kerrExportMetadata(
      { bhMass: 1, bhSpin: a, bhInclination: 70 },
      { backend: "webgl2", frames: 4, resets: 2, resolution: [800, 450], detail3d: "medium" },
    );
    assert.equal(payload.observatory.radii.rPlus, kerrHorizonRadii(a).rPlus);
    assert.equal(payload.observatory.radii.rIsco, kerrIsco(a, { prograde: true }));
    assert.equal(payload.observatory.radii.rPhotonRetro, kerrPhotonSphere(a, { prograde: false }));
    assert.equal(payload.provenance.registryId, KERR_VIEW_ID);
    assert.ok(SCIENTIFIC_STATUS_LABELS.includes(payload.provenance.status));
    assert.equal(payload.numerics.backend, "webgl2");
    assert.equal(payload.numerics.budget.maxSteps, KERR_QUALITY_BUDGETS.balanced.maxSteps);
    assert.ok(payload.observatory.disk.tableChecksum > 0);
    assert.doesNotThrow(() => assertNoNonFinite(payload));
    assert.ok(!/NaN|Infinity/.test(JSON.stringify(payload)));
  }
  assert.throws(() => assertNoNonFinite({ a: [1, Number.NaN] }), RangeError);
  assert.throws(() => assertNoNonFinite({ a: new Float32Array([1, Infinity]) }), RangeError);
});

test("disk tables interpolate like the shaders (continuity at the sqrt-radius node spacing)", () => {
  const rs = stateFor({ a: 0.9 });
  let previous = sampleDiskTable(rs.disk, rs.disk.rIn);
  for (let i = 1; i <= 400; i += 1) {
    const r = rs.disk.rIn + ((rs.disk.rOut - rs.disk.rIn) * i) / 400;
    const row = sampleDiskTable(rs.disk, r);
    assert.ok(Number.isFinite(row.omega) && row.omega > 0);
    assert.ok(Math.abs(row.fluxRel - previous.fluxRel) < 0.2);
    previous = row;
  }
});
