/**
 * Reference line integral convolution (S18): the CPU twin of the GPU flow silk in lic-field.mjs, used by the tests and to check the shader.
 *
 * A pixel's value is the Hann-weighted mean of a white-noise field sampled along the streamline through it, L steps each way. The noise is not a
 * texture and not Math.random: it is the PCG hash that TSL's `hash` uses (three.webgpu.js), of the integer cell the point is in, so the CPU and
 * the GPU read the same noise from the same cell and a seed reproduces a picture.
 *
 * The animated phase is a ripple: the kernel is multiplied by 1 + a cos(2 pi (i / RIPPLE_LENGTH - phase)), so the bright bands slide along the
 * streamlines as the phase runs and repeat every whole phase. With a = 0 (frozen, and reduced motion) the picture is the plain LIC.
 */

export const RIPPLE_LENGTH = 12; // steps per ripple period
export const NOISE_STRIDE = 4096; // cells per row in the hash seed: ix + 2048 and iy + 2048 fit in 4096, so the seed is below 2^24 and exact in float32
export const CELL_ORIGIN = 2048;
export const SEED_X = 37, SEED_Y = 91, SEED_X_MODULUS = 997, SEED_Y_MODULUS = 991;
const TWO_POW_32 = 4294967296;
const EPSILON = 1e-12;

/** The PCG hash of TSL's `hash`: an integer seed to a float in [0, 1). */
export function pcgHash(n) {
  const state = (Math.imul(n >>> 0, 747796405) + 2891336453) >>> 0;
  const word = Math.imul(((state >>> ((state >>> 28) + 4)) ^ state) >>> 0, 277803737) >>> 0;
  return (((word >>> 22) ^ word) >>> 0) / TWO_POW_32;
}

/** White noise of the integer cell (ix, iy) for a seed; the seed shifts the cells, as it does in the shader. */
export function cellNoise(ix, iy, seed = 42) {
  const sx = (seed * SEED_X) % SEED_X_MODULUS, sy = (seed * SEED_Y) % SEED_Y_MODULUS;
  return pcgHash(ix + CELL_ORIGIN + sx + (iy + CELL_ORIGIN + sy) * NOISE_STRIDE);
}

/** Hann window on s in [-1, 1]. */
export const hannWeight = (s) => 0.5 * (1 + Math.cos(Math.PI * s));

/**
 * The LIC value at (x, y).
 * @param field   (x, y) => [vx, vy]; normalised here, a vanishing or non-finite vector ends the streamline
 * @param cell    side of a noise cell, in the units of x and y
 * @param step    arc length of one Euler step, same units
 * @param length  steps each way (24 at medium quality, 40 at ultra)
 * @param ripple  amplitude a of the animated ripple, 0 for none; phase in whole periods
 */
export function licSample({ x, y, field, cell, step, length, seed = 42, ripple = 0, phase = 0 }) {
  const weight = (i) => hannWeight(i / length) * (1 + ripple * Math.cos(2 * Math.PI * (i / RIPPLE_LENGTH - phase)));
  const noise = (px, py) => cellNoise(Math.floor(px / cell), Math.floor(py / cell), seed);
  let sum = weight(0) * noise(x, y), total = weight(0);
  for (const direction of [1, -1]) {
    let px = x, py = y;
    for (let i = 1; i <= length; i++) {
      const v = field(px, py);
      const size = Math.hypot(v[0], v[1]);
      if (!(size > EPSILON) || !Number.isFinite(size)) break;
      px += (direction * step * v[0]) / size;
      py += (direction * step * v[1]) / size;
      const w = weight(direction * i);
      sum += w * noise(px, py);
      total += w;
    }
  }
  return total > 0 ? sum / total : 0;
}

/** A width x height image (row-major, row 0 at the lowest y) of licSample at the pixel centres of `domain` = { x: [x0, x1], y: [y0, y1] }. */
export function licImage({ width, height, domain, ...options }) {
  const image = new Float32Array(width * height);
  const [x0, x1] = domain.x, [y0, y1] = domain.y;
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      image[j * width + i] = licSample({ x: x0 + ((i + 0.5) / width) * (x1 - x0), y: y0 + ((j + 0.5) / height) * (y1 - y0), ...options });
    }
  }
  return image;
}
