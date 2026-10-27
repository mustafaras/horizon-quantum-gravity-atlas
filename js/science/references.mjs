// Shared citations and the reader that turns a citation string into links.
//
// Every citation in a provenance entry carries one resolvable identifier: a DOI, an arXiv id, an ADS bibcode
// (written `bibcode:...`) or a URL. Each DOI below was looked up on Crossref (title, journal, volume, pages, year)
// and matches; books without a DOI link to their publisher's page. Chapter, section and equation numbers are not
// written because they cannot be checked offline (ledger D-046).

export const REF = Object.freeze({
  PDG: "Particle Data Group, Review of Particle Physics, PTEP 2022, 083C01, doi:10.1093/ptep/ptac097",
  CODATA: "Tiesinga, Mohr, Newell & Taylor, CODATA recommended values of the fundamental physical constants: 2018, Rev. Mod. Phys. 93, 025010 (2021), doi:10.1103/RevModPhys.93.025010",
  PLANCK_2018: "Planck Collaboration, Planck 2018 results. VI. Cosmological parameters, Astron. Astrophys. 641, A6 (2020), doi:10.1051/0004-6361/201833910",
  PESKIN: "Peskin & Schroeder, An Introduction to Quantum Field Theory (1995; CRC Press edition 2018), doi:10.1201/9780429503559",
  MTW: "Misner, Thorne & Wheeler, Gravitation (Freeman, 1973; Princeton University Press reissue 2017), https://press.princeton.edu/books/hardcover/9780691177793/gravitation",
  EINSTEIN_1905: "Einstein, Zur Elektrodynamik bewegter Körper, Ann. Phys. 322, 891 (1905), doi:10.1002/andp.19053221004",
  EINSTEIN_1916: "Einstein, Die Grundlage der allgemeinen Relativitätstheorie, Ann. Phys. 354, 769 (1916), doi:10.1002/andp.19163540702",
  SCHWARZSCHILD: "Schwarzschild, On the gravitational field of a mass point according to Einstein's theory (1916), arXiv:physics/9905030",
  FLAMM: "Flamm, Republication of: Contributions to Einstein's theory of gravitation, Gen. Relativ. Gravit. 47, 72 (2015), doi:10.1007/s10714-015-1908-2",
  DYSON_EDDINGTON: "Dyson, Eddington & Davidson, A determination of the deflection of light by the Sun's gravitational field, Phil. Trans. R. Soc. A 220, 291 (1920), doi:10.1098/rsta.1920.0009",
  PETERS_MATHEWS: "Peters & Mathews, Gravitational radiation from point masses in a Keplerian orbit, Phys. Rev. 131, 435 (1963), doi:10.1103/PhysRev.131.435",
  PETERS_1964: "Peters, Gravitational radiation and the motion of two point masses, Phys. Rev. 136, B1224 (1964), doi:10.1103/PhysRev.136.B1224",
  LIGO_GW150914: "Abbott et al. (LIGO Scientific and Virgo), Observation of gravitational waves from a binary black hole merger, Phys. Rev. Lett. 116, 061102 (2016), doi:10.1103/PhysRevLett.116.061102",
  BARDEEN_PRESS_TEUKOLSKY: "Bardeen, Press & Teukolsky, Rotating black holes: locally nonrotating frames, energy extraction, and scalar synchrotron radiation, Astrophys. J. 178, 347 (1972), doi:10.1086/151796",
  BARDEEN_CARTER_HAWKING: "Bardeen, Carter & Hawking, The four laws of black hole mechanics, Commun. Math. Phys. 31, 161 (1973), doi:10.1007/BF01645742",
  BEKENSTEIN: "Bekenstein, Black holes and entropy, Phys. Rev. D 7, 2333 (1973), doi:10.1103/PhysRevD.7.2333",
  HAWKING: "Hawking, Particle creation by black holes, Commun. Math. Phys. 43, 199 (1975), doi:10.1007/BF02345020",
  PAGE: "Page, Information in black hole radiation, Phys. Rev. Lett. 71, 3743 (1993), doi:10.1103/PhysRevLett.71.3743",
  GLASHOW: "Glashow, Partial-symmetries of weak interactions, Nucl. Phys. 22, 579 (1961), doi:10.1016/0029-5582(61)90469-2",
  WEINBERG: "Weinberg, A model of leptons, Phys. Rev. Lett. 19, 1264 (1967), doi:10.1103/PhysRevLett.19.1264",
  HIGGS: "Higgs, Broken symmetries and the masses of gauge bosons, Phys. Rev. Lett. 13, 508 (1964), doi:10.1103/PhysRevLett.13.508",
  FEYNMAN_1949: "Feynman, Space-time approach to quantum electrodynamics, Phys. Rev. 76, 769 (1949), doi:10.1103/PhysRev.76.769",
  KLEIN_1926: "Klein, Quantentheorie und fünfdimensionale Relativitätstheorie, Z. Phys. 37, 895 (1926), doi:10.1007/BF01397481",
  GORDON_1926: "Gordon, Der Comptoneffekt nach der Schrödingerschen Theorie, Z. Phys. 40, 117 (1926), doi:10.1007/BF01390840",
  MANDELSTAM: "Mandelstam, Determination of the pion-nucleon scattering amplitude from dispersion relations and unitarity. General theory, Phys. Rev. 112, 1344 (1958), doi:10.1103/PhysRev.112.1344",
  GROSS_WILCZEK: "Gross & Wilczek, Ultraviolet behavior of non-abelian gauge theories, Phys. Rev. Lett. 30, 1343 (1973), doi:10.1103/PhysRevLett.30.1343",
  POLITZER: "Politzer, Reliable perturbative results for strong interactions?, Phys. Rev. Lett. 30, 1346 (1973), doi:10.1103/PhysRevLett.30.1346",
  POLCHINSKI: "Polchinski, String Theory, vol. 1 (Cambridge University Press, 1998), doi:10.1017/CBO9780511816079",
  ROVELLI_BOOK: "Rovelli, Quantum Gravity (Cambridge University Press, 2004), doi:10.1017/CBO9780511755804",
  ROVELLI_SMOLIN_NETWORKS: "Rovelli & Smolin, Spin networks and quantum gravity, Phys. Rev. D 52, 5743 (1995), doi:10.1103/PhysRevD.52.5743",
  ROVELLI_SMOLIN_AREA: "Rovelli & Smolin, Discreteness of area and volume in quantum gravity, Nucl. Phys. B 442, 593 (1995), doi:10.1016/0550-3213(95)00150-Q",
  DONOGHUE: "Donoghue, General relativity as an effective field theory: the leading quantum corrections, Phys. Rev. D 50, 3874 (1994), doi:10.1103/PhysRevD.50.3874",
  REUTER: "Reuter, Nonperturbative evolution equation for quantum gravity, Phys. Rev. D 57, 971 (1998), doi:10.1103/PhysRevD.57.971",
  MALDACENA: "Maldacena, The large-N limit of superconformal field theories and supergravity, Int. J. Theor. Phys. 38, 1113 (1999), doi:10.1023/A:1026654312961",
  HOSSENFELDER: "Hossenfelder, Minimal length scale scenarios for quantum gravity, Living Rev. Relativ. 16, 2 (2013), doi:10.12942/lrr-2013-2",
  MEAD: "Mead, Possible connection between gravitation and fundamental length, Phys. Rev. 135, B849 (1964), doi:10.1103/PhysRev.135.B849",
  JAMES_2015: "James, von Tunzelmann, Franklin & Thorne, Gravitational lensing by spinning black holes in astrophysics, and in the movie Interstellar, Class. Quantum Grav. 32, 065001 (2015), doi:10.1088/0264-9381/32/6/065001",
  VIRBHADRA_ELLIS: "Virbhadra & Ellis, Schwarzschild black hole lensing, Phys. Rev. D 62, 084003 (2000), doi:10.1103/PhysRevD.62.084003",
  CACCIARI_ANTI_KT: "Cacciari, Salam & Soyez, The anti-kt jet clustering algorithm, JHEP 04 (2008) 063, doi:10.1088/1126-6708/2008/04/063",
  BALI: "Bali, QCD forces and heavy quark bound states, Phys. Rep. 343, 1 (2001), doi:10.1016/S0370-1573(00)00079-X",
  RYU_TAKAYANAGI: "Ryu & Takayanagi, Holographic derivation of entanglement entropy from the anti-de Sitter space/conformal field theory correspondence, Phys. Rev. Lett. 96, 181602 (2006), doi:10.1103/PhysRevLett.96.181602",
  MALDACENA_ATMP: "Maldacena, The large N limit of superconformal field theories and supergravity, Adv. Theor. Math. Phys. 2, 231 (1998), doi:10.4310/ATMP.1998.v2.n2.a1, arXiv:hep-th/9711200",
  CALABRESE_CARDY: "Calabrese & Cardy, Entanglement entropy and quantum field theory, J. Stat. Mech. (2004) P06002, doi:10.1088/1742-5468/2004/06/P06002",
  PDG_2024: "Particle Data Group, Review of Particle Physics, Phys. Rev. D 110, 030001 (2024), doi:10.1103/PhysRevD.110.030001",
  ATLAS_2008: "ATLAS Collaboration, The ATLAS experiment at the CERN Large Hadron Collider, JINST 3, S08003 (2008), doi:10.1088/1748-0221/3/08/S08003",
  PAGE_1976: "Page, Particle emission rates from a black hole: massless particles from an uncharged, nonrotating hole, Phys. Rev. D 13, 198 (1976), doi:10.1103/PhysRevD.13.198",
  BAEZ_1998: "Baez, Spin foam models, Class. Quantum Grav. 15, 1827 (1998), doi:10.1088/0264-9381/15/7/004",
  PEREZ_2013: "Perez, The spin-foam approach to quantum gravity, Living Rev. Relativ. 16, 3 (2013), doi:10.12942/lrr-2013-3",
  MAGGIORE: "Maggiore, Gravitational Waves, vol. 1: Theory and Experiments (Oxford University Press, 2007), doi:10.1093/acprof:oso/9780198570745.001.0001",
  CARTER_1968: "Carter, Global structure of the Kerr family of gravitational fields, Phys. Rev. 174, 1559 (1968), doi:10.1103/PhysRev.174.1559",
  PAGE_THORNE: "Page & Thorne, Disk-accretion onto a black hole. Time-averaged structure of accretion disk, Astrophys. J. 191, 499 (1974), doi:10.1086/152990",
  GRALLA_LUPSASCA_MARRONE: "Gralla, Lupsasca & Marrone, The shape of the black hole photon ring: a precise test of strong-field general relativity, Phys. Rev. D 102, 124004 (2020), doi:10.1103/PhysRevD.102.124004",
  BLANDFORD_ZNAJEK: "Blandford & Znajek, Electromagnetic extraction of energy from Kerr black holes, Mon. Not. R. Astron. Soc. 179, 433 (1977), doi:10.1093/mnras/179.3.433",
  TCHEKHOVSKOY: "Tchekhovskoy, Narayan & McKinney, Black hole spin and the radio loud/quiet dichotomy of active galactic nuclei, Astrophys. J. 711, 50 (2010), doi:10.1088/0004-637X/711/1/50",
  MCKINNEY_NARAYAN: "McKinney & Narayan, Disc-jet coupling in black hole accretion systems - I. General relativistic magnetohydrodynamical models, Mon. Not. R. Astron. Soc. 375, 513 (2007), doi:10.1111/j.1365-2966.2006.11301.x",
  NUFIT_6: "Esteban, Gonzalez-Garcia, Maltoni, Martinez-Soler, Pinheiro & Schwetz, NuFit-6.0: updated global analysis of three-flavor neutrino oscillations, JHEP 12 (2024) 216, doi:10.1007/JHEP12(2024)216, arXiv:2410.05380",
  T2K_2021: "T2K Collaboration, Improved constraints on neutrino mixing from the T2K experiment with 3.13e21 protons on target, Phys. Rev. D 103, 112008 (2021), doi:10.1103/PhysRevD.103.112008, arXiv:2101.03779",
  NOVA_2018: "NOvA Collaboration, New constraints on oscillation parameters from nu_e appearance and nu_mu disappearance in the NOvA experiment, Phys. Rev. D 98, 032012 (2018), doi:10.1103/PhysRevD.98.032012, arXiv:1806.00096",
  DUNE_TDR: "DUNE Collaboration, Deep Underground Neutrino Experiment (DUNE), Far Detector Technical Design Report, Volume II: DUNE Physics (2020), arXiv:2002.03005",
  JUNO_2016: "JUNO Collaboration, Neutrino physics with JUNO, J. Phys. G 43, 030401 (2016), doi:10.1088/0954-3899/43/3/030401, arXiv:1507.05613",
  WOLFENSTEIN: "Wolfenstein, Neutrino oscillations in matter, Phys. Rev. D 17, 2369 (1978), doi:10.1103/PhysRevD.17.2369",
  BARGER_1980: "Barger, Whisnant, Pakvasa & Phillips, Matter effects on three-neutrino oscillations, Phys. Rev. D 22, 2718 (1980), doi:10.1103/PhysRevD.22.2718",
  MNS_1962: "Maki, Nakagawa & Sakata, Remarks on the unified model of elementary particles, Prog. Theor. Phys. 28, 870 (1962), doi:10.1143/PTP.28.870",
  PDG_2026: "Particle Data Group (Takahashi et al.), Review of Particle Physics, Int. J. Mod. Phys. A 41, 2630011 (2026), https://pdg.lbl.gov/2026/",
  MONTVAY_MUENSTER_1994: "Montvay & Münster, Quantum Fields on a Lattice, Cambridge University Press (1994), doi:10.1017/CBO9780511470783",
  HAIRER_2003: "Hairer, Lubich & Wanner, Geometric numerical integration illustrated by the Störmer–Verlet method, Acta Numerica 12, 399–450 (2003), doi:10.1017/S0962492902000144",
  DASHEN_1974: "Dashen, Hasslacher & Neveu, Nonperturbative methods and extended-hadron models in field theory. II. Two-dimensional models and extended hadrons, Phys. Rev. D 10, 4130 (1974), doi:10.1103/PhysRevD.10.4130",
  BUTTAZZO_2013: "Buttazzo, Degrassi, Giardino, Giudice, Sala, Salvio & Strumia, Investigating the near-criticality of the Higgs boson, JHEP 12 (2013) 089, doi:10.1007/JHEP12(2013)089, arXiv:1307.3536",
  NIST_CONSTANTS:"NIST Reference on Constants, Units, and Uncertainty (CODATA recommended values: Fermi coupling constant, atomic mass constant), retrieved 2026-10-24, https://physics.nist.gov/cgi-bin/cuu/Value?gf",
  BRESSI_2002: "Bressi, Carugno, Onofrio & Ruoso, Measurement of the Casimir force between parallel metallic surfaces, Phys. Rev. Lett. 88, 041804 (2002), doi:10.1103/PhysRevLett.88.041804, arXiv:quant-ph/0203002",
  LAMOREAUX_1997: "Lamoreaux, Demonstration of the Casimir force in the 0.6 to 6 μm range, Phys. Rev. Lett. 78, 5 (1997), doi:10.1103/PhysRevLett.78.5",
  JAFFE_2005: "Jaffe, The Casimir effect and the quantum vacuum, Phys. Rev. D 72, 021301 (2005), doi:10.1103/PhysRevD.72.021301, arXiv:hep-th/0503158",
  BORDAG_2001: "Bordag, Mohideen & Mostepanenko, New developments in the Casimir effect, Phys. Rep. 353, 1 (2001), doi:10.1016/S0370-1573(01)00015-1",
  LEP_SLC_2006: "ALEPH, DELPHI, L3, OPAL, SLD Collaborations, LEP Electroweak Working Group and SLD Electroweak and Heavy Flavour Groups, Precision electroweak measurements on the Z resonance, Phys. Rep. 427, 257 (2006), doi:10.1016/j.physrep.2005.12.006, arXiv:hep-ex/0509008",
  STEINHAUSER_1998: "Steinhauser, Leptonic contribution to the effective electromagnetic coupling constant up to three loops, Phys. Lett. B 429, 158 (1998), doi:10.1016/S0370-2693(98)00503-6, arXiv:hep-ph/9803313",
  MARTIN_VAUGHN_1994: "Martin & Vaughn, Two-loop renormalization group equations for soft supersymmetry-breaking couplings, Phys. Rev. D 50, 2282 (1994), doi:10.1103/PhysRevD.50.2282, arXiv:hep-ph/9311340",
  REUTER_SAUERESSIG_2012: "Reuter & Saueressig, Quantum Einstein gravity, New J. Phys. 14, 055022 (2012), doi:10.1088/1367-2630/14/5/055022, arXiv:1202.2274",
  LITIM_2004: "Litim, Fixed points of quantum gravity, Phys. Rev. Lett. 92, 201301 (2004), doi:10.1103/PhysRevLett.92.201301, arXiv:hep-th/0312114",
  REPO: "HORIZON Quantum Gravity Atlas, source of the model, https://github.com/mustafaras/horizon-quantum-gravity-atlas",
});

