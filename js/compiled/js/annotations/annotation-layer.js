/* Compiled from js/annotations/annotation-layer.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// annotation-layer.jsx — Prompt 10 shareable annotation pins.
//
// Pin anchor types (explicit on every pin):
//   - semantic: stable [data-qga-anchor] id — tracks the anchored element;
//   - world:    normalized scene coordinates — projected every frame through
//     the active Scene3D handle with depth-aware occlusion fading (behind
//     geometry → opacity ≤ 0.25) and a ≤300ms spring pop-in;
//   - screen:   normalized content-column coordinates — follows scroll and
//     resize by construction (percentage positioning).
// Pins serialize into the shared URL state only after schema, text and size
// limits pass (the store validates every mutation). All text renders as
// text. Pin hover highlights its linked scene object through the ConceptBus
// (bidirectional with formula linking). Annotations never touch scientific
// simulation parameters.

function AnnotationLayer(_ref) {
  var _atlasState$annotatio;
  var view = _ref.view;
  var _useQGAState = useQGAState(),
    _useQGAState2 = _slicedToArray(_useQGAState, 2),
    atlasState = _useQGAState2[0],
    update = _useQGAState2[1];
  var _useState = useState(false),
    _useState2 = _slicedToArray(_useState, 2),
    placing = _useState2[0],
    setPlacing = _useState2[1];
  var _useState3 = useState(null),
    _useState4 = _slicedToArray(_useState3, 2),
    editingId = _useState4[0],
    setEditingId = _useState4[1];
  var _useState5 = useState(""),
    _useState6 = _slicedToArray(_useState5, 2),
    editText = _useState6[0],
    setEditText = _useState6[1];
  var _useState7 = useState(false),
    _useState8 = _slicedToArray(_useState7, 2),
    confirmRemove = _useState8[0],
    setConfirmRemove = _useState8[1];
  var _useState9 = useState(null),
    _useState0 = _slicedToArray(_useState9, 2),
    error = _useState0[0],
    setError = _useState0[1];
  var _useState1 = useState(null),
    _useState10 = _slicedToArray(_useState1, 2),
    rejection = _useState10[0],
    setRejection = _useState10[1];
  var _useState11 = useState({}),
    _useState12 = _slicedToArray(_useState11, 2),
    positions = _useState12[0],
    setPositions = _useState12[1]; // id -> {x, y, occluded}
  // A brand-new pin is a DRAFT: it renders and edits locally, but enters
  // shared state only when its first Save passes schema/text/size limits.
  var _useState13 = useState(null),
    _useState14 = _slicedToArray(_useState13, 2),
    draft = _useState14[0],
    setDraft = _useState14[1];
  var rootRef = useRef(null);
  var allPins = (_atlasState$annotatio = atlasState.annotations) !== null && _atlasState$annotatio !== void 0 ? _atlasState$annotatio : [];
  // Pins render on the view they were placed on (screen/world/semantic
  // coordinates are meaningless on a different module's scene).
  var visiblePins = allPins.filter(function (pin) {
    return !pin.view || pin.view === view;
  });
  var pinsRef = useRef(visiblePins);
  pinsRef.current = visiblePins;
  var allPinsRef = useRef(allPins);
  allPinsRef.current = allPins;
  var viewRef = useRef(view);
  viewRef.current = view;

  // Stateless mutations: validate the RESULT, then write shared state —
  // annotations enter the URL only after schema, text and size limits pass.
  var mutatePins = function mutatePins(nextList) {
    var _window$QGA_ANNOTATIO;
    var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      success = _ref2.success;
    var validation = (_window$QGA_ANNOTATIO = window.QGA_ANNOTATIONS) === null || _window$QGA_ANNOTATIO === void 0 ? void 0 : _window$QGA_ANNOTATIO.validateAnnotationList(nextList);
    if (!(validation !== null && validation !== void 0 && validation.ok)) {
      var _validation$errors$jo, _validation$errors;
      setError((_validation$errors$jo = validation === null || validation === void 0 || (_validation$errors = validation.errors) === null || _validation$errors === void 0 ? void 0 : _validation$errors.join("; ")) !== null && _validation$errors$jo !== void 0 ? _validation$errors$jo : "Annotation could not be saved.");
      return false;
    }
    update({
      annotations: nextList
    });
    if (success) success();
    return true;
  };

  // Visible rejection of invalid/oversized annotation URL state.
  useEffect(function () {
    var _window$QGA_LAST_ANNO, _window;
    var last = (_window$QGA_LAST_ANNO = (_window = window).QGA_LAST_ANNOTATION_REJECTION) === null || _window$QGA_LAST_ANNO === void 0 ? void 0 : _window$QGA_LAST_ANNO.call(_window);
    if (last) setRejection(last.reason);
  }, []);
  useEffect(function () {
    if (rejection == null) return;
    var t = setTimeout(function () {
      return setRejection(null);
    }, 12000);
    return function () {
      return clearTimeout(t);
    };
  }, [rejection]);

  // Arm/disarm placement (palette action + Annotate button + Escape).
  useEffect(function () {
    window.QGA_ARM_ANNOTATION = function () {
      return setPlacing(true);
    };
    return function () {
      if (window.QGA_ARM_ANNOTATION) delete window.QGA_ARM_ANNOTATION;
    };
  }, []);
  useEffect(function () {
    if (!placing) return undefined;
    window.__qgaAnnotationPlacing = true;
    var onKey = function onKey(e) {
      if (e.key === "Escape") setPlacing(false);
    };
    window.addEventListener("keydown", onKey);
    return function () {
      window.__qgaAnnotationPlacing = false;
      window.removeEventListener("keydown", onKey);
    };
  }, [placing]);

  // Placement: Scene3D offers world anchors via "qga-annotation-place";
  // every other click resolves to a semantic anchor or a screen pin.
  useEffect(function () {
    if (!placing) return undefined;
    var commitAdd = function commitAdd(pin) {
      setPlacing(false);
      // New pins start as drafts: the editor opens immediately; the pin
      // enters shared state only when its first Save validates.
      setDraft(pin);
      setEditingId(pin.id);
      setEditText("");
      setConfirmRemove(false);
    };
    var onPlace = function onPlace(event) {
      var detail = event.detail;
      if (!detail || detail.kind !== "world" || !detail.point) return;
      var pin = {
        id: window.QGA_ANNOTATIONS.newAnnotationId(),
        anchor: "world",
        position: [detail.point.x, detail.point.y, detail.point.z],
        text: "",
        view: viewRef.current
      };
      if (detail.concept) pin.concept = detail.concept;
      commitAdd(pin);
    };
    var onClick = function onClick(event) {
      var _event$target, _event$target$closest, _event$target2, _event$target2$closes;
      if (!window.__qgaAnnotationPlacing) return; // consumed by a scene
      // Ignore the layer's own controls (the arming click itself, the
      // banner, existing pins): React 18 flushes discrete events
      // synchronously, so the arming click would otherwise land here.
      if ((_event$target = event.target) !== null && _event$target !== void 0 && (_event$target$closest = _event$target.closest) !== null && _event$target$closest !== void 0 && _event$target$closest.call(_event$target, ".annot-layer")) return;
      var anchor = (_event$target2 = event.target) === null || _event$target2 === void 0 || (_event$target2$closes = _event$target2.closest) === null || _event$target2$closes === void 0 ? void 0 : _event$target2$closes.call(_event$target2, "[data-qga-anchor]");
      var pin = {
        id: window.QGA_ANNOTATIONS.newAnnotationId(),
        anchor: anchor ? "semantic" : "screen",
        text: "",
        view: viewRef.current
      };
      if (anchor) pin.target = anchor.getAttribute("data-qga-anchor");else {
        var normalized = normalizedFromEvent(event);
        if (!normalized) return;
        pin.position = normalized;
      }
      commitAdd(pin);
    };
    document.addEventListener("qga-annotation-place", onPlace);
    document.addEventListener("click", onClick);
    return function () {
      document.removeEventListener("qga-annotation-place", onPlace);
      document.removeEventListener("click", onClick);
    };
  }, [placing]);

  // Normalized screen coordinates within the scrollable content column
  // (the layer root spans the content-inner box, so the rect already
  // accounts for the current scroll position).
  function normalizedFromEvent(event) {
    var root = rootRef.current;
    if (!root || !event.target || typeof event.clientX !== "number") return null;
    var rect = root.getBoundingClientRect();
    if (!rect.height) return null;
    return [Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(1, rect.width))), Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(1, rect.height)))];
  }

  // Per-frame pin positioning: world pins project through the active scene
  // (occlusion fading), semantic pins track their anchor element. Runs only
  // while such pins exist — the shared motion clock, no idle loop. Drafts
  // are projected too so a freshly placed world pin is immediately visible.
  var framePinsRef = useRef([]);
  framePinsRef.current = [].concat(_toConsumableArray(visiblePins), _toConsumableArray(draft ? [draft] : [])).filter(function (pin) {
    return pin.anchor === "world" || pin.anchor === "semantic";
  });
  useEffect(function () {
    var pins = framePinsRef.current;
    if (!pins.length) {
      setPositions({});
      return undefined;
    }
    var MOTION = window.QGA_MOTION;
    if (!MOTION) return undefined;
    var removeListener = MOTION.runtime.addFrameListener({
      onFrame: function onFrame() {
        var root = rootRef.current;
        if (!root) return;
        var rootRect = root.getBoundingClientRect();
        var next = {};
        var _iterator = _createForOfIteratorHelper(pins),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var pin = _step.value;
            if (pin.anchor === "semantic") {
              var element = root.querySelector("[data-qga-anchor=\"".concat(CSS.escape(pin.target), "\"]"));
              if (!element) {
                next[pin.id] = {
                  missing: true
                };
                continue;
              }
              var rect = element.getBoundingClientRect();
              next[pin.id] = {
                x: rect.left - rootRect.left + Math.min(rect.width, 120),
                y: rect.top - rootRect.top + 8
              };
            } else {
              var _handle$projectPoint;
              var scenes = window.__qgaActiveScenes;
              var handle = scenes ? _toConsumableArray(scenes)[scenes.size - 1] : null;
              if (!handle) {
                next[pin.id] = {
                  missing: true
                };
                continue;
              }
              var projected = (_handle$projectPoint = handle.projectPoint) === null || _handle$projectPoint === void 0 ? void 0 : _handle$projectPoint.call(handle, {
                x: pin.position[0],
                y: pin.position[1],
                z: pin.position[2]
              });
              if (!projected || !projected.inFront) {
                next[pin.id] = {
                  missing: true
                };
                continue;
              }
              var canvasRect = handle.element.getBoundingClientRect();
              next[pin.id] = {
                x: canvasRect.left - rootRect.left + projected.x,
                y: canvasRect.top - rootRect.top + projected.y,
                occluded: projected.occluded
              };
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        setPositions(function (current) {
          return shallowEqual(current, next) ? current : next;
        });
      }
    });
    return removeListener;
  }, [atlasState.annotations, draft]);
  var saveEdit = function saveEdit() {
    // Saving a draft commits it to shared state (validated); saving an
    // existing pin updates its text in place.
    var base = draft && draft.id === editingId ? [].concat(_toConsumableArray(allPins), [draft]) : allPins;
    var next = base.map(function (pin) {
      return pin.id === editingId ? _objectSpread(_objectSpread({}, pin), {}, {
        text: editText
      }) : pin;
    });
    mutatePins(next, {
      success: function success() {
        setEditingId(null);
        setError(null);
        setDraft(null);
      }
    });
  };
  var removePin = function removePin(id) {
    mutatePins(allPins.filter(function (pin) {
      return pin.id !== id;
    }), {
      success: function success() {
        setConfirmRemove(false);
        setEditingId(null);
        setDraft(null);
      }
    });
  };
  var closeEditor = function closeEditor() {
    // Closing without saving discards a draft (it never entered state).
    setEditingId(null);
    setDraft(null);
  };
  var pinCount = pinsRef.current.length;
  var renderPins = draft ? [].concat(_toConsumableArray(pinsRef.current), [draft]) : pinsRef.current;
  return /*#__PURE__*/React.createElement("div", {
    className: "annot-layer" + (placing ? " placing" : ""),
    ref: rootRef,
    "aria-live": "polite"
  }, rejection ? /*#__PURE__*/React.createElement("div", {
    className: "annot-rejection",
    role: "alert"
  }, /*#__PURE__*/React.createElement("strong", null, "Annotation state was rejected."), " ", rejection, " Everything else loaded normally.", /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      return setRejection(null);
    },
    "aria-label": "Dismiss annotation rejection"
  }, "Dismiss")) : null, error ? /*#__PURE__*/React.createElement("div", {
    className: "annot-rejection error",
    role: "alert"
  }, /*#__PURE__*/React.createElement("strong", null, "Annotation not saved."), " ", error, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      return setError(null);
    },
    "aria-label": "Dismiss annotation error"
  }, "Dismiss")) : null, placing ? /*#__PURE__*/React.createElement("div", {
    className: "annot-placing-banner",
    role: "status"
  }, "Click anywhere to place a pin \u2014 on the 3D scene it anchors in world space, on labelled sections it anchors semantically.", /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      return setPlacing(false);
    }
  }, "Cancel (esc)")) : null, renderPins.map(function (pin) {
    var _window$QGA_ANNOTATIO2, _window$QGA_ANNOTATIO3, _window$QGA_ANNOTATIO4, _window$QGA_ANNOTATIO5;
    var position = positions[pin.id];
    var style = pin.anchor === "screen" ? {
      left: pin.position[0] * 100 + "%",
      top: pin.position[1] * 100 + "%"
    } : position && !position.missing ? {
      left: position.x + "px",
      top: position.y + "px",
      opacity: position.occluded ? 0.25 : undefined
    } : {
      display: "none"
    };
    return /*#__PURE__*/React.createElement("div", {
      key: pin.id,
      className: "annot-pin" + (position !== null && position !== void 0 && position.occluded ? " occluded" : "") + (editingId === pin.id ? " editing" : ""),
      style: style,
      "data-anchor": pin.anchor,
      onMouseEnter: function onMouseEnter() {
        var _window$QGA_CONCEPT_B;
        if (pin.concept) (_window$QGA_CONCEPT_B = window.QGA_CONCEPT_BUS) === null || _window$QGA_CONCEPT_B === void 0 || _window$QGA_CONCEPT_B.publish("annotation-hover", {
          id: pin.id,
          concept: pin.concept
        });
      },
      onMouseLeave: function onMouseLeave() {
        var _window$QGA_CONCEPT_B2;
        if (pin.concept) (_window$QGA_CONCEPT_B2 = window.QGA_CONCEPT_BUS) === null || _window$QGA_CONCEPT_B2 === void 0 || _window$QGA_CONCEPT_B2.publish("formula-clear", {
          reason: "end"
        });
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "annot-marker",
      "aria-label": "Annotation: " + (pin.text || "empty pin") + ". Edit.",
      onClick: function onClick() {
        setEditingId(pin.id);
        setEditText(pin.text);
        setConfirmRemove(null);
      }
    }, "\u25C6"), editingId === pin.id ? /*#__PURE__*/React.createElement("div", {
      className: "annot-popover",
      role: "dialog",
      "aria-label": "Edit annotation",
      onClick: function onClick(e) {
        return e.stopPropagation();
      }
    }, /*#__PURE__*/React.createElement("label", {
      className: "small dim",
      htmlFor: "annot-text-" + pin.id
    }, "Annotation text"), /*#__PURE__*/React.createElement("textarea", {
      id: "annot-text-" + pin.id,
      className: "annot-text",
      value: editText,
      rows: 3,
      maxLength: (_window$QGA_ANNOTATIO2 = (_window$QGA_ANNOTATIO3 = window.QGA_ANNOTATIONS) === null || _window$QGA_ANNOTATIO3 === void 0 ? void 0 : _window$QGA_ANNOTATIO3.ANNOTATION_LIMITS.maxTextLength) !== null && _window$QGA_ANNOTATIO2 !== void 0 ? _window$QGA_ANNOTATIO2 : 280,
      onChange: function onChange(e) {
        return setEditText(e.target.value);
      },
      onKeyDown: function onKeyDown(e) {
        if (e.key === "Escape") setEditingId(null);
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "annot-popover-actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: saveEdit
    }, "Save"), confirmRemove ? /*#__PURE__*/React.createElement("span", {
      className: "snap-confirm",
      role: "group",
      "aria-label": "Confirm removal"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn snap-confirm-yes",
      onClick: function onClick() {
        return removePin(pin.id);
      }
    }, "\u2713 Remove"), /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: function onClick() {
        return setConfirmRemove(false);
      }
    }, "\u2715 Keep")) : /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: function onClick() {
        return setConfirmRemove(true);
      }
    }, "Remove"), /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: closeEditor
    }, "Close")), /*#__PURE__*/React.createElement("div", {
      className: "small dim"
    }, editText.length, "/", (_window$QGA_ANNOTATIO4 = (_window$QGA_ANNOTATIO5 = window.QGA_ANNOTATIONS) === null || _window$QGA_ANNOTATIO5 === void 0 ? void 0 : _window$QGA_ANNOTATIO5.ANNOTATION_LIMITS.maxTextLength) !== null && _window$QGA_ANNOTATIO4 !== void 0 ? _window$QGA_ANNOTATIO4 : 280, " \xB7 ", pin.anchor, " anchor")) : pin.text ? /*#__PURE__*/React.createElement("div", {
      className: "annot-text-view"
    }, pin.text) : null);
  }), /*#__PURE__*/React.createElement("button", {
    className: "annot-add-btn" + (pinCount ? " has-pins" : ""),
    onClick: function onClick() {
      return setPlacing(function (v) {
        return !v;
      });
    },
    "aria-pressed": placing,
    title: "Add annotation pin"
  }, placing ? "✕ Cancel pin" : "◆ Annotate" + (pinCount ? " (".concat(pinCount, ")") : "")));
}
function shallowEqual(a, b) {
  var ka = Object.keys(a),
    kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (var _i = 0, _ka = ka; _i < _ka.length; _i++) {
    var key = _ka[_i];
    var x = a[key],
      y = b[key];
    if ((x === null || x === void 0 ? void 0 : x.x) !== (y === null || y === void 0 ? void 0 : y.x) || (x === null || x === void 0 ? void 0 : x.y) !== (y === null || y === void 0 ? void 0 : y.y) || (x === null || x === void 0 ? void 0 : x.occluded) !== (y === null || y === void 0 ? void 0 : y.occluded) || (x === null || x === void 0 ? void 0 : x.missing) !== (y === null || y === void 0 ? void 0 : y.missing)) return false;
  }
  return true;
}
window.AnnotationLayer = AnnotationLayer;