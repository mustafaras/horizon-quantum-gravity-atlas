// data.jsx — scientific content database for Quantum Gravity Atlas
// Masses are approximate PDG-style values, quoted for orientation only.

const QGA_PARTICLES = [
  // quarks (class q)
  { id: "u", sym: "u", name: "up", cls: "quark", gen: 1, charge: "+2/3", spin: "1/2", mass: "≈ 2.2 MeV", color: true, weak: true, em: true, higgs: true,
    notes: "Lightest up-type quark. Confined inside hadrons; a constituent of protons (uud) and neutrons (udd). Its current mass is scheme-dependent (MS-bar)." },
  { id: "c", sym: "c", name: "charm", cls: "quark", gen: 2, charge: "+2/3", spin: "1/2", mass: "≈ 1.27 GeV", color: true, weak: true, em: true, higgs: true,
    notes: "Second-generation up-type quark, discovered via the J/ψ meson (1974). Decays weakly to strange quarks." },
  { id: "t", sym: "t", name: "top", cls: "quark", gen: 3, charge: "+2/3", spin: "1/2", mass: "≈ 172.7 GeV", color: true, weak: true, em: true, higgs: true,
    notes: "Heaviest known elementary particle; Yukawa coupling close to unity. Decays before hadronizing (t → Wb), so it is studied as a quasi-free quark." },
  { id: "d", sym: "d", name: "down", cls: "quark", gen: 1, charge: "−1/3", spin: "1/2", mass: "≈ 4.7 MeV", color: true, weak: true, em: true, higgs: true,
    notes: "Lightest down-type quark; constituent of nucleons. Most of the proton mass comes from QCD binding energy, not quark masses." },
  { id: "s", sym: "s", name: "strange", cls: "quark", gen: 2, charge: "−1/3", spin: "1/2", mass: "≈ 93 MeV", color: true, weak: true, em: true, higgs: true,
    notes: "Carrier of 'strangeness'; its flavor-changing weak decays motivated the Cabibbo mixing structure and later the CKM matrix." },
  { id: "b", sym: "b", name: "bottom", cls: "quark", gen: 3, charge: "−1/3", spin: "1/2", mass: "≈ 4.18 GeV", color: true, weak: true, em: true, higgs: true,
    notes: "Third-generation down-type quark. B-meson systems are key laboratories for CP violation and CKM metrology." },
  // leptons
  { id: "e", sym: "e", name: "electron", cls: "lepton", gen: 1, charge: "−1", spin: "1/2", mass: "0.511 MeV", color: false, weak: true, em: true, higgs: true,
    notes: "Stable charged lepton; determines atomic structure and chemistry. Its Dirac description predicts antimatter (the positron)." },
  { id: "mu", sym: "μ", name: "muon", cls: "lepton", gen: 2, charge: "−1", spin: "1/2", mass: "105.7 MeV", color: false, weak: true, em: true, higgs: true,
    notes: "Heavier copy of the electron; lifetime ≈ 2.2 μs. Muon precision observables (g−2) are sensitive probes of quantum corrections." },
  { id: "tau", sym: "τ", name: "tau", cls: "lepton", gen: 3, charge: "−1", spin: "1/2", mass: "1776.9 MeV", color: false, weak: true, em: true, higgs: true,
    notes: "Heaviest charged lepton; massive enough to decay into hadrons. Completes the third lepton generation." },
  { id: "nue", sym: "νₑ", name: "e neutrino", cls: "lepton", gen: 1, charge: "0", spin: "1/2", mass: "< 1 eV*", color: false, weak: true, em: false, higgs: null,
    notes: "Electrically neutral; interacts only weakly. Neutrino oscillations show neutrinos have mass — the minimal Standard Model must be extended to accommodate it. The mass-generation mechanism (Dirac vs Majorana) is open." },
  { id: "numu", sym: "ν_μ", name: "μ neutrino", cls: "lepton", gen: 2, charge: "0", spin: "1/2", mass: "< 1 eV*", color: false, weak: true, em: false, higgs: null,
    notes: "Muon-flavor neutrino. Atmospheric neutrino oscillations (Super-Kamiokande, 1998) gave the first compelling evidence of neutrino mass." },
  { id: "nutau", sym: "ν_τ", name: "τ neutrino", cls: "lepton", gen: 3, charge: "0", spin: "1/2", mass: "< 1 eV*", color: false, weak: true, em: false, higgs: null,
    notes: "Tau-flavor neutrino, directly observed by DONUT (2000). Flavor eigenstates are superpositions of mass eigenstates." },
  // gauge bosons
  { id: "g", sym: "g", name: "gluon", cls: "gauge", gen: null, charge: "0", spin: "1", mass: "0", color: true, weak: false, em: false, higgs: false,
    notes: "Mediator of the strong interaction (SU(3) color). Gluons themselves carry color charge, so they self-interact — the origin of confinement and asymptotic freedom.", mediates: "Strong interaction — couples to all color-charged particles (quarks, gluons)." },
  { id: "ph", sym: "γ", name: "photon", cls: "gauge", gen: null, charge: "0", spin: "1", mass: "0", color: false, weak: false, em: true, higgs: false,
    notes: "Mediator of electromagnetism; the unbroken U(1)_EM gauge boson after electroweak symmetry breaking. Massless, hence the infinite range of the Coulomb force.", mediates: "Electromagnetism — couples to all electrically charged particles." },
  { id: "w", sym: "W±", name: "W boson", cls: "gauge", gen: null, charge: "±1", spin: "1", mass: "80.4 GeV", color: false, weak: true, em: true, higgs: true,
    notes: "Charged mediator of the weak interaction; responsible for beta decay and flavor change. Its large mass makes the weak force short-ranged (~10⁻¹⁸ m).", mediates: "Charged-current weak interaction — couples to left-handed fermion doublets." },
  { id: "z", sym: "Z⁰", name: "Z boson", cls: "gauge", gen: null, charge: "0", spin: "1", mass: "91.19 GeV", color: false, weak: true, em: false, higgs: true,
    notes: "Neutral weak mediator; predicted by electroweak unification and discovered at CERN (1983). Precision Z-pole measurements at LEP tightly constrain the Standard Model.", mediates: "Neutral-current weak interaction — couples to all Standard Model fermions." },
  // higgs
  { id: "h", sym: "H", name: "Higgs", cls: "higgs", gen: null, charge: "0", spin: "0", mass: "125.25 GeV", color: false, weak: true, em: false, higgs: true,
    notes: "Scalar excitation of the Higgs field, discovered at the LHC in 2012. The field's nonzero vacuum expectation value (v ≈ 246 GeV) breaks electroweak symmetry and generates masses for W, Z, and the charged fermions.", mediates: "Yukawa interactions — couples to particles in proportion to their mass." },
];

const QGA_CLASS_COLORS = {
  quark: "oklch(0.72 0.13 300)",
  lepton: "oklch(0.75 0.11 200)",
  gauge: "oklch(0.74 0.12 235)",
  higgs: "oklch(0.8 0.1 85)",
};

// which gauge bosons couple to a given particle
function QGA_couplings(p) {
  const set = [];
  if (p.color) set.push("g");
  if (p.em && p.charge !== "0") set.push("ph");
  if (p.weak) { set.push("w"); set.push("z"); }
  if (p.higgs === true) set.push("h");
  return set;
}

const QGA_SECTORS = [
  { id: "su3", group: "SU(3)_C", name: "Color · strong force", color: "oklch(0.72 0.13 300)",
    body: "Eight gluon fields act on the three color charges carried by quarks. Because the group is non-abelian, gluons self-interact: the coupling grows at long distances (confinement) and shrinks at short distances (asymptotic freedom). Quantum chromodynamics binds quarks into hadrons and generates most of the visible mass in the universe." },
  { id: "su2", group: "SU(2)_L", name: "Weak isospin", color: "oklch(0.74 0.12 235)",
    body: "Acts only on left-handed fermion doublets — a maximally parity-violating structure. Its three gauge fields mix with hypercharge after symmetry breaking to form the massive W± and Z⁰ and the massless photon. The weak interaction changes quark and lepton flavor, powering beta decay and stellar fusion." },
  { id: "u1", group: "U(1)_Y", name: "Hypercharge", color: "oklch(0.78 0.1 200)",
    body: "An abelian phase symmetry assigning hypercharge Y to each field. Electric charge emerges from the combination Q = T₃ + Y/2 after electroweak symmetry breaking. The surviving unbroken symmetry is U(1)_EM — ordinary electromagnetism with the photon as its gauge boson." },
];

