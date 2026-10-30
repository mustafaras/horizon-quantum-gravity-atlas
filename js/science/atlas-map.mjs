// The atlas map: the argument of the whole atlas as one graph.
//
// Nodes are the eight chapters, the key results each chapter actually computes, and the open problems the field has
// not settled. Edges are the reading path of js/data.jsx's ConceptBridges, the relation "this chapter computes this
// result", and "this problem bears on this chapter". Nothing on the map is invented: every result node carries the
// value the module prints and a `check` that recomputes it from the same pure function the module uses, so the map
// cannot drift from the science. test/atlas-map.test.mjs holds the two together.
//
// Positions come from a seeded force simulation run once in Node (scripts/build-atlas-layout.mjs) and committed to
// js/science/data/atlas-map-layout.mjs, so the runtime draws a static graph and never simulates.

import { idealCoefficient } from "./casimir.mjs";
import { kerrIsco } from "./kerr.mjs";
import { criticalDimension } from "./string-spectrum.mjs";
import { B_ONE_LOOP } from "./gauge-running.mjs";
import { PDG } from "./data/pdg.mjs";
import { DEFAULT_VARIANT, NUFIT } from "./data/nufit.mjs";
import { EHT_COMPARISONS } from "./data/eht.mjs";
import { SCHWARZSCHILD_CRITICAL_B } from "./kerr-shadow.mjs";
import { PAGE_BETA, pageTimeSummary } from "./evaporation.mjs";
import { PLANCK_ENERGY_GEV, fullDelaySeconds } from "./observational-net.mjs";
import { GR_TESTS } from "./data/gr-tests.mjs";
import { CMS_DIMUON, countsInWindow } from "./data/cms-dimuon.mjs";
import { REF } from "./references.mjs";
import { getVisualizationProvenance, registerVisualization } from "./provenance.mjs";

/** Kinds of node. `module` is a chapter, `result` a number the atlas computes, `problem` an open question. */
export const NODE_KINDS = Object.freeze(["module", "result", "problem"]);

/** Kinds of edge. `bridge` follows the reading path, `result` ties a chapter to its own result, `blocks` an open problem. */
export const EDGE_KINDS = Object.freeze(["bridge", "result", "blocks"]);

const PDG_MH = PDG.mH;
const MERCURY = GR_TESTS.find((t) => t.id === "mercury");
const NUFIT_NO = NUFIT.variants[DEFAULT_VARIANT].NO;

// The Fermi/LAT bound is quoted for a 31 GeV photon from a burst at z = 0.903, the redshift the chapter's own figure
// uses. The number is computed here by the same function the figure calls, so the map repeats it rather than copies it.
const FERMI_Z = 0.903;
const FERMI_ENERGY_GEV = 31;

/** The J/psi window of the CMS dimuon figure: whole 0.25 GeV bins with centres in 2.9-3.3 GeV. */
export const JPSI_WINDOW_GEV = Object.freeze([2.9, 3.3]);

/**
 * A node of the map. `value` is the string drawn on screen; `check` recomputes the same quantity from the module the
 * chapter renders. `tex` is the symbol KaTeX typesets; `detail` is the sentence the panel shows.
 */
function result({ id, view, label, tex, value, status, detail, reference, check }) {
  return Object.freeze({ id, kind: "result", view, label, tex, value, status, detail, reference, check });
}

