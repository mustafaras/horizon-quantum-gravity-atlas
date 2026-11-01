/* Compiled from js/app.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// app.jsx — HORIZON · Quantum Gravity Atlas application shell

/* ---------- brand logomark (event-horizon glyph) ---------- */
function HorizonMark(_ref) {
  var className = _ref.className;
  return /*#__PURE__*/React.createElement("svg", {
    className: className,
    viewBox: "0 0 40 40",
    fill: "none",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "20",
    cy: "20",
    r: "18",
    stroke: "var(--acc)",
    strokeWidth: "0.8",
    opacity: "0.28"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "20",
    cy: "20",
    r: "12.5",
    stroke: "var(--acc)",
    strokeWidth: "1",
    opacity: "0.55"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "20",
    cy: "20",
    r: "6.6",
    fill: QGA_TOKENS.css("pigment-grey-11")
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "20",
    cy: "20",
    r: "6.6",
    stroke: "var(--gold)",
    strokeWidth: "1.4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "20",
    cy: "20",
    r: "6.6",
    stroke: "var(--gold)",
    strokeWidth: "3",
    opacity: "0.18"
  }), /*#__PURE__*/React.createElement("g", {
    className: "bm-orbit"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "32.5",
    cy: "20",
    r: "2.1",
    fill: "var(--acc)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7.5",
    cy: "20",
    r: "1.2",
    fill: QGA_TOKENS.css("pigment-blue-90"),
    opacity: "0.7"
  })));
}

/* ---------- cinematic intro splash (once per session) ---------- */
function HorizonIntro() {
  var seen = function () {
    try {
      return sessionStorage.getItem("horizon-intro") === "1";
    } catch (e) {
      return false;
    }
  }();
  var _useState = useState(seen),
    _useState2 = _slicedToArray(_useState, 2),
    gone = _useState2[0],
    setGone = _useState2[1];
  var _useState3 = useState(false),
    _useState4 = _slicedToArray(_useState3, 2),
    dismissing = _useState4[0],
    setDismissing = _useState4[1];
  useEffect(function () {
    if (seen) return;
    try {
      sessionStorage.setItem("horizon-intro", "1");
    } catch (e) {}
    var t = setTimeout(function () {
      return setGone(true);
    }, 3000);
    return function () {
      return clearTimeout(t);
    };
  }, []); // eslint-disable-line
  var skip = function skip() {
    setDismissing(true);
    setTimeout(function () {
      return setGone(true);
    }, 460);
  };
  if (gone) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "horizon-intro" + (dismissing ? " dismissed" : ""),
    onClick: skip,
    role: "button",
    tabIndex: 0,
    "aria-label": "Enter the atlas",
    onKeyDown: function onKeyDown(e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") skip();
    }
  }, /*#__PURE__*/React.createElement(HorizonMark, {
    className: "intro-mark"
  }), /*#__PURE__*/React.createElement("div", {
    className: "intro-word",
    "aria-label": "HORIZON"
  }, "HORIZON".split("").map(function (c, i) {
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        animationDelay: 0.35 + i * 0.07 + "s"
      }
    }, c);
  })), /*#__PURE__*/React.createElement("div", {
    className: "intro-line"
  }), /*#__PURE__*/React.createElement("div", {
    className: "intro-tag"
  }, "Quantum Gravity Atlas"), /*#__PURE__*/React.createElement("div", {
    className: "intro-skip"
  }, "Click to enter"));
}
var QGA_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": QGA_TOKENS.css("accent"),
  "starfield": true,
  "uiScale": 15.5,
  "vizMode": "cinematic",
  "motion": "balanced",
  "detail3d": "medium",
  "renderBackend": "auto",
  "toneMapping": "agx",
  "labels3d": true,
  "annotations3d": true,
  "pathway": "student"
} /*EDITMODE-END*/;
var QGA_VIEWS = {
  overview: {
    label: "Atlas overview",
    comp: function comp() {
      return window.ViewOverview;
    }
  },
  sm: {
    comp: function comp() {
      return window.ModuleSM;
    }
  },
  qft: {
    comp: function comp() {
      return window.ModuleQFT;
    }
  },
  rg: {
    comp: function comp() {
      return window.ModuleRG;
    }
  },
  gr: {
    comp: function comp() {
      return window.ModuleGR;
    }
  },
  planck: {
    comp: function comp() {
      return window.ModulePlanck;
    }
  },
  approaches: {
    comp: function comp() {
      return window.ModuleApproaches;
    }
  },
  bh: {
    comp: function comp() {
      return window.ModuleBH;
    }
  },
  exp: {
    comp: function comp() {
      return window.ModuleExp;
    }
  },
  glossary: {
    label: "Glossary",
    comp: function comp() {
      return window.ViewGlossary;
    }
  },
  symbols: {
    label: "Symbol Atlas",
    comp: function comp() {
      return window.ViewSymbols;
    }
  },
  refs: {
    label: "References",
    comp: function comp() {
      return window.ViewReferences;
    }
  },
  open: {
    label: "Open Problems",
    comp: function comp() {
      return window.ViewOpenProblems;
    }
  },
  paper: {
    label: "Whitepaper",
    comp: function comp() {
      return window.ViewWhitepaper;
    }
  },
  compare: {
    label: "Compare",
    comp: function comp() {
      return window.CompareView;
    }
  }
};