/* ---------- particle metadata: discovery, experiment, role ---------- */
const QGA_PARTICLE_EXTRA = {
  u: { year: "1968", via: "Deep-inelastic scattering, SLAC (evidence for point-like constituents)", role: "Up-type building block of protons and neutrons." },
  d: { year: "1968", via: "Deep-inelastic scattering, SLAC", role: "Down-type building block of nucleons." },
  s: { year: "1947 / 1964", via: "Strange hadrons in cosmic rays (Rochester & Butler); quark assignment in the 1964 quark model", role: "Source of 'strangeness'; key to flavor mixing." },
  c: { year: "1974", via: "J/ψ discovery, SLAC & Brookhaven (the 'November Revolution')", role: "Confirmed the quark model's fourth flavor (GIM mechanism)." },
  b: { year: "1977", via: "Υ resonance, E288 experiment, Fermilab", role: "Anchor of third-generation quark physics and CP-violation studies." },
  t: { year: "1995", via: "CDF & DØ experiments, Fermilab Tevatron", role: "Heaviest known particle; strongest Higgs coupling." },
  e: { year: "1897", via: "Cathode-ray experiments, J. J. Thomson", role: "First elementary particle discovered; basis of chemistry." },
  mu: { year: "1936", via: "Cosmic-ray cloud-chamber tracks, Anderson & Neddermeyer", role: "First sign of generation structure ('Who ordered that?')." },
  tau: { year: "1975", via: "e⁺e⁻ collisions, Perl et al., SLAC", role: "Completed the third lepton generation." },
  nue: { year: "1956", via: "Reactor antineutrino capture, Reines & Cowan", role: "Carries away energy in beta decay; postulated by Pauli (1930)." },
  numu: { year: "1962", via: "Brookhaven AGS two-neutrino experiment", role: "Showed neutrino flavors are distinct." },
  nutau: { year: "2000", via: "DONUT experiment, Fermilab", role: "Last Standard Model fermion observed directly." },
  ph: { year: "1905 / 1923", via: "Photoelectric effect (Einstein); Compton scattering confirmation", role: "Quantum of light; mediator of electromagnetism." },
  g: { year: "1979", via: "Three-jet events, PETRA collider, DESY", role: "Mediator of the strong force; binds quarks into hadrons." },
  w: { year: "1983", via: "UA1 & UA2 experiments, CERN Sp̄pS", role: "Charged-current weak mediator; powers beta decay and stellar fusion." },
  z: { year: "1983", via: "UA1 & UA2 experiments, CERN Sp̄pS", role: "Neutral-current weak mediator; precision-tested at LEP." },
  h: { year: "2012", via: "ATLAS & CMS experiments, CERN LHC", role: "Quantum of the field behind electroweak symmetry breaking." },
};

/* ---------- theory metadata for the 3D theory map ---------- */
const QGA_THEORY_META = {
  string: { since: "1968–1984–", founders: "Veneziano · Green–Schwarz · Witten", eqName: "Polyakov action",
    eq: "S_P = -\\tfrac{T}{2}\\int d^2\\sigma\\,\\sqrt{-h}\\,h^{ab}\\,\\partial_a X^\\mu \\partial_b X_\\mu" },
  lqg: { since: "1986–", founders: "Ashtekar · Rovelli · Smolin", eqName: "Area spectrum",
    eq: "\\hat{A} = 8\\pi\\gamma\\, l_P^2 \\sum_i \\sqrt{j_i(j_i+1)}" },
  eft: { since: "1994–", founders: "Donoghue (systematization)", eqName: "Curvature expansion",
    eq: "S = \\int d^4x\\sqrt{-g}\\,\\Big[\\tfrac{R}{16\\pi G} + c_1 R^2 + \\cdots\\Big]" },
  asymsafe: { since: "1979–", founders: "Weinberg · Reuter", eqName: "Wetterich equation",
    eq: "\\partial_t \\Gamma_k = \\tfrac{1}{2}\\,\\mathrm{Tr}\\big[(\\Gamma_k^{(2)} + R_k)^{-1}\\,\\partial_t R_k\\big]" },
  holo: { since: "1993–1997–", founders: "'t Hooft · Susskind · Maldacena", eqName: "Ryu–Takayanagi formula",
    eq: "S(A) = \\frac{\\mathrm{Area}(\\gamma_A)}{4 G \\hbar}" },
};

/* ---------- theory comparator ---------- */
const QGA_THEORIES = [
  { id: "string", name: "String theory", status: "conjectural",
    rows: {
      idea: { short: "Particles are vibration modes of one-dimensional strings; gravity emerges automatically.",
        long: "Replacing point particles with extended strings smooths out the short-distance behavior that makes perturbative gravity ill-defined. The graviton appears as a massless spin-2 vibration mode, so quantum gravity is built in rather than added. Consistency requires supersymmetry and extra spatial dimensions (10 for superstrings), which must be compactified or otherwise hidden." },
      object: { short: "Worldsheet sigma models; Polyakov action; D-branes; superstring theories united by M-theory dualities.",
        long: "The fundamental object is a two-dimensional field theory on the string worldsheet. Five consistent superstring theories are related by dualities and conjectured to be limits of an 11-dimensional M-theory. D-branes — dynamical hypersurfaces where open strings end — are essential nonperturbative ingredients." },
      background: { short: "Mostly background-dependent (perturbation around a fixed spacetime); nonperturbative formulation incomplete.",
        long: "Standard string perturbation theory expands around a chosen background geometry, which critics view as conceptually at odds with general relativity's background independence. AdS/CFT provides a nonperturbative definition in asymptotically anti-de Sitter settings, but a background-independent formulation for general spacetimes is not established." },
      spacetime: { short: "Smooth at low energy; modified at the string scale; geometry can emerge from dualities.",
        long: "Below the string scale, spacetime looks like ordinary geometry with stringy corrections. T-duality and mirror symmetry show that distinct geometries can describe identical physics, suggesting classical geometry is not fundamental but emergent." },
      experiment: { short: "No direct experimental confirmation; characteristic scales far beyond current colliders.",
        long: "No superpartners, extra dimensions, or stringy resonances have been observed. The framework is not currently falsified — but its natural energy scale is typically near the Planck scale, far beyond direct experimental reach." },
      strengths: { short: "Finite perturbative gravity; unification of forces; microscopic black hole entropy counts; AdS/CFT.",
        long: "String perturbation theory is free of the ultraviolet divergences of perturbative quantum gravity. Strominger and Vafa reproduced the Bekenstein–Hawking entropy for certain extremal black holes by counting microstates. Gauge fields, matter, and gravity arise from a single object." },
      problems: { short: "Vacuum selection (landscape); background independence; no confirmed low-energy predictions.",
        long: "An enormous landscape of metastable vacua makes unique low-energy predictions difficult. Moduli stabilization, supersymmetry breaking, and obtaining a realistic cosmology (de Sitter space) remain contested. The theory's defining equations beyond perturbation theory are unknown." },
    } },
  { id: "lqg", name: "Loop quantum gravity", status: "conjectural",
    rows: {
      idea: { short: "Quantize geometry itself: space is described by spin networks with discrete area and volume spectra.",
        long: "LQG applies canonical quantization to general relativity reformulated in Ashtekar variables. The resulting kinematical states — spin networks — carry quantized geometric data: operators for area and volume have discrete spectra at the Planck scale. Spacetime is not assumed; it should emerge from the dynamics of these states." },
      object: { short: "Holonomies and fluxes; spin network states; spin foams for dynamics.",
        long: "The basic variables are holonomies of an SU(2) connection and fluxes of a triad field. Dynamics is approached either through the Hamiltonian constraint (canonical) or via spin foams — path integrals over histories of spin networks (covariant)." },
      background: { short: "Background-independent by construction.",
        long: "No fixed spacetime metric appears anywhere in the construction; this is the framework's defining strength and the source of much of its technical difficulty." },
      spacetime: { short: "Fundamentally discrete spectra of geometric operators; continuum limit not fully demonstrated.",
        long: "Discreteness here is a derived spectral property, not an assumed lattice. Recovering smooth classical spacetime and the Einstein equations in an appropriate limit remains an active and unfinished program." },
      experiment: { short: "No direct experimental confirmation; loop quantum cosmology offers potential, untested signatures.",
        long: "Possible imprints (e.g., bounce cosmologies replacing the Big Bang singularity) are studied in loop quantum cosmology, but no observation currently discriminates LQG from alternatives." },
      strengths: { short: "Background independence; finite geometric spectra; black hole entropy from horizon microstates.",
        long: "The discrete area spectrum yields a derivation of horizon entropy proportional to area (fixing the Barbero–Immirzi parameter). Singularity resolution in symmetry-reduced cosmological models is suggestive." },
      problems: { short: "Dynamics (Hamiltonian constraint) unresolved; semiclassical limit; matter coupling; Lorentz invariance questions.",
        long: "Defining and solving the quantum dynamics in full generality is unresolved. Demonstrating that low-energy physics reproduces general relativity plus the Standard Model — and that local Lorentz invariance survives — remains open." },
    } },
  { id: "eft", name: "EFT of gravity", status: "effective",
    rows: {
      idea: { short: "Treat general relativity as a quantum effective field theory valid below the Planck scale.",
        long: "Even without a full theory, quantum corrections to gravity can be computed reliably at energies far below the Planck scale, exactly as chiral perturbation theory works below the QCD scale. Unknown short-distance physics is parameterized by higher-curvature operators whose coefficients would be fixed by the ultimate theory." },
      object: { short: "Einstein–Hilbert action plus an infinite tower of higher-curvature corrections.",
        long: "The action is organized as an expansion in curvature over the Planck scale: R, R², R_{μν}R^{μν}, and so on. At accessible energies only the leading terms matter, so predictions are insensitive to the unknown ultraviolet completion." },
      background: { short: "Perturbation around a classical background; inherently a low-energy description.",
        long: "The framework expands the metric around a solution of the classical equations. It does not attempt to answer what spacetime is at the Planck scale — by design." },
      spacetime: { short: "Classical smooth spacetime with small quantum fluctuations.",
        long: "Spacetime remains a smooth manifold; gravitons are quantized weak-field ripples on it. This is uncontroversial physics in its domain of validity." },
      experiment: { short: "Consistent with all observations; quantum corrections are computable but unmeasurably small.",
        long: "The leading quantum correction to the Newtonian potential has been computed unambiguously, but it is suppressed by (l_P/r)² — about 10⁻⁷⁰ at laboratory scales — far below any conceivable measurement." },
      strengths: { short: "Rigorous, predictive, and universally accepted within its domain of validity.",
        long: "This is the one corner of quantum gravity where calculations command consensus. It sharply frames the real problem: not 'can gravity be quantized?' but 'what completes the theory at the Planck scale?'" },
      problems: { short: "Says nothing about the Planck scale; breaks down precisely where quantum gravity gets interesting.",
        long: "The expansion fails at Planckian curvatures — black hole singularities, the earliest universe — exactly the regimes a complete theory must address." },
    } },
  { id: "asymsafe", name: "Asymptotic safety", status: "conjectural",
    rows: {
      idea: { short: "Gravity may be nonperturbatively renormalizable if its couplings reach an ultraviolet fixed point.",
        long: "Weinberg's conjecture: the renormalization group flow of gravitational couplings could approach an interacting fixed point at high energies, rendering the theory predictive at all scales without new degrees of freedom — no strings, no discreteness, just quantum field theory done nonperturbatively." },
      object: { short: "Renormalization group flow of gravitational effective actions; functional RG equations.",
        long: "The central tool is the functional renormalization group (Wetterich equation) applied to truncated gravitational actions. Evidence for a fixed point has accumulated across increasingly elaborate truncations." },
      background: { short: "Calculations typically use background-field methods; background independence is subtle.",
        long: "The background field formalism splits the metric into background plus fluctuation, raising questions about how robustly results reflect background-independent physics." },
      spacetime: { short: "Smooth at large scales; effective dimensionality may flow to ~2 near the fixed point.",
        long: "Several approaches (including causal dynamical triangulations, a lattice-based cousin) find the spectral dimension flowing from 4 at large scales toward 2 at short ones — a suggestive, though scheme-dependent, hint." },
      experiment: { short: "No direct confirmation; claimed consistency relations (e.g., Higgs mass estimate) are suggestive, not decisive.",
        long: "A 2010 fixed-point-based estimate of the Higgs boson mass (~126 GeV) preceded the discovery, but the assumptions involved prevent treating it as a confirmed prediction." },
      strengths: { short: "Conservative — uses only quantum field theory; concrete computational program.",
        long: "If correct, quantum gravity needs no exotic ingredients. The program produces falsifiable internal consistency checks and connects to lattice approaches." },
      problems: { short: "Fixed-point evidence rests on truncations; unitarity and Lorentzian signature remain open.",
        long: "All evidence comes from truncated flows, mostly in Euclidean signature; controlling the error and establishing unitarity of the resulting theory are unsolved." },
    } },
  { id: "holo", name: "Holography / AdS-CFT", status: "conjectural",
    rows: {
      idea: { short: "Gravity in a bulk spacetime can be exactly equivalent to a non-gravitational theory on its boundary.",
        long: "Motivated by black hole entropy scaling with area rather than volume ('t Hooft, Susskind), holography proposes that gravitational physics in a region is encoded on its boundary. Maldacena's AdS/CFT correspondence realizes this precisely: string theory in anti-de Sitter space is conjecturally dual to a conformal field theory on the boundary." },
      object: { short: "Dual pairs: type IIB strings on AdS₅×S⁵ ↔ N=4 super Yang–Mills; entanglement entropy ↔ geometry (RT surfaces).",
        long: "The dictionary maps bulk fields to boundary operators and the bulk partition function to the CFT generating functional. The Ryu–Takayanagi formula ties boundary entanglement entropy to minimal surfaces in the bulk, suggesting spacetime itself is woven from entanglement." },
      background: { short: "Defined for asymptotically AdS spacetimes; our universe (≈ de Sitter) lacks an equally sharp dual.",
        long: "The correspondence requires special boundary conditions. Extending holography to cosmological, de Sitter-like spacetimes is a major open frontier." },
      spacetime: { short: "Bulk spacetime is emergent — reconstructed from patterns of boundary entanglement.",
        long: "In this picture geometry is not fundamental: connectivity of space appears to track quantum entanglement of the boundary state (ER=EPR is a sharper, more speculative version of this idea)." },
      experiment: { short: "No direct test; used as a calculational tool for strongly coupled systems with mixed quantitative success.",
        long: "Holographic methods give qualitative insight into quark-gluon plasma and certain condensed-matter systems, but these applications test the method's utility, not whether our universe is holographic." },
      strengths: { short: "Sharpest available definition of quantum gravity in a box; resolved the entropy scaling puzzle; reshaped the information paradox debate.",
        long: "Within AdS, quantum gravity is defined by an ordinary quantum theory, making unitarity of black hole evaporation manifest. Recent replica-wormhole computations of the Page curve grew directly from this framework." },
      problems: { short: "De Sitter / cosmological holography unknown; bulk reconstruction inside horizons unclear; proof of the duality lacking.",
        long: "The correspondence remains mathematically unproven (though heavily tested). How the interior of a black hole is encoded, and what replaces AdS/CFT for our accelerating universe, are open questions." },
    } },
];

