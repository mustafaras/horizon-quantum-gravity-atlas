/**
 * The three shipped tours (S31).
 *
 * Every `expected` string below is a number this repository computes, not a number written from memory:
 *   - √27 = 5.1962 comes from `SCHWARZSCHILD_CRITICAL_B` (js/science/kerr-shadow.mjs);
 *   - the M87* shadow diameter, 39.7 μas, is `shadowDiameterMicroarcsec({ massSolar: 6.5e9, distanceMpc: 16.8 })`;
 *   - 67.6 Hz is the Schwarzschild ISCO frequency for 65 M☉ from `gwFrequencyFromX(ISCO_X, totalMassSeconds(36, 29))`;
 *   - 28.10 M☉ is `chirpMassSolar(36, 29)`; 0.680 and 4.73 % are `remnant({ m1: 36, m2: 29 })`;
 *   - 274.8 Hz and 3.7 ms are `ringdownHz` / `ringdownTauSeconds` for the same remnant;
 *   - 6.170e-9 K is `hawkingTemperature(10, 0)` (js/physics.mjs);
 *   - 1.6163e-35 m is the `planckLength` formula definition;
 *   - 0.5381 is `pageTimeFraction()` and 1.4847 is `PAGE_BETA` (js/science/evaporation.mjs);
 *   - b₀ = 11 − 2n_f/3 = 7 at n_f = 6 is the one-loop QCD coefficient.
 * `test/tours.test.mjs` recomputes each of these and fails when a caption stops matching its module.
 */

