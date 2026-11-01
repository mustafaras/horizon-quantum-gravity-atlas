/* Compiled from js/mod-gr.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
// mod-gr.jsx — Module 04: General Relativity and Spacetime Geometry
// The causal laboratory's presets, window, clamping, easing and ray geometry live in js/labs/causal-spacetime-model.jsx
// (moved there in S19), which this file reads through window.CAUSAL_MODEL.
var _window$CAUSAL_MODEL = window.CAUSAL_MODEL,
  CAUSAL_DEFAULT = _window$CAUSAL_MODEL.DEFAULT,
  CAUSAL_PRESET_STATE = _window$CAUSAL_MODEL.PRESETS,
  CAUSAL_WORLD = _window$CAUSAL_MODEL.WORLD,
  CAUSAL_PLOT = _window$CAUSAL_MODEL.PLOT;
var _window$CAUSAL_MODEL2 = window.CAUSAL_MODEL,
  clampCausalNumber = _window$CAUSAL_MODEL2.clamp,
  useEasedCausalValue = _window$CAUSAL_MODEL2.useEasedCausalValue,
  causalRayEndpoint = _window$CAUSAL_MODEL2.rayEndpoint,
  causalStatePatch = _window$CAUSAL_MODEL2.statePatch;
function CausalCoordinateInput(_ref) {
  var eventName = _ref.eventName,
    axis = _ref.axis,
    value = _ref.value,
    _onChange = _ref.onChange;
  return /*#__PURE__*/React.createElement("label", {
    className: "causal-coordinate-input"
  }, /*#__PURE__*/React.createElement("span", null, eventName, " \xB7 ", axis), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "-4",
    max: "4",
    step: "0.1",
    value: value,
    "aria-label": "".concat(eventName, " ").concat(axis, " coordinate"),
    onChange: function onChange(event) {
      return _onChange(clampCausalNumber(event.target.value, value));
    }
  }));
}
function CausalSpacetimeLab() {
  var _CAUSAL_PRESET_STATE$;
  var _useQGAState = useQGAState(),
    _useQGAState2 = _slicedToArray(_useQGAState, 2),
    atlasState = _useQGAState2[0],
    setAtlasState = _useQGAState2[1];
  var reducedMotion = usePRM();
  var _useState = useState(null),
    _useState2 = _slicedToArray(_useState, 2),
    dragging = _useState2[0],
    setDragging = _useState2[1];
  var _useState3 = useState("A"),
    _useState4 = _slicedToArray(_useState3, 2),
    selected = _useState4[0],
    setSelected = _useState4[1];
  var _useState5 = useState(0),
    _useState6 = _slicedToArray(_useState5, 2),
    pulse = _useState6[0],
    setPulse = _useState6[1];
  var _useState7 = useState(false),
    _useState8 = _slicedToArray(_useState7, 2),
    pulsePlaying = _useState8[0],
    setPulsePlaying = _useState8[1];
  var svgRef = useRef(null);
  var betaPointerRef = useRef(false);
  var sanitized = window.QGA_PHYSICS.sanitizeCausalState({
    beta: atlasState.grBeta,
    a: {
      ct: atlasState.grAt,
      x: atlasState.grAx
    },
    b: {
      ct: atlasState.grBt,
      x: atlasState.grBx
    }
  }, CAUSAL_DEFAULT);
  var beta = sanitized.beta;
  var eventA = sanitized.a;
  var eventB = sanitized.b;
  var animatedBeta = useEasedCausalValue(beta, reducedMotion);
  var settled = Math.abs(animatedBeta - beta) < 1e-5;
  useEffect(function () {
    if (!pulsePlaying || reducedMotion) return undefined;
    var raf = 0;
    var previous = performance.now();
    var _frame = function frame(now) {
      var elapsed = (now - previous) / 1000;
      previous = now;
      setPulse(function (current) {
        return Math.min(1, current + elapsed * 0.45);
      });
      raf = requestAnimationFrame(_frame);
    };
    raf = requestAnimationFrame(_frame);
    return function () {
      return cancelAnimationFrame(raf);
    };
  }, [pulsePlaying, reducedMotion]);
  useEffect(function () {
    if (pulse >= 1 && pulsePlaying) setPulsePlaying(false);
  }, [pulse, pulsePlaying]);
  var deltaCt = eventB.ct - eventA.ct;
  var deltaX = eventB.x - eventA.x;
  var classification = window.QGA_PHYSICS.classifySeparation(deltaCt, deltaX, {
    c: 1
  });
  var interval = classification.ds2;
  var gamma = window.QGA_PHYSICS.lorentzGamma(beta);
  var transform = window.QGA_PHYSICS.lorentzTransform({
    deltaCt: deltaCt,
    deltaX: deltaX,
    beta: beta,
    c: 1
  });
  var transformedInterval = window.QGA_PHYSICS.invariantInterval(transform.deltaCtPrime, transform.deltaXPrime);
  var proper = window.QGA_PHYSICS.properTime(deltaCt, deltaX, {
    c: 1
  });
  var simultaneityCandidate = window.QGA_PHYSICS.simultaneityFrameBeta(deltaCt, deltaX);
  var simultaneityBeta = Number.isFinite(simultaneityCandidate) && classification.type === "spacelike" ? simultaneityCandidate : null;
  var transformedA = window.QGA_PHYSICS.lorentzTransform({
    deltaCt: eventA.ct,
    deltaX: eventA.x,
    beta: animatedBeta
  });
  var transformedB = window.QGA_PHYSICS.lorentzTransform({
    deltaCt: eventB.ct,
    deltaX: eventB.x,
    beta: animatedBeta
  });
  var activePreset = atlasState.grPreset || "timelike";
  var presetNote = ((_CAUSAL_PRESET_STATE$ = CAUSAL_PRESET_STATE[activePreset]) === null || _CAUSAL_PRESET_STATE$ === void 0 ? void 0 : _CAUSAL_PRESET_STATE$.note) || "Custom event coordinates and frame speed.";
  var invariantResidual = transformedInterval - interval;
  var orderReversed = Math.sign(deltaCt) !== 0 && Math.sign(transform.deltaCtPrime) !== 0 && Math.sign(deltaCt) !== Math.sign(transform.deltaCtPrime);
  var simultaneousNow = Math.abs(transform.deltaCtPrime) < 1e-9;
  var orderMessage = classification.type === "timelike" ? "Timelike order preserved: ".concat(deltaCt >= 0 ? "A precedes B" : "B precedes A", " in both frames.") : classification.type === "null" ? "Null separation preserved: the events remain connected by light." : simultaneousNow ? "Spacelike pair is simultaneous in S′ at this β." : orderReversed ? "Spacelike coordinate-time order is reversed in S′." : "Spacelike order has not reversed at this β; another valid frame can change it.";
  var twinTurn = {
    ct: 0,
    x: 2.2
  };
  var twinTravelerTime = window.QGA_PHYSICS.piecewiseProperTime([eventA, twinTurn, eventB]);
  var twinHomeTime = window.QGA_PHYSICS.properTime(deltaCt, deltaX);
  var screenX = function screenX(x) {
    return CAUSAL_PLOT.left + (x - CAUSAL_WORLD.min) / (CAUSAL_WORLD.max - CAUSAL_WORLD.min) * (CAUSAL_PLOT.right - CAUSAL_PLOT.left);
  };
  var screenCt = function screenCt(ct) {
    return CAUSAL_PLOT.bottom - (ct - CAUSAL_WORLD.min) / (CAUSAL_WORLD.max - CAUSAL_WORLD.min) * (CAUSAL_PLOT.bottom - CAUSAL_PLOT.top);
  };
  var pointString = function pointString(point) {
    return "".concat(screenX(point.x), ",").concat(screenCt(point.ct));
  };
  var origin = {
    x: 0,
    ct: 0
  };
  var futureLeft = causalRayEndpoint(eventA, -1, 1);
  var futureRight = causalRayEndpoint(eventA, 1, 1);
  var pastLeft = causalRayEndpoint(eventA, -1, -1);
  var pastRight = causalRayEndpoint(eventA, 1, -1);
  var signalEnd = deltaX >= 0 ? futureRight : futureLeft;
  var signalPoint = {
    x: eventA.x + (signalEnd.x - eventA.x) * pulse,
    ct: eventA.ct + (signalEnd.ct - eventA.ct) * pulse
  };
  var xPrimePositive = causalRayEndpoint(origin, 1, animatedBeta);
  var xPrimeNegative = causalRayEndpoint(origin, -1, -animatedBeta);
  var ctPrimePositive = causalRayEndpoint(origin, animatedBeta, 1);
  var ctPrimeNegative = causalRayEndpoint(origin, -animatedBeta, -1);
  var observerVelocity = 0.55;
  var observerX = function observerX(ct) {
    return 1.45 + observerVelocity * ct;
  };
  var observerGamma = window.QGA_PHYSICS.lorentzGamma(observerVelocity);
  var observerTicks = [-3, -2, -1, 0, 1, 2, 3].map(function (tau) {
    return tau * observerGamma;
  }).filter(function (ct) {
    return ct >= CAUSAL_WORLD.min && ct <= CAUSAL_WORLD.max;
  });
  var svgToWorld = function svgToWorld(clientX, clientY) {
    var _svgRef$current;
    var rect = (_svgRef$current = svgRef.current) === null || _svgRef$current === void 0 ? void 0 : _svgRef$current.getBoundingClientRect();
    if (!rect) return origin;
    var svgX = (clientX - rect.left) / rect.width * 900;
    var svgY = (clientY - rect.top) / rect.height * 560;
    return {
      x: clampCausalNumber(CAUSAL_WORLD.min + (svgX - CAUSAL_PLOT.left) / (CAUSAL_PLOT.right - CAUSAL_PLOT.left) * 8, 0),
      ct: clampCausalNumber(CAUSAL_WORLD.max - (svgY - CAUSAL_PLOT.top) / (CAUSAL_PLOT.bottom - CAUSAL_PLOT.top) * 8, 0)
    };
  };
  var updateEvent = function updateEvent(name, nextCt, nextX) {
    var replace = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    var patch = name === "A" ? {
      grAt: clampCausalNumber(nextCt, eventA.ct),
      grAx: clampCausalNumber(nextX, eventA.x)
    } : {
      grBt: clampCausalNumber(nextCt, eventB.ct),
      grBx: clampCausalNumber(nextX, eventB.x)
    };
    setAtlasState(_objectSpread(_objectSpread({}, patch), {}, {
      grPreset: "custom"
    }), {
      replace: replace
    });
  };
  var handlePointerMove = function handlePointerMove(event) {
    if (!dragging) return;
    var world = svgToWorld(event.clientX, event.clientY);
    updateEvent(dragging, Number(world.ct.toFixed(2)), Number(world.x.toFixed(2)), true);
  };
  var stopDragging = function stopDragging(event) {
    var _svgRef$current2;
    if ((event === null || event === void 0 ? void 0 : event.pointerId) != null && (_svgRef$current2 = svgRef.current) !== null && _svgRef$current2 !== void 0 && _svgRef$current2.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId);
    }
    setDragging(null);
  };
  var pointerDown = function pointerDown(name, event) {
    var _svgRef$current3;
    setSelected(name);
    setDragging(name);
    setAtlasState({}, {
      replace: false
    });
    (_svgRef$current3 = svgRef.current) === null || _svgRef$current3 === void 0 || _svgRef$current3.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  };
  var nudgeEvent = function nudgeEvent(name, event) {
    var current = name === "A" ? eventA : eventB;
    var step = event.shiftKey ? 0.5 : 0.1;
    var movement = {
      ArrowLeft: {
        ct: current.ct,
        x: current.x - step
      },
      ArrowRight: {
        ct: current.ct,
        x: current.x + step
      },
      ArrowUp: {
        ct: current.ct + step,
        x: current.x
      },
      ArrowDown: {
        ct: current.ct - step,
        x: current.x
      }
    }[event.key];
    if (!movement) return;
    event.preventDefault();
    updateEvent(name, movement.ct, movement.x, false);
  };
  var applyPreset = function applyPreset(key) {
    var preset = CAUSAL_PRESET_STATE[key] || CAUSAL_PRESET_STATE.timelike;
    setAtlasState(causalStatePatch(key, _objectSpread({
      preset: key
    }, preset)), {
      replace: false
    });
    setPulse(0);
    setPulsePlaying(false);
  };
  var playSignal = function playSignal() {
    if (reducedMotion) {
      setPulse(1);
      setPulsePlaying(false);
      return;
    }
    if (pulse >= 1) setPulse(0);
    setPulsePlaying(function (playing) {
      return !playing;
    });
  };
  var updateBeta = function updateBeta(value, replace) {
    setAtlasState({
      grBeta: clampCausalNumber(value, beta, -0.95, 0.95),
      grPreset: activePreset === "custom" ? "custom" : activePreset
    }, {
      replace: replace
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame causal-lab causal-".concat(classification.type),
    "data-testid": "causal-lab",
    "data-exact-beta": beta.toFixed(4),
    "data-displayed-beta": animatedBeta.toFixed(4),
    "data-settled": settled ? "true" : "false"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-observatory-head causal-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-head-plate"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-head-ident"
  }, "GR", /*#__PURE__*/React.createElement("span", null, "CAUSAL")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Causal Spacetime Laboratory"), /*#__PURE__*/React.createElement("p", null, "Exact 1+1D special-relativistic coordinates inside a pedagogical Minkowski instrument."))), /*#__PURE__*/React.createElement("div", {
    className: "kerr-head-state"
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-established"
  }, "Flat spacetime \xB7 exact SR"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-state-line"
  }, classification.type, " \xB7 \u03B2 = ", beta.toFixed(3), " \xB7 \u03B3 = ", gamma.toFixed(3), " \xB7 ", settled ? "frame settled" : "frame settling"))), /*#__PURE__*/React.createElement("div", {
    className: "kerr-instrument-bar causal-presets"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    role: "group",
    "aria-label": "Causal laboratory presets"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Preset"), Object.entries(CAUSAL_PRESET_STATE).map(function (_ref2) {
    var _ref3 = _slicedToArray(_ref2, 2),
      key = _ref3[0],
      preset = _ref3[1];
    return /*#__PURE__*/React.createElement("button", {
      key: key,
      className: "kerr-chip" + (activePreset === key ? " on" : ""),
      "aria-pressed": activePreset === key,
      onClick: function onClick() {
        return applyPreset(key);
      }
    }, preset.label);
  }), activePreset === "custom" ? /*#__PURE__*/React.createElement("span", {
    className: "causal-custom-chip"
  }, "custom") : null), /*#__PURE__*/React.createElement("button", {
    className: "kerr-chip",
    onClick: function onClick() {
      setAtlasState(causalStatePatch("timelike", CAUSAL_DEFAULT), {
        replace: false
      });
      setPulse(0);
    }
  }, "Reset")), /*#__PURE__*/React.createElement("div", {
    className: "causal-frame-control"
  }, /*#__PURE__*/React.createElement("div", {
    className: "causal-beta-control"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "causal-beta-range"
  }, "Frame speed \u03B2 = v/c"), /*#__PURE__*/React.createElement("input", {
    id: "causal-beta-range",
    type: "range",
    min: "-0.95",
    max: "0.95",
    step: "0.01",
    value: beta,
    "aria-valuetext": "".concat(beta.toFixed(2), " times the speed of light"),
    onPointerDown: function onPointerDown() {
      betaPointerRef.current = true;
      setAtlasState({}, {
        replace: false
      });
    },
    onPointerUp: function onPointerUp() {
      betaPointerRef.current = false;
    },
    onPointerCancel: function onPointerCancel() {
      betaPointerRef.current = false;
    },
    onChange: function onChange(event) {
      return updateBeta(event.target.value, betaPointerRef.current);
    }
  }), /*#__PURE__*/React.createElement("input", {
    className: "causal-beta-number",
    type: "number",
    min: "-0.95",
    max: "0.95",
    step: "0.01",
    value: beta,
    "aria-label": "Lorentz beta numeric input",
    onChange: function onChange(event) {
      return updateBeta(event.target.value, false);
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "causal-frame-actions"
  }, simultaneityBeta != null ? /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: function onClick() {
      return updateBeta(simultaneityBeta, false);
    }
  }, "Set simultaneous frame \u03B2 = ", simultaneityBeta.toFixed(3)) : null, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: playSignal,
    disabled: false,
    "aria-label": pulsePlaying ? "Pause light signal" : "Play light signal"
  }, pulsePlaying ? "Pause signal" : pulse >= 1 ? "Replay signal" : "Send light signal"), /*#__PURE__*/React.createElement("span", {
    className: "causal-motion-note"
  }, reducedMotion ? "reduced motion · signal shown instantly" : "bounded light-cone playback"))), /*#__PURE__*/React.createElement("div", {
    className: "causal-stage-wrap"
  }, /*#__PURE__*/React.createElement("svg", {
    ref: svgRef,
    className: "causal-diagram",
    viewBox: "0 0 900 560",
    role: "img",
    "aria-labelledby": "causal-diagram-title causal-diagram-desc",
    onPointerMove: handlePointerMove,
    onPointerUp: stopDragging,
    onPointerCancel: stopDragging
  }, /*#__PURE__*/React.createElement("title", {
    id: "causal-diagram-title"
  }, "Interactive Minkowski spacetime diagram"), /*#__PURE__*/React.createElement("desc", {
    id: "causal-diagram-desc"
  }, "ct is vertical and x is horizontal. Drag or keyboard-nudge events A and B. Filled wedges show the future and past light cones of A; dashed cyan and amber lines show the boosted frame axes."), /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("clipPath", {
    id: "causal-plot-clip"
  }, /*#__PURE__*/React.createElement("rect", {
    x: CAUSAL_PLOT.left,
    y: CAUSAL_PLOT.top,
    width: CAUSAL_PLOT.right - CAUSAL_PLOT.left,
    height: CAUSAL_PLOT.bottom - CAUSAL_PLOT.top
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "causal-future-fill",
    x1: "0",
    y1: "1",
    x2: "0",
    y2: "0"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: QGA_TOKENS.alpha("accent", 0.22)
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: QGA_TOKENS.alpha("accent-2", 0.03)
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "causal-past-fill",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: QGA_TOKENS.alpha("signal-warm", 0.03)
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: QGA_TOKENS.alpha("signal-warm", 0.18)
  })), /*#__PURE__*/React.createElement("filter", {
    id: "causal-glow",
    x: "-100%",
    y: "-100%",
    width: "300%",
    height: "300%"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    stdDeviation: "4",
    result: "blur"
  }), /*#__PURE__*/React.createElement("feMerge", null, /*#__PURE__*/React.createElement("feMergeNode", {
    "in": "blur"
  }), /*#__PURE__*/React.createElement("feMergeNode", {
    "in": "SourceGraphic"
  })))), /*#__PURE__*/React.createElement("rect", {
    width: "900",
    height: "560",
    className: "causal-sky"
  }), /*#__PURE__*/React.createElement("g", {
    clipPath: "url(#causal-plot-clip)"
  }, /*#__PURE__*/React.createElement("rect", {
    x: CAUSAL_PLOT.left,
    y: CAUSAL_PLOT.top,
    width: CAUSAL_PLOT.right - CAUSAL_PLOT.left,
    height: CAUSAL_PLOT.bottom - CAUSAL_PLOT.top,
    className: "causal-plot-bg"
  }), [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(function (value) {
    return /*#__PURE__*/React.createElement("g", {
      key: "grid-".concat(value)
    }, /*#__PURE__*/React.createElement("line", {
      x1: screenX(value),
      y1: CAUSAL_PLOT.top,
      x2: screenX(value),
      y2: CAUSAL_PLOT.bottom,
      className: value === 0 ? "causal-axis" : "causal-grid-line"
    }), /*#__PURE__*/React.createElement("line", {
      x1: CAUSAL_PLOT.left,
      y1: screenCt(value),
      x2: CAUSAL_PLOT.right,
      y2: screenCt(value),
      className: value === 0 ? "causal-axis" : "causal-grid-line"
    }));
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "".concat(pointString(eventA), " ").concat(pointString(futureLeft), " ").concat(pointString(futureRight)),
    fill: "url(#causal-future-fill)"
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "".concat(pointString(eventA), " ").concat(pointString(pastLeft), " ").concat(pointString(pastRight)),
    fill: "url(#causal-past-fill)"
  }), [futureLeft, futureRight, pastLeft, pastRight].map(function (end, index) {
    return /*#__PURE__*/React.createElement("line", {
      key: "null-".concat(index),
      x1: screenX(eventA.x),
      y1: screenCt(eventA.ct),
      x2: screenX(end.x),
      y2: screenCt(end.ct),
      className: "causal-null-boundary"
    });
  }), /*#__PURE__*/React.createElement("line", {
    x1: screenX(-2.7),
    y1: screenCt(-4),
    x2: screenX(-2.7),
    y2: screenCt(4),
    className: "causal-worldline causal-worldline-stationary"
  }), [-3, -2, -1, 0, 1, 2, 3].map(function (ct) {
    return /*#__PURE__*/React.createElement("line", {
      key: "stationary-tick-".concat(ct),
      x1: screenX(-2.7) - 7,
      y1: screenCt(ct),
      x2: screenX(-2.7) + 7,
      y2: screenCt(ct),
      className: "causal-proper-tick"
    });
  }), /*#__PURE__*/React.createElement("line", {
    x1: screenX(observerX(-4)),
    y1: screenCt(-4),
    x2: screenX(observerX(4)),
    y2: screenCt(4),
    className: "causal-worldline causal-worldline-inertial"
  }), observerTicks.map(function (ct) {
    return /*#__PURE__*/React.createElement("circle", {
      key: "observer-tick-".concat(ct),
      cx: screenX(observerX(ct)),
      cy: screenCt(ct),
      r: "2.8",
      className: "causal-inertial-tick"
    });
  }), /*#__PURE__*/React.createElement("line", {
    x1: screenX(xPrimeNegative.x),
    y1: screenCt(xPrimeNegative.ct),
    x2: screenX(xPrimePositive.x),
    y2: screenCt(xPrimePositive.ct),
    className: "causal-boost-axis causal-boost-x",
    "data-testid": "boosted-x-axis"
  }), /*#__PURE__*/React.createElement("line", {
    x1: screenX(ctPrimeNegative.x),
    y1: screenCt(ctPrimeNegative.ct),
    x2: screenX(ctPrimePositive.x),
    y2: screenCt(ctPrimePositive.ct),
    className: "causal-boost-axis causal-boost-ct",
    "data-testid": "boosted-ct-axis"
  }), activePreset === "twin" ? /*#__PURE__*/React.createElement("g", {
    className: "causal-twin-path"
  }, /*#__PURE__*/React.createElement("line", {
    x1: screenX(eventA.x),
    y1: screenCt(eventA.ct),
    x2: screenX(twinTurn.x),
    y2: screenCt(twinTurn.ct)
  }), /*#__PURE__*/React.createElement("line", {
    x1: screenX(twinTurn.x),
    y1: screenCt(twinTurn.ct),
    x2: screenX(eventB.x),
    y2: screenCt(eventB.ct)
  }), /*#__PURE__*/React.createElement("circle", {
    cx: screenX(twinTurn.x),
    cy: screenCt(twinTurn.ct),
    r: "5"
  })) : null, /*#__PURE__*/React.createElement("line", {
    x1: screenX(eventA.x),
    y1: screenCt(eventA.ct),
    x2: screenX(eventB.x),
    y2: screenCt(eventB.ct),
    className: "causal-event-link"
  }), /*#__PURE__*/React.createElement("line", {
    x1: screenX(transformedA.deltaXPrime),
    y1: screenCt(transformedA.deltaCtPrime),
    x2: screenX(transformedB.deltaXPrime),
    y2: screenCt(transformedB.deltaCtPrime),
    className: "causal-transformed-link",
    "data-testid": "transformed-event-link"
  }), [["A′", transformedA], ["B′", transformedB]].map(function (_ref4) {
    var _ref5 = _slicedToArray(_ref4, 2),
      label = _ref5[0],
      point = _ref5[1];
    return /*#__PURE__*/React.createElement("g", {
      key: label,
      className: "causal-transformed-event"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: screenX(point.deltaXPrime),
      cy: screenCt(point.deltaCtPrime),
      r: "6"
    }), /*#__PURE__*/React.createElement("text", {
      x: screenX(point.deltaXPrime) + 9,
      y: screenCt(point.deltaCtPrime) + 4
    }, label));
  }), pulse > 0 ? /*#__PURE__*/React.createElement("g", {
    className: "causal-signal",
    filter: "url(#causal-glow)"
  }, /*#__PURE__*/React.createElement("line", {
    x1: screenX(eventA.x),
    y1: screenCt(eventA.ct),
    x2: screenX(signalPoint.x),
    y2: screenCt(signalPoint.ct)
  }), /*#__PURE__*/React.createElement("circle", {
    cx: screenX(signalPoint.x),
    cy: screenCt(signalPoint.ct),
    r: "5"
  })) : null, ["A", "B"].map(function (label) {
    var worldEvent = label === "A" ? eventA : eventB;
    var active = selected === label;
    return /*#__PURE__*/React.createElement("g", {
      key: label,
      className: "causal-event" + (active ? " selected" : ""),
      role: "button",
      tabIndex: "0",
      "aria-label": "Event ".concat(label, ": ct ").concat(worldEvent.ct.toFixed(2), ", x ").concat(worldEvent.x.toFixed(2), ". Drag or use arrow keys."),
      onFocus: function onFocus() {
        return setSelected(label);
      },
      onKeyDown: function onKeyDown(event) {
        return nudgeEvent(label, event);
      },
      onPointerDown: function onPointerDown(event) {
        return pointerDown(label, event);
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: screenX(worldEvent.x),
      cy: screenCt(worldEvent.ct),
      r: active ? 12 : 9
    }), /*#__PURE__*/React.createElement("circle", {
      cx: screenX(worldEvent.x),
      cy: screenCt(worldEvent.ct),
      r: active ? 20 : 16,
      className: "causal-event-hit"
    }), /*#__PURE__*/React.createElement("text", {
      x: screenX(worldEvent.x) + 15,
      y: screenCt(worldEvent.ct) - 12
    }, label));
  })), [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(function (value) {
    return /*#__PURE__*/React.createElement("g", {
      key: "labels-".concat(value),
      className: "causal-axis-labels"
    }, /*#__PURE__*/React.createElement("text", {
      x: screenX(value),
      y: CAUSAL_PLOT.bottom + 24
    }, value), value === 0 ? null : /*#__PURE__*/React.createElement("text", {
      x: CAUSAL_PLOT.left - 16,
      y: screenCt(value) + 4
    }, value));
  }), /*#__PURE__*/React.createElement("text", {
    x: CAUSAL_PLOT.right - 2,
    y: CAUSAL_PLOT.bottom + 42,
    className: "causal-axis-title"
  }, "x \xB7 light-seconds"), /*#__PURE__*/React.createElement("text", {
    x: CAUSAL_PLOT.left - 46,
    y: CAUSAL_PLOT.top + 4,
    className: "causal-axis-title"
  }, "ct"), /*#__PURE__*/React.createElement("text", {
    x: screenX(-2.7) + 8,
    y: CAUSAL_PLOT.top + 18,
    className: "causal-worldline-label"
  }, "stationary observer \xB7 \u0394\u03C4 ticks"), /*#__PURE__*/React.createElement("text", {
    x: screenX(observerX(3.4)) - 132,
    y: screenCt(3.4) - 10,
    className: "causal-worldline-label"
  }, "inertial observer \xB7 equal \u0394\u03C4 ticks"), /*#__PURE__*/React.createElement("text", {
    x: CAUSAL_PLOT.right - 58,
    y: screenCt(animatedBeta * 3.6) - 8,
    className: "causal-boost-label causal-boost-x-label"
  }, "x\u2032"), /*#__PURE__*/React.createElement("text", {
    x: screenX(animatedBeta * 3.55) + 8,
    y: CAUSAL_PLOT.top + 18,
    className: "causal-boost-label causal-boost-ct-label"
  }, "ct\u2032"), /*#__PURE__*/React.createElement("text", {
    x: CAUSAL_PLOT.right - 92,
    y: CAUSAL_PLOT.top + 20,
    className: "causal-cone-label"
  }, "future cone of A"), /*#__PURE__*/React.createElement("text", {
    x: CAUSAL_PLOT.right - 82,
    y: CAUSAL_PLOT.bottom - 14,
    className: "causal-cone-label"
  }, "past cone of A")), /*#__PURE__*/React.createElement("div", {
    className: "causal-diagram-legend",
    "aria-label": "Diagram legend"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "legend-event"
  }), "events A/B"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "legend-transform"
  }), "boosted A\u2032/B\u2032"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "legend-null"
  }), "null boundary"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "legend-xprime"
  }), "x\u2032 axis"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "legend-ctprime"
  }), "ct\u2032 axis"))), /*#__PURE__*/React.createElement("div", {
    className: "causal-event-controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "causal-coordinate-group"
  }, /*#__PURE__*/React.createElement("strong", null, "Event A"), /*#__PURE__*/React.createElement(CausalCoordinateInput, {
    eventName: "A",
    axis: "ct",
    value: eventA.ct,
    onChange: function onChange(value) {
      return updateEvent("A", value, eventA.x, false);
    }
  }), /*#__PURE__*/React.createElement(CausalCoordinateInput, {
    eventName: "A",
    axis: "x",
    value: eventA.x,
    onChange: function onChange(value) {
      return updateEvent("A", eventA.ct, value, false);
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "causal-coordinate-group"
  }, /*#__PURE__*/React.createElement("strong", null, "Event B"), /*#__PURE__*/React.createElement(CausalCoordinateInput, {
    eventName: "B",
    axis: "ct",
    value: eventB.ct,
    onChange: function onChange(value) {
      return updateEvent("B", value, eventB.x, false);
    }
  }), /*#__PURE__*/React.createElement(CausalCoordinateInput, {
    eventName: "B",
    axis: "x",
    value: eventB.x,
    onChange: function onChange(value) {
      return updateEvent("B", eventB.ct, value, false);
    }
  })), /*#__PURE__*/React.createElement("p", {
    className: "causal-preset-note"
  }, presetNote)), /*#__PURE__*/React.createElement("div", {
    className: "kerr-deck causal-readout-deck"
  }, /*#__PURE__*/React.createElement("section", {
    className: "kerr-rgroup"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("h4", null, "Invariant diagnosis"), /*#__PURE__*/React.createElement("span", null, "exact \xB7 c = 1 \xB7 signature (\u2212,+,+,+)")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-rgrid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout lead"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-label"
  }, "separation"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-value"
  }, classification.type), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "\\Delta s^2 " + (interval < 0 ? "<" : interval > 0 ? ">" : "=") + " 0"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-label"
  }, "\u0394ct / \u0394x"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-value"
  }, deltaCt.toFixed(3), " / ", deltaX.toFixed(3)), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, "B \u2212 A in frame S")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout lead"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-label"
  }, "invariant interval"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-value"
  }, interval.toFixed(4)), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, "light-seconds\xB2")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-label"
  }, "proper time \u0394\u03C4"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-value"
  }, Number.isFinite(proper) ? proper.toFixed(4) : "not defined"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, Number.isFinite(proper) ? "timelike pair · seconds" : "requires Δs² < 0")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-label"
  }, "S\u2032 interval residual"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-value"
  }, invariantResidual.toExponential(1)), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "\\Delta s'^2 - \\Delta s^2"
  }), " \xB7 floating-point")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-label"
  }, "simultaneity frame"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-value"
  }, simultaneityBeta == null ? "none" : "\u03B2 = ".concat(simultaneityBeta.toFixed(4))), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, "exists only for spacelike \u0394x \u2260 0")))), /*#__PURE__*/React.createElement("section", {
    className: "kerr-rgroup"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("h4", null, "Lorentz frame S\u2032"), /*#__PURE__*/React.createElement("span", null, "exact target values \xB7 animation is presentation only")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-rgrid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout lead"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-label"
  }, "\u03B2 / \u03B3"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-value"
  }, beta.toFixed(3), " / ", gamma.toFixed(4)), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "|\\beta| \\le 0.95"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-label"
  }, "\u0394ct\u2032 / \u0394x\u2032"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-value"
  }, transform.deltaCtPrime.toFixed(3), " / ", transform.deltaXPrime.toFixed(3)), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, "Lorentz transformed pair")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-label"
  }, "event A\u2032"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-value"
  }, window.QGA_PHYSICS.lorentzTransform({
    deltaCt: eventA.ct,
    deltaX: eventA.x,
    beta: beta
  }).deltaCtPrime.toFixed(2), " · ", window.QGA_PHYSICS.lorentzTransform({
    deltaCt: eventA.ct,
    deltaX: eventA.x,
    beta: beta
  }).deltaXPrime.toFixed(2)), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, "ct\u2032 \xB7 x\u2032")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-label"
  }, "event B\u2032"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-value"
  }, window.QGA_PHYSICS.lorentzTransform({
    deltaCt: eventB.ct,
    deltaX: eventB.x,
    beta: beta
  }).deltaCtPrime.toFixed(2), " · ", window.QGA_PHYSICS.lorentzTransform({
    deltaCt: eventB.ct,
    deltaX: eventB.x,
    beta: beta
  }).deltaXPrime.toFixed(2)), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, "ct\u2032 \xB7 x\u2032")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout causal-order-readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-label"
  }, "causal-order verdict"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-value"
  }, orderReversed ? "reversed" : simultaneousNow ? "simultaneous" : "preserved"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, orderMessage)), activePreset === "twin" ? /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-label"
  }, "twin-style \u0394\u03C4"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-value"
  }, twinHomeTime.toFixed(3), " / ", twinTravelerTime.toFixed(3)), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, "home / piecewise traveler \xB7 turnaround schematic")) : null))), /*#__PURE__*/React.createElement("section", {
    className: "causal-formulation",
    "aria-label": "Live causal spacetime equations"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "causal-panel-id"
  }, "FORM / 01"), /*#__PURE__*/React.createElement("h4", null, "Live mathematical formulation")), /*#__PURE__*/React.createElement("span", null, "exact substitutions \xB7 natural diagram units")), /*#__PURE__*/React.createElement("div", {
    className: "causal-equation-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Invariant interval"), /*#__PURE__*/React.createElement(Eq, {
    tex: "\\Delta s^2 = -c^2\\Delta t^2 + \\Delta x^2 = -(".concat(deltaCt.toFixed(3), ")^2 + (").concat(deltaX.toFixed(3), ")^2 = ").concat(interval.toFixed(4)),
    display: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Lorentz factor"), /*#__PURE__*/React.createElement(Eq, {
    tex: "\\gamma = \\frac{1}{\\sqrt{1-\\beta^2}} = \\frac{1}{\\sqrt{1-(".concat(beta.toFixed(3), ")^2}} = ").concat(gamma.toFixed(4)),
    display: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Boosted time separation"), /*#__PURE__*/React.createElement(Eq, {
    tex: "\\Delta ct' = \\gamma(\\Delta ct-\\beta\\Delta x) = ".concat(gamma.toFixed(4), "[").concat(deltaCt.toFixed(3), "-(").concat(beta.toFixed(3), ")(").concat(deltaX.toFixed(3), ")] = ").concat(transform.deltaCtPrime.toFixed(4)),
    display: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Boosted spatial separation"), /*#__PURE__*/React.createElement(Eq, {
    tex: "\\Delta x' = \\gamma(\\Delta x-\\beta\\Delta ct) = ".concat(gamma.toFixed(4), "[").concat(deltaX.toFixed(3), "-(").concat(beta.toFixed(3), ")(").concat(deltaCt.toFixed(3), ")] = ").concat(transform.deltaXPrime.toFixed(4)),
    display: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Proper time"), /*#__PURE__*/React.createElement(Eq, {
    tex: Number.isFinite(proper) ? "\\Delta\\tau = \\sqrt{-\\Delta s^2}/c = \\sqrt{".concat((-interval).toFixed(4), "} = ").concat(proper.toFixed(4)) : "\\Delta\\tau\\;\\text{is defined here only for timelike separation }(\\Delta s^2<0)",
    display: true
  }))), /*#__PURE__*/React.createElement("p", {
    className: "causal-equation-note"
  }, "Convention: metric signature (\u2212,+,+,+). The diagram plots ", /*#__PURE__*/React.createElement("strong", null, "ct"), " and ", /*#__PURE__*/React.createElement("strong", null, "x"), " in light-seconds and sets ", /*#__PURE__*/React.createElement("strong", null, "c = 1 light-second per second"), "; therefore numerical ct values equal seconds while interval values are light-seconds\xB2.")), /*#__PURE__*/React.createElement("div", {
    className: "causal-validity-grid"
  }, /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-established"
  }, "Established"), /*#__PURE__*/React.createElement("h4", null, "What is exact"), /*#__PURE__*/React.createElement("p", null, "Lorentz transformations, interval classification, null-cone boundaries, inertial worldlines, and proper-time sums for timelike inertial segments in 1+1D flat spacetime.")), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-schematic"
  }, "Schematic"), /*#__PURE__*/React.createElement("h4", null, "What is presentation"), /*#__PURE__*/React.createElement("p", null, "Glow, event pulses, the bounded signal trace, and the twin preset's instantaneous turnaround marker. Animation never supplies a number used by the exact readouts.")), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-open"
  }, "Out of scope"), /*#__PURE__*/React.createElement("h4", null, "What is not simulated"), /*#__PURE__*/React.createElement("p", null, "No gravity, curvature, acceleration history, geodesic deviation, expanding universe, uncertainty model, or black-hole spacetime. This is a flat-spacetime foundation for GR."))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "gr-simultaneity",
    status: "effective"
  }, "Drag A or B, use their arrow-key controls, choose a documented preset, or change \u03B2. The solid event pair is frame S; the faint A\u2032/B\u2032 pair and dashed axes are frame S\u2032. Timelike order and null connection are invariant. Only a spacelike pair can become simultaneous or reverse coordinate-time order. URL state stores both events, \u03B2 and the selected preset; invalid coordinates fall back to the documented defaults."));
}

