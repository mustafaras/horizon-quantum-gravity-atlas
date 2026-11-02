/* Compiled from js/labs/kerr-shadow-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
// S25: the shadow's critical curve, compared with what the EHT actually measured.
function KerrShadowLab() {
  var _E$EHT_COMPARISONS$fi, _row$source$reference, _row$source$reference2;
  var K = window.QGA_KERR_SHADOW;
  var E = window.QGA_EHT;
  var _useState = useState(0),
    _useState2 = _slicedToArray(_useState, 2),
    spin = _useState2[0],
    setSpin = _useState2[1];
  var _useState3 = useState(90),
    _useState4 = _slicedToArray(_useState3, 2),
    inclination = _useState4[0],
    setInclination = _useState4[1];
  var _useState5 = useState("m87"),
    _useState6 = _slicedToArray(_useState5, 2),
    target = _useState6[0],
    setTarget = _useState6[1];
  var bardeen = useMemo(function () {
    return window.QGA_FIGURE.plots.kerrShadow.bardeenSpec({
      a: spin,
      inclinationDeg: inclination
    });
  }, [spin, inclination]);
  var comparison = useMemo(function () {
    return window.QGA_FIGURE.plots.kerrShadow.ehtComparisonSpec();
  }, []);
  var row = (_E$EHT_COMPARISONS$fi = E.EHT_COMPARISONS.find(function (c) {
    return c.id === target;
  })) !== null && _E$EHT_COMPARISONS$fi !== void 0 ? _E$EHT_COMPARISONS$fi : E.EHT_COMPARISONS[0];
  var curve = useMemo(function () {
    return K.criticalCurve({
      a: spin,
      inclinationDeg: inclination,
      samples: 240,
      M: 1
    });
  }, [spin, inclination]);
  var width = Math.max.apply(Math, _toConsumableArray(curve.alpha)) - Math.min.apply(Math, _toConsumableArray(curve.alpha));
  var height = 2 * Math.max.apply(Math, _toConsumableArray(curve.beta.map(Math.abs)));
  var flattening = height > 0 ? Math.max(width / height, height / width) : 1;
  var subring = K.firstSubringFraction({
    a: spin
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame kerr-shadow-lab",
    id: "bh-kerr-shadow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "spin a*",
    min: 0,
    max: 0.998,
    step: 0.001,
    value: spin,
    onChange: setSpin,
    format: function format(v) {
      return v.toFixed(3);
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "inclination",
    min: 5,
    max: 90,
    step: 1,
    value: inclination,
    onChange: setInclination,
    format: function format(v) {
      return v + "\xB0";
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "kerr-shadow-grid"
  }, /*#__PURE__*/React.createElement(Figure, {
    spec: bardeen
  }), /*#__PURE__*/React.createElement("div", {
    className: "kerr-shadow-readouts",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "shadow width / height"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, flattening.toFixed(3)), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, flattening > 1.05 ? "flattened on the prograde edge" : flattening > 1.01 ? "slightly flattened" : "very nearly circular")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "alpha range"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, width.toFixed(2), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "M")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, Math.min.apply(Math, _toConsumableArray(curve.alpha)).toFixed(2), " to ", Math.max.apply(Math, _toConsumableArray(curve.alpha)).toFixed(2), " M")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "n = 1 sub-ring"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, (100 * subring).toFixed(2), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "%")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "each half orbit demagnifies by e^(-gamma); gamma = pi at a = 0")))), /*#__PURE__*/React.createElement("div", {
    className: "kerr-eht-block"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kerr-eht-head"
  }, /*#__PURE__*/React.createElement("h3", null, "The shadow, measured"), /*#__PURE__*/React.createElement("span", {
    className: "seg",
    role: "group",
    "aria-label": "EHT target"
  }, E.EHT_TARGETS.map(function (t) {
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      type: "button",
      className: "btn" + (t.id === target ? " on" : ""),
      "aria-pressed": t.id === target,
      onClick: function onClick() {
        return setTarget(t.id);
      }
    }, t.label);
  }))), /*#__PURE__*/React.createElement(Figure, {
    spec: comparison
  }), /*#__PURE__*/React.createElement("div", {
    className: "readout-grid kerr-eht-readouts",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "measured ring"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, row.measuredUas, /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "\xB1 ", row.sigmaUas, " \xB5as")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, row.label, ", from the EHT paper cited below")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "predicted shadow"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, row.predictedUas.toFixed(2), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "\xB5as")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "2\u221A27 GM/(c\xB2D) with M = ", row.massSolar.toExponential(1), " M\u2609")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "difference"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, row.differencePercent >= 0 ? "+" : "", row.differencePercent.toFixed(1), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "%")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "the ring is calibrated to the shadow, so this is a ~10 % comparison"))), /*#__PURE__*/React.createElement("p", {
    className: "kerr-eht-note"
  }, row.note, " ", /*#__PURE__*/React.createElement("a", {
    href: (_row$source$reference = (_row$source$reference2 = row.source.reference.match(/https:\/\/[^\s,;]+/)) === null || _row$source$reference2 === void 0 ? void 0 : _row$source$reference2[0]) !== null && _row$source$reference !== void 0 ? _row$source$reference : "#",
    target: "_blank",
    rel: "noreferrer"
  }, row.source.reference.split(",")[0], " \u2197"))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "bh-kerr-shadow",
    status: "effective"
  }, "The boundary of the shadow is the set of spherical photon orbits, drawn in the observer's sky as", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\alpha=-\\xi/\\sin\\theta_o"
  }), " and ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\beta=\\pm\\sqrt{\\eta+a^2\\cos^2\\theta_o-\\xi^2\\cot^2\\theta_o}"
  }), ". At zero spin it is the circle of radius ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\sqrt{27}\\,M=5.196\\,M"
  }), "; as the hole spins up the prograde edge is dragged inward and the shadow flattens. Each half orbit around the photon sphere demagnifies the image by ", /*#__PURE__*/React.createElement(Eq, {
    tex: "e^{-\\gamma}"
  }), " (", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\gamma=\\pi"
  }), " for Schwarzschild), which is why the photon sub-rings are so faint \u2014 they are predicted, not observed. The EHT ring is compared through a modelling factor, so the agreement is quoted at the ~10 % level."));
}