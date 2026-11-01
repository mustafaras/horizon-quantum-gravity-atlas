/* Compiled from js/labs/higgs-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// higgs-lab.jsx — the physical Higgs potential and the stability of its vacuum (S13).
// The calculation is js/science/higgs.mjs and higgs-running.mjs (window.QGA_HIGGS), the hat is the TSL scene
// js/visualizations/sm/mexican-hat.mjs, and the two plots are Figure Kit figures (js/figure/plots/higgs.mjs);
// this file holds the controls and the readouts.

var HG_MT_RANGE = [160, 185];
var HG_MH_RANGE = [120, 130];
var HG_DIAGRAM_MT = [164, 182];
var HG_BOUNDARY_MH = Array.from({
  length: 21
}, function (_, i) {
  return 120 + i * 0.5;
});
var HG_BOUNDARY_MT = [150, 200];
var HG_REGION_TEXT = {
  stable: "absolutely stable",
  metastable: "metastable",
  unstable: "unstable"
};
function HiggsLab(_ref) {
  var go = _ref.go;
  var H = window.QGA_HIGGS;
  var PDG = H.PDG;
  var _useState = useState(false),
    _useState2 = _slicedToArray(_useState, 2),
    symmetric = _useState2[0],
    setSymmetric = _useState2[1];
  var _useState3 = useState(PDG.mt.value),
    _useState4 = _slicedToArray(_useState3, 2),
    mt = _useState4[0],
    setMt = _useState4[1];
  var _useState5 = useState(PDG.mH.value),
    _useState6 = _slicedToArray(_useState5, 2),
    mH = _useState6[0],
    setMH = _useState6[1];
  var control = useRef({
    symmetric: false
  }).current;
  control.symmetric = symmetric;
  var v = useMemo(function () {
    return H.vevFromFermi(PDG.GF.value);
  }, []);
  var moved = mt !== PDG.mt.value || mH !== PDG.mH.value;
  var run = useMemo(function () {
    return H.runFromInputs({
      mt: mt,
      mH: mH,
      alphaS: PDG.alphaS.value
    });
  }, [mt, mH]);
  var band = useMemo(function () {
    return H.lambdaBand({
      mt: {
        value: mt,
        uncertainty: PDG.mt.uncertainty
      },
      mH: mH,
      alphaS: PDG.alphaS
    });
  }, [mt, mH]);
  var boundaries = useMemo(function () {
    return H.stabilityBoundaries({
      mHValues: HG_BOUNDARY_MH,
      mtRange: HG_BOUNDARY_MT
    });
  }, []);
  var decay = useMemo(function () {
    return H.vacuumDecay(run);
  }, [run]);
  var instability = useMemo(function () {
    return H.instabilityScale(run);
  }, [run]);
  var region = H.regionOf(decay);
  var runningSpec = useMemo(function () {
    return window.QGA_FIGURE.plots.higgs.couplingRunSpec({
      mu: run.t.map(Math.exp),
      lambda: run.states.map(function (s) {
        return s[0];
      }),
      lower: band.lower,
      upper: band.upper,
      instabilityGeV: instability,
      treeLambda: run.states[0][0],
      mtGeV: mt
    });
  }, [run, band, instability, mt]);
  var diagramSpec = useMemo(function () {
    return window.QGA_FIGURE.plots.higgs.stabilityDiagramSpec({
      boundaries: boundaries,
      measured: {
        mt: PDG.mt,
        mH: PDG.mH
      },
      probe: moved ? {
        mt: mt,
        mH: mH
      } : null,
      mtDomain: HG_DIAGRAM_MT,
      mHDomain: HG_MH_RANGE
    });
  }, [boundaries, moved, mt, mH]);
  var build = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ctx) {
      var _yield$window$QGA_SM_, buildMexicanHat;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            _context.n = 1;
            return window.QGA_SM_VIZ.loadMexicanHat();
          case 1:
            _yield$window$QGA_SM_ = _context.v;
            buildMexicanHat = _yield$window$QGA_SM_.buildMexicanHat;
            return _context.a(2, buildMexicanHat(ctx, {
              control: control,
              vGeV: v
            }));
        }
      }, _callee);
    }));
    return function build(_x) {
      return _ref2.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame hg-lab"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar hg-bar",
    role: "group",
    "aria-label": "Higgs lab controls"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn hg-btn" + (symmetric ? " on" : ""),
    "aria-pressed": symmetric,
    onClick: function onClick() {
      return setSymmetric(!symmetric);
    }
  }, "Symmetric phase"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn hg-btn",
    disabled: !moved,
    onClick: function onClick() {
      setMt(PDG.mt.value);
      setMH(PDG.mH.value);
    }
  }, "measured masses")), /*#__PURE__*/React.createElement(Scene3D, {
    animated: false,
    nodeKit: true,
    height: 440,
    invalidateKey: symmetric,
    aria: "Three-dimensional Mexican hat: the Higgs potential over the complex plane of the field, a ring of minima at the vacuum value, a red arrow along the radial direction and a cyan arrow along the flat Goldstone direction.",
    initial: {
      radius: 15.5,
      theta: -1.45,
      phi: 0.95,
      minR: 6,
      maxR: 34,
      target: [0, 0.8, 0]
    },
    build: build,
    deps: [],
    fallback: /*#__PURE__*/React.createElement("div", {
      className: "lab-fallback"
    }, "The 3-D Higgs potential needs WebGL; the plots and readouts below are computed without it.")
  }), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "sm-higgs-hat",
    status: "established"
  }, "The surface is the formula: its height is ", /*#__PURE__*/React.createElement(Eq, {
    tex: "V/\\lambda v^4 = x^4/4 - s\\,x^2/2"
  }), " with ", /*#__PURE__*/React.createElement(Eq, {
    tex: "x=|\\phi|/v"
  }), ", compiled to the GPU from the same expression as the typeset card below. Convention: ", /*#__PURE__*/React.createElement(Eq, {
    tex: "V=-\\mu^2|H|^2+\\lambda|H|^4"
  }), ", so the Higgs phase is ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\mu^2>0"
  }), " and ", /*#__PURE__*/React.createElement(Eq, {
    tex: "s=\\mu^2/\\lambda v^2=1"
  }), ". The gold ring is the vacuum circle ", /*#__PURE__*/React.createElement(Eq, {
    tex: "|\\phi|=v"
  }), "; along the red arrow the surface curves with ", /*#__PURE__*/React.createElement(Eq, {
    tex: "m_H^2=2\\lambda v^2"
  }), ", along the cyan arrow it is flat (the Goldstone modes that become the longitudinal W and Z). The symmetric phase flips the sign of ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\mu^2"
  }), " as a what-if; the physical point stays pinned at ", /*#__PURE__*/React.createElement(Eq, {
    tex: "|\\phi|=v"
  }), ". The vertical scale is one display factor."), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar hg-bar hg-controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hg-sliders"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "top quark mass",
    min: HG_MT_RANGE[0],
    max: HG_MT_RANGE[1],
    step: 0.05,
    value: mt,
    onChange: setMt,
    format: function format(x) {
      return x.toFixed(2) + " GeV";
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "Higgs boson mass",
    min: HG_MH_RANGE[0],
    max: HG_MH_RANGE[1],
    step: 0.01,
    value: mH,
    onChange: setMH,
    format: function format(x) {
      return x.toFixed(2) + " GeV";
    }
  }))), /*#__PURE__*/React.createElement(Figure, {
    spec: runningSpec
  }, "Two-loop running of ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\lambda"
  }), " from ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\mu=m_t"
  }), " to the Planck mass for ", moved ? "the chosen" : "the measured", " masses. The cyan dot is the tree-level ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\lambda=m_H^2/2v^2"
  }), " from the Higgs mass, the band the ", /*#__PURE__*/React.createElement(Eq, {
    tex: "1\\sigma"
  }), " ranges of ", /*#__PURE__*/React.createElement(Eq, {
    tex: "m_t"
  }), " and", " ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\alpha_s"
  }), ", and the rule the scale where ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\lambda"
  }), " crosses zero."), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "sm-higgs-running",
    status: "effective"
  }, "Inputs: ", H.PDG_SOURCE.edition, ", retrieved ", H.PDG_SOURCE.retrieved, ", and the two-loop equations of Buttazzo et al. (2013). This is the Standard Model alone, extrapolated 17 decades with no new physics, from a leading-order matching at ", /*#__PURE__*/React.createElement(Eq, {
    tex: "m_t"
  }), "; the full threshold corrections of the literature move the zero of ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\lambda"
  }), " up to about ", /*#__PURE__*/React.createElement(Eq, {
    tex: "10^{10}\\,\\mathrm{GeV}"
  }), " (see the provenance drawer). The top mass is the direct-measurement average, ambiguous by about 0.2 GeV."), /*#__PURE__*/React.createElement(Figure, {
    spec: diagramSpec
  }, "The (", /*#__PURE__*/React.createElement(Eq, {
    tex: "m_t"
  }), ", ", /*#__PURE__*/React.createElement(Eq, {
    tex: "m_H"
  }), ") plane divided by this lab's own running into absolutely stable, metastable and unstable. The black ellipse is the measured point with its ", /*#__PURE__*/React.createElement(Eq, {
    tex: "1\\sigma"
  }), " errors", moved ? "; the triangle is the masses set above" : "", "."), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "sm-higgs-stability",
    status: "effective"
  }, "Metastable means the electroweak vacuum is not the lowest state but the chance that a bubble of true vacuum formed in our past light cone is below one (Buttazzo et al., eq. 83). The lines move with the matching: they show the structure of the plane, not the published boundary position."), /*#__PURE__*/React.createElement("div", {
    className: "hg-readouts"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "vacuum value ", /*#__PURE__*/React.createElement(Eq, {
    tex: "v"
  })), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, v.toFixed(2), " GeV")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "tree quartic at ", /*#__PURE__*/React.createElement(Eq, {
    tex: "m_t"
  })), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, run.states[0][0].toFixed(5))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "quartic crosses zero"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, instability ? /*#__PURE__*/React.createElement(Eq, {
    tex: sciTex(instability, 2) + "\\,\\mathrm{GeV}"
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, "never below ", /*#__PURE__*/React.createElement(Eq, {
    tex: "M_{\\mathrm{Pl}}"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "smallest quartic"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, decay.lambdaMin.toFixed(4), " at ", /*#__PURE__*/React.createElement(Eq, {
    tex: sciTex(decay.scaleGeV, 1) + "\\,\\mathrm{GeV}"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "vacuum"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, HG_REGION_TEXT[region], Number.isFinite(decay.log10Probability) ? /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\log_{10}p = " + decay.log10Probability.toFixed(0)
  })) : null))), /*#__PURE__*/React.createElement("div", {
    className: "hg-cards"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Higgs potential",
    formulaId: "higgs-potential",
    status: "established",
    symbols: [{
      s: "x",
      d: "Radial Higgs field $h$ in units of the vacuum value $v = (\\sqrt{2}\\,G_F)^{-1/2}$, $x = h/v$."
    }, {
      s: "s",
      d: "$\\mu^2$ in units of $\\lambda v^2$: $1$ in the Higgs phase, zero or less in the symmetric phase."
    }],
    meaning: "In units of $\\lambda v^4$ the whole potential has no free number: a quartic wall and a quadratic term whose sign decides whether the origin or a ring of minima at $|\\phi| = v$ is the vacuum.",
    limits: "Tree level. Radiative corrections change the shape; the running of $\\lambda$ is in the figure."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Tree-level quartic coupling",
    formulaId: "higgs-quartic-tree",
    status: "established",
    symbols: [{
      s: "m_H",
      d: "Higgs boson pole mass."
    }, {
      s: "v",
      d: "Vacuum expectation value from the Fermi constant."
    }],
    meaning: "The radial curvature of the potential at its minimum is $m_H^2 = 2\\lambda v^2$, which fixes $\\lambda$ once the Higgs mass and $v$ are measured: about $0.129$ at the top-quark mass.",
    limits: "Before radiative matching: the $\\overline{\\mathrm{MS}}$ value of $\\lambda$ at $m_t$ is 2 to 3 percent lower once the loop corrections are included."
  })), /*#__PURE__*/React.createElement(ConceptBridge, {
    id: "higgs-rg",
    go: go
  }), /*#__PURE__*/React.createElement(ConceptBridge, {
    id: "higgs-planck",
    go: go
  }));
}