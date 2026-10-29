import { figure, axis, line, rule, callout } from '../spec.mjs';
import { evolveInspiral, polarizations, remnant, ringdownHz, ISCO_X } from '../../science/pn-waveform.mjs';

/**
 * The 3.5PN inspiral: strain against time, with the ISCO marked and the ringdown frequency stated.
 *
 * This is what the old Newtonian chirp could not show. The frequency track is the same curve the audio uses, so a
 * reader can see the moment the post-Newtonian terms start to bend it away from the power law.
 */
export function waveformSpec({ m1 = 36, m2 = 29, inclinationRad = 0.4, height = 260 } = {}) {
  const run = evolveInspiral({ m1, m2, fStartHz: 30, maxTime: 2 });
  const { plus } = polarizations(run, { inclinationRad });
  const t = run.times;
  const fit = remnant({ m1, m2 });
  const qnm = ringdownHz((m1 + m2) * fit.massRatio, fit.spin, 0);
  const tIsco = run.coalescenceTime;
  return figure({
    id: 'gw-pn-waveform', title: `TaylorT4 inspiral, ${m1} + ${m2} solar masses`, status: 'effective',
    provenanceId: 'gw-pn-waveform', height,
    x: axis({ scale: { type: 'linear', domain: [0, tIsco] }, label: { text: 'time to ISCO' }, unit: 's' }),
    y: axis({ scale: { type: 'linear', domain: [-1.05, 1.05] }, label: { tex: 'h_+\\,(\\text{norm.})' } }),
    marks: [
      line({ x: Array.from(t), y: Array.from(plus), layer: 'model', focal: true, color: 'cat-1', width: 1.4 }),
      rule({ axis: 'x', value: tIsco, layer: 'model', color: 'pigment-amber-79-c12', text: { text: 'ISCO' } }),
      callout({ x: tIsco * 0.6, y: 0.8, dx: 16, dy: -16, layer: 'model', color: 'ink-dim',
        text: { text: `ringdown ${qnm.toFixed(0)} Hz` } }),
    ],
    summary:
      `The plus polarisation of a ${m1} + ${m2} solar-mass binary from 30 Hz to the Schwarzschild ISCO, computed at ` +
      `3.5 post-Newtonian order (x = 1/6 at the end). The amplitude and frequency both grow; the fitted remnant has ` +
      `spin ${fit.spin.toFixed(3)} and mass ${fit.massRatio.toFixed(3)} of the initial total, so its (2,2,0) ringdown ` +
      `sits at ${qnm.toFixed(0)} Hz rather than at the fixed 190 Hz the old teaching waveform used.`,
  });
}

/** The frequency track against time: the same evolution, read as a chirp. */
export function waveformFrequencySpec({ m1 = 36, m2 = 29, height = 220 } = {}) {
  const run = evolveInspiral({ m1, m2, fStartHz: 30, maxTime: 2 });
  return figure({
    id: 'gw-pn-frequency', title: 'Frequency track', status: 'effective',
    provenanceId: 'gw-pn-waveform', height, legend: false,
    x: axis({ scale: { type: 'linear', domain: [0, run.coalescenceTime] }, label: { text: 'time to ISCO' }, unit: 's' }),
    y: axis({ scale: { type: 'linear', domain: [0, Math.max(...run.frequency) * 1.1] }, label: { text: 'f' }, unit: 'Hz' }),
    marks: [
      line({ x: Array.from(run.times), y: Array.from(run.frequency), layer: 'model', focal: true, color: 'cat-2' }),
    ],
    summary:
      `The gravitational-wave frequency rising from 30 Hz to the ISCO value under the TaylorT4 evolution. ` +
      `The curve steepens as the post-Newtonian terms dominate; a Newtonian chirp would stay a pure power law.`,
  });
}

export { ISCO_X };
