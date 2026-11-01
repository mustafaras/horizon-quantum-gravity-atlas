/* Compiled from js/labs/causal-set-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
// S22: the causal-set laboratory. A sprinkle you can change, with the dimension measured from the order alone.
function CausalSetLab() {
  var S = window.QGA_CAUSAL_SETS;
  var reduced = usePRM();
  var _useState = useState(600),
    _useState2 = _slicedToArray(_useState, 2),
    n = _useState2[0],
    setN = _useState2[1];
  var _useState3 = useState(2),
    _useState4 = _slicedToArray(_useState3, 2),
    dim = _useState4[0],
    setDim = _useState4[1];
  var _useState5 = useState(42),
    _useState6 = _slicedToArray(_useState5, 2),
    seed = _useState6[0],
    setSeed = _useState6[1];
  var _useState7 = useState(true),
    _useState8 = _slicedToArray(_useState7, 2),
    showLinks = _useState8[0],
    setShowLinks = _useState8[1];
  var run = useMemo(function () {
    return S.estimate({
      dim: dim,
      n: n,
      seed: seed
    });
  }, [dim, n, seed]);
  // The readout quotes the spread over five seeds, never a single draw.
  var spread = useMemo(function () {
    return S.ensemble({
      dim: dim,
      n: n,
      seeds: 5,
      firstSeed: seed
    });
  }, [dim, n, seed]);
  var state = useRef({
    run: run,
    dim: dim,
    showLinks: showLinks
  });
  state.current = {
    run: run,
    dim: dim,
    showLinks: showLinks
  };
  var build = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ctx) {
      var _yield$window$QGA_LAB, createCausalSetRuntime, runtime, chip, still, last;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            _context.n = 1;
            return window.QGA_LABS.loadCausalSet();
          case 1:
            _yield$window$QGA_LAB = _context.v;
            createCausalSetRuntime = _yield$window$QGA_LAB.createCausalSetRuntime;
            runtime = createCausalSetRuntime(_objectSpread(_objectSpread({}, state.current), {}, {
              engraved: ctx.engraved
            }));
            ctx.scene.add(runtime.group);
            // The status is DOM pinned to the stage (mountOverlay), not a world position: a world label at the diamond's
            // corner is clipped on a phone, and it also collides with the stage controls. The caption carries the rest.
            if (typeof ctx.mountOverlay === "function" && globalThis.document) {
              chip = globalThis.document.createElement("div");
              chip.className = "s3d-label s3d-strong causal-set-status";
              chip.textContent = "CONJECTURAL \xB7 ".concat(state.current.dim, "D causal diamond");
              ctx.mountOverlay(chip);
            }
            ctx.label(state.current.dim === 2 ? "t vertical, x horizontal — the diamond drawn literally" : "4D projected: time vertical, space through a fixed frame", function () {
              return window.matchMedia("(max-width: 640px)").matches ? {
                x: 0,
                y: -3.6,
                z: 0
              } : {
                x: -2.6,
                y: -3.6,
                z: 1.6
              };
            }, "s3d-quiet");
            still = reduced;
            if (still) {
              runtime.completeReveal();
              // The stage calls update(0) before the first frame; nothing may undo the completed reveal.
              window.__qgaCausalSet = runtime.stats();
            }
            last = 0;
            return _context.a(2, {
              isAnimated: function isAnimated() {
                return !still;
              },
              update: function update(t) {
                if (still) return;
                var dt = last ? (t - last) * 1000 : 16;
                last = t;
                var running = runtime.tick(dt);
                // Publish every frame so the QA hook reports what is on screen, not just the settled state.
                window.__qgaCausalSet = runtime.stats();
                if (running) ctx.invalidate();
              },
              dispose: function dispose() {
                runtime.dispose();
                delete window.__qgaCausalSet;
              }
            });
        }
      }, _callee);
    }));
    return function build(_x) {
      return _ref.apply(this, arguments);
    };
  }();
  var mm = run.myrheimMeyer;
  var chainIdeal = Math.pow(n, 1 / dim);
  var drawn = useMemo(function () {
    return _objectSpread(_objectSpread({}, S.drawableLinks(run)), {}, {
      points: S.drawablePoints(run)
    });
  }, [run]);
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame causal-set-lab",
    id: "approaches-causal-set"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "elements N",
    min: 100,
    max: 4000,
    step: 100,
    value: n,
    onChange: setN,
    format: function format(v) {
      return String(v);
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "seg",
    role: "group",
    "aria-label": "spacetime dimension"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn" + (dim === 2 ? " on" : ""),
    "aria-pressed": dim === 2,
    onClick: function onClick() {
      return setDim(2);
    }
  }, "2D"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn" + (dim === 4 ? " on" : ""),
    "aria-pressed": dim === 4,
    onClick: function onClick() {
      return setDim(4);
    }
  }, "4D")), /*#__PURE__*/React.createElement("label", {
    className: "causal-toggle"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: showLinks,
    onChange: function onChange(e) {
      return setShowLinks(e.target.checked);
    }
  }), "show links"), /*#__PURE__*/React.createElement("label", {
    className: "causal-seed"
  }, "seed", /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 1,
    max: 99,
    step: 1,
    value: seed,
    onChange: function onChange(e) {
      return setSeed(Number(e.target.value));
    },
    "aria-label": "causal set seed"
  }), /*#__PURE__*/React.createElement("strong", null, seed))), /*#__PURE__*/React.createElement(Scene3D, {
    animated: "motion",
    nodeKit: true,
    height: 460,
    aria: "A Poisson sprinkle of ".concat(n, " elements into a ").concat(dim, "-dimensional causal diamond. Points are the elements, faint lines their causal links, and the golden line the longest chain."),
    initial: {
      radius: 13,
      theta: 0.42,
      phi: 1.32,
      target: [0, 0, 0],
      minR: 7,
      maxR: 30
    },
    build: build,
    deps: [dim, n, seed, showLinks, reduced],
    fallback: /*#__PURE__*/React.createElement("div", {
      className: "lab-fallback"
    }, "The constellation view needs WebGL. Every estimator below is still computed.")
  }), /*#__PURE__*/React.createElement("div", {
    className: "readout-grid causal-readouts",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "Myrheim\u2013Meyer dimension"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, mm.dim.toFixed(2), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "d")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "from ", n, " elements; ", spread.seeds, " seeds give ", spread.meanDimension.toFixed(2), " \xB1 ", spread.spreadDimension.toFixed(2))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "ordering fraction"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, run.orderingFraction.toFixed(4)), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "theory f(", dim, ") = ", mm.expected.toFixed(4))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "longest chain"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, run.chain.length, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "elements")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "N^(1/d) \u2248 ", chainIdeal.toFixed(1), " \u2014 the order's own proper-time estimate")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "links / relations"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, run.links.length, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "of ", run.relations)), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "cover relations after transitive reduction; ", drawn.shown, " drawn (1 in ", drawn.stride, ")"))), reduced ? /*#__PURE__*/React.createElement("p", {
    className: "causal-note"
  }, "Reduced motion is on. The scene is static by design; change N, the dimension or the seed to redraw it.") : null, /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "approaches-causal-set",
    status: "conjectural"
  }, "Elements are sprinkled at random into a diamond of flat spacetime; the ", /*#__PURE__*/React.createElement("strong", null, "only"), " structure kept is the causal order \u2014 which element can influence which. From that order alone the dimension is recovered by the Myrheim\u2013Meyer relation ", /*#__PURE__*/React.createElement(Eq, {
    tex: "f(d)=\\Gamma(d+1)\\Gamma(d/2)\\,/\\,(2\\Gamma(3d/2))"
  }), ", and the longest chain estimates proper time, growing as ", /*#__PURE__*/React.createElement(Eq, {
    tex: "N^{1/d}"
  }), ". The recovered value is a statistical estimate; the readout quotes its spread over five seeds. The estimators read every element, but the ", /*#__PURE__*/React.createElement("em", null, "picture"), " is budgeted: at large N the elements and links are drawn at a stated stride, because one hairline per relation would merge into a solid block and show nothing. Whether spacetime really is a causal set is an open conjecture, and the 4D view is a projection, not four dimensions on screen."));
}