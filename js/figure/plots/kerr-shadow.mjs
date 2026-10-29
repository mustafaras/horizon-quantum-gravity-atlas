import { figure, axis, line, points, callout } from '../spec.mjs';
import { criticalCurve, SCHWARZSCHILD_CRITICAL_B } from '../../science/kerr-shadow.mjs';
import { EHT_COMPARISONS } from '../../science/data/eht.mjs';

/**
 * The Bardeen critical curve in the observer's sky: alpha across, beta up, in units of M.
 *
 * This is the analytic boundary the ray-traced image must reproduce. At a = 0 it is the circle of radius √27 M;
 * as the spin rises the prograde (left) side flattens inward and the retrograde side bulges out.
 */
export function bardeenSpec({ a = 0, inclinationDeg = 90, height = 340 } = {}) {
  const curve = criticalCurve({ a, inclinationDeg, samples: 240, M: 1 });
  const span = Math.max(6, Math.ceil(Math.max(...curve.alpha.map(Math.abs), ...curve.beta.map(Math.abs))) + 1);
  const marks = [
    line({ x: curve.alpha, y: curve.beta, layer: 'model', focal: true, color: 'cat-1', width: 2 }),
  ];
  if (Math.abs(a) < 1e-12) {
    marks.push(callout({ x: 0, y: SCHWARZSCHILD_CRITICAL_B, dx: -70, dy: -26, layer: 'model', color: 'ink-dim',
      text: { tex: '\\sqrt{27}\\,M = 5.196\\,M' } }));
  } else {
    marks.push(callout({ x: Math.min(...curve.alpha), y: 0, dx: -46, dy: -30, layer: 'model', color: 'ink-dim',
      text: { text: 'prograde edge' } }));
  }
  return figure({
    id: 'bh-bardeen-curve', title: `Critical curve, a = ${a.toFixed(3)}`, status: 'effective',
    provenanceId: 'bh-kerr-shadow', height, legend: false,
    x: axis({ scale: { type: 'linear', domain: [-span, span] }, label: { tex: '\\alpha\\,(M)' } }),
    y: axis({ scale: { type: 'linear', domain: [-span, span] }, label: { tex: '\\beta\\,(M)' } }),
    marks,
    summary:
      'The boundary of the Kerr shadow in the observer sky, from the spherical photon orbits. ' +
      (Math.abs(a) < 1e-12
        ? 'At zero spin it is the circle of radius sqrt(27) M.'
        : 'The prograde side is dragged inward by the frame dragging and the retrograde side bulges out, so the ' +
          'shadow is flattened on one edge.'),
  });
}

/**
 * Predicted against measured for the two EHT targets, in microarcseconds.
 *
 * The measured ring is drawn with its ±1sigma band. The predicted value is a point: it depends only on the mass
 * and distance, both of which carry their own uncertainty.
 */
export function ehtComparisonSpec({ height = 220 } = {}) {
  const rows = EHT_COMPARISONS;
  const y = rows.map((_, i) => rows.length - i);
  const marks = [];
  rows.forEach((row, i) => {
    const at = y[i];
    marks.push(line({ x: [row.predictedUas - row.sigmaUas, row.predictedUas + row.sigmaUas], y: [at, at], layer: 'data', color: 'cat-2', width: 1.4 }));
    marks.push(points({ x: [row.predictedUas], y: [at], layer: 'model', color: 'cat-2', radius: 4, shape: 'triangle-up' }));
    marks.push(line({ x: [row.measuredUas - row.sigmaUas, row.measuredUas + row.sigmaUas], y: [at, at], layer: 'data', color: 'cat-1', width: 2.4 }));
    marks.push(points({ x: [row.measuredUas], y: [at], layer: 'data', color: 'cat-1', radius: 5, label: { text: row.label } }));
    marks.push(callout({ x: row.measuredUas, y: at, dx: 18, dy: -26, layer: 'model', color: 'ink-dim',
      text: { text: `${row.measuredUas} vs ${row.predictedUas.toFixed(2)} mu as` } }));
  });
  return figure({
    id: 'bh-eht-comparison', title: 'Predicted against measured', status: 'effective',
    provenanceId: 'bh-eht-comparison', height, legend: false,
    x: axis({ scale: { type: 'linear', domain: [0, 60] }, ticks: [0, 20, 40, 60], label: { text: 'ring diameter' }, unit: 'mu as' }),
    y: axis({ scale: { type: 'linear', domain: [0.5, rows.length + 0.5] }, ticks: y, label: { text: 'target' } }),
    marks,
    summary:
      'The measured EHT ring diameters (solid) against the predicted Schwarzschild shadow size 2 sqrt(27) GM/(c^2 D) ' +
      '(triangles), with each measurement\'s one-sigma band. The two agree to 5.8 % for M87* and 1.0 % for Sgr A*. ' +
      'The comparison is at the ~10 % level because the ring is calibrated to the shadow through a modelling factor.',
  });
}
