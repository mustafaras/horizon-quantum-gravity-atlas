/**
 * Bipolar relativistic jet field for the Kerr observatory (Prompt 05).
 *
 * PHYSICS ANCHOR (established relationship, heuristic rendering):
 *   The Blandford-Znajek (1977) mechanism extracts the spin energy of a Kerr
 *   black hole through poloidal magnetic flux threading the horizon. Its
 *   canonical power scaling is
 *
 *     P_BZ ~ (kappa/4pi) * Phi_BH^2 * Omega_H^2 * c,   Omega_H = a/(2 r_H)
 *
 *   which, at fixed flux, makes the jet power proportional to the spin factor
 *     bz(a*) = (a* / (1 + sqrt(1 - a*^2)))^2
 *   (Tchekhovskoy et al. 2010). That relationship is established. Everything
 *   below it — the collimation profile, the spine/sheath Lorentz factors, the
 *   knot turbulence, the display colour mapping — is a phenomenological model
 *   labelled "heuristic": it is NOT a solution of the GRMHD equations, and it
 *   is never presented as one.
 *
 * MODEL (each piece anchored to a published jet property):
 *   - Collimation: parabolic funnel rho(s) ~ sqrt(s), the near-horizon
 *     Blandford-Znajek funnel shape found in force-free and GRMHD simulations
 *     (McKinney & Narayan 2007a; the jet becomes conical only far beyond the
 *     rendered volume).
 *   - Velocity: a fast spine (Gamma -> 8) inside a slower sheath
 *     (Gamma -> 2.5), both accelerating over ~15 GM/c^2, the two-flow
 *     morphology invoked for AGN and M87 jets (Sol, Pelletier & Asseo 1989).
 *   - Beaming: the special-relativistic Doppler factor
 *     delta = 1/(Gamma (1 - beta.n_photon)) with n_photon the *lensed* photon
 *     direction at the emission point (the geodesic integrator supplies it),
 *     multiplied by the ZAMO lapse sqrt(Sigma Delta / A) for the gravitational
 *     redshift. Observed intensity scales as f^(3+alpha) with the synchrotron
 *     spectral index alpha = 0.5 — the invariant for a power-law spectrum.
 *   - Emissivity: optically thin synchrotron-like, fading as a power law in
 *     axial distance (expansion + radiative losses), with a seeded,
 *     unit-mean log-normal knot modulation advected along the jet at a
 *     sub-relativistic pattern speed (superluminal-knot phenomenology).
 *   - Colour: a display mapping of synchrotron ageing — blue-white at the
 *     base, reddening with distance. The physical spectral slope is a power
 *     law, not a blackbody; the blackbody chromaticity table is used purely
 *     as a display palette and is labelled as such.
 *
 * The jet is optically thin (kappa = 0): no absorption is modelled, and no
 * sound-in-vacuum shockwaves or fire textures are drawn.
 *
 * Pure module: no DOM, no Three.js. The GLSL chunks keep the same constants
 * injected from JET_FIELD so the CPU reference and the shaders cannot drift.
 */

import { latticeHash01, valueNoise3 } from "./kerr-plasma.mjs";

export const JET_FIELD = Object.freeze({
  /** Epistemic status of the rendering (the BZ scaling itself is established). */
  status: "heuristic",
  /** Axial extent: the jet exists for |z| in [sMin, sMax] GM/c^2 (sMin = r_+ is passed in). */
  sMax: 96,
  /** Collimation: rho(s) = rhoBase * sqrt((s - sMin + sColl)/sColl) (parabolic BZ funnel). */
  rhoBase: 1.6,
  sColl: 5,
  /** Spine/sheath Lorentz factors at infinity and the acceleration lengthscale GM/c^2. */
  gammaSpine: 8,
  gammaSheath: 2.5,
  sAccel: 14,
  /** Fraction of the emissivity in the slow sheath (the visible layer at large viewing angles). */
  sheathFraction: 0.4,
  /** Gaussian half-widths of the spine and sheath in units of the local jet radius. */
  spineWidth: 0.38,
  sheathWidth: 0.9,
  /** Synchrotron spectral index alpha; observed intensity scales as f^(3+alpha). */
  spectralIndex: 0.5,
  /** Axial emissivity fade: j ~ (1 + (s - sMin)/sFlat)^(-qE) with a soft base fade-in. */
  sFlat: 8,
  qE: 1.35,
  sFadeIn: 2,
  /** Display colour mapping of synchrotron ageing (NOT a blackbody temperature). */
  kelvinBase: 14000,
  sKelvin: 6,
  agingExponent: 0.4,
  /** Display gain relative to the disk's KERR_RENDER_CONSTANTS.diskGain scale. */
  gain: 0.55,
  /** Seeded knot turbulence: unit-mean log-normal, advected at the pattern speed (v/c). */
  knot: Object.freeze({
    lambdaS: 13,
    lambdaRho: 2.2,
    octaves: 3,
    gain: 0.6,
    lacunarity: 2,
    contrast: 0.85,
    patternSpeed: 0.55,
  }),
});

