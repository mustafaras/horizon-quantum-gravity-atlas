/* Compiled from js/labs/lattice-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
// lattice-lab.jsx — the field laboratory of the QFT module (S14): a classical phi^4 field on a 2+1D periodic lattice, evolved on the GPU.
// The science is js/science/lattice-field.mjs (the CPU reference the GPU kernels are compared with), the kernels are
// js/visualizations/qft/lattice-gpu.mjs and the scene js/visualizations/qft/lattice-scene.mjs (window.QGA_QFT_LATTICE); this file holds the controls,
// the readouts and the formula card. Without WebGL the one-dimensional lab (field-lab.jsx) runs the same physics on the CPU.

var LT_PRESETS = ["vacuum", "packets", "kink"];
var LT_READOUT_MS = 300;

/* ω(k) for the lab's mass (the mass gap made visible); a negative m² has no real dispersion, so the plot shows m = 0. */
function DispersionPlot(_ref) {
  var mass = _ref.mass;
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.qft.dispersionSpec({
      mass: mass
    });
  }, [mass]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }));
}

/* The readouts live in their own component: a refresh every 300 ms must not rebuild the stage. */
function LatticeReadouts(_ref2) {
  var control = _ref2.control;
  var _useState = useState(null),
    _useState2 = _slicedToArray(_useState, 2),
    stats = _useState2[0],
    setStats = _useState2[1];
  useEffect(function () {
    var id = setInterval(function () {
      return setStats(control.stats ? _objectSpread({}, control.stats) : null);
    }, LT_READOUT_MS);
    return function () {
      return clearInterval(id);
    };
  }, [control]);
  var drift = stats && Number.isFinite(stats.drift) ? stats.drift : null;
  return /*#__PURE__*/React.createElement("div", {
    className: "lt-readouts",
    role: "group",
    "aria-label": "Lattice readouts"
  }, stats && stats.software ? /*#__PURE__*/React.createElement("p", {
    className: "lt-note",
    role: "status"
  }, "This device draws in software, which needs seconds per frame of the lattice: it rests until Play, Step or a click, and the GPU readouts are taken while it rests.") : null, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "simulated time ", /*#__PURE__*/React.createElement(Eq, {
    tex: "t"
  })), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, stats ? stats.time.toFixed(1) : "—")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "energy above the vacuum ", /*#__PURE__*/React.createElement(Eq, {
    tex: "E"
  })), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, stats && Number.isFinite(stats.energy) ? Math.abs(stats.energy) < 1e4 ? stats.energy.toPrecision(4) : /*#__PURE__*/React.createElement(Eq, {
    tex: sciTex(stats.energy, 3)
  }) : "—")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "change since the last edit ", /*#__PURE__*/React.createElement(Eq, {
    tex: "|\\Delta E|/E_0"
  })), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, drift === null ? "—" : drift < 1e-9 ? /*#__PURE__*/React.createElement(Eq, {
    tex: "<10^{-9}"
  }) : /*#__PURE__*/React.createElement(Eq, {
    tex: sciTex(drift, 1)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "step ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\Delta t"
  }), " and steps per frame"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, stats ? "".concat(stats.dt.toFixed(3), " \xB7 ").concat(stats.stepsPerFrame) : "—")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "lattice and backend"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, stats ? "".concat(stats.n, " \xD7 ").concat(stats.n, " \xB7 ").concat(stats.backend) : "—")));
}
function LatticeLab(_ref3) {
  var go = _ref3.go;
  var L = window.QGA_QFT_LATTICE;
  var _useQGAState = useQGAState(),
    _useQGAState2 = _slicedToArray(_useQGAState, 1),
    atlas = _useQGAState2[0];
  var seed = atlas.seed;
  var reducedMotion = usePRM();
  var _useState3 = useState("packets"),
    _useState4 = _slicedToArray(_useState3, 2),
    presetId = _useState4[0],
    setPresetId = _useState4[1];
  var _useState5 = useState(L.presets.packets.mass2),
    _useState6 = _slicedToArray(_useState5, 2),
    mass2 = _useState6[0],
    setMass2 = _useState6[1];
  var _useState7 = useState(L.presets.packets.lambda),
    _useState8 = _slicedToArray(_useState7, 2),
    lambda = _useState8[0],
    setLambda = _useState8[1];
  var _useState9 = useState(!reducedMotion),
    _useState0 = _slicedToArray(_useState9, 2),
    running = _useState0[0],
    setRunning = _useState0[1];
  var _useState1 = useState(0),
    _useState10 = _slicedToArray(_useState1, 2),
    nonce = _useState10[0],
    setNonce = _useState10[1];
  var _useState11 = useState(0),
    _useState12 = _slicedToArray(_useState11, 2),
    bump = _useState12[0],
    setBump = _useState12[1];
  var control = useRef({
    running: !reducedMotion,
    mass2: mass2,
    lambda: lambda,
    stepRequests: 0,
    contour: false,
    stats: null
  }).current;
  control.mass2 = mass2;
  control.lambda = lambda;
  control.contour = L.presets[presetId].contour;
  var safe = L.safeCouplings(mass2, lambda);
  var narrow = window.matchMedia("(max-width: 640px)").matches; // a narrow stage needs the camera further back to show the whole lattice

  var choose = function choose(id) {
    setPresetId(id);
    setMass2(L.presets[id].mass2);
    setLambda(L.presets[id].lambda);
  };
  var toggleRunning = function toggleRunning() {
    control.running = !control.running;
    setRunning(control.running);
    setBump(function (n) {
      return n + 1;
    });
  };
  var stepOnce = function stepOnce() {
    control.stepRequests += 1;
    setBump(function (n) {
      return n + 1;
    });
  };
  var build = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ctx) {
      var _yield$L$loadScene, buildLatticeScene, built;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            _context.n = 1;
            return L.loadScene();
          case 1:
            _yield$L$loadScene = _context.v;
            buildLatticeScene = _yield$L$loadScene.buildLatticeScene;
            _context.n = 2;
            return buildLatticeScene(ctx, {
              control: control,
              presetId: presetId,
              seed: seed
            });
          case 2:
            built = _context.v;
            setRunning(control.running); // the scene rests under reduced motion until Play, Step or a click
            return _context.a(2, built);
        }
      }, _callee);
    }));
    return function build(_x) {
      return _ref4.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame lt-lab",
    id: "shot-section-qft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar lt-bar",
    role: "group",
    "aria-label": "Lattice lab controls"
  }, LT_PRESETS.map(function (id) {
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      type: "button",
      className: "btn lt-btn" + (presetId === id ? " on" : ""),
      "aria-pressed": presetId === id,
      onClick: function onClick() {
        return choose(id);
      }
    }, L.presets[id].label);
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn lt-btn" + (running ? " on" : ""),
    "aria-pressed": running,
    onClick: toggleRunning
  }, running ? "Pause" : "Play"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn lt-btn",
    onClick: stepOnce
  }, "Step"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn lt-btn",
    onClick: function onClick() {
      return setNonce(function (n) {
        return n + 1;
      });
    }
  }, "Reset field")), /*#__PURE__*/React.createElement(Scene3D, {
    animated: false,
    nodeKit: true,
    height: 460,
    shotSpace: "qft-field",
    invalidateKey: "".concat(presetId, "|").concat(mass2, "|").concat(lambda, "|").concat(running, "|").concat(bump),
    aria: "Three-dimensional scalar field on a periodic lattice: a height field coloured by energy density; click to kick the field",
    initial: {
      radius: narrow ? 27 : 18.5,
      theta: 0.5,
      phi: 1.02,
      minR: 8,
      maxR: 40,
      target: [0, 0.2, 0.4]
    },
    build: build,
    deps: [presetId, seed, nonce],
    fallback: /*#__PURE__*/React.createElement(FieldLab, null)
  }), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar lt-bar lt-controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lt-sliders"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "mass squared",
    min: L.view.mass2Range[0],
    max: L.view.mass2Range[1],
    step: 0.05,
    value: mass2,
    onChange: setMass2,
    format: function format(v) {
      return v.toFixed(2);
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "quartic coupling",
    min: L.view.lambdaRange[0],
    max: L.view.lambdaRange[1],
    step: 0.05,
    value: lambda,
    onChange: setLambda,
    format: function format(v) {
      return v.toFixed(2);
    }
  }))), safe.lambda !== lambda ? /*#__PURE__*/React.createElement("p", {
    className: "lt-note",
    role: "status"
  }, "With ", /*#__PURE__*/React.createElement(Eq, {
    tex: "m^2<0"
  }), " the quartic term must keep the potential bounded below: the simulation runs with ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\lambda=" + safe.lambda.toFixed(2)
  }), ".") : null, /*#__PURE__*/React.createElement(LatticeReadouts, {
    control: control
  }), /*#__PURE__*/React.createElement(DispersionPlot, {
    mass: Math.sqrt(Math.max(mass2, 0))
  }), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "qft-lattice-phi4",
    status: "effective"
  }, /*#__PURE__*/React.createElement(RichText, {
    text: L.presets[presetId].hint.charAt(0).toUpperCase() + L.presets[presetId].hint.slice(1)
  }), ".", " ", "The surface is a real scalar field ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\phi"
  }), " on a periodic lattice of spacing ", /*#__PURE__*/React.createElement(Eq, {
    tex: "a=0.25"
  }), " (", /*#__PURE__*/React.createElement(Eq, {
    tex: "256\\times256"
  }), " sites, ", /*#__PURE__*/React.createElement(Eq, {
    tex: "128\\times128"
  }), " at low detail or on a software rasterizer), integrated on the GPU by the symplectic leapfrog from the equation ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\ddot\\phi=\\nabla^{2}\\phi-m^{2}\\phi-\\tfrac{\\lambda}{6}\\phi^{3}"
  }), ", whose energy ", /*#__PURE__*/React.createElement(Eq, {
    tex: "E"
  }), " is conserved to the order of the step (the readout shows its change since the last edit of a coupling or a click). The colour is the energy density above the vacuum; the four terms of the card below can be painted over it. This is a ", /*#__PURE__*/React.createElement("strong", null, "classical"), " field: the vacuum sample is the Wigner sample of the free quantum ground state, and nothing here is a quantum computation. The simulated time of a frame is fixed, so the physics does not depend on the frame rate."), /*#__PURE__*/React.createElement("div", {
    className: "lt-cards"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Hamiltonian density of the lattice field",
    formulaId: "qft-phi4-hamiltonian",
    status: "established",
    symbols: [{
      s: "\\pi",
      d: "Momentum density conjugate to the field, $\\partial_t\\phi$; the lattice stores it at half steps and the readout synchronises it."
    }, {
      s: "(\\nabla\\phi)^2",
      d: "Squared forward-difference gradient of the field in lattice units, $\\sum_i(\\phi_{x+e_i}-\\phi_x)^2/a^2$."
    }, {
      s: "m^2",
      d: "Mass squared: positive gives one vacuum at $\\phi=0$, negative gives two vacua at $\\pm v$ with $v=\\sqrt{6|m^2|/\\lambda}$ and kinks between them."
    }, {
      s: "\\lambda",
      d: "Quartic self-coupling; it makes the waves interact, and with $\\lambda=0$ two packets pass through each other."
    }],
    meaning: "The energy stored at one site: its motion, its bending against the neighbours, its mass and its self-interaction. Click a term of the equation to paint it over the lattice; the colours are computed on the GPU from the same expression.",
    limits: "Classical field theory on a lattice with $a=0.25$ and a step of 0.05 to 0.1: the leapfrog's energy oscillates at order $(\\omega_{\\max}\\Delta t)^2$ and has no secular drift. Not the interacting quantum vacuum."
  })));
}