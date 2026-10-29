import { figure, axis, line, points, region, callout } from '../spec.mjs';
import { SPECTRAL_DIMENSION, convergenceSummary } from '../../science/data/spectral-dimension.mjs';

/** Scale axis: log length, increasing to the right, from the ultraviolet (short) to the infrared (long). */
const X = [1e-3, 1e3];

/**
 * The spectral dimension of each program, drawn as a curve from its ultraviolet value to its infrared one.
 *
 * The x axis is a schematic scale, not a measured one: no program publishes the crossover length, so the figure
 * says so in canvas and puts every program on the same axis only to make the shared 4 → 2 shape visible.
 */
export function spectralDimensionSpec() {
  const marks = [
    region({
      x: [X[0], X[1]], y: [1.6, 1.6],
      style: 'hatch', layer: 'model', color: 'ink-dim',
    }),
    callout({ x: 1, y: 2, dx: 26, dy: -34, layer: 'model', color: 'ink-strong', text: { text: 'ultraviolet and infrared definitions differ' } }),
  ];
  SPECTRAL_DIMENSION.forEach((entry, i) => {
    const color = `cat-${i + 1}`;
    const curve = { x: [X[0], X[1]], y: [entry.uv, entry.ir] };
    marks.push(line({ ...curve, layer: 'model', color, width: 1.6, dash: entry.kind === 'measured' ? null : '4 4' }));
    marks.push(points({ x: [X[0]], y: [entry.uv], layer: 'data', color, radius: entry.kind === 'measured' ? 4.5 : 3, label: { text: entry.label } }));
    marks.push(points({ x: [X[1]], y: [entry.ir], layer: 'data', color, radius: 3 }));
  });
  const summary = convergenceSummary();
  return figure({
    id: 'approaches-spectral-dimension',
    title: 'How many dimensions does a random walk see?',
    status: 'effective',
    provenanceId: 'approaches-spectral-dimension',
    height: 360,
    x: axis({ scale: { type: 'log', domain: X }, ticks: [1e-3, 1e-1, 1e1, 1e3], label: { text: 'scale' }, unit: 'schematic' }),
    y: axis({ scale: { type: 'linear', domain: [1, 4.5] }, ticks: [1, 2, 3, 4], label: { tex: 'd_s' } }),
    marks,
    summary:
      `The spectral dimension of ${summary.count} quantum-gravity programs, each drawn from its ultraviolet value ` +
      `(left) to its infrared one (right). All ${summary.count} run from about 4 at large scales toward about 2 at short ones; ` +
      'only the 4D CDT entry is a measurement on the theory\'s own configurations, the others are analytic or semi-analytic ' +
      'estimates. The scale axis is schematic: the programs define and locate the crossover differently, so this is a ' +
      'qualitative comparison of shape, not a plot of a common quantity.',
  });
}
