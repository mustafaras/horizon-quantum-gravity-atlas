/**
 * Curvature engine dynamics (moved out of mod-gr.jsx by S07, unchanged in behaviour): bound bodies on exact precessing Kepler
 * orbits, the numerically integrated plunge body, the Schwarzschild null-geodesic light fan, Peters radiation reaction with the
 * ISCO hand-off, and the projection of each orbital plane into scene coordinates.
 *
 * Pure: no three.js, no DOM. The physics comes in as `P` (js/physics.mjs, `window.QGA_PHYSICS`); the scene's reactions (a flash,
 * a ripple) go out through hooks, so the module imports and runs in Node.
 */

/** Initial light-fan ray state for impact parameter `b`. */
export const makeRay = (b, newton = false) => ({ x: -7.6, y: b, vx: newton ? 5.2 : 4, vy: 0, b, trail: [], near: false });

/** Resets a ray that was captured or left the scene. */
export function relaunchRay(q, newton) {
  q.x = -7.6; q.y = q.b; q.vx = newton ? 5.2 : 4; q.vy = 0; q.trail = []; q.near = false;
}

/** Syncs the simulated bodies with the editable parameter list by uid; live sliders win over radiation-reaction drift. */
export function syncSimBodies(st, params) {
  let dirty = st.sim.length !== params.length;
  for (let i = 0; !dirty && i < params.length; i++) {
    if (st.sim[i].uid !== params[i].uid) { dirty = true; break; }
    const sm = st.sim[i];
    if (sm.lastParamA !== params[i].a) { sm.a = params[i].a; sm.lastParamA = params[i].a; }
    if (sm.lastParamE !== params[i].e) { sm.e = params[i].e; sm.lastParamE = params[i].e; }
    sm.r = params[i].r; sm.hex = params[i].hex;
  }
  if (!dirty) return;
  st.sim = params.map((p, i) => {
    const old = st.sim.find((s) => s.uid === p.uid);
    if (old) {
      old.a = p.a; old.e = p.e; old.r = p.r; old.hex = p.hex;
      old.lastParamA = p.a; old.lastParamE = p.e;
      return old;
    }
    return {
      uid: p.uid, free: p.free, a: p.a, e: p.e, r: p.r, hex: p.hex,
      lastParamA: p.a, lastParamE: p.e,
      theta: p.phase != null ? p.phase : i * 2.4, peri: p.peri || 0,
      incl: p.incl || 0, node: i * 0.7,
      x: p.free ? p.x0 : 0, y: p.free ? p.y0 : 0,
      vx: p.free ? p.vx0 : 0, vy: p.free ? p.vy0 : 0,
      X: 0, Y: 0, Z: 0, prevX: 0, prevY: 0,
      x0: p.x0, y0: p.y0, vx0: p.vx0, vy0: p.vy0,
      trail: [],
    };
  });
}

/**
 * Advances bodies and light rays by `dt`. `cfg`: { P, mu, c2, newton, dt, speed, lightSpeed, raysOn, spin, capRay, hAt }.
 * `hooks`: { flash(x, y, z, tokenName), ripple() } (the scene's reactions to a capture or a photon-sphere graze).
 */
