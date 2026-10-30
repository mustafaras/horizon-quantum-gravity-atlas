// Experiment plots: gravitational-wave strain and spectrogram, and the dielectron invariant-mass histogram.

import { figure, axis, line, points, rule, step, region, heatmap } from "../spec.mjs";

const ceilPos = (v) => Math.max(1, Math.ceil(v));

function timeAxis(duration, label) {
  return axis({ scale: { type: "linear", domain: [0, duration] }, label });
}

/**
 * Strain traces with a ghost of the full signal, the revealed portion up to the playhead, the merger
 * marker and phase bands. `h1`/`l1` are `{ samples, duration, mergerIndex, sampleRate }` (generated) or
 * `real` is `{ samples, duration, start }` (GWOSC observation).
 */
export function strainSpec({ mode, h1, l1, real, playT, amax, height = 220 }) {
  // A real-data mode with no data yet is a transient state: the fetch is in flight. Falling back to the generated
  // trace keeps the panel mounted; reading `real.duration` here crashed the whole experiments view while a GWOSC
  // load was in progress, and the fallback is what the panel shows anyway until the observation arrives.
  const useReal = mode === "real" && real;
  const src = useReal ? real : h1;
  if (!src?.samples?.length) throw new TypeError("strainSpec needs samples");
  const duration = useReal ? real.duration : h1.duration;
  const n = src.samples.length;
  const t = Array.from({ length: n }, (_, i) => (i / (n - 1)) * duration);
  const frac = Math.min(1, Math.max(0, playT / duration));
  const upto = Math.max(2, Math.min(n, Math.round(frac * (n - 1)) + 1));
  const tr = t.slice(0, upto);
  const half = amax / 0.88; // traces use 44 % of the plot height either side of zero
  const marks = [];
  let colorMain, colorSecond;
  if (!useReal) {
    const tMerge = h1.mergerIndex / h1.sampleRate;
    const m0 = Math.max(0, tMerge - 0.12), m1 = tMerge + 0.02;
    colorMain = "pigment-azure-76"; colorSecond = "pigment-orange-84-c13";
    marks.push(region({ x: [0, m0], style: "fill", layer: "model", color: colorMain, text: { text: "INSPIRAL" } }));
    marks.push(region({ x: [m0, m1], style: "fill", layer: "model", color: colorSecond }));
    marks.push(region({ x: [m1, duration], style: "fill", layer: "model", color: "pigment-violet-73", text: { text: "RINGDOWN" } }));
    marks.push(rule({ axis: "x", value: tMerge, layer: "model", color: colorSecond, dash: "4 4", text: { text: "merger" } }));
    marks.push(line({ x: t, y: Array.from(l1.samples), layer: "model", color: colorSecond, opacity: 0.2 }));
    marks.push(line({ x: t, y: Array.from(h1.samples), layer: "model", color: colorMain, opacity: 0.2 }));
    marks.push(line({ x: tr, y: Array.from(l1.samples.slice(0, upto)), layer: "model", color: colorSecond, width: 1.3, label: "L1 +7 ms" }));
    marks.push(line({ x: tr, y: Array.from(h1.samples.slice(0, upto)), layer: "model", focal: true, color: colorMain, width: 1.3, label: "H1 Hanford" }));
  } else {
    colorMain = "accent-2";
    marks.push(line({ x: t, y: Array.from(real.samples), layer: "data", color: colorMain, opacity: 0.2 }));
    marks.push(line({ x: tr, y: Array.from(real.samples.slice(0, upto)), layer: "data", focal: true, color: colorMain, width: 1.3, label: "GWOSC strain" }));
  }
  if (frac > 0) marks.push(rule({ axis: "x", value: playT, layer: useReal ? "data" : "model", color: "ink-strong", dash: null }));
  return figure({
    id: useReal ? "gw-strain-observation" : "gw-strain-generated",
    title: useReal ? "Strain h(t), GWOSC observation" : "Strain h(t), generated and seeded",
    status: useReal ? "established" : "effective", provenanceId: "gw-strain", height,
    x: timeAxis(duration, { text: useReal ? `time since GPS ${real.start.toFixed(0)} (s)` : "time (s)" }),
    y: axis({ scale: { type: "linear", domain: [-half, half] }, label: { tex: "h(t)" } }),
    marks,
    summary: useReal ? `${n} samples of calibrated strain, normalised, over ${duration.toFixed(1)} s.` : "Seeded two-detector waveform: inspiral, merger and ringdown.",
  });
}

