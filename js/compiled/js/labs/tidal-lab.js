/* Compiled from js/labs/tidal-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
// S20: interactive, properly labelled test-particle tidal deformation.
function TidalLab() {
  var T = window.QGA_GR.tidal;
  var reduced = usePRM();
  var _useState = useState(10),
    _useState2 = _slicedToArray(_useState, 2),
    solar = _useState2[0],
    setSolar = _useState2[1];
  var _useState3 = useState(0),
    _useState4 = _slicedToArray(_useState3, 2),
    index = _useState4[0],
    setIndex = _useState4[1];
  var _useState5 = useState(false),
    _useState6 = _slicedToArray(_useState5, 2),
    playing = _useState6[0],
    setPlaying = _useState6[1];
  var mass = solar * T.SOLAR_MASS;
  var rs = T.schwarzschildRadius(mass);
  var threshold = T.spaghettificationRadius(mass, 2, 100);
  var start = Math.max(30 * rs, 1.2 * threshold);
  var run = useMemo(function () {
    return T.integrateTidalRing({
      mass: mass,
      startRadius: start,
      endRadius: 1.02 * rs,
      count: 96,
      steps: 800
    });
  }, [solar]);
  var snapshot = run.snapshots[index];
  var state = useRef(snapshot);
  state.current = snapshot;
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.grTides.stretchSpec(run, rs, threshold);
  }, [run]);
  useEffect(function () {
    if (!playing || reduced) return undefined;
    var timer = setInterval(function () {
      return setIndex(function (i) {
        if (i >= 800) {
          setPlaying(false);
          return 800;
        }
        return Math.min(800, i + 4);
      });
    }, 40);
    return function () {
      return clearInterval(timer);
    };
  }, [playing, reduced]);
  var choose = function choose(m) {
    setPlaying(false);
    setIndex(0);
    setSolar(m);
  };
  var build = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ctx) {
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            _context.n = 1;
            return window.QGA_GR.loadTidalRing();
          case 1:
            return _context.a(2, _context.v.buildTidalRing(ctx, state));
        }
      }, _callee);
    }));
    return function build(_x) {
      return _ref.apply(this, arguments);
    };
  }();
  var rate = -T.tidalEigenvalues(mass, snapshot.radius).radial;
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame tidal-lab",
    id: "gr-tidal-lab"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tidal-intro"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "tidal-kicker"
  }, "01 / THE SHAPE OF FREE FALL"), /*#__PURE__*/React.createElement("h3", null, "Gravity pulls unevenly"), /*#__PURE__*/React.createElement("p", null, "Nearby paths fall at different rates. Follow a small ring toward a black hole and watch it stretch along the radial direction while it narrows across it.")), /*#__PURE__*/React.createElement("div", {
    className: "tidal-formula"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "\\Delta a_r \\simeq \\frac{2GM}{r^3}\\,\\Delta r"
  }), /*#__PURE__*/React.createElement("small", null, "difference in acceleration across a separation"))), /*#__PURE__*/React.createElement("div", {
    className: "tidal-controls",
    role: "group",
    "aria-label": "Black hole mass"
  }, /*#__PURE__*/React.createElement("span", null, "Choose a black hole"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: 'btn' + (solar === 10 ? ' on' : ''),
    "aria-pressed": solar === 10,
    onClick: function onClick() {
      return choose(10);
    }
  }, "10 solar masses"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: 'btn' + (solar === 1000000 ? ' on' : ''),
    "aria-pressed": solar === 1000000,
    onClick: function onClick() {
      return choose(1000000);
    }
  }, "1 million solar masses")), /*#__PURE__*/React.createElement("div", {
    className: "tidal-scene-shell",
    onKeyDownCapture: function onKeyDownCapture(e) {
      if (e.key === " " && e.target.classList.contains("s3d-stage")) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tidal-overlay"
  }, "MODEL \xB7 LINEAR TIDAL DEVIATION ", /*#__PURE__*/React.createElement("span", null, "radial direction \u2192")), /*#__PURE__*/React.createElement(Scene3D, {
    animated: playing && !reduced,
    nodeKit: true,
    height: 350,
    invalidateKey: index,
    aria: "A ring of test particles stretches radially and contracts transversely during free fall. The ring is rescaled to fit the view.",
    initial: {
      radius: 13,
      theta: 0,
      phi: 1.5707963267948966,
      target: [0, 0, 0],
      minR: 8,
      maxR: 25
    },
    build: build,
    fallback: /*#__PURE__*/React.createElement("div", {
      className: "lab-fallback"
    }, "The particle view needs WebGL. The calculated readouts and plot remain available.")
  })), /*#__PURE__*/React.createElement("div", {
    className: "tidal-transport"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    "aria-pressed": playing,
    onClick: function onClick() {
      if (index === 800) setIndex(0);
      setPlaying(!playing);
    },
    disabled: reduced
  }, playing ? 'Pause' : 'Play fall'), /*#__PURE__*/React.createElement("label", null, "Fall progress ", /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "800",
    step: "1",
    value: index,
    onChange: function onChange(e) {
      setPlaying(false);
      setIndex(Number(e.target.value));
    }
  })), /*#__PURE__*/React.createElement("span", null, (index / 8).toFixed(0), "%")), reduced && /*#__PURE__*/React.createElement("p", {
    className: "tidal-note"
  }, "Reduced motion is on. Use the slider to explore the fall."), /*#__PURE__*/React.createElement("div", {
    className: "tidal-stats",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Radius"), /*#__PURE__*/React.createElement("strong", null, (snapshot.radius / rs).toFixed(2), " ", /*#__PURE__*/React.createElement("small", null, "r\u209B"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Radial gradient"), /*#__PURE__*/React.createElement("strong", null, rate.toExponential(2), " ", /*#__PURE__*/React.createElement("small", null, "m/s\xB2 per m"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Radial stretch"), /*#__PURE__*/React.createElement("strong", null, snapshot.radialScale.toFixed(2), " ", /*#__PURE__*/React.createElement("small", null, "\xD7 initial"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "100 m/s\xB2 threshold"), /*#__PURE__*/React.createElement("strong", null, (threshold / rs).toFixed(2), " ", /*#__PURE__*/React.createElement("small", null, "r\u209B \xB7 ", threshold > rs ? 'outside' : 'inside')))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "gr-tidal-ring",
    status: "effective"
  }, "The centre follows exact radial Schwarzschild free fall from rest. The small, initially comoving ring follows linear geodesic deviation; its size is rescaled to fit, so its shape is meaningful, not its apparent size. No material strength or self-gravity is included."), /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }, /*#__PURE__*/React.createElement("span", {
    className: "tidal-note"
  }, "The threshold is the radius where the differential acceleration across 2 m reaches 100 m/s\xB2. It is a chosen comparison, not a universal survival limit.")));
}