export const ATLAS_RESULTS = Object.freeze([
  result({
    id: "sm-higgs-mass", view: "sm", status: "established",
    label: "Higgs boson mass", tex: "m_{H}", value: `${PDG_MH.value} ± ${PDG_MH.uncertainty} GeV`,
    detail: "The measured mass that fixes the quartic coupling lambda — the number the whole vacuum-stability question rests on.",
    reference: REF.PDG,
    check: () => PDG_MH.value,
  }),
  result({
    id: "sm-neutrino-mixing", view: "sm", status: "established",
    label: "Solar mixing angle", tex: "\\sin^{2}\\theta_{12}", value: NUFIT_NO.sin2theta12.value.toFixed(3),
    detail: `NuFIT global fit, normal ordering, ${DEFAULT_VARIANT}. The flavour ribbon of this chapter is drawn from these angles.`,
    reference: REF.NUFIT_6,
    check: () => NUFIT_NO.sin2theta12.value,
  }),
  result({
    id: "qft-casimir", view: "qft", status: "established",
    label: "Casimir coefficient", tex: "K_{C}", value: `${(idealCoefficient() * 1e27).toFixed(5)} × 10⁻²⁷ N m²`,
    detail: "pi^2 hbar c / 240, so the attraction between ideal plates is K_C / a^4. Measured to a few per cent: the vacuum is not empty.",
    reference: REF.BRESSI_2002,
    check: () => idealCoefficient() * 1e27,
  }),
  result({
    id: "rg-one-loop", view: "rg", status: "established",
    label: "One-loop beta coefficients", tex: "b_{0}",
    value: B_ONE_LOOP.sm.map((b) => String(Number(b.toFixed(4)))).join(", "),
    detail: "SU(3) x SU(2) x U(1) in the Standard Model. The three couplings run logarithmically and miss each other by a wide margin.",
    reference: REF.PDG,
    check: () => B_ONE_LOOP.sm[0],
  }),
  result({
    id: "gr-perihelion", view: "gr", status: "established",
    label: "Mercury perihelion advance", tex: "\\Delta\\varpi",
    value: `${MERCURY.measured.toFixed(3)} ± ${MERCURY.sigma.toFixed(3)} ″/century`,
    detail: "The first confirmation of general relativity, and still one of the sharpest: Shapiro's 1972 radar data.",
    reference: REF.MTW,
    check: () => MERCURY.measured,
  }),
  result({
    id: "gr-isco", view: "gr", status: "established",
    label: "Innermost stable orbit", tex: "r_{\\mathrm{ISCO}}", value: `${kerrIsco(0)} M`,
    detail: "The Schwarzschild value, exact. It sets the inner edge of every accretion disc this atlas draws.",
    reference: REF.MTW,
    check: () => kerrIsco(0),
  }),
  result({
    id: "planck-energy", view: "planck", status: "established",
    label: "Planck energy", tex: "E_{P}", value: `${(PLANCK_ENERGY_GEV / 1e19).toFixed(4)} × 10¹⁹ GeV`,
    detail: "sqrt(hbar c^5 / G). Fifteen orders of magnitude above the LHC — that gap is the whole problem of this chapter.",
    reference: REF.CODATA,
    check: () => PLANCK_ENERGY_GEV / 1e19,
  }),
  result({
    id: "approaches-dimension", view: "approaches", status: "established",
    label: "Bosonic critical dimension", tex: "D", value: `${criticalDimension()}`,
    detail: `The zeta-regularised normal-ordering sum fixes D = ${criticalDimension()}; the transverse oscillators supply 24 of it.`,
    reference: REF.POLCHINSKI,
    check: () => criticalDimension(),
  }),
  result({
    id: "bh-page-time", view: "bh", status: "effective",
    label: "Page time", tex: "t_{\\mathrm{Page}}/t_{\\mathrm{evap}}", value: pageTimeSummary().timeFraction.toFixed(4),
    detail: `With Page's beta = ${PAGE_BETA} the radiation entropy peaks at this fraction of the evaporation time. A model result, not a measurement.`,
    reference: REF.PAGE_2013,
    check: () => pageTimeSummary().timeFraction,
  }),
  result({
    id: "bh-shadow-edge", view: "bh", status: "effective",
    label: "Shadow edge", tex: "b_{\\mathrm{crit}}", value: `${SCHWARZSCHILD_CRITICAL_B.toFixed(6)} M`,
    detail: "The critical impact parameter of a Schwarzschild shadow: sqrt(27) M. The Kerr curve in this chapter starts here.",
    reference: REF.EHT_M87_2019_I,
    check: () => SCHWARZSCHILD_CRITICAL_B,
  }),
  result({
    id: "bh-eht-m87", view: "bh", status: "effective",
    label: "M87*: predicted vs measured", tex: "d",
    value: `${EHT_COMPARISONS[0].predictedUas.toFixed(2)} vs ${EHT_COMPARISONS[0].measuredUas.toFixed(1)} µas`,
    detail: `Shadow diameter against the measured emission ring, ${EHT_COMPARISONS[0].differencePercent.toFixed(1)} % apart — quoted at the ~10 % modelling level, not as a detection.`,
    reference: REF.EHT_M87_2019_VI,
    check: () => EHT_COMPARISONS[0].predictedUas,
  }),
  result({
    id: "exp-dimuon-jpsi", view: "exp", status: "established",
    label: "J/psi events", tex: "N_{J/\\psi}",
    value: `${countsInWindow(...JPSI_WINDOW_GEV)} events`,
    detail: `Counted in the real CMS Open Data dimuon spectrum (${CMS_DIMUON.eventsRead} events, CERN Open Data record 700, CC0) — measured data, not a fixture.`,
    reference: REF.REPO,
    check: () => countsInWindow(...JPSI_WINDOW_GEV),
  }),
  result({
    id: "exp-planck-delay", view: "exp", status: "effective",
    label: "Lorentz delay at 31 GeV", tex: "\\Delta t",
    value: `${fullDelaySeconds(FERMI_ENERGY_GEV, FERMI_Z, PLANCK_ENERGY_GEV).toFixed(2)} s`,
    detail: `The linear Lorentz-violation delay over a burst at z = ${FERMI_Z} with E_QG = E_P. Fermi's bound comes from not seeing it.`,
    reference: REF.FERMI_2009,
    check: () => fullDelaySeconds(FERMI_ENERGY_GEV, FERMI_Z, PLANCK_ENERGY_GEV),
  }),
]);