const DOI = /(?:\bdoi:\s*|https?:\/\/(?:dx\.)?doi\.org\/)(10\.\d{4,9}\/\S+)/gi;
const ARXIV = /\barXiv:\s*((?:[a-z-]+(?:\.[A-Z]{2})?\/\d{7})|(?:\d{4}\.\d{4,5}))(?:v\d+)?/gi;
const BIBCODE = /\bbibcode:\s*(\d{4}[A-Za-z0-9.&]{15})/g;
const URL_PATTERN = /https?:\/\/[^\s,;]+/g;

/** Drops sentence punctuation after an identifier, keeping a closing bracket that has an opening one inside. */
function trimIdentifier(raw) {
  let end = raw.length;
  while (end > 0) {
    const last = raw[end - 1];
    const opens = raw.slice(0, end).split("(").length - 1;
    const closes = raw.slice(0, end).split(")").length - 1;
    if (/[.,;:]/.test(last) || (last === ")" && closes > opens)) end -= 1;
    else break;
  }
  return raw.slice(0, end);
}

/** Every identifier in a citation string, as `{ kind, id, href }`: DOI, arXiv id, ADS bibcode, then any other URL. */
export function referenceLinks(text) {
  const source = String(text ?? "");
  const links = [];
  const taken = [];
  const take = (kind, id, href, start, end) => {
    links.push({ kind, id, href });
    taken.push([start, end]);
  };
  for (const match of source.matchAll(DOI)) {
    const id = trimIdentifier(match[1]);
    take("doi", id, `https://doi.org/${id}`, match.index, match.index + match[0].length);
  }
  for (const match of source.matchAll(ARXIV)) take("arxiv", match[1], `https://arxiv.org/abs/${match[1]}`, match.index, match.index + match[0].length);
  for (const match of source.matchAll(BIBCODE)) take("bibcode", match[1], `https://ui.adsabs.harvard.edu/abs/${match[1]}`, match.index, match.index + match[0].length);
  for (const match of source.matchAll(URL_PATTERN)) {
    const start = match.index;
    if (taken.some(([from, to]) => start >= from && start < to)) continue;
    const id = trimIdentifier(match[0]);
    take("url", id, id, start, start + match[0].length);
  }
  return links;
}

export function hasReferenceIdentifier(text) {
  return referenceLinks(text).length > 0;
}
