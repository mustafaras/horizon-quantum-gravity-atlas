/* Compiled from js/mod-blackholes.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// mod-blackholes.jsx — Module 07: Black Holes, Entropy, and Holography
/* ---------- Eased Kerr geometry ----------
   Interpolates the numeric fields of kerrGeometry() so the coordinate map and
   the characteristic-radius rings glide between slider values instead of
   snapping. Purely presentational: the readouts always print the exact target
   values, and reduced-motion users get an instant snap. */
var KERR_EASE_KEYS = ["a", "rPlus", "rMinus", "rErgoEquator", "rIsco", "rIscoRetrograde", "rPhoton", "rPhotonRetrograde", "z1", "z2", "surfaceGravity", "temperatureFactor"];
function useEasedKerr(target) {
  var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.55;
  var prm = usePRM();
  var _useState = useState(target),
    _useState2 = _slicedToArray(_useState, 2),
    shown = _useState2[0],
    setShown = _useState2[1];
  var shownRef = useRef(target);
  var targetRef = useRef(target);
  targetRef.current = target;
  var rafRef = useRef(0);
  // kerrGeometry() is a pure function of the spin parameter, so the spin is a
  // complete and stable dependency key for the whole geometry object.
  var key = target.a;
  useEffect(function () {
    var goal = targetRef.current;
    if (prm) {
      cancelAnimationFrame(rafRef.current);
      shownRef.current = goal;
      setShown(goal);
      return undefined;
    }
    var from = shownRef.current;
    var moved = false;
    var _iterator = _createForOfIteratorHelper(KERR_EASE_KEYS),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var k = _step.value;
        if (Math.abs(from[k] - goal[k]) > 1e-9) {
          moved = true;
          break;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    if (!moved) {
      shownRef.current = goal;
      return undefined;
    }
    var t0 = performance.now();
    var _step3 = function step(now) {
      var p = Math.min(1, (now - t0) / (duration * 1000));
      var e = 1 - Math.pow(1 - p, 3);
      var next = {};
      var _iterator2 = _createForOfIteratorHelper(KERR_EASE_KEYS),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var k = _step2.value;
          next[k] = from[k] + (goal[k] - from[k]) * e;
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      shownRef.current = next;
      setShown(next);
      if (p < 1) rafRef.current = requestAnimationFrame(_step3);
    };
    rafRef.current = requestAnimationFrame(_step3);
    return function () {
      return cancelAnimationFrame(rafRef.current);
    };
  }, [key, duration, prm]);
  return shown;
}

/* ---------- Hawking blackbody spectrum (responds to mass & spin) ---------- */
// The Figure Kit builds the plot (js/figure/plots/bh.mjs): visual temperature, normalised x³/(eˣ/ᵀ − 1).
function HawkingSpectrumPlot(_ref) {
  var logM = _ref.logM,
    tempFactor = _ref.tempFactor;
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.bh.hawkingSpectrumSpec({
      logM: logM,
      tempFactor: tempFactor
    });
  }, [logM, tempFactor]);
  // The pair sits beside a panel that carries controls, a spectrum and three small multiples. Filling this side
  // with what the blackbody *is* keeps the two columns the same height instead of leaving a void under the plot.
  return /*#__PURE__*/React.createElement("div", {
    className: "bh-hawking-figure"
  }, /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }), /*#__PURE__*/React.createElement("div", {
    className: "bh-hawking-notes"
  }, /*#__PURE__*/React.createElement("p", null, "The purely thermal shape ", /*#__PURE__*/React.createElement(Eq, {
    tex: "x^3/(e^{x/T}-1)"
  }), " a hole would emit if its gravitational field scattered nothing. It is the right starting point and the wrong answer: the barrier in front of the horizon removes part of every wave, which is what the panel beside this one computes."), /*#__PURE__*/React.createElement("dl", {
    className: "bh-hawking-facts"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "temperature"), /*#__PURE__*/React.createElement("dd", null, /*#__PURE__*/React.createElement(Eq, {
    tex: "T_H\\propto 1/M"
  }), " \u2014 smaller holes are hotter")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "peak"), /*#__PURE__*/React.createElement("dd", null, /*#__PURE__*/React.createElement(Eq, {
    tex: "E_{\\max}\\approx 2.82\\,k_BT"
  }), ", the Wien peak of this curve")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "specific heat"), /*#__PURE__*/React.createElement("dd", null, "negative: radiating makes the hole hotter still"))), /*#__PURE__*/React.createElement(HawkingMassExplorer, null)));
}

/**
 * Why the temperature axis matters: the same hole at four masses.
 *
 * A single spectrum hides the point of the module — that evaporation runs away. Drawing the blackbody at four
 * masses on one axis, with the peak scaling as 1/M, shows the runaway instead of asserting it.
 */
function HawkingMassExplorer() {
  var _useState3 = useState(10),
    _useState4 = _slicedToArray(_useState3, 2),
    solar = _useState4[0],
    setSolar = _useState4[1];
  var masses = [1, 10, 1e6, 1e9];
  var spec = useMemo(function () {
    var G = window.QGA_GREYBODY;
    // Wien peak energy scales as 1/M: normalise so 10 solar masses sits at the middle of the axis.
    // Four masses, four visible peak positions inside the 0..3 window: heavier is colder is further right.
    var scaled = [{
      m: 1,
      peak: 0.35
    }, {
      m: 10,
      peak: 0.7
    }, {
      m: 1e6,
      peak: 1.4
    }, {
      m: 1e9,
      peak: 2.4
    }];
    return window.QGA_FIGURE.plots.bh.hawkingMassSpec({
      scaled: scaled,
      selected: solar
    });
  }, [solar]);
  return /*#__PURE__*/React.createElement("div", {
    className: "bh-mass-explorer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bh-mass-controls",
    role: "group",
    "aria-label": "black hole mass"
  }, masses.map(function (m) {
    return /*#__PURE__*/React.createElement("button", {
      key: m,
      type: "button",
      className: "btn" + (m === solar ? " on" : ""),
      "aria-pressed": m === solar,
      onClick: function onClick() {
        return setSolar(m);
      }
    }, m === 1 ? "1" : m === 1e6 ? "10⁶" : m === 1e9 ? "10⁹" : "10", " M\u2609");
  })), /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }));
}

/* ---------- Page curve: the derived entropy budget, with its Page time ---------- */
// S24 replaced the tent function with Page's computed coefficient. The readout states the crossing the figure
// draws, so the number on screen and the rule in the plot cannot drift apart.
function PageCurvePlot() {
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.bh.pageCurveSpec();
  }, []);
  var summary = useMemo(function () {
    return window.QGA_EVAPORATION.pageTimeSummary();
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "bh-page-figure"
  }, /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }), /*#__PURE__*/React.createElement("div", {
    className: "readout-grid bh-page-readouts",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "Page time"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, summary.timeFraction.toFixed(4), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "t/tau")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "from S_rad = S_BH with Page's beta = ", summary.beta)), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "entropy at the crossing"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, (100 * summary.entropyFraction).toFixed(2), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "% of S0")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "beta/(1+beta); a tent function would have said 50 %")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "mass at the crossing"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, summary.massFraction.toFixed(4), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "M/M0")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "M goes as (1 - t/tau)^(1/3), so the hole keeps 77 % of its mass here"))));
}

/* ---------- Greybody-corrected emission spectrum ---------- */
// The probe slides along the spectrum and reports what the barrier does at that energy, so the step in the
// corrected curve is something the reader can interrogate rather than infer.
function GreybodySpectrumPlot() {
  var _useState5 = useState(0.2),
    _useState6 = _slicedToArray(_useState5, 2),
    probe = _useState6[0],
    setProbe = _useState6[1];
  var reduced = usePRM();
  var _useState7 = useState(false),
    _useState8 = _slicedToArray(_useState7, 2),
    playing = _useState8[0],
    setPlaying = _useState8[1];
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.bh.greybodySpectrumSpec({
      temperature: 0.15,
      highlight: probe
    });
  }, [probe]);
  var transmissions = useMemo(function () {
    return window.QGA_FIGURE.plots.bh.transmissionSpecs({
      temperature: 0.15
    });
  }, []);
  var G = window.QGA_GREYBODY;
  useEffect(function () {
    if (!playing || reduced) return undefined;
    var timer = setInterval(function () {
      return setProbe(function (p) {
        return p >= 1.99 ? 0.02 : Math.min(1.99, p + 0.02);
      });
    }, 45);
    return function () {
      return clearInterval(timer);
    };
  }, [playing, reduced]);
  var gamma = function gamma(l) {
    return G.transmission(l, probe, 1);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "bh-greybody-figure"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bh-greybody-controls"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    "aria-pressed": playing,
    onClick: function onClick() {
      return setPlaying(!playing);
    },
    disabled: reduced
  }, playing ? 'Pause sweep' : 'Sweep energy'), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", null, "energy omega M"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 0.02,
    max: 1.98,
    step: 0.01,
    value: probe,
    "aria-label": "probe energy",
    onChange: function onChange(e) {
      setPlaying(false);
      setProbe(Number(e.target.value));
    }
  }), /*#__PURE__*/React.createElement("strong", null, probe.toFixed(2)))), /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }), /*#__PURE__*/React.createElement("div", {
    className: "bh-transmission-row",
    "aria-live": "polite"
  }, transmissions.map(function (row, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: row.id,
      className: "bh-transmission-cell"
    }, /*#__PURE__*/React.createElement(Figure, {
      spec: row
    }), /*#__PURE__*/React.createElement("span", {
      className: "bh-transmission-readout"
    }, "l = ", i, ": ", /*#__PURE__*/React.createElement("strong", null, (100 * gamma(i)).toFixed(1), "%")));
  })), /*#__PURE__*/React.createElement("div", {
    className: "readout-grid bh-greybody-readouts bh-readouts-wide",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "low-frequency cross-section"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, G.lowFrequencyCrossSection(1).toFixed(2), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "pi M^2")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "A_H = 16 pi M^2, from Das, Gibbons and Mathur (1997)")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "geometric-optics limit"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, G.highFrequencyCrossSection(1).toFixed(2), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "pi M^2")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "27 pi M^2; the two limits differ by exactly ", G.CROSS_SECTION_RATIO.toFixed(4))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "s-wave transmission at omega M = 0.2"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, (100 * G.transmission(0, 0.2, 1)).toFixed(1), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "%")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "the barrier is what makes the spectrum not a blackbody"))));
}