// per-module background tint (hsl hue) — drives the cinematic scene change
var QGA_VIEW_HUE = {
  overview: 226,
  sm: 268,
  qft: 196,
  rg: 226,
  gr: 44,
  planck: 226,
  approaches: 282,
  bh: 36,
  exp: 196,
  glossary: 226,
  symbols: 226,
  refs: 226,
  open: 226,
  paper: 226,
  compare: 210
};
var QGA_STATE_DEFAULTS = window.QGA_DEFAULT_STATE || {
  view: "overview",
  pathway: "student",
  bhMass: 1,
  bhSpin: 0,
  gwMode: "generated",
  gwEvent: "GW150914",
  gwDetector: "H1",
  gwStart: 1126259446,
  gwDuration: 16,
  seed: 42
};
function NavList(_ref2) {
  var view = _ref2.view,
    go = _ref2.go;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "nav-group-label"
  }, "Modules"), /*#__PURE__*/React.createElement("button", {
    className: "nav-item" + (view === "overview" ? " active" : ""),
    onClick: function onClick() {
      return go("overview");
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "nav-num"
  }, "\u25C6"), " Atlas overview"), QGA_MODULES.map(function (m) {
    return /*#__PURE__*/React.createElement("button", {
      key: m.id,
      className: "nav-item" + (view === m.id ? " active" : ""),
      onClick: function onClick() {
        return go(m.id);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "nav-num"
    }, m.num), " ", m["short"]);
  }), /*#__PURE__*/React.createElement("div", {
    className: "nav-group-label"
  }, "Reference"), ["glossary", "symbols", "refs", "open", "paper"].map(function (id) {
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      className: "nav-item" + (view === id ? " active" : ""),
      onClick: function onClick() {
        return go(id);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "nav-num"
    }, "\xB7"), " ", QGA_VIEWS[id].label);
  }));
}
function PathwaySelector(_ref3) {
  var value = _ref3.value,
    onChange = _ref3.onChange;
  return /*#__PURE__*/React.createElement("div", {
    className: "pathway-box"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pathway-label"
  }, "Learning pathway"), /*#__PURE__*/React.createElement("div", {
    className: "pathway-seg",
    role: "radiogroup",
    "aria-label": "Learning pathway"
  }, QGA_PATHWAYS.map(function (p) {
    return /*#__PURE__*/React.createElement("button", {
      key: p.id,
      className: value === p.id ? "on" : "",
      role: "radio",
      "aria-checked": value === p.id,
      title: p.blurb,
      onClick: function onClick() {
        return onChange(p.id);
      }
    }, p.label);
  })), /*#__PURE__*/React.createElement("p", {
    className: "small dim",
    style: {
      margin: "8px 0 0 0",
      fontSize: 11,
      lineHeight: 1.5
    }
  }, QGA_PATHWAYS.find(function (p) {
    return p.id === value;
  }).blurb));
}
function RenderDiagnosticsDrawer() {
  var _useState5 = useState(function () {
      return QGA_RENDER.renderDiagnostics.snapshot();
    }),
    _useState6 = _slicedToArray(_useState5, 2),
    entries = _useState6[0],
    setEntries = _useState6[1];
  useEffect(function () {
    return QGA_RENDER.renderDiagnostics.subscribe(function () {
      return setEntries(QGA_RENDER.renderDiagnostics.snapshot());
    });
  }, []);
  return /*#__PURE__*/React.createElement("details", {
    className: "render-diagnostics"
  }, /*#__PURE__*/React.createElement("summary", null, "Developer rendering diagnostics"), /*#__PURE__*/React.createElement("p", {
    className: "small dim"
  }, "Actual initialized backends and effects. Adaptive budgets change rendering only, not scientific state."), entries.map(function (entry) {
    var _entry$capabilities, _entry$dpr;
    return /*#__PURE__*/React.createElement("section", {
      key: entry.id,
      className: "render-diagnostic-entry"
    }, /*#__PURE__*/React.createElement("h3", null, entry.label), /*#__PURE__*/React.createElement("p", {
      className: "mono small"
    }, entry.phase, " \xB7 ", entry.backend, " / ", ((_entry$capabilities = entry.capabilities) === null || _entry$capabilities === void 0 ? void 0 : _entry$capabilities.rendererPath) || "pending", " \xB7", " ", entry.fps ? entry.fps.toFixed(1) + " FPS" : "FPS not sampled", " \xB7 DPR ", ((_entry$dpr = entry.dpr) === null || _entry$dpr === void 0 ? void 0 : _entry$dpr.toFixed(2)) || "—"), entry.quality ? /*#__PURE__*/React.createElement("p", {
      className: "small"
    }, "Particles \u2264 ", entry.quality.particleBudget, "; temporal budget gate ", entry.quality.temporalSamples, " (TRAA uses fixed 32-position jitter);", " ", "volumetric budget ", entry.quality.raySteps, " (used only by opt-in visual effects).") : null, /*#__PURE__*/React.createElement("ul", null, entry.effects.map(function (effect) {
      return /*#__PURE__*/React.createElement("li", {
        key: effect.name
      }, effect.name, ": ", /*#__PURE__*/React.createElement("strong", null, effect.status), effect.reason ? " — " + effect.reason : "");
    })), entry.messages.map(function (message, i) {
      return /*#__PURE__*/React.createElement("p", {
        className: "small",
        key: i
      }, message);
    }));
  }));
}
function RenderSetting(_ref4) {
  var label = _ref4.label,
    value = _ref4.value,
    options = _ref4.options,
    _onChange = _ref4.onChange;
  return /*#__PURE__*/React.createElement("label", {
    className: "twk-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-lbl"
  }, label), /*#__PURE__*/React.createElement("select", {
    className: "twk-field render-select",
    "aria-label": label,
    value: value,
    onChange: function onChange(event) {
      return _onChange(event.target.value);
    }
  }, options.map(function (option) {
    return /*#__PURE__*/React.createElement("option", {
      key: option,
      value: option
    }, option);
  })));
}

