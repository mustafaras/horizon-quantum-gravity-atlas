const G = 6.67430e-11;
const C = 299792458;
const HBAR = 1.054571817e-34;
const KB = 1.380649e-23;
const SOLAR_MASS = 1.98847e30;

export function schwarzschildRadius(massSolar) {
  return (2 * G * massSolar * SOLAR_MASS) / (C * C);
}

export function kerrGeometry(spin) {
  const a = Math.min(0.998, Math.max(0, Number(spin) || 0));
  const rPlus = 1 + Math.sqrt(Math.max(0, 1 - a * a));
  const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  const rIsco = 3 + z2 - Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
  const rIscoRetrograde = 3 + z2 + Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
  const rPhoton = 2 * (1 + Math.cos((2 / 3) * Math.acos(-a)));
  const rPhotonRetrograde = 2 * (1 + Math.cos((2 / 3) * Math.acos(a)));
  const surfaceGravity = (rPlus - 1) / (rPlus * rPlus + a * a);
  return {
    a, rPlus, rErgoEquator: 2, rIsco, rIscoRetrograde, rPhoton, rPhotonRetrograde,
    surfaceGravity, temperatureFactor: surfaceGravity / 0.25,
  };
}

export function hawkingTemperature(massSolar, spin = 0) {
  const geometry = kerrGeometry(spin);
  return (HBAR * C ** 3 / (8 * Math.PI * G * (massSolar * SOLAR_MASS) * KB)) * geometry.temperatureFactor;
}

export function blackHoleEntropyAreaUnits(massSolar, spin = 0) {
  const geometry = kerrGeometry(spin);
  return 1.05e77 * massSolar * massSolar * (geometry.rPlus / 2);
}

export function seededRng(seed) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const PARTICLES = {
  "e-": { q: -1, le: 1, lmu: 0 }, "e+": { q: 1, le: -1, lmu: 0 },
  "mu-": { q: -1, le: 0, lmu: 1 }, "mu+": { q: 1, le: 0, lmu: -1 },
  q: { q: 2 / 3, le: 0, lmu: 0 }, qbar: { q: -2 / 3, le: 0, lmu: 0 },
  ph: { q: 0, le: 0, lmu: 0 },
};

export function qftConservation(in1, in2, out1, out2) {
  const particles = [in1, in2, out1, out2].map((id) => PARTICLES[id]);
  if (particles.some((particle) => !particle)) return { ok: false, reason: "Unknown particle." };
  const [a, b, c, d] = particles;
  const delta = (key) => a[key] + b[key] - c[key] - d[key];
  return {
    ok: Math.abs(delta("q")) < 1e-9 && Math.abs(delta("le")) < 1e-9 && Math.abs(delta("lmu")) < 1e-9,
    deltaQ: delta("q"), deltaLe: delta("le"), deltaLmu: delta("lmu"),
  };
}
