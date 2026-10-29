/* S21: Published scales. These are different observables, not a joint exclusion.
 * Energies are eV, lengths are metres; uncertainties are stated in source units.
 * Retrieval date for all source links: 2026-10-29. */
import { C, G, HBAR, SOLAR_MASS } from '../constants.mjs';

export const ELECTRON_VOLT_J = 1.602176634e-19;
export const HBAR_C_EV_M = HBAR * C / ELECTRON_VOLT_J;
export const PLANCK_LENGTH_M = Math.sqrt(HBAR * G / C ** 3);
export const PLANCK_ENERGY_EV = Math.sqrt(HBAR * C ** 5 / G) / ELECTRON_VOLT_J;
export const MPC_M = 3.0856775814913673e22;
export const SCALAR_AMPLITUDE = 2.100e-9; // Planck TT,TE,EE+lowE+lensing, 68% ± 0.030e-9
export const TENSOR_LIMIT = 0.036; // BK18, 95% CL

export function energyFromLength(lengthM) {
  if (!Number.isFinite(lengthM) || lengthM <= 0) throw new RangeError('length must be positive and finite');
  return HBAR_C_EV_M / lengthM;
}
export function lengthFromEnergy(energyEv) {
  if (!Number.isFinite(energyEv) || energyEv <= 0) throw new RangeError('energy must be positive and finite');
  return HBAR_C_EV_M / energyEv;
}
/** Single-field slow-roll, Einstein gravity, reduced Planck mass. Not a direct energy measurement. */
export function inflationEnergyBound(r = TENSOR_LIMIT, amplitude = SCALAR_AMPLITUDE) {
  if (!(r > 0) || !(amplitude > 0) || !Number.isFinite(r) || !Number.isFinite(amplitude)) throw new RangeError('positive finite r and amplitude required');
  return (3 * Math.PI ** 2 * r * amplitude / 2) ** 0.25 * PLANCK_ENERGY_EV / Math.sqrt(8 * Math.PI);
}
const source = (url, citation) => Object.freeze({url, citation, retrieved:'2026-10-29'});
const ref = {
  ew: source('https://arxiv.org/abs/2002.11761','Lee et al., Phys. Rev. Lett. 124, 101101 (2020)'),
  lhc: source('https://home.cern/press/media-kits/run-3/','CERN, LHC Run 3 (2022)'),
  cms: source('https://arxiv.org/abs/2305.07998','CMS, JHEP 12 (2023) 189'),
  fermi: source('https://arxiv.org/abs/0908.1832','Fermi-LAT, Nature 462, 331 (2009), Table 2(a)'),
  gw: source('https://arxiv.org/abs/2112.06861','LIGO–Virgo–KAGRA, Phys. Rev. D 112, 084080 (2025), GWTC-3 v3'),
  eht: source('https://arxiv.org/abs/1906.11243','EHT Collaboration, Astrophys. J. Lett. 875, L6 (2019)'),
  bk: source('https://arxiv.org/abs/2110.00483','BICEP/Keck XIII, Phys. Rev. Lett. 127, 151301 (2021)'),
  icecube: source('https://arxiv.org/abs/1711.08119','IceCube Collaboration, Nature 551, 596 (2017)'),
  xenon: source('https://arxiv.org/abs/2502.18005','XENON Collaboration, arXiv:2502.18005 (2025)'),
  planck: source('https://arxiv.org/abs/1807.06209','Planck Collaboration, Astron. Astrophys. 641, A6 (2020), Table 2'),
};
const inflation = inflationEnergyBound();
const entries = [
  {id:'eotwash',label:'Eöt-Wash',quantity:'detector separation',scaleKind:'length',lo:52e-6,hi:3e-3,bound:'range',cl:null,experiment:'torsion balance',year:2020,reference:ref.ew,uncertainty:'Published tested separation range; not a universal short-distance exclusion.',note:'Inverse-square law tested between 52 μm and 3 mm; limits depend on interaction strength.'},
  {id:'lhc',label:'LHC Run 3',quantity:'proton collision centre-of-mass energy',scaleKind:'energy',lo:13.6e12,hi:13.6e12,bound:'scale',cl:null,experiment:'LHC',year:2022,reference:ref.lhc,uncertainty:'Machine energy, not a confidence interval.',note:'13.6 TeV is collision energy, not energy carried by one parton.'},
  {id:'cms-add',label:'CMS extra dimensions',quantity:'ADD quantum black-hole threshold',scaleKind:'energy',lo:7.5e12,hi:7.5e12,bound:'lower',cl:'95% CL',experiment:'CMS photon + jet, 13 TeV',year:2023,reference:ref.cms,uncertainty:'95% CL model-dependent exclusion.',note:'ADD model with six extra dimensions: thresholds below 7.5 TeV excluded under the paper’s assumptions.'},
  {id:'icecube',label:'IceCube neutrinos',quantity:'neutrino energy in absorption analysis',scaleKind:'energy',lo:6.3e12,hi:980e12,bound:'range',cl:null,experiment:'IceCube',year:2017,reference:ref.icecube,uncertainty:'Cross section 1.30 +0.21/−0.19 (stat.) +0.39/−0.43 (syst.) times the Standard Model prediction.',note:'Neutrino laboratory energies; not centre-of-mass collision energies.'},
  {id:'xenon',label:'XENONnT dark matter',quantity:'hypothesized WIMP mass-energy at strongest limit',scaleKind:'energy',lo:30e9,hi:30e9,bound:'scale',cl:'90% CL',experiment:'XENONnT',year:2025,reference:ref.xenon,uncertainty:'Spin-independent WIMP–nucleon cross section below 1.7 × 10⁻⁴⁷ cm² at 30 GeV/c² (90% CL).',note:'The mark is a tested candidate mass, not a dark-matter detection or exclusion of all 30 GeV particles.'},
  {id:'fermi',label:'Fermi GRB 090510',quantity:'linear LIV scale',scaleKind:'energy',lo:1.19*PLANCK_ENERGY_EV,hi:1.19*PLANCK_ENERGY_EV,bound:'lower',cl:null,experiment:'Fermi-LAT',year:2009,reference:ref.fermi,uncertainty:'Timing bound from Table 2(a); source assumptions apply.',note:'Indirect bound on a specific linear, subluminal dispersion model; not a direct Planck-energy collision.'},
  {id:'gwtc3',label:'GWTC-3',quantity:'graviton mass-energy',scaleKind:'energy',lo:2.42e-23,hi:2.42e-23,bound:'upper',cl:'90% credible',experiment:'LIGO–Virgo–KAGRA',year:2025,reference:ref.gw,uncertainty:'90% credible upper bound.',note:'Mass-energy bound under the tested massive-graviton dispersion model; below the energy axis.'},
  {id:'eht',label:'EHT M87*',quantity:'Schwarzschild radius inferred from mass',scaleKind:'length',lo:2*G*6.5e9*SOLAR_MASS/C**2,hi:2*G*6.5e9*SOLAR_MASS/C**2,bound:'scale',cl:null,experiment:'Event Horizon Telescope',year:2019,reference:ref.eht,uncertainty:'Mass (6.5 ± 0.2 statistical ± 0.7 systematic) × 10⁹ solar masses.',note:'Derived non-spinning reference radius; the observed shadow is not a direct image of the horizon.'},
  {id:'bk',label:'BICEP / Keck',quantity:'inflationary energy scale',scaleKind:'energy',lo:inflation,hi:inflation,bound:'upper',cl:'95% CL on r',experiment:'BICEP/Keck + Planck',year:2021,reference:ref.bk,additionalReferences:[ref.planck],uncertainty:'r < 0.036 at 95% CL; Aₛ = (2.100 ± 0.030) × 10⁻⁹ at 68%.',note:'Derived under single-field slow-roll and Einstein gravity; different confidence levels are not combined.'},
  {id:'cmb',label:'CMB sound horizon',quantity:'comoving sound horizon at last scattering',scaleKind:'length',lo:144.43*MPC_M,hi:144.43*MPC_M,bound:'scale',cl:'68%',experiment:'Planck CMB',year:2018,reference:ref.planck,uncertainty:'144.43 ± 0.26 Mpc in base ΛCDM.',note:'Comoving sound horizon, not distance to the surface of last scattering.'},
  {id:'hubble',label:'Hubble radius',quantity:'c / H₀',scaleKind:'length',lo:C/(67.36*1000/MPC_M),hi:C/(67.36*1000/MPC_M),bound:'scale',cl:'68%',experiment:'Planck CMB',year:2018,reference:ref.planck,uncertainty:'H₀ = 67.36 ± 0.54 km s⁻¹ Mpc⁻¹ in base ΛCDM.',note:'Derived present-day Hubble radius, not a measurement of the observable universe edge.'},
];
export const CONSTRAINTS = Object.freeze(entries.map(Object.freeze));
export const CONSTRAINT_REFERENCES = Object.freeze(ref);
