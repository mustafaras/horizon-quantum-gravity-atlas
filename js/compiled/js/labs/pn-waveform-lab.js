/* Compiled from js/labs/pn-waveform-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// S26: the 3.5PN inspiral and the remnant it leaves, computed rather than asserted.
function PnWaveformLab() {
  var W = window.QGA_PN_WAVEFORM;
  var _useState = useState(36),
    _useState2 = _slicedToArray(_useState, 2),
    m1 = _useState2[0],
    setM1 = _useState2[1];
  var _useState3 = useState(29),
    _useState4 = _slicedToArray(_useState3, 2),
    m2 = _useState4[0],
    setM2 = _useState4[1];
  var _useState5 = useState(23),
    _useState6 = _slicedToArray(_useState5, 2),
    inclination = _useState6[0],
    setInclination = _useState6[1];
  var run = useMemo(function () {
    return W.evolveInspiral({
      m1: m1,
      m2: m2,
      fStartHz: 30,
      maxTime: 3
    });
  }, [m1, m2]);
  var fit = useMemo(function () {
    return W.remnant({
      m1: m1,
      m2: m2
    });
  }, [m1, m2]);
  var qnm = W.ringdownHz((m1 + m2) * fit.massRatio, fit.spin, 0);
  var tau = W.ringdownTauSeconds((m1 + m2) * fit.massRatio, fit.spin, 0);
  var newtonian = W.newtonianTimeToCoalescence(30, W.chirpMassSeconds(m1, m2));
  var waveSpec = useMemo(function () {
    return window.QGA_FIGURE.plots.gwWaveform.waveformSpec({
      m1: m1,
      m2: m2,
      inclinationRad: inclination * Math.PI / 180
    });
  }, [m1, m2, inclination]);
  var freqSpec = useMemo(function () {
    return window.QGA_FIGURE.plots.gwWaveform.waveformFrequencySpec({
      m1: m1,
      m2: m2
    });
  }, [m1, m2]);
  var total = m1 + m2;
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame pn-lab",
    id: "gw-pn-waveform"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "m1 (solar masses)",
    min: 5,
    max: 60,
    step: 1,
    value: m1,
    onChange: setM1,
    format: function format(v) {
      return String(v);
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "m2 (solar masses)",
    min: 5,
    max: 60,
    step: 1,
    value: m2,
    onChange: setM2,
    format: function format(v) {
      return String(v);
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "inclination",
    min: 0,
    max: 90,
    step: 1,
    value: inclination,
    onChange: setInclination,
    format: function format(v) {
      return v + "\xB0";
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "pn-grid"
  }, /*#__PURE__*/React.createElement(Figure, {
    spec: waveSpec
  }), /*#__PURE__*/React.createElement(Figure, {
    spec: freqSpec
  })), /*#__PURE__*/React.createElement("div", {
    className: "readout-grid pn-readouts",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "coalescence from 30 Hz"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, run.coalescenceTime.toFixed(3), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "s")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "3.5PN merges ", (100 * (1 - run.coalescenceTime / newtonian)).toFixed(0), " % sooner than the Newtonian ", newtonian.toFixed(3), " s")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "remnant spin"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, fit.spin.toFixed(3)), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "from the NR fit; 0.686 at equal mass")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "remnant mass"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, (fit.massRatio * total).toFixed(1), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "M\u2609")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, (100 * fit.radiatedEnergyFraction).toFixed(2), " % of ", total, " M\u2609 radiated")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "ringdown (2,2,0)"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, qnm.toFixed(0), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "Hz")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "damping time ", (1000 * tau).toFixed(1), " ms; the old waveform used a fixed 190 Hz / 60 ms"))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "gw-pn-waveform",
    status: "effective"
  }, "The inspiralling phase is TaylorT4 at 3.5 post-Newtonian order with the Blanchet (2014) coefficients, run in", /*#__PURE__*/React.createElement(Eq, {
    tex: "x=(GM\\omega/c^3)^{2/3}"
  }), " until the Schwarzschild ISCO at ", /*#__PURE__*/React.createElement(Eq, {
    tex: "x=1/6"
  }), ". Everything after that is a fit, not a derivation: the remnant mass and spin come from the Jim\xE9nez-Forteza et al. (2017) numerical-relativity calibration, and the ringdown is the ", /*#__PURE__*/React.createElement(Eq, {
    tex: "(2,2,0)"
  }), " quasi-normal mode of that remnant from Berti, Cardoso & Will (2006). The amplitude is normalised rather than physical, and the binary is non-spinning \u2014 a spinning or eccentric system needs terms this module does not carry."));
}