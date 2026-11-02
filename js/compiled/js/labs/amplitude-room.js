/* Compiled from js/labs/amplitude-room.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// amplitude-room.jsx — the amplitude room of the QFT module: a 2 → 2 process bench with the Mandelstam variables recomputed live, the angular
// distribution in polar form and split into its channels (S16: photon, Z and their interference; s, t and u terms), and the tree-level γ + Z energy
// scan of the cross-section and the forward-backward asymmetry beside the LEP Z-pole values. Every number is a pure function in
// js/science/electroweak.mjs or js/physics.mjs; the animation is presentation only. The JSX sources are evaluated as one script, so feyAnalyze
// from mod-qft.jsx is shared and resolved when the components render.

var QFT_M_E = 0.51099895e-3; // GeV — electron rest energy (CODATA)

var QFT_PROCESSES = [{
  id: "s-channel",
  name: "e⁺e⁻ → μ⁺μ⁻",
  nameTex: "e^+e^-\\to\\mu^+\\mu^-",
  angleTex: "\\cos\\theta\\ (\\mu^-)",
  sub: "γ + Z exchange",
  "in": ["e-", "e+"],
  out: ["mu-", "mu+"],
  masses: [0, 0, 0, 0],
  angleLabel: "cos θ (μ⁻)",
  shapeLabel: "$A_0(1+\\cos^2\\theta)+A_1\\cos\\theta$",
  shapeTex: "\\dfrac{d\\sigma}{d\\cos\\theta} = \\dfrac{\\pi\\alpha^2}{2s}\\left[A_0(1+\\cos^2\\theta) + A_1\\cos\\theta\\right]",
  ref: "Peskin & Schroeder, An Introduction to QFT, §5.1; PDG 2026 electroweak review; LEP/SLD, Phys. Rep. 427 (2006)",
  note: "Tree level, massless fermions. A₀ and A₁ carry the photon, the Z and their interference; at √s ≪ M_Z they reduce to the pure-QED 1 + cos²θ."
}, {
  id: "bhabha",
  name: "e⁺e⁻ → e⁺e⁻",
  nameTex: "e^+e^-\\to e^+e^-",
  angleTex: "\\cos\\theta\\ (e^-)",
  sub: "Bhabha scattering",
  "in": ["e-", "e+"],
  out: ["e-", "e+"],
  masses: [0, 0, 0, 0],
  angleLabel: "cos θ (e⁻)",
  shapeLabel: "s, t and interference",
  shapeTex: "\\dfrac{d\\sigma}{d\\Omega} = \\dfrac{\\alpha^2}{2s}\\left[\\dfrac{s^2+u^2}{t^2} + \\dfrac{2u^2}{st} + \\dfrac{t^2+u^2}{s^2}\\right]",
  ref: "Massless QED, derived from helicity amplitudes and cross-checked in test/electroweak.test.mjs",
  note: "Photon exchange in the s and t channels. The t channel gives the Coulomb pole at small angles; the interference term is negative."
}, {
  id: "moller",
  name: "e⁻e⁻ → e⁻e⁻",
  nameTex: "e^-e^-\\to e^-e^-",
  angleTex: "\\cos\\theta\\ (e^-)",
  sub: "Møller scattering",
  "in": ["e-", "e-"],
  out: ["e-", "e-"],
  masses: [0, 0, 0, 0],
  angleLabel: "cos θ (e⁻)",
  shapeLabel: "t, u and interference",
  shapeTex: "\\dfrac{d\\sigma}{d\\Omega} = \\dfrac{\\alpha^2}{2s}\\left[\\dfrac{s^2+u^2}{t^2} + \\dfrac{2s^2}{tu} + \\dfrac{s^2+t^2}{u^2}\\right]",
  ref: "Massless QED, derived from helicity amplitudes and cross-checked in test/electroweak.test.mjs",
  note: "Identical electrons: symmetric under θ → π − θ, with a pole at both ends. The curve covers the full range of cos θ; a total cross-section integrates over half the sphere."
}, {
  id: "t-channel",
  name: "e⁻μ⁻ → e⁻μ⁻",
  nameTex: "e^-\\mu^-\\to e^-\\mu^-",
  angleTex: "\\cos\\theta\\ (e^-)",
  sub: "t-channel exchange",
  "in": ["e-", "mu-"],
  out: ["e-", "mu-"],
  masses: [0, 0, 0, 0],
  angleLabel: "cos θ (e⁻)",
  shapeLabel: "$(s^2+u^2)/t^2$",
  shapeTex: "\\dfrac{d\\sigma}{d\\Omega} = \\dfrac{\\alpha^2}{2s}\\,\\dfrac{s^2+u^2}{t^2}",
  ref: "Massless QED, derived and cross-checked in test/electroweak.test.mjs; Mott (1929) for the forward pole",
  note: "A single photon in the t channel: the complete massless result, whose small-angle limit is the Rutherford pole 1/sin⁴(θ/2)."
}, {
  id: "compton",
  name: "γe⁻ → γe⁻",
  nameTex: "\\gamma e^-\\to\\gamma e^-",
  angleTex: "\\cos\\theta\\ (\\gamma)",
  sub: "Compton scattering",
  "in": ["ph", "e-"],
  out: ["ph", "e-"],
  masses: [0, QFT_M_E, 0, QFT_M_E],
  angleLabel: "cos θ (γ)",
  shapeLabel: "Klein–Nishina",
  shapeTex: "\\dfrac{d\\sigma}{d\\Omega} = \\dfrac{\\alpha^2}{2m_e^2}\\left(\\dfrac{E'}{E}\\right)^{2}\\left[\\dfrac{E'}{E} + \\dfrac{E}{E'} - \\sin^2\\theta\\right]",
  ref: "Klein & Nishina (1929)",
  note: "x = E_γ/mₑc² is a separate lab-frame slider, decoupled from √s: tying x to a 10 GeV centre-of-mass energy would give x ≈ 2 × 10⁸ and a visually degenerate curve."
}];

/* The shape of the angular distribution of a process: the sum of its channels, or Klein–Nishina. The poles at cos θ = ±1 are sampled just inside. */
var QFT_POLE_MARGIN = 1 - 1e-6;
function qftShape(_ref) {
  var process = _ref.process,
    sqrtS = _ref.sqrtS,
    cosTheta = _ref.cosTheta,
    photonX = _ref.photonX;
  var c = Math.max(-QFT_POLE_MARGIN, Math.min(QFT_POLE_MARGIN, cosTheta));
  if (process.id === "compton") return window.QGA_PHYSICS.angularDistribution({
    process: "compton",
    cosTheta: c,
    photonX: photonX
  });
  return window.QGA_ELECTROWEAK.science.channelDecomposition(process.id, sqrtS, c).total;
}
function useQFTFontsReady() {
  var _useState = useState(false),
    _useState2 = _slicedToArray(_useState, 2),
    ready = _useState2[0],
    setReady = _useState2[1];
  useEffect(function () {
    var live = true;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (live) setReady(true);
      });
    }
    return function () {
      live = false;
    };
  }, []);
  return ready;
}

