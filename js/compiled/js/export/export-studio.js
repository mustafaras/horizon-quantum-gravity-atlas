/* Compiled from js/export/export-studio.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var _excluded = ["canvas"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
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
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// export-studio.jsx — the Publishing Studio (S32).
//
// One panel, four artefacts: a still (PNG), a figure (SVG + CSV + sidecar), a short recording (WebM) and a lab report
// (print). The panel's job is to be honest about what this build can and cannot do — an unsupported codec, a scene
// without a render target and the static-hosting OG limitation are all stated before a button is pressed, not after
// it fails.
//
// All the decisions live in js/export/*.mjs, which is pure and tested in Node; this file draws the controls and calls
// them. The only browser-only code here is the download itself and the print call.

var _React = React,
  useState = _React.useState,
  useEffect = _React.useEffect,
  useMemo = _React.useMemo,
  useRef = _React.useRef,
  useCallback = _React.useCallback;
function downloadBlob(filename, blob) {
  var url = URL.createObjectURL(blob);
  var anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking immediately can race the download in some browsers; one task is enough and keeps the URL from leaking.
  setTimeout(function () {
    return URL.revokeObjectURL(url);
  }, 1000);
}
function downloadText(filename, text, type) {
  downloadBlob(filename, new Blob([text], {
    type: type !== null && type !== void 0 ? type : "text/plain;charset=utf-8"
  }));
}

// The page collectors live in the app shell (`collectPageReadouts` / `collectPageFormulas`), because the report route
// needs them on mount as well as the studio needing them on a click. One definition, two callers.

/** The provenance entry for whatever the current view says it is showing, if it registered one. */
function currentProvenance(view) {
  var registry = window.QGA_PROVENANCE;
  if (!registry) return null;
  var id = window.__qgaCurrentProvenanceId || "".concat(view, "-view");
  var entry = registry.get ? registry.get(id) : null;
  return entry ? _objectSpread({
    id: id
  }, entry) : null;
}
function ExportSection(_ref) {
  var title = _ref.title,
    note = _ref.note,
    children = _ref.children;
  return /*#__PURE__*/React.createElement("section", {
    className: "export-section"
  }, /*#__PURE__*/React.createElement("h3", null, title), note ? /*#__PURE__*/React.createElement("p", {
    className: "small dim export-note"
  }, note) : null, children);
}

/**
 * A closed studio must cost nothing: this wrapper returns before any hook runs, and the panel below is only mounted
 * while the drawer is open. Reading the URL and probing MediaRecorder on every render of the shell is a cost that
 * belongs to the open drawer, not the page.
 */