const QGA_ROWS = [
  { id: "idea", label: "Core idea" },
  { id: "object", label: "Mathematical object" },
  { id: "background", label: "Background dependence" },
  { id: "spacetime", label: "Treatment of spacetime" },
  { id: "experiment", label: "Experimental status" },
  { id: "strengths", label: "Strengths" },
  { id: "problems", label: "Open problems" },
];

/* ---------- glossary ---------- */
const QGA_GLOSSARY = [
  { term: "Gauge symmetry", def: "A redundancy in the mathematical description of a field theory: physically identical configurations are related by local transformations.", adv: "Demanding invariance under local (spacetime-dependent) transformations of a symmetry group G forces the introduction of connection fields — the gauge bosons — and fixes the form of their interactions via the covariant derivative.", misc: "Gauge symmetry is not a physical symmetry that transforms one state into a different one; it is a redundancy of description. Only gauge-invariant quantities are observable." },
  { term: "Quantum field", def: "An operator-valued function defined at every point of spacetime; particles are its quantized excitations.", adv: "Fields furnish representations of the Poincaré group; canonical quantization promotes Fourier mode amplitudes to creation and annihilation operators acting on Fock space.", misc: "The field, not the particle, is fundamental. 'Particle number' is frame- and state-dependent (e.g., the Unruh effect)." },
  { term: "Renormalization", def: "The systematic procedure relating bare parameters of a theory to measurable quantities, absorbing short-distance sensitivity into a finite set of couplings.", adv: "In the Wilsonian view, renormalization tracks how effective couplings flow as high-momentum modes are integrated out. Renormalizable theories need finitely many inputs; non-renormalizable ones (like gravity) need infinitely many — unless rescued by new physics or a fixed point.", misc: "Renormalization is not 'sweeping infinities under the rug'; it is a precise statement about how physics depends on scale." },
  { term: "Running coupling", def: "An interaction strength that depends on the energy scale at which it is probed.", adv: "Governed by the beta function: β(g) = μ dg/dμ. QCD's negative beta function gives asymptotic freedom; QED's positive one makes electromagnetism stronger at short distances.", misc: "Couplings do not 'change over time' — they change with the resolution scale of the measurement." },
  { term: "Spontaneous symmetry breaking", def: "A situation where the laws are symmetric but the lowest-energy state is not.", adv: "In the electroweak theory, the Higgs field's potential selects a nonzero vacuum expectation value, breaking SU(2)_L×U(1)_Y down to U(1)_EM and giving mass to W±, Z, and the charged fermions via Yukawa couplings.", misc: "The Higgs field does not slow particles down like a viscous medium; mass arises from interaction energy with a uniform background field, not from friction." },
  { term: "Metric tensor", def: "The field g_{μν} that encodes distances, times, and causal structure in spacetime.", adv: "A symmetric rank-2 tensor field; its Levi-Civita connection defines geodesics and curvature. In general relativity the metric is dynamical, sourced by energy-momentum.", misc: "The metric is not a force field on top of space — it is the geometry of spacetime itself." },
  { term: "Geodesic", def: "The straightest possible path through curved spacetime; the trajectory of a free-falling body.", adv: "Curves extremizing proper time, satisfying d²x^μ/dτ² + Γ^μ_{αβ}(dx^α/dτ)(dx^β/dτ) = 0.", misc: "Orbiting bodies are not 'pulled' off straight lines by a gravitational force; in general relativity they are following the straightest available path." },
  { term: "Event horizon", def: "The boundary of a spacetime region from which no signal can escape to infinity.", adv: "A global, teleological concept: the boundary of the causal past of future null infinity. For a Schwarzschild black hole it sits at r = 2GM/c².", misc: "Nothing locally dramatic happens at the horizon of a large black hole; an infalling observer crosses it smoothly." },
  { term: "Hawking radiation", def: "Thermal radiation predicted to be emitted by black holes due to quantum field effects near the horizon.", adv: "Quantum fields in the curved Schwarzschild background have no global vacuum; the state regular at the horizon appears thermal at infinity with temperature T_H = ħc³/(8πGMk_B).", misc: "The popular 'particle pair where one falls in' image is a heuristic, not the calculation. The derivation uses field modes, not localized particles." },
  { term: "Bekenstein–Hawking entropy", def: "The entropy of a black hole, proportional to the area of its horizon.", adv: "S = k_B c³ A/(4Għ). Its area scaling (rather than volume) is the strongest hint that gravitational degrees of freedom are holographic.", misc: "This entropy is enormous: a solar-mass black hole has ~10⁷⁷ k_B, far exceeding the entropy of the star that formed it." },
  { term: "Planck scale", def: "The energy/length regime where quantum gravitational effects are expected to become strong.", adv: "l_P = √(ħG/c³) ≈ 1.6×10⁻³⁵ m; E_P ≈ 1.22×10¹⁹ GeV. Formed from ħ, G, c alone — the unique scale where quantum mechanics, gravity, and relativity all matter.", misc: "The Planck length is not a proven 'pixel size' of space. Whether anything discrete happens there is theory-dependent and experimentally open." },
  { term: "Background independence", def: "The property that a theory does not presuppose a fixed spacetime geometry.", adv: "General relativity's equations determine the metric dynamically; many quantization schemes, by contrast, expand around a fixed background — a structural tension at the heart of quantum gravity.", misc: "Background independence does not mean 'anything goes'; boundary conditions and topology still constrain solutions." },
  { term: "Holographic principle", def: "The conjecture that physics in a spatial region is fully encoded on its boundary, with at most one degree of freedom per Planck area.", adv: "Motivated by black hole entropy bounds ('t Hooft 1993, Susskind 1995); realized concretely by AdS/CFT in asymptotically anti-de Sitter spacetimes.", misc: "The holographic principle does not say the universe is a 'projection' or an illusion; it is a statement about how much information a region can hold." },
  { term: "AdS/CFT correspondence", def: "A conjectured exact equivalence between a gravitational theory in anti-de Sitter space and a conformal field theory on its boundary.", adv: "Maldacena (1997): type IIB string theory on AdS₅×S⁵ ↔ N=4 SU(N) super Yang–Mills. Strong/weak coupling duality: classical gravity in the bulk corresponds to strongly coupled gauge theory.", misc: "Our universe is not anti-de Sitter. AdS/CFT is a precise statement in specific theoretical settings — not a proven description of our cosmos." },
  { term: "Spin network", def: "A graph with edges labeled by spins that describes a quantum state of spatial geometry in loop quantum gravity.", adv: "Edges carry SU(2) representations; nodes carry intertwiners. Surfaces acquire area from the spins of edges that puncture them, giving a discrete area spectrum.", misc: "Spin networks are not objects sitting inside space — they are proposed to be what space is, at the quantum level." },
  { term: "Virtual particle", def: "An internal line in a Feynman diagram: a term in a perturbative expansion, not a directly observed object.", adv: "Internal propagators integrate over off-shell momenta (p² ≠ m²). They are calculational bookkeeping for field correlations.", misc: "Virtual particles are not little objects popping in and out of existence; that imagery is a heuristic for terms in a series." },
  { term: "Feynman diagram", def: "A graphical representation of a term in the perturbative expansion of a scattering amplitude.", adv: "External lines represent incoming/outgoing states; vertices carry coupling factors; internal lines carry propagators. The diagram is shorthand for a precise integral.", misc: "Diagrams depict terms in a calculation, not literal spacetime pictures of particle trajectories." },
  { term: "Path integral", def: "Feynman's formulation of quantum theory: amplitudes are sums over all possible histories weighted by e^{iS/ħ}.", adv: "Z = ∫Dφ e^{iS[φ]/ħ}. Stationary phase around classical solutions recovers classical physics; fluctuations give quantum corrections.", misc: "'The particle takes all paths' is a statement about the structure of the amplitude, not a claim that each path is separately real." },
  { term: "Cosmological constant", def: "The energy density of empty space, entering Einstein's equations as Λ.", adv: "Observations indicate Λ > 0 (accelerating expansion), with ρ_Λ ~ 10⁻¹²² in Planck units — famously discrepant with naive QFT estimates of vacuum energy.", misc: "The 'cosmological constant problem' is not that Λ exists, but that quantum field theory offers no accepted explanation of its tiny value." },
  { term: "Graviton", def: "The hypothetical massless spin-2 quantum of the gravitational field.", adv: "Any massless spin-2 field must couple universally to energy-momentum, essentially forcing Einstein's equations at low energy. Single gravitons are unobservable in practice with any realistic detector.", misc: "The graviton's existence is well-motivated but not experimentally established; gravitational waves confirm classical wave behavior, not individual quanta." },
  { term: "Wheeler–DeWitt equation", def: "The constraint equation ĤΨ = 0 of canonically quantized general relativity.", adv: "The wave functional Ψ[h_{ij}] depends on 3-geometries; the absence of an external time parameter gives rise to the 'problem of time'.", misc: "ĤΨ = 0 does not mean 'nothing happens'; time is expected to emerge relationally, from correlations between subsystems." },
  { term: "Effective field theory", def: "A description valid below some energy scale, with unknown short-distance physics absorbed into coefficients of higher-dimension operators.", adv: "Organized as an expansion in E/Λ. Predictivity at low energy survives ignorance of the ultraviolet — the reason quantum gravity is calculable far below the Planck scale.", misc: "'Non-renormalizable' does not mean 'meaningless' — it means valid only below a cutoff, with growing numbers of parameters as precision increases." },
  { term: "Asymptotic freedom", def: "The property that a coupling becomes weak at high energies, as in QCD.", adv: "A negative beta function (b₀ > 0 in QCD with ≤16 flavors) drives the coupling logarithmically to zero in the ultraviolet — Gross, Wilczek, Politzer (1973).", misc: "Asymptotic freedom does not mean quarks are free at low energies — the same running produces confinement at long distances." },
  { term: "Singularity", def: "A regime where curvature invariants diverge and general relativity ceases to predict.", adv: "Penrose–Hawking theorems show singularities are generic under reasonable energy conditions — inside black holes and at the Big Bang. They mark the theory's domain boundary, where quantum gravity is required.", misc: "A singularity is not a 'point of infinite density sitting in space'; it is a breakdown of the spacetime description itself." },
  { term: "Problem of time", def: "The clash between time's role in quantum mechanics (external parameter) and in general relativity (dynamical, observer-dependent).", adv: "In canonical quantum gravity the Hamiltonian is a constraint, so the wave functional carries no external time dependence; candidate resolutions use relational or emergent time.", misc: "This is a structural problem of quantization schemes — not evidence that 'time does not exist'." },
  { term: "Ryu–Takayanagi formula", def: "In holographic theories, the entanglement entropy of a boundary region equals the area of the minimal bulk surface anchored to it, in Planck units over 4.", adv: "S(A) = Area(γ_A)/4Għ (Ryu–Takayanagi 2006), generalized by quantum extremal surfaces. It ties quantum information on the boundary directly to geometry in the bulk — the sharpest version of 'spacetime from entanglement'.", misc: "The formula is proven only within the AdS/CFT framework; it is evidence about that framework, not a measured property of our universe." },
  { term: "Spin foam", def: "A path-integral history of spin networks: the covariant (sum-over-geometries) formulation of loop quantum gravity dynamics.", adv: "A spin foam is a 2-complex whose faces and edges carry group representations; amplitudes (e.g. the EPRL model) are proposed to define transition amplitudes between spin-network states.", misc: "Spin foams are candidate definitions of quantum dynamics, not established physics — whether they reproduce general relativity in the continuum limit is open." },
  { term: "Page curve", def: "The time-dependence of the entropy of Hawking radiation required by unitarity: rising, then falling back to zero as the black hole evaporates.", adv: "Page (1993) argued the radiation entropy must turn over at the 'Page time'. Replica-wormhole calculations (2019) recovered this curve from the gravitational path integral in model systems — strong evidence that evaporation is unitary.", misc: "Recovering the Page curve does not yet explain the mechanism by which information escapes, nor what an infalling observer experiences." },
  { term: "Hierarchy problem", def: "The puzzle of why the electroweak scale (~10² GeV) is so far below the Planck scale (~10¹⁹ GeV) when quantum corrections naturally drag scalar masses upward.", adv: "The Higgs mass parameter is quadratically sensitive to heavy new physics. Proposed stabilizations — supersymmetry, compositeness, extra dimensions — are increasingly constrained by LHC null results.", misc: "The hierarchy problem is a naturalness puzzle, not an inconsistency: the Standard Model functions perfectly well with a finely tuned parameter." },
  { term: "Compactification", def: "Curling up extra spatial dimensions into a space small enough to have escaped detection.", adv: "Superstring consistency requires ten dimensions; six are compactified, classically on Calabi–Yau manifolds whose topology determines the low-energy particle content. The multiplicity of choices feeds the landscape problem.", misc: "Extra dimensions are a requirement of string theory, not an observed feature of nature — collider and gravity experiments only bound their possible size." },
  { term: "Lorentz invariance", def: "The symmetry of special relativity: physics looks the same in all inertial frames, with one universal speed limit.", adv: "Some quantum gravity scenarios predict tiny Planck-suppressed violations (modified dispersion relations). Astrophysical timing of gamma-ray-burst photons constrains linear Planck-scale dispersion beyond E_P itself.", misc: "Quantum gravity does not require Lorentz violation — many approaches preserve it exactly; its observed precision is a constraint, not an anomaly." },
  { term: "Quantum foam", def: "Wheeler's heuristic picture of spacetime at the Planck scale as a froth of violently fluctuating geometry and topology.", adv: "Dimensional analysis suggests metric fluctuations of order unity at l_P, but no controlled calculation establishes the foam picture; different approaches replace it with strings, spin networks, or smooth fixed-point behavior.", misc: "'Quantum foam' is a vivid metaphor from 1955, not an observed or derived structure — treat any image of it as a hypothesis." },
  { term: "Unitarity", def: "The quantum-mechanical requirement that probabilities sum to one and information is preserved under time evolution.", adv: "Unitarity of black hole evaporation is the crux of the information paradox: exact thermality of Hawking radiation would violate it. Holography makes unitarity manifest on the boundary side.", misc: "Unitarity violation has never been observed; apparent information loss in semiclassical gravity signals the approximation breaking down, not established physics." },
];