/** The eight chapters, in reading order. `num` matches js/data.jsx. */
export const ATLAS_MODULES = Object.freeze([
  { id: "sm", kind: "module", num: "01", title: "The Standard Model", status: "established" },
  { id: "qft", kind: "module", num: "02", title: "Quantum Field Theory", status: "established" },
  { id: "rg", kind: "module", num: "03", title: "Gauge Theory & RG", status: "established" },
  { id: "gr", kind: "module", num: "04", title: "General Relativity", status: "established" },
  { id: "planck", kind: "module", num: "05", title: "The Planck Frontier", status: "open" },
  { id: "approaches", kind: "module", num: "06", title: "QG Approaches", status: "conjectural" },
  { id: "bh", kind: "module", num: "07", title: "Black Holes & Holography", status: "effective" },
  { id: "exp", kind: "module", num: "08", title: "Experimental Frontiers", status: "effective" },
].map(Object.freeze));

/**
 * The reading path: consecutive chapters, exactly the `next` sequence of the ConceptBridges in js/data.jsx (the Higgs
 * bridges are spurs off this spine, not new stops). test/atlas-map.test.mjs parses data.jsx and asserts this list.
 */
export const ATLAS_SPINE = Object.freeze(["sm", "qft", "rg", "gr", "planck", "approaches", "bh", "exp"]);

/** The nine open problems of js/data.jsx, each attached to the chapters it bears on. */
export const ATLAS_PROBLEMS = Object.freeze([
  { id: "no-planck-data", kind: "problem", title: "No data at the Planck scale", status: "open", blocks: ["planck", "exp"], detail: "Fifteen orders of magnitude above the collider frontier; every approach is constrained by consistency, not measurement." },
  { id: "cosmological-constant", kind: "problem", title: "The cosmological constant", status: "open", blocks: ["qft", "gr", "planck"], detail: "QFT vacuum-energy estimates miss the observed Lambda by tens of orders of magnitude; no accepted mechanism explains why the vacuum gravitates so little." },
  { id: "information", kind: "problem", title: "Black hole information", status: "open", blocks: ["bh", "approaches"], detail: "Replica wormholes recover the Page curve in model systems, but how information escapes — and what an infalling observer sees — is contested." },
  { id: "problem-of-time", kind: "problem", title: "The problem of time", status: "open", blocks: ["approaches", "gr"], detail: "Canonical quantization gives H-Psi = 0 with no external time; whether time is emergent or relational is unresolved." },
  { id: "background-independence", kind: "problem", title: "Background independence", status: "open", blocks: ["qft", "approaches"], detail: "QFT needs a fixed metric; GR makes the metric dynamical. No approach has reconciled the two with a controlled quantum framework." },
  { id: "singularities", kind: "problem", title: "Singularities", status: "open", blocks: ["gr", "bh"], detail: "Classical GR predicts its own breakdown inside horizons and at the Big Bang; whether quantum gravity resolves this is unknown." },
  { id: "non-renormalizable", kind: "problem", title: "Non-renormalizability", status: "open", blocks: ["planck", "approaches"], detail: "Perturbative gravity needs infinitely many counterterms. Strings, asymptotic safety and quantized geometry are the three escapes." },
  { id: "local-observables", kind: "problem", title: "Defining local observables", status: "open", blocks: ["approaches"], detail: "Diffeomorphism invariance leaves no gauge-invariant local quantity; relational observables remain unfinished in every approach." },
  { id: "selecting-approaches", kind: "problem", title: "Selecting among approaches", status: "open", blocks: ["approaches", "exp"], detail: "String theory, LQG, asymptotic safety and holography each capture fragments; no experiment discriminates among them." },
].map(Object.freeze));