/* ---------- cinematic tour bar (Prompt 09) ----------
   Visible transport for the camera director: play/pause, shot progress,
   chapter title, and an explicit take-control switch. User orbit/pan/zoom
   on any flagship scene pauses automation immediately (Scene3D notifies
   the director), and this bar reflects it. Under reduced motion the tour
   does not interpolate the camera: play is disabled and only explicit
   deep links / scroll place the camera instantly. */
function CinemaBar(_ref5) {
  var reducedMotion = _ref5.reducedMotion;
  var C = window.QGA_CINEMATIC;
  var _useState7 = useState(function () {
      return C ? C.state : null;
    }),
    _useState8 = _slicedToArray(_useState7, 2),
    st = _useState8[0],
    setSt = _useState8[1];
  var _useState9 = useState(0),
    _useState0 = _slicedToArray(_useState9, 2),
    progress = _useState0[0],
    setProgress = _useState0[1];
  useEffect(function () {
    return C ? C.subscribe(setSt) : undefined;
  }, []); // eslint-disable-line
  var playing = !!(st && st.playing);
  useEffect(function () {
    if (!C || !st || !st.hasBar) return undefined;
    var id = setInterval(function () {
      return setProgress(C.progress());
    }, 200);
    return function () {
      return clearInterval(id);
    };
  }, [C, st && st.hasBar, playing]); // eslint-disable-line
  if (!C || !st || !st.hasBar || !st.shot) return null;
  var shot = st.shot;
  var p = playing ? progress : st.progress;
  var pct = Math.round(Math.min(1, Math.max(0, p)) * 100);
  var userInControl = st.control === "user";
  return /*#__PURE__*/React.createElement("div", {
    className: "cinema-bar",
    role: "group",
    "aria-label": "Cinematic tour"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn cinema-play",
    "aria-pressed": playing,
    disabled: reducedMotion,
    title: reducedMotion ? "Camera interpolation is disabled under reduced motion" : playing ? "Pause the tour" : "Play the tour",
    onClick: function onClick() {
      return C.toggle();
    }
  }, playing ? "❚❚" : "▶"), /*#__PURE__*/React.createElement("div", {
    className: "cinema-progress",
    role: "progressbar",
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": pct,
    "aria-label": "Shot progress"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cinema-progress-fill",
    style: {
      transform: "scaleX(" + pct / 100 + ")"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "cinema-title",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cinema-chapter"
  }, shot.chapter), /*#__PURE__*/React.createElement("span", {
    className: "cinema-shot-title"
  }, shot.title), shot.annotations && shot.annotations.length ? /*#__PURE__*/React.createElement("span", {
    className: "cinema-annot"
  }, shot.annotations.join(" · ")) : null), /*#__PURE__*/React.createElement("button", {
    className: "btn cinema-control",
    "aria-pressed": userInControl,
    title: userInControl ? "Hand the camera back to the tour" : "Pause automation; the camera is yours",
    onClick: function onClick() {
      return userInControl ? C.releaseControl() : C.takeControl();
    }
  }, userInControl ? "Resume tour" : "Take control"));
}
function TransitionNotice() {
  var C = window.QGA_CINEMATIC;
  var _useState1 = useState(null),
    _useState10 = _slicedToArray(_useState1, 2),
    error = _useState10[0],
    setError = _useState10[1];
  var _useState11 = useState(null),
    _useState12 = _slicedToArray(_useState11, 2),
    dismissedFor = _useState12[0],
    setDismissedFor = _useState12[1];
  useEffect(function () {
    return C ? C.subscribe(function (s) {
      return setError(s.transitionError);
    }) : undefined;
  }, []); // eslint-disable-line
  if (!C || !error || dismissedFor === error) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "cinema-notice",
    role: "alert"
  }, /*#__PURE__*/React.createElement("span", null, "Cinematic transitions are running in crossfade mode: ", error), /*#__PURE__*/React.createElement("button", {
    className: "btn cinema-notice-close",
    "aria-label": "Dismiss transition notice",
    onClick: function onClick() {
      return setDismissedFor(error);
    }
  }, "Dismiss"));
}

/** The readouts the page is showing, as the studio and the report route both read them. */
function collectPageReadouts() {
  var out = [];
  var _iterator = _createForOfIteratorHelper(document.querySelectorAll(".readout, .fc-readout")),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _node$querySelector$t, _node$querySelector, _node$querySelector$t2, _node$querySelector2, _node$querySelector$t3, _node$querySelector3;
      var node = _step.value;
      var label = ((_node$querySelector$t = (_node$querySelector = node.querySelector(".readout-label, .fc-readout-label")) === null || _node$querySelector === void 0 ? void 0 : _node$querySelector.textContent) !== null && _node$querySelector$t !== void 0 ? _node$querySelector$t : "").trim();
      var value = ((_node$querySelector$t2 = (_node$querySelector2 = node.querySelector(".readout-value, .fc-readout-value")) === null || _node$querySelector2 === void 0 ? void 0 : _node$querySelector2.textContent) !== null && _node$querySelector$t2 !== void 0 ? _node$querySelector$t2 : "").trim();
      var unit = ((_node$querySelector$t3 = (_node$querySelector3 = node.querySelector(".unit")) === null || _node$querySelector3 === void 0 ? void 0 : _node$querySelector3.textContent) !== null && _node$querySelector$t3 !== void 0 ? _node$querySelector$t3 : "").trim();
      if (label) out.push({
        label: label,
        value: value || null,
        unit: unit || null,
        status: null
      });
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return out.slice(0, 40);
}

