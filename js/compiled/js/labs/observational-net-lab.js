/* Compiled from js/labs/observational-net-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// S28: the four prose panels become four computed figures.
function ObservationalNetLab() {
  var O = window.QGA_OBSERVATIONAL_NET;
  var _useState = useState(1),
    _useState2 = _slicedToArray(_useState, 2),
    eQg = _useState2[0],
    setEQg = _useState2[1];
  var _useState3 = useState(0.903),
    _useState4 = _slicedToArray(_useState3, 2),
    redshift = _useState4[0],
    setRedshift = _useState4[1];
  var delaySpec = useMemo(function () {
    return window.QGA_FIGURE.plots.observationalNet.lorentzDelaySpec();
  }, []);
  var tensorSpec = useMemo(function () {
    return window.QGA_FIGURE.plots.observationalNet.tensorScalarSpec();
  }, []);
  var shortSpec = useMemo(function () {
    return window.QGA_FIGURE.plots.observationalNet.shortRangeSpec();
  }, []);
  var delay = O.timeDelay({
    energy1GeV: 31,
    redshift: redshift,
    eQgGeV: eQg * O.PLANCK_ENERGY_GEV
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame obs-net",
    id: "exp-observational-net"
  }, /*#__PURE__*/React.createElement("div", {
    className: "obs-net-grid"
  }, /*#__PURE__*/React.createElement("section", {
    className: "obs-net-cell"
  }, /*#__PURE__*/React.createElement("h3", null, "Lorentz violation"), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar obs-net-controls"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "E_QG / E_Planck",
    min: 1,
    max: 20,
    step: 0.5,
    value: eQg,
    onChange: setEQg,
    format: function format(v) {
      return v.toFixed(1);
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "source redshift",
    min: 0.1,
    max: 3,
    step: 0.01,
    value: redshift,
    onChange: setRedshift,
    format: function format(v) {
      return v.toFixed(2);
    }
  })), /*#__PURE__*/React.createElement(Figure, {
    spec: delaySpec
  }), /*#__PURE__*/React.createElement("div", {
    className: "readout-grid obs-net-readouts",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "31 GeV delay at z = ", redshift.toFixed(2)), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, delay.toFixed(2), /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "s")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "E_QG = ", eQg.toFixed(1), " E_Planck; the bound excludes anything under 1.19")))), /*#__PURE__*/React.createElement("section", {
    className: "obs-net-cell"
  }, /*#__PURE__*/React.createElement("h3", null, "Inflationary tensors"), /*#__PURE__*/React.createElement(Figure, {
    spec: tensorSpec
  })), /*#__PURE__*/React.createElement("section", {
    className: "obs-net-cell"
  }, /*#__PURE__*/React.createElement("h3", null, "Short-range gravity"), /*#__PURE__*/React.createElement(Figure, {
    spec: shortSpec
  })), /*#__PURE__*/React.createElement("section", {
    className: "obs-net-cell"
  }, /*#__PURE__*/React.createElement("h3", null, "Horizon-scale imaging"), /*#__PURE__*/React.createElement("p", {
    className: "obs-net-note"
  }, "The Event Horizon Telescope resolves structure at the photon-ring scale of M87* and Sgr A*. The size comparison with the predicted shadow is computed in the black-hole module, where the critical curve lives \u2014 the panel below is the same instrument, not a copy of the numbers."), /*#__PURE__*/React.createElement("div", {
    className: "obs-net-link"
  }, /*#__PURE__*/React.createElement("a", {
    className: "btn",
    href: "?view=bh"
  }, "Open the shadow comparison \u2197")), /*#__PURE__*/React.createElement("div", {
    className: "readout-grid obs-net-readouts"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "M87* vs prediction"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, "+5.8", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "%")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "42 \xB1 3 \xB5as measured against 39.69 predicted")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "Sgr A* vs prediction"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, "+1.0", /*#__PURE__*/React.createElement("span", {
    className: "unit"
  }, "%")), /*#__PURE__*/React.createElement("div", {
    className: "readout-note"
  }, "51.8 \xB1 2.3 \xB5as against 51.29 predicted"))))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "exp-observational-net",
    status: "effective"
  }, "Four instruments, not four paragraphs. The delay curves come from", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\Delta t = \\frac{E}{E_{QG}}\\frac{1}{H_0}\\int_0^z \\frac{(1+z')dz'}{\\sqrt{\\Omega_m(1+z')^3+\\Omega_\\Lambda}}"
  }), "with the Planck 2018 cosmology; the slow-roll predictions are first-order in ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\epsilon"
  }), " and", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\eta"
  }), "; the short-range panel draws the one exclusion E\xF6t-Wash publishes rather than inventing a contour. The tensor band is a limit on ", /*#__PURE__*/React.createElement(Eq, {
    tex: "r"
  }), ", not a detection, and the Fermi bound is indirect: it depends on the burst's emission model."));
}