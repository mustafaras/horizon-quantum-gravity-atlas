import { figure, axis, line, points, heatmap, rule } from '../spec.mjs';
import { CMS_DIMUON, binCentres, poissonErrors, CMS_RESONANCES } from '../../science/data/cms-dimuon.mjs';

/**
 * The CMS dimuon invariant-mass spectrum: real open data with Poisson error bars on a log-log axis.
 *
 * The peaks are the point of the figure — J/psi, psi(2S), the Upsilon family and the Z — and they are *in the data*,
 * not drawn on top of it. The resonance labels mark where the known masses sit, so a reader can see that the data
 * put them there.
 */
export function cmsDimuonSpec({ height = 340 } = {}) {
  const centres = binCentres();
  const counts = CMS_DIMUON.counts;
  const errors = poissonErrors();
  // Only bins with events can be drawn on a log axis; the empty ones would be -infinity.
  const keep = counts.map((c, i) => (c > 0 ? i : -1)).filter((i) => i >= 0);
  const x = keep.map((i) => centres[i]);
  const y = keep.map((i) => counts[i]);
  const yErr = [keep.map((i) => Math.max(0.4, Math.min(errors[i], counts[i] - 0.5))), keep.map((i) => errors[i])];

  const marks = [
    points({ x, y, yErr, layer: 'data', focal: true, color: 'cat-1', radius: 1.6,
      label: { text: 'CMS Run2010B dimuons' } }),
  ];
  for (const r of CMS_RESONANCES) {
    if (r.massGeV < CMS_DIMUON.binEdges[0] || r.massGeV > CMS_DIMUON.binEdges[CMS_DIMUON.binEdges.length - 1]) continue;
    marks.push(rule({ axis: 'x', value: r.massGeV, layer: 'model', color: 'ink-dim', text: { text: r.label } }));
  }
  return figure({
    id: 'exp-cms-dimuon', title: 'J/psi to Z, in real CMS open data', status: 'established',
    provenanceId: 'exp-cms-dimuon', height, legend: false,
    x: axis({ scale: { type: 'log', domain: [2, 120] }, label: { text: 'dimuon invariant mass' }, unit: 'GeV' }),
    y: axis({ scale: { type: 'log', domain: [0.7, Math.max(...counts) * 1.4] }, label: { text: 'events per 0.25 GeV' } }),
    marks,
    summary:
      `The dimuon invariant-mass spectrum from ${CMS_DIMUON.eventsRead} events of the CMS Run2010B public Mu dataset ` +
      `(CERN Open Data record 700, ${CMS_DIMUON.doi}, CC0). The peaks at 3.1, 3.7, 9.5-10.4 and 91 GeV are the ` +
      `J/psi, psi(2S), the Upsilon family and the Z — they are in the measured data, not drawn on top of it. Error ` +
      `bars are sqrt(N). This is a 2010 dataset at low luminosity: the Z is a handful of events, which is why the ` +
      `axis is logarithmic.`,
  });
}

/**
 * The Q-transform of the strain, with the template's frequency track as the focal line.
 *
 * The heatmap carries the time-frequency energy and the line carries what the search actually found; putting them
 * on the same axes is what lets a reader see whether the track follows the power.
 */
export function qTransformSpec({ transform, track = null, height = 300, title = 'Q-transform' } = {}) {
  if (!transform) throw new TypeError("qTransformSpec needs a computed transform");
  const { times, frequencies, energy } = transform;
  // The heatmap wants rows of columns; energy is already times × frequencies.
  const z = times.map((_, ti) => Array.from(energy[ti]));
  let max = 0;
  for (const row of z) for (const v of row) if (v > max) max = v;
  const marks = [
    heatmap({
      x: [times[0], times[times.length - 1]],
      y: [frequencies[0], frequencies[frequencies.length - 1]],
      z, palette: 'viridis', zDomain: [0, max > 0 ? max : 1], layer: 'data',
    }),
  ];
  if (track) marks.push(line({ x: times, y: track, layer: 'model', focal: true, color: 'ink-strong', width: 2.5,
    label: { text: 'best template' } }));
  return figure({
    id: 'exp-gw-qtransform', title, status: 'effective',
    provenanceId: 'gw-qtransform', height, legend: Boolean(track),
    x: axis({ scale: { type: 'linear', domain: [times[0], times[times.length - 1]] }, label: { text: 'time' }, unit: 's' }),
    y: axis({ scale: { type: 'log', domain: [frequencies[0], frequencies[frequencies.length - 1]] }, label: { text: 'frequency' }, unit: 'Hz' }),
    marks,
    summary:
      'A constant-Q time-frequency map of the strain. The bright track is the chirp: the frequency rises with time ' +
      'because the binary tightens. The overlaid line is the best template the bank returned, so the search result ' +
      'and the raw time-frequency power can be compared directly. The tile widths grow at low frequency, which is ' +
      'what lets one picture show both the long early inspiral and the short late one.',
  });
}