/* DPR-aware canvas sizing. `draw(ctx, w, h)` receives CSS-pixel dimensions. */
function useQFTCanvas(draw, deps) {
  var ref = useRef(null);
  useEffect(function () {
    var cv = ref.current;
    if (!cv) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = cv.clientWidth,
      h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    var ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h);
  }, deps);
  return ref;
}

/* Readout card. `formula` stays the plain-text caption for callers that pass
   prose; `formulaTex` carries the governing relation as KaTeX, and `note` keeps
   a prose gloss that would otherwise have to be crammed into the TeX. */
function QFTReadout(_ref2) {
  var label = _ref2.label,
    labelTex = _ref2.labelTex,
    value = _ref2.value,
    unit = _ref2.unit,
    formula = _ref2.formula,
    formulaTex = _ref2.formulaTex,
    note = _ref2.note,
    lead = _ref2.lead;
  return /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout" + (lead ? " lead" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-label"
  }, labelTex ? /*#__PURE__*/React.createElement(Eq, {
    tex: labelTex
  }) : label), /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-value"
  }, value, unit ? /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, unit) : null), formulaTex ? /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: formulaTex
  })) : formula ? /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-formula"
  }, formula) : null, note ? /*#__PURE__*/React.createElement("div", {
    className: "kerr-readout-note"
  }, note) : null);
}

/* Scattering plane: the dσ/dΩ envelope drawn in polar coordinates, with the
   two incoming packets converging on the vertex and the outgoing pair
   receding at ±θ. */
