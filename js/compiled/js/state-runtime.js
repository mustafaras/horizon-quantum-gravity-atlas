/* Compiled from js/state-runtime.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
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
function qgaSeeded(seed) {
  var _window$QGA_PHYSICS, _window$QGA_PHYSICS$s;
  return ((_window$QGA_PHYSICS = window.QGA_PHYSICS) === null || _window$QGA_PHYSICS === void 0 || (_window$QGA_PHYSICS$s = _window$QGA_PHYSICS.seededRng) === null || _window$QGA_PHYSICS$s === void 0 ? void 0 : _window$QGA_PHYSICS$s.call(_window$QGA_PHYSICS, seed)) || function () {
    var x = Number(seed) >>> 0 || 1;
    return function () {
      x = 1664525 * x + 1013904223 >>> 0;
      return x / 4294967296;
    };
  }();
}
function useQGAState() {
  var _useState = useState(function () {
      return qgaReadState();
    }),
    _useState2 = _slicedToArray(_useState, 2),
    state = _useState2[0],
    setState = _useState2[1];
  useEffect(function () {
    var onPop = function onPop() {
      qgaPendingOverlay = null;
      setState(qgaReadState());
    };
    var onStateChange = function onStateChange(event) {
      return setState(event.detail);
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("qga-statechange", onStateChange);
    return function () {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("qga-statechange", onStateChange);
    };
  }, []);
  var update = useCallback(function (patch) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return setState(function () {
      var _qgaPendingOverlay;
      // Merge over the closure-tracked pending state, not the URL: React 18
      // batches synchronous update loops and a URL-read base would skip the
      // second write of a same-tick pair.
      var current = (_qgaPendingOverlay = qgaPendingOverlay) !== null && _qgaPendingOverlay !== void 0 ? _qgaPendingOverlay : qgaReadState();
      var next = _objectSpread(_objectSpread({}, current), typeof patch === "function" ? patch(current) : patch);
      qgaWriteState(next, options);
      return next;
    });
  }, []);
  return [state, update];
}
// Compare-view tween path: apply a state patch WITHOUT touching the URL or
// history (the compare controller owns the address bar; the embed only needs
// live values). Still dispatches qga-statechange so every consumer — physics
// readouts included — recomputes from the merged state each frame.
function qgaApplySilent(patch) {
  var _qgaPendingOverlay2;
  var base = (_qgaPendingOverlay2 = qgaPendingOverlay) !== null && _qgaPendingOverlay2 !== void 0 ? _qgaPendingOverlay2 : qgaReadState();
  var next = _objectSpread(_objectSpread({}, base), typeof patch === "function" ? patch(base) : patch);
  qgaPendingOverlay = next;
  window.dispatchEvent(new CustomEvent("qga-statechange", {
    detail: _objectSpread({}, next)
  }));
  return next;
}
window.QGA_DEFAULT_STATE = QGA_DEFAULT_STATE;
window.QGA_READ_STATE = qgaReadState;
window.QGA_WRITE_STATE = qgaWriteState;
window.QGA_APPLY_SILENT = qgaApplySilent;
window.QGA_LAST_ANNOTATION_REJECTION = function () {
  return qgaLastAnnotationRejection;
};
window.QGA_SEEDED = qgaSeeded;
window.useQGAState = useQGAState;
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
window.QGA_COPY_LINK = qgaCopyLink;
window.QGA_EXPORT_JSON = qgaExportJson;
// Official API v2 documentation: https://gwosc.org/api/v2/docs (schema: /api/v2/schema).
// The response cap keeps this static client from turning a shareable page into an
// unbounded archive downloader.
function qgaReadBounded(_x2, _x3) {
  return _qgaReadBounded.apply(this, arguments);
}
function _qgaReadBounded() {
  _qgaReadBounded = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(response, maxBytes) {
    var _response$body;
    var reader, chunks, total, _yield$reader$read, done, value, bytes, offset, _i, _chunks, chunk;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          if ((_response$body = response.body) !== null && _response$body !== void 0 && _response$body.getReader) {
            _context2.n = 1;
            break;
          }
          throw new Error("Streaming response reads are unavailable.");
        case 1:
          reader = response.body.getReader();
          chunks = [];
          total = 0;
          _context2.p = 2;
        case 3:
          if (!true) {
            _context2.n = 8;
            break;
          }
          _context2.n = 4;
          return reader.read();
        case 4:
          _yield$reader$read = _context2.v;
          done = _yield$reader$read.done;
          value = _yield$reader$read.value;
          if (!done) {
            _context2.n = 5;
            break;
          }
          return _context2.a(3, 8);
        case 5:
          total += value.byteLength;
          if (!(total > maxBytes)) {
            _context2.n = 7;
            break;
          }
          _context2.n = 6;
          return reader.cancel("GWOSC response exceeded the browser safety limit.");
        case 6:
          throw new Error("GWOSC response exceeded the browser safety limit.");
        case 7:
          chunks.push(value);
          _context2.n = 3;
          break;
        case 8:
          _context2.p = 8;
          reader.releaseLock();
          return _context2.f(8);
        case 9:
          bytes = new Uint8Array(total);
          offset = 0;
          for (_i = 0, _chunks = chunks; _i < _chunks.length; _i++) {
            chunk = _chunks[_i];
            bytes.set(chunk, offset);
            offset += chunk.byteLength;
          }
          return _context2.a(2, bytes);
      }
    }, _callee2, null, [[2,, 8, 9]]);
  }));
  return _qgaReadBounded.apply(this, arguments);
}
function qgaFetchGWOSC(_x4) {
  return _qgaFetchGWOSC.apply(this, arguments);
}
function _qgaFetchGWOSC() {
  _qgaFetchGWOSC = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(event) {
    var _ref,
      _ref$detector,
      detector,
      _ref$start,
      start,
      _ref$duration,
      duration,
      signal,
      _ref$timeoutMs,
      timeoutMs,
      controller,
      timer,
      _file,
      eventName,
      detailUrl,
      detailResponse,
      detail,
      explicitVersion,
      candidates,
      file,
      filesUrl,
      _iterator,
      _step,
      _listing$results,
      candidate,
      response,
      listing,
      strainResponse,
      compressed,
      bytes,
      stream,
      text,
      values,
      sampleRate,
      sourceStart,
      sourceStop,
      selectedStart,
      selectedStop,
      from,
      to,
      selectedValues,
      maxSamples,
      stride,
      samples,
      _args3 = arguments,
      _t;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          _ref = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : {}, _ref$detector = _ref.detector, detector = _ref$detector === void 0 ? "H1" : _ref$detector, _ref$start = _ref.start, start = _ref$start === void 0 ? 1126259446 : _ref$start, _ref$duration = _ref.duration, duration = _ref$duration === void 0 ? 16 : _ref$duration, signal = _ref.signal, _ref$timeoutMs = _ref.timeoutMs, timeoutMs = _ref$timeoutMs === void 0 ? 12000 : _ref$timeoutMs;
          controller = new AbortController();
          timer = setTimeout(function () {
            return controller.abort();
          }, timeoutMs);
          if (signal) signal.addEventListener("abort", function () {
            return controller.abort();
          }, {
            once: true
          });
          _context3.p = 1;
          eventName = encodeURIComponent(event);
          detailUrl = "https://gwosc.org/api/v2/event-versions/" + eventName;
          _context3.n = 2;
          return fetch(detailUrl, {
            signal: controller.signal,
            headers: {
              Accept: "application/json"
            }
          });
        case 2:
          detailResponse = _context3.v;
          if (detailResponse.ok) {
            _context3.n = 3;
            break;
          }
          throw new Error("GWOSC event lookup returned HTTP " + detailResponse.status);
        case 3:
          _context3.n = 4;
          return detailResponse.json();
        case 4:
          detail = _context3.v;
          explicitVersion = /-v\d+$/i.test(event);
          candidates = explicitVersion ? [event] : Array.from({
            length: Math.min(4, detail.version)
          }, function (_, index) {
            return detail.name + "-v" + (detail.version - index);
          });
          file = null, filesUrl = "";
          _iterator = _createForOfIteratorHelper(candidates);
          _context3.p = 5;
          _iterator.s();
        case 6:
          if ((_step = _iterator.n()).done) {
            _context3.n = 12;
            break;
          }
          candidate = _step.value;
          filesUrl = "https://gwosc.org/api/v2/event-versions/" + encodeURIComponent(candidate) + "/strain-files?detector=" + encodeURIComponent(detector) + "&sample-rate=4&duration=32&file-format=txt&page=1&pagesize=1";
          _context3.n = 7;
          return fetch(filesUrl, {
            signal: controller.signal,
            headers: {
              Accept: "application/json"
            }
          });
        case 7:
          response = _context3.v;
          if (response.ok) {
            _context3.n = 8;
            break;
          }
          throw new Error("GWOSC strain lookup returned HTTP " + response.status);
        case 8:
          _context3.n = 9;
          return response.json();
        case 9:
          listing = _context3.v;
          file = ((_listing$results = listing.results) === null || _listing$results === void 0 ? void 0 : _listing$results[0]) || null;
          if (!file) {
            _context3.n = 10;
            break;
          }
          return _context3.a(3, 12);
        case 10:
          _context3.n = 11;
          return new Promise(function (resolve) {
            return setTimeout(resolve, 350);
          });
        case 11:
          _context3.n = 6;
          break;
        case 12:
          _context3.n = 14;
          break;
        case 13:
          _context3.p = 13;
          _t = _context3.v;
          _iterator.e(_t);
        case 14:
          _context3.p = 14;
          _iterator.f();
          return _context3.f(14);
        case 15:
          if ((_file = file) !== null && _file !== void 0 && _file.download_url) {
            _context3.n = 16;
            break;
          }
          throw new Error("GWOSC has no text strain file for this selection.");
        case 16:
          _context3.n = 17;
          return fetch(file.download_url, {
            signal: controller.signal,
            headers: {
              Accept: "text/plain, application/gzip"
            }
          });
        case 17:
          strainResponse = _context3.v;
          if (strainResponse.ok) {
            _context3.n = 18;
            break;
          }
          throw new Error("GWOSC strain download returned HTTP " + strainResponse.status);
        case 18:
          _context3.n = 19;
          return qgaReadBounded(strainResponse, 4 * 1024 * 1024);
        case 19:
          compressed = _context3.v;
          bytes = compressed;
          if (!file.download_url.endsWith(".gz")) {
            _context3.n = 22;
            break;
          }
          if (window.DecompressionStream) {
            _context3.n = 20;
            break;
          }
          throw new Error("This browser cannot decompress GWOSC text data.");
        case 20:
          stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
          _context3.n = 21;
          return qgaReadBounded(new Response(stream), 12 * 1024 * 1024);
        case 21:
          bytes = _context3.v;
        case 22:
          text = new TextDecoder().decode(bytes);
          values = text.split(/\r?\n/).map(function (line) {
            return Number(line.trim());
          }).filter(Number.isFinite);
          if (values.length) {
            _context3.n = 23;
            break;
          }
          throw new Error("GWOSC strain file contained no numeric samples.");
        case 23:
          sampleRate = file.sample_rate_kHz * 1000;
          sourceStart = Number(file.gps_start);
          sourceStop = sourceStart + Number(file.duration);
          selectedStart = Math.max(Number(start), sourceStart);
          selectedStop = Math.min(Number(start) + Number(duration), sourceStop);
          if (selectedStop > selectedStart) {
            _context3.n = 24;
            break;
          }
          throw new Error("Selected GPS range is outside the GWOSC strain file.");
        case 24:
          from = Math.max(0, Math.floor((selectedStart - sourceStart) * sampleRate));
          to = Math.min(values.length, Math.ceil((selectedStop - sourceStart) * sampleRate));
          selectedValues = values.slice(from, to);
          maxSamples = 1200;
          stride = Math.max(1, Math.ceil(selectedValues.length / maxSamples));
          samples = selectedValues.filter(function (_, index) {
            return index % stride === 0;
          }).slice(0, maxSamples);
          return _context3.a(2, {
            ok: true,
            event: event,
            detector: detector,
            start: selectedStart,
            duration: selectedStop - selectedStart,
            sampleRate: sampleRate,
            samples: samples,
            provenance: {
              source: "GWOSC API v2 strain-files",
              url: filesUrl,
              downloadUrl: file.download_url,
              retrievedAt: new Date().toISOString(),
              mode: "real-strain",
              processing: "4 kHz calibrated TXT, gzip decoded, uniformly downsampled for preview"
            }
          });
        case 25:
          _context3.p = 25;
          clearTimeout(timer);
          return _context3.f(25);
        case 26:
          return _context3.a(2);
      }
    }, _callee3, null, [[5, 13, 14, 15], [1,, 25, 26]]);
  }));
  return _qgaFetchGWOSC.apply(this, arguments);
}
window.QGA_FETCH_GWOSC = qgaFetchGWOSC;