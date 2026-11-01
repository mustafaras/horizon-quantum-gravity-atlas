/* Compiled from js/labs/curvature-engine-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
// Curvature engine controls, extracted from mod-gr for S20.
function CurvatureEngine3D() {
  var _useState = useState("classic"),
    _useState2 = _slicedToArray(_useState, 2),
    scenario = _useState2[0],
    setScenario = _useState2[1];
  var _useState3 = useState(5),
    _useState4 = _slicedToArray(_useState3, 2),
    mass = _useState4[0],
    setMass = _useState4[1];
  var _useState5 = useState("gr"),
    _useState6 = _slicedToArray(_useState5, 2),
    view = _useState6[0],
    setView = _useState6[1];
  var _useState7 = useState("flamm"),
    _useState8 = _slicedToArray(_useState7, 2),
    geometry = _useState8[0],
    setGeometry = _useState8[1];
  var _useState9 = useState(true),
    _useState0 = _slicedToArray(_useState9, 2),
    showRay = _useState0[0],
    setShowRay = _useState0[1];
  var _useState1 = useState(true),
    _useState10 = _slicedToArray(_useState1, 2),
    showTrails = _useState10[0],
    setShowTrails = _useState10[1];
  var _useState11 = useState(false),
    _useState12 = _slicedToArray(_useState11, 2),
    rr = _useState12[0],
    setRr = _useState12[1];
  var _useState13 = useState(0),
    _useState14 = _slicedToArray(_useState13, 2),
    spin = _useState14[0],
    setSpin = _useState14[1];
  var _useState15 = useState(1),
    _useState16 = _slicedToArray(_useState15, 2),
    speed = _useState16[0],
    setSpeed = _useState16[1];
  var _useState17 = useState(1),
    _useState18 = _slicedToArray(_useState17, 2),
    lightSpeed = _useState18[0],
    setLightSpeed = _useState18[1];
  var _useState19 = useState(function () {
      return grMakeBodies("classic");
    }),
    _useState20 = _slicedToArray(_useState19, 2),
    bodies = _useState20[0],
    setBodies = _useState20[1];
  var _useState21 = useState(0),
    _useState22 = _slicedToArray(_useState21, 2),
    selected = _useState22[0],
    setSelected = _useState22[1];
  var _useState23 = useState(null),
    _useState24 = _slicedToArray(_useState23, 2),
    cameraGoal = _useState24[0],
    setCameraGoal = _useState24[1];
  var massRef = useRef(mass);
  massRef.current = mass;
  var viewRef = useRef(view);
  viewRef.current = view;
  var geometryRef = useRef(geometry);
  geometryRef.current = geometry;
  var rayRef = useRef(showRay);
  rayRef.current = showRay;
  var trailRef = useRef(showTrails);
  trailRef.current = showTrails;
  var rrRef = useRef(rr);
  rrRef.current = rr;
  var spinRef = useRef(spin);
  spinRef.current = spin;
  var speedRef = useRef(speed);
  speedRef.current = speed;
  var lightRef = useRef(lightSpeed);
  lightRef.current = lightSpeed;
  var bodiesRef = useRef(bodies);
  bodiesRef.current = bodies;
  var selRef = useRef(selected);
  selRef.current = selected;
  var stRef = useRef({
    sim: [],
    rays: GR_RAY_B.map(function (b) {
      return {
        x: -7.6,
        y: b,
        vx: 4,
        vy: 0,
        b: b,
        trail: [],
        near: false
      };
    })
  });
  var selIdx = Math.min(selected, bodies.length - 1);
  var selBody = bodies[selIdx];
  var precDeg = selBody && !selBody.free && view === "gr" ? grPrecDeg(mass, selBody.a, selBody.e) : 0;
  var ltDeg = selBody && !selBody.free && view === "gr" && spin > 0 ? window.QGA_PHYSICS.grLenseThirringDeg(spin * Math.pow(0.55 * mass, 2) / GR_C2 * 10, GR_C2, selBody.a, selBody.e) : 0;
  var rrDa = rr && selBody && !selBody.free && view === "gr" ? window.QGA_PHYSICS.grPetersDerivatives(selBody.a, selBody.e, 0.5).da : 0;

  // Strong-field anchors for the light fan: photon sphere, critical impact
  // parameter, and the integrated deflection of the outermost ray.
  var gmScene = 0.55 * mass;
  var rPhoton = window.QGA_PHYSICS.grPhotonSphereRadius(gmScene, GR_C2);
  var bCrit = window.QGA_PHYSICS.grCriticalImpactParameter(gmScene, GR_C2);
  var deflDeg = useMemo(function () {
    var d = window.QGA_PHYSICS.grNullDeflection(3.3, 0.55 * mass, GR_C2);
    return d.captured ? 0 : d.deflection * 180 / Math.PI;
  }, [mass]);
  var applyScenario = function applyScenario(id) {
    var s = window.QGA_PHYSICS.grCurvatureScenario(id);
    setScenario(id);
    setMass(s.mass);
    setShowRay(s.rays);
    setSpin(s.spin || 0);
    setRr(!!s.rr);
    setBodies(grMakeBodies(id));
    setSelected(0);
    if (GR_CAMERA[id]) setCameraGoal(_objectSpread({}, GR_CAMERA[id]));
  };
  var addBody = function addBody() {
    if (bodies.length >= GR_MAX_BODIES) return;
    var i = bodies.length;
    setBodies(bodies.concat([{
      uid: "b" + grUidSeed++,
      free: false,
      a: Math.min(6.2, 2.0 + i * 0.75),
      e: 0.15 + 0.13 * (i % 3),
      phase: i * 1.7,
      peri: i * 0.9,
      incl: i % 2 ? 0.05 : -0.04,
      x0: undefined,
      y0: undefined,
      vx0: undefined,
      vy0: undefined,
      hex: GR_BODY_PALETTE[i % GR_BODY_PALETTE.length],
      r: 0.14
    }]));
    setSelected(i);
  };
  var removeSelected = function removeSelected() {
    if (bodies.length <= 1) return;
    var next = bodies.filter(function (_, i) {
      return i !== selIdx;
    });
    setBodies(next);
    setSelected(Math.max(0, Math.min(selected, next.length - 1)));
  };
  var patchSelected = function patchSelected(patch) {
    setBodies(bodies.map(function (b, i) {
      return i === selIdx ? _objectSpread(_objectSpread({}, b), patch) : b;
    }));
  };
  var relaunch = function relaunch() {
    stRef.current.sim = [];
    stRef.current.rays = GR_RAY_B.map(function (b) {
      return {
        x: -7.6,
        y: b,
        vx: 4,
        vy: 0,
        b: b,
        trail: [],
        near: false
      };
    });
  };
  var refs = {
    mass: massRef,
    view: viewRef,
    geometry: geometryRef,
    ray: rayRef,
    trail: trailRef,
    rr: rrRef,
    spin: spinRef,
    speed: speedRef,
    light: lightRef,
    bodies: bodiesRef,
    sel: selRef,
    st: stRef
  };
  // The scene builder (TSL materials on the material kit, S07) lives in js/visualizations/gr/curvature-engine.mjs and loads with the scene.
  var build = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ctx) {
      var _yield$window$QGA_GR$, buildCurvatureScene;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            _context.n = 1;
            return window.QGA_GR.loadCurvatureEngine();
          case 1:
            _yield$window$QGA_GR$ = _context.v;
            buildCurvatureScene = _yield$window$QGA_GR$.buildCurvatureScene;
            return _context.a(2, buildCurvatureScene(ctx, {
              refs: refs,
              setSelected: setSelected,
              constants: {
                GR_RAY_B: GR_RAY_B,
                GR_C2: GR_C2,
                GR_MAX_BODIES: GR_MAX_BODIES
              },
              precessionDeg: grPrecDeg
            }));
        }
      }, _callee);
    }));
    return function build(_x) {
      return _ref.apply(this, arguments);
    };
  }();
  var scenarioIds = Object.keys(window.QGA_PHYSICS.GR_CURVATURE_SCENARIOS);
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame",
    id: "shot-section-gr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "mass M",
    min: 1,
    max: 10,
    step: 0.1,
    value: mass,
    onChange: setMass,
    format: function format(v) {
      return v.toFixed(1);
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "spin a\u2605",
    min: 0,
    max: 0.95,
    step: 0.05,
    value: spin,
    onChange: setSpin,
    format: function format(v) {
      return v.toFixed(2);
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "seg"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn" + (view === "gr" ? " on" : ""),
    onClick: function onClick() {
      return setView("gr");
    }
  }, "Relativistic geometry"), /*#__PURE__*/React.createElement("button", {
    className: "btn" + (view === "newton" ? " on" : ""),
    onClick: function onClick() {
      return setView("newton");
    }
  }, "Newtonian intuition")), /*#__PURE__*/React.createElement("span", {
    className: "seg",
    role: "group",
    "aria-label": "Surface geometry"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn" + (geometry === "schematic" ? " on" : ""),
    "aria-pressed": geometry === "schematic",
    onClick: function onClick() {
      return setGeometry("schematic");
    }
  }, "Newtonian potential \xB7 schematic"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn" + (geometry === "flamm" ? " on" : ""),
    "aria-pressed": geometry === "flamm",
    onClick: function onClick() {
      return setGeometry("flamm");
    }
  }, "Exact geometry \xB7 Flamm")), /*#__PURE__*/React.createElement(Toggle, {
    label: "null geodesics",
    checked: showRay,
    onChange: setShowRay
  }), /*#__PURE__*/React.createElement(Toggle, {
    label: "orbit trails",
    checked: showTrails,
    onChange: setShowTrails
  }), /*#__PURE__*/React.createElement(Toggle, {
    label: "radiation reaction",
    checked: rr,
    onChange: setRr
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "time \xD7",
    min: 0.25,
    max: 2.5,
    step: 0.05,
    value: speed,
    onChange: setSpeed,
    format: function format(v) {
      return v.toFixed(2);
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "light \xD7",
    min: 0.1,
    max: 2,
    step: 0.05,
    value: lightSpeed,
    onChange: setLightSpeed,
    format: function format(v) {
      return v.toFixed(2);
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: relaunch
  }, "Re-launch bodies")), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "chip-row",
    role: "group",
    "aria-label": "scenario presets"
  }, scenarioIds.map(function (id) {
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      className: "chip" + (scenario === id ? " on" : ""),
      "aria-pressed": scenario === id,
      onClick: function onClick() {
        return applyScenario(id);
      }
    }, window.QGA_PHYSICS.grCurvatureScenario(id).label);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "chip-row",
    role: "group",
    "aria-label": "orbiting bodies"
  }, bodies.map(function (b, i) {
    return /*#__PURE__*/React.createElement("button", {
      key: b.uid,
      className: "chip body-chip" + (i === selIdx ? " on" : ""),
      "aria-pressed": i === selIdx,
      onClick: function onClick() {
        return setSelected(i);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "body-dot",
      style: {
        background: "#" + b.hex.toString(16).padStart(6, "0")
      }
    }), b.free ? "plunge" : "body " + (i + 1));
  }), /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: addBody,
    disabled: bodies.length >= GR_MAX_BODIES
  }, "+ body"), /*#__PURE__*/React.createElement("button", {
    className: "chip",
    onClick: removeSelected,
    disabled: bodies.length <= 1
  }, "\u2212 remove")), selBody && !selBody.free && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SliderRow, {
    label: "semi-major a",
    min: 1.4,
    max: 6.5,
    step: 0.05,
    value: selBody.a,
    onChange: function onChange(v) {
      return patchSelected({
        a: v
      });
    },
    format: function format(v) {
      return v.toFixed(2);
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "eccentricity e",
    min: 0,
    max: 0.9,
    step: 0.01,
    value: selBody.e,
    onChange: function onChange(v) {
      return patchSelected({
        e: v
      });
    },
    format: function format(v) {
      return v.toFixed(2);
    }
  })), selBody && selBody.free && /*#__PURE__*/React.createElement("span", {
    className: "chip-hint"
  }, "plunge body \u2014 numerically integrated; captured at r = 3GM/c\xB2")), /*#__PURE__*/React.createElement("div", {
    className: "gr-well-stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gr-geometry-label",
    "aria-live": "polite"
  }, geometry === "flamm" ? "EXACT · Schwarzschild equatorial spatial slice" : "SCHEMATIC · Newtonian potential"), /*#__PURE__*/React.createElement(Scene3D, {
    animated: true,
    nodeKit: true,
    height: 480,
    shotSpace: "gr-curvature",
    aria: "Three-dimensional gravity well: selectable exact Flamm spatial embedding or schematic potential surface with separately modelled orbits and light rays",
    initial: {
      radius: 17,
      theta: 0.4,
      phi: 1.08,
      target: [0, -1.2, 0],
      minR: 8,
      maxR: 38,
      bloom: {
        strength: 1.12,
        radius: 0.66,
        threshold: 0.1
      }
    },
    cameraGoal: cameraGoal,
    build: build,
    fallback: /*#__PURE__*/React.createElement(CurvatureEngine, null)
  })), /*#__PURE__*/React.createElement("div", {
    className: "panel-deck"
  }, /*#__PURE__*/React.createElement(VEffPanel, {
    mass: mass,
    body: selBody,
    view: view,
    stRef: stRef
  }), /*#__PURE__*/React.createElement(NullGeodesicPanel, {
    mass: mass,
    c2: GR_C2
  }), /*#__PURE__*/React.createElement(LensedSkyPanel, {
    mass: mass
  })), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar viz-toolbar-bottom readout-grid",
    style: {
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "selected body eccentricity e"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, selBody && !selBody.free ? selBody.e.toFixed(3) : "—")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "perihelion advance (selected)"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, precDeg > 0.05 ? "+" + precDeg.toFixed(1) : "0.0", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "\xB0 / orbit"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "Lense\u2013Thirring node (selected)"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, ltDeg > 0.01 ? "+" + ltDeg.toFixed(1) : "0.0", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "\xB0 / orbit \xD710"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "GW inspiral \u27E8\u0227\u27E9 (selected)"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, rrDa < -0.001 ? rrDa.toFixed(3) : "off", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "a / s"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "photon sphere r = 3GM/c\xB2"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, rPhoton.toFixed(3), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "scene units"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "critical impact b = 3\u221A3 GM/c\xB2"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, bCrit.toFixed(3), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "capture below"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "deflection at b = 3.3 (integrated)"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, deflDeg.toFixed(2), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "\xB0"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "Mercury (real, GR)"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, "42.98", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "\u2033 / century"))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "Solar-limb light deflection (real)"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, "1.75", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "\u2033")))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "gr-curvature-well",
    status: "schematic"
  }, "Flamm mode embeds the equatorial spatial slice of a non-rotating Schwarzschild solution outside the horizon; concentric lines are equally spaced in proper radial distance. Its vertical direction is an embedding aid, not an extra dimension of space or a picture of time. The alternative potential well is schematic. The overlaid trajectories use separate models: bound orbits use an amplified precession approximation, light rays are numerically integrated Schwarzschild null geodesics, and frame dragging and radiation reaction are illustrative additions. The scene mass and distances use display units."));
}