function QFTScatterCanvas(_ref3) {
  var process = _ref3.process,
    sqrtS = _ref3.sqrtS,
    cosTheta = _ref3.cosTheta,
    photonX = _ref3.photonX,
    tau = _ref3.tau,
    fontsReady = _ref3.fontsReady;
  var ref = useQFTCanvas(function (ctx, w, h) {
    var cx = w * 0.5,
      cy = h * 0.5;
    var R = Math.min(w * 0.40, h * 0.42);
    var shape = function shape(c) {
      return qftShape({
        process: process,
        sqrtS: sqrtS,
        cosTheta: c,
        photonX: photonX
      });
    };
    var s90 = shape(0) || 1;
    var maxRatio = 0;
    for (var i = 0; i <= 180; i++) maxRatio = Math.max(maxRatio, shape(-1 + 2 * i / 180) / s90);
    var rMax = Math.min(6, maxRatio);
    var radius = function radius(c) {
      return R * Math.min(6, shape(c) / s90) / rMax;
    };
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.10);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.06);
    for (var _i = 0, _arr = [0.5, 0.75]; _i < _arr.length; _i++) {
      var f = _arr[_i];
      ctx.beginPath();
      ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.28);
    ctx.beginPath();
    ctx.moveTo(cx - R * 1.18, cy);
    ctx.lineTo(cx + R * 1.18, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.22);
    for (var _i2 = -3; _i2 <= 3; _i2++) {
      if (_i2 === 0) continue;
      var tx = cx + R * 1.18 * _i2 / 3;
      ctx.beginPath();
      ctx.moveTo(tx, cy - 3);
      ctx.lineTo(tx, cy + 3);
      ctx.stroke();
    }
    ctx.beginPath();
    for (var _i3 = 0; _i3 <= 360; _i3++) {
      var a = _i3 / 360 * Math.PI * 2;
      var r = radius(Math.cos(a));
      var x = cx + r * Math.cos(a),
        y = cy - r * Math.sin(a);
      if (_i3 === 0) ctx.moveTo(x, y);else ctx.lineTo(x, y);
    }
    ctx.closePath();
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    grad.addColorStop(0, QGA_TOKENS.alpha("pigment-azure-76", 0.20));
    grad.addColorStop(1, QGA_TOKENS.alpha("pigment-violet-59", 0.05));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.save();
    ctx.shadowColor = QGA_TOKENS.alpha("pigment-azure-80-c11", 0.6);
    ctx.shadowBlur = 9;
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-azure-80-c11", 0.6);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
    var L = R * 1.05;
    var th = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
    var pr = Math.max(5, R * 0.075);
    var blob = function blob(x, y, tint) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, pr);
      g.addColorStop(0, QGA_TOKENS.alpha(tint, 0.95));
      g.addColorStop(0.45, QGA_TOKENS.alpha(tint, 0.35));
      g.addColorStop(1, QGA_TOKENS.alpha(tint, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, pr, 0, Math.PI * 2);
      ctx.fill();
    };
    if (tau <= 0.5) {
      var _f = 1 - tau / 0.5;
      blob(cx - L * _f, cy, "pigment-azure-80-c11");
      blob(cx + L * _f, cy, "pigment-red-78");
    } else {
      var g = (tau - 0.5) / 0.5;
      blob(cx + L * g * Math.cos(th), cy - L * g * Math.sin(th), "pigment-azure-80-c11");
      blob(cx - L * g * Math.cos(th), cy + L * g * Math.sin(th), "pigment-red-78");
    }
    var flash = Math.max(0, 1 - Math.abs(tau - 0.5) / 0.14);
    if (flash > 0.01) {
      var _g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.5 * flash);
      _g.addColorStop(0, QGA_TOKENS.alpha("pigment-amber-94-c07", 0.85 * flash));
      _g.addColorStop(1, QGA_TOKENS.alpha("pigment-amber-86-c14", 0));
      ctx.fillStyle = _g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.5 * flash, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = QGA_TOKENS.alpha("pigment-amber-89", 0.75);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.34, 0, -th, true);
    ctx.stroke();
    ctx.font = QGA_TOKENS.monoPx(10);
    ctx.fillStyle = QGA_TOKENS.alpha("pigment-amber-89", 0.9);
    ctx.fillText("θ = " + (th * 180 / Math.PI).toFixed(0) + "°", cx + R * 0.44 * Math.cos(th / 2) - 14, cy - R * 0.44 * Math.sin(th / 2) + 3);
    ctx.font = QGA_TOKENS.monoPx(10);
    ctx.fillStyle = QGA_TOKENS.alpha("pigment-blue-75-c08", 0.55);
    ctx.fillText("incoming", 8, cy - 8);
    ctx.fillText("forward", cx + R * 1.18 - 42, cy - 8);
    ctx.fillStyle = QGA_TOKENS.alpha("pigment-azure-80-c11", 0.5);
    ctx.fillText("dσ/dΩ", 8, 14);
  }, [process.id, sqrtS, cosTheta, photonX, tau, fontsReady]);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    className: "qft-scatter",
    "aria-label": "Scattering plane: polar angular cross-section envelope with animated wave packets"
  });
}

