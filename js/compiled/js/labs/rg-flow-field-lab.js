/* Compiled from js/labs/rg-flow-field-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
// rg-flow-field-lab.jsx — the three-dimensional RG flow field (Prompt 07), moved out of js/mod-rg-stage3.jsx (S18) so the module file can
// shrink and so the gravity model can be offered beside the one-coupling models. The science is js/science/rg-flow-3d.mjs, the scene is
// js/visualizations/rg/flow-field.mjs; this file holds the model selector and the caption.

var RGF_MODELS = [{
  id: "qcd",
  label: "QCD one loop"
}, {
  id: "qed",
  label: "QED one loop"
}, {
  id: "asymptotic-safety",
  label: "pedagogical toy"
}, {
  id: "gravity",
  label: "Einstein–Hilbert (S18)"
}];
function RgFlowFieldLab() {
  var _useQGAState = useQGAState(),
    _useQGAState2 = _slicedToArray(_useQGAState, 1),
    state = _useQGAState2[0];
  var _useState = useState(state.rgModel),
    _useState2 = _slicedToArray(_useState, 2),
    model = _useState2[0],
    setModel = _useState2[1];
  var gravity = model === "gravity";
  var params = {
    nf: state.rgNf,
    a: state.rgA,
    b: state.rgB,
    gStar: state.rgGStar
  };
  // the field follows the landscape's preset while the local selector has not overridden it, so changing the model above re-integrates this
  var landscapeModel = useRef(state.rgModel);
  useEffect(function () {
    if (state.rgModel === landscapeModel.current) return;
    landscapeModel.current = state.rgModel;
    if (RGF_MODELS.some(function (entry) {
      return entry.id === state.rgModel;
    })) setModel(state.rgModel);
  }, [state.rgModel]);
  var build = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ctx) {
      var LABS, _yield$LABS$loadRgFlo, createRgFlowFieldRuntime, runtime, gravityNote;
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
            return LABS.loadRgFlowField();
          case 2:
            _yield$LABS$loadRgFlo = _context.v;
            createRgFlowFieldRuntime = _yield$LABS$loadRgFlo.createRgFlowFieldRuntime;
            ctx.scene.fog = new ctx.THREE.FogExp2(QGA_TOKENS.hex("pigment-grey-12-c01"), 0.014);
            runtime = createRgFlowFieldRuntime({
              model: model,
              params: params,
              seed: 42,
              engraved: ctx.engraved
            });
            ctx.scene.add(runtime.mesh);
            gravityNote = LABS.GRAVITY_FLOW_3D_NOTE;
            if (gravity) {
              // this mode's box is wider than the one-coupling box, so the labels sit inside the frame rather than above it
              ctx.label(gravityNote.status, function () {
                return {
                  x: -3.1,
                  y: 4.0,
                  z: 2.2
                };
              }, "s3d-strong");
              ctx.label("UV ↑  t = ln k  ↓ IR", function () {
                return {
                  x: -3.1,
                  y: 3.4,
                  z: 2.2
                };
              }, "s3d-strong");
              ctx.label(gravityNote.limit, function () {
                return {
                  x: 1.2,
                  y: -2.7,
                  z: 1.2
                };
              }, "s3d-quiet");
            } else {
              ctx.label("EFFECTIVE · g-runs via the shared beta function; r-direction γ(g)=g²/(1+g²) is a disclosed teaching model", function () {
                return {
                  x: -4.6,
                  y: 5.2,
                  z: 0
                };
              }, "s3d-strong");
              ctx.label("UV ↑  t = ln μ  ↓ IR", function () {
                return {
                  x: 0,
                  y: 5.6,
                  z: 0
                };
              }, "s3d-strong");
              ctx.label("streamlines stop at the validity wall g = √(4π)", function () {
                return {
                  x: 5.6,
                  y: -1.8,
                  z: 0
                };
              }, "s3d-quiet");
            }
            return _context.a(2, {
              update: function update(t) {
                runtime.sync({
                  time: t,
                  motion: ctx.motion() === 0 ? 0 : 1
                });
                window.__qgaRgFlow3d = _objectSpread({
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
                delete window.__qgaRgFlow3d;
              },
              recoverable: function recoverable() {
                return false;
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
    className: "viz-frame rgf-lab"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar ug-bar",
    role: "group",
    "aria-label": "Model of the three-dimensional flow field"
  }, RGF_MODELS.map(function (entry) {
    return /*#__PURE__*/React.createElement("button", {
      key: entry.id,
      type: "button",
      className: "btn ug-btn" + (model === entry.id ? " on" : ""),
      "aria-pressed": model === entry.id,
      onClick: function onClick() {
        return setModel(entry.id);
      }
    }, entry.label);
  })), /*#__PURE__*/React.createElement(Scene3D, {
    animated: "motion",
    nodeKit: true,
    height: 460,
    aria: gravity ? "Three-dimensional flow of the Einstein–Hilbert truncation: the Newton coupling and the cosmological constant in the horizontal plane, log energy scale vertically, with streamlines into the non-Gaussian fixed point and a plane where the truncation is singular" : "Three-dimensional renormalization-group flow field: streamlines in the coupling-mass plane running vertically in log energy scale, with fixed points, gold separatrices and validity walls",
    initial: {
      radius: gravity ? 17 : 13.5,
      theta: 0.7,
      phi: 1.15,
      minR: 5,
      maxR: 34,
      bloom: {
        strength: 0.55,
        radius: 0.45,
        threshold: 0.22
      }
    },
    build: build,
    deps: [model, state.rgNf, state.rgA, state.rgB, state.rgGStar],
    fallback: /*#__PURE__*/React.createElement("div", {
      className: "lab-fallback"
    }, "The 3-D flow field needs WebGL; the 2-D landscape above carries the same trajectories.")
  }), gravity ? /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "rg-flow-field-3d-gravity",
    status: "conjectural"
  }, "The same Einstein\u2013Hilbert flow as the silk above, now in three dimensions: the horizontal axes are the dimensionless Newton coupling ", /*#__PURE__*/React.createElement(Eq, {
    tex: "g"
  }), " and the cosmological constant ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\lambda"
  }), " (so the mass-like coupling r of the teaching model is replaced, not added), and vertical position is the shared log scale ", /*#__PURE__*/React.createElement(Eq, {
    tex: "t=\\ln k"
  }), ". Streamlines integrate the same beta functions as the silk and the figure below; the blue plane is ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\lambda=\\tfrac12"
  }), ", where the optimised-cutoff truncation is singular, and every streamline that reaches it stops there instead of being drawn past it. This is a truncation of an infinite tower: its fixed point and exponents move with the cutoff and the gauge, so the picture is conjectural, not a result about nature.") : /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "rg-flow-field-3d",
    status: "effective"
  }, "The same beta function that drives the 2-D landscape now flows in a third dimension: vertical position is the shared log scale t = ln \u03BC (UV up, IR down), horizontal axes are the gauge coupling g and a mass-like coupling r with \u03B2_r = (2 \u2212 \u03B3(g))\xB7r. Cyan runs integrate toward the UV, amber toward the IR, gold curves are the separatrices through the fixed points (same analytic fixed points as the landscape), and the red walls mark g = \u221A(4\u03C0) (\u03B1 = 1), where the perturbative model stops and every streamline visibly terminates \u2014 no segment past the wall is drawn as if it were trustworthy. The anomalous dimension \u03B3(g) = g\xB2/(1+g\xB2) is a transparent teaching model, not a computed exponent; the g-direction running is exactly the shared model selected above."));
}
window.RgFlowFieldLab = RgFlowFieldLab;