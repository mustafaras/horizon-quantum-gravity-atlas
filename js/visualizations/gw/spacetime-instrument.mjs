/**
 * Spacetime instrument — pure visualization contract for Prompt 06.
 *
 * Maps a gravitational-wave bundle (h+, hx sampled in time) onto a 3-D
 * "spacetime fabric" state that both render backends consume. Nothing here
 * touches THREE, the DOM, or audio: it is the single source of truth for
 * particle layout, quality budgets, and the field-from-timeline mapping, so
 * the WebGL2 and WebGPU(TSL) runtimes render identically from these numbers.
 *
 * Physics note (pedagogical amplification):
 *   A passing plus-polarized wave produces the proper-detector-frame tidal
 *   deformation  dx = +h+/2 · x, dz = -h+/2 · z  and the cross wave swaps the
 *   axes with hx. Real strains (~1e-21) move a lab-scale lattice by ~1e-21 m;
 *   the visual gain here is a deliberate pedagogical amplification, always
 *   labeled as such in the provenance below. Propagation is shown with a
 *   radial delay (finite wave speed across the lattice) so the waveform can
 *   be seen travelling outward from the detector's location — an
 *   effective-mode visualization, not a literal metric simulation.
 */

import { GW_REAL_MODE } from "../../science/gravitational-waves.mjs";
import { getVisualizationProvenance, registerVisualization } from "../../science/provenance.mjs";
import { REF } from "../../science/references.mjs";

export const GW_INSTRUMENT_VIEW_ID = "exp-gw-spacetime-instrument";

export const GW_INSTRUMENT_PROVENANCE = Object.freeze({
  model: "Detector-frame quadrupolar tidal deformation of a visual lattice driven by the loaded strain bundle h(t) (or h+, hx)",
  status: "effective",
  assumptions: [
    "Displacement amplitude is a pedagogical amplification of strains ~1e-21; it is not a literal arm-length change",
    "Radial propagation delay across the lattice is an effective visualization of finite wave speed, not a curved-spacetime metric solution",
    "Detector orientations used for antenna patterns are illustrative, labeled pedagogical values",
    "Generated (synthetic) bundles carry explicit synthetic provenance; real GWOSC previews carry real-strain provenance; the instrument never mixes the two",
  ],
  validity: [
    "Displays the loaded preview bundle only (<=2048 texels per detector row); sub-texel features of the 4 kHz product are not visualized",
    "The lattice samples the strain linearly in texel space, matching the readout panels; it is not a geodesic-deviation integration over an extended body",
    "WebGPU compute and WebGL2 backends implement the same displacement map from this contract; visual identity is by construction, not per-pixel parity",
  ],
  numericalMethod:
    "Per-node displacement dx = (h+ x - hx z)/2, dz = -(hx x + h+ z)/2 evaluated at lagged time t - r*lag, "
    + "h sampled with linear interpolation from a float DataTexture (WebGL2 vertex shader) or a storage buffer staged from the same rows (WebGPU compute kernel); "
    + "envelope is a 0.995-decay running peak used for glow, size, and color grading",
  references: [
    REF.MAGGIORE,
    REF.LIGO_GW150914,
  ],
  layers: [{ name: "Lattice displacement from the loaded strain bundle", class: "model" }, { name: "Strain-bundle texture (observed or synthetic)", class: "data" }, { name: "Particle glow and envelope grading", class: "decoration" }],
  seed: "Generated bundles carry the URL state seed (key seed, default 42); real GWOSC bundles are not seeded",
});

export function registerGwInstrumentProvenance() {
  if (!getVisualizationProvenance(GW_INSTRUMENT_PROVENANCE_MODEL_KEY)) {
    registerVisualization(GW_INSTRUMENT_PROVENANCE_MODEL_KEY, GW_INSTRUMENT_PROVENANCE);
  }
  return GW_INSTRUMENT_PROVENANCE;
}

/* Registry key under which the instrument is filed. */
const GW_INSTRUMENT_PROVENANCE_MODEL_KEY = "gw-spacetime-instrument";