/* ---------- related-concept graph for the glossary ---------- */
const QGA_GLOSS_LINKS = {
  "Gauge symmetry": ["Quantum field", "Running coupling", "Spontaneous symmetry breaking"],
  "Quantum field": ["Virtual particle", "Path integral", "Gauge symmetry"],
  "Renormalization": ["Running coupling", "Effective field theory", "Asymptotic freedom"],
  "Running coupling": ["Renormalization", "Asymptotic freedom"],
  "Spontaneous symmetry breaking": ["Gauge symmetry", "Hierarchy problem"],
  "Metric tensor": ["Geodesic", "Background independence", "Graviton"],
  "Geodesic": ["Metric tensor", "Singularity"],
  "Event horizon": ["Hawking radiation", "Bekenstein–Hawking entropy", "Singularity"],
  "Hawking radiation": ["Event horizon", "Page curve", "Unitarity"],
  "Bekenstein–Hawking entropy": ["Holographic principle", "Ryu–Takayanagi formula", "Event horizon"],
  "Planck scale": ["Quantum foam", "Lorentz invariance", "Effective field theory"],
  "Background independence": ["Metric tensor", "Spin network", "Problem of time"],
  "Holographic principle": ["AdS/CFT correspondence", "Bekenstein–Hawking entropy", "Ryu–Takayanagi formula"],
  "AdS/CFT correspondence": ["Holographic principle", "Ryu–Takayanagi formula", "Compactification"],
  "Spin network": ["Spin foam", "Background independence"],
  "Spin foam": ["Spin network", "Path integral"],
  "Virtual particle": ["Feynman diagram", "Quantum field"],
  "Feynman diagram": ["Virtual particle", "Path integral"],
  "Path integral": ["Feynman diagram", "Spin foam"],
  "Cosmological constant": ["Effective field theory", "Metric tensor"],
  "Graviton": ["Metric tensor", "Lorentz invariance"],
  "Wheeler–DeWitt equation": ["Problem of time", "Background independence"],
  "Effective field theory": ["Renormalization", "Planck scale"],
  "Asymptotic freedom": ["Running coupling", "Renormalization"],
  "Singularity": ["Event horizon", "Geodesic"],
  "Problem of time": ["Wheeler–DeWitt equation", "Background independence"],
  "Ryu–Takayanagi formula": ["AdS/CFT correspondence", "Bekenstein–Hawking entropy", "Page curve"],
  "Page curve": ["Hawking radiation", "Unitarity", "Ryu–Takayanagi formula"],
  "Hierarchy problem": ["Spontaneous symmetry breaking", "Renormalization"],
  "Compactification": ["Planck scale", "AdS/CFT correspondence"],
  "Lorentz invariance": ["Planck scale", "Graviton"],
  "Quantum foam": ["Planck scale", "Metric tensor"],
  "Unitarity": ["Hawking radiation", "Page curve"],
};

