import { getVisualizationProvenance, registerVisualization } from './provenance.mjs';
import { REF } from './references.mjs';
import { GR_TESTS } from './data/gr-tests.mjs';

const entries = {
  'gr-tidal-ring': {
    model: 'An initially circular ring of freely falling test particles deformed by the linear Schwarzschild tidal tensor around a radial free-fall centre.', status: 'effective',
    assumptions: ['Non-rotating uncharged vacuum source; initially comoving particles; separation is small compared with the radius', 'Centre follows the exact radial geodesic from rest; the ring uses linear geodesic deviation with Newtonian-form tidal eigenvalues in a radially comoving orthonormal frame', 'Ring size is normalized at each instant to fit the view; only its axis ratio represents the deformation', 'The body is not self-gravitating and internal material forces are omitted'],
    validity: ['Linear separation approximation; exterior region shown'], numericalMethod: 'RK4 of radial and transverse geodesic deviation against the exact parametric proper-time radial infall; S08 GPU compute displays the integrated axes.',
    references: [REF.MTW, REF.SCHWARZSCHILD], layers: [{name:'Test-particle ring and reference axes',class:'model'}], seed:'none',
  },
  'gr-tidal-stretch': {
    model: 'Radial separation divided by its initial value along the exact free-fall centre; linear geodesic deviation.', status:'effective',
    assumptions:['Point particles initially comoving; no self-gravity or material strength', 'Threshold marks a selected differential acceleration over a two-metre body, not a universal destruction radius'],
    validity:['Linear separation limit; radial infall from rest'], numericalMethod:'Fixed-step RK4 using exact parametric centre trajectory, js/science/tidal.mjs.', references:[REF.MTW, REF.SCHWARZSCHILD], layers:[{name:'Stretch curve and radius markers',class:'model'}], seed:'none',
  },
  'gr-tests-pull': {
    model:'Published observations compared to corresponding GR predictions in units of their quoted standard errors.', status:'established',
    assumptions:['Each row compares a different observable; the rows are not a combined fit and may share systematic effects', 'Mercury uses statistical error only with an additional reported systematic limit', 'The GPS observation is a fractional redshift test; the clock correction is separately calculated', 'The solar deflection row translates the VLBI gamma measurement into a solar-limb equivalent using (1+gamma)/2'],
    validity:['Individual experiments and assumptions as stated in their sources'], numericalMethod:'(measured - predicted) / quoted sigma; sources and values in js/science/data/gr-tests.mjs.', references:GR_TESTS.map(x => `${x.citation}, ${x.url}`), layers:[{name:'Reported measurements and errors',class:'data'},{name:'GR prediction and sigma bands',class:'model'}], seed:'none',
  },
};
export function registerTidalProvenance() {
  for (const [id, entry] of Object.entries(entries)) if (!getVisualizationProvenance(id)) registerVisualization(id, entry);
}
