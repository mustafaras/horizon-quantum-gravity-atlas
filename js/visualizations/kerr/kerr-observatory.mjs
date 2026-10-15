/**
 * Kerr observatory: pure render model (Prompt 04).
 *
 * This module is the only bridge between the Prompt 03 science core
 * (`js/science/`) and the GPU renderers. It owns
 *
 *   - the versioned, clamped observatory state,
 *   - the quality-specific ray-step / temporal-sample budgets,
 *   - the science-derived lookup tables the shaders interpolate
 *     (disk circular-orbit kinematics, Page-Thorne flux, blackbody colour),
 *   - the observer-frame coefficients for the per-pixel conserved quantities,
 *   - a CPU *reference tracer* whose equations are identical to the GLSL and
 *     TSL integrators (so the shaders are testable in Node), and
 *   - picking, focus, accumulation and export helpers.
 *
 * It never re-derives ISCO, horizon, photon-sphere, spectral or g-factor
 * physics: those come from `kerr.mjs`, `accretion-disk.mjs` and `spectrum.mjs`.
 * The only physics that lives next to the shaders is the geodesic
 * integration loop itself (Carter's separated equations in Mino time).
 *
 * Deterministic: no randomness, no DOM, no Three.js.
 */

import {
  kerrHorizonRadii,
  kerrIsco,
  kerrPhotonSphere,
  kerrConservedQuantities,
  kerrZamoFrame,
} from "../../science/kerr.mjs";
import {
  kerrCircularOrbit,
  pageThorneFluxGeometric,
  newtonianDiskFluxGeometric,
} from "../../science/accretion-disk.mjs";
import { blackbodyToSrgb } from "../../science/spectrum.mjs";
import { getVisualizationProvenance, registerVisualization } from "../../science/provenance.mjs";
import { KERR_PLASMA, plasmaEdgeOpacity } from "./kerr-plasma.mjs";
import { PLASMA_VOLUME } from "./plasma-volume.mjs";
import { JET_FIELD, blandfordZnajekSpinFactor } from "./jet-field.mjs";

/* ------------------------------------------------------------------ */
/* Identity, provenance                                                */
/* ------------------------------------------------------------------ */

export const KERR_VIEW_ID = "bh-kerr-observatory";
export const KERR_STATE_VERSION = 2;
export const KERR_EXPORT_SCHEMA = "horizon-qga-kerr-observatory/v1";

export const KERR_OBSERVATORY_PROVENANCE = Object.freeze({
  model: "Kerr null-geodesic imaging of a geometrically thin equatorial accretion disk",
  status: "effective",
  assumptions: [
    "Kerr exterior in Boyer-Lindquist coordinates, G = c = M = 1, |a*| <= 0.998",
    "Observer is a zero-angular-momentum observer (ZAMO) at the stated radius and inclination",
    "Disk is razor-thin, equatorial, circular-orbit (prograde in +phi), zero-torque at the ISCO; emission inside the ISCO is neglected",
    "Local emission is blackbody at the Page-Thorne (or Newtonian Shakura-Sunyaev) effective temperature; the peak temperature is DISPLAY-SCALED to 5000 K and is not a measured value",
    "The default disk is optically thick (opaque), as blackbody emission assumes; per-crossing transmittance of the translucent models is a display parameter that makes image orders separable, not a measured optical depth",
    "HEURISTIC plasma texture (turbulent model only): a seeded unit-mean log-normal emissivity field, advected at the local Kerr angular velocity Omega(r) and renewed every orbital period, stands in for MRI turbulence; the azimuthally averaged flux stays Page-Thorne, the filament shapes are not an MHD solution",
    "HEURISTIC volumetric corona (Prompt 05): an optically thin, flaring slab (H = 0.12 r^1.1) hugging the disk between the ISCO and r_out + 5 GM/c^2, with a seeded frozen clumpy realization, corotating at the table's Omega(r) so it shares the disk's g and g^4 beaming; a physical corona emits in X-rays, so the rendered blue-white glow is a display mapping of its thermal structure, not an observation",
    "HEURISTIC bipolar jets (Prompt 05): the Blandford-Znajek spin relationship P_BZ ~ (a*/(1 + sqrt(1-a*^2)))^2 is established and scales the jet amplitude (zero spin, no jet), but the rendering — parabolic collimation, a Gamma -> 8 spine inside a Gamma -> 2.5 sheath, optically thin power-law emissivity with spectral index alpha = 0.5, seeded knot turbulence advected at 0.55 c, and a display colour mapping of synchrotron ageing — is a phenomenological model, not a GRMHD simulation; the jet frequency shift combines the ZAMO lapse with the special-relativistic Doppler factor of the lensed photon direction, an approximation on the axis",
    "Disk animation runs at a display time scale of 14 GM/c^3 per second and ignores light-travel-time differences between image points (fast-light snapshot); reduced motion freezes it; the volumetric corona is a frozen snapshot and the jet knots advect with the same display clock",
    "Background stars are a seeded synthetic catalogue at infinity, rasterized into a filtered sky map; not an observed sky",
  ],
  validity: [
    "Exterior region only: rays terminate at r+ + 0.02 and are reported as captured",
    "Rays that exhaust the step budget (windings beyond the quality budget) are unresolved and drawn as shadow, not as an enhanced ring",
    "Photon-ring subimages beyond the resolved image order are not drawn; no ring is thickened for aesthetics",
    "Finite escape radius 160 GM/c^2: sky direction comes from the ray velocity, residual error well below one star width",
    "Disk outer radius 24 GM/c^2 is a display truncation; the turbulent disk thins smoothly to transparent beyond 0.55 r_out",
    "The volumetric layer (corona + jets) is composited front-to-back along the geodesic with the ZAMO spatial path length (the azimuthal metric coefficient approximated by Sigma; exact for a = 0 and for the polar part), depth-ordered with the disk crossings; the jets are optically thin and the corona's peak optical depth is ~0.2, so neither hides the shadow or the photon ring",
    "The volumetric layer renders only on the WebGL2 integrator at balanced or ultra quality (capability gate); the WebGPU compute path and the performance budget retain the smooth Prompt 04 image, and the status readout says so",
    "No sound-in-vacuum shockwaves, fire textures, screen-space god rays or lens flare are added to the observatory: the scene has no physical fragment depth for those passes, and the raymarched emission/absorption already composites the plasma in physical order",
  ],
  numericalMethod:
    "Fixed-form RK4 in Mino time on Carter's equations; the CPU reference and WebGL2 backend use a pole-regular unit-vector representation of polar motion, while the WebGPU smooth-disk backend retains the separated u and phi representation; "
    + "first integrals re-imposed every step; geometric step law dlambda = k min(1/r, (r - r+)/(|r'| + 1)); disk crossings by sign change of the polar coordinate with linear interpolation; "
    + "volumetric corona and jets sampled per RK4 step in BL-Cartesian coordinates with the ZAMO spatial path length, composited front-to-back (emission/absorption) and depth-ordered with the disk crossings; jet beaming from the lensed photon direction and the ZAMO lapse; "
    + "blackbody chromaticity from the committed CIE 1931 table; synthetic stars rasterized into a spherical-Gaussian sky map with a solid-angle-weighted mip chain and lensed-footprint filtering; "
    + "WebGL2 turbulent model evaluates the plasma texture per frame from the stored disk-plane hit position and band-limits it by its screen-space footprint; the jet knot modulation is evaluated per frame at the luminance-weighted mean jet position; "
    + "progressive ultra-quality stills render offscreen at 2K/4K/8K under a measured GPU-memory guard, accumulate Halton-jittered samples, denoise, and embed a metadata sidecar (state, provenance, backend, sample count, commit hash) in the PNG; "
    + "temporal accumulation as a running mean of Halton-jittered samples, reset on any geometry, camera, resolution, backend, quality or volume-flag change.",
  references: [
    "Carter (1968), Phys. Rev. 174, 1559",
    "Bardeen (1973), Timelike and null geodesics in the Kerr metric, Les Houches",
    "Bardeen, Press & Teukolsky (1972), ApJ 178, 347",
    "Page & Thorne (1974), ApJ 191, 499",
    "Luminet (1979), A&A 75, 228",
    "James, von Tunzelmann, Franklin & Thorne (2015), Class. Quantum Grav. 32, 065001",
    "Gralla, Lupsasca & Marrone (2020), Phys. Rev. D 102, 124004",
    "Blandford & Znajek (1977), MNRAS 179, 433",
    "Tchekhovskoy, Narayan & McKinney (2010), ApJ 711, 50",
    "McKinney & Narayan (2007a), MNRAS 375, 513",
  ],
});