/* ---------- 3D spacetime curvature engine ---------- */
// Impact parameters for the lensing fan (symmetric — focuses behind the mass).
// The inner pair sits inside the capture cone (b < b_crit) so the fan shows both
// escape and capture; the outer pairs sample the weak-field limit.
var GR_RAY_B = [-3.3, -2.2, -1.25, -0.45, 0.45, 1.25, 2.2, 3.3];
// scene c² = (5.2)²; matches GR_ENGINE_C2 in js/physics.mjs.
var GR_C2 = 27.04;
var GR_BODY_PALETTE = [QGA_TOKENS.hex("pigment-cyan-85"), QGA_TOKENS.hex("pigment-orange-79"), QGA_TOKENS.hex("pigment-violet-73-c17"), QGA_TOKENS.hex("pigment-green-84"), QGA_TOKENS.hex("pigment-pink-78"), QGA_TOKENS.hex("pigment-amber-91")];
var GR_MAX_BODIES = 6;
// Cinematic camera framing per scenario (Scene3D glides the orbit rig).
var GR_CAMERA = {
  classic: {
    radius: 17,
    theta: 0.4,
    phi: 1.08
  },
  mercury: {
    radius: 15,
    theta: 0.5,
    phi: 1.0
  },
  comet: {
    radius: 18,
    theta: 0.35,
    phi: 1.15
  },
  resonance: {
    radius: 16,
    theta: 0.6,
    phi: 1.0
  },
  cluster: {
    radius: 20,
    theta: 0.45,
    phi: 0.95
  },
  plunge: {
    radius: 15,
    theta: 0.55,
    phi: 1.05
  },
  whirl: {
    radius: 12.5,
    theta: 0.5,
    phi: 1.22
  }
};
var grUidSeed = 0;