// Camera presets expressed as observatory state: inclination from the spin axis (deg) and
// observer distance (GM/c²). The orbit camera is the observer, so these drive the render.
var KERR_CAMERA_PRESETS = {
  edge: {
    inclination: 80,
    distance: 40,
    theta: 0.35
  },
  polar: {
    inclination: 8,
    distance: 40,
    theta: 0.25
  },
  photon: {
    inclination: 70,
    distance: 22,
    theta: 0.5
  },
  wide: {
    inclination: 75,
    distance: 90,
    theta: -0.45
  }
};
function kerrCameraGoal(inclinationDeg, distance) {
  var theta = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.35;
  return {
    radius: distance,
    theta: theta,
    phi: inclinationDeg * Math.PI / 180
  };
}
var KERR_CURVES = [{
  key: "isco",
  sense: "retro",
  token: "pigment-violet-72-c17",
  color: QGA_TOKENS.css("pigment-violet-72-c17"),
  dash: "5 4",
  width: 1.2,
  label: "ISCO retrograde",
  read: function read(g) {
    return g.rIscoRetrograde;
  }
}, {
  key: "isco",
  sense: "pro",
  token: "accent",
  color: QGA_TOKENS.css("accent"),
  dash: "",
  width: 1.9,
  label: "ISCO prograde",
  read: function read(g) {
    return g.rIsco;
  }
}, {
  key: "photon",
  sense: "retro",
  token: "signal-warm",
  color: QGA_TOKENS.css("signal-warm"),
  dash: "3 4",
  width: 1.1,
  label: "Photon retrograde",
  read: function read(g) {
    return g.rPhotonRetrograde;
  }
}, {
  key: "photon",
  sense: "pro",
  token: "pigment-orange-89",
  color: QGA_TOKENS.css("pigment-orange-89"),
  dash: "",
  width: 1.9,
  label: "Photon prograde",
  read: function read(g) {
    return g.rPhoton;
  }
}, {
  key: "ergo",
  sense: "",
  token: "accent-2",
  color: QGA_TOKENS.css("accent-2"),
  dash: "",
  width: 1.6,
  label: "Ergosurface (eq.)",
  read: function read(g) {
    return g.rErgoEquator;
  },
  fill: QGA_TOKENS.alpha("accent-2", 0.07)
}, {
  key: "horizon",
  sense: "",
  token: "signal-danger",
  color: QGA_TOKENS.css("signal-danger"),
  dash: "",
  width: 2.3,
  label: "Outer horizon r₊",
  read: function read(g) {
    return g.rPlus;
  },
  fill: QGA_TOKENS.alpha("pigment-grey-13", 0.97)
}];
function KerrGeometryMap(_ref2) {
  var geometry = _ref2.geometry,
    exact = _ref2.exact,
    layers = _ref2.layers,
    open = _ref2.open,
    onToggle = _ref2.onToggle,
    settling = _ref2.settling,
    motion = _ref2.motion;
  var visible = KERR_CURVES.filter(function (curve) {
    return layers[curve.key];
  });
  var widest = visible.reduce(function (acc, curve) {
    return Math.max(acc, curve.read(geometry));
  }, 2);
  var domain = Math.max(4, Math.ceil(widest));
  var readout = exact || geometry;
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.bh.kerrRadiiSpec({
      rings: visible.map(function (curve) {
        return {
          radius: curve.read(geometry),
          color: curve.token,
          dash: curve.dash,
          width: curve.width,
          label: curve.label.replace("₊", "+"),
          focal: curve.key === "horizon"
        };
      }),
      domain: domain,
      spin: readout.a
    });
  }, [geometry, layers, domain, readout.a]); // eslint-disable-line

  if (!open) {
    return /*#__PURE__*/React.createElement("button", {
      className: "kerr-map-toggle",
      type: "button",
      "aria-expanded": "false",
      onClick: onToggle
    }, /*#__PURE__*/React.createElement("span", {
      className: "kerr-map-toggle-icon",
      "aria-hidden": "true"
    }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Radii map"), /*#__PURE__*/React.createElement("small", null, "Show exact Kerr geometry")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "kerr-map" + (settling ? " settling" : "") + (motion ? " live" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-map-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-map-unit"
  }, "R / r", /*#__PURE__*/React.createElement("sub", null, "g"), " \xB7 a\u2605 ", readout.a.toFixed(2)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "kerr-map-close",
    "aria-label": "Hide Kerr radii map",
    "aria-expanded": "true",
    onClick: onToggle
  }, "Hide")), /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }), /*#__PURE__*/React.createElement("table", {
    className: "kerr-map-legend"
  }, /*#__PURE__*/React.createElement("tbody", null, visible.map(function (curve, index) {
    return /*#__PURE__*/React.createElement("tr", {
      key: index
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "6",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement("line", {
      x1: "0",
      y1: "3",
      x2: "16",
      y2: "3",
      stroke: curve.color,
      strokeWidth: curve.width,
      strokeDasharray: curve.dash
    }))), /*#__PURE__*/React.createElement("th", {
      scope: "row"
    }, curve.label), /*#__PURE__*/React.createElement("td", {
      className: "kerr-legend-value"
    }, curve.read(readout).toFixed(3)));
  }))), /*#__PURE__*/React.createElement("p", {
    className: "kerr-map-note"
  }, "Boyer\u2013Lindquist coordinate radii, exact Kerr \xB7 not image-plane distances"));
}

/* TeX twin of sciNotation() for the KaTeX readouts: 8.9×10³ → 8.9\times10^{3}. */
function kerrTexSci(x) {
  var digits = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
  if (!Number.isFinite(x) || x === 0) return "0";
  var e = Math.floor(Math.log10(Math.abs(x)));
  var m = x / Math.pow(10, e);
  if (e >= -2 && e <= 3) return x.toPrecision(digits);
  return m.toFixed(digits - 1) + "\\times10^{" + e + "}";
}

/* Readout card. `formula`/`sub` stay as plain-text fallbacks for callers that
   pass prose; `formulaTex`/`subTex` carry the same content as KaTeX so the
   governing relation and its substituted numbers typeset as real mathematics. */
function KerrReadout(_ref3) {
  var label = _ref3.label,
    value = _ref3.value,
    unit = _ref3.unit,
    formula = _ref3.formula,
    formulaTex = _ref3.formulaTex,
    sub = _ref3.sub,
    subTex = _ref3.subTex,
    lead = _ref3.lead,
    pair = _ref3.pair;
  return /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout" + (lead ? " lead" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-label"
  }, label, pair && unit ? /*#__PURE__*/React.createElement("span", {
    className: "in-unit"
  }, " \xB7 ", unit) : null), pair ? /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-pair"
  }, pair.map(function (_ref4) {
    var _ref5 = _slicedToArray(_ref4, 2),
      sense = _ref5[0],
      amount = _ref5[1];
    return /*#__PURE__*/React.createElement("div", {
      key: sense
    }, /*#__PURE__*/React.createElement("span", {
      className: "sense"
    }, sense), /*#__PURE__*/React.createElement("span", {
      className: "amount"
    }, amount));
  })) : /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-value"
  }, value, unit ? /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, unit) : null), formulaTex ? /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: formulaTex
  })) : formula ? /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, formula) : null, subTex ? /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-sub"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: subTex
  })) : sub ? /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-sub"
  }, sub) : null);
}
function KerrValidity(_ref6) {
  var geometry = _ref6.geometry;
  var limit = window.QGA_PHYSICS.kerrGeometry(0);
  // [plain label (React key), TeX label, computed value, Schwarzschild target]
  var checks = [["r₊ → 2", "r_+ \\to 2", limit.rPlus, 2], ["ISCO → 6", "\\text{ISCO} \\to 6", limit.rIsco, 6], ["photon → 3", "\\text{photon} \\to 3", limit.rPhoton, 3], ["T_H / T_Schw → 1", "T_H / T_{\\rm Schw} \\to 1", limit.temperatureFactor, 1]];
  var allPass = checks.every(function (_ref7) {
    var _ref8 = _slicedToArray(_ref7, 4),
      got = _ref8[2],
      want = _ref8[3];
    return Math.abs(got - want) < 1e-9;
  });
  var stateTex = "\\text{Current state: } a_\\star = " + geometry.a.toFixed(3) + " \\;\\cdot\\; r_+ = " + geometry.rPlus.toFixed(3) + " \\;\\cdot\\; \\text{ergoregion width} = " + (geometry.rErgoEquator - geometry.rPlus).toFixed(3) + "\\;\\mathrm{GM}/c^2";
  return /*#__PURE__*/React.createElement("details", {
    className: "kerr-validity"
  }, /*#__PURE__*/React.createElement("summary", null, /*#__PURE__*/React.createElement("span", null, "Assumptions, validity & uncertainty"), /*#__PURE__*/React.createElement("span", {
    className: "kerr-check" + (allPass ? " ok" : " bad")
  }, allPass ? "Schwarzschild limit verified" : "limit check failed")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-validity-body"
  }, /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("dt", null, "Exact, closed form"), /*#__PURE__*/React.createElement("dd", null, "Horizon, equatorial ergosurface, photon orbits and ISCO follow the standard equatorial Kerr expressions (Bardeen, Press & Teukolsky 1972). They are evaluated analytically, not fitted, and are reported in geometrised units ", /*#__PURE__*/React.createElement(Eq, {
    tex: "GM/c^2"
  }), "."), /*#__PURE__*/React.createElement("dt", null, "Ray-traced Kerr geodesics"), /*#__PURE__*/React.createElement("dd", null, "The observatory integrates Carter's null-geodesic equations in the full Kerr metric for every pixel (Runge\u2013Kutta 4 in Mino time, first integrals re-imposed each step) \u2014 frame dragging is part of the integration. Disk flux, orbital kinematics, redshift and blackbody colour come from the validated science core. What is ", /*#__PURE__*/React.createElement("em", null, "not"), " physical: the display-scaled 5000 K peak temperature, the heuristic turbulence texture, the per-crossing transmittance of the smooth disk models, the synthetic star catalogue and the 24 GM/c\xB2 disk outer edge. Orders beyond the ray budget are not drawn; no photon ring is thickened."), /*#__PURE__*/React.createElement("dt", null, "Semiclassical"), /*#__PURE__*/React.createElement("dd", null, "Hawking temperature and Bekenstein\u2013Hawking entropy assume a stationary black hole in the semiclassical regime, with no backreaction and no surrounding matter. Hawking radiation has never been observed. Evaporation time is an order-of-magnitude estimate only."), /*#__PURE__*/React.createElement("dt", null, "Self-check at a\u2605 = 0"), /*#__PURE__*/React.createElement("dd", {
    className: "kerr-limit-row"
  }, checks.map(function (_ref9) {
    var _ref0 = _slicedToArray(_ref9, 3),
      name = _ref0[0],
      tex = _ref0[1],
      got = _ref0[2];
    return /*#__PURE__*/React.createElement("span", {
      key: name
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: tex + " = " + got.toFixed(3)
    }));
  }))), /*#__PURE__*/React.createElement("p", {
    className: "kerr-validity-state"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: stateTex
  }))));
}