export function stepDynamics(st, cfg, hooks) {
  const { P, mu, c2, newton, dt, speed, lightSpeed, raysOn, spin, capRay, hAt } = cfg;
  const sub = 6, sdt = Math.min(dt, 0.04) / sub * speed;
  const TS = 2.2; // overall visual time-scale
  const capR = P.grCaptureRadius(mu, c2);
  const rs = 2 * mu / c2;
  const GM = mu;
  const J = spin * mu * mu / c2 * 10;   // x10 visual amplification (disclosed)
  for (let s = 0; s < sub; s++) {
    for (const p of st.sim) {
      if (p.free) {
        // numerically integrated post-Newtonian plunge; captured at r = 3GM/c^2
        P.grPlungeStep(p, mu, c2, TS * sdt);
        if (Math.hypot(p.x, p.y) < capR) {
          hooks.flash(p.x, hAt(p.x, p.y) + 0.25, p.y, "pigment-violet-77");
          hooks.ripple();
          p.x = p.x0; p.y = p.y0; p.vx = p.vx0; p.vy = p.vy0; p.trail = [];
        }
        continue;
      }
      // exact precessing Kepler orbit: advance true anomaly by the area law
      //   dtheta/dt = h / r^2,  h = sqrt(mu a (1 - e^2)),  r = a (1 - e^2) / (1 + e cos theta)
      // and advance the perihelion by the exact GR rate dvarpi = 6 pi mu / [c^2 a (1 - e^2)] per orbit
      // (distributed smoothly: dvarpi = (dvarpi/2pi) dtheta). Newtonian view drops the advance -> closed ellipse.
      const p_ = p.a * (1 - p.e * p.e);
      const rr3 = p_ / (1 + p.e * Math.cos(p.theta));
      const h = Math.sqrt(mu * p_);
      const dtheta = TS * h / (rr3 * rr3) * sdt;
      p.theta += dtheta;
      if (!newton) {
        p.peri += (6 * Math.PI * mu / (c2 * p_)) / (2 * Math.PI) * dtheta;
        if (J > 0) {
          // Lense-Thirring node drift: dOmega = 4 pi J / [c^2 a^3 (1 - e^2)^{3/2}] per orbit
          p.node += (4 * Math.PI * J / (c2 * Math.pow(p.a, 3) * Math.pow(1 - p.e * p.e, 1.5))) / (2 * Math.PI) * dtheta;
        }
      }
      const ang = p.theta + p.peri;
      p.x = rr3 * Math.cos(ang);
      p.y = rr3 * Math.sin(ang);
    }
    if (!raysOn) continue;
    for (const q of st.rays) {
      const qr2 = q.x * q.x + q.y * q.y, qr = Math.sqrt(qr2) + 1e-6;
      if (newton) {
        if (qr > 0.4) {
          // Newtonian corpuscular deflection: half the relativistic value
          const af = -GM / (qr2 * qr);
          q.vx += af * q.x * sdt * 60; q.vy += af * q.y * sdt * 60;
          const vn = Math.hypot(q.vx, q.vy); q.vx *= 5.2 / vn; q.vy *= 5.2 / vn;
          q.x += q.vx * sdt * 0.96; q.y += q.vy * sdt * 0.96;
        }
      } else {
        // exact Schwarzschild null geodesic: d^2x/dlambda^2 = -(3/2) rs L^2 x / r^5, stepped at the same affine rate as the
        // bodies (a x60 multiplier crossed the scene in ~4 frames, outside the integrator's convergence radius).
        P.grNullStep(q, rs, sdt * lightSpeed);
      }
      if (qr < (newton ? capRay : 1.1 * rs)) {
        hooks.flash(q.x, hAt(q.x, q.y) + 0.15, q.y, "pigment-red-71-c18");
        relaunchRay(q, newton);
        continue;
      }
      if (qr < 2.4 * rs + 0.5 && !q.near) {
        q.near = true;
        hooks.flash(q.x, hAt(q.x, q.y) + 0.15, q.y, "pigment-azure-92-c04");   // photon-sphere graze
      }
      if (qr > 2.4 * rs + 1.2) q.near = false;
      if (qr > 9.6 || q.trail.length > 900) relaunchRay(q, newton);
    }
  }
}

/** Peters orbit-averaged radiation reaction (amplified) with the ISCO hand-off to the plunge integrator. */
export function applyRadiationReaction(st, { P, isco, dt, speed }) {
  if (!(dt > 0)) return;
  for (const p of st.sim) {
    if (p.free) continue;
    const d = P.grPetersDerivatives(p.a, p.e, 0.5);
    p.a += d.da * dt * speed;
    p.e = Math.max(0, p.e + d.de * dt * speed);
    if (p.a * (1 - p.e) < 1.15 * isco) {
      // inside the ISCO the bound-ellipse model ends: hand the body to the numerical plunge integrator
      // with its current kinematic state
      p.free = true;
      p.x = p.X; p.y = p.Y;
      const inv = 1 / Math.max(dt, 1e-3);
      p.vx = (p.X - p.prevX) * inv; p.vy = (p.Y - p.prevY) * inv;
      p.x0 = 5.5; p.y0 = 2.2; p.vx0 = 1.3; p.vy0 = -0.1;   // re-injection state
    }
  }
}

/** Projects each orbital-plane state to scene coordinates (inclination and node). */
export function projectBodies(st) {
  for (const p of st.sim) {
    p.prevX = p.X; p.prevY = p.Y;
    if (p.free) { p.X = p.x; p.Y = p.y; p.Z = 0; continue; }
    const ty = p.y * Math.cos(p.incl), zc = p.y * Math.sin(p.incl);
    const cn = Math.cos(p.node), sn = Math.sin(p.node);
    p.X = p.x * cn - ty * sn;
    p.Y = p.x * sn + ty * cn;
    p.Z = zc;
  }
}

/** Appends the current position of every body and ray to its trail (capped at `trailN`). */
export function appendTrails(st, { hAt, trailN, raysOn }) {
  for (const p of st.sim) {
    p.trail.push([p.X, hAt(p.X, p.Y) + 0.16 + p.Z, p.Y]);
    if (p.trail.length > trailN) p.trail.shift();
  }
  if (!raysOn) return;
  for (const q of st.rays) {
    q.trail.push([q.x, hAt(q.x, q.y) + 0.12, q.y]);
    if (q.trail.length > trailN) q.trail.shift();
  }
}