/** Every node of the map: chapters, results and problems. */
export function atlasNodes() {
  return Object.freeze([...ATLAS_MODULES, ...ATLAS_RESULTS, ...ATLAS_PROBLEMS]);
}

/** Every edge of the map, each node pair at most once per kind. */
export function atlasEdges() {
  const edges = [];
  const seen = new Set();
  const push = (from, to, kind) => {
    if (from === to) throw new RangeError(`atlas map: ${kind} edge from ${from} to itself`);
    const key = [from, to].sort().join("|") + "|" + kind;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(Object.freeze({ id: `${from}--${to}`, from, to, kind }));
  };
  for (let i = 0; i + 1 < ATLAS_SPINE.length; i += 1) push(ATLAS_SPINE[i], ATLAS_SPINE[i + 1], "bridge");
  for (const r of ATLAS_RESULTS) push(r.view, r.id, "result");
  for (const p of ATLAS_PROBLEMS) for (const view of p.blocks) push(view, p.id, "blocks");
  return Object.freeze(edges);
}

/**
 * The figures of each chapter, by provenance id. Verified by test/atlas-map.test.mjs: every id is registered, every
 * chapter has at least one figure, and the share bar is computed from the registry rather than from a constant.
 */
export const CHAPTER_FIGURES = Object.freeze({
  sm: ["sm-neutrino-flavour-vacuum", "sm-neutrino-flavour-matter", "sm-higgs-running", "sm-higgs-stability", "sm-interaction-map", "sm-higgs-hat", "collider-event-lab"],
  qft: ["qft-casimir-pressure", "qft-casimir-agreement", "qft-casimir-mode-sum", "qft-casimir-cavity", "qft-dispersion", "qft-waterfall", "qft-angular-distribution", "qft-ew-cross-section", "qft-ew-asymmetry", "qft-angular-channels", "qft-field-kinds", "qft-lattice-phi4", "qft-feynman-builder", "qft-scattering-explorer", "qft-field-lab", "qft-flux-tube"],
  rg: ["rg-scale-trajectory", "rg-beta-function", "rg-unification-couplings", "rg-unification-triangle", "rg-unification-couplings-mssm", "rg-unification-triangle-mssm", "rg-gravity-flow-silk", "rg-gravity-flow-trajectory", "rg-flow-field-3d-gravity", "rg-flow-field-3d", "rg-landscape-toy", "rg-landscape-asymptotic-safety"],
  gr: ["gr-effective-potential", "gr-null-geodesics", "gr-lensed-sky", "gr-simultaneity", "gr-curvature-2d", "gr-curvature-well", "gr-penrose-atlas", "gr-penrose-minkowski", "gr-penrose-schwarzschild", "gr-penrose-reissner-nordstrom", "gr-tidal-ring", "gr-tidal-stretch", "gr-tests-pull"],
  planck: ["planck-constraint-plane", "planck-spin-spectra", "planck-descent"],
  approaches: ["approaches-orrery", "approaches-microstructure", "approaches-causal-set", "approaches-spectral-dimension", "approaches-cdt", "approaches-string-spectrum", "ads-holography-lab", "spin-foam-lab"],
  bh: ["bh-hawking-spectrum", "bh-page-curve", "bh-spin-geometry", "bh-thermodynamics", "bh-hawking-lab", "bh-kerr-radii", "bh-greybody", "bh-kerr-shadow", "bh-eht-comparison", "bh-kerr-observatory"],
  exp: ["gw-strain", "gw-spectrogram", "experiments-dielectron-mass", "experiments-collider-event", "experiments-gw-chirp", "experiments-gw-sheet", "gw-pn-waveform", "gw-matched-filter", "gw-qtransform", "exp-cms-dimuon", "exp-observational-net", "gw-spacetime-instrument"],
});

