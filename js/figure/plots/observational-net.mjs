import { figure, axis, line, points, rule, region, callout } from '../spec.mjs';
import {
  PLANCK_2018, PLANCK_ENERGY_GEV, FERMI_BOUND, BICEP_KECK_BOUND, EOT_WASH_BOUND,
  DARK_ENERGY_LENGTH_MICRONS, timeDelay, slowRollPredictions,
} from '../../science/observational-net.mjs';

/**
 * Lorentz-violation time of flight from GRB 090510.
 *
 * The curves are the delay a linear dispersion relation predicts if the quantum-gravity scale were one or ten Planck
 * energies. The Fermi bound is a *lower* limit on that scale, so the region it excludes is everything below the
 * E_QG = E_Pl curve: the data say the scale is at least that high.
 */
export function lorentzDelaySpec({ height = 300 } = {}) {
  const energies = [10, 30, 100, 300, 1000, 3000, 10000];
  const atPlanck = energies.map((E) => timeDelay({ energy1GeV: E, redshift: FERMI_BOUND.redshift, eQgGeV: PLANCK_ENERGY_GEV }));
  const atTenPlanck = energies.map((E) => timeDelay({ energy1GeV: E, redshift: FERMI_BOUND.redshift, eQgGeV: 10 * PLANCK_ENERGY_GEV }));
  return figure({
    id: 'exp-lorentz-delay', title: 'Lorentz violation: how late a high-energy photon arrives', status: 'effective',
    provenanceId: 'exp-observational-net', height,
    x: axis({ scale: { type: 'log', domain: [10, 10000] }, label: { text: 'photon energy' }, unit: 'GeV' }),
    y: axis({ scale: { type: 'log', domain: [1e-3, 1e3] }, label: { text: 'arrival delay' }, unit: 's' }),
    marks: [
      line({ x: energies, y: atPlanck, layer: 'model', focal: true, color: 'cat-1', width: 2.2,
        label: { tex: 'E_{QG} = E_P' } }),
      line({ x: energies, y: atTenPlanck, layer: 'model', color: 'cat-2', dash: '5 4', width: 1.6,
        label: { tex: 'E_{QG} = 10\\,E_P' } }),
      points({ x: [FERMI_BOUND.energyGeV], y: [timeDelay({ energy1GeV: FERMI_BOUND.energyGeV, redshift: FERMI_BOUND.redshift, eQgGeV: PLANCK_ENERGY_GEV })],
        layer: 'data', color: 'cat-3', radius: 5, label: { text: 'Fermi 31 GeV photon' } }),
      rule({ axis: 'x', value: FERMI_BOUND.energyGeV, layer: 'model', color: 'ink-dim' }),
    ],
    summary:
      `The arrival delay a linear Lorentz-violation term would produce for a photon from GRB 090510 (z = ${FERMI_BOUND.redshift}), ` +
      `computed with the Planck 2018 cosmology. At E_QG = E_Planck a 31 GeV photon would arrive about 1.2 s late; at ten ` +
      `times that scale, a tenth as late. Fermi measured no such delay and so placed a lower limit E_QG > ` +
      `${FERMI_BOUND.eQgOverEPlanck} E_Planck — the bound excludes scales *below* the solid curve, and it is a limit ` +
      `within the burst's emission model, not a measured transition.`,
  });
}

/**
 * The (n_s, r) plane: three inflationary potentials against the BICEP/Keck bound.
 *
 * The predictions are curves because N is not known to better than 50-60 e-folds; the data are a limit on r, drawn
 * as a shaded region above which the models are excluded.
 */