// Scenario preset bodies → editable runtime bodies (uids keep sim state stable
// across React re-renders; the scene loop re-syncs by uid, not index).
function grMakeBodies(scenarioId) {
  var s = window.QGA_PHYSICS.grCurvatureScenario(scenarioId);
  return s.bodies.map(function (b, i) {
    return {
      uid: "b" + grUidSeed++,
      free: !!b.free,
      a: b.a,
      e: b.e,
      phase: b.phase,
      peri: b.peri,
      incl: b.incl != null ? b.incl : i % 2 ? 0.05 : -0.04,
      x0: b.x0,
      y0: b.y0,
      vx0: b.vx0,
      vy0: b.vy0,
      hex: GR_BODY_PALETTE[i % GR_BODY_PALETTE.length],
      r: b.free ? 0.15 : 0.2 - i * 0.015
    };
  });
}
function grPrecDeg(M, a, e) {
  return window.QGA_PHYSICS.grPerihelionPrecession(0.55 * M, GR_C2, a, e) * 180 / Math.PI;
}

/* Effective-potential panel: V_eff(r) = −GM/r + L²/2r² − GM·L²/c²r³ for the
   selected body, GR vs Newtonian, with photon-sphere / ISCO markers, the
   energy line, turning points, and a live radius marker driven by the scene
   loop through stRef (no per-frame React renders). */