/* ---------- symbol atlas: notation registry with per-context rows ---------- */
const QGA_SYMBOLS = [
  {
    sym: "β", tex: "\\beta", cat: "Kinematics & causality",
    contexts: [
      { ctx: "Special relativity", eq: "\\beta \\equiv v/c", meaning: "Velocity as a fraction of light speed; β → 1 marks the ultra-relativistic limit.", unit: "dimensionless", module: "gr" },
      { ctx: "Renormalization group", eq: "\\beta(g) \\equiv \\mu\\,\\frac{\\partial g}{\\partial \\mu}", meaning: "The rate at which a coupling g runs with the energy scale μ.", unit: "dimensionless per e-fold of μ", module: "rg" },
    ],
  },
  {
    sym: "γ", tex: "\\gamma", cat: "Kinematics & causality",
    contexts: [
      { ctx: "Special relativity", eq: "\\gamma = \\frac{1}{\\sqrt{1-\\beta^{2}}}", meaning: "Lorentz factor — time dilation and the momentum boost p = γmv.", unit: "dimensionless", module: "gr" },
      { ctx: "Dirac theory", eq: "\\{\\gamma^{\\mu},\\gamma^{\\nu}\\} = 2\\eta^{\\mu\\nu}", meaning: "The 4×4 gamma matrices of the Dirac equation.", unit: "dimensionless matrices", module: "qft" },
      { ctx: "RG & dimensional regularization", eq: "\\gamma_{E} \\approx 0.5772", meaning: "The Euler–Mascheroni constant, arising in ε-expansion integrals.", unit: "dimensionless", module: "rg" },
    ],
  },
  {
    sym: "ct", tex: "ct", cat: "Kinematics & causality",
    contexts: [
      { ctx: "Minkowski geometry", eq: "x^{0} = ct", meaning: "Time plotted in length units; the atlas plots ct on the vertical axis of its spacetime diagrams.", unit: "metres", module: "gr" },
    ],
  },
  {
    sym: "τ", tex: "\\tau", cat: "Kinematics & causality",
    contexts: [
      { ctx: "Relativistic motion", eq: "c^{2}\\,\\mathrm{d}\\tau^{2} = -\\,\\mathrm{d}s^{2}", meaning: "Proper time — the time an idealized clock carried along a worldline actually records.", unit: "seconds", module: "gr" },
    ],
  },
  {
    sym: "s²", tex: "s^{2}", cat: "Kinematics & causality",
    contexts: [
      { ctx: "Spacetime geometry", eq: "s^{2} = -(c\\,\\Delta t)^{2} + (\\Delta\\mathbf{x})^{2}", meaning: "Invariant for every inertial observer; its sign classifies timelike / null / spacelike separations.", unit: "metres²", module: "gr" },
      { ctx: "Scattering kinematics", eq: "s = (p_{1} + p_{2})^{2}", meaning: "Mandelstam s — the squared centre-of-mass energy of a 2→2 collision.", unit: "GeV² (natural units)", module: "qft" },
    ],
  },
  {
    sym: "G", tex: "G", cat: "Constants & scales",
    contexts: [
      { ctx: "Newtonian gravity", eq: "G \\approx 6.674\\times10^{-11}\\ \\mathrm{m^{3}\\,kg^{-1}\\,s^{-2}}", meaning: "Newton's constant — sets the strength of gravity and, with ħ and c, defines the Planck scale.", unit: "m³ kg⁻¹ s⁻²", module: "planck" },
    ],
  },
  {
    sym: "ħ, c", tex: "\\hbar,\\;c", cat: "Constants & scales",
    contexts: [
      { ctx: "Natural units", eq: "\\hbar = c = 1", meaning: "The quantum of action ħ ≈ 1.055×10⁻³⁴ J·s and light speed c = 299 792 458 m/s. Formulas set both to one; the atlas restores them for numerical outputs.", unit: "J·s; m/s", module: "planck" },
    ],
  },
  {
    sym: "ℓ_P, t_P, m_P", tex: "\\ell_{P},\\;t_{P},\\;m_{P}", cat: "Constants & scales",
    contexts: [
      { ctx: "Planck scale", eq: "\\ell_{P} = \\sqrt{\\frac{\\hbar G}{c^{3}}} \\approx 1.616\\times10^{-35}\\ \\mathrm{m}", meaning: "Planck length; time t_P = ℓ_P/c ≈ 5.39×10⁻⁴⁴ s and mass m_P = √(ħc/G) ≈ 2.18×10⁻⁸ kg — where quantum gravity effects are expected to dominate.", unit: "m; s; kg", module: "planck" },
    ],
  },
  {
    sym: "α", tex: "\\alpha", cat: "Constants & scales",
    contexts: [
      { ctx: "Electromagnetism", eq: "\\alpha = \\frac{e^{2}}{4\\pi\\varepsilon_{0}\\hbar c} \\approx \\tfrac{1}{137}", meaning: "The fine-structure constant — the strength of the electromagnetic interaction at low energies.", unit: "dimensionless", module: "qft" },
      { ctx: "Running couplings", eq: "\\alpha(\\mu) = \\frac{g(\\mu)^{2}}{4\\pi}", meaning: "The same coupling written via the running g(μ); it grows logarithmically at short distances.", unit: "dimensionless", module: "rg" },
      { ctx: "Gravity as a coupling", eq: "\\alpha_{G} = \\frac{Gm^{2}}{\\hbar c}", meaning: "The gravitational analogue for two masses m; reaches unity near the Planck mass.", unit: "dimensionless", module: "approaches" },
    ],
  },
  {
    sym: "Λ", tex: "\\Lambda", cat: "Constants & scales",
    contexts: [
      { ctx: "Cosmology", eq: "R_{\\mu\\nu} - \\tfrac{1}{2}R\\,g_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\kappa T_{\\mu\\nu}", meaning: "The cosmological constant — vacuum energy density term in Einstein's equations; observed to be tiny but positive.", unit: "m⁻²", module: "gr" },
      { ctx: "QCD", eq: "\\Lambda_{\\mathrm{QCD}} \\approx 200\\ \\mathrm{MeV}", meaning: "The confinement scale where the strong coupling leaves the perturbative regime.", unit: "MeV", module: "rg" },
      { ctx: "Regularization", eq: "|p| \\leq \\Lambda", meaning: "UV cutoff — the highest momentum retained in an effective description; physical answers must not depend on it.", unit: "eV", module: "rg" },
    ],
  },
  {
    sym: "μ", tex: "\\mu", cat: "Constants & scales",
    contexts: [
      { ctx: "Renormalization group", eq: "g = g(\\mu)", meaning: "The sliding energy scale at which couplings are probed; β functions describe their flow in μ.", unit: "eV (renormalization scale)", module: "rg" },
      { ctx: "Index notation", eq: "x^{\\mu},\\;g_{\\mu\\nu}", meaning: "Spacetime index μ ∈ {0,1,2,3}; position (up/down) marks vector vs covector.", unit: "index", module: "gr" },
    ],
  },
  {
    sym: "g", tex: "g", cat: "Spacetime & gravity",
    contexts: [
      { ctx: "General relativity", eq: "g_{\\mu\\nu}", meaning: "The metric tensor — the dynamical field encoding distances, times and causal structure.", unit: "dimensionless field", module: "gr" },
      { ctx: "Gauge theory", eq: "g,\\;g'", meaning: "A coupling constant — e.g. the strong coupling g_s or electroweak couplings g, g′.", unit: "dimensionless", module: "qft" },
      { ctx: "Asymptotic safety", eq: "\\beta(g_{\\star}) = 0", meaning: "A fixed point of the RG flow — the UV completion candidate for gravity.", unit: "dimensionless", module: "rg" },
      { ctx: "String theory", eq: "g_{s}", meaning: "The string coupling counting splitting/joining of strings; perturbative expansions are power series in g_s.", unit: "dimensionless", module: "approaches" },
    ],
  },
  {
    sym: "Γ", tex: "\\Gamma", cat: "Spacetime & gravity",
    contexts: [
      { ctx: "Differential geometry", eq: "\\Gamma^{\\mu}_{\\alpha\\beta}", meaning: "Christoffel symbols — connection coefficients encoding how basis vectors change from point to point; they build geodesic equations.", unit: "1/length", module: "gr" },
      { ctx: "Decays & scattering", eq: "\\tau = \\hbar/\\Gamma", meaning: "A decay width; sets the lifetime τ and appears in collider cross-sections as ∝ 1/Γ.", unit: "GeV (natural units)", module: "qft" },
    ],
  },
  {
    sym: "R", tex: "R", cat: "Spacetime & gravity",
    contexts: [
      { ctx: "Curvature", eq: "S = \\frac{c^{4}}{16\\pi G}\\int R\\sqrt{-g}\\;\\mathrm{d}^{4}x", meaning: "Ricci scalar — the contraction of the Riemann tensor; enters the Einstein–Hilbert action.", unit: "1/length²", module: "gr" },
    ],
  },
  {
    sym: "κ", tex: "\\kappa", cat: "Spacetime & gravity",
    contexts: [
      { ctx: "Einstein's equations", eq: "G_{\\mu\\nu} = \\kappa T_{\\mu\\nu},\\quad \\kappa = \\frac{8\\pi G}{c^{4}}", meaning: "The coupling between geometry and stress-energy.", unit: "s² kg⁻¹ m⁻¹", module: "gr" },
      { ctx: "Black hole horizons", eq: "T_{H} = \\frac{\\hbar\\kappa}{2\\pi c k_{B}}", meaning: "Surface gravity — the acceleration a distant observer would infer at the horizon.", unit: "m/s²", module: "bh" },
    ],
  },
  {
    sym: "λ", tex: "\\lambda", cat: "Quantum fields & amplitudes",
    contexts: [
      { ctx: "Gauge theory (large-N)", eq: "\\lambda = g^{2}N", meaning: "The 't Hooft coupling — the natural expansion parameter of gauge theories at large N.", unit: "dimensionless", module: "qft" },
    ],
  },
  {
    sym: "N", tex: "N", cat: "Quantum fields & amplitudes",
    contexts: [
      { ctx: "QCD", eq: "N_{c} = 3", meaning: "The number of colour charges; N_f counts quark flavours entering the RG flow.", unit: "count", module: "qft" },
      { ctx: "Large-N expansion", eq: "N \\to \\infty", meaning: "Organizes gauge theory diagrams by topology; the seed of holographic duality.", unit: "count", module: "approaches" },
    ],
  },
  {
    sym: "S", tex: "S", cat: "Quantum fields & amplitudes",
    contexts: [
      { ctx: "Action principle", eq: "S = \\int \\mathcal{L}\\;\\mathrm{d}^{4}x", meaning: "The action whose stationary points give the equations of motion; ħ sets the phase e^{iS/ħ}.", unit: "J·s", module: "qft" },
      { ctx: "Black hole thermodynamics", eq: "S_{\\mathrm{BH}} = \\frac{k_{B}c^{3}A}{4G\\hbar}", meaning: "Bekenstein–Hawking entropy; the number of horizon microstates is e^{S_BH/k_B}.", unit: "J/K", module: "bh" },
    ],
  },
  {
    sym: "θ", tex: "\\theta", cat: "Renormalization group",
    contexts: [
      { ctx: "Critical exponents", eq: "\\theta = -\\beta'(g_{\\star})", meaning: "The critical exponent of an RG fixed point; θ > 0 marks a UV-attractive (relevant) direction and asymptotic safety.", unit: "dimensionless", module: "rg" },
    ],
  },
  {
    sym: "ν", tex: "\\nu", cat: "Renormalization group",
    contexts: [
      { ctx: "Critical phenomena", eq: "\\xi \\sim |g - g_{\\star}|^{-\\nu}", meaning: "Correlation-length exponent — how ξ diverges near a fixed point; ν > 0 signals a well-defined continuum limit.", unit: "dimensionless", module: "rg" },
    ],
  },
  {
    sym: "a★", tex: "a_{\\star}", cat: "Black holes & thermodynamics",
    contexts: [
      { ctx: "Kerr geometry", eq: "a_{\\star} = \\frac{Jc}{GM^{2}} \\in [\\,0,1)", meaning: "Dimensionless spin — from Schwarzschild (0) to extremal (→1); the atlas' black hole lab is parameterized by it.", unit: "dimensionless", module: "bh" },
    ],
  },
  {
    sym: "M", tex: "M", cat: "Black holes & thermodynamics",
    contexts: [
      { ctx: "Black hole mass", eq: "r_{s} = \\frac{2GM}{c^{2}}", meaning: "The irreducible mass scale of a black hole; sets the horizon radius and Hawking temperature T_H ∝ 1/M.", unit: "M☉ (solar masses)", module: "bh" },
    ],
  },
  {
    sym: "T_H", tex: "T_{H}", cat: "Black holes & thermodynamics",
    contexts: [
      { ctx: "Hawking radiation", eq: "T_{H} = \\frac{\\hbar c^{3}}{8\\pi GMk_{B}}", meaning: "The horizon temperature; a solar-mass black hole radiates far colder than the CMB.", unit: "kelvin", module: "bh" },
    ],
  },
  {
    sym: "A", tex: "A", cat: "Black holes & thermodynamics",
    contexts: [
      { ctx: "Horizon geometry", eq: "A = 8\\pi\\Big(\\frac{GM}{c^{2}}\\Big)^{2}\\big(1+\\sqrt{1-a_{\\star}^{2}}\\big)", meaning: "Horizon area — the state variable of black hole thermodynamics; entropy scales with A, not volume.", unit: "m²", module: "bh" },
      { ctx: "Gauge theory", eq: "F_{\\mu\\nu} = \\partial_{\\mu}A_{\\nu} - \\partial_{\\nu}A_{\\mu}", meaning: "The gauge (vector) potential; its field strength is F_μν.", unit: "potential field", module: "qft" },
    ],
  },
  {
    sym: "ℳ", tex: "\\mathcal{M}", cat: "Gravitational waves",
    contexts: [
      { ctx: "Binary inspiral", eq: "\\mathcal{M} = \\frac{(m_{1}m_{2})^{3/5}}{(m_{1}+m_{2})^{1/5}}", meaning: "Chirp mass — the combination that fixes the inspiral rate; GW150914 had ℳ ≈ 28 M☉.", unit: "M☉", module: "exp" },
    ],
  },
  {
    sym: "h", tex: "h", cat: "Gravitational waves",
    contexts: [
      { ctx: "GW strain", eq: "h = \\Delta L/L", meaning: "The dimensionless strain; LIGO's peak observed strain for GW150914 was ≈ 1.0×10⁻²¹.", unit: "dimensionless", module: "exp" },
      { ctx: "Quantum mechanics", eq: "h = 2\\pi\\hbar", meaning: "Planck's constant — the quantum of action; the atlas writes formulas with ħ.", unit: "J·s", module: "planck" },
    ],
  },
  {
    sym: "f", tex: "f", cat: "Gravitational waves",
    contexts: [
      { ctx: "Wave signals", eq: "f \\in [\\,10,\\,10^{3}\\,]\\;\\mathrm{Hz}", meaning: "GW frequency — sweeps upward through the inspiral (the 'chirp'); ground detectors listen from ~10 Hz to ~10³ Hz.", unit: "hertz", module: "exp" },
    ],
  },
];

