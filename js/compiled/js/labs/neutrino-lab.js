/* Compiled from js/labs/neutrino-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
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
// neutrino-lab.jsx — three-flavour neutrino oscillations in constant-density matter (S12).
// The calculation is js/science/neutrino.mjs (window.QGA_NEUTRINO) and the figure is the Figure Kit flavour ribbon
// (js/figure/plots/neutrino.mjs); this file holds the controls and the readouts.

var NU_FLAVOUR_TEX = ["\\nu_e", "\\nu_\\mu", "\\nu_\\tau"];
var NU_FLAVOUR_PLAIN = ["electron", "muon", "tau"];
var NU_BASELINE_SPAN = 2.5; // the L/E axis runs to this many design L/E
var NU_DIAL_RADIUS = 52;
var NU_DIAL_STEP = 1;
var NU_DIAL_BIG_STEP = 15;
var nuPoint = function nuPoint(degrees, radius) {
  var a = degrees * Math.PI / 180;
  return [radius * Math.sin(a), -radius * Math.cos(a)];
};

/** The delta_CP dial: an engraved circle, keyboard steps of 1 degree (15 with Shift or the Page keys), drag with a pointer. */
function DeltaCpDial(_ref) {
  var value = _ref.value,
    onChange = _ref.onChange,
    band = _ref.band;
  var dragging = useRef(false);
  var clamp = function clamp(v) {
    return Math.max(0, Math.min(360, Math.round(v)));
  };
  var fromPointer = function fromPointer(event) {
    var rect = event.currentTarget.getBoundingClientRect();
    var dx = event.clientX - (rect.left + rect.width / 2),
      dy = event.clientY - (rect.top + rect.height / 2);
    var degrees = Math.atan2(dx, -dy) * 180 / Math.PI;
    onChange(clamp((degrees + 360) % 360));
  };
  var onKeyDown = function onKeyDown(event) {
    var big = event.shiftKey ? NU_DIAL_BIG_STEP : NU_DIAL_STEP;
    var moves = {
      ArrowRight: big,
      ArrowUp: big,
      ArrowLeft: -big,
      ArrowDown: -big,
      PageUp: NU_DIAL_BIG_STEP,
      PageDown: -NU_DIAL_BIG_STEP
    };
    if (event.key in moves) onChange(clamp(value + moves[event.key]));else if (event.key === "Home") onChange(0);else if (event.key === "End") onChange(360);else return;
    event.preventDefault();
  };
  var ticks = [];
  for (var d = 0; d < 360; d += NU_DIAL_BIG_STEP) {
    var major = d % 90 === 0;
    var _nuPoint = nuPoint(d, NU_DIAL_RADIUS + 1),
      _nuPoint2 = _slicedToArray(_nuPoint, 2),
      x1 = _nuPoint2[0],
      y1 = _nuPoint2[1],
      _nuPoint3 = nuPoint(d, NU_DIAL_RADIUS + (major ? 8 : 4)),
      _nuPoint4 = _slicedToArray(_nuPoint3, 2),
      x2 = _nuPoint4[0],
      y2 = _nuPoint4[1];
    ticks.push(/*#__PURE__*/React.createElement("line", {
      key: d,
      className: "nu-dial-tick" + (major ? " major" : ""),
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2
    }));
  }
  var _nuPoint5 = nuPoint(value, NU_DIAL_RADIUS),
    _nuPoint6 = _slicedToArray(_nuPoint5, 2),
    hx = _nuPoint6[0],
    hy = _nuPoint6[1];
  var arc = null;
  if (band) {
    var inner = NU_DIAL_RADIUS - 6;
    var _nuPoint7 = nuPoint(band[0], inner),
      _nuPoint8 = _slicedToArray(_nuPoint7, 2),
      _x = _nuPoint8[0],
      _y = _nuPoint8[1],
      _nuPoint9 = nuPoint(band[1], inner),
      _nuPoint0 = _slicedToArray(_nuPoint9, 2),
      _x2 = _nuPoint0[0],
      _y2 = _nuPoint0[1];
    arc = /*#__PURE__*/React.createElement("path", {
      className: "nu-dial-band",
      d: "M ".concat(_x, " ").concat(_y, " A ").concat(inner, " ").concat(inner, " 0 ").concat(band[1] - band[0] > 180 ? 1 : 0, " 1 ").concat(_x2, " ").concat(_y2)
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "nu-dial-wrap"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "nu-dial",
    viewBox: "-70 -70 140 140",
    role: "slider",
    tabIndex: 0,
    "aria-label": "CP phase delta",
    "aria-valuemin": 0,
    "aria-valuemax": 360,
    "aria-valuenow": value,
    "aria-valuetext": value + " degrees",
    onKeyDown: onKeyDown,
    onPointerDown: function onPointerDown(e) {
      dragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      fromPointer(e);
    },
    onPointerMove: function onPointerMove(e) {
      if (dragging.current) fromPointer(e);
    },
    onPointerUp: function onPointerUp() {
      dragging.current = false;
    },
    onPointerCancel: function onPointerCancel() {
      dragging.current = false;
    }
  }, /*#__PURE__*/React.createElement("circle", {
    className: "nu-dial-ring",
    r: NU_DIAL_RADIUS
  }), arc, ticks, /*#__PURE__*/React.createElement("text", {
    className: "nu-dial-label",
    x: "0",
    y: "-30",
    textAnchor: "middle"
  }, "0\xB0"), /*#__PURE__*/React.createElement("text", {
    className: "nu-dial-label",
    x: "30",
    y: "4",
    textAnchor: "middle"
  }, "90\xB0"), /*#__PURE__*/React.createElement("text", {
    className: "nu-dial-label",
    x: "0",
    y: "38",
    textAnchor: "middle"
  }, "180\xB0"), /*#__PURE__*/React.createElement("text", {
    className: "nu-dial-label",
    x: "-30",
    y: "4",
    textAnchor: "middle"
  }, "270\xB0"), /*#__PURE__*/React.createElement("line", {
    className: "nu-dial-hand",
    x1: "0",
    y1: "0",
    x2: hx,
    y2: hy
  }), /*#__PURE__*/React.createElement("circle", {
    className: "nu-dial-knob",
    cx: hx,
    cy: hy,
    r: "5"
  })), /*#__PURE__*/React.createElement("div", {
    className: "nu-dial-readout"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: "\\delta_{\\mathrm{CP}}"
  }), " = ", value, "\xB0"));
}
var nuPreset = function nuPreset(e) {
  return {
    id: e.id,
    L: e.baselineKm,
    rho: e.rhoGcm3,
    initial: e.initialFlavour,
    anti: e.antineutrino,
    E: e.peakEnergyGeV
  };
};
function NeutrinoLab() {
  var _experiments$find;
  var N = window.QGA_NEUTRINO;
  var experiments = N.EXPERIMENTS;
  var variant = N.NUFIT.variants[N.DEFAULT_VARIANT];
  var _useState = useState(function () {
      return nuPreset(experiments[0]);
    }),
    _useState2 = _slicedToArray(_useState, 2),
    preset = _useState2[0],
    setPreset = _useState2[1];
  var _useState3 = useState("NO"),
    _useState4 = _slicedToArray(_useState3, 2),
    ordering = _useState4[0],
    setOrdering = _useState4[1];
  var _useState5 = useState(function () {
      return Math.round(variant.NO.deltaCP.value);
    }),
    _useState6 = _slicedToArray(_useState5, 2),
    degrees = _useState6[0],
    setDegrees = _useState6[1];
  var _useState7 = useState("energy"),
    _useState8 = _slicedToArray(_useState7, 2),
    mode = _useState8[0],
    setMode = _useState8[1];
  var _useState9 = useState(0),
    _useState0 = _slicedToArray(_useState9, 2),
    channel = _useState0[0],
    setChannel = _useState0[1];
  var experiment = (_experiments$find = experiments.find(function (e) {
    return e.id === preset.id;
  })) !== null && _experiments$find !== void 0 ? _experiments$find : null;
  var fit = variant[ordering];
  var params = useMemo(function () {
    return _objectSpread(_objectSpread({}, N.defaultParams(ordering)), {}, {
      deltaCP: degrees * Math.PI / 180
    });
  }, [ordering, degrees]);
  var energyMode = mode === "energy";
  var energyRange = experiment ? experiment.energyRangeGeV : [0.1, 2 * Math.max(0.5, preset.E)];
  var range = energyMode ? energyRange : [0, NU_BASELINE_SPAN * preset.L / preset.E];
  var fixed = energyMode ? preset.L : preset.E;
  var matter = preset.rho > 0;
  var spec = useMemo(function () {
    var common = {
      initial: preset.initial,
      mode: mode,
      range: range,
      fixed: fixed,
      params: params,
      antineutrino: preset.anti
    };
    var curves = N.flavourCurves(_objectSpread(_objectSpread({}, common), {}, {
      rhoGcm3: preset.rho
    }));
    var ghost = matter ? N.flavourCurves(_objectSpread(_objectSpread({}, common), {}, {
      rhoGcm3: 0
    })) : null;
    var markX = energyMode ? preset.E : preset.L / preset.E;
    var marker = markX >= range[0] && markX <= range[1] ? {
      x: markX,
      text: experiment ? experiment.label : "design point"
    } : null;
    return window.QGA_FIGURE.plots.neutrino.flavourRibbonSpec({
      curves: curves,
      ghost: ghost,
      mode: mode,
      channel: channel,
      initial: preset.initial,
      antineutrino: preset.anti,
      matter: matter,
      marker: marker
    });
  }, [params, preset, mode, channel, range[0], range[1], fixed, matter]);
  var point = useMemo(function () {
    return N.oscillationProbabilities({
      E_GeV: preset.E,
      L_km: preset.L,
      params: params,
      rhoGcm3: preset.rho,
      antineutrino: preset.anti
    })[preset.initial];
  }, [params, preset]);
  var potential = N.matterPotentialEv({
    rhoGcm3: preset.rho
  });
  var resonance = N.resonanceEnergyGeV({
    dm31: params.dm31,
    theta13: params.theta13,
    rhoGcm3: preset.rho
  });
  var resonanceFor = params.dm31 > 0 !== preset.anti ? "neutrinos" : "antineutrinos";
  var setOrderingAndFit = function setOrderingAndFit(next) {
    setOrdering(next);
    setDegrees(Math.round(variant[next].deltaCP.value));
  };
  var band = [Math.max(0, fit.deltaCP.value - fit.deltaCP.minus), Math.min(360, fit.deltaCP.value + fit.deltaCP.plus)];
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame nu-lab"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar nu-bar",
    role: "group",
    "aria-label": "Experiment presets"
  }, experiments.map(function (e) {
    return /*#__PURE__*/React.createElement("button", {
      key: e.id,
      type: "button",
      className: "btn nu-btn" + (preset.id === e.id ? " on" : ""),
      "aria-pressed": preset.id === e.id,
      onClick: function onClick() {
        return setPreset(nuPreset(e));
      }
    }, e.label, " \xB7 ", e.baselineKm, " km");
  })), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar nu-bar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "seg",
    role: "group",
    "aria-label": "Initial flavour"
  }, NU_FLAVOUR_PLAIN.map(function (name, i) {
    return /*#__PURE__*/React.createElement("button", {
      key: name,
      type: "button",
      className: "btn nu-btn" + (preset.initial === i ? " on" : ""),
      "aria-pressed": preset.initial === i,
      "aria-label": "Born as " + name,
      onClick: function onClick() {
        return setPreset(_objectSpread(_objectSpread({}, preset), {}, {
          initial: i
        }));
      }
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: NU_FLAVOUR_TEX[i]
    }));
  })), /*#__PURE__*/React.createElement("span", {
    className: "seg",
    role: "group",
    "aria-label": "Neutrino or antineutrino"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn nu-btn" + (!preset.anti ? " on" : ""),
    "aria-pressed": !preset.anti,
    onClick: function onClick() {
      return setPreset(_objectSpread(_objectSpread({}, preset), {}, {
        anti: false
      }));
    }
  }, "\u03BD"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn nu-btn" + (preset.anti ? " on" : ""),
    "aria-pressed": preset.anti,
    onClick: function onClick() {
      return setPreset(_objectSpread(_objectSpread({}, preset), {}, {
        anti: true
      }));
    }
  }, "\u03BD\u0304")), /*#__PURE__*/React.createElement("span", {
    className: "seg",
    role: "group",
    "aria-label": "Mass ordering"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn nu-btn" + (ordering === "NO" ? " on" : ""),
    "aria-pressed": ordering === "NO",
    onClick: function onClick() {
      return setOrderingAndFit("NO");
    }
  }, "NO"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn nu-btn" + (ordering === "IO" ? " on" : ""),
    "aria-pressed": ordering === "IO",
    onClick: function onClick() {
      return setOrderingAndFit("IO");
    }
  }, "IO")), /*#__PURE__*/React.createElement("span", {
    className: "seg",
    role: "group",
    "aria-label": "Horizontal axis"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn nu-btn" + (energyMode ? " on" : ""),
    "aria-pressed": energyMode,
    onClick: function onClick() {
      return setMode("energy");
    }
  }, "E at fixed L"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn nu-btn" + (!energyMode ? " on" : ""),
    "aria-pressed": !energyMode,
    onClick: function onClick() {
      return setMode("baseline");
    }
  }, "L/E at fixed E")), /*#__PURE__*/React.createElement("span", {
    className: "seg",
    role: "group",
    "aria-label": "Highlighted flavour"
  }, NU_FLAVOUR_PLAIN.map(function (name, i) {
    return /*#__PURE__*/React.createElement("button", {
      key: name,
      type: "button",
      className: "btn nu-btn" + (channel === i ? " on" : ""),
      "aria-pressed": channel === i,
      "aria-label": "Highlight " + name,
      onClick: function onClick() {
        return setChannel(i);
      }
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: NU_FLAVOUR_TEX[i]
    }));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar nu-bar nu-controls"
  }, /*#__PURE__*/React.createElement(DeltaCpDial, {
    value: degrees,
    onChange: setDegrees,
    band: band
  }), /*#__PURE__*/React.createElement("div", {
    className: "nu-sliders"
  }, /*#__PURE__*/React.createElement(SliderRow, {
    label: "matter density",
    min: 0,
    max: 13,
    step: 0.01,
    value: preset.rho,
    onChange: function onChange(v) {
      return setPreset(_objectSpread(_objectSpread({}, preset), {}, {
        rho: v
      }));
    },
    format: function format(v) {
      return v.toFixed(2) + " g/cm³";
    }
  }), /*#__PURE__*/React.createElement(SliderRow, {
    label: "baseline L",
    min: 10,
    max: 13000,
    step: 10,
    value: preset.L,
    onChange: function onChange(v) {
      return setPreset(_objectSpread(_objectSpread({}, preset), {}, {
        id: "custom",
        L: v
      }));
    },
    format: function format(v) {
      return v + " km";
    }
  }), energyMode ? null : /*#__PURE__*/React.createElement(SliderRow, {
    label: "energy E",
    min: 0.002,
    max: 10,
    step: 0.002,
    value: preset.E,
    onChange: function onChange(v) {
      return setPreset(_objectSpread(_objectSpread({}, preset), {}, {
        id: "custom",
        E: v
      }));
    },
    format: function format(v) {
      return v.toFixed(3) + " GeV";
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn nu-btn",
    onClick: function onClick() {
      return setDegrees(Math.round(fit.deltaCP.value));
    }
  }, "\u03B4 best fit ", Math.round(fit.deltaCP.value), "\xB0"))), /*#__PURE__*/React.createElement(Figure, {
    spec: spec
  }, "Exact three-flavour oscillation, ", /*#__PURE__*/React.createElement(Eq, {
    tex: "P(\\nu_\\alpha\\to\\nu_\\beta)=|\\langle\\nu_\\beta|e^{-iHL}|\\nu_\\alpha\\rangle|^2"
  }), ", with the PMNS matrix at the ", N.NUFIT_SOURCE.release, " best fit (", variant.label, "). The arc inside the dial is the 1\u03C3 range of ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\delta_{\\mathrm{CP}}"
  }), ", which the fit itself calls indicative only. Matter is one constant density with ", /*#__PURE__*/React.createElement(Eq, {
    tex: "Y_e=0.5"
  }), "."), /*#__PURE__*/React.createElement("div", {
    className: "nu-readouts"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "at the design point"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, "P", /*#__PURE__*/React.createElement("sub", null, "e"), " ", point[0].toFixed(4), " \xB7 P", /*#__PURE__*/React.createElement("sub", null, "\u03BC"), " ", point[1].toFixed(4), " \xB7 P", /*#__PURE__*/React.createElement("sub", null, "\u03C4"), " ", point[2].toFixed(4))), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "matter potential V"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, potential === 0 ? "0 (vacuum)" : potential.toExponential(2) + " eV")), /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout-label"
  }, "1\u20133 resonance (", resonanceFor, ")"), /*#__PURE__*/React.createElement("div", {
    className: "readout-value"
  }, Number.isFinite(resonance) ? Math.abs(resonance).toFixed(1) + " GeV" : "none without matter"))), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: matter ? "sm-neutrino-flavour-matter" : "sm-neutrino-flavour-vacuum",
    status: matter ? "effective" : "established"
  }, "Source: ", N.NUFIT_SOURCE.release, ", ", N.NUFIT_SOURCE.table, ", retrieved ", N.NUFIT_SOURCE.retrieved, ". Neutrino oscillation is the laboratory-confirmed crack in the minimal Standard Model: it needs neutrino masses. The curves are probabilities for single-energy neutrinos, not event rates."), /*#__PURE__*/React.createElement("div", {
    className: "nu-cards"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Two-flavour limit",
    formulaId: "two-flavour-oscillation",
    status: "established",
    symbols: [{
      s: "\\theta",
      d: "Mixing angle of the two flavours."
    }, {
      s: "\\Delta m^2",
      d: "Difference of the squared masses of the two mass states."
    }, {
      s: "L",
      d: "Baseline: the distance from source to detector."
    }, {
      s: "E",
      d: "Neutrino energy."
    }],
    meaning: "With $\\theta_{13}=0$ and $\\Delta m^2_{21}=0$ the three-flavour result reduces to this formula, which the tests check to $10^{-9}$. The $1.267$ is $1/(4\\hbar c)$ in $\\mathrm{eV}^2$, km and GeV.",
    limits: "Vacuum, two flavours. The three-flavour calculation above is exact for three flavours and constant density."
  }), /*#__PURE__*/React.createElement(FormulaCard, {
    title: "Matter potential",
    formulaId: "matter-potential",
    status: "established",
    symbols: [{
      s: "G_F",
      d: "Fermi coupling constant of the weak interaction."
    }, {
      s: "N_e",
      d: "Electron number density, $\\rho Y_e/m_u$."
    }],
    meaning: "Electron neutrinos scatter forward on the electrons of matter and acquire this energy; antineutrinos acquire its negative. It is why neutrinos and antineutrinos oscillate differently inside the Earth.",
    limits: "Charged-current term only, constant density. Neutral-current scattering is the same for all flavours and drops out."
  })));
}