/* ── Effective-potential panel ───────────────────────────────────────────────
   V_eff(r) = −GM/r + L²/2r² − GM·L²/c²r³ for the selected body, GR against
   Newtonian. The y-window is derived from the well itself instead of a fixed
   clamp: a fixed range made the curve a flat line whenever the 1/r² term
   dominated the left edge. Turning points are found by root-finding V = E, not
   from the Newtonian a(1±e), which is wrong once the r⁻³ term matters. */
function VEffPanel(_ref6) {
  var mass = _ref6.mass,
    body = _ref6.body,
    view = _ref6.view,
    stRef = _ref6.stRef;
  var dotRef = useRef(null);
  var P = window.QGA_PHYSICS;
  var gm = 0.55 * mass;
  var rPh = P.grPhotonSphereRadius(gm, GR_C2);
  var rIsco = P.grIscoRadius(gm, GR_C2);
  var rs = 2 * gm / GR_C2;
  var bound = body && !body.free;
  var a = bound ? body.a : 3;
  var e = bound ? body.e : 0;
  var L2 = gm * a * (1 - e * e);
  var L = Math.sqrt(L2);
  var E = -gm / (2 * a);
  var V = function V(r) {
    return P.grEffectivePotential(gm, GR_C2, L, r);
  };
  var VN = function VN(r) {
    return -gm / r + L2 / (2 * r * r);
  };

  // Scan only outside the photon sphere: the r⁻³ term diverges at the origin,
  // so a scan that reaches r → 0 reports a "minimum" of −10³ and flattens the
  // real well into a straight line.
  var rScanLo = 1.02 * rPh;
  var rScanHi = Math.max(a * (1 + e) * 2.2, 7);
  var NS = 400;
  var scan = [];
  for (var i = 0; i <= NS; i++) {
    var r = rScanLo + (rScanHi - rScanLo) * i / NS;
    scan.push([r, V(r)]);
  }
  var rAtMin = rScanLo,
    vAtMin = Infinity;
  for (var _i = 0, _scan = scan; _i < _scan.length; _i++) {
    var s = _scan[_i];
    if (s[1] < vAtMin) {
      vAtMin = s[1];
      rAtMin = s[0];
    }
  }
  var roots = [];
  for (var _i2 = 1; _i2 < scan.length; _i2++) {
    var f0 = scan[_i2 - 1][1] - E,
      f1 = scan[_i2][1] - E;
    if (f0 === 0) {
      roots.push(scan[_i2 - 1][0]);
      continue;
    }
    if (f0 * f1 >= 0) continue;
    var lo = scan[_i2 - 1][0],
      hi = scan[_i2][0];
    for (var k = 0; k < 48; k++) {
      var mid = 0.5 * (lo + hi);
      if ((V(lo) - E) * (V(mid) - E) <= 0) hi = mid;else lo = mid;
    }
    roots.push(0.5 * (lo + hi));
  }
  var rPeri = roots.length ? roots[0] : a * (1 - e);
  var rApo = roots.length > 1 ? roots[roots.length - 1] : a * (1 + e);
  var rMin = Math.max(0.60 * rPh, Math.min(0.80 * rPeri, 0.92 * rAtMin, 0.98 * rIsco));
  var rMax = Math.min(rScanHi, Math.max(1.55 * rApo, 1.9 * rAtMin, rMin * 2.4));

  // Frame the window that is actually drawn, not the scan range.
  var vMin = Infinity,
    vTop = -Infinity;
  for (var _i3 = 0; _i3 <= 200; _i3++) {
    var v = V(rMin + (rMax - rMin) * _i3 / 200);
    if (v < vMin) vMin = v;
    if (v > vTop) vTop = v;
  }
  if (bound) vTop = Math.max(vTop, E);
  var span = Math.max(1e-6, vTop - vMin);
  // A finer ladder for the value axis keeps five ticks on every scenario; the
  // radius axis keeps the classic ladder so its labels stay 1, 2, 3, 4.
  var niceStep = function niceStep(raw, ladder) {
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    return ladder.map(function (m) {
      return m * mag;
    }).find(function (s) {
      return s >= raw;
    }) || raw;
  };
  var NICE_V = [1, 1.5, 2, 2.5, 3, 4, 5, 10];
  var NICE_R = [1, 2, 2.5, 5, 10];
  // Frame the curve that is actually drawn. The Newtonian branch has no r^-3
  // term, so near the star it sits far above the GR well; reserving room for it
  // pushed the well into the bottom half of the plot. Let it leave the frame
  // instead — its divergence is the point — and land the top edge on a round
  // value so the axis reads cleanly.
  var yLo = vMin - 0.16 * span;
  var yTopRaw = vTop + 0.14 * span;
  var yStep = niceStep((yTopRaw - yLo) / 5, NICE_V);
  // Land the top edge on a round value, but on a finer grid than the ticks so
  // the rounding cannot re-open the headroom it was meant to close.
  var ySub = yStep / 5;
  var yHi = Math.ceil(yTopRaw / ySub) * ySub;
  var NPT = 200;
  var rs_ = [],
    gr_ = [],
    newton_ = [];
  for (var _i4 = 0; _i4 <= NPT; _i4++) {
    var _r = rMin + (rMax - rMin) * _i4 / NPT;
    rs_.push(_r);
    gr_.push(V(_r));
    newton_.push(VN(_r));
  }
  var hex = body ? "#" + body.hex.toString(16).padStart(6, "0") : QGA_TOKENS.css("pigment-cyan-85");
  var inRange = function inRange(r) {
    return r > rMin && r < rMax;
  };
  var marks = [{
    r: rs,
    color: "pigment-red-76",
    tex: "r_s"
  }, {
    r: rPh,
    color: "pigment-violet-65-c16",
    tex: "r_{\\mathrm{ph}}"
  }, {
    r: rIsco,
    color: "pigment-cyan-77",
    tex: "r_{\\mathrm{ISCO}}"
  }].filter(function (m) {
    return inRange(m.r);
  });
  var liveR = Math.min(Math.max(rPeri, rMin), rMax);
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.gr.effectivePotentialSpec({
      r: rs_,
      gr: gr_,
      newton: newton_,
      rDomain: [rMin, rMax],
      vDomain: [yLo, yHi],
      marks: marks,
      energy: bound ? E : null,
      turning: bound ? [{
        r: rPeri,
        tex: "r_{\\mathrm{peri}}"
      }, {
        r: rApo,
        tex: "r_{\\mathrm{apo}}"
      }].filter(function (t) {
        return inRange(t.r);
      }) : [],
      view: view
    });
  }, [mass, a, e, bound, view]); // eslint-disable-line

  // Live radius marker: moved by the scene loop through stRef; no per-frame React renders.
  var sceneRef = useRef(null);
  useEffect(function () {
    var id = setInterval(function () {
      var el = dotRef.current,
        sc = sceneRef.current;
      if (!el || !sc) return;
      var r = Math.min(Math.max(stRef.current.selR || 0, rMin), rMax);
      el.style.left = sc.sx.map(r).toFixed(1) + "px";
      el.style.top = sc.sy.map(V(r)).toFixed(1) + "px";
    }, 160);
    return function () {
      return clearInterval(id);
    };
  }, [stRef, mass, a, e]); // eslint-disable-line

  return /*#__PURE__*/React.createElement("div", {
    className: "veff-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-head"
  }, /*#__PURE__*/React.createElement("span", null, "Effective potential"), /*#__PURE__*/React.createElement("em", null, "V_eff(r) \xB7 selected orbit")), /*#__PURE__*/React.createElement(Figure, {
    spec: spec,
    extra: function extra(sc) {
      sceneRef.current = sc;
      return bound ? /*#__PURE__*/React.createElement("i", {
        ref: dotRef,
        className: "fig-live-dot",
        style: {
          left: sc.sx.map(liveR),
          top: sc.sy.map(V(liveR))
        }
      }) : null;
    }
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "V_{\\mathrm{eff}}=-\\frac{GM}{r}+\\frac{L^{2}}{2r^{2}}-\\frac{GM\\,L^{2}}{c^{2}r^{3}}"
  }), /*#__PURE__*/React.createElement("span", {
    className: "dim"
  }, " \xB7 GR against Newtonian; the live marker is the selected body's radius.")));
}