/* ---------- notation conventions used across the atlas ---------- */
const QGA_CONVENTIONS = [
  { title: "Metric signature", tex: "\\mathrm{d}s^{2} = -(c\\,\\mathrm{d}t)^{2} + \\mathrm{d}\\mathbf{x}^{2}", body: "The atlas uses the (+,−,−,−) convention. Timelike separations have ds² < 0, so proper time obeys c²dτ² = −ds²." },
  { title: "Natural units", tex: "\\hbar = c = k_{B} = 1", body: "Formulas are written in natural units where convenient; every numerical output in the labs restores SI units explicitly." },
  { title: "Index placement", tex: "x^{\\mu}x_{\\mu} \\equiv \\sum_{\\mu=0}^{3} x^{\\mu}x_{\\mu}", body: "Upper indices mark vectors, lower indices covectors; repeated up/down pairs are summed (Einstein convention)." },
  { title: "Running couplings", tex: "g(\\mu)\\;\\text{vs.}\\;g_{0}", body: "A coupling written g(μ) is scale-dependent by definition; a bare g₀ is a regulator-dependent parameter, never an observable." },
  { title: "Status labels", body: "Established results carry the same weight as textbook physics; effective-model items hold only within a stated domain; conjectural items are active research." },
];

/* ---------- references (verified classics) ---------- */
const QGA_REFERENCES = [
  { tag: "GR", text: "A. Einstein, “Die Feldgleichungen der Gravitation,” Sitzungsberichte der Preussischen Akademie der Wissenschaften, 844–847 (1915)." },
  { tag: "QFT", text: "P. A. M. Dirac, “The Quantum Theory of the Electron,” Proceedings of the Royal Society A 117, 610–624 (1928)." },
  { tag: "QFT", text: "R. P. Feynman, “Space-Time Approach to Non-Relativistic Quantum Mechanics,” Reviews of Modern Physics 20, 367–387 (1948)." },
  { tag: "Gauge", text: "C. N. Yang and R. L. Mills, “Conservation of Isotopic Spin and Isotopic Gauge Invariance,” Physical Review 96, 191–195 (1954)." },
  { tag: "Higgs", text: "F. Englert and R. Brout, “Broken Symmetry and the Mass of Gauge Vector Mesons,” Physical Review Letters 13, 321–323 (1964)." },
  { tag: "Higgs", text: "P. W. Higgs, “Broken Symmetries and the Masses of Gauge Bosons,” Physical Review Letters 13, 508–509 (1964)." },
  { tag: "SM", text: "S. Weinberg, “A Model of Leptons,” Physical Review Letters 19, 1264–1266 (1967)." },
  { tag: "QCD", text: "D. J. Gross and F. Wilczek, “Ultraviolet Behavior of Non-Abelian Gauge Theories,” Physical Review Letters 30, 1343–1346 (1973); H. D. Politzer, “Reliable Perturbative Results for Strong Interactions?,” ibid., 1346–1349 (1973)." },
  { tag: "BH", text: "J. D. Bekenstein, “Black Holes and Entropy,” Physical Review D 7, 2333–2346 (1973)." },
  { tag: "BH", text: "S. W. Hawking, “Particle Creation by Black Holes,” Communications in Mathematical Physics 43, 199–220 (1975)." },
  { tag: "QG", text: "B. S. DeWitt, “Quantum Theory of Gravity. I. The Canonical Theory,” Physical Review 160, 1113–1148 (1967)." },
  { tag: "QG", text: "G. ’t Hooft and M. Veltman, “One-loop divergencies in the theory of gravitation,” Annales de l’Institut Henri Poincaré A 20, 69–94 (1974)." },
  { tag: "QG", text: "S. Weinberg, “Ultraviolet divergences in quantum theories of gravitation,” in General Relativity: An Einstein Centenary Survey, eds. S. W. Hawking and W. Israel, Cambridge University Press (1979)." },
  { tag: "LQG", text: "A. Ashtekar, “New Variables for Classical and Quantum Gravity,” Physical Review Letters 57, 2244–2247 (1986)." },
  { tag: "Holo", text: "G. ’t Hooft, “Dimensional Reduction in Quantum Gravity,” arXiv:gr-qc/9310026 (1993)." },
  { tag: "Holo", text: "L. Susskind, “The World as a Hologram,” Journal of Mathematical Physics 36, 6377–6396 (1995)." },
  { tag: "Holo", text: "J. Maldacena, “The Large N Limit of Superconformal Field Theories and Supergravity,” Advances in Theoretical and Mathematical Physics 2, 231–252 (1998); arXiv:hep-th/9711200." },
  { tag: "String", text: "A. Strominger and C. Vafa, “Microscopic Origin of the Bekenstein-Hawking Entropy,” Physics Letters B 379, 99–104 (1996)." },
  { tag: "EFT", text: "J. F. Donoghue, “General relativity as an effective field theory: The leading quantum corrections,” Physical Review D 50, 3874–3888 (1994)." },
  { tag: "Exp", text: "ATLAS Collaboration, “Observation of a new particle in the search for the Standard Model Higgs boson with the ATLAS detector at the LHC,” Physics Letters B 716, 1–29 (2012); CMS Collaboration, ibid., 30–61 (2012)." },
  { tag: "Exp", text: "B. P. Abbott et al. (LIGO Scientific and Virgo Collaborations), “Observation of Gravitational Waves from a Binary Black Hole Merger,” Physical Review Letters 116, 061102 (2016)." },
  { tag: "Exp", text: "Planck Collaboration, “Planck 2018 results. VI. Cosmological parameters,” Astronomy & Astrophysics 641, A6 (2020)." },
  { tag: "Exp", text: "Y. Fukuda et al. (Super-Kamiokande Collaboration), “Evidence for Oscillation of Atmospheric Neutrinos,” Physical Review Letters 81, 1562–1567 (1998)." },
  { tag: "QG", text: "M. H. Goroff and A. Sagnotti, “The ultraviolet behavior of Einstein gravity,” Nuclear Physics B 266, 709–736 (1986)." },
  { tag: "Holo", text: "S. Ryu and T. Takayanagi, “Holographic Derivation of Entanglement Entropy from AdS/CFT,” Physical Review Letters 96, 181602 (2006)." },
  { tag: "Exp", text: "Event Horizon Telescope Collaboration, “First M87 Event Horizon Telescope Results. I. The Shadow of the Supermassive Black Hole,” Astrophysical Journal Letters 875, L1 (2019)." },
  { tag: "BH", text: "G. Penington, “Entanglement Wedge Reconstruction and the Information Paradox,” Journal of High Energy Physics 09 (2020) 002." },
  { tag: "BH", text: "A. Almheiri, N. Engelhardt, D. Marolf, and H. Maxfield, “The entropy of bulk quantum fields and the entanglement wedge of an evaporating black hole,” Journal of High Energy Physics 12 (2019) 063." },
  { tag: "Text", text: "M. E. Peskin and D. V. Schroeder, An Introduction to Quantum Field Theory, Addison-Wesley (1995)." },
  { tag: "Text", text: "S. Weinberg, The Quantum Theory of Fields, Vols. I–II, Cambridge University Press (1995–1996)." },
  { tag: "Text", text: "C. W. Misner, K. S. Thorne, and J. A. Wheeler, Gravitation, W. H. Freeman (1973)." },
  { tag: "Text", text: "R. M. Wald, General Relativity, University of Chicago Press (1984)." },
  { tag: "Text", text: "J. Polchinski, String Theory, Vols. I–II, Cambridge University Press (1998)." },
  { tag: "Text", text: "C. Rovelli, Quantum Gravity, Cambridge University Press (2004)." },
  { tag: "BH", text: "J. M. Bardeen, W. H. Press, and S. A. Teukolsky, “Rotating Black Holes: Locally Nonrotating Frames, Energy Extraction, and Scalar Synchrotron Radiation,” Astrophysical Journal 178, 347–369 (1972). [Kerr ISCO]" },
  { tag: "BH", text: "D. N. Page, “Information in black hole radiation,” Physical Review Letters 71, 3743–3746 (1993). [Page curve]" },
  { tag: "SM", text: "Z. Maki, M. Nakagawa, and S. Sakata, “Remarks on the Unified Model of Elementary Particles,” Progress of Theoretical Physics 28, 870–880 (1962). [PMNS mixing]" },
  { tag: "SM", text: "M. Kobayashi and T. Maskawa, “CP-Violation in the Renormalizable Theory of Weak Interaction,” Progress of Theoretical Physics 49, 652–657 (1973). [CKM matrix]" },
  { tag: "Exp", text: "K. Abe et al. (T2K Collaboration), “Observation of Electron Neutrino Appearance in a Muon Neutrino Beam,” Physical Review Letters 112, 061802 (2014)." },
  { tag: "Data", text: "Particle Data Group (R. L. Workman et al.), “Review of Particle Physics,” Progress of Theoretical and Experimental Physics 2022, 083C01 (2022). [PDG masses, widths, mixing]" },
  { tag: "Data", text: "I. Esteban et al. (NuFIT 5.2), “The fate of hints: updated global analysis of three-flavor neutrino oscillations,” Journal of High Energy Physics 09 (2020) 178; nu-fit.org (2022)." },
];

