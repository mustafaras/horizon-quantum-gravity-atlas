/* Compiled from js/labs/constraint-plane.jsx by scripts/compile-jsx.mjs. Do not edit; run `npm run compile:jsx`. */
"use strict";

function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// S21 — sourced observations and constraints, with keyboard-accessible details.
function ConstraintPlane(_ref) {
  var go = _ref.go;
  var D = window.QGA_CONSTRAINTS,
    P = window.QGA_FIGURE.plots.planckConstraints;
  var _useState = useState(-10),
    _useState2 = _slicedToArray(_useState, 2),
    logLength = _useState2[0],
    setLogLength = _useState2[1];
  var _useState3 = useState('lhc'),
    _useState4 = _slicedToArray(_useState3, 2),
    selected = _useState4[0],
    setSelected = _useState4[1];
  useEffect(function () {
    return window.QGA_CONCEPT_BUS.on('planck-scale', function (_ref2) {
      var next = _ref2.logLength;
      return setLogLength(next);
    });
  }, []);
  var current = D.CONSTRAINTS.find(function (entry) {
    return entry.id === selected;
  }) || D.CONSTRAINTS[0];
  var position = P.constraintPosition(current);
  var spec = useMemo(function () {
    return P.constraintSpec({
      logLength: logLength,
      selected: selected
    });
  }, [logLength, selected]);
  var moduleMarkers = function moduleMarkers(scene) {
    return [["lhc", "sm", "SM"], ["eotwash", "gr", "GR"], ["eht", "bh", "BH"], ["fermi", "approaches", "QG"]].map(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 3),
        entryId = _ref4[0],
        view = _ref4[1],
        label = _ref4[2];
      var pos = P.constraintPosition(D.CONSTRAINTS.find(function (e) {
        return e.id === entryId;
      }));
      var x = Math.max(scene.plot.x + 22, Math.min(scene.plot.x + scene.plot.w - 22, scene.sx.map(pos.x)));
      var y = Math.max(scene.plot.y + 22, Math.min(scene.plot.y + scene.plot.h - 22, scene.sy.map(pos.y)));
      return /*#__PURE__*/React.createElement("button", {
        type: "button",
        key: view,
        className: "constraint-map-link",
        style: {
          left: x,
          top: y
        },
        "aria-label": "Open " + view + " module",
        title: "Open " + view + " module",
        onClick: function onClick(event) {
          event.stopPropagation();
          go(view);
        }
      }, /*#__PURE__*/React.createElement("span", null, label));
    });
  };
  var chooseAt = function chooseAt(x) {
    if (!Number.isFinite(x) || x <= 0) return;
    var nearest = D.CONSTRAINTS[0],
      distance = Infinity;
    var _iterator = _createForOfIteratorHelper(D.CONSTRAINTS),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var item = _step.value;
        var delta = Math.abs(Math.log10(P.constraintPosition(item).x) - Math.log10(x));
        if (delta < distance) {
          nearest = item;
          distance = delta;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    setSelected(nearest.id);
  };
  var number = function number(n) {
    return Number(n.toPrecision(4)).toExponential(3);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "constraint-plane viz-frame",
    id: "planck-constraint-plane"
  }, /*#__PURE__*/React.createElement("header", {
    className: "constraint-heading"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "constraint-kicker"
  }, "01 / THE OBSERVATIONAL FRONTIER"), /*#__PURE__*/React.createElement("h3", null, "A map of what we can test"), /*#__PURE__*/React.createElement("p", null, "From tabletop gravity to the early universe: each mark is a different question, with its own assumptions.")), /*#__PURE__*/React.createElement("div", {
    className: "constraint-void"
  }, /*#__PURE__*/React.createElement("span", null, "THE PLANCK CORNER"), /*#__PURE__*/React.createElement("strong", null, "No direct data"), /*#__PURE__*/React.createElement("small", null, "Indirect limits still reach this scale."))), /*#__PURE__*/React.createElement("div", {
    className: "constraint-layout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "constraint-chart"
  }, /*#__PURE__*/React.createElement(Figure, {
    spec: spec,
    onHover: chooseAt,
    onSelect: chooseAt,
    extra: moduleMarkers
  }, "The diagonal converts length to energy using ", /*#__PURE__*/React.createElement(Eq, {
    tex: "E=\\hbar c/L"
  }), ". A triangle at the lower edge means the true energy falls below this plot. Marks are guides, not a joint exclusion region."), /*#__PURE__*/React.createElement("div", {
    className: "constraint-crosshair"
  }, "Ladder crosshair ", /*#__PURE__*/React.createElement("strong", null, "10^", Math.round(logLength), " m"), " \xB7 move the length slider above to explore"), /*#__PURE__*/React.createElement("nav", {
    className: "constraint-links",
    "aria-label": "Explore related atlas modules"
  }, /*#__PURE__*/React.createElement("span", null, "EXPLORE"), [['sm', 'Particles'], ['gr', 'Gravity'], ['bh', 'Black holes'], ['exp', 'Experiments'], ['approaches', 'Quantum approaches']].map(function (_ref5) {
    var _ref6 = _slicedToArray(_ref5, 2),
      id = _ref6[0],
      label = _ref6[1];
    return /*#__PURE__*/React.createElement("button", {
      className: "btn",
      key: id,
      onClick: function onClick() {
        return go(id);
      }
    }, label, " \u2197");
  }))), /*#__PURE__*/React.createElement("aside", {
    className: "constraint-detail",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("span", {
    className: "constraint-kicker"
  }, "SELECTED / ", current.experiment), /*#__PURE__*/React.createElement("h4", null, current.label), /*#__PURE__*/React.createElement("p", {
    className: "constraint-value"
  }, current.bound === 'upper' ? '≤ ' : current.bound === 'lower' ? '> ' : '', number(current.lo), " ", current.scaleKind === 'length' ? 'm' : 'eV', current.bound === 'range' ? ' – ' + number(current.hi) + ' ' + (current.scaleKind === 'length' ? 'm' : 'eV') : ''), /*#__PURE__*/React.createElement("p", null, current.note), /*#__PURE__*/React.createElement("p", {
    className: "constraint-uncertainty"
  }, current.uncertainty), position.clipped && /*#__PURE__*/React.createElement("p", {
    className: "constraint-uncertainty"
  }, "On plot boundary: the actual energy or length lies outside the displayed axes."), /*#__PURE__*/React.createElement("a", {
    href: current.reference.url,
    target: "_blank",
    rel: "noreferrer"
  }, current.reference.citation, " \u2197"), (current.additionalReferences || []).map(function (ref) {
    return /*#__PURE__*/React.createElement("a", {
      key: ref.url,
      href: ref.url,
      target: "_blank",
      rel: "noreferrer"
    }, ref.citation, " \u2197");
  }))), /*#__PURE__*/React.createElement("div", {
    className: "constraint-selector",
    "aria-label": "Select an observation"
  }, D.CONSTRAINTS.map(function (entry, i) {
    return /*#__PURE__*/React.createElement("button", {
      key: entry.id,
      onClick: function onClick() {
        return setSelected(entry.id);
      },
      onMouseEnter: function onMouseEnter() {
        return setSelected(entry.id);
      },
      onFocus: function onFocus() {
        return setSelected(entry.id);
      },
      "aria-pressed": selected === entry.id,
      className: 'constraint-chip' + (selected === entry.id ? ' selected' : '')
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        background: "var(--cat-".concat(i % 8 + 1, ")")
      },
      "aria-hidden": "true"
    }), entry.label);
  })), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "planck-constraint-plane",
    status: "effective"
  }, "The markers collect published scales with different meanings. Their equivalent lengths are visualization aids; the Fermi bound, the graviton mass and inflation scale depend on stated models. The hatched corner denotes the absence of a direct Planck-energy experiment."));
}
function PlanckSpectra(_ref7) {
  var jMaxHalf = _ref7.jMaxHalf;
  var P = window.QGA_FIGURE.plots.planckConstraints;
  var area = useMemo(function () {
    return P.areaSpectrumSpec(jMaxHalf);
  }, [jMaxHalf]);
  var volume = useMemo(function () {
    return P.volumeSpectrumSpec(jMaxHalf);
  }, [jMaxHalf]);
  return /*#__PURE__*/React.createElement("div", {
    className: "planck-spectra"
  }, /*#__PURE__*/React.createElement("div", {
    className: "planck-spectra-heading"
  }, /*#__PURE__*/React.createElement("span", {
    className: "constraint-kicker"
  }, "02 / QUANTUM GEOMETRY \xB7 CONJECTURAL"), /*#__PURE__*/React.createElement("h3", null, "Discrete geometry, inside a model"), /*#__PURE__*/React.createElement("p", null, "Area belongs to a link; volume belongs to an intertwiner. Here all four links have equal spin. Repeated volume eigenvalues share a mark.")), /*#__PURE__*/React.createElement("div", {
    className: "planck-spectra-grid"
  }, /*#__PURE__*/React.createElement(Figure, {
    spec: area
  }), /*#__PURE__*/React.createElement(Figure, {
    spec: volume
  })), /*#__PURE__*/React.createElement(VizCaption, {
    provenanceId: "planck-spin-spectra",
    status: "conjectural"
  }, "We choose \u03B3 = 1 following Bianchi and Haggard\u2019s convention; it is not a measurement. The volume is the Barbieri quantum-tetrahedron operator, while the nearby 3D node sizes are an independent schematic proxy. ", /*#__PURE__*/React.createElement("a", {
    href: "https://arxiv.org/abs/1208.2228",
    target: "_blank",
    rel: "noreferrer"
  }, "Bianchi & Haggard (2012) \u2197")));
}