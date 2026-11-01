/* Compiled from js/labs/spectral-dimension-chart.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// S23: the one quantitative cross-program comparison the field has.
function SpectralDimensionChart() {
  var D = window.QGA_SPECTRAL_DIMENSION;
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.spectralDimension.spectralDimensionSpec();
  }, []);
  var summary = D.convergenceSummary();
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame spectral-chart",
    id: "approaches-spectral-dimension"
  }, /*#__PURE__*/React.createElement("div", {
    className: "spectral-intro"
  }, /*#__PURE__*/React.createElement("span", {
    className: "constraint-kicker"
  }, "01 / THE ONLY QUANTITATIVE COMPARISON"), /*#__PURE__*/React.createElement("h3", null, "How many dimensions does a random walk see?"), /*#__PURE__*/React.createElement("p", null, "A diffusion process measures the dimension it moves in: the return probability falls as", /*#__PURE__*/React.createElement(Eq, {
    tex: "P(\\sigma)\\propto\\sigma^{-d_s/2}"
  }), ", so ", /*#__PURE__*/React.createElement(Eq, {
    tex: "d_s"
  }), " is the number of dimensions the walk actually explores at the scale it has reached. Five programs predict the same shape \u2014 four at large scales, two at short ones \u2014 and this is the one place where the field can compare them on one axis.")), /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }), /*#__PURE__*/React.createElement("div", {
    className: "spectral-detail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "spectral-list",
    role: "list"
  }, D.SPECTRAL_DIMENSION.map(function (entry, i) {
    var _entry$source$referen, _entry$source$referen2;
    return /*#__PURE__*/React.createElement("div", {
      key: entry.id,
      className: "spectral-row",
      role: "listitem"
    }, /*#__PURE__*/React.createElement("span", {
      className: "spectral-swatch",
      style: {
        background: "var(--cat-".concat(i + 1, ")")
      },
      "aria-hidden": "true"
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, entry.label), /*#__PURE__*/React.createElement("span", {
      className: "spectral-values",
      title: "infrared to ultraviolet"
    }, entry.ir, " \u2192 ", entry.uv, " ", /*#__PURE__*/React.createElement("small", null, "IR\u2192UV")), /*#__PURE__*/React.createElement("span", {
      className: 'spectral-kind' + (entry.kind === 'measured' ? ' measured' : '')
    }, entry.kind === 'measured' ? 'measured on the theory' : 'computed estimate'), /*#__PURE__*/React.createElement("p", {
      className: "spectral-note"
    }, entry.note), /*#__PURE__*/React.createElement("a", {
      href: (_entry$source$referen = (_entry$source$referen2 = entry.source.reference.match(/https:\/\/[^\s,;]+/)) === null || _entry$source$referen2 === void 0 ? void 0 : _entry$source$referen2[0]) !== null && _entry$source$referen !== void 0 ? _entry$source$referen : '#',
      target: "_blank",
      rel: "noreferrer"
    }, entry.source.reference.split(',')[0], " \u2197")));
  })), /*#__PURE__*/React.createElement("p", {
    className: "spectral-warning"
  }, /*#__PURE__*/React.createElement("strong", null, "Read this as a shape, not a measurement."), " ", summary.count, " of ", summary.total, " programs run from about 4 toward about 2, but each defines ", /*#__PURE__*/React.createElement(Eq, {
    tex: "d_s"
  }), " differently \u2014 a lattice diffusion measurement, a functional renormalisation-group anomalous dimension, a semiclassical spin-foam estimate and an anisotropic-scaling exponent are not interchangeable. The scale axis is schematic because no program publishes its crossover length.")), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "approaches-spectral-dimension",
    status: "effective"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "d_s"
  }), " collected from five programs and read against Carlip's review. Only the 4D CDT entry is a diffusion measured on the theory's own configurations; the rest are analytic or semi-analytic estimates, and they are drawn dashed to say so. The shared 4 \u2192 2 shape is a qualitative agreement, not a measurement of a common theory, and no experiment measures ", /*#__PURE__*/React.createElement(Eq, {
    tex: "d_s"
  }), " at either end."));
}

