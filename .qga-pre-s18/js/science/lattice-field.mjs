/**
 * The phi^4 lattice field theory (S14): the CPU reference the GPU kernel is compared with. Pure, DOM-free, seeded.
 *
 *   H = sum_x a^d [ pi^2/2 + (grad phi)^2/2 + m^2 phi^2/2 + (lambda/4!) phi^4 ]
 *
 * on a periodic hypercubic lattice of n^d sites (d = 1 or 2, n a power of two, spacing a), with forward-difference gradients, so the
 * equation of motion is  d^2 phi / dt^2 = lap phi - m^2 phi - (lambda/6) phi^3  with the 3-point (5-point) lattice Laplacian, and the free
 * spectrum is  omega_k^2 = m^2 + sum_i (4/a^2) sin^2(k_i a / 2).
 *
 * Integrator: leapfrog, kick-drift-kick, symplectic and second order. Stability (the CFL condition for the lattice wave equation) needs
 * dt * omega_max < 2 with omega_max^2 = max(m^2, 0) + 4 d / a^2, which for m = 0 is dt < a / sqrt(d); the module also caps dt at 0.5 a, the
 * bound the lab and the GPU kernel run under, and createLattice throws when either is broken. The nonlinear term adds lambda phi^2 / 2 to
 * m^2 where the field is large; the lab's slider ranges keep that inside the margin (test/lattice-field.test.mjs checks it).
 *
 * The GPU runs the same scheme in its staggered form (momentum at half steps): pi += dt F(phi); phi += dt pi. kick-drift-kick repeated is
 * exactly that, with a half kick at the two ends, so evolve() and stepStaggered() agree to rounding (toStaggered / fromStaggered).
 *
 * Site index: i = x + n y (row-major), the order of the GPU storage buffers. Mode index: the integer m_i in [0, n) of k_i = 2 pi m_i / (n a).
 */

import { fftRadix2 } from "./gravitational-waves.mjs";
import { seededRng } from "../physics.mjs";

export const MAX_DT_OVER_A = 0.5;
const STABILITY_LIMIT = 2;
const RELAX_TOLERANCE_ULPS = 1e3; // the relaxation stops at this many rounding errors of the force's own scale
const RELAX_MAX_ITERATIONS = 400000;

/** Validated, frozen lattice parameters with the derived sizes. */
export function createLattice({ dim, n, a = 1, mass2, lambda, dt }) {
  if (dim !== 1 && dim !== 2) throw new RangeError(`createLattice: dim must be 1 or 2, received ${dim}`);
  if (!Number.isInteger(n) || n < 4 || (n & (n - 1)) !== 0) throw new RangeError(`createLattice: n must be a power of two of at least 4, received ${n}`);
  if (!(a > 0) || !Number.isFinite(a)) throw new RangeError(`createLattice: a must be positive, received ${a}`);
  if (!Number.isFinite(mass2)) throw new RangeError(`createLattice: mass2 must be finite, received ${mass2}`);
  if (!(lambda >= 0) || !Number.isFinite(lambda)) throw new RangeError(`createLattice: lambda must be >= 0 (the potential must be bounded below), received ${lambda}`);
  const omegaMax = Math.sqrt(Math.max(mass2, 0) + (4 * dim) / (a * a));
  if (!(dt > 0) || dt > MAX_DT_OVER_A * a) throw new RangeError(`createLattice: dt must be in (0, ${MAX_DT_OVER_A} a], received ${dt}`);
  if (dt * omegaMax >= STABILITY_LIMIT) throw new RangeError(`createLattice: dt omega_max = ${dt * omegaMax} breaks the stability bound ${STABILITY_LIMIT}`);
  const size = n ** dim;
  return Object.freeze({ dim, n, a, mass2, lambda, dt, size, volume: size * a ** dim, omegaMax });
}

/** The largest step the lab uses for a lattice: 0.5 a, or 95 percent of the stability bound when that is smaller. */
export function maxStableDt({ dim, a, mass2 }) {
  const omegaMax = Math.sqrt(Math.max(mass2, 0) + (4 * dim) / (a * a));
  return Math.min(MAX_DT_OVER_A * a, (0.95 * STABILITY_LIMIT) / omegaMax);
}

