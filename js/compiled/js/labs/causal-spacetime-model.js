/* Compiled from js/labs/causal-spacetime-model.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// causal-spacetime-model.jsx — the pure parts of the causal spacetime laboratory (Module 04), moved out of mod-gr.jsx in
// S19 so the module file could gain the Penrose section without growing. Nothing here draws: it is the preset table, the
// world window, the clamping and easing the lab's controls use, and the endpoint of a null ray on the plot border.
//
// The numbers are the documented defaults of the laboratory, and the state patch is the shape the URL state stores.

var CAUSAL_DEFAULT = {
  preset: "timelike",
  beta: 0.35,
  a: {
    ct: 0,
    x: -1.35
  },
  b: {
    ct: 2.6,
    x: 1.1
  }
};
var CAUSAL_PRESET_STATE = {
  timelike: {
    label: "Timelike",
    beta: 0.28,
    a: {
      ct: -2.2,
      x: -1.4
    },
    b: {
      ct: 2.2,
      x: 0.5
    },
    note: "Every inertial frame agrees that A occurs before B."
  },
  spacelike: {
    label: "Spacelike",
    beta: 0.6,
    a: {
      ct: -0.7,
      x: -2.2
    },
    b: {
      ct: 0.7,
      x: 2.2
    },
    note: "This boost reverses the coordinate-time order."
  },
  "null": {
    label: "Null",
    beta: -0.55,
    a: {
      ct: -2,
      x: -2
    },
    b: {
      ct: 2,
      x: 2
    },
    note: "A light signal connects the events in every inertial frame."
  },
  simultaneity: {
    label: "Simultaneity",
    beta: 0.4,
    a: {
      ct: -0.8,
      x: -2.4
    },
    b: {
      ct: 0.8,
      x: 1.6
    },
    note: "The selected boost makes these spacelike events simultaneous."
  },
  twin: {
    label: "Twin path",
    beta: 0.35,
    a: {
      ct: -3,
      x: 0
    },
    b: {
      ct: 3,
      x: 0
    },
    note: "Piecewise inertial comparison with an instantaneous turnaround marker."
  }
};
var CAUSAL_WORLD = {
  min: -4,
  max: 4
};
var CAUSAL_PLOT = {
  left: 76,
  right: 868,
  top: 28,
  bottom: 508
};

/** A coordinate clamped to the plot window, falling back to `fallback` when it is not a number. */
function clampCausalNumber(value, fallback) {
  var min = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : CAUSAL_WORLD.min;
  var max = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : CAUSAL_WORLD.max;
  var numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : fallback;
}

/** Eased follow of a value over `duration` ms; under reduced motion it snaps to the target at once. */
function useEasedCausalValue(target, reducedMotion) {
  var duration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 520;
  var _useState = useState(target),
    _useState2 = _slicedToArray(_useState, 2),
    shown = _useState2[0],
    setShown = _useState2[1];
  var shownRef = useRef(target);
  var rafRef = useRef(0);
  useEffect(function () {
    cancelAnimationFrame(rafRef.current);
    if (reducedMotion || Math.abs(target - shownRef.current) < 1e-6) {
      shownRef.current = target;
      setShown(target);
      return undefined;
    }
    var from = shownRef.current;
    var started = performance.now();
    var _frame = function frame(now) {
      var progress = Math.min(1, (now - started) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      var next = progress === 1 ? target : from + (target - from) * eased;
      shownRef.current = next;
      setShown(next);
      if (progress < 1) rafRef.current = requestAnimationFrame(_frame);
    };
    rafRef.current = requestAnimationFrame(_frame);
    return function () {
      return cancelAnimationFrame(rafRef.current);
    };
  }, [target, reducedMotion, duration]);
  return shown;
}

/** Where a ray of direction (dx, dct) from `origin` leaves the plot window. */
function causalRayEndpoint(origin, dx, dct) {
  var xLimit = dx > 0 ? (CAUSAL_WORLD.max - origin.x) / dx : (CAUSAL_WORLD.min - origin.x) / dx;
  var ctLimit = dct > 0 ? (CAUSAL_WORLD.max - origin.ct) / dct : (CAUSAL_WORLD.min - origin.ct) / dct;
  var scale = Math.max(0, Math.min(xLimit, ctLimit));
  return {
    x: origin.x + dx * scale,
    ct: origin.ct + dct * scale
  };
}

/** The URL-state patch a preset writes. */
function causalStatePatch(preset, next) {
  return {
    grPreset: preset,
    grBeta: next.beta,
    grAt: next.a.ct,
    grAx: next.a.x,
    grBt: next.b.ct,
    grBx: next.b.x
  };
}
window.CAUSAL_MODEL = Object.freeze({
  DEFAULT: CAUSAL_DEFAULT,
  PRESETS: CAUSAL_PRESET_STATE,
  WORLD: CAUSAL_WORLD,
  PLOT: CAUSAL_PLOT,
  clamp: clampCausalNumber,
  useEasedCausalValue: useEasedCausalValue,
  rayEndpoint: causalRayEndpoint,
  statePatch: causalStatePatch
});