/** The formula cards the page is showing, in document order. */
function collectPageFormulas() {
  return _toConsumableArray(document.querySelectorAll(".formula-card")).map(function (card) {
    var _card$querySelector$t, _card$querySelector, _card$querySelector$t2, _card$querySelector2, _card$querySelector$t3, _card$querySelector3;
    var title = ((_card$querySelector$t = (_card$querySelector = card.querySelector(".fc-title")) === null || _card$querySelector === void 0 ? void 0 : _card$querySelector.textContent) !== null && _card$querySelector$t !== void 0 ? _card$querySelector$t : "").trim();
    var tex = (_card$querySelector$t2 = (_card$querySelector2 = card.querySelector(".fc-eq .katex-mathml annotation")) === null || _card$querySelector2 === void 0 || (_card$querySelector2 = _card$querySelector2.textContent) === null || _card$querySelector2 === void 0 ? void 0 : _card$querySelector2.trim()) !== null && _card$querySelector$t2 !== void 0 ? _card$querySelector$t2 : null;
    var status = ((_card$querySelector$t3 = (_card$querySelector3 = card.querySelector(".badge")) === null || _card$querySelector3 === void 0 ? void 0 : _card$querySelector3.textContent) !== null && _card$querySelector$t3 !== void 0 ? _card$querySelector$t3 : "").trim().toLowerCase() || null;
    return title || tex ? {
      id: null,
      title: title || null,
      tex: tex,
      status: status
    } : null;
  }).filter(Boolean).slice(0, 24);
}

/**
 * The offline/update notice (S33).
 *
 * Two states are worth showing: "ready offline" once, so a reader learns the atlas works without a network, and "a new
 * version is waiting", which offers a reload and does nothing until it is clicked.
 */