/** Quality budget: particle counts per detail tier and motion preference. */
export const GW_PARTICLE_BUDGETS = Object.freeze({
  cinematic: 120000,
  high: 64000,
  balanced: 32000,
  battery: 12000,
  reducedMotion: 8000,
  max: 160000,
});

export function particleBudget({ detail3d = "balanced", reducedMotion = false, particleBudget = null } = {}) {
  if (reducedMotion) return clampInt(GW_PARTICLE_BUDGETS.reducedMotion, 1024, GW_PARTICLE_BUDGETS.max);
  const tier = GW_PARTICLE_BUDGETS[detail3d] ?? GW_PARTICLE_BUDGETS.balanced;
  return clampInt(particleBudget ?? tier, 1024, GW_PARTICLE_BUDGETS.max);
}

const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v) || lo)));

/* Square lattice side length for a target particle count (rows = cols). */
export function latticeSide(count) {
  const side = Math.max(2, Math.round(Math.sqrt(count)));
  return { side, total: side * side };
}

/**
 * Rest layout on the x-z plane: centered square lattice, one vertex per
 * lattice node, deterministic (no RNG — the lattice is regular by design;
 * `seed` only jitters per-node phase so the shimmer stays reproducible).
 *
 * Returns Float32Array [x, z, r, phase] × total  (r = radius 0..1, phase rad).
 */
export function buildLattice({ side, extent = 9, seed = 42 }) {
  const total = side * side;
  const out = new Float32Array(total * 4);
  const jitter = mulberry32(seed >>> 0);
  const half = (side - 1) / 2;
  const spacing = (2 * extent) / Math.max(1, side - 1);
  for (let iz = 0; iz < side; iz++) {
    for (let ix = 0; ix < side; ix++) {
      const i = (iz * side + ix) * 4;
      const x = (ix - half) * spacing;
      const z = (iz - half) * spacing;
      const r = Math.min(1, Math.hypot(x, z) / (extent * Math.SQRT2));
      out[i] = x;
      out[i + 1] = z;
      out[i + 2] = r;
      out[i + 3] = jitter() * Math.PI * 2;
    }
  }
  return { positions: out, total, extent, spacing };
}

