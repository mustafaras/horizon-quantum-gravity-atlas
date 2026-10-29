// Schwarzschild radial tides in SI units. The sign convention is the tidal tensor E;
// the relative acceleration is -E times the separation, hence radial stretching.
import { G, C, SOLAR_MASS } from "./constants.mjs";
export { G, C, SOLAR_MASS };

function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be positive and finite`);
}
export function schwarzschildRadius(mass) {
  positive(mass, 'mass');
  return 2 * G * mass / C ** 2;
}
export function tidalEigenvalues(mass, radius) {
  positive(mass, 'mass'); positive(radius, 'radius');
  const k = G * mass / radius ** 3;
  return { radial: -2 * k, transverse: k, unit: 's^-2' };
}
export function spaghettificationRadius(mass, bodyLength, maxAccel) {
  positive(mass, 'mass'); positive(bodyLength, 'bodyLength'); positive(maxAccel, 'maxAccel');
  return Math.cbrt(2 * G * mass * bodyLength / maxAccel);
}

/** Radial Schwarzschild free fall from rest at r0, parametrised by eta and proper time.
 * The centre is exact for a radial geodesic; the small ring follows the linear
 * Newtonian tidal/geodesic-deviation approximation, with no self-gravity or forces.
 * RK4 integrates two independent separation axes against the exact centre trajectory.
 */
export function integrateTidalRing({ mass, startRadius, endRadius, bodyLength = 2, count = 64, steps = 800 }) {
  positive(mass, 'mass'); positive(startRadius, 'startRadius'); positive(endRadius, 'endRadius'); positive(bodyLength, 'bodyLength');
  if (startRadius <= schwarzschildRadius(mass)) throw new RangeError('release from rest requires an exterior start');
  if (!(startRadius > endRadius && endRadius > 0)) throw new RangeError('require startRadius > endRadius > 0');
  if (!Number.isInteger(count) || count < 3 || !Number.isInteger(steps) || steps < 1) throw new RangeError('invalid particle count or integration steps');
  const etaEnd = Math.acos(2 * endRadius / startRadius - 1);
  const scale = Math.sqrt(startRadius ** 3 / (8 * G * mass));
  const h = etaEnd / steps;
  let state = [1, 0, 1, 0];
  const derivative = (eta, y) => {
    const r = startRadius * (1 + Math.cos(eta)) / 2;
    const dt = scale * (1 + Math.cos(eta));
    const k = G * mass / r ** 3;
    return [y[1] * dt, 2 * k * y[0] * dt, y[3] * dt, -k * y[2] * dt];
  };
  const snapshots = [];
  for (let i = 0; i <= steps; i++) {
    const eta = i * h;
    const radius = startRadius * (1 + Math.cos(eta)) / 2;
    snapshots.push({ radius, properTime: scale * (eta + Math.sin(eta)), radialScale: state[0], transverseScale: state[2] });
    if (i === steps) break;
    const k1 = derivative(eta, state);
    const k2 = derivative(eta + h / 2, state.map((v, j) => v + h * k1[j] / 2));
    const k3 = derivative(eta + h / 2, state.map((v, j) => v + h * k2[j] / 2));
    const k4 = derivative(eta + h, state.map((v, j) => v + h * k3[j]));
    state = state.map((v, j) => v + h * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]) / 6);
  }
  const ring = (index) => {
    if (!Number.isInteger(index) || index < 0 || index > steps) throw new RangeError('invalid snapshot index');
    const s = snapshots[index], half = bodyLength / 2;
    return Array.from({ length: count }, (_, i) => {
      const angle = 2 * Math.PI * i / count;
      return { radial: half * Math.cos(angle) * s.radialScale, transverse: half * Math.sin(angle) * s.transverseScale };
    });
  };
  return { snapshots, ring };
}

/** Proper radial length from the horizon to r on the equatorial Schwarzschild slice. */
export function flammProperDistance(radius, rs) {
  positive(rs, 'rs');
  if (!Number.isFinite(radius) || radius < rs) throw new RangeError('radius must be at or above the horizon');
  return Math.sqrt(radius * (radius - rs)) + rs * Math.acosh(Math.sqrt(radius / rs));
}
