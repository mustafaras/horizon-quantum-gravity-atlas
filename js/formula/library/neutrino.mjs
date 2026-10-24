/* Neutrino oscillations: the two-flavour vacuum limit and the charged-current matter potential. */

import { defineFormula } from "../formula.mjs";
import { sqrt, mul, div, pow, sin, term } from "../expr.mjs";
import { constants } from "./constants.mjs";
import { PHASE_KM_PER_GEV } from "../../science/neutrino.mjs";

const PDG_2022 = { citation: "Particle Data Group, Review of Particle Physics, PTEP 2022, 083C01", doi: "10.1093/ptep/ptac097", retrieved: "2026-10-24" };

/** P(nu_mu -> nu_tau) = sin^2(2 theta) sin^2(1.267 dm2 L / E) in practical units (eV^2, km, GeV). */
export const twoFlavourOscillation = defineFormula({
  id: "two-flavour-oscillation", title: "Two-flavour vacuum oscillation", status: "established",
  symbols: {
    theta: { tex: "\\theta", unit: "rad", dims: {}, description: "mixing angle" },
    dm2: { tex: "\\Delta m^2", unit: "eV^2", dims: {}, description: "mass-squared difference" },
    L: { tex: "L", unit: "km", dims: {}, description: "baseline" },
    E: { tex: "E", unit: "GeV", dims: {}, description: "neutrino energy" },
    k: { tex: "1.267", unit: "GeV eV^-2 km^-1", dims: {}, description: "1 / (4 hbar c) in these units", constant: PHASE_KM_PER_GEV },
  },
  output: { tex: "P(\\nu_\\mu\\to\\nu_\\tau)", unit: "1", dims: {} },
  expr: term("P", mul(pow(sin(mul(2, "theta")), 2), pow(sin(div(mul("k", "dm2", "L"), "E")), 2))),
  domain: { theta: [0.1, 1.4, "lin"], dm2: [1e-4, 5e-3, "log"], L: [10, 2000, "log"], E: [0.1, 10, "log"] },
  references: [
    { citation: "Maki, Nakagawa & Sakata, Remarks on the unified model of elementary particles, Prog. Theor. Phys. 28, 870 (1962)", doi: "10.1143/PTP.28.870", retrieved: "2026-10-24" },
    PDG_2022,
  ],
});

/** V = sqrt(2) G_F N_e, the energy shift of electron neutrinos in matter (antineutrinos feel -V). */
export const matterPotential = defineFormula({
  id: "matter-potential", title: "Matter potential of electron neutrinos", status: "established",
  symbols: {
    ...constants("GF"),
    Ne: { tex: "N_e", unit: "m^-3", dims: { L: -3 }, description: "electron number density, rho Y_e / m_u" },
  },
  output: { tex: "V", unit: "J", dims: { M: 1, L: 2, T: -2 } },
  expr: term("V", mul(sqrt(2), "GF", "Ne")),
  domain: { Ne: [1e28, 1e32, "log"] },
  references: [
    { citation: "Wolfenstein, Neutrino oscillations in matter, Phys. Rev. D 17, 2369 (1978)", doi: "10.1103/PhysRevD.17.2369", retrieved: "2026-10-24" },
    { citation: "Barger, Whisnant, Pakvasa & Phillips, Matter effects on three-neutrino oscillations, Phys. Rev. D 22, 2718 (1980)", doi: "10.1103/PhysRevD.22.2718", retrieved: "2026-10-24" },
    { citation: "NIST Reference on Constants, Units, and Uncertainty: Fermi coupling constant (CODATA)", url: "https://physics.nist.gov/cgi-bin/cuu/Value?gf", retrieved: "2026-10-24" },
  ],
});
