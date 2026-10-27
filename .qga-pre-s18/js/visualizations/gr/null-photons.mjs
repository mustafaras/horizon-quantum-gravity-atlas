/**
 * Photons travelling along the null geodesics of the orbital-plane figure.
 *
 * The rays of js/physics.mjs (grNullTrajectory) are integrated with a fixed step, all launched together from the same
 * x, so the step index is a common clock: a plane wavefront of light released at once. Played back on that clock, the
 * captured rays fall into the hole early, the escaping ones leave the frame in about one crossing time, and the
 * near-critical ray lags because it winds around the photon sphere first. Nothing here is a decoration: the lag is the
 * integrator's own step count.
 *
 * Pure functions plus one canvas drawer; the panel (js/labs/null-geodesic-panel.jsx) owns the clock and the controls.
 */

/** Launch speed and step the panel passes to grNullTrajectory (its default speed is 4; the step resolves the plunge). */
export const NULL_PHOTON_SPEED = 4;
export const NULL_PHOTON_STEP = 0.0005;
/** The near-critical rays drawn with the heavier, haloed photon. */
export const NEAR_CRITICAL_FRACTIONS = [0.995, 1.005];
/** Length of the wake behind a photon, in units of the undeflected crossing time. */
export const TRAIL_CROSSINGS = 0.16;
/** Time over which a captured photon's absorption ring fades, in the same unit. */
export const ABSORB_CROSSINGS = 0.07;
const TRAIL_PIECES = 4;
const TRAIL_MAX_SEGMENTS = 72;

const insideFrame = (p, half) => Math.abs(p[0]) <= half && Math.abs(p[1]) <= half;

/** First and last point of a path inside the square frame |x|, |y| <= half, with one point of margin each side. */
export function frameWindow(points, half) {
  let i0 = 0, i1 = points.length - 1;
  while (i0 < i1 && !insideFrame(points[i0], half)) i0++;
  while (i1 > i0 && !insideFrame(points[i1], half)) i1--;
  return { i0: Math.max(0, i0 - 1), i1: Math.min(points.length - 1, i1 + 1) };
}

/** Time an undeflected ray takes to cross the frame, in integrator steps: the unit of the clock readout. */
export const crossingSteps = (half) => (2 * half) / (NULL_PHOTON_SPEED * NULL_PHOTON_STEP);

/**
 * rays: [{ f, captured, windings, points }] from grNullTrajectory. Returns the visible part of each path on a shared clock.
 * Step 0 is the first step at which any ray is inside the frame, i.e. the wavefront entering.
 */
export function buildPhotonRays(rays, half) {
  const windows = rays.map((r) => frameWindow(r.points, half));
  const start = Math.min(...windows.map((w) => w.i0));
  const photons = rays.map((r, k) => {
    const n = windows[k].i1 - start + 1;
    const x = new Float64Array(n), y = new Float64Array(n);
    for (let i = 0; i < n; i++) { x[i] = r.points[start + i][0]; y[i] = r.points[start + i][1]; }
    return { f: r.f, captured: r.captured, windings: r.windings, x, y, steps: n - 1 };
  });
  return { photons, span: Math.max(...photons.map((p) => p.steps)), crossing: crossingSteps(half) };
}

/** Where a photon is at clock `step`: its sample index, whether it is still flying, and the steps since it ended. */
export function photonState(photon, step) {
  const index = Math.min(Math.max(Math.floor(step), 0), photon.steps);
  const ended = step >= photon.steps;
  return { index, flying: !ended, sinceEnd: ended ? step - photon.steps : 0 };
}

/** Position at a fractional clock step, interpolated between samples so playback is smooth at any mass (few samples at small b_crit). */
export function photonPosition(photon, step) {
  const { index } = photonState(photon, step);
  const next = Math.min(index + 1, photon.steps);
  const u = Math.min(Math.max(step - index, 0), 1);
  return [photon.x[index] + (photon.x[next] - photon.x[index]) * u, photon.y[index] + (photon.y[next] - photon.y[index]) * u];
}

