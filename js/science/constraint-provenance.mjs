import { getVisualizationProvenance, registerVisualization } from './provenance.mjs';
import { CONSTRAINTS } from './data/constraints.mjs';
const entries={
  'planck-constraint-plane': {
    model:'Published experimental limits and physical scales compared on a reduced wavelength versus energy map',status:'effective',
    assumptions:['The diagonal E = hbar c / L is a conversion, not an identity for all experiments','Fermi and graviton bounds are indirect and model-dependent; collider energy is not an exclusion of all shorter distances','Points outside the energy axis are clipped to the boundary and identified in the list','Hatched Planck corner indicates no direct Planck-energy experiment, not absence of indirect constraints'],
    validity:['Individual source confidence levels and modelling assumptions differ; this is not a joint statistical fit'],
    numericalMethod:'Closed-form scale conversion and Planck units; source values in js/science/data/constraints.mjs',
    references:CONSTRAINTS.flatMap(e=>[e.reference.citation+' '+e.reference.url,...(e.additionalReferences||[]).map(r=>r.citation+' '+r.url)]),
    layers:[{name:'Published experimental scales',class:'data'},{name:'Reduced wavelength, Planck rules and crosshair',class:'model'},{name:'Hatched Planck corner and marker guides',class:'model'}],seed:'none',
  },
  'planck-spin-spectra': {
    model:'Single-link LQG area levels and equal-spin four-valent Barbieri quantum-tetrahedron volume levels',status:'conjectural',
    assumptions:['Immirzi parameter gamma = 1 is a chosen convention, not a measured constant','Equal spins on all four links; the volume levels depend on intertwiner and operator convention','The existing 3D node sizing is a schematic Cayley–Menger proxy, not these eigenvalues'],
    validity:['Half-integer j from 1/2 to 2; LQG as a description of spacetime is conjectural'],
    numericalMethod:'Closed-form area spectrum and Jacobi diagonalization of the finite tridiagonal volume-squared operator',
    references:['Bianchi & Haggard, Phys. Rev. D 86, 124010 (2012), doi:10.1103/PhysRevD.86.124010; https://arxiv.org/abs/1208.2228'],
    layers:[{name:'Area and volume eigenvalues',class:'model'}],seed:'none',
  },
};
export function registerConstraintProvenance(){for(const [id,entry] of Object.entries(entries)) if(!getVisualizationProvenance(id)) registerVisualization(id,entry);}