/* Spacetime picture: the two incoming packets converge along the beam axis,
   meet at τ = 0.5, and the outgoing pair recedes with longitudinal speed
   cos θ. The fringe pattern is the superposition of the two carrier waves. */
function QFTWaterfall(_ref4) {
  var cosTheta = _ref4.cosTheta,
    tau = _ref4.tau;
  var spec = useMemo(function () {
    return window.QGA_FIGURE.plots.qft.waterfallSpec({
      cosTheta: cosTheta,
      tau: tau
    });
  }, [cosTheta, tau]);
  return /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  });
}

/* Angular distribution, normalised to its 90° value, split into its channels where the process has them: thin lines for the terms and the
   total as the focal line. Compton keeps the single Klein–Nishina curve. The y axis is clipped so the forward poles stay on screen. */
function QFTAngularPlot(_ref5) {
  var process = _ref5.process,
    sqrtS = _ref5.sqrtS,
    cosTheta = _ref5.cosTheta,
    photonX = _ref5.photonX;
  var spec = useMemo(function () {
    return process.id === "compton" ? window.QGA_FIGURE.plots.qft.angularSpec({
      process: process,
      cosTheta: cosTheta,
      photonX: photonX
    }) : window.QGA_FIGURE.plots.electroweak.channelsSpec({
      processId: process.id,
      name: process.name,
      sqrtS: sqrtS,
      cosTheta: cosTheta
    });
  }, [process.id, sqrtS, cosTheta, photonX]);
  return /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  });
}

/* The tree-level γ + Z energy scan of e⁺e⁻ → μ⁺μ⁻ from 10 to 200 GeV: the cross-section (log axis) and the forward-backward asymmetry stacked
   over one shared energy axis, with the LEP Z-pole values on the data layer. */