/** omega_k^2 for a mode index (an array of dim integers). Negative for the unstable long modes of m^2 < 0. */
export function omegaSquared(params, mode) {
  let w2 = params.mass2;
  for (let i = 0; i < params.dim; i++) w2 += (4 / (params.a * params.a)) * Math.sin((Math.PI * mode[i]) / params.n) ** 2;
  return w2;
}

export function omega(params, mode) {
  const w2 = omegaSquared(params, mode);
  if (!(w2 >= 0)) throw new RangeError(`omega: mode ${mode} is unstable (omega^2 = ${w2})`);
  return Math.sqrt(w2);
}

const wrap = (i, n) => (i + n) % n;
const modeOf = (params, i) => (params.dim === 1 ? [i] : [i % params.n, Math.floor(i / params.n)]);
const indexOf = (params, mode) => (params.dim === 1 ? wrap(mode[0], params.n) : wrap(mode[0], params.n) + params.n * wrap(mode[1], params.n));

/** F = lap phi - m^2 phi - (lambda / 6) phi^3. Returns a new array (or fills `out`). */
export function acceleration(params, phi, out = new Float64Array(params.size)) {
  const { n, a, mass2, lambda, dim } = params;
  const inv = 1 / (a * a), cubic = lambda / 6;
  if (dim === 1) {
    for (let x = 0; x < n; x++) {
      const p = phi[x];
      out[x] = (phi[wrap(x - 1, n)] + phi[wrap(x + 1, n)] - 2 * p) * inv - mass2 * p - cubic * p * p * p;
    }
    return out;
  }
  for (let y = 0; y < n; y++) {
    const row = y * n, up = wrap(y - 1, n) * n, down = wrap(y + 1, n) * n;
    for (let x = 0; x < n; x++) {
      const i = row + x, p = phi[i];
      const lap = phi[row + wrap(x - 1, n)] + phi[row + wrap(x + 1, n)] + phi[up + x] + phi[down + x] - 4 * p;
      out[i] = lap * inv - mass2 * p - cubic * p * p * p;
    }
  }
  return out;
}

const copyState = (state) => ({ phi: Float64Array.from(state.phi), pi: Float64Array.from(state.pi) });

/** The state after `steps` kick-drift-kick steps. States hold phi and pi at integer times; the input is not modified. */
export function evolve(params, state, steps) {
  if (!Number.isInteger(steps) || steps < 0) throw new RangeError(`evolve: steps must be a non-negative integer, received ${steps}`);
  const next = copyState(state);
  if (steps === 0) return next;
  const { phi, pi } = next, force = new Float64Array(params.size), half = params.dt / 2;
  acceleration(params, phi, force);
  for (let i = 0; i < params.size; i++) pi[i] += half * force[i];
  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < params.size; i++) phi[i] += params.dt * pi[i];
    acceleration(params, phi, force);
    const kickLength = s === steps - 1 ? half : params.dt;
    for (let i = 0; i < params.size; i++) pi[i] += kickLength * force[i];
  }
  return next;
}

/** (phi_n, pi_n) -> (phi_n, pi_{n-1/2}): the state the GPU kernel starts from. */
export function toStaggered(params, state) {
  const force = acceleration(params, state.phi), half = params.dt / 2;
  return { phi: Float64Array.from(state.phi), pi: state.pi.map((v, i) => v - half * force[i]) };
}

/** `steps` steps of  pi += dt F(phi); phi += dt pi  on a staggered state: what one GPU dispatch does, repeated. */
export function stepStaggered(params, state, steps) {
  const next = copyState(state), force = new Float64Array(params.size);
  for (let s = 0; s < steps; s++) {
    acceleration(params, next.phi, force);
    for (let i = 0; i < params.size; i++) {
      next.pi[i] += params.dt * force[i];
      next.phi[i] += params.dt * next.pi[i];
    }
  }
  return next;
}

/**
 * The same steps with a length each (`dts`), starting from a staggered state made for `previousDt`. The kick of a step whose length differs from
 * the one before is the mean of the two: pi_{n+1/2} = pi_{n-1/2} + (h_{n-1} + h_n)/2 F(phi_n), the variable-step leapfrog, so changing the step
 * does not move the momentum's half-step offset and the energy does not jump. The GPU lattice does this when the quality governor changes dt.
 */
