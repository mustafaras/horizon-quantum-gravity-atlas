/* Compiled from js/snapshots/snapshot-panel.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
// snapshot-panel.jsx — Prompt 10 named parameter snapshots.
//
// localStorage-backed store (schema "horizon-qga-snapshot/v1": version,
// timestamp, validated state, provenance, optional ≤320px thumbnail).
// Restore = camera fly-to (easeInOutQuint, ≤900ms) + a 700ms parameter tween
// applied through silent state patches so every physics quantity recomputes
// live; the final state lands in the URL/history. Import validates the full
// payload and resolves id conflicts explicitly (imported as a copy — never a
// silent overwrite). Save/delete micro-motion is a ≤250ms transform-only
// spring pop; thumbnails capture asynchronously and never block the UI.

function captureSnapshotThumbnail() {
  var maxEdge = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 320;
  return new Promise(function (resolve) {
    try {
      var _handle$capture, _handle$capture2, _handle$element;
      var scenes = window.__qgaActiveScenes;
      var handle = scenes ? _toConsumableArray(scenes)[scenes.size - 1] : null;
      // The WebGL drawing buffer is no longer preserved (F-22): ask the scene to draw now, in this task, and
      // read the canvas before returning to the event loop. A scene without capture() keeps the old lookup.
      var canvas = (_handle$capture = handle === null || handle === void 0 || (_handle$capture2 = handle.capture) === null || _handle$capture2 === void 0 ? void 0 : _handle$capture2.call(handle)) !== null && _handle$capture !== void 0 ? _handle$capture : handle === null || handle === void 0 || (_handle$element = handle.element) === null || _handle$element === void 0 ? void 0 : _handle$element.querySelector("canvas");
      if (!canvas || !canvas.width) {
        resolve(null);
        return;
      }
      var scale = Math.min(1, maxEdge / Math.max(canvas.width, canvas.height));
      var width = Math.max(1, Math.round(canvas.width * scale));
      var height = Math.max(1, Math.round(canvas.height * scale));
      var offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      var context = offscreen.getContext("2d");
      context.drawImage(canvas, 0, 0, width, height);
      var finish = function finish(url) {
        return resolve(url && url.length <= 131072 ? url : null);
      };
      if (offscreen.toBlob) {
        offscreen.toBlob(function (blob) {
          if (!blob) {
            finish(offscreen.toDataURL("image/png"));
            return;
          }
          var reader = new FileReader();
          reader.onload = function () {
            return finish(String(reader.result));
          };
          reader.onerror = function () {
            return finish(null);
          };
          reader.readAsDataURL(blob);
        }, "image/webp", 0.82);
      } else {
        finish(offscreen.toDataURL("image/png"));
      }
    } catch (error) {
      resolve(null);
    }
  });
}
function SnapshotPanel(_ref) {
  var _window$QGA_SNAPSHOTS2, _window$QGA_SNAPSHOTS3, _window$QGA_SNAPSHOTS4, _window$QGA_SNAPSHOTS5, _window$QGA_SNAPSHOTS6, _window$QGA_SNAPSHOTS7;
  var open = _ref.open,
    onClose = _ref.onClose;
  var _useState = useState([]),
    _useState2 = _slicedToArray(_useState, 2),
    snapshots = _useState2[0],
    setSnapshots = _useState2[1];
  var _useState3 = useState(null),
    _useState4 = _slicedToArray(_useState3, 2),
    storageError = _useState4[0],
    setStorageError = _useState4[1];
  var _useState5 = useState(null),
    _useState6 = _slicedToArray(_useState5, 2),
    notice = _useState6[0],
    setNotice = _useState6[1];
  var _useState7 = useState(""),
    _useState8 = _slicedToArray(_useState7, 2),
    name = _useState8[0],
    setName = _useState8[1];
  var _useState9 = useState(false),
    _useState0 = _slicedToArray(_useState9, 2),
    busy = _useState0[0],
    setBusy = _useState0[1];
  var _useState1 = useState(null),
    _useState10 = _slicedToArray(_useState1, 2),
    confirmRemove = _useState10[0],
    setConfirmRemove = _useState10[1];
  var _useState11 = useState(null),
    _useState12 = _slicedToArray(_useState11, 2),
    popId = _useState12[0],
    setPopId = _useState12[1];
  var fileInputRef = useRef(null);
  var storeRef = useRef(null);
  if (!storeRef.current) {
    var _window$QGA_SNAPSHOTS;
    storeRef.current = (_window$QGA_SNAPSHOTS = window.QGA_SNAPSHOTS) === null || _window$QGA_SNAPSHOTS === void 0 ? void 0 : _window$QGA_SNAPSHOTS.createSnapshotStore({
      storage: window.localStorage
    });
  }
  var refresh = useCallback(function () {
    var _result$snapshots;
    if (!storeRef.current) return;
    var result = storeRef.current.list();
    setSnapshots((_result$snapshots = result.snapshots) !== null && _result$snapshots !== void 0 ? _result$snapshots : []);
    setStorageError(result.ok ? result.dropped ? "".concat(result.dropped, " stored snapshot(s) were invalid and skipped.") : null : result.error);
  }, []);
  useEffect(function () {
    if (open) {
      refresh();
      setNotice(null);
      setConfirmRemove(null);
    }
  }, [open, refresh]);

  // Spring scale pop (transform-only, ≤250ms) on save/delete.
  var pop = function pop(id) {
    setPopId(id);
    setTimeout(function () {
      return setPopId(function (current) {
        return current === id ? null : current;
      });
    }, 260);
  };
  var saveSnapshot = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var _sceneHandle$getPose, _sceneHandle$getPose2, _ref3, _result$errors$join, _result$errors, state, scenes, sceneHandle, pose, thumbnail, id, record, cameraPose, result;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (!(!storeRef.current || busy)) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            setBusy(true);
            _context.p = 2;
            state = window.QGA_READ_STATE();
            scenes = window.__qgaActiveScenes;
            sceneHandle = scenes ? _toConsumableArray(scenes)[scenes.size - 1] : null;
            pose = (_sceneHandle$getPose = sceneHandle === null || sceneHandle === void 0 || (_sceneHandle$getPose2 = sceneHandle.getPose) === null || _sceneHandle$getPose2 === void 0 ? void 0 : _sceneHandle$getPose2.call(sceneHandle)) !== null && _sceneHandle$getPose !== void 0 ? _sceneHandle$getPose : null; // Thumbnail capture is async and best-effort; the UI never blocks.
            _context.n = 3;
            return Promise.race([captureSnapshotThumbnail(), new Promise(function (resolve) {
              return setTimeout(function () {
                return resolve(null);
              }, 600);
            })]);
          case 3:
            thumbnail = _context.v;
            id = "snap-" + Date.now().toString(36);
            record = window.QGA_SNAPSHOTS.createSnapshotRecord({
              id: id,
              name: name.trim() || (state.view ? "".concat(state.view, " \xB7 ").concat(new Date().toLocaleString()) : "Snapshot"),
              state: state,
              view: state.view,
              url: location.pathname + qgaStateSearch(state),
              thumbnail: thumbnail
            }); // The camera pose rides beside the record (never inside the scientific
            // state) so restoring can fly the camera back.
            cameraPose = pose;
            result = storeRef.current.save(cameraPose ? _objectSpread(_objectSpread({}, record), {}, {
              cameraPose: cameraPose
            }) : record);
            if (!result.ok) setNotice({
              kind: "error",
              text: (_ref3 = (_result$errors$join = (_result$errors = result.errors) === null || _result$errors === void 0 ? void 0 : _result$errors.join("; ")) !== null && _result$errors$join !== void 0 ? _result$errors$join : result.error) !== null && _ref3 !== void 0 ? _ref3 : "Snapshot could not be saved."
            });else {
              setNotice({
                kind: "ok",
                text: result.evicted ? "Snapshot saved (oldest evicted \u2014 the store keeps ".concat(window.QGA_SNAPSHOTS.SNAPSHOT_LIMITS.maxSnapshots, ").") : "Snapshot saved."
              });
              setName("");
              pop(id);
            }
            refresh();
          case 4:
            _context.p = 4;
            setBusy(false);
            return _context.f(4);
          case 5:
            return _context.a(2);
        }
      }, _callee, null, [[2,, 4, 5]]);
    }));
    return function saveSnapshot() {
      return _ref2.apply(this, arguments);
    };
  }();
  var restoreSnapshot = function restoreSnapshot(snapshot) {
    var _window$QGA_COMPARE;
    var target = snapshot.state;
    var current = window.QGA_READ_STATE();
    var MOTION = window.QGA_MOTION;
    var prm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Camera fly-to: easeInOutQuint, ≤900ms (Scene3D snaps it under PRM).
    var scenes = window.__qgaActiveScenes;
    var sceneHandle = scenes ? _toConsumableArray(scenes)[scenes.size - 1] : null;
    if (snapshot.cameraPose && sceneHandle !== null && sceneHandle !== void 0 && sceneHandle.flyTo) {
      sceneHandle.flyTo(snapshot.cameraPose, {
        easing: "quint",
        duration: 0.9
      });
    }
    var apply = function apply(patch) {
      var _window$QGA_APPLY_SIL, _window;
      var _ref4 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref4$final = _ref4["final"],
        _final = _ref4$final === void 0 ? false : _ref4$final;
      if (_final) qgaWriteState(patch, {
        replace: false
      });else (_window$QGA_APPLY_SIL = (_window = window).QGA_APPLY_SILENT) === null || _window$QGA_APPLY_SIL === void 0 || _window$QGA_APPLY_SIL.call(_window, patch);
    };
    var diff = (_window$QGA_COMPARE = window.QGA_COMPARE) === null || _window$QGA_COMPARE === void 0 ? void 0 : _window$QGA_COMPARE.diffStates(current, target);
    if (!diff || prm || !MOTION || !diff.tweenable.length && !diff.switches.length) {
      apply(target, {
        "final": true
      }); // reduced motion or no diff: instant
    } else {
      // 700ms parameter tween — physics recomputes every frame, then the
      // final state lands in the URL and history.
      MOTION.runtime.tween({
        from: 0,
        to: 1,
        duration: 700,
        easing: "easeInOutCubic",
        onUpdate: function onUpdate(t) {
          return apply(window.QGA_COMPARE.sampleTweenState(current, diff, t));
        },
        onComplete: function onComplete() {
          return apply(target, {
            "final": true
          });
        }
      });
    }
    setNotice({
      kind: "ok",
      text: "Restored \u201C".concat(snapshot.name, "\u201D.")
    });
  };
  var removeSnapshot = function removeSnapshot(id) {
    var _storeRef$current, _result$errors$, _result$errors2;
    var result = (_storeRef$current = storeRef.current) === null || _storeRef$current === void 0 ? void 0 : _storeRef$current.remove(id);
    if (result !== null && result !== void 0 && result.ok) {
      pop(id);
      setConfirmRemove(null);
    } else setNotice({
      kind: "error",
      text: (_result$errors$ = result === null || result === void 0 || (_result$errors2 = result.errors) === null || _result$errors2 === void 0 ? void 0 : _result$errors2[0]) !== null && _result$errors$ !== void 0 ? _result$errors$ : "Snapshot could not be removed."
    });
    refresh();
  };
  var exportSnapshot = function exportSnapshot(id) {
    var _storeRef$current2;
    var result = (_storeRef$current2 = storeRef.current) === null || _storeRef$current2 === void 0 ? void 0 : _storeRef$current2["export"](id);
    if (!(result !== null && result !== void 0 && result.ok)) {
      var _result$errors$2, _result$errors3;
      setNotice({
        kind: "error",
        text: (_result$errors$2 = result === null || result === void 0 || (_result$errors3 = result.errors) === null || _result$errors3 === void 0 ? void 0 : _result$errors3[0]) !== null && _result$errors$2 !== void 0 ? _result$errors$2 : "Export failed."
      });
      return;
    }
    var href = URL.createObjectURL(new Blob([JSON.stringify(result.payload, null, 2) + "\n"], {
      type: "application/json"
    }));
    var anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "horizon-snapshot-".concat(id, ".json");
    anchor.click();
    setTimeout(function () {
      return URL.revokeObjectURL(href);
    }, 0);
  };
  var importSnapshot = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(file) {
      var _storeRef$current3, _result$errors$join2, _result$errors4, payload, result, _t, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            _context2.p = 0;
            _t = JSON;
            _context2.n = 1;
            return file.text();
          case 1:
            payload = _t.parse.call(_t, _context2.v);
            result = (_storeRef$current3 = storeRef.current) === null || _storeRef$current3 === void 0 ? void 0 : _storeRef$current3["import"](payload);
            if (!(result !== null && result !== void 0 && result.ok)) setNotice({
              kind: "error",
              text: (_result$errors$join2 = result === null || result === void 0 || (_result$errors4 = result.errors) === null || _result$errors4 === void 0 ? void 0 : _result$errors4.join("; ")) !== null && _result$errors$join2 !== void 0 ? _result$errors$join2 : "Import failed."
            });else setNotice({
              kind: "ok",
              text: result.conflict ? "A snapshot with that id already exists \u2014 imported as a copy (\u201C".concat(result.importedAs, "\u201D).") : "Imported \u201C".concat(result.snapshot.name, "\u201D.")
            });
            refresh();
            _context2.n = 3;
            break;
          case 2:
            _context2.p = 2;
            _t2 = _context2.v;
            setNotice({
              kind: "error",
              text: "Import failed: ".concat(_t2.message)
            });
          case 3:
            return _context2.a(2);
        }
      }, _callee2, null, [[0, 2]]);
    }));
    return function importSnapshot(_x) {
      return _ref5.apply(this, arguments);
    };
  }();
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "snap-backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("aside", {
    className: "snap-panel",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Parameter snapshots",
    onClick: function onClick(e) {
      return e.stopPropagation();
    }
  }, /*#__PURE__*/React.createElement("header", {
    className: "snap-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "module-kicker"
  }, "Prompt 10 \xB7 Snapshots"), /*#__PURE__*/React.createElement("h2", null, "Parameter snapshots")), /*#__PURE__*/React.createElement("button", {
    className: "menu-btn",
    onClick: onClose,
    "aria-label": "Close snapshots panel"
  }, "CLOSE \u2715")), /*#__PURE__*/React.createElement("p", {
    className: "small dim"
  }, "Named atlas states stored locally with schema version, timestamp, provenance and an optional thumbnail. Restoring flies the camera back and tweens parameters \u2014 every physical quantity recomputes live."), /*#__PURE__*/React.createElement("div", {
    className: "snap-save-row"
  }, /*#__PURE__*/React.createElement("input", {
    className: "snap-name",
    type: "text",
    placeholder: "Snapshot name (e.g. Kerr a\u2605 0.9 edge view)",
    "aria-label": "Snapshot name",
    value: name,
    onChange: function onChange(e) {
      return setName(e.target.value);
    },
    maxLength: (_window$QGA_SNAPSHOTS2 = (_window$QGA_SNAPSHOTS3 = window.QGA_SNAPSHOTS) === null || _window$QGA_SNAPSHOTS3 === void 0 ? void 0 : _window$QGA_SNAPSHOTS3.SNAPSHOT_LIMITS.maxNameLength) !== null && _window$QGA_SNAPSHOTS2 !== void 0 ? _window$QGA_SNAPSHOTS2 : 60
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: saveSnapshot,
    disabled: busy
  }, busy ? "Capturing…" : "Save snapshot")), storageError ? /*#__PURE__*/React.createElement("p", {
    className: "snap-error",
    role: "alert"
  }, storageError) : null, notice ? /*#__PURE__*/React.createElement("p", {
    className: "snap-notice " + (notice.kind === "ok" ? "ok" : "error"),
    role: "status"
  }, notice.text) : null, /*#__PURE__*/React.createElement("ul", {
    className: "snap-list"
  }, snapshots.length === 0 ? /*#__PURE__*/React.createElement("li", {
    className: "snap-empty"
  }, "No snapshots yet \u2014 save the current state to compare or return to it later.") : snapshots.map(function (snapshot) {
    var _snapshot$provenance;
    return /*#__PURE__*/React.createElement("li", {
      key: snapshot.id,
      className: "snap-item" + (popId === snapshot.id ? " pop" : "")
    }, snapshot.thumbnail ? /*#__PURE__*/React.createElement("img", {
      className: "snap-thumb",
      src: snapshot.thumbnail,
      alt: "",
      width: 64,
      height: 40
    }) : /*#__PURE__*/React.createElement("div", {
      className: "snap-thumb snap-thumb-empty",
      "aria-hidden": "true"
    }), /*#__PURE__*/React.createElement("div", {
      className: "snap-meta"
    }, /*#__PURE__*/React.createElement("div", {
      className: "snap-name-text"
    }, snapshot.name), /*#__PURE__*/React.createElement("div", {
      className: "small dim"
    }, (_snapshot$provenance = snapshot.provenance) === null || _snapshot$provenance === void 0 ? void 0 : _snapshot$provenance.view, " \xB7 ", new Date(snapshot.createdAt).toLocaleString())), /*#__PURE__*/React.createElement("div", {
      className: "snap-actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: function onClick() {
        return restoreSnapshot(snapshot);
      }
    }, "Restore"), /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: function onClick() {
        return exportSnapshot(snapshot.id);
      },
      "aria-label": "Export snapshot " + snapshot.name
    }, "Export"), confirmRemove === snapshot.id ? /*#__PURE__*/React.createElement("span", {
      className: "snap-confirm",
      role: "group",
      "aria-label": "Confirm removal"
    }, /*#__PURE__*/React.createElement("span", {
      className: "small"
    }, "Remove?"), /*#__PURE__*/React.createElement("button", {
      className: "btn snap-confirm-yes",
      onClick: function onClick() {
        return removeSnapshot(snapshot.id);
      }
    }, "\u2713 Remove"), /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: function onClick() {
        return setConfirmRemove(null);
      }
    }, "\u2715 Keep")) : /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: function onClick() {
        return setConfirmRemove(snapshot.id);
      },
      "aria-label": "Remove snapshot " + snapshot.name
    }, "Remove")));
  })), /*#__PURE__*/React.createElement("footer", {
    className: "snap-foot"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      var _fileInputRef$current;
      return (_fileInputRef$current = fileInputRef.current) === null || _fileInputRef$current === void 0 ? void 0 : _fileInputRef$current.click();
    }
  }, "Import snapshot\u2026"), /*#__PURE__*/React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: "application/json,.json",
    className: "snap-file",
    "aria-label": "Import snapshot file",
    onChange: function onChange(e) {
      var _e$target$files;
      var file = (_e$target$files = e.target.files) === null || _e$target$files === void 0 ? void 0 : _e$target$files[0];
      if (file) importSnapshot(file);
      e.target.value = "";
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "small dim"
  }, "Schema ", (_window$QGA_SNAPSHOTS4 = (_window$QGA_SNAPSHOTS5 = window.QGA_SNAPSHOTS) === null || _window$QGA_SNAPSHOTS5 === void 0 ? void 0 : _window$QGA_SNAPSHOTS5.SNAPSHOT_SCHEMA) !== null && _window$QGA_SNAPSHOTS4 !== void 0 ? _window$QGA_SNAPSHOTS4 : "horizon-qga-snapshot/v1", " \xB7 max ", (_window$QGA_SNAPSHOTS6 = (_window$QGA_SNAPSHOTS7 = window.QGA_SNAPSHOTS) === null || _window$QGA_SNAPSHOTS7 === void 0 ? void 0 : _window$QGA_SNAPSHOTS7.SNAPSHOT_LIMITS.maxSnapshots) !== null && _window$QGA_SNAPSHOTS6 !== void 0 ? _window$QGA_SNAPSHOTS6 : 8))));
}
window.SnapshotPanel = SnapshotPanel;