/* Compiled from js/visualizations/kerr/kerr-controls.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
// kerr-controls.jsx — Kerr observatory control deck, focus explanation and
// status readout (Prompt 04). Classic-script component: it is evaluated with
// the rest of the atlas and uses the shared globals (React hooks, Badge,
// SliderRow, Toggle, useQGAState). All numbers it shows come from
// window.QGA_KERR (the science-backed observatory module); nothing here
// computes physics.

var KERR_DISK_LABELS = {
  "page-thorne-turbulent": "Page–Thorne + turbulence",
  "page-thorne": "Page–Thorne",
  "page-thorne-opaque": "Page–Thorne opaque",
  "newtonian": "Newtonian S–S"
};
var KERR_QUALITY_LABELS = {
  performance: "Performance",
  balanced: "Balanced",
  ultra: "Ultra"
};
var KERR_FOCUS_BUTTONS = [["horizon", "Horizon"], ["photon-region", "Photon region"], ["direct-disk", "Direct disk"], ["higher-order", "Higher-order image"]];
var KERR_CAPTURE_PRESETS = [["2k", "2K"], ["4k", "4K"], ["8k", "8K"]];
function useKerrRuntimeSnapshot() {
  var period = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 400;
  var _useState = useState(function () {
      return window.__qgaKerrRuntime || null;
    }),
    _useState2 = _slicedToArray(_useState, 2),
    snapshot = _useState2[0],
    setSnapshot = _useState2[1];
  useEffect(function () {
    var id = setInterval(function () {
      var next = window.__qgaKerrRuntime || null;
      setSnapshot(function (previous) {
        return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
      });
    }, period);
    return function () {
      return clearInterval(id);
    };
  }, [period]);
  return snapshot;
}
function KerrRuntimeStatus() {
  var info = useKerrRuntimeSnapshot();
  if (!info || !info.budget) {
    return /*#__PURE__*/React.createElement("div", {
      className: "kerr-status small dim",
      role: "status"
    }, "Observatory renderer starting\u2026");
  }
  var b = info.budget;
  var volume = info.volume || {
    corona: false,
    jets: false,
    capable: false
  };
  // The runtime names the gate that stopped the layer (kerrVolumeReason), so a
  // CPU rasterizer never reads as a quality choice the user made.
  var volumeNote = {
    webgpu: "off (WebGL2 integrator only)",
    software: "off (software rasterizer)",
    quality: "off (performance quality gate)",
    toggles: "off (toggles)",
    on: "on"
  }[volume.reason] || (info.backend !== "webgl2" ? "off (WebGL2 integrator only)" : !volume.capable ? "off (performance quality gate)" : volume.corona || volume.jets ? "on" : "off (toggles)");
  return /*#__PURE__*/React.createElement("div", {
    className: "kerr-status",
    role: "status",
    "aria-label": "Kerr observatory render budget"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-status-item"
  }, /*#__PURE__*/React.createElement("em", null, "backend"), info.backend), /*#__PURE__*/React.createElement("span", {
    className: "kerr-status-item"
  }, /*#__PURE__*/React.createElement("em", null, "quality"), b.effective, b.effective !== b.requested ? " (limited from " + b.requested + ")" : ""), /*#__PURE__*/React.createElement("span", {
    className: "kerr-status-item"
  }, /*#__PURE__*/React.createElement("em", null, "ray steps"), b.maxSteps), /*#__PURE__*/React.createElement("span", {
    className: "kerr-status-item"
  }, /*#__PURE__*/React.createElement("em", null, "rays / px / frame"), b.samplesPerFrame), /*#__PURE__*/React.createElement("span", {
    className: "kerr-status-item"
  }, /*#__PURE__*/React.createElement("em", null, "temporal"), info.frames, " / ", b.temporalSamples), /*#__PURE__*/React.createElement("span", {
    className: "kerr-status-item"
  }, /*#__PURE__*/React.createElement("em", null, "plasma & jets"), volumeNote), /*#__PURE__*/React.createElement("span", {
    className: "kerr-status-item"
  }, /*#__PURE__*/React.createElement("em", null, "accumulation resets"), info.resets));
}
function KerrCapturePanel(_ref) {
  var onCapture = _ref.onCapture;
  var _useState3 = useState("2k"),
    _useState4 = _slicedToArray(_useState3, 2),
    preset = _useState4[0],
    setPreset = _useState4[1];
  var _useState5 = useState(true),
    _useState6 = _slicedToArray(_useState5, 2),
    denoise = _useState6[0],
    setDenoise = _useState6[1];
  var _useState7 = useState(false),
    _useState8 = _slicedToArray(_useState7, 2),
    busy = _useState8[0],
    setBusy = _useState8[1];
  var _useState9 = useState(0),
    _useState0 = _slicedToArray(_useState9, 2),
    progress = _useState0[0],
    setProgress = _useState0[1];
  var _useState1 = useState(null),
    _useState10 = _slicedToArray(_useState1, 2),
    message = _useState10[0],
    setMessage = _useState10[1];
  var _useState11 = useState(null),
    _useState12 = _slicedToArray(_useState11, 2),
    error = _useState12[0],
    setError = _useState12[1];
  var cancelRef = useRef(null);
  var run = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var signal, _window$QGA_BUILD_INF, _window$QGA_BUILD_INF2, result, href, a, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (!(busy || !onCapture)) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            setBusy(true);
            setProgress(0);
            setError(null);
            setMessage(null);
            signal = {
              aborted: false
            };
            cancelRef.current = signal;
            _context.p = 2;
            _context.n = 3;
            return onCapture({
              preset: preset,
              denoise: denoise,
              samples: 96,
              signal: signal,
              onProgress: function onProgress(_ref3) {
                var fraction = _ref3.fraction;
                return setProgress(fraction);
              },
              commitHash: (_window$QGA_BUILD_INF = (_window$QGA_BUILD_INF2 = window.QGA_BUILD_INFO) === null || _window$QGA_BUILD_INF2 === void 0 ? void 0 : _window$QGA_BUILD_INF2.commitHash) !== null && _window$QGA_BUILD_INF !== void 0 ? _window$QGA_BUILD_INF : null
            });
          case 3:
            result = _context.v;
            href = URL.createObjectURL(new Blob([result.png], {
              type: "image/png"
            }));
            a = document.createElement("a");
            a.href = href;
            a.download = "horizon-kerr-".concat(result.width, "x").concat(result.height, ".png");
            a.click();
            setTimeout(function () {
              return URL.revokeObjectURL(href);
            }, 0);
            setMessage("Captured ".concat(result.width, "\xD7").concat(result.height, " \xB7 ").concat(result.metadata.sampleCount, " samples \xB7 ").concat(result.metadata.backend));
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            setError(_t && _t.message ? _t.message : String(_t));
          case 5:
            _context.p = 5;
            cancelRef.current = null;
            setBusy(false);
            return _context.f(5);
          case 6:
            return _context.a(2);
        }
      }, _callee, null, [[2, 4, 5, 6]]);
    }));
    return function run() {
      return _ref2.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group kerr-capture",
    role: "group",
    "aria-label": "Ultra-quality still capture"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Capture"), KERR_CAPTURE_PRESETS.map(function (_ref4) {
    var _ref5 = _slicedToArray(_ref4, 2),
      key = _ref5[0],
      label = _ref5[1];
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      type: "button",
      className: "kerr-chip" + (preset === key ? " on" : ""),
      "aria-pressed": preset === key,
      disabled: busy,
      onClick: function onClick() {
        return setPreset(key);
      }
    }, label);
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "kerr-chip" + (denoise ? " on" : ""),
    "aria-pressed": denoise,
    disabled: busy,
    onClick: function onClick() {
      return setDenoise(!denoise);
    }
  }, "denoise"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: run,
    disabled: busy || !onCapture
  }, busy ? "Capturing\u2026 ".concat(Math.round(progress * 100), "%") : "Capture still"), busy ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("progress", {
    className: "kerr-capture-progress",
    value: progress,
    max: 1,
    "aria-label": "Capture progress"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: function onClick() {
      if (cancelRef.current) cancelRef.current.aborted = true;
    }
  }, "Cancel")) : null, message ? /*#__PURE__*/React.createElement("p", {
    className: "small dim",
    role: "status"
  }, message) : null, error ? /*#__PURE__*/React.createElement("p", {
    className: "small kerr-capture-error",
    role: "alert"
  }, error) : null, /*#__PURE__*/React.createElement("p", {
    className: "kerr-legend small dim"
  }, "Progressive offscreen render with the ultra ray budget, Halton-jittered sample accumulation, edge-aware denoise and the pipeline tone map. The PNG embeds a metadata sidecar (state, provenance, backend, samples, commit)."));
}
function KerrObservatoryControls(_ref6) {
  var state = _ref6.state,
    setState = _ref6.setState,
    onCameraRequest = _ref6.onCameraRequest,
    onFocusKind = _ref6.onFocusKind,
    focusKind = _ref6.focusKind,
    onCapture = _ref6.onCapture;
  var incl = state.bhInclination;
  var dist = state.bhObserverDistance;
  return /*#__PURE__*/React.createElement("div", {
    className: "kerr-controls",
    role: "group",
    "aria-label": "Kerr observatory controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "inclination (from spin axis)",
    min: 3,
    max: 89,
    step: 1,
    value: incl,
    onChange: function onChange(v) {
      setState({
        bhInclination: v
      });
      onCameraRequest({
        inclination: v
      });
    },
    format: function format(v) {
      return v.toFixed(0) + "°";
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "observer distance",
    min: 12,
    max: 120,
    step: 1,
    value: dist,
    onChange: function onChange(v) {
      setState({
        bhObserverDistance: v
      });
      onCameraRequest({
        distance: v
      });
    },
    format: function format(v) {
      return v.toFixed(0) + " GM/c²";
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "exposure",
    min: -3,
    max: 3,
    step: 0.25,
    value: state.bhExposure,
    onChange: function onChange(v) {
      return setState({
        bhExposure: v
      });
    },
    format: function format(v) {
      return (v >= 0 ? "+" : "") + v.toFixed(2) + " EV";
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "kerr-instrument-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    role: "group",
    "aria-label": "Disk model"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Disk"), Object.entries(KERR_DISK_LABELS).map(function (_ref7) {
    var _ref8 = _slicedToArray(_ref7, 2),
      key = _ref8[0],
      label = _ref8[1];
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      type: "button",
      className: "kerr-chip" + (state.bhDiskModel === key ? " on" : ""),
      "aria-pressed": state.bhDiskModel === key,
      onClick: function onClick() {
        return setState({
          bhDiskModel: key
        });
      }
    }, label);
  })), /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    role: "group",
    "aria-label": "Render quality"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Quality"), Object.entries(KERR_QUALITY_LABELS).map(function (_ref9) {
    var _ref0 = _slicedToArray(_ref9, 2),
      key = _ref0[0],
      label = _ref0[1];
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      type: "button",
      className: "kerr-chip" + (state.bhRenderQuality === key ? " on" : ""),
      "aria-pressed": state.bhRenderQuality === key,
      onClick: function onClick() {
        return setState({
          bhRenderQuality: key
        });
      }
    }, label);
  })), /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    role: "group",
    "aria-label": "Volumetric plasma and jets"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Plasma & jets"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "kerr-chip" + (state.bhCorona !== false ? " on" : ""),
    "aria-pressed": state.bhCorona !== false,
    onClick: function onClick() {
      return setState({
        bhCorona: state.bhCorona === false
      });
    }
  }, "corona"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "kerr-chip" + (state.bhJets !== false ? " on" : ""),
    "aria-pressed": state.bhJets !== false,
    onClick: function onClick() {
      return setState({
        bhJets: state.bhJets === false
      });
    }
  }, "jets"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "kerr-chip",
    title: "Look down the jet axis: the approaching jet Doppler-beams and brightens",
    onClick: function onClick() {
      setState({
        bhInclination: 18
      });
      onCameraRequest({
        inclination: 18
      });
    }
  }, "view down the jet")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    role: "group",
    "aria-label": "Annotations"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Annotations"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "kerr-chip" + (state.bhAnnotations ? " on" : ""),
    "aria-pressed": state.bhAnnotations,
    onClick: function onClick() {
      return setState({
        bhAnnotations: !state.bhAnnotations
      });
    }
  }, state.bhAnnotations ? "image-order tint on" : "off")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    role: "group",
    "aria-label": "Focus feature"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Focus"), KERR_FOCUS_BUTTONS.map(function (_ref1) {
    var _ref10 = _slicedToArray(_ref1, 2),
      kind = _ref10[0],
      label = _ref10[1];
    return /*#__PURE__*/React.createElement("button", {
      key: kind,
      type: "button",
      className: "kerr-chip" + (focusKind === kind ? " on" : ""),
      "aria-pressed": focusKind === kind,
      onClick: function onClick() {
        return onFocusKind(kind);
      }
    }, label);
  })), /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: function onClick() {
      return window.QGA_EXPORT_JSON(window.QGA_READ_STATE());
    }
  }, "Export Kerr JSON"))), /*#__PURE__*/React.createElement(KerrCapturePanel, {
    onCapture: onCapture
  }), state.bhAnnotations ? /*#__PURE__*/React.createElement("p", {
    className: "kerr-legend small",
    "aria-label": "Image-order tint legend"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-swatch n0"
  }), " n = 0 direct image (true colour)", /*#__PURE__*/React.createElement("span", {
    className: "kerr-swatch n1"
  }), " n = 1 (cyan tint)", /*#__PURE__*/React.createElement("span", {
    className: "kerr-swatch n2"
  }), " n \u2265 2 (magenta tint) \u2014 the tint is an annotation aid, not a physical colour. Orders beyond the ray budget are not drawn and no ring is thickened.") : null, state.bhJets !== false ? /*#__PURE__*/React.createElement("p", {
    className: "kerr-legend small dim",
    "aria-label": "Jet model legend"
  }, "Jets are a heuristic Blandford\u2013Znajek model: the spin relationship", /*#__PURE__*/React.createElement(Eq, {
    tex: "P_{\\mathrm{BZ}} \\propto \\left(\\frac{a_\\star}{1+\\sqrt{1-a_\\star^2}}\\right)^{2}"
  }), " is established and scales the jet with spin (", /*#__PURE__*/React.createElement(Eq, {
    tex: "a_\\star = 0"
  }), " \u2192 no jet), but the collimation, spine/sheath flow and knot turbulence are phenomenological, not GRMHD. Relativistic beaming hides the jets near edge-on views \u2014 press \u201Cview down the jet\u201D to see the approaching jet brighten.") : null, /*#__PURE__*/React.createElement(KerrRuntimeStatus, null));
}
function KerrFocusPanel(_ref11) {
  var focus = _ref11.focus,
    onClose = _ref11.onClose;
  if (!focus) {
    return /*#__PURE__*/React.createElement("p", {
      className: "kerr-focus-hint small dim"
    }, "Click the horizon shadow, the photon region, the direct disk image or a higher-order image \u2014 or use the Focus buttons \u2014 to focus the camera and open the exact scientific explanation.");
  }
  var info = focus.explanation;
  return /*#__PURE__*/React.createElement("section", {
    className: "kerr-focus-panel",
    role: "region",
    "aria-live": "polite",
    "aria-label": "Focused feature: " + info.title
  }, /*#__PURE__*/React.createElement("header", {
    className: "kerr-focus-head"
  }, /*#__PURE__*/React.createElement("h4", null, info.title), /*#__PURE__*/React.createElement(Badge, {
    kind: info.status
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "kerr-map-close",
    onClick: onClose,
    "aria-label": "Close explanation"
  }, "Close")), /*#__PURE__*/React.createElement("p", {
    className: "kerr-focus-summary"
  }, info.summary), /*#__PURE__*/React.createElement("p", {
    className: "kerr-focus-formula mono"
  }, info.formula), info.values.length ? /*#__PURE__*/React.createElement("table", {
    className: "kerr-focus-values"
  }, /*#__PURE__*/React.createElement("tbody", null, info.values.map(function (_ref12) {
    var _ref13 = _slicedToArray(_ref12, 3),
      label = _ref13[0],
      value = _ref13[1],
      unit = _ref13[2];
    return /*#__PURE__*/React.createElement("tr", {
      key: label
    }, /*#__PURE__*/React.createElement("th", {
      scope: "row"
    }, label), /*#__PURE__*/React.createElement("td", null, value), /*#__PURE__*/React.createElement("td", {
      className: "dim"
    }, unit));
  }))) : null);
}
Object.assign(window, {
  KerrObservatoryControls: KerrObservatoryControls,
  KerrFocusPanel: KerrFocusPanel,
  KerrRuntimeStatus: KerrRuntimeStatus
});