export function stepStaggeredVariable(params, state, dts, previousDt) {
  if (!(previousDt > 0)) throw new RangeError(`stepStaggeredVariable: previousDt must be positive, received ${previousDt}`);
  const next = copyState(state), force = new Float64Array(params.size);
  let last = previousDt;
  for (const dt of dts) {
    if (!(dt > 0)) throw new RangeError(`stepStaggeredVariable: every step must be positive, received ${dt}`);
    acceleration(params, next.phi, force);
    const kickLength = (last + dt) / 2;
    for (let i = 0; i < params.size; i++) {
      next.pi[i] += kickLength * force[i];
      next.phi[i] += dt * next.pi[i];
    }
    last = dt;
  }
  return next;
}

/** (phi_n, pi_{n-1/2}) -> (phi_n, pi_n). */
export function fromStaggered(params, state) {
  const force = acceleration(params, state.phi), half = params.dt / 2;
  return { phi: Float64Array.from(state.phi), pi: state.pi.map((v, i) => v + half * force[i]) };
}

/* ---------- energy ---------- */

/** The four terms of the Hamiltonian density at every site (the Formula Core terms of qft-phi4-hamiltonian, term by term). */
export function energyTerms(params, state) {
  const { n, a, mass2, lambda, dim, size } = params, { phi, pi } = state;
  const kinetic = new Float64Array(size), gradient = new Float64Array(size), mass = new Float64Array(size), interaction = new Float64Array(size);
  const inv = 1 / (a * a);
  for (let i = 0; i < size; i++) {
    const x = i % n, row = i - x, p = phi[i];
    let g = (phi[row + wrap(x + 1, n)] - p) ** 2;
    if (dim === 2) g += (phi[wrap(Math.floor(i / n) + 1, n) * n + x] - p) ** 2;
    kinetic[i] = 0.5 * pi[i] * pi[i];
    gradient[i] = 0.5 * g * inv;
    mass[i] = 0.5 * mass2 * p * p;
    interaction[i] = (lambda / 24) * p * p * p * p;
  }
  return { kinetic, gradient, mass, interaction };
}

/** e_x, so that the energy is a^d sum_x e_x. */
export function energyDensity(params, state) {
  const { kinetic, gradient, mass, interaction } = energyTerms(params, state);
  return kinetic.map((v, i) => v + gradient[i] + mass[i] + interaction[i]);
}

export function energy(params, state) {
  let sum = 0;
  for (const v of energyDensity(params, state)) sum += v;
  return sum * params.a ** params.dim;
}

/**
 * The invariant leapfrog conserves EXACTLY for the free field (lambda = 0): sum_k [ |pi~_k|^2 / 2 + omega_k^2 (1 - omega_k^2 dt^2 / 4) |phi~_k|^2 / 2 ].
 * The physical energy of a kick-drift-kick state oscillates by O((omega dt)^2) around it; this one does not move at all (to rounding).
 */
export function shadowEnergy(params, state) {
  if (params.lambda !== 0) throw new RangeError("shadowEnergy: exact only for lambda = 0 (the interacting scheme has no closed-form invariant)");
  const phiPower = modePower(params, { phi: state.phi }), piPower = modePower(params, { phi: state.pi });
  let sum = 0;
  for (let i = 0; i < params.size; i++) {
    const w2 = omegaSquared(params, modeOf(params, i));
    sum += 0.5 * piPower[i] + 0.5 * w2 * (1 - (w2 * params.dt * params.dt) / 4) * phiPower[i];
  }
  return sum;
}

/** |phi~_k|^2 with phi~_k = a^d / sqrt(V) sum_x phi_x e^{-ikx}: the normalisation in which sum_k |phi~_k|^2 = a^d sum_x phi_x^2 and the vacuum has 1 / (2 omega_k). */
export function modePower(params, state) {
  const re = Float64Array.from(state.phi), im = new Float64Array(params.size);
  transform(params, re, im, false);
  const scale = params.a ** params.dim / params.size;
  return re.map((v, i) => scale * (v * v + im[i] * im[i]));
}

