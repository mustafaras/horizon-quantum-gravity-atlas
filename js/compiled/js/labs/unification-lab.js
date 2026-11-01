/* Compiled from js/labs/unification-lab.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
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
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// unification-lab.jsx — do the Standard-Model gauge couplings meet? (S17)
// The calculation is js/science/gauge-running.mjs (window.QGA_GAUGE), the plots are Figure Kit figures (js/figure/plots/unification.mjs), and the
// equation under them is a Formula Core formula whose terms light the matching marks of the plot (js/figure/lens.mjs); this file holds the controls
// and the readouts.

var UG_POINTS = 400;
var UG_FADE_MS = 420; // --dur-settle
var UG_SCALE_RANGE = [2, 19];
var UG_SCALE_DEFAULT = 10;
var UG_SUSY_RANGE = [2.5, 4.5]; // log10 M_SUSY / GeV: 300 GeV to 30 TeV
var UG_COUPLINGS = [{
  tex: "\\alpha_1^{-1}",
  group: "U(1)"
}, {
  tex: "\\alpha_2^{-1}",
  group: "SU(2)"
}, {
  tex: "\\alpha_3^{-1}",
  group: "SU(3)"
}];
var ugObject = function ugObject(objectName) {
  return {
    kind: "object",
    objectName: objectName
  };
};
var UG_THIN_SPACE = " "; // units are roman with a thin space (art direction)
var ugThreshold = function ugThreshold(log10) {
  return Math.pow(10, log10) >= 1000 ? (Math.pow(10, log10) / 1000).toFixed(2) + UG_THIN_SPACE + "TeV" : Math.round(Math.pow(10, log10)) + UG_THIN_SPACE + "GeV";
};
function ugRunLayer(G, model, mSusyGeV) {
  var options = {
    model: model,
    mSusyGeV: mSusyGeV,
    points: UG_POINTS
  };
  return {
    model: model,
    twoLoop: G.runGaugeCouplings(_objectSpread(_objectSpread({}, options), {}, {
      loops: 2
    })),
    oneLoop: G.runGaugeCouplings(_objectSpread(_objectSpread({}, options), {}, {
      loops: 1
    })),
    band: G.gaugeBand(_objectSpread(_objectSpread({}, options), {}, {
      loops: 2
    }))
  };
}

/** Linear interpolation of a series on the run's log10 mu grid. */
function ugAt(log10Mu, values, x) {
  var t = (x - log10Mu[0]) / (log10Mu[log10Mu.length - 1] - log10Mu[0]);
  var f = Math.min(1, Math.max(0, t)) * (log10Mu.length - 1);
  var k = Math.min(log10Mu.length - 2, Math.floor(f));
  return values[k] + (values[k + 1] - values[k]) * (f - k);
}