export function tensorScalarSpec({ height = 320 } = {}) {
  const rows = slowRollPredictions({ nMin: 50, nMax: 60, samples: 21 });
  const phiX = rows.map((r) => r.phiSquared.ns), phiY = rows.map((r) => r.phiSquared.r);
  const starX = rows.map((r) => r.starobinsky.ns), starY = rows.map((r) => r.starobinsky.r);
  const natX = rows.map((r) => r.natural.ns), natY = rows.map((r) => r.natural.r);
  return figure({
    id: 'exp-tensor-scalar', title: 'Inflation: the (n_s, r) plane', status: 'effective',
    provenanceId: 'exp-observational-net', height,
    x: axis({ scale: { type: 'linear', domain: [0.94, 1.04] }, label: { tex: 'n_s' } }),
    y: axis({ scale: { type: 'log', domain: [1e-3, 0.3] }, label: { tex: 'r' } }),
    marks: [
      region({ x: [0.94, 1.04], y: [BICEP_KECK_BOUND.rUpper, 0.3], style: 'hatch', layer: 'data', color: 'ink-dim' }),
      callout({ x: 0.995, y: 0.12, dx: 0, dy: 0, layer: 'data', color: 'ink-dim',
        text: { text: 'r > 0.036 excluded at 95% CL' } }),
      rule({ axis: 'y', value: BICEP_KECK_BOUND.rUpper, layer: 'data', color: 'cat-3', dash: null }),
      line({ x: phiX, y: phiY, layer: 'model', color: 'cat-1', width: 2, label: { tex: '\\phi^2' } }),
      line({ x: starX, y: starY, layer: 'model', color: 'cat-2', width: 2, label: { tex: 'R^2' } }),
      line({ x: natX, y: natY, layer: 'model', color: 'cat-4', width: 2, dash: '5 4', label: { text: 'natural, f = 5' } }),
    ],
    summary:
      `First-order slow-roll predictions for three potentials between N = 50 and 60 e-folds, against the BICEP/Keck ` +
      `95 % CL upper limit r < ${BICEP_KECK_BOUND.rUpper}. The phi^2 curve sits well above the bound — it is excluded; ` +
      `R^2 sits below it and remains viable; natural inflation with f = 5 M_Pl lies in between. The predicted n_s is ` +
      `near the Planck value ${PLANCK_2018.ns} for the first two, which is a real success of the simplest models. ` +
      `The band is a limit on r, not a detection.`,
  });
}

/**
 * The Eöt-Wash short-range bound: one published point, not an invented contour.
 *
 * The paper states a single exclusion at gravitational strength, so the figure draws that point and the separation
 * range it was measured over. A smooth α(λ) curve would have looked more impressive and would have been fabricated.
 */
export function shortRangeSpec({ height = 260 } = {}) {
  return figure({
    id: 'exp-short-range', title: 'Short-range gravity: where the 1/r² law has been tested', status: 'effective',
    provenanceId: 'exp-observational-net', height,
    x: axis({ scale: { type: 'log', domain: [5, 3000] }, label: { text: 'Yukawa range' }, unit: 'μm' }),
    y: axis({ scale: { type: 'linear', domain: [0, 1.2] }, label: { tex: '|\\alpha|' } }),
    marks: [
      region({ x: [5, EOT_WASH_BOUND.lambdaMicrons], y: [0, 1.2], style: 'hatch', layer: 'data',
        color: 'ink-dim', text: { text: 'excluded at alpha = 1' } }),
      points({ x: [EOT_WASH_BOUND.lambdaMicrons], y: [EOT_WASH_BOUND.alphaStrength], layer: 'data', focal: true,
        color: 'cat-1', radius: 5, shape: 'triangle-down', label: { text: 'Eöt-Wash 2020' } }),
      rule({ axis: 'x', value: EOT_WASH_BOUND.separationRangeMicrons[0], layer: 'model', color: 'ink-dim' }),
      rule({ axis: 'x', value: EOT_WASH_BOUND.separationRangeMicrons[1], layer: 'model', color: 'ink-dim' }),
      callout({ x: DARK_ENERGY_LENGTH_MICRONS, y: 0.9, dx: 14, dy: -22, layer: 'model', color: 'cat-2',
        text: { text: 'dark-energy length ~85 um' } }),
    ],
    summary:
      `The Eöt-Wash 2020 result over separations of 52 μm to 3.0 mm. The paper states one exclusion: gravitational-` +
      `strength (α = 1) Yukawa interactions with ranges below ${EOT_WASH_BOUND.lambdaMicrons} μm are ruled out at 95 % CL. ` +
      `It publishes no full α-λ contour, so only the stated point is drawn. The 85 μm mark is the range a light scalar ` +
      `coupled to the dark-energy density would mediate, which is why this experiment matters for cosmology.`,
  });
}
