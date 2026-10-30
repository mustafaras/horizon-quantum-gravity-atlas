/**
 * The constant-Q transform (S27).
 *
 * A Q-transform tiles the time-frequency plane with tiles whose width in time and frequency are tied by Q: a
 * narrow, low-frequency tile is long in time and a high-frequency tile is short, so every tile holds the same
 * number of oscillation cycles. That is what makes a chirp legible — a plain STFT smears the low-frequency part
 * across too few cycles to resolve and the high-frequency part across too few samples.
 *
 * Each tile is a windowed complex exponential; the magnitude of the windowed sum is the tile's energy. This is a
 * direct evaluation rather than an FFT per octave, which keeps the module small and exact at the cost of speed;
 * the sizes used here are chosen so it stays interactive.
 */

import { REF } from "./references.mjs";

export const QTRANSFORM_PROVENANCE = Object.freeze({
  id: "gw-qtransform",
  model:
    "Constant-Q time-frequency energy of the strain, with a logarithmic frequency axis and Q-tied tile widths",
  status: "effective",
  assumptions: Object.freeze([
    "Energy is the magnitude of a windowed sum, not a normalised power spectral density",
    "The tile grid is drawn on a fixed logarithmic axis, so a tile's width is not the same in time at every frequency",
    "The data may be synthetic: the caption says which fixture is loaded and never presents a generated signal as an observation",
  ]),
  validity: Object.freeze([
    "The transform is exact for the samples it is given; what it shows inherits the provenance of those samples",
    "A chirp appears as a track whose slope is the frequency evolution, not as a measurement of the source parameters",
  ]),
  numericalMethod: "Direct windowed complex exponential per constant-Q tile, accumulated into a time-frequency grid",
  references: Object.freeze([REF.CHATTERJI_2004_QTRANSFORM]),
  layers: Object.freeze([
    { name: "Time-frequency energy", class: "data" },
    { name: "Frequency and time axes", class: "model" },
  ]),
  seed: "none: the transform is deterministic",
});

/**
 * The tile sizes for a Q-transform: for quality factor Q and frequency f, the tile lasts `qcycles` cycles, so its
 * time width is qcycles·Q/(2πf) — narrower at high frequency, wider at low.
 */
export function tileWidth(frequency, q = 8, sampleRate = 128) {
  if (!(frequency > 0)) throw new RangeError("frequency must be positive");
  return Math.max(1, Math.round((q * sampleRate) / (2 * Math.PI * frequency)));
}

/**
 * Compute the Q-transform on a logarithmic frequency grid.
 *
 * Returns `{ times, frequencies, energy }` with `energy[t][f]`, normalised to its own maximum so a figure can map
 * it to a sequential palette without knowing the absolute strain scale.
 */
export function qTransform(samples, { sampleRate = 128, q = 8, fMin = 20, fMax = null, bins = 48, hop = 4 } = {}) {
  if (!samples?.length) throw new RangeError("qTransform needs samples");
  if (!(q > 0)) throw new RangeError("q must be positive");
  const nyquist = sampleRate / 2;
  const top = Math.min(fMax ?? nyquist * 0.95, nyquist * 0.95);
  if (!(top > fMin)) throw new RangeError("fMax must exceed fMin and sit below Nyquist");
  if (!Number.isInteger(bins) || bins < 4) throw new RangeError("bins must be an integer of at least 4");
  if (!Number.isInteger(hop) || hop < 1) throw new RangeError("hop must be a positive integer");

  const logMin = Math.log(fMin), logMax = Math.log(top);
  const frequencies = Array.from({ length: bins }, (_, i) => Math.exp(logMin + ((logMax - logMin) * i) / (bins - 1)));
  const times = [];
  for (let i = 0; i < samples.length; i += hop) times.push(i / sampleRate);

  const energy = times.map(() => new Float64Array(bins));
  let peak = 0;
  for (let ti = 0; ti < times.length; ti++) {
    const centre = ti * hop;
    for (let bi = 0; bi < bins; bi++) {
      const f = frequencies[bi];
      const width = tileWidth(f, q, sampleRate);
      // A Hann-style taper over the tile, so its edges do not contribute a spurious step.
      let re = 0, im = 0, norm = 0;
      const half = Math.max(1, Math.floor(width / 2));
      for (let k = -half; k <= half; k++) {
        const idx = centre + k;
        if (idx < 0 || idx >= samples.length) continue;
        const taper = 0.5 * (1 + Math.cos((Math.PI * k) / (half + 1)));
        const w = taper * samples[idx];
        const phase = (2 * Math.PI * f * k) / sampleRate;
        re += w * Math.cos(phase);
        im -= w * Math.sin(phase);
        norm += taper;
      }
      const value = norm > 0 ? Math.hypot(re, im) / norm : 0;
      energy[ti][bi] = value;
      if (value > peak) peak = value;
    }
  }
  if (peak > 0) for (const row of energy) for (let bi = 0; bi < bins; bi++) row[bi] /= peak;
  return { times, frequencies, energy, q, normalised: true };
}

/** The frequency with the largest energy at each time, which is the track a chirp traces. */
export function dominantTrack(transform) {
  const { energy, frequencies } = transform;
  return energy.map((row) => {
    let best = 0, at = 0;
    for (let i = 0; i < row.length; i++) if (row[i] > best) { best = row[i]; at = i; }
    return frequencies[at];
  });
}