function OfflineNotice() {
  var _useState13 = useState(null),
    _useState14 = _slicedToArray(_useState13, 2),
    state = _useState14[0],
    setState = _useState14[1];
  var _useState15 = useState(new Set()),
    _useState16 = _slicedToArray(_useState15, 2),
    dismissed = _useState16[0],
    setDismissed = _useState16[1];
  var controllerRef = useRef(null);
  useEffect(function () {
    var PWA = window.QGA_PWA;
    if (!PWA) return undefined;
    var controller = PWA.createController();
    controllerRef.current = controller;
    if (!controller.supported) return undefined;
    var off = controller.subscribe(function (_ref6) {
      var next = _ref6.state;
      return setState(next);
    });
    void controller.register();
    return function () {
      off();
      controllerRef.current = null;
    };
  }, []);
  if (!state || dismissed.has(state)) return null;
  if (state !== "offline-ready" && state !== "update-available") return null;
  var isUpdate = state === "update-available";
  return /*#__PURE__*/React.createElement("div", {
    className: "offline-notice",
    role: isUpdate ? "alert" : "status"
  }, /*#__PURE__*/React.createElement("span", null, isUpdate ? window.QGA_PWA.updateNoticeText() : "The atlas is cached and will open without a network."), isUpdate ? /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      var _controllerRef$curren;
      return (_controllerRef$curren = controllerRef.current) === null || _controllerRef$curren === void 0 ? void 0 : _controllerRef$curren.applyUpdate();
    }
  }, "Reload now") : null, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    "aria-label": "Dismiss this notice",
    onClick: function onClick() {
      return setDismissed(function (current) {
        return new Set(current).add(state);
      });
    }
  }, "Dismiss"));
}
function App() {
  var _useTweaks = useTweaks(QGA_TWEAK_DEFAULTS),
    _useTweaks2 = _slicedToArray(_useTweaks, 2),
    t = _useTweaks2[0],
    setTweak = _useTweaks2[1];
  var prm = usePRM();
  var _useQGAState = useQGAState(),
    _useQGAState2 = _slicedToArray(_useQGAState, 2),
    atlasState = _useQGAState2[0],
    setAtlasState = _useQGAState2[1];
  // Prompt 10 compare embeds: #embed-A / #embed-B renders the minimal shell
  // (no sidebar/topbar/intro/tweaks) and answers the compare controller.
  var embedRole = window.location.hash === "#embed-A" ? "A" : window.location.hash === "#embed-B" ? "B" : null;
  var embed = embedRole != null;
  var _useState17 = useState(function () {
      try {
        var v = qgaReadState().view;
        return v && QGA_VIEWS[v] ? v : "overview";
      } catch (e) {
        return "overview";
      }
    }),
    _useState18 = _slicedToArray(_useState17, 2),
    view = _useState18[0],
    setView = _useState18[1];
  var stateView = atlasState.view;
  useEffect(function () {
    if (stateView !== view) setView(stateView);
  }, [stateView]); // eslint-disable-line
  var _useState19 = useState(false),
    _useState20 = _slicedToArray(_useState19, 2),
    menuOpen = _useState20[0],
    setMenuOpen = _useState20[1];
  var _useState21 = useState(false),
    _useState22 = _slicedToArray(_useState21, 2),
    snapshotsOpen = _useState22[0],
    setSnapshotsOpen = _useState22[1];
  var _useState23 = useState(false),
    _useState24 = _slicedToArray(_useState23, 2),
    toursOpen = _useState24[0],
    setToursOpen = _useState24[1];
  // `?export=1` opens the studio on mount, so a capture or a shared link can name the drawer.
  var _useState25 = useState(function () {
      return atlasState.studio === "1";
    }),
    _useState26 = _slicedToArray(_useState25, 2),
    studioOpen = _useState26[0],
    setStudioOpen = _useState26[1];
  var _useState27 = useState(null),
    _useState28 = _slicedToArray(_useState27, 2),
    report = _useState28[0],
    setReport = _useState28[1];
  var contentRef = useRef(null);
  var openRenderingSettings = function openRenderingSettings() {
    return window.postMessage({
      type: "__activate_edit_mode"
    }, location.origin);
  };
  // Formula linking + palette navigation read the live view id.
  useEffect(function () {
    window.__qgaCurrentView = view;
  }, [view]);
  // The publishing studio names the view it exports; the shell is the one place that knows both the id and the title.
  useEffect(function () {
    var _ref7, _QGA_VIEWS$view$label, _QGA_VIEWS$view, _QGA_MODULES$find;
    window.__qgaCurrentViewTitle = (_ref7 = (_QGA_VIEWS$view$label = (_QGA_VIEWS$view = QGA_VIEWS[view]) === null || _QGA_VIEWS$view === void 0 ? void 0 : _QGA_VIEWS$view.label) !== null && _QGA_VIEWS$view$label !== void 0 ? _QGA_VIEWS$view$label : (_QGA_MODULES$find = QGA_MODULES.find(function (m) {
      return m.id === view;
    })) === null || _QGA_MODULES$find === void 0 ? void 0 : _QGA_MODULES$find.title) !== null && _ref7 !== void 0 ? _ref7 : view;
  }, [view]);
  // Palette action hook: "Save snapshot" opens this panel from ⌘K.
  useEffect(function () {
    window.QGA_OPEN_SNAPSHOTS = function () {
      return setSnapshotsOpen(true);
    };
    // Guided tours (S31): the palette's "Guided tours" entry uses the same
    // hook shape as snapshots, so a reader can reach the launcher from ⌘K.
    window.QGA_OPEN_TOURS = function () {
      return setToursOpen(true);
    };
    // Publishing studio (S32): the palette and the sidebar both open the same drawer.
    window.QGA_OPEN_EXPORT = function () {
      return setStudioOpen(true);
    };
    return function () {
      if (window.QGA_OPEN_SNAPSHOTS) delete window.QGA_OPEN_SNAPSHOTS;
      if (window.QGA_OPEN_TOURS) delete window.QGA_OPEN_TOURS;
      if (window.QGA_OPEN_EXPORT) delete window.QGA_OPEN_EXPORT;
    };
  }, []);

  // `?export=report` opens the print view directly: a report is a document a reader can link to, not only a button
  // inside a drawer. It is built from the rendered page, which is what the report is supposed to document.
  useEffect(function () {
    if (atlasState.studio !== "report" || report) return;
    var timer = setTimeout(function () {
      if (!window.QGA_EXPORT) return;
      try {
        var _window$__qgaCurrentV, _settings$renderBacke, _settings$detail3d, _atlasState$seed, _window$QGA_COMMIT;
        var built = window.QGA_EXPORT.buildLabReport({
          view: view,
          viewTitle: (_window$__qgaCurrentV = window.__qgaCurrentViewTitle) !== null && _window$__qgaCurrentV !== void 0 ? _window$__qgaCurrentV : view,
          state: atlasState,
          settings: settings,
          backend: (_settings$renderBacke = settings.renderBackend) !== null && _settings$renderBacke !== void 0 ? _settings$renderBacke : "auto",
          quality: (_settings$detail3d = settings.detail3d) !== null && _settings$detail3d !== void 0 ? _settings$detail3d : "medium",
          readouts: window.__qgaReportReadouts ? window.__qgaReportReadouts() : collectPageReadouts(),
          formulas: window.__qgaReportFormulas ? window.__qgaReportFormulas() : collectPageFormulas(),
          seed: (_atlasState$seed = atlasState.seed) !== null && _atlasState$seed !== void 0 ? _atlasState$seed : 42,
          commitHash: (_window$QGA_COMMIT = window.QGA_COMMIT) !== null && _window$QGA_COMMIT !== void 0 ? _window$QGA_COMMIT : null
        });
        window.dispatchEvent(new CustomEvent("qga-open-report", {
          detail: {
            report: built
          }
        }));
      } catch (error) {
        console.warn("[report] could not build from the page:", error.message);
      }
    }, 1200);
    return function () {
      return clearTimeout(timer);
    };
  }, [atlasState.studio, report, view, atlasState]);

  // The studio builds the report; the shell shows it. A report is a navigation like a view, so it clears the tour.
  useEffect(function () {
    var onReport = function onReport(event) {
      var _event$detail$report, _event$detail;
      setStudioOpen(false);
      setReport((_event$detail$report = (_event$detail = event.detail) === null || _event$detail === void 0 ? void 0 : _event$detail.report) !== null && _event$detail$report !== void 0 ? _event$detail$report : null);
      setAtlasState({
        tour: "",
        tourStep: 1,
        tourPrint: ""
      }, {
        replace: false
      });
      if (contentRef.current) contentRef.current.scrollTop = 0;
      window.scrollTo(0, 0);
    };
    window.addEventListener("qga-open-report", onReport);
    return function () {
      return window.removeEventListener("qga-open-report", onReport);
    };
  }, [setAtlasState]);

  // ---- cinematic direction (Prompt 09) ----
  var shotRef = useRef(atlasState.shot);
  shotRef.current = atlasState.shot;
  useEffect(function () {
    var C = window.QGA_CINEMATIC;
    if (!C) return undefined;
    C.configure({
      reducedMotion: prm,
      vizMode: t.vizMode
    });
    // Deep-linked shots place the camera at the shot start; nothing autoplays
    // (and this system never touches audio).
    C.setView(view, {
      shot: shotRef.current
    });
    C.refreshScroll();
    return undefined;
  }, [view, prm, t.vizMode]); // eslint-disable-line
  // Mirror the active shot into the URL (replaceState: no history spam), so
  // back navigation restores the exact view + shot pair. The guard compares
  // against the last requested id, not the URL: React batches the writes, so
  // the URL lags behind rapid shot transitions.
  useEffect(function () {
    var C = window.QGA_CINEMATIC;
    if (!C) return undefined;
    var pendingShot = null;
    return C.subscribe(function (s) {
      var id = s.shot ? s.shot.id : "";
      if (id !== pendingShot) {
        pendingShot = id;
        setAtlasState({
          shot: id
        }, {
          replace: true
        });
      }
    });
  }, []); // eslint-disable-line

  var go = function go(id) {
    if (id !== view && window.QGA_CINEMATIC) window.QGA_CINEMATIC.runTransition();
    setView(id);
    setAtlasState({
      view: id,
      shot: ""
    }, {
      replace: false
    });
    try {
      localStorage.setItem("qga-view", id);
    } catch (e) {}
    setMenuOpen(false);
    if (contentRef.current) contentRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
  };

  /* ---- guided tours (S31) ----
     A tour step is a URL, not a piece of component state: moving a step calls the same writer the URL reader uses, so
     the back button walks the tour backwards and a step a teacher copies is a working link. The tour id, its step and
     the worksheet flag all come from the shared state below. */
  var tourId = atlasState.tour || "";
  var tourStepNumber = atlasState.tourStep || 1;
  var tourPrint = atlasState.tourPrint === "1";
  var openTour = useCallback(function (payload) {
    var target = payload.view,
      patch = payload.patch,
      formulaFocus = payload.formulaFocus,
      shot = payload.shot,
      step = payload.step,
      tour = payload.tour,
      print = payload.print;
    var nextView = target && QGA_VIEWS[target] ? target : view;
    if (nextView !== view && window.QGA_CINEMATIC) window.QGA_CINEMATIC.runTransition();
    setView(nextView);
    setAtlasState(_objectSpread(_objectSpread(_objectSpread(_objectSpread({
      view: nextView,
      shot: shot || ""
    }, tour !== undefined ? {
      tour: tour
    } : {}), step ? {
      tourStep: step
    } : {}), print !== undefined ? {
      tourPrint: print ? "1" : ""
    } : {}), patch ? patch : {}), {
      replace: false
    });
    setMenuOpen(false);
    if (contentRef.current) contentRef.current.scrollTop = 0;
    // The formula card listens for this event in the current view, and
    // __qgaPendingFormulaFocus carries the request across a view change.
    if (formulaFocus) {
      window.__qgaPendingFormulaFocus = formulaFocus;
      window.dispatchEvent(new CustomEvent("qga-open-formula", {
        detail: {
          title: formulaFocus
        }
      }));
    }
  }, [view, setAtlasState]);
  var closeTour = useCallback(function () {
    setAtlasState({
      tour: "",
      tourStep: 1,
      tourPrint: ""
    }, {
      replace: false
    });
  }, [setAtlasState]);

  // Compare embed protocol: render-mode settings + silent state patches
  // (parameter tweens) + readiness announcement. The role itself is set at
  // script evaluation (child effects run before parent effects).
  useEffect(function () {
    var _window$parent;
    if (!embed) return undefined;
    (_window$parent = window.parent) === null || _window$parent === void 0 || _window$parent.postMessage({
      type: "qga-embed-ready",
      side: embedRole,
      view: view
    }, "*");
    var onMessage = function onMessage(event) {
      var _window$QGA_APPLY_SIL, _window;
      var data = event.data;
      if (!data || typeof data.type !== "string") return;
      if (data.type === "qga-embed-settings" && data.vizMode) setTweak("vizMode", data.vizMode);else if (data.type === "qga-state-patch" && data.patch) (_window$QGA_APPLY_SIL = (_window = window).QGA_APPLY_SILENT) === null || _window$QGA_APPLY_SIL === void 0 || _window$QGA_APPLY_SIL.call(_window, data.patch);
    };
    window.addEventListener("message", onMessage);
    return function () {
      window.removeEventListener("message", onMessage);
    };
  }, [embed, embedRole, view, setTweak]);

  // settings derived from tweaks (system reduced-motion always wins)
  var effMotion = prm ? "reduced" : t.motion;
  var settings = useMemo(function () {
    return {
      vizMode: t.vizMode,
      motion: effMotion,
      detail3d: t.detail3d,
      renderBackend: t.renderBackend || "auto",
      toneMapping: t.toneMapping || "agx",
      labels3d: !!t.labels3d,
      annotations3d: !!t.annotations3d,
      pathway: atlasState.pathway,
      hdrEnvironment: t.hdrEnvironment === true
    };
  }, [t.vizMode, effMotion, t.detail3d, t.renderBackend, t.toneMapping, t.labels3d, t.annotations3d, atlasState.pathway, t.hdrEnvironment]);

  // apply tweaks to CSS custom properties + motion attribute
  useEffect(function () {
    var root = document.documentElement;
    root.style.setProperty("--acc", t.accent);
    root.style.setProperty("--acc-soft", t.accent + "24");
    root.style.setProperty("font-size", t.uiScale + "px");
    document.body.style.fontSize = t.uiScale + "px";
    root.setAttribute("data-motion", effMotion);
  }, [t.accent, t.uiScale, effMotion]);
  var starfieldOn = !!t.starfield && t.vizMode !== "minimal";
  var motionScale = effMotion === "reduced" ? 0 : effMotion === "balanced" ? 0.55 : 1;
  var Comp = QGA_VIEWS[view].comp();

  // Compare embeds render the minimal shell: the view component only.
  if (embed) {
    return /*#__PURE__*/React.createElement(AtlasSettingsContext.Provider, {
      value: settings
    }, /*#__PURE__*/React.createElement("main", {
      className: "content embed-content"
    }, /*#__PURE__*/React.createElement("div", {
      className: "content-inner embed-inner",
      key: view
    }, Comp ? /*#__PURE__*/React.createElement(Comp, {
      go: go
    }) : /*#__PURE__*/React.createElement("p", {
      className: "dim"
    }, "Loading module\u2026"))));
  }
  return /*#__PURE__*/React.createElement(AtlasSettingsContext.Provider, {
    value: settings
  }, /*#__PURE__*/React.createElement(HorizonIntro, null), starfieldOn ? /*#__PURE__*/React.createElement(AtlasStage, {
    view: view,
    motion: effMotion,
    detail: t.detail3d,
    enabled: true
  }) : /*#__PURE__*/React.createElement(Starfield, {
    enabled: false
  }), /*#__PURE__*/React.createElement("div", {
    className: "shell"
  }, /*#__PURE__*/React.createElement("a", {
    className: "skip-link",
    href: "#main-content"
  }, "Skip to main content"), /*#__PURE__*/React.createElement("nav", {
    className: "sidebar",
    "aria-label": "Module navigation"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, /*#__PURE__*/React.createElement(HorizonMark, {
    className: "brand-mark"
  }), /*#__PURE__*/React.createElement("div", {
    className: "brand-words"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-title"
  }, "HORIZON"), /*#__PURE__*/React.createElement("div", {
    className: "brand-sub"
  }, "Quantum Gravity Atlas"))), /*#__PURE__*/React.createElement(NavList, {
    view: view,
    go: go
  }), /*#__PURE__*/React.createElement(PathwaySelector, {
    value: atlasState.pathway,
    onChange: function onChange(v) {
      return setAtlasState({
        pathway: v
      }, {
        replace: false
      });
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-tools",
    "aria-label": "Atlas tools"
  }, /*#__PURE__*/React.createElement("button", {
    className: "sidebar-tool-btn",
    onClick: function onClick() {
      var _window$QGA_OPEN_PALE, _window2;
      return (_window$QGA_OPEN_PALE = (_window2 = window).QGA_OPEN_PALETTE) === null || _window$QGA_OPEN_PALE === void 0 ? void 0 : _window$QGA_OPEN_PALE.call(_window2);
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u2318"), " Search ", /*#__PURE__*/React.createElement("kbd", null, "\u2318K")), /*#__PURE__*/React.createElement("button", {
    className: "sidebar-tool-btn",
    onClick: function onClick() {
      return go("compare");
    },
    "aria-label": "Open the A/B compare view"
  }, "\u21C4 Compare"), /*#__PURE__*/React.createElement("button", {
    className: "sidebar-tool-btn",
    onClick: function onClick() {
      return setSnapshotsOpen(true);
    },
    "aria-label": "Open the snapshots panel"
  }, "\u25C6 Snapshots"), /*#__PURE__*/React.createElement("button", {
    className: "sidebar-tool-btn",
    onClick: function onClick() {
      return setToursOpen(true);
    },
    "aria-label": "Open the guided tours"
  }, "\u25B6 Tours"), /*#__PURE__*/React.createElement("button", {
    className: "sidebar-tool-btn",
    onClick: function onClick() {
      return setStudioOpen(true);
    },
    "aria-label": "Open the publishing studio"
  }, "\u21E9 Export"), /*#__PURE__*/React.createElement("button", {
    className: "sidebar-tool-btn",
    onClick: function onClick() {
      var _window$QGA_ARM_ANNOT, _window3;
      return (_window$QGA_ARM_ANNOT = (_window3 = window).QGA_ARM_ANNOTATION) === null || _window$QGA_ARM_ANNOT === void 0 ? void 0 : _window$QGA_ARM_ANNOT.call(_window3);
    },
    "aria-label": "Place an annotation pin on the current view"
  }, "\u270E Annotate")), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-foot"
  }, "Scientific status labels mark every claim.", /*#__PURE__*/React.createElement("br", null), "No quantum gravity theory is experimentally confirmed.", /*#__PURE__*/React.createElement("button", {
    className: "btn render-settings-btn",
    onClick: openRenderingSettings
  }, "Rendering settings"))), /*#__PURE__*/React.createElement("div", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "topbar-title"
  }, "HORIZON"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      var _window$QGA_OPEN_PALE2, _window4;
      return (_window$QGA_OPEN_PALE2 = (_window4 = window).QGA_OPEN_PALETTE) === null || _window$QGA_OPEN_PALE2 === void 0 ? void 0 : _window$QGA_OPEN_PALE2.call(_window4);
    },
    "aria-label": "Open search and command palette"
  }, "Search \u2318K"), /*#__PURE__*/React.createElement("button", {
    className: "btn render-settings-btn",
    onClick: openRenderingSettings
  }, "Rendering settings"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            _context.p = 0;
            _context.n = 1;
            return QGA_COPY_LINK(qgaReadState());
          case 1:
            _context.n = 3;
            break;
          case 2:
            _context.p = 2;
            _t = _context.v;
          case 3:
            return _context.a(2);
        }
      }, _callee, null, [[0, 2]]);
    }))
  }, "Copy link"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      return QGA_EXPORT_JSON(qgaReadState());
    }
  }, "Export JSON"), /*#__PURE__*/React.createElement("button", {
    className: "menu-btn",
    onClick: function onClick() {
      return setMenuOpen(true);
    }
  }, "MODULES \u2630")), /*#__PURE__*/React.createElement("main", {
    className: "content",
    id: "main-content",
    tabIndex: -1,
    ref: contentRef
  }, /*#__PURE__*/React.createElement("div", {
    className: "content-inner",
    key: view
  }, report ? /*#__PURE__*/React.createElement(ReportSheet, {
    report: report,
    onClose: function onClose() {
      return setReport(null);
    }
  }) : null, tourId || toursOpen ? /*#__PURE__*/React.createElement(TourSurface, {
    tourId: tourId,
    step: tourStepNumber,
    print: tourPrint,
    onNavigate: openTour,
    onClose: function onClose() {
      setToursOpen(false);
      if (tourId) closeTour();
    }
  }) : null, Comp ? /*#__PURE__*/React.createElement(Comp, {
    go: go
  }) : /*#__PURE__*/React.createElement("p", {
    className: "dim"
  }, "Loading module\u2026"), /*#__PURE__*/React.createElement(AnnotationLayer, {
    view: view
  })))), /*#__PURE__*/React.createElement(CinemaBar, {
    reducedMotion: prm
  }), /*#__PURE__*/React.createElement(OfflineNotice, null), /*#__PURE__*/React.createElement(TransitionNotice, null), menuOpen ? /*#__PURE__*/React.createElement("div", {
    className: "mobile-menu",
    role: "dialog",
    "aria-label": "Navigation menu"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "brand-title",
    style: {
      fontFamily: "var(--font-head)",
      color: "var(--head)",
      fontWeight: 700,
      letterSpacing: "0.2em"
    }
  }, "HORIZON"), /*#__PURE__*/React.createElement("button", {
    className: "menu-btn",
    onClick: function onClick() {
      return setMenuOpen(false);
    }
  }, "CLOSE \u2715")), /*#__PURE__*/React.createElement(NavList, {
    view: view,
    go: go
  }), /*#__PURE__*/React.createElement(PathwaySelector, {
    value: atlasState.pathway,
    onChange: function onChange(v) {
      return setAtlasState({
        pathway: v
      }, {
        replace: false
      });
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-tools",
    "aria-label": "Atlas tools"
  }, /*#__PURE__*/React.createElement("button", {
    className: "sidebar-tool-btn",
    onClick: function onClick() {
      setMenuOpen(false);
      setStudioOpen(true);
    },
    "aria-label": "Open the publishing studio"
  }, "\u21E9 Export"), /*#__PURE__*/React.createElement("button", {
    className: "sidebar-tool-btn",
    onClick: function onClick() {
      setMenuOpen(false);
      setToursOpen(true);
    },
    "aria-label": "Open the guided tours"
  }, "\u25B6 Tours"))) : null, /*#__PURE__*/React.createElement(CommandPalette, {
    go: go
  }), /*#__PURE__*/React.createElement(SnapshotPanel, {
    open: snapshotsOpen,
    onClose: function onClose() {
      return setSnapshotsOpen(false);
    }
  }), /*#__PURE__*/React.createElement(ExportStudio, {
    open: studioOpen,
    onClose: function onClose() {
      return setStudioOpen(false);
    }
  }), /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Visualization"
  }), /*#__PURE__*/React.createElement(RenderSetting, {
    label: "Mode",
    value: t.vizMode,
    options: ["scientific", "cinematic", "minimal", "capture"],
    onChange: function onChange(v) {
      return setTweak("vizMode", v);
    }
  }), /*#__PURE__*/React.createElement(RenderSetting, {
    label: "Motion",
    value: t.motion,
    options: ["reduced", "balanced", "full"],
    onChange: function onChange(v) {
      return setTweak("motion", v);
    }
  }), /*#__PURE__*/React.createElement(RenderSetting, {
    label: "3D detail",
    value: t.detail3d,
    options: ["low", "medium", "ultra"],
    onChange: function onChange(v) {
      return setTweak("detail3d", v);
    }
  }), /*#__PURE__*/React.createElement(RenderSetting, {
    label: "Render backend",
    value: t.renderBackend || "auto",
    options: ["auto", "webgl2", "static"],
    onChange: function onChange(v) {
      return setTweak("renderBackend", v);
    }
  }), /*#__PURE__*/React.createElement(RenderSetting, {
    label: "Tone mapping",
    value: t.toneMapping || "agx",
    options: ["agx", "neutral"],
    onChange: function onChange(v) {
      return setTweak("toneMapping", v);
    }
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "HDR environment lighting",
    value: t.hdrEnvironment === true,
    onChange: function onChange(v) {
      return setTweak("hdrEnvironment", v);
    }
  }), t.hdrEnvironment ? /*#__PURE__*/React.createElement("p", {
    className: "small dim"
  }, "Seeded HDR sky lighting for 3D materials. Never applied to the Kerr observatory: its horizon is ray-traced black.") : null, prm ? /*#__PURE__*/React.createElement("p", {
    className: "small dim"
  }, "System reduced-motion overrides Motion settings and disables temporal effects.") : null, /*#__PURE__*/React.createElement(RenderDiagnosticsDrawer, null), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "3D labels",
    value: t.labels3d,
    onChange: function onChange(v) {
      return setTweak("labels3d", v);
    }
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Annotations",
    value: t.annotations3d,
    onChange: function onChange(v) {
      return setTweak("annotations3d", v);
    }
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Learning"
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Pathway",
    value: atlasState.pathway,
    options: ["beginner", "student", "advanced"],
    onChange: function onChange(v) {
      return setAtlasState({
        pathway: v
      }, {
        replace: false
      });
    }
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Theme"
  }), /*#__PURE__*/React.createElement(TweakColor, {
    label: "Accent",
    value: t.accent,
    options: [QGA_TOKENS.css("accent"), QGA_TOKENS.css("accent-2"), QGA_TOKENS.css("signal-danger"), QGA_TOKENS.css("signal-warm")],
    onChange: function onChange(v) {
      return setTweak("accent", v);
    }
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Ambient starfield",
    value: t.starfield,
    onChange: function onChange(v) {
      return setTweak("starfield", v);
    }
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Reading"
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Base text size",
    value: t.uiScale,
    min: 13.5,
    max: 18,
    step: 0.5,
    unit: "px",
    onChange: function onChange(v) {
      return setTweak("uiScale", v);
    }
  })));
}
var root = ReactDOM.createRoot(document.getElementById("root"));
// Compare embeds: the role must exist before any child effect runs (React
// runs child effects before parent effects), so set it at script evaluation.
window.__qgaCompareRole = window.location.hash === "#embed-A" ? "A" : window.location.hash === "#embed-B" ? "B" : null;
root.render(/*#__PURE__*/React.createElement(App, null));