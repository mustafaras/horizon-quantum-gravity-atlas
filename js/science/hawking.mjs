/**
 * Hawking radiation lab — pure compute contract for Prompt 07.
 *
 * Temperatures and evaporation times come from the SHARED black-hole science
 * APIs (js/physics.mjs → js/science/kerr.mjs); nothing here re-derives them.
 * The lab adds: a relative emission-power model, deterministic particle
 * samples from the Planckian spectral shape, and an explicit extremal-limit
 * model that reaches zero emission without any division by zero.
 *
 * Honest boundaries (mirrored in provenance):
 * - The pair-production animation is SCHEMATIC. The heuristic picture is a
 *   visualization aid, not the derivation (Bogoliubov transformations are).
 * - Emission brightness uses a DISPLAY AMPLIFICATION factor that is always
 *   reported alongside the physical rate; it changes visibility, never data.
 * - The shared kerrGeometry clamps spin at 0.998 (Thorne bound). The
 *   extremal-limit model here is the un-clamped a* → 1 behavior of the same
 *   surface-gravity formula, computed with explicit guards.
 */

import {
  hawkingTemperature, kerrGeometry, hawkingSpectralShape,
  blackHoleEvaporationTimeYears, seededRng,
} from "../physics.mjs";
import { getVisualizationProvenance, registerVisualization } from "./provenance.mjs";

export const HAWKING_LAB_VIEW_ID = "bh-hawking-lab";

export const HAWKING_LAB_DEFAULTS = Object.freeze({
  massSolar: 10,        // solar masses (bhMass state is reused by the lab)
  spin: 0,              // |a*| < 1
  amplification: 100,   // display-only gain, always disclosed
  samples: 220,         // deterministic emission samples per batch
});

export const HAWKING_LAB_PROVENANCE = Object.freeze({
  model: "Hawking temperature and evaporation time from the shared Schwarzschild/Kerr science APIs; emission visuals are a schematic pair-production animation over a Planckian sample spectrum",
  status: "schematic",
  assumptions: [
    "Temperature T = ℏc³/(8πGMk_B) × temperatureFactor(a*) and evaporation time 2.1e67 (M/M☉)³ yr come from js/physics.mjs unchanged",
    "The pair-production picture at the horizon is a heuristic visualization; the actual effect is mode mixing across the collapsing geometry",
    "Emission brightness multiplies the physical relative power by a DISPLAY AMPLIFICATION factor disclosed in the UI, export, and accessibility text",
    "Standard Model species are assumed massless at the displayed temperature; greybody factors are not applied",
  ],
  validity: [
    "Semiclassical regime only: M ≫ Planck mass; the endpoint of evaporation is not modeled",
    "The shared geometry clamps spin at a* ≤ 0.998 (Thorne bound); the extremal-limit curve is the guarded a* → 1 behavior of the same surface-gravity formula and reaches exactly zero at a* = 1",
    "Sample spectra are deterministic (seeded) draws from x³/(e^{x/T}−1) up to normalization — a shape, not a measured spectrum",
  ],
  numericalMethod:
    "Relative power P ∝ A · T⁴ with A = (r₊/2)² in GM/c² units; particle energies by seeded rejection sampling of hawkingSpectralShape; "
    + "extremal factor κ(a*) = (r₊ − r₋)/(2(r₊² + a*²)) evaluated with |a*| ≤ 1 guards (no division by zero; κ(1) = 0)",
  references: [
    "Prompt 07 spec: docs/superpowers/plans/2026-10-08-ultra-realistic-atlas-prompts.md",
    "Hawking, Commun. Math. Phys. 43 (1975) 199",
    "Page, Phys. Rev. D 13 (1976) 198 (emission rates and species)",
  ],
});

export function registerHawkingLabProvenance() {
  if (!getVisualizationProvenance(HAWKING_LAB_VIEW_ID)) {
    registerVisualization(HAWKING_LAB_VIEW_ID, HAWKING_LAB_PROVENANCE);
  }
  return HAWKING_LAB_PROVENANCE;
}

/**
 * Reference temperature of the lab's normalization: a 10 M☉, a* = 0 hole,
 * taken from the shared API so the reference can never drift from it.
 */
export function referenceTemperatureK() {
  return hawkingTemperature(10, 0);
}

/**
 * Un-clamped surface-gravity factor κ(a*)/(κ_Schwarzschild-normalized) with
 * explicit extremal handling. Returns { factor, extremal } where factor is
 * normalized so a* = 0 gives 1 (matching kerrGeometry().temperatureFactor).
 */
export function extremalTemperatureFactor(spin) {
  const a = Math.min(1, Math.max(-1, Math.abs(Number(spin)) || 0));
  if (a >= 1) return { factor: 0, extremal: true };
  const root = Math.sqrt(Math.max(0, 1 - a * a));
  const rPlus = 1 + root;
  const rMinus = 1 - root;
  const kappa = (rPlus - rMinus) / (2 * (rPlus * rPlus + a * a));
  // a* = 0: κ = (2−0)/(2·4) = 0.25 — same normalization as kerrGeometry.
  return { factor: kappa / 0.25, extremal: false };
}

/**
 * Full lab state for a (mass, spin) choice. Physical quantities come from
 * the shared APIs; `relativePower` is the emission model; `displayGain`
 * exposes the amplification so no consumer has to guess it.
 */