export const TOUR_LIBRARY = Object.freeze([
  Object.freeze({
    id: "why-gravity-resists-quantisation",
    title: "Why gravity resists quantisation",
    summary:
      "Thirteen steps from the two theories that both work to the one place they cannot be combined: Newton's constant carries a dimension, so quantum gravity is non-renormalisable in the ordinary sense.",
    references: Object.freeze([
      Object.freeze({ label: "Donoghue, General relativity as an effective field theory, Phys. Rev. D 50, 3874 (1994)", url: "https://doi.org/10.1103/PhysRevD.50.3874" }),
      Object.freeze({ label: "Planck Collaboration, Planck 2018 results VI, Astron. Astrophys. 641, A6 (2020)", url: "https://doi.org/10.1051/0004-6361/201833910" }),
      Object.freeze({ label: "Rovelli, Quantum Gravity (Cambridge University Press, 2004)", url: "https://doi.org/10.1017/CBO9780511755804" }),
    ]),
    steps: Object.freeze([
      Object.freeze({
        view: "overview",
        text: "The atlas has eight chapters. Start by noticing that the first four are quantum field theory and the last four are gravity and its measurement — the atlas is arranged around the seam between them.",
        question: "Name the four chapters on the quantum side and the four on the gravitational side.",
        expected: "Quantum: Standard Model, Quantum Fields, Gauge and RG, Planck Frontier. Gravity: General Relativity, Theory Comparator, Black Holes, Experiment.",
      }),
      Object.freeze({
        view: "sm",
        formulaFocus: "Standard Model gauge group",
        text: "The Standard Model is a gauge theory: the group $SU(3)\\times SU(2)\\times U(1)$ fixes the bosons and the form of every interaction. The equation is written as a relation with no free symbols on either side.",
        question: "Which factor of the gauge group confines coloured states at low energy, and which one is broken by the Higgs?",
        expected: "SU(3) confines; SU(2)×U(1) is broken to U(1) of electromagnetism.",
      }),
      Object.freeze({
        view: "qft",
        formulaFocus: "Path integral amplitude",
        text: "Quantum field theory computes amplitudes by summing $e^{iS/\\hbar}$ over field configurations. The integrand is a phase; the sum is over an infinite-dimensional space; the answer is finite only after renormalisation.",
        question: "Why does the path integral need a regulator before it means anything?",
        expected: "The measure is an infinite product and the integral diverges; short-distance modes must be regularised, then absorbed into measured couplings.",
      }),
      Object.freeze({
        view: "qft",
        formulaFocus: "Feynman propagator",
        text: "Every propagator carries $1/(p^2 - m^2)$. Every loop integral over four-momenta therefore grows logarithmically or worse with the cutoff — the bookkeeping that renormalisation fixes.",
        question: "How many powers of the cutoff does a four-dimensional loop integral add at most, and why does that matter?",
        expected: "Up to four; couplings with negative mass dimension then need a new counterterm at each order.",
      }),
      Object.freeze({
        view: "rg",
        formulaFocus: "QCD beta function · one loop",
        text: "The QCD beta function is $b_0 = 11 - 2n_f/3$ with $b_0 = 7$ at six flavours: the coupling shrinks at short distances. Asymptotic freedom is a statement about the sign of a coefficient, and it is why QCD is calculable at all.",
        question: "With six flavours, what is $b_0$, and does the coupling grow or shrink toward the ultraviolet?",
        expected: "$b_0 = 11 - 2\\cdot 6/3 = 7$; the coupling shrinks toward the ultraviolet.",
      }),
      Object.freeze({
        view: "rg",
        state: Object.freeze({ rgPreset: "asymptotic-safety", rgCurrent: 2 }),
        formulaFocus: "Fixed-point linearization",
        text: "Flip the flow to the Einstein–Hilbert truncation used for asymptotically safe gravity. The fixed point is where beta functions vanish; the critical exponents are the eigenvalues of $\\partial\\beta/\\partial g$ there, and they decide whether the fixed point can be used at all.",
        question: "What has to be true of a fixed point's critical exponents for it to define a predictive ultraviolet completion?",
        expected: "The relevant directions must be finite in number and the irrelevant ones must have negative real parts, so the flow is attracted to the fixed point.",
      }),
      Object.freeze({
        view: "gr",
        formulaFocus: "Einstein field equations",
        text: "General relativity is not a field theory on a fixed background: $G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = 8\\pi G\, T_{\\mu\\nu}$ makes the geometry itself the dynamical variable. There is no background to expand in.",
        question: "Which side of the Einstein equations is the dynamical variable, and what is the action it comes from?",
        expected: "The left side: the metric $g_{\\mu\\nu}$. It comes from the Einstein–Hilbert action $\\int \\sqrt{-g}\, R\, d^4x / (16\\pi G)$.",
      }),
      Object.freeze({
        view: "gr",
        formulaFocus: "Einstein–Hilbert action",
        text: "The Einstein–Hilbert action carries Newton's constant G. In four dimensions G has dimensions of inverse mass squared, so the coupling multiplying the curvature term is dimensionful.",
        question: "In what mass dimension does G sit in four dimensions, and what does that make the curvature expansion?",
        expected: "G has dimension −2, so curvature-squared and higher terms come with positive powers of energy: the expansion is an effective field theory, not a renormalisable one.",
      }),
      Object.freeze({
        view: "planck",
        formulaFocus: "Planck units",
        text: "Combine $\\hbar$, $G$ and $c$ and only one length survives: $\\sqrt{\\hbar G/c^3} = 1.6163\\times10^{-35}$ m. The Planck scale is not a new constant, it is the place where the existing three stop being separable.",
        question: "Which three constants enter the Planck length, and why can no dimensionless combination of them be formed?",
        expected: "ħ, G and c; they are the only constants with independent dimensions available, and there are three of them for three base units (mass, length, time).",
      }),
      Object.freeze({
        view: "planck",
        formulaFocus: "Perturbative expansion of the metric",
        text: "The standard route writes $g_{\\mu\\nu} = \\eta_{\\mu\\nu} + h_{\\mu\\nu}$ and quantises $h$. That expands around a fixed metric — precisely the background independence general relativity does not have. The expansion is honest about its own assumption.",
        question: "What does the split g = η + h presuppose, and which step of the atlas did that presupposition first cause trouble?",
        expected: "It presupposes a background metric η. Trouble appears already in the Einstein–Hilbert step: √(−g) is not polynomial in h, so the expansion does not terminate.",
      }),
      Object.freeze({
        view: "planck",
        formulaFocus: "Growth of the effective coupling",
        text: "The dimensionless combination $G E^2$ grows with energy: at the Planck scale it reaches order one and perturbation theory stops. This is the same 'coupling with negative dimension' statement, now as a curve.",
        question: "At what energy does the dimensionless coupling $G E^2/(\\hbar c^5)$ reaches one, and what happens to the loop expansion there?",
        expected: "At the Planck energy $\\approx 1.22\\times10^{19}$ GeV; the loop expansion no longer converges and the effective description ends.",
      }),
      Object.freeze({
        view: "approaches",
        formulaFocus: "Wheeler–DeWitt equation (canonical QG)",
        text: "Canonical quantum gravity keeps no background at all: the Wheeler–DeWitt equation asks for wavefunctionals of the three-metric that the Hamiltonian constraint annihilates. 'Time' is not an input; it is what the equation does not contain.",
        question: "What plays the role of the time parameter in the Wheeler–DeWitt equation?",
        expected: "Nothing external: the equation is a constraint $\\hat{H}\\Psi = 0$, so time must be recovered from the state itself (or not at all).",
      }),
      Object.freeze({
        view: "approaches",
        formulaFocus: "AdS/CFT dictionary (schematic)",
        text: "The holographic route takes the opposite decision: fix the boundary, define a conformal field theory there, and let the bulk geometry be its dual. Gravity is then emergent rather than quantised directly — and only in asymptotically anti-de Sitter space, which our universe is not.",
        question: "What does the AdS/CFT dictionary buy, and what does it not tell you about the universe we live in?",
        expected: "It gives a non-perturbative definition of a gravitational theory in AdS. It does not give a dual of asymptotically flat or de Sitter spacetime, so it is not yet a theory of our universe.",
      }),
    ]),
  }),

  Object.freeze({
    id: "what-a-black-hole-image-measures",
    title: "What a black hole image measures",
    summary:
      "Eight steps through the Kerr observatory and the shadow: which curve the EHT ring traces, what the critical impact parameter is, and why the bright side of the disk is not a light source.",
    references: Object.freeze([
      Object.freeze({ label: "Event Horizon Telescope Collaboration, First M87 results I, Astrophys. J. 875, L1 (2019)", url: "https://doi.org/10.3847/2041-8213/ab0ec7" }),
      Object.freeze({ label: "Bardeen, Press & Teukolsky, Rotating black holes, Astrophys. J. 178, 347 (1972)", url: "https://doi.org/10.1086/151796" }),
      Object.freeze({ label: "Johnson et al., Universal interferometric signatures of a black hole's photon ring, Sci. Adv. 6, eaaz1310 (2020)", url: "https://doi.org/10.1126/sciadv.aaz1310" }),
    ]),
    steps: Object.freeze([
      Object.freeze({
        view: "bh",
        shot: "bh-wide",
        text: "The observatory renders the Kerr metric by tracing every pixel's light ray backwards. The dark region in the middle is not a surface: it is the set of directions whose rays end on the horizon.",
        question: "Why is the darkest part of the image larger than the horizon itself?",
        expected: "Because rays aimed slightly outside the horizon still get captured: the shadow is bounded by the critical curve, whose impact parameter is √27 GM/c² ≈ 5.196 GM/c² for Schwarzschild.",
      }),
      Object.freeze({
        view: "bh",
        shot: "bh-photon",
        formulaFocus: "Schwarzschild radius",
        text: "Start with the horizon itself. $r_s = 2GM/c^2$ sets the scale; for a ten solar-mass hole it is 29.5 km, and nothing about it is observable from outside except through its gravitational field.",
        question: "For M = 10 M☉, what is r_s in kilometres, and how does it compare with the shadow's critical impact parameter?",
        expected: "$r_s = 29.5$ km; the critical impact parameter is $\\sqrt{27}/2 \\approx 2.598$ times that, i.e. $76.7$ km.",
      }),
      Object.freeze({
        view: "bh",
        state: Object.freeze({ bhSpin: 0, bhInclination: 89 }),
        text: "Set the spin to zero and look at the shadow head-on. In Schwarzschild the critical curve is an exact circle of radius $\\sqrt{27}\,GM/c^2$ — the image of the spherical photon orbits at $r = 3GM/c^2$.",
        question: "What is √27 to four decimals, and at what radius do the spherical photon orbits sit?",
        expected: "$\\sqrt{27} = 5.1962$; the orbits sit at $r = 3GM/c^2$.",
      }),
      Object.freeze({
        view: "bh",
        state: Object.freeze({ bhSpin: 0.94, bhInclination: 17 }),
        text: "Now spin the hole up to $a_* = 0.94$ and look nearly down the axis, as the M87* observations do. The shadow shifts and flattens: the prograde photon orbits sit closer in, so the critical curve is no longer a circle.",
        question: "Which side of the shadow is flattened for a prograde disk, and why does the answer depend on inclination?",
        expected: "The flattening is asymmetric and grows with spin; the prograde side moves inward. At low inclination the asymmetry appears as a displacement of the whole curve, at high inclination as a D-shape.",
      }),
      Object.freeze({
        view: "bh",
        text: "The photon sphere is where gravity is exactly strong enough to bend light into a circular orbit. It is unstable: a ray that arrives a hair inside spirals in, a hair outside spirals out — which is why the boundary is sharp.",
        question: "Why does an unstable photon orbit produce a sharp edge in the image rather than a gradual fade?",
        expected: "Because the Lyapunov exponent of the orbit is positive: nearby rays diverge exponentially, so the boundary between captured and escaping rays is exponentially sharp in initial direction.",
      }),
      Object.freeze({
        view: "bh",
        formulaFocus: "Bekenstein–Hawking entropy",
        text: "The image is a lensing measurement, but the same geometry carries a thermodynamic statement: $S = k_B c^3 A/(4G\\hbar)$. Area, not volume — the hint that motivated holography.",
        question: "How does the entropy scale with mass, and how large is it for a solar-mass hole?",
        expected: "$S \\propto A \\propto M^2$; about $1.05\\times10^{77}\\,k_B$ for one solar mass.",
      }),
      Object.freeze({
        view: "exp",
        text: "The same strong-field regime is measured in gravitational waves. The chirp mass $\\mathcal{M} = (m_1 m_2)^{3/5}/(m_1+m_2)^{1/5}$ fixes how fast the frequency sweeps up; for GW150914's $36 + 29\,M_\\odot$ it is $28.10\,M_\\odot$.",
        question: "For $m_1 = 36\\,M_\\odot$ and $m_2 = 29\\,M_\\odot$, what is the chirp mass, and what does the inspiral reach at the Schwarzschild ISCO of the total mass?",
        expected: "M_chirp = 28.10 M☉; the ISCO frequency for 65 M☉ is 67.6 Hz.",
      }),
      Object.freeze({
        view: "exp",
        state: Object.freeze({ gwEvent: "GW150914", gwDetector: "H1" }),
        text: "The measured waveform is compared with a post-Newtonian model phase by phase. The detector does not see the horizon; it sees the last few cycles before the merger, and the ringdown that follows.",
        question: "Using the remnant fit in this repository, what final mass fraction, final spin and ringdown frequency does 36 + 29 M☉ give?",
        expected: "Mass fraction $0.9527$ ($4.73\\,%$ radiated), spin $a_* = 0.680$, ringdown at $274.8$ Hz with a damping time of $3.7$ ms.",
      }),
    ]),
  }),

  Object.freeze({
    id: "hearing-spacetime",
    title: "Hearing spacetime",
    summary:
      "Seven steps from a strain time series to the numbers a detection quotes: whitening, the matched filter, the chirp, and what the signal-to-noise ratio does and does not mean.",
    references: Object.freeze([
      Object.freeze({ label: "Abbott et al. (LIGO Scientific and Virgo), Observation of gravitational waves from a binary black hole merger, Phys. Rev. Lett. 116, 061102 (2016)", url: "https://doi.org/10.1103/PhysRevLett.116.061102" }),
      Object.freeze({ label: "Peters, Gravitational radiation and the motion of two point masses, Phys. Rev. 136, B1224 (1964)", url: "https://doi.org/10.1103/PhysRev.136.B1224" }),
      Object.freeze({ label: "Page, Information in black hole radiation, Phys. Rev. Lett. 71, 3743 (1993)", url: "https://doi.org/10.1103/PhysRevLett.71.3743" }),
    ]),
    steps: Object.freeze([
      Object.freeze({
        view: "exp",
        state: Object.freeze({ gwMode: "generated", gwEvent: "GW150914" }),
        text: "A gravitational-wave detector records strain: a dimensionless stretch, of order $10^{-21}$ for the first detection. The raw time series is dominated by seismic and instrumental noise, not by the signal.",
        question: "How large is the strain of GW150914 at the detector, and why is the raw series unreadable?",
        expected: "Of order $10^{-21}$; the noise floor is orders of magnitude larger across most of the band.",
      }),
      Object.freeze({
        view: "exp",
        text: "Whiten the series and the chirp appears: frequency and amplitude rising together over about 0.2 s, from 35 Hz to the merger. A chirp is what two point masses radiating gravitational waves must sound like.",
        question: "What does a rising frequency say about the orbit, and what sets where the chirp ends?",
        expected: "The orbit shrinks, so the orbital frequency rises; the chirp ends near the innermost stable circular orbit, where the inspiral description stops applying.",
      }),
      Object.freeze({
        view: "exp",
        text: "The rate of frequency change depends on one combination of the masses: the chirp mass. That is why a chirp measures mass before anything else is known about the source.",
        question: "Why does the inspiral measure the chirp mass rather than $m_1$ and $m_2$ separately?",
        expected: "Because at leading order $df/dt \\propto \\mathcal{M}^{5/3} f^{11/3}$: the phase depends on the combination alone. Mass ratio needs higher-order terms or the ringdown.",
      }),
      Object.freeze({
        view: "exp",
        state: Object.freeze({ gwMode: "real", gwEvent: "GW150914", gwDetector: "H1" }),
        text: "Switch to the recorded strain and overlay the template. The matched filter correlates the data with the model; the peak of that correlation, divided by its noise-weighted spread, is the signal-to-noise ratio.",
        question: "What does the matched filter maximise, and what does a larger SNR let you claim?",
        expected: "It maximises the noise-weighted inner product of data and template. A larger SNR raises detection confidence and shrinks parameter uncertainties; it does not by itself prove the source is a black hole.",
      }),
      Object.freeze({
        view: "exp",
        text: "The instrument's response is a band-pass problem, not a golden-rule one, but the same structure appears: the measured rate is a matrix element squared times a density of states, integrated over the detector's band.",
        question: "Why does the detected strain depend on the antenna pattern, and what happens to a source directly overhead?",
        expected: "The two polarisations couple to the detector through the antenna pattern $F_+$, $F_\\times$; a source on the zenith maximises one combination and nulls another, so orientation changes the amplitude, not the physics.",
      }),
      Object.freeze({
        view: "bh",
        formulaFocus: "Hawking temperature",
        text: "The merger leaves a ringing remnant. Its quasinormal frequency and damping time are fixed by the final mass and spin — and the same horizon, at a temperature of $6.17\\times10^{-9}$ K for $10\,M_\\odot$, is what Hawking's calculation describes.",
        question: "For a 10 M☉ Schwarzschild hole, what is the Hawking temperature, and why is it not observable?",
        expected: "$6.17\\times10^{-9}$ K; the flux is $\\sim10^{-28}$ of the CMB temperature, far below any measurable signal.",
      }),
      Object.freeze({
        view: "bh",
        formulaFocus: "Bekenstein–Hawking entropy",
        text: "The final step is the one the detection cannot settle. Bekenstein–Hawking entropy says the merged hole carries a definite entropy; unitarity says the radiation that carried the inspiral away must eventually return it. Page's $\\beta = 1.4847$ puts the turnover at $0.5381$ of the evaporation time.",
        question: "What does Page's coefficient β = 1.4847 give for the Page time, and what would an observation of it require?",
        expected: "$0.5381$ of the evaporation time, at which the radiation entropy peaks at $0.5975$ of the initial hole entropy. Observing it needs a hole far smaller than any astrophysical one, so it remains a consistency check, not a measurement.",
      }),
    ]),
  }),
]);

export const TOUR_IDS = Object.freeze(TOUR_LIBRARY.map((tour) => tour.id));
