/* Compiled from js/labs/ads-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
/* ---------- Prompt 08: AdS holography lab (shared by approaches + black holes) ---------- */
function AdsLabSection() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
    _ref$compact = _ref.compact,
    compact = _ref$compact === void 0 ? false : _ref$compact;
  var _useQGAState = useQGAState(),
    _useQGAState2 = _slicedToArray(_useQGAState, 2),
    state = _useQGAState2[0],
    setState = _useQGAState2[1];
  var links = state.adsLabLinks;
  var region = state.adsLabRegion;
  var lab = window.QGA_LABS && window.QGA_LABS.adsLabState ? window.QGA_LABS.adsLabState({
    links: links,
    region: region
  }) : null;
  var build = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ctx) {
      var LABS, _yield$LABS$loadAdsLa, createAdsLabRuntime, runtime;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            LABS = window.QGA_LABS;
            if (LABS) {
              _context.n = 1;
              break;
            }
            throw new Error("Compute-lab module unavailable");
          case 1:
            _context.n = 2;
            return LABS.loadAdsLab();
          case 2:
            _yield$LABS$loadAdsLa = _context.v;
            createAdsLabRuntime = _yield$LABS$loadAdsLa.createAdsLabRuntime;
            ctx.scene.fog = new ctx.THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-11-c02"), 0.012);
            runtime = createAdsLabRuntime({
              links: links,
              region: region,
              seed: 42,
              camera: ctx.camera,
              engraved: ctx.engraved
            });
            ctx.scene.add(runtime.mesh);
            ctx.label("CONJECTURAL · AdS/CFT reading — the geometry is exact Poincaré math, the duality is not proven for our universe", function () {
              return {
                x: -4.4,
                y: 3.4,
                z: -3.2
              };
            }, "s3d-strong");
            ctx.label("boundary ring: quantum theory without gravity · interior: emergent AdS bulk", function () {
              return {
                x: -4.4,
                y: -3.1,
                z: 3.2
              };
            }, "s3d-quiet");
            return _context.a(2, {
              update: function update(t) {
                runtime.sync({
                  time: t,
                  motion: ctx.motion() === 0 ? 0 : 1
                });
                window.__qgaAdsLab = _objectSpread({
                  kind: runtime.kind
                }, runtime.stats());
              },
              dispose: function dispose() {
                runtime.dispose();
                delete window.__qgaAdsLab;
              },
              recoverable: function recoverable() {
                return false;
              }
            });
        }
      }, _callee);
    }));
    return function build(_x) {
      return _ref2.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar lab-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "boundary links",
    min: 0,
    max: 12,
    step: 1,
    value: links,
    onChange: function onChange(v) {
      return setState({
        adsLabLinks: v
      });
    },
    format: function format(v) {
      return String(v);
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "featured region (fraction of \u2202)",
    min: 0.1,
    max: 0.9,
    step: 0.05,
    value: region,
    onChange: function onChange(v) {
      return setState({
        adsLabRegion: v
      });
    },
    format: function format(v) {
      return v.toFixed(2);
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "kerr-state-line lab-readout"
  }, lab ? /*#__PURE__*/React.createElement(React.Fragment, null, "S(\u0394\u03C6) = ", lab.featured.entropy.toFixed(3), " \xB7 L", /*#__PURE__*/React.createElement("sub", null, "reg"), " = ", lab.featured.length.toFixed(3), " \xB7 wedge = ", (lab.featured.span / (2 * Math.PI) * 100).toFixed(0), "% of the boundary") : "—")), /*#__PURE__*/React.createElement(Scene3D, {
    animated: "motion",
    height: compact ? 380 : 440,
    aria: "Three-dimensional Poincar\xE9 disk: a glowing conformal boundary ring, hyperbolic geodesic grid, violet entanglement arcs, and a gold Ryu\u2013Takayanagi minimal surface anchoring a magenta entanglement wedge",
    initial: {
      radius: 10.5,
      theta: 0.62,
      phi: 1.35,
      minR: 4,
      maxR: 30,
      bloom: {
        strength: 0.8,
        radius: 0.55,
        threshold: 0.16
      }
    },
    build: build,
    deps: [links, region],
    fallback: /*#__PURE__*/React.createElement("div", {
      className: "lab-fallback"
    }, "The 3-D AdS lab needs WebGL; the entropy readouts above are computed without it.")
  }), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "ads-holography-lab",
    status: "conjectural"
  }, "The disk is the ", /*#__PURE__*/React.createElement("strong", null, "Poincar\xE9 disk"), " model of a constant-curvature AdS slice: boundary rings crowd together exactly as hyperbolic distance demands, and every arc is a true geodesic computed by", /*#__PURE__*/React.createElement("code", null, " js/science/ads-geometry.mjs"), ". The gold tube is the ", /*#__PURE__*/React.createElement("strong", null, "Ryu\u2013Takayanagi surface"), ": the minimal geodesic anchoring the featured boundary region, with", /*#__PURE__*/React.createElement(Eq, {
    tex: "S = \\frac{c}{6}\\,L_{\\mathrm{reg}} = \\frac{c}{3}\\ln\\frac{2\\sin(\\Delta\\varphi/2)}{\\varepsilon}"
  }), "\u2014 the tested formula, not a fitted curve. Widen the region and the surface reaches deeper into the bulk; add links and the partition weaves more of the interior. What is ", /*#__PURE__*/React.createElement("em", null, "conjectural"), " is the duality itself: AdS/CFT is precise in specific theoretical settings and has never been tested in our (not anti-de Sitter) universe."));
}