export function hawkingLabState({
  massSolar = HAWKING_LAB_DEFAULTS.massSolar,
  spin = HAWKING_LAB_DEFAULTS.spin,
  amplification = HAWKING_LAB_DEFAULTS.amplification,
} = {}) {
  const m = Number(massSolar);
  if (!Number.isFinite(m) || m <= 0) throw new RangeError("hawkingLabState requires massSolar > 0");
  const a = Math.min(1, Math.max(-1, Number(spin) || 0));
  const gain = Math.max(1, Math.min(1e6, Number(amplification) || 1));
  const geometry = kerrGeometry(a); // shared, Thorne-clamped
  const temperatureK = hawkingTemperature(m, a); // shared
  const extremal = extremalTemperatureFactor(a);
  const areaUnits = (geometry.rPlus * geometry.rPlus) / 4; // A/16π in M² units
  // Normalized to a 10 M☉, a* = 0 hole (the shared API's own value, so the
  // reference can never drift from the shared temperature model).
  const tRef = hawkingTemperature(10, 0);
  const relativePower = areaUnits * Math.pow(temperatureK / tRef, 4);
  return {
    massSolar: m,
    spin: a,
    temperatureK,
    temperatureFactor: geometry.temperatureFactor,
    extremalFactor: extremal.factor,
    extremal: extremal.extremal,
    horizonRadiusUnits: geometry.rPlus,
    evaporationYears: blackHoleEvaporationTimeYears(m),
    relativePower,
    displayGain: gain,
    displayPower: relativePower * gain,
  };
}

/**
 * Deterministic emission samples: energies drawn from the Planckian shape by
 * seeded rejection sampling, angles spread over the outward hemisphere.
 * `count` is capped so scenes stay bounded; the batch is reproducible.
 */
export function sampleEmission({
  massSolar = HAWKING_LAB_DEFAULTS.massSolar, spin = 0,
  seed = 42, count = HAWKING_LAB_DEFAULTS.samples,
} = {}) {
  const lab = hawkingLabState({ massSolar, spin, amplification: 1 });
  // Sample in units of kT so the shape is temperature-independent, then
  // scale energies by the temperature.
  const rng = seededRng(seed);
  const n = Math.max(1, Math.min(2048, Math.trunc(Number(count)) || HAWKING_LAB_DEFAULTS.samples));
  const t = 1; // shape parameter: x in units of T
  // Envelope: exponential proposal q(x) = e^{-x/3}/3 (mean 3). The ratio
  // shape/q peaks at ≈ 14.0 (x ≈ 4.4), so M = 14.2 gives ~45 % acceptance
  // and the guard below is never the limiting factor.
  const M = 14.2;
  const out = [];
  let guard = 0;
  while (out.length < n && guard < n * 60) {
    guard += 1;
    const x = -Math.log(1 - rng()) * 3;
    const q = Math.exp(-x / 3) / 3;
    const accept = hawkingSpectralShape(x, t) / (M * q);
    if (rng() < Math.min(1, Math.max(0, accept))) {
      const azimuth = rng() * Math.PI * 2;
      const cosPolar = rng(); // outward hemisphere around the escaping direction
      out.push({
        energyOverT: x,
        azimuth,
        cosPolar,
        // Escaping fraction heuristic: radial escape cone, deterministic.
        escapes: cosPolar > 0.25,
      });
    }
  }
  return { temperatureK: lab.temperatureK, samples: out, seed: seed >>> 0 };
}

/**
 * Extremal-limit curve for the spin slider: T(a*)/T(0) at fixed mass,
 * monotone non-increasing, exactly 0 at |a*| = 1, always finite.
 */
export function extremalCurve({ samples = 64 } = {}) {
  const n = Math.max(8, Math.min(512, Math.trunc(Number(samples)) || 64));
  const out = new Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const a = i / n;
    const { factor, extremal } = extremalTemperatureFactor(a);
    out[i] = { spin: a, temperatureRatio: factor, extremal };
  }
  return out;
}

/** Export metadata for the Hawking lab (mirrors gwInstrumentExportMetadata). */
export function hawkingExportMetadata(state, runtime = {}) {
  let lab = null;
  try {
    lab = hawkingLabState({
      // bhMass is the site-wide log10(M/M☉) slider value; convert to solar masses.
      massSolar: state?.bhMass != null ? Math.pow(10, Number(state.bhMass)) : HAWKING_LAB_DEFAULTS.massSolar,
      spin: state?.bhSpin ?? 0,
      amplification: state?.hawkingLabAmplify ?? HAWKING_LAB_DEFAULTS.amplification,
    });
  } catch {
    lab = null;
  }
  return {
    hawkingLab: {
      view: HAWKING_LAB_VIEW_ID,
      massSolar: lab?.massSolar ?? null,
      spin: lab?.spin ?? null,
      temperatureK: lab?.temperatureK ?? null,
      extremal: lab?.extremal ?? false,
      relativePower: lab?.relativePower ?? null,
      displayAmplification: lab?.displayGain ?? null,
      schematicPairProduction: true,
      runtime: { kind: runtime.kind || null, particles: runtime.particles || null },
      provenance: { status: HAWKING_LAB_PROVENANCE.status },
    },
  };
}
