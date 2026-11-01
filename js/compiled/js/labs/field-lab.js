/* Compiled from js/labs/field-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// field-lab.jsx — the one-dimensional field laboratory (S14): the CPU reference of the phi^4 lattice, js/science/lattice-field.mjs in 1+1 dimensions,
// drawn as a waterfall. It is what the 2+1D GPU lattice lab (lattice-lab.jsx) falls back to without WebGL, and it runs the same physics: the
// leapfrog on a periodic line of 256 sites (a = 0.25, dt = 0.1, four steps per frame, so the simulated time of a frame is fixed), no damping, no tuned
// constants. A click is the seeded Gaussian kick of the lattice; the scalar, spinor and gauge buttons change the colour and the note, not the dynamics.

var FL_SITES = 256;
var FL_STEPS_PER_FRAME = 4;
var FL_DT = 0.1;
var FL_ROWS = 14;
var FL_KIND_COLOR = function FL_KIND_COLOR() {
  return {
    scalar: QGA_TOKENS.css("pigment-cyan-78"),
    spinor: QGA_TOKENS.css("pigment-violet-72"),
    gauge: QGA_TOKENS.css("pigment-azure-74")
  };
};
var FL_KIND_NOTE = {
  scalar: "Scalar field φ(x): one real amplitude per point. The Higgs field is the Standard Model's only fundamental scalar.",
  spinor: "Spinor field ψ(x): rendered here as the same amplitude — physically it carries four complex components and spin-½. All matter fields are spinors.",
  gauge: "Gauge field A(x): rendered as the same amplitude — physically a four-vector with gauge redundancy. Photons and gluons are its quanta."
};
function FieldLab() {
  var L = window.QGA_QFT_LATTICE;
  var N = FL_SITES;
  var _useState = useState(1.2),
    _useState2 = _slicedToArray(_useState, 2),
    mass = _useState2[0],
    setMass = _useState2[1];
  var _useState3 = useState("scalar"),
    _useState4 = _slicedToArray(_useState3, 2),
    kind = _useState4[0],
    setKind = _useState4[1];
  var _useState5 = useState(true),
    _useState6 = _slicedToArray(_useState5, 2),
    annot = _useState6[0],
    setAnnot = _useState6[1];
  var massRef = useRef(mass);
  massRef.current = mass;
  var annotRef = useRef(annot);
  annotRef.current = annot;
  var kindRef = useRef(kind);
  kindRef.current = kind;
  var fieldRef = useRef(null);
  var labelsRef = useRef([]); // {x, t0}
  var histRef = useRef([]);
  var clicksRef = useRef(0);
  var lattice = function lattice(m) {
    return L.science.createLattice({
      dim: 1,
      n: N,
      a: L.view.spacing,
      mass2: m * m,
      lambda: 0,
      dt: FL_DT
    });
  };
  var initField = function initField() {
    fieldRef.current = {
      phi: new Float64Array(N),
      pi: new Float64Array(N)
    };
    labelsRef.current = [];
    histRef.current = [];
  };
  if (!fieldRef.current) initField();
  var sim = useSimLoop(function (ctx, w, h, t, dt) {
    if (dt > 0) {
      // The state is replaced, never edited: evolve() returns the field after the four steps of this frame.
      fieldRef.current = L.science.evolve(lattice(massRef.current), fieldRef.current, FL_STEPS_PER_FRAME);
      histRef.current.unshift(Float64Array.from(fieldRef.current.phi));
      if (histRef.current.length > FL_ROWS) histRef.current.pop();
    }
    var phi = fieldRef.current.phi;
    ctx.clearRect(0, 0, w, h);
    var baseY = h * 0.62,
      amp = h * 0.3;
    // measurement ticks
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.12);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = 0; x <= w; x += w / 16) {
      ctx.moveTo(x, baseY - 4);
      ctx.lineTo(x, baseY + 4);
    }
    ctx.moveTo(0, baseY);
    ctx.lineTo(w, baseY);
    ctx.stroke();
    // waterfall history
    var col = FL_KIND_COLOR()[kindRef.current];
    histRef.current.forEach(function (row, k) {
      var a = 0.22 * (1 - k / FL_ROWS);
      ctx.strokeStyle = col.replace(")", " / " + a.toFixed(3) + ")");
      ctx.beginPath();
      for (var i = 0; i < N; i++) {
        var _x = i / (N - 1) * w,
          y = baseY - row[i] * amp - (k + 1) * 7;
        if (i === 0) ctx.moveTo(_x, y);else ctx.lineTo(_x, y);
      }
      ctx.stroke();
    });
    // live trace with glow
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i < N; i++) {
      var _x2 = i / (N - 1) * w,
        y = baseY - phi[i] * amp;
      if (i === 0) ctx.moveTo(_x2, y);else ctx.lineTo(_x2, y);
    }
    ctx.stroke();
    ctx.restore();
    // quanta labels (fade out)
    if (annotRef.current) {
      ctx.font = QGA_TOKENS.monoPx(10);
      ctx.textAlign = "center";
      labelsRef.current = labelsRef.current.filter(function (q) {
        return t - q.t0 < 3.2;
      });
      var _iterator = _createForOfIteratorHelper(labelsRef.current),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var q = _step.value;
          var a = Math.max(0, 1 - (t - q.t0) / 3.2);
          ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-88", (a * 0.85).toFixed(3));
          ctx.fillText("localized excitation — particle-like quantum", q.x, baseY - amp * 0.95);
          ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-88", (a * 0.3).toFixed(3));
          ctx.beginPath();
          ctx.moveTo(q.x, baseY - amp * 0.9);
          ctx.lineTo(q.x, baseY - amp * 0.55);
          ctx.stroke();
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      ctx.textAlign = "left";
      ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.5);
      ctx.fillText("φ(x, t)", 12, 18);
      ctx.fillText("vacuum ⟨φ⟩ = 0", 12, baseY + 16);
    }
  }, []);
  var excite = function excite(e) {
    var cv = sim.canvasRef.current;
    var r = cv.getBoundingClientRect();
    var fx = (e.clientX - r.left) / r.width;
    clicksRef.current += 1;
    var seed = L.kickSeed(qgaReadState().seed, clicksRef.current);
    fieldRef.current = L.science.kick(lattice(massRef.current), fieldRef.current, {
      site: [Math.round(fx * (N - 1))],
      seed: seed
    });
    labelsRef.current.push({
      x: fx * r.width,
      t0: sim.tRef.current
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "seg"
  }, ["scalar", "spinor", "gauge"].map(function (k) {
    return /*#__PURE__*/React.createElement("button", {
      key: k,
      className: "btn" + (kind === k ? " on" : ""),
      onClick: function onClick() {
        return setKind(k);
      }
    }, k);
  })), /*#__PURE__*/React.createElement(SliderRow, {
    label: "mass m",
    min: 0,
    max: 3,
    step: 0.05,
    value: mass,
    onChange: setMass,
    format: function format(v) {
      return v.toFixed(2);
    }
  })), /*#__PURE__*/React.createElement("canvas", {
    ref: sim.canvasRef,
    className: "viz-canvas",
    style: {
      height: 300,
      cursor: "crosshair"
    },
    onPointerDown: excite
  }), /*#__PURE__*/React.createElement(SimBar, {
    sim: sim
  }, /*#__PURE__*/React.createElement(Toggle, {
    label: "annotations",
    checked: annot,
    onChange: setAnnot
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: function onClick() {
      initField();
      sim.reset();
    }
  }, "Clear field")), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "qft-field-kinds",
    status: "schematic"
  }, "Click anywhere to kick the field. Disturbances obey the lattice Klein\u2013Gordon equation on a periodic line: wave packets disperse, wrap around and interfere. Raising the mass ", /*#__PURE__*/React.createElement(Eq, {
    tex: "m"
  }), " stiffens the field and slows propagation.", " ", FL_KIND_NOTE[kind]));
}