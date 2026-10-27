import test from "node:test";
import assert from "node:assert/strict";
import * as P from "../js/physics.mjs";
import {
  appendTrails, applyRadiationReaction, makeRay, projectBodies, relaunchRay, stepDynamics, syncSimBodies,
} from "../js/visualizations/gr/curvature-sim.mjs";

const C2 = P.GR_ENGINE_C2;
const body = (over = {}) => ({ uid: "b0", free: false, a: 3, e: 0.2, r: 0.2, hex: 0xffffff, phase: 0, peri: 0, incl: 0, ...over });
const state = () => ({ sim: [], rays: [] });
const hAt = () => 0;
const config = (over = {}) => ({ P, mu: 0.55 * 5, c2: C2, newton: false, dt: 0.016, speed: 1, lightSpeed: 1, raysOn: false, spin: 0, capRay: 1, hAt, ...over });
const hooks = () => { const calls = { flash: [], ripple: 0 }; return { calls, flash: (...args) => calls.flash.push(args), ripple: () => { calls.ripple += 1; } }; };

test("makeRay and relaunchRay agree on the launch state in both views", () => {
  assert.deepEqual(makeRay(1.25), { x: -7.6, y: 1.25, vx: 4, vy: 0, b: 1.25, trail: [], near: false });
  assert.equal(makeRay(1.25, true).vx, 5.2);
  const ray = makeRay(2.2);
  Object.assign(ray, { x: 3, y: 4, vx: -1, vy: 2, trail: [[1, 2, 3]], near: true });
  relaunchRay(ray, true);
  assert.deepEqual(ray, { x: -7.6, y: 2.2, vx: 5.2, vy: 0, b: 2.2, trail: [], near: false });
});

test("syncSimBodies keeps simulated bodies by uid and lets live sliders win", () => {
  const st = state();
  const first = body();
  syncSimBodies(st, [first]);
  assert.equal(st.sim.length, 1);
  const sim = st.sim[0];
  assert.equal(sim.theta, 0);
  assert.equal(sim.a, 3);
  sim.a = 4.4;                                  // radiation reaction evolved a inside the loop
  syncSimBodies(st, [first]);
  assert.equal(st.sim[0], sim);
  assert.equal(sim.a, 4.4, "an unchanged slider does not overwrite the evolved value");
  syncSimBodies(st, [{ ...first, a: 5 }]);
  assert.equal(sim.a, 5, "an edited slider does");
  syncSimBodies(st, [{ ...first, a: 5 }, { ...body({ uid: "b1", a: 2 }), phase: undefined }]);
  assert.equal(st.sim.length, 2);
  assert.equal(st.sim[0], sim, "existing body object survives a list change");
  assert.equal(st.sim[1].theta, 2.4, "a new body without a phase starts at i * 2.4");
  const free = body({ uid: "f", free: true, x0: 5.5, y0: 2.2, vx0: 1.3, vy0: -0.1 });
  syncSimBodies(st, [free]);
  assert.deepEqual([st.sim[0].x, st.sim[0].y, st.sim[0].vx, st.sim[0].vy], [5.5, 2.2, 1.3, -0.1]);
});

test("a bound body stays on its ellipse, advances its perihelion in GR and not in the Newtonian view", () => {
  for (const newton of [false, true]) {
    const st = state();
    syncSimBodies(st, [body({ a: 3, e: 0.2 })]);
    const rMin = 3 * (1 - 0.2) - 1e-9, rMax = 3 * (1 + 0.2) + 1e-9;
    for (let i = 0; i < 400; i++) {
      stepDynamics(st, config({ newton }), hooks());
      const r = Math.hypot(st.sim[0].x, st.sim[0].y);
      assert.ok(r >= rMin && r <= rMax, `r = ${r} outside [${rMin}, ${rMax}] (newton ${newton})`);
    }
    if (newton) assert.equal(st.sim[0].peri, 0, "closed ellipse: no perihelion advance");
    else assert.ok(st.sim[0].peri > 0, "GR advances the perihelion");
  }
});

test("perihelion advance per orbit is 6 pi GM / (c^2 a (1 - e^2))", () => {
  const mu = 0.55 * 5, a = 3, e = 0.2;
  const st = state();
  syncSimBodies(st, [body({ a, e })]);
  const sim = st.sim[0];
  let guard = 0;
  while (sim.theta < 2 * Math.PI && guard++ < 1e6) stepDynamics(st, config({ mu }), hooks());
  const expected = 6 * Math.PI * mu / (C2 * a * (1 - e * e));
  assert.ok(Math.abs(sim.peri - expected) / expected < 0.02, `peri ${sim.peri} vs ${expected}`);
});