/** The statuses the chapter bar has a segment for, in display order. */
export const CHAPTER_STATUS_ORDER = Object.freeze(["established", "effective", "schematic", "conjectural"]);

/**
 * The share of each chapter's figures per status. `statusOf(id)` returns a registered status or null; an unknown id
 * is skipped rather than guessed, and a chapter with no registered figure gets a zero-length bar.
 */
export function chapterStatusShares(statusOf, figures = CHAPTER_FIGURES) {
  const shares = {};
  for (const { id } of ATLAS_MODULES) {
    const counts = Object.fromEntries(CHAPTER_STATUS_ORDER.map((s) => [s, 0]));
    let total = 0;
    for (const figureId of figures[id] ?? []) {
      const status = statusOf(figureId);
      if (!status) continue;
      counts[status] = (counts[status] ?? 0) + 1;
      total += 1;
    }
    shares[id] = {
      total,
      counts,
      fractions: Object.fromEntries(Object.entries(counts).map(([s, n]) => [s, total ? n / total : 0])),
    };
  }
  return shares;
}

/** Neighbours of every node, in a deterministic order, for arrow-key navigation. */
export function atlasAdjacency(edges = atlasEdges()) {
  const adjacency = {};
  for (const edge of edges) {
    (adjacency[edge.from] ??= []).push(edge.to);
    (adjacency[edge.to] ??= []).push(edge.from);
  }
  for (const key of Object.keys(adjacency)) adjacency[key] = Object.freeze(adjacency[key]);
  return Object.freeze(adjacency);
}

/** One line per node and per edge: the text alternative the map's aria-describedby points at. */
export function atlasTextAlternative(nodes = atlasNodes(), edges = atlasEdges()) {
  const lines = [];
  for (const node of nodes) {
    if (node.kind === "module") lines.push(`${node.num} ${node.title} (${node.status} chapter)`);
    else if (node.kind === "result") lines.push(`${node.label}: ${node.value} (${node.status}, computed in ${node.view})`);
    else lines.push(`Open problem: ${node.title}`);
  }
  for (const edge of edges) {
    const verb = edge.kind === "bridge" ? "leads to" : edge.kind === "result" ? "computes" : "bears on";
    lines.push(`${edge.from} ${verb} ${edge.to}`);
  }
  return Object.freeze(lines);
}

export const ATLAS_MAP_PROVENANCE = Object.freeze({
  id: "atlas-map",
  model:
    "The atlas argument as a graph: eight chapters, fourteen key results the chapters compute, and nine open problems, joined by the reading path of js/data.jsx's ConceptBridges",
  status: "schematic",
  assumptions: Object.freeze([
    "The graph is a reading order and a set of dependencies, not a map of the field's structure: two adjacent chapters mean one introduces the next, not that they are theoretically equivalent",
    "Node positions come from a seeded force simulation and carry no quantity; distance and angle mean nothing",
    "An open problem's edges name the chapters it bears on, as the atlas states them in prose — they are not derived from any theory",
  ]),
  validity: Object.freeze([
    "Every result node repeats a number the atlas computes elsewhere, and a test recomputes it; the map adds no content of its own",
    "The status colours are the chapters' and figures' epistemic labels, not a ranking of research programmes",
  ]),
  numericalMethod:
    "Seeded spring-electric layout (Fruchterman-Reingold style) run once in scripts/build-atlas-layout.mjs and committed to js/science/data/atlas-map-layout.mjs; the runtime draws the committed positions",
  references: Object.freeze([REF.PDG, REF.PLANCK_2018, REF.CARLIP_2017, REF.REPO]),
  layers: Object.freeze([
    { name: "Nodes, edges and their status colours", class: "model" },
    { name: "Backdrop vignette and node glow", class: "decoration" },
  ]),
  seed: "Fixed constant 42 for the force simulation and the backdrop; no URL seed",
});

export function registerAtlasMapProvenance() {
  if (!getVisualizationProvenance(ATLAS_MAP_PROVENANCE.id)) registerVisualization(ATLAS_MAP_PROVENANCE.id, ATLAS_MAP_PROVENANCE);
}