/* ---------- open problems ---------- */
const QGA_OPEN_PROBLEMS = [
  { title: "No experimental data at the Planck scale", kind: "experimental", body: "The characteristic energy of quantum gravity (~10¹⁹ GeV) exceeds LHC collision energies by fifteen orders of magnitude. Every current approach is therefore constrained by consistency, not by direct measurement. Phenomenological windows — Lorentz-invariance tests, primordial gravitational waves, black hole observations — bound some models but have confirmed none." },
  { title: "The cosmological constant problem", kind: "conceptual", body: "Naive quantum field theory estimates of vacuum energy exceed the observed value of Λ by tens of orders of magnitude (the precise mismatch depends on the cutoff assumed). No accepted mechanism explains why the vacuum gravitates so little. This is widely regarded as the sharpest quantitative clash between quantum field theory and gravity." },
  { title: "Black hole information", kind: "conceptual", body: "Hawking evaporation appears thermal, raising the question of whether information that falls into a black hole is recovered. Recent gravitational path-integral calculations (replica wormholes, 2019) recover the unitary Page curve in model systems, but how information escapes — and what an infalling observer experiences — remains contested." },
  { title: "The problem of time", kind: "conceptual", body: "Canonical quantization of general relativity yields a constraint, ĤΨ = 0, with no external time parameter. Whether time is emergent, relational, or fundamental is unresolved, and different programs give different answers." },
  { title: "Background independence vs. quantization", kind: "conceptual", body: "Quantum field theory is formulated on a fixed spacetime; general relativity makes spacetime dynamical. No approach has fully reconciled manifest background independence with a controlled quantum framework that recovers known low-energy physics." },
  { title: "Singularities", kind: "technical", body: "Classical general relativity predicts its own breakdown inside black holes and at the Big Bang. Whether quantum gravity resolves these singularities — by a bounce, a fuzzball, a transition, or something else — is unknown." },
  { title: "Non-renormalizability of perturbative gravity", kind: "technical", body: "Perturbative quantum general relativity requires infinitely many counterterms ('t Hooft–Veltman 1974; Goroff–Sagnotti 1986 at two loops with matter and pure gravity respectively). The viable responses — new degrees of freedom (strings), nonperturbative fixed points (asymptotic safety), or quantized geometry (LQG) — define the field's main branches." },
  { title: "Defining local observables", kind: "technical", body: "Diffeomorphism invariance means no local quantity at a spacetime point is gauge-invariant: 'the field at x' is not an observable when x itself has no absolute meaning. Constructing the relational observables a background-independent quantum theory should predict — and showing they recover local physics — remains unfinished in every approach." },
  { title: "Selecting among approaches", kind: "experimental", body: "String theory, loop quantum gravity, asymptotic safety, and holography each capture compelling fragments. They make different foundational assumptions and, at present, no experiment discriminates among them. Honest comparison — not premature declaration of victory — is the scientifically defensible stance." },
];