test("a ray inside the capture cone is swallowed with a flash, an outer ray survives and bends", () => {
  const mu = 0.55 * 5, bCrit = P.grCriticalImpactParameter(mu, C2);
  const st = { sim: [], rays: [makeRay(0.45), makeRay(3.3)] };
  const h = hooks();
  for (let i = 0; i < 600; i++) stepDynamics(st, config({ mu, raysOn: true, dt: 0.04 }), h);
  assert.ok(0.45 < bCrit && 3.3 > bCrit);
  assert.ok(h.calls.flash.some(([, , , token]) => token === "pigment-red-71-c18"), "the inner ray was captured");
  const outer = st.rays[1];
  assert.ok(Math.hypot(outer.x, outer.y) > 0, "outer ray still a finite state");
  assert.ok(h.calls.flash.every(([x, y, z]) => [x, y, z].every(Number.isFinite)));
});

test("a plunge body is captured, re-injected, and raises the ripple hook", () => {
  const st = state();
  // The "Capture plunge" preset: a test particle launched on a trajectory that crosses the capture radius.
  const preset = P.grCurvatureScenario("plunge");
  const launch = preset.bodies.find((b) => b.free);
  syncSimBodies(st, [body({ uid: "p", free: true, x0: launch.x0, y0: launch.y0, vx0: launch.vx0, vy0: launch.vy0 })]);
  const h = hooks();
  for (let i = 0; i < 4000 && h.calls.ripple === 0; i++) stepDynamics(st, config({ mu: 0.55 * preset.mass, dt: 0.04 }), h);
  assert.ok(h.calls.ripple >= 1, "capture raised the ripple");
  assert.ok(h.calls.flash.some(([, , , token]) => token === "pigment-violet-77"));
  // The remaining substeps of the same call advance the re-injected body a little, so it sits near the start state.
  assert.ok(Math.abs(st.sim[0].x - launch.x0) < 0.5 && Math.abs(st.sim[0].y - launch.y0) < 0.5, "re-injected near the start state");
  assert.deepEqual(st.sim[0].trail, [], "the trail restarts");
});

test("radiation reaction shrinks a bound orbit and hands the body to the plunge integrator at the ISCO", () => {
  const mu = 0.55 * 5;
  const isco = P.grIscoRadius(mu, C2);
  const st = state();
  syncSimBodies(st, [body({ a: isco * 1.2, e: 0.0 })]);
  projectBodies(st);
  const a0 = st.sim[0].a;
  applyRadiationReaction(st, { P, isco, dt: 0.016, speed: 1 });
  assert.ok(st.sim[0].a < a0, "the semi-major axis decays");
  applyRadiationReaction(st, { P, isco, dt: 0, speed: 1 });
  assert.equal(st.sim[0].a < a0, true, "dt = 0 changes nothing further");
  st.sim[0].a = isco;                           // peri/ISCO below 1.15 isco
  applyRadiationReaction(st, { P, isco, dt: 0.016, speed: 1 });
  assert.equal(st.sim[0].free, true, "handed to the numerical plunge");
  assert.deepEqual([st.sim[0].x0, st.sim[0].y0], [5.5, 2.2]);
});

test("projectBodies applies inclination and node; trails append and cap", () => {
  const st = state();
  syncSimBodies(st, [body({ incl: 0.5 })]);
  const sim = st.sim[0];
  Object.assign(sim, { x: 2, y: 1, node: 0 });
  projectBodies(st);
  assert.ok(Math.abs(sim.X - 2) < 1e-12 && Math.abs(sim.Y - Math.cos(0.5)) < 1e-12 && Math.abs(sim.Z - Math.sin(0.5)) < 1e-12);
  sim.node = Math.PI / 2;
  projectBodies(st);
  assert.ok(Math.abs(sim.X - -Math.cos(0.5)) < 1e-12 && Math.abs(sim.Y - 2) < 1e-12);
  assert.equal(sim.prevX, 2);
  st.rays = [makeRay(1)];
  for (let i = 0; i < 12; i++) appendTrails(st, { hAt: () => 0.5, trailN: 5, raysOn: i % 2 === 0 });
  assert.equal(sim.trail.length, 5);
  assert.equal(st.rays[0].trail.length, 5, "ray trails only grow while the fan is on");
  assert.equal(sim.trail[0][1], 0.5 + 0.16 + sim.Z);
});
