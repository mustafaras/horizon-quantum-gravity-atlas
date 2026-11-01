/* Compiled from js/labs/casimir-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// casimir-lab.jsx — the Casimir cavity (S15): two plates, the standing modes between them, and the pressure that results.
// The calculation is js/science/casimir.mjs (window.QGA_CASIMIR), the scene js/visualizations/qft/casimir-cavity.mjs and the pressure
// plot a Figure Kit figure (js/figure/plots/casimir.mjs); this file holds the controls and the readouts.

var CV_LOG_RANGE = [-8, -5]; // log10 of the gap in metres: 10 nm to 10 um
var CV_BAND_SAMPLES = 25;
var CV_CURVE_SAMPLES = 61;
var CV_SUM_RATIOS = [10, 20, 40]; // the cutoffs of the mode sum, in units of the fundamental frequency
var CV_PRESETS = [{
  tex: "100\\,\\mathrm{nm}",
  log: -7
}, {
  tex: "1\\,\\mu\\mathrm{m}",
  log: -6
}];
var cvLogSpace = function cvLogSpace(lo, hi, n) {
  return Array.from({
    length: n
  }, function (_, i) {
    return lo * Math.pow(hi / lo, i / (n - 1));
  });
};
function CasimirLab() {
  var K = window.QGA_CASIMIR;
  var science = K.science,
    data = K.data,
    view = K.view;
  var _useState = useState(-6),
    _useState2 = _slicedToArray(_useState, 2),
    logGap = _useState2[0],
    setLogGap = _useState2[1];
  var gap = view.gapFromLog(logGap);
  var control = useRef({
    gap: gap
  }).current;
  control.gap = gap;
  var narrow = window.matchMedia("(max-width: 640px)").matches; // a narrow stage needs the camera further back to show both plates

  var pressure = science.idealPressure(gap);
  var energy = science.idealEnergyPerArea(gap);
  var curve = useMemo(function () {
    return science.pressureCurve({
      min: view.gapRange[0],
      max: view.gapRange[1],
      count: CV_CURVE_SAMPLES
    });
  }, []);
  var bands = useMemo(function () {
    return {
      bressi: science.dataBand("bressi2002", cvLogSpace.apply(void 0, _toConsumableArray(data.bressi2002.range).concat([CV_BAND_SAMPLES]))),
      lamoreaux: science.dataBand("lamoreaux1997", cvLogSpace.apply(void 0, _toConsumableArray(data.lamoreaux1997.range).concat([CV_BAND_SAMPLES])))
    };
  }, []);
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.casimir.pressureSpec({
      curve: curve,
      bressi: bands.bressi,
      lamoreaux: bands.lamoreaux,
      probe: {
        gap: gap,
        pressure: -pressure
      }
    });
  }, [curve, bands, gap]);
  var agreement = useMemo(function () {
    return window.QGA_FIGURE.plots.casimir.agreementSpec({
      bressi: science.ratioBand(bands.bressi),
      lamoreaux: science.ratioBand(bands.lamoreaux)
    });
  }, [bands]);
  var sums = useMemo(function () {
    return CV_SUM_RATIOS.map(function (ratio) {
      var r = science.modeSumDifference({
        gap: gap,
        cutoff: science.cutoffForRatio(gap, ratio)
      });
      return {
        ratio: ratio,
        deviation: r.difference / r.limit - 1,
        limit: r.limit
      };
    });
  }, [gap]);
  var build = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ctx) {
      var _yield$K$loadScene, buildCasimirCavity;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            _context.n = 1;
            return K.loadScene();
          case 1:
            _yield$K$loadScene = _context.v;
            buildCasimirCavity = _yield$K$loadScene.buildCasimirCavity;
            return _context.a(2, buildCasimirCavity(ctx, {
              control: control
            }));
        }
      }, _callee);
    }));
    return function build(_x) {
      return _ref.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame cv-lab",
    id: "shot-section-casimir"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar cv-bar",
    role: "group",
    "aria-label": "Casimir cavity controls"
  }, CV_PRESETS.map(function (preset) {
    return /*#__PURE__*/React.createElement("button", {
      key: preset.tex,
      type: "button",
      className: "btn cv-btn" + (logGap === preset.log ? " on" : ""),
      "aria-pressed": logGap === preset.log,
      onClick: function onClick() {
        return setLogGap(preset.log);
      }
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: preset.tex
    }));
  })), /*#__PURE__*/React.createElement(Scene3D, {
    animated: false,
    nodeKit: true,
    height: 440,
    shotSpace: "qft-casimir",
    invalidateKey: logGap,
    aria: "Two parallel plates with the gap between them on a logarithmic scale; the first eight standing modes of a field between the plates drawn as sinusoids that vanish at the plates, and a denser, fainter continuum of lines outside them; the pressure between the plates is printed below.",
    initial: {
      radius: narrow ? 25 : 13.5,
      theta: 0.32,
      phi: 1.28,
      minR: 8,
      maxR: 40,
      target: [0, 0, 0]
    },
    build: build,
    deps: [],
    fallback: /*#__PURE__*/React.createElement("div", {
      className: "lab-fallback"
    }, "The 3-D cavity needs WebGL; the readouts and the plot below are computed without it.")
  }), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar cv-bar cv-controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cv-sliders"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "plate separation",
    min: CV_LOG_RANGE[0],
    max: CV_LOG_RANGE[1],
    step: 0.01,
    value: logGap,
    onChange: setLogGap,
    format: function format(l) {
      return /*#__PURE__*/React.createElement(Eq, {
        tex: view.gapTex(view.gapFromLog(l))
      });
    }
  }))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "qft-casimir-cavity",
    status: "schematic"
  }, "Between two plates a field can only oscillate in modes that vanish at both: in one dimension, ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\omega_n=n\\pi c/a"
  }), " with ", /*#__PURE__*/React.createElement(Eq, {
    tex: "n=1,2,\\dots"
  }), ", drawn as the engraved sinusoids with amplitude proportional to ", /*#__PURE__*/React.createElement(Eq, {
    tex: "1/\\sqrt{\\omega_n}"
  }), ". Outside, the same lines at three times the density and 30 percent ink stand for a continuum. Fewer frequencies fit between the plates than outside, and the zero-point energy that is missing is the pressure ", /*#__PURE__*/React.createElement(Eq, {
    tex: "P=-\\pi^2\\hbar c/240a^4"
  }), " read out under the plates, for ideal plates at zero temperature. The picture is schematic: the drawn gap is a log map of ", /*#__PURE__*/React.createElement(Eq, {
    tex: "a"
  }), ", one dimension and one polarisation stand in for the electromagnetic field, and the amplitudes are in units of the first mode's. The vacuum-energy reading is one way to this number, not the only one: Jaffe (2005, arXiv:hep-th/0503158) shows that Casimir forces can be computed without reference to zero-point energies, as relativistic quantum forces between charges and currents."), /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }, "The attractive pressure ", /*#__PURE__*/React.createElement(Eq, {
    tex: "|P|"
  }), " on log-log axes: the amber line is the ideal-plate result ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\pi^2\\hbar c/240a^4"
  }), ", a straight line of slope ", /*#__PURE__*/React.createElement(Eq, {
    tex: "-4"
  }), ", and the black dot is the gap above. The two bands are what experiments reported, not points: Lamoreaux (1997) found agreement at the level of 5 percent between 0.6 and 6 ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\mu\\mathrm{m}"
  }), " with a sphere and a plate, and Bressi et al. (2002) fixed the coefficient to 15 percent between 0.5 and 3 ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\mu\\mathrm{m}"
  }), " with parallel plates. On fourteen decades of pressure they are a pixel or two thick, so the next figure shows the same bands as a ratio to the line."), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "qft-casimir-pressure",
    status: "established"
  }, "Ideal plates: perfect conductors, zero temperature. Real metals and finite temperature change the force at the smallest and the largest gaps, and the plot does not model them. No measured point is drawn: the publisher licenses a figure for reuse case by case, and no permission was requested."), /*#__PURE__*/React.createElement(Figure, {
    spec: agreement
  }, "The measured pressure over the ideal-plate pressure, ", /*#__PURE__*/React.createElement(Eq, {
    tex: "P/P_{\\mathrm{ideal}}"
  }), ", for the two reported bands. The amber line is the ideal result, one by definition."), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "qft-casimir-agreement",
    status: "established"
  }, "The Lamoreaux band is the 5 percent agreement of his abstract drawn about one, although he compared with theory that included corrections he estimated at no more than 3 percent. The Bressi et al. band is their fitted coefficient, ", /*#__PURE__*/React.createElement(Eq, {
    tex: "K=(1.22\\pm0.18)\\times10^{-27}\\,\\mathrm{N\\,m^2}"
  }), ", over the ideal ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\pi^2\\hbar c/240"
  }), ": one constant, so flat in the ratio, and they report that their fit does not follow the points systematically between 1 and 2 ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\mu\\mathrm{m}"
  }), "."), /*#__PURE__*/React.createElement("div", {
    className: "cv-readouts",
    role: "group",
    "aria-label": "Casimir readouts"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "gap ", /*#__PURE__*/React.createElement(Eq, {
    tex: "a"
  })), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: view.gapTex(gap)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "pressure ", /*#__PURE__*/React.createElement(Eq, {
    tex: "P"
  })), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: view.pressureTex(pressure)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "energy per area ", /*#__PURE__*/React.createElement(Eq, {
    tex: "E/A"
  })), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "E/A=" + sciTex(energy, 2) + "\\,\\mathrm{J/m^2}"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "cv-sums"
  }, /*#__PURE__*/React.createElement("p", {
    className: "cv-note"
  }, "The mode sum in one dimension, with the exponential regulator ", /*#__PURE__*/React.createElement(Eq, {
    tex: "e^{-\\omega/\\Lambda}"
  }), ": the regularised difference between the modes between the plates and the continuum of the same length outside, ", /*#__PURE__*/React.createElement(Eq, {
    tex: "E_{\\mathrm{in}}-E_{\\mathrm{out}}"
  }), ", against its limit ", /*#__PURE__*/React.createElement(Eq, {
    tex: "-\\pi\\hbar c/24a"
  }), " ", "(", /*#__PURE__*/React.createElement(Eq, {
    tex: "=" + sciTex(sums[0].limit, 2) + "\\,\\mathrm{J}"
  }), " at this gap)."), /*#__PURE__*/React.createElement("div", {
    className: "cv-readouts",
    role: "group",
    "aria-label": "Mode sum convergence"
  }, sums.map(function (s) {
    return /*#__PURE__*/React.createElement("div", {
      className: "readout",
      key: s.ratio
    }, /*#__PURE__*/React.createElement("div", {
      className: "readout-label"
    }, "cutoff ", /*#__PURE__*/React.createElement(Eq, {
      tex: "\\Lambda=" + s.ratio + "\\,\\pi c/a"
    })), /*#__PURE__*/React.createElement("div", {
      className: "readout-value"
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: "\\text{ratio to limit}=1" + (s.deviation < 0 ? "-" : "+") + sciTex(Math.abs(s.deviation), 2)
    })));
  }))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "qft-casimir-mode-sum",
    status: "established"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "E_{\\mathrm{in}}=\\sum_n\\tfrac12\\hbar\\omega_n e^{-\\omega_n/\\Lambda}"
  }), " and ", /*#__PURE__*/React.createElement(Eq, {
    tex: "E_{\\mathrm{out}}=\\hbar a\\Lambda^2/2\\pi c"
  }), ": outside, the modes are so dense that their sum is the integral over the density of states ", /*#__PURE__*/React.createElement(Eq, {
    tex: "a/\\pi c"
  }), ". Both diverge as ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\Lambda^2 a"
  }), ", the difference does not, and it falls to its limit as ", /*#__PURE__*/React.createElement(Eq, {
    tex: "1/\\Lambda^2"
  }), ": each doubling of the cutoff cuts the remainder by four. This is a scalar field in one dimension; its limit is not the three-dimensional pressure above."), /*#__PURE__*/React.createElement("div", {
    className: "cv-cards"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Casimir pressure between ideal plates",
    formulaId: "casimir-plates-pressure",
    status: "established",
    symbols: [{
      s: "a",
      d: "Separation of the plates. Click it to outline the gap between the plates."
    }, {
      s: "\\hbar",
      d: "Reduced Planck constant. Click it to mark the pressure readout it scales."
    }, {
      s: "c",
      d: "Speed of light. Click it to mark the pressure readout it scales."
    }],
    meaning: "Between perfectly conducting plates only some modes of the electromagnetic field fit; the energy that is missing per area, $-\\pi^2\\hbar c/720a^3$, falls as the plates approach, and its derivative is an attractive pressure that grows as the fourth power of the inverse gap: about $1.3\\times10^{-3}\\ \\mathrm{Pa}$ at $1\\ \\mu\\mathrm{m}$ and $13\\ \\mathrm{Pa}$ at $100\\ \\mathrm{nm}$.",
    limits: "Ideal plates at zero temperature. Real metals are not perfect conductors, the plates are rough and warm, and the sphere-plate geometry of most experiments is reached through the proximity force approximation."
  })));
}