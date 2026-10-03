// Browser bridge for the pure calculations in js/physics.mjs.
const QGA_PHYSICS = {
  schwarzschildRadius(massSolar) { return 2.95 * Number(massSolar); },
  kerrGeometry(spin) {
    const a = Math.min(0.998, Math.max(0, Number(spin) || 0));
    const rPlus = 1 + Math.sqrt(Math.max(0, 1 - a * a));
    const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
    const z2 = Math.sqrt(3 * a * a + z1 * z1);
    const rIsco = 3 + z2 - Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
    const rIscoRetrograde = 3 + z2 + Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
    const rPhoton = 2 * (1 + Math.cos((2 / 3) * Math.acos(-a)));
    const rPhotonRetrograde = 2 * (1 + Math.cos((2 / 3) * Math.acos(a)));
    const surfaceGravity = (rPlus - 1) / (rPlus * rPlus + a * a);
    return {
      a, rPlus, rErgoEquator: 2, rIsco, rIscoRetrograde, rPhoton, rPhotonRetrograde,
      surfaceGravity, temperatureFactor: surfaceGravity / 0.25,
    };
  },
  hawkingTemperature(massSolar, spin = 0) {
    return (6.17e-8 / Number(massSolar)) * this.kerrGeometry(spin).temperatureFactor;
  },
  blackHoleEntropyAreaUnits(massSolar, spin = 0) {
    return 1.05e77 * Number(massSolar) ** 2 * (this.kerrGeometry(spin).rPlus / 2);
  },
  seededRng(seed) {
    let state = (Number(seed) >>> 0) || 1;
    return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
  },
};
window.QGA_PHYSICS = QGA_PHYSICS;
