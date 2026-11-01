/* Compiled from js/labs/null-geodesic-panel.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

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
// null-geodesic-panel.jsx — the orbital-plane light paths of the GR view, with photons travelling along them.
// The paths are the exact Schwarzschild null geodesics of js/physics.mjs drawn by the Figure Kit (plots/gr.mjs); on top, a plane
// wavefront of photons is released at once and played back on the integrator's own clock (js/visualizations/gr/null-photons.mjs).
// The capture, the lag of the near-critical ray and the distortion of the wavefront are therefore the physics, not an effect.

var NG_FRACTIONS = [0.55, 0.8, 0.95, 0.995, 1.005, 1.05, 1.25, 1.7, 2.4];
var NG_NEAR_FRACTION = 1.005;
var NG_LOOP_SECONDS = 9;
var NG_HOLD_SECONDS = 1.6;
var NG_READOUT_MS = 100;
var NG_PARKED_CROSSINGS = 0.7; // where the clock rests when motion is reduced: the wavefront mid-flight

function NullPhotonLayer(_ref) {
  var scene = _ref.scene,
    model = _ref.model,
    clock = _ref.clock,
    playing = _ref.playing,
    redraw = _ref.redraw;
  var canvasRef = useRef(null);
  var contextRef = useRef(null);
  var visibleRef = useRef(true);
  var palette = useMemo(function () {
    return {
      escape: QGA_TOKENS.css("pigment-amber-88"),
      capture: QGA_TOKENS.css("pigment-red-71-c18")
    };
  }, []);
  var draw = useCallback(function () {
    if (contextRef.current) window.QGA_GR.nullPhotons.drawPhotons(contextRef.current, scene, model, clock.current, palette);
  }, [scene, model, palette, clock]);
  useEffect(function () {
    contextRef.current = window.QGA_FIGURE.prepareCanvas(canvasRef.current, scene.width, scene.height);
    draw();
  }, [scene, draw]);
  useEffect(function () {
    draw();
  }, [redraw, draw]);
  useEffect(function () {
    var observer = new IntersectionObserver(function (entries) {
      visibleRef.current = entries[0].isIntersecting;
    });
    observer.observe(canvasRef.current);
    return function () {
      return observer.disconnect();
    };
  }, []);
  useEffect(function () {
    if (!playing) return undefined;
    var frame = 0,
      last = performance.now();
    var _tick = function tick(now) {
      frame = requestAnimationFrame(_tick);
      var seconds = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visibleRef.current || document.hidden) return;
      clock.current = window.QGA_GR.nullPhotons.advanceClock(clock.current, seconds, model.span, {
        loopSeconds: NG_LOOP_SECONDS,
        holdSeconds: NG_HOLD_SECONDS
      });
      draw();
    };
    frame = requestAnimationFrame(_tick);
    return function () {
      return cancelAnimationFrame(frame);
    };
  }, [playing, model, draw, clock]);

  // prepareCanvas sizes the backing store at devicePixelRatio; the CSS box must stay the scene's, as the figure's own canvas does.
  return /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    className: "ng-photons",
    style: {
      width: scene.width,
      height: scene.height
    },
    "aria-hidden": "true"
  });
}
function NullGeodesicPanel(_ref2) {
  var mass = _ref2.mass,
    c2 = _ref2.c2;
  var P = window.QGA_PHYSICS;
  var N = window.QGA_GR.nullPhotons;
  var reduced = usePRM();
  var gm = 0.55 * mass;
  var rPh = P.grPhotonSphereRadius(gm, c2);
  var bCrit = P.grCriticalImpactParameter(gm, c2);
  var rs = 2 * gm / c2;
  var rays = useMemo(function () {
    return NG_FRACTIONS.map(function (f) {
      // rCap just outside the horizon so a captured ray is drawn plunging in rather than stopping in mid-air at the photon
      // sphere; the fine step keeps the stiff near-horizon integration smooth.
      var t = P.grNullTrajectory(bCrit * f, gm, c2, {
        maxSteps: 60000,
        dt: N.NULL_PHOTON_STEP,
        v0: N.NULL_PHOTON_SPEED,
        rCap: 1.02 * rs
      });
      return {
        f: f,
        captured: t.captured,
        windings: t.windings,
        points: t.points
      };
    });
  }, [mass, c2]); // eslint-disable-line
  var model = useMemo(function () {
    return N.buildPhotonRays(rays, 2.5 * bCrit);
  }, [rays]); // eslint-disable-line
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.gr.nullGeodesicSpec({
      rays: rays,
      bCrit: bCrit,
      rPh: rPh,
      rs: rs
    });
  }, [rays]); // eslint-disable-line

  var clock = useRef(reduced ? NG_PARKED_CROSSINGS * model.crossing : 0);
  var _useState = useState(!reduced),
    _useState2 = _slicedToArray(_useState, 2),
    playing = _useState2[0],
    setPlaying = _useState2[1];
  var _useState3 = useState(clock.current / model.crossing),
    _useState4 = _slicedToArray(_useState3, 2),
    shown = _useState4[0],
    setShown = _useState4[1];
  var _useState5 = useState(0),
    _useState6 = _slicedToArray(_useState5, 2),
    redraw = _useState6[0],
    setRedraw = _useState6[1];
  useEffect(function () {
    clock.current = Math.min(clock.current, model.span);
  }, [model]);
  useEffect(function () {
    if (!playing) return undefined;
    var id = setInterval(function () {
      return setShown(N.clockInCrossings(clock.current, model.crossing));
    }, NG_READOUT_MS);
    return function () {
      return clearInterval(id);
    };
  }, [playing, model]); // eslint-disable-line
  var scrub = function scrub(crossings) {
    clock.current = crossings * model.crossing;
    setPlaying(false);
    setShown(crossings);
    setRedraw(function (n) {
      return n + 1;
    });
  };
  var near = model.photons.find(function (p) {
    return p.f === NG_NEAR_FRACTION;
  });
  var undeflected = model.photons.reduce(function (a, b) {
    return b.f > a.f ? b : a;
  });
  var lastCaptured = Math.max.apply(Math, _toConsumableArray(model.photons.filter(function (p) {
    return p.captured;
  }).map(function (p) {
    return p.steps;
  })));
  var crossings = function crossings(steps) {
    return (steps / model.crossing).toFixed(2);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "ng-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-head"
  }, /*#__PURE__*/React.createElement("span", null, "Null geodesics"), /*#__PURE__*/React.createElement("em", null, "orbital plane \xB7 light released together")), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar ng-bar",
    role: "group",
    "aria-label": "Photon playback"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn ng-btn" + (playing ? " on" : ""),
    "aria-pressed": playing,
    onClick: function onClick() {
      return setPlaying(!playing);
    }
  }, playing ? "Pause" : "Play"), /*#__PURE__*/React.createElement(SliderRow, {
    label: "light-travel time",
    min: 0,
    max: model.span / model.crossing,
    step: 0.005,
    value: shown,
    onChange: scrub,
    format: function format(x) {
      return x.toFixed(2);
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "ng-clock"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "t/t_0"
  }))), /*#__PURE__*/React.createElement(Figure, {
    spec: spec,
    extra: function extra(scene) {
      return /*#__PURE__*/React.createElement(NullPhotonLayer, {
        scene: scene,
        model: model,
        clock: clock,
        playing: playing,
        redraw: redraw
      });
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ng-note"
  }, "A plane wavefront of photons is released at once; ", /*#__PURE__*/React.createElement(Eq, {
    tex: "t_0"
  }), " is the time an undeflected ray needs to cross the frame. Rays with ", /*#__PURE__*/React.createElement(Eq, {
    tex: "b<b_{\\mathrm{crit}}"
  }), " are absorbed within ", /*#__PURE__*/React.createElement(Eq, {
    tex: "t<" + crossings(lastCaptured) + "\\,t_0"
  }), "; the ray at ", /*#__PURE__*/React.createElement(Eq, {
    tex: "b=1.005\\,b_{\\mathrm{crit}}"
  }), " winds ", near ? near.windings.toFixed(2) : "\u2014", " turns and leaves at", " ", /*#__PURE__*/React.createElement(Eq, {
    tex: "t=" + (near ? crossings(near.steps) : "") + "\\,t_0"
  }), " against ", /*#__PURE__*/React.createElement(Eq, {
    tex: "t=" + crossings(undeflected.steps) + "\\,t_0"
  }), " for the farthest ray: a bent path is a longer one, and light that nearly orbits the photon sphere is delayed well beyond the straight crossing.")));
}