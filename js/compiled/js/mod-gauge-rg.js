/* Compiled from js/mod-gauge-rg.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
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
// mod-gauge-rg.jsx — Module 03: Symmetry, Gauge Theory, and Renormalization
var RG_LN10 = Math.log(10);
var RG_G_LIMIT = Math.sqrt(4 * Math.PI);
var RG_PRESETS = {
  qed: {
    title: "QED · one loop",
    model: "qed",
    g0: 0.303,
    mu0: -3,
    lo: -3,
    hi: 24,
    nf: 1,
    a: 1,
    b: 1,
    gStar: 1,
    current: 12,
    badge: "effective",
    note: "Positive β: charge screening makes e grow toward the ultraviolet."
  },
  qcd: {
    title: "QCD · one loop",
    model: "qcd",
    g0: 1.218,
    mu0: 2,
    lo: -1,
    hi: 8,
    nf: 5,
    a: 1,
    b: 1,
    gStar: 1,
    current: 5,
    badge: "effective",
    note: "SU(3), five active flavours: asymptotic freedom in the ultraviolet."
  },
  gaussian: {
    title: "Gaussian fixed point",
    model: "gaussian",
    g0: 1.6,
    mu0: 0,
    lo: -2,
    hi: 4,
    nf: 0,
    a: 0.7,
    b: 1,
    gStar: 0,
    current: 3,
    badge: "schematic",
    note: "Canonical linear flow toward the free fixed point; pedagogical model."
  },
  "uv-toy": {
    title: "UV-attractive toy",
    model: "linear",
    g0: 2.35,
    mu0: 0,
    lo: -1.2,
    hi: 4,
    nf: 0,
    a: -0.8,
    b: 1,
    gStar: 1,
    current: 3,
    badge: "schematic",
    note: "Linear illustrative flow into an interacting ultraviolet fixed point."
  },
  "ir-toy": {
    title: "IR-attractive toy",
    model: "linear",
    g0: 0.3,
    mu0: 0,
    lo: -4,
    hi: 1.2,
    nf: 0,
    a: 0.8,
    b: 1,
    gStar: 1,
    current: -3,
    badge: "schematic",
    note: "Linear illustrative flow into an interacting infrared fixed point."
  },
  "asymptotic-safety": {
    title: "pedagogical toy (schematic)",
    model: "asymptotic-safety",
    g0: 0.3,
    mu0: 0,
    lo: -4,
    hi: 5,
    nf: 0,
    a: 0.9,
    b: 0.9,
    gStar: 1,
    current: 4,
    badge: "conjectural",
    note: "A pedagogical toy: a polynomial flow with an ultraviolet fixed point built in. The Einstein–Hilbert flow below is the computed one, and it is still a truncation — not evidence that quantum gravity is asymptotically safe."
  }
};
function rgPresetPatch(id) {
  var preset = RG_PRESETS[id] || RG_PRESETS.qcd;
  var resolved = id in RG_PRESETS ? id : "qcd";
  return {
    rgPreset: resolved,
    rgPresetOrigin: resolved,
    rgModel: preset.model,
    rgG0: preset.g0,
    rgMu0: preset.mu0,
    rgLogMin: preset.lo,
    rgLogMax: preset.hi,
    rgNf: preset.nf,
    rgA: preset.a,
    rgB: preset.b,
    rgGStar: preset.gStar,
    rgCurrent: preset.current
  };
}
function rgActivePresetId(state) {
  var origin = state === null || state === void 0 ? void 0 : state.rgPresetOrigin;
  if (origin && origin in RG_PRESETS) return origin;
  var literal = state === null || state === void 0 ? void 0 : state.rgPreset;
  if (literal && literal in RG_PRESETS) return literal;
  return "qcd";
}
function rgScientificStatus(state) {
  if (state.rgModel === "asymptotic-safety" || state.rgPresetOrigin === "asymptotic-safety") return "conjectural-illustrative-toy";
  if (["gaussian", "linear"].includes(state.rgModel)) return "pedagogical-toy";
  if (["qed", "qcd"].includes(state.rgModel)) return "one-loop-perturbative";
  return "custom";
}
function rgParameters(state) {
  return {
    nf: state.rgNf,
    a: state.rgA,
    b: state.rgB,
    gStar: state.rgGStar
  };
}
function rgSample(points, t) {
  if (!points.length || t < points[0].t - 1e-9 || t > points[points.length - 1].t + 1e-9) return null;
  var lo = 0,
    hi = points.length - 1;
  while (hi - lo > 1) {
    var middle = Math.floor((lo + hi) / 2);
    if (points[middle].t <= t) lo = middle;else hi = middle;
  }
  var left = points[lo],
    right = points[hi];
  if (!right || Math.abs(right.t - left.t) < 1e-12) return left;
  var fraction = (t - left.t) / (right.t - left.t);
  return {
    t: t,
    g: left.g + (right.g - left.g) * fraction,
    beta: left.beta + (right.beta - left.beta) * fraction
  };
}
function useEasedRGPoints(target, reducedMotion) {
  var _useState = useState(target),
    _useState2 = _slicedToArray(_useState, 2),
    shown = _useState2[0],
    setShown = _useState2[1];
  var _useState3 = useState(false),
    _useState4 = _slicedToArray(_useState3, 2),
    settling = _useState4[0],
    setSettling = _useState4[1];
  var shownRef = useRef(target);
  shownRef.current = shown;
  useEffect(function () {
    if (reducedMotion || !target.length) {
      setShown(target);
      setSettling(false);
      return undefined;
    }
    var from = shownRef.current;
    var start = performance.now();
    var frame = 0,
      alive = true;
    setSettling(true);
    var _tick = function tick(now) {
      if (!alive) return;
      var progress = Math.min(1, (now - start) / 520);
      var eased = 1 - Math.pow(1 - progress, 3);
      setShown(target.map(function (point) {
        var prior = rgSample(from, point.t);
        return _objectSpread(_objectSpread({}, point), {}, {
          g: (prior ? prior.g : point.g) + (point.g - (prior ? prior.g : point.g)) * eased
        });
      }));
      if (progress < 1) frame = requestAnimationFrame(_tick);else {
        setShown(target);
        setSettling(false);
      }
    };
    frame = requestAnimationFrame(_tick);
    return function () {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, [target, reducedMotion]);
  return {
    points: shown,
    settling: settling
  };
}
function rgModelEquation(state) {
  var p = rgParameters(state);
  if (state.rgModel === "qed") return "\\beta(e)=\\frac{".concat(p.nf, "\\,e^3}{12\\pi^2}");
  if (state.rgModel === "qcd") return "\\beta(g_s)=-\\frac{".concat(window.QGA_PHYSICS.qcdB0(p.nf).toFixed(3), "\\,g_s^3}{16\\pi^2}");
  if (state.rgModel === "gaussian") return "\\beta(g)=-".concat(p.a.toFixed(2), "g");
  if (state.rgModel === "linear") return "\\beta(g)=".concat(p.a.toFixed(2), "(g-").concat(p.gStar.toFixed(2), ")");
  return "\\beta(g)=".concat(p.a.toFixed(2), "g-").concat(p.b.toFixed(2), "g^3");
}
function RGScalePlot(_ref) {
  var state = _ref.state,
    points = _ref.points,
    fixedPoints = _ref.fixedPoints,
    currentPoint = _ref.currentPoint,
    hoverLog = _ref.hoverLog,
    setHoverLog = _ref.setHoverLog,
    setCurrent = _ref.setCurrent,
    settling = _ref.settling;
  var yMax = Math.min(4, Math.max.apply(Math, [1.25, RG_G_LIMIT * 1.04].concat(_toConsumableArray(points.map(function (point) {
    return point.g * 1.08;
  })), _toConsumableArray(fixedPoints.map(function (point) {
    return point.g * 1.12;
  })))));
  var markerLog = hoverLog == null ? state.rgCurrent : hoverLog;
  var marker = rgSample(points, (markerLog - state.rgMu0) * RG_LN10);
  var status = RG_PRESETS[rgActivePresetId(state)].badge;
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.rg.scaleTrajectorySpec({
      points: points,
      fixedPoints: fixedPoints,
      logMin: state.rgLogMin,
      logMax: state.rgLogMax,
      mu0: state.rgMu0,
      ln10: RG_LN10,
      gLimit: RG_G_LIMIT,
      yMax: yMax,
      markerLog: markerLog,
      markerG: marker ? marker.g : NaN,
      status: status
    });
  }, [points, fixedPoints, state.rgLogMin, state.rgLogMax, state.rgMu0, yMax, markerLog, status]); // eslint-disable-line
  var clamp = function clamp(v) {
    return Math.max(state.rgLogMin, Math.min(state.rgLogMax, v));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "rg-plot rg-scale-plot" + (settling ? " settling" : "")
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("span", null, "RG\xB7A / scale trajectory"), /*#__PURE__*/React.createElement("strong", null, "g(\u03BC) versus log", /*#__PURE__*/React.createElement("sub", null, "10"), " \u03BC")), /*#__PURE__*/React.createElement("p", {
    className: "rg-mobile-gesture-note"
  }, "Swipe the chart horizontally; use the current-scale control above to select \u03BC."), /*#__PURE__*/React.createElement(Figure, {
    spec: spec,
    slider: {
      min: state.rgLogMin,
      max: state.rgLogMax,
      now: state.rgCurrent,
      text: "log10 mu ".concat(state.rgCurrent.toFixed(2), ", or 10 to the ").concat(state.rgCurrent.toFixed(2), " GeV")
    },
    readout: "log\u2081\u2080 \u03BC = ".concat(markerLog.toFixed(3), " \xB7 ").concat(marker ? "g = ".concat(marker.g.toFixed(5)) : "outside valid domain"),
    onHover: setHoverLog,
    onSelect: function onSelect(x) {
      return setCurrent(clamp(x));
    },
    onNudge: function onNudge(dir, big) {
      return setCurrent(dir === Infinity ? state.rgLogMax : dir === -Infinity ? state.rgLogMin : clamp(state.rgCurrent + dir * (big ? 1 : 0.1)));
    }
  }));
}
function RGBetaPlot(_ref2) {
  var state = _ref2.state,
    fixedPoints = _ref2.fixedPoints,
    currentPoint = _ref2.currentPoint;
  var yMax = Math.max.apply(Math, [1.25, RG_G_LIMIT * 1.04].concat(_toConsumableArray(fixedPoints.map(function (point) {
    return point.g * 1.15;
  }))));
  var parameters = rgParameters(state);
  var samples = Array.from({
    length: 151
  }, function (_, index) {
    var g = yMax * index / 150;
    return {
      g: g,
      beta: window.QGA_PHYSICS.rgBeta(state.rgModel, g, parameters)
    };
  }).filter(function (point) {
    return Number.isFinite(point.beta);
  });
  var betaMax = Math.max.apply(Math, [0.05].concat(_toConsumableArray(samples.map(function (point) {
    return Math.abs(point.beta);
  })))) * 1.1;
  var status = RG_PRESETS[rgActivePresetId(state)].badge;
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.rg.betaFunctionSpec({
      samples: samples,
      fixedPoints: fixedPoints,
      yMax: yMax,
      betaMax: betaMax,
      status: status,
      currentPoint: currentPoint ? {
        g: currentPoint.g,
        beta: currentPoint.beta
      } : null
    });
  }, [state.rgModel, state.rgNf, state.rgA, state.rgB, state.rgGStar, fixedPoints, currentPoint, status]); // eslint-disable-line
  return /*#__PURE__*/React.createElement("div", {
    className: "rg-plot rg-beta-plot"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("span", null, "RG\xB7B / phase line"), /*#__PURE__*/React.createElement("strong", null, "\u03B2(g) and fixed points")), /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }));
}
function RGControl(_ref3) {
  var label = _ref3.label,
    value = _ref3.value,
    min = _ref3.min,
    max = _ref3.max,
    step = _ref3.step,
    _onChange = _ref3.onChange,
    format = _ref3.format;
  var display = format ? format(value) : Number(value).toFixed(2);
  return /*#__PURE__*/React.createElement("label", {
    className: "rg-control"
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("input", {
    type: "range",
    value: value,
    min: min,
    max: max,
    step: step,
    "aria-valuetext": "".concat(label, ": ").concat(display),
    onChange: function onChange(event) {
      return _onChange(Number(event.target.value));
    }
  }), /*#__PURE__*/React.createElement("output", null, display));
}
function RGLiveFormulation(_ref4) {
  var state = _ref4.state,
    currentPoint = _ref4.currentPoint,
    fixedPoints = _ref4.fixedPoints,
    numericFixed = _ref4.numericFixed,
    integration = _ref4.integration;
  var parameters = rgParameters(state);
  var primary = fixedPoints.find(function (point) {
    return point.g > 1e-8;
  }) || fixedPoints[0];
  var numeric = primary ? numericFixed.find(function (point) {
    return Math.abs(point.g - primary.g) < 1e-5;
  }) : null;
  var analytic = ["qed", "qcd"].includes(state.rgModel) ? window.QGA_PHYSICS.rgOneLoopRunning(state.rgModel, state.rgG0, (state.rgCurrent - state.rgMu0) * RG_LN10, {
    nf: state.rgNf
  }) : null;
  return /*#__PURE__*/React.createElement("section", {
    className: "rg-formulation",
    "aria-label": "Live substituted RG formulation"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "rg-panel-id"
  }, "RG\xB7D"), /*#__PURE__*/React.createElement("h4", null, "Live substituted formulation")), /*#__PURE__*/React.createElement("span", null, "exact relations \xB7 numerical trajectory \xB7 explicit scope")), /*#__PURE__*/React.createElement("div", {
    className: "rg-equation-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Definition \xB7 exact"), /*#__PURE__*/React.createElement(Eq, {
    tex: "\\frac{dg}{d\\ln\\mu}=\\beta(g)"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Coupling convention \xB7 exact"), /*#__PURE__*/React.createElement(Eq, {
    tex: "\\alpha=\\frac{g^2}{4\\pi}".concat(currentPoint ? "=".concat((Math.pow(currentPoint.g, 2) / (4 * Math.PI)).toFixed(6)) : "")
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Selected \u03B2 model"), /*#__PURE__*/React.createElement(Eq, {
    tex: rgModelEquation(state)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Current substitution \xB7 numerical"), /*#__PURE__*/React.createElement(Eq, {
    tex: currentPoint ? "\\beta(".concat(currentPoint.g.toFixed(5), ")=").concat(window.QGA_PHYSICS.rgBeta(state.rgModel, currentPoint.g, parameters).toExponential(3)) : "\\text{outside bounded trajectory}"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Fixed-point condition"), /*#__PURE__*/React.createElement(Eq, {
    tex: primary ? "\\beta(g_*)=0,\\quad g_*=".concat(primary.g.toFixed(6)) : "\\beta(g_*)=0\\quad\\text{(no root in display domain)}"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Linearization and convention"), /*#__PURE__*/React.createElement(Eq, {
    tex: primary ? "\\beta(g)\\approx ".concat(primary.derivative.toFixed(4), "(g-").concat(primary.g.toFixed(4), ")") : "\\beta(g)\\approx\\beta'(g_*)(g-g_*)"
  }))), /*#__PURE__*/React.createElement("p", {
    className: "rg-equation-note"
  }, "With ", /*#__PURE__*/React.createElement(Eq, {
    tex: "t = \\ln\\mu"
  }), " increasing toward the UV, ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\beta'(g_*) < 0"
  }), " is UV-attractive and ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\beta'(g_*) > 0"
  }), " is IR-attractive. ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\beta' = 0"
  }), " is marginal at linear order. Analytic roots are compared with a deterministic bisection scan at tolerance", /*#__PURE__*/React.createElement(Eq, {
    tex: "10^{-9}"
  }), numeric && primary ? "; current |g*analytic \u2212 g*numeric| = ".concat(Math.abs(primary.g - numeric.g).toExponential(2), ".") : "."), /*#__PURE__*/React.createElement("div", {
    className: "rg-method-strip"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Integrator"), " fixed-step RK4"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "\u0394 ln \u03BC"), " ", integration.step.toFixed(3)), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "roundoff disclosure"), " 10\u207B\xB9\u2070 diagnostic"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "IR"), " ", integration.infrared.status), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "UV"), " ", integration.ultraviolet.status), analytic ? /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "one-loop analytic"), " ", analytic.status) : null));
}
function RGFlowLandscape() {
  var _useQGAState = useQGAState(),
    _useQGAState2 = _slicedToArray(_useQGAState, 2),
    state = _useQGAState2[0],
    setState = _useQGAState2[1];
  var reducedMotion = usePRM();
  var _useState5 = useState(null),
    _useState6 = _slicedToArray(_useState5, 2),
    hoverLog = _useState6[0],
    setHoverLog = _useState6[1];
  var _useState7 = useState(""),
    _useState8 = _slicedToArray(_useState7, 2),
    shareStatus = _useState8[0],
    setShareStatus = _useState8[1];
  var parameters = useMemo(function () {
    return rgParameters(state);
  }, [state.rgNf, state.rgA, state.rgB, state.rgGStar]);
  var integration = useMemo(function () {
    return window.QGA_PHYSICS.integrateRGFlow({
      model: state.rgModel,
      g0: state.rgG0,
      t0: 0,
      tMin: (state.rgLogMin - state.rgMu0) * RG_LN10,
      tMax: (state.rgLogMax - state.rgMu0) * RG_LN10,
      step: 0.02,
      gLimit: RG_G_LIMIT,
      parameters: parameters
    });
  }, [state.rgModel, state.rgG0, state.rgMu0, state.rgLogMin, state.rgLogMax, parameters]);
  var eased = useEasedRGPoints(integration.points, reducedMotion);
  var fixedPoints = useMemo(function () {
    return window.QGA_PHYSICS.rgFixedPoints(state.rgModel, parameters);
  }, [state.rgModel, parameters]);
  var numericFixed = useMemo(function () {
    return window.QGA_PHYSICS.findRGFixedPoints(state.rgModel, parameters, {
      gMin: 0,
      gMax: 4,
      tolerance: 1e-9
    });
  }, [state.rgModel, parameters]);
  var currentT = (state.rgCurrent - state.rgMu0) * RG_LN10;
  var currentPoint = rgSample(integration.points, currentT);
  var activePresetId = rgActivePresetId(state);
  var activePreset = RG_PRESETS[activePresetId] || RG_PRESETS.qcd;
  var scientificStatus = rgScientificStatus(state);
  var isAsymptoticSafety = scientificStatus === "conjectural-illustrative-toy";
  var layer = isAsymptoticSafety ? "conjectural" : ["qed", "qcd"].includes(state.rgModel) ? "effective" : "schematic";
  var update = function update(patch) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return setState(function (current) {
      var origin = current.rgPresetOrigin in RG_PRESETS ? current.rgPresetOrigin : current.rgPreset in RG_PRESETS ? current.rgPreset : "qcd";
      var next = _objectSpread(_objectSpread({}, current), typeof patch === "function" ? patch(current) : patch);
      next.rgPreset = "custom";
      next.rgPresetOrigin = origin;
      return next;
    }, options);
  };
  var setCurrent = function setCurrent(value) {
    return setState({
      rgCurrent: value
    }, {
      replace: true
    });
  };
  var updateRange = function updateRange(key, value) {
    var next = key === "rgLogMin" ? Math.min(value, state.rgLogMax - 0.5) : Math.max(value, state.rgLogMin + 0.5);
    var lo = key === "rgLogMin" ? next : state.rgLogMin;
    var hi = key === "rgLogMax" ? next : state.rgLogMax;
    update(_defineProperty(_defineProperty(_defineProperty({}, key, next), "rgMu0", Math.max(lo, Math.min(hi, state.rgMu0))), "rgCurrent", Math.max(lo, Math.min(hi, state.rgCurrent))));
  };
  var copy = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            _context.p = 0;
            _context.n = 1;
            return QGA_COPY_LINK(qgaReadState());
          case 1:
            setShareStatus("RG state link copied.");
            _context.n = 3;
            break;
          case 2:
            _context.p = 2;
            _t = _context.v;
            setShareStatus("Copy failed: " + ((_t === null || _t === void 0 ? void 0 : _t.message) || "clipboard unavailable"));
          case 3:
            return _context.a(2);
        }
      }, _callee, null, [[0, 2]]);
    }));
    return function copy() {
      return _ref5.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "rg-landscape rg-layer-" + layer
  }, /*#__PURE__*/React.createElement("header", {
    className: "rg-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rg-head-plate"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rg-head-ident"
  }, "RG\xB7FLOW / 03"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Renormalisation-Group Flow Landscape"), /*#__PURE__*/React.createElement("p", null, "One synchronized instrument for scale evolution, \u03B2 geometry, fixed points, and validity boundaries."))), /*#__PURE__*/React.createElement("div", {
    className: "rg-head-state"
  }, /*#__PURE__*/React.createElement(Badge, {
    kind: layer
  }), /*#__PURE__*/React.createElement("span", null, activePreset ? activePreset.title : "Custom parameters"))), /*#__PURE__*/React.createElement("div", {
    className: "rg-presets",
    role: "group",
    "aria-label": "Documented RG presets"
  }, Object.entries(RG_PRESETS).map(function (_ref6) {
    var _ref7 = _slicedToArray(_ref6, 2),
      id = _ref7[0],
      preset = _ref7[1];
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      className: "rg-preset" + (state.rgPreset === id ? " on" : ""),
      "aria-pressed": state.rgPreset === id,
      onClick: function onClick() {
        return setState(_objectSpread(_objectSpread({}, rgPresetPatch(id)), {}, {
          rgPresetOrigin: id
        }), {
          replace: false
        });
      }
    }, /*#__PURE__*/React.createElement("span", null, preset.title), /*#__PURE__*/React.createElement("small", null, preset.model));
  })), /*#__PURE__*/React.createElement("div", {
    className: "rg-control-deck"
  }, /*#__PURE__*/React.createElement(RGControl, {
    label: "initial coupling g\u2080",
    value: state.rgG0,
    min: 0,
    max: 3.4,
    step: 0.001,
    onChange: function onChange(value) {
      return update({
        rgG0: value
      });
    },
    format: function format(value) {
      return value.toFixed(3);
    }
  }), /*#__PURE__*/React.createElement(RGControl, {
    label: "reference log\u2081\u2080 \u03BC\u2080",
    value: state.rgMu0,
    min: state.rgLogMin,
    max: state.rgLogMax,
    step: 0.1,
    onChange: function onChange(value) {
      return update({
        rgMu0: value
      });
    },
    format: function format(value) {
      return value.toFixed(1) + " GeV decade";
    }
  }), /*#__PURE__*/React.createElement(RGControl, {
    label: "range \xB7 IR bound",
    value: state.rgLogMin,
    min: -12,
    max: 29.5,
    step: 0.1,
    onChange: function onChange(value) {
      return updateRange("rgLogMin", value);
    },
    format: function format(value) {
      return value.toFixed(1);
    }
  }), /*#__PURE__*/React.createElement(RGControl, {
    label: "range \xB7 UV bound",
    value: state.rgLogMax,
    min: -11.5,
    max: 30,
    step: 0.1,
    onChange: function onChange(value) {
      return updateRange("rgLogMax", value);
    },
    format: function format(value) {
      return value.toFixed(1);
    }
  }), state.rgModel === "qed" || state.rgModel === "qcd" ? /*#__PURE__*/React.createElement(RGControl, {
    label: "active flavours n_f",
    value: state.rgNf,
    min: state.rgModel === "qed" ? 1 : 0,
    max: 16,
    step: 1,
    onChange: function onChange(value) {
      return update({
        rgNf: value
      });
    },
    format: function format(value) {
      return String(Math.round(value));
    }
  }) : null, state.rgModel === "gaussian" || state.rgModel === "linear" || state.rgModel === "asymptotic-safety" ? /*#__PURE__*/React.createElement(RGControl, {
    label: state.rgModel === "linear" ? "linear slope a" : "model coefficient a",
    value: state.rgA,
    min: state.rgModel === "linear" ? -2 : 0.1,
    max: 2,
    step: 0.05,
    onChange: function onChange(value) {
      return update({
        rgA: value
      });
    }
  }) : null, state.rgModel === "linear" ? /*#__PURE__*/React.createElement(RGControl, {
    label: "target fixed point g*",
    value: state.rgGStar,
    min: 0,
    max: 3,
    step: 0.05,
    onChange: function onChange(value) {
      return update({
        rgGStar: value
      });
    }
  }) : null, state.rgModel === "asymptotic-safety" ? /*#__PURE__*/React.createElement(RGControl, {
    label: "nonlinear coefficient b",
    value: state.rgB,
    min: 0.05,
    max: 2,
    step: 0.05,
    onChange: function onChange(value) {
      return update({
        rgB: value
      });
    }
  }) : null), /*#__PURE__*/React.createElement("div", {
    className: "rg-actions"
  }, /*#__PURE__*/React.createElement(RGControl, {
    label: "current scale log\u2081\u2080 \u03BC",
    value: state.rgCurrent,
    min: state.rgLogMin,
    max: state.rgLogMax,
    step: 0.01,
    onChange: setCurrent,
    format: function format(value) {
      return value.toFixed(2);
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      return setState(rgPresetPatch(activePresetId), {
        replace: false
      });
    }
  }, "Reset preset"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: copy
  }, "Copy RG link"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      QGA_EXPORT_JSON(qgaReadState());
      setShareStatus("RG JSON exported.");
    }
  }, "Export RG JSON")), /*#__PURE__*/React.createElement("span", {
    className: "rg-share-status",
    "aria-live": "polite"
  }, shareStatus)), /*#__PURE__*/React.createElement("div", {
    className: "rg-chamber"
  }, /*#__PURE__*/React.createElement(RGScalePlot, {
    state: state,
    points: eased.points,
    fixedPoints: fixedPoints,
    currentPoint: currentPoint,
    hoverLog: hoverLog,
    setHoverLog: setHoverLog,
    setCurrent: setCurrent,
    settling: eased.settling
  }), /*#__PURE__*/React.createElement(RGBetaPlot, {
    state: state,
    fixedPoints: fixedPoints,
    currentPoint: currentPoint
  })), /*#__PURE__*/React.createElement("div", {
    className: "rg-readout-deck"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "current coupling"), /*#__PURE__*/React.createElement("strong", null, currentPoint ? currentPoint.g.toFixed(6) : "terminated"), /*#__PURE__*/React.createElement("small", null, currentPoint ? "\u03B1 = ".concat((Math.pow(currentPoint.g, 2) / (4 * Math.PI)).toFixed(6)) : "outside bounded validity domain")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "current \u03B2(g)"), /*#__PURE__*/React.createElement("strong", null, currentPoint ? currentPoint.beta.toExponential(4) : "—"), /*#__PURE__*/React.createElement("small", null, "dg / d ln \u03BC \xB7 natural-log convention")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "fixed-point census"), /*#__PURE__*/React.createElement("strong", null, fixedPoints.length), /*#__PURE__*/React.createElement("small", null, fixedPoints.map(function (point) {
    return "".concat(point.g.toFixed(3), " \xB7 ").concat(point.stability);
  }).join(" / ") || "none in analytic model")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "bounded integration"), /*#__PURE__*/React.createElement("strong", null, integration.status), /*#__PURE__*/React.createElement("small", null, "IR ", integration.infrared.status, " \xB7 UV ", integration.ultraviolet.status))), /*#__PURE__*/React.createElement(RGLiveFormulation, {
    state: state,
    currentPoint: currentPoint,
    fixedPoints: fixedPoints,
    numericFixed: numericFixed,
    integration: integration
  }), /*#__PURE__*/React.createElement("div", {
    className: "rg-validity-grid"
  }, /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement(Badge, {
    kind: ["qed", "qcd"].includes(state.rgModel) ? "effective" : "schematic"
  }), /*#__PURE__*/React.createElement("h4", null, state.rgModel === "qed" ? "QED perturbative layer" : state.rgModel === "qcd" ? "QCD perturbative layer" : "Pedagogical model layer"), /*#__PURE__*/React.createElement("p", null, state.rgModel === "qed" ? "The positive one-loop β and analytic running are established perturbative QED. The formal Landau pole is an extrapolation far beyond the trustworthy domain, not an observed phenomenon." : state.rgModel === "qcd" ? /*#__PURE__*/React.createElement(React.Fragment, null, "For SU(3), ", /*#__PURE__*/React.createElement(Eq, {
    tex: "b_0 = 11 - 2n_f/3"
  }), " = ", window.QGA_PHYSICS.qcdB0(state.rgNf).toFixed(3), ". The UV trend is perturbative; the ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\alpha_s = 1"
  }), " stop marks entry into strong coupling, not a prediction of a physical divergence.") : "The linear and polynomial β functions are transparent teaching systems. Their trajectories are numerical illustrations, not measured running couplings.")), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement(Badge, {
    kind: isAsymptoticSafety ? "conjectural" : "schematic"
  }), /*#__PURE__*/React.createElement("h4", null, "Quantum-gravity claim boundary"), /*#__PURE__*/React.createElement("p", null, isAsymptoticSafety ? "This polynomial preset is a pedagogical toy: its interacting UV fixed point is built into the coefficients and is not evidence of anything about gravity. The Einstein–Hilbert flow in the section below is the computed truncation, with the fixed point the equations give." : "Fixed-point arrows report the selected mathematical model only. No preset establishes ultraviolet completion of quantum gravity.")), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement(Badge, {
    kind: "established"
  }), /*#__PURE__*/React.createElement("h4", null, "Numerical and display contract"), /*#__PURE__*/React.createElement("p", null, "Deterministic fixed-step RK4 integrates both directions from ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\mu_0"
  }), ". Non-finite values, iteration limits, and ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\alpha = 1"
  }), " boundaries terminate visibly; no missing segment is reported as success. Reduced motion snaps directly to exact final geometry."))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: layer === "effective" ? "rg-scale-trajectory" : layer === "conjectural" ? "rg-landscape-asymptotic-safety" : "rg-landscape-toy",
    status: layer
  }, (activePreset === null || activePreset === void 0 ? void 0 : activePreset.note) || "Custom parameter state.", " Scale is measurement resolution, not ordinary time. Curve morphing is presentation-only; readouts always use the exact current state."));
}

// Module composition and the window export live in mod-rg-stage3.jsx.