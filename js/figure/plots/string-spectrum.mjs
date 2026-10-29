import { figure, axis, line, points, rule, callout } from '../spec.mjs';
import { spectrumRows } from '../../science/string-spectrum.mjs';

const MAX_LEVEL = 6;

/**
 * The open bosonic string spectrum: α′M² = N − 1 against oscillator level, with the degeneracy as the stem weight.
 *
 * A stem plot, not a curve: the levels are discrete and the point is the counting. The N = 0 level is the tachyon,
 * drawn in the "open problem" colour and labelled, because a theory whose ground state is unstable must say so.
 */
export function stringSpectrumSpec(maxLevel = MAX_LEVEL) {
  const rows = spectrumRows(maxLevel);
  const maxDegeneracy = Math.max(...rows.map((r) => r.degeneracy));
  const marks = [
    rule({ axis: 'y', value: 0, layer: 'model', color: 'ink-dim', text: { text: 'massless' } }),
    callout({ x: 0, y: -1, dx: 22, dy: -26, layer: 'model', color: 'cat-2', text: { text: 'tachyon: M-squared below zero' } }),
  ];
  for (const row of rows) {
    const color = row.tachyon ? 'cat-2' : 'cat-1';
    marks.push(line({ x: [row.n, row.n], y: [0, row.massSquared], layer: 'model', color }));
    // The stem marker grows with the degeneracy on a square-root scale, so 25 650 does not swallow the plot.
    marks.push(points({
      x: [row.n], y: [row.massSquared], layer: 'data', color,
      radius: 2 + 4 * Math.sqrt(row.degeneracy / maxDegeneracy),
      label: row.n === 1 ? { text: '24 states' } : undefined,
    }));
  }
  return figure({
    id: 'approaches-string-spectrum',
    title: 'The open bosonic string, level by level',
    status: 'established',
    provenanceId: 'approaches-string-spectrum',
    height: 320,
    legend: false,
    x: axis({ scale: { type: 'linear', domain: [-0.4, maxLevel + 0.4] }, ticks: rows.map((r) => r.n), label: { text: 'oscillator level N' } }),
    y: axis({ scale: { type: 'linear', domain: [-1.6, maxLevel - 0.4] }, label: { tex: "\\alpha'M^2 = N - 1" } }),
    marks,
    summary:
      'The free open bosonic string spectrum. Each level N carries the degeneracy that is the coefficient of q^N in ' +
      'the product of (1 - q^n)^(-24), which is the number of ways twenty-four transverse oscillators can supply N ' +
      'units of level: 1, 24, 324, 3200, 25650, ... The stem radius shows that count. The ground state at N = 0 has ' +
      'negative mass squared — the tachyon the bosonic theory cannot avoid, and the reason the superstring replaces it.',
  });
}
