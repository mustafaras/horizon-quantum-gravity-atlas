/* Compiled from js/compare/compare-view.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
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
// compare-view.jsx — Prompt 10 A/B scientific comparison.
//
// Two validated state snapshots rendered as embedded atlas instances (same
// origin, minimal chrome via the #embed-A/#embed-B hash). Modes:
//   - side-by-side: two independent panes;
//   - swipe: a draggable seam with a GPU divider overlay (WebGL2 fullscreen
//     triangle, thin lens distortion + ±2px chromatic fringe) that degrades
//     to a CSS divider on failure/timeout/software rasterizers.
// Parameter changes between presets tween with the shared EASINGS (700ms
// default); every interpolated frame is applied as a silent state patch so
// physics quantities recompute live — no baked keyframes. Cameras sync only
// when both sides declare compatible orbit spaces (same view + Scene3D rig);
// otherwise each side orbits independently under a visible badge.

function CompareView(_ref) {
  var _window$QGA_COMPARE, _sides$, _sides$2, _window$QGA_COMPARE2, _preset$description, _window$QGA_COMPARE3, _sides$3, _sides$0$label, _sides$4, _sides$5, _sides$1$label, _sides$6;
  var go = _ref.go;
  var prm = usePRM();
  var _useState = useState("schwarzschild-vs-kerr"),
    _useState2 = _slicedToArray(_useState, 2),
    presetId = _useState2[0],
    setPresetId = _useState2[1];
  var _useState3 = useState("swipe"),
    _useState4 = _slicedToArray(_useState3, 2),
    mode = _useState4[0],
    setMode = _useState4[1];
  var _useState5 = useState(function () {
      return resolvePresetSides("schwarzschild-vs-kerr");
    }),
    _useState6 = _slicedToArray(_useState5, 2),
    sides = _useState6[0],
    setSides = _useState6[1];
  // The iframe srcs change ONLY on reload-worthy transitions (initial mount,
  // view change, reduced motion). Preset switches with the same view tween
  // through silent state patches instead — the embeds never reload.
  var _useState7 = useState(function () {
      var initial = resolvePresetSides("schwarzschild-vs-kerr");
      return initial ? {
        A: sideUrlOf(initial[0], "A"),
        B: sideUrlOf(initial[1], "B")
      } : null;
    }),
    _useState8 = _slicedToArray(_useState7, 2),
    mountedUrls = _useState8[0],
    setMountedUrls = _useState8[1];
  var _useState9 = useState({
      A: false,
      B: false
    }),
    _useState0 = _slicedToArray(_useState9, 2),
    ready = _useState0[0],
    setReady = _useState0[1];
  var _useState1 = useState({
      A: null,
      B: null
    }),
    _useState10 = _slicedToArray(_useState1, 2),
    sceneSpace = _useState10[0],
    setSceneSpace = _useState10[1];
  var _useState11 = useState(50),
    _useState12 = _slicedToArray(_useState11, 2),
    dividerPercent = _useState12[0],
    setDividerPercent = _useState12[1];
  var stageRef = useRef(null);
  var leftPaneRef = useRef(null);
  var rightPaneRef = useRef(null);
  var handleRef = useRef(null);
  var shaderCanvasRef = useRef(null);
  var dividerRef = useRef(0.5);
  var iframesRef = useRef({
    A: null,
    B: null
  });
  var sidesRef = useRef(sides);
  sidesRef.current = sides;
  var readyRef = useRef(ready);
  readyRef.current = ready;
  function resolvePresetSides(id) {
    var _COMPARE$COMPARE_PRES, _COMPARE$COMPARE_PRES2;
    var COMPARE = window.QGA_COMPARE;
    if (!(COMPARE !== null && COMPARE !== void 0 && (_COMPARE$COMPARE_PRES = COMPARE.COMPARE_PRESETS) !== null && _COMPARE$COMPARE_PRES !== void 0 && _COMPARE$COMPARE_PRES.length)) return null; // guarded below
    var preset = (_COMPARE$COMPARE_PRES2 = COMPARE.COMPARE_PRESETS.find(function (entry) {
      return entry.id === id;
    })) !== null && _COMPARE$COMPARE_PRES2 !== void 0 ? _COMPARE$COMPARE_PRES2 : COMPARE.COMPARE_PRESETS[0];
    var defaults = window.QGA_DEFAULT_STATE;
    var readState = window.QGA_READ_STATE;
    return preset.sides.map(function (side) {
      var validation = COMPARE.validateCompareSide({
        patch: side.patch,
        renderMode: side.renderMode,
        readState: readState,
        defaults: defaults,
        stateKeys: QGA_STATE_KEYS
      });
      if (!validation.ok) throw new Error("Invalid compare side: " + validation.errors.join("; "));
      return {
        label: side.label,
        renderMode: side.renderMode,
        state: validation.state,
        view: validation.state.view
      };
    });
  }
  function sideUrlOf(side, role) {
    // qgaStateSearch is the canonical serializer (shared lexical scope with
    // state.jsx): short keys, defaults elision and the Kerr bhv versioning
    // all stay consistent with the rest of the atlas.
    return location.pathname + qgaStateSearch(side.state) + "#embed-" + role;
  }

  // Bootstrap-degradation guard: without the compare tooling the view stays
  // honest instead of crashing.
  if (!sides || !mountedUrls) {
    return /*#__PURE__*/React.createElement("div", {
      className: "compare-view"
    }, /*#__PURE__*/React.createElement("header", {
      className: "compare-head"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "module-kicker"
    }, "Prompt 10 \xB7 A/B comparison"), /*#__PURE__*/React.createElement("h1", null, "Compare two validated states")), /*#__PURE__*/React.createElement("button", {
      className: "btn",
      onClick: function onClick() {
        return go("overview");
      }
    }, "\u2190 Back to the atlas")), /*#__PURE__*/React.createElement("div", {
      className: "lab-fallback"
    }, "The compare tooling could not initialize (bootstrap degradation). Reload the page; everything else remains available."));
  }

  // ---- preset switching: tween changed parameters (700ms, shared EASINGS) ----
  var switchPreset = function switchPreset(id) {
    var next = resolvePresetSides(id);
    var previous = sidesRef.current;
    setPresetId(id);
    setSides(next);
    // Same view on every preset side → keep the mounted embeds and tween.
    var sameViews = next.every(function (side, index) {
      var _previous$index;
      return side.view === ((_previous$index = previous[index]) === null || _previous$index === void 0 ? void 0 : _previous$index.view);
    });
    if (!sameViews || prm) {
      // View changed (or reduced motion): reload the embeds at the final
      // state — reduced motion must never animate. Identical URLs (re-click)
      // keep the mounted embeds and readiness.
      var nextUrls = {
        A: sideUrlOf(next[0], "A"),
        B: sideUrlOf(next[1], "B")
      };
      var changed = nextUrls.A !== mountedUrls.A || nextUrls.B !== mountedUrls.B;
      setMountedUrls(nextUrls);
      if (changed) {
        setReady({
          A: false,
          B: false
        });
        setSceneSpace({
          A: null,
          B: null
        });
      }
      return;
    }
    var MOTION = window.QGA_MOTION;
    next.forEach(function (side, index) {
      var from = previous[index].state;
      var diff = window.QGA_COMPARE.diffStates(from, side.state);
      if (!diff.tweenable.length && !diff.switches.length) return;
      var target = iframesRef.current[index === 0 ? "A" : "B"];
      if (!target) return;
      if (!MOTION) {
        var _target$contentWindow;
        // No motion runtime (bootstrap degradation): apply the final state.
        (_target$contentWindow = target.contentWindow) === null || _target$contentWindow === void 0 || _target$contentWindow.postMessage({
          type: "qga-state-patch",
          patch: side.state
        }, "*");
        return;
      }
      MOTION.runtime.tween({
        from: 0,
        to: 1,
        duration: 700,
        easing: "easeInOutCubic",
        reducedMotion: prm,
        onUpdate: function onUpdate(t) {
          var _target$contentWindow2;
          var sampled = window.QGA_COMPARE.sampleTweenState(from, diff, t);
          (_target$contentWindow2 = target.contentWindow) === null || _target$contentWindow2 === void 0 || _target$contentWindow2.postMessage({
            type: "qga-state-patch",
            patch: sampled
          }, "*");
        }
      });
    });
  };

  // ---- embed protocol: readiness, settings, camera sync ----
  useEffect(function () {
    var onMessage = function onMessage(event) {
      var data = event.data;
      if (!data || typeof data.type !== "string") return;
      var side = data.side === "A" ? "A" : data.side === "B" ? "B" : null;
      if (data.type === "qga-embed-ready" && side) {
        setReady(function (current) {
          return current[side] ? current : _objectSpread(_objectSpread({}, current), {}, _defineProperty({}, side, true));
        });
      } else if (data.type === "qga-scene-mounted" && side) {
        setSceneSpace(function (current) {
          var _data$cameraSpace;
          return _objectSpread(_objectSpread({}, current), {}, _defineProperty({}, side, (_data$cameraSpace = data.cameraSpace) !== null && _data$cameraSpace !== void 0 ? _data$cameraSpace : null));
        });
      } else if (data.type === "qga-camera" && side) {
        // Forward the pose to the twin scene when both declared orbit spaces.
        if (cameraSyncedRef.current) {
          var _target$contentWindow3;
          var target = iframesRef.current[side === "A" ? "B" : "A"];
          target === null || target === void 0 || (_target$contentWindow3 = target.contentWindow) === null || _target$contentWindow3 === void 0 || _target$contentWindow3.postMessage({
            type: "qga-camera-sync",
            pose: data.pose
          }, "*");
        }
      }
    };
    window.addEventListener("message", onMessage);
    return function () {
      return window.removeEventListener("message", onMessage);
    };
  }, []);
  var cameraSynced = ready.A && ready.B && ((_window$QGA_COMPARE = window.QGA_COMPARE) === null || _window$QGA_COMPARE === void 0 ? void 0 : _window$QGA_COMPARE.cameraSpacesCompatible({
    view: (_sides$ = sides[0]) === null || _sides$ === void 0 ? void 0 : _sides$.view,
    cameraSpace: sceneSpace.A
  }, {
    view: (_sides$2 = sides[1]) === null || _sides$2 === void 0 ? void 0 : _sides$2.view,
    cameraSpace: sceneSpace.B
  }));
  var cameraSyncedRef = useRef(cameraSynced);
  cameraSyncedRef.current = cameraSynced;

  // Push each side's render mode once its embed is ready.
  useEffect(function () {
    for (var _i = 0, _arr = ["A", "B"]; _i < _arr.length; _i++) {
      var _sides, _iframesRef$current$s;
      var side = _arr[_i];
      if (!ready[side]) continue;
      var renderMode = (_sides = sides[side === "A" ? 0 : 1]) === null || _sides === void 0 ? void 0 : _sides.renderMode;
      if (!renderMode) continue;
      (_iframesRef$current$s = iframesRef.current[side]) === null || _iframesRef$current$s === void 0 || (_iframesRef$current$s = _iframesRef$current$s.contentWindow) === null || _iframesRef$current$s === void 0 || _iframesRef$current$s.postMessage({
        type: "qga-embed-settings",
        vizMode: renderMode
      }, "*");
    }
  }, [ready, sides]);

  // ---- swipe divider: GPU overlay + critically damped spring inertia ----
  var dividerSpringRef = useRef(null);
  useEffect(function () {
    if (mode !== "swipe") return undefined;
    var MOTION = window.QGA_MOTION;
    if (!MOTION) return undefined;
    var spring = MOTION.createCriticallyDampedSpring({
      omega: 16,
      initial: dividerRef.current
    });
    dividerSpringRef.current = spring;
    var overlay = null,
      overlayFailed = false;
    var canvas = shaderCanvasRef.current;
    if (canvas && !prm) {
      // Capability-gated GPU seam: software rasterizers refuse, failures and
      // slow first draws degrade to the CSS divider (never blocks the UI).
      try {
        var _window$QGA_RENDER$so, _window$QGA_RENDER, _stageRef$current;
        overlay = window.QGA_COMPARE.createDividerOverlay(canvas, {
          softwareRendererClamp: (_window$QGA_RENDER$so = (_window$QGA_RENDER = window.QGA_RENDER) === null || _window$QGA_RENDER === void 0 ? void 0 : _window$QGA_RENDER.softwareRendererClamp) !== null && _window$QGA_RENDER$so !== void 0 ? _window$QGA_RENDER$so : null
        });
        var rect = (_stageRef$current = stageRef.current) === null || _stageRef$current === void 0 ? void 0 : _stageRef$current.getBoundingClientRect();
        if (rect) overlay.resize(rect.width, rect.height);
        var drew = false;
        var watchdog = setTimeout(function () {
          if (!drew) {
            overlay.dispose();
            overlay = null;
            overlayFailed = true;
          }
        }, 1500);
        overlay.render(dividerRef.current, 0);
        drew = true;
        clearTimeout(watchdog);
      } catch (error) {
        overlay = null;
        overlayFailed = true;
      }
    }
    // Keep the overlay canvas matched to the stage size.
    var resizeObserver = overlay && stageRef.current ? new ResizeObserver(function () {
      var _stageRef$current2, _overlay;
      var rect = (_stageRef$current2 = stageRef.current) === null || _stageRef$current2 === void 0 ? void 0 : _stageRef$current2.getBoundingClientRect();
      if (rect) (_overlay = overlay) === null || _overlay === void 0 || _overlay.resize(rect.width, rect.height);
    }) : null;
    resizeObserver === null || resizeObserver === void 0 || resizeObserver.observe(stageRef.current);
    var time = 0;
    var removeListener = MOTION.runtime.addFrameListener({
      onFrame: function onFrame(now, dt) {
        time += dt;
        var _spring$step = spring.step(dt),
          position = _spring$step.position;
        dividerRef.current = position;
        applyDivider(position);
        if (overlay) overlay.render(position, time, {
          reduced: prm
        });
      }
    });
    return function () {
      var _overlay2;
      removeListener();
      resizeObserver === null || resizeObserver === void 0 || resizeObserver.disconnect();
      (_overlay2 = overlay) === null || _overlay2 === void 0 || _overlay2.dispose();
      dividerSpringRef.current = null;
    };
  }, [mode, prm]);
  var applyDivider = function applyDivider(x) {
    var percent = (x * 100).toFixed(2) + "%";
    if (leftPaneRef.current) leftPaneRef.current.style.clipPath = "inset(0 ".concat(100 - x * 100, "% 0 0)");
    if (rightPaneRef.current) rightPaneRef.current.style.clipPath = "inset(0 0 0 ".concat(x * 100, "%)");
    if (handleRef.current) handleRef.current.style.left = percent;
    // Throttle the a11y/React value to whole percents.
    var whole = Math.round(x * 100);
    if (whole !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = whole;
      setDividerPercent(whole);
    }
  };
  var lastAnnouncedRef = useRef(-1);

  // Pointer drag on the seam handle drives the spring target (inertia).
  var onHandlePointerDown = function onHandlePointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    var stage = stageRef.current.getBoundingClientRect();
    var move = function move(event) {
      var _dividerSpringRef$cur;
      var x = Math.min(1, Math.max(0, (event.clientX - stage.left) / stage.width));
      (_dividerSpringRef$cur = dividerSpringRef.current) === null || _dividerSpringRef$cur === void 0 || _dividerSpringRef$cur.setTarget(x, {
        snap: prm
      });
    };
    var _up = function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", _up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", _up);
  };
  var onHandleKeyDown = function onHandleKeyDown(e) {
    var step = e.shiftKey ? 0.01 : 0.05;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      var _dividerSpringRef$cur2;
      e.preventDefault();
      (_dividerSpringRef$cur2 = dividerSpringRef.current) === null || _dividerSpringRef$cur2 === void 0 || _dividerSpringRef$cur2.setTarget(Math.max(0, dividerRef.current - step), {
        snap: prm
      });
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      var _dividerSpringRef$cur3;
      e.preventDefault();
      (_dividerSpringRef$cur3 = dividerSpringRef.current) === null || _dividerSpringRef$cur3 === void 0 || _dividerSpringRef$cur3.setTarget(Math.min(1, dividerRef.current + step), {
        snap: prm
      });
    } else if (e.key === "Home") {
      var _dividerSpringRef$cur4;
      e.preventDefault();
      (_dividerSpringRef$cur4 = dividerSpringRef.current) === null || _dividerSpringRef$cur4 === void 0 || _dividerSpringRef$cur4.setTarget(0, {
        snap: prm
      });
    } else if (e.key === "End") {
      var _dividerSpringRef$cur5;
      e.preventDefault();
      (_dividerSpringRef$cur5 = dividerSpringRef.current) === null || _dividerSpringRef$cur5 === void 0 || _dividerSpringRef$cur5.setTarget(1, {
        snap: prm
      });
    }
  };
  var preset = (_window$QGA_COMPARE2 = window.QGA_COMPARE) === null || _window$QGA_COMPARE2 === void 0 ? void 0 : _window$QGA_COMPARE2.COMPARE_PRESETS.find(function (entry) {
    return entry.id === presetId;
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "compare-view",
    "data-ready-a": ready.A ? "true" : "false",
    "data-ready-b": ready.B ? "true" : "false",
    "data-camera-synced": cameraSynced ? "true" : "false",
    "data-preset": presetId
  }, /*#__PURE__*/React.createElement("header", {
    className: "compare-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "module-kicker"
  }, "Prompt 10 \xB7 A/B comparison"), /*#__PURE__*/React.createElement("h1", null, "Compare two validated states"), /*#__PURE__*/React.createElement("p", {
    className: "module-lede"
  }, (_preset$description = preset === null || preset === void 0 ? void 0 : preset.description) !== null && _preset$description !== void 0 ? _preset$description : "Side-by-side or swipe comparison of two atlas states.")), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      return go("overview");
    }
  }, "\u2190 Back to the atlas")), /*#__PURE__*/React.createElement("div", {
    className: "section-head",
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("h2", null, "Comparison stage")), /*#__PURE__*/React.createElement("div", {
    className: "compare-toolbar viz-toolbar",
    role: "toolbar",
    "aria-label": "Comparison controls"
  }, /*#__PURE__*/React.createElement("span", {
    className: "seg"
  }, (_window$QGA_COMPARE3 = window.QGA_COMPARE) === null || _window$QGA_COMPARE3 === void 0 ? void 0 : _window$QGA_COMPARE3.COMPARE_PRESETS.map(function (entry) {
    return /*#__PURE__*/React.createElement("button", {
      key: entry.id,
      className: "btn" + (entry.id === presetId ? " on" : ""),
      "aria-pressed": entry.id === presetId,
      onClick: function onClick() {
        return switchPreset(entry.id);
      }
    }, entry.label);
  })), /*#__PURE__*/React.createElement("span", {
    className: "seg"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn" + (mode === "swipe" ? " on" : ""),
    "aria-pressed": mode === "swipe",
    onClick: function onClick() {
      return setMode("swipe");
    }
  }, "Swipe"), /*#__PURE__*/React.createElement("button", {
    className: "btn" + (mode === "side-by-side" ? " on" : ""),
    "aria-pressed": mode === "side-by-side",
    onClick: function onClick() {
      return setMode("side-by-side");
    }
  }, "Side by side")), /*#__PURE__*/React.createElement("span", {
    className: "compare-sync-badge" + (cameraSynced ? " on" : ""),
    role: "status",
    title: cameraSynced ? "Both scenes declared a compatible orbit camera space" : "Scenes orbit independently"
  }, cameraSynced ? "◎ cameras synced" : "camera not synced")), /*#__PURE__*/React.createElement("div", {
    className: "compare-stage" + (mode === "swipe" ? " swipe" : ""),
    ref: stageRef
  }, /*#__PURE__*/React.createElement("div", {
    className: "compare-pane" + (mode === "swipe" ? " clipped" : ""),
    ref: leftPaneRef
  }, /*#__PURE__*/React.createElement("div", {
    className: "compare-pane-label"
  }, (_sides$3 = sides[0]) === null || _sides$3 === void 0 ? void 0 : _sides$3.label), /*#__PURE__*/React.createElement("iframe", {
    ref: function ref(node) {
      iframesRef.current.A = node;
    },
    title: "Comparison side A: " + ((_sides$0$label = (_sides$4 = sides[0]) === null || _sides$4 === void 0 ? void 0 : _sides$4.label) !== null && _sides$0$label !== void 0 ? _sides$0$label : ""),
    src: mountedUrls.A,
    className: "compare-iframe"
  })), /*#__PURE__*/React.createElement("div", {
    className: "compare-pane" + (mode === "swipe" ? " clipped" : ""),
    ref: rightPaneRef
  }, /*#__PURE__*/React.createElement("div", {
    className: "compare-pane-label compare-pane-label-b"
  }, (_sides$5 = sides[1]) === null || _sides$5 === void 0 ? void 0 : _sides$5.label), /*#__PURE__*/React.createElement("iframe", {
    ref: function ref(node) {
      iframesRef.current.B = node;
    },
    title: "Comparison side B: " + ((_sides$1$label = (_sides$6 = sides[1]) === null || _sides$6 === void 0 ? void 0 : _sides$6.label) !== null && _sides$1$label !== void 0 ? _sides$1$label : ""),
    src: mountedUrls.B,
    className: "compare-iframe"
  })), mode === "swipe" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("canvas", {
    ref: shaderCanvasRef,
    className: "compare-divider-canvas",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "compare-divider-css",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("button", {
    className: "compare-handle",
    ref: handleRef,
    role: "slider",
    "aria-label": "Comparison divider \u2014 drag or use arrow keys to reveal each side",
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": dividerPercent,
    onPointerDown: onHandlePointerDown,
    onKeyDown: onHandleKeyDown,
    style: {
      left: dividerPercent + "%"
    }
  })) : null, (!ready.A || !ready.B) && mode === "swipe" ? /*#__PURE__*/React.createElement("div", {
    className: "compare-loading",
    role: "status"
  }, "Loading comparison scenes\u2026") : null), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "compare-view",
    status: "schematic"
  }, "Each side is a full, independently validated atlas state (URL-clamped parameters, seeded physics).", cameraSynced ? " Both scenes declared the same orbit camera space, so dragging one camera moves both." : " The scenes currently orbit independently.", "Parameter changes tween over 700 ms with every physical quantity recomputed each frame \u2014 nothing is baked."));
}
window.CompareView = CompareView;