/* ------------------------------------------------------------------ */
/* Established relationships                                           */
/* ------------------------------------------------------------------ */

/**
 * Blandford-Znajek spin factor (a* / (1 + sqrt(1 - a*^2)))^2 in [0, ~0.88].
 * Zero spin -> no BZ jet; the jet amplitude below scales with this factor.
 */
export function blandfordZnajekSpinFactor(aStar) {
  const a = Math.min(0.998, Math.max(-0.998, Number(aStar) || 0));
  const factor = a / (1 + Math.sqrt(Math.max(1 - a * a, 0)));
  return factor * factor;
}

/** Lorentz factor of a jet component at axial distance s (GM/c^2) from the base. */
export function jetLorentzFactor(s, { gammaMax = JET_FIELD.gammaSpine, sAccel = JET_FIELD.sAccel } = {}) {
  const distance = Math.max(0, Number(s) || 0);
  return 1 + (gammaMax - 1) * (1 - Math.exp(-distance / sAccel));
}

/** Speed |v|/c of a Lorentz factor. */
export function jetBeta(gamma) {
  const g = Math.max(1, Number(gamma) || 1);
  return Math.sqrt(1 - 1 / (g * g));
}

/**
 * Special-relativistic Doppler factor of material with Lorentz factor `gamma`
 * and velocity direction `betaDotN` = beta . n_photon (n_photon points from
 * the emitter toward the observer). delta > 1 when the material approaches.
 */
export function jetDopplerFactor(gamma, betaDotN) {
  const g = Math.max(1, Number(gamma) || 1);
  const product = Math.min(0.999, Math.max(-0.999, Number(betaDotN) || 0));
  return 1 / (g * (1 - product));
}

/** Total frequency shift: ZAMO lapse (gravitational) times the Doppler factor. */
export function jetFrequencyShift({ lapse, doppler }) {
  return Math.max(0, Number(lapse) || 0) * Math.max(0, Number(doppler) || 0);
}

/** Exponent of the observed-intensity scaling for a power-law spectrum: 3 + alpha. */
export function jetObservedExponent(spectralIndex = JET_FIELD.spectralIndex) {
  return 3 + spectralIndex;
}

/* ------------------------------------------------------------------ */
/* Geometry and emissivity profile                                     */
/* ------------------------------------------------------------------ */

/** Parabolic collimation profile rho(s) (GM/c^2); s is measured from the jet base. */
export function jetRadius(s, { sMin = 2, rhoBase = JET_FIELD.rhoBase, sColl = JET_FIELD.sColl } = {}) {
  const distance = Math.max(0, (Number(s) || 0) - sMin);
  return rhoBase * Math.sqrt((distance + sColl) / sColl);
}

/** Axial emissivity profile: soft fade-in at the base, power-law fade with distance. */
export function jetAxialProfile(s, { sMin = 2, sFlat = JET_FIELD.sFlat, qE = JET_FIELD.qE, sFadeIn = JET_FIELD.sFadeIn } = {}) {
  const distance = Math.max(0, (Number(s) || 0) - sMin);
  const fadeIn = distance >= sFadeIn ? 1 : distance / sFadeIn;
  return fadeIn * fadeIn * (3 - 2 * fadeIn) * Math.pow(1 + distance / sFlat, -qE);
}