/** Idempotent registration in the shared provenance registry. */
export function registerKerrObservatoryProvenance() {
  return getVisualizationProvenance(KERR_VIEW_ID)
    ?? registerVisualization(KERR_VIEW_ID, KERR_OBSERVATORY_PROVENANCE);
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

export const KERR_STATE_DEFAULTS = Object.freeze({
  bhStateVersion: KERR_STATE_VERSION,
  bhSpin: 0,
  bhInclination: 75,
  bhObserverDistance: 40,
  bhDiskModel: "page-thorne-turbulent",
  bhRenderQuality: "balanced",
  bhExposure: 0,
  bhAnnotations: false,
  bhCorona: true,
  bhJets: true,
});
const KERR_V1_DEFAULTS = Object.freeze({ ...KERR_STATE_DEFAULTS, bhDiskModel: "page-thorne", bhAnnotations: true });

export const KERR_ENUMS = Object.freeze({
  bhDiskModel: Object.freeze(["page-thorne-turbulent", "page-thorne", "page-thorne-opaque", "newtonian"]),
  bhRenderQuality: Object.freeze(["performance", "balanced", "ultra"]),
});

export const KERR_LIMITS = Object.freeze({
  spin: Object.freeze([-0.998, 0.998]),
  inclinationDeg: Object.freeze([3, 89]),
  observerDistance: Object.freeze([12, 120]),
  exposureEv: Object.freeze([-3, 3]),
});

export const KERR_DISK_MODELS = Object.freeze({
  "page-thorne-turbulent": Object.freeze({
    label: "Page–Thorne + turbulence", flux: "page-thorne", transmittance: 0, plasma: true, softEdge: true,
    note: "Optically thick Page–Thorne disk with a heuristic unit-mean MRI-like plasma texture rotating at the local Kerr Ω(r); thins smoothly beyond 0.55 r_out.",
  }),
  "page-thorne": Object.freeze({
    label: "Page–Thorne, translucent", flux: "page-thorne", transmittance: 0.35,
    note: "Relativistic thin-disk flux; per-crossing transmittance 0.35 (display) separates image orders.",
  }),
  "page-thorne-opaque": Object.freeze({
    label: "Page–Thorne, opaque", flux: "page-thorne", transmittance: 0,
    note: "Optically thick: the first equatorial hit terminates the ray; higher orders appear only through gaps.",
  }),
  newtonian: Object.freeze({
    label: "Newtonian Shakura–Sunyaev", flux: "newtonian", transmittance: 0.35,
    note: "Newtonian flux profile with the same relativistic kinematics; shown for contrast, an approximation.",
  }),
});

/** Constants shared by the CPU tracer and both shader backends. */
export const KERR_RENDER_CONSTANTS = Object.freeze({
  diskOuter: 24,
  escapeRadius: 160,
  captureMargin: 0.02,
  diskLutSize: 256,
  colorLutSize: 256,
  colorMinKelvin: 500,
  colorMaxKelvin: 60000,
  displayPeakKelvin: 5000,
  /** HDR display gain: the flux peak maps to ~3x display white so the single tone map rolls it off. */
  diskGain: 2.4,
  skyGain: 1,
  photonBandFactor: 1.35,
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function finite(value, name) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) throw new TypeError(`${name} must be a finite number; received ${value}`);
  return numeric;
}

/**
 * Normalize atlas state into the observatory's domain. Unknown versions and
 * missing fields fall back to the defaults, so old links keep working. The
 * Prompt 05 volume keys (bhCorona, bhJets) are additive with safe defaults:
 * v2 links without them render exactly as before the keys existed.
 */
export function normalizeKerrState(state = {}) {
  const version = state.bhStateVersion;
  const d = version === 1 ? KERR_V1_DEFAULTS : KERR_STATE_DEFAULTS;
  const known = version === undefined || version === null || version === 1 || version === KERR_STATE_VERSION;
  const read = (key) => (known && state[key] !== undefined ? state[key] : d[key]);
  const pick = (key) => (KERR_ENUMS[key].includes(read(key)) ? read(key) : d[key]);
  const flag = (key) => (read(key) === false ? false : true);
  return Object.freeze({
    bhStateVersion: KERR_STATE_VERSION,
    massLog10: clamp(finite(state.bhMass ?? 1, "bhMass"), 0, 9),
    aStar: clamp(finite(state.bhSpin ?? d.bhSpin, "bhSpin"), ...KERR_LIMITS.spin),
    inclinationDeg: clamp(finite(read("bhInclination"), "bhInclination"), ...KERR_LIMITS.inclinationDeg),
    observerDistance: clamp(finite(read("bhObserverDistance"), "bhObserverDistance"), ...KERR_LIMITS.observerDistance),
    diskModel: pick("bhDiskModel"),
    quality: pick("bhRenderQuality"),
    exposureEv: clamp(finite(read("bhExposure"), "bhExposure"), ...KERR_LIMITS.exposureEv),
    annotations: read("bhAnnotations") !== false,
    corona: flag("bhCorona"),
    jets: flag("bhJets"),
  });
}

/* ------------------------------------------------------------------ */
/* Quality budgets                                                     */
/* ------------------------------------------------------------------ */

/**
 * Documented per-quality budgets.
 *
 *   maxSteps         RK4 steps per ray (hard budget; rays that exhaust it are unresolved)
 *   stepK            step-law constant k in dlambda = k min(1/r, (r - r+)/(|r'| + 1));
 *                    smaller k = finer steps near the photon region
 *   temporalSamples  frames averaged by temporal accumulation (1 = no history)
 *   samplesPerFrame  jittered rays per pixel per frame (rotated-grid supersampling)
 *   sky              starfield resolution preset (see starfield-texture.mjs)
 *
 * Quality changes only sampling density and resolution; the equations and
 * claim labels never change.
 */
export const KERR_QUALITY_BUDGETS = Object.freeze({
  performance: Object.freeze({ maxSteps: 112, stepK: 0.30, temporalSamples: 1, samplesPerFrame: 1, sky: "performance" }),
  balanced: Object.freeze({ maxSteps: 224, stepK: 0.16, temporalSamples: 8, samplesPerFrame: 1, sky: "balanced" }),
  ultra: Object.freeze({ maxSteps: 448, stepK: 0.08, temporalSamples: 24, samplesPerFrame: 2, sky: "ultra" }),
});

/** Render-session ray-step budget each atlas detail preset corresponds to. */
const GOVERNOR_RAY_STEPS = Object.freeze({ low: 48, medium: 96, ultra: 160 });

/**
 * Effective budget for a requested quality on this device.
 * - the atlas detail tier folds the request (never exceeds the device tier)
 * - reduced motion removes temporal accumulation and compensates with
 *   deterministic spatial supersampling (4 jittered rays) so edges stay clean
 * - the adaptive governor scales maxSteps by its current raySteps ratio
 * - `volume` is the capability gate for the Prompt 05 volumetric layer
 *   (corona + jets): it needs the per-step emission/absorption sampling and
 *   the 4-target accumulation MRT, so it is off on the performance budget
 *   and on the WebGL2 integrator only (the WebGPU compute path retains the
 *   smooth disk models, as it already does for the turbulent texture)
 */
export function kerrQualityBudget(quality, { detail3d = "medium", reducedMotion = false, governorRaySteps = null } = {}) {
  const requested = KERR_ENUMS.bhRenderQuality.includes(quality) ? quality : KERR_STATE_DEFAULTS.bhRenderQuality;
  const ceiling = { low: "performance", medium: "balanced", ultra: "ultra" }[detail3d] ?? "balanced";
  const order = KERR_ENUMS.bhRenderQuality;
  const effective = order[Math.min(order.indexOf(requested), order.indexOf(ceiling))];
  const base = KERR_QUALITY_BUDGETS[effective];
  let maxSteps = base.maxSteps;
  if (Number.isFinite(governorRaySteps) && GOVERNOR_RAY_STEPS[detail3d]) {
    const ratio = clamp(governorRaySteps / GOVERNOR_RAY_STEPS[detail3d], 0.4, 1);
    maxSteps = Math.max(64, Math.round(base.maxSteps * ratio));
  }
  return Object.freeze({
    requested,
    effective,
    maxSteps,
    stepK: base.stepK,
    temporalSamples: reducedMotion ? 1 : base.temporalSamples,
    samplesPerFrame: reducedMotion ? Math.max(4, base.samplesPerFrame) : base.samplesPerFrame,
    sky: base.sky,
    volume: effective !== "performance",
  });
}

/**
 * Why the volumetric layer is (or is not) running, in the order the gates
 * apply. The control deck prints this verbatim, so a CPU rasterizer never
 * reads as "the user turned it off" and a WebGPU session never reads as a
 * quality choice.
 *
 *   webgpu   — the compute path serves the smooth disk models only
 *   software — a CPU rasterizer is clamped to the low tier
 *   quality  — the effective tier is the performance budget
 *   toggles  — both the corona and the jets are switched off
 *   on       — the layer is rendering
 */
export function kerrVolumeReason({ backend = "webgl2", softwareClamped = false, budget = null, corona = false, jets = false } = {}) {
  if (backend !== "webgl2") return "webgpu";
  if (softwareClamped) return "software";
  if (budget?.volume !== true) return "quality";
  return corona || jets ? "on" : "toggles";
}

/* ------------------------------------------------------------------ */
/* Observer frame                                                      */
/* ------------------------------------------------------------------ */

/**
 * Per-pixel conserved quantities are affine/quadratic in the local direction
 * n = (n_r, n_theta, n_phi) of a ZAMO ray:
 *
 *   E  = E0 + E1 n_phi        L_z = L0 + L1 n_phi
 *   p_theta = P1 n_theta      p_r = R1 n_r
 *   Q  = p_theta^2 + cos^2(theta0) (-a^2 E^2 + L_z^2 / sin^2(theta0))
 *
 * The coefficients are *probed from the science API* with unit directions, so
 * the shaders never restate the ZAMO-frame algebra.
 */
export function kerrObserverCoefficients(aStar, r0, theta0) {
  const base = { aStar, r: r0, theta: theta0, observer: "zamo" };
  const radial = kerrConservedQuantities({ ...base, direction: [1, 0, 0] });
  const polar = kerrConservedQuantities({ ...base, direction: [0, 1, 0] });
  const azimuthal = kerrConservedQuantities({ ...base, direction: [0, 0, 1] });
  const frame = kerrZamoFrame(aStar, r0, theta0);
  return Object.freeze({
    E0: radial.E,
    E1: azimuthal.E - radial.E,
    L0: radial.Lz,
    L1: azimuthal.Lz - radial.Lz,
    P1: polar.ptheta,
    R1: radial.pr,
    lapse: frame.lapse,
    frameDragging: frame.frameDragging,
  });
}

/**
 * Observer basis for a camera orbiting the hole and looking at it. With the
 * spin axis along world +y, screen-right = e_phi, screen-up = -e_theta and
 * forward = -e_r, so the local ray direction of an NDC point is
 * normalize(-1, -y tan(f/2), x tan(f/2) aspect) in (r, theta, phi) components.
 */
export function kerrObserverFromCamera(position) {
  const [x, y, z] = position;
  const r = Math.hypot(x, y, z);
  if (!(r > 0)) throw new RangeError("camera position must be non-zero");
  return { r0: r, theta0: Math.acos(clamp(y / r, -1, 1)), phi0: Math.atan2(z, x) };
}

export function kerrLocalDirection(ndcX, ndcY, tanHalfFov, aspect) {
  const sx = ndcX * tanHalfFov * aspect;
  const sy = ndcY * tanHalfFov;
  const norm = Math.hypot(1, sx, sy);
  return [-1 / norm, -sy / norm, sx / norm];
}

/* ------------------------------------------------------------------ */
/* Science-derived tables                                              */
/* ------------------------------------------------------------------ */

/**
 * Disk table: for r_i = r_in + (r_out - r_in)(i/(N-1))^2 store
 * [Omega, u^t, F/F_max, T_emit] from the science core.
 * The shader indexes with i = (N-1) sqrt((r - r_in)/(r_out - r_in)).
 */
export function buildDiskTable({ aStar, diskModel, rIn, rOut, size = KERR_RENDER_CONSTANTS.diskLutSize, quadratureOrder = 32 }) {
  const model = KERR_DISK_MODELS[diskModel];
  const data = new Float32Array(size * 4);
  const flux = new Float64Array(size);
  let fluxMax = 0;
  for (let i = 0; i < size; i += 1) {
    const t = i / (size - 1);
    const r = rIn + (rOut - rIn) * t * t;
    const orbit = kerrCircularOrbit(aStar, r, { prograde: true });
    const f = model.flux === "page-thorne"
      ? pageThorneFluxGeometric({ aStar, r, massRate: 1, prograde: true, innerRadius: rIn, quadratureOrder })
      : newtonianDiskFluxGeometric({ r, massRate: 1, innerRadius: rIn });
    flux[i] = f;
    fluxMax = Math.max(fluxMax, f);
    data[i * 4] = orbit.omega;
    data[i * 4 + 1] = orbit.timeComponent;
  }
  if (!(fluxMax > 0)) throw new RangeError("disk flux is identically zero");
  const peak = KERR_RENDER_CONSTANTS.displayPeakKelvin;
  for (let i = 0; i < size; i += 1) {
    const rel = flux[i] / fluxMax;
    data[i * 4 + 2] = rel;
    data[i * 4 + 3] = peak * Math.pow(rel, 0.25);
  }
  return { size, data, fluxMax, rIn, rOut };
}

/** Blackbody chromaticity (linear sRGB, max channel 1) from the CIE table. */
export function buildColorTable({
  size = KERR_RENDER_CONSTANTS.colorLutSize,
  minKelvin = KERR_RENDER_CONSTANTS.colorMinKelvin,
  maxKelvin = KERR_RENDER_CONSTANTS.colorMaxKelvin,
} = {}) {
  const data = new Float32Array(size * 4);
  const logMin = Math.log10(minKelvin);
  const logMax = Math.log10(maxKelvin);
  for (let i = 0; i < size; i += 1) {
    const kelvin = 10 ** (logMin + ((logMax - logMin) * i) / (size - 1));
    const { linearRgb } = blackbodyToSrgb(kelvin);
    data[i * 4] = linearRgb.r;
    data[i * 4 + 1] = linearRgb.g;
    data[i * 4 + 2] = linearRgb.b;
    data[i * 4 + 3] = 1;
  }
  return { size, data, logMin, logMax };
}

const tableCache = new Map();
function cached(key, build) {
  if (!tableCache.has(key)) {
    if (tableCache.size > 24) tableCache.delete(tableCache.keys().next().value);
    tableCache.set(key, build());
  }
  return tableCache.get(key);
}

/** Interpolate a table row exactly like the shaders (linear in the sqrt-radius index). */
export function sampleDiskTable(table, r) {
  const { size, data, rIn, rOut } = table;
  const s = Math.min(1, Math.max(0, (r - rIn) / (rOut - rIn)));
  const x = Math.sqrt(s) * (size - 1);
  const i0 = Math.min(size - 2, Math.floor(x));
  const f = x - i0;
  const row = (k) => data[i0 * 4 + k] * (1 - f) + data[(i0 + 1) * 4 + k] * f;
  return { omega: row(0), timeComponent: row(1), fluxRel: row(2), kelvin: row(3) };
}

export function sampleColorTable(table, kelvin) {
  const { size, data, logMin, logMax } = table;
  const t = Math.min(1, Math.max(0, (Math.log10(Math.max(kelvin, 1)) - logMin) / (logMax - logMin)));
  const x = t * (size - 1);
  const i0 = Math.min(size - 2, Math.floor(x));
  const f = x - i0;
  return [0, 1, 2].map((k) => data[i0 * 4 + k] * (1 - f) + data[(i0 + 1) * 4 + k] * f);
}

/**
 * Observed disk emission for one hit, in the documented order:
 *   1. emitted effective temperature from the table (display-scaled)
 *   2. combined gravitational + Doppler shift g = 1 / (u^t (E - Omega L_z))
 *   3. observed temperature T_obs = g T_emit  -> blackbody chromaticity
 *   4. intensity beaming I_obs = g^4 F/F_max   (bolometric, Liouville)
 *   5. exposure and display gain; tone mapping happens once, downstream.
 */
export function shadeDiskHit(renderState, r, E, Lz) {
  const { disk, colorTable } = renderState;
  const row = sampleDiskTable(disk, r);
  const denominator = row.timeComponent * (E - row.omega * Lz);
  if (!(denominator > 1e-4)) return { g: 0, kelvin: 0, rgb: [0, 0, 0], intensity: 0 };
  const g = 1 / denominator;
  const kelvin = g * row.kelvin;
  const chroma = sampleColorTable(colorTable, kelvin);
  const intensity = g ** 4 * row.fluxRel * KERR_RENDER_CONSTANTS.diskGain * renderState.exposure;
  return { g, kelvin, rgb: chroma.map((c) => c * intensity), intensity };
}

/* ------------------------------------------------------------------ */
/* Render state                                                        */
/* ------------------------------------------------------------------ */

/**
 * Everything a backend needs for one geometry. Built from the normalized
 * state and the observer; cached tables keep slider drags cheap.
 */
export function buildKerrRenderState(normalized, { observer, budget, backend = "webgl2" } = {}) {
  const { aStar } = normalized;
  const theta0 = observer?.theta0 ?? (normalized.inclinationDeg * Math.PI) / 180;
  const r0 = observer?.r0 ?? normalized.observerDistance;
  const phi0 = observer?.phi0 ?? 0;
  const horizon = kerrHorizonRadii(aStar);
  const rIsco = kerrIsco(aStar, { prograde: true });
  const radii = Object.freeze({
    rPlus: horizon.rPlus,
    rMinus: horizon.rMinus,
    rIsco,
    rIscoRetrograde: kerrIsco(aStar, { prograde: false }),
    rPhotonPro: kerrPhotonSphere(aStar, { prograde: true }),
    rPhotonRetro: kerrPhotonSphere(aStar, { prograde: false }),
  });
  const rOut = KERR_RENDER_CONSTANTS.diskOuter;
  const model = KERR_DISK_MODELS[normalized.diskModel];
  const disk = cached(`disk|${aStar}|${normalized.diskModel}`, () =>
    buildDiskTable({ aStar, diskModel: normalized.diskModel, rIn: rIsco, rOut }));
  const colorTable = cached("color", () => buildColorTable());
  const coef = kerrObserverCoefficients(aStar, r0, theta0);
  const effectiveBudget = budget ?? kerrQualityBudget(normalized.quality);
  const volumeCapable = backend === "webgl2" && effectiveBudget.volume === true;
  return Object.freeze({
    normalized,
    aStar,
    massLog10: normalized.massLog10,
    massSolar: 10 ** normalized.massLog10,
    radii,
    disk,
    colorTable,
    transmittance: model.transmittance,
    plasma: model.plasma === true,
    softEdge: model.softEdge === true,
    exposure: 2 ** normalized.exposureEv,
    annotations: normalized.annotations,
    corona: normalized.corona === true && volumeCapable,
    jets: normalized.jets === true && volumeCapable,
    coronaRadii: Object.freeze({
      rIn: Math.max(radii.rPlus + 0.5, rIsco - PLASMA_VOLUME.innerMargin),
      rOut: rOut + PLASMA_VOLUME.outerMargin,
    }),
    observer: Object.freeze({ r0, theta0, phi0, u0: Math.cos(theta0), coef }),
    budget: effectiveBudget,
    backend,
  });
}

/* ------------------------------------------------------------------ */
/* CPU reference tracer (mirrors the GLSL / TSL integrator exactly)    */
/* ------------------------------------------------------------------ */

/** Carter constants of one ray from its local direction. */
export function kerrRayConstants(renderState, direction) {
  const { coef, u0, theta0, r0 } = renderState.observer;
  const a = renderState.aStar;
  const [nr, nth, nph] = direction;
  const E = coef.E0 + coef.E1 * nph;
  const Lz = coef.L0 + coef.L1 * nph;
  const ptheta = coef.P1 * nth;
  const sin2 = Math.max(1 - u0 * u0, 1e-12);
  const Q = ptheta * ptheta + u0 * u0 * (-a * a * E * E + (Lz * Lz) / sin2);
  const delta = r0 * r0 - 2 * r0 + a * a;
  return { E, Lz, Q, ptheta, vr: delta * coef.R1 * nr, vu: -Math.sin(theta0) * ptheta };
}

/**
 * Pole-regular form of Carter's equations. The polar and azimuthal motion is
 * carried by a unit vector m on the sphere (z along the spin axis) with
 * m' = w and
 *
 *   w' = -(Q + L_z^2 + a^2 E^2 m_z^2) m + a^2 E^2 m_z (z - m_z m)
 *
 * which reproduces u'' = Theta_u'(u)/2 for u = m_z and phi' = L_z / sin^2(theta)
 * for the azimuth of m, without the coordinate singularity at the poles
 * (rays passing over the axis move smoothly through m = +-z). Frame dragging
 * is the remaining azimuthal rate a (P/Delta - E), integrated as a separate
 * rotation angle phi_d about the axis: the ray's direction is R_z(phi_d) m.
 *
 * State: [r, r', m_x, m_y, m_z, w_x, w_y, w_z, phi_d].
 */
function derivative(a, E, Lz, Q, s) {
  const [r, vr, mx, my, mz, wx, wy, wz] = s;
  const a2 = a * a;
  const aE2 = a2 * E * E;
  const P = E * (r * r + a2) - a * Lz;
  const K = (Lz - a * E) * (Lz - a * E) + Q;
  const delta = Math.max(r * r - 2 * r + a2, 1e-6);
  const omega2 = Q + Lz * Lz + aE2 * mz * mz;
  const pull = aE2 * mz;
  return [
    vr,
    2 * E * r * P - (r - 1) * K,
    wx, wy, wz,
    -omega2 * mx - pull * mz * mx,
    -omega2 * my - pull * mz * my,
    -omega2 * mz + pull * (1 - mz * mz),
    (a * P) / delta - a * E,
  ];
}

/** Angular speed |m'| on the sphere: the first integral sqrt(Q + L_z^2 + a^2 E^2 m_z^2). */
function angularSpeed(a, E, Lz, Q, mz) {
  return Math.sqrt(Math.max(Q + Lz * Lz + a * a * E * E * mz * mz, 0));
}

function rk4(a, E, Lz, Q, s, h) {
  const add = (x, k, c) => x.map((v, i) => v + c * k[i]);
  const k1 = derivative(a, E, Lz, Q, s);
  const k2 = derivative(a, E, Lz, Q, add(s, k1, h / 2));
  const k3 = derivative(a, E, Lz, Q, add(s, k2, h / 2));
  const k4 = derivative(a, E, Lz, Q, add(s, k3, h));
  const next = s.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  // First-integral projection: |r'| = sqrt(R(r)), |m| = 1, w tangent to the sphere and
  // |w| = sqrt(Q + L_z^2 + a^2 E^2 m_z^2) are exact constraints. Re-imposing them each
  // step removes the secular drift of the second-order form (which otherwise
  // mis-classifies near-critical rays) while the direction of motion is kept.
  const a2 = a * a;
  const r = next[0];
  const P = E * (r * r + a2) - a * Lz;
  const K = (Lz - a * E) * (Lz - a * E) + Q;
  const R = P * P - (r * r - 2 * r + a2) * K;
  next[1] = (next[1] >= 0 ? 1 : -1) * Math.sqrt(Math.max(R, 0));
  const mLength = Math.hypot(next[2], next[3], next[4]) || 1;
  for (let i = 2; i <= 4; i += 1) next[i] /= mLength;
  const radialW = next[5] * next[2] + next[6] * next[3] + next[7] * next[4];
  for (let i = 5; i <= 7; i += 1) next[i] -= radialW * next[i - 3];
  const wLength = Math.hypot(next[5], next[6], next[7]);
  if (wLength > 1e-12) {
    const scale = angularSpeed(a, E, Lz, Q, next[4]) / wLength;
    for (let i = 5; i <= 7; i += 1) next[i] *= scale;
  }
  return next;
}

/** Initial sphere state of a ray leaving the observer at (theta0, phi0). */
export function kerrInitialSphereState(theta0, phi0, ptheta, Lz) {
  const st = Math.sin(theta0);
  const ct = Math.cos(theta0);
  const sp = Math.sin(phi0);
  const cp = Math.cos(phi0);
  const sinT = Math.max(st, 1e-6);
  // m' = theta' e_theta + sin(theta) phi' e_phi with theta' = p_theta and sin(theta) phi' = L_z / sin(theta)
  const azimuthal = Lz / sinT;
  return {
    m: [st * cp, st * sp, ct],
    w: [ptheta * ct * cp - azimuthal * sp, ptheta * ct * sp + azimuthal * cp, -ptheta * st],
  };
}

/** Rotate (x, y) of a BL-Cartesian vector about the spin axis by `angle`. */
function rotateZ([x, y, z], angle) {
  const c = Math.cos(angle);
  const sn = Math.sin(angle);
  return [c * x - sn * y, sn * x + c * y, z];
}

/**
 * Trace one ray. Returns the status (`captured`, `escaped`, `unresolved`),
 * every equatorial crossing (`hits`, `order` = crossings before it, `inDisk`
 * when it lies in [r_in, r_out], `phi` = Boyer-Lindquist azimuth of the
 * crossing), the closest approach and, for escaped rays, the asymptotic
 * world-space direction.
 */
export function traceKerrReferenceRay(renderState, direction, { maxSteps, stepK } = {}) {
  const a = renderState.aStar;
  const { r0, phi0, theta0 } = renderState.observer;
  const budget = renderState.budget;
  const steps = maxSteps ?? budget.maxSteps;
  const k = stepK ?? budget.stepK;
  const { E, Lz, Q, vr, ptheta } = kerrRayConstants(renderState, direction);
  const rPlus = renderState.radii.rPlus;
  const { escapeRadius, captureMargin } = KERR_RENDER_CONSTANTS;
  const { rIn, rOut } = renderState.disk;
  const start = kerrInitialSphereState(theta0, phi0, ptheta, Lz);
  let s = [r0, vr, ...start.m, ...start.w, 0];
  const hits = [];
  let crossings = 0;
  let rMin = r0;
  let status = "unresolved";
  let used = 0;
  for (; used < steps; used += 1) {
    const [r, rv] = s;
    const h = k * Math.min(1 / r, (r - rPlus) / (Math.abs(rv) + 1));
    const next = rk4(a, E, Lz, Q, s, h);
    if (!next.every(Number.isFinite)) break;
    if (s[4] * next[4] < 0) {
      const f = s[4] / (s[4] - next[4]);
      const rc = s[0] + f * (next[0] - s[0]);
      const mx = s[2] + f * (next[2] - s[2]);
      const my = s[3] + f * (next[3] - s[3]);
      const drag = s[8] + f * (next[8] - s[8]);
      hits.push({ order: crossings, r: rc, phi: Math.atan2(my, mx) + drag, inDisk: rc >= rIn && rc <= rOut });
      crossings += 1;
    }
    s = next;
    rMin = Math.min(rMin, s[0]);
    if (s[0] < rPlus + captureMargin && s[1] < 0) { status = "captured"; break; }
    if (s[0] > escapeRadius && s[1] > 0) { status = "escaped"; break; }
  }
  const [r, rv] = s;
  const drag = s[8];
  // Asymptotic direction of motion d(r n)/dlambda = r' n + r n', with
  // n = R_z(phi_d) m and n' = R_z(phi_d) w + phi_d' z x n.
  const n = rotateZ([s[2], s[3], s[4]], drag);
  const dragRate = derivative(a, E, Lz, Q, s)[8];
  const turned = rotateZ([s[5], s[6], s[7]], drag);
  const nDot = [turned[0] - dragRate * n[1], turned[1] + dragRate * n[0], turned[2]];
  const v = [0, 1, 2].map((i) => rv * n[i] + r * nDot[i]);
  const norm = Math.hypot(...v) || 1;
  // World axes have the spin along +y: world = (x, z, y) of the BL-Cartesian frame.
  const world = [v[0] / norm, v[2] / norm, v[1] / norm];
  const phi = Math.atan2(n[1], n[0]);
  return {
    status, steps: used, hits, rMin, E, Lz, Q,
    escapeDirection: world,
    final: { r, vr: rv, u: n[2], phi },
  };
}

/**
 * Emission weight and transmission factor of one in-disk crossing:
 * constant-transmittance models emit fully and pass `transmittance`; the
 * soft-edged model has opacity alpha(r) (1 inside, thinning to 0 at r_out)
 * and, by Kirchhoff's law, emits alpha(r) of the blackbody intensity.
 */
export function diskCrossingWeights(renderState, r) {
  if (!renderState.softEdge) return { emit: 1, pass: renderState.transmittance };
  const alpha = plasmaEdgeOpacity(r, renderState.disk.rOut);
  return { emit: alpha, pass: 1 - alpha };
}

/**
 * Disk radiance of a traced ray (sky excluded), applying per-crossing
 * weights exactly like the shaders (see diskCrossingWeights). The plasma
 * texture is a per-frame display factor and is not part of this reference.
 */
export function shadeKerrReferenceRay(renderState, trace) {
  let transmit = 1;
  const rgb = [0, 0, 0];
  for (const hit of trace.hits) {
    if (!hit.inDisk) continue;
    const shaded = shadeDiskHit(renderState, hit.r, trace.E, trace.Lz);
    const { emit, pass } = diskCrossingWeights(renderState, hit.r);
    for (let c = 0; c < 3; c += 1) rgb[c] += transmit * emit * shaded.rgb[c];
    transmit *= pass;
    if (transmit <= 1e-4) { transmit = 0; break; }
  }
  return { rgb, transmit, escaped: trace.status === "escaped" };
}

/* ------------------------------------------------------------------ */
/* Picking, focus, explanation                                         */
/* ------------------------------------------------------------------ */

export const KERR_FOCUS_KINDS = Object.freeze(["horizon", "photon-region", "direct-disk", "higher-order"]);

/** Classify a traced ray into the feature the user clicked. */
export function classifyKerrTrace(renderState, trace) {
  if (trace.status === "captured") return { kind: "horizon", order: null };
  const hit = trace.hits.find((h) => h.inDisk);
  if (hit) return hit.order === 0 ? { kind: "direct-disk", order: 0 } : { kind: "higher-order", order: hit.order };
  const band = renderState.radii.rPhotonRetro * KERR_RENDER_CONSTANTS.photonBandFactor;
  if (trace.status === "unresolved" || trace.rMin <= band) return { kind: "photon-region", order: null };
  return { kind: "sky", order: null };
}

/** Trace and classify the pixel at NDC (x, y) for the given lens. */
export function pickKerrPixel(renderState, ndcX, ndcY, { tanHalfFov, aspect }) {
  const direction = kerrLocalDirection(ndcX, ndcY, tanHalfFov, aspect);
  const trace = traceKerrReferenceRay(renderState, direction);
  return { ...classifyKerrTrace(renderState, trace), trace };
}

/**
 * Representative image location of a feature for keyboard-driven focus:
 * scans outward along the screen axes and returns the first NDC point whose
 * ray classifies as the requested kind (shadow centre for the horizon).
 */
export function locateKerrFeature(renderState, kind, lens) {
  if (kind === "horizon") return { x: 0, y: 0 };
  const scan = Array.from({ length: 24 }, (_, i) => {
    const angle = (2 * Math.PI * i) / 24;
    return [Math.cos(angle), Math.sin(angle)];
  });
  for (let step = 1; step <= 160; step += 1) {
    const radius = step / 160;
    for (const [dx, dy] of scan) {
      const x = dx * radius;
      const y = dy * radius;
      const picked = pickKerrPixel(renderState, x, y, lens);
      if (picked.kind === kind) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}

/** Camera dolly and image-plane focus disc for each feature (reduced motion snaps). */
export function kerrFocusPlan(kind, { observerDistance, rIscoPro } = {}) {
  const clampDistance = (value) => clamp(value, ...KERR_LIMITS.observerDistance);
  const plans = {
    horizon: { distance: clampDistance(18), radius: 0.2, strength: 0.85 },
    "photon-region": { distance: clampDistance(22), radius: 0.16, strength: 0.85 },
    "direct-disk": { distance: clampDistance(Math.max(26, (rIscoPro ?? 6) * 4)), radius: 0.34, strength: 0.7 },
    "higher-order": { distance: clampDistance(20), radius: 0.14, strength: 0.9 },
    sky: { distance: clampDistance(observerDistance ?? 40), radius: 0.4, strength: 0 },
  };
  return plans[kind] ?? plans.sky;
}

function fixed(value, digits = 4) {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

/** Exact scientific explanation shown when a feature is focused. */
export function kerrFeatureExplanation(kind, renderState, picked = {}) {
  const { radii, aStar } = renderState;
  const rows = {
    horizon: {
      title: "Event horizon and shadow",
      status: "established",
      summary:
        "Black pixels are rays that end at the outer horizon. The dark disc is the image of horizon-capturing rays — the shadow — and is larger than the horizon itself because strong lensing captures rays that never reach it geometrically.",
      formula: "r₊ = M + √(M² − a²)",
      values: [["r₊", fixed(radii.rPlus), "GM/c²"], ["r₋", fixed(radii.rMinus), "GM/c²"], ["a★", fixed(aStar, 3), ""]],
    },
    "photon-region": {
      title: "Photon region and critical curve",
      status: "established",
      summary:
        "Unstable spherical photon orbits fill the region between the prograde and retrograde equatorial photon radii. Rays that graze it spiral before escaping; their images accumulate at the critical curve that bounds the shadow. The ring is drawn only as far as the ray budget resolves it.",
      formula: "r_ph = 2M[1 + cos(⅔ arccos(∓a/M))]",
      values: [["r_ph prograde", fixed(radii.rPhotonPro), "GM/c²"], ["r_ph retrograde", fixed(radii.rPhotonRetro), "GM/c²"]],
    },
    "direct-disk": {
      title: "Direct disk image (order n = 0)",
      status: "effective",
      summary:
        "Light that crossed the equatorial plane once before reaching the observer. Colour is blackbody at T_obs = g·T_emit; brightness scales as g⁴ (Liouville), so the approaching side is hotter and brighter than the receding side. The inner edge is the zero-torque ISCO.",
      formula: "g = 1 / [uᵗ (E − Ω L_z)],  I_obs = g⁴ I_em",
      values: [
        ["r_ISCO (disk edge)", fixed(radii.rIsco), "GM/c²"],
        ["r_ISCO (opposite sense)", fixed(radii.rIscoRetrograde), "GM/c²"],
        ...(picked.g ? [["g at this pixel", fixed(picked.g), ""]] : []),
      ],
    },
    "higher-order": {
      title: `Higher-order image (order ${picked.order == null ? "n ≥ 1" : "n = " + picked.order})`,
      status: "effective",
      summary:
        "Light that crossed the equatorial plane n times before this hit: the disk seen again after bending around the hole. Each successive order is exponentially demagnified and squeezed toward the critical curve. Orders beyond the budget are not drawn, and no ring is thickened for display. Translucent transmittance is a display parameter.",
      formula: "n = number of prior equatorial-plane crossings",
      values: [["order n", picked.order == null ? "≥ 1" : String(picked.order), ""], ["r at hit", fixed(picked.r), "GM/c²"]],
    },
    sky: {
      title: "Lensed background",
      status: "schematic",
      summary: "A seeded synthetic star field at infinity, deflected by the Kerr geometry and filtered over the lensed pixel footprint. Not an observed sky.",
      formula: "I_pixel = ⟨I_sky⟩ over the lensed solid angle",
      values: [],
    },
  };
  return rows[kind] ?? rows.sky;
}

/* ------------------------------------------------------------------ */
/* Temporal accumulation                                               */
/* ------------------------------------------------------------------ */

function q(value) {
  return Number(value).toFixed(6);
}

/** Stable key; any change invalidates the accumulated history. */
export function kerrAccumulationKey({
  aStar, massLog10, inclinationDeg, observer, resolution, backend, quality, diskModel, budget,
  corona = false, jets = false,
}) {
  return [
    q(aStar), q(massLog10), q(inclinationDeg),
    q(observer.r0), q(observer.theta0), q(observer.phi0),
    resolution[0], resolution[1], backend, quality, diskModel,
    budget?.maxSteps ?? 0, budget?.samplesPerFrame ?? 1,
    corona ? 1 : 0, jets ? 1 : 0,
  ].join("|");
}

export class KerrTemporalAccumulator {
  constructor(maxSamples = 1) {
    this.maxSamples = Math.max(1, Math.floor(maxSamples));
    this.key = null;
    this.frame = 0;
    this.resets = 0;
  }

  /** Returns `{ reset, frame, converged }` where `frame` is the index of the sample to add. */
  update(key, maxSamples = this.maxSamples) {
    this.maxSamples = Math.max(1, Math.floor(maxSamples));
    let reset = false;
    if (key !== this.key) {
      this.key = key;
      this.frame = 0;
      this.resets += 1;
      reset = true;
    } else if (this.frame < this.maxSamples) {
      this.frame += 1;
    }
    const converged = this.frame >= this.maxSamples - 1;
    return { reset, frame: Math.min(this.frame, this.maxSamples - 1), converged };
  }
}

function halton(index, base) {
  let f = 1;
  let result = 0;
  let i = index;
  while (i > 0) {
    f /= base;
    result += f * (i % base);
    i = Math.floor(i / base);
  }
  return result;
}

/** Deterministic sub-pixel jitter in [-0.5, 0.5)^2 for sample `index` (Halton 2,3). */
export function kerrJitter(index) {
  return [halton(index + 1, 2) - 0.5, halton(index + 1, 3) - 0.5];
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export function assertNoNonFinite(value, path = "value") {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new RangeError(`${path} is not finite (${value})`);
  } else if (ArrayBuffer.isView(value)) {
    for (let i = 0; i < value.length; i += 1) {
      if (!Number.isFinite(value[i])) throw new RangeError(`${path}[${i}] is not finite`);
    }
  } else if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoNonFinite(entry, `${path}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) assertNoNonFinite(entry, `${path}.${key}`);
  }
  return value;
}

function checksum(array) {
  let hash = 2166136261;
  for (let i = 0; i < array.length; i += 1) {
    hash = Math.imul(hash ^ Math.round(array[i] * 1e6), 16777619) >>> 0;
  }
  return hash;
}

/**
 * Exact numerical state and provenance for QGA_EXPORT_JSON. Every number is
 * validated finite; the lookup-table checksums make the shader inputs
 * reproducible.
 */
export function kerrExportMetadata(atlasState, runtime = {}) {
  const normalized = normalizeKerrState(atlasState);
  const budget = kerrQualityBudget(normalized.quality, { detail3d: runtime.detail3d ?? "medium", reducedMotion: !!runtime.reducedMotion });
  const renderState = buildKerrRenderState(normalized, { budget, observer: runtime.observer, backend: runtime.backend });
  const provenance = registerKerrObservatoryProvenance();
  const payload = {
    kerrSchema: KERR_EXPORT_SCHEMA,
    stateVersion: KERR_STATE_VERSION,
    model: {
      id: "kerr-null-geodesic-observatory",
      status: provenance.status,
      description: provenance.model,
      diskModel: normalized.diskModel,
      diskModelNote: KERR_DISK_MODELS[normalized.diskModel].note,
    },
    observatory: {
      spin: normalized.aStar,
      massSolar: renderState.massSolar,
      inclinationDegrees: normalized.inclinationDeg,
      observerDistance: renderState.observer.r0,
      observerPolarAngle: renderState.observer.theta0,
      exposureEv: normalized.exposureEv,
      annotations: normalized.annotations,
      radii: renderState.radii,
      disk: {
        inner: renderState.disk.rIn,
        outer: renderState.disk.rOut,
        displayPeakKelvin: KERR_RENDER_CONSTANTS.displayPeakKelvin,
        transmittancePerCrossing: renderState.transmittance,
        softEdgeStartFraction: renderState.softEdge ? KERR_PLASMA.edgeStart : null,
        tableChecksum: checksum(renderState.disk.data),
        colorTableChecksum: checksum(renderState.colorTable.data),
      },
      plasma: renderState.plasma
        ? { status: "heuristic", seed: Math.trunc(Number(atlasState.seed ?? 42)) || 42, ...KERR_PLASMA }
        : null,
      volume: {
        capability: renderState.budget.volume === true ? "available" : "gated-off",
        corona: renderState.corona
          ? { status: PLASMA_VOLUME.status, radii: renderState.coronaRadii, ...PLASMA_VOLUME }
          : null,
        jets: renderState.jets
          ? {
            status: JET_FIELD.status,
            blandfordZnajekSpinFactor: blandfordZnajekSpinFactor(renderState.aStar),
            ...JET_FIELD,
          }
          : null,
      },
      observerCoefficients: renderState.observer.coef,
      constants: KERR_RENDER_CONSTANTS,
    },
    numerics: {
      integrator: "RK4 in Mino time on Carter's second-order equations (u = cos theta)",
      requestedQuality: budget.requested,
      effectiveQuality: budget.effective,
      budget: {
        maxSteps: budget.maxSteps, stepK: budget.stepK, temporalSamples: budget.temporalSamples,
        samplesPerFrame: budget.samplesPerFrame, sky: budget.sky,
      },
      backend: runtime.backend ?? "unknown",
      accumulation: {
        frames: runtime.frames ?? 0,
        resets: runtime.resets ?? 0,
        resolution: runtime.resolution ?? [0, 0],
      },
    },
    validity: KERR_OBSERVATORY_PROVENANCE.validity,
    provenance: {
      registryId: KERR_VIEW_ID,
      model: provenance.model,
      status: provenance.status,
      assumptions: provenance.assumptions,
      numericalMethod: provenance.numericalMethod,
      references: provenance.references,
      implementation: "js/science/ + js/visualizations/kerr/",
    },
  };
  return assertNoNonFinite(JSON.parse(JSON.stringify(payload)), "kerrExport");
}
