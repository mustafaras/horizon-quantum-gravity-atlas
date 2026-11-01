/* Compiled from js/mod-planck.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

// mod-planck.jsx — Module 05: Why Quantum Gravity Is Difficult
function ModulePlanck(_ref) {
  var go = _ref.go;
  return /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement(ModuleHeader, {
    num: "05",
    kicker: "The obstruction",
    title: "Why Quantum Gravity Is Difficult",
    lede: "Quantum field theory assumes a fixed spacetime stage; general relativity makes the stage itself dynamical. Reconciling the two is not a matter of missing cleverness alone \u2014 concrete technical obstructions appear the moment one tries, and they point to the Planck scale.",
    target: "#planck-constraint-plane"
  }), /*#__PURE__*/React.createElement(Section, {
    title: "The structural conflict"
  }, /*#__PURE__*/React.createElement("p", null, "Every quantum field theory in Modules 01\u201303 is formulated ", /*#__PURE__*/React.createElement("em", null, "on"), " a spacetime: fields are functions of spacetime points, causality is defined by its light cones, and time evolution is generated relative to its clock. General relativity removes that scaffolding \u2014 the metric is a dynamical field like any other. A quantum theory of gravity must therefore quantize the very structure that quantum theory normally presupposes. Two famous symptoms of this circularity: ", /*#__PURE__*/React.createElement("strong", null, "background independence"), " (what do we expand around, if geometry itself fluctuates?) and the ", /*#__PURE__*/React.createElement("strong", null, "problem of time"), " (the canonical Hamiltonian becomes a constraint, \u0124\u03A8 = 0, with no external time parameter left to evolve in).")), /*#__PURE__*/React.createElement(Section, {
    title: "Non-renormalizability"
  }, /*#__PURE__*/React.createElement("p", null, "The technical obstruction is sharper. Newton's constant has mass dimension \u22122, so the dimensionless strength of gravity at energy E grows as ", /*#__PURE__*/React.createElement(Eq, {
    tex: "G E^2 / (\\hbar c^5)"
  }), ". Loop corrections in perturbative quantum gravity therefore produce divergences of ever-increasing severity: 't Hooft and Veltman exhibited the one-loop divergences of gravity with matter (1974), and Goroff and Sagnotti proved pure gravity diverges at two loops (1986). Absorbing them requires infinitely many independent counterterms \u2014 infinitely many measurements to fix the theory. Predictivity collapses precisely at the Planck scale, where the expansion parameter reaches unity."), /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Planck units",
    status: "established",
    formulaId: "planck-length",
    texAfter: "\\approx 1.6\\times10^{-35}\\,\\mathrm{m}, \\quad E_P = \\sqrt{\\frac{\\hbar c^5}{G}} \\approx 1.22\\times10^{19}\\,\\mathrm{GeV}",
    symbols: [{
      s: "l_P",
      d: "Planck length — the unique length built from ħ, G, c. Also: the Schwarzschild radius of a Planck-mass black hole, up to O(1) factors."
    }, {
      s: "E_P",
      d: "Planck energy ($\\approx 2$ GJ — a lightning bolt's energy in a single quantum). Planck mass $m_P\\approx2.18\\times10^{-8}$ kg."
    }],
    meaning: "Dimensional analysis alone locates the quantum gravity regime: where the Compton wavelength of an object equals its Schwarzschild radius.",
    limits: "These are scales, not measured thresholds. What actually happens there is unknown."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Perturbative expansion of the metric",
    status: "effective",
    formulaId: "planck-metric-perturbation",
    symbols: [{
      s: "\\eta_{\\mu\\nu}",
      d: "Fixed flat background metric — the move that surrenders background independence."
    }, {
      s: "h_{\\mu\\nu}",
      d: "Graviton field: quantized weak-field ripples, spin 2."
    }, {
      s: "\\kappa",
      d: "Gravitational coupling; dimensionful, with $[\\kappa]=\\mathrm{energy}^{-1}$ — the origin of non-renormalizability."
    }],
    meaning: "The standard route to 'quantum gravity as a QFT'. It works beautifully \u2014 but only as an effective theory at energies far below $E_P$.",
    limits: "The expansion is in $\\kappa E\\sim E/E_P$; at Planckian energies every order contributes equally and the series tells you nothing."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Growth of the effective coupling",
    status: "established",
    formulaId: "planck-effective-coupling",
    symbols: [{
      s: "\\alpha_{\\mathrm{grav}}",
      d: "Dimensionless measure of gravity's strength at energy E (compare $\\alpha\\approx1/137$ for electromagnetism)."
    }, {
      s: "E/E_P",
      d: "At LHC energies this is $\\sim10^{-15}$, making quantum gravity effects experimentally invisible — and the theory's UV behavior untestable directly."
    }],
    meaning: "Contrast with the gauge couplings of Module 03, which run logarithmically. Gravity's strength grows as a power law \u2014 the renormalization group flow leaves the perturbative domain.",
    limits: "Schematic scaling argument; the asymptotic safety program (Module 06) conjectures the full nonperturbative flow may nonetheless reach a fixed point."
  })), /*#__PURE__*/React.createElement("div", {
    className: "derivation-grid"
  }, /*#__PURE__*/React.createElement(DerivationStepper, {
    derivationId: "derivation-planck-length"
  }))), /*#__PURE__*/React.createElement(Section, {
    title: "Descent to the Planck scale"
  }, /*#__PURE__*/React.createElement("p", null, "Drag the slider to descend from human scale to the Planck length. The grid represents the operational notion of smooth classical geometry; near the Planck scale, combining the uncertainty principle with gravity suggests metric fluctuations of order unity \u2014 the regime where every approach in Module 06 must say something new."), /*#__PURE__*/React.createElement(ScaleLadder, null)), /*#__PURE__*/React.createElement(Section, {
    title: "The map of the unseen"
  }, /*#__PURE__*/React.createElement(ConstraintPlane, {
    go: go
  })), /*#__PURE__*/React.createElement(Section, {
    title: "Spin networks and spin foam, computed"
  }, /*#__PURE__*/React.createElement("p", null, "Loop quantum gravity proposes that area and volume come in discrete quanta carried by a graph: edges labelled by spins, nodes by intertwiners. This lab builds a real one \u2014 a Schlegel-projected four-simplex with admissible spin labels drawn from the shared seed \u2014 and renders it in three dimensions: edge tubes colored by the area they carry, node spheres sized by a schematic volume proxy, and a foam mode that ghosts the deterministic step history along an evolution axis. Every number on screen (area spectrum, total area, node volumes) is computed by ", /*#__PURE__*/React.createElement("code", null, "js/science/spin-networks.mjs"), "; the foam dynamics are a disclosed pedagogical sketch, not a computed path integral."), /*#__PURE__*/React.createElement(SpinFoamLab, null)), /*#__PURE__*/React.createElement(Misconception, {
    title: "Spacetime discreteness is not established."
  }, "The fluctuating grid above is a visualization aid, not an observation. Whether spacetime at the Planck scale is discrete, foamy, stringy, emergent, or smooth-but-quantum is precisely what the competing research programs disagree about. No experiment currently distinguishes them."), /*#__PURE__*/React.createElement(Misconception, {
    title: "Gravity has been quantized \u2014 at low energies."
  }, "The statement 'quantum gravity does not exist' is too strong. As an effective field theory, graviton loops give finite, unambiguous corrections at accessible energies (Module 06). What is missing is the ultraviolet completion: the theory valid at and beyond the Planck scale."), /*#__PURE__*/React.createElement(ConceptBridge, {
    id: "planck-approaches",
    go: go
  }));
}
window.ModulePlanck = ModulePlanck;