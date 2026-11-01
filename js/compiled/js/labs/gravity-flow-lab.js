/* Compiled from js/labs/gravity-flow-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// gravity-flow-lab.jsx — asymptotic safety: the Einstein–Hilbert flow of (g, λ) as a GPU line-integral-convolution silk (S18).
// The calculation is js/science/asymptotic-safety.mjs (window.QGA_GRAVITY), the picture is the TSL scene js/visualizations/rg/lic-field.mjs, the plot
// under it is a Figure Kit figure (js/figure/plots/asymptotic-safety.mjs); this file holds the controls, the readouts and the formula cards.

var GF_HEIGHT = 520;
var GF_FOV = 12; // a small field of view from far away: close to a flat map, with the orbit rig still free to tilt it
var GF_FIT = 1.05;
var GF_RANGES = {
  g: [0.02, 1.2],
  lambda: [-0.4, 0.49]
};
var GF_TYPES = {
  Ia: "Type Ia: the cosmological constant runs negative in the infrared",
  IIa: "Type IIa: the separatrix, into the Gaussian fixed point",
  IIIa: "Type IIIa: the cosmological constant stays positive and the truncation breaks down",
  outside: "outside the truncation",
  other: "no clear infrared fate within the step budget"
};
var GF_STOPS = {
  "singular-line": "the singular line at one half",
  "eta-pole": "the boundary where the anomalous dimension diverges",
  "canonical-scaling": "canonical scaling",
  "gaussian-fixed-point": "the Gaussian fixed point",
  "non-finite": "a non-finite value",
  "step-limit": "the step budget"
};
var gfSep = function gfSep(G, share) {
  var p = G.separatrix().points;
  return p[Math.floor(p.length * share)];
};
function GfRange(_ref) {
  var labelTex = _ref.labelTex,
    label = _ref.label,
    min = _ref.min,
    max = _ref.max,
    step = _ref.step,
    value = _ref.value,
    _onChange = _ref.onChange,
    format = _ref.format;
  return /*#__PURE__*/React.createElement("div", {
    className: "ctl-row ug-range"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ctl-label"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: labelTex
  })), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: min,
    max: max,
    step: step,
    value: value,
    "aria-label": label,
    onChange: function onChange(e) {
      return _onChange(parseFloat(e.target.value));
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "ctl-value"
  }, format(value)));
}
var gfTheta = function gfTheta(e) {
  return "".concat(e.re.toFixed(3), " \\pm ").concat(Math.abs(e.im).toFixed(3), "\\,i");
};
function GravityFlowLab() {
  var _GF_STOPS$run$termina;
  var G = window.QGA_GRAVITY;
  var _useState = useState({
      g: 0.5,
      lambda: 0.1
    }),
    _useState2 = _slicedToArray(_useState, 2),
    start = _useState2[0],
    setStart = _useState2[1];
  var _useState3 = useState("IIIa"),
    _useState4 = _slicedToArray(_useState3, 2),
    preset = _useState4[0],
    setPreset = _useState4[1];
  var wrap = useRef(null);
  var _useState5 = useState(0),
    _useState6 = _slicedToArray(_useState5, 2),
    width = _useState6[0],
    setWidth = _useState6[1];
  var silk = useRef(null);
  var latest = useRef(null);
  useEffect(function () {
    var el = wrap.current;
    if (!el) return undefined;
    var ro = new ResizeObserver(function (entries) {
      return setWidth(Math.floor(entries[0].contentRect.width));
    });
    ro.observe(el);
    setWidth(Math.floor(el.getBoundingClientRect().width));
    return function () {
      return ro.disconnect();
    };
  }, []);
  var run = useMemo(function () {
    return window.QGA_FIGURE.plots.gravity.trajectoryRun({
      g0: start.g,
      lambda0: start.lambda
    });
  }, [start]);
  var points = useMemo(function () {
    return G.fixedPoints();
  }, []);
  var litim = useMemo(function () {
    return G.fixedPoints({
      scheme: "litim2004"
    }).find(function (p) {
      return !p.gaussian;
    });
  }, []);
  var ngfp = points.find(function (p) {
    return !p.gaussian;
  });
  var spec = useMemo(function () {
    return run.type === "outside" ? null : window.QGA_FIGURE.plots.gravity.trajectorySpec({
      run: run
    });
  }, [run]);
  latest.current = {
    points: run.type === "outside" ? [] : run.points,
    start: run.type === "outside" ? null : start
  };
  useEffect(function () {
    var _silk$current;
    (_silk$current = silk.current) === null || _silk$current === void 0 || _silk$current.setTrajectory(latest.current);
  }, [run, start]);
  var presets = useMemo(function () {
    var sep = gfSep(G, 0.8);
    return {
      Ia: {
        g: 0.4,
        lambda: -0.1
      },
      IIa: {
        g: sep.g,
        lambda: sep.lambda
      },
      IIIa: {
        g: 0.5,
        lambda: 0.1
      }
    };
  }, []);
  var choose = function choose(id) {
    setPreset(id);
    setStart(presets[id]);
  };
  var move = function move(key, value) {
    setPreset("custom");
    setStart(_objectSpread(_objectSpread({}, start), {}, _defineProperty({}, key, value)));
  };
  var fov = GF_FOV * Math.PI / 180;
  var aspect = Math.max(0.4, (width || 900) / GF_HEIGHT);
  var radius = Math.round(GF_FIT * Math.max(G.silk.SILK.depth / 2, G.silk.SILK.width / 2 / aspect) / Math.tan(fov / 2));
  var build = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ctx) {
      var _yield$G$loadSilk, buildGravityFlowSilk, handle;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            _context.n = 1;
            return G.loadSilk();
          case 1:
            _yield$G$loadSilk = _context.v;
            buildGravityFlowSilk = _yield$G$loadSilk.buildGravityFlowSilk;
            _context.n = 2;
            return buildGravityFlowSilk(ctx);
          case 2:
            handle = _context.v;
            silk.current = handle;
            handle.setTrajectory(latest.current);
            return _context.a(2, handle);
        }
      }, _callee);
    }));
    return function build(_x) {
      return _ref2.apply(this, arguments);
    };
  }();
  var ended = run.type === "outside" ? null : (_GF_STOPS$run$termina = GF_STOPS[run.terminated]) !== null && _GF_STOPS$run$termina !== void 0 ? _GF_STOPS$run$termina : run.terminated;
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame gf-lab"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar ug-bar",
    role: "group",
    "aria-label": "Trajectory presets"
  }, ["Ia", "IIa", "IIIa"].map(function (id) {
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      type: "button",
      className: "btn ug-btn" + (preset === id ? " on" : ""),
      "aria-pressed": preset === id,
      onClick: function onClick() {
        return choose(id);
      }
    }, id === "IIa" ? "separatrix (Type IIa)" : "Type ".concat(id));
  })), /*#__PURE__*/React.createElement("div", {
    ref: wrap
  }, /*#__PURE__*/React.createElement(Scene3D, {
    animated: "motion",
    nodeKit: true,
    height: GF_HEIGHT,
    deps: [radius],
    aria: "Flow of the Newton coupling g and the cosmological constant lambda in the Einstein\u2013Hilbert truncation as a line-integral-convolution picture: streaks follow the flow, colour is the sign of the beta function of g. Rings mark the Gaussian and the non-Gaussian fixed point, a line the separatrix between them, and the white line is the chosen trajectory.",
    initial: {
      radius: radius,
      theta: 0,
      phi: 0.09,
      fov: GF_FOV,
      minR: radius * 0.6,
      maxR: radius * 1.6,
      target: [0, 0, 0]
    },
    build: build,
    fallback: /*#__PURE__*/React.createElement("div", {
      className: "lab-fallback"
    }, "The flow picture needs WebGL; the readouts and the plot below are computed without it.")
  })), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "rg-gravity-flow-silk",
    status: "conjectural"
  }, "The Einstein\u2013Hilbert truncation of asymptotic safety: the flow of the dimensionless Newton coupling ", /*#__PURE__*/React.createElement(Eq, {
    tex: "g"
  }), " (right) and cosmological constant", " ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\lambda"
  }), " (up) with the optimised cutoff. Streaks follow the flow, drawn as a line integral convolution of its direction, and colour is the sign of", " ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\beta_g"
  }), "; neither shows which way along a streak the scale runs. Rings mark the Gaussian and the non-Gaussian fixed point, the brighter line is the separatrix, the dashed curve is where ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\eta_N"
  }), " diverges and the hatched band beyond ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\lambda=\\tfrac12"
  }), " is where the truncation is not defined. It is a truncation of an infinite tower and its numbers depend on the cutoff and gauge (see the table): a conjectural framework, not a result about nature."), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar ug-bar ug-controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ug-sliders"
  }, /*#__PURE__*/React.createElement(GfRange, {
    labelTex: "g_0",
    label: "start value of the Newton coupling g",
    min: GF_RANGES.g[0],
    max: GF_RANGES.g[1],
    step: 0.005,
    value: start.g,
    onChange: function onChange(v) {
      return move("g", v);
    },
    format: function format(x) {
      return x.toFixed(3);
    }
  }), /*#__PURE__*/React.createElement(GfRange, {
    labelTex: "\\lambda_0",
    label: "start value of the cosmological constant lambda",
    min: GF_RANGES.lambda[0],
    max: GF_RANGES.lambda[1],
    step: 0.005,
    value: start.lambda,
    onChange: function onChange(v) {
      return move("lambda", v);
    },
    format: function format(x) {
      return x.toFixed(3);
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "ug-readouts",
    role: "status",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "infrared fate"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, GF_TYPES[run.type], ended ? /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "\u2014 ends at ", ended) : null)), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "k_{\\mathrm{term}}/k_0"
  })), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, run.tTerm !== null && run.tTerm !== undefined ? /*#__PURE__*/React.createElement(Eq, {
    tex: "e^{".concat(run.tTerm.toFixed(2), "}=").concat(Math.exp(run.tTerm).toFixed(3))
  }) : "none")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "(g_*,\\lambda_*)"
  })), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "(".concat(ngfp.g.toFixed(4), ",\\ ").concat(ngfp.lambda.toFixed(4), ")")
  }))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "\\theta"
  }), " at the NGFP"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: gfTheta(ngfp.exponents[0])
  })))), spec ? /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }, /*#__PURE__*/React.createElement("span", {
    className: "ug-fig-note"
  }, "Toward the ultraviolet (right) both couplings settle at the fixed point; the start is at t = 0.")) : /*#__PURE__*/React.createElement("p", {
    className: "lt-note"
  }, "The start lies outside the truncation (the cosmological constant at or above one half, or g not positive); move it back inside."), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "rg-gravity-flow-trajectory",
    status: "conjectural"
  }, "The couplings along the chosen trajectory against ", /*#__PURE__*/React.createElement(Eq, {
    tex: "t=\\ln(k/k_0)"
  }), ". In the ultraviolet every trajectory with ", /*#__PURE__*/React.createElement(Eq, {
    tex: "g>0"
  }), " runs into the non-Gaussian fixed point, which is what asymptotic safety needs; in the infrared it is of Type Ia, IIa or IIIa. A Type IIIa run stops where the truncation breaks down, at ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\lambda=\\tfrac12"
  }), " or where ", /*#__PURE__*/React.createElement(Eq, {
    tex: "1-gB_2=0"
  }), ", and the figure stops there."), /*#__PURE__*/React.createElement("div", {
    className: "gf-schemes",
    role: "region",
    "aria-label": "Fixed point and critical exponents in two schemes"
  }, /*#__PURE__*/React.createElement("table", {
    className: "fig-table"
  }, /*#__PURE__*/React.createElement("caption", null, "Scheme dependence of the non-Gaussian fixed point (d = 4)"), /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    scope: "col"
  }, "scheme"), /*#__PURE__*/React.createElement("th", {
    scope: "col"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "\\lambda_*"
  })), /*#__PURE__*/React.createElement("th", {
    scope: "col"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "\\theta"
  })))), /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    scope: "row"
  }, "optimised cutoff, Reuter & Saueressig 2012"), /*#__PURE__*/React.createElement("td", null, ngfp.lambda.toFixed(4)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Eq, {
    tex: gfTheta(ngfp.exponents[0])
  }))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    scope: "row"
  }, "harmonic gauge, Litim 2004"), /*#__PURE__*/React.createElement("td", null, litim.lambda.toFixed(4)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Eq, {
    tex: gfTheta(litim.exponents[0])
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "ug-cards"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Beta function of the Newton coupling",
    formulaId: "as-beta-g",
    status: "conjectural",
    symbols: [{
      s: "g",
      d: "Dimensionless Newton coupling, $g = k^2 G_k$."
    }, {
      s: "\\eta_N",
      d: "Anomalous dimension of Newton's constant: $\\beta_g=(2+\\eta_N)\\,g$. At a non-Gaussian fixed point $\\eta_N=-2$."
    }],
    meaning: "The two terms of the flow equation for $g$ are the classical scaling of a dimensionful coupling and the quantum correction from graviton loops; a non-Gaussian fixed point is where they cancel.",
    limits: "Einstein\u2013Hilbert truncation, d = 4, optimised cutoff. The numbers change with the cutoff and the gauge; the structure of the flow does not."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Beta function of the cosmological constant",
    formulaId: "as-beta-lambda",
    status: "conjectural",
    symbols: [{
      s: "\\lambda",
      d: "Dimensionless cosmological constant, $\\lambda=\\bar\\lambda_k/k^2$."
    }, {
      s: "\\eta_N",
      d: "The same anomalous dimension, entering through the term $\\propto\\eta_N$."
    }],
    meaning: "The canonical term $-2\\lambda$ pulls the dimensionless cosmological constant toward zero in the infrared; the loop terms are the quantum correction.",
    limits: "Singular at $\\lambda=\\tfrac12$ for the optimised cutoff; trajectories that reach it stop there."
  })));
}
window.GravityFlowLab = GravityFlowLab;