/* ---------- Live formulation: governing equations with the current numbers
   substituted. Every expression below is the closed form already implemented in
   js/physics.mjs (kerrGeometry / kerrErgosphere); nothing new is asserted here.
   Each row carries the relation and its substitution as KaTeX. */
function KerrFormulation(_ref1) {
  var geometry = _ref1.geometry,
    massSolar = _ref1.massSolar,
    temperature = _ref1.temperature,
    entropy = _ref1.entropy;
  var g = geometry;
  var a = g.a;
  var aTex = a.toFixed(3);
  var rows = [{
    id: "rpm",
    name: "Horizon pair",
    symTex: "r_\\pm = M \\pm \\sqrt{M^2 - a^2}",
    subTex: "r_+ = 1 + \\sqrt{1 - " + aTex + "^2} = " + g.rPlus.toFixed(3) + " \\qquad r_- = 1 - \\sqrt{1 - " + aTex + "^2} = " + g.rMinus.toFixed(3),
    val: g.rPlus.toFixed(3) + " / " + g.rMinus.toFixed(3),
    unit: "GM/c²"
  }, {
    id: "ergo",
    name: "Ergosurface",
    symTex: "r_E(\\theta) = M + \\sqrt{M^2 - a^2\\cos^2\\theta}",
    subTex: "\\theta = 90^\\circ \\Rightarrow 1 + \\sqrt{1 - " + aTex + "^2 \\cdot 0} = " + g.rErgoEquator.toFixed(3) + " \\qquad \\theta = 0^\\circ \\Rightarrow " + g.rPlus.toFixed(3),
    val: g.rErgoEquator.toFixed(3),
    unit: "GM/c²"
  }, {
    id: "photon",
    name: "Photon orbit",
    symTex: "r_{\\rm ph} = 2M\\left[1 + \\cos\\!\\left(\\tfrac{2}{3}\\arccos(\\mp a_\\star)\\right)\\right]",
    subTex: "\\text{pro: } 2\\left[1 + \\cos\\!\\left(\\tfrac{2}{3}\\arccos(-" + aTex + ")\\right)\\right] = " + g.rPhoton.toFixed(3) + " \\qquad \\text{retro: } " + g.rPhotonRetrograde.toFixed(3),
    val: g.rPhoton.toFixed(3) + " / " + g.rPhotonRetrograde.toFixed(3),
    unit: "GM/c²"
  }, {
    id: "isco",
    name: "ISCO",
    symTex: "r_{\\rm isco} = M\\left[3 + Z_2 \\mp \\sqrt{(3 - Z_1)(3 + Z_1 + 2Z_2)}\\right]",
    subTex: "Z_1 = " + g.z1.toFixed(3) + " \\qquad Z_2 = " + g.z2.toFixed(3) + " \\;\\Rightarrow\\; \\text{pro } " + g.rIsco.toFixed(3) + " \\qquad \\text{retro } " + g.rIscoRetrograde.toFixed(3),
    val: g.rIsco.toFixed(3) + " / " + g.rIscoRetrograde.toFixed(3),
    unit: "GM/c²"
  }, {
    id: "kappa",
    name: "Surface gravity",
    symTex: "\\kappa = \\dfrac{r_+ - M}{r_+^2 + a^2}",
    subTex: "\\dfrac{" + g.rPlus.toFixed(3) + " - 1}{" + g.rPlus.toFixed(3) + "^2 + " + aTex + "^2} = " + g.surfaceGravity.toFixed(4) + " \\;\\Rightarrow\\; T_H/T_{\\rm Schw} = " + g.temperatureFactor.toFixed(3),
    val: g.temperatureFactor.toFixed(3),
    unit: "× T_Schw"
  }, {
    id: "entropy",
    name: "Bekenstein–Hawking entropy",
    symTex: "S/k_B = 1.05\\times10^{77}\\,(M/M_\\odot)^2\\,(r_+/2M)",
    subTex: "1.05\\times10^{77} \\times \\left(" + kerrTexSci(massSolar, 2) + "\\right)^2 \\times " + (g.rPlus / 2).toFixed(3) + " = " + kerrTexSci(entropy, 2),
    val: sciNotation(entropy, 2),
    unit: "k_B"
  }, {
    id: "temp",
    name: "Hawking temperature",
    symTex: "T_H = \\dfrac{\\hbar c^3}{8\\pi G M k_B} \\cdot \\dfrac{\\kappa}{\\kappa_0}",
    subTex: "\\dfrac{6.17\\times10^{-8}\\;\\mathrm{K}}{" + kerrTexSci(massSolar, 2) + "} \\times " + g.temperatureFactor.toFixed(3) + " = " + kerrTexSci(temperature, 2) + "\\;\\mathrm{K}",
    val: sciNotation(temperature, 2),
    unit: "K"
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "kerr-formulation",
    "aria-label": "Live Kerr formulation with current parameter values",
    "data-qga-anchor": "kerr-formulation"
  }, /*#__PURE__*/React.createElement("header", {
    className: "kerr-formulation-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-formulation-ident"
  }, "LIVE FORMULATION"), /*#__PURE__*/React.createElement("span", {
    className: "kerr-formulation-state"
  }, "a\u2605 = ", a.toFixed(3), " \xB7 M = ", sciNotation(massSolar, 2), " M\u2609")), /*#__PURE__*/React.createElement("ol", {
    className: "kerr-formulation-list"
  }, rows.map(function (row) {
    return /*#__PURE__*/React.createElement("li", {
      key: row.id,
      className: "kerr-formulation-row"
    }, /*#__PURE__*/React.createElement("span", {
      className: "kerr-formulation-name"
    }, row.name), /*#__PURE__*/React.createElement("span", {
      className: "kerr-formulation-sym"
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: row.symTex
    })), /*#__PURE__*/React.createElement("span", {
      className: "kerr-formulation-sub"
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: row.subTex
    })), /*#__PURE__*/React.createElement("span", {
      className: "kerr-formulation-val"
    }, row.val, /*#__PURE__*/React.createElement("em", null, row.unit)));
  })), /*#__PURE__*/React.createElement("p", {
    className: "kerr-formulation-note"
  }, "Closed-form Kerr quantities in Boyer\u2013Lindquist coordinates, evaluated at the current sliders. These are exact coordinate radii; the ray-traced image above integrates Carter's Kerr geodesics numerically (see the validity panel)."));
}