function QFTResonancePlot(_ref6) {
  var sqrtS = _ref6.sqrtS;
  var sigma = useMemo(function () {
    return window.QGA_FIGURE.plots.electroweak.crossSectionSpec({
      sqrtS: sqrtS
    });
  }, [sqrtS]);
  var asymmetry = useMemo(function () {
    return window.QGA_FIGURE.plots.electroweak.asymmetrySpec({
      sqrtS: sqrtS
    });
  }, [sqrtS]);
  return /*#__PURE__*/React.createElement("div", {
    className: "qft-stack"
  }, /*#__PURE__*/React.createElement(Figure, {
    spec: sigma
  }), /*#__PURE__*/React.createElement(Figure, {
    spec: asymmetry
  }));
}
function AmplitudeRoom() {
  var _useQGAState = useQGAState(),
    _useQGAState2 = _slicedToArray(_useQGAState, 2),
    atlasState = _useQGAState2[0],
    setAtlasState = _useQGAState2[1];
  var processId = atlasState.qftProcess;
  var process = QFT_PROCESSES.find(function (p) {
    return p.id === processId;
  }) || QFT_PROCESSES[0];
  var sqrtS = atlasState.qftSqrtS;
  var cosTheta = atlasState.qftAngle;
  var photonX = atlasState.qftPhotonX;
  var fontsReady = useQFTFontsReady();

  /* Presentation-only clock over a normalised τ ∈ [0, 1]. The physics
     readouts below do not depend on it. */
  var _useState3 = useState(0),
    _useState4 = _slicedToArray(_useState3, 2),
    tau = _useState4[0],
    setTau = _useState4[1];
  var _useState5 = useState(false),
    _useState6 = _slicedToArray(_useState5, 2),
    playing = _useState6[0],
    setPlaying = _useState6[1];
  var _useState7 = useState(1),
    _useState8 = _slicedToArray(_useState7, 2),
    speed = _useState8[0],
    setSpeed = _useState8[1];
  var reducedMotion = useMemo(function () {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  useEffect(function () {
    if (!playing) return undefined;
    var raf = 0,
      last = performance.now();
    var _tick = function tick(now) {
      var dt = (now - last) / 1000;
      last = now;
      setTau(function (t) {
        return Math.min(1, t + dt * speed * 0.5);
      });
      raf = requestAnimationFrame(_tick);
    };
    raf = requestAnimationFrame(_tick);
    return function () {
      return cancelAnimationFrame(raf);
    };
  }, [playing, speed]);
  useEffect(function () {
    if (playing && tau >= 1) setPlaying(false);
  }, [tau, playing]);
  useEffect(function () {
    setTau(0);
    setPlaying(!reducedMotion);
  }, [processId, reducedMotion]);
  var togglePlay = function togglePlay() {
    if (!playing && tau >= 1) setTau(0);
    setPlaying(!playing);
  };
  var kin = window.QGA_PHYSICS.mandelstamKinematics({
    sqrtS: sqrtS,
    cosTheta: cosTheta,
    masses: process.masses
  });
  var EW = window.QGA_ELECTROWEAK.science;
  var sigma = EW.totalCrossSection(sqrtS);
  var asymmetry = EW.forwardBackwardAsymmetry(sqrtS);
  var shapeNow = qftShape({
    process: process,
    sqrtS: sqrtS,
    cosTheta: cosTheta,
    photonX: photonX
  });
  var shape90 = qftShape({
    process: process,
    sqrtS: sqrtS,
    cosTheta: 0,
    photonX: photonX
  });
  var verdict = feyAnalyze(process["in"][0], process["in"][1], process.out[0], process.out[1]);
  var identityOk = Math.abs(kin.residual) < 1e-6;
  var phase = tau < 0.46 ? "incoming" : tau > 0.54 ? "outgoing" : "interaction";
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame qft-room"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-observatory-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-head-plate"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-head-ident"
  }, "QFT", /*#__PURE__*/React.createElement("span", null, "AMP")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "The Amplitude Room"), /*#__PURE__*/React.createElement("p", null, "A live 2 \u2192 2 scattering bench: Mandelstam kinematics, angular distributions split into their channels, and the photon + Z energy scan, evaluated from the pure functions in ", /*#__PURE__*/React.createElement("code", null, "js/science/electroweak.mjs"), "."))), /*#__PURE__*/React.createElement("div", {
    className: "kerr-head-state"
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-effective"
  }, "Tree level, photon + Z"), /*#__PURE__*/React.createElement("div", {
    className: "kerr-state-line"
  }, process.name, " \xB7 ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\sqrt{s}"
  }), " = ", sqrtS.toFixed(1), " GeV \xB7 ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\cos\\theta"
  }), " = ", cosTheta.toFixed(2)), /*#__PURE__*/React.createElement("div", {
    className: "kerr-state-line"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "\\sigma(\\mu^+\\mu^-)"
  }), " = ", sigma.toFixed(4), " nb \xB7 ", verdict.ok ? verdict.channels.join(" + ") + "-channel" : "forbidden", " \xB7 ", phase))), /*#__PURE__*/React.createElement("div", {
    className: "kerr-instrument-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    "aria-label": "Process"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-control-label"
  }, "Process"), QFT_PROCESSES.map(function (p) {
    return /*#__PURE__*/React.createElement("button", {
      key: p.id,
      className: "kerr-chip" + (p.id === process.id ? " on" : ""),
      "aria-pressed": p.id === process.id,
      onClick: function onClick() {
        return setAtlasState({
          qftProcess: p.id
        });
      }
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: p.nameTex
    }));
  })), /*#__PURE__*/React.createElement("div", {
    className: "kerr-control-group",
    "aria-label": "Kinematic controls"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "\u221As",
    labelTex: "\\sqrt{s}",
    min: 1,
    max: 200,
    step: 0.5,
    value: sqrtS,
    onChange: function onChange(v) {
      return setAtlasState({
        qftSqrtS: v
      });
    },
    format: function format(v) {
      return v.toFixed(1) + " GeV";
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: process.angleLabel,
    labelTex: process.angleTex,
    min: -1,
    max: 1,
    step: 0.01,
    value: cosTheta,
    onChange: function onChange(v) {
      return setAtlasState({
        qftAngle: v
      });
    },
    format: function format(v) {
      return v.toFixed(2);
    }
  }), process.id === "compton" ? /*#__PURE__*/React.createElement(SliderRow, {
    label: "x = E_\u03B3/m\u2091c\xB2",
    labelTex: "x=E_\\gamma/m_ec^2",
    min: 0.05,
    max: 20,
    step: 0.05,
    value: photonX,
    onChange: function onChange(v) {
      return setAtlasState({
        qftPhotonX: v
      });
    },
    format: function format(v) {
      return v.toFixed(2);
    }
  }) : null)), /*#__PURE__*/React.createElement("div", {
    className: "qft-transport-strip"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qft-transport-label"
  }, "Collision clock"), /*#__PURE__*/React.createElement("div", {
    className: "gw-transport",
    "aria-label": "Collision playback transport"
  }, /*#__PURE__*/React.createElement("button", {
    className: "gw-play-btn",
    onClick: togglePlay,
    "aria-label": playing ? "Pause collision" : "Play collision"
  }, playing ? "❚❚" : "▶"), /*#__PURE__*/React.createElement("button", {
    className: "gw-replay-btn",
    onClick: function onClick() {
      setTau(0);
      setPlaying(!reducedMotion);
    },
    "aria-label": "Replay from the start"
  }, "\u21BA"), /*#__PURE__*/React.createElement("div", {
    className: "gw-progress",
    role: "slider",
    "aria-label": "Collision phase",
    "aria-valuemin": 0,
    "aria-valuemax": 1,
    "aria-valuenow": Number(tau.toFixed(3)),
    onPointerDown: function onPointerDown(e) {
      e.currentTarget.setPointerCapture(e.pointerId);
      var r = e.currentTarget.getBoundingClientRect();
      setTau(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    },
    onPointerMove: function onPointerMove(e) {
      if (!(e.buttons & 1)) return;
      var r = e.currentTarget.getBoundingClientRect();
      setTau(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "gw-progress-fill",
    style: {
      width: 100 * tau + "%"
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "gw-time"
  }, "\u03C4 = ", tau.toFixed(2)), /*#__PURE__*/React.createElement("div", {
    className: "gw-speed",
    "aria-label": "Playback speed"
  }, [0.5, 1, 2, 4].map(function (s) {
    return /*#__PURE__*/React.createElement("button", {
      key: s,
      className: "kerr-chip" + (speed === s ? " on" : ""),
      "aria-pressed": speed === s,
      onClick: function onClick() {
        return setSpeed(s);
      }
    }, s, "\xD7");
  }))), /*#__PURE__*/React.createElement("span", {
    className: "qft-phase-chip"
  }, phase)), /*#__PURE__*/React.createElement("div", {
    className: "qft-stage"
  }, /*#__PURE__*/React.createElement("figure", {
    className: "qft-panel"
  }, /*#__PURE__*/React.createElement("header", {
    className: "qft-panel-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "qft-panel-title"
  }, "Scattering plane"), /*#__PURE__*/React.createElement("span", {
    className: "qft-panel-note"
  }, "d\u03C3/d\u03A9 envelope \xB7 ", /*#__PURE__*/React.createElement(RichText, {
    text: process.shapeLabel
  }))), /*#__PURE__*/React.createElement("div", {
    className: "qft-panel-body"
  }, /*#__PURE__*/React.createElement(QFTScatterCanvas, {
    process: process,
    sqrtS: sqrtS,
    cosTheta: cosTheta,
    photonX: photonX,
    tau: tau,
    fontsReady: fontsReady
  }))), /*#__PURE__*/React.createElement(QFTWaterfall, {
    cosTheta: cosTheta,
    tau: tau
  })), /*#__PURE__*/React.createElement("div", {
    className: "qft-plots"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "qft-formula"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: process.shapeTex,
    display: true
  })), /*#__PURE__*/React.createElement(QFTAngularPlot, {
    process: process,
    sqrtS: sqrtS,
    cosTheta: cosTheta,
    photonX: photonX
  })), /*#__PURE__*/React.createElement(QFTResonancePlot, {
    sqrtS: sqrtS
  })), /*#__PURE__*/React.createElement("div", {
    className: "kerr-deck"
  }, /*#__PURE__*/React.createElement("section", {
    className: "kerr-rgroup"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("h4", null, "Mandelstam kinematics"), /*#__PURE__*/React.createElement("span", null, "natural units \xB7 GeV\xB2")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-rgrid"
  }, /*#__PURE__*/React.createElement(QFTReadout, {
    lead: true,
    labelTex: "\\sqrt{s}",
    value: sqrtS.toFixed(1),
    unit: "GeV",
    formula: "centre-of-mass energy"
  }), /*#__PURE__*/React.createElement(QFTReadout, {
    labelTex: "s",
    value: kin.s.toFixed(2),
    unit: "GeV\xB2",
    formulaTex: "s = (p_1 + p_2)^2"
  }), /*#__PURE__*/React.createElement(QFTReadout, {
    labelTex: "t",
    value: kin.t.toFixed(2),
    unit: "GeV\xB2",
    formulaTex: "t = m_1^2 + m_3^2 - 2E_1E_3 + 2p_1p_3\\cos\\theta"
  }), /*#__PURE__*/React.createElement(QFTReadout, {
    labelTex: "u",
    value: kin.u.toFixed(2),
    unit: "GeV\xB2",
    formulaTex: "u = m_1^2 + m_4^2 - 2E_1E_4 - 2p_1p_3\\cos\\theta"
  }), /*#__PURE__*/React.createElement(QFTReadout, {
    labelTex: "\\sum m_i^2",
    value: kin.sum.toFixed(4),
    unit: "GeV\xB2",
    formulaTex: "\\Sigma\\, m_i^2 = m_1^2 + m_2^2 + m_3^2 + m_4^2"
  }), /*#__PURE__*/React.createElement(QFTReadout, {
    labelTex: "s+t+u-\\sum m_i^2",
    value: kin.residual.toExponential(1),
    unit: "GeV\xB2",
    formula: "exact identity \u2014 residual is floating-point noise"
  }))), /*#__PURE__*/React.createElement("section", {
    className: "kerr-rgroup"
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("h4", null, "Observables"), /*#__PURE__*/React.createElement("span", null, "tree level")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-rgrid"
  }, /*#__PURE__*/React.createElement(QFTReadout, {
    lead: true,
    labelTex: "\\sigma(\\mu^+\\mu^-)",
    value: sigma.toFixed(4),
    unit: "nb",
    formulaTex: "\\sigma = \\dfrac{4\\pi\\alpha^2}{3s}A_0",
    note: "photon + Z, tree level"
  }), /*#__PURE__*/React.createElement(QFTReadout, {
    labelTex: "A_{\\mathrm{FB}}",
    value: asymmetry.toFixed(4),
    formulaTex: "A_{\\mathrm{FB}} = \\dfrac{3A_1}{8A_0}",
    note: "zero where the photon\u2013Z interference cancels"
  }), /*#__PURE__*/React.createElement(QFTReadout, {
    labelTex: "\\mathrm{shape\\ at}\\ \\cos\\theta",
    value: (shapeNow / shape90).toFixed(3),
    unit: "\xD7 90\xB0",
    formulaTex: process.shapeTex
  }), process.id === "compton" ? /*#__PURE__*/React.createElement(QFTReadout, {
    label: "photon energy ratio",
    value: photonX.toFixed(2),
    unit: "\xD7 m\u2091c\xB2",
    formulaTex: "x = E_\\gamma / m_e c^2",
    note: "lab frame"
  }) : /*#__PURE__*/React.createElement(QFTReadout, {
    labelTex: "\\mathrm{beam\\ energy}\\ E_1",
    value: kin.E1.toFixed(2),
    unit: "GeV",
    formula: "centre-of-mass frame"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "qft-identity"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kerr-check " + (identityOk ? "ok" : "bad")
  }, identityOk ? "s + t + u = Σmᵢ² ✓" : "identity residual " + kin.residual.toExponential(1)), /*#__PURE__*/React.createElement("span", {
    className: "kerr-check " + (verdict.ok ? "ok" : "bad")
  }, verdict.ok ? "conservation laws satisfied" : "forbidden process"), /*#__PURE__*/React.createElement("span", {
    className: "qft-identity-note"
  }, verdict.ok ? verdict.note : verdict.reason)), /*#__PURE__*/React.createElement("details", {
    className: "kerr-validity"
  }, /*#__PURE__*/React.createElement("summary", null, /*#__PURE__*/React.createElement("span", null, "Assumptions, validity & uncertainty"), /*#__PURE__*/React.createElement("span", {
    className: "kerr-check ok"
  }, "tree level \xB7 closed forms")), /*#__PURE__*/React.createElement("div", {
    className: "kerr-validity-body"
  }, /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("dt", null, "What is exact"), /*#__PURE__*/React.createElement("dd", null, "The Mandelstam identity ", /*#__PURE__*/React.createElement(Eq, {
    tex: "s + t + u = \\sum_i m_i^2"
  }), ", the tree-level ", /*#__PURE__*/React.createElement(Eq, {
    tex: "e^+e^-\\to\\mu^+\\mu^-"
  }), " cross-section with its photon, ", /*#__PURE__*/React.createElement(Eq, {
    tex: "Z"
  }), " and interference terms, the complete massless Bhabha, M\xF8ller and electron\u2013muon distributions, and the Klein\u2013Nishina shape are closed-form results of the lowest order in the couplings. They are evaluated live by ", /*#__PURE__*/React.createElement("code", null, "js/science/electroweak.mjs"), "and ", /*#__PURE__*/React.createElement("code", null, "js/physics.mjs"), ", and covered by ", /*#__PURE__*/React.createElement("code", null, "node:test"), " cases: the ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\gamma+Z"
  }), " form against an independent helicity-amplitude sum, the QED limit ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\sigma = 4\\pi\\alpha^2/3s"
  }), ", the Rutherford limit of the poles and the", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\theta\\to\\pi-\\theta"
  }), " symmetry of M\xF8ller scattering."), /*#__PURE__*/React.createElement("dt", null, "What is approximate"), /*#__PURE__*/React.createElement("dd", null, "Tree level only: no initial-state radiation, which at LEP lowers and broadens the Z peak by about a third, no loop corrections and a constant Z width. ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\alpha"
  }), " is fixed at its Z-scale value for ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\gamma+Z"
  }), " and does not run below the Z, so the 10 GeV cross-section is about 13 percent higher than with ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\alpha(0)"
  }), ". The LEP points are Z-pole pseudo-observables, deconvoluted for radiation, and are compared with the model only at the pole. Fermion masses are zero except in the Compton process. The Bhabha and M\xF8ller formulas were derived here and checked against each other, not copied from a printed source."), /*#__PURE__*/React.createElement("dt", null, "What is schematic"), /*#__PURE__*/React.createElement("dd", null, "The scattering-plane and spacetime canvases are pedagogical animations. The wave packets are Gaussian envelopes with a carrier wave, not solutions of the QED amplitude; the envelope radius is the angular distribution normalised to its 90\xB0 value and clipped at 6\xD7. The spacetime panel's longitudinal separation tracks cos \u03B8, which is the correct kinematic trend, but the fringe pattern is a two-packet superposition rather than a field-theory calculation."), /*#__PURE__*/React.createElement("dt", null, "References"), /*#__PURE__*/React.createElement("dd", null, process.ref, ". Mandelstam variables: Mandelstam (1958). Klein\u2013Nishina: Klein & Nishina (1929). Inputs (PDG 2026): ", /*#__PURE__*/React.createElement(Eq, {
    tex: "M_Z = 91.1879\\ \\mathrm{GeV}"
  }), ", ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\Gamma_Z = 2.4955\\ \\mathrm{GeV}"
  }), ",", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\sin^2\\theta_W = 0.23122"
  }), " (", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\overline{\\mathrm{MS}}"
  }), "). Fine-structure constant:", /*#__PURE__*/React.createElement(Eq, {
    tex: "1/\\alpha = 128.945"
  }), " at the Z scale (LEP Electroweak Working Group, Phys. Rep. 427, \xA71) for ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\gamma+Z"
  }), ", CODATA", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\alpha = 1/137.035999084"
  }), " for the QED processes. LEP/SLD pole values: Phys. Rep. 427 (2006), doi:10.1016/j.physrep.2005.12.006, Table 2.13."), /*#__PURE__*/React.createElement("dt", null, "Units"), /*#__PURE__*/React.createElement("dd", null, "Natural units ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\hbar = c = 1"
  }), ". Energies in GeV, cross-sections in nanobarns (", /*#__PURE__*/React.createElement(Eq, {
    tex: "1\\ \\mathrm{GeV}^{-2} = 3.8938\\times10^{5}\\ \\mathrm{nb}"
  }), "). The Compton slider", /*#__PURE__*/React.createElement(Eq, {
    tex: "x"
  }), " is a lab-frame ratio and is deliberately decoupled from ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\sqrt{s}"
  }), ".")))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "qft-scattering-explorer",
    status: "schematic"
  }, "The readouts and curves are tree-level results, with the LEP Z-pole values marked on the energy scan; the two canvases are a schematic animation of the same process. Drag the transport to scrub the collision, or change the energy and the angle to watch the Mandelstam variables, the channels of the angular distribution and the scan respond. Every value is a pure function of the sliders \u2014 the animation adds no physics of its own."));
}