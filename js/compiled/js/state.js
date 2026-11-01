/* Compiled from js/state.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/* URL/history state, reproducibility controls, sharing, and bounded GWOSC access. */
var QGA_DEFAULT_STATE = {
  view: "overview",
  pathway: "student",
  bhMass: 1,
  bhSpin: 0,
  bhStateVersion: 2,
  bhInclination: 75,
  bhObserverDistance: 40,
  bhDiskModel: "page-thorne-turbulent",
  bhRenderQuality: "balanced",
  bhExposure: 0,
  bhAnnotations: false,
  bhCorona: true,
  bhJets: true,
  gwMode: "generated",
  gwEvent: "GW150914",
  gwDetector: "H1",
  gwStart: 1126259446,
  gwDuration: 16,
  gwM1: 36,
  gwM2: 29,
  seed: 42,
  gwAudioMode: "original",
  gwPitch: 1,
  gwVolume: 0.7,
  gwLoop: false,
  qftProcess: "s-channel",
  qftSqrtS: 10,
  qftAngle: 0,
  qftPhotonX: 0.5,
  grPreset: "timelike",
  grBeta: 0.35,
  grAt: 0,
  grAx: -1.35,
  grBt: 2.6,
  grBx: 1.1,
  rgPreset: "qcd",
  rgPresetOrigin: "qcd",
  rgModel: "qcd",
  rgG0: 1.218,
  rgMu0: 2,
  rgLogMin: -1,
  rgLogMax: 8,
  rgNf: 5,
  rgA: 1,
  rgB: 1,
  rgGStar: 1,
  rgCurrent: 2,
  qftLabMode: "field",
  qftLabMass: 1,
  hawkingLabAmplify: 12,
  adsLabLinks: 5,
  adsLabRegion: 0.5,
  colliderChannel: "h2gg",
  spinFoamJMax: 2,
  spinFoamMode: "network",
  annotations: [],
  shot: "",
  tour: "",
  tourStep: 1,
  tourPrint: "",
  studio: ""
};
var QGA_STATE_KEYS = {
  view: "view",
  pathway: "pathway",
  bhMass: "bhm",
  bhSpin: "bhs",
  bhStateVersion: "bhv",
  bhInclination: "bhi",
  bhObserverDistance: "bhd",
  bhDiskModel: "bhdm",
  bhRenderQuality: "bhq",
  bhExposure: "bhe",
  bhAnnotations: "bha",
  bhCorona: "bhc",
  bhJets: "bhj",
  gwMode: "gwm",
  gwEvent: "gwe",
  gwDetector: "gwd",
  gwStart: "gws",
  gwDuration: "gwt",
  gwM1: "gwm1",
  gwM2: "gwm2",
  seed: "seed",
  gwAudioMode: "gwam",
  gwPitch: "gwp",
  gwVolume: "gwv",
  gwLoop: "gwl",
  qftProcess: "qfp",
  qftSqrtS: "qfs",
  qftAngle: "qfa",
  qftPhotonX: "qfx",
  grPreset: "grp",
  grBeta: "grb",
  grAt: "grat",
  grAx: "grax",
  grBt: "grbt",
  grBx: "grbx",
  rgPreset: "rgp",
  rgPresetOrigin: "rgpo",
  rgModel: "rgm",
  rgG0: "rgg",
  rgMu0: "rgmu",
  rgLogMin: "rglo",
  rgLogMax: "rghi",
  rgNf: "rgnf",
  rgA: "rga",
  rgB: "rgb",
  rgGStar: "rggs",
  rgCurrent: "rgc",
  qftLabMode: "qftm",
  qftLabMass: "qftms",
  hawkingLabAmplify: "hla",
  adsLabLinks: "aln",
  adsLabRegion: "alr",
  colliderChannel: "clc",
  spinFoamJMax: "sfj",
  spinFoamMode: "sfm",
  annotations: "ann",
  shot: "shot",
  // Guided tours (S31): the tour, its 1-based step and the worksheet flag live in the URL so a step is a link a
  // teacher can print. `print` is a display variant, not a scientific parameter, but it round-trips through the same
  // writer so a worksheet URL is reproducible.
  tour: "tour",
  tourStep: "step",
  tourPrint: "print",
  // Publishing studio (S32): `?export=1` opens the drawer, so a capture, a worksheet or a link can name it.
  studio: "export"
};
var qgaClamp = function qgaClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
};
// Closure-tracked pending state: the last state written (or silently applied)
// this session. React 18 batches synchronous setState loops, so using the
// URL as the merge base can skip a second write; this overlay is the guard.
var qgaPendingOverlay = null;
// Last annotation-parameter rejection (invalid/oversized `ann`), recorded so
// the app shell can reject it VISIBLY while loading everything else.
var qgaLastAnnotationRejection = null;
var QGA_ENUMS = {
  view: ["overview", "sm", "qft", "rg", "gr", "planck", "approaches", "bh", "exp", "glossary", "symbols", "refs", "open", "paper", "compare"],
  pathway: ["beginner", "student", "advanced"],
  gwMode: ["generated", "real"],
  gwDetector: ["H1", "L1", "V1"],
  gwAudioMode: ["original", "shifted"],
  qftProcess: ["s-channel", "bhabha", "moller", "t-channel", "compton"],
  grPreset: ["timelike", "spacelike", "null", "simultaneity", "twin", "custom"],
  rgPreset: ["qed", "qcd", "gaussian", "uv-toy", "ir-toy", "asymptotic-safety", "custom"],
  rgPresetOrigin: ["qed", "qcd", "gaussian", "uv-toy", "ir-toy", "asymptotic-safety"],
  rgModel: ["qed", "qcd", "gaussian", "linear", "asymptotic-safety"],
  bhDiskModel: ["page-thorne-turbulent", "page-thorne", "page-thorne-opaque", "newtonian"],
  bhRenderQuality: ["performance", "balanced", "ultra"],
  qftLabMode: ["field", "correlation", "flux"],
  colliderChannel: ["h2gg", "z2mm", "z2ee", "ttbar", "qcd"],
  spinFoamMode: ["network", "foam"]
};
var QGA_NUMBERS = ["bhMass", "bhSpin", "bhStateVersion", "bhInclination", "bhObserverDistance", "bhExposure", "gwStart", "gwDuration", "gwM1", "gwM2", "seed", "gwPitch", "gwVolume", "qftSqrtS", "qftAngle", "qftPhotonX", "grBeta", "grAt", "grAx", "grBt", "grBx", "rgG0", "rgMu0", "rgLogMin", "rgLogMax", "rgNf", "rgA", "rgB", "rgGStar", "rgCurrent", "qftLabMass", "hawkingLabAmplify", "adsLabLinks", "adsLabRegion", "spinFoamJMax"];
// Unversioned and v1 Kerr links retain the smooth disk/annotation defaults.
// New black-hole links carry bhv=2, making the turbulent default unambiguous.
// The Prompt 05 volume keys (bhCorona, bhJets) are additive with safe
// defaults: links without them render exactly as before they existed.
var QGA_KERR_KEYS = ["bhInclination", "bhObserverDistance", "bhDiskModel", "bhRenderQuality", "bhExposure", "bhAnnotations", "bhCorona", "bhJets"];
var QGA_KERR_V1_DEFAULTS = {
  bhDiskModel: "page-thorne",
  bhAnnotations: true
};
function qgaReadState() {
  var search = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.location.search;
  var params = new URLSearchParams(search),
    state = _objectSpread({}, QGA_DEFAULT_STATE);
  var version = params.has(QGA_STATE_KEYS.bhStateVersion) ? Number(params.get(QGA_STATE_KEYS.bhStateVersion)) : params.get(QGA_STATE_KEYS.view) === "bh" ? 1 : QGA_DEFAULT_STATE.bhStateVersion;
  if (version === 1) Object.assign(state, QGA_KERR_V1_DEFAULTS);
  for (var _i = 0, _Object$entries = Object.entries(QGA_STATE_KEYS); _i < _Object$entries.length; _i++) {
    var _QGA_ENUMS$key;
    var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
      key = _Object$entries$_i[0],
      param = _Object$entries$_i[1];
    if (key === "annotations") continue; // parsed + validated below
    var raw = params.get(param);
    if (raw == null) continue;
    if ((_QGA_ENUMS$key = QGA_ENUMS[key]) !== null && _QGA_ENUMS$key !== void 0 && _QGA_ENUMS$key.includes(raw)) state[key] = raw;else if (key === "gwEvent") state[key] = raw;else if (key === "shot") state[key] = raw;else if (key === "tour") state[key] = raw;else if (key === "tourStep" && Number.isFinite(Number(raw))) state[key] = Number(raw);else if (key === "tourPrint") state[key] = raw;else if (key === "studio") state[key] = raw;else if (key === "bhAnnotations" || key === "bhCorona" || key === "bhJets" || key === "gwLoop") {
      if (raw === "true" || raw === "false") state[key] = raw === "true";
    } else if (QGA_NUMBERS.includes(key) && Number.isFinite(Number(raw))) state[key] = Number(raw);
  }
  if (version === 1) state.bhStateVersion = 1;else if (version !== QGA_DEFAULT_STATE.bhStateVersion) {
    for (var _i2 = 0, _QGA_KERR_KEYS = QGA_KERR_KEYS; _i2 < _QGA_KERR_KEYS.length; _i2++) {
      var _key = _QGA_KERR_KEYS[_i2];
      state[_key] = QGA_DEFAULT_STATE[_key];
    }
    state.bhStateVersion = QGA_DEFAULT_STATE.bhStateVersion;
  }
  if (!params.has(QGA_STATE_KEYS.view)) {
    try {
      var legacyView = localStorage.getItem("qga-view");
      if (QGA_ENUMS.view.includes(legacyView)) state.view = legacyView;
    } catch (e) {}
  }
  // Prompt 10 annotations: the `ann` parameter is parsed and validated before
  // it may enter state. Invalid or oversized state is rejected VISIBLY (the
  // shell reads qgaLastAnnotationRejection) and loads zero pins — old URLs
  // without the parameter are unaffected.
  var annRaw = params.get(QGA_STATE_KEYS.annotations);
  if (annRaw != null && annRaw !== "") {
    var _window$QGA_ANNOTATIO;
    var parser = (_window$QGA_ANNOTATIO = window.QGA_ANNOTATIONS) === null || _window$QGA_ANNOTATIO === void 0 ? void 0 : _window$QGA_ANNOTATIO.parseAnnotationsParam;
    if (parser) {
      var decision = parser(annRaw);
      if (decision.ok) state.annotations = decision.annotations;else qgaLastAnnotationRejection = {
        reason: decision.reason,
        at: Date.now()
      };
    }
  }
  state.bhMass = qgaClamp(state.bhMass, 0, 9);
  state.bhSpin = qgaClamp(state.bhSpin, -0.998, 0.998);
  state.bhInclination = qgaClamp(state.bhInclination, 3, 89);
  state.bhObserverDistance = qgaClamp(state.bhObserverDistance, 12, 120);
  state.bhExposure = qgaClamp(state.bhExposure, -3, 3);
  state.gwStart = qgaClamp(Math.round(state.gwStart), 1126259000, 1126260000);
  state.gwDuration = qgaClamp(Math.round(state.gwDuration), 1, 32);
  state.seed = Math.trunc(state.seed) || 42;
  state.gwM1 = qgaClamp(Math.round(state.gwM1), 5, 200);
  state.gwM2 = qgaClamp(Math.round(state.gwM2), 5, 200);
  state.gwEvent = /^[A-Za-z0-9_-]{3,40}$/.test(state.gwEvent) ? state.gwEvent : QGA_DEFAULT_STATE.gwEvent;
  // Cinematic deep link (Prompt 09): format-validated shot id. Unknown ids are
  // ignored by the runtime, so old URLs and typos render exactly as before.
  state.shot = /^[a-z0-9][a-z0-9-]{0,62}$/.test(state.shot) ? state.shot : "";
  // Guided tours (S31): format-validated tour id, step and worksheet flag. The
  // URL reader validates the SHAPE only — it cannot see the tour library, and a
  // link must survive the module being slow to load. An id that no tour answers
  // to is reported by the tour panel, which can see the library.
  state.tour = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(state.tour) && state.tour.length <= 48 ? state.tour : "";
  state.tourStep = state.tour ? qgaClamp(Math.trunc(state.tourStep) || 1, 1, 999) : 1;
  state.tourPrint = state.tour && (state.tourPrint === "1" || state.tourPrint === "true") ? "1" : "";
  // `1`/`true` opens the drawer; `report` opens the print view; anything else means "no studio".
  state.studio = state.studio === "1" || state.studio === "true" ? "1" : state.studio === "report" ? "report" : "";
  // GW instrument (Prompt 06): playback-shaping keys, additive with safe
  // defaults; audio is never enabled by a URL, only by an in-page gesture.
  state.gwPitch = qgaClamp(state.gwPitch, 0.25, 4);
  state.gwVolume = qgaClamp(state.gwVolume, 0, 1);
  state.qftSqrtS = qgaClamp(state.qftSqrtS, 1, 200);
  state.qftAngle = qgaClamp(state.qftAngle, -1, 1);
  state.qftPhotonX = qgaClamp(state.qftPhotonX, 0.05, 20);
  // Prompt 07 compute labs: additive keys with safe defaults.
  state.qftLabMass = qgaClamp(state.qftLabMass, 0, 3);
  state.hawkingLabAmplify = qgaClamp(state.hawkingLabAmplify, 1, 1000);
  // Prompt 08 labs: additive keys with safe defaults.
  state.adsLabLinks = qgaClamp(Math.round(state.adsLabLinks), 0, 12);
  state.adsLabRegion = qgaClamp(state.adsLabRegion, 0.1, 0.9);
  state.spinFoamJMax = qgaClamp(Math.round(state.spinFoamJMax), 1, 4);
  state.grPreset = QGA_ENUMS.grPreset.includes(state.grPreset) ? state.grPreset : QGA_DEFAULT_STATE.grPreset;
  var causal = window.QGA_PHYSICS.sanitizeCausalState({
    beta: state.grBeta,
    a: {
      ct: state.grAt,
      x: state.grAx
    },
    b: {
      ct: state.grBt,
      x: state.grBx
    }
  }, {
    beta: QGA_DEFAULT_STATE.grBeta,
    a: {
      ct: QGA_DEFAULT_STATE.grAt,
      x: QGA_DEFAULT_STATE.grAx
    },
    b: {
      ct: QGA_DEFAULT_STATE.grBt,
      x: QGA_DEFAULT_STATE.grBx
    }
  });
  state.grBeta = causal.beta;
  state.grAt = causal.a.ct;
  state.grAx = causal.a.x;
  state.grBt = causal.b.ct;
  state.grBx = causal.b.x;
  var rgPresetModels = {
    qed: "qed",
    qcd: "qcd",
    gaussian: "gaussian",
    "uv-toy": "linear",
    "ir-toy": "linear",
    "asymptotic-safety": "asymptotic-safety"
  };
  if (state.rgPreset !== "custom") {
    state.rgModel = rgPresetModels[state.rgPreset] || QGA_DEFAULT_STATE.rgModel;
    state.rgPresetOrigin = state.rgPreset;
  } else {
    var originMatchesModel = rgPresetModels[state.rgPresetOrigin] === state.rgModel;
    if (!params.has(QGA_STATE_KEYS.rgPresetOrigin) || !originMatchesModel) {
      state.rgPresetOrigin = state.rgModel === "linear" ? state.rgA < 0 ? "uv-toy" : "ir-toy" : state.rgModel;
    }
  }
  state.rgG0 = qgaClamp(state.rgG0, 0, 3.4);
  state.rgNf = qgaClamp(Math.round(state.rgNf), state.rgModel === "qed" ? 1 : 0, 16);
  state.rgA = qgaClamp(state.rgA, -3, 3);
  state.rgB = qgaClamp(state.rgB, 0.05, 4);
  state.rgGStar = qgaClamp(state.rgGStar, 0, 3);
  state.rgLogMin = qgaClamp(state.rgLogMin, -12, 30);
  state.rgLogMax = qgaClamp(state.rgLogMax, -12, 30);
  if (state.rgLogMax - state.rgLogMin < 0.5) {
    state.rgLogMin = QGA_DEFAULT_STATE.rgLogMin;
    state.rgLogMax = QGA_DEFAULT_STATE.rgLogMax;
  }
  state.rgMu0 = qgaClamp(state.rgMu0, state.rgLogMin, state.rgLogMax);
  state.rgCurrent = qgaClamp(state.rgCurrent, state.rgLogMin, state.rgLogMax);
  return state;
}
function qgaStateSearch(state) {
  var params = new URLSearchParams();
  var defaults = state.bhStateVersion === 1 ? _objectSpread(_objectSpread({}, QGA_DEFAULT_STATE), QGA_KERR_V1_DEFAULTS) : QGA_DEFAULT_STATE;
  for (var _i3 = 0, _Object$entries2 = Object.entries(QGA_STATE_KEYS); _i3 < _Object$entries2.length; _i3++) {
    var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i3], 2),
      key = _Object$entries2$_i[0],
      param = _Object$entries2$_i[1];
    if (key === "bhStateVersion" || key === "annotations") continue;
    // A step without a tour has nothing to belong to; writing it would publish a link that opens no tour.
    if (key === "tourStep" && !state.tour) continue;
    if (key === "tourPrint" && (!state.tour || !state.tourPrint)) continue;
    if (state[key] !== defaults[key]) params.set(param, String(state[key]));
  }
  // Annotations enter shared state only after schema, text and size limits
  // pass; a failed serialization is refused (the panel surfaces the reason)
  // rather than writing a truncated or invalid parameter.
  if (Array.isArray(state.annotations) && state.annotations.length > 0) {
    var _window$QGA_ANNOTATIO2;
    var serializer = (_window$QGA_ANNOTATIO2 = window.QGA_ANNOTATIONS) === null || _window$QGA_ANNOTATIO2 === void 0 ? void 0 : _window$QGA_ANNOTATIO2.serializeAnnotationsParam;
    var decision = serializer ? serializer(state.annotations) : {
      ok: false,
      reason: "Annotation tooling is unavailable."
    };
    if (decision.ok) params.set(QGA_STATE_KEYS.annotations, decision.value);
  }
  if (state.view === "bh" || QGA_KERR_KEYS.some(function (key) {
    return params.has(QGA_STATE_KEYS[key]);
  })) {
    params.set(QGA_STATE_KEYS.bhStateVersion, String(state.bhStateVersion === 1 ? 1 : QGA_DEFAULT_STATE.bhStateVersion));
  }
  var query = params.toString();
  return query ? "?" + query : "";
}
function qgaWriteState(state) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
    _ref$replace = _ref.replace,
    replace = _ref$replace === void 0 ? true : _ref$replace;
  qgaPendingOverlay = _objectSpread({}, state);
  window.history[replace ? "replaceState" : "pushState"]({
    qga: _objectSpread({}, state)
  }, "", window.location.pathname + qgaStateSearch(state) + window.location.hash);
  queueMicrotask(function () {
    return window.dispatchEvent(new CustomEvent("qga-statechange", {
      detail: _objectSpread({}, state)
    }));
  });
}
function qgaShareUrl(state) {
  return new URL(qgaStateSearch(state), window.location.href).href;
}
function qgaCopyLink(_x) {
  return _qgaCopyLink.apply(this, arguments);
}
function _qgaCopyLink() {
  _qgaCopyLink = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(state) {
    var _navigator$clipboard;
    var url, input;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          url = qgaShareUrl(state);
          if (!((_navigator$clipboard = navigator.clipboard) !== null && _navigator$clipboard !== void 0 && _navigator$clipboard.writeText)) {
            _context.n = 2;
            break;
          }
          _context.n = 1;
          return navigator.clipboard.writeText(url);
        case 1:
          _context.n = 4;
          break;
        case 2:
          input = document.createElement("textarea");
          input.value = url;
          input.style.position = "fixed";
          document.body.appendChild(input);
          input.select();
          if (document.execCommand("copy")) {
            _context.n = 3;
            break;
          }
          input.remove();
          throw new Error("Clipboard access is unavailable.");
        case 3:
          input.remove();
        case 4:
          return _context.a(2, url);
      }
    }, _callee);
  }));
  return _qgaCopyLink.apply(this, arguments);
}
function qgaExportJson(state) {
  var extra = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var metadata = state.view === "gr" ? {
    model: {
      id: "flat-spacetime-causal-lab",
      status: "established-special-relativity",
      dimensionality: "1+1",
      convention: "Minkowski metric (-,+,+,+); diagram units c=1",
      scope: "inertial frames plus an explicitly schematic piecewise-inertial twin path"
    },
    provenance: {
      implementation: "js/physics.mjs mirrored by js/physics.jsx",
      references: ["Misner, Thorne & Wheeler (1973)", "Wald (1984)"]
    }
  } : state.view === "rg" ? function () {
    var parameters = {
      nf: state.rgNf,
      a: state.rgA,
      b: state.rgB,
      gStar: state.rgGStar
    };
    var ln10 = Math.log(10);
    var integration = window.QGA_PHYSICS.integrateRGFlow({
      model: state.rgModel,
      g0: state.rgG0,
      t0: 0,
      tMin: (state.rgLogMin - state.rgMu0) * ln10,
      tMax: (state.rgLogMax - state.rgMu0) * ln10,
      step: 0.02,
      parameters: parameters
    });
    return {
      model: {
        id: state.rgModel,
        preset: state.rgPreset,
        presetOrigin: state.rgPresetOrigin || state.rgPreset,
        status: state.rgModel === "asymptotic-safety" || state.rgPresetOrigin === "asymptotic-safety" ? "conjectural-illustrative-toy" : ["gaussian", "linear"].includes(state.rgModel) ? "pedagogical-toy" : "one-loop-perturbative",
        equation: "dg/dln(mu) = beta(g)",
        alphaConvention: "alpha = g^2/(4 pi)",
        qedConvention: "nf unit-charge Dirac fermions; beta(e)=nf e^3/(12 pi^2)",
        qcdConvention: "SU(3), b0=11-2 nf/3; beta(g)=-b0 g^3/(16 pi^2)",
        parameters: parameters
      },
      numerics: {
        method: integration.method,
        stepInNaturalLogScale: integration.step,
        fixedPointTolerance: 1e-9,
        couplingBoundary: integration.gLimit,
        infrared: integration.infrared.status,
        ultraviolet: integration.ultraviolet.status
      },
      validity: {
        boundary: "alpha = 1 is used as a perturbative/strong-coupling display boundary",
        qedLandauPole: "formal one-loop extrapolation, not an observation",
        qcdInfrared: "one-loop perturbation theory is not valid in the strong-coupling regime",
        asymptoticSafety: "illustrative toy flow; not evidence for quantum-gravity asymptotic safety"
      },
      fixedPoints: window.QGA_PHYSICS.rgFixedPoints(state.rgModel, parameters),
      provenance: {
        implementation: "js/physics.mjs mirrored by js/physics.jsx",
        references: ["Gross & Wilczek (1973)", "Politzer (1973)", "Peskin & Schroeder (1995)", "Weinberg (1979)"]
      }
    };
  }() : state.view === "bh" && window.QGA_KERR ? window.QGA_KERR.kerrExportMetadata(state, window.__qgaKerrRuntime || {}) : state.view === "exp" && window.QGA_GW ? window.QGA_GW.INSTRUMENT.gwInstrumentExportMetadata(state, window.__qgaGwRuntime || {}) : {};
  // Prompt 07 compute labs: attach the active lab's provenance + runtime stats.
  // Prompt 08: the black-hole view hosts both the Hawking and AdS labs; the
  // AdS branch is additive and only fires when its scene is actually mounted.
  var labMetadata = !window.QGA_LABS ? {} : state.view === "qft" ? window.QGA_LABS.qftFieldExportMetadata(state, window.__qgaQftLab || {}) : state.view === "bh" ? _objectSpread(_objectSpread({}, window.QGA_LABS.hawkingExportMetadata(state, window.__qgaHawkingLab || {})), window.__qgaAdsLab ? window.QGA_LABS.adsExportMetadata(state, window.__qgaAdsLab) : {}) : state.view === "rg" ? window.QGA_LABS.rgFlow3dExportMetadata(state, window.__qgaRgFlow3d || {}) : state.view === "approaches" ? window.QGA_LABS.adsExportMetadata(state, window.__qgaAdsLab || {}) : state.view === "sm" || state.view === "exp" ? window.QGA_LABS.colliderExportMetadata(state, window.__qgaColliderLab || {}) : state.view === "planck" ? window.QGA_LABS.spinFoamExportMetadata(state, window.__qgaSpinFoamLab || {}) : {};
  var payload = _objectSpread(_objectSpread(_objectSpread({
    schema: "horizon-qga-state/v1",
    exportedAt: new Date().toISOString(),
    source: qgaShareUrl(state),
    state: _objectSpread({}, state)
  }, metadata), labMetadata), extra);
  var href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2) + "\n"], {
    type: "application/json"
  }));
  var a = document.createElement("a");
  a.href = href;
  a.download = "horizon-qga-state.json";
  a.click();
  setTimeout(function () {
    return URL.revokeObjectURL(href);
  }, 0);
  return payload;
}