/* ---------- 3D black hole laboratory ---------- */
function BlackHoleLab3D() {
  var _focus$kind;
  var _useQGAState = useQGAState(),
    _useQGAState2 = _slicedToArray(_useQGAState, 2),
    atlasState = _useQGAState2[0],
    setAtlasState = _useQGAState2[1];
  var prm = usePRM();
  var _useState9 = useState("edge"),
    _useState0 = _slicedToArray(_useState9, 2),
    cameraPreset = _useState0[0],
    setCameraPreset = _useState0[1];
  var _useState1 = useState({
      horizon: true,
      ergo: true,
      photon: true,
      isco: true
    }),
    _useState10 = _slicedToArray(_useState1, 2),
    layers = _useState10[0],
    setLayers = _useState10[1];
  var mapPreferenceKey = useRef(window.matchMedia("(max-width: 760px)").matches ? "qga-kerr-map-open-mobile" : "qga-kerr-map-open-desktop").current;
  var _useState11 = useState(function () {
      try {
        var stored = localStorage.getItem(mapPreferenceKey);
        if (stored !== null) return stored === "true";
      } catch (error) {
        console.warn("Kerr map preference could not be read.", error);
      }
      return mapPreferenceKey.endsWith("-desktop");
    }),
    _useState12 = _slicedToArray(_useState11, 2),
    mapOpen = _useState12[0],
    setMapOpen = _useState12[1];
  var logM = atlasState.bhMass;
  var aStar = atlasState.bhSpin;
  var logRef = useRef(logM);
  logRef.current = logM;
  var spinRef = useRef(aStar);
  spinRef.current = aStar;
  var stateRef = useRef(atlasState);
  stateRef.current = atlasState;
  var governorRef = useRef(null);
  var _useState13 = useState(null),
    _useState14 = _slicedToArray(_useState13, 2),
    focus = _useState14[0],
    setFocus = _useState14[1];
  var focusRef = useRef({
    x: 0,
    y: 0,
    radius: 0.2,
    strength: 0
  });
  var _useState15 = useState(null),
    _useState16 = _slicedToArray(_useState15, 2),
    cameraGoal = _useState16[0],
    setCameraGoal = _useState16[1];

  // Focus: dolly the camera toward the feature (snaps under reduced motion — Scene3D
  // applies a goal instantly when motion is 0) and drive the image-plane defocus disc.
  var orbitThetaOf = function orbitThetaOf(observer) {
    return observer ? Math.PI / 2 - observer.phi0 : 0.35;
  };
  var focusFeature = function focusFeature(kind, ndc) {
    var _snapshot$detail3d, _snapshot$lens;
    var kerrApi = window.QGA_KERR;
    if (!kerrApi) return;
    var cur = stateRef.current;
    var normalized = kerrApi.normalizeKerrState(_objectSpread(_objectSpread({}, cur), {}, {
      bhMass: cur.bhMass,
      bhSpin: cur.bhSpin
    }));
    var snapshot = window.__qgaKerrRuntime;
    var observer = snapshot === null || snapshot === void 0 ? void 0 : snapshot.observer;
    var budget = kerrApi.kerrQualityBudget(normalized.quality, {
      detail3d: (_snapshot$detail3d = snapshot === null || snapshot === void 0 ? void 0 : snapshot.detail3d) !== null && _snapshot$detail3d !== void 0 ? _snapshot$detail3d : "medium"
    });
    var renderState = kerrApi.buildKerrRenderState(normalized, {
      observer: observer,
      budget: budget
    });
    var lens = (_snapshot$lens = snapshot === null || snapshot === void 0 ? void 0 : snapshot.lens) !== null && _snapshot$lens !== void 0 ? _snapshot$lens : {
      tanHalfFov: Math.tan(40 * Math.PI / 360),
      aspect: 1.6
    };
    // A click classifies the traced pixel; a Focus button locates its feature in the image first.
    var point = ndc !== null && ndc !== void 0 ? ndc : kerrApi.locateKerrFeature(renderState, kind, lens);
    var picked = kerrApi.pickKerrPixel(renderState, point.x, point.y, lens);
    var resolved = ndc ? picked.kind : kind;
    var hit = picked.trace.hits.find(function (h) {
      return h.inDisk;
    });
    var extra = hit ? {
      order: hit.order,
      r: hit.r,
      g: kerrApi.shadeDiskHit(renderState, hit.r, picked.trace.E, picked.trace.Lz).g
    } : {};
    var plan = kerrApi.kerrFocusPlan(resolved, {
      observerDistance: normalized.observerDistance,
      rIscoPro: renderState.radii.rIsco
    });
    focusRef.current = {
      x: point.x,
      y: point.y,
      radius: plan.radius,
      strength: plan.strength
    };
    if (resolved !== "sky") {
      setCameraGoal(kerrCameraGoal(observer ? observer.theta0 * 180 / Math.PI : normalized.inclinationDeg, plan.distance, orbitThetaOf(observer)));
      setAtlasState({
        bhObserverDistance: Math.round(plan.distance)
      });
    }
    setFocus({
      kind: resolved,
      explanation: kerrApi.kerrFeatureExplanation(resolved, renderState, extra),
      ndc: point
    });
  };
  var onFocusRef = useRef(null);
  onFocusRef.current = function (_ref10) {
    var ndc = _ref10.ndc;
    return focusFeature(null, ndc);
  };
  var onCameraSettledRef = useRef(null);
  onCameraSettledRef.current = function (patch) {
    return setAtlasState(patch);
  };
  var clearFocus = function clearFocus() {
    focusRef.current = _objectSpread(_objectSpread({}, focusRef.current), {}, {
      strength: 0
    });
    setFocus(null);
  };
  var requestCamera = function requestCamera(_ref11) {
    var _window$__qgaKerrRunt;
    var inclination = _ref11.inclination,
      distance = _ref11.distance;
    var cur = stateRef.current;
    var o = (_window$__qgaKerrRunt = window.__qgaKerrRuntime) === null || _window$__qgaKerrRunt === void 0 ? void 0 : _window$__qgaKerrRunt.observer;
    setCameraGoal(kerrCameraGoal(inclination !== null && inclination !== void 0 ? inclination : cur.bhInclination, distance !== null && distance !== void 0 ? distance : cur.bhObserverDistance, orbitThetaOf(o)));
  };
  useEffect(function () {
    try {
      localStorage.setItem(mapPreferenceKey, String(mapOpen));
    } catch (error) {
      console.warn("Kerr map preference could not be saved.", error);
    }
  }, [mapOpen, mapPreferenceKey]);

  // Kerr observatory scene (Prompt 04 + the Prompt 05 volumetric layer). The
  // runtime (WebGPU compute path when the device offers it, WebGL2 fragment
  // integrator otherwise) integrates Carter's geodesic equations per pixel;
  // every physical number comes from js/science/ via window.QGA_KERR. This
  // build wires camera, state, picking, focus and the ultra-quality capture.
  var build = /*#__PURE__*/function () {
    var _ref12 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ctx) {
      var _ref13, _window$QGA_RENDER_OP, _window$QGA_RENDER_OP2, _stateRef$current$see;
      var scene, kerr, _yield$kerr$loadRunti, createKerrRuntime, softwareClamped, effectiveDetail3d, wantsVolume, runtime, lastLens, lastPlan, settleTimer, lastObserver, playingSeconds, captureStill, publish;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            scene = ctx.scene;
            kerr = window.QGA_KERR;
            if (kerr) {
              _context.n = 1;
              break;
            }
            throw new Error("Kerr observatory module is unavailable; reload the page.");
          case 1:
            _context.n = 2;
            return kerr.loadRuntime();
          case 2:
            _yield$kerr$loadRunti = _context.v;
            createKerrRuntime = _yield$kerr$loadRunti.createKerrRuntime;
            // The render session clamps CPU rasterizers (SwiftShader, llvmpipe...) to
            // the low tier. The volumetric layer and the Kerr ray budget must honour
            // that same *effective* tier, not the requested one, or a software
            // rasterizer pays seconds per frame for a layer it cannot afford.
            softwareClamped = function softwareClamped() {
              var _window$QGA_RENDER$so, _window$QGA_RENDER, _window$QGA_RENDER$so2;
              return (_window$QGA_RENDER$so = (_window$QGA_RENDER = window.QGA_RENDER) === null || _window$QGA_RENDER === void 0 || (_window$QGA_RENDER$so2 = _window$QGA_RENDER.softwareRendererClamp) === null || _window$QGA_RENDER$so2 === void 0 ? void 0 : _window$QGA_RENDER$so2.call(_window$QGA_RENDER)) !== null && _window$QGA_RENDER$so !== void 0 ? _window$QGA_RENDER$so : null;
            };
            effectiveDetail3d = function effectiveDetail3d() {
              return softwareClamped() ? "low" : ctx.settings.current.detail3d;
            }; // The volumetric layer (corona + jets) renders on the WebGL2 integrator;
            // requesting it selects that backend (the same policy as the turbulent
            // disk texture). The performance quality ceiling gates it off inside sync.
            wantsVolume = (stateRef.current.bhCorona !== false || stateRef.current.bhJets !== false) && effectiveDetail3d() !== "low";
            _context.n = 3;
            return createKerrRuntime({
              backendPreference: (_ref13 = (_window$QGA_RENDER_OP = (_window$QGA_RENDER_OP2 = window.QGA_RENDER_OPTIONS) === null || _window$QGA_RENDER_OP2 === void 0 ? void 0 : _window$QGA_RENDER_OP2.forceBackend) !== null && _window$QGA_RENDER_OP !== void 0 ? _window$QGA_RENDER_OP : ctx.settings.current.renderBackend) !== null && _ref13 !== void 0 ? _ref13 : "auto",
              seed: (_stateRef$current$see = stateRef.current.seed) !== null && _stateRef$current$see !== void 0 ? _stateRef$current$see : 42,
              diskModel: stateRef.current.bhDiskModel,
              wantsVolume: wantsVolume
            });
          case 3:
            runtime = _context.v;
            scene.add(runtime.mesh);
            _context.n = 4;
            return window.QGA_TERM_LENS.attach("kerr-observatory", ctx, {
              massSolar: function massSolar() {
                return Math.pow(10, logRef.current);
              }
            });
          case 4:
            lastLens = {
              tanHalfFov: 0.35,
              aspect: 1.6
            };
            lastPlan = null;
            settleTimer = 0;
            lastObserver = null; // Seconds of *playing* time (dt is 0 while paused) drive the disk plasma animation.
            playingSeconds = 0; // Ultra-quality still capture (Prompt 05), exposed for the control deck
            // and the QA harness. The runtime owns the passes; this only forwards.
            captureStill = function captureStill(request) {
              if (typeof runtime.captureStill !== "function") {
                return Promise.reject(new Error("This backend does not implement still capture yet."));
              }
              return runtime.captureStill(request);
            };
            window.__qgaKerrCapture = captureStill;
            publish = function publish(frame) {
              window.__qgaKerrRuntime = _objectSpread(_objectSpread({}, runtime.snapshot()), {}, {
                detail3d: effectiveDetail3d(),
                reducedMotion: ctx.motion() === 0,
                observer: frame.observer,
                lens: lastLens
              });
            };
            return _context.a(2, {
              autoRotate: false,
              // Accumulating scene: frames are owed until the progressive sample count reaches the quality budget, and
              // while the disk plasma animates (playing, motion on); after that the observatory is static.
              isAnimated: function isAnimated() {
                var snap = runtime.snapshot();
                return snap.converged !== true || snap.animated === true && ctx.playing();
              },
              renderCapabilities: {
                depth: false
              },
              applyRenderQuality: function applyRenderQuality(quality) {
                governorRef.current = quality.raySteps;
              },
              recoverable: function recoverable(error) {
                return runtime.recoverable ? runtime.recoverable(error) : false;
              },
              onScreenPick: function onScreenPick(ndc) {
                if (lastPlan) onFocusRef.current({
                  ndc: ndc
                });
              },
              update: function update(t, dt) {
                var renderer = ctx.renderer;
                if (!renderer) return;
                var cam = ctx.camera;
                lastLens = {
                  tanHalfFov: Math.tan(cam.fov * Math.PI / 360),
                  aspect: cam.aspect || 1
                };
                playingSeconds += dt;
                lastPlan = runtime.sync({
                  renderer: renderer,
                  camera: cam,
                  atlasState: _objectSpread(_objectSpread({}, stateRef.current), {}, {
                    bhMass: logRef.current,
                    bhSpin: spinRef.current
                  }),
                  detail3d: effectiveDetail3d(),
                  reducedMotion: ctx.motion() === 0,
                  governorRaySteps: governorRef.current,
                  time: playingSeconds,
                  softwareClamped: softwareClamped() !== null
                });
                runtime.setFocus(focusRef.current);
                publish(lastPlan);
                // Camera is the observer: write a settled orbit back to the shareable state.
                var o = lastPlan.observer;
                var incl = o.theta0 * 180 / Math.PI;
                if (!lastObserver || Math.abs(lastObserver.r0 - o.r0) > 1e-3 || Math.abs(lastObserver.theta0 - o.theta0) > 1e-4) {
                  lastObserver = o;
                  window.clearTimeout(settleTimer);
                  settleTimer = window.setTimeout(function () {
                    var cur = stateRef.current;
                    var nextIncl = Math.min(89, Math.max(3, Math.round(incl)));
                    var nextDist = Math.min(120, Math.max(12, Math.round(o.r0)));
                    if (Math.abs(cur.bhInclination - nextIncl) >= 1 || Math.abs(cur.bhObserverDistance - nextDist) >= 1) {
                      onCameraSettledRef.current({
                        bhInclination: nextIncl,
                        bhObserverDistance: nextDist
                      });
                    }
                  }, 450);
                }
              },
              dispose: function dispose() {
                window.clearTimeout(settleTimer);
                window.__qgaKerrRuntime = null;
                runtime.dispose();
              }
            });
        }
      }, _callee);
    }));
    return function build(_x) {
      return _ref12.apply(this, arguments);
    };
  }();
  var M = Math.pow(10, logM);
  var rs_km = window.QGA_PHYSICS.schwarzschildRadius(M);
  // Thermodynamic quantities are symmetric in the sign of a★; the legacy summary is spin-clamped to ≥ 0.
  var kerr = window.QGA_PHYSICS.kerrGeometry(Math.abs(aStar));
  var a = kerr.a;
  // Characteristic radii for the signed spin come straight from the validated science core;
  // "prograde" means orbiting in the +φ sense of the disk, so a★ < 0 is a retrograde disk.
  var sci = window.QGA_PHYSICS;
  var horizons = sci.kerrHorizonRadii(aStar);
  var rPlus = horizons.rPlus; // outer horizon
  var rIsco = sci.kerrIsco(aStar, {
    prograde: true
  });
  var rPhoton = sci.kerrPhotonSphere(aStar, {
    prograde: true
  });
  var exactGeometry = _objectSpread(_objectSpread({}, kerr), {}, {
    a: aStar,
    rPlus: rPlus,
    rMinus: horizons.rMinus,
    rIsco: rIsco,
    rIscoRetrograde: sci.kerrIsco(aStar, {
      prograde: false
    }),
    rPhoton: rPhoton,
    rPhotonRetrograde: sci.kerrPhotonSphere(aStar, {
      prograde: false
    })
  });
  var eased = useEasedKerr(exactGeometry);
  var settling = Math.abs(eased.a - aStar) > 1e-4;
  var tempFactor = kerr.temperatureFactor;
  var T_H = window.QGA_PHYSICS.hawkingTemperature(M, a);
  var S = window.QGA_PHYSICS.blackHoleEntropyAreaUnits(M, a);
  var t_ev = window.QGA_PHYSICS.blackHoleEvaporationTimeYears(M);
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame",
    id: "shot-section-bh"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-observatory-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-head-plate"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-head-ident"
  }, "KERR", /*#__PURE__*/React.createElement("span", null, "OBS")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Black Hole Observatory"), /*#__PURE__*/React.createElement("p", null, "Ray-traced Kerr geodesics read against exact Kerr coordinate radii."))), /*#__PURE__*/React.createElement("div", {
    className: "kerr-head-state"
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-effective"
  }, "Kerr null geodesics \xB7 thin disk \xB7 display-scaled colour"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-state-line"
  }, "M = ", sciNotation(M, 2), " M\u2609 \xB7 a\u2605 = ", aStar.toFixed(3), " \xB7 r\u208A = ", rPlus.toFixed(3), " GM/c\xB2"))), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "black hole mass",
    min: 0,
    max: 9,
    step: 0.05,
    value: logM,
    onChange: function onChange(v) {
      return setAtlasState({
        bhMass: v
      });
    },
    format: function format(v) {
      return sciNotation(Math.pow(10, v), 2) + " M☉";
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "spin a\u2605 (negative = retrograde disk)",
    min: -0.998,
    max: 0.998,
    step: 0.002,
    value: aStar,
    onChange: function onChange(v) {
      return setAtlasState({
        bhSpin: v
      });
    },
    format: function format(v) {
      return v.toFixed(3);
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "kerr-instrument-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    "aria-label": "Geometry layers"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Geometry"), [["horizon", "Horizon"], ["ergo", "Ergosphere"], ["photon", "Photon orbit"], ["isco", "ISCO"]].map(function (_ref14) {
    var _ref15 = _slicedToArray(_ref14, 2),
      key = _ref15[0],
      label = _ref15[1];
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      className: "kerr-chip" + (layers[key] ? " on" : ""),
      "aria-pressed": layers[key],
      onClick: function onClick() {
        return setLayers(function (current) {
          return _objectSpread(_objectSpread({}, current), {}, _defineProperty({}, key, !current[key]));
        });
      }
    }, label);
  })), /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    "aria-label": "Camera presets"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Camera"), [["edge", "Disk edge"], ["polar", "Polar"], ["photon", "Photon ring"], ["wide", "Wide field"]].map(function (_ref16) {
    var _ref17 = _slicedToArray(_ref16, 2),
      key = _ref17[0],
      label = _ref17[1];
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      className: "kerr-chip" + (cameraPreset === key ? " on" : ""),
      "aria-pressed": cameraPreset === key,
      onClick: function onClick() {
        var preset = KERR_CAMERA_PRESETS[key];
        setCameraPreset(key);
        setAtlasState({
          bhInclination: preset.inclination,
          bhObserverDistance: preset.distance
        });
        setCameraGoal(kerrCameraGoal(preset.inclination, preset.distance, preset.theta));
      }
    }, label);
  }))), /*#__PURE__*/React.createElement(Scene3D, {
    animated: true,
    height: 460,
    shotSpace: "bh-kerr",
    describe: {
      formulaId: "schwarzschild-radius"
    },
    aria: "Ray-traced Kerr black hole with a lensed accretion disk, photon ring and physical readouts. Click a feature to focus it.",
    initial: _objectSpread(_objectSpread({}, kerrCameraGoal(atlasState.bhInclination, atlasState.bhObserverDistance, 0.35)), {}, {
      fov: 40,
      minR: 12,
      maxR: 120
    }),
    cameraGoal: cameraGoal,
    overlay: /*#__PURE__*/React.createElement(KerrGeometryMap, {
      geometry: eased,
      exact: exactGeometry,
      layers: layers,
      open: mapOpen,
      settling: settling,
      motion: !prm,
      onToggle: function onToggle() {
        return setMapOpen(function (current) {
          return !current;
        });
      }
    }),
    build: build,
    deps: [atlasState.bhDiskModel === "page-thorne-turbulent", atlasState.seed],
    fallback: /*#__PURE__*/React.createElement(BlackHoleSim, null)
  }), /*#__PURE__*/React.createElement(KerrObservatoryControls, {
    state: atlasState,
    setState: setAtlasState,
    onCameraRequest: requestCamera,
    onFocusKind: function onFocusKind(kind) {
      return focusFeature(kind, null);
    },
    focusKind: (_focus$kind = focus === null || focus === void 0 ? void 0 : focus.kind) !== null && _focus$kind !== void 0 ? _focus$kind : null,
    onCapture: function onCapture(request) {
      if (!window.__qgaKerrCapture) throw new Error("The capture path is still starting; try again in a moment.");
      return window.__qgaKerrCapture(request);
    }
  }), /*#__PURE__*/React.createElement(KerrFocusPanel, {
    focus: focus,
    onClose: clearFocus
  }), /*#__PURE__*/React.createElement("div", {
    className: "kerr-deck"
  }, /*#__PURE__*/React.createElement("section", {
    className: "kerr-rgroup"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("h4", null, "Geometry"), /*#__PURE__*/React.createElement("span", null, "exact Kerr \xB7 Boyer\u2013Lindquist \xB7 GM/c\xB2 \xB7 prograde = disk orbit sense")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-rgrid"
  }, /*#__PURE__*/React.createElement(KerrReadout, {
    lead: true,
    label: "outer horizon r\u208A",
    value: rPlus.toFixed(3),
    unit: "GM/c\xB2",
    formulaTex: "r_+ = M + \\sqrt{M^2 - a^2}",
    subTex: "1 + \\sqrt{1 - " + a.toFixed(3) + "^2} = " + rPlus.toFixed(3)
  }), /*#__PURE__*/React.createElement(KerrReadout, {
    label: "ergosurface (equator)",
    value: kerr.rErgoEquator.toFixed(3),
    unit: "GM/c\xB2",
    formulaTex: "r_E(\\theta) = M + \\sqrt{M^2 - a^2\\cos^2\\theta}",
    subTex: "\\theta = 90^\\circ \\Rightarrow 1 + \\sqrt{1 - " + a.toFixed(3) + "^2 \\cdot 0} = " + kerr.rErgoEquator.toFixed(3)
  }), /*#__PURE__*/React.createElement(KerrReadout, {
    lead: true,
    label: "ISCO",
    unit: "GM/c\xB2",
    pair: [["prograde", rIsco.toFixed(3)], ["retrograde", exactGeometry.rIscoRetrograde.toFixed(3)]],
    formulaTex: "r_{\\rm isco} = M\\left[3 + Z_2 \\mp \\sqrt{(3 - Z_1)(3 + Z_1 + 2Z_2)}\\right]",
    subTex: "Z_1 = " + kerr.z1.toFixed(3) + ",\\; Z_2 = " + kerr.z2.toFixed(3) + " \\;\\Rightarrow\\; r_{\\rm pro} = " + rIsco.toFixed(3) + ",\\; r_{\\rm retro} = " + exactGeometry.rIscoRetrograde.toFixed(3) + (aStar < 0 ? " \\;\\cdot\\; a_\\star < 0\\text{: the } +\\varphi \\text{ disk is retrograde}" : "")
  }), /*#__PURE__*/React.createElement(KerrReadout, {
    label: "photon orbit",
    unit: "GM/c\xB2",
    pair: [["prograde", rPhoton.toFixed(3)], ["retrograde", exactGeometry.rPhotonRetrograde.toFixed(3)]],
    formulaTex: "r_{\\rm ph} = 2M\\left[1 + \\cos\\!\\left(\\tfrac{2}{3}\\arccos(\\mp a_\\star)\\right)\\right]",
    subTex: "2\\left[1 + \\cos\\!\\left(\\tfrac{2}{3}\\arccos(-" + aStar.toFixed(3) + ")\\right)\\right] = " + rPhoton.toFixed(3)
  }), /*#__PURE__*/React.createElement(KerrReadout, {
    label: "Schwarzschild radius r_s",
    value: sciNotation(rs_km),
    unit: "km",
    formulaTex: "r_s = 2GM/c^2",
    subTex: "2.95\\;\\mathrm{km} \\times " + kerrTexSci(M, 2) + " = " + kerrTexSci(rs_km) + "\\;\\mathrm{km}"
  }), /*#__PURE__*/React.createElement(KerrReadout, {
    label: "spin a\u2605",
    value: aStar.toFixed(3),
    formulaTex: "a_\\star = Jc/GM^2, \\;\\text{extremal at } |a_\\star| = 1",
    subTex: "\\text{clamped to } |a_\\star| \\le 0.998, \\; r_- = " + horizons.rMinus.toFixed(3) + "\\;\\mathrm{GM}/c^2"
  }))), /*#__PURE__*/React.createElement("section", {
    className: "kerr-rgroup"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("h4", null, "Thermodynamics"), /*#__PURE__*/React.createElement("span", null, "semiclassical \xB7 never observed")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-rgrid"
  }, /*#__PURE__*/React.createElement(KerrReadout, {
    lead: true,
    label: "Hawking temperature T_H",
    value: sciNotation(T_H),
    unit: "K",
    formulaTex: "T_H = \\dfrac{\\hbar\\kappa}{2\\pi c\\,k_B}",
    subTex: "\\dfrac{6.17\\times10^{-8}\\;\\mathrm{K}}{" + kerrTexSci(M, 2) + "} \\times " + tempFactor.toFixed(3) + " = " + kerrTexSci(T_H) + "\\;\\mathrm{K}"
  }), /*#__PURE__*/React.createElement(KerrReadout, {
    label: "T_H / T_Schw at this spin",
    value: tempFactor.toFixed(3),
    formulaTex: "\\dfrac{T_H}{T_{\\rm Schw}} = \\dfrac{\\kappa(a)}{\\kappa(0)} \\;\\to\\; 0 \\text{ at extremality}",
    subTex: "\\kappa = \\dfrac{" + rPlus.toFixed(3) + " - 1}{" + rPlus.toFixed(3) + "^2 + " + a.toFixed(3) + "^2} = " + kerr.surfaceGravity.toFixed(4)
  }), /*#__PURE__*/React.createElement(KerrReadout, {
    lead: true,
    label: "entropy S / k_B",
    value: sciNotation(S, 2),
    formulaTex: "S/k_B = \\dfrac{A c^3}{4G\\hbar}",
    subTex: "1.05\\times10^{77} \\times \\left(" + kerrTexSci(M, 2) + "\\right)^2 \\times " + (rPlus / 2).toFixed(3) + " = " + kerrTexSci(S, 2)
  }), /*#__PURE__*/React.createElement(KerrReadout, {
    label: "evaporation time",
    value: sciNotation(t_ev, 2),
    unit: "yr",
    formulaTex: "t_{\\rm ev} \\propto M^3 \\;\\;\\text{(order of magnitude)}",
    subTex: "2.1\\times10^{67}\\;\\mathrm{yr} \\times \\left(" + kerrTexSci(M, 2) + "\\right)^3 = " + kerrTexSci(t_ev, 2) + "\\;\\mathrm{yr}"
  })))), /*#__PURE__*/React.createElement(KerrFormulation, {
    geometry: kerr,
    massSolar: M,
    temperature: T_H,
    entropy: S
  }), /*#__PURE__*/React.createElement(KerrValidity, {
    geometry: kerr
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid-2",
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(HawkingSpectrumPlot, {
    logM: logM,
    tempFactor: tempFactor
  }), /*#__PURE__*/React.createElement(GreybodySpectrumPlot, null)), /*#__PURE__*/React.createElement(PageCurvePlot, null), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "bh-spin-geometry",
    status: "schematic"
  }, "Spin reshapes the geometry. The outer horizon ", /*#__PURE__*/React.createElement(Eq, {
    tex: "r_+ = M + \\sqrt{M^2 - a^2}"
  }), " shrinks as the hole spins up, the prograde ", /*#__PURE__*/React.createElement("strong", null, "ISCO"), " falls from 6 to 1 ", /*#__PURE__*/React.createElement(Eq, {
    tex: "GM/c^2"
  }), " as", /*#__PURE__*/React.createElement(Eq, {
    tex: "a_\\star\\!:0\\to1"
  }), " (Bardeen 1972) while retrograde orbits move outward \u2014 which is why prograde matter orbits closer and radiates more efficiently. The equatorial stationary-limit surface stays at ", /*#__PURE__*/React.createElement(Eq, {
    tex: "r=2GM/c^2"
  }), ", so spin opens the ergoregion between it and the horizon, and the surface gravity (hence Hawking temperature) falls to zero at extremality. Mass inverts the thermodynamics: doubling it doubles r_s, quadruples the entropy and ", /*#__PURE__*/React.createElement("em", null, "halves"), " the temperature \u2014 black holes have negative specific heat. The two plots show the thermal ", /*#__PURE__*/React.createElement("strong", null, "Hawking spectrum"), " and the", /*#__PURE__*/React.createElement("strong", null, " Page curve"), ", the entanglement entropy any unitary evaporation must follow. See the validity panel above for what is exact here and what is approximated."));
}
function BlackHoleSim() {
  var _useState17 = useState(1),
    _useState18 = _slicedToArray(_useState17, 2),
    logM = _useState18[0],
    setLogM = _useState18[1]; // log10(M / M_sun), 0..9
  var _useState19 = useState(true),
    _useState20 = _slicedToArray(_useState19, 2),
    overlay = _useState20[0],
    setOverlay = _useState20[1];
  var logMRef = useRef(logM);
  logMRef.current = logM;
  var ovRef = useRef(overlay);
  ovRef.current = overlay;
  var prm = usePRM();
  var sim = useSimLoop(function (ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    var cx = w / 2,
      cy = h / 2;
    var rs = Math.min(w, h) * 0.16; // screen-space horizon radius (fixed; physics in readouts)
    // lensed background grid: radial displacement r' = r + k/r (schematic lens map)
    var k = rs * rs * 1.35;
    ctx.lineWidth = 1;
    var warp = function warp(x, y) {
      var dx = x - cx,
        dy = y - cy,
        r = Math.hypot(dx, dy) + 1e-6;
      var rp = r + k / r;
      return [cx + dx / r * rp, cy + dy / r * rp];
    };
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-64", 0.13);
    var step = 36;
    for (var gx = -step * 14; gx <= w + step * 2; gx += step) {
      ctx.beginPath();
      var started = false;
      for (var gy = -step * 6; gy <= h + step * 6; gy += 8) {
        var _warp = warp(gx, gy),
          _warp2 = _slicedToArray(_warp, 2),
          px = _warp2[0],
          py = _warp2[1];
        if (Math.hypot(px - cx, py - cy) < rs * 1.4) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    for (var _gy = -step * 6; _gy <= h + step * 6; _gy += step) {
      ctx.beginPath();
      var _started = false;
      for (var _gx = -step * 6; _gx <= w + step * 6; _gx += 8) {
        var _warp3 = warp(_gx, _gy),
          _warp4 = _slicedToArray(_warp3, 2),
          _px = _warp4[0],
          _py = _warp4[1];
        if (Math.hypot(_px - cx, _py - cy) < rs * 1.4) {
          _started = false;
          continue;
        }
        if (!_started) {
          ctx.moveTo(_px, _py);
          _started = true;
        } else ctx.lineTo(_px, _py);
      }
      ctx.stroke();
    }
    // accretion disk (behind + front, doppler-asymmetric brightness)
    var drawDisk = function drawDisk(front) {
      for (var i = 0; i < 42; i++) {
        var a0 = i / 42 * Math.PI * 2 + (prm ? 0 : t * 0.35);
        var rr = rs * (1.7 + 0.5 * Math.sin(i * 2.7));
        var x = cx + Math.cos(a0) * rr * 1.55;
        var y = cy + Math.sin(a0) * rr * 0.4;
        var isFront = Math.sin(a0) > 0;
        if (isFront !== front) continue;
        var doppler = 0.45 + 0.55 * (1 + Math.cos(a0)) / 2; // brighter approaching side
        ctx.fillStyle = QGA_TOKENS.alpha("pigment-amber-86", (0.5 * doppler).toFixed(3));
        ctx.beginPath();
        ctx.arc(x, y, 1.6 + doppler * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    drawDisk(false);
    // photon ring glow
    var ringR = rs * 1.32;
    var rg = ctx.createRadialGradient(cx, cy, ringR * 0.86, cx, cy, ringR * 1.25);
    rg.addColorStop(0, QGA_TOKENS.alpha("pigment-amber-95", 0));
    rg.addColorStop(0.5, QGA_TOKENS.alpha("pigment-amber-93-c08", 0.55));
    rg.addColorStop(1, QGA_TOKENS.alpha("pigment-amber-93-c08", 0));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR * 1.3, 0, Math.PI * 2);
    ctx.fill();
    // shadow / horizon
    ctx.fillStyle = QGA_TOKENS.css("pigment-black");
    ctx.beginPath();
    ctx.arc(cx, cy, rs, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-amber-95", 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, rs, 0, Math.PI * 2);
    ctx.stroke();
    drawDisk(true);
    // annotations
    if (ovRef.current) {
      ctx.font = QGA_TOKENS.monoPx(10);
      ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-88", 0.75);
      ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-88", 0.35);
      ctx.beginPath();
      ctx.moveTo(cx + rs * 0.71, cy - rs * 0.71);
      ctx.lineTo(cx + rs * 1.7, cy - rs * 1.55);
      ctx.stroke();
      ctx.fillText("event horizon  r = r_s", cx + rs * 1.76, cy - rs * 1.55);
      ctx.beginPath();
      ctx.moveTo(cx - ringR * 0.8, cy - ringR * 0.62);
      ctx.lineTo(cx - ringR * 2.0, cy - ringR * 1.15);
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.fillText("photon-ring glow (lensed light)", cx - ringR * 2.04, cy - ringR * 1.15);
      ctx.textAlign = "left";
      // entropy-area tiling hint: dotted arc segments on horizon
      ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-79", 0.5);
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, rs * 0.999, -0.6, 0.9);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-79", 0.7);
      ctx.fillText("S ∝ horizon area / 4 l_P²", cx + rs * 0.75, cy + rs * 1.05);
    }
  }, [prm]);
  var M = Math.pow(10, logM);
  var rs_km = 2.95 * M;
  var T_H = 6.17e-8 / M;
  var S = 1.05e77 * M * M;
  var t_ev = window.QGA_PHYSICS.blackHoleEvaporationTimeYears(M);
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "black hole mass",
    min: 0,
    max: 9,
    step: 0.05,
    value: logM,
    onChange: setLogM,
    format: function format(v) {
      return sciNotation(Math.pow(10, v), 2) + " M☉";
    }
  }), /*#__PURE__*/React.createElement(Toggle, {
    label: "annotations",
    checked: overlay,
    onChange: setOverlay
  })), /*#__PURE__*/React.createElement("canvas", {
    ref: sim.canvasRef,
    className: "viz-canvas",
    style: {
      height: 360
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar viz-toolbar-bottom readout-grid",
    style: {
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "Schwarzschild radius r_s"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, sciNotation(rs_km), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "km"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "Hawking temperature T_H"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, sciNotation(T_H), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "K"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "Entropy S / k_B"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, sciNotation(S, 2))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "Evaporation time (order of magnitude)"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, sciNotation(t_ev, 2), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "yr")))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "bh-thermodynamics",
    status: "schematic"
  }, "Visual scale is fixed; the readouts carry the physics. Note the inversions: doubling the mass doubles r_s, quadruples the entropy, and ", /*#__PURE__*/React.createElement("em", null, "halves"), " the temperature \u2014 black holes have negative specific heat. A solar-mass black hole at 6\xD710\u207B\u2078 K is far colder than the cosmic microwave background and is currently absorbing more than it radiates."));
}
function HolographyViz() {
  return /*#__PURE__*/React.createElement(AdsLabSection, {
    compact: true
  });
}

