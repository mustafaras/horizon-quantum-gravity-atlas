import { figure, axis, line, rule, points, region } from '../spec.mjs';
import { GR_TESTS, pull } from '../../science/data/gr-tests.mjs';

export function stretchSpec(run, rs, threshold) {
  const samples = run.snapshots.filter((_, i) => i % 4 === 0 || i === run.snapshots.length - 1);
  const x = samples.map(p => p.radius / rs), y = samples.map(p => p.radialScale);
  const xmax = Math.max(...x) * 1.05, ymax = Math.max(...y) * 1.15;
  const marks = [
    line({ x, y, layer: 'model', color: 'cat-1', focal: true, label: { text: 'radial stretch' } }),
    rule({ axis: 'x', value: 1, layer: 'model', color: 'ink-dim', text: { tex: 'r_s' } }),
  ];
  if (threshold / rs >= 1 && threshold / rs <= xmax) marks.push(rule({ axis: 'x', value: threshold / rs, layer: 'model', color: 'cat-2', text: { tex: 'r_{\\mathrm{tide}}' } }));
  return figure({ id: 'gr-tidal-stretch', title: 'Radial stretch along the fall', status: 'effective', provenanceId: 'gr-tidal-stretch', height: 300,
    x: axis({ scale: { type: 'log', domain: [1, xmax] }, label: { tex: 'r/r_s' } }),
    y: axis({ scale: { type: 'log', domain: [0.9, ymax] }, label: { text: 'stretch factor' } }), marks,
    summary: 'Radial separation divided by its initial value during free fall. The horizon and the chosen differential acceleration threshold are marked when visible.' });
}
export function grPullSpec() {
  const values = GR_TESTS.map(pull), y = GR_TESTS.map((_, i) => GR_TESTS.length - i);
  const marks = [
    region({ x: [-2,2], y: [0.5,7.5], style: 'fill', layer: 'model', color: 'ink-dim', opacity: 0.07 }),
    region({ x: [-1,1], y: [0.5,7.5], style: 'fill', layer: 'model', color: 'cat-1', opacity: 0.12 }),
    rule({ axis: 'x', value: 0, layer: 'model', color: 'ink-strong', text: { text: 'GR' } }),
    points({ x: values, y, xErr: [values.map(() => 1), values.map(() => 1)], layer: 'data', color: 'cat-1', radius: 4, label: { text: 'measurement, one standard error' } }),
  ];
  return figure({ id: 'gr-tests-pull', title: 'Measured deviations from relativity', status: 'established', provenanceId: 'gr-tests-pull', height: 390,
    x: axis({ scale: { type: 'linear', domain: [-3,3] }, label: { tex: '(\\mathrm{measured}-\\mathrm{predicted})/\\sigma' } }),
    y: axis({ scale: { type: 'linear', domain: [0.5,7.5] }, label: { text: 'test number' }, ticks: [1,2,3,4,5,6,7] }), marks,
    summary: 'Seven measurements plotted as deviations from their GR predictions in units of their quoted standard errors. See the accompanying numbered list for sources and limits.' });
}