/* The null-geodesic panel (paths, travelling photons and the playback clock) is js/labs/null-geodesic-panel.jsx. */

/* The lensed-sky ray trace (lens model, procedural sky, per-pixel render) lives in js/visualizations/gr/lensed-sky.mjs (S07). */
var _window$QGA_GR$lensed = window.QGA_GR.lensedSky,
  ngTextures = _window$QGA_GR$lensed.ngTextures,
  lensModelFor = _window$QGA_GR$lensed.ngLensModel,
  renderLensedSky = _window$QGA_GR$lensed.renderLensedSky;
var ngLensModel = function ngLensModel(mass) {
  return lensModelFor(mass, window.QGA_PHYSICS, GR_C2);
};
var NG_MODES = [["sky", "Sky"], ["grid", "Grid"], ["flat", "Unlensed"]];
function LensedSkyPanel(_ref7) {
  var mass = _ref7.mass;
  var image = useMemo(function () {
    return Object.assign(document.createElement("canvas"), {
      width: 720,
      height: 720
    });
  }, []);
  var _useState9 = useState("sky"),
    _useState0 = _slicedToArray(_useState9, 2),
    mode = _useState0[0],
    setMode = _useState0[1];
  var _useState1 = useState(0),
    _useState10 = _slicedToArray(_useState1, 2),
    painted = _useState10[0],
    setPainted = _useState10[1];
  var tex = useMemo(function () {
    return ngTextures();
  }, []);
  var L = useMemo(function () {
    return ngLensModel(mass);
  }, [mass]);
  useEffect(function () {
    var raf = requestAnimationFrame(function () {
      renderLensedSky(image, L, mode === "grid" ? tex.grid : tex.sky, mode !== "flat");
      setPainted(function (v) {
        return v + 1;
      });
    });
    return function () {
      return cancelAnimationFrame(raf);
    };
  }, [L, tex, mode, image]);
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.gr.lensFrameSpec({
      thetaShadow: L.thetaShadow,
      thetaE: L.thetaE,
      fov: L.FOV,
      lensed: mode !== "flat"
    });
  }, [L, mode]);
  return /*#__PURE__*/React.createElement("div", {
    className: "lens-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-head"
  }, /*#__PURE__*/React.createElement("span", null, "Lensed sky"), /*#__PURE__*/React.createElement("div", {
    className: "lens-modes",
    role: "group",
    "aria-label": "Lensed sky view"
  }, NG_MODES.map(function (_ref8) {
    var _ref9 = _slicedToArray(_ref8, 2),
      k = _ref9[0],
      label = _ref9[1];
    return /*#__PURE__*/React.createElement("button", {
      key: k,
      type: "button",
      "aria-pressed": mode === k,
      className: "lens-mode" + (mode === k ? " is-on" : ""),
      onClick: function onClick() {
        return setMode(k);
      }
    }, label);
  }))), /*#__PURE__*/React.createElement(Figure, {
    spec: spec,
    backdropKey: painted,
    backdrop: function backdrop(ctx, plot) {
      if (painted) ctx.drawImage(image, plot.x, plot.y, plot.w, plot.h);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "lens-note"
  }, "\u03B1(b) integrated per pixel \xB7 FOV = 2.5 \u03B8_E")));
}
function CurvatureEngine() {
  var _useState11 = useState(5),
    _useState12 = _slicedToArray(_useState11, 2),
    mass = _useState12[0],
    setMass = _useState12[1];
  var _useState13 = useState("gr"),
    _useState14 = _slicedToArray(_useState13, 2),
    view = _useState14[0],
    setView = _useState14[1]; // 'gr' | 'newton'
  var _useState15 = useState(true),
    _useState16 = _slicedToArray(_useState15, 2),
    showRay = _useState16[0],
    setShowRay = _useState16[1];
  var massRef = useRef(mass);
  massRef.current = mass;
  var viewRef = useRef(view);
  viewRef.current = view;
  var rayRef = useRef(showRay);
  rayRef.current = showRay;
  var prm = usePRM();

  // physics state (plane coordinates, world units): orbiting particle + photon
  var stRef = useRef(null);
  var initState = function initState() {
    stRef.current = {
      p: {
        x: 0,
        y: -3.2,
        vx: 1.45,
        vy: 0
      },
      // test particle
      ray: {
        x: -7.5,
        y: -1.7,
        vx: 5.2,
        vy: 0,
        trail: []
      },
      ptrail: []
    };
  };
  if (!stRef.current) initState();
  var sim = useSimLoop(function (ctx, w, h, t, dt) {
    var M = massRef.current;
    var st = stRef.current;
    var GM = 0.55 * M;
    // --- integrate test particle (Newtonian + schematic precession term in GR view) ---
    var sub = 6,
      sdt = Math.min(dt, 0.04) / sub;
    for (var s = 0; s < sub; s++) {
      var p = st.p;
      var r2 = p.x * p.x + p.y * p.y,
        r = Math.sqrt(r2) + 1e-6;
      if (r > 0.45) {
        var L2 = Math.pow(p.x * p.vy - p.y * p.vx, 2);
        var corr = viewRef.current === "gr" ? 1 + 0.18 * GM * L2 / (r2 * r2 + 1e-9) : 1; // schematic 1/r⁴ GR-style correction
        var a = -GM * corr / (r2 * r + 1e-9);
        p.vx += a * p.x * sdt * 60;
        p.vy += a * p.y * sdt * 60;
        p.x += p.vx * sdt * 60 * 0.016;
        p.y += p.vy * sdt * 60 * 0.016;
      }
      // photon
      if (rayRef.current) {
        var q = st.ray;
        var qr2 = q.x * q.x + q.y * q.y,
          qr = Math.sqrt(qr2) + 1e-6;
        if (qr > 0.4) {
          var af = -2 * GM / (qr2 * qr) * 0.5; // factor-2 light deflection, schematic
          q.vx += af * q.x * sdt * 60;
          q.vy += af * q.y * sdt * 60;
          var vn = Math.hypot(q.vx, q.vy);
          q.vx *= 5.2 / vn;
          q.vy *= 5.2 / vn; // photons keep |v|=c
          q.x += q.vx * sdt * 60 * 0.016;
          q.y += q.vy * sdt * 60 * 0.016;
        }
        if (q.x > 8.5 || Math.abs(q.y) > 6 || qr <= 0.42) {
          q.x = -7.5;
          q.y = -1.7;
          q.vx = 5.2;
          q.vy = 0;
          q.trail = [];
        }
        q.trail.push({
          x: q.x,
          y: q.y
        });
        if (q.trail.length > 240) q.trail.shift();
      }
    }
    if (dt > 0) {
      st.ptrail.push({
        x: st.p.x,
        y: st.p.y
      });
      if (st.ptrail.length > 300) st.ptrail.shift();
    }

    // --- render: project plane (x,y) + depth z(x,y) into screen ---
    ctx.clearRect(0, 0, w, h);
    var cx = w / 2,
      cy = h * 0.46,
      sc = Math.min(w, h * 1.6) / 17;
    var depth = function depth(x, y) {
      var r = Math.hypot(x, y);
      return viewRef.current === "gr" ? -1.9 * GM / Math.sqrt(r * r + 0.55) : 0;
    };
    var P = function P(x, y) {
      var z = depth(x, y);
      return [cx + x * sc, cy + y * sc * 0.5 - z * sc * 0.55];
    };
    // grid
    var R = 8;
    ctx.lineWidth = 1;
    for (var gy = -R; gy <= R; gy++) {
      ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-64", (0.07 + 0.06 * (1 - Math.abs(gy) / R)).toFixed(3));
      ctx.beginPath();
      for (var gx = -R; gx <= R; gx += 0.25) {
        var _P = P(gx, gy),
          _P2 = _slicedToArray(_P, 2),
          px = _P2[0],
          py = _P2[1];
        if (gx === -R) ctx.moveTo(px, py);else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    for (var _gx = -R; _gx <= R; _gx++) {
      ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-64", (0.07 + 0.06 * (1 - Math.abs(_gx) / R)).toFixed(3));
      ctx.beginPath();
      for (var _gy = -R; _gy <= R; _gy += 0.25) {
        var _P3 = P(_gx, _gy),
          _P4 = _slicedToArray(_P3, 2),
          _px = _P4[0],
          _py = _P4[1];
        if (_gy === -R) ctx.moveTo(_px, _py);else ctx.lineTo(_px, _py);
      }
      ctx.stroke();
    }
    // central mass
    var _P5 = P(0, 0),
      _P6 = _slicedToArray(_P5, 2),
      mx = _P6[0],
      my = _P6[1];
    var mr = 7 + M * 1.6;
    var grad = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 2.4);
    grad.addColorStop(0, QGA_TOKENS.alpha("pigment-amber-90", 0.95));
    grad.addColorStop(0.4, QGA_TOKENS.alpha("pigment-amber-79", 0.5));
    grad.addColorStop(1, QGA_TOKENS.alpha("pigment-amber-79", 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = QGA_TOKENS.css("pigment-amber-93");
    ctx.beginPath();
    ctx.arc(mx, my, mr * 0.55, 0, Math.PI * 2);
    ctx.fill();
    // particle trail + body
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-cyan-78", 0.5);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    st.ptrail.forEach(function (q, i) {
      var _P7 = P(q.x, q.y),
        _P8 = _slicedToArray(_P7, 2),
        px = _P8[0],
        py = _P8[1];
      if (i === 0) ctx.moveTo(px, py);else ctx.lineTo(px, py);
    });
    ctx.stroke();
    var _P9 = P(st.p.x, st.p.y),
      _P0 = _slicedToArray(_P9, 2),
      ppx = _P0[0],
      ppy = _P0[1];
    ctx.fillStyle = QGA_TOKENS.css("pigment-cyan-78");
    ctx.beginPath();
    ctx.arc(ppx, ppy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // Newton view: draw force vector; GR view: label geodesic
    ctx.font = QGA_TOKENS.monoPx(10);
    if (viewRef.current === "newton") {
      var _r2 = Math.hypot(st.p.x, st.p.y) + 1e-6;
      var fx = -st.p.x / _r2,
        fy = -st.p.y / _r2;
      var _P1 = P(st.p.x + fx * 1.3, st.p.y + fy * 1.3),
        _P10 = _slicedToArray(_P1, 2),
        tx = _P10[0],
        ty = _P10[1];
      ctx.strokeStyle = QGA_TOKENS.css("pigment-red-70");
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ppx, ppy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = QGA_TOKENS.css("pigment-red-70");
      ctx.fillText("F = −GMm r̂ / r²  (force picture)", ppx + 10, ppy - 10);
    } else {
      ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-81", 0.8);
      ctx.fillText("geodesic — no force, curved geometry", ppx + 10, ppy - 10);
    }
    // light ray
    if (rayRef.current) {
      var _q = st.ray;
      ctx.strokeStyle = QGA_TOKENS.css("pigment-amber-80");
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      _q.trail.forEach(function (pt, i) {
        var _P11 = P(pt.x, pt.y),
          _P12 = _slicedToArray(_P11, 2),
          px = _P12[0],
          py = _P12[1];
        if (i === 0) ctx.moveTo(px, py);else ctx.lineTo(px, py);
      });
      ctx.stroke();
      var _P13 = P(_q.x, _q.y),
        _P14 = _slicedToArray(_P13, 2),
        lx = _P14[0],
        ly = _P14[1];
      ctx.fillStyle = QGA_TOKENS.css("pigment-amber-80");
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText("light ray", lx + 8, ly + 4);
    }
  }, [prm]);
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame"
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
  }, "Newtonian intuition")), /*#__PURE__*/React.createElement(Toggle, {
    label: "light ray",
    checked: showRay,
    onChange: setShowRay
  })), /*#__PURE__*/React.createElement("canvas", {
    ref: sim.canvasRef,
    className: "viz-canvas",
    style: {
      height: 380
    }
  }), /*#__PURE__*/React.createElement(SimBar, {
    sim: sim
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      initState();
    }
  }, "Re-launch bodies")), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "gr-curvature-2d",
    status: "schematic"
  }, "Embedding-diagram-style visualization (Flamm-paraboloid intuition), not a literal picture of 3D space. In the relativistic view the orbit precesses \u2014 the perihelion advance absent from Newtonian gravity \u2014 and the light ray bends by twice the Newtonian prediction, the effect that made general relativity famous in 1919. Curvature is sourced by the full energy\u2013momentum tensor, not by mass alone."));
}
function ModuleGR(_ref0) {
  var go = _ref0.go;
  return /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement(ModuleHeader, {
    num: "04",
    kicker: "Gravity as geometry",
    title: "General Relativity and Spacetime Geometry",
    lede: "General relativity removes gravity from the list of forces. Mass-energy curves spacetime; freely falling bodies follow the straightest available paths through that curved geometry. The theory has passed every experimental test for over a century \u2014 and contains the seeds of its own breakdown.",
    target: ".penrose-atlas, [data-figure=\"gr-penrose\"]"
  }), /*#__PURE__*/React.createElement(Section, {
    title: "Causal spacetime laboratory"
  }, /*#__PURE__*/React.createElement("p", null, "General relativity inherits its local causal structure from special relativity. This flat-spacetime laboratory isolates that foundation: events, light cones, invariant intervals, inertial frames, proper time, and relativity of simultaneity. Its calculations are exact for 1+1-dimensional Minkowski spacetime; the curved-spacetime engine below addresses a different layer of the theory."), /*#__PURE__*/React.createElement(CausalSpacetimeLab, null)), /*#__PURE__*/React.createElement(Section, {
    title: "Conformal diagrams"
  }, /*#__PURE__*/React.createElement("p", null, "Where can light go? Explore exact conformal maps of flat spacetime and Schwarzschild, then compare them with a labelled schematic of a charged black-hole solution."), /*#__PURE__*/React.createElement(PenroseAtlas, null)), /*#__PURE__*/React.createElement(Section, {
    title: "Tidal forces and observation"
  }, /*#__PURE__*/React.createElement(TidalLab, null), /*#__PURE__*/React.createElement(GRTestsPanel, null)), /*#__PURE__*/React.createElement(Section, {
    title: "The curvature engine"
  }, /*#__PURE__*/React.createElement("p", null, "Compare a schematic potential with an exact embedding of the Schwarzschild equatorial spatial slice. The orbit and light-ray models are shown separately and carry their own approximations."), /*#__PURE__*/React.createElement(CurvatureEngine3D, null), /*#__PURE__*/React.createElement("div", {
    className: "formula-grid",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(NewtonianLimitCard, null))), /*#__PURE__*/React.createElement(Section, {
    title: "Mathematical formulation"
  }, /*#__PURE__*/React.createElement("div", {
    className: "formula-grid"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Einstein field equations",
    status: "established",
    formulaId: "gr-einstein-field-equations-compact",
    symbols: [{
      s: "G_{\\mu\\nu}",
      d: "Einstein tensor — a specific combination of curvature ($R_{\\mu\\nu}-\\tfrac12 R\\,g_{\\mu\\nu}$) that is automatically conserved."
    }, {
      s: "g_{\\mu\\nu}",
      d: "Metric tensor: the dynamical field encoding distances, durations, and causal structure."
    }, {
      s: "\\Lambda",
      d: "Cosmological constant; observations indicate a small positive value driving cosmic acceleration."
    }, {
      s: "T_{\\mu\\nu}",
      d: "Energy–momentum tensor of matter and radiation — the source of curvature. Pressure and momentum flux gravitate, not just mass."
    }],
    meaning: "Ten coupled nonlinear equations stating: geometry (left) is determined by energy-momentum content (right). Matter tells spacetime how to curve; spacetime tells matter how to move.",
    limits: "Classical field equations. They predict singularities (Penrose\u2013Hawking theorems) where the description must fail \u2014 a primary motivation for quantum gravity."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Geodesic equation",
    status: "established",
    formulaId: "gr-geodesic-spaced",
    symbols: [{
      s: "x^\\mu(\\tau)",
      d: "Worldline of the freely falling body, parameterized by proper time $\\tau$."
    }, {
      s: "\\Gamma^{\\mu}_{\\alpha\\beta}",
      d: "Christoffel symbols — derivatives of the metric playing the role the 'gravitational field' plays in Newtonian language."
    }],
    meaning: "The equation of motion for free fall: the curve of extremal proper time. No mass of the test body appears \u2014 the equivalence principle is built in.",
    limits: "Valid for test bodies whose own gravity is negligible; extended or self-gravitating bodies require corrections."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Einstein\u2013Hilbert action",
    status: "established",
    formulaId: "gr-einstein-hilbert-action",
    symbols: [{
      s: "R",
      d: "Ricci curvature scalar — the simplest invariant measure of curvature."
    }, {
      s: "\\sqrt{-g}\\,d^4x",
      d: "Invariant spacetime volume element."
    }, {
      s: "G",
      d: "Newton's constant. Its dimensions, $[G]=\\mathrm{energy}^{-2}$ in natural units, are the root of gravity's non-renormalizability (Module 05)."
    }],
    meaning: "Varying this action with respect to the metric yields the Einstein field equations. Its form is what one attempts to quantize \u2014 by path integral, canonical methods, or otherwise.",
    limits: "Lowest-order term only; quantum corrections generate higher-curvature terms ($R^2$, \u2026) suppressed by the Planck scale."
  }))), /*#__PURE__*/React.createElement(Misconception, {
    title: "Gravity is not a force in general relativity."
  }, "The 'rubber sheet' image is itself only an analogy \u2014 and a 2D embedding diagram of spatial curvature, at that. What the theory actually says: free-falling observers feel no force (they are inertial), and what we call gravitational attraction is the convergence of geodesics in curved spacetime. Time curvature, not space curvature, dominates everyday gravity."), /*#__PURE__*/React.createElement(ConceptBridge, {
    id: "gr-planck",
    go: go
  }));
}
window.ModuleGR = ModuleGR;