/* ---------- Prompt 07: Hawking horizon lab (pair-emission picture) ---------- */
function HawkingComputeLab() {
  var _useQGAState3 = useQGAState(),
    _useQGAState4 = _slicedToArray(_useQGAState3, 2),
    state = _useQGAState4[0],
    setState = _useQGAState4[1];
  var massSolar = Math.pow(10, state.bhMass);
  var spin = state.bhSpin;
  var gain = state.hawkingLabAmplify;
  var lab = window.QGA_LABS && window.QGA_LABS.hawkingLabState({
    massSolar: massSolar,
    spin: spin,
    amplification: gain
  });
  var build = /*#__PURE__*/function () {
    var _ref18 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(ctx) {
      var LABS, _yield$LABS$loadHawki, createHawkingLabRuntime, runtime, mA, mKappa;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            LABS = window.QGA_LABS;
            if (LABS) {
              _context2.n = 1;
              break;
            }
            throw new Error("Compute-lab module unavailable");
          case 1:
            _context2.n = 2;
            return LABS.loadHawkingLab();
          case 2:
            _yield$LABS$loadHawki = _context2.v;
            createHawkingLabRuntime = _yield$LABS$loadHawki.createHawkingLabRuntime;
            ctx.scene.fog = new ctx.THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-11-c02"), 0.011);
            runtime = createHawkingLabRuntime({
              massSolar: massSolar,
              spin: spin,
              amplification: gain,
              seed: 42,
              camera: ctx.camera,
              engraved: ctx.engraved
            });
            ctx.scene.add(runtime.mesh);
            mA = Math.min(1, Math.abs(spin));
            mKappa = lab ? lab.temperatureFactor : 1;
            ctx.label("SCHEMATIC · pair-production picture — temperature and spectrum come from the shared semiclassical model", function () {
              return {
                x: -5.4,
                y: 3.95,
                z: 0
              };
            }, "s3d-strong");
            ctx.label("T(a★)/T(0) — surface gravity × temperature", function () {
              return {
                x: -5.0,
                y: 3.35,
                z: -3.4
              };
            }, "s3d-quiet");
            ctx.label("a★ = 0", function () {
              return {
                x: -5.0,
                y: -0.28,
                z: -3.4
              };
            }, "s3d-quiet");
            ctx.label("a★ = 1", function () {
              return {
                x: 5.0,
                y: -0.28,
                z: -3.4
              };
            }, "s3d-quiet");
            ctx.label("current a★", function () {
              return {
                x: -5.0 + mA * 10,
                y: 0.35 + mKappa * 2.55 + 0.42,
                z: -3.4
              };
            }, "s3d-quiet");
            ctx.label("horizon · photon sphere · ISCO", function () {
              return {
                x: 4.9,
                y: 0.14,
                z: 0.9
              };
            }, "s3d-quiet");
            return _context2.a(2, {
              update: function update(t) {
                runtime.sync({
                  time: t,
                  motion: ctx.motion() === 0 ? 0 : 1
                });
                window.__qgaHawkingLab = _objectSpread({
                  kind: runtime.kind
                }, runtime.stats());
              },
              prepare: function prepare(renderer) {
                return runtime.prepare(renderer);
              },
              compute: function compute(renderer, dt) {
                return runtime.compute(renderer, dt);
              },
              dispose: function dispose() {
                runtime.dispose();
                delete window.__qgaHawkingLab;
              },
              recoverable: function recoverable() {
                return false;
              }
            });
        }
      }, _callee2);
    }));
    return function build(_x2) {
      return _ref18.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar lab-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "display amplification",
    min: 1,
    max: 1000,
    step: 1,
    value: gain,
    onChange: function onChange(v) {
      return setState({
        hawkingLabAmplify: v
      });
    },
    format: function format(v) {
      return "×" + Math.round(v);
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "kerr-state-line lab-readout"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "T_H"
  }), " = ", lab ? lab.temperatureK.toExponential(2) : "—", " K \xB7 ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\kappa/\\kappa_0"
  }), " = ", lab ? lab.extremalFactor.toFixed(4) : "—", " \xB7 relative power ", lab ? lab.relativePower.toExponential(2) : "—", " \xB7 display rate \xD7", lab ? lab.displayGain : "—")), /*#__PURE__*/React.createElement(Scene3D, {
    animated: "motion",
    nodeKit: true,
    height: 420,
    aria: "Black hole horizon with deterministic Hawking pair emission: partners escape outward coloured by temperature while others fall in; emission fades as spin approaches extremal",
    initial: {
      radius: 11.5,
      theta: 0.55,
      phi: 1.08,
      minR: 4,
      maxR: 30,
      bloom: {
        strength: 0.9,
        radius: 0.5,
        threshold: 0.12
      }
    },
    build: build,
    deps: [massSolar, spin, gain],
    fallback: /*#__PURE__*/React.createElement("div", {
      className: "lab-fallback"
    }, "The 3-D Hawking lab needs WebGL; the temperature readouts above are computed without it.")
  }), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "bh-hawking-lab",
    status: "schematic"
  }, "The escaping/falling sprite pairs are the textbook ", /*#__PURE__*/React.createElement("strong", null, "pair-production picture"), " of Hawking radiation \u2014 a heuristic, not the derivation (the real calculation is Bogoliubov mixing of modes on the collapsing background). What ", /*#__PURE__*/React.createElement("em", null, "is"), " physical: the colour tracks the shared Hawking temperature", /*#__PURE__*/React.createElement(Eq, {
    tex: "T_H=\\frac{\\hbar c^3}{8\\pi G M k_B}\\,\\frac{2\\sqrt{1-a_\\star^2}}{1+\\sqrt{1-a_\\star^2}}"
  }), ", the visible rate tracks the Stefan\u2013Boltzmann power ", /*#__PURE__*/React.createElement(Eq, {
    tex: "P\\propto A\\,T^4"
  }), " times the", /*#__PURE__*/React.createElement("strong", null, " display amplification"), " (a real 10 M\u2609 hole radiates ~10\u207B\xB3\u2070 W \u2014 nothing would be visible without it, and the multiplier is always shown), and the sample energies come from the Planckian shape by seeded rejection sampling. The glowing rail arcing over the scene traces", /*#__PURE__*/React.createElement(Eq, {
    tex: "T(a_\\star)/T(0)"
  }), " with a marker that slides to the current spin; the faint equatorial rings mark the horizon, the photon sphere (", /*#__PURE__*/React.createElement(Eq, {
    tex: "1.5\\,r_+"
  }), ") and the ISCO (", /*#__PURE__*/React.createElement(Eq, {
    tex: "3\\,r_+"
  }), "). Push the observatory spin slider toward a\u2605 = \xB11: the marker slides down the rail, the shared surface-gravity factor ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\kappa/\\kappa_0 \\to 0"
  }), " and the field visibly empties \u2014 an extremal hole does not radiate."));
}
function ModuleBH(_ref19) {
  var go = _ref19.go;
  return /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement(ModuleHeader, {
    num: "07",
    kicker: "The theoretical laboratory",
    title: "Black Holes, Entropy, and Holography",
    lede: "Black holes are where general relativity, quantum field theory, and thermodynamics collide in a single object. They are the closest thing quantum gravity has to an experimental apparatus \u2014 even if, so far, only a theoretical one.",
    target: ".kerr-shadow-lab"
  }), /*#__PURE__*/React.createElement(Section, {
    title: "Thermodynamics simulator"
  }, /*#__PURE__*/React.createElement("p", null, "Classically, a black hole is characterized by mass, charge, and spin alone. Bekenstein argued it must carry entropy proportional to horizon area; Hawking's 1975 calculation of quantum fields near the horizon confirmed the thermodynamic picture by assigning a temperature. Adjust the mass and observe how all quantities scale together."), /*#__PURE__*/React.createElement(BlackHoleLab3D, null), /*#__PURE__*/React.createElement("div", {
    className: "formula-grid",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Schwarzschild radius",
    status: "established",
    formulaId: "schwarzschild-radius",
    symbols: [{
      s: "M",
      d: "Black hole mass."
    }, {
      s: "r_s",
      d: "Horizon radius for a non-rotating, uncharged black hole: $\\approx 3$ km per solar mass."
    }],
    meaning: "The point of no return. Within $r_s$, all future-directed paths point inward; escape would require exceeding the speed of light.",
    limits: "Idealized static, spherically symmetric solution; astrophysical black holes rotate (Kerr metric)."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Hawking temperature",
    status: "established",
    formulaId: "bh-hawking-temperature",
    symbols: [{
      s: "T_H",
      d: "Temperature of the thermal radiation seen by a distant observer."
    }, {
      s: "M^{-1}",
      d: "Inverse mass dependence: small black holes are hot, large ones are cold — hence negative specific heat."
    }],
    meaning: "Derived from quantum field theory on the curved Schwarzschild background \u2014 a semiclassical result combining \u0127, G, and c, widely regarded as the most trustworthy landmark in quantum gravity.",
    limits: "A theoretical prediction: for astrophysical masses $T_H$ is unobservably small, and Hawking radiation has never been directly detected."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Bekenstein\u2013Hawking entropy",
    status: "established",
    formulaId: "bh-entropy-spaced",
    symbols: [{
      s: "A",
      d: "Horizon area, $A=4\\pi r_s^2$ for Schwarzschild."
    }, {
      s: "A / 4 l_P^2",
      d: "One quarter of the horizon area counted in Planck-area units — about 10⁷⁷ for a solar-mass black hole."
    }],
    meaning: "Entropy proportional to area, not volume. Taken at face value, the information capacity of a region is bounded by its surface \u2014 the seed of the holographic principle.",
    limits: "The microstates being counted remain unidentified in general; candidate countings exist in string theory and LQG for special cases."
  })), /*#__PURE__*/React.createElement("div", {
    className: "derivation-grid"
  }, /*#__PURE__*/React.createElement(DerivationStepper, {
    derivationId: "derivation-schwarzschild-radius"
  }), /*#__PURE__*/React.createElement(DerivationStepper, {
    derivationId: "derivation-page-time"
  }))), /*#__PURE__*/React.createElement(Section, {
    title: "Hawking horizon lab"
  }, /*#__PURE__*/React.createElement("p", null, "The simulator above gives the numbers; this lab makes the emission ", /*#__PURE__*/React.createElement("em", null, "visible"), ". A deterministic pair-production field orbits the horizon \u2014 partners escape outward, coloured by the Hawking temperature, while their partners fall in. The mass and spin sliders are the observatory's own, so the geometry, temperature and emission you see here are the same shared functions the readouts use. The rate you see is a disclosed display amplification of the true (absurdly tiny) power \u2014 and as the observatory spin approaches extremal, the emission drains away to nothing."), /*#__PURE__*/React.createElement(HawkingComputeLab, null)), /*#__PURE__*/React.createElement(Section, {
    title: "The information paradox"
  }, /*#__PURE__*/React.createElement("p", null, "Hawking radiation appears exactly thermal \u2014 independent of what formed the black hole. If the hole evaporates completely, the final state seems to carry no memory of the initial one, violating quantum unitarity. Four decades of debate sharpened this into the field's central thought experiment. The modern consensus, driven by holography and by the 2019 replica-wormhole calculations of the Page curve, leans toward information being preserved \u2014 but ", /*#__PURE__*/React.createElement("em", null, "how"), " it escapes, and what an infalling observer experiences, remain genuinely open.")), /*#__PURE__*/React.createElement(Section, {
    title: "The shadow, measured"
  }, /*#__PURE__*/React.createElement("p", null, "A black hole casts no light and emits almost none; what the telescopes see is a silhouette. The boundary of that silhouette is the set of photon orbits that skim the horizon forever, and it can be computed exactly. Move the spin and watch the circle deform, then compare the size you get with the two rings the Event Horizon Telescope has actually measured."), /*#__PURE__*/React.createElement(KerrShadowLab, null), /*#__PURE__*/React.createElement("div", {
    className: "derivation-grid"
  }, /*#__PURE__*/React.createElement(DerivationStepper, {
    derivationId: "derivation-shadow-radius"
  }))), /*#__PURE__*/React.createElement(Section, {
    title: "Holography: boundary and bulk"
  }, /*#__PURE__*/React.createElement(HolographyViz, null)), /*#__PURE__*/React.createElement(Misconception, {
    title: "The pair-production picture of Hawking radiation is heuristic."
  }, "The cartoon of 'one particle falling in while its partner escapes' does not appear in the derivation, which analyzes field modes in curved spacetime. The picture is a useful mnemonic \u2014 and misleading if taken literally, e.g. it wrongly suggests the radiation originates exactly at the horizon point."), /*#__PURE__*/React.createElement(Misconception, {
    title: "Holography does not mean the universe is a projection."
  }, "The holographic principle is a statement about information capacity scaling with area, made precise only in special settings (AdS/CFT). It does not assert that the world is an illusion, a simulation, or a literal hologram in the optical sense."), /*#__PURE__*/React.createElement(ConceptBridge, {
    id: "bh-exp",
    go: go
  }));
}
window.ModuleBH = ModuleBH;