function ExportStudio(_ref2) {
  var open = _ref2.open,
    onClose = _ref2.onClose;
  if (!open) return null;
  return /*#__PURE__*/React.createElement(ExportStudioPanel, {
    onClose: onClose
  });
}
function ExportStudioPanel(_ref3) {
  var onClose = _ref3.onClose;
  var state = window.QGA_READ_STATE ? window.QGA_READ_STATE() : {};
  var view = state.view || "overview";
  var settings = window.QGA_LAST_SETTINGS ? window.QGA_LAST_SETTINGS() : {};
  var _useState = useState(null),
    _useState2 = _slicedToArray(_useState, 2),
    notice = _useState2[0],
    setNotice = _useState2[1];
  var _useState3 = useState(null),
    _useState4 = _slicedToArray(_useState3, 2),
    busy = _useState4[0],
    setBusy = _useState4[1];
  var _useState5 = useState(null),
    _useState6 = _slicedToArray(_useState5, 2),
    progress = _useState6[0],
    setProgress = _useState6[1];
  var _useState7 = useState("2k"),
    _useState8 = _slicedToArray(_useState7, 2),
    preset = _useState8[0],
    setPreset = _useState8[1];
  var _useState9 = useState(174),
    _useState0 = _slicedToArray(_useState9, 2),
    widthMm = _useState0[0],
    setWidthMm = _useState0[1];
  var _useState1 = useState("dark"),
    _useState10 = _slicedToArray(_useState1, 2),
    figureStyle = _useState10[0],
    setFigureStyle = _useState10[1];
  var _useState11 = useState(6),
    _useState12 = _slicedToArray(_useState11, 2),
    seconds = _useState12[0],
    setSeconds = _useState12[1];
  var _useState13 = useState(null),
    _useState14 = _slicedToArray(_useState13, 2),
    recording = _useState14[0],
    setRecording = _useState14[1];
  var abortRef = useRef(null);
  var panelRef = useRef(null);
  var support = useMemo(function () {
    return window.QGA_EXPORT ? window.QGA_EXPORT.recordingSupport(window) : {
      supported: false,
      reason: "The export module is not loaded."
    };
  }, []);
  useEffect(function () {
    var _panelRef$current;
    setNotice(null);
    setProgress(null);
    var onKey = function onKey(event) {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    (_panelRef$current = panelRef.current) === null || _panelRef$current === void 0 || _panelRef$current.focus({
      preventScroll: true
    });
    return function () {
      return window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  var EXPORT = window.QGA_EXPORT;
  if (!EXPORT) {
    return /*#__PURE__*/React.createElement("div", {
      className: "export-backdrop",
      onClick: onClose
    }, /*#__PURE__*/React.createElement("div", {
      className: "export-panel",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Publishing studio",
      onClick: function onClick(e) {
        return e.stopPropagation();
      }
    }, /*#__PURE__*/React.createElement("p", {
      role: "alert"
    }, "The export module did not load, so no file can be produced in this session."), /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: onClose
    }, "Close")));
  }
  var envelope = function envelope() {
    var _settings$renderBacke, _settings$detail3d, _state$seed, _window$QGA_COMMIT;
    return EXPORT.buildExportEnvelope({
      view: view,
      kind: "export",
      state: state,
      settings: settings,
      backend: (_settings$renderBacke = settings.renderBackend) !== null && _settings$renderBacke !== void 0 ? _settings$renderBacke : "auto",
      quality: (_settings$detail3d = settings.detail3d) !== null && _settings$detail3d !== void 0 ? _settings$detail3d : "medium",
      provenance: currentProvenance(view),
      references: [],
      seed: (_state$seed = state.seed) !== null && _state$seed !== void 0 ? _state$seed : 42,
      commitHash: (_window$QGA_COMMIT = window.QGA_COMMIT) !== null && _window$QGA_COMMIT !== void 0 ? _window$QGA_COMMIT : null,
      amplification: [EXPORT.DISPLAY_AMPLIFICATIONS.exposure, EXPORT.DISPLAY_AMPLIFICATIONS.toneMapping]
    });
  };
  var guard = function guard(label, action) {
    return /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var _error$message, _error$code, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            setBusy(label);
            setNotice(null);
            _context.p = 1;
            _context.n = 2;
            return action();
          case 2:
            _context.n = 4;
            break;
          case 3:
            _context.p = 3;
            _t = _context.v;
            setNotice({
              tone: "error",
              text: _t !== null && _t !== void 0 && _t.code ? "".concat(label, ": ").concat(_t.message) : "".concat(label, " failed: ").concat((_error$message = _t === null || _t === void 0 ? void 0 : _t.message) !== null && _error$message !== void 0 ? _error$message : String(_t)),
              code: (_error$code = _t === null || _t === void 0 ? void 0 : _t.code) !== null && _error$code !== void 0 ? _error$code : null
            });
          case 4:
            _context.p = 4;
            setBusy(null);
            setProgress(null);
            return _context.f(4);
          case 5:
            return _context.a(2);
        }
      }, _callee, null, [[1, 3, 4, 5]]);
    }));
  };

  /* ---- still ---- */
  var exportStill = guard("Still export", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
    var handle, _yield$EXPORT$capture, canvas, plan, bytes, meta;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          handle = window.__qgaActiveScenes ? _toConsumableArray(window.__qgaActiveScenes).at(-1) : null;
          _context2.n = 1;
          return EXPORT.captureStill(handle, {
            preset: preset,
            aspect: 16 / 9
          });
        case 1:
          _yield$EXPORT$capture = _context2.v;
          canvas = _yield$EXPORT$capture.canvas;
          plan = _objectWithoutProperties(_yield$EXPORT$capture, _excluded);
          _context2.n = 2;
          return EXPORT.canvasToPngBytes(canvas);
        case 2:
          bytes = _context2.v;
          meta = envelope();
          downloadBlob(EXPORT.exportFileName({
            view: view,
            kind: "still-".concat(preset),
            ext: "png"
          }), new Blob([bytes], {
            type: "image/png"
          }));
          setNotice({
            tone: "ok",
            text: plan.viewport ? "Saved the viewport still at the drawing buffer's own size." : "Saved a ".concat(plan.width, "\xD7").concat(plan.height, " still (").concat((plan.bytes / Math.pow(1024, 2)).toFixed(0), " MiB of capture memory).")
          });
          void meta;
        case 3:
          return _context2.a(2);
      }
    }, _callee2);
  })));

  /* ---- figure ---- */
  var exportFigure = guard("Figure export", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
    var _state$seed2;
    var spec, result, sidecar;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.n) {
        case 0:
          spec = window.__qgaFigureSpec;
          if (spec) {
            _context3.n = 1;
            break;
          }
          throw new Error("No Figure Kit figure is mounted in this view. Open a view with a 2D figure and try again.");
        case 1:
          _context3.n = 2;
          return EXPORT.buildFigureExport({
            spec: spec,
            scene: window.__qgaFigureScene,
            renderSvg: window.QGA_FIGURE.renderSvg,
            dataTable: window.QGA_FIGURE.dataTable,
            provenance: currentProvenance(view),
            state: state,
            seed: (_state$seed2 = state.seed) !== null && _state$seed2 !== void 0 ? _state$seed2 : 42,
            widthMm: Number(widthMm),
            style: figureStyle,
            figureNumber: 1
          });
        case 2:
          result = _context3.v;
          _context3.n = 3;
          return EXPORT.buildFigureSidecar({
            envelope: result.envelope,
            csv: result.csv,
            figureId: spec.id,
            widthMm: Number(widthMm),
            style: figureStyle
          });
        case 3:
          sidecar = _context3.v;
          downloadText(result.files.svg, result.svg, "image/svg+xml;charset=utf-8");
          downloadText(result.files.csv, result.csv, "text/csv;charset=utf-8");
          downloadText(result.files.json, EXPORT.sidecarJson(sidecar), "application/json;charset=utf-8");
          setNotice({
            tone: "ok",
            text: "Saved ".concat(result.files.svg.split("/").pop(), ": SVG, ").concat(result.rowCount, " data rows and a sidecar hashing the CSV (sha256 ").concat(sidecar.data.sha256.slice(0, 12), "\u2026).")
          });
        case 4:
          return _context3.a(2);
      }
    }, _callee3);
  })));

  /* ---- share card ---- */
  var exportCard = guard("Share card", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
    var _window$__qgaCurrentV, _state$seed3, _window$QGA_COMMIT2;
    var card, svg;
    return _regenerator().w(function (_context4) {
      while (1) switch (_context4.n) {
        case 0:
          card = EXPORT.shareCardScene({
            state: state,
            viewId: view,
            viewTitle: (_window$__qgaCurrentV = window.__qgaCurrentViewTitle) !== null && _window$__qgaCurrentV !== void 0 ? _window$__qgaCurrentV : view,
            provenance: currentProvenance(view),
            seed: (_state$seed3 = state.seed) !== null && _state$seed3 !== void 0 ? _state$seed3 : 42,
            commitHash: (_window$QGA_COMMIT2 = window.QGA_COMMIT) !== null && _window$QGA_COMMIT2 !== void 0 ? _window$QGA_COMMIT2 : null
          });
          svg = EXPORT.shareCardSvg(card, {
            css: function css(token) {
              return window.QGA_TOKENS.css(token);
            }
          });
          downloadText("horizon-share-".concat(view, ".svg"), svg, "image/svg+xml;charset=utf-8");
          downloadText("horizon-share-".concat(view, ".json"), EXPORT.sidecarJson(EXPORT.shareCardSidecar(card)), "application/json;charset=utf-8");
          setNotice({
            tone: "ok",
            text: "Saved the 1200×630 share card and its sidecar."
          });
        case 1:
          return _context4.a(2);
      }
    }, _callee4);
  })));

  /* ---- recording ---- */
  var startRecording = guard("Recording", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
    var _handle$element, _handle$element$query, _handle$element2, _handle$capture;
    var handle, canvas, result, meta;
    return _regenerator().w(function (_context5) {
      while (1) switch (_context5.n) {
        case 0:
          handle = window.__qgaActiveScenes ? _toConsumableArray(window.__qgaActiveScenes).at(-1) : null; // A stage-backed scene keeps its canvas inside the host element; a direct one is the canvas itself.
          canvas = (handle === null || handle === void 0 || (_handle$element = handle.element) === null || _handle$element === void 0 ? void 0 : _handle$element.tagName) === "CANVAS" ? handle.element : (_handle$element$query = handle === null || handle === void 0 || (_handle$element2 = handle.element) === null || _handle$element2 === void 0 ? void 0 : _handle$element2.querySelector("canvas")) !== null && _handle$element$query !== void 0 ? _handle$element$query : handle === null || handle === void 0 || (_handle$capture = handle.capture) === null || _handle$capture === void 0 ? void 0 : _handle$capture.call(handle);
          if (canvas) {
            _context5.n = 1;
            break;
          }
          throw new ExportError("not-supported", "No drawing canvas is mounted in this view, so there is nothing to record.");
        case 1:
          abortRef.current = new AbortController();
          setRecording({
            active: true,
            frame: 0,
            frames: 0
          });
          _context5.n = 2;
          return EXPORT.recordCanvas({
            canvas: canvas,
            seconds: seconds,
            fps: 30,
            signal: abortRef.current.signal,
            // `capture()` renders the frame synchronously and hands back the canvas; for a scene without it the browser's
            // own compositing still advances while the loop awaits a frame.
            draw: handle !== null && handle !== void 0 && handle.capture ? function () {
              return handle.capture();
            } : null,
            onProgress: function onProgress(_ref9) {
              var frame = _ref9.frame,
                frames = _ref9.frames;
              return setRecording({
                active: true,
                frame: frame,
                frames: frames
              });
            }
          });
        case 2:
          result = _context5.v;
          meta = envelope();
          downloadBlob(result.name, result.blob);
          downloadText(result.name.replace(/\.webm$/, ".json"), EXPORT.sidecarJson(_objectSpread(_objectSpread({}, meta), {}, {
            kind: "recording",
            mime: result.mime,
            frames: result.frames
          })), "application/json;charset=utf-8");
          setRecording(null);
          setNotice({
            tone: "ok",
            text: "Saved ".concat(result.frames, " frames as ").concat(result.mime, " (").concat((result.bytes / Math.pow(1024, 2)).toFixed(1), " MiB).")
          });
        case 3:
          return _context5.a(2);
      }
    }, _callee5);
  })));
  var cancelRecording = function cancelRecording() {
    var _abortRef$current;
    (_abortRef$current = abortRef.current) === null || _abortRef$current === void 0 || _abortRef$current.abort();
    setRecording(null);
  };

  /* ---- report ---- */
  var printReport = guard("Lab report", /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
    var _window$__qgaCurrentV2, _settings$renderBacke2, _settings$detail3d2, _state$seed4, _window$QGA_COMMIT3;
    var report;
    return _regenerator().w(function (_context6) {
      while (1) switch (_context6.n) {
        case 0:
          report = EXPORT.buildLabReport({
            view: view,
            viewTitle: (_window$__qgaCurrentV2 = window.__qgaCurrentViewTitle) !== null && _window$__qgaCurrentV2 !== void 0 ? _window$__qgaCurrentV2 : view,
            state: state,
            settings: settings,
            backend: (_settings$renderBacke2 = settings.renderBackend) !== null && _settings$renderBacke2 !== void 0 ? _settings$renderBacke2 : "auto",
            quality: (_settings$detail3d2 = settings.detail3d) !== null && _settings$detail3d2 !== void 0 ? _settings$detail3d2 : "medium",
            provenance: currentProvenance(view),
            // A report documents the page it was printed from, so the numbers come from the rendered readouts and cards.
            readouts: window.__qgaReportReadouts ? window.__qgaReportReadouts() : collectPageReadouts(),
            formulas: window.__qgaReportFormulas ? window.__qgaReportFormulas() : collectPageFormulas(),
            seed: (_state$seed4 = state.seed) !== null && _state$seed4 !== void 0 ? _state$seed4 : 42,
            commitHash: (_window$QGA_COMMIT3 = window.QGA_COMMIT) !== null && _window$QGA_COMMIT3 !== void 0 ? _window$QGA_COMMIT3 : null
          });
          window.__qgaPendingReport = report;
          window.dispatchEvent(new CustomEvent("qga-open-report", {
            detail: {
              report: report
            }
          }));
          setNotice({
            tone: "ok",
            text: "The report opened in the print view; use your browser's Print to PDF."
          });
        case 1:
          return _context6.a(2);
      }
    }, _callee6);
  })));
  return /*#__PURE__*/React.createElement("div", {
    className: "export-backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "export-panel",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Publishing studio",
    ref: panelRef,
    tabIndex: -1,
    onClick: function onClick(event) {
      return event.stopPropagation();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "export-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "export-kicker"
  }, "Publishing studio"), /*#__PURE__*/React.createElement("h2", null, "Export what you see")), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: onClose,
    "aria-label": "Close the publishing studio"
  }, "Close")), /*#__PURE__*/React.createElement("p", {
    className: "small dim export-lede"
  }, "Every file carries the application version, the state that produced it, the scientific status of the view, the seed and the display transforms. Nothing here is a screenshot of browser chrome."), notice ? /*#__PURE__*/React.createElement("p", {
    className: "export-notice ".concat(notice.tone),
    role: notice.tone === "error" ? "alert" : "status"
  }, notice.text) : null, /*#__PURE__*/React.createElement(ExportSection, {
    title: "Still image",
    note: "PNG at the drawing buffer's size, or a render target. The memory guard refuses a request before anything is allocated."
  }, /*#__PURE__*/React.createElement("div", {
    className: "export-row"
  }, /*#__PURE__*/React.createElement("label", null, "Size", /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: preset,
    onChange: function onChange(e) {
      return setPreset(e.target.value);
    }
  }, Object.entries(EXPORT.STILL_PRESETS).map(function (_ref1) {
    var _ref10 = _slicedToArray(_ref1, 2),
      id = _ref10[0],
      entry = _ref10[1];
    return /*#__PURE__*/React.createElement("option", {
      key: id,
      value: id
    }, entry.label);
  }))), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    disabled: busy != null,
    onClick: exportStill
  }, busy === "Still export" ? "Rendering…" : "Save PNG"))), /*#__PURE__*/React.createElement(ExportSection, {
    title: "Figure",
    note: "A vector SVG at a journal width, the CSV behind it, and a sidecar whose SHA-256 is the CSV's. Heat maps stay raster because they are raster data."
  }, /*#__PURE__*/React.createElement("div", {
    className: "export-row"
  }, /*#__PURE__*/React.createElement("label", null, "Width", /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: widthMm,
    onChange: function onChange(e) {
      return setWidthMm(Number(e.target.value));
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: EXPORT.FIGURE_WIDTHS_MM.single
  }, "85 mm (single column)"), /*#__PURE__*/React.createElement("option", {
    value: EXPORT.FIGURE_WIDTHS_MM["double"]
  }, "174 mm (double column)"))), /*#__PURE__*/React.createElement("label", null, "Style", /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: figureStyle,
    onChange: function onChange(e) {
      return setFigureStyle(e.target.value);
    }
  }, EXPORT.FIGURE_STYLES.map(function (style) {
    return /*#__PURE__*/React.createElement("option", {
      key: style,
      value: style
    }, style);
  }))), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    disabled: busy != null,
    onClick: exportFigure
  }, "Save SVG + CSV"))), /*#__PURE__*/React.createElement(ExportSection, {
    title: "Share card",
    note: EXPORT.SHARE_CARD_LIMITATION
  }, /*#__PURE__*/React.createElement("div", {
    className: "export-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    disabled: busy != null,
    onClick: exportCard
  }, "Save 1200\xD7630 card"))), /*#__PURE__*/React.createElement(ExportSection, {
    title: "Recording",
    note: support.supported ? "WebM via ".concat(support.mime, ". Frames are drawn at a fixed timestep, so the same shot yields the same frames. Audio is never included unless you record it yourself.") : support.reason
  }, /*#__PURE__*/React.createElement("div", {
    className: "export-row"
  }, /*#__PURE__*/React.createElement("label", null, "Length", /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: seconds,
    onChange: function onChange(e) {
      return setSeconds(Number(e.target.value));
    },
    disabled: !support.supported
  }, Object.entries(EXPORT.RECORDING_PRESETS).map(function (_ref11) {
    var _ref12 = _slicedToArray(_ref11, 2),
      value = _ref12[0],
      entry = _ref12[1];
    return /*#__PURE__*/React.createElement("option", {
      key: value,
      value: Number(value)
    }, entry.label);
  }))), recording !== null && recording !== void 0 && recording.active ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "mono small",
    "aria-live": "polite"
  }, "frame ", recording.frame, " / ", recording.frames), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: cancelRecording
  }, "Cancel")) : /*#__PURE__*/React.createElement("button", {
    className: "btn",
    disabled: !support.supported || busy != null,
    onClick: startRecording
  }, "Record ", seconds, " s"))), /*#__PURE__*/React.createElement(ExportSection, {
    title: "Lab report",
    note: "A print/PDF-ready document with the state, the formulas, the readouts, the assumptions, the references and the provenance. It uses the browser's print pipeline rather than a bundled PDF writer."
  }, /*#__PURE__*/React.createElement("div", {
    className: "export-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    disabled: busy != null,
    onClick: printReport
  }, "Open print view")))));
}

