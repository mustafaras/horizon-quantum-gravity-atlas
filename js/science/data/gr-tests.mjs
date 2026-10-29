// Observations and quoted uncertainties from primary papers, retrieved 2026-10-28.
// The GPS measured quantity is a fractional redshift deviation, not the operational
// clock correction. Mercury's dimensionless PPN measurement is converted to arcsec/cy
// by multiplying its published 1972 ratio by the computed 42.98 arcsec/cy GR scale.
import { C } from '../tidal.mjs';

const day = 86400;
// WGS 84: https://earth-info.nga.mil/index.php?action=wgs84&dir=wgs84 (retrieved 2026-10-28).
const earthGM = 3.986004418e14; // m^3/s^2
// NASA Earth fact sheet: volumetric mean radius, https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html (retrieved 2026-10-28).
const earthRadius = 6371000; // m, spherical approximation
export function gpsClockOffset(radius = 26560000) {
  if (!Number.isFinite(radius) || radius <= earthRadius) throw new RangeError('orbit must be above the reference sphere');
  const gravitational = earthGM * (1 / earthRadius - 1 / radius) / C ** 2 * day * 1e6;
  const kinematic = -earthGM / (2 * radius * C ** 2) * day * 1e6;
  return { gravitational, kinematic, net: gravitational + kinematic, unit: 'microseconds/day' };
}
const mercuryScale = 42.98;
const rows = [
  { id: 'mercury', label: 'Mercury perihelion', unit: 'arcsec/century', predicted: () => mercuryScale, measured: 1.005 * mercuryScale, sigma: 0.007 * mercuryScale, note: '1972 radar PPN ratio; statistical standard error only, systematic uncertainty about 0.02 in the ratio; solar quadrupole neglected.', citation: 'Shapiro et al. 1972, Phys. Rev. Lett. 28, 1594', url: 'https://doi.org/10.1103/PhysRevLett.28.1594' },
  { id: 'sun', label: 'Solar light deflection', unit: 'arcsec', predicted: () => 1.751, measured: 1.751 * (1 + 0.99983) / 2, sigma: 1.751 * 0.00045 / 2, note: 'VLBI measurement of gamma = 0.99983 +/- 0.00045, converted to the equivalent solar-limb coefficient using (1 + gamma)/2.', citation: 'Shapiro et al. 2004, Phys. Rev. Lett. 92, 121101', url: 'https://doi.org/10.1103/PhysRevLett.92.121101' },
  { id: 'cassini', label: 'Cassini time delay', unit: 'gamma - 1', predicted: () => 0, measured: 2.1e-5, sigma: 2.3e-5, citation: 'Bertotti, Iess & Tortora 2003, Nature 425, 374', url: 'https://doi.org/10.1038/nature01997' },
  { id: 'pound-rebka', label: 'Pound–Rebka redshift', unit: 'observed / predicted', predicted: () => 1, measured: 1.05, sigma: 0.10, citation: 'Pound & Rebka 1960, Phys. Rev. Lett. 4, 337', url: 'https://doi.org/10.1103/PhysRevLett.4.337' },
  { id: 'gps', label: 'GPS redshift test', unit: 'fractional deviation', predicted: () => 0, measured: 0.23e-3, sigma: 1.34e-3, note: 'Eccentric GPS satellites; fractional redshift deviation, not the operational clock correction.', citation: 'Fathollahi, Wu & Pongracic 2023, Heliyon 9, e13178', url: 'https://doi.org/10.1016/j.heliyon.2023.e13178' },
  { id: 's2', label: 'S2 Schwarzschild precession', unit: 'f_SP', predicted: () => 1, measured: 1.10, sigma: 0.19, citation: 'GRAVITY Collaboration 2020, A&A 636, L5', url: 'https://doi.org/10.1051/0004-6361/202037813' },
  { id: 'pulsar', label: 'Hulse–Taylor orbital decay', unit: 'observed / predicted', predicted: () => 1, measured: 0.9983, sigma: 0.0016, note: 'Corrected for kinematic effects.', citation: 'Weisberg & Huang 2016, ApJ 829, 55', url: 'https://doi.org/10.3847/0004-637X/829/1/55' },
];
export const GR_TESTS = Object.freeze(rows.map((row) => Object.freeze({ ...row, retrieved: '2026-10-28' })));
export function pull(entry) {
  if (!entry || !(entry.sigma > 0)) throw new RangeError('a positive measurement uncertainty is required');
  return (entry.measured - entry.predicted()) / entry.sigma;
}