/** Tiny deterministic PRNG (same idiom as the rest of the atlas). */
function mulberry32(a) {
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Uniform data a runtime uploads per signal row:
 * RGBA float per texel = (normalized time, h+, hx, |h| running envelope).
 * `plus`/`cross` arrays are used when the bundle carries them (generated
 * chirps); single-channel detector strain fills both h+ = h, hx = 0.
 * Width is capped so a 1200-sample GWOSC preview and a 2048-sample generated
 * chirp both fit one texture row; nearest sampling keeps texel->time exact.
 */
export const GW_SIGNAL_TEXEL_MAX = 2048;

export function buildSignalTextureRows(bundles) {
  const rows = bundles.filter(Boolean).map((b) => {
    const plus = (b.plus && b.plus.length ? b.plus : (b.display ?? b.raw ?? b.samples)) || [];
    const cross = (b.cross && b.cross.length ? b.cross : null);
    const width = Math.max(2, Math.min(GW_SIGNAL_TEXEL_MAX, plus.length));
    const data = new Float32Array(width * 4);
    let env = 0;
    for (let i = 0; i < width; i++) {
      const x0 = Math.floor((i / (width - 1)) * (plus.length - 1));
      const h = plus[x0] ?? 0;
      const hx = cross ? (cross[x0] ?? 0) : 0;
      env = Math.max(env * 0.995, Math.max(Math.abs(h), Math.abs(hx)));
      data[i * 4] = i / (width - 1);
      data[i * 4 + 1] = h;
      data[i * 4 + 2] = hx;
      data[i * 4 + 3] = env;
    }
    return { width, data };
  });
  const width = rows.length ? Math.max(...rows.map((r) => r.width)) : 2;
  const height = Math.max(1, rows.length);
  const merged = new Float32Array(width * height * 4);
  rows.forEach((r, row) => {
    for (let i = 0; i < r.width; i++) {
      for (let c = 0; c < 4; c++) merged[(row * width + i) * 4 + c] = r.data[i * 4 + c];
    }
  });
  return { width, height: merged.length / (width * 4), data: merged, rows: rows.length };
}

/**
 * Field state at a timeline instant for one bundle: the values a CPU-side
 * element (detector arms, readouts) needs. Interpolates exactly like the
 * shader would (linear in texel space).
 */
export function fieldStateAtTime(bundle, timeSeconds, { propagationDelaySeconds = 0 } = {}) {
  if (!bundle) return { hPlus: 0, hCross: 0, envelope: 0, real: false };
  const src = bundle.raw ?? bundle.samples;
  const plus = bundle.plus ?? src;
  const cross = bundle.cross ?? null;
  const t = Number(timeSeconds) - propagationDelaySeconds;
  const hPlus = sampleSeries(plus, bundle.sampleRate, t);
  const hCross = cross ? sampleSeries(cross, bundle.sampleRate, t) : 0;
  return { hPlus, hCross, envelope: Math.min(1, Math.hypot(hPlus, hCross) * 1.15), real: bundle.provenance?.mode === GW_REAL_MODE };
}

function sampleSeries(samples, sampleRate, time) {
  if (!samples || !samples.length) return 0;
  const x = Math.max(0, Math.min(samples.length - 1, (Number(time) || 0) * (Number(sampleRate) || 1)));
  const i0 = Math.floor(x);
  const i1 = Math.min(samples.length - 1, i0 + 1);
  const f = x - i0;
  return samples[i0] * (1 - f) + samples[i1] * f;
}

/**
 * Split-layout transform for two detectors (H1/L1): returns per-row offset
 * along x so the lattice can render side by side, and the light-travel delay
 * between rows shown by the transport (pedagogical Hanford–Livingston
 * 7 ms, scaled for visibility).
 */
export function splitLayout({ detectors = ["H1"] }, { separation = 13 } = {}) {
  const active = detectors.length >= 2 ? ["H1", "L1"] : ["H1"];
  return Object.freeze({
    rows: active.map((d, i) => Object.freeze({
      detector: d,
      offsetX: (i - (active.length - 1) / 2) * separation,
      delaySeconds: d === "L1" ? 0.007 : 0,
    })),
  });
}

/** Timeline <-> audio sync tolerance from the spec (50 ms). */
export const GW_SYNC_TOLERANCE_MS = 50;

export function syncDriftMs(aSeconds, bSeconds) {
  return Math.abs((Number(aSeconds) || 0) - (Number(bSeconds) || 0)) * 1000;
}

/**
 * JSON-export metadata for the GW instrument view (mirrors the Kerr export
 * branch): what the instrument was showing, on which backend, with which
 * provenance. Pure; `runtime` is the published window.__qgaGwRuntime frame.
 */
export function gwInstrumentExportMetadata(state, runtime = {}) {
  return {
    gwInstrument: {
      view: GW_INSTRUMENT_VIEW_ID,
      source: {
        mode: state.gwMode,
        event: state.gwMode === "real" ? state.gwEvent : null,
        detector: state.gwDetector,
        startGps: state.gwMode === "real" ? state.gwStart : null,
        durationSeconds: state.gwMode === "real" ? state.gwDuration : 4,
        seed: state.gwMode === "generated" ? state.seed : null,
        massesSolar: state.gwMode === "generated" ? [state.gwM1, state.gwM2] : null,
      },
      audio: {
        mode: state.gwAudioMode,
        pitch: state.gwPitch,
        volume: state.gwVolume,
        loop: state.gwLoop === true,
        enabled: runtime.audioEnabled === true,
        note: "Audio only ever starts from an in-page gesture; exports never imply sound played.",
      },
      runtime: {
        kind: runtime.kind ?? null,
        particles: runtime.particles ?? null,
        rows: runtime.rows ?? null,
        timelineTime: runtime.timelineTime ?? null,
      },
      provenance: GW_INSTRUMENT_PROVENANCE,
    },
  };
}