/**
 * The print view of a lab report.
 *
 * It renders the report object the studio built, so the printed page and the data are the same document — a report
 * that looked different on paper would be a second source of truth. The browser's own print pipeline turns this into a
 * PDF; the studio does not bundle a PDF writer.
 */
function ReportSheet(_ref13) {
  var _window$QGA_EXPORT$RE;
  var report = _ref13.report,
    onClose = _ref13.onClose;
  if (!report) return null;
  var primary = (_window$QGA_EXPORT$RE = window.QGA_EXPORT.REPORT_PRIMARY_KEYS[report.view]) !== null && _window$QGA_EXPORT$RE !== void 0 ? _window$QGA_EXPORT$RE : [];
  var rows = window.QGA_EXPORT.reportStateRows(report.state, {
    primary: primary
  });
  var main = rows.filter(function (row) {
    return row.primary;
  });
  var rest = rows.filter(function (row) {
    return !row.primary;
  });
  return /*#__PURE__*/React.createElement("article", {
    className: "report-sheet",
    "data-screen-label": "Lab report"
  }, /*#__PURE__*/React.createElement("header", {
    className: "report-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "export-kicker"
  }, "Lab report \xB7 HORIZON"), /*#__PURE__*/React.createElement("h1", null, report.title), /*#__PURE__*/React.createElement("p", {
    className: "report-meta"
  }, report.viewTitle, " (", report.view, ") \xB7 generated ", report.generatedAt, /*#__PURE__*/React.createElement("br", null), "version ", report.applicationVersion, " \xB7 commit ", report.commitHash, " \xB7 seed ", report.seed, " \xB7 backend ", report.backend, " \xB7 quality ", report.quality), /*#__PURE__*/React.createElement("div", {
    className: "tour-controls no-print"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: function onClick() {
      return window.print();
    }
  }, "Print / save as PDF"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: onClose
  }, "Close report"))), /*#__PURE__*/React.createElement("section", {
    className: "report-section"
  }, /*#__PURE__*/React.createElement("h2", null, "State of this view"), /*#__PURE__*/React.createElement("table", {
    className: "report-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Parameter"), /*#__PURE__*/React.createElement("th", null, "Value"))), /*#__PURE__*/React.createElement("tbody", null, main.map(function (row) {
    return /*#__PURE__*/React.createElement("tr", {
      key: row.key
    }, /*#__PURE__*/React.createElement("td", {
      className: "mono"
    }, row.key), /*#__PURE__*/React.createElement("td", null, row.value));
  }))), rest.length ? /*#__PURE__*/React.createElement("details", {
    className: "report-rest"
  }, /*#__PURE__*/React.createElement("summary", null, "All ", rest.length, " remaining parameters"), /*#__PURE__*/React.createElement("table", {
    className: "report-table compact"
  }, /*#__PURE__*/React.createElement("tbody", null, rest.map(function (row) {
    return /*#__PURE__*/React.createElement("tr", {
      key: row.key
    }, /*#__PURE__*/React.createElement("td", {
      className: "mono"
    }, row.key), /*#__PURE__*/React.createElement("td", null, row.value));
  })))) : null), report.provenance ? /*#__PURE__*/React.createElement("section", {
    className: "report-section"
  }, /*#__PURE__*/React.createElement("h2", null, "Model and validity"), /*#__PURE__*/React.createElement("p", {
    className: "small"
  }, /*#__PURE__*/React.createElement("strong", null, report.provenance.id), " \u2014 status ", report.provenance.status), report.provenance.model ? /*#__PURE__*/React.createElement("p", {
    className: "small"
  }, report.provenance.model) : null, report.provenance.assumptions.length ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h3", null, "Assumptions"), /*#__PURE__*/React.createElement("ul", {
    className: "report-list"
  }, report.provenance.assumptions.map(function (item, i) {
    return /*#__PURE__*/React.createElement("li", {
      key: i
    }, item);
  }))) : null, report.provenance.validity.length ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h3", null, "Limits"), /*#__PURE__*/React.createElement("ul", {
    className: "report-list"
  }, report.provenance.validity.map(function (item, i) {
    return /*#__PURE__*/React.createElement("li", {
      key: i
    }, item);
  }))) : null, report.provenance.numericalMethod ? /*#__PURE__*/React.createElement("p", {
    className: "small dim"
  }, report.provenance.numericalMethod) : null) : null, report.formulas.length ? /*#__PURE__*/React.createElement("section", {
    className: "report-section"
  }, /*#__PURE__*/React.createElement("h2", null, "Formulas"), report.formulas.map(function (formula, i) {
    var _formula$title;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "report-formula"
    }, /*#__PURE__*/React.createElement("p", {
      className: "small"
    }, /*#__PURE__*/React.createElement("strong", null, (_formula$title = formula.title) !== null && _formula$title !== void 0 ? _formula$title : formula.id), formula.status ? " \u2014 ".concat(formula.status) : ""), formula.tex ? /*#__PURE__*/React.createElement("div", {
      className: "fc-eq"
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: formula.tex,
      display: true
    })) : null);
  })) : null, report.readouts.length ? /*#__PURE__*/React.createElement("section", {
    className: "report-section"
  }, /*#__PURE__*/React.createElement("h2", null, "Numerical results"), /*#__PURE__*/React.createElement("table", {
    className: "report-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Quantity"), /*#__PURE__*/React.createElement("th", null, "Value"), /*#__PURE__*/React.createElement("th", null, "Unit"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, report.readouts.map(function (readout, i) {
    var _readout$value, _readout$unit, _readout$status;
    return /*#__PURE__*/React.createElement("tr", {
      key: i
    }, /*#__PURE__*/React.createElement("td", null, readout.label), /*#__PURE__*/React.createElement("td", {
      className: "mono"
    }, (_readout$value = readout.value) !== null && _readout$value !== void 0 ? _readout$value : "—"), /*#__PURE__*/React.createElement("td", {
      className: "mono"
    }, (_readout$unit = readout.unit) !== null && _readout$unit !== void 0 ? _readout$unit : "—"), /*#__PURE__*/React.createElement("td", null, (_readout$status = readout.status) !== null && _readout$status !== void 0 ? _readout$status : "—"));
  })))) : null, report.screenshots.length ? /*#__PURE__*/React.createElement("section", {
    className: "report-section"
  }, /*#__PURE__*/React.createElement("h2", null, "Figures"), /*#__PURE__*/React.createElement("ul", {
    className: "report-list"
  }, report.screenshots.map(function (shot, i) {
    return /*#__PURE__*/React.createElement("li", {
      key: i
    }, shot.caption, " ", /*#__PURE__*/React.createElement("span", {
      className: "mono"
    }, "(", shot.src, ")"), shot.provenanceId ? " [".concat(shot.provenanceId, "]") : "");
  }))) : null, report.references.length ? /*#__PURE__*/React.createElement("section", {
    className: "report-section"
  }, /*#__PURE__*/React.createElement("h2", null, "References"), /*#__PURE__*/React.createElement("ol", {
    className: "report-list"
  }, report.references.map(function (reference, i) {
    return /*#__PURE__*/React.createElement("li", {
      key: i
    }, reference);
  }))) : null, report.notes.length ? /*#__PURE__*/React.createElement("section", {
    className: "report-section"
  }, /*#__PURE__*/React.createElement("h2", null, "Notes"), /*#__PURE__*/React.createElement("ul", {
    className: "report-list"
  }, report.notes.map(function (note, i) {
    return /*#__PURE__*/React.createElement("li", {
      key: i
    }, note);
  }))) : null, /*#__PURE__*/React.createElement("p", {
    className: "report-foot"
  }, "No quantum gravity theory is experimentally confirmed. Every figure and readout in this report carries its scientific status; values are computed by the atlas's tested modules at the state shown above."));
}