// S23: the CDTs themselves — a triangulated cylinder with the diffusion painted on it.
function CdtLab() {
  var C = window.QGA_CDT;
  var reduced = usePRM();
  var _useState = useState(24),
    _useState2 = _slicedToArray(_useState, 2),
    slices = _useState2[0],
    setSlices = _useState2[1];
  var _useState3 = useState(8),
    _useState4 = _slicedToArray(_useState3, 2),
    targetVolume = _useState4[0],
    setTargetVolume = _useState4[1];
  var _useState5 = useState(42),
    _useState6 = _slicedToArray(_useState5, 2),
    seed = _useState6[0],
    setSeed = _useState6[1];
  var run = useMemo(function () {
    return C.thermalize({
      slices: slices,
      targetVolume: targetVolume,
      seed: seed,
      sweeps: 240
    });
  }, [slices, targetVolume, seed]);
  var graph = useMemo(function () {
    return C.dualNeighbours(run.profile);
  }, [run]);
  // The cylinder's own dual graph is degree-irregular whenever neighbouring slices differ in volume, so its d_s
  // drifts with the profile. The honeycomb — the dual of a *flat* triangulation — is the clean control that shows
  // the estimator reading two dimensions, and it is what the readout quotes.
  var flat = useMemo(function () {
    return C.spectralDimensionOnFlat({
      width: 24,
      height: 24,
      walkers: 1200,
      seed: seed
    });
  }, [seed]);
  var dsMean = flat.mean;
  var state = useRef({
    profile: run.profile,
    seed: seed
  });
  state.current = {
    profile: run.profile,
    seed: seed
  };
  var build = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ctx) {
      var _yield$window$QGA_LAB, createCdtRuntime, runtime, chip, still;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            _context.n = 1;
            return window.QGA_LABS.loadCdt();
          case 1:
            _yield$window$QGA_LAB = _context.v;
            createCdtRuntime = _yield$window$QGA_LAB.createCdtRuntime;
            runtime = createCdtRuntime(_objectSpread(_objectSpread({}, state.current), {}, {
              engraved: ctx.engraved
            }));
            ctx.scene.add(runtime.group);
            if (typeof ctx.mountOverlay === "function" && globalThis.document) {
              chip = globalThis.document.createElement("div");
              chip.className = "s3d-label s3d-strong cdt-status";
              chip.textContent = "CONJECTURAL · 2D CDT cylinder";
              ctx.mountOverlay(chip);
            }
            window.__qgaCdt = runtime.stats();
            still = reduced;
            if (still) runtime.completeReveal();
            return _context.a(2, {
              isAnimated: function isAnimated() {
                return !still;
              },
              update: function update(t) {
                if (!still && runtime.tick(t)) ctx.invalidate();
                window.__qgaCdt = runtime.stats();
              },
              dispose: function dispose() {
                runtime.dispose();
                delete window.__qgaCdt;
              }
            });
        }
      }, _callee);
    }));
    return function build(_x) {
      return _ref.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame cdt-lab",
    id: "approaches-cdt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "time slices",
    min: 8,
    max: 48,
    step: 4,
    value: slices,
    onChange: setSlices,
    format: function format(v) {
      return String(v);
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "triangles per slice",
    min: 3,
    max: 16,
    step: 1,
    value: targetVolume,
    onChange: setTargetVolume,
    format: function format(v) {
      return String(v);
    }
  }), /*#__PURE__*/React.createElement("label", {
    className: "cdt-seed"
  }, "seed", /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 1,
    max: 99,
    step: 1,
    value: seed,
    onChange: function onChange(e) {
      return setSeed(Number(e.target.value));
    },
    "aria-label": "cdt seed"
  }), /*#__PURE__*/React.createElement("strong", null, seed))), /*#__PURE__*/React.createElement(Scene3D, {
    animated: "motion",
    nodeKit: true,
    height: 420,
    aria: "A triangulated cylinder of two-dimensional causal dynamical triangulations: horizontal rings are time slices, and the triangles are coloured by how much the diffusion has visited them.",
    initial: {
      radius: 15,
      theta: 0.5,
      phi: 1.25,
      target: [0, 0, 0],
      minR: 8,
      maxR: 34
    },
    build: build,
    deps: [slices, targetVolume, seed, reduced],
    fallback: /*#__PURE__*/React.createElement("div", {
      className: "lab-fallback"
    }, "The cylinder needs WebGL. The profile and the spectral dimension below are still computed.")
  }), /*#__PURE__*/React.createElement("div", {
    className: "readout-grid cdt-readouts",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "volume per slice"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, run.meanVolume.toFixed(2), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "triangles")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "target ", targetVolume, "; spread ", run.spreadVolume.toFixed(2), ", range ", run.minVolume, "\u2013", run.maxVolume)), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "triangulation"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, run.triangles, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "triangles")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "fixed volume: the pair moves conserve N\u2082 exactly; dual degrees ", Object.entries(graph.degreeHistogram).map(function (_ref2) {
    var _ref3 = _slicedToArray(_ref2, 2),
      d = _ref3[0],
      n = _ref3[1];
    return "".concat(n, "\xD7").concat(d);
  }).join(', '))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "sweeps accepted"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, run.accepted, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "of ", run.proposed)), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "Metropolis with an explicit exp(\u2212\u0394S) at \u03BB = ", run.lambda)), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "measured d_s"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, Number.isFinite(dsMean) ? dsMean.toFixed(2) : '—', /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "\u03C3 3\u20138")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "on the flat honeycomb control, 1200 walkers; the cylinder's own dual is degree-irregular"))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "approaches-cdt",
    status: "conjectural"
  }, "Two-dimensional CDT: a cylinder of time slices, relaxed by volume-conserving Metropolis moves. Each ring is a slice; the triangles are coloured by the return probability of the diffusion that measures", /*#__PURE__*/React.createElement(Eq, {
    tex: "d_s = -2\\,d\\ln P/d\\ln\\sigma"
  }), ". The simulation is exact arithmetic and the estimator is tested against a flat triangulation, where it returns ", /*#__PURE__*/React.createElement(Eq, {
    tex: "d_s = 2"
  }), "; CDT as a theory of quantum gravity is conjectural, and two dimensions reproduce the method, not the four-dimensional result."));
}

