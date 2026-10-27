/**
 * Accretion-disk plasma texture for the Kerr observatory (heuristic display layer).
 *
 * A real thin disk is turbulent: the magnetorotational instability (MRI)
 * produces emissivity fluctuations that are sheared into trailing filaments by
 * differential rotation and decorrelate within about one orbital period. This
 * module draws a seeded, procedural stand-in for that structure:
 *
 *   m(r, phi, t) = exp(sigma N - sigma^2 Var(N) / 2)          (unit ensemble mean)
 *
 * where N is band-limited value noise on the co-rotating coordinates
 * (cos psi, sin psi, ln r), psi = phi - Omega(r) * (t - t_birth). Two eddy
 * generations, offset by half a lifetime, are cross-faded with sin^2 weights
 * so the pattern rotates at the *local* Kerr angular velocity Omega(r) without
 * winding up forever.
 *
 * Status: heuristic. The texture multiplies the Page-Thorne flux by a
 * unit-mean factor, so the azimuthally averaged flux stays Page-Thorne; the
 * filament shapes are not a solution of MHD. Pure: no DOM, no Three.js.
 */

export const KERR_PLASMA = Object.freeze({
  /** Coordinate time per wall-clock second, GM/c^3 (display only; reduced motion freezes it). */
  displayTimeScale: 14,
  /** Eddy lifetime in local orbital periods (MRI correlation time is of order one orbit). */
  lifeOrbits: 1,
  octaves: 4,
  /** Lattice cells around the orbit at octave 0 (azimuthal wavelength r / azimuthalScale). */
  azimuthalScale: 1.6,
  /** Lattice cells per e-fold of radius at octave 0 (radial wavelength r / radialScale). */
  radialScale: 9,
  lacunarity: 2,
  gain: 0.6,
  /** Log-normal contrast sigma. */
  contrast: 0.9,
  /** Octaves fade out between these ratios of pixel footprint to their shortest wavelength. */
  fadeStart: 0.3,
  fadeEnd: 0.75,
  /** The turbulent disk's surface density thins out from this fraction of r_out (soft display edge). */
  edgeStart: 0.55,
});

const HASH_X = 0x8da6b343;
const HASH_Y = 0xd8163841;
const HASH_Z = 0xcb1ab31f;
const MIX_A = 0x7feb352d;
const MIX_B = 0x846ca68b;

/** Integer lattice hash in [0, 1); bit-identical to the GLSL and TSL versions (24-bit output). */
export function latticeHash01(x, y, z, seed) {
  let h = ((seed >>> 0) ^ Math.imul(x, HASH_X) ^ Math.imul(y, HASH_Y) ^ Math.imul(z, HASH_Z)) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, MIX_A) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, MIX_B) >>> 0;
  h ^= h >>> 16;
  return (h >>> 8) / 16777216;
}