/* ---------- learning pathways ---------- */
const QGA_PATHWAYS = [
  { id: "beginner", label: "Curious", blurb: "Plain-language explanations; the same honest science with the mathematics kept in the background." },
  { id: "student", label: "Student", blurb: "Physics-student depth: formulas, mechanisms, and the standard vocabulary of the field." },
  { id: "advanced", label: "Advanced", blurb: "Research-aware framing: technical caveats, scheme dependence, and pointers into the literature." },
];

/* ---------- concept bridges (pathway-aware module connectors) ---------- */
const QGA_BRIDGES = [
  { id: "sm-qft", from: "Standard Model", to: "Quantum Field Theory", next: "qft",
    beginner: "The particle table you just explored is really a list of fields — invisible media filling all of space. Each 'particle' is a ripple in one of them. The next module shows what that means.",
    student: "Every entry in the particle atlas is the quantum of a field. The Standard Model is a quantum field theory; to understand its structure — and why gravity resists joining it — you need the field-first picture developed next.",
    advanced: "The atlas catalogued representations of the SM gauge group; the next module supplies the underlying formalism — Fock space, propagators, the path integral — whose background-dependence is precisely what quantum gravity will later challenge." },
  { id: "qft-rg", from: "Quantum Field Theory", to: "Gauge Theory & RG", next: "rg",
    beginner: "Fields interact, and the strength of those interactions is not fixed — it depends on how closely you look. That 'zoom dependence' is the next idea, and it is where gravity first shows its problem.",
    student: "Perturbative QFT works because couplings are controlled under the renormalization group. The next module makes the running of couplings quantitative — the diagnostic tool that will flag gravity as non-renormalizable.",
    advanced: "With propagators and vertices in hand, Wilsonian RG flow organizes which interactions matter at which scale. Watch the mass dimension of each coupling — the dimensionful Gₙ is the entire story of Module 05." },
  { id: "rg-gr", from: "Gauge Theory & RG", to: "General Relativity", next: "gr",
    beginner: "You have now seen the quantum side: forces from symmetry, strengths that drift with scale. Before tackling why gravity resists this machinery, meet gravity on its own terms — as geometry, not force.",
    student: "The gauge couplings run logarithmically and stay perturbative; gravity's effective coupling GE² grows as a power law. To see why, you need the theory being quantized — Einstein's geometric description of gravity, next.",
    advanced: "The contrast is dimensional: marginal gauge couplings vs. an irrelevant operator with [G] = −2. Module 04 presents the Einstein–Hilbert action whose perturbative quantization generates the divergence structure Module 05 dissects." },
  { id: "gr-planck", from: "General Relativity", to: "The Planck Frontier", next: "planck",
    beginner: "Geometry that bends and quantum fields that fluctuate are both spectacularly confirmed — separately. Push them together and the mathematics breaks at one specific, almost unimaginably small scale: the Planck length.",
    student: "GR treats the metric classically; QFT needs a fixed metric to even define itself. The next module locates exactly where this truce fails — dimensional analysis, non-renormalizability, and the sixteen-orders-of-magnitude desert below experiment.",
    advanced: "Quantizing h_μν around η_μν surrenders background independence and still diverges at two loops (Goroff–Sagnotti). Module 05 frames the obstruction; whether it signals new degrees of freedom or a nonperturbative fixed point is the fork in the road." },
  { id: "planck-approaches", from: "The Planck Frontier", to: "QG Approaches", next: "approaches",
    beginner: "The problem is now sharp: smooth spacetime and quantum rules cannot both survive at the Planck scale unchanged. Several serious research programs propose what replaces them — none confirmed, all worth understanding.",
    student: "Non-renormalizability admits several logically distinct escapes: extended objects, quantized geometry, fixed points, holographic duals. The next module compares the major programs aspect by aspect, with their status labeled.",
    advanced: "Each program negotiates the same trilemma — perturbative control, background independence, nonperturbative definition — differently. The comparator makes the trade-offs explicit; note where each claims its black hole entropy derivation." },
  { id: "approaches-bh", from: "QG Approaches", to: "Black Holes & Holography", next: "bh",
    beginner: "How do you test ideas about physics no experiment can reach? With black holes — objects where gravity, quantum theory, and thermodynamics all collide. They are the field's shared thought-experiment laboratory.",
    student: "Every approach you just compared is judged against one benchmark: deriving S = A/4l_P² microscopically. The next module develops black hole thermodynamics, the information paradox, and the holographic principle they motivated.",
    advanced: "Strominger–Vafa and LQG horizon-state countings both target the Bekenstein–Hawking coefficient; AdS/CFT reframes evaporation unitarity entirely. Module 07 builds the semiclassical results these programs must reproduce." },
  { id: "bh-exp", from: "Black Holes & Holography", to: "Experimental Frontiers", next: "exp",
    beginner: "Black hole theory is beautiful — but what does the real world actually let us measure? The final module surveys the instruments and observations that constrain all these ideas today.",
    student: "Hawking radiation and holography remain theoretical. The next module covers what is measured — collider nulls, gravitational waves, black hole images, CMB bounds — and precisely what those measurements do and do not test.",
    advanced: "The observational program bounds the theory space: GW waveform consistency, EHT shadow diameters, Planck-scale dispersion limits from GRB timing. Module 08 catalogs the constraints and their (often misreported) logical force." },
  { id: "exp-open", from: "Experimental Frontiers", to: "Open Problems", next: "open",
    beginner: "You have crossed the whole atlas: from confirmed particles to ideas at the edge of knowledge. The honest ending is a list of what nobody knows yet — the questions that will define the field's future.",
    student: "With the experimental situation in view, the open-problems page states the field's unsolved questions — technical, conceptual, and experimental — in their current sharpest form.",
    advanced: "The frontier, stated plainly: UV completion, observables, the cosmological constant, the Page-curve mechanism. The open-problems page collects them with the limitations of this atlas itself." },
];

/* ---------- module registry ---------- */
const QGA_MODULES = [
  { id: "sm", num: "01", title: "The Standard Model", short: "Standard Model" },
  { id: "qft", num: "02", title: "Quantum Field Theory", short: "Quantum Fields" },
  { id: "rg", num: "03", title: "Gauge Theory & Renormalization", short: "Gauge & RG Flow" },
  { id: "gr", num: "04", title: "General Relativity", short: "General Relativity" },
  { id: "planck", num: "05", title: "Why Quantum Gravity Is Hard", short: "The Planck Frontier" },
  { id: "approaches", num: "06", title: "Quantum Gravity Approaches", short: "Theory Comparator" },
  { id: "bh", num: "07", title: "Black Holes & Holography", short: "Black Holes" },
  { id: "exp", num: "08", title: "Experimental Frontiers", short: "Experiment" },
];

Object.assign(window, {
  QGA_PARTICLES, QGA_CLASS_COLORS, QGA_couplings, QGA_SECTORS,
  QGA_THEORIES, QGA_ROWS, QGA_GLOSSARY, QGA_REFERENCES, QGA_OPEN_PROBLEMS, QGA_MODULES,
  QGA_PARTICLE_EXTRA, QGA_THEORY_META, QGA_GLOSS_LINKS, QGA_PATHWAYS, QGA_BRIDGES,
  QGA_SYMBOLS, QGA_CONVENTIONS,
});
