/* Compiled from js/labs/collider-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
/* ---------- Prompt 08: collider event display (shared by standard model + experiments) ---------- */
function ColliderLabSection() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
    _ref$compact = _ref.compact,
    compact = _ref$compact === void 0 ? false : _ref$compact,
    _ref$fallback = _ref.fallback,
    fallback = _ref$fallback === void 0 ? null : _ref$fallback;
  var _useQGAState = useQGAState(),
    _useQGAState2 = _slicedToArray(_useQGAState, 2),
    state = _useQGAState2[0],
    setState = _useQGAState2[1];
  var _useState = useState(null),
    _useState2 = _slicedToArray(_useState, 2),
    sel = _useState2[0],
    setSel = _useState2[1];
  var selRef = useRef(sel);
  selRef.current = sel;
  var channel = state.colliderChannel;
  var seed = state.seed;
  var lab = window.QGA_LABS && window.QGA_LABS.eventSummary ? window.QGA_LABS.eventSummary(window.QGA_LABS.syntheticEvent({
    channel: channel,
    seed: seed,
    sqrtSGev: 13600
  })) : null;
  var channelLabels = {
    h2gg: "H → γγ",
    z2mm: "Z → μμ",
    z2ee: "Z → ee",
    ttbar: "t t̄",
    qcd: "QCD jets"
  };
  var build = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ctx) {
      var LABS, _yield$LABS$loadColli, createColliderDisplayRuntime, runtime;
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
            return LABS.loadColliderDisplay();
          case 2:
            _yield$LABS$loadColli = _context.v;
            createColliderDisplayRuntime = _yield$LABS$loadColli.createColliderDisplayRuntime;
            ctx.scene.fog = new ctx.THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-11-c02-h261"), 0.014);
            runtime = createColliderDisplayRuntime({
              channel: channel,
              seed: seed,
              sqrtSGev: 13600,
              camera: ctx.camera,
              engraved: ctx.engraved
            });
            ctx.scene.add(runtime.mesh);
            ctx.label("SYNTHETIC FIXTURE · seeded kinematics — not a CERN observation", function () {
              return {
                x: -4.6,
                y: 3.6,
                z: -3.4
              };
            }, "s3d-strong");
            ctx.label("tracker · ECAL · HCAL · muon system — click a track to identify it", function () {
              return {
                x: -4.6,
                y: -3.4,
                z: 3.4
              };
            }, "s3d-quiet");
            return _context.a(2, {
              pickables: runtime.pickables,
              onPick: function onPick(o) {
                if (o && o.userData && o.userData.info) setSel(o.userData);
              },
              update: function update(t) {
                runtime.sync({
                  time: t,
                  motion: ctx.motion() === 0 ? 0 : 1
                });
                window.__qgaColliderLab = _objectSpread({
                  kind: runtime.kind
                }, runtime.stats());
              },
              dispose: function dispose() {
                runtime.dispose();
                delete window.__qgaColliderLab;
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
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    "aria-label": "Collider channel"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Channel"), Object.entries(channelLabels).map(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
      key = _ref4[0],
      label = _ref4[1];
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      className: "kerr-chip" + (channel === key ? " on" : ""),
      "aria-pressed": channel === key,
      onClick: function onClick() {
        return setState({
          colliderChannel: key
        });
      }
    }, label);
  })), /*#__PURE__*/React.createElement("button", {
    className: "kerr-chip",
    onClick: function onClick() {
      return setState({
        seed: seed + 1
      });
    }
  }, "New collision"), sel !== null ? /*#__PURE__*/React.createElement("button", {
    className: "kerr-chip",
    onClick: function onClick() {
      return setSel(null);
    }
  }, "Clear selection") : null, /*#__PURE__*/React.createElement("div", {
    className: "kerr-state-line lab-readout"
  }, lab ? /*#__PURE__*/React.createElement(React.Fragment, null, lab.nParticles, " particles \xB7 ", lab.nJets, " jets \xB7", lab.masses.mGammaGamma != null ? /*#__PURE__*/React.createElement(React.Fragment, null, " m", /*#__PURE__*/React.createElement("sub", null, "\u03B3\u03B3"), " = ", lab.masses.mGammaGamma.toFixed(1), " GeV \xB7") : null, lab.masses.mMuMu != null ? /*#__PURE__*/React.createElement(React.Fragment, null, " m", /*#__PURE__*/React.createElement("sub", null, "\u03BC\u03BC"), " = ", lab.masses.mMuMu.toFixed(1), " GeV \xB7") : null, lab.masses.mTopHad != null ? /*#__PURE__*/React.createElement(React.Fragment, null, " m", /*#__PURE__*/React.createElement("sub", null, "t"), " = ", lab.masses.mTopHad.toFixed(0), " GeV \xB7") : null, "E", /*#__PURE__*/React.createElement("sub", null, "T"), /*#__PURE__*/React.createElement("sup", null, "miss"), " = ", lab.metEt.toFixed(0), " GeV") : "—")), /*#__PURE__*/React.createElement(Scene3D, {
    animated: "motion",
    nodeKit: true,
    height: compact ? 400 : 460,
    aria: "Three-dimensional collider event display: two beams collide at the vertex, charged tracks curve in the tracker, calorimeter towers rise with transverse energy, jet cones mark hadronic clusters, and a dashed arrow shows missing transverse energy",
    initial: {
      radius: 13,
      theta: 0.95,
      phi: 1.15,
      minR: 5,
      maxR: 34,
      bloom: {
        strength: 0.7,
        radius: 0.5,
        threshold: 0.18
      }
    },
    build: build,
    deps: [channel, seed],
    fallback: fallback || /*#__PURE__*/React.createElement("div", {
      className: "lab-fallback"
    }, "The 3-D event display needs WebGL; the kinematics above are computed without it.")
  }), sel ? /*#__PURE__*/React.createElement("div", {
    className: "s3d-detail",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-schematic"
  }, sel.kind || "deposit"), /*#__PURE__*/React.createElement("span", {
    className: "small",
    style: {
      flex: 1
    }
  }, sel.info)) : null, /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "collider-event-lab",
    status: "schematic"
  }, "Every particle here is generated by ", /*#__PURE__*/React.createElement("code", null, "js/science/collider-kinematics.mjs"), " from the shared seed: two-body decays with exact four-momentum conservation, on-shell masses, and a seeded jet clusterer (anti-k", /*#__PURE__*/React.createElement("sub", null, "T"), "-style greedy merging, disclosed as a teaching approximation). Tracks curve by charge over p", /*#__PURE__*/React.createElement("sub", null, "T"), ", calorimeter towers bin real (\u03B7, \u03C6) coordinates, and the dashed arrow is the vector sum that balances transverse momentum \u2014 the classic neutrino signature. This is a ", /*#__PURE__*/React.createElement("strong", null, "schematic synthetic fixture"), " for learning detector logic; it is not a CERN observation and carries no experimental claim."));
}