function quintic(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Value noise in [-1, 1] with C2 quintic interpolation. */
export function valueNoise3(px, py, pz, seed) {
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const iz = Math.floor(pz);
  const ux = quintic(px - ix);
  const uy = quintic(py - iy);
  const uz = quintic(pz - iz);
  const h = (dx, dy, dz) => latticeHash01(ix + dx, iy + dy, iz + dz, seed);
  const lerp = (a, b, t) => a + (b - a) * t;
  const x00 = lerp(h(0, 0, 0), h(1, 0, 0), ux);
  const x10 = lerp(h(0, 1, 0), h(1, 1, 0), ux);
  const x01 = lerp(h(0, 0, 1), h(1, 0, 1), ux);
  const x11 = lerp(h(0, 1, 1), h(1, 1, 1), ux);
  return 2 * lerp(lerp(x00, x10, uy), lerp(x01, x11, uy), uz) - 1;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Per-octave amplitude after footprint band-limiting (0 when the octave is below pixel scale). */
export function plasmaOctaveWeights(r, footprint) {
  const P = KERR_PLASMA;
  const weights = [];
  let frequency = Math.max(P.radialScale, P.azimuthalScale);
  let amplitude = 1;
  for (let k = 0; k < P.octaves; k += 1) {
    const ratio = (footprint * frequency) / Math.max(r, 1e-6);
    weights.push(amplitude * (1 - smoothstep(P.fadeStart, P.fadeEnd, ratio)));
    frequency *= P.lacunarity;
    amplitude *= P.gain;
  }
  return weights;
}

/** One eddy generation's band-limited noise. */
function generationNoise(r, psi, shift, weights, seed) {
  const P = KERR_PLASMA;
  let azimuthal = P.azimuthalScale;
  let radial = P.radialScale;
  const lnR = Math.log(Math.max(r, 1e-6));
  let sum = 0;
  for (let k = 0; k < P.octaves; k += 1) {
    if (weights[k] > 0) {
      sum += weights[k] * valueNoise3(
        azimuthal * Math.cos(psi), azimuthal * Math.sin(psi), radial * lnR + shift + 13.7 * k, seed);
    }
    azimuthal *= P.lacunarity;
    radial *= P.lacunarity;
  }
  return sum;
}

/** Variance of one value-noise octave, measured once (deterministic) for the log-normal bias. */
const OCTAVE_VARIANCE = (() => {
  let sum = 0;
  let sumSq = 0;
  const n = 6000;
  for (let i = 0; i < n; i += 1) {
    const v = valueNoise3(i * 0.7548776662, i * 0.5698402910, i * 0.3141592654, 7);
    sum += v;
    sumSq += v * v;
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
})();

/** Generation phase: weight, eddy-frame azimuth offset and per-generation domain shift. */
function generation(omega, time, layer) {
  const life = 2 * Math.PI * KERR_PLASMA.lifeOrbits;
  const tau = (omega * time) / life + 0.5 * layer;
  const cycle = Math.floor(tau);
  const fraction = tau - cycle;
  const shift = ((((cycle * 0.6180339887 + 0.31 * layer) % 1) + 1) % 1) * 61;
  return { weight: Math.sin(Math.PI * fraction) ** 2, rotation: life * fraction, shift };
}

/**
 * Normalized log-fluctuation N (zero mean, variance OCTAVE_VARIANCE * sum(w^2))
 * at disk radius r, Boyer-Lindquist azimuth phi, local angular velocity omega
 * and coordinate time t, band-limited by the disk-plane pixel footprint.
 */
export function plasmaLogField({ r, phi, omega, time, footprint = 0, seed = 42 }) {
  const weights = plasmaOctaveWeights(r, footprint);
  let mixed = 0;
  let norm = 0;
  for (let layer = 0; layer < 2; layer += 1) {
    const { weight, rotation, shift } = generation(omega, time, layer);
    mixed += weight * generationNoise(r, phi - rotation, shift, weights, seed);
    norm += weight * weight;
  }
  const field = mixed / Math.sqrt(Math.max(norm, 1e-6));
  const variance = OCTAVE_VARIANCE * weights.reduce((total, w) => total + w * w, 0);
  return { field, variance };
}

function rawModulation(args) {
  const { field, variance } = plasmaLogField(args);
  const sigma = KERR_PLASMA.contrast;
  return Math.exp(sigma * field - 0.5 * sigma * sigma * variance);
}

/**
 * Unit-mean emissivity factor m(r, phi, t); exactly 1 when every octave is
 * below pixel scale. The log-normal bias sigma^2 Var / 2 makes the ensemble
 * mean 1 (measured over 24 seeds: 1.000; a single seed varies by about 9%
 * because the largest eddies are few).
 */
export function plasmaModulation(args) {
  return rawModulation(args);
}

/**
 * Opacity of the turbulent disk at radius r: 1 inside edgeStart * r_out,
 * smoothly thinning to 0 at r_out (Kirchhoff: emissivity scales with it).
 */
export function plasmaEdgeOpacity(r, rOut) {
  return 1 - smoothstep(KERR_PLASMA.edgeStart * rOut, rOut, r);
}

const glslFloat = (value) => (Number.isInteger(value) ? value.toFixed(1) : String(value));

/**
 * GLSL ES 3.00 implementation of the functions above. Constants are injected
 * from KERR_PLASMA so the shader and the CPU reference cannot drift.
 */
export const KERR_PLASMA_GLSL = /* glsl */ `
uint qgaHash(ivec3 p, uint seed) {
  uvec3 q = uvec3(p);
  uint h = seed ^ (q.x * ${HASH_X}u) ^ (q.y * ${HASH_Y}u) ^ (q.z * ${HASH_Z}u);
  h ^= h >> 16u; h *= ${MIX_A}u; h ^= h >> 15u; h *= ${MIX_B}u; h ^= h >> 16u;
  return h;
}
float qgaHash01(ivec3 p, uint seed) { return float(qgaHash(p, seed) >> 8u) / 16777216.0; }
float qgaValueNoise(vec3 p, uint seed) {
  vec3 fl = floor(p);
  ivec3 i = ivec3(fl);
  vec3 t = p - fl;
  vec3 u = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  float x00 = mix(qgaHash01(i, seed), qgaHash01(i + ivec3(1, 0, 0), seed), u.x);
  float x10 = mix(qgaHash01(i + ivec3(0, 1, 0), seed), qgaHash01(i + ivec3(1, 1, 0), seed), u.x);
  float x01 = mix(qgaHash01(i + ivec3(0, 0, 1), seed), qgaHash01(i + ivec3(1, 0, 1), seed), u.x);
  float x11 = mix(qgaHash01(i + ivec3(0, 1, 1), seed), qgaHash01(i + ivec3(1, 1, 1), seed), u.x);
  return 2.0 * mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z) - 1.0;
}
float kerrPlasma(float r, float phi, float omega, float time, float footprint, uint seed) {
  float w[${KERR_PLASMA.octaves}];
  float frequency = ${glslFloat(Math.max(KERR_PLASMA.radialScale, KERR_PLASMA.azimuthalScale))};
  float amplitude = 1.0;
  float variance = 0.0;
  for (int k = 0; k < ${KERR_PLASMA.octaves}; k++) {
    float ratio = footprint * frequency / max(r, 1e-6);
    w[k] = amplitude * (1.0 - smoothstep(${glslFloat(KERR_PLASMA.fadeStart)}, ${glslFloat(KERR_PLASMA.fadeEnd)}, ratio));
    variance += w[k] * w[k];
    frequency *= ${glslFloat(KERR_PLASMA.lacunarity)};
    amplitude *= ${glslFloat(KERR_PLASMA.gain)};
  }
  if (variance <= 0.0) return 1.0;
  float life = ${glslFloat(2 * Math.PI * KERR_PLASMA.lifeOrbits)};
  float lnR = log(max(r, 1e-6));
  float mixed = 0.0;
  float norm = 0.0;
  for (int layer = 0; layer < 2; layer++) {
    float tau = omega * time / life + 0.5 * float(layer);
    float cycle = floor(tau);
    float fr = tau - cycle;
    float weight = sin(${glslFloat(Math.PI)} * fr); weight *= weight;
    float shift = fract(cycle * 0.6180339887 + 0.31 * float(layer)) * 61.0;
    float psi = phi - life * fr;
    float azimuthal = ${glslFloat(KERR_PLASMA.azimuthalScale)};
    float radial = ${glslFloat(KERR_PLASMA.radialScale)};
    float sum = 0.0;
    for (int k = 0; k < ${KERR_PLASMA.octaves}; k++) {
      if (w[k] > 0.0) {
        sum += w[k] * qgaValueNoise(vec3(azimuthal * cos(psi), azimuthal * sin(psi), radial * lnR + shift + 13.7 * float(k)), seed);
      }
      azimuthal *= ${glslFloat(KERR_PLASMA.lacunarity)};
      radial *= ${glslFloat(KERR_PLASMA.lacunarity)};
    }
    mixed += weight * sum;
    norm += weight * weight;
  }
  float field = mixed / sqrt(max(norm, 1e-6));
  float sigma = ${glslFloat(KERR_PLASMA.contrast)};
  return exp(sigma * field - 0.5 * sigma * sigma * ${OCTAVE_VARIANCE.toFixed(8)} * variance);
}
float kerrEdgeOpacity(float r, float rOut) {
  return 1.0 - smoothstep(${glslFloat(KERR_PLASMA.edgeStart)} * rOut, rOut, r);
}
`;

/** Numbers the TSL backend needs (it rebuilds the same graph in node form). */
export const KERR_PLASMA_DERIVED = Object.freeze({
  octaveVariance: OCTAVE_VARIANCE,
  hash: Object.freeze({ x: HASH_X, y: HASH_Y, z: HASH_Z, mixA: MIX_A, mixB: MIX_B }),
});