/** The unnormalised DFT (or its inverse) over every axis, in place. */
function transform(params, re, im, invert) {
  const { n, dim } = params;
  const lineRe = new Float64Array(n), lineIm = new Float64Array(n);
  const run = (start, stride) => {
    for (let j = 0; j < n; j++) { lineRe[j] = re[start + j * stride]; lineIm[j] = im[start + j * stride]; }
    fftRadix2(lineRe, lineIm, invert);
    for (let j = 0; j < n; j++) { re[start + j * stride] = lineRe[j]; im[start + j * stride] = lineIm[j]; }
  };
  if (dim === 1) { run(0, 1); return; }
  for (let y = 0; y < n; y++) run(y * n, 1);
  for (let x = 0; x < n; x++) run(x, n);
}

/* ---------- seeded initial conditions ---------- */

/** A seed hashed to a well-mixed 32-bit state: the generator is a plain LCG, whose first draws are nearly linear in the seed. */
function rngFor(seed, salt) {
  let h = (Number(seed) ^ Math.imul(salt, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  const rng = seededRng((h ^ (h >>> 16)) >>> 0);
  for (let i = 0; i < 4; i++) rng();
  return rng;
}

function gaussian(rng) {
  const u = Math.max(1e-12, rng()), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * A sample of the free-field vacuum: Gaussian phi with <|phi~_k|^2> = 1 / (2 omega_k) and Gaussian pi with <|pi~_k|^2> = omega_k / 2, built by
 * an inverse FFT of Hermitian-symmetric mode amplitudes. It is the classical (Wigner) sample of the quantum ground state of the lambda = 0
 * lattice; with lambda > 0 it is the free vacuum as a starting point, not the interacting one. Needs omega_k^2 > 0 for every mode (m^2 > 0).
 */
export function vacuumLike(params, seed) {
  if (!(params.mass2 > 0)) throw new RangeError(`vacuumLike: needs m^2 > 0 so that every mode is stable and massive, received ${params.mass2}`);
  const rng = rngFor(seed, 0x51ce);
  const fill = (spectrum) => {
    const re = new Float64Array(params.size), im = new Float64Array(params.size);
    for (let i = 0; i < params.size; i++) {
      const mode = modeOf(params, i), j = indexOf(params, mode.map((m) => -m));
      if (j < i) continue;
      const variance = spectrum(omega(params, mode)); // E |c|^2
      if (j === i) { re[i] = Math.sqrt(variance) * gaussian(rng); continue; }
      const sigma = Math.sqrt(variance / 2);
      re[i] = re[j] = sigma * gaussian(rng);
      im[i] = sigma * gaussian(rng); im[j] = -im[i];
    }
    transform(params, re, im, true);
    const scale = 1 / Math.sqrt(params.volume);
    return re.map((v) => v * scale);
  };
  return { phi: fill((w) => 1 / (2 * w)), pi: fill((w) => w / 2) };
}

const PACKET = Object.freeze({ amplitude: 1, wavenumber: 1, widthOverL: 1 / 16 });

/**
 * Two Gaussian packets that collide head on along x: the left one at L/4 moving right, the right one at 3L/4 moving left, both on the
 * midline in 2+1D. phi = A g cos(k0 x), pi = omega(k0) A g sin(k0 x) is the right-moving packet of the free field (k0 -> -k0 for the other).
 * `only` keeps one of them: the free evolution of the pair is the sum of the two (lambda = 0), which is how the tests see the pass-through.
 */
export function wavepacket(params, { only = null, amplitude = PACKET.amplitude, wavenumber = PACKET.wavenumber, width = null } = {}) {
  const { n, a, dim, size } = params, L = n * a, sigma = width ?? L * PACKET.widthOverL;
  const w = Math.sqrt(Math.max(0, params.mass2 + (4 / (a * a)) * Math.sin((wavenumber * a) / 2) ** 2));
  const phi = new Float64Array(size), pi = new Float64Array(size);
  const near = (d) => { const m = ((d % L) + L) % L; return m > L / 2 ? m - L : m; };
  const add = (centre, direction) => {
    for (let i = 0; i < size; i++) {
      const dx = near((i % n) * a - centre), dy = dim === 2 ? near(Math.floor(i / n) * a - L / 2) : 0;
      const envelope = amplitude * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      const phase = direction * wavenumber * dx;
      phi[i] += envelope * Math.cos(phase);
      pi[i] += direction * w * envelope * Math.sin(phase);
    }
  };
  if (only !== "right") add(L / 4, +1);
  if (only !== "left") add((3 * L) / 4, -1);
  return { phi, pi };
}

/**
 * The kink-antikink pair of m^2 < 0 on a periodic box (a single kink cannot close): phi = v [tanh(mu (x - x1)/sqrt2) - tanh(mu (x - x2)/sqrt2) - 1]
 * with mu = sqrt(-m^2), v = sqrt(6 |m^2| / lambda), x1 = L/4, x2 = 3L/4; in 2+1D it is a pair of domain walls, constant along y.
 * The tanh solves the continuum equation; on the lattice the discrete Laplacian differs from it at O(a^2), so with `relax` (the default) the
 * profile is polished by gradient flow on the energy to the lattice's own static solution (residual of a few thousand rounding errors, about 1e-11): the kink is then static to
 * rounding, instead of breathing at the 1e-3 level. The translation zero mode is not moved by the flow.
 */
export function kink(params, { relax = true } = {}) {
  const { n, a, mass2, lambda, size } = params;
  if (!(mass2 < 0) || !(lambda > 0)) throw new RangeError(`kink: needs m^2 < 0 and lambda > 0, received m^2 = ${mass2}, lambda = ${lambda}`);
  const mu = Math.sqrt(-mass2), v = Math.sqrt((6 * -mass2) / lambda), L = n * a;
  const line = new Float64Array(n);
  for (let x = 0; x < n; x++) {
    const s = ((x * a) / Math.SQRT2) * mu;
    line[x] = v * (Math.tanh(s - (mu * L) / (4 * Math.SQRT2)) - Math.tanh(s - (3 * mu * L) / (4 * Math.SQRT2)) - 1);
  }
  const profile = relax ? relaxStatic({ ...params, dim: 1, size: n }, line) : line;
  const phi = new Float64Array(size);
  for (let i = 0; i < size; i++) phi[i] = profile[i % n];
  return { phi, pi: new Float64Array(size) };
}

/** Gradient flow phi += tau F(phi) to F = 0, with tau inside the stability bound of the flow. */
function relaxStatic(line, start) {
  const phi = Float64Array.from(start), force = new Float64Array(line.n);
  const vSquared = (6 * -line.mass2) / line.lambda;
  const stiffness = 4 / (line.a * line.a) + Math.abs(line.mass2) + (line.lambda * vSquared) / 2;
  const tau = 0.9 / stiffness;
  // the force is a difference of terms of size stiffness x v, so it cannot be computed below a few rounding errors of that
  const tolerance = RELAX_TOLERANCE_ULPS * Number.EPSILON * stiffness * Math.sqrt(vSquared);
  for (let iteration = 0; iteration < RELAX_MAX_ITERATIONS; iteration++) {
    acceleration(line, phi, force);
    let residual = 0;
    for (let i = 0; i < line.n; i++) { phi[i] += tau * force[i]; residual = Math.max(residual, Math.abs(force[i])); }
    if (residual < tolerance) return phi;
  }
  throw new Error("kink: the relaxation did not converge");
}

const KICK = Object.freeze({ amplitude: 1.5, jitter: 0.5, widthCells: 1.5, widthJitter: 0.4 });

/** The seeded amplitude and width (in lattice units) of the kick of a seed: both vary by a fixed fraction around their means. */
export function kickParameters(params, seed) {
  const rng = rngFor(seed, 0x2f9b);
  return {
    amplitude: KICK.amplitude * (1 - KICK.jitter / 2 + KICK.jitter * rng()),
    width: params.a * KICK.widthCells * (1 - KICK.widthJitter / 2 + KICK.widthJitter * rng()),
  };
}

/** Add a Gaussian kick to the stored momentum at lattice site `site` (periodic distance); phi is untouched. Returns a new state. */
export function kick(params, state, { site, seed }) {
  const { n, a, dim, size } = params, { amplitude, width } = kickParameters(params, seed);
  const next = copyState(state);
  const near = (d) => Math.min(Math.abs(d), n - Math.abs(d));
  for (let i = 0; i < size; i++) {
    const dx = near((i % n) - site[0]) * a, dy = dim === 2 ? near(Math.floor(i / n) - site[1]) * a : 0;
    next.pi[i] += amplitude * Math.exp(-(dx * dx + dy * dy) / (2 * width * width));
  }
  return next;
}