/** Radial spine/sheath profile at rho/rhoJet = q (sum of two Gaussians). */
export function jetRadialProfile(q, { spineWidth = JET_FIELD.spineWidth, sheathWidth = JET_FIELD.sheathWidth, sheathFraction = JET_FIELD.sheathFraction } = {}) {
  const spine = Math.exp(-((q / spineWidth) ** 2));
  const sheath = sheathFraction * Math.exp(-((q / sheathWidth) ** 2));
  return { spine, sheath };
}

/** Display colour mapping of synchrotron ageing (kelvin for the chroma table). */
export function jetDisplayKelvin(s, { sMin = 2, kelvinBase = JET_FIELD.kelvinBase, sKelvin = JET_FIELD.sKelvin, agingExponent = JET_FIELD.agingExponent } = {}) {
  const distance = Math.max(0, (Number(s) || 0) - sMin);
  return kelvinBase * Math.pow(1 + distance / sKelvin, -agingExponent);
}

/* ------------------------------------------------------------------ */
/* Seeded knot turbulence (unit-mean, advected)                       */
/* ------------------------------------------------------------------ */

const KNOT_VARIANCE = (() => {
  let sum = 0;
  let sumSq = 0;
  const n = 6000;
  for (let i = 0; i < n; i += 1) {
    const v = valueNoise3(i * 0.7548776662, i * 0.5698402910, i * 0.3141592654, 11);
    sum += v;
    sumSq += v * v;
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
})();

/**
 * Unit-mean log-normal knot modulation m(s, rho, phi, t) in [0, ~inf).
 * The pattern is advected along the jet at the knot pattern speed, so the
 * same realization streams outward; the ensemble mean over the field is 1
 * (the log-normal bias is removed with the measured octave variance).
 */
export function jetKnotModulation({ s, rho, phi, time = 0, seed = 42 }) {
  const K = JET_FIELD.knot;
  const advected = (Number(s) || 0) - K.patternSpeed * (Number(time) || 0);
  const radial = Math.max(0, Number(rho) || 0) / K.lambdaRho;
  const domain = [
    advected / K.lambdaS,
    radial * Math.cos(Number(phi) || 0),
    radial * Math.sin(Number(phi) || 0),
  ];
  let frequency = 1;
  let amplitude = 1;
  let field = 0;
  let variance = 0;
  for (let k = 0; k < K.octaves; k += 1) {
    const w = amplitude;
    field += w * valueNoise3(
      domain[0] * frequency + 19.1 * k,
      domain[1] * frequency,
      domain[2] * frequency,
      seed);
    variance += w * w;
    frequency *= K.lacunarity;
    amplitude *= K.gain;
  }
  const normalized = field / Math.sqrt(Math.max(variance, 1e-6));
  return Math.exp(K.contrast * normalized - 0.5 * K.contrast * K.contrast * KNOT_VARIANCE * variance);
}

/* ------------------------------------------------------------------ */
/* Full sample (CPU reference; the shaders mirror it exactly)          */
/* ------------------------------------------------------------------ */

/**
 * One jet emission sample along a traced ray.
 *
 * @param {object} input
 *   s: axial distance |z| (GM/c^2, BL-Cartesian with the spin axis along z)
 *   rho: cylindrical radius around the spin axis (GM/c^2)
 *   r: spherical BL radius of the sample (for the lapse)
 *   u: cos(theta) of the sample (for the lapse)
 *   aStar, sMin: spin and horizon radius
 *   rayDirZ: z-component of the *normalized ray velocity* (pointing away
 *     from the observer along the backward trace)
 *   lapse: ZAMO lapse sqrt(Sigma Delta / A) at the sample (caller computes)
 * @returns {{ emission: number, kelvin: number, shift: number } | null}
 *   null when the sample is outside the jet volume. `emission` is the
 *   optically thin emissivity coefficient (before the path length ds and the
 *   chroma lookup); `shift` is the emission-weighted mean frequency shift —
 *   the caller shades chroma(shift * kelvin) * emission * ds. Mirrors the
 *   GLSL jetEmission exactly.
 */
export function jetEmissionSample({ s, rho, r, u, aStar, sMin, rayDirZ, lapse }) {
  const distance = (Number(s) || 0) - (Number(sMin) || 0);
  if (distance < 0 || s > JET_FIELD.sMax) return null;
  const bz = blandfordZnajekSpinFactor(aStar);
  if (!(bz > 1e-6)) return null;
  const rhoJet = jetRadius(s, { sMin });
  const q = (Number(rho) || 0) / rhoJet;
  if (q > 1.25) return null;
  const { spine, sheath } = jetRadialProfile(q);
  const axial = jetAxialProfile(s, { sMin });
  if (!(axial > 0) || !(spine + sheath > 0)) return null;

  const jetSign = s >= 0 ? 1 : -1;
  const exponent = jetObservedExponent();
  let emission = 0;
  let weightedShift = 0;
  for (const [profile, gammaMax] of [[spine, JET_FIELD.gammaSpine], [sheath, JET_FIELD.gammaSheath]]) {
    if (!(profile > 0)) continue;
    const gamma = jetLorentzFactor(distance, { gammaMax });
    const beta = jetBeta(gamma);
    // n_photon = -rayDir, so beta . n_photon = -jetSign * beta * rayDirZ.
    const doppler = jetDopplerFactor(gamma, -jetSign * beta * (Number(rayDirZ) || 0));
    const shift = jetFrequencyShift({ lapse, doppler });
    const term = profile * shift ** exponent;
    emission += term;
    weightedShift += term * shift;
  }
  if (!(emission > 0)) return null;
  return {
    emission: JET_FIELD.gain * bz * axial * emission,
    kelvin: jetDisplayKelvin(s, { sMin }),
    shift: weightedShift / emission,
  };
}

/** Variance constant shared with the GLSL/TSL implementations. */
export const JET_FIELD_DERIVED = Object.freeze({ knotVariance: KNOT_VARIANCE });

/* ------------------------------------------------------------------ */
/* GLSL                                                                */
/* ------------------------------------------------------------------ */

const glslFloat = (value) => (Number.isInteger(value) ? value.toFixed(1) : String(value));

/**
 * GLSL ES 3.00 chunk for the jet base emission (accumulate pass). All
 * constants are injected from JET_FIELD; sMin is passed as uRPlus (the jet
 * base sits at the horizon). Mirrors jetEmissionSample in the pure module:
 * per-component beaming with the emission-weighted mean frequency shift for
 * the chroma, BZ spin scaling, optically thin.
 */
export const JET_FIELD_GLSL = /* glsl */ `
float bzSpinFactor(float a) {
  float aa = clamp(a, -0.998, 0.998);
  float f = aa / (1.0 + sqrt(max(1.0 - aa * aa, 0.0)));
  return f * f;
}
float jetGammaAt(float dist, float gammaMax) {
  return 1.0 + (gammaMax - 1.0) * (1.0 - exp(-dist / ${glslFloat(JET_FIELD.sAccel)}));
}
float jetRadiusAt(float s, float sMin) {
  float dist = max(s - sMin, 0.0);
  return ${glslFloat(JET_FIELD.rhoBase)} * sqrt((dist + ${glslFloat(JET_FIELD.sColl)}) / ${glslFloat(JET_FIELD.sColl)});
}
float jetAxialAt(float s, float sMin) {
  float dist = max(s - sMin, 0.0);
  float t = clamp(dist / ${glslFloat(JET_FIELD.sFadeIn)}, 0.0, 1.0);
  float fadeIn = t * t * (3.0 - 2.0 * t);
  return fadeIn * pow(1.0 + dist / ${glslFloat(JET_FIELD.sFlat)}, ${glslFloat(-JET_FIELD.qE)});
}
float jetKelvinAt(float s, float sMin) {
  float dist = max(s - sMin, 0.0);
  return ${glslFloat(JET_FIELD.kelvinBase)} * pow(1.0 + dist / ${glslFloat(JET_FIELD.sKelvin)}, ${glslFloat(-JET_FIELD.agingExponent)});
}
// Full jet emissivity at a BL-Cartesian sample (spin axis = z). pos: the
// sample position; rayDir: the normalized ray velocity (pointing away from
// the observer along the backward trace); r, u: spherical BL coordinates for
// the ZAMO lapse. Returns the beamed emissivity coefficient (<= 0 outside the
// jet); meanShift receives the emission-weighted frequency shift for the
// chroma lookup and kelvin the display colour temperature.
float jetEmission(vec3 pos, vec3 rayDir, float r, float u, float a, float sMin, out float meanShift, out float kelvin) {
  meanShift = 0.0;
  kelvin = 0.0;
  float s = abs(pos.z);
  float dist = s - sMin;
  if (dist < 0.0 || s > ${glslFloat(JET_FIELD.sMax)}) return 0.0;
  float bz = bzSpinFactor(a);
  if (bz <= 1e-6) return 0.0;
  float rho = length(pos.xy);
  float rhoJet = jetRadiusAt(s, sMin);
  float q = rho / rhoJet;
  if (q > 1.25) return 0.0;
  float axial = jetAxialAt(s, sMin);
  if (axial <= 0.0) return 0.0;
  // ZAMO lapse sqrt(Sigma Delta / A)
  float a2 = a * a;
  float Sigma = r * r + a2 * u * u;
  float Delta = max(r * r - 2.0 * r + a2, 1e-6);
  float A = (r * r + a2) * (r * r + a2) - a2 * Delta * (1.0 - u * u);
  float lapse = sqrt(max(Sigma * Delta / max(A, 1e-6), 0.0));
  float jetSign = pos.z >= 0.0 ? 1.0 : -1.0;
  kelvin = jetKelvinAt(s, sMin);
  float emission = 0.0;
  float weightedShift = 0.0;
  for (int component = 0; component < 2; component++) {
    float width = component == 0 ? ${glslFloat(JET_FIELD.spineWidth)} : ${glslFloat(JET_FIELD.sheathWidth)};
    float gammaMax = component == 0 ? ${glslFloat(JET_FIELD.gammaSpine)} : ${glslFloat(JET_FIELD.gammaSheath)};
    float fraction = component == 0 ? 1.0 : ${glslFloat(JET_FIELD.sheathFraction)};
    float profile = exp(-pow(q / width, 2.0)) * fraction;
    if (profile <= 0.0) continue;
    float gamma = jetGammaAt(dist, gammaMax);
    float beta = sqrt(max(1.0 - 1.0 / (gamma * gamma), 0.0));
    // n_photon = -rayDir, so beta . n_photon = -jetSign * beta * rayDir.z.
    float doppler = 1.0 / (gamma * (1.0 + jetSign * beta * rayDir.z));
    float shift = max(lapse, 0.0) * max(doppler, 0.0);
    float term = profile * pow(shift, ${glslFloat(jetObservedExponent())});
    emission += term;
    weightedShift += term * shift;
  }
  if (emission <= 0.0) return 0.0;
  meanShift = weightedShift / emission;
  return ${glslFloat(JET_FIELD.gain)} * bz * axial * emission;
}
`;

/**
 * GLSL ES 3.00 chunk for the knot modulation (display pass). Requires the
 * qgaValueNoise helper from KERR_PLASMA_GLSL. The pattern advects along the
 * jet at the knot pattern speed in coordinate time.
 */
export const JET_KNOTS_GLSL = /* glsl */ `
float jetKnots(float s, float rho, float phi, float time, uint seed) {
  float advected = s - ${glslFloat(JET_FIELD.knot.patternSpeed)} * time;
  float radial = max(rho, 0.0) / ${glslFloat(JET_FIELD.knot.lambdaRho)};
  vec3 domain = vec3(advected / ${glslFloat(JET_FIELD.knot.lambdaS)}, radial * cos(phi), radial * sin(phi));
  float frequency = 1.0;
  float amplitude = 1.0;
  float field = 0.0;
  float variance = 0.0;
  for (int k = 0; k < ${JET_FIELD.knot.octaves}; k++) {
    field += amplitude * qgaValueNoise(vec3(domain.x * frequency + 19.1 * float(k), domain.y * frequency, domain.z * frequency), seed);
    variance += amplitude * amplitude;
    frequency *= ${glslFloat(JET_FIELD.knot.lacunarity)};
    amplitude *= ${glslFloat(JET_FIELD.knot.gain)};
  }
  float normalized = field / sqrt(max(variance, 1e-6));
  float sigma = ${glslFloat(JET_FIELD.knot.contrast)};
  return exp(sigma * normalized - 0.5 * sigma * sigma * ${KNOT_VARIANCE.toFixed(8)} * variance);
}
`;
