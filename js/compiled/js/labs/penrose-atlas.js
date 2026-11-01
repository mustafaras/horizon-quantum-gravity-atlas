/* Compiled from js/labs/penrose-atlas.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var _templateObject, _templateObject2, _templateObject3;
function _taggedTemplateLiteral(e, t) { return t || (t = e.slice(0)), Object.freeze(Object.defineProperties(e, { raw: { value: Object.freeze(t) } })); }
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
// Penrose Observatory: exact diagrams, computed light paths and a proper-time explorer.
var PN_DEFAULT_R0 = 2.6;
var PN_FOV = 13;
var PN_VIEWS = [{
  id: "minkowski",
  title: "Minkowski",
  label: "Flat spacetime",
  status: "established"
}, {
  id: "schwarzschild",
  title: "Schwarzschild",
  label: "Uncharged black hole",
  status: "established"
}, {
  id: "reissner-nordstrom",
  title: "Reissner–Nordström",
  label: "Charged black hole",
  status: "schematic"
}];
function PenroseAtlas() {
  var _PN_VIEWS$flatMap$fin;
  var C = window.QGA_CONFORMAL;
  var _useState = useState("minkowski"),
    _useState2 = _slicedToArray(_useState, 2),
    view = _useState2[0],
    setView = _useState2[1];
  var _useState3 = useState(false),
    _useState4 = _slicedToArray(_useState3, 2),
    compare = _useState4[0],
    setCompare = _useState4[1];
  var _useState5 = useState("signal"),
    _useState6 = _slicedToArray(_useState5, 2),
    mode = _useState6[0],
    setMode = _useState6[1];
  var _useState7 = useState(PN_DEFAULT_R0),
    _useState8 = _slicedToArray(_useState7, 2),
    r0 = _useState8[0],
    setR0 = _useState8[1];
  var _useState9 = useState(0),
    _useState0 = _slicedToArray(_useState9, 2),
    progress = _useState0[0],
    setProgress = _useState0[1];
  var _useState1 = useState("idle"),
    _useState10 = _slicedToArray(_useState1, 2),
    released = _useState10[0],
    setReleased = _useState10[1];
  var _useState11 = useState(null),
    _useState12 = _slicedToArray(_useState11, 2),
    focused = _useState12[0],
    setFocused = _useState12[1];
  var _useState13 = useState(null),
    _useState14 = _slicedToArray(_useState13, 2),
    event = _useState14[0],
    setEvent = _useState14[1];
  var _useState15 = useState(false),
    _useState16 = _slicedToArray(_useState15, 2),
    intro = _useState16[0],
    setIntro = _useState16[1];
  var reduced = usePRM();
  var settings = useAtlasSettings();
  var introDisabled = reduced || settings.motion === "reduced";
  var wrap = useRef(null),
    atlas = useRef(null);
  var introSeen = useRef(false);
  var _useState17 = useState(0),
    _useState18 = _slicedToArray(_useState17, 2),
    width = _useState18[0],
    setWidth = _useState18[1];
  var latest = useRef({});
  var selected = PN_VIEWS.find(function (item) {
    return item.id === view;
  });
  var other = view === "minkowski" ? "schwarzschild" : "minkowski";
  var visible = compare ? [view, other] : [view];
  latest.current = {
    r0: r0,
    view: view,
    compare: compare,
    progress: progress,
    mode: mode
  };
  useEffect(function () {
    var el = wrap.current;
    if (!el) return undefined;
    var ro = new ResizeObserver(function (entries) {
      return setWidth(Math.floor(entries[0].contentRect.width));
    });
    ro.observe(el);
    setWidth(Math.floor(el.getBoundingClientRect().width));
    return function () {
      return ro.disconnect();
    };
  }, []);
  var fall = useMemo(function () {
    return C.freeFallFromRest({
      r0: r0,
      M: 1,
      samples: 361
    });
  }, [r0]);
  var panelRegions = useMemo(function () {
    return C.regions(view);
  }, [view]);
  var active = (_PN_VIEWS$flatMap$fin = PN_VIEWS.flatMap(function (v) {
    return C.regions(v.id);
  }).find(function (r) {
    return r.id === focused;
  })) !== null && _PN_VIEWS$flatMap$fin !== void 0 ? _PN_VIEWS$flatMap$fin : null;
  var stage = useMemo(function () {
    var w = width || 900;
    var h = Math.round(Math.max(360, Math.min(620, w * 0.64)));
    return _objectSpread({
      height: h
    }, C.geometry.observatoryFrame(visible, w, h, PN_FOV));
  }, [width, view, compare]);
  var build = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(ctx) {
      var _handle$onFocusChange;
      var _yield$C$loadAtlas, buildPenroseAtlas, state, ids, handle, defaultId;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.n) {
          case 0:
            _context.n = 1;
            return C.loadAtlas();
          case 1:
            _yield$C$loadAtlas = _context.v;
            buildPenroseAtlas = _yield$C$loadAtlas.buildPenroseAtlas;
            state = latest.current;
            ids = state.compare ? [state.view, state.view === "minkowski" ? "schwarzschild" : "minkowski"] : [state.view];
            _context.n = 2;
            return buildPenroseAtlas(ctx, {
              visiblePanels: ids,
              onEvent: setEvent,
              onIntro: setIntro,
              onRegion: function onRegion(id) {
                setMode("regions");
                setFocused(id);
              },
              onProgress: function onProgress(value) {
                setProgress(function (old) {
                  return Math.abs(old - value) >= 0.015 || value === 0 || value === 1 ? value : old;
                });
                if (value >= 1) setReleased("complete");
              }
            });
          case 2:
            handle = _context.v;
            atlas.current = handle;
            handle.setStartRadius(state.r0);
            if (state.progress > 0) handle.seek(state.progress);
            defaultId = state.view === "reissner-nordstrom" ? null : state.view;
            if (defaultId) handle.placeEvent(defaultId, defaultId === "minkowski" ? {
              T: 0,
              R: 0
            } : {
              T: 0,
              R: 1.2
            });
            handle.setInteractionMode(state.mode);
            if (state.view === "minkowski" && !state.compare && !introSeen.current) {
              introSeen.current = true;
              handle.playIntro();
            }
            (_handle$onFocusChange = handle.onFocusChange) === null || _handle$onFocusChange === void 0 || _handle$onFocusChange.call(handle, setFocused);
            window.__qgaPenroseAtlas = handle;
            return _context.a(2, handle);
        }
      }, _callee);
    }));
    return function build(_x) {
      return _ref.apply(this, arguments);
    };
  }();
  useEffect(function () {
    var _atlas$current;
    (_atlas$current = atlas.current) === null || _atlas$current === void 0 || _atlas$current.setStartRadius(r0);
    setProgress(0);
    setReleased("idle");
  }, [r0]);
  useEffect(function () {
    var _atlas$current2;
    (_atlas$current2 = atlas.current) === null || _atlas$current2 === void 0 || _atlas$current2.setInteractionMode(mode);
  }, [mode]);
  var selectView = function selectView(id) {
    setView(id);
    setIntro(false);
    setFocused(null);
    setEvent(null);
    setProgress(0);
    setReleased("idle");
  };
  var selectMode = function selectMode(id) {
    setMode(id);
    if (id === "observer" && view !== "schwarzschild") selectView("schwarzschild");
  };
  var play = function play() {
    var _atlas$current$releas, _atlas$current4;
    if (released === "running") {
      var _atlas$current3;
      (_atlas$current3 = atlas.current) === null || _atlas$current3 === void 0 || _atlas$current3.pause();
      setReleased("paused");
      return;
    }
    var result = (_atlas$current$releas = (_atlas$current4 = atlas.current) === null || _atlas$current4 === void 0 ? void 0 : _atlas$current4.release()) !== null && _atlas$current$releas !== void 0 ? _atlas$current$releas : "idle";
    setReleased(result === "snapped" ? "complete" : result);
  };
  var placePreset = function placePreset(where) {
    var _atlas$current5, _atlas$current6;
    var p = where === "interior" ? {
      T: 0.9,
      R: 0.15
    } : {
      T: 0,
      R: 1.2
    };
    (_atlas$current5 = atlas.current) === null || _atlas$current5 === void 0 || _atlas$current5.placeEvent("schwarzschild", p);
    (_atlas$current6 = atlas.current) === null || _atlas$current6 === void 0 || _atlas$current6.focusRegion(where === "interior" ? "II" : "I");
  };
  var moveEvent = function moveEvent(dT, dR) {
    var _atlas$current7;
    if (event) (_atlas$current7 = atlas.current) === null || _atlas$current7 === void 0 || _atlas$current7.placeEvent(event.id, {
      T: event.T + dT,
      R: event.R + dR
    });
  };
  var eventText = !event ? "Choose an event on the map to explore its future." : event.id === "minkowski" ? "Both radial light signals can reach future null infinity in this flat spacetime." : event.region === "II" ? "Inside the black-hole region, both future-directed radial light paths end at the singularity." : event.region === "I" ? "Outside the future horizon, an outgoing light signal can reach future null infinity." : event.region === "III" ? "In the other exterior, the outward radial signal can reach that exterior’s future null infinity." : "This event lies in the white-hole region of the ideal maximal extension.";
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame pn-lab pn-observatory"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pn-hero"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "pn-eyebrow"
  }, "HORIZON / INTERACTIVE ATLAS"), /*#__PURE__*/React.createElement("h3", null, "Spacetime observatory"), /*#__PURE__*/React.createElement("p", null, "Where can a signal go? Explore the geometry of cause and effect.")), /*#__PURE__*/React.createElement("span", {
    className: "pn-hero-index"
  }, "GR / 04")), /*#__PURE__*/React.createElement("div", {
    className: "pn-viewbar",
    role: "group",
    "aria-label": "Choose spacetime"
  }, PN_VIEWS.map(function (item) {
    return /*#__PURE__*/React.createElement("button", {
      key: item.id,
      type: "button",
      className: "pn-view-btn" + (view === item.id ? " on" : ""),
      "aria-pressed": view === item.id,
      onClick: function onClick() {
        return selectView(item.id);
      }
    }, /*#__PURE__*/React.createElement("strong", null, item.title), /*#__PURE__*/React.createElement("span", null, item.label));
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pn-compare" + (compare ? " on" : ""),
    "aria-pressed": compare,
    onClick: function onClick() {
      setCompare(!compare);
      setIntro(false);
      setEvent(null);
    }
  }, "Compare ", compare ? "on" : "off")), /*#__PURE__*/React.createElement("div", {
    className: "pn-stage-wrap",
    ref: wrap
  }, /*#__PURE__*/React.createElement("div", {
    className: "pn-stage-meta"
  }, /*#__PURE__*/React.createElement("span", null, compare ? "COMPARE" : selected.title), /*#__PURE__*/React.createElement("span", {
    className: "pn-status " + selected.status
  }, compare && visible.includes("reissner-nordstrom") ? "RN SCHEMATIC" : selected.status === "schematic" ? "SCHEMATIC" : "EXACT MAP")), compare && C.geometry.layout().panels.filter(function (p) {
    return visible.includes(p.id);
  }).map(function (p) {
    var halfWidth = Math.tan(PN_FOV * Math.PI / 360) * stage.radius * (width || 900) / stage.height;
    return /*#__PURE__*/React.createElement("div", {
      className: "pn-compare-label",
      key: p.id,
      style: {
        left: "".concat((0.5 + (p.cx - stage.targetX) / (2 * halfWidth)) * 100, "%")
      }
    }, p.title, p.id === "reissner-nordstrom" ? " · schematic" : "");
  }), /*#__PURE__*/React.createElement(Scene3D, {
    fixedView: true,
    animated: false,
    height: stage.height,
    deps: [stage.radius, stage.targetX, view, compare],
    aria: "Conformal spacetime diagram. Select an event to see its future light paths. The Reissner\u2013Nordstr\xF6m view is schematic.",
    initial: {
      radius: stage.radius,
      theta: 0,
      phi: 0,
      fov: PN_FOV,
      minR: stage.radius * 0.8,
      maxR: stage.radius * 1.6,
      target: [stage.targetX, 0, 0]
    },
    build: build,
    fallback: /*#__PURE__*/React.createElement("div", {
      className: "lab-fallback"
    }, "The interactive diagram needs WebGL. The explanations and formulas remain available below.")
  }), /*#__PURE__*/React.createElement("div", {
    className: "pn-axis pn-axis-top"
  }, "FUTURE \u2191"), /*#__PURE__*/React.createElement("div", {
    className: "pn-axis pn-axis-bottom"
  }, "PAST")), /*#__PURE__*/React.createElement("div", {
    className: "pn-legend"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "pn-key-light"
  }), " light path"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "pn-key-world"
  }), " observer"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "pn-key-boundary"
  }), " boundary"), /*#__PURE__*/React.createElement("span", null, "shaded area: causal future"), /*#__PURE__*/React.createElement("span", null, "\u2197 radial light travels at 45\xB0")), view === "minkowski" && !compare && /*#__PURE__*/React.createElement("div", {
    className: "pn-intro-control"
  }, /*#__PURE__*/React.createElement("span", null, introDisabled ? "Reduced motion is on; the final map is shown without the introduction." : "Watch sample events change coordinates, then see an observer and light approach infinity on the finite map."), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    type: "button",
    disabled: introDisabled,
    onClick: function onClick() {
      var _atlas$current8, _atlas$current9;
      return intro ? (_atlas$current8 = atlas.current) === null || _atlas$current8 === void 0 ? void 0 : _atlas$current8.skipIntro() : (_atlas$current9 = atlas.current) === null || _atlas$current9 === void 0 ? void 0 : _atlas$current9.playIntro();
    }
  }, intro ? "Skip intro" : "Watch the map")), /*#__PURE__*/React.createElement("div", {
    className: "pn-actions",
    role: "group",
    "aria-label": "Explore the diagram"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pn-action" + (mode === "signal" ? " on" : ""),
    "aria-pressed": mode === "signal",
    onClick: function onClick() {
      return selectMode("signal");
    }
  }, "Send a light signal"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pn-action" + (mode === "observer" ? " on" : ""),
    "aria-pressed": mode === "observer",
    onClick: function onClick() {
      return selectMode("observer");
    }
  }, "Follow an observer"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pn-action" + (mode === "regions" ? " on" : ""),
    "aria-pressed": mode === "regions",
    onClick: function onClick() {
      return selectMode("regions");
    }
  }, "Explore regions")), /*#__PURE__*/React.createElement("div", {
    className: "pn-insight",
    "aria-live": "polite"
  }, mode === "signal" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "pn-kicker"
  }, "CAUSAL CONNECTION"), /*#__PURE__*/React.createElement("h4", null, "Choose an event"), /*#__PURE__*/React.createElement("p", null, view === "reissner-nordstrom" && !compare ? "This view is a schematic. Choose an exact map to send a computed light signal." : eventText + " Click or drag on the map, or use the movement controls below.", compare && " Comparison shows independent example events; select either exact map to move its event.")), /*#__PURE__*/React.createElement("div", {
    className: "pn-insight-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    type: "button",
    disabled: !event,
    onClick: function onClick() {
      var _atlas$current0;
      return (_atlas$current0 = atlas.current) === null || _atlas$current0 === void 0 ? void 0 : _atlas$current0.sendSignal();
    }
  }, "Send light again"), visible.includes("schwarzschild") && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    type: "button",
    onClick: function onClick() {
      return placePreset("exterior");
    }
  }, "Outside horizon"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    type: "button",
    onClick: function onClick() {
      return placePreset("interior");
    }
  }, "Inside horizon"))), event && /*#__PURE__*/React.createElement("div", {
    className: "pn-event-controls",
    role: "group",
    "aria-label": "Move the selected event"
  }, /*#__PURE__*/React.createElement("span", null, "Move event"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    "aria-label": "Move event into the past",
    onClick: function onClick() {
      return moveEvent(-0.1, 0);
    }
  }, "\u2193"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    "aria-label": "Move event left",
    onClick: function onClick() {
      return moveEvent(0, -0.1);
    }
  }, "\u2190"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    "aria-label": "Move event right",
    onClick: function onClick() {
      return moveEvent(0, 0.1);
    }
  }, "\u2192"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    "aria-label": "Move event into the future",
    onClick: function onClick() {
      return moveEvent(0.1, 0);
    }
  }, "\u2191"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Eq, {
    tex: pnPointTex(event)
  })))) : mode === "observer" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "pn-kicker"
  }, "RADIAL FREE FALL / SCHWARZSCHILD"), /*#__PURE__*/React.createElement("h4", null, "Follow the observer"), /*#__PURE__*/React.createElement("p", null, "The marker follows the calculated worldline in the observer\u2019s proper time. The horizon is crossed once; the trajectory ends at the singularity.")), /*#__PURE__*/React.createElement("div", {
    className: "pn-transport"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn pn-release",
    type: "button",
    onClick: play
  }, released === "running" ? "Pause" : progress >= 1 ? "Replay fall" : "Play fall"), /*#__PURE__*/React.createElement("label", null, "Proper time ", /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "1000",
    value: Math.round(progress * 1000),
    "aria-label": "Observer proper time",
    onChange: function onChange(e) {
      var _atlas$current1;
      (_atlas$current1 = atlas.current) === null || _atlas$current1 === void 0 || _atlas$current1.seek(Number(e.target.value) / 1000);
      setReleased("paused");
    }
  })), /*#__PURE__*/React.createElement("span", null, Math.round(progress * 100), "%")), /*#__PURE__*/React.createElement("div", {
    className: "pn-timeline-notes"
  }, /*#__PURE__*/React.createElement("span", null, "Start"), /*#__PURE__*/React.createElement("span", null, "Horizon \xB7 ", Math.round(C.geometry.horizonProgress(fall) * 100), "% of proper time"), /*#__PURE__*/React.createElement("span", null, "Singularity")), /*#__PURE__*/React.createElement("div", {
    className: "pn-start"
  }, /*#__PURE__*/React.createElement("label", null, "Starting radius ", /*#__PURE__*/React.createElement(Eq, {
    tex: "r_0"
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "2.6",
    max: "30",
    step: "0.2",
    value: r0,
    "aria-label": "infall start radius in units of M",
    onChange: function onChange(e) {
      return setR0(Number(e.target.value));
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "ctl-value"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: String.raw(_templateObject || (_templateObject = _taggedTemplateLiteral(["", "M"])), r0.toFixed(1))
  }))), /*#__PURE__*/React.createElement("p", {
    className: "pn-milestone"
  }, "Start at rest \xB7 horizon at ", /*#__PURE__*/React.createElement(Eq, {
    tex: pnPointTex(fall.horizonCrossing)
  }), " \xB7 end at ", /*#__PURE__*/React.createElement(Eq, {
    tex: String.raw(_templateObject2 || (_templateObject2 = _taggedTemplateLiteral(["\tau=", ",M"], ["\\tau=", "\\,M"])), fall.properTimeEnd.toFixed(3))
  }))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "pn-kicker"
  }, "SELECT A REGION"), /*#__PURE__*/React.createElement("h4", null, active ? active.name : "Explore the map"), /*#__PURE__*/React.createElement("p", null, active ? active.meaning : "Select a region to see what it represents. The maximal Schwarzschild extension is an ideal mathematical solution.")), /*#__PURE__*/React.createElement("div", {
    className: "pn-region-list",
    role: "group",
    "aria-label": "Regions of the diagram"
  }, panelRegions.map(function (region) {
    return /*#__PURE__*/React.createElement("button", {
      key: region.id,
      type: "button",
      className: "btn pn-region" + (focused === region.id ? " on" : ""),
      "aria-pressed": focused === region.id,
      onClick: function onClick() {
        var _atlas$current10;
        setFocused(region.id);
        (_atlas$current10 = atlas.current) === null || _atlas$current10 === void 0 || _atlas$current10.focusRegion(region.id);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "pn-region-id"
    }, region.id), " ", region.name);
  })))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "gr-penrose-atlas",
    status: "established"
  }, "Minkowski and Schwarzschild are drawn from exact conformal maps. Radial light follows the diagonal null directions; diagram distances are not physical distances. Reissner\u2013Nordstr\xF6m is a labelled schematic, not a calculated coordinate map."), /*#__PURE__*/React.createElement("details", {
    className: "pn-math"
  }, /*#__PURE__*/React.createElement("summary", null, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "pn-kicker"
  }, "THE EQUATIONS"), /*#__PURE__*/React.createElement("strong", null, "How is spacetime mapped?"), /*#__PURE__*/React.createElement("small", null, "Open the formulas and connect their terms to the diagram")), /*#__PURE__*/React.createElement("b", {
    "aria-hidden": "true"
  }, "+")), /*#__PURE__*/React.createElement("p", null, "First stretch the radial coordinate near the horizon. Then form the light coordinates ", /*#__PURE__*/React.createElement(Eq, {
    tex: "u=t-r^*,\\\\quad v=t+r^*"
  }), " and their Kruskal counterparts U and V. Finally compress them into the diagram coordinates T and R. Select U or V in the Schwarzschild view to highlight its family of light rays."), /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Tortoise coordinate",
    formulaId: "penrose-tortoise",
    status: "established",
    symbols: [{
      s: "r",
      d: "Schwarzschild radial coordinate."
    }, {
      s: "r^*",
      d: "The tortoise coordinate: the radial coordinate in which light rays move at 45 degrees. It goes to $-\\infty$ at the horizon, which is what the Kruskal chart repairs."
    }, {
      s: "M",
      d: "Black-hole mass, a length in geometric units ($G=c=1$)."
    }],
    meaning: "A change of radial coordinate that stretches the region near the horizon without bound. Written with the absolute value it is defined inside the horizon too, which is what makes the maximal extension possible.",
    limits: "Geometric units. $r^*\\\\to-\\\\infty$ at $r=2M$ and $r^*\\\\to+\\\\infty$ as $r\\\\to\\\\infty$; the coordinate covers each side of the horizon separately."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Kruskal coordinates",
    formulaId: "penrose-compact-t",
    status: "established",
    symbols: [{
      s: "U",
      d: "Retarded null coordinate, $U=-e^{-(t-r^*)/4M}$. Vanishes on the horizon, negative in region I and positive in region II."
    }, {
      s: "V",
      d: "Advanced null coordinate. In region I, $V=e^{(t+r^*)/4M}$; its sign changes between Kruskal regions and it is zero on a horizon."
    }, {
      s: "T",
      d: "The compactified time of the diagram, $T=\\arctan U+\\arctan V$."
    }],
    meaning: "The chart in which the horizon is not a coordinate singularity: $U$ and $V$ are smooth across it. Compactifying both with the same arctan turns the infinite Kruskal plane into the finite diagram and keeps every light ray at 45 degrees.",
    limits: "The compactification is not a physical change: $T$ and $R$ have no units of time or length, and distances on the diagram are not proper distances."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Outgoing light coordinate U",
    formulaId: "penrose-kruskal-u",
    status: "established",
    meaning: "In region I, U stays constant along an outgoing radial light ray. Kruskal coordinates extend smoothly across the horizon.",
    limits: "The displayed exponential uses the exterior region I sign convention; the full extension uses different signs in other regions."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Ingoing light coordinate V",
    formulaId: "penrose-kruskal-v",
    status: "established",
    meaning: "In region I, V stays constant along an ingoing radial light ray.",
    limits: "The displayed exponential uses the exterior region I sign convention; the full extension uses different signs in other regions."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Compactified radial coordinate",
    formulaId: "penrose-compact-r",
    status: "established",
    symbols: [{
      s: "R",
      d: "The compactified radial coordinate, $R=\\arctan V-\\arctan U$."
    }, {
      s: "U",
      d: "Retarded null coordinate."
    }, {
      s: "V",
      d: "Advanced null coordinate."
    }],
    meaning: "With $T=\\\\arctan U+\\\\arctan V$ this completes the map from the Kruskal plane to the diagram. Because only one of $U$ and $V$ moves along a light ray, every null direction comes out at exactly 45 degrees.",
    limits: "Region I is $R>|T|$, region II $T>|R|$, region III $R<-|T|$ and region IV $T<-|R|$: the four wedges between the horizons."
  })), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "gr-penrose-reissner-nordstrom",
    status: "schematic"
  }, "The right-hand panel is a ", /*#__PURE__*/React.createElement("strong", null, "schematic"), " and is labelled as one in the canvas. It states three things: that ", /*#__PURE__*/React.createElement(Eq, {
    tex: "r_+"
  }), " and ", /*#__PURE__*/React.createElement(Eq, {
    tex: "r_-"
  }), " are null surfaces, so the diagram edges they form run at 45 degrees; that the singularity at ", /*#__PURE__*/React.createElement(Eq, {
    tex: "r=0"
  }), " is ", /*#__PURE__*/React.createElement("em", null, "timelike"), " \u2014 a vertical line here, where Schwarzschild's is horizontal \u2014 and so can be avoided; and that the regions nest ", /*#__PURE__*/React.createElement(Eq, {
    tex: "r>r_+"
  }), ", then", " ", /*#__PURE__*/React.createElement(Eq, {
    tex: "r_-<r<r_+"
  }), ", then ", /*#__PURE__*/React.createElement(Eq, {
    tex: "0<r<r_-"
  }), ". The exact maximal extension is an infinite chain of such blocks joined at ", /*#__PURE__*/React.createElement(Eq, {
    tex: "r_-"
  }), ", which is a Cauchy horizon: data on it does not determine the future. Charged black holes with ", /*#__PURE__*/React.createElement(Eq, {
    tex: "|Q|"
  }), " comparable to ", /*#__PURE__*/React.createElement(Eq, {
    tex: "M"
  }), " are not expected to exist in the sky \u2014 the surrounding plasma neutralises them \u2014 so this panel is about the structure of the solution, not about an object.")));
}
function pnPointTex(point) {
  return String.raw(_templateObject3 || (_templateObject3 = _taggedTemplateLiteral(["T=", ",quad R=", ""], ["T=", ",\\quad R=", ""])), point.T.toFixed(3), point.R.toFixed(3));
}
window.PenroseAtlas = PenroseAtlas;