/** 0 to 1 over the settle duration; under reduced motion it is the target at once. */
function useUgBlend(target, reducedMotion) {
  var _useState = useState(target),
    _useState2 = _slicedToArray(_useState, 2),
    blend = _useState2[0],
    setBlend = _useState2[1];
  var latest = useRef(target);
  latest.current = blend;
  useEffect(function () {
    if (reducedMotion) {
      setBlend(target);
      return undefined;
    }
    var from = latest.current,
      start = performance.now();
    var frame = 0,
      alive = true;
    var _tick = function tick(now) {
      if (!alive) return;
      var p = Math.min(1, (now - start) / UG_FADE_MS);
      setBlend(from + (target - from) * (1 - Math.pow(1 - p, 4)));
      if (p < 1) frame = requestAnimationFrame(_tick);
    };
    frame = requestAnimationFrame(_tick);
    return function () {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, [target, reducedMotion]);
  return blend;
}
function UgToggle(_ref) {
  var pressed = _ref.pressed,
    onToggle = _ref.onToggle,
    children = _ref.children;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn ug-btn" + (pressed ? " on" : ""),
    "aria-pressed": pressed,
    onClick: onToggle
  }, children);
}
function UgRange(_ref2) {
  var labelTex = _ref2.labelTex,
    label = _ref2.label,
    min = _ref2.min,
    max = _ref2.max,
    step = _ref2.step,
    value = _ref2.value,
    _onChange = _ref2.onChange,
    format = _ref2.format,
    disabled = _ref2.disabled;
  return /*#__PURE__*/React.createElement("div", {
    className: "ctl-row ug-range" + (disabled ? " off" : "")
  }, /*#__PURE__*/React.createElement("span", {
    className: "ctl-label"
  }, /*#__PURE__*/React.createElement(Eq, {
    tex: labelTex
  })), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: min,
    max: max,
    step: step,
    value: value,
    disabled: disabled,
    "aria-label": label,
    onChange: function onChange(e) {
      return _onChange(parseFloat(e.target.value));
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "ctl-value"
  }, format(value)));
}
function UnificationLab() {
  var G = window.QGA_GAUGE;
  var PDG = G.PDG;
  var reducedMotion = usePRM();
  var _useState3 = useState(false),
    _useState4 = _slicedToArray(_useState3, 2),
    mssm = _useState4[0],
    setMssm = _useState4[1];
  var _useState5 = useState(true),
    _useState6 = _slicedToArray(_useState5, 2),
    showOneLoop = _useState6[0],
    setShowOneLoop = _useState6[1];
  var _useState7 = useState(0),
    _useState8 = _slicedToArray(_useState7, 2),
    focus = _useState8[0],
    setFocus = _useState8[1];
  var _useState9 = useState(UG_SCALE_DEFAULT),
    _useState0 = _slicedToArray(_useState9, 2),
    selectedLog = _useState0[0],
    setSelectedLog = _useState0[1];
  var _useState1 = useState(Math.log10(G.DEFAULT_M_SUSY_GEV)),
    _useState10 = _slicedToArray(_useState1, 2),
    mSusyLog = _useState10[0],
    setMSusyLog = _useState10[1];
  var blend = useUgBlend(mssm ? 1 : 0, reducedMotion);
  var sm = useMemo(function () {
    return ugRunLayer(G, "sm");
  }, []);
  var ms = useMemo(function () {
    return ugRunLayer(G, "mssm", Math.pow(10, mSusyLog));
  }, [mSusyLog]);
  var primary = mssm ? ms : sm;
  var triangles = useMemo(function () {
    return {
      sm: G.unificationTriangle(sm.twoLoop),
      mssm: G.unificationTriangle(ms.twoLoop)
    };
  }, [sm, ms]);
  var triangle = mssm ? triangles.mssm : triangles.sm;
  var status = mssm ? "conjectural" : "effective";
  var inputs = useMemo(function () {
    return {
      log10Mz: Math.log10(PDG.MZ.value),
      values: G.inputsAtMZ(),
      sigmas: sm.band.upper.map(function (upper, i) {
        return (upper[0] - sm.band.lower[i][0]) / 2;
      })
    };
  }, [sm]);
  var couplingSpec = useMemo(function () {
    return window.QGA_FIGURE.plots.unification.couplingRunSpec({
      layers: [].concat(_toConsumableArray(blend < 1 ? [_objectSpread(_objectSpread({}, sm), {}, {
        primary: !mssm,
        opacity: 1 - blend
      })] : []), _toConsumableArray(blend > 0 ? [_objectSpread(_objectSpread({}, ms), {}, {
        primary: mssm,
        opacity: blend
      })] : [])),
      inputs: inputs,
      mSusyLog: blend > 0 ? mSusyLog : null,
      mSusyOpacity: blend,
      selectedLog: selectedLog,
      focusIndex: focus,
      showOneLoop: showOneLoop,
      status: status,
      planckLog: Math.log10(window.QGA_HIGGS.PLANCK_MASS_GEV)
    });
  }, [sm, ms, blend, mssm, mSusyLog, selectedLog, focus, showOneLoop, status, inputs]);
  var triangleSpec = useMemo(function () {
    return triangle.area === null ? null : window.QGA_FIGURE.plots.unification.triangleSpec({
      layer: primary,
      triangle: triangle,
      status: status
    });
  }, [primary, triangle, status]);
  var latest = useRef({});
  latest.current = {
    selectedLog: selectedLog,
    focus: focus
  };
  var lens = useMemo(function () {
    var name = "a".concat(focus + 1);
    return {
      sceneId: "rg-unification",
      formulaId: "gauge-running-one-loop",
      termTargets: _objectSpread({
        ainv: ugObject("twoloop:".concat(name)),
        inputs: ugObject("inputs:".concat(name)),
        ln_mu_over_MZ: ugObject("scale")
      }, showOneLoop ? {
        b_over_2pi: ugObject("oneloop:".concat(name))
      } : {}),
      live: function live() {
        return {
          env: {
            ainv0: G.inputsAtMZ()[latest.current.focus],
            b: G.B_ONE_LOOP.sm[latest.current.focus],
            mu: Math.pow(10, latest.current.selectedLog),
            MZ: PDG.MZ.value
          }
        };
      }
    };
  }, [focus, showOneLoop]); // eslint-disable-line

  var clampScale = function clampScale(x) {
    return Math.min(UG_SCALE_RANGE[1], Math.max(UG_SCALE_RANGE[0], x));
  };
  var value = function value(line, edge) {
    return ugAt(primary.twoLoop.log10Mu, edge ? edge[line] : primary.twoLoop.inv[line], selectedLog);
  };
  var areaText = function areaText(t) {
    return t.area === null ? "\\text{none}" : t.area >= 1 ? t.area.toFixed(2) : t.area.toPrecision(2);
  };
  var ratio = triangles.sm.area && triangles.mssm.area ? triangles.sm.area / triangles.mssm.area : null;
  return /*#__PURE__*/React.createElement("div", {
    className: "viz-frame ug-lab"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar ug-bar",
    role: "group",
    "aria-label": "Unification lab controls"
  }, /*#__PURE__*/React.createElement(UgToggle, {
    pressed: showOneLoop,
    onToggle: function onToggle() {
      return setShowOneLoop(!showOneLoop);
    }
  }, "one loop, dashed"), /*#__PURE__*/React.createElement(UgToggle, {
    pressed: mssm,
    onToggle: function onToggle() {
      return setMssm(!mssm);
    }
  }, "MSSM above ", /*#__PURE__*/React.createElement(Eq, {
    tex: "M_{\\mathrm{SUSY}}"
  }), " (conjectural)"), /*#__PURE__*/React.createElement("div", {
    className: "ug-focus",
    role: "group",
    "aria-label": "Coupling the formula below refers to"
  }, UG_COUPLINGS.map(function (c, i) {
    return /*#__PURE__*/React.createElement(UgToggle, {
      key: c.group,
      pressed: focus === i,
      onToggle: function onToggle() {
        return setFocus(i);
      }
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: c.tex
    }), /*#__PURE__*/React.createElement("span", {
      className: "ug-group"
    }, c.group));
  }))), /*#__PURE__*/React.createElement(Figure, {
    spec: couplingSpec,
    lens: lens,
    slider: {
      min: UG_SCALE_RANGE[0],
      max: UG_SCALE_RANGE[1],
      now: selectedLog,
      text: "log10 of the scale in gigaelectronvolts, ".concat(selectedLog.toFixed(2))
    },
    onSelect: function onSelect(x) {
      return setSelectedLog(clampScale(x));
    },
    onNudge: function onNudge(dir, big) {
      return setSelectedLog(clampScale(dir === Infinity ? UG_SCALE_RANGE[1] : dir === -Infinity ? UG_SCALE_RANGE[0] : selectedLog + dir * (big ? 1 : 0.1)));
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ug-fig-note"
  }, mssm ? "MSSM above the threshold: conjectural." : "Standard Model alone.", " Click the plot or use the arrow keys to move the scale.")), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: window.QGA_FIGURE.plots.unification.provenanceFor("rg-unification-couplings", status),
    status: status
  }, "The solid lines run ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\alpha_i^{-1}=1/\\alpha_i"
  }), " of U(1) (grand-unified normalisation), SU(2) and SU(3) from the Z mass with the two-loop equations; the dashed lines are the one-loop solution, straight in ", /*#__PURE__*/React.createElement(Eq, {
    tex: "\\ln\\mu"
  }), ". The bands are the ", /*#__PURE__*/React.createElement(Eq, {
    tex: "1\\sigma"
  }), " of the three measured inputs and nothing else. In the Standard Model the lines cross in pairs and never meet; with superpartners at ", /*#__PURE__*/React.createElement(Eq, {
    tex: "M_{\\mathrm{SUSY}}"
  }), " they nearly do. That is a numerical near-coincidence of the coefficients, not evidence for supersymmetry: no superpartner has been seen, the Yukawa terms and the thresholds are left out, and the lines are extrapolated over about 14 decades. The hatched region marks where unification is usually sought, a display convention."), /*#__PURE__*/React.createElement("div", {
    className: "viz-toolbar ug-bar ug-controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ug-sliders"
  }, /*#__PURE__*/React.createElement(UgRange, {
    labelTex: "\\log_{10}\\mu",
    label: "scale, log10 of mu in gigaelectronvolts",
    min: UG_SCALE_RANGE[0],
    max: UG_SCALE_RANGE[1],
    step: 0.01,
    value: selectedLog,
    onChange: setSelectedLog,
    format: function format(x) {
      return x.toFixed(2);
    }
  }), /*#__PURE__*/React.createElement(UgRange, {
    labelTex: "\\log_{10}M_{\\mathrm{SUSY}}",
    label: "supersymmetry threshold, log10 of M SUSY in gigaelectronvolts",
    min: UG_SUSY_RANGE[0],
    max: UG_SUSY_RANGE[1],
    step: 0.01,
    value: mSusyLog,
    onChange: setMSusyLog,
    disabled: !mssm,
    format: ugThreshold
  }))), /*#__PURE__*/React.createElement("div", {
    className: "ug-readouts",
    role: "status",
    "aria-live": "polite"
  }, UG_COUPLINGS.map(function (c, i) {
    return /*#__PURE__*/React.createElement("div", {
      className: "readout",
      key: c.group
    }, /*#__PURE__*/React.createElement("div", {
      className: "readout-label"
    }, /*#__PURE__*/React.createElement(Eq, {
      tex: c.tex.replace("}", "}(\\mu)")
    })), /*#__PURE__*/React.createElement("div", {
      className: "readout-value"
    }, value(i).toFixed(2), /*#__PURE__*/React.createElement("span", {
      className: "unit"
    }, "\xB1 ", ((value(i, primary.band.upper) - value(i, primary.band.lower)) / 2).toFixed(2), " \xB7 ", /*#__PURE__*/React.createElement(Eq, {
      tex: "\\alpha=".concat((1 / value(i)).toFixed(4))
    }))));
  })), triangleSpec ? /*#__PURE__*/React.createElement(Figure, {
    spec: triangleSpec
  }, /*#__PURE__*/React.createElement("span", {
    className: "ug-fig-note"
  }, "Magnified around the three pairwise crossings of the two-loop lines.")) : /*#__PURE__*/React.createElement("p", {
    className: "lt-note"
  }, "The three lines do not all cross inside the plotted range."), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: window.QGA_FIGURE.plots.unification.provenanceFor("rg-unification-triangle", status),
    status: status
  }, "The triangle the lines enclose, in decades times inverse coupling: a perfect unification would make it a point. Standard Model ", /*#__PURE__*/React.createElement(Eq, {
    tex: "A=".concat(areaText(triangles.sm))
  }), ", MSSM with ", /*#__PURE__*/React.createElement(Eq, {
    tex: "M_{\\mathrm{SUSY}}"
  }), " = ", ugThreshold(mSusyLog), ": ", /*#__PURE__*/React.createElement(Eq, {
    tex: "A=".concat(areaText(triangles.mssm))
  }), ratio ? /*#__PURE__*/React.createElement(React.Fragment, null, ", a factor ", /*#__PURE__*/React.createElement(Eq, {
    tex: "".concat(Math.round(ratio))
  }), " smaller") : null, ". The MSSM area moves by orders of magnitude with the threshold and passes through a minimum near 2 TeV, so how small it gets says more about the omitted thresholds and Yukawa terms than about the couplings."), /*#__PURE__*/React.createElement("div", {
    className: "ug-cards"
  }, /*#__PURE__*/React.createElement(FormulaCard, {
    title: "One-loop running of a gauge coupling",
    formulaId: "gauge-running-one-loop",
    status: "effective",
    symbols: [{
      s: "\\alpha_i^{-1}(M_Z)",
      d: "Inverse coupling at the Z mass, from the measured $\\alpha_{\\mathrm{em}}$, $\\sin^2\\theta_W$ and $\\alpha_s$. Hover or focus this term to mark the input and its error bar in the plot."
    }, {
      s: "b_i",
      d: "One-loop coefficient: $(41/10,\\,-19/6,\\,-7)$ in the Standard Model. It is the slope of the dashed line in $\\ln\\mu$, times $-2\\pi$."
    }, {
      s: "\\ln(\\mu/M_Z)",
      d: "How far the scale has run, the position of the vertical rule in the plot."
    }],
    meaning: "Each inverse coupling is a straight line in the logarithm of the scale; only the sign of its slope differs: SU(2) and SU(3) are asymptotically free, so their inverse couplings grow, while U(1) is not and its inverse coupling falls. Focus a term to light its mark in the plot and read its value for the coupling chosen above.",
    limits: "One loop and Standard Model coefficients, from $M_Z$: in the MSSM view the card still evaluates the Standard-Model line, valid up to $M_{\\mathrm{SUSY}}$. Two loops move the lines by a few tenths up to a few units at the Planck mass; the plot draws both."
  })));
}
window.UnificationLab = UnificationLab;