// S23: the free open bosonic string, level by level.
function StringSpectrumLab() {
  var S = window.QGA_STRING;
  var _useState7 = useState(6),
    _useState8 = _slicedToArray(_useState7, 2),
    maxLevel = _useState8[0],
    setMaxLevel = _useState8[1];
  var rows = useMemo(function () {
    return S.spectrumRows(maxLevel);
  }, [maxLevel]);
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.stringSpectrum.stringSpectrumSpec(maxLevel);
  }, [maxLevel]);
  var steps = useMemo(function () {
    return S.criticalDimensionSteps();
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame string-lab",
    id: "approaches-string-spectrum"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "max level N",
    min: 2,
    max: 8,
    step: 1,
    value: maxLevel,
    onChange: setMaxLevel,
    format: function format(v) {
      return String(v);
    }
  })), /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }), /*#__PURE__*/React.createElement("div", {
    className: "string-steps",
    role: "list",
    "aria-label": "The critical-dimension derivation"
  }, steps.map(function (step, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: step.id,
      className: "string-step",
      role: "listitem"
    }, /*#__PURE__*/React.createElement("span", {
      className: "string-step-num",
      "aria-hidden": "true"
    }, i + 1), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", null, step.statement), /*#__PURE__*/React.createElement(Eq, {
      tex: step.tex
    })));
  })), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "approaches-string-spectrum",
    status: "established"
  }, "The free open bosonic string. The mass formula ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\alpha'M^2 = N - 1"
  }), " is exact, and the level degeneracies are the coefficients of ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\prod_{n\\ge1}(1-q^n)^{-24}"
  }), " \u2014 twenty-four transverse oscillators supplying ", /*#__PURE__*/React.createElement(Eq, {
    tex: "N"
  }), " units of level. The ground state at ", /*#__PURE__*/React.createElement(Eq, {
    tex: "N=0"
  }), " has negative mass squared: the tachyon is a property of the bosonic theory, not an artefact, and it is why the superstring replaces it. The five steps below derive ", /*#__PURE__*/React.createElement(Eq, {
    tex: "D=26"
  }), " from the normal-ordering constant."));
}