/** STFT magnitude in dB as a magma heat map, revealed up to the playhead, with the analytic chirp track. */
export function spectrogramSpec({ spec, playT, duration, freqTrack, label, height = 190 }) {
  const frac = Math.min(1, Math.max(0, playT / duration));
  const cols = Math.min(spec.frames, ceilPos(frac * spec.frames));
  const floor = spec.maxDb - 46;
  const z = Array.from({ length: spec.bins }, (_, b) => {
    const row = new Array(cols);
    for (let f = 0; f < cols; f++) row[f] = spec.magnitudes[f * spec.bins + b];
    return row;
  });
  const marks = [];
  if (frac > 0) marks.push(heatmap({ z, x: [0, (cols / spec.frames) * duration], y: [0, spec.nyquist], palette: "magma", zDomain: [floor, spec.maxDb], layer: "data" }));
  if (freqTrack && frac > 0) {
    const n = freqTrack.length, upto = Math.round(frac * (n - 1));
    const xs = [], ys = [];
    for (let i = 0; i <= upto; i += 4) if (freqTrack[i] > 0) { xs.push((i / (n - 1)) * duration); ys.push(freqTrack[i]); }
    if (xs.length > 1) marks.push(line({ x: xs, y: ys, layer: "model", focal: true, color: "ink-strong", width: 1.2, label: "analytic chirp" }));
  }
  if (frac > 0) marks.push(rule({ axis: "x", value: playT, layer: "data", color: "ink-strong", dash: null }));
  return figure({
    id: "gw-spectrogram", title: `Time–frequency map, ${label}`, status: "effective", provenanceId: "gw-spectrogram", height,
    x: timeAxis(duration, { text: "time (s)" }),
    y: axis({ scale: { type: "linear", domain: [0, spec.nyquist] }, label: { text: "frequency" }, unit: "Hz" }),
    marks,
    summary: `Hann short-time Fourier transform, ${spec.frames} frames by ${spec.bins} frequency bins; colour is magnitude in dB over a 46 dB range.`,
  });
}

/** Invariant-mass histogram with Poisson error bars and the Z window highlighted. */
export function invariantMassSpec({ bins, imMin, imMax, binWidth, mZ, windowLo = 86, windowHi = 96, height = 300 }) {
  const n = bins.length;
  const edges = Array.from({ length: n + 1 }, (_, i) => imMin + i * binWidth);
  const counts = [...bins, bins[n - 1]];
  const present = bins.map((c, i) => ({ c, x: imMin + (i + 0.5) * binWidth })).filter(({ c }) => c > 0);
  const maxC = Math.max(8, ...bins);
  const marks = [
    region({ x: [windowLo, windowHi], style: "fill", layer: "data", color: "pigment-azure-80-c13", text: { tex: "Z\\ \\text{window}" } }),
    rule({ axis: "x", value: mZ, layer: "data", color: "pigment-amber-79-c12", dash: "4 4", text: { tex: `Z^0\\ ${mZ.toFixed(2)}\\ \\text{GeV}` } }),
    step({ x: edges, y: counts, layer: "data", color: "pigment-azure-60", width: 1.2 }),
  ];
  if (present.length) {
    marks.push(points({ x: present.map((p) => p.x), y: present.map((p) => p.c), layer: "data", focal: true, color: "pigment-blue-91", radius: 2.6,
      yErr: [present.map((p) => Math.min(p.c, Math.sqrt(p.c))), present.map((p) => Math.sqrt(p.c))], label: "events (Poisson errors)" }));
  }
  return figure({
    id: "experiments-dielectron-mass", title: "Dielectron invariant mass", status: "schematic", provenanceId: "experiments-dielectron-mass", height,
    x: axis({ scale: { type: "linear", domain: [imMin, imMax] }, label: { tex: "m(e^+e^-)" }, unit: "GeV" }),
    y: axis({ scale: { type: "linear", domain: [0, maxC * 1.08] }, label: { text: `events / ${binWidth.toFixed(1)} GeV` } }),
    marks,
    summary: "Seeded pseudo-experiment: smooth Drell-Yan continuum plus a Breit-Wigner Z peak that rises out of the background as collisions accumulate.",
  });
}
