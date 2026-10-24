// Provenance entries for every Figure Kit figure. Layer classes are carried by each mark
// (`data` or `model`); the entries below state what the figure is and what it is not.

import { getVisualizationProvenance, registerVisualization } from "../science/provenance.mjs";

const PDG = "Particle Data Group, Review of Particle Physics, PTEP 2022, 083C01, doi:10.1093/ptep/ptac097";
const HAWKING = "Hawking, Particle creation by black holes, Commun. Math. Phys. 43, 199 (1975), doi:10.1007/BF02345020";
const PAGE = "Page, Information in black hole radiation, Phys. Rev. Lett. 71, 3743 (1993), doi:10.1103/PhysRevLett.71.3743";

export const FIGURE_PROVENANCE = Object.freeze({
  "sm-neutrino-oscillation": {
    model: "Two-flavour vacuum neutrino oscillation P = sin^2(2 theta) sin^2(1.27 dm2 L/E)",
    status: "established",
    assumptions: ["Two-flavour approximation of the three-flavour PMNS mixing", "Vacuum propagation; matter effects are neglected", "Defaults are the atmospheric values dm2_32 ~ 2.5e-3 eV^2 and sin^2 2 theta_23 ~ 0.98"],
    validity: ["L/E from 0 to 1200 km/GeV", "Muon-neutrino survival and tau appearance only"],
    numericalMethod: "Closed form sampled at 301 points; no fitting",
    references: [PDG],
  },
  "sm-higgs-potential": {
    model: "Radial slice of V(phi) = mu^2 phi^2 + lambda phi^4 with lambda = 1",
    status: "schematic",
    assumptions: ["Dimensionless units with lambda = 1; the vertical scale is not the physical electroweak scale", "The slice is the radial direction of the complex doublet"],
    validity: ["Qualitative shape of the symmetric and broken phases only"],
    numericalMethod: "Closed form sampled at 241 points",
    references: [PDG],
  },
  "bh-hawking-spectrum": {
    model: "Planck spectral shape x^3 / (exp(x/T) - 1), normalised to its peak",
    status: "schematic",
    assumptions: ["Visual temperature maps the mass and spin sliders to a shift of the peak; the absolute scale is illustrative", "Greybody factors are not included"],
    validity: ["Peak position trend with mass and spin"],
    numericalMethod: "Closed form sampled at 201 points",
    references: [HAWKING],
  },
  "bh-page-curve": {
    model: "Unitary Page curve S = min(thermal, remaining) against the semiclassical rising entropy",
    status: "schematic",
    assumptions: ["Piecewise-linear Page curve with the peak at half the evaporation", "Entropies are normalised, not in bits"],
    validity: ["Shape of the curve; the Page time is the midpoint by construction"],
    numericalMethod: "Closed form sampled at 101 points",
    references: [PAGE, HAWKING],
  },
  "gr-effective-potential": {
    model: "Schwarzschild effective potential V = -GM/r + L^2/2r^2 - GM L^2/(c^2 r^3) for a massive test body, against the Newtonian V = -GM/r + L^2/2r^2",
    status: "effective",
    assumptions: ["Test body on a bound orbit around a non-rotating mass; scene units with G = c = 1 scaled by the mass slider", "Turning points are roots of V = E found numerically, not the Newtonian a(1 +/- e)", "The Newtonian branch diverges near the star and leaves the plotted window by design"],
    validity: ["Outside the photon sphere (the scan starts at 1.02 r_ph)", "Single selected body"],
    numericalMethod: "Closed-form potential sampled at 201 points; turning points by 48-step bisection on a 401-point scan",
    references: ["Misner, Thorne & Wheeler, Gravitation (1973), chapter 25", "Schwarzschild, On the gravitational field of a mass point according to Einstein's theory (1916), arXiv:physics/9905030"],
  },
  "rg-scale-trajectory": {
    model: "Running coupling g(mu) from dg/dln(mu) = beta(g) for the selected model (one-loop QED or QCD, or an illustrative toy flow)",
    status: "effective",
    assumptions: ["One-loop beta functions for the QED and QCD presets; the Gaussian, linear and polynomial presets are pedagogical toys and the figure status says so", "Trajectory integrated numerically up to the alpha = 1 display boundary, where it terminates", "The asymptotic-safety preset is an illustrative polynomial, not evidence about quantum gravity"],
    validity: ["Weak coupling for the one-loop presets; displayed up to alpha = 1 only"],
    numericalMethod: "Numerical integration of the flow (js/physics.mjs rgFlow); fixed points by root finding of beta",
    references: ["Gross & Wilczek, Ultraviolet behavior of non-abelian gauge theories, Phys. Rev. Lett. 30, 1343 (1973), doi:10.1103/PhysRevLett.30.1343", "Politzer, Reliable perturbative results for strong interactions?, Phys. Rev. Lett. 30, 1346 (1973), doi:10.1103/PhysRevLett.30.1346"],
  },
  "rg-beta-function": {
    model: "Beta function beta(g) and phase line of the selected RG model",
    status: "effective",
    assumptions: ["Same models and caveats as the scale-trajectory figure", "Arrows give the sign of the flow toward the ultraviolet"],
    validity: ["Domain 0 <= g <= display maximum"],
    numericalMethod: "Closed-form beta sampled at 151 points; fixed points and slopes from js/physics.mjs",
    references: ["Gross & Wilczek, Phys. Rev. Lett. 30, 1343 (1973), doi:10.1103/PhysRevLett.30.1343"],
  },
  "qft-dispersion": {
    model: "Klein-Gordon dispersion omega^2 = c^2 k^2 + m^2 of the scalar-field lab, with the massless light cone",
    status: "schematic",
    assumptions: ["Lab units c^2 = 30 and an effective mass 3m; the vertical scale is fixed so changing m lifts the curve", "Single scalar amplitude, not a spinor or gauge field"],
    validity: ["Qualitative mass-gap picture"],
    numericalMethod: "Closed form sampled at 121 points",
    references: ["Peskin & Schroeder, An Introduction to Quantum Field Theory (1995), chapter 2"],
  },
  "qft-waterfall": {
    model: "Two Gaussian wave packets with a cosine carrier converging, interacting at tau = 0.5 and receding at the scattering angle",
    status: "schematic",
    assumptions: ["Pedagogical packet trajectories along the beam axis, not a solved wave equation", "Colour is signed amplitude on a diverging scale"],
    validity: ["Cartoon of a collision; carries no cross-section information"],
    numericalMethod: "Closed form on a 220 by 130 grid",
    references: ["Peskin & Schroeder, An Introduction to Quantum Field Theory (1995), chapter 4"],
  },
  "qft-angular-distribution": {
    model: "Leading-order angular distribution of the selected process normalised to its 90 degree value",
    status: "effective",
    assumptions: ["s-channel: 1 + cos^2 theta in the massless limit; t-channel: the leading 1/sin^4(theta/2) pole only; Compton: Klein-Nishina with a free energy ratio x", "The vertical axis is clipped at 20 times the 90 degree value so the forward pole stays on screen"],
    validity: ["Leading order, tree level"],
    numericalMethod: "Closed form sampled at 241 points (js/physics.mjs angularDistribution)",
    references: ["Peskin & Schroeder, An Introduction to Quantum Field Theory (1995), section 5.1", "Klein & Nishina, Z. Phys. 52, 853 (1929), doi:10.1007/BF01366453"],
  },
  "qft-photon-cross-section": {
    model: "Photon-exchange total cross-section sigma = 4 pi alpha^2 / (3 s) for e+e- to mu+mu- in the massless limit",
    status: "established",
    assumptions: ["Massless fermions and a fixed fine-structure constant alpha", "Z exchange is not included on this curve"],
    validity: ["Away from the Z pole and above the muon threshold"],
    numericalMethod: "Closed form sampled at 261 points, in nanobarns (js/physics.mjs qftTotalCrossSection)",
    references: ["Peskin & Schroeder, An Introduction to Quantum Field Theory (1995), section 5.1", PDG],
  },
  "qft-z-resonance": {
    model: "Breit-Wigner line shape m^2 Gamma^2 / ((s - m^2)^2 + m^2 Gamma^2) at the Z pole",
    status: "established",
    assumptions: ["Fixed mass 91.1876 GeV and width 2.4952 GeV (PDG)", "Shape normalised to one at the pole; initial-state radiation and the running width are neglected"],
    validity: ["Within three widths of the pole"],
    numericalMethod: "Closed form sampled at 261 points (js/physics.mjs breitWignerResonance)",
    references: [PDG],
  },
  "gw-strain": {
    model: "Strain h(t): a seeded two-detector inspiral-merger-ringdown waveform, or a GWOSC calibrated strain preview",
    status: "effective",
    assumptions: ["Generated waveforms are leading-order quadrupole inspiral with a seeded merger and ringdown, not a numerical-relativity template", "Observed traces are downsampled and normalised for display; the vertical axis is not calibrated strain", "The playhead reveals the trace progressively; the faint ghost is the full signal"],
    validity: ["Qualitative waveform morphology"],
    numericalMethod: "Seeded generator (js/physics.mjs) or GWOSC fetch; normalisation by the peak absolute sample",
    references: ["Abbott et al. (LIGO Scientific and Virgo), Observation of gravitational waves from a binary black hole merger, Phys. Rev. Lett. 116, 061102 (2016), doi:10.1103/PhysRevLett.116.061102"],
  },
  "gw-spectrogram": {
    model: "Hann short-time Fourier transform of the displayed strain, magnitude in dB over a 46 dB range",
    status: "effective",
    assumptions: ["This is an STFT, not a Q-transform", "The analytic chirp track is shown for generated signals only"],
    validity: ["Frequencies up to the Nyquist limit of the displayed sample rate"],
    numericalMethod: "Windowed FFT (js/physics.mjs stftSpectrogram) with the stated window and hop",
    references: ["Allen & Rabiner, A unified approach to short-time Fourier analysis and synthesis, Proc. IEEE 65, 1558 (1977), doi:10.1109/PROC.1977.10770"],
  },
  "experiments-dielectron-mass": {
    model: "Seeded pseudo-experiment of the dielectron invariant mass: Drell-Yan continuum plus a Breit-Wigner Z peak with Gaussian smearing",
    status: "schematic",
    assumptions: ["Illustrative distributions, not a tuned detector simulation", "Counts carry Poisson error bars sqrt(N)", "Random numbers come from the seeded generator of the atlas state"],
    validity: ["Mass window 60 to 120 GeV in 1.5 GeV bins"],
    numericalMethod: "Inverse-transform sampling with the seeded generator; histogramming",
    references: [PDG, "UA1 Collaboration, Experimental observation of lepton pairs of invariant mass around 95 GeV/c^2 at the CERN SPS collider, Phys. Lett. B 126, 398 (1983), doi:10.1016/0370-2693(83)90188-0"],
  },
  "gr-null-geodesics": {
    model: "Exact Schwarzschild null geodesics in the orbital plane, integrated with the stepper of the 3D light fan",
    status: "effective",
    assumptions: ["Non-rotating mass; scene units with G = c = 1 scaled by the mass slider", "Rays start far outside the frame; the part inside the window of 2.5 b_crit is drawn", "Captured rays are integrated down to 1.02 r_s"],
    validity: ["Impact parameters from 0.55 to 2.4 b_crit"],
    numericalMethod: "js/physics.mjs grNullTrajectory with a fixed step; winding number from the accumulated deflection",
    references: ["Misner, Thorne & Wheeler, Gravitation (1973), chapter 25", "Darwin, The gravity field of a particle, Proc. R. Soc. A 249, 180 (1959), doi:10.1098/rspa.1959.0015"],
  },
  "gr-lensed-sky": {
    model: "Per-pixel Schwarzschild lensing of a procedural background sky: beta = theta - alpha(b), b = D sin theta, with alpha from the exact deflection integral",
    status: "effective",
    assumptions: ["Observer on the lens axis; azimuthal-equidistant source sky; the two background sources are analytic, not baked", "The sky texture is illustrative, not a survey image", "Rays with b below b_crit are captured and drawn black"],
    validity: ["Field of view 2.5 theta_E"],
    numericalMethod: "Tabulated deflection alpha(b) from the same integrator as the null-geodesic panel, sampled per pixel (js/visualizations/gr/lensed-sky.mjs)",
    references: ["Luminet, Image of a spherical black hole with thin accretion disk, Astron. Astrophys. 75, 228 (1979)", "Virbhadra & Ellis, Schwarzschild black hole lensing, Phys. Rev. D 62, 084003 (2000), doi:10.1103/PhysRevD.62.084003"],
  },
  "bh-kerr-radii": {
    model: "Exact Kerr equatorial coordinate radii in Boyer-Lindquist coordinates: outer horizon, equatorial ergosurface, prograde and retrograde photon orbits and ISCO",
    status: "effective",
    assumptions: ["Vacuum Kerr exterior, G = c = M = 1, spin a* in [0, 0.998]", "Radii are coordinate radii drawn as circles, not image-plane distances", "Equatorial plane only; the ergosurface is not a sphere off the equator"],
    validity: ["Equatorial circular orbits"],
    numericalMethod: "Closed forms from js/science/kerr.mjs, evaluated for the current spin",
    references: ["Bardeen, Press & Teukolsky, Rotating black holes: locally nonrotating frames, energy extraction, and scalar synchrotron radiation, Astrophys. J. 178, 347 (1972), doi:10.1086/151796"],
  },
});

/** Idempotent registration of every figure above in the shared provenance registry. */
export function registerFigureProvenance() {
  for (const [id, entry] of Object.entries(FIGURE_PROVENANCE)) {
    if (!getVisualizationProvenance(id)) registerVisualization(id, entry);
  }
}