/** Index range [from, to] of the wake behind a photon at `index`, `length` steps long. */
export function trailRange(index, length) {
  return [Math.max(0, index - Math.round(length)), index];
}

/**
 * Advance the clock by `seconds` of wall time. The longest path takes `loopSeconds`; after it ends the last frame holds for
 * `holdSeconds` so the finished picture is readable, then the clock wraps to the wavefront entering again.
 */
export function advanceClock(step, seconds, span, { loopSeconds, holdSeconds }) {
  const rate = span / loopSeconds;
  const cycle = span + holdSeconds * rate;
  const next = step + seconds * rate;
  return next >= cycle ? next - cycle : next;
}

/** Clock value as a multiple of the undeflected crossing time, for the readout. */
export const clockInCrossings = (step, crossing) => step / crossing;

function stroke(ctx, photon, from, to, scene) {
  const stride = Math.max(1, Math.ceil((to - from) / TRAIL_MAX_SEGMENTS));
  ctx.beginPath();
  ctx.moveTo(scene.sx.map(photon.x[from]), scene.sy.map(photon.y[from]));
  for (let i = from + stride; i < to; i += stride) ctx.lineTo(scene.sx.map(photon.x[i]), scene.sy.map(photon.y[i]));
  ctx.lineTo(scene.sx.map(photon.x[to]), scene.sy.map(photon.y[to]));
  ctx.stroke();
}

/**
 * Draw the photons at clock `step` onto a context already sized to `scene` (device-pixel scaled).
 * palette: { escape, capture } CSS colours resolved from tokens by the caller.
 */
export function drawPhotons(ctx, scene, model, step, palette) {
  const { photons, crossing } = model;
  const { plot } = scene;
  ctx.clearRect(0, 0, scene.width, scene.height);
  ctx.save();
  ctx.beginPath();
  ctx.rect(plot.x, plot.y, plot.w, plot.h);
  ctx.clip();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const colourOf = (p) => (p.captured ? palette.capture : palette.escape);

  for (const p of photons) {
    const { index, flying, sinceEnd } = photonState(p, step);
    const near = NEAR_CRITICAL_FRACTIONS.includes(p.f);
    ctx.strokeStyle = colourOf(p);
    ctx.fillStyle = colourOf(p);
    const [from] = trailRange(index, TRAIL_CROSSINGS * crossing);
    // The wake is drawn in pieces of rising opacity: a fading tail without a gradient per frame.
    for (let k = 0; k < TRAIL_PIECES; k++) {
      const a = from + Math.floor(((index - from) * k) / TRAIL_PIECES);
      const b = from + Math.floor(((index - from) * (k + 1)) / TRAIL_PIECES);
      if (b <= a) continue;
      ctx.globalAlpha = 0.12 + (0.78 * (k + 1)) / TRAIL_PIECES;
      ctx.lineWidth = (near ? 2.4 : 1.8) * (0.55 + (0.45 * (k + 1)) / TRAIL_PIECES);
      stroke(ctx, p, a, b, scene);
    }
    const [hx, hy] = photonPosition(p, step);
    const px = scene.sx.map(hx), py = scene.sy.map(hy);
    if (flying) {
      if (near) { ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(px, py, 8, 0, 2 * Math.PI); ctx.fill(); }
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(px, py, near ? 4.2 : 3.3, 0, 2 * Math.PI); ctx.fill();
    } else if (p.captured && sinceEnd < ABSORB_CROSSINGS * crossing) {
      // Absorption: a ring leaving the point where the photon reached the horizon.
      const u = sinceEnd / (ABSORB_CROSSINGS * crossing);
      ctx.globalAlpha = 0.85 * (1 - u);
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px, py, 3 + 11 * u, 0, 2 * Math.PI); ctx.stroke();
    }
  }
  ctx.restore();
}
